import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EMO_QUESTIONS, EMO_DATA } from "@/data/emotions";

type Step = "upload" | "scanning" | "detected" | "questions" | "result";

const EMOTIONS = [
  { key: "Happy", emoji: "😊", bg: "linear-gradient(135deg, hsl(145 55% 92%), hsl(145 50% 82%))", border: "#86efac", color: "#15803d" },
  { key: "Sad", emoji: "😢", bg: "linear-gradient(135deg, hsl(210 80% 93%), hsl(210 70% 87%))", border: "#93c5fd", color: "#1e40af" },
  { key: "Suffocated", emoji: "😫", bg: "linear-gradient(135deg, hsl(45 95% 90%), hsl(45 85% 80%))", border: "#f59e0b", color: "#92400e" },
  { key: "Cry", emoji: "😭", bg: "linear-gradient(135deg, hsl(0 80% 93%), hsl(0 70% 85%))", border: "#fca5a5", color: "#b91c1c" },
];

export default function EmotionsPage() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("upload");
  const [emotion, setEmotion] = useState("");
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [confidence, setConfidence] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setEmotion("");
    setQIdx(0);
    setAnswers([]);
    setUploadedImage("");
    setConfidence(0);
    setScanMessage("");
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // For video files, extract first frame
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          video.currentTime = 0;
        };
        
        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            resolve(canvas.toDataURL('image/jpeg').split(',')[1]);
          }
        };
        
        video.onerror = () => reject(new Error("Could not load video"));
        video.src = URL.createObjectURL(file);
      } else {
        // Image file handling
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      }
    });
  };

  // Handle photo/video upload
  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      setScanMessage("📸 Processing image...");
      
      const b64 = await fileToBase64(file);
      setUploadedImage(b64);
      
      setScanMessage("🤖 AI is scanning baby's face...");
      setStep("scanning");

      const response = await fetch("/api/detect-emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // IMPORTANT: Send cookies with request
        body: JSON.stringify({ image: b64 }),
      });

      const data = await response.json();

      if (!response.ok) {
        setScanMessage(`❌ Error: ${data.error || 'Please login first'}`);
        setTimeout(() => setStep("upload"), 2000);
        return;
      }

      if (data.has_face) {
        setScanMessage(`✅ ${data.message}`);
        setEmotion(data.emotion);
        setConfidence(data.confidence);
        setQIdx(0);
        setAnswers([]);
        setTimeout(() => setStep("detected"), 1500);
      } else {
        setScanMessage("❌ No face detected. Please try another photo with baby's face clearly visible.");
        setTimeout(() => setStep("upload"), 2000);
      }
    } catch (error) {
      setScanMessage(`❌ Upload failed: ${error}`);
      setTimeout(() => setStep("upload"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const startQuestions = () => {
    setStep("questions");
  };

  const answerQuestion = (opt: string) => {
    const newAnswers = [...answers, opt];
    setAnswers(newAnswers);
    const qs = EMO_QUESTIONS[emotion];
    if (qIdx + 1 >= qs.length) {
      setStep("result");
    } else {
      setQIdx(qIdx + 1);
    }
  };

  const data = emotion ? EMO_DATA[emotion] : null;
  const questions = emotion ? EMO_QUESTIONS[emotion] : [];

  // Build result insight
  const getInsight = () => {
    if (!data) return "";
    for (const ans of answers) {
      if (data.insights[ans]) return data.insights[ans];
    }
    return `Based on your answers, baby appears to be in a ${emotion.toLowerCase()} state. Follow the recommended activities above and monitor closely. If symptoms persist, consult your paediatrician.`;
  };

  return (
    <>
      <PageHeader title="Baby Emotions" onBack={() => { reset(); nav("/home"); }} />
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        
        {/* Step 1: Upload Photo/Video */}
        {step === "upload" && (
          <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-center mb-4">
              <div className="font-display text-sm font-black text-primary mb-1">📸 Scan Baby's Face</div>
              <p className="text-xs text-muted-foreground">Upload a photo or video to detect emotion with AI</p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />

            <div className="flex gap-2 mb-4">
              <button
                onClick={handlePhotoClick}
                className="flex-1 rounded-xl py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-display font-black text-sm active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
              >
                📷 Upload Photo
              </button>
              <button
                onClick={handlePhotoClick}
                className="flex-1 rounded-xl py-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white font-display font-black text-sm active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
              >
                🎥 Upload Video
              </button>
            </div>

            <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground text-center">
              ✅ Make sure baby's face is clearly visible in good lighting
            </div>
          </div>
        )}

        {/* Step 2: Scanning */}
        {step === "scanning" && (
          <div className="bg-card rounded-2xl p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-5xl mb-4 animate-bounce">🤖</div>
            <div className="font-display font-black text-base text-primary mb-2">AI is Scanning...</div>
            <p className="text-sm text-muted-foreground mb-4">{scanMessage}</p>
            <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-400 to-purple-500 h-full w-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Step 3: Face Detected - Show emotion with confidence */}
        {step === "detected" && emotion && data && (
          <>
            <div className="bg-card rounded-2xl p-4 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="text-6xl mb-3 leading-none">{data.ico}</div>
              <div className="font-display font-black text-lg mb-1" style={{ color: data.color }}>
                {emotion} Detected!
              </div>
              <div className="text-2xl font-black text-primary mb-2">{confidence.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mb-4">AI Confidence Level</p>
              
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden mb-4">
                <div
                  className="bg-gradient-to-r from-pink-400 to-purple-500 h-full transition-all duration-500"
                  style={{ width: `${confidence}%` }}
                ></div>
              </div>

              {uploadedImage && (
                <div className="mb-4 rounded-xl overflow-hidden max-h-40">
                  <img src={`data:image/jpeg;base64,${uploadedImage}`} alt="Baby" className="w-full h-auto object-cover" />
                </div>
              )}
            </div>

            <button
              onClick={startQuestions}
              className="w-full rounded-xl py-3 text-sm font-display font-black text-primary-foreground active:scale-[0.97] transition-transform"
              style={{ background: "var(--gradient-btn)", boxShadow: "var(--shadow-btn)" }}
            >
              ✅ Continue to AI Questions
            </button>

            <button
              onClick={reset}
              className="w-full rounded-xl py-3 bg-muted text-xs font-extrabold text-muted-foreground font-display"
            >
              ← Try Another Photo
            </button>
          </>
        )}

        {/* Step 4: AI Questions */}
        {step === "questions" && data && (
          <>
            <div className="bg-card rounded-2xl p-4 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="text-[44px] mb-1">{data.ico}</div>
              <div className="font-display font-black text-base text-baby-rose">{emotion} Baby</div>
              <p className="text-xs text-muted-foreground">AI is asking you some questions to understand baby better</p>
            </div>

            <div className="bg-card rounded-2xl p-3" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: "var(--gradient-purple)" }}>🤖</div>
                <div className="font-display font-black text-sm" style={{ color: "#5b21b6" }}>AI Assistant</div>
                <div className="ml-auto text-[10px] text-muted-foreground font-bold font-display">
                  Question {qIdx + 1} of {questions.length}
                </div>
              </div>

              <div className="text-sm font-extrabold text-foreground leading-relaxed mb-3 rounded-xl p-3"
                style={{ background: "hsl(270 50% 98%)", borderLeft: "4px solid hsl(270 60% 70%)" }}>
                {questions[qIdx].q}
              </div>

              <div className="flex flex-col gap-2">
                {questions[qIdx].opts.map(opt => (
                  <button key={opt} onClick={() => answerQuestion(opt)}
                    className="w-full text-left rounded-xl border-2 border-border bg-card px-3.5 py-3 text-xs font-extrabold text-foreground transition-all hover:border-accent hover:bg-muted active:scale-[0.97]">
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={reset}
              className="w-full rounded-xl py-3 bg-muted text-xs font-extrabold text-muted-foreground font-display">
              ← Back to Upload
            </button>
          </>
        )}

        {/* Step 5: Result & Analysis */}
        {step === "result" && data && (
          <>
            <div className="bg-card rounded-2xl p-4 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="text-[52px] mb-2 leading-none">{data.ico}</div>
              <div className="font-display font-black text-base mb-3" style={{ color: data.color }}>
                {emotion} Baby — Here Is What To Do
              </div>

              <div className="italic text-sm text-muted-foreground rounded-xl p-3 text-left mb-3"
                style={{ background: "hsl(270 50% 98%)", borderLeft: "4px solid hsl(270 60% 70%)" }}>
                "{data.quotes[Math.floor(Math.random() * data.quotes.length)]}"
              </div>

              <div className="rounded-xl p-3 text-left"
                style={{ background: "hsl(25 100% 97%)", borderLeft: "4px solid hsl(25 90% 60%)" }}>
                <div className="font-display font-black text-[11px] uppercase tracking-wide mb-2" style={{ color: "#ea580c" }}>
                  ✅ Recommended Activities
                </div>
                <div className="text-xs text-foreground leading-relaxed space-y-2">
                  {data.activities.map((a, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 mt-0.5 text-primary-foreground"
                        style={{ background: data.color }}>{i + 1}</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-3" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                  style={{ background: "var(--gradient-purple)" }}>🤖</div>
                <div className="font-display font-black text-xs" style={{ color: "#5b21b6" }}>AI Personalised Insight</div>
              </div>
              <div className="text-xs text-foreground leading-relaxed rounded-lg p-3"
                style={{ background: "hsl(270 50% 98%)" }}>
                {getInsight()}
              </div>
            </div>

            <button onClick={reset}
              className="w-full rounded-xl py-3 text-sm font-display font-black text-primary-foreground"
              style={{ background: "var(--gradient-btn)", boxShadow: "var(--shadow-btn)" }}>
              📸 Scan Another Baby Photo
            </button>
          </>
        )}
      </div>
    </>
  );
}
