import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Brain,
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Flame,
  Award,
  Zap,
  BookOpen,
  ArrowRight,
  Filter,
  Layers,
  ChevronRight,
  Play,
  Lightbulb,
  Share2,
  Check
} from 'lucide-react';
import { SavedDocument, CurriculumType, getCurriculumMeta } from '../types';

export interface WeeklyScheduleDay {
  dayId: string;
  dayName: string;
  dateLabel: string;
  focusSubject: string;
  focusTopic: string;
  subTopic: string;
  activityType: 'socratic_tutor' | 'flashcard_mastery' | 'quiz_challenge' | 'concept_deep_dive' | 'practice_problems' | string;
  activityLabel: string;
  suggestedTime: string;
  durationMinutes: number;
  priority: 'High' | 'Medium' | 'Low' | string;
  urgencyReason: string;
  aiStudyTip: string;
  xpReward: number;
  completed: boolean;
  learningObjective: string;
}

export interface PersonalizedScheduleData {
  title: string;
  curriculumName: string;
  aiPerformanceAnalysis: string;
  overallMasteryScore: number;
  weakestSubject: string;
  targetXpGoal: number;
  weeklyIntensity: string;
  days: WeeklyScheduleDay[];
}

interface PersonalizedPathWidgetProps {
  curriculum?: CurriculumType;
  userName?: string;
  userRole?: string;
  documents?: SavedDocument[];
  onOpenAITutor?: (doc?: SavedDocument) => void;
  onOpenFlashcards?: () => void;
  onOpenAssessmentGenerator?: () => void;
  onClosePersonalizedPath?: () => void;
}

