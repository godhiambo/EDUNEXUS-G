export interface StreakBadge {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string; // Emoji or Lucide icon name
  category: 'STREAK' | 'MASTERY' | 'SPECIAL';
  milestoneStreakDays?: number;
  milestoneMasteryCards?: number;
  xpReward: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  tierColor: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    glow: string;
    gradient: string;
  };
  quote: string;
}

export const STREAK_BADGES: StreakBadge[] = [
  {
    id: 'badge-streak-3',
    name: 'Ignition Spark',
    title: '3-Day Streak Fighter',
    description: 'Maintained active flashcard study for 3 consecutive days.',
    icon: '🔥',
    category: 'STREAK',
    milestoneStreakDays: 3,
    xpReward: 50,
    rarity: 'Common',
    tierColor: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      badgeBg: 'bg-amber-500',
      glow: 'shadow-amber-500/20',
      gradient: 'from-amber-400 via-orange-400 to-amber-500'
    },
    quote: 'The spark of habit ignited!'
  },
  {
    id: 'badge-streak-7',
    name: 'Consistency Champion',
    title: '7-Day Weekly Streak',
    description: 'Completed daily flashcard reviews for a full 7-day week.',
    icon: '⚡',
    category: 'STREAK',
    milestoneStreakDays: 7,
    xpReward: 150,
    rarity: 'Rare',
    tierColor: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      badgeBg: 'bg-emerald-500',
      glow: 'shadow-emerald-500/20',
      gradient: 'from-emerald-400 via-teal-400 to-emerald-600'
    },
    quote: 'Seven days of unstoppable momentum.'
  },
  {
    id: 'badge-streak-14',
    name: 'Fortnight Titan',
    title: '14-Day Streak Master',
    description: 'Sustained daily learning reviews without breaking focus for 2 weeks.',
    icon: '🛡️',
    category: 'STREAK',
    milestoneStreakDays: 14,
    xpReward: 300,
    rarity: 'Rare',
    tierColor: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      badgeBg: 'bg-blue-500',
      glow: 'shadow-blue-500/20',
      gradient: 'from-blue-400 via-indigo-400 to-blue-600'
    },
    quote: 'Fortitude forged in daily practice.'
  },
  {
    id: 'badge-streak-30',
    name: 'Monthly Mastermind',
    title: '30-Day Monthly Streak',
    description: '30 consecutive days of active concept review & retention.',
    icon: '🏆',
    category: 'STREAK',
    milestoneStreakDays: 30,
    xpReward: 500,
    rarity: 'Epic',
    tierColor: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      badgeBg: 'bg-purple-500',
      glow: 'shadow-purple-500/20',
      gradient: 'from-purple-500 via-violet-500 to-indigo-600'
    },
    quote: 'A month of dedication yields permanent knowledge.'
  },
  {
    id: 'badge-streak-60',
    name: 'Diamond Scholar',
    title: '60-Day Streak Vanguard',
    description: '60 consecutive days of study diligence.',
    icon: '💎',
    category: 'STREAK',
    milestoneStreakDays: 60,
    xpReward: 1000,
    rarity: 'Legendary',
    tierColor: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      text: 'text-cyan-800',
      badgeBg: 'bg-cyan-500',
      glow: 'shadow-cyan-500/30',
      gradient: 'from-cyan-400 via-sky-400 to-blue-600'
    },
    quote: 'Brilliant like a polished diamond.'
  },
  {
    id: 'badge-streak-100',
    name: 'Century Legend',
    title: '100-Day Centurion Streak',
    description: '100 consecutive days of learning excellence.',
    icon: '👑',
    category: 'STREAK',
    milestoneStreakDays: 100,
    xpReward: 2500,
    rarity: 'Legendary',
    tierColor: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-800',
      badgeBg: 'bg-rose-500',
      glow: 'shadow-rose-500/30',
      gradient: 'from-rose-500 via-amber-500 to-yellow-500'
    },
    quote: '100 days in pursuit of mastery.'
  },
  {
    id: 'badge-mastery-10',
    name: 'Concept Novice',
    title: '10 Cards Mastered',
    description: 'Achieved high memory recall on 10 flashcard items.',
    icon: '⭐',
    category: 'MASTERY',
    milestoneMasteryCards: 10,
    xpReward: 100,
    rarity: 'Common',
    tierColor: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      badgeBg: 'bg-yellow-500',
      glow: 'shadow-yellow-500/20',
      gradient: 'from-yellow-400 to-amber-500'
    },
    quote: 'The journey of a thousand cards begins with ten.'
  },
  {
    id: 'badge-mastery-25',
    name: 'Memory Virtuoso',
    title: '25 Cards Mastered',
    description: 'Demonstrated long-term retention on 25 study concepts.',
    icon: '🎓',
    category: 'MASTERY',
    milestoneMasteryCards: 25,
    xpReward: 250,
    rarity: 'Rare',
    tierColor: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-800',
      badgeBg: 'bg-teal-500',
      glow: 'shadow-teal-500/20',
      gradient: 'from-teal-400 to-emerald-600'
    },
    quote: 'Retention unlocked across subjects.'
  },
  {
    id: 'badge-mastery-50',
    name: 'Socratic Genius',
    title: '50 Cards Mastered',
    description: 'Mastered 50 core concepts using SM-2 spaced repetition.',
    icon: '🌌',
    category: 'MASTERY',
    milestoneMasteryCards: 50,
    xpReward: 750,
    rarity: 'Epic',
    tierColor: {
      bg: 'bg-fuchsia-50',
      border: 'border-fuchsia-200',
      text: 'text-fuchsia-800',
      badgeBg: 'bg-fuchsia-500',
      glow: 'shadow-fuchsia-500/30',
      gradient: 'from-fuchsia-500 via-purple-500 to-pink-500'
    },
    quote: 'Knowledge deeply ingrained.'
  }
];

