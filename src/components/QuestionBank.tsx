import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { QuestionBankItem, CurriculumType, QuizQuestion } from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Layers, 
  BookOpen, 
  Award,
  CheckCircle,
  Clock,
  Sparkles,
  GraduationCap,
  Grab,
  Database,
  Shuffle,
  Upload,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestionBankProps {
  onSelectQuestion?: (question: QuestionBankItem) => void;
  isCompact?: boolean; // For display inside sidebar/creator
}

const SEED_QUESTIONS = [
  {
    type: 'multiple-choice' as const,
    questionText: 'Which of the following processes in green plants is directly responsible for releasing oxygen into the atmosphere?',
    options: ['Respiration', 'Transpiration', 'Photosynthesis', 'Active transport'],
    correctAnswerIndex: 2,
    correctAnswer: 'Photosynthesis',
    explanation: 'Photosynthesis uses water, carbon dioxide, and sunlight to produce glucose and oxygen. Oxygen is released as a byproduct during the light-dependent reactions.',
    gradeLevel: 'Grade 6',
    subject: 'Science & Technology',
    topic: 'Plant Physiology',
    curriculum: 'cbc' as const
  },
  {
    type: 'true-false' as const,
    questionText: 'In the Competency Based Curriculum (CBC), formative assessment is primarily used to rank students from first to last position.',
    options: ['True', 'False'],
    correctAnswerIndex: 1,
    correctAnswer: 'False',
    explanation: 'Formative assessment in CBC is diagnostic and learning-oriented. Its purpose is to guide instruction and support individual learner progress, rather than competition or ranking.',
    gradeLevel: 'Junior School: Grade 7',
    subject: 'General Studies',
    topic: 'Educational Philosophy',
    curriculum: 'cbc' as const
  },
  {
    type: 'fill-in-blanks' as const,
    questionText: 'The process of changing a solid directly into a gas without passing through the liquid state is called ____________.',
    options: [],
    correctAnswerIndex: -1,
    correctAnswer: 'sublimation',
    explanation: 'Sublimation is the transition of a substance directly from the solid to the gas phase, such as dry ice or ammonium chloride upon heating.',
    gradeLevel: 'Junior School: Grade 8',
    subject: 'Integrated Science',
    topic: 'Matter and Energy',
    curriculum: 'cbc' as const
  },
  {
    type: 'short-answer' as const,
    questionText: 'Briefly explain why water is often referred to as the universal solvent in biology and chemistry.',
    options: [],
    correctAnswerIndex: -1,
    correctAnswer: 'Water is polar, which allows it to form hydrogen bonds and easily dissolve other polar substances and ionic compounds.',
    explanation: 'Due to its polar covalent structure (partial positive hydrogen, partial negative oxygen), water can surround and dissolve a wide range of ionic and polar solutes.',
    gradeLevel: 'Senior School: Grade 10',
    subject: 'Chemistry',
    topic: 'Solutions and Solubility',
    curriculum: 'standard' as const
  },
  {
    type: 'multiple-choice' as const,
    questionText: 'What is the sum of the interior angles of a regular hexagon?',
    options: ['360 degrees', '540 degrees', '720 degrees', '900 degrees'],
    correctAnswerIndex: 2,
    correctAnswer: '720 degrees',
    explanation: 'The formula for the sum of interior angles is (n - 2) * 180. For a hexagon, n = 6, so (6 - 2) * 180 = 4 * 180 = 720 degrees.',
    gradeLevel: 'Class 8',
    subject: 'Mathematics',
    topic: 'Geometry',
    curriculum: 'standard' as const
  }
];

