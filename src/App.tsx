import { useState, useEffect, lazy, Suspense } from 'react';
import { getStoredDarkMode } from './lib/theme';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ContactPage from './pages/ContactPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import DataDeletionPolicyPage from './pages/DataDeletionPolicyPage';
import AccessibilityStatementPage from './pages/AccessibilityStatementPage';
import NotFoundPage from './pages/NotFoundPage';
import { SavedDocument, GenerationParams, DocumentDraft, AppNotification, getCurriculumTutorName } from './types';
import { INITIAL_DOCUMENTS } from './data/seedDocs';
import { EditableSelect } from './components/EditableSelect';
import { AuthProvider, useAuth, resolveDisplayName } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import { db, handleFirestoreError, OperationType, cleanUndefined, compressObject, decompressObject, saveDocumentWithImageChunks } from './firebase';
import { saveCurriculumDocsToOfflineCache, getOfflineCachedDocuments } from './utils/offlineCache';
import { logActivity } from './lib/activityLogger';
import { handleResponseJson } from './utils/api';
import { collection, onSnapshot, setDoc, doc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import NotificationCenter from './components/NotificationCenter';
import { getStoredNotifications, checkUpcomingLessons } from './lib/notificationService';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon } from 'lucide-react';
import NetworkStatusBadge from './components/NetworkStatusBadge';
import Footer from './components/Footer';
import SEOHead from './components/SEOHead';
import Breadcrumbs from './components/Breadcrumbs';

