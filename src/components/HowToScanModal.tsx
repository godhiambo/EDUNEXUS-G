import React, { useState } from 'react';
import {
  Camera,
  QrCode,
  Smartphone,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  X,
  Users,
  GraduationCap,
  ArrowRight,
  Zap,
  BookOpen,
  Eye,
  Volume2,
  ShieldAlert,
  SunMedium,
  Focus,
  Key,
  ExternalLink
} from 'lucide-react';

interface HowToScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner?: () => void;
  onOpenSamplePortal?: () => void;
}

export const HowToScanModal: React.FC<HowToScanModalProps> = ({
  isOpen,
  onClose,
  onOpenScanner,
  onOpenSamplePortal
}) => {
  const [activeRoleTab, setActiveRoleTab] = useState<'student' | 'teacher' | 'troubleshoot'>('student');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-900 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-inner">
              <Camera className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
                  How to Scan QR Stations
                </h2>
                <span className="bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                  Interactive Guide
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Step-by-step camera instructions for physical textbook touchpoints & classroom station portals
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center relative z-10"
            title="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audience Navigation Tabs */}
        <div className="bg-slate-100/80 p-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveRoleTab('student')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap min-h-[40px] ${
              activeRoleTab === 'student'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>For Students</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-extrabold">
              4 Steps
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRoleTab('teacher')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap min-h-[40px] ${
              activeRoleTab === 'teacher'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>For Teachers</span>
            <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-md font-extrabold">
              Setup & Print
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRoleTab('troubleshoot')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap min-h-[40px] ${
              activeRoleTab === 'troubleshoot'
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Camera & Light Tips</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">

          {/* TAB 1: FOR STUDENTS */}
          {activeRoleTab === 'student' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-xs text-emerald-950 space-y-1">
                  <span className="font-bold block text-emerald-900 text-sm">
                    No App Download Required!
                  </span>
                  <p>
                    EduNexus QR Station codes use universal camera technology. You can use your mobile phone/tablet camera or the built-in EduNexus Web Scanner.
                  </p>
                </div>
              </div>

              {/* Step Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Step 1 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-3 relative hover:border-emerald-300 transition shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                      1
                    </span>
                    <QrCode className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-850">Find Physical QR Tag</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Locate the square QR matrix printed on textbook margins, classroom station posters, desk stickers, or scavenger hunt clues.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Look for the EduNexus logo badge</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-3 relative hover:border-emerald-300 transition shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                      2
                    </span>
                    <Smartphone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-850">Open Camera App</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Open your device native camera app (iOS or Android) or click the camera scanner icon inside the EduNexus navigation bar.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Works on phones, iPads & Chromebooks</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-3 relative hover:border-emerald-300 transition shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                      3
                    </span>
                    <Focus className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-850">Align Viewfinder (6-12 inches)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hold device steady 15 to 30 cm away. Keep all 4 corner positioning marks visible inside the camera frame until recognized.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Avoid shadows & harsh lighting reflections</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-3 relative hover:border-emerald-300 transition shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                      4
                    </span>
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-850">Tap Link to Launch Portal</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tap the popup URL banner on your screen. The station portal will instantly unlock Socratic tutoring, audio read-alouds, or riddle answers!
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Earn station XP & unlock reward keys</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: FOR TEACHERS */}
          {activeRoleTab === 'teacher' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-teal-50/80 border border-teal-200/80 rounded-2xl p-4 flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                <div className="text-xs text-teal-950 space-y-1">
                  <span className="font-bold block text-teal-900 text-sm">
                    Dynamic Short Redirection Engine
                  </span>
                  <p>
                    Teachers can map physical QR codes once to a short ID. You can update the target document, Socratic prompt, or UDL settings anytime without reprinting posters!
                  </p>
                </div>
              </div>

              {/* Teacher Instructions List */}
              <div className="space-y-3">
                
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3.5 hover:border-teal-300 transition">
                  <div className="p-2.5 bg-teal-100 text-teal-800 rounded-xl font-bold text-xs shrink-0">
                    01
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-850">Generate Station Touchpoints</h5>
                    <p className="text-xs text-slate-600">
                      Navigate to <strong>QR Mapping Studio</strong> or <strong>Classroom Scavenger Hunt Studio</strong>. Create dynamic target mappings (Socratic prompts, UDL toggles, Adaptive Paths, or OER links).
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3.5 hover:border-teal-300 transition">
                  <div className="p-2.5 bg-teal-100 text-teal-800 rounded-xl font-bold text-xs shrink-0">
                    02
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-850">Print High-Resolution Posters</h5>
                    <p className="text-xs text-slate-600">
                      Click <strong>Print Classroom Flyer</strong> or <strong>Download High-Res PNG</strong>. EduNexus posters include clear scanning instructions and high-contrast matrix borders for easy camera focus.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3.5 hover:border-teal-300 transition">
                  <div className="p-2.5 bg-teal-100 text-teal-800 rounded-xl font-bold text-xs shrink-0">
                    03
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-850">Deploy at Physical Touchpoints</h5>
                    <p className="text-xs text-slate-600">
                      Affix QR codes to lab station desks, reading nooks, or assignment headers. Laminate posters for year-round durability in active classrooms.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3.5 hover:border-teal-300 transition">
                  <div className="p-2.5 bg-teal-100 text-teal-800 rounded-xl font-bold text-xs shrink-0">
                    04
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-850">Update Content Dynamically</h5>
                    <p className="text-xs text-slate-600">
                      To change a station activity for next week, edit the short ID destination in the dashboard. Physical QR posters on desks remain valid forever.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: TROUBLESHOOTING & LIGHTING TIPS */}
          {activeRoleTab === 'troubleshoot' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <SunMedium className="w-4 h-4 text-amber-600" />
                    <span>Avoid Glare & Direct Overhead Light</span>
                  </div>
                  <p className="text-xs text-amber-950/80 leading-relaxed">
                    Reflective overhead fluorescent lights or glossy laminated paper can obstruct the camera scanner. Tilt the paper slightly away from direct overhead light source.
                  </p>
                </div>

                <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Distance & Framing</span>
                  </div>
                  <p className="text-xs text-blue-950/80 leading-relaxed">
                    Keep device 15–30 cm (6–12 inches) away from paper. Ensure all 3 outer finder squares are entirely inside the camera preview box.
                  </p>
                </div>

                <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                    <Key className="w-4 h-4 text-purple-600" />
                    <span>Offline / Manual Fallback Option</span>
                  </div>
                  <p className="text-xs text-purple-950/80 leading-relaxed">
                    If camera access is restricted on school devices, simply type the short code printed beneath the QR code (e.g. <code>soc-bio72</code>) into the manual input box!
                  </p>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span>Universal Accessibility (UDL)</span>
                  </div>
                  <p className="text-xs text-emerald-950/80 leading-relaxed">
                    Scanned station portals automatically apply OpenDyslexic font and synthesized speech read-aloud for audio learners and assistive tech users.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* Interactive Scanner Simulation / Action Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-sm font-bold text-white font-serif">Ready to test scanning?</h4>
              </div>
              <p className="text-xs text-slate-300">
                Launch the camera scanner simulator or test a sample station portal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onOpenScanner && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenScanner();
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                >
                  <Camera className="w-4 h-4" />
                  <span>Open Camera Scanner</span>
                </button>
              )}

              {onOpenSamplePortal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSamplePortal();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Test Sample Portal</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>EduNexus Universal Dynamic QR Touchpoint Engine v2.4</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer min-h-[40px]"
          >
            Got it, thanks!
          </button>
        </div>

      </div>
    </div>
  );
};

export default HowToScanModal;
