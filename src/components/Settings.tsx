import React, { useState, useEffect, useRef } from 'react';
import { useAuth, resolveDisplayName } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAccessibility, LearnerProfile, VOICE_PROFILES, VoiceProfile } from '../context/AccessibilityContext';
import { db } from '../firebase';
import { SavedDocument } from '../types';
import {
  connectGoogleWorkspace,
  getGoogleWorkspaceToken,
  getGoogleWorkspaceUser,
  disconnectGoogleWorkspace,
  backupDocumentToDrive
} from '../lib/googleWorkspace';
import { 
  Settings as SettingsIcon, 
  BookOpen, 
  Monitor, 
  Check, 
  HelpCircle,
  Palette,
  Sparkles,
  User,
  Eye,
  Moon,
  Sun,
  Globe,
  Sliders,
  Type as TypeIcon,
  Users,
  Plus,
  Trash2,
  Activity,
  RefreshCw,
  Clock,
  ShieldAlert,
  Volume2,
  Keyboard,
  Loader2,
  CloudUpload,
  Smartphone,
  Mic,
  MicOff,
  Radio,
  Camera,
  CameraOff,
  Video,
  KeyRound
} from 'lucide-react';
import AboutModal from './AboutModal';
import AppIconShowcaseModal from './AppIconShowcaseModal';

interface ServerHealthMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  retryCount: number;
  fallbackCount: number;
  averageLatencyMs: number;
  lastCallTimestamp: string;
  retryLogs: {
    timestamp: string;
    model: string;
    error: string;
    fallbackModel?: string;
    resolved: boolean;
  }[];
}

interface SettingsProps {
  documents?: SavedDocument[];
}

