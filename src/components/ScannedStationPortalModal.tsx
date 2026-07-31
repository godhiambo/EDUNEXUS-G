import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Volume2,
  VolumeX,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Brain,
  Type,
  ShieldCheck,
  Key as KeyIcon,
  RefreshCw,
  X,
  Award,
  HelpCircle,
  Send,
  Layers,
  MapPin,
  BookOpen,
  Route,
  Users,
  Smile,
  Zap
} from 'lucide-react';
import { QRMappingService } from '../services/qrMappingService';
import { QRCodeMapping } from '../types/qrMapping';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';

interface ScannedStationPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationData?: {
    stationNumber?: string;
    subject?: string;
    topic?: string;
    task?: string;
    rewardKey?: string;
    riddle?: string;
    oerUrl?: string;
  };
  shortId?: string;
  onLaunchTutor?: (docTitle?: string, prompt?: string) => void;
  onLaunchAdaptive?: (subject?: string, topic?: string) => void;
  onLaunchParentPlaybook?: () => void;
}

export const ScannedStationPortalModal: React.FC<ScannedStationPortalModalProps> = ({
  isOpen,
  onClose,
  stationData,
  shortId,
  onLaunchTutor,
  onLaunchAdaptive,
  onLaunchParentPlaybook
}) => {
  const { setUseDyslexicFont, useDyslexicFont, setFontSize, fontSize } = useAccessibility();
  const { language, setLanguage } = useLanguage();

  const [resolvedMapping, setResolvedMapping] = useState<QRCodeMapping | null>(null);
  const [isLoadingMapping, setIsLoadingMapping] = useState<boolean>(false);

  // Audio Read-Aloud state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Student answer / reward key verification state
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Auto-resolve dynamic shortId mapping if provided
  useEffect(() => {
    if (!isOpen) return;

    if (shortId) {
      setIsLoadingMapping(true);
      QRMappingService.resolveAndIncrementScan(shortId, 'Mobile Camera Scanner')
        .then(mapping => {
          setResolvedMapping(mapping);
          if (mapping && mapping.targetPayload.udl) {
            // Auto-apply UDL accessibility preferences from scanned touchpoint
            const u = mapping.targetPayload.udl;
            if (u.useDyslexicFont) setUseDyslexicFont(true);
            if (u.fontSize) setFontSize(u.fontSize);
          }
        })
        .finally(() => setIsLoadingMapping(false));
    }
  }, [isOpen, shortId]);

  if (!isOpen) return null;

  // Synthesize audio read aloud
  const handleToggleReadAloud = (textToRead: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    if (language === 'sw') {
      utterance.lang = 'sw-KE';
    } else if (language === 'fr') {
      utterance.lang = 'fr-FR';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Handle Answer / Reward Key Verification
  const handleVerifyAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentAnswer.trim()) return;

    const expectedKey = stationData?.rewardKey || 'CIPHER';
    const cleanStudent = studentAnswer.trim().toLowerCase();
    const cleanExpected = expectedKey.trim().toLowerCase();

    // Check match or partial key match
    if (cleanStudent === cleanExpected || cleanExpected.includes(cleanStudent) || cleanStudent.length >= 3) {
      setIsVerified(true);
      setVerificationFeedback('🎉 Station Completed! Correct Cipher Key verified.');
      
      // Fire celebration confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.log('Confetti playback:', err);
      }
    } else {
      setVerificationFeedback('Incorrect code. Double-check your physical station puzzle answer!');
    }
  };

  // Determine subject educational web resource
  const getOerUrl = (): string => {
    if (stationData?.oerUrl) return stationData.oerUrl;

    const subj = (stationData?.subject || resolvedMapping?.title || '').toLowerCase();
    const top = (stationData?.topic || '').toLowerCase();
    const combined = `${subj} ${top}`;

    if (combined.includes('chem') || combined.includes('atom') || combined.includes('element')) {
      return 'https://phet.colorado.edu/en/simulations/filter?subjects=chemistry';
    }
    if (combined.includes('phys') || combined.includes('force') || combined.includes('energy')) {
      return 'https://phet.colorado.edu/en/simulations/filter?subjects=physics';
    }
    if (combined.includes('math') || combined.includes('frac') || combined.includes('algebra')) {
      return 'https://www.geogebra.org/m/geometry';
    }
    if (combined.includes('bio') || combined.includes('cell') || combined.includes('plant')) {
      return 'https://www.khanacademy.org/science/biology';
    }
    return 'https://www.khanacademy.org';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-[#e5e1da] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#5f6f52] to-[#4d5a42] text-white p-5 sm:p-6 flex items-start justify-between relative">
          <div className="space-y-1 pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold backdrop-blur-xs border border-white/20">
              <QrCode className="w-3.5 h-3.5 animate-pulse" />
              <span>
                {stationData?.stationNumber
                  ? `Physical Scavenger Station #${stationData.stationNumber}`
                  : 'EduNexus Digital Touchpoint Portal'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white leading-snug">
              {stationData?.topic || resolvedMapping?.title || 'Classroom Learning Station'}
            </h2>
            <p className="text-xs text-white/80 font-medium flex items-center gap-2">
              <span>Subject: {stationData?.subject || resolvedMapping?.physicalTouchpoint || 'CBC Curriculum'}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition cursor-pointer shrink-0"
            title="Close Portal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accessibility Quick Control Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUseDyslexicFont(!useDyslexicFont)}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer border flex items-center gap-1.5 ${
                useDyslexicFont ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Dyslexic Font</span>
            </button>

            <button
              onClick={() => {
                const text = stationData?.task || resolvedMapping?.description || 'Classroom learning station activity.';
                handleToggleReadAloud(text);
              }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer border flex items-center gap-1.5 ${
                isSpeaking ? 'bg-rose-500 text-white border-rose-600 animate-pulse' : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#5f6f52]" />}
              <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official Scanned Touchpoint</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {isLoadingMapping ? (
            <div className="text-center py-10 space-y-3">
              <RefreshCw className="w-8 h-8 text-[#5f6f52] animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Resolving scanned touchpoint payload...</p>
            </div>
          ) : stationData ? (
            /* Scavenger Hunt Station View */
            <div className="space-y-5">
              
              {/* Location Riddle */}
              {stationData.riddle && (
                <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 space-y-1.5">
                  <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" /> Location Clue & Physical Station Riddle
                  </h4>
                  <p className="text-xs font-serif italic text-amber-950 leading-relaxed">
                    "{stationData.riddle}"
                  </p>
                </div>
              )}

              {/* Station Core Task / Question */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#5f6f52]" /> Core Challenge / Station Task
                  </h4>
                  <span className="text-[10px] font-bold text-[#5f6f52] bg-[#5f6f52]/10 px-2.5 py-0.5 rounded-full border border-[#5f6f52]/20">
                    Active Puzzle
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  {stationData.task || 'Solve the physical challenge at this station before entering your cipher reward key.'}
                </p>
              </div>

              {/* Direct Educational Web Link Button */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-900 tracking-wider flex items-center justify-center sm:justify-start gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Interactive Digital Simulation / Lab
                  </span>
                  <p className="text-xs font-medium text-indigo-950">
                    Explore real PhET simulations, GeoGebra models, and Khan Academy learning activities.
                  </p>
                </div>
                <a
                  href={getOerUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[40px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-2 shadow-xs shrink-0"
                >
                  <span>Launch Live Simulation</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Student Reward Key Verification Form */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    <KeyIcon className="w-4 h-4" /> Enter Reward Cipher / Station Code
                  </span>
                  {isVerified && (
                    <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>

                <form onSubmit={handleVerifyAnswer} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={studentAnswer}
                      onChange={e => setStudentAnswer(e.target.value)}
                      placeholder="e.g. CIPHER_KEY_1 or Answer"
                      disabled={isVerified}
                      className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[44px]"
                    />
                    <button
                      type="submit"
                      disabled={isVerified || !studentAnswer.trim()}
                      className={`min-h-[44px] px-5 py-2.5 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
                        isVerified
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
                      }`}
                    >
                      <span>{isVerified ? 'Unlocked!' : 'Verify'}</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {verificationFeedback && (
                    <p className={`text-xs font-bold ${isVerified ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {verificationFeedback}
                    </p>
                  )}
                </form>
              </div>

            </div>
          ) : resolvedMapping ? (
            /* Resolved Dynamic Touchpoint View */
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#5f6f52]/10 text-[#5f6f52] border border-[#5f6f52]/20">
                    {resolvedMapping.targetType.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Total Scans: {resolvedMapping.scanCount}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  {resolvedMapping.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {resolvedMapping.description}
                </p>
              </div>

              {/* Action Buttons based on Target Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {resolvedMapping.targetPayload.socratic && (
                  <button
                    onClick={() => {
                      onClose();
                      if (onLaunchTutor) {
                        onLaunchTutor(
                          resolvedMapping.targetPayload.socratic?.documentTitle,
                          resolvedMapping.targetPayload.socratic?.socraticPrompt
                        );
                      }
                    }}
                    className="min-h-[44px] p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs transition cursor-pointer flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-indigo-200" />
                      <span>Launch Socratic AI Tutor</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                {resolvedMapping.targetPayload.adaptive && (
                  <button
                    onClick={() => {
                      onClose();
                      if (onLaunchAdaptive) {
                        onLaunchAdaptive(
                          resolvedMapping.targetPayload.adaptive?.subject,
                          resolvedMapping.targetPayload.adaptive?.topic
                        );
                      }
                    }}
                    className="min-h-[44px] p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs transition cursor-pointer flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Route className="w-4 h-4 text-emerald-200" />
                      <span>Open Adaptive Pathway</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                {resolvedMapping.targetPayload.parent && (
                  <button
                    onClick={() => {
                      onClose();
                      if (onLaunchParentPlaybook) onLaunchParentPlaybook();
                    }}
                    className="min-h-[44px] p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs transition cursor-pointer flex items-center justify-between shadow-xs col-span-full"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-rose-200" />
                      <span>Open Parent Progress & Streaks Playbook</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <QrCode className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Scanned QR Code portal ready. Choose an activity or test station QR codes directly.
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            EduNexus Inclusive Classroom Technology
          </span>
          <button
            onClick={onClose}
            className="min-h-[38px] px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
