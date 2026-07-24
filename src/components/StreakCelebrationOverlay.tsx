import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Trophy, Sparkles, Zap, CheckCircle2, Star, X, RotateCw, Award } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  yEnd: number;
  xDrift: number;
  rotateEnd: number;
  scale: number;
  color: string;
  shape: 'rect' | 'circle' | 'ribbon' | 'star';
  delay: number;
  duration: number;
}

interface StreakCelebrationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  streakDays: number;
  cardsReviewedToday?: number;
  dailyGoalTarget?: number;
  xpEarned?: number;
  onReplayConfetti?: () => void;
}

const CONFETTI_COLORS = [
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#eab308', // Yellow
];

export const StreakCelebrationOverlay: React.FC<StreakCelebrationOverlayProps> = ({
  isOpen,
  onClose,
  streakDays,
  cardsReviewedToday = 10,
  dailyGoalTarget = 10,
  xpEarned = 100,
  onReplayConfetti,
}) => {
  // Generate a batch of deterministic random confetti particles
  const particles: Particle[] = useMemo(() => {
    const list: Particle[] = [];
    const particleCount = 45;
    const shapes: ('rect' | 'circle' | 'ribbon' | 'star')[] = ['rect', 'circle', 'ribbon', 'star'];

    for (let i = 0; i < particleCount; i++) {
      list.push({
        id: i,
        x: (Math.random() - 0.5) * 90, // percent from horizontal center (-45vw to +45vw)
        yEnd: 600 + Math.random() * 300, // pixels downward
        xDrift: (Math.random() - 0.5) * 200, // drift left or right
        rotateEnd: (Math.random() - 0.5) * 1080, // multiple full spins
        scale: 0.6 + Math.random() * 0.8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        shape: shapes[i % shapes.length],
        delay: Math.random() * 0.8, // staggered entrance
        duration: 2.5 + Math.random() * 2.0,
      });
    }
    return list;
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-hidden select-none"
      >
        {/* FRAMER MOTION CONFETTI PARTICLES CONTAINER */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {particles.map((p) => {
            return (
              <motion.div
                key={p.id}
                initial={{
                  x: `${p.x}vw`,
                  y: -40,
                  opacity: 1,
                  rotate: 0,
                  scale: p.scale,
                }}
                animate={{
                  y: p.yEnd,
                  x: `calc(${p.x}vw + ${p.xDrift}px)`,
                  rotate: p.rotateEnd,
                  opacity: [1, 1, 0.8, 0],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  repeat: Infinity,
                  repeatDelay: Math.random() * 1.5,
                }}
                style={{
                  position: 'absolute',
                  top: '0%',
                  left: '50%',
                  backgroundColor: p.shape !== 'star' ? p.color : 'transparent',
                  borderRadius: p.shape === 'circle' ? '9999px' : p.shape === 'ribbon' ? '2px' : '3px',
                  width: p.shape === 'ribbon' ? '6px' : '10px',
                  height: p.shape === 'ribbon' ? '18px' : '10px',
                }}
              >
                {p.shape === 'star' && (
                  <Star
                    className="w-4 h-4 fill-amber-400 text-amber-300"
                    style={{ color: p.color }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* CELEBRATION CARD DIALOG */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 40, rotateX: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="relative z-20 w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl shadow-amber-500/10 overflow-hidden"
        >
          {/* Ambient background aura glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-full transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Glowing Animated Flame Badge */}
          <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
            {/* Outer pulsating rings */}
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-full blur-md"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border-2 border-dashed border-amber-400/60 rounded-full"
            />

            <div className="relative z-10 p-5 bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 rounded-full shadow-lg shadow-orange-500/50 flex items-center justify-center text-white">
              <Flame className="w-10 h-10 fill-white text-white animate-bounce" />
            </div>
          </div>

          {/* Header Title */}
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-300 text-[11px] font-black uppercase tracking-widest mb-2 shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              Daily Flashcard Goal Smashed!
            </div>
            <h2 className="text-3xl font-serif font-black tracking-tight text-white mb-1">
              {streakDays} DAY STREAK! 🔥
            </h2>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              Awesome consistency! You've reviewed your daily flashcard quota and supercharged your long-term memory retention.
            </p>
          </motion.div>

          {/* Stat Badges Grid */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-3 gap-2.5 my-6"
          >
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex flex-col items-center justify-center">
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block mb-0.5">
                Streak
              </span>
              <span className="text-lg font-black text-white flex items-center gap-1">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                {streakDays}d
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex flex-col items-center justify-center">
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block mb-0.5">
                Reviewed
              </span>
              <span className="text-lg font-black text-white flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {cardsReviewedToday}/{dailyGoalTarget}
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex flex-col items-center justify-center">
              <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider block mb-0.5">
                XP Bonus
              </span>
              <span className="text-lg font-black text-white flex items-center gap-1">
                <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                +{xpEarned}
              </span>
            </div>
          </motion.div>

          {/* Encouraging Quote / Achievement Banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="p-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl mb-6 text-left flex items-start gap-3"
          >
            <Trophy className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-black text-amber-300 block">Spaced Repetition Mastery</span>
              <span className="text-[11px] text-slate-300 leading-snug block">
                Daily practice strengthens neural pathways. SM-2 algorithm has updated your recall interval schedule!
              </span>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-2.5 justify-center"
          >
            {onReplayConfetti && (
              <button
                type="button"
                onClick={onReplayConfetti}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Replay Confetti
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-orange-500/30 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" />
              Claim Rewards & Continue
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StreakCelebrationOverlay;
