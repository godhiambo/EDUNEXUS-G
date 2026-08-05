import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  X, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Tv, 
  Gamepad2, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  Cpu, 
  Layers, 
  Video as VideoIcon, 
  Image as ImageIcon, 
  HelpCircle, 
  QrCode, 
  ExternalLink,
  ChevronRight,
  Clock,
  UploadCloud,
  FileVideo,
  Maximize,
  Minimize,
  Sliders,
  Type
} from 'lucide-react';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSandbox: () => void;
  initialTab?: 'video' | 'sandbox';
  initialVideoType?: 'overview' | 'howto' | 'custom';
  youtubeUrl?: string;
}

interface VideoScene {
  time: number;
  timestampStr: string;
  title: string;
  module: string;
  caption: string;
  icon: React.ElementType;
  accentColor: string;
  previewImage: string;
  keyHighlights: string[];
}

const OVERVIEW_VIDEO_SCENES: VideoScene[] = [
  {
    time: 0,
    timestampStr: '0:00',
    title: 'The Modern Teacher Paradox',
    module: 'Overview',
    caption: 'Modern teaching feels like three full-time jobs: planning lessons, analyzing data, and designing resources.',
    icon: Clock,
    accentColor: 'from-amber-500 to-rose-500',
    previewImage: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['Lesson Planning Overload', 'Manual Data Analysis', 'Resource Creation Strain']
  },
  {
    time: 7,
    timestampStr: '0:07',
    title: 'Welcome to EduNexus AI Ecosystem',
    module: 'Platform Intro',
    caption: 'But what if one platform automated the heavy lifting? Welcome to the EduNexus AI ecosystem.',
    icon: Sparkles,
    accentColor: 'from-emerald-400 to-teal-500',
    previewImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['4 Unified Workspaces', 'Unified Data Layer', 'Automated Heavy Lifting']
  },
  {
    time: 13,
    timestampStr: '0:13',
    title: 'Real-time Class Dashboard',
    module: 'Dashboard Workspace',
    caption: 'First up: The Dashboard. It tracks class competency and spots learning gaps in real-time.',
    icon: Layers,
    accentColor: 'from-teal-400 to-cyan-500',
    previewImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['Competency Trajectory', 'Learning Gap Identification', 'Document Usage Analytics']
  },
  {
    time: 19,
    timestampStr: '0:19',
    title: 'CBC & KCSE Assessment Generator',
    module: 'Assessment Studio',
    caption: 'Next: The Assessment Generator. Creates quizzes mapped exactly to your local standards—a process called curriculum alignment.',
    icon: BookOpen,
    accentColor: 'from-blue-500 to-indigo-500',
    previewImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['Kenyan CBC & KCSE Alignment', 'Multiple Choice & Rubrics', 'Instant Diagnostic Feedback']
  },
  {
    time: 26,
    timestampStr: '0:26',
    title: 'Cinematic Video Studio',
    module: 'Video Production',
    caption: 'On the creative side: The Video Studio generates cinematic documentary lessons, eliminating the need for generic stock media.',
    icon: VideoIcon,
    accentColor: 'from-purple-500 to-pink-500',
    previewImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['Custom Documentary Stories', 'Automated Storyboarding', 'No Stock Media Required']
  },
  {
    time: 33,
    timestampStr: '0:33',
    title: 'Textbook Image Studio',
    module: 'Visual Assets',
    caption: 'While the Image Studio crafts precise, textbook-quality diagrams tailored exactly to your daily lesson.',
    icon: ImageIcon,
    accentColor: 'from-amber-400 to-orange-500',
    previewImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['Volcano & Anatomy Diagrams', 'Edu Pencil & Watercolor Styles', 'Vector Quality Visuals']
  },
  {
    time: 39,
    timestampStr: '0:39',
    title: 'Socratic EduNexus AI Tutor',
    module: 'Adaptive Learning',
    caption: "Then there's the EduNexus AI Tutor. It asks targeted questions to guide students to the solution—a Socratic dialogue engine.",
    icon: HelpCircle,
    accentColor: 'from-emerald-400 to-emerald-600',
    previewImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['Guided Inquiry Dialogue', 'Mastery-Focused Pathways', 'Socratic Questioning']
  },
  {
    time: 46,
    timestampStr: '0:46',
    title: 'QR Touchpoint Studio',
    module: 'Physical-to-Digital',
    caption: 'Finally: The QR Touchpoint Studio. It bridges your physical and digital classroom by linking printed worksheets directly to interactive nodes.',
    icon: QrCode,
    accentColor: 'from-cyan-400 to-blue-600',
    previewImage: 'https://images.unsplash.com/photo-1595079672139-cee25815d082?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['Worksheet QR Linking', 'Scavenger Hunt Nodes', 'Printed & Digital Integration']
  },
  {
    time: 54,
    timestampStr: '0:54',
    title: 'The Complete Educational Studio',
    module: 'Empowerment',
    caption: 'By centralizing everything from video generation to adaptive tutoring, EduNexus transforms a solitary teacher into a fully equipped educational production studio.',
    icon: Cpu,
    accentColor: 'from-emerald-400 via-teal-300 to-cyan-400',
    previewImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['Solo Teacher to Full Studio', 'Massive Time Savings', 'Continuous Mastery Track']
  }
];

