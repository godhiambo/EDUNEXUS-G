import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Sparkles, AlertTriangle, CheckCircle2, Loader2, 
  ChevronDown, ChevronUp, RefreshCw, Sliders, Play, Check, 
  HelpCircle, ArrowRight, Info, AlertCircle, X, Award, Eye,
  Settings, CheckSquare, Layers, HelpCircle as HelpIcon, Trash2, 
  Undo, ChevronRight
} from 'lucide-react';
import { SavedDocument } from '../types';

interface DifficultTerm {
  term: string;
  complexity: 'High' | 'Medium' | 'Low';
  suggestion: string;
  explanation: string;
}

interface ReadingLevelAnalysis {
  readabilityScore: number;
  gradeLevel: string;
  suitabilityVerdict: string;
  analysisExplanation: string;
  metrics: {
    wordCount: number;
    sentenceCount: number;
    averageWordLength: number;
    averageSentenceLength: number;
    complexWordPercentage: number;
  };
  difficultTerms: DifficultTerm[];
}

interface ReadingLevelAnalyzerProps {
  document: SavedDocument;
  editedContent: string;
  setEditedContent: (content: string) => void;
}

const AGE_GROUPS = [
  { id: '5-7', label: '5-7 Years', desc: 'Early Childhood (Grades K-2)', icon: '👶', bg: 'from-pink-500/10 to-rose-500/10', border: 'border-pink-200', text: 'text-pink-700' },
  { id: '8-10', label: '8-10 Years', desc: 'Lower Primary (Grades 3-5)', icon: '👦', bg: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-200', text: 'text-amber-700' },
  { id: '11-13', label: '11-13', desc: 'Upper Primary / Junior School (Grades 6-8)', icon: '🎒', bg: 'from-indigo-500/10 to-blue-500/10', border: 'border-indigo-200', text: 'text-indigo-700' },
  { id: '14-16', label: '14-16 Years', desc: 'Secondary School (Grades 9-10)', icon: '🏫', bg: 'from-emerald-500/10 to-teal-500/10', border: 'border-emerald-200', text: 'text-emerald-700' },
  { id: '17+', label: '17+ Years', desc: 'Advanced Secondary (Grades 11-12+)', icon: '🎓', bg: 'from-violet-500/10 to-purple-500/10', border: 'border-violet-200', text: 'text-violet-700' },
];

export default function ReadingLevelAnalyzer({ 
  document, 
  editedContent, 
  setEditedContent 
}: ReadingLevelAnalyzerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState('11-13');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ReadingLevelAnalysis | null>(null);
  const [activeTerm, setActiveTerm] = useState<DifficultTerm | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [replacedTerms, setReplacedTerms] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'highlighter' | 'list'>('highlighter');

  // Trigger analyzer when age group or content changes, but let user click "Run analysis" manually
  const runReadingAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setSuccessMessage(null);
    setActiveTerm(null);
    
    try {
      const response = await fetch('/api/analyze-reading-level', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent,
          ageGroup: selectedAgeGroupId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to audit document text reading level. Please try again.');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
      setReplacedTerms([]);
    } catch (err: any) {
      console.error('[Reading Level Analyzer error]:', err);
      setError(err.message || 'An error occurred while running the reading audit.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Replace a single term in the text
  const handleReplaceTerm = (term: string, replacement: string) => {
    if (!term || !replacement) return;

    // Build replacement text (escaping regex characters just in case)
    const escapeRegex = (s: string) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi');
    
    // Replace in document content
    const updatedContent = editedContent.replace(regex, (matched) => {
      // Try to preserve casing roughly
      if (matched === matched.toUpperCase()) return replacement.toUpperCase();
      if (matched[0] === matched[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
      return replacement.toLowerCase();
    });

    setEditedContent(updatedContent);
    setReplacedTerms(prev => [...prev, term]);
    
    // Remove from active term popup if open
    if (activeTerm && activeTerm.term === term) {
      setActiveTerm(null);
    }

    setSuccessMessage(`Successfully adjusted "${term}" with simpler terms!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Auto simplify all detected high complexity terms at once!
  const handleAutoSimplifyAll = () => {
    if (!analysis || !analysis.difficultTerms || analysis.difficultTerms.length === 0) return;

    let updatedContent = editedContent;
    const replacedList: string[] = [];

    analysis.difficultTerms.forEach(item => {
      const escapeRegex = (s: string) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapeRegex(item.term)}\\b`, 'gi');
      
      const prevLength = updatedContent.length;
      updatedContent = updatedContent.replace(regex, (matched) => {
        if (matched === matched.toUpperCase()) return item.suggestion.toUpperCase();
        if (matched[0] === matched[0].toUpperCase()) return item.suggestion[0].toUpperCase() + item.suggestion.slice(1);
        return item.suggestion.toLowerCase();
      });

      // Track if replacement actually happened
      if (updatedContent.length !== prevLength || updatedContent.includes(item.suggestion)) {
        replacedList.push(item.term);
      }
    });

    setEditedContent(updatedContent);
    setReplacedTerms(prev => [...prev, ...replacedList]);
    setActiveTerm(null);
    setSuccessMessage(`Auto-simplified ${replacedList.length} complex words/phrases across the text!`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Split content into plain text and interactive highlighted parts
  const textSegments = useMemo(() => {
    if (!editedContent) return [];
    if (!analysis || !analysis.difficultTerms || analysis.difficultTerms.length === 0) {
      return [{ text: editedContent, isTerm: false }];
    }

    // Filter out already replaced terms
    const activeTerms = analysis.difficultTerms.filter(t => !replacedTerms.includes(t.term));
    if (activeTerms.length === 0) {
      return [{ text: editedContent, isTerm: false }];
    }

    // Sort terms by length descending to match longer phrases first
    const sortedTerms = [...activeTerms].sort((a, b) => b.term.length - a.term.length);
    
    // Escape terms for regex
    const escapeRegex = (s: string) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const termPatterns = sortedTerms.map(t => `\\b${escapeRegex(t.term)}\\b`);
    
    try {
      const regex = new RegExp(`(${termPatterns.join('|')})`, 'gi');
      const parts = editedContent.split(regex);
      
      const segments: { text: string; isTerm: boolean; termData?: DifficultTerm }[] = [];
      parts.forEach((part) => {
        if (!part) return;
        
        // Match part with any sorted term (case-insensitive)
        const matchedTerm = sortedTerms.find(
          t => t.term.toLowerCase() === part.toLowerCase()
        );
        
        if (matchedTerm) {
          segments.push({
            text: part,
            isTerm: true,
            termData: matchedTerm
          });
        } else {
          segments.push({
            text: part,
            isTerm: false
          });
        }
      });
      
      return segments;
    } catch (e) {
      console.warn('Regex parsing for highlighted terms failed:', e);
      return [{ text: editedContent, isTerm: false }];
    }
  }, [editedContent, analysis, replacedTerms]);

  return (
    <div id="reading-level-analyzer-section" className="bg-[#fdfcf7] rounded-2xl border border-indigo-150 shadow-xs overflow-hidden flex flex-col no-print animate-fadeIn">
      
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 bg-indigo-50/45 border-b border-indigo-100 flex items-center justify-between cursor-pointer hover:bg-indigo-50/80 transition"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📊</span>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              AI Classroom Reading Level Analyzer & Vocabulary Adapter
              <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">New</span>
            </h3>
            <p className="text-[10px] text-slate-500">Analyze syllabus materials, highlight complex words, and adjust vocabulary to match target grade level age groups</p>
          </div>
        </div>
        <button className="text-indigo-600 hover:text-indigo-800 font-bold text-[10px] uppercase tracking-wider py-1.5 px-3 bg-white border border-indigo-200 rounded-lg transition shadow-inner-sm">
          {isExpanded ? 'Hide Analyzer' : 'Open Analyzer'}
        </button>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          
          {/* Target Student Age Group Selection */}
          <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-500" />
                Select Target Student Age Cohort
              </h4>
              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">Adaptive Tuning</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {AGE_GROUPS.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedAgeGroupId(group.id)}
                  className={`relative p-3.5 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    selectedAgeGroupId === group.id 
                      ? `bg-indigo-50/60 ${group.border} border-indigo-500 ring-2 ring-indigo-500/25`
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xl">{group.icon}</span>
                    {selectedAgeGroupId === group.id && (
                      <span className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                    )}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${selectedAgeGroupId === group.id ? 'text-indigo-900' : 'text-slate-700'}`}>{group.label}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-tight font-medium">{group.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
              <p className="text-[10px] text-slate-500 flex items-center gap-1 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                Tuning is standard-aligned and evaluates grammatical structures, vocabulary syntax, and text density.
              </p>
              <button
                onClick={runReadingAnalysis}
                disabled={isAnalyzing}
                className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing Reading Suitability...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Run Reading Suitability Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-150 rounded-xl flex items-start gap-3 text-xs text-red-700">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Linguistic Analysis Error</p>
                <p className="leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Success Notification message */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Analysis Dashboard */}
          {analysis && !isAnalyzing && (
            <div className="space-y-6">
              
              {/* Summary Stats Grid & Verdict Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* 1. Score Gauge Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-indigo-500" /> Suitability Score
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 border border-indigo-150 rounded-full">
                      {analysis.gradeLevel}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 py-2">
                    <div className="relative flex items-center justify-center shrink-0">
                      {/* Circular Gauge */}
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle cx="40" cy="40" r="34" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                        <circle cx="40" cy="40" r="34" stroke={analysis.readabilityScore >= 75 ? '#10b981' : analysis.readabilityScore >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="6" fill="transparent" strokeDasharray={`${2 * Math.PI * 34}`} strokeDashoffset={`${2 * Math.PI * 34 * (1 - analysis.readabilityScore / 100)}`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-lg font-black text-slate-800">{analysis.readabilityScore}</span>
                        <span className="text-[8px] block font-semibold text-slate-400">/100</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-slate-700">
                        {analysis.readabilityScore >= 80 ? 'Highly Accessible' : analysis.readabilityScore >= 60 ? 'Standard Alignment' : 'Complexity Mismatch'}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        This document is graded at <span className="font-semibold text-indigo-600">{analysis.gradeLevel}</span>, matching reading capabilities of children aged {selectedAgeGroupId} years.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Verdict Card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50/30 to-slate-50/50 border border-slate-200 rounded-xl p-4.5 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📋</span>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Linguistic Verdict</h4>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-indigo-100/50">
                    <p className="text-xs font-bold text-indigo-900 leading-relaxed">
                      {analysis.suitabilityVerdict}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal mt-1.5">
                      {analysis.analysisExplanation}
                    </p>
                  </div>
                </div>

              </div>

              {/* Advanced Metrics Breakdown Panel */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-indigo-500" /> Document Readability Metrics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 bg-slate-50/70 border border-slate-150 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Word Count</p>
                    <p className="text-sm font-black text-slate-700 mt-0.5">{analysis.metrics.wordCount}</p>
                    <span className="text-[8px] text-slate-400">total tokens</span>
                  </div>
                  <div className="p-3 bg-slate-50/70 border border-slate-150 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Sentence Count</p>
                    <p className="text-sm font-black text-slate-700 mt-0.5">{analysis.metrics.sentenceCount}</p>
                    <span className="text-[8px] text-slate-400">syntax structures</span>
                  </div>
                  <div className="p-3 bg-slate-50/70 border border-slate-150 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Avg Sentence Length</p>
                    <p className="text-sm font-black text-slate-700 mt-0.5">{analysis.metrics.averageSentenceLength} words</p>
                    <span className="text-[8px] text-indigo-600 font-semibold">
                      {analysis.metrics.averageSentenceLength <= 12 ? 'Excellent' : analysis.metrics.averageSentenceLength <= 18 ? 'Good' : 'Dense'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50/70 border border-slate-150 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Avg Word Length</p>
                    <p className="text-sm font-black text-slate-700 mt-0.5">{analysis.metrics.averageWordLength} chars</p>
                    <span className="text-[8px] text-slate-400">character density</span>
                  </div>
                  <div className="p-3 bg-slate-50/70 border border-slate-150 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Complex Words (3+ Syll)</p>
                    <p className="text-sm font-black text-slate-700 mt-0.5">{analysis.metrics.complexWordPercentage}%</p>
                    <span className="text-[8px] text-amber-600 font-semibold">
                      {analysis.metrics.complexWordPercentage <= 8 ? 'Very Low' : analysis.metrics.complexWordPercentage <= 15 ? 'Moderate' : 'Dense'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Interactive Workspace Area */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
                
                {/* LEFT: Highlighter View (7 Columns) */}
                <div className="lg:col-span-7 flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        Interactive Reader Canvas
                      </span>
                      <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Live View</span>
                    </div>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        onClick={() => setViewMode('highlighter')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                          viewMode === 'highlighter' 
                            ? 'bg-white text-slate-800 shadow-xs' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Highlight View
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                          viewMode === 'list' 
                            ? 'bg-white text-slate-800 shadow-xs' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Glossary View
                      </button>
                    </div>
                  </div>

                  {viewMode === 'highlighter' ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 min-h-[350px] max-h-[500px] overflow-y-auto leading-relaxed text-sm text-slate-700 font-medium whitespace-pre-wrap shadow-inner-sm relative">
                      
                      {/* Interactive segments mapping */}
                      {textSegments.map((segment, idx) => {
                        if (segment.isTerm && segment.termData) {
                          const term = segment.termData;
                          const isTermActive = activeTerm && activeTerm.term === term.term;
                          return (
                            <span key={idx} className="relative inline-block">
                              <button
                                onClick={() => setActiveTerm(term)}
                                className={`px-1 rounded-sm transition-all duration-200 cursor-pointer text-slate-800 ${
                                  isTermActive
                                    ? 'bg-amber-300 ring-2 ring-amber-400 font-bold'
                                    : term.complexity === 'High'
                                      ? 'bg-orange-100/80 hover:bg-orange-200 border-b-2 border-dashed border-orange-500 font-semibold'
                                      : 'bg-amber-50 hover:bg-amber-100 border-b-2 border-dashed border-amber-400 font-semibold'
                                }`}
                                title={`Click to simplify "${term.term}"`}
                              >
                                {segment.text}
                              </button>
                            </span>
                          );
                        }
                        return <React.Fragment key={idx}>{segment.text}</React.Fragment>;
                      })}

                      {/* Floating details tooltip inside editor */}
                      {activeTerm && (
                        <div className="absolute bottom-4 left-4 right-4 bg-slate-900 text-white rounded-xl p-4 shadow-xl border border-slate-800 animate-slideUp z-20 flex flex-col space-y-3.5">
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-slate-200">Original Term:</span>
                                <span className="text-xs font-black text-amber-300">"{activeTerm.term}"</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                  activeTerm.complexity === 'High' ? 'bg-orange-500/30 text-orange-200' : 'bg-amber-500/30 text-amber-200'
                                }`}>
                                  {activeTerm.complexity} Complexity
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-300 leading-tight">
                                {activeTerm.explanation}
                              </p>
                            </div>
                            <button 
                              onClick={() => setActiveTerm(null)}
                              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/50">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-300">Simplification:</span>
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" /> {activeTerm.suggestion}
                              </span>
                            </div>
                            <button
                              onClick={() => handleReplaceTerm(activeTerm.term, activeTerm.suggestion)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-md transition cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Adjust Word
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Glossary Term list cards view */
                    <div className="bg-white border border-slate-200 rounded-xl p-4 min-h-[350px] max-h-[500px] overflow-y-auto space-y-3 shadow-inner-sm">
                      {analysis.difficultTerms.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 space-y-1">
                          <p className="text-lg">🎉</p>
                          <p className="text-xs font-semibold">No complex words detected!</p>
                        </div>
                      ) : (
                        analysis.difficultTerms.map((term, idx) => {
                          const isReplaced = replacedTerms.includes(term.term);
                          return (
                            <div 
                              key={idx} 
                              className={`p-3.5 rounded-xl border transition-all ${
                                isReplaced 
                                  ? 'bg-slate-50 border-slate-200 opacity-60' 
                                  : 'bg-white border-slate-150 hover:shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-extrabold ${isReplaced ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    {term.term}
                                  </span>
                                  {!isReplaced && (
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                      term.complexity === 'High' ? 'bg-orange-50 text-orange-700' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                      {term.complexity}
                                    </span>
                                  )}
                                </div>
                                {isReplaced ? (
                                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                    <Check className="w-3.5 h-3.5" /> Applied
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleReplaceTerm(term.term, term.suggestion)}
                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-[#5f6f52] hover:text-indigo-900 border border-indigo-150 rounded-lg text-[9px] font-bold transition cursor-pointer"
                                  >
                                    Adjust Word
                                  </button>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 leading-normal font-medium mb-2">{term.explanation}</p>
                              <div className="flex items-center gap-1.5 text-[11px] bg-slate-50/80 p-2 rounded-lg border border-slate-150 font-semibold">
                                <span className="text-slate-400">Simpler phrasing:</span>
                                <span className="text-emerald-700">{term.suggestion}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 leading-none font-medium mt-1">
                    <Info className="w-3 h-3 text-slate-400" />
                    Interactive highlighted items are updated in real-time as they are simplified.
                  </p>
                </div>

                {/* RIGHT: Smart Vocabulary Adjustments Hub (5 Columns) */}
                <div className="lg:col-span-5 flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Vocabulary Adjustments List
                    </span>
                    {analysis.difficultTerms.length > 0 && replacedTerms.length < analysis.difficultTerms.length && (
                      <button
                        onClick={handleAutoSimplifyAll}
                        className="text-[10px] font-extrabold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-2.5 py-1 flex items-center gap-1 transition cursor-pointer shadow-inner-sm"
                        title="Simultaneously simplify all detected complex terms"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                        <span>Simplify All ({analysis.difficultTerms.length - replacedTerms.length})</span>
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex-1 flex flex-col space-y-3.5 max-h-[500px] overflow-y-auto">
                    
                    {/* Information panel */}
                    <div className="bg-[#fcfbf9] border border-[#e5e1da] p-3.5 rounded-xl space-y-1.5 shadow-inner-sm">
                      <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1 font-mono">
                        <Award className="w-3.5 h-3.5 text-indigo-500" /> Dynamic Vocabulary Adapters
                      </h5>
                      <p className="text-[11px] text-slate-600 leading-normal font-medium">
                        To adapt this curriculum document for age <strong>{selectedAgeGroupId}</strong>, review the identified terminology and replace them in the text below.
                      </p>
                    </div>

                    {/* Adjusted checklist items */}
                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {analysis.difficultTerms.filter(t => !replacedTerms.includes(t.term)).length === 0 ? (
                        <div className="bg-white border border-slate-150 rounded-xl p-6 text-center space-y-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-800">Perfect Age Alignment!</p>
                            <p className="text-[10px] text-slate-500 leading-normal">
                              All flagged difficult vocabulary terms have been successfully adjusted and simplified!
                            </p>
                          </div>
                        </div>
                      ) : (
                        analysis.difficultTerms.filter(t => !replacedTerms.includes(t.term)).map((term, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3.5 shadow-sm hover:shadow-md transition duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                term.complexity === 'High' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {term.complexity} Complexity
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setActiveTerm(term)}
                                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
                                  title="View on Interactive Reader"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleReplaceTerm(term.term, term.suggestion)}
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-md transition border border-emerald-100 cursor-pointer"
                                  title="Apply replacement"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-11 gap-2 items-center text-xs">
                              <div className="md:col-span-5 bg-red-50/40 border border-red-100 p-2 rounded-lg text-red-800 font-bold flex items-center gap-1 min-h-[36px]">
                                <span className="line-through">{term.term}</span>
                              </div>
                              <div className="md:col-span-1 text-center font-bold text-slate-400">➔</div>
                              <div className="md:col-span-5 bg-emerald-50/50 border border-emerald-100 p-2 rounded-lg text-emerald-800 font-black flex items-center gap-1 min-h-[36px]">
                                <span>{term.suggestion}</span>
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-500 leading-normal font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                              <strong>Why:</strong> {term.explanation}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Prompting baseline instruction when no analysis has run */}
          {!analysis && !isAnalyzing && (
            <div className="bg-indigo-50/20 rounded-xl p-8 border border-dashed border-indigo-200 text-center max-w-xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xl">
                🏫
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-indigo-900">Adaptive Classroom Text Simplification</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Select a target student age group above and click <strong>"Run Reading Suitability Audit"</strong>. Gemini will analyze sentence structures, complex vocabularies, and provide interactive adjustments to optimize your lesson materials.
                </p>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
