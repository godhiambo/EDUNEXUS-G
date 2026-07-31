import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpenBook, OpenBookChapter } from '../data/openBooksData';
import ConversationalPodcastModal from './ConversationalPodcastModal';
import {
  X,
  BookOpen,
  Volume2,
  VolumeX,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Type,
  Sun,
  Moon,
  Sparkles,
  Check,
  Share2,
  FileText,
  Radio,
  Send,
  MessageSquare,
  Bot,
  User,
  Trash2,
  Loader2,
  HelpCircle,
  Lightbulb,
  Trophy,
  Award,
  Star,
  Flame,
  CheckCircle2,
  RotateCcw,
  BookMarked,
  Gift,
  Layers,
  Zap,
  Bookmark,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  Focus
} from 'lucide-react';

interface OpenBookReaderModalProps {
  book: OpenBook | null;
  onClose: () => void;
  onImportToLibrary: (book: OpenBook) => void;
}

export interface BookAward {
  chapterIndex: number;
  chapterTitle: string;
  badgeTitle: string;
  badgeSubtitle: string;
  icon: string;
  xp: number;
  quote: string;
  reflectionQuestion: string;
  unlockedAt: string;
}

// Web Audio Synthesizer for Page Turn Rustle
const playPageTurnSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    const bufferSize = ctx.sampleRate * 0.16;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.16);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.16);
  } catch (e) {
    // Audio Context fail safe
  }
};

// Web Audio Synthesizer for Award Fanfare Chime
const playAwardFanfareSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = ctx.currentTime + idx * 0.07;
      const duration = 0.45;

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (e) {
    // Audio Context fail safe
  }
};