export default function QuestionBank({ onSelectQuestion, isCompact = false }: QuestionBankProps) {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // New question form state
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newType, setNewType] = useState<'multiple-choice' | 'true-false' | 'fill-in-blanks' | 'short-answer'>('multiple-choice');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['Option A', 'Option B', 'Option C', 'Option D']);
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);
  const [newCorrectAnswer, setNewCorrectAnswer] = useState('');
  const [newExplanation, setNewExplanation] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState('Grade 6');
  const [newSubject, setNewSubject] = useState('Science & Technology');
  const [newTopic, setNewTopic] = useState('');
  const [newCurriculum, setNewCurriculum] = useState<CurriculumType>('cbc');

  // Print PDF & Selection state
  const [printSelectedIds, setPrintSelectedIds] = useState<string[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printSchoolName, setPrintSchoolName] = useState('Standard Curriculum School');
  const [printExamTitle, setPrintExamTitle] = useState('Classroom Assessment Test');
  const [printGrade, setPrintGrade] = useState('Grade 6');
  const [printTeacherName, setPrintTeacherName] = useState('');
  const [printShowAnswers, setPrintShowAnswers] = useState(true);
  const [printSpacing, setPrintSpacing] = useState<'compact' | 'standard' | 'spacious'>('standard');

  // Shuffle state
  const [isShuffled, setIsShuffled] = useState(false);

  // Bulk Import state
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Omit<QuestionBankItem, 'id' | 'userId' | 'createdAt'>[]>([]);

  // Shuffle handlers
  const handleShuffle = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setIsShuffled(true);
  };

  const handleResetOrder = () => {
    const sorted = [...questions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setQuestions(sorted);
    setIsShuffled(false);
  };

  // Real-time Parser for Bulk Import
  const parseBulkText = (text: string): Omit<QuestionBankItem, 'id' | 'userId' | 'createdAt'>[] => {
    if (!text.trim()) return [];

    // Try JSON parsing first
    try {
      const cleaned = text.trim();
      if (cleaned.startsWith('[') || cleaned.startsWith('{')) {
        const parsed = JSON.parse(cleaned);
        const array = Array.isArray(parsed) ? parsed : [parsed];
        return array.map((item: any) => {
          const type = ['multiple-choice', 'true-false', 'fill-in-blanks', 'short-answer'].includes(item.type) 
            ? item.type 
            : 'short-answer';
          return {
            type,
            questionText: item.questionText || item.question || 'Untitled Question',
            options: Array.isArray(item.options) ? item.options : [],
            correctAnswerIndex: typeof item.correctAnswerIndex === 'number' ? item.correctAnswerIndex : -1,
            correctAnswer: item.correctAnswer || '',
            explanation: item.explanation || item.feedback || '',
            gradeLevel: item.gradeLevel || newGradeLevel || 'Grade 6',
            subject: item.subject || newSubject || 'Science & Technology',
            topic: item.topic || newTopic || 'General',
            curriculum: item.curriculum || newCurriculum || 'cbc',
          };
        });
      }
    } catch (e) {
      // Not JSON, continue to text parsing
    }

    // Split blocks by double newlines
    const blocks = text.split(/\n\s*\n/);
    const result: Omit<QuestionBankItem, 'id' | 'userId' | 'createdAt'>[] = [];

    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      let questionText = '';
      const options: string[] = [];
      let correctAnswer = '';
      let correctAnswerIndex = -1;
      let explanation = '';
      let type: 'multiple-choice' | 'true-false' | 'fill-in-blanks' | 'short-answer' = 'short-answer';

      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        
        if (idx === 0) {
          questionText = line.replace(/^\d+[\s\.\)]+/, '');
          continue;
        }

        const optionMatch = line.match(/^([A-Da-d])[\s\.\)]+(.*)/);
        if (optionMatch) {
          options.push(optionMatch[2].trim());
          type = 'multiple-choice';
          continue;
        }

        const ansMatch = line.match(/^(?:Answer|Correct|Correct Answer|Ans)[\s\:\-]+(.*)/i);
        if (ansMatch) {
          correctAnswer = ansMatch[1].trim();
          continue;
        }

        const expMatch = line.match(/^(?:Explanation|Feedback|Reason|Exp)[\s\:\-]+(.*)/i);
        if (expMatch) {
          explanation = expMatch[1].trim();
          continue;
        }

        if (!questionText) {
          questionText = line;
        } else if (!line.startsWith('A)') && !line.startsWith('B)') && !line.startsWith('C)') && !line.startsWith('D)')) {
          if (idx === 1 && !line.match(/^(?:Answer|Correct|Explanation|Ans|Exp)/i)) {
            questionText += ' ' + line;
          } else {
            explanation += (explanation ? ' ' : '') + line;
          }
        }
      }

      if (options.length > 0) {
        type = 'multiple-choice';
        if (correctAnswer) {
          const letter = correctAnswer.toUpperCase().trim();
          if (['A', 'B', 'C', 'D'].includes(letter)) {
            correctAnswerIndex = letter.charCodeAt(0) - 65;
            correctAnswer = options[correctAnswerIndex] || correctAnswer;
          } else {
            const foundIdx = options.findIndex(opt => opt.toLowerCase() === correctAnswer.toLowerCase());
            if (foundIdx !== -1) {
               correctAnswerIndex = foundIdx;
            }
          }
        }
      } else {
        const lowerQ = questionText.toLowerCase();
        if (lowerQ.includes('true or false') || lowerQ.includes('(true/false)') || lowerQ.includes('true/false') || ['true', 'false'].includes(correctAnswer.toLowerCase())) {
          type = 'true-false';
          options.push('True', 'False');
          if (correctAnswer.toLowerCase().startsWith('t') || correctAnswer.toLowerCase() === 'true') {
            correctAnswerIndex = 0;
            correctAnswer = 'True';
          } else if (correctAnswer.toLowerCase().startsWith('f') || correctAnswer.toLowerCase() === 'false') {
            correctAnswerIndex = 1;
            correctAnswer = 'False';
          }
        } else if (questionText.includes('______') || lowerQ.includes('fill in the blank')) {
          type = 'fill-in-blanks';
        } else {
          type = 'short-answer';
        }
      }

      if (questionText) {
        result.push({
          type,
          questionText,
          options,
          correctAnswerIndex,
          correctAnswer,
          explanation,
          gradeLevel: newGradeLevel || 'Grade 6',
          subject: newSubject || 'Science & Technology',
          topic: newTopic || 'General',
          curriculum: newCurriculum || 'cbc',
        });
      }
    }

    return result;
  };

  // Debounced bulk text parser effect
  useEffect(() => {
    if (!bulkText) {
      setParsedPreview([]);
      return;
    }
    const timer = setTimeout(() => {
      const parsed = parseBulkText(bulkText);
      setParsedPreview(parsed);
    }, 400);
    return () => clearTimeout(timer);
  }, [bulkText]);

  // Save imported bulk questions to Firebase
  const handleCommitBulkImport = async () => {
    if (parsedPreview.length === 0) return;
    try {
      setLoading(true);
      const user = auth.currentUser;
      const importedList: QuestionBankItem[] = [];

      if (!user) {
        // Safe offline fallback
        const offlineImported = parsedPreview.map((q, idx) => ({
          id: `offline-import-${Date.now()}-${idx}`,
          userId: 'offline',
          createdAt: new Date().toISOString(),
          ...q
        })) as QuestionBankItem[];
        setQuestions(prev => [...offlineImported, ...prev]);
        setBulkText('');
        setParsedPreview([]);
        setIsBulkImportOpen(false);
        alert(`Successfully imported ${offlineImported.length} questions locally (Offline Mode).`);
        return;
      }

      const batch = writeBatch(db);
      parsedPreview.forEach((q) => {
        const newDocRef = doc(collection(db, 'questionBank'));
        const itemData = {
          ...q,
          userId: user.uid,
          createdAt: new Date().toISOString()
        };
        batch.set(newDocRef, itemData);
        importedList.push({ id: newDocRef.id, ...itemData } as QuestionBankItem);
      });

      await batch.commit();
      setQuestions(prev => [...importedList, ...prev]);
      setBulkText('');
      setParsedPreview([]);
      setIsBulkImportOpen(false);
      alert(`Successfully imported ${importedList.length} questions to your cloud Question Bank!`);
    } catch (err) {
      console.error('Error in bulk import commit:', err);
      alert('Failed to save imported questions. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  // Generate perfect standalone PDF/Quiz paper
  const handlePrintPDF = () => {
    const selectedQuestions = questions.filter(q => printSelectedIds.includes(q.id));
    if (selectedQuestions.length === 0) {
      alert('Please select at least one question to print.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to print or download the assessment PDF.');
      return;
    }

    const styleHtml = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #1e293b;
          line-height: 1.5;
          margin: 0;
          padding: 40px;
          background-color: #fff;
        }
        .header {
          border-bottom: 2px solid #0f172a;
          padding-bottom: 15px;
          margin-bottom: 30px;
          text-align: center;
        }
        .school-name {
          font-size: 20px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #0f172a;
          margin-bottom: 5px;
        }
        .exam-title {
          font-size: 16px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 15px;
        }
        .metadata-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          max-width: 600px;
          margin: 0 auto;
          text-align: left;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          background-color: #f8fafc;
          padding: 12px 20px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .student-line {
          border-bottom: 1px dotted #94a3b8;
          display: inline-block;
          width: 70%;
          height: 15px;
        }
        .quiz-container {
          margin-top: 30px;
        }
        .question-card {
          margin-bottom: ${printSpacing === 'compact' ? '15px' : printSpacing === 'spacious' ? '35px' : '24px'};
          page-break-inside: avoid;
        }
        .question-header {
          font-weight: 600;
          font-size: 14px;
          color: #0f172a;
          margin-bottom: 8px;
          display: flex;
          gap: 6px;
        }
        .options-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
          padding-left: 20px;
          margin-top: 8px;
        }
        @media (min-width: 600px) {
          .options-grid-2 {
            grid-template-columns: 1fr 1fr;
          }
        }
        .option-item {
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .option-checkbox {
          width: 14px;
          height: 14px;
          border: 1px solid #475569;
          border-radius: 50%;
          display: inline-block;
        }
        .write-area {
          margin-top: 10px;
          border-bottom: 1px dashed #cbd5e1;
          height: ${printSpacing === 'compact' ? '30px' : printSpacing === 'spacious' ? '80px' : '50px'};
          width: 100%;
        }
        .lines-area {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .line-item {
          border-bottom: 1px solid #e2e8f0;
          height: 12px;
          width: 100%;
        }
        .page-break {
          page-break-before: always;
        }
        .answer-key-title {
          font-size: 18px;
          font-weight: 700;
          border-bottom: 2px solid #5f6f52;
          padding-bottom: 8px;
          margin-bottom: 20px;
          color: #5f6f52;
        }
        .answer-item {
          margin-bottom: 15px;
          font-size: 13px;
        }
        .answer-num {
          font-weight: 700;
          color: #0f172a;
        }
        .answer-explanation {
          color: #475569;
          font-size: 12px;
          margin-top: 4px;
          font-style: italic;
        }
        .no-print-btn {
          background-color: #5f6f52;
          color: white;
          border: none;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 20px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .no-print-btn:hover {
          background-color: #4d5a42;
        }
        @media print {
          .no-print-btn {
            display: none;
          }
          body {
            padding: 0;
          }
        }
      </style>
    `;

    let questionsHtml = '';
    selectedQuestions.forEach((q, idx) => {
      let qContent = '';
      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        const isTrueFalse = q.type === 'true-false';
        const colsClass = isTrueFalse ? '' : 'options-grid-2';
        qContent = `
          <div class="options-list ${colsClass}">
            ${(q.options || []).map((opt, oIdx) => `
              <div class="option-item">
                <span class="option-checkbox"></span>
                <span><strong>${String.fromCharCode(65 + oIdx)})</strong> ${opt}</span>
              </div>
            `).join('')}
          </div>
        `;
      } else if (q.type === 'fill-in-blanks') {
        qContent = `<div class="write-area"></div>`;
      } else if (q.type === 'short-answer') {
        const numLines = printSpacing === 'compact' ? 2 : printSpacing === 'spacious' ? 5 : 3;
        qContent = `
          <div class="lines-area">
            ${Array.from({ length: numLines }).map(() => `<div class="line-item"></div>`).join('')}
          </div>
        `;
      }

      questionsHtml += `
        <div class="question-card">
          <div class="question-header">
            <span><strong>Q${idx + 1}.</strong></span>
            <span>${q.questionText}</span>
          </div>
          ${qContent}
        </div>
      `;
    });

    let answerKeyHtml = '';
    if (printShowAnswers) {
      answerKeyHtml = `
        <div class="page-break">
          <div class="answer-key-title">Official Answer Key & Teacher Reference</div>
          <div style="margin-top: 15px;">
            ${selectedQuestions.map((q, idx) => {
              let ansText = q.correctAnswer || '';
              if (q.type === 'multiple-choice' && typeof q.correctAnswerIndex === 'number' && q.options) {
                ansText = `${String.fromCharCode(65 + q.correctAnswerIndex)}: ${q.options[q.correctAnswerIndex] || ''}`;
              }
              return `
                <div class="answer-item">
                  <span class="answer-num">Question ${idx + 1}:</span>
                  <span><strong>${ansText}</strong></span>
                  ${q.explanation ? `<div class="answer-explanation"><strong>Explanation:</strong> ${q.explanation}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    const documentHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${printExamTitle}</title>
          ${styleHtml}
        </head>
        <body>
          <button class="no-print-btn" onclick="window.print()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print / Save as PDF
          </button>

          <div class="header">
            <div class="school-name">${printSchoolName}</div>
            <div class="exam-title">${printExamTitle}</div>
            
            <div class="metadata-grid">
              <div><strong>Student Name:</strong> <span class="student-line"></span></div>
              <div><strong>Date:</strong> <span class="student-line"></span></div>
              <div><strong>Grade/Class:</strong> <span>${printGrade}</span></div>
              ${printTeacherName ? `<div><strong>Teacher:</strong> <span>${printTeacherName}</span></div>` : `<div><strong>Score:</strong> <span class="student-line" style="width:40px;"></span> / ${selectedQuestions.length}</div>`}
            </div>
          </div>

          <div class="quiz-container">
            ${questionsHtml}
          </div>

          ${answerKeyHtml}

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(documentHtml);
    printWindow.document.close();
  };

  // Load questions
  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      const qBankRef = collection(db, 'questionBank');
      const qQuery = query(qBankRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(qQuery);
      
      let fetchedQuestions: QuestionBankItem[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedQuestions.push({ id: docSnap.id, ...docSnap.data() } as QuestionBankItem);
      });

      // If the bank is empty, seed it with high-quality questions so the user has immediate data
      if (fetchedQuestions.length === 0) {
        const batch = writeBatch(db);
        const seededList: QuestionBankItem[] = [];
        
        SEED_QUESTIONS.forEach((q) => {
          const newDocRef = doc(collection(db, 'questionBank'));
          const seedItem = {
            ...q,
            userId: user.uid,
            createdAt: new Date().toISOString()
          };
          batch.set(newDocRef, seedItem);
          seededList.push({ id: newDocRef.id, ...seedItem } as QuestionBankItem);
        });
        
        await batch.commit();
        setQuestions(seededList);
      } else {
        // Sort by createdAt descending
        fetchedQuestions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setQuestions(fetchedQuestions);
      }
    } catch (err) {
      console.error('Error loading question bank:', err);
      setError('Could not connect to the database. Showing offline sample questions.');
      // Mock some items for safe degradation
      setQuestions(SEED_QUESTIONS.map((q, idx) => ({
        id: `offline-${idx}`,
        userId: 'offline',
        createdAt: new Date().toISOString(),
        ...q
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  // Handle adding a new question manually
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const itemData: Omit<QuestionBankItem, 'id'> = {
        userId: user.uid,
        type: newType,
        questionText: newQuestionText,
        options: (newType === 'multiple-choice' || newType === 'true-false') ? newOptions : [],
        correctAnswerIndex: (newType === 'multiple-choice' || newType === 'true-false') ? newCorrectIndex : -1,
        correctAnswer: (newType === 'fill-in-blanks' || newType === 'short-answer') ? newCorrectAnswer : (newOptions[newCorrectIndex] || ''),
        explanation: newExplanation,
        gradeLevel: newGradeLevel,
        subject: newSubject,
        topic: newTopic || 'General',
        curriculum: newCurriculum,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'questionBank'), itemData);
      const createdItem: QuestionBankItem = {
        id: docRef.id,
        ...itemData
      };

      setQuestions(prev => [createdItem, ...prev]);
      
      // Reset form
      setNewQuestionText('');
      setNewExplanation('');
      setNewTopic('');
      setNewCorrectAnswer('');
      setNewCorrectIndex(0);
      setIsAddingQuestion(false);
    } catch (err) {
      console.error('Error adding question:', err);
      alert('Failed to save question to bank. Please check your network.');
    }
  };

  // Delete a question
  const handleDeleteQuestion = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this question from your bank?')) return;
    try {
      await deleteDoc(doc(db, 'questionBank', id));
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error('Error deleting question:', err);
      alert('Failed to delete question.');
    }
  };

  // Drag start handler
  const handleDragStart = (e: React.DragEvent, item: QuestionBankItem) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
    // Add custom class or state visual cues
    const ghost = document.createElement('div');
    ghost.className = 'p-3 bg-[#5f6f52] text-white rounded-lg text-xs font-bold font-sans shadow-lg pointer-events-none max-w-xs';
    ghost.innerText = `Dragging Question: "${item.questionText.slice(0, 40)}..."`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => {
      document.body.removeChild(ghost);
    }, 0);
  };

  // Get distinct values for filters
  const subjects = ['All', ...new Set(questions.map(q => q.subject))];
  const gradeLevels = ['All', ...new Set(questions.map(q => q.gradeLevel))];

  // Filtered list
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (q.topic && q.topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          q.explanation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || q.subject === selectedSubject;
    const matchesGrade = selectedGrade === 'All' || q.gradeLevel === selectedGrade;
    const matchesType = selectedType === 'All' || q.type === selectedType;
    return matchesSearch && matchesSubject && matchesGrade && matchesType;
  });

  return (
    <div id="question_bank_container" className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-white p-4 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#5f6f52]/10 rounded-lg text-[#5f6f52]">
            <Database className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-1.5">
              Personal Assessment Question Bank
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {questions.length} Items
              </span>
            </h4>
            <p className="text-xs text-slate-400">Select, search, and drag assessment questions directly into your worksheets or documents.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 ml-auto sm:ml-0">
          {/* Shuffle button */}
          <button
            type="button"
            onClick={isShuffled ? handleResetOrder : handleShuffle}
            title={isShuffled ? "Restore original chronological order" : "Shuffle order of questions in the bank"}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer ${
              isShuffled 
                ? 'bg-amber-100 border border-amber-300 text-amber-800 hover:bg-amber-200' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" /> 
            {isShuffled ? 'Reset Order' : 'Shuffle'}
          </button>

          {/* Bulk Import button */}
          <button
            type="button"
            onClick={() => setIsBulkImportOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> Bulk Import
          </button>

          {/* Manual Add button */}
          <button
            type="button"
            onClick={() => setIsAddingQuestion(!isAddingQuestion)}
            className="bg-[#5f6f52] hover:bg-[#4d5a42] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Custom Question
          </button>
        </div>
      </div>

      {/* Manual Add Form Drawer */}
      <AnimatePresence>
        {isAddingQuestion && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleCreateQuestion}
            className="bg-white border-b border-slate-200 overflow-hidden text-left"
          >
            <div className="p-4 space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar">
              <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#5f6f52]" /> Create New Assessment Item
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Curriculum */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Curriculum</label>
                  <select
                    value={newCurriculum}
                    onChange={(e) => setNewCurriculum(e.target.value as CurriculumType)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#5f6f52]"
                  >
                    <option value="cbc">CBC (Kenya)</option>
                    <option value="standard">Standard Syllabus</option>
                  </select>
                </div>

                {/* Grade Level */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Grade / Class Level</label>
                  <input
                    type="text"
                    value={newGradeLevel}
                    onChange={(e) => setNewGradeLevel(e.target.value)}
                    placeholder="e.g. Grade 6, Form 1"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#5f6f52]"
                    required
                  />
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Subject Area</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. Science & Technology"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#5f6f52]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Topic */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Topic / Strand (Optional)</label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Photosynthesis"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#5f6f52]"
                  />
                </div>

                {/* Question Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Question Type</label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      const selected = e.target.value as any;
                      setNewType(selected);
                      if (selected === 'true-false') {
                        setNewOptions(['True', 'False']);
                        setNewCorrectIndex(0);
                      } else if (selected === 'multiple-choice') {
                        setNewOptions(['Option A', 'Option B', 'Option C', 'Option D']);
                        setNewCorrectIndex(0);
                      } else {
                        setNewOptions([]);
                        setNewCorrectIndex(-1);
                      }
                    }}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#5f6f52]"
                  >
                    <option value="multiple-choice">Multiple Choice (MCQ)</option>
                    <option value="true-false">True / False</option>
                    <option value="fill-in-blanks">Fill in the Blanks</option>
                    <option value="short-answer">Short Written Response</option>
                  </select>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Question Text / Prompt</label>
                <textarea
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Enter the main question text..."
                  className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#5f6f52] min-h-[50px] bg-slate-50"
                  required
                />
              </div>

              {/* MCQ Options Config */}
              {(newType === 'multiple-choice' || newType === 'true-false') && (
                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Configure Distractors</label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">Correct Answer Index:</span>
                      <select
                        value={newCorrectIndex}
                        onChange={(e) => setNewCorrectIndex(parseInt(e.target.value))}
                        className="text-[10px] font-bold text-[#5f6f52] border border-slate-200 bg-white p-1 rounded"
                      >
                        {newOptions.map((_, oIdx) => (
                          <option key={oIdx} value={oIdx}>Option {String.fromCharCode(65 + oIdx)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {newOptions.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                          newCorrectIndex === oIdx ? 'bg-emerald-500 text-white font-black animate-pulse' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newOptions];
                            updated[oIdx] = e.target.value;
                            setNewOptions(updated);
                          }}
                          className="w-full text-xs font-medium text-slate-800 bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 pb-0.5"
                          placeholder={`Enter Option ${String.fromCharCode(65 + oIdx)}`}
                          disabled={newType === 'true-false'}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Written correct answers */}
              {(newType === 'fill-in-blanks' || newType === 'short-answer') && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Correct / Exemplar Written Answer</label>
                  <input
                    type="text"
                    value={newCorrectAnswer}
                    onChange={(e) => setNewCorrectAnswer(e.target.value)}
                    placeholder={newType === 'fill-in-blanks' ? "e.g. sublimation" : "Explain core concepts or phrases required in the answer..."}
                    className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#5f6f52] bg-slate-50"
                    required
                  />
                </div>
              )}

              {/* Remedial Feedback */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Remedial/Explanatory Feedback</label>
                <textarea
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  placeholder="Explain why this answer is correct..."
                  className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#5f6f52] min-h-[40px] bg-slate-50"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingQuestion(false)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Save to Question Bank
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Search & Filter Controls */}
      <div className="p-3 bg-white border-b border-slate-150 grid grid-cols-1 sm:grid-cols-4 gap-2 text-left">
        {/* Search */}
        <div className="relative sm:col-span-1">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bank..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-[#5f6f52] transition"
          />
        </div>

        {/* Subject filter */}
        <div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none text-slate-600"
          >
            <option value="All">All Subjects ({subjects.length - 1})</option>
            {subjects.filter(s => s !== 'All').map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        {/* Grade level filter */}
        <div>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none text-slate-600"
          >
            <option value="All">All Grades ({gradeLevels.length - 1})</option>
            {gradeLevels.filter(g => g !== 'All').map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Question Type filter */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none text-slate-600"
          >
            <option value="All">All Formats</option>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True/False</option>
            <option value="fill-in-blanks">Fill in Blanks</option>
            <option value="short-answer">Short Answer</option>
          </select>
        </div>
      </div>

      {/* Selected Action Bar */}
      {printSelectedIds.length > 0 && (
        <div className="bg-emerald-50 border-b border-emerald-100 p-3 flex flex-wrap items-center justify-between gap-2.5 text-left animate-fadeIn">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-sm">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800">
                {printSelectedIds.length} Question{printSelectedIds.length > 1 ? 's' : ''} Selected
              </span>
              <span className="block text-[10px] text-slate-500 font-medium">Ready to print as a standalone quiz paper.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPrintSelectedIds([])}
              className="px-2.5 py-1.5 hover:bg-slate-200/50 rounded-lg text-[10px] font-bold text-slate-500 transition cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={() => {
                if (questions.length > 0) {
                  const firstQ = questions.find(q => printSelectedIds.includes(q.id));
                  if (firstQ) {
                    setPrintGrade(firstQ.gradeLevel);
                    setPrintExamTitle(`${firstQ.subject} Quiz - ${firstQ.topic || 'Assessment'}`);
                  }
                }
                setIsPrintModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-[10.5px] font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Create PDF Quiz Paper
            </button>
          </div>
        </div>
      )}

      {/* Main Questions Grid */}
      <div className="flex-1 p-3 overflow-y-auto max-h-[600px] custom-scrollbar">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Clock className="w-8 h-8 animate-spin text-[#5f6f52]" />
            <p className="text-xs font-bold">Synchronizing with Cloud Question Bank...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
            <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold">No matching questions found.</p>
            <p className="text-[10px] text-slate-400 mt-1">Try relaxing filters or search terms.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
              <span>Showing {filteredQuestions.length} of {questions.length} questions</span>
              <button
                type="button"
                onClick={() => {
                  const filteredIds = filteredQuestions.map(q => q.id);
                  const allSelected = filteredIds.every(id => printSelectedIds.includes(id));
                  if (allSelected) {
                    setPrintSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
                  } else {
                    setPrintSelectedIds(prev => [...new Set([...prev, ...filteredIds])]);
                  }
                }}
                className="text-[#5f6f52] hover:underline font-bold"
              >
                {filteredQuestions.every(q => printSelectedIds.includes(q.id)) ? 'Deselect All Filtered' : 'Select All Filtered'}
              </button>
            </div>

            <div className={`grid grid-cols-1 ${isCompact ? 'gap-3' : 'md:grid-cols-2 gap-4'}`}>
              {filteredQuestions.map((item) => {
                const isSelected = printSelectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={`border hover:border-[#5f6f52]/40 rounded-xl p-4 text-left transition relative group shadow-2xs hover:shadow-xs flex flex-col justify-between cursor-grab active:cursor-grabbing select-none ${
                      isSelected ? 'border-emerald-500 bg-emerald-500/[0.02]' : 'border-slate-200 bg-white'
                    }`}
                  >
                    {/* Meta Tag bar */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                      {/* Checkbox for PDF selection */}
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setPrintSelectedIds(prev => prev.filter(id => id !== item.id));
                          } else {
                            setPrintSelectedIds(prev => [...prev, item.id]);
                          }
                        }}
                        className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer mr-1"
                        onClick={(e) => e.stopPropagation()}
                        title="Select for PDF quiz generation"
                      />

                      <span className="text-[9px] font-bold bg-[#5f6f52]/10 text-[#5f6f52] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {item.type.replace('-', ' ')}
                      </span>
                  <span className="text-[9px] font-bold bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <GraduationCap className="w-2.5 h-2.5 text-amber-600" /> {item.gradeLevel}
                  </span>
                  <span className="text-[9px] font-bold bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1 max-w-[120px] truncate">
                    <Layers className="w-2.5 h-2.5 text-blue-500" /> {item.subject}
                  </span>
                  {item.topic && (
                    <span className="text-[9px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full italic max-w-[100px] truncate">
                      Strand: {item.topic}
                    </span>
                  )}
                  
                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteQuestion(item.id, e)}
                    className="absolute top-3.5 right-3.5 text-slate-300 hover:text-red-500 p-1 rounded-md hover:bg-slate-50 transition cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Remove question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Question text */}
                <div className="flex-1 space-y-2 mb-3 pr-4">
                  <p className="font-semibold text-xs text-slate-800 leading-normal">
                    {item.questionText}
                  </p>

                  {/* Render compact answers/options indicator */}
                  {(item.type === 'multiple-choice' || item.type === 'true-false') && item.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] pl-1 pt-1">
                      {item.options.map((opt, oIdx) => {
                        const isCorrect = item.correctAnswerIndex === oIdx;
                        return (
                          <div 
                            key={oIdx} 
                            className={`flex items-center gap-1.5 px-2 py-1 rounded border ${
                              isCorrect 
                                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 font-bold' 
                                : 'bg-slate-50/30 border-slate-100 text-slate-500'
                            }`}
                          >
                            <span className="font-bold opacity-60">{String.fromCharCode(65 + oIdx)}.</span>
                            <span className="truncate">{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Written Answers Indicator */}
                  {(item.type === 'fill-in-blanks' || item.type === 'short-answer') && (
                    <div className="p-2 bg-emerald-50/30 border border-emerald-100 rounded-lg text-[10px] text-emerald-900 flex items-start gap-1">
                      <span className="font-bold text-emerald-800 whitespace-nowrap">Expected Answer:</span>
                      <span className="truncate italic font-medium">"{item.correctAnswer}"</span>
                    </div>
                  )}
                </div>

                {/* Footer bar */}
                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 text-teal-600 font-bold">
                    <Grab className="w-3 h-3 text-teal-500" /> Hold & Drag to drop
                  </div>

                  {onSelectQuestion && (
                    <button
                      type="button"
                      onClick={() => onSelectQuestion(item)}
                      className="text-[#5f6f52] hover:text-[#4d5a42] font-black transition px-2 py-1 rounded hover:bg-[#5f6f52]/5 cursor-pointer text-[10px]"
                    >
                      Insert Direct +
                    </button>
                  )}
                </div>
              </div>
            );
            })}
          </div>
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#5f6f52] p-4 text-white flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-200" />
                <h3 className="font-serif font-bold text-base">Bulk Assessment Question Import</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsBulkImportOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-left custom-scrollbar">
              <div className="p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl text-xs text-amber-900 leading-relaxed">
                <span className="font-bold block mb-1">💡 Instructions for Text Copy-Paste:</span>
                Paste multiple questions below. Separate individual questions with a <strong>blank line</strong>. 
                For Multiple Choice, label choices with <strong>A), B), C), D)</strong> on separate lines. 
                Define answers with <strong>Answer: B</strong> and feedback with <strong>Explanation: your feedback</strong>.
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Default Grade</label>
                  <input
                    type="text"
                    value={newGradeLevel}
                    onChange={(e) => setNewGradeLevel(e.target.value)}
                    className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium focus:outline-none focus:border-[#5f6f52]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Default Subject</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium focus:outline-none focus:border-[#5f6f52]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Paste Questions Text or JSON</label>
                  <button 
                    type="button"
                    onClick={() => {
                      setBulkText(`1. Which of the following processes in green plants is directly responsible for releasing oxygen into the atmosphere?\nA) Respiration\nB) Transpiration\nC) Photosynthesis\nD) Active transport\nAnswer: C\nExplanation: Photosynthesis uses water, carbon dioxide, and sunlight to produce glucose and oxygen.\n\n2. The sum of the interior angles of a regular hexagon is 720 degrees. (True/False)\nAnswer: True\nExplanation: Using (n-2)*180 for n=6 gives 4*180 = 720.`);
                    }}
                    className="text-[10px] font-bold text-[#5f6f52] hover:underline"
                  >
                    Load Sample Format
                  </button>
                </div>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Paste text here..."
                  className="w-full h-44 text-xs font-mono border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-[#5f6f52] bg-slate-50"
                />
              </div>

              {/* Real-time Parsed Preview */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> 
                    Real-time Parsed Preview ({parsedPreview.length} questions detected)
                  </h4>
                  <div className="border border-slate-200 rounded-xl max-h-[160px] overflow-y-auto p-3 bg-slate-50/50 space-y-3 custom-scrollbar">
                    {parsedPreview.map((pq, pIdx) => (
                      <div key={pIdx} className="text-xs border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-bold bg-[#5f6f52]/10 text-[#5f6f52] px-1.5 py-0.2 rounded uppercase">
                            {pq.type}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">Question {pIdx + 1}</span>
                        </div>
                        <p className="font-semibold text-slate-800">{pq.questionText}</p>
                        {pq.options && pq.options.length > 0 && (
                          <div className="grid grid-cols-2 gap-1 mt-1 pl-2">
                            {pq.options.map((o, oIdx) => (
                              <div 
                                key={oIdx} 
                                className={`text-[10px] p-1 rounded border ${
                                  pq.correctAnswerIndex === oIdx 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' 
                                    : 'bg-white border-slate-100 text-slate-500'
                                }`}
                              >
                                {String.fromCharCode(65 + oIdx)}) {o}
                              </div>
                            ))}
                          </div>
                        )}
                        {pq.correctAnswer && pq.options.length === 0 && (
                          <p className="text-[10px] text-emerald-800 mt-1">Expected: <span className="font-bold">"{pq.correctAnswer}"</span></p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsBulkImportOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={parsedPreview.length === 0}
                onClick={handleCommitBulkImport}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer ${
                  parsedPreview.length > 0 ? 'bg-[#5f6f52] hover:bg-[#4d5a42]' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Import {parsedPreview.length} Questions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Print Config Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="bg-[#5f6f52] p-4 text-white flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-200" />
                <h3 className="font-serif font-bold text-base">Quiz PDF Creator & Print Layout</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">School / Institution Name</label>
                <input
                  type="text"
                  value={printSchoolName}
                  onChange={(e) => setPrintSchoolName(e.target.value)}
                  placeholder="e.g. Springfield Secondary"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-[#5f6f52]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Assessment / Exam Title</label>
                <input
                  type="text"
                  value={printExamTitle}
                  onChange={(e) => setPrintExamTitle(e.target.value)}
                  placeholder="e.g. Science Monthly Quiz"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-[#5f6f52]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Grade / Class Level</label>
                  <input
                    type="text"
                    value={printGrade}
                    onChange={(e) => setPrintGrade(e.target.value)}
                    placeholder="e.g. Grade 6"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-[#5f6f52]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Teacher (Optional)</label>
                  <input
                    type="text"
                    value={printTeacherName}
                    onChange={(e) => setPrintTeacherName(e.target.value)}
                    placeholder="e.g. Mr. Kiprop"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-[#5f6f52]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Answer Sheet spacing</label>
                  <select
                    value={printSpacing}
                    onChange={(e) => setPrintSpacing(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none text-slate-600"
                  >
                    <option value="compact">Compact (Dense)</option>
                    <option value="standard">Standard (Balanced)</option>
                    <option value="spacious">Spacious (Ample lines)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="include-answers-print"
                    checked={printShowAnswers}
                    onChange={(e) => setPrintShowAnswers(e.target.checked)}
                    className="w-4 h-4 text-[#5f6f52] focus:ring-[#5f6f52] border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="include-answers-print" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    Include Teacher Key
                  </label>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-xs font-bold text-slate-600 block mb-0.5">Ready to Generate PDF Document</span>
                <span className="text-[10px] text-slate-400">Includes <strong>{printSelectedIds.length}</strong> selected assessment questions.</span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPrintModalOpen(false);
                  handlePrintPDF();
                }}
                className="px-5 py-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Download PDF / Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
