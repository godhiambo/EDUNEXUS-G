import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanUndefined, compressObject, decompressObject } from '../firebase';
import { SavedDocument, PeerFeedback, DocumentFeedback } from '../types';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../lib/activityLogger';
import ParentTeacherPortal from './ParentTeacherPortal';
import AICollaborationRooms from './AICollaborationRooms';
import { 
  Users, 
  Share2, 
  Star, 
  MessageSquare, 
  DownloadCloud, 
  Search, 
  Filter, 
  Lock, 
  Globe, 
  Eye, 
  Send, 
  Trash2, 
  Sparkles, 
  Cpu, 
  CheckCircle,
  Download,
  AlertCircle
} from 'lucide-react';

export default function CollaborationHub() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'ai-rooms' | 'exchange' | 'contributions' | 'ai-feedback' | 'parent-messaging'>('ai-rooms');
  
  // Real-time states
  const [allDocs, setAllDocs] = useState<SavedDocument[]>([]);
  const [peerFeedbacks, setPeerFeedbacks] = useState<PeerFeedback[]>([]);
  const [aiFeedbacks, setAiFeedbacks] = useState<DocumentFeedback[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  
  // Dynamic Peer Feedback Form State
  const [reviewingDoc, setReviewingDoc] = useState<SavedDocument | null>(null);
  const [peerRating, setPeerRating] = useState<number>(5);
  const [peerComment, setPeerComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // View content modal State
  const [previewingDoc, setPreviewingDoc] = useState<SavedDocument | null>(null);

  const isStudent = profile?.role === 'Student';
  const isAdmin = profile?.role === 'Administrator';

  // Listen to Firestore
  useEffect(() => {
    if (!profile) return;

    // 1. Subscribe to ALL documents
    const docsCol = collection(db, 'documents');
    const unsubDocs = onSnapshot(docsCol, (snapshot) => {
      const list: SavedDocument[] = [];
      snapshot.forEach((docSnap) => {
        list.push(decompressObject(docSnap.data()) as SavedDocument);
      });
      setAllDocs(list);
    }, (err) => {
      console.error("CollaborationHub error loading documents:", err);
    });

    // 2. Subscribe to Peer Feedbacks
    const peerCol = collection(db, 'peer_feedbacks');
    const unsubPeer = onSnapshot(peerCol, (snapshot) => {
      const list: PeerFeedback[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as PeerFeedback);
      });
      setPeerFeedbacks(list);
      setLoading(false);
    }, (err) => {
      console.error("CollaborationHub error loading peer feedback:", err);
    });

    // 3. Subscribe to AI Feedbacks (for the AI Performance Hub)
    const aiCol = collection(db, 'feedbacks');
    const qAi = query(aiCol, orderBy('createdAt', 'desc'));
    const unsubAi = onSnapshot(qAi, (snapshot) => {
      const list: DocumentFeedback[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as DocumentFeedback);
      });
      setAiFeedbacks(list);
    }, (err) => {
      console.error("CollaborationHub error loading AI feedback:", err);
    });

    return () => {
      unsubDocs();
      unsubPeer();
      unsubAi();
    };
  }, [profile?.uid, profile?.role]);

  // Action: Toggle document share status
  const handleToggleShare = async (document: SavedDocument) => {
    if (isStudent) {
      alert("Students cannot share or configure resources.");
      return;
    }

    const currentShareStatus = !!document.isSharedWithColleagues;
    const nextShareStatus = !currentShareStatus;

    const updatedDoc: SavedDocument = {
      ...document,
      isSharedWithColleagues: nextShareStatus,
      sharedByUid: nextShareStatus ? (profile?.uid || 'unknown') : undefined,
      sharedByName: nextShareStatus ? (profile?.displayName || 'Unknown Teacher') : undefined,
      sharedAt: nextShareStatus ? new Date().toISOString() : undefined,
      lastModified: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'documents', document.id), cleanUndefined(compressObject(updatedDoc)));
      
      logActivity(
        nextShareStatus ? 'create' : 'delete',
        nextShareStatus 
          ? `Shared pedagogical resource with colleagues: "${document.title}"`
          : `Retracted shared resource from colleague pool: "${document.title}"`,
        profile,
        document.id,
        document.title
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `documents/${document.id}`);
    }
  };

  // Action: Submit Colleague Review Feedback
  const handleSubmitPeerReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !reviewingDoc || !peerComment.trim()) return;

    if (isStudent) {
      alert("Students cannot rate or review shared teacher resources.");
      return;
    }

    setSubmittingReview(true);
    const feedbackId = `peer-feedback-${reviewingDoc.id}-${profile.uid}`;
    
    const feedbackPayload: PeerFeedback = {
      id: feedbackId,
      docId: reviewingDoc.id,
      docTitle: reviewingDoc.title,
      docType: reviewingDoc.docType,
      rating: peerRating,
      comment: peerComment.trim(),
      authorUid: profile.uid,
      authorName: profile.displayName,
      authorRole: profile.role,
      authorEmail: profile.email,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'peer_feedbacks', feedbackId), cleanUndefined(feedbackPayload));
      
      logActivity(
        'comment',
        `Submitted colleague review for "${reviewingDoc.title}" (${peerRating} Stars)`,
        profile,
        reviewingDoc.id,
        reviewingDoc.title
      );

      setPeerComment('');
      setReviewingDoc(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `peer_feedbacks/${feedbackId}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Action: Delete Peer Review Feedback
  const handleDeletePeerReview = async (feedbackId: string, authorUid: string) => {
    if (!profile) return;
    if (profile.uid !== authorUid && profile.role !== 'Administrator') {
      alert("Permission denied. You can only delete reviews you authored.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this peer review?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'peer_feedbacks', feedbackId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `peer_feedbacks/${feedbackId}`);
    }
  };

  // Action: Import / Copy colleague resource to my library
  const handleImportToLibrary = async (document: SavedDocument) => {
    if (!profile) return;
    if (isStudent) {
      alert("Classroom mode is read-only. Students cannot import lesson plans.");
      return;
    }

    if (!window.confirm(`Would you like to import a copy of "${document.title}" into your private library?`)) {
      return;
    }

    const newDocId = `doc-${Date.now()}`;
    const importedDoc: SavedDocument = {
      ...document,
      id: newDocId,
      title: `${document.title} (Copy)`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isSharedWithColleagues: false, // Imported copy defaults to private
      sharedByUid: undefined,
      sharedByName: undefined,
      sharedAt: undefined,
      lastModifiedByUid: profile.uid,
      lastModifiedByName: profile.displayName
    };

    try {
      await setDoc(doc(db, 'documents', newDocId), cleanUndefined(compressObject(importedDoc)));
      
      alert(`Successfully imported "${document.title}" into your library!`);
      
      logActivity(
        'generate',
        `Imported a copy of colleague shared resource: "${document.title}"`,
        profile,
        newDocId,
        importedDoc.title
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `documents/${newDocId}`);
    }
  };

  // Export dataset for AI tuning
  const handleExportTuningData = () => {
    if (aiFeedbacks.length === 0) return;

    const tuningData = aiFeedbacks.map((f) => ({
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

  // Filter lists
  const sharedDocs = allDocs.filter(doc => !!doc.isSharedWithColleagues);
  const myDocs = allDocs.filter(doc => {
    // If we have an author/creator field, we check it. Alternatively, since we don't have authorUid on all original docs, 
    // any doc with lastModifiedByUid === profile.uid is "mine", or if it is private and not shared, it's also "mine" in the workspace.
    // To make this fully functional, let's treat any document that is either shared by this user OR (not shared by anyone else and modified by this user) as theirs.
    if (doc.sharedByUid) {
      return doc.sharedByUid === profile?.uid;
    }
    // Fallback: If it's not shared globally, it belongs to whoever modified it
    return doc.lastModifiedByUid === profile?.uid;
  });

  // Calculate dynamic average rating for shared documents
  const getDocPeerStats = (docId: string) => {
    const docReviews = peerFeedbacks.filter(fb => fb.docId === docId);
    if (docReviews.length === 0) return { avgRating: 0, count: 0 };
    const sum = docReviews.reduce((acc, curr) => acc + curr.rating, 0);
    return {
      avgRating: Number((sum / docReviews.length).toFixed(1)),
      count: docReviews.length
    };
  };

  // Shared Library Filtering
  const filteredSharedDocs = sharedDocs.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.sharedByName && doc.sharedByName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject = subjectFilter === 'All' || doc.subject === subjectFilter;
    const matchesType = typeFilter === 'All' || doc.docType === typeFilter;
    
    return matchesSearch && matchesSubject && matchesType;
  });

  const uniqueSubjects: string[] = Array.from(new Set(sharedDocs.map(d => d.subject as string))).filter(Boolean) as string[];
  const uniqueTypes: string[] = Array.from(new Set(sharedDocs.map(d => d.docType as string))).filter(Boolean) as string[];

  // AI Feedback stats
  const totalLogs = aiFeedbacks.length;
  const avgQuality = totalLogs > 0 
    ? (aiFeedbacks.reduce((acc, f) => acc + f.rating, 0) / totalLogs).toFixed(1)
    : '0.0';
  const avgRelevance = totalLogs > 0 
    ? (aiFeedbacks.reduce((acc, f) => acc + f.relevanceRating, 0) / totalLogs).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Visual Identity banner */}
      <div className="bg-gradient-to-br from-[#5f6f52] to-[#4c5841] text-white p-6 rounded-2xl border border-[#e5e1da] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-serif font-bold text-[#fefae0] flex items-center gap-2">
            <Users className="w-5.5 h-5.5" /> Colleague Collaboration Hub
          </h3>
          <p className="text-xs text-slate-100 leading-relaxed max-w-[650px]">
            Explore and review customized lesson materials uploaded by your school's faculty. 
            Share your own materials to build an immersive collective lesson archive. Complete with rated teacher advice.
          </p>
        </div>
        
        {/* Quick count indicator */}
        <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 shrink-0 text-center">
          <p className="text-[10px] text-slate-200 font-bold uppercase tracking-wider">Shared Faculty Resources</p>
          <p className="text-xl font-serif font-black text-[#fefae0]">{sharedDocs.length} Active Plans</p>
        </div>
      </div>

      {/* Segmented control tabs */}
      <div className="flex flex-wrap border-b border-[#e5e1da] gap-1 shrink-0">
        <button
          onClick={() => {
            setActiveTab('ai-rooms');
            setReviewingDoc(null);
          }}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ai-rooms'
              ? 'border-emerald-600 text-emerald-700 font-extrabold bg-emerald-50/50'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>💬 AI Collaboration Rooms</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] rounded-full font-bold">WhatsApp Synced</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('exchange');
            setReviewingDoc(null);
          }}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'exchange'
              ? 'border-[#5f6f52] text-[#5f6f52]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          🌐 Colleague Exchange ({sharedDocs.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('contributions');
            setReviewingDoc(null);
          }}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'contributions'
              ? 'border-[#5f6f52] text-[#5f6f52]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          🔒 Share My Work ({myDocs.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('ai-feedback');
            setReviewingDoc(null);
          }}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'ai-feedback'
              ? 'border-[#5f6f52] text-[#5f6f52]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          ✨ AI Performance Hub ({totalLogs})
        </button>
        <button
          onClick={() => {
            setActiveTab('parent-messaging');
            setReviewingDoc(null);
          }}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'parent-messaging'
              ? 'border-[#5f6f52] text-[#5f6f52]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          👪 Parent-Teacher Portal
        </button>
      </div>

      {/* Main Tab Routing */}
      {activeTab === 'ai-rooms' && (
        <AICollaborationRooms />
      )}
      {activeTab === 'exchange' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filters Panel */}
          <div className="bg-white p-4 rounded-xl border border-[#e5e1da] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#faf9f5]">
            <div className="flex items-center gap-2 text-slate-600">
              <Filter className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">Find Resources</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search shared resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#5f6f52] transition text-slate-700"
                />
              </div>

              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5f6f52] transition cursor-pointer"
              >
                <option value="All">All Subjects</option>
                {uniqueSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5f6f52] transition cursor-pointer"
              >
                <option value="All">All Formats</option>
                {uniqueTypes.map((dt: string) => (
                  <option key={dt} value={dt}>
                    {dt.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Review form block (if triggered) */}
          {reviewingDoc && (
            <div className="bg-[#fefae0]/40 border-2 border-[#ccd5ae]/50 p-5 rounded-2xl animate-slideDown space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#5f6f52]">Rate & Review Colleague's Material</h4>
                  <p className="text-xs text-slate-500">Provide pedagogical advice on "{reviewingDoc.title}" to improve quality.</p>
                </div>
                <button 
                  onClick={() => setReviewingDoc(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold hover:underline"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmitPeerReview} className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-700">Rating Evaluation:</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setPeerRating(star)}
                        className="p-0.5 text-amber-500 transition hover:scale-115 cursor-pointer"
                      >
                        <Star className={`w-6 h-6 ${star <= peerRating ? 'fill-amber-500' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-extrabold text-amber-600">({peerRating} / 5 Stars)</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Written Feedback / Suggestions:</label>
                  <textarea
                    rows={3}
                    required
                    value={peerComment}
                    onChange={(e) => setPeerComment(e.target.value)}
                    placeholder="Provide recommendations, teaching methods, or curriculum revisions that worked well for this lesson..."
                    className="w-full bg-white border border-slate-250 rounded-xl p-3 text-xs focus:outline-none focus:border-[#5f6f52] transition text-slate-700 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReview ? 'Submitting Comment...' : 'Post Colleague Review'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#e5e1da] p-5 shadow-xs flex flex-col justify-between space-y-4 animate-pulse">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="h-4 w-20 bg-slate-200 rounded-md"></div>
                      <div className="h-4 w-16 bg-slate-200 rounded-full"></div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-4 w-3/4 bg-slate-200 rounded-md"></div>
                      <div className="h-3 w-1/2 bg-slate-100 rounded-md"></div>
                    </div>
                    <div className="p-3 bg-[#fdfbf7] border border-[#f4f1ea] rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="h-3 w-20 bg-slate-200 rounded-md"></div>
                        <div className="h-3 w-16 bg-slate-100 rounded-md"></div>
                      </div>
                      <div className="h-3.5 w-28 bg-slate-200 rounded-md"></div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#f4f1ea] space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1 h-8 bg-slate-200 rounded-xl"></div>
                      <div className="flex-1 h-8 bg-slate-200 rounded-xl"></div>
                    </div>
                    <div className="h-7 w-full bg-slate-100 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSharedDocs.length === 0 ? (
            <div className="text-center p-16 bg-white rounded-2xl border border-[#e5e1da]">
              <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3 opacity-60" />
              <p className="font-bold text-sm text-slate-700">No resources found in the school exchange pool.</p>
              <p className="text-xs text-slate-400 mt-1">Be the first to share a lesson plan or rubric in the "Share My Work" tab!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSharedDocs.map((doc) => {
                const { avgRating, count } = getDocPeerStats(doc.id);
                const docReviews = peerFeedbacks.filter(fb => fb.docId === doc.id);
                
                return (
                  <div key={doc.id} className="bg-white rounded-2xl border border-[#e5e1da] p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#5f6f52]/10 text-[#5f6f52] shrink-0">
                          {doc.docType.replace('-', ' ')}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <Star className={`w-3.5 h-3.5 ${count > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                          <span className="text-xs font-bold text-slate-700">
                            {count > 0 ? `${avgRating}` : 'Unrated'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({count} reviews)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 leading-snug truncate" title={doc.title}>
                          {doc.title}
                        </h4>
                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>Subject: <strong className="text-slate-600 font-semibold">{doc.subject}</strong></span>
                          <span>•</span>
                          <span className="text-emerald-600 uppercase font-extrabold">{doc.curriculum}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-[#fdfbf7] border border-[#f4f1ea] rounded-xl text-[11px] text-slate-500 leading-relaxed">
                        <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
                          <span className="font-bold">Faculty Uploader</span>
                          <span>{doc.sharedAt ? new Date(doc.sharedAt).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                        <p className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#5f6f52]" />
                          {doc.sharedByName || 'Anonymous Teacher'}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action buttons */}
                    <div className="pt-3 border-t border-[#f4f1ea] space-y-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPreviewingDoc(doc)}
                          className="flex-1 py-2 bg-[#f4f1ea] hover:bg-[#e5e1da] text-[#5f6f52] font-bold rounded-xl text-[11px] transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Content</span>
                        </button>
                        
                        <button
                          onClick={() => handleImportToLibrary(doc)}
                          className="flex-1 py-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white font-bold rounded-xl text-[11px] transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                        >
                          <DownloadCloud className="w-3.5 h-3.5" />
                          <span>Import Copy</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setReviewingDoc(doc);
                          setPeerRating(5);
                          setPeerComment('');
                          // Scroll to review form smoothly
                          window.scrollTo({ top: 120, behavior: 'smooth' });
                        }}
                        className="w-full py-1.5 text-center text-[11px] font-bold text-[#5f6f52] hover:underline flex items-center justify-center gap-1 bg-[#5f6f52]/5 rounded-lg cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Add Peer Review / Advice</span>
                      </button>

                      {/* Interactive Comments/Reviews Dropdown */}
                      {docReviews.length > 0 && (
                        <div className="pt-2.5 border-t border-slate-100 space-y-2">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Faculty Advice & Feedback</p>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {docReviews.map(rev => (
                              <div key={rev.id} className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1 relative group">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-slate-800">{rev.authorName}</span>
                                    <span className="text-[9px] px-1 py-0.2 bg-slate-200 text-slate-600 rounded-full font-bold scale-90">{rev.authorRole}</span>
                                  </div>

                                  {/* Delete button (owner or admin) */}
                                  {(profile?.uid === rev.authorUid || isAdmin) && (
                                    <button
                                      onClick={() => handleDeletePeerReview(rev.id, rev.authorUid)}
                                      className="text-slate-300 hover:text-rose-500 rounded p-0.5 opacity-0 group-hover:opacity-100 transition absolute right-1.5 top-1.5"
                                      title="Delete Review"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} className={`w-2.5 h-2.5 ${s <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                                  ))}
                                </div>
                                <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                                  "{rev.comment}"
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'contributions' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Quick info about sharing safely */}
          <div className="bg-[#faf9f5] border border-[#e5e1da] p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-slate-600">
            <Lock className="w-5 h-5 text-[#5f6f52] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 block mb-0.5">Faculty Work Publishing Policies</span>
              Your documents default to <strong>🔒 Private</strong>. They are only visible to you. 
              By toggling "Share with Colleagues" to <strong>🌐 Shared</strong>, any teacher at your school will be able to search, preview, import, rate, and recommend modifications to your work.
            </div>
          </div>

          {/* List of my own contributions */}
          {myDocs.length === 0 ? (
            <div className="text-center p-16 bg-white rounded-2xl border border-[#e5e1da]">
              <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3 opacity-60" />
              <p className="font-bold text-sm text-slate-700">You haven't generated any curriculum materials yet.</p>
              <p className="text-xs text-slate-400 mt-1">Navigate to "Generate Material" first, complete a lesson generation, and save it to begin.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#e5e1da] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e5e1da] text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                    <th className="py-3 px-4">My Lesson / Resource</th>
                    <th className="py-3 px-4">Subject & Curriculum</th>
                    <th className="py-3 px-4">School Sharing Status</th>
                    <th className="py-3 px-4">Colleague Feedback Received</th>
                    <th className="py-3 px-4 text-right">Action Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f1ea] text-xs text-slate-700">
                  {myDocs.map((doc) => {
                    const isShared = !!doc.isSharedWithColleagues;
                    const { avgRating, count } = getDocPeerStats(doc.id);
                    const docReviews = peerFeedbacks.filter(fb => fb.docId === doc.id);
                    
                    return (
                      <tr key={doc.id} className="hover:bg-[#faf9f5]/30 transition-colors">
                        <td className="py-4 px-4 max-w-[220px]">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 block truncate" title={doc.title}>
                              {doc.title}
                            </span>
                            <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
                              {doc.docType.replace('-', ' ')}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-700 block">{doc.subject}</span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">
                              {doc.curriculum} aligned
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleShare(doc)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition duration-200 cursor-pointer flex items-center gap-1.5 shadow-xs ${
                              isShared
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-350'
                            }`}
                          >
                            {isShared ? (
                              <>
                                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                                <span>🌐 Shared with Faculty</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                <span>🔒 Private</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-4 px-4">
                          {isShared ? (
                            count > 0 ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} className={`w-2.5 h-2.5 ${s <= Math.round(avgRating) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                                  ))}
                                  <span className="text-[11px] font-extrabold text-slate-700 ml-1">({avgRating} / 5)</span>
                                </div>
                                <span className="text-[10px] text-[#5f6f52] font-semibold block">{count} Colleague peer reviews</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">No peer reviews yet.</span>
                            )
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Not shared. Share to receive peer reviews.</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right space-y-1.5">
                          <button
                            onClick={() => setPreviewingDoc(doc)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5f6f52] hover:underline cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview Plan</span>
                          </button>
                          
                          {/* List reviews below if there are any */}
                          {docReviews.length > 0 && (
                            <div className="text-left mt-2 border-t border-slate-100 pt-2 text-[10px] text-slate-500 space-y-1">
                              <span className="font-bold uppercase tracking-wider text-slate-400 text-[9px] block">Reviews received:</span>
                              {docReviews.slice(0, 3).map(rev => (
                                <p key={rev.id} className="truncate">
                                  <strong>{rev.authorName}:</strong> "{rev.comment}"
                                </p>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai-feedback' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Performance Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#fdfbf7] border border-[#e5e1da] p-5 rounded-xl space-y-2 relative overflow-hidden">
              <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total AI-Evaluated Logs</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-black text-slate-800">{totalLogs}</span>
                <span className="text-xs text-slate-400 font-medium">materials rated</span>
              </div>
              <p className="text-[10px] text-slate-500">Includes rating on quality, structure, and curricular alignment.</p>
            </div>

            <div className="bg-[#fdfbf7] border border-[#e5e1da] p-5 rounded-xl space-y-2 relative overflow-hidden">
              <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Avg Generation Quality</p>
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
              <p className="text-[10px] text-slate-500">Measures format, layout, and language satisfaction.</p>
            </div>

            <div className="bg-[#fdfbf7] border border-[#e5e1da] p-5 rounded-xl space-y-2 relative overflow-hidden">
              <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Avg Syllabus Compliance</p>
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
              <p className="text-[10px] text-slate-500">Measures CBC and Standard Syllabus compliance.</p>
            </div>
          </div>

          {/* Dataset Fine-Tuning Info callout */}
          <div className="bg-amber-50/30 border border-amber-200/50 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-150 flex items-center justify-center text-amber-600 shrink-0">
                <Sparkles className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Faculty Telemetry & Model Tuning</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-[550px] mt-0.5">
                  Download the complete aggregate database of teacher reviews, feedback ratings, and structured complaints in high-fidelity Google Gemini AI Fine-Tuning format. This is ready to feed into custom system instruction pipelines or model tuning algorithms.
                </p>
              </div>
            </div>

            <button
              onClick={handleExportTuningData}
              disabled={aiFeedbacks.length === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#5f6f52] hover:bg-[#4d5a42] disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Export Fine-Tuning JSON</span>
            </button>
          </div>

          {/* List of comments on AI generated output */}
          <div className="bg-white rounded-xl border border-[#e5e1da] overflow-hidden">
            <div className="p-4 border-b border-[#e5e1da] bg-[#faf9f5]">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Historical AI Output Evaluations</span>
            </div>
            
            <div className="divide-y divide-[#f4f1ea] max-h-[400px] overflow-y-auto">
              {aiFeedbacks.length === 0 ? (
                <p className="p-10 text-center text-xs text-slate-400 italic">No AI generation feedback logged yet.</p>
              ) : (
                aiFeedbacks.map(fb => (
                  <div key={fb.id} className="p-4 flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-800 text-xs block">{fb.docTitle}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-bold">{fb.docType}</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">{fb.curriculum} aligned</span>
                      </div>
                      <p className="text-[11px] text-slate-600 italic leading-relaxed pt-1">
                        "{fb.writtenFeedback || 'No written advice. Left star ratings.'}"
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-400">Evaluated by {fb.authorName}</p>
                      <div className="flex gap-0.5 mt-1 justify-end">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= fb.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'parent-messaging' && (
        <div className="space-y-6 animate-fadeIn">
          <ParentTeacherPortal />
        </div>
      )}

      {/* Previewing Doc Content Modal */}
      {previewingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-slate-200 shadow-2xl flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="bg-[#5f6f52] p-5 text-white flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold uppercase bg-white/20 px-2 py-0.5 rounded tracking-wider">
                  {previewingDoc.docType.replace('-', ' ')}
                </span>
                <h3 className="text-lg font-bold font-serif">{previewingDoc.title}</h3>
                <p className="text-[11px] text-slate-200">
                  Shared by <span className="font-semibold">{previewingDoc.sharedByName || 'Anonymous'}</span> on {previewingDoc.sharedAt ? new Date(previewingDoc.sharedAt).toLocaleDateString() : 'unknown'}
                </p>
              </div>
              <button
                onClick={() => setPreviewingDoc(null)}
                className="text-[#fefae0] hover:text-white font-extrabold text-sm p-2 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs md:text-sm text-slate-700 leading-relaxed bg-[#fdfbf7]">
              <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-3 shadow-xs">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Resource Parameters</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Subject</span>
                    <span className="text-slate-800 font-bold">{previewingDoc.subject}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Class Level</span>
                    <span className="text-slate-800 font-bold">{previewingDoc.classLevel}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Topic</span>
                    <span className="text-slate-800 font-bold">{previewingDoc.topic}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Syllabus Format</span>
                    <span className="text-emerald-700 font-black uppercase">{previewingDoc.curriculum}</span>
                  </div>
                </div>
              </div>

              {/* Main Content Render */}
              <div className="prose prose-slate max-w-none text-slate-800 whitespace-pre-wrap font-sans leading-relaxed bg-white p-5 rounded-xl border border-slate-200/80">
                {previewingDoc.content}
              </div>
            </div>

            {/* Footer controls */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-400 italic">EduNexus Secure Peer Publishing</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleImportToLibrary(previewingDoc);
                    setPreviewingDoc(null);
                  }}
                  className="px-4 py-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Import copy into My Library</span>
                </button>
                <button
                  onClick={() => setPreviewingDoc(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