const BADGE_STORAGE_KEY = 'edunexus_unlocked_streak_badges_v1';
export const BADGE_UNLOCK_EVENT = 'edunexus_badge_unlocked';

export interface UnlockedBadgeRecord {
  badgeId: string;
  unlockedAt: string;
  featured?: boolean;
}

export function getUnlockedBadgeRecords(): Record<string, UnlockedBadgeRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(BADGE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load unlocked badges:', err);
    return {};
  }
}

export function saveUnlockedBadgeRecord(badgeId: string, featured = false): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = getUnlockedBadgeRecords();
    if (current[badgeId]) return false; // Already unlocked

    const newRecord: UnlockedBadgeRecord = {
      badgeId,
      unlockedAt: new Date().toISOString(),
      featured
    };

    const updated = { ...current, [badgeId]: newRecord };
    localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(updated));

    window.dispatchEvent(new CustomEvent(BADGE_UNLOCK_EVENT, { detail: { badgeId, record: newRecord } }));
    return true; // Newly unlocked
  } catch (err) {
    console.error('Failed to save unlocked badge:', err);
    return false;
  }
}

export function setBadgeFeatured(badgeId: string, featured: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getUnlockedBadgeRecords();
    if (!current[badgeId]) return;
    current[badgeId].featured = featured;
    localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent(BADGE_UNLOCK_EVENT, { detail: { badgeId, record: current[badgeId] } }));
  } catch (err) {
    console.error('Failed to feature badge:', err);
  }
}

export function checkAndAutoUnlockBadges(streakDays: number, cardsMastered: number): StreakBadge[] {
  const currentUnlocked = getUnlockedBadgeRecords();
  const newlyUnlockedBadges: StreakBadge[] = [];

  STREAK_BADGES.forEach((badge) => {
    if (currentUnlocked[badge.id]) return; // Already unlocked

    let shouldUnlock = false;
    if (badge.category === 'STREAK' && badge.milestoneStreakDays && streakDays >= badge.milestoneStreakDays) {
      shouldUnlock = true;
    } else if (badge.category === 'MASTERY' && badge.milestoneMasteryCards && cardsMastered >= badge.milestoneMasteryCards) {
      shouldUnlock = true;
    }

    if (shouldUnlock) {
      const isNew = saveUnlockedBadgeRecord(badge.id);
      if (isNew) {
        newlyUnlockedBadges.push(badge);
      }
    }
  });

  return newlyUnlockedBadges;
}
