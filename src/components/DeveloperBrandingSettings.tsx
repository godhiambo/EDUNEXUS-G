import React, { useState, useEffect, useRef } from 'react';
import { 
  getBrandingConfig, 
  saveBrandingConfig, 
  BrandingConfig, 
  DEFAULT_BRANDING_CONFIG, 
  LogoPosition, 
  BrandingProfile,
  applyCanvasWatermark
} from '../services/brandingService';
import { 
  Shield, 
  Sparkles, 
  Check, 
  Eye, 
  Sliders, 
  Video, 
  Image as ImageIcon, 
  Globe, 
  QrCode, 
  Film, 
  Layout, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  FileText, 
  Layers, 
  Maximize2, 
  Palette, 
  Type, 
  Play, 
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DeveloperBrandingSettings() {
  const [config, setConfig] = useState<BrandingConfig>(getBrandingConfig());
  const [activePreviewTab, setActivePreviewTab] = useState<'image' | 'video'>('image');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [videoPreviewPhase, setVideoPreviewPhase] = useState<'intro' | 'content' | 'outro'>('content');

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync state on load
  useEffect(() => {
    setConfig(getBrandingConfig());
  }, []);

  // Update canvas preview whenever config changes
  useEffect(() => {
    if (activePreviewTab !== 'image') return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 640;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw rich background educational graphic
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.5, '#1e293b');
    gradient.addColorStop(1, '#0f2942');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative educational grid lines & diagrams
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Sample Diagram elements
    ctx.fillStyle = 'rgba(20, 184, 166, 0.15)';
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sample Educational Vector Diagram', width / 2, height / 2 - 10);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Cross-section Analysis • Biology 101', width / 2, height / 2 + 15);

    // 2. Apply branding watermark overlay dynamically
    applyCanvasWatermark(ctx, width, height, config);
  }, [config, activePreviewTab]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveBrandingConfig(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save branding config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_BRANDING_CONFIG);
  };

  const applyProfilePreset = (profile: BrandingProfile) => {
    if (profile === 'educational') {
      setConfig((prev) => ({
        ...prev,
        activeProfile: 'educational',
        position: 'bottom-right',
        opacity: 0.85,
        logoScale: 0.05,
        slogan: 'Empowering Learning Through AI',
        showWebsite: true,
        showQrCode: true,
      }));
    } else if (profile === 'marketing') {
      setConfig((prev) => ({
        ...prev,
        activeProfile: 'marketing',
        position: 'bottom-right',
        opacity: 0.95,
        logoScale: 0.07,
        slogan: 'Transform Education with AI Studio',
        showWebsite: true,
        showQrCode: true,
      }));
    } else if (profile === 'social') {
      setConfig((prev) => ({
        ...prev,
        activeProfile: 'social',
        position: 'top-right',
        opacity: 0.9,
        logoScale: 0.08,
        slogan: '#EduNexusAI',
        showWebsite: true,
        showQrCode: false,
      }));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border border-rose-500/30 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-rose-400" />
              <span>Developer Branding Console</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Central Media Watermarking Engine</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            EduNexus Platform Watermark & Identity Service
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed">
            Configure automatic post-processing branding across all generated images, video documentaries, infographics, lesson plans, slide presentations, and exported PDFs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Branding Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Branding Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Live Interactive Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Controls & Profiles (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Master Global Toggle & Profile Presets */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${config.enabled ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Global Auto-Branding</h3>
                  <p className="text-xs text-slate-500">Automatically attach subtle EduNexus marks to all generated assets</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {/* Profile Presets */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-rose-500" />
                <span>Branding Profile Presets</span>
              </label>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'educational', name: 'Educational', desc: 'Clean, subtle for classroom resources' },
                  { id: 'marketing', name: 'Marketing', desc: 'Prominent logo with website & slogan' },
                  { id: 'social', name: 'Social Media', desc: 'Top-right badge with hashtag slogan' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyProfilePreset(p.id as BrandingProfile)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      config.activeProfile === p.id
                        ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center justify-between">
                      <span>{p.name}</span>
                      {config.activeProfile === p.id && <Check className="w-3.5 h-3.5 text-rose-500" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 leading-tight">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Watermark Position & Appearance */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-rose-500" />
              <span>Logo Position & Adaptive Geometry</span>
            </h3>

            {/* Position Picker Grid */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Watermark Corner Position</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'top-left', label: 'Top Left' },
                  { id: 'top-right', label: 'Top Right' },
                  { id: 'bottom-left', label: 'Bottom Left' },
                  { id: 'bottom-right', label: 'Bottom Right (Default)' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setConfig({ ...config, position: pos.id as LogoPosition })}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      config.position === pos.id
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                        : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{pos.label}</span>
                    {config.position === pos.id && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders: Opacity, Scale, Margin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Watermark Opacity</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono">{Math.round(config.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={config.opacity}
                  onChange={(e) => setConfig({ ...config, opacity: parseFloat(e.target.value) })}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Logo Scale (% of width)</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono">{Math.round(config.logoScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.12"
                  step="0.01"
                  value={config.logoScale}
                  onChange={(e) => setConfig({ ...config, logoScale: parseFloat(e.target.value) })}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Edge Safe Margin</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono">{config.safeMargin}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="48"
                  step="2"
                  value={config.safeMargin}
                  onChange={(e) => setConfig({ ...config, safeMargin: parseInt(e.target.value, 10) })}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Video Intro/Outro Duration</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono">{config.introDuration}s / {config.outroDuration}s</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={config.introDuration}
                    onChange={(e) => setConfig({ ...config, introDuration: parseInt(e.target.value, 10) })}
                    className="w-1/2 accent-rose-600 cursor-pointer"
                  />
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={config.outroDuration}
                    onChange={(e) => setConfig({ ...config, outroDuration: parseInt(e.target.value, 10) })}
                    className="w-1/2 accent-amber-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Brand Identity Content Fields */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Type className="w-4 h-4 text-rose-500" />
              <span>Brand Identity Typography & Web Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Brand Wordmark</label>
                <input
                  type="text"
                  value={config.wordmark}
                  onChange={(e) => setConfig({ ...config, wordmark: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Slogan</label>
                <input
                  type="text"
                  value={config.slogan}
                  onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Website URL</label>
                <input
                  type="text"
                  value={config.website}
                  onChange={(e) => setConfig({ ...config, website: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">QR Code Link Target</label>
                <input
                  type="text"
                  value={config.qrCodeData}
                  onChange={(e) => setConfig({ ...config, qrCodeData: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Checkbox toggles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {[
                { key: 'showWebsite', label: 'Show Website' },
                { key: 'showQrCode', label: 'Include QR Code' },
                { key: 'showTimestamp', label: 'Show Date Stamp' },
              ].map((chk) => (
                <label key={chk.key} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(config as any)[chk.key]}
                    onChange={(e) => setConfig({ ...config, [chk.key]: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>{chk.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Media Module Overrides */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-rose-500" />
              <span>Target Media Outputs</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Object.entries(config.mediaOverrides).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      mediaOverrides: {
                        ...config.mediaOverrides,
                        [key]: !val,
                      },
                    })
                  }
                  className={`p-2.5 rounded-xl border text-[11px] font-bold capitalize transition cursor-pointer flex items-center justify-between ${
                    val
                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{key}</span>
                  {val && <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 text-white space-y-5 sticky top-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Live Watermark Preview</h3>
              </div>

              {/* Sub-tabs for Image vs Video Preview */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('image')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    activePreviewTab === 'image' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Image Canvas
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('video')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    activePreviewTab === 'video' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Video Studio
                </button>
              </div>
            </div>

            {/* TAB 1: Canvas Image Preview */}
            {activePreviewTab === 'image' && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-900">
                  <canvas ref={previewCanvasRef} className="w-full h-auto block" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Target: 640 x 400 Vector Canvas</span>
                  <span className="text-emerald-400 font-bold">● Post-Processed</span>
                </div>
              </div>
            )}

            {/* TAB 2: Video Studio Frame Preview */}
            {activePreviewTab === 'video' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {(['intro', 'content', 'outro'] as const).map((phase) => (
                    <button
                      key={phase}
                      type="button"
                      onClick={() => setVideoPreviewPhase(phase)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                        videoPreviewPhase === phase
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {phase} Frame
                    </button>
                  ))}
                </div>

                <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-800 p-6 flex flex-col justify-between overflow-hidden shadow-inner">
                  {videoPreviewPhase === 'intro' && (
                    <div className="m-auto text-center space-y-3 animate-fadeIn">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-rose-600/30">
                        N
                      </div>
                      <h4 className="text-lg font-black text-white tracking-tight">{config.wordmark} AI</h4>
                      <p className="text-xs text-amber-300 font-mono">"Generated by {config.wordmark}"</p>
                    </div>
                  )}

                  {videoPreviewPhase === 'content' && (
                    <>
                      <div className="m-auto text-center space-y-1">
                        <Film className="w-8 h-8 text-rose-500 mx-auto animate-pulse" />
                        <div className="text-xs font-bold text-slate-300">Documentary Video Content Stream</div>
                      </div>

                      {/* Corner Watermark on Video Content */}
                      <div
                        className={`absolute p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 shadow-lg ${
                          config.position === 'bottom-right'
                            ? 'bottom-3 right-3'
                            : config.position === 'bottom-left'
                            ? 'bottom-3 left-3'
                            : config.position === 'top-right'
                            ? 'top-3 right-3'
                            : 'top-3 left-3'
                        }`}
                        style={{ opacity: config.opacity }}
                      >
                        <div className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[10px] flex items-center justify-center">
                          N
                        </div>
                        <div className="text-[10px] leading-tight">
                          <div className="font-bold text-white">{config.wordmark}</div>
                          <div className="text-[8px] text-slate-400 font-mono">{config.website}</div>
                        </div>
                      </div>
                    </>
                  )}

                  {videoPreviewPhase === 'outro' && (
                    <div className="m-auto text-center space-y-3 animate-fadeIn">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-xl">
                        N
                      </div>
                      <h4 className="text-xl font-black text-white">{config.wordmark}</h4>
                      <p className="text-xs text-slate-300 italic">{config.slogan}</p>
                      <div className="inline-block px-3 py-1 bg-slate-900 rounded-full border border-slate-700 text-xs font-mono text-amber-400">
                        {config.website}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                  <span>Intro ({config.introDuration}s) + Outro ({config.outroDuration}s)</span>
                  <span className="text-amber-400">Automated Pipeline</span>
                </div>
              </div>
            )}

            {/* Spec summary badge */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <Info className="w-4 h-4" />
                <span>Centralized Service Integration</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                All modules (Image Studio, Video Studio, Document Creator, PDF Exporters, WhatsApp Renderers) import and execute <code className="text-amber-300 font-mono">brandingService.ts</code> for zero-code-change brand updates.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