// Award Template Generator based on Chapter & Book Context
const getAwardForChapter = (chapterIndex: number, chapterTitle: string, bookTitle: string): BookAward => {
  const awardsList = [
    {
      badgeTitle: '🎖️ Literary Pioneer',
      badgeSubtitle: 'First Page Explorer',
      icon: '🏆',
      xp: 100,
      quote: '“The read of a thousand miles begins with a single page.”',
      reflectionQuestion: 'What core thesis or surprising detail from this first page stood out most?'
    },
    {
      badgeTitle: '⚡ Deep Focus Scholar',
      badgeSubtitle: 'Sustained Reading Momentum',
      icon: '🧠',
      xp: 150,
      quote: '“Reading is to the mind what exercise is to the body.” — Joseph Addison',
      reflectionQuestion: 'How would you explain the central argument of this page to a fellow classmate?'
    },
    {
      badgeTitle: '📜 Socratic Wisdom Catalyst',
      badgeSubtitle: 'Critical Analysis & Synthesis',
      icon: '📜',
      xp: 200,
      quote: '“An unexamined idea is like an unread volume.”',
      reflectionQuestion: 'What essential question or real-world application stems from these concepts?'
    },
    {
      badgeTitle: '🌟 Domain Mastery Sage',
      badgeSubtitle: 'Curriculum Excellence Unlocked',
      icon: '🌟',
      xp: 250,
      quote: '“Knowledge shared is knowledge multiplied.”',
      reflectionQuestion: 'Identify 2 key vocabulary terms from this page and formulate a quick definition for each.'
    },
    {
      badgeTitle: '👑 Grand Book Master',
      badgeSubtitle: 'Ultimate Reading Achievement',
      icon: '👑',
      xp: 300,
      quote: '“You have unlocked the full depth of this digital volume!”',
      reflectionQuestion: 'You are now an authority on this text. Generate an AI Study Guide or Podcast to share!'
    }
  ];

  const template = awardsList[chapterIndex % awardsList.length];
  return {
    chapterIndex,
    chapterTitle,
    badgeTitle: template.badgeTitle,
    badgeSubtitle: template.badgeSubtitle,
    icon: template.icon,
    xp: template.xp,
    quote: template.quote,
    reflectionQuestion: template.reflectionQuestion,
    unlockedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
};

export default function OpenBookReaderModal({
  book,
  onClose,
  onImportToLibrary
}: OpenBookReaderModalProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(16); // in px
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>('sepia');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [importedStatus, setImportedStatus] = useState<boolean>(false);
  const [useDyslexicFont, setUseDyslexicFont] = useState<boolean>(false);

  // 3D Book Opening State
  const [isCoverOpen, setIsCoverOpen] = useState<boolean>(false);
  const [isOpeningAnimation, setIsOpeningAnimation] = useState<boolean>(false);

  // Chapter Navigation Page Turn direction for 3D flip effect
  const [turnDirection, setTurnDirection] = useState<'next' | 'prev' | null>(null);

  // Reading Progress & Award System
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [unlockedAwards, setUnlockedAwards] = useState<Record<number, BookAward>>({});
  const [activeAwardModal, setActiveAwardModal] = useState<BookAward | null>(null);
  const [isTrophyCabinetOpen, setIsTrophyCabinetOpen] = useState<boolean>(false);
  const [showConfettiBurst, setShowConfettiBurst] = useState<boolean>(false);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Chapter Podcast Modal State
  const [isPodcastOpen, setIsPodcastOpen] = useState<boolean>(false);

  // AI Q&A Panel State
  const [isAiPanelOpen, setIsAiPanelOpen] = useState<boolean>(false);
  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Distraction-Free Focus Mode State & Timer
  const [isDistractionFree, setIsDistractionFree] = useState<boolean>(false);
  const [focusSeconds, setFocusSeconds] = useState<number>(0);

  useEffect(() => {
    let timer: any = null;
    if (isDistractionFree) {
      timer = setInterval(() => {
        setFocusSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setFocusSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isDistractionFree]);

  const formatFocusTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Reset state on book change & load saved awards
  useEffect(() => {
    setCurrentChapterIndex(0);
    setIsSpeaking(false);
    setImportedStatus(false);
    setAiChatMessages([]);
    setIsAiPanelOpen(false);
    setIsPodcastOpen(false);
    setIsCoverOpen(false);
    setIsOpeningAnimation(false);
    setScrollProgress(0);
    setIsTrophyCabinetOpen(false);
    setActiveAwardModal(null);
    setIsDistractionFree(false);

    if (book) {
      try {
        const saved = localStorage.getItem(`edunexus_book_awards_${book.id}`);
        if (saved) {
          setUnlockedAwards(JSON.parse(saved));
        } else {
          setUnlockedAwards({});
        }
      } catch (e) {
        setUnlockedAwards({});
      }
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [book]);

  // Handle scroll progress within the current chapter text
  const handleScroll = () => {
    if (!contentContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentContainerRef.current;
    if (scrollHeight <= clientHeight) {
      setScrollProgress(100);
      return;
    }
    const totalScrollable = scrollHeight - clientHeight;
    const currentProgress = Math.min(100, Math.round((scrollTop / totalScrollable) * 100));
    setScrollProgress(currentProgress);
  };

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChatMessages, isAiThinking]);

  if (!book) return null;

  const currentChapter: OpenBookChapter = book.chapters[currentChapterIndex] || {
    title: 'Content Overview',
    content: book.summary
  };

  // Trigger 3D Book Cover Opening Sequence
  const handleStartBookOpening = () => {
    if (isOpeningAnimation) return;
    setIsOpeningAnimation(true);
    playPageTurnSound();
    setShowConfettiBurst(true);
    setTimeout(() => {
      setShowConfettiBurst(false);
    }, 2000);

    setTimeout(() => {
      setIsCoverOpen(true);
      setIsOpeningAnimation(false);
    }, 1000);
  };

  // Chapter Navigation Handler with 3D Page Turning Animation & Sound
  const handleNavigateChapter = (direction: 'next' | 'prev') => {
    setTurnDirection(direction);
    playPageTurnSound();
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (direction === 'next' && currentChapterIndex < book.chapters.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1);
    }

    setScrollProgress(0);
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop = 0;
    }
    setTimeout(() => setTurnDirection(null), 400);
  };

  // Claim Page Reading Award
  const handleClaimPageAward = (chapterIdx: number = currentChapterIndex) => {
    const award = getAwardForChapter(chapterIdx, currentChapter.title, book.title);
    const updated = { ...unlockedAwards, [chapterIdx]: award };
    setUnlockedAwards(updated);
    try {
      localStorage.setItem(`edunexus_book_awards_${book.id}`, JSON.stringify(updated));
    } catch (e) {
      // LocalStorage error fallback
    }

    playAwardFanfareSound();
    setShowConfettiBurst(true);
    setActiveAwardModal(award);
    setTimeout(() => setShowConfettiBurst(false), 2500);
  };

  // Text to Speech Handler
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech narration is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${currentChapter.title}. ${currentChapter.content}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleImport = () => {
    onImportToLibrary(book);
    setImportedStatus(true);
  };

  // AI Question Handler
  const handleAskAi = async (customPrompt?: string) => {
    const queryToAsk = (customPrompt || aiQuestion).trim();
    if (!queryToAsk || isAiThinking) return;

    const newUserMessage = { role: 'user' as const, text: queryToAsk };
    const updatedMessages = [...aiChatMessages, newUserMessage];
    setAiChatMessages(updatedMessages);
    setAiQuestion('');
    setIsAiThinking(true);
    setAiError(null);
    if (!isAiPanelOpen) setIsAiPanelOpen(true);

    try {
      const res = await fetch('/api/ask-book-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: book.title,
          author: book.author,
          chapterTitle: currentChapter.title,
          chapterContent: currentChapter.content,
          question: queryToAsk,
          chatHistory: updatedMessages
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get answer from AI Book Tutor.');
      }

      const data = await res.json();
      setAiChatMessages(prev => [...prev, { role: 'model', text: data.answer }]);
    } catch (err: any) {
      console.error("AI Ask error:", err);
      setAiError(err.message || 'Error communicating with AI Assistant.');
    } finally {
      setIsAiThinking(false);
    }
  };

  const getThemeClasses = () => {
    switch (readerTheme) {
      case 'dark':
        return 'bg-zinc-900 text-zinc-100 border-zinc-800';
      case 'sepia':
        return 'bg-[#fbf0d9] text-[#433422] border-[#e8d7be]';
      case 'light':
      default:
        return 'bg-white text-slate-800 border-slate-200';
    }
  };

  const totalUnlocked = Object.keys(unlockedAwards).length;
  const isCurrentChapterAwarded = !!unlockedAwards[currentChapterIndex];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        
        {/* Confetti & Sparkles Overlay */}
        {showConfettiBurst && (
          <div className="fixed inset-0 pointer-events-none z-[70] overflow-hidden">
            {[...Array(35)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: `${Math.random() * 100}vw`,
                  y: -20,
                  scale: Math.random() * 0.7 + 0.5,
                  rotate: 0,
                  opacity: 1
                }}
                animate={{
                  y: '105vh',
                  x: `calc(${Math.random() * 100}vw + ${(Math.random() - 0.5) * 150}px)`,
                  rotate: Math.random() * 720,
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: Math.random() * 2 + 1.8,
                  ease: 'easeOut'
                }}
                className={`absolute w-3 h-3 ${
                  ['bg-amber-400', 'bg-indigo-500', 'bg-rose-400', 'bg-emerald-400', 'bg-purple-500', 'bg-yellow-300'][i % 6]
                } ${i % 2 === 0 ? 'rounded-full' : 'rounded-sm'}`}
              />
            ))}
          </div>
        )}

        {/* 3D BOOK COVER OPENING STAGE */}
        {!isCoverOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-2xl min-h-[580px] rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-900 via-zinc-900 to-amber-950/80 border border-amber-500/20 shadow-2xl overflow-hidden select-none"
          >
            {/* Ambient Lighting Rays */}
            <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

            {/* Top Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 3D PERSPECTIVE BOOK DISPLAY */}
            <div className="perspective-[1200px] my-6 relative group">
              <motion.div
                animate={
                  isOpeningAnimation
                    ? { rotateY: -160, x: -60, scale: 0.95 }
                    : { rotateY: [ -5, 5, -5 ], y: [ 0, -6, 0 ] }
                }
                transition={
                  isOpeningAnimation
                    ? { duration: 0.9, ease: [0.4, 0, 0.2, 1] }
                    : { repeat: Infinity, duration: 6, ease: 'easeInOut' }
                }
                style={{ transformStyle: 'preserve-3d', transformOrigin: 'left center' }}
                className={`w-72 h-[410px] sm:w-80 sm:h-[450px] rounded-r-2xl shadow-2xl relative bg-gradient-to-br ${book.coverBg} border-l-8 border-amber-950 text-white p-6 flex flex-col justify-between cursor-pointer border-t border-r border-b border-amber-400/30`}
                onClick={handleStartBookOpening}
              >
                {/* 3D Page Stack Depth Lines on Right Edge */}
                <div className="absolute right-0 top-1 bottom-1 w-3 bg-gradient-to-r from-amber-100 to-slate-200 border-r border-slate-300 rounded-r shadow-xs translate-x-2.5 opacity-90 flex flex-col justify-around py-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-0.5 w-full bg-amber-900/20" />
                  ))}
                </div>

                {/* Bookmark Hanging Ribbon */}
                <div className="absolute -top-1 left-8 w-6 h-20 bg-amber-500 shadow-md border-x border-amber-600 rounded-b-md flex items-end justify-center pb-1">
                  <Star className="w-3.5 h-3.5 text-amber-950 fill-amber-950" />
                </div>

                {/* Header Badge */}
                <div className="flex justify-end pt-2">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full bg-black/40 border border-white/20 backdrop-blur-xs">
                    {book.category}
                  </span>
                </div>

                {/* Cover Center Emblem & Title */}
                <div className="space-y-4 text-center my-auto">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition duration-300">
                    {book.coverEmoji}
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-serif font-extrabold tracking-wide drop-shadow-md leading-snug">
                      {book.title}
                    </h1>
                    <p className="text-xs font-medium opacity-85 mt-1">
                      By {book.author}
                    </p>
                  </div>
                </div>

                {/* Cover Footer Metadata & Action */}
                <div className="space-y-3 pt-4 border-t border-white/20 text-center">
                  <p className="text-[11px] opacity-75 font-mono">
                    {book.chapters.length} Digital Chapters • Interactive Socratic Reader
                  </p>
                  
                  <div className="py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 group-hover:shadow-amber-400/30 transition">
                    <BookOpen className="w-4 h-4" />
                    <span>{isOpeningAnimation ? 'Unfolding Book Pages...' : '✨ Tap to Open Book'}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Instruction Tip */}
            <p className="text-xs text-amber-200/80 font-medium flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Click the book cover to experience the animated page-unfolding sequence & earn reading awards!
            </p>
          </motion.div>
        ) : (

          /* MAIN WORKSPACE READER MODAL */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className={`w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border ${getThemeClasses()}`}
          >
            {/* Header Bar */}
            <div className="px-4 py-3 border-b flex items-center justify-between gap-3 shrink-0 bg-black/5 dark:bg-white/5 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => {
                    playPageTurnSound();
                    setIsCoverOpen(false);
                  }}
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${book.coverBg} flex items-center justify-center text-lg shadow-sm shrink-0 hover:scale-105 transition cursor-pointer`}
                  title="View 3D Book Cover"
                >
                  {book.coverEmoji}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-extrabold truncate">{book.title}</h2>
                    {isDistractionFree ? (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Focus Mode ({formatFocusTime(focusSeconds)})
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30">
                        {book.category}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-75 truncate">
                    By {book.author} • {book.language} • {book.license}
                  </p>
                </div>
              </div>

              {/* Top Action Controls */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                
                {/* Disable Distractions Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !isDistractionFree;
                    setIsDistractionFree(nextState);
                    if (nextState) {
                      setIsAiPanelOpen(false);
                      setIsTrophyCabinetOpen(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${
                    isDistractionFree
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-900 dark:text-emerald-200 border border-emerald-500/30'
                  }`}
                  title={isDistractionFree ? "Exit Focus Mode" : "Disable Distractions & enter pure focus reading mode"}
                >
                  {isDistractionFree ? <Eye className="w-4 h-4 text-emerald-100" /> : <EyeOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  <span className="hidden sm:inline">{isDistractionFree ? 'Exit Focus Mode' : 'Disable Distractions'}</span>
                </button>

                {!isDistractionFree && (
                  <>
                    {/* Trophy Cabinet Button */}
                    <button
                      type="button"
                      onClick={() => setIsTrophyCabinetOpen(!isTrophyCabinetOpen)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 cursor-pointer shadow-xs shrink-0"
                      title="View earned awards & reading badges for this book"
                    >
                      <Trophy className="w-4 h-4 fill-amber-950" />
                      <span className="hidden sm:inline">Awards ({totalUnlocked}/{book.chapters.length})</span>
                    </button>

                    {/* AI Study Guide Button */}
                    <button
                      type="button"
                      onClick={() => handleAskAi("Generate a comprehensive AI Study Guide for this chapter including:\n1. 📌 Executive Summary\n2. 🔑 Key Discussion Points & Essential Questions\n3. 💡 Core Vocabulary & Key Terms\n4. 📝 Classroom / Self-Study Activity Suggestions")}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs shrink-0"
                      title="Generate an AI Study Guide with summary, key terms, and discussion points"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      <span className="hidden sm:inline">AI Study Guide</span>
                    </button>

                    {/* Podcast Modal Button */}
                    <button
                      type="button"
                      onClick={() => setIsPodcastOpen(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs shrink-0"
                      title="Listen to an interactive AI Chapter Podcast discussion breaking down this chapter!"
                    >
                      <Radio className="w-4 h-4 text-amber-200" />
                      <span className="hidden sm:inline">Chapter Podcast</span>
                    </button>

                    {/* Ask AI Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 ${
                        isAiPanelOpen
                          ? 'bg-purple-700 text-white ring-2 ring-purple-300'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                      title="Ask AI questions about this chapter"
                    >
                      <Sparkles className="w-4 h-4 text-purple-200" />
                      <span className="hidden sm:inline">Ask AI</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={toggleSpeech}
                  className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isSpeaking
                      ? 'bg-rose-500 text-white shadow-md animate-pulse'
                      : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
                  }`}
                  title={isSpeaking ? "Pause Narration" : "Listen / Read Aloud"}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span className="hidden md:inline">{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
                </button>

                {!isDistractionFree && (
                  <>
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={importedStatus}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                        importedStatus
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-[#5f6f52] hover:bg-[#4d5b42] text-white'
                      }`}
                      title="Save this digital book to your local curriculum library"
                    >
                      {importedStatus ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                      <span className="hidden md:inline">{importedStatus ? 'In Library' : 'Import'}</span>
                    </button>

                    <a
                      href={book.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition text-xs font-bold"
                      title="Open Official Gutenberg / OpenStax Source"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                    onClose();
                  }}
                  className="p-2 rounded-xl hover:bg-black/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Reader Preferences Bar & Reading Progress Bar */}
            <div className="px-4 py-2 border-b flex items-center justify-between gap-3 text-xs shrink-0 bg-black/5 dark:bg-white/5 flex-wrap">
              {/* Font Size & Dyslexia Adjusters */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold opacity-70 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" /> Text Size:
                </span>
                <button
                  type="button"
                  onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                  className="p-1 rounded bg-black/10 dark:bg-white/10 hover:opacity-80 cursor-pointer"
                  title="Smaller Font"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] font-bold w-6 text-center">{fontSize}px</span>
                <button
                  type="button"
                  onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
                  className="p-1 rounded bg-black/10 dark:bg-white/10 hover:opacity-80 cursor-pointer"
                  title="Larger Font"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setUseDyslexicFont(!useDyslexicFont)}
                  className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    useDyslexicFont ? 'bg-indigo-600 text-white' : 'bg-black/10 dark:bg-white/10'
                  }`}
                  title="Toggle Dyslexia-Friendly Spacing"
                >
                  Dyslexia Font: {useDyslexicFont ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Reading Progress Indicator */}
              <div className="flex items-center gap-2 flex-1 max-w-xs mx-auto">
                <span className="text-[10px] font-bold opacity-70 whitespace-nowrap">Page Read: {scrollProgress}%</span>
                <div className="flex-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                    style={{ width: `${scrollProgress}%` }}
                  />
                </div>
              </div>

              {/* Reader Theme Toggles */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsCoverOpen(false)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3" /> 3D Cover
                </button>
                <span className="text-[11px] font-bold opacity-70">Theme:</span>
                <button
                  type="button"
                  onClick={() => setReaderTheme('sepia')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer ${
                    readerTheme === 'sepia' ? 'bg-[#fbf0d9] text-[#433422] border-[#d8c3a5] ring-2 ring-[#8c6d46]' : 'bg-black/5'
                  }`}
                >
                  📜 Sepia
                </button>
                <button
                  type="button"
                  onClick={() => setReaderTheme('light')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer ${
                    readerTheme === 'light' ? 'bg-white text-slate-800 border-slate-300 ring-2 ring-slate-400' : 'bg-black/5'
                  }`}
                >
                  ☀️ Light
                </button>
                <button
                  type="button"
                  onClick={() => setReaderTheme('dark')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer ${
                    readerTheme === 'dark' ? 'bg-zinc-900 text-white border-zinc-700 ring-2 ring-zinc-500' : 'bg-black/5'
                  }`}
                >
                  🌙 Dark
                </button>
              </div>
            </div>

            {/* Main Workspace Body (Chapter View + AI Panel) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
              
              {/* Book Chapter Content Area with 3D Page Turning animation */}
              <div
                ref={contentContainerRef}
                onScroll={handleScroll}
                className={`flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 relative ${
                  isDistractionFree ? 'max-w-4xl mx-auto' : ''
                }`}
              >
                {/* Focus Mode Ambient Banner */}
                {isDistractionFree && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs mb-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <EyeOff className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-extrabold text-xs flex items-center gap-1.5">
                          Distraction-Free Focus Mode Active
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </p>
                        <p className="text-[11px] opacity-80">
                          Focus Session: <strong>{formatFocusTime(focusSeconds)}</strong> • Page {currentChapterIndex + 1} of {book.chapters.length}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDistractionFree(false)}
                      className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold transition cursor-pointer shrink-0"
                    >
                      Exit Focus Mode
                    </button>
                  </motion.div>
                )}

                <motion.div
                  key={currentChapterIndex}
                  initial={{
                    opacity: 0,
                    rotateY: turnDirection === 'next' ? -25 : turnDirection === 'prev' ? 25 : 0,
                    x: turnDirection === 'next' ? 40 : turnDirection === 'prev' ? -40 : 0
                  }}
                  animate={{ opacity: 1, rotateY: 0, x: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="space-y-6"
                >
                  {/* Chapter Header */}
                  <div className="border-b pb-4 border-current/10 flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-extrabold tracking-widest opacity-60">
                          Chapter {currentChapterIndex + 1} of {book.chapters.length}
                        </span>
                        {isCurrentChapterAwarded && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-amber-500 text-amber-950 flex items-center gap-1 shadow-2xs">
                            <Trophy className="w-3 h-3 fill-amber-950" /> Awarded
                          </span>
                        )}
                      </div>
                      <h1 className="text-xl sm:text-2xl font-extrabold mt-1">{currentChapter.title}</h1>
                    </div>

                    {!isDistractionFree && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleClaimPageAward()}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                            isCurrentChapterAwarded
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-extrabold hover:scale-105'
                          }`}
                          title="Claim your page reading completion badge & +150 XP"
                        >
                          <Award className="w-4 h-4" />
                          <span>{isCurrentChapterAwarded ? 'Re-Claim Award' : '🎁 Complete Page & Claim Award'}</span>
                        </button>

                        <button
                          onClick={() => handleAskAi("Generate a comprehensive AI Study Guide for this chapter including:\n1. 📌 Executive Summary\n2. 🔑 Key Discussion Points & Essential Questions\n3. 💡 Core Vocabulary & Key Terms\n4. 📝 Classroom / Self-Study Activity Suggestions")}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                          <span className="hidden sm:inline">AI Study Guide</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Readable Chapter Text */}
                  <div
                    className={`leading-relaxed whitespace-pre-wrap transition-all ${
                      useDyslexicFont ? 'tracking-wider font-sans leading-loose' : 'font-serif'
                    }`}
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {currentChapter.content}
                  </div>

                  {/* END OF PAGE AWARD CALLOUT BANNER */}
                  {!isDistractionFree && (
                    <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-amber-600/15 border border-amber-500/30 text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500 text-amber-950 flex items-center justify-center text-2xl shadow-md">
                        🏆
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                          Finished reading Chapter {currentChapterIndex + 1}?
                        </h3>
                        <p className="text-xs text-amber-800/80 dark:text-amber-300/80 max-w-md mx-auto">
                          Unlock your reading achievement badge, earn +150 Scholar XP, and reveal a secret Socratic wisdom artifact!
                        </p>
                      </div>

                      <button
                        onClick={() => handleClaimPageAward()}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 font-extrabold text-xs transition shadow-md hover:scale-105 cursor-pointer inline-flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{isCurrentChapterAwarded ? 'Review Unlocked Award' : '🎉 Claim Page Reading Award (+150 XP)'}</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* AI Q&A Side Panel */}
              <AnimatePresence>
                {!isDistractionFree && isAiPanelOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 300 }}
                    className="w-full md:w-96 border-t md:border-t-0 md:border-l border-current/15 bg-purple-50/40 dark:bg-zinc-900/90 flex flex-col h-full shrink-0 shadow-lg"
                  >
                    {/* Panel Header */}
                    <div className="p-3 border-b border-current/10 flex items-center justify-between bg-purple-100/50 dark:bg-purple-950/40">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-extrabold text-purple-950 dark:text-purple-100">AI Book Tutor</h3>
                          <p className="text-[10px] text-purple-700 dark:text-purple-300 truncate max-w-[180px]">
                            Grounded in {currentChapter.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {aiChatMessages.length > 0 && (
                          <button
                            onClick={() => setAiChatMessages([])}
                            className="p-1 rounded text-purple-700 hover:bg-purple-200/50 cursor-pointer text-[10px] font-bold"
                            title="Clear chat history"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setIsAiPanelOpen(false)}
                          className="p-1 rounded text-purple-700 hover:bg-purple-200/50 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Prompts */}
                    <div className="p-2 border-b border-current/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-purple-50/80 dark:bg-zinc-800/50 shrink-0">
                      <button
                        onClick={() => handleAskAi("Generate a comprehensive AI Study Guide for this chapter including:\n1. 📌 Executive Summary\n2. 🔑 Key Discussion Points & Essential Questions\n3. 💡 Core Vocabulary & Key Terms\n4. 📝 Classroom / Self-Study Activity Suggestions")}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-600 text-white border border-indigo-500 shrink-0 hover:bg-indigo-700 cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-200" />
                        <span>📘 AI Study Guide</span>
                      </button>
                      <button
                        onClick={() => handleAskAi("Explain this chapter simply in 3 key sentences.")}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-zinc-800 text-purple-900 dark:text-purple-200 border border-purple-200 shrink-0 hover:bg-purple-100 cursor-pointer"
                      >
                        💡 Explain Simply
                      </button>
                      <button
                        onClick={() => handleAskAi("What are the core takeaways and main concepts of this chapter?")}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-zinc-800 text-purple-900 dark:text-purple-200 border border-purple-200 shrink-0 hover:bg-purple-100 cursor-pointer"
                      >
                        🎯 Key Takeaways
                      </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                      {aiChatMessages.length === 0 && (
                        <div className="text-center py-8 space-y-2 text-purple-800 dark:text-purple-300">
                          <HelpCircle className="w-8 h-8 text-purple-400 mx-auto" />
                          <p className="font-bold">Ask anything about this chapter!</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                            Get instant explanations, summary breakdowns, or classroom activity suggestions.
                          </p>
                        </div>
                      )}

                      {aiChatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.role === 'model' && (
                            <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                              🤖
                            </div>
                          )}
                          <div
                            className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                              msg.role === 'user'
                                ? 'bg-purple-600 text-white font-medium rounded-tr-none'
                                : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 border border-purple-100 dark:border-zinc-700 shadow-2xs rounded-tl-none'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))}

                      {isAiThinking && (
                        <div className="flex gap-2 items-center text-purple-700 dark:text-purple-300 font-medium text-xs">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                          <span>AI Tutor is analyzing chapter text...</span>
                        </div>
                      )}

                      {aiError && (
                        <div className="p-2 rounded-xl bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                          {aiError}
                        </div>
                      )}

                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat Input */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAskAi();
                      }}
                      className="p-3 border-t border-current/10 bg-white dark:bg-zinc-800 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        placeholder="Ask a question about this chapter..."
                        className="flex-1 bg-purple-50/50 dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="submit"
                        disabled={isAiThinking || !aiQuestion.trim()}
                        className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white transition cursor-pointer shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Chapter Navigation Bar */}
            <div className="p-3 border-t flex items-center justify-between gap-3 shrink-0 bg-black/5 dark:bg-white/5">
              <button
                type="button"
                onClick={() => handleNavigateChapter('prev')}
                disabled={currentChapterIndex === 0}
                className="px-3.5 py-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Chapter</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold opacity-80">
                  Chapter {currentChapterIndex + 1} of {book.chapters.length}
                </span>

                <button
                  type="button"
                  onClick={() => handleClaimPageAward()}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isCurrentChapterAwarded ? 'Badge Earned' : 'Claim Page Award'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleNavigateChapter('next')}
                disabled={currentChapterIndex === book.chapters.length - 1}
                className="px-3.5 py-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <span>Next Chapter</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* PAGE READING AWARD UNLOCKED MODAL */}
        <AnimatePresence>
          {activeAwardModal && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="w-full max-w-md bg-gradient-to-b from-slate-900 via-zinc-900 to-amber-950 rounded-3xl p-6 sm:p-8 border-2 border-amber-400/40 shadow-2xl text-white text-center space-y-5 relative overflow-hidden"
              >
                {/* Background Shimmer Glow */}
                <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-yellow-500/20 blur-2xl pointer-events-none" />

                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 flex items-center justify-center text-4xl shadow-lg border-2 border-white/40 animate-bounce">
                  {activeAwardModal.icon}
                </div>

                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    🎉 Page Reading Milestone Achieved
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-3">{activeAwardModal.badgeTitle}</h2>
                  <p className="text-xs text-amber-200/80 mt-0.5">{activeAwardModal.badgeSubtitle}</p>
                </div>

                {/* XP Reward Badge */}
                <div className="py-2.5 px-4 rounded-2xl bg-white/10 border border-white/20 inline-flex items-center gap-2 text-amber-300 font-extrabold text-sm shadow-inner">
                  <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>+{activeAwardModal.xp} Scholar XP Unlocked!</span>
                </div>

                {/* Socratic Wisdom Artifact Card */}
                <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/30 text-left space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Wisdom Artifact & Reflection</span>
                  </div>
                  <p className="text-xs font-serif italic text-amber-100/90 leading-relaxed">
                    {activeAwardModal.quote}
                  </p>
                  <p className="text-[11px] text-amber-200/80 pt-1 border-t border-amber-500/20 font-sans">
                    <strong>Reflection:</strong> {activeAwardModal.reflectionQuestion}
                  </p>
                </div>

                <button
                  onClick={() => setActiveAwardModal(null)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-amber-950 font-extrabold text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Add to Trophy Cabinet & Continue Reading</span>
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* TROPHY CABINET DRAWER MODAL */}
        <AnimatePresence>
          {isTrophyCabinetOpen && (
            <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-lg bg-zinc-900 rounded-3xl p-6 border border-amber-500/30 shadow-2xl text-white space-y-5 max-h-[85vh] flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-amber-950 flex items-center justify-center">
                      <Trophy className="w-5 h-5 fill-amber-950" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">Book Trophy Cabinet</h3>
                      <p className="text-[11px] text-amber-300/80">{book.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsTrophyCabinetOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {book.chapters.map((ch, idx) => {
                    const award = unlockedAwards[idx];
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border transition flex items-center gap-3 ${
                          award
                            ? 'bg-amber-950/40 border-amber-500/40 text-amber-100'
                            : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500 opacity-60'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                          award ? 'bg-amber-500 text-amber-950 shadow-md' : 'bg-zinc-800 text-zinc-600'
                        }`}>
                          {award ? award.icon : '🔒'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-extrabold truncate">
                              {award ? award.badgeTitle : `Chapter ${idx + 1}: ${ch.title}`}
                            </h4>
                            {award && (
                              <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0">
                                +{award.xp} XP
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] opacity-80 truncate">
                            {award ? award.badgeSubtitle : 'Read this page to unlock award badge'}
                          </p>
                          {award && (
                            <p className="text-[10px] text-amber-300/60 font-mono mt-0.5">
                              Unlocked at {award.unlockedAt}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-xs shrink-0 text-zinc-400">
                  <span>Completed {totalUnlocked} of {book.chapters.length} pages</span>
                  <button
                    onClick={() => setIsTrophyCabinetOpen(false)}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-extrabold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

      {/* Chapter-by-Chapter Conversational Podcast Modal */}
      <ConversationalPodcastModal
        isOpen={isPodcastOpen}
        onClose={() => setIsPodcastOpen(false)}
        materialsText={currentChapter.content}
        materialTitle={`${book.title} - Chapter ${currentChapterIndex + 1}: ${currentChapter.title}`}
        initialConfidence="low"
      />
    </AnimatePresence>
  );
}
