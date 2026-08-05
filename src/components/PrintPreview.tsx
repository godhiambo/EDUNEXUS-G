import React, { useState } from 'react';
import { SavedDocument } from '../types';
import { 
  X, 
  Printer, 
  Settings, 
  Eye, 
  Maximize, 
  FileText, 
  Info,
  Sliders,
  Type,
  FileCheck,
  Sparkles,
  ListOrdered
} from 'lucide-react';
import MarkdownView from './MarkdownView';
import { NexusWatermark } from './NexusWatermark';
import { extractDocumentHeadings } from '../utils/toc';

interface PrintPreviewProps {
  document: SavedDocument;
  onClose: () => void;
  onUpdate?: (updatedDoc: SavedDocument) => void;
}

type PaperSize = 'a4' | 'letter';
type MarginSize = 'none' | 'narrow' | 'normal' | 'wide';
type PrintTheme = 'digital' | 'lined' | 'dyslexic';
type ColorMode = 'color' | 'grayscale';
type FontFamily = 'sans' | 'serif' | 'mono';
type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

export default function PrintPreview({ document: docObj, onClose, onUpdate }: PrintPreviewProps) {
  const headings = extractDocumentHeadings(docObj.content);
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    docObj.pageOrientation || 'portrait'
  );

  const handleOrientationChange = (newOrientation: 'portrait' | 'landscape') => {
    setOrientation(newOrientation);
    if (onUpdate && docObj) {
      onUpdate({
        ...docObj,
        pageOrientation: newOrientation,
        lastModified: new Date().toISOString()
      });
    }
  };
  const [marginSize, setMarginSize] = useState<MarginSize>('normal');
  const [printTheme, setPrintTheme] = useState<PrintTheme>(
    docObj.docType === 'lesson-notes' || docObj.docType === 'worksheet' ? 'lined' : 'digital'
  );
  const [colorMode, setColorMode] = useState<ColorMode>('color');
  const [fontFamily, setFontFamily] = useState<FontFamily>('sans');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [includeReflection, setIncludeReflection] = useState<boolean>(false);
  const [includeToc, setIncludeToc] = useState<boolean>(headings.length >= 2);
  const [customFooter, setCustomFooter] = useState<string>(`Generated via Syllabus AI — ${docObj.subject || 'Academic Resources'}`);

  const handlePrint = () => {
    window.print();
  };

  // Map settings to CSS classes or inline style options
  const getMarginClass = () => {
    switch (marginSize) {
      case 'none': return 'p-2';
      case 'narrow': return 'p-6 md:p-8';
      case 'normal': return 'p-10 md:p-14';
      case 'wide': return 'p-14 md:p-20';
    }
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'sans': return 'font-sans';
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-xs leading-relaxed';
      case 'medium': return 'text-sm leading-relaxed md:text-base';
      case 'large': return 'text-base leading-relaxed md:text-lg';
      case 'xlarge': return 'text-lg leading-relaxed md:text-xl';
    }
  };

  // Paper preview style dimensions (maintains aspect ratios for visual simulation)
  const getPaperDimensions = () => {
    if (orientation === 'landscape') {
      return 'w-full max-w-[1080px] min-h-[360px] pb-12';
    } else {
      return paperSize === 'a4'
        ? 'w-full max-w-[800px] min-h-[250px] pb-12'
        : 'w-full max-w-[816px] min-h-[250px] pb-12';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex flex-col overflow-hidden animate-fadeIn print:absolute print:inset-0 print:bg-white print:p-0 print:m-0">
      {/* Dynamic Style Injection for Native Printer settings */}
      <style>{`
        @media print {
          /* Hide everything except the print workspace */
          body * {
            visibility: hidden !important;
          }

          .print-preview-paper,
          .print-preview-paper * {
            visibility: visible !important;
          }

          /* Reset absolute layout on printed paper */
          .print-preview-paper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 100% !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            padding: ${
              marginSize === 'none' ? '0px' :
              marginSize === 'narrow' ? '0.5in' :
              marginSize === 'normal' ? '1in' : '1.5in'
            } !important;
            margin: 0 !important;
            color: black !important;
          }

          /* Force page size layout rules */
          @page {
            size: ${paperSize === 'a4' ? 'A4' : 'letter'} ${orientation};
            margin: 0;
          }

          /* Force colors or greyscale output */
          .print-grayscale {
            filter: grayscale(100%) !important;
          }

          /* Custom font styling rules for print media */
          .print-sans {
            font-family: "Inter", ui-sans-serif, system-ui, sans-serif !important;
          }
          .print-serif {
            font-family: Georgia, Cambria, "Times New Roman", Times, serif !important;
          }
          .print-mono {
            font-family: "JetBrains Mono", ui-monospace, monospace !important;
          }

          /* Dyslexic layout print parameters */
          .print-dyslexic-spacing {
            word-spacing: 0.18em !important;
            letter-spacing: 0.08em !important;
            line-height: 2 !important;
          }

          /* Avoid breaking items awkwardly across printed sheets */
          h1, h2, h3, h4, th {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          
          tr, img, pre, blockquote, .diagram-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Prevent notebooks from printing dark grey ruled lines - force neat visual output */
          .print-notebook-paper {
            background-color: #faf6ee !important;
            background-image: linear-gradient(#c5d1e0 1px, transparent 1px) !important;
            background-size: 100% 1.85rem !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            border: 1px solid #eadecd !important;
            border-radius: 8px !important;
          }

          .print-notebook-paper::before {
            background-color: rgba(239, 68, 68, 0.4) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* TOP NAVIGATION / HEADER (no-print) */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between shadow-md shrink-0 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5f6f52] flex items-center justify-center text-white shadow-inner">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold flex items-center gap-2">
              Print Studio & Document Preview
              <span className="text-[10px] uppercase font-black bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
                Interactive layout
              </span>
            </h2>
            <p className="text-xs text-slate-400">Configure visual themes, margin dimensions and optimize for physical printing.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Preview</span>
          </button>
        </div>
      </div>

      {/* MAIN WORKSPACE SPLIT LAYOUT */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT CONFIGURATION PANEL (no-print) */}
        <div className="w-full lg:w-[350px] bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 no-print text-slate-200">
          
          {/* Section: Layout Config */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-[#d4a373] uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5" /> Paper Settings
            </h3>

            {/* Paper Size */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Paper Size</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaperSize('a4')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    paperSize === 'a4' 
                      ? 'bg-slate-800 border-[#5f6f52] text-white' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  📄 A4 (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('letter')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    paperSize === 'letter' 
                      ? 'bg-slate-800 border-[#5f6f52] text-white' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  📄 US Letter
                </button>
              </div>
            </div>

            {/* Orientation */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Page Orientation</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOrientationChange('portrait')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    orientation === 'portrait' 
                      ? 'bg-slate-800 border-[#5f6f52] text-white shadow-xs' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Portrait</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOrientationChange('landscape')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    orientation === 'landscape' 
                      ? 'bg-slate-800 border-[#5f6f52] text-white shadow-xs' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 rotate-90" />
                  <span>Landscape</span>
                </button>
              </div>
            </div>

            {/* Margins */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Page Margins</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['none', 'narrow', 'normal', 'wide'] as MarginSize[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMarginSize(m)}
                    className={`py-1.5 text-[11px] capitalize font-bold rounded-lg border transition ${
                      marginSize === m 
                        ? 'bg-slate-800 border-[#5f6f52] text-white' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Section: Typography */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-[#d4a373] uppercase tracking-wider flex items-center gap-2">
              <Type className="w-3.5 h-3.5" /> Typography & Sizing
            </h3>

            {/* Font Family */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Font Family</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFontFamily('sans')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    fontFamily === 'sans' 
                      ? 'bg-slate-800 border-[#5f6f52] text-white' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                  style={{ fontFamily: 'sans-serif' }}
                >
                  Sans
                </button>
                <button
                  onClick={() => setFontFamily('serif')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    fontFamily === 'serif' 
                      ? 'bg-slate-800 border-[#5f6f52] text-white' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                  style={{ fontFamily: 'serif' }}
                >
                  Serif
                </button>
                <button
                  onClick={() => setFontFamily('mono')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    fontFamily === 'mono' 
                      ? 'bg-slate-800 border-[#5f6f52] text-white' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                  style={{ fontFamily: 'monospace' }}
                >
                  Mono
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Font Size</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['small', 'medium', 'large', 'xlarge'] as FontSize[]).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setFontSize(sz)}
                    className={`py-1.5 text-[10px] capitalize font-bold rounded-lg border transition ${
                      fontSize === sz 
                        ? 'bg-slate-800 border-[#5f6f52] text-white' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                    }`}
                  >
                    {sz === 'xlarge' ? 'XL' : sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Section: Print theme styling */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-[#d4a373] uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-3.5 h-3.5" /> Presentation Style
            </h3>

            {/* Print Theme */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Syllabus Template</label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setPrintTheme('digital')}
                  className={`py-2.5 px-3 text-left text-xs font-bold rounded-xl border transition flex items-center gap-2.5 ${
                    printTheme === 'digital' 
                      ? 'bg-slate-800 border-[#5f6f52] text-white' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <span>💻</span>
                  <div>
                    <p className="font-bold">Standard Professional Document</p>
                    <p className="text-[9px] text-slate-400 font-normal">Sleek layout for hand-outs, exams, and formal reviews.</p>
                  </div>
                </button>
                <button
                  onClick={() => setPrintTheme('lined')}
                  className={`py-2.5 px-3 text-left text-xs font-bold rounded-xl border transition flex items-center gap-2.5 ${
                    printTheme === 'lined' 
                      ? 'bg-slate-800 border-[#5f6f52] text-white' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <span>📝</span>
                  <div>
                    <p className="font-bold">Lined Notebook Paper</p>
                    <p className="text-[9px] text-slate-400 font-normal">Adds ruled horizontal guidelines, ideal for pupils' handwriting notes.</p>
                  </div>
                </button>
                <button
                  onClick={() => setPrintTheme('dyslexic')}
                  className={`py-2.5 px-3 text-left text-xs font-bold rounded-xl border transition flex items-center gap-2.5 ${
                    printTheme === 'dyslexic' 
                      ? 'bg-slate-800 border-[#5f6f52] text-white' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <span>🧠</span>
                  <div>
                    <p className="font-bold">Dyslexia-Friendly Layout</p>
                    <p className="text-[9px] text-slate-400 font-normal">Increases word & letter spacing. Maximizes readability for SEN/inclusive needs.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Ink Budget Optimization */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Color Mode (Ink Optimization)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setColorMode('color')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                    colorMode === 'color' 
                      ? 'bg-slate-800 border-[#5f6f52] text-white' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  🎨 Full Color
                </button>
                <button
                  onClick={() => setColorMode('grayscale')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                    colorMode === 'grayscale' 
                      ? 'bg-slate-800 border-[#d4a373] text-white' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  🪙 Black & White
                </button>
              </div>
              {colorMode === 'grayscale' && (
                <p className="text-[9px] text-amber-300 leading-tight flex items-center gap-1 mt-1">
                  <Info className="w-3 h-3 shrink-0" />
                  Converts images and banners to pure grayscale to conserve school printer ink cartridges.
                </p>
              )}
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Section: Document Sections */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-[#d4a373] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Content Scope & Navigation
            </h3>

            {/* Include Table of Contents option */}
            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={includeToc}
                onChange={(e) => setIncludeToc(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-800 bg-slate-950 text-[#5f6f52] focus:ring-[#5f6f52]"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-[#d4a373]" />
                  Auto Table of Contents
                </span>
                <p className="text-[10px] text-slate-400 font-normal leading-tight">
                  Generates document index with dotted leader lines linking headings directly to printed page numbers.
                </p>
              </div>
            </label>

            {/* Include CPD reflection */}
            {docObj.isArchived && (
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeReflection}
                  onChange={(e) => setIncludeReflection(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-[#5f6f52] focus:ring-[#5f6f52]"
                />
                <span>Include Teacher CPD Reflection</span>
              </label>
            )}

            {/* Custom footer text */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Document Footer</label>
              <input
                type="text"
                value={customFooter}
                onChange={(e) => setCustomFooter(e.target.value)}
                placeholder="Optional print footer..."
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-[#5f6f52]"
              />
            </div>
          </div>

        </div>

        {/* RIGHT SIMULATED CANVAS/PAPER VIEW */}
        <div className="flex-1 bg-slate-800/80 p-6 md:p-8 overflow-auto flex justify-center items-start print:p-0 print:m-0 print:bg-white">
          <div 
            className={`print-preview-paper bg-white border border-slate-200 shadow-2xl overflow-hidden transition-all duration-300 relative ${getPaperDimensions()} ${getMarginClass()} ${
              colorMode === 'grayscale' ? 'print-grayscale grayscale' : ''
            } ${
              printTheme === 'lined' ? 'print-notebook-paper notebook-paper py-8 pr-4' : ''
            }`}
          >
            {/* EduNexus Watermark Background & Corner Branding Overlay */}
            <NexusWatermark />

            {/* Header branding overlay (no-print) */}
            <div className="mb-4 pb-2 border-b border-dashed border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-semibold no-print">
              <span className="flex items-center gap-1.5 uppercase">
                <Eye className="w-3 h-3 text-[#5f6f52]" />
                Interactive Page Layout View ({paperSize === 'a4' ? 'A4 Size' : 'US Letter'})
              </span>
              <span>Margins: {marginSize}</span>
            </div>

            {/* Actual Document Title */}
            <div className={`mb-6 ${getFontFamilyClass()} print-${fontFamily}`}>
              {/* EduNexus Brand Header (Top Left corner of document) */}
              <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 pb-3">
                <img src="/icon.svg" alt="EduNexus Logo" className="w-8 h-8 rounded-lg shadow-xs" referrerPolicy="no-referrer" />
                <div className="flex flex-col">
                  <span className="text-xs font-black tracking-wider text-[#5f6f52] uppercase font-sans">EduNexus</span>
                  <span className="text-[9px] text-slate-400 font-mono tracking-tight uppercase">Curriculum Library</span>
                </div>
              </div>

              <h1 className={`font-bold text-3xl text-slate-900 border-b border-slate-200 pb-3 leading-tight ${
                printTheme === 'lined' ? 'text-[#3b5e2b]' : 'text-[#2c421e]'
              }`}>
                {docObj.title}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-2">
                <span><strong>Subject:</strong> {docObj.subject || 'General'}</span>
                <span><strong>Class Level:</strong> {docObj.classLevel || 'Standard'}</span>
                {docObj.topic && <span><strong>Topic:</strong> {docObj.topic}</span>}
                <span><strong>Updated:</strong> {new Date(docObj.lastModified || docObj.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Table of Contents block for Print & Screen Navigation */}
            {includeToc && headings.length >= 2 && (
              <div className="print-toc-container mb-8 p-4.5 bg-slate-50/90 border border-slate-250 rounded-2xl">
                <div className="print-toc-header flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 font-sans">
                    <ListOrdered className="w-4 h-4 text-[#5f6f52]" />
                    Table of Contents
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {headings.length} Headings • Physical Print Navigation
                  </span>
                </div>
                <ul className="print-toc-list space-y-2 text-xs font-sans">
                  {headings.map((h, idx) => (
                    <li
                      key={h.id || idx}
                      className={`print-toc-item flex items-baseline justify-between gap-2 ${
                        h.level === 1 ? 'print-toc-item-h1 font-bold text-slate-900 mt-2 border-b border-slate-100 pb-1' :
                        h.level === 2 ? 'print-toc-item-h2 font-semibold text-slate-800 pl-3' :
                        'print-toc-item-h3 text-slate-600 pl-6'
                      }`}
                    >
                      <a
                        href={`#${h.id}`}
                        className="print-toc-title hover:text-[#5f6f52] hover:underline flex items-center gap-1 min-w-0"
                      >
                        <span className="truncate">{h.text}</span>
                      </a>
                      <span className="print-toc-leader flex-1 border-b border-dotted border-slate-300 mx-2"></span>
                      <a href={`#${h.id}`} className="print-toc-page-num text-slate-700 font-mono text-[11px] font-bold shrink-0">
                        Page {h.pageNumber || 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Document Content */}
            <div className={`prose prose-slate max-w-none ${getFontFamilyClass()} print-${fontFamily} ${getFontSizeClass()} ${
              printTheme === 'dyslexic' ? 'print-dyslexic-spacing tracking-wide text-justify md:leading-[1.9]' : ''
            } ${
              printTheme === 'lined' ? 'handwritten-content leading-loose' : ''
            }`}>
              <MarkdownView
                content={docObj.content}
                generatingPlaceholders={{}}
              />

              {/* Dynamic CPD Reflection Content (if selected) */}
              {includeReflection && docObj.isArchived && (
                <div className="mt-12 pt-6 border-t-2 border-slate-300 page-break-before-avoid no-break-inside">
                  <h3 className="text-base font-bold text-[#8c6b45] font-serif mb-3 uppercase tracking-wider flex items-center gap-1">
                    🧠 Post-Lesson CPD Professional Reflection
                  </h3>
                  
                  <div className="space-y-4 text-xs md:text-sm text-slate-700">
                    {docObj.reflectionWorked && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <strong className="block text-slate-900 mb-1">What Worked Well:</strong>
                        <p className="italic leading-relaxed">{docObj.reflectionWorked}</p>
                      </div>
                    )}
                    {docObj.reflectionDidntWork && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <strong className="block text-slate-900 mb-1">What Didn't Work as Expected:</strong>
                        <p className="italic leading-relaxed">{docObj.reflectionDidntWork}</p>
                      </div>
                    )}
                    {docObj.reflectionAdjustments && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <strong className="block text-slate-900 mb-1">Immediate Remedial Adaptations:</strong>
                        <p className="italic leading-relaxed">{docObj.reflectionAdjustments}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer section */}
            {customFooter && (
              <div className="mt-16 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono flex justify-between">
                <span>{customFooter}</span>
                <span>Page 1 of 1</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
