import React, { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { applyImageWatermark } from '../services/brandingService';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Upload,
  Download,
  Save,
  Check,
  Loader2,
  HelpCircle,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Maximize2,
  Sliders,
  X,
  FileImage,
  Layers,
  ChevronRight,
  Plus
} from 'lucide-react';

interface HistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  isEdit: boolean;
}

const STYLE_PRESETS = [
  { id: 'vector', name: 'Textbook Vector Diagram', promptSuffix: 'Textbook vector diagram style, clean outlines, high contrast, labeled annotations, professional illustration, white background' },
  { id: 'sketch', name: 'Educational Pencil Sketch', promptSuffix: 'Detailed hand-drawn pencil sketch, educational notebook style, soft graphite shading, fine line art' },
  { id: 'watercolor', name: 'Vibrant Watercolor Painting', promptSuffix: 'Soft watercolor illustration style, flowing artistic colors, bright tones, clean aesthetic background' },
  { id: 'photorealistic', name: 'Photorealistic Textbook Photo', promptSuffix: 'High-quality photorealistic macro shot, textbook photography style, sharp focus, natural classroom lighting, highly detailed' },
  { id: 'lineart', name: 'Minimalist Line Art', promptSuffix: 'Minimalist line art, clean single-stroke outlines, modern contour drawing, simple negative space background' },
  { id: 'none', name: 'Custom (No Preset)', promptSuffix: '' }
];

const SUGGESTED_PROMPTS = [
  'A cross-section diagram of a volcanic eruption showing the magma chamber, vent, and lava flow',
  'An colorful illustration of the solar system showing the orbit paths of all nine planets',
  'A stylized chalkboard sketch of a human heart with labeled chambers, aorta, and ventricles',
  'An elegant geometric diagram illustrating the Pythagorean Theorem with colored squares',
  'A standard laboratory set of beakers, test tubes, and a Bunsen burner, clean vector design'
];

