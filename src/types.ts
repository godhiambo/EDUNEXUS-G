export type DocumentType =
  | 'lesson-plan'
  | 'scheme-of-work'
  | 'lesson-notes'
  | 'lesson-notes-classic'
  | 'worksheet'
  | 'formative-assessment'
  | 'summative-assessment'
  | 'pedagogy-advisor'
  | 'flashcards'
  | 'resource'
  | 'book'
  | 'project-based-guide';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  category?: string;
  mastered?: boolean;
  // SuperMemo SM-2 Spaced Repetition parameters
  repetition?: number; // Consecutive successful reviews (n)
  interval?: number; // Days until next review (I)
  easeFactor?: number; // Ease Factor (EF), default 2.5
  dueDate?: string; // Next scheduled review ISO date
  lastReviewed?: string; // ISO date of last practice session
}

export interface FlashcardDeck {
  id: string;
  title: string;
  description?: string;
  subject: string;
  topic: string;
  cards: Flashcard[];
  createdAt: string;
  createdBy?: string;
  sourceDocId?: string;
  isLowDifficultySupport?: boolean;
}

export type CurriculumType = 
  | 'cbc' 
  | 'kcse' 
  | 'cambridge_primary' 
  | 'igcse' 
  | 'a_level' 
  | 'ib' 
  | 'us_common_core'
  | 'cbse'
  | 'australian'
  | 'french_bac'
  | 'standard';

export type UserRole = 'Teacher' | 'Student' | 'Parent' | 'developer' | 'Administrator';

export type SubscriptionPlan = 'free' | 'premium' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual';
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due' | 'expired';

export interface UsageToday {
  aiQuestions: number;
  whatsappMsgs: number;
  images: number;
  videos: number;
  lessonPlans: number;
  documents: number;
  resetAt: string;
}

export interface SubscriptionTransaction {
  id: string;
  date: string;
  amountUSD: number;
  description: string;
  paymentMethod: string;
  receiptNo: string;
}

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: string;
  renewalDate: string;
  trialEndDate?: string;
  aiCredits: number;
  paymentMethod?: 'mpesa' | 'card' | 'paypal' | 'google_pay';
  autoRenew: boolean;
  hasUsedTrial?: boolean;
  usageToday: UsageToday;
  transactions?: SubscriptionTransaction[];
}

export interface PlanLimits {
  aiQuestionsPerDay: number; // -1 for unlimited
  whatsappMsgsPerDay: number;
  imagesPerDay: number;
  videosPerDay: number;
  lessonPlansPerDay: number;
  documentsPerDay: number;
  priorityAiQueue: boolean;
  advancedExport: boolean;
  unlimitedResearch: boolean;
}

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  suspended?: boolean;
  violationsCount?: number;
  hasSubmittedPilotFeedback?: boolean;
  subject?: string;
  curriculum?: CurriculumType;
  primaryCurriculum?: CurriculumType;
  lastActiveAt?: string;
  isOnline?: boolean;
  subscription?: UserSubscription;
  whatsappConversationMode?: 'structured' | 'flexible' | 'smart' | 'expert';
  whatsappMode?: 'structured' | 'flexible' | 'smart' | 'expert';
  whatsappSettings?: {
    conversationMode?: 'structured' | 'flexible' | 'smart' | 'expert';
    curriculum?: CurriculumType;
    primaryCurriculum?: CurriculumType;
    preferredOutputFormat?: string;
    phoneNumber?: string;
    updatedAt?: string;
  };
}

export interface AdminNotification {
  id: string;
  type: 'teacher_registered' | 'suspension_threshold_triggered' | 'manual_warning';
  title: string;
  message: string;
  userEmail: string;
  userDisplayName: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  resolved?: boolean;
  emailSent?: boolean;
}

