import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, 
  Languages, 
  X, 
  Loader2, 
  Sparkles, 
  Volume2, 
  Brain, 
  Zap, 
  Activity, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Award,
  BookOpen,
  Smile
} from 'lucide-react';

interface InteractiveTextProps {
  text: string;
  className?: string;
  wordClassName?: string;
  contextText?: string;
}

interface WordDefinition {
  word: string;
  partOfSpeech: string;
  definition: string;
  translation: string;
  example: string;
  ipaPhonetic?: string;
  syllables?: string[];
  visemeSequence?: string[];
}

interface ChallengeQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface SimplifiedContent {
  simplifiedText: string;
  helpfulSocraticTip: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'Swahili', label: 'Swahili (Kiswahili)', flag: '🇹🇿' },
  { code: 'Spanish', label: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'French', label: 'French (Français)', flag: '🇫🇷' },
  { code: 'Arabic', label: 'Arabic (العربية)', flag: '🇸🇦' },
  { code: 'Somali', label: 'Somali (Soomaali)', flag: '🇸🇴' },
  { code: 'Hindi', label: 'Hindi (हिन्दी)', flag: '🇮🇳' },
];

const VISEME_PATHS: Record<string, { lips: string; innerMouth: string; teethY: number; tongueY: number; open: boolean }> = {
  idle: {
    lips: "M 35,50 Q 50,50 65,50 Q 50,51 35,50",
    innerMouth: "M 35,50 Q 50,50 65,50 Q 50,50 35,50",
    teethY: 42,
    tongueY: 58,
    open: false,
  },
  ae: {
    lips: "M 30,47 Q 50,25 70,47 Q 50,75 30,47",
    innerMouth: "M 32,47 Q 50,30 68,47 Q 50,70 32,47",
    teethY: 34,
    tongueY: 58,
    open: true,
  },
  oo: {
    lips: "M 40,43 Q 50,32 60,43 Q 50,58 40,43",
    innerMouth: "M 42,43 Q 50,36 58,43 Q 50,54 42,43",
    teethY: 38,
    tongueY: 53,
    open: true,
  },
  ee: {
    lips: "M 25,48 Q 50,42 75,48 Q 50,56 25,48",
    innerMouth: "M 27,48 Q 50,44 73,48 Q 50,54 27,48",
    teethY: 41,
    tongueY: 51,
    open: true,
  },
  fv: {
    lips: "M 32,47 Q 50,45 68,47 Q 50,58 32,47",
    innerMouth: "M 34,47 Q 50,46 66,47 Q 50,54 34,47",
    teethY: 46,
    tongueY: 54,
    open: true,
  },
  bmp: {
    lips: "M 30,50 Q 50,49 70,50 Q 50,51 30,50",
    innerMouth: "M 30,50 Q 50,50 70,50 Q 50,50 30,50",
    teethY: 43,
    tongueY: 57,
    open: false,
  },
  sz: {
    lips: "M 28,47 Q 50,40 72,47 Q 50,55 28,47",
    innerMouth: "M 30,47 Q 50,42 70,47 Q 50,53 30,47",
    teethY: 43,
    tongueY: 52,
    open: true,
  },
};

const getFallbackVisemes = (word: string): string[] => {
  const sequence: string[] = ["idle"];
  const w = word.toLowerCase();
  for (let i = 0; i < w.length; i++) {
    const char = w[i];
    if (['a', 'e', 'i'].includes(char)) sequence.push('ae');
    else if (['o', 'u', 'w'].includes(char)) sequence.push('oo');
    else if (['b', 'p', 'm'].includes(char)) sequence.push('bmp');
    else if (['f', 'v'].includes(char)) sequence.push('fv');
    else if (['s', 'z', 'x'].includes(char)) sequence.push('sz');
    else if (['l', 'd', 't', 'n', 'c', 'g', 'k', 'h', 'j', 'q', 'r', 'y'].includes(char)) sequence.push('ee');
  }
  sequence.push("idle");
  return sequence.slice(0, 10);
};

interface PhoneticsAvatarProps {
  word: string;
  activeViseme: string;
  isPronouncing: boolean;
  onPlay: () => void;
}