const HOWTO_PEDAGOGY_SCENES: VideoScene[] = [
  {
    time: 0,
    timestampStr: '0:00',
    title: 'Pedagogical Intelligence & Standards Deep Dive',
    module: 'How-To Intro',
    caption: 'Welcome to the EduNexus How-To Guide. Learn how to leverage our AI engines for CBC alignment, 5E inquiry models, Socratic tutoring, and UDL accommodations.',
    icon: BookOpen,
    accentColor: 'from-blue-500 to-indigo-500',
    previewImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['Kenyan CBC Framework', '5E Lesson Structure', 'UDL Modifications']
  },
  {
    time: 8,
    timestampStr: '0:08',
    title: 'How-To: CBC Strand Mapping & Outcome Pulling',
    module: 'Curriculum Alignment',
    caption: 'Step 1: Select your Subject, Grade Level, and Topic. The AI automatically pulls specific learning outcomes (SLOs), core competencies, and PCIs.',
    icon: Sparkles,
    accentColor: 'from-emerald-400 to-teal-500',
    previewImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['Strand & Sub-strand Auto-pull', 'SLO Verification', 'Values & PCIs Integration']
  },
  {
    time: 18,
    timestampStr: '0:18',
    title: 'How-To: 5E Inquiry-Based Lesson Structuring',
    module: 'Instructional Models',
    caption: 'Step 2: Choose the 5E Model. Watch as Engage, Explore, Explain, Elaborate, and Evaluate phases are populated with hands-on learner activities.',
    icon: Layers,
    accentColor: 'from-purple-500 to-pink-500',
    previewImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['5E Model Phases', 'Learner-Centered Activities', 'Real-time Differentiating']
  },
  {
    time: 28,
    timestampStr: '0:28',
    title: 'How-To: Configuring Socratic AI Tutors',
    module: 'Adaptive Tutors',
    caption: 'Step 3: Open the AI Tutor Studio. Select Socratic Dialogue to guide students with probing questions instead of revealing direct answers.',
    icon: HelpCircle,
    accentColor: 'from-teal-400 to-cyan-500',
    previewImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['Socratic Questioning Mode', 'Scaffolded Hinting', 'Mastery Feedback Loops']
  },
  {
    time: 38,
    timestampStr: '0:38',
    title: 'How-To: UDL Accommodations & Rubrics',
    module: 'Inclusive Design',
    caption: 'Step 4: Enable Universal Design for Learning (UDL). Generate customized support for visual learners, non-native speakers, and remedial scaffolding.',
    icon: Cpu,
    accentColor: 'from-amber-400 to-orange-500',
    previewImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['UDL Differentiation', '4-Tier Assessment Rubrics', 'Diverse Learning Needs']
  },
  {
    time: 48,
    timestampStr: '0:48',
    title: 'How-To: Exporting Print-Ready Worksheets',
    module: 'Outputs & Sync',
    caption: 'Step 5: Export your finished documents into print-ready A4 PDFs, editable Word files, or Classic Handwritten Notebook style for offline printing.',
    icon: Layers,
    accentColor: 'from-emerald-400 via-teal-300 to-cyan-400',
    previewImage: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80',
    keyHighlights: ['A4 & Word Export', 'Handwritten Notebook Canvas', 'Offline Rural Print Readiness']
  }
];