export interface GenerationParams {
  docType: DocumentType;
  curriculum: CurriculumType;
  subject: string;
  classLevel: string;
  topic: string;
  subTopic: string;
  duration: string;
  extraPrompt: string;
  explainLikeMasterTeacher: boolean;
  askMentor?: boolean;
  generateVocabulary?: boolean;
  generateDifferentiated?: boolean;
  generateParental?: boolean;
  generateDiagram?: boolean;
  diagramType?: 'flowchart' | 'concept-map';
  lessonsPerWeek?: number;
  weeksPerTerm?: number;
  tags?: string[];
  category?: string;
  lessonLayout?: 'default' | '5e-model' | 'direct-instruction' | 'inquiry-based' | 'communicative' | 'audio-lingual' | 'task-based' | 'clil' | 'flipped-classroom' | 'project-based' | 'game-based' | 'phenomenon-based' | 'design-thinking' | 'socratic-seminar';
  learnerProfile?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  readingComplexity?: 'simple' | 'standard' | 'professional';
  paperStyle?: 'ruled' | 'grid' | 'blank';
  penColor?: 'blue' | 'black';
  handwritingIntensity?: number;
  classicNotesImageModel?: 'emgen' | 'nano banana' | 'emgen_fallback_nanobanana';
  documentPageSize?: 'A4' | 'A5' | 'Letter' | 'Legal' | 'A3';
  documentLength?: 'concise' | 'standard' | 'detailed' | 'comprehensive';
  enableSearchGrounding?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface SavedDocument {
  id: string;
  shortId?: string;
  title: string;
  docType: DocumentType;
  curriculum: CurriculumType;
  subject: string;
  classLevel: string;
  gradeLevel?: string;
  externalUrl?: string;
  topic: string;
  subTopic: string;
  duration: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  lastModified: string;
  explainLikeMasterTeacher?: boolean;
  askMentor?: boolean;
  generateVocabulary?: boolean;
  generateDifferentiated?: boolean;
  generateParental?: boolean;
  generateDiagram?: boolean;
  diagramType?: 'flowchart' | 'concept-map';
  enableSearchGrounding?: boolean;
  groundingSources?: Array<{ title: string; url: string }>;
  webSearchQueries?: string[];
  lessonsPerWeek?: number;
  weeksPerTerm?: number;
  isArchived?: boolean;
  isPinned?: boolean;
  reflectionWorked?: string;
  reflectionDidntWork?: string;
  reflectionAdjustments?: string;
  tags?: string[];
  category?: string;
  lastModifiedByUid?: string;
  lastModifiedByName?: string;
  quiz?: DocumentQuiz;
  lessonLayout?: 'default' | '5e-model' | 'direct-instruction' | 'inquiry-based' | 'communicative' | 'audio-lingual' | 'task-based' | 'clil' | 'flipped-classroom' | 'project-based' | 'game-based' | 'phenomenon-based' | 'design-thinking' | 'socratic-seminar';
  whiteboardData?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  isSharedWithColleagues?: boolean;
  sharedByUid?: string;
  sharedByName?: string;
  sharedAt?: string;
  differentiatedAdvanced?: string;
  differentiatedSupport?: string;
  differentiatedDetailed?: string;
  standardMappings?: StandardMapping[];
  learnerProfile?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  paperStyle?: 'ruled' | 'grid' | 'blank';
  penColor?: 'blue' | 'black';
  handwritingIntensity?: number;
  documentPageSize?: 'A4' | 'A5' | 'Letter' | 'Legal' | 'A3';
  pageOrientation?: 'portrait' | 'landscape';
  documentLength?: 'concise' | 'standard' | 'detailed' | 'comprehensive';
  classicNotesImageModel?: 'emgen' | 'nano banana' | 'emgen_fallback_nanobanana';
  aiReview?: DocumentAIReview;
  flashcardDeck?: FlashcardDeck;
  commentsCount?: number;
  lastCommentAt?: string;
  lastCommentBy?: string;
  sideNotesMetadata?: Array<{
    id: string;
    selectedText: string;
    comment: string;
    authorName: string;
    createdAt: string;
    category?: string;
    color?: string;
  }>;
}

export interface DocumentAIReview {
  overallScore: number;
  summary: string;
  strengths: string[];
  objectivesReview: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  curriculumReview: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  assessmentReview: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  actionPlan: string[];
  reviewedAt: string;
}

export interface StandardMapping {
  code: string;
  title: string;
  description: string;
  explanation: string;
  assessmentAlignment: string;
}

export interface QuizQuestion {
  type?: 'multiple-choice' | 'true-false' | 'fill-in-blanks' | 'short-answer';
  questionText: string;
  options?: string[];
  correctAnswerIndex?: number;
  correctAnswer?: string; // For fill-in-blanks or short-answer
  explanation: string;
}

export interface DocumentQuiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
  generatedAt: string;
}

