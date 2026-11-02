import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import StudentXpWidget from './StudentXpWidget';
import { SavedDocument, DocumentType, DocumentDraft, AppNotification } from '../types';
import { DemoVideoModal } from './public/DemoVideoModal';
import { WhatsAppDashboardWidget } from './WhatsAppDashboardWidget';
import {
  Plus,
  Search,
  BookOpen,
  FileText,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  ClipboardCheck,
  Lightbulb,
  Clock,
  ExternalLink,
  BookMarked,
  Archive,
  Trash2,
  Tag,
  X,
  History,
  ChevronLeft,
  ChevronRight,
  Bell,
  Check,
  BarChart3,
  AlertCircle,
  Printer,
  Download,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Activity,
  Shield,
  FileCheck,
  Folder,
  FolderPlus,
  FolderOpen,
  Home,
  Compass,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  List,
  Pin,
  Settings as SettingsIcon,
  Image as ImageIcon,
  Video,
  Users,
  Play,
  Camera,
  QrCode,
  Scan,
  Zap,
  Upload,
  Info,
  HelpCircle,
  Sun,
  Moon,
  Radio
} from 'lucide-react';
import { broadcastDocumentSession } from '../services/documentBroadcastService';
import { db } from '../firebase';
import { QRMappingService } from '../services/qrMappingService';
import { ScannedStationPortalModal } from './ScannedStationPortalModal';
import { HowToScanModal } from './HowToScanModal';
import { findRequirements } from '../data/kenyanCurriculumStandards';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth, resolveDisplayName } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Levenshtein distance helper for typo-tolerant fuzzy matching
function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Calculate the similarity ratio (0 to 1) between two words
function getWordSimilarity(word1: string, word2: string): number {
  const w1 = word1.toLowerCase().trim();
  const w2 = word2.toLowerCase().trim();
  if (w1 === w2) return 1.0;
  if (w1.includes(w2) || w2.includes(w1)) {
    return Math.max(w1.length, w2.length) > 0 
      ? Math.min(w1.length, w2.length) / Math.max(w1.length, w2.length)
      : 0.5;
  }
  
  if (w1.length >= 3 && w2.length >= 3) {
    const dist = getLevenshteinDistance(w1, w2);
    const maxLen = Math.max(w1.length, w2.length);
    return 1 - dist / maxLen;
  }
  return 0;
}

// Calculate document fuzzy match relevance score
interface FuzzyMatchScoreResult {
  score: number;
  matchedStrands: string[];
  matchedFields: string[];
}

function calculateFuzzyDocScore(query: string, doc: SavedDocument): FuzzyMatchScoreResult {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return { score: 1, matchedStrands: [], matchedFields: [] };

  const queryTokens = cleanQuery.split(/[\s,.\-_/]+/).filter(Boolean);
  if (queryTokens.length === 0) return { score: 1, matchedStrands: [], matchedFields: [] };

  let totalScore = 0;
  const matchedStrands: string[] = [];
  const matchedFieldsSet = new Set<string>();

  // Full-phrase match bonus (case-insensitive)
  const fullTitle = doc.title.toLowerCase();
  const fullTopic = doc.topic.toLowerCase();
  const fullSubject = doc.subject.toLowerCase();
  const fullClassLevel = doc.classLevel.toLowerCase();
  const fullSubTopic = doc.subTopic?.toLowerCase() || '';

  if (fullTitle.includes(cleanQuery)) {
    totalScore += 50;
    matchedFieldsSet.add('Title');
  }
  if (fullTopic.includes(cleanQuery)) {
    totalScore += 40;
    matchedFieldsSet.add('Topic');
  }
  if (fullSubject.includes(cleanQuery)) {
    totalScore += 30;
    matchedFieldsSet.add('Subject');
  }
  if (fullClassLevel.includes(cleanQuery)) {
    totalScore += 30;
    matchedFieldsSet.add('Grade');
  }
  if (fullSubTopic && fullSubTopic.includes(cleanQuery)) {
    totalScore += 25;
    matchedFieldsSet.add('Subtopic');
  }

  // Tokenize document fields for character-level fuzzy and partial match matching
  const titleTokens = fullTitle.split(/[\s,.\-_/]+/).filter(Boolean);
  const topicTokens = fullTopic.split(/[\s,.\-_/]+/).filter(Boolean);
  const subjectTokens = fullSubject.split(/[\s,.\-_/]+/).filter(Boolean);
  const gradeTokens = fullClassLevel.split(/[\s,.\-_/]+/).filter(Boolean);
  const subTopicTokens = fullSubTopic.split(/[\s,.\-_/]+/).filter(Boolean);
  const tags = (doc.tags || []).map(t => t.toLowerCase());

  // Search in Standard Mappings (representing specific curriculum strands)
  const strandMatches: { code: string; title: string; desc: string }[] = [];
  if (doc.standardMappings) {
    doc.standardMappings.forEach(mapping => {
      strandMatches.push({
        code: mapping.code.toLowerCase(),
        title: mapping.title.toLowerCase(),
        desc: mapping.description?.toLowerCase() || ''
      });
    });
  }

  // Evaluate each query token against document properties
  for (const qToken of queryTokens) {
    let tokenMatched = false;

    // 1. Check title tokens
    for (const dToken of titleTokens) {
      const similarity = getWordSimilarity(qToken, dToken);
      if (similarity >= 0.75) {
        totalScore += 25 * similarity;
        tokenMatched = true;
        matchedFieldsSet.add('Title');
      }
    }

    // 2. Check topic tokens
    for (const dToken of topicTokens) {
      const similarity = getWordSimilarity(qToken, dToken);
      if (similarity >= 0.75) {
        totalScore += 20 * similarity;
        tokenMatched = true;
        matchedFieldsSet.add('Topic');
      }
    }

    // 3. Check subject tokens
    for (const dToken of subjectTokens) {
      const similarity = getWordSimilarity(qToken, dToken);
      if (similarity >= 0.75) {
        totalScore += 15 * similarity;
        tokenMatched = true;
        matchedFieldsSet.add('Subject');
      }
    }

    // 4. Check grade tokens
    for (const dToken of gradeTokens) {
      const similarity = getWordSimilarity(qToken, dToken);
      if (similarity >= 0.75) {
        totalScore += 15 * similarity;
        tokenMatched = true;
        matchedFieldsSet.add('Grade');
      }
    }

    // 5. Check subtopic tokens
    for (const dToken of subTopicTokens) {
      const similarity = getWordSimilarity(qToken, dToken);
      if (similarity >= 0.75) {
        totalScore += 12 * similarity;
        tokenMatched = true;
        matchedFieldsSet.add('Subtopic');
      }
    }

    // 6. Check tags
    for (const tag of tags) {
      if (tag.includes(qToken) || getWordSimilarity(qToken, tag) >= 0.8) {
        totalScore += 10;
        tokenMatched = true;
        matchedFieldsSet.add('Tags');
      }
    }

    // 7. Check standard mappings/curriculum strands
    for (const strand of strandMatches) {
      let strandMatched = false;
      if (strand.code.includes(qToken)) {
        totalScore += 18;
        strandMatched = true;
        tokenMatched = true;
      }
      if (strand.title.includes(qToken) || getWordSimilarity(qToken, strand.title) >= 0.75) {
        totalScore += 15;
        strandMatched = true;
        tokenMatched = true;
      }
      if (strand.desc.includes(qToken)) {
        totalScore += 8;
        strandMatched = true;
        tokenMatched = true;
      }

      if (strandMatched) {
        const readableStrand = `${strand.code.toUpperCase()}: ${strand.title}`;
        if (!matchedStrands.includes(readableStrand)) {
          matchedStrands.push(readableStrand);
        }
        matchedFieldsSet.add('Curriculum Strand');
      }
    }
  }

  return {
    score: totalScore,
    matchedStrands,
    matchedFields: Array.from(matchedFieldsSet)
  };
}

interface DashboardProps {
  documents: SavedDocument[];
  isLoading?: boolean;
  onCreateNew: () => void;
  onOpenDoc: (doc: SavedDocument) => void;
  onLoadDraft?: (draft: DocumentDraft) => void;
  onOpenFlashcards?: () => void;
  onOpenAssessmentGenerator?: () => void;
  onOpenAITutor?: () => void;
  onOpenImageStudio?: () => void;
  onOpenVideoStudio?: () => void;
  onOpenQRMapping?: () => void;
  onOpenAdminPlaybook?: () => void;
  onOpenMagicStudio?: () => void;
  userRole?: string;
  notifications?: AppNotification[];
  setNotifications?: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  youtubeUrl?: string;
}

