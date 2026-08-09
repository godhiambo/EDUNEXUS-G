import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow
} from '@vis.gl/react-google-maps';
import {
  Compass,
  MapPin,
  Navigation,
  BookOpen,
  Volume2,
  VolumeX,
  Type,
  Sun,
  Moon,
  Sparkles,
  Bot,
  Send,
  CheckCircle2,
  Circle,
  QrCode,
  Award,
  ExternalLink,
  Plus,
  RefreshCw,
  X,
  Languages,
  Eye,
  Layers,
  ChevronRight,
  ChevronLeft,
  Flame,
  Printer,
  Share2,
  Copy,
  Check,
  Video,
  Image as ImageIcon,
  MessageSquare,
  WifiOff,
  HardDrive,
  DownloadCloud,
  Route,
  Flag,
  FileText,
  Loader2,
  Zap,
  Trophy,
  Medal,
  Star,
  Mic,
  MicOff,
  PenTool,
  Download,
  GraduationCap,
  Lock,
  Unlock,
  PlusCircle,
  Trash2,
  Edit3,
  Film,
  Maximize2,
  Minimize2,
  Volume1,
  Camera,
  StickyNote,
  Heart,
  Filter,
  Crosshair,
  RotateCcw,
  Radio,
  Megaphone,
  UserCheck,
  Cast,
  ArrowRight,
  HelpCircle,
  ShieldAlert,
  Play,
  Pause
} from 'lucide-react';
import {
  subscribeToTeacherSession,
  broadcastTeacherSession,
  TeacherLedSessionData
} from '../services/teacherLedService';
import {
  VirtualFieldTripRoute,
  VirtualFieldTripStop,
  StudentExcursionProgress,
  ExitSlipAnswers,
  ForeignLanguageCue,
  VirtualFieldTripLessonPlan,
  SocraticTravelJournal,
  SocraticJournalStopEntry,
  EducatorNote,
  MapPinAnnotation,
  MediaGalleryItem,
  FieldTripStickyNote
} from '../types/virtualFieldTrip';
import { VirtualFieldTripService, PRESET_FIELD_TRIPS } from '../services/virtualFieldTripService';
import { FieldTripNotesService } from '../services/fieldTripNotesService';
import { VirtualFieldTripEcosystemModals } from './VirtualFieldTripEcosystemModals';
import {
  ambientAudioEngine,
  detectAmbientPreset,
  AMBIENT_PRESETS,
  AmbientPresetKey
} from '../services/ambientAudioService';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { QRCodeSVG } from 'qrcode.react';

