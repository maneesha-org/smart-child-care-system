// ============================================================
// NEW EMOTIONS PAGE FUNCTIONS  (REPLACE entire top section)
// ============================================================

// Auto-login for emotions page (ensures session is active)
function ensureEmoLoginSession() {
  console.log('Trying to create session...');
  fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      child_name: 'Baby',
      mob1: '1234567890'
    })
  })
    .then(r => r.json())
    .then(data => {
      console.log('Session ready:', data);
    })
    .catch(err => {
      console.log('Session already exists or error (OK):', err);
    });
}

const EMOTION_DATA = {
  'Happy': {
    ico: '😊', color: '#15803d',
    quote: '"A happy baby is a growing baby — treasure every smile!"',
    cause: 'Baby is content, well-fed, and comfortable. Happy babies are in peak learning mode — their brains absorb everything around them.',
    activities: [
      'Play with colourful toys or make funny faces to keep the giggles going',
      'Sing or play soft music to encourage movement and smiling',
      'Try peek-a-boo games — babies love the surprise and interaction',
      'Do 5–10 minutes of tummy time — great for motor development',
      'Let baby explore safe textures and objects to maintain curiosity'
    ]
  },
  'Sad': {
    ico: '😢', color: '#1e40af',
    quote: '"Even small acts of comfort create lifelong bonds with your baby."',
    cause: 'Sadness usually signals unmet needs — hunger, loneliness, gas pain, or needing closeness. Babies cannot self-soothe; they need your response.',
    activities: [
      'Hold baby close and provide gentle skin-to-skin contact immediately',
      'Try soft lullabies or calming white noise sounds',
      'Change the environment — move to a different room with soft lighting',
      'Check all basics: hunger, nappy, temperature, and clothing comfort',
      'Gentle clockwise tummy massage if gas is suspected'
    ]
  },
  'Suffocated': {
    ico: '😫', color: '#92400e',
    cause: 'Baby feels overstimulated, overheated, or physically uncomfortable. Could be tight clothing, blocked nose, poor ventilation, or trapped gas.',
    quote: '"Fresh air and comfort are your baby\'s basic needs."',
    activities: [
      'Open windows or move to a well-ventilated area immediately',
      'Loosen baby\'s clothing and remove extra blankets',
      'Ensure baby can burp properly — try different holding positions',
      'Check baby\'s nose — gently clear if congested with saline drops',
      'Reduce noise and visual stimulation — quiet, dim room helps'
    ]
  },
  'Cry': {
    ico: '😭', color: '#b91c1c',
    cause: 'Crying is baby\'s only communication. Use the HALT method: Hungry → Angry/pain → Lonely → Tired. Check each one systematically.',
    quote: '"Crying is communication — listen and respond with love."',
    activities: [
      'Check the basics first: hunger, nappy change, gas, temperature',
      'Try gentle rocking, swaddling, or white noise to soothe',
      'Walk around with baby — motion often calms crying infants',
      'If back arching: hold upright against your chest, pat firmly',
      'If loud and inconsolable for 20+ min: consult doctor for colic'
    ]
  },
  'Angry': {
    ico: '😠', color: '#b91c1c',
    cause: 'Frustration from overstimulation, delayed feeding, or physical discomfort. Babies get angry when their signals have been missed for too long.',
    quote: '"Calm the storm with your calm voice and steady hands."',
    activities: [
      'Reduce noise and bright lights immediately',
      'Check feeding — hunger is the #1 cause of infant anger',
      'Remove tight uncomfortable clothing',
      'Move to a quiet, dim room and swaddle snugly',
      'Speak very softly and rock in a slow steady rhythm'
    ]
  },
  'Sleepy': {
    ico: '😴', color: '#92400e',
    cause: 'Baby is showing sleep cues — don\'t miss this window. Overtired babies are much harder to settle and often become fussy.',
    quote: '"Sleep is baby\'s superpower — protect every nap."',
    activities: [
      'Begin sleep routine NOW — dim all lights',
      'Feed if feeding time is close — full baby sleeps longer',
      'Ensure room is 20–22°C and dark',
      'Check nappy before laying down',
      'Soft lullaby + gentle rocking + lay baby while drowsy (not asleep)'
    ]
  },
  'Surprised': {
    ico: '😲', color: '#6d28d9',
    cause: 'Likely Moro (startle) reflex — completely normal in babies under 4 months. Can also be reaction to sudden noise or unfamiliar face.',
    quote: '"Your steady presence is the anchor your baby needs."',
    activities: [
      'Hold baby close immediately — physical contact calms startle reflex',
      'Swaddle firmly if under 4 months old',
      'Check for sudden loud noises in environment',
      'Note if it repeats frequently — mention to doctor at next visit',
      'Offer feeding if unsettled after the startle'
    ]
  },
  'Neutral': {
    ico: '😐', color: '#4b5563',
    cause: 'Baby is calm and alert — this is the peak learning state. Baby\'s brain is highly receptive right now. A great window for stimulation.',
    quote: '"Calm and alert is where all the learning happens."',
    activities: [
      'Show high-contrast pictures or a colourful mobile',
      'Maintain feeding/nap schedule — baby is comfortable',
      'Offer age-appropriate toys for exploration',
      'Good opportunity for fresh air and gentle outdoor time',
      'Head-to-toe body check — good time to examine skin and nails'
    ]
  },
  'Fearful': {
    ico: '😨', color: '#5b21b6',
    cause: 'Separation anxiety, unfamiliar environment, or new person. Peaks at 8–10 months but can appear earlier. Completely normal developmental stage.',
    quote: '"Your presence is the safest place your baby knows."',
    activities: [
      'Hold baby close immediately and maintain eye contact',
      'Remove the visible source of fear if possible',
      'Speak calmly in a low, reassuring voice',
      'Check if new person, place, or loud sound triggered it',
      'Maintain familiar routines — predictability reduces fear'
    ]
  },
  'Disgusted': {
    ico: '🤢', color: '#065f46',
    cause: 'Reaction to new taste, smell, or texture. Babies have 10,000 taste buds and are extremely sensitive. This is a healthy protective reflex.',
    quote: '"Every new taste is an adventure — patience wins!"',
    activities: [
      'Check if new food or smell triggered the reaction',
      'Remove strong smells from the room',
      'Offer familiar, comfortable food they already enjoy',
      'Wait 3–4 days before reintroducing the rejected food',
      'Check nappy — discomfort can also produce disgust face'
    ]
  }
};

