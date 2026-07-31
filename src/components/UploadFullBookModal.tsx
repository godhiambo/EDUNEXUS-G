import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpenBook, OpenBookChapter } from '../data/openBooksData';
import { db, cleanUndefined, compressObject } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { SavedDocument } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Upload,
  BookOpen,
  FileText,
  CheckCircle2,
  Sparkles,
  Layers,
  Bot,
  Globe,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Book,
  FileUp,
  Tag
} from 'lucide-react';

interface UploadFullBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAdded: (newBook: OpenBook) => void;
}

export default function UploadFullBookModal({
  isOpen,
  onClose,
  onBookAdded
}: UploadFullBookModalProps) {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState<OpenBook['category']>('STEM & Textbooks');
  const [subject, setSubject] = useState('General Education');
  const [gradeLevel, setGradeLevel] = useState('Secondary & University');
  const [summary, setSummary] = useState('');
  const [license, setLicense] = useState('Open Educational Resource (OER)');
  const [language, setLanguage] = useState('English');
  const [coverEmoji, setCoverEmoji] = useState('📚');
  const [coverBg, setCoverBg] = useState('from-[#5f6f52] via-emerald-700 to-teal-800');

  // Chapters list state
  const [chapters, setChapters] = useState<OpenBookChapter[]>([]);
  const [pastedFullText, setPastedFullText] = useState('');
  
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Function to split long text into structured chapters
  const parseTextIntoChapters = (rawText: string, defaultTitle: string = ''): OpenBookChapter[] => {
    const cleaned = rawText.replace(/\r\n/g, '\n').trim();
    if (!cleaned) return [];

    // Check for explicit Chapter / Part headers
    const chapterRegex = /(?:\n\s*|^)(?:Chapter|CHAPTER|Unit|UNIT|Section|SECTION|Part|PART)\s+(?:[0-[#9]+|[IVXLCDM]+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten).*?(?=\n|$)/gi;
    const matches = Array.from(cleaned.matchAll(chapterRegex));

    if (matches.length > 1) {
      const parsed: OpenBookChapter[] = [];
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const chapterTitle = match[0].trim().replace(/^#+\s*/, '');
        const startIndex = match.index! + match[0].length;
        const endIndex = i < matches.length - 1 ? matches[i + 1].index! : cleaned.length;
        const chapterContent = cleaned.substring(startIndex, endIndex).trim();

        if (chapterContent.length > 20) {
          parsed.push({
            title: chapterTitle,
            content: chapterContent
          });
        }
      }
      if (parsed.length > 0) return parsed;
    }

    // Fallback: Split by double empty lines or word chunks (~1,500 words per chapter)
    const paragraphs = cleaned.split(/\n\s*\n/);
    if (paragraphs.length >= 3) {
      const chunks: OpenBookChapter[] = [];
      let currentChunkText = '';
      let chunkIdx = 1;

      for (let p of paragraphs) {
        currentChunkText += p + '\n\n';
        // ~6,000 characters per chapter (~1,000 words)
        if (currentChunkText.length > 5000) {
          chunks.push({
            title: `Chapter ${chunkIdx}: Section ${chunkIdx}`,
            content: currentChunkText.trim()
          });
          currentChunkText = '';
          chunkIdx++;
        }
      }
      if (currentChunkText.trim()) {
        chunks.push({
          title: `Chapter ${chunkIdx}: Final Section`,
          content: currentChunkText.trim()
        });
      }
      return chunks;
    }

    // Single chapter fallback
    return [
      {
        title: defaultTitle || 'Full Book Content',
        content: cleaned
      }
    ];
  };

  // Handle file drop/upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setErrorMessage(null);
    setStatusMessage(`Parsing book file: ${file.name}...`);

    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    if (!title) setTitle(fileNameWithoutExt);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string || '';
        
        // Strip XML/HTML tags if docx raw or html
        let textToUse = fileContent;
        if (file.type.includes('xml') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
          textToUse = fileContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        }

        const parsedChapters = parseTextIntoChapters(textToUse, fileNameWithoutExt);
        setChapters(parsedChapters);

        // Auto generate summary from first 300 characters
        const firstWords = textToUse.substring(0, 400).replace(/[\n\r]+/g, ' ').trim();
        setSummary(`Full book text loaded (${parsedChapters.length} chapters, ~${Math.ceil(textToUse.length / 2500)} pages). Preview: "${firstWords}..."`);
        setStatusMessage(`Successfully loaded ${parsedChapters.length} chapters from ${file.name}!`);
      } catch (err: any) {
        setErrorMessage('Failed to read book file: ' + err.message);
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Error reading file from disk.');
      setIsProcessingFile(false);
    };

    if (file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Process manual text paste into chapters
  const handleProcessPastedText = () => {
    if (!pastedFullText.trim()) return;
    const parsed = parseTextIntoChapters(pastedFullText, title || 'Full Book Content');
    setChapters(parsed);
    if (!summary) {
      setSummary(`Custom book loaded with ${parsed.length} chapter(s). Total characters: ${pastedFullText.length}.`);
    }
    setStatusMessage(`Processed ${parsed.length} chapter(s) from pasted text!`);
  };

  // Save Book to Global Resources & AI Knowledge Base
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a book title.');
      return;
    }

    let bookChapters = chapters;
    if (bookChapters.length === 0 && pastedFullText.trim()) {
      bookChapters = parseTextIntoChapters(pastedFullText, title);
    }

    if (bookChapters.length === 0) {
      setErrorMessage('Please upload a book file or paste book text/chapters before saving.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const bookId = `custom-book-${Date.now()}`;
    const pageEst = Math.max(10, Math.ceil(bookChapters.reduce((acc, c) => acc + c.content.length, 0) / 2000));

    const newBook: OpenBook = {
      id: bookId,
      title: title.trim(),
      author: author.trim() || profile?.displayName || 'Open Educational Contributor',
      category: category,
      subject: subject.trim() || 'General Studies',
      gradeLevel: gradeLevel,
      coverBg: coverBg,
      coverEmoji: coverEmoji,
      summary: summary.trim() || `Full open textbook featuring ${bookChapters.length} chapter(s). Fully indexed for EduNexus AI Tutor.`,
      language: language,
      pageCount: pageEst,
      downloadFormats: ['EPUB', 'PDF', 'Plain Text'],
      license: license,
      externalUrl: '#',
      chapters: bookChapters
    };

    try {
      // 1. Save to Firestore `global_books` collection
      await setDoc(doc(db, 'global_books', bookId), cleanUndefined(compressObject(newBook)));

      // 2. Save to Firestore `documents` collection as AI Accessible document
      const docId = `doc-book-${bookId}`;
      const chapterPreviews = bookChapters
        .map((c) => `### ${c.title}\n\n${c.content}`)
        .join('\n\n---\n\n');

      const markdownContent = `# 📖 ${newBook.title}
* **Author:** ${newBook.author}
* **Category:** ${newBook.category}
* **Subject:** ${newBook.subject}
* **Grade / Target Level:** ${newBook.gradeLevel}
* **License:** ${newBook.license}
* **AI Access Status:** ⚡ Full Book Text Indexed in Global Knowledge Base

---

### 📝 Book Summary & Abstract
${newBook.summary}

---

## 📚 Complete Book Chapters
${chapterPreviews}

---
*Loaded & Indexed in EduNexus Global Resources for AI Tutor & Learning Platform.*`;

      const newSavedDoc: SavedDocument = {
        id: docId,
        title: `📚 Book: ${newBook.title}`,
        docType: 'lesson-notes',
        curriculum: 'standard',
        subject: newBook.subject.includes('Math') || newBook.subject.includes('STEM') ? 'STEM' : 'English',
        classLevel: newBook.gradeLevel,
        topic: newBook.title,
        subTopic: newBook.category,
        duration: `${newBook.pageCount} pages`,
        content: markdownContent,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        tags: ['Open Book', 'Full Book', 'Global Resource', 'AI Accessible', newBook.category]
      };

      await setDoc(doc(db, 'documents', docId), cleanUndefined(compressObject(newSavedDoc)));

      // 3. Save to Local Storage for instant offline backup
      try {
        const existingCustom: OpenBook[] = JSON.parse(localStorage.getItem('edunexus_custom_global_books') || '[]');
        localStorage.setItem('edunexus_custom_global_books', JSON.stringify([newBook, ...existingCustom]));
      } catch (e) {
        console.warn('LocalStorage save notice:', e);
      }

      onBookAdded(newBook);
      onClose();
    } catch (err: any) {
      console.error('Error saving full book to global resources:', err);
      setErrorMessage('Failed to save book to Firestore: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 my-auto"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#5f6f52] to-[#4d5a42] p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                Load Full Book for AI Access
                <span className="text-[10px] bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  AI Indexed
                </span>
              </h2>
              <p className="text-xs text-[#e5e1da]">
                Upload complete textbooks, literature, or reference books to Global Resources & AI Knowledge Base.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveBook} className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Section 1: File Upload Box */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileUp className="w-4 h-4 text-[#5f6f52]" />
              1. Upload Book File (.txt, .pdf, .docx, .epub, .md, .json)
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#5f6f52]/40 bg-[#fdfbf7] hover:bg-[#f5f0e6] hover:border-[#5f6f52] transition p-6 rounded-2xl text-center cursor-pointer space-y-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.docx,.doc,.epub,.md,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-[#5f6f52]/10 text-[#5f6f52] flex items-center justify-center mx-auto group-hover:scale-110 transition">
                {isProcessingFile ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#5f6f52]" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Click to select or drag & drop full book file here
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Supports Plain Text (.txt), Word (.docx), PDF (.pdf), EPUB (.epub), Markdown (.md)
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Book Metadata */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#5f6f52]" />
              2. Book Information & Metadata
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced High School Physics & Mechanics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5f6f52]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Author / Publisher</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Robert Millikan / OpenStax"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5f6f52]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5f6f52] bg-white"
                >
                  <option value="STEM & Textbooks">STEM & Textbooks</option>
                  <option value="Literature & Classics">Literature & Classics</option>
                  <option value="History & Social Sciences">History & Social Sciences</option>
                  <option value="Philosophy & Thought">Philosophy & Thought</option>
                  <option value="Children & Multilingual">Children & Multilingual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Physics, Mathematics, Biology, History"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5f6f52]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Grade Level</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5f6f52] bg-white"
                >
                  <option value="Secondary & University">Secondary & University (Forms 3-4, College)</option>
                  <option value="Primary & Secondary">Primary & Secondary (Forms 1-2, Middle)</option>
                  <option value="University & Higher Ed">University & Higher Ed</option>
                  <option value="Primary & Elementary">Primary & Elementary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">License & Access</label>
                <input
                  type="text"
                  placeholder="e.g. Open Educational Resource (OER), Public Domain"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5f6f52]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Book Overview / Abstract</label>
              <textarea
                rows={2}
                placeholder="Briefly describe what this book covers..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5f6f52]"
              />
            </div>
          </div>

          {/* Section 3: Manual Text / Chapters Paste Option */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#5f6f52]" />
                3. Book Content & Chapters ({chapters.length} loaded)
              </label>

              {chapters.length > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {chapters.length} Chapter(s) Ready
                </span>
              )}
            </div>

            {chapters.length > 0 ? (
              <div className="bg-[#fcfbf9] border border-slate-200 rounded-2xl p-4 space-y-3 max-h-48 overflow-y-auto">
                {chapters.map((ch, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#5f6f52]/10 text-[#5f6f52] font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">{ch.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ~{Math.ceil(ch.content.length / 5)} words
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  placeholder="Or paste full book text / chapters directly here if you don't have a file..."
                  value={pastedFullText}
                  onChange={(e) => setPastedFullText(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5f6f52] font-mono"
                />
                <button
                  type="button"
                  onClick={handleProcessPastedText}
                  disabled={!pastedFullText.trim()}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Parse Text into Chapters
                </button>
              </div>
            )}
          </div>

          {/* AI Knowledge Base Access Notice */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Bot className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <span className="font-extrabold block">AI Global Knowledge Base Synchronization</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Saving this book adds it to the Global Resources Open Books catalog and indexes its full chapter content in Firestore. The EduNexus AI Tutor, Socratic Sage, and Lesson Generator will automatically be able to cite and read this book to answer student questions.
              </p>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || (chapters.length === 0 && !pastedFullText.trim()) || !title.trim()}
              className="bg-[#5f6f52] hover:bg-[#4d5a42] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-md disabled:bg-slate-200 disabled:text-slate-400 flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Indexing Full Book...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Load & Index Full Book for AI Access
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
