import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, decompressObject } from '../firebase';
import { SavedDocument, DocumentVersion, UserAccount } from '../types';
import { History, RotateCcw, Eye, Clock, User, X, Check } from 'lucide-react';
import MarkdownView from './MarkdownView';

interface DocumentVersionWidgetProps {
  document: SavedDocument;
  currentProfile: UserAccount | null;
  onRestore: (restoredContent: string, restoredTitle: string) => void;
}

export default function DocumentVersionWidget({
  document: docObj,
  currentProfile,
  onRestore
}: DocumentVersionWidgetProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null);
  const [restoredId, setRestoredId] = useState<string | null>(null);

  const isTeacher = currentProfile && (currentProfile.role === 'Teacher' || currentProfile.role === 'Administrator');

  useEffect(() => {
    if (!docObj.id) return;

    setLoading(true);
    const versionsCol = collection(db, 'documents', docObj.id, 'versions');
    const q = query(versionsCol, orderBy('versionNumber', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DocumentVersion[] = [];
      snapshot.forEach((snap) => {
        list.push(decompressObject({ id: snap.id, ...snap.data() }) as DocumentVersion);
      });
      setVersions(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching versions:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [docObj.id]);

  if (!isTeacher) {
    return null; // Only teachers & admins see versioning options
  }

  const handleRestoreClick = async (v: DocumentVersion) => {
    if (!window.confirm(`Are you sure you want to restore the document to Version ${v.versionNumber}? This will create a new current state.`)) {
      return;
    }

    onRestore(v.content, v.title);
    setRestoredId(v.id);
    setPreviewVersion(null);
    setTimeout(() => setRestoredId(null), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e5e1da] shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#f4f1ea] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Version Control</h4>
            <p className="text-[10px] text-slate-400">Track and restore syllabus revisions.</p>
          </div>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded-full">
          {versions.length} {versions.length === 1 ? 'version' : 'versions'}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <p className="text-xs text-slate-400 italic">Syncing version timeline...</p>
        </div>
      ) : versions.length === 0 ? (
        <div className="text-center py-4 bg-[#faf9f5]/50 rounded-xl border border-dashed border-[#e5e1da]">
          <p className="text-xs text-slate-400">No revisions tracked yet.</p>
          <p className="text-[9px] text-slate-400 mt-1">Make and save edits to initiate versioning.</p>
        </div>
      ) : (
        <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2.5">
          {versions.map((v) => (
            <div 
              key={v.id} 
              className={`p-3 rounded-xl border transition-all ${
                restoredId === v.id 
                  ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                  : 'bg-[#fdfbf7]/60 hover:bg-[#faf9f5] border-[#f4f1ea] hover:border-[#e5e1da]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-800">
                      Version {v.versionNumber}
                    </span>
                    {v.versionNumber === Math.max(...versions.map(x => x.versionNumber)) && (
                      <span className="text-[8px] uppercase tracking-wider font-extrabold bg-[#5f6f52]/10 text-[#5f6f52] px-1.5 py-0.5 rounded">
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      {new Date(v.lastModified).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 shrink-0" />
                      {v.modifiedByName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewVersion(v)}
                    className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg transition"
                    title="Preview Version"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRestoreClick(v)}
                    className="p-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-600 rounded-lg transition"
                    title="Restore Version"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Fullscreen / Modal Comparison overlay */}
      {previewVersion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-[#5f6f52]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Syllabus Archive: Version {previewVersion.versionNumber} Preview
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Last saved by {previewVersion.modifiedByName} ({previewVersion.modifiedByEmail || 'No email'}) on {new Date(previewVersion.lastModified).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewVersion(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Content Preview */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white prose prose-slate max-w-none">
              <h1 className="font-serif font-bold text-2xl text-[#5f6f52] mb-4 border-b border-slate-150 pb-2">
                {previewVersion.title}
              </h1>
              <div className="markdown-body text-xs md:text-sm">
                <MarkdownView
                  content={previewVersion.content}
                  onGenerateDiagram={async () => {}}
                  generatingPlaceholders={{}}
                />
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setPreviewVersion(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Close Preview
              </button>
              <button
                onClick={() => handleRestoreClick(previewVersion)}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Version {previewVersion.versionNumber}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