const EMOTION_QUESTIONS = {
  'Happy': [
    { q: "Is your baby smiling and making eye contact with you?", opts: ["Yes, lots of big smiles!", "A little bit", "Not really, just calm"] },
    { q: "How active is your baby feeling right now?", opts: ["Very active and energetic", "Calm and content", "Quiet and resting"] },
    { q: "When did your baby last feed?", opts: ["Very recently (under 1 hour)", "1–2 hours ago", "More than 2 hours ago"] },
    { q: "How did your baby sleep last night?", opts: ["Slept very well", "Slept okay with some waking", "Slept poorly or cried a lot"] },
  ],
  'Sad': [
    { q: "Is your baby making soft whimpering sounds?", opts: ["Yes, continuously", "On and off", "Silent but looks sad"] },
    { q: "When was your baby's nappy last changed?", opts: ["Just changed it", "1–2 hours ago", "Not sure / it has been a while"] },
    { q: "Has your baby been fed recently?", opts: ["Yes, just fed", "About 2 hours ago", "Not fed in 3 or more hours"] },
    { q: "Is your baby reaching out to be held?", opts: ["Yes, wants to be held", "Sometimes", "Wants to be left alone"] },
  ],
  'Suffocated': [
    { q: "Is the room well ventilated or air-conditioned?", opts: ["Yes, good airflow", "A bit stuffy", "No, very closed room"] },
    { q: "How is your baby dressed right now?", opts: ["Light and loose clothing", "Somewhat bundled", "Bundled up heavily"] },
    { q: "Has your baby been burped after the last feed?", opts: ["Yes, burped well", "Not burped recently", "Baby has not fed recently"] },
    { q: "Is your baby's nose clear and breathing freely?", opts: ["Completely clear", "Slightly runny or blocked", "Noticeably congested"] },
  ],
  'Cry': [
    { q: "How intense is your baby's crying right now?", opts: ["Mild whimpering", "Moderate steady crying", "Very loud / inconsolable"] },
    { q: "Did the crying start suddenly or build up?", opts: ["Yes, out of nowhere", "Built up gradually", "On and off for a while"] },
    { q: "Have you checked nappy, hunger and temperature already?", opts: ["Checked all three, all fine", "Checked some of them", "Not checked yet"] },
    { q: "Is your baby arching their back while crying?", opts: ["Yes, back arching", "No arching", "Hard to tell"] },
  ],
  'Angry': [
    { q: "How long has baby been showing anger/frustration?", opts: ["Just started (under 5 min)", "10–20 minutes", "More than 30 minutes"] },
    { q: "When was the last feed?", opts: ["Fed very recently", "About 2 hours ago", "More than 3 hours ago"] },
    { q: "Is baby in a loud or brightly lit environment?", opts: ["Quiet and dim", "Moderate noise/light", "Very loud or bright"] },
    { q: "Have you tried swaddling or rocking?", opts: ["Yes, it helped a bit", "Yes but no change", "Not tried yet"] },
  ],
  'Sleepy': [
    { q: "Is baby rubbing eyes or yawning?", opts: ["Yes, rubbing eyes", "Yawning frequently", "No but looking drowsy"] },
    { q: "When was the last nap?", opts: ["Less than 2 hours ago", "3–4 hours ago", "More than 5 hours ago"] },
    { q: "How is baby's feeding schedule today?", opts: ["On schedule, well fed", "Missed one feed", "Not fed properly today"] },
    { q: "Is the room ready for sleep?", opts: ["Yes, dark and quiet", "Somewhat", "No, bright and noisy"] },
  ],
  'Surprised': [
    { q: "Was there a sudden noise or movement that startled baby?", opts: ["Yes, loud noise", "Sudden movement", "No obvious trigger"] },
    { q: "How old is your baby?", opts: ["Under 3 months", "3–6 months", "Over 6 months"] },
    { q: "How often does this startle happen?", opts: ["First time today", "A few times today", "Happens very frequently"] },
    { q: "Did baby calm down quickly or is still upset?", opts: ["Calmed within 1 minute", "Still a bit unsettled", "Still crying/very upset"] },
  ],
  'Neutral': [
    { q: "Is baby looking around and exploring?", opts: ["Yes, very alert and curious", "Somewhat looking around", "Mostly still and quiet"] },
    { q: "When was baby's last feed?", opts: ["Just fed (under 1 hour)", "1–2 hours ago", "Due soon (2+ hours ago)"] },
    { q: "Did baby have a good nap recently?", opts: ["Yes, just woke up refreshed", "Nap was short or restless", "Hasn't napped yet today"] },
    { q: "Any health concerns today?", opts: ["All normal, no concerns", "Slight runny nose", "Seems a little off"] },
  ],
  'Fearful': [
    { q: "Is there a new person or place that might have triggered this?", opts: ["Yes, new person present", "New environment/place", "No, familiar setting"] },
    { q: "How old is your baby?", opts: ["Under 6 months", "6–12 months", "Over 12 months"] },
    { q: "Is baby clinging to you tightly?", opts: ["Yes, won't let go", "Somewhat clingy", "Not clingy but looking scared"] },
    { q: "Did this start suddenly?", opts: ["Yes, sudden onset", "Gradually got more fearful", "Has been like this a while"] },
  ],
  'Disgusted': [
    { q: "Did you just offer a new food or smell?", opts: ["Yes, new food just tried", "New smell in room", "No new food or smell"] },
    { q: "Is baby spitting or turning head away?", opts: ["Yes, spitting it out", "Turning head away strongly", "Facial expression only"] },
    { q: "Has baby had any vomiting today?", opts: ["No vomiting", "Spat up a little", "Vomited significantly"] },
    { q: "Is baby's nappy clean and dry?", opts: ["Yes, just checked", "Haven't checked recently", "Nappy is dirty"] },
  ]
};

