import React from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Cpu,
  ExternalLink,
  Flame,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  Lightbulb,
  ListCheck,
  MessageSquare,
  RefreshCw,
  Sliders,
  Sparkles,
  Target,
  Zap,
  AlertTriangle,
  ArrowUpRight,
  Share2
} from 'lucide-react';

export interface ConceptNode {
  id: string;
  label: string;
  type: string;
  description: string;
}

export interface ConceptEdge {
  from: string;
  to: string;
  label: string;
}

export interface ConceptVisualization {
  title: string;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export interface SuggestedResource {
  title: string;
  url: string;
  reason: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  feedback?: 'up' | 'down';
}

export interface TutorDashboardProps {
  subject: string;
  topic: string;
  scaffoldingLevel: 'low' | 'medium' | 'high';
  persona: string;
  activeStep: string;
  misconceptions: string[];
  suggestedResources: SuggestedResource[];
  conceptMap: ConceptVisualization;
  messages: Message[];
  onSelectTopic?: (topic: string) => void;
  onSelectPrompt?: (prompt: string) => void;
  onChangeScaffolding?: (level: 'low' | 'medium' | 'high') => void;
  onChangePersona?: (persona: 'Socratic Questioner' | 'Encouraging Mentor' | 'Critical Examiner') => void;
  onSwitchToChat?: () => void;
  onResetSession?: () => void;
}

export const TutorDashboard: React.FC<TutorDashboardProps> = ({
  subject,
  topic,
  scaffoldingLevel,
  persona,
  activeStep,
  misconceptions,
  suggestedResources,
  conceptMap,
  messages,
  onSelectTopic,
  onSelectPrompt,
  onChangeScaffolding,
  onChangePersona,
  onSwitchToChat,
  onResetSession,
}) => {
  // Derived Deep Dive Topics based on subject and topic
  const defaultDeepDiveTopics = [
    {
      title: `Core Principles of ${topic || 'Subject'}`,
      description: `Examine the foundational axioms, variable definitions, and key formulas governing ${topic || subject}.`,
      difficulty: 'Foundational',
      category: 'Theory & Conceptual',
      prompt: `Can you break down the fundamental rules and equations of ${topic || subject} using a step-by-step Socratic approach?`
    },
    {
      title: `Real-World Applications & Case Studies`,
      description: `Explore practical engineering, environmental, and everyday scenarios where ${topic || 'this concept'} is applied.`,
      difficulty: 'Applied',
      category: 'Problem Solving',
      prompt: `What are 3 real-world engineering or physical examples where ${topic || subject} directly applies, and how can we analyze them?`
    },
    {
      title: `Advanced Problem Triangulation & Edge Cases`,
      description: `Test edge cases, non-linear variables, and multi-step diagnostic problems to deepen mastery.`,
      difficulty: 'Advanced',
      category: 'Critical Thinking',
      prompt: `What are common edge cases or tricky misconceptions students encounter in ${topic || subject}? Walk me through a challenging problem.`
    },
    {
      title: `Cross-Disciplinary Connections`,
      description: `Connect ${topic || subject} with complementary STEM domains, mathematical modeling, and experimental design.`,
      difficulty: 'Interdisciplinary',
      category: 'Synthesis',
      prompt: `How does ${topic || subject} connect to other scientific disciplines or mathematical models?`
    }
  ];

  const userMessagesCount = messages.filter(m => m.role === 'user').length;
  const tutorMessagesCount = messages.filter(m => m.role === 'model').length;
  const masteredCount = Math.max(0, conceptMap.nodes.length - misconceptions.length);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-1 sm:p-2 animate-fadeIn">
      {/* Top Banner & Overview Cards */}
      <div className="bg-gradient-to-r from-slate-900 via-[#2d3a28] to-[#5f6f52] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-[#a9b388]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/10 text-[#e5e1da] border border-white/15 backdrop-blur-md flex items-center gap-1.5 uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5 text-[#a9b388]" />
                {subject || 'General Education'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#a9b388]/20 text-[#e5e1da] border border-[#a9b388]/30 backdrop-blur-md flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#a9b388]" />
                {topic || 'Active Inquiry'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white">
              EduNexus Socratic Tutor Dashboard
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
              Real-time pedagogical metrics, diagnostic misconception tracking, and active recall milestones organized for guided learning.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {onSwitchToChat && (
              <button
                onClick={onSwitchToChat}
                className="px-5 py-3 bg-[#a9b388] hover:bg-[#97a276] text-slate-950 font-extrabold rounded-2xl text-xs transition cursor-pointer flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Jump to Socratic Dialogue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {onResetSession && (
              <button
                onClick={onResetSession}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs transition cursor-pointer flex items-center gap-2 backdrop-blur-md border border-white/10"
                title="Reset Socratic metrics"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300 flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-[#a9b388]" /> Dialogue Turns
            </span>
            <div className="text-xl font-bold text-white mt-1">
              {userMessagesCount} <span className="text-xs font-normal text-slate-300">user</span> / {tutorMessagesCount} <span className="text-xs font-normal text-slate-300">AI</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Scaffolding Level
            </span>
            <div className="text-xl font-bold text-white capitalize mt-1 flex items-center gap-2">
              {scaffoldingLevel}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase font-extrabold">
                {scaffoldingLevel === 'high' ? 'Detailed' : scaffoldingLevel === 'medium' ? 'Guided' : 'Hints'}
              </span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300 flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-400" /> Concept Mastery
            </span>
            <div className="text-xl font-bold text-white mt-1">
              {masteredCount} / {Math.max(1, conceptMap.nodes.length)}
              <span className="text-xs font-medium text-emerald-300 ml-1.5">
                ({Math.round((masteredCount / Math.max(1, conceptMap.nodes.length)) * 100)}%)
              </span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" /> Misconceptions
            </span>
            <div className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              {misconceptions.length}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${misconceptions.length === 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                {misconceptions.length === 0 ? 'Clear' : 'Active Gap'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1: Active Session Progress */}
        <div className="bg-white border border-[#e5e1da] rounded-3xl p-5 shadow-xs flex flex-col gap-5 hover:border-[#5f6f52]/40 transition duration-200">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5f6f52]/10 border border-[#5f6f52]/20 flex items-center justify-center text-[#5f6f52]">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-slate-800">Active Session Progress</h3>
                <p className="text-[11px] text-slate-400 font-medium">Socratic milestones & current inquiry status</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>

          {/* Active Step Highlight Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-[#5f6f52] uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Current Cognitive Step
              </span>
              <span>Step Active</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              {activeStep || "Formulating initial Socratic questions and establishing conceptual baselines..."}
            </p>
          </div>

          {/* Socratic Scaffolding & Persona Controls */}
          <div className="space-y-3 bg-white border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#5f6f52]" /> Scaffolding Intensity
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Adjust step granularity</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onChangeScaffolding?.(lvl)}
                  className={`py-2 px-2 rounded-xl text-xs font-extrabold capitalize transition cursor-pointer flex flex-col items-center justify-center border ${
                    scaffoldingLevel === lvl
                      ? 'bg-[#5f6f52] text-white border-[#5f6f52] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{lvl}</span>
                  <span className="text-[9px] opacity-80 font-normal">
                    {lvl === 'low' ? 'Hints' : lvl === 'medium' ? 'Guided' : 'Granular'}
                  </span>
                </button>
              ))}
            </div>

            {/* Persona Selector */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#5f6f52]" /> Tutor Persona Style
              </label>
              <select
                value={persona}
                onChange={(e) => onChangePersona?.(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5f6f52] cursor-pointer"
              >
                <option value="Socratic Questioner">Socratic Questioner (Inquiry-based)</option>
                <option value="Encouraging Mentor">Encouraging Mentor (Supportive Scaffolding)</option>
                <option value="Critical Examiner">Critical Examiner (Rigorous Logic Verification)</option>
              </select>
            </div>
          </div>

          {/* Quick Progress Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ListCheck className="w-4 h-4 text-[#5f6f52]" /> Socratic Session Health
            </h4>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Topic Alignment
                </span>
                <span className="font-bold text-slate-800">{topic || 'General'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Active Concept Map Nodes
                </span>
                <span className="font-bold text-slate-800">{conceptMap.nodes.length} mapped</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Active Misconception Scan
                </span>
                <span className={`font-bold ${misconceptions.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {misconceptions.length > 0 ? `${misconceptions.length} Gaps Flagged` : '0 Gaps'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Recent Insights */}
        <div className="bg-white border border-[#e5e1da] rounded-3xl p-5 shadow-xs flex flex-col gap-5 hover:border-[#5f6f52]/40 transition duration-200">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5f6f52]/10 border border-[#5f6f52]/20 flex items-center justify-center text-[#5f6f52]">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-slate-800">Recent Insights</h3>
                <p className="text-[11px] text-slate-400 font-medium">Diagnostic alerts & conceptual breakthroughs</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              AI Diagnostic
            </span>
          </div>

          {/* Misconceptions & Diagnostic Alerts */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Active Misconception Triangulation
            </h4>

            {misconceptions.length === 0 ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-emerald-900 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-emerald-950">No Conceptual Misconceptions Flagged</h5>
                  <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                    Great job! The Socratic AI hasn't detected any logical gaps in your recent answers. Keep advancing through active recall prompts.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {misconceptions.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-50/80 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-950 space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-rose-800 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Gap #{idx + 1}
                      </span>
                      <span className="text-[9px] font-extrabold bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">
                        Requires Verification
                      </span>
                    </div>
                    <p className="font-semibold leading-relaxed text-slate-800">
                      {item}
                    </p>
                    {onSelectPrompt && (
                      <button
                        type="button"
                        onClick={() => onSelectPrompt(`Can you help me resolve my misconception about: "${item}" using a step-by-step example?`)}
                        className="text-[10px] font-extrabold text-[#5f6f52] hover:text-[#4d5a42] hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-[#5f6f52]" /> Ask Socratic AI to resolve this gap &rarr;
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Active Concept Nodes Summary */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#5f6f52]" /> Active Concept Connections ({conceptMap.nodes.length})
            </h4>

            {conceptMap.nodes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No concept nodes generated yet. Start a discussion to build the visual concept graph.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {conceptMap.nodes.map((node) => (
                  <div
                    key={node.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#5f6f52]" />
                    <span className="font-bold text-slate-800">{node.label}</span>
                    <span className="text-[9px] text-slate-400 capitalize">({node.type})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Socratic Reflection Brief */}
          <div className="bg-[#5f6f52]/5 border border-[#5f6f52]/20 rounded-2xl p-4 text-xs space-y-1.5 mt-auto">
            <div className="flex items-center justify-between text-[#5f6f52] font-extrabold uppercase text-[10px] tracking-wider">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Pedagogical Summary
              </span>
              <span>UDL Compliant</span>
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              Your inquiries demonstrate active involvement. Respond to counter-questions using complete reasoning to reinforce retention.
            </p>
          </div>
        </div>

        {/* COLUMN 3: Suggested Deep-Dive Topics */}
        <div className="bg-white border border-[#e5e1da] rounded-3xl p-5 shadow-xs flex flex-col gap-5 hover:border-[#5f6f52]/40 transition duration-200">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5f6f52]/10 border border-[#5f6f52]/20 flex items-center justify-center text-[#5f6f52]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-slate-800">Suggested Deep-Dive Topics</h3>
                <p className="text-[11px] text-slate-400 font-medium">Curated explorations & recommended resources</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Curated
            </span>
          </div>

          {/* Deep-Dive Topics Cards */}
          <div className="space-y-2.5">
            {defaultDeepDiveTopics.map((topicItem, idx) => (
              <div
                key={idx}
                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-[#5f6f52]/30 rounded-2xl p-3.5 transition group cursor-pointer space-y-2 shadow-2xs"
                onClick={() => {
                  if (onSelectTopic) onSelectTopic(topicItem.title);
                  if (onSelectPrompt) onSelectPrompt(topicItem.prompt);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-[#5f6f52] bg-[#5f6f52]/10 px-2 py-0.5 rounded-full border border-[#5f6f52]/20 uppercase tracking-wider">
                    {topicItem.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {topicItem.difficulty}
                  </span>
                </div>

                <h5 className="font-bold text-xs text-slate-800 group-hover:text-[#5f6f52] transition flex items-center justify-between">
                  <span>{topicItem.title}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#5f6f52] transition transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </h5>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {topicItem.description}
                </p>

                <div className="text-[10px] font-extrabold text-[#5f6f52] flex items-center gap-1 pt-1">
                  <span>Start Socratic Exploration</span> &rarr;
                </div>
              </div>
            ))}
          </div>

          {/* External Interactive Resources (PhET / OpenStax / Khan Academy) */}
          {suggestedResources && suggestedResources.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-[#5f6f52]" /> Recommended PhET & OpenStax Material
              </h4>

              <div className="space-y-2">
                {suggestedResources.map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block bg-slate-50 hover:bg-[#5f6f52]/5 border border-slate-200 hover:border-[#5f6f52]/30 rounded-2xl p-3 transition text-xs space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="truncate pr-2">{res.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#5f6f52] shrink-0" />
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2">
                      {res.reason}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Collaborative Group Room Nudge */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1 mt-auto">
            <div className="font-extrabold text-amber-950 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Share2 className="w-3.5 h-3.5 text-amber-600" /> Collaborative Group Room Nudge
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Share your current reasoning or questions with study room partners to facilitate peer assessment and collective synthesis.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TutorDashboard;