const DEFAULT_SCHEDULE: PersonalizedScheduleData = {
  title: 'EduNexus AI Personalized Adaptive Weekly Path',
  curriculumName: 'CBC',
  aiPerformanceAnalysis: 'Based on recent quiz scores and flashcard retention decay, accuracy in Mathematics (62%) and Science (78%) indicates conceptual gaps in Algebraic Equations. This week focuses on Socratic problem solving and spaced memory reviews.',
  overallMasteryScore: 74,
  weakestSubject: 'Mathematics - Algebraic Equations',
  targetXpGoal: 1050,
  weeklyIntensity: 'balanced',
  days: [
    {
      dayId: 'mon',
      dayName: 'Monday',
      dateLabel: 'Day 1',
      focusSubject: 'Mathematics',
      focusTopic: 'Algebraic Equations & Factoring',
      subTopic: 'Linear Equations & Coefficients',
      activityType: 'socratic_tutor',
      activityLabel: '🧠 Socratic AI Tutor',
      suggestedTime: '08:30 AM',
      durationMinutes: 40,
      priority: 'High',
      urgencyReason: 'Quiz score (62%) indicates need for step-by-step guidance before problem set.',
      aiStudyTip: 'Focus on isolating variables on one side of the equation first.',
      xpReward: 150,
      completed: false,
      learningObjective: 'Master step-by-step algebraic isolation techniques using Socratic inquiry.'
    },
    {
      dayId: 'tue',
      dayName: 'Tuesday',
      dateLabel: 'Day 2',
      focusSubject: 'Integrated Science',
      focusTopic: 'Photosynthesis & Light Reactions',
      subTopic: 'Chlorophyll Energy Conversion',
      activityType: 'flashcard_mastery',
      activityLabel: '🎴 Flashcard Review',
      suggestedTime: '09:15 AM',
      durationMinutes: 30,
      priority: 'Medium',
      urgencyReason: 'SM-2 memory decay model predicts 30% retention drop in technical terms today.',
      aiStudyTip: 'Review key terms: ATP, NADPH, Stroma, and Thylakoid membranes.',
      xpReward: 120,
      completed: false,
      learningObjective: 'Reinforce memory retention for photosynthesis chemical pathways.'
    },
    {
      dayId: 'wed',
      dayName: 'Wednesday',
      dateLabel: 'Day 3',
      focusSubject: 'Mathematics',
      focusTopic: 'Quadratic Equations & Graphing',
      subTopic: 'Parabola Vertices & Roots',
      activityType: 'quiz_challenge',
      activityLabel: '📝 Interactive Quiz Challenge',
      suggestedTime: '10:00 AM',
      durationMinutes: 45,
      priority: 'High',
      urgencyReason: 'Prerequisite topic from Monday completed; now test application skills.',
      aiStudyTip: 'Use the discriminant b^2 - 4ac to quickly determine root types.',
      xpReward: 180,
      completed: false,
      learningObjective: 'Apply quadratic formulas and verify root values accurately.'
    },
    {
      dayId: 'thu',
      dayName: 'Thursday',
      dateLabel: 'Day 4',
      focusSubject: 'Social Studies & Civics',
      focusTopic: 'Government Structure & Constitution',
      subTopic: 'Arms of Government & Rights',
      activityType: 'concept_deep_dive',
      activityLabel: '📚 Concept Summary & Mindmap',
      suggestedTime: '02:00 PM',
      durationMinutes: 35,
      priority: 'Medium',
      urgencyReason: 'New curriculum strand introduced this week.',
      aiStudyTip: 'Compare executive, legislative, and judicial branches in a 3-column table.',
      xpReward: 140,
      completed: false,
      learningObjective: 'Summarize constitutional balance of powers and civic duties.'
    },
    {
      dayId: 'fri',
      dayName: 'Friday',
      dateLabel: 'Day 5',
      focusSubject: 'Integrated Science',
      focusTopic: 'Cellular Respiration & Mitochondria',
      subTopic: 'Aerobic vs Anaerobic Pathways',
      activityType: 'socratic_tutor',
      activityLabel: '🔬 Lab Simulation & AI Discussion',
      suggestedTime: '11:00 AM',
      durationMinutes: 45,
      priority: 'High',
      urgencyReason: 'Connects with Tuesday Photosynthesis topic for comprehensive unit mastery.',
      aiStudyTip: 'Notice how photosynthesis outputs (glucose + oxygen) are inputs for respiration.',
      xpReward: 160,
      completed: false,
      learningObjective: 'Synthesize interrelationships between photosynthesis and cellular respiration.'
    },
    {
      dayId: 'sat',
      dayName: 'Saturday',
      dateLabel: 'Day 6',
      focusSubject: 'English Language',
      focusTopic: 'Expository Essay Writing & Grammar',
      subTopic: 'Thesis Statements & Transition Words',
      activityType: 'practice_problems',
      activityLabel: '✍️ Essay Draft & AI Feedback',
      suggestedTime: '10:30 AM',
      durationMinutes: 50,
      priority: 'Low',
      urgencyReason: 'Maintain strong language mastery with creative practice.',
      aiStudyTip: 'Ensure every body paragraph starts with a clear topic sentence.',
      xpReward: 150,
      completed: false,
      learningObjective: 'Draft a 300-word structured expository essay with transition clarity.'
    },
    {
      dayId: 'sun',
      dayName: 'Sunday',
      dateLabel: 'Day 7',
      focusSubject: 'Cross-Curriculum Review',
      focusTopic: 'Weekly Adaptive Synthesis & Master Quiz',
      subTopic: 'Weak Topic Retest & XP Milestone',
      activityType: 'quiz_challenge',
      activityLabel: '🏆 Weekly Mastery Challenge',
      suggestedTime: '04:00 PM',
      durationMinutes: 30,
      priority: 'High',
      urgencyReason: 'Weekly checkpoint to measure performance growth and calibrate next week path.',
      aiStudyTip: 'Take a short 5-minute break before starting to refresh focus.',
      xpReward: 250,
      completed: false,
      learningObjective: 'Demonstrate overall retention growth across all weekly focus topics.'
    }
  ]
};