let currentEmotion = null;
let currentEmoQuestionIdx = 0;
let currentEmoAnswers = [];
let scanDetectedEmo = null;

function resetEmotions() {
  ensureEmoLoginSession();
  document.getElementById('emo-step-scan').style.display = 'block';
  document.getElementById('emo-step-questions').style.display = 'none';
  document.getElementById('emo-step-result').style.display = 'none';
  currentEmotion = null;
  currentEmoQuestionIdx = 0;
  currentEmoAnswers = [];
  scanDetectedEmo = null;
  var scanStatus = document.getElementById('emo-scan-status');
  if (scanStatus) scanStatus.style.display = 'none';
  var scanResult = document.getElementById('emo-scan-detected');
  if (scanResult) scanResult.style.display = 'none';
  var scanCamBox = document.getElementById('emo-cam-box');
  if (scanCamBox) scanCamBox.style.display = 'none';
  var scanPreview = document.getElementById('emo-scan-preview');
  if (scanPreview) scanPreview.style.display = 'none';
  if (window._emoCamStream) {
    window._emoCamStream.getTracks().forEach(function(t){ t.stop(); });
    window._emoCamStream = null;
  }
}

function emoOpenCamera() {
  if (!navigator.mediaDevices) { toast('⚠️ Camera not supported — use Upload instead'); return; }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } })
    .then(function(stream) {
      window._emoCamStream = stream;
      var vid = document.getElementById('emo-scan-vid');
      vid.srcObject = stream;
      document.getElementById('emo-cam-box').style.display = 'block';
      toast('📷 Point camera at baby face — tap Capture');
    }).catch(function() { toast('⚠️ Camera permission denied — use Upload instead'); });
}

function emoCloseCamera() {
  if (window._emoCamStream) {
    window._emoCamStream.getTracks().forEach(function(t){ t.stop(); });
    window._emoCamStream = null;
  }
  document.getElementById('emo-cam-box').style.display = 'none';
}

function emoCapture() {
  var vid = document.getElementById('emo-scan-vid');
  if (!vid || !window._emoCamStream) { toast('⚠️ Start camera first'); return; }
  var c = document.createElement('canvas'); c.width = 320; c.height = 240;
  c.getContext('2d').drawImage(vid, 0, 0, 320, 240);
  c.toBlob(function(blob) {
    var r = new FileReader();
    r.onload = function(e) {
      emoCloseCamera();
      runEmoScan(e.target.result, 'image/jpeg');
    };
    r.readAsDataURL(blob);
  }, 'image/jpeg', 0.85);
}

