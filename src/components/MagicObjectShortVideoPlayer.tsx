import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  Film,
  Music,
  Settings,
  Download,
  Share2,
  X,
  FastForward,
  Video,
  ExternalLink,
  Layers,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { MagicObjectItem } from './LowerSchoolMagicStudio';

interface MagicObjectShortVideoPlayerProps {
  object: MagicObjectItem;
  autoPlay?: boolean;
  onClose?: () => void;
  onOpenVideoStudio?: (prompt?: string) => void;
}

export default function MagicObjectShortVideoPlayer({
  object,
  autoPlay = true,
  onClose,
  onOpenVideoStudio
}: MagicObjectShortVideoPlayerProps) {
  // Video playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const duration = 15; // 15-second short video
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sceneTheme, setSceneTheme] = useState<'classroom' | 'garden' | 'space' | 'castle'>('classroom');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [captionsText, setCaptionsText] = useState<string>('');
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const spokenPhasesRef = useRef<{ [key: string]: boolean }>({});

  // Clean object name into uppercase letters array for spelling
  const cleanName = object.name.toUpperCase().replace(/[^A-Z]/g, '');
  const letters = cleanName.split('');

  // Audio effects synthesizer using Web Audio API
  const playWebAudioTone = (freq: number, type: OscillatorType = 'sine', durationSec = 0.2) => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch (e) {
      // Audio fallback
    }
  };

  // Speech narration helper
  const speakText = (text: string, rate = 0.9) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate * playbackSpeed;
      utterance.pitch = 1.3; // Cute high pitch for children
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // Speech fallback
    }
  };

  // Video playback clock loop
  useEffect(() => {
    if (!isPlaying) return;

    lastTimeRef.current = Date.now();

    const updateClock = () => {
      const now = Date.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCurrentTime(prev => {
        const next = prev + delta * playbackSpeed;
        if (next >= duration) {
          setIsPlaying(false);
          // Trigger victory celebration on video end
          try {
            confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
          } catch (e) {}
          return duration;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(updateClock);
    };

    animFrameRef.current = requestAnimationFrame(updateClock);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, duration]);

  // Synchronize audio narration and letter popping sound effects based on currentTime
  useEffect(() => {
    // 0:00 - 0:02 Intro
    if (currentTime >= 0.2 && currentTime < 2.0 && !spokenPhasesRef.current['intro']) {
      spokenPhasesRef.current['intro'] = true;
      setCaptionsText(`🎵 [Upbeat xylophone music plays... ${object.name} enters the classroom!]`);
      playWebAudioTone(523.25, 'triangle', 0.25); // C5
      setTimeout(() => playWebAudioTone(659.25, 'triangle', 0.25), 150); // E5
      setTimeout(() => playWebAudioTone(783.99, 'triangle', 0.3), 300); // G5
    }

    // 0:02 - 0:05 Greeting
    if (currentTime >= 2.0 && currentTime < 5.0 && !spokenPhasesRef.current['greeting']) {
      spokenPhasesRef.current['greeting'] = true;
      const greeting = `Hello! I am a ${object.name}. Let's spell ${object.name}!`;
      setCaptionsText(`"Hello! I am a ${object.name}. Let's spell ${object.name}!" 👋`);
      speakText(greeting, 0.95);
    }

    // 0:05 - 0:11 Spelling Phase (letters drop in)
    if (currentTime >= 5.0 && currentTime < 11.0) {
      const spellingDuration = 6.0;
      const progressInPhase = (currentTime - 5.0) / spellingDuration;
      const activeLetterIndex = Math.min(
        letters.length - 1,
        Math.floor(progressInPhase * letters.length)
      );

      const letterKey = `letter-${activeLetterIndex}`;
      if (!spokenPhasesRef.current[letterKey] && activeLetterIndex >= 0) {
        spokenPhasesRef.current[letterKey] = true;
        const letter = letters[activeLetterIndex];
        setCaptionsText(`Spelling: "${letters.slice(0, activeLetterIndex + 1).join(' - ')}" ✨`);
        speakText(letter, 1.1);
        // Play popping chime per letter
        playWebAudioTone(400 + activeLetterIndex * 90, 'sine', 0.2);
      }
    }

    // 0:11 - 0:15 Victory Dance
    if (currentTime >= 11.0 && !spokenPhasesRef.current['victory']) {
      spokenPhasesRef.current['victory'] = true;
      const outro = `${object.name}! Great job! You are a super star learner!`;
      setCaptionsText(`"${object.name}! Great job! You are a super star learner!" ⭐🎉`);
      speakText(outro, 1.0);
      playWebAudioTone(880, 'triangle', 0.4);
    }
  }, [currentTime, object.name, letters, isMuted, playbackSpeed]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (currentTime >= duration) {
      handleReplay();
    } else {
      setIsPlaying(!isPlaying);
      if (isPlaying && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  // Handle Replay
  const handleReplay = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    spokenPhasesRef.current = {};
    setCurrentTime(0);
    setIsPlaying(true);
  };

  // Handle Timeline Scrubber Click/Drag
  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentTime(newTime);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Format seconds into 0:00
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Derived animation parameters based on currentTime
  const isWalking = currentTime < 2.0 || (currentTime >= 11.0 && currentTime < 15.0);
  const isWaving = currentTime >= 2.0 && currentTime < 5.0;
  const isSpelling = currentTime >= 5.0 && currentTime < 11.0;
  const isDancing = currentTime >= 11.0;

  // Active letter index during spelling phase (0:05 - 0:11)
  const spellingProgress = Math.max(0, Math.min(1, (currentTime - 5.0) / 6.0));
  const activeLetterCount = isSpelling || isDancing
    ? (isDancing ? letters.length : Math.floor(spellingProgress * letters.length) + 1)
    : 0;

  return (
    <div className="w-full space-y-4">
      {/* MAIN VIDEO FRAME CONTAINER */}
      <div
        ref={videoContainerRef}
        className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border-4 border-amber-400/80 shadow-2xl transition-all ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'aspect-video md:min-h-[420px]'
        }`}
      >
        {/* TOP VIDEO BADGE & HEADER BAR */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 md:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between text-white pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md">
              <Film className="w-3.5 h-3.5 fill-slate-950" />
              <span>Animated Short Video</span>
            </span>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-xs border border-white/20">
              {object.emoji} {object.name} Lesson
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Scene Theme Switcher Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md text-xs font-bold text-white border border-white/20 flex items-center gap-1.5 cursor-pointer transition"
              >
                <Palette className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden md:inline">Scene:</span>
                <span className="capitalize text-amber-300 font-extrabold">{sceneTheme}</span>
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 p-2 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl z-40 text-xs space-y-1"
                  >
                    <div className="px-2 py-1 font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">
                      Select Background Stage
                    </div>
                    {[
                      { id: 'classroom', label: '🏫 Magic Classroom', icon: '🏫' },
                      { id: 'garden', label: '🌳 Sunny Garden', icon: '🌳' },
                      { id: 'space', label: '🚀 Cosmic Space', icon: '🚀' },
                      { id: 'castle', label: '🏰 Fairy Tale Castle', icon: '🏰' }
                    ].map(st => (
                      <button
                        key={st.id}
                        onClick={() => {
                          setSceneTheme(st.id as any);
                          setShowSettings(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-xl text-left font-bold transition flex items-center justify-between cursor-pointer ${
                          sceneTheme === st.id ? 'bg-amber-400 text-slate-950 font-black' : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Open in Full AI Video Studio */}
            {onOpenVideoStudio && (
              <button
                onClick={() => onOpenVideoStudio(`Create a 3D animated educational video of ${object.name} in a ${sceneTheme} spelling its name out loud with colorful bouncy blocks`)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs border border-purple-400/40 flex items-center gap-1.5 cursor-pointer shadow-md transition"
                title="Open in AI Video Studio"
              >
                <Video className="w-3.5 h-3.5 text-yellow-300" />
                <span className="hidden sm:inline">AI Cinema Studio</span>
              </button>
            )}

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-black/50 hover:bg-black/70 text-white cursor-pointer transition border border-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ---------------- BACKGROUND STAGE RENDERING LAYER ---------------- */}
        <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none">
          {/* 1. CLASSROOM THEME (Matching the user's uploaded video!) */}
          {sceneTheme === 'classroom' && (
            <div className="absolute inset-0 bg-gradient-to-b from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-purple-950 dark:to-slate-950">
              {/* Classroom Wall Window & Sunlight Beam */}
              <div className="absolute top-6 left-10 w-44 h-36 bg-cyan-200/60 dark:bg-cyan-900/40 rounded-2xl border-4 border-amber-800/40 overflow-hidden shadow-inner flex flex-col justify-between">
                <div className="w-full h-1/2 bg-sky-300/50 flex items-center justify-center">
                  <span className="text-3xl animate-spin-slow">☀️</span>
                </div>
                <div className="w-full h-1/2 bg-emerald-200/50" />
                {/* Window panes */}
                <div className="absolute inset-0 border-r-2 border-b-2 border-amber-900/30 m-auto" />
              </div>

              {/* Smiling Wall Sun Decoration */}
              <div className="absolute top-8 right-16 flex flex-col items-center animate-pulse">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 border-4 border-yellow-200 shadow-[0_0_30px_rgba(251,191,36,0.6)] flex items-center justify-center text-3xl">
                  😊
                </div>
              </div>

              {/* Classroom Chalkboard & Posters */}
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 md:w-80 h-24 bg-emerald-900 rounded-xl border-4 border-amber-900/60 shadow-lg p-2 flex flex-col justify-between text-white text-center">
                <div className="text-[10px] font-extrabold text-amber-300 tracking-wider uppercase">
                  ✨ Lower School Magic Studio ✨
                </div>
                <div className="text-xs font-bold text-emerald-100">
                  Topic: {object.name} ({object.gradeLevel})
                </div>
                <div className="flex justify-center gap-1 text-[11px] text-yellow-200">
                  <span>🔴</span> <span>🟢</span> <span>🔵</span> <span>🟡</span>
                </div>
              </div>

              {/* Classroom Toy Shelves & Chairs in Background */}
              <div className="absolute bottom-16 left-6 flex items-end gap-2 opacity-80">
                <div className="w-16 h-24 bg-amber-200 dark:bg-slate-800 rounded-t-lg border-2 border-amber-400 p-1 flex flex-col justify-between">
                  <div className="text-xs">🧸 🚀</div>
                  <div className="text-xs">📚 🧩</div>
                  <div className="text-xs">🎨 🎺</div>
                </div>
              </div>

              <div className="absolute bottom-16 right-8 flex items-end gap-3 opacity-80">
                {/* Small colorful chairs */}
                <div className="w-10 h-12 bg-rose-400 rounded-t-lg border-2 border-rose-600 flex items-center justify-center text-xs">🪑</div>
                <div className="w-10 h-12 bg-cyan-400 rounded-t-lg border-2 border-cyan-600 flex items-center justify-center text-xs">🪑</div>
                <div className="w-10 h-12 bg-yellow-400 rounded-t-lg border-2 border-yellow-600 flex items-center justify-center text-xs">🪑</div>
              </div>

              {/* Classroom Wooden Floor / Rug */}
              <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-amber-300 via-amber-200 to-amber-100/50 dark:from-slate-900 dark:via-slate-800 border-t-4 border-amber-400/50 flex items-center justify-center">
                {/* Colorful circular rug */}
                <div className="w-3/4 h-14 rounded-full bg-gradient-to-r from-cyan-300/40 via-yellow-300/40 to-pink-300/40 border-2 border-dashed border-white/60" />
              </div>
            </div>
          )}

          {/* 2. SUNNY GARDEN THEME */}
          {sceneTheme === 'garden' && (
            <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-100 to-emerald-200 dark:from-slate-950 dark:to-emerald-950">
              <div className="absolute top-6 right-10 text-5xl animate-spin-slow">☀️</div>
              <div className="absolute top-12 left-12 text-4xl animate-bounce">🌈</div>
              <div className="absolute bottom-0 inset-x-0 h-24 bg-emerald-500/80 rounded-t-full border-t-4 border-emerald-400 flex items-center justify-around text-2xl">
                <span>🌸</span> <span>🌻</span> <span>🦋</span> <span>🌺</span> <span>🌷</span>
              </div>
            </div>
          )}

          {/* 3. COSMIC SPACE THEME */}
          {sceneTheme === 'space' && (
            <div className="absolute inset-0 bg-gradient-to-b from-purple-950 via-slate-950 to-indigo-950">
              <div className="absolute top-8 left-10 text-4xl animate-pulse">🪐</div>
              <div className="absolute top-16 right-16 text-3xl animate-bounce">🚀</div>
              <div className="absolute inset-0 flex items-center justify-around opacity-60 text-xl">
                <span>⭐</span> <span>✨</span> <span>💫</span> <span>🌌</span> <span>🌟</span>
              </div>
            </div>
          )}

          {/* 4. FAIRY TALE CASTLE THEME */}
          {sceneTheme === 'castle' && (
            <div className="absolute inset-0 bg-gradient-to-b from-pink-200 via-purple-100 to-indigo-200 dark:from-purple-950 dark:to-slate-950">
              <div className="absolute top-8 left-1/2 -translate-x-1/2 text-6xl">🏰</div>
              <div className="absolute bottom-0 inset-x-0 h-16 bg-purple-300/50 border-t-2 border-purple-400" />
            </div>
          )}
        </div>

        {/* ---------------- 3D FLOATING SPELLING LETTER BLOCKS ---------------- */}
        <div className="absolute top-16 md:top-20 inset-x-0 z-20 flex items-center justify-center gap-2 md:gap-3 px-4 pointer-events-none">
          <AnimatePresence>
            {letters.map((letter, idx) => {
              const isVisible = idx < activeLetterCount;
              const isCurrentlyActive = isSpelling && idx === activeLetterCount - 1;

              // Color block palette
              const blockColors = [
                'bg-gradient-to-b from-red-400 to-rose-600 border-red-300 text-white shadow-red-500/50',
                'bg-gradient-to-b from-sky-400 to-blue-600 border-sky-300 text-white shadow-sky-500/50',
                'bg-gradient-to-b from-emerald-400 to-green-600 border-emerald-300 text-white shadow-emerald-500/50',
                'bg-gradient-to-b from-amber-300 to-yellow-500 border-yellow-200 text-slate-950 shadow-yellow-500/50',
                'bg-gradient-to-b from-purple-400 to-indigo-600 border-purple-300 text-white shadow-purple-500/50',
                'bg-gradient-to-b from-pink-400 to-rose-500 border-pink-300 text-white shadow-pink-500/50'
              ];
              const colorClass = blockColors[idx % blockColors.length];

              return (
                <motion.div
                  key={`${letter}-${idx}`}
                  initial={{ opacity: 0, y: -80, scale: 0.2, rotate: (Math.random() - 0.5) * 40 }}
                  animate={
                    isVisible
                      ? {
                          opacity: 1,
                          y: isCurrentlyActive ? -12 : 0,
                          scale: isCurrentlyActive ? 1.35 : 1,
                          rotate: isCurrentlyActive ? [0, -10, 10, 0] : 0
                        }
                      : { opacity: 0, y: -80, scale: 0.2 }
                  }
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`relative px-3 py-2 md:px-5 md:py-3.5 rounded-2xl md:rounded-3xl border-2 md:border-4 font-black text-2xl md:text-4xl shadow-xl flex items-center justify-center ${colorClass}`}
                >
                  {letter}
                  {/* Glowing Star Sparkle on Active Pop */}
                  {isCurrentlyActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.8, 0] }}
                      className="absolute -top-3 -right-3 text-lg md:text-2xl"
                    >
                      ✨
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* ---------------- 3D ANIMATED CHARACTER AVATAR ---------------- */}
        <div className="absolute inset-x-0 bottom-24 md:bottom-28 z-20 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={
              isWalking
                ? {
                    x: [-120, 0, 120, 0],
                    y: [0, -18, 0, -18, 0],
                    rotate: [-6, 6, -6, 6]
                  }
                : isWaving
                ? {
                    y: [0, -10, 0],
                    scale: [1, 1.1, 1],
                    rotate: [-3, 3, -3]
                  }
                : isSpelling
                ? {
                    y: [0, -22, 0],
                    scale: [1, 1.18, 0.9, 1.1, 1],
                    rotate: [-5, 5, -5]
                  }
                : {
                    // Victory dance
                    y: [0, -35, 0, -20, 0],
                    rotate: [0, 360, 0],
                    scale: [1, 1.3, 0.9, 1.2, 1]
                  }
            }
            transition={{
              duration: isDancing ? 1.4 : isWalking ? 3.5 : 1.2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="relative flex flex-col items-center group cursor-pointer"
          >
            {/* Character Aura Glow */}
            <div className="absolute inset-0 m-auto w-36 h-36 md:w-48 md:h-48 bg-amber-400/40 rounded-full blur-3xl animate-pulse" />

            {/* White Animated Cartoon Waving Hands */}
            <motion.div
              animate={isWaving || isDancing ? { rotate: [0, 25, -25, 20, 0], y: [-5, 5, -5] } : { rotate: [0, 10, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute -left-12 md:-left-16 top-1/3 text-3xl md:text-5xl drop-shadow-md z-30"
            >
              🥊
            </motion.div>

            <motion.div
              animate={isWaving || isDancing ? { rotate: [0, -25, 25, -20, 0], y: [5, -5, 5] } : { rotate: [0, -10, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute -right-12 md:-right-16 top-1/3 text-3xl md:text-5xl drop-shadow-md z-30"
            >
              🥊
            </motion.div>

            {/* Expressive Eyeballs & Mouth Overlay on Character */}
            <div className="relative text-7xl md:text-9xl drop-shadow-2xl select-none z-20 flex flex-col items-center">
              {object.emoji}

              {/* Expressive Eyes Overlay */}
              <div className="absolute top-1/3 inset-x-0 flex justify-center gap-4 text-xl md:text-2xl pointer-events-none">
                <span className="animate-bounce">👀</span>
              </div>

              {/* Talking Mouth Overlay */}
              <div className="absolute bottom-1/4 text-lg md:text-2xl pointer-events-none">
                {isPlaying && (isWaving || isSpelling) ? (
                  <motion.span animate={{ scaleY: [1, 1.6, 0.8, 1] }} transition={{ duration: 0.25, repeat: Infinity }}>
                    🗣️
                  </motion.span>
                ) : (
                  <span>😊</span>
                )}
              </div>
            </div>

            {/* Bouncing Walking Feet */}
            <div className="flex gap-8 text-2xl md:text-3xl -mt-4 z-10">
              <motion.span animate={isWalking ? { y: [0, -12, 0] } : {}} transition={{ duration: 0.4, repeat: Infinity }}>
                👟
              </motion.span>
              <motion.span animate={isWalking ? { y: [-12, 0, -12] } : {}} transition={{ duration: 0.4, repeat: Infinity }}>
                👟
              </motion.span>
            </div>
          </motion.div>
        </div>

        {/* ---------------- LIVE SUBTITLES & CLOSED CAPTIONS OVERLAY ---------------- */}
        <div className="absolute bottom-16 inset-x-4 md:inset-x-12 z-30 pointer-events-none flex justify-center">
          <AnimatePresence mode="wait">
            {captionsText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-xl border border-amber-400/50 text-white font-black text-xs md:text-sm text-center shadow-2xl max-w-xl"
              >
                {captionsText}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---------------- BOTTOM VIDEO CONTROLS OVERLAY BAR ---------------- */}
        <div className="absolute bottom-0 inset-x-0 z-40 p-3 md:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2 text-white">
          {/* Scrubber Progress Bar */}
          <div className="relative w-full flex items-center gap-2 group">
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={currentTime}
              onChange={handleScrubberChange}
              className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:h-3 transition-all"
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-xs font-bold">
            {/* Left Controls: Play/Pause, Replay, Time Display */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center font-black transition cursor-pointer shadow-md"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
              </button>

              <button
                onClick={handleReplay}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Replay Video"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="text-slate-300 font-mono text-[11px]">
                <span>{formatTime(currentTime)}</span>
                <span className="text-slate-500"> / </span>
                <span className="text-slate-400">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls: Audio Mute, Speed Selector, Fullscreen */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isMuted ? 'bg-rose-500/80 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Speed Selector */}
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                {[0.75, 1, 1.25].map(spd => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                      playbackSpeed === spd ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
