import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  HelpCircle, 
  Sparkles, 
  Check, 
  X, 
  ArrowRight,
  BookOpen,
  Users,
  FolderOpen,
  Image as ImageIcon,
  Settings as SettingsIcon,
  GraduationCap,
  Keyboard,
  LogOut,
  PlusCircle,
  Play,
  Type,
  Video,
  Award,
  Sliders,
  Shield,
  VolumeX,
  Compass,
  Zap,
  Activity,
  Search,
  Filter,
  Layers,
  MousePointer,
  Command,
  FileText,
  Gauge,
  Volume1,
  Pause,
  Square,
  Globe
} from 'lucide-react';

interface VoiceNavigationProps {
  onTabChange: (tab: 'dashboard' | 'create' | 'view' | 'admin' | 'settings' | 'resources' | 'collaboration' | 'voice-notes' | 'tutor' | 'assessment-generator' | 'file-library' | 'image-studio' | 'video-studio' | 'performance' | 'phonetics') => void;
  onNewDoc: () => void;
  onShortcutsToggle: (open: boolean) => void;
  onPlayChime: () => void;
  onLogout: () => void;
  currentTab: string;
}

export default function VoiceNavigation({
  onTabChange,
  onNewDoc,
  onShortcutsToggle,
  onPlayChime,
  onLogout,
  currentTab
}: VoiceNavigationProps) {
  const { aiLanguage } = useLanguage();
  const {
    useDyslexicFont,
    setUseDyslexicFont,
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    playbackSpeed,
    setPlaybackSpeed,
    ttsPitch,
    setTtsPitch
  } = useAccessibility();

  const [isListening, setIsListening] = useState(false);
  const [handsFreeMode, setHandsFreeMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('voice_nav_hands_free') === 'true';
    } catch {
      return false;
    }
  });
  const [speechSupported, setSpeechSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [voiceSpokenFeedback, setVoiceSpokenFeedback] = useState<boolean>(true);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [cheatSheetSearch, setCheatSheetSearch] = useState('');
  const [selectedCheatSheetCategory, setSelectedCheatSheetCategory] = useState<'all' | 'navigation' | 'tools' | 'accessibility' | 'scrolling' | 'confidence'>('all');
  const [currentlySpeakingCmdId, setCurrentlySpeakingCmdId] = useState<string | null>(null);
  const [isReadingAllCommands, setIsReadingAllCommands] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to resolve locale code and human label based on aiLanguage context
  const getTtsLocaleForAiLanguage = (aiLang: string) => {
    const normalized = (aiLang || 'en').toLowerCase().trim();
    switch (normalized) {
      case 'sw':
      case 'swahili':
      case 'kiswahili':
        return { code: 'sw-KE', label: 'sw-KE', name: 'Kiswahili (Swahili)' };
      case 'fr':
      case 'french':
        return { code: 'fr-FR', label: 'fr-FR', name: 'Français (French)' };
      case 'es':
      case 'spanish':
        return { code: 'es-ES', label: 'es-ES', name: 'Español (Spanish)' };
      case 'de':
      case 'german':
        return { code: 'de-DE', label: 'de-DE', name: 'Deutsch (German)' };
      case 'zh':
      case 'chinese':
        return { code: 'zh-CN', label: 'zh-CN', name: 'Mandarin (Chinese)' };
      case 'ar':
      case 'arabic':
        return { code: 'ar-SA', label: 'ar-SA', name: 'العربية (Arabic)' };
      case 'en':
      case 'english':
      default:
        return { code: 'en-US', label: 'en-US', name: 'English (US)' };
    }
  };

  // Configure SpeechSynthesisUtterance with auto-detected AI language voice locale
  const configureUtteranceLocale = (utterance: SpeechSynthesisUtterance, aiLang: string) => {
    const ttsInfo = getTtsLocaleForAiLanguage(aiLang);
    utterance.lang = ttsInfo.code;

    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langCodePrefix = aiLang.toLowerCase();
        const localeCodeLower = ttsInfo.code.toLowerCase();
        const match = voices.find(
          v => v.lang.toLowerCase() === localeCodeLower || 
               v.lang.toLowerCase().startsWith(langCodePrefix) || 
               v.lang.replace('_', '-').toLowerCase().startsWith(localeCodeLower)
        );
        if (match) {
          utterance.voice = match;
        }
      }
    }
  };

  // Spoken verbal feedback helper for motor/visual assistance
  const speakVerbalConfirmation = (text: string) => {
    if (!voiceSpokenFeedback || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      configureUtteranceLocale(utterance, aiLanguage);
      utterance.rate = playbackSpeed || 1.0;
      utterance.pitch = ttsPitch || 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingCmdId(null);
    setIsReadingAllCommands(false);
  };

  const speakCommandAloud = (cmdId: string, textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      if (currentlySpeakingCmdId === cmdId) {
        setCurrentlySpeakingCmdId(null);
        return;
      }
      setIsReadingAllCommands(false);
      setCurrentlySpeakingCmdId(cmdId);
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      configureUtteranceLocale(utterance, aiLanguage);
      utterance.rate = playbackSpeed || 1.0;
      utterance.pitch = ttsPitch || 1.0;
      utterance.onend = () => setCurrentlySpeakingCmdId(null);
      utterance.onerror = () => setCurrentlySpeakingCmdId(null);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
      setCurrentlySpeakingCmdId(null);
    }
  };

  // Check browser support for Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      const ttsInfo = getTtsLocaleForAiLanguage(aiLanguage);
      rec.lang = ttsInfo.code;

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += trans;
          } else {
            interimTranscript += trans;
          }
        }

        const activeText = finalTranscript || interimTranscript;
        if (activeText) {
          setTranscript(activeText);
        }

        if (finalTranscript) {
          parseVoiceCommand(finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone blocked. Please grant microphone permission in browser address bar.');
        } else {
          setErrorMsg(`Error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        // If hands-free mode for severe motor disability is active, automatically restart listening
        if (handsFreeMode && recognitionRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (e) {
              console.warn('Auto-restart error:', e);
            }
          }, 300);
        }
      };

      recognitionRef.current = rec;
    }
  }, [handsFreeMode]);

  // Keep speech recognition locale aligned when aiLanguage context updates
  useEffect(() => {
    if (recognitionRef.current) {
      const ttsInfo = getTtsLocaleForAiLanguage(aiLanguage);
      recognitionRef.current.lang = ttsInfo.code;
    }
  }, [aiLanguage]);

  const triggerSuccessFeedback = (commandName: string) => {
    setLastCommand(commandName);
    onPlayChime(); // Audio chime confirmation
    speakVerbalConfirmation(commandName); // Spoken audio confirmation for hands-free support

    // Clear last command text after a delay
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    commandTimeoutRef.current = setTimeout(() => {
      setLastCommand(null);
      setTranscript('');
    }, 4000);
  };

  const parseVoiceCommand = (text: string) => {
    const cleaned = text.toLowerCase().trim();

    // 1. Navigation Commands
    if (
      cleaned.includes("student playbook") ||
      cleaned.includes("open student playbook") ||
      cleaned.includes("go to student playbook") ||
      cleaned.includes("open performance") ||
      cleaned.includes("go to performance") ||
      cleaned.includes("learners performance")
    ) {
      onTabChange("performance");
      triggerSuccessFeedback("Opened Student Playbook");
    }
    else if (
      cleaned.includes("admin panel") ||
      cleaned.includes("open admin panel") ||
      cleaned.includes("admin playbook") ||
      cleaned.includes("open admin playbook")
    ) {
      onTabChange("admin");
      triggerSuccessFeedback("Opened Admin Panel");
    }
    else if (
      cleaned.includes("go to dashboard") || 
      cleaned.includes("go to my library") || 
      cleaned.includes("open dashboard") || 
      cleaned.includes("open my library") ||
      cleaned.includes("show library") ||
      cleaned.includes("open library")
    ) {
      onTabChange("dashboard");
      triggerSuccessFeedback("Switched to My Library");
    } 
    else if (
      cleaned.includes("phonetics") ||
      cleaned.includes("open phonetics") ||
      cleaned.includes("visual phonetics") ||
      cleaned.includes("phonetics studio")
    ) {
      onTabChange("phonetics");
      triggerSuccessFeedback("Opened Visual Phonetics Studio");
    }
    else if (
      cleaned.includes("video studio") ||
      cleaned.includes("open video studio") ||
      cleaned.includes("video generator")
    ) {
      onTabChange("video-studio");
      triggerSuccessFeedback("Opened Video Studio");
    }
    else if (
      cleaned.includes("global resources") ||
      cleaned.includes("open resources") ||
      cleaned.includes("go to resources")
    ) {
      onTabChange("resources");
      triggerSuccessFeedback("Opened Global Resources");
    }
    else if (
      cleaned.includes("go to collaboration") || 
      cleaned.includes("open collaboration") || 
      cleaned.includes("collaboration hub") ||
      cleaned.includes("go to collab") ||
      cleaned.includes("open collab")
    ) {
      onTabChange("collaboration");
      triggerSuccessFeedback("Switched to Collaboration Hub");
    } 
    else if (
      cleaned.includes("audio note") || 
      cleaned.includes("voice note") || 
      cleaned.includes("audio notes") || 
      cleaned.includes("voice notes") || 
      cleaned.includes("mindmap") || 
      cleaned.includes("mind map") ||
      cleaned.includes("open audio notes") ||
      cleaned.includes("open voice notes")
    ) {
      onTabChange("voice-notes");
      triggerSuccessFeedback("Switched to Audio Notes & Mindmaps");
    } 
    else if (
      cleaned.includes("go to tutor") || 
      cleaned.includes("open tutor") || 
      cleaned.includes("go to socratic tutor") ||
      cleaned.includes("ai tutor") ||
      cleaned.includes("open ai tutor") ||
      cleaned.includes("nexused ai tutor") ||
      cleaned.includes("open nexused ai tutor")
    ) {
      onTabChange("tutor");
      triggerSuccessFeedback("Switched to EduNexus AI Tutor");
    } 
    else if (
      cleaned.includes("file library") || 
      cleaned.includes("open file library") || 
      cleaned.includes("open files") ||
      cleaned.includes("go to files")
    ) {
      onTabChange("file-library");
      triggerSuccessFeedback("Switched to File Library");
    } 
    else if (
      cleaned.includes("image studio") || 
      cleaned.includes("open image studio") || 
      cleaned.includes("image generator") ||
      cleaned.includes("open studio") ||
      cleaned.includes("go to studio")
    ) {
      onTabChange("image-studio");
      triggerSuccessFeedback("Switched to Image Studio");
    } 
    else if (
      cleaned.includes("assessment generator") || 
      cleaned.includes("open assessment") || 
      cleaned.includes("assessment items") ||
      cleaned.includes("go to assessment") ||
      cleaned.includes("quiz generator")
    ) {
      onTabChange("assessment-generator");
      triggerSuccessFeedback("Switched to Assessment Generator");
    } 
    else if (
      cleaned.includes("go to settings") || 
      cleaned.includes("open settings") || 
      cleaned.includes("open configuration")
    ) {
      onTabChange("settings");
      triggerSuccessFeedback("Switched to Workspace Settings");
    } 
    else if (
      cleaned.includes("new lesson plan") || 
      cleaned.includes("create lesson plan") || 
      cleaned.includes("new document") || 
      cleaned.includes("create document") ||
      cleaned.includes("open creator")
    ) {
      onNewDoc();
      triggerSuccessFeedback("Started New Lesson Plan");
    } 

    // 2. Accessibility & Typography Dictation Commands
    else if (
      cleaned.includes("toggle dyslexic font") ||
      cleaned.includes("dyslexic font") ||
      cleaned.includes("enable dyslexic font") ||
      cleaned.includes("disable dyslexic font") ||
      cleaned.includes("open dyslexic font")
    ) {
      const nextVal = !useDyslexicFont;
      setUseDyslexicFont(nextVal);
      triggerSuccessFeedback(nextVal ? "Dyslexic Font Enabled" : "Dyslexic Font Disabled");
    }
    else if (
      cleaned.includes("toggle high contrast") ||
      cleaned.includes("enable high contrast") ||
      cleaned.includes("disable high contrast") ||
      cleaned.includes("high contrast")
    ) {
      const nextVal = !highContrast;
      setHighContrast(nextVal);
      triggerSuccessFeedback(nextVal ? "High Contrast Enabled" : "High Contrast Disabled");
    }
    else if (
      cleaned.includes("increase font size") ||
      cleaned.includes("font size large") ||
      cleaned.includes("make text bigger") ||
      cleaned.includes("large text")
    ) {
      setFontSize('large');
      triggerSuccessFeedback("Font Size Set to Large");
    }
    else if (
      cleaned.includes("extra large font") ||
      cleaned.includes("font size extra large") ||
      cleaned.includes("make text huge")
    ) {
      setFontSize('xlarge');
      triggerSuccessFeedback("Font Size Set to Extra Large");
    }
    else if (
      cleaned.includes("reset font size") ||
      cleaned.includes("font size normal") ||
      cleaned.includes("normal font")
    ) {
      setFontSize('normal');
      triggerSuccessFeedback("Font Size Reset to Normal");
    }

    // 3. Topic Confidence Rating Commands
    else if (
      cleaned.includes("rate topic confidence low") ||
      cleaned.includes("confidence low") ||
      cleaned.includes("rate confidence low") ||
      cleaned.includes("topic confidence low") ||
      cleaned.includes("confidence level low")
    ) {
      window.dispatchEvent(new CustomEvent('voice_rate_confidence', { detail: { level: 'low' } }));
      localStorage.setItem('voice_confidence_rating', 'low');
      triggerSuccessFeedback("Rated Topic Confidence: Low");
    }
    else if (
      cleaned.includes("rate topic confidence medium") ||
      cleaned.includes("confidence medium") ||
      cleaned.includes("rate confidence medium") ||
      cleaned.includes("topic confidence medium") ||
      cleaned.includes("confidence level medium")
    ) {
      window.dispatchEvent(new CustomEvent('voice_rate_confidence', { detail: { level: 'medium' } }));
      localStorage.setItem('voice_confidence_rating', 'medium');
      triggerSuccessFeedback("Rated Topic Confidence: Medium");
    }
    else if (
      cleaned.includes("rate topic confidence high") ||
      cleaned.includes("confidence high") ||
      cleaned.includes("rate confidence high") ||
      cleaned.includes("topic confidence high") ||
      cleaned.includes("confidence level high")
    ) {
      window.dispatchEvent(new CustomEvent('voice_rate_confidence', { detail: { level: 'high' } }));
      localStorage.setItem('voice_confidence_rating', 'high');
      triggerSuccessFeedback("Rated Topic Confidence: High");
    }

    // 4. Hands-free Page Scrolling Commands
    else if (cleaned.includes("scroll down") || cleaned.includes("page down")) {
      window.scrollBy({ top: 400, behavior: 'smooth' });
      triggerSuccessFeedback("Scrolled Down");
    }
    else if (cleaned.includes("scroll up") || cleaned.includes("page up")) {
      window.scrollBy({ top: -400, behavior: 'smooth' });
      triggerSuccessFeedback("Scrolled Up");
    }
    else if (cleaned.includes("scroll to top") || cleaned.includes("go to top")) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      triggerSuccessFeedback("Scrolled to Top");
    }
    else if (cleaned.includes("scroll to bottom") || cleaned.includes("go to bottom")) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      triggerSuccessFeedback("Scrolled to Bottom");
    }

    // 5. Utility & Modal Controls
    else if (
      cleaned.includes("open shortcut") || 
      cleaned.includes("show shortcut") || 
      cleaned.includes("keyboard shortcut") ||
      cleaned.includes("open shortcuts") ||
      cleaned.includes("show shortcuts")
    ) {
      onShortcutsToggle(true);
      triggerSuccessFeedback("Opened Keyboard Shortcuts");
    } 
    else if (
      cleaned.includes("close shortcut") || 
      cleaned.includes("hide shortcut") ||
      cleaned.includes("close shortcuts") || 
      cleaned.includes("hide shortcuts")
    ) {
      onShortcutsToggle(false);
      triggerSuccessFeedback("Closed Keyboard Shortcuts");
    } 
    else if (
      cleaned.includes("play chime") || 
      cleaned.includes("ring bell") || 
      cleaned.includes("test sound") || 
      cleaned.includes("play sound")
    ) {
      onPlayChime();
      triggerSuccessFeedback("Tested Chime Feedback");
    } 
    else if (
      cleaned.includes("log out") || 
      cleaned.includes("sign out")
    ) {
      onLogout();
      triggerSuccessFeedback("Triggered Sign Out");
    }
    else if (
      cleaned.includes("open cheat sheet") ||
      cleaned.includes("show cheat sheet") ||
      cleaned.includes("voice cheat sheet") ||
      cleaned.includes("voice commands") ||
      cleaned.includes("command guide") ||
      cleaned.includes("voice help")
    ) {
      setIsCheatSheetOpen(true);
      triggerSuccessFeedback("Opened Voice Command Cheat Sheet");
    }
  };

  const commandCatalog = [
    // Navigation
    {
      id: 'nav-library',
      phrase: 'Go to dashboard',
      aliases: ['open my library', 'show library', 'open library'],
      description: 'Navigates directly to your primary Document Library dashboard.',
      category: 'navigation' as const,
      icon: BookOpen,
      actionText: 'Switches to Library View',
      action: () => { onTabChange('dashboard'); triggerSuccessFeedback('Switched to My Library'); }
    },
    {
      id: 'nav-tutor',
      phrase: 'Open AI Tutor',
      aliases: ['go to tutor', 'socratic tutor', 'nexused ai tutor'],
      description: 'Launches the interactive AI Socratic Tutor assistant.',
      category: 'navigation' as const,
      icon: GraduationCap,
      actionText: 'Switches to AI Tutor',
      action: () => { onTabChange('tutor'); triggerSuccessFeedback('Switched to EduNexus AI Tutor'); }
    },
    {
      id: 'nav-playbook',
      phrase: 'Open Student Playbook',
      aliases: ['go to performance', 'learners performance'],
      description: 'Opens student progress, mastery analytics, and learning metrics.',
      category: 'navigation' as const,
      icon: Award,
      actionText: 'Switches to Student Playbook',
      action: () => { onTabChange('performance'); triggerSuccessFeedback('Opened Student Playbook'); }
    },
    {
      id: 'nav-phonetics',
      phrase: 'Open Visual Phonetics',
      aliases: ['phonetics studio', 'visual phonetics'],
      description: 'Opens phonetics and speech pronunciation studio.',
      category: 'navigation' as const,
      icon: Volume2,
      actionText: 'Switches to Phonetics Studio',
      action: () => { onTabChange('phonetics'); triggerSuccessFeedback('Opened Visual Phonetics Studio'); }
    },
    {
      id: 'nav-video',
      phrase: 'Open Video Studio',
      aliases: ['video generator', 'video studio'],
      description: 'Opens AI video studio for lesson media generation.',
      category: 'navigation' as const,
      icon: Video,
      actionText: 'Switches to Video Studio',
      action: () => { onTabChange('video-studio'); triggerSuccessFeedback('Opened Video Studio'); }
    },
    {
      id: 'nav-resources',
      phrase: 'Open Global Resources',
      aliases: ['global resources', 'go to resources'],
      description: 'Accesses shared teaching resources and curriculum templates.',
      category: 'navigation' as const,
      icon: FolderOpen,
      actionText: 'Switches to Global Resources',
      action: () => { onTabChange('resources'); triggerSuccessFeedback('Opened Global Resources'); }
    },
    {
      id: 'nav-collab',
      phrase: 'Open Collaboration',
      aliases: ['collaboration hub', 'open collab'],
      description: 'Accesses shared team notes, real-time feedback, and teacher hub.',
      category: 'navigation' as const,
      icon: Users,
      actionText: 'Switches to Collaboration Hub',
      action: () => { onTabChange('collaboration'); triggerSuccessFeedback('Switched to Collaboration Hub'); }
    },
    {
      id: 'nav-voice-notes',
      phrase: 'Open Audio Notes',
      aliases: ['voice notes', 'mindmap', 'open mind map'],
      description: 'Launches audio notes recording and automatic concept mindmapping.',
      category: 'navigation' as const,
      icon: Mic,
      actionText: 'Switches to Audio Notes & Mindmaps',
      action: () => { onTabChange('voice-notes'); triggerSuccessFeedback('Switched to Audio Notes & Mindmaps'); }
    },
    {
      id: 'nav-files',
      phrase: 'Open File Library',
      aliases: ['file library', 'open files'],
      description: 'Browse uploaded documents, PDFs, media assets, and storage.',
      category: 'navigation' as const,
      icon: FileText,
      actionText: 'Switches to File Library',
      action: () => { onTabChange('file-library'); triggerSuccessFeedback('Switched to File Library'); }
    },
    {
      id: 'nav-images',
      phrase: 'Open Image Studio',
      aliases: ['image generator', 'go to studio'],
      description: 'Generates educational illustrations and diagram graphics.',
      category: 'navigation' as const,
      icon: ImageIcon,
      actionText: 'Switches to Image Studio',
      action: () => { onTabChange('image-studio'); triggerSuccessFeedback('Switched to Image Studio'); }
    },
    {
      id: 'nav-assessment',
      phrase: 'Open Assessment Generator',
      aliases: ['quiz generator', 'open assessment'],
      description: 'Generates quizzes, rubrics, and diagnostic test items.',
      category: 'navigation' as const,
      icon: Zap,
      actionText: 'Switches to Assessment Generator',
      action: () => { onTabChange('assessment-generator'); triggerSuccessFeedback('Switched to Assessment Generator'); }
    },
    {
      id: 'nav-settings',
      phrase: 'Open Settings',
      aliases: ['go to settings', 'open configuration'],
      description: 'Configures audio devices, accessibility, TTS, and profile options.',
      category: 'navigation' as const,
      icon: SettingsIcon,
      actionText: 'Switches to Settings',
      action: () => { onTabChange('settings'); triggerSuccessFeedback('Switched to Workspace Settings'); }
    },
    {
      id: 'nav-admin',
      phrase: 'Open Admin Panel',
      aliases: ['admin playbook', 'go to admin'],
      description: 'Opens administrative controls, user management, and system logs.',
      category: 'navigation' as const,
      icon: Shield,
      actionText: 'Switches to Admin Panel',
      action: () => { onTabChange('admin'); triggerSuccessFeedback('Opened Admin Panel'); }
    },

    // Tools & Actions
    {
      id: 'tool-new-doc',
      phrase: 'New Lesson Plan',
      aliases: ['create document', 'new document', 'open creator'],
      description: 'Starts a brand-new AI lesson plan or curriculum document.',
      category: 'tools' as const,
      icon: PlusCircle,
      actionText: 'Creates New Document',
      action: () => { onNewDoc(); triggerSuccessFeedback('Started New Lesson Plan'); }
    },
    {
      id: 'tool-shortcuts',
      phrase: 'Open Keyboard Shortcuts',
      aliases: ['show shortcuts', 'keyboard shortcuts'],
      description: 'Displays overlay modal with all system keyboard hotkeys.',
      category: 'tools' as const,
      icon: Keyboard,
      actionText: 'Opens Hotkeys Overlay',
      action: () => { onShortcutsToggle(true); triggerSuccessFeedback('Opened Keyboard Shortcuts'); }
    },
    {
      id: 'tool-chime',
      phrase: 'Play Chime Sound',
      aliases: ['ring bell', 'test sound'],
      description: 'Plays audio confirmation chime for testing speaker feedback.',
      category: 'tools' as const,
      icon: Volume2,
      actionText: 'Triggers Audio Chime',
      action: () => { onPlayChime(); triggerSuccessFeedback('Tested Chime Feedback'); }
    },
    {
      id: 'tool-logout',
      phrase: 'Log Out',
      aliases: ['sign out'],
      description: 'Safely ends the current user session and signs out.',
      category: 'tools' as const,
      icon: LogOut,
      actionText: 'Signs Out User',
      action: () => { onLogout(); triggerSuccessFeedback('Triggered Sign Out'); }
    },

    // Accessibility & Typography
    {
      id: 'acc-dyslexic',
      phrase: 'Toggle Dyslexic Font',
      aliases: ['dyslexic font', 'enable dyslexic font'],
      description: 'Switches the font family to OpenDyslexic for enhanced readability.',
      category: 'accessibility' as const,
      icon: Type,
      actionText: 'Toggles Dyslexic Typography',
      action: () => {
        const nextVal = !useDyslexicFont;
        setUseDyslexicFont(nextVal);
        triggerSuccessFeedback(nextVal ? "Dyslexic Font Enabled" : "Dyslexic Font Disabled");
      }
    },
    {
      id: 'acc-contrast',
      phrase: 'Toggle High Contrast',
      aliases: ['enable high contrast', 'high contrast'],
      description: 'Increases element border and background contrast for visual clarity.',
      category: 'accessibility' as const,
      icon: Sliders,
      actionText: 'Toggles Contrast Mode',
      action: () => {
        const nextVal = !highContrast;
        setHighContrast(nextVal);
        triggerSuccessFeedback(nextVal ? "High Contrast Enabled" : "High Contrast Disabled");
      }
    },
    {
      id: 'acc-font-large',
      phrase: 'Increase Font Size',
      aliases: ['make text bigger', 'large text'],
      description: 'Enlarges global system body text size to Large.',
      category: 'accessibility' as const,
      icon: Type,
      actionText: 'Sets Font to Large',
      action: () => { setFontSize('large'); triggerSuccessFeedback("Font Size Set to Large"); }
    },
    {
      id: 'acc-font-xlarge',
      phrase: 'Extra Large Font',
      aliases: ['make text huge', 'font size extra large'],
      description: 'Enlarges global text size to Extra Large for high visibility.',
      category: 'accessibility' as const,
      icon: Type,
      actionText: 'Sets Font to Extra Large',
      action: () => { setFontSize('xlarge'); triggerSuccessFeedback("Font Size Set to Extra Large"); }
    },
    {
      id: 'acc-font-normal',
      phrase: 'Reset Font Size',
      aliases: ['font size normal', 'normal font'],
      description: 'Resets font sizing back to standard default scale.',
      category: 'accessibility' as const,
      icon: Type,
      actionText: 'Resets Font to Normal',
      action: () => { setFontSize('normal'); triggerSuccessFeedback("Font Size Reset to Normal"); }
    },

    // Page Motion & Scrolling
    {
      id: 'scroll-down',
      phrase: 'Scroll Down',
      aliases: ['page down'],
      description: 'Smoothly scrolls down the active view by 400 pixels.',
      category: 'scrolling' as const,
      icon: Compass,
      actionText: 'Scrolls Page Down',
      action: () => { window.scrollBy({ top: 400, behavior: 'smooth' }); triggerSuccessFeedback("Scrolled Down"); }
    },
    {
      id: 'scroll-up',
      phrase: 'Scroll Up',
      aliases: ['page up'],
      description: 'Smoothly scrolls up the active view by 400 pixels.',
      category: 'scrolling' as const,
      icon: Compass,
      actionText: 'Scrolls Page Up',
      action: () => { window.scrollBy({ top: -400, behavior: 'smooth' }); triggerSuccessFeedback("Scrolled Up"); }
    },
    {
      id: 'scroll-top',
      phrase: 'Scroll to Top',
      aliases: ['go to top'],
      description: 'Instantly scrolls back to the very top of the page.',
      category: 'scrolling' as const,
      icon: Compass,
      actionText: 'Scrolls to Top',
      action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); triggerSuccessFeedback("Scrolled to Top"); }
    },
    {
      id: 'scroll-bottom',
      phrase: 'Scroll to Bottom',
      aliases: ['go to bottom'],
      description: 'Scrolls to the bottom edge of the document canvas.',
      category: 'scrolling' as const,
      icon: Compass,
      actionText: 'Scrolls to Bottom',
      action: () => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); triggerSuccessFeedback("Scrolled to Bottom"); }
    },

    // Topic Confidence Rating
    {
      id: 'rate-low',
      phrase: 'Rate Topic Confidence Low',
      aliases: ['confidence low', 'topic confidence low'],
      description: 'Logs a Low confidence rating for active concept tracking.',
      category: 'confidence' as const,
      icon: Zap,
      actionText: 'Logs Confidence: Low',
      action: () => {
        window.dispatchEvent(new CustomEvent('voice_rate_confidence', { detail: { level: 'low' } }));
        localStorage.setItem('voice_confidence_rating', 'low');
        triggerSuccessFeedback("Rated Topic Confidence: Low");
      }
    },
    {
      id: 'rate-medium',
      phrase: 'Rate Topic Confidence Medium',
      aliases: ['confidence medium', 'topic confidence medium'],
      description: 'Logs a Medium confidence rating for learning progression.',
      category: 'confidence' as const,
      icon: Zap,
      actionText: 'Logs Confidence: Medium',
      action: () => {
        window.dispatchEvent(new CustomEvent('voice_rate_confidence', { detail: { level: 'medium' } }));
        localStorage.setItem('voice_confidence_rating', 'medium');
        triggerSuccessFeedback("Rated Topic Confidence: Medium");
      }
    },
    {
      id: 'rate-high',
      phrase: 'Rate Topic Confidence High',
      aliases: ['confidence high', 'topic confidence high'],
      description: 'Logs a High confidence rating for topic mastery.',
      category: 'confidence' as const,
      icon: Zap,
      actionText: 'Logs Confidence: High',
      action: () => {
        window.dispatchEvent(new CustomEvent('voice_rate_confidence', { detail: { level: 'high' } }));
        localStorage.setItem('voice_confidence_rating', 'high');
        triggerSuccessFeedback("Rated Topic Confidence: High");
      }
    }
  ];

  const filteredCommands = commandCatalog.filter(cmd => {
    const matchesCategory = selectedCheatSheetCategory === 'all' || cmd.category === selectedCheatSheetCategory;
    const q = cheatSheetSearch.toLowerCase().trim();
    const matchesSearch = !q || 
      cmd.phrase.toLowerCase().includes(q) || 
      cmd.description.toLowerCase().includes(q) ||
      cmd.aliases.some(a => a.toLowerCase().includes(q)) ||
      cmd.actionText.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const readAllCheatSheetCommands = () => {
    if (!('speechSynthesis' in window) || filteredCommands.length === 0) return;
    window.speechSynthesis.cancel();
    if (isReadingAllCommands) {
      setIsReadingAllCommands(false);
      setCurrentlySpeakingCmdId(null);
      return;
    }

    setIsReadingAllCommands(true);
    let index = 0;

    const speakNext = () => {
      if (index >= filteredCommands.length) {
        setIsReadingAllCommands(false);
        setCurrentlySpeakingCmdId(null);
        return;
      }

      const cmd = filteredCommands[index];
      setCurrentlySpeakingCmdId(cmd.id);
      const text = `Command: ${cmd.phrase}. ${cmd.description}`;
      const utterance = new SpeechSynthesisUtterance(text);
      configureUtteranceLocale(utterance, aiLanguage);
      utterance.rate = playbackSpeed || 1.0;
      utterance.pitch = ttsPitch || 1.0;
      utterance.onend = () => {
        index++;
        setTimeout(() => speakNext(), 300);
      };
      utterance.onerror = () => {
        setIsReadingAllCommands(false);
        setCurrentlySpeakingCmdId(null);
      };
      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const startListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    setErrorMsg(null);
    setTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setShowHelper(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleHandsFreeMode = () => {
    const nextVal = !handsFreeMode;
    setHandsFreeMode(nextVal);
    localStorage.setItem('voice_nav_hands_free', nextVal ? 'true' : 'false');
    if (nextVal && !isListening) {
      startListening();
    }
  };

  return (
    <div id="voice-navigation-container" className="relative">
      {/* Navbar Micro Toggle Button */}
      <motion.button
        id="voice-nav-trigger"
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleListening}
        className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer relative border ${
          isListening 
            ? 'bg-[#5f6f52] text-white border-[#5f6f52] shadow-md shadow-[#5f6f52]/20' 
            : 'bg-white text-slate-500 hover:text-[#5f6f52] border-slate-200 hover:border-[#5f6f52] hover:bg-slate-50 shadow-xs'
        }`}
        title={isListening ? "Listening... Click to stop voice navigation" : "Start Hands-Free Voice Commands"}
      >
        {isListening ? (
          <>
            <motion.div 
              className="absolute inset-0 rounded-xl bg-[#5f6f52]/25"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <Mic className="w-4.5 h-4.5 relative z-10 animate-pulse text-white" />
          </>
        ) : (
          <Mic className="w-4.5 h-4.5" />
        )}
      </motion.button>

      {/* Floating Hands-Free Voice HUD Panel */}
      <AnimatePresence>
        {showHelper && (
          <motion.div
            id="voice-nav-hud"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 mt-3 w-84 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4.5 overflow-hidden text-slate-700 max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isListening ? 'bg-[#5f6f52]/10 text-[#5f6f52]' : 'bg-slate-100 text-slate-400'}`}>
                  <Zap className="w-4 h-4 text-[#5f6f52]" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-xs text-slate-800 leading-tight flex items-center gap-1.5">
                    <span>Hands-Free Voice Command HUD</span>
                    <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-black uppercase">
                      Motor Assist
                    </span>
                  </h4>
                  <p className="text-[9.5px] text-slate-400 font-medium">Overarching platform control for motor accessibility</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHelper(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Continuous Listening Hands-Free Toggle */}
            <div className="flex items-center justify-between p-2 bg-indigo-50/60 border border-indigo-100 rounded-xl mb-3 text-xs">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
                <div>
                  <span className="font-bold text-slate-800 text-[11px] block leading-none">Auto-Restart Hands-Free</span>
                  <span className="text-[9px] text-slate-500">Continuous listening for severe disabilities</span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleHandsFreeMode}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                  handsFreeMode
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {handsFreeMode ? 'ON ✓' : 'OFF'}
              </button>
            </div>

            {/* Live Waveform Indicator & Transcript */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 mb-3 relative">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isListening ? 'text-[#5f6f52]' : 'text-slate-400'}`}>
                  {isListening ? 'Listening for dictation...' : 'Microphone Paused'}
                </span>
                
                {isListening && (
                  <div className="flex items-center gap-1 h-5">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <motion.div
                        key={bar}
                        className="w-0.75 bg-[#5f6f52] rounded-full"
                        animate={{
                          height: [6, 18, 6],
                        }}
                        transition={{
                          duration: 0.5 + bar * 0.12,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {errorMsg ? (
                <p className="text-[10px] text-red-500 font-semibold leading-tight">{errorMsg}</p>
              ) : (
                <div className="min-h-8 flex flex-col justify-center">
                  {transcript ? (
                    <p className="text-xs font-medium text-slate-800 leading-normal italic">
                      &ldquo;{transcript}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 leading-normal italic">
                      {isListening ? "Say 'Open Student Playbook', 'Toggle dyslexic font', or 'Rate topic confidence low'..." : "Click microphone button or turn on Auto-Restart to speak."}
                    </p>
                  )}
                </div>
              )}

              {/* Action Toolbar */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <button
                  onClick={toggleListening}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    isListening
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-[#5f6f52] text-white hover:bg-[#4d5a42]'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3 h-3" />
                      <span>Pause Listening</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3" />
                      <span>Start Listening</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  {/* TTS Speed Rate Selector */}
                  <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-lg px-1.5 py-1 text-[9.5px] font-bold text-slate-600">
                    <Gauge className="w-3 h-3 text-[#5f6f52] mr-1 shrink-0" />
                    <select
                      value={playbackSpeed || 1.0}
                      onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                      className="bg-transparent font-bold text-slate-700 cursor-pointer focus:outline-none text-[10px]"
                      title="Adjust TTS Speech Rate"
                    >
                      <option value="0.75">0.75x (Slow)</option>
                      <option value="1.0">1.0x (Normal)</option>
                      <option value="1.25">1.25x (Brisk)</option>
                      <option value="1.5">1.5x (Fast)</option>
                      <option value="1.75">1.75x (Faster)</option>
                      <option value="2.0">2.0x (Max)</option>
                    </select>
                  </div>

                  {/* TTS Pitch Selector */}
                  <div className="flex items-center bg-purple-50 border border-purple-200/80 rounded-lg px-1.5 py-1 text-[9.5px] font-bold text-purple-700">
                    <Sliders className="w-3 h-3 text-purple-600 mr-1 shrink-0" />
                    <select
                      value={(ttsPitch || 1.0).toFixed(2)}
                      onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                      className="bg-transparent font-bold text-purple-900 cursor-pointer focus:outline-none text-[10px]"
                      title="Adjust Classroom Voice Pitch"
                    >
                      <option value="0.70">0.70 Pitch (Deep)</option>
                      <option value="0.85">0.85 Pitch (Warm)</option>
                      <option value="1.00">1.00 Pitch (Normal)</option>
                      <option value="1.15">1.15 Pitch (Crisp)</option>
                      <option value="1.30">1.30 Pitch (High)</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setVoiceSpokenFeedback(prev => !prev)}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                      voiceSpokenFeedback
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                    title="Spoken Verbal Confirmation Feedback"
                  >
                    {voiceSpokenFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onPlayChime()}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
                    title="Test Chime Sound"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Executed Command Confirmation Toast */}
            <AnimatePresence>
              {lastCommand && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -5 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -5 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 mb-3 flex items-center gap-2 text-emerald-800"
                >
                  <div className="bg-emerald-500 text-white rounded-full p-0.5 shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="text-[10.5px] font-extrabold leading-tight flex-1">
                    Executed: <span className="underline">{lastCommand}</span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dictation Command Categories */}
            <div className="space-y-2">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block">
                Motor Accessibility Command Cheat Sheet
              </span>
              <div className="grid grid-cols-1 gap-1.5 text-[10px]">
                {/* Command 1: Student Playbook */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition">
                  <Award className="w-3.5 h-3.5 text-[#5f6f52]" />
                  <span className="font-semibold text-slate-700 flex-1">&ldquo;Open Student Playbook&rdquo;</span>
                  <span className="text-[8px] bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-500 font-mono">
                    Performance
                  </span>
                </div>

                {/* Command 2: Dyslexic Font */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition">
                  <Type className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-semibold text-slate-700 flex-1">&ldquo;Toggle dyslexic font&rdquo;</span>
                  <span className="text-[8px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded font-mono">
                    Typography
                  </span>
                </div>

                {/* Command 3: Topic Confidence Low/High */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-semibold text-slate-700 flex-1">&ldquo;Rate topic confidence low&rdquo;</span>
                  <span className="text-[8px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-mono">
                    Rating
                  </span>
                </div>

                {/* Command 4: Scroll Down/Up */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition">
                  <Compass className="w-3.5 h-3.5 text-cyan-600" />
                  <span className="font-semibold text-slate-700 flex-1">&ldquo;Scroll down / Scroll to top&rdquo;</span>
                  <span className="text-[8px] bg-cyan-50 text-cyan-700 px-1.5 py-0.2 rounded font-mono">
                    Scrolling
                  </span>
                </div>

                {/* Command 5: Visual Phonetics */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold text-slate-700 flex-1">&ldquo;Open Visual Phonetics&rdquo;</span>
                  <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-mono">
                    Speech
                  </span>
                </div>
              </div>

              <p className="text-[9.5px] text-slate-400 font-medium leading-normal pt-1.5 text-center">
                Also supports: <span className="italic font-semibold">&ldquo;Toggle high contrast&rdquo;, &ldquo;Increase font size&rdquo;, &ldquo;Open File Library&rdquo;, &ldquo;Open AI Tutor&rdquo;, &ldquo;New lesson plan&rdquo;</span>.
              </p>

              {/* Launch Interactive Full Command Cheat Sheet Button */}
              <button
                type="button"
                onClick={() => setIsCheatSheetOpen(true)}
                className="w-full mt-2 py-2 px-3 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>View Full Voice Command Cheat Sheet</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Interactive Voice Command Cheat Sheet Overlay Modal */}
      <AnimatePresence>
        {isCheatSheetOpen && (
          <motion.div
            id="voice-command-cheat-sheet-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsCheatSheetOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-700"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-[#5f6f52] text-white shadow-md shadow-[#5f6f52]/30">
                    <Mic className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                      <span>Voice Command Cheat Sheet</span>
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Interactive Assistant
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      Speak these phrases hands-free or click &quot;Test Command&quot; to execute actions instantly.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCheatSheetOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Close Cheat Sheet"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Controls Bar: Search & Category Filter Pills */}
              <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search voice commands (e.g., 'tutor', 'dyslexic', 'scroll', 'new plan')..."
                      value={cheatSheetSearch}
                      onChange={(e) => setCheatSheetSearch(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52]"
                    />
                    {cheatSheetSearch && (
                      <button
                        onClick={() => setCheatSheetSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Hands-Free Tip Badge */}
                  <div className="bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-xl flex items-center gap-2 shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <p className="text-[11px] font-bold text-indigo-900">
                      Say <span className="underline">&quot;Open cheat sheet&quot;</span> anytime to toggle this view
                    </p>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {[
                    { id: 'all', label: 'All Commands', count: commandCatalog.length },
                    { id: 'navigation', label: 'Tab Navigation', count: commandCatalog.filter(c => c.category === 'navigation').length },
                    { id: 'tools', label: 'Tools & Actions', count: commandCatalog.filter(c => c.category === 'tools').length },
                    { id: 'accessibility', label: 'Accessibility', count: commandCatalog.filter(c => c.category === 'accessibility').length },
                    { id: 'scrolling', label: 'Page Motion', count: commandCatalog.filter(c => c.category === 'scrolling').length },
                    { id: 'confidence', label: 'Topic Ratings', count: commandCatalog.filter(c => c.category === 'confidence').length },
                  ].map((cat) => {
                    const isSelected = selectedCheatSheetCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCheatSheetCategory(cat.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#5f6f52] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* TTS Speed & Readability Control Bar */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                      <Gauge className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                        <span>TTS Speech Rate</span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md font-semibold">
                          {(playbackSpeed || 1.0).toFixed(2)}x
                        </span>
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.2 rounded-md flex items-center gap-1">
                          <Globe className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>Locale: {getTtsLocaleForAiLanguage(aiLanguage).code} ({getTtsLocaleForAiLanguage(aiLanguage).name})</span>
                        </span>
                      </span>
                      <p className="text-[10px] text-slate-500">
                        TTS voice locale auto-syncs with AI teaching language context ({aiLanguage.toUpperCase()})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { rate: 0.75, label: '0.75x', tag: 'Slower' },
                      { rate: 1.0, label: '1.0x', tag: 'Normal' },
                      { rate: 1.25, label: '1.25x', tag: 'Brisk' },
                      { rate: 1.5, label: '1.5x', tag: 'Fast' },
                      { rate: 1.75, label: '1.75x', tag: 'Faster' },
                      { rate: 2.0, label: '2.0x', tag: 'Max' },
                    ].map((item) => {
                      const isActive = Math.abs((playbackSpeed || 1.0) - item.rate) < 0.05;
                      return (
                        <button
                          key={item.rate}
                          type="button"
                          onClick={() => setPlaybackSpeed(item.rate)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            isActive
                              ? 'bg-[#5f6f52] text-white ring-2 ring-[#5f6f52]/30 shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                          title={`Set TTS Speech Rate to ${item.label} (${item.tag})`}
                        >
                          <span>{item.label}</span>
                          <span className={`text-[8.5px] opacity-80 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                            ({item.tag})
                          </span>
                        </button>
                      );
                    })}

                    {/* Read All / Stop Reading Button */}
                    <button
                      type="button"
                      onClick={readAllCheatSheetCommands}
                      className={`ml-1 px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        isReadingAllCommands
                          ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      }`}
                      title={isReadingAllCommands ? 'Stop reading cheat sheet commands' : 'Read all filtered cheat sheet commands aloud at current TTS rate'}
                    >
                      {isReadingAllCommands ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Stop Audio</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Read All Aloud</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Classroom TTS Pitch Slider Control Bar */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-100 text-purple-800">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                        <span>Classroom Voice Pitch</span>
                        <span className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded-md font-semibold">
                          {(ttsPitch || 1.0).toFixed(2)} Pitch
                        </span>
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/60 border border-purple-200 px-2 py-0.2 rounded-md">
                          {(ttsPitch || 1.0) < 0.85 ? 'Deep Acoustic Tone' : (ttsPitch || 1.0) > 1.15 ? 'High Frequency Clarity' : 'Balanced Classroom Voice'}
                        </span>
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Adjust voice pitch for optimal acoustic comfort and audibility across different classroom sizes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap min-w-[220px] max-w-xs shrink-0">
                    <span className="text-[10px] font-bold text-slate-500">0.5 (Low)</span>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={ttsPitch || 1.0}
                      onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-700"
                      title={`Adjust TTS Voice Pitch: ${(ttsPitch || 1.0).toFixed(2)}`}
                    />
                    <span className="text-[10px] font-bold text-slate-500">1.5 (High)</span>
                    <button
                      type="button"
                      onClick={() => setTtsPitch(1.0)}
                      className="px-2 py-0.5 text-[9.5px] font-bold bg-white hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 cursor-pointer transition"
                      title="Reset voice pitch to default (1.00)"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Command Cards Grid Container */}
              <div className="p-5 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
                {filteredCommands.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
                    <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No matching voice commands found</p>
                    <p className="text-xs text-slate-400">Try searching for a different term or select &quot;All Commands&quot;</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredCommands.map((cmd) => {
                      const IconComp = cmd.icon;
                      const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
                        navigation: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                        tools: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                        accessibility: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                        scrolling: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
                        confidence: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                      };
                      const catStyle = categoryColors[cmd.category] || categoryColors.navigation;

                      return (
                        <div
                          key={cmd.id}
                          className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-[#5f6f52]/50 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                        >
                          <div className="space-y-2">
                            {/* Command Header & Category Badge */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-xl ${catStyle.bg} ${catStyle.text} shrink-0`}>
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                    Primary Voice Command
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#5f6f52] transition-colors">
                                    &ldquo;{cmd.phrase}&rdquo;
                                  </h4>
                                </div>
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                                {cmd.category}
                              </span>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {cmd.description}
                            </p>

                            {/* Alternate Phrases / Aliases */}
                            {cmd.aliases.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 pt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Also works with:</span>
                                {cmd.aliases.map((alias, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60"
                                  >
                                    &ldquo;{alias}&rdquo;
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Footer Action Bar */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-[10.5px] font-medium text-slate-500 flex items-center gap-1">
                              <ArrowRight className="w-3 h-3 text-[#5f6f52]" />
                              <span>{cmd.actionText}</span>
                            </span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  speakCommandAloud(
                                    cmd.id,
                                    `Command phrase: ${cmd.phrase}. Action: ${cmd.description}`
                                  );
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                  currentlySpeakingCmdId === cmd.id
                                    ? 'bg-amber-500 text-white animate-pulse'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                                title="Listen to this command phrase read aloud at current TTS rate"
                              >
                                {currentlySpeakingCmdId === cmd.id ? (
                                  <Pause className="w-3.5 h-3.5 fill-current" />
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                                )}
                                <span>{currentlySpeakingCmdId === cmd.id ? 'Speaking' : 'Listen'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  cmd.action();
                                }}
                                className="px-3 py-1.5 bg-[#5f6f52]/10 hover:bg-[#5f6f52] text-[#5f6f52] hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                                title="Simulate / Test this voice command right now"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Test Command</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <p className="text-xs text-slate-500 font-medium">
                  Total Supported Voice Commands: <strong className="text-slate-800">{commandCatalog.length}</strong>
                </p>

                <button
                  onClick={() => setIsCheatSheetOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close Cheat Sheet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

