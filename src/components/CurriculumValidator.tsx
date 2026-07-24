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
  FileText,
  Layers,
  Activity,
  CheckCircle,
  ThumbsUp,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { SavedDocument } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { handleResponseJson } from '../utils/api';
import { findRequirements, CurriculumRequirement } from '../data/kenyanCurriculumStandards';

interface GapAnalysisItem {
  requirement: string;
  documentStatus: 'Fully Met' | 'Partially Met' | 'Not Addressed' | 'Kikamilifu' | 'Kiasi' | 'Haipo';
  documentStatusLabel: string;
  gapExplanation: string;
  remediationAction: string;
}

interface ValidationReport {
  overallScore: number;
  status: string;
  statusExplanation: string;
  subjectVerified: string;
  gradeVerified: string;
  topicVerified: string;
  scores: {
    learningOutcomesScore: number;
    competenciesScore: number;
    valuesScore: number;
    resourcesScore: number;
  };
  gapAnalysis: GapAnalysisItem[];
  missingElements: string[];
  remedyPlan: string[];
  pedagogicalTip: string;
}

interface CurriculumValidatorProps {
  document: SavedDocument;
  onClose: () => void;
  onAutoAlign?: (alignedContent: string) => void;
}

const CYCLING_VALIDATING_MESSAGES = [
  "Retrieving stored KICD standards for comparison...",
  "Running precise semantic analysis on lesson outcomes...",
  "Mapping learning experiences to Core Competencies...",
  "Evaluating value-based education integrations...",
  "Validating alignment of assessment criteria...",
  "Reviewing resource optimization and locally available materials...",
  "Formatting comprehensive curriculum alignment report..."
];

const CYCLING_ALIGNING_MESSAGES = [
  "Structuring curriculum content against KICD strands...",
  "Injecting specific learning outcomes (SLOs) into content...",
  "Embedding national values and Pertinent & Contemporary Issues (PCIs)...",
  "Optimizing lesson activities for core competencies development...",
  "Formatting lesson structure for perfect teacher usability..."
];