export interface DocumentVersion {
  id: string;
  docId: string;
  title: string;
  content: string;
  pageOrientation?: 'portrait' | 'landscape';
  lastModified: string;
  modifiedByUid: string;
  modifiedByName: string;
  modifiedByEmail: string;
  versionNumber: number;
  label?: string;
}

export interface DocumentFeedback {
  id: string; // e.g. feedback-${docId}-${userId}
  docId: string;
  docTitle: string;
  docType: DocumentType;
  curriculum: CurriculumType;
  subject: string;
  topic: string;
  rating: number; // 1 to 5 stars for overall quality
  relevanceRating: number; // 1 to 5 stars for alignment relevance
  writtenFeedback: string;
  voiceNoteUrl?: string; // Base64 or object URL string
  voiceNoteDuration?: number; // Duration of voice note in seconds
  authorUid: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
}

export interface DocumentDraft {
  id: string;
  userId: string;
  curriculum: CurriculumType;
  docType: DocumentType;
  subject: string;
  customSubject: string;
  classLevel: string;
  topic: string;
  subTopic: string;
  duration: string;
  extraPrompt: string;
  explainLikeMasterTeacher: boolean;
  askMentor: boolean;
  mentorScaffoldingContext?: string;
  generateVocabulary?: boolean;
  generateDifferentiated?: boolean;
  generateParental?: boolean;
  generateDiagram?: boolean;
  diagramType?: 'flowchart' | 'concept-map';
  lessonsPerWeek?: number;
  weeksPerTerm?: number;
  lastSaved: string;
  draftName: string;
  tags?: string[];
  category?: string;
  lessonLayout?: 'default' | '5e-model' | 'direct-instruction' | 'inquiry-based' | 'communicative' | 'audio-lingual' | 'task-based' | 'clil' | 'flipped-classroom' | 'project-based' | 'game-based' | 'phenomenon-based' | 'design-thinking' | 'socratic-seminar';
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  paperStyle?: 'ruled' | 'grid' | 'blank';
  penColor?: 'blue' | 'black';
  handwritingIntensity?: number;
  classicNotesImageModel?: 'emgen' | 'nano banana';
  documentPageSize?: 'A4' | 'A5' | 'Letter' | 'Legal' | 'A3';
  documentLength?: 'concise' | 'standard' | 'detailed' | 'comprehensive';
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface PromptTemplate {
  id: string;
  userId: string;
  templateName: string;
  description: string;
  docType: DocumentType;
  curriculum: CurriculumType;
  extraPrompt: string;
  explainLikeMasterTeacher: boolean;
  askMentor: boolean;
  mentorScaffoldingContext?: string;
  generateVocabulary?: boolean;
  generateDifferentiated?: boolean;
  generateParental?: boolean;
  generateDiagram?: boolean;
  diagramType?: 'flowchart' | 'concept-map';
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  lessonLayout?: string;
  lastSaved: string;
}

export const SUBJECT_OPTIONS = [
  'Mathematics',
  'English Language',
  'Kiswahili',
  'Science & Technology',
  'Social Studies',
  'CRE (Christian Religious Education)',
  'IRE (Islamic Religious Education)',
  'Agriculture & Nutrition',
  'Creative Arts & Sports',
  'Pre-Technical Studies',
  'Integrated Science',
  'Health Education',
  'Home Science',
  'Foreign Language',
  'Computer Science / ICT',
  'General Studies',
  'Mathematical Activities',
  'Language Activities',
  'Environmental Activities',
  'Psychomotor & Creative Activities',
  'Religious Education Activities'
];

export const GRADE_OPTIONS_CBC = [
  'Playgroup',
  'Pre-Primary 1 (PP1)',
  'Pre-Primary 2 (PP2)',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Junior School: Grade 7',
  'Junior School: Grade 8',
  'Junior School: Grade 9',
  'Senior School: Grade 10',
  'Senior School: Grade 11',
  'Senior School: Grade 12'
];

export const GRADE_OPTIONS_STANDARD = [
  'Nursery',
  'Kindergarten',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Class 7',
  'Class 8',
  'Form 1 (Grade 9)',
  'Form 2 (Grade 10)',
  'Form 3 (Grade 11)',
  'Form 4 (Grade 12)'
];

export const GRADE_OPTIONS_KCSE = [
  'Primary: Class 1',
  'Primary: Class 2',
  'Primary: Class 3',
  'Primary: Class 4',
  'Primary: Class 5',
  'Primary: Class 6',
  'Primary: Class 7',
  'Primary: Class 8 (KCPE)',
  'Secondary: Form 1',
  'Secondary: Form 2',
  'Secondary: Form 3',
  'Secondary: Form 4 (KCSE)'
];

export const GRADE_OPTIONS_CAMBRIDGE_PRIMARY = [
  'Stage 1 (Year 1 / Primary 1)',
  'Stage 2 (Year 2 / Primary 2)',
  'Stage 3 (Year 3 / Primary 3)',
  'Stage 4 (Year 4 / Primary 4)',
  'Stage 5 (Year 5 / Primary 5)',
  'Stage 6 (Year 6 / Checkpoint Primary)',
  'Stage 7 (Year 7 / Lower Sec 1)',
  'Stage 8 (Year 8 / Lower Sec 2)',
  'Stage 9 (Year 9 / Checkpoint Lower Sec)'
];

export const GRADE_OPTIONS_IGCSE = [
  'IGCSE Year 10 (IGCSE Stage 1)',
  'IGCSE Year 11 (IGCSE Final Exams)',
  'Grade 9 (IGCSE Core/Extended)',
  'Grade 10 (IGCSE Core/Extended)'
];

export const GRADE_OPTIONS_A_LEVEL = [
  'AS Level (Year 12 / Lower Sixth)',
  'A2 Level (Year 13 / Upper Sixth)',
  'Cambridge International A Level'
];

export const GRADE_OPTIONS_IB = [
  'IB MYP 1 (Grade 6)',
  'IB MYP 2 (Grade 7)',
  'IB MYP 3 (Grade 8)',
  'IB MYP 4 (Grade 9)',
  'IB MYP 5 (Grade 10)',
  'IB DP 1 (Grade 11 / SL & HL)',
  'IB DP 2 (Grade 12 / SL & HL)'
];

export const GRADE_OPTIONS_US_COMMON_CORE = [
  'Kindergarten',
  'Grade 1 (Elementary)',
  'Grade 2 (Elementary)',
  'Grade 3 (Elementary)',
  'Grade 4 (Elementary)',
  'Grade 5 (Elementary)',
  'Grade 6 (Middle School)',
  'Grade 7 (Middle School)',
  'Grade 8 (Middle School)',
  'Grade 9 (High School / Freshman)',
  'Grade 10 (High School / Sophomore)',
  'Grade 11 (High School / Junior - AP)',
  'Grade 12 (High School / Senior - AP)'
];

export const GRADE_OPTIONS_CBSE = [
  'Class 1 (Primary)',
  'Class 2 (Primary)',
  'Class 3 (Primary)',
  'Class 4 (Primary)',
  'Class 5 (Primary)',
  'Class 6 (Middle)',
  'Class 7 (Middle)',
  'Class 8 (Middle)',
  'Class 9 (Secondary)',
  'Class 10 (Secondary Board Exams)',
  'Class 11 (Senior Secondary)',
  'Class 12 (Senior Secondary Board Exams)'
];

export const GRADE_OPTIONS_AUSTRALIAN = [
  'Foundation / Prep / Reception',
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'Year 7 (Lower Secondary)',
  'Year 8',
  'Year 9',
  'Year 10 (Secondary)',
  'Year 11 (Senior Secondary / ATAR)',
  'Year 12 (Senior Secondary / HSC/VCE)'
];

export const GRADE_OPTIONS_FRENCH_BAC = [
  'École Élémentaire: CP (Cours Préparatoire)',
  'École Élémentaire: CE1 (Cours Élémentaire 1)',
  'École Élémentaire: CE2 (Cours Élémentaire 2)',
  'École Élémentaire: CM1 (Cours Moyen 1)',
  'École Élémentaire: CM2 (Cours Moyen 2)',
  'Collège: 6ème (Sixième)',
  'Collège: 5ème (Cinquième)',
  'Collège: 4ème (Quatrième)',
  'Collège: 3ème (Troisième - Brevet)',
  'Lycée: Seconde (2de)',
  'Lycée: Première (1re - Bac Général/Techno)',
  'Lycée: Terminale (Baccalauréat)'
];

export function getGradeOptionsForCurriculum(curriculum?: CurriculumType): string[] {
  switch (curriculum) {
    case 'cbc':
      return GRADE_OPTIONS_CBC;
    case 'kcse':
      return GRADE_OPTIONS_KCSE;
    case 'cambridge_primary':
      return GRADE_OPTIONS_CAMBRIDGE_PRIMARY;
    case 'igcse':
      return GRADE_OPTIONS_IGCSE;
    case 'a_level':
      return GRADE_OPTIONS_A_LEVEL;
    case 'ib':
      return GRADE_OPTIONS_IB;
    case 'us_common_core':
      return GRADE_OPTIONS_US_COMMON_CORE;
    case 'cbse':
      return GRADE_OPTIONS_CBSE;
    case 'australian':
      return GRADE_OPTIONS_AUSTRALIAN;
    case 'french_bac':
      return GRADE_OPTIONS_FRENCH_BAC;
    case 'standard':
    default:
      return GRADE_OPTIONS_STANDARD;
  }
}

export interface CurriculumMeta {
  id: CurriculumType;
  label: string;
  shortLabel: string;
  flag: string;
  region: string;
  description: string;
  badge: string;
  accentColor: string;
}

export const ALL_CURRICULA_METADATA: CurriculumMeta[] = [
  {
    id: 'cbc',
    label: 'Kenya Competency-Based Curriculum (CBC)',
    shortLabel: 'Kenyan CBC',
    flag: '🇰🇪',
    region: 'Kenya (KICD)',
    description: 'Learner-centred, competency-based, strands/sub-strands, KIQs, core competencies & values.',
    badge: 'PP1 - Grade 12',
    accentColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'kcse',
    label: 'Kenya 8-4-4 / KCSE System',
    shortLabel: 'Kenya 8-4-4',
    flag: '🇰🇪',
    region: 'Kenya (KNEC)',
    description: 'Content mastery, KNEC examination preparation, Bloom taxonomy, structured notes.',
    badge: 'Class 1 - Form 4',
    accentColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
  },
  {
    id: 'cambridge_primary',
    label: 'Cambridge Primary & Lower Secondary',
    shortLabel: 'Cambridge Primary',
    flag: '🇬🇧',
    region: 'UK / CAIE International',
    description: 'Spiral learning objectives, Checkpoint exams, active learning & success criteria.',
    badge: 'Stages 1 - 9',
    accentColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
  },
  {
    id: 'igcse',
    label: 'Cambridge / Edexcel IGCSE & O-Level',
    shortLabel: 'Cambridge IGCSE',
    flag: '🌍',
    region: 'International (CAIE / Pearson)',
    description: 'Core/Extended tiering, AO1-AO3 objectives, exam command words & past paper drills.',
    badge: 'Years 10 - 11',
    accentColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
  },
  {
    id: 'a_level',
    label: 'Cambridge AS & A Level',
    shortLabel: 'Cambridge A Level',
    flag: '🌍',
    region: 'International (CAIE / Pearson)',
    description: 'Advanced academic rigor, derivations, practical lab skills, higher-order synthesis.',
    badge: 'Years 12 - 13 (AS/A2)',
    accentColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
  },
  {
    id: 'ib',
    label: 'International Baccalaureate (IB PYP / MYP / DP)',
    shortLabel: 'IB World School',
    flag: '🌐',
    region: 'Global (IBO)',
    description: 'Inquiry-led, Statement of Inquiry, Key Concepts, ATL skills & Criterion A-D rubrics.',
    badge: 'PYP / MYP / DP SL & HL',
    accentColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
  },
  {
    id: 'us_common_core',
    label: 'US Common Core, NGSS & AP',
    shortLabel: 'US Common Core',
    flag: '🇺🇸',
    region: 'United States & AP Schools',
    description: 'CCSS standards, NGSS 3D learning, Depth of Knowledge (DOK) & AP rigor.',
    badge: 'K-12 & AP Courses',
    accentColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
  },
  {
    id: 'cbse',
    label: 'Indian CBSE & ICSE System',
    shortLabel: 'CBSE / ICSE',
    flag: '🇮🇳',
    region: 'India & International Schools',
    description: 'NCERT framework, competency-based questions, Board Exam preparation & HOTS.',
    badge: 'Class 1 - 12 Board',
    accentColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30'
  },
  {
    id: 'australian',
    label: 'Australian Curriculum (ACARA)',
    shortLabel: 'Australian ACARA',
    flag: '🇦🇺',
    region: 'Australia & Oceania',
    description: 'General capabilities, cross-curriculum priorities, achievement standards & ATAR.',
    badge: 'Foundation - Year 12',
    accentColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30'
  },
  {
    id: 'french_bac',
    label: 'French Baccalauréat System',
    shortLabel: 'French Bac',
    flag: '🇫🇷',
    region: 'France & AEFE Schools',
    description: 'Socle commun de connaissances, grand oral, analyse critique & programme officiel.',
    badge: 'CP - Terminale',
    accentColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30'
  },
  {
    id: 'standard',
    label: 'Standard / Universal Outcomes Syllabus',
    shortLabel: 'Standard Syllabus',
    flag: '🗺️',
    region: 'Universal / Global',
    description: 'Outcomes-based instructional sequence, essential questions & flexible framework.',
    badge: 'All Grade Levels',
    accentColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30'
  }
];

export function getCurriculumMeta(curriculum?: CurriculumType): CurriculumMeta {
  const meta = ALL_CURRICULA_METADATA.find((m) => m.id === curriculum);
  if (meta) return meta;
  return ALL_CURRICULA_METADATA.find((m) => m.id === 'standard') || ALL_CURRICULA_METADATA[0];
}

export function getCurriculumLabel(curriculum?: CurriculumType): string {
  return getCurriculumMeta(curriculum).shortLabel;
}

export function getCurriculumTutorName(curriculum?: CurriculumType): string {
  const meta = getCurriculumMeta(curriculum);
  switch (meta.id) {
    case 'cbc':
      return 'EduNexus CBC Tutor';
    case 'kcse':
      return 'EduNexus 8-4-4 Tutor';
    case 'cambridge_primary':
      return 'EduNexus Cambridge Primary Tutor';
    case 'igcse':
      return 'EduNexus Cambridge IGCSE Tutor';
    case 'a_level':
      return 'EduNexus Cambridge A Level Tutor';
    case 'ib':
      return 'EduNexus IB Tutor';
    case 'us_common_core':
      return 'EduNexus US Common Core Tutor';
    case 'cbse':
      return 'EduNexus CBSE / ICSE Tutor';
    case 'australian':
      return 'EduNexus Australian ACARA Tutor';
    case 'french_bac':
      return 'EduNexus French Bac Tutor';
    case 'standard':
    default:
      return `EduNexus ${meta.shortLabel} Tutor`;
  }
}

export interface CommentReply {
  id: string;
  authorUid: string;
  authorName: string;
  authorEmail: string;
  text: string;
  createdAt: string;
}

export interface InlineComment {
  id: string;
  docId: string;
  selectedText: string;
  comment: string;
  authorUid: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  category?: 'General' | 'Pedagogical Note' | 'Question' | 'Correction' | 'Teaching Tip' | 'Differentiated Guidance';
  color?: 'yellow' | 'green' | 'pink' | 'blue';
  resolved?: boolean;
  replies?: CommentReply[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  action: 'login' | 'view' | 'generate' | 'edit' | 'delete' | 'comment' | 'create' | 'feedback' | 'system';
  details: string;
  documentId?: string | null;
  documentTitle?: string | null;
  timestamp: string;
}

export interface ParagraphReaction {
  id: string;
  docId: string;
  paragraphText: string;
  emoji: string; // 👍, 💡, 📝
  userUid: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}

export interface PeerFeedback {
  id: string;
  docId: string;
  docTitle: string;
  docType: DocumentType;
  rating: number;
  comment: string;
  authorUid: string;
  authorName: string;
  authorRole: string;
  authorEmail: string;
  createdAt: string;
}

export interface DocumentAnnotation {
  id: string;
  docId: string;
  selectedText: string;
  note: string;
  authorUid: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  color?: 'yellow' | 'green' | 'pink' | 'blue';
}

export interface ParentTeacherMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderRole: string;
  recipientUid: string;
  recipientName: string;
  recipientRole: string;
  docId?: string;
  docTitle?: string;
  text: string;
  createdAt: string;
  read?: boolean;
  audioUrl?: string;
  audioDuration?: number;
}

export interface AppNotification {
  id: string;
  docId: string;
  docTitle: string;
  docTopic: string;
  scheduledDateTime: string;
  type: '1day' | '30min' | '5min';
  timestamp: number;
  read: boolean;
  message: string;
}

export interface QuestionBankItem {
  id: string;
  userId: string;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blanks' | 'short-answer';
  questionText: string;
  options?: string[];
  correctAnswerIndex?: number;
  correctAnswer?: string;
  explanation: string;
  gradeLevel: string;
  subject: string;
  topic?: string;
  curriculum?: CurriculumType;
  createdAt: string;
}
export interface LearningPathTopic {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: string;
}

export interface LearningPathResource {
  id: string;
  title: string;
  type: string;
  url: string;
  description: string;
}

export interface LearningPathActivity {
  id: string;
  step: number;
  title: string;
  description: string;
  deliverable: string;
}

export interface PersonalizedLearningPath {
  id?: string;
  userId?: string;
  subject: string;
  knowledgeLevel: string;
  objectives: string;
  additionalInfo?: string;
  title: string;
  description: string;
  estimatedDuration: string;
  skillsTargeted: string[];
  topics: LearningPathTopic[];
  recommendedResources: LearningPathResource[];
  activities: LearningPathActivity[];
  createdAt?: string;
  subtopicConfidence?: Record<string, 'low' | 'medium' | 'high'>;
}

export type AllowedAction =
  | 'material-generation'
  | 'video-compilation'
  | 'image-generation'
  | 'socratic-tutor'
  | 'collaboration-sharing'
  | 'assessment-generation';

export interface UserOverride {
  allowMaterialGeneration?: boolean;
  allowVideoCompilation?: boolean;
  allowImageGeneration?: boolean;
  allowSocraticTutor?: boolean;
  allowCollaborationSharing?: boolean;
  allowAssessmentGeneration?: boolean;
}

export type AIEngineMode = 'emgen_fallback_nanobanana' | 'emgen_only' | 'nanobanana_only';

export interface SystemPolicies {
  imageEngineEnabled: boolean;
  videoEngineEnabled: boolean;
  aiEngineMode?: AIEngineMode;
  allowMaterialGeneration: boolean;
  allowVideoCompilation: boolean;
  allowImageGeneration: boolean;
  allowSocraticTutor: boolean;
  allowCollaborationSharing: boolean;
  allowAssessmentGeneration: boolean;
  userOverrides: { [uid: string]: UserOverride };
  forceMasterTeacherMode?: boolean;
}

export interface CbcLessonDetails {
  lessonsPerWeek: number;
  isStem: boolean;
  hasDoubleLesson: boolean;
  distribution: string;
}

export function getCbcLessonDetails(grade: string, subject: string): CbcLessonDetails {
  const isGrade4to6 = ['Grade 4', 'Grade 5', 'Grade 6'].includes(grade);
  const isGrade7to9 = ['Junior School: Grade 7', 'Junior School: Grade 8', 'Junior School: Grade 9'].includes(grade);
  const isGrade10to12 = ['Senior School: Grade 10', 'Senior School: Grade 11', 'Senior School: Grade 12'].includes(grade);

  const subLower = (subject || '').toLowerCase();

  // Determine STEM subjects
  // "except in stem subjects hich has one double lesson and 3 single lessons,mathematics either core or essential has no double lesson; the rest are each single lessons"
  const isMath = subLower.includes('mathematics') || subLower.includes('math');
  const isStem = !isMath && (
    subLower.includes('science & technology') ||
    subLower.includes('integrated science') ||
    subLower.includes('chemistry') ||
    subLower.includes('physics') ||
    subLower.includes('biology') ||
    subLower.includes('computer') ||
    subLower.includes('ict') ||
    subLower.includes('pre-technical')
  );

  let lessons = 4; // default fallback

  if (isGrade4to6) {
    if (isMath) {
      lessons = 5;
    } else if (subLower.includes('english')) {
      lessons = 5;
    } else if (subLower.includes('kiswahili') || subLower.includes('ksl')) {
      lessons = 4;
    } else if (subLower.includes('science & technology') || subLower.includes('science')) {
      lessons = 4;
    } else if (subLower.includes('agriculture & nutrition') || subLower.includes('agriculture') || subLower.includes('nutrition')) {
      lessons = 4;
    } else if (subLower.includes('creative arts') || subLower.includes('sports')) {
      lessons = 4;
    } else if (subLower.includes('social studies')) {
      lessons = 4;
    } else if (subLower.includes('religious') || subLower.includes('cre') || subLower.includes('ire') || subLower.includes('hre')) {
      lessons = 3;
    }
  } else if (isGrade7to9) {
    if (isMath) {
      lessons = 5;
    } else if (subLower.includes('english')) {
      lessons = 5;
    } else if (subLower.includes('kiswahili') || subLower.includes('ksl')) {
      lessons = 4;
    } else if (subLower.includes('integrated science')) {
      lessons = 4;
    } else if (subLower.includes('pre-technical')) {
      lessons = 4;
    } else if (subLower.includes('social studies')) {
      lessons = 3;
    } else if (subLower.includes('religious') || subLower.includes('cre') || subLower.includes('ire') || subLower.includes('hre')) {
      lessons = 3;
    } else if (subLower.includes('agriculture & nutrition') || subLower.includes('agriculture') || subLower.includes('nutrition') || subLower.includes('home science')) {
      lessons = 4;
    } else if (subLower.includes('creative arts') || subLower.includes('sports')) {
      lessons = 4;
    } else if (subLower.includes('health education')) {
      lessons = 2;
    } else if (subLower.includes('life skills')) {
      lessons = 1;
    } else if (subLower.includes('physical education') || subLower.includes('pe')) {
      lessons = 2;
    }
  } else if (isGrade10to12) {
    if (subLower.includes('english')) {
      lessons = 5;
    } else if (subLower.includes('kiswahili') || subLower.includes('ksl') || subLower.includes('kenyan sign')) {
      lessons = 5;
    } else if (isMath) { // Core Mathematics for STEM or Essential Mathematics
      lessons = 5;
    } else if (subLower.includes('community service') || subLower.includes('csl')) {
      lessons = 3;
    } else if (
      // Elective Pathways: Biology, Physics, Chemistry, History, Geography, Fine Arts, Music, Home Science
      subLower.includes('biology') ||
      subLower.includes('physics') ||
      subLower.includes('chemistry') ||
      subLower.includes('history') ||
      subLower.includes('geography') ||
      subLower.includes('fine arts') ||
      subLower.includes('music') ||
      subLower.includes('home science')
    ) {
      lessons = 5;
    } else if (subLower.includes('physical education') || subLower.includes('pe')) {
      lessons = 3;
    } else if (subLower.includes('ict') || subLower.includes('digital literacy') || subLower.includes('computer')) {
      lessons = 2;
    } else if (subLower.includes('pastoral') || subLower.includes('ppi') || subLower.includes('lesson study')) {
      lessons = 2;
    }
  }

  const hasDoubleLesson = isStem;
  
  let distribution = "";
  if (isMath) {
    distribution = `${lessons} single lessons (No double lessons allowed for Core/Essential Mathematics)`;
  } else if (isStem) {
    const singleCount = lessons - 2; // double lesson counts as 2 periods
    if (singleCount > 0) {
      distribution = `1 double lesson (80 mins) and ${singleCount} single lessons (${lessons} total periods/week)`;
    } else {
      distribution = `1 double lesson (80 mins) (${lessons} total periods/week)`;
    }
  } else {
    distribution = `${lessons} single lessons (No double lessons allowed for this subject)`;
  }

  return {
    lessonsPerWeek: lessons,
    isStem,
    hasDoubleLesson,
    distribution
  };
}


