from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
from models import db, Family, GrowthRecord, VitalsReading, SleepSession, Medicine, FoodSchedule, EmergencyContact, EmotionRecord
from config import Config
from datetime import datetime, timedelta, timezone

# Try to import emotion detector; fallback to None if dependencies missing
try:
    from analyzers.emotion_ai_fixed import emotion_detector
    print("✅ Emotion AI loaded")
except Exception as e:
    print(f"⚠️ Emotion AI disabled ({e}) - using frontend local analysis")
    emotion_detector = None
from analyzers.health_analyzer import analyze_vitals, analyze_sleep, calculate_bmi, get_bmi_recommendations
from audio_engine import generate_all_lullabies

import hashlib
import base64
import json
import os
from typing import Dict
from werkzeug.utils import secure_filename

try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, supports_credentials=True)

# Initialize DB
db.init_app(app)
with app.app_context():
    db.create_all()
    # Generate lullabies on startup
    try:
        generate_all_lullabies()
    except Exception as e:
        print(f"Warning: Could not generate lullabies: {e}")

def get_family_id():
    """Get current family from session"""
    return session.get('family_id')

def _sleep_quality(total_hours):
    """Return sleep quality grade based on total hours"""
    if total_hours >= 10:
        return 'Great'
    elif total_hours >= 7:
        return 'Good'
    elif total_hours >= 5:
        return 'Fair'
    else:
        return 'Low'

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'Smart Childcare Backend v2.0 - Fullstack Ready',
        'database': 'Connected ✅',
        'endpoints': 28,
        'timestamp': datetime.now(timezone.utc).isoformat()
    })

@app.route('/api/register', methods=['POST'])
def register_family():
    data = request.json
    if not data.get('child_name') or not data.get('mob1'):
        return jsonify({'error': 'Child name and mobile required'}), 400
    
    # Create unique family_hash
    hash_input = f"{data['mob1']}{data['child_name']}".encode()
    family_hash = hashlib.md5(hash_input).hexdigest()[:8]
    
    # Check if exists
    family = Family.query.filter_by(family_hash=family_hash).first()
    if not family:
        family = Family(
            family_hash=family_hash,
            father_name=data.get('father_name', ''),
            mother_name=data.get('mother_name', ''),
            child_name=data['child_name'],
            child_age_months=data.get('child_age_months'),
            child_gender=data.get('child_gender'),
            child_health_issues=data.get('child_health_issues'),
            child_blood_group=data.get('child_blood_group'),
            child_doctor=data.get('child_doctor'),
            child_photo_b64=data.get('child_photo_b64'),
            mob1=data['mob1'],
            mob2=data.get('mob2', '')
        )
        db.session.add(family)
        db.session.commit()
    
    session['family_id'] = family.id
    return jsonify({
        'success': True,
        'family_id': family.id,
        'family_hash': family.family_hash,
        'message': 'Family registered/loaded successfully'
    })

@app.route('/api/child', methods=['GET', 'POST'])
def child_profile():
    fid = get_family_id()
    if not fid:
        return jsonify({'error': 'Login required'}), 401
    
    family = Family.query.get(fid)
    if not family:
        return jsonify({'error': 'Family not found'}), 404
    
    if request.method == 'POST':
        data = request.json
        for key, value in data.items():
            if hasattr(family, key) and value is not None:
                setattr(family, key, value)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Profile updated'})
    
    return jsonify({
        'success': True,
        'data': {
            'child_name': family.child_name,
            'child_age_months': family.child_age_months,
            'child_gender': family.child_gender,
            'child_health_issues': family.child_health_issues,
            'child_doctor': family.child_doctor,
            'mob1': family.mob1,
            'mob2': family.mob2
        }
    })

