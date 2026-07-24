import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  Flame,
  Star,
  CheckCircle2,
  Lock,
  Sparkles,
  Trophy,
  Pin,
  ChevronRight,
  RotateCw,
  Zap,
  X,
  Share2,
  PartyPopper,
  ShieldAlert
} from 'lucide-react';
import {
  STREAK_BADGES,
  StreakBadge,
  getUnlockedBadgeRecords,
  saveUnlockedBadgeRecord,
  setBadgeFeatured,
  checkAndAutoUnlockBadges,
  BADGE_UNLOCK_EVENT,
  UnlockedBadgeRecord
} from '../utils/streakBadges';
import { getStudentXpData, awardStudentXp, XP_UPDATE_EVENT } from '../utils/studentXp';

interface StreakBadgeSystemProps {
  onOpenFlashcards?: () => void;
  compactView?: boolean;
}

// Particle generator for badge celebration popup
const BADGE_CELEBRATION_PARTICLES = Array.from({ length: 36 }).map((_, i) => ({
  id: i,
  x: (Math.random() - 0.5) * 360,
  y: -140 - Math.random() * 200,
  rotate: Math.random() * 720 - 360,
  scale: 0.5 + Math.random() * 0.9,
  color: [
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#eab308'  // Yellow
  ][i % 7],
  shape: ['circle', 'square', 'star'][i % 3]
}));