export default function Dashboard({
  documents,
  isLoading = false,
  onCreateNew,
  onOpenDoc,
  onLoadDraft,
  onOpenFlashcards,
  onOpenAssessmentGenerator,
  onOpenAITutor,
  onOpenImageStudio,
  onOpenVideoStudio,
  onOpenQRMapping,
  onOpenAdminPlaybook,
  onOpenMagicStudio,
  userRole,
  notifications = [],
  setNotifications,
  darkMode,
  onToggleDarkMode,
  youtubeUrl = 'https://www.youtube.com/embed/D7cpYYgr-6E'
}: DashboardProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof darkMode === 'boolean') return darkMode;
    return localStorage.getItem('pedagogical_dark_mode') === 'true';
  });

  useEffect(() => {
    if (typeof darkMode === 'boolean') {
      setIsDark(darkMode);
    }
  }, [darkMode]);

  useEffect(() => {
    const handleDarkChange = () => {
      setIsDark(localStorage.getItem('pedagogical_dark_mode') === 'true');
    };
    window.addEventListener('dark_mode_changed', handleDarkChange);
    return () => window.removeEventListener('dark_mode_changed', handleDarkChange);
  }, []);

  const handleToggleDark = () => {
    if (onToggleDarkMode) {
      onToggleDarkMode();
    } else {
      const next = !isDark;
      setIsDark(next);
      localStorage.setItem('pedagogical_dark_mode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      window.dispatchEvent(new Event('dark_mode_changed'));
    }
  };
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [demoVideoType, setDemoVideoType] = useState<'overview' | 'howto'>('overview');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [search, setSearch] = useState('');

  // Quick-Access Camera QR Scanner State
  const [isQuickScannerOpen, setIsQuickScannerOpen] = useState<boolean>(false);
  const [scannerInputText, setScannerInputText] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [isResolvingScan, setIsResolvingScan] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    type: 'doc' | 'station' | 'socratic' | 'adaptive' | 'custom' | 'none';
    title?: string;
    doc?: SavedDocument;
    stationShortId?: string;
    message?: string;
  } | null>(null);
  
  // Scanned Station Portal Modal State
  const [isStationPortalOpen, setIsStationPortalOpen] = useState<boolean>(false);
  const [scannedPortalShortId, setScannedPortalShortId] = useState<string>('station-1');
  const [isHowToScanOpen, setIsHowToScanOpen] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Camera stream initializer
  useEffect(() => {
    if (!isQuickScannerOpen) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      setIsCameraActive(false);
      setIsTorchOn(false);
      setCameraPermissionError(null);
      return;
    }

    let isSubscribed = true;

    async function startCamera() {
      try {
        setCameraPermissionError(null);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode }
          });
          if (isSubscribed) {
            mediaStreamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              await videoRef.current.play().catch(() => {});
            }
            setIsCameraActive(true);
          } else {
            stream.getTracks().forEach(t => t.stop());
          }
        } else {
          setCameraPermissionError('Camera API is unavailable in this environment.');
        }
      } catch (err: any) {
        console.warn('Camera access denied or unequipped, defaulting to optical scanner simulation:', err);
        if (isSubscribed) {
          setCameraPermissionError(err.message || 'Camera permission pending or unequipped.');
          setIsCameraActive(false);
        }
      }
    }

    startCamera();

    return () => {
      isSubscribed = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isQuickScannerOpen, facingMode]);

  const handleToggleTorch = async () => {
    if (!mediaStreamRef.current) return;
    const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
    if (videoTrack && 'applyConstraints' in videoTrack) {
      try {
        await (videoTrack as any).applyConstraints({
          advanced: [{ torch: !isTorchOn }]
        });
        setIsTorchOn(!isTorchOn);
      } catch (e) {
        console.warn('Torch constraint not supported on device:', e);
      }
    }
  };

  const handleResolveScannedCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    setIsResolvingScan(true);
    setScanResult(null);

    try {
      const lowerCode = code.toLowerCase();

      // 1. Direct match in local documents state
      const matchedDoc = documents.find(d => 
        d.id.toLowerCase() === lowerCode ||
        (d.shortId && d.shortId.toLowerCase() === lowerCode) ||
        d.title.toLowerCase().includes(lowerCode) ||
        d.topic.toLowerCase().includes(lowerCode)
      );

      if (matchedDoc) {
        setScanResult({
          type: 'doc',
          title: matchedDoc.title,
          doc: matchedDoc,
          message: `Document Found: "${matchedDoc.title}" (${matchedDoc.subject} • ${matchedDoc.classLevel})`
        });
        setIsResolvingScan(false);
        return;
      }

      // 2. Try QRMappingService for Scavenger Hunt & Touchpoint resolution
      const resolvedMapping = await QRMappingService.resolveAndIncrementScan(code, 'Dashboard Quick Camera Scanner');
      if (resolvedMapping) {
        setScanResult({
          type: 'station',
          stationShortId: resolvedMapping.shortId,
          title: resolvedMapping.title || 'Scavenger Hunt Station',
          message: `Touchpoint Recognized: "${resolvedMapping.title}" (${resolvedMapping.targetType})`
        });
        setIsResolvingScan(false);
        return;
      }

      // 3. Fallback check for scavenger hunt station patterns
      if (lowerCode.startsWith('station-') || lowerCode.includes('scavenger') || lowerCode.startsWith('hunt-') || lowerCode.startsWith('qr-scav')) {
        setScanResult({
          type: 'station',
          stationShortId: code,
          title: `Scavenger Hunt Station (${code})`,
          message: `Classroom Scavenger Hunt Station Recognized!`
        });
        setIsResolvingScan(false);
        return;
      }

      // 4. Check for Socratic / Adaptive touchpoints
      if (lowerCode.startsWith('soc-')) {
        setScanResult({
          type: 'socratic',
          title: `Socratic AI Tutor Touchpoint (${code})`,
          message: `Scanned Socratic AI Tutor QR Code`
        });
        setIsResolvingScan(false);
        return;
      }

      // Default result fallback
      setScanResult({
        type: 'custom',
        title: code,
        message: `Scanned Code: "${code}". Launch scavenger hunt or open workspace.`
      });
    } catch (err: any) {
      console.error('Error resolving QR code:', err);
    } finally {
      setIsResolvingScan(false);
    }
  };

  const handleExecuteResultAction = () => {
    if (!scanResult) return;

    if (scanResult.type === 'doc' && scanResult.doc) {
      onOpenDoc(scanResult.doc);
      setIsQuickScannerOpen(false);
    } else if (scanResult.type === 'station') {
      setScannedPortalShortId(scanResult.stationShortId || 'station-1');
      setIsStationPortalOpen(true);
      setIsQuickScannerOpen(false);
    } else if (scanResult.type === 'socratic') {
      if (onOpenAITutor) {
        onOpenAITutor();
      } else if (onOpenQRMapping) {
        onOpenQRMapping();
      }
      setIsQuickScannerOpen(false);
    } else {
      if (onOpenQRMapping) {
        onOpenQRMapping();
      }
      setIsQuickScannerOpen(false);
    }
  };
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [curriculumFilter, setCurriculumFilter] = useState<string>('all');
  const [archiveFilter, setArchiveFilter] = useState<string>('active');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today'>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [classLevelFilter, setClassLevelFilter] = useState<string>('all');

  // Folder-based categorization structure state
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [customFolders, setCustomFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('teacher_custom_folders');
      return saved ? JSON.parse(saved) : ['Chemistry', 'Lesson Plans', 'Assessments'];
    } catch (e) {
      return ['Chemistry', 'Lesson Plans', 'Assessments'];
    }
  });
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [folderTabsMode, setFolderTabsMode] = useState<'folders' | 'flat'>('folders');

  // Save custom folders to LocalStorage
  const saveCustomFolders = (foldersList: string[]) => {
    setCustomFolders(foldersList);
    localStorage.setItem('teacher_custom_folders', JSON.stringify(foldersList));
  };

  // Create a new folder
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    if (customFolders.some(f => f.toLowerCase() === name.toLowerCase())) {
      alert('A folder with this name already exists.');
      return;
    }
    const updated = [...customFolders, name];
    saveCustomFolders(updated);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  // Rename a folder (updates all document categories inside it too!)
  const handleRenameFolder = async (oldName: string, newName: string) => {
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedNew === oldName) {
      setEditingFolder(null);
      return;
    }
    if (customFolders.some(f => f.toLowerCase() === trimmedNew.toLowerCase() && f !== oldName)) {
      alert('A folder with this name already exists.');
      return;
    }

    // Update the customFolders list
    const updatedFolders = customFolders.map(f => f === oldName ? trimmedNew : f);
    saveCustomFolders(updatedFolders);

    // Update all documents in Firestore that belonged to oldName
    const docsToUpdate = documents.filter(d => d.category === oldName);
    for (const docObj of docsToUpdate) {
      try {
        await updateDoc(doc(db, 'documents', docObj.id), {
          category: trimmedNew
        });
      } catch (err) {
        console.error(`Error updating document ${docObj.id} category during folder rename:`, err);
      }
    }

    // Update currentFolder if we were viewing it
    if (currentFolder === oldName) {
      setCurrentFolder(trimmedNew);
    }

    setEditingFolder(null);
  };

  // Delete a folder (uncategorizes all documents inside it!)
  const handleDeleteFolder = async (folderName: string) => {
    if (!confirm(`Are you sure you want to delete the folder "${folderName}"? Documents inside will become uncategorized.`)) {
      return;
    }

    // Remove from customFolders
    const updatedFolders = customFolders.filter(f => f !== folderName);
    saveCustomFolders(updatedFolders);

    // Clear category for all documents inside this folder in Firestore
    const docsToUpdate = documents.filter(d => d.category === folderName);
    for (const docObj of docsToUpdate) {
      try {
        await updateDoc(doc(db, 'documents', docObj.id), {
          category: ''
        });
      } catch (err) {
        console.error(`Error uncategorizing document ${docObj.id} during folder deletion:`, err);
      }
    }

    // Reset currentFolder if we were viewing it
    if (currentFolder === folderName) {
      setCurrentFolder(null);
    }
  };

  // Move document to folder
  const handleMoveToFolder = async (docId: string, folderName: string) => {
    try {
      await updateDoc(doc(db, 'documents', docId), {
        category: folderName
      });
    } catch (err) {
      console.error(`Error moving document ${docId} to folder:`, err);
    }
  };

  const allFoldersList = useMemo(() => {
    const docCategories = documents.map(d => d.category).filter(Boolean) as string[];
    return Array.from(new Set([...customFolders, ...docCategories]));
  }, [customFolders, documents]);

  const folderDocCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allFoldersList.forEach(f => {
      counts[f] = 0;
    });
    documents.forEach(doc => {
      if (doc.category) {
        counts[doc.category] = (counts[doc.category] || 0) + 1;
      }
    });
    return counts;
  }, [allFoldersList, documents]);

  const uncategorizedCount = useMemo(() => {
    return documents.filter(d => !d.category).length;
  }, [documents]);

  // Batch curriculum validation state variables
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isBatchValidating, setIsBatchValidating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; step: string } | null>(null);
  const [batchReport, setBatchReport] = useState<{
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    averageScore: number;
    averageScores: {
      learningOutcomes: number;
      competencies: number;
      values: number;
      resources: number;
    };
    documents: Array<{
      id: string;
      title: string;
      subject: string;
      classLevel: string;
      docType: DocumentType;
      success: boolean;
      report?: any;
      error?: string;
    }>;
    topMissingElements: Array<{ element: string; count: number }>;
    totalGapsCount: number;
    notAddressedCount: number;
    partiallyMetCount: number;
  } | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Bulk Archive handler to retire multiple documents
  const handleBulkArchive = async () => {
    if (selectedDocIds.length === 0) return;

    if (userRole === 'Student' || userRole === 'Parent') {
      alert("Permission Denied: Students and parents are restricted from archiving documents.");
      return;
    }

    if (!confirm(`Are you sure you want to archive ${selectedDocIds.length} document(s) and move them to the "Retired" category?`)) {
      return;
    }

    try {
      // Loop through all selected document IDs and update them in Firestore
      for (const id of selectedDocIds) {
        await updateDoc(doc(db, 'documents', id), {
          isArchived: true,
          category: 'Retired'
        });
      }

      // Add "Retired" to the customFolders list if it doesn't already exist
      if (!customFolders.some(f => f.toLowerCase() === 'retired')) {
        saveCustomFolders([...customFolders, 'Retired']);
      }

      // Clear selection
      setSelectedDocIds([]);
      alert(`Successfully archived and moved selected document(s) to the "Retired" category.`);
    } catch (err) {
      console.error('Error during bulk archive:', err);
      alert('An error occurred during bulk archiving. Some documents might not have been archived.');
    }
  };

  // Toggle the isPinned state of a document
  const togglePinDocument = async (docObj: SavedDocument, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    try {
      const newPinnedState = !docObj.isPinned;
      await updateDoc(doc(db, 'documents', docObj.id), {
        isPinned: newPinnedState
      });
    } catch (err) {
      console.error('Error toggling pin state:', err);
      alert('Failed to update the pinned state of the document.');
    }
  };

  // Export documents list to a CSV format for school gradebooks / spreadsheet tools
  const exportDocsToCSV = (docsToExport: SavedDocument[], fileLabel: string) => {
    if (docsToExport.length === 0) {
      alert("No documents selected or available for export.");
      return;
    }

    const headers = [
      'Document ID',
      'Title',
      'Document Type',
      'Curriculum',
      'Subject',
      'Class/Grade Level',
      'Topic',
      'Subtopic',
      'Duration',
      'Folder/Category',
      'Tags',
      'Scheduled Date',
      'Scheduled Time',
      'Date Created',
      'Last Modified',
      'Archived'
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes('\r')) {
        return `"${str}"`;
      }
      return str;
    };

    const rows = docsToExport.map(docObj => [
      docObj.id,
      docObj.title,
      docObj.docType,
      docObj.curriculum,
      docObj.subject,
      docObj.classLevel,
      docObj.topic || '',
      docObj.subTopic || '',
      docObj.duration || '',
      docObj.category || 'Uncategorized',
      (docObj.tags || []).join('; '),
      docObj.scheduledDate || '',
      docObj.scheduledTime || '',
      docObj.createdAt ? new Date(docObj.createdAt).toLocaleString() : '',
      docObj.lastModified ? new Date(docObj.lastModified).toLocaleString() : '',
      docObj.isArchived ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileLabel}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchValidate = async () => {
    if (selectedDocIds.length === 0) return;
    setIsBatchValidating(true);
    setBatchError(null);
    setBatchReport(null);
    setBatchProgress({ current: 0, total: selectedDocIds.length, step: 'Initializing batch quality assurance...' });

    const selectedDocs = documents.filter(d => selectedDocIds.includes(d.id));
    const results: any[] = [];

    try {
      let completedCount = 0;
      const validationPromises = selectedDocs.map(async (docObj) => {
        try {
          // Lookup stored reference standards
          const matchedRequirement = findRequirements(docObj.subject, docObj.classLevel, docObj.topic || docObj.subTopic);

          const response = await fetch('/api/validate-kenyan-curriculum', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              documentId: docObj.id,
              title: docObj.title,
              content: docObj.content,
              subject: docObj.subject,
              classLevel: docObj.classLevel,
              topic: docObj.topic || docObj.subTopic || '',
              language: 'en',
              storedRequirement: matchedRequirement
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Failed with status ${response.status}`);
          }

          const data = await response.json();
          completedCount++;
          setBatchProgress(prev => prev ? { ...prev, current: completedCount, step: `Audited "${docObj.title}"...` } : null);
          return {
            id: docObj.id,
            title: docObj.title,
            subject: docObj.subject,
            classLevel: docObj.classLevel,
            docType: docObj.docType,
            success: true,
            report: data
          };
        } catch (error: any) {
          completedCount++;
          setBatchProgress(prev => prev ? { ...prev, current: completedCount, step: `Failed to audit "${docObj.title}"...` } : null);
          return {
            id: docObj.id,
            title: docObj.title,
            subject: docObj.subject,
            classLevel: docObj.classLevel,
            docType: docObj.docType,
            success: false,
            error: error.message || 'Validation error'
          };
        }
      });

      const outcomes = await Promise.all(validationPromises);
      
      // Calculate summary metrics
      const successfulOutcomes = outcomes.filter(o => o.success && o.report);
      const totalScore = successfulOutcomes.reduce((sum, o) => sum + (o.report.overallScore || 0), 0);
      const avgScore = successfulOutcomes.length > 0 ? Math.round(totalScore / successfulOutcomes.length) : 0;

      const totalLearningOutcomes = successfulOutcomes.reduce((sum, o) => sum + (o.report.scores?.learningOutcomesScore || 0), 0);
      const totalCompetencies = successfulOutcomes.reduce((sum, o) => sum + (o.report.scores?.competenciesScore || 0), 0);
      const totalValues = successfulOutcomes.reduce((sum, o) => sum + (o.report.scores?.valuesScore || 0), 0);
      const totalResources = successfulOutcomes.reduce((sum, o) => sum + (o.report.scores?.resourcesScore || 0), 0);

      const avgScores = {
        learningOutcomes: successfulOutcomes.length > 0 ? Math.round(totalLearningOutcomes / successfulOutcomes.length) : 0,
        competencies: successfulOutcomes.length > 0 ? Math.round(totalCompetencies / successfulOutcomes.length) : 0,
        values: successfulOutcomes.length > 0 ? Math.round(totalValues / successfulOutcomes.length) : 0,
        resources: successfulOutcomes.length > 0 ? Math.round(totalResources / successfulOutcomes.length) : 0,
      };

      // Aggregate gaps and missing elements
      const allGaps = successfulOutcomes.flatMap(o => (o.report.gapAnalysis || []).map((g: any) => ({ ...g, docTitle: o.title })));
      const notAddressedGaps = allGaps.filter(g => g.documentStatus === 'Not Addressed');
      const partiallyMetGaps = allGaps.filter(g => g.documentStatus === 'Partially Met');

      const allMissingElements = successfulOutcomes.flatMap(o => o.report.missingElements || []);
      const elementFrequencies: Record<string, number> = {};
      allMissingElements.forEach(el => {
        elementFrequencies[el] = (elementFrequencies[el] || 0) + 1;
      });
      const topMissingElements = Object.entries(elementFrequencies)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([element, count]) => ({ element, count }));

      setBatchReport({
        totalProcessed: selectedDocs.length,
        successCount: successfulOutcomes.length,
        failedCount: selectedDocs.length - successfulOutcomes.length,
        averageScore: avgScore,
        averageScores: avgScores,
        documents: outcomes,
        topMissingElements,
        totalGapsCount: allGaps.length,
        notAddressedCount: notAddressedGaps.length,
        partiallyMetCount: partiallyMetGaps.length,
      });
    } catch (err: any) {
      console.error('Batch validation outer error:', err);
      setBatchError(err.message || 'An error occurred during batch curriculum validation.');
    } finally {
      setIsBatchValidating(false);
      setBatchProgress(null);
    }
  };

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);

  // Auto-Categorization setting state
  const [autoCategorization, setAutoCategorization] = useState<boolean>(() => {
    return localStorage.getItem('pedagogical_auto_categorization') !== 'false';
  });

  useEffect(() => {
    const handleAutoCategorizationChanged = () => {
      setAutoCategorization(localStorage.getItem('pedagogical_auto_categorization') !== 'false');
    };
    window.addEventListener('auto_categorization_changed', handleAutoCategorizationChanged);
    return () => {
      window.removeEventListener('auto_categorization_changed', handleAutoCategorizationChanged);
    };
  }, []);

  const handleToggleAutoCategorization = () => {
    const nextVal = !autoCategorization;
    setAutoCategorization(nextVal);
    localStorage.setItem('pedagogical_auto_categorization', nextVal ? 'true' : 'false');
    window.dispatchEvent(new Event('auto_categorization_changed'));
  };

  useEffect(() => {
    const saved = localStorage.getItem('teacher_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Error reading recent searches:', e);
      }
    }
  }, []);

  const saveSearchTerm = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem('teacher_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleQuickRerun = (term: string) => {
    if (!onLoadDraft) return;

    // Build a highly contextual draft based on existing filters to pre-populate generation form
    const draft: DocumentDraft = {
      id: `rerun-${Date.now()}`,
      userId: profile?.uid || 'anonymous',
      curriculum: (curriculumFilter === 'all' ? 'cbc' : curriculumFilter) as any,
      docType: (docTypeFilter === 'all' ? 'lesson-plan' : docTypeFilter) as any,
      subject: categoryFilter === 'all' ? 'Mathematics' : categoryFilter,
      customSubject: '',
      classLevel: 'Grade 7', // Reasonable mid-level standard default
      topic: term,
      subTopic: '',
      duration: '40 minutes',
      extraPrompt: 'Generate high-quality comprehensive resources for this curriculum topic.',
      explainLikeMasterTeacher: true,
      askMentor: false,
      generateVocabulary: true,
      generateDifferentiated: true,
      generateParental: false,
      generateDiagram: false,
      lastSaved: new Date().toISOString(),
      draftName: `Re-run: ${term}`,
      category: categoryFilter === 'all' ? 'Mathematics' : categoryFilter,
      lessonLayout: 'default'
    };

    onLoadDraft(draft);
  };

  const isAnyFilterActive =
    search !== '' ||
    docTypeFilter !== 'all' ||
    curriculumFilter !== 'all' ||
    archiveFilter !== 'active' ||
    selectedTagFilter !== 'all' ||
    categoryFilter !== 'all' ||
    timeFilter !== 'all' ||
    topicFilter !== 'all' ||
    subjectFilter !== 'all' ||
    classLevelFilter !== 'all';

  const { user, profile } = useAuth();
  const [drafts, setDrafts] = useState<DocumentDraft[]>([]);

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
        console.error('Error fetching drafts on dashboard:', err);
      }
    );

    return unsubscribe;
  }, [profile?.uid]);

  const getDocTypeColor = (type: DocumentType) => {
    switch (type) {
      case 'lesson-plan':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Lesson Plan' };
      case 'scheme-of-work':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-100', label: 'Scheme of Work' };
      case 'lesson-notes':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Lesson Notes' };
      case 'lesson-notes-classic':
        return { bg: 'bg-orange-50 text-orange-700 border-orange-100', label: 'Lesson Notes (Classic)' };
      case 'worksheet':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-100', label: 'Worksheet & Key' };
      case 'formative-assessment':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-100', label: 'Formative Assess' };
      case 'summative-assessment':
        return { bg: 'bg-violet-50 text-violet-700 border-violet-100', label: 'Summative Exam' };
      case 'pedagogy-advisor':
        return { bg: 'bg-pink-50 text-pink-700 border-pink-100', label: 'Pedagogy Advisor' };
      default:
        return { bg: 'bg-slate-50 text-slate-700 border-slate-100', label: 'General' };
    }
  };

  const getDocTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'lesson-plan':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'scheme-of-work':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'lesson-notes':
        return <BookOpen className="w-4 h-4 text-amber-600" />;
      case 'lesson-notes-classic':
        return <BookOpen className="w-4 h-4 text-orange-600" />;
      case 'worksheet':
        return <ClipboardCheck className="w-4 h-4 text-purple-600" />;
      case 'formative-assessment':
        return <Layers className="w-4 h-4 text-indigo-600" />;
      case 'summative-assessment':
        return <ClipboardCheck className="w-4 h-4 text-violet-600" />;
      case 'pedagogy-advisor':
        return <Lightbulb className="w-4 h-4 text-pink-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-600" />;
    }
  };

  // Count how many documents were created/added today
  const addedTodayCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return documents.filter((doc) => {
      if (!doc.createdAt && !doc.lastModified) return false;
      const createdDate = new Date(doc.createdAt || doc.lastModified).toDateString();
      return createdDate === todayStr;
    }).length;
  }, [documents]);

  // Client-side caching of search results to prevent repetitive heavy array filtering
  const filterCache = useRef<Record<string, SavedDocument[]>>({});

  // Invalidate cache if documents or other filters change
  useEffect(() => {
    filterCache.current = {};
  }, [documents, docTypeFilter, curriculumFilter, archiveFilter, selectedTagFilter, categoryFilter, timeFilter, topicFilter, subjectFilter, classLevelFilter]);

  // Filter logic memoized and cached for optimal performance with advanced fuzzy ranking
  const filteredDocs = useMemo(() => {
    const cacheKey = search.toLowerCase().trim();
    if (filterCache.current[cacheKey]) {
      return filterCache.current[cacheKey];
    }

    let result = documents.map((doc) => {
      const fuzzyResult = calculateFuzzyDocScore(search, doc);
      return {
        doc,
        fuzzyResult,
        matchesDocType: docTypeFilter === 'all' || doc.docType === docTypeFilter,
        matchesCurriculum: curriculumFilter === 'all' || doc.curriculum === curriculumFilter,
        matchesArchive: archiveFilter === 'all' || 
                        (archiveFilter === 'active' && !doc.isArchived) || 
                        (archiveFilter === 'archived' && !!doc.isArchived),
        matchesTag: selectedTagFilter === 'all' || (doc.tags && doc.tags.includes(selectedTagFilter)),
        matchesCategory: categoryFilter === 'all' || doc.category === categoryFilter,
        matchesTopic: topicFilter === 'all' || doc.topic === topicFilter,
        matchesSubject: subjectFilter === 'all' || doc.subject === subjectFilter,
        matchesClassLevel: classLevelFilter === 'all' || doc.classLevel === classLevelFilter,
        matchesTime: timeFilter === 'all' || (() => {
          if (!doc.createdAt && !doc.lastModified) return false;
          const createdDate = new Date(doc.createdAt || doc.lastModified).toDateString();
          const todayStr = new Date().toDateString();
          return createdDate === todayStr;
        })()
      };
    });

    // If search exists, must have a score > 0
    if (search.trim()) {
      result = result.filter(item => item.fuzzyResult.score > 0);
    }

    // Apply all standard filters
    result = result.filter(item => 
      item.matchesDocType && 
      item.matchesCurriculum && 
      item.matchesArchive && 
      item.matchesTag && 
      item.matchesCategory && 
      item.matchesTopic &&
      item.matchesSubject &&
      item.matchesClassLevel &&
      item.matchesTime
    );

    // If search exists, sort by fuzzy score descending
    if (search.trim()) {
      result.sort((a, b) => b.fuzzyResult.score - a.fuzzyResult.score);
    }

    const finalDocs = result.map(item => item.doc);
    filterCache.current[cacheKey] = finalDocs;
    return finalDocs;
  }, [documents, search, docTypeFilter, curriculumFilter, archiveFilter, selectedTagFilter, categoryFilter, timeFilter, topicFilter, subjectFilter, classLevelFilter]);

  const shownDocsInFolder = useMemo(() => {
    if (folderTabsMode === 'flat' || currentFolder === null) {
      return filteredDocs;
    }
    if (currentFolder === '_uncategorized') {
      return filteredDocs.filter((d) => !d.category);
    }
    return filteredDocs.filter((d) => d.category === currentFolder);
  }, [filteredDocs, folderTabsMode, currentFolder]);

  // Sorting state variables
  const [sortBy, setSortBy] = useState<'lastModified' | 'title' | 'subject'>('lastModified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [listLayout, setListLayout] = useState<'grid' | 'table'>('table');

  const sortedDocs = useMemo(() => {
    return [...shownDocsInFolder].sort((a, b) => {
      // Pinned documents always go to the top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      let valA: string = '';
      let valB: string = '';

      if (sortBy === 'lastModified') {
        valA = a.lastModified || a.createdAt || '';
        valB = b.lastModified || b.createdAt || '';
      } else if (sortBy === 'title') {
        valA = (a.title || '').toLowerCase();
        valB = (b.title || '').toLowerCase();
      } else if (sortBy === 'subject') {
        valA = (a.subject || '').toLowerCase();
        valB = (b.subject || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [shownDocsInFolder, sortBy, sortOrder]);

  const handleSort = (field: 'lastModified' | 'title' | 'subject') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: 'lastModified' | 'title' | 'subject') => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0 inline" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-[#5f6f52] shrink-0 inline" />
      : <ArrowDown className="w-3 h-3 text-[#5f6f52] shrink-0 inline" />;
  };

  // Generate predictive suggestions based on current search input
  const predictiveSuggestions = useMemo(() => {
    const queryStr = search.trim().toLowerCase();
    if (!queryStr) return null;

    // 1. Find matching subjects
    const uniqueSubjects = Array.from(new Set(documents.map(d => d.subject).filter(Boolean)));
    const matchingSubjects = uniqueSubjects.filter(sub => {
      const sim = getWordSimilarity(queryStr, sub);
      return sim >= 0.6 || sub.toLowerCase().includes(queryStr);
    }).slice(0, 3);

    // 2. Find matching grades
    const uniqueGrades = Array.from(new Set(documents.map(d => d.classLevel).filter(Boolean)));
    const matchingGrades = uniqueGrades.filter(g => {
      const sim = getWordSimilarity(queryStr, g);
      return sim >= 0.6 || g.toLowerCase().includes(queryStr);
    }).slice(0, 3);

    // 3. Find matching curriculum strands from standard mappings
    const uniqueStrands: { code: string; title: string; docCount: number }[] = [];
    const strandKeys = new Set<string>();
    documents.forEach(doc => {
      if (doc.standardMappings) {
        doc.standardMappings.forEach(mapping => {
          const key = `${mapping.code}::${mapping.title}`;
          if (!strandKeys.has(key)) {
            strandKeys.add(key);
            uniqueStrands.push({
              code: mapping.code,
              title: mapping.title,
              docCount: 1
            });
          } else {
            const existing = uniqueStrands.find(s => s.code === mapping.code && s.title === mapping.title);
            if (existing) existing.docCount++;
          }
        });
      }
    });

    const matchingStrands = uniqueStrands.filter(s => {
      const codeMatch = s.code.toLowerCase().includes(queryStr);
      const titleMatch = s.title.toLowerCase().includes(queryStr);
      const fuzzyCode = getWordSimilarity(queryStr, s.code) >= 0.7;
      const fuzzyTitle = getWordSimilarity(queryStr, s.title) >= 0.7;
      return codeMatch || titleMatch || fuzzyCode || fuzzyTitle;
    }).slice(0, 3);

    // 4. Find matching documents (up to 4 highest-scoring ones)
    const scoredDocs = documents.map(doc => ({
      doc,
      result: calculateFuzzyDocScore(search, doc)
    }))
    .filter(item => item.result.score > 0)
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, 4);

    // 5. Typo correction suggestion ("Did you mean...?")
    // Find a word in titles/topics with similarity between 0.75 and 0.98 (to avoid recommending exact matches)
    let typoSuggestion: string | null = null;
    const queryWords = queryStr.split(/\s+/).filter(Boolean);
    if (queryWords.length === 1) {
      const singleWord = queryWords[0];
      const docWords = Array.from(new Set(
        documents.flatMap(d => {
          const titleWords = d.title.split(/[\s,.\-_/]+/).filter(Boolean);
          const topicWords = d.topic.split(/[\s,.\-_/]+/).filter(Boolean);
          return [...titleWords, ...topicWords];
        }).map(w => w.toLowerCase()).filter(w => w.length > 3)
      ));

      let bestSim = 0.75;
      let bestWord = '';
      for (const dWord of docWords) {
        if (dWord !== singleWord) {
          const sim = getWordSimilarity(singleWord, dWord);
          if (sim > bestSim && sim < 0.99) {
            bestSim = sim;
            bestWord = dWord;
          }
        }
      }
      if (bestWord) {
        typoSuggestion = bestWord;
      }
    }

    return {
      matchingSubjects,
      matchingGrades,
      matchingStrands,
      scoredDocs,
      typoSuggestion
    };
  }, [documents, search]);

  // Get all unique tags from documents memoized
  const allTags = useMemo(() => {
    return Array.from(
      new Set(
        documents.flatMap((doc) => doc.tags || [])
      )
    ).filter(Boolean);
  }, [documents]);

  // Calculate counts for each tag memoized
  const tagCounts = useMemo(() => {
    return documents.reduce((acc, doc) => {
      if (doc.tags) {
        doc.tags.forEach((t) => {
          acc[t] = (acc[t] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);
  }, [documents]);

  // Get all unique categories from documents memoized
  const allCategories = useMemo(() => {
    return Array.from(
      new Set(
        documents.map((doc) => doc.category).filter(Boolean)
      )
    ).filter(Boolean);
  }, [documents]);

  // Get all unique topics from documents memoized
  const allTopics = useMemo(() => {
    return Array.from(
      new Set(
        documents.map((doc) => doc.topic).filter(Boolean)
      )
    ).sort();
  }, [documents]);

  // Get all unique subjects from documents memoized
  const allSubjects = useMemo(() => {
    return Array.from(
      new Set(
        documents.map((doc) => doc.subject).filter(Boolean)
      )
    ).sort();
  }, [documents]);

  // Get all unique class levels from documents memoized
  const allClassLevels = useMemo(() => {
    return Array.from(
      new Set(
        documents.map((doc) => doc.classLevel).filter(Boolean)
      )
    ).sort();
  }, [documents]);

  // Calculate quick stats memoized
  const totalDocs = documents.length;
  const plansCount = useMemo(() => {
    return documents.filter((d) => d.docType === 'lesson-plan').length;
  }, [documents]);
  const cbcCount = useMemo(() => {
    return documents.filter((d) => d.curriculum === 'cbc').length;
  }, [documents]);
  const standardCount = useMemo(() => {
    return documents.filter((d) => d.curriculum === 'standard').length;
  }, [documents]);

  const isAdmin = profile?.role === 'Administrator' || userRole === 'Administrator' || profile?.role === 'developer';

  // Calculate Document Usage frequency by subject over last 30 days for Admin
  const adminChartData = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const counts: Record<string, number> = {};
    documents.forEach((doc) => {
      if (!doc.createdAt) return;
      const createdDate = new Date(doc.createdAt);
      if (createdDate >= thirtyDaysAgo) {
        const subj = doc.subject || 'General / Other';
        counts[subj] = (counts[subj] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([subject, count]) => ({
        subject,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [documents]);

  // Active Tasks checklist state
  const [tasks, setTasks] = useState<{ id: string; text: string; completed: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem('teacher_active_tasks');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading tasks:', e);
    }
    return [
      { id: 'task-1', text: 'Grade 7 Mathematics assessments', completed: false },
      { id: 'task-2', text: 'Generate lesson notes for Science tomorrow', completed: false },
      { id: 'task-3', text: 'Align curriculum mapping for PP1 Agriculture', completed: true },
      { id: 'task-4', text: 'Prepare worksheets and grading keys for English', completed: false },
      { id: 'task-5', text: 'Review feedback on Pedagogy suggestions', completed: false }
    ];
  });

  const [newTaskText, setNewTaskText] = useState('');

  const saveTasks = (newTasks: typeof tasks) => {
    setTasks(newTasks);
    localStorage.setItem('teacher_active_tasks', JSON.stringify(newTasks));
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    const newTask = {
      id: `task-${Date.now()}`,
      text: trimmed,
      completed: false
    };
    saveTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  // Memoized upcoming scheduled lessons from documents list
  const upcomingScheduledLessons = useMemo(() => {
    const now = new Date();
    return documents
      .filter((d) => d.scheduledDate)
      .map((d) => {
        try {
          const [year, month, day] = d.scheduledDate!.split('-').map(Number);
          const [hours, minutes] = (d.scheduledTime || '00:00').split(':').map(Number);
          const scheduledDateTime = new Date(year, month - 1, day, hours, minutes);
          return { ...d, scheduledDateTime };
        } catch (e) {
          return null;
        }
      })
      .filter((d): d is any => d !== null && d.scheduledDateTime >= now)
      .sort((a, b) => a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime())
      .slice(0, 4);
  }, [documents]);

  // Memoized active unread alert notifications
  const activeAlerts = useMemo(() => {
    return notifications.filter((n) => !n.read).slice(0, 3);
  }, [notifications]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: '🌅' };
    if (hour < 17) return { text: 'Good afternoon', icon: '☀️' };
    return { text: 'Good evening', icon: '🌙' };
  };
  const greeting = getGreeting();

  return (
    <div className="space-y-8 animate-fadeIn text-slate-800 dark:text-slate-100">
      {/* Top Header & Greeting Row matching Right Side Image */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{greeting.text}, {resolveDisplayName(profile?.displayName, profile?.email || user?.email, user?.displayName || 'Godfrey')}!</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            Here's what's happening in your teaching workspace today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Home Screen Dark / Light Mode Toggle Button */}
          <button
            onClick={handleToggleDark}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-2 active:scale-95"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Dark Mode"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsQuickScannerOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-100 dark:hover:bg-amber-900/80 border border-amber-300/80 dark:border-amber-700/80 shadow-xs transition cursor-pointer flex items-center gap-2 group active:scale-95"
            title="Scan QR tag from camera feed"
          >
            <div className="relative">
              <Camera className="w-4 h-4 text-amber-700 dark:text-amber-400 group-hover:scale-110 transition" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
            <span>Quick Scan QR</span>
          </button>

          {isAdmin && onOpenAdminPlaybook && (
            <button
              onClick={onOpenAdminPlaybook}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-sm transition cursor-pointer flex items-center gap-2 active:scale-95"
              title="Open Admin Playbook & System Directory"
            >
              <Shield className="w-4 h-4 text-white" />
              <span>Admin Playbook</span>
            </button>
          )}

          <button
            onClick={() => alert("Customize Dashboard Home layout options.")}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Customize Home</span>
          </button>
        </div>
      </div>

      {/* EDU NEXUS DEMO & HOW-TO VIDEO HUB BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 z-10 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Play className="w-3.5 h-3.5 fill-emerald-400" />
            <span>Interactive Video Walkthroughs</span>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-serif font-black text-white">
            See EduNexus Platform & Pedagogical Features in Action
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Watch our platform demo to explore automated lesson planning and assessments, or click 'How-To' to dive deep into CBC alignment, 5E inquiry models, Socratic tutoring, and UDL accommodations.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1 text-[11px] text-slate-300 font-medium">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> CBC Mapping</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 5E Inquiry Models</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Socratic AI Tutors</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> UDL Accommodations</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full md:w-auto shrink-0">
          {/* Watch Main Demo Video Button */}
          <button
            onClick={() => {
              setDemoVideoType('overview');
              setShowDemoModal(true);
            }}
            className="w-full sm:w-auto px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition cursor-pointer flex items-center justify-center gap-2 group"
          >
            <Play className="w-4 h-4 fill-slate-950 group-hover:scale-110 transition" />
            <span>Watch Demo Video</span>
          </button>

          {/* Watch Additional How-To Video Button */}
          <button
            onClick={() => {
              setDemoVideoType('howto');
              setShowDemoModal(true);
            }}
            className="w-full sm:w-auto px-5 py-3.5 bg-slate-800/90 hover:bg-slate-700/90 text-white font-bold text-xs sm:text-sm rounded-2xl border border-emerald-500/40 shadow-md transition cursor-pointer flex items-center justify-center gap-2 group"
          >
            <BookOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
            <span>Watch How-To Pedagogical Video</span>
          </button>
        </div>
      </div>

      {/* QUICK ACTION CARDS (8 Cards Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        
        {/* Card 0: Lower Primary Magic Objects */}
        <div 
          onClick={onOpenMagicStudio}
          className="bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-purple-500/10 hover:from-amber-500/20 hover:to-purple-500/20 border border-amber-300/80 hover:border-amber-400 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between group space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
            </div>
            <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 rounded-full shadow-2xs">
              Lower School
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-purple-700 transition">
              Magic Objects ✨
            </h3>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight mt-1 font-semibold">
              Click objects to generate • Zero prompt typing!
            </p>
          </div>
        </div>

        {/* Card 1: Create Lesson Plan */}
        <div 
          onClick={onCreateNew}
          className="bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100/80 hover:border-emerald-300 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm flex flex-col justify-between group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition">Create Lesson Plan</h3>
            <p className="text-[11px] text-slate-500 leading-tight mt-1">Use AI to create lesson in seconds</p>
          </div>
        </div>

        {/* Card 2: Quick QR Scanner */}
        <div 
          onClick={() => setIsQuickScannerOpen(true)}
          className="bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 hover:border-amber-400 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm flex flex-col justify-between group space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 rounded-full">
              Live
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-amber-800 transition">Quick QR Scanner</h3>
            <p className="text-[11px] text-slate-500 leading-tight mt-1">Scan code to launch doc or hunt</p>
          </div>
        </div>

        {/* Card 3: Generate Assessment */}
        <div 
          onClick={onOpenAssessmentGenerator}
          className="bg-purple-50/60 hover:bg-purple-50 border border-purple-100/80 hover:border-purple-300 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm flex flex-col justify-between group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-purple-700 transition">Generate Assessment</h3>
            <p className="text-[11px] text-slate-500 leading-tight mt-1">Create quizzes, exams & more</p>
          </div>
        </div>

        {/* Card 3: Build AI Tutor */}
        <div 
          onClick={onOpenAITutor}
          className="bg-blue-50/60 hover:bg-blue-50 border border-blue-100/80 hover:border-blue-300 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm flex flex-col justify-between group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 transition">Build AI Tutor</h3>
            <p className="text-[11px] text-slate-500 leading-tight mt-1">Create your own tutoring assistant</p>
          </div>
        </div>

        {/* Card 4: Image Studio */}
        <div 
          onClick={onOpenImageStudio}
          className="bg-amber-50/60 hover:bg-amber-50 border border-amber-100/80 hover:border-amber-300 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm flex flex-col justify-between group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-amber-700 transition">Image Studio</h3>
            <p className="text-[11px] text-slate-500 leading-tight mt-1">Generate educational images</p>
          </div>
        </div>

        {/* Card 5: Video Studio */}
        <div 
          onClick={onOpenVideoStudio}
          className="bg-rose-50/60 hover:bg-rose-50 border border-rose-100/80 hover:border-rose-300 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm flex flex-col justify-between group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-rose-700 transition">Video Studio</h3>
            <p className="text-[11px] text-slate-500 leading-tight mt-1">Create videos for your lessons</p>
          </div>
        </div>

        {/* Card 6: Study Notes */}
        <div 
          onClick={onCreateNew}
          className="bg-teal-50/60 hover:bg-teal-50 border border-teal-100/80 hover:border-teal-300 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm flex flex-col justify-between group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-teal-700 transition">Study Notes</h3>
            <p className="text-[11px] text-slate-500 leading-tight mt-1">Generate notes & handwritten style</p>
          </div>
        </div>

      </div>

      {/* DEDICATED WHATSAPP AI ASSISTANT & SCANNABLE QR CODE SECTION */}
      <WhatsAppDashboardWidget userRole={userRole} />

      {/* MIDDLE ROW (Continue Working & AI Teaching Assistant) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Continue Working Progress List */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-sm text-slate-900">Continue Working</h2>
            <button onClick={() => setArchiveFilter('active')} className="text-xs font-bold text-[#5f6f52] hover:underline flex items-center gap-1 cursor-pointer">
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {[
              { id: '1', title: 'Form 3 Physics – Motion', type: 'Lesson Plan', color: 'bg-emerald-500', progress: 66, icon: BookOpen },
              { id: '2', title: 'Mathematics End-Term Assessment', type: 'Assessment', color: 'bg-purple-500', progress: 90, icon: ClipboardCheck },
              { id: '3', title: 'Biology – Photosynthesis', type: 'Study Notes', color: 'bg-teal-500', progress: 40, icon: FileText },
              { id: '4', title: 'Chemistry – Acids & Bases', type: 'Video Project', color: 'bg-rose-500', progress: 20, icon: Video }
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <div key={item.id} className="p-3 bg-slate-50/60 hover:bg-slate-100/80 border border-slate-100 rounded-2xl transition flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${item.color} text-white flex items-center justify-center shrink-0 shadow-2xs`}>
                      <ItemIcon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{item.type}</p>
                    </div>
                  </div>

                  <div className="w-32 sm:w-40 space-y-1 shrink-0">
                    <div className="flex justify-end text-[10px] font-bold text-slate-500">
                      <span>{item.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className={`${item.color} h-1.5 rounded-full`} style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Teaching Assistant Box */}
        <div className="lg:col-span-5 bg-gradient-to-b from-emerald-50/30 to-white dark:from-slate-800/80 dark:to-slate-800 rounded-3xl border border-emerald-100/80 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">AI Teaching Assistant</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Ask anything about your lessons, students or resources.</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {[
                'Generate a lesson plan for Form 3 Physics',
                'Create an assessment on Algebra',
                'Explain photosynthesis in simple terms'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => onOpenAITutor && onOpenAITutor()}
                  className="w-full text-left px-3 py-2 rounded-xl bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-200 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-300 transition cursor-pointer shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask me anything..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 shadow-2xs"
            />
            <button
              onClick={() => onOpenAITutor && onOpenAITutor()}
              className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* THIRD ROW (Today's Classes, Class Overview, Recent Resources) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Today's Classes */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900">Today's Classes</h3>
            <span className="text-xs font-bold text-emerald-700 cursor-pointer hover:underline">View schedule →</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400">08:00 AM</span>
                <h4 className="font-extrabold text-xs text-slate-800">Form 3 Physics</h4>
                <p className="text-[10px] text-slate-500">Motion and Forces</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold uppercase">Live</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400">10:00 AM</span>
                <h4 className="font-extrabold text-xs text-slate-800">Form 2 Mathematics</h4>
                <p className="text-[10px] text-slate-500">Linear Equations</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[9px] font-extrabold uppercase">Upcoming</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400">12:00 PM</span>
                <h4 className="font-extrabold text-xs text-slate-800">Form 4 Chemistry</h4>
                <p className="text-[10px] text-slate-500">Organic Compounds</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[9px] font-extrabold uppercase">Upcoming</span>
            </div>
          </div>
        </div>

        {/* Workspace & Curriculum Overview Stats */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900">Workspace & Curriculum Overview</h3>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Pre-Launch Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-lg font-black text-slate-900">{totalDocs}</span>
                <p className="text-[10px] font-medium text-slate-500">Saved Documents</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-lg font-black text-slate-900">{plansCount}</span>
                <p className="text-[10px] font-medium text-slate-500">Lesson Plans</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-lg font-black text-slate-900">{cbcCount}</span>
                <p className="text-[10px] font-medium text-slate-500">CBC Schemes</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-lg font-black text-slate-900">100%</span>
                <p className="text-[10px] font-medium text-slate-500">Launch Ready</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Resources */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900">Recent Resources</h3>
            <span className="text-xs font-bold text-slate-500 cursor-pointer hover:underline">View all →</span>
          </div>

          <div className="space-y-2.5">
            {[
              { name: 'Motion Lesson Notes', meta: 'PDF • 2.4 MB • Today', color: 'text-red-500' },
              { name: 'Algebra Assessment', meta: 'DOCX • 1.1 MB • Yesterday', color: 'text-blue-500' },
              { name: 'Photosynthesis Slides', meta: 'PPTX • 5.2 MB • 2 days ago', color: 'text-emerald-500' },
              { name: 'Acids & Bases Video', meta: 'MP4 • 12.4 MB • 3 days ago', color: 'text-purple-500' },
            ].map((res, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <FileText className={`w-4 h-4 ${res.color}`} />
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800">{res.name}</h4>
                    <p className="text-[10px] text-slate-400">{res.meta}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* FOURTH ROW (Learner Performance Overview Charts) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Learner Performance Overview</h3>
            <p className="text-xs text-slate-500">Class average competency trajectory over time</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">This week →</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Weekly Performance Line Chart */}
          <div className="lg:col-span-8 h-56 w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { day: 'Mon', score: 62 },
                  { day: 'Tue', score: 78 },
                  { day: 'Wed', score: 71 },
                  { day: 'Thu', score: 85 },
                  { day: 'Fri', score: 82 },
                  { day: 'Sat', score: 88 },
                  { day: 'Sun', score: 87 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-slate-50 animate-pulse rounded-xl" />
            )}
          </div>

          {/* Average Progress Donut & Legend */}
          <div className="lg:col-span-4 border-l border-slate-100 pl-6 flex flex-col items-center space-y-4">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-emerald-500/20 border-t-emerald-500">
              <div className="text-center">
                <span className="text-2xl font-black text-slate-900 block">87%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Class Progress</span>
              </div>
            </div>

            <div className="w-full space-y-1.5 text-xs font-medium">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Excellent (80–100%)</span>
                <span className="font-bold text-slate-800">22</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full bg-teal-500" /> Good (60–79%)</span>
                <span className="font-bold text-slate-800">15</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full bg-amber-500" /> Average (40–59%)</span>
                <span className="font-bold text-slate-800">4</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full bg-rose-500" /> Needs Improvement (0–39%)</span>
                <span className="font-bold text-slate-800">1</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* FIFTH ROW (Smart Recommendations) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Smart Recommendations</h3>
            <p className="text-xs text-slate-500">Based on your classes and students</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 cursor-pointer hover:underline">View all recommendations →</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="font-extrabold text-xs text-slate-900">Revise Motion Lesson</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">Students are struggling with Newton's Laws</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <h4 className="font-extrabold text-xs text-slate-900">Generate Quiz</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">Create a quick quiz for Form 3 Physics</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-extrabold text-xs text-slate-900">Send Reminder</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">3 assignments are due within 3 days</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="font-extrabold text-xs text-slate-900">New Resource</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">AI generated notes on Electricity and Circuits</p>
          </div>
        </div>
      </div>


      {/* Admin Document Usage Chart */}
      {isAdmin && (
        <div id="admin-document-usage-chart" className="bg-white rounded-3xl border border-[#e5e1da] shadow-sm p-6 space-y-4 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#5f6f52]/10 rounded-lg text-[#5f6f52] inline-block">
                  <BarChart3 className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                  Document Usage Analytics (Last 30 Days)
                </h3>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#5f6f52] bg-[#5f6f52]/10 px-2 py-0.5 rounded-full">
                  Admin Control
                </span>
              </div>
              <p className="text-xs text-slate-500">
                System-wide frequency of generated curriculum documents grouped by subject area.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                Active Subjects: <strong className="text-[#5f6f52] font-extrabold">{adminChartData.length}</strong>
              </span>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                Total Documents: <strong className="text-blue-600 font-extrabold">{adminChartData.reduce((acc, curr) => acc + curr.count, 0)}</strong>
              </span>
            </div>
          </div>

          {adminChartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/40 rounded-2xl border border-dashed border-slate-200">
              <BookOpen className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
              <p className="text-xs font-bold text-slate-700">No Document Activity</p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                There are no curriculum documents generated across any subjects in the last 30 days. Newly generated documents will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="h-80 w-full pt-4">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="subject" 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={{ stroke: '#e2e8f0' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={{ stroke: '#e2e8f0' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        color: '#f8fafc'
                      }}
                      itemStyle={{ color: '#f8fafc', fontSize: '11px', fontWeight: 'bold' }}
                      labelStyle={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                      cursor={{ fill: '#f8fafc', opacity: 0.05 }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {adminChartData.map((entry, index) => {
                        const colors = [
                          '#5f6f52', // primary theme color
                          '#3b82f6', // blue
                          '#8b5cf6', // purple
                          '#ec4899', // pink
                          '#f59e0b', // amber
                          '#10b981', // emerald
                          '#6366f1', // indigo
                          '#14b8a6', // teal
                          '#f97316', // orange
                          '#a9b388'  // secondary theme color
                        ];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-slate-50 animate-pulse rounded-xl" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Saved Drafts / Form Progress Section */}
      {drafts.length > 0 && userRole !== 'Student' && (
        <div className="bg-[#fdfbf7] border-2 border-dashed border-[#e5e1da] rounded-3xl p-6 shadow-inner space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-extrabold text-[#5f6f52] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#5f6f52]" /> Unfinished Material Drafts
              </h3>
              <p className="text-xs text-slate-500">
                You have {drafts.length} saved progress drafts. Click any draft to load and continue.
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full animate-pulse shrink-0">
              In-Progress
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {drafts.map((dr) => (
              <div
                key={dr.id}
                onClick={() => onLoadDraft?.(dr)}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#5f6f52] hover:shadow-md cursor-pointer transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#5f6f52]/10 text-[#5f6f52] border border-[#5f6f52]/10">
                      {dr.docType.replace('-', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Saved {new Date(dr.lastSaved).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-[#5f6f52] transition-colors leading-tight">
                    {dr.draftName}
                  </h4>

                  <div className="text-[11px] text-slate-500 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                    <p className="truncate flex items-center gap-1.5">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">Subject:</span> 
                      <span className="text-slate-700 font-semibold">{dr.subject === 'Other' ? dr.customSubject : dr.subject}</span>
                    </p>
                    <p className="truncate flex items-center gap-1.5">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">Topic:</span> 
                      <span className="text-slate-700 font-semibold">{dr.topic}</span>
                    </p>
                    <p className="truncate flex items-center gap-1.5">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">Level:</span> 
                      <span className="text-slate-700 font-semibold">{dr.classLevel}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-[#5f6f52] group-hover:underline flex items-center gap-1">
                    Resume Editing <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>

                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm("Are you sure you want to delete this draft?")) {
                        await deleteDoc(doc(db, 'drafts', dr.id));
                      }
                    }}
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 transition-colors"
                    title="Delete Draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Card-based Grid Layout with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Columns (col-span 2) - Documents Explorer Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[#e5e1da] dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Modern Filter Shelf */}
            <div className="p-6 border-b border-[#e5e1da] dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/50 flex flex-col gap-5">
              {/* Top Row: Search & View Mode Toggle */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Search Input Box */}
                <div className="relative flex-1 max-w-lg z-30">
                  <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-[#e5e1da] dark:border-slate-700 px-4 py-2.5 rounded-2xl focus-within:border-[#5f6f52] focus-within:ring-2 focus-within:ring-[#5f6f52]/10 transition-all duration-300 shadow-sm">
                    <button
                      type="button"
                      onClick={() => saveSearchTerm(search)}
                      className="text-slate-400 hover:text-[#5f6f52] dark:hover:text-emerald-400 transition cursor-pointer shrink-0"
                      title="Search and save to history"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={search}
                      onFocus={() => setShowRecentDropdown(true)}
                      onBlur={() => {
                        setTimeout(() => setShowRecentDropdown(false), 200);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveSearchTerm(search);
                        }
                      }}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search topic, subject, grade..."
                      className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-400 font-medium animate-fadeIn"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="text-slate-400 hover:text-slate-600 transition p-0.5 cursor-pointer"
                        title="Clear search query"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {recentSearches.length > 0 && (
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setShowRecentDropdown(!showRecentDropdown);
                        }}
                        className={`text-slate-400 hover:text-[#5f6f52] transition p-0.5 cursor-pointer ${
                          showRecentDropdown ? 'text-[#5f6f52]' : ''
                        }`}
                        title="Search History"
                      >
                        <History className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>

                  {/* Predictive & Recent Searches dropdown */}
                  {showRecentDropdown && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-[#e5e1da] rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 py-1.5 animate-fadeIn max-h-[420px] overflow-y-auto">
                      
                      {/* Case 1: Search is empty -> Show Recent Searches */}
                      {!search.trim() && recentSearches.length > 0 && (
                        <>
                          <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between bg-slate-50">
                            <span>Recent Searches</span>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setRecentSearches([]);
                                localStorage.removeItem('teacher_recent_searches');
                              }}
                              className="text-red-500 hover:text-red-700 hover:underline cursor-pointer text-[10px] font-bold"
                            >
                              Clear All
                            </button>
                          </div>
                          {recentSearches.map((term, index) => (
                            <button
                              key={index}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSearch(term);
                                setShowRecentDropdown(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-[#5f6f52]/5 hover:text-[#5f6f52] flex items-center gap-2.5 cursor-pointer transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate font-medium">{term}</span>
                            </button>
                          ))}
                        </>
                      )}

                      {/* Case 2: Search is not empty -> Show Predictive Suggestions using Fuzzy Match */}
                      {search.trim() && predictiveSuggestions && (
                        <>
                          {/* Typo Correction ("Did you mean...?") */}
                          {predictiveSuggestions.typoSuggestion && (
                            <div className="px-4 py-2 bg-amber-50/60 text-xs text-amber-800 flex items-center gap-2 border-b border-amber-100/40">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                              <span>Did you mean <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setSearch(predictiveSuggestions.typoSuggestion || ''); }} className="font-extrabold underline text-amber-900 cursor-pointer">{predictiveSuggestions.typoSuggestion}</button>?</span>
                            </div>
                          )}

                          {/* Matching Subjects & Grades (Smart Filter Shortcuts) */}
                          {(predictiveSuggestions.matchingSubjects.length > 0 || predictiveSuggestions.matchingGrades.length > 0) && (
                            <div className="p-3 bg-slate-50/30">
                              <p className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Smart Filters</p>
                              <div className="flex flex-wrap gap-1.5">
                                {predictiveSuggestions.matchingSubjects.map((sub, idx) => (
                                  <button
                                    key={`sub-${idx}`}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSearch(sub);
                                      setShowRecentDropdown(false);
                                    }}
                                    className="text-xs bg-[#5f6f52]/10 hover:bg-[#5f6f52]/20 text-[#5f6f52] font-semibold px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1 border border-[#5f6f52]/20"
                                  >
                                    <span>Subject: {sub}</span>
                                  </button>
                                ))}
                                {predictiveSuggestions.matchingGrades.map((grade, idx) => (
                                  <button
                                    key={`grade-${idx}`}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSearch(grade);
                                      setShowRecentDropdown(false);
                                    }}
                                    className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1 border border-indigo-100"
                                  >
                                    <span>Grade: {grade}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Matching Curriculum Strands / Standard codes */}
                          {predictiveSuggestions.matchingStrands.length > 0 && (
                            <div className="p-3 bg-slate-50/10 border-t border-slate-100">
                              <p className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Curriculum Strands</p>
                              <div className="space-y-1">
                                {predictiveSuggestions.matchingStrands.map((strand, idx) => (
                                  <button
                                    key={`strand-${idx}`}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSearch(strand.title);
                                      setShowRecentDropdown(false);
                                    }}
                                    className="w-full text-left p-2 rounded-xl hover:bg-[#5f6f52]/5 transition cursor-pointer flex items-center justify-between text-xs font-semibold text-slate-700"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-[10px] bg-[#5f6f52]/10 text-[#5f6f52] px-2 py-0.5 rounded-md font-bold shrink-0">{strand.code.toUpperCase()}</span>
                                      <span className="truncate">{strand.title}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded-full ml-2">{strand.docCount} {strand.docCount === 1 ? 'lesson' : 'lessons'}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Scored Documents / Lessons list */}
                          <div className="p-3 border-t border-slate-100">
                            <p className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Lessons & Drafts ({predictiveSuggestions.scoredDocs.length})</p>
                            {predictiveSuggestions.scoredDocs.length > 0 ? (
                              <div className="space-y-1">
                                {predictiveSuggestions.scoredDocs.map(({ doc, result }) => {
                                  const matchesText = result.matchedFields.join(', ');
                                  return (
                                    <button
                                      key={`doc-${doc.id}`}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onOpenDoc(doc);
                                        setShowRecentDropdown(false);
                                      }}
                                      className="w-full text-left p-2 rounded-xl hover:bg-emerald-50/40 border border-transparent hover:border-emerald-100/50 transition cursor-pointer flex items-start gap-3"
                                    >
                                      <div className="w-1.5 h-8 bg-[#5f6f52]/40 rounded-full shrink-0 self-center" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 justify-between">
                                          <span className="text-xs font-extrabold text-slate-800 truncate">{doc.title}</span>
                                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold shrink-0">{Math.min(100, Math.round(result.score * 1.5))}% Match</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-semibold">
                                          <span className="text-[#5f6f52]">{doc.subject}</span>
                                          <span>•</span>
                                          <span className="bg-indigo-50 text-indigo-700 px-1 rounded-md">{doc.classLevel}</span>
                                          {matchesText && (
                                            <>
                                              <span>•</span>
                                              <span className="text-slate-400 italic font-medium">Matched: {matchesText}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="p-4 text-center text-xs font-semibold text-slate-400">
                                No lesson plans matched. Try adjusting your search query.
                              </div>
                            )}
                          </div>
                        </>
                      )}

                    </div>
                  )}
                </div>

                {/* View Mode & Extra Actions */}
                <div className="flex items-center gap-3 self-end lg:self-center flex-wrap">
                  {/* Reset filter button */}
                  {isAnyFilterActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setDocTypeFilter('all');
                        setCurriculumFilter('all');
                        setArchiveFilter('active');
                        setSelectedTagFilter('all');
                        setCategoryFilter('all');
                        setTimeFilter('all');
                        setTopicFilter('all');
                        setSubjectFilter('all');
                        setClassLevelFilter('all');
                      }}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Reset all filters to defaults"
                    >
                      <X className="w-4 h-4 text-slate-500" /> Reset Filters
                    </button>
                  )}

                  {/* View Toggle Pill */}
                  <div className="flex border border-[#e5e1da] rounded-2xl overflow-hidden p-1 bg-white shadow-sm shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                        viewMode === 'list'
                          ? 'bg-[#5f6f52] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                      title="Switch to Card Grid View"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Grid View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('calendar')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                        viewMode === 'calendar'
                          ? 'bg-[#5f6f52] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                      title="Switch to Calendar View"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Calendar Planner</span>
                    </button>
                  </div>

                  {userRole !== 'Student' && (
                    <button
                      onClick={onCreateNew}
                      className="flex items-center gap-2 bg-[#5f6f52] hover:bg-[#4d5c41] text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-sm hover:shadow transition-all duration-300 active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" /> Create New
                    </button>
                  )}
                </div>
              </div>

              {/* Curriculum Search & Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-3 border-b border-[#e5e1da]/40">
                {/* Subject Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#5f6f52] dark:text-emerald-400" /> Subject
                  </label>
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="theme-input px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52]/20 transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    <option value="all">📚 All Subjects</option>
                    {allSubjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* Topic Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#5f6f52] dark:text-emerald-400" /> Topic
                  </label>
                  <select
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                    className="theme-input px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52]/20 transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    <option value="all">🗺️ All Topics</option>
                    {allTopics.map((topic) => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>

                {/* Class Level Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#5f6f52] dark:text-emerald-400" /> Class Level / Grade
                  </label>
                  <select
                    value={classLevelFilter}
                    onChange={(e) => setClassLevelFilter(e.target.value)}
                    className="theme-input px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52]/20 transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    <option value="all">🎓 All Class Levels</option>
                    {allClassLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bottom Row: Refined Filter Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
                {/* Document Type Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Document Type</label>
                  <select
                    value={docTypeFilter}
                    onChange={(e) => setDocTypeFilter(e.target.value)}
                    className="bg-white border border-[#e5e1da] text-slate-600 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52]/20 transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    <option value="all">📁 All Documents</option>
                    <option value="lesson-plan">📝 Lesson Plan</option>
                    <option value="scheme-of-work">📅 Scheme of Work</option>
                    <option value="lesson-notes">📚 Lesson Notes</option>
                    <option value="lesson-notes-classic">📖 Lesson Notes (Classic)</option>
                    <option value="worksheet">📝 Worksheet & Key</option>
                    <option value="formative-assessment">📊 Formative Assess</option>
                    <option value="summative-assessment">📋 Summative Exam</option>
                    <option value="pedagogy-advisor">💡 Pedagogy Advisor</option>
                  </select>
                </div>

                {/* Syllabus Curriculum Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Framework</label>
                  <select
                    value={curriculumFilter}
                    onChange={(e) => setCurriculumFilter(e.target.value)}
                    className="bg-white border border-[#e5e1da] text-slate-600 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52]/20 transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    <option value="all">🌍 All Frameworks</option>
                    <option value="cbc">🇰🇪 Kenyan CBC Only</option>
                    <option value="standard">📜 Standard Syllabus Only</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-white border border-[#e5e1da] text-slate-600 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52]/20 transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    <option value="all">📁 All Categories</option>
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>📂 {cat}</option>
                    ))}
                  </select>
                </div>

                {/* Tag Dropdown Filter */}
                {allTags.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tags</label>
                    <select
                      value={selectedTagFilter}
                      onChange={(e) => setSelectedTagFilter(e.target.value)}
                      className="bg-white border border-[#e5e1da] text-slate-600 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52]/20 transition-all duration-300 cursor-pointer shadow-sm"
                    >
                      <option value="all">🏷️ All Tags</option>
                      {allTags.map((tag) => (
                        <option key={tag} value={tag}>
                          🏷️ {tag} ({tagCounts[tag] || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date Added Filter */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Date Added</label>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as 'all' | 'today')}
                    className="bg-white border border-[#e5e1da] text-[#5f6f52] px-3.5 py-2 rounded-xl text-xs font-extrabold focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52]/20 transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    <option value="all">📅 All Dates</option>
                    <option value="today">☀️ Added Today ({addedTodayCount})</option>
                  </select>
                </div>

                {/* Archive Filter */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Status</label>
                  <select
                    value={archiveFilter}
                    onChange={(e) => setArchiveFilter(e.target.value)}
                    className="bg-white border border-[#e5e1da] text-[#5f6f52] px-3.5 py-2 rounded-xl text-xs font-extrabold focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52]/20 transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    <option value="active">🟢 Active Materials</option>
                    <option value="archived">🗄️ Archived Reflections</option>
                    <option value="all">📂 All Materials</option>
                  </select>
                </div>
              </div>

              {/* Search History & Common Tasks Row */}
              {recentSearches.length > 0 && (
                <div className="flex flex-col gap-2 pt-4 border-t border-[#e5e1da]/50 mt-1 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-[#5f6f52]" /> Search History & Common Tasks
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem('teacher_recent_searches');
                      }}
                      className="text-[10px] font-bold text-red-500 hover:text-red-700 transition cursor-pointer hover:underline"
                    >
                      Clear History
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {recentSearches.map((term, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center bg-white hover:bg-slate-50 border border-[#e5e1da] rounded-xl px-3.5 py-2 transition-all duration-300 group shadow-2xs hover:border-[#5f6f52]/40"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSearch(term);
                          }}
                          className="text-xs font-semibold text-slate-700 hover:text-[#5f6f52] transition cursor-pointer text-left mr-2.5 flex items-center gap-1.5"
                          title={`Filter dashboard documents by "${term}"`}
                        >
                          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#5f6f52]/60 shrink-0" />
                          <span className="truncate max-w-[120px]">{term}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickRerun(term)}
                          className="p-1 hover:bg-[#5f6f52]/10 rounded-lg text-[#5f6f52] hover:text-[#4d5c41] transition cursor-pointer flex items-center justify-center border border-transparent hover:border-[#5f6f52]/20"
                          title={`Quickly pre-fill Curriculum Generator to re-run task for "${term}"`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Tag Filter Bar */}
            {allTags.length > 0 && (
              <div className="px-6 py-4 bg-slate-50/10 border-b border-[#e5e1da] flex items-center gap-2 flex-wrap animate-fadeIn">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
                  <Tag className="w-4 h-4 text-[#5f6f52]" /> Quick Tag Filter:
                </span>
                <button
                  onClick={() => setSelectedTagFilter('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border flex items-center gap-1.5 ${
                    selectedTagFilter === 'all'
                      ? 'bg-[#5f6f52] border-[#5f6f52] text-white font-bold shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Tags
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedTagFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {documents.length}
                  </span>
                </button>
                {allTags.map((tag) => {
                  const isSelected = selectedTagFilter === tag;
                  const count = tagCounts[tag] || 0;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTagFilter(tag)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#5f6f52] border-[#5f6f52] text-white font-bold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{tag}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Today's Materials Highlight Alert Banner */}
            {addedTodayCount > 0 && (
              <div className="mx-6 mt-6 bg-[#5f6f52]/10 border border-[#5f6f52]/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white border border-[#5f6f52]/20 flex items-center justify-center shrink-0 shadow-sm text-lg">
                    ✨
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#5f6f52] tracking-tight">Today's Newly Added Resources</h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">
                      You have successfully created or imported <strong className="text-[#5f6f52] font-extrabold">{addedTodayCount}</strong> teaching resource material{addedTodayCount > 1 ? 's' : ''} today.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTimeFilter(timeFilter === 'today' ? 'all' : 'today')}
                    className={`px-4.5 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all duration-300 cursor-pointer border ${
                      timeFilter === 'today'
                        ? 'bg-[#5f6f52] text-white border-[#5f6f52] hover:bg-[#5f6f52]/95'
                        : 'bg-white text-[#5f6f52] border-[#5f6f52]/30 hover:bg-[#5f6f52]/5'
                    }`}
                  >
                    {timeFilter === 'today' ? "Show All Dates" : "View Today's Resources"}
                  </button>
                </div>
              </div>
            )}

            {/* List of files */}
            {viewMode === 'calendar' ? (
              <div className="p-6 space-y-6">
                {/* Calendar Header with Navigation */}
                <div className="flex items-center justify-between flex-wrap gap-4 bg-[#fcfbf9] border border-[#e5e1da] p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </h3>
                      <p className="text-[11px] font-semibold text-emerald-700">
                        {filteredDocs.filter(d => {
                          if (!d.scheduledDate) return false;
                          const dDate = new Date(d.scheduledDate);
                          return dDate.getFullYear() === currentMonth.getFullYear() && dDate.getMonth() === currentMonth.getMonth();
                        }).length} plans scheduled this month
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(new Date())}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                    >
                      Today
                    </button>
                    <div className="flex border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-white">
                      <button
                        type="button"
                        onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                        className="p-1.5 hover:bg-slate-50 text-slate-600 transition rounded-lg cursor-pointer"
                        title="Previous Month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                        className="p-1.5 hover:bg-slate-50 text-slate-600 transition rounded-lg cursor-pointer"
                        title="Next Month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Calendar Month Grid */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  {/* Day names */}
                  <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center text-xs font-bold text-slate-400 py-3 uppercase tracking-wider">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
                      <div key={dayName}>{dayName}</div>
                    ))}
                  </div>

                  {/* Grid Cells */}
                  <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-y divide-slate-100">
                    {(() => {
                      const pad = (n: number) => String(n).padStart(2, '0');
                      const year = currentMonth.getFullYear();
                      const month = currentMonth.getMonth();
                      
                      const firstDay = new Date(year, month, 1);
                      const startDayOfWeek = firstDay.getDay();
                      const totalDays = new Date(year, month + 1, 0).getDate();
                      const prevTotalDays = new Date(year, month, 0).getDate();

                      const cells = [];

                      // Previous month padding cells
                      const prevYear = month === 0 ? year - 1 : year;
                      const prevMon = month === 0 ? 11 : month - 1;
                      for (let i = startDayOfWeek - 1; i >= 0; i--) {
                        const dayNum = prevTotalDays - i;
                        cells.push({
                          dayNum,
                          isCurrentMonth: false,
                          dateStr: `${prevYear}-${pad(prevMon + 1)}-${pad(dayNum)}`,
                          key: `prev-${dayNum}`
                        });
                      }

                      // Current month cells
                      for (let d = 1; d <= totalDays; d++) {
                        cells.push({
                          dayNum: d,
                          isCurrentMonth: true,
                          dateStr: `${year}-${pad(month + 1)}-${pad(d)}`,
                          key: `curr-${d}`
                        });
                      }

                      // Next month padding cells
                      const nextYear = month === 11 ? year + 1 : year;
                      const nextMon = month === 11 ? 0 : month + 1;
                      const totalCells = cells.length;
                      const remaining = 42 - totalCells;
                      for (let d = 1; d <= remaining; d++) {
                        cells.push({
                          dayNum: d,
                          isCurrentMonth: false,
                          dateStr: `${nextYear}-${pad(nextMon + 1)}-${pad(d)}`,
                          key: `next-${d}`
                        });
                      }

                      const todayStr = new Date().toISOString().split('T')[0];

                      return cells.map((cell) => {
                        const isToday = cell.dateStr === todayStr;
                        const dayDocs = filteredDocs.filter(d => d.scheduledDate && d.scheduledDate.startsWith(cell.dateStr));

                        return (
                          <div
                            key={cell.key}
                            className={`relative p-2 flex flex-col gap-1 group transition-colors hover:bg-slate-50/35 overflow-hidden ${
                              cell.isCurrentMonth ? 'text-slate-700' : 'text-slate-300 bg-slate-50/15'
                            } ${isToday ? 'bg-emerald-50/25' : ''}`}
                          >
                            {/* Day Number and Badges */}
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                  isToday
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : cell.isCurrentMonth
                                    ? 'text-slate-800'
                                    : 'text-slate-300'
                                }`}
                              >
                                {cell.dayNum}
                              </span>

                              {/* Quick Schedule button for Teachers */}
                              {userRole !== 'Student' && cell.isCurrentMonth && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    localStorage.setItem('pedagogical_scheduled_date_hint', cell.dateStr);
                                    onCreateNew();
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-[#5f6f52] hover:text-emerald-700 bg-emerald-50 rounded transition duration-150 cursor-pointer"
                                  title={`Schedule lesson for ${cell.dateStr}`}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Documents for this day */}
                            <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
                              {dayDocs.slice(0, 3).map((doc) => {
                                const typeStyle = getDocTypeColor(doc.docType);
                                return (
                                  <div
                                    key={doc.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenDoc(doc);
                                    }}
                                    className={`px-1.5 py-0.5 rounded border text-[10px] font-bold cursor-pointer flex items-center gap-1 transition hover:shadow-sm hover:brightness-95 truncate ${typeStyle.bg}`}
                                    title={`${doc.scheduledTime ? `[${doc.scheduledTime}] ` : ''}${doc.title} (${doc.subject} - ${doc.classLevel})`}
                                  >
                                    <span className="shrink-0">{getDocTypeIcon(doc.docType)}</span>
                                    <span className="truncate flex items-center gap-1">
                                      {doc.scheduledTime && (
                                        <span className="text-[9px] text-slate-600 bg-slate-100/50 px-1 rounded font-mono shrink-0">
                                          {doc.scheduledTime}
                                        </span>
                                      )}
                                      <span className="truncate">{doc.title}</span>
                                    </span>
                                  </div>
                                );
                              })}
                              {dayDocs.length > 3 && (
                                <div className="text-[9px] font-extrabold text-[#5f6f52] pl-1">
                                  + {dayDocs.length - 3} more plans
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="py-20 text-center max-w-lg mx-auto px-6">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-[#e5e1da] flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner">
                  {search || docTypeFilter !== 'all' || curriculumFilter !== 'all' || categoryFilter !== 'all' || selectedTagFilter !== 'all' || timeFilter !== 'all' ? (
                    <Search className="w-10 h-10 text-slate-400" />
                  ) : (
                    <BookOpen className="w-10 h-10 text-[#5f6f52]" />
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                  {search || docTypeFilter !== 'all' || curriculumFilter !== 'all' || categoryFilter !== 'all' || selectedTagFilter !== 'all' || timeFilter !== 'all'
                    ? 'No matching documents found'
                    : 'No pedagogical material generated yet'}
                </h3>
                <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed font-medium">
                  {search || docTypeFilter !== 'all' || curriculumFilter !== 'all' || categoryFilter !== 'all' || selectedTagFilter !== 'all' || timeFilter !== 'all'
                    ? 'Try clearing your search query, choosing different dropdown values, or resetting your "Date Added" filter to find your generated educational resources.'
                    : 'Empower your teaching. Generate professional-grade lesson plans, schemes of work, notes, student worksheets, and evaluation grids in seconds using our modern educator AI suite.'}
                </p>
                {!(search || docTypeFilter !== 'all' || curriculumFilter !== 'all' || categoryFilter !== 'all' || selectedTagFilter !== 'all' || timeFilter !== 'all') && userRole !== 'Student' && (
                  <button
                    onClick={onCreateNew}
                    className="mt-8 flex items-center gap-2 bg-[#5f6f52] hover:bg-[#4d5c41] text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-md hover:shadow transition-all duration-300 mx-auto active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" /> Generate First Document
                  </button>
                )}
              </div>
            ) : (
              <div className="border border-[#e5e1da] rounded-3xl overflow-hidden bg-white shadow-xs">
                {/* Folder / List Navigation Tabs */}
                <div className="flex border-b border-[#e5e1da] bg-[#fcfbf9]">
                  <button
                    type="button"
                    onClick={() => {
                      setFolderTabsMode('folders');
                      setCurrentFolder(null);
                    }}
                    className={`flex-1 md:flex-initial px-6 py-4 text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
                      folderTabsMode === 'folders'
                        ? 'border-[#5f6f52] text-[#5f6f52] bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Folder-Based View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFolderTabsMode('flat');
                      setCurrentFolder(null);
                    }}
                    className={`flex-1 md:flex-initial px-6 py-4 text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
                      folderTabsMode === 'flat'
                        ? 'border-[#5f6f52] text-[#5f6f52] bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Flat Document List</span>
                  </button>
                </div>

                {/* Breadcrumb Navigation Trail */}
                <div className="px-6 py-3 bg-slate-50/50 border-b border-[#e5e1da] flex items-center flex-wrap gap-2 text-xs font-semibold text-slate-500">
                  <button
                    type="button"
                    onClick={() => {
                      setFolderTabsMode('folders');
                      setCurrentFolder(null);
                    }}
                    className="flex items-center gap-1.5 hover:text-[#5f6f52] hover:bg-[#5f6f52]/5 px-2 py-1 rounded-lg transition-colors cursor-pointer select-none"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Library</span>
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  
                  {folderTabsMode === 'folders' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentFolder(null)}
                        className={`hover:text-[#5f6f52] hover:bg-[#5f6f52]/5 px-2 py-1 rounded-lg transition-colors cursor-pointer select-none ${currentFolder === null ? 'text-slate-800 font-extrabold bg-[#5f6f52]/5' : ''}`}
                      >
                        Folders
                      </button>
                      {currentFolder !== null && (
                        <>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[#5f6f52] font-extrabold bg-[#5f6f52]/10 border border-[#5f6f52]/15 px-2.5 py-1 rounded-lg flex items-center gap-1 animate-fade-in">
                            📁 {currentFolder === '_uncategorized' ? 'Uncategorized Files' : currentFolder}
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-800 font-extrabold bg-[#5f6f52]/5 px-2 py-1 rounded-lg">
                      All Files (Flat List)
                    </span>
                  )}
                </div>

                {folderTabsMode === 'folders' && currentFolder === null ? (
                  <div className="p-6 space-y-6 bg-slate-50/15">
                    {/* Create Folder Toolbar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Custom Storage Folders</h4>
                        <p className="text-xs text-slate-500">Create custom folders to group and structure your lesson plans, exams, and notes.</p>
                      </div>
                      
                      {!isCreatingFolder ? (
                        <button
                          type="button"
                          onClick={() => setIsCreatingFolder(true)}
                          className="flex items-center gap-1.5 bg-[#5f6f52]/10 hover:bg-[#5f6f52] text-[#5f6f52] hover:text-white px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>New Folder</span>
                        </button>
                      ) : (
                        <form onSubmit={handleCreateFolder} className="flex items-center gap-2 w-full sm:w-auto">
                          <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Folder name (e.g., Chemistry)..."
                            className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#5f6f52] bg-white font-semibold min-w-[200px]"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="bg-[#5f6f52] text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#4d5c41] transition cursor-pointer"
                          >
                            Create
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingFolder(false);
                              setNewFolderName('');
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-xl transition cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Folders Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {allFoldersList.map((folder) => {
                        const count = folderDocCounts[folder] || 0;
                        const isEditing = editingFolder === folder;
                        
                        return (
                          <div
                            key={folder}
                            onClick={() => !isEditing && setCurrentFolder(folder)}
                            className="bg-white border border-[#e5e1da] rounded-2xl p-5 hover:shadow-md hover:border-[#5f6f52]/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer h-36"
                          >
                            {/* Folder tab design accent */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#a9b388]" />
                            
                            <div className="flex items-start justify-between">
                              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                                <FolderOpen className="w-5 h-5 text-amber-600" />
                              </div>
                              
                              {/* Folder Options Menu (Rename / Delete) */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingFolder(folder);
                                    setEditingFolderName(folder);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition cursor-pointer"
                                  title="Rename Folder"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFolder(folder)}
                                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                                  title="Delete Folder"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="mt-3 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingFolderName}
                                  onChange={(e) => setEditingFolderName(e.target.value)}
                                  className="text-xs px-2 py-1 border border-slate-200 rounded-lg w-full font-semibold focus:outline-none focus:ring-1 focus:ring-[#5f6f52]"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRenameFolder(folder, editingFolderName)}
                                  className="bg-[#5f6f52] text-white px-2 py-1 rounded-lg hover:bg-[#4d5c41] transition cursor-pointer text-[10px] font-bold"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingFolder(null)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg transition cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="mt-4">
                                <h5 className="text-sm font-extrabold text-slate-800 tracking-tight group-hover:text-[#5f6f52] transition-colors truncate">
                                  {folder}
                                </h5>
                                <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                                  {count} resource{count !== 1 ? 's' : ''}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Uncategorized Folder */}
                      <div
                        onClick={() => setCurrentFolder('_uncategorized')}
                        className="bg-white border border-[#e5e1da] border-dashed rounded-2xl p-5 hover:shadow-md hover:border-[#5f6f52]/40 transition-all duration-300 flex flex-col justify-between group relative h-36 cursor-pointer"
                      >
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-300" />
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0">
                          <FolderOpen className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="mt-4">
                          <h5 className="text-sm font-extrabold text-slate-500 tracking-tight group-hover:text-[#5f6f52] transition-colors">
                            Uncategorized Files
                          </h5>
                          <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                            {uncategorizedCount} resource{uncategorizedCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Master Selection Toolbar */}
                    <div className="p-4 bg-[#fdfbf7] border-b border-[#e5e1da] flex items-center justify-between flex-wrap gap-3 text-xs font-bold">
                      <div className="flex items-center gap-3 flex-wrap">
                        {folderTabsMode === 'folders' && currentFolder !== null && (
                          <button
                            type="button"
                            onClick={() => setCurrentFolder(null)}
                            className="text-[#5f6f52] hover:bg-[#5f6f52]/15 flex items-center gap-1.5 font-extrabold bg-[#5f6f52]/10 px-3 py-1.5 rounded-xl transition cursor-pointer mr-1"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" /> Back to Folders
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const shownIds = shownDocsInFolder.map(d => d.id);
                            const allSelected = shownIds.every(id => selectedDocIds.includes(id));
                            if (allSelected) {
                              setSelectedDocIds(prev => prev.filter(id => !shownIds.includes(id)));
                            } else {
                              setSelectedDocIds(prev => Array.from(new Set([...prev, ...shownIds])));
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={shownDocsInFolder.length > 0 && shownDocsInFolder.every(d => selectedDocIds.includes(d.id))}
                            readOnly
                            className="rounded text-[#5f6f52] focus:ring-[#5f6f52] w-3.5 h-3.5 pointer-events-none cursor-pointer"
                          />
                          <span>{shownDocsInFolder.length > 0 && shownDocsInFolder.every(d => selectedDocIds.includes(d.id)) ? 'Deselect All' : 'Select All'}</span>
                        </button>
                        {selectedDocIds.length > 0 && (
                          <span className="text-slate-500 font-medium">
                            {selectedDocIds.length} selected
                          </span>
                        )}

                        {selectedDocIds.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const docsToExport = documents.filter(d => selectedDocIds.includes(d.id));
                                exportDocsToCSV(docsToExport, `selected-documents`);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 border border-amber-400 text-white rounded-xl transition cursor-pointer select-none text-[11px] font-extrabold"
                              title="Export only selected documents to CSV"
                            >
                              <Download className="w-3.5 h-3.5 text-white" />
                              <span>Export Selected ({selectedDocIds.length})</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleBulkArchive}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 border border-rose-500 text-white rounded-xl transition cursor-pointer select-none text-[11px] font-extrabold shadow-xs"
                              title="Bulk archive selected documents and move to Retired category"
                            >
                              <Archive className="w-3.5 h-3.5 text-white" />
                              <span>Bulk Archive ({selectedDocIds.length})</span>
                            </button>
                          </div>
                        ) : (
                          shownDocsInFolder.length > 0 && (
                            <button
                              type="button"
                              onClick={() => exportDocsToCSV(shownDocsInFolder, `filtered-documents`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5f6f52]/10 hover:bg-[#5f6f52] text-[#5f6f52] hover:text-white border border-[#5f6f52]/20 rounded-xl transition cursor-pointer select-none text-[11px] font-extrabold"
                              title="Export all currently filtered documents in view to CSV"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Export View to CSV ({shownDocsInFolder.length})</span>
                            </button>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-semibold hidden xl:inline">
                          Select multiple lessons to evaluate and run batch curriculum QA audits
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400 select-none font-bold">LAYOUT:</span>
                          <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
                            <button
                              type="button"
                              onClick={() => setListLayout('table')}
                              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-extrabold ${listLayout === 'table' ? 'bg-[#5f6f52]/10 text-[#5f6f52]' : 'text-slate-400 hover:text-slate-600'}`}
                              title="Switch to Sortable Table List Layout"
                            >
                              <List className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Table</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setListLayout('grid')}
                              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-extrabold ${listLayout === 'grid' ? 'bg-[#5f6f52]/10 text-[#5f6f52]' : 'text-slate-400 hover:text-slate-600'}`}
                              title="Switch to Card Grid Layout"
                            >
                              <LayoutGrid className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Grid</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="h-4 w-36 bg-slate-200 rounded-md animate-pulse"></div>
                          <div className="h-4 w-24 bg-slate-200 rounded-md animate-pulse"></div>
                        </div>
                        {listLayout === 'table' ? (
                          <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-150 flex items-center justify-between gap-4 animate-pulse">
                                <div className="flex items-center gap-3 w-1/2">
                                  <div className="w-5 h-5 rounded-md bg-slate-200 shrink-0"></div>
                                  <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0"></div>
                                  <div className="space-y-1.5 w-full">
                                    <div className="h-4 w-3/4 bg-slate-200 rounded-md"></div>
                                    <div className="h-3 w-1/2 bg-slate-100 rounded-md"></div>
                                  </div>
                                </div>
                                <div className="hidden sm:block h-6 w-20 bg-slate-200 rounded-full shrink-0"></div>
                                <div className="hidden md:block h-4 w-24 bg-slate-200 rounded-md shrink-0"></div>
                                <div className="h-8 w-16 bg-slate-200 rounded-lg shrink-0"></div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="bg-white border border-[#e5e1da] rounded-2xl p-5 space-y-4 animate-pulse min-h-[190px] flex flex-col justify-between">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <div className="h-5 w-24 bg-slate-200 rounded-full"></div>
                                    <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
                                  </div>
                                  <div className="h-5 w-4/5 bg-slate-200 rounded-lg"></div>
                                  <div className="h-4 w-1/2 bg-slate-100 rounded-md"></div>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                  <div className="h-3 w-20 bg-slate-200 rounded-md"></div>
                                  <div className="h-8 w-16 bg-slate-200 rounded-xl"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : shownDocsInFolder.length === 0 ? (
                      <div className="py-20 text-center max-w-lg mx-auto px-6 bg-[#fcfbf9]/30 rounded-b-3xl">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4 text-amber-500">
                          <FolderOpen className="w-8 h-8 animate-bounce" />
                        </div>
                        <h4 className="text-base font-extrabold text-slate-800 tracking-tight">
                          This folder is empty
                        </h4>
                        <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed font-medium">
                          Move documents into this folder using the folder selection dropdown in the card footer of any document, or generate a new material under this category.
                        </p>
                      </div>
                    ) : (
                      listLayout === 'table' ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs bg-white">
                            <thead>
                              <tr className="bg-slate-50 border-b border-[#e5e1da] text-slate-500 font-extrabold uppercase text-[10px] tracking-wider select-none">
                                <th className="py-3 px-4 w-12 text-center">
                                  {/* Empty header for select-all or checkboxes */}
                                </th>
                                <th 
                                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors"
                                  onClick={() => handleSort('title')}
                                  title="Sort by Title"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span>Title</span>
                                    {getSortIcon('title')}
                                  </div>
                                </th>
                                <th 
                                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors"
                                  onClick={() => handleSort('subject')}
                                  title="Sort by Subject"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span>Subject</span>
                                    {getSortIcon('subject')}
                                  </div>
                                </th>
                                <th className="py-3 px-4">
                                  <span>Curriculum</span>
                                </th>
                                <th 
                                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors"
                                  onClick={() => handleSort('lastModified')}
                                  title="Sort by Date Modified"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span>Date Modified</span>
                                    {getSortIcon('lastModified')}
                                  </div>
                                </th>
                                {userRole !== 'Student' && (
                                  <th className="py-3 px-4 w-40">
                                    <span>Folder</span>
                                  </th>
                                )}
                                <th className="py-3 px-4 text-right w-24">
                                  <span>Actions</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {sortedDocs.map((doc) => {
                                const typeStyle = getDocTypeColor(doc.docType);
                                const isSelected = selectedDocIds.includes(doc.id);
                                const cardFuzzyResult = search.trim() ? calculateFuzzyDocScore(search, doc) : null;
                                return (
                                  <tr 
                                    key={doc.id}
                                    onClick={() => onOpenDoc(doc)}
                                    className={`hover:bg-slate-50/40 transition cursor-pointer ${
                                      isSelected ? 'bg-emerald-50/15' : ''
                                    }`}
                                  >
                                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                      <div
                                        onClick={() => {
                                          setSelectedDocIds(prev =>
                                            prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                                          );
                                        }}
                                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer mx-auto ${
                                          isSelected
                                            ? 'bg-[#5f6f52] border-[#5f6f52] text-white shadow-xs'
                                            : 'bg-white border-slate-300 hover:border-slate-400 text-transparent'
                                        }`}
                                        title={isSelected ? 'Deselect document' : 'Select document for batch audit'}
                                      >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 max-w-[300px] sm:max-w-md lg:max-w-lg group/title">
                                          <span className="shrink-0">{getDocTypeIcon(doc.docType)}</span>
                                          <span className="font-extrabold text-slate-800 truncate" title={doc.title}>
                                            {doc.title}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => togglePinDocument(doc, e)}
                                            className={`p-1 rounded-lg transition-all cursor-pointer shrink-0 ${
                                              doc.isPinned
                                                ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                                                : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100 opacity-0 group-hover/title:opacity-100 focus:opacity-100'
                                            }`}
                                            title={doc.isPinned ? 'Unpin from top' : 'Pin to top of library'}
                                          >
                                            <Pin className={`w-3.5 h-3.5 ${doc.isPinned ? 'fill-amber-500' : ''}`} />
                                          </button>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className={`text-[8px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded border ${typeStyle.bg}`}>
                                            {typeStyle.label}
                                          </span>
                                          {doc.category && (
                                            <span className="text-[8px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                              📁 {doc.category}
                                            </span>
                                          )}
                                          {cardFuzzyResult && (
                                            <span className="text-[8px] font-extrabold text-[#5f6f52] bg-[#5f6f52]/10 border border-[#5f6f52]/20 px-1.5 py-0.5 rounded-full">
                                              Match: {Math.min(100, Math.round(cardFuzzyResult.score * 1.5))}%
                                            </span>
                                          )}
                                        </div>

                                        {/* Render fuzzy-matched strand details inside the row */}
                                        {cardFuzzyResult && cardFuzzyResult.matchedStrands.length > 0 && (
                                          <div className="mt-1.5 p-1.5 bg-amber-50/50 border border-amber-200/40 rounded-lg text-[9px] text-amber-900 font-bold space-y-0.5 max-w-sm">
                                            <div className="text-[8px] text-amber-700 uppercase tracking-wider font-extrabold flex items-center gap-1">
                                              <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse" /> Matched Strand:
                                            </div>
                                            {cardFuzzyResult.matchedStrands.map((strand, sIdx) => (
                                              <div key={sIdx} className="truncate">• {strand}</div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-600">
                                      <div className="space-y-0.5">
                                        <div className="font-extrabold truncate max-w-[150px]" title={doc.subject}>{doc.subject}</div>
                                        <div className="text-[9px] text-emerald-800 font-bold flex items-center gap-0.5">
                                          <GraduationCap className="w-3 h-3 text-emerald-600" /> {doc.classLevel}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full">
                                        {doc.curriculum === 'cbc' ? 'Kenyan CBC' : 'Standard'}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-500 font-semibold whitespace-nowrap">
                                      {new Date(doc.lastModified || doc.createdAt).toLocaleDateString()}
                                    </td>
                                    {userRole !== 'Student' && (
                                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                                        <select
                                          value={doc.category || ''}
                                          onChange={async (e) => {
                                            await handleMoveToFolder(doc.id, e.target.value);
                                          }}
                                          className="text-[10px] font-extrabold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#5f6f52] max-w-[120px] truncate cursor-pointer hover:bg-slate-100 transition-colors"
                                          title="Assign to Folder"
                                        >
                                          <option value="">📁 Move to...</option>
                                          <option value="">📂 [Uncategorized]</option>
                                          {allFoldersList.map(folder => (
                                            <option key={folder} value={folder}>📁 {folder}</option>
                                          ))}
                                        </select>
                                      </td>
                                    )}
                                    <td className="py-3.5 px-4 text-right">
                                      <button 
                                        type="button"
                                        onClick={() => onOpenDoc(doc)}
                                        className="inline-flex items-center gap-1 bg-[#5f6f52]/5 text-[#5f6f52] hover:bg-[#5f6f52] hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-300 cursor-pointer"
                                      >
                                        <span>Open</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 bg-slate-50/15">
                          {sortedDocs.map((doc) => {
                            const typeStyle = getDocTypeColor(doc.docType);
                            const isSelected = selectedDocIds.includes(doc.id);
                            const cardFuzzyResult = search.trim() ? calculateFuzzyDocScore(search, doc) : null;
                            return (
                              <div
                                key={doc.id}
                                onClick={() => onOpenDoc(doc)}
                                className={`bg-white border rounded-2xl p-5 hover:shadow-md hover:border-[#5f6f52]/40 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden h-full min-h-[190px] ${
                                  isSelected ? 'border-[#5f6f52] ring-1 ring-[#5f6f52]/10 bg-emerald-50/5' : 'border-[#e5e1da]'
                                }`}
                              >
                                {/* Checkbox for selection */}
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDocIds(prev =>
                                      prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                                    );
                                  }}
                                  className={`absolute top-4 right-4 z-10 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#5f6f52] border-[#5f6f52] text-white shadow-xs'
                                      : 'bg-white border-slate-300 hover:border-slate-400 text-transparent'
                                  }`}
                                  title={isSelected ? 'Deselect document' : 'Select document for batch audit'}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>

                                {/* Pin Button */}
                                <button
                                  type="button"
                                  onClick={(e) => togglePinDocument(doc, e)}
                                  className={`absolute top-4 right-11 z-10 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                    doc.isPinned
                                      ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                                      : 'bg-white border-slate-300 hover:border-slate-400 text-slate-400 opacity-0 group-hover:opacity-100 focus:opacity-100'
                                  }`}
                                  title={doc.isPinned ? 'Unpin from top' : 'Pin to top of library'}
                                >
                                  <Pin className={`w-3 h-3 ${doc.isPinned ? 'fill-white' : ''}`} />
                                </button>

                                {/* Left accent strip */}
                                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                                  doc.docType === 'lesson-plan' ? 'bg-emerald-500' :
                                  doc.docType === 'scheme-of-work' ? 'bg-blue-500' :
                                  doc.docType === 'lesson-notes' ? 'bg-amber-500' :
                                  doc.docType === 'worksheet' ? 'bg-purple-500' :
                                  doc.docType === 'formative-assessment' ? 'bg-indigo-500' :
                                  doc.docType === 'summative-assessment' ? 'bg-violet-500' :
                                  doc.docType === 'pedagogy-advisor' ? 'bg-pink-500' : 'bg-slate-400'
                                }`} />

                                <div className="space-y-3 pl-2 flex-1 pr-6">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border ${typeStyle.bg}`}>
                                      {typeStyle.label}
                                    </span>
                                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full">
                                      {doc.curriculum === 'cbc' ? 'Kenyan CBC' : 'Standard'}
                                    </span>
                                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                      <GraduationCap className="w-3 h-3 text-emerald-600" /> {doc.classLevel}
                                    </span>
                                    {cardFuzzyResult && (
                                      <span className="text-[9px] font-extrabold text-[#5f6f52] bg-[#5f6f52]/10 border border-[#5f6f52]/20 px-2 py-0.5 rounded-full">
                                        Match: {Math.min(100, Math.round(cardFuzzyResult.score * 1.5))}%
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-[#5f6f52] transition-colors leading-snug line-clamp-2">
                                    {doc.title}
                                  </h4>

                                  <div className="space-y-1.5 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg w-fit">
                                      {getDocTypeIcon(doc.docType)}
                                      <span className="truncate max-w-[150px]">{doc.subject}</span>
                                    </div>
                                    {doc.duration && (
                                      <div className="flex items-center gap-1.5 font-medium text-[11px] text-slate-400">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{doc.duration}</span>
                                      </div>
                                    )}
                                    {doc.category && (
                                      <div className="flex items-center gap-1 text-[10px] text-indigo-700 font-semibold bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100/30 w-fit uppercase tracking-wider">
                                        📁 {doc.category}
                                      </div>
                                    )}

                                    {/* Render fuzzy-matched strand details inside the card */}
                                    {cardFuzzyResult && cardFuzzyResult.matchedStrands.length > 0 && (
                                      <div className="mt-2 p-2 bg-amber-50/55 border border-amber-200/50 rounded-xl text-[10px] text-amber-900 font-bold space-y-1">
                                        <div className="text-[9px] text-amber-700 uppercase tracking-wider font-extrabold flex items-center gap-1">
                                          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> Matched Strand:
                                        </div>
                                        {cardFuzzyResult.matchedStrands.map((strand, sIdx) => (
                                          <div key={sIdx} className="truncate">• {strand}</div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 pl-2 flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-medium text-slate-400">
                                      {new Date(doc.lastModified).toLocaleDateString()}
                                    </span>
                                    
                                    {/* Folder Assignment Dropdown */}
                                    {userRole !== 'Student' && (
                                      <select
                                        value={doc.category || ''}
                                        onChange={async (e) => {
                                          e.stopPropagation();
                                          await handleMoveToFolder(doc.id, e.target.value);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[10px] font-extrabold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#5f6f52] max-w-[120px] truncate cursor-pointer hover:bg-slate-100 transition-colors"
                                        title="Assign to Folder"
                                      >
                                        <option value="">📁 Move to...</option>
                                        <option value="">📂 [Uncategorized]</option>
                                        {allFoldersList.map(folder => (
                                          <option key={folder} value={folder}>📁 {folder}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5">
                                    {userRole !== 'Student' && (
                                      <button
                                        type="button"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          await broadcastDocumentSession({
                                            sessionId: 'global_active_broadcast',
                                            documentId: doc.id,
                                            documentTitle: doc.title,
                                            documentContent: doc.content,
                                            documentSubject: doc.subject,
                                            documentClassLevel: doc.classLevel,
                                            teacherUid: 'teacher-host',
                                            teacherName: 'Educator',
                                            isBroadcasting: true,
                                          });
                                          onOpenDoc(doc);
                                        }}
                                        className="flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer"
                                        title="Broadcast live to all connected students"
                                      >
                                        <Radio className="w-3 h-3" />
                                        <span>Broadcast</span>
                                      </button>
                                    )}
                                    <button className="flex items-center gap-1.5 bg-[#5f6f52]/5 text-[#5f6f52] hover:bg-[#5f6f52] hover:text-white px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-300">
                                      <span>Open</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (col-span 1) - Actionable Sidebar Widgets */}
        <div className="space-y-6">
          
          {/* AI Generation settings card */}
          {userRole !== 'Student' && (
            <div className="bg-white rounded-3xl border border-[#e5e1da] shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#5f6f52] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" /> AI Preferences
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Manage how artificial intelligence categorizes and prepares your newly generated educational documents.
              </p>
              
              <div className="flex items-center justify-between p-3.5 bg-[#fdfbf7] border border-[#e5e1da] rounded-2xl">
                <div className="space-y-0.5 pr-2">
                  <p className="text-xs font-bold text-slate-800">Auto-Categorization</p>
                  <p className="text-[10px] text-slate-500 font-medium">Suggest folders & tags for new documents</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAutoCategorization}
                  className={`w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 focus:outline-none ${
                    autoCategorization ? 'bg-[#5f6f52]' : 'bg-slate-300'
                  }`}
                  title={autoCategorization ? "Disable Auto-Categorization" : "Enable Auto-Categorization"}
                  id="dashboard-auto-categorization-toggle"
                >
                  <div
                    className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                      autoCategorization ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Upcoming Lesson Notifications Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[#e5e1da] dark:border-slate-700 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#5f6f52] dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#5f6f52] dark:text-emerald-400" /> Scheduled Lessons & Alerts
              </h3>
              {activeAlerts.length > 0 && (
                <span className="px-2 py-0.5 text-[9px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-extrabold rounded-full animate-pulse">
                  {activeAlerts.length} Alerts
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* Active real-time unread alerts list */}
              {activeAlerts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest pl-1">Recent Real-time Alerts</p>
                  {activeAlerts.map((notif) => (
                    <div key={notif.id} className="p-3 bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 rounded-xl relative flex items-start gap-2.5 animate-fadeIn">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 animate-pulse" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-normal">{notif.message}</p>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-300 font-semibold mt-1">📚 Topic: {notif.docTopic}</p>
                      </div>
                      {setNotifications && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = notifications.map((n) => n.id === notif.id ? { ...n, read: true } : n);
                            setNotifications(updated);
                            localStorage.setItem('pedagogical_app_notifications', JSON.stringify(updated));
                          }}
                          className="text-slate-400 hover:text-[#5f6f52] dark:hover:text-emerald-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
                          title="Mark read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upcoming scheduled calendar sessions list */}
              <div>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest pl-1 mb-2">Upcoming Calendar Lessons</p>
                {upcomingScheduledLessons.length === 0 ? (
                  <div className="p-4 bg-[#fdfbf7] dark:bg-slate-900/60 border border-dashed border-[#e5e1da] dark:border-slate-700 rounded-2xl text-center text-slate-400 space-y-2">
                    <Calendar className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No scheduled sessions</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-relaxed max-w-[190px] mx-auto">
                      Schedule generated materials by selecting a date in the Calendar Planner grid.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingScheduledLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        onClick={() => onOpenDoc(lesson)}
                        className="p-3 bg-[#fdfbf7]/50 dark:bg-slate-900/40 border border-[#e5e1da] dark:border-slate-700 rounded-2xl hover:border-[#5f6f52] dark:hover:border-emerald-500 hover:shadow-2xs transition duration-200 cursor-pointer flex justify-between items-center group"
                      >
                        <div className="space-y-1 min-w-0 pr-2">
                          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#5f6f52] dark:group-hover:text-emerald-400 transition-colors">
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                            <Calendar className="w-3 h-3 text-[#5f6f52] dark:text-emerald-400" />
                            <span>{new Date(lesson.scheduledDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            <Clock className="w-3 h-3 text-[#5f6f52] dark:text-emerald-400" />
                            <span>{lesson.scheduledTime || '00:00'}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-[9px] font-extrabold rounded uppercase tracking-wider shrink-0">
                          {lesson.classLevel.replace('Junior School: ', '')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Tasks Checklist Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[#e5e1da] dark:border-slate-700 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#5f6f52] dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#5f6f52] dark:text-emerald-400" /> Active Teaching Tasks
              </h3>
              <span className="px-2.5 py-0.5 text-[9px] bg-[#5f6f52]/10 dark:bg-emerald-950/60 text-[#5f6f52] dark:text-emerald-300 font-extrabold rounded-full">
                {tasks.filter(t => !t.completed).length} Pending
              </span>
            </div>

            {/* Inline Add Task Form */}
            <form onSubmit={handleAddTask} className="flex gap-2 bg-[#fdfbf7] dark:bg-slate-900 border border-[#e5e1da] dark:border-slate-700 p-1.5 rounded-xl">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add quick lesson chore..."
                className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-2 font-semibold"
              />
              <button
                type="submit"
                className="p-1.5 bg-[#5f6f52] hover:bg-[#4d5c41] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg transition duration-150 cursor-pointer flex items-center justify-center shadow-xs"
                title="Add Task"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Task list container */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
              {tasks.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                  🎉 All tasks completed! Ready for class!
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/80 hover:border-slate-200 dark:hover:border-slate-600 bg-white dark:bg-slate-800/80 hover:bg-[#fdfbf7]/50 dark:hover:bg-slate-700/50 transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 cursor-pointer transition ${
                          task.completed
                            ? 'bg-[#5f6f52] dark:bg-emerald-600 border-[#5f6f52] dark:border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-[#5f6f52] dark:hover:border-emerald-400 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <span className={`text-xs font-semibold leading-snug truncate ${
                        task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200 font-medium'
                      }`}>
                        {task.text}
                      </span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-rose-400 p-1 rounded hover:bg-red-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Floating Selection Bar for Batch Actions */}
      {selectedDocIds.length > 0 && (
        <motion.div
          initial={{ y: 50, x: '-50%', opacity: 0 }}
          animate={{ y: 0, x: '-50%', opacity: 1 }}
          className="fixed bottom-6 left-1/2 bg-slate-950/95 backdrop-blur-md border border-slate-800 text-white rounded-3xl py-4.5 px-6.5 shadow-2xl flex items-center justify-between gap-6 z-40 max-w-2xl w-[90vw]"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              {selectedDocIds.length} {selectedDocIds.length === 1 ? 'document selected' : 'documents selected'}
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
              Ready to execute full KICD curriculum quality assurance verification.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedDocIds([])}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Deselect All
            </button>
            <button
              type="button"
              onClick={handleBulkArchive}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              title="Move selected documents to Retired category and archive them"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
            <button
              type="button"
              onClick={handleBatchValidate}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-amber-200" />
              <span>Run Batch Audit</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Batch Processing Loader Dialog */}
      {isBatchValidating && batchProgress && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6"
          >
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              {/* Spinning circular loader using Kenya colors */}
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-emerald-600 border-r-red-600 border-b-black animate-spin" />
              <Activity className="w-8 h-8 text-[#5f6f52] animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">KICD Curriculum QA Audit</h3>
              <p className="text-xs text-slate-500 font-semibold">Running deep linguistic alignment verification...</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Auditing Documents</span>
                <span>{batchProgress.current} / {batchProgress.total}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/50">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
              <p className="text-xs text-slate-600 font-mono font-bold truncate leading-relaxed">
                {batchProgress.step}
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Batch QA Report Modal */}
      {batchReport && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-8"
          >
            {/* Header */}
            <div className="bg-[#5f6f52] p-6 text-white flex justify-between items-center relative">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-amber-300" />
                  <span className="text-[10px] uppercase font-black tracking-widest text-emerald-100 bg-emerald-800/40 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                    KICD Curriculum Quality Assurance Audit
                  </span>
                </div>
                <h3 className="text-xl font-black tracking-tight mt-1">Batch Compliance Summary Report</h3>
                <p className="text-xs text-emerald-100/80 font-medium">
                  Aggregated evaluation of {batchReport.totalProcessed} learning resources against Kenyan CBC guidelines.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBatchReport(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
                title="Close Report"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Container */}
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-thin">
              {/* Top Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Big Score Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Average Compliance</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-800 tracking-tight">{batchReport.averageScore}%</span>
                      <span className="text-xs font-bold text-slate-400">score</span>
                    </div>
                  </div>
                  {/* Status indicator */}
                  <div className="mt-4">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      batchReport.averageScore >= 80 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                        : batchReport.averageScore >= 60 
                        ? 'bg-amber-50 text-amber-700 border-amber-200/60' 
                        : 'bg-red-50 text-red-700 border-red-200/60'
                    }`}>
                      {batchReport.averageScore >= 80 ? '● Highly Compliant' : batchReport.averageScore >= 60 ? '▲ Moderate Alignment' : '■ Needs Alignment'}
                    </span>
                  </div>
                  <BarChart3 className="absolute right-3 bottom-3 w-12 h-12 text-slate-200/65 stroke-1" />
                </div>

                {/* Batch Metrics Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                  <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Audit Coverage</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-400 font-bold">Processed</span>
                      <p className="text-xl font-black text-slate-800">{batchReport.totalProcessed}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-400 font-bold">{"Passed (>=80)"}</span>
                      <p className="text-xl font-black text-emerald-600">{batchReport.documents.filter(d => d.success && d.report?.overallScore >= 80).length}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-400 font-bold">{"Marginal (60-79)"}</span>
                      <p className="text-xl font-black text-amber-600">{batchReport.documents.filter(d => d.success && d.report?.overallScore >= 60 && d.report?.overallScore < 80).length}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-400 font-bold">{"Failed (<60)"}</span>
                      <p className="text-xl font-black text-red-500">{batchReport.documents.filter(d => d.success && d.report?.overallScore < 60).length + batchReport.failedCount}</p>
                    </div>
                  </div>
                </div>

                {/* Component Scores Progress */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-3.5">
                  <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Criteria Breakdown</p>
                  <div className="space-y-2.5">
                    {/* Learning Outcomes */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600">
                        <span>Learning Outcomes</span>
                        <span>{batchReport.averageScores.learningOutcomes}%</span>
                      </div>
                      <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${batchReport.averageScores.learningOutcomes}%` }} />
                      </div>
                    </div>
                    {/* Competencies */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600">
                        <span>Core Competencies</span>
                        <span>{batchReport.averageScores.competencies}%</span>
                      </div>
                      <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${batchReport.averageScores.competencies}%` }} />
                      </div>
                    </div>
                    {/* Values */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600">
                        <span>Values & PCIs</span>
                        <span>{batchReport.averageScores.values}%</span>
                      </div>
                      <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${batchReport.averageScores.values}%` }} />
                      </div>
                    </div>
                    {/* Resources */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600">
                        <span>Resource Adequacy</span>
                        <span>{batchReport.averageScores.resources}%</span>
                      </div>
                      <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${batchReport.averageScores.resources}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Breakdown Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Evaluated Resources List</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">Click open to view any specific document</span>
                </div>
                <div className="border border-slate-200/75 rounded-2xl overflow-hidden bg-white animate-fadeIn">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/75 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Resource Title</th>
                        <th className="py-3 px-4">Level & Subject</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batchReport.documents.map((outcome) => {
                        const originalDoc = documents.find(d => d.id === outcome.id);
                        return (
                          <tr key={outcome.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              <div className="flex items-center gap-2 max-w-[280px]">
                                <span className="shrink-0">{getDocTypeIcon(outcome.docType)}</span>
                                <span className="truncate" title={outcome.title}>{outcome.title}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-medium">
                              {outcome.classLevel} • {outcome.subject}
                            </td>
                            <td className="py-3.5 px-4">
                              {outcome.success && outcome.report ? (
                                <span className={`font-black text-sm ${
                                  outcome.report.overallScore >= 80 
                                    ? 'text-emerald-600' 
                                    : outcome.report.overallScore >= 60 
                                    ? 'text-amber-500' 
                                    : 'text-red-500'
                                }`}>
                                  {outcome.report.overallScore}%
                                </span>
                              ) : (
                                <span className="text-slate-400 font-semibold">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {outcome.success && outcome.report ? (
                                <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                                  outcome.report.overallScore >= 80
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : outcome.report.overallScore >= 60
                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                    : 'bg-red-50 text-red-700 border-red-100'
                                }`}>
                                  {outcome.report.overallScore >= 80 ? 'Aligned' : outcome.report.overallScore >= 60 ? 'Needs Tweaks' : 'Non-compliant'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100" title={outcome.error}>
                                  Error
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {originalDoc ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBatchReport(null);
                                    onOpenDoc(originalDoc);
                                  }}
                                  className="text-xs font-bold text-[#5f6f52] hover:text-[#4d5c41] bg-[#5f6f52]/5 hover:bg-[#5f6f52]/10 px-2.5 py-1 rounded-lg transition cursor-pointer"
                                >
                                  Open Resource
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold">Deleted</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insights section: Recurring Gaps & Top Missing Elements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Missing Elements */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
                    <h5 className="text-xs uppercase font-extrabold text-slate-700 tracking-wider">Top Missing KICD Elements</h5>
                  </div>
                  {batchReport.topMissingElements.length === 0 ? (
                    <p className="text-xs text-slate-500 font-semibold italic pl-1">
                      No recurring missing elements! Documents perfectly address all required standards.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {batchReport.topMissingElements.map((el, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-white border border-slate-100 p-2.5 rounded-xl">
                          <span className="font-bold text-slate-600 truncate max-w-[250px]">{el.element}</span>
                          <span className="shrink-0 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                            Missing in {el.count} {el.count === 1 ? 'doc' : 'docs'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Compliance Analytics insights */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
                      <h5 className="text-xs uppercase font-extrabold text-slate-700 tracking-wider">Curriculum Insights</h5>
                    </div>
                    <div className="space-y-2 mt-3 text-xs leading-relaxed text-slate-600 font-medium">
                      <p>
                        🔍 Out of <strong className="text-slate-800">{batchReport.totalGapsCount} total evaluation standards</strong> verified across the selected resources, <strong className="text-red-600">{batchReport.notAddressedCount} standards</strong> were entirely missing and <strong className="text-amber-600">{batchReport.partiallyMetCount} standards</strong> were only partially met.
                      </p>
                      <p>
                        💡 <strong>Pedagogical Remedy</strong>: For resources marked as non-compliant or marginal, you can use the integrated <strong className="text-[#5f6f52]">Auto-Align Standards</strong> feature inside the document viewer to automatically inject missing elements.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Summary</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(batchReport, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `kicd-batch-compliance-report-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 py-2 bg-[#5f6f52]/10 hover:bg-[#5f6f52]/15 text-[#5f6f52] text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Data</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedDocIds([])}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={handleBatchValidate}
                className="px-5 py-2 bg-[#5f6f52] hover:bg-[#4d5c41] text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-md active:scale-95"
              >
                Rerun Batch Evaluation
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DEMO & HOW-TO VIDEO MODAL */}
      <DemoVideoModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        onOpenSandbox={() => {
          setShowDemoModal(false);
          onCreateNew();
        }}
        initialVideoType={demoVideoType}
        youtubeUrl={youtubeUrl}
      />

      {/* QUICK ACCESS QR CODE SCANNER MODAL */}
      {isQuickScannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-amber-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                  <Camera className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-serif">
                    <span>Quick QR Code Scanner</span>
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-500 text-slate-950 font-black rounded-full uppercase tracking-wider">
                      Camera Live
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Scan physical documents, station codes, or scavenger hunt tags
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsHowToScanOpen(true)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="How to scan help"
                >
                  <Info className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsQuickScannerOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
              
              {/* CAMERA VIEWFINDER & OPTICAL SCANNER */}
              <div className="bg-slate-950 rounded-2xl p-4 text-white text-center relative overflow-hidden border border-slate-800 shadow-inner">
                
                {/* Real Video Element or Viewfinder Box */}
                <div className="w-full h-56 mx-auto bg-slate-900 rounded-xl overflow-hidden relative flex flex-col items-center justify-center border border-slate-800">
                  {/* Real Camera Stream if Active */}
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                      isCameraActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Framing Overlay box */}
                  <div className="w-44 h-44 border-2 border-dashed border-amber-400 rounded-2xl flex flex-col items-center justify-center space-y-2 relative bg-amber-950/20 z-10 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                    {/* Viewfinder Corners */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                    
                    {/* Animated Scanning Beam */}
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#f59e0b] animate-bounce" />

                    <QrCode className="w-10 h-10 text-amber-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-widest bg-slate-900/80 px-2 py-0.5 rounded-md">
                      {isCameraActive ? 'Align QR in Box' : 'Optical Scanner Ready'}
                    </span>
                  </div>

                  {/* Fallback info when camera permissions aren't active */}
                  {cameraPermissionError && !isCameraActive && (
                    <div className="absolute inset-x-4 bottom-3 z-20 bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 text-slate-300 text-[11px]">
                      <span className="text-amber-400 font-bold">Camera Simulator Mode: </span>
                      {cameraPermissionError} Use test buttons or type tag below.
                    </div>
                  )}

                  {/* Camera Controls Bar */}
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-700/60">
                    <button
                      type="button"
                      onClick={handleToggleTorch}
                      className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        isTorchOn ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                      title="Toggle Torch / Flashlight"
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
                      title="Switch Camera (Front/Rear)"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-2.5">
                  Position printed worksheet, station tag, or textbook QR code inside the viewfinder.
                </p>
              </div>

              {/* RESOLVED RESULT CARD (If matched) */}
              {scanResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                        {scanResult.type === 'doc' ? 'Document Located' : 'Touchpoint / Scavenger Station Recognized'}
                      </h4>
                      <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                        {scanResult.title || scanResult.message}
                      </p>
                      {scanResult.message && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          {scanResult.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteResultAction}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>
                      {scanResult.type === 'doc' ? 'Open Document Now' : 'Launch Scavenger Hunt / Station Portal'}
                    </span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* MANUAL QR / SHORT CODE INPUT */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Enter Code, URL, or Station ID</span>
                  <span className="text-[10px] text-slate-400 font-normal">e.g. doc-1, station-1, soc-bio72</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={scannerInputText}
                    onChange={(e) => setScannerInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleResolveScannedCode(scannerInputText);
                      }
                    }}
                    placeholder="Enter short ID or document name..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                  />
                  <button
                    onClick={() => handleResolveScannedCode(scannerInputText)}
                    disabled={!scannerInputText.trim() || isResolvingScan}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl min-h-[44px] flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Scan className="w-4 h-4" />
                    <span>Scan</span>
                  </button>
                </div>
              </div>

              {/* INSTANT DEMO SCAN BUTTONS */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  1-Click Instant Camera Scan Testing:
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  {/* Test 1: Workspace Document */}
                  {documents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleResolveScannedCode(documents[0].id)}
                      className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition text-xs group cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 group-hover:text-emerald-700">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate">Latest Lesson Doc</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {documents[0].title}
                      </p>
                    </button>
                  )}

                  {/* Test 2: Scavenger Hunt Station */}
                  <button
                    type="button"
                    onClick={() => handleResolveScannedCode('station-1')}
                    className="p-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-left transition text-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 group-hover:text-amber-700">
                      <Compass className="w-3.5 h-3.5 text-amber-600" />
                      <span>Scavenger Station #1</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      Classroom Station Hunt Tag
                    </p>
                  </button>

                  {/* Test 3: Socratic AI Tutor */}
                  <button
                    type="button"
                    onClick={() => handleResolveScannedCode('soc-bio72')}
                    className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition text-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 group-hover:text-blue-700">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Socratic AI Tutor</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      Socratic Guided Touchpoint
                    </p>
                  </button>

                  {/* Test 4: Open Scavenger Hunt Studio */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenQRMapping) onOpenQRMapping();
                      setIsQuickScannerOpen(false);
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl text-left transition text-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 group-hover:text-purple-700">
                      <QrCode className="w-3.5 h-3.5 text-purple-600" />
                      <span>Scavenger Hunt Studio</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      Create & Map QR Code Station
                    </p>
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}

      {/* SCANNED STATION PORTAL MODAL */}
      <ScannedStationPortalModal
        isOpen={isStationPortalOpen}
        onClose={() => setIsStationPortalOpen(false)}
        shortId={scannedPortalShortId}
        onLaunchTutor={(docTitle, prompt) => {
          setIsStationPortalOpen(false);
          if (onOpenAITutor) onOpenAITutor();
        }}
        onLaunchAdaptive={() => {
          setIsStationPortalOpen(false);
          if (onOpenQRMapping) onOpenQRMapping();
        }}
      />

      {/* HOW TO SCAN INSTRUCTIONS MODAL */}
      <HowToScanModal
        isOpen={isHowToScanOpen}
        onClose={() => setIsHowToScanOpen(false)}
        onOpenScanner={() => {
          setIsHowToScanOpen(false);
          setIsQuickScannerOpen(true);
        }}
        onOpenSamplePortal={() => {
          setIsHowToScanOpen(false);
          setScannedPortalShortId('station-1');
          setIsStationPortalOpen(true);
        }}
      />

    </div>
  );
}