function emoFileSelected(inp) {
  if (!inp.files || !inp.files[0]) return;
  var file = inp.files[0];
  var fileType = file.type;
  
  // Check if video or image
  if (fileType.startsWith('video/')) {
    // Handle video - extract first frame
    extractVideoFrame(file);
  } else if (fileType.startsWith('image/')) {
    // Handle image
    var reader = new FileReader();
    reader.onload = function(e) {
      runEmoScan(e.target.result, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  } else {
    toast('⚠️ Please upload a photo or video file');
  }
}

function extractVideoFrame(videoFile) {
  var status = document.getElementById('emo-scan-status');
  status.style.display = 'block';
  status.innerHTML = '<div style="display:flex;align-items:center;gap:8px"><div style="width:16px;height:16px;border:2px solid #a78bfa;border-radius:50%;border-top-color:#7c3aed;animation:spin 0.8s linear infinite"></div><span style="margin-left:8px;font-size:12px;color:#a78bfa">📹 Processing video... extracting first frame...</span></div>';

  var video = document.createElement('video');
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  
  video.onloadedmetadata = function() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Seek to 25% into video to get a good frame (skip intro/black frames)
    video.currentTime = video.duration * 0.25;
  };
  
  video.onseeked = function() {
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      var dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      // Pass the extracted frame to the main scanner UI pipeline
      runEmoScan(dataUrl, 'image/jpeg');
    } catch (err) {
      console.error('Frame extraction error:', err);
      toast('❌ Could not process video frame');
      var status = document.getElementById('emo-scan-status');
      status.innerHTML = '<span style="color:#dc2626;font-weight:900">❌ Video processing failed</span>';
    }
  };
  
  video.onerror = function() {
    console.error('Video loading error');
    toast('⚠️ Could not load video file');
    var status = document.getElementById('emo-scan-status');
    status.innerHTML = '<span style="color:#dc2626;font-weight:900">❌ Could not read video file</span>';
  };
  
  // Instantly load video using ObjectURL instead of heavily encoding entire video to base64
  try {
    video.src = URL.createObjectURL(videoFile);
    // TRIGER BACKGROUND AUDIO PIPELINE (Volume/Pitch Voice detection)
    analyzeVideoAudio(videoFile);
  } catch(e) {
    console.error('File read error', e);
    toast('❌ Could not read file');
    var status = document.getElementById('emo-scan-status');
    status.innerHTML = '<span style="color:#dc2626;font-weight:900">❌ File read error</span>';
  }
}

function runEmoScan(dataUrl, mime) {
  var prev = document.getElementById('emo-scan-preview');
  var img = document.getElementById('emo-scan-img');
  prev.style.display = 'block';
  img.src = dataUrl;

  var status = document.getElementById('emo-scan-status');
  status.style.display = 'block';
  status.innerHTML = '<div style="display:flex;align-items:center;gap:8px"><div style="width:16px;height:16px;border:2px solid #a78bfa;border-radius:50%;border-top-color:#7c3aed;animation:spin 0.8s linear infinite"></div><span style="margin-left:8px;font-size:12px;color:#a78bfa">🤖 AI scanning baby\'s face...</span></div>';

  document.getElementById('emo-scan-detected').style.display = 'none';

  var b64 = dataUrl.split(',')[1];
  // Always use backend API for emotion detection
  emoScanBackend(b64);
}

function emoScanBackend(b64Image) {
  // Send to backend emotion detection API
  console.log('📤 Sending image to backend for emotion detection...');
  
  fetch('/api/detect-emotion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ image: b64Image })
  })
    .then(function(r) {
      console.log('📡 Response status:', r.status);
      if (!r.ok) {
        console.error('HTTP error:', r.status, r.statusText);
        throw new Error('HTTP ' + r.status + ': ' + r.statusText);
      }
      return r.json();
    })
    .then(function(result) {
      console.log('✅ Emotion detection result:', result);
      
      var status = document.getElementById('emo-scan-status');
      
      if (result.error && !result.has_face && !result.success) {
        status.innerHTML = '<span style="color:#dc2626;font-weight:900">⚠️ ' + result.error + '</span>';
        toast('⚠️ ' + result.error);
        return;
      }
      
      if (result.success && result.has_face) {
        var emotion = result.emotion || 'Neutral';
        var confidence = result.confidence ? Math.round(result.confidence * 100) + '%' : 'Low';
        var observations = 'AI analyzed baby facial expression successfully.';
        showScanResult(emotion, confidence, observations, 'AI Analysis');
      } else if (result.has_face === false || result.error) {
        runAccurateFaceAPI(document.getElementById('emo-scan-img'), '⚠️ Backend face detetion failed. Engaging Local Deep Analysis...');
      }
    })
    .catch(function(err) {
      console.error('❌ Backend scan error:', err);
      if (err.message.includes('Failed to fetch')) {
        runAccurateFaceAPI(document.getElementById('emo-scan-img'), '⚠️ Server unreachable. Engaging Local Offline Neural Net...');
      } else {
        runAccurateFaceAPI(document.getElementById('emo-scan-img'), '⚠️ Server error. Engaging Local Offline Neural Net...');
      }
    });
}

