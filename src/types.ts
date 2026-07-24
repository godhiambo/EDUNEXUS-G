export type DocumentType =
  | 'lesson-plan'
  | 'scheme-of-work'
  | 'lesson-notes'
  | 'lesson-notes-classic'
  | 'worksheet'
  | 'formative-assessment'
  | 'summative-assessment'
  | 'pedagogy-advisor'
  | 'flashcards';

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

export type CurriculumType = 'cbc' | 'standard';

export type UserRole = 'Teacher' | 'Administrator' | 'Student' | 'Parent';

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  suspended?: boolean;
  violationsCount?: number;
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
  lessonLayout?: 'default' | '5e-model' | 'direct-instruction' | 'inquiry-based' | 'communicative' | 'audio-lingual' | 'task-based' | 'clil' | 'flipped-classroom' | 'project-based' | 'game-based' | 'phenomenon-based';
  learnerProfile?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  paperStyle?: 'ruled' | 'grid' | 'blank';
  penColor?: 'blue' | 'black';
  handwritingIntensity?: number;
  classicNotesImageModel?: 'emgen' | 'nano banana';
  documentPageSize?: 'A4' | 'A5' | 'Letter' | 'Legal' | 'A3';
  documentLength?: 'concise' | 'standard' | 'detailed' | 'comprehensive';
}

export interface SavedDocument {
  id: string;
  title: string;
  docType: DocumentType;
  curriculum: CurriculumType;
  subject: string;
  classLevel: string;
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
  lessonLayout?: 'default' | '5e-model' | 'direct-instruction' | 'inquiry-based' | 'communicative' | 'audio-lingual' | 'task-based' | 'clil' | 'flipped-classroom' | 'project-based' | 'game-based' | 'phenomenon-based';
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
  classicNotesImageModel?: 'emgen' | 'nano banana';
  documentPageSize?: 'A4' | 'A5' | 'Letter' | 'Legal' | 'A3';
  documentLength?: 'concise' | 'standard' | 'detailed' | 'comprehensive';
  aiReview?: DocumentAIReview;
  flashcardDeck?: FlashcardDeck;
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
  lessonLayout?: 'default' | '5e-model' | 'direct-instruction' | 'inquiry-based' | 'communicative' | 'audio-lingual' | 'task-based' | 'clil' | 'flipped-classroom' | 'project-based' | 'game-based' | 'phenomenon-based';
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  paperStyle?: 'ruled' | 'grid' | 'blank';
  penColor?: 'blue' | 'black';
  handwritingIntensity?: number;
  classicNotesImageModel?: 'emgen' | 'nano banana';
  documentPageSize?: 'A4' | 'A5' | 'Letter' | 'Legal' | 'A3';
  documentLength?: 'concise' | 'standard' | 'detailed' | 'comprehensive';
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
  generateVocabulary?: boolean;
  generateDifferentiated?: boolean;
  generateParental?: boolean;
  generateDiagram?: boolean;
  diagramType?: 'flowchart' | 'concept-map';
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
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

export interface InlineComment {
  id: string;
  docId: string;
  selectedText: string;
  comment: string;
  authorUid: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
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

export interface SystemPolicies {
  imageEngineEnabled: boolean;
  videoEngineEnabled: boolean;
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