@app.route('/api/growth', methods=['POST'])
def add_growth():
    fid = get_family_id()
    if not fid: return jsonify({'error': 'Login required'}), 401
    
    data = request.json
    record = GrowthRecord(
        family_id=fid,
        measurement_date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        weight_kg=data.get('weight'),
        height_cm=data.get('height'),
        head_circumference_cm=data.get('head_circ'),
        notes=data.get('notes')
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({'success': True, 'id': record.id})

@app.route('/api/growth/history', methods=['GET'])
def growth_history():
    fid = get_family_id()
    if not fid: return jsonify({'error': 'Login required'}), 401
    
    records = GrowthRecord.query.filter_by(family_id=fid).order_by(GrowthRecord.measurement_date.desc()).limit(20).all()
    return jsonify({
        'success': True,
        'records': [{'date': r.measurement_date.isoformat(), 'weight': r.weight_kg, 'height': r.height_cm, 'head_circ': r.head_circumference_cm, 'bmi': r.bmi, 'bmi_pct': r.bmi_percentile} for r in records]
    })

@app.route('/api/growth/bmi', methods=['POST'])
def calculate_bmi():
    fid = get_family_id()
    if not fid: return jsonify({'error': 'Login required'}), 401
    
    data = request.json
    weight = data.get('weight')
    height = data.get('height')
    age_months = data.get('age_months', 6)
    lang = data.get('lang', 'en')
    
    if not weight or not height:
        return jsonify({'error': 'Weight and height required'}), 400
    
    from analyzers.health_analyzer import calculate_bmi, get_bmi_recommendations
    
    bmi_val = calculate_bmi(float(weight), float(height))
    recs = get_bmi_recommendations(bmi_val, age_months, lang)
    
    # Save record
    record = GrowthRecord(
        family_id=fid,
        measurement_date=datetime.now().date(),
        weight_kg=float(weight),
        height_cm=float(height),
        bmi=bmi_val,
        bmi_percentile=recs.get('percentile_estimate'),
        notes=recs.get('message', '')
    )
    db.session.add(record)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'bmi': bmi_val,
        'category': recs.get('category'),
        'message': recs.get('message'),
        'food_recommendations': recs.get('food_recommendations', []),
        'urgent': recs.get('urgent', False),
        'record_id': record.id
    })

@app.route('/api/vitals', methods=['POST'])
def log_vitals():
    fid = get_family_id()
    if not fid: return jsonify({'error': 'Login required'}), 401
    
    data = request.json
    reading = VitalsReading(
        family_id=fid,
        bpm=data.get('bpm'),
        temperature_f=data.get('temp'),
        measurement_mode=data.get('mode', 'manual'),
        finger_quality_pct=data.get('quality')
    )
    db.session.add(reading)
    db.session.commit()
    
    # Personalised analysis
    age_months = Family.query.get(fid).child_age_months or 6
    analysis = analyze_vitals(reading.bpm, reading.temperature_f, age_months)
    
    return jsonify({
        'success': True,
        'id': reading.id,
        'analysis': analysis
    })

@app.route('/api/vitals/history', methods=['GET'])
def vitals_history():
    fid = get_family_id()
    if not fid: return jsonify({'error': 'Login required'}), 401
    
    readings = VitalsReading.query.filter_by(family_id=fid).order_by(VitalsReading.timestamp.desc()).limit(50).all()
    return jsonify({
        'success': True,
        'recent': len(readings),
        'records': [{'timestamp': r.timestamp.isoformat(), 'bpm': r.bpm, 'temp': r.temperature_f, 'mode': r.measurement_mode} for r in readings]
    })

@app.route('/api/sleep/start', methods=['POST'])
def sleep_start():
    fid = get_family_id()
    if not fid: return jsonify({'error': 'Login required'}), 401
    
    session['sleep_start'] = datetime.now(timezone.utc).isoformat()
    return jsonify({'success': True, 'start_time': session['sleep_start']})