export default function Settings({ documents = [] }: SettingsProps) {
  const { user, profile, sendPasswordReset } = useAuth();
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleResetPasswordInSettings = async () => {
    const targetEmail = profile?.email || user?.email;
    if (!targetEmail) {
      setResetStatus({ type: 'error', message: 'No registered email address found for this account.' });
      return;
    }
    setResetStatus(null);
    setIsResettingPassword(true);
    try {
      await sendPasswordReset(targetEmail);
      setResetStatus({ type: 'success', message: `Password reset link sent to ${targetEmail}` });
    } catch (err: any) {
      console.error('Password reset in Settings failed:', err);
      setResetStatus({ type: 'error', message: err?.message || 'Failed to send password reset email.' });
    } finally {
      setIsResettingPassword(false);
    }
  };
  const { language, aiLanguage, setLanguage, setAiLanguage, t } = useLanguage();
  const {
    fontSize,
    lineSpacing,
    useDyslexicFont,
    highContrast,
    screenReaderHelper,
    activeLearnerProfile,
    learnerProfiles,
    selectedVoiceProfileId,
    playbackSpeed,
    ttsHighlightingEnabled,
    ttsKeyboardControlsEnabled,
    selectedMicDeviceId,
    selectedCameraDeviceId,
    setFontSize,
    setLineSpacing,
    setUseDyslexicFont,
    setHighContrast,
    setScreenReaderHelper,
    setActiveLearnerProfile,
    addLearnerProfile,
    deleteLearnerProfile,
    setSelectedVoiceProfileId,
    setPlaybackSpeed,
    setTtsHighlightingEnabled,
    setTtsKeyboardControlsEnabled,
    setSelectedMicDeviceId,
    setSelectedCameraDeviceId,
  } = useAccessibility();

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isAppIconModalOpen, setIsAppIconModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'accessibility' | 'profiles' | 'health'>('general');
  
  const [paperStyle, setPaperStyle] = useState<'classic' | 'modern'>(() => {
    return (localStorage.getItem('pedagogical_paper_style') as 'classic' | 'modern') || 'classic';
  });

  const [autoSaveDelay, setAutoSaveDelay] = useState<string>(() => {
    return localStorage.getItem('pedagogical_autosave_delay') || '800';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('pedagogical_dark_mode') === 'true';
  });

  const [autoBackup, setAutoBackup] = useState<boolean>(() => {
    return localStorage.getItem('pedagogical_auto_backup') === 'true';
  });

  const [autoCategorization, setAutoCategorization] = useState<boolean>(() => {
    return localStorage.getItem('pedagogical_auto_categorization') !== 'false';
  });

  // Audio & Video Input Devices State
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [isMicTesting, setIsMicTesting] = useState<boolean>(false);
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean>(false);

  const [isCameraTesting, setIsCameraTesting] = useState<boolean>(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean>(false);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const fetchMediaDevices = async () => {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter(d => d.kind === 'audioinput');
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          setAudioInputDevices(audioInputs);
          setVideoInputDevices(videoInputs);
          if (audioInputs.some(d => d.label)) {
            setMicPermissionGranted(true);
          }
          if (videoInputs.some(d => d.label)) {
            setCameraPermissionGranted(true);
          }
        } catch (err) {
          console.error('[MediaDevices Error]', err);
        }
      }
    };

    fetchMediaDevices();
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', fetchMediaDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', fetchMediaDevices);
      };
    }
  }, []);

  const handleRequestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermissionGranted(true);
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputDevices(devices.filter(d => d.kind === 'audioinput'));
      setSaveSuccess(true);
      setSuccessMsg('Microphone access granted. Audio input devices updated!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Microphone permission denied', err);
    }
  };

  const handleRequestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermissionGranted(true);
      const devices = await navigator.mediaDevices.enumerateDevices();
      setVideoInputDevices(devices.filter(d => d.kind === 'videoinput'));
      setSaveSuccess(true);
      setSuccessMsg('Camera access granted. Video input devices updated!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Camera permission denied', err);
    }
  };

  const handleTestMic = async () => {
    if (isMicTesting) {
      setIsMicTesting(false);
      setMicVolumeLevel(0);
      return;
    }
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedMicDeviceId ? { deviceId: { exact: selectedMicDeviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setIsMicTesting(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let animId: number;
      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        setMicVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animId = requestAnimationFrame(checkVolume);
      };
      checkVolume();

      setTimeout(() => {
        cancelAnimationFrame(animId);
        stream.getTracks().forEach(t => t.stop());
        audioCtx.close();
        setIsMicTesting(false);
        setMicVolumeLevel(0);
      }, 6000);
    } catch (err) {
      console.error('Failed to test mic', err);
      setIsMicTesting(false);
    }
  };

  const handleTestCamera = async () => {
    if (isCameraTesting) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
      setIsCameraTesting(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: selectedCameraDeviceId ? { deviceId: { exact: selectedCameraDeviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;
      setIsCameraTesting(true);

      setTimeout(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play().catch(e => console.error(e));
        }
      }, 100);
    } catch (err) {
      console.error('Failed to test camera', err);
      setIsCameraTesting(false);
    }
  };

  useEffect(() => {
    const handleAutoCategorizationChanged = () => {
      setAutoCategorization(localStorage.getItem('pedagogical_auto_categorization') !== 'false');
    };
    window.addEventListener('auto_categorization_changed', handleAutoCategorizationChanged);
    return () => {
      window.removeEventListener('auto_categorization_changed', handleAutoCategorizationChanged);
    };
  }, []);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('Settings saved and synced!');

  // Google Workspace / Drive State & Handlers
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState<{ current: number; total: number; active: boolean; success: string | null; error: string | null }>({
    current: 0,
    total: 0,
    active: false,
    success: null,
    error: null,
  });

  useEffect(() => {
    // Sync current Google Workspace token & user details
    const token = getGoogleWorkspaceToken();
    const gUser = getGoogleWorkspaceUser();
    setGoogleToken(token);
    if (gUser) {
      setGoogleUserEmail(gUser.email);
    }
  }, []);

  const handleConnectWorkspace = async () => {
    setIsWorkspaceLoading(true);
    setBackupProgress(p => ({ ...p, success: null, error: null }));
    try {
      const res = await connectGoogleWorkspace();
      if (res) {
        setGoogleToken(res.accessToken);
        setGoogleUserEmail(res.user.email);
      }
    } catch (err: any) {
      setBackupProgress(p => ({ ...p, error: err.message || 'Failed to authenticate with Google Workspace.' }));
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const handleDisconnectWorkspace = () => {
    disconnectGoogleWorkspace();
    setGoogleToken(null);
    setGoogleUserEmail(null);
  };

  const handleBackupAllDocuments = async () => {
    if (documents.length === 0) {
      setBackupProgress(p => ({ ...p, error: 'No curriculum documents in your library to backup.' }));
      return;
    }
    
    setIsWorkspaceLoading(true);
    setBackupProgress({
      current: 0,
      total: documents.length,
      active: true,
      success: null,
      error: null
    });

    try {
      let backedUpCount = 0;
      for (const doc of documents) {
        await backupDocumentToDrive(doc);
        backedUpCount++;
        setBackupProgress(p => ({ ...p, current: backedUpCount }));
      }
      setBackupProgress(p => ({
        ...p,
        active: false,
        success: `Successfully backed up and synchronized all ${documents.length} curriculum documents directly to your "EduNexus" folder on Google Drive!`
      }));
    } catch (err: any) {
      setBackupProgress(p => ({
        ...p,
        active: false,
        error: `Backup interrupted: ${err.message || 'An error occurred during Google Drive backup.'}`
      }));
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  // Health Metrics State
  const [health, setHealth] = useState<ServerHealthMetrics | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // New custom profile form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileType, setNewProfileType] = useState<LearnerProfile['type']>('dyslexia');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [newProfileFontSize, setNewProfileFontSize] = useState<LearnerProfile['accommodations']['fontSize']>('normal');
  const [newProfileLineSpacing, setNewProfileLineSpacing] = useState<LearnerProfile['accommodations']['lineSpacing']>('normal');
  const [newProfileDyslexic, setNewProfileDyslexic] = useState(false);
  const [newProfileVocab, setNewProfileVocab] = useState(false);
  const [newProfileChecklist, setNewProfileChecklist] = useState(false);
  const [newProfileAudio, setNewProfileAudio] = useState(false);

  // TTS Settings
  const [ttsVolume, setTtsVolume] = useState<number>(() => Number(localStorage.getItem('pedagogical_tts_volume') || '1'));

  const fetchHealthMetrics = async () => {
    setLoadingHealth(true);
    try {
      const response = await fetch('/api/health-metrics');
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      }
    } catch (err) {
      console.error('Failed to load API health metrics:', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'health') {
      fetchHealthMetrics();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleThemeChange = () => {
      const current = (localStorage.getItem('pedagogical_paper_style') as 'classic' | 'modern') || 'classic';
      setPaperStyle(current);
    };
    window.addEventListener('paper_theme_changed', handleThemeChange);
    return () => window.removeEventListener('paper_theme_changed', handleThemeChange);
  }, []);

  useEffect(() => {
    const handleDarkModeChange = () => {
      setDarkMode(localStorage.getItem('pedagogical_dark_mode') === 'true');
    };
    window.addEventListener('dark_mode_changed', handleDarkModeChange);
    return () => window.removeEventListener('dark_mode_changed', handleDarkModeChange);
  }, []);

  const handleUpdateTheme = (theme: 'classic' | 'modern') => {
    setPaperStyle(theme);
    localStorage.setItem('pedagogical_paper_style', theme);
    window.dispatchEvent(new Event('paper_theme_changed'));
    triggerSuccessBanner('Visual stylesheet theme updated.');
  };

  const handleUpdateAutoSave = (delay: string) => {
    setAutoSaveDelay(delay);
    localStorage.setItem('pedagogical_autosave_delay', delay);
    triggerSuccessBanner('Auto-save debounce latency updated.');
  };

  const handleUpdateDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem('pedagogical_dark_mode', enabled ? 'true' : 'false');
    window.dispatchEvent(new Event('dark_mode_changed'));
    triggerSuccessBanner(enabled ? 'Dark Mode layout enabled.' : 'Standard ambient theme enabled.');
  };

  const handleUpdateAutoBackup = (enabled: boolean) => {
    setAutoBackup(enabled);
    localStorage.setItem('pedagogical_auto_backup', enabled ? 'true' : 'false');
    triggerSuccessBanner(enabled ? 'Automated Google Drive backups enabled.' : 'Automated Google Drive backups disabled.');
  };

  const handleUpdateAutoCategorization = (enabled: boolean) => {
    setAutoCategorization(enabled);
    localStorage.setItem('pedagogical_auto_categorization', enabled ? 'true' : 'false');
    window.dispatchEvent(new Event('auto_categorization_changed'));
    triggerSuccessBanner(enabled ? 'AI Auto-Categorization enabled.' : 'AI Auto-Categorization disabled.');
  };

  const handleUpdateLanguage = (lang: 'en' | 'sw') => {
    setLanguage(lang);
    triggerSuccessBanner('Workspace UI language changed.');
  };

  const handleUpdateAiLanguage = (lang: 'en' | 'sw') => {
    setAiLanguage(lang);
    triggerSuccessBanner('AI output target language updated.');
  };

  const handleUpdateTtsSpeed = (val: number) => {
    setPlaybackSpeed(val);
    triggerSuccessBanner(`TTS read-aloud speed tuned to ${val}x`);
  };

  const handleUpdateTtsVolume = (val: number) => {
    setTtsVolume(val);
    localStorage.setItem('pedagogical_tts_volume', String(val));
  };

  const speakProfileSample = (profile: VoiceProfile) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = `Hello! I am ${profile.name}. This is a preview of my voice accent.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = playbackSpeed;
    utterance.volume = ttsVolume;
    
    // Find matching voice
    const voices = window.speechSynthesis.getVoices();
    const localeVoices = voices.filter(v => 
      profile.langCodes.some(lc => v.lang.toLowerCase().replace('_', '-').includes(lc.toLowerCase()))
    );
    
    let bestVoice = null;
    if (localeVoices.length > 0) {
      for (const voiceName of profile.voiceNames) {
        bestVoice = localeVoices.find(v => v.name.toLowerCase().includes(voiceName.toLowerCase()));
        if (bestVoice) break;
      }
      if (!bestVoice) bestVoice = localeVoices[0];
    } else {
      bestVoice = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    }
    
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    window.speechSynthesis.speak(utterance);
    triggerSuccessBanner(`Playing voice preview for ${profile.name}`);
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const id = 'custom_' + Date.now();
    const newProfile: LearnerProfile = {
      id,
      name: newProfileName,
      type: newProfileType,
      description: newProfileDesc || `Custom ${newProfileType} accommodations.`,
      accommodations: {
        fontSize: newProfileFontSize,
        lineSpacing: newProfileLineSpacing,
        useDyslexicFont: newProfileDyslexic,
        simplifyVocabulary: newProfileVocab,
        includeChecklists: newProfileChecklist,
        includeAudioCues: newProfileAudio,
      }
    };

    addLearnerProfile(newProfile);
    triggerSuccessBanner('Custom learner accommodation profile created!');
    
    // Reset Form
    setNewProfileName('');
    setNewProfileDesc('');
    setShowAddForm(false);
  };

  const triggerSuccessBanner = (msg = 'Changes saved successfully!') => {
    setSuccessMsg(msg);
    setSaveSuccess(true);
    const timer = setTimeout(() => setSaveSuccess(false), 2400);
    return () => clearTimeout(timer);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20">
      {/* Real-time Toast Sync Message */}
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#5f6f52] text-white px-5 py-3.5 rounded-xl shadow-lg font-bold text-xs flex items-center gap-2.5 transition-all duration-300">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="p-6 md:p-8 bg-white border border-[#e5e1da] rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#5f6f52]/10 flex items-center justify-center text-[#5f6f52]">
              <SettingsIcon className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-xl font-serif font-bold text-[#5f6f52]">{t('app_settings_title')}</h2>
          </div>
          <p className="text-slate-500 text-xs">
            {profile?.role === 'Administrator'
              ? "Configure visual styling, fine-tune pedagogy parameters, customize active student accessibility profiles, or monitor API health status."
              : "Configure visual styling, fine-tune pedagogy parameters, or customize active student accessibility profiles."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
          <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-right">
            <p className="text-[9px] font-extrabold uppercase text-[#a9b388] tracking-widest leading-none mb-1">{t('signed_in_as')}</p>
            <p className="text-xs font-bold text-slate-800 leading-tight">{resolveDisplayName(profile?.displayName, profile?.email || user?.email, user?.displayName)}</p>
            <p className="text-[10px] text-slate-500">{profile?.email || 'classroom@school.edu'}</p>
          </div>
          <button
            type="button"
            disabled={isResettingPassword}
            onClick={handleResetPasswordInSettings}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
            title="Send password reset link to your email"
          >
            <KeyRound className="w-4 h-4 text-[#5f6f52]" />
            <span>{isResettingPassword ? 'Sending...' : 'Reset Password'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#5f6f52]/5 border border-[#e5e1da] text-[#5f6f52] hover:text-[#46553b] hover:border-[#5f6f52]/40 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer group shrink-0"
          >
            <HelpCircle className="w-4 h-4 text-[#5f6f52]/80 group-hover:text-[#5f6f52] transition-colors" />
            <span>{t('about_workspace')}</span>
          </button>
        </div>
      </div>

      {resetStatus && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-xs transition-all ${
          resetStatus.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' 
            : 'bg-rose-50 border-rose-200 text-rose-900 font-semibold'
        }`}>
          <span>{resetStatus.message}</span>
          <button 
            type="button"
            onClick={() => setResetStatus(null)}
            className="text-xs underline font-bold cursor-pointer hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'general'
              ? 'border-[#5f6f52] text-[#5f6f52]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>General Preferences</span>
        </button>
        <button
          onClick={() => setActiveTab('accessibility')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'accessibility'
              ? 'border-[#5f6f52] text-[#5f6f52]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Accessibility Console</span>
        </button>
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'profiles'
              ? 'border-[#5f6f52] text-[#5f6f52]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Learner Accommodations Profiles</span>
          <span className="bg-[#5f6f52]/10 text-[#5f6f52] text-[10px] px-1.5 py-0.5 rounded-full font-black">
            {learnerProfiles.length}
          </span>
        </button>
        {profile?.role === 'Administrator' && (
          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'health'
                ? 'border-[#5f6f52] text-[#5f6f52]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>API Health & Retry Registry</span>
            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              Live
            </span>
          </button>
        )}
      </div>

      {/* Render Active Tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* App Icons & PWA Integration Section */}
          <div className="bg-gradient-to-br from-[#0b172a] via-[#0f2342] to-[#1e3a8a] border border-slate-800 rounded-2xl p-6 text-white shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 p-0.5 border border-white/20 shrink-0">
                  <img src="/icon.svg" className="w-full h-full rounded-lg" alt="EduNexus App Icon" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">EduNexus Desktop & Phone App Icons</h3>
                  <p className="text-[11px] text-slate-300">PWA installation, desktop launcher dock icon, and phone home screen integration</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider rounded-full">
                PWA Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Desktop App Icon Card */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                    <Monitor className="w-4 h-4" />
                    <span>Desktop App Icon & Dock</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Integrated for macOS Dock, Windows Taskbar, and standalone window headers.
                  </p>
                </div>
                <button
                  onClick={() => setIsAppIconModalOpen(true)}
                  className="mt-2 py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Preview Desktop Icon</span>
                </button>
              </div>

              {/* Phone App Icon Card */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Smartphone className="w-4 h-4" />
                    <span>Phone App Icon & Home Screen</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    High-resolution squircle icon with notification badge and mobile touch launcher support.
                  </p>
                </div>
                <button
                  onClick={() => setIsAppIconModalOpen(true)}
                  className="mt-2 py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Preview Phone Icon</span>
                </button>
              </div>
            </div>
          </div>
          {/* Visual Themes Block */}
          <div className="bg-white border border-[#e5e1da] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
              <Palette className="w-5 h-5 text-[#5f6f52]" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">{t('theme_and_style')}</h3>
                <p className="text-[11px] text-slate-500">{t('theme_and_style_desc')}</p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Classic Notebook Option */}
              <div 
                onClick={() => handleUpdateTheme('classic')}
                className={`group relative cursor-pointer rounded-xl border-2 p-5 transition-all duration-300 flex flex-col gap-4 overflow-hidden ${
                  paperStyle === 'classic' 
                    ? 'border-[#5f6f52] bg-[#fdfbf7] shadow-md' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="h-28 rounded-lg bg-[#faf6ee] border border-[#eadecd] relative overflow-hidden p-3 shadow-inner select-none">
                  <div className="absolute top-0 bottom-0 left-2.5 width-4 flex flex-col justify-around py-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#eadecd] border border-slate-200/50"></div>
                    ))}
                  </div>
                  <div className="absolute top-0 bottom-0 left-7 w-[1px] bg-red-400 opacity-60"></div>
                  <div className="w-full h-full flex flex-col justify-between pl-6 py-1">
                    <div className="w-3/4 h-1.5 bg-[#c5d1e0] opacity-50 rounded"></div>
                    <div className="w-11/12 h-1 bg-slate-300/40 rounded"></div>
                    <div className="w-5/6 h-1 bg-slate-300/40 rounded"></div>
                  </div>
                  <span className="absolute bottom-2 right-3 font-handwritten text-[11px] font-bold text-emerald-800">
                    Kalam Cursive Font
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#5f6f52] transition-colors flex items-center gap-1.5">
                      <span>📝 Classic Notebook</span>
                      {paperStyle === 'classic' && (
                        <span className="inline-block w-4 h-4 bg-[#5f6f52] rounded-full text-white flex items-center justify-center p-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </h4>
                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-bold uppercase rounded">
                      Warm/Antique
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Traditional hand-ruled chalkboard notebook vibe featuring light cream paper, double lines, hand-drawn binder holes, and cursive handwriting font.
                  </p>
                </div>
              </div>

              {/* Modern Minimalist Option */}
              <div 
                onClick={() => handleUpdateTheme('modern')}
                className={`group relative cursor-pointer rounded-xl border-2 p-5 transition-all duration-300 flex flex-col gap-4 overflow-hidden ${
                  paperStyle === 'modern' 
                    ? 'border-slate-900 bg-slate-50 shadow-md' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="h-28 rounded-lg bg-white border-2 border-slate-900 relative overflow-hidden p-4 shadow-inner select-none flex flex-col justify-between">
                  <div className="border-b-2 border-slate-900 pb-1.5">
                    <div className="w-1/2 h-2.5 bg-slate-900 rounded-sm"></div>
                  </div>
                  <div className="space-y-1.5 flex-1 mt-2.5">
                    <div className="w-full h-1.5 bg-slate-400 rounded-sm"></div>
                    <div className="w-5/6 h-1.5 bg-slate-400 rounded-sm"></div>
                  </div>
                  <span className="absolute bottom-2 right-3 font-sans text-[10px] font-bold text-slate-900 tracking-wide uppercase">
                    Inter Sans-Serif
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-950 transition-colors flex items-center gap-1.5">
                      <span>💻 Modern Minimalist</span>
                      {paperStyle === 'modern' && (
                        <span className="inline-block w-4 h-4 bg-slate-900 rounded-full text-white flex items-center justify-center p-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </h4>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 text-[8px] font-bold uppercase rounded">
                      High Contrast
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Clean-cut, high-contrast modern digital layout featuring a crisp pure white background, thick dark slate-900 borders, and Inter sans-serif typography.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Language Switcher Component */}
          <LanguageSwitcher />

            {/* Sync Settings */}
          <div className="bg-white border border-[#e5e1da] rounded-2xl shadow-sm p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#5f6f52]" /> Interface & Syncing
              </h4>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold uppercase">Workspace Contrast Scheme</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateDarkMode(false)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                        !darkMode ? 'bg-[#5f6f52] text-white border-transparent' : 'bg-white border-slate-200'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>{t('light_mode')}</span>
                    </button>
                    <button
                      onClick={() => handleUpdateDarkMode(true)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                        darkMode ? 'bg-[#5f6f52] text-white border-transparent' : 'bg-white border-slate-200'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>{t('dark_mode')}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold uppercase">Auto-Save Save Debounce Delay</label>
                  <select
                    value={autoSaveDelay}
                    onChange={(e) => handleUpdateAutoSave(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#5f6f52]"
                  >
                    <option value="500">Frequent (500ms latency) - Fast Sync</option>
                    <option value="800">Balanced (800ms latency) - Recommended</option>
                    <option value="1500">Relaxed (1500ms latency) - Economical</option>
                  </select>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] text-slate-500 font-bold uppercase flex items-center gap-1.5 select-none">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Auto-Categorization (AI Suggestions)
                  </label>
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-slate-700">AI Folder & Tag Suggestions</p>
                      <p className="text-[9px] text-slate-400">Suggest folders & tags for newly generated materials</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateAutoCategorization(!autoCategorization)}
                      className={`w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 focus:outline-none ${
                        autoCategorization ? 'bg-[#5f6f52]' : 'bg-slate-300'
                      }`}
                      title={autoCategorization ? "Disable Auto-Categorization" : "Enable Auto-Categorization"}
                      id="settings-auto-categorization-toggle"
                    >
                      <div
                        className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                          autoCategorization ? 'translate-x-4.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts Quick Reference */}
            <div className="bg-[#faf6ee] border border-[#eadecd] rounded-2xl p-5 space-y-3 md:col-span-2 shadow-sm">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[#5f6f52]" /> Global Keyboard Shortcuts
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Boost your lesson planning and administrative workflow efficiency with these global, high-speed school-workspace key combinations:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1.5">
                <div className="bg-white border border-[#eadecd]/60 p-3 rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Save Document</span>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md border border-slate-200">Ctrl + S</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Instantly saves current drafting progress or material modifications to Firestore.</p>
                </div>

                <div className="bg-white border border-[#eadecd]/60 p-3 rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Print Material</span>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md border border-slate-200">Ctrl + P</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Launches physical print options to immediately output formatted paper handouts.</p>
                </div>

                <div className="bg-white border border-[#eadecd]/60 p-3 rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">New Document</span>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md border border-slate-200">Ctrl + N</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Switches tabs to the AI Document Creator to start draft generation from scratch.</p>
                </div>
              </div>
            </div>

            {/* Google Drive Sync & Backup Block */}
            <div className="bg-white border border-[#e5e1da] rounded-2xl shadow-sm overflow-hidden md:col-span-2">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CloudUpload className="w-5 h-5 text-[#5f6f52]" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Google Drive Cloud Sync & Backup</h3>
                    <p className="text-[11px] text-slate-500">Synchronize and secure all your generated curriculum materials to your school Google Drive</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase rounded-full">
                  Google Workspace
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Automated Google Drive Backup Switch */}
                <div id="settings-auto-backup-card" className="flex items-start justify-between gap-4 p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>🔄 Automated Google Drive Backup</span>
                      {autoBackup && googleToken && (
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-extrabold uppercase rounded">
                          Active & Monitoring
                        </span>
                      )}
                    </label>
                    <p className="text-[10px] text-slate-500 leading-normal max-w-xl">
                      Automatically upload and back up newly generated curriculum documents (Lesson Plans, Schemes of Work, Worksheets, etc.) to a secure <strong className="text-slate-800 font-bold">'EduNexus'</strong> folder on your Google Drive as soon as they are saved in your local workspace.
                    </p>
                    {!googleToken && (
                      <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                        ⚠️ Disabled until you Link Google Drive below.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="global-auto-backup-switch"
                      checked={autoBackup}
                      onChange={(e) => handleUpdateAutoBackup(e.target.checked)}
                      className="w-4 h-4 text-[#5f6f52] border-slate-300 rounded focus:ring-[#5f6f52] cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                {!googleToken ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#faf6ee] border border-[#eadecd] rounded-xl p-5">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800">Direct Google Account Integration</h4>
                      <p className="text-[11px] text-slate-500 max-w-xl">
                        Authorize EduNexus to access your Google Drive. This allows you to sync lesson plans, syllabus templates, assessment worksheets, and study guides directly to a dedicated, secure folder in your account.
                      </p>
                    </div>
                    <button
                      onClick={handleConnectWorkspace}
                      disabled={isWorkspaceLoading}
                      className="whitespace-nowrap bg-[#4285F4] hover:bg-[#357ae8] text-white rounded-xl py-2.5 px-4 text-xs font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-65 cursor-pointer"
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
                      Link Google Drive
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">Connected & Synced with Google Account</p>
                          <p className="text-[10px] text-slate-500">{googleUserEmail || 'Authorized'}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleDisconnectWorkspace}
                        className="px-3 py-1.5 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 rounded-lg text-[11px] font-semibold transition bg-white cursor-pointer"
                      >
                        Unlink Drive Account
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-800">Full Library Backup</h4>
                          <p className="text-[11px] text-slate-500">
                            Create or update Google Docs backups for all <strong>{documents.length}</strong> generated curriculum documents in your library.
                          </p>
                        </div>
                        <button
                          onClick={handleBackupAllDocuments}
                          disabled={isWorkspaceLoading || documents.length === 0}
                          className="whitespace-nowrap bg-[#5f6f52] hover:bg-[#4d5c41] text-white rounded-xl py-2 px-4 text-xs font-semibold transition flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          {isWorkspaceLoading && backupProgress.active ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CloudUpload className="w-4 h-4" />
                          )}
                          Backup Entire Library
                        </button>
                      </div>

                      {/* Backup Progress Indicator */}
                      {backupProgress.active && (
                        <div className="space-y-2 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                          <div className="flex justify-between text-[11px] font-bold text-slate-700">
                            <span>Backing up files to Google Drive...</span>
                            <span>{backupProgress.current} / {backupProgress.total} documents</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#5f6f52] transition-all duration-300 rounded-full"
                              style={{ width: `${(backupProgress.current / backupProgress.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {backupProgress.success && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-xl text-xs font-medium">
                          {backupProgress.success}
                        </div>
                      )}

                      {backupProgress.error && (
                        <div className="p-3.5 bg-red-50 border border-red-150 text-red-800 rounded-xl text-xs font-medium">
                          {backupProgress.error}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
      )}

      {activeTab === 'accessibility' && (
        <div className="bg-white border border-[#e5e1da] rounded-2xl shadow-sm overflow-hidden p-6 space-y-8 animate-fadeIn">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#5f6f52]" /> Workspace Accessibility Enhancements
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              Directly apply high-legibility formatting presets to document displays, matching individual learning cognitive criteria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
            {/* Direct Layout Controls */}
            <div className="space-y-5">
              <h4 className="text-xs font-extrabold text-[#5f6f52] uppercase tracking-widest">Visual Presentation Toggles</h4>
              
              <div className="space-y-4">
                {/* Dyslexic Font Toggle */}
                <div className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-800 block">Dyslexic-Friendly Typography</label>
                    <p className="text-[10px] text-slate-500 leading-snug">Uses Comic Neue font with asymmetrical bottoms, wide spacing, and heavy stems to support dyslexic reading.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={useDyslexicFont}
                    onChange={(e) => {
                      setUseDyslexicFont(e.target.checked);
                      triggerSuccessBanner(e.target.checked ? 'Dyslexic-friendly font applied!' : 'Returned to default typography.');
                    }}
                    className="w-4 h-4 text-[#5f6f52] border-slate-300 rounded focus:ring-[#5f6f52] shrink-0 mt-1 cursor-pointer"
                  />
                </div>

                {/* High Contrast Mode Toggle */}
                <div className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-800 block">High Contrast Mode</label>
                    <p className="text-[10px] text-slate-500 leading-snug">Overrides backgrounds to solid white, thick black outlines, and absolute black text to support visually impaired readers.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => {
                      setHighContrast(e.target.checked);
                      triggerSuccessBanner(e.target.checked ? 'High contrast accessibility overrides active!' : 'Returned to standard colors.');
                    }}
                    className="w-4 h-4 text-[#5f6f52] border-slate-300 rounded focus:ring-[#5f6f52] shrink-0 mt-1 cursor-pointer"
                  />
                </div>

                {/* Screen Reader Aid Toggle */}
                <div className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-800 block">Aural Screen Reader Helpers</label>
                    <p className="text-[10px] text-slate-500 leading-snug">Adds extra ARIA label structures and descriptive read-aloud triggers to classroom materials.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={screenReaderHelper}
                    onChange={(e) => {
                      setScreenReaderHelper(e.target.checked);
                      triggerSuccessBanner(e.target.checked ? 'Aural screen reader supports activated.' : 'Disabled screen reader hints.');
                    }}
                    className="w-4 h-4 text-[#5f6f52] border-slate-300 rounded focus:ring-[#5f6f52] shrink-0 mt-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Layout parameters */}
            <div className="space-y-6">
              <h4 className="text-xs font-extrabold text-[#5f6f52] uppercase tracking-widest">Paragraph Spacing & Sizing</h4>
              
              <div className="space-y-4">
                {/* Paragraph spacing selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Paragraph Line Spacing</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['normal', 'relaxed', 'loose'] as const).map(sp => (
                      <button
                        key={sp}
                        onClick={() => {
                          setLineSpacing(sp);
                          triggerSuccessBanner(`Line spacing set to ${sp}.`);
                        }}
                        className={`py-2 text-xs font-bold border rounded-xl capitalize ${
                          lineSpacing === sp
                            ? 'bg-[#5f6f52] text-white border-transparent'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font size multiplier */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Readability Font Sizing</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['normal', 'large', 'xlarge'] as const).map(sz => (
                      <button
                        key={sz}
                        onClick={() => {
                          setFontSize(sz);
                          triggerSuccessBanner(`Font size preset set to ${sz}.`);
                        }}
                        className={`py-2 text-xs font-bold border rounded-xl capitalize ${
                          fontSize === sz
                            ? 'bg-[#5f6f52] text-white border-transparent'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Microphone Input Device Selection (Internal vs External Mic) */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-[#5f6f52]" />
                      <span>Audio Input Source (Internal vs External Microphone)</span>
                    </h4>
                    {audioInputDevices.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {audioInputDevices.length} Mic{audioInputDevices.length > 1 ? 's' : ''} Detected
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Select your preferred audio capture device (built-in internal microphone, USB external mic, or Bluetooth headset) for voice navigation, AI voice dictation, and audio notes.
                  </p>

                  {!micPermissionGranted && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-amber-900">Grant Microphone Access</p>
                        <p className="text-[10px] text-amber-700">Click to grant permission so EduNexus can list available internal and external microphones.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRequestMicPermission}
                        className="px-3 py-1.5 bg-amber-700 text-white rounded-lg text-xs font-bold hover:bg-amber-800 transition-colors shrink-0 flex items-center gap-1"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Enable Mics</span>
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                      Active Input Microphone
                    </label>
                    <select
                      value={selectedMicDeviceId}
                      onChange={(e) => {
                        setSelectedMicDeviceId(e.target.value);
                        const selectedDev = audioInputDevices.find(d => d.deviceId === e.target.value);
                        setSaveSuccess(true);
                        setSuccessMsg(`Switched microphone input to: ${selectedDev?.label || 'Selected Device'}`);
                        setTimeout(() => setSaveSuccess(false), 3000);
                      }}
                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52]"
                    >
                      <option value="">Default System Microphone (Auto-Detect)</option>
                      {audioInputDevices.map((dev, idx) => {
                        const isInternal = dev.label.toLowerCase().includes('internal') || dev.label.toLowerCase().includes('built-in');
                        const isExternal = dev.label.toLowerCase().includes('usb') || dev.label.toLowerCase().includes('external') || dev.label.toLowerCase().includes('headset') || dev.label.toLowerCase().includes('bluetooth');
                        const tag = isInternal ? ' [Internal]' : isExternal ? ' [External]' : '';
                        return (
                          <option key={dev.deviceId || idx} value={dev.deviceId}>
                            {dev.label || `Microphone ${idx + 1}`} {tag}
                          </option>
                        );
                      })}
                    </select>

                    <div className="pt-2 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleTestMic}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          isMicTesting
                            ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isMicTesting ? (
                          <>
                            <Radio className="w-3.5 h-3.5 text-rose-600 animate-spin" />
                            <span>Stop Mic Test (6s)</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-[#5f6f52]" />
                            <span>Test Selected Microphone</span>
                          </>
                        )}
                      </button>

                      {isMicTesting && (
                        <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Input Level:</span>
                          <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full transition-all duration-75"
                              style={{ width: `${micVolumeLevel}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-700 w-8 text-right">{micVolumeLevel}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Camera Input Device Selection (Internal vs External Camera) */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#5f6f52]" />
                      <span>Video Input Source (Internal vs External Camera)</span>
                    </h4>
                    {videoInputDevices.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {videoInputDevices.length} Camera{videoInputDevices.length > 1 ? 's' : ''} Detected
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Select your preferred webcam or camera device (built-in webcam, external USB camera, or document camera) for AR Hologram reading, visual diagnostics, and video recording features.
                  </p>

                  {!cameraPermissionGranted && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-amber-900">Grant Camera Access</p>
                        <p className="text-[10px] text-amber-700">Click to grant permission so EduNexus can list available internal and external webcams.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRequestCameraPermission}
                        className="px-3 py-1.5 bg-amber-700 text-white rounded-lg text-xs font-bold hover:bg-amber-800 transition-colors shrink-0 flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Enable Cameras</span>
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                      Active Input Camera
                    </label>
                    <select
                      value={selectedCameraDeviceId}
                      onChange={(e) => {
                        setSelectedCameraDeviceId(e.target.value);
                        const selectedDev = videoInputDevices.find(d => d.deviceId === e.target.value);
                        setSaveSuccess(true);
                        setSuccessMsg(`Switched camera input to: ${selectedDev?.label || 'Selected Camera'}`);
                        setTimeout(() => setSaveSuccess(false), 3000);
                      }}
                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52]"
                    >
                      <option value="">Default System Camera (Auto-Detect)</option>
                      {videoInputDevices.map((dev, idx) => {
                        const isInternal = dev.label.toLowerCase().includes('internal') || dev.label.toLowerCase().includes('integrated') || dev.label.toLowerCase().includes('built-in') || dev.label.toLowerCase().includes('front');
                        const isExternal = dev.label.toLowerCase().includes('usb') || dev.label.toLowerCase().includes('external') || dev.label.toLowerCase().includes('obs') || dev.label.toLowerCase().includes('webcam');
                        const tag = isInternal ? ' [Internal]' : isExternal ? ' [External]' : '';
                        return (
                          <option key={dev.deviceId || idx} value={dev.deviceId}>
                            {dev.label || `Camera ${idx + 1}`} {tag}
                          </option>
                        );
                      })}
                    </select>

                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={handleTestCamera}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          isCameraTesting
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isCameraTesting ? (
                          <>
                            <CameraOff className="w-3.5 h-3.5 text-rose-600" />
                            <span>Stop Camera Preview</span>
                          </>
                        ) : (
                          <>
                            <Video className="w-3.5 h-3.5 text-[#5f6f52]" />
                            <span>Test Selected Camera Preview</span>
                          </>
                        )}
                      </button>

                      {isCameraTesting && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video max-w-sm relative">
                          <video
                            ref={cameraVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <span>Live Video Feed Preview</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Text-To-Speech Global Voice Panel */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-[#5f6f52]" />
                    <span>Text-to-Speech (TTS) Preferences</span>
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                        <span>READ-ALOUD SPEED (PITCH CONFIGURED)</span>
                        <span>{playbackSpeed}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={playbackSpeed}
                        onChange={(e) => handleUpdateTtsSpeed(Number(e.target.value))}
                        className="w-full accent-[#5f6f52]"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                        <span>VOICE SYNTHESIS VOLUME</span>
                        <span>{Math.round(ttsVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1.0"
                        step="0.1"
                        value={ttsVolume}
                        onChange={(e) => handleUpdateTtsVolume(Number(e.target.value))}
                        className="w-full accent-[#5f6f52]"
                      />
                    </div>

                    {/* Real-time Text Highlighting Toggle */}
                    <div className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="space-y-0.5">
                        <label className="text-xs font-bold text-slate-800 block">Real-time Text Highlighting</label>
                        <p className="text-[10px] text-slate-500 leading-snug">Highlights the active spoken sentence or word in high-contrast yellow during speech synthesis.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={ttsHighlightingEnabled}
                        onChange={(e) => {
                          setTtsHighlightingEnabled(e.target.checked);
                          triggerSuccessBanner(e.target.checked ? 'TTS real-time text highlighting enabled.' : 'Disabled text highlighting.');
                        }}
                        className="w-4 h-4 text-[#5f6f52] border-slate-300 rounded focus:ring-[#5f6f52] shrink-0 mt-1 cursor-pointer"
                      />
                    </div>

                    {/* Keyboard Controls Toggle */}
                    <div className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="space-y-0.5">
                        <label className="text-xs font-bold text-slate-800 block">Read-Aloud Keyboard Controls</label>
                        <p className="text-[10px] text-slate-500 leading-snug">Enables keyboard shortcuts during playback (Spacebar to play/pause, Left/Right arrows to seek sentences, Escape to stop).</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={ttsKeyboardControlsEnabled}
                        onChange={(e) => {
                          setTtsKeyboardControlsEnabled(e.target.checked);
                          triggerSuccessBanner(e.target.checked ? 'Keyboard shortcuts activated.' : 'Disabled keyboard controls.');
                        }}
                        className="w-4 h-4 text-[#5f6f52] border-slate-300 rounded focus:ring-[#5f6f52] shrink-0 mt-1 cursor-pointer"
                      />
                    </div>

                    {/* Voice Profile Grid Selection */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Select Voice Accent Profile</span>
                      <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {VOICE_PROFILES.map((vp) => {
                          const isSelected = selectedVoiceProfileId === vp.id;
                          return (
                            <div
                              key={vp.id}
                              onClick={() => {
                                setSelectedVoiceProfileId(vp.id);
                                triggerSuccessBanner(`Switched voice profile to ${vp.displayName}`);
                              }}
                              className={`p-2.5 rounded-xl border transition-all text-left cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-emerald-50/40 border-[#5f6f52] ring-1 ring-[#5f6f52]'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl shrink-0">{vp.flag}</span>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-800 leading-tight">{vp.name}</span>
                                    <span className={`text-[8px] font-extrabold px-1 py-0.2 rounded uppercase tracking-wider leading-none shrink-0 ${
                                      vp.gender === 'Female'
                                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                        : vp.gender === 'Male'
                                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                        : 'bg-teal-50 text-teal-600 border border-teal-100'
                                    }`}>
                                      {vp.gender}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-slate-400 font-semibold">{vp.accent}</div>
                                  <div className="text-[9px] text-slate-500 font-medium leading-tight">{vp.description}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => speakProfileSample(vp)}
                                  title={`Listen sample of ${vp.name}`}
                                  className="p-1.5 rounded-lg text-[#5f6f52] hover:bg-[#5f6f52]/10 transition-colors border border-transparent hover:border-[#5f6f52]/20 cursor-pointer"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                                {isSelected && (
                                  <div className="w-4.5 h-4.5 rounded-full bg-[#5f6f52] flex items-center justify-center text-white shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profiles' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Active profile selector card */}
          <div className="bg-white border border-[#e5e1da] rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#5f6f52]" /> Dynamic Cognitive Accommodations Engine
                </h3>
                <p className="text-xs text-slate-500">Select which accommodation profile is active. The Adaptive AI Engine intercepts generations and molds prompts specifically for these student profiles.</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3.5 py-2 bg-[#5f6f52] hover:bg-[#46553b] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Accommodation Profile</span>
              </button>
            </div>

            {/* Profile cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {learnerProfiles.map((p) => {
                const isActive = activeLearnerProfile === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveLearnerProfile(p.id);
                      triggerSuccessBanner(`Cognitive accommodation shifted to: ${p.name}`);
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                      isActive
                        ? 'border-[#5f6f52] bg-[#5f6f52]/5 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          p.type === 'general' ? 'bg-slate-100 text-slate-700' :
                          p.type === 'dyslexia' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          p.type === 'adhd' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          p.type === 'esl' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {p.type}
                        </span>
                        {isActive && (
                          <span className="bg-[#5f6f52] text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded">
                            ACTIVE ADAPTER
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#5f6f52] transition-colors">{p.name}</h4>
                      <p className="text-[10px] text-slate-500 leading-snug">{p.description}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {p.accommodations.useDyslexicFont && (
                          <span className="text-[8px] font-bold bg-amber-50 text-amber-800 px-1 py-0.5 rounded">Dyslexic Font</span>
                        )}
                        {p.accommodations.simplifyVocabulary && (
                          <span className="text-[8px] font-bold bg-blue-50 text-blue-800 px-1 py-0.5 rounded">Simple Vocab</span>
                        )}
                        {p.accommodations.includeChecklists && (
                          <span className="text-[8px] font-bold bg-purple-50 text-purple-800 px-1 py-0.5 rounded">Checklists</span>
                        )}
                      </div>
                      
                      {/* Delete custom buttons */}
                      {p.id.startsWith('custom_') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLearnerProfile(p.id);
                            triggerSuccessBanner('Accommodation profile deleted.');
                          }}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create Custom Profile Drawer/Form */}
          {showAddForm && (
            <div className="bg-[#faf6ee] border-2 border-dashed border-[#eadecd] rounded-2xl p-6 animate-fadeIn space-y-4">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black uppercase text-[#5f6f52] tracking-widest">Configure Custom Learner Accommodation Settings</h4>
                <p className="text-[10px] text-slate-500">Fine-tune font, paragraph layouts, and educational constraints for individual target criteria.</p>
              </div>

              <form onSubmit={handleCreateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase">Profile Label/Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Grade 5 Remedial Group"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase">Primary Cognitive Target</label>
                    <select
                      value={newProfileType}
                      onChange={(e) => setNewProfileType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                    >
                      <option value="dyslexia">Dyslexia / Reading Scaffolds</option>
                      <option value="adhd">ADHD / Focus Retention</option>
                      <option value="esl">ESL / Language Translation Supports</option>
                      <option value="visual">Low Vision / Detailed Explanations</option>
                      <option value="auditory">Auditory focus / Oral reinforcement</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase">Description</label>
                    <textarea
                      placeholder="Brief description of when to activate this profile."
                      value={newProfileDesc}
                      onChange={(e) => setNewProfileDesc(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Accommodations parameters checkboxes */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1">AI Instruction Adapters</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-slate-200 text-xs">
                      <input
                        type="checkbox"
                        checked={newProfileDyslexic}
                        onChange={(e) => setNewProfileDyslexic(e.target.checked)}
                        className="accent-[#5f6f52]"
                      />
                      <span>Apply Dyslexic Font</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-slate-200 text-xs">
                      <input
                        type="checkbox"
                        checked={newProfileVocab}
                        onChange={(e) => setNewProfileVocab(e.target.checked)}
                        className="accent-[#5f6f52]"
                      />
                      <span>Simplify Vocab</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-slate-200 text-xs">
                      <input
                        type="checkbox"
                        checked={newProfileChecklist}
                        onChange={(e) => setNewProfileChecklist(e.target.checked)}
                        className="accent-[#5f6f52]"
                      />
                      <span>Inject Milestones</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-slate-200 text-xs">
                      <input
                        type="checkbox"
                        checked={newProfileAudio}
                        onChange={(e) => setNewProfileAudio(e.target.checked)}
                        className="accent-[#5f6f52]"
                      />
                      <span>Auditory Cues</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-slate-250 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#5f6f52] hover:bg-[#46553b] text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Save Profile
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'health' && profile?.role === 'Administrator' && (
        <div className="bg-white border border-[#e5e1da] rounded-2xl shadow-sm p-6 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" /> API Health Monitor & Fallback Registry
              </h3>
              <p className="text-xs text-slate-500">View real-time operational diagnostics of Gemini API request routing, latency, and automated model fallback logs.</p>
            </div>
            <button
              onClick={fetchHealthMetrics}
              disabled={loadingHealth}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer self-start sm:self-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
              <span>{loadingHealth ? 'Querying Status...' : 'Sync Diagnostics'}</span>
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Core API Ingress</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm font-black text-slate-800">CONNECTED</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Total Ingress Requests</span>
              <span className="text-lg font-black text-slate-800">{health?.totalCalls ?? 0}</span>
            </div>

            <div className="p-4 bg-[#fcfbf9] border border-[#eadecd] rounded-xl space-y-1">
              <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-widest block">Auto Fallbacks Run</span>
              <span className="text-lg font-black text-amber-700">{health?.fallbackCount ?? 0}</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Avg Engine Latency</span>
              <span className="text-lg font-black text-slate-800">
                {health?.averageLatencyMs && health.averageLatencyMs > 0 ? `${(health.averageLatencyMs / 1000).toFixed(2)}s` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Fallback chain visual mapping */}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
            <span className="text-[10px] font-extrabold text-[#5f6f52] uppercase tracking-wider block">Resilience Fallback Routing Chain</span>
            <div className="flex flex-col md:flex-row items-center gap-4 text-xs font-bold text-slate-600">
              <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg">
                1. gemini-3.5-flash <span className="text-[9px] text-slate-400 block">(Default Priority)</span>
              </div>
              <div className="text-slate-400 font-extrabold">➔</div>
              <div className="px-3 py-1.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-lg">
                2. gemini-3.1-flash-lite <span className="text-[9px] text-slate-400 block">(Critical Recovery / Fallback)</span>
              </div>
            </div>
          </div>

          {/* Retry Registry Log Table */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Automated Retry & Fallback Event Logs</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Failed Model Target</th>
                    <th className="p-3">Resolution Route</th>
                    <th className="p-3">Status Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!health?.retryLogs || health.retryLogs.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                        Excellent API Health! No fallback retry events have been logged in this session.
                      </td>
                    </tr>
                  ) : (
                    health.retryLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-rose-700 block">{log.model}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[280px] block" title={log.error}>{log.error}</span>
                        </td>
                        <td className="p-3">
                          {log.fallbackModel ? (
                            <span className="text-[#5f6f52] font-semibold">Shifted to: <b>{log.fallbackModel}</b></span>
                          ) : (
                            <span className="text-slate-400 font-medium">Retry Exhausted</span>
                          )}
                        </td>
                        <td className="p-3">
                          {log.resolved ? (
                            <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 rounded text-[9px] uppercase tracking-wide">
                              RESOLVED
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 font-bold border border-amber-100 rounded text-[9px] uppercase tracking-wide">
                              RETRY_ACTIVE
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Render the About Workspace Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Render the App Icon Showcase Modal */}
      <AppIconShowcaseModal isOpen={isAppIconModalOpen} onClose={() => setIsAppIconModalOpen(false)} />
    </div>
  );
}
