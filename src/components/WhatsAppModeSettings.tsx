import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType, updateUserPrimaryCurriculum } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { CurriculumType, ALL_CURRICULA_METADATA } from '../types';
import {
  Smartphone,
  Sparkles,
  Compass,
  MessageSquare,
  Zap,
  Check,
  BrainCircuit,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Sliders,
  GraduationCap,
  BookOpen,
  BookMarked,
  Globe
} from 'lucide-react';

export type WhatsAppConversationMode = 'structured' | 'flexible' | 'smart' | 'expert';

export interface WhatsAppModeSettingsProps {
  /** Optional callback triggered when mode is updated and saved */
  onModeSaved?: (mode: WhatsAppConversationMode) => void;
  /** Optional callback triggered when curriculum is updated and saved */
  onCurriculumSaved?: (curriculum: CurriculumType) => void;
  /** Optional container class name overrides */
  className?: string;
  /** Whether to render as a compact card or full-width section */
  variant?: 'full' | 'compact';
}

interface CurriculumOption {
  id: CurriculumType;
  label: string;
  flag: string;
  badge: string;
  description: string;
}

export const CURRICULUM_OPTIONS: CurriculumOption[] = ALL_CURRICULA_METADATA.map((item) => ({
  id: item.id,
  label: item.label,
  flag: item.flag,
  badge: item.badge,
  description: item.description
}));

