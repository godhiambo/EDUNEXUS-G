import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  BellOff, 
  Radio, 
  Sparkles, 
  QrCode, 
  ExternalLink, 
  X, 
  Zap, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  History, 
  ChevronDown, 
  ChevronUp,
  MapPin
} from 'lucide-react';
import { QRCodeMapping } from '../types/qrMapping';
import { QRMappingService } from '../services/qrMappingService';

export interface ScanAlertEvent {
  scanId: string;
  mapping: QRCodeMapping;
  deviceInfo: string;
  timestamp: string;
}

interface QRScanAlertManagerProps {
  mappings: QRCodeMapping[];
  onSelectMapping?: (mapping: QRCodeMapping) => void;
  onLaunchMapping?: (mapping: QRCodeMapping) => void;
  onScanCountUpdated?: () => void;
}

export const QRScanAlertManager: React.FC<QRScanAlertManagerProps> = ({
  mappings,
  onSelectMapping,
  onLaunchMapping,
  onScanCountUpdated
}) => {
  const [isMonitoringActive, setIsMonitoringActive] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<ScanAlertEvent[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanAlertEvent[]>([]);
  const [showHistoryFeed, setShowHistoryFeed] = useState<boolean>(false);

  // Synthesize soft audio chime when alert fires
  const playScanChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.25); // D6

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio chime note:', e);
    }
  }, [soundEnabled]);

  // Handle incoming real-time scan event
  useEffect(() => {
    const handleScanEvent = (e: Event) => {
      if (!isMonitoringActive) return;

      const customEvent = e as CustomEvent<ScanAlertEvent>;
      if (!customEvent.detail || !customEvent.detail.mapping) return;

      const newAlert = customEvent.detail;
      setAlerts(prev => [newAlert, ...prev.slice(0, 4)]); // max 5 active floating toasts
      setScanHistory(prev => [newAlert, ...prev.slice(0, 24)]); // keep 25 in session history

      playScanChime();
      if (onScanCountUpdated) {
        onScanCountUpdated();
      }
    };

    window.addEventListener('edunexus-qr-scan-event', handleScanEvent);
    return () => {
      window.removeEventListener('edunexus-qr-scan-event', handleScanEvent);
    };
  }, [isMonitoringActive, playScanChime, onScanCountUpdated]);

  const handleDismissAlert = (scanId: string) => {
    setAlerts(prev => prev.filter(a => a.scanId !== scanId));
  };

  const handleSimulateClassroomScan = () => {
    if (mappings.length === 0) return;
    const randomMapping = mappings[Math.floor(Math.random() * mappings.length)];
    const deviceOptions = [
      'Classroom Tablet #3 (Biology Lab)',
      'Student Mobile Device (Desk Station 4)',
      'Inclusive Corner Desk Scanner #12',
      'Take-Home Folder Parent Phone',
      'Math Workshop Chromebook'
    ];
    const randomDevice = deviceOptions[Math.floor(Math.random() * deviceOptions.length)];

    // Increment local scan count & trigger alert
    randomMapping.scanCount = (randomMapping.scanCount || 0) + 1;
    QRMappingService.saveMapping(randomMapping);

    QRMappingService.triggerScanAlert(randomMapping, randomDevice);
  };

  return (
    <div className="space-y-3">
      {/* Classroom Real-Time Scan Monitor Control Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-indigo-500/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            {isMonitoringActive ? (
              <>
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </>
            ) : (
              <span className="inline-flex rounded-full h-3 w-3 bg-slate-500"></span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Radio className={`w-4 h-4 ${isMonitoringActive ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <h4 className="text-xs font-bold font-serif tracking-wide text-white">
                {isMonitoringActive ? 'Live Classroom Scan Monitor Active' : 'Classroom Scan Monitor Paused'}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-indigo-200 border border-white/10">
                {scanHistory.length} Scans Today
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {isMonitoringActive 
                ? 'Receiving instant toast alerts when students scan QR codes in your classroom.' 
                : 'Click enable to receive live scan alerts.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setIsMonitoringActive(!isMonitoringActive)}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              isMonitoringActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={isMonitoringActive ? 'Pause real-time scan notifications' : 'Enable real-time scan notifications'}
          >
            {isMonitoringActive ? <Bell className="w-3.5 h-3.5 text-emerald-400" /> : <BellOff className="w-3.5 h-3.5" />}
            <span>{isMonitoringActive ? 'Alerts ON' : 'Alerts OFF'}</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`min-h-[38px] p-2 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer border ${
              soundEnabled
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title={soundEnabled ? 'Mute alert chime sound' : 'Enable alert chime sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-300" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleSimulateClassroomScan}
            className="min-h-[38px] px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer transform hover:scale-[1.02]"
            title="Simulate a live student QR code scan to test real-time alerts"
          >
            <Zap className="w-3.5 h-3.5 text-slate-950 fill-current" />
            <span>Simulate Scan</span>
          </button>

          {scanHistory.length > 0 && (
            <button
              onClick={() => setShowHistoryFeed(!showHistoryFeed)}
              className="min-h-[38px] px-3 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-indigo-300" />
              <span>Log ({scanHistory.length})</span>
              {showHistoryFeed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Slide-Down Session History Log */}
      {showHistoryFeed && scanHistory.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>Today's Classroom Scan Feed</span>
            </h5>
            <button
              onClick={() => setScanHistory([])}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
            >
              Clear Log
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
            {scanHistory.map((item) => (
              <div key={item.scanId} className="py-2 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg transition">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-emerald-100 text-emerald-800 rounded-md font-mono text-[10px] font-bold">
                    <QrCode className="w-3 h-3" />
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 font-serif">{item.mapping.title}</span>
                    <span className="text-[10px] text-slate-500 block">📍 {item.mapping.physicalTouchpoint} • {item.deviceInfo}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  {onSelectMapping && (
                    <button
                      onClick={() => onSelectMapping(item.mapping)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-md transition"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Real-Time Scan Alert Toasts */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {alerts.map((alert) => {
          const isSocratic = alert.mapping.targetType === 'SOCRATIC_TUTOR';
          const isAdaptive = alert.mapping.targetType === 'ADAPTIVE_PATHWAY';
          const isUdl = alert.mapping.targetType === 'PRECONFIGURED_UDL';
          const isParent = alert.mapping.targetType === 'PARENT_PLAYBOOK';

          return (
            <div
              key={alert.scanId}
              className="pointer-events-auto bg-slate-900/95 text-white border-2 border-emerald-400/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md transform transition-all duration-300 animate-slideInRight space-y-2.5 relative overflow-hidden"
            >
              {/* Top accent glow line */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: alert.mapping.brandColor || '#10b981' }}
              />

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/40 animate-pulse">
                    <Zap className="w-4 h-4 fill-current" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-mono">
                        Classroom Scan Detected
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <h5 className="text-sm font-bold text-white font-serif line-clamp-1">
                      {alert.mapping.title}
                    </h5>
                  </div>
                </div>

                <button
                  onClick={() => handleDismissAlert(alert.scanId)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Touchpoint Details */}
              <div className="text-xs text-slate-300 bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="font-semibold truncate">{alert.mapping.physicalTouchpoint}</span>
                </div>
                
                <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1 border-t border-slate-700/60">
                  <span>📱 {alert.deviceInfo}</span>
                  <span className="text-emerald-400 font-bold">Total Scans: {alert.mapping.scanCount || 1}</span>
                </div>
              </div>

              {/* Target Action Badge & Interactive Buttons */}
              <div className="flex items-center justify-between pt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {isSocratic ? 'Socratic Tutor' : isAdaptive ? 'Adaptive Pathway' : isUdl ? 'UDL Accessibility' : 'Parent Playbook'}
                </span>

                <div className="flex items-center gap-2">
                  {onSelectMapping && (
                    <button
                      onClick={() => {
                        onSelectMapping(alert.mapping);
                        handleDismissAlert(alert.scanId);
                      }}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      View
                    </button>
                  )}

                  {onLaunchMapping && (
                    <button
                      onClick={() => {
                        onLaunchMapping(alert.mapping);
                        handleDismissAlert(alert.scanId);
                      }}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Launch</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