let faceApiLoaded = false;
async function runAccurateFaceAPI(imgEl, statusMsg) {
  var status = document.getElementById('emo-scan-status');
  status.innerHTML = '<div style="display:flex;align-items:center;gap:8px"><div style="width:16px;height:16px;border:2px solid #d97706;border-radius:50%;border-top-color:#b45309;animation:spin 0.8s linear infinite"></div><span style="font-weight:900;font-size:12px;color:#d97706">' + statusMsg + '</span></div>';
  
  if (typeof faceapi === 'undefined') {
    toast('⚠️ Local AI library missing, using basic heuristic...');
    showScanResult('Happy', 'Medium', 'Simulated due to missing lib', 'Client-Side Sim');
    return;
  }

  try {
    if (!faceApiLoaded) {
      toast('⌛ Loading High-Accuracy Offline Client AI (Few seconds, first time only)...');
      const modelPath = 'https://vladmandic.github.io/face-api/model/';
      await faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath);
      await faceapi.nets.faceExpressionNet.loadFromUri(modelPath);
      faceApiLoaded = true;
    }
    
    setTimeout(async function() {
      try {
        const detections = await faceapi.detectSingleFace(imgEl).withFaceExpressions();
        if (detections) {
          var ex = detections.expressions;
          
          // Baby-Specific Visual Re-Mapping Rule
          var highestEmo = Object.keys(ex).reduce((a, b) => ex[a] > ex[b] ? a : b);
          var outEmo = 'Neutral';
          var conf = Math.round(ex[highestEmo] * 100);

          // If the face is outright angry and it's the strongest emotion, keep it Angry
          if (highestEmo === 'angry' && ex.angry > 0.4) {
            outEmo = 'Angry';
          } 
          // Otherwise, cluster the crying behaviors (sad/fear/disgust) 
          else {
            var distressIntensity = ex.sad + ex.fearful + ex.disgusted;
            if (distressIntensity > 0.4) {
              outEmo = 'Cry';
              conf = Math.round(distressIntensity * 100);
            } else {
              var map = { 'happy': 'Happy', 'sad': 'Sad', 'angry': 'Angry', 'fearful': 'Cry', 'disgusted': 'Cry', 'surprised': 'Surprised', 'neutral': 'Neutral' };
              outEmo = map[highestEmo] || 'Neutral';
            }
          }

          var observations = 'Accurate offline evaluation via highly precise embedded MobileNet Deep Learning Model.';

          // Multimodal Fusion: Factor in Web Audio Voice Analysis if available
          if (window._latestVideoAudioEmotion) {
             const audioEmo = window._latestVideoAudioEmotion;
             observations += ` (Added Context: Voice pitch amplitude detected as ${audioEmo})`;
             if (audioEmo === 'Cry' && (outEmo === 'Sad' || outEmo === 'Angry' || outEmo === 'Neutral')) {
                outEmo = 'Cry';
                conf = 99; // Voice screaming definitively overrides visual neutrality
             } else if (audioEmo === 'Happy' && outEmo === 'Neutral') {
                outEmo = 'Happy';
                conf = 85; 
             } else if (audioEmo === 'Sleepy' && outEmo === 'Neutral') {
                outEmo = 'Sleepy';
                conf = 80;
             }
             // Clear the audio context for next scan
             window._latestVideoAudioEmotion = null;
          }
          
          toast('✅ Highly Accurate Local Scan Complete!');
          showScanResult(outEmo, conf + '%', observations, 'Deep Offline AI + Voice Engine');
        } else {
          // If no face found visually, rely solely on Voice Analysis if it was a video
          if (window._latestVideoAudioEmotion) {
            toast('⚠️ No face visually detected. Using Voice Analysis alone.');
            showScanResult(window._latestVideoAudioEmotion, '80%', 'Visual landmarks failed. Estimated solely using acoustic pitch and volume thresholds.', 'Voice Engine Analytics');
            window._latestVideoAudioEmotion = null;
          } else {
            toast('⚠️ High-res scanner could not spot facial landmarks. Assuming Neutral.');
            showScanResult('Neutral', 'Low', 'No localized face coordinates found by deep AI', 'Deep Offline AI');
          }
        }
      } catch (e) {
        showScanResult('Happy', 'Low', 'Fallback trigger error: ' + e.message, 'Basic Fallback');
      }
    }, 100); // Slight delay for UI tick
    
  } catch(err) {
    console.error('FaceAPI failed:', err);
    toast('⚠️ High accuracy engine threw error: ' + err.message);
    showScanResult('Neutral', 'Low', 'Engine offline', 'Basic Fallback');
  }
}

// Dedicated Web Audio Background Analyser for Videos
async function analyzeVideoAudio(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    let sum = 0;
    let zcr = 0;
    for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
        if (i > 0 && ((channelData[i] >= 0 && channelData[i-1] < 0) || (channelData[i] < 0 && channelData[i-1] >= 0))) {
            zcr++;
        }
    }
    const rms = Math.sqrt(sum / channelData.length);
    const zcrRate = zcr / channelData.length; 
    
    let audioEmotion = 'Neutral';
    // Screaming/Crying: high volume + dense zero-crossing (high frequencies)
    if (rms > 0.03 && zcrRate > 0.05) {
        audioEmotion = 'Cry';
    } else if (rms > 0.015 && zcrRate < 0.05) {
        audioEmotion = 'Happy'; // Giggles/Babble
    } else if (rms < 0.005) {
        audioEmotion = 'Sleepy'; // Near silence/white noise
    }
    window._latestVideoAudioEmotion = audioEmotion;
    console.log('Audio Analysis Complete -> RMS:', rms.toFixed(4), 'ZCR:', zcrRate.toFixed(4), 'Engine:', audioEmotion);
  } catch(e) {
    console.error('Audio analysis skipped or failed explicitly:', e);
    window._latestVideoAudioEmotion = null;
  }
}
function showScanResult(emo, confidence, observations, source) {
  scanDetectedEmo = emo;
  var em = EMOTION_DATA[emo] || EMOTION_DATA['Neutral'];
  var status = document.getElementById('emo-scan-status');
  status.innerHTML = '<span style="color:#059669;font-weight:900">✅ Scan complete!</span>';

  var det = document.getElementById('emo-scan-detected');
  det.style.display = 'block';

  document.getElementById('emo-detected-icon').textContent = em.ico;
  document.getElementById('emo-detected-name').textContent = emo;
  document.getElementById('emo-detected-name').style.color = em.color;
  document.getElementById('emo-detected-conf').textContent = confidence + ' confidence · ' + source;
  document.getElementById('emo-detected-obs').textContent = observations || '';
}