interface VirtualFieldTripStudioProps {
  initialTripId?: string;
  onOpenQRMapping?: () => void;
}

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const MainStageVideoPlayer: React.FC<{
  currentStop: VirtualFieldTripStop;
}> = ({ currentStop }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(20);
  const [currentTime, setCurrentTime] = useState<number>(48);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);

  // Custom Player Overlay Refs & States
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  const durationSeconds = 240; // 04:00

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      } else if ((playerContainerRef.current as any).webkitRequestFullscreen) {
        (playerContainerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (newVol === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      const restoreVol = volume === 0 ? 0.8 : volume;
      setVolume(restoreVol);
      if (videoRef.current) {
        videoRef.current.volume = restoreVol;
        videoRef.current.muted = false;
      }
    } else {
      setIsMuted(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 1;
          if (next >= durationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          setProgress((next / durationSeconds) * 100);
          return next;
        });
      }, 1000 / playbackSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const newTime = Math.round((newPct / 100) * durationSeconds);
    setProgress(newPct);
    setCurrentTime(newTime);
  };

  const handleCycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currIdx = speeds.indexOf(playbackSpeed);
    const nextIdx = (currIdx + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  const galleryVideo = currentStop.mediaGallery?.find(m => m.type === 'video');
  const rawUrl = currentStop.videoUrl || galleryVideo?.url || 'https://www.youtube-nocookie.com/embed/S_8qM7W_Jm4';
  const embedUrl = rawUrl.includes('youtube.com/watch')
    ? rawUrl.replace('watch?v=', 'embed/')
    : rawUrl;

  const isDirectVideo = rawUrl.endsWith('.mp4') || rawUrl.endsWith('.webm') || rawUrl.startsWith('blob:');

  return (
    <div ref={playerContainerRef} className="w-full h-full bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden select-none group/studioplayer">
      {/* Header Bar */}
      <div className="bg-slate-900/95 border-b border-white/10 px-4 py-2.5 flex items-center justify-between text-xs shrink-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md">
            🎥 NatGeo / Educational Video Archive
          </span>
          <span className="font-bold text-amber-200 truncate max-w-[250px] sm:max-w-md text-sm">
            {currentStop.title}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
            📍 {currentStop.locationName}
          </span>
          <span className="text-emerald-400 hidden sm:inline font-bold">1080p HD</span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-amber-300 transition cursor-pointer border border-white/10"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Video Viewport & Overlay Controls Container */}
      <div className="flex-1 w-full h-full bg-black relative flex flex-col justify-between overflow-hidden">
        {/* Video Frame or Direct HTML5 Video */}
        <div className="absolute inset-0 z-0">
          {isDirectVideo ? (
            <video
              ref={videoRef}
              src={rawUrl}
              className="w-full h-full object-cover"
              playsInline
              loop
              onTimeUpdate={() => {
                if (videoRef.current) {
                  const cur = videoRef.current.currentTime;
                  const dur = videoRef.current.duration || durationSeconds;
                  setCurrentTime(cur);
                  setProgress((cur / dur) * 100);
                }
              }}
            />
          ) : (
            <iframe
              title={`NatGeo Video Tour - ${currentStop.locationName}`}
              src={embedUrl}
              className="w-full h-full border-none opacity-95"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>

        {/* Play/Pause Canvas Click Overlay */}
        <div
          onClick={() => {
            const nextPlaying = !isPlaying;
            setIsPlaying(nextPlaying);
            if (videoRef.current) {
              if (nextPlaying) videoRef.current.play();
              else videoRef.current.pause();
            }
          }}
          className="absolute inset-0 z-[1] cursor-pointer bg-slate-950/10 hover:bg-slate-950/20 transition flex items-center justify-center"
        >
          {/* Central Big Play/Pause Toggle Indicator */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const nextPlaying = !isPlaying;
              setIsPlaying(nextPlaying);
              if (videoRef.current) {
                if (nextPlaying) videoRef.current.play();
                else videoRef.current.pause();
              }
            }}
            className={`w-16 h-16 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center shadow-2xl transition transform border-2 border-slate-950 cursor-pointer ${
              !isPlaying ? 'scale-100 opacity-100' : 'scale-75 opacity-0 group-hover/studioplayer:opacity-90 group-hover/studioplayer:scale-100'
            }`}
            title={isPlaying ? 'Pause Video' : 'Play Video'}
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-slate-950" /> : <Play className="w-8 h-8 fill-slate-950 ml-1" />}
          </button>
        </div>

        {/* Top Watermark Badge Overlay */}
        <div className="relative z-10 p-3 flex items-center justify-between bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none">
          <div className="flex items-center gap-2 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-md font-black text-[10px] uppercase tracking-wider shadow-lg border border-amber-300">
            <span>NATIONAL GEOGRAPHIC ARCHIVE</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-amber-300 bg-slate-950/80 px-2 py-1 rounded border border-white/10 backdrop-blur-md">
            Interactive Video Studio
          </span>
        </div>

        {/* Closed Captions Subtitle Overlay */}
        {showCaptions && (
          <div className="relative z-10 px-6 my-auto pointer-events-none max-w-2xl mx-auto">
            <div className="bg-slate-950/90 text-amber-100 border border-amber-400/50 p-3 rounded-2xl backdrop-blur-xl text-xs sm:text-sm font-medium leading-relaxed shadow-2xl text-center animate-in fade-in">
              <span className="font-black text-amber-400 mr-2 bg-amber-400/20 px-1.5 py-0.5 rounded">[CC] Subtitles:</span>
              <span>{currentStop.readingPassage || 'Observing geological formations and ecological species dynamics in their natural protected habitat.'}</span>
            </div>
          </div>
        )}

        {/* CUSTOM PLAYBACK CONTROLS OVERLAY BAR */}
        <div className="relative z-10 bg-slate-950/95 border-t border-amber-400/40 p-3 space-y-2 backdrop-blur-xl shadow-2xl">
          {/* Interactive Progress Scrubber */}
          <div
            onClick={handleSeek}
            className="w-full h-2.5 bg-slate-800 hover:bg-slate-700 rounded-full cursor-pointer relative overflow-hidden group/scrubber"
            title="Click to jump timeline position"
          >
            <div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 rounded-full transition-all duration-300 relative"
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-amber-400 shadow-lg transform scale-0 group-hover/scrubber:scale-100 transition" />
            </div>
          </div>

          {/* Controls Action Row */}
          <div className="flex items-center justify-between text-white text-xs">
            {/* Left Controls: Play, Mute + Volume Slider, Elapsed Time */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const nextPlaying = !isPlaying;
                  setIsPlaying(nextPlaying);
                  if (videoRef.current) {
                    if (nextPlaying) videoRef.current.play();
                    else videoRef.current.pause();
                  }
                }}
                className="p-1.5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 transition cursor-pointer font-extrabold flex items-center gap-1 shadow-md"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
                <span className="text-[11px] font-bold px-1">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>

              {/* Interactive Volume Button & Slider Tooltip */}
              <div className="relative flex items-center" onMouseLeave={() => setShowVolumeSlider(false)}>
                <button
                  type="button"
                  onClick={toggleMute}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-amber-400 text-slate-200 transition cursor-pointer flex items-center gap-1.5"
                  title={isMuted ? 'Unmute Sound' : `Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4 text-amber-300" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-amber-300" />
                  )}
                  <span className="text-[11px] font-mono text-slate-300 hidden sm:inline">
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </button>

                {showVolumeSlider && (
                  <div className="absolute bottom-full left-0 mb-2 p-2.5 rounded-xl bg-slate-900 border border-amber-400/40 shadow-2xl flex items-center gap-2 z-30 animate-in fade-in slide-in-from-bottom-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-20 accent-amber-400 h-1.5 rounded-lg bg-slate-800 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono font-bold text-amber-300 shrink-0">
                      {Math.round((isMuted ? 0 : volume) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              <span className="font-mono text-xs text-amber-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-white/10">
                {formatTime(currentTime)} / {formatTime(durationSeconds)}
              </span>
            </div>

            {/* Right Controls: Playback Speed, CC Toggle, Transcript, Fullscreen */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCycleSpeed}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 hover:border-amber-400 text-amber-200 text-xs font-mono font-bold transition cursor-pointer"
                title="Change Playback Speed"
              >
                Speed: {playbackSpeed}x
              </button>

              <button
                type="button"
                onClick={() => setShowCaptions(!showCaptions)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  showCaptions
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Toggle Subtitles [CC]"
              >
                CC
              </button>

              <button
                type="button"
                onClick={() => setShowTranscript(!showTranscript)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 hover:border-amber-400 text-amber-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                title="Open Educational Transcript"
              >
                <span>📜 Transcript</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-amber-400 text-slate-200 transition cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-300" /> : <Maximize2 className="w-4 h-4 text-amber-300" />}
              </button>
            </div>
          </div>
        </div>

        {/* Educational Transcript Drawer Overlay */}
        {showTranscript && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 p-5 backdrop-blur-2xl flex flex-col justify-between text-white animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-black text-xs">
                  NATIONAL GEOGRAPHIC TRANSCRIPT
                </span>
                <span className="font-serif font-bold text-amber-200 text-sm">
                  {currentStop.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTranscript(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-auto space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-white/10 max-h-64 overflow-y-auto scrollbar-thin">
              <h5 className="text-xs font-mono text-amber-400 uppercase font-bold tracking-wider">
                Full Educational Audio Narrative:
              </h5>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">
                {currentStop.readingPassage || 'This interactive National Geographic archive documentary explores the natural biology, historical context, and ecosystem dynamics of this milestone location.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono">
              <span className="text-slate-400">Location: {currentStop.locationName}</span>
              <button
                type="button"
                onClick={() => setShowTranscript(false)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl transition cursor-pointer"
              >
                Return to Video Player
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const VirtualFieldTripStudio: React.FC<VirtualFieldTripStudioProps> = ({
  initialTripId,
  onOpenQRMapping
}) => {
  const { useDyslexicFont, setUseDyslexicFont, fontSize, setFontSize } = useAccessibility();
  const { language } = useLanguage();

  // Field Trips catalog and active route
  const [fieldTrips, setFieldTrips] = useState<VirtualFieldTripRoute[]>([]);
  const [activeTrip, setActiveTrip] = useState<VirtualFieldTripRoute>(PRESET_FIELD_TRIPS[0]);
  const [currentStopIndex, setCurrentStopIndex] = useState<number>(0);

  // High contrast theme toggle
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);

  // Active Map View Mode
  const [activeViewerTab, setActiveViewerTab] = useState<'map' | 'streetview' | 'panorama' | 'video'>('map');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('satellite');

  // Active Right Sidebar Tab Mode (Guide & Tasks | Media & Route | Educator Notes)
  const [activeRightTab, setActiveRightTab] = useState<'guide' | 'media' | 'notes'>('guide');

  // Audio Read-Aloud state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Student Progress & Checkpoints
  const [studentProgress, setStudentProgress] = useState<StudentExcursionProgress>(() =>
    VirtualFieldTripService.getStudentProgress(PRESET_FIELD_TRIPS[0].id)
  );

  // Socratic Tour Guide Chat state
  const [socraticChat, setSocraticChat] = useState<Array<{ sender: 'guide' | 'student'; text: string; time: string }>>([]);
  const [studentInput, setStudentInput] = useState<string>('');
  const [isSocraticThinking, setIsSocraticThinking] = useState<boolean>(false);

  // Voice Input (Speech Recognition) & Voice Playback (Speech Synthesis) State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speakingGuideMsgIndex, setSpeakingGuideMsgIndex] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Foreign language cue tooltip popover
  const [selectedCue, setSelectedCue] = useState<ForeignLanguageCue | null>(null);

  // Exit Slip Modal state
  const [isExitSlipOpen, setIsExitSlipOpen] = useState<boolean>(false);
  const [exitUnderstanding, setExitUnderstanding] = useState<number>(5);
  const [exitObservation, setExitObservation] = useState<string>('');
  const [exitLanguageReflection, setExitLanguageReflection] = useState<string>('');
  const [exitConfidence, setExitConfidence] = useState<'high' | 'medium' | 'needs_review'>('high');

  // Teacher/Parent/Student Virtual Tour Creator Guide State
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);
  const [creatorRole, setCreatorRole] = useState<'teacher' | 'parent' | 'student' | 'custom'>('teacher');
  const [customCreatorRole, setCustomCreatorRole] = useState<string>('');
  const [builderCategory, setBuilderCategory] = useState<'european_cities' | 'art_museums' | 'agricultural_farms' | 'school_campus' | 'science_timelines' | 'custom'>('european_cities');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [builderDestination, setBuilderDestination] = useState<string>('');
  const [builderCountry, setBuilderCountry] = useState<string>('');
  const [builderSubject, setBuilderSubject] = useState<string>('European History & Languages');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [builderGrade, setBuilderGrade] = useState<string>('Grade 7-9');
  const [customGrade, setCustomGrade] = useState<string>('');
  const [builderLanguage, setBuilderLanguage] = useState<string>('French');
  const [customLanguage, setCustomLanguage] = useState<string>('');
  const [qrPlacementStrategy, setQrPlacementStrategy] = useState<'library_shelves' | 'classroom_posters' | 'department_signs' | 'museum_plaques' | 'agricultural_pastures' | 'custom'>('department_signs');
  const [customQrPlacement, setCustomQrPlacement] = useState<string>('');
  const [isGeneratingTrip, setIsGeneratingTrip] = useState<boolean>(false);

  // QR Code Modal
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  // Share Trip Deep-Link Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSnippetCopied, setIsSnippetCopied] = useState<boolean>(false);

  // Lesson Plan Modal & Generation State
  const [isLessonPlanModalOpen, setIsLessonPlanModalOpen] = useState<boolean>(false);
  const [isGeneratingLessonPlan, setIsGeneratingLessonPlan] = useState<boolean>(false);
  const [lessonPlan, setLessonPlan] = useState<VirtualFieldTripLessonPlan | null>(null);
  const [lessonPlanError, setLessonPlanError] = useState<string | null>(null);
  const [isLessonPlanCopied, setIsLessonPlanCopied] = useState<boolean>(false);

  // Student Profile & Learning XP State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [studentProfile, setStudentProfile] = useState(() => VirtualFieldTripService.getTotalStudentProfile());

  // Celebratory Animation Overlay State
  const [isCelebrationOverlayOpen, setIsCelebrationOverlayOpen] = useState<boolean>(false);

  // Rate Virtual Field Trip Modal State
  const [isRateTripModalOpen, setIsRateTripModalOpen] = useState<boolean>(false);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [isRatingSubmitted, setIsRatingSubmitted] = useState<boolean>(false);

  // AI Immersive Journey Ecosystem States
  // 1. AI Destination Discovery
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState<boolean>(false);
  const [discoveryCategory, setDiscoveryCategory] = useState<'parks' | 'museums' | 'factories' | 'space' | 'volcanoes' | 'marine' | 'hospitals' | 'banks' | 'power' | 'labs' | 'universities'>('parks');

  // 2. Camera Intelligence & Object Identification
  const [isCameraIntelModalOpen, setIsCameraIntelModalOpen] = useState<boolean>(false);
  const [scanSampleType, setScanSampleType] = useState<'plant' | 'fossil' | 'machine' | 'bird' | 'animal' | 'rock' | 'lab'>('animal');
  const [isAnalyzingScan, setIsAnalyzingScan] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    objectName: string;
    scientificName: string;
    category: string;
    description: string;
    curriculumLinks: string;
    safetyNotes: string;
    keyFacts: string[];
  } | null>(null);

  // 3. Interactive Missions & Scavenger Challenges
  const [isMissionsModalOpen, setIsMissionsModalOpen] = useState<boolean>(false);
  const [activeMissions, setActiveMissions] = useState([
    { id: 'm1', title: 'Find 3 Renewable Energy Sources or Solar Systems', category: 'Sustainability', xp: 100, completed: false },
    { id: 'm2', title: 'Identify Flora Species or Leaf Venation Pattern', category: 'Biology', xp: 100, completed: false },
    { id: 'm3', title: 'Measure Environmental Water pH or Soil Compaction', category: 'Chemistry', xp: 150, completed: false },
    { id: 'm4', title: 'Socratic Inquiry Session with AI Guide', category: 'Socratic Inquiry', xp: 100, completed: true },
    { id: 'm5', title: 'Locate 5 Indigenous Tree / Rock Formations', category: 'Geology & Ecology', xp: 150, completed: false }
  ]);
  const [selectedMissionId, setSelectedMissionId] = useState<string>('m1');
  const [missionAnswerText, setMissionAnswerText] = useState<string>('');
  const [missionFeedback, setMissionFeedback] = useState<string | null>(null);

  // 4. AI Field Notebook & Revision Suite
  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState<boolean>(false);
  const [isGeneratingNotebook, setIsGeneratingNotebook] = useState<boolean>(false);
  const [notebookOutput, setNotebookOutput] = useState<{
    report: string;
    revisionNotes: string[];
    flashcards: Array<{ q: string; a: string }>;
    mindMap: string[];
    quiz: Array<{ question: string; options: string[]; answer: number }>;
  } | null>(null);

  // 5. Learning Analytics & Mastery Dashboard
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState<boolean>(false);

  // 6. Parent Portal & Digital Consent
  const [isParentPortalModalOpen, setIsParentPortalModalOpen] = useState<boolean>(false);
  const [parentSignedName, setParentSignedName] = useState<string>('');
  const [isParentConsentSigned, setIsParentConsentSigned] = useState<boolean>(false);

  // 7. AI Story & Media Portfolio Generator
  const [isStoryModalOpen, setIsStoryModalOpen] = useState<boolean>(false);
  const [storyFormat, setStoryFormat] = useState<'journal' | 'photobook' | 'newsletter' | 'presentation' | 'video_script'>('journal');
  const [isGeneratingStory, setIsGeneratingStory] = useState<boolean>(false);
  const [generatedStoryText, setGeneratedStoryText] = useState<string | null>(null);

  // 8. Sustainability & Eco Logger
  const [isEcoModalOpen, setIsEcoModalOpen] = useState<boolean>(false);
  const [ecoLitterKg, setEcoLitterKg] = useState<number>(2.5);
  const [ecoSpeciesCount, setEcoSpeciesCount] = useState<number>(12);
  const [ecoCarbonSaved, setEcoCarbonSaved] = useState<string>('14.2 kg CO₂e saved vs physical flight');

  // 9. Emergency & Logistics Console
  const [isLogisticsModalOpen, setIsLogisticsModalOpen] = useState<boolean>(false);
  const [attendanceRoster, setAttendanceRoster] = useState([
    { id: '1', name: 'Amina K.', present: true, medicalAlert: 'None' },
    { id: '2', name: 'Ethan M.', present: true, medicalAlert: 'Asthma Inhaler in Backpack' },
    { id: '3', name: 'Jabari O.', present: true, medicalAlert: 'Peanut Allergy' },
    { id: '4', name: 'Sofia R.', present: true, medicalAlert: 'None' },
    { id: '5', name: 'Liam T.', present: false, medicalAlert: 'None' }
  ]);

  // Ambient Background Audio State
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(false);
  const [ambientPreset, setAmbientPreset] = useState<AmbientPresetKey>(() =>
    detectAmbientPreset(activeTrip, activeTrip.stops[0])
  );
  const [ambientVolume, setAmbientVolume] = useState<number>(0.35);
  const [isAmbientPopoverOpen, setIsAmbientPopoverOpen] = useState<boolean>(false);

  // Interactive Viewer Annotation Overlay State
  const [isAnnotateModeActive, setIsAnnotateModeActive] = useState<boolean>(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<MapPinAnnotation | null>(null);
  const [isAddAnnotationModalOpen, setIsAddAnnotationModalOpen] = useState<boolean>(false);
  const [isAnnotationDrawerOpen, setIsAnnotationDrawerOpen] = useState<boolean>(false);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [pendingClickCoords, setPendingClickCoords] = useState<{ xPercentage: number; yPercentage: number } | null>(null);

  // Form fields for adding/editing annotation pins
  const [annotationTitle, setAnnotationTitle] = useState<string>('');
  const [annotationNote, setAnnotationNote] = useState<string>('');
  const [annotationCategory, setAnnotationCategory] = useState<'historical_fact' | 'architectural_detail' | 'media_link' | 'question_prompt' | 'custom_label'>('historical_fact');
  const [annotationMediaUrl, setAnnotationMediaUrl] = useState<string>('');
  const [annotationAuthorName, setAnnotationAuthorName] = useState<string>('Dr. Sarah Johnson');
  const [annotationAudioText, setAnnotationAudioText] = useState<string>('');
  const [annotationAudioUrl, setAnnotationAudioUrl] = useState<string>('');
  const [annotationAutoPlayOnArrive, setAnnotationAutoPlayOnArrive] = useState<boolean>(true);

  // Active Landmark Audio Description Playback State
  const [activeLandmarkAudio, setActiveLandmarkAudio] = useState<{
    pinId: string;
    title: string;
    authorName: string;
    audioText: string;
    audioUrl?: string;
    isPlaying: boolean;
    autoPlayed: boolean;
  } | null>(null);
  const landmarkAudioRef = useRef<HTMLAudioElement | null>(null);

  // Toggle or Play 30-Second Landmark Audio Description
  const handlePlayLandmarkAudio = (
    pinId: string,
    title: string,
    authorName: string,
    audioText: string,
    audioUrl?: string,
    isAutoPlay: boolean = false
  ) => {
    if (activeLandmarkAudio?.pinId === pinId && activeLandmarkAudio.isPlaying) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (landmarkAudioRef.current) landmarkAudioRef.current.pause();
      setActiveLandmarkAudio(prev => prev ? { ...prev, isPlaying: false } : null);
      return;
    }

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (landmarkAudioRef.current) landmarkAudioRef.current.pause();

    const cleanText = audioText.trim() || `${title}. Landmark audio guide by ${authorName}.`;

    setActiveLandmarkAudio({
      pinId,
      title,
      authorName,
      audioText: cleanText,
      audioUrl,
      isPlaying: true,
      autoPlayed: isAutoPlay
    });

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      landmarkAudioRef.current = audio;
      audio.play().catch(() => {});
      audio.onended = () => {
        setActiveLandmarkAudio(prev => prev ? { ...prev, isPlaying: false } : null);
      };
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      if (language === 'sw') utterance.lang = 'sw-KE';
      else if (language === 'fr') utterance.lang = 'fr-FR';
      else utterance.lang = 'en-US';

      utterance.onend = () => {
        setActiveLandmarkAudio(prev => prev ? { ...prev, isPlaying: false } : null);
      };
      utterance.onerror = () => {
        setActiveLandmarkAudio(prev => prev ? { ...prev, isPlaying: false } : null);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopLandmarkAudio = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (landmarkAudioRef.current) landmarkAudioRef.current.pause();
    setActiveLandmarkAudio(null);
  };

  // Auto-play 30-second Landmark Audio Description when student arrives at a milestone
  useEffect(() => {
    if (currentStop && currentStop.annotations && currentStop.annotations.length > 0) {
      const autoPlayPin = currentStop.annotations.find(
        a => a.autoPlayOnArrive !== false && (a.audioDescriptionText || a.note)
      );
      if (autoPlayPin) {
        const audioText = autoPlayPin.audioDescriptionText || `${autoPlayPin.title}: ${autoPlayPin.note}`;
        const timer = setTimeout(() => {
          handlePlayLandmarkAudio(
            autoPlayPin.id,
            autoPlayPin.title,
            autoPlayPin.authorName || 'Educator',
            audioText,
            autoPlayPin.audioDescriptionUrl,
            true
          );
        }, 800);
        return () => clearTimeout(timer);
      } else {
        handleStopLandmarkAudio();
      }
    } else {
      handleStopLandmarkAudio();
    }
  }, [currentStopIndex, activeTrip.id]);

  // Helper to auto-draft a ~30 second audio description script (~50-60 words)
  const handleGenerate30sAudioScript = () => {
    const topic = annotationTitle.trim() || currentStop.locationName;
    const detail = annotationNote.trim() || currentStop.readingPassage.substring(0, 150);
    const catLabel = getCategoryLabel(annotationCategory);

    const script = `Welcome to our landmark highlight: ${topic}. As part of our ${catLabel.toLowerCase()} investigation, observe this specific location closely. ${detail.substring(0, 160)}. Take a moment to reflect on how this physical milestone connects to our overall trip.`;
    setAnnotationAudioText(script);
  };

  // Category helpers for annotation pins
  const getCategoryIcon = (category: MapPinAnnotation['category']) => {
    switch (category) {
      case 'historical_fact': return '📜';
      case 'architectural_detail': return '🏛️';
      case 'media_link': return '📷';
      case 'question_prompt': return '💬';
      case 'custom_label': return '🏷️';
      default: return '📍';
    }
  };

  const getCategoryLabel = (category: MapPinAnnotation['category']) => {
    switch (category) {
      case 'historical_fact': return 'Historical Fact';
      case 'architectural_detail': return 'Architectural Detail';
      case 'media_link': return 'Contextual Media';
      case 'question_prompt': return 'Question Prompt';
      case 'custom_label': return 'Educational Label';
      default: return 'Annotation';
    }
  };

  // Handle Canvas / Viewer Click in Annotate Mode
  const handleViewerCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotateModeActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const xRounded = Math.round(x * 10) / 10;
    const yRounded = Math.round(y * 10) / 10;

    setPendingClickCoords({ xPercentage: xRounded, yPercentage: yRounded });
    setEditingAnnotationId(null);
    setAnnotationTitle('');
    setAnnotationNote('');
    setAnnotationCategory('historical_fact');
    setAnnotationMediaUrl('');
    setAnnotationAuthorName('Educator / Guide');
    setAnnotationAudioText('');
    setAnnotationAudioUrl('');
    setAnnotationAutoPlayOnArrive(true);
    setIsAddAnnotationModalOpen(true);
  };

  // Save Annotation (Create or Edit)
  const handleSaveAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annotationTitle.trim() || !annotationNote.trim()) return;

    const currentAnnotations = currentStop.annotations || [];
    let updatedAnnotations: MapPinAnnotation[] = [];

    if (editingAnnotationId) {
      updatedAnnotations = currentAnnotations.map(ann => {
        if (ann.id === editingAnnotationId) {
          return {
            ...ann,
            title: annotationTitle.trim(),
            note: annotationNote.trim(),
            category: annotationCategory,
            mediaUrl: annotationMediaUrl.trim() || undefined,
            authorName: annotationAuthorName.trim() || 'Educator',
            audioDescriptionText: annotationAudioText.trim() || undefined,
            audioDescriptionUrl: annotationAudioUrl.trim() || undefined,
            autoPlayOnArrive: annotationAutoPlayOnArrive
          };
        }
        return ann;
      });
    } else {
      const newPin: MapPinAnnotation = {
        id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        xPercentage: pendingClickCoords ? pendingClickCoords.xPercentage : 50,
        yPercentage: pendingClickCoords ? pendingClickCoords.yPercentage : 50,
        title: annotationTitle.trim(),
        note: annotationNote.trim(),
        category: annotationCategory,
        mediaUrl: annotationMediaUrl.trim() || undefined,
        authorName: annotationAuthorName.trim() || 'Educator',
        createdAt: new Date().toISOString().split('T')[0],
        audioDescriptionText: annotationAudioText.trim() || undefined,
        audioDescriptionUrl: annotationAudioUrl.trim() || undefined,
        autoPlayOnArrive: annotationAutoPlayOnArrive
      };
      updatedAnnotations = [...currentAnnotations, newPin];
    }

    const updatedStops = activeTrip.stops.map((stop, idx) => {
      if (idx === currentStopIndex) {
        return { ...stop, annotations: updatedAnnotations };
      }
      return stop;
    });

    const updatedTrip = { ...activeTrip, stops: updatedStops };
    setActiveTrip(updatedTrip);
    VirtualFieldTripService.saveCustomRoute(updatedTrip);

    const updatedFieldTrips = fieldTrips.map(t => (t.id === updatedTrip.id ? updatedTrip : t));
    setFieldTrips(updatedFieldTrips);

    setIsAddAnnotationModalOpen(false);
    setEditingAnnotationId(null);
    setPendingClickCoords(null);
    setIsAnnotateModeActive(false);
  };

  // Delete Annotation Pin
  const handleDeleteAnnotation = (pinId: string) => {
    const currentAnnotations = currentStop.annotations || [];
    const updatedAnnotations = currentAnnotations.filter(ann => ann.id !== pinId);

    const updatedStops = activeTrip.stops.map((stop, idx) => {
      if (idx === currentStopIndex) {
        return { ...stop, annotations: updatedAnnotations };
      }
      return stop;
    });

    const updatedTrip = { ...activeTrip, stops: updatedStops };
    setActiveTrip(updatedTrip);
    VirtualFieldTripService.saveCustomRoute(updatedTrip);

    const updatedFieldTrips = fieldTrips.map(t => (t.id === updatedTrip.id ? updatedTrip : t));
    setFieldTrips(updatedFieldTrips);

    if (selectedAnnotation?.id === pinId) {
      setSelectedAnnotation(null);
    }
  };

  // Start Editing Pin
  const handleStartEditAnnotation = (pin: MapPinAnnotation) => {
    setEditingAnnotationId(pin.id);
    setAnnotationTitle(pin.title);
    setAnnotationNote(pin.note);
    setAnnotationCategory(pin.category);
    setAnnotationMediaUrl(pin.mediaUrl || '');
    setAnnotationAuthorName(pin.authorName || 'Educator');
    setAnnotationAudioText(pin.audioDescriptionText || '');
    setAnnotationAudioUrl(pin.audioDescriptionUrl || '');
    setAnnotationAutoPlayOnArrive(pin.autoPlayOnArrive !== false);
    setPendingClickCoords({ xPercentage: pin.xPercentage, yPercentage: pin.yPercentage });
    setSelectedAnnotation(null);
    setIsAddAnnotationModalOpen(true);
  };

  // Smart Jump Feature State & Handler
  const [smartJumpToast, setSmartJumpToast] = useState<string | null>(null);
  const [isSmartJumpMenuOpen, setIsSmartJumpMenuOpen] = useState<boolean>(false);

  // Milestone Card Horizontally Scrollable Media Gallery State
  const [selectedLightboxMedia, setSelectedLightboxMedia] = useState<MediaGalleryItem | null>(null);
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState<boolean>(false);
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [mediaTypeInput, setMediaTypeInput] = useState<MediaGalleryItem['type']>('panorama_360');
  const [mediaUrlInput, setMediaUrlInput] = useState<string>('');
  const [mediaCaptionInput, setMediaCaptionInput] = useState<string>('');
  const [mediaCreditInput, setMediaCreditInput] = useState<string>('');

  const mediaGalleryScrollRef = useRef<HTMLDivElement>(null);

  const handleScrollMediaGallery = (direction: 'left' | 'right') => {
    if (mediaGalleryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      mediaGalleryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleOpenAddMediaModal = () => {
    setEditingMediaId(null);
    setMediaTypeInput('panorama_360');
    setMediaUrlInput('');
    setMediaCaptionInput('');
    setMediaCreditInput('');
    setIsAddMediaModalOpen(true);
  };

  const handleOpenEditMediaModal = (item: MediaGalleryItem) => {
    setEditingMediaId(item.id);
    setMediaTypeInput(item.type);
    setMediaUrlInput(item.url);
    setMediaCaptionInput(item.caption);
    setMediaCreditInput(item.credit || '');
    setIsAddMediaModalOpen(true);
  };

  const handleSaveMediaGalleryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrlInput.trim() || !mediaCaptionInput.trim()) return;

    const currentGallery = currentStop.mediaGallery || [];
    let updatedGallery: MediaGalleryItem[] = [];

    if (editingMediaId) {
      updatedGallery = currentGallery.map(item => {
        if (item.id === editingMediaId) {
          return {
            ...item,
            type: mediaTypeInput,
            url: mediaUrlInput.trim(),
            caption: mediaCaptionInput.trim(),
            credit: mediaCreditInput.trim() || undefined
          };
        }
        return item;
      });
    } else {
      const newItem: MediaGalleryItem = {
        id: `gal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: mediaTypeInput,
        url: mediaUrlInput.trim(),
        caption: mediaCaptionInput.trim(),
        credit: mediaCreditInput.trim() || undefined
      };
      updatedGallery = [...currentGallery, newItem];
    }

    const updatedStops = activeTrip.stops.map((stop, idx) => {
      if (idx === currentStopIndex) {
        return { ...stop, mediaGallery: updatedGallery };
      }
      return stop;
    });

    const updatedTrip = { ...activeTrip, stops: updatedStops };
    setActiveTrip(updatedTrip);
    VirtualFieldTripService.saveCustomRoute(updatedTrip);

    const updatedFieldTrips = fieldTrips.map(t => (t.id === updatedTrip.id ? updatedTrip : t));
    setFieldTrips(updatedFieldTrips);

    setIsAddMediaModalOpen(false);
    setEditingMediaId(null);
  };

  const handleDeleteMediaGalleryItem = (itemId: string) => {
    const currentGallery = currentStop.mediaGallery || [];
    const updatedGallery = currentGallery.filter(item => item.id !== itemId);

    const updatedStops = activeTrip.stops.map((stop, idx) => {
      if (idx === currentStopIndex) {
        return { ...stop, mediaGallery: updatedGallery };
      }
      return stop;
    });

    const updatedTrip = { ...activeTrip, stops: updatedStops };
    setActiveTrip(updatedTrip);
    VirtualFieldTripService.saveCustomRoute(updatedTrip);

    const updatedFieldTrips = fieldTrips.map(t => (t.id === updatedTrip.id ? updatedTrip : t));
    setFieldTrips(updatedFieldTrips);

    if (selectedLightboxMedia?.id === itemId) {
      setSelectedLightboxMedia(null);
    }
  };

  const getMediaTypeBadge = (type: MediaGalleryItem['type']) => {
    switch (type) {
      case 'panorama_360':
        return { label: '360° Panorama', bg: 'bg-amber-400 text-slate-950 font-bold', icon: '🌐' };
      case 'photo':
        return { label: 'Detail Photo', bg: 'bg-indigo-500 text-white font-bold', icon: '📷' };
      case 'video':
        return { label: 'Video Clip', bg: 'bg-rose-500 text-white font-bold', icon: '🎥' };
      case 'detail_diagram':
        return { label: 'Site Diagram', bg: 'bg-emerald-500 text-white font-bold', icon: '📐' };
      default:
        return { label: 'Media', bg: 'bg-slate-700 text-white font-bold', icon: '🖼️' };
    }
  };

  // Real-Time Collaborative Note Layer State & Handlers
  const [stickyNotes, setStickyNotes] = useState<FieldTripStickyNote[]>([]);
  const [isStickyNotesLayerActive, setIsStickyNotesLayerActive] = useState<boolean>(true);
  const [isDropNoteModeActive, setIsDropNoteModeActive] = useState<boolean>(false);
  const [isStickyNotesDrawerOpen, setIsStickyNotesDrawerOpen] = useState<boolean>(false);
  const [selectedStickyNote, setSelectedStickyNote] = useState<FieldTripStickyNote | null>(null);
  const [stickyCategoryFilter, setStickyCategoryFilter] = useState<'all' | 'question' | 'insight' | 'discovery' | 'flag' | 'general'>('all');

  // New Digital Sticky Note Form State
  const [isNewStickyNoteModalOpen, setIsNewStickyNoteModalOpen] = useState<boolean>(false);
  const [newStickyXPercentage, setNewStickyXPercentage] = useState<number>(50);
  const [newStickyYPercentage, setNewStickyYPercentage] = useState<number>(50);
  const [newStickyText, setNewStickyText] = useState<string>('');
  const [newStickyAuthorName, setNewStickyAuthorName] = useState<string>('Mr. Ojiambo (Teacher)');
  const [newStickyAuthorRole, setNewStickyAuthorRole] = useState<'Teacher' | 'Student' | 'Administrator'>('Teacher');
  const [newStickyColor, setNewStickyColor] = useState<'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'amber'>('yellow');
  const [newStickyCategory, setNewStickyCategory] = useState<'question' | 'insight' | 'discovery' | 'flag' | 'general'>('insight');
  const [stickyNoteToast, setStickyNoteToast] = useState<string | null>(null);

  const stageContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time Firestore sticky notes on trip change
  useEffect(() => {
    if (!activeTrip?.id) return;
    const unsubscribe = FieldTripNotesService.subscribeNotesByRoute(
      activeTrip.id,
      (fetchedNotes) => {
        setStickyNotes(fetchedNotes);
      }
    );
    return () => {
      unsubscribe();
    };
  }, [activeTrip?.id]);

  // Handle stage view click to drop a new digital sticky note
  const handleStageContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnnotateModeActive) {
      handleViewerCanvasClick(e);
      return;
    }
    if (!isDropNoteModeActive) return;

    if (stageContainerRef.current) {
      const rect = stageContainerRef.current.getBoundingClientRect();
      const x = Math.min(88, Math.max(8, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
      const y = Math.min(85, Math.max(12, Math.round(((e.clientY - rect.top) / rect.height) * 100)));

      setNewStickyXPercentage(x);
      setNewStickyYPercentage(y);
      setIsNewStickyNoteModalOpen(true);
      setIsDropNoteModeActive(false);
    }
  };

  // Submit new sticky note to Firestore
  const handleSaveStickyNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStickyText.trim()) return;

    const createdNote = await FieldTripNotesService.addNote({
      routeId: activeTrip.id,
      stopNumber: currentStop.stopNumber,
      locationName: currentStop.locationName,
      lat: currentStop.lat,
      lng: currentStop.lng,
      xPercentage: newStickyXPercentage,
      yPercentage: newStickyYPercentage,
      text: newStickyText.trim(),
      authorUid: newStickyAuthorRole === 'Teacher' ? 'teacher-1' : 'student-1',
      authorName: newStickyAuthorName.trim() || 'Active Field Tripper',
      authorRole: newStickyAuthorRole,
      color: newStickyColor,
      category: newStickyCategory
    });

    setStickyNotes((prev) => {
      if (prev.some((n) => n.id === createdNote.id)) return prev;
      return [...prev, createdNote];
    });

    setStickyNoteToast(`📌 New digital sticky note dropped on Stop #${currentStop.stopNumber}!`);
    setTimeout(() => setStickyNoteToast(null), 4000);

    setNewStickyText('');
    setIsNewStickyNoteModalOpen(false);
  };

  // Toggle like / reaction on sticky note
  const handleToggleLikeStickyNote = async (note: FieldTripStickyNote) => {
    const currentUid = newStickyAuthorRole === 'Teacher' ? 'teacher-1' : 'student-1';
    const result = await FieldTripNotesService.toggleLike(
      note.id,
      currentUid,
      note.likedByUids || [],
      note.likesCount || 0
    );

    setStickyNotes((prev) =>
      prev.map((n) => {
        if (n.id === note.id) {
          return {
            ...n,
            likesCount: result.newCount,
            likedByUids: result.newLikedByUids
          };
        }
        return n;
      })
    );

    if (selectedStickyNote?.id === note.id) {
      setSelectedStickyNote((prev) =>
        prev
          ? {
              ...prev,
              likesCount: result.newCount,
              likedByUids: result.newLikedByUids
            }
          : null
      );
    }
  };

  // Delete sticky note
  const handleDeleteStickyNote = async (noteId: string) => {
    await FieldTripNotesService.deleteNote(noteId);
    setStickyNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (selectedStickyNote?.id === noteId) {
      setSelectedStickyNote(null);
    }
    setStickyNoteToast('🗑️ Sticky note removed from collaborative layer.');
    setTimeout(() => setStickyNoteToast(null), 3000);
  };

  // Filter notes for current stop & category
  const stopStickyNotes = stickyNotes.filter((note) => {
    const matchesStop = note.stopNumber === currentStop.stopNumber;
    const matchesCategory = stickyCategoryFilter === 'all' || note.category === stickyCategoryFilter;
    return matchesStop && matchesCategory;
  });

  // Camera AR View (Physical Classroom to Digital Field Trip Bridge) State
  const [isCameraViewOpen, setIsCameraViewOpen] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeArLabelId, setActiveArLabelId] = useState<string | null>(null);
  const [arCompassHeading, setArCompassHeading] = useState<number>(45);
  const [arLabelFilter, setArLabelFilter] = useState<'all' | 'landmarks' | 'questions' | 'notes'>('all');
  const [arCapturedSnapshot, setArCapturedSnapshot] = useState<string | null>(null);
  const [arToastNotification, setArToastNotification] = useState<string | null>(null);

  // Teacher-Led Mode & Real-time Navigation Synchronization State
  const [isTeacherLedModeActive, setIsTeacherLedModeActive] = useState<boolean>(false);
  const [userRolePerspective, setUserRolePerspective] = useState<'teacher' | 'student'>('teacher');
  const [spotlightAnnouncement, setSpotlightAnnouncement] = useState<string>('');
  const [activeSpotlightBanner, setActiveSpotlightBanner] = useState<string | null>(null);
  const [syncedTeacherStopIndex, setSyncedTeacherStopIndex] = useState<number>(0);
  const [teacherLedNoticeToast, setTeacherLedNoticeToast] = useState<string | null>(null);

  // Real-time synchronization subscription for Teacher-Led Mode
  useEffect(() => {
    const unsub = subscribeToTeacherSession('active_class_session', (sessionData) => {
      if (sessionData) {
        setIsTeacherLedModeActive(sessionData.isTeacherLedModeActive);
        setSyncedTeacherStopIndex(sessionData.currentStopIndex);

        if (sessionData.spotlightMessage) {
          setActiveSpotlightBanner(sessionData.spotlightMessage);
        } else {
          setActiveSpotlightBanner(null);
        }

        // If in Student mode and Teacher-Led Mode is active, lock navigation & force sync with teacher
        if (sessionData.isTeacherLedModeActive && userRolePerspective === 'student') {
          if (typeof sessionData.currentStopIndex === 'number' && sessionData.currentStopIndex !== currentStopIndex) {
            if (sessionData.currentStopIndex >= 0 && sessionData.currentStopIndex < activeTrip.stops.length) {
              setCurrentStopIndex(sessionData.currentStopIndex);
            }
          }
          if (sessionData.mapViewMode && (sessionData.mapViewMode as any) !== (activeViewerTab as any)) {
            if (sessionData.mapViewMode === 'street') {
              setActiveViewerTab('streetview');
            } else if (sessionData.mapViewMode === 'ar') {
              handleOpenCameraARView();
            } else if ((sessionData.mapViewMode as string) === 'satellite' || (sessionData.mapViewMode as string) === 'roadmap' || (sessionData.mapViewMode as string) === 'interactive') {
              setActiveViewerTab('map');
              setMapType(sessionData.mapViewMode as any);
            }
          }
        }
      }
    });

    return () => {
      unsub();
    };
  }, [userRolePerspective, currentStopIndex, activeTrip.stops.length, activeViewerTab]);

  // Toggle Teacher-Led Mode host state
  const handleToggleTeacherLedMode = async (enabled: boolean) => {
    setIsTeacherLedModeActive(enabled);
    const toastMsg = enabled
      ? '🏫 Teacher-Led Mode Activated! Student navigation is locked & synchronized to your active milestone.'
      : '🔓 Teacher-Led Mode Deactivated. Students now have free exploration navigation.';
    setTeacherLedNoticeToast(toastMsg);
    setTimeout(() => setTeacherLedNoticeToast(null), 4500);

    await broadcastTeacherSession({
      sessionId: 'active_class_session',
      tripId: activeTrip.id,
      isTeacherLedModeActive: enabled,
      teacherUid: 'teacher-host',
      teacherName: 'Lead Educator',
      currentStopIndex,
      mapViewMode: activeViewerTab === 'streetview' ? 'street' : (mapType === 'satellite' ? 'satellite' : 'interactive'),
      spotlightMessage: spotlightAnnouncement || null,
      updatedAt: Date.now()
    });
  };

  // Broadcast current state to all synchronized viewers
  const handleBroadcastTeacherState = async (overrideStopIdx?: number, overrideMapMode?: string, overrideSpotlight?: string) => {
    if (!isTeacherLedModeActive || userRolePerspective !== 'teacher') return;

    const targetStopIdx = typeof overrideStopIdx === 'number' ? overrideStopIdx : currentStopIndex;
    const targetMapMode = overrideMapMode || (activeViewerTab === 'streetview' ? 'street' : (mapType === 'satellite' ? 'satellite' : 'interactive'));
    const targetSpotlight = typeof overrideSpotlight === 'string' ? overrideSpotlight : spotlightAnnouncement;

    await broadcastTeacherSession({
      sessionId: 'active_class_session',
      tripId: activeTrip.id,
      isTeacherLedModeActive: true,
      teacherUid: 'teacher-host',
      teacherName: 'Lead Educator',
      currentStopIndex: targetStopIdx,
      mapViewMode: targetMapMode as any,
      spotlightMessage: targetSpotlight || null,
      updatedAt: Date.now()
    });
  };

  // Handle Spotlight Announcement Broadcast
  const handleSendSpotlightAnnouncement = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!spotlightAnnouncement.trim()) return;

    handleBroadcastTeacherState(currentStopIndex, undefined, spotlightAnnouncement.trim());
    setTeacherLedNoticeToast('📣 Teacher Spotlight Message broadcasted to all student screens!');
    setTimeout(() => setTeacherLedNoticeToast(null), 3500);
  };

  const handleClearSpotlightAnnouncement = () => {
    setSpotlightAnnouncement('');
    handleBroadcastTeacherState(currentStopIndex, undefined, '');
    setTeacherLedNoticeToast('🧹 Spotlight Announcement cleared.');
    setTimeout(() => setTeacherLedNoticeToast(null), 3000);
  };

  // Auto-Follow Mode State & Automatic Camera Transition Handler
  const [isAutoFollowActive, setIsAutoFollowActive] = useState<boolean>(true);
  const [autoFollowToast, setAutoFollowToast] = useState<string | null>(null);

  const triggerAutoFollowTransition = (taskName: string) => {
    if (!isAutoFollowActive) return;
    if (currentStopIndex < activeTrip.stops.length - 1) {
      const nextIdx = currentStopIndex + 1;
      const nextStop = activeTrip.stops[nextIdx];
      if (nextStop) {
        const toastMsg = `✨ Auto-Follow: Completed ${taskName}! Smoothly transitioning camera to Milestone #${nextStop.stopNumber}: ${nextStop.locationName}...`;
        setAutoFollowToast(toastMsg);
        setTimeout(() => setAutoFollowToast(null), 5000);

        setTimeout(() => {
          handleSmartJumpToStop(nextIdx);
        }, 750);
      }
    }
  };

  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cameraMediaStreamRef = useRef<MediaStream | null>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement>(null);

  // Request & Launch Live Device Camera Stream
  const handleOpenCameraARView = async () => {
    setIsCameraViewOpen(true);
    setCameraError(null);
    setArCapturedSnapshot(null);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        cameraMediaStreamRef.current = stream;
        setIsCameraActive(true);
      } else {
        setCameraError('Browser camera API not detected. Showing interactive simulated AR classroom camera feed.');
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Device camera permissions unavailable or declined. Interactive simulated AR feed active.');
      setIsCameraActive(false);
    }
  };

  // Close Camera AR View & Stop Media Tracks
  const handleCloseCameraARView = () => {
    if (cameraMediaStreamRef.current) {
      cameraMediaStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraMediaStreamRef.current = null;
    }
    setIsCameraActive(false);
    setIsCameraViewOpen(false);
    setArCapturedSnapshot(null);
  };

  // Re-bind video stream element whenever modal or stream state toggles
  useEffect(() => {
    if (isCameraViewOpen && cameraMediaStreamRef.current && cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = cameraMediaStreamRef.current;
      cameraVideoRef.current.play().catch(() => {});
    }
  }, [isCameraViewOpen, isCameraActive]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (cameraMediaStreamRef.current) {
        cameraMediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Snap photo with overlaid educational landmark labels
  const handleTakeARSnapshot = () => {
    const video = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 1280;
        canvas.height = 720;

        if (video && isCameraActive && video.readyState === 4) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else {
          // Draw high-tech physical classroom grid backdrop fallback
          const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          grad.addColorStop(0, '#020617');
          grad.addColorStop(0.5, '#0f172a');
          grad.addColorStop(1, '#1e1b4b');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
          ctx.lineWidth = 1;
          for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
        }

        // Draw HUD Banner & Landmark Watermark
        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
        ctx.fillRect(20, 20, 520, 75);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, 520, 75);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`📍 AR Landmark Overlay: ${currentStop.locationName}`, 35, 50);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '13px sans-serif';
        ctx.fillText(`Stop #${currentStop.stopNumber} • ${activeTrip.title} • Classroom Excursion AR`, 35, 75);

        const dataUrl = canvas.toDataURL('image/png');
        setArCapturedSnapshot(dataUrl);
        setArToastNotification('📸 AR Educational Landmark Snapshot Captured! Saved for class journal reflection.');
        setTimeout(() => setArToastNotification(null), 4000);
      }
    }
  };

  const handleSmartJumpToStop = (stopIdx: number) => {
    if (stopIdx < 0 || stopIdx >= activeTrip.stops.length) return;

    // Enforce Student Navigation Lock when Teacher-Led Mode is active
    if (isTeacherLedModeActive && userRolePerspective === 'student') {
      const lockedStop = activeTrip.stops[syncedTeacherStopIndex] || activeTrip.stops[0];
      setTeacherLedNoticeToast(`🔒 Student navigation is locked in Teacher-Led Mode! You are synchronized to Teacher's view at Stop #${lockedStop.stopNumber}: ${lockedStop.locationName}.`);
      setTimeout(() => setTeacherLedNoticeToast(null), 4000);
      return;
    }

    setCurrentStopIndex(stopIdx);
    setSelectedAnnotation(null);
    setIsAnnotateModeActive(false);
    const targetStop = activeTrip.stops[stopIdx];
    const isFuture = stopIdx > currentStopIndex;
    const isPast = stopIdx < currentStopIndex;
    const labelPrefix = isFuture ? '🚀 Smart Jumped to Future Milestone' : isPast ? '⏪ Jumped to Previous Milestone' : '🎯 Re-focused Milestone';

    const toastText = `${labelPrefix} Stop #${targetStop.stopNumber}: ${targetStop.locationName}! Socratic guided prompts & educational content loaded.`;
    setSmartJumpToast(toastText);
    setTimeout(() => setSmartJumpToast(null), 4500);

    // If hosting in Teacher mode, broadcast the milestone jump in real-time to all connected students
    if (isTeacherLedModeActive && userRolePerspective === 'teacher') {
      handleBroadcastTeacherState(stopIdx);
    }

    // Scroll smoothly to Socratic prompts section
    setTimeout(() => {
      const el = document.getElementById('socratic-guide-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Sync ambient soundscape preset whenever active trip or current stop changes
  useEffect(() => {
    const autoPreset = detectAmbientPreset(activeTrip, currentStop);
    setAmbientPreset(autoPreset);
    if (isAmbientPlaying) {
      ambientAudioEngine.setPreset(autoPreset);
    }
  }, [activeTrip.id, currentStopIndex]);

  // Cleanup ambient audio synthesizer on unmount
  useEffect(() => {
    return () => {
      ambientAudioEngine.stop();
    };
  }, []);

  const handleToggleAmbientAudio = () => {
    if (isAmbientPlaying) {
      ambientAudioEngine.stop();
      setIsAmbientPlaying(false);
    } else {
      ambientAudioEngine.play(ambientPreset, ambientVolume);
      setIsAmbientPlaying(true);
    }
  };

  const handleSelectAmbientPreset = (presetKey: AmbientPresetKey) => {
    setAmbientPreset(presetKey);
    if (isAmbientPlaying) {
      ambientAudioEngine.setPreset(presetKey);
    } else {
      ambientAudioEngine.play(presetKey, ambientVolume);
      setIsAmbientPlaying(true);
    }
  };

  const handleAmbientVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    ambientAudioEngine.setVolume(vol);
  };

  // Educator Notes Modal & Injection State
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState<boolean>(false);
  const [noteAuthorName, setNoteAuthorName] = useState<string>('Dr. Sarah Johnson');
  const [noteAuthorRole, setNoteAuthorRole] = useState<string>('Lead Curriculum Specialist');
  const [noteText, setNoteText] = useState<string>('');
  const [notePedagogicalFocus, setNotePedagogicalFocus] = useState<EducatorNote['pedagogicalFocus']>('discussion_prompt');
  const [noteIsMilestoneLocked, setNoteIsMilestoneLocked] = useState<boolean>(false);
  const [noteRequiredMilestoneCount, setNoteRequiredMilestoneCount] = useState<number>(1);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const handleOpenAddNoteModal = (existingNote?: EducatorNote) => {
    if (existingNote) {
      setEditingNoteId(existingNote.id);
      setNoteAuthorName(existingNote.authorName);
      setNoteAuthorRole(existingNote.role || '');
      setNoteText(existingNote.noteText);
      setNotePedagogicalFocus(existingNote.pedagogicalFocus);
      setNoteIsMilestoneLocked(!!existingNote.isMilestoneLocked);
      setNoteRequiredMilestoneCount(existingNote.requiredMilestoneCount || 1);
    } else {
      setEditingNoteId(null);
      setNoteAuthorName('Dr. Sarah Johnson');
      setNoteAuthorRole('Lead Curriculum Specialist');
      setNoteText('');
      setNotePedagogicalFocus('discussion_prompt');
      setNoteIsMilestoneLocked(false);
      setNoteRequiredMilestoneCount(1);
    }
    setIsAddNoteModalOpen(true);
  };

  const handleSaveEducatorNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const currentNotes = currentStop.educatorNotes || [];
    let updatedNotes: EducatorNote[];

    if (editingNoteId) {
      updatedNotes = currentNotes.map(n =>
        n.id === editingNoteId
          ? {
              ...n,
              authorName: noteAuthorName,
              role: noteAuthorRole,
              noteText,
              pedagogicalFocus: notePedagogicalFocus,
              isMilestoneLocked: noteIsMilestoneLocked,
              requiredMilestoneCount: noteRequiredMilestoneCount
            }
          : n
      );
    } else {
      const newNote: EducatorNote = {
        id: `note-${Date.now()}`,
        authorName: noteAuthorName,
        role: noteAuthorRole,
        noteText,
        pedagogicalFocus: notePedagogicalFocus,
        isMilestoneLocked: noteIsMilestoneLocked,
        requiredMilestoneCount: noteRequiredMilestoneCount,
        addedAt: new Date().toISOString().split('T')[0]
      };
      updatedNotes = [...currentNotes, newNote];
    }

    const updatedStops = [...activeTrip.stops];
    updatedStops[currentStopIndex] = {
      ...currentStop,
      educatorNotes: updatedNotes
    };

    const updatedTrip = {
      ...activeTrip,
      stops: updatedStops
    };

    setActiveTrip(updatedTrip);
    VirtualFieldTripService.saveCustomRoute(updatedTrip);
    setIsAddNoteModalOpen(false);

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch (err) {}
  };

  const handleDeleteEducatorNote = (noteId: string) => {
    const currentNotes = currentStop.educatorNotes || [];
    const updatedNotes = currentNotes.filter(n => n.id !== noteId);

    const updatedStops = [...activeTrip.stops];
    updatedStops[currentStopIndex] = {
      ...currentStop,
      educatorNotes: updatedNotes
    };

    const updatedTrip = {
      ...activeTrip,
      stops: updatedStops
    };

    setActiveTrip(updatedTrip);
    VirtualFieldTripService.saveCustomRoute(updatedTrip);
  };

  // Automatically refresh student profile whenever excursion progress changes
  useEffect(() => {
    setStudentProfile(VirtualFieldTripService.getTotalStudentProfile());
  }, [studentProgress, fieldTrips]);

  // Open Rate Trip Modal prefilled with existing rating if available
  const handleOpenRateModal = () => {
    if (studentProgress.tripRating) {
      setRatingStars(studentProgress.tripRating.stars);
      setRatingComment(studentProgress.tripRating.comment || '');
    } else {
      setRatingStars(5);
      setRatingComment('');
    }
    setIsRatingSubmitted(false);
    setIsRateTripModalOpen(true);
  };

  // Submit Trip Rating Handler
  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProg = VirtualFieldTripService.submitTripRating(activeTrip.id, {
      stars: ratingStars,
      comment: ratingComment
    });
    setStudentProgress(updatedProg);
    setIsRatingSubmitted(true);
    setTimeout(() => {
      setIsRateTripModalOpen(false);
      setIsRatingSubmitted(false);
    }, 1800);
  };

  // ================= SOCRATIC TRAVEL JOURNAL STATE & HANDLERS =================
  const [isJournalModalOpen, setIsJournalModalOpen] = useState<boolean>(false);
  const [journalActiveStopNumber, setJournalActiveStopNumber] = useState<number>(1);
  const [journalSaveStatus, setJournalSaveStatus] = useState<string | null>(null);
  const [isJournalCopied, setIsJournalCopied] = useState<boolean>(false);
  const [isGeneratingJournalPrompt, setIsGeneratingJournalPrompt] = useState<boolean>(false);

  const [journalData, setJournalData] = useState<SocraticTravelJournal>(() => {
    if (studentProgress.journal) return studentProgress.journal;
    return {
      routeId: activeTrip.id,
      tripTitle: activeTrip.title,
      studentName: 'Student Expeditionist',
      summaryReflection: '',
      stopEntries: {},
      isSubmitted: false,
      lastSavedAt: new Date().toISOString()
    };
  });

  // Sync journal data when activeTrip or studentProgress changes
  useEffect(() => {
    if (studentProgress.journal) {
      setJournalData(studentProgress.journal);
    } else {
      setJournalData({
        routeId: activeTrip.id,
        tripTitle: activeTrip.title,
        studentName: 'Student Expeditionist',
        summaryReflection: '',
        stopEntries: {},
        isSubmitted: false,
        lastSavedAt: new Date().toISOString()
      });
    }
    setJournalActiveStopNumber(currentStop ? currentStop.stopNumber : 1);
  }, [activeTrip.id, studentProgress.journal, currentStopIndex]);

  const handleOpenJournal = (stopNumberToOpen?: number) => {
    setJournalActiveStopNumber(stopNumberToOpen || (currentStop ? currentStop.stopNumber : 1));
    setIsJournalModalOpen(true);
  };

  const handleUpdateJournalStopField = (stopNum: number, field: keyof SocraticJournalStopEntry, value: any) => {
    const currentEntry: SocraticJournalStopEntry = journalData.stopEntries[stopNum] || {
      stopNumber: stopNum,
      stopTitle: activeTrip.stops.find(s => s.stopNumber === stopNum)?.title || `Stop ${stopNum}`,
      locationName: activeTrip.stops.find(s => s.stopNumber === stopNum)?.locationName || 'Field Location',
      observations: '',
      hypothesis: '',
      causeAndEffect: '',
      vocabularyLearned: [],
      questionsRemaining: '',
      updatedAt: new Date().toISOString()
    };

    const updatedStopEntry = {
      ...currentEntry,
      [field]: value,
      updatedAt: new Date().toISOString()
    };

    const updatedJournal: SocraticTravelJournal = {
      ...journalData,
      stopEntries: {
        ...journalData.stopEntries,
        [stopNum]: updatedStopEntry
      },
      lastSavedAt: new Date().toISOString()
    };

    setJournalData(updatedJournal);
    const updatedProg = VirtualFieldTripService.saveJournal(activeTrip.id, updatedJournal);
    setStudentProgress(updatedProg);
    setJournalSaveStatus('Saved to Journal');
    setTimeout(() => setJournalSaveStatus(null), 2000);
  };

  const handleUpdateJournalSummary = (summaryText: string) => {
    const updatedJournal: SocraticTravelJournal = {
      ...journalData,
      summaryReflection: summaryText,
      lastSavedAt: new Date().toISOString()
    };
    setJournalData(updatedJournal);
    const updatedProg = VirtualFieldTripService.saveJournal(activeTrip.id, updatedJournal);
    setStudentProgress(updatedProg);
    setJournalSaveStatus('Summary Saved (+150 XP)');
    setTimeout(() => setJournalSaveStatus(null), 2000);
  };

  const handleExportJournalMarkdown = () => {
    const mdContent = VirtualFieldTripService.exportJournalAsMarkdown(journalData, activeTrip.title);
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Socratic_Travel_Journal_${activeTrip.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJournalText = () => {
    const mdContent = VirtualFieldTripService.exportJournalAsMarkdown(journalData, activeTrip.title);
    navigator.clipboard.writeText(mdContent);
    setIsJournalCopied(true);
    setTimeout(() => setIsJournalCopied(false), 2000);
  };

  // AI Assistant to suggest a Socratic observation question or reflection for current journal entry
  const handleGenerateAIJournalPrompt = async (stopNum: number) => {
    const targetStop = activeTrip.stops.find(s => s.stopNumber === stopNum) || currentStop;
    if (!targetStop) return;

    setIsGeneratingJournalPrompt(true);
    try {
      const response = await fetch('/api/chat/socratic-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTitle: activeTrip.title,
          stopTitle: targetStop.title,
          locationName: targetStop.locationName,
          readingPassage: targetStop.readingPassage,
          destination: activeTrip.destination,
          subject: activeTrip.subject,
          socraticGuidePrompts: targetStop.socraticGuidePrompts,
          userPrompt: `Generate 1 clear, inspiring Socratic reflection question for the student's travel journal about ${targetStop.title}.`,
          language: language
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          const currentEntry = journalData.stopEntries[stopNum] || {
            stopNumber: stopNum,
            stopTitle: targetStop.title,
            locationName: targetStop.locationName,
            observations: '',
            hypothesis: '',
            causeAndEffect: '',
            vocabularyLearned: [],
            questionsRemaining: '',
            updatedAt: new Date().toISOString()
          };

          const newRemaining = currentEntry.questionsRemaining
            ? `${currentEntry.questionsRemaining}\n\n💡 Socratic Guide Idea: ${data.reply}`
            : `💡 Socratic Guide Idea: ${data.reply}`;

          handleUpdateJournalStopField(stopNum, 'questionsRemaining', newRemaining);
        }
      }
    } catch (e) {
      console.error('Error generating AI journal prompt:', e);
    } finally {
      setIsGeneratingJournalPrompt(false);
    }
  };

  // Network Connectivity & Offline Cache State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [cacheNotification, setCacheNotification] = useState<string | null>(null);

  // Listen to network status changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load field trips on mount (checks presets, custom, and cached offline data) and parse deep-link parameters
  useEffect(() => {
    const loaded = VirtualFieldTripService.getFieldTrips();
    setFieldTrips(loaded);

    const params = new URLSearchParams(window.location.search);
    const urlTripId = params.get('fieldtrip') || params.get('trip') || initialTripId;
    const urlStopStr = params.get('stop');

    if (urlTripId) {
      let match = loaded.find(t => t.id === urlTripId) || VirtualFieldTripService.getFieldTripById(urlTripId);
      if (match) {
        setActiveTrip(match);
        // Automatically cache active trip for offline availability
        VirtualFieldTripService.cacheTripForOffline(match);
        const prog = VirtualFieldTripService.getStudentProgress(match.id);
        setStudentProgress(prog);
        if (urlStopStr && !isNaN(parseInt(urlStopStr))) {
          const parsedStop = Math.max(0, Math.min(match.stops.length - 1, parseInt(urlStopStr) - 1));
          setCurrentStopIndex(parsedStop);
        } else {
          setCurrentStopIndex(prog.currentStopIndex || 0);
        }
      }
    }
  }, [initialTripId]);

  // Ensure active trip is pre-cached for offline use whenever it changes
  useEffect(() => {
    if (activeTrip) {
      VirtualFieldTripService.cacheTripForOffline(activeTrip);
    }
  }, [activeTrip]);

  // Explicit Handler to Cache Trip for Offline Use
  const handleCacheCurrentTrip = () => {
    VirtualFieldTripService.cacheTripForOffline(activeTrip);
    setCacheNotification(`"${activeTrip.title}" pre-loaded & saved for offline use!`);
    setTimeout(() => setCacheNotification(null), 3500);
  };

  // Generate shareable deep link URL
  const getShareableDeepLink = (): string => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('fieldtrip', activeTrip.id);
    if (currentStopIndex > 0) {
      url.searchParams.set('stop', (currentStopIndex + 1).toString());
    }
    return url.toString();
  };

  // Copy share link handler
  const handleCopyShareLink = async () => {
    const link = getShareableDeepLink();
    try {
      await navigator.clipboard.writeText(link);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  // Copy classroom LMS snippet handler
  const handleCopyClassroomSnippet = async () => {
    const link = getShareableDeepLink();
    const snippet = `🎒 Virtual Field Trip: ${activeTrip.title} (${activeTrip.country})\n📍 Stop #${currentStopIndex + 1}: ${currentStop?.title || 'Overview'}\n🔗 Access Excursion: ${link}`;
    try {
      await navigator.clipboard.writeText(snippet);
      setIsSnippetCopied(true);
      setTimeout(() => setIsSnippetCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy snippet:', err);
    }
  };

  // Generate or open Lesson Plan Modal
  const handleGenerateLessonPlan = async () => {
    setIsLessonPlanModalOpen(true);
    if (!lessonPlan || lessonPlan.lessonTitle !== activeTrip.title) {
      setIsGeneratingLessonPlan(true);
      setLessonPlanError(null);
      try {
        const plan = await VirtualFieldTripService.generateLessonPlan(activeTrip);
        setLessonPlan(plan);
      } catch (err: any) {
        console.error('Failed to generate lesson plan:', err);
        setLessonPlanError(err.message || 'Could not generate lesson plan. Please check API credentials.');
      } finally {
        setIsGeneratingLessonPlan(false);
      }
    }
  };

  // Copy full lesson plan formatted text
  const handleCopyLessonPlanText = async () => {
    if (!lessonPlan) return;
    const text = `
LESSON PLAN: ${lessonPlan.lessonTitle}
Subject: ${lessonPlan.subject} | Grade Level: ${lessonPlan.gradeLevel} | Duration: ${lessonPlan.durationMinutes} minutes

OVERVIEW:
${lessonPlan.overview}

LEARNING OUTCOMES:
${lessonPlan.learningOutcomes.map(o => `• ${o}`).join('\n')}

CBC COMPETENCIES & VALUES:
${lessonPlan.cbcCompetencies.map(c => `• ${c}`).join('\n')}

MATERIALS & EQUIPMENT:
${lessonPlan.materialsAndEquipment.map(m => `• ${m}`).join('\n')}

PRE-TRIP PREPARATION:
${lessonPlan.preTripPreparation.map(p => `• ${p}`).join('\n')}

STOP-BY-STOP EDUCATOR GUIDANCE:
${lessonPlan.stopByStopGuidance.map(s => `
Stop #${s.stopNumber}: ${s.stopTitle}
• Teacher Script: ${s.teacherScript}
• Socratic Inquiry Questions:
${s.socraticQuestions.map(q => `  - ${q}`).join('\n')}
• Student Action Item: ${s.studentActionItem}
`).join('\n')}

POST-TRIP ASSESSMENT:
Exit Slip Prompt: ${lessonPlan.postTripAssessment.exitSlipPrompt}

EXTENSION ACTIVITIES:
${lessonPlan.postTripAssessment.extensionActivities.map(e => `• ${e}`).join('\n')}

DIFFERENTIATION STRATEGIES:
• For Support: ${lessonPlan.differentiationStrategies.forSupport}
• For Extension: ${lessonPlan.differentiationStrategies.forExtension}
`;
    try {
      await navigator.clipboard.writeText(text.trim());
      setIsLessonPlanCopied(true);
      setTimeout(() => setIsLessonPlanCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy lesson plan:', err);
    }
  };

  // Print or Save PDF Lesson Plan handler
  const handlePrintLessonPlan = () => {
    window.print();
  };

  // When active trip or stop changes, re-initialize Socratic chat
  const currentStop: VirtualFieldTripStop = activeTrip.stops[currentStopIndex] || activeTrip.stops[0];

  useEffect(() => {
    if (currentStop) {
      const initialGreeting = `Welcome to EduNexus Virtual tour Guide! Let us dive into the design and details of ${currentStop.title} together. Look closely at ${currentStop.locationName} on the left map. ${currentStop.socraticGuidePrompts[0] || 'What key features do you notice?'}`;
      setSocraticChat([
        {
          sender: 'guide',
          text: initialGreeting,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [activeTrip.id, currentStopIndex]);

  // Handle Switching Field Trip Route
  const handleSelectTrip = (trip: VirtualFieldTripRoute) => {
    setActiveTrip(trip);
    VirtualFieldTripService.cacheTripForOffline(trip);
    setCurrentStopIndex(0);
    const prog = VirtualFieldTripService.getStudentProgress(trip.id);
    setStudentProgress(prog);
  };

  // Toggle Checkpoint Completion (ADHD Focus Scaffolding)
  const handleToggleCheckpoint = (checkpointId: string) => {
    const isCompleted = studentProgress.completedCheckpointIds.includes(checkpointId);
    let updatedCheckpoints: string[];

    const allTripCheckpoints = activeTrip.stops.flatMap(s => s.checkpoints);
    const wasAllDone = allTripCheckpoints.length > 0 && allTripCheckpoints.every(c => studentProgress.completedCheckpointIds.includes(c.id));

    if (isCompleted) {
      updatedCheckpoints = studentProgress.completedCheckpointIds.filter(id => id !== checkpointId);
    } else {
      updatedCheckpoints = [...studentProgress.completedCheckpointIds, checkpointId];
      const nowAllDone = allTripCheckpoints.length > 0 && allTripCheckpoints.every(c => updatedCheckpoints.includes(c.id));

      if (!wasAllDone && nowAllDone) {
        setIsCelebrationOverlayOpen(true);
        try {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.4 }
          });
        } catch (err) {
          console.log('Confetti playback:', err);
        }
      } else {
        // Fire milestone confetti
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 }
          });
        } catch (err) {
          console.log('Confetti playback:', err);
        }
      }
    }

    const updatedProgress: StudentExcursionProgress = {
      ...studentProgress,
      completedCheckpointIds: updatedCheckpoints,
      streakCount: updatedCheckpoints.length > 0 ? studentProgress.streakCount : 1
    };

    setStudentProgress(updatedProgress);
    VirtualFieldTripService.saveStudentProgress(updatedProgress);

    // Check if current stop micro-milestones are completed to trigger Auto-Follow
    if (!isCompleted) {
      const stopCheckpoints = currentStop.checkpoints || [];
      const isCurrentStopAllDone = stopCheckpoints.length > 0 && stopCheckpoints.every(c => updatedCheckpoints.includes(c.id));
      if (isCurrentStopAllDone && isAutoFollowActive && currentStopIndex < activeTrip.stops.length - 1) {
        triggerAutoFollowTransition('Milestone Checkpoints');
      }
    }
  };

  // Complete Reading & Socratic Task for Active Milestone (Triggers Auto-Follow Camera Transition)
  const handleCompleteReadingAndAutoFollow = () => {
    const currentStopChks = (currentStop.checkpoints || []).map(c => c.id);
    const updatedChks = Array.from(new Set([...studentProgress.completedCheckpointIds, ...currentStopChks]));
    const updatedProgress: StudentExcursionProgress = {
      ...studentProgress,
      completedCheckpointIds: updatedChks,
      streakCount: studentProgress.streakCount + 1
    };
    setStudentProgress(updatedProgress);
    VirtualFieldTripService.saveStudentProgress(updatedProgress);

    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    } catch (e) {}

    if (currentStopIndex < activeTrip.stops.length - 1) {
      triggerAutoFollowTransition('Reading & Socratic Task');
    } else {
      setIsExitSlipOpen(true);
    }
  };

  // Synthesize Read Aloud for Passages
  const handleToggleReadAloud = (textToRead: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.92;

    if (language === 'sw') utterance.lang = 'sw-KE';
    else if (language === 'fr') utterance.lang = 'fr-FR';
    else utterance.lang = 'en-US';

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Toggle Voice Input (Speech Recognition) for Socratic Questions
  const handleToggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.log(err);
        }
      }
      setIsListening(false);
      return;
    }

    try {
      setSpeechError(null);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      if (language === 'sw') recognition.lang = 'sw-KE';
      else if (language === 'fr') recognition.lang = 'fr-FR';
      else recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setStudentInput(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access to ask questions via voice.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Voice input error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setSpeechError('Could not activate microphone voice input.');
    }
  };

  // Read Aloud Tour Guide Socratic Response
  const handleReadGuideMessage = (textToRead: string, msgIndex: number) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingGuideMsgIndex === msgIndex) {
      window.speechSynthesis.cancel();
      setSpeakingGuideMsgIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;

    if (language === 'sw') utterance.lang = 'sw-KE';
    else if (language === 'fr') utterance.lang = 'fr-FR';
    else utterance.lang = 'en-US';

    utterance.onend = () => setSpeakingGuideMsgIndex(null);
    utterance.onerror = () => setSpeakingGuideMsgIndex(null);

    setSpeakingGuideMsgIndex(msgIndex);
    window.speechSynthesis.speak(utterance);
  };

  // Send Student Socratic Message
  const handleSendSocraticMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentInput.trim() || isSocraticThinking) return;

    const userText = studentInput.trim();
    setStudentInput('');

    const newChat = [
      ...socraticChat,
      {
        sender: 'student' as const,
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setSocraticChat(newChat);
    setIsSocraticThinking(true);

    // Call Socratic guide simulation or backend API
    try {
      const response = await fetch('/api/chat/socratic-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTitle: `${activeTrip.title} - ${currentStop.title}`,
          stopTitle: currentStop.title,
          locationName: currentStop.locationName,
          readingPassage: currentStop.readingPassage,
          destination: activeTrip.destination,
          subject: activeTrip.subject,
          socraticGuidePrompts: currentStop.socraticGuidePrompts,
          userPrompt: userText,
          chatHistory: socraticChat,
          language: language
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSocraticChat(prev => [
          ...prev,
          {
            sender: 'guide',
            text: data.reply || `Great observation! Notice how the layout of ${currentStop.locationName} reflects both its functional purpose and cultural heritage. What else stands out?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error('Socratic tour guide service offline');
      }
    } catch (err) {
      setSocraticChat(prev => [
        ...prev,
        {
          sender: 'guide',
          text: `Insightful thought! Take a close look at the surrounding street alignment on the map. How does that connect with your observation?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSocraticThinking(false);
    }
  };

  // Submit Exit Slip
  const handleSubmitExitSlip = (e: React.FormEvent) => {
    e.preventDefault();

    const answers: ExitSlipAnswers = {
      understandingScore: exitUnderstanding,
      keyObservation: exitObservation.trim() || 'Observed major historical architectural and geographical structures.',
      foreignLanguageReflection: exitLanguageReflection.trim() || 'Practiced directional foreign language cues.',
      confidenceLevel: exitConfidence,
      completedAt: new Date().toISOString()
    };

    const updatedProg = VirtualFieldTripService.submitExitSlip(activeTrip.id, answers);
    setStudentProgress(updatedProg);
    setIsExitSlipOpen(false);

    // Open Celebratory Overlay
    setIsCelebrationOverlayOpen(true);
    try {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.4 }
      });
    } catch (err) {
      console.log('Confetti playback:', err);
    }

    // Trigger Auto-Follow camera transition to next milestone if active
    if (isAutoFollowActive && currentStopIndex < activeTrip.stops.length - 1) {
      triggerAutoFollowTransition('Socratic Exit Slip Reflection');
    }
  };

  // Generate Custom AI Field Trip (Virtual Tour Creator)
  const handleGenerateCustomTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderDestination.trim()) return;

    // Resolve Effective Values (handling Custom inputs)
    const effectiveRole = creatorRole === 'custom' ? (customCreatorRole.trim() || 'Custom Curriculum Guide') : creatorRole;
    const effectiveCategoryLabel = builderCategory === 'custom'
      ? (customCategory.trim() || 'Custom Excursion')
      : builderCategory === 'european_cities'
      ? 'Specific European & Global Cities'
      : builderCategory === 'art_museums'
      ? 'Art Museums & Gallery Exhibits'
      : builderCategory === 'agricultural_farms'
      ? 'Agricultural Sites & Farm Supply Chains'
      : builderCategory === 'school_campus'
      ? 'School Campuses & Local Community Landmarks'
      : 'Interactive Timelines & Science Charts';

    const effectiveLanguage = builderLanguage === 'custom' ? (customLanguage.trim() || 'Multilingual Cues') : builderLanguage;
    const effectiveSubject = builderSubject === 'custom' ? (customSubject.trim() || 'Interdisciplinary Studies') : builderSubject;
    const effectiveGrade = builderGrade === 'custom' ? (customGrade.trim() || 'All Learning Levels') : builderGrade;
    const effectiveQrPlacement = qrPlacementStrategy === 'custom'
      ? (customQrPlacement.trim() || 'Physical QR Code Markers')
      : qrPlacementStrategy === 'library_shelves'
      ? 'Mounted on Physical Library Shelves & Book Spines'
      : qrPlacementStrategy === 'classroom_posters'
      ? 'Affixed to Classroom Posters, Wall Maps & Periodic Tables'
      : qrPlacementStrategy === 'department_signs'
      ? 'Placed on Campus Buildings & Neighborhood Department Landmarks'
      : qrPlacementStrategy === 'museum_plaques'
      ? 'Integrated into Physical Museum Gallery Exhibit Plaques'
      : 'Planted at Farm Pastures & Food Processing Silos';

    setIsGeneratingTrip(true);
    try {
      const response = await fetch('/api/virtual-field-trip/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: builderDestination,
          country: builderCountry || 'Global Landmark',
          subject: effectiveSubject,
          gradeLevel: effectiveGrade,
          targetLanguage: effectiveLanguage,
          creatorRole: effectiveRole,
          excursionCategory: effectiveCategoryLabel,
          qrPlacementStrategy: effectiveQrPlacement,
          stopCount: 3
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.fieldTrip) {
          VirtualFieldTripService.saveCustomFieldTrip(data.fieldTrip);
          const updatedTrips = VirtualFieldTripService.getFieldTrips();
          setFieldTrips(updatedTrips);
          setActiveTrip(data.fieldTrip);
          setCurrentStopIndex(0);
          setIsBuilderOpen(false);
          setIsGeneratingTrip(false);
          return;
        }
      }
      throw new Error('Fallback to local AI route synthesis');
    } catch (err: any) {
      console.log('Generating custom tour route via client synthesis:', err);

      // Robust local client synthesis if server route is offline or fallback
      const generatedTripId = `custom-tour-${Date.now()}`;
      const newTrip: VirtualFieldTripRoute = {
        id: generatedTripId,
        title: `${builderDestination} (${effectiveCategoryLabel})`,
        destination: builderDestination,
        country: builderCountry || 'Local Community / Global Site',
        subject: effectiveSubject,
        gradeLevel: effectiveGrade,
        coverImage: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80',
        description: `Custom excursion created by ${effectiveRole} step-by-step guide. Focuses on ${builderDestination} utilizing physical QR markers (${effectiveQrPlacement}).`,
        primaryLanguage: `${effectiveLanguage} & English`,
        isPreset: false,
        createdBy: `${effectiveRole} Tour Guide`,
        createdAt: new Date().toISOString().split('T')[0],
        stops: [
          {
            stopNumber: 1,
            title: `Stop 1: Arrival & Exploration of ${builderDestination}`,
            locationName: `${builderDestination}, ${builderCountry || 'Local Site'}`,
            lat: 50.8503,
            lng: 4.3517,
            zoom: 18,
            mapType: 'satellite',
            readingPassage: `Welcome to ${builderDestination}! Created by a ${effectiveRole}, this interactive tour connects physical assets with online data. QR codes are ${effectiveQrPlacement.toLowerCase()} to allow instant scanning.`,
            foreignLanguageCues: [
              {
                phrase: `Explorez ${builderDestination}`,
                language: effectiveLanguage,
                translation: `Explore ${builderDestination}`,
                phoneticSpelling: `ex-plor-ay ${builderDestination}`,
                usageContext: 'Directional clue for navigating this stop'
              }
            ],
            navigationInstruction: `Follow the ${effectiveLanguage} directional clue to locate the central landmark. Scan physical QR tags mounted on site.`,
            socraticGuidePrompts: [
              `Look closely at the surrounding layout of ${builderDestination}. What architectural or geographical features stand out?`,
              `How does placing QR tags on physical assets enhance your understanding of this site?`
            ],
            checkpoints: [
              {
                id: `${generatedTripId}-chk-1`,
                label: `Locate main landmark area of ${builderDestination} on the map`,
                hint: 'Zoom into the central coordinates.',
                isCompleted: false,
                rewardPoints: 30
              },
              {
                id: `${generatedTripId}-chk-2`,
                label: `Practice the ${effectiveLanguage} phrase "Explorez ${builderDestination}"`,
                hint: 'Read aloud using audio playback.',
                isCompleted: false,
                rewardPoints: 25
              }
            ],
            educatorNotes: [
              {
                id: `note-${Date.now()}`,
                authorName: effectiveRole,
                role: 'Tour Creator',
                noteText: `Pedagogical Focus: Encourage students to connect physical surroundings with digital resources unlocked by QR codes (${effectiveQrPlacement}).`,
                pedagogicalFocus: 'curriculum_connection',
                isMilestoneLocked: false,
                addedAt: new Date().toISOString().split('T')[0]
              }
            ]
          },
          {
            stopNumber: 2,
            title: `Stop 2: Secondary Asset & Deep In-Depth Analysis`,
            locationName: `${builderDestination} Sector 2`,
            lat: 50.8467,
            lng: 4.3525,
            zoom: 18,
            mapType: 'roadmap',
            readingPassage: `At this second stop, examine the historical, scientific, or cultural significance of ${builderDestination}. Reflect on how local community assets or global trade routes intersect here.`,
            foreignLanguageCues: [
              {
                phrase: `Comprenez l’histoire`,
                language: effectiveLanguage,
                translation: 'Understand the history',
                phoneticSpelling: 'kohm-pruh-nay lees-twahr',
                usageContext: 'Socratic reflection prompt'
              }
            ],
            navigationInstruction: 'Proceed to the adjacent plaza or asset node on the map.',
            socraticGuidePrompts: [
              'What cause-and-effect relationships shaped this landmark over time?'
            ],
            checkpoints: [
              {
                id: `${generatedTripId}-chk-3`,
                label: `Complete the Socratic reflection for ${builderDestination}`,
                hint: 'Type your thoughts into the Travel Journal or Socratic Guide.',
                isCompleted: false,
                rewardPoints: 35
              }
            ]
          }
        ]
      };

      VirtualFieldTripService.saveCustomFieldTrip(newTrip);
      const updatedTrips = VirtualFieldTripService.getFieldTrips();
      setFieldTrips(updatedTrips);
      setActiveTrip(newTrip);
      setCurrentStopIndex(0);
      setIsBuilderOpen(false);
    } finally {
      setIsGeneratingTrip(false);
    }
  };

  // Construct iframe embed URL for fallback or satellite/streetview preview
  const getMapIframeUrl = (): string => {
    if (!currentStop) return '';
    const lat = currentStop.lat;
    const lng = currentStop.lng;

    if (activeViewerTab === 'streetview') {
      return `https://maps.google.com/maps?q=${lat},${lng}&layer=c&cbll=${lat},${lng}&cbp=12,${currentStop.streetViewPov?.heading || 0},0,0,0&output=embed`;
    }

    if (mapType === 'satellite') {
      return `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=${currentStop.zoom || 16}&ie=UTF8&iwloc=&output=embed`;
    }

    return `https://maps.google.com/maps?q=${lat},${lng}&t=m&z=${currentStop.zoom || 16}&ie=UTF8&iwloc=&output=embed`;
  };

  // QR Code URL for sharing/scanning this field trip
  const currentTripQrUrl = `${window.location.origin}${window.location.pathname}?fieldtrip=${activeTrip.id}`;

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isHighContrast ? 'bg-black text-white font-mono' : 'bg-[#faf8f5] text-slate-900'
    }`}>
      {/* Module Header Bar */}
      <header className={`border-b px-4 sm:px-6 py-3 sticky top-0 z-30 transition-colors ${
        isHighContrast ? 'bg-zinc-950 border-zinc-800' : 'bg-white/95 border-[#e5e1da] backdrop-blur-md shadow-2xs'
      }`}>
        <div className="max-w-7xl mx-auto space-y-3">
          
          {/* Top Row: Title, Route Selector, Stats & Quick Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Title, Badge & Route Selector */}
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl shrink-0 ${isHighContrast ? 'bg-white text-black' : 'bg-[#5f6f52]/10 text-[#5f6f52]'}`}>
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Virtual Field Trip & Excursion Studio
                  </span>
                  <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Streak: {studentProgress.streakCount || 1} Days</span>
                  </span>
                  
                  {/* Learning XP Student Profile Badge */}
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="text-xs text-amber-950 font-extrabold flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 border border-amber-400 shadow-2xs hover:scale-105 transition cursor-pointer"
                    title="Click to view Student XP Profile & Milestone Achievements"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-700 fill-amber-500 animate-pulse" />
                    <span>{studentProfile.totalXP} XP</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-amber-900/10 text-amber-900 border border-amber-400/30">
                      Lvl {studentProfile.level}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-serif font-bold text-slate-900 leading-tight">
                    {activeTrip.title}
                  </h1>

                  {/* Route Selector Dropdown */}
                  <select
                    value={activeTrip.id}
                    onChange={e => {
                      const selected = fieldTrips.find(t => t.id === e.target.value);
                      if (selected) handleSelectTrip(selected);
                    }}
                    className="px-3 py-1 text-xs font-bold bg-slate-50 border border-[#e5e1da] rounded-xl focus:ring-2 focus:ring-[#5f6f52] focus:outline-none cursor-pointer"
                    aria-label="Select Virtual Field Trip Route"
                  >
                    {fieldTrips.map(trip => (
                      <option key={trip.id} value={trip.id}>
                        {trip.country}: {trip.title} ({trip.stops.length} Stops)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Actions & Accessibility Group */}
            <div className="flex items-center gap-2 flex-wrap justify-start lg:justify-end">
              {/* Share Trip Button */}
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Share this Virtual Field Trip deep-link with students or educators"
              >
                <Share2 className="w-4 h-4 text-slate-950" />
                <span>Share Trip</span>
              </button>

              {/* Accessibility Quick Controls */}
              <button
                onClick={() => setUseDyslexicFont(!useDyslexicFont)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer flex items-center gap-1.5 focus:ring-2 focus:ring-[#5f6f52] focus:outline-none ${
                  useDyslexicFont ? 'bg-amber-200 text-amber-950 border-amber-400' : 'bg-white border-slate-200 text-slate-700'
                }`}
                title="Toggle Dyslexic-Friendly Typography"
              >
                <Type className="w-4 h-4" />
                <span className="hidden sm:inline">Dyslexic Font</span>
              </button>

              <button
                onClick={() => setIsHighContrast(!isHighContrast)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer flex items-center gap-1.5 focus:ring-2 focus:ring-[#5f6f52] focus:outline-none ${
                  isHighContrast ? 'bg-amber-400 text-black border-amber-500' : 'bg-white border-slate-200 text-slate-700'
                }`}
                title="Toggle High Contrast Theme"
              >
                {isHighContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sub-Header Toolbar: Grouped Tool Controls */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pt-1 border-t border-slate-200/80 scrollbar-none text-xs">
            {/* Group 1: Core Field Trip Tools */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider hidden sm:inline">Tools:</span>
              
              <button
                onClick={handleGenerateLessonPlan}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                title="Generate CBC-aligned Educator Lesson Plan"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-700" />
                <span>Lesson Plan</span>
              </button>

              <button
                onClick={() => handleOpenJournal()}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                title="Open Socratic Travel Journal (+150 XP)"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                <span>Socratic Journal</span>
              </button>

              <button
                onClick={handleOpenRateModal}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 border border-amber-300"
                title="Rate this Virtual Field Trip"
              >
                <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                <span>{studentProgress.tripRating ? `Rated ${studentProgress.tripRating.stars}★` : 'Rate'}</span>
              </button>
            </div>

            {/* Group 2: Live Tour & Class Sync Controls */}
            <div className="flex items-center gap-1.5 shrink-0 px-2 border-x border-slate-200">
              <button
                onClick={() => handleToggleTeacherLedMode(!isTeacherLedModeActive)}
                className={`px-3 py-1.5 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border ${
                  isTeacherLedModeActive
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                    : 'bg-indigo-900/90 hover:bg-indigo-950 text-indigo-100 border-indigo-700'
                }`}
                title="Toggle Teacher-Led Mode (Broadcast view to students)"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Teacher-Led Mode</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black ${
                  isTeacherLedModeActive ? 'bg-white text-rose-700' : 'bg-indigo-800 text-indigo-200'
                }`}>
                  {isTeacherLedModeActive ? 'LIVE' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => {
                  const nextState = !isAutoFollowActive;
                  setIsAutoFollowActive(nextState);
                  const msg = nextState
                    ? '✨ Auto-Follow Mode Activated! Camera will automatically pan to the next milestone on task completion.'
                    : '⏸️ Auto-Follow Mode Paused.';
                  setAutoFollowToast(msg);
                  setTimeout(() => setAutoFollowToast(null), 3500);
                }}
                className={`px-3 py-1.5 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border ${
                  isAutoFollowActive
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
                }`}
                title="Toggle Auto-Follow Camera Mode"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Auto-Follow</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black ${
                  isAutoFollowActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  {isAutoFollowActive ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* Group 3: Educator & Studio Features */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsBuilderOpen(true)}
                className="px-3 py-1.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>AI Trip Builder</span>
              </button>

              <button
                onClick={() => setIsQrModalOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                title="Generate Dynamic QR Code for Classroom Tabletop Scanner"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Dynamic QR</span>
              </button>

              {!isOnline ? (
                <div className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1 text-xs font-extrabold animate-pulse">
                  <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                  <span>Offline</span>
                </div>
              ) : (
                <button
                  onClick={handleCacheCurrentTrip}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                  title="Pre-load and cache excursion data for offline use"
                >
                  <HardDrive className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Pre-load Offline</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* ================= AI IMMERSIVE JOURNEY ECOSYSTEM FEATURE BAR ================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-500/30 text-white shadow-lg py-2 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-indigo-800">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 hidden md:inline">
              AI Immersive Journey
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-thin">
            {/* 1. Destination Discovery */}
            <button
              type="button"
              onClick={() => setIsDiscoveryModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              title="Explore 11 Educational Destination Categories (Parks, Space, Labs, Volcanoes...)"
            >
              <span>🌍 Discovery Hub</span>
            </button>

            {/* 2. Camera Intelligence */}
            <button
              type="button"
              onClick={() => setIsCameraIntelModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              title="AI Camera & Object Recognition (Identify plants, fossils, machines, animals...)"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Camera Intel</span>
            </button>

            {/* 3. Interactive Missions */}
            <button
              type="button"
              onClick={() => setIsMissionsModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              title="Complete Scavenger Challenges & Missions (+XP & Badges)"
            >
              <Flag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Missions ({activeMissions.filter(m => m.completed).length}/{activeMissions.length})</span>
            </button>

            {/* 4. AI Field Notebook */}
            <button
              type="button"
              onClick={() => setIsNotebookModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              title="Auto-compiled AI Trip Notebook, Flashcards, Mind Maps, and Quiz"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-300" />
              <span>AI Field Notebook</span>
            </button>

            {/* 5. Learning Analytics */}
            <button
              type="button"
              onClick={() => setIsAnalyticsModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              title="Student Participation & Competency Radar Analytics"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Analytics</span>
            </button>

            {/* 6. Parent Portal */}
            <button
              type="button"
              onClick={() => setIsParentPortalModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              title="Parent Digital Consent Slips & Live Photo Stream"
            >
              <GraduationCap className="w-3.5 h-3.5 text-rose-300" />
              <span>Parent Portal</span>
            </button>

            {/* 7. AI Story Generator */}
            <button
              type="button"
              onClick={() => setIsStoryModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              title="Generate Travel Journal, Photobook, Presentation, and Narrated Video Summary"
            >
              <FileText className="w-3.5 h-3.5 text-sky-300" />
              <span>AI Story Engine</span>
            </button>

            {/* 8. Eco & Sustainability */}
            <button
              type="button"
              onClick={() => setIsEcoModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              title="Log Biodiversity Index, Litter Collected, and Carbon Savings"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Eco & Carbon</span>
            </button>

            {/* 9. Emergency & Logistics */}
            <button
              type="button"
              onClick={() => setIsLogisticsModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              title="Attendance Roster, Medical Alerts, Emergency Contacts, Route Maps"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Logistics & Safety</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Offline / Cache Notification Banner */}
      {cacheNotification && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3">
          <div className="bg-emerald-800 text-white p-3 rounded-2xl shadow-lg border border-emerald-600 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <DownloadCloud className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>{cacheNotification}</span>
            </div>
            <button
              onClick={() => setCacheNotification(null)}
              className="text-white/80 hover:text-white p-1 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Teacher-Led Mode System Notice Toast */}
      {teacherLedNoticeToast && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3">
          <div className="bg-indigo-950 text-white p-3.5 rounded-2xl shadow-xl border border-indigo-500/60 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5 text-xs font-extrabold text-indigo-100">
              <Radio className="w-5 h-5 text-indigo-300 shrink-0 animate-pulse" />
              <span>{teacherLedNoticeToast}</span>
            </div>
            <button
              onClick={() => setTeacherLedNoticeToast(null)}
              className="text-indigo-200 hover:text-white p-1 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Auto-Follow Camera Transition System Notice Toast */}
      {autoFollowToast && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3">
          <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-slate-950 text-white p-3.5 rounded-2xl shadow-xl border border-amber-400/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5 text-xs font-extrabold text-amber-100">
              <Compass className="w-5 h-5 text-amber-400 shrink-0 animate-spin-slow" />
              <span>{autoFollowToast}</span>
            </div>
            <button
              onClick={() => setAutoFollowToast(null)}
              className="text-amber-200 hover:text-white p-1 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Teacher-Led Live Tour Control & Sync Banner Console */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 space-y-3">
        {isTeacherLedModeActive ? (
          <div className="bg-slate-900 border-2 border-indigo-500/80 rounded-2xl p-4 shadow-xl text-white space-y-3 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-indigo-800/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white uppercase tracking-wide">
                      Teacher-Led Live Tour Mode
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      Live Broadcast
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200/90 mt-0.5">
                    {userRolePerspective === 'teacher'
                      ? `You are hosting. Student viewports are locked & synchronized to Stop #${currentStop.stopNumber}: ${currentStop.locationName}.`
                      : `Student Mode Active • Navigation Locked to Teacher's Viewport at Stop #${syncedTeacherStopIndex + 1}: ${activeTrip.stops[syncedTeacherStopIndex]?.locationName || currentStop.locationName}.`}
                  </p>
                </div>
              </div>

              {/* Perspective Switcher & Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-slate-950 p-1 rounded-xl border border-indigo-800 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setUserRolePerspective('teacher')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      userRolePerspective === 'teacher'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Host View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRolePerspective('student')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      userRolePerspective === 'student'
                        ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Student View</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleTeacherLedMode(false)}
                  className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                  title="End Teacher-Led Mode Session"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>End Live Tour</span>
                </button>
              </div>
            </div>

            {/* Host Control Options (Visible in Teacher Role) */}
            {userRolePerspective === 'teacher' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                <div className="md:col-span-6 bg-slate-950/80 p-3 rounded-xl border border-indigo-900/60 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-indigo-300">
                    <span className="flex items-center gap-1.5">
                      <Cast className="w-4 h-4 text-amber-400" />
                      <span>Broadcast Milestone Location</span>
                    </span>
                    <span className="text-[10px] font-mono bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800 text-indigo-200">
                      Stop #{currentStopIndex + 1} of {activeTrip.stops.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentStopIndex === 0}
                      onClick={() => handleSmartJumpToStop(Math.max(0, currentStopIndex - 1))}
                      className="flex-1 py-2 px-3 bg-indigo-950 hover:bg-indigo-900 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition border border-indigo-800 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev Milestone</span>
                    </button>

                    <button
                      type="button"
                      disabled={currentStopIndex >= activeTrip.stops.length - 1}
                      onClick={() => handleSmartJumpToStop(Math.min(activeTrip.stops.length - 1, currentStopIndex + 1))}
                      className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 rounded-lg text-xs font-extrabold transition border border-amber-400 cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span>Next Milestone</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleSendSpotlightAnnouncement}
                  className="md:col-span-6 bg-slate-950/80 p-3 rounded-xl border border-indigo-900/60 flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between text-xs font-extrabold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Megaphone className="w-4 h-4 text-amber-400" />
                      <span>Live Spotlight Announcement</span>
                    </span>
                    {activeSpotlightBanner && (
                      <button
                        type="button"
                        onClick={handleClearSpotlightAnnouncement}
                        className="text-[10px] text-rose-300 hover:text-white underline cursor-pointer"
                      >
                        Clear Note
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={spotlightAnnouncement}
                      onChange={(e) => setSpotlightAnnouncement(e.target.value)}
                      placeholder="e.g. Everyone look closely at the central dome!"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-lg transition cursor-pointer shrink-0"
                    >
                      Broadcast
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Student View Notification Lock Badge */}
            {userRolePerspective === 'student' && (
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between gap-3 text-amber-200">
                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Student Navigation Locked: Synchronized to Teacher's active location: <strong className="text-white">Stop #{syncedTeacherStopIndex + 1}: {activeTrip.stops[syncedTeacherStopIndex]?.locationName || currentStop.locationName}</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (syncedTeacherStopIndex >= 0 && syncedTeacherStopIndex < activeTrip.stops.length) {
                      setCurrentStopIndex(syncedTeacherStopIndex);
                      setTeacherLedNoticeToast('🔄 Re-synchronized to Teacher\'s view!');
                      setTimeout(() => setTeacherLedNoticeToast(null), 3000);
                    }
                  }}
                  className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg transition cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync View</span>
                </button>
              </div>
            )}

            {/* Broadcasted Teacher Spotlight Announcement Banner */}
            {activeSpotlightBanner && (
              <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/60 rounded-xl p-3 flex items-center gap-3 text-amber-100 shadow-lg animate-in fade-in slide-in-from-top-1">
                <Megaphone className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                <div className="flex-1">
                  <span className="text-[10px] uppercase font-mono font-black text-amber-300 tracking-wider">
                    Teacher Spotlight Announcement:
                  </span>
                  <p className="text-xs font-bold text-white mt-0.5">
                    "{activeSpotlightBanner}"
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-indigo-200">
                  Teacher-Led Synchronized Mode
                </span>
                <p className="text-[11px] text-slate-400">
                  Host a live class virtual field trip where student viewports synchronize to your current milestone and map location in real time.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggleTeacherLedMode(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <Radio className="w-3.5 h-3.5 text-indigo-200" />
              <span>Start Teacher-Led Session</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Split-Pane Workspace (60/40 Split on Desktop, Stacked on Mobile) */}
      <main className="max-w-7xl mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ================= LEFT PANE: Interactive Map & Media Explorer (7 cols = ~60% on desktop) ================= */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          
          <div className={`rounded-3xl border shadow-lg overflow-hidden flex flex-col h-[580px] sm:h-[680px] transition-colors relative ${
            isHighContrast ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-[#e5e1da]'
          }`}>
            
            {/* Viewer Mode Toolbar Header */}
            <div className="bg-slate-900 text-white p-3 flex items-center justify-between gap-2 flex-wrap shrink-0">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400 animate-bounce" />
                <span className="text-xs font-bold font-mono text-amber-300 truncate max-w-[200px] sm:max-w-none">
                  Stop #{currentStop.stopNumber}: {currentStop.locationName}
                </span>
              </div>

              {/* Annotation Overlay Controls & Smart Jump & Viewer Type Tab Controls */}
              <div className="flex items-center gap-2 flex-wrap relative">
                {/* Annotation & Smart Jump Action Buttons */}
                <div className="flex items-center gap-1.5 border-r border-white/15 pr-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSmartJumpMenuOpen(!isSmartJumpMenuOpen);
                      setIsAnnotateModeActive(false);
                    }}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 focus:ring-2 focus:ring-amber-400 border ${
                      isSmartJumpMenuOpen
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                        : 'bg-amber-500/20 text-amber-300 border-amber-400/50 hover:bg-amber-500/30'
                    }`}
                    title="Smart Jump to any future or past milestone stop"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                    <span>Smart Jump</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px] font-mono font-bold">
                      {currentStopIndex + 1}/{activeTrip.stops.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAnnotateModeActive(!isAnnotateModeActive);
                      setSelectedAnnotation(null);
                      setIsSmartJumpMenuOpen(false);
                    }}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 focus:ring-2 focus:ring-amber-400 border ${
                      isAnnotateModeActive
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md animate-pulse'
                        : 'bg-white/10 text-amber-300 border-amber-400/30 hover:bg-white/20'
                    }`}
                    title={isAnnotateModeActive ? 'Click anywhere on map/view to drop pin' : 'Activate Pin Point & Annotate Mode'}
                  >
                    <PenTool className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAnnotateModeActive ? 'Pinning Mode' : 'Annotate View'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAnnotationDrawerOpen(!isAnnotationDrawerOpen)}
                    className="min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 bg-white/10 text-white hover:bg-white/20 border border-white/10"
                    title="View all pinned educational notes for this location"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Pins</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold">
                      {currentStop.annotations?.length || 0}
                    </span>
                  </button>
                </div>

                {/* Smart Jump Milestone Dropdown Popover */}
                <AnimatePresence>
                  {isSmartJumpMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-12 left-0 z-50 w-80 bg-slate-950/95 border border-amber-400/60 rounded-2xl p-3 shadow-2xl backdrop-blur-xl text-white space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span>Smart Jump Milestones</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsSmartJumpMenuOpen(false)}
                          className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-snug">
                        Click any milestone below to jump directly to its map view, educational notes, and Socratic guided prompts!
                      </p>

                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                        {activeTrip.stops.map((stop, idx) => {
                          const isCurrent = idx === currentStopIndex;
                          const isFuture = idx > currentStopIndex;
                          const isPast = idx < currentStopIndex;

                          return (
                            <button
                              key={`smart-jump-item-${stop.stopNumber}-${idx}`}
                              type="button"
                              onClick={() => {
                                handleSmartJumpToStop(idx);
                                setIsSmartJumpMenuOpen(false);
                              }}
                              className={`w-full text-left p-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-between gap-2 border ${
                                isCurrent
                                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-md'
                                  : isFuture
                                  ? 'bg-slate-900/90 text-amber-200 border-amber-400/40 hover:bg-amber-400 hover:text-slate-950 font-semibold'
                                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-sm shrink-0">
                                  {isCurrent ? '🎯' : isFuture ? '🚀' : '✅'}
                                </span>
                                <div className="truncate">
                                  <div className="font-bold truncate">Stop #{stop.stopNumber}: {stop.locationName}</div>
                                  <div className="text-[10px] opacity-80 truncate">{stop.title}</div>
                                </div>
                              </div>
                              <span className={`text-[10px] uppercase font-mono shrink-0 px-2 py-0.5 rounded-md font-extrabold ${
                                isCurrent
                                  ? 'bg-slate-950 text-amber-400'
                                  : isFuture
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                  : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                              }`}>
                                {isCurrent ? 'Active' : isFuture ? 'Smart Jump' : 'Revisit'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                  <button
                    onClick={() => { setActiveViewerTab('map'); setMapType('satellite'); }}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 focus:ring-2 focus:ring-amber-400 ${
                      activeViewerTab === 'map' && mapType === 'satellite' ? 'bg-amber-400 text-slate-950' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Satellite</span>
                  </button>

                  <button
                    onClick={() => { setActiveViewerTab('map'); setMapType('roadmap'); }}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 focus:ring-2 focus:ring-amber-400 ${
                      activeViewerTab === 'map' && mapType === 'roadmap' ? 'bg-amber-400 text-slate-950' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Roadmap</span>
                  </button>

                  <button
                    onClick={() => setActiveViewerTab('streetview')}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 focus:ring-2 focus:ring-amber-400 ${
                      activeViewerTab === 'streetview' ? 'bg-amber-400 text-slate-950' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Street View</span>
                  </button>

                  <button
                    onClick={() => setActiveViewerTab('video')}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 focus:ring-2 focus:ring-amber-400 ${
                      activeViewerTab === 'video' ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm' : 'text-white/80 hover:text-white'
                    }`}
                    title="Watch 4K NatGeo Documentary and Virtual Video Tours for this location"
                  >
                    <Video className="w-3.5 h-3.5 text-rose-400" />
                    <span>Video / NatGeo</span>
                  </button>

                  {/* Real-World AR Camera View Launch Button */}
                  <button
                    type="button"
                    onClick={handleOpenCameraARView}
                    className="min-h-[34px] px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 shadow-md focus:ring-2 focus:ring-amber-300 transform hover:scale-105"
                    title="Launch Live Camera AR View to overlay contextual landmark labels onto physical classroom surroundings"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-950" />
                    <span>Camera View</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[9px] font-mono font-extrabold animate-pulse">
                      AR
                    </span>
                  </button>

                  {/* Real-Time Collaborative Sticky Notes Layer Toggle & Drop Buttons */}
                  <button
                    type="button"
                    onClick={() => setIsStickyNotesLayerActive(!isStickyNotesLayerActive)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 focus:ring-2 focus:ring-amber-400 ${
                      isStickyNotesLayerActive ? 'bg-indigo-500 text-white font-extrabold shadow-sm' : 'text-white/80 hover:text-white bg-white/5'
                    }`}
                    title="Toggle Real-Time Collaborative Digital Sticky Notes Layer"
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sticky Layer</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-indigo-300 text-[10px] font-mono">
                      {stopStickyNotes.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDropNoteModeActive(!isDropNoteModeActive)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 focus:ring-2 focus:ring-amber-400 ${
                      isDropNoteModeActive ? 'bg-amber-400 text-slate-950 animate-pulse' : 'text-indigo-200 hover:text-white bg-indigo-950/80 border border-indigo-500/40'
                    }`}
                    title="Click anywhere on the map or stage view to drop a digital sticky note for all participants"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Drop Note</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsStickyNotesDrawerOpen(!isStickyNotesDrawerOpen)}
                    className="min-h-[34px] px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 text-indigo-200 hover:text-white bg-white/10"
                    title="View All Class Collaborative Sticky Notes Stream"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Map / Google Maps SDK / Embed Canvas Stage */}
            <div
              ref={stageContainerRef}
              onClick={handleStageContainerClick}
              className="flex-1 w-full h-full relative bg-slate-900 overflow-hidden"
            >
              {/* Floating 30-Second Landmark Audio Description Player Banner */}
              {activeLandmarkAudio && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] bg-slate-950/95 text-white border border-amber-400/80 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl shrink-0 flex items-center justify-center">
                      <Volume2 className="w-5 h-5 animate-pulse text-slate-950" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          🎙️ 30s Audio Guide
                        </span>
                        {activeLandmarkAudio.autoPlayed && (
                          <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.2 rounded-full">
                            Auto-Played on Milestone Arrival
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-extrabold text-white truncate">{activeLandmarkAudio.title}</h4>
                      <p className="text-[11px] text-slate-300 truncate font-mono">By {activeLandmarkAudio.authorName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handlePlayLandmarkAudio(
                          activeLandmarkAudio.pinId,
                          activeLandmarkAudio.title,
                          activeLandmarkAudio.authorName,
                          activeLandmarkAudio.audioText,
                          activeLandmarkAudio.audioUrl
                        )
                      }
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shadow-md"
                    >
                      {activeLandmarkAudio.isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      <span>{activeLandmarkAudio.isPlaying ? 'Pause' : 'Play'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStopLandmarkAudio}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                      title="Close Audio Player"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Active Annotate Mode Click Overlay */}
              {isAnnotateModeActive && (
                <div
                  onClick={handleViewerCanvasClick}
                  className="absolute inset-0 z-30 cursor-crosshair bg-amber-500/15 border-4 border-dashed border-amber-400 flex items-center justify-center p-4 transition-all pointer-events-auto"
                >
                  <div className="bg-slate-950/90 text-amber-300 font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-amber-400/60 flex items-center gap-2 animate-bounce pointer-events-none">
                    <PenTool className="w-4 h-4 text-amber-400" />
                    <span>Click anywhere on the map/view to pin an educational note or media!</span>
                  </div>
                </div>
              )}

              {/* Pinned Educational Annotations Overlay */}
              {currentStop.annotations && currentStop.annotations.length > 0 && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {currentStop.annotations.map(pin => {
                    const isSelected = selectedAnnotation?.id === pin.id;
                    const categoryIcon = getCategoryIcon(pin.category);

                    return (
                      <div
                        key={pin.id}
                        style={{ left: `${pin.xPercentage}%`, top: `${pin.yPercentage}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group"
                      >
                        {/* Pin Badge */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedAnnotation(selectedAnnotation?.id === pin.id ? null : pin);
                          }}
                          className={`relative flex items-center gap-1 px-2.5 py-1 rounded-full shadow-2xl transition-all transform hover:scale-110 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-300/80 z-30 scale-110 font-extrabold'
                              : 'bg-slate-900/95 text-amber-300 border border-amber-400/60 hover:bg-amber-500 hover:text-slate-950 font-bold'
                          }`}
                        >
                          <span className="text-xs">{categoryIcon}</span>
                          <span className="text-[11px] max-w-[90px] sm:max-w-[120px] truncate">{pin.title}</span>
                          {pin.audioDescriptionText && (
                            <Volume2 className="w-3 h-3 text-amber-400 animate-pulse shrink-0 ml-0.5" />
                          )}
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
                        </button>

                        {/* Interactive Annotation Detail Popover Tooltip */}
                        {isSelected && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 bg-slate-900/95 text-white border border-amber-400/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-40 text-xs space-y-2 animate-in zoom-in-95 pointer-events-auto">
                            <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
                              <div>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                  {categoryIcon} {getCategoryLabel(pin.category)}
                                </span>
                                <h4 className="font-bold text-sm text-white mt-1">{pin.title}</h4>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedAnnotation(null)}
                                className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <p className="text-slate-200 text-xs font-medium leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
                              {pin.note}
                            </p>

                            {/* 30-Second Landmark Audio Description Button */}
                            {(pin.audioDescriptionText || pin.note) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handlePlayLandmarkAudio(
                                    pin.id,
                                    pin.title,
                                    pin.authorName || 'Educator',
                                    pin.audioDescriptionText || pin.note,
                                    pin.audioDescriptionUrl
                                  )
                                }
                                className="w-full px-3 py-2 bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 border border-amber-400/40 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 min-h-[38px]"
                              >
                                <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                                <span>
                                  {activeLandmarkAudio?.pinId === pin.id && activeLandmarkAudio.isPlaying
                                    ? 'Pause 30s Audio Guide'
                                    : 'Listen to 30s Audio Guide'}
                                </span>
                              </button>
                            )}

                            {pin.mediaUrl && (
                              <div className="p-2 bg-slate-950/80 rounded-xl border border-amber-500/20 space-y-1">
                                <span className="text-[10px] font-extrabold uppercase text-amber-300 flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3 text-amber-400" /> Contextual Media / Link
                                </span>
                                {pin.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                  <img
                                    src={pin.mediaUrl}
                                    alt={pin.title}
                                    className="w-full h-28 object-cover rounded-lg border border-white/10"
                                  />
                                ) : (
                                  <a
                                    href={pin.mediaUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-amber-300 hover:underline text-[11px] font-bold flex items-center gap-1 truncate"
                                  >
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{pin.mediaUrl}</span>
                                  </a>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-1 border-t border-white/10">
                              <span>By {pin.authorName || 'Educator'} • {pin.createdAt || 'Today'}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditAnnotation(pin)}
                                  className="p-1 hover:text-amber-300 rounded text-slate-300 transition cursor-pointer"
                                  title="Edit Pin"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAnnotation(pin.id)}
                                  className="p-1 hover:text-rose-400 rounded text-slate-300 transition cursor-pointer"
                                  title="Delete Pin"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Annotations List Drawer / Side Panel Overlay */}
              <AnimatePresence>
                {isAnnotationDrawerOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute inset-y-0 left-0 z-30 w-full sm:w-80 bg-slate-950/95 backdrop-blur-xl border-r border-amber-500/30 text-white p-4 flex flex-col shadow-2xl"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-400 text-slate-950 rounded-xl">
                          <PenTool className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">Pinned Annotations</h3>
                          <p className="text-[11px] text-amber-300 font-mono">
                            Stop #{currentStop.stopNumber} ({currentStop.annotations?.length || 0} pins)
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAnnotationDrawerOpen(false)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="pt-3 pb-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAnnotationDrawerOpen(false);
                          setIsAnnotateModeActive(true);
                        }}
                        className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Pin New Educational Note on Map</span>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {(!currentStop.annotations || currentStop.annotations.length === 0) ? (
                        <div className="p-6 text-center text-slate-400 text-xs space-y-2 my-auto">
                          <PenTool className="w-8 h-8 text-slate-600 mx-auto animate-bounce" />
                          <p className="font-bold text-slate-300">No Pinned Annotations Yet</p>
                          <p className="text-[11px] leading-relaxed">
                            Click "Annotate View" or the button above to drop interactive pins on specific locations!
                          </p>
                        </div>
                      ) : (
                        currentStop.annotations.map(pin => (
                          <div
                            key={pin.id}
                            className="p-3 bg-white/5 border border-white/10 hover:border-amber-400/40 rounded-xl space-y-1.5 transition text-xs"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 truncate">
                                {getCategoryIcon(pin.category)} {getCategoryLabel(pin.category)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">({pin.xPercentage}%, {pin.yPercentage}%)</span>
                            </div>

                            <h4 className="font-bold text-white text-xs">{pin.title}</h4>
                            <p className="text-slate-300 text-[11px] line-clamp-2 leading-relaxed">{pin.note}</p>

                            {(pin.audioDescriptionText || pin.note) && (
                              <div className="pt-1 flex items-center justify-between border-t border-white/5">
                                <span className="text-[10px] font-extrabold text-amber-300 flex items-center gap-1">
                                  <Volume2 className="w-3 h-3 text-amber-400" />
                                  <span>30s Audio Attached {pin.autoPlayOnArrive !== false && '(Auto-Play)'}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePlayLandmarkAudio(
                                      pin.id,
                                      pin.title,
                                      pin.authorName || 'Educator',
                                      pin.audioDescriptionText || pin.note,
                                      pin.audioDescriptionUrl
                                    )
                                  }
                                  className="px-2 py-0.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded text-[10px] font-bold transition cursor-pointer"
                                >
                                  {activeLandmarkAudio?.pinId === pin.id && activeLandmarkAudio.isPlaying ? 'Pause' : 'Listen'}
                                </button>
                              </div>
                            )}

                            <div className="pt-1.5 flex items-center justify-between border-t border-white/10 text-[10px]">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAnnotation(pin);
                                  setIsAnnotationDrawerOpen(false);
                                }}
                                className="text-amber-300 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <MapPin className="w-3 h-3" /> Focus Pin
                              </button>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditAnnotation(pin)}
                                  className="text-slate-300 hover:text-white cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAnnotation(pin.id)}
                                  className="text-rose-400 hover:text-rose-300 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active Drop Sticky Note Click Overlay Mode */}
              {isDropNoteModeActive && (
                <div className="absolute inset-0 z-30 cursor-crosshair bg-indigo-500/20 border-4 border-dashed border-indigo-400 flex items-center justify-center p-4 transition-all pointer-events-auto">
                  <div className="bg-slate-950/90 text-indigo-300 font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-indigo-400/60 flex items-center gap-2 animate-bounce pointer-events-none">
                    <StickyNote className="w-4 h-4 text-amber-300" />
                    <span>🎯 Click anywhere on the map or stage to drop a digital sticky note!</span>
                  </div>
                </div>
              )}

              {/* Real-Time Sticky Note Toast Notification Banner */}
              <AnimatePresence>
                {stickyNoteToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-indigo-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-2xl border border-indigo-400 flex items-center gap-2 backdrop-blur-md max-w-[90%]"
                  >
                    <StickyNote className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="truncate">{stickyNoteToast}</span>
                    <button
                      type="button"
                      onClick={() => setStickyNoteToast(null)}
                      className="ml-2 text-indigo-200 hover:text-white p-0.5 rounded cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pinned Real-Time Collaborative Sticky Notes Overlay Layer */}
              {isStickyNotesLayerActive && stopStickyNotes.length > 0 && (
                <div className="absolute inset-0 z-25 pointer-events-none">
                  {stopStickyNotes.map((note) => {
                    const isSelected = selectedStickyNote?.id === note.id;
                    const isAuthorTeacher = note.authorRole === 'Teacher';

                    const getColorClasses = (c: FieldTripStickyNote['color']) => {
                      switch (c) {
                        case 'yellow': return 'bg-amber-100/95 text-amber-950 border-amber-300 shadow-amber-200/50';
                        case 'blue': return 'bg-sky-100/95 text-sky-950 border-sky-300 shadow-sky-200/50';
                        case 'green': return 'bg-emerald-100/95 text-emerald-950 border-emerald-300 shadow-emerald-200/50';
                        case 'pink': return 'bg-rose-100/95 text-rose-950 border-rose-300 shadow-rose-200/50';
                        case 'purple': return 'bg-purple-100/95 text-purple-950 border-purple-300 shadow-purple-200/50';
                        case 'amber': return 'bg-orange-100/95 text-orange-950 border-orange-300 shadow-orange-200/50';
                        default: return 'bg-amber-100/95 text-amber-950 border-amber-300';
                      }
                    };

                    const getCategoryBadge = (cat: FieldTripStickyNote['category']) => {
                      switch (cat) {
                        case 'question': return '❓ Question';
                        case 'insight': return '💡 Insight';
                        case 'discovery': return '🔍 Discovery';
                        case 'flag': return '🚩 Flag';
                        default: return '📝 Note';
                      }
                    };

                    return (
                      <div
                        key={`sticky-note-pin-${note.id}`}
                        style={{ left: `${note.xPercentage}%`, top: `${note.yPercentage}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group z-20"
                      >
                        {/* Sticky Note Pin Head Card */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStickyNote(isSelected ? null : note);
                          }}
                          className={`cursor-pointer p-2.5 rounded-2xl border-2 shadow-2xl transition-all transform hover:scale-105 ${getColorClasses(note.color)} ${
                            isSelected ? 'ring-4 ring-indigo-500 scale-110 z-30' : ''
                          } max-w-[150px] sm:max-w-[200px]`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-extrabold pb-1 border-b border-black/10 gap-1">
                            <span className="flex items-center gap-1 truncate">
                              <span>📌</span>
                              <span className="truncate">{note.authorName}</span>
                            </span>
                            <span className="text-[9px] px-1 rounded bg-black/10 shrink-0 font-bold">
                              {isAuthorTeacher ? '👨‍🏫' : '🎓'}
                            </span>
                          </div>

                          <p className="text-[11px] font-bold mt-1.5 leading-snug line-clamp-3">
                            {note.text}
                          </p>

                          <div className="mt-2 pt-1 border-t border-black/10 flex items-center justify-between text-[9px]">
                            <span className="font-extrabold opacity-80">{getCategoryBadge(note.category)}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLikeStickyNote(note);
                              }}
                              className="hover:scale-125 transition text-rose-600 font-extrabold flex items-center gap-0.5 cursor-pointer bg-white/60 px-1.5 py-0.5 rounded-full border border-black/10"
                              title="Helpful / Like Sticky Note"
                            >
                              <span>❤️</span>
                              <span>{note.likesCount || 0}</span>
                            </button>
                          </div>
                        </div>

                        {/* Expanded Detail Modal / Popover when Clicked */}
                        {isSelected && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 bg-slate-900 text-white border border-indigo-400/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-40 text-xs space-y-2.5 animate-in zoom-in-95 pointer-events-auto">
                            <div className="flex items-start justify-between border-b border-white/10 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📌</span>
                                <div>
                                  <h4 className="font-extrabold text-white text-xs">{note.authorName}</h4>
                                  <span className="text-[10px] text-indigo-300 font-medium">
                                    {note.authorRole} • Stop #{note.stopNumber}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedStickyNote(null)}
                                className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-[10px]">
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-400/30">
                                {getCategoryBadge(note.category)}
                              </span>
                              <span className="text-slate-400 font-mono">
                                ({note.xPercentage}% X, {note.yPercentage}% Y)
                              </span>
                            </div>

                            <p className="text-slate-100 text-xs font-medium leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10 whitespace-pre-wrap">
                              {note.text}
                            </p>

                            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleToggleLikeStickyNote(note)}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 border border-rose-500/30"
                              >
                                <span>❤️ Helpful</span>
                                <span>({note.likesCount || 0})</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteStickyNote(note.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold text-[11px] transition cursor-pointer flex items-center gap-1 border border-rose-500/40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Class Collaborative Sticky Notes Stream Drawer */}
              <AnimatePresence>
                {isStickyNotesDrawerOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute inset-y-0 right-0 z-30 w-full sm:w-80 bg-slate-950/95 backdrop-blur-xl border-l border-indigo-500/30 text-white p-4 flex flex-col shadow-2xl"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-500 text-white rounded-xl">
                          <StickyNote className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">Collaborative Note Stream</h3>
                          <p className="text-[11px] text-indigo-300 font-mono">
                            Real-Time Class Sticky Notes ({stickyNotes.length})
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsStickyNotesDrawerOpen(false)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Category Filters in Drawer */}
                    <div className="flex items-center gap-1 overflow-x-auto py-2.5 border-b border-white/10 shrink-0 text-[10px]">
                      {(['all', 'question', 'insight', 'discovery', 'flag'] as const).map((cat) => (
                        <button
                          key={`filter-${cat}`}
                          type="button"
                          onClick={() => setStickyCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-lg font-extrabold capitalize transition cursor-pointer shrink-0 ${
                            stickyCategoryFilter === cat
                              ? 'bg-indigo-500 text-white'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 pb-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsStickyNotesDrawerOpen(false);
                          setIsDropNoteModeActive(true);
                        }}
                        className="w-full py-2 px-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Drop Sticky Note on Current View</span>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {stopStickyNotes.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs space-y-2 my-auto">
                          <StickyNote className="w-8 h-8 text-indigo-400 mx-auto animate-pulse" />
                          <p className="font-bold text-slate-300">No Sticky Notes Dropped Yet</p>
                          <p className="text-[11px] leading-relaxed">
                            Click "Drop Note" to post questions, insights, or observations on map coordinates!
                          </p>
                        </div>
                      ) : (
                        stopStickyNotes.map((note) => (
                          <div
                            key={`drawer-note-${note.id}`}
                            className="p-3 bg-white/5 border border-white/10 hover:border-indigo-400/40 rounded-xl space-y-2 transition text-xs"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 truncate">
                                📌 {note.authorName} ({note.authorRole})
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Stop #{note.stopNumber}
                              </span>
                            </div>

                            <p className="text-slate-200 text-[11px] leading-relaxed bg-black/20 p-2 rounded-lg">
                              {note.text}
                            </p>

                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/10">
                              <button
                                type="button"
                                onClick={() => handleToggleLikeStickyNote(note)}
                                className="text-rose-400 hover:text-rose-300 font-extrabold flex items-center gap-1 cursor-pointer"
                              >
                                <span>❤️</span>
                                <span>{note.likesCount || 0} Likes</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStickyNote(note);
                                  setIsStickyNotesDrawerOpen(false);
                                }}
                                className="text-indigo-300 hover:underline font-bold"
                              >
                                Focus Note
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Floating Ambient Background Audio Overlay Bar */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                <div className="bg-slate-950/85 text-white p-2 sm:px-3 sm:py-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-2.5 text-xs">
                  
                  {/* Play / Pause Toggle Button */}
                  <button
                    type="button"
                    onClick={handleToggleAmbientAudio}
                    className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 ${
                      isAmbientPlaying ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md' : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                    title={isAmbientPlaying ? 'Pause ambient background soundscape' : 'Play location ambient background soundscape'}
                  >
                    {isAmbientPlaying ? <Volume2 className="w-4 h-4 text-slate-950" /> : <VolumeX className="w-4 h-4 text-slate-300" />}
                  </button>

                  {/* Soundscape Status & Equalizer Animation */}
                  <div className="hidden sm:flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-amber-300 tracking-wider">
                        {AMBIENT_PRESETS[ambientPreset].label}
                      </span>
                      {isAmbientPlaying && (
                        <span className="flex items-center gap-0.5">
                          <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1 h-2 bg-amber-300 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1 h-3.5 bg-amber-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-300 truncate max-w-[180px]">
                      {AMBIENT_PRESETS[ambientPreset].description}
                    </span>
                  </div>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-1.5 border-l border-white/15 pl-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={ambientVolume}
                      onChange={e => handleAmbientVolumeChange(parseFloat(e.target.value))}
                      className="w-14 sm:w-20 accent-amber-400 cursor-pointer h-1.5 rounded-lg bg-slate-700"
                      title={`Ambient Volume: ${Math.round(ambientVolume * 100)}%`}
                    />
                    <span className="text-[10px] font-mono text-amber-300 w-7 text-right">
                      {Math.round(ambientVolume * 100)}%
                    </span>
                  </div>

                  {/* Expandable Soundscape Presets Button */}
                  <button
                    type="button"
                    onClick={() => setIsAmbientPopoverOpen(!isAmbientPopoverOpen)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition cursor-pointer text-[11px] font-bold border border-white/10"
                    title="Change location ambient soundscape preset"
                  >
                    ⚙️
                  </button>
                </div>

                {/* Soundscape Preset Selection Popover Dropdown */}
                {isAmbientPopoverOpen && (
                  <div className="absolute top-12 right-0 z-20 w-72 bg-slate-900 border border-amber-500/30 rounded-2xl p-3 shadow-2xl backdrop-blur-xl text-white space-y-2 animate-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-amber-400" />
                        <span>Location Ambient Presets</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAmbientPopoverOpen(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                      {(Object.keys(AMBIENT_PRESETS) as AmbientPresetKey[]).map(key => {
                        const preset = AMBIENT_PRESETS[key];
                        const isSelected = ambientPreset === key;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectAmbientPreset(key)}
                            className={`w-full text-left p-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-between gap-2 border ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                                : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-300'
                            }`}
                          >
                            <div>
                              <span className="font-extrabold block text-white">{preset.label}</span>
                              <span className="text-[10px] text-slate-400 block leading-tight">{preset.description}</span>
                            </div>
                            {isSelected && <span className="text-amber-400 font-bold text-sm">✓</span>}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <span>Auto-detects per location stop</span>
                      <button
                        type="button"
                        onClick={() => {
                          const detected = detectAmbientPreset(activeTrip, currentStop);
                          handleSelectAmbientPreset(detected);
                        }}
                        className="text-amber-300 hover:underline cursor-pointer"
                      >
                        Reset Auto
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Smart Jump Toast Notification Banner */}
              <AnimatePresence>
                {smartJumpToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-amber-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-2 backdrop-blur-md max-w-[90%]"
                  >
                    <Zap className="w-4 h-4 text-slate-950 fill-slate-950 shrink-0 animate-bounce" />
                    <span className="truncate">{smartJumpToast}</span>
                    <button
                      type="button"
                      onClick={() => setSmartJumpToast(null)}
                      className="ml-2 text-slate-950 hover:text-slate-800 p-0.5 rounded cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {activeViewerTab === 'video' ? (
                /* NatGeo 4K Video Tour & Science Expedition Player Stage */
                <MainStageVideoPlayer currentStop={currentStop} />
              ) : GOOGLE_MAPS_API_KEY && activeViewerTab === 'map' ? (
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
                  <Map
                    center={{ lat: currentStop.lat, lng: currentStop.lng }}
                    zoom={currentStop.zoom || 17}
                    mapTypeId={mapType}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                  >
                    {activeTrip.stops.map((stop, idx) => (
                      <AdvancedMarker
                        key={`stop-marker-${idx}`}
                        position={{ lat: stop.lat, lng: stop.lng }}
                        onClick={() => handleSmartJumpToStop(idx)}
                      >
                        <Pin
                          background={idx === currentStopIndex ? '#f59e0b' : '#5f6f52'}
                          borderColor="#ffffff"
                          glyphColor="#ffffff"
                          glyphText={(idx + 1).toString()}
                        />
                      </AdvancedMarker>
                    ))}
                  </Map>
                </APIProvider>
              ) : (
                /* Native Interactive Embed Viewer */
                <iframe
                  title={`Google Maps Virtual Tour - ${currentStop.locationName}`}
                  src={getMapIframeUrl()}
                  className="w-full h-full border-none"
                  loading="lazy"
                  allowFullScreen
                />
              )}

              {/* Floating Map Navigation Badge */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 text-white p-3 rounded-2xl backdrop-blur-md border border-white/20 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium truncate">{currentStop.navigationInstruction}</span>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${currentStop.lat},${currentStop.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[36px] px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <span>Open Full Map</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Stop Navigation Timeline Slider */}
            <div className="bg-slate-100 border-t border-slate-200 p-3 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
              <button
                disabled={currentStopIndex === 0}
                onClick={() => handleSmartJumpToStop(Math.max(0, currentStopIndex - 1))}
                className="min-h-[44px] min-w-[44px] p-2 bg-white hover:bg-slate-200 disabled:opacity-40 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 border border-slate-300 shrink-0 focus:ring-2 focus:ring-[#5f6f52] focus:outline-none"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev Stop</span>
              </button>

              <div className="flex items-center gap-2 overflow-x-auto px-2">
                {activeTrip.stops.map((stop, idx) => (
                  <button
                    key={`stop-btn-${idx}`}
                    onClick={() => handleSmartJumpToStop(idx)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border shrink-0 flex items-center gap-1.5 focus:ring-2 focus:ring-[#5f6f52] focus:outline-none ${
                      idx === currentStopIndex
                        ? 'bg-[#5f6f52] text-white border-[#5f6f52] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>Stop #{stop.stopNumber}</span>
                  </button>
                ))}
              </div>

              <button
                disabled={currentStopIndex === activeTrip.stops.length - 1}
                onClick={() => handleSmartJumpToStop(Math.min(activeTrip.stops.length - 1, currentStopIndex + 1))}
                className="min-h-[44px] min-w-[44px] p-2 bg-white hover:bg-slate-200 disabled:opacity-40 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 border border-slate-300 shrink-0 focus:ring-2 focus:ring-[#5f6f52] focus:outline-none"
              >
                <span className="hidden sm:inline">Next Stop</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Socratic Local Tour Guide AI Sidebar / Bottom Panel */}
          <div id="socratic-guide-section" className={`rounded-3xl border p-5 shadow-sm space-y-4 transition-colors ${
            isHighContrast ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-[#e5e1da]'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Socratic Local Tour Guide</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Text & Voice-guided map observation</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const lastGuideIdx = socraticChat.reduce((last, m, idx) => (m.sender === 'guide' ? idx : last), -1);
                    if (lastGuideIdx !== -1) {
                      handleReadGuideMessage(socraticChat[lastGuideIdx].text, lastGuideIdx);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer border flex items-center gap-1.5 focus:outline-none ${
                    speakingGuideMsgIndex !== null
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                  }`}
                  title={speakingGuideMsgIndex !== null ? "Stop Voice Playback" : "Read Aloud Latest Tour Guide Message"}
                >
                  {speakingGuideMsgIndex !== null ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-700" />}
                  <span>{speakingGuideMsgIndex !== null ? 'Stop Voice' : 'Read Aloud'}</span>
                </button>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hidden sm:inline">
                  💬 Text & 🎙️ Voice
                </span>
              </div>
            </div>

            {/* Quick Socratic Prompt Chips categorized by Questioning Level */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <span>Socratic Inquiry Levels:</span>
                <span className="text-indigo-600 font-bold">6-Tier Questioning Framework 🧠</span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setStudentInput("[Clarification] What specific physical features, materials, or spatial arrangements do you observe here?")}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 shrink-0 font-extrabold transition cursor-pointer flex items-center gap-1"
                >
                  <span>1. Clarification & Observation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudentInput("[Assumptions] What unstated assumptions are we making about why this landmark was built in this exact spot?")}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 shrink-0 font-extrabold transition cursor-pointer flex items-center gap-1"
                >
                  <span>2. Uncovering Assumptions</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudentInput("[Evidence] What physical, geographical, or historical evidence supports your explanation of this stop?")}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0 font-extrabold transition cursor-pointer flex items-center gap-1"
                >
                  <span>3. Evidence & Reasoning</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudentInput("[Perspectives] How might a local resident vs an outside visitor view the purpose of this location?")}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 shrink-0 font-extrabold transition cursor-pointer flex items-center gap-1"
                >
                  <span>4. Multiple Perspectives</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudentInput("[Trade-offs] What are the environmental or societal trade-offs associated with maintaining this site?")}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 shrink-0 font-extrabold transition cursor-pointer flex items-center gap-1"
                >
                  <span>5. Implications & Trade-offs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudentInput("[Meta-Inquiry] Why is asking questions about this location crucial to our overall unit topic?")}
                  className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 shrink-0 font-extrabold transition cursor-pointer flex items-center gap-1"
                >
                  <span>6. Meta-Inquiry</span>
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {socraticChat.map((msg, i) => (
                <div
                  key={`msg-${i}`}
                  className={`p-3 rounded-2xl text-xs leading-relaxed space-y-1.5 ${
                    msg.sender === 'guide'
                      ? 'bg-indigo-50 text-indigo-950 border border-indigo-100'
                      : 'bg-[#5f6f52]/10 text-slate-900 border border-[#5f6f52]/20 ml-6'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-extrabold opacity-75">
                    <span className="flex items-center gap-1">
                      {msg.sender === 'guide' ? <Bot className="w-3 h-3 text-indigo-600" /> : null}
                      {msg.sender === 'guide' ? 'Local Tour Guide' : 'You (Student)'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{msg.time}</span>
                      {msg.sender === 'guide' && (
                        <button
                          type="button"
                          onClick={() => handleReadGuideMessage(msg.text, i)}
                          className={`p-1 rounded-md transition cursor-pointer ${
                            speakingGuideMsgIndex === i
                              ? 'bg-indigo-200 text-indigo-900 animate-pulse'
                              : 'bg-indigo-100/70 hover:bg-indigo-200 text-indigo-800'
                          }`}
                          title={speakingGuideMsgIndex === i ? "Stop Voice Playback" : "Listen to Tour Guide Voice"}
                        >
                          {speakingGuideMsgIndex === i ? (
                            <VolumeX className="w-3.5 h-3.5 text-indigo-900" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-indigo-700" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}

              {isSocraticThinking && (
                <div className="p-3 bg-indigo-50 text-indigo-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Tour guide is formulating Socratic observation prompt...</span>
                </div>
              )}
            </div>

            {/* Listening Indicator Banner */}
            {isListening && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs font-bold text-rose-900 animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                  <span>🎙️ Listening... Speak your question now!</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className="px-2 py-0.5 bg-rose-200 hover:bg-rose-300 text-rose-950 rounded-lg text-[10px] font-extrabold cursor-pointer"
                >
                  Stop Recording
                </button>
              </div>
            )}

            {/* Speech Error Banner */}
            {speechError && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-900 flex items-center justify-between">
                <span>{speechError}</span>
                <button
                  type="button"
                  onClick={() => setSpeechError(null)}
                  className="p-1 text-amber-700 hover:text-amber-950"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Socratic Input Form with Text & Voice Controls */}
            <form onSubmit={handleSendSocraticMessage} className="flex gap-2 pt-1">
              <input
                type="text"
                value={studentInput}
                onChange={e => setStudentInput(e.target.value)}
                placeholder={isListening ? "Listening to your voice..." : "Ask or answer a Socratic question by typing or speaking..."}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5f6f52] min-h-[44px]"
              />

              {/* Voice Microphone Toggle Button */}
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className={`min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center shrink-0 border ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-700 animate-pulse shadow-md'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                }`}
                title={isListening ? "Stop Voice Input" : "Ask Question via Voice (Microphone)"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-700" />}
              </button>

              {/* Submit Text Button */}
              <button
                type="submit"
                disabled={!studentInput.trim() || isSocraticThinking}
                className="min-h-[44px] min-w-[44px] px-4 py-2.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 focus:ring-2 focus:ring-[#5f6f52] focus:outline-none disabled:opacity-50"
                title="Send Question to Socratic Tour Guide"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </section>


        {/* ================= RIGHT PANE: Interactive Reader & Guide (5 cols = ~40% on desktop) ================= */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          
          <div className={`rounded-3xl border p-4 sm:p-5 shadow-lg flex flex-col justify-between space-y-5 transition-colors ${
            isHighContrast ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-[#e5e1da]'
          }`}>
            
            {/* Right Sidebar Segmented Navigation Tab Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveRightTab('guide')}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeRightTab === 'guide'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#5f6f52]" />
                <span>Guide & Tasks</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRightTab('media')}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeRightTab === 'media'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                <span>Media & Route</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRightTab('notes')}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeRightTab === 'notes'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Educator Notes</span>
              </button>
            </div>

            {/* Header / Read Aloud Bar & Camera AR Launch */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5f6f52] bg-[#5f6f52]/10 px-3 py-1 rounded-full border border-[#5f6f52]/20 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Interactive Reader Guide
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCameraARView}
                  className="px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm flex items-center gap-1.5 min-h-[44px] focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  title="Bridge digital trip with physical classroom using Live AR Camera View"
                >
                  <Camera className="w-4 h-4 text-slate-950" />
                  <span>Camera View</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[9px] font-mono font-bold animate-pulse">
                    AR
                  </span>
                </button>

                <button
                  onClick={() => handleToggleReadAloud(currentStop.readingPassage)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 min-h-[44px] focus:ring-2 focus:ring-[#5f6f52] focus:outline-none ${
                    isSpeaking ? 'bg-rose-500 text-white border-rose-600 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#5f6f52]" />}
                  <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
                </button>
              </div>
            </div>

            {/* Reading Comprehension Passage */}
            <div className="space-y-4">
              <h2 className={`text-xl font-serif font-bold text-slate-900 leading-snug ${useDyslexicFont ? 'font-sans tracking-wide leading-relaxed' : ''}`}>
                {currentStop.title}
              </h2>

              {/* Phenomenon-Based Inquiry Hook Card */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-2xl p-4 border border-indigo-400/40 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500/30 text-indigo-300 rounded-xl border border-indigo-400/40">
                      <Sparkles className="w-4 h-4 animate-pulse text-indigo-300" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 block">
                        Phenomenon-Based Inquiry Hook
                      </span>
                      <h3 className="text-xs font-serif font-bold text-white">
                        {currentStop.phenomenonHook?.title || `The Real-World Mystery of ${currentStop.title}`}
                      </h3>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[10px] font-mono font-bold">
                    PhenoBL Hook 🧪
                  </span>
                </div>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-amber-300 flex items-start gap-1.5 leading-snug">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>"{currentStop.phenomenonHook?.mysteryQuestion || `What observable physical, structural, or ecological anomaly makes ${currentStop.locationName} unique?`}"</span>
                  </p>

                  {currentStop.phenomenonHook?.observableFacts && currentStop.phenomenonHook.observableFacts.length > 0 && (
                    <ul className="space-y-1 pt-1.5 border-t border-white/10 text-[11px] text-slate-300">
                      {currentStop.phenomenonHook.observableFacts.map((fact, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-1.5">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-slate-300 font-medium truncate max-w-[240px] sm:max-w-xs">
                    💡 Challenge: {currentStop.phenomenonHook?.inquiryChallenge || 'Formulate a hypothesis with your team and test it with the AI Guide.'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const mystery = currentStop.phenomenonHook?.mysteryQuestion || `Tell me about the real-world phenomenon at ${currentStop.title}`;
                      setStudentInput(`[PhenoBL Inquiry] ${mystery}`);
                      handleSendSocraticMessage(new Event('submit') as any);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0 shadow-xs border border-indigo-400 min-h-[36px]"
                    title="Ask the AI Local Tour Guide to guide your investigation into this phenomenon"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Investigate</span>
                  </button>
                </div>
              </div>

              <p className={`text-sm text-slate-800 leading-relaxed font-medium ${useDyslexicFont ? 'font-sans text-base leading-loose tracking-wide' : ''}`}>
                {currentStop.readingPassage}
              </p>

              {/* Auto-Follow Task Completion Action Callout */}
              <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-300/90 rounded-2xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-950">
                    <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>Reading & Inquiry Task Completion</span>
                    {isAutoFollowActive && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold">
                        ✨ Auto-Follow Ready
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {isAutoFollowActive
                      ? 'Mark reading & Socratic task done to automatically trigger camera transition to next milestone.'
                      : 'Mark reading & Socratic task complete (+50 XP).'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCompleteReadingAndAutoFollow}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#5f6f52] to-emerald-800 hover:from-[#4d5a42] hover:to-emerald-900 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shrink-0 border border-emerald-600 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                >
                  <span>{currentStopIndex < activeTrip.stops.length - 1 ? 'Complete & Auto-Follow Next' : 'Complete Final Stop'}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </button>
              </div>
            </div>

            {/* Milestone Card Horizontally Scrollable Media Gallery */}
            <div className="bg-slate-900 text-white border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-400 text-slate-950 rounded-xl shadow-xs">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 block">
                        Milestone Media Gallery
                      </span>
                      <span className="px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold">
                        {(currentStop.mediaGallery || []).length} items
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium">
                      360° panoramas & detail photos for Stop #{currentStop.stopNumber}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleScrollMediaGallery('left')}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition cursor-pointer border border-white/10"
                    title="Scroll gallery left"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScrollMediaGallery('right')}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition cursor-pointer border border-white/10"
                    title="Scroll gallery right"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAddMediaModal}
                    className="ml-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                    title="Attach a new 360 panorama or detail photo to this milestone card"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Attach Media</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Horizontal Media Stream */}
              {(!currentStop.mediaGallery || currentStop.mediaGallery.length === 0) ? (
                <div className="p-4 bg-white/5 border border-dashed border-white/15 rounded-xl text-center space-y-2">
                  <p className="text-xs text-slate-300 font-medium">
                    No supplemental media attached to Stop #{currentStop.stopNumber} yet.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddMediaModal}
                    className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Attach First 360° Panorama or Detail Photo</span>
                  </button>
                </div>
              ) : (
                <div
                  ref={mediaGalleryScrollRef}
                  className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-amber-500/30 snap-x snap-mandatory"
                >
                  {currentStop.mediaGallery.map((item) => {
                    const badge = getMediaTypeBadge(item.type);

                    return (
                      <div
                        key={item.id}
                        className="w-56 sm:w-64 shrink-0 snap-start bg-slate-950/90 border border-amber-500/30 rounded-xl overflow-hidden shadow-lg group hover:border-amber-400 transition flex flex-col justify-between"
                      >
                        {/* Media Thumbnail Container */}
                        <div className="relative h-32 sm:h-36 bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setSelectedLightboxMedia(item)}>
                          <img
                            src={item.url}
                            alt={item.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                          
                          {/* Type Badge */}
                          <div className="absolute top-2 left-2 flex items-center gap-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shadow-md flex items-center gap-1 ${badge.bg}`}>
                              <span>{badge.icon}</span>
                              <span>{badge.label}</span>
                            </span>
                          </div>

                          {/* Hover Inspect Icon */}
                          <div className="absolute bottom-2 right-2 p-1.5 bg-slate-950/80 rounded-lg text-amber-300 opacity-0 group-hover:opacity-100 transition shadow-md border border-amber-400/30">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Media Details */}
                        <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                              {item.caption}
                            </h4>
                            {item.credit && (
                              <p className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                                Source: {item.credit}
                              </p>
                            )}
                          </div>

                          {/* Card Footer Actions */}
                          <div className="flex items-center justify-between border-t border-white/10 pt-2 mt-2">
                            <button
                              type="button"
                              onClick={() => setSelectedLightboxMedia(item)}
                              className="text-[11px] font-extrabold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Inspect</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditMediaModal(item)}
                                className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white cursor-pointer"
                                title="Edit media item"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMediaGalleryItem(item.id)}
                                className="p-1 hover:bg-rose-500/20 rounded text-rose-300 hover:text-rose-200 cursor-pointer"
                                title="Delete media item"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Educator's Pedagogical Notes Section (Milestone-Aware) */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-400 text-slate-950 rounded-xl shadow-xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 block">
                      Educator Pedagogical Notes
                    </span>
                    <span className="text-[10px] text-slate-300 font-medium">
                      Context-aware guidance for Stop #{currentStop.stopNumber}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddNoteModal()}
                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                  title="Inject a custom teacher note for this geographic milestone"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Inject Note</span>
                </button>
              </div>

              {/* Notes List */}
              {!currentStop.educatorNotes || currentStop.educatorNotes.length === 0 ? (
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center space-y-1">
                  <p className="text-xs text-slate-300 font-medium">
                    No teacher notes injected for this geographic stop yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenAddNoteModal()}
                    className="text-[11px] text-amber-300 hover:underline font-bold"
                  >
                    + Inject the first pedagogical note for Stop #{currentStop.stopNumber}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentStop.educatorNotes.map((note) => {
                    const completedAtThisStop = currentStop.checkpoints.filter(c => studentProgress.completedCheckpointIds.includes(c.id)).length;
                    const requiredCount = note.requiredMilestoneCount || 1;
                    const isLocked = note.isMilestoneLocked && completedAtThisStop < requiredCount;

                    const focusBadges: Record<string, { label: string; bg: string; icon: string }> = {
                      discussion_prompt: { label: 'Discussion Prompt', bg: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40', icon: '💬' },
                      historical_context: { label: 'Historical Context', bg: 'bg-amber-500/20 text-amber-200 border-amber-400/40', icon: '📜' },
                      scientific_insight: { label: 'Scientific Insight', bg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40', icon: '🔬' },
                      misconception_alert: { label: 'Misconception Alert', bg: 'bg-rose-500/20 text-rose-200 border-rose-400/40', icon: '⚠️' },
                      curriculum_connection: { label: 'Curriculum Connection', bg: 'bg-purple-500/20 text-purple-200 border-purple-400/40', icon: '📚' },
                    };

                    const focusInfo = focusBadges[note.pedagogicalFocus] || focusBadges.discussion_prompt;

                    if (isLocked) {
                      return (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              <span>Geographic Milestone Note Locked</span>
                            </span>
                            <span className="text-[10px] font-bold text-amber-200 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                              {completedAtThisStop} / {requiredCount} Checkpoint Done
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">
                            🔒 Complete at least {requiredCount} micro-milestone checkpoint at <span className="text-white font-bold">{currentStop.title}</span> to reveal {note.authorName}'s context-aware note!
                          </p>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 bg-white/10 border border-white/15 rounded-xl space-y-2 text-xs relative group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-white text-xs">
                                {note.authorName}
                              </span>
                              {note.role && (
                                <span className="text-[10px] text-slate-300 font-medium bg-white/10 px-2 py-0.5 rounded-md">
                                  {note.role}
                                </span>
                              )}
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${focusInfo.bg}`}>
                                <span>{focusInfo.icon}</span>
                                <span>{focusInfo.label}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenAddNoteModal(note)}
                              className="p-1 hover:bg-white/20 rounded-md text-slate-300 hover:text-white transition cursor-pointer"
                              title="Edit Note"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEducatorNote(note.id)}
                              className="p-1 hover:bg-rose-500/30 rounded-md text-slate-400 hover:text-rose-300 transition cursor-pointer"
                              title="Delete Note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-slate-200 text-xs leading-relaxed font-medium pl-2 border-l-2 border-amber-400">
                          "{note.noteText}"
                        </p>

                        {note.isMilestoneLocked && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-bold pt-1">
                            <Unlock className="w-3 h-3 text-emerald-400" />
                            <span>Geographic Milestone Unlocked!</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Foreign Language Cues Section */}
            {currentStop.foreignLanguageCues && currentStop.foreignLanguageCues.length > 0 && (
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-amber-600" /> Foreign Language Navigational Cue
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                    {currentStop.foreignLanguageCues[0].language}
                  </span>
                </div>

                {currentStop.foreignLanguageCues.map((cue, idx) => (
                  <div
                    key={`cue-${idx}`}
                    onClick={() => setSelectedCue(selectedCue === cue ? null : cue)}
                    className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs hover:border-amber-400 transition cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold font-serif text-amber-950">
                        "{cue.phrase}"
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        {cue.phoneticSpelling}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-700">
                      Meaning: <span className="text-amber-900">{cue.translation}</span>
                    </p>

                    <p className="text-[11px] text-slate-500 italic">
                      Context: {cue.usageContext}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Visual Route Map Overlay: Interactive Excursion Node Path & Milestone Location Tracker */}
            <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Route className="w-4 h-4 text-amber-400" /> Visual Route Map Overlay
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Stop {currentStopIndex + 1} of {activeTrip.stops.length}
                </span>
              </div>

              {/* Interactive Route Trail Nodes */}
              <div className="relative py-2 px-1">
                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
                  {activeTrip.stops.map((s, idx) => {
                    const isCurrent = idx === currentStopIndex;
                    const isPassed = idx < currentStopIndex;
                    const isStopCompleted = s.checkpoints.length > 0 && s.checkpoints.every(c => studentProgress.completedCheckpointIds.includes(c.id));

                    return (
                      <div key={`route-node-${idx}`} className="flex items-center flex-1 min-w-[60px] last:flex-none">
                        {/* Node Item */}
                        <button
                          onClick={() => handleSmartJumpToStop(idx)}
                          className={`group relative flex flex-col items-center gap-1.5 transition cursor-pointer focus:outline-none ${
                            isCurrent ? 'scale-105' : 'hover:scale-102 opacity-85 hover:opacity-100'
                          }`}
                        >
                          {/* Node Icon Circle */}
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs transition-all shadow-sm ${
                              isCurrent
                                ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 animate-pulse'
                                : isStopCompleted || isPassed
                                ? 'bg-emerald-600 text-white border border-emerald-400'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isCurrent ? (
                              <MapPin className="w-4 h-4 text-slate-950" />
                            ) : isStopCompleted ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <span>#{s.stopNumber}</span>
                            )}
                          </div>

                          {/* Node Stop Label */}
                          <div className="text-center">
                            <span className={`block text-[10px] font-bold max-w-[68px] truncate ${
                              isCurrent ? 'text-amber-300 font-extrabold' : 'text-slate-400'
                            }`}>
                              {s.title}
                            </span>
                          </div>
                        </button>

                        {/* Connecting Line to Next Node */}
                        {idx < activeTrip.stops.length - 1 && (
                          <div className="flex-1 mx-1.5 h-1 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                idx < currentStopIndex
                                  ? 'bg-emerald-500'
                                  : idx === currentStopIndex
                                  ? 'bg-gradient-to-r from-amber-400 to-slate-700'
                                  : 'bg-slate-800'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Milestone GPS Coordinates Banner */}
              <div className="p-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2 truncate">
                  <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-mono text-[11px] text-slate-300 truncate">
                    GPS: {currentStop.lat.toFixed(4)}°, {currentStop.lng.toFixed(4)}°
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400">Heading:</span>
                  <span className="text-[10px] font-extrabold text-amber-300 uppercase bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700">
                    {currentStop.title}
                  </span>
                </div>
              </div>
            </div>

            {/* ADHD-Friendly Micro-Milestone Focus Scaffolding Checklist */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" /> Current Stop Micro-Milestones
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#5f6f52]">
                    {currentStop.checkpoints.filter(c => studentProgress.completedCheckpointIds.includes(c.id)).length} / {currentStop.checkpoints.length} Done
                  </span>
                  <button
                    onClick={() => {
                      setIsCelebrationOverlayOpen(true);
                      try {
                        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
                      } catch (e) {}
                    }}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer border border-amber-300 shadow-2xs"
                    title="Open Celebration Overlay to view earned XP & achievements"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-600" />
                    <span>Celebration 🎉</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {currentStop.checkpoints.map((chk) => {
                  const isDone = studentProgress.completedCheckpointIds.includes(chk.id);
                  return (
                    <button
                      key={chk.id}
                      onClick={() => handleToggleCheckpoint(chk.id)}
                      className={`w-full p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 min-h-[44px] focus:ring-2 focus:ring-[#5f6f52] focus:outline-none ${
                        isDone
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <p className={`text-xs font-bold ${isDone ? 'line-through text-emerald-800' : 'text-slate-800'}`}>
                          {chk.label}
                        </p>
                        {chk.hint && <p className="text-[11px] text-slate-500">{chk.hint}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total Field Trip Milestone Visual Progress Tracker (Ring & Linear Fill) */}
            {(() => {
              const allTripCheckpoints = activeTrip.stops.flatMap(s => s.checkpoints);
              const totalTripCheckpoints = allTripCheckpoints.length;
              const completedTripCheckpoints = allTripCheckpoints.filter(chk =>
                studentProgress.completedCheckpointIds.includes(chk.id)
              ).length;
              const progressPercentage = totalTripCheckpoints > 0
                ? Math.round((completedTripCheckpoints / totalTripCheckpoints) * 100)
                : 0;

              return (
                <div className="bg-[#5f6f52]/10 border border-[#5f6f52]/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Animated Radial Ring SVG */}
                      <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                        <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-200 stroke-current"
                            strokeWidth="3.5"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-[#5f6f52] stroke-current transition-all duration-500 ease-out"
                            strokeDasharray={`${progressPercentage}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-extrabold text-[#5f6f52]">
                          {progressPercentage}%
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                          Total Excursion Milestones
                        </h4>
                        <p className="text-[11px] text-slate-600 font-medium">
                          <span className="font-bold text-[#5f6f52]">{completedTripCheckpoints}</span> of <span className="font-bold">{totalTripCheckpoints}</span> total checkpoints completed
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                      {progressPercentage === 100 ? '🎉 Excursion Mastered' : `Stop ${currentStopIndex + 1} / ${activeTrip.stops.length}`}
                    </span>
                  </div>

                  {/* Animated Linear Fill Bar */}
                  <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/50">
                    <div
                      className="h-full bg-gradient-to-r from-[#5f6f52] via-emerald-600 to-amber-500 rounded-full transition-all duration-500 ease-out shadow-xs"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Bottom Actions: Wrap Up, Universal Exit Slip, & Rate Trip Button */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setIsExitSlipOpen(true)}
                className="flex-1 min-h-[48px] px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                <Award className="w-4 h-4" />
                <span>Complete Field Trip & Open Exit Slip</span>
              </button>
              <button
                onClick={handleOpenRateModal}
                className="min-h-[48px] px-5 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-extrabold rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>{studentProgress.tripRating ? `Rated ${studentProgress.tripRating.stars}★` : 'Rate Trip'}</span>
              </button>
            </div>

          </div>

        </section>
      </main>

      {/* ================= UNIVERSAL EXIT SLIP & SELF-EVALUATION MODAL ================= */}
      {isExitSlipOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            
            <div className="bg-gradient-to-r from-[#5f6f52] to-[#4d5a42] text-white p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-300 text-amber-950">
                  Self-Evaluation Rubric
                </span>
                <h3 className="text-xl font-serif font-bold text-white">
                  Universal Exit Slip: {activeTrip.title}
                </h3>
              </div>
              <button
                onClick={() => setIsExitSlipOpen(false)}
                className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExitSlip} className="p-6 space-y-5">
              
              {/* Question 1: 1-5 Rating / Rubric */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 block">
                  1. How well did you understand the historical and geographical concepts of this field trip?
                </label>
                <div className="flex items-center justify-between gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={`rate-${rating}`}
                      type="button"
                      onClick={() => setExitUnderstanding(rating)}
                      className={`flex-1 min-h-[44px] py-2 rounded-xl text-xs font-extrabold transition border cursor-pointer ${
                        exitUnderstanding === rating
                          ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {rating} {rating === 5 ? '⭐ Mastered' : rating === 1 ? 'Needs Review' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Key Observation */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 block">
                  2. What primary architectural, cultural, or physical feature did you locate on the map?
                </label>
                <textarea
                  required
                  rows={3}
                  value={exitObservation}
                  onChange={e => setExitObservation(e.target.value)}
                  placeholder="e.g. I observed the symmetrical Neoclassical pillars and cobblestone plaza at the Royal Palace..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#5f6f52] focus:outline-none"
                />
              </div>

              {/* Question 3: Foreign Language Cue Reflection */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 block">
                  3. Which foreign language directional cue or phrase did you apply?
                </label>
                <input
                  type="text"
                  value={exitLanguageReflection}
                  onChange={e => setExitLanguageReflection(e.target.value)}
                  placeholder="e.g. 'Tournez à gauche' (Turn left)"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#5f6f52] focus:outline-none min-h-[44px]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsExitSlipOpen(false)}
                  className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>Submit Exit Slip & Claim Badge</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================= DYNAMIC QR CODE MODAL ================= */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#5f6f52]" />
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Classroom Field Trip Dynamic QR Code
                </h3>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
                <QRCodeSVG
                  value={currentTripQrUrl}
                  size={180}
                  level="H"
                  includeMargin
                />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">{activeTrip.title}</h4>
                <p className="text-xs text-slate-500 font-mono break-all bg-slate-100 p-2 rounded-xl">
                  {currentTripQrUrl}
                </p>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Students can scan this code with their tablet or smartphone camera to load this split-pane virtual trip experience immediately.
              </p>

              <button
                onClick={() => window.print()}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print QR Code Badge Sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SHARE TRIP DEEP-LINK MODAL ================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#5f6f52] to-[#4d5a42] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-300" />
                <h3 className="font-serif font-bold text-base text-white">
                  Share Virtual Field Trip
                </h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Trip Overview */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">
                    {activeTrip.country} • {activeTrip.subject}
                  </span>
                  <h4 className="font-bold text-sm text-amber-950">{activeTrip.title}</h4>
                  <p className="text-xs text-amber-800">
                    Currently at Stop #{currentStopIndex + 1}: {currentStop?.title}
                  </p>
                </div>
                <Compass className="w-7 h-7 text-amber-600 shrink-0" />
              </div>

              {/* Shareable URL Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase text-slate-800 block">
                  Direct Student Deep-Link URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getShareableDeepLink()}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all focus:outline-none min-h-[44px]"
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className={`min-h-[44px] px-4 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#5f6f52] hover:bg-[#4d5a42] text-white'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Classroom LMS Snippet */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase text-slate-800 block">
                  Classroom Assignment Snippet (LMS / Messaging)
                </label>
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {`🎒 Virtual Field Trip: ${activeTrip.title} (${activeTrip.country})\n📍 Stop #${currentStopIndex + 1}: ${currentStop?.title || 'Overview'}\n🔗 Access Excursion: ${getShareableDeepLink()}`}
                </div>
                <button
                  onClick={handleCopyClassroomSnippet}
                  className={`w-full min-h-[44px] px-4 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border ${
                    isSnippetCopied
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                  }`}
                >
                  {isSnippetCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Assignment Snippet Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>Copy Assignment Snippet for Google Classroom / WhatsApp</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <a
                  href={getShareableDeepLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#5f6f52] hover:underline flex items-center gap-1"
                >
                  <span>Test Link in New Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="min-h-[44px] px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Done
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= VIRTUAL TOUR CREATOR GUIDE & ROUTE BUILDER MODAL ================= */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-400 text-slate-950 rounded-2xl shadow-sm">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Step-by-Step Excursion Mapping Guide
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-white mt-0.5">
                    Virtual Tour Creator Guide
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBuilderOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleGenerateCustomTrip} className="p-5 sm:p-6 space-y-4 overflow-y-auto text-slate-800">
              
              {/* Step 1: Creator Role Selection */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="text-xs font-extrabold uppercase text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                  <span>1. Who is mapping out this virtual tour? (Creator Role)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'teacher', label: '👩‍🏫 Teacher / Educator' },
                    { id: 'parent', label: '🏡 Parent / Guardian' },
                    { id: 'student', label: '🎒 Student / Peer' },
                    { id: 'custom', label: '✏️ Other / Custom...' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setCreatorRole(r.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                        creatorRole === r.id
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {creatorRole === 'custom' && (
                  <input
                    type="text"
                    value={customCreatorRole}
                    onChange={e => setCustomCreatorRole(e.target.value)}
                    required={creatorRole === 'custom'}
                    placeholder="Enter custom role (e.g. Museum Docent, Scout Leader, STEM Coordinator)..."
                    className="w-full mt-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                  />
                )}
              </div>

              {/* Step 2: Excursion Target Category Dropdown */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="text-xs font-extrabold uppercase text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>2. Select Excursion Focus & Location Type</span>
                </label>
                <select
                  value={builderCategory}
                  onChange={e => setBuilderCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[42px]"
                >
                  <option value="european_cities">🏙️ European & Global Cities (e.g. Brussels, Lille, Paris, London)</option>
                  <option value="art_museums">🖼️ Art Museums & Gallery Exhibits (QR/NFC Scanning & Databases)</option>
                  <option value="agricultural_farms">🌾 Agricultural Sites & Farms (Food & Supply Chain Traceability)</option>
                  <option value="school_campus">🏫 School Campuses & Local Community Landmarks (QR Physical Signs)</option>
                  <option value="science_timelines">🔬 Interactive Timelines & Science Charts (Classroom Posters & 3D Models)</option>
                  <option value="custom">✏️ Other / Custom Location Focus...</option>
                </select>

                {builderCategory === 'custom' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    required={builderCategory === 'custom'}
                    placeholder="Describe custom location type (e.g. Marine Coral Reef, National Park, Factory)..."
                    className="w-full mt-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[40px]"
                  />
                )}
              </div>

              {/* Step 3: Destination Landmark & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-800 block">
                    Destination Landmark or City Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={builderDestination}
                    onChange={e => setBuilderDestination(e.target.value)}
                    placeholder="e.g. Brussels Grand Place, Lille Vieille Bourse, School Library, Local Dairy Farm"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[42px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-800 block">
                    Country or Region
                  </label>
                  <input
                    type="text"
                    value={builderCountry}
                    onChange={e => setBuilderCountry(e.target.value)}
                    placeholder="e.g. Belgium, France, United Kingdom, Kenya, USA"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[42px]"
                  />
                </div>
              </div>

              {/* Step 4: Foreign Language Integration */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="text-xs font-extrabold uppercase text-slate-900 flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-indigo-600" />
                  <span>4. Foreign Language Reading & Navigational Clues</span>
                </label>
                <select
                  value={builderLanguage}
                  onChange={e => setBuilderLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[42px]"
                >
                  <option value="French">🇫🇷 French (Street Cues: "Rue", "Tournez à gauche", "Façade")</option>
                  <option value="Kiswahili">🇰🇪 Kiswahili (Directional Cues: "Tembea", "Mazingira", "Tazama")</option>
                  <option value="Spanish">🇪🇸 Spanish (Navigation Cues: "Camino", "Orientación", "Estructura")</option>
                  <option value="Latin">🏛️ Latin (Civic Mottos: "Domine dirige nos")</option>
                  <option value="English">🇬🇧 English / Local Dialect Navigation</option>
                  <option value="custom">✏️ Other Custom Language...</option>
                </select>

                {builderLanguage === 'custom' && (
                  <input
                    type="text"
                    value={customLanguage}
                    onChange={e => setCustomLanguage(e.target.value)}
                    required={builderLanguage === 'custom'}
                    placeholder="Enter target language (e.g. German, Mandarin, Arabic, Sign Language)..."
                    className="w-full mt-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[40px]"
                  />
                )}
              </div>

              {/* Step 5: Physical Asset & QR Placement Strategy */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="text-xs font-extrabold uppercase text-slate-900 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-amber-600" />
                  <span>5. Physical Asset & QR Code Placement Strategy</span>
                </label>
                <select
                  value={qrPlacementStrategy}
                  onChange={e => setQrPlacementStrategy(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[42px]"
                >
                  <option value="department_signs">🪧 Placed on Campus Buildings & Department Signs</option>
                  <option value="library_shelves">📚 Mounted on Physical Library Shelves & Book Spines</option>
                  <option value="classroom_posters">🔬 Affixed to Classroom Posters, Wall Maps & Periodic Tables</option>
                  <option value="museum_plaques">🖼️ Integrated into Physical Museum Gallery Exhibit Plaques</option>
                  <option value="agricultural_pastures">🚜 Planted at Farm Pastures & Food Processing Silos</option>
                  <option value="custom">✏️ Other Physical QR Placement Strategy...</option>
                </select>

                {qrPlacementStrategy === 'custom' && (
                  <input
                    type="text"
                    value={customQrPlacement}
                    onChange={e => setCustomQrPlacement(e.target.value)}
                    required={qrPlacementStrategy === 'custom'}
                    placeholder="Describe custom physical placement (e.g. Printed on Field Trip Worksheets, Gym Wall)..."
                    className="w-full mt-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                  />
                )}
              </div>

              {/* Step 6: Subject & Grade Alignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-800 block">
                    Subject / Curriculum Field
                  </label>
                  <select
                    value={builderSubject}
                    onChange={e => setBuilderSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[42px]"
                  >
                    <option value="European History & Languages">European History & Foreign Languages</option>
                    <option value="CBC Social Studies & Kiswahili">CBC Social Studies & Kiswahili</option>
                    <option value="Art History & Visual Literacy">Art History & Museum Curation</option>
                    <option value="Agricultural Science & Biology">Agricultural Science & Supply Chains</option>
                    <option value="Civic Geography & Community Assets">Civic Geography & Local Community Assets</option>
                    <option value="STEM, Molecular Biology & Physics">STEM, Molecular Genetics & Physics</option>
                    <option value="custom">✏️ Other Custom Subject...</option>
                  </select>
                  {builderSubject === 'custom' && (
                    <input
                      type="text"
                      value={customSubject}
                      onChange={e => setCustomSubject(e.target.value)}
                      required={builderSubject === 'custom'}
                      placeholder="Type custom subject (e.g. Environmental Ethics, Culinary Arts)..."
                      className="w-full mt-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-800 block">
                    Target Grade / Age Group
                  </label>
                  <select
                    value={builderGrade}
                    onChange={e => setBuilderGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[42px]"
                  >
                    <option value="Elementary (Grade 1 - 5)">Elementary (Grade 1 - 5)</option>
                    <option value="Upper Primary (Grade 4 - 6)">Upper Primary (Grade 4 - 6)</option>
                    <option value="Junior Secondary (Grade 7 - 9)">Junior Secondary (Grade 7 - 9)</option>
                    <option value="Senior Secondary (Grade 10 - 12)">Senior Secondary (Grade 10 - 12)</option>
                    <option value="Higher Education / Adult Learners">Higher Education / Adult Learners</option>
                    <option value="custom">✏️ Other Custom Level...</option>
                  </select>
                  {builderGrade === 'custom' && (
                    <input
                      type="text"
                      value={customGrade}
                      onChange={e => setCustomGrade(e.target.value)}
                      required={builderGrade === 'custom'}
                      placeholder="Type custom grade/level..."
                      className="w-full mt-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                    />
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingTrip || !builderDestination.trim()}
                  className="min-h-[44px] px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-extrabold rounded-xl transition cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingTrip ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Synthesizing Field Trip Route...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Generate Virtual Field Trip</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= AI VIRTUAL FIELD TRIP LESSON PLAN MODAL ================= */}
      {isLessonPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/50 border border-indigo-400/30 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                    CBC Curriculum & Universal Scaffolding
                  </span>
                  <h3 className="font-serif font-bold text-lg text-white leading-tight">
                    Virtual Field Trip Lesson Plan
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {lessonPlan && (
                  <>
                    <button
                      onClick={handleCopyLessonPlanText}
                      className="min-h-[38px] px-3 py-1.5 bg-indigo-700/60 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-indigo-400/30"
                    >
                      {isLessonPlanCopied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-indigo-200" />
                          <span>Copy Text</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handlePrintLessonPlan}
                      className="min-h-[38px] px-3 py-1.5 bg-indigo-700/60 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-indigo-400/30"
                    >
                      <Printer className="w-4 h-4 text-indigo-200" />
                      <span>Print / PDF</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsLessonPlanModalOpen(false)}
                  className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
              {isGeneratingLessonPlan ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8 text-indigo-600 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif font-bold text-lg text-indigo-950">
                      Crafting CBC & Experiential Lesson Plan...
                    </h4>
                    <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
                      Gemini is generating stop-by-stop teacher scripts, Socratic inquiry questions, assessment rubrics, and UDL scaffolding for "{activeTrip.title}".
                    </p>
                  </div>
                </div>
              ) : lessonPlanError ? (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
                  <p className="text-xs font-bold text-rose-900">{lessonPlanError}</p>
                  <button
                    onClick={handleGenerateLessonPlan}
                    className="px-4 py-2 bg-rose-700 text-white text-xs font-bold rounded-xl hover:bg-rose-800 transition cursor-pointer inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>
                </div>
              ) : lessonPlan ? (
                <div className="space-y-6">
                  {/* Lesson Overview Banner */}
                  <div className="p-5 bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800">
                          {lessonPlan.subject} • {lessonPlan.gradeLevel}
                        </span>
                        <h2 className="font-serif font-bold text-xl text-indigo-950">
                          {lessonPlan.lessonTitle}
                        </h2>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-extrabold border border-indigo-200">
                        ⏱️ Estimated Duration: {lessonPlan.durationMinutes} Minutes
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {lessonPlan.overview}
                    </p>

                    {/* CBC Competencies Tags */}
                    {lessonPlan.cbcCompetencies && lessonPlan.cbcCompetencies.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-extrabold uppercase text-indigo-900 block mb-1.5">
                          Target Competencies & Values:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {lessonPlan.cbcCompetencies.map((comp, idx) => (
                            <span key={idx} className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-white border border-indigo-200 text-indigo-900 shadow-2xs">
                              🎯 {comp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Learning Outcomes & Materials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Outcomes */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-500" /> Expected Learning Outcomes
                      </h4>
                      <ul className="space-y-1.5">
                        {lessonPlan.learningOutcomes.map((out, i) => (
                          <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{out}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Materials & Pre-Trip Prep */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-indigo-600" /> Materials & Pre-Trip Prep
                      </h4>
                      <ul className="space-y-1.5">
                        {lessonPlan.preTripPreparation.map((prep, i) => (
                          <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                            <span>{prep}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Stop-by-Stop Educator Guidance */}
                  <div className="space-y-3">
                    <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                      <Route className="w-5 h-5 text-indigo-700" />
                      <span>Stop-by-Stop Educator Guidance & Socratic Scripts</span>
                    </h3>

                    <div className="space-y-3">
                      {lessonPlan.stopByStopGuidance.map((stop) => (
                        <div key={stop.stopNumber} className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl space-y-2.5">
                          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                            <span className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
                              Stop #{stop.stopNumber}: {stop.stopTitle}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[11px] font-extrabold uppercase text-slate-700 block">
                              🗣️ Teacher Script & Orientation:
                            </span>
                            <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-indigo-100 italic">
                              "{stop.teacherScript}"
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[11px] font-extrabold uppercase text-indigo-900 block">
                              ❓ Socratic Inquiry Questions:
                            </span>
                            <ul className="space-y-1 pl-1">
                              {stop.socraticQuestions.map((q, qIdx) => (
                                <li key={qIdx} className="text-xs text-slate-700 flex items-start gap-1.5">
                                  <span className="text-indigo-600 font-bold">•</span>
                                  <span>{q}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-1 flex items-center gap-2 text-xs">
                            <span className="font-extrabold text-emerald-800">📌 Student Action Item:</span>
                            <span className="text-slate-700 font-medium">{stop.studentActionItem}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Post-Trip Assessment Rubric */}
                  <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                    <h4 className="font-serif font-bold text-sm text-amber-950 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>Post-Trip Assessment & Rubric</span>
                    </h4>

                    <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-1">
                      <span className="text-[11px] font-extrabold uppercase text-amber-800 block">
                        Universal Exit Slip Question Prompt:
                      </span>
                      <p className="text-xs text-amber-950 font-medium">
                        "{lessonPlan.postTripAssessment.exitSlipPrompt}"
                      </p>
                    </div>

                    {/* Rubric Grid Table */}
                    {lessonPlan.postTripAssessment.rubricCriteria && lessonPlan.postTripAssessment.rubricCriteria.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-amber-100/80 text-amber-900 font-bold">
                              <th className="p-2 border border-amber-200">Criterion</th>
                              <th className="p-2 border border-amber-200">Beginning</th>
                              <th className="p-2 border border-amber-200">Proficient</th>
                              <th className="p-2 border border-amber-200">Exemplary</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lessonPlan.postTripAssessment.rubricCriteria.map((rubric, rIdx) => (
                              <tr key={rIdx} className="bg-white">
                                <td className="p-2 border border-amber-200 font-bold text-slate-800">{rubric.criterion}</td>
                                <td className="p-2 border border-amber-200 text-slate-600">{rubric.beginning}</td>
                                <td className="p-2 border border-amber-200 text-slate-700 font-medium">{rubric.proficient}</td>
                                <td className="p-2 border border-amber-200 text-emerald-800 font-bold">{rubric.exemplary}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Universal Differentiation Strategies */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                      <span className="text-[11px] font-extrabold uppercase text-emerald-900 block">
                        🌱 Differentiation for Learning Support
                      </span>
                      <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                        {lessonPlan.differentiationStrategies.forSupport}
                      </p>
                    </div>

                    <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                      <span className="text-[11px] font-extrabold uppercase text-purple-900 block">
                        🚀 Extension for Advanced Learners
                      </span>
                      <p className="text-xs text-purple-950 font-medium leading-relaxed">
                        {lessonPlan.differentiationStrategies.forExtension}
                      </p>
                    </div>
                  </div>

                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={handleGenerateLessonPlan}
                disabled={isGeneratingLessonPlan}
                className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Regenerate Lesson Plan</span>
              </button>

              <button
                onClick={() => setIsLessonPlanModalOpen(false)}
                className="min-h-[44px] px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Lesson Plan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= STUDENT LEARNING XP PROFILE MODAL ================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                  <Trophy className="w-7 h-7 text-amber-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-900/30 text-amber-100 border border-amber-300/30">
                      Level {studentProfile.level} • {studentProfile.levelTitle}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-white leading-tight mt-0.5">
                    Student Learning XP Profile
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-slate-800">
              
              {/* Main Total XP & Level Banner */}
              <div className="p-5 bg-gradient-to-br from-amber-50 via-slate-50 to-amber-100/50 border border-amber-200/80 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                      Total Earned Learning XP
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-extrabold text-amber-950 font-serif">
                        {studentProfile.totalXP}
                      </span>
                      <span className="text-sm font-extrabold text-amber-700">XP Points</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-600 block">Current Rank</span>
                    <span className="text-sm font-extrabold text-amber-900 bg-amber-200/60 px-3 py-1 rounded-xl border border-amber-300/60 inline-block">
                      🏆 {studentProfile.levelTitle}
                    </span>
                  </div>
                </div>

                {/* Level Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Level {studentProfile.level} Progress</span>
                    <span className="text-amber-800">{studentProfile.xpToNextLevel} XP needed for Level {studentProfile.level + 1}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${studentProfile.levelProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Achievement Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Milestones Reached
                  </span>
                  <div className="flex items-center justify-center gap-1 text-slate-900 font-extrabold text-lg">
                    <Flag className="w-4 h-4 text-emerald-600" />
                    <span>{studentProfile.milestonesCompleted}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold block">+50 XP each</span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Exit Slips Completed
                  </span>
                  <div className="flex items-center justify-center gap-1 text-slate-900 font-extrabold text-lg">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>{studentProfile.exitSlipsCompleted}</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-bold block">+200 XP each</span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Active Streak
                  </span>
                  <div className="flex items-center justify-center gap-1 text-slate-900 font-extrabold text-lg">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>{studentProgress.streakCount || 1} Days</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-bold block">Daily Explorer</span>
                </div>
              </div>

              {/* Active Excursion Breakdown Card */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-indigo-600" /> Current Excursion XP Status
                  </span>
                  <span className="text-xs font-bold text-indigo-800 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200">
                    {VirtualFieldTripService.calculateTripXP(studentProgress, activeTrip.stops.length)} XP Earned
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-medium">Selected Trip:</span>
                    <span className="font-bold text-slate-900">{activeTrip.title} ({activeTrip.country})</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-medium">Milestones Completed in Trip:</span>
                    <span className="font-bold text-emerald-700">
                      {studentProgress.completedCheckpointIds.length} Checkpoints (+{studentProgress.completedCheckpointIds.length * 50} XP)
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-medium">Post-Trip Exit Slip Status:</span>
                    <span className={`font-bold ${studentProgress.exitSlip ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {studentProgress.exitSlip ? 'Submitted (+200 XP)' : 'Not Yet Submitted (+200 XP upon completion)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* How to Earn Learning XP */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <span className="font-extrabold uppercase tracking-wider text-slate-800 block">
                  💡 How Student Learning XP Works:
                </span>
                <ul className="space-y-1.5 text-slate-600">
                  <li className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span><strong>Check In at Milestones:</strong> Earn <strong>+50 XP</strong> for every observation checkpoint you check off.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span><strong>Submit Exit Slip:</strong> Earn <strong>+200 XP</strong> for completing your post-trip reflection and foreign language inquiry.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                    <span><strong>Rate Field Trip:</strong> Earn <strong>+50 XP</strong> for submitting star feedback and comments for your excursion.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span><strong>Master Entire Excursion:</strong> Earn <strong>+100 XP</strong> bonus when all route stops are visited!</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setIsCelebrationOverlayOpen(true);
                  try {
                    confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 } });
                  } catch (e) {}
                }}
                className="min-h-[44px] px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>View Milestone Celebration 🎉</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="min-h-[44px] px-6 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= RATE VIRTUAL FIELD TRIP MODAL ================= */}
      {isRateTripModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20 border border-white/30 backdrop-blur-xs">
                  <Star className="w-5 h-5 text-amber-100 fill-amber-200" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-100 block">
                    Student Tour Feedback
                  </span>
                  <h3 className="font-serif font-bold text-lg text-white leading-tight">
                    Rate This Field Trip
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsRateTripModalOpen(false)}
                className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {isRatingSubmitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-700">
                  <Trophy className="w-8 h-8 text-amber-600 animate-bounce" />
                </div>
                <h4 className="font-serif font-bold text-xl text-slate-900">
                  Thank You for Rating!
                </h4>
                <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 inline-block">
                  🎉 Feedback Recorded (+50 XP Earned!)
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRating} className="p-6 space-y-5 text-slate-800">
                
                {/* Trip Title Reference */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase text-amber-800 block">Excursion</span>
                  <p className="text-xs font-bold text-amber-950">{activeTrip.title} ({activeTrip.country})</p>
                </div>

                {/* Star Rating Selection */}
                <div className="space-y-2 text-center">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 block">
                    How would you rate this virtual field trip experience?
                  </label>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverStars || ratingStars) >= star;
                      return (
                        <button
                          key={`star-${star}`}
                          type="button"
                          onClick={() => setRatingStars(star)}
                          onMouseEnter={() => setHoverStars(star)}
                          onMouseLeave={() => setHoverStars(0)}
                          className="p-1 transition transform hover:scale-125 focus:outline-none cursor-pointer"
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              isFilled
                                ? 'text-amber-500 fill-amber-400 drop-shadow-xs'
                                : 'text-slate-300 fill-slate-100'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-extrabold text-amber-800 block">
                    {ratingStars === 5 && '⭐⭐⭐⭐⭐ Exceptional Tour!'}
                    {ratingStars === 4 && '⭐⭐⭐⭐ Great Experience'}
                    {ratingStars === 3 && '⭐⭐⭐ Good Tour'}
                    {ratingStars === 2 && '⭐⭐ Fair / Needs Work'}
                    {ratingStars === 1 && '⭐ Poor Experience'}
                  </span>
                </div>

                {/* Quick Comment Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 block">
                    Quick Student Feedback / Comment
                  </label>
                  <textarea
                    rows={3}
                    value={ratingComment}
                    onChange={e => setRatingComment(e.target.value)}
                    placeholder="Tell us what you liked most or what could be improved on this tour..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Submit Footer */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsRateTripModalOpen(false)}
                    className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[44px] px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>Submit Tour Rating (+50 XP)</span>
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* ================= SOCRATIC TRAVEL JOURNAL MODAL ================= */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-950 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xs">
                  <BookOpen className="w-6 h-6 text-emerald-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 block">
                      Student Expedition Journal
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                      +150 XP Reward
                    </span>
                    {journalSaveStatus && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 animate-bounce">
                        ✓ {journalSaveStatus}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-white leading-tight">
                    Socratic Travel Journal: {activeTrip.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJournalText}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Copy full journal text to clipboard"
                >
                  {isJournalCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-emerald-200" />}
                  <span className="hidden sm:inline">{isJournalCopied ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJournalMarkdown}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Download formatted Socratic journal as Markdown file"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span className="hidden sm:inline">Export .MD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsJournalModalOpen(false)}
                  className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body with Stop Tabs & Inquiry Forms */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
              
              {/* Journal Stop Navigation Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {activeTrip.stops.map((stop) => {
                  const hasEntry = !!journalData.stopEntries[stop.stopNumber]?.observations;
                  const isSelected = journalActiveStopNumber === stop.stopNumber;

                  return (
                    <button
                      key={`journal-tab-${stop.stopNumber}`}
                      type="button"
                      onClick={() => setJournalActiveStopNumber(stop.stopNumber)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 shrink-0 cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                          : hasEntry
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : hasEntry ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>Stop {stop.stopNumber}: {stop.title.split(':')[0]}</span>
                      {hasEntry && <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900">✓</span>}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setJournalActiveStopNumber(999)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 shrink-0 cursor-pointer border ${
                    journalActiveStopNumber === 999
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                      : 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Overall Excursion Synthesis</span>
                </button>
              </div>

              {/* Stop-Specific Journal Entry Form */}
              {journalActiveStopNumber !== 999 ? (
                (() => {
                  const currentJournalStop = activeTrip.stops.find(s => s.stopNumber === journalActiveStopNumber) || activeTrip.stops[0];
                  const entry = journalData.stopEntries[journalActiveStopNumber] || {
                    stopNumber: journalActiveStopNumber,
                    stopTitle: currentJournalStop.title,
                    locationName: currentJournalStop.locationName,
                    observations: '',
                    hypothesis: '',
                    causeAndEffect: '',
                    vocabularyLearned: [],
                    questionsRemaining: '',
                    updatedAt: new Date().toISOString()
                  };

                  return (
                    <div className="space-y-5">
                      
                      {/* Location Header Reference */}
                      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider block">
                            Active Field Stop Observation
                          </span>
                          <h4 className="font-serif font-bold text-base text-slate-900">
                            {currentJournalStop.title}
                          </h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                            <Compass className="w-3.5 h-3.5 text-slate-400" />
                            <span>{currentJournalStop.locationName}</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleGenerateAIJournalPrompt(journalActiveStopNumber)}
                          disabled={isGeneratingJournalPrompt}
                          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                          title="Ask Socratic AI to suggest an inspiring inquiry question for your notes"
                        >
                          {isGeneratingJournalPrompt ? <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-600" />}
                          <span>Get Socratic Reflection Idea</span>
                        </button>
                      </div>

                      {/* Prompts reference callout */}
                      {currentJournalStop.socraticGuidePrompts && currentJournalStop.socraticGuidePrompts.length > 0 && (
                        <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider flex items-center gap-1">
                            <Bot className="w-3.5 h-3.5 text-amber-700" /> Suggested Socratic Inquiry Prompts for this Stop
                          </span>
                          <ul className="space-y-1 pl-1">
                            {currentJournalStop.socraticGuidePrompts.map((prompt, pIdx) => (
                              <li key={`p-${pIdx}`} className="text-xs text-amber-950 font-medium flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">•</span>
                                <span>{prompt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Form Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Section 1: Observations */}
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-emerald-700" />
                            <span>1. Field Observations</span>
                          </label>
                          <p className="text-[11px] text-slate-500 font-medium">
                            What specific architectural, geographical, environmental, or cultural details did you observe on the map/panorama?
                          </p>
                          <textarea
                            rows={4}
                            value={entry.observations}
                            onChange={e => handleUpdateJournalStopField(journalActiveStopNumber, 'observations', e.target.value)}
                            placeholder="I observed that..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                          />
                        </div>

                        {/* Section 2: Formulated Hypothesis */}
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <PenTool className="w-4 h-4 text-indigo-700" />
                            <span>2. Formulated Hypothesis & Reason</span>
                          </label>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Why do you think this location was designed or positioned this way? What hypothesis can you form?
                          </p>
                          <textarea
                            rows={4}
                            value={entry.hypothesis}
                            onChange={e => handleUpdateJournalStopField(journalActiveStopNumber, 'hypothesis', e.target.value)}
                            placeholder="My hypothesis is that..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                          />
                        </div>

                        {/* Section 3: Cause and Effect / Systems Analysis */}
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <Route className="w-4 h-4 text-amber-700" />
                            <span>3. Systems & Cause-and-Effect Analysis</span>
                          </label>
                          <p className="text-[11px] text-slate-500 font-medium">
                            What trade-offs, human-environment interactions, or historical cause-and-effect relationships exist here?
                          </p>
                          <textarea
                            rows={4}
                            value={entry.causeAndEffect}
                            onChange={e => handleUpdateJournalStopField(journalActiveStopNumber, 'causeAndEffect', e.target.value)}
                            placeholder="The main trade-off or cause-and-effect relationship here is..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-600 focus:outline-none"
                          />
                        </div>

                        {/* Section 4: Remaining Socratic Inquiries */}
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-teal-700" />
                            <span>4. Remaining Socratic Questions</span>
                          </label>
                          <p className="text-[11px] text-slate-500 font-medium">
                            What unanswered questions or curiosities would you like to ask a historian or scientist about this site?
                          </p>
                          <textarea
                            rows={4}
                            value={entry.questionsRemaining}
                            onChange={e => handleUpdateJournalStopField(journalActiveStopNumber, 'questionsRemaining', e.target.value)}
                            placeholder="I still wonder..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
                          />
                        </div>

                      </div>

                      {/* Foreign Language Vocabulary Chips for this Stop */}
                      {currentJournalStop.foreignLanguageCues && currentJournalStop.foreignLanguageCues.length > 0 && (
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <Languages className="w-4 h-4 text-emerald-700" />
                            <span>Foreign Language Cues Learned at this Stop</span>
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {currentJournalStop.foreignLanguageCues.map((cue, cIdx) => (
                              <div
                                key={`cue-${cIdx}`}
                                className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-0.5"
                              >
                                <span className="font-extrabold text-emerald-950 block">{cue.phrase} ({cue.language})</span>
                                <p className="text-[11px] text-emerald-800 italic">"{cue.translation}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })()
              ) : (
                /* Overall Excursion Synthesis Tab (Stop 999) */
                <div className="space-y-4 p-5 bg-white border border-slate-200 rounded-2xl">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-600" /> Overall Excursion Socratic Synthesis (+150 XP)
                    </span>
                    <h4 className="font-serif font-bold text-base text-slate-900">
                      Connect the Dots Across All Field Trip Stops
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Reflect on your full excursion from start to finish. How do the geographic, historical, or linguistic themes connect together? What is your final conclusion?
                    </p>
                  </div>

                  <textarea
                    rows={8}
                    value={journalData.summaryReflection}
                    onChange={e => handleUpdateJournalSummary(e.target.value)}
                    placeholder="Reflecting on this full virtual excursion..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span>💡 Tip: Saving your overall synthesis awards +150 XP bonus to your Expedition Profile!</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateJournalSummary(journalData.summaryReflection)}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer"
                    >
                      Save Synthesis (+150 XP)
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-bold">
                {Object.keys(journalData.stopEntries || {}).length} of {activeTrip.stops.length} Stops Journaled
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsJournalModalOpen(false)}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-sm"
                >
                  Done Journaling
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= CELEBRATORY MILESTONE ANIMATION OVERLAY ================= */}
      <AnimatePresence>
        {isCelebrationOverlayOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl overflow-y-auto"
          >
            {/* Animated Background Particle Orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.3, 0.6, 0.3],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1.25, 1, 1.25],
                  opacity: [0.3, 0.5, 0.3],
                  rotate: [360, 180, 0]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
              />
            </div>

            {/* Modal Card Container */}
            <motion.div
              initial={{ scale: 0.75, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border border-amber-500/40 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto relative text-white p-6 sm:p-8 space-y-6 text-center"
            >
              {/* Close Overlay Button */}
              <button
                type="button"
                onClick={() => setIsCelebrationOverlayOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Floating Trophy Badge Animation */}
              <div className="relative pt-2">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-1 shadow-2xl shadow-amber-500/30 mx-auto"
                >
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center border-2 border-amber-300/60">
                    <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
                  </div>
                </motion.div>

                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-1 right-1/3 text-amber-300"
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                  className="absolute bottom-2 left-1/3 text-amber-400"
                >
                  <Star className="w-5 h-5 fill-amber-400" />
                </motion.div>
              </div>

              {/* Congratulatory Header */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-1.5"
              >
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-block">
                  🎉 Excursion Milestones Mastered!
                </span>
                <h3 className="font-serif font-bold text-2xl sm:text-3xl text-white">
                  {activeTrip.title}
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  {activeTrip.destination} • {activeTrip.country}
                </p>
              </motion.div>

              {/* Earned XP Counter Display */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.35, type: "spring" }}
                className="p-5 bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 border border-amber-400/40 rounded-2xl shadow-inner space-y-1"
              >
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 block">
                  Total Earned Excursion Rewards
                </span>
                <div className="text-4xl sm:text-5xl font-serif font-black text-amber-300 flex items-center justify-center gap-2 drop-shadow-md">
                  <Zap className="w-9 h-9 fill-amber-400 text-amber-300 animate-pulse" />
                  <span>+{VirtualFieldTripService.calculateTripXP(studentProgress, activeTrip.stops.length)} XP</span>
                </div>
                <p className="text-xs text-amber-200/90 font-bold">
                  Expedition Rank: <span className="text-white">Level {studentProfile.level} ({studentProfile.totalXP} Total XP)</span>
                </p>
              </motion.div>

              {/* Milestone Accomplishment List */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-slate-950/70 border border-white/10 p-4 rounded-2xl text-left space-y-2 text-xs"
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 block border-b border-white/10 pb-1.5">
                  Milestone Accomplishments
                </span>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      Micro-Checkpoints ({studentProgress.completedCheckpointIds.length} completed)
                    </span>
                    <span className="font-extrabold text-amber-300">+{studentProgress.completedCheckpointIds.length * 50} XP</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-200">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className={`w-4 h-4 ${studentProgress.exitSlip ? 'text-emerald-400' : 'text-slate-500'}`} />
                      Socratic Exit Slip Reflection
                    </span>
                    <span className={`font-extrabold ${studentProgress.exitSlip ? 'text-amber-300' : 'text-slate-500'}`}>
                      {studentProgress.exitSlip ? '+200 XP' : '0 XP'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-200">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className={`w-4 h-4 ${studentProgress.journal ? 'text-emerald-400' : 'text-slate-500'}`} />
                      Socratic Travel Journal Entry
                    </span>
                    <span className={`font-extrabold ${studentProgress.journal ? 'text-amber-300' : 'text-slate-500'}`}>
                      {studentProgress.journal ? '+150 XP' : '0 XP'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-200">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className={`w-4 h-4 ${studentProgress.completedStopIndices.length >= activeTrip.stops.length ? 'text-emerald-400' : 'text-slate-500'}`} />
                      All Route Stops Mastered
                    </span>
                    <span className={`font-extrabold ${studentProgress.completedStopIndices.length >= activeTrip.stops.length ? 'text-amber-300' : 'text-slate-500'}`}>
                      {studentProgress.completedStopIndices.length >= activeTrip.stops.length ? '+100 XP' : '0 XP'}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center gap-2 pt-2"
              >
                <button
                  type="button"
                  onClick={() => {
                    try {
                      confetti({
                        particleCount: 150,
                        spread: 90,
                        origin: { y: 0.5 }
                      });
                    } catch (e) {}
                  }}
                  className="w-full sm:flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Re-fire Celebration 🎉</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCelebrationOverlayOpen(false)}
                  className="w-full sm:flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-white/10"
                >
                  <span>Continue Expedition</span>
                </button>
              </motion.div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= INJECT EDUCATOR NOTE MODAL ================= */}
      <AnimatePresence>
        {isAddNoteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto relative text-slate-900"
            >
              <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-400 text-slate-950 rounded-xl">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-white">
                      {editingNoteId ? 'Edit Pedagogical Note' : 'Inject Educator Note'}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      Geographic Stop #{currentStop.stopNumber}: {currentStop.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEducatorNote} className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold uppercase text-slate-700">Author Name</label>
                    <input
                      type="text"
                      value={noteAuthorName}
                      onChange={e => setNoteAuthorName(e.target.value)}
                      required
                      placeholder="e.g. Dr. Sarah Johnson"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold uppercase text-slate-700">Role / Designation</label>
                    <input
                      type="text"
                      value={noteAuthorRole}
                      onChange={e => setNoteAuthorRole(e.target.value)}
                      placeholder="e.g. Lead Curriculum Specialist"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-700">Pedagogical Focus Category</label>
                  <select
                    value={notePedagogicalFocus}
                    onChange={e => setNotePedagogicalFocus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                  >
                    <option value="discussion_prompt">💬 Discussion Prompt (Socratic Engagement)</option>
                    <option value="historical_context">📜 Historical Context (Background & Era)</option>
                    <option value="scientific_insight">🔬 Scientific Insight (Phenomena & Data)</option>
                    <option value="misconception_alert">⚠️ Misconception Alert (Clarification)</option>
                    <option value="curriculum_connection">📚 Curriculum Connection (Standards Alignment)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-700">Custom Pedagogical Note Text</label>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    rows={4}
                    required
                    placeholder="Enter context-aware pedagogical guidance, questions, or misconception alerts for students visiting this location..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Geographic Milestone Lock Option */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noteIsMilestoneLocked}
                      onChange={e => setNoteIsMilestoneLocked(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      Require Geographic Milestone Completion to Unlock
                    </span>
                  </label>
                  <p className="text-[11px] text-amber-800 font-medium leading-normal pl-6">
                    When enabled, students must complete at least 1 micro-milestone checkpoint at this stop before this teacher note is revealed in the reader pane.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddNoteModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer min-h-[40px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5 min-h-[40px]"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>{editingNoteId ? 'Update Note' : 'Inject Note'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= ADD / EDIT INTERACTIVE ANNOTATION PIN MODAL ================= */}
      <AnimatePresence>
        {isAddAnnotationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto relative text-slate-900"
            >
              <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-white">
                      {editingAnnotationId ? 'Edit Educational Pin Annotation' : 'Pin Educational Note on View'}
                    </h3>
                    <p className="text-xs text-amber-300 font-medium">
                      Stop #{currentStop.stopNumber}: {currentStop.locationName}
                      {pendingClickCoords && ` • Map Position (${pendingClickCoords.xPercentage}%, ${pendingClickCoords.yPercentage}%)`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddAnnotationModalOpen(false);
                    setEditingAnnotationId(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAnnotation} className="p-5 sm:p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-800">Pin Title / Label *</label>
                  <input
                    type="text"
                    required
                    value={annotationTitle}
                    onChange={e => setAnnotationTitle(e.target.value)}
                    placeholder="e.g. Neoclassical Column Arches, Guildhall Clock Tower, Dairy Silo"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold uppercase text-slate-800">Annotation Category</label>
                    <select
                      value={annotationCategory}
                      onChange={e => setAnnotationCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                    >
                      <option value="historical_fact">📜 Historical Fact / Background</option>
                      <option value="architectural_detail">🏛️ Architectural / Geological Detail</option>
                      <option value="media_link">📷 Contextual Media / Image Link</option>
                      <option value="question_prompt">💬 Discussion Question / Prompt</option>
                      <option value="custom_label">🏷️ Custom Educational Label</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold uppercase text-slate-800">Author Name</label>
                    <input
                      type="text"
                      value={annotationAuthorName}
                      onChange={e => setAnnotationAuthorName(e.target.value)}
                      placeholder="e.g. Dr. Sarah Johnson, Student Name"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-800">Educational Note & Context *</label>
                  <textarea
                    required
                    rows={4}
                    value={annotationNote}
                    onChange={e => setAnnotationNote(e.target.value)}
                    placeholder="Enter details, observations, historical facts, or guiding questions for students inspecting this pinned point..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-800">Contextual Media URL (Optional)</label>
                  <input
                    type="url"
                    value={annotationMediaUrl}
                    onChange={e => setAnnotationMediaUrl(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/... or https://wikipedia.org/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                  />
                </div>

                {/* 30-Second Audio Description & Auto-Play Settings */}
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-amber-400/40 space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-amber-400" />
                      <div>
                        <h4 className="text-xs font-extrabold text-white">30-Second Landmark Audio Description</h4>
                        <p className="text-[10px] text-amber-300 font-mono">Auto-plays when student arrives at this milestone</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerate30sAudioScript}
                      className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-lg text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1"
                      title="Auto-generate a 30-second audio description script"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Draft Script</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                      <span>Audio Voice Script (~50-60 words / 30 seconds)</span>
                      <span className="font-mono text-amber-400">{annotationAudioText.split(/\s+/).filter(Boolean).length} words</span>
                    </div>
                    <textarea
                      rows={3}
                      value={annotationAudioText}
                      onChange={e => setAnnotationAudioText(e.target.value)}
                      placeholder="Enter a 30-second audio guide script that will be read aloud when students arrive at this landmark milestone..."
                      className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs font-medium text-slate-100 focus:ring-2 focus:ring-amber-400 focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-amber-300">Audio File URL (Optional MP3/Data URL)</label>
                    <input
                      type="text"
                      value={annotationAudioUrl}
                      onChange={e => setAnnotationAudioUrl(e.target.value)}
                      placeholder="e.g. https://... or leave empty to use natural TTS voice synthesis"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs font-mono text-slate-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200 select-none">
                      <input
                        type="checkbox"
                        checked={annotationAutoPlayOnArrive}
                        onChange={e => setAnnotationAutoPlayOnArrive(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-slate-700 bg-slate-950 cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-amber-400" />
                        <span>Auto-Play audio description when student arrives</span>
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        handlePlayLandmarkAudio(
                          'preview-audio',
                          annotationTitle || 'Landmark Audio',
                          annotationAuthorName || 'Educator',
                          annotationAudioText || annotationNote || 'This is a sample 30-second audio description for this landmark.',
                          annotationAudioUrl
                        )
                      }
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>{activeLandmarkAudio?.pinId === 'preview-audio' && activeLandmarkAudio.isPlaying ? 'Stop Test' : 'Test Listen'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddAnnotationModalOpen(false);
                      setEditingAnnotationId(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer min-h-[40px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5 min-h-[40px]"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>{editingAnnotationId ? 'Update Annotation Pin' : 'Drop Annotation Pin'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= ATTACH / EDIT MILESTONE MEDIA GALLERY ITEM MODAL ================= */}
      <AnimatePresence>
        {isAddMediaModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto relative text-slate-900"
            >
              <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-white">
                      {editingMediaId ? 'Edit Milestone Media Item' : 'Attach Media to Milestone Card'}
                    </h3>
                    <p className="text-xs text-amber-300 font-medium">
                      Stop #{currentStop.stopNumber}: {currentStop.locationName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMediaModalOpen(false);
                    setEditingMediaId(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMediaGalleryItem} className="p-5 sm:p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-800">Media Type *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { type: 'panorama_360', label: '360° Panorama', icon: '🌐' },
                      { type: 'photo', label: 'Detail Photo', icon: '📷' },
                      { type: 'video', label: 'Video Clip', icon: '🎥' },
                      { type: 'detail_diagram', label: 'Site Diagram', icon: '📐' }
                    ].map((t) => (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => setMediaTypeInput(t.type as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          mediaTypeInput === t.type
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-base">{t.icon}</span>
                        <span className="text-[11px] text-center leading-tight">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-800">Media Image / Panorama / Video URL *</label>
                  <input
                    type="url"
                    required
                    value={mediaUrlInput}
                    onChange={e => setMediaUrlInput(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/photo-... or 360 panoramic URL"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                  />
                  {/* Quick Fill Preset Sample URLs */}
                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-[10px]">
                    <span className="text-slate-400 font-bold shrink-0">Sample Presets:</span>
                    <button
                      type="button"
                      onClick={() => setMediaUrlInput('https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono shrink-0 cursor-pointer"
                    >
                      European Palace 360°
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaUrlInput('https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=80')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono shrink-0 cursor-pointer"
                    >
                      Gothic Architecture
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaUrlInput('https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono shrink-0 cursor-pointer"
                    >
                      Site Plan Diagram
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-800">Caption / Description *</label>
                  <input
                    type="text"
                    required
                    value={mediaCaptionInput}
                    onChange={e => setMediaCaptionInput(e.target.value)}
                    placeholder="e.g. 360° View of Grand Entrance Hall Corinthian Columns"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-800">Source / Credit Attribution (Optional)</label>
                  <input
                    type="text"
                    value={mediaCreditInput}
                    onChange={e => setMediaCreditInput(e.target.value)}
                    placeholder="e.g. UNESCO Cultural Archive, Royal Geographic Society"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMediaModalOpen(false);
                      setEditingMediaId(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer min-h-[40px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5 min-h-[40px]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{editingMediaId ? 'Update Media Item' : 'Attach to Milestone'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= FULL SCREEN MEDIA LIGHTBOX MODAL ================= */}
      <AnimatePresence>
        {selectedLightboxMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
            onClick={() => setSelectedLightboxMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-amber-500/40 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative text-white space-y-0"
              onClick={e => e.stopPropagation()}
            >
              {/* Lightbox Header */}
              <div className="p-4 sm:p-5 bg-slate-950 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold ${getMediaTypeBadge(selectedLightboxMedia.type).bg}`}>
                    {getMediaTypeBadge(selectedLightboxMedia.type).icon} {getMediaTypeBadge(selectedLightboxMedia.type).label}
                  </span>
                  <span className="text-xs text-amber-300 font-extrabold">
                    Stop #{currentStop.stopNumber}: {currentStop.locationName}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLightboxMedia(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lightbox Image / Panorama Content */}
              <div className="relative bg-black max-h-[60vh] sm:max-h-[70vh] flex items-center justify-center overflow-hidden">
                <img
                  src={selectedLightboxMedia.url}
                  alt={selectedLightboxMedia.caption}
                  className="max-h-[60vh] sm:max-h-[70vh] w-auto max-w-full object-contain mx-auto"
                />

                {selectedLightboxMedia.type === 'panorama_360' && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 px-4 py-2 rounded-2xl font-extrabold text-xs shadow-2xl flex items-center gap-2 border border-amber-300">
                    <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
                    <span>360° Panoramic High-Resolution View</span>
                  </div>
                )}
              </div>

              {/* Lightbox Footer Caption & Credit */}
              <div className="p-4 sm:p-5 bg-slate-950/95 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                    {selectedLightboxMedia.caption}
                  </h3>
                  {selectedLightboxMedia.credit && (
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Attribution / Credit: {selectedLightboxMedia.credit}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedLightboxMedia.type === 'panorama_360') {
                        const updatedStops = activeTrip.stops.map((stop, idx) => {
                          if (idx === currentStopIndex) {
                            return { ...stop, panoramaUrl: selectedLightboxMedia.url, mapType: 'panorama' as const };
                          }
                          return stop;
                        });
                        const updatedTrip = { ...activeTrip, stops: updatedStops };
                        setActiveTrip(updatedTrip);
                        setActiveViewerTab('map');
                        setMapType('hybrid');
                        setSelectedLightboxMedia(null);
                      } else {
                        setSelectedLightboxMedia(null);
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{selectedLightboxMedia.type === 'panorama_360' ? 'Set as Main 360° Panorama Stage' : 'Close Lightbox'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= DROP DIGITAL STICKY NOTE MODAL ================= */}
      <AnimatePresence>
        {isNewStickyNoteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsNewStickyNoteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-indigo-500/40 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative text-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 bg-slate-950 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500 text-white rounded-2xl shadow-lg">
                    <StickyNote className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Drop Collaborative Sticky Note</h3>
                    <p className="text-xs text-indigo-300 font-mono">
                      Stop #{currentStop.stopNumber}: {currentStop.locationName} ({newStickyXPercentage}%, {newStickyYPercentage}%)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewStickyNoteModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStickyNote} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>Note Message / Question / Observation *</span>
                  </label>
                  <textarea
                    rows={3}
                    value={newStickyText}
                    onChange={e => setNewStickyText(e.target.value)}
                    placeholder="Write a question, historical reflection, or key observation for fellow trippers..."
                    className="w-full bg-slate-950 border border-white/15 focus:border-indigo-400 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400 leading-relaxed"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Author Name</label>
                    <input
                      type="text"
                      value={newStickyAuthorName}
                      onChange={e => setNewStickyAuthorName(e.target.value)}
                      placeholder="e.g., Sarah M. / Mr. Ojiambo"
                      className="w-full bg-slate-950 border border-white/15 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Participant Role</label>
                    <select
                      value={newStickyAuthorRole}
                      onChange={e => setNewStickyAuthorRole(e.target.value as any)}
                      className="w-full bg-slate-950 border border-white/15 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="Teacher">👨‍🏫 Teacher / Educator</option>
                      <option value="Student">🎓 Student / Explorer</option>
                      <option value="Administrator">🏫 Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Sticky Note Color</label>
                    <div className="flex items-center gap-2 pt-1">
                      {(['yellow', 'blue', 'green', 'pink', 'purple', 'amber'] as const).map(color => {
                        const bgMap = {
                          yellow: 'bg-amber-300',
                          blue: 'bg-sky-400',
                          green: 'bg-emerald-400',
                          pink: 'bg-rose-400',
                          purple: 'bg-purple-400',
                          amber: 'bg-orange-400'
                        };
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewStickyColor(color)}
                            className={`w-7 h-7 rounded-full ${bgMap[color]} transition cursor-pointer flex items-center justify-center ${
                              newStickyColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'
                            }`}
                          >
                            {newStickyColor === color && <span className="text-slate-950 font-extrabold text-xs">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Note Purpose / Category</label>
                    <select
                      value={newStickyCategory}
                      onChange={e => setNewStickyCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-white/15 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="question">❓ Question</option>
                      <option value="insight">💡 Insight / Thought</option>
                      <option value="discovery">🔍 Field Discovery</option>
                      <option value="flag">🚩 Point of Interest</option>
                      <option value="general">📝 General Note</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewStickyNoteModalOpen(false)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-500/30"
                  >
                    <StickyNote className="w-4 h-4" />
                    <span>Post Sticky Note to Map</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= REAL-WORLD CAMERA AR VIEW MODAL OVERLAY ================= */}
      <AnimatePresence>
        {isCameraViewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden"
          >
            {/* Top Control Bar */}
            <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-amber-500/30 flex items-center justify-between flex-wrap gap-2 backdrop-blur-md shrink-0 z-30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-2xl shadow-lg font-bold flex items-center gap-1.5">
                  <Camera className="w-5 h-5 text-slate-950" />
                  <span className="text-xs font-extrabold uppercase tracking-wider hidden sm:inline">Camera AR View</span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>Stop #{currentStop.stopNumber}: {currentStop.locationName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold animate-pulse">
                      Live Physical Classroom Bridge
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    {currentStop.lat.toFixed(4)}° S, {currentStop.lng.toFixed(4)}° E • AR Heading: {arCompassHeading}° NE
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* AR Label Filters */}
                <div className="hidden lg:flex items-center gap-1 bg-slate-950 border border-white/15 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setArLabelFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
                      arLabelFilter === 'all' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    All Tags
                  </button>
                  <button
                    type="button"
                    onClick={() => setArLabelFilter('landmarks')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
                      arLabelFilter === 'landmarks' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    📍 Landmarks
                  </button>
                  <button
                    type="button"
                    onClick={() => setArLabelFilter('questions')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
                      arLabelFilter === 'questions' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    ❓ Socratic
                  </button>
                  <button
                    type="button"
                    onClick={() => setArLabelFilter('notes')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
                      arLabelFilter === 'notes' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    👨‍🏫 Educator Notes
                  </button>
                </div>

                {/* Compass Heading Adjuster */}
                <button
                  type="button"
                  onClick={() => setArCompassHeading((prev) => (prev + 45) % 360)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-white/10 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                  title="Rotate AR orientation compass alignment"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono text-[11px]">{arCompassHeading}°</span>
                </button>

                {/* Snap AR Photo Button */}
                <button
                  type="button"
                  onClick={handleTakeARSnapshot}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-400/20"
                  title="Capture photo of physical classroom with overlaid educational landmark labels"
                >
                  <Camera className="w-4 h-4 text-slate-950" />
                  <span>Snap AR Photo</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleCloseCameraARView}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
                  title="Close Camera View"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
              {arToastNotification && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-amber-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>{arToastNotification}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main AR Camera Viewport Stage */}
            <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center">
              {/* Camera Video Stream */}
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                  isCameraActive ? 'opacity-100' : 'opacity-20'
                }`}
              />

              {/* Hidden Canvas for Capturing Snapshots */}
              <canvas ref={cameraCanvasRef} className="hidden" />

              {/* Camera Error / Simulated Classroom Backdrop Fallback */}
              {!isCameraActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="p-4 bg-amber-400/10 border border-amber-400/30 text-amber-300 rounded-3xl backdrop-blur-md max-w-lg space-y-2">
                    <div className="flex items-center justify-center gap-2 text-amber-400 font-extrabold text-sm">
                      <Camera className="w-5 h-5 animate-pulse" />
                      <span>Simulated Classroom AR Camera Active</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {cameraError || 'Interactive simulated AR viewport enabled. Point and inspect real-world physical classroom objects with digital field trip landmark labels!'}
                    </p>
                  </div>
                </div>
              )}

              {/* HUD Target Finder Reticle & Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-8 border-16 border-slate-950/20">
                {/* HUD Top Corner Brackets */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 border-t-2 border-l-2 border-amber-400/80 rounded-tl-xl" />
                  <div className="w-10 h-10 border-t-2 border-r-2 border-amber-400/80 rounded-tr-xl" />
                </div>

                {/* Center Crosshair Target Finder */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center opacity-80">
                  <div className="relative flex items-center justify-center">
                    <Crosshair className="w-20 h-20 text-amber-400/60 animate-spin [animation-duration:12s]" />
                    <div className="absolute w-3 h-3 bg-amber-400 rounded-full animate-ping" />
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest mt-2 bg-slate-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                    Target Lock • {currentStop.locationName}
                  </span>
                </div>

                {/* HUD Bottom Corner Brackets */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 border-b-2 border-l-2 border-amber-400/80 rounded-bl-xl" />
                  <div className="w-10 h-10 border-b-2 border-r-2 border-amber-400/80 rounded-br-xl" />
                </div>
              </div>

              {/* OVERLAID CONTEXTUAL EDUCATIONAL LANDMARK TAGS IN 3D AR SPACE */}
              <div className="absolute inset-0 p-6 pointer-events-none flex flex-col justify-around">
                
                {/* AR Tag 1: Primary Landmark Identification */}
                {(arLabelFilter === 'all' || arLabelFilter === 'landmarks') && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="pointer-events-auto self-start ml-4 sm:ml-12 max-w-sm bg-slate-950/90 border-2 border-amber-400 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl space-y-1.5 cursor-pointer hover:border-amber-300 transition group transform hover:scale-105"
                    onClick={() => setActiveArLabelId('landmark-primary')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-extrabold text-[10px] rounded-md uppercase tracking-wider">
                        📍 AR Landmark
                      </span>
                      <span className="text-[10px] font-mono text-amber-300 font-bold">
                        Stop #{currentStop.stopNumber}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition">
                      {currentStop.locationName}
                    </h4>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {currentStop.readingPassage}
                    </p>
                    <div className="pt-1 text-[10px] text-amber-400 font-bold flex items-center gap-1">
                      <span>Click to expand educational facts & audio guide →</span>
                    </div>
                  </motion.div>
                )}

                {/* AR Tag 2: Socratic Observation Prompt */}
                {(arLabelFilter === 'all' || arLabelFilter === 'questions') && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="pointer-events-auto self-end mr-4 sm:mr-16 max-w-sm bg-indigo-950/90 border-2 border-indigo-400 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl space-y-1.5 cursor-pointer hover:border-indigo-300 transition group transform hover:scale-105"
                    onClick={() => setActiveArLabelId('socratic-prompt')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-indigo-500 text-white font-extrabold text-[10px] rounded-md uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Socratic Prompt
                      </span>
                      <span className="text-[10px] font-mono text-indigo-300 font-bold">
                        Classroom Reflection
                      </span>
                    </div>
                    <p className="text-xs text-indigo-100 font-semibold leading-relaxed">
                      ❓ "How do physical materials or structural shapes around your classroom compare to {currentStop.locationName}?"
                    </p>
                    <div className="pt-1 text-[10px] text-indigo-300 font-bold flex items-center gap-1">
                      <span>Tap to answer in excursion journal →</span>
                    </div>
                  </motion.div>
                )}

                {/* AR Tag 3: Educator Pedagogical Note Tag */}
                {(arLabelFilter === 'all' || arLabelFilter === 'notes') && currentStop.educatorNotes && currentStop.educatorNotes.length > 0 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="pointer-events-auto self-center max-w-md bg-amber-950/90 border-2 border-amber-500 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl space-y-1.5 cursor-pointer hover:border-amber-300 transition group transform hover:scale-105"
                    onClick={() => setActiveArLabelId('educator-note')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-extrabold text-[10px] rounded-md uppercase tracking-wider flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" /> Educator Note
                      </span>
                      <span className="text-[10px] font-mono text-amber-300 font-bold">
                        Contextual Teacher Guidance
                      </span>
                    </div>
                    <p className="text-xs text-amber-100 font-medium leading-relaxed">
                      👨‍🏫 "{currentStop.educatorNotes[0].noteText}"
                    </p>
                  </motion.div>
                )}
              </div>

              {/* EXPANDED AR TAG DETAIL OVERLAY CARD */}
              <AnimatePresence>
                {activeArLabelId && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="absolute z-40 inset-x-4 bottom-20 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-xl w-full bg-slate-900 border-2 border-amber-400 rounded-3xl p-5 shadow-2xl text-white space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-bold">
                          <Compass className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white">
                            {currentStop.locationName} Educational AR Card
                          </h4>
                          <p className="text-xs text-amber-300 font-mono">
                            Stop #{currentStop.stopNumber} • {activeTrip.title}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveArLabelId(null)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      <div className="p-3 bg-slate-950 rounded-2xl border border-white/10 space-y-1">
                        <span className="text-[10px] font-extrabold uppercase text-amber-400">
                          Reading Comprehension & Facts
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {currentStop.readingPassage}
                        </p>
                      </div>

                      {currentStop.checkpoints && currentStop.checkpoints.length > 0 && (
                        <div className="p-3 bg-indigo-950/60 rounded-2xl border border-indigo-500/30 space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase text-indigo-300">
                            Geographic Checkpoint Prompt
                          </span>
                          <p className="text-xs font-bold text-white">
                            {currentStop.checkpoints[0].label}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleReadAloud(currentStop.readingPassage)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-amber-400/30"
                      >
                        <Volume2 className="w-4 h-4 text-amber-400" />
                        <span>Listen to Voice Guide</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveArLabelId(null)}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition cursor-pointer"
                      >
                        Close Label
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CAPTURED AR SNAPSHOT PREVIEW DRAWER */}
              {arCapturedSnapshot && (
                <div className="absolute bottom-4 left-4 right-4 z-30 bg-slate-900/95 border border-amber-400/50 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={arCapturedSnapshot}
                      alt="AR Captured Physical Classroom Snapshot"
                      className="w-16 h-12 object-cover rounded-xl border border-amber-400/50 shrink-0"
                    />
                    <div className="truncate">
                      <h5 className="text-xs font-bold text-white truncate">
                        AR Landmark Snapshot Saved!
                      </h5>
                      <p className="text-[10px] text-amber-300 font-mono truncate">
                        Stop #{currentStop.stopNumber}: {currentStop.locationName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={arCapturedSnapshot}
                      download={`EduNexus_AR_Landmark_Stop_${currentStop.stopNumber}.png`}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setArCapturedSnapshot(null)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render All 9 Ecosystem Modals */}
      <VirtualFieldTripEcosystemModals
        activeTrip={activeTrip}
        currentStop={currentStop}
        isDiscoveryModalOpen={isDiscoveryModalOpen}
        setIsDiscoveryModalOpen={setIsDiscoveryModalOpen}
        discoveryCategory={discoveryCategory}
        setDiscoveryCategory={setDiscoveryCategory}
        onSelectTrip={handleSelectTrip}
        isCameraIntelModalOpen={isCameraIntelModalOpen}
        setIsCameraIntelModalOpen={setIsCameraIntelModalOpen}
        scanSampleType={scanSampleType}
        setScanSampleType={setScanSampleType}
        isAnalyzingScan={isAnalyzingScan}
        setIsAnalyzingScan={setIsAnalyzingScan}
        scanResult={scanResult}
        setScanResult={setScanResult}
        isMissionsModalOpen={isMissionsModalOpen}
        setIsMissionsModalOpen={setIsMissionsModalOpen}
        activeMissions={activeMissions}
        setActiveMissions={setActiveMissions}
        selectedMissionId={selectedMissionId}
        setSelectedMissionId={setSelectedMissionId}
        missionAnswerText={missionAnswerText}
        setMissionAnswerText={setMissionAnswerText}
        missionFeedback={missionFeedback}
        setMissionFeedback={setMissionFeedback}
        isNotebookModalOpen={isNotebookModalOpen}
        setIsNotebookModalOpen={setIsNotebookModalOpen}
        isGeneratingNotebook={isGeneratingNotebook}
        setIsGeneratingNotebook={setIsGeneratingNotebook}
        notebookOutput={notebookOutput}
        setNotebookOutput={setNotebookOutput}
        isAnalyticsModalOpen={isAnalyticsModalOpen}
        setIsAnalyticsModalOpen={setIsAnalyticsModalOpen}
        isParentPortalModalOpen={isParentPortalModalOpen}
        setIsParentPortalModalOpen={setIsParentPortalModalOpen}
        parentSignedName={parentSignedName}
        setParentSignedName={setParentSignedName}
        isParentConsentSigned={isParentConsentSigned}
        setIsParentConsentSigned={setIsParentConsentSigned}
        isStoryModalOpen={isStoryModalOpen}
        setIsStoryModalOpen={setIsStoryModalOpen}
        storyFormat={storyFormat}
        setStoryFormat={setStoryFormat}
        isGeneratingStory={isGeneratingStory}
        setIsGeneratingStory={setIsGeneratingStory}
        generatedStoryText={generatedStoryText}
        setGeneratedStoryText={setGeneratedStoryText}
        isEcoModalOpen={isEcoModalOpen}
        setIsEcoModalOpen={setIsEcoModalOpen}
        ecoLitterKg={ecoLitterKg}
        setEcoLitterKg={setEcoLitterKg}
        ecoSpeciesCount={ecoSpeciesCount}
        setEcoSpeciesCount={setEcoSpeciesCount}
        ecoCarbonSaved={ecoCarbonSaved}
        isLogisticsModalOpen={isLogisticsModalOpen}
        setIsLogisticsModalOpen={setIsLogisticsModalOpen}
        attendanceRoster={attendanceRoster}
        setAttendanceRoster={setAttendanceRoster}
      />

    </div>
  );
};