export const DemoVideoModal: React.FC<DemoVideoModalProps> = ({
  isOpen,
  onClose,
  onOpenSandbox,
  initialTab = 'video',
  initialVideoType = 'overview',
  youtubeUrl = 'https://www.youtube.com/embed/D7cpYYgr-6E'
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'sandbox'>(initialTab);
  const [videoType, setVideoType] = useState<'overview' | 'howto' | 'custom'>(initialVideoType);
  const [configuredYouTubeUrl, setConfiguredYouTubeUrl] = useState<string>(youtubeUrl);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  useEffect(() => {
    if (youtubeUrl) {
      setConfiguredYouTubeUrl(youtubeUrl);
    }
  }, [youtubeUrl]);

  const formatYouTubeEmbedUrl = (rawUrl: string): string => {
    if (!rawUrl) return 'https://www.youtube.com/embed/D7cpYYgr-6E';
    const trimmed = rawUrl.trim();
    if (trimmed.includes('youtube.com/embed/')) {
      return trimmed;
    }
    const match = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&enablejsapi=1`;
    }
    return trimmed;
  };

  // Custom Uploaded Video State
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [customVideoName, setCustomVideoName] = useState<string | null>(null);
  const [customVideoDuration, setCustomVideoDuration] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeScenes = videoType === 'overview' ? OVERVIEW_VIDEO_SCENES : HOWTO_PEDAGOGY_SCENES;
  const totalDuration = videoType === 'custom' ? (customVideoDuration || 60) : (videoType === 'overview' ? 62 : 58);

  // Synchronize active scene based on currentTime
  const currentSceneIndex = activeScenes.reduce((acc, scene, index) => {
    if (currentTime >= scene.time) return index;
    return acc;
  }, 0);

  const currentScene = activeScenes[currentSceneIndex];

  // Handle uploaded custom video file selection
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (customVideoUrl) {
        URL.revokeObjectURL(customVideoUrl);
      }
      const url = URL.createObjectURL(file);
      setCustomVideoUrl(url);
      setCustomVideoName(file.name);
      setVideoType('custom');
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  // Speech synthesis for video narration
  const speakCaption = (text: string) => {
    if (!speechEnabled || isMuted || typeof window === 'undefined' || !('speechSynthesis' in window) || videoType === 'custom') return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05 * playbackSpeed;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis not available:', err);
    }
  };

  // Sync playback speed with video ref
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, videoType]);

  // Synthetic timer for interactive scene walkthroughs
  useEffect(() => {
    if (videoType === 'custom') return; // Managed by <video> element events

    if (isPlaying) {
      const intervalMs = Math.round(1000 / playbackSpeed);
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
            return totalDuration;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalDuration, videoType, playbackSpeed]);

  // Trigger caption voice when scene changes during play
  useEffect(() => {
    if (isPlaying && currentScene && videoType !== 'custom') {
      speakCaption(currentScene.caption);
    }
  }, [currentSceneIndex, isPlaying, videoType]);

  const handlePlayPause = () => {
    if (videoType === 'custom' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (currentTime >= totalDuration) {
      setCurrentTime(0);
    }
    const nextPlayState = !isPlaying;
    setIsPlaying(nextPlayState);
    if (nextPlayState && currentScene) {
      speakCaption(currentScene.caption);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoType === 'custom' && videoRef.current) {
      videoRef.current.currentTime = time;
    } else if (isPlaying && currentScene) {
      speakCaption(currentScene.caption);
    }
  };

  const toggleFullScreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(err => {
        console.warn('Fullscreen error:', err);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Exit fullscreen error:', err);
      });
      setIsFullScreen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      {/* Hidden File Input for Custom Demo Video Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleVideoUpload} 
        accept="video/mp4,video/webm,video/ogg,video/quicktime" 
        className="hidden" 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-[#081722] border border-slate-800 rounded-3xl max-w-4xl w-full text-white shadow-2xl relative overflow-hidden my-auto"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider">
                EduNexus Video Showcase
              </span>
              <span className="text-xs text-slate-400">Interactive & Uploaded Demo Media</span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-black text-white mt-0.5">
              Platform Walkthrough & Smooth Interactive Demo
            </h2>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Mode Switcher Tabs */}
            <div className="p-1 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => setActiveTab('video')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'video'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Watch Video</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('sandbox');
                  setIsPlaying(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'sandbox'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Interactive Sandbox</span>
              </button>
            </div>

            <button
              onClick={() => {
                setIsPlaying(false);
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Video Player Mode */}
        {activeTab === 'video' && (
          <div className="p-4 sm:p-6 space-y-4">
            
            {/* Video Selector & Upload Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 px-1 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lesson Mode:</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setVideoType('overview');
                    setCurrentTime(0);
                    setIsPlaying(false);
                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                    videoType === 'overview'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>YouTube Demo Video</span>
                </button>

                <button
                  onClick={() => {
                    setVideoType('howto');
                    setCurrentTime(0);
                    setIsPlaying(false);
                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                    videoType === 'howto'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>How-To Pedagogical Guide</span>
                </button>

                {/* Upload Custom Demo Video Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                    videoType === 'custom'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30'
                  }`}
                  title="Upload a custom demo video (.mp4, .webm, .mov)"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{customVideoName ? `Custom Video` : `Upload Demo Video`}</span>
                </button>
              </div>
            </div>

            {/* SCREEN CANVAS / FOREGROUND VIDEO PLAYER */}
            <div 
              ref={playerContainerRef}
              className="relative aspect-video rounded-2xl bg-black border border-slate-800 overflow-hidden group shadow-2xl flex flex-col justify-between p-3 sm:p-5 transform-gpu"
            >
              
              {/* Option A: YouTube Official Demo Video Embed */}
              {videoType === 'overview' ? (
                <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black">
                  <iframe
                    className="w-full h-full border-0 rounded-2xl"
                    src={formatYouTubeEmbedUrl(configuredYouTubeUrl || youtubeUrl)}
                    title="EduNexus AI Tutor YouTube Demo Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              ) : videoType === 'custom' && customVideoUrl ? (
                <video
                  ref={videoRef}
                  src={customVideoUrl}
                  playsInline
                  className="absolute inset-0 w-full h-full object-contain bg-black z-0"
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime);
                    }
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      setCustomVideoDuration(videoRef.current.duration);
                    }
                  }}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : videoType === 'custom' && !customVideoUrl ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950 z-0 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <FileVideo className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h3 className="text-sm font-bold text-white">No Custom Demo Video Loaded</h3>
                    <p className="text-xs text-slate-400">Upload any video file (.mp4, .webm, .mov) to play directly in smooth high-definition mode.</p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Select & Upload Video File</span>
                  </button>
                </div>
              ) : (
                /* Option C: Interactive Walkthrough Scene Media */
                <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                  <img 
                    src={currentScene.previewImage} 
                    alt={currentScene.title}
                    className="w-full h-full object-cover transition-all duration-700 scale-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60" />
                </div>
              )}

              {/* Top Watermark & Scene Module Badge (Only for Walkthrough/Custom modes) */}
              {videoType !== 'overview' && (
                <div className="relative z-10 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-white block leading-tight">
                        {videoType === 'custom'
                          ? (customVideoName || 'Uploaded Demo Video')
                          : 'How-To: Pedagogical Deep Dive'}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium">
                        {videoType === 'custom' ? 'Direct HTML5 Video Engine' : currentScene?.module}
                      </span>
                    </div>
                  </div>

                  <div className="px-3 py-1 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 shadow-md">
                    <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                    <span>
                      {Math.floor(currentTime / 60)}:{('0' + Math.floor(currentTime % 60)).slice(-2)} / {Math.floor(totalDuration / 60)}:{('0' + Math.floor(totalDuration % 60)).slice(-2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Center Play Button Overlay when paused (Walkthrough/Custom modes) */}
              {videoType !== 'overview' && !isPlaying && (
                <div className="relative z-10 my-auto text-center pointer-events-auto">
                  <button
                    onClick={handlePlayPause}
                    className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(16,185,129,0.6)] transition hover:scale-110 cursor-pointer active:scale-95"
                  >
                    <Play className="w-8 h-8 fill-slate-950 ml-1" />
                  </button>
                </div>
              )}

              {/* Subtitle / Closed Captions Overlay at Bottom of Video Frame */}
              {videoType !== 'overview' && showSubtitles && currentScene && videoType !== 'custom' && (
                <div className="relative z-10 my-auto sm:my-0 text-center max-w-xl mx-auto space-y-1.5 pointer-events-none">
                  <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-3 backdrop-blur-md text-xs sm:text-sm text-emerald-300 font-bold leading-relaxed shadow-xl inline-block px-4">
                    "{currentScene.caption}"
                  </div>
                </div>
              )}

              {/* Bottom Video Controls & Scrubber Bar (Walkthrough/Custom modes) */}
              {videoType !== 'overview' && (
                <div className="relative z-10 space-y-2 pt-2 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-2 rounded-xl backdrop-blur-sm">
                  
                  {/* Timeline Scrubber Bar */}
                  <div 
                    className="relative h-2 bg-slate-800/80 hover:h-3 rounded-full cursor-pointer overflow-hidden transition-all duration-200" 
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = (e.clientX - rect.left) / rect.width;
                      handleSeek(Math.round(pct * totalDuration));
                    }}
                  >
                    <div 
                      className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-150"
                      style={{ width: `${Math.min(100, Math.max(0, (currentTime / (totalDuration || 1)) * 100))}%` }}
                    />
                  </div>

                  {/* Controls Row */}
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Play/Pause Button */}
                      <button
                        onClick={handlePlayPause}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer border border-slate-700/80"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      </button>

                      {/* Replay */}
                      <button
                        onClick={() => handleSeek(0)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Replay from start"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      {/* Mute/Voice Toggle */}
                      {videoType !== 'custom' && (
                        <button
                          onClick={() => {
                            setSpeechEnabled(!speechEnabled);
                            if (speechEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                              window.speechSynthesis.cancel();
                            }
                          }}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            speechEnabled ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title={speechEnabled ? 'Mute AI Voiceover' : 'Enable AI Voiceover'}
                        >
                          {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                      )}

                      {/* Subtitle Toggle */}
                      {videoType !== 'custom' && (
                        <button
                          onClick={() => setShowSubtitles(!showSubtitles)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            showSubtitles ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title={showSubtitles ? 'Hide Closed Captions' : 'Show Closed Captions'}
                        >
                          <Type className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Right Controls: Playback Speed & Fullscreen */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
                        {[1, 1.25, 1.5, 2].map(speed => (
                          <button
                            key={speed}
                            onClick={() => setPlaybackSpeed(speed)}
                            className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                              playbackSpeed === speed ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={toggleFullScreen}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer border border-slate-800"
                        title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
                      >
                        {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Chapter Scene Buttons (for Walkthrough/How-To modes) */}
            {videoType !== 'custom' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Jump to Scene Module</span>
                  <span>{activeScenes.length} Interactive Scenes</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {activeScenes.map((scene, idx) => {
                    const isActive = currentSceneIndex === idx;
                    const IconComp = scene.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSeek(scene.time)}
                        className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isActive
                            ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-md'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <IconComp className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span className="text-[10px] font-mono">{scene.timestampStr}</span>
                        </div>
                        <span className="text-xs font-bold line-clamp-1">{scene.module}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Call to Action */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <h4 className="text-sm font-bold text-white">Ready to test these tools yourself?</h4>
                <p className="text-xs text-slate-400">Try our instant offline sandbox mode or launch the live platform workspaces.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('sandbox')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Interactive Sandbox</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenSandbox();
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Launch Live Platform</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Interactive Sandbox Demo */}
        {activeTab === 'sandbox' && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg">
                <Gamepad2 className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-bold font-serif text-white">EduNexus Live Offline Sandbox</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Test out CBC Lesson Planning, Schemes of Work, Assessment Generation, and Socratic AI Tutors directly without registering an account first.
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenSandbox();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2"
                >
                  <span>Launch Live Sandbox Mode</span>
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveTab('video')}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-2"
                >
                  <Tv className="w-4 h-4 text-emerald-400" />
                  <span>Back to Video</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default DemoVideoModal;