@app.route('/api/sleep/end', methods=['POST'])
def sleep_end():
    fid = get_family_id()
    if not fid: return jsonify({'error': 'Login required'}), 401
    
    start_str = session.get('sleep_start')
    if not start_str:
        return jsonify({'error': 'No active sleep session'}), 400
    
    start_time = datetime.fromisoformat(start_str)
    end_time = datetime.utcnow()
    total_hours = (end_time - start_time).total_seconds() / 3600
    
    sleep_session = SleepSession(
        family_id=fid,
        start_time=start_time,
        end_time=end_time,
        total_hours=total_hours,
        quality_grade=_sleep_quality(total_hours)
    )
    db.session.add(sleep_session)
    db.session.commit()
    session.pop('sleep_start', None)
    
    return jsonify({
        'success': True,
        'total_hours': round(total_hours, 1),
        'quality': sleep_session.quality_grade
    })

@app.route('/api/medicines', methods=['POST', 'GET'])
def medicines():
    fid = get_family_id()
    if not fid: return jsonify({'error': 'Login required'}), 401
    
    if request.method == 'POST':
        data = request.json
        med = Medicine(
            family_id=fid,
            health_issue=data['issue'],
            medicine_name=data['medicine'],
            dosage=data.get('dose'),
            time_hhmm=data.get('time'),
            frequency=data['frequency'],
            notify_mob1=data.get('mob1'),
            notify_mob2=data.get('mob2')
        )
        db.session.add(med)
        db.session.commit()
        return jsonify({'success': True, 'id': med.id})
    
    # GET active medicines
    now = datetime.utcnow()
    active = Medicine.query.filter_by(family_id=fid, is_active=True).order_by(Medicine.time_hhmm).all()
    return jsonify({
        'success': True,
        'active': len(active),
        'medicines': [{'id': m.id, 'issue': m.health_issue, 'medicine': m.medicine_name, 'time': m.time_hhmm} for m in active]
    })

@app.route('/api/food/schedule', methods=['POST', 'GET'])
def food_schedule():
    fid = get_family_id()
    if not fid: return jsonify({'error': 'Login required'}), 401
    
    if request.method == 'POST':
        data = request.json
        schedule = FoodSchedule.query.filter_by(family_id=fid).first()
        
        if schedule:
            # Update existing schedule
            schedule.breakfast_time = data.get('breakfast_time')
            schedule.lunch_time = data.get('lunch_time')
            schedule.snacks_time = data.get('snacks_time')
            schedule.dinner_time = data.get('dinner_time')
            schedule.night_feed_time = data.get('night_feed_time')
            schedule.notify_mob1 = data.get('notify_mob1')
            schedule.notify_mob2 = data.get('notify_mob2')
        else:
            # Create new schedule
            schedule = FoodSchedule(
                family_id=fid,
                breakfast_time=data.get('breakfast_time'),
                lunch_time=data.get('lunch_time'),
                snacks_time=data.get('snacks_time'),
                dinner_time=data.get('dinner_time'),
                night_feed_time=data.get('night_feed_time'),
                notify_mob1=data.get('notify_mob1'),
                notify_mob2=data.get('notify_mob2')
            )
        db.session.add(schedule)
        db.session.commit()
        return jsonify({'success': True})
    
    # GET schedule
    schedule = FoodSchedule.query.filter_by(family_id=fid).first()
    if schedule:
        return jsonify({
            'success': True,
            'schedule': {
                'breakfast_time': schedule.breakfast_time,
                'lunch_time': schedule.lunch_time,
                'snacks_time': schedule.snacks_time,
                'dinner_time': schedule.dinner_time,
                'night_feed_time': schedule.night_feed_time,
                'notify_mob1': schedule.notify_mob1,
                'notify_mob2': schedule.notify_mob2
            }
        })
    return jsonify({'success': True, 'schedule': {}})

