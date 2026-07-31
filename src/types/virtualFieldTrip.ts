export interface FieldTripCheckpoint {
  id: string;
  label: string;
  hint?: string;
  isCompleted: boolean;
  rewardPoints: number;
}

export interface ForeignLanguageCue {
  phrase: string;
  language: string; // e.g. 'French', 'Swahili', 'Spanish', 'Latin', 'Japanese', 'Arabic'
  translation: string;
  phoneticSpelling?: string;
  usageContext: string;
}

export interface EducatorNote {
  id: string;
  authorName: string;
  role?: string;
  noteText: string;
  pedagogicalFocus: 'discussion_prompt' | 'historical_context' | 'scientific_insight' | 'misconception_alert' | 'curriculum_connection';
  isMilestoneLocked?: boolean;
  requiredMilestoneCount?: number;
  addedAt?: string;
}

export interface MapPinAnnotation {
  id: string;
  xPercentage: number; // 0 to 100 relative to viewer container width
  yPercentage: number; // 0 to 100 relative to viewer container height
  title: string;
  note: string;
  category: 'historical_fact' | 'architectural_detail' | 'media_link' | 'question_prompt' | 'custom_label';
  mediaUrl?: string;
  authorName?: string;
  createdAt?: string;
  audioDescriptionText?: string; // 30-second audio description script
  audioDescriptionUrl?: string;  // attached audio URL/data URL
  autoPlayOnArrive?: boolean;    // auto-play audio description when student arrives at milestone
}

export interface FieldTripStickyNote {
  id: string;
  routeId: string;
  stopNumber: number;
  locationName?: string;
  lat?: number;
  lng?: number;
  xPercentage: number; // 0 to 100 on viewer stage overlay
  yPercentage: number; // 0 to 100 on viewer stage overlay
  text: string;
  authorUid: string;
  authorName: string;
  authorRole: 'Teacher' | 'Student' | 'Administrator';
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'amber';
  category: 'question' | 'insight' | 'discovery' | 'flag' | 'general';
  likesCount: number;
  likedByUids?: string[];
  createdAt: string;
}

export interface MediaGalleryItem {
  id: string;
  type: 'photo' | 'panorama_360' | 'video' | 'detail_diagram';
  url: string;
  caption: string;
  credit?: string;
}

export interface VirtualFieldTripStop {
  stopNumber: number;
  title: string;
  locationName: string;
  lat: number;
  lng: number;
  zoom: number;
  mapType: 'roadmap' | 'satellite' | 'streetview' | 'video' | 'panorama';
  streetViewPov?: { heading: number; pitch: number };
  panoramaUrl?: string; // High-res 360 panoramic photo URL
  videoUrl?: string; // Documentary video embed URL
  readingPassage: string;
  foreignLanguageCues: ForeignLanguageCue[];
  navigationInstruction: string;
  socraticGuidePrompts: string[];
  checkpoints: FieldTripCheckpoint[];
  educatorNotes?: EducatorNote[];
  annotations?: MapPinAnnotation[];
  mediaGallery?: MediaGalleryItem[];
}

export interface VirtualFieldTripRoute {
  id: string;
  title: string;
  destination: string;
  country: string;
  subject: string;
  gradeLevel: string;
  coverImage: string;
  description: string;
  primaryLanguage: string; // e.g., 'English with French Cues', 'English with Kiswahili Cues'
  stops: VirtualFieldTripStop[];
  createdBy: string;
  createdAt: string;
  isPreset?: boolean;
}

export interface ExitSlipAnswers {
  understandingScore: number; // 1 to 5
  keyObservation: string; // Question 1: What major historical or geographical feature did you observe?
  foreignLanguageReflection: string; // Question 2: Which foreign language cue or directional phrase did you use?
  confidenceLevel: 'high' | 'medium' | 'needs_review';
  completedAt: string;
}

export interface TripRating {
  stars: number; // 1 to 5
  comment: string;
  ratedAt: string;
}

export interface SocraticJournalStopEntry {
  stopNumber: number;
  stopTitle: string;
  locationName: string;
  observations: string; // What did you observe at this location?
  hypothesis: string; // What hypothesis or explanation can you form about why it works or exists this way?
  causeAndEffect: string; // What trade-offs, systems, or cause-and-effect relationships did you discover?
  vocabularyLearned: string[]; // Foreign language cues or technical terms noted
  questionsRemaining: string; // What Socratic questions or curiosities do you still have?
  updatedAt: string;
}

export interface SocraticTravelJournal {
  routeId: string;
  tripTitle: string;
  studentName?: string;
  summaryReflection: string;
  stopEntries: Record<number, SocraticJournalStopEntry>;
  isSubmitted: boolean;
  lastSavedAt: string;
}

export interface StudentExcursionProgress {
  routeId: string;
  currentStopIndex: number;
  completedStopIndices: number[];
  completedCheckpointIds: string[];
  streakCount: number;
  exitSlip?: ExitSlipAnswers;
  tripRating?: TripRating;
  journal?: SocraticTravelJournal;
  startedAt: string;
  lastActiveAt: string;
}

export interface LessonPlanStopGuidance {
  stopNumber: number;
  stopTitle: string;
  teacherScript: string;
  socraticQuestions: string[];
  studentActionItem: string;
}

export interface LessonPlanRubricItem {
  criterion: string;
  beginning: string;
  proficient: string;
  exemplary: string;
}

export interface VirtualFieldTripLessonPlan {
  lessonTitle: string;
  subject: string;
  gradeLevel: string;
  durationMinutes: number;
  overview: string;
  learningOutcomes: string[];
  cbcCompetencies: string[];
  materialsAndEquipment: string[];
  preTripPreparation: string[];
  stopByStopGuidance: LessonPlanStopGuidance[];
  postTripAssessment: {
    exitSlipPrompt: string;
    rubricCriteria: LessonPlanRubricItem[];
    extensionActivities: string[];
  };
  differentiationStrategies: {
    forSupport: string;
    forExtension: string;
  };
}

export interface LeaderboardPrivacySettings {
  isPublicOnLeaderboard: boolean; // default true, if false user is hidden from leaderboard
  showFullName: boolean;          // default true, if false shows anonymous alias
  allowBadgeSharing: boolean;     // default true, if false hides badges on leaderboard
  anonymousAlias?: string;        // e.g. "Explorer #42"
}

export interface ClassroomLeaderboardEntry {
  id: string;
  studentName: string;
  avatarUrl?: string;
  totalXP: number;
  level: number;
  levelTitle: string;
  milestonesCompleted: number;
  exitSlipsCompleted: number;
  isCurrentUser: boolean;
  isAnonymous: boolean;
  badgeCount: number;
  badges: string[];
  lastActive: string;
}

