import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { useAppState } from "@/context/AppContext";
import { SONGS } from "@/data/songs";
import { playSong, stopSong, pauseSong, resumeSong } from "@/lib/audioEngine";

export default function SleepPage() {
  const nav = useNavigate();
  const { addSleepLog } = useAppState();
  const [sleeping, setSleeping] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [totalHrs, setTotalHrs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Music state
  const [songIdx, setSongIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopSong();
    };
  }, []);

  const toggleSleep = () => {
    if (!sleeping) {
      setSleeping(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      setSleeping(false);
      if (timerRef.current) clearInterval(timerRef.current);
      const hrs = +(elapsed / 3600).toFixed(1);
      setTotalHrs(t => t + hrs);
      if (hrs > 0) {
        addSleepLog({ d: new Date().toLocaleDateString(), hrs: String(hrs), q: hrs >= 2 ? "Good" : hrs >= 1 ? "Fair" : "Short" });
      }
    }
  };

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const handlePlaySong = (idx: number) => {
    if (songIdx === idx && isPlaying) {
      pauseSong();
      setIsPlaying(false);
    } else {
      playSong(idx);
      setSongIdx(idx);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseSong();
      setIsPlaying(false);
    } else if (songIdx >= 0) {
      resumeSong(songIdx);
      setIsPlaying(true);
    } else {
      handlePlaySong(0);
    }
  };

  const nextS = () => handlePlaySong(songIdx < 0 ? 0 : (songIdx + 1) % SONGS.length);
  const prevS = () => handlePlaySong(songIdx <= 0 ? SONGS.length - 1 : songIdx - 1);

  return (
    <>
      <PageHeader title="Sleep Schedule" onBack={() => { stopSong(); nav("/home"); }} />
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* Sleep Tracker */}
        <div className="bg-card rounded-2xl p-3" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="font-display text-xs font-black text-primary uppercase mb-2">😴 Sleep Tracker</div>
          <button onClick={toggleSleep}
            className="w-full h-14 rounded-2xl border-none text-sm font-display font-black transition-all"
            style={{
              background: sleeping ? "var(--gradient-green)" : "hsl(220 10% 90%)",
              color: sleeping ? "#065f46" : "#6b7280",
              animation: sleeping ? "glow 2s infinite" : "none",
            }}>
            {sleeping ? "😴 SLEEPING... Tap to Stop" : "💤 OFF — Tap to Start"}
          </button>
          <div className="mt-2 rounded-xl p-3 text-center font-display text-3xl font-black tracking-wider"
            style={{ background: "linear-gradient(135deg, hsl(145 80% 97%), hsl(145 55% 92%))", fontVariantNumeric: "tabular-nums" }}>
            {fmt(elapsed)}
          </div>
          <div className="mt-2 rounded-xl p-2.5 text-center" style={{ background: "hsl(210 80% 93%)" }}>
            <span className="font-display text-lg font-black" style={{ color: "#1e40af" }}>{totalHrs.toFixed(1)} hrs</span>
            <span className="text-[10px] text-muted-foreground ml-1 font-bold">total sleep</span>
          </div>
        </div>

        {/* Music Album */}
        <div className="bg-card rounded-2xl p-3" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(330 80% 80%), hsl(270 60% 70%))" }}>🎵</div>
            <div>
              <div className="font-display font-black text-sm text-baby-rose">Melody Baby Album</div>
              <div className="text-[10px] text-muted-foreground font-bold">{SONGS.length} Soothing Lullabies</div>
            </div>
          </div>

          {/* Now Playing */}
          {songIdx >= 0 && (
            <div className="rounded-xl p-3 mb-3" style={{ background: "linear-gradient(135deg, hsl(270 50% 98%), hsl(210 60% 97%))" }}>
              <div className="text-[10px] font-display font-black mb-1" style={{ color: "hsl(270 60% 70%)" }}>♪ NOW PLAYING</div>
              <div className="font-display font-black text-sm text-foreground mb-2">
                {SONGS[songIdx].emoji} {SONGS[songIdx].title}
              </div>
              {/* Waveform */}
              <div className="flex items-end gap-[3px] h-6 mb-2.5">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="rounded-sm"
                    style={{
                      width: 4,
                      height: 8 + Math.sin(i * 0.8) * 10,
                      background: i % 3 === 0 ? "hsl(270 60% 70%)" : i % 3 === 1 ? "hsl(330 81% 60%)" : "hsl(270 70% 50%)",
                      animation: isPlaying ? `waveAnim 0.6s ease-in-out infinite` : "none",
                      animationDelay: `${i * 0.08}s`,
                      transformOrigin: "bottom",
                    }} />
                ))}
              </div>
              {/* Controls */}
              <div className="flex items-center gap-2.5 justify-center">
                <button onClick={prevS} className="w-9 h-9 rounded-full text-base cursor-pointer border-none"
                  style={{ background: "hsl(270 60% 95%)" }}>⏮</button>
                <button onClick={togglePlay} className="w-11 h-11 rounded-full text-lg cursor-pointer border-none text-primary-foreground"
                  style={{ background: "linear-gradient(135deg, hsl(330 81% 60%), hsl(270 60% 70%))", boxShadow: "var(--shadow-btn)" }}>
                  {isPlaying ? "⏸" : "▶"}
                </button>
                <button onClick={nextS} className="w-9 h-9 rounded-full text-base cursor-pointer border-none"
                  style={{ background: "hsl(270 60% 95%)" }}>⏭</button>
              </div>
            </div>
          )}

          {/* Song List */}
          <div className="flex flex-col gap-1.5">
            {SONGS.map((song, i) => (
              <button key={i} onClick={() => handlePlaySong(i)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-[1.5px] transition-all text-left active:scale-[0.97]"
                style={{
                  background: i === songIdx ? "linear-gradient(135deg, hsl(270 50% 98%), hsl(210 60% 97%))" : "hsl(270 40% 99%)",
                  borderColor: i === songIdx ? "hsl(270 60% 70%)" : "hsl(270 30% 95%)",
                }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(270 50% 98%), hsl(270 40% 93%))" }}>
                  {song.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-black text-xs text-foreground truncate">{song.title}</div>
                  <div className="text-[10px] text-muted-foreground font-bold mt-0.5">{song.mood} · {song.bpm} BPM</div>
                </div>
                <span className="text-lg flex-shrink-0">{i === songIdx && isPlaying ? "⏸" : "▶️"}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
