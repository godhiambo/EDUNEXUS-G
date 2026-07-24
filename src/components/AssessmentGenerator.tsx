import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { EditableSelect } from './EditableSelect';
import { 
  Sparkles, 
  HelpCircle, 
  Check, 
  X, 
  Printer, 
  Copy, 
  Edit, 
  Save, 
  Plus, 
  Trash2, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  ChevronDown, 
  ChevronUp,
  Sliders,
  Layers,
  BookOpen,
  ArrowLeft,
  Settings,
  Download,
  Share2
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { 
  SUBJECT_OPTIONS, 
  GRADE_OPTIONS_CBC, 
  GRADE_OPTIONS_STANDARD, 
  CurriculumType,
  QuestionBankItem,
  QuizQuestion
} from '../types';
import AssessmentDiagnosticView from './AssessmentDiagnosticView';

interface AssessmentGeneratorProps {
  onBackToDashboard?: () => void;
}

const PEDAGOGICAL_TIPS = [
  "Bloom's Taxonomy: Scaffolding questions from recall to analysis promotes higher-order critical thinking.",
  "Constructive Alignment: Ensure each assessment item corresponds directly to your primary learning objectives.",
  "Diagnostic Distractors: Create multiple-choice distractors that address common student misconceptions.",
  "Formative Feedback: Providing clear pedagogical explanations helps turn assessment into a learning tool.",
  "Question Variety: Mixing question formats (MCQs, short answer, fill-in-blanks) ensures robust assessment of diverse learners."
];

export default function AssessmentGenerator({ onBackToDashboard }: AssessmentGeneratorProps) {
  // Form State
  const [subject, setSubject] = useState<string>('Science & Technology');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [curriculum, setCurriculum] = useState<CurriculumType>('cbc');
  const [gradeLevel, setGradeLevel] = useState<string>('Grade 6');
  const [questionTypes, setQuestionTypes] = useState<string[]>(['multiple-choice', 'true-false', 'fill-in-blanks', 'short-answer']);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(true);

  // App State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cyclingTip, setCyclingTip] = useState<string>(PEDAGOGICAL_TIPS[0]);
  
  // Results State
  const [assessmentTitle, setAssessmentTitle] = useState<string>('');
  const [assessmentDesc, setAssessmentDesc] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  
  // Interactive UI State
  const [activeViewTab, setActiveViewTab] = useState<'sheet' | 'diagnostics'>('sheet');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(true);
  
  // Question-specific edited content
  const [editQuestionText, setEditQuestionText] = useState<string>('');
  const [editExplanation, setEditExplanation] = useState<string>('');
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editCorrectAnswerIndex, setEditCorrectAnswerIndex] = useState<number>(0);
  const [editCorrectAnswerText, setEditCorrectAnswerText] = useState<string>('');

  // Save/Export states
  const [copied, setCopied] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<Record<number, 'idle' | 'saving' | 'saved' | 'error'>>({});
  const [saveAllStatus, setSaveAllStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);

  // Synchronize selectedQuestions with questions when loaded or generated
  useEffect(() => {
    setSelectedQuestions(questions.map((_, idx) => idx));
  }, [questions]);

  // Grouped grade levels based on selected curriculum
  const gradeOptions = curriculum === 'cbc' ? GRADE_OPTIONS_CBC : GRADE_OPTIONS_STANDARD;

  // Sync gradeLevel if curriculum changes and gradeLevel is not in options
  useEffect(() => {
    if (!gradeOptions.includes(gradeLevel)) {
      setGradeLevel(gradeOptions[0] || 'Grade 1');
    }
  }, [curriculum]);

  // Cycle tips during generation
  useEffect(() => {
    if (!isGenerating) return;
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % PEDAGOGICAL_TIPS.length;
      setCyclingTip(PEDAGOGICAL_TIPS[index]);
    }, 4500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Handle Question Type Select / Deselect
  const toggleQuestionType = (type: string) => {
    if (questionTypes.includes(type)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter(t => t !== type));
      }
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  // Generate assessment questions
  const handleGenerateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMsg('Please specify a topic or learning focus.');
      return;
    }
    if (questionTypes.length === 0) {
      setErrorMsg('Please select at least one question type.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setQuestions([]);
    setSaveStatus({});
    setSaveAllStatus('idle');
    setActiveViewTab('sheet');

    const selectedSubject = subject === 'Other' ? customSubject : subject;

    try {
      const response = await fetch('/api/generate-assessment-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject || 'General Studies',
          topic,
          gradeLevel,
          questionTypes,
          numQuestions,
          curriculum
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate assessment items.');
      }

      const data = await response.json();
      if (data.assessment) {
        setAssessmentTitle(data.assessment.title || `Assessment: ${topic}`);
        setAssessmentDesc(data.assessment.description || 'Answer the questions below to evaluate your understanding.');
        setQuestions(data.assessment.questions || []);
        setExpandedIndex(0); // expand first question by default
        setShowAnswerKey(includeAnswerKey);
      } else {
        throw new Error('AI returned empty response. Please try again.');
      }
    } catch (err: any) {
      console.error('Error generating assessment:', err);
      setErrorMsg(err.message || 'An error occurred during generation. Please check your network and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Enable inline editing for a question
  const startEditing = (idx: number) => {
    const q = questions[idx];
    setEditingIndex(idx);
    setEditQuestionText(q.questionText);
    setEditExplanation(q.explanation);
    setEditOptions(q.options ? [...q.options] : []);
    setEditCorrectAnswerIndex(q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : 0);
    setEditCorrectAnswerText(q.correctAnswer || '');
  };

  // Save edited question changes
  const saveEdit = (idx: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[idx] = {
      ...updatedQuestions[idx],
      questionText: editQuestionText,
      explanation: editExplanation,
      options: editOptions,
      correctAnswerIndex: editCorrectAnswerIndex,
      correctAnswer: editCorrectAnswerText
    };
    setQuestions(updatedQuestions);
    setEditingIndex(null);
    
    // Reset save status back to idle if edited
    setSaveStatus(prev => ({ ...prev, [idx]: 'idle' }));
  };

  // Save a single question to Firestore Question Bank
  const saveSingleToBank = async (idx: number) => {
    const q = questions[idx];
    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in to save questions to your Question Bank.");
      return;
    }

    setSaveStatus(prev => ({ ...prev, [idx]: 'saving' }));
    
    try {
      const selectedSubject = subject === 'Other' ? customSubject : subject;
      const itemData: Omit<QuestionBankItem, 'id'> = {
        userId: user.uid,
        type: q.type || 'multiple-choice',
        questionText: q.questionText,
        options: q.options || [],
        correctAnswerIndex: q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : -1,
        correctAnswer: q.correctAnswer || (q.options && q.correctAnswerIndex !== undefined && q.options[q.correctAnswerIndex] ? q.options[q.correctAnswerIndex] : ''),
        explanation: q.explanation || 'AI generated assessment question.',
        gradeLevel: gradeLevel,
        subject: selectedSubject || 'General Studies',
        topic: topic,
        curriculum: curriculum,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'questionBank'), itemData);
      setSaveStatus(prev => ({ ...prev, [idx]: 'saved' }));
    } catch (err) {
      console.error('Error saving single question:', err);
      setSaveStatus(prev => ({ ...prev, [idx]: 'error' }));
    }
  };

  // Save all generated questions to the Firestore Question Bank in bulk
  const saveAllToBank = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in to save questions to your Question Bank.");
      return;
    }

    setSaveAllStatus('saving');
    const selectedSubject = subject === 'Other' ? customSubject : subject;

    try {
      for (let i = 0; i < questions.length; i++) {
        // Skip if already saved
        if (saveStatus[i] === 'saved') continue;

        const q = questions[i];
        const itemData: Omit<QuestionBankItem, 'id'> = {
          userId: user.uid,
          type: q.type || 'multiple-choice',
          questionText: q.questionText,
          options: q.options || [],
          correctAnswerIndex: q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : -1,
          correctAnswer: q.correctAnswer || (q.options && q.correctAnswerIndex !== undefined && q.options[q.correctAnswerIndex] ? q.options[q.correctAnswerIndex] : ''),
          explanation: q.explanation || 'AI generated assessment question.',
          gradeLevel: gradeLevel,
          subject: selectedSubject || 'General Studies',
          topic: topic,
          curriculum: curriculum,
          createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'questionBank'), itemData);
        setSaveStatus(prev => ({ ...prev, [i]: 'saved' }));
      }
      setSaveAllStatus('saved');
    } catch (err) {
      console.error('Error bulk saving questions:', err);
      setSaveAllStatus('error');
    }
  };

  // Copy complete assessment to clipboard as beautiful Markdown
  const copyToClipboard = () => {
    let md = `# ${assessmentTitle}\n`;
    md += `${assessmentDesc}\n\n`;
    md += `**Subject:** ${subject === 'Other' ? customSubject : subject} | **Grade:** ${gradeLevel} | **Curriculum:** ${curriculum.toUpperCase()}\n`;
    md += `**Topic:** ${topic}\n\n`;
    md += `--- \n\n`;

    questions.forEach((q, idx) => {
      md += `### Question ${idx + 1} (${q.type ? q.type.toUpperCase().replace('-', ' ') : 'Multiple Choice'})\n`;
      md += `${q.questionText}\n\n`;

      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        if (q.options && q.options.length > 0) {
          q.options.forEach((opt, oIdx) => {
            const letter = String.fromCharCode(65 + oIdx); // A, B, C, D...
            md += `  ${letter}. ${opt}\n`;
          });
        }
      } else {
        md += `_Correct Response Guideline:_\n${q.correctAnswer || 'Provide short conceptual proof.'}\n`;
      }
      md += `\n`;
    });

    if (includeAnswerKey) {
      md += `## ANSWER KEY & PEDAGOGICAL EXPLANATIONS\n\n`;
      questions.forEach((q, idx) => {
        md += `### Q${idx + 1} Correct Answer:\n`;
        if (q.type === 'multiple-choice' || q.type === 'true-false') {
          const letter = q.correctAnswerIndex !== undefined && q.correctAnswerIndex >= 0 ? String.fromCharCode(65 + q.correctAnswerIndex) : '?';
          const ansText = q.options && q.correctAnswerIndex !== undefined && q.options[q.correctAnswerIndex] ? q.options[q.correctAnswerIndex] : '';
          md += `**${letter}. ${ansText}**\n\n`;
        } else {
          md += `**${q.correctAnswer}**\n\n`;
        }
        md += `**Pedagogical Feedback & Revision Insights:**\n${q.explanation}\n\n`;
        md += `--- \n\n`;
      });
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Open native print dialogue for generated assessment sheet
  const handlePrintAssessment = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const selectedSubject = subject === 'Other' ? customSubject : subject;

    const quizHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Assessment: ${assessmentTitle}</title>
        <style>
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #1e293b;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
          }
          h1 {
            color: #5f6f52;
            font-size: 24px;
            border-bottom: 2px solid #e5e1da;
            padding-bottom: 12px;
            margin-bottom: 8px;
          }
          .desc {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 24px;
            font-style: italic;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            border: 1px solid #cbd5e1;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 30px;
            font-size: 13px;
            background-color: #fcfbf9;
          }
          .meta-item span {
            font-weight: bold;
          }
          .question {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .q-text {
            font-weight: bold;
            font-size: 15px;
            margin-bottom: 10px;
          }
          .option {
            margin-left: 20px;
            margin-bottom: 6px;
            font-size: 14px;
          }
          .blank-line {
            margin-top: 15px;
            border-bottom: 1px solid #94a3b8;
            height: 40px;
            width: 100%;
          }
          .page-break {
            page-break-before: always;
          }
          .ans-title {
            color: #5f6f52;
            font-size: 20px;
            margin-top: 40px;
            margin-bottom: 16px;
            border-bottom: 2px solid #e5e1da;
            padding-bottom: 8px;
          }
          .explanation {
            font-size: 13px;
            color: #475569;
            margin-top: 6px;
            background: #f1f5f9;
            padding: 10px;
            border-radius: 6px;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${assessmentTitle}</h1>
        <div class="desc">${assessmentDesc}</div>
        
        <div class="meta-row">
          <div class="meta-item"><span>Subject:</span> ${selectedSubject}</div>
          <div class="meta-item"><span>Grade Level:</span> ${gradeLevel}</div>
          <div class="meta-item"><span>Curriculum:</span> ${curriculum.toUpperCase()}</div>
        </div>

        <div style="margin-bottom: 40px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
            <div><strong>Student Name:</strong> ___________________________</div>
            <div><strong>Date:</strong> __________________</div>
          </div>
        </div>

        <div>
          ${questions.map((q, idx) => `
            <div class="question">
              <div class="q-text">Q${idx + 1}. ${q.questionText}</div>
              
              ${(q.type === 'multiple-choice' || q.type === 'true-false') ? `
                <div style="margin-top: 10px;">
                  ${(q.options || []).map((opt, oIdx) => `
                    <div class="option">
                      [ ] ${String.fromCharCode(65 + oIdx)}. ${opt}
                    </div>
                  `).join('')}
                </div>
              ` : `
                ${q.type === 'fill-in-blanks' ? `
                  <div style="margin-top: 10px; font-style: italic; color: #64748b; font-size: 13px;">Write your response in the space above.</div>
                ` : `
                  <div class="blank-line"></div>
                  <div class="blank-line"></div>
                  <div class="blank-line"></div>
                `}
              `}
            </div>
          `).join('')}
        </div>

        ${includeAnswerKey ? `
          <div class="page-break"></div>
          <h2 class="ans-title">Answer Key & Pedagogical Feedback</h2>
          <div>
            ${questions.map((q, idx) => `
              <div style="margin-bottom: 24px;">
                <strong>Question ${idx + 1}:</strong> ${q.questionText}
                <div style="margin-top: 8px; font-weight: 600; font-size: 14px; color: #5f6f52;">
                  Correct Answer: 
                  ${(q.type === 'multiple-choice' || q.type === 'true-false') 
                    ? `${String.fromCharCode(65 + (q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : 0))}. ${q.options && q.correctAnswerIndex !== undefined ? q.options[q.correctAnswerIndex] : ''}` 
                    : `${q.correctAnswer}`
                  }
                </div>
                <div class="explanation">
                  <strong>Pedagogical Insight:</strong> ${q.explanation}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(quizHtml);
    printWindow.document.close();
  };

  // Download complete assessment as a professionally styled PDF
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const colors = {
        theme: { r: 95, g: 111, b: 82 },     // #5f6f52
        heading: { r: 30, g: 41, b: 59 },   // slate-800
        text: { r: 71, g: 85, b: 105 },     // slate-600
        darkText: { r: 15, g: 23, b: 42 },   // slate-900
        muted: { r: 148, g: 163, b: 184 },  // slate-400
        lightBg: { r: 252, g: 251, b: 249 } // #fcfbf9
      };

      const fontFamily = 'helvetica';
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxLineWidth = pageWidth - margin * 2;
      
      let currentY = margin + 10;
      let pageNum = 1;

      // Helper: Page decorations
      const drawPageDecorations = (pNum: number) => {
        // Soft border frame
        doc.setDrawColor(229, 225, 218);
        doc.setLineWidth(0.3);
        doc.rect(margin - 4, margin - 4, pageWidth - (margin - 4) * 2, pageHeight - (margin - 4) * 2, 'D');

        // Footer
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('Generated via Curriculum-Aligned Pedagogical Suite', margin, pageHeight - 10);
        
        const pageNumStr = `Page ${pNum}`;
        const pageNumWidth = doc.getTextWidth(pageNumStr);
        doc.text(pageNumStr, pageWidth - margin - pageNumWidth, pageHeight - 10);
      };

      // Helper: Page overflow check
      const checkPageOverflow = (increment: number) => {
        if (currentY + increment > pageHeight - margin - 12) {
          doc.addPage();
          pageNum++;
          currentY = margin + 10;
          drawPageDecorations(pageNum);
        }
      };

      // Draw first page decorations
      drawPageDecorations(pageNum);

      // 1. Draw elegant title banner
      const bannerHeight = 35;
      checkPageOverflow(bannerHeight + 10);
      
      doc.setDrawColor(95, 111, 82); // Theme color
      doc.setLineWidth(0.6);
      doc.setFillColor(colors.lightBg.r, colors.lightBg.g, colors.lightBg.b);
      doc.rect(margin, currentY, maxLineWidth, bannerHeight, 'FD');

      // Banner Title
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(13);
      doc.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
      const titleLines = doc.splitTextToSize(assessmentTitle || `Assessment: ${topic}`, maxLineWidth - 65);
      let titleY = currentY + 12;
      titleLines.forEach((line: string, index: number) => {
        if (index < 2) {
          doc.text(line, margin + 6, titleY);
          titleY += 6;
        }
      });

      // Banner Sub/Desc
      doc.setFont(fontFamily, 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      const descLines = doc.splitTextToSize(assessmentDesc || 'Evaluate your conceptual understanding.', maxLineWidth - 65);
      if (descLines[0]) {
        doc.text(descLines[0], margin + 6, titleY + 2);
      }

      // Vertical separator line inside banner
      const sepX = margin + maxLineWidth - 55;
      doc.setDrawColor(229, 225, 218);
      doc.setLineWidth(0.4);
      doc.line(sepX, currentY + 4, sepX, currentY + bannerHeight - 4);

      // Banner Metadata
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      
      const selectedSubject = subject === 'Other' ? customSubject : subject;
      const metaItems = [
        `Subject: ${selectedSubject || 'General'}`,
        `Grade: ${gradeLevel}`,
        `Curriculum: ${curriculum.toUpperCase()}`,
        `Date: ${new Date().toLocaleDateString()}`
      ];
      
      let metaY = currentY + 8;
      metaItems.forEach((item) => {
        const truncated = item.length > 25 ? item.substring(0, 23) + '...' : item;
        doc.text(truncated, sepX + 4, metaY);
        metaY += 5.5;
      });

      currentY += bannerHeight + 10;

      // 2. Student Details Box
      checkPageOverflow(15);
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      
      doc.text('Student Name:', margin, currentY + 5);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(margin + 24, currentY + 6, margin + maxLineWidth - 45, currentY + 6);

      doc.text('Score / Grade:', margin + maxLineWidth - 38, currentY + 5);
      doc.rect(margin + maxLineWidth - 14, currentY, 14, 8);

      currentY += 16;

      // Helper function to write multi-line paragraphs cleanly
      const writeText = (text: string, x: number, size: number, style: 'normal' | 'bold' | 'italic', color: { r: number, g: number, b: number }, spacing: number = 5) => {
        doc.setFont(fontFamily, style);
        doc.setFontSize(size);
        doc.setTextColor(color.r, color.g, color.b);
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - (x - margin));
        lines.forEach((line: string) => {
          checkPageOverflow(spacing + 0.5);
          doc.text(line, x, currentY);
          currentY += spacing;
        });
      };

      // 3. Questions Section
      questions.forEach((q, idx) => {
        checkPageOverflow(12);
        
        // Question header
        const qPrefix = `Q${idx + 1}. `;
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
        doc.text(qPrefix, margin, currentY);

        const prefixWidth = doc.getTextWidth(qPrefix);
        
        // Question text
        writeText(q.questionText || '', margin + prefixWidth, 10.5, 'bold', colors.darkText, 5.5);
        currentY += 2;

        // Question details (options, lines, etc)
        if (q.type === 'multiple-choice' || q.type === 'true-false') {
          if (q.options && q.options.length > 0) {
            q.options.forEach((opt, oIdx) => {
              const optLetter = `${String.fromCharCode(65 + oIdx)}. `;
              doc.setFont(fontFamily, 'bold');
              doc.setFontSize(9.5);
              doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
              doc.text(optLetter, margin + 6, currentY);
              
              const optLetterWidth = doc.getTextWidth(optLetter);
              writeText(opt, margin + 6 + optLetterWidth, 9.5, 'normal', colors.text, 5);
            });
          }
        } else if (q.type === 'fill-in-blanks') {
          writeText('Write your response in the space provided above.', margin + 6, 8.5, 'italic', colors.muted, 5);
        } else if (q.type === 'short-answer') {
          // Provide horizontal response guidelines lines
          currentY += 2;
          for (let i = 0; i < 3; i++) {
            checkPageOverflow(8);
            doc.setDrawColor(229, 225, 218);
            doc.setLineWidth(0.3);
            doc.line(margin + 6, currentY, margin + maxLineWidth, currentY);
            currentY += 8;
          }
        }
        
        currentY += 6; // Extra space between questions
      });

      // 4. Answer Key & Pedagogical Explanations
      if (includeAnswerKey) {
        doc.addPage();
        pageNum++;
        currentY = margin + 10;
        drawPageDecorations(pageNum);

        // Header for Answer Key
        checkPageOverflow(15);
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(14);
        doc.setTextColor(colors.theme.r, colors.theme.g, colors.theme.b);
        doc.text('Answer Key & Pedagogical Insights', margin, currentY);
        
        // Underline
        doc.setDrawColor(95, 111, 82);
        doc.setLineWidth(0.5);
        doc.line(margin, currentY + 2, margin + maxLineWidth, currentY + 2);
        
        currentY += 12;

        questions.forEach((q, idx) => {
          checkPageOverflow(15);
          
          doc.setFont(fontFamily, 'bold');
          doc.setFontSize(10);
          doc.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
          doc.text(`Question ${idx + 1} Answer Guideline:`, margin, currentY);
          currentY += 5;

          // Answer text
          let answerText = '';
          if (q.type === 'multiple-choice' || q.type === 'true-false') {
            const letter = q.correctAnswerIndex !== undefined && q.correctAnswerIndex >= 0 ? String.fromCharCode(65 + q.correctAnswerIndex) : '?';
            const ansVal = q.options && q.correctAnswerIndex !== undefined && q.options[q.correctAnswerIndex] ? q.options[q.correctAnswerIndex] : '';
            answerText = `${letter}. ${ansVal}`;
          } else {
            answerText = q.correctAnswer || 'Provide short conceptual response.';
          }

          writeText(answerText, margin + 4, 9.5, 'bold', colors.theme, 5);
          currentY += 1;

          // Pedagogical explanation
          if (q.explanation) {
            writeText('Pedagogical Feedback & Revision Insights:', margin + 4, 8.5, 'bold', colors.text, 4.5);
            writeText(q.explanation, margin + 4, 8.5, 'italic', colors.text, 4.5);
          }
          
          currentY += 6;
        });
      }

      // Save PDF to user's computer
      const safeTitle = assessmentTitle || topic || 'assessment';
      const fileName = `${safeTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      doc.save(fileName);
    } catch (pdfErr) {
      console.error('Error generating PDF download:', pdfErr);
      alert('An error occurred while generating the PDF document.');
    }
  };

  // Export assessment items to CSV for gradebook/spreadsheet integration
  const handleExportCSV = () => {
    if (questions.length === 0) return;
    
    // Determine which questions to export
    const questionsToExport = questions.filter((_, idx) => selectedQuestions.includes(idx));
    if (questionsToExport.length === 0) {
      alert("Please select at least one question to export.");
      return;
    }

    const headers = [
      'Question Number',
      'Question Type',
      'Question Text',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      'Correct Answer',
      'Explanation / Feedback',
      'Subject',
      'Grade Level'
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes('\r')) {
        return `"${str}"`;
      }
      return str;
    };

    const rows = questionsToExport.map((q) => {
      const actualIndex = questions.indexOf(q) + 1;
      
      // Get options
      const optA = q.options && q.options[0] ? q.options[0] : '';
      const optB = q.options && q.options[1] ? q.options[1] : '';
      const optC = q.options && q.options[2] ? q.options[2] : '';
      const optD = q.options && q.options[3] ? q.options[3] : '';

      // Format correct answer nicely
      let correctAns = '';
      if (q.type === 'multiple-choice' && q.options && q.correctAnswerIndex !== undefined) {
        const optionLetters = ['A', 'B', 'C', 'D'];
        const letter = optionLetters[q.correctAnswerIndex] || '';
        const text = q.options[q.correctAnswerIndex] || '';
        correctAns = letter ? `${letter}: ${text}` : text;
      } else if (q.type === 'true-false' && q.correctAnswerIndex !== undefined) {
        correctAns = q.correctAnswerIndex === 0 ? 'True' : 'False';
      } else {
        correctAns = q.correctAnswer || '';
      }

      return [
        actualIndex,
        q.type ? q.type.replace('-', ' ') : 'multiple choice',
        q.questionText,
        optA,
        optB,
        optC,
        optD,
        correctAns,
        q.explanation || '',
        subject === 'Other' ? customSubject : subject,
        gradeLevel
      ];
    });

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `assessment-items_${topic.replace(/\s+/g, '_') || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn" id="assessment-generator-container">
      {/* Back Header */}
      {onBackToDashboard && (
        <div className="flex items-center justify-between no-print border-b border-[#e5e1da] pb-4 mb-4">
          <button 
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-sm font-semibold text-[#5f6f52] hover:text-[#5f6f52]/80 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-[#e9edc9]/40 border border-[#e9edc9] rounded-xl px-3 py-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#5f6f52]" />
            <span>Pedagogical Assessment Creator</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Parameters Form */}
        <div className="lg:col-span-5 bg-white border border-[#e5e1da] shadow-sm rounded-3xl p-6 space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#5f6f52]" />
              Assessment Parameters
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Define the topics and pedagogical constraints to generate customized assessment items.
            </p>
          </div>

          <form onSubmit={handleGenerateAssessment} className="space-y-5">
            {/* Subject Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Subject
              </label>
              <EditableSelect
                value={subject}
                onChange={setSubject}
                options={SUBJECT_OPTIONS}
                placeholder="Select Subject"
                className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52] transition"
              />
            </div>

            {/* Custom Subject text input */}
            {subject === 'Other' && (
              <div className="space-y-2 animate-fadeIn">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Custom Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g. Environmental Hygiene, Music Theory"
                  className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#5f6f52] transition"
                />
              </div>
            )}

            {/* Curriculum standard */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Curriculum Standard
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCurriculum('cbc')}
                  className={`py-2 px-3.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    curriculum === 'cbc'
                      ? 'bg-[#5f6f52]/10 border-[#5f6f52] text-[#5f6f52]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Kenyan CBC
                </button>
                <button
                  type="button"
                  onClick={() => setCurriculum('standard')}
                  className={`py-2 px-3.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    curriculum === 'standard'
                      ? 'bg-[#5f6f52]/10 border-[#5f6f52] text-[#5f6f52]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Standard / KCSE Style
                </button>
              </div>
            </div>

            {/* Grade Level Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Grade Level
              </label>
              <EditableSelect
                value={gradeLevel}
                onChange={setGradeLevel}
                options={gradeOptions}
                placeholder="Select Grade Level"
                className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52] transition"
              />
            </div>

            {/* Topic Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Topic or Lesson Focus
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Water cycle, Fractions, Force & Energy"
                className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#5f6f52] transition"
              />
              <p className="text-[10px] text-slate-400">
                Be specific to help the AI generate tailored questions.
              </p>
            </div>

            {/* Question Types Checkboxes */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Desired Question Types
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'multiple-choice', label: 'Multiple Choice' },
                  { id: 'true-false', label: 'True / False' },
                  { id: 'fill-in-blanks', label: 'Fill in Blanks' },
                  { id: 'short-answer', label: 'Short Answer' }
                ].map((type) => (
                  <label 
                    key={type.id} 
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                      questionTypes.includes(type.id)
                        ? 'bg-[#5f6f52]/5 border-[#5f6f52]/40 text-[#5f6f52]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={questionTypes.includes(type.id)}
                      onChange={() => toggleQuestionType(type.id)}
                      className="rounded border-slate-300 text-[#5f6f52] focus:ring-[#5f6f52] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-semibold">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Number of questions */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Number of Questions
                </label>
                <span className="text-xs font-bold text-[#5f6f52] bg-[#5f6f52]/10 px-2 py-0.5 rounded-lg">
                  {numQuestions} Questions
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="20"
                step="1"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                className="w-full accent-[#5f6f52] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>3</span>
                <span>10</span>
                <span>20</span>
              </div>
            </div>

            {/* Include Answer Key Checkbox */}
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#e5e1da] cursor-pointer transition select-none bg-white hover:bg-slate-50">
                <input
                  type="checkbox"
                  id="include-answer-key"
                  checked={includeAnswerKey}
                  onChange={(e) => {
                    setIncludeAnswerKey(e.target.checked);
                    setShowAnswerKey(e.target.checked);
                  }}
                  className="rounded border-slate-300 text-[#5f6f52] focus:ring-[#5f6f52] w-4 h-4 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">Include Answer Key</span>
                  <span className="text-[10px] text-slate-400 leading-tight">Append correct answers & pedagogical feedback at the end of the printed/copied document</span>
                </div>
              </label>
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-[#5f6f52] hover:bg-[#5f6f52]/90 disabled:bg-[#5f6f52]/50 text-white font-bold py-3 px-4 rounded-xl transition duration-200 text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#fefae0]" />
              <span>{isGenerating ? 'Generating Assessment...' : 'AI Generate Assessment'}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Results Display */}
        <div className="lg:col-span-7 space-y-6">
          {/* Default view when no assessment generated */}
          {questions.length === 0 && !isGenerating && (
            <div className="bg-white border border-[#e5e1da] shadow-sm rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[450px]">
              <div className="w-16 h-16 bg-[#5f6f52]/10 text-[#5f6f52] rounded-2xl flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Pedagogical Assessment Creator</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                Specify your class level, target subject, topic, and parameters on the left. The AI will engineer curriculum-aligned, high-quality, scaffolded exam questions.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mt-8 text-left">
                <div className="p-4 border border-slate-100 rounded-2xl bg-[#fdfbf7]">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#5f6f52]" /> Scaffolded Levels
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal mt-1">
                    Questions go from low-level recalling up to high-level analysis matching Bloom's taxonomy.
                  </p>
                </div>
                <div className="p-4 border border-slate-100 rounded-2xl bg-[#fdfbf7]">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#5f6f52]" /> Formative Feedback
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal mt-1">
                    Every generated question features explicit pedagogical tips to target confusion areas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isGenerating && (
            <div className="bg-white border border-[#e5e1da] shadow-sm rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[450px] space-y-6 animate-pulse">
              <div className="w-16 h-16 bg-[#e9edc9] rounded-2xl flex items-center justify-center relative">
                <Sparkles className="w-8 h-8 text-[#5f6f52] animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800">Engineering Assessment Set</h3>
                <p className="text-xs text-[#5f6f52] font-semibold animate-bounce">
                  Applying cognitive scaffolding principles...
                </p>
              </div>

              {/* Pedagogy tip card while waiting */}
              <div className="max-w-md bg-[#fdfbf7] border border-[#e5e1da] p-5 rounded-2xl text-left shadow-xs transition duration-300">
                <p className="text-[10px] uppercase font-bold text-[#a9b388] tracking-widest flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" /> Assessment Design Tip
                </p>
                <p className="text-xs text-slate-600 leading-relaxed mt-2 italic">
                  "{cyclingTip}"
                </p>
              </div>
            </div>
          )}

          {/* Generated Result display */}
          {questions.length > 0 && !isGenerating && (
            <div className="space-y-6">
              {/* Header card */}
              <div className="bg-white border border-[#e5e1da] shadow-sm rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-[#e9edc9]/20 rounded-bl-full pointer-events-none"></div>
                
                <div className="space-y-2 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#5f6f52] px-2 py-0.5 rounded-md">
                      {curriculum === 'cbc' ? 'CBC Aligned' : 'Standard Exam'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {gradeLevel}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {subject === 'Other' ? customSubject : subject}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-slate-800">{assessmentTitle}</h3>
                  <p className="text-xs text-slate-500 italic leading-relaxed">{assessmentDesc}</p>
                </div>

                {/* Toolbar buttons */}
                <div className="flex flex-wrap gap-2 pt-5 border-t border-[#e5e1da] mt-5">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-[#e5e1da] bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer select-none"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#5f6f52]" />
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown'}</span>
                  </button>

                  <button
                    onClick={handlePrintAssessment}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-[#e5e1da] bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer select-none"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#5f6f52]" />
                    <span>Print Question Sheet</span>
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-[#e5e1da] bg-[#5f6f52] text-white text-xs font-bold hover:bg-[#4d5b43] transition cursor-pointer select-none shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Download as PDF</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-amber-200 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer select-none shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Export CSV ({selectedQuestions.length} Items)</span>
                  </button>

                  <button
                    onClick={() => {
                      const nextVal = !showAnswerKey;
                      setShowAnswerKey(nextVal);
                      setIncludeAnswerKey(nextVal);
                    }}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer select-none ${
                      showAnswerKey
                        ? 'bg-[#5f6f52]/15 border-[#5f6f52] text-[#5f6f52]'
                        : 'border-[#e5e1da] bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{showAnswerKey ? 'Show Answers: ON' : 'Show Answers: OFF'}</span>
                  </button>

                  <button
                    onClick={saveAllToBank}
                    disabled={saveAllStatus === 'saving' || saveAllStatus === 'saved'}
                    className={`ml-auto flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
                      saveAllStatus === 'saved'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-[#5f6f52] hover:bg-[#5f6f52]/90 text-white shadow-xs'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {saveAllStatus === 'saving' && 'Saving all...'}
                      {saveAllStatus === 'saved' && 'Saved All to Bank!'}
                      {saveAllStatus === 'error' && 'Failed to Save All'}
                      {saveAllStatus === 'idle' && 'Save All to Question Bank'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 gap-1.5 no-print mb-4">
                <button
                  type="button"
                  onClick={() => setActiveViewTab('sheet')}
                  className={`px-5 py-2.5 text-xs font-black tracking-wider uppercase rounded-t-xl transition-all border-t border-x ${
                    activeViewTab === 'sheet'
                      ? 'bg-white border-slate-200 text-[#5f6f52] shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  📄 Assessment Question Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewTab('diagnostics')}
                  className={`px-5 py-2.5 text-xs font-black tracking-wider uppercase rounded-t-xl transition-all border-t border-x ${
                    activeViewTab === 'diagnostics'
                      ? 'bg-white border-slate-200 text-indigo-700 shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-indigo-650 hover:bg-slate-50'
                  }`}
                >
                  ⚡ Class Diagnostic & Struggles Analysis
                </button>
              </div>

              {activeViewTab === 'sheet' ? (
                /* Questions List */
                <div className="space-y-4">
                  {/* Select All / Gradebook CSV info bar */}
                  <div className="flex items-center justify-between bg-[#fcfbf9] border border-[#e5e1da] rounded-xl px-4 py-3 text-xs text-slate-600 font-bold no-print">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = questions.length === selectedQuestions.length;
                          if (allSelected) {
                            setSelectedQuestions([]);
                          } else {
                            setSelectedQuestions(questions.map((_, idx) => idx));
                          }
                        }}
                        className="text-[#5f6f52] hover:underline hover:text-[#4d5c41] flex items-center gap-1 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={questions.length > 0 && questions.length === selectedQuestions.length}
                          onChange={() => {}} // Handled by button onClick
                          className="rounded text-[#5f6f52] focus:ring-[#5f6f52] w-3.5 h-3.5 cursor-pointer pointer-events-none mr-1"
                        />
                        <span>{questions.length === selectedQuestions.length ? 'Deselect All' : 'Select All Questions'}</span>
                      </button>
                      <span className="text-slate-300 mx-1">|</span>
                      <span>{selectedQuestions.length} of {questions.length} items checked for CSV export</span>
                    </div>
                    <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200/55 px-2 py-0.5 rounded-full font-semibold uppercase">Gradebook Ready</span>
                  </div>

                  {questions.map((q, idx) => {
                    const isExpanded = expandedIndex === idx;
                    const isEditing = editingIndex === idx;
                    const itemSaveStatus = saveStatus[idx] || 'idle';

                    return (
                      <div 
                        key={idx}
                        className={`bg-white border rounded-2xl transition-all shadow-xs ${
                          isExpanded ? 'border-[#5f6f52]/40' : 'border-[#e5e1da]'
                        }`}
                      >
                        {/* Accordion Header */}
                        <div 
                          onClick={() => !isEditing && setExpandedIndex(isExpanded ? null : idx)}
                          className={`p-4 flex items-center justify-between cursor-pointer select-none ${
                            isExpanded ? 'border-b border-slate-100' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 pr-4">
                            {/* Individual question checkbox for CSV export selection */}
                            <div onClick={(e) => e.stopPropagation()} className="no-print">
                              <input
                                type="checkbox"
                                checked={selectedQuestions.includes(idx)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedQuestions(prev => [...prev, idx]);
                                  } else {
                                    setSelectedQuestions(prev => prev.filter(i => i !== idx));
                                  }
                                }}
                                className="rounded text-[#5f6f52] focus:ring-[#5f6f52] w-4 h-4 cursor-pointer"
                                title="Toggle selection for CSV gradebook export"
                              />
                            </div>

                            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-extrabold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#a9b388] bg-[#fcfbf9] border border-slate-100 px-2 py-0.5 rounded-md shrink-0">
                            {q.type ? q.type.replace('-', ' ') : 'multiple choice'}
                          </span>
                          <p className="text-sm font-bold text-slate-800 line-clamp-1">
                            {q.questionText}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {expandedIndex === idx ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Accordion Body */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="p-5 space-y-4 text-slate-800">
                              {/* EDITING STATE */}
                              {isEditing ? (
                                <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-150">
                                  <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600">Question Text</label>
                                    <textarea
                                      value={editQuestionText}
                                      onChange={(e) => setEditQuestionText(e.target.value)}
                                      className="w-full bg-white border border-slate-250 rounded-xl p-2 text-sm focus:outline-none focus:border-[#5f6f52]"
                                      rows={2}
                                    />
                                  </div>

                                  {/* Choices list for MCQs / True-False */}
                                  {(q.type === 'multiple-choice' || q.type === 'true-false') && (
                                    <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-600">Options</label>
                                      {editOptions.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-2">
                                          <span className="text-xs font-extrabold text-slate-400 w-5">
                                            {String.fromCharCode(65 + oIdx)}.
                                          </span>
                                          <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                              const updated = [...editOptions];
                                              updated[oIdx] = e.target.value;
                                              setEditOptions(updated);
                                            }}
                                            className="flex-1 bg-white border border-slate-250 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#5f6f52]"
                                          />
                                        </div>
                                      ))}

                                      <div className="space-y-1 mt-2">
                                        <label className="text-xs font-bold text-slate-600">Correct Choice</label>
                                        <select
                                          value={editCorrectAnswerIndex}
                                          onChange={(e) => setEditCorrectAnswerIndex(parseInt(e.target.value))}
                                          className="bg-white border border-slate-250 rounded-lg p-1 text-xs text-slate-700"
                                        >
                                          {editOptions.map((_, oIdx) => (
                                            <option key={oIdx} value={oIdx}>
                                              {String.fromCharCode(65 + oIdx)}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  )}

                                  {/* Correct answer text for fill/short-answer */}
                                  {(q.type === 'fill-in-blanks' || q.type === 'short-answer') && (
                                    <div className="space-y-1">
                                      <label className="text-xs font-bold text-slate-600">Correct Answer</label>
                                      <input
                                        type="text"
                                        value={editCorrectAnswerText}
                                        onChange={(e) => setEditCorrectAnswerText(e.target.value)}
                                        className="w-full bg-white border border-slate-250 rounded-xl p-2 text-sm focus:outline-none focus:border-[#5f6f52]"
                                      />
                                    </div>
                                  )}

                                  {/* Explanation */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600">Pedagogical Explanation & Feedback Insights</label>
                                    <textarea
                                      value={editExplanation}
                                      onChange={(e) => setEditExplanation(e.target.value)}
                                      className="w-full bg-white border border-slate-250 rounded-xl p-2 text-sm focus:outline-none focus:border-[#5f6f52]"
                                      rows={2}
                                    />
                                  </div>

                                  <div className="flex gap-2 justify-end pt-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingIndex(null)}
                                      className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => saveEdit(idx)}
                                      className="px-3.5 py-1.5 bg-[#5f6f52] text-white rounded-lg text-xs font-bold hover:bg-[#5f6f52]/90 transition cursor-pointer"
                                    >
                                      Save Changes
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* VIEWING STATE */
                                <>
                                  {/* Question content */}
                                  <p className="text-sm font-bold text-slate-800 leading-relaxed">
                                    {q.questionText}
                                  </p>

                                  {/* Choices list for MCQs / True-False */}
                                  {(q.type === 'multiple-choice' || q.type === 'true-false') && q.options && q.options.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                      {q.options.map((opt, oIdx) => {
                                        const isCorrect = showAnswerKey && q.correctAnswerIndex === oIdx;
                                        return (
                                          <div 
                                            key={oIdx} 
                                            className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                                              isCorrect 
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                                : 'bg-slate-50/50 border-slate-100 text-slate-600'
                                            }`}
                                          >
                                            <span className={`w-5 h-5 rounded-md font-bold flex items-center justify-center shrink-0 text-[10px] ${
                                              isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                                            }`}>
                                              {String.fromCharCode(65 + oIdx)}
                                            </span>
                                            <span>{opt}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Correct Answer Guideline (Fill/Short Answer) */}
                                  {(q.type === 'fill-in-blanks' || q.type === 'short-answer') && showAnswerKey && (
                                    <div className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl text-xs">
                                      <span className="font-bold text-emerald-800 uppercase text-[9px] tracking-wider block mb-1">
                                        Correct response guideline
                                      </span>
                                      <p className="text-slate-800 font-semibold">{q.correctAnswer || 'Not defined.'}</p>
                                    </div>
                                  )}

                                  {/* Explanation banner */}
                                  {showAnswerKey && q.explanation && (
                                    <div className="p-3.5 bg-[#fdfbf7] border border-[#e5e1da] rounded-xl text-xs space-y-1">
                                      <span className="font-bold text-[#5f6f52] uppercase text-[9px] tracking-wider block">
                                        Pedagogical Feedback & Learning Insight
                                      </span>
                                      <p className="text-slate-600 leading-relaxed italic">
                                        {q.explanation}
                                      </p>
                                    </div>
                                  )}

                                  {/* Individual card actions */}
                                  <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
                                    <button
                                      type="button"
                                      onClick={() => startEditing(idx)}
                                      className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-slate-150 bg-white text-slate-500 hover:text-slate-700 text-[11px] font-bold transition cursor-pointer select-none"
                                    >
                                      <Edit className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => saveSingleToBank(idx)}
                                      disabled={itemSaveStatus === 'saved' || itemSaveStatus === 'saving'}
                                      className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg border text-[11px] font-bold transition cursor-pointer select-none ${
                                        itemSaveStatus === 'saved'
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                          : 'border-slate-150 bg-white text-slate-500 hover:text-[#5f6f52]'
                                      }`}
                                    >
                                      <Save className="w-3 h-3" />
                                      <span>
                                        {itemSaveStatus === 'saving' && 'Saving...'}
                                        {itemSaveStatus === 'saved' && 'Saved to Bank'}
                                        {itemSaveStatus === 'error' && 'Failed'}
                                        {itemSaveStatus === 'idle' && 'Save to Bank'}
                                      </span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
              ) : (
                <AssessmentDiagnosticView
                  assessmentTitle={assessmentTitle}
                  subject={subject === 'Other' ? customSubject : subject}
                  gradeLevel={gradeLevel}
                  questions={questions}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