export default function CurriculumValidator({
  document,
  onClose,
  onAutoAlign
}: CurriculumValidatorProps) {
  const { aiLanguage } = useLanguage();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [validatorLang, setValidatorLang] = useState<'en' | 'sw'>(aiLanguage || 'en');
  const [isValidating, setIsValidating] = useState(false);
  const [isAligning, setIsAligning] = useState(false);
  const [alignSloganIdx, setAlignSloganIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [storedRequirement, setStoredRequirement] = useState<CurriculumRequirement | null>(null);
  const [sloganIdx, setSloganIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [expandedGapIndex, setExpandedGapIndex] = useState<number | null>(null);

  // Cycling message loop for alignment
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAligning) {
      interval = setInterval(() => {
        setAlignSloganIdx(prev => (prev + 1) % CYCLING_ALIGNING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAligning]);

  const handleAutoAlignTrigger = async () => {
    if (!onAutoAlign) return;
    setIsAligning(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/auto-align-curriculum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: document.title,
          content: document.content,
          subject: document.subject,
          classLevel: document.classLevel,
          topic: document.topic || document.subTopic || '',
          language: validatorLang,
          storedRequirement: storedRequirement,
          gaps: report?.gapAnalysis || []
        })
      });

      const data = await handleResponseJson(response, 'Failed to auto-align document.');
      if (data && data.alignedContent) {
        onAutoAlign(data.alignedContent);
      } else {
        throw new Error('Auto-align response did not contain aligned content.');
      }
    } catch (err: any) {
      console.error('Auto-align error:', err);
      setErrorMsg(err.message || 'An error occurred during auto-alignment.');
    } finally {
      setIsAligning(false);
    }
  };

  // Look up stored curriculum requirements on component load or changes
  useEffect(() => {
    const matched = findRequirements(document.subject, document.classLevel, document.topic || document.subTopic);
    setStoredRequirement(matched);
  }, [document]);

  // Loading indicator loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isValidating) {
      interval = setInterval(() => {
        setSloganIdx(prev => (prev + 1) % CYCLING_VALIDATING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isValidating]);

  const runValidation = async (lang: 'en' | 'sw') => {
    setIsValidating(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/validate-kenyan-curriculum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: document.id,
          title: document.title,
          content: document.content,
          subject: document.subject,
          classLevel: document.classLevel,
          topic: document.topic || document.subTopic || '',
          language: lang,
          storedRequirement: storedRequirement // Pass stored reference if found
        }),
      });

      const data = await handleResponseJson(response, 'Failed to complete curriculum validation.');
      setReport(data);
    } catch (err: any) {
      console.error('Validation error:', err);
      setErrorMsg(err.message || 'An error occurred during Kenyan curriculum validation.');
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    runValidation(validatorLang);
  }, [storedRequirement]);

  const toggleLanguage = () => {
    const nextLang = validatorLang === 'en' ? 'sw' : 'en';
    setValidatorLang(nextLang);
    runValidation(nextLang);
  };

  const handleCopyReport = () => {
    if (!report) return;

    const gapSection = report.gapAnalysis.map((g, i) => {
      return `Requirement: ${g.requirement}
Status: ${g.documentStatusLabel}
Gap Analysis: ${g.gapExplanation}
Action Required: ${g.remediationAction}`;
    }).join('\n\n');

    const remedies = report.remedyPlan.map((p, i) => `${i + 1}. ${p}`).join('\n');
    const missings = report.missingElements.map((m, i) => `* ${m}`).join('\n');

    const text = `
==================================================
🇰🇪 OFFICIAL KENYAN CURRICULUM VALIDATION REPORT
==================================================
Document Title: ${document.title}
Subject: ${report.subjectVerified}
Level: ${report.gradeVerified}
Strand / Topic: ${report.topicVerified}
Overall Compliance Score: ${report.overallScore}%
Status Rating: ${report.status} (${report.statusExplanation})

--------------------------------------------------
COMPLIANCE PILLARS FEEDBACK:
--------------------------------------------------
- Learning Outcomes Alignment: ${report.scores.learningOutcomesScore}%
- CBC Core Competencies Integration: ${report.scores.competenciesScore}%
- Values & PCIs Nurturing: ${report.scores.valuesScore}%
- Resource & Improvised Materials Adaptation: ${report.scores.resourcesScore}%

--------------------------------------------------
DETAILED GAP ANALYSIS:
--------------------------------------------------
${gapSection}

--------------------------------------------------
MISSING CURRICULUM ELEMENTS IDENTIFIED:
--------------------------------------------------
${missings || 'None. Document fully covers all standards!'}

--------------------------------------------------
REMEDIATION PLAN / ACTION ITEMS:
--------------------------------------------------
${remedies}

--------------------------------------------------
PEDAGOGICAL RECOMMENDATION:
--------------------------------------------------
${report.pedagogicalTip}

==================================================
Generated via EduNexus Curriculum Validator on ${new Date().toLocaleDateString()}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!report) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const gapRows = report.gapAnalysis.map(g => `
      <div style="margin-bottom: 16px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <strong style="font-size: 13px; color: #1e293b;">Requirement: ${g.requirement}</strong>
          <span style="font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 4px; background-color: ${
            g.documentStatusLabel.includes('Fully') || g.documentStatusLabel.includes('Kikamilifu') ? '#d1fae5' : g.documentStatusLabel.includes('Partially') || g.documentStatusLabel.includes('Kiasi') ? '#fef3c7' : '#fee2e2'
          }; color: ${
            g.documentStatusLabel.includes('Fully') || g.documentStatusLabel.includes('Kikamilifu') ? '#065f46' : g.documentStatusLabel.includes('Partially') || g.documentStatusLabel.includes('Kiasi') ? '#92400e' : '#991b1b'
          };">${g.documentStatusLabel}</span>
        </div>
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #475569;"><strong>Gap Analysis:</strong> ${g.gapExplanation}</p>
        <p style="margin: 0; font-size: 12px; color: #5f6f52; font-weight: bold;"><strong>Remediation:</strong> ${g.remediationAction}</p>
      </div>
    `).join('');

    const suggestions = report.remedyPlan.map(p => `<li>${p}</li>`).join('');
    const missingItems = report.missingElements.map(m => `<li>${m}</li>`).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Kenyan Curriculum Validation - ${document.title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            h1 { color: #0f172a; border-bottom: 2px solid #5f6f52; padding-bottom: 8px; margin-bottom: 16px; font-size: 24px; }
            h2 { color: #334155; font-size: 16px; margin-top: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
            .badge { display: inline-block; font-size: 12px; font-weight: bold; background-color: #5f6f52; color: white; padding: 3px 8px; border-radius: 6px; }
            .grid-score { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; margin-bottom: 24px; }
            .score-card { background: #fafaf9; border: 1px solid #e5e1da; border-radius: 8px; padding: 12px; text-align: center; }
            .score-num { font-size: 20px; font-weight: bold; color: #3e4c34; }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 28px;">🇰🇪</span>
            <h1>Curriculum Validation Quality Assurance Certificate</h1>
            <p style="color: #64748b; font-size: 13px; margin-top: -8px;">Official KICD Standard Evaluation Dashboard</p>
          </div>

          <div style="background-color: #fcfbf9; padding: 16px; border: 1px solid #e5e1da; border-radius: 12px; font-size: 13px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div><strong>Document Title:</strong> ${document.title}</div>
            <div><strong>Syllabus Framework:</strong> Kenyan CBC Standard</div>
            <div><strong>Validated Subject:</strong> ${report.subjectVerified}</div>
            <div><strong>Target Grade/Level:</strong> ${report.gradeVerified}</div>
            <div><strong>Strand / Topic:</strong> ${report.topicVerified}</div>
            <div><strong>Validation Score:</strong> ${report.overallScore}% (${report.status})</div>
          </div>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px;">
            <strong style="color: #15803d; font-size: 14px;">Overall Verdict Summary</strong>
            <p style="margin: 6px 0 0 0; color: #166534; line-height: 1.45;">${report.statusExplanation}</p>
          </div>

          <h2>Validation Pillar Performance Indexes</h2>
          <div class="grid-score">
            <div class="score-card">
              <div style="font-size: 10px; color: #64748b; font-weight: bold;">Outcomes Alignment</div>
              <div class="score-num">${report.scores.learningOutcomesScore}%</div>
            </div>
            <div class="score-card">
              <div style="font-size: 10px; color: #64748b; font-weight: bold;">Core Competencies</div>
              <div class="score-num">${report.scores.competenciesScore}%</div>
            </div>
            <div class="score-card">
              <div style="font-size: 10px; color: #64748b; font-weight: bold;">Values & PCIs</div>
              <div class="score-num">${report.scores.valuesScore}%</div>
            </div>
            <div class="score-card">
              <div style="font-size: 10px; color: #64748b; font-weight: bold;">Resource Adaptability</div>
              <div class="score-num">${report.scores.resourcesScore}%</div>
            </div>
          </div>

          <h2>Detailed Standards Gap Analysis</h2>
          <div>${gapRows}</div>

          ${missingItems ? `<h2>Missing Curriculum Elements</h2><ul style="font-size: 12px; color: #ef4444; line-height: 1.5;">${missingItems}</ul>` : ''}

          <h2>Remediation Plan & Recommendations</h2>
          <ol style="font-size: 12px; line-height: 1.6; color: #334155; padding-left: 20px;">${suggestions}</ol>

          <h2>Expert Master Teacher Tip</h2>
          <div style="padding: 14px; border-left: 4px solid #5f6f52; background-color: #fcfbf9; border-radius: 0 8px 8px 0; font-size: 12px; font-style: italic; color: #3e4c34;">
            "${report.pedagogicalTip}"
          </div>

          <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 20px;">
            EduNexus Academic Quality Assurance Department • Nairobi, Kenya
          </div>

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
          isFullscreen ? 'w-full h-full rounded-none' : 'max-w-5xl w-full h-[90vh] rounded-2xl'
        }`}
      >
        {/* Subtle Kenya Colors Border at the top */}
        <div className="h-1.5 flex shrink-0">
          <div className="flex-1 bg-black" />
          <div className="w-2 bg-white" />
          <div className="flex-1 bg-[#990000]" />
          <div className="w-2 bg-white" />
          <div className="flex-1 bg-[#006600]" />
        </div>

        {/* Alignment progress overlay */}
        {isAligning && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex flex-col items-center justify-center text-center p-8 space-y-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-amber-400/20 border-t-4 border-t-amber-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-amber-500">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {validatorLang === 'en' ? 'Auto-Aligning Content with Standards...' : 'Kusawazisha na Kusahihisha Kiotomatiki...'}
              </h3>
              <p className="text-xs text-amber-300 font-semibold max-w-sm mx-auto animate-pulse">
                {CYCLING_ALIGNING_MESSAGES[alignSloganIdx]}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#1c2416] to-[#3e4c34] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Scroll className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                🇰🇪 Kenyan Curriculum Standards Validator
              </h2>
              <p className="text-[11px] opacity-90 font-medium">
                Deep comparison of content against stored official KICD CBC requirements
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              disabled={isValidating}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              title="Toggle evaluation language between English and Kiswahili"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{validatorLang === 'en' ? 'Swahili Engine' : 'Kingereza'}</span>
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

        {/* Content body divided into standard references vs validations */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50">
          
          {/* LEFT SIDEBAR: Stored standards catalog */}
          <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-[#e5e1da] p-5 overflow-y-auto shrink-0 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[#5f6f52] border-b border-slate-100 pb-2">
              <BookOpen className="w-4 h-4" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider">
                Stored KICD Standard
              </h3>
            </div>

            {storedRequirement ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Profile</div>
                  <div className="space-y-1">
                    <div className="font-extrabold text-[#3e4c34]">{storedRequirement.subject} ({storedRequirement.grade})</div>
                    <div className="font-bold text-slate-700">Strand: <span className="font-medium text-slate-600">{storedRequirement.strand}</span></div>
                    <div className="font-bold text-slate-700">Sub-Strand: <span className="font-medium text-slate-600">{storedRequirement.subStrand}</span></div>
                  </div>
                </div>

                {/* Specific outcomes */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expected SLOs</div>
                  <ul className="space-y-1 pl-4 list-disc text-slate-600 font-medium">
                    {storedRequirement.learningOutcomes.map((lo, idx) => (
                      <li key={idx}>{lo}</li>
                    ))}
                  </ul>
                </div>

                {/* Core Competencies */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Core Competencies</div>
                  <div className="flex flex-wrap gap-1.5">
                    {storedRequirement.coreCompetencies.map((cc, idx) => (
                      <span key={idx} className="bg-[#5f6f52]/10 text-[#3e4c34] px-2 py-0.5 rounded text-[10px] font-bold">
                        {cc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Values */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">National Values</div>
                  <div className="flex flex-wrap gap-1">
                    {storedRequirement.values.map((v, idx) => (
                      <span key={idx} className="bg-amber-50 text-amber-800 border border-amber-100 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                {/* PCIs */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PCIs Supported</div>
                  <div className="flex flex-wrap gap-1">
                    {storedRequirement.pcis.map((p, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Inquiry Questions */}
                <div className="space-y-1.5 bg-sky-50/50 p-2.5 rounded-lg border border-sky-100 text-[11px]">
                  <div className="text-[9px] font-bold text-sky-600 uppercase tracking-wider">Key Inquiry Questions</div>
                  <ul className="list-decimal pl-4 space-y-1 text-sky-800 font-medium mt-1">
                    {storedRequirement.inquiryQuestions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <Compass className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500">No Predefined Standard Found</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                    We'll generate a custom standard reference from global KICD specifications based on the document's metadata.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* MAIN COLUMN: Validation results */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {isValidating ? (
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
                      <Activity className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">
                      Conducting Quality Assurance Audit
                    </h3>
                    <p className="text-xs text-[#5f6f52] font-semibold max-w-sm mx-auto animate-pulse">
                      {CYCLING_VALIDATING_MESSAGES[sloganIdx]}
                    </p>
                  </div>
                </motion.div>
              ) : errorMsg ? (
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
                    <h3 className="font-extrabold text-red-800 text-sm">Analysis Interrupted</h3>
                    <p className="text-xs text-red-600 leading-relaxed">
                      {errorMsg}
                    </p>
                  </div>
                  <button
                    onClick={() => runValidation(validatorLang)}
                    className="px-4 py-2 bg-[#5f6f52] text-white text-xs font-bold rounded-lg hover:bg-[#4d5a42] transition flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Rerun Check</span>
                  </button>
                </motion.div>
              ) : report ? (
                <motion.div 
                  key="report"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Verdict Banner */}
                  <div className={`p-4 rounded-xl border flex gap-3.5 items-start ${
                    report.overallScore >= 85 
                      ? 'bg-emerald-50/70 border-emerald-100 text-emerald-900' 
                      : report.overallScore >= 60 
                        ? 'bg-amber-50/70 border-amber-100 text-amber-900' 
                        : 'bg-red-50/70 border-red-100 text-red-900'
                  }`}>
                    {report.overallScore >= 80 ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-sm uppercase tracking-wider">
                          Overall Status: {report.status}
                        </span>
                        <span className="text-xs bg-white px-2 py-0.5 rounded-full font-bold border border-current">
                          {report.overallScore}% Score
                        </span>
                      </div>
                      <p className="text-xs opacity-95 leading-relaxed font-medium">
                        {report.statusExplanation}
                      </p>
                    </div>
                  </div>

                  {/* Compliance scores grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-[#e5e1da] rounded-xl p-3.5 text-center space-y-1 shadow-2xs">
                      <div className="text-[9px] font-extrabold text-slate-400 uppercase">Outcomes Met</div>
                      <div className="text-xl font-extrabold text-slate-800">{report.scores.learningOutcomesScore}%</div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-[#5f6f52] h-full" style={{ width: `${report.scores.learningOutcomesScore}%` }} />
                      </div>
                    </div>
                    <div className="bg-white border border-[#e5e1da] rounded-xl p-3.5 text-center space-y-1 shadow-2xs">
                      <div className="text-[9px] font-extrabold text-slate-400 uppercase">Competencies</div>
                      <div className="text-xl font-extrabold text-slate-800">{report.scores.competenciesScore}%</div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-[#5f6f52] h-full" style={{ width: `${report.scores.competenciesScore}%` }} />
                      </div>
                    </div>
                    <div className="bg-white border border-[#e5e1da] rounded-xl p-3.5 text-center space-y-1 shadow-2xs">
                      <div className="text-[9px] font-extrabold text-slate-400 uppercase">Values & PCIs</div>
                      <div className="text-xl font-extrabold text-slate-800">{report.scores.valuesScore}%</div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-[#5f6f52] h-full" style={{ width: `${report.scores.valuesScore}%` }} />
                      </div>
                    </div>
                    <div className="bg-white border border-[#e5e1da] rounded-xl p-3.5 text-center space-y-1 shadow-2xs">
                      <div className="text-[9px] font-extrabold text-slate-400 uppercase">Local Materials</div>
                      <div className="text-xl font-extrabold text-slate-800">{report.scores.resourcesScore}%</div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-[#5f6f52] h-full" style={{ width: `${report.scores.resourcesScore}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Side-by-Side Gap Analysis */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#5f6f52]" />
                      <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">
                        Compliance & Gap Analysis
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {report.gapAnalysis.map((gap, idx) => {
                        const isExpanded = expandedGapIndex === idx;
                        const statusColorClass = 
                          gap.documentStatusLabel.includes('Fully') || gap.documentStatusLabel.includes('Kikamilifu')
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            : gap.documentStatusLabel.includes('Partially') || gap.documentStatusLabel.includes('Kiasi')
                              ? 'bg-amber-50 text-amber-800 border-amber-100'
                              : 'bg-red-50 text-red-800 border-red-100';

                        return (
                          <div 
                            key={idx}
                            className="bg-white border border-[#e5e1da] rounded-xl overflow-hidden shadow-2xs transition hover:border-[#5f6f52]/40"
                          >
                            <button
                              onClick={() => setExpandedGapIndex(isExpanded ? null : idx)}
                              className="w-full p-4 flex items-start justify-between gap-4 text-left cursor-pointer"
                            >
                              <div className="space-y-1 flex-1">
                                <div className="text-xs font-bold text-slate-800">
                                  {gap.requirement}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${statusColorClass}`}>
                                    {gap.documentStatusLabel}
                                  </span>
                                </div>
                              </div>
                              <div className="shrink-0 pt-1">
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
                                  className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3 text-xs"
                                >
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Curriculum Gap</span>
                                    <p className="text-slate-600 leading-relaxed">{gap.gapExplanation}</p>
                                  </div>
                                  <div className="space-y-1 bg-[#5f6f52]/5 p-2.5 rounded-lg border border-[#5f6f52]/10">
                                    <span className="text-[10px] font-extrabold text-[#3e4c34] uppercase block">Action Plan (Remediation)</span>
                                    <p className="text-[#3e4c34] leading-relaxed font-semibold">{gap.remediationAction}</p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Missing elements card */}
                  {report.missingElements.length > 0 && (
                    <div className="bg-red-50/40 border border-red-100 rounded-xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="w-4.5 h-4.5" />
                        <h4 className="text-xs font-black uppercase tracking-wider">
                          Missing Curriculum Content
                        </h4>
                      </div>
                      <ul className="list-disc pl-4 space-y-1.5 text-xs text-red-800 font-medium">
                        {report.missingElements.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Remedy Plan / Action items */}
                  <div className="bg-white border border-[#e5e1da] rounded-2xl p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        KICD Syllabus Remediation Checklist
                      </h4>
                    </div>

                    <ul className="space-y-2.5">
                      {report.remedyPlan.map((step, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 leading-relaxed font-medium">
                          <span className="w-5 h-5 rounded-md bg-[#5f6f52]/10 text-[#5f6f52] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Master Teacher Tip */}
                  <div className="p-4 bg-[#5f6f52]/10 border-l-4 border-[#5f6f52] rounded-r-xl text-xs text-[#3e4c34] font-medium leading-relaxed italic flex items-start gap-2">
                    <ThumbsUp className="w-4.5 h-4.5 text-[#5f6f52] shrink-0 mt-0.5" />
                    <span>"{report.pedagogicalTip}"</span>
                  </div>

                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#e5e1da] flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Kenya Institute of Curriculum Development (KICD) Framework Alignment Review
          </span>
          <div className="flex items-center gap-2.5">
            {report && (
              <>
                {onAutoAlign && (
                  <button
                    onClick={handleAutoAlignTrigger}
                    disabled={isAligning || isValidating}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                    title="Automatically rewrite the lesson content to force compliance and alignment with KICD standards"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>{validatorLang === 'en' ? 'Auto-Align Standards' : 'Sahihi Kiotomatiki'}</span>
                  </button>
                )}
                <button
                  onClick={handleCopyReport}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy report'}</span>
                </button>
                <button
                  onClick={handlePrint}
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
