import React, { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  DocumentType,
  CurriculumType,
  SUBJECT_OPTIONS,
  GRADE_OPTIONS_CBC,
  GRADE_OPTIONS_STANDARD,
  GenerationParams,
  DocumentDraft,
  PromptTemplate,
  getCbcLessonDetails
} from '../types';
import { BookOpen, Sparkles, FileText, Settings, ArrowLeft, Lightbulb, Clock, Calendar, CalendarDays, Trash2, Save, X, FolderOpen, Bookmark, BookMarked, Tag, Home, Users, Mic, MicOff, Plus, RefreshCw, GitFork, Eye, Database, Grab, HelpCircle, RotateCcw, CheckCircle2, ShieldAlert, Undo2, Redo2, AlignLeft, Globe, Loader2, Info } from 'lucide-react';
import { EditableSelect } from './EditableSelect';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { quickFormatEducationalText } from '../utils/quickFormat';
import { useAccessibility } from '../context/AccessibilityContext';
import { handleResponseJson } from '../utils/api';
import { calculateReadability } from '../utils/readability';
import { db, handleFirestoreError, OperationType, cleanUndefined } from '../firebase';
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import QuestionBank from './QuestionBank';
import { QuestionBankItem } from '../types';
import { useAutoRecovery } from '../hooks/useAutoRecovery';
import RealtimeSpellcheckEditor from './RealtimeSpellcheckEditor';

interface MicButtonWithIndicatorProps {
  field: 'topic' | 'subTopic' | 'customSubject' | 'extraPrompt' | 'hub';
  activeMicField: 'topic' | 'subTopic' | 'customSubject' | 'extraPrompt' | 'hub' | null;
  toggleMic: (field: 'topic' | 'subTopic' | 'customSubject' | 'extraPrompt' | 'hub') => void;
  isTextArea?: boolean;
}

