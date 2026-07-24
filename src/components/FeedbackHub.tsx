import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DocumentFeedback } from '../types';
import { FeedbackAudioPlayer } from './FeedbackAudioPlayer';
import { 
  Star, 
  Download, 
  Trash2, 
  Sparkles, 
  Filter, 
  Search, 
  MessageSquare, 
  FileText, 
  User, 
  BarChart2, 
  CheckCircle,
  HelpCircle,
  Cpu
} from 'lucide-react';

export default function FeedbackHub() {
  const [feedbacks, setFeedbacks] = useState<DocumentFeedback[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedDocType, setSelectedDocType] = useState<string>('All');

  useEffect(() => {
    const feedbacksCol = collection(db, 'feedbacks');
    const q = query(feedbacksCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DocumentFeedback[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as DocumentFeedback);
      });
      setFeedbacks(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to feedbacks:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback log?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'feedbacks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `feedbacks/${id}`);
    }
  };

  // Export JSON for prompt engineering & tuning
  const handleExportTuningData = () => {
    if (feedbacks.length === 0) return;

    // Convert to structured tuning JSON format (prompt inputs -> evaluated quality outputs)
    const tuningData = feedbacks.map((f) => ({
      document_id: f.docId,
      document_title: f.docTitle,
      document_type: f.docType,
      curriculum: f.curriculum,
      subject: f.subject,
      topic: f.topic,
      metrics: {
        generation_quality_score: f.rating,
        curriculum_relevance_score: f.relevanceRating,
      },
      teacher_feedback: f.writtenFeedback,
      evaluator_info: {
        role: "Teacher",
        uid: f.authorUid,
        email: f.authorEmail,
      },
      logged_at: f.createdAt,
      // Suggested enhancement pair for training / prompt tuning
      fine_tuning_example: {
        instruction: `Generate a high-quality, curriculum-aligned ${f.docType} for ${f.subject} on the topic "${f.topic}" following ${f.curriculum.toUpperCase()} pedagogy.`,
        feedback_aligned_revisions: f.writtenFeedback ? `Ensure that the generation resolves the teacher's noted issue: "${f.writtenFeedback}"` : "Maintain current generation parameters."
      }
    }));

    const blob = new Blob([JSON.stringify(tuningData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edunexus_feedback_tuning_dataset_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filters
  const subjects: string[] = ['All', ...Array.from(new Set<string>(feedbacks.map((f) => f.subject as string)))];
  const docTypes: string[] = ['All', ...Array.from(new Set<string>(feedbacks.map((f) => f.docType as string)))];

  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesSearch = 
      f.docTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.authorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.writtenFeedback && f.writtenFeedback.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSubject = selectedSubject === 'All' || f.subject === selectedSubject;
    const matchesDocType = selectedDocType === 'All' || f.docType === selectedDocType;

    return matchesSearch && matchesSubject && matchesDocType;
  });

  // Calculate Aggregated Metrics
  const totalLogs = feedbacks.length;
  const avgQuality = totalLogs > 0 
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalLogs).toFixed(1)
    : '0.0';
  const avgRelevance = totalLogs > 0 
    ? (feedbacks.reduce((acc, f) => acc + f.relevanceRating, 0) / totalLogs).toFixed(1)
    : '0.0';

  // High rating ratio (4+ stars)
  const positiveCount = feedbacks.filter(f => f.rating >= 4).length;
  const positiveRatio = totalLogs > 0 
    ? Math.round((positiveCount / totalLogs) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Aggregated Performance Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#fdfbf7] border border-[#e5e1da] p-5 rounded-xl space-y-2 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-10">
            <BarChart2 className="w-12 h-12 text-[#5f6f52]" />
          </div>
          <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Evaluated Logs</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-black text-slate-800">{totalLogs}</span>
            <span className="text-xs text-slate-400 font-medium">lessons rated</span>
          </div>
          <p className="text-[10px] text-slate-500">Live feed of teacher responses.</p>
        </div>

        <div className="bg-[#fdfbf7] border border-[#e5e1da] p-5 rounded-xl space-y-2 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-10">
            <Star className="w-12 h-12 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Avg Quality Rating</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-serif font-black text-slate-800">{avgQuality}</span>
            <div className="flex gap-0.5 mb-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.round(Number(avgQuality)) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-500">Target performance limit: 4.2 / 5.0</p>
        </div>

        <div className="bg-[#fdfbf7] border border-[#e5e1da] p-5 rounded-xl space-y-2 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-10">
            <Star className="w-12 h-12 text-[#5f6f52] fill-[#5f6f52]" />
          </div>
          <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Avg Curriculum Relevance</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-serif font-black text-slate-800">{avgRelevance}</span>
            <div className="flex gap-0.5 mb-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.round(Number(avgRelevance)) ? 'text-[#5f6f52] fill-[#5f6f52]' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-500">Measures syllabus compliance rates.</p>
        </div>

        <div className="bg-[#fdfbf7] border border-[#e5e1da] p-5 rounded-xl space-y-2 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-10">
            <Cpu className="w-12 h-12 text-indigo-600" />
          </div>
          <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Instruction Alignment Rate</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-black text-slate-800">{positiveRatio}%</span>
            <span className="text-xs text-emerald-600 font-extrabold">Good (4★+)</span>
          </div>
          <p className="text-[10px] text-slate-500">Satisfactory prompt alignment ratio.</p>
        </div>
      </div>

      {/* Dataset Fine-Tuning Info callout */}
      <div className="bg-amber-50/30 border border-amber-200/50 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-150 flex items-center justify-center text-amber-600 shrink-0">
            <Sparkles className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Prompt Engineering & Fine-Tuning Integration</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-[550px] mt-0.5">
              Teachers evaluate layout, tone, accuracy, and syllabus relevance. Use the button to download this structured feedback dataset in Google-compatible fine-tuning JSON layout, ready for direct model training or custom system instruction updates.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportTuningData}
          disabled={feedbacks.length === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#5f6f52] hover:bg-[#4d5a42] disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Fine-Tuning JSON</span>
        </button>
      </div>

      {/* Filter and Table Control panel */}
      <div className="bg-white rounded-xl border border-[#e5e1da] overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#e5e1da] bg-[#faf9f5] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filter Evaluations</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search feedback content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#5f6f52] transition"
              />
            </div>

            {/* Subject Select */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5f6f52]"
            >
              <option value="All">All Subjects</option>
              {subjects.filter(s => s !== 'All').map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>

            {/* DocType Select */}
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5f6f52]"
            >
              <option value="All">All Formats</option>
              {docTypes.filter(d => d !== 'All').map((dt) => (
                <option key={dt} value={dt}>
                  {dt.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feedback List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e5e1da] text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-3 px-4">Topic / Document</th>
                <th className="py-3 px-4">Subject & Curriculum</th>
                <th className="py-3 px-4">Evaluator</th>
                <th className="py-3 px-4">Ratings</th>
                <th className="py-3 px-4">Written Feedback Details</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f1ea] text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 italic">
                    Loading AI evaluation data...
                  </td>
                </tr>
              ) : filteredFeedbacks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-xs">No matching AI evaluations found.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Once teachers rate generated plans, results populate automatically.</p>
                  </td>
                </tr>
              ) : (
                filteredFeedbacks.map((f) => (
                  <tr key={f.id} className="hover:bg-[#faf9f5]/30 transition-colors">
                    {/* Document Info */}
                    <td className="py-4 px-4 max-w-[200px]">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block truncate" title={f.docTitle}>
                          {f.docTitle}
                        </span>
                        <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
                          {f.docType.replace('-', ' ')}
                        </span>
                      </div>
                    </td>

                    {/* Subject/Curriculum */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-700 block">{f.subject}</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">
                          {f.curriculum} alignment
                        </span>
                      </div>
                    </td>

                    {/* User */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {f.authorName}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{f.authorEmail}</span>
                      </div>
                    </td>

                    {/* Ratings */}
                    <td className="py-4 px-4 space-y-2 shrink-0">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-slate-400">Quality</p>
                        <div className="flex gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= f.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-slate-400">Relevance</p>
                        <div className="flex gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= f.relevanceRating ? 'text-[#5f6f52] fill-[#5f6f52]' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Comments */}
                    <td className="py-4 px-4 max-w-[250px]">
                      {f.writtenFeedback ? (
                        <p className="text-[11px] text-slate-600 italic leading-relaxed whitespace-pre-wrap">
                          "{f.writtenFeedback}"
                        </p>
                      ) : (
                        <span className="text-slate-400 text-[10px] italic">No written comment provided.</span>
                      )}
                      {f.voiceNoteUrl && (
                        <div className="mt-2">
                          <FeedbackAudioPlayer src={f.voiceNoteUrl} duration={f.voiceNoteDuration} />
                        </div>
                      )}
                      <span className="block text-[9px] text-slate-400 mt-2">
                        {new Date(f.createdAt).toLocaleString()}
                      </span>
                    </td>

                    {/* Delete Action */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleDeleteFeedback(f.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Delete evaluation log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
