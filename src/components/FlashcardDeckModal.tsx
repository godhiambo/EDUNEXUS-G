import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RotateCw, 
  RotateCcw,
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle, 
  BookmarkPlus, 
  Check, 
  Trophy, 
  Layers,
  Flame,
  Star,
  Brain,
  Calendar,
  Zap,
  TrendingUp,
  Clock,
  Sparkle,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Shuffle,
  Filter,
  Play,
  Pause,
  Timer,
  Sliders
} from 'lucide-react';
import { FlashcardDeck, Flashcard } from '../types';
import { awardStudentXp, getStudentXpData, calculateLevel } from '../utils/studentXp';
import StreakCelebrationOverlay from './StreakCelebrationOverlay';

interface FlashcardDeckModalProps {
  deck: FlashcardDeck | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveToLibrary?: (deck: FlashcardDeck) => Promise<void> | void;
  onComplete?: (stats: { totalCards: number; masteredCards: number; sm2Stats?: any }) => void;
  isLowDifficultySupport?: boolean;
}

export interface SM2State {
  repetition: number;
  interval: number;
  easeFactor: number;
  dueDate: string;
  lastReviewed?: string;
  lastQuality?: number;
}

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm Implementation
 * Quality score q:
 * 0 - Total Blackout (Again)
 * 2 - Incorrect response / Hard recall
 * 4 - Correct response with hesitation (Good)
 * 5 - Perfect recall with ease (Easy)
 */
export function calculateSM2(quality: number, current: SM2State): SM2State {
  let { repetition, interval, easeFactor } = current;

  // New Ease Factor calculation: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newRepetition: number;
  let newInterval: number;

  if (quality < 3) {
    // Failed recall or hard fail -> Reset repetition count
    newRepetition = 0;
    newInterval = 1;
  } else {
    // Successful recall
    if (repetition === 0) {
      newInterval = 1;
    } else if (repetition === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
    newRepetition = repetition + 1;
  }

  const now = new Date();
  const nextDueDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    repetition: newRepetition,
    interval: newInterval,
    easeFactor: Number(newEF.toFixed(2)),
    dueDate: nextDueDate.toISOString(),
    lastReviewed: now.toISOString(),
    lastQuality: quality
  };
}

