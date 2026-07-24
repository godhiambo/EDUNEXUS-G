import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Monitor, 
  Smartphone, 
  X, 
  Download, 
  Check, 
  Sparkles, 
  Share2, 
  PlusSquare, 
  ExternalLink,
  Laptop,
  CheckCircle2,
  Zap,
  WifiOff,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface AppIconShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppIconShowcaseModal({ isOpen, onClose }: AppIconShowcaseModalProps) {
  const [activeTab, setActiveTab] = useState<'desktop' | 'phone'>('desktop');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallDesktop = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install as a Desktop App:\n1. Click the 'Install' or 'Share' icon in your browser address bar.\n2. Select 'Install EduNexus' or 'Save and Share' -> 'Create Shortcut'.");
    }
  };

  const copyAppIconURL = () => {
    const url = window.location.origin + '/icon.svg';
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-3xl bg-white border border-[#e5e1da] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header Banner */}
            <div className="relative p-6 bg-gradient-to-br from-[#0b172a] via-[#0f2342] to-[#1e3a8a] text-white shrink-0 overflow-hidden">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shrink-0 shadow-lg">
                  <img src="/icon.svg" alt="EduNexus App Icon" className="w-full h-full rounded-xl object-contain" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight">EduNexus App Integration</h3>
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-extrabold uppercase tracking-wider rounded-full">
                      PWA Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 font-medium">
                    Integrated EduNexus App Icon across Desktop App and Phone Mobile App environments
                  </p>
                </div>
              </div>

              {/* Mode Tabs */}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setActiveTab('desktop')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'desktop'
                      ? 'bg-white text-slate-900 shadow-md font-extrabold'
                      : 'bg-white/10 text-slate-200 hover:bg-white/15'
                  }`}
                >
                  <Monitor className="w-4 h-4 text-blue-500" />
                  <span>Desktop App Icon & Dock</span>
                </button>
                <button
                  onClick={() => setActiveTab('phone')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'phone'
                      ? 'bg-white text-slate-900 shadow-md font-extrabold'
                      : 'bg-white/10 text-slate-200 hover:bg-white/15'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>Phone App Icon & Home Screen</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'desktop' ? (
                <div className="space-y-6">
                  {/* Desktop Preview Canvas */}
                  <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white relative overflow-hidden shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs text-slate-400 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                        </div>
                        <span className="ml-2 text-slate-300 font-sans font-semibold">EduNexus Desktop App</span>
                      </div>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-blue-400 font-sans font-bold">
                        Native Workspace Window
                      </span>
                    </div>

                    {/* Simulated Desktop Screen Content */}
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                      <div className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500" />
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-[#0b172a] p-1">
                          <img src="/icon.svg" alt="Desktop App Icon" className="w-full h-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <span className="absolute -bottom-2 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                          ✓
                        </span>
                      </div>

                      <div>
                        <h4 className="text-lg font-extrabold text-white">EduNexus Desktop Launcher</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                          The official EduNexus App Icon is integrated into your desktop dock, taskbar, and application window.
                        </p>
                      </div>

                      {/* macOS Dock Simulation */}
                      <div className="mt-4 pt-4 border-t border-slate-800 w-full">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                          Desktop Dock & Taskbar Shortcut Preview
                        </p>
                        <div className="inline-flex items-center gap-3 bg-slate-800/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/60 shadow-inner">
                          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 text-xs">Finder</div>
                          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 text-xs">Browser</div>
                          {/* EduNexus Active Desktop Icon */}
                          <div className="relative group cursor-pointer">
                            <div className="w-10 h-10 rounded-xl bg-[#0b172a] border-2 border-cyan-400/80 p-0.5 shadow-lg transform hover:-translate-y-1 transition duration-200">
                              <img src="/icon.svg" alt="Dock Icon" className="w-full h-full rounded-lg" referrerPolicy="no-referrer" />
                            </div>
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 text-xs">Files</div>
                          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 text-xs">Terminal</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Capabilities & Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <span>Desktop Standalone Experience</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Runs in an independent, distraction-free desktop window with custom title bar branding and system notifications.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                        <WifiOff className="w-4 h-4 text-emerald-600" />
                        <span>Offline Lesson Storage</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Service workers cache curriculum standards and drafted lessons locally for offline classroom access.
                      </p>
                    </div>
                  </div>

                  {/* Desktop Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={handleInstallDesktop}
                      className="flex-1 py-3 px-5 bg-[#0b172a] hover:bg-[#1e3a8a] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Laptop className="w-4 h-4 text-cyan-400" />
                      <span>{isInstalled ? 'Desktop App Installed' : 'Install Desktop App Shortcut'}</span>
                    </button>

                    <a
                      href="/icon.svg"
                      download="EduNexus_App_Icon.svg"
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download SVG Icon</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Phone Preview Canvas */}
                  <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white relative overflow-hidden shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">EduNexus Phone App Icon Mockup</span>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold">
                        iOS / Android PWA
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
                      {/* Simulated Smartphone Screen Frame */}
                      <div className="w-56 h-96 rounded-[36px] border-4 border-slate-700 bg-gradient-to-b from-slate-950 to-slate-900 p-4 relative shadow-2xl flex flex-col justify-between shrink-0">
                        {/* Phone Camera Notch */}
                        <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-slate-900" />
                        </div>

                        {/* Phone Status Bar */}
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono px-2">
                          <span>09:41</span>
                          <span>5G 100%</span>
                        </div>

                        {/* Phone Home Screen Apps Grid */}
                        <div className="grid grid-cols-3 gap-3 my-auto px-2">
                          <div className="flex flex-col items-center gap-1 opacity-30">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                            <span className="text-[8px]">Mail</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 opacity-30">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                            <span className="text-[8px]">Photos</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 opacity-30">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                            <span className="text-[8px]">Calendar</span>
                          </div>

                          {/* INTEGRATED EDUNEXUS PHONE APP ICON */}
                          <div className="flex flex-col items-center gap-1 relative cursor-pointer group">
                            <div className="relative">
                              <div className="w-11 h-11 rounded-xl bg-[#0b172a] p-0.5 border border-cyan-400/80 shadow-lg group-hover:scale-105 transition transform">
                                <img src="/icon.svg" alt="Phone App Icon" className="w-full h-full rounded-lg object-contain" referrerPolicy="no-referrer" />
                              </div>
                              {/* Notification badge */}
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-slate-950 shadow-sm">
                                3
                              </span>
                            </div>
                            <span className="text-[9px] font-extrabold text-cyan-300 tracking-tight">EduNexus</span>
                          </div>

                          <div className="flex flex-col items-center gap-1 opacity-30">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                            <span className="text-[8px]">Notes</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 opacity-30">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                            <span className="text-[8px]">Settings</span>
                          </div>
                        </div>

                        {/* Phone Home Bar */}
                        <div className="w-24 h-1 bg-slate-600 rounded-full mx-auto mt-2" />
                      </div>

                      {/* Phone App Details & Instructions */}
                      <div className="space-y-4 max-w-xs text-left">
                        <div className="space-y-1">
                          <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            <span>Phone Home Screen Icon</span>
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Add EduNexus directly to your phone's Home Screen with our custom high-resolution icon and mobile touch optimization.
                          </p>
                        </div>

                        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-2 text-xs">
                          <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <Share2 className="w-3.5 h-3.5" /> iOS Safari Guide:
                          </p>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            Tap the <strong>Share</strong> button in Safari, then scroll down and tap <strong>'Add to Home Screen'</strong>.
                          </p>
                        </div>

                        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-2 text-xs">
                          <p className="font-bold text-cyan-400 flex items-center gap-1.5">
                            <PlusSquare className="w-3.5 h-3.5" /> Android Chrome Guide:
                          </p>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            Tap the <strong>Menu (⋮)</strong> in Chrome, then select <strong>'Install app'</strong> or <strong>'Add to Home screen'</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phone Action Buttons */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={copyAppIconURL}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>App Icon URL Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          <span>Copy App Icon Link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleInstallDesktop}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Install PWA</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#5f6f52]" />
                <span>EduNexus Official App Icon Assets Integrated</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
