import cv2
import numpy as np
from scipy import signal
from scipy.fft import fft, fftfreq
import base64
from io import BytesIO
from PIL import Image
import json

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    mp = None
    MEDIAPIPE_AVAILABLE = False

class FaceEmotionDetector:
    def __init__(self):
        if MEDIAPIPE_AVAILABLE:
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.7
            )
        else:
            self.face_mesh = None
        
    def decode_image(self, b64_data, mime_type='image/jpeg'):
        \"\"\"Decode base64 image to OpenCV format\"\"\"
        header, data = b64_data.split(',')
        img_data = base64.b64decode(data)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    
    def extract_face_roi(self, img):
        \"\"\"Extract forehead ROI for rPPG (no flash)\"\"\"
        if self.face_mesh is None:
            return None, None
        
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_img)
        
        if not results.multi_face_landmarks:
            return None, None
        
        h, w = img.shape[:2]
        landmarks = results.multi_face_landmarks[0].landmark
        
        # Forehead ROI: average landmarks 10,67,107,336 (top forehead)
        pts = [10, 67, 107, 336]
        forehead_pts = np.array([[int(landmarks[i].x * w), int(landmarks[i].y * h)] for i in pts])
        
        # Bounding box around forehead (20% width/height)
        x_min, y_min = np.min(forehead_pts, axis=0)
        x_max, y_max = np.max(forehead_pts, axis=0)
        roi_w, roi_h = int((x_max-x_min)*1.5), int((y_max-y_min)*1.8)
        x, y = max(0, x_min-roi_w//4), max(0, y_min-roi_h//2)
        
        roi = img[y:y+roi_h, x:x+roi_w]
        if roi.size == 0:
            return None, None
            
        return roi, results
    
    def detect_emotion(self, img):
        \"\"\"Simple FER using landmark positions + intensity\"\"\"
        roi, results = self.extract_face_roi(img)
        if roi is None:
            return 'unknown', 0.0
        
        # Basic emotion scoring from ROI features
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        mouth_ratio = self._mouth_ratio(results) if results else 0.5
        eye_ratio = self._eye_ratio(results) if results else 0.5
        brightness = np.mean(gray) / 255
        
        # Emotion scoring (simple rules-based)
        scores = {
            'happy': max(0, mouth_ratio - 0.4) * brightness * 2,
            'sad': max(0, 0.7 - mouth_ratio) * (1 - brightness) * 1.8,
            'angry': (1 - eye_ratio) * 1.5,
            'surprised': eye_ratio * 1.8,
            'neutral': abs(mouth_ratio - 0.5) * 0.3 + brightness * 0.3
        }
        
        emotion = max(scores, key=scores.get)
        confidence = scores[emotion]
        
        return emotion, min(confidence, 1.0)
    
    def _mouth_ratio(self, results):
        \"\"\"Calculate mouth openness ratio\"\"\"
        landmarks = results.multi_face_landmarks[0].landmark
        mouth_top = (landmarks[13].y + landmarks[14].y) / 2
        mouth_bottom = (landmarks[16].y + landmarks[17].y) / 2
        return (mouth_bottom - mouth_top) * 3  # Normalized
    
    def _eye_ratio(self, results):
        \"\"\"Calculate eye openness ratio\"\"\"
        landmarks = results.multi_face_landmarks[0].landmark
        # Left eye vertical distance
        eye_top = landmarks[159].y
        eye_bottom = landmarks[145].y
        return (eye_bottom - eye_top) * 4  # Normalized
    
    def calculate_pulse_rppg(self, img_sequence, fps=10):
        \"\"\"No-flash rPPG from forehead ROI sequence\"\"\"
        if len(img_sequence) < 30:  # Need min 3 seconds
            return None
        
        rois = []
        for img_b64 in img_sequence[-30:]:  # Last 3 seconds
            img = self.decode_image(img_b64)
            roi, _ = self.extract_face_roi(img)
            if roi is not None:
                # Green channel only (best for rPPG, no flash needed)
                green = roi[:,:,1].flatten()
                rois.append(np.mean(green))
        
        if len(rois) < 20:
            return None
        
        # Detrend signal
        signal_detrend = signal.detrend(rois)
        
        # Bandpass filter 0.8-3.0 Hz (48-180 BPM)
        sos = signal.butter(4, [0.8/fps*2, 3.0/fps*2], btype='band', output='sos')
        filtered = signal.sosfilt(sos, signal_detrend)
        
        # FFT peak detection
        N = len(filtered)
        freqs = fftfreq(N, 1/fps)[:N//2]
        fft_vals = np.abs(fft(filtered))[:N//2]
        
        # Find peak in heart rate range (0.8-3Hz = 48-180 BPM)
        hr_range = (freqs >= 0.8) & (freqs <= 3.0)
        peak_freq = freqs[hr_range][np.argmax(fft_vals[hr_range])]
        
        bpm = int(peak_freq * 60)
        return max(60, min(180, bpm))  # Clamp realistic range

detector = FaceEmotionDetector()

