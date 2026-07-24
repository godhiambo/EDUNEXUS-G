import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  Zap,
  Flame,
  Trophy,
  Star,
  CheckCircle2,
  ChevronRight,
  Layers,
  Sparkles,
  TrendingUp,
  History,
  Shield,
  Play,
  RotateCcw,
  PartyPopper,
  Crown,
  Target,
  X
} from 'lucide-react';
import {
  getStudentXpData,
  calculateLevel,
  XP_UPDATE_EVENT,
  StudentXpData
} from '../utils/studentXp';
import StreakBadgeSystem from './StreakBadgeSystem';

interface StudentXpWidgetProps {
  onOpenFlashcards?: () => void;
  compact?: boolean;
}

interface CelebrationState {
  type: 'streak' | 'mastery' | 'milestone';
  title: string;
  subtitle: string;
  count: number;
}

// Generate random particles for framer-motion celebration burst
const CELEBRATION_PARTICLES = Array.from({ length: 28 }).map((_, i) => ({
  id: i,
  x: (Math.random() - 0.5) * 320,
  y: -120 - Math.random() * 180,
  rotate: Math.random() * 720 - 360,
  scale: 0.6 + Math.random() * 0.8,
  color: [
    '#f59e0b', // amber
    '#10b981', // emerald
    '#6366f1', // indigo
    '#ec4899', // pink
    '#ef4444', // red
    '#8b5cf6', // purple
    '#3b82f6', // blue
  ][i % 7],
  shape: ['circle', 'square', 'star'][i % 3]
}));

