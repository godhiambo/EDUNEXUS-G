import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Award, 
  Compass, 
  HelpCircle, 
  Printer, 
  Copy, 
  Sparkles, 
  BookOpen, 
  AlertCircle, 
  RefreshCw, 
  X as XIcon, 
  GraduationCap, 
  Hammer, 
  Scroll, 
  Languages,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { SavedDocument } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { handleResponseJson } from '../utils/api';

interface ComplianceCheckItem {
  pillar: string;
  status: 'pass' | 'warn' | 'fail';
  score: number;
  feedback: string;
}

interface CBCRubricLevel {
  level: string;
  description: string;
}

interface ComplianceReport {
  alignmentScore: number;
  status: string;
  curriculumTypeDetected: string;
  gradeLevelDetected: string;
  subjectDetected: string;
  complianceChecks: ComplianceCheckItem[];
  suggestions: string[];
  improvisedMaterialsSuggestion: string;
  cbcRubricDraft: CBCRubricLevel[];
}

interface KenyanCurriculumCheckerProps {
  document: SavedDocument;
  onClose: () => void;
}

const COMPLIANCE_SLOGANS = [
  "Verifying alignment with KICD curriculum frameworks...",
  "Reviewing Specific Learning Outcomes (SLOs) for measurability...",
  "Evaluating integration of CBC Core Competencies...",
  "Checking explicit nurturing of Values and PCIs...",
  "Identifying opportunities for low-cost locally available materials...",
  "Drafting competency-based assessment rubrics for level expectations...",
  "Analyzing compliance with co-educational standard routines..."
];