export const FlashcardDeckModal: React.FC<FlashcardDeckModalProps> = ({
  deck,
  isOpen,
  onClose,
  onSaveToLibrary,
  onComplete,
  isLowDifficultySupport = false,
}) => {
  if (!isOpen || !deck) return null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Record<string, boolean>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Student XP & Gamification Engine State
  const [currentXpData, setCurrentXpData] = useState(getStudentXpData);
  const [xpToast, setXpToast] = useState<{ amount: number; message: string } | null>(null);

  // Streak Celebration Overlay & Goal Engine State
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [sessionCardsReviewed, setSessionCardsReviewed] = useState(0);
  const [hasTriggeredStreakCelebration, setHasTriggeredStreakCelebration] = useState(false);

  // Spaced Repetition (SM-2), Smart Sort & Shuffle State Engine
  type SmartSortFilter = 'ALL' | 'SMART_GROUP' | 'STRUGGLING' | 'LEARNING' | 'MASTERED';
  const [smartSortMode, setSmartSortMode] = useState<SmartSortFilter>('ALL');
  const [useSpacedRepetition, setUseSpacedRepetition] = useState(true);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [sm2CardMap, setSm2CardMap] = useState<Record<string, SM2State>>({});
  const [lastSm2Feedback, setLastSm2Feedback] = useState<{ cardId: string; quality: number; interval: number; easeFactor: number } | null>(null);
  const [sessionRatingsCount, setSessionRatingsCount] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  // Helper to categorize card into proficiency tiers
  const getCardMasteryTier = (
    card: Flashcard,
    sm2Map: Record<string, SM2State>,
    masteredMap: Record<string, boolean>
  ): 'STRUGGLING' | 'LEARNING' | 'MASTERED' => {
    if (masteredMap[card.id]) return 'MASTERED';
    const sm2 = sm2Map[card.id];
    if (!sm2) return 'STRUGGLING';
    if (sm2.repetition >= 3 || sm2.interval >= 10) return 'MASTERED';
    if (sm2.repetition >= 1 || sm2.interval >= 3) return 'LEARNING';
    return 'STRUGGLING';
  };

  // Tier card counts for Smart Sort selector badges
  const tierCounts = useMemo(() => {
    const counts = { struggling: 0, learning: 0, mastered: 0 };
    if (!deck?.cards) return counts;
    deck.cards.forEach(card => {
      const tier = getCardMasteryTier(card, sm2CardMap, masteredIds);
      if (tier === 'STRUGGLING') counts.struggling++;
      else if (tier === 'LEARNING') counts.learning++;
      else if (tier === 'MASTERED') counts.mastered++;
    });
    return counts;
  }, [deck?.cards, sm2CardMap, masteredIds]);

  // Stable pseudo-random weights per card when shuffle mode is enabled
  const shuffleWeights = useMemo(() => {
    const weights: Record<string, number> = {};
    if (!deck.cards) return weights;
    deck.cards.forEach((card, idx) => {
      const str = `${card.id}-${shuffleSeed}-${idx}`;
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      weights[card.id] = hash;
    });
    return weights;
  }, [deck.cards, shuffleSeed]);

  const handleToggleShuffle = () => {
    setIsShuffled(prev => !prev);
    setShuffleSeed(prev => prev + 1);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setIsFinished(false);
  };

  // Text-to-Speech (TTS), Auto-Play & Focus Mode State Engine
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isAutoTtsEnabled, setIsAutoTtsEnabled] = useState(false);
  const [isPlayingTts, setIsPlayingTts] = useState(false);

  // Auto-Play State Engine with Adjustable Question/Answer Timers
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [questionDuration, setQuestionDuration] = useState(4); // seconds
  const [answerDuration, setAnswerDuration] = useState(3); // seconds
  const [showAutoPlaySettings, setShowAutoPlaySettings] = useState(false);
  const [autoPlayProgressPct, setAutoPlayProgressPct] = useState(0);

  const speakCardText = (textToSpeak: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (!textToSpeak) return;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlayingTts(true);
    utterance.onend = () => setIsPlayingTts(false);
    utterance.onerror = () => setIsPlayingTts(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopTts = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingTts(false);
    }
  };

  // Load SM-2 parameters from local storage or card defaults on mount
  useEffect(() => {
    if (!deck) return;
    const storageKey = `sm2_deck_${deck.id}`;
    const savedSm2 = localStorage.getItem(storageKey);
    let initialMap: Record<string, SM2State> = {};

    if (savedSm2) {
      try {
        initialMap = JSON.parse(savedSm2);
      } catch (e) {
        console.error("Failed to parse stored SM-2 state", e);
      }
    }

    // Populate missing cards with initial SM-2 defaults
    const updatedMap = { ...initialMap };
    deck.cards.forEach(card => {
      if (!updatedMap[card.id]) {
        updatedMap[card.id] = {
          repetition: card.repetition ?? 0,
          interval: card.interval ?? 1,
          easeFactor: card.easeFactor ?? 2.5,
          dueDate: card.dueDate ?? new Date().toISOString(),
          lastReviewed: card.lastReviewed
        };
      }
    });

    setSm2CardMap(updatedMap);
  }, [deck]);

  // Save SM-2 state changes to localStorage
  const saveSm2Map = (updatedMap: Record<string, SM2State>) => {
    setSm2CardMap(updatedMap);
    if (deck) {
      try {
        localStorage.setItem(`sm2_deck_${deck.id}`, JSON.stringify(updatedMap));
      } catch (e) {
        console.error("Error saving SM-2 map", e);
      }
    }
  };

  // Queue ordering based on SM-2 due dates, Smart Sort tier preferences, and shuffle
  const cardQueue = useMemo(() => {
    let rawCards = deck.cards || [];

    // Filter by specific mastery tier if selected
    if (smartSortMode === 'STRUGGLING') {
      rawCards = rawCards.filter(c => getCardMasteryTier(c, sm2CardMap, masteredIds) === 'STRUGGLING');
    } else if (smartSortMode === 'LEARNING') {
      rawCards = rawCards.filter(c => getCardMasteryTier(c, sm2CardMap, masteredIds) === 'LEARNING');
    } else if (smartSortMode === 'MASTERED') {
      rawCards = rawCards.filter(c => getCardMasteryTier(c, sm2CardMap, masteredIds) === 'MASTERED');
    }

    if (!useSpacedRepetition && !isShuffled && smartSortMode !== 'SMART_GROUP') {
      return rawCards;
    }

    const tierOrderWeight = (c: Flashcard) => {
      const tier = getCardMasteryTier(c, sm2CardMap, masteredIds);
      if (tier === 'STRUGGLING') return 0;
      if (tier === 'LEARNING') return 1;
      return 2;
    };

    const now = new Date().getTime();
    return [...rawCards].sort((a, b) => {
      // Primary group tier when SMART_GROUP mode is active: Struggling first -> Learning -> Mastered
      if (smartSortMode === 'SMART_GROUP') {
        const wA = tierOrderWeight(a);
        const wB = tierOrderWeight(b);
        if (wA !== wB) return wA - wB;
      }

      if (!useSpacedRepetition) {
        if (isShuffled) {
          return (shuffleWeights[a.id] || 0) - (shuffleWeights[b.id] || 0);
        }
        return 0;
      }

      // When SM-2 Spaced Repetition IS active:
      // Maintain SM-2 priority (overdue & due cards come first before future cards).
      const sm2A = sm2CardMap[a.id];
      const sm2B = sm2CardMap[b.id];
      const dueA = sm2A ? new Date(sm2A.dueDate).getTime() : now;
      const dueB = sm2B ? new Date(sm2B.dueDate).getTime() : now;

      const isDueA = dueA <= now;
      const isDueB = dueB <= now;

      // Primary priority: Due/overdue cards must precede future cards
      if (isDueA !== isDueB) {
        return isDueA ? -1 : 1;
      }

      if (!isShuffled) {
        if (dueA !== dueB) return dueA - dueB;
        return 0;
      }

      // If shuffled, randomize order within the same due status tier (or within 1 day window)
      const dayDiff = Math.abs(dueA - dueB) / (1000 * 60 * 60 * 24);
      if (dayDiff > 1) {
        return dueA - dueB;
      }

      return (shuffleWeights[a.id] || 0) - (shuffleWeights[b.id] || 0);
    });
  }, [deck.cards, sm2CardMap, masteredIds, useSpacedRepetition, isShuffled, shuffleWeights, smartSortMode]);

  const totalCards = cardQueue.length;
  const currentCard: Flashcard | undefined = cardQueue[currentIndex];
  const currentCardSm2: SM2State = currentCard
    ? (sm2CardMap[currentCard.id] || { repetition: 0, interval: 1, easeFactor: 2.5, dueDate: new Date().toISOString() })
    : { repetition: 0, interval: 1, easeFactor: 2.5, dueDate: new Date().toISOString() };

  const masteredCount = Object.keys(masteredIds).length;

  // Auto-read TTS for auditory learners
  useEffect(() => {
    if (!isOpen || !isAutoTtsEnabled || !currentCard || isFinished) return;
    const textToSpeak = isFlipped ? currentCard.back : currentCard.front;
    speakCardText(textToSpeak);

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentIndex, isFlipped, isAutoTtsEnabled, isOpen, isFinished, currentCard]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    const newCount = sessionCardsReviewed + 1;
    setSessionCardsReviewed(newCount);

    // Trigger daily goal streak celebration overlay with confetti when reviewing 5 cards or on deck finish
    if ((newCount >= 5 || currentIndex >= totalCards - 1) && !hasTriggeredStreakCelebration) {
      setHasTriggeredStreakCelebration(true);
      setShowStreakCelebration(true);
    }

    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
      const { updatedData } = awardStudentXp(
        100,
        `Completed Deck: "${deck.title}"`,
        'deck_completed'
      );
      setCurrentXpData(updatedData);
      setXpToast({ amount: 100, message: 'Deck Completed Bonus! 🏆' });
      setTimeout(() => setXpToast(null), 3000);

      if (onComplete) {
        onComplete({ totalCards, masteredCards: masteredCount, sm2Stats: sessionRatingsCount });
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Apply SM-2 rating review
  const handleSm2Review = (quality: number) => {
    if (!currentCard) return;

    const currentSM2 = sm2CardMap[currentCard.id] || {
      repetition: 0,
      interval: 1,
      easeFactor: 2.5,
      dueDate: new Date().toISOString()
    };

    const nextSM2 = calculateSM2(quality, currentSM2);
    const updatedMap = { ...sm2CardMap, [currentCard.id]: nextSM2 };
    saveSm2Map(updatedMap);

    // Track session rating distribution
    setSessionRatingsCount(prev => ({
      again: quality === 0 ? prev.again + 1 : prev.again,
      hard: quality === 2 ? prev.hard + 1 : prev.hard,
      good: quality === 4 ? prev.good + 1 : prev.good,
      easy: quality === 5 ? prev.easy + 1 : prev.easy
    }));

    const isMasteredNow = quality >= 4;
    // Auto-mark as mastered if quality >= 4 or repetition >= 2
    if (isMasteredNow) {
      setMasteredIds(prev => ({ ...prev, [currentCard.id]: true }));
    }

    // Award XP for rating card & bonus for mastering
    let xpAward = 5;
    let label = 'Review Practice';
    if (quality === 5) {
      xpAward = 25;
      label = 'Easy Recall ✨';
    } else if (quality === 4) {
      xpAward = 15;
      label = 'Good Recall 👍';
    } else if (quality === 2) {
      xpAward = 8;
      label = 'Hard Practice 💪';
    }

    if (isMasteredNow) {
      xpAward += 50; // +50 XP bonus for mastering a card
      label = 'Card Mastered ⭐';
    }

    const cardSnippet = currentCard.front.length > 25 ? `${currentCard.front.substring(0, 25)}...` : currentCard.front;
    const { updatedData } = awardStudentXp(
      xpAward,
      `${label} (${cardSnippet})`,
      isMasteredNow ? 'card_mastered' : 'card_reviewed',
      isMasteredNow
    );
    setCurrentXpData(updatedData);
    setXpToast({ amount: xpAward, message: label });
    setTimeout(() => setXpToast(null), 2500);

    // Set SM-2 Toast Feedback
    setLastSm2Feedback({
      cardId: currentCard.id,
      quality,
      interval: nextSM2.interval,
      easeFactor: nextSM2.easeFactor
    });

    setTimeout(() => {
      setLastSm2Feedback(null);
    }, 2800);

    handleNext();
  };

  // Auto-Play Cycling Timer Effect with Customizable Intervals
  useEffect(() => {
    if (!isAutoPlay || isFinished || !isOpen || !currentCard) {
      setAutoPlayProgressPct(0);
      return;
    }

    const durationSec = isFlipped ? answerDuration : questionDuration;
    const startTime = Date.now();
    const updateIntervalMs = 40;

    const timer = setInterval(() => {
      const elapsedSec = (Date.now() - startTime) / 1000;
      const pct = Math.min(100, (elapsedSec / durationSec) * 100);
      setAutoPlayProgressPct(pct);

      if (elapsedSec >= durationSec) {
        clearInterval(timer);
        if (!isFlipped) {
          setIsFlipped(true);
        } else {
          if (useSpacedRepetition) {
            handleSm2Review(4);
          } else {
            handleNext();
          }
        }
      }
    }, updateIntervalMs);

    return () => clearInterval(timer);
  }, [isAutoPlay, isFlipped, currentIndex, questionDuration, answerDuration, isFinished, isOpen, currentCard, useSpacedRepetition]);

  // Keyboard Shortcuts Listener (Arrow Left/Right for Navigation, Space for Flip)
  useEffect(() => {
    if (!isOpen || isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if user is typing inside an input, textarea, or editable element
      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement) {
        const activeTag = activeElement.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeElement.isContentEditable) {
          return;
        }
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFinished, isFlipped, currentIndex, totalCards]);

  const toggleMastered = (cardId: string) => {
    const isCurrentlyMastered = !!masteredIds[cardId];
    setMasteredIds(prev => {
      const next = { ...prev };
      if (next[cardId]) {
        delete next[cardId];
      } else {
        next[cardId] = true;
      }
      return next;
    });

    if (!isCurrentlyMastered && currentCard) {
      const cardSnippet = currentCard.front.length > 25 ? `${currentCard.front.substring(0, 25)}...` : currentCard.front;
      const { updatedData } = awardStudentXp(
        50,
        `Mastered card: "${cardSnippet}"`,
        'card_mastered',
        true
      );
      setCurrentXpData(updatedData);
      setXpToast({ amount: 50, message: 'Card Mastered ⭐' });
      setTimeout(() => setXpToast(null), 2500);
    }

    handleNext();
  };

  const handleSave = async () => {
    if (!onSaveToLibrary || isSaved || isSaving) return;
    setIsSaving(true);
    try {
      // Attach latest SM-2 card data when saving
      const updatedDeck = {
        ...deck,
        cards: deck.cards.map(card => {
          const sm2 = sm2CardMap[card.id];
          return sm2 ? { ...card, ...sm2 } : card;
        })
      };
      await onSaveToLibrary(updatedDeck);
      setIsSaved(true);
    } catch (err) {
      console.error("Failed to save flashcard deck to library:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setIsFinished(false);
  };

  const handleResetProgress = () => {
    // Clear all mastery markers
    setMasteredIds({});

    // Reset SM-2 state map to initial defaults for all cards in current deck
    const resetMap: Record<string, SM2State> = {};
    if (deck?.cards) {
      deck.cards.forEach(card => {
        resetMap[card.id] = {
          repetition: 0,
          interval: 1,
          easeFactor: 2.5,
          dueDate: new Date().toISOString()
        };
      });
    }

    setSm2CardMap(resetMap);

    // Remove deck's SM-2 key from localStorage
    if (deck) {
      try {
        localStorage.removeItem(`sm2_deck_${deck.id}`);
      } catch (e) {
        console.error("Error clearing stored SM-2 progress:", e);
      }
    }

    // Reset session practice stats
    setSessionRatingsCount({ again: 0, hard: 0, good: 0, easy: 0 });

    // Reset view states
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setIsFinished(false);

    // Toast notification
    setLastSm2Feedback({
      cardId: 'reset',
      quality: 0,
      interval: 1,
      easeFactor: 2.5
    });

    setTimeout(() => {
      setLastSm2Feedback(null);
    }, 2800);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-5 border-b transition-colors ${
            isFocusMode ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-50/70 border-slate-100 text-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                isFocusMode
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-[#5f6f52]/10 border-[#5f6f52]/20 text-[#5f6f52]'
              }`}>
                {isFocusMode ? <EyeOff className="w-5 h-5 text-amber-400" /> : <Brain className="w-5 h-5 text-[#5f6f52]" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {isFocusMode ? (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                      Focus Mode Active • Distractions Hidden
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-[#5f6f52]/10 text-[#5f6f52] px-2 py-0.5 rounded-full">
                        {deck.subject}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3 text-indigo-600" />
                        SM-2 Spaced Repetition
                      </span>
                      {(isLowDifficultySupport || deck.isLowDifficultySupport) && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          Low-Difficulty Support
                        </span>
                      )}
                    </>
                  )}
                </div>
                <h3 className={`font-serif font-bold text-lg leading-snug truncate max-w-md ${
                  isFocusMode ? 'text-white' : 'text-slate-800'
                }`}>
                  {deck.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Live Student XP & Level Badge */}
              {(() => {
                const lvlInfo = calculateLevel(currentXpData.totalXp);
                return (
                  <div
                    className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-xs font-black transition ${
                      isFocusMode
                        ? 'bg-slate-800 border-slate-700 text-amber-400'
                        : 'bg-gradient-to-r from-amber-50 to-amber-100/90 border-amber-300 text-slate-900 shadow-2xs'
                    }`}
                    title={`Student XP: ${currentXpData.totalXp} XP | Level ${lvlInfo.level} (${lvlInfo.rankTitle})`}
                  >
                    <span className="text-amber-600 font-extrabold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                      {currentXpData.totalXp} XP
                    </span>
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black uppercase">
                      Lvl {lvlInfo.level}
                    </span>
                  </div>
                );
              })()}

              {!isFocusMode && onSaveToLibrary && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaved || isSaving}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    isSaved
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-[#5f6f52] text-white hover:bg-[#4d5b42] shadow-xs'
                  }`}
                  title="Save deck with SM-2 scheduling parameters to File Library"
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Saved in Library
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      {isSaving ? 'Saving...' : 'Save to File Library'}
                    </>
                  )}
                </button>
              )}

              {/* Focus Mode Toggle Button */}
              <button
                type="button"
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition border cursor-pointer ${
                  isFocusMode
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md hover:bg-amber-300'
                    : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700 shadow-3xs'
                }`}
                title={isFocusMode ? "Exit Focus Mode" : "Enable Focus Mode to hide non-essential UI elements and study without distractions"}
              >
                {isFocusMode ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Exit Focus</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Focus Mode</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                  isFocusMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SM-2 & Mode Toggle Control Bar */}
          <div className={`px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs transition-colors ${
            isFocusMode
              ? 'bg-slate-800/80 border-slate-700 text-slate-300'
              : 'bg-slate-100/70 border-slate-200/80 text-slate-700'
          }`}>
            <div className="flex flex-wrap items-center gap-2">
              {!isFocusMode && (
                <button
                  type="button"
                  onClick={() => setUseSpacedRepetition(!useSpacedRepetition)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition border cursor-pointer ${
                    useSpacedRepetition
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                  title="Toggle SuperMemo SM-2 smart review scheduling algorithm"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {useSpacedRepetition ? 'SM-2 Repetition Active' : 'Sequential Mode'}
                </button>
              )}

              {/* Smart Sort Proficiency Tier Selector */}
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${
                isFocusMode
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-white border-slate-300 text-slate-700 shadow-2xs'
              }`}>
                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 flex items-center gap-1 shrink-0">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Smart Sort:
                </span>
                <select
                  value={smartSortMode}
                  onChange={(e) => {
                    setSmartSortMode(e.target.value as SmartSortFilter);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                    setShowHint(false);
                    setIsFinished(false);
                  }}
                  className="bg-transparent border-0 font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer pr-1"
                  title="Filter or group cards automatically by mastery proficiency tiers"
                >
                  <option value="ALL">All Cards ({deck.cards.length})</option>
                  <option value="SMART_GROUP">🧠 Smart Group (Struggling First)</option>
                  <option value="STRUGGLING">🔥 Struggling ({tierCounts.struggling})</option>
                  <option value="LEARNING">📖 Learning ({tierCounts.learning})</option>
                  <option value="MASTERED">⭐ Mastered ({tierCounts.mastered})</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleToggleShuffle}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition border cursor-pointer ${
                  isShuffled
                    ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                    : isFocusMode
                    ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-950'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
                title="Randomize question order for a fresh study session (maintains SM-2 due scheduling priority)"
              >
                <Shuffle className={`w-3.5 h-3.5 ${isShuffled ? 'text-white' : 'text-slate-500'}`} />
                <span>{isShuffled ? 'Shuffled Deck' : 'Shuffle Deck'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isAutoTtsEnabled) {
                    handleStopTts();
                  } else if (currentCard) {
                    speakCardText(isFlipped ? currentCard.back : currentCard.front);
                  }
                  setIsAutoTtsEnabled(!isAutoTtsEnabled);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition border cursor-pointer ${
                  isAutoTtsEnabled
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                    : isFocusMode
                    ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-950'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
                title="Automatically read questions and answers aloud for auditory learners"
              >
                {isAutoTtsEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Auto Read Aloud (TTS)</span>
              </button>

              {/* Auto-Play Toggle & Timing Settings Control */}
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition border cursor-pointer ${
                    isAutoPlay
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs font-black'
                      : isFocusMode
                      ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-950'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                  title={isAutoPlay ? "Pause Auto-Play card cycling" : "Start Auto-Play: automatically cycle through cards with custom timers"}
                >
                  {isAutoPlay ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-slate-950 text-slate-950 animate-pulse" />
                      <span>Auto-Playing ({isFlipped ? `${answerDuration}s Ans` : `${questionDuration}s Qn`})</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Auto-Play</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAutoPlaySettings(!showAutoPlaySettings)}
                  className={`p-1 rounded-lg border text-[10px] ml-1 transition cursor-pointer ${
                    showAutoPlaySettings
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : isFocusMode
                      ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                      : 'bg-white border-slate-300 text-slate-500 hover:text-slate-800'
                  }`}
                  title="Adjust question and answer display timing intervals for Auto-Play"
                >
                  <Sliders className="w-3 h-3" />
                </button>

                {/* Auto-Play Timing Popover Menu */}
                <AnimatePresence>
                  {showAutoPlaySettings && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xl w-64 text-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-extrabold text-xs flex items-center gap-1.5 text-slate-900">
                          <Timer className="w-3.5 h-3.5 text-amber-500" />
                          Auto-Play Display Timers
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAutoPlaySettings(false)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Question Timer Selection */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-600">Question Duration:</span>
                          <span className="text-amber-600 font-extrabold">{questionDuration}s</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[2, 3, 4, 5, 7, 10, 15].map((sec) => (
                            <button
                              key={`q-${sec}`}
                              type="button"
                              onClick={() => setQuestionDuration(sec)}
                              className={`flex-1 py-1 text-[10px] font-black rounded-lg border transition cursor-pointer ${
                                questionDuration === sec
                                  ? 'bg-amber-500 text-slate-950 border-amber-600'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Answer Timer Selection */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-600">Answer Duration:</span>
                          <span className="text-indigo-600 font-extrabold">{answerDuration}s</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[2, 3, 4, 5, 7, 10, 15].map((sec) => (
                            <button
                              key={`a-${sec}`}
                              type="button"
                              onClick={() => setAnswerDuration(sec)}
                              className={`flex-1 py-1 text-[10px] font-black rounded-lg border transition cursor-pointer ${
                                answerDuration === sec
                                  ? 'bg-indigo-600 text-white border-indigo-700'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t text-[10px] text-slate-500 flex items-center justify-between">
                        <span>Auto-cycles & flips cards</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAutoPlay(!isAutoPlay);
                            setShowAutoPlaySettings(false);
                          }}
                          className={`px-2.5 py-1 font-bold rounded-lg transition cursor-pointer ${
                            isAutoPlay
                              ? 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {isAutoPlay ? 'Stop Auto-Play' : 'Start Auto-Play'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {!isFocusMode && (
                <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    <Brain className="w-3 h-3 text-indigo-600" />
                    Ease Factor: {currentCardSm2.easeFactor.toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded-md">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    Interval: {currentCardSm2.interval}d
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowStreakCelebration(true)}
                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-black flex items-center gap-1 shadow-2xs transition cursor-pointer"
                title="View daily streak goal celebration & confetti"
              >
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
                <span>Streak Goal</span>
              </button>

              <div className={`flex items-center gap-1.5 font-bold ${isFocusMode ? 'text-amber-200' : 'text-slate-600'}`}>
                <span className={`${isFocusMode ? 'text-slate-400' : 'text-slate-400'} font-normal`}>Card:</span>
                <span>{Math.min(currentIndex + 1, totalCards)} / {totalCards}</span>
              </div>

              {!isFocusMode && (
                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Reset all mastery levels and SM-2 spaced repetition data for this deck"
                >
                  <RotateCcw className="w-3 h-3 text-rose-600" />
                  <span>Reset Progress</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Difficulty Level Filter Bar & Deck Composition Summary */}
          {(!isFocusMode || smartSortMode !== 'ALL') && (
            <div className={`px-6 py-2.5 border-b space-y-2 transition-colors ${
              isFocusMode
                ? 'bg-slate-900/90 border-slate-700 text-slate-200'
                : 'bg-slate-50/90 border-slate-200 text-slate-800'
            }`}>
              {/* Composition Breakdown Header & Segmented Visual Meter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-indigo-600" />
                    Deck Composition Summary:
                  </span>
                  <span className="font-mono font-black text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md text-[11px]">
                    {deck.cards.length} Total Cards
                  </span>
                </div>

                {/* Segmented Composition Percentage Breakdown Bar */}
                {deck.cards.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-36 sm:w-48 h-2.5 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                      {tierCounts.struggling > 0 && (
                        <div
                          className="bg-rose-500 h-full transition-all duration-300"
                          style={{ width: `${(tierCounts.struggling / deck.cards.length) * 100}%` }}
                          title={`Struggling: ${tierCounts.struggling} cards (${Math.round((tierCounts.struggling / deck.cards.length) * 100)}%)`}
                        />
                      )}
                      {tierCounts.learning > 0 && (
                        <div
                          className="bg-indigo-500 h-full transition-all duration-300"
                          style={{ width: `${(tierCounts.learning / deck.cards.length) * 100}%` }}
                          title={`Learning: ${tierCounts.learning} cards (${Math.round((tierCounts.learning / deck.cards.length) * 100)}%)`}
                        />
                      )}
                      {tierCounts.mastered > 0 && (
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${(tierCounts.mastered / deck.cards.length) * 100}%` }}
                          title={`Mastered: ${tierCounts.mastered} cards (${Math.round((tierCounts.mastered / deck.cards.length) * 100)}%)`}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Quick-Toggle Difficulty Tier Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setSmartSortMode('ALL');
                    setCurrentIndex(0);
                    setIsFlipped(false);
                    setShowHint(false);
                    setIsFinished(false);
                  }}
                  className={`px-3 py-1 rounded-xl font-black transition flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                    smartSortMode === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Cards ({deck.cards.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSmartSortMode('STRUGGLING');
                    setCurrentIndex(0);
                    setIsFlipped(false);
                    setShowHint(false);
                    setIsFinished(false);
                  }}
                  className={`px-3 py-1 rounded-xl font-black transition flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                    smartSortMode === 'STRUGGLING'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                      : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>Struggling</span>
                  <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                    smartSortMode === 'STRUGGLING' ? 'bg-rose-800 text-rose-100' : 'bg-rose-200/80 text-rose-900'
                  }`}>
                    {tierCounts.struggling}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSmartSortMode('LEARNING');
                    setCurrentIndex(0);
                    setIsFlipped(false);
                    setShowHint(false);
                    setIsFinished(false);
                  }}
                  className={`px-3 py-1 rounded-xl font-black transition flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                    smartSortMode === 'LEARNING'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Learning</span>
                  <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                    smartSortMode === 'LEARNING' ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-200/80 text-indigo-900'
                  }`}>
                    {tierCounts.learning}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSmartSortMode('MASTERED');
                    setCurrentIndex(0);
                    setIsFlipped(false);
                    setShowHint(false);
                    setIsFinished(false);
                  }}
                  className={`px-3 py-1 rounded-xl font-black transition flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                    smartSortMode === 'MASTERED'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                  <span>Mastered</span>
                  <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                    smartSortMode === 'MASTERED' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-200/80 text-emerald-900'
                  }`}>
                    {tierCounts.mastered}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSmartSortMode('SMART_GROUP');
                    setCurrentIndex(0);
                    setIsFlipped(false);
                    setShowHint(false);
                    setIsFinished(false);
                  }}
                  className={`px-3 py-1 rounded-xl font-black transition flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                    smartSortMode === 'SMART_GROUP'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                  title="Groups cards so struggling questions come first, followed by learning, then mastered"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Smart Priority</span>
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#5f6f52] via-indigo-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
            />
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[340px] relative">
            
            {/* Animated XP Toast Feedback */}
            <AnimatePresence>
              {xpToast && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.9 }}
                  className="absolute top-3 right-4 z-30 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black px-4 py-2 rounded-2xl shadow-xl border border-amber-300 flex items-center gap-2 text-xs"
                >
                  <Zap className="w-4 h-4 fill-slate-950 text-slate-950 animate-bounce" />
                  <span>+{xpToast.amount} XP</span>
                  <span className="font-bold text-slate-900 bg-amber-400/80 px-2 py-0.5 rounded-lg text-[11px]">
                    {xpToast.message}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SM-2 Scheduling Toast Feedback */}
            <AnimatePresence>
              {lastSm2Feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-3 z-20 bg-slate-900/90 text-white px-4 py-2 rounded-2xl shadow-xl border border-slate-700/50 flex items-center gap-2 text-xs font-semibold backdrop-blur-sm"
                >
                  <Sparkle className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>
                    {lastSm2Feedback.cardId === 'reset' ? (
                      <strong className="text-rose-400 font-extrabold">
                        Progress Reset: All card mastery levels & SM-2 schedules cleared!
                      </strong>
                    ) : (
                      <>
                        SM-2 Updated: Next review in <strong className="text-emerald-400 font-black">{lastSm2Feedback.interval} days</strong> (Ease Factor: {lastSm2Feedback.easeFactor.toFixed(2)})
                      </>
                    )}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {isFinished ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 max-w-md py-6"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                  <Trophy className="w-10 h-10 animate-bounce" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-amber-600 block mb-1">
                    🧠 SM-2 Spaced Repetition Complete!
                  </span>
                  <h4 className="font-serif font-black text-2xl text-slate-800">
                    Flashcard Practice Session Complete
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    You reviewed all {totalCards} cards using SuperMemo SM-2 adaptive scheduling. Cards have been queued for optimal memory retention based on your recall ratings.
                  </p>
                </div>

                {/* Session Rating Breakdown */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-red-50 border border-red-100 rounded-xl">
                    <span className="text-[10px] font-extrabold text-red-600 uppercase block">Again</span>
                    <span className="text-lg font-black text-red-700">{sessionRatingsCount.again}</span>
                  </div>
                  <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl">
                    <span className="text-[10px] font-extrabold text-amber-600 uppercase block">Hard</span>
                    <span className="text-lg font-black text-amber-700">{sessionRatingsCount.hard}</span>
                  </div>
                  <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] font-extrabold text-emerald-600 uppercase block">Good</span>
                    <span className="text-lg font-black text-emerald-700">{sessionRatingsCount.good}</span>
                  </div>
                  <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <span className="text-[10px] font-extrabold text-indigo-600 uppercase block">Easy</span>
                    <span className="text-lg font-black text-indigo-700">{sessionRatingsCount.easy}</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-around text-center">
                  <div>
                    <span className="text-xs text-slate-400 font-extrabold uppercase block">Streak Points</span>
                    <span className="text-xl font-black text-amber-600 flex items-center justify-center gap-1">
                      <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                      +1 Daily Streak
                    </span>
                  </div>
                  <div className="h-8 w-px bg-amber-200" />
                  <div>
                    <span className="text-xs text-slate-400 font-extrabold uppercase block">Focus XP</span>
                    <span className="text-xl font-black text-emerald-600 flex items-center justify-center gap-1">
                      <Star className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                      +25 XP Earned
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Review Deck Again
                  </button>
                  <button
                    type="button"
                    onClick={handleResetProgress}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    Reset All Progress
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-[#5f6f52] hover:bg-[#4d5b42] text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
                  >
                    Continue Pathway
                  </button>
                </div>
              </motion.div>
            ) : currentCard ? (
              <div className="w-full flex flex-col items-center">
                {/* Auto-Play Live Timer Progress Indicator */}
                {isAutoPlay && (
                  <div className="w-full mb-3 space-y-1 bg-amber-50/80 border border-amber-200 p-2.5 rounded-2xl">
                    <div className="flex items-center justify-between text-[11px] font-extrabold">
                      <span className="text-amber-900 flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        {isFlipped ? `Auto-Displaying Answer (${answerDuration}s)` : `Auto-Displaying Question (${questionDuration}s)`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAutoPlay(false)}
                        className="text-[10px] font-black uppercase text-amber-800 hover:text-amber-950 bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded-md transition cursor-pointer"
                      >
                        Pause
                      </button>
                    </div>
                    <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-75 ${
                          isFlipped ? 'bg-indigo-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${autoPlayProgressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 3D Framer Motion Animated Flashcard Flip Box */}
                <div className="w-full [perspective:1000px] my-2">
                  <motion.div
                    onClick={handleFlip}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="w-full min-h-[280px] cursor-pointer select-none relative"
                  >
                    {/* FRONT SIDE (Question) */}
                    <div
                      style={{ backfaceVisibility: 'hidden' }}
                      className="absolute inset-0 w-full h-full p-6 sm:p-8 rounded-3xl border-2 transition-colors flex flex-col justify-between shadow-md hover:shadow-lg bg-white border-slate-200 text-slate-800 hover:border-[#5f6f52]/50"
                    >
                      {/* Card category tag, mastery tier badge & side badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5f6f52] bg-[#5f6f52]/10 px-2.5 py-1 rounded-full">
                            {currentCard.category || 'Core Concept'}
                          </span>
                          {(() => {
                            const tier = getCardMasteryTier(currentCard, sm2CardMap, masteredIds);
                            if (tier === 'STRUGGLING') {
                              return (
                                <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-200/90 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-3xs">
                                  <Flame className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                                  Struggling
                                </span>
                              );
                            }
                            if (tier === 'LEARNING') {
                              return (
                                <span className="text-[9px] font-black uppercase text-blue-800 bg-blue-100 border border-blue-200/90 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-3xs">
                                  <Brain className="w-2.5 h-2.5 text-blue-600" />
                                  Learning
                                </span>
                              );
                            }
                            return (
                              <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-200/90 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-3xs">
                                <Star className="w-2.5 h-2.5 text-emerald-600 fill-emerald-500" />
                                Mastered
                              </span>
                            );
                          })()}
                          {currentCardSm2.repetition > 0 && (
                            <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                              Rep #{currentCardSm2.repetition}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 bg-slate-100 text-slate-600">
                            <RotateCw className="w-3 h-3" />
                            Question Side
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isPlayingTts) {
                                handleStopTts();
                              } else {
                                speakCardText(currentCard.front);
                              }
                            }}
                            className={`p-1.5 rounded-full border transition cursor-pointer flex items-center justify-center ${
                              isPlayingTts
                                ? 'bg-emerald-500 text-white border-emerald-600 animate-pulse'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                            }`}
                            title={isPlayingTts ? "Stop Audio" : "Listen to question text"}
                          >
                            {isPlayingTts ? <Volume2 className="w-3.5 h-3.5 text-white" /> : <Volume1 className="w-3.5 h-3.5 text-slate-600" />}
                          </button>
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="py-4 text-center my-auto overflow-y-auto max-h-[140px]">
                        <p className="font-serif leading-relaxed text-xl font-bold text-slate-900">
                          {currentCard.front}
                        </p>

                        {/* Hint reveal option if front */}
                        {currentCard.hint && (
                          <div className="mt-3">
                            {showHint ? (
                              <motion.p
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs italic text-amber-700 bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-1.5 inline-block"
                              >
                                💡 Hint: {currentCard.hint}
                              </motion.p>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowHint(true);
                                }}
                                className="text-xs text-amber-600 hover:text-amber-800 font-bold underline flex items-center gap-1 mx-auto cursor-pointer"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                                Reveal Memory Hint
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer instruction */}
                      <div className="text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Click card or press Spacebar to flip
                      </div>
                    </div>

                    {/* BACK SIDE (Answer) */}
                    <div
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      className="absolute inset-0 w-full h-full p-6 sm:p-8 rounded-3xl border-2 transition-colors flex flex-col justify-between shadow-md hover:shadow-lg bg-gradient-to-br from-indigo-50/60 via-emerald-50/40 to-white border-indigo-200 text-slate-800"
                    >
                      {/* Card category tag, mastery tier badge & side badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-full">
                            {currentCard.category || 'Core Concept'}
                          </span>
                          {(() => {
                            const tier = getCardMasteryTier(currentCard, sm2CardMap, masteredIds);
                            if (tier === 'STRUGGLING') {
                              return (
                                <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-200/90 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-3xs">
                                  <Flame className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                                  Struggling
                                </span>
                              );
                            }
                            if (tier === 'LEARNING') {
                              return (
                                <span className="text-[9px] font-black uppercase text-blue-800 bg-blue-100 border border-blue-200/90 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-3xs">
                                  <Brain className="w-2.5 h-2.5 text-blue-600" />
                                  Learning
                                </span>
                              );
                            }
                            return (
                              <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-200/90 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-3xs">
                                <Star className="w-2.5 h-2.5 text-emerald-600 fill-emerald-500" />
                                Mastered
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 bg-indigo-100 text-indigo-800">
                            <RotateCw className="w-3 h-3" />
                            Answer Side
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isPlayingTts) {
                                handleStopTts();
                              } else {
                                speakCardText(currentCard.back);
                              }
                            }}
                            className={`p-1.5 rounded-full border transition cursor-pointer flex items-center justify-center ${
                              isPlayingTts
                                ? 'bg-emerald-500 text-white border-emerald-600 animate-pulse'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                            }`}
                            title={isPlayingTts ? "Stop Audio" : "Listen to answer text"}
                          >
                            {isPlayingTts ? <Volume2 className="w-3.5 h-3.5 text-white" /> : <Volume1 className="w-3.5 h-3.5 text-slate-600" />}
                          </button>
                        </div>
                      </div>

                      {/* Answer Content */}
                      <div className="py-4 text-center my-auto overflow-y-auto max-h-[140px]">
                        <p className="font-serif leading-relaxed text-lg font-medium text-slate-800">
                          {currentCard.back}
                        </p>
                      </div>

                      {/* Footer instruction */}
                      <div className="text-center text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                        Select SM-2 Recall Quality below to advance
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* SM-2 Recall Quality Rating Controls when Answer is Flipped */}
                {isFlipped ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full mt-5 space-y-2"
                  >
                    <div className="text-center">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                        How well did you recall this card? (SuperMemo SM-2 Rating)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSm2Review(0)}
                        className="p-2.5 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-2xs group"
                      >
                        <span className="font-extrabold text-xs group-hover:scale-105 transition">Again (0)</span>
                        <span className="text-[10px] text-red-600/90 font-medium">Reset • 1 day</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSm2Review(2)}
                        className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-2xs group"
                      >
                        <span className="font-extrabold text-xs group-hover:scale-105 transition">Hard (2)</span>
                        <span className="text-[10px] text-amber-700/90 font-medium">Slow • 1d–2d</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSm2Review(4)}
                        className="p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-2xs group"
                      >
                        <span className="font-extrabold text-xs group-hover:scale-105 transition">Good (4)</span>
                        <span className="text-[10px] text-emerald-700/90 font-medium">Solid • {calculateSM2(4, currentCardSm2).interval}d</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSm2Review(5)}
                        className="p-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-2xs group"
                      >
                        <span className="font-extrabold text-xs group-hover:scale-105 transition">Easy (5)</span>
                        <span className="text-[10px] text-indigo-700/90 font-medium">Perfect • {calculateSM2(5, currentCardSm2).interval}d</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Standard Navigation Bar when Question is shown */
                  <div className="w-full flex flex-col gap-2 mt-6">
                    <div className="w-full flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePrev}
                          disabled={currentIndex === 0}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer"
                          title="Previous card (Left Arrow key)"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Prev</span>
                          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-slate-100 border border-slate-300 rounded text-slate-500">←</kbd>
                        </button>
                        <button
                          type="button"
                          onClick={handleNext}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
                          title="Skip or Next card (Right Arrow key)"
                        >
                          <span>Skip / Next</span>
                          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-slate-100 border border-slate-300 rounded text-slate-500">→</kbd>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleFlip()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer"
                          title="Flip card (Spacebar)"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Flip & Show Answer</span>
                          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-indigo-700/80 border border-indigo-400/50 rounded text-indigo-100">Space</kbd>
                        </button>
                      </div>
                    </div>

                    <div className="text-center text-[10px] text-slate-400 font-medium flex items-center justify-center gap-3 pt-1">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.2 bg-slate-100 border border-slate-300 rounded text-[9px] font-mono text-slate-600">←</kbd>
                        <kbd className="px-1 py-0.2 bg-slate-100 border border-slate-300 rounded text-[9px] font-mono text-slate-600">→</kbd>
                        Navigate
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.2 bg-slate-100 border border-slate-300 rounded text-[9px] font-mono text-slate-600">Space</kbd>
                        Flip Card
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-3 py-10">
                <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
                  <Filter className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-slate-800 text-base">No Cards in this Mastery Tier</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  There are currently no flashcards matching the <strong className="text-indigo-600 font-bold">{smartSortMode}</strong> proficiency tier.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSmartSortMode('ALL');
                    setCurrentIndex(0);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer transition shadow-sm"
                >
                  View All Cards ({deck.cards.length})
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Framer-Motion Powered Confetti Particle Streak Celebration Overlay */}
      <StreakCelebrationOverlay
        isOpen={showStreakCelebration}
        onClose={() => setShowStreakCelebration(false)}
        streakDays={currentXpData.streakDays}
        cardsReviewedToday={sessionCardsReviewed}
        dailyGoalTarget={5}
        xpEarned={100}
        onReplayConfetti={() => {
          setShowStreakCelebration(false);
          setTimeout(() => setShowStreakCelebration(true), 120);
        }}
      />
    </AnimatePresence>
  );
};

export default FlashcardDeckModal;