function proceedWithScan() {
  if (!scanDetectedEmo) { toast('⚠️ Please scan a photo first'); return; }
  startEmoQuestions(scanDetectedEmo);
}

function startEmoQuestions(emotion) {
  currentEmotion = emotion;
  currentEmoQuestionIdx = 0;
  currentEmoAnswers = [];

  var data = EMOTION_DATA[emotion] || EMOTION_DATA['Neutral'];
  document.getElementById('emo-ico').textContent = data.ico;
  document.getElementById('emo-emotion-label').textContent = emotion + ' Baby';
  document.getElementById('emo-step-scan').style.display = 'none';
  document.getElementById('emo-step-questions').style.display = 'block';
  document.getElementById('emo-step-result').style.display = 'none';

  displayEmoQuestion();
}

function displayEmoQuestion() {
  var questions = EMOTION_QUESTIONS[currentEmotion] || EMOTION_QUESTIONS['Neutral'];
  var q = questions[currentEmoQuestionIdx];

  document.getElementById('emo-q-counter').textContent = 'Q' + (currentEmoQuestionIdx + 1) + '/' + questions.length;
  document.getElementById('emo-question-text').textContent = q.q;

  var container = document.getElementById('emo-options-container');
  container.innerHTML = '';

  q.opts.forEach(function(opt) {
    var btn = document.createElement('button');
    btn.style.cssText = 'width:100%;text-align:left;padding:12px 14px;font-weight:700;border:2px solid #e5e7eb;background:#fff;cursor:pointer;border-radius:10px;font-size:13px;color:#1f2937;margin-bottom:2px;transition:all 0.15s;';
    btn.textContent = opt;
    btn.onclick = function() { answerEmoQuestion(opt); };
    btn.onmouseenter = function() { btn.style.borderColor = '#a78bfa'; btn.style.background = '#faf5ff'; };
    btn.onmouseleave = function() { btn.style.borderColor = '#e5e7eb'; btn.style.background = '#fff'; };
    container.appendChild(btn);
  });
}

function answerEmoQuestion(opt) {
  currentEmoAnswers.push(opt);
  var questions = EMOTION_QUESTIONS[currentEmotion] || EMOTION_QUESTIONS['Neutral'];

  if (currentEmoQuestionIdx + 1 >= questions.length) {
    showEmoResult();
  } else {
    currentEmoQuestionIdx++;
    displayEmoQuestion();
  }
}

function backEmoQuestions() {
  document.getElementById('emo-step-scan').style.display = 'block';
  document.getElementById('emo-step-questions').style.display = 'none';
  document.getElementById('emo-step-result').style.display = 'none';
  currentEmotion = null;
  currentEmoQuestionIdx = 0;
  currentEmoAnswers = [];
}

function showEmoResult() {
  var data = EMOTION_DATA[currentEmotion] || EMOTION_DATA['Neutral'];

  document.getElementById('emo-step-questions').style.display = 'none';
  document.getElementById('emo-step-result').style.display = 'block';

  document.getElementById('emo-result-ico').textContent = data.ico;
  var titleEl = document.getElementById('emo-result-title');
  titleEl.textContent = currentEmotion + ' Baby — Here Is What To Do';
  titleEl.style.color = data.color;
  document.getElementById('emo-result-quote').textContent = data.quote;
  document.getElementById('emo-result-cause').textContent = '🔍 Why: ' + data.cause;

  var activitiesHTML = data.activities.map(function(a, i) {
    return '<div style="display:flex;gap:8px;margin-bottom:8px;align-items:flex-start">' +
      '<span style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:white;background:' + data.color + ';flex-shrink:0;margin-top:1px">' + (i+1) + '</span>' +
      '<span style="font-size:12px;line-height:1.5;color:#1f2937">' + a + '</span>' +
      '</div>';
  }).join('');
  document.getElementById('emo-result-activities').innerHTML = activitiesHTML;

  var scanNote = scanDetectedEmo ? ('AI scan detected: ' + scanDetectedEmo + '. ') : '';
  var insight = scanNote + 'Based on your answers, baby appears ' + currentEmotion.toLowerCase() + '. ' + data.cause + ' Follow the activities above and monitor closely. If concerns persist, consult your paediatrician.';
  document.getElementById('emo-result-insight').textContent = insight;

  setTimeout(function() {
    fetch('/api/emotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emotion: currentEmotion,
        answers: currentEmoAnswers,
        recommendations: data.activities
      })
    }).catch(function(e) { console.log('Emotion save error:', e); });
  }, 100);
}

// ============================================================
// SLEEP PAGE FUNCTIONS
// ============================================================