export default function ImageStudio() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'Administrator';
  
  // Tab: 'create' or 'edit'
  const [activeMode, setActiveMode] = useState<'create' | 'edit'>('create');
  
  // State variables for generation
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('vector');
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-image');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  
  // Base image for editing
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [baseImageName, setBaseImageName] = useState<string>('');
  
  // Running state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Output state
  const [outputImageUrl, setOutputImageUrl] = useState<string | null>(null);
  const [outputPrompt, setOutputPrompt] = useState('');
  
  // Library save states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('General');
  const [selectedTopic, setSelectedTopic] = useState('Graphics & Illustrations');

  // Session history
  const [sessionHistory, setSessionHistory] = useState<HistoryItem[]>([]);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Generation progress state
  const [generationProgress, setGenerationProgress] = useState<number>(0);

  // Rotation messages for the loading screen
  const loadingMessages = [
    'Initializing Studio Image Synthesis engine...',
    'Analyzing semantic parameters & aesthetic mood...',
    'Stitching base vectors and color gradients...',
    'Refining contrasts, edges, and visual clarity...',
    'Performing final high-resolution render pass...'
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;
    if (isGenerating) {
      setGenerationStep(0);
      setGenerationProgress(5);
      timer = setInterval(() => {
        setGenerationStep(prev => (prev + 1) % loadingMessages.length);
      }, 2500);
      progressTimer = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 96) return 96;
          return Math.min(prev + Math.floor(Math.random() * 4) + 2, 96);
        });
      }, 350);
    } else {
      setGenerationProgress(0);
    }
    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, [isGenerating]);

  // Handle base image upload (conversion to base64)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBaseImage(event.target.result as string);
        setBaseImageName(file.name);
        setErrorMsg(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the selected file.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Handle the main Image Generation / Editing request
  const handleGenerateOrEdit = async () => {
    if (!prompt.trim()) {
      setErrorMsg('Please enter a description or prompt for the image.');
      return;
    }

    if (activeMode === 'edit' && !baseImage) {
      setErrorMsg('Please upload a base image to edit.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    // Build the final prompt based on chosen preset style
    const selectedPreset = STYLE_PRESETS.find(s => s.id === selectedStyle);
    const finalPrompt = selectedPreset && selectedPreset.promptSuffix
      ? `${prompt}. ${selectedPreset.promptSuffix}`
      : prompt;

    try {
      const payload: any = {
        prompt: finalPrompt,
        model: selectedModel,
        aspectRatio,
        imageSize,
      };

      if (activeMode === 'edit' && baseImage) {
        payload.image = baseImage;
      }

      const res = await fetch('/api/generate-or-edit-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (data.imageUrl) {
        // Automatically apply EduNexus Branding Watermark post-processing
        const brandedUrl = await applyImageWatermark(data.imageUrl);
        setOutputImageUrl(brandedUrl);
        setOutputPrompt(prompt);
        
        // Add to session history
        const historyItem: HistoryItem = {
          id: `hist-${Date.now()}`,
          imageUrl: brandedUrl,
          prompt,
          model: selectedModel,
          aspectRatio,
          isEdit: activeMode === 'edit',
        };
        setSessionHistory(prev => [historyItem, ...prev]);
      } else {
        throw new Error('Image URL was not returned in response.');
      }
    } catch (err: any) {
      console.error('[Image Studio Error]:', err);
      setErrorMsg(err.message || 'An unexpected error occurred during image generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save the generated/edited image to the user's Firestore File Library
  const handleSaveToLibrary = async () => {
    if (!outputImageUrl || !profile?.uid) return;
    
    setIsSaving(true);
    try {
      const fileName = `Generated_${prompt.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
      const newResource = {
        id: `gen-img-${Date.now()}`,
        userId: profile.uid,
        fileName: fileName,
        fileType: 'image/png',
        storagePath: 'image-studio-generations',
        downloadUrl: outputImageUrl, // Store base64 data directly for instant loading
        extractedText: `Generated Illustration using Gemini.\nPrompt: "${outputPrompt}"\nModel used: ${selectedModel}`,
        uploadedAt: new Date().toISOString(),
        subject: selectedSubject,
        topic: selectedTopic,
        folderId: '', // Unorganized
        fileSize: Math.round(outputImageUrl.length * 0.75), // estimated file size in bytes
        accessCount: 0,
        generationCount: 1
      };

      await setDoc(doc(db, 'uploadedResources', newResource.id), newResource);
      setSaveSuccess(true);
    } catch (err: any) {
      console.error('Error saving to library:', err);
      setErrorMsg('Failed to save to the File Library. Please check database permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  // Download image file to system
  const handleDownload = () => {
    if (!outputImageUrl) return;
    const link = document.createElement('a');
    link.href = outputImageUrl;
    link.download = `Gemini_Studio_${prompt.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Move the generated output image directly into the edit module base image slot for infinite iterative refinements
  const handleSendToEditor = () => {
    if (!outputImageUrl) return;
    setBaseImage(outputImageUrl);
    setBaseImageName(`Iterated_Image_${Date.now()}.png`);
    setActiveMode('edit');
    setPrompt(prev => `Modify this: ${prev}`);
  };

  return (
    <div className="space-y-6" id="image-studio-workspace">
      {/* Page Title & Concept banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#5f6f52]/10 rounded-xl text-[#5f6f52]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Creative Image Studio</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Harness the power of <strong>Studio Visual Synthesis</strong> to create beautiful visual aids, textbook illustrations, and step-by-step custom diagrams directly inside your portal.
          </p>
        </div>

        {/* Studio Mode Selector (Tabs) */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 self-stretch md:self-auto">
          <button
            onClick={() => {
              setActiveMode('create');
              setErrorMsg(null);
            }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'create'
                ? 'bg-white text-[#5f6f52] shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New</span>
          </button>
          <button
            onClick={() => {
              setActiveMode('edit');
              setErrorMsg(null);
            }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'edit'
                ? 'bg-white text-[#5f6f52] shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Edit & Transform</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Control Panel / Input Form */}
        <div className="lg:col-span-5 bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-700">Studio Configuration</h2>
          </div>

          {/* Error feedback */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex gap-2 items-start animate-fadeIn">
              <span className="font-bold">⚠️ Error:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Base Image Upload (only visible in EDIT mode) */}
          {activeMode === 'edit' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                1. Base Image to Edit
              </label>
              
              {!baseImage ? (
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-[#5f6f52] hover:bg-slate-50/50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="p-3 bg-slate-50 rounded-full text-slate-400 group-hover:text-[#5f6f52] group-hover:bg-[#5f6f52]/5 transition-all">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Drag & drop your source image here
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Supports PNG, JPG, or JPEG up to 10MB
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold group-hover:bg-[#5f6f52] group-hover:text-white transition-all"
                  >
                    Browse Files
                  </button>
                </div>
              ) : (
                <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50 p-3 relative flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0">
                    <img
                      src={baseImage}
                      alt="Source image"
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{baseImageName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Loaded successfully</p>
                  </div>
                  <button
                    onClick={() => {
                      setBaseImage(null);
                      setBaseImageName('');
                    }}
                    className="p-1.5 hover:bg-slate-200/50 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              {activeMode === 'edit' ? '2. Edit / Transformation Prompt' : '1. Prompt / Description'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeMode === 'edit'
                  ? 'Describe exactly how you want to alter the image (e.g. "change the background color to white" or "add a cartoon rocket next to the planet")'
                  : 'Describe the educational illustration, custom diagram, or scenery you want to generate in detail...'
              }
              className="w-full h-28 p-3 text-xs border border-slate-200 focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52] rounded-xl outline-none resize-none transition-all placeholder:text-slate-400 leading-relaxed font-sans"
            />
            
            {/* Quick Prompt Suggesters */}
            {activeMode === 'create' && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTED_PROMPTS.slice(0, 3).map((sPrompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(sPrompt)}
                    className="text-[10px] bg-slate-50 text-slate-600 hover:bg-slate-100 px-2.5 py-1 rounded-md text-left truncate max-w-full cursor-pointer border border-slate-100 transition-colors"
                    title={sPrompt}
                  >
                    💡 {sPrompt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Art Style Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              {activeMode === 'edit' ? '3. Modifying Art Style' : '2. Art Style Preset'}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedStyle(preset.id)}
                  className={`p-2.5 text-left border rounded-xl transition-all cursor-pointer flex flex-col justify-between h-14 ${
                    selectedStyle === preset.id
                      ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[11px] font-bold block">{preset.name}</span>
                  <span className="text-[9px] text-slate-400 truncate w-full mt-0.5">
                    {preset.id === 'none' ? 'Custom parameters only' : preset.promptSuffix}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection (Admin Toggle / Non-Admin Fallback Badge) */}
          {isAdmin ? (
            <div className="space-y-2 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  AI Generation Engine Mode (Admin Only)
                </label>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                  Admin Control
                </span>
              </div>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  if (e.target.value === 'gemini-3.1-flash-lite-image' || e.target.value === 'nano banana' || e.target.value === 'nanobanana_only') {
                    // Lite / Nano Banana does not support large sizes
                    setImageSize('1K');
                  }
                }}
                className="w-full p-2.5 border border-amber-300 dark:border-amber-700 rounded-xl text-xs outline-none bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                <option value="emgen_fallback_nanobanana">🍌 Nano Banana as Fallback for Emgen (Recommended / Dual-Engine)</option>
                <option value="gemini-3.1-flash-image">🎨 Use Emgen Only (High Quality)</option>
                <option value="gemini-3.1-flash-lite-image">🍌 Use Nano Banana Only (Rapid)</option>
              </select>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 font-medium">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <div>
                  <span className="font-bold block text-slate-800 dark:text-slate-100">Active Engine: Emgen (High Quality)</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block">Nano Banana configured as automatic fallback if required</span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/80 rounded-full text-emerald-800 dark:text-emerald-200">
                Auto Fallback ON
              </span>
            </div>
          )}

          {/* Size & Aspect Ratio Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Aspect Ratio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs outline-none bg-white text-slate-700 font-medium"
              >
                <option value="1:1">1:1 (Square)</option>
                <option value="4:3">4:3 (Standard)</option>
                <option value="3:4">3:4 (Portrait)</option>
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Vertical)</option>
              </select>
            </div>

            {/* Quality Size */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Image Resolution
              </label>
              <select
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value)}
                disabled={selectedModel === 'gemini-3.1-flash-lite-image' || selectedModel === 'nano banana'}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs outline-none bg-white text-slate-700 font-medium disabled:bg-slate-50 disabled:text-slate-450"
              >
                <option value="512px">512px (Small)</option>
                <option value="1K">1K (Default Standard)</option>
                <option value="2K">2K (High Def)</option>
                <option value="4K">4K (Ultra HD)</option>
              </select>
            </div>
          </div>

          {/* Action Trigger Button with Real-time Progress Bar */}
          <button
            onClick={handleGenerateOrEdit}
            disabled={isGenerating}
            className="w-full bg-[#5f6f52] hover:bg-[#4b5840] disabled:bg-slate-300 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:cursor-not-allowed relative overflow-hidden group"
          >
            {isGenerating ? (
              <>
                <div
                  className="absolute left-0 top-0 bottom-0 bg-[#4b5840]/70 transition-all duration-300 ease-out"
                  style={{ width: `${generationProgress}%` }}
                />
                <div className="relative z-10 flex items-center justify-center gap-2 w-full">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Weaving Visuals ({Math.round(generationProgress)}%)...</span>
                </div>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>{activeMode === 'edit' ? 'Apply Image Edit' : 'Generate Masterpiece'}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output Canvas and Operations */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Main Visual Display Frame */}
          <div className="bg-slate-50/50 border border-slate-150 rounded-2xl min-h-[460px] flex flex-col items-center justify-center p-6 relative overflow-hidden bg-radial-grid">
            
            <AnimatePresence mode="wait">
              {isGenerating ? (
                // LOADING STATE WITH CIRCULAR RING & PERCENTAGE BAR
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center text-center max-w-md w-full p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-lg space-y-5"
                >
                  {/* Circular Progress Ring */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Outer track */}
                      <circle
                        cx="56"
                        cy="56"
                        r="46"
                        className="text-slate-150 stroke-current"
                        strokeWidth="7"
                        fill="transparent"
                      />
                      {/* Progress ring fill */}
                      <circle
                        cx="56"
                        cy="56"
                        r="46"
                        className="text-[#5f6f52] stroke-current transition-all duration-300 ease-out"
                        strokeWidth="7"
                        strokeDasharray={289}
                        strokeDashoffset={289 - (289 * generationProgress) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-extrabold text-[#5f6f52] font-mono tracking-tight">
                        {Math.round(generationProgress)}%
                      </span>
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse mt-0.5" />
                    </div>
                  </div>
                  
                  {/* Message & Progress Bar */}
                  <div className="w-full space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-800">Synthesizing Creative Artwork</h3>
                      <p className="text-xs text-[#5f6f52] font-semibold animate-pulse h-5">
                        {loadingMessages[generationStep]}
                      </p>
                    </div>

                    {/* Linear Percentage Progress Bar */}
                    <div className="w-full space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span>Stage {generationStep + 1} of {loadingMessages.length}</span>
                        <span className="font-mono">{Math.round(generationProgress)}% Completed</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-[#5f6f52] via-emerald-500 to-amber-500 rounded-full transition-all duration-300 shadow-xs"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : outputImageUrl ? (
                // SUCCESSFUL GENERATION OUTPUT
                <motion.div
                  key="output"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full flex flex-col space-y-4"
                >
                  {/* Image Container with precise aspect boundaries */}
                  <div className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-xs relative group/canvas flex flex-col p-2 min-h-[300px]">
                    {/* Top left Brand Header for EduNexus on Image */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-slate-200/50 rounded-lg px-2.5 py-1.5 shadow-sm">
                      <img src="/icon.svg" alt="EduNexus Logo" className="w-4 h-4 rounded" referrerPolicy="no-referrer" />
                      <span className="text-[10px] font-black tracking-wider text-[#5f6f52] uppercase font-sans">EduNexus</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-2 pt-12">
                      <img
                        src={outputImageUrl}
                        alt={outputPrompt}
                        className="max-w-full max-h-[400px] object-contain rounded-lg transition-transform duration-300 group-hover/canvas:scale-[1.01]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    {/* Size and info tag */}
                    <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[9px] text-white font-mono tracking-wider">
                      {aspectRatio} • {imageSize} • {selectedModel.replace('-image', '')}
                    </div>
                  </div>

                  {/* Core Action Tools */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-slate-150 rounded-xl shadow-xs">
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownload}
                        className="px-3 py-2 bg-[#5f6f52] hover:bg-[#4b5840] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PNG</span>
                      </button>
                      <button
                        onClick={handleSendToEditor}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit Image</span>
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400 italic max-w-xs truncate text-right">
                      "{outputPrompt}"
                    </div>
                  </div>

                  {/* Save to File Library Interface */}
                  <div className="bg-white border border-slate-150 rounded-xl p-4 space-y-3.5 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <FolderOpen className="w-4 h-4 text-slate-400" />
                      <h3 className="text-xs font-bold text-slate-700">Publish/Save to Lesson Library</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">
                          Curriculum Subject
                        </label>
                        <select
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none bg-white text-slate-700"
                        >
                          <option value="General">General/Interdisciplinary</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="English Language">English Language</option>
                          <option value="Kiswahili">Kiswahili</option>
                          <option value="Biology">Biology</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Physics">Physics</option>
                          <option value="Geography">Geography</option>
                          <option value="History">History</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">
                          Lesson Topic / Tag
                        </label>
                        <input
                          type="text"
                          value={selectedTopic}
                          onChange={(e) => setSelectedTopic(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#5f6f52]"
                          placeholder="e.g. Volcanoes, Fractions, Plant Cells"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <p className="text-[10px] text-slate-400 max-w-sm">
                        Saves this generated image into the centralized File Library so it can be utilized inside documents or by EduNexus AI Tutor.
                      </p>

                      <button
                        onClick={handleSaveToLibrary}
                        disabled={isSaving || saveSuccess}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          saveSuccess
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 hover:bg-[#5f6f52] hover:text-white text-slate-700'
                        }`}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : saveSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Saved to Library!</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save to Library</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                // INTRO / IDLE STATE
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-center max-w-sm space-y-4"
                >
                  <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                    <FileImage className="w-10 h-10 stroke-1" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Masterpiece Waiting to Happen</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Configure your prompt & specifications on the left, then click generate to craft beautiful educational visuals.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Session History Gallery */}
          {sessionHistory.length > 0 && (
            <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-700">Studio Session History</h3>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {sessionHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setOutputImageUrl(item.imageUrl);
                      setPrompt(item.prompt);
                      setAspectRatio(item.aspectRatio);
                      setSelectedModel(item.model);
                      setErrorMsg(null);
                      setSaveSuccess(false);
                    }}
                    className={`aspect-square rounded-xl border overflow-hidden relative group cursor-pointer hover:border-[#5f6f52] transition-all bg-white p-1 flex items-center justify-center ${
                      outputImageUrl === item.imageUrl ? 'border-[#5f6f52] ring-2 ring-[#5f6f52]/10' : 'border-slate-250'
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white uppercase tracking-wider px-1 text-center truncate w-full">
                        Load
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