const PhoneticsAvatar: React.FC<PhoneticsAvatarProps> = ({
  word,
  activeViseme,
  isPronouncing,
  onPlay,
}) => {
  const viseme = VISEME_PATHS[activeViseme] || VISEME_PATHS.idle;

  return (
    <div className="flex flex-col items-center justify-center bg-slate-950/60 rounded-xl p-3 border border-slate-800">
      <div className="relative w-28 h-28 bg-slate-900 rounded-full border border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="select-none">
          <circle cx="20" cy="50" r="5" fill="#ef4444" opacity={isPronouncing ? 0.4 : 0.2} className="transition-opacity duration-300" />
          <circle cx="80" cy="50" r="5" fill="#ef4444" opacity={isPronouncing ? 0.4 : 0.2} className="transition-opacity duration-300" />
          
          <motion.path
            d={isPronouncing ? "M 22,38 Q 28,34 34,38" : "M 22,36 Q 28,40 34,36"}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeLinecap="round"
            animate={{ d: isPronouncing ? "M 22,38 Q 28,34 34,38" : "M 22,36 Q 28,40 34,36" }}
          />
          <motion.path
            d={isPronouncing ? "M 66,38 Q 72,34 78,38" : "M 66,36 Q 72,40 78,36"}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeLinecap="round"
            animate={{ d: isPronouncing ? "M 66,38 Q 72,34 78,38" : "M 66,36 Q 72,40 78,36" }}
          />

          <path d="M 50,42 Q 47,45 50,47" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />

          <motion.path
            d={viseme.innerMouth}
            fill="#1e1b4b"
            animate={{ d: viseme.innerMouth }}
            transition={{ duration: 0.15 }}
          />

          {viseme.open && (
            <motion.path
              d={`M 40,${viseme.tongueY} Q 50,${viseme.tongueY - 6} 60,${viseme.tongueY} Q 50,70 40,${viseme.tongueY}`}
              fill="#fb7185"
              animate={{ d: `M 40,${viseme.tongueY} Q 50,${viseme.tongueY - 6} 60,${viseme.tongueY} Q 50,70 40,${viseme.tongueY}` }}
              transition={{ duration: 0.15 }}
            />
          )}

          {viseme.open && (
            <>
              <motion.rect
                x="40"
                y={viseme.teethY}
                width="20"
                height="4"
                rx="1"
                fill="#f8fafc"
                animate={{ y: viseme.teethY }}
                transition={{ duration: 0.15 }}
              />
              <motion.rect
                x="41"
                y={viseme.teethY + 11}
                width="18"
                height="3"
                rx="1"
                fill="#f1f5f9"
                animate={{ y: viseme.teethY + 11 }}
                transition={{ duration: 0.15 }}
              />
            </>
          )}

          <motion.path
            d={viseme.lips}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ d: viseme.lips }}
            transition={{ duration: 0.15 }}
          />
        </svg>
      </div>

      <button
        onClick={onPlay}
        disabled={isPronouncing}
        className={`mt-2.5 w-full py-1.5 px-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition ${
          isPronouncing
            ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-pulse'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm'
        }`}
      >
        <Volume2 className="w-3.5 h-3.5" />
        <span>{isPronouncing ? 'Pronouncing...' : 'Play Lip-Sync'}</span>
      </button>
    </div>
  );
};

