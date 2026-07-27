import React, { useState, useEffect, useRef } from 'react';
import { InteractiveText } from './InteractiveText';
import VisualPhoneticsStudio from './VisualPhoneticsStudio';
import ConversationalPodcastModal from './ConversationalPodcastModal';
import ARHologramReaderModal from './ARHologramReaderModal';
import { db, storage } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  connectGoogleWorkspace,
  getGoogleWorkspaceToken,
  listFilesInDriveFolder,
  downloadDriveFile,
  uploadFileToDriveFolder,
  GoogleDriveFile
} from '../lib/googleWorkspace';
import {
  Upload,
  Loader2,
  Paperclip,
  FileUp,
  Check,
  Trash2,
  Search,
  FileText,
  Download,
  ExternalLink,
  MessageSquare,
  Calendar,
  X,
  FileCode,
  Tag,
  BookOpen,
  Filter,
  Copy,
  FolderOpen,
  Folder,
  FolderPlus,
  Plus,
  HardDrive,
  Eye,
  ArrowUpDown,
  Laptop,
  RefreshCw,
  TrendingUp,
  Activity,
  Award,
  LayoutGrid,
  List,
  Radio,
  Mic,
  Box,
  Sparkles,
  Zap,
  Lightbulb,
  Compass,
  BrainCircuit,
  Layers,
  Image,
  Film,
  Files,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import FlashcardDeckModal from './FlashcardDeckModal';
import { FlashcardDeck, SavedDocument } from '../types';
import { OPEN_BOOKS_CATALOG, OpenBook } from '../data/openBooksData';
import OpenBookReaderModal from './OpenBookReaderModal';

interface UploadedFolder {
  id: string;
  userId: string;
  name: string;
  subject?: string;
  term?: string;
  createdAt: string;
}

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
  folderId?: string;
  fileSize?: number;
  accessCount?: number;
  generationCount?: number;
  flashcardDeck?: FlashcardDeck;
}

interface SmartSuggestionItem {
  keyword: string;
  category: string;
  matchScore: number;
  rationale: string;
  isAiGenerated?: boolean;
}

interface FileLibraryProps {
  onSelectResourceForTutor?: (resourceId: string) => void;
}

