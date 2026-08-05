import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { SavedDocument, InlineComment, CommentReply, ParagraphReaction, DocumentVersion, DocumentAnnotation, ParentTeacherMessage as ChatMsg } from '../types';
import { saveCurriculumDocsToOfflineCache } from '../utils/offlineCache';
import { extractDocumentHeadings, groupHeadingsByPedagogicalPhase, PedagogicalPhaseGroup } from '../utils/toc';
import { ACADEMIC_VOCAB_MAP, getDetectedAcademicTermsCount, AcademicTerm, ContextExample, get3ContextExamplesForTerm } from '../data/academicVocabData';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Cpu,
  Copy,
  Download,
  Edit2,
  Eye,
  Check,
  Save,
  Trash2,
  Maximize2,
  Minimize2,
  Sparkles,
  Bookmark,
  Award,
  GraduationCap,
  Highlighter,
  FileText,
  Image,
  Archive,
  FileSpreadsheet,
  Presentation,
  Mail,
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  CloudUpload,
  Calendar,
  Link2,
  X,
  Users,
  ChevronDown,
  ChevronRight,
  EyeOff,
  SlidersHorizontal,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Table,
  Link,
  Code,
  MessageSquare,
  Wand2,
  MessageCircle,
  Send,
  HelpCircle,
  Paintbrush,
  Palette,
  Languages,
  QrCode,
  Printer,
  Scroll,
  Share2,
  HardDrive,
  ExternalLink,
  Smile,
  History,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Undo,
  Redo,
  Eraser,
  PanelRightClose,
  PanelRightOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Timer,
  Bell,
  FolderOpen,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Layers,
  CheckSquare,
  Zap,
  Activity,
  Gauge,
  TrendingUp,
  Brain,
  Wifi,
  WifiOff,
  RotateCw,
  BellRing,
  Radio,
  Mic,
  Box,
  Moon,
  Sun,
  Compass,
  PenTool,
  Target
} from 'lucide-react';
import ConversationalPodcastModal from './ConversationalPodcastModal';
import ARHologramReaderModal from './ARHologramReaderModal';
import MarkdownView from './MarkdownView';
import { NexusWatermark } from './NexusWatermark';
import DiagramGenerator from './DiagramGenerator';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { handleResponseJson } from '../utils/api';
import SharedNotes from './SharedNotes';
import { logActivity } from '../lib/activityLogger';
import DocumentFeedbackWidget from './DocumentFeedbackWidget';
import DocumentVersionWidget from './DocumentVersionWidget';
import PrintPreview from './PrintPreview';
import InteractiveQuizBuilder from './InteractiveQuizBuilder';
import Whiteboard from './Whiteboard';
import CurriculumStandardsMapper from './CurriculumStandardsMapper';
import KenyanCurriculumChecker from './KenyanCurriculumChecker';
import CurriculumValidator from './CurriculumValidator';
import AIActivityAutoGrader from './AIActivityAutoGrader';
import AIExpertReviewer from './AIExpertReviewer';
import ReadingLevelAnalyzer from './ReadingLevelAnalyzer';
import { findRequirements } from '../data/kenyanCurriculumStandards';
import { VersionDiffViewer } from './VersionDiffViewer';
import { calculateReadability } from '../utils/readability';
import { doc, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, orderBy, getDocs, addDoc, collection as firestoreCollection, onSnapshot as firestoreOnSnapshot, query as firestoreQuery, orderBy as firestoreOrderBy, addDoc as firestoreAddDoc, updateDoc as firestoreUpdateDoc, doc as firestoreDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, cleanUndefined, handleFirestoreError, OperationType, compressObject, decompressObject, saveDocumentWithImageChunks, db as chatDb, handleFirestoreError as chatHandleError, OperationType as ChatOpType, cleanUndefined as chatCleanUndefined } from '../firebase';
import {
  getGoogleWorkspaceToken,
  getGoogleWorkspaceUser,
  connectGoogleWorkspace,
  disconnectGoogleWorkspace,
  exportToGoogleSheets,
  exportToGoogleDocs,
  scheduleOnGoogleCalendar,
  createGoogleSlidesDeck,
  sendMaterialViaGmail,
  createAssessmentGoogleForm
} from '../lib/googleWorkspace';
import { useAccessibility, VOICE_PROFILES, VoiceProfile } from '../context/AccessibilityContext';

const TRANSLATE_LANGUAGES = [
  { code: 'en', name: 'English (Original)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)' },
  { code: 'sw', name: 'Swahili (Kiswahili)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'so', name: 'Somali (Soomaali)' },
  { code: 'ur', name: 'Urdu (اردو)' },
  { code: 'tl', name: 'Tagalog (Filipino)' },
];

const CONCEPTS_LIST = [
  // Pedagogy / Education General
  "lesson plan", "lesson notes", "scheme of work", "formative assessment", "summative assessment", 
  "pedagogical advisor", "kenyan cbc", "competency based curriculum", "cbc", "8-4-4", "bloom's taxonomy", 
  "recall questions", "understanding questions", "application & analysis questions", "evaluation & creative task", 
  "answer key", "marking scheme", "specific learning outcomes", "smart objectives", "success criteria", 
  "key inquiry questions", "core competencies", "values", "learning resources", "digital resources", 
  "assessment rubric", "self-assessment", "exit ticket", "pacing guide", "exit tickets", "socratic method", 
  "active learning", "inquiry-based", "experiential learning", "cooperative learning", "differentiated instruction", 
  "scaffolding", "inclusion", "sen accommodations", "cognitive domain", "affective domain", "psychomotor domain", 
  "rote learning", "critical thinking", "creativity", "collaboration", "communication", "digital literacy", 
  "problem solving", "curriculum alignment",
  
  // STEM / Sciences
  "photosynthesis", "chlorophyll", "mitochondria", "cell membrane", "dna", "rna", "ecosystem", "gravity", 
  "friction", "force", "inertia", "velocity", "acceleration", "atom", "molecule", "electron", "proton", 
  "neutron", "chemical reaction", "catalyst", "acid", "base", "ph scale", "evaporation", "condensation", 
  "precipitation", "transpiration", "respiration", "digestion", "circulatory system", "nervous system", 
  "skeletal system", "evolution", "natural selection", "genetics", "homozygous", "heterozygous", "dominant", 
  "recessive", "inheritance", "mitosis", "meiosis", "osmosis", "diffusion", "active transport", "enzyme", 
  "substrate", "homeostasis", "thermoregulation", "pathogen", "the scientific method", "periodic table",
  
  // Mathematics
  "algebra", "geometry", "calculus", "trigonometry", "fraction", "decimal", "percentage", "ratio", 
  "proportion", "equation", "inequality", "variable", "coefficient", "constant", "exponent", "logarithm", 
  "derivative", "integral", "theorem", "pythagorean theorem", "hypotenuse", "area", "perimeter", "volume", 
  "surface area", "circumference", "radius", "diameter", "right angle", "parallel", "perpendicular", 
  "polygon", "triangle", "quadrilateral", "symmetry", "congruent", "similar",
  
  // Humanities & Social Sciences
  "latitude", "longitude", "equator", "prime meridian", "hemisphere", "continent", "plate tectonics", 
  "earthquake", "volcano", "erosion", "weathering", "deposition", "climate change", "global warming", 
  "greenhouse effect", "atmosphere", "troposphere", "stratosphere", "biosphere", "lithosphere", "hydrosphere", 
  "democracy", "republic", "monarchy", "dictatorship", "constitution", "sovereignty", "federalism", 
  "separation of powers", "civil rights", "human rights", "colonialism", "imperialism", "industrial revolution", 
  "world war", "treaty", "alliance", "migration", "urbanization", "globalization", "economy", "inflation", 
  "recession", "gdp", "supply and demand", "scarcity", "opportunity cost",
  
  // Languages & Literature
  "noun", "verb", "adjective", "adverb", "pronoun", "preposition", "conjunction", "interjection", "subject", 
  "predicate", "clause", "grammar", "syntax", "punctuation", "synonym", "antonym", "homophone", "metaphor", 
  "simile", "personification", "hyperbole", "alliteration", "onomatopoeia", "irony", "sarcasm", "theme", 
  "protagonist", "antagonist", "conflict", "climax", "resolution"
];

// Helper to automatically detect and bold key concepts & headers in text
export function autoDetectAndBold(content: string): string {
  if (!content) return '';

  // 1. Replace dollar signs ($) with KES
  let cleaned = content.replace(/\$/g, 'KES ');

  // 2. Remove all asterisks (*)
  cleaned = cleaned.replace(/\*/g, '');

  // 3. Remove hashes (#) and convert those heading lines to nice clean headers
  const lines = cleaned.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      const headerText = trimmed.replace(/^#+\s*/, '');
      return headerText.toUpperCase();
    }
    return line;
  });

  return processedLines.join('\n');
}

interface DocumentViewerProps {
  document: SavedDocument;
  onBack: () => void;
  onUpdate: (updatedDoc: SavedDocument) => void;
  onDelete: (id: string) => void;
}

export default function DocumentViewer({
  document,
  onBack,
  onUpdate,
  onDelete
}: DocumentViewerProps) {
  const { profile, allUsers } = useAuth();
  const { aiLanguage } = useLanguage();
  const { selectedVoiceProfileId, setSelectedVoiceProfileId, playbackSpeed, setPlaybackSpeed, ttsHighlightingEnabled, ttsKeyboardControlsEnabled } = useAccessibility();
  
  const isRecipientViewOnly = profile?.role === 'Student' || window.location.hash.includes('mode=view') || window.location.hash.includes('viewOnly=true');
  const isStudent = profile?.role === 'Student' || isRecipientViewOnly;
  const isSharedLink = window.location.hash.includes('mode=view') || window.location.hash.includes('viewOnly=true');

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(document.content);
  const [editedTitle, setEditedTitle] = useState(document.title);
  const [showHighlightPopover, setShowHighlightPopover] = useState(false);
  const [isQuickStudyMode, setIsQuickStudyMode] = useState(false);
  const [isSimplifyingSentence, setIsSimplifyingSentence] = useState(false);
  const [isSimplifyingParagraph, setIsSimplifyingParagraph] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('document_dark_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('document_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleQuickStudyMode = () => {
    const nextMode = !isQuickStudyMode;
    setIsQuickStudyMode(nextMode);
    if (nextMode) {
      setIsCommentsOpen(false);
      setIsAnnotationsOpen(false);
      setIsReactionsSidebarOpen(false);
      setIsVersionsSidebarOpen(false);
      setIsParentChatOpen(false);
      setIsSocraticSidebarOpen(false);
      setIsEditing(false);
    }
  };

  // Automated Spell and Grammar Checking Engine state
  const [isCheckingSpelling, setIsCheckingSpelling] = useState(false);
  const [spellCheckErrors, setSpellCheckErrors] = useState<Array<{
    original: string;
    suggestion: string;
    explanation: string;
    severity: 'error' | 'warning';
  }>>([]);
  const [hasRunSpellCheck, setHasRunSpellCheck] = useState(false);
  const [spellCheckResultMsg, setSpellCheckResultMsg] = useState<string>('');

  const handleRunSpellCheck = async () => {
    if (isCheckingSpelling) return;
    setIsCheckingSpelling(true);
    setSpellCheckResultMsg('');
    try {
      const response = await fetch('/api/spellcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent }),
      });
      if (!response.ok) {
        throw new Error('Spellcheck request failed');
      }
      const data = await response.json();
      setSpellCheckErrors(data.errors || []);
      setHasRunSpellCheck(true);
      if ((data.errors || []).length === 0) {
        setSpellCheckResultMsg('Perfect spelling and grammar! No issues found.');
      }
    } catch (err: any) {
      console.error('Failed to run spellcheck:', err);
      setSpellCheckResultMsg('Error during spellcheck. Please try again.');
    } finally {
      setIsCheckingSpelling(false);
    }
  };

  const applySpellFix = (original: string, suggestion: string) => {
    if (!original || !editedContent) return;
    
    // Replace occurrences safely
    const escaped = original.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    const updated = editedContent.replace(regex, suggestion);
    
    setEditedContent(updated);
    setSpellCheckErrors(prev => prev.filter(err => err.original !== original));
  };

  useEffect(() => {
    if (!isEditing) {
      setSpellCheckErrors([]);
      setHasRunSpellCheck(false);
      setSpellCheckResultMsg('');
    }
  }, [isEditing]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error' | null>(null);
  const [lastSavedSyncTime, setLastSavedSyncTime] = useState<string>(() => {
    if (document.lastModified) {
      try {
        return new Date(document.lastModified).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
      } catch (e) {}
    }
    return new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  });
  const [isPrintLayoutPreview, setIsPrintLayoutPreview] = useState(false);
  const [documentOrientation, setDocumentOrientation] = useState<'portrait' | 'landscape'>(
    document.pageOrientation || 'portrait'
  );
  const [printLayoutOrientation, setPrintLayoutOrientation] = useState<'portrait' | 'landscape'>(
    document.pageOrientation || 'portrait'
  );

  useEffect(() => {
    if (document.pageOrientation) {
      setDocumentOrientation(document.pageOrientation);
      setPrintLayoutOrientation(document.pageOrientation);
    }
  }, [document.id, document.pageOrientation]);

  const handleOrientationToggle = (newOrientation: 'portrait' | 'landscape') => {
    setDocumentOrientation(newOrientation);
    setPrintLayoutOrientation(newOrientation);
    if (onUpdate && document) {
      onUpdate({
        ...document,
        pageOrientation: newOrientation,
        lastModified: new Date().toISOString()
      });
    }
  };
  const [printLayoutMargin, setPrintLayoutMargin] = useState<'narrow' | 'normal' | 'wide'>('normal');
  const [printLayoutFont, setPrintLayoutFont] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [printLayoutColorMode, setPrintLayoutColorMode] = useState<'color' | 'grayscale'>('color');

  // Text-To-Speech (TTS) Read Aloud Engine
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const [isPausedTts, setIsPausedTts] = useState(false);
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Advanced Accessibility & Read Aloud settings
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [ttsVoicesList, setTtsVoicesList] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(() => {
    return localStorage.getItem('accessibility_tts_voice') || '';
  });
  const [ttsPitch, setTtsPitch] = useState<number>(() => {
    return Number(localStorage.getItem('accessibility_tts_pitch') || '1');
  });

  const [isDyslexiaMode, setIsDyslexiaMode] = useState<boolean>(() => {
    return localStorage.getItem('accessibility_dyslexia') === 'true';
  });
  useEffect(() => {
    localStorage.setItem('accessibility_dyslexia', String(isDyslexiaMode));
  }, [isDyslexiaMode]);

  const [tintColor, setTintColor] = useState<string>('none');
  const [isReadingRulerEnabled, setIsReadingRulerEnabled] = useState(false);
  const [rulerHeight, setRulerHeight] = useState(30);
  const [eslClickToDefine, setEslClickToDefine] = useState(false);

  const [highlightAcademicVocab, setHighlightAcademicVocab] = useState<boolean>(() => {
    return localStorage.getItem('accessibility_vocab_highlight') === 'true';
  });
  useEffect(() => {
    localStorage.setItem('accessibility_vocab_highlight', String(highlightAcademicVocab));
  }, [highlightAcademicVocab]);

  const [activeAcademicVocab, setActiveAcademicVocab] = useState<{
    term: string;
    matchedData?: AcademicTerm;
    dynamicData?: {
      word?: string;
      type?: string;
      definition?: string;
      examples?: ContextExample[];
    };
    dynamicDef?: string;
    x: number;
    y: number;
  } | null>(null);
  const [isFetchingDynamicVocab, setIsFetchingDynamicVocab] = useState<boolean>(false);

  const handleAcademicVocabClick = useCallback(async (termText: string, pos: { x: number; y: number }) => {
    const wordLower = termText.toLowerCase().replace(/[^a-z]/g, '');
    const preseeded = ACADEMIC_VOCAB_MAP[wordLower];

    const rect = containerRef.current?.getBoundingClientRect();
    const relativeX = rect ? Math.max(10, Math.min(pos.x - rect.left, rect.width - 380)) : Math.max(10, pos.x - 190);
    const relativeY = rect ? Math.max(10, pos.y - rect.top) : Math.max(10, pos.y);

    if (preseeded) {
      setActiveAcademicVocab({
        term: termText,
        matchedData: preseeded,
        x: relativeX,
        y: relativeY
      });
    } else {
      setActiveAcademicVocab({
        term: termText,
        x: relativeX,
        y: relativeY
      });
      setIsFetchingDynamicVocab(true);

      try {
        const response = await fetch('/api/tutor-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Identify and explain the academic vocabulary term "${termText}" for a student.

Provide your response strictly in valid JSON format containing:
1. "word": "${termText}"
2. "type": part of speech (e.g. noun, verb, adjective)
3. "definition": clear, concise academic definition suitable for students
4. "examples": an array of EXACTLY 3 example sentences demonstrating how "${termText}" is used in 3 DIFFERENT academic contexts:
   - Context 1: "STEM / Natural Sciences"
   - Context 2: "Humanities & Social Studies"
   - Context 3: "Academic Research & Essay"

Example JSON output format:
{
  "word": "${termText}",
  "type": "noun",
  "definition": "Clear academic definition of ${termText}...",
  "examples": [
    { "context": "STEM / Natural Sciences", "sentence": "First example sentence in science." },
    { "context": "Humanities & Social Studies", "sentence": "Second example sentence in humanities." },
    { "context": "Academic Research & Essay", "sentence": "Third example sentence in research." }
  ]
}`,
            context: `Academic vocabulary identification request for term: ${termText}`
          })
        });

        if (response.ok) {
          const data = await response.json();
          const rawMsg = data.message || '';

          let parsedWord = termText;
          let parsedType = 'academic term';
          let parsedDef = '';
          let parsedExamples: ContextExample[] = [];

          try {
            const cleanedJson = rawMsg.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const jsonStart = cleanedJson.indexOf('{');
            const jsonEnd = cleanedJson.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
              const jsonObj = JSON.parse(cleanedJson.substring(jsonStart, jsonEnd + 1));
              if (jsonObj.definition) parsedDef = jsonObj.definition;
              if (jsonObj.type) parsedType = jsonObj.type;
              if (jsonObj.word) parsedWord = jsonObj.word;
              if (Array.isArray(jsonObj.examples) && jsonObj.examples.length > 0) {
                parsedExamples = jsonObj.examples.map((ex: any) => ({
                  context: ex.context || 'Academic Context',
                  sentence: ex.sentence || (typeof ex === 'string' ? ex : String(ex))
                }));
              }
            }
          } catch (e) {
            parsedDef = rawMsg;
          }

          if (!parsedDef) parsedDef = rawMsg;

          if (parsedExamples.length < 3) {
            const fallbackContexts = [
              { context: 'STEM / Natural Sciences', sentence: `Researchers analyze how ${termText} operates in physical or biological systems.` },
              { context: 'Humanities & Social Studies', sentence: `Historical and cultural studies frequently examine the societal implications of ${termText}.` },
              { context: 'Academic Research & Essay', sentence: `Writing a scholarly analysis requires critically evaluating the principles of ${termText}.` }
            ];
            while (parsedExamples.length < 3) {
              parsedExamples.push(fallbackContexts[parsedExamples.length]);
            }
          }

          setActiveAcademicVocab(prev => prev ? {
            ...prev,
            dynamicData: {
              word: parsedWord,
              type: parsedType,
              definition: parsedDef,
              examples: parsedExamples.slice(0, 3)
            },
            dynamicDef: parsedDef
          } : null);
        } else {
          setActiveAcademicVocab(prev => prev ? {
            ...prev,
            dynamicDef: `An essential academic concept: "${termText}".`,
            dynamicData: {
              word: termText,
              type: 'academic term',
              definition: `Key academic vocabulary concept: "${termText}".`,
              examples: [
                { context: 'STEM / Natural Sciences', sentence: `Scientists study how ${termText} functions within natural systems.` },
                { context: 'Humanities & Social Studies', sentence: `Scholars explore the influence of ${termText} on societal development.` },
                { context: 'Academic Research & Essay', sentence: `Effective essay writing requires a clear understanding of ${termText}.` }
              ]
            }
          } : null);
        }
      } catch (err) {
        setActiveAcademicVocab(prev => prev ? {
          ...prev,
          dynamicDef: `An essential academic concept: "${termText}".`,
          dynamicData: {
            word: termText,
            type: 'academic term',
            definition: `Key academic vocabulary concept: "${termText}".`,
            examples: [
              { context: 'STEM / Natural Sciences', sentence: `Scientists study how ${termText} functions within natural systems.` },
              { context: 'Humanities & Social Studies', sentence: `Scholars explore the influence of ${termText} on societal development.` },
              { context: 'Academic Research & Essay', sentence: `Effective essay writing requires a clear understanding of ${termText}.` }
            ]
          }
        } : null);
      } finally {
        setIsFetchingDynamicVocab(false);
      }
    }
  }, []);

  const [flashcardExportStatus, setFlashcardExportStatus] = useState<string | null>(null);
  const [isExportingFlashcard, setIsExportingFlashcard] = useState<boolean>(false);

  const handleExportToFlashcards = useCallback(async () => {
    if (!activeAcademicVocab) return;
    setIsExportingFlashcard(true);

    const word = activeAcademicVocab.matchedData?.word || activeAcademicVocab.dynamicData?.word || activeAcademicVocab.term;
    const type = activeAcademicVocab.matchedData?.type || activeAcademicVocab.dynamicData?.type || 'academic term';
    const definition = activeAcademicVocab.matchedData?.definition || activeAcademicVocab.dynamicData?.definition || activeAcademicVocab.dynamicDef || '';

    const examplesList: ContextExample[] = activeAcademicVocab.matchedData
      ? get3ContextExamplesForTerm(activeAcademicVocab.matchedData)
      : (activeAcademicVocab.dynamicData?.examples && activeAcademicVocab.dynamicData.examples.length >= 3
          ? activeAcademicVocab.dynamicData.examples
          : [
              { context: 'STEM / Natural Sciences', sentence: `Researchers analyze how ${word} operates in physical or biological systems.` },
              { context: 'Humanities & Social Studies', sentence: `Literary and historical analyses frequently evaluate the social impact of ${word}.` },
              { context: 'Academic Research & Essay', sentence: `Constructing a persuasive thesis requires critically evaluating ${word}.` }
            ]);

    const cardId = `card-vocab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const formattedExamplesText = examplesList.map((ex, idx) => `**Context ${idx + 1} (${ex.context}):**\n"${ex.sentence}"`).join('\n\n');

    const newFlashcard = {
      id: cardId,
      front: `${word} (${type})`,
      back: `**Definition:**\n${definition}\n\n**3 Academic Context Examples:**\n\n${formattedExamplesText}`,
      hint: `Academic Category: ${activeAcademicVocab.matchedData?.category || 'General Academic'} | Part of Speech: ${type}`,
      category: 'Academic Vocabulary',
      mastered: false,
      repetition: 0,
      interval: 1,
      easeFactor: 2.5,
      dueDate: new Date().toISOString()
    };

    const deckStorageKey = `edunexus_revision_flashcards_${document.id || 'general'}`;
    let existingDeck: any = null;

    try {
      const stored = localStorage.getItem(deckStorageKey) || localStorage.getItem('edunexus_academic_revision_deck');
      if (stored) {
        existingDeck = JSON.parse(stored);
      }
    } catch (err) {
      console.warn("Could not read existing revision deck from localStorage:", err);
    }

    const updatedCards = existingDeck?.cards ? [...existingDeck.cards] : [];
    const existingCardIndex = updatedCards.findIndex((c: any) => c.front?.toLowerCase().includes(word.toLowerCase()));
    if (existingCardIndex >= 0) {
      updatedCards[existingCardIndex] = newFlashcard;
    } else {
      updatedCards.unshift(newFlashcard);
    }

    const revisionDeck = {
      id: existingDeck?.id || `deck-academic-vocab-${document.id || Date.now()}`,
      title: `Academic Vocabulary Revision Deck - ${document.title || 'Curriculum'}`,
      description: `Collection of exported academic vocabulary terms with definitions and 3 contextual examples for revision.`,
      subject: document.subject || 'General Academic',
      topic: 'Academic Vocabulary Revision',
      cards: updatedCards,
      createdAt: existingDeck?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceDocId: document.id
    };

    try {
      localStorage.setItem(deckStorageKey, JSON.stringify(revisionDeck));
      localStorage.setItem('edunexus_academic_revision_deck', JSON.stringify(revisionDeck));
    } catch (err) {
      console.warn("Error storing revision deck in localStorage:", err);
    }

    try {
      const revisionDoc: SavedDocument = {
        id: revisionDeck.id,
        title: revisionDeck.title,
        docType: 'flashcards',
        curriculum: 'cbc',
        subject: revisionDeck.subject,
        classLevel: document.classLevel || 'General',
        gradeLevel: document.classLevel || 'General',
        topic: revisionDeck.topic,
        subTopic: '',
        duration: '',
        content: `# ${revisionDeck.title}\n\nDedicated revision deck containing ${revisionDeck.cards?.length || 0} academic vocabulary cards for topic: ${revisionDeck.topic}.\n\n` +
          (revisionDeck.cards || []).map((c: any) => `### ${c?.front || ''}\n${c?.back || ''}\n`).join('\n---\n'),
        createdAt: revisionDeck.createdAt,
        lastModified: new Date().toISOString(),
        tags: ['flashcards', 'academic-vocabulary', 'revision', revisionDeck.subject],
        category: 'Flashcards',
        flashcardDeck: revisionDeck,
        lastModifiedByUid: profile?.uid || 'system',
        lastModifiedByName: profile?.displayName || profile?.email || 'Student',
      };

      await saveDocumentWithImageChunks(revisionDoc.id, revisionDoc);
    } catch (err) {
      console.warn("Saved flashcards locally. Firestore sync note:", err);
    }

    setIsExportingFlashcard(false);
    setFlashcardExportStatus('Exported!');
    setTimeout(() => {
      setFlashcardExportStatus(null);
    }, 4000);
  }, [activeAcademicVocab, document, profile]);
  
  const [spokenBlockText, setSpokenBlockText] = useState<string | null>(null);
  const [currentSpeechCharIndex, setCurrentSpeechCharIndex] = useState<number>(0);
  const [speakQueue, setSpeakQueue] = useState<string[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);

  // Classic Handwritten Notes custom states
  const [showTranscribedText, setShowTranscribedText] = useState(false);

  const [viewerPaperStyle, setViewerPaperStyle] = useState<'ruled' | 'grid' | 'blank'>(() => {
    return document.paperStyle || 'ruled';
  });
  const [viewerPenColor, setViewerPenColor] = useState<'blue' | 'black'>(() => {
    return document.penColor || 'blue';
  });
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [showDoodles, setShowDoodles] = useState<boolean>(true);
  const [printerFriendly, setPrinterFriendly] = useState<boolean>(false);
  const [isGeneratingHandwrittenPDF, setIsGeneratingHandwrittenPDF] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
      window.document.body.style.overflow = 'hidden';
    } else {
      window.document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (document.paperStyle) setViewerPaperStyle(document.paperStyle);
    if (document.penColor) setViewerPenColor(document.penColor);
  }, [document.id, document.paperStyle, document.penColor]);

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setTtsVoicesList(window.speechSynthesis.getVoices());
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speakText = (text: string, options?: { onStart?: () => void; onEnd?: () => void }) => {
    window.speechSynthesis.cancel();
    
    // Clean text (remove markdown symbols)
    const cleanText = text
      .replace(/[#*`_~\[\]()\-+]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = playbackSpeed;
    utterance.pitch = ttsPitch;

    const voiceProfile = VOICE_PROFILES.find(vp => vp.id === selectedVoiceProfileId);
    let assignedVoice: SpeechSynthesisVoice | undefined;

    if (voiceProfile) {
      const localeVoices = ttsVoicesList.filter(v => 
        voiceProfile.langCodes.some(lc => v.lang.toLowerCase().replace('_', '-').includes(lc.toLowerCase()))
      );
      if (localeVoices.length > 0) {
        for (const voiceName of voiceProfile.voiceNames) {
          assignedVoice = localeVoices.find(v => v.name.toLowerCase().includes(voiceName.toLowerCase()));
          if (assignedVoice) break;
        }
        if (!assignedVoice) assignedVoice = localeVoices[0];
      }
    }

    if (assignedVoice) {
      utterance.voice = assignedVoice;
    } else if (selectedVoiceName) {
      const voice = ttsVoicesList.find(v => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
    } else {
      // Default fallback
      const isSwahili = document.content.includes('jambo') || document.content.includes('habari') || document.content.includes('kazi') || document.content.includes('akisami') || document.content.includes('sarufi');
      const voiceLang = isSwahili ? 'sw-KE' : 'en-US';
      const defaultVoice = ttsVoicesList.find(v => v.lang.startsWith(voiceLang)) || ttsVoicesList.find(v => v.lang.startsWith('en'));
      if (defaultVoice) utterance.voice = defaultVoice;
    }

    utterance.onstart = () => {
      options?.onStart?.();
      setSpokenBlockText(text);
      setIsPlayingTts(true);
      setIsPausedTts(false);
      setCurrentSpeechCharIndex(0);
    };

    utterance.onend = () => {
      setIsPlayingTts(false);
      setIsPausedTts(false);
      setSpokenBlockText(null);
      setCurrentSpeechCharIndex(0);
      ttsUtteranceRef.current = null;
      options?.onEnd?.();
    };

    utterance.onerror = () => {
      setIsPlayingTts(false);
      setIsPausedTts(false);
      setSpokenBlockText(null);
      setCurrentSpeechCharIndex(0);
      ttsUtteranceRef.current = null;
      options?.onEnd?.();
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setCurrentSpeechCharIndex(event.charIndex);
      }
    };

    ttsUtteranceRef.current = utterance;
    setIsPlayingTts(true);
    setIsPausedTts(false);
    window.speechSynthesis.speak(utterance);
  };

  const getSpeakableBlocks = (content: string): string[] => {
    if (!content) return [];
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        if (!line) return false;
        if (line.startsWith('#')) return false;
        if (line.startsWith('![')) return false;
        if (line.startsWith('```')) return false;
        if (line.startsWith('---')) return false;
        if (line.startsWith('***')) return false;
        return true;
      });
  };

  const playQueueIndex = (index: number, queue: string[] = speakQueue) => {
    if (index < 0 || index >= queue.length) {
      handleStopTts();
      return;
    }
    setCurrentQueueIndex(index);
    const textToSpeak = queue[index];
    
    speakText(textToSpeak, {
      onEnd: () => {
        setCurrentQueueIndex(prevIndex => {
          if (prevIndex === index) {
            const nextIdx = index + 1;
            if (nextIdx < queue.length) {
              setTimeout(() => {
                playQueueIndex(nextIdx, queue);
              }, 300);
            } else {
              handleStopTts();
            }
          }
          return prevIndex;
        });
      }
    });
  };

  const handleSpeakSingleBlock = (blockText: string) => {
    const blocks = getSpeakableBlocks(displayContent);
    const foundIdx = blocks.indexOf(blockText);
    if (foundIdx !== -1) {
      setSpeakQueue(blocks);
      playQueueIndex(foundIdx, blocks);
    } else {
      setSpeakQueue([blockText]);
      playQueueIndex(0, [blockText]);
    }
  };

  const handleToggleTts = () => {
    if (isPlayingTts) {
      if (isPausedTts) {
        window.speechSynthesis.resume();
        setIsPausedTts(false);
      } else {
        window.speechSynthesis.pause();
        setIsPausedTts(true);
      }
    } else {
      const blocks = getSpeakableBlocks(displayContent);
      if (blocks.length > 0) {
        setSpeakQueue(blocks);
        playQueueIndex(0, blocks);
      } else {
        speakText(displayContent);
      }
    }
  };

  const handleStopTts = () => {
    window.speechSynthesis.cancel();
    setIsPlayingTts(false);
    setIsPausedTts(false);
    setSpokenBlockText(null);
    setCurrentSpeechCharIndex(0);
    setSpeakQueue([]);
    setCurrentQueueIndex(-1);
    ttsUtteranceRef.current = null;
  };

  // Keyboard controls for TTS playback
  useEffect(() => {
    if (!ttsKeyboardControlsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input, textarea, or contentEditable element
      const activeEl = window.document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || activeEl.hasAttribute('contenteditable')) {
          return;
        }
      }

      switch (e.key) {
        case ' ': // Spacebar
          e.preventDefault();
          handleToggleTts();
          break;
        case 'ArrowRight': // Arrow Right - skip forward (or start)
          e.preventDefault();
          if (speakQueue.length > 0) {
            const nextIdx = currentQueueIndex === -1 ? 0 : currentQueueIndex + 1;
            if (nextIdx < speakQueue.length) {
              playQueueIndex(nextIdx);
            }
          } else {
            const blocks = getSpeakableBlocks(document.content);
            if (blocks.length > 0) {
              setSpeakQueue(blocks);
              playQueueIndex(0, blocks);
            }
          }
          break;
        case 'ArrowLeft': // Arrow Left - skip backward
          e.preventDefault();
          if (speakQueue.length > 0 && currentQueueIndex !== -1) {
            const prevIdx = currentQueueIndex - 1;
            if (prevIdx >= 0) {
              playQueueIndex(prevIdx);
            }
          }
          break;
        case 'Escape': // Escape - stop playback
        case 's':
        case 'S':
          e.preventDefault();
          handleStopTts();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          handleToggleTts();
          break;
        case '+':
        case '=': {
          e.preventDefault();
          const newSpeed = Math.min(2.0, playbackSpeed + 0.1);
          setPlaybackSpeed(newSpeed);
          if (isPlayingTts && currentQueueIndex !== -1) {
            setTimeout(() => {
              playQueueIndex(currentQueueIndex);
            }, 100);
          }
          break;
        }
        case '-':
        case '_': {
          e.preventDefault();
          const newSpeed = Math.max(0.5, playbackSpeed - 0.1);
          setPlaybackSpeed(newSpeed);
          if (isPlayingTts && currentQueueIndex !== -1) {
            setTimeout(() => {
              playQueueIndex(currentQueueIndex);
            }, 100);
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [ttsKeyboardControlsEnabled, isPlayingTts, isPausedTts, speakQueue, currentQueueIndex, playbackSpeed, setPlaybackSpeed]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (isRecipientViewOnly && isEditing) {
      setIsEditing(false);
    }
  }, [isRecipientViewOnly, isEditing]);

  const getAccessibilityBgClass = () => {
    if (isDarkMode) return 'bg-slate-900 text-slate-100 border-slate-800 dark';
    if (tintColor === 'cream') return 'bg-[#FAF6EB] text-[#2F210F] border-amber-200/80';
    if (tintColor === 'mint') return 'bg-[#EBF7EE] text-[#0E2F16] border-emerald-200/80';
    if (tintColor === 'blue') return 'bg-[#ECF5FC] text-[#0C243C] border-blue-200/80';
    if (tintColor === 'contrast') return 'bg-slate-900 text-slate-100 border-slate-700 dark';
    return '';
  };

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedWordDefinition, setSelectedWordDefinition] = useState<string | null>(null);
  const [isExplainingWord, setIsExplainingWord] = useState(false);
  const [wordPosition, setWordPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rulerY, setRulerY] = useState(150);

  const handleDocumentDoubleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!eslClickToDefine) return;
    const selection = window.getSelection();
    if (!selection) return;
    const text = selection.toString().trim();
    if (!text || text.length > 50 || text.includes(' ') || text.includes('\n')) return;

    setSelectedWord(text);
    setIsExplainingWord(true);

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setWordPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 15
      });
    }

    const localDict: Record<string, string> = {
      photosynthesis: "The scientific process where green plants use sunlight, carbon dioxide, and water to create chemical energy (glucose) and release oxygen.",
      chlorophyll: "The green pigment found inside plant cells that traps sunlight and gives leaves their green color.",
      mitochondria: "The energy-producing structures inside cell bodies, often called the 'powerhouse of the cell'.",
      dna: "The genetic building blocks that carry the master blueprint for how living things grow, function, and inherit traits.",
      gravity: "The invisible pulling force that pulls all objects and matter down toward the center of the Earth.",
      friction: "The resisting force that occurs when two physical surfaces slide, rub, or move against each other.",
      algebra: "A branch of mathematics where letters and symbols are used to stand for unknown numbers in equations.",
      photosynthesise: "To perform photosynthesis; making food from carbon dioxide and water using sunlight.",
      nucleus: "The central control center of a cell that holds the genetic DNA materials, or the core of an atom.",
      osmosis: "The movement of water molecules through a thin barrier from a less concentrated area to a more concentrated area.",
      atom: "The basic chemical building block of all physical matter, consisting of a nucleus, protons, neutrons, and electrons."
    };

    const wordLower = text.toLowerCase().replace(/[^a-z]/g, '');
    const matchedDef = localDict[wordLower];

    if (matchedDef) {
      setSelectedWordDefinition(matchedDef);
      setIsExplainingWord(false);
    } else {
      try {
        const response = await fetch('/api/tutor-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Briefly define and explain the educational term "${text}" in simple, dyslexia-friendly terms for a student. Keep it under 2 sentences, using helpful analogies.`,
            context: `Term analysis for ESL student. Word: ${text}.`
          })
        });
        if (response.ok) {
          const data = await response.json();
          setSelectedWordDefinition(data.message);
        } else {
          setSelectedWordDefinition(`A key educational concept from your lesson: "${text}". Click "Pronounce" to hear it spoken aloud!`);
        }
      } catch (err) {
        setSelectedWordDefinition(`A key educational concept from your lesson: "${text}". Click "Pronounce" to hear it spoken aloud!`);
      } finally {
        setIsExplainingWord(false);
      }
    }
  };

  const handleCloseWordPopup = () => {
    setSelectedWord(null);
    setSelectedWordDefinition(null);
  };

  const handleAccessibilityMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isReadingRulerEnabled || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    setRulerY(relativeY);
  };

  const loggedDocsRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (document.id && profile && !loggedDocsRef.current[document.id]) {
      logActivity(
        'view',
        `Viewed document: "${document.title}" (${document.docType.replace('-', ' ')})`,
        profile,
        document.id,
        document.title
      );
      loggedDocsRef.current[document.id] = true;
    }
  }, [document.id, profile]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevDocIdRef = useRef(document.id);

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = prefix + selectedText + suffix;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setEditedContent(newContent);

    // Re-focus and reset selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const makeUppercase = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = selectedText.toUpperCase();

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setEditedContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    }, 0);
  };

  const makeHeaderLine = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = text.indexOf('\n', end);
    const actualEnd = lineEnd === -1 ? text.length : lineEnd;

    const lineText = text.substring(lineStart, actualEnd);
    const replacement = lineText.toUpperCase();

    const newContent = text.substring(0, lineStart) + replacement + text.substring(actualEnd);
    setEditedContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + replacement.length);
    }, 0);
  };
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generatingPlaceholders, setGeneratingPlaceholders] = useState<Record<string, boolean>>({});
  const [isDiagramGeneratorOpen, setIsDiagramGeneratorOpen] = useState(false);
  const [isToolbarImageModalOpen, setIsToolbarImageModalOpen] = useState(false);
  const [toolbarImagePrompt, setToolbarImagePrompt] = useState('');
  const [toolbarImageModel, setToolbarImageModel] = useState('emgen_fallback_nanobanana');
  const [isGeneratingToolbarImage, setIsGeneratingToolbarImage] = useState(false);
  const [toolbarImageError, setToolbarImageError] = useState<string | null>(null);
  const [toolbarImageTab, setToolbarImageTab] = useState<'create' | 'gallery'>('create');
  const [gallerySearch, setGallerySearch] = useState('');
  const [imageStudioResources, setImageStudioResources] = useState<any[]>([]);
  const [isLoadingStudioResources, setIsLoadingStudioResources] = useState(false);
  const [selectedAlignment, setSelectedAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [selectedWidthType, setSelectedWidthType] = useState<'full' | 'large' | 'medium' | 'small' | 'custom'>('full');
  const [customWidthValue, setCustomWidthValue] = useState('300px');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isQuizBuilderOpen, setIsQuizBuilderOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [isOfflineCachedNotice, setIsOfflineCachedNotice] = useState(false);
  const [sharingPermission, setSharingPermission] = useState<'view' | 'collaborate'>('view');
  const [qrCopied, setQrCopied] = useState(false);
  const [qrColor, setQrColor] = useState('10b981');
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryCopied, setSummaryCopied] = useState(false);

  // Readability & Complexity Suggestions Modal States
  const [isReadabilitySuggestionsModalOpen, setIsReadabilitySuggestionsModalOpen] = useState(false);
  const [readabilityTargetAction, setReadabilityTargetAction] = useState<'simplify' | 'elevate'>('simplify');
  const [isGeneratingReadabilitySuggestions, setIsGeneratingReadabilitySuggestions] = useState(false);
  const [readabilitySuggestionsError, setReadabilitySuggestionsError] = useState<string | null>(null);
  const [readabilitySuggestions, setReadabilitySuggestions] = useState<{
    overallGuidance: string;
    suggestions: string[];
    exampleRewrites: { original: string; modified: string; reason: string; }[];
  } | null>(null);
  const [appliedRewrites, setAppliedRewrites] = useState<string[]>([]);

  // Socratic Sidebar & Engagement Tracking States
  const [isPodcastModalOpen, setIsPodcastModalOpen] = useState(false);
  const [isARHologramOpen, setIsARHologramOpen] = useState(false);
  const [isSocraticSidebarOpen, setIsSocraticSidebarOpen] = useState(false);
  const [socraticMessages, setSocraticMessages] = useState<Array<{
    role: 'user' | 'model';
    text: string;
    isQueuedOffline?: boolean;
    isOfflinePending?: boolean;
    queueId?: string;
  }>>([
    { role: 'model', text: "Hello! I am your Socratic Tutor. Chat with me about this document, or ask me to explain key concepts. Let's learn!" }
  ]);
  const [socraticInput, setSocraticInput] = useState('');
  const [isSocraticLoading, setIsSocraticLoading] = useState(false);
  const [socraticInteractionsCount, setSocraticInteractionsCount] = useState(0);

  // Offline Socratic AI Queuing & Auto-Sync Engine
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [offlineSocraticQueue, setOfflineSocraticQueue] = useState<Array<{
    id: string;
    message: string;
    history: Array<{ role: 'user' | 'model'; text: string }>;
    timestamp: number;
  }>>(() => {
    try {
      const saved = localStorage.getItem('edunexus_socratic_offline_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSyncingOfflineQueue, setIsSyncingOfflineQueue] = useState(false);
  const [syncNotificationToast, setSyncNotificationToast] = useState<{ show: boolean; text: string; count: number } | null>(null);

  // Sync offline queue to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem('edunexus_socratic_offline_queue', JSON.stringify(offlineSocraticQueue));
    } catch (e) {
      console.error('Failed to sync offline queue to localStorage', e);
    }
  }, [offlineSocraticQueue]);

  // Process offline queue on network reconnection
  const processOfflineQueue = useCallback(async () => {
    if (offlineSocraticQueue.length === 0 || isSyncingOfflineQueue) return;

    setIsSyncingOfflineQueue(true);
    let syncedCount = 0;
    const remainingQueue = [...offlineSocraticQueue];

    for (const item of offlineSocraticQueue) {
      try {
        const response = await fetch('/api/tutor-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: item.message,
            history: item.history || [],
            subject: document.subject || 'General Education',
            topic: document.topic || 'Lesson Concept',
            scaffoldingLevel: 'medium',
            documentContext: editedContent,
            persona: 'Socratic Questioner',
          }),
        });

        if (!response.ok) throw new Error('Network error during offline sync');
        const data = await response.json();
        const tutorReply = data.message || "I'm processing our next scaffolding step. Could you explain your thinking more?";

        // Update socraticMessages: replace pending placeholder or append model reply
        setSocraticMessages(prev => {
          const placeholderIdx = prev.findIndex(m => m.queueId === item.id && m.isOfflinePending);
          if (placeholderIdx !== -1) {
            const updated = [...prev];
            updated[placeholderIdx] = {
              role: 'model',
              text: tutorReply,
              queueId: item.id
            };
            return updated;
          } else {
            return [
              ...prev,
              { role: 'model', text: tutorReply, queueId: item.id }
            ];
          }
        });

        syncedCount++;
        const queueIdx = remainingQueue.findIndex(q => q.id === item.id);
        if (queueIdx !== -1) remainingQueue.splice(queueIdx, 1);
      } catch (err) {
        console.error('Offline queue resync failed for item:', item.id, err);
        break;
      }
    }

    setOfflineSocraticQueue(remainingQueue);
    setIsSyncingOfflineQueue(false);

    if (syncedCount > 0) {
      setSyncNotificationToast({
        show: true,
        count: syncedCount,
        text: `📶 Connection Restored! Automatically fetched Socratic AI tutoring answers for ${syncedCount} queued query${syncedCount > 1 ? 's' : ''}.`
      });
      setTimeout(() => setSyncNotificationToast(null), 6000);
    }
  }, [offlineSocraticQueue, isSyncingOfflineQueue, document.subject, document.topic, editedContent]);

  // Online / Offline listener setup
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check: if back online and queue has items, auto-sync immediately
    if (typeof navigator !== 'undefined' && navigator.onLine && offlineSocraticQueue.length > 0) {
      processOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processOfflineQueue, offlineSocraticQueue.length]);

  // Passive Behavioral Analytics Engine & Real-Time Metrics
  const [documentDwellTime, setDocumentDwellTime] = useState(0);
  const [scrollSpeed, setScrollSpeed] = useState(0); // Smooth scroll velocity in px/s
  const [scrollReversals, setScrollReversals] = useState(0); // Re-reading/back-and-forth direction changes
  const [sectionPauseDuration, setSectionPauseDuration] = useState(0); // Stationary reading pause timer on section (s)
  const [readingProgress, setReadingProgress] = useState(0); // Scroll progress percentage (0 - 100%)
  const [showBackToTop, setShowBackToTop] = useState(false); // Floating Back to Top visibility
  const [inferredLearningState, setInferredLearningState] = useState<'breezing' | 'struggling' | 'focused' | 'idle'>('focused');
  
  // Extract major headings for Quick Jump navigation dropdown
  const quickJumpHeadings = useMemo(() => {
    return extractDocumentHeadings(editedContent || document.content || '');
  }, [editedContent, document.content]);

  // Group document sections by logical pedagogical phases using document metadata
  const quickJumpPhaseGroups = useMemo(() => {
    return groupHeadingsByPedagogicalPhase(quickJumpHeadings, {
      lessonLayout: document.lessonLayout,
      docType: document.docType,
      category: document.category,
    });
  }, [quickJumpHeadings, document.lessonLayout, document.docType, document.category]);

  const renderPhaseIcon = useCallback((phaseId: string, className = "w-3.5 h-3.5 shrink-0") => {
    switch (phaseId) {
      case 'phase-intro':
        return <Sparkles className={`${className} text-indigo-500 dark:text-indigo-400`} />;
      case 'phase-guided':
        return <GraduationCap className={`${className} text-emerald-500 dark:text-emerald-400`} />;
      case 'phase-independent':
        return <PenTool className={`${className} text-amber-500 dark:text-amber-400`} />;
      case 'phase-assessment':
        return <Target className={`${className} text-rose-500 dark:text-rose-400`} />;
      case 'phase-extensions':
        return <Layers className={`${className} text-purple-500 dark:text-purple-400`} />;
      default:
        return <Compass className={`${className} text-slate-500 dark:text-slate-400`} />;
    }
  }, []);

  // Pedagogical Phase Group Expand/Collapse State
  const [collapsedPhaseGroupIds, setCollapsedPhaseGroupIds] = useState<Record<string, boolean>>({});
  const [showPhaseGroupToggleMenu, setShowPhaseGroupToggleMenu] = useState<boolean>(false);
  const [autoAccordionPhaseMode, setAutoAccordionPhaseMode] = useState<boolean>(false);

  const togglePhaseGroupCollapse = useCallback((phaseId: string) => {
    setCollapsedPhaseGroupIds((prev) => {
      const currentlyCollapsed = !!prev[phaseId];
      if (autoAccordionPhaseMode) {
        // If expanding phaseId, collapse all other phase groups
        if (currentlyCollapsed) {
          const nextState: Record<string, boolean> = {};
          quickJumpPhaseGroups.forEach((g) => {
            if (g.id !== phaseId) {
              nextState[g.id] = true;
            }
          });
          return nextState;
        } else {
          // If already expanded, toggle collapse
          return { ...prev, [phaseId]: true };
        }
      } else {
        return { ...prev, [phaseId]: !prev[phaseId] };
      }
    });
  }, [autoAccordionPhaseMode, quickJumpPhaseGroups]);

  const toggleAutoAccordionMode = useCallback(() => {
    setAutoAccordionPhaseMode((prev) => {
      const nextVal = !prev;
      if (nextVal) {
        // Auto-focus on first non-empty phase group by collapsing all others
        const firstGroup = quickJumpPhaseGroups.find((g) => g.headings.length > 0);
        if (firstGroup) {
          const nextState: Record<string, boolean> = {};
          quickJumpPhaseGroups.forEach((g) => {
            if (g.id !== firstGroup.id) {
              nextState[g.id] = true;
            }
          });
          setCollapsedPhaseGroupIds(nextState);
        }
      }
      return nextVal;
    });
  }, [quickJumpPhaseGroups]);

  const expandAllPhaseGroups = useCallback(() => {
    setCollapsedPhaseGroupIds({});
  }, []);

  const collapseAllPhaseGroups = useCallback(() => {
    const allCollapsed: Record<string, boolean> = {};
    quickJumpPhaseGroups.forEach((g) => {
      if (g.headings.length > 0) {
        allCollapsed[g.id] = true;
      }
    });
    setCollapsedPhaseGroupIds(allCollapsed);
  }, [quickJumpPhaseGroups]);

  const handleJumpToSection = useCallback((headingId: string) => {
    if (!headingId) return;
    const targetEl = window.document.getElementById(headingId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);
  
  // Proactive Behavioral Prompt Triggers
  const [hasTriggeredProactiveChallenge, setHasTriggeredProactiveChallenge] = useState(false);
  const [showChallengeOffer, setShowChallengeOffer] = useState(false);
  const [hasTriggeredProactiveFrustration, setHasTriggeredProactiveFrustration] = useState(false);
  const [showFrustrationOffer, setShowFrustrationOffer] = useState(false);
  const [showBehavioralTelemetryBar, setShowBehavioralTelemetryBar] = useState(true);

  // Concept Simplification States
  const [isSimplifyingConcept, setIsSimplifyingConcept] = useState(false);
  const [simplifiedConceptData, setSimplifiedConceptData] = useState<{
    simplifiedText: string;
    helpfulSocraticTip: string;
  } | null>(null);

  // Active Challenge States (Socratic Multiple Choice Question)
  const [activeChallenge, setActiveChallenge] = useState<{
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
  } | null>(null);
  const [isLoadingActiveChallenge, setIsLoadingActiveChallenge] = useState(false);
  const [selectedChallengeOption, setSelectedChallengeOption] = useState<number | null>(null);
  const [showChallengeExplanation, setShowChallengeExplanation] = useState(false);
  const [hasCorrectlyAnsweredChallenge, setHasCorrectlyAnsweredChallenge] = useState<boolean | null>(null);

  const filteredGalleryResources = useMemo(() => {
    if (!gallerySearch.trim()) return imageStudioResources;
    const queryTerm = gallerySearch.toLowerCase();
    return imageStudioResources.filter((item: any) => {
      const fileNameMatch = item.fileName?.toLowerCase().includes(queryTerm);
      const promptMatch = item.extractedText?.toLowerCase().includes(queryTerm) || item.prompt?.toLowerCase().includes(queryTerm);
      const subjectMatch = item.subject?.toLowerCase().includes(queryTerm);
      const topicMatch = item.topic?.toLowerCase().includes(queryTerm);
      return fileNameMatch || promptMatch || subjectMatch || topicMatch;
    });
  }, [imageStudioResources, gallerySearch]);

  useEffect(() => {
    if (!profile?.uid || !isToolbarImageModalOpen) return;

    setIsLoadingStudioResources(true);
    const q = query(
      collection(db, 'uploadedResources'),
      where('userId', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            data.storagePath === 'image-studio-generations' ||
            (data.fileType && data.fileType.startsWith('image/'))
          ) {
            list.push({
              id: docSnap.id,
              ...data
            });
          }
        });
        list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        setImageStudioResources(list);
        setIsLoadingStudioResources(false);
      },
      (err) => {
        console.error("Error reading Image Studio resources:", err);
        setIsLoadingStudioResources(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.uid, isToolbarImageModalOpen]);

  // Scroll Speed & Direction Reversals Passive Tracking
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const lastScrollDir = useRef<'down' | 'up' | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      const currentY = window.scrollY || window.document.documentElement.scrollTop;
      const deltaY = currentY - lastScrollY.current;
      const deltaTime = Math.max((now - lastScrollTime.current) / 1000, 0.05);

      const windowHeight = window.innerHeight;
      const docHeight = Math.max(
        window.document.documentElement.scrollHeight,
        window.document.body.scrollHeight,
        window.document.documentElement.offsetHeight
      );
      const maxScroll = docHeight - windowHeight;
      const progress = maxScroll > 0 ? Math.min(100, Math.max(0, (currentY / maxScroll) * 100)) : 0;
      setReadingProgress(Math.round(progress));
      setShowBackToTop(currentY > 300);

      if (Math.abs(deltaY) > 5) {
        const currentDir = deltaY > 0 ? 'down' : 'up';
        if (lastScrollDir.current && lastScrollDir.current !== currentDir) {
          setScrollReversals(prev => prev + 1);
        }
        lastScrollDir.current = currentDir;

        const rawSpeed = Math.abs(deltaY) / deltaTime;
        setScrollSpeed(prev => Math.round(0.65 * rawSpeed + 0.35 * prev));
        setSectionPauseDuration(0); // Reset pause duration on active scroll
      }

      lastScrollY.current = currentY;
      lastScrollTime.current = now;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // 1-Second Passive Analytics Loop: Dwell Time & Stationary Pause Counter
  useEffect(() => {
    const timer = setInterval(() => {
      setDocumentDwellTime(prev => prev + 1);

      const timeSinceScroll = (Date.now() - lastScrollTime.current) / 1000;
      if (timeSinceScroll >= 1) {
        setSectionPauseDuration(prev => prev + 1);
        setScrollSpeed(prev => Math.max(0, Math.round(prev * 0.6))); // Smooth decay when stopped
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [document.id]);

  // Listen to Socratic interaction events
  useEffect(() => {
    const handleSocraticInteraction = () => {
      setSocraticInteractionsCount(prev => prev + 1);
    };
    window.addEventListener('socratic-interaction', handleSocraticInteraction);
    return () => {
      window.removeEventListener('socratic-interaction', handleSocraticInteraction);
    };
  }, []);

  // Real-Time Passive Behavioral Inference & Proactive Alert Triggers
  useEffect(() => {
    // Mastery / Breezing Through:
    // High scroll velocity (>100 px/s) OR (Dwell >= 10s with 0 Socratic queries AND pause < 6s)
    const isBreezing = scrollSpeed > 100 || (documentDwellTime >= 10 && socraticInteractionsCount === 0 && sectionPauseDuration < 6 && scrollReversals <= 1);

    // Frustration / Struggling:
    // Long stationary pause (>= 18s) OR high scroll reversals (>= 4) OR high query frequency (>= 3)
    const isStruggling = sectionPauseDuration >= 18 || scrollReversals >= 4 || (socraticInteractionsCount >= 3 && documentDwellTime < 60);

    if (isStruggling) {
      setInferredLearningState('struggling');
      if (!hasTriggeredProactiveFrustration && !showFrustrationOffer) {
        setHasTriggeredProactiveFrustration(true);
        setShowFrustrationOffer(true);
      }
    } else if (isBreezing) {
      setInferredLearningState('breezing');
      if (!hasTriggeredProactiveChallenge && !showChallengeOffer) {
        setHasTriggeredProactiveChallenge(true);
        setShowChallengeOffer(true);
      }
    } else if (scrollSpeed > 0 || sectionPauseDuration < 15) {
      setInferredLearningState('focused');
    } else {
      setInferredLearningState('idle');
    }
  }, [
    scrollSpeed,
    sectionPauseDuration,
    scrollReversals,
    socraticInteractionsCount,
    documentDwellTime,
    hasTriggeredProactiveChallenge,
    hasTriggeredProactiveFrustration,
    showChallengeOffer,
    showFrustrationOffer
  ]);

  const handleFetchMasteryChallenge = async () => {
    setIsLoadingActiveChallenge(true);
    setActiveChallenge(null);
    setSelectedChallengeOption(null);
    setShowChallengeExplanation(false);
    setHasCorrectlyAnsweredChallenge(null);

    try {
      const response = await fetch('/api/behavioral-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editedContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate conceptual challenge.');
      }

      const data = await response.json();
      if (data && data.question) {
        setActiveChallenge(data);
      } else {
        throw new Error('No question returned by the conceptual Socratic engine.');
      }
    } catch (err: any) {
      console.error('Mastery challenge error:', err);
    } finally {
      setIsLoadingActiveChallenge(false);
    }
  };

  const handleFetchConceptSimplification = async () => {
    setIsSimplifyingConcept(true);
    setSimplifiedConceptData(null);
    try {
      const response = await fetch('/api/behavioral-simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editedContent }),
      });
      if (!response.ok) throw new Error('Failed to simplify content');
      const data = await response.json();
      setSimplifiedConceptData(data);

      if (data.helpfulSocraticTip) {
        setSocraticMessages(prev => [
          ...prev,
          { role: 'model', text: `💡 Socratic Concept Simplification:\n${data.helpfulSocraticTip}\n\nKey Breakdown:\n${data.simplifiedText}` }
        ]);
        setIsSocraticSidebarOpen(true);
      }
    } catch (err) {
      console.error('Behavioral simplification error:', err);
    } finally {
      setIsSimplifyingConcept(false);
    }
  };

  const [isHandwrittenTheme, setIsHandwrittenTheme] = useState(() => {
    const saved = localStorage.getItem('pedagogical_paper_style');
    if (saved) {
      return saved === 'classic';
    }
    return document.docType === 'lesson-notes' || document.docType === 'lesson-notes-classic' || document.docType === 'worksheet';
  });

  const [documentFontSize, setDocumentFontSize] = useState(() => {
    const saved = localStorage.getItem('document_font_size');
    return saved ? parseFloat(saved) : 1.0;
  });

  const [documentAlignment, setDocumentAlignment] = useState<'left' | 'center' | 'justify'>(() => {
    const saved = localStorage.getItem('document_alignment');
    return (saved as 'left' | 'center' | 'justify') || 'justify';
  });

  const [documentIsBold, setDocumentIsBold] = useState<boolean>(() => {
    return localStorage.getItem('document_bold') === 'true';
  });

  const [documentIsItalic, setDocumentIsItalic] = useState<boolean>(() => {
    return localStorage.getItem('document_italic') === 'true';
  });

  const [documentListStyle, setDocumentListStyle] = useState<'default' | 'disc' | 'decimal'>(() => {
    const saved = localStorage.getItem('document_list_style');
    return (saved as 'default' | 'disc' | 'decimal') || 'default';
  });

  const [documentFontFamily, setDocumentFontFamily] = useState<'font-sans' | 'font-serif' | 'font-mono' | 'font-cursive'>(() => {
    const saved = localStorage.getItem('document_font_family');
    return (saved as 'font-sans' | 'font-serif' | 'font-mono' | 'font-cursive') || 'font-sans';
  });

  const [documentPedagogicalMode, setDocumentPedagogicalMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('document_pedagogical_mode');
    return saved === null ? true : saved === 'true';
  });

  const [selectedDifferentiatedView, setSelectedDifferentiatedView] = useState<'core' | 'advanced' | 'support' | 'detailed'>('core');
  const [editedAdvancedContent, setEditedAdvancedContent] = useState(document.differentiatedAdvanced || '');
  const [editedSupportContent, setEditedSupportContent] = useState(document.differentiatedSupport || '');
  const [editedDetailedContent, setEditedDetailedContent] = useState(document.differentiatedDetailed || '');
  const [isGeneratingDifferentiated, setIsGeneratingDifferentiated] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);

  // Real-time reactive word count, character count, and reading time computation
  const liveWordCount = useMemo(() => {
    let contentToCount = editedContent;
    if (!isEditing) {
      if (selectedDifferentiatedView === 'advanced' && editedAdvancedContent) {
        contentToCount = editedAdvancedContent;
      } else if (selectedDifferentiatedView === 'support' && editedSupportContent) {
        contentToCount = editedSupportContent;
      } else if (selectedDifferentiatedView === 'detailed' && editedDetailedContent) {
        contentToCount = editedDetailedContent;
      } else {
        contentToCount = document.content || '';
      }
    }
    if (!contentToCount || !contentToCount.trim()) return 0;
    return contentToCount.trim().split(/\s+/).filter(Boolean).length;
  }, [isEditing, editedContent, selectedDifferentiatedView, editedAdvancedContent, editedSupportContent, editedDetailedContent, document.content]);

  const liveCharCount = useMemo(() => {
    let contentToCount = editedContent;
    if (!isEditing) {
      if (selectedDifferentiatedView === 'advanced' && editedAdvancedContent) {
        contentToCount = editedAdvancedContent;
      } else if (selectedDifferentiatedView === 'support' && editedSupportContent) {
        contentToCount = editedSupportContent;
      } else if (selectedDifferentiatedView === 'detailed' && editedDetailedContent) {
        contentToCount = editedDetailedContent;
      } else {
        contentToCount = document.content || '';
      }
    }
    return contentToCount ? contentToCount.length : 0;
  }, [isEditing, editedContent, selectedDifferentiatedView, editedAdvancedContent, editedSupportContent, editedDetailedContent, document.content]);

  const liveReadingTimeMin = useMemo(() => {
    return Math.max(1, Math.ceil(liveWordCount / 200));
  }, [liveWordCount]);
  const [isStandardsMapperOpen, setIsStandardsMapperOpen] = useState(false);
  const [isKenyanCheckerOpen, setIsKenyanCheckerOpen] = useState(false);
  const [isCurriculumValidatorOpen, setIsCurriculumValidatorOpen] = useState(false);
  const [isAIReviewerOpen, setIsAIReviewerOpen] = useState(false);
  const [isAutoAligningDirect, setIsAutoAligningDirect] = useState(false);
  const [autoAlignStep, setAutoAlignStep] = useState<string>('');

  // Listen for global save keyboard shortcut (Ctrl+S)
  useEffect(() => {
    const handleGlobalSave = (e: Event) => {
      if (isEditing && !isStudent) {
        handleSave();
      }
    };
    window.addEventListener('app-save', handleGlobalSave);
    return () => {
      window.removeEventListener('app-save', handleGlobalSave);
    };
  }, [
    isEditing,
    isStudent,
    editedContent,
    editedAdvancedContent,
    editedSupportContent,
    editedDetailedContent,
    editedTitle,
    selectedDifferentiatedView,
    document
  ]);

  // Formatting state history for Undo/Redo
  interface FormatState {
    fontSize: number;
    alignment: 'left' | 'center' | 'justify';
    bold: boolean;
    italic: boolean;
    listStyle: 'default' | 'disc' | 'decimal';
    fontFamily: 'font-sans' | 'font-serif' | 'font-mono' | 'font-cursive';
    pedagogicalMode: boolean;
  }

  const [formatHistory, setFormatHistory] = useState<FormatState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize history index on mount
  useEffect(() => {
    const initialSize = parseFloat(localStorage.getItem('document_font_size') || '1.0');
    const initialAlign = (localStorage.getItem('document_alignment') as 'left' | 'center' | 'justify') || 'justify';
    const initialBold = localStorage.getItem('document_bold') === 'true';
    const initialItalic = localStorage.getItem('document_italic') === 'true';
    const initialList = (localStorage.getItem('document_list_style') as 'default' | 'disc' | 'decimal') || 'default';
    const initialFontFamily = (localStorage.getItem('document_font_family') as 'font-sans' | 'font-serif' | 'font-mono' | 'font-cursive') || 'font-sans';
    const savedPedMode = localStorage.getItem('document_pedagogical_mode');
    const initialPedMode = savedPedMode === null ? true : savedPedMode === 'true';

    const initial: FormatState = {
      fontSize: initialSize,
      alignment: initialAlign,
      bold: initialBold,
      italic: initialItalic,
      listStyle: initialList,
      fontFamily: initialFontFamily,
      pedagogicalMode: initialPedMode
    };
    setFormatHistory([initial]);
    setHistoryIndex(0);
  }, []);

  const pushFormatChange = (updatedFields: Partial<FormatState>) => {
    if (historyIndex === -1) return;
    
    const currentState = formatHistory[historyIndex];
    const newState = { ...currentState, ...updatedFields };
    
    // Remove forward history if we were in undo state
    const newHistory = formatHistory.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    setFormatHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Set individual states & local storage
    if (updatedFields.fontSize !== undefined) {
      setDocumentFontSize(updatedFields.fontSize);
      localStorage.setItem('document_font_size', updatedFields.fontSize.toString());
    }
    if (updatedFields.alignment !== undefined) {
      setDocumentAlignment(updatedFields.alignment);
      localStorage.setItem('document_alignment', updatedFields.alignment);
    }
    if (updatedFields.bold !== undefined) {
      setDocumentIsBold(updatedFields.bold);
      localStorage.setItem('document_bold', updatedFields.bold ? 'true' : 'false');
    }
    if (updatedFields.italic !== undefined) {
      setDocumentIsItalic(updatedFields.italic);
      localStorage.setItem('document_italic', updatedFields.italic ? 'true' : 'false');
    }
    if (updatedFields.listStyle !== undefined) {
      setDocumentListStyle(updatedFields.listStyle);
      localStorage.setItem('document_list_style', updatedFields.listStyle);
    }
    if (updatedFields.fontFamily !== undefined) {
      setDocumentFontFamily(updatedFields.fontFamily);
      localStorage.setItem('document_font_family', updatedFields.fontFamily);
    }
    if (updatedFields.pedagogicalMode !== undefined) {
      setDocumentPedagogicalMode(updatedFields.pedagogicalMode);
      localStorage.setItem('document_pedagogical_mode', updatedFields.pedagogicalMode ? 'true' : 'false');
    }
  };

  const handleFormatUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = formatHistory[prevIndex];
      
      setHistoryIndex(prevIndex);
      
      setDocumentFontSize(prevState.fontSize);
      setDocumentAlignment(prevState.alignment);
      setDocumentIsBold(prevState.bold);
      setDocumentIsItalic(prevState.italic);
      setDocumentListStyle(prevState.listStyle);
      setDocumentFontFamily(prevState.fontFamily);
      setDocumentPedagogicalMode(prevState.pedagogicalMode);
      
      localStorage.setItem('document_font_size', prevState.fontSize.toString());
      localStorage.setItem('document_alignment', prevState.alignment);
      localStorage.setItem('document_bold', prevState.bold ? 'true' : 'false');
      localStorage.setItem('document_italic', prevState.italic ? 'true' : 'false');
      localStorage.setItem('document_list_style', prevState.listStyle);
      localStorage.setItem('document_font_family', prevState.fontFamily);
      localStorage.setItem('document_pedagogical_mode', prevState.pedagogicalMode ? 'true' : 'false');
    }
  };

  const handleFormatRedo = () => {
    if (historyIndex < formatHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = formatHistory[nextIndex];
      
      setHistoryIndex(nextIndex);
      
      setDocumentFontSize(nextState.fontSize);
      setDocumentAlignment(nextState.alignment);
      setDocumentIsBold(nextState.bold);
      setDocumentIsItalic(nextState.italic);
      setDocumentListStyle(nextState.listStyle);
      setDocumentFontFamily(nextState.fontFamily);
      setDocumentPedagogicalMode(nextState.pedagogicalMode);
      
      localStorage.setItem('document_font_size', nextState.fontSize.toString());
      localStorage.setItem('document_alignment', nextState.alignment);
      localStorage.setItem('document_bold', nextState.bold ? 'true' : 'false');
      localStorage.setItem('document_italic', nextState.italic ? 'true' : 'false');
      localStorage.setItem('document_list_style', nextState.listStyle);
      localStorage.setItem('document_font_family', nextState.fontFamily);
      localStorage.setItem('document_pedagogical_mode', nextState.pedagogicalMode ? 'true' : 'false');
    }
  };

  const handleClearFormatting = () => {
    pushFormatChange({
      fontSize: 1.0,
      alignment: 'justify',
      bold: false,
      italic: false,
      listStyle: 'default',
      fontFamily: 'font-sans',
      pedagogicalMode: true
    });
  };

  // Keyboard shortcut effect for text size adjustment (Alt + / Alt - or Alt 0)
  useEffect(() => {
    const handleZoomKeyDown = (e: KeyboardEvent) => {
      const isAltPressed = e.altKey;
      const isCtrlPressed = e.ctrlKey;
      
      if (isAltPressed || (isCtrlPressed && isAltPressed)) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          const nextSize = Math.min(3.0, Math.round((documentFontSize + 0.1) * 10) / 10);
          pushFormatChange({ fontSize: nextSize });
        } else if (e.key === '-') {
          e.preventDefault();
          const nextSize = Math.max(0.5, Math.round((documentFontSize - 0.1) * 10) / 10);
          pushFormatChange({ fontSize: nextSize });
        } else if (e.key === '0') {
          e.preventDefault();
          pushFormatChange({ fontSize: 1.0 });
        }
      }
    };

    window.addEventListener('keydown', handleZoomKeyDown);
    return () => {
      window.removeEventListener('keydown', handleZoomKeyDown);
    };
  }, [documentFontSize]);

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const shareableUrl = sharingPermission === 'view'
    ? `${window.location.origin}${window.location.pathname}#docId=${document.id}&mode=view`
    : `${window.location.origin}${window.location.pathname}#docId=${document.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(shareableUrl)}&color=${qrColor}&ecc=M`;

  const handleCopyQRLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setQrCopied(true);
    setTimeout(() => setQrCopied(false), 2000);
  };

  const handleDownloadQRPng = () => {
    if (qrCanvasRef.current) {
      const url = qrCanvasRef.current.toDataURL('image/png');
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `QR-${(document.title || 'Lesson').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      a.click();
    } else {
      window.open(qrImageUrl, '_blank');
    }
  };

  const handlePrintQRFlyer = () => {
    const qrDataUrl = qrCanvasRef.current ? qrCanvasRef.current.toDataURL('image/png') : qrImageUrl;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Classroom QR Poster - ${document.title}</title>
            <style>
              body {
                font-family: 'Inter', system-ui, sans-serif;
                text-align: center;
                padding: 40px;
                color: #1e293b;
                background-color: #ffffff;
              }
              .poster {
                border: 3px dashed #${qrColor};
                border-radius: 24px;
                padding: 45px;
                max-width: 600px;
                margin: 0 auto;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              }
              .header-tag {
                display: inline-block;
                color: #${qrColor};
                padding: 6px 16px;
                border-radius: 9999px;
                font-size: 14px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 20px;
              }
              h1 {
                font-size: 32px;
                margin: 0 0 8px 0;
                font-weight: 800;
                color: #0f172a;
                line-height: 1.2;
              }
              .subtitle {
                font-size: 16px;
                color: #64748b;
                margin: 0 0 32px 0;
                font-weight: 500;
              }
              .qr-container {
                display: inline-block;
                padding: 24px;
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                margin-bottom: 32px;
              }
              .qr-image {
                width: 250px;
                height: 250px;
                display: block;
              }
              .instructions {
                font-size: 18px;
                font-weight: 600;
                color: #0f172a;
                margin-bottom: 8px;
              }
              .sub-instructions {
                font-size: 14px;
                color: #64748b;
                max-width: 450px;
                margin: 0 auto 32px auto;
                line-height: 1.5;
              }
              .meta-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                border-top: 1px solid #e2e8f0;
                padding-top: 24px;
                text-align: left;
              }
              .meta-item {
                display: flex;
                flex-direction: column;
              }
              .meta-label {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #94a3b8;
                font-weight: 700;
              }
              .meta-val {
                font-size: 13px;
                color: #334155;
                font-weight: 600;
                margin-top: 2px;
              }
              .footer-line {
                font-size: 11px;
                color: #94a3b8;
                margin-top: 40px;
                font-weight: 500;
              }
              @media print {
                body {
                  padding: 0;
                }
                .poster {
                  box-shadow: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="poster">
              <span class="header-tag" style="background-color: #${qrColor}15;">✨ CLASSROOM DIGITAL ACCESS</span>
              <h1>${document.title}</h1>
              <p class="subtitle">Scan to View Materials Instantly</p>
              
              <div class="qr-container">
                <img class="qr-image" src="${qrDataUrl}" alt="Classroom QR Code" />
              </div>
              
              <p class="instructions">📱 SCAN WITH YOUR CAMERA</p>
              <p class="sub-instructions">Open your phone, tablet, or school Chromebook camera and scan this code to view the interactive lesson notes instantly!</p>
              
              <div class="meta-grid">
                <div class="meta-item">
                  <span class="meta-label">Curriculum</span>
                  <span class="meta-val">${document.curriculum || 'Standard'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Class Level</span>
                  <span class="meta-val">${document.classLevel || 'General'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Subject</span>
                  <span class="meta-val">${document.subject || 'General'}</span>
                </div>
              </div>
            </div>
            <p class="footer-line">Printed via Teacher-Student Pedagogical Suite</p>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const [targetLanguage, setTargetLanguage] = useState<string>('en');
  const [translations, setTranslations] = useState<Record<string, { title: string; content: string }>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const handleTranslate = async (langCode: string, langName: string) => {
    if (langCode === 'en') {
      setTargetLanguage('en');
      setTranslationError(null);
      return;
    }

    if (!isEditing && translations[langCode]) {
      setTargetLanguage(langCode);
      setTranslationError(null);
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          targetLanguage: langName,
        }),
      });

      const data = await handleResponseJson(response, `Failed to translate to ${langName}.`);
      if (data.translation) {
        if (isEditing) {
          // If actively editing, directly overwrite the editor content with the translated version so they can save/activate it
          setEditedTitle(data.translation.translatedTitle);
          setEditedContent(data.translation.translatedContent);
          // Set targetLanguage back to original English view state so they see the updated editor contents
          setTargetLanguage('en');
        } else {
          // If in preview mode, save the translation in cache
          setTranslations((prev) => ({
            ...prev,
            [langCode]: {
              title: data.translation.translatedTitle,
              content: data.translation.translatedContent,
            },
          }));
          setTargetLanguage(langCode);
        }
      } else {
        throw new Error('No translation was returned.');
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      setTranslationError(err.message || 'An error occurred during translation.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryError(null);
    setSummaryText('');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          docType: document.docType,
        }),
      });

      const data = await handleResponseJson(response, 'Failed to generate AI executive summary.');
      if (data.summary) {
        setSummaryText(data.summary);
      } else {
        throw new Error('No executive summary was returned by the model.');
      }
    } catch (err: any) {
      console.error('Summary generation error:', err);
      setSummaryError(err.message || 'An error occurred during summary generation.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summaryText);
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 2000);
  };

  const handleSendSocraticSidebarMessage = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : socraticInput.trim();
    if (!textToSend) return;

    if (customText === undefined) {
      setSocraticInput('');
    }

    const queueItemId = `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Dispatch the custom interaction event!
    window.dispatchEvent(new CustomEvent('socratic-interaction'));

    // Check offline status first: queue if offline
    if (!navigator.onLine || !isOnline) {
      const newQueueItem = {
        id: queueItemId,
        message: textToSend,
        history: socraticMessages.map(m => ({ role: m.role, text: m.text })),
        timestamp: Date.now()
      };

      setOfflineSocraticQueue(prev => [...prev, newQueueItem]);

      // Append user message tagged as offline queued, and a pending model message placeholder
      setSocraticMessages(prev => [
        ...prev,
        { role: 'user' as const, text: textToSend, isQueuedOffline: true, queueId: queueItemId },
        {
          role: 'model' as const,
          text: "⏳ You are currently offline. Question queued! Socratic Tutor will automatically fetch your response the moment your device reconnects to a network.",
          isOfflinePending: true,
          queueId: queueItemId
        }
      ]);

      setSyncNotificationToast({
        show: true,
        count: 1,
        text: "📥 Offline Mode: Question queued! Socratic Tutor will auto-fetch as soon as network reconnects."
      });
      setTimeout(() => setSyncNotificationToast(null), 4000);
      return;
    }

    // Append user message for online flow
    const updatedMessages = [
      ...socraticMessages,
      { role: 'user' as const, text: textToSend }
    ];
    setSocraticMessages(updatedMessages);
    setIsSocraticLoading(true);

    try {
      const response = await fetch('/api/tutor-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          history: socraticMessages,
          subject: document.subject || 'General Education',
          topic: document.topic || 'Lesson Concept',
          scaffoldingLevel: 'medium',
          documentContext: editedContent,
          persona: 'Socratic Questioner',
        }),
      });

      const data = await handleResponseJson(response, 'Failed to get response from Socratic AI.');
      const tutorReply = data.message || "I'm processing our next scaffolding step. Could you explain your thinking more?";

      setSocraticMessages(prev => [
        ...prev,
        { role: 'model' as const, text: tutorReply }
      ]);
    } catch (err: any) {
      console.error('Socratic sidebar chat error:', err);
      // Fallback to offline queue if network fetch fails
      const isNetworkError = !navigator.onLine || err.message?.includes('fetch') || err.name === 'TypeError';
      if (isNetworkError) {
        setIsOnline(false);
        const newQueueItem = {
          id: queueItemId,
          message: textToSend,
          history: socraticMessages.map(m => ({ role: m.role, text: m.text })),
          timestamp: Date.now()
        };
        setOfflineSocraticQueue(prev => [...prev, newQueueItem]);
        setSocraticMessages(prev => [
          ...prev,
          {
            role: 'model' as const,
            text: "⏳ Network connection interrupted. Question queued! Socratic Tutor will auto-fetch your response once connection returns.",
            isOfflinePending: true,
            queueId: queueItemId
          }
        ]);
        setSyncNotificationToast({
          show: true,
          count: 1,
          text: "📥 Network Interrupted: Question queued! Will auto-sync on reconnect."
        });
        setTimeout(() => setSyncNotificationToast(null), 4000);
      } else {
        setSocraticMessages(prev => [
          ...prev,
          { role: 'model' as const, text: "I encountered an issue connecting to the Socratic network. Let's try again!" }
        ]);
      }
    } finally {
      setIsSocraticLoading(false);
    }
  };

  const handleGenerateReadabilitySuggestions = async (action: 'simplify' | 'elevate') => {
    setIsGeneratingReadabilitySuggestions(true);
    setReadabilitySuggestionsError(null);
    setReadabilitySuggestions(null);
    setReadabilityTargetAction(action);

    try {
      const response = await fetch('/api/readability-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editedContent,
          targetAction: action,
        }),
      });

      const data = await handleResponseJson(response, `Failed to generate suggestions to ${action} text.`);
      if (data.suggestions) {
        setReadabilitySuggestions(data);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('No suggestions returned by the analyzer.');
      }
    } catch (err: any) {
      console.error('Readability suggestions error:', err);
      setReadabilitySuggestionsError(err.message || 'An error occurred while generating suggestions.');
    } finally {
      setIsGeneratingReadabilitySuggestions(false);
    }
  };

  const handleApplyRewrite = (original: string, modified: string) => {
    if (!original || !modified) return;
    const index = editedContent.indexOf(original);
    if (index !== -1) {
      setEditedContent(editedContent.replace(original, modified));
      setAppliedRewrites(prev => [...prev, original]);
    } else {
      // Try with trimmed loose match if exact match fails
      const cleanOriginal = original.trim();
      if (editedContent.includes(cleanOriginal)) {
        setEditedContent(editedContent.replace(cleanOriginal, modified.trim()));
        setAppliedRewrites(prev => [...prev, original]);
      }
    }
  };

  const handleRevertRewrite = (original: string, modified: string) => {
    if (!original || !modified) return;
    const cleanModified = modified.trim();
    if (editedContent.includes(cleanModified)) {
      setEditedContent(editedContent.replace(cleanModified, original.trim()));
      setAppliedRewrites(prev => prev.filter(x => x !== original));
    }
  };

  const handleGenerateStudyGuide = async () => {
    if (isStudent) return;
    setIsGeneratingStudyGuide(true);
    setStudyGuideErrorMessage(null);
    setStudyGuideSuccessMessage(null);

    try {
      const response = await fetch('/api/generate-study-guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          docType: document.docType,
          subject: document.subject,
          topic: document.topic,
          classLevel: document.classLevel,
        }),
      });

      const data = await handleResponseJson(response, 'Failed to generate study guide.');
      if (data && data.content) {
        // Create SavedDocument
        const newDocId = `doc-study-guide-${Date.now()}`;
        const finalDoc: SavedDocument = {
          id: newDocId,
          title: data.title || `Study Guide: ${document.topic || 'Curriculum Material'}`,
          docType: 'lesson-notes', // Study guide fits lesson-notes perfectly
          curriculum: document.curriculum,
          subject: document.subject,
          classLevel: document.classLevel,
          topic: document.topic,
          subTopic: document.subTopic,
          duration: document.duration || '30 mins',
          content: data.content,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          tags: ['Study Guide', 'Student Distribution'],
          category: document.category || 'Study Guides',
          lastModifiedByUid: profile?.uid || 'system',
          lastModifiedByName: profile?.displayName || profile?.email || 'Anonymous Teacher',
          explainLikeMasterTeacher: true,
        };

        // Save to Firestore 'documents' with image chunking support
        const savedDocWithChunks = await saveDocumentWithImageChunks(finalDoc.id, finalDoc);

        // Create an initial version in the versions collection
        const initialVersionId = `v-1-${Date.now()}`;
        const initialVersion = {
          id: initialVersionId,
          docId: savedDocWithChunks.id,
          title: savedDocWithChunks.title,
          content: savedDocWithChunks.content,
          lastModified: finalDoc.createdAt,
          modifiedByUid: profile?.uid || 'system',
          modifiedByName: profile?.displayName || 'AI Generator',
          modifiedByEmail: profile?.email || '',
          versionNumber: 1
        };
        await setDoc(doc(db, 'documents', finalDoc.id, 'versions', initialVersionId), cleanUndefined(compressObject(initialVersion)));

        // Show success
        setStudyGuideSuccessMessage(`Condensed Study Guide successfully saved as draft to library: "${finalDoc.title}"`);
        setTimeout(() => {
          setStudyGuideSuccessMessage(null);
        }, 5000);
      } else {
        throw new Error('No study guide content was returned by the model.');
      }
    } catch (err: any) {
      console.error('Study Guide generation error:', err);
      setStudyGuideErrorMessage(err.message || 'An error occurred during study guide generation.');
      setTimeout(() => {
        setStudyGuideErrorMessage(null);
      }, 5000);
    } finally {
      setIsGeneratingStudyGuide(false);
    }
  };

  const displayTitle = useMemo(() => {
    return targetLanguage === 'en' ? editedTitle : (translations[targetLanguage]?.title || editedTitle);
  }, [targetLanguage, editedTitle, translations]);

  const baseContent = useMemo(() => {
    return selectedDifferentiatedView === 'advanced' ? editedAdvancedContent :
      selectedDifferentiatedView === 'support' ? editedSupportContent :
      selectedDifferentiatedView === 'detailed' ? editedDetailedContent :
      editedContent;
  }, [selectedDifferentiatedView, editedAdvancedContent, editedSupportContent, editedDetailedContent, editedContent]);

  const displayContent = useMemo(() => {
    return targetLanguage === 'en' ? baseContent : (translations[targetLanguage]?.content || baseContent);
  }, [targetLanguage, baseContent, translations]);

  const classicNotesImageUrl = useMemo(() => {
    if (document.docType === 'lesson-notes-classic' && displayContent) {
      const match = displayContent.match(/!\[.*?\]\((.*?)\)/);
      if (match) {
        return match[1];
      }
    }
    return null;
  }, [document.docType, displayContent]);

  const [dbImageUrl, setDbImageUrl] = useState<string | null>(null);
  const [loadingDbImage, setLoadingDbImage] = useState<boolean>(false);

  useEffect(() => {
    if (classicNotesImageUrl && classicNotesImageUrl.startsWith('db-image-ref:')) {
      const docId = classicNotesImageUrl.replace('db-image-ref:', '');
      setLoadingDbImage(true);
      
      const fetchImageChunks = async () => {
        try {
          const chunksColRef = collection(db, 'documents', docId, 'imageChunks');
          const snap = await getDocs(chunksColRef);
          
          if (!snap.empty) {
            const docChunks: { idx: number; data: string }[] = [];
            snap.forEach((chunkDoc) => {
              const data = chunkDoc.data();
              docChunks.push({ idx: data.idx, data: data.data });
            });
            
            docChunks.sort((a, b) => a.idx - b.idx);
            const fullBase64 = docChunks.map((c) => c.data).join('');
            setDbImageUrl(fullBase64);
          } else {
            console.error('[Image Chunking] No chunks found for docId:', docId);
            setDbImageUrl(null);
          }
        } catch (err) {
          console.error('[Image Chunking] Error fetching chunks:', err);
          setDbImageUrl(null);
        } finally {
          setLoadingDbImage(false);
        }
      };
      
      fetchImageChunks();
    } else {
      setDbImageUrl(classicNotesImageUrl);
      setLoadingDbImage(false);
    }
  }, [classicNotesImageUrl]);

  const transcribedDisplayContent = useMemo(() => {
    if (!displayContent) return '';
    if (document.docType === 'lesson-notes-classic') {
      return displayContent
        .replace(/!\[Lesson Notes:.*?\n\n\*(Transcribed notes for reference:)\*\n\n/i, '')
        .replace(/!\[Lesson Notes:.*?\]\(.*?\)/gi, '')
        .trim();
    }
    return displayContent;
  }, [displayContent, document.docType]);

  // States for Post-Lesson CPD Reflection
  const [isReflectionExpanded, setIsReflectionExpanded] = useState(true);
  const [reflectionWorked, setReflectionWorked] = useState(document.reflectionWorked || '');
  const [reflectionDidntWork, setReflectionDidntWork] = useState(document.reflectionDidntWork || '');
  const [reflectionAdjustments, setReflectionAdjustments] = useState(document.reflectionAdjustments || '');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // Comments & Collaborative Side-Notes states
  const [comments, setComments] = useState<InlineComment[]>([]);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isParentChatOpen, setIsParentChatOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [newSelectedText, setNewSelectedText] = useState('');
  const [activeHighlightedText, setActiveHighlightedText] = useState<string | null>(null);
  const [selectedCommentCategory, setSelectedCommentCategory] = useState<NonNullable<InlineComment['category']>>('Pedagogical Note');
  const [selectedCommentColor, setSelectedCommentColor] = useState<NonNullable<InlineComment['color']>>('yellow');
  const [commentSearchQuery, setCommentSearchQuery] = useState('');
  const [commentCategoryFilter, setCommentCategoryFilter] = useState<string>('All');
  const [showResolvedComments, setShowResolvedComments] = useState(false);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  // Floating selection tool states
  const [isAddingFloatingComment, setIsAddingFloatingComment] = useState(false);
  const [floatingCommentCategory, setFloatingCommentCategory] = useState<NonNullable<InlineComment['category']>>('Pedagogical Note');
  const [floatingCommentColor, setFloatingCommentColor] = useState<NonNullable<InlineComment['color']>>('yellow');
  const [floatingCommentNote, setFloatingCommentNote] = useState('');

  // Annotations Sidebar states
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(false);
  const [newAnnotationNote, setNewAnnotationNote] = useState('');
  const [newAnnotationSelectedText, setNewAnnotationSelectedText] = useState('');
  const [activeAnnotationHighlightedText, setActiveAnnotationHighlightedText] = useState<string | null>(null);

  // Floating sticky annotation tool states
  const [showStickyNotesOverlay, setShowStickyNotesOverlay] = useState(true);
  const [floatingToolPos, setFloatingToolPos] = useState<{ x: number; y: number } | null>(null);
  const [floatingSelectedText, setFloatingSelectedText] = useState('');
  const [isAddingFloatingAnnotation, setIsAddingFloatingAnnotation] = useState(false);
  const [floatingAnnotationColor, setFloatingAnnotationColor] = useState<'yellow' | 'green' | 'pink' | 'blue'>('yellow');
  const [floatingAnnotationNote, setFloatingAnnotationNote] = useState('');

  // Paragraph Quick Reactions states
  const [reactions, setReactions] = useState<ParagraphReaction[]>([]);
  const [isReactionsSidebarOpen, setIsReactionsSidebarOpen] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isMobileMetadataOpen, setIsMobileMetadataOpen] = useState(false);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => {
      const nextFocus = !prev;
      setIsRightSidebarCollapsed(nextFocus);
      if (nextFocus) {
        setIsCommentsOpen(false);
        setIsAnnotationsOpen(false);
        setIsReactionsSidebarOpen(false);
        setIsVersionsSidebarOpen(false);
        setIsParentChatOpen(false);
        setIsSocraticSidebarOpen(false);
      }
      return nextFocus;
    });
  }, []);

  // Lesson Pacing Timer/Countdown states
  const [timerDuration, setTimerDuration] = useState<number>(300); // default 5 minutes
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(300);
  const [timerIsActive, setTimerIsActive] = useState<boolean>(false);
  const [timerPhase, setTimerPhase] = useState<string>('Warm-Up');
  const [customPhaseName, setCustomPhaseName] = useState<string>('');
  const [timerIsSoundEnabled, setTimerIsSoundEnabled] = useState<boolean>(true);
  const [timerIsFloating, setTimerIsFloating] = useState<boolean>(false);
  const [timerIsFullScreen, setTimerIsFullScreen] = useState<boolean>(false);
  const [isTimerPanelCollapsed, setIsTimerPanelCollapsed] = useState<boolean>(false);
  const [showTimerAlertModal, setShowTimerAlertModal] = useState<boolean>(false);

  // Request browser notification permission helper
  const startPacingWithNotificationRequest = useCallback(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch((err) => console.log("Notification permission error:", err));
    }
    setTimerIsActive(true);
  }, []);

  // Countdown timer core engine
  useEffect(() => {
    let intervalId: any = null;
    if (timerIsActive && timerSecondsLeft > 0) {
      intervalId = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setTimerIsActive(false);
            
            // Trigger visual modal alert in-app
            setShowTimerAlertModal(true);

            // Trigger system browser Notification if permitted
            const phaseTitle = timerPhase === 'Custom' ? (customPhaseName || 'Custom Phase') : timerPhase;
            if ("Notification" in window) {
              if (Notification.permission === "granted") {
                try {
                  new Notification("Lesson Time's Up!", {
                    body: `The "${phaseTitle}" phase has finished! Keep up the great pacing!`,
                    tag: 'lesson-timer',
                    requireInteraction: true
                  });
                } catch (notiErr) {
                  console.error("System notification failed:", notiErr);
                }
              }
            }

            if (timerIsSoundEnabled) {
              try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                  const ctx = new AudioContextClass();
                  const playTone = (freq: number, start: number, duration: number) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0, start);
                    gain.gain.linearRampToValueAtTime(0.4, start + 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(start);
                    osc.stop(start + duration);
                  };
                  // A beautiful, uplifting 3-tone chime for completion
                  playTone(523.25, ctx.currentTime, 0.4);       // C5
                  playTone(659.25, ctx.currentTime + 0.15, 0.4);  // E5
                  playTone(783.99, ctx.currentTime + 0.3, 0.8);   // G5
                }
              } catch (err) {
                console.error("Audio playback failed or blocked by browser:", err);
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalId) clearInterval(intervalId);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerIsActive, timerIsSoundEnabled, timerSecondsLeft, timerPhase, customPhaseName]);

  // Version History states
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isVersionsSidebarOpen, setIsVersionsSidebarOpen] = useState(false);
  const [compareLeftVersion, setCompareLeftVersion] = useState<DocumentVersion | null>(null);
  const [compareRightVersion, setCompareRightVersion] = useState<DocumentVersion | null>(null);
  const [docVersions, setDocVersions] = useState<DocumentVersion[]>([]);
  const [isVersionsLoading, setIsVersionsLoading] = useState(false);
  const [modalPreviewVersion, setModalPreviewVersion] = useState<DocumentVersion | null>(null);
  const [versionToRestore, setVersionToRestore] = useState<DocumentVersion | null>(null);

  // Firestore snapshot listener for document versions - loaded always for comparison triggers
  useEffect(() => {
    if (!document.id) return;
    setIsVersionsLoading(true);
    const versionsCol = collection(db, 'documents', document.id, 'versions');
    const q = query(versionsCol, orderBy('versionNumber', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DocumentVersion[] = [];
      snapshot.forEach((snap) => {
        list.push(decompressObject({ id: snap.id, ...snap.data() }) as DocumentVersion);
      });
      setDocVersions(list);
      setIsVersionsLoading(false);
    }, (error) => {
      console.error("Error loading versions:", error);
      setIsVersionsLoading(false);
    });

    return unsubscribe;
  }, [document.id]);

  const createVersionInDb = async (vTitle: string, vContent: string, label?: string) => {
    if (!document.id) return;
    try {
      const versionsCol = collection(db, 'documents', document.id, 'versions');
      const q = query(versionsCol, orderBy('versionNumber', 'desc'));
      const snapshot = await getDocs(q);
      
      let maxVer = 0;
      let alreadyExists = false;
      snapshot.forEach((snap) => {
        const d = snap.data();
        if (d.versionNumber && d.versionNumber > maxVer) {
          maxVer = d.versionNumber;
        }
        if (d.content === vContent && d.title === vTitle) {
          alreadyExists = true;
        }
      });
      
      if (alreadyExists) {
        console.log("This exact content and title is already saved as a version.");
        return;
      }
      
      const nextVer = maxVer + 1;
      const vId = `v-${nextVer}-${Date.now()}`;
      
      const newVersion = {
        id: vId,
        docId: document.id,
        title: vTitle,
        content: vContent,
        lastModified: new Date().toISOString(),
        modifiedByUid: profile?.uid || 'system',
        modifiedByName: profile?.displayName || profile?.email || 'Anonymous Teacher',
        modifiedByEmail: profile?.email || '',
        versionNumber: nextVer,
        label: label || `Version ${nextVer}`
      };
      
      await setDoc(doc(db, 'documents', document.id, 'versions', vId), cleanUndefined(compressObject(newVersion)));
      console.log(`Saved new version: Version ${nextVer}`);
    } catch (err) {
      console.error('Error auto-creating document version:', err);
    }
  };

  // Firestore snapshot listener for inline comments
  useEffect(() => {
    if (!document.id) return;
    const commentsRef = collection(db, 'documents', document.id, 'comments');
    const q = query(commentsRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: InlineComment[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as InlineComment);
      });
      // Sort comments by creation date (descending)
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComments(list);
    }, (error) => {
      console.error("Error loading comments:", error);
      handleFirestoreError(error, OperationType.GET, `documents/${document.id}/comments`);
    });

    return () => unsubscribe();
  }, [document.id]);

  // Firestore snapshot listener for paragraph quick reactions
  useEffect(() => {
    if (!document.id) return;
    const reactionsRef = collection(db, 'documents', document.id, 'reactions');
    const q = query(reactionsRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ParagraphReaction[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ParagraphReaction);
      });
      // Sort reactions by creation date (descending)
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReactions(list);
    }, (error) => {
      console.error("Error loading reactions:", error);
      handleFirestoreError(error, OperationType.GET, `documents/${document.id}/reactions`);
    });

    return () => unsubscribe();
  }, [document.id]);

  // Firestore snapshot listener for annotations (private, only author can read them)
  useEffect(() => {
    if (!document.id || !profile?.uid || isStudent) {
      setAnnotations([]);
      return;
    }
    const annotationsRef = collection(db, 'documents', document.id, 'annotations');
    const q = query(annotationsRef, where('authorUid', '==', profile.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DocumentAnnotation[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as DocumentAnnotation);
      });
      // Sort annotations by creation date (descending)
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAnnotations(list);
    }, (error) => {
      console.error("Error loading annotations:", error);
      handleFirestoreError(error, OperationType.GET, `documents/${document.id}/annotations`);
    });

    return () => unsubscribe();
  }, [document.id, profile?.uid, isStudent]);

  const handleToggleReaction = async (paragraphText: string, emoji: string) => {
    if (!profile) return;
    try {
      // Look for an existing reaction by the current user with the same emoji on this paragraph
      const existing = reactions.find(
        (r) => r.paragraphText === paragraphText && r.emoji === emoji && r.userUid === profile.uid
      );

      if (existing) {
        // Delete reaction
        await deleteDoc(doc(db, 'documents', document.id, 'reactions', existing.id));
      } else {
        // Add reaction
        const reactionId = `react-${Date.now()}-${profile.uid}-${Math.random().toString(36).substr(2, 5)}`;
        const reactionDocRef = doc(db, 'documents', document.id, 'reactions', reactionId);

        const newReaction: ParagraphReaction = {
          id: reactionId,
          docId: document.id,
          paragraphText,
          emoji,
          userUid: profile.uid,
          userName: profile.displayName || profile.email || 'Anonymous Teacher',
          userEmail: profile.email || '',
          createdAt: new Date().toISOString()
        };

        await setDoc(reactionDocRef, cleanUndefined(newReaction));

        // Log this activity
        logActivity(
          'comment',
          `Reacted ${emoji} on a lesson paragraph in: "${document.title}"`,
          profile,
          document.id,
          document.title
        );
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  };

  // Sync active side-notes to document metadata in Firestore
  const syncCommentsToMetadata = async (docId: string, currentComments: InlineComment[]) => {
    if (!docId) return;
    try {
      const activeComments = currentComments.filter(c => !c.resolved);
      const sideNotesMeta = activeComments.slice(0, 10).map(c => ({
        id: c.id,
        selectedText: c.selectedText || '',
        comment: c.comment,
        authorName: c.authorName,
        createdAt: c.createdAt,
        category: c.category || 'General',
        color: c.color || 'yellow'
      }));

      const docRef = doc(db, 'documents', docId);
      await updateDoc(docRef, {
        commentsCount: currentComments.length,
        lastCommentAt: currentComments.length > 0 ? currentComments[0].createdAt : null,
        lastCommentBy: currentComments.length > 0 ? currentComments[0].authorName : null,
        sideNotesMetadata: sideNotesMeta
      });
    } catch (err: any) {
      console.error("Error syncing comments metadata to document:", err);
      handleFirestoreError(err, OperationType.UPDATE, `documents/${docId}`);
    }
  };

  const handleCaptureSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      const selectedStr = selection.toString().trim();
      if (selectedStr.length > 0) {
        setNewSelectedText(selectedStr);
        setIsCommentsOpen(true);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !document.id) return;
    if (!newCommentText.trim()) return;

    try {
      const commentId = `comment-${Date.now()}-${profile.uid}`;
      const commentDocRef = doc(db, 'documents', document.id, 'comments', commentId);
      
      const newComment: InlineComment = {
        id: commentId,
        docId: document.id,
        selectedText: newSelectedText.trim(),
        comment: newCommentText.trim(),
        authorUid: profile.uid,
        authorName: profile.displayName || profile.email || 'Anonymous Teacher',
        authorEmail: profile.email || '',
        createdAt: new Date().toISOString(),
        category: selectedCommentCategory,
        color: selectedCommentColor,
        resolved: false,
        replies: []
      };

      await setDoc(commentDocRef, cleanUndefined(newComment));
      
      const updatedComments = [newComment, ...comments];
      await syncCommentsToMetadata(document.id, updatedComments);

      setNewCommentText('');
      setNewSelectedText('');

      logActivity(
        'comment',
        `Added collaborative side-note to lesson: "${document.title}"`,
        profile,
        document.id,
        document.title
      );
    } catch (err: any) {
      console.error('Error saving comment:', err);
      handleFirestoreError(err, OperationType.WRITE, `documents/${document.id}/comments`);
    }
  };

  const handleAddFloatingComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !document.id) return;
    if (!floatingCommentNote.trim()) return;

    try {
      const commentId = `comment-${Date.now()}-${profile.uid}`;
      const commentDocRef = doc(db, 'documents', document.id, 'comments', commentId);
      
      const newComment: InlineComment = {
        id: commentId,
        docId: document.id,
        selectedText: floatingSelectedText.trim(),
        comment: floatingCommentNote.trim(),
        authorUid: profile.uid,
        authorName: profile.displayName || profile.email || 'Anonymous Teacher',
        authorEmail: profile.email || '',
        createdAt: new Date().toISOString(),
        category: floatingCommentCategory,
        color: floatingCommentColor,
        resolved: false,
        replies: []
      };

      await setDoc(commentDocRef, cleanUndefined(newComment));

      const updatedComments = [newComment, ...comments];
      await syncCommentsToMetadata(document.id, updatedComments);

      setFloatingCommentNote('');
      setFloatingSelectedText('');
      setFloatingToolPos(null);
      setIsAddingFloatingComment(false);
      setIsCommentsOpen(true);

      logActivity(
        'comment',
        `Added collaborative side-note on highlighted text: "${document.title}"`,
        profile,
        document.id,
        document.title
      );
    } catch (err: any) {
      console.error('Error saving floating comment:', err);
      handleFirestoreError(err, OperationType.WRITE, `documents/${document.id}/comments`);
    }
  };

  const handleToggleResolveComment = async (comment: InlineComment) => {
    if (!document.id) return;
    try {
      const commentDocRef = doc(db, 'documents', document.id, 'comments', comment.id);
      const newResolvedState = !comment.resolved;
      await updateDoc(commentDocRef, {
        resolved: newResolvedState
      });

      const updatedComments = comments.map(c => c.id === comment.id ? { ...c, resolved: newResolvedState } : c);
      await syncCommentsToMetadata(document.id, updatedComments);
    } catch (err: any) {
      console.error('Error toggling resolve comment:', err);
      handleFirestoreError(err, OperationType.UPDATE, `documents/${document.id}/comments/${comment.id}`);
    }
  };

  const handleAddReplyToComment = async (commentId: string) => {
    const replyText = replyTextMap[commentId];
    if (!profile || !document.id || !replyText || !replyText.trim()) return;
    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      const newReply: CommentReply = {
        id: `reply-${Date.now()}-${profile.uid}`,
        authorUid: profile.uid,
        authorName: profile.displayName || profile.email || 'Anonymous Teacher',
        authorEmail: profile.email || '',
        text: replyText.trim(),
        createdAt: new Date().toISOString()
      };

      const updatedReplies = [...(comment.replies || []), newReply];
      const commentDocRef = doc(db, 'documents', document.id, 'comments', commentId);
      await updateDoc(commentDocRef, {
        replies: updatedReplies
      });

      const updatedComments = comments.map(c => c.id === commentId ? { ...c, replies: updatedReplies } : c);
      await syncCommentsToMetadata(document.id, updatedComments);
      setReplyTextMap(prev => ({ ...prev, [commentId]: '' }));
      setActiveReplyCommentId(null);
    } catch (err: any) {
      console.error('Error adding reply to comment:', err);
      handleFirestoreError(err, OperationType.UPDATE, `documents/${document.id}/comments/${commentId}`);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!document.id) return;
    try {
      await deleteDoc(doc(db, 'documents', document.id, 'comments', commentId));
      const updatedComments = comments.filter(c => c.id !== commentId);
      await syncCommentsToMetadata(document.id, updatedComments);
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      handleFirestoreError(err, OperationType.DELETE, `documents/${document.id}/comments/${commentId}`);
    }
  };

  const handleCaptureAnnotationSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      const selectedStr = selection.toString().trim();
      if (selectedStr.length > 0) {
        setNewAnnotationSelectedText(selectedStr);
        setIsAnnotationsOpen(true);
      }
    }
  };

  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!newAnnotationNote.trim()) return;

    try {
      const annotationId = `ann-${Date.now()}-${profile.uid}`;
      const annotationDocRef = doc(db, 'documents', document.id, 'annotations', annotationId);
      
      const newAnnotation: DocumentAnnotation = {
        id: annotationId,
        docId: document.id,
        selectedText: newAnnotationSelectedText.trim(),
        note: newAnnotationNote.trim(),
        authorUid: profile.uid,
        authorName: profile.displayName || profile.email || 'Anonymous Teacher',
        authorEmail: profile.email || '',
        createdAt: new Date().toISOString()
      };

      await setDoc(annotationDocRef, cleanUndefined(newAnnotation));
      setNewAnnotationNote('');
      setNewAnnotationSelectedText('');
      
      logActivity(
        'comment',
        `Added private annotation/reminder to lesson: "${document.title}"`,
        profile,
        document.id,
        document.title
      );
    } catch (err: any) {
      console.error('Error saving annotation:', err);
      handleFirestoreError(err, OperationType.WRITE, `documents/${document.id}/annotations`);
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      await deleteDoc(doc(db, 'documents', document.id, 'annotations', annotationId));
    } catch (err) {
      console.error('Error deleting annotation:', err);
      handleFirestoreError(err, OperationType.DELETE, `documents/${document.id}/annotations/${annotationId}`);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length > 2 && selectedText.length < 500) {
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        const container = containerRef.current;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          // Position relative to container
          const x = rect.left - containerRect.left + (rect.width / 2);
          const y = rect.top - containerRect.top - 45; // slightly above selection
          
          setFloatingToolPos({ x, y });
          setFloatingSelectedText(selectedText);
        }
      } catch (err) {
        console.error("Error getting selection coordinates:", err);
      }
    } else {
      // If we are not currently typing/adding a floating annotation, hide the button
      if (!isAddingFloatingAnnotation) {
        setFloatingToolPos(null);
        setFloatingSelectedText('');
      }
    }
  };

  const handleAddFloatingAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!floatingAnnotationNote.trim()) return;

    try {
      const annotationId = `ann-${Date.now()}-${profile.uid}`;
      const annotationDocRef = doc(db, 'documents', document.id, 'annotations', annotationId);
      
      const newAnnotation: DocumentAnnotation = {
        id: annotationId,
        docId: document.id,
        selectedText: floatingSelectedText.trim(),
        note: floatingAnnotationNote.trim(),
        authorUid: profile.uid,
        authorName: profile.displayName || profile.email || 'Anonymous Teacher',
        authorEmail: profile.email || '',
        createdAt: new Date().toISOString(),
        color: floatingAnnotationColor
      };

      await setDoc(annotationDocRef, cleanUndefined(newAnnotation));
      
      // Clear floating states
      setFloatingAnnotationNote('');
      setFloatingSelectedText('');
      setFloatingToolPos(null);
      setIsAddingFloatingAnnotation(false);
      
      logActivity(
        'comment',
        `Added private sticky note annotation to lesson: "${document.title}"`,
        profile,
        document.id,
        document.title
      );
    } catch (err: any) {
      console.error('Error saving floating annotation:', err);
      handleFirestoreError(err, OperationType.WRITE, `documents/${document.id}/annotations`);
    }
  };

  // Update local viewer values if the document ID changed (new document opened) 
  // or if another user modified it in Firestore (collaborative editing)
  useEffect(() => {
    const isNewDoc = document.id !== prevDocIdRef.current;
    const isExternalUpdate = document.lastModifiedByUid && document.lastModifiedByUid !== profile?.uid;

    if (isNewDoc) {
      setEditedContent(document.content);
      setEditedTitle(document.title);
      setTargetLanguage('en');
      setTranslations({});
      setSelectedDifferentiatedView('core');
      setEditedAdvancedContent(document.differentiatedAdvanced || '');
      setEditedSupportContent(document.differentiatedSupport || '');
      setEditedDetailedContent(document.differentiatedDetailed || '');
    } else if (isExternalUpdate) {
      if (document.content !== editedContent) {
        setEditedContent(document.content);
      }
      if (document.title !== editedTitle) {
        setEditedTitle(document.title);
      }
      if (document.differentiatedAdvanced !== editedAdvancedContent) {
        setEditedAdvancedContent(document.differentiatedAdvanced || '');
      }
      if (document.differentiatedSupport !== editedSupportContent) {
        setEditedSupportContent(document.differentiatedSupport || '');
      }
      if (document.differentiatedDetailed !== editedDetailedContent) {
        setEditedDetailedContent(document.differentiatedDetailed || '');
      }
    }
  }, [
    document.id, 
    document.content, 
    document.title, 
    document.differentiatedAdvanced, 
    document.differentiatedSupport, 
    document.differentiatedDetailed,
    document.lastModifiedByUid, 
    profile?.uid
  ]);

  useEffect(() => {
    const isNewDoc = document.id !== prevDocIdRef.current;
    const isExternalUpdate = document.lastModifiedByUid && document.lastModifiedByUid !== profile?.uid;

    if (isNewDoc) {
      setReflectionWorked(document.reflectionWorked || '');
      setReflectionDidntWork(document.reflectionDidntWork || '');
      setReflectionAdjustments(document.reflectionAdjustments || '');
    } else if (isExternalUpdate) {
      if ((document.reflectionWorked || '') !== reflectionWorked) {
        setReflectionWorked(document.reflectionWorked || '');
      }
      if ((document.reflectionDidntWork || '') !== reflectionDidntWork) {
        setReflectionDidntWork(document.reflectionDidntWork || '');
      }
      if ((document.reflectionAdjustments || '') !== reflectionAdjustments) {
        setReflectionAdjustments(document.reflectionAdjustments || '');
      }
    }
    // Update the ref to the current document ID
    prevDocIdRef.current = document.id;
  }, [
    document.id, 
    document.reflectionWorked, 
    document.reflectionDidntWork, 
    document.reflectionAdjustments, 
    document.lastModifiedByUid, 
    profile?.uid
  ]);

  // Sync isHandwrittenTheme state with global theme change events
  useEffect(() => {
    const handleThemeChange = () => {
      const current = localStorage.getItem('pedagogical_paper_style');
      if (current) {
        setIsHandwrittenTheme(current === 'classic');
      }
    };
    window.addEventListener('paper_theme_changed', handleThemeChange);
    return () => window.removeEventListener('paper_theme_changed', handleThemeChange);
  }, []);

  // Debounced automatic save to Firestore for real-time collaborative editing
  useEffect(() => {
    if (isStudent || !isEditing || !document.id || !profile) return;

    // Avoid setting status on mount when no changes exist
    if (editedContent === document.content && editedTitle === document.title) {
      return;
    }

    setSyncStatus('syncing');

    const delayDebounceFn = setTimeout(async () => {
      try {
        const docRef = doc(db, 'documents', document.id);
        const updatedFields = {
          content: editedContent,
          title: editedTitle,
          lastModified: new Date().toISOString(),
          lastModifiedByUid: profile.uid,
          lastModifiedByName: profile.displayName || profile.email || 'Anonymous Teacher'
        };
        await setDoc(docRef, cleanUndefined(compressObject(updatedFields)), { merge: true });
        
        onUpdate({
          ...document,
          ...updatedFields
        });

        setSyncStatus('synced');
        setLastSavedSyncTime(new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.error('Failed to sync collaborative edits to Firestore:', err);
        setSyncStatus('error');
      }
    }, 1200); // 1.2s debounce for typing

    return () => clearTimeout(delayDebounceFn);
  }, [editedContent, editedTitle, isEditing, document.id, profile, isStudent]);

  // Debounced automatic save for pedagogical reflection inputs
  useEffect(() => {
    if (isStudent || !document.id || !profile) return;

    // Check if actually different before saving
    if (
      reflectionWorked === (document.reflectionWorked || '') &&
      reflectionDidntWork === (document.reflectionDidntWork || '') &&
      reflectionAdjustments === (document.reflectionAdjustments || '')
    ) {
      return;
    }

    setSyncStatus('syncing');

    const delayDebounceFn = setTimeout(async () => {
      try {
        const docRef = doc(db, 'documents', document.id);
        const updatedFields = {
          reflectionWorked,
          reflectionDidntWork,
          reflectionAdjustments,
          lastModified: new Date().toISOString(),
          lastModifiedByUid: profile.uid,
          lastModifiedByName: profile.displayName || profile.email || 'Anonymous Teacher'
        };
        await setDoc(docRef, cleanUndefined(compressObject(updatedFields)), { merge: true });

        onUpdate({
          ...document,
          ...updatedFields
        });

        setSyncStatus('synced');
        setLastSavedSyncTime(new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.error('Failed to sync pedagogical reflections to Firestore:', err);
        setSyncStatus('error');
      }
    }, 1500); // 1.5s debounce for reflection fields

    return () => clearTimeout(delayDebounceFn);
  }, [reflectionWorked, reflectionDidntWork, reflectionAdjustments, document.id, profile, isStudent, document.reflectionWorked, document.reflectionDidntWork, document.reflectionAdjustments]);

  // Google Workspace Integration states
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [workspaceSuccessMessage, setWorkspaceSuccessMessage] = useState<string | null>(null);
  const [workspaceErrorMessage, setWorkspaceErrorMessage] = useState<string | null>(null);

  // Modals for Google Workspace
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);

  // Study Guide states
  const [isGeneratingStudyGuide, setIsGeneratingStudyGuide] = useState(false);
  const [studyGuideSuccessMessage, setStudyGuideSuccessMessage] = useState<string | null>(null);
  const [studyGuideErrorMessage, setStudyGuideErrorMessage] = useState<string | null>(null);

  // Calendar event states
  const [calendarDate, setCalendarDate] = useState(document.scheduledDate || new Date().toISOString().split('T')[0]);
  const [calendarStartTime, setCalendarStartTime] = useState(document.scheduledTime || '09:00');
  const [calendarEndTime, setCalendarEndTime] = useState('10:00');
  const [calendarLocation, setCalendarLocation] = useState('Main Classroom');
  const [calendarReminder, setCalendarReminder] = useState(true);

  useEffect(() => {
    if (document.scheduledDate) {
      setCalendarDate(document.scheduledDate);
    }
  }, [document.scheduledDate]);

  useEffect(() => {
    if (document.scheduledTime) {
      setCalendarStartTime(document.scheduledTime);
    }
  }, [document.scheduledTime]);

  // Gmail email states
  const [gmailRecipient, setGmailRecipient] = useState('');
  const [gmailSubject, setGmailSubject] = useState(`Lesson Materials: ${document.topic}`);
  const [gmailCustomMsg, setGmailCustomMsg] = useState('Hi there, please find the attached curriculum-aligned lesson materials and outline.');

  // Collaborative cursor/presence tracking
  const lastCursorUpdateRef = useRef<number>(0);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  const updateCursorInFirestore = async (x: number | null, y: number | null) => {
    if (!profile || !document.id) return;
    const sessionDocId = `${profile.uid}_${document.id}`;
    const sessionRef = doc(db, 'active-sessions', sessionDocId);
    try {
      await setDoc(sessionRef, cleanUndefined({
        userId: profile.uid,
        cursorX: x,
        cursorY: y,
        lastActive: new Date().toISOString()
      }), { merge: true });
    } catch (err) {
      console.error('Failed to update cursor coordinates:', err);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!profile || !document.id) return;
    // Only track mouse cursor over the workspace
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const now = Date.now();
    if (now - lastCursorUpdateRef.current > 1200) {
      lastCursorUpdateRef.current = now;
      updateCursorInFirestore(x, y);
    }
  };

  const handleMouseLeave = () => {
    if (!profile || !document.id) return;
    updateCursorInFirestore(null, null);
  };

  // 1. Manage active-sessions subscription listener (stably keyed by document.id and profile.uid)
  useEffect(() => {
    if (!profile?.uid || !document.id) return;

    const sessionsColRef = collection(db, 'active-sessions');
    const q = query(sessionsColRef, where('docId', '==', document.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date().getTime();
      const docs = snapshot.docs.map(d => d.data());
      
      // Filter out stale sessions (older than 60 seconds) and our own session
      const filtered = docs.filter(s => {
        if (s.userId === profile.uid) return false;
        if (!s.lastActive) return false;
        const lastActiveTime = new Date(s.lastActive).getTime();
        return (now - lastActiveTime) < 60000; // 60 seconds threshold
      });

      setActiveSessions(filtered);
    }, (err) => {
      console.error('Error listening to active sessions:', err);
      handleFirestoreError(err, OperationType.GET, 'active-sessions');
    });

    return () => {
      unsubscribe();
    };
  }, [document.id, profile?.uid]);

  // 2. Manage active-session registration, heartbeat & unmount cleanup
  useEffect(() => {
    if (!profile?.uid || !document.id) return;

    const sessionDocId = `${profile.uid}_${document.id}`;
    const sessionRef = doc(db, 'active-sessions', sessionDocId);

    const writeSession = async () => {
      try {
        await setDoc(sessionRef, cleanUndefined({
          id: sessionDocId,
          docId: document.id,
          userId: profile.uid,
          displayName: profile.displayName || profile.email || 'Anonymous Teacher',
          email: profile.email,
          role: profile.role || 'Teacher',
          isEditing: isEditing,
          lastActive: new Date().toISOString()
        }), { merge: true });
      } catch (err) {
        console.error('Failed to write collaborative session:', err);
      }
    };

    // Write initial session
    writeSession();

    // Heartbeat every 20 seconds to keep session alive
    const heartbeatInterval = setInterval(() => {
      writeSession();
    }, 20000);

    // Setup beforeunload handler to clean up session on tab close
    const handleUnload = () => {
      deleteDoc(sessionRef).catch(() => {});
    };
    window.addEventListener('beforeunload', handleUnload);

    // Cleanup on unmount or doc change
    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleUnload);
      deleteDoc(sessionRef).catch(err => {
        console.error('Failed to clean up session on unmount:', err);
      });
    };
  }, [document.id, profile?.uid, profile?.displayName, profile?.email, profile?.role, isEditing]);

  useEffect(() => {
    // Sync current Google Workspace token & user details
    const token = getGoogleWorkspaceToken();
    const gUser = getGoogleWorkspaceUser();
    setGoogleToken(token);
    if (gUser) {
      setGoogleUserEmail(gUser.email);
    }
  }, []);

  useEffect(() => {
    setGmailSubject(`Lesson Materials: ${document.topic}`);
  }, [document.id, document.topic]);

  const handleConnectWorkspace = async () => {
    setIsWorkspaceLoading(true);
    setWorkspaceSuccessMessage(null);
    setWorkspaceErrorMessage(null);
    try {
      const res = await connectGoogleWorkspace();
      if (res) {
        setGoogleToken(res.accessToken);
        setGoogleUserEmail(res.user.email);
        setWorkspaceSuccessMessage('Successfully connected to Google Workspace services!');
      }
    } catch (err: any) {
      setWorkspaceErrorMessage(err.message || 'Failed to authenticate with Google Workspace.');
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const handleDisconnectWorkspace = () => {
    disconnectGoogleWorkspace();
    setGoogleToken(null);
    setGoogleUserEmail(null);
    setWorkspaceSuccessMessage('Disconnected from Google Workspace services.');
  };

  const handleExportSheets = async () => {
    setIsWorkspaceLoading(true);
    setWorkspaceSuccessMessage(null);
    setWorkspaceErrorMessage(null);
    try {
      const sheetUrl = await exportToGoogleSheets(document);
      setWorkspaceSuccessMessage('Lesson plan exported successfully to Google Sheets!');
      window.open(sheetUrl, '_blank');
    } catch (err: any) {
      setWorkspaceErrorMessage(err.message || 'Failed to export to Google Sheets.');
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const handleExportDocs = async () => {
    setIsWorkspaceLoading(true);
    setWorkspaceSuccessMessage(null);
    setWorkspaceErrorMessage(null);
    try {
      const docUrl = await exportToGoogleDocs(document);
      setWorkspaceSuccessMessage('Lesson plan exported successfully to Google Docs!');
      window.open(docUrl, '_blank');
    } catch (err: any) {
      setWorkspaceErrorMessage(err.message || 'Failed to export to Google Docs.');
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const handleCreateSlides = async () => {
    setIsWorkspaceLoading(true);
    setWorkspaceSuccessMessage(null);
    setWorkspaceErrorMessage(null);
    try {
      const slidesUrl = await createGoogleSlidesDeck(document);
      setWorkspaceSuccessMessage('Slide deck generated successfully in Google Slides!');
      window.open(slidesUrl, '_blank');
    } catch (err: any) {
      setWorkspaceErrorMessage(err.message || 'Failed to create Google Slides deck.');
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const handleCreateForm = async () => {
    setIsWorkspaceLoading(true);
    setWorkspaceSuccessMessage(null);
    setWorkspaceErrorMessage(null);
    try {
      const formUrl = await createAssessmentGoogleForm(document);
      setWorkspaceSuccessMessage('Interactive worksheet quiz generated successfully in Google Forms!');
      window.open(formUrl, '_blank');
    } catch (err: any) {
      setWorkspaceErrorMessage(err.message || 'Failed to create Google Form quiz.');
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const handleScheduleCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarDate) {
      alert('Please select a valid date');
      return;
    }
    setIsWorkspaceLoading(true);
    setIsCalendarModalOpen(false);
    setWorkspaceSuccessMessage(null);
    setWorkspaceErrorMessage(null);
    try {
      const eventUrl = await scheduleOnGoogleCalendar(document, {
        date: calendarDate,
        startTime: calendarStartTime,
        endTime: calendarEndTime,
        location: calendarLocation,
        addReminder: calendarReminder
      });
      setWorkspaceSuccessMessage('Lesson scheduled successfully in Google Calendar!');
      window.open(eventUrl, '_blank');
    } catch (err: any) {
      setWorkspaceErrorMessage(err.message || 'Failed to schedule event on Google Calendar.');
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const handleSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailRecipient) {
      alert('Please specify a recipient email');
      return;
    }
    setIsWorkspaceLoading(true);
    setIsGmailModalOpen(false);
    setWorkspaceSuccessMessage(null);
    setWorkspaceErrorMessage(null);
    try {
      await sendMaterialViaGmail(document, {
        recipientEmail: gmailRecipient,
        subjectLine: gmailSubject,
        customMessage: gmailCustomMsg
      });
      setWorkspaceSuccessMessage(`Curriculum material sent successfully to ${gmailRecipient}!`);
    } catch (err: any) {
      setWorkspaceErrorMessage(err.message || 'Failed to send email via Gmail.');
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const handleRestoreVersion = (restoredContent: string, restoredTitle: string) => {
    setEditedContent(restoredContent);
    setEditedTitle(restoredTitle);
    
    onUpdate({
      ...document,
      title: restoredTitle,
      content: restoredContent,
      lastModified: new Date().toISOString()
    });
  };

  const handleRestoreClick = (v: DocumentVersion) => {
    if (window.confirm(`Are you sure you want to restore the curriculum material to Version ${v.versionNumber}? This will overwrite your current draft in the viewer and editor. A backup of the current state is already stored in your revision timeline.`)) {
      handleRestoreVersion(v.content, v.title);
      setCompareRightVersion(null);
      setCompareLeftVersion(null);
      setWorkspaceSuccessMessage(`Successfully restored the document to Version ${v.versionNumber}!`);
      logActivity(
        'edit',
        `Restored document to Version ${v.versionNumber}: "${document.title}"`,
        profile,
        document.id,
        document.title
      );
    }
  };

  const handleCompareVersions = (leftId: string, rightId: string) => {
    const leftVer = docVersions.find(v => v.id === leftId);
    if (!leftVer) return;

    setCompareLeftVersion(leftVer);

    if (rightId === 'current') {
      const currentSimulated: DocumentVersion = {
        id: 'current',
        docId: document.id,
        title: editedTitle || document.title,
        content: editedContent || document.content,
        lastModified: new Date().toISOString(),
        modifiedByUid: profile?.uid || 'system',
        modifiedByName: profile?.displayName || profile?.email || 'Anonymous Teacher',
        modifiedByEmail: profile?.email || '',
        versionNumber: docVersions.length + 1,
        label: 'Current Revised'
      };
      setCompareRightVersion(currentSimulated);
    } else {
      const rightVer = docVersions.find(v => v.id === rightId);
      if (rightVer) {
        setCompareRightVersion(rightVer);
      }
    }

    setIsAIReviewerOpen(false);
  };

  // Helper function that detects text patterns like '**[Insert ...]' or '[Insert ...]'
  // and replaces them on-the-fly with a clean [DIAGRAM: ...] block on a new line to trigger a 'Generate Image' button.
  const detectAndPreprocessPlaceholders = (content: string): string => {
    if (!content) return '';
    let processed = content;

    // Scan for the pattern [Insert <anything>] optionally enclosed in quotes or bold asterisks, not preceded by !
    const insertRegex = /(?<!\!)(\*\*|")?\[Insert\s+(.*?)\]\1?/gi;
    
    processed = processed.replace(insertRegex, (match, p1, p2) => {
      const promptText = p2 ? p2.trim() : '';
      if (!promptText) return match;
      // Isolate the diagram block on its own line so the Markdown parser treats it as a dedicated visual placeholder
      return `\n\n[DIAGRAM: ${promptText}]\n\n`;
    });

    // Ensure all [DIAGRAM: ...] blocks (NOT preceded by !) are on their own line as well
    processed = processed.replace(/(?<!\!)(?<!\n\n)\[DIAGRAM:\s*(.*?)\](?!\n\n)/gi, (match, p1) => {
      return `\n\n[DIAGRAM: ${p1.trim()}]\n\n`;
    });

    return processed;
  };

  // Memoized version of preprocessed content to avoid repetitive regex parsing on every render
  const preprocessedDisplayContent = useMemo(() => {
    return detectAndPreprocessPlaceholders(displayContent);
  }, [displayContent]);

  // Memoized lists of highlight texts to avoid array allocations and re-triggers on every render
  const commentsHighlightedTexts = useMemo(() => {
    return comments.map(c => c.selectedText).filter(Boolean);
  }, [comments]);

  const annotationsHighlightedTexts = useMemo(() => {
    return annotations.map(a => a.selectedText).filter(Boolean);
  }, [annotations]);

  // Stable click handlers to prevent child components re-rendering
  const handleHighlightClick = useCallback((text: string) => {
    setActiveHighlightedText(text);
    setIsCommentsOpen(true);
    setIsAnnotationsOpen(false);
  }, []);

  const handleAnnotationHighlightClick = useCallback((text: string) => {
    setActiveAnnotationHighlightedText(text);
    setIsAnnotationsOpen(true);
    setIsCommentsOpen(false);
  }, []);

  const uploadBase64ImageToStorage = async (base64DataUrl: string, prompt: string): Promise<string> => {
    if (!base64DataUrl || !base64DataUrl.startsWith('data:image/')) {
      return base64DataUrl;
    }
    try {
      const parts = base64DataUrl.split(';base64,');
      if (parts.length < 2) return base64DataUrl;
      const contentType = parts[0].split(':')[1] || 'image/png';
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      const blob = new Blob([uInt8Array], { type: contentType });
      
      const fileId = `ai-img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const sanitizedPrompt = prompt.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
      const fileName = `${sanitizedPrompt || 'diagram'}.png`;
      
      const storageRef = ref(storage, `diagram_generations/${fileId}/${fileName}`);
      const uploadResult = await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      return downloadUrl;
    } catch (err) {
      console.error('Failed to upload base64 image to Storage:', err);
      return base64DataUrl;
    }
  };

  const handleGenerateDiagram = async (placeholder: string, prompt: string, model?: string) => {
    setGeneratingPlaceholders(prev => ({ ...prev, [placeholder]: true }));
    try {
      const response = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model }),
      });

      const data = await handleResponseJson(response, 'Failed to generate educational diagram.');
      if (data.imageUrl) {
        const finalUrl = await uploadBase64ImageToStorage(data.imageUrl, prompt);
        // Replace only the specific placeholder with the generated image markdown
        const imageMarkdown = `![${prompt}](${finalUrl})`;
        let newContent = editedContent;

        if (newContent.includes(placeholder)) {
          newContent = newContent.replace(placeholder, imageMarkdown);
        } else {
          // Robust regex replacement targeting the original [Insert ...] pattern case-insensitively
          const insertRegex = /(\*\*|")?\[Insert\s+(.*?)\]\1?/gi;
          let replaced = false;

          newContent = newContent.replace(insertRegex, (match, p1, p2) => {
            if (p2.trim().toLowerCase() === prompt.trim().toLowerCase()) {
              replaced = true;
              return imageMarkdown;
            }
            return match;
          });

          // Fallback: simple text replacement of [Insert <prompt>] if standard regex did not hit
          if (!replaced) {
            const index = newContent.toLowerCase().indexOf(`[insert ${prompt.toLowerCase()}]`);
            if (index !== -1) {
              newContent = newContent.substring(0, index) + imageMarkdown + newContent.substring(index + `[insert ${prompt}]`.length);
            }
          }
        }

        setEditedContent(newContent);
        
        onUpdate({
          ...document,
          content: newContent,
          lastModified: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate diagram using Gemini. Please verify your API key / limits.');
    } finally {
      setGeneratingPlaceholders(prev => ({ ...prev, [placeholder]: false }));
    }
  };

  const handleApplyDiagram = async (placeholderText: string, imageUrl: string) => {
    const promptWithoutBrackets = placeholderText.replace(/[\[\]]/g, '').replace(/^diagram:\s*/i, '').trim();
    const cleanPrompt = promptWithoutBrackets.replace(/^insert\s+custom:\s*/i, '').replace(/^insert:\s*/i, '').trim();
    
    const finalUrl = await uploadBase64ImageToStorage(imageUrl, cleanPrompt);
    const imageMarkdown = `![${cleanPrompt}](${finalUrl})`;
    
    let newContent = editedContent;
    let isReplaced = false;

    if (newContent.includes(placeholderText)) {
      newContent = newContent.replace(placeholderText, imageMarkdown);
      isReplaced = true;
    } else {
      // Find original statement case-insensitively using exact prompt
      const escapedPrompt = cleanPrompt.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\*\\*"?\\[Insert\\s+${escapedPrompt}\\]"?\\*\\*|"?\\[Insert\\s+${escapedPrompt}\\]"?`, 'gi');
      
      if (regex.test(newContent)) {
        newContent = newContent.replace(regex, imageMarkdown);
        isReplaced = true;
      } else {
        // Fallback string replacement
        const lowerPlaceholder = placeholderText.toLowerCase();
        const index = newContent.toLowerCase().indexOf(lowerPlaceholder);
        if (index !== -1) {
          newContent = newContent.substring(0, index) + imageMarkdown + newContent.substring(index + placeholderText.length);
          isReplaced = true;
        } else {
          // General append/replace fallback
          let replaceCount = 0;
          newContent = newContent.replace(/\[Insert\s+(.*?)\]/gi, (match, p1) => {
            const inner = p1.trim().toLowerCase();
            if (inner === cleanPrompt.toLowerCase() || inner === promptWithoutBrackets.toLowerCase()) {
              replaceCount++;
              return imageMarkdown;
            }
            return match;
          });
          if (replaceCount > 0) {
            isReplaced = true;
          }
        }
      }
    }

    // If no matching placeholder was found to replace (e.g. for user-created custom prompts), append it beautifully at the end of the document
    if (!isReplaced) {
      newContent = `${newContent.trim()}\n\n### 📊 Visual Diagram: ${cleanPrompt}\n\n${imageMarkdown}\n`;
    }

    setEditedContent(newContent);
    onUpdate({
      ...document,
      content: newContent,
      lastModified: new Date().toISOString()
    });
  };

  const handleGenerateToolbarImage = async () => {
    if (!toolbarImagePrompt.trim()) return;
    setIsGeneratingToolbarImage(true);
    setToolbarImageError(null);
    try {
      const response = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: toolbarImagePrompt.trim(),
          model: toolbarImageModel,
        }),
      });

      const data = await handleResponseJson(response, 'Failed to generate image.');
      if (data.imageUrl) {
        const finalUrl = await uploadBase64ImageToStorage(data.imageUrl, toolbarImagePrompt.trim());
        const selectedWidth = selectedWidthType === 'full' ? '100%' :
                              selectedWidthType === 'large' ? '75%' :
                              selectedWidthType === 'medium' ? '50%' :
                              selectedWidthType === 'small' ? '25%' :
                              (customWidthValue || '100%');
        const formattedAlt = `${toolbarImagePrompt.trim()} | ${selectedAlignment} | ${selectedWidth}`;
        const queryParams = `?align=${selectedAlignment}&width=${encodeURIComponent(selectedWidth)}`;
        insertMarkdown(`\n\n![${formattedAlt}](${finalUrl}${queryParams})\n\n`);
        setIsToolbarImageModalOpen(false);
        setToolbarImagePrompt('');
      } else {
        setToolbarImageError('Failed to retrieve image URL from Gemini response.');
      }
    } catch (err: any) {
      console.error(err);
      setToolbarImageError(err.message || 'Error generating image. Verify your Gemini configuration.');
    } finally {
      setIsGeneratingToolbarImage(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(baseContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShareByEmail = () => {
    const subject = `[Lesson Plan Review] ${editedTitle}`;
    
    // Process markdown content to extract clean text or headings
    const lines = editedContent.split('\n');
    const headings = lines
      .filter(line => line.trim().startsWith('#'))
      .map(line => line.replace(/^#+\s*/, '').trim())
      .slice(0, 8); // Top 8 headings

    const bulletPoints = headings.length > 0
      ? headings.map(h => `• ${h}`).join('\n')
      : editedContent
          .replace(/[#*`_\[\]]/g, '') // strip simple markdown characters
          .split('\n')
          .filter(line => line.trim().length > 0)
          .slice(0, 5)
          .map(line => `• ${line.trim()}`)
          .join('\n');

    const emailBody = `Dear Administrator,

I am writing to share a lesson plan from my EduNexus Teacher Workspace for your review. Please find the details and a structured summary of the content below:

==================================================
LESSON PLAN OVERVIEW
==================================================
• Title: ${editedTitle}
• Subject: ${document.subject || 'N/A'}
• Class Level: ${document.classLevel || 'N/A'}
• Curriculum: ${document.curriculum === 'cbc' ? 'Kenyan CBC' : 'Standard Curriculum'}
• Topic: ${document.topic || 'N/A'}
• Sub-Topic: ${document.subTopic || 'N/A'}
• Duration: ${document.duration || 'N/A'}

==================================================
SUMMARY & OUTLINE
==================================================
${bulletPoints || 'Please check the full document inside the workspace.'}

==================================================

You can log in to the EduNexus platform to view, edit, or leave collaborative feedback directly on this document.

Thank you, and I look forward to your valuable feedback.

Best regards,
${profile?.displayName || 'Classroom Teacher'}
(${profile?.email || 'Registered Educator'})`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
  };

  const handleSave = async () => {
    const formatted = autoDetectAndBold(editedContent);
    const formattedAdvanced = selectedDifferentiatedView === 'advanced' ? autoDetectAndBold(editedAdvancedContent) : editedAdvancedContent;
    const formattedSupport = selectedDifferentiatedView === 'support' ? autoDetectAndBold(editedSupportContent) : editedSupportContent;
    const formattedDetailed = selectedDifferentiatedView === 'detailed' ? autoDetectAndBold(editedDetailedContent) : editedDetailedContent;

    onUpdate({
      ...document,
      title: editedTitle,
      content: formatted,
      differentiatedAdvanced: formattedAdvanced,
      differentiatedSupport: formattedSupport,
      differentiatedDetailed: formattedDetailed,
      lastModified: new Date().toISOString()
    });

    setEditedContent(formatted);
    if (selectedDifferentiatedView === 'advanced') setEditedAdvancedContent(formattedAdvanced);
    if (selectedDifferentiatedView === 'support') setEditedSupportContent(formattedSupport);
    if (selectedDifferentiatedView === 'detailed') setEditedDetailedContent(formattedDetailed);

    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    setSyncStatus('synced');
    setLastSavedSyncTime(new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }));

    // Auto-save this version in the history timeline
    const versionLabel = document.aiReview ? 'Post-AI Revision' : 'Revised Draft';
    await createVersionInDb(editedTitle, formatted, versionLabel);
  };

  const handleDirectAutoAlign = async () => {
    setIsAutoAligningDirect(true);
    setAutoAlignStep('Analyzing lesson notes against KICD curriculum requirements...');
    try {
      // Step 1: Look up stored curriculum requirements
      const matchedRequirement = findRequirements(document.subject, document.classLevel, document.topic || document.subTopic);

      // Step 2: Validate current content to get gaps
      const validationResponse = await fetch('/api/validate-kenyan-curriculum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: document.id,
          title: editedTitle || document.title,
          content: editedContent || document.content,
          subject: document.subject,
          classLevel: document.classLevel,
          topic: document.topic || document.subTopic || '',
          language: aiLanguage || 'en',
          storedRequirement: matchedRequirement
        }),
      });

      const validationData = await handleResponseJson(validationResponse, 'Failed to complete pre-alignment audit.');
      
      setAutoAlignStep('Non-compliant sections found. Rewriting content to embed CBC outcomes & competencies...');

      // Step 3: Trigger the auto-align rewrite
      const alignResponse = await fetch('/api/auto-align-curriculum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedTitle || document.title,
          content: editedContent || document.content,
          subject: document.subject,
          classLevel: document.classLevel,
          topic: document.topic || document.subTopic || '',
          language: aiLanguage || 'en',
          storedRequirement: matchedRequirement,
          gaps: validationData?.gapAnalysis || []
        })
      });

      const alignData = await handleResponseJson(alignResponse, 'Failed to apply curriculum rewrite.');
      if (alignData && alignData.alignedContent) {
        setAutoAlignStep('Success! Applying KICD-compliant curriculum notes...');
        setEditedContent(alignData.alignedContent);
        
        // Save the updated content to Firebase
        onUpdate({
          ...document,
          title: editedTitle,
          content: alignData.alignedContent,
          lastModified: new Date().toISOString()
        });
        
        setWorkspaceSuccessMessage('Successfully auto-aligned lesson content with official Kenyan KICD standards!');
      } else {
        throw new Error('Alignment rewrite response was invalid.');
      }
    } catch (err: any) {
      console.error('Direct auto-alignment error:', err);
      setWorkspaceErrorMessage(err.message || 'An error occurred during curriculum auto-alignment.');
    } finally {
      setIsAutoAligningDirect(false);
      setAutoAlignStep('');
    }
  };

  const handleGenerateDifferentiated = async () => {
    setIsGeneratingDifferentiated(true);
    setDiffError(null);
    try {
      const response = await fetch('/api/generate-differentiated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docType: document.docType,
          subject: document.subject,
          classLevel: document.classLevel,
          topic: document.topic,
          content: editedContent,
          language: aiLanguage,
        }),
      });

      const data = await handleResponseJson(response, 'Failed to generate differentiated content.');
      
      setEditedAdvancedContent(data.advanced);
      setEditedSupportContent(data.support);
      if (data.detailed) {
        setEditedDetailedContent(data.detailed);
      }

      onUpdate({
        ...document,
        differentiatedAdvanced: data.advanced,
        differentiatedSupport: data.support,
        differentiatedDetailed: data.detailed || '',
        lastModified: new Date().toISOString(),
      });

      if (document.docType === 'lesson-notes' || document.docType === 'lesson-notes-classic') {
        setSelectedDifferentiatedView('detailed');
        setIsHandwrittenTheme(true);
        localStorage.setItem('pedagogical_paper_style', 'classic');
        window.dispatchEvent(new Event('paper_theme_changed'));
      } else {
        setSelectedDifferentiatedView('advanced');
      }
      
      logActivity(
        'generate',
        (document.docType === 'lesson-notes' || document.docType === 'lesson-notes-classic')
          ? `Generated differentiated tracks (Detailed & Simplified) for document: "${document.title}"`
          : `Generated differentiated tracks (Advanced & Support) for document: "${document.title}"`,
        profile,
        document.id,
        document.title
      );
    } catch (err: any) {
      console.error(err);
      setDiffError(err.message || 'An error occurred during differentiation generation.');
    } finally {
      setIsGeneratingDifferentiated(false);
    }
  };

  const handleSaveWhiteboard = async (whiteboardDataString: string) => {
    onUpdate({
      ...document,
      whiteboardData: whiteboardDataString,
      lastModified: new Date().toISOString()
    });
  };

  const handleDownloadMarkdown = () => {
    const element = window.document.createElement('a');
    const file = new Blob([baseContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${editedTitle.toLowerCase().replace(/\s+/g, '-')}-${selectedDifferentiatedView}.md`;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  const handleDownloadWord = () => {
    try {
      const title = editedTitle || document.title || 'Document';
      let htmlContent = baseContent || '';

      // Clean Markdown to HTML tags for Microsoft Word formatting
      htmlContent = htmlContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/^### (.*$)/gim, '<h3 style="color:#5f6f52; font-size:13pt; margin-top:12pt; margin-bottom:6pt; font-weight:bold;">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 style="color:#2c3e1e; font-size:15pt; margin-top:14pt; margin-bottom:8pt; border-bottom:1px solid #e5e1da; padding-bottom:4pt; font-weight:bold;">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 style="color:#5f6f52; font-size:18pt; margin-top:16pt; margin-bottom:10pt; font-weight:bold;">$1</h1>')
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^\> (.*$)/gim, '<blockquote style="background:#fdfbf7; border-left:4px solid #5f6f52; padding:8pt 12pt; margin:10pt 0; color:#4a5568; font-style:italic;">$1</blockquote>')
        .replace(/^---$/gim, '<hr style="border:0; border-top:1px solid #cbd5e1; margin:14pt 0;" />')
        .replace(/^\s*[\-\*]\s+(.*$)/gim, '<li style="margin-bottom:4pt;">$1</li>')
        .replace(/(<li.*<\/li>\n?)+/g, '<ul style="margin-bottom:10pt; padding-left:20pt;">$&</ul>')
        .split('\n')
        .map(line => {
          const trimmed = line.trim();
          if (!trimmed) return '';
          if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<hr')) {
            return line;
          }
          return `<p style="margin-bottom:10pt; line-height:1.5; font-size:11pt; color:#334155;">${line}</p>`;
        })
        .join('\n');

      const wordDocHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${title}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: A4 portrait;
              margin: 1.0in 1.0in 1.0in 1.0in;
            }
            body {
              font-family: 'Calibri', 'Arial', sans-serif;
              font-size: 11pt;
              line-height: 1.5;
              color: #1e293b;
              background-color: #ffffff;
            }
            .header-banner {
              border-bottom: 2px solid #5f6f52;
              padding-bottom: 10pt;
              margin-bottom: 16pt;
            }
            .title-text {
              font-size: 20pt;
              font-weight: bold;
              color: #2c3e1e;
              margin: 0 0 6pt 0;
            }
            .meta-box {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 8pt 12pt;
              border-radius: 4pt;
              font-size: 9.5pt;
              color: #475569;
              margin-bottom: 16pt;
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div class="title-text">${title}</div>
            <div class="meta-box">
              <strong>Subject:</strong> ${document.subject || 'General'} &nbsp;|&nbsp;
              <strong>Topic:</strong> ${document.topic || 'General'} &nbsp;|&nbsp;
              <strong>Class Level:</strong> ${document.classLevel || 'General'} &nbsp;|&nbsp;
              <strong>Document Type:</strong> ${document.docType || 'Lesson Material'}
            </div>
          </div>
          <div>
            ${htmlContent}
          </div>
        </body>
        </html>
      `;

      const blob = new Blob(['\uFEFF' + wordDocHtml], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const element = window.document.createElement('a');
      element.href = url;
      element.download = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '-')}-${selectedDifferentiatedView}.doc`;
      window.document.body.appendChild(element);
      element.click();
      window.document.body.removeChild(element);
      URL.revokeObjectURL(url);
      setWorkspaceSuccessMessage?.('Downloaded Word document (.doc)!');
    } catch (err) {
      console.error('Error downloading Word document:', err);
      alert('Failed to generate Word document. Please try again.');
    }
  };

  const handleDownloadCSV = () => {
    const escapeCSVValue = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Document ID',
      'Title',
      'Document Type',
      'Curriculum',
      'Subject',
      'Class/Grade Level',
      'Topic',
      'Subtopic',
      'Duration/Timeframe',
      'Lessons Per Week',
      'Weeks Per Term',
      'Master Teacher Guide',
      'Ask Mentor Insights',
      'Key Vocabulary Included',
      'Differentiated Learning Included',
      'Parental Engagement Included',
      'Created At',
      'Last Modified',
      'Is Archived',
      'Tags',
      'Reflection - What Worked',
      'Reflection - What Did Not Work',
      'Reflection - Recommended Adjustments',
      'Content (Markdown)'
    ];

    const values = [
      document.id || '',
      editedTitle,
      document.docType || '',
      document.curriculum || '',
      document.subject || '',
      document.classLevel || '',
      document.topic || '',
      document.subTopic || '',
      document.duration || '',
      document.lessonsPerWeek !== undefined ? String(document.lessonsPerWeek) : '',
      document.weeksPerTerm !== undefined ? String(document.weeksPerTerm) : '',
      document.explainLikeMasterTeacher ? 'Yes' : 'No',
      document.askMentor ? 'Yes' : 'No',
      document.generateVocabulary ? 'Yes' : 'No',
      document.generateDifferentiated ? 'Yes' : 'No',
      document.generateParental ? 'Yes' : 'No',
      document.createdAt || '',
      document.lastModified || '',
      document.isArchived ? 'Yes' : 'No',
      (document.tags || []).join(', '),
      reflectionWorked || '',
      reflectionDidntWork || '',
      reflectionAdjustments || '',
      editedContent
    ];

    const csvContent = [
      headers.map(escapeCSVValue).join(','),
      values.map(escapeCSVValue).join(',')
    ].join('\n');

    // Add UTF-8 BOM for Excel/external software compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const element = window.document.createElement('a');
    element.href = url;
    element.download = `${editedTitle.toLowerCase().replace(/\s+/g, '-')}-metadata.csv`;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  const handleExportHandwrittenPDF = async () => {
    const element = window.document.getElementById('handwritten-notebook-paper');
    if (!element) return;

    const originalTransform = element.style.transform;
    const originalMarginBottom = element.style.marginBottom;

    try {
      setIsGeneratingHandwrittenPDF(true);
      
      // Temporary style adjustments for export (to ensure no clipping during html2canvas render)
      element.style.transform = 'none';
      element.style.marginBottom = '0px';
      
      // Let the DOM repaint to apply the unscaled size
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const canvas = await html2canvas(element, {
        scale: 2, // ultra high resolution
        useCORS: true,
        backgroundColor: printerFriendly ? '#ffffff' : '#faf6ee',
        logging: false,
        height: element.scrollHeight,
        windowHeight: element.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 size width in mm
      const pageHeight = 297; // A4 size height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${editedTitle.toLowerCase().replace(/\s+/g, '-')}-handwritten.pdf`);
    } catch (err) {
      console.error('Error generating handwritten PDF:', err);
      alert('Failed to generate handwritten PDF. Please try again.');
    } finally {
      element.style.transform = originalTransform;
      element.style.marginBottom = originalMarginBottom;
      setIsGeneratingHandwrittenPDF(false);
    }
  };

  const handleDownloadPNG = async () => {
    try {
      setIsGeneratingHandwrittenPDF(true);
      
      // If we have an existing classic notes PNG image URL (base64 or db reference)
      if ((document.docType === 'lesson-notes-classic' || document.docType === 'lesson-notes') && dbImageUrl) {
        const a = window.document.createElement('a');
        a.href = dbImageUrl;
        a.download = `${editedTitle.toLowerCase().replace(/\s+/g, '-')}-1page-A4-classic-notes.png`;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        setWorkspaceSuccessMessage('Downloaded 1-page A4 PNG document!');
        return;
      }

      // Otherwise, capture the DOM container element and format onto a 1-page A4 canvas PNG
      const element = window.document.getElementById('document-printable-page-container') || window.document.getElementById('pedagogical-paper-sheet');
      if (!element) {
        alert('Document container element not found for PNG export.');
        return;
      }

      const originalTransform = element.style.transform;
      const originalMarginBottom = element.style.marginBottom;
      element.style.transform = 'none';
      element.style.marginBottom = '0px';

      await new Promise(resolve => setTimeout(resolve, 50));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: printerFriendly ? '#ffffff' : '#faf6ee',
        logging: false,
        height: element.scrollHeight,
        windowHeight: element.scrollHeight
      });

      // Fit captured canvas onto a high-res 1-page A4 proportioned canvas (210 x 297 ratio)
      const a4Width = 2480; // 300 DPI A4 width
      const a4Height = 3508; // 300 DPI A4 height
      const a4Canvas = window.document.createElement('canvas');
      a4Canvas.width = a4Width;
      a4Canvas.height = a4Height;
      const ctx = a4Canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, a4Width, a4Height);

        // Fit whole page image into 1-page A4 bounds
        const scale = Math.min(a4Width / canvas.width, a4Height / canvas.height);
        const scaledWidth = canvas.width * scale;
        const scaledHeight = canvas.height * scale;
        const offsetX = (a4Width - scaledWidth) / 2;
        const offsetY = 0; // align top

        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, offsetX, offsetY, scaledWidth, scaledHeight);
      }

      const imgData = a4Canvas.toDataURL('image/png');
      const link = window.document.createElement('a');
      link.href = imgData;
      link.download = `${editedTitle.toLowerCase().replace(/\s+/g, '-')}-1page-A4-notes.png`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      element.style.transform = originalTransform;
      element.style.marginBottom = originalMarginBottom;

      setWorkspaceSuccessMessage('Downloaded 1-page A4 PNG document!');
    } catch (err) {
      console.error('Error generating PNG document:', err);
      alert('Failed to generate PNG document. Please try again.');
    } finally {
      setIsGeneratingHandwrittenPDF(false);
    }
  };

  const handleDownloadPDF = () => {
    const pdfOrientation = isPrintLayoutPreview ? printLayoutOrientation : documentOrientation;
    const doc = new jsPDF({
      orientation: pdfOrientation,
      unit: 'mm',
      format: 'a4'
    });

    // Color definitions based on layout settings
    const isColor = printLayoutColorMode === 'color';
    const colors = {
      theme: isColor ? { r: 95, g: 111, b: 82 } : { r: 30, g: 41, b: 59 },
      heading: isColor ? { r: 44, g: 62, b: 30 } : { r: 15, g: 23, b: 42 },
      callout: {
        why: isColor 
          ? { bg: { r: 245, g: 243, b: 255 }, border: { r: 139, g: 92, b: 246 } } // Purple
          : { bg: { r: 248, g: 250, b: 252 }, border: { r: 71, g: 85, b: 105 } },
        memory: isColor
          ? { bg: { r: 255, g: 251, b: 235 }, border: { r: 245, g: 158, b: 11 } } // Amber
          : { bg: { r: 248, g: 250, b: 252 }, border: { r: 71, g: 85, b: 105 } },
        example: isColor
          ? { bg: { r: 240, g: 249, b: 255 }, border: { r: 2, g: 132, b: 199 } } // Blue
          : { bg: { r: 248, g: 250, b: 252 }, border: { r: 71, g: 85, b: 105 } },
        'high-yield': isColor
          ? { bg: { r: 255, g: 241, b: 242 }, border: { r: 225, g: 29, b: 72 } } // Rose
          : { bg: { r: 248, g: 250, b: 252 }, border: { r: 71, g: 85, b: 105 } },
        generic: { bg: { r: 248, g: 250, b: 252 }, border: { r: 71, g: 85, b: 105 } }
      },
      code: {
        bg: { r: 248, g: 250, b: 252 },
        border: { r: 203, g: 213, b: 225 }
      },
      table: {
        headerBg: isColor ? { r: 95, g: 111, b: 82 } : { r: 51, g: 65, b: 85 }
      }
    };

    // Font family mapping
    const fontFamily = 
      printLayoutFont === 'serif' ? 'times' :
      printLayoutFont === 'mono' ? 'courier' : 'helvetica';

    // Margin mapping
    const margin = 
      printLayoutMargin === 'narrow' ? 15 :
      printLayoutMargin === 'wide' ? 25 : 20;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxLineWidth = pageWidth - margin * 2;
    
    let currentY = margin + 10;
    let pageNum = 1;

    // Helper: Page numbers and decorative border frame
    const drawPageDecorations = (pNum: number) => {
      // Soft page outline frame
      doc.setDrawColor(229, 225, 218);
      doc.setLineWidth(0.4);
      doc.rect(margin - 4, margin - 4, pageWidth - (margin - 4) * 2, pageHeight - (margin - 4) * 2, 'D');

      // Footer notice
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text('Generated via Curriculum-Aligned Pedagogical Suite', margin, pageHeight - 10);
      
      const pageNumStr = `Page ${pNum}`;
      const pageNumWidth = doc.getTextWidth(pageNumStr);
      doc.text(pageNumStr, pageWidth - margin - pageNumWidth, pageHeight - 10);
    };

    // Helper: Safe page transitions
    const checkPageOverflow = (increment: number) => {
      if (currentY + increment > pageHeight - margin - 8) {
        doc.addPage();
        pageNum++;
        currentY = margin + 10;
        drawPageDecorations(pageNum);
      }
    };

    // Helper: Structured Classroom Header Box
    const drawClassroomHeader = () => {
      const headerHeight = 35;
      checkPageOverflow(headerHeight + 10);
      
      doc.setDrawColor(30, 41, 59); // Slate-900
      doc.setLineWidth(0.8);
      doc.setFillColor(248, 250, 252); // Light background tint
      doc.rect(margin, currentY, maxLineWidth, headerHeight, 'FD');
      
      // Upper Label
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('CLASSROOM LESSON HANDOUT', margin + 5, currentY + 6);
      
      // Title
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      const titleLines = doc.splitTextToSize(editedTitle, maxLineWidth - 60);
      let titleY = currentY + 14;
      titleLines.forEach((line: string, index: number) => {
        if (index < 2) {
          doc.text(line, margin + 5, titleY);
          titleY += 6;
        }
      });

      // Split Divider Line
      const dividerX = margin + maxLineWidth - 55;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(dividerX, currentY + 4, dividerX, currentY + headerHeight - 4);

      // Metadata section
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      
      let metaY = currentY + 8;
      const metaItems = [
        `Subject: ${document.subject || 'General'}`,
        `Level: ${document.classLevel || 'N/A'}`,
        `Topic: ${document.topic || 'N/A'}`,
        `Date: ${new Date().toLocaleDateString()}`
      ];
      
      metaItems.forEach((item) => {
        const truncated = item.length > 25 ? item.substring(0, 23) + '...' : item;
        doc.text(truncated, dividerX + 4, metaY);
        metaY += 5;
      });

      currentY += headerHeight + 8;

      // Draw Student Names & Score box for interactive worksheets/notes
      if (document.docType === 'worksheet' || document.docType === 'lesson-notes' || document.docType === 'lesson-notes-classic') {
        checkPageOverflow(15);
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        
        doc.text('Student Name:', margin, currentY + 6);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.line(margin + 25, currentY + 7, margin + maxLineWidth - 40, currentY + 7);

        doc.text('Score / Grade:', margin + maxLineWidth - 35, currentY + 6);
        doc.rect(margin + maxLineWidth - 12, currentY, 12, 8);

        currentY += 15;
      }
    };

    // Helper: Header 1 (Large + styled horizontal underline)
    const drawH1 = (text: string) => {
      checkPageOverflow(18);
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(14);
      doc.setTextColor(colors.heading.r, colors.heading.g, colors.heading.b);
      doc.text(text, margin, currentY + 8);
      
      // Bottom line rule
      doc.setDrawColor(colors.theme.r, colors.theme.g, colors.theme.b);
      doc.setLineWidth(0.8);
      doc.line(margin, currentY + 11, margin + maxLineWidth, currentY + 11);
      
      currentY += 16;
    };

    // Helper: Header 2
    const drawH2 = (text: string) => {
      checkPageOverflow(14);
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(colors.heading.r, colors.heading.g, colors.heading.b);
      doc.text(text, margin, currentY + 6);
      currentY += 12;
    };

    // Helper: Header 3
    const drawH3 = (text: string) => {
      checkPageOverflow(12);
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(colors.theme.r, colors.theme.g, colors.theme.b);
      doc.text(text, margin, currentY + 5);
      currentY += 9;
    };

    // Helper: Paragraph lines and lists
    const drawParagraph = (text: string, isBullet = false, isNumbered = false, numPrefix = '') => {
      if (text.trim() === '') {
        currentY += 4;
        return;
      }
      
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      
      let indent = 0;
      if (isBullet) {
        indent = 6;
      } else if (isNumbered) {
        indent = 8;
      }
      
      const wrapWidth = maxLineWidth - indent;
      const cleanText = text.replace(/[*_]/g, ''); // strip inline asterisks for layout
      const lines = doc.splitTextToSize(cleanText, wrapWidth);
      
      const blockHeight = lines.length * 5;
      checkPageOverflow(blockHeight + 2);
      
      lines.forEach((l: string, idx: number) => {
        checkPageOverflow(5);
        const xPos = margin + indent;
        if (idx === 0) {
          if (isBullet) {
            doc.setFont(fontFamily, 'bold');
            doc.setTextColor(colors.theme.r, colors.theme.g, colors.theme.b);
            doc.text('•', margin + 2, currentY + 4);
            doc.setFont(fontFamily, 'normal');
            doc.setTextColor(51, 65, 85);
          } else if (isNumbered) {
            doc.setFont(fontFamily, 'bold');
            doc.setTextColor(colors.theme.r, colors.theme.g, colors.theme.b);
            doc.text(numPrefix, margin, currentY + 4);
            doc.setFont(fontFamily, 'normal');
            doc.setTextColor(51, 65, 85);
          }
        }
        doc.text(l, xPos, currentY + 4);
        currentY += 5;
      });
    };

    // Helper: Styled Callout Box (Why, Memory Trick, Easy Example, High Yield)
    const drawCallout = (styleType: 'why' | 'memory' | 'example' | 'high-yield' | 'generic', title: string, bodyLines: string[]) => {
      const calloutColors = colors.callout[styleType] || colors.callout.generic;
      const cleanBodyLines = bodyLines.map(l => l.replace(/[*_]/g, '')).filter(l => l.trim() !== '');
      
      const allWrappedLines: string[] = [];
      cleanBodyLines.forEach(l => {
        const lines = doc.splitTextToSize(l, maxLineWidth - 12);
        allWrappedLines.push(...lines);
      });
      
      const titleHeight = title ? 6 : 0;
      const contentHeight = allWrappedLines.length * 4.5;
      const padding = 8;
      const boxHeight = titleHeight + contentHeight + padding;
      
      checkPageOverflow(boxHeight + 6);
      
      // Box fill
      doc.setFillColor(calloutColors.bg.r, calloutColors.bg.g, calloutColors.bg.b);
      doc.rect(margin, currentY + 2, maxLineWidth, boxHeight, 'F');
      
      // Side colored bar
      doc.setFillColor(calloutColors.border.r, calloutColors.border.g, calloutColors.border.b);
      doc.rect(margin, currentY + 2, 2.2, boxHeight, 'F');
      
      let blockY = currentY + 2 + 5;
      
      if (title) {
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(calloutColors.border.r, calloutColors.border.g, calloutColors.border.b);
        
        let labelPrefix = '';
        if (styleType === 'why') labelPrefix = '❓ WHY? ';
        else if (styleType === 'memory') labelPrefix = '💡 MEMORY TRICK: ';
        else if (styleType === 'example') labelPrefix = '🌟 EASY EXAMPLE: ';
        else if (styleType === 'high-yield') labelPrefix = '🏆 HIGH-YIELD: ';
        
        const displayTitle = title.replace(/^(❓ WHY\?|💡 MEMORY TRICK|🌟 EASY EXAMPLE|🏆 HIGH-YIELD|NEET POINTS|BLOCK:)\s*[:\-]?\s*/i, '');
        doc.text(labelPrefix + displayTitle, margin + 6, blockY);
        blockY += 5.5;
      }
      
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      
      allWrappedLines.forEach(l => {
        doc.text(l, margin + 6, blockY);
        blockY += 4.5;
      });
      
      currentY += boxHeight + 8;
    };

    // Helper: Code Drill Box (Courier typography)
    const drawCodeBlock = (bodyLines: string[]) => {
      const cleanLines = bodyLines.filter(l => l.trim() !== '');
      const allWrappedLines: string[] = [];
      cleanLines.forEach(l => {
        const lines = doc.splitTextToSize(l, maxLineWidth - 10);
        allWrappedLines.push(...lines);
      });
      
      const contentHeight = allWrappedLines.length * 4.5;
      const boxHeight = contentHeight + 8;
      
      checkPageOverflow(boxHeight + 6);
      
      doc.setFillColor(colors.code.bg.r, colors.code.bg.g, colors.code.bg.b);
      doc.rect(margin, currentY + 2, maxLineWidth, boxHeight, 'F');
      
      doc.setDrawColor(colors.code.border.r, colors.code.border.g, colors.code.border.b);
      doc.setLineWidth(0.3);
      doc.rect(margin, currentY + 2, maxLineWidth, boxHeight, 'D');
      
      let blockY = currentY + 2 + 5.5;
      
      doc.setFont('courier', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      
      allWrappedLines.forEach(l => {
        doc.text(l, margin + 5, blockY);
        blockY += 4.5;
      });
      
      currentY += boxHeight + 8;
    };

    // Helper: Schematic Diagram blueprint block
    const drawDiagramBlock = (description: string, labels: { key: string; value: string }[]) => {
      const blueprintHeight = 35;
      const labelHeight = labels.length > 0 ? (labels.length * 5 + 8) : 0;
      const totalHeight = blueprintHeight + labelHeight + 6;
      
      checkPageOverflow(totalHeight + 10);
      
      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.5);
      doc.setFillColor(isColor ? 240 : 250, isColor ? 244 : 250, isColor ? 248 : 250);
      doc.rect(margin, currentY + 2, maxLineWidth, blueprintHeight, 'FD');
      
      // Technical Grid background
      if (isColor) {
        doc.setDrawColor(218, 226, 234);
        doc.setLineWidth(0.15);
        for (let x = margin + 5; x < margin + maxLineWidth; x += 5) {
          doc.line(x, currentY + 2, x, currentY + 2 + blueprintHeight);
        }
        for (let y = currentY + 2 + 5; y < currentY + 2 + blueprintHeight; y += 5) {
          doc.line(margin, y, margin + maxLineWidth, y);
        }
      }

      // Draw technical circle target
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      const centerX = margin + maxLineWidth / 2;
      const centerY = currentY + 2 + blueprintHeight / 2 - 2;
      
      doc.circle(centerX, centerY, 6);
      doc.circle(centerX, centerY, 3);
      doc.line(centerX - 10, centerY, centerX + 10, centerY);
      doc.line(centerX, centerY - 10, centerX, centerY + 10);
      
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text('PEDAGOGICAL VISUAL SCHEMATIC', margin + 6, currentY + 2 + 6);
      
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      const descLines = doc.splitTextToSize(description, maxLineWidth - 12);
      let descY = centerY + 10;
      descLines.forEach((l: string, idx: number) => {
        if (idx < 2) {
          const w = doc.getTextWidth(l);
          doc.text(l, centerX - w / 2, descY);
          descY += 4;
        }
      });

      currentY += blueprintHeight + 4;

      // Diagram specifications block
      if (labels.length > 0) {
        checkPageOverflow(labelHeight);
        
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, currentY, maxLineWidth, 5, 'F');
        
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('DIAGRAM COMPONENT', margin + 4, currentY + 3.5);
        doc.text('FUNCTION / SPECIFICATIONS & ANNOTATIONS', margin + 55, currentY + 3.5);
        
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(margin, currentY + 5, margin + maxLineWidth, currentY + 5);
        
        let rowY = currentY + 5;
        labels.forEach((label) => {
          doc.setFont(fontFamily, 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          doc.text(label.key.toUpperCase(), margin + 4, rowY + 3.5);
          
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(51, 65, 85);
          const wrappedVal = doc.splitTextToSize(label.value, maxLineWidth - 59);
          wrappedVal.forEach((vl: string, vi: number) => {
            doc.text(vl, margin + 55, rowY + 3.5 + (vi * 3));
          });
          
          const rowHeight = Math.max(5, 4 + (wrappedVal.length - 1) * 3);
          rowY += rowHeight;
          doc.line(margin, rowY, margin + maxLineWidth, rowY);
        });
        
        currentY = rowY + 4;
      } else {
        currentY += 4;
      }
    };

    // Helper: Structured Data Tables
    const drawTableBlock = (headers: string[], rows: string[][]) => {
      if (headers.length === 0) return;
      
      const numCols = headers.length;
      const colWidth = maxLineWidth / numCols;
      const colWidths = Array(numCols).fill(colWidth);
      
      if (numCols === 2) {
        colWidths[0] = maxLineWidth * 0.35;
        colWidths[1] = maxLineWidth * 0.65;
      } else if (numCols === 3) {
        colWidths[0] = maxLineWidth * 0.25;
        colWidths[1] = maxLineWidth * 0.375;
        colWidths[2] = maxLineWidth * 0.375;
      }
      
      const wrappedHeaders = headers.map((h, i) => doc.splitTextToSize(h.replace(/[*_]/g, ''), colWidths[i] - 4));
      const maxHeaderLines = Math.max(...wrappedHeaders.map(lh => lh.length));
      const headerHeight = maxHeaderLines * 4.5 + 4;
      
      checkPageOverflow(headerHeight + 15);
      
      doc.setFillColor(colors.table.headerBg.r, colors.table.headerBg.g, colors.table.headerBg.b);
      doc.rect(margin, currentY, maxLineWidth, headerHeight, 'F');
      
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      
      let curX = margin;
      wrappedHeaders.forEach((lines, colIdx) => {
        let textY = currentY + 4;
        lines.forEach((l: string) => {
          doc.text(l, curX + 2, textY);
          textY += 4;
        });
        curX += colWidths[colIdx];
      });
      
      doc.setDrawColor(colors.table.headerBg.r, colors.table.headerBg.g, colors.table.headerBg.b);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY + headerHeight, margin + maxLineWidth, currentY + headerHeight);
      
      currentY += headerHeight;
      
      rows.forEach((row) => {
        const wrappedCells = row.map((cell, i) => {
          const cellText = (cell || '').replace(/[*_]/g, '');
          return doc.splitTextToSize(cellText, colWidths[i] - 4);
        });
        
        const maxLines = Math.max(...wrappedCells.map(lc => lc.length), 1);
        const rowHeight = maxLines * 4 + 4;
        
        checkPageOverflow(rowHeight);
        
        let curRowX = margin;
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        
        wrappedCells.forEach((lines, colIdx) => {
          let textY = currentY + 3.5;
          lines.forEach((l: string) => {
            doc.text(l, curRowX + 2, textY);
            textY += 4;
          });
          curRowX += colWidths[colIdx];
        });
        
        doc.setDrawColor(220, 220, 215);
        doc.setLineWidth(0.2);
        doc.line(margin, currentY + rowHeight, margin + maxLineWidth, currentY + rowHeight);
        
        let lineX = margin;
        colWidths.forEach((w) => {
          doc.line(lineX, currentY, lineX, currentY + rowHeight);
          lineX += w;
        });
        doc.line(margin + maxLineWidth, currentY, margin + maxLineWidth, currentY + rowHeight);
        
        currentY += rowHeight;
      });
      
      currentY += 6;
    };

    // Markdown block parser function
    const parseMarkdownToBlocks = (content: string) => {
      const blocksList: any[] = [];
      const markdownLines = content.split('\n');
      let i = 0;

      while (i < markdownLines.length) {
        const line = markdownLines[i];

        if (line.trim() === '') {
          blocksList.push({ type: 'paragraph', text: '' });
          i++;
          continue;
        }

        if (line.trim().startsWith('```')) {
          const codeLines: string[] = [];
          i++;
          while (i < markdownLines.length && !markdownLines[i].trim().startsWith('```')) {
            codeLines.push(markdownLines[i]);
            i++;
          }
          i++;
          blocksList.push({ type: 'code', lines: codeLines });
          continue;
        }

        if (line.trim().startsWith('[DIAGRAM:') || line.trim().startsWith('[insert diagram:')) {
          const diagText = line.trim();
          const desc = diagText.replace(/^\[DIAGRAM:\s*/i, '').replace(/^\[insert diagram:\s*/i, '').replace(/\]$/, '');
          const labelsList: { key: string; value: string }[] = [];
          
          i++;
          while (i < markdownLines.length && markdownLines[i].trim() !== '' && !markdownLines[i].startsWith('#') && !markdownLines[i].startsWith('---')) {
            const nextLine = markdownLines[i].trim();
            const colonIndex = nextLine.indexOf(':');
            if (colonIndex > 0 && (nextLine.match(/^\d+/) || nextLine.startsWith('-') || nextLine.startsWith('•') || nextLine.match(/^[A-Z]/))) {
              const labelKey = nextLine.substring(0, colonIndex).replace(/^[\s\d.••••\-*]+/, '').trim();
              const labelVal = nextLine.substring(colonIndex + 1).trim();
              if (labelKey.length > 0 && labelKey.length < 30) {
                labelsList.push({ key: labelKey, value: labelVal });
              }
            }
            i++;
          }
          blocksList.push({ type: 'diagram', diagramDesc: desc, diagramLabels: labelsList });
          continue;
        }

        if (line.trim().startsWith('|')) {
          const tableLines: string[] = [];
          while (i < markdownLines.length && markdownLines[i].trim().startsWith('|')) {
            tableLines.push(markdownLines[i]);
            i++;
          }
          
          if (tableLines.length > 0) {
            const parseRow = (r: string) => r.split('|').map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
            const headersList = parseRow(tableLines[0]);
            const rowsList: string[][] = [];
            const startIndex = (tableLines.length > 1 && tableLines[1].includes('---')) ? 2 : 1;
            for (let j = startIndex; j < tableLines.length; j++) {
              const cells = parseRow(tableLines[j]);
              if (cells.length > 0) {
                rowsList.push(cells);
              }
            }
            blocksList.push({ type: 'table', headers: headersList, rows: rowsList });
          }
          continue;
        }

        if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
          blocksList.push({ type: 'hr' });
          i++;
          continue;
        }

        const isSpecialHeading = (txt: string) => {
          const t = txt.toLowerCase();
          if (t.includes('why?') || t.includes('❓')) return 'why';
          if (t.includes('memory trick') || t.includes('💡')) return 'memory';
          if (t.includes('easy example') || t.includes('🌟')) return 'example';
          if (t.includes('high-yield') || t.includes('🏆') || t.includes('neet points')) return 'high-yield';
          return null;
        };

        if (line.startsWith('#') && isSpecialHeading(line)) {
          const cleanTitle = line.replace(/^#+\s*/, '').trim();
          const calloutType = isSpecialHeading(line)!;
          const calloutLines: string[] = [];
          
          i++;
          while (i < markdownLines.length && !markdownLines[i].startsWith('#') && markdownLines[i].trim() !== '---' && !markdownLines[i].trim().startsWith('[DIAGRAM:')) {
            if (markdownLines[i].trim() !== '') {
              calloutLines.push(markdownLines[i]);
            }
            i++;
          }
          
          blocksList.push({
            type: 'callout',
            calloutType,
            calloutTitle: cleanTitle,
            lines: calloutLines
          });
          continue;
        }

        if (line.startsWith('# ')) {
          blocksList.push({ type: 'h1', text: line.substring(2).trim() });
          i++;
          continue;
        } else if (line.startsWith('## ')) {
          blocksList.push({ type: 'h2', text: line.substring(3).trim() });
          i++;
          continue;
        } else if (line.startsWith('### ')) {
          blocksList.push({ type: 'h3', text: line.substring(4).trim() });
          i++;
          continue;
        }

        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('• ')) {
          const text = trimmedLine.replace(/^[-*•]\s+/, '');
          blocksList.push({ type: 'bullet', text });
          i++;
          continue;
        }

        const numMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          blocksList.push({ type: 'numbered', text: numMatch[2], numberPrefix: numMatch[1] + '.' });
          i++;
          continue;
        }

        blocksList.push({ type: 'paragraph', text: line });
        i++;
      }

      return blocksList;
    };

    // Execute Document Rendering
    drawPageDecorations(1);
    drawClassroomHeader();
    
    const parsedBlocks = parseMarkdownToBlocks(editedContent);
    
    parsedBlocks.forEach((block) => {
      if (block.type === 'h1' && block.text) {
        drawH1(block.text);
      } else if (block.type === 'h2' && block.text) {
        drawH2(block.text);
      } else if (block.type === 'h3' && block.text) {
        drawH3(block.text);
      } else if (block.type === 'bullet' && block.text) {
        drawParagraph(block.text, true);
      } else if (block.type === 'numbered' && block.text) {
        drawParagraph(block.text, false, true, block.numberPrefix);
      } else if (block.type === 'paragraph') {
        drawParagraph(block.text);
      } else if (block.type === 'table' && block.headers && block.rows) {
        drawTableBlock(block.headers, block.rows);
      } else if (block.type === 'callout' && block.calloutType && block.calloutTitle && block.lines) {
        drawCallout(block.calloutType, block.calloutTitle, block.lines);
      } else if (block.type === 'code' && block.lines) {
        drawCodeBlock(block.lines);
      } else if (block.type === 'diagram' && block.diagramDesc && block.diagramLabels) {
        drawDiagramBlock(block.diagramDesc, block.diagramLabels);
      } else if (block.type === 'hr') {
        checkPageOverflow(8);
        doc.setDrawColor(220, 220, 215);
        doc.setLineWidth(0.3);
        doc.line(margin, currentY + 3, margin + maxLineWidth, currentY + 3);
        currentY += 8;
      }
    });

    // Save final PDF file
    doc.save(`${editedTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const handleDownloadPrint = () => {
    // Printable version / Print trigger
    window.print();
  };

  const handleToggleArchive = () => {
    const nextArchived = !document.isArchived;
    onUpdate({
      ...document,
      isArchived: nextArchived,
      lastModified: new Date().toISOString()
    });
  };

  const handleSaveReflection = () => {
    onUpdate({
      ...document,
      reflectionWorked,
      reflectionDidntWork,
      reflectionAdjustments,
      lastModified: new Date().toISOString()
    });
    setReflectionSaved(true);
    setTimeout(() => setReflectionSaved(false), 2000);
  };

  // Group all document reactions by paragraphText
  const groupedReactions: Record<string, { emoji: string; count: number; users: string[] }[]> = {};
  reactions.forEach((curr) => {
    if (!groupedReactions[curr.paragraphText]) {
      groupedReactions[curr.paragraphText] = [];
    }
    const existingEmoji = groupedReactions[curr.paragraphText].find(r => r.emoji === curr.emoji);
    if (existingEmoji) {
      existingEmoji.count += 1;
      existingEmoji.users.push(curr.userName);
    }
  });

  const renderSidebarContent = () => {
    return (
      <div className="space-y-6">
        {/* Active Collaborative Viewers List */}
        <div className="bg-[#fcfbf9] border border-[#e5e1da] rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" /> Active Viewers
            </h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          {activeSessions.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No other teachers are currently viewing this document.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
              <p className="text-[10px] text-slate-500 font-medium">
                {activeSessions.length} other {activeSessions.length === 1 ? 'teacher is' : 'teachers are'} currently viewing:
              </p>
              <div className="space-y-2">
                {activeSessions.map((sess) => (
                  <div 
                    key={sess.id} 
                    className="flex items-center gap-2.5 bg-white border border-slate-100 rounded-xl p-2.5 shadow-2xs hover:shadow-xs transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#5f6f52]/20 to-[#a9b388]/30 flex items-center justify-center text-xs font-bold text-[#5f6f52] shrink-0">
                      {sess.displayName ? sess.displayName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{sess.displayName}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="inline-block px-1 py-0.2 bg-slate-100 rounded text-slate-500 font-medium text-[8px] uppercase">
                          {sess.role || 'Teacher'}
                        </span>
                        {sess.isEditing ? (
                          <span className="inline-block px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[8px] font-bold uppercase animate-pulse">
                            ✍️ Editing
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded text-[8px] font-bold uppercase">
                            👁️ Viewing
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">
                        {sess.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lesson Pacing Timer Card */}
        <div className="bg-white border border-[#e5e1da] rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#5f6f52]"></div>
          
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-[#5f6f52]" /> Lesson Pacing Timer
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTimerIsFloating(!timerIsFloating)}
                className={`p-1 rounded hover:bg-slate-100 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                  timerIsFloating ? 'text-[#5f6f52] bg-[#5f6f52]/10' : 'text-slate-400'
                }`}
                title={timerIsFloating ? "Dock timer to sidebar" : "Enable floating overlay timer"}
              >
                <span>{timerIsFloating ? 'Floating Active' : 'Float'}</span>
              </button>
              
              <button
                onClick={() => setTimerIsFullScreen(true)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#5f6f52] transition text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
                title="Expand pacing board to Full Screen"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Fullscreen</span>
              </button>
            </div>
          </div>

          {/* Current Stage Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Lesson Phase</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { name: 'Warm-Up', icon: '🎯' },
                { name: 'Direct Instr.', val: 'Direct Instruction', icon: '📖' },
                { name: 'Guided Prac.', val: 'Guided Practice', icon: '👥' },
                { name: 'Indep. Prac.', val: 'Independent Practice', icon: '📝' },
                { name: 'Exit Ticket', icon: '🎟️' },
                { name: 'Custom', icon: '⚙️' }
              ].map((phase) => {
                const phaseVal = phase.val || phase.name;
                const isSelected = timerPhase === phaseVal;
                return (
                  <button
                    key={phase.name}
                    onClick={() => {
                      setTimerPhase(phaseVal);
                      if (phaseVal !== 'Custom') {
                        setCustomPhaseName('');
                      }
                    }}
                    className={`px-2 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#5f6f52] text-white border-[#5f6f52]'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{phase.icon}</span>
                    <span className="truncate">{phase.name}</span>
                  </button>
                );
              })}
            </div>
            
            {timerPhase === 'Custom' && (
              <input
                type="text"
                value={customPhaseName}
                onChange={(e) => setCustomPhaseName(e.target.value)}
                placeholder="Enter custom lesson phase..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5f6f52] transition placeholder-slate-400"
              />
            )}
          </div>

          {/* Digital Clock Display with Circular Countdown Ring */}
          <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl border border-slate-150 relative overflow-hidden">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className="stroke-slate-200 fill-none"
                  strokeWidth="6"
                />
                {/* Active progress circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className={`fill-none transition-all duration-1000 ease-linear ${
                    timerIsActive && timerSecondsLeft <= 30 
                      ? 'stroke-rose-600 animate-pulse' 
                      : 'stroke-[#5f6f52]'
                  }`}
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - (timerDuration > 0 ? timerSecondsLeft / timerDuration : 0))}
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Centered Digital Time Text */}
              <div className="absolute flex flex-col items-center justify-center">
                {!timerIsActive && timerSecondsLeft < timerDuration && timerSecondsLeft > 0 && (
                  <span className="text-[8px] font-extrabold bg-amber-500 text-white px-1.5 py-0.5 rounded-md tracking-wider uppercase mb-1 leading-none shadow-xs animate-pulse">
                    Paused
                  </span>
                )}
                <div className={`text-2xl font-black font-mono tracking-wider flex items-center gap-0.5 transition-colors duration-500 ${
                  timerIsActive && timerSecondsLeft <= 30 ? 'text-rose-600 animate-pulse' : 'text-slate-800'
                }`}>
                  <span>{Math.floor(timerSecondsLeft / 60).toString().padStart(2, '0')}</span>
                  <span className={`${timerIsActive ? 'animate-pulse' : ''}`}>:</span>
                  <span>{(timerSecondsLeft % 60).toString().padStart(2, '0')}</span>
                </div>
                <p className={`text-[9px] font-bold mt-0.5 tracking-wider uppercase max-w-[90px] truncate text-center transition-colors duration-500 ${
                  timerIsActive && timerSecondsLeft <= 30 ? 'text-rose-600' : 'text-[#5f6f52]'
                }`}>
                  {timerPhase === 'Custom' ? (customPhaseName || 'CUSTOM') : timerPhase.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Custom Time Setter Controls */}
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max="180"
                value={Math.floor(timerDuration / 60)}
                onChange={(e) => {
                  const mins = Math.max(0, parseInt(e.target.value) || 0);
                  const secs = timerDuration % 60;
                  const newTotal = mins * 60 + secs;
                  setTimerDuration(newTotal);
                  setTimerSecondsLeft(newTotal);
                  setTimerIsActive(false);
                }}
                disabled={timerIsActive}
                className="w-12 bg-slate-50 border border-slate-200 text-slate-700 p-1.5 rounded-lg text-xs font-black text-center focus:outline-none focus:border-[#5f6f52] disabled:opacity-50"
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Min</span>
              <input
                type="number"
                min="0"
                max="59"
                value={timerDuration % 60}
                onChange={(e) => {
                  const secs = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                  const mins = Math.floor(timerDuration / 60);
                  const newTotal = mins * 60 + secs;
                  setTimerDuration(newTotal);
                  setTimerSecondsLeft(newTotal);
                  setTimerIsActive(false);
                }}
                disabled={timerIsActive}
                className="w-12 bg-slate-50 border border-slate-200 text-slate-700 p-1.5 rounded-lg text-xs font-black text-center focus:outline-none focus:border-[#5f6f52] disabled:opacity-50"
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sec</span>
            </div>

            {/* Quick Adjusters */}
            <div className="flex gap-1">
              <button
                onClick={() => {
                  const newTotal = Math.max(60, timerDuration - 60);
                  setTimerDuration(newTotal);
                  setTimerSecondsLeft(newTotal);
                }}
                disabled={timerIsActive || timerDuration <= 60}
                className="px-1.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-slate-600 disabled:opacity-40 cursor-pointer"
                title="Subtract 1 minute"
              >
                -1m
              </button>
              <button
                onClick={() => {
                  const newTotal = timerDuration + 60;
                  setTimerDuration(newTotal);
                  setTimerSecondsLeft(newTotal);
                }}
                disabled={timerIsActive}
                className="px-1.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-slate-600 disabled:opacity-40 cursor-pointer"
                title="Add 1 minute"
              >
                +1m
              </button>
            </div>
          </div>

          {/* Quick presets row */}
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Presets:</span>
            {[2, 5, 10, 15, 20, 30].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setTimerDuration(mins * 60);
                  setTimerSecondsLeft(mins * 60);
                  setTimerIsActive(false);
                }}
                disabled={timerIsActive}
                className="px-2 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[#5f6f52] transition cursor-pointer disabled:opacity-50"
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Control Bar */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => timerIsActive ? setTimerIsActive(false) : startPacingWithNotificationRequest()}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                timerIsActive
                  ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white'
                  : 'bg-[#5f6f52] hover:bg-[#4d5a42] border-[#5f6f52] text-white'
              }`}
            >
              {timerIsActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-white" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-white" />
                  <span>{timerSecondsLeft < timerDuration && timerSecondsLeft > 0 ? 'Resume' : 'Start Pacing'}</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setTimerIsActive(false);
                setTimerSecondsLeft(timerDuration);
              }}
              className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-600 transition cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTimerIsSoundEnabled(!timerIsSoundEnabled)}
              className={`p-2 border rounded-xl transition cursor-pointer ${
                timerIsSoundEnabled
                  ? 'bg-[#5f6f52]/10 border-[#5f6f52]/20 text-[#5f6f52] hover:bg-[#5f6f52]/20'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
              }`}
              title={timerIsSoundEnabled ? "Chime enabled on finish" : "Chime muted"}
            >
              {timerIsSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="bg-[#f4f1ea] border border-[#e5e1da] rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-[#a9b388] uppercase tracking-[0.2em]">Material Details</h3>
          
          <div className="space-y-3.5 text-sm">
            <div className="pb-3.5 border-b border-[#e5e1da] space-y-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#5f6f52]" /> Scheduled Date
                </p>
                {isStudent ? (
                  <p className="font-semibold text-slate-700">
                    {document.scheduledDate ? new Date(document.scheduledDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not Scheduled'}
                  </p>
                ) : (
                  <input
                    type="date"
                    value={document.scheduledDate || ''}
                    onChange={(e) => {
                      onUpdate({
                        ...document,
                        scheduledDate: e.target.value,
                        lastModified: new Date().toISOString()
                      });
                    }}
                    className="bg-white border border-[#e5e1da] text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:border-[#5f6f52] transition w-full cursor-pointer"
                  />
                )}
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <span className="text-xs">⏰</span> Scheduled Time
                </p>
                {isStudent ? (
                  <p className="font-semibold text-slate-700">
                    {document.scheduledTime ? `${document.scheduledTime}` : 'No Time Scheduled'}
                  </p>
                ) : (
                  <input
                    type="time"
                    value={document.scheduledTime || ''}
                    onChange={(e) => {
                      onUpdate({
                        ...document,
                        scheduledTime: e.target.value,
                        lastModified: new Date().toISOString()
                      });
                    }}
                    className="bg-white border border-[#e5e1da] text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:border-[#5f6f52] transition w-full cursor-pointer"
                  />
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Framework</p>
              <p className="font-semibold text-slate-700">
                {document.curriculum === 'cbc' ? 'Kenyan CBC' : 'Standard Outcomes Syllabus'}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Subject / Area</p>
              <p className="font-semibold text-slate-700">{document.subject}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Class Level</p>
              <p className="font-semibold text-slate-700">{document.classLevel}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Topic Strand</p>
              <p className="font-semibold text-slate-700">{document.topic}</p>
            </div>

            {document.subTopic && (
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Sub-Topic</p>
                <p className="font-semibold text-slate-700">{document.subTopic}</p>
              </div>
            )}

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">
                {document.docType === 'scheme-of-work' ? 'Individual Lesson Duration' : 'Target Duration'}
              </p>
              <p className="font-semibold text-slate-700">{document.duration || '40 minutes'}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Timer className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Estimated Reading Time</span>
              </p>
              <p className="font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-md text-xs font-bold">
                  ~{liveReadingTimeMin} min read
                </span>
                <span className="text-[10px] text-slate-500 font-mono">({liveWordCount.toLocaleString()} words)</span>
              </p>
            </div>

            {document.docType === 'scheme-of-work' && (
              <>
                {document.lessonsPerWeek && (
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Lessons Per Week</p>
                    <p className="font-semibold text-slate-700">{document.lessonsPerWeek} lessons</p>
                  </div>
                )}
                {document.weeksPerTerm && (
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Weeks Per Term</p>
                    <p className="font-semibold text-slate-700">{document.weeksPerTerm} weeks</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="pt-3 border-t border-[#e5e1da] text-xs text-slate-400 space-y-1">
            <p>Generated: {new Date(document.createdAt).toLocaleString()}</p>
            <p>Last Modified: {new Date(document.lastModified).toLocaleString()}</p>
          </div>
        </div>

        {/* AI Quality Audit Sidebar Section */}
        <div className="bg-[#fcfbf9] border border-[#e5e1da] rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Cpu className="w-4 h-4 text-emerald-600" /> AI Pedagogical Audit
            </h3>
            {document.aiReview && (
              <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg">
                Score: {document.aiReview.overallScore}/100
              </span>
            )}
          </div>

          {document.aiReview ? (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl space-y-1">
                <p className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">Audit Verdict</p>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {document.aiReview.summary.substring(0, 110)}...
                </p>
              </div>

              {/* Progress checklist indicator */}
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>Goals Met: {document.aiReview.objectivesReview.score}%</span>
                <span>Syllabus: {document.aiReview.curriculumReview.score}%</span>
              </div>

              <button
                onClick={() => setIsAIReviewerOpen(true)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>View Full Quality Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Evaluate this document's learning objectives, curriculum standards alignment, and assessments using our AI Expert Auditor.
              </p>
              <button
                onClick={() => setIsAIReviewerOpen(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Audit Document Quality</span>
              </button>
            </div>
          )}
        </div>

        {/* Readability & reading complexity indicator card */}
        {(() => {
          const stats = calculateReadability(editedContent);
          return (
            <div className="bg-white border border-[#e5e1da] rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
              
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" /> Reading Complexity
                </h3>
                <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 border border-indigo-150 rounded-lg">
                  Grade {stats.consensusGradeLevel}
                </span>
              </div>

              {/* Summary and main complexity label */}
              <div className="space-y-2">
                <div className={`p-3 rounded-xl border ${stats.bgClass} ${stats.borderClass} ${stats.textClass}`}>
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Estimated Ability</p>
                  <p className="text-xs font-extrabold leading-tight">{stats.gradeLabel}</p>
                  <div className="mt-1 pt-1 border-t border-current/25 flex items-center justify-between text-[10px] font-medium">
                    <span>Flesch-Kincaid Grade:</span>
                    <span className="font-bold">Grade {stats.fleschKincaidGradeLevel.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Actionable teaching advice */}
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Teacher Guidance</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  {stats.consensusGradeLevel <= 2.5 && "Ideal for early readers. Keep sentence lengths below 10 words, prioritize visual diagrams, and avoid multi-syllabic jargon."}
                  {stats.consensusGradeLevel > 2.5 && stats.consensusGradeLevel <= 4.5 && "Suited for lower primary. Uses short paragraphs, straightforward sentence patterns, and direct contextual explanations."}
                  {stats.consensusGradeLevel > 4.5 && stats.consensusGradeLevel <= 6.5 && "Suited for upper primary. Introduce vocabulary lists for complex words. Break long passages into list items."}
                  {stats.consensusGradeLevel > 6.5 && stats.consensusGradeLevel <= 8.5 && "Good junior high baseline. Balances abstract reasoning with definitions. Scrape out nested sentence structures where possible."}
                  {stats.consensusGradeLevel > 8.5 && stats.consensusGradeLevel <= 10.5 && "High school reading depth. Contains more complex terms. Perfect for standard cohorts but check if struggling readers need extra scaffolding."}
                  {stats.consensusGradeLevel > 10.5 && stats.consensusGradeLevel <= 12.5 && "Senior secondary standard. Expects deep abstract reasoning. Provide vocabulary worksheets or split dense instructional text."}
                  {stats.consensusGradeLevel > 12.5 && "Advanced academic / college level. Highly dense or contains heavy technical terminology. Differentiate with simpler versions for struggling readers."}
                </p>
              </div>

              {/* Key breakdown statistics */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5">
                  <p className="text-[9px] uppercase font-bold text-slate-400">Word Count</p>
                  <p className="text-xs font-extrabold text-slate-700">{stats.wordCount}</p>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5">
                  <p className="text-[9px] uppercase font-bold text-slate-400">Sentences</p>
                  <p className="text-xs font-extrabold text-slate-700">{stats.sentenceCount}</p>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5">
                  <p className="text-[9px] uppercase font-bold text-slate-400">Flesch Ease</p>
                  <p className="text-xs font-extrabold text-slate-700">{stats.fleschReadingEase}</p>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5">
                  <p className="text-[9px] uppercase font-bold text-slate-400">F-K Grade Level</p>
                  <p className="text-xs font-extrabold text-slate-700">{stats.fleschKincaidGradeLevel.toFixed(1)}</p>
                </div>
              </div>

              {/* Readability Improvers & Adapters */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Linguistic Tools</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsReadabilitySuggestionsModalOpen(true);
                      handleGenerateReadabilitySuggestions('simplify');
                    }}
                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-700 text-[10px] font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Simplify Text</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsReadabilitySuggestionsModalOpen(true);
                      handleGenerateReadabilitySuggestions('elevate');
                    }}
                    className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 text-[10px] font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Elevate Text</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  const el = window.document.getElementById('reading-level-analyzer-section');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-4', 'ring-indigo-500/30', 'transition-all', 'duration-500');
                    setTimeout(() => {
                      el.classList.remove('ring-4', 'ring-indigo-500/30');
                    }, 2000);
                  }
                }}
                className="w-full py-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50/50 text-[10px] font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm mt-1 bg-white"
              >
                <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                <span>Launch Vocabulary Tuner</span>
              </button>
            </div>
          );
        })()}

        {/* Google Workspace Integration Hub */}
        <div className="bg-[#fcfbf9] border border-[#e5e1da] rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden no-print">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#4285F4]"></div>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="text-base">☁️</span> Google Workspace Hub
            </h3>
            {googleToken && (
              <button
                onClick={handleDisconnectWorkspace}
                className="text-[10px] text-red-500 hover:text-red-700 underline font-semibold transition"
              >
                Disconnect
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Export outlines to Sheets, generate presentation slides, create Google Form quizzes, or schedule teaching sessions on Calendar.
          </p>

          {/* Error & Success Messages */}
          {workspaceErrorMessage && (
            <div className="bg-red-50 border border-red-150 rounded-xl p-3 text-[11px] text-red-700 flex items-start gap-1.5 leading-relaxed">
              <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Error Occurred</p>
                <p>{workspaceErrorMessage}</p>
              </div>
              <button onClick={() => setWorkspaceErrorMessage(null)}>
                <X className="w-3 h-3 text-red-400 hover:text-red-600" />
              </button>
            </div>
          )}

          {workspaceSuccessMessage && (
            <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 text-[11px] text-emerald-800 flex items-start gap-1.5 leading-relaxed">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Success!</p>
                <p>{workspaceSuccessMessage}</p>
              </div>
              <button onClick={() => setWorkspaceSuccessMessage(null)}>
                <X className="w-3 h-3 text-emerald-400 hover:text-emerald-600" />
              </button>
            </div>
          )}

          {/* Status & Connection buttons */}
          {!googleToken ? (
            <div className="pt-2">
              <button
                onClick={handleConnectWorkspace}
                disabled={isWorkspaceLoading}
                className="w-full bg-[#4285F4] hover:bg-[#357ae8] text-white rounded-xl py-2.5 px-4 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-65"
              >
                {isWorkspaceLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                Connect Google Workspace
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 bg-slate-100/70 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="truncate font-medium">Authorized: <strong className="text-slate-800">{googleUserEmail || 'Google Account'}</strong></span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={handleExportSheets}
                  disabled={isWorkspaceLoading}
                  className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded-xl py-2 px-3 text-xs font-semibold transition flex items-center gap-2 disabled:opacity-60"
                >
                  {isWorkspaceLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  )}
                  Export to Google Sheets
                </button>

                <button
                  onClick={handleExportDocs}
                  disabled={isWorkspaceLoading}
                  className="w-full bg-indigo-50 border border-indigo-200 text-indigo-800 hover:bg-indigo-100 rounded-xl py-2 px-3 text-xs font-semibold transition flex items-center gap-2 disabled:opacity-60"
                >
                  {isWorkspaceLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-600" />
                  )}
                  Export to Google Docs
                </button>

                <button
                  onClick={() => setIsCalendarModalOpen(true)}
                  disabled={isWorkspaceLoading}
                  className="w-full bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 rounded-xl py-2 px-3 text-xs font-semibold transition flex items-center gap-2 disabled:opacity-60"
                >
                  {isWorkspaceLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Calendar className="w-4 h-4 text-blue-600" />
                  )}
                  Schedule on Calendar
                </button>

                <button
                  onClick={handleCreateSlides}
                  disabled={isWorkspaceLoading}
                  className="w-full bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-xl py-2 px-3 text-xs font-semibold transition flex items-center gap-2 disabled:opacity-60"
                >
                  {isWorkspaceLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  ) : (
                    <Presentation className="w-4 h-4 text-amber-600" />
                  )}
                  Generate Presentation Slides
                </button>

                <button
                  onClick={() => setIsGmailModalOpen(true)}
                  disabled={isWorkspaceLoading}
                  className="w-full bg-red-50 border border-red-200 text-red-800 hover:bg-red-100 rounded-xl py-2 px-3 text-xs font-semibold transition flex items-center gap-2 disabled:opacity-60"
                >
                  {isWorkspaceLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                  ) : (
                    <Mail className="w-4 h-4 text-red-600" />
                  )}
                  Send Material via Gmail
                </button>

                <button
                  onClick={handleCreateForm}
                  disabled={isWorkspaceLoading}
                  className="w-full bg-purple-50 border border-purple-200 text-purple-800 hover:bg-purple-100 rounded-xl py-2 px-3 text-xs font-semibold transition flex items-center gap-2 disabled:opacity-60"
                >
                  {isWorkspaceLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  ) : (
                    <ClipboardList className="w-4 h-4 text-purple-600" />
                  )}
                  Create Google Forms Quiz
                </button>
              </div>
            </div>
          )}
        </div>

        <DocumentVersionWidget
          document={document}
          currentProfile={profile}
          onRestore={handleRestoreVersion}
        />

        <SharedNotes documentId={document.id} currentProfile={profile} />

        <DocumentFeedbackWidget document={document} currentProfile={profile} />

        <div className="bg-[#fefae0] rounded-2xl p-5 border border-[#e9edc9] space-y-2">
          <h4 className="text-xs font-bold text-[#5f6f52] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#5f6f52]" /> Pedagogy Guidelines
          </h4>
          <p className="text-xs text-[#5f6f52]/85 leading-relaxed">
            This document is generated by the Gemini model with a low temperature settings to align tightly with high-quality teaching structures. Use the **Code Editor** to customize sections or add personalized classroom worksheets before printing.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6 print-full-width relative document-viewer-workspace module-workspace">
      {/* Fixed Top Reading Progress Bar & Quick Jump Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 no-print">
        {/* Progress Bar Line */}
        <div 
          className="h-1.5 bg-slate-200/50 backdrop-blur-xs w-full pointer-events-none"
          title={`Lesson Reading Progress: ${readingProgress}%`}
        >
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(16,185,129,0.7)]"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* Quick Jump to Sections Dropdown (Grouped by Pedagogical Phase with Expand/Collapse) */}
        {quickJumpHeadings.length > 0 && (
          <div className="absolute top-2.5 right-4 sm:right-6 flex items-center gap-2 bg-slate-900/95 text-slate-100 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xl border border-slate-700/80 text-xs font-semibold transition-all z-50">
            <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span className="hidden sm:inline text-[11px] font-bold text-slate-300">Pedagogical Phase Jump:</span>

            {/* Quick Toggle All Action Buttons in Header */}
            <div className="flex items-center gap-1 pr-1.5 border-r border-slate-700/80">
              <button
                onClick={expandAllPhaseGroups}
                className="px-2 py-0.5 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 rounded border border-emerald-500/40 transition cursor-pointer flex items-center gap-1 shrink-0"
                title="Expand All Pedagogical Phase Groups"
              >
                <Eye className="w-3 h-3 text-emerald-400" />
                <span className="hidden md:inline">Expand All</span>
              </button>
              <button
                onClick={collapseAllPhaseGroups}
                className="px-2 py-0.5 text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 rounded border border-rose-500/40 transition cursor-pointer flex items-center gap-1 shrink-0"
                title="Collapse All Pedagogical Phase Groups"
              >
                <EyeOff className="w-3 h-3 text-rose-400" />
                <span className="hidden md:inline">Collapse All</span>
              </button>
            </div>
            
            {/* Visual Iconography Fast-Jump Cues with Collapse Status */}
            <div className="hidden lg:flex items-center gap-1.5 pr-1.5 border-r border-slate-700/80">
              {quickJumpPhaseGroups.map((group) => {
                const isCollapsed = !!collapsedPhaseGroupIds[group.id];
                return (
                  <button
                    key={`top-icon-cue-${group.id}`}
                    onClick={() => {
                      if (isCollapsed) {
                        togglePhaseGroupCollapse(group.id);
                      }
                      if (group.headings.length > 0) {
                        handleJumpToSection(group.headings[0].id);
                      }
                    }}
                    className={`p-1 hover:bg-slate-800 rounded-md transition cursor-pointer flex items-center gap-1 group/icon ${
                      isCollapsed ? 'opacity-40 hover:opacity-100' : 'opacity-100'
                    }`}
                    title={`${group.phaseName} (${group.headings.length} sections)${isCollapsed ? ' - Collapsed (Click to Expand & Jump)' : ' - Expanded'}`}
                  >
                    {renderPhaseIcon(group.id, "w-3.5 h-3.5 transition-transform group-hover/icon:scale-125")}
                    <span className={`text-[10px] hidden xl:inline font-bold ${
                      isCollapsed ? 'text-slate-500 line-through' : 'text-slate-400 group-hover/icon:text-white'
                    }`}>
                      {group.shortName}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Filter & Phase Toggle Popover Button */}
            <div className="relative">
              <button
                onClick={() => setShowPhaseGroupToggleMenu(!showPhaseGroupToggleMenu)}
                className={`p-1 hover:bg-slate-800 rounded-full transition cursor-pointer flex items-center gap-1 ${
                  Object.keys(collapsedPhaseGroupIds).length > 0 ? 'text-amber-400 bg-slate-800' : 'text-slate-400 hover:text-white'
                }`}
                title="Toggle Phase Group Visibility & Expand/Collapse Categories"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {showPhaseGroupToggleMenu && (
                <div className="absolute right-0 top-8 w-64 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-3 z-50 text-xs text-slate-200 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Phase Category Visibility
                    </span>
                    <button
                      onClick={() => setShowPhaseGroupToggleMenu(false)}
                      className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Auto-Collapse Accordion Focus Mode Toggle */}
                  <div
                    onClick={toggleAutoAccordionMode}
                    className={`p-2 rounded-lg border cursor-pointer transition flex items-center justify-between mb-2.5 ${
                      autoAccordionPhaseMode
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                    title="When enabled, expanding a phase category automatically collapses all other phase groups"
                  >
                    <div className="flex items-center gap-2 pr-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-bold text-[11px] leading-snug">Auto-Collapse Accordion</div>
                        <div className="text-[9.5px] text-slate-400">Keep UI focused on 1 active phase</div>
                      </div>
                    </div>
                    <div className={`w-7 h-4 rounded-full p-0.5 transition-colors shrink-0 ${autoAccordionPhaseMode ? 'bg-amber-500' : 'bg-slate-700'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${autoAccordionPhaseMode ? 'translate-x-3' : 'translate-x-0'}`} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 px-1">
                    <button
                      onClick={expandAllPhaseGroups}
                      className="text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={collapseAllPhaseGroups}
                      className="text-rose-400 hover:text-rose-300 underline font-semibold cursor-pointer"
                    >
                      Collapse All
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    {quickJumpPhaseGroups.map((group) => {
                      const isCollapsed = !!collapsedPhaseGroupIds[group.id];
                      return (
                        <div
                          key={`menu-toggle-${group.id}`}
                          onClick={() => togglePhaseGroupCollapse(group.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border ${
                            isCollapsed
                              ? 'bg-slate-950/80 border-slate-800 text-slate-500'
                              : 'bg-slate-800/80 border-slate-700/80 text-slate-100 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            {renderPhaseIcon(group.id, "w-3.5 h-3.5")}
                            <span className="font-medium text-[11px] truncate">{group.shortName}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">({group.headings.length})</span>
                          </div>
                          {isCollapsed ? (
                            <div className="flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900/60 shrink-0">
                              <EyeOff className="w-3 h-3" />
                              <span>Collapsed</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/60 shrink-0">
                              <Eye className="w-3 h-3" />
                              <span>Expanded</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  if (val === '__TOGGLE_ACCORDION_MODE__') {
                    toggleAutoAccordionMode();
                  } else if (val === '__EXPAND_ALL__') {
                    expandAllPhaseGroups();
                  } else if (val === '__COLLAPSE_ALL__') {
                    collapseAllPhaseGroups();
                  } else if (val.startsWith('__TOGGLE_PHASE_')) {
                    const phaseId = val.replace('__TOGGLE_PHASE_', '');
                    togglePhaseGroupCollapse(phaseId);
                  } else {
                    handleJumpToSection(val);
                  }
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="bg-transparent text-slate-100 hover:text-white font-medium text-xs border-none outline-none cursor-pointer pr-1 py-0.5 focus:ring-0 max-w-[150px] sm:max-w-[220px] truncate"
              title="Quick Jump to Sections (Automatically grouped by Pedagogical Phase)"
              id="pedagogical-quick-jump-select"
            >
              <option value="" disabled className="bg-slate-900 text-slate-400">
                Jump to Phase / Section ({quickJumpHeadings.length})...
              </option>
              <option value="__TOGGLE_ACCORDION_MODE__" className="bg-slate-950 text-amber-300 font-extrabold">
                {autoAccordionPhaseMode ? '⚡ Auto-Collapse Accordion: ON (Focus 1 Phase)' : '⚡ Auto-Collapse Accordion: OFF (Click to Enable)'}
              </option>
              <option value="__EXPAND_ALL__" className="bg-slate-950 text-emerald-400 font-bold">
                📂 Expand All Phase Groups
              </option>
              <option value="__COLLAPSE_ALL__" className="bg-slate-950 text-rose-400 font-bold">
                📁 Collapse All Phase Groups
              </option>
              {quickJumpPhaseGroups.map((group) => {
                const isCollapsed = !!collapsedPhaseGroupIds[group.id];
                if (isCollapsed) {
                  return (
                    <optgroup
                      key={group.id}
                      label={`📁 ${group.iconEmoji} ${group.phaseName} (${group.headings.length} - COLLAPSED)`}
                      className="bg-slate-900 text-slate-500 font-bold italic"
                    >
                      <option
                        value={`__TOGGLE_PHASE_${group.id}`}
                        className="bg-slate-900 text-emerald-400 font-extrabold"
                      >
                        ▶ Click to Expand {group.shortName} ({group.headings.length} sections)...
                      </option>
                    </optgroup>
                  );
                }

                return (
                  <optgroup
                    key={group.id}
                    label={`📖 ${group.iconEmoji} ${group.phaseName} (${group.headings.length})`}
                    className="bg-slate-900 text-amber-300 font-extrabold"
                  >
                    <option
                      value={`__TOGGLE_PHASE_${group.id}`}
                      className="bg-slate-900 text-rose-400 font-semibold"
                    >
                      ▼ Collapse {group.shortName} phase category...
                    </option>
                    {group.headings.map((h, index) => (
                      <option key={`${h.id}-${index}`} value={h.id} className="bg-slate-900 text-slate-200 font-medium pl-2">
                        {h.level === 1 ? '• ' : h.level === 2 ? '  ↳ ' : '    - '}
                        {h.text}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded-full shrink-0">
              {readingProgress}%
            </span>
          </div>
        )}
      </div>
      <style>{`
        @media print {
          /* Hide non-essential UI elements like top action bars, editor toggles, sidebars, popups */
          .no-print,
          button,
          .action-header,
          .preview-toggle-bar,
          .theme-toggle-bar,
          .right-info-sidebar,
          header,
          footer,
          nav,
          aside {
            display: none !important;
          }

          /* Force full page width and remove screen borders/shadows/paddings on print */
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }

          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          /* Break the grid layout so the preview element takes up the full width */
          .grid {
            display: block !important;
          }

          /* Force background colors and background images to print cleanly */
          .notebook-paper {
            background-color: #faf6ee !important;
            background-image: linear-gradient(#c5d1e0 1px, transparent 1px) !important;
            background-size: 100% 1.85rem !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
            border: 1px solid #eadecd !important;
            padding-left: 4.5rem !important;
            padding-right: 2rem !important;
            padding-top: 2.5rem !important;
            padding-bottom: 2.5rem !important;
            margin: 0 !important;
            border-radius: 12px !important;
            min-height: 100% !important;
          }

          /* Maintain red line and ring binders on notebook paper in print */
          .notebook-paper::before {
            background-color: rgba(239, 68, 68, 0.4) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            left: 3.5rem !important;
          }

          .notebook-paper::after {
            background-image: radial-gradient(circle, #eadecd 6px, transparent 7px) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            left: 1rem !important;
          }

          /* General text optimization for physical printing */
          .handwritten-content {
            color: #0f172a !important;
            font-size: 1.15rem !important;
          }

          .handwritten-content h1,
          .handwritten-content h2,
          .handwritten-content h3,
          .handwritten-content h4 {
            color: #2c421e !important;
            page-break-after: avoid;
          }

           /* Avoid breaking images and headings across pages */
          img, .diagram-card {
            page-break-inside: avoid !important;
            max-height: 5.5in !important;
            object-fit: contain !important;
          }

          /* Force layout integrity when printing the simulated handout sheet */
          .print-sheet-mockup {
            border: none !important;
            box-shadow: none !important;
            padding: 0.5in !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          .print-sheet-mockup .prose {
            color: #000000 !important;
            font-size: 10pt !important;
            line-height: 1.35 !important;
          }

          /* General element-level vertical spacing overrides inside physical print to minimize paper waste */
          .print-sheet-mockup h1,
          .print-sheet-mockup h2,
          .print-sheet-mockup h3,
          .print-sheet-mockup h4 {
            margin-top: 0.5rem !important;
            margin-bottom: 0.25rem !important;
            line-height: 1.15 !important;
            page-break-after: avoid;
          }

          .print-sheet-mockup p,
          .print-sheet-mockup ul,
          .print-sheet-mockup ol,
          .print-sheet-mockup blockquote,
          .print-sheet-mockup li {
            margin-top: 0.15rem !important;
            margin-bottom: 0.15rem !important;
            line-height: 1.3 !important;
          }

          .print-sheet-mockup li {
            margin-bottom: 0.1rem !important;
          }

          .print-sheet-mockup table {
            margin-top: 0.5rem !important;
            margin-bottom: 0.5rem !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .print-sheet-mockup th,
          .print-sheet-mockup td {
            padding: 4px 6px !important;
            font-size: 8.5pt !important;
            line-height: 1.2 !important;
          }

          .print-sheet-mockup hr {
            margin-top: 0.4rem !important;
            margin-bottom: 0.4rem !important;
          }

          .print-sheet-mockup pre,
          .print-sheet-mockup code {
            font-size: 8.5pt !important;
            line-height: 1.2 !important;
            padding: 0.25rem !important;
          }

          /* Compact notebook paper layout for physical prints */
          .notebook-paper {
            background-color: #ffffff !important;
            padding-left: 2.5rem !important;
            padding-right: 1.5rem !important;
            padding-top: 1.5rem !important;
            padding-bottom: 1.5rem !important;
            line-height: 1.35 !important;
            border-radius: 0 !important;
          }

          .notebook-paper h1,
          .notebook-paper h2,
          .notebook-paper h3,
          .notebook-paper h4 {
            margin-top: 0.4rem !important;
            margin-bottom: 0.2rem !important;
            line-height: 1.15 !important;
          }

          .notebook-paper p,
          .notebook-paper li {
            margin-top: 0.15rem !important;
            margin-bottom: 0.15rem !important;
          }
        }
      `}</style>

      {/* Floating Quick Study Control Bar */}
      {isQuickStudyMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-4 border border-slate-700/80 text-xs font-bold no-print"
        >
          <div className="flex items-center gap-2 text-amber-300">
            <BookOpen className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-extrabold tracking-wide">Quick Study Mode</span>
          </div>
          <span className="w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-2 text-slate-300 text-[11px] font-mono">
            <Timer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{liveReadingTimeMin} min read • {liveWordCount.toLocaleString()} words • {readingProgress}% read</span>
          </div>
          <span className="w-px h-4 bg-slate-700" />
          <button
            onClick={() => setIsQuickStudyMode(false)}
            className="flex items-center gap-1.5 text-slate-100 hover:text-white bg-amber-600 hover:bg-amber-700 px-3.5 py-1.5 rounded-full transition cursor-pointer text-xs font-bold shadow-xs"
            title="Exit Quick Study Mode"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit Quick Study</span>
          </button>
        </motion.div>
      )}

      {/* Action Header */}
      {!isQuickStudyMode && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print action-header">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-[#5f6f52] transition text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Return to List
          </button>

          {/* Collaborative Presence Avatar Group */}
          {activeSessions.length > 0 && (
            <div className="flex items-center gap-2 bg-[#f4f1ea]/45 px-3 py-1.5 rounded-full border border-[#e5e1da]/60">
              <div className="flex -space-x-2 overflow-hidden">
                {activeSessions.map((sess) => {
                  const colors = [
                    'from-rose-400 to-rose-500 text-rose-100',
                    'from-sky-400 to-sky-500 text-sky-100',
                    'from-emerald-400 to-emerald-500 text-emerald-100',
                    'from-amber-400 to-amber-500 text-amber-100',
                    'from-indigo-400 to-indigo-500 text-indigo-100',
                    'from-fuchsia-400 to-fuchsia-500 text-fuchsia-100',
                    'from-cyan-400 to-cyan-500 text-cyan-100',
                  ];
                  const colorIdx = Math.abs(sess.userId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % colors.length;
                  const colorSet = colors[colorIdx];
                  return (
                    <div
                      key={`avatar-${sess.id}`}
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-gradient-to-tr ${colorSet} text-[9px] font-bold shadow-xs relative group cursor-help`}
                    >
                      {sess.displayName ? sess.displayName.charAt(0).toUpperCase() : '?'}
                      {/* Active state badge on avatar */}
                      <span className={`absolute bottom-0 right-0 block h-1.5 w-1.5 rounded-full ring-0.5 ring-white ${sess.isEditing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                      
                      {/* Tooltip Card */}
                      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-md whitespace-nowrap z-50">
                        <p className="font-bold text-white">{sess.displayName}</p>
                        <p className="text-[8px] text-slate-300 font-normal">{sess.email}</p>
                        <p className="text-[8px] font-bold text-emerald-400 mt-0.5 uppercase tracking-wider">
                          {sess.isEditing ? '✍️ Editing' : '👁️ Viewing'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <span className="text-[10px] font-bold text-[#5f6f52]/90 hidden md:inline">
                {activeSessions.length} {activeSessions.length === 1 ? 'other teacher is' : 'other teachers are'} active
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isStudent && (
            isEditing ? (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-[#5f6f52] text-white hover:bg-[#4d5a42] px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 bg-[#f4f1ea] border border-[#e5e1da] text-[#5f6f52] hover:bg-[#e9e5db] px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Material
              </button>
            )
          )}

          {/* Subtle Firestore Sync Status / Last Saved Indicator */}
          {!isStudent && (
            <div 
              id="firestore-sync-indicator"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium border select-none transition-all duration-300 ${
                syncStatus === 'syncing'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-700'
                  : syncStatus === 'error'
                  ? 'bg-red-50/70 border-red-200 text-red-700'
                  : 'bg-emerald-50/30 border-emerald-100/70 text-slate-500'
              }`}
              title="Real-time document sync status with Firestore cloud database"
            >
              {syncStatus === 'syncing' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : syncStatus === 'error' ? (
                <>
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  <span className="font-semibold">Sync Error</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Last Saved: <span className="font-semibold text-slate-600">{lastSavedSyncTime}</span></span>
                </>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setIsSummaryModalOpen(true);
              handleGenerateSummary();
            }}
            className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Generate AI 3-Bullet Point Summary"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Summarize Lesson
          </button>

          {!isStudent && (
            <button
              type="button"
              onClick={handleGenerateStudyGuide}
              disabled={isGeneratingStudyGuide}
              className={`flex items-center gap-1.5 border px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:cursor-not-allowed ${
                isGeneratingStudyGuide
                  ? 'bg-amber-100 border border-amber-200 text-amber-800 animate-pulse'
                  : 'bg-amber-50 border border-amber-200/55 text-amber-800 hover:bg-amber-100'
              }`}
              title="Generate a condensed student-friendly Study Guide from this material and save to library"
            >
              <BookOpen className={`w-3.5 h-3.5 ${isGeneratingStudyGuide ? 'animate-spin text-amber-700' : 'text-amber-600'}`} />
              <span>{isGeneratingStudyGuide ? 'Generating Study Guide...' : 'Create Study Guide'}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-white border border-[#e5e1da] text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold transition"
            title="Copy Markdown"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 bg-[#5f6f52]/10 border border-[#5f6f52]/30 text-[#5f6f52] hover:bg-[#5f6f52]/20 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Export current document as a formatted PDF for offline use"
          >
            <FileText className="w-3.5 h-3.5 text-[#5f6f52]" />
            <span>Export PDF</span>
          </button>

          <button
            type="button"
            onClick={handleShareByEmail}
            className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Open a pre-formatted email draft using a mailto: link to share with school administrators"
            id="share-via-email-btn"
          >
            <Mail className="w-3.5 h-3.5 text-rose-600" />
            <span>Email Administrator</span>
          </button>

          {/* Export & Download Menu */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setIsDownloadDropdownOpen(!isDownloadDropdownOpen)}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-[#e5e1da] dark:border-slate-700 text-[#5f6f52] dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="Download document in different formats (PDF, Word, Markdown, etc.)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {isDownloadDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDownloadDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                  <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                    <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Select Export Format</p>
                  </div>
                  
                  {/* PDF Document */}
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadPDF();
                      setIsDownloadDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-3 transition"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-800/60 flex items-center justify-center text-red-500 dark:text-red-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="leading-tight font-extrabold text-slate-900 dark:text-slate-100">PDF Document (.pdf)</p>
                      <p className="text-[9.5px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">Formatted A4 print-ready PDF</p>
                    </div>
                  </button>

                  {/* Microsoft Word (.doc) */}
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadWord();
                      setIsDownloadDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-3 transition"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="leading-tight font-extrabold text-slate-900 dark:text-slate-100">Microsoft Word (.doc)</p>
                      <p className="text-[9.5px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">Editable document for Word/Pages</p>
                    </div>
                  </button>

                  {/* Markdown Source (.md) */}
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadMarkdown();
                      setIsDownloadDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-3 transition"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="leading-tight font-extrabold text-slate-900 dark:text-slate-100">Markdown Source (.md)</p>
                      <p className="text-[9.5px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">Raw markdown file for code editors</p>
                    </div>
                  </button>

                  {/* PNG Image */}
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadPNG();
                      setIsDownloadDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-3 transition border-t border-slate-100 dark:border-slate-700/60"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Image className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="leading-tight font-extrabold text-slate-900 dark:text-slate-100">PNG Image (1-Page A4)</p>
                      <p className="text-[9.5px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">Single-page visual image snapshot</p>
                    </div>
                  </button>

                  {/* CSV Metadata */}
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadCSV();
                      setIsDownloadDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-3 transition"
                    title="Export structured document data and metadata as CSV"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="leading-tight font-extrabold text-slate-900 dark:text-slate-100">CSV Spreadsheet (.csv)</p>
                      <p className="text-[9.5px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">Structured data for LMS & grading</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {!isStudent && (
            <button
              onClick={() => setIsDiagramGeneratorOpen(true)}
              className="flex items-center gap-1.5 bg-[#5f6f52]/15 border border-[#5f6f52]/35 text-[#5f6f52] hover:bg-[#5f6f52]/25 px-4 py-2 rounded-xl text-xs font-bold transition"
              title="Scan & generate diagrams for placeholders"
            >
              <Image className="w-3.5 h-3.5" /> Diagram Helper
            </button>
          )}

          <button
            onClick={() => setIsPrintPreviewOpen(true)}
            className="flex items-center gap-1.5 bg-[#d4a373] text-white hover:bg-[#b07e4d] px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
            title="Open Print Studio & PDF Preview"
          >
            <FileText className="w-3.5 h-3.5" /> Print Preview & PDF
          </button>

          <button
            onClick={() => setIsQuizBuilderOpen(true)}
            className="flex items-center gap-1.5 bg-[#5f6f52] text-white hover:bg-[#4d5a42] px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
            title="AI Interactive Quiz Builder & Homework Generator"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> Interactive Quiz
          </button>

          <button
            onClick={() => setIsStandardsMapperOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
            title="Map lesson plan and assessments to curriculum standards (Kenyan CBC or International)"
          >
            <Award className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> Syllabus Standards
          </button>

          <button
            onClick={() => setIsKenyanCheckerOpen(true)}
            className="flex items-center gap-1.5 bg-[#990000] hover:bg-[#800000] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer font-sans"
            title="Perform a Quality Assurance evaluation on this document against KICD (CBC/8-4-4) standards"
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> 🇰🇪 Kenyan CBC Checker
          </button>

          <button
            onClick={() => setIsCurriculumValidatorOpen(true)}
            className="flex items-center gap-1.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer font-sans"
            title="Run the Kenyan Curriculum Standards Validator tool against KICD requirements catalog"
          >
            <Scroll className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> 🇰🇪 Curriculum Validator
          </button>

          <button
            onClick={handleDirectAutoAlign}
            disabled={isAutoAligningDirect}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer font-sans disabled:opacity-50"
            title="Perform compliance evaluation and trigger automatic AI rewrite to align document with Kenyan Curriculum standards"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isAutoAligningDirect ? 'animate-spin' : 'animate-pulse'}`} />
            <span>{isAutoAligningDirect ? 'Aligning...' : '🇰🇪 Auto-Align standards'}</span>
          </button>

          <button
            onClick={() => setIsAIReviewerOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer font-sans"
            title="Submit lesson plan, worksheet, or assessment items for an expert AI Pedagogical Review"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>AI Expert Review</span>
          </button>

          <button
            onClick={() => setIsQRCodeModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
            title="Share document or generate classroom QR access portal"
          >
            <Share2 className="w-3.5 h-3.5" /> Share Material
          </button>

          <button
            type="button"
            onClick={() => {
              saveCurriculumDocsToOfflineCache([document]);
              setIsOfflineCachedNotice(true);
              setTimeout(() => setIsOfflineCachedNotice(false), 3000);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-slate-100 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            title="Precache this lesson document in PWA Service Worker & IndexedDB for offline classroom presentation"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isOfflineCachedNotice ? 'Cached Offline!' : 'Offline Ready'}</span>
          </button>

          <button
            onClick={() => setIsWhiteboardOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
            title="Sketch diagrams, flowcharts, or lesson notes on the interactive whiteboard"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-200 fill-indigo-200 animate-pulse" /> Lesson Sketchpad
          </button>

          <button
            onClick={toggleQuickStudyMode}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition border cursor-pointer ${
              isQuickStudyMode
                ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-500/30'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-amber-600/90 shadow-xs'
            }`}
            title="Activate Quick Study Mode: Hides sidebars, header, and toolbars for a centered wide-margin reading view"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-100" />
            <span>{isQuickStudyMode ? 'Exit Quick Study' : 'Quick Study 📖'}</span>
          </button>

          <button
            onClick={toggleFocusMode}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition border cursor-pointer no-print ${
              isFocusMode
                ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700 shadow-xs'
            }`}
            title={isFocusMode ? "Exit Focus Mode: Restores sidebars and navigation menus" : "Activate Focus Mode: Collapses sidebars and navigation menus for a distraction-free writing environment"}
          >
            {isFocusMode ? <Minimize2 className="w-3.5 h-3.5 text-emerald-200" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isFocusMode ? 'Exit Focus Mode' : 'Focus Mode 🎯'}</span>
          </button>

          <button
            onClick={() => setIsSocraticSidebarOpen(!isSocraticSidebarOpen)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition ${
              isSocraticSidebarOpen
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse'
            }`}
            title="Open interactive Socratic Tutor AI Sidebar to discuss this material"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> Socratic AI Sidebar
          </button>

          {!isStudent && (
            <button
              onClick={handleToggleArchive}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition border ${
                document.isArchived
                  ? 'bg-[#d4a373]/25 border-[#d4a373]/45 text-[#b07e4d] hover:bg-[#d4a373]/35'
                  : 'bg-[#5f6f52]/10 border-[#5f6f52]/20 text-[#5f6f52] hover:bg-[#5f6f52]/20'
              }`}
              title={document.isArchived ? "Restore lesson from Archive" : "Archive lesson to record pedagogical reflection"}
            >
              <Archive className="w-3.5 h-3.5" /> {document.isArchived ? "Unarchive" : "Archive Lesson"}
            </button>
          )}

          <button
            onClick={() => {
              setIsCommentsOpen(!isCommentsOpen);
              setIsParentChatOpen(false);
              setIsReactionsSidebarOpen(false);
              setIsAnnotationsOpen(false);
              setIsVersionsSidebarOpen(false);
              setIsAccessibilityOpen(false);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition border ${
              isCommentsOpen
                ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
                : 'bg-white border-[#e5e1da] text-slate-600 hover:bg-slate-50'
            }`}
            title="Open comments sidebar to leave specific feedback"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-600" /> Comments ({comments.length})
          </button>

          <button
            onClick={() => {
              setIsReactionsSidebarOpen(!isReactionsSidebarOpen);
              setIsParentChatOpen(false);
              setIsCommentsOpen(false);
              setIsAnnotationsOpen(false);
              setIsVersionsSidebarOpen(false);
              setIsAccessibilityOpen(false);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition border ${
              isReactionsSidebarOpen
                ? 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100'
                : 'bg-white border-[#e5e1da] text-slate-600 hover:bg-slate-50'
            }`}
            title="Open quick reactions summary for review"
          >
            <Smile className="w-3.5 h-3.5 text-rose-600" /> Reactions ({reactions.length})
          </button>

          <button
            onClick={() => {
              setIsAnnotationsOpen(!isAnnotationsOpen);
              setIsCommentsOpen(false);
              setIsParentChatOpen(false);
              setIsReactionsSidebarOpen(false);
              setIsVersionsSidebarOpen(false);
              setIsAccessibilityOpen(false);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition border ${
              isAnnotationsOpen
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900 hover:bg-emerald-200'
                : 'bg-white border-[#e5e1da] text-slate-600 hover:bg-slate-50'
            }`}
            title="Open private notes and annotations sidebar"
          >
            <Bookmark className="w-3.5 h-3.5 text-emerald-600" /> Private Notes ({annotations.length})
          </button>

          {(profile?.role === 'Parent' || profile?.role === 'Teacher' || profile?.role === 'Administrator') && (
            <button
              onClick={() => {
                setIsParentChatOpen(!isParentChatOpen);
                setIsCommentsOpen(false);
                setIsAnnotationsOpen(false);
                setIsReactionsSidebarOpen(false);
                setIsVersionsSidebarOpen(false);
                setIsAccessibilityOpen(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition border ${
                isParentChatOpen
                  ? 'bg-purple-100 border-purple-300 text-purple-900 hover:bg-purple-200'
                  : 'bg-white border-[#e5e1da] text-slate-600 hover:bg-slate-50'
              }`}
              title="Open parent-teacher real-time feedback & messaging channel"
            >
              <MessageCircle className="w-3.5 h-3.5 text-purple-600" /> Parent Portal
            </button>
          )}

          {!isStudent && (
            <button
              onClick={() => {
                setIsVersionsSidebarOpen(!isVersionsSidebarOpen);
                setIsParentChatOpen(false);
                setIsCommentsOpen(false);
                setIsReactionsSidebarOpen(false);
                setIsAnnotationsOpen(false);
                setIsAccessibilityOpen(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition border ${
                isVersionsSidebarOpen
                  ? 'bg-indigo-100 border-indigo-300 text-indigo-950 hover:bg-indigo-200'
                  : 'bg-white border-[#e5e1da] text-slate-600 hover:bg-slate-50'
              }`}
              title="Open Version History Sidebar"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" /> Version History
            </button>
          )}

          {/* Translate Dropdown for ESL/EAL student support */}
          <div className="relative inline-block no-print">
            <div 
              className={`flex items-center gap-1.5 border border-sky-200 bg-sky-50/50 text-sky-800 rounded-xl text-xs font-bold shadow-sm transition hover:bg-sky-50/85 hover:border-sky-300 cursor-pointer ${isTranslating ? 'animate-pulse' : ''}`}
              title={isEditing ? "Translate active editor draft to another language" : "Translate document content for ESL/EAL student support"}
            >
              <div className="flex items-center gap-1.5 pl-3.5 pr-1 py-2">
                <Languages className={`w-3.5 h-3.5 text-sky-600 ${isTranslating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Translate:</span>
              </div>
              <select
                value={targetLanguage}
                onChange={(e) => {
                  const langCode = e.target.value;
                  const langObj = TRANSLATE_LANGUAGES.find((l) => l.code === langCode);
                  if (langObj) {
                    handleTranslate(langCode, langObj.name);
                  }
                }}
                disabled={isTranslating}
                className="bg-transparent text-sky-800 text-xs font-bold py-2 pr-3.5 pl-1 rounded-r-xl focus:outline-none cursor-pointer border-0 ring-0 focus:ring-0 select-none outline-none appearance-none disabled:cursor-not-allowed"
              >
                {TRANSLATE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-slate-800 bg-white font-sans">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            {isTranslating && (
              <span className="absolute -bottom-4.5 left-2 text-[10px] text-sky-600 font-bold animate-pulse whitespace-nowrap">
                Translating...
              </span>
            )}
            {translationError && !isTranslating && (
              <span className="absolute -bottom-4.5 left-2 text-[10px] text-red-500 font-bold whitespace-nowrap" title={translationError}>
                ⚠️ Error
              </span>
            )}
          </div>

          {/* Desktop Sidebar Toggle Button */}
          <button
            onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
            className={`hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition border no-print cursor-pointer ${
              isRightSidebarCollapsed
                ? 'bg-[#5f6f52]/10 border-[#5f6f52]/20 text-[#5f6f52] hover:bg-[#5f6f52]/20'
                : 'bg-white border-[#e5e1da] text-slate-600 hover:bg-slate-50'
            }`}
            title={isRightSidebarCollapsed ? "Expand Right Information Sidebar" : "Collapse Right Information Sidebar"}
          >
            {isRightSidebarCollapsed ? (
              <>
                <PanelRightOpen className="w-3.5 h-3.5 text-[#5f6f52]" />
                <span>Show Sidebar</span>
              </>
            ) : (
              <>
                <PanelRightClose className="w-3.5 h-3.5 text-slate-500" />
                <span>Hide Sidebar</span>
              </>
            )}
          </button>

          {/* Mobile-Only Metadata Dialog Button */}
          <button
            onClick={() => setIsMobileMetadataOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-4 py-2 bg-[#5f6f52]/10 border border-[#5f6f52]/20 text-[#5f6f52] hover:bg-[#5f6f52]/20 rounded-xl text-xs font-bold shadow-sm transition no-print cursor-pointer"
            title="Open Document Info, Collaborative Presence & Integrations"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#5f6f52] animate-pulse" />
            <span>Document Info</span>
          </button>

          {/* Real-time Text-to-Speech (TTS) Read Aloud widget */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 gap-2 no-print shadow-xs">
            <Volume2 className={`w-4 h-4 ${isPlayingTts ? 'text-[#5f6f52] animate-bounce' : 'text-slate-400'}`} />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider hidden md:inline">Speech Reader</span>
            <button
              onClick={handleToggleTts}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                isPlayingTts
                  ? isPausedTts
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-[#5f6f52] text-white border border-[#5f6f52]/40'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
              title={isPlayingTts ? isPausedTts ? "Resume Reading Aloud" : "Pause Reading Aloud" : "Read Lesson Aloud (Aural/Oral)"}
            >
              {isPlayingTts ? (
                isPausedTts ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span className="text-[10px]">{isPlayingTts ? isPausedTts ? "Resume" : "Pause" : "Read Aloud"}</span>
            </button>
            {isPlayingTts && (
              <button
                onClick={handleStopTts}
                className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition"
                title="Stop Speech Synthesis"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            )}

            <button
              onClick={() => setIsPodcastModalOpen(true)}
              className="p-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg text-xs font-extrabold shadow-xs transition flex items-center gap-1 cursor-pointer ml-1"
              title="Synthesize this document into an engaging, conversational audio podcast adapted to your confidence level & ESL profile"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
              <span className="text-[10px]">AI Podcast 🎙️</span>
            </button>

            <button
              onClick={() => setIsARHologramOpen(true)}
              className="p-1.5 bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-extrabold shadow-xs transition flex items-center gap-1 cursor-pointer ml-1"
              title="Point device camera at physical desk to view interactive 3D holographic representations of project tasks & models"
            >
              <Box className="w-3.5 h-3.5 text-cyan-200 animate-bounce" />
              <span className="text-[10px]">AR Hologram 🕶️</span>
            </button>

            <span className="w-px h-4 bg-slate-200" />

            <button
              onClick={() => setHighlightAcademicVocab(!highlightAcademicVocab)}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                highlightAcademicVocab
                  ? 'bg-indigo-600 text-white border border-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
              title="Identify and highlight complex academic vocabulary words with instant definitions"
            >
              <Sparkles className={`w-3.5 h-3.5 ${highlightAcademicVocab ? 'text-amber-300 animate-spin' : 'text-indigo-600'}`} />
              <span className="text-[10px]">Academic Vocab {highlightAcademicVocab ? 'On ✨' : 'Off'}</span>
            </button>

            <span className="w-px h-4 bg-slate-200" />

            <button
              onClick={() => {
                setIsAccessibilityOpen(!isAccessibilityOpen);
                setIsCommentsOpen(false);
                setIsReactionsSidebarOpen(false);
                setIsAnnotationsOpen(false);
                setIsVersionsSidebarOpen(false);
              }}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                isAccessibilityOpen
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
              title="Open Dyslexic, ESL & Auditory Assistive Reader Settings"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="text-[10px]">Settings ♿</span>
            </button>

            <span className="w-px h-4 bg-slate-200" />

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-800 text-amber-300 border border-slate-700 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
              title="Toggle Dark Mode for Document Viewer (Persisted in LocalStorage)"
              id="dark-mode-toggle-btn"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              <span className="text-[10px]">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>

          {!isStudent && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this document?')) {
                  onDelete(document.id);
                }
              }}
              className="p-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl transition"
              title="Delete Document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      )}

      {saved && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 animate-fadeIn no-print">
          <Check className="w-4 h-4" /> Your changes have been successfully saved to your pedagogical library!
        </div>
      )}

      {studyGuideSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 animate-fadeIn no-print">
          <Check className="w-4 h-4 text-emerald-600" /> {studyGuideSuccessMessage}
        </div>
      )}

      {studyGuideErrorMessage && (
        <div className="bg-rose-50 border border-rose-150 text-rose-800 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 animate-fadeIn no-print">
          <span className="text-rose-600 font-bold">⚠️</span> {studyGuideErrorMessage}
        </div>
      )}

      {/* Editor & Metadata Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left main column containing material preview and reflections */}
        <div className={`${isQuickStudyMode ? 'max-w-3xl mx-auto w-full' : (isRightSidebarCollapsed ? 'lg:col-span-12' : 'lg:col-span-9 xl:col-span-10')} flex flex-col gap-6 print-full-width`}>
          {/* Side-by-side Layout: Preview Card on left, Comments sidebar on right when open */}
          <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
            <div className="flex-1 min-w-0 w-full">
              {/* Main Renderer or Text Area Card */}
              <motion.div
                key={`doc-card-${document.id || document.title}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                layout
                whileHover={!isFullscreen ? { y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08)" } : undefined}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`${
                  isFullscreen
                    ? isDarkMode ? 'fixed inset-0 z-[100] bg-slate-950 text-slate-100 dark overflow-y-auto p-6 md:p-10 flex flex-col' : 'fixed inset-0 z-[100] bg-white overflow-y-auto p-6 md:p-10 flex flex-col'
                    : isQuickStudyMode
                    ? isDarkMode ? 'bg-slate-900 text-slate-100 dark rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col max-w-3xl mx-auto w-full transition-all duration-300' : 'bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col max-w-3xl mx-auto w-full transition-all duration-300'
                    : isDarkMode ? 'bg-slate-900 text-slate-100 dark rounded-2xl border border-slate-800 shadow-sm overflow-hidden flex flex-col' : 'bg-white rounded-2xl border border-[#e5e1da] shadow-sm overflow-hidden flex flex-col'
                }`}
              >
            {!isQuickStudyMode && (
            <div className="p-4 border-b border-[#e5e1da] bg-[#f4f1ea]/50 flex items-center justify-between no-print preview-toggle-bar">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-2 h-2 rounded-full ${isEditing ? 'bg-amber-400 animate-pulse' : isPrintLayoutPreview ? 'bg-rose-500 animate-pulse' : 'bg-[#5f6f52]'}`}></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {isEditing ? 'Editing Source Code' : isPrintLayoutPreview ? 'Classroom Handout Print Preview' : 'Curriculum-Aligned Output View'}
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200/90 rounded-full text-xs font-bold shadow-2xs">
                <Timer className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Estimated Reading Time: <strong>{liveReadingTimeMin} min read</strong></span>
                <span className="text-[10px] opacity-75 font-normal">({liveWordCount.toLocaleString()} words)</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200/90 rounded-full text-xs font-bold shadow-2xs">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Progress: <strong>{readingProgress}% Read</strong></span>
              </div>
              {activeSessions.length > 0 && (
                <div className="ml-3 flex items-center gap-1.5 bg-emerald-50/75 border border-emerald-200/55 rounded-full px-3 py-1 text-[10px] text-emerald-850 font-bold animate-fadeIn">
                  <span className="relative flex h-2 w-2 mr-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-slate-500 font-medium hidden sm:inline">Active Collaborators:</span>
                  <div className="flex items-center -space-x-1 ml-1 mr-1.5">
                    {activeSessions.map((sess) => {
                      const colors = [
                        'bg-rose-500 text-rose-100',
                        'bg-sky-500 text-sky-100',
                        'bg-emerald-500 text-emerald-100',
                        'bg-amber-500 text-amber-100',
                        'bg-purple-500 text-purple-100',
                        'bg-indigo-500 text-indigo-100',
                        'bg-pink-500 text-pink-100',
                        'bg-teal-500 text-teal-100'
                      ];
                      const hash = sess.userId ? sess.userId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 0;
                      const colorClass = colors[hash % colors.length];
                      
                      // Calculate initials from name
                      let initials = '?';
                      if (sess.displayName) {
                        const parts = sess.displayName.trim().split(/\s+/);
                        if (parts.length >= 2) {
                          initials = (parts[0][0] + parts[1][0]).toUpperCase();
                        } else if (parts.length === 1 && parts[0].length > 0) {
                          initials = parts[0].substring(0, 2).toUpperCase();
                        }
                      }
                      
                      return (
                        <div
                          key={`coll-indicator-${sess.id || sess.userId}`}
                          className={`w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] font-black shadow-xs ${colorClass} relative group cursor-help transition-all duration-200 hover:scale-110`}
                        >
                          {initials}
                          {/* Active state badge on avatar bubble */}
                          <span className={`absolute -bottom-0.5 -right-0.5 block h-1.5 w-1.5 rounded-full ring-0.5 ring-white ${sess.isEditing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                          
                          {/* Beautiful micro tooltip */}
                          <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-slate-900 text-white text-[9px] px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-[150] transition-all duration-150 origin-bottom font-medium">
                            <span className="font-bold text-slate-200">{sess.displayName}</span>
                            <span className="text-slate-400 block text-[8px] mt-0.5">{sess.email}</span>
                            <span className={`inline-flex items-center gap-1 text-[8px] font-bold mt-1 uppercase tracking-wider ${sess.isEditing ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {sess.isEditing ? '✍️ Editing Document' : '👁️ Viewing Document'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[9px] text-emerald-800 font-extrabold uppercase tracking-wide bg-emerald-100/60 px-1.5 py-0.2 rounded-md">
                    {activeSessions.length} online
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const formatted = autoDetectAndBold(editedContent);
                  if (formatted !== editedContent) {
                    setEditedContent(formatted);
                  }
                  setIsEditing(false);
                  setIsPrintLayoutPreview(false);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  !isEditing && !isPrintLayoutPreview
                    ? 'bg-[#5f6f52] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Screen View</span>
              </button>
              
              <button
                onClick={() => {
                  const formatted = autoDetectAndBold(editedContent);
                  if (formatted !== editedContent) {
                    setEditedContent(formatted);
                  }
                  setIsEditing(false);
                  setIsPrintLayoutPreview(true);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  !isEditing && isPrintLayoutPreview
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Preview</span>
              </button>

              <button
                onClick={() => {
                  setIsEditing(true);
                  setIsPrintLayoutPreview(false);
                  setTargetLanguage('en');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  isEditing
                    ? 'bg-[#5f6f52] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Code Editor</span>
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  isFullscreen
                    ? 'bg-[#5f6f52] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={isFullscreen ? "Exit Fullscreen Mode" : "Enter Fullscreen Mode"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFullscreen ? "Exit Full" : "Fullscreen"}</span>
              </button>

              <button
                onClick={toggleQuickStudyMode}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1 cursor-pointer border ${
                  isQuickStudyMode
                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                    : 'bg-amber-50 text-amber-900 border-amber-200/90 hover:bg-amber-100'
                }`}
                title="Activate Quick Study reading mode (hides sidebar, header, and toolbar)"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>Quick Study</span>
              </button>

              <button
                onClick={toggleFocusMode}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1 cursor-pointer border ${
                  isFocusMode
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'
                }`}
                title={isFocusMode ? "Exit Focus Mode" : "Activate Focus Mode: Collapse sidebars for distraction-free writing & reading"}
              >
                {isFocusMode ? <Minimize2 className="w-3.5 h-3.5 text-emerald-200" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isFocusMode ? "Focusing 🎯" : "Focus Mode"}</span>
              </button>

              <button
                onClick={() => setShowBehavioralTelemetryBar(!showBehavioralTelemetryBar)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  inferredLearningState === 'breezing'
                    ? 'bg-cyan-50 border-cyan-300 text-cyan-800 font-extrabold'
                    : inferredLearningState === 'struggling'
                    ? 'bg-amber-50 border-amber-300 text-amber-800 font-extrabold animate-pulse'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
                title="Toggle Passive Behavioral Analytics & Real-Time Flow State Telemetry"
              >
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Behavioral Analytics</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                  inferredLearningState === 'breezing'
                    ? 'bg-cyan-600 text-white'
                    : inferredLearningState === 'struggling'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {inferredLearningState}
                </span>
              </button>
            </div>
          </div>
          )}

          {/* Quick Pedagogical Phase Jump Bar with Collapse Controls */}
          {quickJumpPhaseGroups.length > 0 && !isEditing && !isPrintLayoutPreview && !isQuickStudyMode && (
            <div className="px-4 py-2 border-b border-[#e5e1da] bg-[#fbf9f5] flex items-center justify-between gap-2 overflow-x-auto no-print text-xs scrollbar-none">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 shrink-0">
                  <Compass className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>Pedagogical Phases:</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {quickJumpPhaseGroups.map((group) => {
                    const isCollapsed = !!collapsedPhaseGroupIds[group.id];
                    return (
                      <div
                        key={`phase-pill-${group.id}`}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition shadow-2xs ${
                          isCollapsed
                            ? 'bg-slate-200/60 border-slate-300 text-slate-500 opacity-75'
                            : `${group.badgeColor} hover:scale-102`
                        }`}
                      >
                        <button
                          onClick={() => {
                            if (isCollapsed) {
                              togglePhaseGroupCollapse(group.id);
                            }
                            if (group.headings.length > 0) {
                              handleJumpToSection(group.headings[0].id);
                            }
                          }}
                          className="flex items-center gap-1.5 cursor-pointer hover:underline"
                          title={isCollapsed ? `Expand and Jump to ${group.phaseName}` : `Jump to first section in ${group.phaseName}`}
                        >
                          {renderPhaseIcon(group.id)}
                          <span className="text-xs">{group.iconEmoji}</span>
                          <span className={isCollapsed ? 'line-through text-slate-500' : ''}>{group.shortName}</span>
                          <span className="text-[9px] opacity-75 font-mono font-normal">({group.headings.length})</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePhaseGroupCollapse(group.id);
                          }}
                          className="ml-0.5 p-0.5 rounded hover:bg-black/10 transition cursor-pointer text-slate-500 hover:text-slate-800"
                          title={isCollapsed ? `Expand ${group.shortName} category` : `Collapse ${group.shortName} category`}
                        >
                          {isCollapsed ? <ChevronRight className="w-3 h-3 text-rose-500" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-semibold text-slate-500">
                <button
                  onClick={expandAllPhaseGroups}
                  className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition cursor-pointer font-bold"
                  title="Expand all pedagogical phase categories"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAllPhaseGroups}
                  className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100 transition cursor-pointer font-bold"
                  title="Collapse all pedagogical phase categories"
                >
                  Collapse All
                </button>
              </div>
            </div>
          )}

          {/* Passive Behavioral Analytics Telemetry Bar */}
          {showBehavioralTelemetryBar && (
            <div className="bg-slate-900 text-white border-b border-slate-800 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn no-print">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Pace state indicator */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Inferred Learning Pace:</span>
                  {inferredLearningState === 'breezing' && (
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400 animate-bounce" /> Breezing Through (Mastery)
                    </span>
                  )}
                  {inferredLearningState === 'struggling' && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-amber-400 animate-pulse" /> Concept Friction / Stuck
                    </span>
                  )}
                  {inferredLearningState === 'focused' && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Deep Focus Flow
                    </span>
                  )}
                  {inferredLearningState === 'idle' && (
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-[10px] font-black uppercase">
                      Stationary Reading
                    </span>
                  )}
                </div>

                <div className="h-4 w-px bg-slate-800 hidden md:block" />

                {/* Metrics */}
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
                  <span title="Scroll velocity calculated in pixels per second">
                    ⚡ Velocity: <strong className="text-cyan-400">{scrollSpeed}</strong> px/s
                  </span>
                  <span title="Duration spent stationary on the current reading section">
                    ⏱️ Pause: <strong className="text-amber-400">{sectionPauseDuration}</strong>s
                  </span>
                  <span title="Count of scroll direction reversals (re-reads)">
                    🔄 Re-reads: <strong className="text-rose-400">{scrollReversals}</strong>
                  </span>
                  <span title="Count of Socratic AI queries issued">
                    💬 Queries: <strong className="text-indigo-400">{socraticInteractionsCount}</strong>
                  </span>
                </div>
              </div>

              {/* Quick Action Overrides */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFetchMasteryChallenge}
                  disabled={isLoadingActiveChallenge}
                  className="py-1 px-2.5 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Generate a higher-order cognitive mastery challenge"
                >
                  <Zap className="w-3 h-3 text-cyan-400" /> Harder Challenge
                </button>
                <button
                  onClick={handleFetchConceptSimplification}
                  disabled={isSimplifyingConcept}
                  className="py-1 px-2.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Generate a simplified Socratic explanation"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" /> Simplify Concept
                </button>
              </div>
            </div>
          )}

          {/* Differentiation Studio Toolbar (Dynamic & Clean) */}
          {!isQuickStudyMode && (
          <div className="px-4 py-2 bg-indigo-50/70 border-b border-[#e5e1da] flex flex-col sm:flex-row items-center justify-between gap-2.5 no-print">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span className="text-xs font-bold text-slate-700">Differentiation Studio</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold uppercase">Beta</span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Active View Toggle */}
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-indigo-100 shadow-2xs">
                {document.docType === 'lesson-notes' || document.docType === 'lesson-notes-classic' ? (
                  <>
                    <button
                      onClick={() => setSelectedDifferentiatedView('core')}
                      className={`px-3 py-1 text-xs font-extrabold rounded-md transition ${
                        selectedDifferentiatedView === 'core'
                          ? 'bg-[#5f6f52] text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Core Notes
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDifferentiatedView('detailed');
                        setIsHandwrittenTheme(true);
                        localStorage.setItem('pedagogical_paper_style', 'classic');
                        window.dispatchEvent(new Event('paper_theme_changed'));
                      }}
                      className={`px-3 py-1 text-xs font-extrabold rounded-md transition flex items-center gap-1 ${
                        selectedDifferentiatedView === 'detailed'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>📝 Detailed Notes</span>
                      {editedDetailedContent ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                      ) : null}
                    </button>
                    <button
                      onClick={() => setSelectedDifferentiatedView('support')}
                      className={`px-3 py-1 text-xs font-extrabold rounded-md transition flex items-center gap-1 ${
                        selectedDifferentiatedView === 'support'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>🧩 Simplified Notes</span>
                      {editedSupportContent ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                      ) : null}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedDifferentiatedView('core')}
                      className={`px-3 py-1 text-xs font-extrabold rounded-md transition ${
                        selectedDifferentiatedView === 'core'
                          ? 'bg-[#5f6f52] text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Core Material
                    </button>
                    <button
                      onClick={() => setSelectedDifferentiatedView('advanced')}
                      className={`px-3 py-1 text-xs font-extrabold rounded-md transition flex items-center gap-1 ${
                        selectedDifferentiatedView === 'advanced'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>🚀 Advanced Track</span>
                      {editedAdvancedContent ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                      ) : null}
                    </button>
                    <button
                      onClick={() => setSelectedDifferentiatedView('support')}
                      className={`px-3 py-1 text-xs font-extrabold rounded-md transition flex items-center gap-1 ${
                        selectedDifferentiatedView === 'support'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>🧩 Support Track</span>
                      {editedSupportContent ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                      ) : null}
                    </button>
                  </>
                )}
              </div>

              {/* Generate Button / Quick Action */}
              {(((document.docType === 'lesson-notes' || document.docType === 'lesson-notes-classic') && (!editedDetailedContent || !editedSupportContent)) ||
                (document.docType !== 'lesson-notes' && document.docType !== 'lesson-notes-classic' && (!editedAdvancedContent || !editedSupportContent))) && (
                <button
                  onClick={handleGenerateDifferentiated}
                  disabled={isGeneratingDifferentiated}
                  className="px-3 py-1 bg-indigo-600 hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingDifferentiated ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{isGeneratingDifferentiated ? 'Differentiating...' : 'Generate Tracks'}</span>
                </button>
              )}
            </div>
          </div>
          )}

          <div 
            id="collaborative-presence-area"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`${compareRightVersion ? 'p-6 md:p-8' : isEditing ? 'p-6 md:p-8' : isQuickStudyMode ? 'p-8 sm:p-12 md:p-16 max-w-2xl mx-auto leading-relaxed font-serif text-slate-850' : (isHandwrittenTheme ? 'p-2' : 'p-6 md:p-8')} flex-1 min-h-[500px] print:p-0 relative`}
          >
            {compareRightVersion ? (
              <VersionDiffViewer
                leftTitle={compareLeftVersion ? compareLeftVersion.title : document.title}
                leftContent={compareLeftVersion ? compareLeftVersion.content : document.content}
                rightTitle={compareRightVersion.title}
                rightContent={compareRightVersion.content}
                leftLabel={compareLeftVersion ? (compareLeftVersion.label ? `Version ${compareLeftVersion.versionNumber} (${compareLeftVersion.label})` : `Version ${compareLeftVersion.versionNumber}`) : 'Current Document'}
                rightLabel={compareRightVersion.id === 'current' ? 'Current Draft (Revised)' : (compareRightVersion.label ? `Version ${compareRightVersion.versionNumber} (${compareRightVersion.label})` : `Version ${compareRightVersion.versionNumber}`)}
                onRestore={() => handleRestoreClick(compareRightVersion)}
                onExit={() => {
                  setCompareRightVersion(null);
                  setCompareLeftVersion(null);
                }}
              />
            ) : isEditing ? (
              <div className="space-y-4 h-full flex flex-col">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full text-xl font-bold font-serif text-slate-800 border-b border-slate-200 pb-2 focus:outline-none focus:border-[#5f6f52]"
                  placeholder="Document Title"
                />
                
                {/* WYSIWYG Editor Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {/* Basic Text Styling */}
                  <button
                    type="button"
                    onClick={() => insertMarkdown('**', '**')}
                    className="p-1.5 text-slate-600 hover:text-[#5f6f52] hover:bg-[#5f6f52]/5 rounded-lg transition cursor-pointer"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertMarkdown('*', '*')}
                    className="p-1.5 text-slate-600 hover:text-[#5f6f52] hover:bg-[#5f6f52]/5 rounded-lg transition cursor-pointer"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertMarkdown('<u>', '</u>')}
                    className="p-1.5 text-slate-600 hover:text-[#5f6f52] hover:bg-[#5f6f52]/5 rounded-lg transition cursor-pointer"
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </button>

                  {/* Highlights Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowHighlightPopover(!showHighlightPopover)}
                      className="p-1.5 text-slate-600 hover:text-[#5f6f52] hover:bg-[#5f6f52]/5 rounded-lg transition cursor-pointer flex items-center gap-0.5"
                      title="Highlight Colors"
                    >
                      <Highlighter className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {showHighlightPopover && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setShowHighlightPopover(false)} />
                        <div className="absolute left-0 mt-1 z-30 bg-white border border-[#e5e1da] rounded-xl shadow-lg p-2.5 flex flex-col gap-1.5 min-w-[150px] animate-fadeIn">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase px-1">Select Color</span>
                          
                          <button
                            type="button"
                            onClick={() => {
                              insertMarkdown('==yellow:', '==');
                              setShowHighlightPopover(false);
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer w-full text-left"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-yellow-200 border border-yellow-300" />
                            <span className="text-xs font-semibold text-slate-700">Yellow Highlight</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              insertMarkdown('==green:', '==');
                              setShowHighlightPopover(false);
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer w-full text-left"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 border border-emerald-300" />
                            <span className="text-xs font-semibold text-slate-700">Green Highlight</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              insertMarkdown('==pink:', '==');
                              setShowHighlightPopover(false);
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer w-full text-left"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-rose-100 border border-rose-300" />
                            <span className="text-xs font-semibold text-slate-700">Pink Highlight</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              insertMarkdown('==blue:', '==');
                              setShowHighlightPopover(false);
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer w-full text-left"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-sky-100 border border-sky-300" />
                            <span className="text-xs font-semibold text-slate-700">Blue Highlight</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="w-px h-5 bg-slate-200 mx-1"></div>

                  <button
                    type="button"
                    onClick={makeUppercase}
                    className="p-1.5 text-slate-600 hover:text-[#5f6f52] hover:bg-[#5f6f52]/5 rounded-lg transition cursor-pointer font-bold text-xs"
                    title="Make Selection UPPERCASE"
                  >
                    AA
                  </button>

                  <button
                    type="button"
                    onClick={makeHeaderLine}
                    className="p-1.5 text-slate-600 hover:text-[#5f6f52] hover:bg-[#5f6f52]/5 rounded-lg transition cursor-pointer"
                    title="Make Heading Line UPPERCASE"
                  >
                    <Heading1 className="w-4 h-4" />
                  </button>

                  <div className="w-px h-5 bg-slate-200 mx-1"></div>

                  <button
                    type="button"
                    onClick={() => insertMarkdown('- ', '')}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                    title="Bullet List (- Item)"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('1. ', '')}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-[#5f6f52]/10 rounded-lg transition cursor-pointer"
                    title="Numbered List (1. Item)"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('> ', '')}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-[#5f6f52]/10 rounded-lg transition cursor-pointer"
                    title="Blockquote (> Quote)"
                  >
                    <Quote className="w-4 h-4" />
                  </button>

                  <div className="w-px h-5 bg-slate-200 mx-1"></div>

                  <button
                    type="button"
                    onClick={() => insertMarkdown('\n| Column 1 | Column 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n')}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-[#5f6f52]/10 rounded-lg transition cursor-pointer"
                    title="Insert Markdown Table"
                  >
                    <Table className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('[', '](https://url)')}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-[#5f6f52]/10 rounded-lg transition cursor-pointer"
                    title="Insert Link ([Text](URL))"
                  >
                    <Link className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('```\n', '\n```')}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-[#5f6f52]/10 rounded-lg transition cursor-pointer"
                    title="Code Block (```code```)"
                  >
                    <Code className="w-4 h-4" />
                  </button>

                  <div className="w-px h-5 bg-slate-200 mx-1"></div>

                  <button
                    type="button"
                    onClick={() => setIsToolbarImageModalOpen(true)}
                    className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-bold bg-emerald-50/50 border border-emerald-100 shadow-sm"
                    title="Generate AI educational diagram or illustration with Gemini"
                  >
                    <Palette className="w-3.5 h-3.5 text-emerald-600" />
                    <span>AI Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const formatted = autoDetectAndBold(editedContent);
                      if (formatted !== editedContent) {
                        setEditedContent(formatted);
                      }
                    }}
                    className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-bold bg-emerald-50/50 border border-emerald-100 ml-1.5 shadow-sm"
                    title="Automatically scan and bold key educational concepts or headers"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>Auto-Bold Key Concepts</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRunSpellCheck}
                    disabled={isCheckingSpelling}
                    className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-bold bg-blue-50/50 border border-blue-100 ml-1.5 shadow-sm disabled:opacity-50"
                    title="Run automated AI spell-checker & grammar correction"
                  >
                    {isCheckingSpelling ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>{isCheckingSpelling ? 'Checking...' : 'Check Spelling'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!textareaRef.current) return;
                      const start = textareaRef.current.selectionStart;
                      const end = textareaRef.current.selectionEnd;
                      const selectedText = editedContent.substring(start, end).trim();

                      if (!selectedText) {
                        alert("Please highlight/select a sentence or phrase in the editor text first before clicking 'Simplify Sentence'.");
                        return;
                      }

                      setIsSimplifyingSentence(true);
                      try {
                        const response = await fetch('/api/simplify-sentence', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text: selectedText, targetLevel: 'simple' })
                        });
                        const data = await response.json();
                        if (data && data.simplifiedText) {
                          const updated = editedContent.substring(0, start) + data.simplifiedText + editedContent.substring(end);
                          setEditedContent(updated);
                        } else {
                          alert(data.error || 'Failed to simplify sentence.');
                        }
                      } catch (err: any) {
                        console.error(err);
                        alert('Error simplifying sentence: ' + (err.message || err));
                      } finally {
                        setIsSimplifyingSentence(false);
                      }
                    }}
                    disabled={isSimplifyingSentence || isSimplifyingParagraph}
                    className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-bold bg-purple-50/50 border border-purple-100 ml-1.5 shadow-sm disabled:opacity-50"
                    title="Rephrase highlighted selection to a simpler reading complexity level using Gemini API"
                  >
                    {isSimplifyingSentence ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    )}
                    <span>{isSimplifyingSentence ? 'Simplifying...' : 'Simplify Sentence'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!textareaRef.current) return;
                      let start = textareaRef.current.selectionStart;
                      let end = textareaRef.current.selectionEnd;

                      if (start === end || (end - start < 3)) {
                        let pStart = editedContent.lastIndexOf('\n\n', start);
                        pStart = pStart === -1 ? 0 : pStart + 2;
                        let pEnd = editedContent.indexOf('\n\n', end);
                        pEnd = pEnd === -1 ? editedContent.length : pEnd;

                        start = pStart;
                        end = pEnd;

                        textareaRef.current.setSelectionRange(start, end);
                      }

                      const batchText = editedContent.substring(start, end).trim();

                      if (!batchText) {
                        alert("Please place your cursor inside a paragraph or select lines to simplify.");
                        return;
                      }

                      setIsSimplifyingParagraph(true);
                      try {
                        const response = await fetch('/api/simplify-sentence', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text: batchText, targetLevel: 'simple', isParagraphBatch: true })
                        });
                        const data = await response.json();
                        if (data && data.simplifiedText) {
                          const updated = editedContent.substring(0, start) + data.simplifiedText + editedContent.substring(end);
                          setEditedContent(updated);
                        } else {
                          alert(data.error || 'Failed to simplify paragraph.');
                        }
                      } catch (err: any) {
                        console.error(err);
                        alert('Error simplifying paragraph: ' + (err.message || err));
                      } finally {
                        setIsSimplifyingParagraph(false);
                      }
                    }}
                    disabled={isSimplifyingSentence || isSimplifyingParagraph}
                    className="p-1.5 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-bold bg-indigo-50/60 border border-indigo-100 ml-1 shadow-sm disabled:opacity-50"
                    title="Batch simplify entire highlighted paragraph(s) or surrounding lines at once using Gemini API"
                  >
                    {isSimplifyingParagraph ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                    <span>{isSimplifyingParagraph ? 'Simplifying Batch...' : 'Simplify Entire Paragraph'}</span>
                  </button>
                  
                  <div className="ml-auto flex items-center gap-2 px-2 select-none">
                    {syncStatus && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 ${
                        syncStatus === 'syncing'
                          ? 'text-amber-600 animate-pulse'
                          : syncStatus === 'error'
                          ? 'text-red-500'
                          : 'text-emerald-600'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          syncStatus === 'syncing'
                            ? 'bg-amber-500 animate-ping'
                            : syncStatus === 'error'
                            ? 'bg-red-500'
                            : 'bg-emerald-500'
                        }`} />
                        {syncStatus === 'syncing' ? 'Saving...' : syncStatus === 'error' ? 'Sync Error' : 'Saved'}
                      </span>
                    )}
                    <div id="editor-word-count-badge" className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[10px] font-mono font-bold text-slate-700">
                      <FileText className="w-3 h-3 text-[#5f6f52]" />
                      <span>{liveWordCount.toLocaleString()} {liveWordCount === 1 ? 'word' : 'words'}</span>
                      <span className="text-slate-300">|</span>
                      <span>{liveCharCount.toLocaleString()} chars</span>
                    </div>
                  </div>
                </div>

                <div className="w-full flex-1 flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative flex flex-col">
                    <textarea
                      ref={textareaRef}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full flex-1 min-h-[450px] font-mono text-xs leading-relaxed text-slate-700 bg-slate-50/50 p-4 pr-12 pb-12 rounded-xl border border-slate-200 focus:outline-none focus:border-[#5f6f52]"
                      placeholder="Insert markdown format here..."
                    />

                    {/* Floating Insert from Studio Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setToolbarImageTab('gallery');
                        setIsToolbarImageModalOpen(true);
                      }}
                      className="absolute bottom-4 right-4 z-10 bg-[#5f6f52] hover:bg-[#4d5a42] text-white px-3.5 py-2 rounded-full text-xs font-bold shadow-lg hover:shadow-xl transition duration-200 flex items-center gap-2 cursor-pointer border border-[#5f6f52]/20 group"
                      title="Insert generated illustrations directly from your Image Studio creations"
                    >
                      <FolderOpen className="w-4 h-4 group-hover:scale-110 transition duration-200" />
                      <span>Insert from Studio</span>
                    </button>

                    {/* Textarea Live Word Count Footer Bar */}
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono px-1 select-none">
                      <span className="flex items-center gap-1.5 font-bold text-slate-600">
                        <FileText className="w-3.5 h-3.5 text-[#5f6f52]" />
                        <span><strong>{liveWordCount.toLocaleString()}</strong> {liveWordCount === 1 ? 'word' : 'words'}</span>
                        <span className="text-slate-300">•</span>
                        <span><strong>{liveCharCount.toLocaleString()}</strong> characters</span>
                      </span>
                      <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Live Autosave Editor</span>
                    </div>
                  </div>

                  {/* Spell Check Suggestions Panel */}
                  {hasRunSpellCheck && (
                    <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-xl p-4 flex flex-col animate-slideInRight shadow-sm max-h-[500px]">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Spell & Grammar Check
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setHasRunSpellCheck(false);
                            setSpellCheckErrors([]);
                            setSpellCheckResultMsg('');
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          title="Close panel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {spellCheckResultMsg && (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg flex items-center gap-2 mb-3 shrink-0">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{spellCheckResultMsg}</span>
                        </div>
                      )}

                      {spellCheckErrors.length > 0 ? (
                        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            Suggestions ({spellCheckErrors.length})
                          </p>
                          {spellCheckErrors.map((err, i) => (
                            <div
                              key={i}
                              className={`p-3 rounded-lg border text-xs space-y-2 transition duration-200 ${
                                err.severity === 'error'
                                  ? 'bg-rose-50/50 border-rose-100 hover:bg-rose-50'
                                  : 'bg-amber-50/50 border-amber-100 hover:bg-amber-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                  err.severity === 'error'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {err.severity === 'error' ? 'Error' : 'Warning'}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]" title={err.original}>
                                  "{err.original}"
                                </span>
                              </div>
                              <div className="text-slate-700 space-y-1">
                                <div>
                                  <span className="font-semibold text-slate-500">Original:</span> <span className="line-through text-slate-400 font-mono text-[11px] break-all">{err.original}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-emerald-700">Correction:</span> 
                                  <span className="font-mono text-[11px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 break-all">{err.suggestion}</span>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed italic">
                                {err.explanation}
                              </p>
                              <button
                                type="button"
                                onClick={() => applySpellFix(err.original, err.suggestion)}
                                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Quick Fix</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        !spellCheckResultMsg && (
                          <div className="text-center py-8 text-slate-400 text-xs flex-1 flex flex-col items-center justify-center">
                            No active spelling or grammar issues to display.
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : isPrintLayoutPreview ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Handout Print Settings & Information Bar */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl no-print">
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                      <Printer className="w-4 h-4 text-rose-600" />
                      Classroom Handout Print Settings
                    </h4>
                    <p className="text-[10px] text-rose-700/80">
                      Customize layouts, page borders, and save paper/ink before sending the worksheet directly to physical classroom printing.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Font selector */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Typography</span>
                      <select
                        value={printLayoutFont}
                        onChange={(e) => setPrintLayoutFont(e.target.value as any)}
                        className="bg-white border border-slate-200 rounded-lg p-1 text-[10px] font-bold focus:outline-none focus:border-rose-500"
                      >
                        <option value="sans">Sans-Serif (Standard)</option>
                        <option value="serif">Serif (Traditional / Reading)</option>
                        <option value="mono">Monospace (Code / Exercises)</option>
                      </select>
                    </div>

                    {/* Margins selector */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Handout Margins</span>
                      <select
                        value={printLayoutMargin}
                        onChange={(e) => setPrintLayoutMargin(e.target.value as any)}
                        className="bg-white border border-slate-200 rounded-lg p-1 text-[10px] font-bold focus:outline-none focus:border-rose-500"
                      >
                        <option value="narrow">Narrow (More space)</option>
                        <option value="normal">Normal (Balanced)</option>
                        <option value="wide">Wide (Spacious margins)</option>
                      </select>
                    </div>

                    {/* Color selector */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Color Palette</span>
                      <select
                        value={printLayoutColorMode}
                        onChange={(e) => setPrintLayoutColorMode(e.target.value as any)}
                        className="bg-white border border-slate-200 rounded-lg p-1 text-[10px] font-bold focus:outline-none focus:border-rose-500"
                      >
                        <option value="color">Full Colors</option>
                        <option value="grayscale">Eco B&W (Saves Ink)</option>
                      </select>
                    </div>

                    {/* Page Orientation selector */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Orientation</span>
                      <select
                        value={printLayoutOrientation}
                        onChange={(e) => handleOrientationToggle(e.target.value as any)}
                        className="bg-white border border-slate-200 rounded-lg p-1 text-[10px] font-bold focus:outline-none focus:border-rose-500"
                      >
                        <option value="portrait">📄 Portrait</option>
                        <option value="landscape">📜 Landscape</option>
                      </select>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm hover:shadow transition flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Now</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Handout Sheet paper container */}
                <div 
                  id="printable-handout-sheet"
                  className={`bg-white border border-slate-250 shadow-md mx-auto rounded-xl transition-all duration-300 print-sheet-mockup ${
                    printLayoutMargin === 'narrow' ? 'p-6 md:p-8' :
                    printLayoutMargin === 'wide' ? 'p-12 md:p-14' : 'p-10 md:p-11'
                  } ${
                    printLayoutFont === 'serif' ? 'font-serif' :
                    printLayoutFont === 'mono' ? 'font-mono' : 'font-sans'
                  } ${
                    printLayoutColorMode === 'grayscale' ? 'grayscale' : ''
                  }`}
                  style={{
                    maxWidth: printLayoutOrientation === 'landscape' ? '1100px' : '820px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* EduNexus Brand Header (Top Left corner of document) */}
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                    <img src="/icon.svg" alt="EduNexus Logo" className="w-7 h-7 rounded-lg shadow-xs" referrerPolicy="no-referrer" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black tracking-wider text-[#5f6f52] uppercase font-sans">EduNexus</span>
                      <span className="text-[8px] text-slate-400 font-mono tracking-tight uppercase">Curriculum Library</span>
                    </div>
                  </div>

                  {/* Classroom-style Header Border block */}
                  <div className="border-2 border-slate-900 p-4 mb-6 rounded-md bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-bold text-slate-800">
                    <div className="space-y-1">
                      <p className="uppercase tracking-wider text-[10px] text-slate-400">Classroom Lesson Handout</p>
                      <h2 className="text-lg font-black text-slate-900 leading-tight">{displayTitle}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-slate-600 border-l border-slate-200 pl-4">
                      <span><strong>Subject:</strong> {document.subject || 'General'}</span>
                      <span><strong>Level:</strong> {document.classLevel || 'N/A'}</span>
                      <span><strong>Topic:</strong> {document.topic || 'N/A'}</span>
                      <span><strong>Date:</strong> {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Worksheet student name and score block if worksheet or assessment */}
                  {(document.docType === 'worksheet' || document.docType === 'lesson-notes' || document.docType === 'lesson-notes-classic') && (
                    <div className="grid grid-cols-2 gap-4 border-b border-dashed border-slate-300 pb-4 mb-6 text-xs text-slate-500 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span>Student Name:</span>
                        <div className="flex-1 border-b border-slate-300 h-4"></div>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <span>Score / Grade:</span>
                        <div className="w-20 border-b border-slate-300 h-4"></div>
                      </div>
                    </div>
                  )}

                  {/* Automatic Table of Contents for Long Documents in Print Handout View */}
                  {(() => {
                    const docHeadings = extractDocumentHeadings(preprocessedDisplayContent);
                    if (docHeadings.length < 2) return null;
                    return (
                      <div className="print-toc-container mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl font-sans">
                        <div className="print-toc-header flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <ListOrdered className="w-4 h-4 text-rose-700" />
                            Table of Contents / Lesson Outline
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">
                            {docHeadings.length} Sections • Physical Print Navigation
                          </span>
                        </div>
                        <ul className="print-toc-list space-y-1.5 text-xs">
                          {docHeadings.map((h, idx) => (
                            <li
                              key={h.id || idx}
                              className={`print-toc-item flex items-baseline justify-between gap-2 ${
                                h.level === 1 ? 'print-toc-item-h1 font-bold text-slate-900 mt-2 border-b border-slate-100 pb-1' :
                                h.level === 2 ? 'print-toc-item-h2 font-semibold text-slate-800 pl-3' :
                                'print-toc-item-h3 text-slate-600 pl-6'
                              }`}
                            >
                              <a
                                href={`#${h.id}`}
                                className="print-toc-title hover:text-rose-700 hover:underline flex items-center gap-1 min-w-0"
                              >
                                <span className="truncate">{h.text}</span>
                              </a>
                              <span className="print-toc-leader flex-1 border-b border-dotted border-slate-300 mx-2"></span>
                              <a href={`#${h.id}`} className="print-toc-page-num text-slate-700 dark:text-slate-200 font-mono text-[11px] font-bold shrink-0">
                                Page {h.pageNumber || 1}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}

                  {/* Body Content */}
                  <div className="prose prose-slate max-w-none text-slate-900 leading-relaxed">
                    <MarkdownView
                      content={preprocessedDisplayContent}
                      onGenerateDiagram={handleGenerateDiagram}
                      generatingPlaceholders={generatingPlaceholders}
                      highlightedTexts={commentsHighlightedTexts}
                      onHighlightClick={handleHighlightClick}
                      annotationHighlightedTexts={showStickyNotesOverlay ? annotationsHighlightedTexts : []}
                      onAnnotationHighlightClick={handleAnnotationHighlightClick}
                      annotations={showStickyNotesOverlay ? annotations : []}
                      reactions={reactions}
                      onToggleReaction={handleToggleReaction}
                      currentUserId={profile?.uid}
                      alignment={documentAlignment}
                      bold={documentIsBold}
                      italic={documentIsItalic}
                      listStyle={documentListStyle}
                      fontFamily={documentFontFamily}
                      pedagogicalMode={documentPedagogicalMode}
                      onSpeakText={handleSpeakSingleBlock}
                      currentlySpokenText={spokenBlockText}
                      currentSpeechCharIndex={currentSpeechCharIndex}
                      isDyslexiaMode={isDyslexiaMode}
                    />
                  </div>

                  {/* Neat Physical Handout footer */}
                  <div className="mt-12 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>Generated via Curriculum-Aligned Pedagogical Suite</span>
                    <span>Handout Sheet — Page 1</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Theme Selection Toggle inside the preview block */}
                <div className="flex flex-col xl:flex-row items-center justify-between gap-3 p-3 bg-[#faf6ee] border border-[#eadecd] rounded-xl no-print theme-toggle-bar">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✍️</span>
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 leading-tight">Pedagogical Presentation Style</p>
                      <p className="text-[10px] text-slate-500">Toggle between a charming hand-ruled lesson notebook or a standard digital layout</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Font Size & Zoom Controls */}
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#eadecd]/60 rounded-lg shadow-xs no-print">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">Zoom Size:</span>
                      
                      {/* Zoom Out Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextSize = Math.max(0.5, Math.round((documentFontSize - 0.05) * 100) / 100);
                          pushFormatChange({ fontSize: nextSize });
                        }}
                        disabled={documentFontSize <= 0.5}
                        className="p-1 rounded-md text-slate-500 hover:text-[#5f6f52] hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
                        title="Zoom Out (Alt + -)"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.05"
                        value={documentFontSize}
                        onChange={(e) => {
                          const size = parseFloat(e.target.value);
                          pushFormatChange({ fontSize: size });
                        }}
                        className="w-20 sm:w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#5f6f52] focus:outline-none"
                        title="Drag to adjust text size"
                      />

                      {/* Zoom In Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextSize = Math.min(3.0, Math.round((documentFontSize + 0.05) * 100) / 100);
                          pushFormatChange({ fontSize: nextSize });
                        }}
                        disabled={documentFontSize >= 3.0}
                        className="p-1 rounded-md text-slate-500 hover:text-[#5f6f52] hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
                        title="Zoom In (Alt + +)"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>

                      {/* Reset Button */}
                      <button
                        type="button"
                        onClick={() => {
                          pushFormatChange({ fontSize: 1.0 });
                        }}
                        disabled={documentFontSize === 1.0}
                        className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-slate-50 cursor-pointer transition-all"
                        title="Reset to 1.0rem (Default, Alt + 0)"
                      >
                        Reset
                      </button>

                      <span className="text-[10px] font-bold text-[#5f6f52] bg-[#5f6f52]/10 px-1.5 py-0.5 rounded border border-[#5f6f52]/25 font-mono select-none">
                        {documentFontSize.toFixed(2)}rem
                      </span>
                    </div>

                    {/* Page Orientation Toggle Toolbar */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 no-print" id="orientation-control-toolbar">
                      <button
                        type="button"
                        title="Portrait Mode"
                        onClick={() => handleOrientationToggle('portrait')}
                        className={`px-2 py-1.5 rounded-md text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1 ${
                          documentOrientation === 'portrait'
                            ? 'bg-[#5f6f52] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[10px]">Portrait</span>
                      </button>
                      <button
                        type="button"
                        title="Landscape Mode"
                        onClick={() => handleOrientationToggle('landscape')}
                        className={`px-2 py-1.5 rounded-md text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1 ${
                          documentOrientation === 'landscape'
                            ? 'bg-[#5f6f52] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 rotate-90" />
                        <span className="hidden sm:inline text-[10px]">Landscape</span>
                      </button>
                    </div>

                    {/* Alignment Control Toolbar */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 no-print" id="alignment-control-toolbar">
                      <button
                        type="button"
                        title="Align Left"
                        onClick={() => {
                          pushFormatChange({ alignment: 'left' });
                        }}
                        className={`p-1.5 rounded-md transition duration-200 cursor-pointer ${
                          documentAlignment === 'left'
                            ? 'bg-[#5f6f52] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Align Center"
                        onClick={() => {
                          pushFormatChange({ alignment: 'center' });
                        }}
                        className={`p-1.5 rounded-md transition duration-200 cursor-pointer ${
                          documentAlignment === 'center'
                            ? 'bg-[#5f6f52] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Align Justify"
                        onClick={() => {
                          pushFormatChange({ alignment: 'justify' });
                        }}
                        className={`p-1.5 rounded-md transition duration-200 cursor-pointer ${
                          documentAlignment === 'justify'
                            ? 'bg-[#5f6f52] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <AlignJustify className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Formatting Control Toolbar (Bold, Italic & Lists) */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 no-print" id="formatting-control-toolbar">
                      <button
                        type="button"
                        title="Toggle Bold"
                        onClick={() => {
                          pushFormatChange({ bold: !documentIsBold });
                        }}
                        className={`p-1.5 rounded-md transition duration-200 cursor-pointer ${
                          documentIsBold
                            ? 'bg-[#5f6f52] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Toggle Italic"
                        onClick={() => {
                          pushFormatChange({ italic: !documentIsItalic });
                        }}
                        className={`p-1.5 rounded-md transition duration-200 cursor-pointer ${
                          documentIsItalic
                            ? 'bg-[#5f6f52] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-3.5 bg-slate-200 mx-0.5"></div>
                      <button
                        type="button"
                        title="Force Bulleted Lists"
                        onClick={() => {
                          const newValue = documentListStyle === 'disc' ? 'default' : 'disc';
                          pushFormatChange({ listStyle: newValue });
                        }}
                        className={`p-1.5 rounded-md transition duration-200 cursor-pointer ${
                          documentListStyle === 'disc'
                            ? 'bg-[#5f6f52] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Force Numbered Lists"
                        onClick={() => {
                          const newValue = documentListStyle === 'decimal' ? 'default' : 'decimal';
                          pushFormatChange({ listStyle: newValue });
                        }}
                        className={`p-1.5 rounded-md transition duration-200 cursor-pointer ${
                          documentListStyle === 'decimal'
                            ? 'bg-[#5f6f52] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Undo/Redo & Clear Formatting */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 no-print" id="history-control-toolbar">
                      <button
                        type="button"
                        title="Undo Formatting Change"
                        disabled={historyIndex <= 0}
                        onClick={handleFormatUndo}
                        className={`p-1.5 rounded-md transition duration-200 cursor-pointer ${
                          historyIndex <= 0
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Undo className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Redo Formatting Change"
                        disabled={historyIndex >= formatHistory.length - 1}
                        onClick={handleFormatRedo}
                        className={`p-1.5 rounded-md transition duration-200 cursor-pointer ${
                          historyIndex >= formatHistory.length - 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Redo className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-3.5 bg-slate-200 mx-0.5"></div>
                      <button
                        type="button"
                        title="Clear Formatting"
                        onClick={handleClearFormatting}
                        className="p-1.5 rounded-md transition duration-200 cursor-pointer text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                      <button
                        onClick={() => {
                          setIsHandwrittenTheme(true);
                          localStorage.setItem('pedagogical_paper_style', 'classic');
                          window.dispatchEvent(new Event('paper_theme_changed'));
                        }}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition flex items-center gap-1.5 ${
                          isHandwrittenTheme
                            ? 'bg-[#5f6f52] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        📝 Classic Notebook
                      </button>
                      <button
                        onClick={() => {
                          setIsHandwrittenTheme(false);
                          localStorage.setItem('pedagogical_paper_style', 'modern');
                          window.dispatchEvent(new Event('paper_theme_changed'));
                        }}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition flex items-center gap-1.5 ${
                          !isHandwrittenTheme
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        💻 Modern Minimalist
                      </button>
                    </div>

                    <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isDarkMode
                            ? 'bg-slate-800 text-amber-300 border border-slate-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                        title="Toggle Dark Mode (Persisted in LocalStorage)"
                      >
                        {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
                        <span>{isDarkMode ? 'Dark Mode: ON' : 'Dark Mode: OFF'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowStickyNotesOverlay(!showStickyNotesOverlay)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition flex items-center gap-1.5 ${
                          showStickyNotesOverlay
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                        title="Toggle Sticky Notes Overlay"
                      >
                        📌 Sticky Notes: {showStickyNotesOverlay ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attached Lesson Whiteboard / Sketchpad widget */}
                {document.whiteboardData ? (
                  <div className="bg-[#faf6ee] border border-indigo-200/60 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xs border border-indigo-100/50">
                        <Paintbrush className="w-5 h-5 animate-pulse text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Attached Sketchpad Flowchart</h4>
                        <p className="text-xs text-slate-500">
                          {isStudent 
                            ? 'Your teacher has shared a custom flowchart/diagram with these notes.' 
                            : 'You have saved an interactive whiteboard sketch for this lesson.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsWhiteboardOpen(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      {isStudent ? 'View Teacher\'s Diagram' : 'Open & Edit Whiteboard'}
                    </button>
                  </div>
                ) : (
                  !isStudent && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 no-print animate-fadeIn">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-sm">
                          🎨
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Add custom sketches or flowcharts</p>
                          <p className="text-[10px] text-slate-500">Need to sketch chemistry cycles or step diagrams? Share them directly with students.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsWhiteboardOpen(true)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl cursor-pointer border border-indigo-100/50"
                      >
                        + Start Drawing
                      </button>
                    </div>
                  )
                )}

                {selectedDifferentiatedView !== 'core' && !displayContent ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-indigo-50/40 rounded-2xl border border-indigo-100 max-w-xl mx-auto my-12 animate-fadeIn no-print">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                      <Sparkles className="w-8 h-8 animate-pulse text-indigo-600" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      {selectedDifferentiatedView === 'detailed' 
                        ? '📝 Detailed Notes' 
                        : selectedDifferentiatedView === 'advanced' 
                        ? '🚀 Advanced Enrichment Track' 
                        : '🧩 Scaffolded Support Track'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 max-w-sm leading-relaxed">
                      {selectedDifferentiatedView === 'detailed'
                        ? 'Generate highly detailed study notes styled like a real high-performing student\'s revision notebook on clean A4 lined paper, utilizing realistic handwriting fonts, visual doodles, yellow neon highlights, and red ink circles.'
                        : selectedDifferentiatedView === 'advanced' 
                        ? 'Generate high-order questions (Bloom\'s Taxonomy), creative inquiry tasks, and extension challenges for quick-finishers and gifted learners.'
                        : 'Generate structured scaffolding, broken-down instruction sequences, sentence frames, and simplified vocab list for students requiring extra support.'}
                    </p>
                    
                    {diffError && (
                      <div className="mt-4 p-2 bg-red-50 text-red-700 text-[10px] rounded border border-red-100 font-mono w-full text-left">
                        {diffError}
                      </div>
                    )}
                    
                    <button
                      onClick={handleGenerateDifferentiated}
                      disabled={isGeneratingDifferentiated}
                      className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-[#4f46e5] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isGeneratingDifferentiated ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>
                        {isGeneratingDifferentiated 
                          ? 'Differentiating with Gemini AI...' 
                          : `Generate ${selectedDifferentiatedView === 'detailed' ? 'Detailed Notes' : selectedDifferentiatedView === 'advanced' ? 'Advanced' : 'Support'} Version`}
                      </span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Tiny info banner indicating active differentiated view */}
                    {selectedDifferentiatedView !== 'core' && (
                      <div className={`mb-4 p-3 rounded-xl border flex items-center justify-between gap-3 no-print animate-fadeIn ${
                        selectedDifferentiatedView === 'detailed'
                          ? 'bg-[#fcf8f2] border-amber-200 text-amber-950'
                          : selectedDifferentiatedView === 'advanced' 
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-950' 
                          : 'bg-amber-50 border-amber-100 text-amber-950'
                      }`}>
                        <div className="flex items-center gap-2 text-left">
                          <span className="text-sm">
                            {selectedDifferentiatedView === 'detailed' ? '📝' : selectedDifferentiatedView === 'advanced' ? '🚀' : '🧩'}
                          </span>
                          <div>
                            <p className="text-xs font-bold">
                              Viewing: {selectedDifferentiatedView === 'detailed' ? 'Detailed Student Revision Notes' : selectedDifferentiatedView === 'advanced' ? 'Advanced Enrichment Track' : 'Scaffolded Support Track'}
                            </p>
                            <p className="text-[10px] opacity-80">
                              {selectedDifferentiatedView === 'detailed'
                                ? "This version is custom-styled like a high-performing student's revision notebook on lined paper."
                                : "This version has been custom-pedagogically tailored for students on this track."}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedDifferentiatedView('core')}
                          className="text-[10px] font-extrabold underline uppercase cursor-pointer hover:opacity-80 transition"
                        >
                          Back to Core
                        </button>
                      </div>
                    )}

                    <motion.div
                      key={`doc-body-${document.id || document.title}-${selectedDifferentiatedView}-${documentOrientation}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      ref={containerRef}
                      onMouseMove={handleAccessibilityMouseMove}
                      onDoubleClick={handleDocumentDoubleClick}
                      onMouseUp={handleTextSelection}
                      className={`relative rounded-2xl transition-all duration-300 p-4 md:p-6 mx-auto ${
                        documentOrientation === 'landscape' ? 'max-w-[1150px] shadow-sm border border-slate-200/70 bg-white/95' : ''
                      } ${getAccessibilityBgClass()} ${isDyslexiaMode ? 'dyslexia-font' : ''}`}
                      style={{ fontFamily: isDyslexiaMode ? '"Comic Sans MS", "Chalkboard SE", "Inter", sans-serif' : undefined }}
                    >
                      {/* Landscape Orientation Indicator Badge */}
                      {documentOrientation === 'landscape' && (
                        <div className="mb-4 pb-2 border-b border-slate-100 flex items-center justify-between no-print">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#5f6f52]/10 border border-[#5f6f52]/20 text-[#5f6f52] text-[10px] font-extrabold uppercase tracking-wider">
                            <FileText className="w-3 h-3 rotate-90" />
                            Landscape View Mode Active (1150px Wide Canvas)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOrientationToggle('portrait')}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer"
                          >
                            Switch to Portrait
                          </button>
                        </div>
                      )}
                      {/* Floating Sticky Annotation Tool Popover */}
                      {floatingToolPos && floatingSelectedText && (
                        <div
                          className="absolute z-50 animate-fadeIn text-left select-none no-print"
                          style={{
                            left: `${Math.max(10, Math.min(floatingToolPos.x, (containerRef.current?.getBoundingClientRect().width || 400) - 170))}px`,
                            top: `${Math.max(10, floatingToolPos.y)}px`
                          }}
                        >
                          {!isAddingFloatingAnnotation && !isAddingFloatingComment ? (
                            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded-full shadow-2xl border border-slate-700/60">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingFloatingComment(true);
                                  setIsAddingFloatingAnnotation(false);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-full shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5 fill-white text-white" />
                                <span>💬 Add Side-Note</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingFloatingAnnotation(true);
                                  setIsAddingFloatingComment(false);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-200 text-xs font-bold rounded-full transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-slate-700"
                              >
                                <Bookmark className="w-3.5 h-3.5 text-amber-300" />
                                <span>Private Note</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFloatingToolPos(null);
                                  setFloatingSelectedText('');
                                }}
                                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
                                title="Dismiss"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : isAddingFloatingComment ? (
                            <div className="bg-white border-2 border-amber-400 shadow-2xl rounded-2xl p-3.5 w-80 flex flex-col gap-2.5 relative animate-scaleIn">
                              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                                <div className="flex items-center gap-1.5 text-amber-800">
                                  <MessageSquare className="w-4 h-4 text-amber-600 fill-amber-500" />
                                  <span className="text-xs font-extrabold uppercase tracking-wider">Collaborative Side-Note</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingFloatingComment(false);
                                    setFloatingToolPos(null);
                                    setFloatingSelectedText('');
                                  }}
                                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="bg-amber-50/70 border border-amber-200/70 p-2 rounded-xl text-[10px] text-amber-950 font-mono italic leading-relaxed line-clamp-3">
                                "{floatingSelectedText}"
                              </div>

                              <form onSubmit={handleAddFloatingComment} className="space-y-2.5">
                                {/* Category Selection */}
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Category Tag</label>
                                  <div className="flex flex-wrap gap-1">
                                    {(['Pedagogical Note', 'Question', 'Correction', 'Teaching Tip', 'Differentiated Guidance', 'General'] as const).map(cat => (
                                      <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setFloatingCommentCategory(cat)}
                                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition cursor-pointer border ${
                                          floatingCommentCategory === cat
                                            ? 'bg-amber-600 border-amber-700 text-white shadow-2xs'
                                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                                        }`}
                                      >
                                        {cat}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <textarea
                                  value={floatingCommentNote}
                                  onChange={(e) => setFloatingCommentNote(e.target.value)}
                                  placeholder="Write collaborative observation, feedback, or side-note for this text block..."
                                  className="w-full h-16 bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition resize-none leading-relaxed text-slate-800"
                                  required
                                  autoFocus
                                />

                                {/* Highlight Color Selection */}
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase">Highlight Accent:</span>
                                  <div className="flex items-center gap-1.5">
                                    {(['yellow', 'green', 'pink', 'blue'] as const).map((color) => {
                                      const colorBg = 
                                        color === 'yellow' ? 'bg-amber-100 border-amber-300' :
                                        color === 'green' ? 'bg-emerald-100 border-emerald-300' :
                                        color === 'pink' ? 'bg-rose-100 border-rose-300' :
                                        'bg-sky-100 border-sky-300';
                                      
                                      const isSelected = floatingCommentColor === color;

                                      return (
                                        <button
                                          key={color}
                                          type="button"
                                          onClick={() => setFloatingCommentColor(color)}
                                          className={`w-4 h-4 rounded-full border cursor-pointer transition-all ${colorBg} ${isSelected ? 'ring-2 ring-amber-600 scale-110 shadow-xs' : 'hover:scale-105'}`}
                                          title={`${color} highlight color`}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="flex justify-end pt-1">
                                  <button
                                    type="submit"
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-xl shadow-sm transition cursor-pointer"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Attach Side-Note</span>
                                  </button>
                                </div>
                              </form>
                            </div>
                          ) : (
                            <div className="bg-amber-50 border-2 border-amber-300 shadow-xl rounded-xl p-3 w-72 flex flex-col gap-2 relative rotate-1">
                              {/* Tape style header */}
                              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-amber-200/60 border border-amber-300/40 rotate-1 shadow-2xs pointer-events-none" />
                              
                              <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5 pt-1">
                                <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">New Sticky Annotation</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingFloatingAnnotation(false);
                                    setFloatingToolPos(null);
                                    setFloatingSelectedText('');
                                  }}
                                  className="p-0.5 rounded-full hover:bg-amber-100 text-amber-600 hover:text-amber-800 transition"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              <p className="text-[9px] text-amber-800 bg-amber-100/50 p-1.5 rounded border border-amber-200/50 font-mono italic line-clamp-2">
                                "{floatingSelectedText}"
                              </p>

                              <form onSubmit={handleAddFloatingAnnotation} className="space-y-2">
                                <textarea
                                  value={floatingAnnotationNote}
                                  onChange={(e) => setFloatingAnnotationNote(e.target.value)}
                                  placeholder="Type private study guidance, teacher cue, or sticky note text..."
                                  className="w-full h-16 bg-white border border-amber-200 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:border-amber-500 transition resize-none leading-relaxed text-slate-800 font-sans"
                                  required
                                  autoFocus
                                />

                                {/* Color Picker */}
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[9px] font-bold text-amber-800 uppercase">Sticky Color:</span>
                                  <div className="flex items-center gap-1.5">
                                    {(['yellow', 'green', 'pink', 'blue'] as const).map((color) => {
                                      const colorBg = 
                                        color === 'yellow' ? 'bg-amber-100 border-amber-300' :
                                        color === 'green' ? 'bg-emerald-100 border-emerald-300' :
                                        color === 'pink' ? 'bg-rose-100 border-rose-300' :
                                        'bg-sky-100 border-sky-300';
                                      
                                      const isSelected = floatingAnnotationColor === color;

                                      return (
                                        <button
                                          key={color}
                                          type="button"
                                          onClick={() => setFloatingAnnotationColor(color)}
                                          className={`w-4 h-4 rounded-full border cursor-pointer transition-all ${colorBg} ${isSelected ? 'ring-2 ring-amber-600 scale-110 shadow-xs' : 'hover:scale-105'}`}
                                          title={`${color} sticky note`}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="flex justify-end pt-1">
                                  <button
                                    type="submit"
                                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition cursor-pointer"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Stick It!</span>
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Focus Reading Ruler */}
                      {isReadingRulerEnabled && (
                        <div 
                          className="absolute left-0 right-0 bg-amber-400/15 border-y border-amber-400/40 pointer-events-none z-10 shadow-[0_0_15px_rgba(251,191,36,0.1)] transition-all duration-75"
                          style={{
                            top: `${rulerY - rulerHeight / 2}px`,
                            height: `${rulerHeight}px`
                          }}
                        />
                      )}

                      {/* Academic Vocabulary Tooltip Modal */}
                      {activeAcademicVocab && (
                        <div 
                          className="absolute z-50 bg-white border-2 border-indigo-200 shadow-2xl rounded-2xl p-4 max-w-md w-96 animate-fadeIn text-left space-y-3 select-none ring-4 ring-indigo-500/10 no-print"
                          style={{
                            left: `${activeAcademicVocab.x}px`,
                            top: `${activeAcademicVocab.y}px`
                          }}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-indigo-100 pb-2 gap-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                ✨
                              </div>
                              <div>
                                <span className="text-[10px] font-extrabold uppercase text-indigo-700 tracking-wider block leading-tight">
                                  Academic Vocabulary
                                </span>
                                {activeAcademicVocab.matchedData?.category && (
                                  <span className="text-[9px] font-bold text-slate-400 block">
                                    {activeAcademicVocab.matchedData.category}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={() => setActiveAcademicVocab(null)}
                              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                              title="Close Tooltip"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Content */}
                          <div className="space-y-2.5">
                            <div className="flex items-baseline justify-between gap-2">
                              <h4 className="text-base font-black text-slate-900 tracking-tight">
                                {activeAcademicVocab.matchedData?.word || activeAcademicVocab.dynamicData?.word || activeAcademicVocab.term}
                              </h4>
                              {(activeAcademicVocab.matchedData?.type || activeAcademicVocab.dynamicData?.type) && (
                                <span className="text-[10px] font-mono font-bold italic text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
                                  {activeAcademicVocab.matchedData?.type || activeAcademicVocab.dynamicData?.type}
                                </span>
                              )}
                            </div>

                            {isFetchingDynamicVocab ? (
                              <div className="flex items-center gap-2 text-xs text-indigo-600 py-3 font-medium">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generating AI definition & 3 academic context examples...</span>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                  {activeAcademicVocab.matchedData?.definition || activeAcademicVocab.dynamicData?.definition || activeAcademicVocab.dynamicDef}
                                </p>

                                {/* 3 Example Sentences in Different Academic Contexts */}
                                {(() => {
                                  const examplesList: ContextExample[] = activeAcademicVocab.matchedData
                                    ? get3ContextExamplesForTerm(activeAcademicVocab.matchedData)
                                    : (activeAcademicVocab.dynamicData?.examples && activeAcademicVocab.dynamicData.examples.length >= 3
                                        ? activeAcademicVocab.dynamicData.examples
                                        : [
                                            { context: 'STEM / Natural Sciences', sentence: `Researchers analyze how ${activeAcademicVocab.term} operates in physical or biological systems.` },
                                            { context: 'Humanities & Social Studies', sentence: `Literary and historical analyses frequently evaluate the social impact of ${activeAcademicVocab.term}.` },
                                            { context: 'Academic Research & Essay', sentence: `Constructing a persuasive thesis requires critically evaluating ${activeAcademicVocab.term}.` }
                                          ]);

                                  return (
                                    <div className="space-y-1.5 pt-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                                          <BookOpen className="w-3 h-3 text-indigo-600" />
                                          Academic Context Examples (3):
                                        </span>
                                      </div>

                                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                                        {examplesList.slice(0, 3).map((ex, idx) => (
                                          <div key={idx} className="bg-indigo-50/50 border border-indigo-100/80 rounded-xl p-2 space-y-0.5">
                                            <div className="flex items-center justify-between gap-1">
                                              <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-100/90 px-1.5 py-0.2 rounded-md">
                                                Context {idx + 1}: {ex.context}
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-slate-700 italic font-medium leading-normal">
                                              "{ex.sentence}"
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => speakText(activeAcademicVocab.matchedData?.word || activeAcademicVocab.dynamicData?.word || activeAcademicVocab.term)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition shadow-xs cursor-pointer"
                                title="Listen to pronunciation"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>Pronounce</span>
                              </button>

                              <button
                                onClick={handleExportToFlashcards}
                                disabled={isExportingFlashcard || isFetchingDynamicVocab}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1 transition shadow-xs cursor-pointer ${
                                  flashcardExportStatus
                                    ? 'bg-emerald-600 text-white border border-emerald-600'
                                    : 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-500'
                                }`}
                                title="Save this complex word, definition, and 3 example sentences into a revision flashcard list"
                              >
                                {isExportingFlashcard ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : flashcardExportStatus ? (
                                  <Check className="w-3 h-3 text-white" />
                                ) : (
                                  <Layers className="w-3 h-3" />
                                )}
                                <span>{flashcardExportStatus || 'Export to Flashcards'}</span>
                              </button>
                            </div>

                            <span className="text-[9px] text-indigo-600 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                              3 Context Examples ✨
                            </span>
                          </div>
                        </div>
                      )}

                      {isHandwrittenTheme && (
                        <div className="no-print mb-6 p-4 rounded-xl bg-amber-50/50 border border-amber-200/40 flex flex-wrap gap-4 items-center justify-between text-xs font-semibold text-slate-700">
                          <div className="flex flex-wrap items-center gap-4">
                            {/* Paper Selector */}
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200/80 shadow-xs">
                              <span className="px-2 text-[10px] uppercase font-black tracking-wider text-amber-800">Paper</span>
                              <button
                                onClick={() => setViewerPaperStyle('ruled')}
                                className={`px-2.5 py-1 rounded-md transition font-bold cursor-pointer ${viewerPaperStyle === 'ruled' ? 'bg-amber-100 text-amber-900 border border-amber-200 shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
                              >
                                Lined
                              </button>
                              <button
                                onClick={() => setViewerPaperStyle('grid')}
                                className={`px-2.5 py-1 rounded-md transition font-bold cursor-pointer ${viewerPaperStyle === 'grid' ? 'bg-amber-100 text-amber-900 border border-amber-200 shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
                              >
                                Grid
                              </button>
                              <button
                                onClick={() => setViewerPaperStyle('blank')}
                                className={`px-2.5 py-1 rounded-md transition font-bold cursor-pointer ${viewerPaperStyle === 'blank' ? 'bg-amber-100 text-amber-900 border border-amber-200 shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
                              >
                                Plain
                              </button>
                            </div>

                            {/* Ink Selector */}
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200/80 shadow-xs">
                              <span className="px-2 text-[10px] uppercase font-black tracking-wider text-amber-800">Ink</span>
                              <button
                                onClick={() => setViewerPenColor('blue')}
                                className={`px-2.5 py-1 rounded-md transition font-bold flex items-center gap-1.5 cursor-pointer ${viewerPenColor === 'blue' ? 'bg-blue-50 text-blue-800 border border-blue-200/60 shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
                              >
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                                <span>Blue</span>
                              </button>
                              <button
                                onClick={() => setViewerPenColor('black')}
                                className={`px-2.5 py-1 rounded-md transition font-bold flex items-center gap-1.5 cursor-pointer ${viewerPenColor === 'black' ? 'bg-slate-100 text-slate-800 border border-slate-200 shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
                              >
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-950"></span>
                                <span>Black</span>
                              </button>
                            </div>

                            {/* Zoom Controls */}
                            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200/80 shadow-xs">
                              <span className="px-2 text-[10px] uppercase font-black tracking-wider text-amber-800">Zoom</span>
                              <button
                                onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.1))}
                                disabled={zoomLevel <= 0.6}
                                className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer font-bold"
                                title="Zoom Out"
                              >
                                -
                              </button>
                              <span className="px-2 font-mono font-bold text-slate-700 min-w-[40px] text-center">
                                {Math.round(zoomLevel * 100)}%
                              </span>
                              <button
                                onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))}
                                disabled={zoomLevel >= 1.5}
                                className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer font-bold"
                                title="Zoom In"
                              >
                                +
                              </button>
                              <button
                                onClick={() => setZoomLevel(1.0)}
                                className="ml-1 px-2 py-1 text-[10px] font-extrabold border border-slate-200 hover:bg-slate-50 rounded-md cursor-pointer uppercase tracking-wider text-slate-500"
                              >
                                Reset
                              </button>
                            </div>

                            {/* Doodles Toggle */}
                            <button
                              onClick={() => setShowDoodles(!showDoodles)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition shadow-xs cursor-pointer ${
                                showDoodles 
                                  ? 'bg-amber-100 border-amber-300 text-amber-900' 
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                              }`}
                            >
                              <span>✏️</span>
                              <span>Margin Doodles</span>
                              <span className="text-[10px] font-extrabold uppercase">
                                {showDoodles ? 'On' : 'Off'}
                              </span>
                            </button>

                            {/* Printer-Friendly Background Toggle */}
                            <button
                              onClick={() => setPrinterFriendly(!printerFriendly)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition shadow-xs cursor-pointer ${
                                printerFriendly 
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100' 
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                              }`}
                              title="Toggle between full notebook paper texture or a clean white background for printer ink efficiency"
                            >
                              <span>🖨️</span>
                              <span>Printer-Friendly (White)</span>
                              <span className="text-[10px] font-extrabold uppercase">
                                {printerFriendly ? 'On' : 'Off'}
                              </span>
                            </button>
                          </div>

                          {/* Export Button */}
                          <button
                            onClick={handleExportHandwrittenPDF}
                            disabled={isGeneratingHandwrittenPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                          >
                            {isGeneratingHandwrittenPDF ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Exporting...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>Export Handwritten PDF</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {isHandwrittenTheme ? (
                        <div className="overflow-x-auto w-full flex flex-col items-center py-4">
                          <style>{`
                            #handwritten-notebook-paper.handwritten-content h1,
                            #handwritten-notebook-paper.handwritten-content h2,
                            #handwritten-notebook-paper.handwritten-content h3,
                            #handwritten-notebook-paper.handwritten-content h4 {
                              color: ${viewerPenColor === 'blue' ? '#1e40af' : '#111827'} !important;
                              border-color: ${viewerPenColor === 'blue' ? 'rgba(30, 64, 175, 0.25)' : 'rgba(17, 24, 39, 0.2)'} !important;
                            }
                            #handwritten-notebook-paper.handwritten-content li::marker {
                              color: ${viewerPenColor === 'blue' ? '#2563eb' : '#374151'} !important;
                            }
                            #handwritten-notebook-paper.printer-friendly::before,
                            #handwritten-notebook-paper.printer-friendly::after {
                              display: none !important;
                              content: none !important;
                            }
                            #handwritten-notebook-paper.printer-friendly {
                              border-color: transparent !important;
                              box-shadow: none !important;
                            }
                          `}</style>
                          
                          <div 
                            id="handwritten-notebook-paper"
                            className={`notebook-paper handwritten-content py-8 pr-4 print:p-0 print:bg-transparent print:shadow-none animate-fadeIn relative ${printerFriendly ? 'printer-friendly' : ''}`}
                            style={{ 
                              fontSize: `${documentFontSize}rem`,
                              backgroundColor: printerFriendly ? '#ffffff' : '#faf6ee',
                              backgroundImage: 
                                printerFriendly
                                  ? 'none'
                                  : viewerPaperStyle === 'ruled'
                                  ? 'linear-gradient(#c5d1e0 1px, transparent 1px)'
                                  : viewerPaperStyle === 'grid'
                                  ? 'linear-gradient(#c5d1e0 1px, transparent 1px), linear-gradient(90deg, #c5d1e0 1px, transparent 1px)'
                                  : 'none',
                              backgroundSize: 
                                printerFriendly
                                  ? 'none'
                                  : viewerPaperStyle === 'grid'
                                  ? '1.85rem 1.85rem'
                                  : '100% 1.85rem',
                              color: viewerPenColor === 'blue' ? '#1e3a8a' : '#111827',
                              transform: `scale(${zoomLevel})`,
                              transformOrigin: 'top center',
                              transition: 'transform 0.2s ease-out',
                              width: '100%',
                              maxWidth: '850px',
                              marginBottom: `${(zoomLevel - 1) * 75}%`
                            }}
                          >
                            {/* EduNexus Watermark Background & Corner Branding Overlay */}
                            <NexusWatermark />

                            {/* Authentic Hand-sketched Margin Doodles */}
                            {showDoodles && (
                              <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-2xl">
                                {/* 1. Left Margin Star Clip Doodle */}
                                <div 
                                  className="absolute left-[1.5rem] top-[18%] transition-colors duration-300"
                                  style={{ color: viewerPenColor === 'blue' ? 'rgba(30, 58, 138, 0.25)' : 'rgba(17, 24, 39, 0.22)' }}
                                >
                                  <svg className="w-10 h-10 rotate-[-15deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                </div>

                                {/* 2. Left Margin Checkmark Doodle */}
                                <div 
                                  className="absolute left-[1.8rem] top-[45%] transition-colors duration-300"
                                  style={{ color: viewerPenColor === 'blue' ? 'rgba(30, 58, 138, 0.25)' : 'rgba(17, 24, 39, 0.22)' }}
                                >
                                  <svg className="w-8 h-8 rotate-[10deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M20 6L9 17l-5-5" />
                                  </svg>
                                </div>

                                {/* 3. Left Margin Thumb Up Doodle */}
                                <div 
                                  className="absolute left-[1.6rem] top-[75%] transition-colors duration-300"
                                  style={{ color: viewerPenColor === 'blue' ? 'rgba(30, 58, 138, 0.22)' : 'rgba(17, 24, 39, 0.18)' }}
                                >
                                  <svg className="w-10 h-10 rotate-[-5deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                  </svg>
                                </div>

                                {/* 4. Top Right Margin Lightbulb Doodle */}
                                <div 
                                  className="absolute right-[2.5rem] top-[4%] transition-colors duration-300"
                                  style={{ color: viewerPenColor === 'blue' ? 'rgba(30, 58, 138, 0.25)' : 'rgba(17, 24, 39, 0.22)' }}
                                >
                                  <svg className="w-12 h-12 rotate-[12deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                    <path d="M9 18h6M10 22h4M12 2v1M5.22 5.22l.71.71M18.78 5.22l-.71.71" />
                                    <path d="M12 3a9 9 0 0 0-9 9c0 2.12.74 4.07 1.97 5.61A4.98 4.98 0 0 1 7 21h10a4.98 4.98 0 0 1 2.03-3.39A9 9 0 0 0 12 3z" />
                                  </svg>
                                </div>

                                {/* 5. Right Margin Sparkles Doodle */}
                                <div 
                                  className="absolute right-[2.8rem] top-[30%] transition-colors duration-300"
                                  style={{ color: viewerPenColor === 'blue' ? 'rgba(30, 58, 138, 0.25)' : 'rgba(17, 24, 39, 0.22)' }}
                                >
                                  <svg className="w-11 h-11 rotate-[-12deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
                                  </svg>
                                </div>

                                {/* 6. Right Margin Science / Math Equation Sketch */}
                                <div 
                                  className="absolute right-[2.2rem] top-[58%] transition-colors duration-300 font-serif text-[11px] select-none italic font-bold opacity-30 whitespace-nowrap rotate-6"
                                  style={{ color: viewerPenColor === 'blue' ? '#1e3a8a' : '#111827' }}
                                >
                                  E = mc²
                                </div>

                                {/* 7. Bottom Right Corner Graduate Hat Doodle */}
                                <div 
                                  className="absolute right-[2.5rem] bottom-[5%] transition-colors duration-300"
                                  style={{ color: viewerPenColor === 'blue' ? 'rgba(30, 58, 138, 0.25)' : 'rgba(17, 24, 39, 0.22)' }}
                                >
                                  <svg className="w-14 h-14 rotate-[-8deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                                  </svg>
                                </div>
                              </div>
                            )}

                            {/* EduNexus Brand Header (Top Left corner of document) */}
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200/50">
                              <img src="/icon.svg" alt="EduNexus Logo" className="w-7 h-7 rounded-lg shadow-xs" referrerPolicy="no-referrer" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black tracking-wider uppercase font-sans" style={{ color: viewerPenColor === 'blue' ? '#1e40af' : '#111827' }}>EduNexus</span>
                                <span className="text-[8px] font-mono tracking-tight uppercase" style={{ color: viewerPenColor === 'blue' ? '#3b82f6' : '#4b5563' }}>Curriculum Notes</span>
                              </div>
                            </div>

                            {loadingDbImage ? (
                              <div className="space-y-6">
                                <h1 className="font-bold text-3xl mb-4" style={{ color: viewerPenColor === 'blue' ? '#1e40af' : '#030712' }}>
                                  {displayTitle}
                                </h1>
                                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 min-h-[350px]">
                                  <Loader2 className="w-8 h-8 animate-spin text-[#5f6f52] mb-3" />
                                  <p className="text-sm font-medium text-slate-500 animate-pulse">Retrieving premium handwritten notes from cloud database...</p>
                                </div>
                              </div>
                            ) : dbImageUrl ? (
                              <div className="space-y-6">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 no-print">
                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black uppercase tracking-wider rounded-lg shadow-3xs">
                                      📖 Classic Handwritten Notes (1-Page A4 PNG)
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleDownloadPNG}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
                                    title="Download this classic handwritten note document as a high-resolution 1-page A4 PNG file"
                                  >
                                    <Download className="w-4 h-4" />
                                    <span>Download 1-Page A4 PNG</span>
                                  </button>
                                </div>
                                <h1 className="font-bold text-3xl mb-4" style={{ color: viewerPenColor === 'blue' ? '#1e40af' : '#030712' }}>
                                  {displayTitle}
                                </h1>
                                <div className="relative rounded-xl overflow-hidden border border-slate-300/80 shadow-xl bg-white max-w-[210mm] mx-auto aspect-[210/297] flex items-center justify-center p-2">
                                  <img 
                                    src={dbImageUrl} 
                                    alt={`${document.topic} Lesson Notes`} 
                                    className="w-full h-full object-contain transition-all duration-300 rounded-lg"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="flex justify-center pt-2 pb-4 no-print">
                                  <button
                                    onClick={() => setShowTranscribedText(!showTranscribedText)}
                                    className="px-4 py-2 bg-[#5f6f52]/10 hover:bg-[#5f6f52]/20 text-[#5f6f52] rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-[#5f6f52]/20"
                                  >
                                    <span>{showTranscribedText ? "🙈 Hide Transcribed Text" : "👁️ View Transcribed Lesson Text"}</span>
                                  </button>
                                </div>
                                {showTranscribedText && (
                                  <div className="border-t border-dashed border-slate-300 pt-6 mt-6">
                                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 font-mono">Transcribed Lesson Notes</h4>
                                    <MarkdownView
                                      content={transcribedDisplayContent}
                                      onGenerateDiagram={handleGenerateDiagram}
                                      generatingPlaceholders={generatingPlaceholders}
                                      highlightedTexts={commentsHighlightedTexts}
                                      onHighlightClick={handleHighlightClick}
                                      annotationHighlightedTexts={showStickyNotesOverlay ? annotationsHighlightedTexts : []}
                                      onAnnotationHighlightClick={handleAnnotationHighlightClick}
                                      annotations={showStickyNotesOverlay ? annotations : []}
                                      reactions={reactions}
                                      onToggleReaction={handleToggleReaction}
                                      currentUserId={profile?.uid}
                                      alignment={documentAlignment}
                                      bold={documentIsBold}
                                      italic={documentIsItalic}
                                      listStyle={documentListStyle}
                                      fontFamily={documentFontFamily}
                                      pedagogicalMode={documentPedagogicalMode}
                                      onSpeakText={handleSpeakSingleBlock}
                                      currentlySpokenText={spokenBlockText}
                                      currentSpeechCharIndex={currentSpeechCharIndex}
                                      isDyslexiaMode={isDyslexiaMode}
                                      highlightAcademicVocab={highlightAcademicVocab}
                                      onAcademicVocabClick={handleAcademicVocabClick}
                                    />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                <h1 className="font-bold text-3xl mb-4" style={{ color: viewerPenColor === 'blue' ? '#1e40af' : '#030712' }}>
                                  {displayTitle}
                                </h1>
                                <MarkdownView
                                  content={preprocessedDisplayContent}
                                  onGenerateDiagram={handleGenerateDiagram}
                                  generatingPlaceholders={generatingPlaceholders}
                                  highlightedTexts={commentsHighlightedTexts}
                                  onHighlightClick={handleHighlightClick}
                                  annotationHighlightedTexts={showStickyNotesOverlay ? annotationsHighlightedTexts : []}
                                  onAnnotationHighlightClick={handleAnnotationHighlightClick}
                                  annotations={showStickyNotesOverlay ? annotations : []}
                                  reactions={reactions}
                                  onToggleReaction={handleToggleReaction}
                                  currentUserId={profile?.uid}
                                  alignment={documentAlignment}
                                  bold={documentIsBold}
                                  italic={documentIsItalic}
                                  listStyle={documentListStyle}
                                  fontFamily={documentFontFamily}
                                  pedagogicalMode={documentPedagogicalMode}
                                  onSpeakText={handleSpeakSingleBlock}
                                  currentlySpokenText={spokenBlockText}
                                  currentSpeechCharIndex={currentSpeechCharIndex}
                                  isDyslexiaMode={isDyslexiaMode}
                                  highlightAcademicVocab={highlightAcademicVocab}
                                  onAcademicVocabClick={handleAcademicVocabClick}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="modern-minimalist minimalist-content py-8 print:p-0 print:bg-transparent print:shadow-none animate-fadeIn relative"
                          style={{ fontSize: `${documentFontSize}rem` }}
                        >
                          {/* EduNexus Watermark Background & Corner Branding Overlay */}
                          <NexusWatermark />

                          {/* EduNexus Brand Header (Top Left corner of document) */}
                          <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 pb-3">
                            <img src="/icon.svg" alt="EduNexus Logo" className="w-8 h-8 rounded-lg shadow-xs" referrerPolicy="no-referrer" />
                            <div className="flex flex-col">
                              <span className="text-xs font-black tracking-wider text-[#5f6f52] uppercase font-sans">EduNexus</span>
                              <span className="text-[9px] text-slate-400 font-mono tracking-tight uppercase">Curriculum Library</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-3 no-print">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs">
                              <Timer className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>Estimated Reading Time: <strong>{liveReadingTimeMin} min read</strong></span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span>{liveWordCount.toLocaleString()} words</span>
                            </span>
                          </div>

                          <h1 className="font-bold text-3xl mb-4 text-slate-900">
                            {displayTitle}
                          </h1>
                          <MarkdownView
                            content={preprocessedDisplayContent}
                            onGenerateDiagram={handleGenerateDiagram}
                            generatingPlaceholders={generatingPlaceholders}
                            highlightedTexts={commentsHighlightedTexts}
                            onHighlightClick={handleHighlightClick}
                            annotationHighlightedTexts={showStickyNotesOverlay ? annotationsHighlightedTexts : []}
                            onAnnotationHighlightClick={handleAnnotationHighlightClick}
                            annotations={showStickyNotesOverlay ? annotations : []}
                            reactions={reactions}
                            onToggleReaction={handleToggleReaction}
                            currentUserId={profile?.uid}
                            alignment={documentAlignment}
                            bold={documentIsBold}
                            italic={documentIsItalic}
                            listStyle={documentListStyle}
                            fontFamily={documentFontFamily}
                            pedagogicalMode={documentPedagogicalMode}
                            onSpeakText={handleSpeakSingleBlock}
                            currentlySpokenText={spokenBlockText}
                            currentSpeechCharIndex={currentSpeechCharIndex}
                            isDyslexiaMode={isDyslexiaMode}
                            highlightAcademicVocab={highlightAcademicVocab}
                            onAcademicVocabClick={handleAcademicVocabClick}
                          />
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </div>
            )}

            {/* Real-time Document Stats & Word Count Footer Display */}
            <div id="document-viewer-footer-wordcount" className="mt-6 pt-3.5 border-t border-slate-200/80 no-print flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono select-none">
              <div className="flex items-center gap-3 md:gap-5 flex-wrap">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                  <FileText className="w-3.5 h-3.5 text-[#5f6f52]" />
                  <span><strong className="text-slate-900">{liveWordCount.toLocaleString()}</strong> {liveWordCount === 1 ? 'Word' : 'Words'}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span><strong className="text-slate-800">{liveCharCount.toLocaleString()}</strong> Characters</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <Timer className="w-3.5 h-3.5 text-slate-400" />
                  <span>~<strong className="text-slate-800">{liveReadingTimeMin}</strong> min read</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold">
                {isEditing ? (
                  <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/70 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Live Editor Mode
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/70 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Real-time Count Active
                  </span>
                )}
              </div>
            </div>

            {/* Collaborative Cursor Overlays */}
            {activeSessions.map((sess) => {
              if (sess.cursorX === undefined || sess.cursorX === null || sess.cursorY === undefined || sess.cursorY === null) return null;
              
              // Map userId to a stable color
              const colors = [
                { cursor: '#ef4444', bg: 'bg-red-500', text: 'text-white' }, // Red
                { cursor: '#3b82f6', bg: 'bg-blue-500', text: 'text-white' }, // Blue
                { cursor: '#10b981', bg: 'bg-emerald-500', text: 'text-white' }, // Emerald
                { cursor: '#f59e0b', bg: 'bg-amber-500', text: 'text-white' }, // Amber
                { cursor: '#8b5cf6', bg: 'bg-violet-500', text: 'text-white' }, // Violet
                { cursor: '#ec4899', bg: 'bg-pink-500', text: 'text-white' }, // Pink
                { cursor: '#06b6d4', bg: 'bg-cyan-500', text: 'text-white' }, // Cyan
              ];
              const colorIdx = Math.abs(sess.userId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % colors.length;
              const colorSet = colors[colorIdx];

              return (
                <div
                  key={`cursor-${sess.id}`}
                  className="absolute pointer-events-none z-50 transition-all duration-300 ease-out select-none"
                  style={{
                    left: `${sess.cursorX}%`,
                    top: `${sess.cursorY}%`,
                    transform: 'translate(-2px, -2px)', // Align with pointer
                  }}
                >
                  {/* Cursor Arrow SVG */}
                  <svg
                    className="w-5 h-5 drop-shadow-md"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.65376 12.3825L19.56 5.61625C20.1438 5.33125 20.8038 5.82375 20.7063 6.46875L18.6188 20.3175C18.5213 20.9663 17.7263 21.2138 17.2763 20.7513L13.1288 16.5188L11.0288 19.83C10.7325 20.3 10.0275 20.1863 9.89625 19.6425L8.14875 12.39L5.65376 12.3825Z"
                      fill={colorSet.cursor}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </svg>
                  
                  {/* Cursor Name Badge */}
                  <div className={`ml-3.5 -mt-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap shadow-xs flex items-center gap-1 ${colorSet.bg} ${colorSet.text}`}>
                    <span>{sess.displayName}</span>
                    {sess.isEditing && (
                      <span className="text-[7px] bg-white/20 px-0.5 rounded text-[8px]">EDITING</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

        {/* Accessibility & Reader Assist Sidebar */}
        {isAccessibilityOpen && (
          <div className="w-full xl:w-80 shrink-0 bg-white rounded-2xl border border-[#e5e1da] shadow-sm p-4 space-y-4 no-print flex flex-col max-h-[850px] overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#f4f1ea] pb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Reader Assist</h4>
                  <p className="text-[9px] text-slate-400">Dyslexic, ESL & Auditory Support</p>
                </div>
              </div>
              <button
                onClick={() => setIsAccessibilityOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-left">
              {/* Preset Quick Activations */}
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 space-y-2.5">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Support Presets</h5>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => {
                      setIsDyslexiaMode(!isDyslexiaMode);
                      if (!isDyslexiaMode) {
                        setTintColor('cream');
                        setIsReadingRulerEnabled(true);
                      } else {
                        setTintColor('none');
                        setIsReadingRulerEnabled(false);
                      }
                    }}
                    className={`p-2 rounded-lg text-[10px] font-bold border transition text-center cursor-pointer ${
                      isDyslexiaMode
                        ? 'bg-[#5f6f52] text-white border-[#5f6f52]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    📖 Dyslexia
                  </button>
                  <button
                    onClick={() => {
                      setEslClickToDefine(!eslClickToDefine);
                    }}
                    className={`p-2 rounded-lg text-[10px] font-bold border transition text-center cursor-pointer ${
                      eslClickToDefine
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    🗣️ ESL Assist
                  </button>
                  <button
                    onClick={() => {
                      setHighlightAcademicVocab(!highlightAcademicVocab);
                    }}
                    className={`p-2 rounded-lg text-[10px] font-bold border transition text-center cursor-pointer ${
                      highlightAcademicVocab
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ✨ Acad Vocab
                  </button>
                </div>
              </div>

              {/* 1. Speech Voice & Auditory Customization */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1. TTS Auditory Voice</h5>
                
                {/* Voice Profiles (Accents & Genders) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500">Natural Voice Profiles (Accents & Genders)</label>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {VOICE_PROFILES.map((vp) => {
                      const isSelected = selectedVoiceProfileId === vp.id;
                      return (
                        <div
                          key={vp.id}
                          onClick={() => setSelectedVoiceProfileId(vp.id)}
                          className={`p-1.5 rounded-lg border text-left cursor-pointer flex items-center justify-between gap-2 transition-all ${
                            isSelected
                              ? 'bg-emerald-50/40 border-[#5f6f52] ring-1 ring-[#5f6f52]'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="text-sm shrink-0">{vp.flag}</span>
                            <div className="overflow-hidden min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-slate-700 truncate">{vp.name}</span>
                                <span className={`text-[7px] font-extrabold px-1 py-0.2 rounded uppercase leading-none ${
                                  vp.gender === 'Female'
                                    ? 'bg-rose-50 text-rose-500'
                                    : vp.gender === 'Male'
                                    ? 'bg-blue-50 text-blue-500'
                                    : 'bg-teal-50 text-teal-500'
                                }`}>
                                  {vp.gender === 'Female' ? 'F' : vp.gender === 'Male' ? 'M' : 'N'}
                                </span>
                              </div>
                              <div className="text-[8px] text-slate-400 truncate font-semibold">{vp.accent}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
                                window.speechSynthesis.cancel();
                                const text = `Hello, I am ${vp.name}!`;
                                const utterance = new SpeechSynthesisUtterance(text);
                                utterance.rate = playbackSpeed;
                                const voices = window.speechSynthesis.getVoices();
                                const localeVoices = voices.filter(v => 
                                  vp.langCodes.some(lc => v.lang.toLowerCase().replace('_', '-').includes(lc.toLowerCase()))
                                );
                                let voiceToPlay = null;
                                if (localeVoices.length > 0) {
                                  for (const vn of vp.voiceNames) {
                                    voiceToPlay = localeVoices.find(v => v.name.toLowerCase().includes(vn.toLowerCase()));
                                    if (voiceToPlay) break;
                                  }
                                  if (!voiceToPlay) voiceToPlay = localeVoices[0];
                                }
                                if (voiceToPlay) utterance.voice = voiceToPlay;
                                window.speechSynthesis.speak(utterance);
                              }}
                              title={`Listen sample of ${vp.name}`}
                              className="p-1 rounded text-[#5f6f52] hover:bg-[#5f6f52]/10 transition cursor-pointer"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                            {isSelected && (
                              <Check className="w-3 h-3 text-[#5f6f52] stroke-[3]" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Voice selection fallback override */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500">Fine-tune System Voice Override</label>
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => {
                      setSelectedVoiceName(e.target.value);
                      localStorage.setItem('accessibility_tts_voice', e.target.value);
                    }}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-medium focus:outline-none focus:border-[#5f6f52] cursor-pointer"
                  >
                    <option value="">System Default Voice</option>
                    {ttsVoicesList.map(v => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speed / Rate slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                    <span>Reading Speed</span>
                    <span className="font-mono">{playbackSpeed.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={playbackSpeed}
                    onChange={(e) => {
                      const speed = parseFloat(e.target.value);
                      setPlaybackSpeed(speed);
                    }}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#5f6f52] focus:outline-none"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400">
                    <span>Slower (Dyslexia/ESL)</span>
                    <span>Faster</span>
                  </div>
                </div>

                {/* Pitch slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                    <span>Voice Tone (Pitch)</span>
                    <span className="font-mono">{ttsPitch.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={ttsPitch}
                    onChange={(e) => {
                      const pitch = parseFloat(e.target.value);
                      setTtsPitch(pitch);
                      localStorage.setItem('accessibility_tts_pitch', String(pitch));
                    }}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#5f6f52] focus:outline-none"
                  />
                </div>
              </div>

              {/* 2. Visual Layout Customization */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">2. Visual Strain Reduction</h5>
                
                {/* Dyslexia High Legibility Typography toggle */}
                <div className="flex items-center justify-between gap-2 p-1">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700 block">Dyslexic Typeface</span>
                    <span className="text-[9px] text-slate-400 block">Uses asymmetrical Comic/Inter letter structures</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDyslexiaMode}
                    onChange={(e) => setIsDyslexiaMode(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#5f6f52] focus:ring-[#5f6f52] cursor-pointer"
                  />
                </div>

                {/* Background Screen Tints */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500">Glare-Reducing Background Tint</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { code: 'none', label: 'Off', color: 'bg-white border-slate-200 text-slate-700' },
                      { code: 'cream', label: 'Cream', color: 'bg-[#FAF6EB] text-[#2F210F] border-amber-200' },
                      { code: 'mint', label: 'Mint', color: 'bg-[#EBF7EE] text-[#0E2F16] border-emerald-200' },
                      { code: 'blue', label: 'Blue', color: 'bg-[#ECF5FC] text-[#0C243C] border-blue-200' },
                      { code: 'contrast', label: 'Dark', color: 'bg-slate-900 text-slate-100 border-slate-700' },
                    ].map(tint => (
                      <button
                        key={tint.code}
                        onClick={() => setTintColor(tint.code)}
                        className={`py-2 px-1 rounded-md text-[8px] font-bold border transition text-center flex flex-col items-center justify-center cursor-pointer ${tint.color} ${
                          tintColor === tint.code 
                            ? 'ring-2 ring-indigo-500 ring-offset-1 border-indigo-500 scale-105' 
                            : 'hover:scale-102'
                        }`}
                      >
                        <span className="truncate w-full">{tint.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus ruler line height controls */}
                <div className="space-y-2 p-2 bg-slate-50 rounded-xl border border-slate-150">
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-0.5 text-left">
                      <span className="text-xs font-bold text-slate-700 block">Focus Reading Ruler</span>
                      <span className="text-[9px] text-slate-400 block">Semi-transparent amber overlay bar tracking cursor</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isReadingRulerEnabled}
                      onChange={(e) => setIsReadingRulerEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#5f6f52] focus:ring-[#5f6f52] cursor-pointer"
                    />
                  </div>

                  {isReadingRulerEnabled && (
                    <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
                      <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                        <span>Ruler Window Height</span>
                        <span className="font-mono">{rulerHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={rulerHeight}
                        onChange={(e) => setRulerHeight(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#5f6f52] focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 3. ESL & Academic Vocabulary Aid */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">3. ESL & Academic Vocabulary Aid</h5>
                
                {/* Academic Vocab Highlighter toggle */}
                <div className="flex items-center justify-between gap-2 p-1.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 block">Academic Vocabulary Highlighter</span>
                      {highlightAcademicVocab && (
                        <span className="text-[8px] font-black bg-indigo-600 text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                          {getDetectedAcademicTermsCount(preprocessedDisplayContent)} terms
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 block">Identifies complex academic terms with instant definition tooltips and pronunciation</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={highlightAcademicVocab}
                    onChange={(e) => setHighlightAcademicVocab(e.target.checked)}
                    className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 p-1">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700 block">Double-Click definitions</span>
                    <span className="text-[9px] text-slate-400 block">Double-click any word inside reading card for Socratic translation definition</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={eslClickToDefine}
                    onChange={(e) => setEslClickToDefine(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#5f6f52] focus:ring-[#5f6f52] cursor-pointer"
                  />
                </div>

                <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-[10px] text-blue-700 leading-normal flex items-start gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    When active, click the <Volume2 className="w-3 h-3 inline mx-0.5" /> button next to any paragraph to read just that block aloud. Re-listen anytime to train pronunciation!
                  </span>
                </div>

                <div className="p-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-indigo-200/80 rounded-xl space-y-1.5 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                      Conversational AI Podcast
                    </span>
                    <button
                      onClick={() => {
                        setIsAccessibilityOpen(false);
                        setIsPodcastModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-[10px] font-bold shadow-xs transition cursor-pointer"
                    >
                      Launch Podcast 🎙️
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-snug">
                    Synthesizes document into an adaptive 2-speaker podcast episode that automatically adjusts speed and terminology for ESL & Low Confidence profiles!
                  </p>
                </div>

                <div className="p-3 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-indigo-500/10 border border-cyan-200/80 rounded-xl space-y-1.5 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-cyan-950 flex items-center gap-1">
                      <Box className="w-3.5 h-3.5 text-cyan-600 animate-bounce" />
                      AR Hologram 3D Physical Desk View
                    </span>
                    <button
                      onClick={() => {
                        setIsAccessibilityOpen(false);
                        setIsARHologramOpen(true);
                      }}
                      className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-[10px] font-bold shadow-xs transition cursor-pointer"
                    >
                      Launch AR View 🕶️
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-snug">
                    Point camera at your desk to project interactive 3D holographic models, exploded views, and engineering annotations for project tasks!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collaborative Side-Notes & Comments Sidebar */}
        {!isQuickStudyMode && isCommentsOpen && (
          <div className="w-full xl:w-80 shrink-0 bg-white rounded-2xl border border-[#e5e1da] shadow-sm p-4 space-y-3.5 no-print flex flex-col max-h-[850px] overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#f4f1ea] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shadow-2xs">
                  <MessageSquare className="w-4 h-4 fill-amber-600 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Collaborative Side-Notes</h4>
                  <p className="text-[9px] text-amber-700 font-semibold flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Synced to Firestore Metadata
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCommentsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Side-Note Form */}
            <form onSubmit={handleAddComment} className="space-y-2.5 bg-[#fbfaf8] p-3 rounded-xl border border-[#e8e4dc] shadow-2xs shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-[#5f6f52] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Add Side-Note
                </p>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Firestore Saved</span>
              </div>
              
              {/* Selected Text Reference */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Referenced Text</label>
                {newSelectedText ? (
                  <div className="relative bg-amber-50/70 border border-amber-200 p-2 rounded-lg text-[10px] text-slate-700 italic font-mono leading-relaxed pr-6 line-clamp-3">
                    "{newSelectedText}"
                    <button
                      type="button"
                      onClick={() => setNewSelectedText('')}
                      className="absolute top-1 right-1 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                      title="Clear selection reference"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={handleCaptureSelection}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50/80 border border-amber-200 p-1.5 rounded-lg w-full justify-center transition cursor-pointer"
                    >
                      <span>✨ Attach to Highlighted Text</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Category Pills */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Note Type</label>
                <div className="flex flex-wrap gap-1">
                  {(['Pedagogical Note', 'Question', 'Correction', 'Teaching Tip', 'Differentiated Guidance', 'General'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCommentCategory(cat)}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition cursor-pointer border ${
                        selectedCommentCategory === cat
                          ? 'bg-[#5f6f52] border-[#4d5a42] text-white shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Field */}
              <div className="space-y-1">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write collaborative feedback, teaching note, or observation..."
                  className="w-full h-14 bg-white border border-[#e5e1da] px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-[#5f6f52] transition resize-none leading-relaxed text-slate-800"
                  required
                />
              </div>

              {/* Accent Color & Submit */}
              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-1">
                  {(['yellow', 'green', 'pink', 'blue'] as const).map((color) => {
                    const colorBg = 
                      color === 'yellow' ? 'bg-amber-100 border-amber-300' :
                      color === 'green' ? 'bg-emerald-100 border-emerald-300' :
                      color === 'pink' ? 'bg-rose-100 border-rose-300' :
                      'bg-sky-100 border-sky-300';
                    
                    const isSelected = selectedCommentColor === color;

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedCommentColor(color)}
                        className={`w-3.5 h-3.5 rounded-full border cursor-pointer transition-all ${colorBg} ${isSelected ? 'ring-2 ring-amber-600 scale-110 shadow-xs' : 'hover:scale-105'}`}
                        title={`${color} accent`}
                      />
                    );
                  })}
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-1 px-3 py-1 bg-[#5f6f52] hover:bg-[#4d5a42] text-white text-[11px] font-bold rounded-lg shadow-2xs transition cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Save Side-Note</span>
                </button>
              </div>
            </form>

            {/* Filter & Search Bar */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between gap-1.5">
                <input
                  type="text"
                  value={commentSearchQuery}
                  onChange={(e) => setCommentSearchQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="w-full bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-[10px] focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowResolvedComments(!showResolvedComments)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold transition shrink-0 border ${
                    showResolvedComments
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                  title="Toggle showing resolved notes"
                >
                  {showResolvedComments ? 'Show All' : 'Active Only'}
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                {['All', 'Pedagogical Note', 'Question', 'Correction', 'Teaching Tip', 'Differentiated Guidance'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCommentCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-md text-[8px] font-bold shrink-0 transition border ${
                      commentCategoryFilter === cat
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'bg-slate-50 border-slate-150 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable List of Side-Notes */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px]">
              {(() => {
                const filteredComments = comments.filter(c => {
                  if (!showResolvedComments && c.resolved) return false;
                  if (commentCategoryFilter !== 'All' && c.category !== commentCategoryFilter) return false;
                  if (commentSearchQuery.trim()) {
                    const q = commentSearchQuery.toLowerCase();
                    const matchText = c.comment.toLowerCase().includes(q);
                    const matchRef = (c.selectedText || '').toLowerCase().includes(q);
                    const matchAuthor = c.authorName.toLowerCase().includes(q);
                    return matchText || matchRef || matchAuthor;
                  }
                  return true;
                });

                if (filteredComments.length === 0) {
                  return (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5">
                      <MessageSquare className="w-6 h-6 text-slate-300 mx-auto" />
                      <p className="text-[10px] text-slate-400 font-medium">No side-notes matching criteria.</p>
                      <p className="text-[8px] text-slate-400">Select text in document view to attach a collaborative side-note!</p>
                    </div>
                  );
                }

                return filteredComments.map((comment) => {
                  const isAuthor = profile && profile.uid === comment.authorUid;
                  const isAdminRole = profile && profile.role === 'Administrator';
                  const isActive = activeHighlightedText && comment.selectedText && activeHighlightedText.toLowerCase() === comment.selectedText.toLowerCase();

                  const borderColor = 
                    comment.color === 'green' ? 'border-l-emerald-500' :
                    comment.color === 'pink' ? 'border-l-rose-500' :
                    comment.color === 'blue' ? 'border-l-sky-500' :
                    'border-l-amber-500';

                  const tagBg = 
                    comment.category === 'Pedagogical Note' ? 'bg-amber-100 text-amber-900 border-amber-200' :
                    comment.category === 'Question' ? 'bg-indigo-100 text-indigo-900 border-indigo-200' :
                    comment.category === 'Correction' ? 'bg-rose-100 text-rose-900 border-rose-200' :
                    comment.category === 'Teaching Tip' ? 'bg-emerald-100 text-emerald-900 border-emerald-200' :
                    comment.category === 'Differentiated Guidance' ? 'bg-purple-100 text-purple-900 border-purple-200' :
                    'bg-slate-100 text-slate-800 border-slate-200';

                  return (
                    <div
                      key={comment.id}
                      className={`border border-l-4 ${borderColor} rounded-xl p-3 space-y-2 transition-all relative ${
                        comment.resolved ? 'opacity-60 bg-slate-50 border-slate-200' :
                        isActive
                          ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-100 shadow-xs'
                          : 'bg-white border-[#e5e1da] hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      {/* Top Category Badge & Actions */}
                      <div className="flex items-center justify-between gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase border ${tagBg}`}>
                          {comment.category || 'General Note'}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleResolveComment(comment)}
                            className={`p-1 rounded hover:bg-slate-100 transition ${comment.resolved ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'}`}
                            title={comment.resolved ? "Mark active" : "Mark resolved"}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          {(isAuthor || isAdminRole) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Delete this side-note?')) {
                                  handleDeleteComment(comment.id);
                                }
                              }}
                              className="text-slate-400 hover:text-red-500 p-1 rounded transition"
                              title="Delete side-note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Selected Text Reference */}
                      {comment.selectedText && (
                        <div
                          onClick={() => {
                            if (comment.selectedText) {
                              setActiveHighlightedText(comment.selectedText);
                            }
                          }}
                          className="border-l-2 border-amber-400 bg-amber-50/60 px-2 py-1.5 rounded-r text-[10px] text-slate-600 italic font-mono leading-relaxed cursor-pointer hover:bg-amber-100/50 transition-colors"
                          title="Click to locate highlight in document"
                        >
                          "{comment.selectedText}"
                        </div>
                      )}

                      {/* Comment Body */}
                      <p className={`text-xs text-slate-800 leading-relaxed break-words ${comment.resolved ? 'line-through text-slate-500' : ''}`}>
                        {comment.comment}
                      </p>

                      {/* Author Info */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[9px] text-slate-500">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[8px] shrink-0">
                            {comment.authorName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-700 truncate">{comment.authorName}</span>
                        </div>
                        <span className="font-mono text-[8px] text-slate-400 shrink-0">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Replies List */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="space-y-1.5 pt-1.5 border-t border-slate-100 pl-2">
                          <p className="text-[8px] font-bold uppercase text-slate-400 tracking-wider">Replies ({comment.replies.length})</p>
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="bg-slate-50 p-2 rounded-lg border border-slate-150 space-y-1 text-[10px]">
                              <div className="flex items-center justify-between font-bold text-slate-700 text-[9px]">
                                <span>{reply.authorName}</span>
                                <span className="font-mono text-[8px] font-normal text-slate-400">
                                  {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-600 leading-relaxed">{reply.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input Trigger */}
                      <div className="pt-1">
                        {activeReplyCommentId === comment.id ? (
                          <div className="space-y-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <textarea
                              value={replyTextMap[comment.id] || ''}
                              onChange={(e) => setReplyTextMap(prev => ({ ...prev, [comment.id]: e.target.value }))}
                              placeholder="Write a collaborative reply..."
                              className="w-full h-12 bg-white border border-slate-200 p-1.5 rounded-md text-[10px] focus:outline-none focus:border-amber-500"
                              autoFocus
                            />
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setActiveReplyCommentId(null)}
                                className="px-2 py-0.5 text-[9px] text-slate-500 hover:text-slate-700"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddReplyToComment(comment.id)}
                                className="px-2.5 py-0.5 bg-[#5f6f52] text-white text-[9px] font-bold rounded shadow-2xs"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveReplyCommentId(comment.id)}
                            className="text-[9px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                          >
                            <span>💬 Reply to thread</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Reactions Review Sidebar */}
        {!isQuickStudyMode && isReactionsSidebarOpen && (
          <div className="w-full xl:w-80 shrink-0 bg-white rounded-2xl border border-[#e5e1da] shadow-sm p-4 space-y-4 no-print flex flex-col max-h-[850px] overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#f4f1ea] pb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700">
                  <Smile className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Lesson Reactions</h4>
                  <p className="text-[9px] text-slate-400">Review Paragraph Checkpoints</p>
                </div>
              </div>
              <button
                onClick={() => setIsReactionsSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable list of reacted paragraphs */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[600px]">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Reacted Paragraphs ({
                  reactions.reduce<string[]>((acc, curr) => {
                    if (!acc.includes(curr.paragraphText)) acc.push(curr.paragraphText);
                    return acc;
                  }, []).length
                })
              </p>
              
              {reactions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                  <Smile className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 italic">No paragraph reactions yet.</p>
                  <p className="text-[10px] text-slate-400 mt-1 px-4 leading-normal">
                    Hover over any paragraph in the lesson text and click the 
                    <Smile className="w-3 h-3 inline mx-1 text-slate-400" /> 
                    icon to leave a reaction.
                  </p>
                </div>
              ) : (
                Object.entries(groupedReactions).map(([paraText, emojiGroups], idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      // Scroll to paragraph safely using window.document
                      const elements = Array.from(window.document.querySelectorAll('.group\\/para')) as HTMLElement[];
                      const found = elements.find(el => el.textContent?.trim().includes(paraText.trim().slice(0, 40)));
                      if (found) {
                        found.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        found.classList.add('ring-2', 'ring-rose-200', 'bg-rose-50/20');
                        setTimeout(() => {
                          found.classList.remove('ring-2', 'ring-rose-200', 'bg-rose-50/20');
                        }, 2000);
                      }
                    }}
                    className="group/item border border-[#e5e1da] hover:border-rose-200 bg-white hover:bg-rose-50/5 rounded-xl p-3 space-y-2 transition-all cursor-pointer shadow-2xs"
                    title="Click to locate this paragraph in the lesson"
                  >
                    {/* Paragraph snippet */}
                    <div className="relative border-l-2 border-rose-300 bg-rose-50/10 p-2 rounded-r text-[11px] text-slate-600 italic leading-relaxed line-clamp-3">
                      "{paraText}"
                    </div>

                    {/* Reactions pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {emojiGroups.map((grp, grpIdx) => (
                        <span
                          key={grpIdx}
                          className="inline-flex items-center gap-1 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-full text-xs font-semibold text-slate-600"
                          title={`Reacted: ${grp.users.join(', ')}`}
                        >
                          <span>{grp.emoji}</span>
                          <span className="text-[10px] font-bold text-slate-500">{grp.count}</span>
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-end pt-1">
                      <span className="text-[8px] text-rose-500 font-bold uppercase tracking-wider opacity-0 group-hover/item:opacity-100 transition-opacity">
                        🔍 Scroll to Paragraph
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Private Notes & Annotations Sidebar */}
        {!isQuickStudyMode && isAnnotationsOpen && (
          <div className="w-full xl:w-80 shrink-0 bg-white rounded-2xl border border-[#e5e1da] shadow-sm p-4 space-y-4 no-print flex flex-col max-h-[850px] overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#f4f1ea] pb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <Bookmark className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Private Notes</h4>
                  <p className="text-[9px] text-slate-400">Teacher-Only Reminders</p>
                </div>
              </div>
              <button
                onClick={() => setIsAnnotationsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning that these are fully private and internal-only */}
            <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl text-[10px] text-emerald-850 flex items-start gap-1.5 leading-relaxed">
              <span className="text-xs">🔒</span>
              <p>These annotations are <strong>strictly private</strong>. They are only visible to your account and will not be shared with students or other colleagues.</p>
            </div>

            {/* New Annotation Form */}
            {!isStudent && (
              <form onSubmit={handleAddAnnotation} className="space-y-3 bg-[#faf9f6] p-3 rounded-xl border border-[#e5e1da] shadow-2xs shrink-0">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Highlight & Annotate</p>
                
                {/* Selected Text Reference */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Highlighted Segment</label>
                  {newAnnotationSelectedText ? (
                    <div className="relative bg-emerald-50/50 border border-emerald-150 p-2 rounded-lg text-[10px] text-slate-600 italic font-mono leading-relaxed pr-6">
                      "{newAnnotationSelectedText}"
                      <button
                        type="button"
                        onClick={() => setNewAnnotationSelectedText('')}
                        className="absolute top-1 right-1 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                        title="Clear selection reference"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={handleCaptureAnnotationSelection}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-750 hover:text-emerald-800 bg-emerald-50/50 border border-emerald-250 p-2 rounded-lg w-full justify-center transition cursor-pointer"
                      >
                        <Highlighter className="w-3 h-3 text-emerald-600" />
                        <span>✨ Grab Selected Text</span>
                      </button>
                      <p className="text-[9px] text-slate-400 leading-tight">
                        Select any text block on the left and click above to attach a private note to it.
                      </p>
                    </div>
                  )}
                </div>

                {/* Note Field */}
                <div className="space-y-1">
                  <textarea
                    value={newAnnotationNote}
                    onChange={(e) => setNewAnnotationNote(e.target.value)}
                    placeholder="Type private teacher reminders, pedagogical cues, or internal-only notes..."
                    className="w-full h-16 bg-white border border-[#e5e1da] px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-emerald-600 transition resize-none leading-relaxed"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Save Note</span>
                  </button>
                </div>
              </form>
            )}

            {/* Scrollable list of annotations */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[400px]">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your Annotations ({annotations.length})</p>
              
              {annotations.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                  <Bookmark className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400 italic">No private annotations saved yet.</p>
                </div>
              ) : (
                annotations.map((ann) => {
                  const isActive = activeAnnotationHighlightedText && ann.selectedText && activeAnnotationHighlightedText.toLowerCase() === ann.selectedText.toLowerCase();
                  const color = ann.color || 'yellow';
                  
                  let borderClass = 'border-amber-300 bg-amber-50/30 hover:bg-amber-100/30';
                  let cardClass = isActive 
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100 shadow-xs' 
                    : 'bg-white border-[#e5e1da] hover:border-amber-300';
                  
                  if (color === 'green') {
                    borderClass = 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-100/30';
                    cardClass = isActive
                      ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-100 shadow-xs'
                      : 'bg-white border-[#e5e1da] hover:border-emerald-300';
                  } else if (color === 'pink') {
                    borderClass = 'border-rose-300 bg-rose-50/30 hover:bg-rose-100/30';
                    cardClass = isActive
                      ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-100 shadow-xs'
                      : 'bg-white border-[#e5e1da] hover:border-rose-300';
                  } else if (color === 'blue') {
                    borderClass = 'border-sky-300 bg-sky-50/30 hover:bg-sky-100/30';
                    cardClass = isActive
                      ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-100 shadow-xs'
                      : 'bg-white border-[#e5e1da] hover:border-sky-300';
                  }

                  return (
                    <div
                      key={ann.id}
                      className={`border rounded-xl p-3 space-y-2 transition-all relative ${cardClass}`}
                    >
                      {/* Highlighted text segment */}
                      {ann.selectedText && (
                        <div
                          onClick={() => {
                            if (ann.selectedText) {
                              setActiveAnnotationHighlightedText(ann.selectedText);
                            }
                          }}
                          className={`border-l-2 ${borderClass} px-2 py-1.5 rounded-r text-[10px] text-slate-550 italic font-mono leading-relaxed cursor-pointer transition-colors`}
                          title="Click to locate highlight"
                        >
                          "{ann.selectedText}"
                        </div>
                      )}

                      {/* Note content */}
                      <p className="text-xs text-slate-700 leading-relaxed break-words whitespace-pre-line">{ann.note}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-50">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-600 truncate">Private Reminders</p>
                          <p className="text-[8px] text-slate-400 font-mono">
                            {new Date(ann.createdAt).toLocaleDateString()} at {new Date(ann.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this private annotation?')) {
                              handleDeleteAnnotation(ann.id);
                            }
                          }}
                          className="text-slate-400 hover:text-red-500 p-1 rounded transition"
                          title="Delete annotation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Parent-Teacher Direct Chat Panel */}
        {!isQuickStudyMode && isParentChatOpen && (
          <DocumentParentChatPanel 
            document={document}
            profile={profile}
            allUsers={allUsers}
            onClose={() => setIsParentChatOpen(false)}
          />
        )}

        {/* Version History Sidebar */}
        {!isQuickStudyMode && isVersionsSidebarOpen && (
          <div className="w-full xl:w-80 shrink-0 bg-white rounded-2xl border border-[#e5e1da] shadow-sm p-4 space-y-4 no-print flex flex-col max-h-[850px] overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#f4f1ea] pb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                  <History className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Version History</h4>
                  <p className="text-[9px] text-slate-400">Saved Revisions</p>
                </div>
              </div>
              <button
                onClick={() => setIsVersionsSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
                title="Close Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick explanation instruction */}
            <div className="bg-indigo-50/45 border border-indigo-100/50 p-2.5 rounded-xl text-[10.5px] text-indigo-900 leading-relaxed">
              <p>
                Select any saved revision below to compare changes and restore previous versions.
              </p>
            </div>

            {/* If Comparison Mode is active: active compare overview */}
            {compareRightVersion && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold uppercase text-[9px] text-slate-400 tracking-wider">Comparison Setup</span>
                  <button
                    onClick={() => {
                      setCompareRightVersion(null);
                      setCompareLeftVersion(null);
                    }}
                    className="text-[9px] font-extrabold text-rose-600 hover:underline uppercase"
                  >
                    Clear Comparison
                  </button>
                </div>
                
                <div className="space-y-1.5 font-medium text-slate-700">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="text-slate-500">Compare (Target):</span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Version {compareRightVersion.versionNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-500">Against (Base):</span>
                    <select
                      value={compareLeftVersion ? compareLeftVersion.id : 'current'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'current') {
                          setCompareLeftVersion(null);
                        } else {
                          const found = docVersions.find(v => v.id === val);
                          if (found) setCompareLeftVersion(found);
                        }
                      }}
                      className="bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] font-bold text-indigo-900 focus:outline-none max-w-[150px] truncate"
                    >
                      <option value="current">Current Document</option>
                      {docVersions
                        .filter(v => v.id !== compareRightVersion.id)
                        .map(v => (
                          <option key={`base-opt-${v.id}`} value={v.id}>
                            Version {v.versionNumber} ({new Date(v.lastModified).toLocaleDateString()})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* List of Versions */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {isVersionsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span className="text-xs font-mono">Loading revisions...</span>
                </div>
              ) : docVersions.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-xs italic">No saved versions found.</p>
                  <p className="text-[10px] mt-1 leading-normal max-w-[200px] mx-auto">
                    Versions are automatically created when you save changes or perform manual edits.
                  </p>
                </div>
              ) : (
                docVersions.map((v) => {
                  const isCurrentActive = v.content === document.content && v.title === document.title;
                  const isCompareTarget = compareRightVersion?.id === v.id;
                  const isCompareBase = compareLeftVersion?.id === v.id;

                  return (
                    <div
                      key={`sidebar-ver-${v.id}`}
                      className={`group w-full p-3 rounded-xl border transition-all duration-150 flex flex-col gap-1.5 ${
                        isCompareTarget
                          ? 'bg-emerald-50/40 border-emerald-400 shadow-xs ring-1 ring-emerald-300/40'
                          : isCompareBase
                          ? 'bg-indigo-50/40 border-indigo-400 shadow-xs ring-1 ring-indigo-300/40'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          Version {v.versionNumber}
                          {isCurrentActive && (
                            <span className="text-[8px] bg-slate-100 text-slate-600 font-extrabold px-1 py-0.5 rounded uppercase font-mono tracking-wider">
                              Current Draft
                            </span>
                          )}
                        </span>
                        
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(v.lastModified).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-500 space-y-0.5 leading-normal">
                        <p className="truncate">
                          Author: <span className="font-bold text-slate-600">{v.modifiedByName}</span>
                        </p>
                        <p className="font-mono text-[9px] text-slate-400">
                          {new Date(v.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Hover / Direct Actions for each version */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-dashed border-slate-100">
                        <button
                          onClick={() => {
                            if (isCompareTarget) {
                              setCompareRightVersion(null);
                            } else {
                              setCompareRightVersion(v);
                              // If they set base as this, clear base
                              if (compareLeftVersion?.id === v.id) {
                                setCompareLeftVersion(null);
                              }
                            }
                          }}
                          className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-extrabold uppercase transition-colors text-center cursor-pointer ${
                            isCompareTarget
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                          }`}
                          title={isCompareTarget ? "Cancel comparison" : "Compare this version against the base"}
                        >
                          {isCompareTarget ? 'Comparing' : 'Compare'}
                        </button>

                        <button
                          onClick={() => {
                            if (isCompareBase) {
                              setCompareLeftVersion(null);
                            } else {
                              setCompareLeftVersion(v);
                              // If this was target, clear target
                              if (compareRightVersion?.id === v.id) {
                                setCompareRightVersion(null);
                              }
                            }
                          }}
                          disabled={isCurrentActive}
                          className={`py-1 px-2 rounded-lg text-[10px] font-extrabold uppercase transition-colors text-center cursor-pointer ${
                            isCompareBase
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-slate-50 disabled:cursor-not-allowed'
                          }`}
                          title="Set as baseline for comparison"
                        >
                          {isCompareBase ? 'Baseline' : 'Set Base'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

        {/* AI Cognitive Activity Auto-Grader & Class Analytics Section */}
        {!isStudent && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mb-6"
          >
            <AIActivityAutoGrader
              document={document}
              difficultyLevel={document.difficultyLevel || 'intermediate'}
              onApplyPlannerUpdates={(updates) => {
                setReflectionWorked(updates.reflectionWorked);
                setReflectionDidntWork(updates.reflectionDidntWork);
                setReflectionAdjustments(updates.reflectionAdjustments);
                setIsReflectionExpanded(true);
              }}
            />
          </motion.div>
        )}

        {/* AI Reading Level Analyzer & Vocabulary Adapter */}
        {!isStudent && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mb-6"
          >
            <ReadingLevelAnalyzer
              document={document}
              editedContent={editedContent}
              setEditedContent={setEditedContent}
            />
          </motion.div>
        )}

        {/* Post-Lesson Reflection Section */}
        {!isStudent && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="bg-white rounded-2xl border border-[#eadecd] shadow-sm overflow-hidden flex flex-col no-print animate-fadeIn"
            >
              <div 
                onClick={() => setIsReflectionExpanded(!isReflectionExpanded)}
                className="p-4 bg-amber-50/50 border-b border-[#eadecd] flex items-center justify-between cursor-pointer hover:bg-amber-50/80 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🧠</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Post-Lesson CPD Professional Reflection</h3>
                    <p className="text-[10px] text-slate-500">Record pedagogical observations, student barriers, and immediate remedial adaptations</p>
                  </div>
                </div>
                <button className="text-slate-500 hover:text-slate-700 font-bold text-[10px] uppercase tracking-wider py-1.5 px-3 bg-white border border-slate-200 rounded-lg transition shadow-inner-sm">
                  {isReflectionExpanded ? 'Hide Form' : 'Open Form'}
                </button>
              </div>

              {isReflectionExpanded && (
                <div className="p-6 space-y-5 bg-gradient-to-b from-white to-[#faf6ee]/20">
                  <div className="bg-[#fefae0]/80 p-4 rounded-xl border border-[#e9edc9] text-xs text-[#5f6f52] leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1 text-slate-800">
                      💡 Professional Continuous CPD Reflective Template
                    </p>
                    <p className="text-slate-600">
                      Take 3 minutes after teaching this lesson to document outcomes. Over multiple terms, this prompt-driven tracking highlights recurrent student conceptual bottlenecks and informs structural improvements.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <span className="text-emerald-600 text-sm font-bold">✓</span>
                        What Worked Well?
                        <span className="text-[10px] text-slate-400 font-normal">(strategies, activities, or resources that successfully engaged pupils)</span>
                      </label>
                      <textarea
                        value={reflectionWorked}
                        onChange={(e) => setReflectionWorked(e.target.value)}
                        placeholder="e.g., The hands-on sorting exercise using local beans/counters was highly engaging. The small peer learning groups allowed fast learners to scaffold struggling pupils effectively..."
                        className="w-full min-h-[90px] text-xs leading-relaxed text-slate-700 bg-white p-3 rounded-xl border border-slate-250 focus:outline-none focus:border-[#5f6f52]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <span className="text-red-500 text-sm font-bold">✗</span>
                        What Didn't Work as Expected?
                        <span className="text-[10px] text-slate-400 font-normal">(pacing bottlenecks, pupil misconceptions, or behavior challenges)</span>
                      </label>
                      <textarea
                        value={reflectionDidntWork}
                        onChange={(e) => setReflectionDidntWork(e.target.value)}
                        placeholder="e.g., Grouping took over 8 minutes, leaving less time for the formative review. Many pupils struggled with transitioning from pictorial grouping to symbolic division notation..."
                        className="w-full min-h-[90px] text-xs leading-relaxed text-slate-700 bg-white p-3 rounded-xl border border-slate-250 focus:outline-none focus:border-[#5f6f52]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <span className="text-indigo-600 text-sm font-bold">⚙</span>
                        Adjustments & Remedial Action for Future Classes
                        <span className="text-[10px] text-slate-400 font-normal">(tactical interventions, different timing, or pre-requisite reviews)</span>
                      </label>
                      <textarea
                        value={reflectionAdjustments}
                        onChange={(e) => setReflectionAdjustments(e.target.value)}
                        placeholder="e.g., Pre-assign grouping arrangements before class starts. Schedule a 5-minute pre-requisite warm-up to consolidate base-10 block grouping prior to formal notation..."
                        className="w-full min-h-[90px] text-xs leading-relaxed text-slate-700 bg-white p-3 rounded-xl border border-slate-250 focus:outline-none focus:border-[#5f6f52]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-150">
                    <span className="text-[10px] text-slate-400">
                      {document.lastModified ? `Last updated: ${new Date(document.lastModified).toLocaleString()}` : ''}
                    </span>
                    <button
                      onClick={handleSaveReflection}
                      className="flex items-center gap-1.5 bg-[#5f6f52] text-white hover:bg-[#4d5a42] px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow transition"
                    >
                      {reflectionSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Reflection Saved!
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" /> Save Reflection Record
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right Info sidebar */}
        {!isQuickStudyMode && !isRightSidebarCollapsed && (
          <div className="hidden lg:block space-y-6 no-print right-info-sidebar lg:col-span-3 xl:col-span-2">
            {renderSidebarContent()}
          </div>
        )}
      </div>

      {isDiagramGeneratorOpen && (
        <DiagramGenerator
          content={editedContent}
          onClose={() => setIsDiagramGeneratorOpen(false)}
          onApplyDiagram={async (placeholderText, imageUrl) => {
            await handleApplyDiagram(placeholderText, imageUrl);
            setIsDiagramGeneratorOpen(false);
          }}
        />
      )}

      {isToolbarImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-fadeIn">
          <div className={`bg-white rounded-2xl border border-slate-200 w-full shadow-2xl overflow-hidden animate-scaleIn transition-all duration-300 ${toolbarImageTab === 'gallery' ? 'max-w-2xl' : 'max-w-md'}`}>
            {/* Modal Header */}
            <div className="bg-[#5f6f52] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-300 animate-pulse" />
                <h3 className="font-bold text-sm">AI Visual Media Portal</h3>
              </div>
              <button
                onClick={() => {
                  setIsToolbarImageModalOpen(false);
                  setToolbarImagePrompt('');
                  setToolbarImageError(null);
                  setGallerySearch('');
                }}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setToolbarImageTab('create')}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
                  toolbarImageTab === 'create'
                    ? 'border-[#5f6f52] text-[#5f6f52] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Create with AI
                </span>
              </button>
              <button
                type="button"
                onClick={() => setToolbarImageTab('gallery')}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
                  toolbarImageTab === 'gallery'
                    ? 'border-[#5f6f52] text-[#5f6f52] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />
                  Select from Image Studio ({imageStudioResources.length})
                </span>
              </button>
            </div>

            {/* Modal Body: CREATE TAB */}
            {toolbarImageTab === 'create' && (
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Image Prompt / Visual Description
                  </label>
                  <textarea
                    value={toolbarImagePrompt}
                    onChange={(e) => setToolbarImagePrompt(e.target.value)}
                    placeholder="e.g., A labeled vector diagram of water cycle showing evaporation, condensation and precipitation"
                    className="w-full min-h-[100px] p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#5f6f52] focus:bg-white transition"
                    disabled={isGeneratingToolbarImage}
                  />
                  <p className="text-[10px] text-slate-400">
                    Be descriptive: specify textbook-style details, labels, colors, or visual layout.
                  </p>
                </div>

                {profile?.role === 'Administrator' ? (
                  <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-900 block">
                        AI Generation Engine Strategy (Admin Only)
                      </label>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                        Admin
                      </span>
                    </div>
                    <select
                      value={toolbarImageModel}
                      onChange={(e) => setToolbarImageModel(e.target.value)}
                      disabled={isGeneratingToolbarImage}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#5f6f52] transition cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 font-bold"
                    >
                      <option value="emgen_fallback_nanobanana">🍌 Nano Banana as Fallback for Emgen (Recommended / Dual-Engine)</option>
                      <option value="emgen">🎨 Use Emgen Only (High Quality)</option>
                      <option value="nano banana">🍌 Use Nano Banana Only (Rapid)</option>
                    </select>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between">
                    <span className="font-bold">⚡ Engine: Emgen (High Quality)</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                      Nano Banana Fallback Active
                    </span>
                  </div>
                )}

                {toolbarImageError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs flex items-start gap-2">
                    <span className="font-bold mt-0.5 shrink-0">⚠️</span>
                    <span>{toolbarImageError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Modal Body: GALLERY TAB */}
            {toolbarImageTab === 'gallery' && (
              <div className="p-5 space-y-4 max-h-[300px] overflow-y-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={gallerySearch}
                    onChange={(e) => setGallerySearch(e.target.value)}
                    placeholder="Search your saved Image Studio illustrations..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-[#5f6f52] focus:bg-white transition"
                  />
                  <span className="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
                </div>

                {isLoadingStudioResources ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-[#5f6f52]" />
                    <span className="text-xs font-semibold">Retrieving your Image Studio files...</span>
                  </div>
                ) : imageStudioResources.length === 0 ? (
                  <div className="py-12 border-2 border-dashed border-slate-150 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-50/50">
                    <FolderOpen className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-xs font-bold text-slate-700">No Image Studio Creations Found</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[280px]">
                      You haven't saved any creations to your library yet.
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 bg-[#5f6f52]/5 text-[#5f6f52] px-3 py-1.5 rounded-lg font-medium">
                      💡 Go to the "Image Studio" tab in the main sidebar, design your illustration, and click "Save to Library" to insert here.
                    </p>
                  </div>
                ) : filteredGalleryResources.length === 0 ? (
                  <div className="py-12 border border-slate-150 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-50/50">
                    <FolderOpen className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">No matching images found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      No saved creations matched "{gallerySearch}"
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3.5">
                    {filteredGalleryResources.map((item: any) => {
                      // Extract prompt from extractedText or use filename
                      const itemPrompt = item.extractedText
                        ?.split('Prompt: "')[1]
                        ?.split('"')[0] || item.fileName || 'Illustration';
                      
                      return (
                        <div
                          key={item.id}
                          className="group relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:border-[#5f6f52] hover:shadow-md transition duration-200 flex flex-col"
                        >
                          {/* Image Thumbnail */}
                          <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
                            <img
                              src={item.downloadUrl}
                              alt={itemPrompt}
                              className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                              referrerPolicy="no-referrer"
                            />
                            {/* Hover overlay button */}
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const selectedWidth = selectedWidthType === 'full' ? '100%' :
                                                        selectedWidthType === 'large' ? '75%' :
                                                        selectedWidthType === 'medium' ? '50%' :
                                                        selectedWidthType === 'small' ? '25%' :
                                                        (customWidthValue || '100%');
                                  const formattedAlt = `${itemPrompt} | ${selectedAlignment} | ${selectedWidth}`;
                                  const queryParams = `?align=${selectedAlignment}&width=${encodeURIComponent(selectedWidth)}`;
                                  insertMarkdown(`\n\n![${formattedAlt}](${item.downloadUrl}${queryParams})\n\n`);
                                  setIsToolbarImageModalOpen(false);
                                  setGallerySearch('');
                                }}
                                className="bg-[#5f6f52] hover:bg-[#4d5a42] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition transform translate-y-1 group-hover:translate-y-0"
                              >
                                Insert Image
                              </button>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="p-2.5 space-y-1 flex-1 flex flex-col justify-between">
                            <p className="text-[10px] font-semibold text-slate-700 line-clamp-2 leading-relaxed" title={itemPrompt}>
                              {itemPrompt}
                            </p>
                            <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold uppercase pt-1 border-t border-slate-100/60 mt-1">
                              <span className="truncate max-w-[70px]">{item.subject || 'General'}</span>
                              <span className="shrink-0">{new Date(item.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Image Format & Layout Controls */}
            <div className="px-5 pb-5 pt-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Palette className="w-3.5 h-3.5 text-[#5f6f52]" />
                <span>Image Format & Alignment</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Alignment Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Alignment
                  </label>
                  <div className="flex bg-white rounded-lg p-0.5 border border-slate-200">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => setSelectedAlignment(align)}
                        className={`flex-1 py-1 text-[10px] font-bold capitalize rounded-md transition ${
                          selectedAlignment === align
                            ? 'bg-[#5f6f52] text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                        }`}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sizing Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Image Size / Width
                  </label>
                  <select
                    value={selectedWidthType}
                    onChange={(e: any) => setSelectedWidthType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 font-medium outline-none focus:border-[#5f6f52] transition cursor-pointer"
                  >
                    <option value="full">Full Width (100%)</option>
                    <option value="large">Large (75%)</option>
                    <option value="medium">Medium (50%)</option>
                    <option value="small">Small (25%)</option>
                    <option value="custom">Custom Size</option>
                  </select>
                </div>
              </div>

              {/* Custom Width Input */}
              {selectedWidthType === 'custom' && (
                <div className="space-y-1 animate-fadeIn bg-white p-2.5 border border-slate-200 rounded-lg">
                  <label className="text-[10px] font-bold text-slate-500 block">
                    Specify Custom Width (e.g., 300px, 45%, 600px)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customWidthValue}
                      onChange={(e) => setCustomWidthValue(e.target.value)}
                      placeholder="e.g., 350px"
                      className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 focus:outline-none focus:border-[#5f6f52] focus:bg-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsToolbarImageModalOpen(false);
                  setToolbarImagePrompt('');
                  setToolbarImageError(null);
                  setGallerySearch('');
                }}
                disabled={isGeneratingToolbarImage}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              {toolbarImageTab === 'create' && (
                <button
                  type="button"
                  onClick={handleGenerateToolbarImage}
                  disabled={isGeneratingToolbarImage || !toolbarImagePrompt.trim()}
                  className="flex items-center gap-1.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
                >
                  {isGeneratingToolbarImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate & Append</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isPrintPreviewOpen && (
        <PrintPreview
          document={document}
          onUpdate={onUpdate}
          onClose={() => setIsPrintPreviewOpen(false)}
        />
      )}

      {/* Mobile Metadata Overlay Dialog / Drawer */}
      {isMobileMetadataOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] animate-slideUp">
            {/* Modal Header */}
            <div className="bg-[#5f6f52] p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <h3 className="font-bold text-sm">Document Info & Actions</h3>
              </div>
              <button 
                onClick={() => setIsMobileMetadataOpen(false)}
                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                title="Close metadata panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 bg-[#fcfbf9] flex-1">
              {renderSidebarContent()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end shrink-0">
              <button
                onClick={() => setIsMobileMetadataOpen(false)}
                className="bg-[#5f6f52] text-white hover:bg-[#4d5a42] px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
              >
                Done Viewing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lesson Pacing Board */}
      {timerIsFullScreen && (
        <div className="fixed inset-0 z-[999] bg-[#1a1c18] text-white flex flex-col p-6 md:p-10 select-none overflow-y-auto h-screen w-screen animate-fadeIn font-sans">
          {/* Header row in fullscreen */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#5f6f52]/25 border border-[#5f6f52]/40 flex items-center justify-center">
                <Timer className="w-5.5 h-5.5 text-[#a9b388]" />
              </div>
              <div>
                <h1 className="text-lg font-serif font-bold text-white tracking-wide">Lesson Pacing Board</h1>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Classroom Presentation Display</p>
              </div>
            </div>

            <button
              onClick={() => setTimerIsFullScreen(false)}
              className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 transition cursor-pointer flex items-center gap-2 text-sm font-bold shadow-md"
              title="Exit Fullscreen"
            >
              <Minimize2 className="w-5 h-5" />
              <span>Exit Display</span>
            </button>
          </div>

          {/* Large display body */}
          <div className="flex-1 flex flex-col items-center justify-center my-6 max-w-4xl w-full mx-auto">
            <div className="flex flex-col items-center justify-center space-y-12 w-full">
              {/* Big Circular Ring Display */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
                <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="200"
                    cy="200"
                    r="160"
                    className="stroke-white/5 fill-none"
                    strokeWidth="10"
                  />
                  <circle
                    cx="200"
                    cy="200"
                    r="160"
                    className={`fill-none transition-all duration-1000 ease-linear ${
                      timerIsActive && timerSecondsLeft <= 30
                        ? 'stroke-rose-500 animate-pulse'
                        : 'stroke-[#a9b388]'
                    }`}
                    strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 160}
                    strokeDashoffset={2 * Math.PI * 160 * (1 - (timerDuration > 0 ? timerSecondsLeft / timerDuration : 0))}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Centered Digital Time Text with pulsing glows */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  {timerIsActive && timerSecondsLeft <= 30 && (
                    <span className="text-xs font-black bg-rose-600 text-white px-3 py-1 rounded-full tracking-widest uppercase mb-3 animate-pulse shadow-lg">
                      Final Phase
                    </span>
                  )}
                  {!timerIsActive && timerSecondsLeft < timerDuration && timerSecondsLeft > 0 && (
                    <span className="text-xs font-extrabold bg-amber-500 text-white px-3 py-1 rounded-full tracking-widest uppercase mb-3 leading-none shadow-md animate-pulse">
                      Paused
                    </span>
                  )}
                  <div className={`text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-widest flex items-center justify-center gap-1 transition-colors duration-500 ${
                    timerIsActive && timerSecondsLeft <= 30 ? 'text-rose-500 [text-shadow:0_0_30px_rgba(239,68,68,0.4)]' : 'text-white'
                  }`}>
                    <span>{Math.floor(timerSecondsLeft / 60).toString().padStart(2, '0')}</span>
                    <span className={`${timerIsActive ? 'animate-pulse' : ''}`}>:</span>
                    <span>{(timerSecondsLeft % 60).toString().padStart(2, '0')}</span>
                  </div>
                  
                  <p className={`text-sm sm:text-base font-extrabold mt-3 tracking-widest uppercase max-w-[240px] truncate px-4 py-1.5 rounded-xl border transition-all duration-500 ${
                    timerIsActive && timerSecondsLeft <= 30 
                      ? 'text-rose-400 border-rose-500/30 bg-rose-950/20' 
                      : 'text-[#e9edc9] border-[#a9b388]/20 bg-[#5f6f52]/10'
                  }`}>
                    {timerPhase === 'Custom' ? (customPhaseName || 'CUSTOM PHASE') : timerPhase.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Big Interactive Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 max-w-lg w-full">
                <button
                  onClick={() => timerIsActive ? setTimerIsActive(false) : startPacingWithNotificationRequest()}
                  className={`px-8 py-4 rounded-2xl border text-base font-black transition flex items-center justify-center gap-3 shadow-lg cursor-pointer ${
                    timerIsActive
                      ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white'
                      : 'bg-[#5f6f52] hover:bg-[#4d5a42] border-[#5f6f52] text-white'
                  }`}
                >
                  {timerIsActive ? (
                    <>
                      <Pause className="w-5 h-5 text-white animate-pulse" />
                      <span>Pause Pacing</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 text-white" />
                      <span>Resume Pacing</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setTimerIsActive(false);
                    setTimerSecondsLeft(timerDuration);
                  }}
                  className="px-6 py-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl text-white font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4.5 h-4.5" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={() => setTimerIsSoundEnabled(!timerIsSoundEnabled)}
                  className={`p-4 border rounded-2xl transition cursor-pointer shadow-md ${
                    timerIsSoundEnabled
                      ? 'bg-[#5f6f52] border-[#5f6f52] text-white hover:bg-[#4d5a42]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                  title={timerIsSoundEnabled ? "Chime Enabled" : "Chime Muted"}
                >
                  {timerIsSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-rose-400" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Calendar Scheduling Modal */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-xl overflow-hidden animate-fadeIn">
            <div className="bg-[#5f6f52] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <h3 className="font-bold text-sm">Schedule Lesson on Calendar</h3>
              </div>
              <button 
                onClick={() => setIsCalendarModalOpen(false)}
                className="p-1 hover:bg-[#4d5a42] rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleScheduleCalendar} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Date</label>
                <input
                  type="date"
                  value={calendarDate}
                  onChange={(e) => setCalendarDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#5f6f52]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Start Time</label>
                  <input
                    type="time"
                    value={calendarStartTime}
                    onChange={(e) => setCalendarStartTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#5f6f52]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">End Time</label>
                  <input
                    type="time"
                    value={calendarEndTime}
                    onChange={(e) => setCalendarEndTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#5f6f52]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Location</label>
                <input
                  type="text"
                  value={calendarLocation}
                  onChange={(e) => setCalendarLocation(e.target.value)}
                  placeholder="e.g. Science Lab 2, Grade 4 Room"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#5f6f52]"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="calendarReminder"
                  checked={calendarReminder}
                  onChange={(e) => setCalendarReminder(e.target.checked)}
                  className="rounded text-[#5f6f52] focus:ring-[#5f6f52]"
                />
                <label htmlFor="calendarReminder" className="text-xs font-semibold text-slate-600">
                  Set alerts (15 min popup & 1 hour email)
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCalendarModalOpen(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl py-2.5 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-xl py-2.5 text-xs font-bold transition shadow-sm"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gmail Email Sharing Modal */}
      {isGmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-xl overflow-hidden animate-fadeIn">
            <div className="bg-[#5f6f52] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <h3 className="font-bold text-sm">Send Material via Gmail</h3>
              </div>
              <button 
                onClick={() => setIsGmailModalOpen(false)}
                className="p-1 hover:bg-[#4d5a42] rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSendGmail} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Recipient Email</label>
                <input
                  type="email"
                  value={gmailRecipient}
                  onChange={(e) => setGmailRecipient(e.target.value)}
                  placeholder="student@school.edu, parent@example.com"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#5f6f52]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Subject Line</label>
                <input
                  type="text"
                  value={gmailSubject}
                  onChange={(e) => setGmailSubject(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#5f6f52]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Optional Personal Note / Instructions</label>
                <textarea
                  value={gmailCustomMsg}
                  onChange={(e) => setGmailCustomMsg(e.target.value)}
                  placeholder="e.g. Please read over these notes before our classroom quiz tomorrow..."
                  className="w-full min-h-[90px] text-xs leading-relaxed p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#5f6f52]"
                />
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-[10px] text-slate-500 leading-relaxed">
                The structured curriculum document body (up to 4000 characters) will be formatted and included automatically as a clean HTML report below your note.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGmailModalOpen(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl py-2.5 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-xl py-2.5 text-xs font-bold transition shadow-sm"
                >
                  Send Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isQuizBuilderOpen && (
        <InteractiveQuizBuilder
          document={document}
          isStudent={isStudent}
          onSaveQuiz={async (quiz) => {
            try {
              const docRef = doc(db, 'documents', document.id);
              await setDoc(docRef, cleanUndefined(compressObject({
                quiz: quiz,
                lastModified: new Date().toISOString(),
                lastModifiedByUid: profile?.uid || '',
                lastModifiedByName: profile?.displayName || profile?.email || 'Anonymous Teacher'
              })), { merge: true });
              
              onUpdate({
                ...document,
                quiz: quiz
              });
            } catch (err) {
              console.error('Failed to save quiz to Firestore:', err);
              throw err;
            }
          }}
          onLogQuizScore={(subject, subTopic, score) => {
            const saved = localStorage.getItem('subtopic_performance_records_v1');
            let records = [];
            if (saved) {
              try { records = JSON.parse(saved); } catch (e) {}
            }
            const cleanSubtopic = subTopic || document.subTopic || 'General';
            const newRecord = {
              id: `perf-${Date.now()}`,
              subtopic: cleanSubtopic,
              score: score,
              type: 'Quiz' as const,
              date: new Date().toISOString().split('T')[0]
            };
            const updated = [...records, newRecord];
            localStorage.setItem('subtopic_performance_records_v1', JSON.stringify(updated));
            
            // Dispatch a custom event to notify LearningPathWorkspace of the score log
            const event = new CustomEvent('performanceRecordAdded', { detail: newRecord });
            window.dispatchEvent(event);

            // Notify student
            const msg = `🎉 Score logged: ${score}% for subtopic: "${cleanSubtopic}"!\nYour personalized learning path has automatically adjusted based on this result.`;
            alert(msg);
          }}
          onClose={() => setIsQuizBuilderOpen(false)}
        />
      )}

      {isWhiteboardOpen && (
        <Whiteboard
          initialData={document.whiteboardData}
          documentTitle={document.title}
          isStudent={isStudent}
          onSave={handleSaveWhiteboard}
          onClose={() => setIsWhiteboardOpen(false)}
        />
      )}

      {/* Conversational Podcast Synthesis Modal */}
      <ConversationalPodcastModal
        isOpen={isPodcastModalOpen}
        onClose={() => setIsPodcastModalOpen(false)}
        materialsText={editedContent || document.content || ''}
        materialTitle={document.title || document.topic || 'Lesson Materials'}
      />

      {/* AR Hologram Reader Modal */}
      <ARHologramReaderModal
        isOpen={isARHologramOpen}
        onClose={() => setIsARHologramOpen(false)}
        documentTitle={document.title || document.topic || 'Lesson Materials'}
        documentContext={editedContent || document.content || ''}
        initialTopic={document.topic || document.title || ''}
      />

      {isStandardsMapperOpen && (
        <CurriculumStandardsMapper
          document={document}
          isStudent={isStudent}
          onSaveMappings={async (newMappings) => {
            try {
              const docRef = doc(db, 'documents', document.id);
              await setDoc(docRef, cleanUndefined(compressObject({
                standardMappings: newMappings,
                lastModified: new Date().toISOString(),
                lastModifiedByUid: profile?.uid || '',
                lastModifiedByName: profile?.displayName || profile?.email || 'Anonymous Teacher'
              })), { merge: true });

              onUpdate({
                ...document,
                standardMappings: newMappings
              });
            } catch (err) {
              console.error('Failed to save standard mappings to Firestore:', err);
              throw err;
            }
          }}
          onClose={() => setIsStandardsMapperOpen(false)}
        />
      )}

      {isKenyanCheckerOpen && (
        <KenyanCurriculumChecker
          document={document}
          onClose={() => setIsKenyanCheckerOpen(false)}
        />
      )}

      {isCurriculumValidatorOpen && (
        <CurriculumValidator
          document={document}
          onClose={() => setIsCurriculumValidatorOpen(false)}
          onAutoAlign={(alignedContent) => {
            setEditedContent(alignedContent);
            onUpdate({
              ...document,
              title: editedTitle,
              content: alignedContent,
              lastModified: new Date().toISOString()
            });
            setIsCurriculumValidatorOpen(false);
            setWorkspaceSuccessMessage("Successfully auto-aligned lesson notes with Kenyan KICD standards!");
          }}
        />
      )}

      {isAIReviewerOpen && (
        <AIExpertReviewer
          document={document}
          onClose={() => setIsAIReviewerOpen(false)}
          onUpdate={(updatedDoc) => {
            onUpdate(updatedDoc);
          }}
          docVersions={docVersions}
          onCompareVersions={handleCompareVersions}
        />
      )}

      {isAutoAligningDirect && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-8 max-w-md w-full text-center space-y-6"
          >
            {/* Kenya Colors bar */}
            <div className="h-1 flex rounded-full overflow-hidden mb-2">
              <div className="flex-1 bg-black" />
              <div className="flex-1 bg-[#990000]" />
              <div className="flex-1 bg-[#006600]" />
            </div>

            <div className="relative mx-auto w-20 h-20">
              <div className="w-20 h-20 rounded-full border-4 border-amber-100 border-t-4 border-t-amber-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-amber-500">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-sans">
                Curriculum Auto-Alignment
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                We are validating your current document structure, identifying standards gaps, and running high-precision AI rewriting to force strict alignment with Kenyan CBC / KICD standards.
              </p>
            </div>

            <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/50">
              <p className="text-[11px] text-amber-700 font-bold animate-pulse">
                {autoAlignStep}
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {isQRCodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn flex flex-col md:flex-row">
            {/* QR display section */}
            <div className="bg-slate-50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 shrink-0 w-full md:w-72">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-md flex items-center justify-center relative">
                <QRCodeSVG
                  value={shareableUrl}
                  size={192}
                  bgColor="#ffffff"
                  fgColor={`#${qrColor}`}
                  level="M"
                  includeMargin={true}
                />
                <div className="hidden">
                  <QRCodeCanvas
                    ref={qrCanvasRef}
                    value={shareableUrl}
                    size={500}
                    bgColor="#ffffff"
                    fgColor={`#${qrColor}`}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
                <span>Active Classroom Portal</span>
              </div>
            </div>

            {/* Modal controls & custom section */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-emerald-600" />
                      Classroom QR Portal
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Connect student devices directly to lesson materials
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsQRCodeModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Metadata display */}
                <div className="mt-4 p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#5f6f52]/10 flex items-center justify-center text-[#5f6f52] shrink-0">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-700 truncate">{document.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {document.subject} &bull; {document.classLevel} &bull; {document.curriculum}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">
                  Students scanning this QR code will instantly open this document in read-only mode, with full access to curriculum materials, whiteboards, and interactive quizzes.
                </p>

                {/* Link input with copy button */}
                <div className="mt-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Direct Student Access Link
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={shareableUrl} 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-500 font-mono focus:outline-none"
                    />
                    <button
                      onClick={handleCopyQRLink}
                      className="px-3 py-1.5 bg-[#5f6f52] text-white hover:bg-[#4d5a42] rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {qrCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* QR color chooser */}
                <div className="mt-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    QR Code Color Theme
                  </label>
                  <div className="flex gap-2.5">
                    {[
                      { name: 'Slate Gray', hex: '0f172a', bg: 'bg-slate-900 border-slate-950' },
                      { name: 'Emerald Green', hex: '10b981', bg: 'bg-emerald-500 border-emerald-600' },
                      { name: 'Royal Blue', hex: '4f46e5', bg: 'bg-indigo-600 border-indigo-700' },
                      { name: 'Crimson Red', hex: 'e11d48', bg: 'bg-rose-600 border-rose-700' }
                    ].map((col) => (
                      <button
                        key={col.hex}
                        title={col.name}
                        onClick={() => setQrColor(col.hex)}
                        className={`w-6 h-6 rounded-full ${col.bg} border border-transparent transition cursor-pointer transform hover:scale-110 ${
                          qrColor === col.hex ? 'ring-2 ring-emerald-500 ring-offset-2 scale-110' : 'opacity-80'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  onClick={handlePrintQRFlyer}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Flyer Poster</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQRPng}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer text-center"
                  title="Download crisp high-resolution QR code image file"
                >
                  <Download className="w-4 h-4 text-indigo-500" />
                  <span>Download PNG</span>
                </button>

                <button
                  onClick={() => setIsQRCodeModalOpen(false)}
                  className="flex-1 sm:flex-initial bg-[#5f6f52] text-white hover:bg-[#4d5a42] px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {isVersionHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-[#FAF9F5] rounded-2xl border border-[#e5e1da] w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="p-4 bg-white border-b border-[#e5e1da] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Version History & Archives
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Review, preview, and restore previous draft revisions for "{document.title}"
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsVersionHistoryOpen(false);
                  setModalPreviewVersion(null);
                  setVersionToRestore(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Modal Body (Split Pane) */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative">
              {/* Left Pane: Versions Timeline List */}
              <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#e5e1da] bg-white flex flex-col shrink-0 min-h-0">
                <div className="p-3 bg-slate-50/50 border-b border-[#f4f1ea] flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Saved Revisions</span>
                  <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold">
                    {docVersions.length} total
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[30vh] lg:max-h-none">
                  {isVersionsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
                      <p className="text-xs italic">Syncing revisions...</p>
                    </div>
                  ) : docVersions.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 italic font-medium">No tracked revisions.</p>
                      <p className="text-[9px] text-slate-400 mt-1 px-4 leading-normal">
                        Save changes in the code editor to automatically create a restore point.
                      </p>
                    </div>
                  ) : (
                    docVersions.map((v) => {
                      const isSelected = modalPreviewVersion?.id === v.id;
                      const isCurrentActive = v.content === document.content && v.title === document.title;
                      return (
                        <button
                          key={v.id}
                          onClick={() => {
                            setModalPreviewVersion(v);
                            setVersionToRestore(null);
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex flex-col gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/40 border-indigo-200 shadow-sm ring-1 ring-indigo-200/50'
                              : 'bg-white hover:bg-slate-50 border-slate-150 hover:border-slate-250'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              Version {v.versionNumber}
                              {isCurrentActive && (
                                <span className="text-[8px] tracking-wider uppercase font-extrabold bg-[#5f6f52]/10 text-[#5f6f52] px-1 py-0.5 rounded">
                                  Current
                                </span>
                              )}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              v{v.versionNumber}
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-500 font-medium truncate w-full">
                            {v.title}
                          </p>

                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium mt-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{new Date(v.lastModified).toLocaleDateString()} &bull; {new Date(v.lastModified).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>

                          <div className="text-[9px] text-indigo-600 font-bold truncate mt-0.5">
                            By {v.modifiedByName}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Pane: Content Preview & Operations */}
              <div className="flex-1 flex flex-col min-h-0 bg-[#fdfcf7]/60">
                {modalPreviewVersion ? (
                  <div className="flex-1 flex flex-col min-h-0 relative">
                    {/* Preview Control Bar */}
                    <div className="p-3 bg-white border-b border-[#e5e1da] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          Version {modalPreviewVersion.versionNumber} Preview
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
                          Author: <span className="font-semibold text-slate-600">{modalPreviewVersion.modifiedByName}</span> ({modalPreviewVersion.modifiedByEmail || 'No email'}) &bull; Saved on {new Date(modalPreviewVersion.lastModified).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() => setVersionToRestore(modalPreviewVersion)}
                        className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore This Version</span>
                      </button>
                    </div>

                    {/* Preview Text Title */}
                    <div className="bg-white/80 backdrop-blur-xs px-6 py-3 border-b border-[#f4f1ea] shrink-0">
                      <h2 className="text-sm font-extrabold text-slate-800 leading-snug">
                        {modalPreviewVersion.title}
                      </h2>
                    </div>

                    {/* Preview Content Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="bg-white border border-[#e5e1da] rounded-2xl p-6 md:p-8 shadow-xs max-w-3xl mx-auto print-full-width">
                        <MarkdownView content={modalPreviewVersion.content} />
                      </div>
                    </div>

                    {/* IN-MODAL CONFIRM RESTORE OVERLAY */}
                    {versionToRestore && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn z-30">
                        <div className="bg-white rounded-2xl border border-[#e5e1da] max-w-md w-full shadow-2xl overflow-hidden p-6 text-center space-y-4">
                          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mx-auto">
                            <RotateCcw className="w-5 h-5 animate-pulse" />
                          </div>
                          <div className="space-y-1.5">
                            <h4 className="text-sm font-bold text-slate-800">Confirm Revision Restoration</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Are you sure you want to restore the curriculum material to <span className="font-bold text-indigo-600">Version {versionToRestore.versionNumber}</span>?
                            </p>
                            <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-2.5 leading-normal mt-2 font-medium">
                              ⚠️ This will overwrite your current draft in the viewer and editor. A new backup point of your current state will be automatically cataloged.
                            </p>
                          </div>

                          <div className="flex gap-2.5 pt-1">
                            <button
                              onClick={() => setVersionToRestore(null)}
                              className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl py-2.5 text-xs font-bold transition cursor-pointer"
                            >
                              No, Cancel
                            </button>
                            <button
                              onClick={() => {
                                if (versionToRestore) {
                                  handleRestoreVersion(versionToRestore.content, versionToRestore.title);
                                  setWorkspaceSuccessMessage(`Successfully restored the document to Version ${versionToRestore.versionNumber}!`);
                                  logActivity(
                                    'edit',
                                    `Restored document to Version ${versionToRestore.versionNumber}: "${document.title}"`,
                                    profile,
                                    document.id,
                                    document.title
                                  );
                                }
                                setIsVersionHistoryOpen(false);
                                setModalPreviewVersion(null);
                                setVersionToRestore(null);
                              }}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-bold transition shadow-sm cursor-pointer"
                            >
                              Yes, Restore Version
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-3.5">
                      <History className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">No Revision Selected</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed font-medium">
                      Select any document savepoint from the left panel to preview its contents, verify modifications, and revert back to earlier states.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-indigo-50/40">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                  3-Bullet Lesson Summary
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Generated by Gemini 3.5 Flash for high-level pedagogical review
                </p>
              </div>
              <button 
                onClick={() => setIsSummaryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {isGeneratingSummary ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                  <h4 className="text-sm font-bold text-slate-700">Analyzing Educational Material</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed font-medium">
                    Gemini is processing the content structure and learning objectives to compile a professional 3-bullet point executive summary...
                  </p>
                </div>
              ) : summaryError ? (
                <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                  <p className="text-xs font-bold text-rose-600">Failed to generate summary</p>
                  <p className="text-[11px] text-rose-500 mt-1">{summaryError}</p>
                  <button
                    onClick={handleGenerateSummary}
                    className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Document Source</h4>
                      <p className="text-xs font-bold text-slate-700 mt-1">{editedTitle || 'Untitled'}</p>
                    </div>
                  </div>

                  <div className="prose prose-slate max-w-none text-slate-600">
                    <MarkdownView content={summaryText} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSummaryModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  disabled={!summaryText || isGeneratingSummary}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {summaryCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Summary</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Readability & Complexity Suggestions Modal */}
      {isReadabilitySuggestionsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className={`p-6 border-b border-slate-100 flex items-start justify-between ${
              readabilityTargetAction === 'simplify' ? 'bg-emerald-50/40' : 'bg-indigo-50/40'
            }`}>
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
                  <Sparkles className={`w-5 h-5 ${
                    readabilityTargetAction === 'simplify' ? 'text-emerald-600' : 'text-indigo-600'
                  } animate-pulse`} />
                  {readabilityTargetAction === 'simplify' ? 'Simplify Reading Complexity' : 'Elevate Reading Complexity'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {readabilityTargetAction === 'simplify' 
                    ? 'Get expert linguistic suggestions and automatic sentence rewrites to reduce reading difficulty.' 
                    : 'Get suggestions to elevate vocabulary, introduce academic rigor, and challenge advanced students.'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsReadabilitySuggestionsModalOpen(false);
                  setAppliedRewrites([]);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {isGeneratingReadabilitySuggestions ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className={`w-10 h-10 animate-spin mb-4 ${
                    readabilityTargetAction === 'simplify' ? 'text-emerald-600' : 'text-indigo-600'
                  }`} />
                  <h4 className="text-sm font-bold text-slate-700">Analyzing Document Readability</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed font-medium">
                    Gemini is auditing your document sentences, syllable density, and grammatical structures to formulate precise {readabilityTargetAction === 'simplify' ? 'simplification' : 'elevation'} strategies...
                  </p>
                </div>
              ) : readabilitySuggestionsError ? (
                <div className="p-5 bg-rose-50 border border-rose-150 rounded-2xl text-center space-y-3">
                  <p className="text-xs font-bold text-rose-600">Failed to analyze document</p>
                  <p className="text-[11px] text-rose-500 leading-relaxed max-w-md mx-auto">{readabilitySuggestionsError}</p>
                  <button
                    onClick={() => handleGenerateReadabilitySuggestions(readabilityTargetAction)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : readabilitySuggestions ? (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Overall Guidance */}
                  <div className={`p-4 rounded-xl border ${
                    readabilityTargetAction === 'simplify' 
                      ? 'bg-emerald-50/30 border-emerald-100/50 text-emerald-950' 
                      : 'bg-indigo-50/30 border-indigo-100/50 text-indigo-950'
                  }`}>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider mb-1 flex items-center gap-1.5 opacity-80">
                      <BookOpen className="w-4 h-4 shrink-0" /> Strategic Pedagogical Guidance
                    </h4>
                    <p className="text-xs leading-relaxed font-medium">
                      {readabilitySuggestions.overallGuidance}
                    </p>
                  </div>

                  {/* Core Suggestions List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-slate-400" /> Actionable Strategies
                    </h4>
                    <div className="grid grid-cols-1 gap-2.5">
                      {readabilitySuggestions.suggestions.map((sug, i) => (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-start gap-2.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 ${
                            readabilityTargetAction === 'simplify' ? 'bg-emerald-600' : 'bg-indigo-600'
                          }`}>
                            {i + 1}
                          </span>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">{sug}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sentence-by-Sentence Example Rewrites */}
                  {readabilitySuggestions.exampleRewrites && readabilitySuggestions.exampleRewrites.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-slate-400" /> Interactive Sentence Rewriter
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-none font-medium">
                        Apply suggestions directly to your document in real-time. You can always undo changes.
                      </p>
                      
                      <div className="space-y-3">
                        {readabilitySuggestions.exampleRewrites.map((item, idx) => {
                          const isApplied = appliedRewrites.includes(item.original);
                          return (
                            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                              <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-start">
                                {/* Before */}
                                <div className="md:col-span-5 space-y-1">
                                  <span className="text-[9px] uppercase font-bold text-slate-400">Current Sentence</span>
                                  <p className="text-xs text-slate-600 p-2.5 bg-red-50/40 border border-red-100 rounded-lg min-h-[50px] font-medium leading-relaxed">
                                    {item.original}
                                  </p>
                                </div>
                                <div className="md:col-span-1 flex items-center justify-center h-full pt-6 text-slate-300 font-bold">
                                  ➔
                                </div>
                                {/* After */}
                                <div className="md:col-span-5 space-y-1">
                                  <span className="text-[9px] uppercase font-bold text-emerald-600">Proposed Version</span>
                                  <p className="text-xs text-slate-800 p-2.5 bg-emerald-50/40 border border-emerald-100 rounded-lg min-h-[50px] font-bold leading-relaxed">
                                    {item.modified}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 bg-slate-50/40 -mx-4 -mb-4 p-3 rounded-b-xl">
                                <span className="text-[10px] text-slate-500 font-medium italic pr-4">
                                  <strong>Why:</strong> {item.reason}
                                </span>
                                
                                {isApplied ? (
                                  <button
                                    onClick={() => handleRevertRewrite(item.original, item.modified)}
                                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition shrink-0"
                                  >
                                    <Undo className="w-3.5 h-3.5" /> Revert
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleApplyRewrite(item.original, item.modified)}
                                    className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition shrink-0 shadow-xs ${
                                      readabilityTargetAction === 'simplify' 
                                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5" /> Apply Change
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <p className="text-2xl">⚡</p>
                  <p className="text-xs font-semibold">Select an option below to initiate the readability analysis.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateReadabilitySuggestions('simplify')}
                  disabled={isGeneratingReadabilitySuggestions}
                  className={`px-3.5 py-2 border rounded-xl text-xs font-extrabold cursor-pointer transition flex items-center gap-1.5 ${
                    readabilityTargetAction === 'simplify' && readabilitySuggestions
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Simplify Suggestions</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateReadabilitySuggestions('elevate')}
                  disabled={isGeneratingReadabilitySuggestions}
                  className={`px-3.5 py-2 border rounded-xl text-xs font-extrabold cursor-pointer transition flex items-center gap-1.5 ${
                    readabilityTargetAction === 'elevate' && readabilitySuggestions
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Elevate Suggestions</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsReadabilitySuggestionsModalOpen(false);
                  setAppliedRewrites([]);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed ${timerIsFloating ? 'bottom-28' : 'bottom-6'} right-6 z-40 no-print flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-900 text-white rounded-full shadow-2xl border border-slate-700/70 backdrop-blur-md transition-all hover:scale-105 active:scale-95 text-xs font-bold cursor-pointer group`}
          title="Scroll back to top of lesson plan"
        >
          <ArrowUp className="w-4 h-4 text-emerald-400 group-hover:-translate-y-0.5 transition-transform shrink-0" />
          <span className="hidden sm:inline">Back to Top</span>
        </motion.button>
      )}

      {/* Floating Lesson Pacing Timer Widget */}
      {timerIsFloating && (
        <div className="fixed bottom-6 right-6 z-50 no-print max-w-[280px] sm:max-w-[320px] w-full bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${timerIsActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
                Pacing: {timerPhase === 'Custom' ? (customPhaseName || 'Custom Phase') : timerPhase}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTimerIsFullScreen(true)}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                title="Expand pacing board to Full Screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsTimerPanelCollapsed(!isTimerPanelCollapsed)}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                title={isTimerPanelCollapsed ? "Expand timer panel" : "Collapse timer panel"}
              >
                {isTimerPanelCollapsed ? (
                  <ChevronDown className="w-4 h-4 rotate-180" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <button 
                onClick={() => setTimerIsFloating(false)}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                title="Dock timer back to sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsed view */}
          {isTimerPanelCollapsed ? (
            <div className="p-4 flex items-center justify-between gap-3 bg-slate-950">
              <div className="flex flex-col">
                <span className="text-xl font-black font-mono tracking-wider text-white">
                  {Math.floor(timerSecondsLeft / 60).toString().padStart(2, '0')}:
                  {(timerSecondsLeft % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-[9px] text-slate-400 font-bold truncate max-w-[120px]">
                  {timerPhase === 'Custom' ? (customPhaseName || 'Custom Phase') : timerPhase}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => timerIsActive ? setTimerIsActive(false) : startPacingWithNotificationRequest()}
                  className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                    timerIsActive
                      ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white'
                      : 'bg-[#5f6f52] hover:bg-[#4d5a42] border-[#5f6f52] text-white'
                  }`}
                >
                  {timerIsActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => {
                    setTimerIsActive(false);
                    setTimerSecondsLeft(timerDuration);
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition cursor-pointer"
                  title="Reset timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Fully Expanded Controls */
            <div className="p-4 space-y-4 bg-slate-950">
              {/* Digital countdown with Circular Countdown Ring */}
              <div className="flex flex-col items-center justify-center py-6 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="64"
                      cy="64"
                      r="52"
                      className="stroke-slate-800 fill-none"
                      strokeWidth="6"
                    />
                    {/* Active progress circle */}
                    <circle
                      cx="64"
                      cy="64"
                      r="52"
                      className={`fill-none transition-all duration-1000 ease-linear ${
                        timerIsActive && timerSecondsLeft <= 30 
                          ? 'stroke-rose-500 animate-pulse' 
                          : 'stroke-emerald-500'
                      }`}
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 52}
                      strokeDashoffset={2 * Math.PI * 52 * (1 - (timerDuration > 0 ? timerSecondsLeft / timerDuration : 0))}
                      strokeLinecap="round"
                    />
                  </svg>
                  
                  {/* Centered Digital Time Text */}
                  <div className="absolute flex flex-col items-center justify-center">
                    {!timerIsActive && timerSecondsLeft < timerDuration && timerSecondsLeft > 0 && (
                      <span className="text-[8px] font-extrabold bg-amber-500 text-white px-1.5 py-0.5 rounded-md tracking-wider uppercase mb-1 leading-none shadow-xs animate-pulse">
                        Paused
                      </span>
                    )}
                    <div className={`text-2xl font-black font-mono tracking-wider flex items-center gap-0.5 transition-colors duration-500 ${
                      timerIsActive && timerSecondsLeft <= 30 ? 'text-rose-500 animate-pulse' : 'text-white'
                    }`}>
                      <span>{Math.floor(timerSecondsLeft / 60).toString().padStart(2, '0')}</span>
                      <span className={`${timerIsActive ? 'animate-pulse' : ''}`}>:</span>
                      <span>{(timerSecondsLeft % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <p className={`text-[9px] font-bold mt-0.5 tracking-wider uppercase max-w-[90px] truncate text-center transition-colors duration-500 ${
                      timerIsActive && timerSecondsLeft <= 30 ? 'text-rose-500' : 'text-slate-400'
                    }`}>
                      {timerPhase === 'Custom' ? (customPhaseName || 'CUSTOM') : timerPhase.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Presets / Selector if they want to adjust on the fly */}
              <div className="grid grid-cols-3 gap-1.5">
                {[5, 10, 15].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setTimerDuration(mins * 60);
                      setTimerSecondsLeft(mins * 60);
                      setTimerIsActive(false);
                    }}
                    disabled={timerIsActive}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700 transition cursor-pointer"
                  >
                    {mins} min
                  </button>
                ))}
              </div>

              {/* Adjusters */}
              <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400">Quick Adjust</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      const newTotal = Math.max(30, timerSecondsLeft - 30);
                      setTimerSecondsLeft(newTotal);
                    }}
                    className="px-2 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                  >
                    -30s
                  </button>
                  <button
                    onClick={() => {
                      const newTotal = timerSecondsLeft + 30;
                      setTimerSecondsLeft(newTotal);
                    }}
                    className="px-2 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                  >
                    +30s
                  </button>
                </div>
              </div>

              {/* Main controls */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => timerIsActive ? setTimerIsActive(false) : startPacingWithNotificationRequest()}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                    timerIsActive
                      ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white'
                      : 'bg-[#5f6f52] hover:bg-[#4d5a42] border-[#5f6f52] text-white'
                  }`}
                >
                  {timerIsActive ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{timerSecondsLeft < timerDuration && timerSecondsLeft > 0 ? 'Resume' : 'Start'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setTimerIsActive(false);
                    setTimerSecondsLeft(timerDuration);
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition cursor-pointer"
                  title="Reset timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setTimerIsSoundEnabled(!timerIsSoundEnabled)}
                  className={`p-2 border rounded-xl transition cursor-pointer ${
                    timerIsSoundEnabled
                      ? 'bg-[#5f6f52]/20 border-[#5f6f52]/40 text-[#5f6f52] hover:bg-[#5f6f52]/30'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                  title={timerIsSoundEnabled ? "Chime enabled" : "Chime muted"}
                >
                  {timerIsSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Time's Up Alert Modal */}
      {showTimerAlertModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 no-print animate-fadeIn">
          <div className="bg-white border border-[#e5e1da] max-w-md w-full rounded-2xl p-6 shadow-2xl relative overflow-hidden transform animate-scaleUp text-center">
            {/* Elegant Top Decorative Border */}
            <div className="absolute top-0 left-0 w-full h-2 bg-[#5f6f52]"></div>
            
            {/* Pulsating Icon container */}
            <div className="mx-auto w-16 h-16 bg-[#5f6f52]/10 rounded-full flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 bg-[#5f6f52]/20 rounded-full animate-ping"></div>
              <Bell className="w-8 h-8 text-[#5f6f52] animate-bounce" />
            </div>

            <h3 className="text-2xl font-serif font-black text-slate-800 mb-2">
              Time's Up!
            </h3>
            
            <p className="text-sm text-slate-600 mb-6 font-semibold leading-relaxed">
              The <span className="text-[#5f6f52] font-black underline decoration-2">{timerPhase === 'Custom' ? (customPhaseName || 'Custom Phase') : timerPhase}</span> phase of your lesson has ended. Keep up the momentum!
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowTimerAlertModal(false);
                  setTimerSecondsLeft(60);
                  setTimerDuration(60);
                  setTimerIsActive(true);
                }}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                +1 min Wrap-Up
              </button>
              
              <button
                onClick={() => {
                  setShowTimerAlertModal(false);
                  setTimerSecondsLeft(timerDuration);
                }}
                className="flex-1 py-2.5 px-4 bg-[#5f6f52] hover:bg-[#4d5a42] text-white border border-[#5f6f52] rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                Acknowledge & Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Network Sync & Notification Toast */}
      {syncNotificationToast && (
        <div className="fixed top-16 right-6 z-50 max-w-md w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-cyan-500/50 flex items-start justify-between gap-3 animate-slideDown no-print">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <BellRing className="w-4 h-4 animate-bounce text-cyan-400" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                <span>Socratic AI Sync Notification</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/30 text-cyan-300 rounded font-black uppercase">
                  Connectivity
                </span>
              </h4>
              <p className="text-xs text-slate-200 font-semibold leading-relaxed mt-1">
                {syncNotificationToast.text}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSyncNotificationToast(null)}
            className="text-slate-400 hover:text-white transition cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Socratic AI Sidebar Panel */}
      {!isQuickStudyMode && isSocraticSidebarOpen && (
        <div className="fixed top-0 right-0 h-full w-[380px] sm:w-[420px] bg-white border-l border-slate-200 shadow-2xl z-45 flex flex-col no-print animate-slideLeft">
          {/* Header */}
          <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <div>
                <h4 className="font-extrabold text-sm text-white">Socratic AI Assistant</h4>
                <p className="text-[10px] text-indigo-200">Active scaffold-based dialog</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSocraticSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-indigo-700 text-indigo-100 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Network Connectivity Status Banner */}
          {!isOnline && (
            <div className="bg-amber-500 text-slate-900 px-3 py-1.5 text-[11px] font-bold flex items-center justify-between border-b border-amber-600/30 animate-fadeIn">
              <div className="flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
                <span>Offline Mode: Questions queued & auto-fetched when reconnected.</span>
              </div>
              {offlineSocraticQueue.length > 0 && (
                <span className="bg-slate-900 text-amber-300 px-1.5 py-0.2 rounded font-mono text-[10px] shrink-0">
                  {offlineSocraticQueue.length} queued
                </span>
              )}
            </div>
          )}

          {isOnline && offlineSocraticQueue.length > 0 && (
            <div className="bg-cyan-600 text-white px-3 py-1.5 text-[11px] font-bold flex items-center justify-between border-b border-cyan-700 animate-fadeIn">
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                <span>Online: {offlineSocraticQueue.length} offline question{offlineSocraticQueue.length > 1 ? 's' : ''} ready to sync</span>
              </div>
              <button
                onClick={processOfflineQueue}
                disabled={isSyncingOfflineQueue}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition shrink-0"
              >
                <RotateCw className={`w-3 h-3 ${isSyncingOfflineQueue ? 'animate-spin' : ''}`} />
                <span>{isSyncingOfflineQueue ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          )}

          {/* Engagement stats widget */}
          <div className="bg-slate-50 border-b border-slate-150 px-4 py-2.5 flex items-center justify-between text-[11px] font-bold text-slate-600">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">⏱️ Active Dwell:</span>
              <span className="text-indigo-600 font-mono bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                {documentDwellTime}s
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">💬 Interactions:</span>
              <span className="text-emerald-600 font-mono bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                {socraticInteractionsCount}
              </span>
            </div>
            {!isOnline && (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-black uppercase flex items-center gap-1">
                <WifiOff className="w-3 h-3 text-amber-600" /> Offline
              </span>
            )}
          </div>

          {/* Socratic Messages Screen */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {socraticMessages.map((msg, index) => (
              <div 
                key={index}
                className={`flex flex-col max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <span className="text-[9px] text-slate-400 font-bold uppercase mb-0.5 px-1 flex items-center gap-1">
                  <span>{msg.role === 'user' ? 'Student' : 'Socratic Tutor'}</span>
                  {msg.isQueuedOffline && (
                    <span className="text-amber-600 font-black text-[8px] bg-amber-100 border border-amber-200 px-1 py-0.2 rounded">
                      Queued Offline
                    </span>
                  )}
                </span>
                <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-xs relative ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : msg.isOfflinePending
                    ? 'bg-amber-50/90 border border-amber-300 text-amber-900 rounded-tl-none italic'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  {msg.text}
                  {msg.isQueuedOffline && (
                    <div className="mt-1 flex items-center gap-1 text-[9px] font-extrabold text-amber-100 bg-amber-900/50 px-1.5 py-0.5 rounded border border-amber-400/40 w-max">
                      <WifiOff className="w-2.5 h-2.5 text-amber-300" />
                      <span>Queued (Will auto-fetch on reconnect)</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isSocraticLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold pl-1">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Socratic mind formulating response...</span>
              </div>
            )}
          </div>

          {/* Suggested Socratic Prompts */}
          <div className="p-3 bg-white border-t border-slate-100 space-y-1.5">
            <p className="text-[9px] uppercase font-extrabold text-slate-400">Guided Icebreakers</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleSendSocraticSidebarMessage("Explain the central concept of this lesson plan in a simple analogy.")}
                disabled={isSocraticLoading}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] text-slate-600 font-bold transition text-left cursor-pointer"
              >
                💡 Simple Analogy
              </button>
              <button
                onClick={() => handleSendSocraticSidebarMessage("What are some common student misconceptions associated with this topic?")}
                disabled={isSocraticLoading}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] text-slate-600 font-bold transition text-left cursor-pointer"
              >
                ⚡ Misconceptions
              </button>
              <button
                onClick={() => handleSendSocraticSidebarMessage("How can I apply this document's concepts to a hands-on practical activity?")}
                disabled={isSocraticLoading}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] text-slate-600 font-bold transition text-left cursor-pointer"
              >
                🛠️ Hands-on Activity
              </button>
            </div>
          </div>

          {/* Socratic Chat Input */}
          <div className="p-3 bg-white border-t border-slate-200">
            {!isOnline && (
              <div className="text-[10px] text-amber-800 font-extrabold mb-1.5 flex items-center gap-1.5 bg-amber-50 p-2 rounded-xl border border-amber-200">
                <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Offline Mode: Questions typed now are queued locally & auto-synced when reconnected!</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={socraticInput}
                onChange={(e) => setSocraticInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendSocraticSidebarMessage();
                }}
                disabled={isSocraticLoading}
                placeholder={isOnline ? "Ask your Socratic Tutor a question..." : "Type question (Queued offline & auto-synced)..."}
                className={`flex-1 border text-slate-800 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none transition ${
                  isOnline 
                    ? 'bg-slate-50 border-slate-200 focus:border-indigo-600'
                    : 'bg-amber-50/60 border-amber-300 focus:border-amber-600'
                }`}
              />
              <button
                onClick={() => handleSendSocraticSidebarMessage()}
                disabled={isSocraticLoading || !socraticInput.trim()}
                className={`p-2 disabled:opacity-40 text-white rounded-xl transition cursor-pointer ${
                  isOnline ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
                title={isOnline ? "Send question" : "Queue question offline"}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proactive Socratic Mastery Challenge Offer Modal */}
      {showChallengeOffer && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-cyan-500/40 overflow-hidden animate-slideUp no-print">
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400 animate-bounce border border-cyan-500/30">
                  <Zap className="w-5 h-5 fill-cyan-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                    <span>Mastery Flow Detected</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/30 text-cyan-300 rounded font-black uppercase">Passive AI</span>
                  </h4>
                  <p className="text-[10px] text-cyan-300">Fast Reading Pace ({scrollSpeed} px/s)</p>
                </div>
              </div>
              <button 
                onClick={() => setShowChallengeOffer(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-semibold">
              "You seem to be breezing through this—would you like a harder challenge?"
            </p>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 font-mono">
              <span>⚡ {scrollSpeed} px/s</span>
              <span>•</span>
              <span>⏱️ {documentDwellTime}s study</span>
              <span>•</span>
              <span>💬 {socraticInteractionsCount} queries</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowChallengeOffer(false)}
                className="flex-1 py-2 px-3 border border-slate-700 hover:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-300 transition cursor-pointer text-center"
              >
                Keep Current Pace
              </button>
              <button
                onClick={async () => {
                  setShowChallengeOffer(false);
                  setIsSocraticSidebarOpen(false);
                  await handleFetchMasteryChallenge();
                }}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-[10px] font-extrabold transition shadow-md cursor-pointer text-center flex items-center justify-center gap-1"
              >
                Accept Challenge ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proactive Socratic Frustration / Support Offer Modal */}
      {showFrustrationOffer && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-amber-500/40 overflow-hidden animate-slideUp no-print">
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 animate-pulse border border-amber-500/30">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                    <span>Concept Friction Detected</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/30 text-amber-300 rounded font-black uppercase">Socratic Assist</span>
                  </h4>
                  <p className="text-[10px] text-amber-300">Stationary Pause ({sectionPauseDuration}s)</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFrustrationOffer(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-semibold">
              "You've been reflecting on this section for a while ({sectionPauseDuration}s pause). Would you like a step-by-step Socratic breakdown or visual analogy?"
            </p>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 font-mono">
              <span>⏱️ {sectionPauseDuration}s pause</span>
              <span>•</span>
              <span>🔄 {scrollReversals} re-reads</span>
              <span>•</span>
              <span>💬 {socraticInteractionsCount} queries</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowFrustrationOffer(false)}
                className="flex-1 py-2 px-3 border border-slate-700 hover:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-300 transition cursor-pointer text-center"
              >
                I'm Okay, Thanks
              </button>
              <button
                onClick={async () => {
                  setShowFrustrationOffer(false);
                  await handleFetchConceptSimplification();
                }}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-[10px] font-extrabold transition shadow-md cursor-pointer text-center flex items-center justify-center gap-1"
              >
                Simplify Concept ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Challenge Question Modal */}
      {(isLoadingActiveChallenge || activeChallenge) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">Socratic Conceptual Challenge</h3>
                  <p className="text-[10px] text-indigo-200 font-medium">Stretch your cognitive understanding</p>
                </div>
              </div>
              {!isLoadingActiveChallenge && (
                <button 
                  onClick={() => {
                    setActiveChallenge(null);
                    setSelectedChallengeOption(null);
                    setShowChallengeExplanation(false);
                    setHasCorrectlyAnsweredChallenge(null);
                  }}
                  className="p-1 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-500/30 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {isLoadingActiveChallenge ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-xs font-bold text-slate-600">Generating Advanced Conceptual Question</p>
                  <p className="text-[10px] text-slate-400 max-w-xs leading-normal">
                    Gemini Socratic Engine is synthesizing a deep high-order cognitive query based on the lesson plan...
                  </p>
                </div>
              ) : activeChallenge ? (
                <div className="space-y-4">
                  {/* The Question */}
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">
                      {activeChallenge.question}
                    </p>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2">
                    {activeChallenge.options.map((option, idx) => {
                      const isSelected = selectedChallengeOption === idx;
                      const isCorrect = idx === activeChallenge.correctAnswerIndex;
                      
                      let optionStyle = "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
                      if (selectedChallengeOption !== null) {
                        if (isSelected) {
                          optionStyle = isCorrect
                            ? "border-emerald-500 bg-emerald-50 text-emerald-850 font-bold"
                            : "border-rose-500 bg-rose-50 text-rose-850 font-bold";
                        } else if (isCorrect && showChallengeExplanation) {
                          optionStyle = "border-emerald-500 bg-emerald-50/70 text-emerald-850 font-bold";
                        } else {
                          optionStyle = "border-slate-100 bg-slate-50 text-slate-400 opacity-70";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={selectedChallengeOption !== null}
                          onClick={() => {
                            setSelectedChallengeOption(idx);
                            setShowChallengeExplanation(true);
                            setHasCorrectlyAnsweredChallenge(idx === activeChallenge.correctAnswerIndex);
                          }}
                          className={`w-full p-3 border rounded-xl text-left text-xs transition font-semibold flex items-start gap-2.5 cursor-pointer ${optionStyle}`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                            isSelected 
                              ? isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="leading-relaxed">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Result Header & Explanation */}
                  {showChallengeExplanation && (
                    <div className={`p-4 rounded-xl border animate-fadeIn space-y-2 ${
                      hasCorrectlyAnsweredChallenge 
                        ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950' 
                        : 'bg-rose-50/50 border-rose-100 text-rose-950'
                    }`}>
                      <div className="flex items-center gap-1.5 font-extrabold text-xs">
                        {hasCorrectlyAnsweredChallenge ? (
                          <span className="text-emerald-600">🎉 Correct! Outstanding mastery!</span>
                        ) : (
                          <span className="text-rose-600">💡 Deep Socratic Insight</span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed font-semibold">
                        {activeChallenge.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {activeChallenge && selectedChallengeOption === null && (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Select one option to reveal Socratic feedback
                </span>
              )}
              {activeChallenge && selectedChallengeOption !== null && (
                <button
                  onClick={() => handleFetchMasteryChallenge()}
                  className="px-3.5 py-2 border border-slate-200 hover:bg-white text-slate-700 bg-slate-50 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  🔄 Try Another Question
                </button>
              )}
              <div className="ml-auto">
                <button
                  onClick={() => {
                    setActiveChallenge(null);
                    setSelectedChallengeOption(null);
                    setShowChallengeExplanation(false);
                    setHasCorrectlyAnsweredChallenge(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Parent-Teacher Real-Time Chat & Feedback Sub-component
// ==========================================

interface DocumentParentChatPanelProps {
  document: SavedDocument;
  profile: any;
  allUsers: any[];
  onClose: () => void;
}

function DocumentParentChatPanel({
  document,
  profile,
  allUsers,
  onClose
}: DocumentParentChatPanelProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [targetPartner, setTargetPartner] = useState<any>(null);
  const panelChatEndRef = useRef<HTMLDivElement>(null);

  const isParent = profile?.role === 'Parent';
  const isTeacher = profile?.role === 'Teacher' || profile?.role === 'Administrator';

  // 1. Determine eligible partners to choose from
  const parents = allUsers.filter(u => u.role === 'Parent');
  const teachers = allUsers.filter(u => u.role === 'Teacher' || u.role === 'Administrator');

  // 2. Set default target partner
  useEffect(() => {
    if (!profile) return;
    if (isParent) {
      // Find the document owner/author if possible
      const docOwnerUid = document.lastModifiedByUid || document.sharedByUid;
      const owner = teachers.find(t => t.uid === docOwnerUid);
      if (owner) {
        setTargetPartner(owner);
      } else if (teachers.length > 0) {
        setTargetPartner(teachers[0]); // fallback to first teacher
      }
    } else if (isTeacher && parents.length > 0) {
      // Teachers: select first parent by default if none selected
      if (!targetPartner) {
        setTargetPartner(parents[0]);
      }
    }
  }, [document, allUsers, profile]);

  // 3. Listen to real-time messages about this document involving current user & target partner
  useEffect(() => {
    if (!profile || !targetPartner) return;

    const msgCol = firestoreCollection(chatDb, 'parent_teacher_messages');
    const q = firestoreQuery(msgCol, firestoreOrderBy('createdAt', 'asc'));

    const unsubscribe = firestoreOnSnapshot(q, (snapshot) => {
      const list: ChatMsg[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ChatMsg;
        const matchesDoc = data.docId === document.id;
        const isThread = 
          (data.senderUid === profile.uid && data.recipientUid === targetPartner.uid) ||
          (data.senderUid === targetPartner.uid && data.recipientUid === profile.uid);

        if (matchesDoc && isThread) {
          list.push({ ...data, id: docSnap.id });
        }
      });
      setMessages(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to document parent chat messages:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [document.id, profile, targetPartner]);

  // Scroll to bottom on new messages
  useEffect(() => {
    panelChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark incoming messages as read
  useEffect(() => {
    if (!profile || !targetPartner) return;
    const unread = messages.filter(m => m.senderUid === targetPartner.uid && m.recipientUid === profile.uid && !m.read);
    unread.forEach(async (msg) => {
      try {
        const msgRef = firestoreDoc(chatDb, 'parent_teacher_messages', msg.id);
        await firestoreUpdateDoc(msgRef, { read: true });
      } catch (err) {}
    });
  }, [messages, profile, targetPartner]);

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !profile || !targetPartner) return;

    const msgData: Partial<ChatMsg> = {
      senderUid: profile.uid,
      senderName: profile.displayName,
      senderRole: profile.role,
      recipientUid: targetPartner.uid,
      recipientName: targetPartner.displayName,
      recipientRole: targetPartner.role,
      docId: document.id,
      docTitle: document.title,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      read: false
    };

    try {
      const msgCol = firestoreCollection(chatDb, 'parent_teacher_messages');
      await firestoreAddDoc(msgCol, chatCleanUndefined(msgData));
      setText('');
    } catch (err) {
      chatHandleError(err, ChatOpType.CREATE, 'parent_teacher_messages');
    }
  };

  return (
    <div className="w-full xl:w-80 shrink-0 bg-white rounded-2xl border border-[#e5e1da] shadow-sm p-4 space-y-4 no-print flex flex-col max-h-[850px] overflow-hidden animate-fadeIn">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#f4f1ea] pb-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
            <MessageCircle className="w-4 h-4 fill-purple-500 text-purple-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Parent Portal</h4>
            <p className="text-[9px] text-slate-400">Direct Collaboration Thread</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Select Partner Dropdown */}
      <div className="space-y-1 bg-[#faf8f5] p-2.5 rounded-xl border border-slate-100 shrink-0">
        <label className="text-[9px] font-extrabold uppercase text-slate-400 block">
          {isParent ? "Educator Reference" : "Parent Feedback Contact"}
        </label>
        <select
          value={targetPartner?.uid || ''}
          onChange={(e) => {
            const selected = allUsers.find(u => u.uid === e.target.value);
            if (selected) setTargetPartner(selected);
          }}
          className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          {isParent ? (
            teachers.map(t => (
              <option key={t.uid} value={t.uid}>
                {t.displayName} ({t.role})
              </option>
            ))
          ) : (
            parents.map(p => (
              <option key={p.uid} value={p.uid}>
                {p.displayName} (Parent)
              </option>
            ))
          )}
        </select>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[400px] min-h-[200px] bg-[#fafaf9]/30 rounded-xl p-2 border border-dashed border-slate-100">
        {messages.length === 0 ? (
          <div className="text-center py-12 space-y-1.5">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-[10px] text-slate-500 font-bold">No direct messages yet.</p>
            <p className="text-[9px] text-slate-400 leading-tight">
              Type your first observation or feedback question below to establish direct communication.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isOwn = m.senderUid === profile?.uid;
            return (
              <div 
                key={m.id} 
                className={`flex flex-col max-w-[85%] space-y-0.5 ${isOwn ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className={`p-2.5 rounded-2xl text-[11px] leading-relaxed ${
                  isOwn 
                    ? 'bg-purple-600 text-white rounded-tr-xs shadow-3xs' 
                    : 'bg-[#f4f1ea] text-slate-800 rounded-tl-xs shadow-3xs border border-[#e5e1da]'
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
                <div className="flex items-center gap-1 px-1">
                  <span className="text-[8px] text-slate-400">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isOwn && (
                    <span className="text-[8px] font-bold text-slate-400">
                      {m.read ? ' • Read' : ' • Sent'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={panelChatEndRef} />
      </div>

      {/* Input footer */}
      <form onSubmit={handleSend} className="space-y-2 shrink-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={targetPartner ? `Message ${targetPartner.displayName}...` : "Select a contact first..."}
          className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 bg-[#fdfbf7] resize-none h-14 leading-relaxed"
          disabled={!targetPartner}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          required
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!text.trim() || !targetPartner}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-extrabold rounded-lg shadow-xs transition disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Send Message</span>
          </button>
        </div>
      </form>
    </div>
  );
}
