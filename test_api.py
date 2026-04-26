import requests

endpoints = [
    ("http://localhost:5000/", "Home page"),
    ("http://localhost:5000/api/medicines", "Medicines"),
    ("http://localhost:5000/api/food/schedule", "Food schedule"),
    ("http://localhost:5000/api/emergency", "Emergency"),
    ("http://localhost:5000/api/pulse/history", "Pulse"),
    ("http://localhost:5000/api/emotions/history", "Emotions"),
    ("http://localhost:5000/api/sleep/history", "Sleep"),
    ("http://localhost:5000/api/lullabies", "Lullabies"),
    ("http://localhost:5000/static/lullabies/brahms.wav", "WAV file"),
]

print("API Endpoint Test Results")
print("=" * 100)

working = 0
failed = 0

for i, (url, desc) in enumerate(endpoints, 1):
    try:
        r = requests.get(url, timeout=5)
        size = len(r.content)
        status = r.status_code
        result = "SUCCESS" if status == 200 else f"Status {status}"
        print(f"{i}. {url:60} | Status: {status}")
        if status == 200:
            working += 1
        else:
            failed += 1
    except Exception as e:
        print(f"{i}. {url:60} | FAILED: {str(e)[:50]}")
        failed += 1

print()
print("=" * 100)
print(f"Summary: {working} working, {failed} failed out of 9 endpoints")
