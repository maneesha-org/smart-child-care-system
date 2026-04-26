"""
Audio Engine for generating lullaby MP3 files
Uses pydub and simpleaudio for cross-platform support
"""

import os
import math
from datetime import datetime

def generate_sine_wave(frequency, duration_ms, sample_rate=44100, volume=0.3):
    """Generate a sine wave at given frequency"""
    duration = duration_ms / 1000.0
    num_samples = int(duration * sample_rate)
    samples = []
    
    for i in range(num_samples):
        t = i / sample_rate
        # Smooth envelope (fade in/out)
        envelope = min(1, t / 0.05, (duration - t) / 0.1)
        sample = volume * envelope * math.sin(2 * math.pi * frequency * t)
        samples.append(int(sample * 32767))  # Convert to 16-bit
    
    return samples

def create_lullaby_audio_file(filename, frequencies_and_durations):
    """
    Create a simple lullaby audio file
    frequencies_and_durations: list of (frequency_hz, duration_ms) tuples
    """
    import array
    
    # Combine all samples
    all_samples = []
    sample_rate = 44100
    
    for frequency, duration_ms in frequencies_and_durations:
        samples = generate_sine_wave(frequency, duration_ms, sample_rate)
        all_samples.extend(samples)
    
    # Add silence at end
    silence_duration_ms = 500
    silence_samples = [0] * int((silence_duration_ms / 1000.0) * sample_rate)
    all_samples.extend(silence_samples)
    
    # Create WAV file (simpler than MP3)
    import wave
    
    os.makedirs('static/lullabies', exist_ok=True)
    output_path = os.path.join('static/lullabies', filename.replace('.mp3', '.wav'))
    
    with wave.open(output_path, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(array.array('h', all_samples).tobytes())
    
    return output_path

def generate_all_lullabies():
    """Generate all lullaby audio files"""
    
    # Note frequencies (in Hz)
    lullabies = {
        'brahms.wav': [
            (392, 400), (392, 400), (440, 300), (392, 300), (523, 300), (494, 600),
            (392, 400), (392, 400), (440, 300), (392, 300), (587, 300), (523, 600),
        ],
        'twinkle.wav': [
            (261, 400), (261, 400), (392, 400), (392, 400), (440, 400), (440, 400), (392, 800),
            (349, 400), (349, 400), (330, 400), (330, 400), (294, 400), (294, 400), (261, 800),
        ],
        'rock.wav': [
            (392, 300), (440, 300), (392, 300), (349, 600), (330, 300), (294, 300), (262, 600),
            (349, 300), (392, 300), (440, 300), (523, 600), (494, 300), (440, 300), (392, 900),
        ],
        'hush.wav': [
            (392, 300), (392, 200), (349, 200), (330, 300), (294, 300), (330, 300), (349, 300),
            (392, 600), (392, 300), (330, 300), (330, 300), (294, 600), (330, 300), (349, 300),
        ],
        'sunshine.wav': [
            (261, 300), (294, 300), (330, 600), (330, 450), (330, 150), (294, 300), (330, 300), (392, 600),
            (392, 450), (392, 150), (349, 300), (330, 300), (294, 300), (261, 900),
        ],
        'sleep.wav': [
            (349, 600), (392, 300), (440, 300), (494, 600), (440, 300), (392, 300), (349, 900),
            (330, 600), (349, 300), (392, 300), (440, 600), (392, 300), (349, 300), (330, 900),
        ],
    }
    
    os.makedirs('static/lullabies', exist_ok=True)
    
    for filename, notes in lullabies.items():
        try:
            create_lullaby_audio_file(filename, notes)
            print(f"✅ Created {filename}")
        except Exception as e:
            print(f"❌ Error creating {filename}: {e}")

if __name__ == '__main__':
    generate_all_lullabies()
    print("Lullabies generated successfully!")