interface ModeOption {
  id: WhatsAppConversationMode;
  title: string;
  emoji: string;
  tag: string;
  icon: React.ElementType;
  description: string;
  recommendedFor: string;
  features: string[];
  exampleResponse: {
    userPrompt: string;
    aiReply: string;
  };
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'smart',
    title: 'Smart Mode',
    emoji: '🧠',
    tag: 'Adaptive Default',
    icon: BrainCircuit,
    description: 'Intelligent adaptive mode. Automatically provides structured action menus for lesson tools & document requests, while remaining natural and fluid for general queries.',
    recommendedFor: 'Recommended for most teachers wanting dynamic, context-aware WhatsApp interactions.',
    features: [
      'Auto-detects document creation vs Q&A',
      'Attaches action menus when helpful',
      'Fluid natural text for open discussions',
      'Smart fallback for ambiguous prompts'
    ],
    exampleResponse: {
      userPrompt: 'Can you help me with Grade 7 Science photosynthesis?',
      aiReply: `🌿 *Photosynthesis Lesson Hub*

Photosynthesis is the process by which green plants convert light energy into chemical energy (glucose) using water and carbon dioxide.

*Key Concepts for Grade 7:*
• Word Equation: Light + Water + CO₂ ➔ Glucose + Oxygen
• Stomata & Chloroplast function
• Classroom Experiment: Iodine starch test

*Interactive Options:*
1. Generate 45-min CBC Lesson Plan
2. Create 5-Question Student Quiz
3. Download Printable Practical Lab Guide
4. Explain misconceptions in Swahili/English`
    }
  },
  {
    id: 'structured',
    title: 'Structured Mode',
    emoji: '🧭',
    tag: 'Guided Workflows',
    icon: Compass,
    description: 'Always provides step-by-step guided breakdowns and numbered interactive follow-up action menus with every reply for disciplined workspace navigation.',
    recommendedFor: 'Ideal for step-by-step document creation, CAT exam generation, and guided lesson planning.',
    features: [
      'Numbered action menus with every reply',
      'Step-by-step pedagogical breakdowns',
      'Strict structured formatting',
      'Explicit confirmation before generating documents'
    ],
    exampleResponse: {
      userPrompt: 'I need a Grade 8 Mathematics worksheet on Linear Equations.',
      aiReply: `📊 *Structured Task Breakdown: Linear Equations Worksheet*

*Step 1:* Selected Level: Grade 8 CBC / Standard
*Step 2:* Focus: Solving single-variable linear equations (e.g., 2x + 5 = 15)

*Please choose an action by replying with a number:*
1. Generate 5-Exercise Practice Worksheet with Solution Key
2. Create 10-Question CAT Assessment Test
3. Generate Step-by-Step Teaching Presentation Outline
4. Adjust difficulty level or add word problems`
    }
  },
  {
    id: 'flexible',
    title: 'Flexible Mode',
    emoji: '💬',
    tag: 'Natural Conversation',
    icon: MessageSquare,
    description: 'Provides direct, open-ended conversational replies without option menus unless explicitly requested, mimicking natural teacher-mentor dialog.',
    recommendedFor: 'Great for quick pedagogical questions, brainstorming, advice, and unstructured chat.',
    features: [
      'Clean open-ended conversational text',
      'No option menus cluttering responses',
      'Instant answers to direct questions',
      'Type "menu" anytime to unlock tools'
    ],
    exampleResponse: {
      userPrompt: 'How can I keep my Grade 5 students engaged during afternoon math lessons?',
      aiReply: `Great question! Afternoon energy slumps are very common in Grade 5. Here are 3 practical strategies you can try tomorrow:

1. *Kinesthetic Math Games:* Use a quick 5-minute "Math Relay" where students solve a problem on the board in small teams.
2. *Real-World Story Scenarios:* Relate fractions or money calculations to local market items or sports scores.
3. *Peer Micro-Teaching:* Pair students up for 2 minutes to explain a solved equation to each other.

Would you like me to draft a quick 5-minute warm-up game for your next class?`
    }
  },
  {
    id: 'expert',
    title: 'Expert Mode',
    emoji: '🎓',
    tag: 'Deep Reasoning & STEM',
    icon: GraduationCap,
    description: 'Delivers high-level technical reasoning, detailed curriculum citations, LaTeX mathematical equations, structured tables, and deep academic rigor with zero fluff.',
    recommendedFor: 'Designed for STEM teachers, high school educators, research synthesis, and advanced curriculum analysis.',
    features: [
      'LaTeX equations & scientific formulas',
      'Exhaustive pedagogical rigor',
      'Structured markdown tables & data',
      'Detailed curriculum alignment notes'
    ],
    exampleResponse: {
      userPrompt: 'Explain quadratic formula derivation for High School Algebra.',
      aiReply: `🎓 *STEM Pedagogical Analysis: Quadratic Formula Derivation*

*Standard Form:* $ax^2 + bx + c = 0$ ($a \\neq 0$)

*Derivation via Completing the Square:*
1. Divide by $a$: $x^2 + \\frac{b}{a}x + \\frac{c}{a} = 0$
2. Isolate constants: $x^2 + \\frac{b}{a}x = -\\frac{c}{a}$
3. Add $\\left(\\frac{b}{2a}\\right)^2$: $\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a^2}$
4. Take square root: $x + \\frac{b}{2a} = \\pm \\frac{\\sqrt{b^2 - 4ac}}{2a}$
5. Result: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

*Key Student Misconception:* Forgetting $\\pm$ or misapplying signs under the radical $\\Delta = b^2 - 4ac$.`
    }
  }
];