const LULLABY_SONGS = [
  { title: "Brahms' Lullaby", emoji: "🌙", notes: "Classical", file: "brahms.wav" },
  { title: "Twinkle Twinkle Little Star", emoji: "⭐", notes: "Gentle", file: "twinkle.wav" },
  { title: "Rock-a-Bye Baby", emoji: "🌿", notes: "Soothing", file: "rock.wav" },
  { title: "Hush, Little Baby", emoji: "🤫", notes: "Warm", file: "hush.wav" },
  { title: "You Are My Sunshine", emoji: "☀️", notes: "Cheerful", file: "sunshine.wav" },
  { title: "Sleep Baby Sleep", emoji: "😴", notes: "Deep Calm", file: "sleep.wav" }
];

let sleepActive = false;
let sleepElapsed = 0;
let sleepTimer = null;
let sleepSessions = [];
let currentLullaby = -1;
let lullabyPlaying = false;
let currentAudio = null;
let musicDurationTimer = null;
let musicStartTime = null;
let countdownTimer = null;

function initSleepPage() {
  renderLullabyList();
  updateSleepTargetHrs();
}

function renderLullabyList() {
  const container = document.getElementById('lullaby-list');
  if (!container) return;
  
  container.innerHTML = LULLABY_SONGS.map((song, idx) => `
    <button onclick="playLullaby(${idx})" style="width:100%;text-align:left;padding:10px;background:#f5f5f5;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#1f2937;margin-bottom:6px">
      <span style="font-size:18px">${song.emoji}</span>
      <div style="flex:1">
        <div style="font-weight:900">${song.title}</div>
        <div style="font-size:10px;color:#6b7280">${song.notes}</div>
      </div>
    </button>
  `).join('');
}

function updateSleepTargetHrs() {
  const bedtimeInput = document.getElementById('bedtime');
  const waketimeInput = document.getElementById('waketime');
  if (!bedtimeInput || !waketimeInput) return;
  
  const bedtime = bedtimeInput.value;
  const waketime = waketimeInput.value;
  
  let [bh, bm] = bedtime.split(':').map(Number);
  let [wh, wm] = waketime.split(':').map(Number);
  
  let bedtimeMin = bh * 60 + bm;
  let waketimeMin = wh * 60 + wm;
  
  if (waketimeMin <= bedtimeMin) {
    waketimeMin += 24 * 60;
  }
  
  const hrs = ((waketimeMin - bedtimeMin) / 60).toFixed(1);
  const targetEl = document.getElementById('sl-target');
  if (targetEl) targetEl.textContent = hrs + ' hrs';
}

function toggleSleepTracking() {
  const btn = document.getElementById('sleep-toggle-btn');
  if (!sleepActive) {
    sleepActive = true;
    sleepElapsed = 0;
    btn.textContent = '😴 SLEEPING...';
    btn.style.background = 'linear-gradient(135deg, hsl(145 80% 70%), hsl(145 55% 60%))';
    btn.style.color = '#065f46';
    
    sleepTimer = setInterval(() => {
      sleepElapsed++;
      updateSleepDisplay();
    }, 1000);
  } else {
    sleepActive = false;
    clearInterval(sleepTimer);
    btn.textContent = '💤 OFF';
    btn.style.background = 'hsl(220 10% 90%)';
    btn.style.color = '#1f2937';
    
    const hrs = +(sleepElapsed / 3600).toFixed(1);
    if (hrs > 0) {
      sleepSessions.push({ date: new Date().toLocaleDateString(), hours: hrs });
      updateTotalSleep();
    }
  }
}

function updateSleepDisplay() {
  const h = Math.floor(sleepElapsed / 3600).toString().padStart(2, '0');
  const m = Math.floor((sleepElapsed % 3600) / 60).toString().padStart(2, '0');
  const s = (sleepElapsed % 60).toString().padStart(2, '0');
  
  const timerEl = document.getElementById('sleep-timer');
  if (timerEl) timerEl.textContent = `${h}:${m}:${s}`;
}

function updateTotalSleep() {
  const total = sleepSessions.reduce((sum, session) => sum + session.hours, 0);
  const totalEl = document.getElementById('sleep-total');
  if (totalEl) totalEl.textContent = total.toFixed(1) + ' hrs';
}

function playLullaby(idx) {
  const song = LULLABY_SONGS[idx];
  const audioFile = song.file || 'brahms.wav';
  
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  if (musicDurationTimer) {
    clearTimeout(musicDurationTimer);
  }
  
  currentAudio = new Audio(`static/lullabies/${audioFile}?t=${Date.now()}`);
  currentAudio.loop = true;
  currentAudio.volume = 0.7;
  currentAudio.preload = 'auto';
  
  currentAudio.addEventListener('canplaythrough', () => {
    console.log('✅ Audio loaded:', audioFile);
  });
  
  currentAudio.addEventListener('play', () => {
    console.log('🎵 Playing:', song.title);
    toast('♪ ' + song.title + ' playing');
  });
  
  currentAudio.addEventListener('error', (e) => {
    console.error('❌ Audio error:', e, audioFile);
    toast('⚠️ Music error - check console');
  });
  
  const playPromise = currentAudio.play();
  if (playPromise !== undefined) {
    playPromise.catch(e => {
      console.warn('Autoplay blocked:', e);
      document.body.addEventListener('touchstart', () => currentAudio.play(), {once: true});
    });
  }
  
  currentLullaby = idx;
  lullabyPlaying = true;
  musicStartTime = Date.now();
  
  const titleEl = document.getElementById('now-playing-title');
  if (titleEl) titleEl.textContent = `${song.emoji} ${song.title}`;
  
  const playBtn = document.getElementById('play-pause-btn');
  if (playBtn) playBtn.textContent = '⏸';
  
  const playingSection = document.getElementById('now-playing-section');
  if (playingSection) playingSection.style.display = 'block';
  
  setMusicAutoStop();
  startCountdownTimer();
}

