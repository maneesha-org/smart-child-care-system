from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash
import base64

db = SQLAlchemy()

class Family(db.Model):
    __tablename__ = 'families'
    
    id = db.Column(db.Integer, primary_key=True)
    family_hash = db.Column(db.String(32), unique=True, index=True)  # MD5 of mob1+child_name
    father_name = db.Column(db.String(100))
    mother_name = db.Column(db.String(100))
    child_name = db.Column(db.String(100), nullable=False)
    child_age_months = db.Column(db.Integer)
    child_gender = db.Column(db.String(20))
    child_health_issues = db.Column(db.Text)
    child_blood_group = db.Column(db.String(10))
    child_doctor = db.Column(db.String(100))
    child_photo_b64 = db.Column(db.Text)  # base64 image
    mob1 = db.Column(db.String(20))
    mob2 = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    growth_records = db.relationship('GrowthRecord', backref='family', lazy=True)
    vitals_readings = db.relationship('VitalsReading', backref='family', lazy=True)
    sleep_sessions = db.relationship('SleepSession', backref='family', lazy=True)
    medicines = db.relationship('Medicine', backref='family', lazy=True)
    emergency = db.relationship('EmergencyContact', backref='family', uselist=False)
    food_schedule = db.relationship('FoodSchedule', backref='family', uselist=False)

class GrowthRecord(db.Model):
    __tablename__ = 'growth_records'
    id = db.Column(db.Integer, primary_key=True)
    family_id = db.Column(db.Integer, db.ForeignKey('families.id'), nullable=False)
    measurement_date = db.Column(db.Date, nullable=False)
    weight_kg = db.Column(db.Float)
    height_cm = db.Column(db.Float) 
    head_circumference_cm = db.Column(db.Float)
    bmi = db.Column(db.Float)
    bmi_percentile = db.Column(db.Float)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class VitalsReading(db.Model):
    __tablename__ = 'vitals_readings'
    id = db.Column(db.Integer, primary_key=True)
    family_id = db.Column(db.Integer, db.ForeignKey('families.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    bpm = db.Column(db.Integer)
    temperature_f = db.Column(db.Float)
    measurement_mode = db.Column(db.String(20))  # 'camera', 'manual', 'sim'
    finger_quality_pct = db.Column(db.Float)  # For camera rPPG quality
    notes = db.Column(db.Text)

class SleepSession(db.Model):
    __tablename__ = 'sleep_sessions'
    id = db.Column(db.Integer, primary_key=True)
    family_id = db.Column(db.Integer, db.ForeignKey('families.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    total_hours = db.Column(db.Float)
    quality_grade = db.Column(db.String(20))  # Great/Good/Fair/Low

class Medicine(db.Model):
    __tablename__ = 'medicines'
    id = db.Column(db.Integer, primary_key=True)
    family_id = db.Column(db.Integer, db.ForeignKey('families.id'), nullable=False)
    health_issue = db.Column(db.String(100), nullable=False)
    medicine_name = db.Column(db.String(100), nullable=False)
    dosage = db.Column(db.String(50))
    time_hhmm = db.Column(db.String(5))  # '08:30'
    frequency = db.Column(db.String(50))  # 'Twice daily'
    notify_mob1 = db.Column(db.String(20))
    notify_mob2 = db.Column(db.String(20))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FoodSchedule(db.Model):
    __tablename__ = 'food_schedules'
    family_id = db.Column(db.Integer, db.ForeignKey('families.id'), primary_key=True)
    breakfast_time = db.Column(db.String(5))
    lunch_time = db.Column(db.String(5))
    snacks_time = db.Column(db.String(5))
    dinner_time = db.Column(db.String(5))
    night_feed_time = db.Column(db.String(5))
    notify_mob1 = db.Column(db.String(20))
    notify_mob2 = db.Column(db.String(20))

class EmergencyContact(db.Model):
    __tablename__ = 'emergency_contacts'
    family_id = db.Column(db.Integer, db.ForeignKey('families.id'), primary_key=True)
    contact1 = db.Column(db.String(20))
    contact2 = db.Column(db.String(20))
    doctor_phone = db.Column(db.String(20))
    neighbour_phone = db.Column(db.String(20))

class EmotionRecord(db.Model):
    __tablename__ = 'emotion_records'
    id = db.Column(db.Integer, primary_key=True)
    family_id = db.Column(db.Integer, db.ForeignKey('families.id'), nullable=False)
    emotion = db.Column(db.String(50), nullable=False)  # Happy, Sad, Cry, Suffocated
    answers = db.Column(db.Text)  # JSON string of answers
    recommendations = db.Column(db.Text)  # JSON string of recommendations
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

def init_db(app):
    """Create all tables"""
    with app.app_context():
        db.create_all()

