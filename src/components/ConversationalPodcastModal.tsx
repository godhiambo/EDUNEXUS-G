import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Mic,
  Sparkles,
  Zap,
  HelpCircle,
  Gauge,
  Sliders,
  Globe,
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  Radio,
  Share2,
  RefreshCw,
  MessageSquare,
  Flame,
  Award
} from 'lucide-react';

interface DialogueTurn {
  speaker: string;
  speakerRole: string;
  text: string;
  simpleAnalogyUsed?: boolean;
  highlightedConcept?: string;
}

interface PodcastData {
  episodeTitle: string;
  overview: string;
  adaptedTone: string;
  adaptationDescription: string;
  recommendedPlaybackRate: number;
  isESLAdapted?: boolean;
  confidenceLevel?: string;
  dialogue: DialogueTurn[];
  keyTakeaways: string[];
  glossary?: Array<{
    term: string;
    simpleDefinition: string;
    translation?: string;
  }>;
}

interface ConversationalPodcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialsText: string;
  materialTitle: string;
  initialConfidence?: 'low' | 'medium' | 'high';
}

export default function ConversationalPodcastModal({
  isOpen,
  onClose,
  materialsText,
  materialTitle,
  initialConfidence = 'low'
}: ConversationalPodcastModalProps) {
  const { activeLearnerProfile } = useAccessibility();
  const isContextESL = activeLearnerProfile === 'esl';

  // Podcast Generation Settings
  const [topicConfidence, setTopicConfidence] = useState<'low' | 'medium' | 'high'>(initialConfidence);
  const [isESLEnabled, setIsESLEnabled] = useState<boolean>(isContextESL);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [podcastData, setPodcastData] = useState<PodcastData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Audio Playback Engine States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(0.85); // Default slower rate for adaptation
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sync ESL profile state when context changes
  useEffect(() => {
    if (isContextESL) {
      setIsESLEnabled(true);
    }
  }, [isContextESL]);

  // Load browser TTS voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      }
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Fetch or Synthesize Podcast from Server
  const handleSynthesizePodcast = useCallback(async () => {
    if (!materialsText || materialsText.trim().length === 0) {
      setError("No document text found to synthesize into a podcast.");
      return;
    }

    setIsLoading(true);
    setError(null);
    // Stop any existing speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentLineIndex(0);

    try {
      const response = await fetch('/api/synthesize-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialsText: materialsText.slice(0, 4000),
          title: materialTitle,
          topicConfidence: topicConfidence,
          isESLEnabled: isESLEnabled,
          targetLanguage: 'Swahili'
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to synthesize podcast');
      }

      const data: PodcastData = await response.json();
      setPodcastData(data);

      // Auto-set initial playback rate based on adaptive server recommendation
      const recommendedRate = data.recommendedPlaybackRate || (topicConfidence === 'low' || isESLEnabled ? 0.82 : 1.0);
      setPlaybackRate(recommendedRate);
    } catch (err: any) {
      console.error('Podcast Synthesis Error:', err);
      setError(err.message || 'Failed to generate podcast episode.');
    } finally {
      setIsLoading(false);
    }
  }, [materialsText, materialTitle, topicConfidence, isESLEnabled]);

  // Initial synthesis trigger on open if no data
  useEffect(() => {
    if (isOpen && !podcastData && !isLoading) {
      handleSynthesizePodcast();
    }
  }, [isOpen, podcastData, isLoading, handleSynthesizePodcast]);

  // Stop speech when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
    }
  }, [isOpen]);

  // Speech Synthesis player function for a specific line
  const speakLine = useCallback((lineIndex: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !podcastData) return;

    window.speechSynthesis.cancel();

    if (lineIndex < 0 || lineIndex >= podcastData.dialogue.length) {
      setIsPlaying(false);
      setCurrentLineIndex(0);
      return;
    }

    const turn = podcastData.dialogue[lineIndex];
    const utterance = new SpeechSynthesisUtterance(turn.text);

    // Pick distinct voices for Host Alex vs Dr. Sarah
    if (availableVoices.length > 0) {
      const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
      const pool = englishVoices.length > 0 ? englishVoices : availableVoices;

      if (turn.speaker.includes('Alex')) {
        // Host Alex: Female / higher pitch voice
        const alexVoice = pool.find(v => v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen')) || pool[0];
        utterance.voice = alexVoice;
        utterance.pitch = 1.15;
      } else {
        // Dr. Sarah: Calm educator / distinct pitch voice
        const sarahVoice = pool.find(v => v.name.includes('Natural') || v.name.includes('Daniel') || v.name.includes('Arthur') || v.name.includes('UK') || v.name.includes('Serena')) || pool[1] || pool[0];
        utterance.voice = sarahVoice;
        utterance.pitch = 0.88;
      }
    }

    utterance.rate = isMuted ? 0 : playbackRate;

    utterance.onend = () => {
      if (lineIndex + 1 < podcastData.dialogue.length) {
        // Add pause delay between speakers (longer pause if low confidence/ESL)
        const delay = (topicConfidence === 'low' || isESLEnabled) ? 700 : 350;
        setTimeout(() => {
          setCurrentLineIndex(lineIndex + 1);
          speakLine(lineIndex + 1);
        }, delay);
      } else {
        setIsPlaying(false);
        setCurrentLineIndex(0);
      }
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setCurrentLineIndex(lineIndex);

    // Auto-scroll transcript row into view
    const lineElement = document.getElementById(`podcast-line-${lineIndex}`);
    if (lineElement) {
      lineElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [podcastData, availableVoices, playbackRate, isMuted, topicConfidence, isESLEnabled]);

  const togglePlayPause = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !podcastData) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        setIsPlaying(true);
        speakLine(currentLineIndex);
      }
    }
  };

  const handleSkipNext = () => {
    if (!podcastData) return;
    const nextIdx = Math.min(currentLineIndex + 1, podcastData.dialogue.length - 1);
    setCurrentLineIndex(nextIdx);
    if (isPlaying) {
      speakLine(nextIdx);
    }
  };

  const handleSkipPrev = () => {
    if (!podcastData) return;
    const prevIdx = Math.max(currentLineIndex - 1, 0);
    setCurrentLineIndex(prevIdx);
    if (isPlaying) {
      speakLine(prevIdx);
    }
  };

  const handleCopyTranscript = () => {
    if (!podcastData) return;
    const text = `🎧 PODCAST EPISODE: ${podcastData.episodeTitle}\nOverview: ${podcastData.overview}\nAdaptation: ${podcastData.adaptationDescription}\n\nTRANSCRIPT:\n` +
      podcastData.dialogue.map(d => `[${d.speaker}]: ${d.text}`).join('\n\n') +
      `\n\nKEY TAKEAWAYS:\n` + podcastData.keyTakeaways.map((k, i) => `${i + 1}. ${k}`).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  const isAdaptedForAccessibility = topicConfidence === 'low' || isESLEnabled;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-950 text-white border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
                <Radio className="w-5 h-5 animate-pulse text-cyan-400" />
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>AI Conversational Podcast Studio</span>
                <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full font-black uppercase tracking-wider">
                  Adaptive Audio
                </span>
              </h3>
              <p className="text-xs text-slate-400 line-clamp-1">
                {materialTitle || 'File Library Materials'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTranscript}
              disabled={!podcastData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Copy Full Podcast Script"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Script'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Adaptive Controls Banner */}
        <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          
          {/* Topic Confidence Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-indigo-400" /> Topic Confidence:
            </span>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
              <button
                onClick={() => setTopicConfidence('low')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1 ${
                  topicConfidence === 'low'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HelpCircle className="w-3 h-3" /> Low (Simpler & Slower)
              </button>
              <button
                onClick={() => setTopicConfidence('medium')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1 ${
                  topicConfidence === 'medium'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3 h-3" /> Moderate
              </button>
              <button
                onClick={() => setTopicConfidence('high')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1 ${
                  topicConfidence === 'high'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3 h-3" /> High
              </button>
            </div>
          </div>

          {/* ESL Profile Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 hover:border-slate-700 transition">
              <Globe className={`w-3.5 h-3.5 ${isESLEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="text-[11px] font-bold">ESL Profile Active</span>
              <input
                type="checkbox"
                checked={isESLEnabled}
                onChange={(e) => setIsESLEnabled(e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            <button
              onClick={handleSynthesizePodcast}
              disabled={isLoading}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Synthesizing...' : 'Re-synthesize'}</span>
            </button>
          </div>
        </div>

        {/* Adaptive Active Status Banner */}
        {isAdaptedForAccessibility && (
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <strong className="font-extrabold text-amber-300">Adaptive Accessibility Engine:</strong>
              <span>Pacing slowed down to <strong className="text-white font-mono">{playbackRate}x speed</strong> with plain-English analogies for maximum clarity.</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-wider text-amber-400">
              {topicConfidence === 'low' && <span className="bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">Low Confidence Pace</span>}
              {isESLEnabled && <span className="bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-300">ESL Scaffold</span>}
            </div>
          </div>
        )}

        {/* Modal Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          
          {isLoading && (
            <div className="py-16 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <div className="absolute inset-2 rounded-full bg-slate-900 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h4 className="font-extrabold text-base text-white">Synthesizing Conversational Audio Podcast...</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {isAdaptedForAccessibility
                    ? "Applying low confidence pacing (0.82x), everyday analogies, and ESL vocabulary scaffolding..."
                    : "Structuring engaging two-speaker dialogue between Host Alex and Dr. Sarah..."}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs text-center space-y-2">
              <p className="font-bold">{error}</p>
              <button
                onClick={handleSynthesizePodcast}
                className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-500 transition cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && podcastData && (
            <>
              {/* Episode Header & Overview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      Episode 01
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-white mt-1.5">
                      {podcastData.episodeTitle}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Rate: <strong className="text-cyan-400">{playbackRate}x</strong></span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {podcastData.overview}
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                  <span className="flex items-center gap-1 text-slate-300">
                    💡 <strong className="text-white">Adaptation:</strong> {podcastData.adaptationDescription}
                  </span>
                  <span className="text-slate-500 text-[10px] font-mono">
                    {podcastData.dialogue.length} Dialogue Turns
                  </span>
                </div>
              </div>

              {/* Audio Controls Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Main Playback Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSkipPrev}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                    title="Previous Turn"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white flex items-center justify-center shadow-lg transition cursor-pointer"
                    title={isPlaying ? "Pause Podcast" : "Play Podcast"}
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
                  </button>

                  <button
                    onClick={handleSkipNext}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                    title="Next Turn"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                      }
                      setIsPlaying(false);
                      setCurrentLineIndex(0);
                    }}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition cursor-pointer"
                    title="Reset to Start"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Animated Waveform Indicator */}
                <div className="flex items-center gap-1 h-6 px-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono mr-1">AUDIO</span>
                  {[0.4, 0.9, 0.5, 0.8, 0.3, 0.7, 0.4].map((height, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-300 ${
                        isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
                      }`}
                      style={{ height: isPlaying ? `${Math.max(6, height * 20)}px` : '4px' }}
                    />
                  ))}
                </div>

                {/* Playback Speed Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Speed:</span>
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                    {[0.75, 0.82, 1.0, 1.25].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          setPlaybackRate(rate);
                          if (isPlaying) {
                            speakLine(currentLineIndex);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                          playbackRate === rate
                            ? 'bg-cyan-500 text-slate-950 font-extrabold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 text-slate-400 hover:text-white transition cursor-pointer"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Conversational Dialogue Transcript */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>Live Interactive Transcript</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Click any line to play directly
                  </span>
                </div>

                <div
                  ref={transcriptScrollRef}
                  className="space-y-2.5 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar"
                >
                  {podcastData.dialogue.map((turn, index) => {
                    const isCurrent = index === currentLineIndex && isPlaying;
                    const isAlex = turn.speaker.includes('Alex');

                    return (
                      <div
                        id={`podcast-line-${index}`}
                        key={index}
                        onClick={() => {
                          setCurrentLineIndex(index);
                          setIsPlaying(true);
                          speakLine(index);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isCurrent
                            ? 'bg-slate-900 border-cyan-500 shadow-md scale-[1.01]'
                            : index === currentLineIndex
                            ? 'bg-slate-900/80 border-indigo-500/50'
                            : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700'
                        }`}
                      >
                        {/* Speaker Avatar Icon */}
                        <div
                          className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-black text-xs shadow-xs ${
                            isAlex
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}
                        >
                          {isAlex ? 'HA' : 'DS'}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-white">
                                {turn.speaker}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                • {turn.speakerRole}
                              </span>
                            </div>

                            {turn.simpleAnalogyUsed && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-bold uppercase">
                                💡 Simple Analogy
                              </span>
                            )}
                          </div>

                          <p className={`text-xs leading-relaxed font-medium ${
                            isCurrent ? 'text-cyan-200 font-semibold' : 'text-slate-300'
                          }`}>
                            {turn.text}
                          </p>

                          {turn.highlightedConcept && (
                            <p className="text-[10px] text-indigo-300 bg-indigo-950/60 p-1.5 rounded-lg border border-indigo-800/50 font-mono mt-1">
                              📌 Key Concept: {turn.highlightedConcept}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Takeaways & ESL Glossary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                {/* Key Takeaways */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <h5 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Key Takeaways</span>
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {podcastData.keyTakeaways.map((takeaway, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold shrink-0">•</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ESL / Simplified Vocabulary Glossary */}
                {podcastData.glossary && podcastData.glossary.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <h5 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>ESL Vocabulary & Analogy Scaffolds</span>
                    </h5>
                    <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                      {podcastData.glossary.map((item, i) => (
                        <div key={i} className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-amber-300">{item.term}</span>
                            {item.translation && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                🌐 {item.translation}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            {item.simpleDefinition}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
