import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanUndefined } from '../firebase';
import { UserAccount } from '../types';
import { MessageSquare, Send, Trash2, Clock, UserCheck } from 'lucide-react';

interface Comment {
  id: string;
  text: string;
  authorName: string;
  authorRole: string;
  authorUid: string;
  createdAt: string;
}

interface SharedNotesProps {
  documentId: string;
  currentProfile: UserAccount | null;
}

export default function SharedNotes({ documentId, currentProfile }: SharedNotesProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const commentsCol = collection(db, 'documents', documentId, 'comments');
    const q = query(commentsCol, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Comment[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Comment);
      });
      setComments(list);
      setLoading(false);
    }, (error) => {
      // If permission is denied because we are not signed in or not authorized, handle cleanly
      console.error('Error listening to comments:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [documentId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentProfile) return;

    // Direct check for student role restriction
    if (currentProfile.role === 'Student') {
      alert("Students have read-only access and cannot write shared teacher notes.");
      return;
    }

    try {
      const commentsCol = collection(db, 'documents', documentId, 'comments');
      await addDoc(commentsCol, cleanUndefined({
        text: newComment,
        authorName: currentProfile.displayName,
        authorRole: currentProfile.role,
        authorUid: currentProfile.uid,
        createdAt: new Date().toISOString()
      }));
      setNewComment('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `documents/${documentId}/comments`);
    }
  };

  const handleDeleteComment = async (commentId: string, authorUid: string) => {
    if (!currentProfile) return;

    const isAdmin = currentProfile.role === 'Administrator';
    const isOwner = currentProfile.uid === authorUid;

    if (!isAdmin && !isOwner) {
      alert("Permission denied. You can only delete comments that you authored.");
      return;
    }

    if (!window.confirm('Are you sure you want to delete this tip?')) {
      return;
    }

    try {
      const commentRef = doc(db, 'documents', documentId, 'comments', commentId);
      await deleteDoc(commentRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `documents/${documentId}/comments/${commentId}`);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Teacher':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e5e1da] shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-[#f4f1ea] pb-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Teacher Discussion & Tips</h4>
          <p className="text-[10px] text-slate-400">Collaborative teaching annotations and comments.</p>
        </div>
      </div>

      <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
        {loading ? (
          <p className="text-[11px] text-slate-400 italic text-center py-4">Syncing notes...</p>
        ) : comments.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic text-center py-4">No teacher notes posted yet. Share what worked or peer advice!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-[#fdfbf7] border border-[#f4f1ea] p-3 rounded-xl space-y-1.5 relative group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-extrabold text-[#5f6f52]">{comment.authorName}</span>
                  <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full ${getRoleBadgeStyle(comment.authorRole)}`}>
                    {comment.authorRole}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-slate-400">
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {/* Delete button (only visible to owner or admin) */}
                  {(currentProfile?.role === 'Administrator' || currentProfile?.uid === comment.authorUid) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id, comment.authorUid)}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded transition opacity-0 group-hover:opacity-100"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
            </div>
          ))
        )}
      </div>

      {currentProfile?.role !== 'Student' ? (
        <form onSubmit={handleAddComment} className="pt-2 border-t border-[#f4f1ea] flex items-center gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a collaborative teaching tip..."
            className="flex-1 bg-[#fdfbf7] border border-[#e5e1da] px-3 py-2 rounded-xl text-[11px] focus:outline-none focus:border-emerald-500 transition"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition disabled:opacity-50 shrink-0 shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <div className="pt-2 border-t border-[#f4f1ea] text-center">
          <p className="text-[10px] text-slate-400 italic">Discussion list is read-only for Student accounts.</p>
        </div>
      )}
    </div>
  );
}