@app.route('/api/emergency', methods=['POST', 'GET'])
def emergency_contacts():
    fid = get_family_id()
    if not fid: return jsonify({'error': 'Login required'}), 401
    
    if request.method == 'POST':
        data = request.json
        contact = EmergencyContact.query.filter_by(family_id=fid).first()
        
        if contact:
            # Update existing contact
            contact.contact1 = data.get('contact1')
            contact.contact2 = data.get('contact2')
            contact.doctor_phone = data.get('doctor')
            contact.neighbour_phone = data.get('neighbour')
        else:
            # Create new contact
            contact = EmergencyContact(
                family_id=fid,
                contact1=data.get('contact1'),
                contact2=data.get('contact2'),
                doctor_phone=data.get('doctor'),
                neighbour_phone=data.get('neighbour')
            )
        db.session.add(contact)
        db.session.commit()
        return jsonify({'success': True})
    
    # GET contacts
    contact = EmergencyContact.query.filter_by(family_id=fid).first()
    if contact:
        return jsonify({
            'success': True,
            'contacts': {
                'contact1': contact.contact1,
                'contact2': contact.contact2,
                'doctor': contact.doctor_phone,
                'neighbour': contact.neighbour_phone
            }
        })
    return jsonify({'success': True, 'contacts': {}})

@app.route('/api/notifications/poll', methods=['GET'])
def poll_notifications():
    fid = get_family_id()
    if not fid: return jsonify({'error': 'Login required'}), 401
    
    now = datetime.utcnow()
    now_minutes = now.hour * 60 + now.minute
    
    reminders = []
    
    # Check medicines
    meds = Medicine.query.filter_by(family_id=fid, is_active=True).all()
    for med in meds:
        if med.time_hhmm:
            med_min = int(med.time_hhmm.split(':')[0]) * 60 + int(med.time_hhmm.split(':')[1])
            diff = med_min - now_minutes
            if -5 <= diff <= 15:  # Within 15min window
                reminders.append({
                    'type': 'medicine',
                    'title': f"💊 {med.medicine_name}",
                    'message': f"{med.health_issue}: {med.dosage} at {med.time_hhmm}",
                    'minutes': diff,
                    'urgent': diff <= 5
                })
    
    return jsonify({
        'success': True,
        'reminders': reminders,
        'count': len(reminders)
    })

@app.route('/api/analytics/emotion/<emotion>', methods=['GET'])
def emotion_analysis(emotion):
    fid = get_family_id()
    if not fid: return jsonify({'error': 'Login required'}), 401
    
    family = Family.query.get(fid)

    # Simple emotion analysis stub (extend analyzers later)
    base_analysis = {
        'emotion': emotion.capitalize(),
        'analysis': f'{emotion.capitalize()} baby detected. Monitor feeding, comfort, temperature.',
        'checklist': ['Check basic needs (feed/nappy/temp)', 'Hold and comfort baby', 'Monitor for 30 mins', 'Note patterns in diary'],
        'tip': 'Basic needs check first: feed, nappy, temp, hold close.',
        'urgent': emotion.lower() in ['cry', 'crying', 'angry']
    }

    
    # Personalize with family context
    base_analysis['personalized'] = {
        'child_age': family.child_age_months,
        'health_context': family.child_health_issues or 'No known issues',
        'recent_vitals': VitalsReading.query.filter_by(family_id=fid).order_by(VitalsReading.timestamp.desc()).limit(3).count()
    }
    
    return jsonify(base_analysis)