function MicButtonWithIndicator({
  field,
  activeMicField,
  toggleMic,
  isTextArea = false
}: MicButtonWithIndicatorProps) {
  const isActive = activeMicField === field;

  return (
    <div className={`absolute right-2 flex items-center gap-2 z-10 ${isTextArea ? 'top-2.5' : 'top-1/2 -translate-y-1/2'}`}>
      {isActive && (
        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 px-2 py-1 rounded-lg text-[10px] font-bold shadow-xs whitespace-nowrap animate-fadeIn pointer-events-none select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="hidden sm:inline">Listening</span>
          <div className="flex items-end gap-0.5 h-2.5 w-3 shrink-0">
            <motion.span
              animate={{ height: ['20%', '100%', '20%'] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-[2px] bg-red-500 rounded-xs"
            />
            <motion.span
              animate={{ height: ['40%', '100%', '40%'] }}
              transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
              className="w-[2px] bg-red-500 rounded-xs"
            />
            <motion.span
              animate={{ height: ['15%', '100%', '15%'] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              className="w-[2px] bg-red-500 rounded-xs"
            />
          </div>
        </div>
      )}

      <div className="relative flex items-center justify-center">
        {isActive && (
          <>
            <span className="absolute inset-0 rounded-lg bg-red-400/30 animate-ping pointer-events-none" />
            <span className="absolute -inset-1 rounded-lg bg-red-300/20 animate-pulse pointer-events-none" />
          </>
        )}
        <button
          type="button"
          onClick={() => toggleMic(field)}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            isActive
              ? 'bg-red-500 text-white shadow-md shadow-red-200/50 scale-105 border border-red-400'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent'
          }`}
          title={isActive ? 'Stop Listening (Recording)' : 'Dictate (Voice Input)'}
        >
          {isActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

interface LastSavedTimestampIndicatorProps {
  lastSavedTime: Date | null;
  onSaveNow: () => void;
  isGenerating: boolean;
}

function LastSavedTimestampIndicator({
  lastSavedTime,
  onSaveNow,
  isGenerating
}: LastSavedTimestampIndicatorProps) {
  const [now, setNow] = useState<Date>(new Date());
  const [isJustSaved, setIsJustSaved] = useState<boolean>(false);

  // Update current time ticker every 3 seconds for dynamic relative time display
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Trigger brief visual pulse effect whenever lastSavedTime updates
  useEffect(() => {
    if (lastSavedTime) {
      setIsJustSaved(true);
      const timeout = setTimeout(() => setIsJustSaved(false), 2200);
      return () => clearTimeout(timeout);
    }
  }, [lastSavedTime]);

  // Calculate human-friendly relative time string
  const getRelativeTimeString = () => {
    if (!lastSavedTime) return 'Auto-save active';
    const diffSec = Math.max(0, Math.floor((now.getTime() - lastSavedTime.getTime()) / 1000));
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const exactTimeString = lastSavedTime
    ? lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-medium transition-all duration-300 shadow-2xs ${
        isJustSaved
          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20'
          : 'bg-white/90 dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
      title={
        exactTimeString
          ? `Last saved to offline cache & Firestore at ${exactTimeString}. Progress is automatically preserved every 30 seconds.`
          : 'Progress is automatically preserved every 30 seconds to browser cache & Firestore.'
      }
    >
      <div className="relative flex items-center justify-center shrink-0">
        {isJustSaved ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
        ) : (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">Last saved:</span>
        <span className="font-bold text-slate-800 dark:text-slate-100 font-mono text-[11px] sm:text-xs tracking-tight">
          {exactTimeString ? exactTimeString : 'Initializing...'}
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
          {getRelativeTimeString()}
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          onSaveNow();
          setIsJustSaved(true);
        }}
        disabled={isGenerating}
        className="ml-1 pl-2 border-l border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
        title="Force save form progress now"
      >
        <Save className="w-3 h-3" />
        <span className="hidden md:inline">Save Now</span>
      </button>
    </div>
  );
}

interface DocumentCreatorProps {
  onBack: () => void;
  onGenerate: (params: GenerationParams) => Promise<void>;
  isGenerating: boolean;
  initialDraft?: DocumentDraft | null;
}

const LOADING_TIPS = [
  'Analyzing syllabus scope and curriculum standards...',
  'Formulating specific, measurable learning outcomes (SMART objectives)...',
  'Structuring learner-centered, engaging classroom activities...',
  'Designing multi-level assessment items and evaluation rubrics...',
  'Crafting contextual, localized teaching resources and improvisations...',
  'Polishing markdown headings and formatting tables for clean printing...',
];

const BUILT_IN_TEMPLATES: {
  id: string;
  templateName: string;
  description: string;
  docType: DocumentType;
  curriculum: CurriculumType;
  extraPrompt: string;
  explainLikeMasterTeacher: boolean;
  askMentor: boolean;
  generateVocabulary?: boolean;
  generateDifferentiated?: boolean;
  generateParental?: boolean;
  generateDiagram?: boolean;
  diagramType?: 'flowchart' | 'concept-map';
}[] = [
  {
    id: 'builtin-lesson-plan',
    templateName: 'Standard Lesson Plan Structure',
    description: 'A complete daily lesson plan outline including learning objectives, instructional resources, and step-by-step presentation stages.',
    docType: 'lesson-plan',
    curriculum: 'cbc',
    extraPrompt: 'Structure the lesson plan under clear section headers: 1. LESSON OBJECTIVES (Cognitive, Psychomotor, Affective); 2. INSTRUCTIONAL RESOURCES (Core and improvised); 3. LESSON STEPS (Introduction/Hook, Main Presentation, Guided Practice, Independent Practice, Conclusion); 4. FORMATIVE ASSESSMENT (Specific exit tickets or questions). Use a clean table format where appropriate.',
    explainLikeMasterTeacher: true,
    askMentor: false,
    generateVocabulary: true,
    generateDifferentiated: true,
    generateParental: true
  },
  {
    id: 'builtin-weekly-checkin',
    templateName: 'Weekly Student Progress Check-In',
    description: 'A structural tool for students and teachers to self-assess understanding, log challenges, and formulate remedial goals.',
    docType: 'formative-assessment',
    curriculum: 'standard',
    extraPrompt: 'Create a Weekly Student Progress and Check-In Form structure. It should include: 1. SUBJECT MASTERY SCORECARD (A quick grading scale for current weekly topics); 2. INDIVIDUAL CHALLENGES REGISTER (A checklist for students to self-identify difficult concepts); 3. REFLECTIVE PROMPTS (Two open-ended questions about what clicked this week and what needs review); 4. WEEKLY ACTION PLAN (Goal-setting and target study hours for the coming week).',
    explainLikeMasterTeacher: false,
    askMentor: true,
    generateVocabulary: false,
    generateDifferentiated: true,
    generateParental: true
  },
  {
    id: 'builtin-blooms-worksheet',
    templateName: "Bloom's Taxonomy Worksheet",
    description: "An assessment worksheet scaffolding learner exercises from basic recall up to critical evaluation and creation.",
    docType: 'worksheet',
    curriculum: 'standard',
    extraPrompt: "Structure the worksheet following Bloom's Taxonomy. Section 1: REMEMBERING (factual recall, fill-in-the-blank); Section 2: UNDERSTANDING & APPLYING (concept explanations, real-world scenario questions); Section 3: ANALYZING & EVALUATING (compare-and-contrast, case study critique); Section 4: CREATING (a mini-design task or creative application problem). Include an Answer Key at the very end.",
    explainLikeMasterTeacher: true,
    askMentor: false,
    generateVocabulary: false,
    generateDifferentiated: true,
    generateParental: false
  },
  {
    id: 'builtin-summative-blueprint',
    templateName: 'Summative Assessment & Marking Scheme',
    description: 'A structured blueprint mapping exam question distributions, key weights, and step-by-step partial credit schemas.',
    docType: 'summative-assessment',
    curriculum: 'cbc',
    extraPrompt: 'Draft a comprehensive assessment blueprint and marking scheme. Include: 1. TABLE OF SPECIFICATIONS (Topic weightings, cognitive level distributions); 2. BALANCED QUESTIONS (Multiple-choice, short-answer, structured-essay); 3. CRITERION-REFERENCED MARKING SCHEME (Detailed grading criteria, model answers, and step-by-step partial credit criteria).',
    explainLikeMasterTeacher: false,
    askMentor: true,
    generateVocabulary: false,
    generateDifferentiated: false,
    generateParental: false
  },
  {
    id: 'builtin-scheme-of-work',
    templateName: 'Weekly Scheme of Work Grid',
    description: 'Maps the curriculum progression across learning areas, core inquiry questions, resources, and assessment criteria.',
    docType: 'scheme-of-work',
    curriculum: 'cbc',
    extraPrompt: 'Format as a weekly CBC Scheme of Work. Organise with the following key components: Administrative Details (School, Year, Term, Subject/Learning Area, Grade, and Teacher’s Details), Week & Lesson, Strand & Sub-Strand, Specific Learning Outcomes, Key Inquiry Questions (KIQ), Learning Experiences, Learning Resources, Assessment Methods, and Reflections / Remarks.',
    explainLikeMasterTeacher: true,
    askMentor: false,
    generateVocabulary: true,
    generateDifferentiated: true,
    generateParental: true
  },
  {
    id: 'builtin-sen-adaptive',
    templateName: 'Inclusive & SEN Adapted Planner',
    description: 'A specialized structural layout designed for inclusive education, tactile learning, and multi-ability scaffoldings.',
    docType: 'pedagogy-advisor',
    curriculum: 'cbc',
    extraPrompt: 'Provide an SEN-adapted lesson companion. Structure it with: 1. VISUAL & SENSORY AIDS PLAN (specific low-cost models or drawings); 2. SCAFFOLDED STEP-BY-STEP PATHWAYS (broken down sub-tasks); 3. BEHAVIORAL AND COGNITIVE ACCOMMODATIONS (sensory breaks, alternate response formats like verbal or drawing); 4. ADVANCED ENRICHMENT FOR EXCEL-LEVEL DUAL-EXCEPTIONAL STUDENTS.',
    explainLikeMasterTeacher: true,
    askMentor: true,
    generateVocabulary: true,
    generateDifferentiated: true,
    generateParental: true
  }
];

const cleanTextForPreview = (str: string) => {
  if (!str) return '';
  let cleaned = str.replace(/\*/g, '').replace(/\$/g, 'KES ');
  const lines = cleaned.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      return trimmed.replace(/^#+\s*/, '').toUpperCase();
    }
    return line;
  });
  return processedLines.join('\n');
};

const LAYOUT_TEMPLATES_DATA = {
  'default': {
    title: 'Classic Instructional Flow',
    subtitle: 'Classic Flow',
    colorClass: 'from-slate-500/10 to-slate-600/5 border-slate-200 text-slate-800',
    iconColor: 'text-slate-600',
    badgeColor: 'bg-slate-100 text-slate-800',
    bestFor: 'Structured lectures, review sessions, standard curriculum progression, and clear direct explanation classes.',
    description: 'This is the traditional, reliable teaching structure. It starts with an introduction and clear learning objectives, moves into direct teacher-led concept development with examples, summarizes the key points, and concludes with a formative check to gauge understanding.',
    stages: [
      { name: '1. Introduction & Hook', duration: '5-10 mins', desc: 'Settle the class, capture attention, and state objectives.' },
      { name: '2. Concept Development', duration: '20-25 mins', desc: 'Direct teaching, chalkboard models, and structured examples.' },
      { name: '3. Lesson Summary', duration: '5 mins', desc: 'Recap core principles and key takeaways.' },
      { name: '4. Assessment & Reflection', duration: '5-10 mins', desc: 'Exit tickets or short conceptual questions.' }
    ],
    sampleSnippet: `# LESSON PLAN: INTRODUCTION TO FORCES

## 1. INTRODUCTION (10 mins)
* **Hook:** Drop a book and push a desk. Ask students: *"What caused these objects to move or stop?"*
* **Learning Outcomes:** Define a force, identify at least three everyday examples of forces, and state the SI unit of force.

## 2. CONCEPT DEVELOPMENT (25 mins)
* **Definition:** Explain that a force is a push or a pull acting upon an object.
* **Core Content:** Introduce contact forces (friction, applied force) and non-contact forces (gravity, magnetism).
* **Board Work:** Draw simple free-body diagrams with arrows showing direction and magnitude.
* **Guided Practice:** Categorize everyday actions (e.g., kicking a ball, refrigerator magnets) as contact or non-contact.

## 3. LESSON SUMMARY (5 mins)
* Summarize that forces cause objects to accelerate, decelerate, change direction, or deform.
* Ask two students to define "force" in their own words.

## 4. FORMATIVE ASSESSMENT (10 mins)
* **Exit Ticket:** Complete 3 short-answer questions identifying the forces active on a parked car.`
  },
  '5e-model': {
    title: '5E Constructivist Model',
    subtitle: '5E Constructivist',
    colorClass: 'from-teal-500/10 to-emerald-500/5 border-teal-200 text-teal-800',
    iconColor: 'text-teal-600',
    badgeColor: 'bg-teal-100 text-teal-800',
    bestFor: 'Practical sciences, inquiry-focused lessons, hands-on activities, and CBC (Competency Based Curriculum) science/math strands.',
    description: 'Based on constructivist learning theory, this model guides students to build their own understanding of new concepts through active exploration. The teacher acts as a facilitator rather than a lecturer, prompting discovery before formalizing terms.',
    stages: [
      { name: '1. Engage', duration: '5-10 mins', desc: 'Pique curiosity and elicit prior knowledge without giving answers.' },
      { name: '2. Explore', duration: '15-20 mins', desc: 'Hands-on investigation where students work with materials and gather data.' },
      { name: '3. Explain', duration: '10-15 mins', desc: 'Students share findings, then teacher introduces formal vocabulary.' },
      { name: '4. Elaborate', duration: '10-15 mins', desc: 'Apply new concepts to real-world scenarios or deeper problems.' },
      { name: '5. Evaluate', duration: '5-10 mins', desc: 'Assess understanding using self-reflection or performance tasks.' }
    ],
    sampleSnippet: `# LESSON PLAN: PHOTOSYNTHESIS (5E MODEL)

## 1. ENGAGE (10 mins)
* Place a healthy green potted plant next to a yellowed, withered plant kept in a dark cupboard.
* Ask: *"What is the invisible kitchen inside the healthy plant that keeps it alive?"* Elicit wild guesses.

## 2. EXPLORE (15 mins)
* **Activity:** In groups of four, students inspect leaf specimens.
* Use a safe, pre-prepared iodine solution demonstration on a leaf to observe the presence of starch (turns blue-black).
* Students log qualitative descriptions of the chemical reaction without knowing the formula yet.

## 3. EXPLAIN (15 mins)
* Ask group leaders to explain why only the green, sunlit leaf reacted with iodine.
* **Formalization:** Teach the word "Photosynthesis" (Photo = Light, Synthesis = Making). Write the chemical equation on the board: Carbon Dioxide + Water + Sunlight -> Glucose + Oxygen.

## 4. ELABORATE (10 mins)
* Discuss: *"How does this process impact the oxygen we breathe right now?"*
* Connect photosynthesis to forest conservation and agricultural productivity.

## 5. EVALUATE (10 mins)
* Students draw a labeled diagram showing the inputs and outputs of a leaf.`
  },
  'direct-instruction': {
    title: 'Direct Instruction Model (I Do, We Do, You Do)',
    subtitle: 'Direct Instruction',
    colorClass: 'from-amber-500/10 to-orange-500/5 border-amber-200 text-amber-800',
    iconColor: 'text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-800',
    bestFor: 'Mathematics, grammar, specific skills, technical procedures, and lessons with clear step-by-step masteries.',
    description: 'This explicit instruction model breaks complex skills into bite-sized steps. It features a heavily scaffolded progression: the teacher models the skill (I Do), the class practices together under guidance (We Do), and students demonstrate mastery independently (You Do).',
    stages: [
      { name: '1. Focus Set / Hook', duration: '5 mins', desc: 'Grab attention and connect to previous day\'s mastery.' },
      { name: '2. I Do (Modeling)', duration: '15 mins', desc: 'Teacher demonstrates the skill step-by-step, explaining their thoughts aloud.' },
      { name: '3. We Do (Guided)', duration: '15 mins', desc: 'Teacher and students solve problems together, getting instant feedback.' },
      { name: '4. You Do (Independent)', duration: '15 mins', desc: 'Students work solo to practice and lock in the skill.' },
      { name: '5. Closure', duration: '5 mins', desc: 'Brief recap and a quick exit ticket to assess accuracy.' }
    ],
    sampleSnippet: `# LESSON PLAN: FACTORING QUADRATIC EQUATIONS

## 1. FOCUS SET & REVIEW (5 mins)
* Quick warm-up expanding $(x + 2)(x + 3)$ using the FOIL method. Highlight that factoring is the exact reverse process.

## 2. DIRECT INSTRUCTION (I DO) (15 mins)
* Introduce the standard form: $ax^2 + bx + c = 0$.
* Explain the "Product-Sum" method: Find two numbers that multiply to $c$ and add up to $b$.
* **Step-by-Step Modeling:** Solve $x^2 + 5x + 6 = 0$ on the board.
  * *Thought process:* "I need factors of 6. Let's list them: 1 & 6, 2 & 3. Which pair adds up to 5? 2 + 3 = 5. So, $(x+2)(x+3) = 0$."

## 3. GUIDED PRACTICE (WE DO) (15 mins)
* Write $x^2 + 7x + 12 = 0$ on the board.
* Call on students for individual steps:
  * *"What is our 'c' value?"* (12)
  * *"What numbers multiply to 12 and add to 7?"* (3 and 4)
* Solve three more equations together using whiteboards or show-of-hands to check correctness.

## 4. INDEPENDENT PRACTICE (YOU DO) (15 mins)
* Students solve 6 quadratic equations individually from a worksheet.
* Teacher circulates to assist students, focusing on those who struggled during the "We Do" phase.

## 5. CLOSURE (5 mins)
* Summarize the factoring checklist. Assign one final problem as an Exit Ticket.`
  },
  'inquiry-based': {
    title: 'Inquiry-Based Learning Model',
    subtitle: 'Inquiry-Based',
    colorClass: 'from-indigo-500/10 to-violet-500/5 border-indigo-200 text-indigo-800',
    iconColor: 'text-indigo-600',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    bestFor: 'Social studies, humanities, geography, open-ended problem solving, project brainstorming, and environmental studies.',
    description: 'This model shifts the focus from answering questions to asking them. Students explore a central, real-world "Essential Question" or challenge, research data, collaborate to synthesize solutions, and reflect on their outcomes.',
    stages: [
      { name: '1. Ask / Inquire', duration: '5-10 mins', desc: 'Present a complex real-world challenge or question to spark curiosity.' },
      { name: '2. Investigate / Research', duration: '20 mins', desc: 'Students search sources, examine maps, or read texts in teams.' },
      { name: '3. Create & Synthesize', duration: '15 mins', desc: 'Teams collaborate to draft a solution, plan, or poster.' },
      { name: '4. Collaborate & Share', duration: '10 mins', desc: 'Share ideas with the wider class and get constructive critique.' },
      { name: '5. Reflect', duration: '5-10 mins', desc: 'Deconstruct what was learned and evaluate the solution\'s viability.' }
    ],
    sampleSnippet: `# LESSON PLAN: WATER CONSERVATION CHALLENGE

## 1. ASK / INQUIRE (10 mins)
* **Essential Question:** *"Our county experiences severe dry spells. How can our school community reduce its daily water consumption by 15%?"*
* Spark curiosity with a brief infographic showing local school water waste.

## 2. INVESTIGATE (20 mins)
* In teams of five, students investigate school water usage areas (restrooms, cafeteria, school garden).
* **Research task:** Use historical water bill averages (provided on a handout) and current tap flow rate estimates to locate areas of maximum waste.

## 3. CREATE & SYNTHESIZE (15 mins)
* Teams draft a 3-step **School Water Conservation Protocol** on large poster sheets.
* Must include clear, actionable rules (e.g., tap timing rules, greywater recycling for the school garden) and a cost-estimate.

## 4. COLLABORATE & SHARE (10 mins)
* **Gallery Walk:** Post poster sheets on the walls.
* Teams circulate, leaving sticky-note feedback or questions for other groups.

## 5. REFLECT (10 mins)
* Reconvene as a class to discuss the most viable, low-cost ideas.
* Reflection: *"What are the biggest behavioral challenges we will face when trying to enforce these water-saving rules?"*`
  },
  'communicative': {
    title: 'Communicative Language Teaching (CLT)',
    subtitle: 'CLT Model',
    colorClass: 'from-pink-500/10 to-rose-500/5 border-pink-200 text-rose-800',
    iconColor: 'text-rose-600',
    badgeColor: 'bg-rose-100 text-rose-800',
    bestFor: 'ESL/English speaking classes, conversational practice, role-plays, dialogue delivery, and communication skills.',
    description: 'An interactive approach focused on functional communication, information-gap tasks, and situational fluency. Students learn language by actively speaking and solving tasks collaboratively.',
    stages: [
      { name: '1. Warm-Up & Presentation', duration: '5-10 mins', desc: 'Present real-life scenarios or dialogs with core language structures.' },
      { name: '2. Scaffolded Interaction', duration: '10-15 mins', desc: 'Pair/group drills, matching exercises, or vocabulary scaffolds.' },
      { name: '3. Communicative Production', duration: '15-20 mins', desc: 'Fluent role-plays, debates, or solving communication games organically.' },
      { name: '4. Feedback & Systems Recoil', duration: '5 mins', desc: 'Teacher highlights performance success and reviews pronunciation/errors.' }
    ],
    sampleSnippet: `# LESSON PLAN: ORDERING FOOD IN A RESTAURANT (CLT)

## 1. COMMUNICATIVE WARM-UP (10 mins)
* Show students a menu. Ask: *"What is your favorite dish here? How do you ask a waiter politely?"*
* Roleplay a brief, funny "bad waiter" dialogue to capture attention and hook interest.

## 2. SCAFFOLDED INTERACTION (15 mins)
* **Activity:** Information-gap roleplay. Student A has the menu items but no prices. Student B has prices.
* Students must ask each other: *"How much does the classic beef burger cost?"* to fill in their blanks.

## 3. COMMUNICATIVE PRODUCTION (15 mins)
* **Free Practice:** Create "Table Teams" of 4. One is the waiter, three are diners.
* Diners are given "Secret Dining Goals" (e.g. you are extremely picky, you are on a tight budget, or you are celebrating a birthday).
* Teams role-play ordering an entire meal organically, negotiating preferences using fluent English.

## 4. FEEDBACK & RE-SYSTEMATIZATION (5 mins)
* Highlight excellent polite phrases observed (e.g., "I would highly recommend...", "Could we please have...").
* Review common pronunciation slip-ups on the board.`
  },
  'audio-lingual': {
    title: 'Audio-Lingual Method (ALM)',
    subtitle: 'ALM Drill',
    colorClass: 'from-purple-500/10 to-indigo-500/5 border-purple-200 text-purple-800',
    iconColor: 'text-purple-600',
    badgeColor: 'bg-purple-100 text-purple-800',
    bestFor: 'Grammar mechanics, vocabulary acquisition, pronunciation drilling, and rote structural habit-formation.',
    description: 'A classic behaviorist model focusing on rapid oral repetition, dialogue imitation, and systematic grammar substitution drills to develop automatic reflex responses.',
    stages: [
      { name: '1. Dialogue Audition & Choral Repetition', duration: '10 mins', desc: 'Choral and individual repetition of a model conversation.' },
      { name: '2. Substitution & Expansion Drills', duration: '15 mins', desc: 'Teacher prompt followed by automatic student structural substitution.' },
      { name: '3. Dialogue Personalization', duration: '10 mins', desc: 'Pair repetition adapting nouns/adjectives of the conversation.' },
      { name: '4. Structural Summary', duration: '5 mins', desc: 'Quick rule overview and a rapid oral review exit ticket.' }
    ],
    sampleSnippet: `# LESSON PLAN: USING PAST TENSE REGULAR VERBS (ALM)

## 1. DIALOGUE REPETITION (10 mins)
* **Model Dialogue:**
  * Teacher: *"Yesterday, I walked to school."* -> Class repeats.
  * Teacher: *"She cooked dinner."* -> Class repeats.
* Run rhythmic, high-energy choral drills, then point to individual students for instant recall.

## 2. SUBSTITUTION DRILLS (15 mins)
* **Prompt & Response Drilling:**
  * Teacher: *"I watched a movie."* (Change to 'listen')
  * Class: *"I listened to a movie."* (Prompt: 'music')
  * Class: *"I listened to music."* (Prompt: 'they')
  * Class: *"They listened to music."*
* Maintain a rapid pace, correcting pronunciation on-the-spot without complex grammatical explanations.

## 3. DIALOGUE PERSONALIZATION (10 mins)
* In pairs, students practice a short past-tense script, substituting their own real weekend activities: *"On Saturday, I [played football] and [helped my parents]."*

## 4. STRUCTURE SUMMARY (5 mins)
* Recap the simple "-ed" rule. Lead a final rapid-fire round of verbs where students call out the past tense form instantly.`
  },
  'task-based': {
    title: 'Task-Based Language Teaching (TBLT)',
    subtitle: 'TBLT Model',
    colorClass: 'from-cyan-500/10 to-blue-500/5 border-cyan-200 text-cyan-800',
    iconColor: 'text-cyan-600',
    badgeColor: 'bg-cyan-100 text-cyan-800',
    bestFor: 'Functional fluency, written essays, project organization, collaborative problem solving, and practical language utility.',
    description: 'An outcomes-oriented framework where students complete a concrete, real-world task. Language is acquired as a tool to accomplish a project or solve a functional problem.',
    stages: [
      { name: '1. Pre-Task Schema Activation', duration: '5-10 mins', desc: 'Introduce the task, explain rules, and review essential helper phrases.' },
      { name: '2. Task Cycle & Team Work', duration: '20 mins', desc: 'Pairs or teams execute the task, creating a plan, design, or report.' },
      { name: '3. Planning & Class Presentation', duration: '10 mins', desc: 'Groups present outcomes or write findings on the board.' },
      { name: '4. Language Focus & Reflection', duration: '5 mins', desc: 'Direct study of specific vocabulary or grammar used during the task.' }
    ],
    sampleSnippet: `# LESSON PLAN: PLANNING A WONDERFUL SAFARI ITINERARY

## 1. PRE-TASK SCHEMA ACTIVATION (10 mins)
* Introduce the goal: *"Design a budget-friendly 3-day tourist safari to Maasai Mara or Amboseli. You have only $500."*
* Write useful travel phrases on the chalkboard: *"We should allocate...", "It is highly recommended that we...", "Our next destination is..."*

## 2. THE TASK CYCLE (20 mins)
* **Teamwork:** In groups of three, students act as "Tour Guides".
* They use a brochure printout to select accommodation, game drive schedules, and meals, keeping a ledger and writing down a 3-day itinerary paragraph.

## 3. PRESENTATION (10 mins)
* Each group acts as a "Travel Agent" pitching their safari plan to the class.
* The class votes on the most exciting yet affordable itinerary.

## 4. LANGUAGE FOCUS & DISCUSSION (5 mins)
* Teacher reviews sentences from the itineraries, highlighting correct preposition usages (e.g., "travel by van", "arrive at the gate", "stay in a camp").`
  },
  'clil': {
    title: 'Content and Language Integrated Learning (CLIL)',
    subtitle: 'CLIL Model',
    colorClass: 'from-orange-500/10 to-amber-500/5 border-orange-200 text-orange-800',
    iconColor: 'text-orange-600',
    badgeColor: 'bg-orange-100 text-orange-800',
    bestFor: 'Cross-curricular subjects, teaching science/history in English, cognitive academic language proficiency (CALP), and bilingual education.',
    description: 'A dual-focused approach where students learn a non-linguistic subject (like biology, geography, or history) using English as the medium of instruction.',
    stages: [
      { name: '1. Dual-Focus Introduction', duration: '10 mins', desc: 'Introduce the content topic alongside specialized language/grammar scaffolds.' },
      { name: '2. Cognitive Input Processing', duration: '15 mins', desc: 'Read labeled schematics, structures, or passages with guided questions.' },
      { name: '3. Concept Production & Jigsaw', duration: '15 mins', desc: 'Active student tasks explaining content concepts to peers in English.' },
      { name: '4. Cultural Connection & Check', duration: '5 mins', desc: 'Formative quiz on content mastery and specialized language accuracy.' }
    ],
    sampleSnippet: `# LESSON PLAN: THE CELL STRUCTURE & ORGANELLES (CLIL Biology)

## 1. DUAL-FOCUS INTRODUCTION (10 mins)
* **Content:** Identify eukaryotic cell organelles.
* **Language:** Practice descriptive comparison verbs (e.g., "acts as...", "is surrounded by...", "is responsible for...").

## 2. COGNITIVE INPUT PROCESSING (15 mins)
* Display a highly detailed labeled diagram of a Plant Cell.
* Guided Reading: Students read short cards on the Structure and Function of the nucleus, ER, and Golgi apparatus.
* Fill in a table identifying organelle names and their specific mechanical functions.

## 3. CONCEPT PRODUCTION (15 mins)
* **Activity - Jigsaw Roleplay:** Each student represents a cell organelle.
* They must explain their role to a partner: *"I am the Nucleus. I act as the brain of the cell because I store DNA. What do you do?"*

## 4. CONCEPTUAL EVALUATION (5 mins)
* Rapid oral quiz matching organelle structures to functions using the targeted descriptive sentence structures.`
  },
  'flipped-classroom': {
    title: 'Flipped Classroom Model',
    subtitle: 'Flipped Classroom',
    colorClass: 'from-sky-500/10 to-blue-500/5 border-sky-200 text-sky-850',
    iconColor: 'text-sky-600',
    badgeColor: 'bg-sky-100 text-sky-800',
    bestFor: 'Deep cognitive application, conceptual math, science problem-solving, and maximizing interactive class time.',
    description: 'Students learn primary introductory material prior to class (e.g., via readings or a pre-class video). Classroom time is fully repurposed for high-order collaboration, clearing misconceptions, working through tough problem-sets, and peer instruction.',
    stages: [
      { name: '1. Clarification & Pre-Check', duration: '5-10 mins', desc: 'Conduct a quick diagnostic check of pre-class content and clarify immediate student questions.' },
      { name: '2. Collaborative Application', duration: '20 mins', desc: 'Teams work on advanced problem solving or application projects with the teacher facilitating.' },
      { name: '3. Peer Coaching & Exchange', duration: '10 mins', desc: 'Students pair up to audit each other\'s answers, explaining their reasoning.' },
      { name: '4. Synthesis & Extension', duration: '5 mins', desc: 'Recap general trends and set up the next pre-class exploration task.' }
    ],
    sampleSnippet: `# LESSON PLAN: APPLYING THE PYTHAGOREAN THEOREM (FLIPPED CLASSROOM)

## 1. CLARIFICATION & DIAGNOSTIC PRE-CHECK (10 mins)
* **Pre-Class Task Done:** Students watched a 5-minute video at home demonstrating how $a^2 + b^2 = c^2$ applies to right-angled triangles.
* **Class Diagnostic:** Direct students to sketch a right-angled triangle with sides 3 and 4 on individual mini-whiteboards and write the calculation for the hypotenuse.
* Quick Scan: Check whiteboards. Clarify that the hypotenuse is ALWAYS the side opposite the 90-degree angle.

## 2. COLLABORATIVE APPLICATION CHALLENGE (20 mins)
* **Real-World Task:** In groups of four, students solve three localized structural challenges (e.g., *"A 10-meter ladder must safely reach a window that is 8 meters off the ground. How far from the wall should the base of the ladder be placed?"*).
* Teacher circulates as a consultant, prompting teams that get stuck to sketch the physical scenario.

## 3. PEER COACHING & AUDIT (10 mins)
* Group Jigsaw: Pair up members from different groups to compare calculations and explain their diagrammatic proofs.
* If answers differ, students must trace each other's arithmetic to find the calculation error.

## 4. SYNTHESIS & REFLECTION (5 mins)
* Conduct a rapid-fire class review of the answers. Ask: *"What happens if we forget to square the units?"*
* Preview the next flipped topic: Trigonometric Ratios.`
  },
  'project-based': {
    title: 'Project-Based Learning (PBL) Model',
    subtitle: 'Project-Based',
    colorClass: 'from-emerald-500/10 to-teal-500/5 border-emerald-200 text-emerald-800',
    iconColor: 'text-emerald-600',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    bestFor: 'Interdisciplinary learning, real-world practical skills, environmental studies, and collaborative team products.',
    description: 'An extended, active student-led framework. Students acquire deep subject-matter knowledge by actively researching and designing a tangible solution to a real-world, meaningful local problem.',
    stages: [
      { name: '1. Project Launch & Driving Question', duration: '10 mins', desc: 'Present a real-world local problem and spark curiosity with a clear, open-ended Driving Question.' },
      { name: '2. Investigative Research', duration: '15 mins', desc: 'Teams research raw data, look up guides, or interview campus observers.' },
      { name: '3. Prototyping & Design', duration: '20 mins', desc: 'Students design, sketch, write, or model their team\'s practical solution.' },
      { name: '4. Exhibition & Critique', duration: '10 mins', desc: 'Present prototypes to peers for systematic constructive feedback and iteration.' }
    ],
    sampleSnippet: `# LESSON PLAN: DESIGNING A CAMPUS LITTER REDUCTION PLAN (PBL)

## 1. PROJECT LAUNCH & THE DRIVING QUESTION (10 mins)
* **Driving Question:** *"How can we design an attractive, low-cost waste sorting station that increases plastic bottle recycling in our schoolyard by 50%?"*
* Hook: Project a photograph of the school yard after lunch showing loose plastic bottles scattered on the grass.

## 2. INVESTIGATIVE RESEARCH (15 mins)
* In teams of five, students investigate school yard waste zones.
* Teams count existing trash bin counts, inspect distance between bins, and draft a layout map of the "trash hotspots".

## 3. PROTOTYPING & SYSTEM DESIGN (20 mins)
* Teams sketch a blueprint or create a paper model of a "Smart Sorting Hub".
* The hub must feature clear, color-coded visual compartments, an engaging motivational slogan (e.g., "Feed the Recycling Monster!"), and a localized plan for collection.

## 4. EXHIBITION & PEER CRITIQUE (10 mins)
* **Gallery Walk Presentation:** Teams present their waste management station models.
* Peer reviewers write feedback on sticky notes using the format: *"I like [X], and I wonder if you could improve [Y]."*`
  },
  'game-based': {
    title: 'Game-Based Learning & Gamification',
    subtitle: 'Gamified Quest',
    colorClass: 'from-amber-500/10 to-yellow-500/5 border-amber-200 text-amber-900',
    iconColor: 'text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-800',
    bestFor: 'High-energy revision, interactive grammar or vocabulary, skill drills, and team-building peer competitions.',
    description: 'Embeds educational content inside a playful, highly structured game system. Features an engaging story narrative, multiple levels of increasing difficulty, clear checkpoint challenges, point rewards, and constructive feedback loops.',
    stages: [
      { name: '1. Quest Briefing & Rules', duration: '5 mins', desc: 'Establish the narrative, group students into Guilds/Teams, and explain score rules.' },
      { name: '2. Quest Level 1: Foundation Run', duration: '15 mins', desc: 'Guilds solve beginner-level puzzles to unlock essential clues and items.' },
      { name: '3. Quest Level 2: The Boss Battle', duration: '20 mins', desc: 'Guilds tackle a high-difficulty synthesis challenge, risking points for victory.' },
      { name: '4. Debriefing & Quest Celebration', duration: '10 mins', desc: 'Reveal team scores, crown victors, and connect game mechanics to curriculum goals.' }
    ],
    sampleSnippet: `# LESSON PLAN: GRAMMAR GUARDIANS - CONQUERING THE RUN-ON SENTENCE (GAME-BASED)

## 1. QUEST BRIEFING & RULES (5 mins)
* **Narrative:** The classroom has been taken over by the "Splicer Beast" who binds unrelated sentences with comma-splices, creating chaos! Only the "Grammar Guardians" can restore peace.
* **Guild Setup:** Divide class into Guilds of 4. Each Guild starts with 100 Health Points.

## 2. QUEST LEVEL 1: SOUND THE ALARM (15 mins)
* **Challenge:** Guilds receive a parchment with 5 sentences. They must identify which are healthy and which are infected with a comma-splice or run-on.
* Each correct identification earns 10 gold coins. Incorrect answers cost 5 Health Points.
* Guilds submit answers to the "Guild Master" (teacher) to earn Level 2 entry tickets.

## 3. QUEST LEVEL 2: THE BOSS BATTLE (20 mins)
* **Boss Monster Encounter:** Solve 3 complex run-on paragraphs. Guilds must correct them using three different methods (semicolons, conjunctions, or splitting into two sentences).
* **The Gamble:** Guilds can wager coins on their accuracy. Correct solutions double their coins!

## 4. DEBRIEF & CELEBRATION (10 mins)
* Review the 3 winning correction formulas on the board.
* Announce the highest-scoring Guilds. Award the "Scribe's Shield" badge.
* Reflection: *"Why does separating our thoughts make our stories more powerful to the reader?"*`
  },
  'phenomenon-based': {
    title: 'Phenomenon-Based Learning (PhenoBL)',
    subtitle: 'PhenoBL Model',
    colorClass: 'from-indigo-500/10 to-purple-500/5 border-indigo-200 text-indigo-800',
    iconColor: 'text-indigo-600',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    bestFor: 'Cross-curricular instruction, critical thinking, global citizenship, and holistic local environmental/social studies.',
    description: 'Inspired by progressive Nordic educational models, this pedagogy starts directly with an authentic real-world phenomenon rather than dry subject-level theory. Students formulate cross-disciplinary questions, research, and present multi-faceted solutions.',
    stages: [
      { name: '1. Phenomenon Observation', duration: '10 mins', desc: 'Observe and experience a complex real-world phenomenon. Elicit immediate observations.' },
      { name: '2. Multi-Subject Inquiry Mapping', duration: '10 mins', desc: 'Map out questions bridging Science, History, Math, and Language aspects.' },
      { name: '3. Collaborative Investigation', duration: '20 mins', desc: 'Students research mapped questions in teams, building a holistic concept.' },
      { name: '4. Interdisciplinary Dialogue', duration: '10 mins', desc: 'Present a integrated view of the phenomenon, followed by self-evaluation.' }
    ],
    sampleSnippet: `# LESSON PLAN: THE AMAZING RISE AND FALL OF THE DAILY BREAD (PhenoBL)

## 1. PHENOMENON OBSERVATION (10 mins)
* **The Phenomenon:** Fresh bread dough rising in a bowl, versus bread baking in an oven and its distinct pleasant aroma.
* Pass around real bread samples. Let students touch, smell, and observe the tiny air pockets in the bread texture. Elicit sensory words.

## 2. MULTI-SUBJECT INQUIRY MAPPING (10 mins)
* Brainstorm questions on the board across different disciplines:
  * *Biology:* What alive organism makes dough grow? (Yeast)
  * *Chemistry:* What gas is trapped in these tiny bubbles? (Carbon Dioxide)
  * *History/Social Studies:* How did yeast bread change ancient Egyptian society?
  * *Math:* If a loaf of bread doubles in volume every 30 minutes, what is the growth rate?

## 3. COLLABORATIVE INVESTIGATION (20 mins)
* In groups of four, students choose one of the brainstormed questions.
* Using handouts and resource books, teams research their topic and write a summary paragraph connecting their academic subject directly to the bread phenomenon.

## 4. INTERDISCIPLINARY DIALOGUE (10 mins)
* Join two groups together (e.g., Biology group meets History group).
* Students teach each other how yeast biological reactions enabled ancient civilizations to feed larger urban populations.`
  }
};

export default function DocumentCreator({ onBack, onGenerate, isGenerating, initialDraft }: DocumentCreatorProps) {
  const { aiLanguage } = useLanguage();
  const { activeLearnerProfile, learnerProfiles, setActiveLearnerProfile } = useAccessibility();
  const [curriculum, setCurriculum] = useState<CurriculumType>('cbc');
  const [docType, setDocType] = useState<DocumentType>('lesson-notes');
  const [lessonLayout, setLessonLayout] = useState<'default' | '5e-model' | 'direct-instruction' | 'inquiry-based' | 'communicative' | 'audio-lingual' | 'task-based' | 'clil' | 'flipped-classroom' | 'project-based' | 'game-based' | 'phenomenon-based'>('default');
  const [previewLayout, setPreviewLayout] = useState<'default' | '5e-model' | 'direct-instruction' | 'inquiry-based' | 'communicative' | 'audio-lingual' | 'task-based' | 'clil' | 'flipped-classroom' | 'project-based' | 'game-based' | 'phenomenon-based' | null>(null);
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [topic, setTopic] = useState('');
  const [subTopic, setSubTopic] = useState('');
  const [duration, setDuration] = useState('40 minutes');
  const [extraPrompt, setExtraPrompt] = useState('');
  const [explainLikeMasterTeacher, setExplainLikeMasterTeacher] = useState(true);
  const [askMentor, setAskMentor] = useState(false);
  const [mentorScaffoldingContext, setMentorScaffoldingContext] = useState<string>('');
  const [showMentorInfoTooltip, setShowMentorInfoTooltip] = useState(false);
  const [generateVocabulary, setGenerateVocabulary] = useState(false);
  const [generateDifferentiated, setGenerateDifferentiated] = useState(false);
  const [generateParental, setGenerateParental] = useState(false);
  const [generateDiagram, setGenerateDiagram] = useState(false);
  const [diagramType, setDiagramType] = useState<'flowchart' | 'concept-map'>('flowchart');
  const [enableSearchGrounding, setEnableSearchGrounding] = useState<boolean>(true);
  const [isGeneratingVocabulary, setIsGeneratingVocabulary] = useState(false);
  const [vocabularyError, setVocabularyError] = useState<string | null>(null);
  const [lessonsPerWeek, setLessonsPerWeek] = useState(5);
  const [weeksPerTerm, setWeeksPerTerm] = useState(10);
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [paperStyle, setPaperStyle] = useState<'ruled' | 'grid' | 'blank'>('ruled');
  const [penColor, setPenColor] = useState<'blue' | 'black'>('blue');
  const [handwritingIntensity, setHandwritingIntensity] = useState<number>(3);
  const [classicNotesImageModel, setClassicNotesImageModel] = useState<'emgen_fallback_nanobanana' | 'emgen' | 'nano banana'>('emgen_fallback_nanobanana');
  const [documentPageSize, setDocumentPageSize] = useState<'A4' | 'A5' | 'Letter' | 'Legal' | 'A3'>('A4');
  const [documentLength, setDocumentLength] = useState<'concise' | 'standard' | 'detailed' | 'comprehensive'>('standard');

  // Document Generation Progress State & Phases
  const [docGenerationProgress, setDocGenerationProgress] = useState<number>(0);
  const [docGenerationStep, setDocGenerationStep] = useState<number>(0);

  const documentGenerationPhases = [
    {
      title: 'Initializing Curriculum Framework',
      description: 'Analyzing curriculum guidelines, subject scope & targeted grade competencies...',
      detail: 'Configuring CBC / 8-4-4 pedagogical alignment'
    },
    {
      title: 'Structuring Instructional Architecture',
      description: 'Designing 5E lesson phases, core concepts & key inquiries...',
      detail: 'Organizing engaging entry hooks & learner activities'
    },
    {
      title: 'Synthesizing Exemplar Content & Notes',
      description: 'Writing rich master-teacher notes, examples & interactive prompts...',
      detail: 'Generating clear student explanations and step-by-step illustrations'
    },
    {
      title: 'Finalizing Assessments & Scaffolding',
      description: 'Integrating diagnostic questions, rubric criteria & mentor guidance...',
      detail: 'Conducting final pedagogical quality check & formatting document'
    }
  ];

  // Lesson Schedule Date & Time for Dashboard Calendar Integration
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pedagogical_scheduled_date_hint') || '';
    }
    return '';
  });
  const [scheduledTime, setScheduledTime] = useState<string>('08:00');

  // Question Bank Integration
  const [selectedQuestions, setSelectedQuestions] = useState<QuestionBankItem[]>([]);
  const [showQuestionBank, setShowQuestionBank] = useState(true);

  // Pacing Suggestion state
  const [isGeneratingPacing, setIsGeneratingPacing] = useState(false);
  const [pacingData, setPacingData] = useState<{
    title: string;
    totalDuration: string;
    pacingRationale: string;
    segments: Array<{
      durationRange: string;
      title: string;
      description: string;
      teacherRole: string;
      studentRole: string;
    }>;
  } | null>(null);
  const [pacingError, setPacingError] = useState<string | null>(null);

  // AI Rubric Generator state
  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);
  const [rubricObjectives, setRubricObjectives] = useState('');
  const [rubricError, setRubricError] = useState<string | null>(null);
  const [rubricData, setRubricData] = useState<{
    title: string;
    rubricMarkdown: string;
    criteria: Array<{
      criterion: string;
      description: string;
      levels: {
        exceeding: string;
        meeting: string;
        approaching: string;
        below: string;
      };
    }>;
  } | null>(null);

  // AI Citation Tool state
  const [readingComplexity, setReadingComplexity] = useState<'simple' | 'standard' | 'professional'>('standard');
  const [citationResourceType, setCitationResourceType] = useState<'book' | 'article' | 'website'>('book');
  const [citationStyle, setCitationStyle] = useState<'apa' | 'mla' | 'harvard'>('apa');
  const [citationAuthor, setCitationAuthor] = useState('');
  const [citationTitle, setCitationTitle] = useState('');
  const [citationSource, setCitationSource] = useState('');
  const [citationYear, setCitationYear] = useState('');
  const [citationRawInput, setCitationRawInput] = useState('');
  const [citationInputMode, setCitationInputMode] = useState<'structured' | 'quick'>('structured');
  const [isGeneratingCitation, setIsGeneratingCitation] = useState(false);
  const [generatedCitation, setGeneratedCitation] = useState('');
  const [citationError, setCitationError] = useState<string | null>(null);

  // Voice Dictation state
  const [activeMicField, setActiveMicField] = useState<'topic' | 'subTopic' | 'customSubject' | 'extraPrompt' | 'hub' | null>(null);
  const [micSupported, setMicSupported] = useState(false);
  const [dictationLang, setDictationLang] = useState<'en-US' | 'sw-KE'>('en-US');
  const [hubTranscription, setHubTranscription] = useState('');
  const recognitionRef = React.useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setMicSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const resultIndex = event.resultIndex;
        const transcript = event.results[resultIndex][0].transcript;
        
        if (recognitionRef.current && recognitionRef.current.targetField === 'topic') {
          setTopic(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
          });
        } else if (recognitionRef.current && recognitionRef.current.targetField === 'subTopic') {
          setSubTopic(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
          });
        } else if (recognitionRef.current && recognitionRef.current.targetField === 'customSubject') {
          setCustomSubject(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
          });
        } else if (recognitionRef.current && recognitionRef.current.targetField === 'extraPrompt') {
          setExtraPrompt(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
          });
        } else if (recognitionRef.current && recognitionRef.current.targetField === 'hub') {
          setHubTranscription(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setActiveMicField(null);
      };

      rec.onend = () => {
        setActiveMicField(null);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const toggleMic = (field: 'topic' | 'subTopic' | 'customSubject' | 'extraPrompt' | 'hub') => {
    if (!micSupported || !recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    if (activeMicField === field) {
      recognitionRef.current.stop();
      setActiveMicField(null);
    } else {
      if (activeMicField) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      recognitionRef.current.targetField = field;
      recognitionRef.current.lang = dictationLang;
      try {
        recognitionRef.current.start();
        setActiveMicField(field);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };
  
  // Tagging system state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  const handleAddCustomTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (selectedTags.includes(trimmed)) {
      setNewTagInput('');
      return;
    }
    setSelectedTags([...selectedTags, trimmed]);
    setNewTagInput('');
  };

  // Auto-recovery state and hook setup (saves current form state every 30 seconds to localStorage)
  const currentFormState = {
    curriculum,
    docType,
    lessonLayout,
    subject,
    customSubject,
    classLevel,
    topic,
    subTopic,
    duration,
    extraPrompt,
    explainLikeMasterTeacher,
    askMentor,
    generateVocabulary,
    generateDifferentiated,
    generateParental,
    generateDiagram,
    diagramType,
    lessonsPerWeek,
    weeksPerTerm,
    difficultyLevel,
    paperStyle,
    penColor,
    handwritingIntensity,
    classicNotesImageModel,
    documentPageSize,
    documentLength,
    selectedTags,
    selectedQuestions,
  };

  const hasContentCheck = React.useCallback((st: typeof currentFormState) => {
    if (!st) return false;
    return Boolean(
      (st.topic && st.topic.trim().length > 0) ||
      (st.subTopic && st.subTopic.trim().length > 0) ||
      (st.extraPrompt && st.extraPrompt.trim().length > 0) ||
      (st.customSubject && st.customSubject.trim().length > 0) ||
      (st.subject && st.subject.trim().length > 0 && st.subject !== 'Other') ||
      (st.selectedQuestions && st.selectedQuestions.length > 0) ||
      (st.selectedTags && st.selectedTags.length > 0)
    );
  }, []);

  const {
    recoveryData,
    showBanner: showRecoveryBanner,
    lastSavedTime,
    clearRecoveryData,
    saveNow,
    dismissBanner: dismissRecoveryBanner,
  } = useAutoRecovery(
    'edunexus_document_creator_autorecovery',
    currentFormState,
    hasContentCheck,
    30000 // 30 seconds auto-save interval
  );

  const [restoredToastMessage, setRestoredToastMessage] = useState<string | null>(null);

  const handleRestoreAutoRecovery = () => {
    if (!recoveryData || !recoveryData.formState) return;
    const st = recoveryData.formState;

    if (st.curriculum) setCurriculum(st.curriculum);
    if (st.docType) setDocType(st.docType);
    if (st.lessonLayout) setLessonLayout(st.lessonLayout);
    if (st.subject !== undefined) setSubject(st.subject);
    if (st.customSubject !== undefined) setCustomSubject(st.customSubject);
    if (st.classLevel !== undefined) setClassLevel(st.classLevel);
    if (st.topic !== undefined) setTopic(st.topic);
    if (st.subTopic !== undefined) setSubTopic(st.subTopic);
    if (st.duration !== undefined) setDuration(st.duration);
    if (st.extraPrompt !== undefined) setExtraPrompt(st.extraPrompt);
    if (st.explainLikeMasterTeacher !== undefined) setExplainLikeMasterTeacher(st.explainLikeMasterTeacher);
    if (st.askMentor !== undefined) setAskMentor(st.askMentor);
    if (st.generateVocabulary !== undefined) setGenerateVocabulary(st.generateVocabulary);
    if (st.generateDifferentiated !== undefined) setGenerateDifferentiated(st.generateDifferentiated);
    if (st.generateParental !== undefined) setGenerateParental(st.generateParental);
    if (st.generateDiagram !== undefined) setGenerateDiagram(st.generateDiagram);
    if (st.diagramType) setDiagramType(st.diagramType);
    if (st.lessonsPerWeek) setLessonsPerWeek(st.lessonsPerWeek);
    if (st.weeksPerTerm) setWeeksPerTerm(st.weeksPerTerm);
    if (st.difficultyLevel) setDifficultyLevel(st.difficultyLevel);
    if (st.paperStyle) setPaperStyle(st.paperStyle);
    if (st.penColor) setPenColor(st.penColor);
    if (st.handwritingIntensity) setHandwritingIntensity(st.handwritingIntensity);
    if (st.classicNotesImageModel) setClassicNotesImageModel(st.classicNotesImageModel);
    if (st.documentPageSize) setDocumentPageSize(st.documentPageSize);
    if (st.documentLength) setDocumentLength(st.documentLength);
    if (st.selectedTags) setSelectedTags(st.selectedTags);
    if (st.selectedQuestions) setSelectedQuestions(st.selectedQuestions);

    clearRecoveryData();
    setRestoredToastMessage('Form progress successfully restored from auto-saved session!');
    setTimeout(() => {
      setRestoredToastMessage(null);
    }, 4500);
  };

  // Undo / Redo Document Creator History Stack Engine
  const [formHistory, setFormHistory] = useState<Array<typeof currentFormState>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isRestoringHistoryRef = React.useRef<boolean>(false);
  const historyDebounceTimerRef = React.useRef<any>(null);

  // Apply a snapshot to state
  const applyFormSnapshot = React.useCallback((st: typeof currentFormState) => {
    if (!st) return;
    isRestoringHistoryRef.current = true;
    if (st.curriculum !== undefined) setCurriculum(st.curriculum);
    if (st.docType !== undefined) setDocType(st.docType);
    if (st.lessonLayout !== undefined) setLessonLayout(st.lessonLayout);
    if (st.subject !== undefined) setSubject(st.subject);
    if (st.customSubject !== undefined) setCustomSubject(st.customSubject);
    if (st.classLevel !== undefined) setClassLevel(st.classLevel);
    if (st.topic !== undefined) setTopic(st.topic);
    if (st.subTopic !== undefined) setSubTopic(st.subTopic);
    if (st.duration !== undefined) setDuration(st.duration);
    if (st.extraPrompt !== undefined) setExtraPrompt(st.extraPrompt);
    if (st.explainLikeMasterTeacher !== undefined) setExplainLikeMasterTeacher(st.explainLikeMasterTeacher);
    if (st.askMentor !== undefined) setAskMentor(st.askMentor);
    if (st.generateVocabulary !== undefined) setGenerateVocabulary(st.generateVocabulary);
    if (st.generateDifferentiated !== undefined) setGenerateDifferentiated(st.generateDifferentiated);
    if (st.generateParental !== undefined) setGenerateParental(st.generateParental);
    if (st.generateDiagram !== undefined) setGenerateDiagram(st.generateDiagram);
    if (st.diagramType !== undefined) setDiagramType(st.diagramType);
    if (st.lessonsPerWeek !== undefined) setLessonsPerWeek(st.lessonsPerWeek);
    if (st.weeksPerTerm !== undefined) setWeeksPerTerm(st.weeksPerTerm);
    if (st.difficultyLevel !== undefined) setDifficultyLevel(st.difficultyLevel);
    if (st.paperStyle !== undefined) setPaperStyle(st.paperStyle);
    if (st.penColor !== undefined) setPenColor(st.penColor);
    if (st.handwritingIntensity !== undefined) setHandwritingIntensity(st.handwritingIntensity);
    if (st.classicNotesImageModel !== undefined) setClassicNotesImageModel(st.classicNotesImageModel);
    if (st.documentPageSize !== undefined) setDocumentPageSize(st.documentPageSize);
    if (st.documentLength !== undefined) setDocumentLength(st.documentLength);
    if (st.selectedTags !== undefined) setSelectedTags(st.selectedTags);
    if (st.selectedQuestions !== undefined) setSelectedQuestions(st.selectedQuestions);
  }, []);

  // Monitor form state updates and push to history stack
  useEffect(() => {
    if (isRestoringHistoryRef.current) {
      isRestoringHistoryRef.current = false;
      return;
    }

    if (historyDebounceTimerRef.current) {
      clearTimeout(historyDebounceTimerRef.current);
    }

    historyDebounceTimerRef.current = setTimeout(() => {
      setFormHistory((prevHistory) => {
        if (prevHistory.length === 0) {
          setHistoryIndex(0);
          return [currentFormState];
        }

        const activeState = prevHistory[historyIndex];
        if (activeState && JSON.stringify(activeState) === JSON.stringify(currentFormState)) {
          return prevHistory;
        }

        const updatedHistory = [...prevHistory.slice(0, historyIndex + 1), currentFormState];
        if (updatedHistory.length > 50) {
          updatedHistory.shift();
        }
        setHistoryIndex(updatedHistory.length - 1);
        return updatedHistory;
      });
    }, 400);

    return () => {
      if (historyDebounceTimerRef.current) clearTimeout(historyDebounceTimerRef.current);
    };
  }, [currentFormState, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex >= 0 && historyIndex < formHistory.length - 1;

  const handleUndo = () => {
    if (!canUndo) return;
    const prevIndex = historyIndex - 1;
    const snapshot = formHistory[prevIndex];
    if (snapshot) {
      applyFormSnapshot(snapshot);
      setHistoryIndex(prevIndex);
    }
  };

  const handleRedo = () => {
    if (!canRedo) return;
    const nextIndex = historyIndex + 1;
    const snapshot = formHistory[nextIndex];
    if (snapshot) {
      applyFormSnapshot(snapshot);
      setHistoryIndex(nextIndex);
    }
  };

  const [globalQuickFormatToast, setGlobalQuickFormatToast] = useState<boolean>(false);

  const handleGlobalQuickFormat = () => {
    let modified = false;
    if (hubTranscription && hubTranscription.trim()) {
      setHubTranscription(quickFormatEducationalText(hubTranscription));
      modified = true;
    }
    if (extraPrompt && extraPrompt.trim()) {
      setExtraPrompt(quickFormatEducationalText(extraPrompt));
      modified = true;
    }
    if (rubricObjectives && rubricObjectives.trim()) {
      setRubricObjectives(quickFormatEducationalText(rubricObjectives));
      modified = true;
    }
    if (citationRawInput && citationRawInput.trim()) {
      setCitationRawInput(quickFormatEducationalText(citationRawInput));
      modified = true;
    }

    if (modified) {
      setGlobalQuickFormatToast(true);
      setTimeout(() => setGlobalQuickFormatToast(false), 3000);
    }
  };

  // Listen for Ctrl+Z and Ctrl+Y keyboard shortcuts
  useEffect(() => {
    const handleUndoRedoShortcuts = (e: KeyboardEvent) => {
      const activeElementTag = (document.activeElement?.tagName || '').toUpperCase();
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElementTag);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else if (!isInputFocused) {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (!isInputFocused) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleUndoRedoShortcuts);
    return () => window.removeEventListener('keydown', handleUndoRedoShortcuts);
  }, [canUndo, canRedo, historyIndex, formHistory, applyFormSnapshot]);
  
  const [tipIndex, setTipIndex] = useState(0);

  const { profile, systemPolicies } = useAuth();
  const [drafts, setDrafts] = useState<DocumentDraft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string>('');
  const [draftNameInput, setDraftNameInput] = useState<string>('');
  const [isSaveDraftModalOpen, setIsSaveDraftModalOpen] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Prompt Templates states
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateNameInput, setTemplateNameInput] = useState<string>('');
  const [templateDescInput, setTemplateDescInput] = useState<string>('');
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState<boolean>(false);
  const [templateSaveStatus, setTemplateSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeTemplateTab, setActiveTemplateTab] = useState<'built-in' | 'custom'>('built-in');
  const [selectedBuiltInId, setSelectedBuiltInId] = useState<string>('');

  // Load user drafts
  useEffect(() => {
    if (!profile?.uid) return;

    const draftsQuery = query(
      collection(db, 'drafts'),
      where('userId', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(
      draftsQuery,
      (snapshot) => {
        const fetchedDrafts: DocumentDraft[] = [];
        snapshot.forEach((dDoc) => {
          fetchedDrafts.push(dDoc.data() as DocumentDraft);
        });
        fetchedDrafts.sort((a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime());
        setDrafts(fetchedDrafts);
      },
      (err) => {
        console.error('Error fetching drafts:', err);
      }
    );

    return unsubscribe;
  }, [profile?.uid]);

  // Load user prompt templates
  useEffect(() => {
    if (!profile?.uid) return;

    const templatesQuery = query(
      collection(db, 'promptTemplates'),
      where('userId', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(
      templatesQuery,
      (snapshot) => {
        const fetchedTemplates: PromptTemplate[] = [];
        snapshot.forEach((tDoc) => {
          fetchedTemplates.push(tDoc.data() as PromptTemplate);
        });
        fetchedTemplates.sort((a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime());
        setTemplates(fetchedTemplates);
      },
      (err) => {
        console.error('Error fetching prompt templates:', err);
      }
    );

    return unsubscribe;
  }, [profile?.uid]);

  // Load initialDraft if passed from Dashboard
  useEffect(() => {
    if (initialDraft) {
      handleLoadDraft(initialDraft);
    }
  }, [initialDraft]);

  // Listen for global save keyboard shortcut (Ctrl+S)
  useEffect(() => {
    const handleGlobalSave = (e: Event) => {
      handleSaveDraft();
    };
    window.addEventListener('app-save', handleGlobalSave);
    return () => {
      window.removeEventListener('app-save', handleGlobalSave);
    };
  }, [
    profile?.uid,
    topic,
    draftNameInput,
    curriculum,
    docType,
    subject,
    customSubject,
    classLevel,
    subTopic,
    duration,
    extraPrompt,
    selectedDraftId
  ]);

  const handleLoadDraft = (draft: DocumentDraft) => {
    setCurriculum(draft.curriculum);
    setDocType(draft.docType);
    setSubject(draft.subject);
    setCustomSubject(draft.customSubject || '');
    setClassLevel(draft.classLevel);
    setTopic(draft.topic);
    setSubTopic(draft.subTopic || '');
    setDuration(draft.duration || '40 minutes');
    setExtraPrompt(draft.extraPrompt || '');
    setExplainLikeMasterTeacher(draft.explainLikeMasterTeacher ?? true);
    setAskMentor(draft.askMentor ?? false);
    if ((draft as any).mentorScaffoldingContext) {
      setMentorScaffoldingContext((draft as any).mentorScaffoldingContext);
    } else {
      setMentorScaffoldingContext('');
    }
    setGenerateVocabulary(draft.generateVocabulary ?? false);
    setGenerateDifferentiated(draft.generateDifferentiated ?? false);
    setGenerateParental(draft.generateParental ?? false);
    setGenerateDiagram(draft.generateDiagram ?? false);
    setDiagramType(draft.diagramType || 'flowchart');
    if (draft.lessonsPerWeek) setLessonsPerWeek(draft.lessonsPerWeek);
    if (draft.weeksPerTerm) setWeeksPerTerm(draft.weeksPerTerm);
    setSelectedTags(draft.tags || []);
    if (draft.lessonLayout) setLessonLayout(draft.lessonLayout);
    setDifficultyLevel(draft.difficultyLevel || 'intermediate');
    if (draft.paperStyle) setPaperStyle(draft.paperStyle);
    if (draft.penColor) setPenColor(draft.penColor);
    if (draft.handwritingIntensity) setHandwritingIntensity(draft.handwritingIntensity);
    if (draft.classicNotesImageModel) setClassicNotesImageModel(draft.classicNotesImageModel);
    if (draft.documentPageSize) setDocumentPageSize(draft.documentPageSize);
    if (draft.documentLength) setDocumentLength(draft.documentLength);
    if (draft.scheduledDate) setScheduledDate(draft.scheduledDate);
    if (draft.scheduledTime) setScheduledTime(draft.scheduledTime);

    setSelectedDraftId(draft.id);
    setDraftNameInput(draft.draftName);
  };

  const handleSaveDraft = async () => {
    if (!profile?.uid) {
      alert("You must be logged in to save drafts.");
      return;
    }

    if (!topic) {
      alert("Please enter a Topic before saving a draft.");
      return;
    }

    setSaveStatus('saving');
    try {
      const draftId = selectedDraftId || `draft-${Date.now()}`;
      const finalDraftName = draftNameInput.trim() || `Draft: ${topic} (${subject === 'Other' ? customSubject : subject})`;

      const draftData: DocumentDraft = {
        id: draftId,
        userId: profile.uid,
        curriculum,
        docType,
        subject,
        customSubject,
        classLevel,
        topic,
        subTopic,
        duration,
        extraPrompt,
        explainLikeMasterTeacher,
        askMentor: askMentor || false,
        mentorScaffoldingContext: askMentor ? mentorScaffoldingContext : undefined,
        generateVocabulary: generateVocabulary || false,
        generateDifferentiated: generateDifferentiated || false,
        generateParental: generateParental || false,
        generateDiagram: generateDiagram || false,
        diagramType: generateDiagram ? diagramType : undefined,
        lessonsPerWeek: docType === 'scheme-of-work' ? lessonsPerWeek : undefined,
        weeksPerTerm: docType === 'scheme-of-work' ? weeksPerTerm : undefined,
        lastSaved: new Date().toISOString(),
        draftName: finalDraftName,
        tags: selectedTags,
        lessonLayout: (docType === 'lesson-plan' || docType === 'lesson-notes' || docType === 'lesson-notes-classic') ? lessonLayout : undefined,
        difficultyLevel,
        paperStyle: docType === 'lesson-notes-classic' ? paperStyle : undefined,
        penColor: docType === 'lesson-notes-classic' ? penColor : undefined,
        handwritingIntensity: docType === 'lesson-notes-classic' ? handwritingIntensity : undefined,
        classicNotesImageModel: (docType === 'lesson-notes-classic' ? classicNotesImageModel : undefined) as any,
        documentPageSize,
        documentLength,
        scheduledDate: scheduledDate || undefined,
        scheduledTime: scheduledDate ? (scheduledTime || '08:00') : undefined
      };

      await setDoc(doc(db, 'drafts', draftId), cleanUndefined(draftData));
      setSelectedDraftId(draftId);
      setSaveStatus('success');
      clearRecoveryData();
      saveNow();
      setTimeout(() => {
        setIsSaveDraftModalOpen(false);
        setSaveStatus('idle');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving draft:', err);
      setSaveStatus('error');
      try {
        handleFirestoreError(err, OperationType.WRITE, `drafts`);
      } catch (e) {
        // Prevent throwing unhandled promise rejections directly in render loops
      }
    }
  };

  const handleDeleteDraft = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this draft?")) return;

    try {
      await deleteDoc(doc(db, 'drafts', draftId));
      if (selectedDraftId === draftId) {
        handleClearForm();
      }
    } catch (err) {
      console.error('Error deleting draft:', err);
      try {
        handleFirestoreError(err, OperationType.DELETE, `drafts/${draftId}`);
      } catch (e) {}
    }
  };

  const handleLoadTemplate = (template: PromptTemplate) => {
    setDocType(template.docType);
    setCurriculum(template.curriculum);
    setExtraPrompt(template.extraPrompt);
    setExplainLikeMasterTeacher(template.explainLikeMasterTeacher);
    setAskMentor(template.askMentor);
    setGenerateVocabulary(template.generateVocabulary ?? false);
    setGenerateDifferentiated(template.generateDifferentiated ?? false);
    setGenerateParental(template.generateParental ?? false);
    setGenerateDiagram(template.generateDiagram ?? false);
    setDiagramType(template.diagramType || 'flowchart');
    setSelectedTemplateId(template.id);
    setSelectedBuiltInId('');
  };

  const handleLoadBuiltInTemplate = (template: typeof BUILT_IN_TEMPLATES[0]) => {
    setDocType(template.docType);
    setCurriculum(template.curriculum);
    setExtraPrompt(template.extraPrompt);
    setExplainLikeMasterTeacher(template.explainLikeMasterTeacher);
    setAskMentor(template.askMentor);
    setGenerateVocabulary(template.generateVocabulary ?? false);
    setGenerateDifferentiated(template.generateDifferentiated ?? false);
    setGenerateParental(template.generateParental ?? false);
    setGenerateDiagram(template.generateDiagram ?? false);
    setDiagramType(template.diagramType || 'flowchart');
    setSelectedBuiltInId(template.id);
    setSelectedTemplateId('');
  };

  const handleSaveTemplate = async () => {
    if (!profile?.uid) {
      alert("You must be logged in to save templates.");
      return;
    }

    if (!templateNameInput.trim()) {
      alert("Please enter a template name.");
      return;
    }

    setTemplateSaveStatus('saving');
    try {
      const templateId = selectedTemplateId || `template-${Date.now()}`;
      
      const templateData: PromptTemplate = {
        id: templateId,
        userId: profile.uid,
        templateName: templateNameInput.trim(),
        description: templateDescInput.trim(),
        docType,
        curriculum,
        extraPrompt,
        explainLikeMasterTeacher,
        askMentor,
        generateVocabulary,
        generateDifferentiated: generateDifferentiated || false,
        generateParental: generateParental || false,
        generateDiagram: generateDiagram || false,
        diagramType: generateDiagram ? diagramType : undefined,
        lastSaved: new Date().toISOString()
      };

      await setDoc(doc(db, 'promptTemplates', templateId), cleanUndefined(templateData));
      setSelectedTemplateId(templateId);
      setTemplateSaveStatus('success');
      setTimeout(() => {
        setIsSaveTemplateModalOpen(false);
        setTemplateSaveStatus('idle');
        setTemplateNameInput('');
        setTemplateDescInput('');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving template:', err);
      setTemplateSaveStatus('error');
    }
  };

  const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this prompt template?")) return;

    try {
      await deleteDoc(doc(db, 'promptTemplates', templateId));
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId('');
      }
    } catch (err) {
      console.error('Error deleting prompt template:', err);
    }
  };

  const handleClearForm = () => {
    setSelectedDraftId('');
    setDraftNameInput('');
    setSelectedTemplateId('');
    setSelectedBuiltInId('');
    setCurriculum('cbc');
    setDocType('lesson-notes');
    setSubject('');
    setCustomSubject('');
    const defaultGrades = GRADE_OPTIONS_CBC;
    setClassLevel(defaultGrades[3] || '');
    setTopic('');
    setSubTopic('');
    setDuration('40 minutes');
    setExtraPrompt('');
    setExplainLikeMasterTeacher(true);
    setAskMentor(false);
    setMentorScaffoldingContext('');
    setGenerateVocabulary(false);
    setGenerateDifferentiated(false);
    setGenerateParental(false);
    setGenerateDiagram(false);
    setDiagramType('flowchart');
    setLessonsPerWeek(5);
    setWeeksPerTerm(10);
    setSelectedTags([]);
    setPacingData(null);
    setPacingError(null);
    setScheduledDate('');
    setScheduledTime('08:00');
    localStorage.removeItem('pedagogical_scheduled_date_hint');
    clearRecoveryData();
  };

  const handleGenerateVocabulary = async () => {
    if (!topic.trim()) {
      alert("Please enter a Topic before generating vocabulary.");
      return;
    }

    setIsGeneratingVocabulary(true);
    setVocabularyError(null);

    try {
      const response = await fetch('/api/generate-vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          subject: subject === 'Other' ? customSubject : subject,
          classLevel,
          curriculum,
          language: aiLanguage,
        }),
      });

      const data = await handleResponseJson(response, 'Failed to extract vocabulary.');
      
      const vocabText = data.vocabulary;
      if (vocabText) {
        setExtraPrompt((prev) => {
          const trimmed = prev.trim();
          if (trimmed) {
            return `${trimmed}\n\n${vocabText}`;
          }
          return vocabText;
        });
      }
    } catch (err: any) {
      console.error(err);
      setVocabularyError(err.message || 'An error occurred while generating vocabulary.');
    } finally {
      setIsGeneratingVocabulary(false);
    }
  };

  const handleSuggestPacing = async () => {
    if (!topic.trim()) {
      alert("Please enter a Topic before requesting pacing suggestions.");
      return;
    }

    setIsGeneratingPacing(true);
    setPacingError(null);

    try {
      const response = await fetch('/api/suggest-pacing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          subTopic,
          duration,
          subject: subject === 'Other' ? customSubject : subject,
          classLevel,
          curriculum,
          language: aiLanguage,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to suggest pacing.');
      }

      const data = await response.json();
      if (data.pacing) {
        setPacingData(data.pacing);
      } else {
        throw new Error('No pacing guide was returned by the model.');
      }
    } catch (err: any) {
      console.error(err);
      setPacingError(err.message || 'An error occurred while suggesting pacing.');
    } finally {
      setIsGeneratingPacing(false);
    }
  };

  const handleApplyPacingToInstructions = () => {
    if (!pacingData) return;

    let pacingText = `\n\n[Suggested Pacing breakdown for ${pacingData.totalDuration}]:`;
    pacingData.segments.forEach((seg, idx) => {
      pacingText += `\n- Segment ${idx + 1} (${seg.durationRange}): ${seg.title}. Activity: ${seg.description}. Teacher Focus: ${seg.teacherRole}. Student Actions: ${seg.studentRole}.`;
    });
    pacingText += `\nPedagogical Rationale: ${pacingData.pacingRationale}`;

    setExtraPrompt((prev) => {
      const trimmed = prev.trim();
      if (trimmed) {
        return `${trimmed}${pacingText}`;
      }
      return pacingText.trim();
    });
  };

  const handlePullObjectives = () => {
    let text = `Learners should be able to:\n`;
    const cleanTopic = topic.trim();
    const cleanSubTopic = subTopic.trim();
    if (cleanTopic) {
      text += `1. Understand and explain key concepts under the topic of ${cleanTopic}\n`;
    }
    if (cleanSubTopic) {
      text += `2. Demonstrate a clear understanding and apply principles related to ${cleanSubTopic}\n`;
    }
    if (!cleanTopic && !cleanSubTopic) {
      text = `Learners should be able to:\n1. Explain the primary concepts introduced in the lesson\n2. Solve problems or complete tasks related to the lesson objectives`;
    }
    setRubricObjectives(text);
  };

  const handleGenerateRubric = async () => {
    if (!rubricObjectives.trim()) {
      alert("Please enter or generate some learning objectives first.");
      return;
    }

    setIsGeneratingRubric(true);
    setRubricError(null);

    try {
      const response = await fetch('/api/generate-rubric', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          objectives: rubricObjectives,
          curriculum,
          subject: subject === 'Other' ? customSubject : subject,
          topic,
          classLevel,
          language: aiLanguage,
        }),
      });

      const data = await handleResponseJson(response, 'Failed to generate grading rubric.');
      if (data && data.rubricMarkdown && data.criteria) {
        setRubricData(data);
      } else {
        throw new Error('No valid grading rubric structure was returned.');
      }
    } catch (err: any) {
      console.error(err);
      setRubricError(err.message || 'An error occurred while generating the rubric.');
    } finally {
      setIsGeneratingRubric(false);
    }
  };

  const handleApplyRubricToInstructions = () => {
    if (!rubricData) return;

    const rubricText = `\n\n### ${rubricData.title}\n\n${rubricData.rubricMarkdown}`;

    setExtraPrompt((prev) => {
      const trimmed = prev.trim();
      if (trimmed) {
        return `${trimmed}${rubricText}`;
      }
      return rubricText.trim();
    });
    alert("Rubric successfully appended to Special Focus / Custom Instructions!");
  };

  const handleCopyRubric = () => {
    if (!rubricData) return;
    navigator.clipboard.writeText(`### ${rubricData.title}\n\n${rubricData.rubricMarkdown}`);
    alert("Rubric Markdown table copied to clipboard!");
  };

  const handleGenerateCitation = async () => {
    setIsGeneratingCitation(true);
    setCitationError(null);
    setGeneratedCitation('');

    try {
      const response = await fetch('/api/generate-citation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceType: citationResourceType,
          style: citationStyle,
          author: citationInputMode === 'structured' ? citationAuthor : '',
          title: citationInputMode === 'structured' ? citationTitle : '',
          source: citationInputMode === 'structured' ? citationSource : '',
          year: citationInputMode === 'structured' ? citationYear : '',
          rawInput: citationInputMode === 'quick' ? citationRawInput : '',
        }),
      });

      const data = await handleResponseJson(response, 'Failed to generate academic citation.');
      if (data && data.citation) {
        setGeneratedCitation(data.citation);
      } else {
        throw new Error('No citation text was returned from the server.');
      }
    } catch (err: any) {
      console.error(err);
      setCitationError(err.message || 'An error occurred while generating the citation.');
    } finally {
      setIsGeneratingCitation(false);
    }
  };

  const handleApplyCitationToInstructions = () => {
    if (!generatedCitation) return;

    const citationText = `\n\nAcademic Reference [${citationStyle.toUpperCase()}]: ${generatedCitation}`;

    setExtraPrompt((prev) => {
      const trimmed = prev.trim();
      if (trimmed) {
        return `${trimmed}${citationText}`;
      }
      return citationText.trim();
    });
    alert("Citation successfully appended to Special Focus / Custom Instructions!");
  };

  const handleCopyCitation = () => {
    if (!generatedCitation) return;
    navigator.clipboard.writeText(generatedCitation);
    alert("Citation copied to clipboard!");
  };

  // Cycle through loading tips and increment progress
  useEffect(() => {
    let intervalId: any;
    let progressTimer: any;
    if (isGenerating) {
      setDocGenerationProgress(6);
      setDocGenerationStep(0);
      intervalId = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
      }, 3500);
      progressTimer = setInterval(() => {
        setDocGenerationProgress(prev => {
          if (prev >= 96) return 96;
          const next = prev + Math.floor(Math.random() * 5) + 3;
          const bounded = Math.min(next, 96);
          if (bounded >= 75) setDocGenerationStep(3);
          else if (bounded >= 50) setDocGenerationStep(2);
          else if (bounded >= 25) setDocGenerationStep(1);
          else setDocGenerationStep(0);
          return bounded;
        });
      }, 350);
    } else {
      setTipIndex(0);
      setDocGenerationProgress(0);
      setDocGenerationStep(0);
    }
    return () => {
      clearInterval(intervalId);
      clearInterval(progressTimer);
    };
  }, [isGenerating]);

  // Handle grade defaults on curriculum switch
  useEffect(() => {
    const defaultGrades = curriculum === 'cbc' ? GRADE_OPTIONS_CBC : GRADE_OPTIONS_STANDARD;
    setClassLevel(defaultGrades[3] || ''); // Default to Grade 1
  }, [curriculum]);

  // Handle CBC lessons allocation and scheduling defaults automatically
  useEffect(() => {
    if (curriculum === 'cbc') {
      const targetSub = subject === 'Other' ? customSubject : subject;
      if (targetSub) {
        const details = getCbcLessonDetails(classLevel, targetSub);
        setLessonsPerWeek(details.lessonsPerWeek);
        if (details.isStem) {
          setDuration("Double Lesson (80 mins)");
        } else {
          setDuration("40 minutes");
        }
      }
    }
  }, [curriculum, subject, customSubject, classLevel]);

  const triggerGeneration = () => {
    if (isGenerating) return;
    if (!subject || (subject === 'Other' && !customSubject)) {
      alert("Please select or enter a subject before generating.");
      return;
    }
    if (!classLevel) {
      alert("Please select a Grade/Level before generating.");
      return;
    }
    if (!topic) {
      alert("Please enter a Topic before generating.");
      return;
    }

    let finalExtraPrompt = extraPrompt;
    if (askMentor && mentorScaffoldingContext.trim()) {
      finalExtraPrompt += `\n\nPEDAGOGICAL SCAFFOLDING & CLASS NEEDS (ASK MENTOR):\n${mentorScaffoldingContext.trim()}\n(Note to AI: Apply this pedagogical scaffolding prompt to tailor the document generation specifically for the class needs described above.)`;
    }
    if (selectedQuestions.length > 0) {
      finalExtraPrompt += "\n\nCRITICAL ASSESSMENT REPOSITORY INTEGRATION: You MUST include the following specific questions from the Question Bank into the generated document's assessment/quiz/exercises section, formatting them beautifully for classroom use:\n" + 
        selectedQuestions.map((q, idx) => {
          let text = `${idx + 1}. [${q.type.toUpperCase()}] ${q.questionText}`;
          if (q.options && q.options.length > 0) {
            text += `\nOptions:\n` + q.options.map((opt, oIdx) => `   - ${String.fromCharCode(65 + oIdx)}: ${opt}`).join('\n');
          }
          if (q.correctAnswer) {
            text += `\nCorrect Answer: ${q.correctAnswer}`;
          }
          if (q.explanation) {
            text += `\nExplanation/Feedback: ${q.explanation}`;
          }
          return text;
        }).join('\n\n');
    }

    clearRecoveryData();

    onGenerate({
      docType,
      curriculum,
      subject: subject === 'Other' ? customSubject : subject,
      classLevel,
      topic,
      subTopic,
      duration,
      extraPrompt: finalExtraPrompt,
      explainLikeMasterTeacher: systemPolicies?.forceMasterTeacherMode ? true : explainLikeMasterTeacher,
      askMentor,
      generateVocabulary,
      generateDifferentiated,
      generateParental,
      generateDiagram,
      diagramType: generateDiagram ? diagramType : undefined,
      lessonsPerWeek: docType === 'scheme-of-work' ? lessonsPerWeek : undefined,
      weeksPerTerm: docType === 'scheme-of-work' ? weeksPerTerm : undefined,
      tags: selectedTags,
      lessonLayout: (docType === 'lesson-plan' || docType === 'lesson-notes' || docType === 'lesson-notes-classic') ? lessonLayout : undefined,
      learnerProfile: activeLearnerProfile,
      difficultyLevel,
      readingComplexity,
      paperStyle: docType === 'lesson-notes-classic' ? paperStyle : undefined,
      penColor: docType === 'lesson-notes-classic' ? penColor : undefined,
      handwritingIntensity: docType === 'lesson-notes-classic' ? handwritingIntensity : undefined,
      classicNotesImageModel: (docType === 'lesson-notes-classic' ? classicNotesImageModel : undefined) as any,
      documentPageSize,
      documentLength,
      enableSearchGrounding,
      scheduledDate: scheduledDate || undefined,
      scheduledTime: scheduledDate ? (scheduledTime || '08:00') : undefined
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    triggerGeneration();
  };

  const handleKeyboardSave = () => {
    if (!profile?.uid) {
      alert("You must be logged in to save drafts.");
      return;
    }
    if (!topic) {
      alert("Please enter a Topic before saving a draft.");
      return;
    }
    if (!draftNameInput) {
      setDraftNameInput(`Draft: ${topic} (${subject === 'Other' ? customSubject : subject})`);
    }
    setIsSaveDraftModalOpen(true);
    handleSaveDraft();
  };

  // Keyboard Shortcuts Hook for Ctrl+S and Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleKeyboardSave();
      } else if (isCtrl && e.key === 'Enter') {
        e.preventDefault();
        triggerGeneration();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    profile, topic, subject, customSubject, classLevel, docType, curriculum, subTopic, duration, extraPrompt,
    explainLikeMasterTeacher, askMentor, generateVocabulary, generateDifferentiated, generateParental,
    generateDiagram, diagramType, lessonsPerWeek, weeksPerTerm, selectedTags, lessonLayout, selectedDraftId,
    draftNameInput, isGenerating, onGenerate
  ]);

  const getDocTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'lesson-plan':
        return <FileText className="w-5 h-5" />;
      case 'scheme-of-work':
        return <BookOpen className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 document-creator-workspace module-workspace">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="flex flex-wrap items-center gap-2.5">
          {!isGenerating && (
            <div className="flex items-center gap-1 bg-white border border-slate-200/90 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  canUndo
                    ? 'text-slate-700 hover:bg-slate-100 hover:text-emerald-700 active:scale-95'
                    : 'text-slate-300 cursor-not-allowed opacity-40'
                }`}
                title="Undo last edit (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Undo</span>
              </button>

              <div className="h-4 w-[1px] bg-slate-200 my-auto" />

              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  canRedo
                    ? 'text-slate-700 hover:bg-slate-100 hover:text-emerald-700 active:scale-95'
                    : 'text-slate-300 cursor-not-allowed opacity-40'
                }`}
                title="Redo edit (Ctrl+Y or Ctrl+Shift+Z)"
              >
                <Redo2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Redo</span>
              </button>

              {formHistory.length > 1 && (
                <span className="text-[10px] text-slate-500 font-mono font-medium px-1.5 py-0.5 bg-slate-50 rounded-md border border-slate-150">
                  {historyIndex + 1}/{formHistory.length}
                </span>
              )}

              <div className="h-4 w-[1px] bg-slate-200 my-auto ml-0.5" />

              <button
                type="button"
                onClick={handleGlobalQuickFormat}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold transition cursor-pointer active:scale-95"
                title="Automatically format dictated or pasted text across all prompt fields with educational headings & lists"
              >
                <AlignLeft className="w-3.5 h-3.5 text-sky-600" />
                <span>Quick Format</span>
              </button>

              {globalQuickFormatToast && (
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md animate-fadeIn">
                  ✓ Formatted!
                </span>
              )}
            </div>
          )}

          {!isGenerating && (
            <button
              type="button"
              onClick={() => setShowQuestionBank(!showQuestionBank)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                showQuestionBank 
                  ? 'bg-[#5f6f52]/10 border-[#5f6f52]/20 text-[#5f6f52]' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{showQuestionBank ? 'Hide Question Bank' : 'Show Question Bank'}</span>
            </button>
          )}
          {!isGenerating && (
            <LastSavedTimestampIndicator
              lastSavedTime={lastSavedTime}
              onSaveNow={saveNow}
              isGenerating={isGenerating}
            />
          )}
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Curriculum-Aligned Generator
          </div>
        </div>
      </div>

      {isGenerating ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-8 sm:p-12 flex flex-col items-center justify-center min-h-[480px] max-w-3xl mx-auto my-6 relative overflow-hidden animate-fadeIn">
          {/* Subtle background glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#5f6f52]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Badge */}
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>EduNexus Pedagogical AI Engine</span>
          </div>

          {/* SVG Circular Progress Ring */}
          <div className="relative w-36 h-36 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90">
              {/* Outer Track */}
              <circle
                cx="72"
                cy="72"
                r="60"
                className="text-slate-150 stroke-current"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Animated Progress Circle */}
              <circle
                cx="72"
                cy="72"
                r="60"
                className="text-emerald-600 stroke-current transition-all duration-300 ease-out"
                strokeWidth="8"
                strokeDasharray={376.99}
                strokeDashoffset={376.99 - (376.99 * docGenerationProgress) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-slate-800 font-mono tracking-tight">
                {Math.round(docGenerationProgress)}%
              </span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mt-0.5">
                Generating
              </span>
            </div>
          </div>

          {/* Dynamic Active Stage Title & Subtitle */}
          <div className="text-center space-y-1 mb-6 max-w-lg">
            <h3 className="text-lg font-bold text-slate-850">
              {documentGenerationPhases[docGenerationStep]?.title || 'Generating Educational Material'}
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {documentGenerationPhases[docGenerationStep]?.description || 'Processing curriculum guidelines and generating structured material...'}
            </p>
          </div>

          {/* Linear Percentage Progress Bar */}
          <div className="w-full max-w-md space-y-2 mb-6">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
              <span>Overall Completion Status</span>
              <span className="font-mono text-emerald-700">{Math.round(docGenerationProgress)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 via-[#5f6f52] to-amber-500 rounded-full transition-all duration-300 shadow-xs"
                style={{ width: `${docGenerationProgress}%` }}
              />
            </div>
          </div>

          {/* Pipeline Stage Checklist */}
          <div className="w-full max-w-md bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 mb-6">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
              Generation Pipeline Stages:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {documentGenerationPhases.map((phase, pIdx) => {
                const isDone = docGenerationStep > pIdx;
                const isCurrent = docGenerationStep === pIdx;
                return (
                  <div
                    key={pIdx}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs border transition-all ${
                      isDone
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                        : isCurrent
                        ? 'bg-white border-emerald-400 text-slate-800 font-bold shadow-xs ring-1 ring-emerald-400/40'
                        : 'bg-white/60 border-slate-150 text-slate-400'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-400 animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isDone ? '✓' : pIdx + 1}
                    </div>
                    <span className="truncate text-[11px]">{phase.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Educational Tip Card */}
          <div className="bg-amber-50/90 rounded-2xl p-4 border border-amber-200/80 text-amber-950 max-w-md text-xs flex gap-3 shadow-2xs">
            <Lightbulb className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-amber-900">Did you know? (Pedagogical Tip):</span>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {LOADING_TIPS[tipIndex]}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          {/* Main creator form container */}
          <div className="flex-1 w-full space-y-6 max-w-4xl">
            {/* Auto-Recovery Success Notification Toast */}
            {restoredToastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-md flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
                  <span>{restoredToastMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRestoredToastMessage(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            {/* Auto-Recovery Prompt Banner for Interrupted Sessions */}
            {showRecoveryBanner && recoveryData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border border-amber-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-xl shrink-0 border border-amber-200/60 mt-0.5 sm:mt-0">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-amber-950">Interrupted Session Detected</h4>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded-full uppercase tracking-wider">
                          Auto-Saved Backup
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        We found unsaved form progress from a previous session saved on{' '}
                        <span className="font-semibold text-amber-950">
                          {new Date(recoveryData.timestamp).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                        . Would you like to restore it?
                      </p>
                      
                      {/* Summary details of the auto-saved session */}
                      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap text-[11px]">
                        {recoveryData.formState.topic && (
                          <span className="bg-amber-100/90 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-medium">
                            Topic: <strong className="font-bold">{recoveryData.formState.topic}</strong>
                          </span>
                        )}
                        {recoveryData.formState.subject && (
                          <span className="bg-amber-100/90 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-medium">
                            Subject: <strong className="font-bold">{recoveryData.formState.subject === 'Other' ? recoveryData.formState.customSubject : recoveryData.formState.subject}</strong>
                          </span>
                        )}
                        {recoveryData.formState.docType && (
                          <span className="bg-amber-100/90 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-medium capitalize">
                            Type: <strong className="font-bold">{recoveryData.formState.docType.replace('-', ' ')}</strong>
                          </span>
                        )}
                        {recoveryData.formState.selectedQuestions && recoveryData.formState.selectedQuestions.length > 0 && (
                          <span className="bg-amber-100/90 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-medium">
                            Questions: <strong className="font-bold">{recoveryData.formState.selectedQuestions.length} saved</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleRestoreAutoRecovery}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore Session
                    </button>
                    <button
                      type="button"
                      onClick={clearRecoveryData}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-amber-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={dismissRecoveryBanner}
                      className="p-1.5 text-amber-700 hover:text-amber-950 hover:bg-amber-100 rounded-lg transition"
                      title="Dismiss prompt"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Draft Manager Box */}
          {drafts.length > 0 && (
            <div className="bg-[#fcfbf7] border border-slate-200 rounded-2xl p-4 shadow-sm">
              <h3 className="text-xs font-extrabold text-[#5f6f52] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#5f6f52]" /> Continue where you left off ({drafts.length} drafts saved)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                {drafts.map((dr) => (
                  <div
                    key={dr.id}
                    onClick={() => handleLoadDraft(dr)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between group ${
                      selectedDraftId === dr.id
                        ? 'border-[#5f6f52] bg-[#5f6f52]/5 ring-1 ring-[#5f6f52]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="truncate flex-1 min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-800 truncate">{dr.draftName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Saved {new Date(dr.lastSaved).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteDraft(dr.id, e)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-slate-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      title="Delete Draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Template & Structure Library */}
          <div className="bg-[#fafbfc] border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-emerald-600" /> Template & Structure Library
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Select a predefined educational structure or load your custom saved templates.
                </p>
              </div>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTemplateTab('built-in')}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    activeTemplateTab === 'built-in'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🏫 Predefined Structures
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplateTab('custom')}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeTemplateTab === 'custom'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  ⭐ My Saved ({templates.length})
                </button>
              </div>
            </div>

            {activeTemplateTab === 'built-in' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[190px] overflow-y-auto pr-1">
                {BUILT_IN_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedBuiltInId === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => handleLoadBuiltInTemplate(tmpl)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all hover:shadow-xs flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500 shadow-xs'
                          : 'border-slate-200 hover:border-emerald-250 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{tmpl.templateName}</h4>
                          <span className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded shrink-0">
                            Built-in
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {tmpl.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-50">
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md">
                          {tmpl.docType.replace('-', ' ')}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 font-bold rounded-md">
                          {tmpl.curriculum === 'cbc' ? 'CBC' : 'Standard'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                {templates.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[190px] overflow-y-auto pr-1">
                    {templates.map((tmpl) => {
                      const isSelected = selectedTemplateId === tmpl.id;
                      return (
                        <div
                          key={tmpl.id}
                          onClick={() => handleLoadTemplate(tmpl)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all hover:shadow-xs flex flex-col justify-between group ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500 shadow-xs'
                              : 'border-slate-200 hover:border-emerald-250 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-bold text-slate-800 truncate">{tmpl.templateName}</h4>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0"
                                title="Delete Template"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {tmpl.description ? (
                              <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                {tmpl.description}
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic mt-1">No description.</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-50">
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md">
                              {tmpl.docType.replace('-', ' ')}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 font-bold rounded-md">
                              {tmpl.curriculum === 'cbc' ? 'CBC' : 'Standard'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 border border-dashed border-slate-200 rounded-xl bg-white">
                    <Bookmark className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-700">No Custom Templates Yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto leading-relaxed">
                      Configure your parameters below, then click <strong className="text-emerald-700">"Save as Reusable Template"</strong> to save your customized layout and instructions here!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-150 shadow-md overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-150 p-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5.5 h-5.5 text-emerald-500" /> New Material Generator
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select your parameters below to generate high-quality, professional-grade classroom documents.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* 1. Framework & Document Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Curriculum Framework</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCurriculum('cbc')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                      curriculum === 'cbc'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-semibold shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="text-sm font-bold">Kenyan CBC</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Competency Based</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurriculum('standard')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                      curriculum === 'standard'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-semibold shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="text-sm font-bold">Standard Syllabus</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Traditional Outcomes</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Document Category</label>
                <EditableSelect
                  value={docType}
                  onChange={(val) => setDocType(val as DocumentType)}
                  options={[
                    { value: "lesson-notes", label: "✏️ 1. Lesson Notes (Handwritten style)" },
                    { value: "lesson-notes-classic", label: "📖 Lesson Notes (Classic)" },
                    { value: "lesson-plan", label: "📚 2. Lesson Plan (Kenyan CBC/8-4-4 style)" },
                    { value: "scheme-of-work", label: "📅 3. Scheme of Work (Full Term progression)" },
                    { value: "worksheet", label: "📝 4. Student Worksheet (Bloom's Taxonomy & Key)" },
                    { value: "formative-assessment", label: "🎯 5. Formative Assessment (Exit tickets & Rubrics)" },
                    { value: "summative-assessment", label: "🏆 6. Summative Exam (Marking scheme & Blueprint)" },
                    { value: "pedagogy-advisor", label: "💡 7. Pedagogy Advisor (Teaching strategies & Inclusion)" }
                  ]}
                  placeholder=""
                  className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Learner Accommodation Profile Selection */}
            <div className="bg-[#f7f9f5] border border-emerald-100 rounded-xl p-4.5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-[#5f6f52] tracking-wider block">Adaptive Pedagogical Engine</span>
                  <label className="text-sm font-bold text-slate-850 flex items-center gap-1.5">
                    <span>Active Student Accommodation Profile</span>
                    <span className="bg-[#5f6f52]/10 text-[#5f6f52] text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                      ADAPTIVE AI
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-snug">The AI generator automatically reads this profile and customizes language, visual layouts, and checkpoints specifically for this accommodation.</p>
                </div>
                <EditableSelect
                  value={activeLearnerProfile}
                  onChange={setActiveLearnerProfile}
                  options={learnerProfiles.map(p => ({ value: p.id, label: `👤 ${p.name} (${p.type.toUpperCase()})` }))}
                  placeholder=""
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#5f6f52] shrink-0"
                />
              </div>

              {/* Quick visual confirmation of active profile accommodations */}
              {(() => {
                const activeProf = learnerProfiles.find(p => p.id === activeLearnerProfile);
                if (!activeProf) return null;
                return (
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#5f6f52] font-semibold bg-white px-3 py-2 border border-slate-100 rounded-lg">
                    <span className="opacity-80">ACTIVE RULESETS:</span>
                    <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[9px]">Font sizing: {activeProf.accommodations.fontSize}</span>
                    <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[9px]">Paragraph spacing: {activeProf.accommodations.lineSpacing}</span>
                    {activeProf.accommodations.useDyslexicFont && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[9px]">Dyslexic Typo Override</span>
                    )}
                    {activeProf.accommodations.simplifyVocabulary && (
                      <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[9px]">Vocabulary Scaffold</span>
                    )}
                    {activeProf.accommodations.includeChecklists && (
                      <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded text-[9px]">Milestones & Steps</span>
                    )}
                    {activeProf.accommodations.includeAudioCues && (
                      <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[9px]">Aural Prompt Assist</span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Difficulty Level & Instructional Depth Tuning */}
            <div className="bg-[#f0f4f8] border border-blue-100 rounded-xl p-4.5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider block">Instructional Cohort Tuning</span>
                  <label className="text-sm font-bold text-slate-850 flex items-center gap-1.5" id="difficulty-level-label">
                    <span>Target Difficulty Level</span>
                    <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                      COHORT DEPTH
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Adjusts vocabulary complexity, prerequisite depth, and the rigor of AI-generated content for different learner cohorts.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <EditableSelect
                    value={difficultyLevel}
                    onChange={(val) => setDifficultyLevel(val as 'beginner' | 'intermediate' | 'advanced')}
                    options={[
                      { value: "beginner", label: "🟢 Beginner / Remedial (Simplified)" },
                      { value: "intermediate", label: "🔵 Intermediate / Standard (Grade-Appropriate)" },
                      { value: "advanced", label: "🔴 Advanced / Gifted (Enriched & Rigorous)" }
                    ]}
                    placeholder=""
                    className="bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-850 focus:outline-none focus:border-blue-500 shrink-0 shadow-xs cursor-pointer"
                  />
                </div>
              </div>

              {/* Slider / Segmented Control visualization for premium feedback */}
              <div className="space-y-2">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Beginner</span>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Standard</span>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Advanced / Gifted</span>
                  </div>
                  <div className="flex h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        difficultyLevel === 'beginner' ? 'w-1/3 bg-emerald-500' : 
                        difficultyLevel === 'intermediate' ? 'w-2/3 bg-blue-500' : 'w-full bg-indigo-600'
                      }`}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-white border border-slate-100 p-3 rounded-lg flex items-start gap-2.5 shadow-2xs">
                  <span className="text-lg leading-none mt-0.5">
                    {difficultyLevel === 'beginner' && '🌱'}
                    {difficultyLevel === 'intermediate' && '📘'}
                    {difficultyLevel === 'advanced' && '🚀'}
                  </span>
                  <div>
                    <h5 className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider">
                      {difficultyLevel === 'beginner' && 'Beginner / Remedial Focus'}
                      {difficultyLevel === 'intermediate' && 'Standard Grade-Appropriate Focus'}
                      {difficultyLevel === 'advanced' && 'Advanced / Gifted Extension Focus'}
                    </h5>
                    <p className="text-slate-500 mt-0.5">
                      {difficultyLevel === 'beginner' && 'Features simplified vocabulary structure, basic entry behaviour reviews, slow conceptual pacing, and heavy step-by-step scaffolds.'}
                      {difficultyLevel === 'intermediate' && 'Calibrated precisely to standard curriculum benchmarks with balanced academic jargon and typical age-appropriate cognitive challenges.'}
                      {difficultyLevel === 'advanced' && 'Enriches output with advanced terminology, high-yield diagnostic questions, deep theoretical rationale, and accelerated learning extensions.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reading Complexity Level Toggle */}
            <div className="bg-[#fcf8ff] border border-purple-200/80 rounded-xl p-4.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider block">Linguistic Complexity Scaffolding</span>
                  <label className="text-sm font-bold text-slate-850 flex items-center gap-1.5" id="reading-complexity-label">
                    <span>Reading Complexity Level</span>
                    <span className="bg-purple-100 text-purple-900 text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                      AI TUNER
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Control sentence complexity, vocabulary depth, and linguistic phrasing for generated documents.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-purple-200/80 shadow-2xs">
                  {[
                    { id: 'simple', label: 'Simple', badge: '🟢 Accessible', desc: 'Elementary, accessible words & short clear sentences' },
                    { id: 'standard', label: 'Standard', badge: '🔵 Balanced', desc: 'Grade-appropriate standard academic level' },
                    { id: 'professional', label: 'Professional', badge: '🟣 Advanced', desc: 'Advanced academic rigor & formal terminology' },
                  ].map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setReadingComplexity(level.id as 'simple' | 'standard' | 'professional')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        readingComplexity === level.id
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title={level.desc}
                    >
                      <span>{level.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-purple-800/80 bg-purple-50/60 border border-purple-100 p-2 rounded-lg font-medium">
                {readingComplexity === 'simple' && '⚡ Simple: Uses short, direct sentences, high-frequency vocabulary, and clear explanations tailored for early readers or ESL/EAL learners.'}
                {readingComplexity === 'standard' && '⚡ Standard: Balanced academic tone aligned standardly to target grade curriculum benchmarks.'}
                {readingComplexity === 'professional' && '⚡ Professional: Sophisticated domain vocabulary, complex syntax, and detailed academic definitions.'}
              </p>
            </div>

            {/* Document Page Size & Detail Length Customization */}
            <div className="bg-[#faf8f5] border border-amber-200/80 rounded-xl p-4.5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">Document Paper & Scope Settings</span>
                  <label className="text-sm font-bold text-slate-850 flex items-center gap-1.5">
                    <span>Document Size & Length Options</span>
                    <span className="bg-amber-100 text-amber-900 text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                      PAGE & CONTENT SCOPE
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Choose the target paper size (for layout, PDF, and PNG exports) and the content depth (length & detail level).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Paper / Page Format Size */}
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-200/60 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1">
                    📄 Page / Paper Format Size
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[
                      { id: 'A4', label: 'A4', desc: 'Standard (210×297 mm)' },
                      { id: 'A5', label: 'A5', desc: 'Compact (148×210 mm)' },
                      { id: 'Letter', label: 'Letter', desc: 'US Letter (8.5×11 in)' },
                      { id: 'Legal', label: 'Legal', desc: 'Extended (8.5×14 in)' },
                      { id: 'A3', label: 'A3', desc: 'Poster (297×420 mm)' }
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setDocumentPageSize(fmt.id as any)}
                        className={`px-2 py-1.5 rounded-lg border text-left transition ${
                          documentPageSize === fmt.id
                            ? 'bg-amber-50 border-amber-500 text-amber-950 font-black ring-1 ring-amber-400'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300 font-medium'
                        }`}
                      >
                        <p className="text-xs font-black leading-tight">{fmt.label}</p>
                        <p className="text-[9px] opacity-75 font-normal leading-tight mt-0.5 truncate">{fmt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Document Content Length / Depth */}
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-200/60 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1">
                    📏 Content Length & Detail Scope
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {[
                      { id: 'concise', label: '⚡ Concise (1 Page)', desc: 'High-yield key summary' },
                      { id: 'standard', label: '📄 Standard (2-3 Pages)', desc: 'Balanced lesson & notes' },
                      { id: 'detailed', label: '📚 Detailed (4-5 Pages)', desc: 'Extended explanations' },
                      { id: 'comprehensive', label: '🏆 Comprehensive', desc: 'Exhaustive master study' }
                    ].map((len) => (
                      <button
                        key={len.id}
                        type="button"
                        onClick={() => setDocumentLength(len.id as any)}
                        className={`px-2.5 py-2 rounded-lg border text-left transition ${
                          documentLength === len.id
                            ? 'bg-amber-50 border-amber-500 text-amber-950 font-black ring-1 ring-amber-400'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300 font-medium'
                        }`}
                      >
                        <p className="text-xs font-black leading-tight">{len.label}</p>
                        <p className="text-[9px] opacity-75 font-normal leading-tight mt-0.5 truncate">{len.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {(docType === 'lesson-plan' || docType === 'lesson-notes' || docType === 'lesson-notes-classic') && (
              <div className="p-5 rounded-2xl bg-[#0d9488]/5 border border-[#0d9488]/20 shadow-sm space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-teal-600 animate-spin" style={{ animationDuration: '6s' }} />
                  <div>
                    <h4 className="text-sm font-bold text-teal-800">Pre-defined Lesson Structure Layout Template</h4>
                    <p className="text-[11px] text-slate-500">Select a structural framework to guide Gemini in generating the lesson stages, flow, and instructional experiences.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-800/80">Core Layout Frameworks</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div
                      onClick={() => setLessonLayout('default')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition relative cursor-pointer h-full ${
                        lessonLayout === 'default'
                          ? 'border-teal-500 bg-teal-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-700">Classic Flow</span>
                        {lessonLayout === 'default' && <span className="w-2 h-2 rounded-full bg-teal-500"></span>}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-normal font-medium mb-3">Standard Introduction, Concept Development, Summary, Assessment.</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewLayout('default');
                        }}
                        className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-850 bg-teal-50/80 hover:bg-teal-100 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview structure</span>
                      </button>
                    </div>

                    <div
                      onClick={() => setLessonLayout('5e-model')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition relative cursor-pointer h-full ${
                        lessonLayout === '5e-model'
                          ? 'border-teal-500 bg-teal-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-teal-700">5E Constructivist</span>
                        {lessonLayout === '5e-model' && <span className="w-2 h-2 rounded-full bg-teal-500"></span>}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-normal font-medium mb-3">Engage, Explore, Explain, Elaborate, Evaluate. Best for hands-on sciences & CBC.</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewLayout('5e-model');
                        }}
                        className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-850 bg-teal-50/80 hover:bg-teal-100 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview structure</span>
                      </button>
                    </div>

                    <div
                      onClick={() => setLessonLayout('direct-instruction')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition relative cursor-pointer h-full ${
                        lessonLayout === 'direct-instruction'
                          ? 'border-teal-500 bg-teal-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-amber-700">Direct Instruction</span>
                        {lessonLayout === 'direct-instruction' && <span className="w-2 h-2 rounded-full bg-teal-500"></span>}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-normal font-medium mb-3">Hook, Presentation (I Do), Guided (We Do), Independent (You Do), Closure.</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewLayout('direct-instruction');
                        }}
                        className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-850 bg-teal-50/80 hover:bg-teal-100 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview structure</span>
                      </button>
                    </div>

                    <div
                      onClick={() => setLessonLayout('inquiry-based')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition relative cursor-pointer h-full ${
                        lessonLayout === 'inquiry-based'
                          ? 'border-teal-500 bg-teal-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-indigo-700">Inquiry-Based</span>
                        {lessonLayout === 'inquiry-based' && <span className="w-2 h-2 rounded-full bg-teal-500"></span>}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-normal font-medium mb-3">Ask/Inquire, Investigate, Create/Synthesize, Collaborate, Reflect.</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewLayout('inquiry-based');
                        }}
                        className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-850 bg-teal-50/80 hover:bg-teal-100 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview structure</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-800/80">Modern English Language (ELT) Pedagogies</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div
                      onClick={() => setLessonLayout('communicative')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition relative cursor-pointer h-full ${
                        lessonLayout === 'communicative'
                          ? 'border-rose-450 bg-rose-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-rose-700">Communicative (CLT)</span>
                        {lessonLayout === 'communicative' && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-normal font-medium mb-3">Interactive, real-life situational fluency, speech role-play, info-gap speaking.</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewLayout('communicative');
                        }}
                        className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-850 bg-rose-50/80 hover:bg-rose-100 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview structure</span>
                      </button>
                    </div>

                    <div
                      onClick={() => setLessonLayout('audio-lingual')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition relative cursor-pointer h-full ${
                        lessonLayout === 'audio-lingual'
                          ? 'border-purple-450 bg-purple-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-purple-700">Audio-Lingual (ALM)</span>
                        {lessonLayout === 'audio-lingual' && <span className="w-2 h-2 rounded-full bg-purple-500"></span>}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-normal font-medium mb-3">Pronunciation imitation, repetitive dialog substitution, structured reflex drilling.</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewLayout('audio-lingual');
                        }}
                        className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-850 bg-purple-50/80 hover:bg-purple-100 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview structure</span>
                      </button>
                    </div>

                    <div
                      onClick={() => setLessonLayout('task-based')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition relative cursor-pointer h-full ${
                        lessonLayout === 'task-based'
                          ? 'border-cyan-450 bg-cyan-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-cyan-700">Task-Based (TBLT)</span>
                        {lessonLayout === 'task-based' && <span className="w-2 h-2 rounded-full bg-cyan-500"></span>}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-normal font-medium mb-3">Completing a concrete project/task with language used as an active practical tool.</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewLayout('task-based');
                        }}
                        className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold text-cyan-600 hover:text-cyan-850 bg-cyan-50/80 hover:bg-cyan-100 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview structure</span>
                      </button>
                    </div>

                    <div
                      onClick={() => setLessonLayout('clil')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition relative cursor-pointer h-full ${
                        lessonLayout === 'clil'
                          ? 'border-orange-450 bg-orange-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-orange-700">CLIL Model</span>
                        {lessonLayout === 'clil' && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-normal font-medium mb-3">Dual-focus learning: teaching subjects like Science or Geography in English.</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewLayout('clil');
                        }}
                        className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-850 bg-orange-50/80 hover:bg-orange-100 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview structure</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0f766e]/80">Modern High-Impact Pedagogies</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div
                      onClick={() => setLessonLayout('flipped-classroom')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition relative cursor-pointer h-full ${
                        lessonLayout === 'flipped-classroom'
                          ? 'border-sky-400 bg-sky-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-sky-700">Flipped Classroom</span>
                        {lessonLayout === 'flipped-classroom' && <span className="w-2 h-2 rounded-full bg-sky-500"></span>}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-normal font-medium mb-3">Pre-class content absorption, repurposing classroom hours for active peer collaboration.</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewLayout('flipped-classroom');
                        }}
                        className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 hover:text-sky-850 bg-sky-50/80 hover:bg-sky-100 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview structure</span>
                      </button>
                    </div>

                    <div
                      onClick={() => setLessonLayout('project-based')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition relative cursor-pointer h-full ${
                        lessonLayout === 'project-based'
                          ? 'border-emerald-400 bg-emerald-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">Project-Based (PBL)</span>
                        {lessonLayout === 'project-based' && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-normal font-medium mb-3">Extended investigation of local real-world challenges, culminating in a product exhibition.</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewLayout('project-based');
                        }}
                        className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-850 bg-emerald-50/80 hover:bg-emerald-100 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview structure</span>
                      </button>
                    </div>

                    <div
                      onClick={() => setLessonLayout('game-based')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition relative cursor-pointer h-full ${
                        lessonLayout === 'game-based'
                          ? 'border-amber-400 bg-amber-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-amber-700">Gamified Quest</span>
                        {lessonLayout === 'game-based' && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-normal font-medium mb-3">Immersive narrative framework with level quests, points, checkpoints, and award feedback.</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewLayout('game-based');
                        }}
                        className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-850 bg-amber-50/80 hover:bg-amber-100 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview structure</span>
                      </button>
                    </div>

                    <div
                      onClick={() => setLessonLayout('phenomenon-based')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition relative cursor-pointer h-full ${
                        lessonLayout === 'phenomenon-based'
                          ? 'border-indigo-400 bg-indigo-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-indigo-700">PhenoBL Model</span>
                        {lessonLayout === 'phenomenon-based' && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-normal font-medium mb-3">Authentic, holistic real-world phenomena investigated across subject-matter boundaries.</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewLayout('phenomenon-based');
                        }}
                        className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-850 bg-indigo-50/80 hover:bg-indigo-100 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview structure</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {docType === 'lesson-notes-classic' && (
              <div className="p-6 rounded-2xl bg-amber-50/40 border border-amber-200/60 shadow-sm space-y-5 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold border border-amber-200 shadow-xs">
                    ✍️
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-amber-900 tracking-tight">Classic Handwritten Customization</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Fine-tune the paper aesthetic and ink color for your classic handwritten pedagogical lesson notes.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  {/* Paper Style Selector */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">1. Select Paper Style</span>
                    <div className="grid grid-cols-3 gap-2.5">
                      {/* Ruled Option */}
                      <button
                        type="button"
                        onClick={() => setPaperStyle('ruled')}
                        className={`group flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 relative ${
                          paperStyle === 'ruled'
                            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-full h-8 flex flex-col gap-1.5 justify-center px-2 mb-1.5 overflow-hidden">
                          <div className="border-b border-amber-200/60 w-full h-0"></div>
                          <div className="border-b border-amber-200/60 w-full h-0"></div>
                          <div className="border-b border-amber-200/60 w-full h-0"></div>
                        </div>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Ruled</span>
                      </button>

                      {/* Grid Option */}
                      <button
                        type="button"
                        onClick={() => setPaperStyle('grid')}
                        className={`group flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 relative ${
                          paperStyle === 'grid'
                            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-full h-8 flex flex-wrap justify-center items-center content-center gap-1.5 mb-1.5 overflow-hidden opacity-40">
                          <div className="grid grid-cols-3 gap-1 w-full px-1">
                            <div className="border border-slate-300 h-2 w-full"></div>
                            <div className="border border-slate-300 h-2 w-full"></div>
                            <div className="border border-slate-300 h-2 w-full"></div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Grid</span>
                      </button>

                      {/* Blank Option */}
                      <button
                        type="button"
                        onClick={() => setPaperStyle('blank')}
                        className={`group flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 relative ${
                          paperStyle === 'blank'
                            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-full h-8 flex items-center justify-center mb-1.5">
                          <div className="w-10 h-6 rounded-md bg-slate-50 border border-slate-200/50"></div>
                        </div>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Blank</span>
                      </button>
                    </div>
                  </div>

                  {/* Pen Color Selector */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">2. Select Pen Ink Color</span>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Royal Blue Pen */}
                      <button
                        type="button"
                        onClick={() => setPenColor('blue')}
                        className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all duration-300 ${
                          penColor === 'blue'
                            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] shadow-xs">
                          {penColor === 'blue' && '✓'}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block leading-tight">Royal Blue</span>
                          <span className="text-[10px] text-slate-400 font-semibold block">Classic blue ink</span>
                        </div>
                      </button>

                      {/* Velvet Black Pen */}
                      <button
                        type="button"
                        onClick={() => setPenColor('black')}
                        className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all duration-300 ${
                          penColor === 'black'
                            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center text-white text-[10px] shadow-xs">
                          {penColor === 'black' && '✓'}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block leading-tight">Velvet Black</span>
                          <span className="text-[10px] text-slate-400 font-semibold block">High contrast black</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Handwriting Intensity Slider */}
                <div className="border-t border-amber-200/40 pt-4 mt-1 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">3. Adjust Handwriting Intensity & Messiness</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold text-amber-950 bg-amber-100 border border-amber-200 rounded-full">
                      Level {handwritingIntensity}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="relative pt-1">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={handwritingIntensity}
                        onChange={(e) => setHandwritingIntensity(parseInt(e.target.value))}
                        className="w-full h-2 bg-amber-200/50 rounded-lg appearance-none cursor-pointer accent-amber-600 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                      />
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 px-1 mt-2">
                        <span className={handwritingIntensity === 1 ? "text-amber-800 font-extrabold" : ""}>1 (Pristine)</span>
                        <span className={handwritingIntensity === 2 ? "text-amber-800 font-extrabold" : ""}>2 (Tidy)</span>
                        <span className={handwritingIntensity === 3 ? "text-amber-800 font-extrabold" : ""}>3 (Standard)</span>
                        <span className={handwritingIntensity === 4 ? "text-amber-800 font-extrabold" : ""}>4 (Expressive)</span>
                        <span className={handwritingIntensity === 5 ? "text-amber-800 font-extrabold" : ""}>5 (Chaos)</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-amber-100 shadow-3xs text-[11px] font-medium text-slate-600">
                      {handwritingIntensity === 1 && (
                        <span>✨ <strong>Pristine & Perfect:</strong> Flawless print-like handwriting. Straight lines, uniform stroke structures, and absolute neatness. Zero corrections or casual margin drawings.</span>
                      )}
                      {handwritingIntensity === 2 && (
                        <span>📖 <strong>Tidy & Clean:</strong> Beautifully legible student notes. Highly structured layout with extremely occasional clean, single-line corrections and minimal decorations.</span>
                      )}
                      {handwritingIntensity === 3 && (
                        <span>📝 <strong>Balanced Student Notes (Default):</strong> Realistic, organic study notes. Smooth pen strokes with moderate, natural corrections and a few neat margin indicators.</span>
                      )}
                      {handwritingIntensity === 4 && (
                        <span>🎨 <strong>Expressive & Active:</strong> Energetic learning look. Natural handwriting with frequent corrections (crossed-out terms), annotations, arrows, and minor doodles.</span>
                      )}
                      {handwritingIntensity === 5 && (
                        <span>🔥 <strong>Creative Chaos:</strong> Intense academic revision aesthetic. Highly messy writing style filled with extensive corrections, margin sketches, arrow redirections, and simulated ink pressure.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Image Generation Model Selector (Admin Only) */}
                {profile?.role === 'Administrator' ? (
                  <div className="border-t border-amber-200/40 pt-4 mt-2 space-y-3">
                    <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">4. Select AI Image Strategy for Classic Notes (Admin)</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {/* Option 1: Nano Banana as Fallback for Emgen */}
                      <button
                        type="button"
                        onClick={() => setClassicNotesImageModel('emgen_fallback_nanobanana')}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                          classicNotesImageModel === 'emgen_fallback_nanobanana'
                            ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full bg-amber-600 flex items-center justify-center text-white text-[10px] shrink-0 font-bold">
                          {classicNotesImageModel === 'emgen_fallback_nanobanana' && '✓'}
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-800 block leading-tight">🍌 Nano Banana Fallback</span>
                          <span className="text-[9.5px] text-slate-500 font-semibold block leading-tight">Emgen primary + Auto Nano Banana fallback</span>
                        </div>
                      </button>

                      {/* Option 2: Emgen Only */}
                      <button
                        type="button"
                        onClick={() => setClassicNotesImageModel('emgen')}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                          classicNotesImageModel === 'emgen'
                            ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full bg-amber-600 flex items-center justify-center text-white text-[10px] shrink-0 font-bold">
                          {classicNotesImageModel === 'emgen' && '✓'}
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-800 block leading-tight">🎨 Emgen Only</span>
                          <span className="text-[9.5px] text-slate-500 font-semibold block leading-tight">High resolution / Ultra-detailed</span>
                        </div>
                      </button>

                      {/* Option 3: Nano Banana Only */}
                      <button
                        type="button"
                        onClick={() => setClassicNotesImageModel('nano banana')}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                          classicNotesImageModel === 'nano banana'
                            ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-white text-[10px] shrink-0 font-bold">
                          {classicNotesImageModel === 'nano banana' && '✓'}
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-800 block leading-tight">🍌 Nano Banana Only</span>
                          <span className="text-[9.5px] text-slate-500 font-semibold block leading-tight">Rapid generation</span>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-slate-100 pt-3 mt-2 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      ⚡ Dual Engine
                    </span>
                    <span>Note images generated using Emgen with automatic Nano Banana fallback</span>
                  </div>
                )}
              </div>
            )}

            <hr className="border-slate-100" />

            {/* 2. Subject & Grade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject / Learning Area</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {SUBJECT_OPTIONS.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                  <option value="Other">Other Subject...</option>
                </select>

                {subject === 'Other' && (
                  <div className="relative flex items-center mt-2">
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="Enter custom subject name"
                      className={`w-full border border-slate-250 rounded-xl pl-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition ${
                        activeMicField === 'customSubject' ? 'pr-28' : 'pr-11'
                      }`}
                      required
                    />
                    {micSupported && (
                      <MicButtonWithIndicator
                        field="customSubject"
                        activeMicField={activeMicField}
                        toggleMic={toggleMic}
                      />
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Class / Grade Level</label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                  required
                >
                  {curriculum === 'cbc'
                    ? GRADE_OPTIONS_CBC.map((gr) => (
                        <option key={gr} value={gr}>{gr}</option>
                      ))
                    : GRADE_OPTIONS_STANDARD.map((gr) => (
                        <option key={gr} value={gr}>{gr}</option>
                      ))}
                </select>
              </div>
            </div>

            {/* 3. Topic & Subtopic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    {curriculum === 'cbc' ? 'Main Strand(s)' : 'Main Topic(s)'}
                  </label>
                  {topic.trim() && (
                    <button
                      type="button"
                      disabled={isGeneratingVocabulary}
                      onClick={handleGenerateVocabulary}
                      className="text-xs text-amber-750 hover:text-amber-900 flex items-center gap-1 font-bold bg-amber-50 hover:bg-amber-100 transition px-2.5 py-1.5 rounded-lg border border-amber-200/50 disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isGeneratingVocabulary ? 'Generating...' : 'Generate Vocabulary'}
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={docType === 'scheme-of-work' ? "e.g., Numbers, Algebra, Plant Mechanics" : "e.g., Fractions, Adverbs, Soil Conservation"}
                    className={`w-full border border-slate-250 rounded-xl pl-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition ${
                      activeMicField === 'topic' ? 'pr-28' : 'pr-11'
                    }`}
                    required
                  />
                  {micSupported && (
                    <MicButtonWithIndicator
                      field="topic"
                      activeMicField={activeMicField}
                      toggleMic={toggleMic}
                    />
                  )}
                </div>
                {vocabularyError && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{vocabularyError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {curriculum === 'cbc' ? 'Sub-strand(s)' : 'Sub-topic(s)'} <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={subTopic}
                    onChange={(e) => setSubTopic(e.target.value)}
                    placeholder={docType === 'scheme-of-work' ? "e.g., Fractions, Decimals, Photosynthesis" : "e.g., Equivalent Fractions, Types of Soil"}
                    className={`w-full border border-slate-250 rounded-xl pl-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition ${
                      activeMicField === 'subTopic' ? 'pr-28' : 'pr-11'
                    }`}
                  />
                  {micSupported && (
                    <MicButtonWithIndicator
                      field="subTopic"
                      activeMicField={activeMicField}
                      toggleMic={toggleMic}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 🎙️ Smart Voice Dictation Hub */}
            <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-5 space-y-4 shadow-3xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-700">
                    <Mic className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Smart Voice Dictation Hub</h4>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      Dictate your lesson concept or prompts naturally
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <label className="text-xs font-bold text-slate-600">Language:</label>
                  <select
                    value={dictationLang}
                    onChange={(e) => {
                      const newLang = e.target.value as 'en-US' | 'sw-KE';
                      setDictationLang(newLang);
                      if (activeMicField === 'hub') {
                        // Restart mic with the new language
                        toggleMic('hub'); // stop
                        setTimeout(() => toggleMic('hub'), 300); // start
                      }
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="en-US">🇬🇧 English (en-US)</option>
                    <option value="sw-KE">🇰🇪 Swahili (sw-KE)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 space-y-2">
                  <div>
                    <RealtimeSpellcheckEditor
                      value={hubTranscription}
                      onChange={setHubTranscription}
                      placeholder={
                        dictationLang === 'en-US'
                          ? "Press 'Start Dictation' to speak, or type directly here. Let the AI convert your voice into structured lesson plans..."
                          : "Bonyeza 'Anza Kuongea' ili uweze kutamka maneno, au andika moja kwa moja hapa..."
                      }
                      rows={4}
                      id="hubTranscription"
                      micButton={
                        activeMicField === 'hub' ? (
                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 px-2 py-1 rounded-lg text-[10px] font-bold shadow-xs select-none">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span>Listening</span>
                            <div className="flex items-end gap-0.5 h-2.5 w-3 shrink-0">
                              <motion.span
                                animate={{ height: ['20%', '100%', '20%'] }}
                                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                                className="w-[2px] bg-red-500 rounded-xs"
                              />
                              <motion.span
                                animate={{ height: ['40%', '100%', '40%'] }}
                                transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                                className="w-[2px] bg-red-500 rounded-xs"
                              />
                              <motion.span
                                animate={{ height: ['15%', '100%', '15%'] }}
                                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                                className="w-[2px] bg-red-500 rounded-xs"
                              />
                            </div>
                          </div>
                        ) : null
                      }
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMic('hub')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                          activeMicField === 'hub'
                            ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                        }`}
                      >
                        {activeMicField === 'hub' ? (
                          <>
                            <MicOff className="w-3.5 h-3.5" /> Stop Dictation
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 animate-pulse" /> Start Dictation
                          </>
                        )}
                      </button>

                      {hubTranscription && (
                        <button
                          type="button"
                          onClick={() => setHubTranscription('')}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Clear Text
                        </button>
                      )}
                    </div>

                    {!micSupported && (
                      <p className="text-[10px] text-amber-600 font-semibold">
                        ⚠️ Speech recognition not fully supported on this browser (Chrome/Edge recommended).
                      </p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-4 bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                      <Grab className="w-3.5 h-3.5 text-emerald-600" /> Apply Transcription
                    </h5>
                    <p className="text-[10px] text-slate-500 leading-normal mb-3">
                      Quickly map your dictated text to any of the creator fields below:
                    </p>
                    
                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled={!hubTranscription.trim()}
                        onClick={() => {
                          setTopic(prev => {
                            const trimmed = prev.trim();
                            return trimmed ? `${trimmed} ${hubTranscription.trim()}` : hubTranscription.trim();
                          });
                        }}
                        className="w-full text-left p-2 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 text-xs font-semibold text-slate-700 transition disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-100 flex items-center justify-between"
                      >
                        <span>Set as {curriculum === 'cbc' ? 'Main Strand(s)' : 'Main Topic(s)'}</span>
                        <Plus className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        disabled={!hubTranscription.trim()}
                        onClick={() => {
                          setSubTopic(prev => {
                            const trimmed = prev.trim();
                            return trimmed ? `${trimmed} ${hubTranscription.trim()}` : hubTranscription.trim();
                          });
                        }}
                        className="w-full text-left p-2 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 text-xs font-semibold text-slate-700 transition disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-100 flex items-center justify-between"
                      >
                        <span>Set as Sub-strand/Subtopic</span>
                        <Plus className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        disabled={!hubTranscription.trim()}
                        onClick={() => {
                          setExtraPrompt(prev => {
                            const trimmed = prev.trim();
                            return trimmed ? `${trimmed} \n${hubTranscription.trim()}` : hubTranscription.trim();
                          });
                        }}
                        className="w-full text-left p-2 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 text-xs font-semibold text-slate-700 transition disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-100 flex items-center justify-between"
                      >
                        <span>Set as Custom Instructions</span>
                        <Plus className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {hubTranscription.trim() && (
                    <div className="bg-emerald-50/50 p-2 border border-emerald-100 rounded-lg text-[9px] text-emerald-800 font-semibold leading-snug">
                      💡 Dictation ready! Click any button above to apply this text.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scheme of Work Configuration Section */}
            {docType === 'scheme-of-work' && (
              <div className="p-5 rounded-2xl bg-[#5f6f52]/5 border border-[#5f6f52]/20 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-[#5f6f52] flex items-center gap-1.5">
                  <BookOpen className="w-4.5 h-4.5" />
                  Scheme of Work Scheduling Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Lessons Per Week</label>
                    <select
                      value={lessonsPerWeek}
                      onChange={(e) => setLessonsPerWeek(Number(e.target.value))}
                      className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#5f6f52]"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>{n} lessons per week</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Number of Weeks per Term</label>
                    <select
                      value={weeksPerTerm}
                      onChange={(e) => setWeeksPerTerm(Number(e.target.value))}
                      className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#5f6f52]"
                    >
                      {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((w) => (
                        <option key={w} value={w}>{w} weeks of learning</option>
                      ))}
                    </select>
                  </div>
                </div>
                {curriculum === 'cbc' && (() => {
                  const targetSub = subject === 'Other' ? customSubject : subject;
                  const details = getCbcLessonDetails(classLevel, targetSub);
                  return (
                    <div className="bg-amber-50/60 border border-amber-200/50 rounded-xl p-3.5 space-y-2 animate-fadeIn text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Kenyan CBC Scheduling Rule Compliance</span>
                      </div>
                      <div className="space-y-1.5 text-amber-800 leading-relaxed font-medium">
                        <p>
                          <strong>Grade:</strong> {classLevel} | <strong>Subject:</strong> {targetSub || 'Unspecified'}
                        </p>
                        <p>
                          <strong>Standard Allocation:</strong> <span className="bg-amber-100 text-amber-950 font-bold px-1.5 py-0.5 rounded border border-amber-200">{details.lessonsPerWeek} lessons/week</span>
                        </p>
                        <p className="text-[11px] text-amber-900 leading-normal">
                          <strong>Double Lesson Policy:</strong> {details.distribution}
                        </p>
                        <p className="text-[10px] text-slate-500 leading-normal italic mt-1 bg-white/70 p-2 rounded border border-amber-100">
                          {details.isStem 
                            ? "💡 STEM subject: Will structure exactly 1 double lesson and 3 single lessons sequentially per week." 
                            : "💡 Mathematics/Non-STEM subject: Strictly single lessons only. No double lessons permitted."}
                        </p>
                      </div>
                    </div>
                  );
                })()}
                <p className="text-[11px] text-slate-500 leading-normal">
                  The generated scheme of work will dynamically distribute your specified strands/sub-strands into a clean, comprehensive week-by-week table for a {weeksPerTerm}-week term with {lessonsPerWeek} lessons per week ({lessonsPerWeek * weeksPerTerm} total lessons).
                </p>
              </div>
            )}

            {/* 4. Duration & Extra Context */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {docType === 'scheme-of-work' ? 'Individual Lesson Duration' : 'Duration'}
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="30 minutes">30 minutes</option>
                  <option value="40 minutes">40 minutes</option>
                  <option value="1 hour">1 hour</option>
                  <option value="Double Lesson (80 mins)">Double Lesson (80 mins)</option>
                  <option value="1 Week unit">1 Week unit</option>
                  <option value="4 Week unit">4 Week unit</option>
                </select>

                {curriculum === 'cbc' && (() => {
                  const targetSub = subject === 'Other' ? customSubject : subject;
                  const details = getCbcLessonDetails(classLevel, targetSub);
                  const isMath = (targetSub || '').toLowerCase().includes('mathematics') || (targetSub || '').toLowerCase().includes('math');
                  return (
                    <div className="mt-2 text-[10px] p-2 bg-amber-50/50 border border-amber-200/50 rounded-lg space-y-1">
                      <p className="font-bold text-amber-900">CBC Lesson Duration Rule:</p>
                      <p className="text-amber-800">
                        {isMath 
                          ? "⚠️ Core/Essential Mathematics strictly requires single 40-min lessons. Do not select Double Lessons." 
                          : details.isStem 
                            ? "✅ STEM subjects can have 1 double lesson (80 mins) and 3 single lessons per week." 
                            : "⚠️ This non-STEM subject strictly requires single lessons only."}
                      </p>
                    </div>
                  );
                })()}

                <button
                  type="button"
                  id="suggest-pacing-btn"
                  onClick={handleSuggestPacing}
                  disabled={isGeneratingPacing || !topic.trim()}
                  className={`mt-2.5 w-full py-2.5 px-3 border rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    !topic.trim()
                      ? 'border-slate-200 text-slate-400 bg-slate-50 opacity-60 cursor-not-allowed'
                      : 'border-emerald-200 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50 animate-fadeIn'
                  }`}
                  title={!topic.trim() ? "Enter a topic to generate a pacing guide" : "Generate a suggested timing/segments layout"}
                >
                  {isGeneratingPacing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5f6f52]" /> Suggesting Pacing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" /> Suggest Pacing
                    </>
                  )}
                </button>
                {pacingError && (
                  <p className="text-[11px] text-red-600 mt-1.5 font-semibold leading-normal">{pacingError}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Special Focus / Custom Instructions <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="flex gap-2">
                    {selectedTemplateId && (
                      <button
                        type="button"
                        onClick={() => setSelectedTemplateId('')}
                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold bg-slate-100 hover:bg-slate-200 transition px-2.5 py-1.5 rounded-lg border border-slate-200"
                      >
                        Clear Template Choice
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateNameInput(
                          templateNameInput ||
                          `My ${docType.replace('-', ' ')} (${curriculum === 'cbc' ? 'CBC' : 'Standard'}) Template`
                        );
                        setIsSaveTemplateModalOpen(true);
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-bold bg-emerald-50 hover:bg-emerald-100 transition px-2.5 py-1.5 rounded-lg border border-emerald-150"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      {selectedTemplateId ? 'Save Changes' : 'Save as Reusable Template'}
                    </button>
                  </div>
                </div>
                <div>
                  <RealtimeSpellcheckEditor
                    value={extraPrompt}
                    onChange={setExtraPrompt}
                    placeholder="e.g., Use locally improvised items, include kinesthetic group activities, specify a hands-on lab layout, emphasize local Kenyan values, etc."
                    rows={3}
                    id="extraPrompt"
                    micButton={
                      micSupported ? (
                        <MicButtonWithIndicator
                          field="extraPrompt"
                          activeMicField={activeMicField}
                          toggleMic={toggleMic}
                          isTextArea={true}
                        />
                      ) : null
                    }
                  />
                </div>
              </div>
            </div>

            {/* Schedule Lesson Plan in EduNexus Dashboard Calendar */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-5 shadow-xs space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 dark:border-emerald-800/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span>Schedule Lesson Plan</span>
                      {scheduledDate && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/80 dark:text-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Calendar Synced
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      Schedule this lesson plan directly into your EduNexus Dashboard calendar & upcoming timetable
                    </p>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 self-start sm:self-center flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setScheduledDate(today);
                      localStorage.setItem('pedagogical_scheduled_date_hint', today);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      scheduledDate === new Date().toISOString().split('T')[0]
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const tomorrowStr = tomorrow.toISOString().split('T')[0];
                      setScheduledDate(tomorrowStr);
                      localStorage.setItem('pedagogical_scheduled_date_hint', tomorrowStr);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Tomorrow
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const dayOfWeek = today.getDay();
                      const daysUntilNextMon = ((8 - dayOfWeek) % 7) || 7;
                      const nextMon = new Date(today);
                      nextMon.setDate(today.getDate() + daysUntilNextMon);
                      const nextMonStr = nextMon.toISOString().split('T')[0];
                      setScheduledDate(nextMonStr);
                      localStorage.setItem('pedagogical_scheduled_date_hint', nextMonStr);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Next Monday
                  </button>

                  {scheduledDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setScheduledDate('');
                        localStorage.removeItem('pedagogical_scheduled_date_hint');
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                      title="Clear schedule date"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Lesson Schedule Date</span>
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setScheduledDate(val);
                      if (val) {
                        localStorage.setItem('pedagogical_scheduled_date_hint', val);
                      } else {
                        localStorage.removeItem('pedagogical_scheduled_date_hint');
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Lesson Start Time</span>
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                  />
                </div>
              </div>

              {scheduledDate && (
                <div className="text-xs bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-2 text-slate-700 dark:text-slate-200 animate-fadeIn">
                  <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Scheduled for{' '}
                    <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                      {new Date(scheduledDate + 'T' + (scheduledTime || '08:00')).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </strong>
                    {scheduledTime && ` at ${scheduledTime}`}. Will appear directly in your Dashboard Calendar & Timetable.
                  </span>
                </div>
              )}
            </div>

            {/* Pacing Suggestion Render Block */}
            {pacingData && (
              <div className="bg-[#faf6ee] border border-[#eadecd] rounded-2xl p-5 shadow-sm space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#eadecd] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#5f6f52]/10 flex items-center justify-center text-[#5f6f52]">
                      <Clock className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{pacingData.title}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Suggested Pacing Guide • Aligned to {pacingData.totalDuration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleApplyPacingToInstructions}
                      className="text-[11px] text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-lg border border-emerald-200/50 transition cursor-pointer flex items-center gap-1"
                      title="Append this schedule and rationale to Custom Instructions"
                    >
                      <Plus className="w-3.5 h-3.5" /> Append to Custom Instructions
                    </button>
                    <button
                      type="button"
                      onClick={() => setPacingData(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed italic bg-white/60 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 not-italic">Pedagogical Rationale: </span>
                  {pacingData.pacingRationale}
                </p>

                {/* Timeline display */}
                <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-200/60 pl-8 pb-1">
                  {pacingData.segments.map((seg, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline dot / bubble */}
                      <span className="absolute -left-[29px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#5f6f52] text-[9px] font-bold text-[#5f6f52] flex items-center justify-center shadow-xs">
                        {idx + 1}
                      </span>
                      
                      <div className="bg-white border border-slate-150 rounded-xl p-4 hover:shadow-xs transition space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h5 className="font-bold text-slate-800 text-xs sm:text-sm">{seg.title}</h5>
                          <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-bold self-start sm:self-center border border-slate-200">
                            ⏳ {seg.durationRange}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{seg.description}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-[11px] leading-relaxed">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-500 uppercase tracking-wide text-[9px]">Teacher's Focus:</span>
                            <p className="text-slate-700">{seg.teacherRole}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-500 uppercase tracking-wide text-[9px]">Student's Actions:</span>
                            <p className="text-slate-700">{seg.studentRole}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Rubric Generator Section */}
            <div className="bg-sky-50/50 border border-sky-200 rounded-2xl p-5 shadow-xs space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600">
                    <Sparkles className="w-4.5 h-4.5 text-sky-600 fill-sky-300 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">✨ AI Rubric Generator</h3>
                    <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                      Auto-generate a structured grading table from your learning outcomes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePullObjectives}
                    className="text-[11px] text-sky-800 bg-sky-100 hover:bg-sky-200/80 font-bold px-3 py-1.5 rounded-lg border border-sky-200 transition cursor-pointer flex items-center gap-1"
                    title="Load objectives from topic and subtopic inputs"
                  >
                    🪄 Pull from Topic
                  </button>
                </div>
              </div>

              <div>
                <RealtimeSpellcheckEditor
                  value={rubricObjectives}
                  onChange={setRubricObjectives}
                  placeholder="Enter specific learning objectives or skills you wish to evaluate (e.g., 'Learners should be able to write an introduction, use past-tense verbs, and write a summary conclusion...')"
                  rows={3}
                  label="Learning Objectives / Criteria Focus"
                  id="rubricObjectives"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateRubric}
                disabled={isGeneratingRubric || !rubricObjectives.trim()}
                className={`w-full py-2.5 px-3 border rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  !rubricObjectives.trim()
                    ? 'border-slate-200 text-slate-400 bg-slate-50 opacity-60 cursor-not-allowed'
                    : 'border-sky-300 text-sky-850 bg-sky-100/55 hover:bg-sky-100 animate-fadeIn'
                }`}
              >
                {isGeneratingRubric ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" /> Generating Structured Rubric...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Generate Structured Grading Rubric
                  </>
                )}
              </button>

              {rubricError && (
                <p className="text-[11px] text-red-600 mt-1.5 font-semibold leading-normal">{rubricError}</p>
              )}

              {/* Rubric Output Render Block */}
              {rubricData && (
                <div className="bg-white border border-sky-150 rounded-xl p-4 shadow-sm space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">{rubricData.title}</h4>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                        Curriculum Style: {curriculum === 'cbc' ? 'Competency-Based Assessment Grid' : 'Standard Assessment Points'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleApplyRubricToInstructions}
                        className="text-[10px] text-emerald-850 bg-emerald-50 hover:bg-emerald-100 font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 transition cursor-pointer flex items-center gap-1"
                        title="Append this grading rubric to Special Focus / Custom Instructions"
                      >
                        <Plus className="w-3 h-3" /> Insert Rubric
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyRubric}
                        className="text-[10px] text-slate-750 bg-slate-50 hover:bg-slate-100 font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1"
                        title="Copy markdown table to clipboard"
                      >
                        Copy Markdown
                      </button>
                      <button
                        type="button"
                        onClick={() => setRubricData(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Interactive Table Preview */}
                  <div className="overflow-x-auto border border-slate-150 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 text-slate-700 font-bold">
                          <th className="p-3 font-semibold min-w-[120px]">Criterion</th>
                          <th className="p-3 font-semibold min-w-[150px] bg-sky-50/30 text-sky-900 border-l border-slate-150">
                            {curriculum === 'cbc' ? 'Exceeding Expectation (EE)' : 'Excellent (4 pts)'}
                          </th>
                          <th className="p-3 font-semibold min-w-[150px] border-l border-slate-150">
                            {curriculum === 'cbc' ? 'Meeting Expectation (ME)' : 'Proficient (3 pts)'}
                          </th>
                          <th className="p-3 font-semibold min-w-[150px] border-l border-slate-150">
                            {curriculum === 'cbc' ? 'Approaching Expectation (AE)' : 'Developing (2 pts)'}
                          </th>
                          <th className="p-3 font-semibold min-w-[150px] border-l border-slate-150">
                            {curriculum === 'cbc' ? 'Below Expectation (BE)' : 'Emerging (1 pt)'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-650 leading-relaxed">
                        {rubricData.criteria?.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40 transition">
                            <td className="p-3 font-bold text-slate-800 bg-slate-50/10">
                              <div>{item.criterion}</div>
                              <div className="text-[10px] text-slate-400 font-normal mt-0.5">{item.description}</div>
                            </td>
                            <td className="p-3 bg-sky-50/10 border-l border-slate-150 text-slate-700">{item.levels?.exceeding}</td>
                            <td className="p-3 border-l border-slate-150">{item.levels?.meeting}</td>
                            <td className="p-3 border-l border-slate-150">{item.levels?.approaching}</td>
                            <td className="p-3 border-l border-slate-150">{item.levels?.below}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* AI Academic Citation Generator Section */}
            <div className="bg-teal-50/30 border border-teal-200 rounded-2xl p-5 shadow-xs space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
                    <BookOpen className="w-4.5 h-4.5 text-teal-600 fill-teal-100" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">✨ AI Academic Citation Tool</h3>
                    <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                      Generate and insert properly formatted APA, MLA, or Harvard citations
                    </p>
                  </div>
                </div>
              </div>

              {/* Resource Type & Citation Style & Mode Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Resource Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Resource Type</label>
                  <div className="flex gap-1.5">
                    {(['book', 'article', 'website'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCitationResourceType(type)}
                        className={`flex-1 py-1.5 text-xs font-semibold capitalize rounded-lg border transition cursor-pointer ${
                          citationResourceType === type
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Citation Style */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Citation Style</label>
                  <div className="flex gap-1.5">
                    {(['apa', 'mla', 'harvard'] as const).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setCitationStyle(style)}
                        className={`flex-1 py-1.5 text-xs font-semibold uppercase rounded-lg border transition cursor-pointer ${
                          citationStyle === style
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Mode selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Input Mode</label>
                  <div className="flex gap-1.5">
                    {(['structured', 'quick'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setCitationInputMode(mode)}
                        className={`flex-1 py-1.5 text-xs font-semibold capitalize rounded-lg border transition cursor-pointer ${
                          citationInputMode === mode
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {mode === 'structured' ? 'Structured' : 'Smart Quick Cite'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Input Fields */}
              {citationInputMode === 'structured' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">Author(s)</label>
                    <input
                      type="text"
                      value={citationAuthor}
                      onChange={(e) => setCitationAuthor(e.target.value)}
                      placeholder="e.g. John Doe, Jane Smith"
                      className="w-full bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">Title</label>
                    <input
                      type="text"
                      value={citationTitle}
                      onChange={(e) => setCitationTitle(e.target.value)}
                      placeholder={citationResourceType === 'book' ? 'e.g. History of East Africa' : 'e.g. Teaching Methods in CBC'}
                      className="w-full bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">
                      {citationResourceType === 'book' ? 'Publisher' : citationResourceType === 'article' ? 'Journal' : 'URL'}
                    </label>
                    <input
                      type="text"
                      value={citationSource}
                      onChange={(e) => setCitationSource(e.target.value)}
                      placeholder={
                        citationResourceType === 'book' 
                          ? 'e.g. Oxford University Press' 
                          : citationResourceType === 'article'
                          ? 'e.g. East African Journal of Education'
                          : 'e.g. https://www.kicd.ac.ke'
                      }
                      className="w-full bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">Year</label>
                    <input
                      type="text"
                      value={citationYear}
                      onChange={(e) => setCitationYear(e.target.value)}
                      placeholder="e.g. 2024"
                      className="w-full bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <RealtimeSpellcheckEditor
                    value={citationRawInput}
                    onChange={setCitationRawInput}
                    placeholder="Paste some messy, unformatted details here (e.g. 'book written by Omondi Peter, published in 2021 called CBC Implementation in Kenya by Longhorn Publishers') and our AI will parse and format it."
                    rows={2}
                    label="Smart Citation Input Details"
                    id="citationRawInput"
                  />
                </div>
              )}

              {/* Action Trigger Button */}
              <button
                type="button"
                onClick={handleGenerateCitation}
                disabled={isGeneratingCitation || (citationInputMode === 'structured' ? (!citationAuthor.trim() && !citationTitle.trim()) : !citationRawInput.trim())}
                className={`w-full py-2.5 px-3 border rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  (citationInputMode === 'structured' ? (!citationAuthor.trim() && !citationTitle.trim()) : !citationRawInput.trim())
                    ? 'border-slate-200 text-slate-400 bg-slate-50 opacity-60 cursor-not-allowed'
                    : 'border-teal-300 text-teal-850 bg-teal-100/55 hover:bg-teal-100 animate-fadeIn'
                }`}
              >
                {isGeneratingCitation ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" /> Generating Reference Citation...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Auto-Generate Properly Formatted Citation
                  </>
                )}
              </button>

              {citationError && (
                <p className="text-[11px] text-red-600 mt-1.5 font-semibold leading-normal">{citationError}</p>
              )}

              {/* Citation Output Block */}
              {generatedCitation && (
                <div className="bg-white border border-teal-150 rounded-xl p-4 shadow-sm space-y-3 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 font-sans tracking-tight">Generated Citation ({citationStyle.toUpperCase()})</h4>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                        Clean Formatting, No Special Characters Aligned to Guidelines
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleApplyCitationToInstructions}
                        className="text-[10px] text-emerald-850 bg-emerald-50 hover:bg-emerald-100 font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 transition cursor-pointer flex items-center gap-1"
                        title="Include this reference in your Special Focus/Custom instructions"
                      >
                        <Plus className="w-3 h-3" /> Insert Citation
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyCitation}
                        className="text-[10px] text-slate-750 bg-slate-50 hover:bg-slate-100 font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1"
                        title="Copy academic reference to clipboard"
                      >
                        Copy Citation
                      </button>
                      <button
                        type="button"
                        onClick={() => setGeneratedCitation('')}
                        className="text-xs text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        title="Clear Citation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-800 select-all font-medium leading-relaxed font-sans">
                    {generatedCitation}
                  </div>
                </div>
              )}
            </div>

            {/* Document Tagging System */}
            <div className="bg-[#fcfbf9] border border-[#e5e1da] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">Document Tags</h3>
                <span className="text-[11px] text-slate-400 font-normal">(Optional — aids in organizing and filtering your library)</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {['Exam Prep', 'Homework', 'Group Activity', 'Revision', 'Assessment', 'In-Class Work'].map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTags(selectedTags.filter((t) => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 max-w-sm mt-3">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  placeholder="Type a custom tag and press Enter..."
                  className="flex-1 border border-slate-250 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  Add
                </button>
              </div>

              {selectedTags.some(t => !['Exam Prep', 'Homework', 'Group Activity', 'Revision', 'Assessment', 'In-Class Work'].includes(t)) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mr-1">Custom Tags:</span>
                  {selectedTags
                    .filter(t => !['Exam Prep', 'Homework', 'Group Activity', 'Revision', 'Assessment', 'In-Class Work'].includes(t))
                    .map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                        {tag}
                        <button
                          type="button"
                          onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                          className="text-amber-500 hover:text-amber-800 font-bold text-xs"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  }
                </div>
              )}
            </div>

            {/* Standout feature: Explain Like a Master Teacher Mode */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 shadow-sm space-y-3.5">
              <div className="flex items-start gap-3">
                <input
                  id="explainMasterTeacher"
                  type="checkbox"
                  checked={systemPolicies?.forceMasterTeacherMode ? true : explainLikeMasterTeacher}
                  disabled={!!systemPolicies?.forceMasterTeacherMode}
                  onChange={(e) => setExplainLikeMasterTeacher(e.target.checked)}
                  className={`w-5 h-5 mt-1 border-emerald-300 rounded focus:ring-emerald-500 accent-emerald-600 ${
                    systemPolicies?.forceMasterTeacherMode ? 'cursor-not-allowed text-indigo-600' : 'cursor-pointer text-emerald-600'
                  }`}
                />
                <div className="flex-1">
                  <label htmlFor="explainMasterTeacher" className="block text-sm font-bold text-emerald-900 cursor-pointer flex items-center gap-1.5 flex-wrap">
                    <Sparkles className="w-4.5 h-4.5 text-emerald-600 animate-pulse" />
                    <span>Enable "Explain Like a Master Teacher" Companion Guide</span>
                    {systemPolicies?.forceMasterTeacherMode && (
                      <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ml-1.5 animate-pulse">
                        🛡️ Forced Active by Admin
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-emerald-800/85 mt-1 leading-relaxed">
                    Transforms your material into a complete AI Teaching Companion. Appends expert instruction secrets: common learner misconceptions, key Socratic questions, practical live demonstrations, localized everyday analogies, ideas for remedial/enrichment paths, and digital simulation integrations!
                  </p>
                </div>
              </div>
            </div>

            {/* Standout feature: Ask Mentor Mode with Pedagogical Scaffolding */}
            <div className={`p-5 rounded-2xl transition-all duration-300 border shadow-sm space-y-4 ${
              askMentor
                ? 'bg-gradient-to-br from-[#d4a373]/15 via-amber-50/50 to-[#5f6f52]/10 border-[#d4a373]/40 ring-1 ring-[#d4a373]/20'
                : 'bg-gradient-to-br from-[#d4a373]/10 to-[#5f6f52]/10 border-[#d4a373]/25'
            }`}>
              <div className="flex items-start gap-3">
                <input
                  id="askMentor"
                  type="checkbox"
                  checked={askMentor}
                  onChange={(e) => setAskMentor(e.target.checked)}
                  className="w-5 h-5 mt-1 text-[#5f6f52] border-[#5f6f52]/30 rounded focus:ring-[#5f6f52] cursor-pointer accent-[#5f6f52]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <label htmlFor="askMentor" className="block text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                        <span className="text-base">🧠</span>
                        <span>Enable "Ask Mentor" Pedagogical Scaffolding Mode</span>
                      </label>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider bg-[#5f6f52]/15 text-[#5f6f52] px-2 py-0.5 rounded-full">
                        Teacher Companion
                      </span>

                      {/* Pedagogical Scaffolding Benefits Info Icon & Popover Tooltip */}
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowMentorInfoTooltip(!showMentorInfoTooltip);
                          }}
                          onMouseEnter={() => setShowMentorInfoTooltip(true)}
                          className="p-1 rounded-full text-[#5f6f52] hover:text-[#2c3e1e] hover:bg-[#5f6f52]/15 transition focus:outline-none cursor-pointer flex items-center justify-center"
                          aria-label="Pedagogical benefits of AI scaffolding"
                          title="Click or hover to learn about the pedagogical benefits of AI scaffolding"
                        >
                          <Info className="w-4 h-4" />
                        </button>

                        {/* Floating Tooltip Card */}
                        {showMentorInfoTooltip && (
                          <div
                            className="absolute left-0 sm:left-auto sm:-right-2 top-full mt-2 w-72 sm:w-80 bg-slate-900 text-slate-100 p-4 rounded-2xl shadow-xl border border-slate-700/80 z-40 animate-fadeIn text-xs leading-relaxed space-y-2 pointer-events-auto"
                            onMouseLeave={() => setShowMentorInfoTooltip(false)}
                          >
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
                              <span className="font-extrabold text-amber-300 flex items-center gap-1.5 text-xs">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                Pedagogical Benefits of AI Scaffolding
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMentorInfoTooltip(false);
                                }}
                                className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-normal">
                              AI Scaffolding acts as an experienced instructional coach, embedding proven learning structures into your classroom resources:
                            </p>
                            <ul className="space-y-1.5 text-[11px] text-slate-200">
                              <li className="flex items-start gap-1.5">
                                <span className="text-amber-400 shrink-0 mt-0.5">🎯</span>
                                <span><strong>Differentiated Pathways:</strong> Breaks complex concepts into progressive learning steps adapted for mixed-ability learners.</span>
                              </li>
                              <li className="flex items-start gap-1.5">
                                <span className="text-amber-400 shrink-0 mt-0.5">🧠</span>
                                <span><strong>Anticipates Misconceptions:</strong> Identifies common cognitive traps, supplying pre-seeded Socratic diagnostic questions.</span>
                              </li>
                              <li className="flex items-start gap-1.5">
                                <span className="text-amber-400 shrink-0 mt-0.5">📈</span>
                                <span><strong>Active Knowledge Retention:</strong> Integrates real-world contextual anchors, formative check-ins, and actionable mentor tips.</span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Appends specialized pedagogical guidance from a senior school mentor. When enabled, use the scaffolding prompt panel below to guide AI in tailoring generation for your class's specific learning needs and challenges.
                  </p>
                </div>
              </div>

              {/* Interactive Pedagogical Scaffolding Panel */}
              {askMentor && (
                <div className="mt-3 pt-3 border-t border-[#d4a373]/30 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      Class Needs & Pedagogical Scaffolding Prompt
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const targetSub = subject === 'Other' ? customSubject : subject;
                        const defaultPrompt = `Class Needs & Scaffolding Focus for ${targetSub || 'this subject'} (${classLevel || 'Grade level'}, ${curriculum.toUpperCase()}):
• Group Profile: Mixed-ability classroom with diverse learning speeds.
• Pedagogical Goal: Provide step-by-step tiered scaffolding for core concepts, anticipate common misconceptions on "${topic || 'the topic'}", and include 3 diagnostic check questions.
• Support: Include visual step-by-step breakdowns for struggling readers and extension challenges for fast-finishers.`;
                        setMentorScaffoldingContext(defaultPrompt);
                      }}
                      className="text-[11px] font-bold text-[#5f6f52] bg-white/80 hover:bg-white px-2.5 py-1 rounded-lg border border-[#5f6f52]/30 transition shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-[#5f6f52]" />
                      Auto-Fill Class Scaffolding Template
                    </button>
                  </div>

                  {/* Scaffolding Preset Quick Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      Quick Scaffolding Scenarios (Click to append):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        {
                          label: '🧩 Mixed-Ability Tiered Scaffolding',
                          text: 'Provide tiered step-by-step scaffolding for core concepts, with hints for struggling learners and extension challenges for advanced students.'
                        },
                        {
                          label: '🎯 Misconceptions & Diagnostic Focus',
                          text: 'Focus heavily on anticipating common student misconceptions in this topic, providing explicit diagnostic check questions and remedies.'
                        },
                        {
                          label: '🗣️ Language & ELL Support',
                          text: 'Include sentence frames, key vocabulary callouts, and bilingual English/Swahili conceptual bridges for language learners.'
                        },
                        {
                          label: '🔬 Hands-On Practical & Inquiry',
                          text: 'Structure the lesson with low-cost hands-on practical tasks, inquiry questions, and active group collaboration.'
                        }
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            setMentorScaffoldingContext((prev) => {
                              const trimmed = prev.trim();
                              if (!trimmed) return preset.text;
                              if (trimmed.includes(preset.text)) return prev;
                              return `${trimmed}\n• ${preset.text}`;
                            });
                          }}
                          className="text-[11px] font-semibold bg-white/90 hover:bg-amber-100/60 text-amber-950 border border-amber-200/80 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-3xs"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      value={mentorScaffoldingContext}
                      onChange={(e) => setMentorScaffoldingContext(e.target.value)}
                      rows={3}
                      placeholder="Describe your class's specific needs, group dynamics, or pedagogical goals (e.g. 'Class has 35 students, 5 fast-finishers, and needs visual step-by-step breakdowns for struggling readers')..."
                      className="w-full border border-amber-300/70 rounded-xl p-3 text-xs text-slate-800 bg-white/95 focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52]/30 transition shadow-inner leading-relaxed"
                    />
                    {mentorScaffoldingContext && (
                      <button
                        type="button"
                        onClick={() => setMentorScaffoldingContext('')}
                        className="absolute right-2.5 bottom-2.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Standout feature: Generate Vocabulary & Definitions */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200/50 shadow-sm space-y-3.5">
              <div className="flex items-start gap-3">
                <input
                  id="generateVocabulary"
                  type="checkbox"
                  checked={generateVocabulary}
                  onChange={(e) => setGenerateVocabulary(e.target.checked)}
                  className="w-5 h-5 mt-1 text-amber-600 border-amber-300 rounded focus:ring-amber-500 cursor-pointer accent-amber-600"
                />
                <div className="flex-1">
                  <label htmlFor="generateVocabulary" className="block text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                    <BookMarked className="w-4.5 h-4.5 text-amber-600" />
                    Automatically Append "Key Vocabulary & Definitions"
                  </label>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Uses AI to automatically extract 5-8 essential vocabulary terms and student-friendly definitions from the topic <strong>"{topic || 'unspecified'}"</strong>, appending them as a dedicated section at the end of your generated document.
                  </p>
                </div>
              </div>
            </div>

            {/* Standout feature: Differentiated Learning & Inclusion Strategies */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-blue-50/40 border border-indigo-200/50 shadow-sm space-y-3.5">
              <div className="flex items-start gap-3">
                <input
                  id="generateDifferentiated"
                  type="checkbox"
                  checked={generateDifferentiated}
                  onChange={(e) => setGenerateDifferentiated(e.target.checked)}
                  className="w-5 h-5 mt-1 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                />
                <div className="flex-1">
                  <label htmlFor="generateDifferentiated" className="block text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                    <Users className="w-4.5 h-4.5 text-indigo-600" />
                    Automatically Append "Differentiated Learning & Inclusion Strategies"
                  </label>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Appends specialized learning pathways for diverse abilities, including targeted scaffoldings for struggling learners, higher-order enrichment tasks for advanced students, and low-cost accommodations for Special Educational Needs (SEN) learners.
                  </p>
                </div>
              </div>
            </div>

            {/* Standout feature: Parental Engagement & Home-Based Activities */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200/50 shadow-sm space-y-3.5">
              <div className="flex items-start gap-3">
                <input
                  id="generateParental"
                  type="checkbox"
                  checked={generateParental}
                  onChange={(e) => setGenerateParental(e.target.checked)}
                  className="w-5 h-5 mt-1 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <div className="flex-1">
                  <label htmlFor="generateParental" className="block text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                    <Home className="w-4.5 h-4.5 text-emerald-600" />
                    Automatically Append "Parental Engagement & Home-Based Activities"
                  </label>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Designed for modern co-educational support (such as Kenyan CBC homework routines). Appends high-value suggestions for parents to facilitate low-resource, hands-on activities at home and engaging review questions to reinforce concepts.
                  </p>
                </div>
              </div>
            </div>

            {/* Standout feature: Real-Time Web Search Grounding */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-50/80 to-sky-50/40 border border-cyan-200/60 shadow-sm space-y-3.5">
              <div className="flex items-start gap-3">
                <input
                  id="enableSearchGrounding"
                  type="checkbox"
                  checked={enableSearchGrounding}
                  onChange={(e) => setEnableSearchGrounding(e.target.checked)}
                  className="w-5 h-5 mt-1 text-cyan-600 border-cyan-300 rounded focus:ring-cyan-500 cursor-pointer accent-cyan-600"
                />
                <div className="flex-1">
                  <label htmlFor="enableSearchGrounding" className="block text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                    <Globe className="w-4.5 h-4.5 text-cyan-600" />
                    Real-Time Search Grounding (Live Fact & Standards Verification)
                  </label>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Connects Gemini directly to Google Search during document generation to pull current educational standards (such as Kenyan KICD CBC strands, NGSS, Cambridge, Common Core, IB), real-world statistics, and verifiable facts, appending verified web references directly to your document.
                  </p>
                </div>
              </div>
            </div>

            {/* Standout feature: Mermaid.js Flowchart / Concept Map Generation */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50/70 to-emerald-50/40 border border-teal-200/50 shadow-sm space-y-3.5">
              <div className="flex items-start gap-3">
                <input
                  id="generateDiagram"
                  type="checkbox"
                  checked={generateDiagram}
                  onChange={(e) => setGenerateDiagram(e.target.checked)}
                  className="w-5 h-5 mt-1 text-teal-600 border-teal-300 rounded focus:ring-teal-500 cursor-pointer accent-teal-600"
                />
                <div className="flex-1">
                  <label htmlFor="generateDiagram" className="block text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                    <GitFork className="w-4.5 h-4.5 text-teal-600" />
                    Automatically Generate Visual Diagram (Flowchart / Concept Map)
                  </label>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Uses AI to analyze your lesson and automatically write a beautiful Mermaid.js flowchart or concept map diagram showing your lesson progression or relational concepts, which renders natively in the document editor!
                  </p>
                  
                  {generateDiagram && (
                    <div className="mt-3.5 p-3.5 bg-white border border-slate-150 rounded-xl space-y-2 max-w-md">
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">Diagram Style Layout:</span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="diagramType"
                            checked={diagramType === 'flowchart'}
                            onChange={() => setDiagramType('flowchart')}
                            className="w-4 h-4 text-teal-600 cursor-pointer accent-teal-600"
                          />
                          <span>Sequential Lesson Flowchart</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="diagramType"
                            checked={diagramType === 'concept-map'}
                            onChange={() => setDiagramType('concept-map')}
                            className="w-4 h-4 text-teal-600 cursor-pointer accent-teal-600"
                          />
                          <span>Relational Concept Map</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drag and Drop Assessment Question Bank Integration */}
            <div className="border-t border-slate-100 pt-6">
              <label className="block text-sm font-bold text-slate-850 mb-2 text-left flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#5f6f52]" /> Include Stored Assessment Questions 
                <span className="text-slate-400 font-normal text-xs">(Drag questions from the bank sidebar)</span>
              </label>
              
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-emerald-500', 'bg-emerald-50/10');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-50/10');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-50/10');
                  try {
                    const itemStr = e.dataTransfer.getData('text/plain');
                    if (itemStr) {
                      const question = JSON.parse(itemStr) as QuestionBankItem;
                      if (selectedQuestions.some(q => q.id === question.id)) {
                        alert('This question is already selected.');
                        return;
                      }
                      setSelectedQuestions(prev => [...prev, question]);
                    }
                  } catch (err) {
                    console.error('Error dropping question:', err);
                  }
                }}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center transition bg-slate-50/50 flex flex-col items-center justify-center min-h-[140px] relative group"
              >
                {selectedQuestions.length === 0 ? (
                  <div className="text-slate-400 space-y-1">
                    <Grab className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
                    <p className="text-xs font-bold text-slate-600">Drag Questions Here from the Question Bank Sidebar</p>
                    <p className="text-[10px] text-slate-400">Or use the "Insert Direct" button on the questions panel to insert without dragging.</p>
                  </div>
                ) : (
                  <div className="w-full space-y-3 text-left">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-[#5f6f52] uppercase tracking-wider">
                        {selectedQuestions.length} Selected Assessment Questions
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedQuestions([])}
                        className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                      {selectedQuestions.map((q, sIdx) => (
                        <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-2xs relative">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[8px] font-black bg-[#5f6f52]/10 text-[#5f6f52] px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                {q.type.replace('-', ' ')}
                              </span>
                              <span className="text-[8px] font-bold bg-amber-50 border border-amber-200 text-amber-850 px-1.5 py-0.5 rounded-full">
                                {q.gradeLevel}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 leading-normal">{q.questionText}</p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setSelectedQuestions(prev => prev.filter(item => item.id !== q.id))}
                            className="text-slate-300 hover:text-red-500 transition cursor-pointer p-1 rounded hover:bg-slate-50 flex-shrink-0"
                            title="Remove question"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border-t border-slate-150 p-6 flex justify-between items-center flex-wrap gap-4">
            <div>
              {selectedDraftId ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#5f6f52] bg-[#5f6f52]/10 px-2.5 py-1 rounded-lg">
                    Editing Draft: {draftNameInput || 'Unfinished Plan'}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Reset form
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>
                    {lastSavedTime
                      ? `Last saved at ${lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                      : 'Auto-save active'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400">Synced to browser cache & Firestore</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl border border-slate-250 hover:bg-slate-100 text-slate-600 font-medium text-sm transition"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (!topic) {
                    alert("Please enter a Topic before saving a draft.");
                    return;
                  }
                  setDraftNameInput(draftNameInput || `Draft: ${topic} (${subject === 'Other' ? customSubject : subject})`);
                  setIsSaveDraftModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 rounded-xl font-semibold text-sm transition"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Save Draft</span>
                <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/50 rounded-md border border-slate-300">Ctrl+S</kbd>
              </button>

              <button
                type="submit"
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow transition disabled:opacity-90 disabled:cursor-not-allowed relative overflow-hidden min-w-[250px]"
              >
                {isGenerating ? (
                  <>
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-emerald-800/80 transition-all duration-300 ease-out"
                      style={{ width: `${docGenerationProgress}%` }}
                    />
                    <div className="relative z-10 flex items-center justify-center gap-2 w-full">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Generating ({Math.round(docGenerationProgress)}%)...</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Curriculum Material</span>
                    <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono text-emerald-200 bg-emerald-700/50 rounded-md border border-emerald-500/30">Ctrl+Enter</kbd>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
          </div>

          {/* Right panel: Question Bank Sidebar */}
          {showQuestionBank && (
            <div className="w-full lg:w-[430px] lg:sticky lg:top-4 max-h-[85vh] overflow-hidden rounded-2xl shadow-sm border border-slate-200 bg-white shrink-0">
              <QuestionBank 
                onSelectQuestion={(q) => {
                  if (selectedQuestions.some(item => item.id === q.id)) {
                    alert('This question is already selected.');
                    return;
                  }
                  setSelectedQuestions(prev => [...prev, q]);
                }}
                isCompact={true}
              />
            </div>
          )}

        {isSaveDraftModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-150 shadow-xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Save className="w-5 h-5 text-[#5f6f52]" /> Save Creator Draft
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSaveDraftModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Saving your draft stores all current form parameters to Firestore, allowing you to resume on any device or session.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase">Draft Name</label>
                <input
                  type="text"
                  value={draftNameInput}
                  onChange={(e) => setDraftNameInput(e.target.value)}
                  placeholder="e.g., PP1 Math Fractions Plan"
                  className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                {selectedDraftId && (
                  <button
                    type="button"
                    onClick={async () => {
                      setSelectedDraftId('');
                      setDraftNameInput(draftNameInput + ' (Copy)');
                      setTimeout(() => {
                        handleSaveDraft();
                      }, 100);
                    }}
                    className="text-xs text-[#5f6f52] hover:underline font-bold"
                  >
                    Save as Copy
                  </button>
                )}
                <div className="flex justify-end gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsSaveDraftModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveDraft()}
                    disabled={saveStatus === 'saving'}
                    className="px-4 py-2 bg-[#5f6f52] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#4d5a42] transition disabled:opacity-50"
                  >
                    {saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}
                  </button>
                </div>
              </div>

              {saveStatus === 'success' && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold text-center border border-emerald-100">
                  ✓ Draft saved to Firestore!
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold text-center border border-rose-100">
                  ✗ Error saving draft.
                </div>
              )}
            </div>
          </div>
        )}

        {isSaveTemplateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-150 shadow-xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-emerald-600" /> Save Prompt Template
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSaveTemplateModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Saving this prompt template stores your custom instructions and settings so you can instantly re-use them for different lesson plans or worksheets.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase">Template Name</label>
                <input
                  type="text"
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  placeholder="e.g., Practical Science Lab Template"
                  className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase">Description / Purpose <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  value={templateDescInput}
                  onChange={(e) => setTemplateDescInput(e.target.value)}
                  placeholder="e.g., Focuses on low-cost improvised tools and Socratic checks"
                  className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                {selectedTemplateId && (
                  <button
                    type="button"
                    onClick={async () => {
                      setSelectedTemplateId('');
                      setTemplateNameInput(templateNameInput + ' (Copy)');
                      setTimeout(() => {
                        handleSaveTemplate();
                      }, 100);
                    }}
                    className="text-xs text-emerald-700 hover:underline font-bold"
                  >
                    Save as Copy
                  </button>
                )}
                <div className="flex justify-end gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsSaveTemplateModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveTemplate()}
                    disabled={templateSaveStatus === 'saving'}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {templateSaveStatus === 'saving' ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>

              {templateSaveStatus === 'success' && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold text-center border border-emerald-100">
                  ✓ Template saved to Firestore!
                </div>
              )}
              {templateSaveStatus === 'error' && (
                <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold text-center border border-rose-100">
                  ✗ Error saving template.
                </div>
              )}
            </div>
          </div>
        )}

        {previewLayout && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className={`p-6 bg-gradient-to-r ${LAYOUT_TEMPLATES_DATA[previewLayout].colorClass} border-b flex items-center justify-between`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${LAYOUT_TEMPLATES_DATA[previewLayout].badgeColor}`}>
                      Layout Framework
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-xl mt-1.5 flex items-center gap-2">
                    {LAYOUT_TEMPLATES_DATA[previewLayout].title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewLayout(null)}
                  className="p-1.5 rounded-xl hover:bg-black/5 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Overview</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {LAYOUT_TEMPLATES_DATA[previewLayout].description}
                  </p>
                </div>

                {/* Best For */}
                <div className="p-4 bg-teal-50/40 border border-teal-100 rounded-2xl flex items-start gap-3">
                  <div className="p-1.5 bg-teal-100 text-teal-700 rounded-lg mt-0.5 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-0.5">Best Suited For</h4>
                    <p className="text-xs text-teal-900 font-medium leading-relaxed">
                      {LAYOUT_TEMPLATES_DATA[previewLayout].bestFor}
                    </p>
                  </div>
                </div>

                {/* Lesson Stages Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Structured Stages Flow</h4>
                  <div className="relative border-l-2 border-slate-100 ml-3 pl-5 space-y-4">
                    {LAYOUT_TEMPLATES_DATA[previewLayout].stages.map((stage, sIdx) => (
                      <div key={sIdx} className="relative">
                        <span className="absolute -left-[29px] top-0.5 w-4 h-4 rounded-full bg-teal-500 border-2 border-white shadow-sm flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        </span>
                        <div className="flex items-baseline justify-between gap-2">
                          <h5 className="text-xs font-bold text-slate-800">{stage.name}</h5>
                          <span className="text-[10px] font-bold text-teal-600 px-1.5 py-0.5 bg-teal-50 rounded shrink-0">
                            {stage.duration}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{stage.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Example Snippet */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Example Output Snippet</h4>
                    {(() => {
                      const stats = calculateReadability(LAYOUT_TEMPLATES_DATA[previewLayout].sampleSnippet);
                      return (
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${stats.colorClass}`} title={`Flesch Ease: ${stats.fleschReadingEase}, ARI: ${stats.automatedReadabilityIndex}`}>
                            {stats.gradeLabel} (Grade {stats.consensusGradeLevel})
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">MARKDOWN</span>
                        </div>
                      );
                    })()}
                  </div>
                  <pre className="font-mono text-[11px] text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-x-auto whitespace-pre-wrap max-h-72 leading-relaxed shadow-inner">
                    {cleanTextForPreview(LAYOUT_TEMPLATES_DATA[previewLayout].sampleSnippet)}
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPreviewLayout(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLessonLayout(previewLayout);
                    setPreviewLayout(null);
                  }}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Use This Layout Structure</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
    </div>
  );
}
