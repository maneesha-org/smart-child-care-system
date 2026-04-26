# Emotion Analyzer Module

def analyze_emotion(facial_expression=None, voice_tone=None, activity=None):
    """
    Analyze child's emotion based on facial expression, voice, or activity
    Returns: dict with emotion score and interpretation
    """
    emotions = {
        'happy': 0.8,
        'calm': 0.9,
        'content': 0.85,
        'neutral': 0.5,
        'fussy': 0.3,
        'crying': 0.1
    }
    
    score = emotions.get(facial_expression, 0.5) if facial_expression else 0.5
    
    return {
        'emotion': facial_expression or 'neutral',
        'score': score,
        'recommendation': 'Baby appears happy and content' if score > 0.7 else 'Baby may need attention'
    }