export default function StudentXpWidget({ onOpenFlashcards, compact = false }: StudentXpWidgetProps) {
  const [xpData, setXpData] = useState<StudentXpData>(getStudentXpData);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBadgesSection, setShowBadgesSection] = useState(true);
  const [recentGainToast, setRecentGainToast] = useState<{ amount: number; desc: string } | null>(null);
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);

  // Daily Goal Targets
  const DAILY_STREAK_GOAL = 5;
  const DAILY_MASTERY_GOAL = 10;

  // Synthesize fan-fare audio sound effect on goal reached
  const playCelebrationSound = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
      });
    } catch (e) {
      console.warn('AudioContext fanfare failed:', e);
    }
  };

  const triggerGoalCelebration = (type: 'streak' | 'mastery' | 'milestone', countVal?: number) => {
    playCelebrationSound();
    if (type === 'streak') {
      const currentStreak = countVal ?? xpData.streakDays;
      setCelebration({
        type: 'streak',
        title: '🔥 Daily Streak Goal Unlocked!',
        subtitle: `Incredible dedication! You have hit your ${currentStreak}-day learning streak goal!`,
        count: currentStreak
      });
    } else if (type === 'mastery') {
      const currentMastered = countVal ?? xpData.cardsMastered;
      setCelebration({
        type: 'mastery',
        title: '⭐ Flashcard Mastery Goal Reached!',
        subtitle: `Fantastic retention! You have successfully mastered ${currentMastered} concept flashcards!`,
        count: currentMastered
      });
    } else {
      setCelebration({
        type: 'milestone',
        title: '👑 Grandmaster Scholar Milestone!',
        subtitle: 'Outstanding study performance! All daily flashcard mastery & streak targets completed!',
        count: xpData.totalXp
      });
    }
  };

  useEffect(() => {
    const handleXpUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.updatedData) {
        const prevData = xpData;
        const newData: StudentXpData = customEvent.detail.updatedData;
        setXpData(newData);

        // Check if a streak goal or card mastery goal was just reached
        if (newData.streakDays >= DAILY_STREAK_GOAL && prevData.streakDays < DAILY_STREAK_GOAL) {
          triggerGoalCelebration('streak', newData.streakDays);
        } else if (newData.cardsMastered >= DAILY_MASTERY_GOAL && prevData.cardsMastered < DAILY_MASTERY_GOAL) {
          triggerGoalCelebration('mastery', newData.cardsMastered);
        } else if (customEvent.detail.activity) {
          setRecentGainToast({
            amount: customEvent.detail.activity.amount,
            desc: customEvent.detail.activity.description
          });
          setTimeout(() => setRecentGainToast(null), 3000);
        }
      } else {
        setXpData(getStudentXpData());
      }
    };

    window.addEventListener(XP_UPDATE_EVENT, handleXpUpdate);
    return () => window.removeEventListener(XP_UPDATE_EVENT, handleXpUpdate);
  }, [xpData]);

  const {
    level,
    currentLevelXp,
    xpNeededForNext,
    progressPct,
    rankTitle,
    rankBadge,
    rankColor
  } = calculateLevel(xpData.totalXp);

  const streakProgressPct = Math.min(100, Math.round((xpData.streakDays / DAILY_STREAK_GOAL) * 100));
  const masteryProgressPct = Math.min(100, Math.round((xpData.cardsMastered / DAILY_MASTERY_GOAL) * 100));
  const isStreakGoalReached = xpData.streakDays >= DAILY_STREAK_GOAL;
  const isMasteryGoalReached = xpData.cardsMastered >= DAILY_MASTERY_GOAL;

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-slate-700 shadow-sm">
        <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
          ⚡
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
            <span>Lvl {level}</span>
            <span className="text-amber-400 font-extrabold">{xpData.totalXp} XP</span>
          </div>
          <div className="w-20 bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-3xs relative overflow-hidden space-y-4">
      {/* Decorative Gradient Background Glow */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Goal Celebration Framer-Motion Modal Overlay */}
      <AnimatePresence>
        {celebration && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
            {/* Particle Explosion Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
              {CELEBRATION_PARTICLES.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
                  animate={{
                    x: p.x,
                    y: p.y,
                    opacity: [1, 1, 0],
                    scale: [0, p.scale, p.scale * 0.5],
                    rotate: p.rotate
                  }}
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                  className="absolute w-3 h-3"
                  style={{
                    backgroundColor: p.color,
                    borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'star' ? '20%' : '2px'
                  }}
                />
              ))}
            </div>

            {/* Modal Content Box */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
              className="bg-white border-2 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center space-y-5 overflow-hidden"
            >
              {/* Top Accent Gradient Ribbon */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-400 via-emerald-400 to-indigo-500" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setCelebration(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Animated Icon Ring */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-4 border-dashed border-amber-400/60"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-emerald-400 text-slate-950 flex items-center justify-center shadow-lg"
                >
                  {celebration.type === 'streak' ? (
                    <Flame className="w-9 h-9 text-slate-950 fill-amber-950 animate-bounce" />
                  ) : celebration.type === 'mastery' ? (
                    <Trophy className="w-9 h-9 text-slate-950 fill-amber-950 animate-bounce" />
                  ) : (
                    <Crown className="w-9 h-9 text-slate-950 fill-amber-950 animate-bounce" />
                  )}
                </motion.div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full inline-block">
                  🎯 Milestone Accomplished
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {celebration.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium max-w-sm mx-auto">
                  {celebration.subtitle}
                </p>
              </div>

              {/* Counter Highlight Box */}
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="bg-gradient-to-r from-amber-50 via-emerald-50 to-indigo-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-around"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Streak Target</span>
                  <span className="text-lg font-black text-amber-600">{xpData.streakDays} / {DAILY_STREAK_GOAL} Days 🔥</span>
                </div>
                <div className="w-px h-8 bg-amber-200" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Mastery Target</span>
                  <span className="text-lg font-black text-emerald-600">{xpData.cardsMastered} / {DAILY_MASTERY_GOAL} Cards ⭐</span>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => triggerGoalCelebration(celebration.type)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay Animation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCelebration(null)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl transition shadow-md active:scale-95 cursor-pointer"
                >
                  Keep Learning!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating XP Gain Toast */}
      <AnimatePresence>
        {recentGainToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute top-3 right-4 z-20 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black px-3 py-1.5 rounded-xl shadow-lg border border-amber-300 flex items-center gap-2 text-xs"
          >
            <Sparkles className="w-4 h-4 text-white fill-white animate-spin" />
            <span>+{recentGainToast.amount} XP Earned!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-3">
          {/* Avatar Level Badge Circle */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-amber-400 font-serif font-black text-xl flex items-center justify-center shadow-sm border border-slate-800">
              {rankBadge}
            </div>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-black uppercase rounded-full border border-white shadow-3xs">
              Lvl {level}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-extrabold text-base text-slate-900 tracking-tight">
                Learner Mastery Profile
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${rankColor}`}>
                {rankTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Earn XP by reviewing & mastering flashcards</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {xpData.streakDays} Day Streak
              </span>
            </p>
          </div>
        </div>

        {/* Action Header Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Badge System Toggle */}
          <button
            type="button"
            onClick={() => setShowBadgesSection(prev => !prev)}
            className={`px-3 py-2 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-3xs border ${
              showBadgesSection
                ? 'bg-amber-500 text-slate-950 border-amber-600'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
            }`}
            title="Toggle Multi-day Streak Badge System"
          >
            <Award className="w-3.5 h-3.5 fill-current" />
            <span>{showBadgesSection ? 'Hide Badge System' : 'Streak Badges'}</span>
          </button>

          {/* Manual Celebration Trigger for testing/previewing animation */}
          <button
            type="button"
            onClick={() => triggerGoalCelebration('streak')}
            className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-3xs border border-amber-300"
            title="Preview Framer-Motion Goal Reached Animation"
          >
            <PartyPopper className="w-3.5 h-3.5 text-amber-700" />
            <span>Test Goal Animation</span>
          </button>

          {onOpenFlashcards && (
            <button
              type="button"
              onClick={onOpenFlashcards}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Play Flashcards & Earn XP</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Stats & Progress Bar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Total XP Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 border border-amber-200/80 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-900 font-extrabold">
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
              Total Experience
            </span>
            <span className="text-[10px] uppercase font-mono text-amber-700">Level {level}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-serif">
              {xpData.totalXp.toLocaleString()} <span className="text-xs font-sans font-extrabold text-amber-600">XP</span>
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              +{currentLevelXp} in Lvl {level}
            </span>
          </div>
        </div>

        {/* Level Progress Bar Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 md:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-indigo-600" />
              Progress to Level {level + 1}
            </span>
            <span className="font-mono text-xs font-bold text-indigo-700">
              {currentLevelXp} / {xpNeededForNext} XP ({progressPct}%)
            </span>
          </div>

          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5 relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-indigo-600 shadow-xs"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>Current Level {level}</span>
            <span>{100 - currentLevelXp} XP remaining for Level {level + 1}</span>
          </div>
        </div>
      </div>

      {/* Interactive Goal Mastery Progress Bars (Streak Goal & Cards Mastery Goal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Daily Streak Goal Progress Bar */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={() => triggerGoalCelebration('streak')}
          className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
            isStreakGoalReached
              ? 'bg-gradient-to-r from-amber-50 to-amber-100/60 border-amber-300 shadow-3xs'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={isStreakGoalReached ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Flame className={`w-4 h-4 ${isStreakGoalReached ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
              </motion.div>
              <span className="font-extrabold text-slate-800">Daily Streak Goal</span>
            </div>
            <span className="text-[10px] font-mono font-extrabold text-amber-700">
              {xpData.streakDays} / {DAILY_STREAK_GOAL} Days {isStreakGoalReached && '🎉 Goal Hit!'}
            </span>
          </div>
          <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${streakProgressPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
            />
          </div>
        </motion.div>

        {/* Daily Flashcard Mastery Goal Progress Bar */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={() => triggerGoalCelebration('mastery')}
          className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
            isMasteryGoalReached
              ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/60 border-emerald-300 shadow-3xs'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={isMasteryGoalReached ? { scale: [1, 1.25, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Star className={`w-4 h-4 ${isMasteryGoalReached ? 'text-emerald-500 fill-emerald-500' : 'text-slate-400'}`} />
              </motion.div>
              <span className="font-extrabold text-slate-800">Card Mastery Goal</span>
            </div>
            <span className="text-[10px] font-mono font-extrabold text-emerald-700">
              {xpData.cardsMastered} / {DAILY_MASTERY_GOAL} Cards {isMasteryGoalReached && '⭐ Goal Hit!'}
            </span>
          </div>
          <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${masteryProgressPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
            />
          </div>
        </motion.div>
      </div>

      {/* Gamification Sub-metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <span className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">
              Cards Mastered
            </span>
            <span className="text-sm font-black text-slate-900">
              {xpData.cardsMastered} ⭐
            </span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <span className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">
              Total Reviews
            </span>
            <span className="text-sm font-black text-slate-900">
              {xpData.totalReviews} Cards
            </span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
          </div>
          <div>
            <span className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">
              Daily Streak
            </span>
            <span className="text-sm font-black text-slate-900">
              {xpData.streakDays} Days 🔥
            </span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <span className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">
              Current Rank
            </span>
            <span className="text-xs font-black text-slate-900 truncate block max-w-[100px]" title={rankTitle}>
              {rankBadge} {rankTitle}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Embedded Multi-Day Streak & Mastery Badge System Component */}
      {showBadgesSection && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="pt-2"
        >
          <StreakBadgeSystem onOpenFlashcards={onOpenFlashcards} />
        </motion.div>
      )}

      {/* Recent XP Activity Feed Toggle */}
      <div className="pt-1 flex items-center justify-between border-t border-slate-100">
        <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-slate-400" />
          Recent Mastery Log ({xpData.history.length})
        </span>

        <button
          type="button"
          onClick={() => setShowHistoryModal(prev => !prev)}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer"
        >
          <span>{showHistoryModal ? 'Hide Activity Feed' : 'View Activity Log'}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showHistoryModal ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Activity History Expansion Drawer */}
      {showHistoryModal && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2 max-h-56 overflow-y-auto scrollbar-thin"
        >
          {xpData.history.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-2">No XP activity logged yet. Start playing flashcards!</p>
          ) : (
            xpData.history.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 text-xs shadow-3xs"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    act.type === 'card_mastered'
                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                      : act.type === 'deck_completed'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {act.type === 'card_mastered' ? '⭐' : act.type === 'deck_completed' ? '🏆' : '⚡'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block leading-tight">{act.description}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <span className="font-serif font-black text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                  +{act.amount} XP
                </span>
              </div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}