# ============================================================
# EMOTIONS API + QUESTIONNAIRE
# ============================================================
@app.route('/api/emotions/questionnaire', methods=['POST'])
def process_questionnaire():
    """Process emotion photo + parent questionnaire → full AI analysis"""
    try:
        data = request.get_json()
        b64_image = data.get('image')
        questionnaire = data.get('questionnaire', {})
        
        if not b64_image:
            return jsonify({'success': False, 'error': 'Image required'}), 400
        
        # 1. AI Photo Analysis
        fid = get_family_id()
        ai_result = emotion_detector.detect_emotion_and_pulse(b64_image, family_id=fid)
        
        if not ai_result.get('has_face'):
            return jsonify({
                'success': False,
                'emotion': 'no_face_detected',
                'message': 'No face detected in photo. Please try a clearer image.'
            }), 400
        
        # 2. Integrate questionnaire context
        context = {
            'emotion': ai_result['emotion'],
            'confidence': ai_result['confidence'],
            'pulse_bpm': ai_result.get('pulse_bpm'),
            'temperature_f': ai_result.get('temperature_f'),
            'questionnaire': questionnaire,
            'family_context': {
                'child_age_months': Family.query.get(fid).child_age_months if fid else None,
                'health_issues': Family.query.get(fid).child_health_issues if fid else None
            } if fid else {}
        }
        
        # 3. Generate personalized recommendations
        recommendations = generate_questionnaire_analysis(context)
        
        # 4. Save combined result
        emotion_record = EmotionRecord(
            family_id=fid,
            emotion=context['emotion'],
            answers=json.dumps(questionnaire),
            recommendations=json.dumps(recommendations)
        )
        db.session.add(emotion_record)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'record_id': emotion_record.id,
            'emotion': context['emotion'],
            'confidence': context['confidence'],
            'ai_analysis': recommendations['analysis'],
            'activities': recommendations['activities'],
            'possible_causes': recommendations['possible_causes'],
            'urgent': recommendations['urgent'],
            'suggested_questions': recommendations['questions'],
            'pulse_bpm': context['pulse_bpm'],
            'temperature_f': context['temperature_f']
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def generate_questionnaire_analysis(context: Dict) -> Dict:
    """Generate contextual analysis combining AI + parent input"""
    emotion = context['emotion']
    questionnaire = context['questionnaire']
    pulse = context.get('pulse_bpm')
    temp_f = context.get('temperature_f')

    analysis_parts = [f"AI detected {emotion} emotion"]
    activities = []
    causes = []
    urgent = False
    questions = []

    # Base emotion rules + questionnaire overrides
    emotion_rules = {
        'happy': {'activities': ['Continue bonding activities', 'Record happy moments'], 'causes': ['Well-fed', 'Comfortable']},
        'sad': {'activities': ['Check feeding', 'Change nappy', 'Cuddle time'], 'causes': ['Hunger', 'Wet nappy'], 'questions': ['Last feed time?', 'Nappy wet?']},
        'angry': {'activities': ['Quiet environment', 'Gas relief massage', 'Lullaby'], 'causes': ['Gas/colic', 'Overstimulation'], 'urgent': True},
        'crying': {'activities': ['HALT check (Hungry/ Angry/ Lonely/ Tired)', 'Skin-to-skin'], 'causes': ['Basic needs unmet'], 'urgent': True},
        'sleepy': {'activities': ['Dim lights', 'Swaddle', 'White noise'], 'causes': ['Sleep window']},
        'fear': {'activities': ['Comfort hold', 'Familiar routine/toys'], 'urgent': True},
        'neutral': {'activities': ['Monitor and observe', 'Check basic needs'], 'causes': ['Unclear emotion', 'Monitor for changes']}
    }

    rule = emotion_rules.get(emotion.lower(), emotion_rules['neutral'])
    analysis_parts.extend(['Recommended: ' + ', '.join(rule['activities'][:2])])
    activities = list(rule.get('activities', []))
    causes = list(rule.get('causes', []))

    # Questionnaire integration
    if questionnaire.get('feed') == '3h':
        analysis_parts[0] += ' + long time since last feed'
        activities.insert(0, '🍼 PRIORITY: Feed baby immediately')
        causes.insert(0, 'Likely hungry')
    if questionnaire.get('med') == 'overdue':
        analysis_parts[0] += ' + medicine overdue'
        activities.insert(0, '💊 Give overdue medicine NOW')
        urgent = True
    if questionnaire.get('temp') and float(questionnaire['temp']) > 100.4:
        analysis_parts[0] += ' + FEVER reported'
        urgent = True
        activities.insert(0, '🌡️ Fever confirmed - paracetamol + doctor')
    if questionnaire.get('symptoms') and questionnaire['symptoms'][0] != 'none':
        analysis_parts.append('Parent reports symptoms: ' + ', '.join(questionnaire['symptoms']))
        causes.append('Parent-observed: ' + ', '.join(questionnaire['symptoms']))

    # Vitals integration
    if pulse:
        if pulse < 100:
            analysis_parts.append('Low pulse - keep warm')
            causes.append('Possible low perfusion')
        elif pulse > 160:
            analysis_parts.append('High pulse - rest needed')
            urgent = True
    if temp_f and temp_f > 100.4:
        analysis_parts.append('FEVER DETECTED - urgent medical attention')
        urgent = True

    return {
        'analysis': '. '.join(analysis_parts),
        'activities': activities[:6],
        'possible_causes': causes[:4],
        'urgent': urgent,
        'questions': rule.get('questions', [])
    }