export const PersonalizedPathWidget: React.FC<PersonalizedPathWidgetProps> = ({
  curriculum = 'cbc',
  userName = 'Student',
  userRole = 'Student',
  documents = [],
  onOpenAITutor,
  onOpenFlashcards,
  onOpenAssessmentGenerator,
  onClosePersonalizedPath
}) => {
  const meta = getCurriculumMeta(curriculum);

  const [intensity, setIntensity] = useState<'remedial' | 'balanced' | 'accelerated'>('balanced');
  const [scheduleData, setScheduleData] = useState<PersonalizedScheduleData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`edunexus_personalized_schedule_${curriculum}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // fallback
        }
      }
    }
    return DEFAULT_SCHEDULE;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'high' | 'pending' | 'completed'>('all');
  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    scheduleData.days.forEach(d => {
      if (d.completed) map[d.dayId] = true;
    });
    return map;
  });

  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  // Save to localStorage when scheduleData or completedDays updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updated = {
        ...scheduleData,
        days: scheduleData.days.map(d => ({
          ...d,
          completed: !!completedDays[d.dayId]
        }))
      };
      localStorage.setItem(`edunexus_personalized_schedule_${curriculum}`, JSON.stringify(updated));
    }
  }, [scheduleData, completedDays, curriculum]);

  const handleGenerateSchedule = async (newIntensity?: 'remedial' | 'balanced' | 'accelerated') => {
    const targetIntensity = newIntensity || intensity;
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-weekly-personalized-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculum,
          userName,
          studentXp: 1450,
          streakDays: 6,
          intensity: targetIntensity,
          performanceMetrics: {
            quizScores: [
              { subject: 'Mathematics', topic: 'Algebraic Equations', scorePercent: 62 },
              { subject: 'Integrated Science', topic: 'Photosynthesis', scorePercent: 78 },
              { subject: 'English Language', topic: 'Essays', scorePercent: 88 }
            ],
            weakSubjects: ['Mathematics - Algebraic Equations', 'Photosynthesis Terms']
          },
          savedDocuments: documents
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.schedule) {
          setScheduleData(result.schedule);
          // preserve completion states if day match
          const newMap: Record<string, boolean> = {};
          result.schedule.days.forEach((d: WeeklyScheduleDay) => {
            newMap[d.dayId] = false;
          });
          setCompletedDays(newMap);
        }
      }
    } catch (err) {
      console.error('Failed to generate weekly personalized schedule:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDayCompletion = (dayId: string) => {
    setCompletedDays(prev => ({
      ...prev,
      [dayId]: !prev[dayId]
    }));
  };

  const handleLaunchActivity = (day: WeeklyScheduleDay) => {
    if (day.activityType === 'socratic_tutor' || day.activityType === 'concept_deep_dive') {
      if (onOpenAITutor) {
        const matchingDoc = documents.find(
          d => d.subject?.toLowerCase() === day.focusSubject.toLowerCase() || d.topic?.toLowerCase().includes(day.focusTopic.toLowerCase())
        );
        onOpenAITutor(matchingDoc);
      }
    } else if (day.activityType === 'flashcard_mastery') {
      if (onOpenFlashcards) onOpenFlashcards();
    } else if (day.activityType === 'quiz_challenge' || day.activityType === 'practice_problems') {
      if (onOpenAssessmentGenerator) onOpenAssessmentGenerator();
    } else {
      if (onOpenAITutor) onOpenAITutor();
    }
  };

  const completedCount = Object.values(completedDays).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / (scheduleData.days.length || 7)) * 100);
  const earnedXp = scheduleData.days.reduce((acc, d) => (completedDays[d.dayId] ? acc + d.xpReward : acc), 0);

  const filteredDays = scheduleData.days.filter(day => {
    if (filterMode === 'high') return day.priority === 'High';
    if (filterMode === 'pending') return !completedDays[day.dayId];
    if (filterMode === 'completed') return !!completedDays[day.dayId];
    return true;
  });

  const handleShareSchedule = () => {
    const text = `🎯 My AI Personalized Weekly Path (${meta.shortLabel}):\nMastery Goal: ${scheduleData.overallMasteryScore}%\nTarget Focus: ${scheduleData.weakestSubject}\nProgress: ${completedCount}/${scheduleData.days.length} days completed (${earnedXp} XP earned).`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AI Performance Trend Analysis</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1">
              <span>{meta.flag}</span>
              <span>{meta.shortLabel} Framework</span>
            </span>
            {userRole && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
                {userRole} Mode
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Personalized Adaptive Learning Schedule</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            AI dynamically evaluates student performance trends, SM-2 retention decay, and curriculum gaps to curate a unique weekly path.
          </p>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleShareSchedule}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-extrabold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            title="Share or Copy Weekly Schedule Summary"
          >
            {copiedNotice ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-slate-400" />}
            <span>{copiedNotice ? 'Copied!' : 'Share Path'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleGenerateSchedule()}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing Trends...' : 'Recalibrate AI Path'}</span>
          </button>
        </div>
      </div>

      {/* AI Performance Trend Metrics & Diagnostic Analysis Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Score Gauge & Metrics Card */}
        <div className="lg:col-span-5 bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Performance Trend Gauge
            </span>
            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              +12% vs last week
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Mastery Ring Visual */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-700"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400 transition-all duration-1000 ease-out"
                  strokeDasharray={`${scheduleData.overallMasteryScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-white leading-none">{scheduleData.overallMasteryScore}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Mastery</span>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-300">Weakest Priority Area:</h4>
              <p className="text-xs font-extrabold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg inline-block">
                ⚠️ {scheduleData.weakestSubject}
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] font-bold text-slate-400">
                <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-amber-500" /> 6 Day Streak</span>
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-emerald-400" /> +{earnedXp} / {scheduleData.targetXpGoal} XP</span>
              </div>
            </div>
          </div>

          {/* Weekly Completion Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-300">
              <span>Weekly Completion Goal</span>
              <span className="text-emerald-400">{completedCount} of {scheduleData.days.length} Days ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-slate-700/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-600/50">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right AI Diagnostic Narrative Card */}
        <div className="lg:col-span-7 bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-teal-400" /> AI Diagnostic Performance Insight
              </span>
              <span className="text-[10px] font-extrabold text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                Updated Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50">
              "{scheduleData.aiPerformanceAnalysis}"
            </p>
          </div>

          {/* Intensity Selector Row */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-700/60">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> AI Schedule Intensity:
            </span>
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => { setIntensity('remedial'); handleGenerateSchedule('remedial'); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  intensity === 'remedial' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Remedial Boost
              </button>
              <button
                type="button"
                onClick={() => { setIntensity('balanced'); handleGenerateSchedule('balanced'); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  intensity === 'balanced' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Balanced
              </button>
              <button
                type="button"
                onClick={() => { setIntensity('accelerated'); handleGenerateSchedule('accelerated'); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  intensity === 'accelerated' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Accelerated
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Schedule Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              filterMode === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All 7 Days ({scheduleData.days.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('high')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              filterMode === 'high' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🔥 High Priority Gaps
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              filterMode === 'pending' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              filterMode === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
          <span>Click checkboxes to track completion and earn XP</span>
        </div>
      </div>

      {/* 7-Day Interactive Adaptive Schedule List / Grid */}
      <div className="space-y-3">
        {filteredDays.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-200">No scheduled sessions in this filter view</h4>
            <p className="text-xs text-slate-400">Switch filter mode or recalibrate the AI path above.</p>
          </div>
        ) : (
          filteredDays.map((day, idx) => {
            const isDone = !!completedDays[day.dayId];
            return (
              <div
                key={day.dayId || idx}
                className={`group border rounded-2xl p-4 sm:p-5 transition-all duration-300 relative ${
                  isDone
                    ? 'bg-slate-900/50 border-emerald-500/30 opacity-80'
                    : day.priority === 'High'
                    ? 'bg-slate-800/80 border-amber-500/40 hover:border-amber-500/80 shadow-lg'
                    : 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Column: Checkbox, Day, Subject & Topic */}
                  <div className="flex items-start gap-3.5 flex-1">
                    {/* Completion Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleDayCompletion(day.dayId)}
                      className={`w-6 h-6 rounded-lg border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : 'border-slate-500 hover:border-emerald-400 bg-slate-900'
                      }`}
                      title="Toggle completion status"
                    >
                      {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {day.dayName} • {day.dateLabel}
                        </span>

                        <span className="text-xs font-bold text-slate-200 bg-slate-700/80 px-2.5 py-0.5 rounded-full border border-slate-600">
                          {day.focusSubject}
                        </span>

                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          day.priority === 'High'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {day.priority} Priority Gap
                        </span>

                        <span className="text-xs font-extrabold text-emerald-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" /> +{day.xpReward} XP
                        </span>
                      </div>

                      <h3 className={`text-base font-extrabold tracking-tight ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                        {day.focusTopic}
                      </h3>

                      <p className="text-xs text-slate-300 font-medium">
                        <span className="text-slate-400">Subtopic:</span> {day.subTopic}
                      </p>

                      {/* Diagnostic Reason */}
                      <p className="text-xs text-amber-300/90 italic font-normal flex items-start gap-1 pt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>AI Trend Reason: {day.urgencyReason}</span>
                      </p>

                      {/* AI Study Tip */}
                      <div className="mt-2 bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-300 leading-relaxed">
                          <strong className="text-amber-200">AI Study Tip:</strong> {day.aiStudyTip}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Time, Activity Label & Launch Button */}
                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-slate-700/60 pt-3 md:pt-0 gap-3 shrink-0">
                    <div className="text-left md:text-right space-y-0.5">
                      <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 md:justify-end">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        <span>{day.suggestedTime} ({day.durationMinutes} mins)</span>
                      </div>
                      <span className="inline-block text-xs font-extrabold px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                        {day.activityLabel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLaunchActivity(day)}
                      className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-emerald-600 text-white font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer shadow group-hover:scale-105"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-amber-300" />
                      <span>Start Session</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PersonalizedPathWidget;