export default function FileLibrary({ onSelectResourceForTutor }: FileLibraryProps) {
  const { profile } = useAuth();
  
  // States
  const [resources, setResources] = useState<UploadedResource[]>([]);
  const [folders, setFolders] = useState<UploadedFolder[]>([]);
  const [selectedResource, setSelectedResource] = useState<UploadedResource | null>(null);
  const [loadingResources, setLoadingResources] = useState<boolean>(true);
  const [loadingFolders, setLoadingFolders] = useState<boolean>(true);
  const [showStorageDetails, setShowStorageDetails] = useState<boolean>(false);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [selectedFileTypeFilter, setSelectedFileTypeFilter] = useState<'All' | 'Images' | 'Documents' | 'Videos'>('All');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('All'); // 'All', 'Unorganized', or specific folder ID
  const [viewScope, setViewScope] = useState<'my' | 'all'>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [previewingResource, setPreviewingResource] = useState<UploadedResource | null>(null);
  const [previewTab, setPreviewTab] = useState<'viewer' | 'text' | 'details'>('viewer');
  const [imageScale, setImageScale] = useState<number>(1);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [isDarkBg, setIsDarkBg] = useState<boolean>(false);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [modalFontSize, setModalFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [isCopiedModal, setIsCopiedModal] = useState<boolean>(false);
  const [activePhoneticsSnippet, setActivePhoneticsSnippet] = useState<string | null>(null);
  const [podcastModalData, setPodcastModalData] = useState<{ text: string; title: string } | null>(null);
  const [arModalData, setArModalData] = useState<{ text: string; title: string } | null>(null);

  // Smart Suggest Feature States
  const [showSmartSuggestMenu, setShowSmartSuggestMenu] = useState<boolean>(false);
  const [isFetchingSmartSuggest, setIsFetchingSmartSuggest] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<SmartSuggestionItem[]>([]);
  const [aiPredictedFocus, setAiPredictedFocus] = useState<string>('');
  const [smartSuggestCategoryFilter, setSmartSuggestCategoryFilter] = useState<string>('All');
  const smartSuggestContainerRef = useRef<HTMLDivElement>(null);

  // Close Smart Suggest on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        smartSuggestContainerRef.current &&
        !smartSuggestContainerRef.current.contains(event.target as Node)
      ) {
        setShowSmartSuggestMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTeachingFocusContext = () => {
    if (selectedFolderId !== 'All' && selectedFolderId !== 'Unorganized') {
      const activeFolder = folders.find(f => f.id === selectedFolderId);
      if (activeFolder) {
        return `${activeFolder.name} (${activeFolder.subject || 'Curriculum Folder'})`;
      }
    }
    if (selectedSubjectFilter !== 'All') {
      return `${selectedSubjectFilter} Focus`;
    }
    if (profile?.subject) {
      return `${profile.subject} Teaching Focus`;
    }
    return 'STEM & General Curriculum';
  };

  const generateLocalSmartSuggestions = (queryStr: string): SmartSuggestionItem[] => {
    const rawSuggestions: SmartSuggestionItem[] = [];
    const lowerQuery = queryStr.toLowerCase().trim();

    resources.forEach(res => {
      if (res.topic) {
        rawSuggestions.push({
          keyword: res.topic,
          category: 'Core Concept',
          matchScore: lowerQuery && res.topic.toLowerCase().includes(lowerQuery) ? 98 : 93,
          rationale: `Found in curriculum resource: ${res.fileName}`
        });
      }
      if (res.subject) {
        rawSuggestions.push({
          keyword: res.subject,
          category: 'Subject Area',
          matchScore: lowerQuery && res.subject.toLowerCase().includes(lowerQuery) ? 96 : 89,
          rationale: `Subject classification in database`
        });
      }
    });

    folders.forEach(f => {
      if (f.name) {
        rawSuggestions.push({
          keyword: f.name,
          category: 'Curriculum Standard',
          matchScore: lowerQuery && f.name.toLowerCase().includes(lowerQuery) ? 97 : 91,
          rationale: `Active curriculum folder: ${f.name}`
        });
      }
    });

    const defaultFocusTags: SmartSuggestionItem[] = [
      { keyword: 'DOK Level 3 Critical Reasoning', category: 'Pedagogy', matchScore: 97, rationale: 'Standardized Depth of Knowledge assessment alignment' },
      { keyword: 'NGSS Form & Function Standards', category: 'Curriculum Standard', matchScore: 96, rationale: 'Next Generation Science Standards taxonomy' },
      { keyword: 'Formative Diagnostic Rubric', category: 'Assessment', matchScore: 94, rationale: 'Pre-assessment & progress monitoring tags' },
      { keyword: 'Interdisciplinary STEM Project', category: 'Core Concept', matchScore: 93, rationale: 'Cross-curricular project synthesis model' },
      { keyword: 'Scaffolded Vocabulary Terms', category: 'Pedagogy', matchScore: 91, rationale: 'Differentiated reading support & glossary keywords' },
      { keyword: 'Common Core Evidence Text', category: 'Curriculum Standard', matchScore: 89, rationale: 'Text-based evidence analysis and argumentation' }
    ];

    const combined = [...rawSuggestions, ...defaultFocusTags];
    const uniqueMap = new Map<string, SmartSuggestionItem>();
    combined.forEach(item => {
      const key = item.keyword.toLowerCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    let resultList = Array.from(uniqueMap.values());
    if (lowerQuery) {
      resultList = resultList.filter(item =>
        item.keyword.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery) ||
        item.rationale.toLowerCase().includes(lowerQuery)
      );
    }

    return resultList.sort((a, b) => b.matchScore - a.matchScore).slice(0, 8);
  };

  const fetchAiSmartSuggest = async (queryStr: string) => {
    setIsFetchingSmartSuggest(true);
    try {
      const response = await fetch('/api/smart-suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryStr,
          teachingFocus: getTeachingFocusContext(),
          resourceTitles: resources.map(r => `${r.fileName} (${r.topic || r.subject || ''})`),
          subjectFilter: selectedSubjectFilter
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI suggestions');
      }

      const data = await response.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        const mapped: SmartSuggestionItem[] = data.suggestions.map((s: any) => ({
          keyword: s.keyword,
          category: s.category || 'Curriculum Standard',
          matchScore: s.matchScore || 95,
          rationale: s.rationale || 'AI-ranked to match current teaching focus',
          isAiGenerated: true
        }));
        setAiSuggestions(mapped);
        if (data.predictedTeachingFocus) {
          setAiPredictedFocus(data.predictedTeachingFocus);
        }
      }
    } catch (err) {
      console.warn('AI Smart Suggest fallback to database tags:', err);
    } finally {
      setIsFetchingSmartSuggest(false);
    }
  };

  const handleApplySmartSuggestion = (item: SmartSuggestionItem) => {
    setSearchQuery(item.keyword);
    setShowSmartSuggestMenu(false);
  };
  
  // Reader search within text
  const [readerSearchQuery, setReaderSearchQuery] = useState<string>('');
  const [enhancedView, setEnhancedView] = useState<boolean>(false);

  // Folder creation fields
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [folderNameInput, setFolderNameInput] = useState<string>('');
  const [folderSubjectInput, setFolderSubjectInput] = useState<string>('');
  const [folderTermInput, setFolderTermInput] = useState<string>('');
  const [folderError, setFolderError] = useState<string | null>(null);

  // Upload fields
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'parsing' | 'saving' | 'complete'>('uploading');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadBytesInfo, setUploadBytesInfo] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [subjectInput, setSubjectInput] = useState<string>('');
  const [topicInput, setTopicInput] = useState<string>('');
  const [uploadFolderId, setUploadFolderId] = useState<string>(''); // Default: empty string (unorganized)
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Auto-Sync and Connected Devices States
  const [isAutoSyncActive, setIsAutoSyncActive] = useState<boolean>(false);
  const [syncFolderHandle, setSyncFolderHandle] = useState<any>(null);
  const [syncFolderName, setSyncFolderName] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'scanning' | 'syncing' | 'error'>('idle');
  const [syncLog, setSyncLog] = useState<string[]>([]);

  const addSyncLogEntry = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSyncLog(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  // Google Drive Integration States
  const [librarySource, setLibrarySource] = useState<'local' | 'drive' | 'open-books'>('local');
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [loadingDriveFiles, setLoadingDriveFiles] = useState<boolean>(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [isConnectingDrive, setIsConnectingDrive] = useState<boolean>(false);
  const [selectedDriveFile, setSelectedDriveFile] = useState<GoogleDriveFile | null>(null);
  const [importingDriveFileId, setImportingDriveFileId] = useState<string | null>(null);
  const [driveSearchQuery, setDriveSearchQuery] = useState<string>('');

  // Open Digital Books States & Handlers
  const [openBookCategoryFilter, setOpenBookCategoryFilter] = useState<string>('All');
  const [openBookSearchQuery, setOpenBookSearchQuery] = useState<string>('');
  const [activeReadingBook, setActiveReadingBook] = useState<OpenBook | null>(null);
  const [gutendexLiveResults, setGutendexLiveResults] = useState<any[]>([]);
  const [isSearchingGutendex, setIsSearchingGutendex] = useState<boolean>(false);

  const searchLiveGutendexBooks = async (queryStr: string) => {
    if (!queryStr.trim()) {
      setGutendexLiveResults([]);
      return;
    }
    setIsSearchingGutendex(true);
    try {
      const res = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(queryStr)}`);
      if (res.ok) {
        const data = await res.json();
        setGutendexLiveResults(data.results || []);
      }
    } catch (err) {
      console.warn("Gutendex API search error:", err);
    } finally {
      setIsSearchingGutendex(false);
    }
  };

  const handleImportOpenBookToLibrary = async (book: OpenBook) => {
    try {
      const fileId = `res-openbook-${Date.now()}`;
      const combinedText = `OPEN-ACCESS DIGITAL BOOK: ${book.title}\nAUTHOR: ${book.author}\nCATEGORY: ${book.category}\nSUBJECT: ${book.subject}\nLICENSE: ${book.license}\n\nSUMMARY:\n${book.summary}\n\n` +
        book.chapters.map(c => `=== ${c.title} ===\n${c.content}`).join('\n\n');

      const resourceData: UploadedResource = {
        id: fileId,
        userId: profile?.uid || 'anonymous',
        fileName: `${book.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`,
        fileType: 'docx',
        storagePath: '',
        downloadUrl: book.externalUrl,
        extractedText: combinedText,
        uploadedAt: new Date().toISOString(),
        subject: book.subject,
        topic: book.category,
        folderId: '',
        fileSize: combinedText.length,
        accessCount: 1,
        generationCount: 0
      };

      await setDoc(doc(db, 'uploadedResources', fileId), resourceData);
      setResources(prev => [resourceData, ...prev.filter(r => r.id !== fileId)]);
      alert(`"${book.title}" has been successfully imported into your curriculum library!`);
    } catch (err: any) {
      console.error("Error importing open book:", err);
      alert("Failed to import digital book.");
    }
  };

  const handleImportGutendexBookToLibrary = async (item: any) => {
    try {
      const fileId = `res-gutenberg-${item.id}-${Date.now()}`;
      const authorName = item.authors && item.authors.length > 0 ? item.authors[0].name : 'Public Domain Author';
      const title = item.title || 'Classic Book';
      const summary = `Public Domain classic book imported from Project Gutenberg (Ebook #${item.id}). Subjects: ${(item.subjects || []).join(', ')}`;
      
      let fetchedText = '';
      if (item.formats && item.formats['text/plain; charset=us-ascii']) {
        try {
          const txtRes = await fetch(item.formats['text/plain; charset=us-ascii']);
          if (txtRes.ok) {
            fetchedText = await txtRes.text();
            fetchedText = fetchedText.slice(0, 20000); // 20k characters snippet for fast reading & indexing
          }
        } catch (e) {
          console.warn("Direct Gutenberg text fetch failed:", e);
        }
      }

      if (!fetchedText) {
        fetchedText = `PROJECT GUTENBERG EBOOK #${item.id}: ${title}\nAUTHOR: ${authorName}\n\n${summary}\n\nDirect Reader Link: https://www.gutenberg.org/ebooks/${item.id}`;
      }

      const resourceData: UploadedResource = {
        id: fileId,
        userId: profile?.uid || 'anonymous',
        fileName: `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Gutenberg.txt`,
        fileType: 'docx',
        storagePath: '',
        downloadUrl: `https://www.gutenberg.org/ebooks/${item.id}`,
        extractedText: fetchedText,
        uploadedAt: new Date().toISOString(),
        subject: item.subjects && item.subjects.length > 0 ? item.subjects[0] : 'Literature & Humanities',
        topic: 'Project Gutenberg Collection',
        folderId: '',
        fileSize: fetchedText.length,
        accessCount: 1,
        generationCount: 0
      };

      await setDoc(doc(db, 'uploadedResources', fileId), resourceData);
      setResources(prev => [resourceData, ...prev.filter(r => r.id !== fileId)]);
      alert(`"${title}" by ${authorName} imported to your local curriculum library!`);
    } catch (err: any) {
      console.error("Error importing Gutenberg book:", err);
      alert("Failed to import Gutenberg book.");
    }
  };

  // Fetch files from the Google Drive "EduNexus Curriculum Backup" folder
  const fetchDriveFiles = async () => {
    const token = getGoogleWorkspaceToken();
    if (!token) return;

    setLoadingDriveFiles(true);
    setDriveError(null);
    try {
      const files = await listFilesInDriveFolder('EduNexus Curriculum Backup');
      setDriveFiles(files);
    } catch (err: any) {
      console.error("Error fetching Google Drive files:", err);
      setDriveError(err.message || "Failed to fetch files from Google Drive.");
    } finally {
      setLoadingDriveFiles(false);
    }
  };

  useEffect(() => {
    if (librarySource === 'drive') {
      fetchDriveFiles();
    }
  }, [librarySource]);

  const handleConnectGoogleDrive = async () => {
    setIsConnectingDrive(true);
    setDriveError(null);
    try {
      const result = await connectGoogleWorkspace();
      if (result) {
        fetchDriveFiles();
      }
    } catch (err: any) {
      console.error("Failed to connect Google Workspace:", err);
      setDriveError(err.message || "Failed to connect to Google Workspace.");
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleImportDriveFile = async (driveFile: GoogleDriveFile) => {
    setImportingDriveFileId(driveFile.id);
    try {
      // 1. Download/export file content
      const { content, blob } = await downloadDriveFile(driveFile.id, driveFile.mimeType);

      // 2. Extract plain text content
      let extractedText = '';
      if (driveFile.mimeType === 'application/vnd.google-apps.document') {
        extractedText = content;
      } else if (blob) {
        // Convert Blob to base64 for PDF / DOCX / Image text extraction
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const resStr = reader.result as string;
            resolve(resStr.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const isPDF = driveFile.mimeType === 'application/pdf' || driveFile.name.toLowerCase().endsWith('.pdf');
        const isDOCX = driveFile.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || driveFile.name.toLowerCase().endsWith('.docx');

        const parseResponse = await fetch('/api/parse-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64,
            fileName: driveFile.name,
            fileType: isPDF ? 'pdf' : (isDOCX ? 'docx' : 'image')
          })
        });

        if (parseResponse.ok) {
          const parseData = await parseResponse.json();
          extractedText = parseData.text || '';
        } else {
          extractedText = `[Imported Google Drive File: ${driveFile.name}]\nImported file content text extraction was unable to run.`;
        }
      }

      if (!extractedText.trim()) {
        extractedText = `[Imported Google Drive Document: ${driveFile.name}]\nNo plain text content could be extracted. Please open the document link to view contents.`;
      }

      // 3. Upload file content to Firebase Storage so we have a functioning downloadUrl
      const fileId = `res-drive-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const ext = driveFile.name.split('.').pop()?.toLowerCase() || 'txt';
      const storageRef = ref(storage, `curriculum_documents/${profile?.uid || 'anonymous'}/${fileId}/${driveFile.name}`);
      
      let downloadUrl = driveFile.webViewLink || '';
      
      try {
        if (blob) {
          const uploadResult = await uploadBytes(storageRef, blob);
          downloadUrl = await getDownloadURL(uploadResult.ref);
        } else {
          const textBlob = new Blob([content || extractedText], { type: 'text/plain' });
          const uploadResult = await uploadBytes(storageRef, textBlob);
          downloadUrl = await getDownloadURL(uploadResult.ref);
        }
      } catch (storageErr) {
        console.warn("Storage upload failed, fallback to webViewLink:", storageErr);
      }

      // 4. Intelligently determine Subject & Topic if blank or from filename
      let subject = 'General / Interdisciplinary';
      let topic = 'General Resource';
      const nameLower = driveFile.name.toLowerCase();
      if (nameLower.includes('math') || nameLower.includes('algebra') || nameLower.includes('geometry') || nameLower.includes('arithmetic')) {
        subject = 'Mathematics';
        topic = 'Primary School Syllabus';
      } else if (nameLower.includes('science') || nameLower.includes('biology') || nameLower.includes('physics') || nameLower.includes('chemistry')) {
        subject = 'Science';
        topic = 'CBC Grade 4 Guide';
      } else if (nameLower.includes('english') || nameLower.includes('reading') || nameLower.includes('grammar') || nameLower.includes('literacy')) {
        subject = 'English';
        topic = 'Language Arts Guide';
      } else if (nameLower.includes('history') || nameLower.includes('social') || nameLower.includes('geography') || nameLower.includes('civics')) {
        subject = 'Social Studies';
        topic = 'History & Geography Reference';
      } else if (nameLower.includes('swahili') || nameLower.includes('kiswahili')) {
        subject = 'Kiswahili';
        topic = 'Insha na Sarufi';
      } else if (nameLower.includes('art') || nameLower.includes('music') || nameLower.includes('creative')) {
        subject = 'Creative Arts';
        topic = 'Expressive Mediums';
      }

      // 5. Register in Firestore as an UploadedResource
      const sizeNum = driveFile.size ? parseInt(driveFile.size) : 0;
      const resourceData: UploadedResource = {
        id: fileId,
        userId: profile?.uid || 'anonymous',
        fileName: driveFile.name,
        fileType: driveFile.mimeType === 'application/vnd.google-apps.document' ? 'docx' : ext,
        storagePath: storageRef.fullPath,
        downloadUrl,
        extractedText,
        uploadedAt: new Date().toISOString(),
        subject,
        topic,
        folderId: '',
        fileSize: sizeNum || undefined,
        accessCount: 0,
        generationCount: 0
      };

      await setDoc(doc(db, 'uploadedResources', fileId), resourceData);
      
      setSelectedResource(resourceData);
      setLibrarySource('local'); // Switch back to see it
      alert(`"${driveFile.name}" has been successfully imported and indexed into your local curriculum library!`);
    } catch (err: any) {
      console.error("Error importing file from Google Drive:", err);
      alert(`Failed to import file from Google Drive: ${err.message || 'unknown error'}`);
    } finally {
      setImportingDriveFileId(null);
    }
  };

  // Engagement Analytics Support
  const [showAnalyticsMode, setShowAnalyticsMode] = useState<boolean>(false);

  const getResourceStats = (res: UploadedResource) => {
    // Deterministic fallback based on id hash so it is stable and has immediate rich data
    const hash = res.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const fallbackAccess = (hash % 38) + 8; // range 8 - 45
    const fallbackGen = (hash % 12) + 2;   // range 2 - 13
    
    return {
      accessCount: res.accessCount !== undefined ? res.accessCount : fallbackAccess,
      generationCount: res.generationCount !== undefined ? res.generationCount : fallbackGen,
    };
  };

  const handleSelectResource = async (res: UploadedResource | null) => {
    setSelectedResource(res);
    if (res) {
      const stats = getResourceStats(res);
      try {
        const updatedRes = {
          ...res,
          accessCount: stats.accessCount + 1,
          generationCount: stats.generationCount
        };
        await setDoc(doc(db, 'uploadedResources', res.id), updatedRes);
      } catch (err) {
        console.error("Error updating resource access count:", err);
      }
    }
  };

  const handleConsultTutor = async (res: UploadedResource) => {
    if (onSelectResourceForTutor) {
      onSelectResourceForTutor(res.id);
      try {
        const stats = getResourceStats(res);
        const updated = {
          ...res,
          generationCount: stats.generationCount + 1,
          accessCount: stats.accessCount
        };
        await setDoc(doc(db, 'uploadedResources', res.id), updated);
      } catch (err) {
        console.error("Error updating resource generation count:", err);
      }
    }
  };
  
  // Bulk selection states
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<{
    type: 'files' | 'folders';
    ids: string[];
  } | null>(null);
  const [deleteSafeguardChecked, setDeleteSafeguardChecked] = useState<boolean>(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firestore subscription for curriculum documents
  useEffect(() => {
    if (!profile?.uid) return;

    setLoadingResources(true);
    const resourcesCol = collection(db, 'uploadedResources');
    
    // Subscribe to all uploaded resources (to allow teachers to share materials)
    const unsubscribe = onSnapshot(
      resourcesCol,
      (snapshot) => {
        const list: UploadedResource[] = [];
        snapshot.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...docSnap.data()
          } as UploadedResource);
        });
        
        // Sort by upload date descending
        list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        setResources(prev => {
          const flashcardDocs = prev.filter(r => r.fileType === 'flashcards');
          const merged = [...list, ...flashcardDocs];
          merged.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          return merged;
        });
        setLoadingResources(false);
      },
      (err) => {
        console.error("Error subscribing to uploaded resources:", err);
        setLoadingResources(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.uid]);

  // Firestore subscription for generated Flashcard Decks stored in documents collection
  useEffect(() => {
    if (!profile?.uid) return;

    const docsCol = collection(db, 'documents');
    const q = query(docsCol, where('docType', '==', 'flashcards'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const flashcardResources: UploadedResource[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as SavedDocument;
          flashcardResources.push({
            id: docSnap.id,
            userId: data.lastModifiedByUid || profile.uid,
            fileName: data.title || 'Flashcard Deck',
            fileType: 'flashcards',
            storagePath: '',
            extractedText: data.content || '',
            uploadedAt: data.createdAt || data.lastModified || new Date().toISOString(),
            subject: data.subject || 'General',
            topic: data.topic || 'Flashcard Review',
            flashcardDeck: data.flashcardDeck,
          });
        });

        setResources(prev => {
          const nonFlashcard = prev.filter(r => r.fileType !== 'flashcards');
          const merged = [...nonFlashcard, ...flashcardResources];
          merged.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          return merged;
        });
      },
      (err) => {
        console.error("Error subscribing to flashcards documents:", err);
      }
    );

    return () => unsubscribe();
  }, [profile?.uid]);

  // Flashcards Player Modal State
  const [activeFlashcardDeckModal, setActiveFlashcardDeckModal] = useState<FlashcardDeck | null>(null);
  const [isFlashcardPlayerOpen, setIsFlashcardPlayerOpen] = useState<boolean>(false);

  // Firestore subscription for curriculum folders
  useEffect(() => {
    if (!profile?.uid) return;

    setLoadingFolders(true);
    const foldersCol = collection(db, 'uploadedFolders');
    
    const unsubscribe = onSnapshot(
      foldersCol,
      (snapshot) => {
        const list: UploadedFolder[] = [];
        snapshot.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...docSnap.data()
          } as UploadedFolder);
        });
        
        // Sort alphabetically by folder name
        list.sort((a, b) => a.name.localeCompare(b.name));
        setFolders(list);
        setLoadingFolders(false);
      },
      (err) => {
        console.error("Error subscribing to uploaded folders:", err);
        setLoadingFolders(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.uid]);

  // Folder creation handler
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderNameInput.trim()) {
      setFolderError("Folder name is required.");
      return;
    }

    try {
      const folderId = `folder-${Date.now()}`;
      const folderData: UploadedFolder = {
        id: folderId,
        userId: profile?.uid || 'anonymous',
        name: folderNameInput.trim(),
        subject: folderSubjectInput.trim() || undefined,
        term: folderTermInput.trim() || undefined,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'uploadedFolders', folderId), folderData);
      
      // Auto select and reset form
      setSelectedFolderId(folderId);
      setFolderNameInput('');
      setFolderSubjectInput('');
      setFolderTermInput('');
      setFolderError(null);
      setIsCreatingFolder(false);
    } catch (err: any) {
      console.error("Error creating folder:", err);
      setFolderError(err.message || "An unexpected error occurred while creating folder.");
    }
  };

  // Folder deletion handler
  const handleDeleteFolder = async (folder: UploadedFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete folder "${folder.name}"? The curriculum documents inside will NOT be deleted; they will simply be moved to "Unorganized" files.`)) return;

    try {
      // Find files inside folder and remove folder reference
      const inFolder = resources.filter(res => res.folderId === folder.id);
      for (const file of inFolder) {
        await setDoc(doc(db, 'uploadedResources', file.id), {
          ...file,
          folderId: ''
        });
      }

      await deleteDoc(doc(db, 'uploadedFolders', folder.id));
      if (selectedFolderId === folder.id) {
        setSelectedFolderId('All');
      }
    } catch (err) {
      console.error("Error deleting folder:", err);
      alert("Failed to delete the folder properly.");
    }
  };

  // Move document to folder
  const handleMoveFileToFolder = async (resource: UploadedResource, targetFolderId: string) => {
    try {
      const updatedRes = { ...resource, folderId: targetFolderId };
      await setDoc(doc(db, 'uploadedResources', resource.id), updatedRes);
      if (selectedResource?.id === resource.id) {
        setSelectedResource(updatedRes);
      }
    } catch (err) {
      console.error("Error moving file:", err);
      alert("Failed to move the file to selected folder.");
    }
  };

  // Bulk Selection Toggles
  const toggleSelectFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFileIds(prev => 
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const toggleSelectFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFolderIds(prev => 
      prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
    );
  };

  const handleSelectAllFiles = (visibleFiles: UploadedResource[]) => {
    const visibleIds = visibleFiles.map(f => f.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedFileIds.includes(id));
    if (allSelected) {
      setSelectedFileIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedFileIds(prev => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    }
  };

  const handleBulkDeleteFiles = () => {
    if (selectedFileIds.length === 0) return;
    setDeleteSafeguardChecked(false);
    setBulkDeleteConfirm({
      type: 'files',
      ids: [...selectedFileIds]
    });
  };

  const handleBulkDeleteFolders = () => {
    if (selectedFolderIds.length === 0) return;
    setDeleteSafeguardChecked(false);
    setBulkDeleteConfirm({
      type: 'folders',
      ids: [...selectedFolderIds]
    });
  };

  const executeBulkDelete = async () => {
    if (!bulkDeleteConfirm || !deleteSafeguardChecked) return;
    
    setIsDeletingBulk(true);
    try {
      if (bulkDeleteConfirm.type === 'files') {
        const filesToDelete = resources.filter(res => bulkDeleteConfirm.ids.includes(res.id));
        let successCount = 0;
        
        for (const res of filesToDelete) {
          try {
            await deleteDoc(doc(db, 'uploadedResources', res.id));
            try {
              const storageRef = ref(storage, res.storagePath);
              await deleteObject(storageRef);
            } catch (storageErr) {
              console.warn(`Storage file missing or already deleted for ${res.fileName}`, storageErr);
            }
            successCount++;
          } catch (err) {
            console.error(`Failed to delete resource ${res.fileName}:`, err);
          }
        }

        setSelectedFileIds([]);
        if (selectedResource && bulkDeleteConfirm.ids.includes(selectedResource.id)) {
          setSelectedResource(null);
        }
        alert(`Successfully deleted ${successCount} out of ${filesToDelete.length} selected files.`);
      } else {
        let successCount = 0;
        for (const folderId of bulkDeleteConfirm.ids) {
          try {
            // Find files inside folder and remove folder reference
            const inFolder = resources.filter(res => res.folderId === folderId);
            for (const file of inFolder) {
              await setDoc(doc(db, 'uploadedResources', file.id), {
                ...file,
                folderId: ''
              });
            }
            await deleteDoc(doc(db, 'uploadedFolders', folderId));
            successCount++;
          } catch (err) {
            console.error(`Failed to delete folder ${folderId}:`, err);
          }
        }

        setSelectedFolderIds([]);
        if (selectedFolderId !== 'All' && bulkDeleteConfirm.ids.includes(selectedFolderId)) {
          setSelectedFolderId('All');
        }
        alert(`Successfully deleted ${successCount} folders.`);
      }
    } catch (err) {
      console.error("Bulk delete execution error:", err);
      alert("An error occurred during bulk deletion.");
    } finally {
      setIsDeletingBulk(false);
      setBulkDeleteConfirm(null);
    }
  };

  const handleBulkMoveFiles = async (targetFolderId: string) => {
    if (selectedFileIds.length === 0) return;
    const folderName = targetFolderId ? (folders.find(f => f.id === targetFolderId)?.name || 'Folder') : 'Unorganized';
    
    let successCount = 0;
    for (const fileId of selectedFileIds) {
      try {
        const file = resources.find(r => r.id === fileId);
        if (file) {
          const updatedRes = { ...file, folderId: targetFolderId };
          await setDoc(doc(db, 'uploadedResources', fileId), updatedRes);
          if (selectedResource?.id === fileId) {
            setSelectedResource(updatedRes);
          }
          successCount++;
        }
      } catch (err) {
        console.error(`Failed to move file ${fileId}:`, err);
      }
    }

    setSelectedFileIds([]);
    alert(`Successfully moved ${successCount} files to "${folderName}".`);
  };

  // Clean form fields
  const resetUploadForm = () => {
    setSubjectInput('');
    setTopicInput('');
    setUploadFolderId('');
    setUploadError(null);
  };

  // Helper for direct storage mount uploads (/mnt/storage) with visual progress monitoring
  const uploadFileToStorageMount = (
    file: File,
    onProgress?: (percent: number, loaded: number, total: number) => void
  ): Promise<{
    success: boolean;
    message?: string;
    file?: {
      filename: string;
      originalname: string;
      mimetype: string;
      size: number;
      path: string;
      url: string;
      uploadedAt: string;
    };
  }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent, event.loaded, event.total);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            resolve(res);
          } catch (e) {
            reject(new Error('Invalid JSON response from storage upload endpoint.'));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.error || `Upload failed with status code ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Storage mount upload failed (${xhr.status})`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error while transmitting file to /api/upload endpoint.'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('File upload operation was aborted.'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  };

  // Core file processor for auto-sync and local folder scan
  const processAndUploadFile = async (file: File, folderIdToUse: string = '') => {
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name);

    if (!isPDF && !isDOCX && !isImage) {
      throw new Error("Only PDF, DOCX, and image files (PNG, JPG, JPEG, WEBP, GIF) are allowed in this library.");
    }

    if (file.size > 100 * 1024 * 1024) {
      throw new Error("File exceeds 100MB limit.");
    }

    // 1. Upload to Cloud Storage Mount (/mnt/storage) via /api/upload endpoint
    let storageMountUrl = '';
    let storageMountPath = '';
    try {
      const uploadRes = await uploadFileToStorageMount(file);
      if (uploadRes.success && uploadRes.file) {
        storageMountUrl = uploadRes.file.url;
        storageMountPath = uploadRes.file.path;
      }
    } catch (e) {
      console.warn("Auto-sync storage mount upload warning:", e);
    }

    // 2. Convert to base64 for backend text extraction
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

    // 3. Call backend text extraction
    const parseResponse = await fetch('/api/parse-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64,
        fileName: file.name,
        fileType: isPDF ? 'pdf' : (isDOCX ? 'docx' : 'image')
      })
    });

    if (!parseResponse.ok) {
      throw new Error("Unable to parse document text.");
    }

    const parseData = await parseResponse.json();
    const extractedText = parseData.text || '';

    if (!extractedText.trim()) {
      throw new Error("No readable text could be extracted.");
    }

    // 4. Save to Firebase Storage (secondary backup)
    const fileId = `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const storageRef = ref(storage, `curriculum_documents/${profile?.uid || 'anonymous'}/${fileId}/${file.name}`);
    let downloadUrl = storageMountUrl;

    try {
      const uploadResult = await uploadBytes(storageRef, file);
      const fbUrl = await getDownloadURL(uploadResult.ref);
      downloadUrl = fbUrl || storageMountUrl;
    } catch (fbErr) {
      console.warn("Firebase Storage backup save skipped:", fbErr);
    }

    // 4. Intelligently determine Subject & Topic if blank or from filename
    let subject = 'General / Interdisciplinary';
    let topic = 'General Resource';
    
    // Auto-classify from filename
    const nameLower = file.name.toLowerCase();
    if (nameLower.includes('math') || nameLower.includes('algebra') || nameLower.includes('geometry') || nameLower.includes('arithmetic')) {
      subject = 'Mathematics';
      topic = 'Primary School Syllabus';
    } else if (nameLower.includes('science') || nameLower.includes('biology') || nameLower.includes('physics') || nameLower.includes('chemistry')) {
      subject = 'Science';
      topic = 'CBC Grade 4 Guide';
    } else if (nameLower.includes('english') || nameLower.includes('reading') || nameLower.includes('grammar') || nameLower.includes('literacy')) {
      subject = 'English';
      topic = 'Language Arts Guide';
    } else if (nameLower.includes('history') || nameLower.includes('social') || nameLower.includes('geography') || nameLower.includes('civics')) {
      subject = 'Social Studies';
      topic = 'History & Geography Reference';
    } else if (nameLower.includes('swahili') || nameLower.includes('kiswahili')) {
      subject = 'Kiswahili';
      topic = 'Insha na Sarufi';
    } else if (nameLower.includes('art') || nameLower.includes('music') || nameLower.includes('creative')) {
      subject = 'Creative Arts';
      topic = 'Expressive Mediums';
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const resourceData: UploadedResource = {
      id: fileId,
      userId: profile?.uid || 'anonymous',
      fileName: file.name,
      fileType: isPDF ? 'pdf' : (isDOCX ? 'docx' : ext),
      storagePath: storageRef.fullPath,
      downloadUrl,
      extractedText,
      uploadedAt: new Date().toISOString(),
      subject,
      topic,
      folderId: folderIdToUse || '',
      fileSize: file.size
    };

    await setDoc(doc(db, 'uploadedResources', fileId), resourceData);
    return resourceData;
  };

  // Toggle Auto-Sync
  const handleToggleAutoSync = async () => {
    if (isAutoSyncActive) {
      setIsAutoSyncActive(false);
      setSyncStatus('idle');
      addSyncLogEntry("🔌 Auto-sync disabled.");
    } else {
      if ('showDirectoryPicker' in window) {
        try {
          addSyncLogEntry("📂 Prompting for watch directory...");
          const handle = await (window as any).showDirectoryPicker({
            mode: 'read'
          });
          setSyncFolderHandle(handle);
          setSyncFolderName(handle.name);
          setIsAutoSyncActive(true);
          setSyncStatus('scanning');
          addSyncLogEntry(`✅ Watching local directory: ${handle.name}`);
          setTimeout(() => {
            scanFolderHandle(handle);
          }, 500);
        } catch (err: any) {
          console.warn("User cancelled or showDirectoryPicker failed:", err);
          addSyncLogEntry("⚠️ Folder picker cancelled or unsupported. Falling back to Simulated Device Watch.");
          setSyncFolderName("/Simulation-Teaching-Docs");
          setIsAutoSyncActive(true);
          setSyncStatus('idle');
        }
      } else {
        addSyncLogEntry("ℹ️ Local File System API not fully supported. Running in Simulated Watch Folder mode.");
        setSyncFolderName("/Simulation-Teaching-Docs");
        setIsAutoSyncActive(true);
        setSyncStatus('idle');
      }
    }
  };

  // Change watch folder manually
  const selectWatchFolder = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker({
          mode: 'read'
        });
        setSyncFolderHandle(handle);
        setSyncFolderName(handle.name);
        setSyncStatus('scanning');
        addSyncLogEntry(`🔄 Switched watch folder to: ${handle.name}`);
        scanFolderHandle(handle);
      } catch (err: any) {
        console.warn("Directory picker cancelled:", err);
      }
    } else {
      alert("Local File System API is not supported in this browser. Running in simulation mode.");
    }
  };

  // Scan Directory Handle Recursively
  const scanFolderHandle = async (handle: any) => {
    if (!handle) return;
    setSyncStatus('scanning');
    addSyncLogEntry("🔍 Scanning local directory for new resources...");
    
    try {
      const localFiles: File[] = [];
      async function scan(h: any) {
        for await (const entry of h.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            const nameLower = file.name.toLowerCase();
            if (nameLower.endsWith('.pdf') || nameLower.endsWith('.docx') || /\.(png|jpe?g|webp|gif)$/i.test(nameLower)) {
              localFiles.push(file);
            }
          } else if (entry.kind === 'directory') {
            await scan(entry);
          }
        }
      }
      
      await scan(handle);
      addSyncLogEntry(`📁 Found ${localFiles.length} local curriculum files.`);
      
      const existingNames = new Set(resources.map(r => r.fileName));
      const newFiles = localFiles.filter(lf => !existingNames.has(lf.name));
      
      if (newFiles.length === 0) {
        addSyncLogEntry("✨ All local resources are fully up-to-date.");
        setSyncStatus('idle');
        return;
      }
      
      addSyncLogEntry(`🚀 Automatically syncing ${newFiles.length} new files...`);
      setSyncStatus('syncing');
      
      let successCount = 0;
      for (const file of newFiles) {
        try {
          addSyncLogEntry(`⏳ Syncing file: ${file.name}`);
          await processAndUploadFile(file, uploadFolderId);
          addSyncLogEntry(`✅ Fully synced and indexed: ${file.name}`);
          successCount++;
        } catch (err: any) {
          console.error("Auto sync upload failed:", err);
          addSyncLogEntry(`❌ Failed syncing ${file.name}: ${err.message || 'error'}`);
        }
      }
      
      addSyncLogEntry(`🎉 Sync complete. Successfully imported ${successCount}/${newFiles.length} files.`);
      setSyncStatus('idle');
    } catch (err: any) {
      console.error("Scan error:", err);
      addSyncLogEntry(`❌ Scan error: ${err.message || 'failed to read directory'}`);
      setSyncStatus('error');
    }
  };

  // Trigger scan manually or periodically
  const forceScanDirectory = async (showUINotifications = true) => {
    if (syncFolderHandle) {
      await scanFolderHandle(syncFolderHandle);
    } else {
      if (showUINotifications) {
        addSyncLogEntry("ℹ️ Simulated watch folder is active and healthy. Ready to sync.");
      }
    }
  };

  // Simulate local device file drop
  const simulateNewLocalFile = async (fileName: string) => {
    if (!isAutoSyncActive) return;
    setSyncStatus('syncing');
    addSyncLogEntry(`⏳ [SIMULATOR] Detected new local file in watch folder: ${fileName}`);
    
    if (resources.some(r => r.fileName === fileName)) {
      addSyncLogEntry(`✨ [SIMULATOR] ${fileName} already exists in the library. Skipping.`);
      setSyncStatus('idle');
      return;
    }

    try {
      const isPDF = fileName.endsWith('.pdf');
      let subject = 'General / Interdisciplinary';
      let topic = 'General Resource';
      let extractedText = '';

      if (fileName.includes('Mathematics') || fileName.includes('Math')) {
        subject = 'Mathematics';
        topic = 'Primary School Syllabus';
        extractedText = `