// Lazy-loaded major route components & modals for chunk splitting & fast initial paint
const Dashboard = lazy(() => import('./components/Dashboard'));
const DocumentCreator = lazy(() => import('./components/DocumentCreator'));
const DocumentViewer = lazy(() => import('./components/DocumentViewer'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const AdminPlaybook = lazy(() => import('./components/AdminPlaybook'));
const Settings = lazy(() => import('./components/Settings'));
const AuthScreen = lazy(() => import('./components/AuthScreen'));
const GlobalResources = lazy(() => import('./components/GlobalResources'));
const CollaborationHub = lazy(() => import('./components/CollaborationHub'));
const VoiceNotebook = lazy(() => import('./components/VoiceNotebook'));
const AITutor = lazy(() => import('./components/AITutor'));
const AssessmentGenerator = lazy(() => import('./components/AssessmentGenerator'));
const FileLibrary = lazy(() => import('./components/FileLibrary'));
const ImageStudio = lazy(() => import('./components/ImageStudio'));
const VideoStudio = lazy(() => import('./components/VideoStudio'));
const LearnersPerformance = lazy(() => import('./components/LearnersPerformance'));
const VisualPhoneticsStudio = lazy(() => import('./components/VisualPhoneticsStudio'));
const QRMappingDashboard = lazy(() => import('./components/QRMappingDashboard'));
const VirtualFieldTripStudio = lazy(() => import('./components/VirtualFieldTripStudio').then(m => ({ default: m.VirtualFieldTripStudio })));
const LowerSchoolMagicStudio = lazy(() => import('./components/LowerSchoolMagicStudio'));
import PilotFeedbackModal from './components/PilotFeedbackModal';
const SidebarTimerWidget = lazy(() => import('./components/SidebarTimerWidget'));
import ErrorBoundary from './components/ErrorBoundary';
import VoiceNavigation from './components/VoiceNavigation';
const AppIconShowcaseModal = lazy(() => import('./components/AppIconShowcaseModal'));
import { ScannedStationPortalModal } from './components/ScannedStationPortalModal';
import GlobalSearchModal from './components/GlobalSearchModal';
import { useSubscription } from './hooks/useSubscription';
import PricingSubscriptionModal from './components/PricingSubscriptionModal';
import SubscriptionBadgeWidget from './components/SubscriptionBadgeWidget';
import FeatureGateModal from './components/FeatureGateModal';

import {
  Menu,
  PlusCircle,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  User,
  GraduationCap,
  Plus,
  AlertCircle,
  Download,
  Info,
  LogOut,
  Shield,
  Globe,
  Compass,
  Users,
  Settings as SettingsIcon,
  Mic,
  FolderOpen,
  Keyboard,
  Printer,
  Save,
  Video,
  Award,
  X,
  QrCode,
  Folder,
  BarChart3,
  FileCheck,
  Bell,
  CheckCircle2,
  Sun,
  Moon,
  RotateCcw,
  Search,
  Radio,
  Cast
} from 'lucide-react';
import { subscribeToDocumentBroadcast, stopDocumentBroadcastSession, DocumentBroadcastData } from './services/documentBroadcastService';

function ViewLoadingFallback() {
  return (
    <div className="w-full h-72 md:h-96 bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/80 p-8 flex flex-col items-center justify-center space-y-4 animate-pulse shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-[#5f6f52]/15 border border-[#5f6f52]/20 flex items-center justify-center text-[#5f6f52]">
        <Sparkles className="w-6 h-6 animate-spin" />
      </div>
      <div className="space-y-2 text-center">
        <div className="h-4 w-40 bg-slate-200 rounded-full mx-auto" />
        <div className="h-3 w-56 bg-slate-100 rounded-full mx-auto" />
      </div>
    </div>
  );
}


function RequireDeveloperGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isDeveloper, hasDeveloperClaim, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center animate-spin mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <p className="text-xs text-slate-400 font-mono">Verifying Developer Custom Claim...</p>
      </div>
    );
  }

  const isDevAccess = isDeveloper || hasDeveloperClaim;

  if (!user || !isDevAccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600" />
          
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-black uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>403 Forbidden</span>
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">Access Restricted</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              The <span className="text-rose-400 font-semibold">/admin</span> Developer Console requires an account with verified custom claim <code className="bg-slate-800 px-1.5 py-0.5 rounded text-rose-300 font-mono">developer: true</code>.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-left text-xs space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-slate-500">Your Current Account Role</div>
            <div className="font-bold text-amber-400 capitalize">{profile?.role || 'Unauthenticated'} ({user?.email || 'No Session'})</div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Teachers, Students, and Parents do not possess developer authorization claims and are forbidden from accessing this route.
            </p>
          </div>

          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-rose-600/20"
            >
              <span>Return to Application Workspace</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  console.log('[App Lifecycle] Rendering root App component with Providers');
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AccessibilityProvider>
            <ErrorBoundary title="EduNexus Application Error">
              <Routes>
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/delete-account" element={<DeleteAccountPage />} />
                <Route path="/cookies" element={<CookiePolicyPage />} />
                <Route path="/data-deletion" element={<DataDeletionPolicyPage />} />
                <Route path="/accessibility" element={<AccessibilityStatementPage />} />
                <Route path="/admin" element={
                  <RequireDeveloperGuard>
                    <AppContent initialTab="admin" />
                  </RequireDeveloperGuard>
                } />
                <Route path="/" element={<AppContent />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ErrorBoundary>
          </AccessibilityProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppContent({ initialTab }: { initialTab?: 'dashboard' | 'create' | 'view' | 'admin' | 'playbook' | 'settings' | 'resources' | 'collaboration' | 'voice-notes' | 'tutor' | 'assessment-generator' | 'file-library' | 'image-studio' | 'video-studio' | 'performance' | 'phonetics' | 'qr-mapping' | 'virtual-field-trip' | 'magic-objects' }) {
  console.log('[App Lifecycle] Rendering AppContent functional component');
  const { user, profile, loading, logout, systemPolicies, isDeveloper: isAuthDeveloper, hasDeveloperClaim } = useAuth();
  const { t, language, aiLanguage, setLanguage, setAiLanguage } = useLanguage();

  useEffect(() => {
    console.log('[App Lifecycle] AppContent mounted successfully. Auth user:', user?.uid || 'guest');
  }, [user]);
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'view' | 'admin' | 'playbook' | 'settings' | 'resources' | 'collaboration' | 'voice-notes' | 'tutor' | 'assessment-generator' | 'file-library' | 'image-studio' | 'video-studio' | 'performance' | 'phonetics' | 'qr-mapping' | 'virtual-field-trip' | 'magic-objects'>(() => {
    if (initialTab) return initialTab;
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') return 'admin';
    return 'dashboard';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tutorResourceId, setTutorResourceId] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<SavedDocument | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<DocumentDraft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastGenParams, setLastGenParams] = useState<GenerationParams | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getStoredNotifications());
  const [shortcutToast, setShortcutToast] = useState<{ message: string; keys: string; type: 'save' | 'print' | 'new' | 'info' } | null>(null);

  // Live Real-Time Document Broadcast state
  const [liveBroadcast, setLiveBroadcast] = useState<DocumentBroadcastData | null>(null);

  useEffect(() => {
    const unsub = subscribeToDocumentBroadcast('global_active_broadcast', (broadcastData) => {
      setLiveBroadcast(broadcastData);
    });
    return () => unsub();
  }, []);

  // Subscription & Entitlement State Engine
  const subscriptionState = useSubscription(user?.uid || 'guest');
  const { subscription, limits, checkAndConsumeQuota, upgradePlan, startTrial, buyCredits, toggleAutoRenew } = subscriptionState;
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [featureGateData, setFeatureGateData] = useState<{
    isOpen: boolean;
    title?: string;
    description?: string;
  }>({ isOpen: false });

  // Synthesize a beautiful dual-tone chime sound
  const playChime = () => {
    if (localStorage.getItem('pedagogical_notif_sound') === 'false') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain1.gain.setValueAtTime(0.1, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime); // D6
      gain2.gain.setValueAtTime(0.05, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('AudioContext failed to play chime:', e);
    }
  };

  // Periodic background check of scheduled lessons
  useEffect(() => {
    if (documents.length === 0) return;

    const runCheck = () => {
      const updated = checkUpcomingLessons(
        documents,
        (newNotif) => {
          playChime();
        },
        (docToOpen) => {
          setSelectedDoc(docToOpen);
          setActiveTab('view');
        }
      );
      setNotifications(updated);
    };

    runCheck();
    const interval = setInterval(runCheck, 20000);
    return () => clearInterval(interval);
  }, [documents]);


  // AI Auto-tagging state variables
  const [showAutoTagModal, setShowAutoTagModal] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedAutoTags, setSelectedAutoTags] = useState<string[]>([]);
  const [selectedAutoCategory, setSelectedAutoCategory] = useState('');
  const [pendingDocData, setPendingDocData] = useState<{
    id: string;
    title: string;
    docType: any;
    curriculum: any;
    subject: string;
    classLevel: string;
    topic: string;
    subTopic: string;
    duration: string;
    content: string;
    explainLikeMasterTeacher?: boolean;
    askMentor?: boolean;
    generateVocabulary?: boolean;
    generateDifferentiated?: boolean;
    generateParental?: boolean;
    generateDiagram?: boolean;
    diagramType?: 'flowchart' | 'concept-map';
    lessonsPerWeek?: number;
    weeksPerTerm?: number;
    originalTags: string[];
    lessonLayout?: 'default' | '5e-model' | 'direct-instruction' | 'inquiry-based';
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    paperStyle?: 'ruled' | 'grid' | 'blank';
    penColor?: 'blue' | 'black';
    handwritingIntensity?: number;
    scheduledDate?: string;
    scheduledTime?: string;
  } | null>(null);

  const isStudent = profile?.role === 'Student';
  const isParent = profile?.role === 'Parent';

  const ALLOWED_ADMIN_EMAILS = [
    'ojiambo.godfrey@gmail.com',
    'ojiambo.godfry@gmail.com',
    'godfreynexused@gmail.com'
  ];
  const userEmailLower = (user?.email || profile?.email || '').toLowerCase().trim();
  const isDeveloper = isAuthDeveloper || hasDeveloperClaim || profile?.role === 'developer' || ALLOWED_ADMIN_EMAILS.includes(userEmailLower);
  const isAdmin = profile?.role === 'Administrator' || isDeveloper;
  const hasPlaybookAccess = true;

  // Pilot program feedback form state and interceptor
  const [isPilotFeedbackOpen, setIsPilotFeedbackOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isAppIconModalOpen, setIsAppIconModalOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K (Global Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scanned QR Portal Modal State (auto-opens when scanning physical QR code with camera)
  const [scannedModalOpen, setScannedModalOpen] = useState(false);
  const [scannedStationData, setScannedStationData] = useState<{
    stationNumber?: string;
    subject?: string;
    topic?: string;
    task?: string;
    rewardKey?: string;
    riddle?: string;
  } | undefined>(undefined);
  const [scannedShortId, setScannedShortId] = useState<string | undefined>(undefined);

  // Auto-detect scanned QR parameters on application load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const station = params.get('station');
    const qr = params.get('qr');
    const fieldtrip = params.get('fieldtrip') || params.get('trip');
    const pathname = window.location.pathname;

    if (fieldtrip) {
      setActiveTab('virtual-field-trip');
    } else if (station) {
      setScannedStationData({
        stationNumber: station,
        subject: params.get('subject') || 'CBC Curriculum',
        topic: params.get('topic') || 'Scavenger Hunt Station',
        task: params.get('task') || '',
        rewardKey: params.get('key') || '',
        riddle: params.get('riddle') || ''
      });
      setScannedModalOpen(true);
    } else if (qr) {
      setScannedShortId(qr);
      setScannedModalOpen(true);
    } else if (pathname.startsWith('/qr/')) {
      const shortIdFromPath = pathname.replace('/qr/', '').trim();
      if (shortIdFromPath) {
        setScannedShortId(shortIdFromPath);
        setScannedModalOpen(true);
      }
    }
  }, []);

  const handleSignOutClick = () => {
    // Check if user has already submitted the pilot feedback
    const alreadySubmitted = 
      profile?.hasSubmittedPilotFeedback || 
      localStorage.getItem(`pilot_feedback_submitted_${user?.uid}`) === 'true';
    
    if (alreadySubmitted) {
      logout();
    } else {
      setIsPilotFeedbackOpen(true);
    }
  };

  // Global Dark Mode Preference
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return getStoredDarkMode();
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleDarkModeChange = () => {
      setDarkMode(getStoredDarkMode());
    };
    window.addEventListener('dark_mode_changed', handleDarkModeChange);
    return () => window.removeEventListener('dark_mode_changed', handleDarkModeChange);
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem('pedagogical_dark_mode', String(nextMode));
    window.dispatchEvent(new Event('dark_mode_changed'));
  };

  useEffect(() => {
    const handleNavigation = () => {
      setActiveTab('resources');
    };
    window.addEventListener('navigateToGlobalResources', handleNavigation);
    return () => window.removeEventListener('navigateToGlobalResources', handleNavigation);
  }, []);

  // Keyboard Shortcuts Listener (Ctrl+S, Ctrl+P, Ctrl+N, Ctrl+/)
  useEffect(() => {
    let timeoutId: any = null;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      
      // Save: Ctrl + S / Cmd + S
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const event = new CustomEvent('app-save');
        window.dispatchEvent(event);
        
        if (activeTab === 'create') {
          setShortcutToast({
            message: 'Draft save triggered!',
            keys: 'Ctrl + S',
            type: 'save'
          });
        } else if (activeTab === 'view') {
          setShortcutToast({
            message: 'Document save triggered!',
            keys: 'Ctrl + S',
            type: 'save'
          });
        } else {
          setShortcutToast({
            message: 'Open Document Creator or a document to save.',
            keys: 'Ctrl + S',
            type: 'info'
          });
        }
        
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setShortcutToast(null), 3000);
      }
      
      // Print: Ctrl + P / Cmd + P
      if (isCmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
        setShortcutToast({
          message: 'Opening physical classroom print utility...',
          keys: 'Ctrl + P',
          type: 'print'
        });
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setShortcutToast(null), 3000);
      }
      
      // New Document: Ctrl + N / Cmd + N
      if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (isStudent || isParent) {
          setShortcutToast({
            message: 'Students and parents cannot create custom documents.',
            keys: 'Ctrl + N',
            type: 'info'
          });
        } else {
          startNewGeneration();
          setShortcutToast({
            message: 'Opening Document Creator...',
            keys: 'Ctrl + N',
            type: 'new'
          });
        }
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setShortcutToast(null), 3000);
      }

      // Keyboard Shortcuts Menu: Ctrl + / / Cmd + /
      if (isCmdOrCtrl && (e.key === '/' || e.key === '?' || e.code === 'Slash')) {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
      }

      // Escape to close keyboard shortcuts modal
      if (e.key === 'Escape') {
        setIsShortcutsModalOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [activeTab, isStudent, isParent]);

  // Synchronize documents with Firestore in real-time
  useEffect(() => {
    if (!profile) return;

    if (profile.uid.startsWith('offline-sandbox-')) {
      // In offline sandbox mode, bypass Firestore snapshot completely to avoid auth/network-request-failed
      setDocuments(INITIAL_DOCUMENTS);
      setIsDocsLoading(false);
      return;
    }

    setIsDocsLoading(true);
    const docsCol = collection(db, 'documents');
    const unsubscribe = onSnapshot(docsCol, async (snapshot) => {
      if (snapshot.empty) {
        // Only seed if user is not a Student (since Students don't have write permissions in Firestore rules)
        if (profile.role !== 'Student' && profile.role !== 'Parent') {
          try {
            const batch = writeBatch(db);
            for (const d of INITIAL_DOCUMENTS) {
              batch.set(doc(db, 'documents', d.id), d);
            }
            await batch.commit();
          } catch (e) {
            console.error('Error seeding initial documents:', e);
          }
        }
        setIsDocsLoading(false);
      } else {
        const list: SavedDocument[] = [];
        snapshot.forEach((snapDoc) => {
          list.push(decompressObject(snapDoc.data()) as SavedDocument);
        });
        
        // Sort by lastModified/createdAt descending
        list.sort((a, b) => {
          const timeA = new Date(a.lastModified || a.createdAt).getTime();
          const timeB = new Date(b.lastModified || b.createdAt).getTime();
          return timeB - timeA;
        });
        setDocuments(list);
        saveCurriculumDocsToOfflineCache(list);
        setIsDocsLoading(false);
      }
    }, (error) => {
      console.warn('Firestore snapshot notice/offline mode:', error);
      const cached = getOfflineCachedDocuments();
      if (cached && cached.length > 0) {
        setDocuments(cached);
      } else {
        handleFirestoreError(error, OperationType.LIST, 'documents');
      }
      setIsDocsLoading(false);
    });

    return unsubscribe;
  }, [profile?.uid, profile?.role]);

  // Check for docId parameter in URL query or hash on load/documents update
  useEffect(() => {
    if (documents.length > 0) {
      const getDocIdFromUrl = () => {
        // Try query parameters first
        const searchParams = new URLSearchParams(window.location.search);
        let id = searchParams.get('docId');
        if (id) return id;

        // Try checking hash for format like #docId=xxx or #?docId=xxx
        const hash = window.location.hash;
        if (hash) {
          const hashMatch = hash.match(/(?:docId=)([^&]+)/);
          if (hashMatch && hashMatch[1]) {
            return decodeURIComponent(hashMatch[1]);
          }
        }
        return null;
      };

      const docId = getDocIdFromUrl();
      if (docId) {
        const found = documents.find((doc) => doc.id === docId);
        if (found && (!selectedDoc || selectedDoc.id !== found.id)) {
          setSelectedDoc(found);
          setActiveTab('view');
        }
      }
    }
  }, [documents, selectedDoc?.id]);

  // Sync current selection and view back to the URL hash so that copying URL works natively
  useEffect(() => {
    if (activeTab === 'view' && selectedDoc) {
      window.location.hash = `docId=${selectedDoc.id}`;
    } else if (activeTab === 'dashboard') {
      if (window.location.hash.includes('docId=')) {
        window.location.hash = '';
      }
    }
  }, [activeTab, selectedDoc?.id]);

  // Keep selectedDoc in sync with real-time document list changes (e.g. from collaborative edits)
  useEffect(() => {
    if (selectedDoc) {
      const updated = documents.find((doc) => doc.id === selectedDoc.id);
      if (updated && (
        updated.content !== selectedDoc.content || 
        updated.title !== selectedDoc.title || 
        updated.lastModified !== selectedDoc.lastModified ||
        updated.reflectionWorked !== selectedDoc.reflectionWorked ||
        updated.reflectionDidntWork !== selectedDoc.reflectionDidntWork ||
        updated.reflectionAdjustments !== selectedDoc.reflectionAdjustments ||
        updated.lastModifiedByUid !== selectedDoc.lastModifiedByUid
      )) {
        setSelectedDoc(updated);
      }
    }
  }, [documents, selectedDoc?.id]);

  const handleGenerate = async (params: GenerationParams) => {
    if (isStudent || isParent) {
      alert("Permission Denied: Students and parents are restricted from generating curriculum documents.");
      return;
    }

    setLastGenParams(params);
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          curriculum: params.curriculum || profile?.primaryCurriculum || profile?.curriculum || 'cbc',
          primaryCurriculum: profile?.primaryCurriculum || profile?.curriculum || params.curriculum || 'cbc',
          userId: profile?.uid,
          explainLikeMasterTeacher: systemPolicies?.forceMasterTeacherMode ? true : params.explainLikeMasterTeacher,
          language: aiLanguage
        }),
      });

      const data = await handleResponseJson(response, 'Failed to generate curriculum resources.');
      
      // Construct pending generated document data
      const docTitle = `${params.docType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}: ${params.topic}`;
      const newDocId = `doc-${Date.now()}`;
      
      setPendingDocData({
        id: newDocId,
        title: docTitle,
        docType: params.docType,
        curriculum: params.curriculum,
        subject: params.subject,
        classLevel: params.classLevel,
        topic: params.topic,
        subTopic: params.subTopic,
        duration: params.duration,
        content: data.content,
        explainLikeMasterTeacher: params.explainLikeMasterTeacher,
        askMentor: params.askMentor,
        generateVocabulary: params.generateVocabulary,
        generateDifferentiated: params.generateDifferentiated,
        generateParental: params.generateParental,
        generateDiagram: params.generateDiagram,
        diagramType: params.diagramType,
        lessonsPerWeek: params.lessonsPerWeek,
        weeksPerTerm: params.weeksPerTerm,
        originalTags: params.tags || [],
        lessonLayout: params.lessonLayout as any,
        difficultyLevel: params.difficultyLevel,
        paperStyle: params.paperStyle,
        penColor: params.penColor,
        handwritingIntensity: params.handwritingIntensity,
        classicNotesImageModel: params.classicNotesImageModel as any,
        documentPageSize: params.documentPageSize,
        documentLength: params.documentLength,
        enableSearchGrounding: params.enableSearchGrounding,
        scheduledDate: params.scheduledDate || localStorage.getItem('pedagogical_scheduled_date_hint') || undefined,
        scheduledTime: params.scheduledTime || undefined,
        groundingSources: data.groundingSources || [],
        webSearchQueries: data.webSearchQueries || []
      } as any);

      // Log document generation activity
      logActivity(
        'generate',
        `Generated curriculum document: ${docTitle} (${params.docType.replace('-', ' ')})`,
        profile,
        newDocId,
        docTitle
      );

      const isAutoCategorizationEnabled = localStorage.getItem('pedagogical_auto_categorization') !== 'false';

      if (isAutoCategorizationEnabled) {
        const cat = data.suggestedCategory || 'Other / General';
        const tags = data.suggestedTags || [];
        setSuggestedCategory(cat);
        setSuggestedTags(tags);
        setSelectedAutoCategory(cat);
        setSelectedAutoTags(tags);
        
        setIsGenerating(false); // Finished generating the content
        setShowAutoTagModal(true); // Open the review and apply suggestions modal!
      } else {
        // Immediately save the document with default "Other / General" category and original tags only
        const scheduledDateVal = params.scheduledDate || localStorage.getItem('pedagogical_scheduled_date_hint') || undefined;
        const scheduledTimeVal = params.scheduledTime || undefined;
        if (localStorage.getItem('pedagogical_scheduled_date_hint')) {
          localStorage.removeItem('pedagogical_scheduled_date_hint');
        }

        const finalDoc: SavedDocument = {
          id: newDocId,
          title: docTitle,
          docType: params.docType,
          curriculum: params.curriculum,
          subject: params.subject,
          classLevel: params.classLevel,
          topic: params.topic,
          subTopic: params.subTopic,
          duration: params.duration,
          content: data.content,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          explainLikeMasterTeacher: params.explainLikeMasterTeacher,
          askMentor: params.askMentor,
          generateVocabulary: params.generateVocabulary,
          generateDifferentiated: params.generateDifferentiated,
          generateParental: params.generateParental,
          generateDiagram: params.generateDiagram,
          diagramType: params.diagramType,
          lessonsPerWeek: params.lessonsPerWeek,
          weeksPerTerm: params.weeksPerTerm,
          tags: params.tags || [],
          category: 'Other / General',
          lessonLayout: params.lessonLayout,
          scheduledDate: scheduledDateVal,
          scheduledTime: scheduledTimeVal,
          difficultyLevel: params.difficultyLevel,
          paperStyle: params.paperStyle,
          penColor: params.penColor,
          handwritingIntensity: params.handwritingIntensity,
          classicNotesImageModel: params.classicNotesImageModel as any,
          documentPageSize: params.documentPageSize,
          documentLength: params.documentLength
        };

        const savedDocWithPlaceholder = await saveDocumentWithImageChunks(finalDoc.id, finalDoc);

        // Create an initial version in the versions subcollection
        const initialVersionId = `v-1-${Date.now()}`;
        const initialVersion = {
          id: initialVersionId,
          docId: savedDocWithPlaceholder.id,
          title: savedDocWithPlaceholder.title,
          content: savedDocWithPlaceholder.content,
          lastModified: savedDocWithPlaceholder.createdAt,
          modifiedByUid: profile?.uid || 'system',
          modifiedByName: profile?.displayName || 'AI Generator',
          modifiedByEmail: profile?.email || '',
          versionNumber: 1
        };
        await setDoc(doc(db, 'documents', savedDocWithPlaceholder.id, 'versions', initialVersionId), cleanUndefined(compressObject(initialVersion)));

        setSelectedDoc(savedDocWithPlaceholder);
        setActiveTab('view');
        setIsGenerating(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during curriculum generation. Please make sure your AI service configuration is valid and try again.');
      setIsGenerating(false);
    }
  };

  const handleApplyAutoTags = async () => {
    if (!pendingDocData) return;

    setIsGenerating(true);
    setShowAutoTagModal(false);

    try {
      const mergedTags = Array.from(new Set([...(pendingDocData.originalTags || []), ...selectedAutoTags]));

      const scheduledDateVal = pendingDocData.scheduledDate || localStorage.getItem('pedagogical_scheduled_date_hint') || undefined;
      const scheduledTimeVal = pendingDocData.scheduledTime || undefined;
      if (localStorage.getItem('pedagogical_scheduled_date_hint')) {
        localStorage.removeItem('pedagogical_scheduled_date_hint');
      }

      const finalDoc: SavedDocument = {
        id: pendingDocData.id,
        title: pendingDocData.title,
        docType: pendingDocData.docType,
        curriculum: pendingDocData.curriculum,
        subject: pendingDocData.subject,
        classLevel: pendingDocData.classLevel,
        topic: pendingDocData.topic,
        subTopic: pendingDocData.subTopic,
        duration: pendingDocData.duration,
        content: pendingDocData.content,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        explainLikeMasterTeacher: pendingDocData.explainLikeMasterTeacher,
        askMentor: pendingDocData.askMentor,
        generateVocabulary: pendingDocData.generateVocabulary,
        generateDifferentiated: pendingDocData.generateDifferentiated,
        generateParental: pendingDocData.generateParental,
        generateDiagram: pendingDocData.generateDiagram,
        diagramType: pendingDocData.diagramType,
        lessonsPerWeek: pendingDocData.lessonsPerWeek,
        weeksPerTerm: pendingDocData.weeksPerTerm,
        tags: mergedTags,
        category: selectedAutoCategory,
        lessonLayout: pendingDocData.lessonLayout,
        scheduledDate: scheduledDateVal,
        scheduledTime: scheduledTimeVal,
        difficultyLevel: pendingDocData.difficultyLevel,
        paperStyle: pendingDocData.paperStyle,
        penColor: pendingDocData.penColor,
        handwritingIntensity: pendingDocData.handwritingIntensity,
        classicNotesImageModel: (pendingDocData as any).classicNotesImageModel,
        documentPageSize: (pendingDocData as any).documentPageSize,
        documentLength: (pendingDocData as any).documentLength
      };

      const savedDocWithPlaceholder = await saveDocumentWithImageChunks(finalDoc.id, finalDoc);

      // Create an initial version in the versions subcollection
      const initialVersionId = `v-1-${Date.now()}`;
      const initialVersion = {
        id: initialVersionId,
        docId: savedDocWithPlaceholder.id,
        title: savedDocWithPlaceholder.title,
        content: savedDocWithPlaceholder.content,
        lastModified: savedDocWithPlaceholder.createdAt,
        modifiedByUid: profile?.uid || 'system',
        modifiedByName: profile?.displayName || 'AI Generator',
        modifiedByEmail: profile?.email || '',
        versionNumber: 1
      };
      await setDoc(doc(db, 'documents', savedDocWithPlaceholder.id, 'versions', initialVersionId), cleanUndefined(compressObject(initialVersion)));

      setSelectedDoc(savedDocWithPlaceholder);
      setPendingDocData(null);
      setActiveTab('view');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while saving the generated material.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSkipAutoTags = async () => {
    if (!pendingDocData) return;

    setIsGenerating(true);
    setShowAutoTagModal(false);

    try {
      const scheduledDateVal = pendingDocData.scheduledDate || localStorage.getItem('pedagogical_scheduled_date_hint') || undefined;
      const scheduledTimeVal = pendingDocData.scheduledTime || undefined;
      if (localStorage.getItem('pedagogical_scheduled_date_hint')) {
        localStorage.removeItem('pedagogical_scheduled_date_hint');
      }

      const finalDoc: SavedDocument = {
        id: pendingDocData.id,
        title: pendingDocData.title,
        docType: pendingDocData.docType,
        curriculum: pendingDocData.curriculum,
        subject: pendingDocData.subject,
        classLevel: pendingDocData.classLevel,
        topic: pendingDocData.topic,
        subTopic: pendingDocData.subTopic,
        duration: pendingDocData.duration,
        content: pendingDocData.content,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        explainLikeMasterTeacher: pendingDocData.explainLikeMasterTeacher,
        askMentor: pendingDocData.askMentor,
        generateVocabulary: pendingDocData.generateVocabulary,
        generateDifferentiated: pendingDocData.generateDifferentiated,
        generateParental: pendingDocData.generateParental,
        generateDiagram: pendingDocData.generateDiagram,
        diagramType: pendingDocData.diagramType,
        lessonsPerWeek: pendingDocData.lessonsPerWeek,
        weeksPerTerm: pendingDocData.weeksPerTerm,
        tags: pendingDocData.originalTags || [],
        category: 'Other / General',
        lessonLayout: pendingDocData.lessonLayout,
        scheduledDate: scheduledDateVal,
        scheduledTime: scheduledTimeVal,
        difficultyLevel: pendingDocData.difficultyLevel,
        paperStyle: pendingDocData.paperStyle,
        penColor: pendingDocData.penColor,
        handwritingIntensity: pendingDocData.handwritingIntensity
      };

      const savedDocWithPlaceholder = await saveDocumentWithImageChunks(finalDoc.id, finalDoc);

      // Create an initial version in the versions subcollection
      const initialVersionId = `v-1-${Date.now()}`;
      const initialVersion = {
        id: initialVersionId,
        docId: savedDocWithPlaceholder.id,
        title: savedDocWithPlaceholder.title,
        content: savedDocWithPlaceholder.content,
        lastModified: savedDocWithPlaceholder.createdAt,
        modifiedByUid: profile?.uid || 'system',
        modifiedByName: profile?.displayName || 'AI Generator',
        modifiedByEmail: profile?.email || '',
        versionNumber: 1
      };
      await setDoc(doc(db, 'documents', savedDocWithPlaceholder.id, 'versions', initialVersionId), cleanUndefined(compressObject(initialVersion)));

      setSelectedDoc(savedDocWithPlaceholder);
      setPendingDocData(null);
      setActiveTab('view');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while saving the generated material.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateDoc = async (updatedDoc: SavedDocument) => {
    if (isStudent || isParent) {
      alert("Permission Denied: Students and parents are restricted from editing documents.");
      return;
    }

    try {
      const versionsCol = collection(db, 'documents', updatedDoc.id, 'versions');
      const vSnap = await getDocs(versionsCol);
      let nextVerNum = vSnap.size + 1;

      if (vSnap.size === 0) {
        // Save the previous state (before the edit) as Version 1
        const previousDoc = documents.find(d => d.id === updatedDoc.id) || updatedDoc;
        const v1Id = `v-1-${Date.now() - 1000}`;
        const version1 = {
          id: v1Id,
          docId: updatedDoc.id,
          title: previousDoc.title,
          content: previousDoc.content,
          pageOrientation: previousDoc.pageOrientation || 'portrait',
          lastModified: previousDoc.lastModified || previousDoc.createdAt || new Date().toISOString(),
          modifiedByUid: 'system',
          modifiedByName: 'Original Creator',
          modifiedByEmail: '',
          versionNumber: 1
        };
        await setDoc(doc(db, 'documents', updatedDoc.id, 'versions', v1Id), cleanUndefined(compressObject(version1)));
        nextVerNum = 2;
      }

      const versionId = `v-${nextVerNum}-${Date.now()}`;
      const newVersion = {
        id: versionId,
        docId: updatedDoc.id,
        title: updatedDoc.title,
        content: updatedDoc.content,
        pageOrientation: updatedDoc.pageOrientation || 'portrait',
        lastModified: new Date().toISOString(),
        modifiedByUid: profile?.uid || 'unknown',
        modifiedByName: profile?.displayName || 'Unknown Teacher',
        modifiedByEmail: profile?.email || '',
        versionNumber: nextVerNum
      };

      await setDoc(doc(db, 'documents', updatedDoc.id, 'versions', versionId), cleanUndefined(compressObject(newVersion)));

      const docToSave: SavedDocument = {
        ...updatedDoc,
        pageOrientation: updatedDoc.pageOrientation || 'portrait',
        lastModified: new Date().toISOString()
      };

      const savedDocWithPlaceholder = await saveDocumentWithImageChunks(docToSave.id, docToSave);

      setSelectedDoc(savedDocWithPlaceholder);
      setDocuments(prev => prev.map(d => d.id === savedDocWithPlaceholder.id ? savedDocWithPlaceholder : d));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `documents/${updatedDoc.id}`);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (isStudent || isParent) {
      alert("Permission Denied: Students and parents are restricted from deleting documents.");
      return;
    }

    try {
      await deleteDoc(doc(db, 'documents', id));
      setSelectedDoc(null);
      setActiveTab('dashboard');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `documents/${id}`);
    }
  };

  const startNewGeneration = () => {
    if (isStudent || isParent) return;
    setSelectedDraft(null);
    setErrorMsg(null);
    setActiveTab('create');
  };

  // Auth Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto animate-bounce relative flex items-center justify-center">
            <img src="/icon.svg" className="w-16 h-16 rounded-2xl shadow-md" alt="EduNexus Loading" referrerPolicy="no-referrer" />
          </div>
          <p className="text-sm font-semibold text-slate-500 italic">Syncing with school database...</p>
        </div>
      </div>
    );
  }

  // Not signed in: Show custom AuthScreen
  if (!user || !profile) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4">
          <div className="w-12 h-12 rounded-2xl bg-[#5f6f52]/15 border border-[#5f6f52]/20 flex items-center justify-center text-[#5f6f52] animate-pulse">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
        </div>
      }>
        <AuthScreen />
      </Suspense>
    );
  }

  // Account is suspended: Block app access and display suspended screen
  if (profile.suspended) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-rose-200 shadow-xl rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">Account Suspended</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your registered school profile account has been suspended by the administrator. 
              If you believe this is an error, please contact your administrator or IT department.
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="w-full bg-[#5f6f52] hover:bg-[#5f6f52]/90 text-white font-bold py-2.5 px-4 rounded-xl transition duration-200 text-xs cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead activeTab={activeTab} docTitle={activeTab === 'view' ? selectedDoc?.title : undefined} />
      <div className="app-root-container min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Navigation Header */}
      <nav className="app-nav-bar min-h-16 h-auto sm:h-16 py-1.5 sm:py-0 flex items-center justify-between px-3 sm:px-6 md:px-8 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 shadow-lg shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 lg:hidden text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-xl transition duration-200 cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>
          <button
            onClick={() => setIsAppIconModalOpen(true)}
            className="app-header-brand-button flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2.5 px-1.5 py-1 sm:px-2.5 sm:py-1.5 shrink-0 hover:bg-slate-800/60 rounded-xl transition duration-200 cursor-pointer text-center sm:text-left group border border-transparent hover:border-slate-800"
            aria-label="EduNexus App Icons and PWA Integration"
            title="View Desktop & Phone App Icons / PWA Setup"
          >
            <div className="w-7 h-7 sm:w-9 sm:h-9 relative flex items-center justify-center shrink-0">
              <img src="/icon.svg" className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg shadow-md group-hover:scale-105 transition duration-200" alt="EduNexus App Icon" referrerPolicy="no-referrer" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-slate-900 shadow-xs animate-pulse" />
            </div>
            <div className="app-header-brand-text flex flex-col items-center sm:items-start justify-center text-center sm:text-left whitespace-nowrap">
              <span className="font-extrabold text-xs sm:text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-400 block leading-tight whitespace-nowrap">EduNexus</span>
              <span className="text-[8px] sm:text-[10px] text-cyan-400/90 font-bold uppercase tracking-wider block mt-0.5 whitespace-nowrap">
                <span>Unlimited Learning</span>
                <span className="hidden sm:inline-block ml-1 px-1 py-0.2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[8px] rounded font-black tracking-normal">App Icon</span>
              </span>
            </div>
          </button>
          
          {/* Network & PWA Service Worker Status Badge */}
          <NetworkStatusBadge />

          {/* Quick Search Button */}
          <button
            onClick={() => setIsGlobalSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs font-semibold transition cursor-pointer shadow-xs"
            title="Search Platform (Ctrl + K)"
            aria-label="Search Platform (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Search...</span>
            <kbd className="text-[10px] bg-slate-900 border border-slate-700 text-slate-400 px-1.5 py-0.2 rounded font-mono">⌘K</kbd>
          </button>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            {(() => {
              const computedName = resolveDisplayName(profile.displayName, profile.email, user?.displayName);
              return (
                <>
                  <div className="text-right hidden md:block">
                    <p className={`text-[9px] font-extrabold uppercase tracking-widest ${isAdmin ? 'text-rose-400' : 'text-cyan-400'}`}>
                      {profile.role}
                    </p>
                    <p className="text-sm font-bold text-slate-200">{computedName}</p>
                  </div>
                  
                  {/* Logged in avatar initials */}
                  <div className={`w-10 h-10 rounded-full border-2 border-slate-700 shadow-md flex items-center justify-center text-white font-extrabold text-sm ${
                    isAdmin ? 'bg-rose-600' : isStudent ? 'bg-slate-700' : isParent ? 'bg-purple-600' : 'bg-gradient-to-br from-teal-500 to-cyan-600'
                  }`}>
                    {computedName.slice(0, 2).toUpperCase()}
                  </div>
                </>
              );
            })()}

            {/* Real-time Lesson Alerts & Notifications */}
            <NotificationCenter
              documents={documents}
              notifications={notifications}
              setNotifications={setNotifications}
              onViewDoc={(docId) => {
                const targetDoc = documents.find((d) => d.id === docId);
                if (targetDoc) {
                  setSelectedDoc(targetDoc);
                  setActiveTab('view');
                }
              }}
            />

            {/* Plan Subscription Status Badge & Quick Upgrade Trigger */}
            <SubscriptionBadgeWidget
              subscription={subscription}
              limits={limits}
              onOpenPricingModal={() => setIsPricingModalOpen(true)}
              compact={true}
            />

            {/* Voice-Activated Tab Navigation System */}
            <ErrorBoundary>
              <Suspense fallback={null}>
                <VoiceNavigation
                  onTabChange={(tab) => setActiveTab(tab)}
                  onNewDoc={startNewGeneration}
                  onShortcutsToggle={(open) => setIsShortcutsModalOpen(open)}
                  onPlayChime={playChime}
                  onLogout={handleSignOutClick}
                  currentTab={activeTab}
                />
              </Suspense>
            </ErrorBoundary>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-xl transition duration-200 flex items-center gap-1.5 cursor-pointer ${
                darkMode
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-slate-800/80 text-cyan-300 border border-slate-700 hover:bg-slate-700'
              }`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-cyan-400" />
              )}
            </button>

            <button
              onClick={() => setIsShortcutsModalOpen(true)}
              className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 rounded-xl transition duration-200 cursor-pointer"
              title="Keyboard Shortcuts (Ctrl + /)"
            >
              <Keyboard className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-xl transition duration-200 ${
                activeTab === 'settings' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80'
              }`}
              title="Settings"
            >
              <SettingsIcon className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={handleSignOutClick}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800/80 transition duration-200"
              title="Sign Out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden bg-slate-950">
        {/* Left Side Navigation & Library Panel */}
        <aside className="w-64 md:w-72 bg-slate-900/60 backdrop-blur-md p-5 hidden lg:flex flex-col gap-6 border-r border-slate-800/80 overflow-y-auto shrink-0 z-20">
          
          {/* TEACHER WORKSPACE SECTION */}
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-[0.15em] px-2 mb-1.5">Teacher Workspace</p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-xs font-bold cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Home</span>
              </button>

              <button
                onClick={() => setActiveTab('performance')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-xs font-bold cursor-pointer ${
                  activeTab === 'performance'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>My Classes</span>
              </button>

              {!(isStudent || isParent) && (
                <>
                  <button
                    onClick={startNewGeneration}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-xs font-bold cursor-pointer ${
                      activeTab === 'create'
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Lesson Plans</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('playbook')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-xs font-bold cursor-pointer ${
                      activeTab === 'playbook'
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Teacher Playbook</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setActiveTab('assessment-generator')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-xs font-bold cursor-pointer ${
                  activeTab === 'assessment-generator'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Assessments</span>
              </button>

              <button
                onClick={() => setActiveTab('file-library')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-xs font-bold cursor-pointer ${
                  activeTab === 'file-library'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span>Study Notes</span>
              </button>

              <button
                onClick={() => setActiveTab('tutor')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-xs font-bold cursor-pointer ${
                  activeTab === 'tutor'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>{getCurriculumTutorName(profile?.primaryCurriculum || profile?.curriculum)}</span>
              </button>

              <button
                onClick={() => setActiveTab('resources')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-xs font-bold cursor-pointer ${
                  activeTab === 'resources'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Flashcards</span>
              </button>

              <button
                onClick={() => setActiveTab('image-studio')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-xs font-bold cursor-pointer ${
                  activeTab === 'image-studio'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Image Studio</span>
              </button>

              <button
                onClick={() => setActiveTab('video-studio')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-xs font-bold cursor-pointer ${
                  activeTab === 'video-studio'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Video Studio</span>
              </button>

              <button
                onClick={() => setActiveTab('resources')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-xs font-bold cursor-pointer ${
                  activeTab === 'resources'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Folder className="w-4 h-4" />
                <span>Resources</span>
              </button>
            </div>
          </div>

          {/* INSIGHTS SECTION */}
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-[0.15em] px-2 mb-1.5">Insights</p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab('performance')}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition text-xs font-bold cursor-pointer ${
                  activeTab === 'performance' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Class Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab('performance')}
                className="flex items-center gap-3 px-3 py-2 rounded-xl transition text-xs font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Learner Performance</span>
              </button>

              <button
                onClick={() => setActiveTab('performance')}
                className="flex items-center gap-3 px-3 py-2 rounded-xl transition text-xs font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Reports</span>
              </button>
            </div>
          </div>

          {/* COMMUNICATION SECTION */}
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-[0.15em] px-2 mb-1.5">Communication</p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab('collaboration')}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition text-xs font-bold cursor-pointer ${
                  activeTab === 'collaboration' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Messages</span>
              </button>

              <button
                onClick={() => setActiveTab('collaboration')}
                className="flex items-center gap-3 px-3 py-2 rounded-xl transition text-xs font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>Announcements</span>
              </button>
            </div>
          </div>

          {/* TOOLS SECTION */}
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-[0.15em] px-2 mb-1.5">Tools</p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-3 px-3 py-2 rounded-xl transition text-xs font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Calendar</span>
              </button>

              <button
                onClick={() => setActiveTab('voice-notes')}
                className="flex items-center gap-3 px-3 py-2 rounded-xl transition text-xs font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>To-Do List</span>
              </button>

              <button
                onClick={() => setActiveTab('phonetics')}
                className="flex items-center gap-3 px-3 py-2 rounded-xl transition text-xs font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
              >
                <span className="text-sm">🗣️</span>
                <span>Visual Phonetics</span>
              </button>

              <button
                onClick={() => setActiveTab('qr-mapping')}
                className="flex items-center gap-3 px-3 py-2 rounded-xl transition text-xs font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>QR Hunts</span>
              </button>

              <button
                onClick={() => setActiveTab('virtual-field-trip')}
                className="flex items-center gap-3 px-3 py-2 rounded-xl transition text-xs font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Virtual Field Trips</span>
              </button>

              <button
                onClick={() => setActiveTab('magic-objects')}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition text-xs font-bold cursor-pointer ${
                  activeTab === 'magic-objects'
                    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-lg shadow-purple-500/20 font-black'
                    : 'text-amber-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
                <span>Magic Objects (Click AI)</span>
              </button>
            </div>
          </div>

          {/* DEVELOPER CONSOLE SECTION (PLATFORM OWNER ONLY) */}
          {isDeveloper && (
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold text-rose-400 uppercase tracking-[0.15em] px-2 mb-1.5">Developer Console</p>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-xs font-bold cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-500/20 font-extrabold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Developer Console</span>
                </button>
              </div>
            </div>
          )}

          {/* Upgrade to Premium Promo Box */}
          <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-teal-900/80 via-slate-900 to-cyan-950 text-white space-y-2 border border-teal-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">Pro Upgrade</span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <h4 className="font-extrabold text-xs text-white">Unlock All AI Generators</h4>
            <p className="text-[11px] text-slate-300 leading-tight">Unlimited lesson plans, quizzes & image studios.</p>
            <button onClick={() => setActiveTab('settings')} className="w-full py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 rounded-xl text-xs font-extrabold hover:brightness-110 transition cursor-pointer mt-1 shadow-md">
              Upgrade Now
            </button>
          </div>

          <ErrorBoundary>
            <Suspense fallback={null}>
              <SidebarTimerWidget />
            </Suspense>
          </ErrorBoundary>

          <div className="mt-auto p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
            <p className="text-xs font-bold text-cyan-400 mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> CleanStart Sync Active
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Curriculum alignment features are fully operational. Firestore real-time database is syncing successfully.
            </p>
          </div>
        </aside>

        {/* Central Workspace */}
        <main className="flex-1 p-3 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6 overflow-y-auto w-full max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto ultrawide-container">
          {/* Real-time Teacher Document Broadcast Banner */}
          {liveBroadcast && liveBroadcast.isBroadcasting && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans shrink-0"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <div className="space-y-0.5">
                  <span className="font-extrabold uppercase tracking-wider text-rose-300 text-[10px] block">
                    🔴 LIVE CLASSROOM BROADCAST
                  </span>
                  <p className="font-bold text-slate-100 text-xs sm:text-sm">
                    {liveBroadcast.teacherName || 'Teacher'} is broadcasting: <span className="text-amber-200 underline underline-offset-2">"{liveBroadcast.documentTitle}"</span>
                  </p>
                  {liveBroadcast.spotlightNote && (
                    <p className="text-amber-200 text-xs font-medium bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-800/80 mt-1 inline-block">
                      📣 Educator Note: {liveBroadcast.spotlightNote}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => {
                    const docObj: SavedDocument = {
                      id: liveBroadcast.documentId || 'live_broadcast_doc',
                      title: liveBroadcast.documentTitle || 'Live Broadcast Document',
                      content: liveBroadcast.documentContent || '',
                      subject: liveBroadcast.documentSubject || 'General',
                      classLevel: liveBroadcast.documentClassLevel || 'All Grades',
                      docType: 'lesson-plan',
                      curriculum: 'cbc',
                      topic: liveBroadcast.documentTitle || 'Live Lesson',
                      subTopic: 'Classroom Stream',
                      duration: '45 mins',
                      createdAt: new Date(liveBroadcast.updatedAt).toISOString(),
                      lastModified: new Date(liveBroadcast.updatedAt).toISOString(),
                      tags: ['Live Broadcast', 'Classroom']
                    };
                    setSelectedDoc(docObj);
                    setActiveTab('view');
                  }}
                  className="bg-white text-rose-950 hover:bg-rose-50 px-4 py-2 rounded-xl font-black shadow-md transition flex items-center gap-1.5 text-xs cursor-pointer active:scale-95"
                >
                  <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  <span>{selectedDoc?.id === liveBroadcast.documentId && activeTab === 'view' ? 'Syncing Live View' : 'Join Live View'}</span>
                </button>

                {(profile?.role === 'Teacher' || profile?.role === 'Administrator' || isAuthDeveloper) && (
                  <button
                    onClick={async () => {
                      await stopDocumentBroadcastSession('global_active_broadcast', user?.uid);
                    }}
                    className="bg-rose-900/80 hover:bg-rose-950 border border-rose-700/60 text-rose-200 px-3 py-2 rounded-xl font-bold transition text-xs cursor-pointer"
                    title="End live broadcast session"
                  >
                    Stop Broadcast
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Dynamic Breadcrumbs Navigation & Crawlability Schema */}
          <Breadcrumbs 
            activeTab={activeTab} 
            selectedDoc={selectedDoc} 
            onNavigate={(tab) => setActiveTab(tab as any)} 
            onClearDoc={() => {
              if (activeTab === 'view') {
                setActiveTab('dashboard');
              }
            }} 
          />

          {/* Section Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-teal-300 dark:via-cyan-200 dark:to-blue-300 tracking-tight">
                {activeTab === 'dashboard' && 'Pedagogical Assistant Dashboard'}
                {activeTab === 'create' && 'Curriculum Generator'}
                {activeTab === 'view' && 'Pedagogical Material'}
                {activeTab === 'admin' && 'Developer Console'}
                {activeTab === 'playbook' && 'Teacher Playbook'}
                {activeTab === 'settings' && 'Workspace Settings'}
                {activeTab === 'collaboration' && 'Faculty Collaboration Hub'}
                {activeTab === 'resources' && 'Global Teaching Resource Explorer'}
                {activeTab === 'voice-notes' && 'Audio-to-Text Lecture Notes & Concept Mindmaps'}
                {activeTab === 'tutor' && getCurriculumTutorName(profile?.primaryCurriculum || profile?.curriculum)}
                {activeTab === 'assessment-generator' && 'AI Assessment Item Generator'}
                {activeTab === 'file-library' && 'Curriculum & Teaching Material File Library'}
                {activeTab === 'qr-mapping' && 'QR Touchpoint Mapping & Scavenger Hunt Studio'}
                {activeTab === 'magic-objects' && 'Lower Primary Magic Objects Studio (Click-to-Generate)'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium">
                {activeTab === 'dashboard' && 'Access and organize your curriculum-aligned lesson plans, rubrics, and materials.'}
                {activeTab === 'create' && 'Create high-quality, comprehensive lesson plans or worksheets in seconds.'}
                {activeTab === 'view' && 'Edit, print, or export your teacher administrator resource files.'}
                {activeTab === 'admin' && 'Platform owner console for live telemetry, user accounts, system policies, and infrastructure monitoring.'}
                {activeTab === 'playbook' && 'Comprehensive guide and module directory for EduNexus educational features and school operational workflows.'}
                {activeTab === 'settings' && 'Configure custom typographical styles, autosave delays, and regional metadata.'}
                {activeTab === 'collaboration' && 'Securely share resources, exchange teaching feedback, and tune AI generation templates.'}
                {activeTab === 'resources' && 'Scan, discover, and import real-time global teaching aids, interactive simulators, and worksheets.'}
                {activeTab === 'voice-notes' && 'Enable automatic classroom audio listening and real-time transcribing, then summarize with interactive concept mindmaps.'}
                {activeTab === 'tutor' && 'Deepen student conceptual mastery step-by-step through Socratic scaffolding, error triangulation, and interactive simulations.'}
                {activeTab === 'assessment-generator' && 'Generate rigorous, curriculum-scaffolded assessment items with diagnostic feedback and in-place fine-tuning.'}
                {activeTab === 'file-library' && 'Browse, search, and manage teacher-uploaded curriculum guides, syllabi, and reference sheets.'}
                {activeTab === 'qr-mapping' && 'Design complete, print-ready classroom scavenger hunts for all subjects and map digital QR touchpoints.'}
                {activeTab === 'magic-objects' && 'Zero-prompt interactive studio for lower school students and teachers. Simply click any animated object to generate AI lessons, rhymes, audio narrations, and guides!'}
              </p>
            </div>

            {/* Dark / Light Mode Toggle Button on Home Header */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={toggleDarkMode}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? (
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
            </div>
          </header>

          {/* Quick Error Banner */}
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 rounded-2xl p-4 flex gap-3 text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Generation Error</span>
                <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">{errorMsg}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-red-900 dark:text-red-200">
                  {lastGenParams && (
                    <button
                      onClick={() => {
                        const params = lastGenParams;
                        setErrorMsg(null);
                        handleGenerate(params);
                      }}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                      <span>{isGenerating ? 'Retrying...' : 'Retry Generation'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setErrorMsg(null);
                      setActiveTab('create');
                    }}
                    className="hover:underline text-red-800 dark:text-red-300 font-semibold"
                  >
                    Modify Parameters
                  </button>
                  <button
                    onClick={() => setErrorMsg(null)}
                    className="hover:underline text-red-600 dark:text-red-400"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Core App Routing views */}
          <div className="flex-1">
            <Suspense fallback={<ViewLoadingFallback />}>
              {activeTab === 'dashboard' && (
                <Dashboard
                  documents={documents}
                  isLoading={isDocsLoading}
                  onCreateNew={startNewGeneration}
                  onOpenDoc={(doc) => {
                    setSelectedDoc(doc);
                    setActiveTab('view');
                  }}
                  onLoadDraft={(draft) => {
                    setSelectedDraft(draft);
                    setActiveTab('create');
                  }}
                  onOpenFlashcards={() => setActiveTab('resources')}
                  onOpenAssessmentGenerator={() => setActiveTab('assessment-generator')}
                  onOpenAITutor={() => setActiveTab('tutor')}
                  onOpenImageStudio={() => setActiveTab('image-studio')}
                  onOpenVideoStudio={() => setActiveTab('video-studio')}
                  onOpenQRMapping={() => setActiveTab('qr-mapping')}
                  onOpenAdminPlaybook={() => setActiveTab('admin')}
                  onOpenMagicStudio={() => setActiveTab('magic-objects')}
                  userRole={profile?.role}
                  notifications={notifications}
                  setNotifications={setNotifications}
                  darkMode={darkMode}
                  onToggleDarkMode={toggleDarkMode}
                />
              )}

              {activeTab === 'create' && (
                <DocumentCreator
                  onBack={() => {
                    setSelectedDraft(null);
                    setActiveTab('dashboard');
                  }}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  initialDraft={selectedDraft}
                />
              )}

              {activeTab === 'view' && selectedDoc && (
                <DocumentViewer
                  document={selectedDoc}
                  onBack={() => setActiveTab('dashboard')}
                  onUpdate={handleUpdateDoc}
                  onDelete={handleDeleteDoc}
                />
              )}

              {activeTab === 'playbook' && (
                <div className="space-y-8 animate-fadeIn">
                  <AdminPlaybook />
                </div>
              )}

              {activeTab === 'admin' && (
                isDeveloper ? (
                  <div className="space-y-8 animate-fadeIn">
                    <AdminPanel />
                  </div>
                ) : (
                  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-900/40 rounded-3xl border border-slate-800">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                      <Shield className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-100">403 - Access Forbidden</h2>
                    <p className="text-sm text-slate-400 max-w-md">
                      The Developer Console is strictly restricted to authorized platform owners. Access denied.
                    </p>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                    >
                      Return to Workspace
                    </button>
                  </div>
                )
              )}

              {activeTab === 'settings' && (
                <Settings
                  documents={documents}
                  subscription={subscription}
                  limits={limits}
                  onOpenPricingModal={() => setIsPricingModalOpen(true)}
                  onToggleAutoRenew={toggleAutoRenew}
                />
              )}

              {activeTab === 'resources' && (
                <GlobalResources />
              )}

              {activeTab === 'collaboration' && (
                <CollaborationHub />
              )}

              {activeTab === 'voice-notes' && (
                <VoiceNotebook currentProfile={profile} />
              )}

              {activeTab === 'tutor' && (
                <AITutor
                  documents={documents}
                  initialSelectedResourceId={tutorResourceId}
                  onOpenImageStudio={() => setActiveTab('image-studio')}
                  onOpenVideoStudio={() => setActiveTab('video-studio')}
                />
              )}

              {activeTab === 'assessment-generator' && (
                <AssessmentGenerator onBackToDashboard={() => setActiveTab('dashboard')} />
              )}

              {activeTab === 'performance' && (
                <LearnersPerformance />
              )}

              {activeTab === 'file-library' && (
                <FileLibrary
                  onSelectResourceForTutor={(resourceId) => {
                    setTutorResourceId(resourceId);
                    setActiveTab('tutor');
                  }}
                />
              )}

              {activeTab === 'image-studio' && (
                <ImageStudio />
              )}

              {activeTab === 'video-studio' && (
                <VideoStudio />
              )}

              {activeTab === 'phonetics' && (
                <VisualPhoneticsStudio />
              )}

              {activeTab === 'qr-mapping' && (
                <QRMappingDashboard
                  documents={documents}
                  onNavigateToTutor={(documentId, prompt) => {
                    setActiveTab('tutor');
                  }}
                  onNavigateToAdaptivePath={(subject, topic, lowDifficulty) => {
                    setActiveTab('dashboard');
                  }}
                  onNavigateToParentPlaybook={(studentName, section) => {
                    setActiveTab('dashboard');
                  }}
                  onSelectDocForReader={(docToOpen) => {
                    setSelectedDoc(docToOpen);
                    setActiveTab('view');
                  }}
                  onClose={() => setActiveTab('dashboard')}
                />
              )}

              {activeTab === 'virtual-field-trip' && (
                <VirtualFieldTripStudio
                  onOpenQRMapping={() => setActiveTab('qr-mapping')}
                />
              )}

              {activeTab === 'magic-objects' && (
                <LowerSchoolMagicStudio
                  onSaveToDocuments={(newDoc) => {
                    setDocuments(prev => [newDoc, ...prev]);
                  }}
                  onNavigateToViewer={(docToView) => {
                    setSelectedDoc(docToView);
                    setActiveTab('view');
                  }}
                  onOpenVideoStudio={() => setActiveTab('video-studio')}
                />
              )}
            </Suspense>
          </div>

          {/* Unified Responsive Footer */}
          <Footer />
        </main>
      </div>
    </div>

    {/* AI Auto-Tagging Modal */}
    {showAutoTagModal && pendingDocData && (
      <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-150 shadow-2xl overflow-hidden animate-fadeIn">
          <div className="bg-[#5f6f52] p-6 text-white">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-[#fefae0] animate-pulse" />
              <div>
                <h3 className="text-lg font-bold">✨ AI Content Auto-Tagging</h3>
                <p className="text-xs text-slate-100 mt-0.5">
                  Suggested organization based on lesson plan content analysis
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Category selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Suggested Category
              </label>
              <EditableSelect
                value={selectedAutoCategory}
                onChange={setSelectedAutoCategory}
                options={[
                  "STEM (Science, Tech, Engineering, Math)",
                  "Languages & Literacy",
                  "Humanities & Social Sciences",
                  "Early Childhood Development",
                  "Arts, Sports & Creative",
                  "Technical & Vocational Studies",
                  "Inclusion & SEN Adaptations",
                  "Other / General"
                ]}
                placeholder=""
                className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#5f6f52] transition"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                AI analyzed the generated material and suggested this subject grouping.
              </p>
            </div>

            {/* Tags selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Suggested Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No recommended tags found.</p>
                ) : (
                  suggestedTags.map((tag) => {
                    const isSelected = selectedAutoTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAutoTags(selectedAutoTags.filter((t) => t !== tag));
                          } else {
                            setSelectedAutoTags([...selectedAutoTags, tag]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Toggle recommended tags to keep in your lesson library database.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleSkipAutoTags}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition cursor-pointer"
            >
              Skip / Original Tags
            </button>
            <button
              type="button"
              onClick={handleApplyAutoTags}
              className="px-5 py-2 bg-[#5f6f52] hover:bg-[#4d5b41] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Apply & Save Material
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Keyboard Shortcut HUD Toast */}
    <AnimatePresence>
      {shortcutToast && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-[120] max-w-sm bg-slate-900/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-4 animate-fadeIn"
        >
          <div className="p-2.5 bg-slate-800 rounded-xl text-amber-400 border border-slate-700">
            {shortcutToast.type === 'save' && <Save className="w-5 h-5 text-emerald-400" />}
            {shortcutToast.type === 'print' && <Printer className="w-5 h-5 text-[#85a98f]" />}
            {shortcutToast.type === 'new' && <Plus className="w-5 h-5 text-amber-400" />}
            {shortcutToast.type === 'info' && <Keyboard className="w-5 h-5 text-blue-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-100 leading-snug">{shortcutToast.message}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono tracking-wider">
              Triggered via <span className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded-md font-extrabold">{shortcutToast.keys}</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Global Keyboard Shortcuts Reference Modal */}
    <AnimatePresence>
      {isShortcutsModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsShortcutsModalOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="relative w-full max-w-2xl bg-[#fdfbf7] border border-[#eadecd] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
          >
            {/* Header banner */}
            <div className="bg-gradient-to-r from-[#5f6f52] to-[#85a98f] p-6 text-white relative">
              <button
                onClick={() => setIsShortcutsModalOpen(false)}
                className="absolute top-6 right-6 text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-xl transition duration-200 cursor-pointer"
                aria-label="Close shortcuts menu"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                  <Keyboard className="w-6 h-6 text-amber-200" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold">Workspace Shortcuts Reference</h3>
                  <p className="text-xs text-white/80 mt-0.5">High-speed keyboard commands designed for pedagogical workflow efficiency</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Category: Universal Navigation */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-[#eadecd] pb-1.5">Universal Quick Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Shortcut 1 */}
                  <div className="bg-white border border-[#eadecd]/60 hover:border-[#5f6f52]/40 p-4 rounded-2xl flex items-start gap-3.5 transition shadow-2xs">
                    <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                      <Keyboard className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">Toggle Shortcuts Menu</span>
                        <kbd className="bg-slate-100 text-slate-800 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md border border-slate-200 shadow-3xs whitespace-nowrap">Ctrl + /</kbd>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Displays or dismisses this interactive global shortcuts reference manual instantly from any view.</p>
                    </div>
                  </div>

                  {/* Shortcut 2 */}
                  <div className="bg-white border border-[#eadecd]/60 hover:border-[#5f6f52]/40 p-4 rounded-2xl flex items-start gap-3.5 transition shadow-2xs">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                      <Save className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">Save Document / Draft</span>
                        <kbd className="bg-slate-100 text-slate-800 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md border border-slate-200 shadow-3xs whitespace-nowrap">Ctrl + S</kbd>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Saves active lesson drafting progress or document modifications securely to Firestore.</p>
                    </div>
                  </div>

                  {/* Shortcut 3 */}
                  <div className="bg-white border border-[#eadecd]/60 hover:border-[#5f6f52]/40 p-4 rounded-2xl flex items-start gap-3.5 transition shadow-2xs">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">Print Teaching Material</span>
                        <kbd className="bg-slate-100 text-slate-800 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md border border-slate-200 shadow-3xs whitespace-nowrap">Ctrl + P</kbd>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Launches the classroom-ready printing overlay to output beautifully formatted physical paper handouts.</p>
                    </div>
                  </div>

                  {/* Shortcut 4 */}
                  <div className="bg-white border border-[#eadecd]/60 hover:border-[#5f6f52]/40 p-4 rounded-2xl flex items-start gap-3.5 transition shadow-2xs">
                    <div className="p-2 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">Start New Material</span>
                        <kbd className="bg-slate-100 text-slate-800 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md border border-slate-200 shadow-3xs whitespace-nowrap">Ctrl + N</kbd>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Switches active workspace to the AI Material Creator and resets draft variables to start fresh.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category: Advanced Panel Hotkeys */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-[#eadecd] pb-1.5">Contextual Workflows</h4>
                <div className="space-y-2.5">
                  <div className="bg-white border border-[#eadecd]/60 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-3xs">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Trigger AI Material Generation</p>
                        <p className="text-[10px] text-slate-400">Works inside the AI Document Creator screen when parameters are filled</p>
                      </div>
                    </div>
                    <kbd className="bg-slate-100 text-slate-800 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md border border-slate-200 shadow-3xs">Ctrl + Enter</kbd>
                  </div>

                  <div className="bg-white border border-[#eadecd]/60 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-3xs">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Dismiss Overlays & Dialogs</p>
                        <p className="text-[10px] text-slate-400">Works on all active popups, menus, modals, and helper guides</p>
                      </div>
                    </div>
                    <kbd className="bg-slate-100 text-slate-800 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md border border-slate-200 shadow-3xs">Escape</kbd>
                  </div>
                </div>
              </div>

              <div className="bg-[#faf6ee] border border-[#eadecd] rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-[#5f6f52] shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  These global keyboard combinations allow you to operate the <strong className="text-slate-800">EduNexus Suite</strong> at high speed. You can also view these shortcuts at any time by visiting the bottom section of your workspace settings page.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-[#eadecd]/60 p-5 flex justify-end">
              <button
                onClick={() => setIsShortcutsModalOpen(false)}
                className="bg-[#5f6f52] hover:bg-[#4d5a42] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition duration-150 cursor-pointer shadow-sm"
              >
                Close Shortcuts Guide
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Mobile Sidebar Navigation Drawer */}
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black z-50 lg:hidden"
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800/80 shadow-2xl z-55 p-6 flex flex-col gap-6 lg:hidden overflow-y-auto text-slate-100"
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setIsAppIconModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex flex-row items-center gap-2.5 text-left group cursor-pointer"
              >
                <div className="w-9 h-9 relative flex items-center justify-center shrink-0">
                  <img src="/icon.svg" className="w-9 h-9 rounded-lg shadow-sm group-hover:scale-105 transition duration-200" alt="EduNexus App Icon" referrerPolicy="no-referrer" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-slate-900 shadow-xs" />
                </div>
                <div>
                  <span className="font-bold text-base tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-400 block leading-none">EduNexus</span>
                  <span className="text-[9px] text-cyan-400/90 font-bold uppercase tracking-wider block mt-0.5">Unlimited Learning</span>
                </div>
              </button>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleDarkMode}
                  className={`p-1.5 rounded-lg transition duration-200 cursor-pointer ${
                    darkMode
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-cyan-300 border border-slate-700'
                  }`}
                  title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
                </button>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Desktop & Phone App Icon PWA Promo Button */}
            <button
              onClick={() => {
                setIsAppIconModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-[#0b172a] to-[#1e3a8a] text-white rounded-xl shadow-md hover:opacity-95 transition-all text-left cursor-pointer w-full group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 p-0.5 border border-white/20 shrink-0">
                  <img src="/icon.svg" className="w-full h-full rounded-md" alt="EduNexus App Icon" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">Desktop & Phone App Icons</p>
                  <p className="text-[9px] text-cyan-300 font-medium mt-0.5">Install on Desktop / Phone Screen</p>
                </div>
              </div>
              <span className="text-xs text-cyan-300 font-bold group-hover:translate-x-1 transition-transform">→</span>
            </button>

            {/* Sidebar Content */}
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-[10px] font-extrabold text-[#a9b388] uppercase tracking-[0.2em] mb-3">Core Actions</p>
                <div className="flex flex-col gap-2">
                  {!(isStudent || isParent) ? (
                    <button
                      onClick={() => {
                        startNewGeneration();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 p-3 bg-[#5f6f52] text-white rounded-xl shadow-md hover:bg-[#4d5a42] transition-all font-semibold text-sm cursor-pointer w-full text-left"
                    >
                      <PlusCircle className="w-4.5 h-4.5" />
                      <span>New Lesson Plan</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-[#e5e1da]/50 border border-slate-200 text-slate-500 text-xs rounded-xl font-medium flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>Read-Only Classroom Mode</span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      setActiveTab('dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-colors text-sm font-medium cursor-pointer w-full text-left ${
                      activeTab === 'dashboard'
                        ? 'bg-[#5f6f52]/10 text-[#5f6f52] font-semibold'
                        : 'bg-white text-slate-600 hover:bg-[#e9e5db]'
                    }`}
                  >
                    <BookOpen className="w-4.5 h-4.5 text-[#5f6f52]" />
                    <span>My Library</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('collaboration');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-colors text-sm font-medium cursor-pointer w-full text-left ${
                      activeTab === 'collaboration'
                        ? 'bg-[#5f6f52]/10 text-[#5f6f52] font-semibold'
                        : 'bg-white text-slate-600 hover:bg-[#e9e5db]'
                    }`}
                  >
                    <Users className="w-4.5 h-4.5 text-[#5f6f52]" />
                    <span>Collaboration Hub</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('voice-notes');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-colors text-sm font-medium cursor-pointer w-full text-left ${
                      activeTab === 'voice-notes'
                        ? 'bg-[#5f6f52]/10 text-[#5f6f52] font-semibold'
                        : 'bg-white text-slate-600 hover:bg-[#e9e5db]'
                    }`}
                  >
                    <Mic className="w-4.5 h-4.5 text-[#5f6f52]" />
                    <span>Audio Notes & Mindmaps</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('tutor');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-colors text-sm font-medium cursor-pointer w-full text-left ${
                      activeTab === 'tutor'
                        ? 'bg-[#5f6f52]/10 text-[#5f6f52] font-semibold'
                        : 'bg-white text-slate-600 hover:bg-[#e9e5db]'
                    }`}
                  >
                    <GraduationCap className="w-4.5 h-4.5 text-[#5f6f52]" />
                    <span>EduNexus AI Tutor</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('resources');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-colors text-sm font-medium cursor-pointer w-full text-left ${
                      activeTab === 'resources'
                        ? 'bg-[#5f6f52]/10 text-[#5f6f52] font-semibold'
                        : 'bg-white text-slate-600 hover:bg-[#e9e5db]'
                    }`}
                  >
                    <Globe className="w-4.5 h-4.5 text-[#5f6f52]" />
                    <span>Global Resources & Books</span>
                  </button>

                  {!(isStudent || isParent) && (
                    <>
                      <button
                        onClick={() => {
                          setActiveTab('file-library');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-colors text-sm font-medium cursor-pointer w-full text-left ${
                          activeTab === 'file-library'
                            ? 'bg-[#5f6f52]/10 text-[#5f6f52] font-semibold'
                            : 'bg-white text-slate-600 hover:bg-[#e9e5db]'
                        }`}
                      >
                        <FolderOpen className="w-4.5 h-4.5 text-[#5f6f52]" />
                        <span>File Library</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('image-studio');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-colors text-sm font-medium cursor-pointer w-full text-left ${
                          activeTab === 'image-studio'
                            ? 'bg-[#5f6f52]/10 text-[#5f6f52] font-semibold'
                            : 'bg-white text-slate-600 hover:bg-[#e9e5db]'
                        }`}
                      >
                        <ImageIcon className="w-4.5 h-4.5 text-[#5f6f52]" />
                        <span>Image Studio</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('video-studio');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-colors text-sm font-medium cursor-pointer w-full text-left ${
                          activeTab === 'video-studio'
                            ? 'bg-[#5f6f52]/10 text-[#5f6f52] font-semibold'
                            : 'bg-white text-slate-600 hover:bg-[#e9e5db]'
                        }`}
                      >
                        <Video className="w-4.5 h-4.5 text-[#5f6f52]" />
                        <span>Video Studio</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('assessment-generator');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-colors text-sm font-medium cursor-pointer w-full text-left ${
                          activeTab === 'assessment-generator'
                            ? 'bg-[#5f6f52]/10 text-[#5f6f52] font-semibold'
                            : 'bg-white text-slate-600 hover:bg-[#e9e5db]'
                        }`}
                      >
                        <Sparkles className="w-4.5 h-4.5 text-[#5f6f52]" />
                        <span>Assessment Generator</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('performance');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-colors text-sm font-medium cursor-pointer w-full text-left ${
                          activeTab === 'performance'
                            ? 'bg-[#5f6f52]/10 text-[#5f6f52] font-semibold'
                            : 'bg-white text-slate-600 hover:bg-[#e9e5db]'
                        }`}
                      >
                        <Award className="w-4.5 h-4.5 text-[#5f6f52]" />
                        <span>Learners' Performance</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('qr-mapping');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-colors text-sm font-medium cursor-pointer w-full text-left ${
                          activeTab === 'qr-mapping'
                            ? 'bg-[#5f6f52]/10 text-[#5f6f52] font-semibold'
                            : 'bg-white text-slate-600 hover:bg-[#e9e5db]'
                        }`}
                      >
                        <QrCode className="w-4.5 h-4.5 text-[#5f6f52]" />
                        <span>QR Mapping & Scavenger Hunts</span>
                      </button>
                    </>
                  )}

                  {!(isStudent || isParent) && (
                    <button
                      onClick={() => {
                        setActiveTab('playbook');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-all text-sm font-medium cursor-pointer w-full text-left ${
                        activeTab === 'playbook'
                          ? 'bg-[#5f6f52]/10 text-[#5f6f52] font-semibold'
                          : 'bg-white text-slate-600 hover:bg-[#e9e5db]'
                      }`}
                    >
                      <Shield className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                      <span>Teacher Playbook</span>
                    </button>
                  )}

                  {isDeveloper && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-all text-sm font-medium cursor-pointer w-full text-left ${
                        activeTab === 'admin'
                          ? 'bg-rose-500/10 text-rose-700 font-semibold border-rose-200'
                          : 'bg-white text-slate-600 hover:bg-[#e9e5db]'
                      }`}
                    >
                      <Shield className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                      <span>Developer Console</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsShortcutsModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-transparent transition-colors text-sm font-medium bg-white text-slate-600 hover:bg-[#e9e5db] cursor-pointer w-full text-left"
                  >
                    <Keyboard className="w-4.5 h-4.5 text-[#5f6f52]" />
                    <span className="flex-1 text-left">Keyboard Shortcuts</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-mono font-extrabold px-1.5 py-0.5 rounded border border-slate-200">Ctrl + /</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-colors text-sm font-medium cursor-pointer w-full text-left ${
                      activeTab === 'settings'
                        ? 'bg-[#5f6f52]/10 text-[#5f6f52] font-semibold'
                        : 'bg-white text-slate-600 hover:bg-[#e9e5db]'
                    }`}
                  >
                    <SettingsIcon className="w-4.5 h-4.5 text-[#5f6f52]" />
                    <span>Settings</span>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-extrabold text-[#a9b388] uppercase tracking-[0.2em] mb-3">Recent Documents</p>
                <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {documents.slice(0, 5).map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoc(doc);
                        setActiveTab('view');
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-3 bg-white/50 hover:bg-white rounded-xl border border-[#e5e1da] transition-all cursor-pointer group"
                    >
                      <p className="text-xs font-bold text-slate-800 group-hover:text-[#5f6f52] truncate">
                        {doc.topic}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <span>{doc.classLevel}</span>
                        <span>{doc.subject}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Classroom Pacing Widget on Mobile Drawer */}
              <div className="pt-2 border-t border-[#e5e1da]/60">
                <p className="text-[10px] font-extrabold text-[#a9b388] uppercase tracking-[0.2em] mb-2">Classroom Utilities</p>
                <ErrorBoundary>
                  <Suspense fallback={null}>
                    <SidebarTimerWidget />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    <Suspense fallback={null}>
      {/* Pilot Program Evaluation Form Modal */}
      {isPilotFeedbackOpen && (
        <ErrorBoundary title="Pilot Evaluation Feedback">
          <PilotFeedbackModal 
            isOpen={isPilotFeedbackOpen} 
            onClose={() => {
              setIsPilotFeedbackOpen(false);
              // Standard exit - log out
              logout();
            }} 
            onSuccess={() => {
              setIsPilotFeedbackOpen(false);
              // Successful submit - log out
              logout();
            }} 
          />
        </ErrorBoundary>
      )}

      {/* Desktop & Phone App Icon Showcase Modal */}
      <AppIconShowcaseModal
        isOpen={isAppIconModalOpen}
        onClose={() => setIsAppIconModalOpen(false)}
      />

      {/* Global Command & Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        documents={documents}
        onSelectDoc={(doc) => {
          setSelectedDoc(doc);
          setActiveTab('view');
        }}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
      />

      {/* Scanned QR Portal Modal for Mobile Camera Scanning */}
      <ScannedStationPortalModal
        isOpen={scannedModalOpen}
        onClose={() => setScannedModalOpen(false)}
        stationData={scannedStationData}
        shortId={scannedShortId}
        onLaunchTutor={(docTitle, socraticPrompt) => {
          setActiveTab('tutor');
        }}
        onLaunchAdaptive={(subject, topic) => {
          setActiveTab('resources');
        }}
        onLaunchParentPlaybook={() => {
          setActiveTab('admin');
        }}
      />

      {/* EduNexus Pricing, Plans & Subscription Modal */}
      <PricingSubscriptionModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        subscription={subscription}
        limits={limits}
        onUpgrade={upgradePlan}
        onStartTrial={startTrial}
        onBuyCredits={buyCredits}
      />

      {/* Daily Quota & Feature Gate Modal */}
      <FeatureGateModal
        isOpen={featureGateData.isOpen}
        onClose={() => setFeatureGateData({ isOpen: false })}
        title={featureGateData.title}
        description={featureGateData.description}
        onOpenPricingModal={() => setIsPricingModalOpen(true)}
        onStartTrial={!subscription?.hasUsedTrial ? startTrial : undefined}
      />
    </Suspense>
    </>
  );
}