export default function KenyanCurriculumChecker({
  document,
  onClose
}: KenyanCurriculumCheckerProps) {
  const { aiLanguage } = useLanguage();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [checkerLanguage, setCheckerLanguage] = useState<'en' | 'sw'>(aiLanguage || 'en');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [sloganIndex, setSloganIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [expandedCheckIndex, setExpandedCheckIndex] = useState<number | null>(null);

  // Slogan cycle during analysis
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setSloganIndex(prev => (prev + 1) % COMPLIANCE_SLOGANS.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const runComplianceCheck = async (langToUse: 'en' | 'sw') => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch('/api/check-kenyan-curriculum-compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: document.content,
          title: document.title,
          docType: document.docType,
          subject: document.subject,
          classLevel: document.classLevel,
          language: langToUse,
        }),
      });

      const data = await handleResponseJson(response, 'Failed to complete curriculum compliance analysis.');
      setReport(data);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'An error occurred during Kenyan curriculum checking.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    runComplianceCheck(checkerLanguage);
  }, []);

  const handleLanguageToggle = () => {
    const nextLang = checkerLanguage === 'en' ? 'sw' : 'en';
    setCheckerLanguage(nextLang);
    runComplianceCheck(nextLang);
  };

  const handleCopyReport = () => {
    if (!report) return;

    const complianceSummary = report.complianceChecks.map((c, idx) => {
      return `Pillar [${c.pillar}]: Score ${c.score}% (${c.status.toUpperCase()})
Feedback: ${c.feedback}`;
    }).join('\n\n');

    const suggestionsText = report.suggestions.map((s, idx) => `${idx + 1}. ${s}`).join('\n');

    const rubricText = report.cbcRubricDraft.map(r => `* ${r.level}: ${r.description}`).join('\n');

    const textReport = `
==================================================
🇰🇪 KENYAN CURRICULUM COMPLIANCE EVALUATION REPORT
==================================================
Document: ${document.title}
Detected Curriculum: ${report.curriculumTypeDetected}
Detected Level: ${report.gradeLevelDetected}
Detected Subject: ${report.subjectDetected}
Overall Alignment Score: ${report.alignmentScore}%
Status: ${report.status}

--------------------------------------------------
COMPLIANCE EVALUATION BY PILLAR:
--------------------------------------------------
${complianceSummary}

--------------------------------------------------
RECOMMENDED IMPROVEMENTS & ACTIONS:
--------------------------------------------------
${suggestionsText}

--------------------------------------------------
LOCAL MATERIAL IMPROVIZATION IDEAS:
--------------------------------------------------
${report.improvisedMaterialsSuggestion}

--------------------------------------------------
DRAFT CBC ASSESSMENT RUBRIC:
--------------------------------------------------
${rubricText}

==================================================
Report generated on: ${new Date().toLocaleDateString()}
`;

    navigator.clipboard.writeText(textReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintReport = () => {
    if (!report) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pillarRows = report.complianceChecks.map(c => `
      <div style="margin-bottom: 16px; padding: 12px 16px; border-left: 4px solid ${
        c.status === 'pass' ? '#10b981' : c.status === 'warn' ? '#f59e0b' : '#ef4444'
      }; border-radius: 4px; background-color: #f8fafc;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="font-size: 14px; color: #1e293b;">${c.pillar}</strong>
          <span style="font-size: 12px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background-color: #f1f5f9;">
            Score: ${c.score}% (${c.status.toUpperCase()})
          </span>
        </div>
        <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.45;">${c.feedback}</p>
      </div>
    `).join('');

    const suggestionsList = report.suggestions.map(s => `<li style="margin-bottom: 8px; font-size: 13px; line-height: 1.45; color: #334155;">${s}</li>`).join('');

    const rubricList = report.cbcRubricDraft.map(r => `
      <div style="margin-bottom: 8px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; background-color: #fafaf9;">
        <span style="display: inline-block; font-size: 11px; font-weight: bold; background-color: #5f6f52; color: white; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px;">
          ${r.level}
        </span>
        <p style="margin: 0; font-size: 12px; color: #44403c; line-height: 1.4;">${r.description}</p>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Kenyan Curriculum Compliance - ${document.title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
            h2 { color: #334155; font-size: 18px; margin-top: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
            .meta { margin-bottom: 24px; font-size: 13px; color: #475569; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background-color: #fcfbf9; padding: 12px; border: 1px solid #e5e1da; border-radius: 8px; }
            .score-box { background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px; }
            .score-val { font-size: 32px; font-weight: 850; color: #5f6f52; }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 32px;">🇰🇪</span>
            <h1 style="margin-top: 10px; border-bottom: none; padding-bottom: 0;">Kenyan Curriculum Compliance Report</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Kenya Institute of Curriculum Development (KICD) Framework Alignment Review</p>
          </div>

          <div class="meta">
            <div><strong>Document Title:</strong> ${document.title}</div>
            <div><strong>Detected Curriculum:</strong> ${report.curriculumTypeDetected}</div>
            <div><strong>Detected Subject:</strong> ${report.subjectDetected}</div>
            <div><strong>Detected Class Level:</strong> ${report.gradeLevelDetected}</div>
            <div><strong>Compliance Status:</strong> ${report.status}</div>
            <div><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="score-box">
            <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Overall Alignment Score</div>
            <div class="score-val">${report.alignmentScore}%</div>
            <div style="font-size: 13px; font-weight: bold; color: #475569; margin-top: 4px;">${report.status}</div>
          </div>

          <h2>Educational Pillar Audits</h2>
          <div>${pillarRows}</div>

          <h2>Improvement Action List</h2>
          <ul style="margin: 0; padding-left: 20px;">${suggestionsList}</ul>

          <h2>Local Material Improvization</h2>
          <div style="padding: 16px; border: 1px solid #e5e1da; border-radius: 8px; background-color: #fcfbf9; font-size: 13px; line-height: 1.5; color: #3e4c34;">
            ${report.improvisedMaterialsSuggestion}
          </div>

          <h2>Draft Competency-Based Assessment Rubric</h2>
          <div style="margin-top: 12px;">${rubricList}</div>

          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`bg-[#fcfbf9] border border-[#e5e1da] shadow-2xl flex flex-col overflow-hidden text-slate-800 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'max-w-4xl w-full h-[90vh] rounded-2xl'
        }`}
      >
        {/* Banner with subtle Kenya Colors Border at the top */}
        <div className="h-1.5 flex shrink-0">
          <div className="flex-1 bg-black" />
          <div className="w-2 bg-white" />
          <div className="flex-1 bg-[#990000]" />
          <div className="w-2 bg-white" />
          <div className="flex-1 bg-[#006600]" />
        </div>

        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-[#3e4c34] to-[#5f6f52] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                🇰🇪 Kenyan Curriculum Compliance Checker
              </h2>
              <p className="text-[11px] opacity-90 font-medium">
                Verify Lesson Compliance with KICD (CBC & 8-4-4) Syllabus Standards
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLanguageToggle}
              disabled={isAnalyzing}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              title="Toggle evaluation language between English and academic Kiswahili"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{checkerLanguage === 'en' ? 'Soma kwa Kiswahili' : 'Read in English'}</span>
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-white/15 rounded-xl transition cursor-pointer text-white"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/15 rounded-xl transition cursor-pointer text-white"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Outer Grid Panel */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-8 space-y-5"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-[#5f6f52]/10 border-t-4 border-t-[#5f6f52] animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-[#5f6f52]">
                    <Compass className="w-6 h-6 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                    KICD Quality Assurance Audit
                  </h3>
                  <p className="text-xs text-slate-500 font-medium max-w-md mx-auto animate-pulse">
                    {COMPLIANCE_SLOGANS[sloganIndex]}
                  </p>
                </div>
              </motion.div>
            ) : analysisError ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-100 rounded-2xl text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-red-800 text-sm">Evaluation Failed</h3>
                  <p className="text-xs text-red-600 leading-relaxed">
                    {analysisError}
                  </p>
                </div>
                <button
                  onClick={() => runComplianceCheck(checkerLanguage)}
                  className="px-4 py-2 bg-[#5f6f52] text-white text-xs font-bold rounded-lg hover:bg-[#4d5a42] transition flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </motion.div>
            ) : report ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* COLUMN 1: Score & Metadata Ring */}
                <div className="space-y-6">
                  {/* Score Ring Card */}
                  <div className="bg-white border border-[#e5e1da] rounded-2xl p-5 shadow-xs flex flex-col items-center text-center space-y-4">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Compliance Rating
                    </span>

                    {/* Circular Score representation */}
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="40" 
                          stroke="#f1f5f9" 
                          strokeWidth="8" 
                          fill="transparent" 
                        />
                        <motion.circle 
                          cx="50" 
                          cy="50" 
                          r="40" 
                          stroke={
                            report.alignmentScore >= 85 
                              ? '#10b981' 
                              : report.alignmentScore >= 60 
                                ? '#f59e0b' 
                                : '#ef4444'
                          } 
                          strokeWidth="8" 
                          fill="transparent" 
                          strokeDasharray="251.2"
                          initial={{ strokeDashoffset: 251.2 }}
                          animate={{ strokeDashoffset: 251.2 - (251.2 * report.alignmentScore) / 100 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-black text-slate-800">
                          {report.alignmentScore}%
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
                          Score
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${
                        report.alignmentScore >= 85 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : report.alignmentScore >= 60 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  </div>

                  {/* Metadata detected card */}
                  <div className="bg-[#fcfbf9] border border-[#e5e1da] rounded-2xl p-5 shadow-xs space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Detected Syllabus Profile
                    </h4>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                        <span className="text-slate-500 font-medium">Curriculum:</span>
                        <span className="font-extrabold text-slate-800">{report.curriculumTypeDetected}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                        <span className="text-slate-500 font-medium">Subject Area:</span>
                        <span className="font-extrabold text-slate-800">{report.subjectDetected}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-slate-500 font-medium">Class Level:</span>
                        <span className="font-extrabold text-[#5f6f52]">{report.gradeLevelDetected}</span>
                      </div>
                    </div>
                  </div>

                  {/* Local Resource Improvization */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[#3e4c34]">
                      <Hammer className="w-4.5 h-4.5 text-[#5f6f52]" />
                      <h4 className="text-xs font-bold uppercase tracking-wide">
                        {checkerLanguage === 'en' ? 'Improvised Local Resources' : 'Nyenzo za Kienyeji'}
                      </h4>
                    </div>
                    <p className="text-xs text-[#3e4c34]/90 leading-relaxed font-medium">
                      {report.improvisedMaterialsSuggestion}
                    </p>
                  </div>
                </div>

                {/* COLUMN 2: Pillar Checklist & Suggestions */}
                <div className="md:col-span-2 space-y-6">
                  {/* Pillar Checks */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Pedagogical Pillar Audits
                    </h3>

                    <div className="space-y-3">
                      {report.complianceChecks.map((check, idx) => {
                        const isExpanded = expandedCheckIndex === idx;
                        return (
                          <div 
                            key={idx}
                            className="bg-white border border-[#e5e1da] rounded-xl overflow-hidden shadow-2xs transition hover:border-[#5f6f52]/40"
                          >
                            <button
                              onClick={() => setExpandedCheckIndex(isExpanded ? null : idx)}
                              className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                {check.status === 'pass' ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                ) : check.status === 'warn' ? (
                                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                                )}
                                <div>
                                  <span className="text-xs font-extrabold text-slate-800 block">
                                    {check.pillar}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                    Score: {check.score}%
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                  check.status === 'pass' 
                                    ? 'bg-emerald-50 text-emerald-700' 
                                    : check.status === 'warn' 
                                      ? 'bg-amber-50 text-amber-700' 
                                      : 'bg-red-50 text-red-700'
                                }`}>
                                  {check.status}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="border-t border-slate-100 bg-slate-50/50"
                                >
                                  <p className="p-4 text-xs text-slate-600 leading-relaxed">
                                    {check.feedback}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions / Suggestions Card */}
                  <div className="bg-white border border-[#e5e1da] rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        KICD Improvement Action List
                      </h3>
                    </div>

                    <ul className="space-y-3">
                      {report.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 leading-relaxed">
                          <span className="w-5 h-5 rounded-md bg-[#5f6f52]/10 text-[#5f6f52] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Rubric View Card */}
                  <div className="bg-white border border-[#e5e1da] rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <Scroll className="w-4.5 h-4.5 text-[#5f6f52]" />
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        {checkerLanguage === 'en' ? 'Draft CBC Assessment Rubric' : 'Mwangaza wa Tathmini ya CBC'}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {report.cbcRubricDraft.map((rubric, idx) => (
                        <div key={idx} className="p-3 border border-slate-150 rounded-xl bg-slate-50/40 space-y-1.5">
                          <span className="inline-block px-2 py-0.5 bg-[#5f6f52] text-white text-[9px] font-extrabold uppercase rounded tracking-wide">
                            {rubric.level}
                          </span>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {rubric.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#e5e1da] flex items-center justify-between shrink-0">
          <div className="text-[10px] text-slate-400 font-bold">
            KENYA INSTITUTE OF CURRICULUM DEVELOPMENT (KICD) ALIGNED
          </div>
          <div className="flex items-center gap-2.5">
            {report && (
              <>
                <button
                  onClick={handleCopyReport}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Evaluation'}</span>
                </button>
                <button
                  onClick={handlePrintReport}
                  className="px-4 py-2 bg-[#5f6f52] text-white text-xs font-bold rounded-xl hover:bg-[#4d5a42] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
