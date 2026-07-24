import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  BookOpen, 
  Check, 
  X as XIcon, 
  Printer, 
  Copy, 
  Edit, 
  Save, 
  Plus, 
  Trash2,
  Award,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info,
  Globe,
  Compass,
  FileText,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { SavedDocument, StandardMapping } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { handleResponseJson } from '../utils/api';

interface CurriculumStandardsMapperProps {
  document: SavedDocument;
  onSaveMappings: (mappings: StandardMapping[]) => Promise<void>;
  onClose: () => void;
  isStudent?: boolean;
}

const CYCLING_TIPS = [
  "Kenyan CBC focuses heavily on Core Competencies like Critical Thinking, Communication, and Citizenship...",
  "Integrating Pertinent and Contemporary Issues (PCIs) ensures real-world alignment in CBC lessons...",
  "International standards like NGSS promote three-dimensional learning: Core Ideas, Crosscutting Concepts, and Practices...",
  "Cambridge syllabuses stress the development of learners who are confident, responsible, reflective, innovative, and engaged...",
  "Explanations of standard alignment help school inspectors and heads of departments verify syllabus compliance instantly..."
];

export default function CurriculumStandardsMapper({
  document,
  onSaveMappings,
  onClose,
  isStudent = false
}: CurriculumStandardsMapperProps) {
  const { aiLanguage } = useLanguage();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
  const [isGenerating, setIsGenerating] = useState(false);
  const [cyclingTip, setCyclingTip] = useState(CYCLING_TIPS[0]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // State for mappings
  const [mappings, setMappings] = useState<StandardMapping[]>(document.standardMappings || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Temporary form state for editing/adding a mapping
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formAssessmentAlignment, setFormAssessmentAlignment] = useState('');

  // Selected standard category for manual template insertion
  const [selectedStandardTemplate, setSelectedStandardTemplate] = useState('');

  // Copy status
  const [copied, setCopied] = useState(false);

  // Auto-cycle tips during generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setCyclingTip(prev => {
          const currentIndex = CYCLING_TIPS.indexOf(prev);
          const nextIndex = (currentIndex + 1) % CYCLING_TIPS.length;
          return CYCLING_TIPS[nextIndex];
        });
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const response = await fetch('/api/generate-standard-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          curriculum: document.curriculum,
          subject: document.subject,
          classLevel: document.classLevel,
          topic: document.topic,
          content: document.content,
          quiz: document.quiz,
          language: aiLanguage,
        }),
      });

      const data = await handleResponseJson(response, 'Failed to auto-map standards.');
      const newMappings = data.mappings || [];
      
      setMappings(newMappings);
      await onSaveMappings(newMappings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setActiveTab('view');
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || 'An error occurred during curriculum standard mapping.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSaveMappings(mappings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save mappings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditMapping = (index: number) => {
    const mapping = mappings[index];
    setEditingIndex(index);
    setFormCode(mapping.code);
    setFormTitle(mapping.title);
    setFormDescription(mapping.description);
    setFormExplanation(mapping.explanation);
    setFormAssessmentAlignment(mapping.assessmentAlignment);
    setActiveTab('edit');
  };

  const handleAddNew = () => {
    setEditingIndex(-1);
    setFormCode('');
    setFormTitle('');
    setFormDescription('');
    setFormExplanation('');
    setFormAssessmentAlignment('');
    setActiveTab('edit');
  };

  const handleSaveForm = () => {
    if (!formCode || !formTitle) {
      alert('Standard Code and Title are required.');
      return;
    }

    const newMapping: StandardMapping = {
      code: formCode,
      title: formTitle,
      description: formDescription,
      explanation: formExplanation,
      assessmentAlignment: formAssessmentAlignment
    };

    let updatedMappings = [...mappings];
    if (editingIndex !== null && editingIndex >= 0) {
      updatedMappings[editingIndex] = newMapping;
    } else {
      updatedMappings.push(newMapping);
    }

    setMappings(updatedMappings);
    setEditingIndex(null);
    setActiveTab('view');
  };

  const handleDeleteMapping = (index: number) => {
    if (window.confirm('Are you sure you want to remove this standard mapping?')) {
      const updated = mappings.filter((_, i) => i !== index);
      setMappings(updated);
    }
  };

  const handleCopyReport = () => {
    if (mappings.length === 0) return;
    
    const textReport = mappings.map((m, idx) => {
      return `${idx + 1}. Standard: ${m.code} - ${m.title}
   Description: ${m.description}
   Content Alignment: ${m.explanation}
   Assessment Alignment: ${m.assessmentAlignment}`;
    }).join('\n\n');

    const heading = `CURRICULUM STANDARDS ALIGNMENT REPORT\n` +
                    `Document: ${document.title}\n` +
                    `Curriculum System: ${document.curriculum === 'cbc' ? 'Kenyan CBC' : 'Standard Outcomes Syllabus'}\n` +
                    `Subject: ${document.subject} | Grade Level: ${document.classLevel}\n` +
                    `==================================================\n\n`;

    navigator.clipboard.writeText(heading + textReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const mappingsHtml = mappings.map(m => `
      <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
        <h3 style="margin-top: 0; color: #1e293b; font-family: sans-serif;">
          <span style="background-color: #4f46e5; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px; margin-right: 8px;">${m.code}</span>
          ${m.title}
        </h3>
        <p style="font-style: italic; color: #64748b; font-size: 13px;"><strong>Description:</strong> ${m.description}</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;"><strong>How Content Aligns:</strong> ${m.explanation}</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.5; border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 10px;"><strong>Assessment Alignment:</strong> ${m.assessmentAlignment}</p>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Curriculum Alignment Report - ${document.title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
            .meta { margin-bottom: 30px; font-size: 14px; color: #475569; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          </style>
        </head>
        <body>
          <h1>Curriculum Alignment & Standard Mapping</h1>
          <div class="meta">
            <div><strong>Lesson Title:</strong> ${document.title}</div>
            <div><strong>Curriculum:</strong> ${document.curriculum === 'cbc' ? 'Kenyan Competency-Based Curriculum (CBC)' : 'International / Standard Syllabus'}</div>
            <div><strong>Subject:</strong> ${document.subject}</div>
            <div><strong>Grade/Class:</strong> ${document.classLevel}</div>
            <div><strong>Topic:</strong> ${document.topic}</div>
            <div><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</div>
          </div>
          ${mappingsHtml || '<p>No standards mapped yet.</p>'}
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Prepopulate form with standard templates based on select values
  const applyPredefinedStandard = (val: string) => {
    setSelectedStandardTemplate(val);
    if (!val) return;

    if (document.curriculum === 'cbc') {
      const cbcTemplates: Record<string, { code: string; title: string; desc: string; exp: string; assess: string }> = {
        'comms': {
          code: 'CBC.CC.COM',
          title: 'Communication and Collaboration',
          desc: 'Ability of learners to express themselves clearly, listen, respect other view points, and work in teams.',
          exp: 'Students work in peer-buddy pairs and collaborative groups to solve worksheets, discuss key concepts, and give mutual assistance.',
          assess: 'Assessment items are designed as collaborative group tasks and Peer Evaluation Checklists.'
        },
        'critical': {
          code: 'CBC.CC.CRT',
          title: 'Critical Thinking and Problem Solving',
          desc: 'Learners apply logic, inquiry, analysis, and evaluation to tackle everyday challenges.',
          exp: 'The core lesson plan features inquiry-driven experiments and multi-tiered open-ended problem solving sequences.',
          assess: 'Assessment items include Bloom\'s Taxonomy analysis questions and contextual real-world scenarios.'
        },
        'self': {
          code: 'CBC.CC.SEF',
          title: 'Self-Efficacy and Self-Directed Learning',
          desc: 'Developing internal confidence, autonomy, and capability in pursuing self-paced learning objectives.',
          exp: 'Lesson layouts incorporate scaffolded checklists and milestones allowing students to direct their pace.',
          assess: 'Interactive self-reflection checklists at the conclusion of the material measure student confidence.'
        }
      };

      const t = cbcTemplates[val];
      if (t) {
        setFormCode(t.code);
        setFormTitle(t.title);
        setFormDescription(t.desc);
        setFormExplanation(t.exp);
        setFormAssessmentAlignment(t.assess);
      }
    } else {
      const standardTemplates: Record<string, { code: string; title: string; desc: string; exp: string; assess: string }> = {
        'ngss': {
          code: 'NGSS.MS-PS1-1',
          title: 'Matter and Its Interactions',
          desc: 'Develop models to describe the atomic composition of simple molecules and extended structures.',
          exp: 'The lesson document utilizes visual models, structured diagrams, and analytical breakdowns of molecules.',
          assess: 'Assessment questions require students to sketch structures and analyze atomic compositions.'
        },
        'ccss_math': {
          code: 'CCSS.MATH.5.NF.A.1',
          title: 'Number and Operations - Fractions',
          desc: 'Add and subtract fractions with unlike denominators by replacing them with equivalent fractions.',
          exp: 'Core content and practice sheets guide students progressively through equivalent fraction conversion and operations.',
          assess: 'The quiz questions test adding/subtracting fractions with distinct denominators, with step-by-step solutions.'
        },
        'ib_myp': {
          code: 'IB.MYP.SCI.1',
          title: 'Scientific Inquiry and Evaluation',
          desc: 'Students design, analyze, and evaluate scientific experiments and qualitative/quantitative data.',
          exp: 'Includes structured lab work, research prompts, and dynamic variables for inquiry.',
          assess: 'Questions test the interpretation of experimental diagrams and deduction of outcomes.'
        }
      };

      const t = standardTemplates[val];
      if (t) {
        setFormCode(t.code);
        setFormTitle(t.title);
        setFormDescription(t.desc);
        setFormExplanation(t.exp);
        setFormAssessmentAlignment(t.assess);
      }
    }
  };

  return (
    <div className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`bg-[#fcfbf9] border border-[#e5e1da] shadow-2xl flex flex-col overflow-hidden ${
          isFullscreen ? 'w-full h-full rounded-none' : 'max-w-4xl w-full h-[90vh] rounded-2xl'
        }`}
      >
        {/* Header Banner */}
        <div className={`p-5 text-white flex items-center justify-between shrink-0 ${
          document.curriculum === 'cbc' 
            ? 'bg-gradient-to-r from-[#5f6f52] to-[#3e4c34]' 
            : 'bg-gradient-to-r from-indigo-700 to-[#4f46e5]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Award className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                {document.curriculum === 'cbc' 
                  ? 'Kenyan CBC Compliance Studio' 
                  : 'Syllabus Standard & Curriculum Mapping'}
              </h2>
              <p className="text-[11px] opacity-90 font-medium">
                Allying your Lesson Plan & Assessments to Educational Guidelines
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-white/15 rounded-xl transition cursor-pointer text-white/90 hover:text-white"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/15 rounded-xl transition cursor-pointer text-white/90 hover:text-white"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Ribbon / Sub-Bar */}
        <div className="px-6 py-3 bg-slate-100 border-b border-[#e5e1da] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="text-slate-400">Current Material:</span>
            <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-[11px] font-bold">
              {document.title}
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-400">Curriculum Mode:</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
              document.curriculum === 'cbc' 
                ? 'bg-[#5f6f52]/10 text-[#5f6f52]' 
                : 'bg-indigo-100 text-indigo-800'
            }`}>
              {document.curriculum === 'cbc' ? 'Kenyan CBC' : 'Standard (Intl)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('view')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition ${
                activeTab === 'view'
                  ? 'bg-white text-slate-800 shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Overview & Alignment
            </button>
            {!isStudent && (
              <button
                onClick={handleAddNew}
                className="px-3 py-1.5 bg-[#5f6f52]/10 hover:bg-[#5f6f52]/20 text-[#5f6f52] text-xs font-bold rounded-lg transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Standard</span>
              </button>
            )}
          </div>
        </div>

        {/* Central Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'view' ? (
              <motion.div 
                key="view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Main Instruction box / CTA */}
                {mappings.length === 0 ? (
                  <div className="bg-white border border-[#e5e1da] rounded-2xl p-8 text-center max-w-2xl mx-auto my-6 space-y-5 shadow-xs">
                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-[#e5e1da] flex items-center justify-center mx-auto text-[#5f6f52]">
                      <Compass className="w-8 h-8 animate-spin-slow" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-extrabold text-slate-800">
                        Map Your Content to Formal Syllabus Guidelines
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                        {document.curriculum === 'cbc' 
                          ? 'Extract specific sub-strands, competencies, values, and outcomes aligned with the Kenyan KICD curriculum framework.'
                          : 'Extract Next Generation Science Standards (NGSS), Common Core (CCSS), Cambridge primary/secondary, or IB frameworks.'}
                      </p>
                    </div>

                    {generationError && (
                      <div className="bg-red-50 border border-red-150 rounded-xl p-3 text-xs text-red-700 flex items-start gap-2 text-left">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Mapping Failed</p>
                          <p>{generationError}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-3 pt-2">
                      {!isStudent && (
                        <button
                          onClick={handleGenerateAI}
                          disabled={isGenerating}
                          className="px-5 py-3 bg-[#5f6f52] hover:bg-[#4d5a42] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Generate Aligned Mappings with AI</span>
                        </button>
                      )}
                      <button
                        onClick={handleAddNew}
                        className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Map Manually</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Toolbar for mapped outputs */}
                    <div className="flex items-center justify-between gap-4 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-700">
                          {mappings.length} Syllabus Standards Successfully Mapped
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyReport}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-500" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Copy Alignment Report</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={handlePrintReport}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>Print Standard Mapping</span>
                        </button>
                        {!isStudent && (
                          <button
                            onClick={handleGenerateAI}
                            disabled={isGenerating}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>Remap with AI</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Aligned Cards Stack */}
                    <div className="space-y-4">
                      {mappings.map((m, idx) => (
                        <div 
                          key={idx}
                          className="bg-white border border-[#e5e1da] rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition"
                        >
                          {/* Card Header */}
                          <div className="p-4 bg-slate-50/60 border-b border-[#e5e1da]/60 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`px-2.5 py-1 text-xs font-extrabold rounded-md uppercase tracking-wide shrink-0 ${
                                document.curriculum === 'cbc'
                                  ? 'bg-[#5f6f52] text-white'
                                  : 'bg-indigo-600 text-white'
                              }`}>
                                {m.code}
                              </span>
                              <h4 className="text-sm font-bold text-slate-800 truncate">
                                {m.title}
                              </h4>
                            </div>
                            
                            {!isStudent && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleEditMapping(idx)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                  title="Edit Standard alignment details"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMapping(idx)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition cursor-pointer"
                                  title="Remove standard alignment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Card Content */}
                          <div className="p-5 space-y-4 text-xs leading-relaxed text-slate-700">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                                Standard Syllabus Description
                              </p>
                              <p className="text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 italic">
                                {m.description || 'No formal description specified.'}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                              <div className="bg-[#fcfbf9] border border-[#eadecd]/40 rounded-xl p-3.5">
                                <p className="text-[10px] uppercase font-bold text-[#5f6f52] tracking-wider mb-1.5 flex items-center gap-1">
                                  <BookOpen className="w-3.5 h-3.5 text-[#5f6f52]" />
                                  <span>How Content Addresses Standard</span>
                                </p>
                                <p className="text-slate-700 leading-normal">
                                  {m.explanation || 'No content alignment description added.'}
                                </p>
                              </div>

                              <div className="bg-amber-50/30 border border-amber-100/40 rounded-xl p-3.5">
                                <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider mb-1.5 flex items-center gap-1">
                                  <Award className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Assessment Alignment & Testing</span>
                                </p>
                                <p className="text-slate-700 leading-normal">
                                  {m.assessmentAlignment || 'No assessment alignment description added.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Save Trigger */}
                    {!isStudent && (
                      <div className="pt-2 flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 font-medium">
                          Changes to mappings are automatically synchronized to your teacher's folder database.
                        </p>
                        <button
                          onClick={handleSaveAll}
                          disabled={isSaving}
                          className="px-5 py-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSaving ? (
                            <span>Saving Changes...</span>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Save Standard Mapping</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="edit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-[#e5e1da] rounded-2xl p-6 shadow-2xs space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">
                    {editingIndex !== null && editingIndex >= 0 ? '📝 Edit Standard Mapping' : '✨ Add New Curriculum Standard'}
                  </h3>
                  <button
                    onClick={() => setActiveTab('view')}
                    className="text-xs text-slate-400 hover:text-slate-700 underline font-bold"
                  >
                    Back to List
                  </button>
                </div>

                {/* Templates Selector */}
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Prepopulate from Framework Templates
                  </label>
                  <select
                    value={selectedStandardTemplate}
                    onChange={(e) => applyPredefinedStandard(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Choose Standard Template --</option>
                    {document.curriculum === 'cbc' ? (
                      <>
                        <option value="comms">CBC.CC.COM - Communication and Collaboration</option>
                        <option value="critical">CBC.CC.CRT - Critical Thinking and Problem Solving</option>
                        <option value="self">CBC.CC.SEF - Self-Efficacy and Self-Directed Learning</option>
                      </>
                    ) : (
                      <>
                        <option value="ngss">NGSS.MS-PS1-1 - Matter and Its Interactions</option>
                        <option value="ccss_math">CCSS.MATH.5.NF.A.1 - Number and Operations - Fractions</option>
                        <option value="ib_myp">IB.MYP.SCI.1 - Scientific Inquiry and Evaluation</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Main Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1 md:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Standard Code</label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="e.g. CBC.G5.SCI.2 or NGSS.5-PS1-1"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Standard Title</label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g. Classification of Animals or Structure and Properties of Matter"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Syllabus Standard Description</label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="What is the official text or learning outcome statement of this curriculum standard?"
                      className="w-full min-h-[70px] text-xs leading-relaxed p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> How Lesson Content Addresses It
                      </label>
                      <textarea
                        value={formExplanation}
                        onChange={(e) => setFormExplanation(e.target.value)}
                        placeholder="Detail how your teaching material, examples, and instructional flow specifically support student attainment of this standard."
                        className="w-full min-h-[110px] text-xs leading-relaxed p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-indigo-500" /> Assessment Alignment & Item Alignment
                      </label>
                      <textarea
                        value={formAssessmentAlignment}
                        onChange={(e) => setFormAssessmentAlignment(e.target.value)}
                        placeholder="Detail how specific assessment items, homework questions, or interactive quizzes test, measure, and verify mastery of this standard."
                        className="w-full min-h-[110px] text-xs leading-relaxed p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(null);
                      setActiveTab('view');
                    }}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl py-2.5 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveForm}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Apply Standard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Loading Screen Overlay */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-8 text-center z-50"
            >
              <div className="space-y-6 max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto text-white shadow-lg animate-pulse">
                  <Sparkles className="w-8 h-8 animate-spin" />
                </div>
                
                <div className="space-y-2 text-white">
                  <h3 className="text-base font-extrabold">Mapping Curriculum Guidelines...</h3>
                  <p className="text-xs text-indigo-200 leading-relaxed">
                    Analyzing lesson plan structure, target topics, and assessment items. Aligning content with KICD CBC parameters and international standards.
                  </p>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 text-xs text-indigo-100 italic leading-relaxed animate-fadeIn">
                  <p className="text-[10px] uppercase font-bold text-amber-300 not-italic tracking-wider mb-1 flex items-center justify-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>Compliance Tip</span>
                  </p>
                  "{cyclingTip}"
                </div>

                <div className="w-full bg-indigo-950/50 rounded-full h-1 overflow-hidden">
                  <div className="bg-indigo-400 h-full w-2/3 rounded-full animate-infinite-loading"></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save success toast */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold z-50"
            >
              <Check className="w-4 h-4 text-green-400" />
              <span>Standard Mappings Synchronized Successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