@app.route('/api/emotions', methods=['POST'])
def save_emotion():

    fid = get_family_id()
    if not fid:
        return jsonify({'error': 'Login required'}), 401
    
    data = request.json
    emotion = EmotionRecord(
        family_id=fid,
        emotion=data.get('emotion'),
        answers=json.dumps(data.get('answers', [])),
        recommendations=json.dumps(data.get('recommendations', []))
    )
    db.session.add(emotion)
    db.session.commit()
    
    return jsonify({'success': True, 'id': emotion.id, 'timestamp': emotion.timestamp.isoformat()})

@app.route('/api/emotions/history', methods=['GET'])
def emotion_history():
    fid = get_family_id()
    if not fid:
        return jsonify({'error': 'Login required'}), 401
    
    records = EmotionRecord.query.filter_by(family_id=fid).order_by(EmotionRecord.timestamp.desc()).limit(30).all()
    return jsonify({
        'success': True,
        'records': [
            {
                'emotion': r.emotion,
                'timestamp': r.timestamp.isoformat(),
                'answers': json.loads(r.answers) if r.answers else [],
                'recommendations': json.loads(r.recommendations) if r.recommendations else []
            } for r in records
        ]
    })

# ============================================================
# SLEEP API
# ============================================================
@app.route('/api/sleep', methods=['POST'])
def save_sleep():
    fid = get_family_id()
    if not fid:
        return jsonify({'error': 'Login required'}), 401
    
    data = request.json
    session_record = SleepSession(
        family_id=fid,
        start_time=datetime.fromisoformat(data['start_time']),
        end_time=datetime.fromisoformat(data['end_time']),
        total_hours=data.get('total_hours'),
        quality_grade=data.get('quality_grade', 'Fair')
    )
    db.session.add(session_record)
    db.session.commit()
    
    return jsonify({'success': True, 'id': session_record.id, 'timestamp': session_record.start_time.isoformat()})

@app.route('/api/sleep/history', methods=['GET'])
def sleep_history():
    fid = get_family_id()
    if not fid:
        return jsonify({'error': 'Login required'}), 401
    
    records = SleepSession.query.filter_by(family_id=fid).order_by(SleepSession.start_time.desc()).limit(30).all()
    return jsonify({
        'success': True,
        'records': [
            {
                'start': r.start_time.isoformat(),
                'end': r.end_time.isoformat() if r.end_time else None,
                'hours': r.total_hours,
                'quality': r.quality_grade
            } for r in records
        ]
    })

# ============================================================
# LULLABIES API
# ============================================================
@app.route('/api/lullabies', methods=['GET'])
def get_lullabies():
    lullabies = [
        {"id": 1, "title": "Brahms' Lullaby", "emoji": "🌙", "mood": "Dreamy", "url": "/static/lullabies/brahms.wav"},
        {"id": 2, "title": "Twinkle Twinkle", "emoji": "⭐", "mood": "Gentle", "url": "/static/lullabies/twinkle.wav"},
        {"id": 3, "title": "Rock-a-Bye Baby", "emoji": "🌿", "mood": "Soothing", "url": "/static/lullabies/rock.wav"},
        {"id": 4, "title": "Hush Little Baby", "emoji": "🤫", "mood": "Warm", "url": "/static/lullabies/hush.wav"},
        {"id": 5, "title": "You Are My Sunshine", "emoji": "☀️", "mood": "Cheerful", "url": "/static/lullabies/sunshine.wav"},
        {"id": 6, "title": "Sleep Baby Sleep", "emoji": "😴", "mood": "Deep Calm", "url": "/static/lullabies/sleep.wav"},
        {"id": 7, "title": "Moonlight Lullaby", "emoji": "🌕", "mood": "Serene", "url": "/static/lullabies/moonlight.wav"},
        {"id": 8, "title": "Sweet Dreams Melody", "emoji": "✨", "mood": "Peaceful", "url": "/static/lullabies/dreams.wav"},
        {"id": 9, "title": "Cloud Lullaby", "emoji": "☁️", "mood": "Airy", "url": "/static/lullabies/cloud.wav"},
        {"id": 10, "title": "Starry Night Song", "emoji": "🌌", "mood": "Mystical", "url": "/static/lullabies/stars.wav"},
    ]
    return jsonify({'success': True, 'lullabies': lullabies})

