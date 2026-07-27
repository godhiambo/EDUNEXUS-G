import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Check
} from 'lucide-react';
import { SavedDocument, PersonalizedLearningPath, FlashcardDeck } from '../types';
import { LearningPathWorkspace } from './LearningPathWorkspace';
import FlashcardDeckModal from './FlashcardDeckModal';
import { cbcSubjectsData } from '../data/cbcData';
import { EditableSelect } from './EditableSelect';
import { db, auth, storage, handleFirestoreError, OperationType, cleanUndefined } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { SetupForm } from './SetupForm';
import { handleResponseJson } from '../utils/api';

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
  role: 'user' | 'model';
  text: string;
  feedback?: 'up' | 'down';
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
}

export default function AITutor({ documents, initialSelectedResourceId }: AITutorProps) {
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
            text: "Hello! I am EduNexus AI Tutor. Instead of just giving you the answers directly, I am here to help you work through concepts step-by-step so you truly master them. What would you like to explore today?"
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
          title: "Velocity & Acceleration Starter Map",
          nodes: [
            { id: "node1", label: "Position", type: "concept", description: "An object's location relative to a reference point." },
            { id: "node2", label: "Velocity", type: "concept", description: "The rate of change of position with respect to time." },
            { id: "node3", label: "Acceleration", type: "concept", description: "The rate of change of velocity with respect to time." }
          ],
          edges: [
            { from: "node1", to: "node2", label: "rate of change" },
            { from: "node2", to: "node3", label: "rate of change" }
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

  const [showConceptMap, setShowConceptMap] = useState<boolean>(true);
  const isSwitchingSessionRef = useRef<boolean>(false);

  // Session parameters loaded from active session
  const [subject, setSubject] = useState<string>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? active.subject : 'Physics';
  });
  const [topic, setTopic] = useState<string>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? active.topic : 'Velocity and Acceleration';
  });
  const [scaffoldingLevel, setScaffoldingLevel] = useState<'low' | 'medium' | 'high'>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? active.scaffoldingLevel : 'medium';
  });
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active && active.difficultyLevel ? active.difficultyLevel : 'intermediate';
  });
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [persona, setPersona] = useState<'Socratic Questioner' | 'Encouraging Mentor' | 'Critical Examiner'>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? active.persona : 'Socratic Questioner';
  });
  
  // Concept Visualization state
  const [conceptMap, setConceptMap] = useState<ConceptVisualization>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? active.conceptMap : {
      title: "Velocity & Acceleration Starter Map",
      nodes: [
        { id: "node1", label: "Position", type: "concept", description: "An object's location relative to a reference point." },
        { id: "node2", label: "Velocity", type: "concept", description: "The rate of change of position with respect to time." },
        { id: "node3", label: "Acceleration", type: "concept", description: "The rate of change of velocity with respect to time." }
      ],
      edges: [
        { from: "node1", to: "node2", label: "rate of change" },
        { from: "node2", to: "node3", label: "rate of change" }
      ]
    };
  });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  // Student Personalized Learning Path State
  const [tutorMode, setTutorMode] = useState<'socratic' | 'cbc-tutor' | 'learning-path'>('socratic');

  // Full screen widget toggle state
  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null);

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

  // Custom uploaded resources state & handlers
  const { user, profile } = useAuth();
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

  // Organized Panel Tab States
  const [leftSidebarTab, setLeftSidebarTab] = useState<'config' | 'materials' | 'voice'>('config');
  const [rightSidebarTab, setRightSidebarTab] = useState<'all' | 'concept' | 'pedagogy' | 'resources'>('all');

  // Flashcards state in Socratic AI Sidebar
  const [activeFlashcardDeck, setActiveFlashcardDeck] = useState<FlashcardDeck | null>(null);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState<boolean>(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState<boolean>(false);

  const handleGenerateSocraticFlashcards = async () => {
    setIsGeneratingFlashcards(true);
    try {
      const selectedRes = uploadedResources.find(r => r.id === selectedResourceId);
      const activeSubject = isCbcSession ? cbcSubject : subject;
      const activeTopic = isCbcSession ? `${cbcStrand} - ${cbcSubStrand}` : topic;
      const activeContent = selectedRes ? selectedRes.extractedText : messages.slice(-6).map(m => `${m.sender}: ${m.text}`).join('\n');

      const res = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubject || 'General Studies',
          topic: activeTopic || 'Core Socratic Lesson',
          subtopic: cbcConcept || 'Contextual Review',
          content: activeContent,
          cardCount: 6,
          isLowDifficultySupport: false
        })
      });
      const data = await handleResponseJson(res);
      if (data.deck) {
        setActiveFlashcardDeck(data.deck);
        setIsFlashcardModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to generate contextual flashcards in Socratic AI:", err);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleSaveFlashcardsToLibrary = async (deck: FlashcardDeck) => {
    if (!profile?.uid) return;
    const docId = deck.id || `flashcard-${Date.now()}`;
    const savedDoc: SavedDocument = {
      id: docId,
      title: deck.title,
      docType: 'flashcards',
      curriculum: 'cbc',
      subject: deck.subject || 'General',
      classLevel: 'Upper Primary / Secondary',
      topic: deck.topic || 'Socratic Lesson',
      subTopic: '',
      duration: '15 mins',
      content: deck.cards.map((c, i) => `Card ${i + 1}: Q: ${c.front}\nA: ${c.back}${c.hint ? `\nHint: ${c.hint}` : ''}`).join('\n\n'),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      tags: ['flashcards', 'socratic-ai', 'file-library', deck.subject],
      category: 'Flashcards',
      lastModifiedByUid: profile.uid,
      lastModifiedByName: profile.displayName,
      flashcardDeck: deck,
    };

    await setDoc(doc(db, 'documents', docId), savedDoc as any);
  };
 
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

    // Validate file type
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx');

    if (!isPDF && !isDOCX) {
      setUploadError("Invalid file type. Please upload a PDF or DOCX file.");
      return;
    }

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size is too large. Please upload a file smaller than 10MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    try {
      // 1. Convert to base64 for server-side parsing
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

      // 2. Call backend parser
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
        throw new Error("Failed to extract text content from the document.");
      }

      const parseData = await parseResponse.json();
      const extractedText = parseData.text || '';
      
      if (!extractedText.trim()) {
        throw new Error("The uploaded document appears to be empty or contains no readable text.");
      }

      setUploadProgress(60);

      // 3. Upload to Firebase Storage
      const fileId = `res-${Date.now()}`;
      const storageRef = ref(storage, `curriculum_documents/${profile?.uid || 'anonymous'}/${fileId}/${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      setUploadProgress(80);

      // 4. Save metadata + extractedText to Firestore
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
        topic: topic || 'General Guide'
      };

      await setDoc(doc(db, 'uploadedResources', fileId), resourceData);
      
      setUploadProgress(100);
      setSelectedResourceId(fileId); // Auto-select the newly uploaded file

      // Add a friendly tutor notification message
      const textMsg = `Success! I have processed and indexed your curriculum resource: "${file.name}". This guide is now added to your contextual knowledge base. Socratic Sage will refer to it during our dialogue. How should we proceed?`;
      setMessages(prev => [
        ...prev,
        { role: 'model', text: textMsg }
      ]);
      
      if (isVoiceEnabled) {
        speakText(textMsg);
      }

    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "An unexpected error occurred during document upload.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    }
  };

  const handleDeleteResource = async (res: UploadedResource, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${res.fileName}"?`)) return;

    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, 'uploadedResources', res.id));

      // 2. Delete from Firebase Storage
      const storageRef = ref(storage, res.storagePath);
      await deleteObject(storageRef);

      if (selectedResourceId === res.id) {
        setSelectedResourceId('');
      }
    } catch (err) {
      console.error("Error deleting resource:", err);
      alert("Failed to fully delete the resource.");
    }
  };
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? active.messages : [
      {
        role: 'model',
        text: "Hello! I am EduNexus AI Tutor. Instead of just giving you the answers directly, I am here to help you work through concepts step-by-step so you truly master them. What would you like to explore today?"
      }
    ];
  });
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<string>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? active.activeStep : 'Exploratory onboarding';
  });
  const [misconceptions, setMisconceptions] = useState<string[]>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? active.misconceptions : [];
  });
  const [suggestedResources, setSuggestedResources] = useState<SuggestedResource[]>(() => {
    const active = sessions.find(s => s.id === activeSessionId) || sessions[0];
    return active ? active.suggestedResources : [
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
    ];
  });

  const loadSession = (session: ChatSession) => {
    isSwitchingSessionRef.current = true;
    
    setSubject(session.subject);
    setTopic(session.topic);
    setScaffoldingLevel(session.scaffoldingLevel);
    setDifficultyLevel(session.difficultyLevel || 'intermediate');
    setPersona(session.persona);
    setMessages(session.messages);
    setActiveStep(session.activeStep);
    setMisconceptions(session.misconceptions);
    setSuggestedResources(session.suggestedResources);
    setConceptMap(session.conceptMap);
    setActiveSessionId(session.id);
    
    // Load CBC-specific properties
    setIsCbcSession(!!(session as any).isCbcMode);
    setCbcSubject((session as any).cbcSubject || '');
    setCbcStrand((session as any).cbcStrand || '');
    setCbcSubStrand((session as any).cbcSubStrand || '');
    setCbcConcept((session as any).cbcConcept || '');
    setCbcSystemPrompt((session as any).cbcSystemPrompt || '');
    setCbcSocraticMode((session as any).cbcSocraticMode || 'guided');

    // Auto-switch mode tab to match session type
    if ((session as any).isCbcMode) {
      setTutorMode('cbc-tutor');
    } else {
      setTutorMode('socratic');
    }
    
    setTimeout(() => {
      isSwitchingSessionRef.current = false;
    }, 100);
  };

  // Real-time Firestore listener for user Socratic Tutor Sessions
  useEffect(() => {
    if (!user?.uid) return;

    setIsSyncingWithFirestore(true);
    const q = query(
      collection(db, 'tutorSessions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setIsSyncingWithFirestore(false);
        return;
      }

      const remoteSessions: ChatSession[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        remoteSessions.push({
          id: data.id || docSnap.id,
          title: data.title || 'Untitled Session',
          subject: data.subject || 'General Education',
          topic: data.topic || 'General Topic',
          persona: data.persona || 'Socratic Questioner',
          scaffoldingLevel: data.scaffoldingLevel || 'medium',
          difficultyLevel: data.difficultyLevel || 'intermediate',
          messages: data.messages || [],
          activeStep: data.activeStep || 'Active Discussion',
          misconceptions: data.misconceptions || [],
          suggestedResources: data.suggestedResources || [],
          conceptMap: data.conceptMap || { title: 'Concept Map', nodes: [], edges: [] },
          createdAt: data.createdAt || new Date().toISOString(),
          isCbcMode: !!data.isCbcMode,
          cbcSubject: data.cbcSubject || '',
          cbcStrand: data.cbcStrand || '',
          cbcSubStrand: data.cbcSubStrand || '',
          cbcConcept: data.cbcConcept || '',
          cbcSocraticMode: data.cbcSocraticMode || 'guided',
        } as any);
      });

      // Sort descending by createdAt
      remoteSessions.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      if (remoteSessions.length > 0) {
        setSessions(remoteSessions);
        try {
          localStorage.setItem('ai_tutor_sessions_v1', JSON.stringify(remoteSessions));
        } catch (e) {}
      }
      setIsSyncingWithFirestore(false);
    }, (err) => {
      console.warn("[Firestore Tutor Sessions Listener Notice]", err);
      setIsSyncingWithFirestore(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleCreateNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat Session',
      subject: 'Physics',
      topic: 'Velocity and Acceleration',
      persona: 'Socratic Questioner',
      scaffoldingLevel: 'medium',
      difficultyLevel,
      messages: [
        {
          role: 'model',
          text: `Hello! I am EduNexus AI Tutor. Today we are exploring Physics - Velocity and Acceleration. What would you like to explore?`
        }
      ],
      activeStep: 'Exploratory onboarding',
      misconceptions: [],
      suggestedResources: [
        {
          title: "PhET Moving Man Simulation",
          url: "https://phet.colorado.edu/en/simulations/moving-man",
          reason: "Excellent for visualizing position, velocity, and acceleration vectors in real time."
        }
      ],
      conceptMap: {
        title: "Velocity & Acceleration Starter Map",
        nodes: [
          { id: "node1", label: "Position", type: "concept", description: "An object's location relative to a reference point." },
          { id: "node2", label: "Velocity", type: "concept", description: "The rate of change of position with respect to time." },
          { id: "node3", label: "Acceleration", type: "concept", description: "The rate of change of velocity with respect to time." }
        ],
        edges: [
          { from: "node1", to: "node2", label: "rate of change" },
          { from: "node2", to: "node3", label: "rate of change" }
        ]
      },
      createdAt: new Date().toISOString()
    };

    if (user?.uid) {
      (newSession as any).userId = user.uid;
      const payload = cleanUndefined({
        ...newSession,
        userId: user.uid,
        updatedAt: new Date().toISOString()
      });
      setDoc(doc(db, 'tutorSessions', newId), payload).catch(err => {
        console.warn("[Firestore Save New Session Warning]", err);
      });
    }

    setSessions(prev => [newSession, ...prev]);
    loadSession(newSession);
  };

  const handleCreateNewCbcSession = (subName: string, strandName: string, subStrandName: string, conceptName: string, socraticMode: 'guided' | 'direct' = 'guided') => {
    const newId = `cbc-session-${Date.now()}`;
    const firstUserMessage = `The student has selected: Subject: ${subName}, Topic: ${strandName}, Subtopic: ${subStrandName}, Concept: ${conceptName}. Please introduce the concept and ask a foundational question to begin.`;
    
    const newSession: ChatSession = {
      id: newId,
      title: `${subName} - ${conceptName}`,
      subject: subName,
      topic: `${strandName} (${subStrandName})`,
      persona: 'Socratic Questioner',
      scaffoldingLevel: 'medium',
      difficultyLevel,
      messages: [],
      activeStep: 'Foundational Assessment',
      misconceptions: [],
      suggestedResources: [],
      conceptMap: {
        title: `${conceptName} Concept Starter`,
        nodes: [
          { id: "node1", label: conceptName, type: "concept", description: `Active study of ${conceptName} in CBC curriculum.` }
        ],
        edges: []
      },
      createdAt: new Date().toISOString(),
      cbcSocraticMode: socraticMode
    };

    const dialogueStyleInstruction = socraticMode === 'direct' 
      ? `DIALOGUE STYLE: "Direct Explanation"
- You MUST provide clear, direct, and immediate explanations. 
- When the student asks a question, seeks clarification, or is stuck, answer them fully and directly upfront without withholding the answer or being cryptic.
- Do NOT guide them to find the answer when they want a direct explanation; explain it to them clearly with vivid analogies from daily Kenyan life (e.g., duka, matatu, farming) and helpful details first.
- Once you have fully explained the concept, ask exactly ONE clear review/comprehension question to verify they understood your explanation.`
      : `DIALOGUE STYLE: "Guided Discovery (Socratic)"
- You MUST use active, warm, Socratic dialogue to prompt the student.
- Never provide full, direct solutions or answers right away.
- Guide the student step-by-step with small scaffolding steps, asking thoughtful open-ended questions to probe their assumptions and help them discover the answer on their own.`;

    const customSystemPrompt = `STUDY PLAN OVERVIEW:
The student has selected a guided learning path with the following parameters:
- Subject / Learning Area: ${subName}
- Strand / Topic: ${strandName}
- Sub-strand / Subtopic: ${subStrandName}
- Core Concept: ${conceptName}

Your primary instruction is to assist the student in mastering this exact concept.

${dialogueStyleInstruction}`;

    // Store custom CBC attributes on session object
    (newSession as any).isCbcMode = true;
    (newSession as any).cbcSubject = subName;
    (newSession as any).cbcStrand = strandName;
    (newSession as any).cbcSubStrand = subStrandName;
    (newSession as any).cbcConcept = conceptName;
    (newSession as any).cbcSystemPrompt = customSystemPrompt;
    (newSession as any).cbcSocraticMode = socraticMode;

    if (user?.uid) {
      (newSession as any).userId = user.uid;
      const payload = cleanUndefined({
        ...newSession,
        userId: user.uid,
        updatedAt: new Date().toISOString()
      });
      setDoc(doc(db, 'tutorSessions', newId), payload).catch(err => {
        console.warn("[Firestore Save New CBC Session Warning]", err);
      });
    }

    setSessions(prev => [newSession, ...prev]);
    
    // Explicitly update all corresponding state fields before triggering the message
    isSwitchingSessionRef.current = true;
    setSubject(subName);
    setTopic(`${strandName} (${subStrandName})`);
    setScaffoldingLevel('medium');
    setPersona('Socratic Questioner');
    setMessages([]);
    setActiveStep('Foundational Assessment');
    setMisconceptions([]);
    setSuggestedResources([]);
    setConceptMap(newSession.conceptMap);
    setActiveSessionId(newId);
    
    setIsCbcSession(true);
    setCbcSubject(subName);
    setCbcStrand(strandName);
    setCbcSubStrand(subStrandName);
    setCbcConcept(conceptName);
    setCbcSystemPrompt(customSystemPrompt);
    setCbcSocraticMode(socraticMode);
    setTutorMode('cbc-tutor');

    setTimeout(() => {
      isSwitchingSessionRef.current = false;
      // Trigger the initial Socratic introduction automatically via hidden system prompt!
      handleSend(firstUserMessage, true);
    }, 150);
  };

  const handleChangeTopic = () => {
    // Clear current learning path selections
    setIsCbcSession(false);
    setCbcSubject('');
    setCbcStrand('');
    setCbcSubStrand('');
    setCbcConcept('');
    
    // Clear message history to return to the fresh Setup Form
    setMessages([]);
    
    // Reset active Socratic topic/subject as well
    setSubject('Mathematics');
    setTopic('');

    // Ensure the tab is active on cbc-tutor Setup Form
    setTutorMode('cbc-tutor');
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      alert("You must keep at least one chat session.");
      return;
    }
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      loadSession(filtered[0]);
    }

    if (user?.uid) {
      try {
        await deleteDoc(doc(db, 'tutorSessions', id));
      } catch (err) {
        console.warn("[Firestore Delete Session Warning]", err);
      }
    }
  };

  const handleExportChatLog = () => {
    const formatSessionLog = () => {
      let logText = `# EduNexus AI Tutor Session: ${subject} - ${topic}\n`;
      logText += `*Persona:* ${persona}\n`;
      logText += `*Difficulty Level:* ${difficultyLevel}\n`;
      logText += `*Scaffolding:* ${scaffoldingLevel}\n`;
      logText += `*Date:* ${new Date().toLocaleDateString()}\n\n`;
      logText += `--- \n\n`;
      
      messages.forEach((msg) => {
        const sender = msg.role === 'user' ? 'Student' : 'Tutor';
        logText += `### **${sender}**:\n${msg.text}\n\n`;
      });
      
      if (misconceptions.length > 0) {
        logText += `--- \n\n## Detected Misconception Diagnoses:\n`;
        misconceptions.forEach((mis) => {
          logText += `- ${mis}\n`;
        });
        logText += `\n`;
      }
      
      return logText;
    };

    const text = formatSessionLog();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tutor_Session_${topic.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sync effect to save session details back to sessions list, localStorage, and Firestore
  useEffect(() => {
    if (isSwitchingSessionRef.current) return;
    
    setSessions(prev => {
      let activeSessToSave: ChatSession | null = null;
      const updated = prev.map(s => {
        if (s.id === activeSessionId) {
          const derivedTitle = messages.length > 1 && topic ? `${subject} - ${topic}` : s.title;
          const updatedSession = {
            ...s,
            title: derivedTitle,
            subject,
            topic,
            scaffoldingLevel,
            difficultyLevel,
            persona,
            messages,
            activeStep,
            misconceptions,
            suggestedResources,
            conceptMap,
            isCbcMode: isCbcSession,
            cbcSubject,
            cbcStrand,
            cbcSubStrand,
            cbcConcept,
            cbcSocraticMode
          };
          activeSessToSave = updatedSession;
          return updatedSession;
        }
        return s;
      });
      localStorage.setItem('ai_tutor_sessions_v1', JSON.stringify(updated));

      // Asynchronously sync to Firestore if user is logged in
      if (user?.uid && activeSessToSave) {
        const payload = cleanUndefined({
          id: (activeSessToSave as ChatSession).id,
          userId: user.uid,
          title: (activeSessToSave as ChatSession).title,
          subject: (activeSessToSave as ChatSession).subject,
          topic: (activeSessToSave as ChatSession).topic,
          persona: (activeSessToSave as ChatSession).persona,
          scaffoldingLevel: (activeSessToSave as ChatSession).scaffoldingLevel,
          difficultyLevel: (activeSessToSave as ChatSession).difficultyLevel || 'intermediate',
          messages: (activeSessToSave as ChatSession).messages,
          activeStep: (activeSessToSave as ChatSession).activeStep,
          misconceptions: (activeSessToSave as ChatSession).misconceptions,
          suggestedResources: (activeSessToSave as ChatSession).suggestedResources,
          conceptMap: (activeSessToSave as ChatSession).conceptMap,
          createdAt: (activeSessToSave as ChatSession).createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isCbcMode: !!(activeSessToSave as any).isCbcMode,
          cbcSubject: (activeSessToSave as any).cbcSubject || '',
          cbcStrand: (activeSessToSave as any).cbcStrand || '',
          cbcSubStrand: (activeSessToSave as any).cbcSubStrand || '',
          cbcConcept: (activeSessToSave as any).cbcConcept || '',
          cbcSocraticMode: (activeSessToSave as any).cbcSocraticMode || 'guided'
        });

        setDoc(doc(db, 'tutorSessions', (activeSessToSave as ChatSession).id), payload)
          .catch(err => console.warn('[Firestore Auto-save Session Warning]', err));
      }

      return updated;
    });
  }, [activeSessionId, subject, topic, scaffoldingLevel, difficultyLevel, persona, messages, activeStep, misconceptions, suggestedResources, conceptMap, isCbcSession, cbcSubject, cbcStrand, cbcSubStrand, cbcConcept, cbcSocraticMode, user?.uid]);

  // Voice & Hands-free dialogue states
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(false);
  const [isHandsFree, setIsHandsFree] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [voiceRate, setVoiceRate] = useState<number>(1);
  const [voicePitch, setVoicePitch] = useState<number>(1);
  const [voiceVolume, setVoiceVolume] = useState<number>(1);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Speech Synthesis Voices & Speech Recognition check
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        
        // Match a natural sounding english voice by default
        const defaultVoice = available.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Female'))) || available.find(v => v.lang.startsWith('en')) || available[0];
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Speak Socratic Tutor output
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingText(null);

    // Filter hyperlinks and brackets for cleaner audio speech
    const cleanText = text
      .replace(/https?:\/\/\S+/g, '') // strip URLs
      .replace(/[\[\]\(\)\-\+\*]/g, ' ') // strip special formatting symbols
      .replace(/ {2,}/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    if (selectedVoiceName) {
      const voice = voices.find(v => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
    }
    
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
    utterance.volume = voiceVolume;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingText(text);
      // Temporarily halt listening if active to prevent tutor listening to its own voice
      if (recognitionRef.current && isListening) {
        recognitionRef.current.abort();
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingText(null);
      // Auto-resume listening if Hands-Free dialogue loop is active
      if (isHandsFree && isVoiceEnabled) {
        setTimeout(() => {
          startListening();
        }, 400);
      }
    };

    utterance.onerror = (e) => {
      console.error('TTS error:', e);
      setIsSpeaking(false);
      setSpeakingText(null);
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Start Speech Recognition
  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support Web Speech Recognition.');
      return;
    }

    // Stop speaking first
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognition();
      rec.continuous = false; // Turn-based dialogue
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
      };

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += t;
          } else {
            interim += t;
          }
        }
        if (final) {
          setInputMessage(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${final.trim()}` : final.trim();
          });
        } else if (interim) {
          setInterimTranscript(interim);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        
        // Auto submit if dialogue is hands-free and we got text
        setInputMessage(curr => {
          if (curr.trim() && isHandsFree) {
            handleSend(curr);
            return '';
          }
          return curr;
        });
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
    }
  };

  // Stop Speech Recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsListening(false);
  };

  // Handle manual speaker trigger for bubble replays
  const handleToggleSpeakMessage = (text: string) => {
    if (isSpeaking && speakingText === text) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setSpeakingText(null);
    } else {
      speakText(text);
    }
  };

  const handleMessageFeedback = (idx: number, feedbackType: 'up' | 'down') => {
    setMessages(prev =>
      prev.map((msg, i) => {
        if (i === idx) {
          return {
            ...msg,
            feedback: msg.feedback === feedbackType ? undefined : feedbackType
          };
        }
        return msg;
      })
    );
  };

  // Handle document import and auto-populate parameters
  const handleImportDocument = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    setSelectedDocId(docId);
    setSubject(doc.subject || 'General');
    setTopic(doc.topic || 'General Topic');
    
    const textMsg = `Excellent! I have successfully imported your curriculum document: "${doc.title}". We are now tutoring in the context of this lesson plan/material on "${doc.topic}". What specific part of this lesson would you like to drill down into?`;
    
    // Add system-like prompt message
    setMessages(prev => [
      ...prev,
      {
        role: 'model',
        text: textMsg
      }
    ]);

    if (isVoiceEnabled) {
      speakText(textMsg);
    }
  };

  // Preset Socratic Icebreakers
  const handleIcebreaker = (promptText: string) => {
    setInputMessage(promptText);
    handleSend(promptText);
  };

  const handleSend = async (customText?: string, isSystemIntro?: boolean) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isProcessing) return;

    // Halt any listening/speaking before transmitting
    stopListening();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (isSystemIntro) {
      const userMessage: Message = { 
        role: 'user', 
        text: `📚 Started Kenyan CBC Lesson: ${cbcSubject || 'CBC Subject'} - ${cbcConcept || 'CBC Concept'}` 
      };
      setMessages([userMessage]);
    } else {
      const userMessage: Message = { role: 'user', text: textToSend };
      setMessages(prev => [...prev, userMessage]);
    }
    
    if (!customText) setInputMessage('');
    setIsProcessing(true);

    // Retrieve context document if selected
    const activeDoc = documents.find(d => d.id === selectedDocId);
    const activeUploadedRes = uploadedResources.find(r => r.id === selectedResourceId);

    const docContextParts = [];
    if (activeDoc) {
      docContextParts.push(`[Generated Lesson Document: ${activeDoc.title}]\n${activeDoc.content}`);
    }
    if (activeUploadedRes) {
      docContextParts.push(`[Uploaded Curriculum Resource: ${activeUploadedRes.fileName}]\n${activeUploadedRes.extractedText}`);
    }
    const docContext = docContextParts.join('\n\n');

    try {
      const response = await fetch('/api/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: isSystemIntro ? [] : messages,
          subject: isCbcSession ? cbcSubject : subject,
          topic: isCbcSession ? `${cbcStrand} - ${cbcSubStrand}` : topic,
          scaffoldingLevel,
          difficultyLevel,
          documentContext: docContext,
          persona,
          isCbcMode: isCbcSession,
          cbcSubject: isCbcSession ? cbcSubject : undefined,
          cbcStrand: isCbcSession ? cbcStrand : undefined,
          cbcSubStrand: isCbcSession ? cbcSubStrand : undefined,
          cbcConcept: isCbcSession ? cbcConcept : undefined,
          systemPrompt: isCbcSession ? cbcSystemPrompt : undefined,
          cbcSocraticMode: isCbcSession ? cbcSocraticMode : undefined
        })
      });

      const data = await handleResponseJson(response, 'Communication failed with the tutor service.');
      
      // Dispatch custom event to track Socratic interactions globally
      window.dispatchEvent(new CustomEvent('socratic-interaction'));
      
      const tutorReply = data.message || "I'm processing our next scaffolding step. Could you explain your thinking more?";
      
      setMessages(prev => [
        ...prev,
        { role: 'model', text: tutorReply }
      ]);

      if (data.scaffoldingStep) {
        setActiveStep(data.scaffoldingStep);
      }

      if (data.detectedMisconceptions && data.detectedMisconceptions.length > 0) {
        setMisconceptions(prev => {
          const combined = [...prev, ...data.detectedMisconceptions];
          return Array.from(new Set(combined)); // unique
        });
      }

      if (data.suggestedResources && data.suggestedResources.length > 0) {
        setSuggestedResources(data.suggestedResources);
      }

      if (data.conceptVisualization && data.conceptVisualization.nodes && data.conceptVisualization.nodes.length > 0) {
        setConceptMap(data.conceptVisualization);
      }

      // Automatically speak response if voice is enabled
      if (isVoiceEnabled) {
        speakText(tutorReply);
      }

    } catch (err: any) {
      console.error(err);
      const errMsg = `Connection Issue: ${err.message || 'I had trouble reaching our pedagogical core. Let me retry our tutoring cycle.'}`;
      setMessages(prev => [
        ...prev,
        { role: 'model', text: errMsg }
      ]);
      if (isVoiceEnabled) {
        speakText(errMsg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmClearChat = async () => {
    setIsClearingChat(true);
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stopListening();
      setIsSpeaking(false);

      const resetMessage = {
        role: 'model' as const,
        text: `Tutor reset. Let's start fresh with a clean slate! We are focusing on ${subject} - ${topic}. What concept should we break down first?`
      };

      setMessages([resetMessage]);
      setActiveStep('Exploratory onboarding');
      setMisconceptions([]);

      if (user?.uid && activeSessionId) {
        const activeSess = sessions.find(s => s.id === activeSessionId);
        const payload = cleanUndefined({
          id: activeSessionId,
          userId: user.uid,
          title: activeSess?.title || `${subject} - ${topic}`,
          subject: subject,
          topic: topic,
          persona: persona,
          scaffoldingLevel: scaffoldingLevel,
          difficultyLevel: difficultyLevel,
          messages: [resetMessage],
          activeStep: 'Exploratory onboarding',
          misconceptions: [],
          suggestedResources: suggestedResources || [],
          conceptMap: conceptMap || { title: 'Concept Map', nodes: [], edges: [] },
          createdAt: activeSess?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isCbcMode: isCbcSession,
          cbcSubject: cbcSubject || '',
          cbcStrand: cbcStrand || '',
          cbcSubStrand: cbcSubStrand || '',
          cbcConcept: cbcConcept || '',
          cbcSocraticMode: cbcSocraticMode || 'guided'
        });

        await setDoc(doc(db, 'tutorSessions', activeSessionId), payload);
      }
    } catch (err) {
      console.warn('[Firestore Clear Chat Error]', err);
    } finally {
      setIsClearingChat(false);
      setShowClearConfirmModal(false);
    }
  };

  const clearChat = () => {
    setShowClearConfirmModal(true);
  };

  // Fallback links for standard simulation libraries
  const defaultVisualAids = [
    { name: "PhET Simulations", url: "https://phet.colorado.edu/", desc: "Physics, math, chemistry simulations" },
    { name: "OpenStax Portal", url: "https://openstax.org/", desc: "Free, high-quality textbooks" },
    { name: "GeoGebra Tools", url: "https://www.geogebra.org/", desc: "Geometry & math worksheets" },
    { name: "Khan Academy", url: "https://www.khanacademy.org/", desc: "Guided micro-lessons & videos" }
  ];

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-200px)] min-h-[600px] overflow-hidden">
      {/* Mode Navigation Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-[#e5e1da] rounded-2xl p-3 shadow-xs gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5f6f52]/10 border border-[#5f6f52]/20 flex items-center justify-center text-[#5f6f52]">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-sm text-slate-800 leading-tight">AI Student Companion</h2>
            <p className="text-[10px] text-slate-400 font-medium">Tailored study strategies, active recall, and course mapping</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setTutorMode('socratic');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                tutorMode === 'socratic'
                  ? 'bg-[#5f6f52] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#5f6f52]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Socratic Conversation
            </button>
            <button
              onClick={() => {
                setTutorMode('cbc-tutor');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                tutorMode === 'cbc-tutor'
                  ? 'bg-[#5f6f52] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#5f6f52]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              EduNexus AI Tutor
            </button>
            <button
              onClick={() => setTutorMode('learning-path')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                tutorMode === 'learning-path'
                  ? 'bg-[#5f6f52] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#5f6f52]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Personalized Learning Path
            </button>
          </div>

          {(tutorMode === 'socratic' || tutorMode === 'cbc-tutor') && (
            <button
              type="button"
              onClick={() => setFullscreenWidget(fullscreenWidget === 'chat' ? null : 'chat')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold tracking-wider uppercase transition flex items-center gap-1.5 cursor-pointer shadow-xs border ${
                fullscreenWidget === 'chat'
                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-[#5f6f52]/5 hover:text-[#5f6f52] hover:border-slate-300'
              }`}
              title={fullscreenWidget === 'chat' ? "Minimize Window" : "Maximize Socratic Conversation to Full Screen"}
            >
              {fullscreenWidget === 'chat' ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span>Exit Full Screen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-[#5f6f52]" />
                  <span>Full Screen</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {(tutorMode === 'socratic' || tutorMode === 'cbc-tutor') ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
      
      {/* Configuration & Document Import Sidebar - 3 Columns */}
      <div className="xl:col-span-3 flex flex-col gap-3 bg-white border border-[#e5e1da] rounded-2xl p-4 shadow-xs overflow-y-auto max-h-full">
        {/* Left Sidebar Sub-Navigation Segmented Control */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1 shrink-0 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setLeftSidebarTab('config')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer ${
              leftSidebarTab === 'config'
                ? 'bg-[#5f6f52] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Settings className="w-3 h-3" />
            <span>Config</span>
          </button>
          <button
            type="button"
            onClick={() => setLeftSidebarTab('materials')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer ${
              leftSidebarTab === 'materials'
                ? 'bg-[#5f6f52] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Docs</span>
            {(documents.length > 0 || uploadedResources.length > 0) && (
              <span className={`text-[8px] font-bold px-1 rounded-full ${leftSidebarTab === 'materials' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {documents.length + uploadedResources.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setLeftSidebarTab('voice')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer ${
              leftSidebarTab === 'voice'
                ? 'bg-[#5f6f52] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Headphones className="w-3 h-3" />
            <span>Voice</span>
            {isVoiceEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* TAB 1: CONFIGURATIONS & SESSIONS */}
        {leftSidebarTab === 'config' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Tutor Sessions section */}
            <div className={`flex flex-col gap-2 ${
              fullscreenWidget === 'sessions' 
                ? 'fixed inset-0 z-50 bg-white p-6 md:p-10 overflow-y-auto flex flex-col h-screen w-screen animate-fadeIn' 
                : ''
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a9b388] flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#a9b388]" />
                  Pedagogical Sessions
                </span>
                <div className="flex items-center gap-1.5">
                  {user?.uid ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60" title="Sessions automatically persisted to Firestore">
                      <Cloud className="w-3 h-3 text-emerald-600 animate-pulse" />
                      <span>{isSyncingWithFirestore ? 'Syncing...' : 'Cloud Synced'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60" title="Local Storage persistence">
                      <CloudOff className="w-3 h-3 text-amber-600" />
                      <span>Local</span>
                    </span>
                  )}
                  <button
                    onClick={handleCreateNewSession}
                    className="text-[#5f6f52] hover:bg-[#5f6f52]/10 px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-[10px] font-bold border border-[#5f6f52]/20"
                    title="Start New Tutor Chat"
                  >
                    <Plus className="w-3 h-3" />
                    New
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullscreenWidget(fullscreenWidget === 'sessions' ? null : 'sessions')}
                    className="text-slate-400 hover:text-[#5f6f52] hover:bg-[#5f6f52]/10 p-1 rounded-lg transition cursor-pointer flex items-center justify-center"
                    title={fullscreenWidget === 'sessions' ? "Minimize Window" : "Maximize to Full Screen"}
                  >
                    {fullscreenWidget === 'sessions' ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Session Search Input */}
              {sessions.length > 2 && (
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={sessionSearchQuery}
                    onChange={(e) => setSessionSearchQuery(e.target.value)}
                    placeholder="Search past Socratic chats..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2 py-1 text-[10px] text-slate-700 focus:outline-none focus:border-[#5f6f52]"
                  />
                  {sessionSearchQuery && (
                    <button
                      onClick={() => setSessionSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              <div className={`space-y-1.5 overflow-y-auto pr-1 ${
                fullscreenWidget === 'sessions' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 space-y-0 mt-4' 
                  : 'max-h-[170px]'
              }`}>
                {sessions
                  .filter(sess => {
                    if (!sessionSearchQuery.trim()) return true;
                    const q = sessionSearchQuery.toLowerCase();
                    return (
                      sess.title?.toLowerCase().includes(q) ||
                      sess.subject?.toLowerCase().includes(q) ||
                      sess.topic?.toLowerCase().includes(q) ||
                      (sess as any).cbcConcept?.toLowerCase().includes(q) ||
                      sess.messages?.some(m => m.text?.toLowerCase().includes(q))
                    );
                  })
                  .map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => {
                        loadSession(sess);
                        if (fullscreenWidget === 'sessions') setFullscreenWidget(null);
                      }}
                      className={`group w-full p-2.5 rounded-xl text-left border transition text-[11px] flex items-center justify-between cursor-pointer ${
                        activeSessionId === sess.id
                          ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52] font-semibold'
                          : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
                      } ${fullscreenWidget === 'sessions' ? 'shadow-xs hover:shadow-md hover:-translate-y-0.5 duration-300' : ''}`}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="font-bold truncate pr-1 text-xs">{sess.title}</span>
                          {(sess as any).isCbcMode && (
                            <span className="text-[8px] font-extrabold uppercase bg-amber-100 text-amber-800 px-1 rounded shrink-0">
                              CBC
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 capitalize flex items-center gap-1 truncate">
                          <span>{sess.subject || 'General'}</span>
                          <span>•</span>
                          <span>{sess.messages?.length || 0} msgs</span>
                          {sess.difficultyLevel && (
                            <>
                              <span>•</span>
                              <span className="uppercase text-[8px] font-bold tracking-tight">{sess.difficultyLevel}</span>
                            </>
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(sess.id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1 transition rounded-md hover:bg-red-50 cursor-pointer shrink-0"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Configurations section */}
            <div className={
              fullscreenWidget === 'configurations'
                ? 'fixed inset-0 z-50 bg-white p-6 md:p-10 overflow-y-auto flex flex-col h-screen w-screen animate-fadeIn'
                : 'space-y-3'
            }>
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a9b388] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#a9b388]" />
                  Tutor Parameters
                </span>
                <button
                  type="button"
                  onClick={() => setFullscreenWidget(fullscreenWidget === 'configurations' ? null : 'configurations')}
                  className="text-slate-400 hover:text-[#5f6f52] hover:bg-[#5f6f52]/10 p-1 rounded-lg transition cursor-pointer flex items-center justify-center"
                  title={fullscreenWidget === 'configurations' ? "Minimize Window" : "Maximize to Full Screen"}
                >
                  {fullscreenWidget === 'configurations' ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className={`space-y-3 text-xs ${
                fullscreenWidget === 'configurations' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 space-y-0 mt-6' 
                  : ''
              }`}>
                {isCbcSession && (
                  <div className={`bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 space-y-2 animate-fadeIn mb-2 ${
                    fullscreenWidget === 'configurations' ? 'md:col-span-2 lg:col-span-3 mb-0' : ''
                  }`}>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                      Active CBC Pathway
                    </span>
                    <div className="text-[11px] space-y-1 text-slate-700 bg-white/65 p-2 rounded-lg border border-amber-100">
                      <div><span className="text-slate-400 font-medium block text-[9px] uppercase">Subject</span> <span className="font-bold">{cbcSubject}</span></div>
                      <div><span className="text-slate-400 font-medium block text-[9px] uppercase">Strand / Topic</span> <span className="font-bold">{cbcStrand}</span></div>
                      <div><span className="text-slate-400 font-medium block text-[9px] uppercase">Substrand / Subtopic</span> <span className="font-bold">{cbcSubStrand}</span></div>
                      <div><span className="text-slate-400 font-medium block text-[9px] uppercase">Concept</span> <span className="font-bold">{cbcConcept}</span></div>
                    </div>
                    <button
                      type="button"
                      onClick={handleChangeTopic}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Change Topic
                    </button>
                  </div>
                )}

                {/* Subject selector */}
                <div className="flex flex-col justify-between">
                  <label className="block text-slate-500 font-bold mb-1">Subject</label>
                  <EditableSelect
                    value={subject}
                    onChange={setSubject}
                    options={[
                      "Physics",
                      "Mathematics",
                      "Chemistry",
                      "Biology",
                      "General Science",
                      "History & Geography",
                      "Languages & Literature"
                    ]}
                    placeholder=""
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-[#5f6f52]"
                  />
                </div>

                {/* Topic textbox */}
                <div className="flex flex-col justify-between">
                  <label className="block text-slate-500 font-bold mb-1">Active Topic of Inquiry</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Newton's Second Law"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-[#5f6f52]"
                  />
                </div>

                {/* Pedagogical Persona */}
                <div className="flex flex-col justify-between">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Pedagogical Persona</label>
                    <EditableSelect
                      value={persona}
                      onChange={(val) => setPersona(val as any)}
                      options={["Socratic Questioner", "Encouraging Mentor", "Critical Examiner"]}
                      placeholder=""
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-[#5f6f52]"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                    {persona === 'Socratic Questioner' && "Warm, inquisitive Socratic dialogue probing your assumptions."}
                    {persona === 'Encouraging Mentor' && "Highly reinforcing, supportive guide celebrating your growth."}
                    {persona === 'Critical Examiner' && "Rigorous, analytical challenger testing proofs and logic."}
                    {persona !== 'Socratic Questioner' && persona !== 'Encouraging Mentor' && persona !== 'Critical Examiner' && `Custom tutor personality: "${persona}"`}
                  </p>
                </div>

                {/* Difficulty Level selector */}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-500 font-bold flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-[#5f6f52]" />
                        Difficulty Level
                      </label>
                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                        difficultyLevel === 'beginner' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : difficultyLevel === 'intermediate'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}>
                        {difficultyLevel}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                      {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficultyLevel(level)}
                          className={`py-1 text-[10px] font-extrabold rounded text-center transition capitalize cursor-pointer ${
                            difficultyLevel === level
                              ? level === 'beginner' 
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : level === 'intermediate'
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'bg-rose-600 text-white shadow-2xs'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                    {difficultyLevel === 'beginner' && "Simplifies vocabulary, uses relatable analogies & gentle single-step prompts."}
                    {difficultyLevel === 'intermediate' && "Balanced Socratic questioning with standard curriculum terminology & structured hints."}
                    {difficultyLevel === 'advanced' && "High-rigor academic depth, multi-variable logic puzzles, counter-examples & proofs."}
                  </p>
                </div>

                {/* Scaffolding level */}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-500 font-bold">Scaffolding Granularity</label>
                      <span className="text-[10px] font-extrabold uppercase bg-[#5f6f52]/10 text-[#5f6f52] px-1.5 py-0.5 rounded">
                        {scaffoldingLevel}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                      {(['low', 'medium', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setScaffoldingLevel(level)}
                          className={`py-1 text-[10px] font-extrabold rounded text-center transition capitalize cursor-pointer ${
                            scaffoldingLevel === level
                              ? 'bg-[#5f6f52] text-white shadow-2xs'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                    {scaffoldingLevel === 'high' && "Breaks reasoning into small, bite-sized questions."}
                    {scaffoldingLevel === 'medium' && "Guides step-by-step, helping locate mistakes incrementally."}
                    {scaffoldingLevel === 'low' && "Relies on conceptual hints and higher-level questions."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MATERIALS & CONTEXT UPLOADS */}
        {leftSidebarTab === 'materials' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Lesson Material Importer */}
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a9b388] block mb-1">Import Lesson Context</span>
              <p className="text-[10px] text-slate-400 leading-normal mb-2">
                Ground the tutor conversation in any generated lesson materials.
              </p>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {documents.length === 0 ? (
                  <div className="p-3 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-[10px]">
                    No generated materials found to import.
                  </div>
                ) : (
                  documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleImportDocument(doc.id)}
                      className={`w-full p-2 rounded-xl text-left border transition text-xs flex flex-col gap-0.5 cursor-pointer ${
                        selectedDocId === doc.id
                          ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52] font-semibold'
                          : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-bold truncate">{doc.topic}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-slate-400 mt-0.5">
                        <span>{doc.classLevel}</span>
                        <span>{doc.subject}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Uploaded Curriculum Resources */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a9b388] block">Curriculum Guides & Uploads</span>
              <p className="text-[10px] text-slate-400 leading-normal mb-1">
                Upload PDF or DOCX files to ground EduNexus AI Tutor in curriculum guides.
              </p>

              {/* Drag & Drop zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(e);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#5f6f52]/30 hover:border-[#5f6f52] bg-slate-50/50 hover:bg-[#5f6f52]/5 transition rounded-xl p-3 text-center cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.docx"
                  className="hidden"
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <Loader2 className="w-5 h-5 text-[#5f6f52] animate-spin" />
                    <span className="text-[10px] font-bold text-[#5f6f52]">Processing... {uploadProgress}%</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-400 hover:text-[#5f6f52] transition" />
                    <span className="text-[10px] font-bold text-slate-500">Drag & drop or Click to upload</span>
                    <span className="text-[8px] text-slate-400 uppercase font-extrabold">PDF or DOCX (Max 10MB)</span>
                  </>
                )}
              </div>

              {uploadError && (
                <p className="text-[9px] text-red-500 font-semibold leading-tight mt-1">{uploadError}</p>
              )}

              {/* Uploaded Resources List */}
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 mt-1.5">
                {uploadedResources.length === 0 ? (
                  <div className="p-3 border border-dashed border-slate-100 rounded-xl text-center text-slate-300 text-[10px]">
                    No custom resources uploaded yet.
                  </div>
                ) : (
                  uploadedResources.map((res) => {
                    const isSelected = selectedResourceId === res.id;
                    return (
                      <div
                        key={res.id}
                        onClick={() => setSelectedResourceId(isSelected ? '' : res.id)}
                        className={`group w-full p-2.5 rounded-xl border transition text-xs flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52]'
                            : 'border-slate-150 bg-slate-50/30 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-[#5f6f52]/10 text-[#5f6f52]' : 'bg-slate-100 text-slate-400'}`}>
                            {res.fileType === 'pdf' ? (
                              <Paperclip className="w-3.5 h-3.5" />
                            ) : (
                              <FileUp className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold truncate text-[11px] leading-tight">{res.fileName}</span>
                            <span className="text-[8px] text-slate-400 mt-0.5">
                              {new Date(res.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isSelected && (
                            <span className="p-0.5 bg-emerald-500 text-white rounded-full">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteResource(res, e)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1 transition rounded-md hover:bg-red-50 cursor-pointer"
                            title="Delete resource context"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VOICE & AUDIO SETTINGS */}
        {leftSidebarTab === 'voice' && (
          <div className="space-y-3 bg-[#5f6f52]/5 border border-[#5f6f52]/10 p-3 rounded.xl animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5f6f52] flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5" />
                Dialogue Speech Controls
              </span>
              <button
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                className="text-[#5f6f52] hover:text-[#4d5a42] p-0.5 transition cursor-pointer"
                title="Voice Customization Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Auto Voice Output Toggle */}
              <label className="flex items-center justify-between cursor-pointer p-1.5 bg-white border border-slate-200/80 rounded-xl transition">
                <span className="text-slate-700 font-semibold text-[11px]">Tutor Audio Output</span>
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={isVoiceEnabled}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setIsVoiceEnabled(val);
                      if (!val && window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                        setIsSpeaking(false);
                      } else if (val && messages.length > 0) {
                        speakText(messages[messages.length - 1].text);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-[#5f6f52]"></div>
                </div>
              </label>

              {/* Hands-free auto voice sequence toggle */}
              <label className="flex items-center justify-between cursor-pointer p-1.5 bg-white border border-slate-200/80 rounded-xl transition">
                <div className="flex flex-col">
                  <span className="text-slate-700 font-semibold text-[11px]">Hands-Free Mode</span>
                  <span className="text-[9px] text-slate-400 leading-tight">Auto-listen after tutor speaks</span>
                </div>
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={isHandsFree}
                    onChange={(e) => {
                      setIsHandsFree(e.target.checked);
                      if (e.target.checked) {
                        setIsVoiceEnabled(true);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-[#5f6f52]"></div>
                </div>
              </label>

              {/* Dropdowns for Browser Voices & Playback Speed */}
              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1 text-[10px] uppercase tracking-wider">Tutor Voice</label>
                  <div className="relative">
                    <select
                      value={selectedVoiceName}
                      onChange={(e) => setSelectedVoiceName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 pr-8 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#5f6f52] appearance-none cursor-pointer truncate"
                    >
                      {voices.length === 0 ? (
                        <option value="">Default voice</option>
                      ) : (
                        voices.map((v, i) => (
                          <option key={i} value={v.name}>
                            {v.name.replace('Microsoft', '').replace('Google', '').trim()}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1 text-[10px] uppercase tracking-wider">Playback Speed</label>
                  <div className="relative">
                    <select
                      value={voiceRate}
                      onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 pr-8 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#5f6f52] appearance-none cursor-pointer"
                    >
                      <option value="0.5">0.5x (Slow)</option>
                      <option value="0.75">0.75x</option>
                      <option value="1">1.0x (Normal)</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x (Fast)</option>
                      <option value="1.75">1.75x</option>
                      <option value="2">2.0x (Very Fast)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced synthesis settings */}
              <AnimatePresence>
                {showVoiceSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 pt-2 border-t border-slate-150 overflow-hidden"
                  >
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                        <span>Speaking Speed</span>
                        <span>{voiceRate}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={voiceRate}
                        onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                        className="w-full accent-[#5f6f52]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                        <span>Tone Pitch</span>
                        <span>{voicePitch}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={voicePitch}
                        onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                        className="w-full accent-[#5f6f52]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          {voiceVolume === 0 ? (
                            <VolumeX className="w-3 h-3 text-slate-400" />
                          ) : voiceVolume < 0.5 ? (
                            <Volume1 className="w-3 h-3 text-[#5f6f52]" />
                          ) : (
                            <Volume2 className="w-3 h-3 text-[#5f6f52]" />
                          )}
                          Voice Volume
                        </span>
                        <span>{Math.round(voiceVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={voiceVolume}
                        onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                        className="w-full accent-[#5f6f52]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="mt-auto pt-2">
          <button
            onClick={clearChat}
            className="w-full py-2 border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-600 rounded-xl text-[10px] font-extrabold tracking-wider transition uppercase cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3 h-3" />
            Clear Chat Log
          </button>
        </div>
      </div>

      {/* Main Interactive Chat Panel - 6 Columns */}
      <div className={
        fullscreenWidget === 'chat'
          ? 'fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen overflow-hidden animate-fadeIn'
          : 'xl:col-span-6 flex flex-col bg-white border border-[#e5e1da] rounded-2xl shadow-xs overflow-hidden max-h-full'
      }>
        
        {tutorMode === 'cbc-tutor' && (!isCbcSession || messages.length === 0) ? (
          /* Render CBC Setup Form */
          <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-50/50 overflow-y-auto relative">
            <button
              type="button"
              onClick={() => setFullscreenWidget(fullscreenWidget === 'chat' ? null : 'chat')}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition cursor-pointer"
              title={fullscreenWidget === 'chat' ? "Minimize Window" : "Maximize to Full Screen"}
            >
              {fullscreenWidget === 'chat' ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
            <SetupForm onStart={(path) => handleCreateNewCbcSession(path.subject, path.strand, path.subStrand, path.concept, path.socraticMode)} />
          </div>
        ) : (
          /* Render normal Socratic conversation interface */
          <>
            {/* Tutor Header Info bar */}
            <div className="px-5 py-3 bg-[#5f6f52] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white relative">
                  <Sparkles className="w-4.5 h-4.5 text-[#fefae0]" />
                  {isProcessing && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-yellow-400 rounded-full border-2 border-[#5f6f52] animate-ping" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm block leading-none">
                      {isCbcSession ? 'EduNexus AI Tutor' : (
                        <>
                          {persona === 'Socratic Questioner' && 'Socratic Sage'}
                          {persona === 'Encouraging Mentor' && 'Encouraging Mentor'}
                          {persona === 'Critical Examiner' && 'Critical Examiner'}
                        </>
                      )}
                    </span>
                    {isVoiceEnabled && (
                      <span className="text-[9px] bg-white/20 text-[#fefae0] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                        <Volume2 className="w-2.5 h-2.5 animate-bounce" /> Voice Mode
                      </span>
                    )}
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border ${
                      difficultyLevel === 'beginner' 
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' 
                        : difficultyLevel === 'intermediate'
                        ? 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                        : 'bg-rose-500/20 text-rose-200 border-rose-400/30'
                    }`}>
                      <Gauge className="w-2.5 h-2.5" />
                      {difficultyLevel}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/80 block mt-0.5">
                    {isCbcSession ? "Learning Design Specialist | St. Mary's Girls Secondary School Persona" : (
                      <>
                        {persona === 'Socratic Questioner' && 'Guiding you step-by-step to discover answers on your own'}
                        {persona === 'Encouraging Mentor' && 'Nurturing your learning journey with positive reassurance'}
                        {persona === 'Critical Examiner' && 'Rigorously testing your logical and scientific proofs'}
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start sm:justify-end w-full sm:w-auto">
                <div className="text-right text-[10px] font-mono opacity-85 shrink-0 hidden sm:block">
                  {isCbcSession ? 'Kenyan CBC Model' : subject} ➔ {topic}
                </div>
                {isCbcSession && (
                  <button
                    onClick={handleChangeTopic}
                    className="px-2.5 py-1.5 text-[10px] font-extrabold tracking-wider uppercase bg-[#d4a373] hover:bg-[#c39262] border border-[#bfa285]/20 rounded-lg transition-all flex items-center gap-1 cursor-pointer text-white shrink-0 shadow-sm"
                    title="Change Topic & Return to Setup Form"
                  >
                    <BookOpen className="w-3 h-3" />
                    Change Topic
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGenerateSocraticFlashcards}
                  disabled={isGeneratingFlashcards}
                  className="px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase bg-[#d4a373] hover:bg-[#c39262] border border-white/20 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-white shrink-0 shadow-sm disabled:opacity-50"
                  title="Automatically generate context-aware flashcards based on the specific lesson or study guide"
                >
                  {isGeneratingFlashcards ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-3 h-3 text-[#fefae0]" />
                      <span>Generate Flashcards</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={clearChat}
                  className="px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-rose-100 hover:text-white shrink-0"
                  title="Clear Active Chat History (With Confirmation)"
                >
                  <Trash2 className="w-3 h-3 text-rose-200" />
                  Clear Chat
                </button>
                <button
                  onClick={handleExportChatLog}
                  className="px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase bg-white/10 hover:bg-white/20 border border-white/25 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-[#fefae0] hover:text-white shrink-0"
                  title="Export Chat Log (.md)"
                >
                  <Download className="w-3 h-3 text-[#fefae0]" />
                  Export Log
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreenWidget(fullscreenWidget === 'chat' ? null : 'chat')}
                  className="p-1.5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-lg transition-all flex items-center justify-center cursor-pointer text-[#fefae0] hover:text-white shrink-0"
                  title={fullscreenWidget === 'chat' ? "Minimize Chat Window" : "Maximize Chat to Full Screen"}
                >
                  {fullscreenWidget === 'chat' ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Breadcrumb Indicator */}
            <div className="px-5 py-2 bg-slate-100 border-b border-[#e5e1da]/65 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 font-medium shrink-0 shadow-2xs">
              <span className="text-slate-400 uppercase tracking-wider font-extrabold text-[9px] shrink-0">Current Focus:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Subject */}
                <span className="bg-white/80 border border-slate-200/60 px-2 py-0.5 rounded text-slate-700 font-semibold" title="Subject">
                  {isCbcSession ? cbcSubject : (subject || 'Physics')}
                </span>
                
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                
                {/* Strand / Topic */}
                <span className="bg-white/80 border border-slate-200/60 px-2 py-0.5 rounded text-slate-700 font-semibold" title="Strand">
                  {isCbcSession ? cbcStrand : (topic.includes('(') ? topic.split('(')[0].trim() : (topic || 'Velocity and Acceleration'))}
                </span>

                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                
                {/* Sub-strand */}
                <span className="bg-white/80 border border-slate-200/60 px-2 py-0.5 rounded text-slate-700 font-semibold" title="Sub-strand">
                  {isCbcSession ? (cbcSubStrand || 'General') : (topic.includes('(') ? topic.split('(')[1].replace(')', '').trim() : 'Kinematics')}
                </span>

                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                
                {/* Concept */}
                <span className="bg-[#5f6f52]/10 text-[#5f6f52] border border-[#5f6f52]/20 px-2.5 py-0.5 rounded-full font-bold" title="Concept">
                  {isCbcSession ? (cbcConcept || 'Introductory Concept') : (conceptMap.nodes?.[0]?.label || 'Velocity & Acceleration')}
                </span>
              </div>
            </div>

            {/* Dynamic Speech Waveform Panel */}
            {(isSpeaking || isListening) && (
              <div className={`px-5 py-2.5 flex items-center justify-between transition-all ${
                isSpeaking ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'bg-amber-50 text-amber-800 border-b border-amber-100'
              }`}>
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <Activity className={`w-4 h-4 shrink-0 ${isSpeaking ? 'text-emerald-600 animate-pulse' : 'text-amber-600 animate-bounce'}`} />
                  <span>
                    {isSpeaking ? "Socratic Sage is speaking aloud..." : "Voice Dialogue Listening... Talk now!"}
                  </span>
                </div>

                {/* Audio Waveform Bars */}
                <div className="flex gap-1 items-end h-4 pr-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                    <motion.div
                      key={bar}
                      animate={{
                        height: isSpeaking 
                          ? [4, 16, 6, 12, 4][bar % 5] 
                          : [4, 14, 8, 16, 4][bar % 5]
                      }}
                      transition={{
                        duration: 0.8 + (bar * 0.1),
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className={`w-1 rounded-full ${isSpeaking ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ height: '4px' }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Scrollable Conversation History */}
            <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50 space-y-4">
              
              {/* Quick Icebreakers for onboarding */}
              {messages.length === 1 && (
                <div className="space-y-2 animate-fadeIn">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Suggested Inquiry Pathways</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => handleIcebreaker("Help me conceptualize what velocity means vs acceleration.")}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl text-left hover:border-[#5f6f52] hover:bg-[#5f6f52]/5 text-xs text-slate-600 transition"
                    >
                      <span className="font-bold text-[#5f6f52] block mb-0.5">Velocity vs Acceleration</span>
                      <span className="text-[10px] text-slate-400">Identify standard misconceptions in movement.</span>
                    </button>
                    <button
                      onClick={() => handleIcebreaker("I'm confused about mass vs. weight. Can we step through the math?")}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl text-left hover:border-[#5f6f52] hover:bg-[#5f6f52]/5 text-xs text-slate-600 transition"
                    >
                      <span className="font-bold text-[#5f6f52] block mb-0.5">Mass vs Weight</span>
                      <span className="text-[10px] text-slate-400">Drill down on gravity, force, and kilograms.</span>
                    </button>
                    <button
                      onClick={() => handleIcebreaker("Let's break down photosynthesis step-by-step.")}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl text-left hover:border-[#5f6f52] hover:bg-[#5f6f52]/5 text-xs text-slate-600 transition"
                    >
                      <span className="font-bold text-[#5f6f52] block mb-0.5">Photosynthesis Loops</span>
                      <span className="text-[10px] text-slate-400">Step through light-dependent and Calvin cycles.</span>
                    </button>
                    <button
                      onClick={() => handleIcebreaker("Can you help me solve a tough physics kinematics equation?")}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl text-left hover:border-[#5f6f52] hover:bg-[#5f6f52]/5 text-xs text-slate-600 transition"
                    >
                      <span className="font-bold text-[#5f6f52] block mb-0.5">Kinematic Equation Scaffold</span>
                      <span className="text-[10px] text-slate-400">Break down variables, unknowns, and formulas.</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Conversation history bubbles */}
              <div className="space-y-3.5">
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className={`flex gap-3 max-w-[85%] ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                      msg.role === 'user' 
                        ? 'bg-[#d4a373] text-white' 
                        : 'bg-[#5f6f52]/10 text-[#5f6f52] border border-[#5f6f52]/20'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                    </div>

                    {/* Bubble message */}
                    <div className="flex flex-col gap-1 items-start">
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        msg.role === 'user'
                          ? 'bg-[#5f6f52] text-white rounded-tr-none font-medium'
                          : 'bg-white border border-[#e5e1da] text-slate-700 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>

                      {/* Accessible Text-to-Speech & Feedback Controls */}
                      {msg.role === 'model' && (
                        <div className="flex items-center gap-2 mt-0.5 px-0.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSpeakMessage(msg.text)}
                            className={`px-2 py-0.5 rounded border text-[10px] font-bold tracking-wide transition flex items-center gap-1 cursor-pointer ${
                              isSpeaking && speakingText === msg.text
                                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 animate-pulse'
                                : 'bg-white border-slate-200 text-[#5f6f52] hover:bg-[#5f6f52]/5 hover:border-[#5f6f52]/30'
                            }`}
                            title={isSpeaking && speakingText === msg.text ? "Stop reading" : "Read explanation aloud"}
                          >
                            {isSpeaking && speakingText === msg.text ? (
                              <>
                                <VolumeX className="w-3 h-3 text-rose-600" />
                                <span>Stop Reading</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3" />
                                <span>Read Aloud</span>
                              </>
                            )}
                          </button>
                          
                          {/* Mini dynamic waveform during active TTS */}
                          {isSpeaking && speakingText === msg.text && (
                            <div className="flex gap-0.5 items-end h-2 px-1">
                              {[1, 2, 3].map((b) => (
                                <motion.div
                                  key={b}
                                  animate={{ height: [2, 8, 4, 6, 2][b % 5] }}
                                  transition={{ duration: 0.5 + b * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                                  className="w-0.5 bg-rose-500 rounded-full"
                                  style={{ height: '3px' }}
                                />
                              ))}
                            </div>
                          )}

                          {/* Thumbs Feedback Buttons */}
                          <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
                            <button
                              type="button"
                              onClick={() => handleMessageFeedback(idx, 'up')}
                              className={`p-1 rounded transition flex items-center justify-center gap-1 cursor-pointer ${
                                msg.feedback === 'up'
                                  ? 'bg-green-50 border border-green-200 text-green-600 font-bold scale-105'
                                  : 'bg-white border border-slate-150 text-slate-400 hover:text-green-600 hover:bg-green-50/50'
                              }`}
                              title="Helpful Socratic guidance"
                            >
                              <ThumbsUp className={`w-3 h-3 ${msg.feedback === 'up' ? 'fill-green-600' : ''}`} />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleMessageFeedback(idx, 'down')}
                              className={`p-1 rounded transition flex items-center justify-center gap-1 cursor-pointer ${
                                msg.feedback === 'down'
                                  ? 'bg-red-50 border border-red-200 text-red-600 font-bold scale-105'
                                  : 'bg-white border border-slate-150 text-slate-400 hover:text-red-600 hover:bg-red-50/50'
                              }`}
                              title="Unhelpful / Off-topic / Non-Socratic"
                            >
                              <ThumbsDown className={`w-3 h-3 ${msg.feedback === 'down' ? 'fill-red-600' : ''}`} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isProcessing && (
                  <div className="flex gap-3 max-w-[80%] mr-auto items-center animate-pulse">
                    <div className="w-8 h-8 rounded-xl bg-[#5f6f52]/10 flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-[#5f6f52] animate-spin" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white border border-[#e5e1da] text-xs text-slate-400 rounded-tl-none italic shadow-xs">
                      {isCbcSession ? 'EduNexus AI Tutor is reflecting on your input...' : 'Socratic Sage is analyzing your conceptual thread...'}
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input Text Box Bar with Mic Toggle */}
            <div className="p-3.5 border-t border-slate-150 bg-white shrink-0">
              {isListening && (
                <div className="mb-2 p-2 bg-[#5f6f52]/10 text-[#5f6f52] rounded-xl border border-[#5f6f52]/20 text-[11px] flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5f6f52] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5f6f52]"></span>
                    </span>
                    <span className="font-semibold">Microphone Active: Speak your response...</span>
                  </div>
                  <div className="flex items-center gap-0.5 h-3">
                    <span className="w-0.5 bg-[#5f6f52] rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                    <span className="w-0.5 bg-[#5f6f52] rounded-full animate-bounce h-3" style={{ animationDelay: '150ms' }} />
                    <span className="w-0.5 bg-[#5f6f52] rounded-full animate-bounce h-1" style={{ animationDelay: '300ms' }} />
                    <span className="w-0.5 bg-[#5f6f52] rounded-full animate-bounce h-2.5" style={{ animationDelay: '450ms' }} />
                  </div>
                </div>
              )}

              {interimTranscript && (
                <div className="mb-2 p-2 bg-amber-50 text-amber-800 rounded-xl border border-amber-100 text-[11px] italic flex items-center gap-1.5 animate-fadeIn">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping shrink-0" />
                  <span>{interimTranscript}</span>
                </div>
              )}

              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                {/* Speech Microphone trigger button */}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-center shadow-xs relative ${
                    isListening
                      ? 'bg-red-500 border-red-400 text-white hover:bg-red-600 ring-2 ring-red-200'
                      : !speechSupported
                      ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-[#5f6f52] hover:border-slate-300 hover:bg-slate-100'
                  }`}
                  title={
                    !speechSupported
                      ? 'Speech recognition not supported in your browser or iframe environment'
                      : isListening
                      ? 'Stop Recording'
                      : 'Speak response'
                  }
                >
                  <Mic className={`w-4 h-4 ${isListening ? 'scale-110' : ''}`} />
                  {isListening && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                    </span>
                  )}
                </button>

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isListening ? "Listening to your voice... stop speaking to send!" : "Explain your reasoning or ask a question..."}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52] focus:bg-white transition"
                  disabled={isProcessing}
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isProcessing}
                  className="p-2.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-xl disabled:opacity-40 transition cursor-pointer flex items-center justify-center shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}

      </div>

      {/* State Diagnostics & Resource Mapping Panel - 3 Columns */}
      <div className="xl:col-span-3 flex flex-col gap-3 bg-white border border-[#e5e1da] rounded-2xl p-4 shadow-xs max-h-full overflow-y-auto">
        
        {/* Right Sidebar Sub-Navigation Segmented Control */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1 shrink-0 border border-slate-200/60 mb-1">
          <button
            type="button"
            onClick={() => setRightSidebarTab('all')}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer ${
              rightSidebarTab === 'all'
                ? 'bg-[#5f6f52] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title="Show all diagnostic widgets"
          >
            <span>All</span>
          </button>
          <button
            type="button"
            onClick={() => setRightSidebarTab('concept')}
            className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer ${
              rightSidebarTab === 'concept'
                ? 'bg-[#5f6f52] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span className="truncate">Concept</span>
          </button>
          <button
            type="button"
            onClick={() => setRightSidebarTab('pedagogy')}
            className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer ${
              rightSidebarTab === 'pedagogy'
                ? 'bg-[#5f6f52] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span className="truncate">Diagnostics</span>
            {misconceptions.length > 0 && (
              <span className="bg-rose-500 text-white text-[8px] font-extrabold px-1 rounded-full shrink-0">
                {misconceptions.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setRightSidebarTab('resources')}
            className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer ${
              rightSidebarTab === 'resources'
                ? 'bg-[#5f6f52] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ExternalLink className="w-3 h-3" />
            <span className="truncate">Resources</span>
          </button>
        </div>

        {/* Dynamic Concept Map Visualization Card */}
        {(rightSidebarTab === 'all' || rightSidebarTab === 'concept') && (
        <div className={
          fullscreenWidget === 'visualizer'
            ? 'fixed inset-0 z-50 bg-white p-6 md:p-10 overflow-y-auto flex flex-col h-screen w-screen animate-fadeIn'
            : 'bg-white border border-[#e5e1da] rounded-2xl p-3.5 shadow-2xs flex flex-col animate-fadeIn'
        }>
          <div className="flex items-center justify-between mb-2 border-b border-slate-50 pb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a9b388] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#a9b388]" />
              Concept Visualizer
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFullscreenWidget(fullscreenWidget === 'visualizer' ? null : 'visualizer')}
                className="text-slate-400 hover:text-[#5f6f52] hover:bg-[#5f6f52]/10 p-1 rounded-lg transition cursor-pointer flex items-center justify-center"
                title={fullscreenWidget === 'visualizer' ? "Minimize Window" : "Maximize to Full Screen"}
              >
                {fullscreenWidget === 'visualizer' ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              
              {fullscreenWidget !== 'visualizer' && (
                <button
                  type="button"
                  onClick={() => setShowConceptMap(!showConceptMap)}
                  className="text-[#5f6f52] hover:bg-[#5f6f52]/10 p-1 rounded-lg transition cursor-pointer flex items-center justify-center"
                  title={showConceptMap ? "Hide Concept Map" : "Show Concept Map"}
                >
                  {showConceptMap ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              <span className="text-[9px] font-bold text-[#5f6f52] bg-[#5f6f52]/5 px-2 py-0.5 rounded-full border border-[#5f6f52]/10 truncate max-w-[110px]">
                {conceptMap.title || 'Inquiry Connections'}
              </span>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {(showConceptMap || fullscreenWidget === 'visualizer') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden flex flex-col flex-1"
              >
                {/* Map canvas container */}
                <div className={`relative w-full bg-slate-50 border border-slate-150 rounded-xl overflow-hidden select-none mb-3 ${
                  fullscreenWidget === 'visualizer' ? 'flex-1 min-h-[450px] md:min-h-[550px]' : 'h-56'
                }`}>
                  {/* SVG edge connections */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 220" preserveAspectRatio="none">
                    <defs>
                      <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="16"
                        refY="5"
                        markerWidth="5"
                        markerHeight="5"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#a9b388" />
                      </marker>
                    </defs>
                    {conceptMap.edges.map((edge, idx) => {
                      const indexA = conceptMap.nodes.findIndex(n => n.id === edge.from);
                      const indexB = conceptMap.nodes.findIndex(n => n.id === edge.to);
                      if (indexA === -1 || indexB === -1) return null;
                      
                      // SVG dimensions coordinate helper
                      const getNodeCoords = (idxNode: number, totalNodes: number) => {
                        if (totalNodes <= 1) return { x: 150, y: 110 };
                        if (totalNodes === 2) {
                          return [
                            { x: 80, y: 110 },
                            { x: 220, y: 110 }
                          ][idxNode];
                        }
                        if (totalNodes === 3) {
                          return [
                            { x: 150, y: 55 },
                            { x: 70, y: 155 },
                            { x: 230, y: 155 }
                          ][idxNode];
                        }
                        if (totalNodes === 4) {
                          return [
                            { x: 80, y: 65 },
                            { x: 220, y: 65 },
                            { x: 220, y: 155 },
                            { x: 80, y: 155 }
                          ][idxNode];
                        }
                        // Circle layout for 5+ nodes
                        const angle = (idxNode / totalNodes) * 2 * Math.PI - Math.PI / 2;
                        const rx = 95;
                        const ry = 55;
                        return {
                          x: 150 + rx * Math.cos(angle),
                          y: 110 + ry * Math.sin(angle)
                        };
                      };

                      const posA = getNodeCoords(indexA, conceptMap.nodes.length);
                      const posB = getNodeCoords(indexB, conceptMap.nodes.length);
                      
                      const midX = (posA.x + posB.x) / 2;
                      const midY = (posA.y + posB.y) / 2;

                      return (
                        <g key={idx}>
                          <line
                            x1={posA.x}
                            y1={posA.y}
                            x2={posB.x}
                            y2={posB.y}
                            stroke="#cbd5e1"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                            markerEnd="url(#arrow)"
                          />
                          {/* Edge relationship label tag */}
                          <g>
                            <rect
                              x={midX - 25}
                              y={midY - 5}
                              width="50"
                              height="10"
                              fill="#f8fafc"
                              rx="3"
                              stroke="#e2e8f0"
                              strokeWidth="0.5"
                            />
                            <text
                              x={midX}
                              y={midY + 2.5}
                              textAnchor="middle"
                              className="fill-slate-400 font-extrabold"
                              style={{ fontSize: '6px' }}
                            >
                              {edge.label}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Absolute interactive node tags */}
                  {conceptMap.nodes.map((node, idx) => {
                    // SVG dimensions coordinate helper duplicate for rendering divs
                    const getNodeCoords = (idxNode: number, totalNodes: number) => {
                      if (totalNodes <= 1) return { x: 150, y: 110 };
                      if (totalNodes === 2) {
                        return [
                          { x: 80, y: 110 },
                          { x: 220, y: 110 }
                        ][idxNode];
                      }
                      if (totalNodes === 3) {
                        return [
                          { x: 150, y: 55 },
                          { x: 70, y: 155 },
                          { x: 230, y: 155 }
                        ][idxNode];
                      }
                      if (totalNodes === 4) {
                        return [
                          { x: 80, y: 65 },
                          { x: 220, y: 65 },
                          { x: 220, y: 155 },
                          { x: 80, y: 155 }
                        ][idxNode];
                      }
                      // Circle layout for 5+ nodes
                      const angle = (idxNode / totalNodes) * 2 * Math.PI - Math.PI / 2;
                      const rx = 95;
                      const ry = 55;
                      return {
                        x: 150 + rx * Math.cos(angle),
                        y: 110 + ry * Math.sin(angle)
                      };
                    };

                    const coords = getNodeCoords(idx, conceptMap.nodes.length);
                    const isHovered = hoveredNodeId === node.id;
                    
                    // Color schemes by node type
                    let colorClasses = "bg-[#5f6f52]/10 border-[#5f6f52]/20 text-[#5f6f52] hover:bg-[#5f6f52]/20";
                    if (node.type === 'variable') {
                      colorClasses = "bg-blue-50 border-blue-100 text-blue-800 hover:bg-blue-100";
                    } else if (node.type === 'process') {
                      colorClasses = "bg-amber-50 border-amber-100 text-amber-800 hover:bg-amber-100";
                    }

                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => {
                          setInputMessage(`Can you explain more about "${node.label}"?`);
                        }}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        className={`absolute px-2 py-1 text-[9px] font-extrabold shadow-2xs rounded-lg border transition-all duration-200 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 cursor-pointer whitespace-nowrap ${colorClasses} ${
                          isHovered ? 'scale-110 z-10 ring-2 ring-[#5f6f52]/30' : ''
                        }`}
                        style={{ 
                          left: `${(coords.x / 300) * 100}%`, 
                          top: `${(coords.y / 220) * 100}%` 
                        }}
                      >
                        <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                        <span className="truncate max-w-[85px]">{node.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Tooltip explanation box */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 min-h-[50px] text-[10px] text-slate-500 leading-normal flex flex-col justify-center">
                  {hoveredNodeId ? (
                    (() => {
                      const node = conceptMap.nodes.find(n => n.id === hoveredNodeId);
                      if (!node) return null;
                      return (
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-bold text-[#5f6f52] uppercase text-[9px] tracking-wider">{node.label}</span>
                            <span className="text-[8px] uppercase font-extrabold bg-slate-200/60 px-1 py-0.2 rounded text-slate-500">{node.type || 'concept'}</span>
                          </div>
                          <p className="text-slate-600 font-medium">{node.description}</p>
                        </div>
                      );
                    })()
                  ) : (
                    <span className="text-center block text-slate-400 font-medium">
                      💡 Hover over nodes to see descriptions. Click a node to formulate a Socratic question!
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}
        
        {/* Scaffolding Progress & Misconception Diagnostics */}
        {(rightSidebarTab === 'all' || rightSidebarTab === 'pedagogy') && (
        <>
          <div className={
            fullscreenWidget === 'pedagogicalState'
              ? 'fixed inset-0 z-50 bg-white p-6 md:p-10 overflow-y-auto flex flex-col h-screen w-screen animate-fadeIn'
              : 'bg-white border border-[#e5e1da] rounded-2xl p-3.5 shadow-2xs animate-fadeIn'
          }>
            <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a9b388] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#a9b388]" />
                AI Pedagogical State
              </span>
              <button
                type="button"
                onClick={() => setFullscreenWidget(fullscreenWidget === 'pedagogicalState' ? null : 'pedagogicalState')}
                className="text-slate-400 hover:text-[#5f6f52] hover:bg-[#5f6f52]/10 p-1 rounded-lg transition cursor-pointer flex items-center justify-center"
                title={fullscreenWidget === 'pedagogicalState' ? "Minimize Window" : "Maximize to Full Screen"}
              >
                {fullscreenWidget === 'pedagogicalState' ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-2.5 bg-[#5f6f52]/5 border border-[#5f6f52]/20 rounded-xl flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#5f6f52] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Active Scaffolding Step</span>
                  <span className="text-xs font-bold text-slate-700 truncate block capitalize">{activeStep}</span>
                </div>
              </div>
              
              {fullscreenWidget === 'pedagogicalState' ? (
                <div className="mt-8 space-y-6 flex-1">
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b pb-2">Socratic Scaffolding Progress Timeline</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 relative">
                    {[
                      { name: 'Exploratory onboarding', title: '1. Onboarding', desc: 'Orientation, baseline context setting, and initial subject exploration.' },
                      { name: 'Foundational Assessment', title: '2. Diagnostic', desc: 'Socratic probes testing prior understanding and identifying initial knowledge gaps.' },
                      { name: 'Cognitive challenge', title: '3. Cognitive Inquiry', desc: 'Active guiding prompts that prompt cognitive dissonance to dismantle misconceptions.' },
                      { name: 'Guided synthesis', title: '4. Consolidation', desc: 'Concept mastery confirmation, guided summary, and real-world synthesis application.' }
                    ].map((step, idx, arr) => {
                      const isActive = activeStep.toLowerCase().includes(step.name.toLowerCase().split(' ')[0]) || 
                                       (step.name === 'Cognitive challenge' && activeStep.toLowerCase().includes('inquiry'));
                      const activeIndex = arr.findIndex(item => activeStep.toLowerCase().includes(item.name.toLowerCase().split(' ')[0]));
                      const isCompleted = activeIndex !== -1 && idx < activeIndex;

                      return (
                        <div key={idx} className={`p-5 rounded-2xl border transition-all duration-300 relative ${
                          isActive 
                            ? 'bg-[#5f6f52]/10 border-[#5f6f52] shadow-md ring-1 ring-[#5f6f52]' 
                            : isCompleted 
                            ? 'bg-emerald-50/40 border-emerald-200 text-slate-600' 
                            : 'bg-slate-50/50 border-slate-150 text-slate-400'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                              isActive 
                                ? 'bg-[#5f6f52] text-white' 
                                : isCompleted 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-slate-200 text-slate-500'
                            }`}>
                              {isCompleted ? '✓' : idx + 1}
                            </span>
                            <span className={`text-xs font-extrabold tracking-tight ${isActive ? 'text-[#5f6f52]' : isCompleted ? 'text-slate-700' : 'text-slate-500'}`}>
                              {step.title}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed font-medium text-slate-500">
                            {step.desc}
                          </p>
                          {isActive && (
                            <span className="absolute -top-2.5 right-4 text-[8px] font-extrabold tracking-wider uppercase bg-[#5f6f52] text-white px-2 py-0.5 rounded-full animate-pulse">
                              Active Stage
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 leading-normal">
                  Tracks Socratic inquiry level. The Sage asks targeted prompts to guide concept mastery.
                </p>
              )}
            </div>
          </div>

          {/* Misconception Triangulator */}
          <div className={
            fullscreenWidget === 'misconceptions'
              ? 'fixed inset-0 z-50 bg-white p-6 md:p-10 overflow-y-auto flex flex-col h-screen w-screen animate-fadeIn'
              : 'bg-white border border-[#e5e1da] rounded-2xl p-3.5 shadow-2xs flex-1 flex flex-col min-h-[140px] animate-fadeIn'
          }>
            <div className="flex items-center justify-between mb-2.5 border-b border-slate-50 pb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a9b388] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#a9b388]" />
                Misconception Diagnoses
              </span>
              <button
                type="button"
                onClick={() => setFullscreenWidget(fullscreenWidget === 'misconceptions' ? null : 'misconceptions')}
                className="text-slate-400 hover:text-[#5f6f52] hover:bg-[#5f6f52]/10 p-1 rounded-lg transition cursor-pointer flex items-center justify-center"
                title={fullscreenWidget === 'misconceptions' ? "Minimize Window" : "Maximize to Full Screen"}
              >
                {fullscreenWidget === 'misconceptions' ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            
            <div className={`flex-1 overflow-y-auto pr-1 ${fullscreenWidget === 'misconceptions' ? 'mt-4' : 'max-h-[180px]'}`}>
              {misconceptions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle className="w-7 h-7 text-emerald-500 mb-2" />
                  <span className="text-xs font-bold text-slate-700 block">No Gaps Detected Yet</span>
                  <span className="text-[10px] text-slate-400 max-w-sm mx-auto mt-0.5 leading-relaxed">
                    Explain your reasoning step-by-step. EduNexus AI Tutor continuously parses inputs to pinpoint conceptual gaps.
                  </span>
                </div>
              ) : (
                <div className={`grid gap-3 ${fullscreenWidget === 'misconceptions' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {misconceptions.map((mis, idx) => (
                    <div key={idx} className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn shadow-2xs hover:shadow-xs transition-all duration-300">
                      <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-extrabold block uppercase tracking-wider text-[9px] text-rose-700">Detected Gap {idx + 1}</span>
                        <p className="font-semibold leading-relaxed mt-0.5 text-rose-900 text-[11px]">{mis}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
        )}

        {/* Resource Mapping - Interactive External Links */}
        {(rightSidebarTab === 'all' || rightSidebarTab === 'resources') && (
        <div className={
          fullscreenWidget === 'breakthroughMaps'
            ? 'fixed inset-0 z-50 bg-white p-6 md:p-10 overflow-y-auto flex flex-col h-screen w-screen animate-fadeIn'
            : 'bg-white border border-[#e5e1da] rounded-2xl p-3.5 shadow-2xs animate-fadeIn'
        }>
          <div className="flex items-center justify-between mb-2.5 border-b border-slate-50 pb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a9b388] flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-[#a9b388]" />
              Visual Breakthrough Maps
            </span>
            <button
              type="button"
              onClick={() => setFullscreenWidget(fullscreenWidget === 'breakthroughMaps' ? null : 'breakthroughMaps')}
              className="text-slate-400 hover:text-[#5f6f52] hover:bg-[#5f6f52]/10 p-1 rounded-lg transition cursor-pointer flex items-center justify-center"
              title={fullscreenWidget === 'breakthroughMaps' ? "Minimize Window" : "Maximize to Full Screen"}
            >
              {fullscreenWidget === 'breakthroughMaps' ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          
          <div className={fullscreenWidget === 'breakthroughMaps' ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4' : 'space-y-2.5'}>
            <div className={fullscreenWidget === 'breakthroughMaps' ? 'space-y-4' : 'space-y-2'}>
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Tailored Breakthrough References</span>
              {suggestedResources.map((res, idx) => (
                <a
                  key={idx}
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-2.5 border border-slate-150 rounded-xl bg-slate-50 hover:bg-slate-100 transition group shadow-2xs hover:shadow-xs duration-200"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[11px] font-bold text-[#5f6f52] truncate group-hover:underline">{res.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#5f6f52] shrink-0" />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal mt-1 font-medium">
                    {res.reason}
                  </p>
                </a>
              ))}
            </div>

            <div className={fullscreenWidget === 'breakthroughMaps' ? 'space-y-4' : 'pt-2'}>
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1.5">Open-Source Visual Portals</span>
              <div className={`grid gap-2 ${fullscreenWidget === 'breakthroughMaps' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
                {defaultVisualAids.map((aid) => (
                  <a
                    key={aid.name}
                    href={aid.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-slate-150 bg-white hover:bg-slate-50 rounded-xl text-center hover:border-slate-300 transition block text-[10px] font-bold text-slate-600 truncate shadow-2xs"
                  >
                    {aid.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}

      </div>
      </div>
      ) : (
        <LearningPathWorkspace />
      )}

      {/* Socratic Context-Aware Flashcard Player */}
      <FlashcardDeckModal
        deck={activeFlashcardDeck}
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        onSaveToLibrary={handleSaveFlashcardsToLibrary}
      />

      {/* Clear Chat Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Clear Socratic Chat History?</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    This will permanently delete the current session's chat history from Firestore and reset your discussion. This operation cannot be undone.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-600 space-y-1.5">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Subject:</span>
                  <span className="font-bold text-slate-800">{subject}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Topic:</span>
                  <span className="font-bold text-slate-800">{topic}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Stored Messages:</span>
                  <span className="font-bold text-slate-800">{messages.length} messages</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClearConfirmModal(false)}
                  disabled={isClearingChat}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmClearChat}
                  disabled={isClearingChat}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isClearingChat ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting History...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm & Permanently Clear</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
