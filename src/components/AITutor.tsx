import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { classifyError } from '../utils/errorClassifier';
import { 
  Sparkles, 
  Send, 
  HelpCircle, 
  BookOpen, 
  Layers, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  ChevronRight, 
  User, 
  Cpu, 
  Sliders, 
  FileText,
  Bookmark,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Pause,
  Play,
  Volume1,
  Headphones,
  Activity,
  Settings,
  ChevronDown,
  ChevronUp,
  History,
  Plus,
  Trash2,
  Download,
  GraduationCap,
  Target,
  Compass,
  Award,
  ListTodo,
  Gauge,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Maximize2,
  Minimize2,
  Search,
  Cloud,
  CloudOff,
  Upload,
  Loader2,
  Paperclip,
  FileUp,
  Check,
  MessageSquare,
  Bot,
  Bell,
  Sun,
  Moon,
  Lightbulb,
  Zap,
  CheckCircle2,
  Brain,
  Share2,
  CheckCheck,
  Video,
  Clock,
  RotateCcw,
  Wifi,
  WifiOff,
  ShieldCheck
} from 'lucide-react';
import { SavedDocument, PersonalizedLearningPath, FlashcardDeck, CurriculumType, ALL_CURRICULA_METADATA, getCurriculumMeta, getCurriculumLabel, getCurriculumTutorName } from '../types';
import { LearningPathWorkspace } from './LearningPathWorkspace';
import TutorDashboard from './TutorDashboard';
import FlashcardDeckModal from './FlashcardDeckModal';
import { cbcSubjectsData } from '../data/cbcData';
import { EditableSelect } from './EditableSelect';
import { db, auth, storage, handleFirestoreError, OperationType, cleanUndefined, updateUserPrimaryCurriculum } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SetupForm } from './SetupForm';
import { handleResponseJson } from '../utils/api';
import WhatsAppIntegrationModal from './WhatsAppIntegrationModal';

interface UploadedResource {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  downloadUrl?: string;
  extractedText: string;
  uploadedAt: string;
  subject?: string;
  topic?: string;
  accessCount?: number;
  generationCount?: number;
}

interface Message {
  id?: string;
  role: 'user' | 'model';
  text: string;
  feedback?: 'up' | 'down';
  status?: 'sending' | 'delivered' | 'failed' | 'queued';
  timestamp?: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    prompt: string;
    generatorUsed?: string;
  };
}

interface SuggestedResource {
  title: string;
  url: string;
  reason: string;
}

interface ConceptNode {
  id: string;
  label: string;
  type: string;
  description: string;
}

interface ConceptEdge {
  from: string;
  to: string;
  label: string;
}