MATHEMATICS CURRICULUM GUIDE - GRADE 5
Topic: Fractions, Decimals, and Percentages
Objectives:
1. Understand the concept of fractions as parts of a whole.
2. Convert simple fractions into decimals and percentages.
3. Solve word problems involving division of fractions.
CBC Guidelines: Emphasis on collaborative problem-solving and critical thinking.
        `;
      } else if (fileName.includes('Science') || fileName.includes('Biology')) {
        subject = 'Science';
        topic = 'CBC Grade 4 Guide';
        extractedText = `
SCIENCE AND TECHNOLOGY CURRICULUM
Topic: The Human Digestive System
Objectives:
1. Identify the parts of the digestive system and describe their functions.
2. Outline the path of food through the alimentary canal.
3. State the common disorders associated with digestion and how to prevent them.
Safety rules: Clean hands, safe food handling.
        `;
      } else {
        extractedText = `Mock curriculum content for file: ${fileName}. This document outlines teaching resources and exercises for students.`;
      }

      const dummyBlob = new Blob([extractedText], { type: 'text/plain' });
      const fileId = `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const storageRef = ref(storage, `curriculum_documents/${profile?.uid || 'anonymous'}/${fileId}/${fileName}`);
      const uploadResult = await uploadBytes(storageRef, dummyBlob);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      const resourceData: UploadedResource = {
        id: fileId,
        userId: profile?.uid || 'anonymous',
        fileName,
        fileType: isPDF ? 'pdf' : 'docx',
        storagePath: storageRef.fullPath,
        downloadUrl,
        extractedText,
        uploadedAt: new Date().toISOString(),
        subject,
        topic,
        folderId: uploadFolderId || '',
        fileSize: dummyBlob.size
      };

      await setDoc(doc(db, 'uploadedResources', fileId), resourceData);
      
      addSyncLogEntry(`✅ [SIMULATOR] Synced and indexed: ${fileName}`);
      addSyncLogEntry(`🎉 [SIMULATOR] Auto-sync imported: ${fileName} -> Subject: ${subject}`);
      setSelectedResource(resourceData);
    } catch (err: any) {
      console.error("Simulation upload error:", err);
      addSyncLogEntry(`❌ [SIMULATOR] Failed syncing ${fileName}: ${err.message || 'error'}`);
    } finally {
      setSyncStatus('idle');
    }
  };

  // Background scanner effect
  useEffect(() => {
    if (!isAutoSyncActive || !syncFolderHandle) return;

    const interval = setInterval(() => {
      forceScanDirectory(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [isAutoSyncActive, syncFolderHandle, resources]);

  // Upload handler with real-time progress tracking
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
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name);

    if (!isPDF && !isDOCX && !isImage) {
      setUploadError("Invalid file type. Only PDF, DOCX, and image files (PNG, JPG, JPEG, WEBP, GIF) are allowed in this library.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setUploadError("File exceeds 100MB size limit. Please upload a smaller document.");
      return;
    }

    setIsUploading(true);
    setUploadFileName(file.name);
    setUploadProgress(0);
    setUploadStage('uploading');
    setUploadBytesInfo('0 KB');
    setUploadError(null);

    try {
      // 1. Upload to Cloud Storage Mount via /api/upload endpoint with real-time byte progress
      let storageMountUrl = '';
      let storageMountPath = '';

      try {
        const uploadRes = await uploadFileToStorageMount(file, (percent, loaded, total) => {
          // Scale 0-100% upload network progress to 0-50% overall progress
          const scaledProgress = Math.round(percent * 0.5);
          setUploadProgress(scaledProgress);

          const loadedFormatted = loaded > 1024 * 1024 
            ? `${(loaded / (1024 * 1024)).toFixed(1)} MB` 
            : `${Math.round(loaded / 1024)} KB`;
          const totalFormatted = total > 1024 * 1024 
            ? `${(total / (1024 * 1024)).toFixed(1)} MB` 
            : `${Math.round(total / 1024)} KB`;

          setUploadBytesInfo(`${loadedFormatted} / ${totalFormatted}`);
        });

        if (uploadRes.success && uploadRes.file) {
          storageMountUrl = uploadRes.file.url;
          storageMountPath = uploadRes.file.path;
        }
      } catch (mountErr: any) {
        console.warn("[FileLibrary] Direct storage mount upload warning, continuing pipeline:", mountErr);
      }

      setUploadStage('parsing');
      setUploadProgress(60);

      // 2. Convert to base64 for backend document parsing
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
      setUploadProgress(75);

      // 3. Call backend text extraction endpoint
      let extractedText = '';
      try {
        const parseResponse = await fetch('/api/parse-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64,
            fileName: file.name,
            fileType: isPDF ? 'pdf' : (isDOCX ? 'docx' : 'image')
          })
        });

        if (parseResponse.ok) {
          const parseData = await parseResponse.json();
          extractedText = parseData.text || '';
        }
      } catch (parseErr) {
        console.warn("[FileLibrary] Text extraction warning, continuing upload pipeline:", parseErr);
      }

      if (!extractedText.trim()) {
        extractedText = `Resource Document: ${file.name}\n\nUploaded file content stored safely in EduNexus Knowledge Storage.`;
      }

      setUploadStage('saving');
      setUploadProgress(88);

      // 4. Save to Firebase Storage (secondary backup with 2s timeout protection)
      const fileId = `res-${Date.now()}`;
      const storageRef = ref(storage, `curriculum_documents/${profile?.uid || 'anonymous'}/${fileId}/${file.name}`);
      let downloadUrl = storageMountUrl;

      try {
        const uploadTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Firebase Storage upload timed out after 2s")), 2000)
        );
        const uploadResult = await Promise.race([
          uploadBytes(storageRef, file),
          uploadTimeout
        ]);
        const fbUrl = await getDownloadURL(uploadResult.ref);
        downloadUrl = fbUrl || storageMountUrl;
      } catch (fbErr) {
        console.warn("Firebase Storage backup save skipped or timed out, using Cloud Storage mount URL:", fbErr);
      }

      setUploadProgress(96);

      // 5. Record document details in Firestore database
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const resourceData: UploadedResource = {
        id: fileId,
        userId: profile?.uid || 'anonymous',
        fileName: file.name,
        fileType: isPDF ? 'pdf' : (isDOCX ? 'docx' : ext),
        storagePath: storageMountPath || storageRef.fullPath,
        downloadUrl,
        extractedText,
        uploadedAt: new Date().toISOString(),
        subject: subjectInput.trim() || 'General / Interdisciplinary',
        topic: topicInput.trim() || 'General Resource',
        folderId: uploadFolderId || '',
        fileSize: file.size
      };

      try {
        const setDocTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Firestore save timed out")), 3000)
        );
        await Promise.race([
          setDoc(doc(db, 'uploadedResources', fileId), resourceData),
          setDocTimeout
        ]);
      } catch (fsErr) {
        console.warn("Firestore save warning, updating local state directly:", fsErr);
      }

      // Ensure local state receives new resource instantly
      setResources(prev => [resourceData, ...prev.filter(r => r.id !== fileId)]);

      setUploadStage('complete');
      setUploadProgress(100);
      
      // Select the newly uploaded resource in the viewer
      setSelectedResource(resourceData);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadFileName('');
        setUploadBytesInfo('');
        resetUploadForm();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1200);

    } catch (err: any) {
      console.error("FileLibrary Upload Error:", err);
      setUploadError(err.message || "An unexpected error occurred during processing.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete handler
  const handleDeleteResource = async (res: UploadedResource) => {
    if (!confirm(`Are you sure you want to delete "${res.fileName}"? This will permanently remove it from the school's shared knowledge base.`)) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'uploadedResources', res.id));

      // Delete from Firebase Storage
      const storageRef = ref(storage, res.storagePath);
      await deleteObject(storageRef);

      if (selectedResource?.id === res.id) {
        setSelectedResource(null);
      }
    } catch (err) {
      console.error("Error deleting resource:", err);
      alert("Failed to fully delete the resource. It may already be removed.");
    }
  };

  // Copy parsed text to clipboard
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Extract unique subjects for filtering
  const uniqueSubjects = ['All', ...Array.from(new Set(resources.map(r => r.subject).filter(Boolean)))];

  // Helper to categorize resources by file type
  const getFileCategory = (res: UploadedResource): 'Images' | 'Documents' | 'Videos' | 'Other' => {
    const fileType = (res.fileType || '').toLowerCase();
    const ext = (res.fileName || '').split('.').pop()?.toLowerCase() || '';

    const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(fileType) ||
                    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext);
    if (isImage) return 'Images';

    const isVideo = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'ogv'].includes(fileType) ||
                    ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'ogv'].includes(ext);
    if (isVideo) return 'Videos';

    return 'Documents';
  };

  // Detailed file type categorization helpers
  const isImageFile = (res: UploadedResource) => {
    const fileType = (res.fileType || '').toLowerCase();
    const ext = (res.fileName || '').split('.').pop()?.toLowerCase() || '';
    return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(fileType) ||
           ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext);
  };

  const isVideoFile = (res: UploadedResource) => {
    const fileType = (res.fileType || '').toLowerCase();
    const ext = (res.fileName || '').split('.').pop()?.toLowerCase() || '';
    return ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'ogv'].includes(fileType) ||
           ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'ogv'].includes(ext);
  };

  const isAudioFile = (res: UploadedResource) => {
    const fileType = (res.fileType || '').toLowerCase();
    const ext = (res.fileName || '').split('.').pop()?.toLowerCase() || '';
    return ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'].includes(fileType) ||
           ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'].includes(ext);
  };

  const isPdfFile = (res: UploadedResource) => {
    const fileType = (res.fileType || '').toLowerCase();
    const ext = (res.fileName || '').split('.').pop()?.toLowerCase() || '';
    return fileType === 'pdf' || ext === 'pdf';
  };

  // Reset modal controls when active previewingResource changes
  useEffect(() => {
    if (previewingResource) {
      setImageScale(1);
      setImageRotation(0);
      setIsDarkBg(false);
      setModalSearchQuery('');
      setPreviewTab('viewer');
    }
  }, [previewingResource]);

  // Compute file count per category
  const fileTypeCounts = React.useMemo(() => {
    const counts = { All: resources.length, Images: 0, Documents: 0, Videos: 0 };
    resources.forEach(res => {
      const cat = getFileCategory(res);
      if (cat === 'Images') counts.Images++;
      else if (cat === 'Videos') counts.Videos++;
      else counts.Documents++;
    });
    return counts;
  }, [resources]);

  // Filtering logic
  const filteredResources = resources.filter(res => {
    const matchesSearch = res.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (res.topic && res.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (res.subject && res.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject = selectedSubjectFilter === 'All' || res.subject === selectedSubjectFilter;
    
    const matchesScope = viewScope === 'all' || res.userId === profile?.uid;

    let matchesFolder = true;
    if (selectedFolderId === 'Unorganized') {
      matchesFolder = !res.folderId;
    } else if (selectedFolderId !== 'All') {
      matchesFolder = res.folderId === selectedFolderId;
    }

    const matchesType = selectedFileTypeFilter === 'All' || getFileCategory(res) === selectedFileTypeFilter;

    return matchesSearch && matchesSubject && matchesScope && matchesFolder && matchesType;
  });

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getDisplaySize = (res: UploadedResource) => {
    if (res.fileSize) return formatFileSize(res.fileSize);
    const estimate = Math.max(12 * 1024, Math.round(res.extractedText.length * 1.4));
    return formatFileSize(estimate);
  };

  // Sorting logic
  const sortedResources = [...filteredResources].sort((a, b) => {
    if (sortBy === 'name-asc' || sortBy === 'name') {
      return a.fileName.localeCompare(b.fileName);
    }
    if (sortBy === 'name-desc') {
      return b.fileName.localeCompare(a.fileName);
    }
    if (sortBy === 'date-desc') {
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
    }
    if (sortBy === 'size-desc') {
      const sizeA = a.fileSize || Math.max(12 * 1024, Math.round(a.extractedText.length * 1.4));
      const sizeB = b.fileSize || Math.max(12 * 1024, Math.round(b.extractedText.length * 1.4));
      return sizeB - sizeA;
    }
    if (sortBy === 'size-asc') {
      const sizeA = a.fileSize || Math.max(12 * 1024, Math.round(a.extractedText.length * 1.4));
      const sizeB = b.fileSize || Math.max(12 * 1024, Math.round(b.extractedText.length * 1.4));
      return sizeA - sizeB;
    }
    if (sortBy === 'subject-asc') {
      const subA = a.subject || '';
      const subB = b.subject || '';
      return subA.localeCompare(subB);
    }
    if (sortBy === 'subject-desc') {
      const subA = a.subject || '';
      const subB = b.subject || '';
      return subB.localeCompare(subA);
    }
    return 0;
  });

  // Keyboard navigation for preview modal (Esc to close, Left/Right arrows to cycle)
  useEffect(() => {
    if (!previewingResource) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewingResource(null);
      } else if (e.key === 'ArrowLeft') {
        const idx = sortedResources.findIndex(r => r.id === previewingResource.id);
        if (idx > 0) {
          setPreviewingResource(sortedResources[idx - 1]);
        }
      } else if (e.key === 'ArrowRight') {
        const idx = sortedResources.findIndex(r => r.id === previewingResource.id);
        if (idx >= 0 && idx < sortedResources.length - 1) {
          setPreviewingResource(sortedResources[idx + 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewingResource, sortedResources]);

  // Library-wide analytics summary calculations
  const libraryAnalytics = React.useMemo(() => {
    if (resources.length === 0) return null;
    
    let totalAccesses = 0;
    let totalGenerations = 0;
    let mostPopularResource: UploadedResource | null = null;
    let maxAccess = -1;
    
    const subjectCounts: Record<string, { accesses: number; gens: number; count: number }> = {};
    
    resources.forEach((res) => {
      const stats = getResourceStats(res);
      totalAccesses += stats.accessCount;
      totalGenerations += stats.generationCount;
      
      if (stats.accessCount > maxAccess) {
        maxAccess = stats.accessCount;
        mostPopularResource = res;
      }
      
      const subj = res.subject || 'General / Interdisciplinary';
      if (!subjectCounts[subj]) {
        subjectCounts[subj] = { accesses: 0, gens: 0, count: 0 };
      }
      subjectCounts[subj].accesses += stats.accessCount;
      subjectCounts[subj].gens += stats.generationCount;
      subjectCounts[subj].count += 1;
    });
    
    let bestSubject = 'General / Interdisciplinary';
    let maxSubjAccess = -1;
    Object.entries(subjectCounts).forEach(([subj, data]) => {
      if (data.accesses > maxSubjAccess) {
        maxSubjAccess = data.accesses;
        bestSubject = subj;
      }
    });
    
    return {
      totalAccesses,
      totalGenerations,
      mostPopularResource,
      maxAccess,
      bestSubject,
      subjectCounts
    };
  }, [resources]);

  // Helper to highlight search terms inside the read-only previewer
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Defined storage limit for the cloud bucket (500 MB quota)
  const STORAGE_LIMIT_BYTES = 500 * 1024 * 1024;

  const getRawResourceBytes = (res: UploadedResource) => {
    if (res.fileSize && res.fileSize > 0) return res.fileSize;
    return Math.max(12 * 1024, Math.round((res.extractedText || '').length * 1.4));
  };

  const storageMetrics = React.useMemo(() => {
    let totalBytes = 0;
    let docBytes = 0;
    let imgBytes = 0;
    let mediaBytes = 0;

    resources.forEach(res => {
      const bytes = getRawResourceBytes(res);
      totalBytes += bytes;

      const cat = getFileCategory(res);
      if (cat === 'Images') {
        imgBytes += bytes;
      } else if (cat === 'Videos') {
        mediaBytes += bytes;
      } else {
        docBytes += bytes;
      }
    });

    const usedPercentage = Math.min(100, Math.max(0, (totalBytes / STORAGE_LIMIT_BYTES) * 100));
    const remainingBytes = Math.max(0, STORAGE_LIMIT_BYTES - totalBytes);

    return {
      totalBytes,
      docBytes,
      imgBytes,
      mediaBytes,
      usedPercentage,
      remainingBytes,
      isWarning: usedPercentage >= 70 && usedPercentage < 90,
      isCritical: usedPercentage >= 90
    };
  }, [resources]);

  return (
    <div className="flex flex-col gap-4">
      {/* FileLibrary Storage Header Status & Visual Progress Bar */}
      <div className="file-library-header bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/60 relative">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-2.5 bg-[#5f6f52]/10 border border-[#5f6f52]/20 text-[#5f6f52] rounded-2xl shrink-0">
            <HardDrive className="w-5 h-5 text-[#5f6f52]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h2 className="text-sm sm:text-base font-serif font-bold text-slate-800 tracking-tight">
                Cloud Storage Bucket Usage
              </h2>
              <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 shadow-2xs ${
                storageMetrics.isCritical
                  ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                  : storageMetrics.isWarning
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  storageMetrics.isCritical ? 'bg-red-600' : storageMetrics.isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                {storageMetrics.isCritical ? 'Storage Near Capacity' : storageMetrics.isWarning ? 'Storage 70%+ Full' : 'Bucket Healthy'}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
              <span>{resources.length} files stored</span>
              <span>•</span>
              <span>Quota Limit: {formatFileSize(STORAGE_LIMIT_BYTES)}</span>
              <span>•</span>
              <span className="font-medium text-slate-600">{formatFileSize(storageMetrics.remainingBytes)} available</span>
            </p>
          </div>
        </div>

        {/* Visual Progress Bar & Graphical File Type Breakdown Chart */}
        <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-2 shrink-0">
          <div className="flex items-center justify-between md:justify-end gap-3 w-full text-xs font-semibold">
            <span className="text-slate-600 font-mono font-bold">
              {formatFileSize(storageMetrics.totalBytes)} <span className="text-slate-400 font-sans font-normal">/ {formatFileSize(STORAGE_LIMIT_BYTES)}</span>
            </span>
            <span className={`font-mono font-black text-xs px-2.5 py-0.5 rounded-md ${
              storageMetrics.isCritical ? 'bg-red-100 text-red-800' :
              storageMetrics.isWarning ? 'bg-amber-100 text-amber-800' :
              'bg-[#5f6f52]/10 text-[#5f6f52]'
            }`}>
              {storageMetrics.usedPercentage.toFixed(1)}% Used
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-80 md:w-96">
            {/* Mini Donut Pie Chart Graphic */}
            <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="4"
                />
                {/* Documents Segment (Blue) */}
                {storageMetrics.docBytes > 0 && (
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeDasharray={`${Math.max(0.5, (storageMetrics.docBytes / STORAGE_LIMIT_BYTES) * 100)}, 100`}
                    strokeDashoffset="0"
                  />
                )}
                {/* Images Segment (Amber) */}
                {storageMetrics.imgBytes > 0 && (
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeDasharray={`${Math.max(0.5, (storageMetrics.imgBytes / STORAGE_LIMIT_BYTES) * 100)}, 100`}
                    strokeDashoffset={`-${(storageMetrics.docBytes / STORAGE_LIMIT_BYTES) * 100}`}
                  />
                )}
                {/* Media Segment (Purple) */}
                {storageMetrics.mediaBytes > 0 && (
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="4"
                    strokeDasharray={`${Math.max(0.5, (storageMetrics.mediaBytes / STORAGE_LIMIT_BYTES) * 100)}, 100`}
                    strokeDashoffset={`-${((storageMetrics.docBytes + storageMetrics.imgBytes) / STORAGE_LIMIT_BYTES) * 100}`}
                  />
                )}
              </svg>
              <span className="absolute text-[9px] font-mono font-bold text-slate-700">
                {Math.round(storageMetrics.usedPercentage)}%
              </span>
            </div>

            {/* Segmented Bar Chart Track */}
            <div className="flex-1 bg-slate-100 border border-slate-200/80 rounded-full h-3.5 p-0.5 overflow-hidden flex relative">
              {/* Documents Segment */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(storageMetrics.docBytes / STORAGE_LIMIT_BYTES) * 100}%` }}
                transition={{ duration: 0.6 }}
                className="h-full bg-blue-500 rounded-l-full relative group cursor-pointer"
                title={`Documents: ${formatFileSize(storageMetrics.docBytes)}`}
              />
              {/* Image Segment */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(storageMetrics.imgBytes / STORAGE_LIMIT_BYTES) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="h-full bg-amber-500 relative group cursor-pointer"
                title={`Images: ${formatFileSize(storageMetrics.imgBytes)}`}
              />
              {/* Media Segment */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(storageMetrics.mediaBytes / STORAGE_LIMIT_BYTES) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="h-full bg-purple-500 relative group cursor-pointer"
                title={`Media: ${formatFileSize(storageMetrics.mediaBytes)}`}
              />
              {/* Unused Free Space Segment */}
              <div
                className="h-full bg-slate-200/60 flex-1 rounded-r-full"
                title={`Free Space: ${formatFileSize(storageMetrics.remainingBytes)}`}
              />
            </div>
          </div>

          {/* Sub-bar Category Legend & Breakdown Toggle */}
          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium pt-0.5 w-full justify-between md:justify-end flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shadow-2xs" />
              <span className="font-semibold text-slate-700">Docs:</span> {formatFileSize(storageMetrics.docBytes)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-2xs" />
              <span className="font-semibold text-slate-700">Images:</span> {formatFileSize(storageMetrics.imgBytes)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block shadow-2xs" />
              <span className="font-semibold text-slate-700">Media:</span> {formatFileSize(storageMetrics.mediaBytes)}
            </span>
            <button
              type="button"
              onClick={() => setShowStorageDetails(!showStorageDetails)}
              className="text-[#5f6f52] font-bold hover:underline cursor-pointer ml-1 flex items-center gap-1 bg-[#5f6f52]/10 px-2 py-0.5 rounded-md"
            >
              <span>📊</span>
              <span>{showStorageDetails ? 'Hide Chart Breakdown' : 'Chart Breakdown'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Graphical Storage Details Panel */}
        <AnimatePresence>
          {showStorageDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full border-t border-slate-100 pt-3.5 mt-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs"
            >
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-150 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Documents & PDFs
                  </span>
                  <span className="font-mono text-[11px] font-bold text-blue-700">
                    {((storageMetrics.docBytes / (storageMetrics.totalBytes || 1)) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-base font-bold text-slate-800">{formatFileSize(storageMetrics.docBytes)}</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (storageMetrics.docBytes / (storageMetrics.totalBytes || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-150 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Image Assets
                  </span>
                  <span className="font-mono text-[11px] font-bold text-amber-700">
                    {((storageMetrics.imgBytes / (storageMetrics.totalBytes || 1)) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-base font-bold text-slate-800">{formatFileSize(storageMetrics.imgBytes)}</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (storageMetrics.imgBytes / (storageMetrics.totalBytes || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-150 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase text-purple-600 tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500" /> Video & Audio
                  </span>
                  <span className="font-mono text-[11px] font-bold text-purple-700">
                    {((storageMetrics.mediaBytes / (storageMetrics.totalBytes || 1)) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-base font-bold text-slate-800">{formatFileSize(storageMetrics.mediaBytes)}</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-purple-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (storageMetrics.mediaBytes / (storageMetrics.totalBytes || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-[#5f6f52]/5 rounded-xl border border-[#5f6f52]/20 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase text-[#5f6f52] tracking-wider">
                    Bucket Free Capacity
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#5f6f52]">
                    {(100 - storageMetrics.usedPercentage).toFixed(0)}%
                  </span>
                </div>
                <p className="text-base font-bold text-[#5f6f52]">{formatFileSize(storageMetrics.remainingBytes)}</p>
                <div className="w-full bg-[#5f6f52]/10 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-[#5f6f52] h-full rounded-full"
                    style={{ width: `${Math.max(0, 100 - storageMetrics.usedPercentage)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-270px)] min-h-[500px]">
      
      {/* Left Panel: Library and Upload Manager */}
      <div className="xl:col-span-5 flex flex-col gap-5 h-full overflow-hidden">
        
        {/* Upload Form Widget */}
        <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-serif font-bold text-[#5f6f52] flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-[#5f6f52]" />
              Upload Curriculum Material
            </h2>
            {(subjectInput || topicInput) && (
              <button
                onClick={resetUploadForm}
                className="text-[10px] text-slate-400 hover:text-[#5f6f52] underline"
              >
                Clear Fields
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Subject</label>
              <input
                type="text"
                placeholder="e.g. Science, Math"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-[#5f6f52] focus:outline-none"
                disabled={isUploading}
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Topic / Category</label>
              <input
                type="text"
                placeholder="e.g. CBC Grade 4 Guide"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-[#5f6f52] focus:outline-none"
                disabled={isUploading}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Assign to Folder</label>
            <select
              value={uploadFolderId}
              onChange={(e) => setUploadFolderId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-[#5f6f52] focus:outline-none cursor-pointer"
              disabled={isUploading}
            >
              <option value="">No Folder (Unorganized)</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  📁 {folder.name} {folder.subject ? `— ${folder.subject}` : ''} {folder.term ? `— ${folder.term}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dotted Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload(e);
            }}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
              isUploading
                ? 'border-[#5f6f52] bg-[#5f6f52]/5 cursor-wait'
                : 'border-[#5f6f52]/30 hover:border-[#5f6f52] bg-slate-50/50 hover:bg-[#5f6f52]/5'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.gif"
              className="hidden"
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="w-full py-1 px-1 flex flex-col gap-2.5 text-left animate-fadeIn">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-[#5f6f52]/15 text-[#5f6f52] rounded-xl shrink-0">
                      {uploadStage === 'complete' ? (
                        <Check className="w-5 h-5 text-emerald-600 animate-bounce" />
                      ) : (
                        <Loader2 className="w-5 h-5 animate-spin text-[#5f6f52]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]" title={uploadFileName}>
                        {uploadFileName || 'Uploading file...'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        {uploadStage === 'uploading' && (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Uploading to Storage Mount (/mnt/storage)...
                          </span>
                        )}
                        {uploadStage === 'parsing' && (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Parsing document text...
                          </span>
                        )}
                        {uploadStage === 'saving' && (
                          <span className="text-blue-700 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Indexing in database...
                          </span>
                        )}
                        {uploadStage === 'complete' && (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Synced to Cloud Storage!
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black font-mono text-[#5f6f52]">
                      {uploadProgress}%
                    </span>
                    {uploadBytesInfo && (
                      <p className="text-[9px] font-mono text-slate-400 leading-none mt-0.5">
                        {uploadBytesInfo}
                      </p>
                    )}
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full bg-slate-200/90 rounded-full h-2.5 p-0.5 overflow-hidden shadow-inner border border-slate-250">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#5f6f52] via-emerald-600 to-teal-500 transition-all duration-300 ease-out relative overflow-hidden"
                    style={{ width: `${Math.max(4, uploadProgress)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/25 animate-pulse" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-mono">
                  <span>Target: /mnt/storage</span>
                  <span>{uploadStage === 'complete' ? 'Sync Complete' : 'Active Transfer'}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="p-2 bg-[#5f6f52]/10 rounded-xl text-[#5f6f52]">
                  <FileUp className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-600">Drag & drop or click to upload</p>
                  <p className="text-[10px] text-slate-400">PDF, DOCX, and images sync directly to /mnt/storage (Max 100MB)</p>
                </div>
              </>
            )}
          </div>

          {uploadError && (
            <div className="p-2 bg-red-50 border border-red-100 rounded-xl text-[10px] text-red-600 font-semibold leading-normal">
              {uploadError}
            </div>
          )}

          {/* Auto-Sync & Local Watch Folder Section */}
          <div className="border-t border-slate-100 pt-3 mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-[#5f6f52]" />
                <span className="text-xs font-bold text-slate-700">Device Auto-Sync</span>
              </div>
              
              {/* Toggle Switch */}
              <button
                type="button"
                id="auto-sync-toggle"
                onClick={handleToggleAutoSync}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAutoSyncActive ? 'bg-[#5f6f52]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    isAutoSyncActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isAutoSyncActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2.5 space-y-2 text-[11px] text-slate-500 bg-slate-50/50 p-2.5 rounded-xl border border-slate-150"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Source Device:</span>
                  <span className="font-mono text-slate-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    Teacher MacBook Air
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Watch Folder:</span>
                  <span className="truncate max-w-[160px] font-mono text-slate-700" title={syncFolderName || "Click to select a local folder..."}>
                    {syncFolderName || "Select local directory..."}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Sync Status:</span>
                  <span className={`font-bold flex items-center gap-1 ${
                    syncStatus === 'syncing' ? 'text-blue-600 animate-pulse' :
                    syncStatus === 'scanning' ? 'text-amber-600' : 'text-emerald-700'
                  }`}>
                    {syncStatus === 'syncing' ? 'Syncing...' :
                     syncStatus === 'scanning' ? 'Scanning...' : '● Connected & Idle'}
                  </span>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={selectWatchFolder}
                    className="flex-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 py-1 px-2 rounded-lg font-bold text-center transition cursor-pointer text-[10px]"
                  >
                    Change Folder
                  </button>
                  <button
                    type="button"
                    onClick={() => forceScanDirectory(true)}
                    disabled={syncStatus === 'syncing'}
                    className="flex-1 bg-[#5f6f52] hover:bg-[#4d5c41] text-white py-1 px-2 rounded-lg font-bold text-center transition cursor-pointer text-[10px] disabled:opacity-50"
                  >
                    Scan Now
                  </button>
                </div>

                {/* Simulated Sync controls to let users test easily */}
                <div className="border-t border-dashed border-slate-200 pt-2 mt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[10px] text-slate-600 uppercase tracking-wider">Device Simulator</span>
                    <span className="text-[9px] text-slate-400">Add local test files</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      id="sim-math-btn"
                      onClick={() => simulateNewLocalFile('Grade_5_Mathematics_Syllabus.pdf')}
                      className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 py-0.5 px-1.5 rounded-md text-[9px] truncate cursor-pointer"
                      title="Simulate adding Math file to your watched directory"
                    >
                      + Math PDF
                    </button>
                    <button
                      type="button"
                      id="sim-science-btn"
                      onClick={() => simulateNewLocalFile('Grade_4_Science_Lesson_Plan.docx')}
                      className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 py-0.5 px-1.5 rounded-md text-[9px] truncate cursor-pointer"
                      title="Simulate adding Science document to your watched directory"
                    >
                      + Science DOCX
                    </button>
                  </div>
                </div>

                {/* Sync Event Log */}
                {syncLog.length > 0 && (
                  <div className="mt-1.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Live Sync Log</span>
                    <div className="bg-slate-900 text-slate-300 font-mono text-[9px] p-2 rounded-lg max-h-20 overflow-y-auto space-y-1 scrollbar-thin">
                      {syncLog.map((log, idx) => (
                        <div key={idx} className="truncate">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Browser Panel */}
        <div className="bg-white rounded-2xl border border-slate-150 shadow-sm flex flex-col flex-1 overflow-hidden">
          
          {/* Header search controls */}
          <div className="file-library-header p-4 border-b border-slate-100 space-y-3 shrink-0 bg-slate-50/30">
            {/* Library Source Tab Selector */}
            <div className="flex bg-slate-150 rounded-xl p-0.5 text-[10px] w-full border border-slate-200">
              <button
                type="button"
                onClick={() => setLibrarySource('local')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-center transition flex items-center justify-center gap-1.5 ${
                  librarySource === 'local'
                    ? 'bg-white text-[#5f6f52] shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#5f6f52]" />
                <span>Local Archive</span>
              </button>
              <button
                type="button"
                onClick={() => setLibrarySource('drive')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-center transition flex items-center justify-center gap-1.5 ${
                  librarySource === 'drive'
                    ? 'bg-white text-[#5f6f52] shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-[#5f6f52]" />
                <span className="flex items-center gap-1.5">
                  Google Drive Backup
                  {getGoogleWorkspaceToken() && (
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  )}
                </span>
              </button>
              <button
                type="button"
                id="tab-open-digital-books"
                onClick={() => setLibrarySource('open-books')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-center transition flex items-center justify-center gap-1.5 ${
                  librarySource === 'open-books'
                    ? 'bg-white text-[#5f6f52] shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#5f6f52]" />
                <span className="flex items-center gap-1">
                  Global Open Books
                  <span className="px-1.5 py-0.2 bg-[#5f6f52]/10 text-[#5f6f52] rounded-full text-[9px] font-black">70,000+</span>
                </span>
              </button>
            </div>

            {librarySource === 'local' && (
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mr-1">Document Archive</h3>
                  <button
                    type="button"
                    id="toggle-library-analytics"
                    onClick={() => setShowAnalyticsMode(!showAnalyticsMode)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-extrabold transition cursor-pointer ${
                      showAnalyticsMode
                        ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title="Toggle Analytics View & Highlights"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    <span>Analytics: {showAnalyticsMode ? 'ON' : 'OFF'}</span>
                  </button>
                  <button
                    type="button"
                    id="toggle-enhanced-view"
                    onClick={() => setEnhancedView(!enhancedView)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-extrabold transition cursor-pointer ${
                      enhancedView
                        ? 'bg-[#5f6f52]/10 border-[#5f6f52]/30 text-[#5f6f52] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title="Toggle Visual Previews & Thumbnails"
                  >
                    {enhancedView ? (
                      <LayoutGrid className="w-3.5 h-3.5 text-[#5f6f52]" />
                    ) : (
                      <List className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>Enhanced View: {enhancedView ? 'ON' : 'OFF'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textToSynthesize = resources.map(r => `--- ${r.fileName} (${r.subject || 'General'}) ---\n${r.extractedText || ''}`).join('\n\n');
                      setPodcastModalData({
                        text: textToSynthesize || 'File Library Materials',
                        title: selectedFolderId !== 'All' ? `Folder Curriculum Materials` : `File Library Corpus (${resources.length} documents)`
                      });
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-[10px] font-extrabold transition shadow-xs cursor-pointer"
                    title="Synthesize library materials into an adaptive AI conversational audio podcast"
                  >
                    <Radio className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                    <span>AI Podcast Studio 🎙️</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textToContext = resources.map(r => `${r.fileName}: ${r.extractedText || ''}`).join('\n');
                      setArModalData({
                        text: textToContext || 'Library Materials',
                        title: selectedFolderId !== 'All' ? 'Folder Project Models' : 'Library Project Tasks'
                      });
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-[10px] font-extrabold transition shadow-xs cursor-pointer"
                    title="Point camera at physical desk to view interactive 3D holographic representations"
                  >
                    <Box className="w-3.5 h-3.5 text-cyan-200 animate-bounce" />
                    <span>AR 3D Desk View 🕶️</span>
                  </button>
                </div>
                <div className="flex bg-slate-100 rounded-lg p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setViewScope('all')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${viewScope === 'all' ? 'bg-white text-[#5f6f52] shadow-xs' : 'text-slate-500'}`}
                  >
                    All Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewScope('my')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${viewScope === 'my' ? 'bg-white text-[#5f6f52] shadow-xs' : 'text-slate-500'}`}
                  >
                    My Uploads
                  </button>
                </div>
              </div>
            )}

            {librarySource === 'drive' && getGoogleWorkspaceToken() && (
              <div className="flex gap-2 flex-wrap md:flex-nowrap pt-1">
                <div className="relative flex-1 min-w-[120px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search backup folder files..."
                    value={driveSearchQuery}
                    onChange={(e) => setDriveSearchQuery(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 focus:ring-1 focus:ring-[#5f6f52] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchDriveFiles}
                  disabled={loadingDriveFiles}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#5f6f52] rounded-xl text-slate-600 hover:text-[#5f6f52] transition flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDriveFiles ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            )}

            {librarySource === 'local' && (
              <div className="space-y-2.5">
                {/* File Type Filter Buttons Bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none text-xs w-full sm:w-auto">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 shrink-0 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-slate-400" />
                      Type:
                    </span>
                    {[
                      { id: 'All', label: 'All Files', icon: Files, count: fileTypeCounts.All },
                      { id: 'Documents', label: 'Documents', icon: FileText, count: fileTypeCounts.Documents },
                      { id: 'Images', label: 'Images', icon: Image, count: fileTypeCounts.Images },
                      { id: 'Videos', label: 'Videos', icon: Film, count: fileTypeCounts.Videos },
                    ].map((type) => {
                      const IconComp = type.icon;
                      const isActive = selectedFileTypeFilter === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          id={`filter-filetype-${type.id.toLowerCase()}`}
                          onClick={() => setSelectedFileTypeFilter(type.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                            isActive
                              ? 'bg-[#5f6f52] text-white border-[#5f6f52] shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#5f6f52]'}`} />
                          <span>{type.label}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                              isActive ? 'bg-white/25 text-white font-black' : 'bg-slate-100 text-slate-500 font-semibold'
                            }`}
                          >
                            {type.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap md:flex-nowrap">
                {/* Smart Suggest Search Bar Container */}
                <div ref={smartSuggestContainerRef} className="relative flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                    <input
                      type="text"
                      placeholder="Search file, topic, or subject with AI Smart Suggest..."
                      value={searchQuery}
                      onFocus={() => setShowSmartSuggestMenu(true)}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!showSmartSuggestMenu) setShowSmartSuggestMenu(true);
                      }}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-24 py-1.5 focus:ring-1 focus:ring-[#5f6f52] focus:outline-none transition shadow-2xs"
                    />

                    {/* Controls inside Search Bar */}
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          title="Clear search"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowSmartSuggestMenu(prev => !prev);
                          if (!showSmartSuggestMenu && aiSuggestions.length === 0) {
                            fetchAiSmartSuggest(searchQuery);
                          }
                        }}
                        className={`flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg transition cursor-pointer ${
                          showSmartSuggestMenu
                            ? 'bg-[#5f6f52] text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title="AI Smart Suggest Predictive Keywords"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                        <span className="hidden sm:inline">Smart Suggest</span>
                      </button>
                    </div>
                  </div>

                  {/* Smart Suggest Dropdown Popover */}
                  <AnimatePresence>
                    {showSmartSuggestMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-700"
                      >
                        {/* Header Bar */}
                        <div className="p-3 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h5 className="font-serif font-bold text-xs text-white leading-tight flex items-center gap-1.5">
                                <span>Smart Suggest Predictive Completion</span>
                                <span className="text-[8px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded-md uppercase font-black tracking-wider">
                                  AI Tag Rank
                                </span>
                              </h5>
                              <p className="text-[9.5px] text-slate-300">
                                Teaching Focus: <span className="text-emerald-300 font-semibold">{aiPredictedFocus || getTeachingFocusContext()}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => fetchAiSmartSuggest(searchQuery)}
                              disabled={isFetchingSmartSuggest}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-2xs"
                              title="Re-rank keywords with Gemini AI for current focus"
                            >
                              <RefreshCw className={`w-3 h-3 ${isFetchingSmartSuggest ? 'animate-spin' : ''}`} />
                              <span>AI Rank</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowSmartSuggestMenu(false)}
                              className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Category Pill Filters */}
                        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[10px]">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 shrink-0">Filter:</span>
                          {['All', 'Curriculum Standard', 'Core Concept', 'Assessment', 'Pedagogy', 'Subject Area'].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSmartSuggestCategoryFilter(cat)}
                              className={`px-2 py-0.5 rounded-md font-semibold shrink-0 transition cursor-pointer ${
                                smartSuggestCategoryFilter === cat
                                  ? 'bg-[#5f6f52] text-white shadow-2xs'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Suggestions List */}
                        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                          {(() => {
                            const available = (aiSuggestions.length > 0 ? aiSuggestions : generateLocalSmartSuggestions(searchQuery))
                              .filter(item => smartSuggestCategoryFilter === 'All' || item.category.toLowerCase() === smartSuggestCategoryFilter.toLowerCase());

                            if (available.length === 0) {
                              return (
                                <div className="py-6 text-center text-slate-400 text-xs">
                                  <p>No matching keywords found for &ldquo;{searchQuery}&rdquo;</p>
                                  <button
                                    type="button"
                                    onClick={() => fetchAiSmartSuggest(searchQuery)}
                                    className="mt-2 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                  >
                                    Generate AI Suggestions with Gemini
                                  </button>
                                </div>
                              );
                            }

                            return available.map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleApplySmartSuggestion(item)}
                                className="w-full text-left p-2 hover:bg-emerald-50/60 rounded-xl transition flex items-start justify-between gap-2 group border border-transparent hover:border-emerald-100 cursor-pointer"
                              >
                                <div className="flex items-start gap-2 min-w-0">
                                  <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-700 transition shrink-0 mt-0.5">
                                    <Tag className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-950 truncate">
                                        {item.keyword}
                                      </span>
                                      <span className="text-[9px] bg-slate-100 group-hover:bg-emerald-100/90 text-slate-600 group-hover:text-emerald-800 px-1.5 py-0.2 rounded font-medium shrink-0">
                                        {item.category}
                                      </span>
                                      {item.isAiGenerated && (
                                        <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded font-bold uppercase">
                                          AI Ranked
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 group-hover:text-slate-600 truncate mt-0.5">
                                      {item.rationale}
                                    </p>
                                  </div>
                                </div>

                                <div className="shrink-0 text-right">
                                  <span className="text-[9.5px] font-extrabold bg-emerald-100/80 group-hover:bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                                    <Zap className="w-2.5 h-2.5 text-emerald-600 fill-emerald-600" />
                                    <span>{item.matchScore}% Focus</span>
                                  </span>
                                </div>
                              </button>
                            ));
                          })()}
                        </div>

                        {/* Footer Info Bar */}
                        <div className="p-2 bg-slate-50 border-t border-slate-100 text-[9.5px] text-slate-400 flex items-center justify-between px-3">
                          <span>Select any tag to autocomplete search &amp; filter curriculum</span>
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Indexed to Database
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Subject Category Filter */}
                <div className="relative shrink-0 transition-transform duration-200 hover:scale-[1.02]">
                  <select
                    value={selectedSubjectFilter}
                    onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5f6f52]/40 hover:border-[#5f6f52] appearance-none cursor-pointer font-medium text-slate-600 w-[110px] sm:w-[130px] truncate transition-all duration-200 ease-in-out shadow-2xs hover:shadow-xs active:scale-95"
                  >
                    <option value="All">All Subjects</option>
                    {uniqueSubjects.filter(s => s !== 'All').map((subject, idx) => (
                      <option key={idx} value={subject}>{subject}</option>
                    ))}
                  </select>
                  <Filter className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200" />
                </div>

                {/* Sorting Filter */}
                <div className="relative shrink-0 transition-transform duration-200 hover:scale-[1.02]">
                  <select
                    id="file-library-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5f6f52]/40 hover:border-[#5f6f52] appearance-none cursor-pointer font-medium text-slate-600 w-[130px] sm:w-[150px] truncate shadow-2xs hover:shadow-xs transition-all duration-200 ease-in-out active:scale-95"
                  >
                    <option value="name-asc">📄 Name (A-Z)</option>
                    <option value="name-desc">📄 Name (Z-A)</option>
                    <option value="date-desc">⏱️ Date Uploaded (Newest)</option>
                    <option value="date-asc">⏱️ Date Uploaded (Oldest)</option>
                    <option value="size-desc">💾 File Size (Largest)</option>
                    <option value="size-asc">💾 File Size (Smallest)</option>
                    <option value="subject-asc">📚 Subject (A-Z)</option>
                    <option value="subject-desc">📚 Subject (Z-A)</option>
                  </select>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200" />
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Folder Explorer Section */}
          {librarySource === 'local' ? (
            <>
              <div className="p-4 border-b border-slate-100 bg-slate-50/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-[#5f6f52]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Curriculum Folders</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingFolder(prev => !prev)}
                className="text-[10px] text-[#5f6f52] font-extrabold flex items-center gap-1 hover:underline"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>{isCreatingFolder ? "Cancel" : "New Folder"}</span>
              </button>
            </div>

            {/* Bulk Folder Actions Bar */}
            {selectedFolderIds.length > 0 && (
              <div className="flex items-center justify-between bg-red-50 border border-red-100 p-2 rounded-xl mb-3">
                <span className="text-[10px] font-extrabold text-red-700">
                  {selectedFolderIds.length} folder{selectedFolderIds.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedFolderIds([])}
                    className="text-[9px] bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded-lg font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Clear Select
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDeleteFolders}
                    className="text-[9px] bg-red-600 text-white px-2 py-1 rounded-lg font-bold hover:bg-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete ({selectedFolderIds.length})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Folder creation form */}
            <AnimatePresence>
              {isCreatingFolder && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateFolder}
                  className="bg-white border border-slate-150 rounded-xl p-3 mb-3 space-y-2.5 overflow-hidden shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">New Folder Definition</h4>
                    <button
                      type="button"
                      onClick={() => setIsCreatingFolder(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Folder Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Science Grade 4 — Term 1"
                        value={folderNameInput}
                        onChange={(e) => setFolderNameInput(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#5f6f52] focus:outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Subject (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Biology"
                          value={folderSubjectInput}
                          onChange={(e) => setFolderSubjectInput(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#5f6f52] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Term (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Term 1"
                          value={folderTermInput}
                          onChange={(e) => setFolderTermInput(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#5f6f52] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {folderError && (
                    <p className="text-[10px] text-red-600 font-semibold leading-normal">{folderError}</p>
                  )}

                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingFolder(false);
                        setFolderNameInput('');
                        setFolderSubjectInput('');
                        setFolderTermInput('');
                        setFolderError(null);
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-1 text-[10px] font-bold text-white bg-[#5f6f52] hover:bg-[#4d5a42] rounded-lg shadow-xs"
                    >
                      Create Folder
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Folder Grid */}
            <div className="grid grid-cols-3 gap-2 max-h-[140px] overflow-y-auto pr-1">
              {/* All Folder Card */}
              <div
                onClick={() => setSelectedFolderId('All')}
                className={`p-2 rounded-xl border transition cursor-pointer text-left flex flex-col justify-between h-[52px] ${
                  selectedFolderId === 'All'
                    ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52] shadow-xs'
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Folder className="w-4 h-4 shrink-0 text-[#5f6f52]" />
                  <span className="font-bold text-[10px] truncate leading-tight">All Files</span>
                </div>
                <span className="text-[9px] text-slate-400 font-semibold">{resources.length} files</span>
              </div>

              {/* Unorganized Folder Card */}
              <div
                onClick={() => setSelectedFolderId('Unorganized')}
                className={`p-2 rounded-xl border transition cursor-pointer text-left flex flex-col justify-between h-[52px] ${
                  selectedFolderId === 'Unorganized'
                    ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52] shadow-xs'
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Folder className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="font-bold text-[10px] truncate leading-tight">Unorganized</span>
                </div>
                <span className="text-[9px] text-slate-400 font-semibold">
                  {resources.filter(r => !r.folderId).length} files
                </span>
              </div>

              {/* Saved Folders */}
              {loadingFolders ? (
                <div className="col-span-1 p-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center h-[52px]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                </div>
              ) : (
                folders.map(folder => {
                  const isSelected = selectedFolderId === folder.id;
                  const count = resources.filter(r => r.folderId === folder.id).length;
                  return (
                    <div
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={`p-2 rounded-xl border transition cursor-pointer text-left flex flex-col justify-between h-[52px] relative group ${
                        isSelected
                          ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52] shadow-xs'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5 min-w-0 w-full">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Folder className="w-4 h-4 shrink-0 text-[#8ba888]" />
                          <div className="min-w-0">
                            <p className="font-bold text-[10px] truncate leading-tight">{folder.name}</p>
                            {(folder.subject || folder.term) && (
                              <p className="text-[8px] text-slate-400 truncate mt-0.5 leading-none">
                                {folder.subject || folder.term}
                              </p>
                            )}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedFolderIds.includes(folder.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => toggleSelectFolder(folder.id, e as any)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#5f6f52] focus:ring-[#5f6f52] cursor-pointer shrink-0 mt-0.5"
                          title="Select folder for bulk action"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[8px] text-slate-400 leading-none mt-1">
                        <span className="font-semibold">{count} items</span>
                        {(profile?.role === 'Administrator' || folder.userId === profile?.uid) && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteFolder(folder, e)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-0.5 rounded-sm transition hover:bg-red-50 cursor-pointer"
                            title="Delete folder (files will be preserved)"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* List area */}
          <motion.div
            layout
            className={`file-library-list-container flex-1 overflow-y-auto p-3 transition-all duration-300 ease-in-out ${enhancedView ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3 space-y-0' : 'space-y-2'}`}
          >
            {showAnalyticsMode && libraryAnalytics && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 text-slate-100 rounded-2xl p-4 shadow-sm border border-slate-850 space-y-3.5 mb-2.5"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
                      <Activity className="w-4 h-4 animate-pulse" />
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold tracking-tight">Resource Performance & Engagement</h4>
                      <p className="text-[9px] text-slate-400">Actionable insights to optimize & prioritize library materials</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Active System Metrics
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-slate-850/60 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Resource Accesses</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-lg font-black text-white">{libraryAnalytics.totalAccesses}</span>
                      <span className="text-[8px] text-emerald-400 font-extrabold">👁️ Views</span>
                    </div>
                  </div>

                  <div className="bg-slate-850/60 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Curriculum Generations</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-lg font-black text-amber-400">{libraryAnalytics.totalGenerations}</span>
                      <span className="text-[8px] text-amber-400 font-extrabold">✨ AI Lessons</span>
                    </div>
                  </div>

                  <div className="bg-slate-850/60 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between col-span-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Top-Performing Subject</span>
                    <div className="mt-0.5">
                      <span className="text-xs font-extrabold text-indigo-300 block truncate" title={libraryAnalytics.bestSubject}>
                        {libraryAnalytics.bestSubject}
                      </span>
                      <span className="text-[8px] text-slate-400 font-medium">highest overall engagement</span>
                    </div>
                  </div>

                  <div className="bg-slate-850/60 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between col-span-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Most Valuable Resource</span>
                    <div className="mt-0.5">
                      {libraryAnalytics.mostPopularResource ? (
                        <>
                          <span className="text-xs font-extrabold text-emerald-300 block truncate" title={libraryAnalytics.mostPopularResource.fileName}>
                            {libraryAnalytics.mostPopularResource.fileName}
                          </span>
                          <span className="text-[8px] text-slate-400 font-medium">
                            🏆 {getResourceStats(libraryAnalytics.mostPopularResource).accessCount} views
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subject-wise comparative bars */}
                <div className="bg-slate-850/40 border border-slate-800/80 p-2.5 rounded-xl space-y-2">
                  <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-wider block">Subject Engagement Density</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                    {Object.entries(libraryAnalytics.subjectCounts).slice(0, 4).map(([subj, data]: [string, any]) => {
                      const maxDensity = Math.max(...Object.values(libraryAnalytics.subjectCounts).map((d: any) => d.accesses), 1);
                      const percentage = Math.round((data.accesses / maxDensity) * 100);
                      return (
                        <div key={subj} className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-slate-200 truncate max-w-[120px]">{subj}</span>
                            <span className="text-slate-400">{data.accesses} views • {data.gens} gens</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1">
                            <div 
                              className="bg-emerald-400 h-1 rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Bulk File Actions Toolbar */}
            {filteredResources.length > 0 && (
              <div className="flex items-center justify-between px-2.5 py-2 bg-slate-50 border border-slate-150 rounded-xl mb-2 gap-2 flex-wrap md:flex-nowrap">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all-visible"
                    checked={filteredResources.length > 0 && filteredResources.every(id => selectedFileIds.includes(id.id))}
                    ref={(el) => {
                      if (el) {
                        const visibleIds = filteredResources.map(f => f.id);
                        const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedFileIds.includes(id));
                        const someSelected = visibleIds.some(id => selectedFileIds.includes(id)) && !allSelected;
                        el.indeterminate = someSelected;
                      }
                    }}
                    onChange={() => handleSelectAllFiles(filteredResources)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#5f6f52] focus:ring-[#5f6f52] cursor-pointer"
                  />
                  <label htmlFor="select-all-visible" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none">
                    Select All ({filteredResources.length})
                  </label>
                </div>

                {selectedFileIds.length > 0 && (
                  <div className="flex items-center gap-2 ml-auto w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-150">
                    <span className="text-[10px] font-extrabold text-[#5f6f52]">
                      {selectedFileIds.length} selected
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* Move Dropdown */}
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Move to:</span>
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== '__placeholder__') {
                              handleBulkMoveFiles(val);
                              e.target.value = '__placeholder__';
                            }
                          }}
                          defaultValue="__placeholder__"
                          className="text-[9px] font-bold text-[#5f6f52] bg-transparent border-none p-0 focus:outline-none focus:ring-0 cursor-pointer select-none"
                        >
                          <option value="__placeholder__" disabled>Choose Folder...</option>
                          <option value="">📁 None (Unorganized)</option>
                          {folders.map(f => (
                            <option key={f.id} value={f.id}>
                              📁 {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={handleBulkDeleteFiles}
                        className="text-[9px] bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-lg font-bold border border-red-200 flex items-center gap-1 cursor-pointer transition duration-150"
                        title="Delete selected files"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete ({selectedFileIds.length})</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {loadingResources ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#5f6f52]" />
                <span className="text-xs font-bold">Synchronizing storage database...</span>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300 text-center px-4">
                <FolderOpen className="w-10 h-10 mb-2 stroke-[1.2]" />
                <p className="text-xs font-bold text-slate-400">No documents matches</p>
                <p className="text-[10px] text-slate-300 max-w-xs mt-1">Upload curriculum resources to see them organized here.</p>
              </div>
            ) : (
              sortedResources.map((res) => {
                const stats = getResourceStats(res);
                const isSelected = selectedResource?.id === res.id;

                let borderStyle = isSelected
                  ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52] shadow-xs'
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 text-slate-600';

                let badgeNode = null;
                if (showAnalyticsMode && libraryAnalytics && libraryAnalytics.maxAccess > 0) {
                  const ratio = stats.accessCount / libraryAnalytics.maxAccess;
                  if (res.id === libraryAnalytics.mostPopularResource?.id) {
                    badgeNode = (
                      <span className="text-[8px] font-black text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                        <Award className="w-2.5 h-2.5 shrink-0 text-amber-600" />
                        <span>MVP</span>
                      </span>
                    );
                    if (!isSelected) {
                      borderStyle = 'border-amber-300 bg-amber-50/20 hover:bg-amber-50/40 text-slate-700';
                    }
                  } else if (ratio >= 0.7) {
                    badgeNode = (
                      <span className="text-[8px] font-black text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">
                        🔥 Popular
                      </span>
                    );
                    if (!isSelected) {
                      borderStyle = 'border-emerald-200 bg-emerald-50/10 hover:bg-emerald-50/25 text-slate-700';
                    }
                  } else if (ratio >= 0.4) {
                    badgeNode = (
                      <span className="text-[8px] font-extrabold text-blue-800 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded-md shrink-0">
                        📈 Core
                      </span>
                    );
                  }
                }

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{
                      layout: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
                      opacity: { duration: 0.2 }
                    }}
                    key={res.id}
                    onClick={() => handleSelectResource(res)}
                    className={`file-card-item p-3 rounded-xl border transition-all duration-200 ease-in-out cursor-pointer text-xs flex flex-col gap-2 relative group hover:shadow-md hover:-translate-y-0.5 ${borderStyle}`}
                  >
                    {enhancedView && (
                      <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-50 border border-slate-150 relative mb-1 flex items-center justify-center group/thumb select-none shrink-0">
                        {['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(res.fileType) ? (
                          res.downloadUrl ? (
                            <img
                              src={res.downloadUrl}
                              alt={res.fileName}
                              className="w-full h-full object-cover transition-all duration-300 group-hover/thumb:scale-105"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="text-slate-400 text-[10px] font-semibold">Image file</div>
                          )
                        ) : res.fileType === 'flashcards' || res.flashcardDeck ? (
                          <div className="w-full h-full bg-gradient-to-br from-[#5f6f52]/10 via-amber-50/40 to-white p-2 flex flex-col justify-between overflow-hidden relative border border-[#5f6f52]/20 rounded-lg">
                            <div className="flex items-center justify-between border-b border-[#5f6f52]/15 pb-0.5 shrink-0">
                              <span className="text-[7px] font-black text-[#5f6f52] bg-[#5f6f52]/10 border border-[#5f6f52]/20 px-1 rounded-sm tracking-wide uppercase flex items-center gap-0.5">
                                <Layers className="w-2.5 h-2.5" />
                                Flashcard Deck
                              </span>
                              <span className="text-[7px] font-bold text-amber-700 bg-amber-100/80 px-1 rounded-sm">
                                {res.flashcardDeck?.cards?.length || 6} Cards
                              </span>
                            </div>
                            <div className="flex-1 overflow-hidden relative pt-1 text-left">
                              <div className="text-[8px] font-bold text-slate-800 line-clamp-1">
                                Front: {res.flashcardDeck?.cards?.[0]?.front || 'Sample Question'}
                              </div>
                              <div className="text-[7.5px] text-slate-600 italic line-clamp-1 mt-0.5">
                                Back: {res.flashcardDeck?.cards?.[0]?.back || 'Sample Answer'}
                              </div>
                              <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (res.flashcardDeck) {
                                  setActiveFlashcardDeckModal(res.flashcardDeck);
                                  setIsFlashcardPlayerOpen(true);
                                }
                              }}
                              className="w-full py-0.5 bg-[#5f6f52] hover:bg-[#4d5b42] text-white font-black text-[8px] rounded uppercase tracking-wider transition shadow-2xs"
                            >
                              🎴 Practice Flashcards
                            </button>
                          </div>
                        ) : res.fileType === 'pdf' ? (
                          <div className="w-full h-full bg-white p-2 flex flex-col justify-between overflow-hidden relative">
                            {/* PDF Decorative Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5 shrink-0">
                              <span className="text-[7px] font-black text-red-600 bg-red-50 border border-red-100 px-1 rounded-sm tracking-wide">PDF</span>
                              {res.extractedText && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePhoneticsSnippet(res.extractedText);
                                  }}
                                  className="text-[7px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-1 rounded-sm flex items-center gap-0.5 cursor-pointer z-10"
                                  title="Open Visual Phonetics Avatar Guide for this snippet"
                                >
                                  👄 Visual Phonetics
                                </button>
                              )}
                              <span className="text-[7px] text-slate-400 font-semibold truncate max-w-[90px]">{res.subject || 'Syllabus'}</span>
                            </div>
                            {/* Text snippet */}
                            <div className="flex-1 overflow-hidden relative pt-1">
                              <div className="text-[8px] text-slate-500 font-mono leading-tight whitespace-pre-wrap text-left line-clamp-3">
                                {res.extractedText ? (
                                  <InteractiveText text={res.extractedText} />
                                ) : (
                                  'Loading parsed text preview...'
                                )}
                              </div>
                              <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                            </div>
                          </div>
                        ) : (
                          /* Other document formats (e.g. DOCX, CSV, etc.) */
                          <div className="w-full h-full bg-white p-2 flex flex-col justify-between overflow-hidden relative">
                            {/* DOCX/Other Decorative Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5 shrink-0">
                              <span className={`text-[7px] font-black px-1 rounded-sm tracking-wide uppercase ${
                                res.fileType === 'docx' ? 'text-blue-600 bg-blue-50 border border-blue-100' : 'text-slate-600 bg-slate-50 border border-slate-100'
                              }`}>{res.fileType}</span>
                              {res.extractedText && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePhoneticsSnippet(res.extractedText);
                                  }}
                                  className="text-[7px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-1 rounded-sm flex items-center gap-0.5 cursor-pointer z-10"
                                  title="Open Visual Phonetics Avatar Guide for this snippet"
                                >
                                  👄 Visual Phonetics
                                </button>
                              )}
                              <span className="text-[7px] text-slate-400 font-semibold truncate max-w-[90px]">{res.subject || 'Document'}</span>
                            </div>
                            {/* Text snippet */}
                            <div className="flex-1 overflow-hidden relative pt-1">
                              <div className="text-[8px] text-slate-500 font-mono leading-tight whitespace-pre-wrap text-left line-clamp-3">
                                {res.extractedText ? (
                                  <InteractiveText text={res.extractedText} />
                                ) : (
                                  'Loading parsed text preview...'
                                )}
                              </div>
                              <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Checkbox for Bulk File Select */}
                        <input
                          type="checkbox"
                          checked={selectedFileIds.includes(res.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => toggleSelectFile(res.id, e as any)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#5f6f52] focus:ring-[#5f6f52] cursor-pointer shrink-0"
                        />
                        <div className={`p-2 rounded-xl shrink-0 ${
                          res.fileType === 'pdf' ? 'bg-red-50 text-red-600' :
                          ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(res.fileType) ? 'bg-amber-50 text-amber-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {res.fileType === 'pdf' ? (
                            <Paperclip className="w-4 h-4" />
                          ) : ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(res.fileType) ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <FileUp className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <p className="font-bold truncate text-[12px] leading-snug flex-1">{res.fileName}</p>
                            {badgeNode}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {res.subject && (
                              <span className="text-[9px] bg-slate-100 text-slate-500 rounded-md px-1.5 py-0.5 font-medium flex items-center gap-0.5">
                                <Tag className="w-2.5 h-2.5 text-slate-400" />
                                {res.subject}
                              </span>
                            )}
                            {res.topic && (
                              <span className="text-[9px] bg-slate-100 text-slate-500 rounded-md px-1.5 py-0.5 font-medium">
                                {res.topic}
                              </span>
                            )}
                          </div>

                          {showAnalyticsMode && (
                            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5 w-full">
                              <div className="flex justify-between text-[9px] font-extrabold text-slate-500">
                                <span className="flex items-center gap-0.5 text-slate-600">
                                  <Eye className="w-3 h-3 text-slate-400" />
                                  {stats.accessCount} views
                                </span>
                                <span className="flex items-center gap-0.5 text-amber-700 font-extrabold">
                                  <TrendingUp className="w-3 h-3 text-amber-500" />
                                  {stats.generationCount} generations
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1 relative overflow-hidden" title={`${Math.round((stats.accessCount / (libraryAnalytics?.maxAccess || 1)) * 100)}% of max views`}>
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    res.id === libraryAnalytics?.mostPopularResource?.id ? 'bg-amber-500' : 'bg-[#5f6f52]'
                                  }`}
                                  style={{ width: `${Math.min(100, (stats.accessCount / (libraryAnalytics?.maxAccess || 1)) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hover Actions Group */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 absolute right-2 top-2 bg-white/95 rounded-lg border border-slate-100 p-0.5 shadow-xs transition duration-150 z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewingResource(res);
                          }}
                          className="hover:text-[#5f6f52] text-slate-500 p-1 transition rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-center"
                          title="Quick Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {(profile?.role === 'Administrator' || res.userId === profile?.uid) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteResource(res);
                            }}
                            className="hover:text-red-500 text-slate-500 p-1 transition rounded-lg hover:bg-red-50 cursor-pointer flex items-center justify-center"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 border-t border-slate-50 pt-1.5 flex-wrap gap-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(res.uploadedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-slate-400" />
                        {getDisplaySize(res)}
                      </span>
                      {res.folderId && (
                        (() => {
                          const folder = folders.find(f => f.id === res.folderId);
                          return folder ? (
                            <span className="text-[8px] bg-[#5f6f52]/5 text-[#5f6f52] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5 max-w-[100px] truncate">
                              <Folder className="w-2.5 h-2.5 text-[#8ba888]" />
                              {folder.name}
                            </span>
                          ) : null;
                        })()
                      )}
                      <span className="uppercase font-extrabold text-[8px] px-1.5 bg-slate-100 rounded text-slate-400 ml-auto">
                        {res.fileType}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </>
      ) : librarySource === 'drive' ? (
        // GOOGLE DRIVE PANEL VIEW
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/10">
          {!getGoogleWorkspaceToken() ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-slate-50/50 flex-1">
              <div className="p-4 bg-[#5f6f52]/10 rounded-2xl text-[#5f6f52] mb-4 border border-[#5f6f52]/10 shadow-xs">
                <HardDrive className="w-10 h-10" />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-800 mb-1.5">Google Drive Integration</h3>
              <p className="text-xs text-slate-500 max-w-xs mb-5 leading-relaxed">
                Connect your Google Account to access files inside your <strong className="text-slate-700">"EduNexus Curriculum Backup"</strong> folder.
              </p>
              <button
                type="button"
                onClick={handleConnectGoogleDrive}
                disabled={isConnectingDrive}
                className="bg-[#5f6f52] hover:bg-[#4d5a42] text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md transition duration-200 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isConnectingDrive ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting Drive...</span>
                  </>
                ) : (
                  <>
                    <span>Connect Google Drive</span>
                  </>
                )}
              </button>
              {driveError && (
                <p className="text-xs text-red-600 mt-4 font-semibold max-w-xs">{driveError}</p>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {loadingDriveFiles ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10 bg-white">
                  <Loader2 className="w-8 h-8 animate-spin text-[#5f6f52] mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">Scanning "EduNexus Curriculum Backup" folder...</p>
                </div>
              ) : driveError ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                  <p className="text-xs text-red-600 font-semibold mb-3">{driveError}</p>
                  <button
                    type="button"
                    onClick={fetchDriveFiles}
                    className="bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold py-1.5 px-4 rounded-xl cursor-pointer transition"
                  >
                    Try Refreshing Again
                  </button>
                </div>
              ) : (() => {
                const filteredDrive = driveFiles.filter(f =>
                  f.name.toLowerCase().includes(driveSearchQuery.toLowerCase())
                );

                if (filteredDrive.length === 0) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white">
                      <div className="p-3 bg-slate-50 rounded-2xl mb-3 text-slate-400 border border-slate-100">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-700 mb-1">No Files Found</h4>
                      <p className="text-xs text-slate-500 max-w-xs leading-normal">
                        No files were found in your <strong className="text-slate-600">"EduNexus Curriculum Backup"</strong> folder matching "{driveSearchQuery}".
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/20">
                    {filteredDrive.map((driveFile) => {
                      const isImported = resources.some(r => r.fileName === driveFile.name);
                      const isImporting = importingDriveFileId === driveFile.id;
                      const isSelected = selectedDriveFile?.id === driveFile.id;

                      return (
                        <div
                          key={driveFile.id}
                          onClick={() => setSelectedDriveFile(driveFile)}
                          className={`p-3 rounded-xl border transition cursor-pointer text-xs flex flex-col gap-2 relative group ${
                            isSelected
                              ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52] shadow-xs'
                              : isImported
                              ? 'border-emerald-100 bg-emerald-50/5 hover:border-emerald-200 text-slate-600 hover:bg-emerald-50/15'
                              : 'border-slate-150 bg-white hover:border-slate-250 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className={`p-2 rounded-xl shrink-0 ${
                                driveFile.mimeType === 'application/vnd.google-apps.document' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                driveFile.mimeType === 'application/pdf' ? 'bg-red-50 text-red-600 border border-red-100' :
                                driveFile.mimeType.startsWith('image/') ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                'bg-slate-50 text-slate-500 border border-slate-150'
                              }`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-700 truncate" title={driveFile.name}>
                                  {driveFile.name}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                                  <span className="w-1 h-1 bg-green-500 rounded-full" />
                                  Backup Folder Document
                                </p>
                              </div>
                            </div>
                            
                            {isImported && (
                              <span className="text-[8px] font-black text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0 select-none">
                                <Check className="w-2.5 h-2.5 shrink-0" />
                                <span>Indexed</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 border-t border-slate-50 pt-1.5 flex-wrap gap-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {driveFile.createdTime ? new Date(driveFile.createdTime).toLocaleDateString() : 'N/A'}
                            </span>
                            {driveFile.size && (
                              <span className="flex items-center gap-1">
                                <HardDrive className="w-3 h-3 text-slate-400" />
                                {(parseInt(driveFile.size) / 1024).toFixed(1)} KB
                              </span>
                            )}
                            
                            <div className="flex items-center gap-1.5 ml-auto">
                              {driveFile.webViewLink && (
                                <a
                                  href={driveFile.webViewLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
                                  title="Open directly in Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImportDriveFile(driveFile);
                                }}
                                disabled={isImporting}
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold flex items-center gap-1 transition select-none cursor-pointer ${
                                  isImporting
                                    ? 'bg-slate-100 text-slate-400 cursor-wait'
                                    : 'bg-[#5f6f52]/10 hover:bg-[#5f6f52] text-[#5f6f52] hover:text-white border border-[#5f6f52]/10'
                                }`}
                              >
                                {isImporting ? (
                                  <>
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    <span>Importing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-2.5 h-2.5" />
                                    <span>{isImported ? 'Re-import' : 'Import'}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        /* GLOBAL OPEN DIGITAL BOOKS PANEL VIEW */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/10 p-4 space-y-4">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#5f6f52] via-[#4d5b42] to-amber-900 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-300" />
                <h3 className="font-serif font-bold text-base text-white">Global Open Digital Library</h3>
                <span className="px-2 py-0.5 bg-amber-400/20 text-amber-200 rounded-full text-[10px] font-extrabold border border-amber-300/30">
                  Open-Access &amp; Public Domain
                </span>
              </div>
              <p className="text-xs text-amber-100/90 max-w-xl leading-relaxed">
                Free digital books, open-access textbooks (OpenStax), classic literature (Project Gutenberg), and multilingual readers accessible to all students.
              </p>
            </div>
          </div>

          {/* Controls: Search & Category Filters */}
          <div className="space-y-2 shrink-0">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">Category:</span>
              {['All', 'Literature & Classics', 'STEM & Textbooks', 'Children & Multilingual', 'History & Social Sciences', 'Philosophy & Thought'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setOpenBookCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    openBookCategoryFilter === cat
                      ? 'bg-[#5f6f52] text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search open books, classics, STEM textbooks, or author..."
                  value={openBookSearchQuery}
                  onChange={(e) => {
                    setOpenBookSearchQuery(e.target.value);
                    if (e.target.value.length > 3) {
                      searchLiveGutendexBooks(e.target.value);
                    }
                  }}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 focus:ring-1 focus:ring-[#5f6f52] focus:outline-none"
                />
                {openBookSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenBookSearchQuery('');
                      setGutendexLiveResults([]);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => searchLiveGutendexBooks(openBookSearchQuery)}
                disabled={isSearchingGutendex || !openBookSearchQuery.trim()}
                className="px-3 py-1.5 bg-[#5f6f52] hover:bg-[#4d5b42] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer shrink-0"
              >
                {isSearchingGutendex ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Search Gutenberg (70k+)</span>
              </button>
            </div>
          </div>

          {/* Book Catalog Grid */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Filtered Pre-Loaded Catalog */}
            {(() => {
              const filtered = OPEN_BOOKS_CATALOG.filter(b => {
                const matchesCategory = openBookCategoryFilter === 'All' || b.category === openBookCategoryFilter;
                const matchesQuery = !openBookSearchQuery || 
                  b.title.toLowerCase().includes(openBookSearchQuery.toLowerCase()) ||
                  b.author.toLowerCase().includes(openBookSearchQuery.toLowerCase()) ||
                  b.subject.toLowerCase().includes(openBookSearchQuery.toLowerCase()) ||
                  b.summary.toLowerCase().includes(openBookSearchQuery.toLowerCase());
                return matchesCategory && matchesQuery;
              });

              if (filtered.length === 0 && gutendexLiveResults.length === 0) {
                return (
                  <div className="py-12 text-center bg-white rounded-2xl border border-slate-150 p-6">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">No matching books found in local open catalog.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try searching Project Gutenberg using the button above.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filtered.map(book => {
                    const isAlreadyInLibrary = resources.some(r => r.downloadUrl === book.externalUrl || r.fileName.toLowerCase().includes(book.title.toLowerCase().slice(0, 10)));
                    return (
                      <div
                        key={book.id}
                        className="bg-white rounded-2xl border border-slate-200 p-3.5 hover:border-[#5f6f52]/50 hover:shadow-md transition flex flex-col justify-between space-y-3 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-16 rounded-xl bg-gradient-to-br ${book.coverBg} flex flex-col items-center justify-center text-xl shadow-sm shrink-0 font-bold text-white relative`}>
                            <span>{book.coverEmoji}</span>
                            <span className="text-[8px] font-extrabold uppercase mt-1 opacity-90">{book.language.slice(0, 3)}</span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                                {book.category}
                              </span>
                              <span className="text-[9px] font-semibold text-slate-400">
                                {book.pageCount} pages
                              </span>
                            </div>

                            <h4 className="font-extrabold text-xs text-slate-800 mt-1 group-hover:text-[#5f6f52] transition truncate" title={book.title}>
                              {book.title}
                            </h4>
                            <p className="text-[10px] font-semibold text-slate-500 truncate">
                              By {book.author}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {book.summary}
                            </p>
                          </div>
                        </div>

                        {/* Badges & Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              {book.gradeLevel}
                            </span>
                            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
                              {book.license.split('(')[0]}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 ml-auto">
                            <button
                              type="button"
                              onClick={() => setActiveReadingBook(book)}
                              className="px-2.5 py-1 bg-[#5f6f52] hover:bg-[#4d5b42] text-white rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 cursor-pointer shadow-xs"
                              title="Read complete ebook online with audio narration & font controls"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>Read Online</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleImportOpenBookToLibrary(book)}
                              disabled={isAlreadyInLibrary}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                isAlreadyInLibrary
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                              title="Save into your local curriculum library for AI study tools"
                            >
                              {isAlreadyInLibrary ? <Check className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                              <span>{isAlreadyInLibrary ? 'Saved' : 'Import'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Gutenberg Live API Search Results Section */}
            {gutendexLiveResults.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Project Gutenberg Public Domain Books ({gutendexLiveResults.length})
                  </h4>
                  <span className="text-[10px] text-slate-400">Directly from Gutenberg Library</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gutendexLiveResults.map(item => {
                    const authorName = item.authors && item.authors.length > 0 ? item.authors[0].name : 'Public Domain';
                    return (
                      <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
                            <span className="font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Gutenberg #{item.id}</span>
                            <span>{item.download_count} readers</span>
                          </div>
                          <h5 className="font-bold text-xs text-slate-800 line-clamp-1">{item.title}</h5>
                          <p className="text-[10px] text-slate-500 font-medium">By {authorName}</p>
                          {item.subjects && (
                            <p className="text-[9px] text-slate-400 mt-1 line-clamp-1">{item.subjects.join(', ')}</p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <a
                            href={`https://www.gutenberg.org/ebooks/${item.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Gutenberg Web Reader
                          </a>

                          <button
                            type="button"
                            onClick={() => handleImportGutendexBookToLibrary(item)}
                            className="px-2.5 py-1 bg-[#5f6f52] text-white rounded-lg text-[10px] font-bold hover:bg-[#4d5b42] transition flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Import Ebook</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>

      {/* Right Panel: Powerful read-only details viewer */}
      <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-150 shadow-sm h-full overflow-hidden flex flex-col">
        {selectedResource ? (
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* Detail Viewer Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                    selectedResource.fileType === 'pdf' ? 'bg-red-100 text-red-700' :
                    ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(selectedResource.fileType) ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedResource.fileType} CURRICULUM FILE
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Uploaded on {new Date(selectedResource.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-base font-serif font-bold text-slate-800 leading-snug truncate">
                  {selectedResource.fileName}
                </h2>
                
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-semibold text-[#5f6f52] bg-[#5f6f52]/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {selectedResource.subject}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {selectedResource.topic}
                  </span>
                  
                  {/* Real-time Folder Assign Selector */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-[#8ba888]/10 hover:bg-[#8ba888]/20 px-2.5 py-0.5 rounded-lg transition duration-150">
                    <Folder className="w-3.5 h-3.5 text-[#5f6f52]" />
                    <span className="font-semibold text-slate-500">Folder:</span>
                    <select
                      value={selectedResource.folderId || ''}
                      onChange={(e) => handleMoveFileToFolder(selectedResource, e.target.value)}
                      className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs font-extrabold text-[#5f6f52] cursor-pointer p-0 ml-0.5 select-none"
                    >
                      <option value="" className="text-slate-700">None (Unorganized)</option>
                      {folders.map(f => (
                        <option key={f.id} value={f.id} className="text-slate-700">
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setPreviewingResource(selectedResource)}
                  className="p-2 border border-slate-200 hover:border-[#5f6f52] hover:bg-[#5f6f52]/5 text-slate-700 hover:text-[#5f6f52] bg-white rounded-xl transition duration-200 cursor-pointer flex items-center gap-1 text-xs font-bold shadow-2xs"
                  title="Open full preview modal for images and documents"
                >
                  <Eye className="w-4 h-4 text-[#5f6f52]" />
                  <span>Full Preview</span>
                </button>

                <button
                  onClick={() => {
                    setPodcastModalData({
                      text: selectedResource.extractedText || '',
                      title: selectedResource.fileName
                    });
                  }}
                  className="p-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl transition duration-200 cursor-pointer flex items-center gap-1 text-xs font-extrabold shadow-xs"
                  title="Synthesize this document into an adaptive AI audio podcast"
                >
                  <Radio className="w-4 h-4 text-cyan-200 animate-pulse" />
                  <span>Conversational Podcast 🎙️</span>
                </button>

                <button
                  onClick={() => {
                    setArModalData({
                      text: selectedResource.extractedText || '',
                      title: selectedResource.fileName
                    });
                  }}
                  className="p-2 bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl transition duration-200 cursor-pointer flex items-center gap-1 text-xs font-extrabold shadow-xs"
                  title="Point device camera at physical desk to view interactive 3D holographic representations"
                >
                  <Box className="w-4 h-4 text-cyan-200 animate-bounce" />
                  <span>AR Hologram 🕶️</span>
                </button>

                {selectedResource.downloadUrl && (
                  <a
                    href={selectedResource.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-slate-200 hover:border-[#5f6f52] hover:bg-[#5f6f52]/5 text-slate-600 hover:text-[#5f6f52] rounded-xl transition duration-200 cursor-pointer flex items-center gap-1 text-xs font-bold"
                    title="Download original file"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                )}
                
                {onSelectResourceForTutor && (
                  <button
                    onClick={() => handleConsultTutor(selectedResource)}
                    className="p-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-xl transition duration-200 cursor-pointer flex items-center gap-1 text-xs font-semibold shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Consult EduNexus AI Tutor</span>
                  </button>
                )}
              </div>
            </div>

            {/* Document search bar & text view header */}
            <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50/20 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Extracted Reference Text</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Search within extracted text */}
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search words inside guide..."
                    value={readerSearchQuery}
                    onChange={(e) => setReaderSearchQuery(e.target.value)}
                    className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2 py-1 focus:ring-1 focus:ring-[#5f6f52] focus:outline-none w-[160px] sm:w-[200px]"
                  />
                  {readerSearchQuery && (
                    <button
                      onClick={() => setReaderSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-slate-700 text-slate-400"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleCopyText(selectedResource.extractedText)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                  title="Copy full extracted text to clipboard"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Render read-only text viewer with highlights */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30">
              <div className="max-w-2xl mx-auto flex flex-col gap-6">
                {['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(selectedResource.fileType) && selectedResource.downloadUrl && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex justify-center">
                    <img
                      src={selectedResource.downloadUrl}
                      alt={selectedResource.fileName}
                      className="max-h-72 object-contain rounded-lg border border-slate-100 shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-xs whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-slate-700 min-h-full">
                  {highlightText(selectedResource.extractedText, readerSearchQuery)}
                </div>
              </div>
            </div>
            
          </div>
        ) : selectedDriveFile ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* GOOGLE DRIVE PREVIEW VIEW */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 font-sans">
                    <HardDrive className="w-2.5 h-2.5" />
                    GOOGLE DRIVE FILE
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-sans font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    Created on {selectedDriveFile.createdTime ? new Date(selectedDriveFile.createdTime).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <h2 className="text-base font-serif font-bold text-slate-800 leading-snug truncate">
                  {selectedDriveFile.name}
                </h2>
                <p className="text-xs text-slate-400 font-mono truncate max-w-[400px]">
                  MimeType: {selectedDriveFile.mimeType}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedDriveFile.webViewLink && (
                  <a
                    href={selectedDriveFile.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-slate-200 hover:border-[#5f6f52] hover:bg-[#5f6f52]/5 text-slate-600 hover:text-[#5f6f52] rounded-xl transition duration-200 cursor-pointer flex items-center gap-1 text-xs font-bold font-sans"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View original</span>
                  </a>
                )}
                
                <button
                  type="button"
                  onClick={() => handleImportDriveFile(selectedDriveFile)}
                  disabled={importingDriveFileId === selectedDriveFile.id}
                  className="p-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-xl transition duration-200 cursor-pointer flex items-center gap-1 text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {importingDriveFileId === selectedDriveFile.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Import to Archive</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center bg-slate-50/50">
              <div className="max-w-md space-y-4">
                <div className="p-4 bg-[#5f6f52]/5 text-[#5f6f52] rounded-2xl w-16 h-16 mx-auto flex items-center justify-center border border-[#5f6f52]/10 shadow-inner">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="font-serif font-bold text-lg text-slate-800">Unindexed Curriculum Document</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This document lives securely inside your <strong className="text-slate-700 font-bold">"EduNexus Curriculum Backup"</strong> Google Drive folder.
                </p>
                <div className="bg-white border border-slate-150 p-4 rounded-2xl text-left text-xs text-slate-600 space-y-2 max-w-sm mx-auto shadow-xs">
                  <h4 className="font-extrabold text-[#5f6f52] uppercase text-[9px] tracking-wider flex items-center gap-1 font-sans">
                    <Check className="w-3.5 h-3.5" />
                    What happens when you import?
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1 leading-normal font-medium">
                    <li>Plain text is extracted instantly from the file.</li>
                    <li>The curriculum is indexed for the Socratic Tutor.</li>
                    <li>A persistent backup copy is registered locally.</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handleImportDriveFile(selectedDriveFile)}
                  disabled={importingDriveFileId === selectedDriveFile.id}
                  className="bg-[#5f6f52] hover:bg-[#4d5a42] text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md transition duration-200 cursor-pointer disabled:opacity-50"
                >
                  {importingDriveFileId === selectedDriveFile.id ? "Extracting Text..." : "Import & Extract Text Now"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center p-8 text-slate-400">
            <BookOpen className="w-12 h-12 mb-3 stroke-[1.2] text-[#a9b388]" />
            <h3 className="text-sm font-serif font-bold text-slate-700">No Document Selected</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Select any curriculum guide from the Archive list on the left to review its parsed context or consult Socratic Sage.
            </p>
          </div>
        )}
      </div>

      {/* Interactive Preview Modal for Images and Documents */}
      <AnimatePresence>
        {previewingResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden relative"
            >
              {/* Top Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isPdfFile(previewingResource) ? 'bg-red-100 text-red-700' :
                      isImageFile(previewingResource) ? 'bg-amber-100 text-amber-700' :
                      isVideoFile(previewingResource) ? 'bg-purple-100 text-purple-700' :
                      isAudioFile(previewingResource) ? 'bg-emerald-100 text-emerald-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {isImageFile(previewingResource) ? <Image className="w-3 h-3" /> :
                       isVideoFile(previewingResource) ? <Film className="w-3 h-3" /> :
                       isPdfFile(previewingResource) ? <Paperclip className="w-3 h-3" /> :
                       <FileText className="w-3 h-3" />}
                      {previewingResource.fileType.toUpperCase()} PREVIEW
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(previewingResource.uploadedAt).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <HardDrive className="w-3.5 h-3.5" />
                      {getDisplaySize(previewingResource)}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-slate-800 leading-snug truncate" title={previewingResource.fileName}>
                    {previewingResource.fileName}
                  </h3>
                </div>

                {/* Header Action Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Prev / Next Resource Navigation */}
                  {(() => {
                    const currentIdx = sortedResources.findIndex(r => r.id === previewingResource.id);
                    const hasPrev = currentIdx > 0;
                    const hasNext = currentIdx >= 0 && currentIdx < sortedResources.length - 1;
                    return (
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 mr-1 select-none">
                        <button
                          type="button"
                          disabled={!hasPrev}
                          onClick={() => hasPrev && setPreviewingResource(sortedResources[currentIdx - 1])}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded transition cursor-pointer"
                          title="Previous file in list (Left Arrow)"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-mono font-bold text-slate-400 px-1">
                          {currentIdx + 1}/{sortedResources.length}
                        </span>
                        <button
                          type="button"
                          disabled={!hasNext}
                          onClick={() => hasNext && setPreviewingResource(sortedResources[currentIdx + 1])}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded transition cursor-pointer"
                          title="Next file in list (Right Arrow)"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={() => {
                      setPodcastModalData({
                        text: previewingResource.extractedText || '',
                        title: previewingResource.fileName
                      });
                    }}
                    className="p-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Synthesize document into AI podcast"
                  >
                    <Radio className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                    <span className="hidden md:inline">AI Podcast 🎙️</span>
                  </button>

                  {previewingResource.downloadUrl && (
                    <a
                      href={previewingResource.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 border border-slate-200 hover:border-[#5f6f52] hover:bg-[#5f6f52]/5 text-slate-600 hover:text-[#5f6f52] rounded-lg transition text-xs font-semibold flex items-center gap-1"
                      title="Download original file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedResource(previewingResource);
                      setPreviewingResource(null);
                    }}
                    className="p-1.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-lg transition text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Open resource in right reader pane"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Open Pane</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewingResource(null)}
                    className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer ml-1"
                    title="Close Preview Modal (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Subheader Bar with View Mode Tabs & File Metadata */}
              <div className="px-5 py-2.5 bg-slate-50/40 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('viewer')}
                    className={`px-3 py-1 rounded-lg font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      previewTab === 'viewer'
                        ? 'bg-[#5f6f52] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>
                      {isImageFile(previewingResource) ? 'Image Viewer' :
                       isPdfFile(previewingResource) ? 'PDF Document View' :
                       isVideoFile(previewingResource) || isAudioFile(previewingResource) ? 'Media Player' :
                       'Document View'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewTab('text')}
                    className={`px-3 py-1 rounded-lg font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      previewTab === 'text'
                        ? 'bg-[#5f6f52] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Extracted Text / OCR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewTab('details')}
                    className={`px-3 py-1 rounded-lg font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      previewTab === 'details'
                        ? 'bg-[#5f6f52] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Metadata & AI Info</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 text-slate-500 text-[11px] font-medium flex-wrap">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    Subject: <strong className="text-[#5f6f52] bg-[#5f6f52]/10 px-1.5 py-0.5 rounded font-bold">{previewingResource.subject}</strong>
                  </span>
                  {previewingResource.topic && (
                    <span className="flex items-center gap-1">
                      Topic: <strong className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{previewingResource.topic}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Main Body Content based on Active Tab & File Type */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50 flex flex-col">
                {previewTab === 'viewer' && (
                  <div className="flex-1 flex flex-col justify-center items-center h-full min-h-[350px]">
                    {/* IMAGE PREVIEW VIEWER */}
                    {isImageFile(previewingResource) ? (
                      <div className="w-full flex-1 flex flex-col items-center justify-between gap-4">
                        {/* Image Controls Toolbar */}
                        <div className="flex items-center justify-between w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs flex-wrap gap-2">
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-1">Zoom:</span>
                            <button
                              type="button"
                              onClick={() => setImageScale(s => Math.max(0.5, s - 0.25))}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-mono font-bold text-slate-700 w-12 text-center">
                              {Math.round(imageScale * 100)}%
                            </span>
                            <button
                              type="button"
                              onClick={() => setImageScale(s => Math.min(3, s + 0.25))}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setImageRotation(r => (r + 90) % 360)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer ml-1"
                              title="Rotate 90 degrees"
                            >
                              <RotateCw className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => { setImageScale(1); setImageRotation(0); }}
                              className="px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer ml-1 border border-slate-200"
                            >
                              Reset
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setIsDarkBg(d => !d)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
                                isDarkBg ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              {isDarkBg ? '☀️ Light Canvas' : '🌙 Dark Canvas'}
                            </button>
                          </div>
                        </div>

                        {/* Image Display Area */}
                        <div className={`w-full flex-1 rounded-2xl border p-4 flex items-center justify-center overflow-auto min-h-[320px] max-h-[520px] transition-colors duration-200 ${
                          isDarkBg ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                        }`}>
                          {previewingResource.downloadUrl ? (
                            <div className="overflow-auto flex items-center justify-center p-2 max-w-full max-h-full">
                              <img
                                src={previewingResource.downloadUrl}
                                alt={previewingResource.fileName}
                                style={{
                                  transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
                                  transition: 'transform 0.2s ease-out'
                                }}
                                className="max-h-[440px] w-auto object-contain rounded-lg shadow-md select-none"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="text-center p-8 text-slate-400">
                              <Image className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                              <p className="text-xs font-semibold">Image file preview URL pending</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : isPdfFile(previewingResource) ? (
                      /* PDF PREVIEW VIEWER */
                      <div className="w-full h-full flex flex-col gap-3 min-h-[480px]">
                        {previewingResource.downloadUrl ? (
                          <div className="w-full flex-1 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                            <iframe
                              src={`${previewingResource.downloadUrl}#toolbar=1&navpanes=0`}
                              title={`PDF Preview - ${previewingResource.fileName}`}
                              className="w-full h-full min-h-[500px] border-none"
                            />
                          </div>
                        ) : (
                          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 my-auto">
                            <Paperclip className="w-12 h-12 text-red-500 mx-auto mb-2" />
                            <h4 className="font-bold text-sm text-slate-800">PDF Document Loaded</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                              Switch to the <button type="button" onClick={() => setPreviewTab('text')} className="text-[#5f6f52] underline font-bold">Extracted Text / OCR</button> tab to read the full extracted document text directly inside EduNexus.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : isVideoFile(previewingResource) ? (
                      /* VIDEO PREVIEW VIEWER */
                      <div className="w-full flex flex-col items-center justify-center gap-3">
                        <div className="w-full max-w-3xl bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
                          <video
                            src={previewingResource.downloadUrl}
                            controls
                            autoPlay={false}
                            className="w-full max-h-[480px] object-contain"
                          />
                        </div>
                      </div>
                    ) : isAudioFile(previewingResource) ? (
                      /* AUDIO PREVIEW VIEWER */
                      <div className="w-full max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center my-auto">
                        <div className="p-4 bg-emerald-50 rounded-full w-16 h-16 mx-auto mb-4 text-emerald-600 flex items-center justify-center border border-emerald-100">
                          <Radio className="w-8 h-8 animate-pulse" />
                        </div>
                        <h4 className="font-bold text-base text-slate-800 mb-1">{previewingResource.fileName}</h4>
                        <p className="text-xs text-slate-400 mb-6">Audio Recording / Lecture Stream</p>
                        <audio
                          src={previewingResource.downloadUrl}
                          controls
                          className="w-full"
                        />
                      </div>
                    ) : (
                      /* DEFAULT DOCUMENT / TEXT FORMAT PREVIEW VIEWER */
                      <div className="w-full h-full flex flex-col gap-3">
                        {/* Text Controls Bar */}
                        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-2xs flex-wrap gap-2 shrink-0">
                          <div className="relative flex-1 max-w-xs min-w-[180px]">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Search document text..."
                              value={modalSearchQuery}
                              onChange={(e) => setModalSearchQuery(e.target.value)}
                              className="w-full text-xs pl-8 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5f6f52]"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Text Size:</span>
                            {(['sm', 'md', 'lg', 'xl'] as const).map(sz => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => setModalFontSize(sz)}
                                className={`px-2 py-0.5 rounded text-xs font-bold transition cursor-pointer ${
                                  modalFontSize === sz
                                    ? 'bg-[#5f6f52] text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {sz.toUpperCase()}
                              </button>
                            ))}

                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(previewingResource.extractedText || '');
                                setIsCopiedModal(true);
                                setTimeout(() => setIsCopiedModal(false), 2000);
                              }}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200 ml-2"
                            >
                              {isCopiedModal ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Text</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Document Reader Container */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs overflow-y-auto flex-1 font-sans text-slate-800 leading-relaxed max-w-4xl mx-auto w-full space-y-4">
                          {previewingResource.extractedText ? (
                            <div className={`whitespace-pre-wrap font-sans ${
                              modalFontSize === 'sm' ? 'text-xs' :
                              modalFontSize === 'md' ? 'text-sm' :
                              modalFontSize === 'lg' ? 'text-base' : 'text-lg'
                            }`}>
                              {highlightText(previewingResource.extractedText, modalSearchQuery)}
                            </div>
                          ) : (
                            <div className="py-12 text-center text-slate-400">
                              <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.2]" />
                              <p className="text-xs font-bold">No extracted text content available for this document.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {previewTab === 'text' && (
                  /* EXTRACTED TEXT & INTERACTIVE WORDS TAB */
                  <div className="w-full h-full flex flex-col gap-3">
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-2xs flex-wrap gap-2 shrink-0">
                      <div className="relative flex-1 max-w-xs min-w-[180px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search extracted text..."
                          value={modalSearchQuery}
                          onChange={(e) => setModalSearchQuery(e.target.value)}
                          className="w-full text-xs pl-8 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5f6f52]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActivePhoneticsSnippet(previewingResource.extractedText);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <span>👄 Launch Visual Phonetics</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(previewingResource.extractedText || '');
                            setIsCopiedModal(true);
                            setTimeout(() => setIsCopiedModal(false), 2000);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200"
                        >
                          {isCopiedModal ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs overflow-y-auto flex-1 font-sans text-slate-800 leading-relaxed max-w-4xl mx-auto w-full space-y-4">
                      {previewingResource.extractedText ? (
                        <InteractiveText text={previewingResource.extractedText} />
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center py-10">No extracted OCR text available.</p>
                      )}
                    </div>
                  </div>
                )}

                {previewTab === 'details' && (
                  /* METADATA & AI SUMMARY TAB */
                  <div className="w-full max-w-3xl mx-auto space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                      <h4 className="font-serif font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
                        File Properties & Metadata
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-extrabold text-slate-400">File Name</span>
                          <p className="font-bold text-slate-800 truncate">{previewingResource.fileName}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-extrabold text-slate-400">File Extension / Format</span>
                          <p className="font-bold text-slate-800 uppercase">{previewingResource.fileType}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-extrabold text-slate-400">File Size</span>
                          <p className="font-bold text-slate-800">{getDisplaySize(previewingResource)}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-extrabold text-slate-400">Upload Date</span>
                          <p className="font-bold text-slate-800">{new Date(previewingResource.uploadedAt).toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-extrabold text-slate-400">Curriculum Subject</span>
                          <p className="font-bold text-[#5f6f52]">{previewingResource.subject}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-extrabold text-slate-400">Topic Area</span>
                          <p className="font-bold text-slate-800">{previewingResource.topic || 'General'}</p>
                        </div>
                      </div>

                      {previewingResource.extractedText && (
                        <div className="pt-2">
                          <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-2">Text Content Metrics</span>
                          <div className="flex gap-4 text-xs font-mono">
                            <div className="px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
                              <strong>Words:</strong> {previewingResource.extractedText.trim().split(/\s+/).length}
                            </div>
                            <div className="px-3 py-2 bg-blue-50 text-blue-800 rounded-xl border border-blue-100">
                              <strong>Characters:</strong> {previewingResource.extractedText.length}
                            </div>
                            <div className="px-3 py-2 bg-amber-50 text-amber-800 rounded-xl border border-amber-100">
                              <strong>Read Time:</strong> ~{Math.max(1, Math.ceil(previewingResource.extractedText.trim().split(/\s+/).length / 200))} min
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* Visual Phonetics Studio Overlay Modal */}
        {activePhoneticsSnippet && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-5xl my-8">
              <VisualPhoneticsStudio
                initialSnippet={activePhoneticsSnippet}
                onClose={() => setActivePhoneticsSnippet(null)}
                isModal={true}
              />
            </div>
          </div>
        )}

        <AnimatePresence>
          {bulkDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 bg-red-50/50 flex items-center gap-3 shrink-0">
                <div className="p-2 bg-red-100 rounded-xl text-red-600">
                  <Trash2 className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-slate-800 leading-snug">
                    Confirm Bulk Deletion
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This action permanently deletes resources from the school's workspace.
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="p-5 space-y-3 flex-1 overflow-hidden">
                <p className="text-xs font-semibold text-slate-600">
                  You are about to delete the following <span className="font-bold text-red-600">{bulkDeleteConfirm.ids.length}</span> {bulkDeleteConfirm.type === 'files' ? 'file(s)' : 'folder(s)'}:
                </p>

                <div className="max-h-40 overflow-y-auto border border-slate-150 rounded-xl bg-slate-50 p-3 space-y-1.5 scrollbar-thin">
                  {bulkDeleteConfirm.type === 'files' ? (
                    bulkDeleteConfirm.ids.map(id => {
                      const file = resources.find(r => r.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                          <span className="text-red-500 font-extrabold select-none">•</span>
                          <span className="truncate font-medium flex-1">{file?.fileName || 'Unrecognized Document'}</span>
                          {file?.subject && (
                            <span className="text-[10px] text-[#5f6f52] bg-[#5f6f52]/10 px-1.5 py-0.5 rounded-md font-bold select-none">
                              {file.subject}
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    bulkDeleteConfirm.ids.map(id => {
                      const folder = folders.find(f => f.id === id);
                      const fileCount = resources.filter(r => r.folderId === id).length;
                      return (
                        <div key={id} className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                          <span className="text-red-500 font-extrabold select-none">•</span>
                          <span className="truncate font-bold flex-1 text-slate-700">{folder?.name || 'Unrecognized Folder'}</span>
                          <span className="text-[10px] text-slate-400 font-semibold select-none">
                            {fileCount} files inside
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {bulkDeleteConfirm.type === 'folders' && (
                  <p className="text-[10px] text-slate-400 leading-normal bg-amber-50 border border-amber-100 p-2.5 rounded-xl">
                    ⚠️ <strong className="text-amber-800">Note:</strong> Deleting folders will <span className="underline">not</span> delete the teaching resources within them. The curriculum files will simply be moved to the <strong className="text-slate-600">"Unorganized"</strong> list.
                  </p>
                )}

                {/* Safety Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-red-100 bg-red-50/20 hover:bg-red-50/50 cursor-pointer select-none transition">
                    <input
                      type="checkbox"
                      id="bulk-delete-safeguard"
                      checked={deleteSafeguardChecked}
                      onChange={(e) => setDeleteSafeguardChecked(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer shrink-0 mt-0.5"
                    />
                    <span className="text-xs font-semibold text-red-700 leading-normal">
                      I confirm that I want to permanently delete these important teaching resources.
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setBulkDeleteConfirm(null)}
                  disabled={isDeletingBulk}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-bulk-delete"
                  onClick={executeBulkDelete}
                  disabled={!deleteSafeguardChecked || isDeletingBulk}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5 ${
                    deleteSafeguardChecked && !isDeletingBulk
                      ? 'bg-red-600 hover:bg-red-700 shadow-sm cursor-pointer'
                      : 'bg-slate-300 cursor-not-allowed text-slate-500'
                  }`}
                >
                  {isDeletingBulk ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Permanently Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Conversational Podcast Synthesis Modal */}
      <ConversationalPodcastModal
        isOpen={!!podcastModalData}
        onClose={() => setPodcastModalData(null)}
        materialsText={podcastModalData?.text || ''}
        materialTitle={podcastModalData?.title || 'Library Curriculum'}
      />

      {/* AR Hologram Reader Modal */}
      <ARHologramReaderModal
        isOpen={!!arModalData}
        onClose={() => setArModalData(null)}
        documentTitle={arModalData?.title || 'Library Project Tasks'}
        documentContext={arModalData?.text || ''}
        initialTopic={arModalData?.title || ''}
      />

      {/* Library Flashcard Deck Player Modal */}
      <FlashcardDeckModal
        deck={activeFlashcardDeckModal}
        isOpen={isFlashcardPlayerOpen}
        onClose={() => setIsFlashcardPlayerOpen(false)}
      />

      {/* Global Open Digital Book Reader Modal */}
      <OpenBookReaderModal
        book={activeReadingBook}
        onClose={() => setActiveReadingBook(null)}
        onImportToLibrary={handleImportOpenBookToLibrary}
      />
    </div>
    </div>
  );
}
