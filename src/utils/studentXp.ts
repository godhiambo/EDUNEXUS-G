export interface XpActivity {
  id: string;
  description: string;
  amount: number;
  timestamp: string;
  type: 'card_mastered' | 'card_reviewed' | 'deck_completed' | 'streak_bonus';
}

export interface StudentXpData {
  totalXp: number;
  cardsMastered: number;
  totalReviews: number;
  streakDays: number;
  lastActiveDate: string;
  history: XpActivity[];
}

const STORAGE_KEY = 'edunexus_student_xp_profile_v1';
export const XP_UPDATE_EVENT = 'edunexus_xp_updated';

const DEFAULT_XP_DATA: StudentXpData = {
  totalXp: 320,
  cardsMastered: 14,
  totalReviews: 42,
  streakDays: 5,
  lastActiveDate: new Date().toISOString().split('T')[0],
  history: [
    {
      id: 'xp-init-1',
      description: 'Mastered "Quadratic Formula" flashcard',
      amount: 50,
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      type: 'card_mastered'
    },
    {
      id: 'xp-init-2',
      description: 'Easy review on "Pythagorean Theorem"',
      amount: 25,
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      type: 'card_reviewed'
    },
    {
      id: 'xp-init-3',
      description: 'Completed Mathematics Core Deck',
      amount: 100,
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      type: 'deck_completed'
    }
  ]
};

export function getStudentXpData(): StudentXpData {
  if (typeof window === 'undefined') return DEFAULT_XP_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_XP_DATA));
      return DEFAULT_XP_DATA;
    }
    const parsed = JSON.parse(raw);
    return {
      totalXp: parsed.totalXp ?? DEFAULT_XP_DATA.totalXp,
      cardsMastered: parsed.cardsMastered ?? DEFAULT_XP_DATA.cardsMastered,
      totalReviews: parsed.totalReviews ?? DEFAULT_XP_DATA.totalReviews,
      streakDays: parsed.streakDays ?? DEFAULT_XP_DATA.streakDays,
      lastActiveDate: parsed.lastActiveDate ?? DEFAULT_XP_DATA.lastActiveDate,
      history: Array.isArray(parsed.history) ? parsed.history : DEFAULT_XP_DATA.history
    };
  } catch (err) {
    console.error('Failed to load student XP data:', err);
    return DEFAULT_XP_DATA;
  }
}

export function calculateLevel(totalXp: number) {
  const level = Math.floor(totalXp / 100) + 1;
  const currentLevelXp = totalXp % 100;
  const xpNeededForNext = 100;
  const progressPct = Math.min(100, Math.round((currentLevelXp / xpNeededForNext) * 100));

  let rankTitle = 'Novice Scholar';
  let rankBadge = '🥉';
  let rankColor = 'text-amber-700 bg-amber-50 border-amber-200';

  if (level >= 11) {
    rankTitle = 'EduNexus Grandmaster';
    rankBadge = '👑';
    rankColor = 'text-purple-700 bg-purple-50 border-purple-200';
  } else if (level >= 8) {
    rankTitle = 'Spaced-Repetition Titan';
    rankBadge = '💎';
    rankColor = 'text-cyan-700 bg-cyan-50 border-cyan-200';
  } else if (level >= 5) {
    rankTitle = 'Memory Master';
    rankBadge = '🥇';
    rankColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (level >= 3) {
    rankTitle = 'Concept Explorer';
    rankBadge = '🥈';
    rankColor = 'text-blue-700 bg-blue-50 border-blue-200';
  }

  return {
    level,
    currentLevelXp,
    xpNeededForNext,
    progressPct,
    rankTitle,
    rankBadge,
    rankColor
  };
}

export function awardStudentXp(
  amount: number,
  description: string,
  type: XpActivity['type'],
  isMasteredCard = false
): { updatedData: StudentXpData; levelUp: boolean; oldLevel: number; newLevel: number } {
  const current = getStudentXpData();
  const oldLevel = calculateLevel(current.totalXp).level;

  const todayStr = new Date().toISOString().split('T')[0];

  // Streak logic
  let newStreak = current.streakDays;
  if (current.lastActiveDate !== todayStr) {
    const lastDate = new Date(current.lastActiveDate);
    const today = new Date(todayStr);
    const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  }

  const newActivity: XpActivity = {
    id: `xp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    description,
    amount,
    timestamp: new Date().toISOString(),
    type
  };

  const updatedData: StudentXpData = {
    totalXp: current.totalXp + amount,
    cardsMastered: current.cardsMastered + (isMasteredCard ? 1 : 0),
    totalReviews: current.totalReviews + 1,
    streakDays: newStreak,
    lastActiveDate: todayStr,
    history: [newActivity, ...current.history].slice(0, 20)
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      window.dispatchEvent(new CustomEvent(XP_UPDATE_EVENT, { detail: { updatedData, activity: newActivity } }));
    } catch (err) {
      console.error('Failed to save student XP data:', err);
    }
  }

  const newLevel = calculateLevel(updatedData.totalXp).level;
  const levelUp = newLevel > oldLevel;

  return { updatedData, levelUp, oldLevel, newLevel };
}