interface ConceptVisualization {
  title: string;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

interface ChatSession {
  id: string;
  title: string;
  subject: string;
  topic: string;
  persona: 'Socratic Questioner' | 'Encouraging Mentor' | 'Critical Examiner';
  scaffoldingLevel: 'low' | 'medium' | 'high';
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  messages: Message[];
  activeStep: string;
  misconceptions: string[];
  suggestedResources: SuggestedResource[];
  conceptMap: ConceptVisualization;
  createdAt: string;
  cbcSocraticMode?: 'guided' | 'direct';
}

interface AITutorProps {
  documents: SavedDocument[];
  initialSelectedResourceId?: string;
  onOpenImageStudio?: (prompt?: string) => void;
  onOpenVideoStudio?: (prompt?: string) => void;
}

export default function AITutor({ documents, initialSelectedResourceId, onOpenImageStudio, onOpenVideoStudio }: AITutorProps) {
  const { aiLanguage } = useLanguage();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'Administrator';

  // Dynamic Curriculum Selection (Syncs AI Tutor Name & System Prompts)
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumType>(() => {
    return (profile?.primaryCurriculum as CurriculumType) ||
      (profile?.curriculum as CurriculumType) ||
      (profile?.whatsappSettings?.curriculum as CurriculumType) ||
      (typeof window !== 'undefined' ? (localStorage.getItem('edunexus_primary_curriculum') as CurriculumType) : null) ||
      'cbc';
  });

  useEffect(() => {
    const effectiveCurr = (profile?.primaryCurriculum as CurriculumType) ||
      (profile?.curriculum as CurriculumType) ||
      (profile?.whatsappSettings?.curriculum as CurriculumType);
    if (effectiveCurr) {
      setSelectedCurriculum(effectiveCurr);
    }
  }, [profile?.primaryCurriculum, profile?.curriculum, profile?.whatsappSettings?.curriculum]);

  const handleCurriculumChange = async (nextCurr: CurriculumType) => {
    setSelectedCurriculum(nextCurr);
    if (typeof window !== 'undefined') {
      localStorage.setItem('edunexus_primary_curriculum', nextCurr);
    }
    if (user?.uid) {
      try {
        await updateUserPrimaryCurriculum(user.uid, nextCurr);
      } catch (err) {
        console.error('Failed to sync curriculum selection:', err);
      }
    }
  };

  const activeTutorName = getCurriculumTutorName(selectedCurriculum);
  const activeCurriculumMeta = getCurriculumMeta(selectedCurriculum);

  // Multi-Role AI Assistant State (Student, Teacher, Parent, Administrator)
  const [activeRole, setActiveRole] = useState<'Student' | 'Teacher' | 'Parent' | 'Administrator'>(() => {
    if (profile?.role && ['Student', 'Teacher', 'Parent', 'Administrator'].includes(profile.role)) {
      return profile.role as any;
    }
    return 'Student';
  });

  useEffect(() => {
    if (profile?.role && ['Student', 'Teacher', 'Parent', 'Administrator'].includes(profile.role)) {
      setActiveRole(profile.role as any);
    }
  }, [profile?.role]);

  // WhatsApp Modal Integration State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Lightbox Modal for Generated Media (Images & Videos)
  const [lightboxMedia, setLightboxMedia] = useState<{ type: 'image' | 'video'; url: string; prompt: string; generatorUsed?: string } | null>(null);

  // Admin AI Engine Choice State (Only visible & configurable by Administrator)
  const [adminSelectedEngine, setAdminSelectedEngine] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('edunexus_admin_ai_engine') || 'gemini-3.5-flash';
    }
    return 'gemini-3.5-flash';
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && isAdmin) {
      localStorage.setItem('edunexus_admin_ai_engine', adminSelectedEngine);
    }
  }, [adminSelectedEngine, isAdmin]);

  // Session History State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_tutor_sessions_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse sessions", e);
        }
      }
    }
    return [
      {
        id: 'initial-session',
        title: 'Physics - Velocity and Acceleration',
        subject: 'Physics',
        topic: 'Velocity and Acceleration',
        persona: 'Socratic Questioner',
        scaffoldingLevel: 'medium',
        messages: [
          {
            role: 'model',
            text: "Hello! I am EduNexus AI Tutor. Instead of giving direct answers, I will guide you step-by-step through Socratic inquiry so you truly master the concepts. What topic would you like to explore today?"
          }
        ],
        activeStep: 'Exploratory onboarding',
        misconceptions: [],
        suggestedResources: [
          {
            title: "PhET Moving Man Simulation",
            url: "https://phet.colorado.edu/en/simulations/moving-man",
            reason: "Excellent for visualizing position, velocity, and acceleration vectors in real time."
          },
          {
            title: "OpenStax High School Physics Textbook",
            url: "https://openstax.org/details/books/physics",
            reason: "Read peer-reviewed, free chapters covering kinematics with standard diagrams."
          }
        ],
        conceptMap: {
          title: "Velocity & Acceleration Concept Map",
          nodes: [
            { id: "node1", label: "Velocity", type: "concept", description: "Rate of change of position over time." },
            { id: "node2", label: "Speed", type: "variable", description: "Magnitude of velocity without directional vector." },
            { id: "node3", label: "Displacement", type: "variable", description: "Overall change in position from origin." },
            { id: "node4", label: "Acceleration", type: "concept", description: "Rate of change of velocity over time." },
            { id: "node5", label: "Uniform Acceleration", type: "process", description: "Constant rate of velocity increase." },
            { id: "node6", label: "Non-uniform Acceleration", type: "process", description: "Varying rate of acceleration over time." }
          ],
          edges: [
            { from: "node1", to: "node2", label: "scalar magnitude" },
            { from: "node1", to: "node3", label: "derived from" },
            { from: "node1", to: "node4", label: "rate of change" },
            { from: "node4", to: "node5", label: "constant" },
            { from: "node4", to: "node6", label: "variable" }
          ]
        },
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_tutor_sessions_v1');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            return parsed[0].id;
          }
        } catch (e) {}
      }
    }
    return 'initial-session';
  });

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  // Modes & Layout States
  const [tutorMode, setTutorMode] = useState<'socratic' | 'cbc-tutor' | 'dashboard' | 'learning-path'>('socratic');
  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [copilotInput, setCopilotInput] = useState<string>('');

  // CBC State
  const [isCbcSession, setIsCbcSession] = useState<boolean>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? !!(active as any).isCbcMode : false;
  });
  const [cbcSubject, setCbcSubject] = useState<string>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active && (active as any).cbcSubject ? (active as any).cbcSubject : '';
  });
  const [cbcStrand, setCbcStrand] = useState<string>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active && (active as any).cbcStrand ? (active as any).cbcStrand : '';
  });
  const [cbcSubStrand, setCbcSubStrand] = useState<string>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active && (active as any).cbcSubStrand ? (active as any).cbcSubStrand : '';
  });
  const [cbcConcept, setCbcConcept] = useState<string>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active && (active as any).cbcConcept ? (active as any).cbcConcept : '';
  });
  const [cbcSystemPrompt, setCbcSystemPrompt] = useState<string>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active && (active as any).cbcSystemPrompt ? (active as any).cbcSystemPrompt : '';
  });
  const [cbcSocraticMode, setCbcSocraticMode] = useState<'guided' | 'direct'>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active && (active as any).cbcSocraticMode ? (active as any).cbcSocraticMode : 'guided';
  });

  // Session Parameters
  const [subject, setSubject] = useState<string>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? active.subject : 'Physics';
  });
  const [topic, setTopic] = useState<string>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? active.topic : 'Velocity and Acceleration';
  });
  const [subTopicSelection, setSubTopicSelection] = useState<string>('Kinematics & Vector Motion');
  const [specificConceptSelection, setSpecificConceptSelection] = useState<string>('Instantaneous vs Average Acceleration');
  const [dialogueStyle, setDialogueStyle] = useState<'guided' | 'direct'>('guided');

  const [scaffoldingLevel, setScaffoldingLevel] = useState<'low' | 'medium' | 'high'>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? active.scaffoldingLevel : 'medium';
  });
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active && active.difficultyLevel ? active.difficultyLevel : 'intermediate';
  });
  const [cognitiveLevel, setCognitiveLevel] = useState<string>('Understand & Apply');
  const [languageStyle, setLanguageStyle] = useState<string>('Simple & Student-Friendly');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [persona, setPersona] = useState<'Socratic Questioner' | 'Encouraging Mentor' | 'Critical Examiner'>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? active.persona : 'Socratic Questioner';
  });

  // Concept Visualization
  const [conceptMap, setConceptMap] = useState<ConceptVisualization>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? active.conceptMap : {
      title: "Velocity & Acceleration Concept Map",
      nodes: [
        { id: "node1", label: "Velocity", type: "concept", description: "Rate of change of position over time." },
        { id: "node2", label: "Speed", type: "variable", description: "Magnitude of velocity without directional vector." },
        { id: "node3", label: "Displacement", type: "variable", description: "Overall change in position from origin." },
        { id: "node4", label: "Acceleration", type: "concept", description: "Rate of change of velocity over time." },
        { id: "node5", label: "Uniform Acceleration", type: "process", description: "Constant rate of velocity increase." },
        { id: "node6", label: "Non-uniform Acceleration", type: "process", description: "Varying rate of acceleration over time." }
      ],
      edges: [
        { from: "node1", to: "node2", label: "scalar magnitude" },
        { from: "node1", to: "node3", label: "derived from" },
        { from: "node1", to: "node4", label: "rate of change" },
        { from: "node4", to: "node5", label: "constant" },
        { from: "node4", to: "node6", label: "variable" }
      ]
    };
  });

  // Resources & Custom Documents
  const [sessionSearchQuery, setSessionSearchQuery] = useState<string>('');
  const [isSyncingWithFirestore, setIsSyncingWithFirestore] = useState<boolean>(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [isClearingChat, setIsClearingChat] = useState<boolean>(false);
  const [uploadedResources, setUploadedResources] = useState<UploadedResource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>(initialSelectedResourceId || '');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs
  const [leftSidebarTab, setLeftSidebarTab] = useState<'config' | 'materials' | 'voice'>('config');
  const [rightSidebarTab, setRightSidebarTab] = useState<'all' | 'concept' | 'pedagogy' | 'resources'>('all');

  // Flashcards state
  const [activeFlashcardDeck, setActiveFlashcardDeck] = useState<FlashcardDeck | null>(null);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState<boolean>(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState<boolean>(false);

  // Conversation State
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const [messages, setMessages] = useState<Message[]>(activeSession ? activeSession.messages : []);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<string>(activeSession ? activeSession.activeStep : 'Exploratory onboarding');
  const [misconceptions, setMisconceptions] = useState<string[]>(activeSession ? activeSession.misconceptions : []);
  const [suggestedResources, setSuggestedResources] = useState<SuggestedResource[]>(activeSession ? activeSession.suggestedResources : []);

  // Network & AI Connection Status State
  const OFFLINE_QUEUE_STORAGE_KEY = 'edunexus_ai_tutor_offline_queue_v1';
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [aiStatus, setAiStatus] = useState<'ready' | 'connecting' | 'thinking' | 'offline' | 'queued'>('ready');
  const [offlineQueue, setOfflineQueue] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('edunexus_ai_tutor_offline_queue_v1');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load offline message queue from localStorage:', e);
      }
    }
    return [];
  });

  // Save offline message queue to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(offlineQueue));
      } catch (e) {
        console.warn('Failed to save offline queue to localStorage:', e);
      }
    }
  }, [offlineQueue]);

  // Online / Offline Network Monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setAiStatus('ready');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setAiStatus('offline');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Sync session state changes to sessions array
  useEffect(() => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages,
          activeStep,
          misconceptions,
          suggestedResources,
          conceptMap
        };
      }
      return s;
    }));
  }, [messages, activeStep, misconceptions, suggestedResources, conceptMap, activeSessionId]);

  // Speech & Voice Synthesis State
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingText, setSpeakingText] = useState<string>('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [voiceRate, setVoiceRate] = useState<number>(1.0);
  const [voicePitch, setVoicePitch] = useState<number>(1.0);
  const [voiceVolume, setVoiceVolume] = useState<number>(1.0);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);

  // Speech Recognition (Mic Input) State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isHandsFree, setIsHandsFree] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Synchronize state when active session changes
  useEffect(() => {
    const session = sessions.find(s => s.id === activeSessionId);
    if (session) {
      setMessages(session.messages);
      setSubject(session.subject);
      setTopic(session.topic);
      setPersona(session.persona);
      setScaffoldingLevel(session.scaffoldingLevel);
      if (session.difficultyLevel) setDifficultyLevel(session.difficultyLevel);
      setActiveStep(session.activeStep);
      setMisconceptions(session.misconceptions);
      setSuggestedResources(session.suggestedResources);
      if (session.conceptMap) setConceptMap(session.conceptMap);
      setIsCbcSession(!!(session as any).isCbcMode);
      if ((session as any).cbcSubject) setCbcSubject((session as any).cbcSubject);
      if ((session as any).cbcStrand) setCbcStrand((session as any).cbcStrand);
      if ((session as any).cbcSubStrand) setCbcSubStrand((session as any).cbcSubStrand);
      if ((session as any).cbcConcept) setCbcConcept((session as any).cbcConcept);
      if ((session as any).cbcSystemPrompt) setCbcSystemPrompt((session as any).cbcSystemPrompt);
      if ((session as any).cbcSocraticMode) setCbcSocraticMode((session as any).cbcSocraticMode);
    }
  }, [activeSessionId]);

  // Save sessions to localStorage & Firestore
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_tutor_sessions_v1', JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Load SpeechSynthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        if (availableVoices.length > 0 && !selectedVoiceName) {
          const preferredVoice = availableVoices.find(
            v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel'))
          ) || availableVoices.find(v => v.lang.includes('en')) || availableVoices[0];
          setSelectedVoiceName(preferredVoice.name);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Browser Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setInputMessage(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setSpeechError(`Microphone error: ${event.error}`);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechError(null);
      try {
        if (isSpeaking && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        }
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    // Clean markdown symbols for natural TTS reading
    const cleanText = text
      .replace(/[*#_`~]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/\n+/g, ' ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (selectedVoiceName) {
      const selectedVoiceObj = voices.find(v => v.name === selectedVoiceName);
      if (selectedVoiceObj) utterance.voice = selectedVoiceObj;
    }

    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
    utterance.volume = voiceVolume;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingText(text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingText('');

      if (isHandsFree && recognitionRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {}
        }, 600);
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingText('');
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleToggleSpeakMessage = (text: string) => {
    if (isSpeaking && speakingText === text) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingText('');
    } else {
      speakText(text);
    }
  };

  const handleMessageFeedback = (index: number, type: 'up' | 'down') => {
    setMessages(prev => prev.map((m, idx) => {
      if (idx === index) {
        return { ...m, feedback: m.feedback === type ? undefined : type };
      }
      return m;
    }));
  };

  // Resource Upload Handler
  useEffect(() => {
    if (initialSelectedResourceId) {
      setSelectedResourceId(initialSelectedResourceId);
    }
  }, [initialSelectedResourceId]);

  useEffect(() => {
    if (!profile?.uid) return;

    const q = query(
      collection(db, 'uploadedResources'),
      where('userId', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const resources: UploadedResource[] = [];
        snapshot.forEach((docSnap) => {
          resources.push({
            id: docSnap.id,
            ...docSnap.data()
          } as UploadedResource);
        });
        resources.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        setUploadedResources(resources);
      },
      (err) => {
        console.error("Error reading uploaded resources:", err);
      }
    );

    return () => unsubscribe();
  }, [profile?.uid]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    
    if ('files' in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }

    if (!file) return;

    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx');

    if (!isPDF && !isDOCX) {
      setUploadError("Invalid file type. Please upload a PDF or DOCX file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB limit.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      
      const base64 = await base64Promise;
      setUploadProgress(30);

      const parseResponse = await fetch('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64,
          fileName: file.name,
          fileType: isPDF ? 'pdf' : 'docx'
        })
      });

      if (!parseResponse.ok) {
        throw new Error("Failed to extract text from document.");
      }

      const parseData = await parseResponse.json();
      const extractedText = parseData.text || '';
      
      if (!extractedText.trim()) {
        throw new Error("Document is empty or text could not be extracted.");
      }

      setUploadProgress(60);

      const fileId = `res-${Date.now()}`;
      const storageRef = ref(storage, `curriculum_documents/${profile?.uid || 'anonymous'}/${fileId}/${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      setUploadProgress(80);

      const resourceData: UploadedResource = {
        id: fileId,
        userId: profile?.uid || 'anonymous',
        fileName: file.name,
        fileType: isPDF ? 'pdf' : 'docx',
        storagePath: storageRef.fullPath,
        downloadUrl,
        extractedText,
        uploadedAt: new Date().toISOString(),
        subject: subject,
        topic: topic,
        accessCount: 1,
        generationCount: 0
      };

      await setDoc(doc(db, 'uploadedResources', fileId), resourceData);
      setSelectedResourceId(fileId);
      setUploadProgress(100);
      setIsUploading(false);
    } catch (err: any) {
      console.error("Resource upload error:", err);
      setUploadError(err.message || "Upload failed. Please try again.");
      setIsUploading(false);
    }
  };

  const handleDeleteResource = async (res: UploadedResource, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${res.fileName}"?`)) return;

    try {
      if (res.storagePath) {
        const storageRef = ref(storage, res.storagePath);
        await deleteObject(storageRef).catch(() => {});
      }
      await deleteDoc(doc(db, 'uploadedResources', res.id));
      if (selectedResourceId === res.id) {
        setSelectedResourceId('');
      }
    } catch (err) {
      console.error("Failed to delete uploaded resource:", err);
    }
  };

  const handleGenerateSocraticFlashcards = async () => {
    setIsGeneratingFlashcards(true);
    try {
      const selectedRes = uploadedResources.find(r => r.id === selectedResourceId);
      const activeSubject = isCbcSession ? cbcSubject : subject;
      const activeTopic = isCbcSession ? `${cbcStrand} - ${cbcSubStrand}` : topic;
      const activeContent = selectedRes ? selectedRes.extractedText : messages.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n');

      const res = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubject || 'General Studies',
          topic: activeTopic || 'Core Socratic Lesson',
          subtopic: cbcConcept || 'Contextual Review',
          content: activeContent,
          cardCount: 6,
          isLowDifficultySupport: false,
          language: aiLanguage,
          targetLanguage: aiLanguage
        })
      });
      const data = await handleResponseJson(res);
      if (data.deck) {
        setActiveFlashcardDeck(data.deck);
        setIsFlashcardModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to generate contextual flashcards:", err);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleSaveFlashcardsToLibrary = async (deck: FlashcardDeck) => {
    if (!profile?.uid || !deck) return;
    const cards = deck?.cards ?? [];
    const docId = deck.id || `flashcard-${Date.now()}`;
    const savedDoc: SavedDocument = {
      id: docId,
      title: deck.title || 'Flashcard Deck',
      docType: 'flashcards',
      curriculum: 'cbc',
      subject: deck.subject || 'General',
      classLevel: 'Upper Primary / Secondary',
      topic: deck.topic || 'Socratic Lesson',
      subTopic: '',
      duration: '15 mins',
      content: cards.map((c, i) => `Card ${i + 1}: Q: ${c?.front || ''}\nA: ${c?.back || ''}${c?.hint ? `\nHint: ${c.hint}` : ''}`).join('\n\n'),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      tags: ['flashcards', 'socratic-ai', 'file-library', deck.subject || 'General'],
      category: 'Flashcards',
      lastModifiedByUid: profile.uid,
      lastModifiedByName: profile.displayName || 'Teacher',
      flashcardDeck: {
        ...deck,
        cards: cards,
      },
    };

    await setDoc(doc(db, 'documents', docId), savedDoc as any);
  };

  const handleCreateNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: `${subject} - ${topic}`,
      subject,
      topic,
      persona,
      scaffoldingLevel,
      difficultyLevel,
      messages: [
        {
          role: 'model',
          text: `Welcome! Let's explore **${topic}** in **${subject}**. What would you like to start with?`
        }
      ],
      activeStep: 'Exploratory onboarding',
      misconceptions: [],
      suggestedResources: [],
      conceptMap: {
        title: `${topic} Concept Map`,
        nodes: [
          { id: "n1", label: topic, type: "concept", description: `Core focus topic in ${subject}` }
        ],
        edges: []
      },
      createdAt: new Date().toISOString()
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setIsCbcSession(false);
  };

  const handleCreateNewCbcSession = (
    subj: string,
    strand: string,
    subStrand: string,
    concept: string,
    socraticModeParam: 'guided' | 'direct'
  ) => {
    const newId = `cbc-session-${Date.now()}`;
    const newSession: ChatSession & { isCbcMode?: boolean; cbcSubject?: string; cbcStrand?: string; cbcSubStrand?: string; cbcConcept?: string; cbcSocraticMode?: string } = {
      id: newId,
      title: `[CBC] ${subj} - ${concept}`,
      subject: subj,
      topic: `${strand} (${subStrand})`,
      persona: 'Socratic Questioner',
      scaffoldingLevel: 'medium',
      difficultyLevel: 'intermediate',
      isCbcMode: true,
      cbcSubject: subj,
      cbcStrand: strand,
      cbcSubStrand: subStrand,
      cbcConcept: concept,
      cbcSocraticMode: socraticModeParam,
      messages: [
        {
          role: 'model',
          text: `Jambo! I am your Kenyan CBC AI Learning Assistant. We are exploring **${subj}** (Strand: ${strand} -> ${subStrand}) focusing on **${concept}**.\n\nLet's build deep conceptual understanding. What is your current understanding of this concept?`
        }
      ],
      activeStep: 'CBC Socratic Onboarding',
      misconceptions: [],
      suggestedResources: [
        {
          title: "KICD Curriculum Designs Portal",
          url: "https://kicd.ac.ke",
          reason: "Official Kenyan Competency-Based Curriculum guidelines and assessment rubrics."
        }
      ],
      conceptMap: {
        title: `${concept} CBC Map`,
        nodes: [
          { id: "c1", label: concept, type: "concept", description: `CBC Core Competency for ${subStrand}` }
        ],
        edges: []
      },
      createdAt: new Date().toISOString()
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setIsCbcSession(true);
    setCbcSubject(subj);
    setCbcStrand(strand);
    setCbcSubStrand(subStrand);
    setCbcConcept(concept);
    setCbcSocraticMode(socraticModeParam);
    setTutorMode('socratic');
  };

  const processOfflineQueue = async () => {
    if (offlineQueue.length === 0 || (typeof navigator !== 'undefined' && !navigator.onLine) || isProcessing) return;
    const queueToProcess = [...offlineQueue];
    for (const msgItem of queueToProcess) {
      await handleSendMessage(msgItem.text, msgItem.id);
    }
  };

  // Automatically trigger sync when back online and items exist in queue
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0 && !isProcessing) {
      processOfflineQueue();
    }
  }, [isOnline, offlineQueue.length]);

  const handleSendMessage = async (customMessage?: string, retryMsgId?: string) => {
    const messageToSend = customMessage || inputMessage;
    if (!messageToSend.trim()) return;

    const msgId = retryMsgId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check offline status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setAiStatus('offline');
      const queuedUserMsg: Message = {
        id: msgId,
        role: 'user',
        text: messageToSend,
        status: 'queued',
        timestamp: timeStr
      };

      setMessages(prev => {
        const exists = prev.some(m => m.id === msgId);
        if (exists) {
          return prev.map(m => m.id === msgId ? queuedUserMsg : m);
        }
        return [...prev, queuedUserMsg];
      });

      setOfflineQueue(prev => {
        if (prev.some(m => m.id === msgId)) return prev;
        return [...prev, queuedUserMsg];
      });

      if (!customMessage) setInputMessage('');
      return;
    }

    // Online execution
    setAiStatus('connecting');
    setIsProcessing(true);

    const activeUserMsg: Message = {
      id: msgId,
      role: 'user',
      text: messageToSend,
      status: 'sending',
      timestamp: timeStr
    };

    setMessages(prev => {
      const exists = prev.some(m => m.id === msgId);
      if (exists) {
        return prev.map(m => m.id === msgId ? activeUserMsg : m);
      }
      return [...prev, activeUserMsg];
    });

    if (!customMessage) setInputMessage('');

    try {
      setAiStatus('thinking');
      const selectedRes = uploadedResources.find(r => r.id === selectedResourceId);
      const activeDoc = documents.find(d => d.id === selectedDocId);
      const contextualContent = selectedRes ? selectedRes.extractedText : (activeDoc ? activeDoc.content : undefined);

      const historyForApi = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole: activeRole,
          userName: profile?.displayName || user?.displayName || 'EduNexus User',
          curriculum: selectedCurriculum,
          subject: isCbcSession ? cbcSubject : subject,
          topic: isCbcSession ? `${cbcStrand} - ${cbcSubStrand}: ${cbcConcept}` : topic,
          persona,
          scaffoldingLevel,
          difficultyLevel,
          cognitiveLevel,
          languageStyle,
          dialogueStyle,
          message: messageToSend,
          history: historyForApi,
          contextDocument: contextualContent,
          isCbcMode: isCbcSession,
          socraticMode: dialogueStyle
        })
      });

      const data = await handleResponseJson(res, 'Failed to connect to AI Tutor.');
      
      // Update message status to delivered (double tick)
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'delivered' } : m));
      setOfflineQueue(prev => prev.filter(m => m.id !== msgId));
      setAiStatus('ready');

      const botResponseText = data.message || data.text || "That's an insightful observation. Let's dig deeper: how does that relate to our core formula?";
      
      const mediaPayload = data.media || data.generatedMedia;
      const modelMsg: Message = {
        id: `model_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        role: 'model',
        text: botResponseText,
        media: mediaPayload ? {
          type: mediaPayload.type,
          url: mediaPayload.url,
          prompt: mediaPayload.prompt || messageToSend,
          generatorUsed: mediaPayload.generatorUsed
        } : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, modelMsg]);

      if (data.activeStep || data.scaffoldingStep) setActiveStep(data.activeStep || data.scaffoldingStep);
      if ((data.misconceptions || data.detectedMisconceptions) && Array.isArray(data.misconceptions || data.detectedMisconceptions)) {
        setMisconceptions(data.misconceptions || data.detectedMisconceptions);
      }
      if (data.suggestedResources && Array.isArray(data.suggestedResources)) setSuggestedResources(data.suggestedResources);
      if (data.conceptMap && data.conceptMap.nodes) setConceptMap(data.conceptMap);

      if (isVoiceEnabled) {
        speakText(botResponseText);
      }
    } catch (err) {
      console.error("AI Tutor API Error:", err);
      
      // Mark user message as failed and add to queue
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'failed' } : m));
      setOfflineQueue(prev => {
        const queuedMsg: Message = { id: msgId, role: 'user', text: messageToSend, status: 'failed', timestamp: timeStr };
        if (prev.some(m => m.id === msgId)) return prev;
        return [...prev, queuedMsg];
      });
      setAiStatus('ready');

      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: classifyError(err),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIcebreaker = (promptText: string) => {
    setInputMessage(promptText);
    handleSendMessage(promptText);
  };

  const handleRequestHint = () => {
    const hintPrompt = "Can you give me a subtle Socratic hint without spoiling the final answer?";
    setInputMessage(hintPrompt);
    handleSendMessage(hintPrompt);
  };

  const handleImportDocument = (docId: string) => {
    setSelectedDocId(docId);
    const selectedDoc = documents.find(d => d.id === docId);
    if (selectedDoc) {
      setSubject(selectedDoc.subject || 'General');
      setTopic(selectedDoc.topic || 'Lesson Document');
    }
  };

  const confirmClearChat = async () => {
    setIsClearingChat(true);
    try {
      const resetMessages: Message[] = [
        {
          role: 'model',
          text: `Chat history cleared. What topic or concept in **${subject}** shall we explore next?`
        }
      ];
      setMessages(resetMessages);
      setMisconceptions([]);
      setActiveStep('Exploratory onboarding');
      
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: resetMessages,
            misconceptions: [],
            activeStep: 'Exploratory onboarding'
          };
        }
        return s;
      }));
    } catch (e) {
      console.error("Failed to clear chat log", e);
    } finally {
      setIsClearingChat(false);
      setShowClearConfirmModal(false);
    }
  };

  const handleExportChatLog = () => {
    const chatContent = messages.map(m => `### ${m.role === 'user' ? 'Student' : 'EduNexus AI Tutor'}\n${m.text}\n`).join('\n---\n\n');
    const blob = new Blob([`# EduNexus Socratic Session Log\n**Subject:** ${subject}\n**Topic:** ${topic}\n**Date:** ${new Date().toLocaleDateString()}\n\n${chatContent}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `socratic-session-${topic.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const defaultVisualAids = [
    { name: "PhET Simulations", url: "https://phet.colorado.edu/", desc: "Physics, math, chemistry simulations" },
    { name: "OpenStax Portal", url: "https://openstax.org/", desc: "Free high-quality peer-reviewed textbooks" },
    { name: "GeoGebra Tools", url: "https://www.geogebra.org/", desc: "Geometry, algebra & math worksheets" },
    { name: "Khan Academy", url: "https://www.khanacademy.org/", desc: "Guided micro-lessons & practice problems" }
  ];

  return (
    <div className="flex flex-col gap-6 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16 aitutor-workspace module-workspace">
      
      {/* 1. MASTER HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-2xs transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0E5E4B] to-[#19B37D] p-0.5 shadow-md shadow-emerald-900/10 flex items-center justify-center text-white shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">EduNexus</span>
                {isAdmin ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[10px] font-bold shadow-2xs">
                    <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Engine:</span>
                    <select
                      value={adminSelectedEngine}
                      onChange={(e) => setAdminSelectedEngine(e.target.value)}
                      className="bg-transparent font-black text-amber-900 dark:text-amber-100 outline-none cursor-pointer text-[10px]"
                      title="Admin Only: Select Active AI Engine Strategy"
                    >
                      <option value="emgen_fallback_nanobanana" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🍌 Nano Banana as Fallback for Emgen (Dual-Engine)</option>
                      <option value="emgen_only" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🎨 Emgen Only (High Quality)</option>
                      <option value="nanobanana_only" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🍌 Nano Banana Only (Rapid)</option>
                      <option value="gemini-3.5-flash" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">⚡ Gemini 3.5 Flash (Text)</option>
                      <option value="gemini-3.1-flash-lite" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🚀 Gemini 3.1 Flash Lite (Text)</option>
                    </select>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-[#0E5E4B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>Socratic AI</span>
                                      </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span>Home</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-[#0E5E4B] dark:text-emerald-400 font-bold">AI Tutor</span>
              </div>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search topics, concepts, documents..."
                value={sessionSearchQuery}
                onChange={(e) => setSessionSearchQuery(e.target.value)}
                className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#19B37D]/30 focus:border-[#0E5E4B] transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Profile & Controls */}
          <div className="flex items-center gap-3">
            {/* Active Role Assistant Badge Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-2xs">
              <span className="text-slate-400 font-medium hidden sm:inline">Role:</span>
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as any)}
                className="bg-transparent text-slate-800 dark:text-slate-100 font-bold outline-none cursor-pointer text-xs"
                title="Active EduNexus Multi-Role AI Assistant Mode"
              >
                <option value="Student" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🎓 Student Assistant</option>
                <option value="Teacher" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">👨‍🏫 Teacher Assistant</option>
                <option value="Parent" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">👨‍👩‍👧 Parent Assistant</option>
                <option value="Administrator" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🏛️ Admin Assistant</option>
              </select>
            </div>

            {/* Dynamic AI Status Badge */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold transition-all shadow-2xs ${
              aiStatus === 'ready'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : aiStatus === 'thinking'
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                : aiStatus === 'connecting'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`} title="Real-time status of backend AI Tutor connection">
              <span className={`w-2 h-2 rounded-full ${
                aiStatus === 'ready' ? 'bg-emerald-500 animate-pulse' :
                aiStatus === 'thinking' ? 'bg-purple-500 animate-ping' :
                aiStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                'bg-rose-500'
              }`} />
              <span className="capitalize">
                {aiStatus === 'ready' && 'AI Status: Ready'}
                {aiStatus === 'thinking' && 'AI Status: Thinking...'}
                {aiStatus === 'connecting' && 'AI Status: Connecting...'}
                {aiStatus === 'offline' && 'AI Status: Offline'}
              </span>
              {offlineQueue.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-[10px] font-black">
                  {offlineQueue.length} queued
                </span>
              )}
            </div>

            <button className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative cursor-pointer" title="Notifications">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs shadow-xs border border-slate-700">
                {profile?.displayName?.charAt(0) || 'G'}
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <span className="font-extrabold text-xs text-slate-800 dark:text-white block">{profile?.displayName || 'Godfrey Odhiambo'}</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">{profile?.role || 'Administrator'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 space-y-6">

        {/* 2. AI WORKSPACE HERO BANNER */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0E5E4B] via-[#12725B] to-[#19B37D] text-white p-6 sm:p-8 shadow-xl border border-emerald-400/20">
          {/* Subtle background glow graphics */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Banner Text */}
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-100 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Next-Gen Socratic Dialogue Engine</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight leading-tight text-white flex items-center gap-3 flex-wrap">
                <span>{activeTutorName}</span>
                <span className="text-xs font-sans px-3 py-1 rounded-full bg-white/20 text-emerald-100 border border-white/25 font-extrabold flex items-center gap-1.5 shadow-sm">
                  <span>{activeCurriculumMeta.flag}</span>
                  <span>{activeCurriculumMeta.shortLabel}</span>
                </span>
              </h1>

              <p className="text-sm sm:text-base text-emerald-50 max-w-2xl font-normal leading-relaxed">
                Personalized Socratic learning powered by AI. Create adaptive learning journeys that build deep conceptual understanding rather than rote memorization.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setTutorMode('learning-path')}
                  className="px-5 py-2.5 rounded-2xl bg-white text-[#0E5E4B] hover:bg-emerald-50 font-extrabold text-xs transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <Compass className="w-4 h-4 text-[#0E5E4B]" />
                  <span>Generate Learning Path</span>
                </button>

                <button
                  onClick={() => setTutorMode('socratic')}
                  className="px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold text-xs transition-all cursor-pointer flex items-center gap-2 backdrop-blur-md"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-200" />
                  <span>Continue Session</span>
                </button>

                <button
                  onClick={() => setTutorMode('dashboard')}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <Gauge className="w-4 h-4 text-emerald-200" />
                  <span>Open Dashboard</span>
                </button>
              </div>
            </div>

            {/* Banner Illustration Visual */}
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                
                {/* Floating Robot & Icons Illustration */}
                <div className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/30 p-4 shadow-2xl flex flex-col items-center justify-center gap-2 text-center group hover:scale-105 transition-all duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
                    <Bot className="w-9 h-9 animate-bounce" />
                  </div>
                  <span className="text-xs font-black text-white tracking-wide">EduNexus Bot</span>
                  <span className="text-[10px] text-emerald-100 font-medium">Socratic Guide v2.7</span>
                </div>

                {/* Floating Node Badges */}
                <div className="absolute -top-2 -left-2 p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-amber-300 shadow-lg animate-pulse">
                  <Brain className="w-5 h-5" />
                </div>

                <div className="absolute bottom-2 -left-4 p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-cyan-200 shadow-lg">
                  <GraduationCap className="w-5 h-5" />
                </div>

                <div className="absolute top-4 -right-2 p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-emerald-200 shadow-lg">
                  <Zap className="w-5 h-5" />
                </div>

                <div className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-emerald-100 shadow-lg">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 3. TOP NAVIGATION CARDS (MODE SELECTOR) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'socratic', name: 'Socratic Dialogue', icon: Cpu, desc: 'Interactive AI Querying' },
            { id: 'dashboard', name: 'Tutor Dashboard', icon: Gauge, desc: 'Analytics & Metrics' },
            { id: 'cbc-tutor', name: activeTutorName, icon: GraduationCap, desc: `${activeCurriculumMeta.flag} ${activeCurriculumMeta.shortLabel}` },
            { id: 'learning-path', name: 'Learning Path', icon: Compass, desc: 'Adaptive Pathways' },
            { id: 'diagnostics', name: 'Diagnostics', icon: Activity, desc: 'Gaps & Misconceptions' },
            { id: 'fullscreen', name: 'Full Screen', icon: Maximize2, desc: 'Immersive Focus' }
          ].map((modeItem) => {
            const Icon = modeItem.icon;
            const isActive = tutorMode === modeItem.id || (modeItem.id === 'fullscreen' && fullscreenWidget === 'chat');
            
            return (
              <button
                key={modeItem.id}
                onClick={() => {
                  if (modeItem.id === 'fullscreen') {
                    setFullscreenWidget(fullscreenWidget === 'chat' ? null : 'chat');
                  } else {
                    setTutorMode(modeItem.id as any);
                  }
                }}
                className={`p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col gap-2 relative overflow-hidden group ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 border-[#19B37D] shadow-lg ring-2 ring-[#19B37D]/20 text-[#0E5E4B] dark:text-emerald-400'
                    : 'bg-white/80 dark:bg-slate-900/80 hover:bg-white border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl transition-colors ${
                    isActive ? 'bg-[#0E5E4B] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-[#0E5E4B]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#19B37D] animate-ping" />
                  )}
                </div>
                <div>
                  <span className="font-extrabold text-xs block leading-tight">{modeItem.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{modeItem.desc}</span>
                </div>
              </button>
            );
          })}
        </section>

        {/* 4. MAIN THREE-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT PANEL: LEARNING CONFIGURATION (3 Cols) */}
          <aside className="lg:col-span-3 space-y-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 shadow-2xs">
            
            {/* Segmented Control Header */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1 border border-slate-200/60 dark:border-slate-700">
              {[
                { id: 'config', name: 'CONFIG', icon: Settings },
                { id: 'materials', name: 'DOCS', icon: FileText },
                { id: 'voice', name: 'TEMPLATES', icon: Headphones }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isTabActive = leftSidebarTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setLeftSidebarTab(tab.id as any)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer ${
                      isTabActive
                        ? 'bg-[#0E5E4B] text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <TabIcon className="w-3 h-3" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: CONFIG & PARAMETERS */}
            {leftSidebarTab === 'config' && (
              <div className="space-y-4">
                
                {/* Card 1: Pedagogical Session */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#0E5E4B] dark:text-emerald-400 tracking-wider">
                      Pedagogical Session
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                      <Cloud className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
                      Cloud Synced
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-emerald-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                      {isCbcSession ? `${cbcSubject} - ${cbcStrand}` : topic}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      {isCbcSession ? `Form 3 • CBC Competency` : `${subject} • Core Curriculum`}
                    </span>
                  </div>
                </div>

                {/* Card 2: Tutor Parameters */}
                <div className="space-y-3 pt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Tutor Parameters
                  </span>

                  {/* Active Curriculum Selection */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-[#0E5E4B] dark:text-emerald-400" />
                        <span>Curriculum Framework</span>
                      </label>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-md">
                        {activeCurriculumMeta.flag} {activeCurriculumMeta.badge}
                      </span>
                    </div>
                    <select
                      value={selectedCurriculum}
                      onChange={(e) => handleCurriculumChange(e.target.value as CurriculumType)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0E5E4B] cursor-pointer"
                    >
                      {ALL_CURRICULA_METADATA.map((curr) => (
                        <option key={curr.id} value={curr.id}>
                          {curr.flag} {curr.label} ({curr.shortLabel})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Subject</label>
                    <EditableSelect
                      value={subject}
                      onChange={setSubject}
                      options={["Physics", "Mathematics", "Chemistry", "Biology", "English", "Computer Studies"]}
                      placeholder=""
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0E5E4B]"
                    />
                  </div>

                  {/* Active Topic */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Active Topic of Inquiry</label>
                    <EditableSelect
                      value={topic}
                      onChange={setTopic}
                      options={["Velocity and Acceleration", "Newtonian Kinematics", "Mass vs Weight", "Photosynthesis Cycles", "Cell Biology"]}
                      placeholder=""
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0E5E4B]"
                    />
                  </div>

                  {/* Persona Selection */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Pedagogical Persona</label>
                    <EditableSelect
                      value={persona}
                      onChange={(v) => setPersona(v as any)}
                      options={["Socratic Questioner", "Encouraging Mentor", "Critical Examiner"]}
                      placeholder=""
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0E5E4B]"
                    />
                  </div>

                  {/* Cognitive Focus */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Cognitive Level Focus</label>
                    <EditableSelect
                      value={cognitiveLevel}
                      onChange={setCognitiveLevel}
                      options={["Remember & Understand", "Understand & Apply", "Analyze & Evaluate", "Create & Synthesize"]}
                      placeholder=""
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0E5E4B]"
                    />
                  </div>

                  {/* Difficulty Level Buttons */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">Difficulty</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setDifficultyLevel(lvl)}
                          className={`py-1.5 rounded-lg text-[10px] font-extrabold capitalize transition cursor-pointer ${
                            difficultyLevel === lvl
                              ? 'bg-[#0E5E4B] text-white shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scaffolding Granularity */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">Scaffolding Granularity</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {(['low', 'medium', 'high'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setScaffoldingLevel(lvl)}
                          className={`py-1.5 rounded-lg text-[10px] font-extrabold capitalize transition cursor-pointer ${
                            scaffoldingLevel === lvl
                              ? 'bg-[#0E5E4B] text-white shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card 3: AI Behaviour */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">AI Behaviour Mode</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setDialogueStyle('guided')}
                      className={`p-2 rounded-xl border text-[11px] font-bold transition text-left ${
                        dialogueStyle === 'guided'
                          ? 'border-[#19B37D] bg-emerald-50/50 text-[#0E5E4B] dark:text-emerald-300'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Guided Discovery
                    </button>
                    <button
                      onClick={() => setDialogueStyle('direct')}
                      className={`p-2 rounded-xl border text-[11px] font-bold transition text-left ${
                        dialogueStyle === 'direct'
                          ? 'border-[#19B37D] bg-emerald-50/50 text-[#0E5E4B] dark:text-emerald-300'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Direct Explanation
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: DOCUMENTS & MATERIALS */}
            {leftSidebarTab === 'materials' && (
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Reference Files & Uploads
                </span>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-500/30 hover:border-[#19B37D] bg-emerald-50/30 rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center gap-1.5"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.docx"
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-[#0E5E4B]" />
                  <span className="text-xs font-bold text-slate-700">Upload PDF or DOCX</span>
                  <span className="text-[9px] text-slate-400 font-medium">Ground Socratic answers in curriculum docs</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {uploadedResources.map((res) => (
                    <div key={res.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                      <span className="font-bold truncate max-w-[140px] text-slate-700">{res.fileName}</span>
                      <button onClick={(e) => handleDeleteResource(res, e)} className="text-slate-400 hover:text-rose-500 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: VOICE & SPEECH */}
            {leftSidebarTab === 'voice' && (
              <div className="space-y-3 p-3 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-bold uppercase text-[#0E5E4B] block">Speech & Audio Output</span>
                <label className="flex items-center justify-between p-2 bg-white rounded-xl border text-xs font-bold text-slate-700">
                  <span>Enable Tutor Speech</span>
                  <input
                    type="checkbox"
                    checked={isVoiceEnabled}
                    onChange={(e) => setIsVoiceEnabled(e.target.checked)}
                    className="accent-[#0E5E4B]"
                  />
                </label>
              </div>
            )}

          </aside>

          {/* CENTER PANEL: PRIMARY LEARNING WORKSPACE (6 Cols) */}
          <main className="lg:col-span-6 space-y-5 flex flex-col">
            
            {/* Top Concept Selectors */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-4">
              
              {/* Dropdowns row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-[#0E5E4B]" />
                    Subtopic / Substrand
                  </label>
                  <EditableSelect
                    value={subTopicSelection}
                    onChange={setSubTopicSelection}
                    options={["Kinematics & Vector Motion", "Forces & Newton's Laws", "Energy & Work", "Wave Mechanics"]}
                    placeholder="Select a Subtopic / Substrand"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0E5E4B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Target className="w-3 h-3 text-[#0E5E4B]" />
                    Specific Concept
                  </label>
                  <EditableSelect
                    value={specificConceptSelection}
                    onChange={setSpecificConceptSelection}
                    options={["Instantaneous vs Average Acceleration", "Velocity-Time Graphs", "Free Fall Mechanics", "Projectile Motion Vectors"]}
                    placeholder="Select a Specific Concept"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0E5E4B]"
                  />
                </div>
              </div>

              {/* Dialogue Style Cards */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Tutor Dialogue Style</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Guided Discovery Card */}
                  <div
                    onClick={() => setDialogueStyle('guided')}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative ${
                      dialogueStyle === 'guided'
                        ? 'bg-emerald-50/50 border-[#19B37D] ring-2 ring-[#19B37D]/20'
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          dialogueStyle === 'guided' ? 'border-[#0E5E4B] bg-[#0E5E4B]' : 'border-slate-300'
                        }`}>
                          {dialogueStyle === 'guided' && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">Guided Discovery</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-2">
                      Active Socratic prompts with guiding questions to help you discover answers independently.
                    </p>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-[#0E5E4B]">
                      Guided Socratic
                    </span>
                  </div>

                  {/* Direct Explanation Card */}
                  <div
                    onClick={() => setDialogueStyle('direct')}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative ${
                      dialogueStyle === 'direct'
                        ? 'bg-emerald-50/50 border-[#19B37D] ring-2 ring-[#19B37D]/20'
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          dialogueStyle === 'direct' ? 'border-[#0E5E4B] bg-[#0E5E4B]' : 'border-slate-300'
                        }`}>
                          {dialogueStyle === 'direct' && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">Direct Explanation</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-2">
                      Immediate, clear and structured explanations with comprehension checks along the way.
                    </p>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                      Direct Teaching
                    </span>
                  </div>

                </div>
              </div>

              {/* Glowing Primary Button */}
              <button
                onClick={() => setTutorMode('learning-path')}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0E5E4B] via-[#12725B] to-[#19B37D] text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-900/20 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/30"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>START LEARNING PATH — Generate your personalized learning pathway</span>
              </button>

              <p className="text-[11px] text-center text-slate-400 font-medium">
                💡 AI adapts questions in real time based on your responses and mastery level.
              </p>

            </div>

            {/* Socratic Conversation Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xs overflow-hidden flex-1 flex flex-col min-h-[480px]">
              
              {/* Header Bar */}
              <div className="px-5 py-3 bg-[#0E5E4B] text-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs block leading-tight">Socratic Active Dialogue</span>
                      {/* Real-time AI Status Indicator */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        aiStatus === 'ready' ? 'bg-emerald-900/80 text-emerald-200 border-emerald-500/50' :
                        aiStatus === 'thinking' ? 'bg-purple-900/80 text-purple-200 border-purple-500/50' :
                        aiStatus === 'connecting' ? 'bg-amber-900/80 text-amber-200 border-amber-500/50' :
                        'bg-rose-900/80 text-rose-200 border-rose-500/50'
                      }`} title="Backend AI Connection Status">
                        {aiStatus === 'ready' && <Zap className="w-2.5 h-2.5 text-emerald-400" />}
                        {aiStatus === 'thinking' && <Loader2 className="w-2.5 h-2.5 text-purple-300 animate-spin" />}
                        {aiStatus === 'connecting' && <RefreshCw className="w-2.5 h-2.5 text-amber-300 animate-spin" />}
                        {aiStatus === 'offline' && <WifiOff className="w-2.5 h-2.5 text-rose-300" />}
                        <span className="capitalize">
                          {aiStatus === 'ready' && 'Ready'}
                          {aiStatus === 'thinking' && 'Thinking...'}
                          {aiStatus === 'connecting' && 'Connecting...'}
                          {aiStatus === 'offline' && 'Offline'}
                        </span>
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-100 font-medium">{subject} ➔ {topic}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {offlineQueue.length > 0 && (
                    <button
                      onClick={processOfflineQueue}
                      className="px-2.5 py-1 rounded-full bg-amber-500/30 hover:bg-amber-500/50 text-amber-100 border border-amber-400/50 text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1"
                      title="Sync and send queued offline messages"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-300 animate-spin" />
                      <span>Sync Queue ({offlineQueue.length})</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsWhatsAppModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-100 border border-emerald-400/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Open WhatsApp AI Tutor Channel & Setup"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="hidden sm:inline">WhatsApp AI</span>
                  </button>

                  <button
                    onClick={handleExportChatLog}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center gap-1 cursor-pointer"
                    title="Export Chat Log"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowClearConfirmModal(true)}
                    className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 transition text-xs flex items-center gap-1 cursor-pointer"
                    title="Clear Chat History"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Message History */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[380px] bg-slate-50/40 dark:bg-slate-900/40">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 max-w-[85%] ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                      msg.role === 'user' ? 'bg-[#19B37D] text-white' : 'bg-[#0E5E4B] text-white'
                    }`}>
                      {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div className="space-y-1">
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        msg.role === 'user'
                          ? 'bg-[#0E5E4B] text-white rounded-tr-none font-medium'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {/* Inline Generated Media Card (Image Studio & Video Studio) */}
                        {(() => {
                          let displayMedia = msg.media;

                          if (!displayMedia && msg.text) {
                            const mediaUrlMatch = msg.text.match(/(https?:\/\/[^\s\n]+|data:(image|video)\/[^;]+;base64,[^\s\n]+|\/api\/media\/serve\/[^\s\n]+)/i);
                            if (mediaUrlMatch) {
                              const url = mediaUrlMatch[0];
                              const isVid = url.includes('.mp4') || url.includes('video') || msg.text.toLowerCase().includes('video') || msg.text.toLowerCase().includes('animation');
                              displayMedia = {
                                type: isVid ? 'video' : 'image',
                                url: url,
                                prompt: msg.text.slice(0, 100),
                                generatorUsed: isVid ? 'Veo' : 'Emergen'
                              };
                            }
                          }

                          if (!displayMedia) return null;

                          return (
                            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-900 text-white shadow-md">
                              <div className="relative group">
                                {displayMedia.type === 'image' ? (
                                  <img
                                    src={displayMedia.url}
                                    alt={displayMedia.prompt}
                                    className="w-full h-auto max-h-72 object-cover cursor-pointer transition transform hover:scale-[1.01]"
                                    onClick={() => setLightboxMedia(displayMedia!)}
                                  />
                                ) : (
                                  <video
                                    src={displayMedia.url}
                                    controls
                                    className="w-full h-auto max-h-72 bg-black"
                                  />
                                )}
                                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                  {displayMedia.type === 'image' ? '🖼️ Image Studio' : '🎥 Video Studio'}
                                  <span className="text-slate-300">({displayMedia.generatorUsed || (displayMedia.type === 'image' ? 'Emergen' : 'Veo')})</span>
                                </div>
                              </div>

                              {/* Action Options Bar (Download, Regenerate, Edit, Share, Explain, Quiz, Revision Notes, Turn into Video) */}
                              <div className="p-3 bg-slate-800/95 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-700/80">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <a
                                    href={displayMedia.url}
                                    download={`edunexus_${displayMedia.type}_${Date.now()}`}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-100 font-medium flex items-center gap-1.5 cursor-pointer transition"
                                    title="Download media file"
                                  >
                                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Download</span>
                                  </a>

                                  <button
                                    onClick={() => handleSendMessage(`Generate a new ${displayMedia!.type} for: ${displayMedia!.prompt}`)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-100 font-medium flex items-center gap-1.5 cursor-pointer transition"
                                    title="Regenerate media"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Regenerate</span>
                                  </button>

                                  {displayMedia.type === 'image' ? (
                                    <button
                                      onClick={() => onOpenImageStudio?.(displayMedia!.prompt)}
                                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                                      title="Edit in Image Studio"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                      <span>Edit</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => onOpenVideoStudio?.(displayMedia!.prompt)}
                                      className="px-2.5 py-1.5 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                                      title="Edit in Video Studio"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                      <span>Edit</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      if (typeof navigator !== 'undefined' && navigator.share) {
                                        navigator.share({ title: 'EduNexus AI Media', text: displayMedia!.prompt, url: displayMedia!.url }).catch(() => {});
                                      } else if (typeof navigator !== 'undefined') {
                                        navigator.clipboard.writeText(displayMedia!.url);
                                        alert('Media link copied to clipboard!');
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-100 font-medium flex items-center gap-1.5 cursor-pointer transition"
                                    title="Share media link"
                                  >
                                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Share</span>
                                  </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    onClick={() => handleSendMessage(`Explain this ${displayMedia!.type} in detail: ${displayMedia!.prompt}`)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/30 hover:bg-emerald-900/80 text-emerald-300 font-medium flex items-center gap-1.5 cursor-pointer transition"
                                    title="Explain media concepts"
                                  >
                                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Explain</span>
                                  </button>

                                  <button
                                    onClick={() => handleSendMessage(`Create a 3-question quiz based on this ${displayMedia!.type}: ${displayMedia!.prompt}`)}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 border border-amber-500/30 hover:bg-amber-900/80 text-amber-300 font-medium flex items-center gap-1.5 cursor-pointer transition"
                                    title="Generate quiz from media"
                                  >
                                    <Brain className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Quiz</span>
                                  </button>

                                  <button
                                    onClick={() => handleSendMessage(`Generate structured revision notes and key takeaways for this ${displayMedia!.type}: ${displayMedia!.prompt}`)}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-950/70 border border-indigo-500/30 hover:bg-indigo-900/80 text-indigo-300 font-medium flex items-center gap-1.5 cursor-pointer transition"
                                    title="Create revision notes"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Notes</span>
                                  </button>

                                  {displayMedia.type === 'image' && (
                                    <button
                                      onClick={() => handleSendMessage(`Create a video animation based on this image: ${displayMedia!.prompt}`)}
                                      className="px-2.5 py-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/30 hover:bg-cyan-900/80 text-cyan-300 font-medium flex items-center gap-1.5 cursor-pointer transition"
                                      title="Turn image into video animation"
                                    >
                                      <Video className="w-3.5 h-3.5 text-cyan-400" />
                                      <span>Make Video</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Delivery Status & Resend Options for User Messages */}
                      {msg.role === 'user' && (
                        <div className="flex items-center justify-end gap-2 text-[10px] text-slate-400 pt-0.5">
                          {msg.timestamp && <span>{msg.timestamp}</span>}

                          {msg.status === 'sending' && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold" title="Sending message to AI Tutor">
                              <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                              <Check className="w-3 h-3 text-amber-500" />
                              <span>Sending...</span>
                            </span>
                          )}

                          {msg.status === 'delivered' && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold" title="Delivered to AI Tutor (Double Tick)">
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Delivered</span>
                            </span>
                          )}

                          {msg.status === 'queued' && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-extrabold" title="Queued in offline storage (Single Tick)">
                              <Check className="w-3 h-3 text-amber-500" />
                              <span>Queued Offline</span>
                            </span>
                          )}

                          {(msg.status === 'failed' || msg.status === 'queued') && (
                            <button
                              onClick={() => handleSendMessage(msg.text, msg.id)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-200 hover:bg-rose-200 border border-rose-300 dark:border-rose-800 font-black text-[10px] transition cursor-pointer shadow-2xs"
                              title="Resend this message"
                            >
                              <RotateCcw className="w-3 h-3 text-rose-600" />
                              <span>Resend</span>
                            </button>
                          )}
                        </div>
                      )}

                      {msg.role === 'model' && (
                        <div className="flex items-center gap-2 pl-1">
                          <button
                            onClick={() => handleToggleSpeakMessage(msg.text)}
                            className="text-[10px] text-slate-400 hover:text-[#0E5E4B] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Volume2 className="w-3 h-3" /> Read Aloud
                          </button>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleMessageFeedback(idx, 'up')} className="p-1 text-slate-400 hover:text-emerald-600">
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleMessageFeedback(idx, 'down')} className="p-1 text-slate-400 hover:text-rose-600">
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isProcessing && (
                  <div className="flex gap-2 items-center text-xs text-slate-400 font-medium italic">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0E5E4B]" />
                    <span>EduNexus AI Tutor is thinking Socratic questions...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Offline Queue Notification Banner */}
              {(!isOnline || offlineQueue.length > 0) && (
                <div className="mx-3 mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-medium">
                    <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      {!isOnline
                        ? 'Offline Mode: Messages will be added to queue and delivered when connected.'
                        : `${offlineQueue.length} message(s) stored in offline queue.`}
                    </span>
                  </div>
                  {offlineQueue.length > 0 && isOnline && (
                    <button
                      onClick={processOfflineQueue}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Sync All ({offlineQueue.length})</span>
                    </button>
                  )}
                </div>
              )}

              {/* Chat Input Bar */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRequestHint}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>Request Hint</span>
                  </button>

                  <button
                    onClick={toggleListening}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      isListening ? 'bg-rose-500 text-white border-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                    title="Voice Input"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Type your response or ask a Socratic question..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#19B37D]/30 focus:border-[#0E5E4B]"
                  />

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isProcessing || !inputMessage.trim()}
                    className="p-2.5 rounded-2xl bg-[#0E5E4B] hover:bg-[#12725B] text-white shadow-md transition disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </main>

          {/* RIGHT PANEL: AI LEARNING INSIGHTS (3 Cols) */}
          <aside className="lg:col-span-3 space-y-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 shadow-2xs">
            
            {/* Header & Tabs */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0E5E4B] dark:text-emerald-400">
                AI Learning Insights
              </span>
              <div className="flex gap-1">
                {(['ALL', 'CONCEPT MAP', 'DIAGNOSTIC'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setRightSidebarTab(tab.toLowerCase() as any)}
                    className="px-2 py-0.5 rounded-md text-[9px] font-extrabold text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* CONCEPT VISUALIZER */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Concept Visualizer
              </span>

              {/* Node Graph Box */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 relative min-h-[220px] overflow-hidden">
                <svg className="w-full h-44">
                  {conceptMap.edges.map((edge, i) => (
                    <line
                      key={i}
                      x1={40 + (i * 40)}
                      y1={30}
                      x2={120 + (i * 30)}
                      y2={110}
                      stroke="#19B37D"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  ))}
                </svg>

                {/* Nodes rendered */}
                <div className="absolute inset-0 p-3 grid grid-cols-2 gap-2">
                  {conceptMap.nodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => setInputMessage(`Explain ${node.label}`)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-left hover:border-[#19B37D] transition cursor-pointer"
                    >
                      <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 block">{node.label}</span>
                      <span className="text-[9px] text-slate-400 truncate block">{node.type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal font-medium">
                💡 Hover over nodes to see explanations. Click a node to generate Socratic questions or explore examples.
              </p>
            </div>

            {/* AI Pedagogical State & Misconception Diagnostics */}
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-800 block">Active Scaffolding Step</span>
                <span className="text-xs font-bold text-slate-800 block capitalize">{activeStep}</span>
              </div>

              {misconceptions.length > 0 && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-rose-800 block">Detected Gaps ({misconceptions.length})</span>
                  {misconceptions.map((m, idx) => (
                    <p key={idx} className="text-[10px] text-rose-900 font-semibold leading-tight">• {m}</p>
                  ))}
                </div>
              )}
            </div>

            {/* External Breakthrough References */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Recommended Portals</span>
              <div className="grid grid-cols-2 gap-1.5">
                {defaultVisualAids.map((aid) => (
                  <a
                    key={aid.name}
                    href={aid.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-700 hover:bg-white text-center truncate block shadow-2xs"
                  >
                    {aid.name}
                  </a>
                ))}
              </div>
            </div>

          </aside>

        </div>

        {/* 5. BOTTOM FEATURE SUMMARY CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {[
            {
              title: "Adaptive Learning",
              desc: "Questions adapt to your understanding in real time.",
              icon: Brain,
              color: "text-purple-600 bg-purple-50 border-purple-200"
            },
            {
              title: "Socratic Method",
              desc: "Promotes deep conceptual reasoning through targeted inquiry.",
              icon: Cpu,
              color: "text-emerald-600 bg-emerald-50 border-emerald-200"
            },
            {
              title: "Curriculum Alignment",
              desc: "100% aligned with Kenyan CBC and global core standards.",
              icon: GraduationCap,
              color: "text-teal-600 bg-teal-50 border-teal-200"
            },
            {
              title: "Mastery Focused",
              desc: "Guides learners from recall to synthesis & application.",
              icon: Award,
              color: "text-amber-600 bg-amber-50 border-amber-200"
            }
          ].map((card, i) => {
            const CardIcon = card.icon;
            return (
              <div key={i} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-300 space-y-2">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${card.color}`}>
                  <CardIcon className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{card.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </section>

      </div>

      {/* 6. FLOATING AI COPILOT ASSISTANT */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isCopilotOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#0E5E4B] text-white flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white block">Ask EduNexus AI</span>
                    <span className="text-[9px] text-emerald-600 font-bold uppercase">Copilot Assistant</span>
                  </div>
                </div>
                <button onClick={() => setIsCopilotOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Actions</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Explain this concept",
                    "Generate questions",
                    "Create assessment",
                    "Suggest experiment",
                    "Find misconceptions"
                  ].map((promptText) => (
                    <button
                      key={promptText}
                      onClick={() => {
                        handleIcebreaker(promptText);
                        setIsCopilotOpen(false);
                      }}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 border border-slate-200 dark:border-slate-700 text-left text-[10.5px] font-bold text-slate-700 dark:text-slate-200 transition"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Ask copilot anything..."
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && copilotInput.trim()) {
                      handleIcebreaker(copilotInput);
                      setCopilotInput('');
                      setIsCopilotOpen(false);
                    }
                  }}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#0E5E4B]"
                />
                <button
                  onClick={() => {
                    if (copilotInput.trim()) {
                      handleIcebreaker(copilotInput);
                      setCopilotInput('');
                      setIsCopilotOpen(false);
                    }
                  }}
                  className="p-2 bg-[#0E5E4B] text-white rounded-xl"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          className="p-4 rounded-full bg-gradient-to-br from-[#0E5E4B] to-[#19B37D] text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center border-2 border-white/20"
          title="Ask EduNexus AI"
        >
          <Bot className="w-6 h-6 animate-pulse" />
        </button>
      </div>

      {/* Modals */}
      <FlashcardDeckModal
        deck={activeFlashcardDeck}
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        onSaveToLibrary={handleSaveFlashcardsToLibrary}
      />

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Clear Socratic Chat History?</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    This will reset your conversation history for this topic. Saved documents will remain safe in your library.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowClearConfirmModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearChat}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                >
                  Clear History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Integration & Simulation Modal */}
      <WhatsAppIntegrationModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        defaultPrompt={topic ? `Can you explain ${topic} in ${subject}?` : "Explain Newton's Second Law of Motion"}
        userPhone="+254740183934"
      />

      {/* Lightbox Modal for Generated Media (Image & Video) */}
      <AnimatePresence>
        {lightboxMedia && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center p-4">
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 cursor-pointer shadow-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="max-w-4xl max-h-[85vh] w-full flex flex-col items-center justify-center">
              {lightboxMedia.type === 'image' ? (
                <img
                  src={lightboxMedia.url}
                  alt={lightboxMedia.prompt}
                  className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl object-contain border border-slate-700"
                />
              ) : (
                <video
                  src={lightboxMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl border border-slate-700"
                />
              )}
              <div className="mt-4 text-center bg-slate-900/90 text-slate-100 text-xs sm:text-sm font-medium px-5 py-3 rounded-2xl max-w-2xl border border-slate-800 shadow-xl flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">
                  {lightboxMedia.type === 'image' ? '🖼️ EduNexus Image Studio' : '🎥 EduNexus Video Studio'}
                </span>
                <p className="italic">"{lightboxMedia.prompt}"</p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
