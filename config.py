# Smart Childcare Backend Configuration
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'smart-child-care-system-2024'

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///smartchildcare.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # API Settings
    API_BASE = os.environ.get('API_BASE', 'http://localhost:5000')
    
    # Security
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB for photo uploads
    
    # Session timeout
    PERMANENT_SESSION_LIFETIME = 3600  # 1 hour
    
    # Twilio SMS Configuration
    TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
    TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')

