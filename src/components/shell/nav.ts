import {
  Home,
  FileText,
  ClipboardCheck,
  MessageCircleQuestion,
  FolderOpen,
  Globe,
  Mic,
  BarChart3,
  Users,
  Image as ImageIcon,
  Video,
  Map,
  QrCode,
  Volume2,
  Wand2,
  BookOpen,
  ShieldAlert,
  Settings,
  type LucideIcon,
} from 'lucide-react';

/** Every screen the signed-in app can show. Mirrors App.tsx `activeTab`. */
export type AppTab =
  | 'dashboard' | 'create' | 'view' | 'admin' | 'playbook' | 'settings' | 'resources'
  | 'collaboration' | 'voice-notes' | 'tutor' | 'assessment-generator' | 'file-library'
  | 'image-studio' | 'video-studio' | 'performance' | 'phonetics' | 'qr-mapping'
  | 'virtual-field-trip' | 'magic-objects';

export interface NavItem {
  tab: AppTab;
  label: string;
  icon: LucideIcon;
  /** Only shown to the platform owner. */
  developerOnly?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * One link per real screen, labelled with what the screen actually is.
 * (Previously 22 links pointed at 13 screens — e.g. "To-Do List" opened Voice Notes.)
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Teach',
    items: [
      { tab: 'dashboard', label: 'Home', icon: Home },
      { tab: 'create', label: 'Lesson Plans', icon: FileText },
      { tab: 'assessment-generator', label: 'Assessments', icon: ClipboardCheck },
      { tab: 'tutor', label: 'AI Tutor', icon: MessageCircleQuestion },
    ],
  },
  {
    title: 'Library',
    items: [
      { tab: 'file-library', label: 'My Files', icon: FolderOpen },
      { tab: 'resources', label: 'Resource Explorer', icon: Globe },
      { tab: 'voice-notes', label: 'Voice Notes', icon: Mic },
    ],
  },
  {
    title: 'Classes',
    items: [
      { tab: 'performance', label: 'Learner Performance', icon: BarChart3 },
      { tab: 'collaboration', label: 'Staff Collaboration', icon: Users },
    ],
  },
  {
    title: 'Studios',
    items: [
      { tab: 'image-studio', label: 'Image Studio', icon: ImageIcon },
      { tab: 'video-studio', label: 'Video Studio', icon: Video },
      { tab: 'virtual-field-trip', label: 'Virtual Field Trips', icon: Map },
      { tab: 'qr-mapping', label: 'QR Hunts', icon: QrCode },
      { tab: 'phonetics', label: 'Visual Phonetics', icon: Volume2 },
      { tab: 'magic-objects', label: 'Magic Objects', icon: Wand2 },
    ],
  },
  {
    title: 'Help',
    items: [
      { tab: 'playbook', label: 'Playbook', icon: BookOpen },
      { tab: 'settings', label: 'Settings', icon: Settings },
      { tab: 'admin', label: 'Developer Console', icon: ShieldAlert, developerOnly: true },
    ],
  },
];

/** Short, plain page titles and one-line descriptions for the shared page header. */
export const PAGE_META: Record<AppTab, { title: string; description: string }> = {
  dashboard: { title: 'Home', description: 'Your lessons, classes and shortcuts in one place.' },
  create: { title: 'Lesson Plans', description: 'Generate CBC-aligned lesson plans, notes, schemes of work and worksheets.' },
  view: { title: 'Document', description: 'Edit, print or export this document.' },
  admin: { title: 'Developer Console', description: 'Platform users, policies, AI usage and system health.' },
  playbook: { title: 'Playbook', description: 'How each EduNexus module works, with step-by-step guides.' },
  settings: { title: 'Settings', description: 'Profile, appearance, curriculum defaults and account.' },
  resources: { title: 'Resource Explorer', description: 'Find simulations, worksheets and reference books to use in your lessons.' },
  collaboration: { title: 'Staff Collaboration', description: 'Share materials and feedback with colleagues at your school.' },
  'voice-notes': { title: 'Voice Notes', description: 'Record or dictate notes, then turn them into summaries and mind maps.' },
  tutor: { title: 'AI Tutor', description: 'A Socratic tutor that guides learners with questions and hints.' },
  'assessment-generator': { title: 'Assessments', description: 'Create quizzes, CATs and exams with marking keys.' },
  'file-library': { title: 'My Files', description: 'Upload and organise curriculum guides, syllabi and reference sheets.' },
  'image-studio': { title: 'Image Studio', description: 'Generate diagrams and illustrations for your lessons.' },
  'video-studio': { title: 'Video Studio', description: 'Plan lesson videos and short clips with scripts and storyboards.' },
  performance: { title: 'Learner Performance', description: 'Record scores and see class progress by subject and strand.' },
  phonetics: { title: 'Visual Phonetics', description: 'Animated mouth and tongue positions for every English sound.' },
  'qr-mapping': { title: 'QR Hunts', description: 'Design printable QR scavenger hunts and link codes to your materials.' },
  'virtual-field-trip': { title: 'Virtual Field Trips', description: 'Guided 360° explorations with audio and activities.' },
  'magic-objects': { title: 'Magic Objects', description: 'Tap an object to generate a lower-primary lesson, rhyme or story.' },
};