export default function WhatsAppModeSettings({
  onModeSaved,
  onCurriculumSaved,
  className = '',
  variant = 'full'
}: WhatsAppModeSettingsProps) {
  const { user, profile, updateUserProfile } = useAuth();

  // Mode state
  const initialMode: WhatsAppConversationMode =
    (profile?.whatsappConversationMode as WhatsAppConversationMode) ||
    (profile?.whatsappMode as WhatsAppConversationMode) ||
    'smart';

  // Curriculum state
  const initialCurriculum: CurriculumType =
    (profile?.primaryCurriculum as CurriculumType) ||
    (profile?.curriculum as CurriculumType) ||
    (profile?.whatsappSettings?.curriculum as CurriculumType) ||
    'cbc';

  const [selectedMode, setSelectedMode] = useState<WhatsAppConversationMode>(initialMode);
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumType>(initialCurriculum);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedPreview, setExpandedPreview] = useState<WhatsAppConversationMode | null>('smart');

  // Sync state with profile updates
  useEffect(() => {
    if (profile) {
      const modeFromProfile =
        (profile.whatsappConversationMode as WhatsAppConversationMode) ||
        (profile.whatsappMode as WhatsAppConversationMode);
      if (modeFromProfile && ['structured', 'flexible', 'smart', 'expert'].includes(modeFromProfile)) {
        setSelectedMode(modeFromProfile);
      }

      const currFromProfile =
        (profile.curriculum as CurriculumType) ||
        (profile.whatsappSettings?.curriculum as CurriculumType);
      if (currFromProfile && ['cbc', 'kcse', 'cambridge_primary', 'igcse', 'a_level', 'ib', 'standard'].includes(currFromProfile)) {
        setSelectedCurriculum(currFromProfile);
      }
    }
  }, [profile]);

  // Handle saving the preferred mode and curriculum to Firestore profile + Backend API
  const handleSaveSettings = async (modeToSave?: WhatsAppConversationMode, curriculumToSave?: CurriculumType) => {
    const targetMode = modeToSave || selectedMode;
    const targetCurriculum = curriculumToSave || selectedCurriculum;

    if (modeToSave) setSelectedMode(modeToSave);
    if (curriculumToSave) setSelectedCurriculum(curriculumToSave);

    setIsSaving(true);
    setSaveStatus(null);

    try {
      // 1. Call Firebase service function to update user document in Firestore with primaryCurriculum
      if (user?.uid && !user.uid.startsWith('offline-sandbox-')) {
        await updateUserPrimaryCurriculum(user.uid, targetCurriculum);
      }

      // 2. Update Profile & Context via updateUserProfile
      if (updateUserProfile) {
        await updateUserProfile({
          primaryCurriculum: targetCurriculum,
          curriculum: targetCurriculum,
          whatsappConversationMode: targetMode,
          whatsappMode: targetMode
        });
      }

      // Fallback local storage items
      localStorage.setItem('edunexus_whatsapp_mode_pref', targetMode);
      localStorage.setItem('edunexus_whatsapp_curriculum_pref', targetCurriculum);
      localStorage.setItem('edunexus_primary_curriculum', targetCurriculum);

      // 3. Call backend endpoint to sync server-side session memory
      try {
        await fetch('/api/whatsapp/preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.uid,
            conversationMode: targetMode,
            curriculum: targetCurriculum,
            primaryCurriculum: targetCurriculum
          })
        });
      } catch (apiErr) {
        console.warn('Backend API preference sync notice:', apiErr);
      }

      const modeTitle = MODE_OPTIONS.find((m) => m.id === targetMode)?.title || targetMode;
      const currTitle = CURRICULUM_OPTIONS.find((c) => c.id === targetCurriculum)?.label || targetCurriculum;

      setSaveStatus({
        type: 'success',
        message: `Preferences updated to "${modeTitle}" (${currTitle}) and saved to your profile!`
      });

      if (onModeSaved) {
        onModeSaved(targetMode);
      }
      if (onCurriculumSaved) {
        onCurriculumSaved(targetCurriculum);
      }

      setTimeout(() => {
        setSaveStatus(null);
      }, 3500);
    } catch (err: any) {
      console.error('Error saving WhatsApp preferences to Firestore:', err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `users/${user?.uid}`);
      } catch {
        // Fallback error message display
      }
      setSaveStatus({
        type: 'error',
        message: err?.message || 'Failed to persist preferences to Firestore profile.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentCurrObj = CURRICULUM_OPTIONS.find((c) => c.id === selectedCurriculum) || CURRICULUM_OPTIONS[0];

  return (
    <div
      className={`bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 border-2 border-emerald-500/30 rounded-2xl p-5 md:p-6 text-white shadow-xl space-y-6 ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-2.5 flex items-center justify-center shrink-0 shadow-inner">
            <Smartphone className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                WhatsApp Assistant & Curriculum Settings
              </h3>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Firestore Synced</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Customize how the EduNexus AI Assistant interacts with you on WhatsApp and specify your primary curriculum framework.
            </p>
          </div>
        </div>

        {/* Status Indicator Badges */}
        <div className="shrink-0 flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs flex-wrap">
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400 font-extrabold uppercase text-[9px]">Mode:</span>
            <span className="text-emerald-400 font-black">
              {MODE_OPTIONS.find((m) => m.id === selectedMode)?.emoji}{' '}
              {MODE_OPTIONS.find((m) => m.id === selectedMode)?.title}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400 font-extrabold uppercase text-[9px]">Curriculum:</span>
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <span>{currentCurrObj.flag}</span>
              <span>{currentCurrObj.badge}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Save Notification Toast / Banner */}
      {saveStatus && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 shadow-md animate-fadeIn ${
            saveStatus.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{saveStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus(null)}
            className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Curriculum Framework Selection Section */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-4 md:p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                Primary Curriculum Framework
              </h4>
              <p className="text-xs text-slate-300">
                Specifies the official document architecture applied to all generated lesson plans, schemes of work, CATs, and WhatsApp replies.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-[11px] font-black text-emerald-300">
            <span>{currentCurrObj.flag}</span>
            <span>{currentCurrObj.badge}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Select Dropdown */}
          <div className="lg:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Primary Curriculum:</span>
              </span>
              <span className="text-[10px] text-amber-400 font-extrabold uppercase bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded">
                Mandatory *
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedCurriculum}
                onChange={(e) => {
                  const newCurr = e.target.value as CurriculumType;
                  setSelectedCurriculum(newCurr);
                  handleSaveSettings(selectedMode, newCurr);
                }}
                className="w-full bg-slate-950 border-2 border-emerald-500/40 focus:border-emerald-400 text-white font-bold text-xs rounded-xl px-3.5 py-2.5 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
              >
                {CURRICULUM_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white py-1">
                    {c.flag} {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Active Framework Summary Box */}
          <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-bold text-emerald-400 border-b border-slate-800/60 pb-1">
              <span className="flex items-center gap-1.5">
                <span>{currentCurrObj.flag}</span>
                <span>{currentCurrObj.label}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Official Structure</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {currentCurrObj.description}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Conversation Modes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Preferred Mode for Teacher Account</span>
          </span>
          <span className="text-[11px] text-slate-400">Click any mode to select & save</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODE_OPTIONS.map((mode) => {
            const isSelected = selectedMode === mode.id;
            const IconComp = mode.icon;

            return (
              <div
                key={mode.id}
                onClick={() => handleSaveSettings(mode.id, selectedCurriculum)}
                className={`group relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-400 text-white shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-900'
                }`}
              >
                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 rounded-full p-1 shadow-md animate-scaleUp">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                <div className="space-y-2.5">
                  {/* Title & Tag */}
                  <div className="flex items-center gap-2 pr-6">
                    <div
                      className={`p-2 rounded-lg border shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 group-hover:text-emerald-400'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white flex items-center gap-1">
                          <span>{mode.emoji}</span>
                          <span>{mode.title}</span>
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {mode.tag}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mode Description */}
                  <p className="text-xs text-slate-300 leading-relaxed">{mode.description}</p>

                  {/* Features Bullets */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {mode.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Controls & Example Preview Toggle */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 italic truncate max-w-[200px]">
                    {mode.recommendedFor}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedPreview(expandedPreview === mode.id ? null : mode.id);
                    }}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer hover:underline shrink-0"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{expandedPreview === mode.id ? 'Hide Example' : 'View Output Example'}</span>
                    {expandedPreview === mode.id ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Example Response Collapsible Panel */}
                {expandedPreview === mode.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 p-3 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-2 text-xs animate-fadeIn"
                  >
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                      <span>Simulated WhatsApp Reply</span>
                      <span className="text-emerald-400">{mode.title}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-slate-300 text-[11px]">
                        <span className="text-emerald-400 font-bold">Teacher Prompt:</span> "{mode.exampleResponse.userPrompt}"
                      </div>

                      <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30 font-mono text-[11px] text-emerald-100 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                        {mode.exampleResponse.aiReply}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Save & Help Note */}
      <div className="pt-3 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Changes take effect immediately for all incoming WhatsApp messages & web generators associated with your account.
          </span>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => handleSaveSettings()}
          className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Preferences...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save All Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

