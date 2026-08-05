import React, { useState, useEffect, useRef } from 'react';
import { SavedDocument } from '../types';
import { 
  Search, 
  BookOpen, 
  FileText, 
  Sparkles, 
  Users, 
  Image as ImageIcon, 
  Video, 
  Settings as SettingsIcon, 
  Zap, 
  Clock, 
  ArrowRight, 
  X, 
  Command, 
  CheckCircle2, 
  MessageSquare, 
  GraduationCap, 
  FolderOpen, 
  ChevronRight,
  Lightbulb,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: SavedDocument[];
  onSelectDoc: (doc: SavedDocument) => void;
  onNavigateTab: (tab: string) => void;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  documents,
  onSelectDoc,
  onNavigateTab
}: GlobalSearchModalProps) {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isStudent = profile?.role === 'Student';
  const isParent = profile?.role === 'Parent';

  // Navigation pages search items
  const pages = [
    { id: 'dashboard', title: 'Dashboard & Home', icon: BookOpen, category: 'Navigation', tab: 'dashboard' },
    { id: 'tutor', title: 'EduNexus AI Tutor', icon: GraduationCap, category: 'AI Learning', tab: 'tutor' },
    { id: 'create', title: 'Curriculum Generator', icon: Sparkles, category: 'Creator Studio', tab: 'create' },
    { id: 'collaboration', title: 'Collaboration Hub & AI Rooms', icon: Users, category: 'Community', tab: 'collaboration' },
    { id: 'file-library', title: 'Study Notes & File Library', icon: FolderOpen, category: 'Library', tab: 'file-library' },
    { id: 'image-studio', title: 'Image Studio', icon: ImageIcon, category: 'Creative Tools', tab: 'image-studio' },
    { id: 'video-studio', title: 'Video Studio', icon: Video, category: 'Creative Tools', tab: 'video-studio' },
    { id: 'assessment-generator', title: 'AI Assessment & Exam Builder', icon: FileText, category: 'Assessment', tab: 'assessment-generator' },
    { id: 'settings', title: 'Settings & Preferences', icon: SettingsIcon, category: 'Preferences', tab: 'settings' },
    { id: 'admin', title: 'Administrator Panel & Playbook', icon: Shield, category: 'Administration', tab: 'admin' },
  ];

  // AI Recommended Next Actions
  const aiRecommendations = [
    {
      id: 'rec-1',
      title: isStudent ? 'Review Weak Topics in Physics & Science' : 'Generate Quiz for Today\'s Lesson',
      subtitle: isStudent ? 'Recommended based on recent quiz scores' : 'Auto-extract key concepts from notes',
      action: () => {
        onNavigateTab(isStudent ? 'tutor' : 'assessment-generator');
        onClose();
      },
      icon: Lightbulb,
      badge: 'AI Suggested'
    },
    {
      id: 'rec-2',
      title: isStudent ? 'Continue Chemistry Notes from Yesterday' : 'Review Incomplete Assignments',
      subtitle: isStudent ? 'Resume from Grade 8 Acids & Bases' : '3 student submissions pending grading',
      action: () => {
        onNavigateTab(isStudent ? 'file-library' : 'performance');
        onClose();
      },
      icon: Clock,
      badge: 'Quick Resume'
    },
    {
      id: 'rec-3',
      title: 'Generate Visual Diagram or Illustration',
      subtitle: 'Create 4K educational illustrations for lessons',
      action: () => {
        onNavigateTab('image-studio');
        onClose();
      },
      icon: ImageIcon,
      badge: 'Studio'
    }
  ];

  const searchLower = query.toLowerCase().trim();

  // Filtered document results
  const filteredDocs = searchLower
    ? documents.filter(
        d =>
          d.title.toLowerCase().includes(searchLower) ||
          d.subject?.toLowerCase().includes(searchLower) ||
          d.topic?.toLowerCase().includes(searchLower) ||
          d.classLevel?.toLowerCase().includes(searchLower) ||
          d.curriculum?.toLowerCase().includes(searchLower)
      ).slice(0, 5)
    : documents.slice(0, 4);

  // Filtered page navigation results
  const filteredPages = searchLower
    ? pages.filter(
        p =>
          p.title.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower)
      )
    : pages.slice(0, 6);

  // Combine results into an ordered flat list for keyboard arrow navigation
  const flatItems: Array<{
    type: 'doc' | 'page' | 'rec';
    doc?: SavedDocument;
    page?: (typeof pages)[0];
    rec?: (typeof aiRecommendations)[0];
  }> = [];

  if (!searchLower) {
    aiRecommendations.forEach(rec => flatItems.push({ type: 'rec', rec }));
  }
  filteredPages.forEach(page => flatItems.push({ type: 'page', page }));
  filteredDocs.forEach(doc => flatItems.push({ type: 'doc', doc }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, flatItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flatItems[selectedIndex];
      if (selected) {
        executeItem(selected);
      }
    }
  };

  const executeItem = (item: (typeof flatItems)[0]) => {
    if (item.type === 'doc' && item.doc) {
      onSelectDoc(item.doc);
      onClose();
    } else if (item.type === 'page' && item.page) {
      onNavigateTab(item.page.tab);
      onClose();
    } else if (item.type === 'rec' && item.rec) {
      item.rec.action();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 md:p-12 animate-fadeIn"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Global Search and Quick Navigation"
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search lessons, study notes, AI generators, users, settings... (Esc to close)"
            className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-1 rounded-md shrink-0">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        {/* Scrollable Results */}
        <div className="overflow-y-auto p-3 sm:p-4 space-y-4 divide-y divide-slate-800/60">
          {/* AI Recommended Suggestions Section (When search is empty) */}
          {!searchLower && (
            <div className="space-y-2 pb-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Proactive AI Next Actions</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Tailored for {profile?.role || 'User'}</span>
              </div>
              <div className="space-y-1.5">
                {aiRecommendations.map((rec, idx) => {
                  const globalIdx = idx;
                  const isSelected = selectedIndex === globalIdx;
                  const RecIcon = rec.icon;
                  return (
                    <button
                      key={rec.id}
                      onClick={rec.action}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full text-left p-3 rounded-2xl transition flex items-center justify-between gap-3 cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-md'
                          : 'bg-slate-800/40 border-slate-800 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
                          <RecIcon className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold truncate text-slate-100">{rec.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{rec.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                          {rec.badge}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Page Navigation */}
          {filteredPages.length > 0 && (
            <div className="space-y-2 pt-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 px-2 block">
                Platform Navigation & Workspaces
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredPages.map((p, idx) => {
                  const baseOffset = !searchLower ? aiRecommendations.length : 0;
                  const globalIdx = baseOffset + idx;
                  const isSelected = selectedIndex === globalIdx;
                  const PageIcon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onNavigateTab(p.tab);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`text-left p-2.5 rounded-xl transition flex items-center justify-between gap-2.5 cursor-pointer border ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200 font-bold'
                          : 'bg-slate-800/30 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-xs truncate font-semibold">{p.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                        {p.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Documents & Curriculum Items */}
          {filteredDocs.length > 0 && (
            <div className="space-y-2 pt-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 px-2 block">
                Curriculum Documents & Study Notes ({filteredDocs.length})
              </span>
              <div className="space-y-1.5">
                {filteredDocs.map((doc, idx) => {
                  const baseOffset = (!searchLower ? aiRecommendations.length : 0) + filteredPages.length;
                  const globalIdx = baseOffset + idx;
                  const isSelected = selectedIndex === globalIdx;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        onSelectDoc(doc);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full text-left p-3 rounded-2xl transition flex items-center justify-between gap-3 cursor-pointer border ${
                        isSelected
                          ? 'bg-teal-500/20 border-teal-500/40 text-teal-100 shadow-md'
                          : 'bg-slate-800/30 border-slate-800/80 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold truncate text-slate-100">{doc.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {doc.subject} • {doc.classLevel} • {doc.curriculum}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-500/30">
                          View
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state when query matches nothing */}
          {searchLower && filteredPages.length === 0 && filteredDocs.length === 0 && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">No results found for "{query}"</p>
                <p className="text-xs text-slate-400 mt-1">Try searching for subjects, lesson titles, or AI tools like "Image Studio".</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-slate-800 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono text-[10px]">↑</kbd>{' '}
              <kbd className="bg-slate-800 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono text-[10px]">↓</kbd> Navigate
            </span>
            <span>
              <kbd className="bg-slate-800 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono text-[10px]">↵</kbd> Select
            </span>
          </div>
          <span>
            <kbd className="bg-slate-800 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono text-[10px]">Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}

export default GlobalSearchModal;