export const InteractiveText: React.FC<InteractiveTextProps> = ({
  text,
  className = '',
  wordClassName = '',
  contextText,
}) => {
  // --- Dictionary State ---
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [dictError, setDictError] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<string>(() => {
    return localStorage.getItem('esl_target_language') || 'Swahili';
  });
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [definitionCache, setDefinitionCache] = useState<Record<string, WordDefinition>>({});

  // --- Visual Phonetics Avatar State ---
  const [showPhonetics, setShowPhonetics] = useState(false);
  const [activeViseme, setActiveViseme] = useState('idle');
  const [isPronouncing, setIsPronouncing] = useState(false);
  const [currentSyllableIdx, setCurrentSyllableIdx] = useState<number | null>(null);
  const [phoneticsTimer, setPhoneticsTimer] = useState<any | null>(null);

  // --- Passive Behavioral Analytics State ---
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  
  // Real-time tracking metrics
  const [totalDwellTime, setTotalDwellTime] = useState(0); // seconds
  const [instantSpeed, setInstantSpeed] = useState(0); // px/second
  const [averageSpeed, setAverageSpeed] = useState(0); // running avg px/second
  const [stuckTime, setStuckTime] = useState(0); // seconds at same scroll position
  const [queryCount, setQueryCount] = useState(0); // number of translations clicked
  const [reachedBottom, setReachedBottom] = useState(false);
  const [scrollEventsCount, setScrollEventsCount] = useState(0);
  
  // Cognitive states
  const [stateVerdict, setStateVerdict] = useState<'attentive' | 'breezing' | 'struggling'>('attentive');
  const [interventionTriggered, setInterventionTriggered] = useState<'none' | 'breezing' | 'struggling'>('none');
  const [userDismissed, setUserDismissed] = useState(false);

  // Challenge and simplification fetch states
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeData, setChallengeData] = useState<ChallengeQuestion | null>(null);
  const [selectedChallengeAnswer, setSelectedChallengeAnswer] = useState<number | null>(null);
  const [showChallengeResult, setShowChallengeResult] = useState(false);

  const [simplifyLoading, setSimplifyLoading] = useState(false);
  const [simplifiedData, setSimplifiedData] = useState<SimplifiedContent | null>(null);

  // Save/load target language
  useEffect(() => {
    localStorage.setItem('esl_target_language', targetLang);
  }, [targetLang]);

  // Reset metrics when text content changes (i.e. user switches document)
  useEffect(() => {
    setTotalDwellTime(0);
    setInstantSpeed(0);
    setAverageSpeed(0);
    setStuckTime(0);
    setQueryCount(0);
    setReachedBottom(false);
    setScrollEventsCount(0);
    setStateVerdict('attentive');
    setInterventionTriggered('none');
    setUserDismissed(false);
    setChallengeData(null);
    setSelectedChallengeAnswer(null);
    setShowChallengeResult(false);
    setSimplifiedData(null);
  }, [text]);

  // Track parent scrolling & dwell timers
  useEffect(() => {
    if (!analyticsEnabled) return;

    const container = containerRef.current;
    if (!container) return;

    // Find the closest scrollable ancestor
    let scrollParent: HTMLElement | null = container.parentElement;
    while (scrollParent) {
      const overflowY = window.getComputedStyle(scrollParent).overflowY;
      const isScrollable = scrollParent.scrollHeight > scrollParent.clientHeight;
      if (isScrollable && (overflowY === 'auto' || overflowY === 'scroll' || scrollParent.classList.contains('overflow-y-auto'))) {
        break;
      }
      scrollParent = scrollParent.parentElement;
    }

    const actualScrollContainer = scrollParent || window;
    let lastScrollTop = scrollParent ? scrollParent.scrollTop : window.scrollY;
    let lastScrollTime = Date.now();

    const handleScroll = () => {
      const now = Date.now();
      const currentScrollTop = scrollParent ? scrollParent.scrollTop : window.scrollY;
      const deltaY = Math.abs(currentScrollTop - lastScrollTop);
      const deltaT = now - lastScrollTime;

      setScrollEventsCount(prev => prev + 1);

      if (deltaT > 0 && deltaY > 0) {
        const speed = (deltaY / deltaT) * 1000; // pixels per second
        setInstantSpeed(Math.round(speed));
        setAverageSpeed(prev => {
          // Weighted moving average
          return prev === 0 ? Math.round(speed) : Math.round((prev * 0.85) + (speed * 0.15));
        });
      }

      lastScrollTop = currentScrollTop;
      lastScrollTime = now;
      setStuckTime(0); // Reset stuck duration because they scrolled

      // Reached bottom verification
      if (scrollParent) {
        const threshold = 60;
        const reached = scrollParent.scrollHeight - scrollParent.scrollTop - scrollParent.clientHeight < threshold;
        if (reached) {
          setReachedBottom(true);
        }
      } else {
        const reached = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
        if (reached) {
          setReachedBottom(true);
        }
      }
    };

    actualScrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // 1-second interval to update timers and evaluate cognitive state
    const timer = setInterval(() => {
      setTotalDwellTime(prev => prev + 1);
      setStuckTime(prev => prev + 1);

      // Decaying instant speed back to 0 when not scrolling
      setInstantSpeed(prev => Math.max(0, Math.round(prev * 0.5)));

      // Cognitive State Engine
      // Only run state calculations on substantial educational documents
      if (text.length > 250) {
        // Evaluate FRUSTRATION (Struggling)
        // Criteria: Many vocabulary queries in a short span OR stuck on the same section with high queries OR prolonged stuck time with active queries
        const isStruggling = queryCount >= 3 || (stuckTime > 12 && queryCount >= 1) || (stuckTime > 20 && totalDwellTime > 30 && !reachedBottom);
        
        // Evaluate MASTERY (Breezing through)
        // Criteria: Average scroll speed is high (> 120 px/s) or reached bottom very fast (< 18 seconds) with zero vocabulary lookups
        const isBreezing = (averageSpeed > 90 && totalDwellTime > 8 && queryCount === 0) || 
                            (reachedBottom && totalDwellTime < 15 && queryCount === 0 && scrollEventsCount > 5);

        if (isStruggling) {
          setStateVerdict('struggling');
          if (interventionTriggered === 'none' && !userDismissed) {
            setInterventionTriggered('struggling');
          }
        } else if (isBreezing) {
          setStateVerdict('breezing');
          if (interventionTriggered === 'none' && !userDismissed) {
            setInterventionTriggered('breezing');
          }
        } else {
          setStateVerdict('attentive');
        }
      }
    }, 1000);

    return () => {
      actualScrollContainer.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, [analyticsEnabled, text, queryCount, stuckTime, averageSpeed, reachedBottom, scrollEventsCount, interventionTriggered, userDismissed]);

  // --- Handlers ---
  const handleWordClick = async (word: string, e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Clear previous state
    setSelectedWord(word);
    setDictError(null);
    setDefinition(null);

    // Track passive query metric
    setQueryCount(prev => prev + 1);

    // Calculate mouse/tap coordinates relative to parent container for popover placement
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      setPopoverPosition({ x: clickX, y: clickY });
    } else {
      setPopoverPosition({ x: e.clientX, y: e.clientY });
    }

    const cacheKey = `${word.toLowerCase()}_${targetLang.toLowerCase()}`;
    if (definitionCache[cacheKey]) {
      setDefinition(definitionCache[cacheKey]);
      return;
    }

    setDictLoading(true);
    try {
      const sentences = (contextText || text).split(/[.!?]+/);
      const sentenceContext = sentences.find(s => s.toLowerCase().includes(word.toLowerCase())) || '';

      const response = await fetch('/api/define-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word,
          context: sentenceContext.trim(),
          targetLanguage: targetLang,
        }),
      });

      if (!response.ok) throw new Error();

      const data: WordDefinition = await response.json();
      setDefinition(data);
      setDefinitionCache(prev => ({ ...prev, [cacheKey]: data }));
    } catch {
      setDictError('Could not fetch definition. Please try again.');
    } finally {
      setDictLoading(false);
    }
  };

  const handleSpeech = (wordToSpeak: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(wordToSpeak);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const closePopover = () => {
    setSelectedWord(null);
    setDefinition(null);
    setPopoverPosition(null);
    setShowPhonetics(false);
    setActiveViseme('idle');
    setCurrentSyllableIdx(null);
    setIsPronouncing(false);
    if (phoneticsTimer) {
      clearInterval(phoneticsTimer);
      setPhoneticsTimer(null);
    }
  };

  useEffect(() => {
    return () => {
      if (phoneticsTimer) {
        clearInterval(phoneticsTimer);
      }
    };
  }, [phoneticsTimer]);

  const handlePlayPhonetics = () => {
    if (isPronouncing) return;

    // Trigger audio
    handleSpeech(selectedWord || '');

    // Setup sequence
    const sequence = definition?.visemeSequence && definition.visemeSequence.length > 0
      ? definition.visemeSequence
      : getFallbackVisemes(selectedWord || '');
    
    const syllablesCount = definition?.syllables && definition.syllables.length > 0
      ? definition.syllables.length
      : 1;

    setIsPronouncing(true);
    let currentFrame = 0;

    if (phoneticsTimer) {
      clearInterval(phoneticsTimer);
    }

    const timer = setInterval(() => {
      if (currentFrame < sequence.length) {
        const activeV = sequence[currentFrame];
        setActiveViseme(activeV);
        
        // Highlight syllable based on fraction of visemes
        const sylIdx = Math.floor((currentFrame / sequence.length) * syllablesCount);
        setCurrentSyllableIdx(sylIdx);
        
        currentFrame++;
      } else {
        clearInterval(timer);
        setActiveViseme('idle');
        setCurrentSyllableIdx(null);
        setIsPronouncing(false);
        setPhoneticsTimer(null);
      }
    }, 220);

    setPhoneticsTimer(timer);
  };

  // --- Behavioral Interventions Triggers ---
  const handleFetchChallenge = async () => {
    setChallengeLoading(true);
    setChallengeData(null);
    setSelectedChallengeAnswer(null);
    setShowChallengeResult(false);
    try {
      // Send some part of the text (max 2000 chars to avoid prompt bloat)
      const textToAnalyze = text.substring(0, 2000);
      const res = await fetch('/api/behavioral-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToAnalyze }),
      });
      if (!res.ok) throw new Error();
      const data: ChallengeQuestion = await res.json();
      setChallengeData(data);
    } catch (err) {
      console.error('Error fetching challenge:', err);
    } finally {
      setChallengeLoading(false);
    }
  };

  const handleFetchSimplification = async () => {
    setSimplifyLoading(true);
    setSimplifiedData(null);
    try {
      const textToAnalyze = text.substring(0, 2000);
      const res = await fetch('/api/behavioral-simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToAnalyze }),
      });
      if (!res.ok) throw new Error();
      const data: SimplifiedContent = await res.json();
      setSimplifiedData(data);
    } catch (err) {
      console.error('Error simplifying content:', err);
    } finally {
      setSimplifyLoading(false);
    }
  };

  // Split text into tokens
  const wordRegex = /([a-zA-Z0-9]+(?:'[a-zA-Z0-9]+)?)/g;
  const tokens = text.split(wordRegex);

  // Manual trigger simulators for developer review & testing
  const simulateBreezing = () => {
    setQueryCount(0);
    setAverageSpeed(150);
    setReachedBottom(true);
    setStateVerdict('breezing');
    setInterventionTriggered('breezing');
    setUserDismissed(false);
    setShowStatsPanel(true);
  };

  const simulateStruggling = () => {
    setQueryCount(4);
    setStuckTime(15);
    setStateVerdict('struggling');
    setInterventionTriggered('struggling');
    setUserDismissed(false);
    setShowStatsPanel(true);
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col ${className}`}>
      
      {/* 1. PASSIVE ANALYTICS FLOATING CONSOLE STATS */}
      {analyticsEnabled && (
        <div className="absolute top-2 right-2 z-30 select-none">
          <div className="flex items-center gap-1">
            {/* Minimalist Live Pulse Dot */}
            <button
              onClick={() => setShowStatsPanel(!showStatsPanel)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-bold shadow-2xs backdrop-blur-md transition-all cursor-pointer ${
                stateVerdict === 'breezing'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                  : stateVerdict === 'struggling'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                  : 'bg-[#5f6f52]/10 border-[#5f6f52]/30 text-[#5f6f52]'
              }`}
              title="Passive Behavioral Analytics Engine Status"
            >
              <Activity className={`w-3 h-3 ${stateVerdict !== 'attentive' ? 'animate-pulse' : ''}`} />
              <span>
                Pace: {stateVerdict === 'breezing' ? 'Breezing ⚡' : stateVerdict === 'struggling' ? 'Struggling ⚠️' : 'Active 📊'}
              </span>
              {showStatsPanel ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </button>
          </div>

          {/* Stats Drawer Detail */}
          <AnimatePresence>
            {showStatsPanel && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                className="absolute right-0 mt-1 w-52 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl p-3 shadow-xl flex flex-col gap-2 text-[10px]"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-bold text-slate-100">
                  <span className="flex items-center gap-1">
                    <Brain className="w-3 h-3 text-amber-400" /> Cognitive Dashboard
                  </span>
                  <button onClick={() => setShowStatsPanel(false)} className="hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Reading Dwell Time:</span>
                    <span className="font-mono text-slate-200">{totalDwellTime}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scroll Speed (Live):</span>
                    <span className="font-mono text-slate-200">{instantSpeed} px/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Reading Pace:</span>
                    <span className="font-mono text-slate-200">{averageSpeed} px/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Local Block Stuck:</span>
                    <span className="font-mono text-slate-200">{stuckTime}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vocabulary Queries:</span>
                    <span className="font-mono text-slate-200">{queryCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reached Bottom:</span>
                    <span className={`font-mono font-bold ${reachedBottom ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {reachedBottom ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {/* Developer Simulators */}
                <div className="border-t border-slate-800 pt-2 mt-1 space-y-1">
                  <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Dev Lab Tools</div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={simulateBreezing}
                      className="bg-amber-950/40 border border-amber-900/60 hover:bg-amber-900/40 text-amber-400 rounded py-0.5 px-1 font-semibold text-[8px] transition cursor-pointer"
                    >
                      ⚡ Sim Breezing
                    </button>
                    <button
                      onClick={simulateStruggling}
                      className="bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/40 text-rose-400 rounded py-0.5 px-1 font-semibold text-[8px] transition cursor-pointer"
                    >
                      ⚠️ Sim Frustrated
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setQueryCount(0);
                      setTotalDwellTime(0);
                      setStuckTime(0);
                      setAverageSpeed(0);
                      setReachedBottom(false);
                      setStateVerdict('attentive');
                      setInterventionTriggered('none');
                      setUserDismissed(false);
                    }}
                    className="w-full text-center hover:bg-slate-800 border border-slate-800 rounded py-0.5 mt-0.5 text-[8px] text-slate-400 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-2 h-2" /> Reset Metrics
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 2. TEXT RENDERING */}
      <div className="pr-16">
        <span>
          {tokens.map((token, index) => {
            const isWord = /[a-zA-Z0-9]/.test(token);
            if (isWord) {
              const isWordSelected = selectedWord?.toLowerCase() === token.toLowerCase();
              return (
                <span
                  key={index}
                  onClick={(e) => handleWordClick(token, e)}
                  className={`inline-block cursor-pointer border-b border-transparent hover:border-[#5f6f52]/50 hover:bg-[#5f6f52]/5 rounded-sm px-0.5 transition-all duration-200 ${
                    isWordSelected ? 'bg-[#5f6f52]/20 border-[#5f6f52] text-[#5f6f52] font-semibold' : ''
                  } ${wordClassName}`}
                  title="Click to translate and define"
                >
                  {token}
                </span>
              );
            }
            return <React.Fragment key={index}>{token}</React.Fragment>;
          })}
        </span>
      </div>

      {/* Popover Definition Panel */}
      <AnimatePresence>
        {selectedWord && popoverPosition && (
          <div className="absolute z-50 mt-2" style={{
            left: `${Math.min(Math.max(10, popoverPosition.x - 120), (containerRef.current?.clientWidth || 300) - 250)}px`,
            top: `${popoverPosition.y}px`
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="w-64 bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-4 shadow-2xl flex flex-col gap-2.5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Book className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-bold text-slate-200 truncate">{selectedWord}</span>
                  <button 
                    onClick={() => handleSpeech(selectedWord)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    title="Pronounce word"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={closePopover}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80 shrink-0">
                <Languages className="w-3 h-3 text-[#5f6f52] ml-1 shrink-0" />
                <select
                  value={targetLang}
                  onChange={async (e) => {
                    const newLang = e.target.value;
                    setTargetLang(newLang);
                    setSelectedWord(selectedWord);
                    setDictError(null);
                    setDefinition(null);
                    setDictLoading(true);
                    try {
                      const cacheKey = `${selectedWord.toLowerCase()}_${newLang.toLowerCase()}`;
                      if (definitionCache[cacheKey]) {
                        setDefinition(definitionCache[cacheKey]);
                        setDictLoading(false);
                        return;
                      }

                      const sentences = (contextText || text).split(/[.!?]+/);
                      const sentenceContext = sentences.find(s => s.toLowerCase().includes(selectedWord.toLowerCase())) || '';

                      const res = await fetch('/api/define-word', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          word: selectedWord,
                          context: sentenceContext.trim(),
                          targetLanguage: newLang,
                        }),
                      });
                      if (!res.ok) throw new Error();
                      const d = await res.json();
                      setDefinition(d);
                      setDefinitionCache(prev => ({ ...prev, [cacheKey]: d }));
                    } catch {
                      setDictError('Could not fetch definition.');
                    } finally {
                      setDictLoading(false);
                    }
                  }}
                  className="bg-transparent text-[10px] text-slate-300 font-bold focus:outline-none cursor-pointer w-full"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200 font-bold">
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Body */}
              <div className="text-[11px] leading-relaxed flex flex-col gap-2 min-h-[60px]">
                {dictLoading && (
                  <div className="flex flex-col items-center justify-center py-4 text-slate-400 gap-1.5">
                    <Loader2 className="w-5 h-5 animate-spin text-[#5f6f52]" />
                    <span className="text-[10px] text-slate-500 font-medium">Fetching definition...</span>
                  </div>
                )}

                {dictError && (
                  <div className="text-red-400 py-2 text-center text-[10px]">
                    {dictError}
                  </div>
                )}

                {definition && !dictLoading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1 border-b border-slate-800/40 pb-1.5">
                      <span className="text-[10px] text-slate-400 italic bg-slate-800/50 px-1.5 py-0.5 rounded">
                        {definition.partOfSpeech || 'word'}
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        {definition.translation}
                      </span>
                    </div>

                    <div>
                      <p className="text-slate-300 font-semibold text-[11px]">Definition:</p>
                      <p className="text-slate-400 mt-0.5">{definition.definition}</p>
                    </div>

                    {definition.example && (
                      <div className="pt-1.5 border-t border-slate-800/40">
                        <p className="text-slate-300 font-semibold text-[11px]">Usage Example:</p>
                        <p className="text-slate-400 italic mt-0.5 bg-slate-950/40 p-1.5 rounded border border-slate-850">
                          "{definition.example}"
                        </p>
                      </div>
                    )}

                    {/* Visual Phonetics Avatar Section */}
                    <div className="pt-2 border-t border-slate-800/40">
                      <button
                        onClick={() => setShowPhonetics(!showPhonetics)}
                        className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                          showPhonetics 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : 'bg-slate-850 text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Smile className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          🗣️ AI Visual Phonetics Guide
                        </span>
                        <span className="text-[9px] font-mono opacity-80">
                          {showPhonetics ? 'Hide ✕' : 'View →'}
                        </span>
                      </button>

                      <AnimatePresence>
                        {showPhonetics && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="overflow-hidden space-y-2.5"
                          >
                            <PhoneticsAvatar
                              word={selectedWord || ''}
                              activeViseme={activeViseme}
                              isPronouncing={isPronouncing}
                              onPlay={handlePlayPhonetics}
                            />

                            {/* Syllables Breakdown */}
                            <div className="bg-slate-950/40 rounded-lg p-2 border border-slate-850 text-center">
                              <span className="text-[9px] text-slate-400 block mb-1">Syllable Breakdown</span>
                              <div className="flex gap-1.5 items-center justify-center flex-wrap">
                                {(definition.syllables && definition.syllables.length > 0
                                  ? definition.syllables
                                  : [selectedWord || '']
                                ).map((syl, i) => (
                                  <span
                                    key={i}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide transition-all duration-200 ${
                                      currentSyllableIdx === i
                                        ? 'bg-amber-400 text-slate-950 scale-105 shadow-2xs'
                                        : 'bg-slate-800/80 text-slate-300'
                                    }`}
                                  >
                                    {syl}
                                  </span>
                                ))}
                              </div>

                              {/* IPA Phonetic spelling */}
                              {definition.ipaPhonetic && (
                                <span className="text-[10px] font-mono text-slate-300 mt-1.5 block">
                                  Pronunciation: <span className="text-teal-400 font-bold">{definition.ipaPhonetic}</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] text-slate-500 block text-center italic">
                              Follow the lip shapes to pronounce sounds visually
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. PROACTIVE INTERVENTION ALERTS overlay / toast panels */}
      <AnimatePresence>
        {/* MASTERY OVERLAY PANEL */}
        {interventionTriggered === 'breezing' && !userDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mt-6 border-t border-amber-200/80 bg-amber-50/90 rounded-2xl p-5 shadow-lg flex flex-col gap-3 relative overflow-hidden"
          >
            {/* Background pattern */}
            <div className="absolute right-0 bottom-0 text-amber-200/20 translate-x-6 translate-y-6 pointer-events-none">
              <Award className="w-40 h-40" />
            </div>

            <div className="flex items-start justify-between gap-4 z-10">
              <div className="flex gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600 shrink-0">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-amber-900 text-sm">
                    High Fluency Detected!
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed max-w-xl">
                    You seem to be breezing through this—would you like a harder challenge? Socratic Sage can formulate an advanced conceptual probe to stretch your understanding.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setUserDismissed(true);
                  setInterventionTriggered('none');
                }}
                className="p-1 hover:bg-amber-100/80 rounded-lg text-amber-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action buttons or quiz box */}
            <div className="flex flex-col gap-3 mt-1 z-10">
              {!challengeData && !challengeLoading && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFetchChallenge}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Challenge Me!
                  </button>
                  <button
                    onClick={() => {
                      setUserDismissed(true);
                      setInterventionTriggered('none');
                    }}
                    className="bg-transparent border border-amber-300 hover:bg-amber-100/50 text-amber-800 font-extrabold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
                  >
                    No thanks, just reading
                  </button>
                </div>
              )}

              {challengeLoading && (
                <div className="flex items-center gap-2 text-xs text-amber-800 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span className="font-medium animate-pulse">Socratic Sage is weaving an advanced query...</span>
                </div>
              )}

              {challengeData && (
                <div className="bg-white border border-amber-100/80 rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    {challengeData.question}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {challengeData.options.map((option, idx) => {
                      const isSelected = selectedChallengeAnswer === idx;
                      const isCorrect = idx === challengeData.correctAnswerIndex;
                      let optionBg = 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200';
                      
                      if (showChallengeResult) {
                        if (isCorrect) {
                          optionBg = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold';
                        } else if (isSelected) {
                          optionBg = 'bg-red-50 border-red-300 text-red-800';
                        } else {
                          optionBg = 'bg-slate-50/40 text-slate-400 border-slate-100';
                        }
                      } else if (isSelected) {
                        optionBg = 'bg-amber-50 border-amber-400 text-amber-900 font-medium';
                      }

                      return (
                        <button
                          key={idx}
                          disabled={showChallengeResult}
                          onClick={() => setSelectedChallengeAnswer(idx)}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs transition cursor-pointer ${optionBg}`}
                        >
                          <span className="font-mono font-bold mr-1.5">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {!showChallengeResult && (
                    <button
                      onClick={() => setShowChallengeResult(true)}
                      disabled={selectedChallengeAnswer === null}
                      className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Submit Response
                    </button>
                  )}

                  {showChallengeResult && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-1.5">
                        {selectedChallengeAnswer === challengeData.correctAnswerIndex ? (
                          <span className="text-emerald-600 font-extrabold text-xs flex items-center gap-1">
                            🎉 Correct Response! Deep comprehension proven.
                          </span>
                        ) : (
                          <span className="text-red-500 font-extrabold text-xs flex items-center gap-1">
                            ❌ That's not quite right. A brilliant attempt!
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <strong className="text-slate-700">Socratic Insight:</strong> {challengeData.explanation}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleFetchChallenge}
                          className="text-[10px] font-bold text-amber-700 hover:text-amber-800 transition flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Try Another Challenge
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => {
                            setUserDismissed(true);
                            setInterventionTriggered('none');
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-700 transition cursor-pointer"
                        >
                          Close Challenge Panel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* FRUSTRATION / STRUGGLING OVERLAY PANEL */}
        {interventionTriggered === 'struggling' && !userDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mt-6 border-t border-rose-200/80 bg-rose-50/90 rounded-2xl p-5 shadow-lg flex flex-col gap-3 relative overflow-hidden"
          >
            {/* Background design */}
            <div className="absolute right-0 bottom-0 text-rose-200/20 translate-x-6 translate-y-6 pointer-events-none">
              <Brain className="w-40 h-40" />
            </div>

            <div className="flex items-start justify-between gap-4 z-10">
              <div className="flex gap-3">
                <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 shrink-0">
                  <Brain className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-rose-900 text-sm">
                    Adaptive Scaffolding Available
                  </h4>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed max-w-xl">
                    Need some Socratic guidance? This document has high vocabulary depth or concept density. Socratic Sage can simplify this text or provide scaffolded conceptual hints.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setUserDismissed(true);
                  setInterventionTriggered('none');
                }}
                className="p-1 hover:bg-rose-100/80 rounded-lg text-rose-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 mt-1 z-10">
              {!simplifiedData && !simplifyLoading && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFetchSimplification}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Simplify Document Content
                  </button>
                  <button
                    onClick={() => {
                      setUserDismissed(true);
                      setInterventionTriggered('none');
                    }}
                    className="bg-transparent border border-rose-300 hover:bg-rose-100/50 text-rose-800 font-extrabold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
                  >
                    No thanks, I'll keep trying
                  </button>
                </div>
              )}

              {simplifyLoading && (
                <div className="flex items-center gap-2 text-xs text-rose-800 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                  <span className="font-medium animate-pulse">Socratic Sage is translating concepts to simpler models...</span>
                </div>
              )}

              {simplifiedData && (
                <div className="bg-white border border-rose-100/80 rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-600">Simplified Text version</span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {simplifiedData.simplifiedText}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                    <div className="text-xs font-bold text-rose-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Socratic Sage Probing Tip:
                    </div>
                    <p className="text-[11px] italic text-rose-800 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                      "{simplifiedData.helpfulSocraticTip}"
                    </p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        setUserDismissed(true);
                        setInterventionTriggered('none');
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-700 transition cursor-pointer"
                    >
                      Return to original text
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
