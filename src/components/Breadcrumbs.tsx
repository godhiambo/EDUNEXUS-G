import React, { useEffect } from 'react';
import { 
  Home, 
  ChevronRight, 
  FileText, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Settings as SettingsIcon,
  Search
} from 'lucide-react';

export interface BreadcrumbDoc {
  id: string;
  title: string;
  type?: string;
  subject?: string;
}

export interface BreadcrumbsProps {
  activeTab: string;
  selectedDoc?: BreadcrumbDoc | null;
  onNavigate: (tab: string) => void;
  onClearDoc?: () => void;
  className?: string;
}

interface TabHierarchyInfo {
  parent: string;
  parentTab: string;
  name: string;
  icon?: React.ReactNode;
}

const BASE_URL = 'https://joinedunexus.app';

export const TAB_HIERARCHY: Record<string, TabHierarchyInfo> = {
  dashboard: {
    parent: 'Workspace',
    parentTab: 'dashboard',
    name: 'Dashboard',
    icon: <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
  },
  create: {
    parent: 'Teacher Assistant',
    parentTab: 'create',
    name: 'Curriculum Generator',
    icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />
  },
  view: {
    parent: 'Teacher Assistant',
    parentTab: 'create',
    name: 'Document Viewer',
    icon: <FileText className="w-3.5 h-3.5 text-teal-400" />
  },
  tutor: {
    parent: 'AI Learning',
    parentTab: 'tutor',
    name: 'Socratic AI Tutor',
    icon: <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
  },
  resources: {
    parent: 'Curriculum Library',
    parentTab: 'resources',
    name: 'Global Resources & Flashcards',
    icon: <Globe className="w-3.5 h-3.5 text-blue-400" />
  },
  performance: {
    parent: 'Parent Portal',
    parentTab: 'performance',
    name: 'Student Analytics & Streaks',
    icon: <BookOpen className="w-3.5 h-3.5 text-purple-400" />
  },
  'assessment-generator': {
    parent: 'Teacher Assistant',
    parentTab: 'assessment-generator',
    name: 'Assessment Creator',
    icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
  },
  'voice-notes': {
    parent: 'AI Learning',
    parentTab: 'voice-notes',
    name: 'Voice Notebook & Transcripts',
    icon: <Globe className="w-3.5 h-3.5 text-cyan-400" />
  },
  'file-library': {
    parent: 'Curriculum Library',
    parentTab: 'file-library',
    name: 'File Library',
    icon: <FileText className="w-3.5 h-3.5 text-amber-400" />
  },
  'image-studio': {
    parent: 'Multimedia Studio',
    parentTab: 'image-studio',
    name: 'Visual Learning Studio',
    icon: <Sparkles className="w-3.5 h-3.5 text-pink-400" />
  },
  'video-studio': {
    parent: 'Multimedia Studio',
    parentTab: 'video-studio',
    name: 'Pedagogical Video Studio',
    icon: <Sparkles className="w-3.5 h-3.5 text-rose-400" />
  },
  phonetics: {
    parent: 'Specialized Tools',
    parentTab: 'phonetics',
    name: 'Visual Phonetics',
    icon: <BookOpen className="w-3.5 h-3.5 text-amber-400" />
  },
  'qr-mapping': {
    parent: 'Specialized Tools',
    parentTab: 'qr-mapping',
    name: 'QR Touchpoint Hunt',
    icon: <Globe className="w-3.5 h-3.5 text-emerald-400" />
  },
  'virtual-field-trip': {
    parent: 'Specialized Tools',
    parentTab: 'virtual-field-trip',
    name: 'Virtual Field Trips',
    icon: <Globe className="w-3.5 h-3.5 text-cyan-400" />
  },
  'todo-list': {
    parent: 'Specialized Tools',
    parentTab: 'todo-list',
    name: 'To-Do List',
    icon: <BookOpen className="w-3.5 h-3.5 text-teal-400" />
  },
  admin: {
    parent: 'Administration',
    parentTab: 'admin',
    name: 'Admin Playbook & Panel',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
  },
  settings: {
    parent: 'Account',
    parentTab: 'settings',
    name: 'Workspace Settings',
    icon: <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
  },
  collaboration: {
    parent: 'Administration',
    parentTab: 'collaboration',
    name: 'Faculty Collaboration',
    icon: <Globe className="w-3.5 h-3.5 text-indigo-400" />
  }
};

