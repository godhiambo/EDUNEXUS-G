import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Wand2, 
  Check, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  X, 
  Sparkles,
  SpellCheck,
  AlignLeft
} from 'lucide-react';
import { 
  SpellError, 
  checkTextSpellingClient, 
  checkTextSpellingAI 
} from '../utils/spellcheck';
import { quickFormatEducationalText } from '../utils/quickFormat';

interface RealtimeSpellcheckEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  id?: string;
  className?: string;
  required?: boolean;
  activeMicField?: string | null;
  micButton?: React.ReactNode;
  showStatusIndicatorBar?: boolean;
  enableAISpellcheck?: boolean;
}

export default function RealtimeSpellcheckEditor({
  value,
  onChange,
  placeholder = "Type or dictate text here...",
  rows = 4,
  label,
  id,
  className = "",
  required = false,
  activeMicField,
  micButton,
  showStatusIndicatorBar = true,
  enableAISpellcheck = true
}: RealtimeSpellcheckEditorProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [ignoredWords, setIgnoredWords] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<SpellError[]>([]);
  const [isCheckingAI, setIsCheckingAI] = useState<boolean>(false);
  const [activeErrorId, setActiveErrorId] = useState<string | null>(null);
  const [isFixAllDone, setIsFixAllDone] = useState<boolean>(false);
  const [isQuickFormattedDone, setIsQuickFormattedDone] = useState<boolean>(false);
  const [isSimplifyingSentence, setIsSimplifyingSentence] = useState<boolean>(false);
  const [isSimplifyingParagraph, setIsSimplifyingParagraph] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Quick format handler: applies standard educational headings, lists, bolding, and spacing
  const handleQuickFormat = () => {
    if (!value || value.trim().length === 0) return;
    const formatted = quickFormatEducationalText(value);
    onChange(formatted);
    setIsQuickFormattedDone(true);
    setTimeout(() => setIsQuickFormattedDone(false), 2500);
  };

  // Gemini API Simplify Sentence handler for highlighted text selection
  const handleSimplifySentence = async (overrideText?: string) => {
    if (!textareaRef.current || !value || !value.trim()) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    let selectedText = overrideText || value.substring(start, end).trim();

    if (!selectedText) {
      alert("Please highlight/select a sentence or phrase in the text field first before clicking 'Simplify Sentence'.");
      return;
    }

    setIsSimplifyingSentence(true);
    try {
      const response = await fetch('/api/simplify-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          targetLevel: 'simple'
        })
      });
      const data = await response.json();
      if (data && data.simplifiedText) {
        const updated = value.substring(0, start) + data.simplifiedText + value.substring(end);
        onChange(updated);
      } else {
        alert(data.error || 'Failed to simplify sentence.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error simplifying sentence: ' + (err.message || err));
    } finally {
      setIsSimplifyingSentence(false);
      setContextMenu(null);
    }
  };

  // Gemini API Simplify Entire Paragraph handler for batch selection / multiple lines at once
  const handleSimplifyParagraph = async () => {
    if (!textareaRef.current || !value || !value.trim()) return;
    let start = textareaRef.current.selectionStart;
    let end = textareaRef.current.selectionEnd;

    // If no text is selected or range is narrow, expand selection to encompass full paragraph batch around caret
    if (start === end || (end - start < 3)) {
      let pStart = value.lastIndexOf('\n\n', start);
      pStart = pStart === -1 ? 0 : pStart + 2;

      let pEnd = value.indexOf('\n\n', end);
      pEnd = pEnd === -1 ? value.length : pEnd;

      start = pStart;
      end = pEnd;

      textareaRef.current.setSelectionRange(start, end);
    }

    const batchText = value.substring(start, end).trim();

    if (!batchText) {
      alert("Please place your cursor inside a paragraph or select multiple lines to simplify.");
      return;
    }

    setIsSimplifyingParagraph(true);
    try {
      const response = await fetch('/api/simplify-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: batchText,
          targetLevel: 'simple',
          isParagraphBatch: true
        })
      });
      const data = await response.json();
      if (data && data.simplifiedText) {
        const updated = value.substring(0, start) + data.simplifiedText + value.substring(end);
        onChange(updated);
      } else {
        alert(data.error || 'Failed to simplify paragraph.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error simplifying paragraph: ' + (err.message || err));
    } finally {
      setIsSimplifyingParagraph(false);
      setContextMenu(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = value.substring(start, end).trim();

    if (selected || value.trim().length > 0) {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        text: selected || 'current paragraph'
      });
    }
  };

  // Perform real-time spellcheck on value changes
  useEffect(() => {
    if (!isEnabled || !value || value.trim().length === 0) {
      setErrors([]);
      return;
    }

    // Immediate fast client-side check for 0ms visual responsiveness
    const clientErrors = checkTextSpellingClient(value, ignoredWords);
    setErrors(clientErrors);

    // Debounced AI spellcheck check if enabled
    if (enableAISpellcheck && value.trim().length > 10) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        setIsCheckingAI(true);
        try {
          const aiErrors = await checkTextSpellingAI(value, ignoredWords);
          setErrors(aiErrors);
        } catch (e) {
          console.warn("Spellcheck AI update failed:", e);
        } finally {
          setIsCheckingAI(false);
        }
      }, 700);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [value, isEnabled, ignoredWords, enableAISpellcheck]);

  // Replace a specific misspelled word with chosen replacement
  const handleFixWord = (original: string, replacement: string) => {
    if (!value) return;

    // Replace exact word boundary match or first occurrence
    const regex = new RegExp(`\\b${original}\\b`, 'g');
    const updatedValue = value.replace(regex, replacement);
    onChange(updatedValue);

    setErrors(prev => prev.filter(err => err.original !== original));
    if (activeErrorId && activeErrorId.includes(original)) {
      setActiveErrorId(null);
    }
  };

  // Replace ALL misspelled words at once
  const handleFixAll = () => {
    if (errors.length === 0 || !value) return;

    let updatedValue = value;
    errors.forEach(err => {
      if (err.suggestion && err.original) {
        const regex = new RegExp(`\\b${err.original}\\b`, 'g');
        updatedValue = updatedValue.replace(regex, err.suggestion);
      }
    });

    onChange(updatedValue);
    setErrors([]);
    setIsFixAllDone(true);
    setTimeout(() => setIsFixAllDone(false), 2500);
  };

  // Ignore word
  const handleIgnoreWord = (word: string) => {
    setIgnoredWords(prev => new Set(prev).add(word.toLowerCase()));
    setErrors(prev => prev.filter(err => err.original.toLowerCase() !== word.toLowerCase()));
  };

  // Render highlighted text backdrop with subtle red underlines
  const highlightedBackdrop = useMemo(() => {
    if (!isEnabled || !value || errors.length === 0) return null;

    // Create spans with red underlines under misspelled words
    let parts: React.ReactNode[] = [];
    let lastIdx = 0;

    // Sort errors by index
    const sortedErrors = [...errors].sort((a, b) => a.index - b.index);

    sortedErrors.forEach((err, idx) => {
      if (err.index > lastIdx) {
        parts.push(
          <span key={`text-${lastIdx}`}>
            {value.substring(lastIdx, err.index)}
          </span>
        );
      }

      const isSelected = activeErrorId === err.id;
      parts.push(
        <span
          key={err.id || `err-${idx}`}
          className={`relative cursor-pointer transition-colors duration-150 rounded-xs font-semibold ${
            err.severity === 'error'
              ? 'underline decoration-wavy decoration-red-500/90 decoration-2 bg-red-100/60 text-slate-900'
              : 'underline decoration-dashed decoration-amber-500/90 decoration-2 bg-amber-100/60 text-slate-900'
          } ${isSelected ? 'ring-2 ring-red-400 bg-red-150' : ''}`}
          onClick={() => setActiveErrorId(activeErrorId === err.id ? null : err.id)}
          title={`${err.explanation} (Click to see fix)`}
        >
          {err.original}
        </span>
      );

      lastIdx = err.index + err.length;
    });

    if (lastIdx < value.length) {
      parts.push(
        <span key={`text-end-${lastIdx}`}>
          {value.substring(lastIdx)}
        </span>
      );
    }

    return parts;
  }, [value, errors, isEnabled, activeErrorId]);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header and Real-time Spellcheck Indicator Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        {showStatusIndicatorBar && (
          <div className="flex items-center gap-2 ml-auto">
            {/* Realtime Spellcheck Toggle & Indicator Pill */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-2xs">
              <SpellCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Spellcheck:</span>

              <button
                type="button"
                onClick={() => setIsEnabled(!isEnabled)}
                className={`font-bold transition cursor-pointer px-1.5 py-0.5 rounded text-[10px] ${
                  isEnabled
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
                title={isEnabled ? "Disable real-time spellcheck" : "Enable real-time spellcheck"}
              >
                {isEnabled ? 'ON' : 'OFF'}
              </button>

              {isEnabled && (
                <>
                  <span className="text-slate-300">|</span>
                  {errors.length === 0 ? (
                    <span className="flex items-center gap-1 text-emerald-700 font-bold text-[10px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {value.trim().length > 0 ? '0 Spelling Errors' : 'Ready'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600 font-bold text-[10px]">
                      <AlertCircle className="w-3 h-3 text-red-500 animate-pulse" />
                      {errors.length} {errors.length === 1 ? 'Error' : 'Errors'}
                    </span>
                  )}

                  {isCheckingAI && (
                    <span title="Checking with AI...">
                      <Sparkles className="w-3 h-3 text-emerald-500 animate-spin ml-0.5" />
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Quick Format Button */}
            {value.trim().length > 0 && (
              <button
                type="button"
                onClick={handleQuickFormat}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-[10px] font-bold shadow-2xs transition cursor-pointer"
                title="Automatically apply professional educational headings, list formatting, and bold key terms"
              >
                <AlignLeft className="w-3 h-3 text-sky-600" />
                <span>Quick Format</span>
              </button>
            )}

            {/* Simplify Sentence Button */}
            {value.trim().length > 0 && (
              <button
                type="button"
                onClick={() => handleSimplifySentence()}
                disabled={isSimplifyingSentence || isSimplifyingParagraph}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-[10px] font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
                title="Rephrase highlighted selection to a simpler reading complexity using AI Engine"
              >
                {isSimplifyingSentence ? (
                  <Sparkles className="w-3 h-3 text-purple-600 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3 text-purple-600" />
                )}
                <span>{isSimplifyingSentence ? 'Simplifying...' : 'Simplify Sentence'}</span>
              </button>
            )}

            {/* Simplify Entire Paragraph (Batch) Button */}
            {value.trim().length > 0 && (
              <button
                type="button"
                onClick={handleSimplifyParagraph}
                disabled={isSimplifyingSentence || isSimplifyingParagraph}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-[10px] font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
                title="Batch simplify entire highlighted paragraph(s) or surrounding lines at once using AI Engine"
              >
                {isSimplifyingParagraph ? (
                  <Sparkles className="w-3 h-3 text-indigo-600 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3 text-indigo-600" />
                )}
                <span>{isSimplifyingParagraph ? 'Simplifying Batch...' : 'Simplify Entire Paragraph'}</span>
              </button>
            )}

            {/* Fix All Button if errors exist */}
            {isEnabled && errors.length > 0 && (
              <button
                type="button"
                onClick={handleFixAll}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-2xs transition cursor-pointer"
                title="Fix all spelling mistakes automatically"
              >
                <Wand2 className="w-3 h-3" />
                <span>Fix All ({errors.length})</span>
              </button>
            )}

            {isQuickFormattedDone && (
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md animate-fadeIn">
                ✓ Formatted!
              </span>
            )}

            {isFixAllDone && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md animate-fadeIn">
                ✓ All fixed!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Textarea Container with Visual Overlay & Mic Button */}
      <div className="relative group">
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onContextMenu={handleContextMenu}
          placeholder={placeholder}
          rows={rows}
          spellCheck={isEnabled}
          className={`w-full border border-slate-250 rounded-xl pl-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition resize-y bg-white ${
            micButton ? 'pr-11' : ''
          }`}
        />

        {/* Custom AI Simplification Context Menu Popup */}
        {contextMenu && (
          <div
            style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
            className="fixed z-50 bg-slate-900/95 text-white backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl py-1.5 w-64 text-xs font-sans space-y-0.5 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-purple-300 border-b border-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>EduNexus AI Text Actions</span>
            </div>

            <button
              type="button"
              onClick={handleSimplifyParagraph}
              disabled={isSimplifyingParagraph}
              className="w-full text-left px-3 py-2 hover:bg-purple-600/50 flex items-center justify-between font-bold text-purple-200 transition cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Simplify Entire Paragraph</span>
              </div>
              <span className="text-[9px] bg-purple-900/80 px-1.5 py-0.5 rounded font-mono text-purple-300">Batch</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimplifySentence()}
              disabled={isSimplifyingSentence}
              className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-200 transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Simplify Selection / Sentence</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!textareaRef.current) return;
                const start = textareaRef.current.selectionStart;
                let pStart = value.lastIndexOf('\n\n', start);
                pStart = pStart === -1 ? 0 : pStart + 2;
                let pEnd = value.indexOf('\n\n', start);
                pEnd = pEnd === -1 ? value.length : pEnd;
                textareaRef.current.setSelectionRange(pStart, pEnd);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-300 transition cursor-pointer border-t border-slate-800/80"
            >
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Select Full Paragraph Batch</span>
            </button>
          </div>
        )}

        {/* Mic or Extra Floating Action Button */}
        {micButton && (
          <div className="absolute top-2.5 right-2.5">
            {micButton}
          </div>
        )}
      </div>

      {/* Live Interactive Spellcheck Suggestions Drawer / Toolbar */}
      {isEnabled && errors.length > 0 && (
        <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-3 text-xs space-y-2 animate-fadeIn shadow-3xs">
          <div className="flex items-center justify-between pb-1 border-b border-red-200/60">
            <div className="flex items-center gap-1.5 font-bold text-red-900 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>Real-Time Spellcheck Highlights ({errors.length}):</span>
            </div>
            <span className="text-[10px] text-red-700 font-medium">
              Click a suggested term below to replace it
            </span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1 pr-1">
            {errors.map((err) => (
              <div
                key={err.id}
                className="flex items-center gap-1.5 bg-white border border-red-200 hover:border-red-300 rounded-lg p-1.5 shadow-2xs text-[11px] transition"
              >
                {/* Misspelled Word with Red Underline */}
                <span className="font-bold text-red-700 underline decoration-wavy decoration-red-500/80 px-1 bg-red-50 rounded-xs">
                  {err.original}
                </span>

                <span className="text-slate-400 font-semibold">➔</span>

                {/* Primary Suggestion Replacement Chip */}
                {err.suggestions && err.suggestions.length > 0 ? (
                  <div className="flex items-center gap-1">
                    {err.suggestions.map((sug, sIdx) => (
                      <button
                        key={`${err.id}-sug-${sIdx}`}
                        type="button"
                        onClick={() => handleFixWord(err.original, sug)}
                        className="flex items-center gap-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-md transition text-[10px] cursor-pointer"
                        title={`Replace "${err.original}" with "${sug}"`}
                      >
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                ) : err.suggestion ? (
                  <button
                    type="button"
                    onClick={() => handleFixWord(err.original, err.suggestion)}
                    className="flex items-center gap-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-md transition text-[10px] cursor-pointer"
                  >
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                    <span>{err.suggestion}</span>
                  </button>
                ) : null}

                {/* Ignore Button */}
                <button
                  type="button"
                  onClick={() => handleIgnoreWord(err.original)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-0.5 rounded transition cursor-pointer ml-0.5"
                  title="Ignore this word"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