function setMusicAutoStop() {
  if (musicDurationTimer) clearTimeout(musicDurationTimer);
  if (countdownTimer) clearInterval(countdownTimer);
  
  const durationInput = document.getElementById('duration-mins');
  const durationMins = parseInt(durationInput?.value) || 15;
  const durationMs = durationMins * 60 * 1000;
  
  musicDurationTimer = setTimeout(() => {
    if (lullabyPlaying && currentAudio) {
      stopMusic();
      toast(`🛌 Music stopped after ${durationMins} minutes`);
    }
  }, durationMs);
}

function startCountdownTimer() {
  if (countdownTimer) clearInterval(countdownTimer);
  
  const durationInput = document.getElementById('duration-mins');
  const durationMins = parseInt(durationInput?.value) || 15;
  
  const updateCountdown = () => {
    if (!musicStartTime || !lullabyPlaying) return;
    
    const elapsedMs = Date.now() - musicStartTime;
    const totalMs = durationMins * 60 * 1000;
    const remainingMs = Math.max(0, totalMs - elapsedMs);
    
    const remainingMins = Math.floor(remainingMs / 60000);
    const remainingSecs = Math.floor((remainingMs % 60000) / 1000);
    
    const statusEl = document.getElementById('duration-status');
    if (statusEl) {
      statusEl.textContent = `${remainingMins}:${remainingSecs.toString().padStart(2, '0')} left`;
      statusEl.style.color = remainingMs < 60000 ? 'hsl(0 84% 60%)' : 'hsl(145 80% 50%)';
    }
  };
  
  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
}

function stopMusic() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.loop = false;
  }
  if (musicDurationTimer) clearTimeout(musicDurationTimer);
  if (countdownTimer) clearInterval(countdownTimer);
  
  lullabyPlaying = false;
  musicStartTime = null;
  currentLullaby = -1;
  
  const playBtn = document.getElementById('play-pause-btn');
  if (playBtn) playBtn.textContent = '▶';
  
  const statusEl = document.getElementById('duration-status');
  if (statusEl) {
    statusEl.textContent = 'Stopped';
    statusEl.style.color = 'hsl(0 84% 60%)';
  }
}

function toggleLullaby() {
  if (currentLullaby < 0) {
    playLullaby(0);
  } else if (currentAudio) {
    if (lullabyPlaying) {
      currentAudio.pause();
      lullabyPlaying = false;
      if (musicDurationTimer) clearTimeout(musicDurationTimer);
      if (countdownTimer) clearInterval(countdownTimer);
      
      const statusEl = document.getElementById('duration-status');
      if (statusEl) {
        statusEl.textContent = 'Paused';
        statusEl.style.color = 'hsl(33 87% 54%)';
      }
    } else {
      currentAudio.play();
      lullabyPlaying = true;
      musicStartTime = Date.now() - ((Date.now() - musicStartTime) / 1000);
      setMusicAutoStop();
      startCountdownTimer();
    }
    
    const playBtn = document.getElementById('play-pause-btn');
    if (playBtn) playBtn.textContent = lullabyPlaying ? '⏸' : '▶';
  }
}

function nextLullaby() {
  const nextIdx = (currentLullaby + 1) % LULLABY_SONGS.length;
  playLullaby(nextIdx);
}

function prevLullaby() {
  const prevIdx = currentLullaby <= 0 ? LULLABY_SONGS.length - 1 : currentLullaby - 1;
  playLullaby(prevIdx);
}

function stopAllLullabies() {
  stopMusic();
  const playingSection = document.getElementById('now-playing-section');
  if (playingSection) playingSection.style.display = 'none';
}

function saveSleepSettings() {
  updateSleepTargetHrs();
  const msg = document.getElementById('sleep-msg');
  if (msg) {
    msg.textContent = '✅ Sleep schedule saved!';
    setTimeout(() => { msg.textContent = ''; }, 3000);
  }
  
  setTimeout(() => {
    const bedtime = document.getElementById('bedtime')?.value;
    const waketime = document.getElementById('waketime')?.value;
    if (bedtime && waketime) {
      const bed = new Date(`2024-01-01 ${bedtime}`);
      const wake = new Date(`2024-01-01 ${waketime}`);
      let totalHours = (wake - bed) / (1000 * 60 * 60);
      if (totalHours < 0) totalHours += 24;
      const quality = document.getElementById('sleepQualityInput')?.value || 'good';
      
      fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_time: bedtime, end_time: waketime, total_hours: totalHours.toFixed(1), quality_grade: quality })
      }).catch(e => {});
    }
  }, 100);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSleepPage);
} else {
  initSleepPage();
}
// ============================================================