# ============================================================
# PULSE & EMOTION SCAN API (NEW AI VERSION)
# ============================================================

@app.route('/api/detect-emotion', methods=['POST'])
def detect_emotion():
    """AI Emotion detection from image upload (PUBLIC - no auth required)"""
    
    try:
        data = request.get_json()
        b64_image = data.get('image')
        
        if not b64_image:
            return jsonify({'success': False, 'error': 'No image data received'}), 400
        
        # AI Analysis using emotion_detector
        if emotion_detector is None:
            return jsonify({
                'success': True,
                'emotion': 'Neutral',
                'confidence': 0,
                'has_face': False,
                'error': 'Emotion AI not available - using frontend local analysis'
            })
        
        try:
            print(f"Analyzing image... Image length: {len(b64_image)} chars")
            result = emotion_detector.analyze_image(b64_image)
            print(f"Result: emotion={result.get('emotion')}, has_face={result.get('has_face')}, confidence={result.get('confidence')}")
        except Exception as ai_err:
            print(f"AI Detector error: {str(ai_err)}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': True,
                'emotion': 'Neutral',
                'confidence': 0,
                'has_face': False,
                'error': f'Could not analyze face: {str(ai_err)}'
            })
        
        # Map AI emotion to app emotions
        emotion_mapping = {
            'happy': 'Happy',
            'sad': 'Sad',
            'fear': 'Suffocated',
            'surprise': 'Suffocated',
            'angry': 'Cry',
            'disgust': 'Cry',
            'contempt': 'Cry',
            'neutral': 'Sad'
        }
        
        ai_emotion = result.get('emotion', 'neutral').lower()
        app_emotion = emotion_mapping.get(ai_emotion, 'Sad')
        
        return jsonify({
            'success': True,
            'emotion': app_emotion,
            'ai_emotion': ai_emotion,
            'confidence': result.get('confidence', 0),
            'emotion_scores': result.get('emotion_scores', {}),
            'has_face': result.get('has_face', False),
            'bpm': result.get('bpm'),
            'pulse_quality': result.get('pulse_quality'),
            'message': f'✅ Face Detected: {app_emotion} Emotion (Confidence: {result.get("confidence", 0):.1f}%)'
        })
    except Exception as e:
        print(f"❌ Emotion detection error: {str(e)}")
        return jsonify({
            'success': True,
            'emotion': 'Sad',
            'confidence': 0,
            'has_face': False,
            'error': str(e)
        })



