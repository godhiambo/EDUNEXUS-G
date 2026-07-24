import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Timer,
  Clock,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bell,
  BellOff,
  X,
  Flag,
  Maximize2,
  Minimize2
} from 'lucide-react';

export default function SidebarTimerWidget() {
  const [activeTab, setActiveTab] = useState<'timer' | 'stopwatch'>('timer');
  const [isFloating, setIsFloating] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Floating Position State (for simple dragging)
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({ startX: 0, startY: 0, posX: 0, posY: 0 });

  // TIMER STATES
  const [timerDuration, setTimerDuration] = useState<number>(300); // default 5 mins
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(300);
  const [timerIsActive, setTimerIsActive] = useState<boolean>(false);
  const [timerPreset, setTimerPreset] = useState<number>(300);

  // STOPWATCH STATES
  const [stopwatchTime, setStopwatchTime] = useState<number>(0); // in ms
  const [stopwatchIsActive, setStopwatchIsActive] = useState<boolean>(false);
  const [stopwatchLaps, setStopwatchLaps] = useState<string[]>([]);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopwatchStartRef = useRef<number>(0);
  const stopwatchPausedRef = useRef<number>(0);

  // Bell audio synthesizer
  const playAlertSound = useCallback(() => {
    if (!isSoundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Beautiful triple-tone alarm chime
      const tones = [523.25, 659.25, 783.99]; // C5, E5, G5
      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.8);
      });
    } catch (e) {
      console.warn('AudioContext warning:', e);
    }
  }, [isSoundEnabled]);

  // Request system notification permission on widget load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const triggerBrowserNotification = useCallback((message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification("Classroom Timer", {
          body: message,
          tag: 'sidebar-timer',
          requireInteraction: true
        });
      } catch (e) {
        console.error('System notification failed', e);
      }
    }
  }, []);

  // Timer Core Effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (timerIsActive && timerSecondsLeft > 0) {
      intervalId = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setTimerIsActive(false);
            playAlertSound();
            triggerBrowserNotification("Time is up for your classroom activity!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerIsActive, timerSecondsLeft, playAlertSound, triggerBrowserNotification]);

  // Stopwatch Logic
  const startStopwatch = () => {
    if (!stopwatchIsActive) {
      stopwatchStartRef.current = Date.now() - stopwatchTime;
      stopwatchIsActiveRef.current = true;
      setStopwatchIsActive(true);
    }
  };

  const pauseStopwatch = () => {
    if (stopwatchIsActive) {
      setStopwatchIsActive(false);
      stopwatchIsActiveRef.current = false;
      stopwatchPausedRef.current = Date.now();
    }
  };

  const resetStopwatch = () => {
    setStopwatchIsActive(false);
    stopwatchIsActiveRef.current = false;
    setStopwatchTime(0);
    setStopwatchLaps([]);
  };

  const stopwatchIsActiveRef = useRef(stopwatchIsActive);
  useEffect(() => {
    stopwatchIsActiveRef.current = stopwatchIsActive;
  }, [stopwatchIsActive]);

  useEffect(() => {
    let interval: any = null;
    if (stopwatchIsActive) {
      interval = setInterval(() => {
        if (stopwatchIsActiveRef.current) {
          setStopwatchTime(Date.now() - stopwatchStartRef.current);
        }
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stopwatchIsActive]);

  // Lap handling
  const addLap = () => {
    const formatStopwatch = (timeMs: number) => {
      const ms = Math.floor((timeMs % 1000) / 10);
      const totalSecs = Math.floor(timeMs / 1000);
      const secs = totalSecs % 60;
      const mins = Math.floor(totalSecs / 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };
    const currentFormatted = formatStopwatch(stopwatchTime);
    setStopwatchLaps((prev) => [`Lap ${prev.length + 1}: ${currentFormatted}`, ...prev]);
  };

  // Timer Preset Helpers
  const selectPreset = (seconds: number) => {
    setTimerPreset(seconds);
    setTimerDuration(seconds);
    setTimerSecondsLeft(seconds);
    setTimerIsActive(false);
  };

  // Drag Event Handlers for Floating Mode
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isFloating) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.posX + dx,
        y: dragRef.current.posY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Formatted display helper
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatStopwatchDisplay = (timeMs: number) => {
    const ms = Math.floor((timeMs % 1000) / 10);
    const totalSecs = Math.floor(timeMs / 1000);
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60);
    return {
      mins: mins.toString().padStart(2, '0'),
      secs: secs.toString().padStart(2, '0'),
      ms: ms.toString().padStart(2, '0')
    };
  };

  const sw = formatStopwatchDisplay(stopwatchTime);

  return (
    <div
      id="sidebar-timer-stopwatch-widget"
      style={isFloating ? { transform: `translate(${position.x}px, ${position.y}px)` } : undefined}
      className={`transition-shadow duration-200 ${
        isFloating
          ? 'fixed bottom-6 right-6 z-[99] w-80 bg-white border-2 border-[#5f6f52]/40 shadow-2xl rounded-2xl overflow-hidden'
          : 'w-full bg-white rounded-2xl border border-[#e5e1da] shadow-xs overflow-hidden mt-2'
      }`}
    >
      {/* Widget Header */}
      <div
        onMouseDown={handleMouseDown}
        className={`flex items-center justify-between p-3 border-b border-slate-100 ${
          isFloating ? 'bg-gradient-to-r from-[#5f6f52] to-[#7d8f6d] text-white cursor-move' : 'bg-slate-50 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2">
          {activeTab === 'timer' ? (
            <Timer className={`w-4 h-4 ${isFloating ? 'text-[#fefae0]' : 'text-[#5f6f52]'}`} />
          ) : (
            <Clock className={`w-4 h-4 ${isFloating ? 'text-[#fefae0]' : 'text-[#5f6f52]'}`} />
          )}
          <span className="text-xs font-bold tracking-wide uppercase">
            {isFloating ? 'Teacher Dashboard Clock' : 'Classroom Pacing'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`p-1 rounded-md transition cursor-pointer ${
              isFloating ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-slate-500'
            }`}
            title={isSoundEnabled ? 'Mute Alert' : 'Unmute Alert'}
          >
            {isSoundEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5 text-rose-500" />}
          </button>

          {/* Collapsible toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1 rounded-md transition cursor-pointer ${
              isFloating ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-slate-500'
            }`}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Floating toggle */}
          <button
            onClick={() => {
              setIsFloating(!isFloating);
              setPosition({ x: 0, y: 0 }); // reset layout shift
            }}
            className={`p-1 rounded-md transition cursor-pointer ${
              isFloating ? 'bg-white/20 text-[#fefae0]' : 'hover:bg-slate-200 text-slate-500'
            }`}
            title={isFloating ? 'Dock in Sidebar' : 'Float on Screen'}
          >
            {isFloating ? <Minimize2 className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
          </button>

          {/* Full Screen Toggle */}
          <button
            onClick={() => setIsFullScreen(true)}
            className={`p-1 rounded-md transition cursor-pointer ${
              isFloating ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-slate-500'
            }`}
            title="Expand to Fullscreen Classroom Display"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'timer'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Lesson Timer
            </button>
            <button
              onClick={() => setActiveTab('stopwatch')}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'stopwatch'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Stopwatch
            </button>
          </div>

          {/* TIMER MODE INTERFACE */}
          {activeTab === 'timer' && (
            <div className="space-y-4">
              {/* Circular progress / text area */}
              <div className="flex flex-col items-center justify-center py-2 relative">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background */}
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      className="stroke-slate-100 fill-none"
                      strokeWidth="5"
                    />
                    {/* Active */}
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      className={`fill-none transition-all duration-1000 ease-linear ${
                        timerIsActive && timerSecondsLeft <= 30
                          ? 'stroke-rose-500 animate-pulse'
                          : 'stroke-[#5f6f52]'
                      }`}
                      strokeWidth="5"
                      strokeDasharray={2 * Math.PI * 46}
                      strokeDashoffset={2 * Math.PI * 46 * (1 - (timerDuration > 0 ? timerSecondsLeft / timerDuration : 0))}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Inside timer text */}
                  <div className="absolute flex flex-col items-center justify-center">
                    {timerIsActive && timerSecondsLeft <= 30 && (
                      <span className="text-[7px] font-extrabold bg-rose-500 text-white px-1 rounded-sm tracking-wider uppercase mb-0.5 animate-pulse">
                        Final Phase
                      </span>
                    )}
                    {!timerIsActive && timerSecondsLeft < timerDuration && timerSecondsLeft > 0 && (
                      <span className="text-[7px] font-extrabold bg-amber-500 text-white px-1 rounded-sm tracking-wider uppercase mb-0.5 animate-pulse">
                        Paused
                      </span>
                    )}
                    <span className={`text-xl font-black font-mono tracking-wider ${
                      timerIsActive && timerSecondsLeft <= 30 ? 'text-rose-600 animate-pulse' : 'text-slate-800'
                    }`}>
                      {formatTimer(timerSecondsLeft)}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      remaining
                    </span>
                  </div>
                </div>
              </div>

              {/* Presets & Controls */}
              <div className="space-y-3">
                {/* Presets Grid */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '1m', value: 60 },
                    { label: '3m', value: 180 },
                    { label: '5m', value: 300 },
                    { label: '10m', value: 600 }
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => selectPreset(preset.value)}
                      className={`py-1 px-1.5 border rounded-lg text-xs font-bold transition cursor-pointer ${
                        timerPreset === preset.value
                          ? 'bg-[#5f6f52]/10 border-[#5f6f52] text-[#5f6f52]'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom input bar */}
                <div className="flex items-center gap-1.5 justify-center">
                  <div className="flex items-center gap-1 border border-slate-200 rounded-lg px-2 py-1 bg-slate-50">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="Min"
                      value={Math.floor(timerDuration / 60) || ''}
                      onChange={(e) => {
                        const m = parseInt(e.target.value) || 0;
                        const s = timerDuration % 60;
                        const total = m * 60 + s;
                        setTimerDuration(total);
                        setTimerSecondsLeft(total);
                        setTimerIsActive(false);
                      }}
                      className="w-8 text-center text-xs font-bold bg-transparent border-none focus:outline-none text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs text-slate-400 font-bold">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="Sec"
                      value={timerDuration % 60 || ''}
                      onChange={(e) => {
                        const m = Math.floor(timerDuration / 60);
                        const s = parseInt(e.target.value) || 0;
                        const total = m * 60 + Math.min(59, s);
                        setTimerDuration(total);
                        setTimerSecondsLeft(total);
                        setTimerIsActive(false);
                      }}
                      className="w-8 text-center text-xs font-bold bg-transparent border-none focus:outline-none text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Custom</span>
                </div>

                {/* Active Controls Button Bar */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (timerIsActive) {
                        setTimerIsActive(false);
                      } else {
                        setTimerIsActive(true);
                      }
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                      timerIsActive
                        ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white'
                        : 'bg-[#5f6f52] hover:bg-[#4d5a42] border-[#5f6f52] text-white'
                    }`}
                  >
                    {timerIsActive ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-white" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-white" />
                        <span>
                          {timerSecondsLeft < timerDuration && timerSecondsLeft > 0 ? 'Resume' : 'Start'}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setTimerIsActive(false);
                      setTimerSecondsLeft(timerDuration);
                    }}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setIsFullScreen(true)}
                    className="py-2 px-3 bg-[#fefae0] hover:bg-[#e9edc9] border border-[#e5e1da] text-[#5f6f52] rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                    title="Full Screen Classroom Visibility"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Full Screen</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STOPWATCH MODE INTERFACE */}
          {activeTab === 'stopwatch' && (
            <div className="space-y-4">
              {/* Digital Time Text */}
              <div className="flex flex-col items-center justify-center py-4 bg-slate-50 border border-slate-150 rounded-2xl">
                <div className="text-3xl font-black font-mono tracking-wider text-slate-800 flex items-baseline">
                  <span>{sw.mins}</span>
                  <span className="text-lg mx-0.5 text-slate-400">:</span>
                  <span>{sw.secs}</span>
                  <span className="text-lg mx-0.5 text-slate-400">.</span>
                  <span className="text-sm text-slate-500">{sw.ms}</span>
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  hours : mins : secs . cs
                </span>
              </div>

              {/* Controls */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={stopwatchIsActive ? pauseStopwatch : startStopwatch}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                      stopwatchIsActive
                        ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white'
                        : 'bg-[#5f6f52] hover:bg-[#4d5a42] border-[#5f6f52] text-white'
                    }`}
                  >
                    {stopwatchIsActive ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-white" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-white" />
                        <span>
                          {stopwatchTime > 0 ? 'Resume' : 'Start'}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={addLap}
                    disabled={stopwatchTime === 0}
                    className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 disabled:opacity-50 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center"
                    title="Record Lap Time"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={resetStopwatch}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center"
                    title="Reset Stopwatch"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setIsFullScreen(true)}
                    className="py-2 px-3 bg-[#fefae0] hover:bg-[#e9edc9] border border-[#e5e1da] text-[#5f6f52] rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                    title="Full Screen Classroom Visibility"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </button>
                </div>

                {/* Laps List */}
                {stopwatchLaps.length > 0 && (
                  <div className="border border-slate-150 rounded-xl bg-slate-50 max-h-24 overflow-y-auto p-2 space-y-1">
                    <p className="text-[9px] font-extrabold text-[#a9b388] uppercase tracking-wider mb-1 px-1">Recorded Laps</p>
                    {stopwatchLaps.map((lap, index) => (
                      <div key={index} className="flex justify-between items-center text-[10px] text-slate-600 font-mono px-1 border-b border-slate-100/60 pb-1">
                        <span>{lap.split(': ')[0]}</span>
                        <span className="font-bold text-[#5f6f52]">{lap.split(': ')[1]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Screen Classroom Display Overlay */}
      {isFullScreen && (
        <div className="fixed inset-0 bg-slate-950 text-white z-[9999] flex flex-col items-center justify-between p-6 sm:p-12 md:p-16 animate-fadeIn select-none font-sans no-print">
          {/* Header row in fullscreen */}
          <div className="w-full flex items-center justify-between border-b border-white/10 pb-4 max-w-6xl">
            <div className="flex items-center gap-3">
              {activeTab === 'timer' ? (
                <Timer className="w-8 h-8 text-[#a9b388]" />
              ) : (
                <Clock className="w-8 h-8 text-[#a9b388]" />
              )}
              <h1 className="text-xl sm:text-2xl font-serif font-black tracking-wide uppercase text-[#fefae0]">
                Classroom Display: {activeTab === 'timer' ? 'Lesson Timer' : 'Stopwatch'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Sound Toggle */}
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition cursor-pointer flex items-center gap-2 text-sm font-bold text-slate-300"
                title={isSoundEnabled ? 'Mute Alert' : 'Unmute Alert'}
              >
                {isSoundEnabled ? (
                  <>
                    <Bell className="w-5 h-5 text-emerald-400" />
                    <span className="hidden sm:inline">Sound On</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-5 h-5 text-rose-500" />
                    <span className="hidden sm:inline">Muted</span>
                  </>
                )}
              </button>

              {/* Mode Switch tabs */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setActiveTab('timer')}
                  className={`py-1.5 px-3 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    activeTab === 'timer' ? 'bg-[#5f6f52] text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Timer
                </button>
                <button
                  onClick={() => setActiveTab('stopwatch')}
                  className={`py-1.5 px-3 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    activeTab === 'stopwatch' ? 'bg-[#5f6f52] text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Stopwatch
                </button>
              </div>

              {/* Close Fullscreen */}
              <button
                onClick={() => setIsFullScreen(false)}
                className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 transition cursor-pointer flex items-center gap-2 text-sm font-bold shadow-md"
                title="Exit Fullscreen"
              >
                <Minimize2 className="w-5 h-5" />
                <span className="hidden sm:inline">Exit Display</span>
              </button>
            </div>
          </div>

          {/* Large display body */}
          <div className="flex-1 flex flex-col items-center justify-center my-6 max-w-4xl w-full">
            {activeTab === 'timer' ? (
              <div className="flex flex-col items-center justify-center space-y-12 w-full">
                {/* Big Circular Ring Display */}
                <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
                  <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle
                      cx="200"
                      cy="200"
                      r="160"
                      className="stroke-white/5 fill-none"
                      strokeWidth="10"
                    />
                    <circle
                      cx="200"
                      cy="200"
                      r="160"
                      className={`fill-none transition-all duration-1000 ease-linear ${
                        timerIsActive && timerSecondsLeft <= 30
                          ? 'stroke-rose-500 animate-pulse'
                          : 'stroke-[#a9b388]'
                      }`}
                      strokeWidth="12"
                      strokeDasharray={2 * Math.PI * 160}
                      strokeDashoffset={2 * Math.PI * 160 * (1 - (timerDuration > 0 ? timerSecondsLeft / timerDuration : 0))}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Centered Digital Time Text with pulsing glows */}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    {timerIsActive && timerSecondsLeft <= 30 && (
                      <span className="text-xs font-black bg-rose-600 text-white px-3 py-1 rounded-full tracking-widest uppercase mb-3 animate-pulse shadow-lg">
                        Final Phase
                      </span>
                    )}
                    {!timerIsActive && timerSecondsLeft < timerDuration && timerSecondsLeft > 0 && (
                      <span className="text-xs font-black bg-amber-500 text-white px-3 py-1 rounded-full tracking-widest uppercase mb-3 animate-pulse shadow-lg">
                        Paused
                      </span>
                    )}
                    <span className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-mono tracking-widest transition-colors duration-500 ${
                      timerIsActive && timerSecondsLeft <= 30 ? 'text-rose-500 animate-pulse' : 'text-white'
                    }`}>
                      {formatTimer(timerSecondsLeft)}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                      time remaining
                    </span>
                  </div>
                </div>

                {/* Big Controls under the circle */}
                <div className="flex flex-col items-center gap-6 w-full max-w-md">
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={() => setTimerIsActive(!timerIsActive)}
                      className={`flex-1 py-4 px-6 rounded-2xl text-base font-black transition flex items-center justify-center gap-3 shadow-2xl cursor-pointer ${
                        timerIsActive
                          ? 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-600'
                          : 'bg-[#5f6f52] hover:bg-[#4d5a42] text-white border border-[#5f6f52]'
                      }`}
                    >
                      {timerIsActive ? (
                        <>
                          <Pause className="w-5 h-5 text-white" />
                          <span>Pause Timer</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 text-white" />
                          <span>{timerSecondsLeft < timerDuration && timerSecondsLeft > 0 ? 'Resume' : 'Start Timer'}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setTimerIsActive(false);
                        setTimerSecondsLeft(timerDuration);
                      }}
                      className="py-4 px-6 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl text-base font-bold transition cursor-pointer flex items-center justify-center shadow-lg gap-2"
                      title="Reset Timer"
                    >
                      <RotateCcw className="w-5 h-5" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Preset quick adjustment */}
                  <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/5 w-full justify-around">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Presets:</span>
                    {[
                      { label: '1m', value: 60 },
                      { label: '3m', value: 180 },
                      { label: '5m', value: 300 },
                      { label: '10m', value: 600 },
                      { label: '15m', value: 900 }
                    ].map((p) => (
                      <button
                        key={p.value}
                        onClick={() => selectPreset(p.value)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          timerDuration === p.value
                            ? 'bg-[#5f6f52] border-[#5f6f52] text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-12 w-full">
                {/* Big Stopwatch display */}
                <div className="text-center p-8 md:p-14 bg-white/5 border border-white/10 rounded-3xl shadow-2xl w-full max-w-3xl relative overflow-hidden">
                  <div className="absolute -inset-10 bg-gradient-to-r from-emerald-500/10 to-[#5f6f52]/10 blur-3xl opacity-50 pointer-events-none"></div>
                  
                  <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-mono tracking-widest text-[#fefae0] flex items-baseline justify-center relative z-10">
                    <span>{sw.mins}</span>
                    <span className="text-4xl md:text-5xl lg:text-6xl mx-1 text-slate-500 animate-pulse">:</span>
                    <span>{sw.secs}</span>
                    <span className="text-4xl md:text-5xl lg:text-6xl mx-1 text-slate-500">.</span>
                    <span className="text-3xl md:text-4xl lg:text-5xl text-[#a9b388] font-bold">{sw.ms}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-6 block relative z-10">
                    minutes : seconds . centiseconds
                  </span>
                </div>

                {/* Big Controls for Stopwatch */}
                <div className="flex items-center gap-4 w-full max-w-md">
                  <button
                    onClick={stopwatchIsActive ? pauseStopwatch : startStopwatch}
                    className={`flex-1 py-4 px-6 rounded-2xl text-base font-black transition flex items-center justify-center gap-3 shadow-2xl cursor-pointer ${
                      stopwatchIsActive
                        ? 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-600'
                        : 'bg-[#5f6f52] hover:bg-[#4d5a42] text-white border border-[#5f6f52]'
                    }`}
                  >
                    {stopwatchIsActive ? (
                      <>
                        <Pause className="w-5 h-5 text-white" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 text-white" />
                        <span>{stopwatchTime > 0 ? 'Resume' : 'Start'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={addLap}
                    disabled={stopwatchTime === 0}
                    className="py-4 px-6 bg-white/10 hover:bg-white/20 border border-white/10 text-white disabled:opacity-20 rounded-2xl text-base font-bold transition cursor-pointer flex items-center justify-center shadow-lg gap-2"
                  >
                    <Flag className="w-5 h-5" />
                    <span>Lap</span>
                  </button>

                  <button
                    onClick={resetStopwatch}
                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white rounded-2xl transition cursor-pointer flex items-center justify-center shadow-lg"
                    title="Reset Stopwatch"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                {/* Full screen laps list */}
                {stopwatchLaps.length > 0 && (
                  <div className="border border-white/10 rounded-2xl bg-white/5 max-h-56 overflow-y-auto p-4 space-y-2 w-full max-w-xl shadow-inner">
                    <p className="text-xs font-extrabold text-[#a9b388] uppercase tracking-wider mb-2 px-1">Recorded Laps ({stopwatchLaps.length})</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {stopwatchLaps.map((lap, index) => (
                        <div key={index} className="flex justify-between items-center text-xs text-slate-300 font-mono px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                          <span>{lap.split(': ')[0]}</span>
                          <span className="font-bold text-[#fefae0]">{lap.split(': ')[1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick instructions / tips footer */}
          <div className="w-full text-center text-xs text-slate-500 border-t border-white/10 pt-4 max-w-6xl">
            Pro-Tip: Project this screen to the main classroom display for high visibility during team challenges or quiet study.
          </div>
        </div>
      )}
    </div>
  );
}