export const StreakBadgeSystem: React.FC<StreakBadgeSystemProps> = ({
  onOpenFlashcards,
  compactView = false
}) => {
  const [xpData, setXpData] = useState(getStudentXpData);
  const [unlockedMap, setUnlockedMap] = useState<Record<string, UnlockedBadgeRecord>>(getUnlockedBadgeRecords);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNLOCKED' | 'STREAK' | 'MASTERY'>('ALL');
  const [selectedBadge, setSelectedBadge] = useState<StreakBadge | null>(null);
  const [celebrationBadge, setCelebrationBadge] = useState<StreakBadge | null>(null);
  const [showSimulateBar, setShowSimulateBar] = useState(false);

  // Play fanfare sound effect on badge unlock
  const playFanfare = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.35);
      });
    } catch (err) {
      console.warn('Audio fan-fare failed:', err);
    }
  };

  // Sync state on XP or Badge updates
  useEffect(() => {
    const refreshData = () => {
      const currentXp = getStudentXpData();
      setXpData(currentXp);
      const currentUnlocked = getUnlockedBadgeRecords();
      setUnlockedMap(currentUnlocked);

      // Check if current streak or cards mastered unlocks any badges automatically
      const newlyUnlocked = checkAndAutoUnlockBadges(currentXp.streakDays, currentXp.cardsMastered);
      if (newlyUnlocked.length > 0) {
        setUnlockedMap(getUnlockedBadgeRecords());
        setCelebrationBadge(newlyUnlocked[0]);
        playFanfare();
      }
    };

    refreshData();

    window.addEventListener(XP_UPDATE_EVENT, refreshData);
    window.addEventListener(BADGE_UNLOCK_EVENT, refreshData);
    return () => {
      window.removeEventListener(XP_UPDATE_EVENT, refreshData);
      window.removeEventListener(BADGE_UNLOCK_EVENT, refreshData);
    };
  }, []);

  // Filtered badges list
  const filteredBadges = useMemo(() => {
    return STREAK_BADGES.filter((b) => {
      if (activeTab === 'UNLOCKED') return !!unlockedMap[b.id];
      if (activeTab === 'STREAK') return b.category === 'STREAK';
      if (activeTab === 'MASTERY') return b.category === 'MASTERY';
      return true;
    });
  }, [activeTab, unlockedMap]);

  // Featured Badges pinned by the user
  const featuredBadges = useMemo(() => {
    return STREAK_BADGES.filter((b) => unlockedMap[b.id]?.featured);
  }, [unlockedMap]);

  // Calculate Next Milestone
  const nextMilestoneBadge = useMemo(() => {
    const lockedStreakBadges = STREAK_BADGES.filter(
      (b) => b.category === 'STREAK' && !unlockedMap[b.id]
    ).sort((a, b) => (a.milestoneStreakDays || 0) - (b.milestoneStreakDays || 0));

    return lockedStreakBadges[0] || null;
  }, [unlockedMap]);

  const unlockedCount = Object.keys(unlockedMap).length;
  const totalCount = STREAK_BADGES.length;
  const unlockProgressPct = Math.min(100, Math.round((unlockedCount / totalCount) * 100));

  // Toggle Featured status
  const handleToggleFeatured = (badgeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlyFeatured = !!unlockedMap[badgeId]?.featured;
    setBadgeFeatured(badgeId, !isCurrentlyFeatured);
    setUnlockedMap(getUnlockedBadgeRecords());
  };

  // Quick Manual Test Unlock
  const handleTestUnlockBadge = (badge: StreakBadge) => {
    saveUnlockedBadgeRecord(badge.id);
    awardStudentXp(badge.xpReward, `Unlocked "${badge.name}" Badge Milestone`, 'streak_bonus');
    setUnlockedMap(getUnlockedBadgeRecords());
    setCelebrationBadge(badge);
    playFanfare();
  };

  // Simulate streak days directly
  const handleSimulateStreakDays = (targetDays: number) => {
    const current = getStudentXpData();
    const updated = { ...current, streakDays: targetDays };
    localStorage.setItem('edunexus_student_xp_profile_v1', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(XP_UPDATE_EVENT, { detail: { updatedData: updated } }));
  };

  if (compactView) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-3xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
              Streak & Milestone Badges
            </h4>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
            {unlockedCount} / {totalCount} Earned
          </span>
        </div>

        {/* Featured Badges Horizontal Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STREAK_BADGES.slice(0, 5).map((badge) => {
            const isUnlocked = !!unlockedMap[badge.id];
            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center shrink-0 cursor-pointer transition relative ${
                  isUnlocked
                    ? `${badge.tierColor.bg} ${badge.tierColor.border} shadow-3xs hover:scale-105`
                    : 'bg-slate-100 border-slate-200 opacity-50 grayscale'
                }`}
                title={`${badge.name}: ${badge.description}`}
              >
                <span className="text-xl leading-none">{badge.icon}</span>
                {!isUnlocked && (
                  <Lock className="w-2.5 h-2.5 text-slate-500 absolute bottom-1 right-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-3xs relative overflow-hidden space-y-5">
      {/* Decorative Aura */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 rounded-xl shadow-xs">
              <Award className="w-5 h-5 text-slate-950 fill-amber-950" />
            </span>
            <div>
              <h3 className="font-serif font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
                Streak & Mastery Badge System
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Earn prestige badges and XP bonuses by maintaining multi-day study streaks & concept mastery.
              </p>
            </div>
          </div>
        </div>

        {/* Counter Summary & Test Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>Badges Unlocked:</span>
            <span className="font-mono font-black text-amber-700 text-sm">
              {unlockedCount} / {totalCount}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowSimulateBar(!showSimulateBar)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Toggle Evaluator Test Bar to test multi-day streaks"
          >
            <PartyPopper className="w-3.5 h-3.5 text-slate-600" />
            <span>{showSimulateBar ? 'Hide Test Bar' : 'Test Streak Bar'}</span>
          </button>
        </div>
      </div>

      {/* Evaluator Streak Simulation Quick Bar */}
      {showSimulateBar && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              Evaluator Streak Testing Simulator:
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Current Streak: {xpData.streakDays} Days
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            Click any milestone target to simulate your study streak and watch Framer Motion celebration overlays unlock:
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[3, 7, 14, 30, 60, 100].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => handleSimulateStreakDays(days)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs flex items-center gap-1 ${
                  xpData.streakDays >= days
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <span>🔥 {days}-Day Streak</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Featured Badges Showcase Strip (if any pinned) */}
      {featuredBadges.length > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-50 border border-amber-200/80 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              Featured Profile Showcase Badges ({featuredBadges.length})
            </span>
            <span className="text-[10px] text-slate-500 italic">Displayed on Learner Dashboard Header</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {featuredBadges.map((badge) => (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedBadge(badge)}
                className={`p-2.5 rounded-xl border ${badge.tierColor.bg} ${badge.tierColor.border} shadow-3xs flex items-center gap-2.5 shrink-0 cursor-pointer`}
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-xl shadow-xs">
                  {badge.icon}
                </div>
                <div>
                  <span className="font-serif font-bold text-xs text-slate-900 block leading-tight">
                    {badge.name}
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-700 block">
                    {badge.rarity} • +{badge.xpReward} XP
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Next Milestone Goal Banner */}
      {nextMilestoneBadge && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
              {nextMilestoneBadge.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Target Milestone
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {nextMilestoneBadge.rarity} Reward
                </span>
              </div>
              <h4 className="text-base font-serif font-extrabold text-white mt-0.5">
                {nextMilestoneBadge.name} ({nextMilestoneBadge.milestoneStreakDays}-Day Streak)
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {nextMilestoneBadge.description}
              </p>
            </div>
          </div>

          {/* Progress to next milestone */}
          <div className="w-full sm:w-48 shrink-0 space-y-1.5 text-right">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 text-[10px]">Streak Progress</span>
              <span className="text-amber-400 font-bold">
                {xpData.streakDays} / {nextMilestoneBadge.milestoneStreakDays} Days
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (xpData.streakDays / (nextMilestoneBadge.milestoneStreakDays || 1)) * 100
                    )
                  )}%`
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">
              {Math.max(0, (nextMilestoneBadge.milestoneStreakDays || 0) - xpData.streakDays)} day(s) remaining for +{nextMilestoneBadge.xpReward} XP!
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-3xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Badges ({STREAK_BADGES.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('UNLOCKED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'UNLOCKED'
                ? 'bg-amber-500 text-slate-950 font-black shadow-3xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Unlocked ({unlockedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STREAK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'STREAK'
                ? 'bg-orange-600 text-white font-black shadow-3xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Streak Milestones</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MASTERY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'MASTERY'
                ? 'bg-emerald-600 text-white font-black shadow-3xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Card Mastery</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          Overall Mastery: {unlockProgressPct}%
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredBadges.map((badge) => {
          const isUnlocked = !!unlockedMap[badge.id];
          const record = unlockedMap[badge.id];
          const isFeatured = !!record?.featured;

          return (
            <motion.div
              key={badge.id}
              whileHover={{ y: -3, scale: 1.01 }}
              onClick={() => setSelectedBadge(badge)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between overflow-hidden shadow-3xs hover:shadow-md ${
                isUnlocked
                  ? `${badge.tierColor.bg} ${badge.tierColor.border}`
                  : 'bg-slate-50/80 border-slate-200 opacity-75'
              }`}
            >
              {/* Badge Top Info Bar */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl shrink-0 shadow-xs transition-transform ${
                      isUnlocked
                        ? 'bg-white border-white/80 shadow-md scale-100'
                        : 'bg-slate-200 border-slate-300 grayscale opacity-60 scale-95'
                    }`}
                  >
                    {badge.icon}
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                      {badge.rarity} • {badge.category}
                    </span>
                    <h4 className="font-serif font-extrabold text-sm text-slate-900 leading-tight mt-0.5">
                      {badge.name}
                    </h4>
                  </div>
                </div>

                {/* Status Pin / Lock Badge */}
                {isUnlocked ? (
                  <button
                    type="button"
                    onClick={(e) => handleToggleFeatured(badge.id, e)}
                    className={`p-1.5 rounded-xl border transition cursor-pointer ${
                      isFeatured
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-3xs'
                        : 'bg-white/80 text-slate-400 hover:text-amber-600 border-slate-200'
                    }`}
                    title={isFeatured ? "Unpin from profile showcase" : "Pin badge to profile showcase"}
                  >
                    <Pin className={`w-3.5 h-3.5 ${isFeatured ? 'fill-slate-950' : ''}`} />
                  </button>
                ) : (
                  <div className="p-1.5 bg-slate-200/90 text-slate-500 rounded-xl border border-slate-300">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Middle Description */}
              <p className="text-xs text-slate-600 mt-3 leading-relaxed font-medium line-clamp-2">
                {badge.description}
              </p>

              {/* Bottom Criteria & Action Footer */}
              <div className="mt-4 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                {isUnlocked ? (
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Unlocked
                  </span>
                ) : (
                  <span className="text-slate-500 font-extrabold text-[11px] font-mono">
                    {badge.milestoneStreakDays
                      ? `${badge.milestoneStreakDays}-Day Streak`
                      : `${badge.milestoneMasteryCards} Cards Mastered`}
                  </span>
                )}

                <span className="text-amber-700 font-black text-[11px] bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                  +{badge.xpReward} XP
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* BADGE DETAIL MODAL DIALOG */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 20, stiffness: 260 }}
              className={`bg-white border-2 ${selectedBadge.tierColor.border} rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center space-y-5 overflow-hidden`}
            >
              {/* Top Accent Gradient Bar */}
              <div className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-r ${selectedBadge.tierColor.gradient}`} />

              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Large Icon Emblem */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-4 border-dashed border-amber-400/50"
                />
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${selectedBadge.tierColor.gradient} text-slate-950 flex items-center justify-center text-4xl shadow-xl border-2 border-white`}>
                  {selectedBadge.icon}
                </div>
              </div>

              {/* Title & Category */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full inline-block mb-1">
                  {selectedBadge.rarity} • {selectedBadge.category}
                </span>
                <h3 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
                  {selectedBadge.name}
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  "{selectedBadge.quote}"
                </p>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed font-medium max-w-sm mx-auto">
                {selectedBadge.description}
              </p>

              {/* Status Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-around text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className={`font-black text-sm ${unlockedMap[selectedBadge.id] ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {unlockedMap[selectedBadge.id] ? 'Unlocked ⭐' : 'Locked 🔒'}
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Reward</span>
                  <span className="font-black text-sm text-amber-600 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-amber-500" />
                    +{selectedBadge.xpReward} XP
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                {unlockedMap[selectedBadge.id] ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(selectedBadge.id)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        unlockedMap[selectedBadge.id]?.featured
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-600'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                      <span>
                        {unlockedMap[selectedBadge.id]?.featured ? 'Featured on Profile' : 'Pin to Profile Showcase'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCelebrationBadge(selectedBadge);
                        playFanfare();
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                      title="Replay Fanfare Animation"
                    >
                      <PartyPopper className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTestUnlockBadge(selectedBadge)}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    <span>Test Unlock Badge & Earn +{selectedBadge.xpReward} XP</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedBadge(null)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-xl transition cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEWLY UNLOCKED CELEBRATION OVERLAY */}
      <AnimatePresence>
        {celebrationBadge && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            {/* Particle Burst */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
              {BADGE_CELEBRATION_PARTICLES.map((p) => (
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
                  transition={{ duration: 2.2, ease: 'easeOut' }}
                  className="absolute w-3.5 h-3.5"
                  style={{
                    backgroundColor: p.color,
                    borderRadius: p.shape === 'circle' ? '50%' : '3px'
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
              className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center text-white space-y-5 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

              <button
                type="button"
                onClick={() => setCelebrationBadge(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Glowing Icon */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0.2, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl"
                />
                <div className="w-22 h-22 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-slate-950 flex items-center justify-center text-5xl shadow-2xl border-2 border-amber-300">
                  {celebrationBadge.icon}
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-300 text-[11px] font-black uppercase tracking-widest mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Badge Unlocked!
                </div>
                <h3 className="text-2xl font-serif font-black text-white tracking-tight">
                  {celebrationBadge.name}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
                  {celebrationBadge.description}
                </p>
              </div>

              <div className="p-3.5 bg-slate-800/90 border border-amber-500/30 rounded-2xl flex items-center justify-around">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Milestone</span>
                  <span className="text-sm font-black text-amber-400">
                    {celebrationBadge.milestoneStreakDays
                      ? `${celebrationBadge.milestoneStreakDays}-Day Streak 🔥`
                      : `${celebrationBadge.milestoneMasteryCards} Cards Mastered ⭐`}
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-700" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">XP Bonus</span>
                  <span className="text-sm font-black text-emerald-400">
                    +{celebrationBadge.xpReward} XP
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCelebrationBadge(null)}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                Claim Reward & Pin Badge!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StreakBadgeSystem;