export default function Breadcrumbs({
  activeTab,
  selectedDoc,
  onNavigate,
  onClearDoc,
  className = ''
}: BreadcrumbsProps) {
  const currentTabInfo = TAB_HIERARCHY[activeTab] || {
    parent: 'Workspace',
    parentTab: 'dashboard',
    name: activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' '),
  };

  const isViewTab = activeTab === 'view' && selectedDoc;

  // Dynamically generate and inject Schema.org BreadcrumbList JSON-LD
  useEffect(() => {
    let scriptTag = document.getElementById('edunexus-breadcrumb-schema') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'edunexus-breadcrumb-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const items = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: currentTabInfo.parent,
        item: `${BASE_URL}/?section=${encodeURIComponent(currentTabInfo.parent.toLowerCase().replace(/\s+/g, '-'))}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: currentTabInfo.name,
        item: `${BASE_URL}/?tab=${activeTab}`
      }
    ];

    if (isViewTab && selectedDoc) {
      items.push({
        '@type': 'ListItem',
        position: 4,
        name: selectedDoc.title,
        item: `${BASE_URL}/?tab=view&docId=${selectedDoc.id}`
      });
    }

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items
    };

    scriptTag.textContent = JSON.stringify(breadcrumbSchema);
  }, [activeTab, selectedDoc, currentTabInfo]);

  return (
    <nav 
      aria-label="Breadcrumb navigation" 
      className={`flex items-center justify-between gap-3 px-3 py-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-xs text-slate-300 font-medium backdrop-blur-xs transition-all shadow-xs ${className}`}
    >
      <ol 
        itemScope 
        itemType="https://schema.org/BreadcrumbList" 
        className="flex items-center flex-wrap gap-1.5 sm:gap-2"
      >
        {/* Item 1: Home */}
        <li 
          itemProp="itemListElement" 
          itemScope 
          itemType="https://schema.org/ListItem" 
          className="inline-flex items-center gap-1"
        >
          <a
            itemProp="item"
            href={BASE_URL}
            onClick={(e) => {
              e.preventDefault();
              if (onClearDoc) onClearDoc();
              onNavigate('dashboard');
            }}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 transition-colors rounded-md px-1.5 py-1 hover:bg-slate-800/60 cursor-pointer group"
            title="Return to EduNexus Dashboard"
          >
            <Home className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
            <span itemProp="name" className="font-semibold text-slate-300 group-hover:text-cyan-300">Home</span>
          </a>
          <meta itemProp="position" content="1" />
        </li>

        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

        {/* Item 2: Parent Category */}
        <li 
          itemProp="itemListElement" 
          itemScope 
          itemType="https://schema.org/ListItem" 
          className="inline-flex items-center gap-1"
        >
          <span 
            itemProp="name"
            onClick={() => {
              if (onClearDoc) onClearDoc();
              onNavigate(currentTabInfo.parentTab);
            }}
            className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[11px] font-bold uppercase tracking-wider text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer"
          >
            {currentTabInfo.parent}
          </span>
          <meta itemProp="position" content="2" />
        </li>

        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

        {/* Item 3: Active Tab / Tool */}
        <li 
          itemProp="itemListElement" 
          itemScope 
          itemType="https://schema.org/ListItem" 
          className="inline-flex items-center gap-1"
        >
          <a
            itemProp="item"
            href={`${BASE_URL}/?tab=${activeTab}`}
            onClick={(e) => {
              e.preventDefault();
              if (isViewTab && onClearDoc) {
                onClearDoc();
              } else {
                onNavigate(activeTab);
              }
            }}
            className={`inline-flex items-center gap-1.5 transition-colors rounded-md p-1 cursor-pointer ${
              !isViewTab 
                ? 'text-cyan-300 font-extrabold bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5' 
                : 'text-slate-300 hover:text-cyan-300'
            }`}
          >
            {currentTabInfo.icon}
            <span itemProp="name">{currentTabInfo.name}</span>
          </a>
          <meta itemProp="position" content="3" />
        </li>

        {/* Item 4 (Optional): Selected Document */}
        {isViewTab && selectedDoc && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <li 
              itemProp="itemListElement" 
              itemScope 
              itemType="https://schema.org/ListItem" 
              className="inline-flex items-center gap-1 max-w-[220px] sm:max-w-[320px] truncate"
            >
              <div 
                itemProp="item"
                className="inline-flex items-center gap-1.5 text-amber-300 font-extrabold bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-md text-xs truncate"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span itemProp="name" className="truncate">{selectedDoc.title}</span>
              </div>
              <meta itemProp="position" content="4" />
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
