export type QRTargetType = 'SOCRATIC_TUTOR' | 'ADAPTIVE_PATHWAY' | 'PRECONFIGURED_UDL' | 'PARENT_PLAYBOOK';

export interface QRSocraticPayload {
  documentId?: string;
  documentTitle?: string;
  socraticPrompt: string;
  suggestedQuestions?: string[];
  initialMode?: 'interactive_reader' | 'chat_tutor';
}

export interface QRAdaptivePathwayPayload {
  subject: string;
  topic: string;
  subtopic: string;
  nodeId: string;
  autoTriggerLowDifficulty: boolean;
  rootActivitiesCount?: number;
  scaffoldingNotes?: string;
}

export interface QRUDLPayload {
  useDyslexicFont: boolean;
  lineSpacing: 'normal' | 'relaxed' | 'loose';
  fontSize: 'normal' | 'large' | 'xlarge';
  adhdMilestones: boolean;
  highContrast: boolean;
  eslTargetLang?: string; // 'en' | 'sw' | 'fr' | 'es'
  simplifyVocabulary: boolean;
}

export interface QRParentPlaybookPayload {
  studentId?: string;
  studentName?: string;
  targetSection: 'progress_streaks' | 'milestones' | 'take_home_reports' | 'accessibility_sync';
  customParentMessage?: string;
}

export interface QRTargetPayload {
  socratic?: QRSocraticPayload;
  adaptive?: QRAdaptivePathwayPayload;
  udl?: QRUDLPayload;
  parent?: QRParentPlaybookPayload;
  customUrl?: string;
}

export interface QRTemplate {
  id: string;
  name: string;
  category: 'Homework' | 'Revision' | 'Accessibility' | 'Parent Outreach' | 'Lab Activity' | 'Custom';
  description: string;
  targetType: QRTargetType;
  defaultBrandColor?: string;
  defaultLabelHeader?: string;
  accessibilityNotes?: string;
  expirationDate?: string; // ISO or YYYY-MM-DD string
  targetPayload: QRTargetPayload;
  createdAt: string;
  isBuiltIn?: boolean;
}

export interface QRCodeMapping {
  qrCodeId: string;
  shortId: string;
  title: string;
  description: string;
  targetType: QRTargetType;
  physicalTouchpoint: string; // e.g., "CBC Grade 6 Science Textbook Pg 88"
  targetPayload: QRTargetPayload;
  createdByUid?: string;
  createdByName?: string;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
  brandColor?: string;
  labelHeader?: string;
  accessibilityNotes?: string;
  expirationDate?: string; // ISO or YYYY-MM-DD string
}
