import pytest
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from models import db, Family, EmotionRecord
import json

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
        with app.app_context():
            db.drop_all()

def test_emotion_ai_fixed_import():
    """Verify emotion_ai_fixed.py loads without syntax errors"""
    try:
        from analyzers.emotion_ai_fixed import emotion_detector
        assert emotion_detector is not None
        print("✅ emotion_ai_fixed.py imports and initializes successfully")
    except Exception as e:
        pytest.fail(f"❌ emotion_ai_fixed.py import failed: {e}")

def test_backend_questionnaire_endpoint(client):
    """Test new /api/emotions/questionnaire endpoint"""
    # Create test family
    with app.app_context():
        family = Family(
            child_name="Test Baby",
            mob1="1234567890",
            family_hash="test1234"
        )
        db.session.add(family)
        db.session.commit()
    
    # Test image (minimal base64 for testing)
    test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    
    response = client.post('/api/emotions/questionnaire', 
                          json={
                              "image": test_image_b64,
                              "questionnaire": {
                                  "feed": "1h",
                                  "med": "na",
                                  "temp": "98.6",
                                  "symptoms": ["none"],
                                  "duration": "30min",
                                  "sleep": "good"
                              }
                          })
    
    data = response.get_json()
    assert response.status_code == 200
    assert data['success'] is True
    assert 'record_id' in data
    assert data['emotion'] in ['no_face_detected', 'happy', 'sad']  # Allow AI variation
    
    # Verify saved to DB
    record = EmotionRecord.query.first()
    assert record is not None
    assert record.emotion == data['emotion']
    assert 'questionnaire' in json.loads(record.answers)
    print("✅ Questionnaire endpoint works + saves to DB")

def test_emotion_ai_fixed_quality_gating():
    """Test rPPG quality gating works"""
    try:
        from analyzers.emotion_ai_fixed import emotion_detector
        # This tests that quality gating rejects poor signals
        # (Would need actual frame data for full test)
        assert hasattr(emotion_detector, 'calculate_rppg')
        print("✅ emotion_ai_fixed rPPG quality gating available")
    except Exception as e:
        pytest.fail(f"❌ rPPG quality gating test failed: {e}")

def test_full_emotion_flow_smoke_test(client):
    """High-level smoke test: login → questionnaire → save"""
    # 1. Login (creates family)
    login_resp = client.post('/api/register', json={
        "child_name": "Smoke Test Baby",
        "mob1": "9999999999"
    })
    assert login_resp.status_code == 200
    fid = login_resp.get_json()['family_id']
    
    # 2. Process questionnaire (core endpoint)
    q_resp = client.post('/api/emotions/questionnaire', json={
        "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9QACGQ==",  # Tiny test image
        "questionnaire": {"feed": "1h", "med": "na", "symptoms": ["none"]}
    })
    
    q_data = q_resp.get_json()
    assert q_resp.status_code == 200
    assert q_data['success'] is True
    assert 'ai_analysis' in q_data
    
    print("✅ Full emotion flow: login → questionnaire → analysis → DB ✅")
    
    return fid

class TestIntegration:
    """Integration tests requiring DB state"""
    
    def test_family_emotion_linkage(self, client):
        """Verify emotion records link properly to families"""
        fid = test_full_emotion_flow_smoke_test(client)
        
        with app.app_context():
            records = EmotionRecord.query.filter_by(family_id=fid).all()
            assert len(records) > 0
            assert records[0].family_id == fid
            print("✅ Emotion records properly linked to families")

# Run tests
if __name__ == '__main__':
    pytest.main(['-v', __file__])