@app.route('/api/pulse/calculate', methods=['POST'])
def pulse_calculate():
    """NEW: Server-side rPPG pulse calculation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Check if frames (temporal rPPG) or single image
        if 'frames' in data and isinstance(data['frames'], list):
            # Temporal rPPG with multiple frames
            frames_b64 = data['frames']
            duration_sec = data.get('duration', 30.0)
            
            from analyzers.health_analyzer import temporal_rppg
            pulse_result_obj = temporal_rppg(frames_b64, duration_sec)
            
            pulse_result = {
                'bpm': pulse_result_obj.bpm,
                'quality': pulse_result_obj.quality,
                'message': pulse_result_obj.message
            }
        elif 'image' in data:
            # Single frame rPPG
            b64_image = data['image']
            
            from analyzers.health_analyzer import calculate_pulse_from_image
            pulse_result = calculate_pulse_from_image(b64_image)
        else:
            return jsonify({'success': False, 'error': 'Missing image or frames data'}), 400
        
        # Save to database (optional family_id)
        fid = get_family_id()
        if fid and pulse_result.get('bpm'):
            reading = VitalsReading(
                family_id=fid,
                bpm=pulse_result['bpm'],
                temperature_f=None,  # rPPG doesn't measure temp
                measurement_mode='rppg_server',
                finger_quality_pct=pulse_result.get('quality', 0) * 100
            )
            db.session.add(reading)
            db.session.commit()
            pulse_result['record_id'] = reading.id
        
        pulse_result['success'] = True
        return jsonify(pulse_result)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'bpm': None, 
            'quality': 0.0, 
            'message': f'Processing error: {str(e)[:100]}'
        }), 500


@app.route('/api/pulse/history', methods=['GET'])
def pulse_history():
    fid = get_family_id()
    if not fid:
        return jsonify({'error': 'Login required'}), 401
    
    records = VitalsReading.query.filter_by(family_id=fid).order_by(VitalsReading.timestamp.desc()).limit(20).all()
    return jsonify({
        'success': True,
        'records': [
            {
                'bpm': r.bpm,
                'temperature_f': r.temperature_f,
                'mode': r.measurement_mode,
                'timestamp': r.timestamp.isoformat()
            } for r in records
        ]
    })


# ============================================================
# SMS NOTIFICATIONS
# ============================================================
def send_sms(phone_number, message):
    """Send SMS via Twilio or fallback to Textbelt (free 1/day)"""
    if TWILIO_AVAILABLE and app.config['TWILIO_ACCOUNT_SID'] and app.config['TWILIO_ACCOUNT_SID'] != 'your_account_sid_here':
        # Use Twilio if configured
        try:
            client = Client(app.config['TWILIO_ACCOUNT_SID'], app.config['TWILIO_AUTH_TOKEN'])
            msg = client.messages.create(
                body=message,
                from_=app.config['TWILIO_PHONE_NUMBER'],
                to=phone_number
            )
            print(f"✅ SMS sent to {phone_number}: {msg.sid}")
            return {'success': True, 'mode': 'twilio', 'sid': msg.sid}
        except Exception as e:
            print(f"❌ Twilio SMS error to {phone_number}: {e}")
            # Fallback to Textbelt
            return send_sms_textbelt(phone_number, message)
    else:
        # Use Textbelt free SMS
        return send_sms_textbelt(phone_number, message)

def send_sms_textbelt(phone_number, message):
    """Send SMS via Textbelt (1 free per day)"""
    try:
        import requests
        # Textbelt API - 1 free SMS per day
        response = requests.post('https://textbelt.com/text', {
            'phone': phone_number,
            'message': message,
            'key': 'textbelt'  # Free key
        })
        data = response.json()
        if data.get('success'):
            print(f"✅ Textbelt SMS sent to {phone_number}: {data.get('textId')}")
            return {'success': True, 'mode': 'textbelt', 'id': data.get('textId')}
        else:
            print(f"❌ Textbelt SMS error to {phone_number}: {data.get('error')}")
            return {'success': False, 'error': data.get('error'), 'mode': 'textbelt'}
    except Exception as e:
        print(f"❌ Textbelt error to {phone_number}: {e}")
        return {'success': False, 'error': str(e), 'mode': 'textbelt'}

# ═════════════════════════════════════════════════════════════════
# SERVE FRONTEND
# ═════════════════════════════════════════════════════════════════
@app.route('/')
def serve_index():
    """Serve the main index.html file"""
    return send_file('index.html', mimetype='text/html')

@app.route('/index.html')
def serve_index_html():
    """Fallback for explicit index.html requests"""
    return send_file('index.html', mimetype='text/html')

@app.route('/new-pages.js')
def serve_new_pages():
    """Serve the frontend helper JavaScript file"""
    return send_file('new-pages.js', mimetype='application/javascript')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)


