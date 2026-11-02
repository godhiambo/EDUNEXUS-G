import React from 'react';
import { motion } from 'motion/react';
import { slugifyHeading } from '../utils/toc';
import { ACADEMIC_VOCAB_MAP } from '../data/academicVocabData';
import { 
  Sparkles, 
  Smile, 
  Globe,
  Info, 
  Lightbulb, 
  AlertTriangle, 
  BookOpen, 
  GraduationCap, 
  HelpCircle, 
  ClipboardList, 
  Table as TableIcon,
  Flag
} from 'lucide-react';
import { MermaidDiagram } from './MermaidDiagram';
import { ParagraphReaction } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import QuickEmbedCard from './QuickEmbedCard';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.05,
    },
  },
};

const blockItemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.38,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

interface ConceptLink {
  concept: string;
  resourceTitle: string;
  query: string;
  subject: string;
  type: string;
  url: string;
}

const CONCEPT_MAPPINGS: {
  keywords: string[];
  concept: string;
  resourceTitle: string;
  query: string;
  subject: string;
  type: string;
  url: string;
}[] = [
  {
    keywords: ['simulation', 'simulations', 'physics', 'mechanics', 'chemical equation', 'force', 'energy', 'gravity'],
    concept: 'Physics & Chemistry Simulations',
    resourceTitle: 'PhET Science & Math Sims',
    query: 'PhET interactive science physics chemistry math simulations',
    subject: 'STEM (Science, Tech, Engineering, Math)',
    type: 'Interactive Simulator',
    url: 'https://phet.colorado.edu'
  },
  {
    keywords: ['math', 'mathematics', 'algebra', 'geometry', 'calculus', 'arithmetic', 'equations'],
    concept: 'Mathematics Mastery',
    resourceTitle: 'Khan Academy Mastery Lessons',
    query: 'Khan Academy video lessons and practice exercises',
    subject: 'STEM (Science, Tech, Engineering, Math)',
    type: 'Reference Site',
    url: 'https://www.khanacademy.org'
  },
  {
    keywords: ['astronomy', 'space', 'galaxy', 'star', 'stars', 'constellation', 'planetary', 'nasa'],
    concept: 'Space & Astronomy',
    resourceTitle: 'NASA Space Place Exploration Hub',
    query: 'NASA space place astronomy earth science games and guides',
    subject: 'STEM (Science, Tech, Engineering, Math)',
    type: 'Worksheet',
    url: 'https://spaceplace.nasa.gov'
  },
  {
    keywords: ['science', 'biology', 'cells', 'organelles', 'ecosystems', 'textbook', 'flexbooks'],
    concept: 'Curriculum Science Textbooks',
    resourceTitle: 'CK-12 Foundation FlexBooks',
    query: 'CK-12 flexbooks science biology chemistry adaptive practice',
    subject: 'STEM (Science, Tech, Engineering, Math)',
    type: 'Reference Site',
    url: 'https://www.ck12.org'
  },
  {
    keywords: ['revision', 'bitesize', 'quizzes', 'study guide', 'general knowledge', 'summaries'],
    concept: 'Interactive Study Guides',
    resourceTitle: 'BBC Bitesize Active Learning',
    query: 'BBC Bitesize interactive study guides and revision topics',
    subject: 'Languages & Literacy / Humanities',
    type: 'Reference Site',
    url: 'https://www.bbc.co.uk/bitesize'
  },
  {
    keywords: ['literacy', 'reading', 'writing', 'vocabulary', 'word-mapping', 'grammar', 'english'],
    concept: 'Literacy & English Writing',
    resourceTitle: 'ReadWriteThink Classroom Resources',
    query: 'ReadWriteThink lesson plans reading graphic organizers',
    subject: 'Languages & Literacy',
    type: 'Lesson Plan',
    url: 'https://www.readwritethink.org'
  },
  {
    keywords: ['geography', 'earth', 'climate', 'animals', 'wildlife', 'ecosystem', 'nature', 'atlas'],
    concept: 'Geography & Wildlife',
    resourceTitle: 'National Geographic Kids Explorer',
    query: 'National Geographic kids animals geography history video',
    subject: 'Humanities & Social Sciences',
    type: 'Video',
    url: 'https://kids.nationalgeographic.com'
  },
  {
    keywords: ['artifact', 'historical', 'museum', 'smithsonian', 'vaults', 'artwork', 'archives'],
    concept: 'Historical Artifacts & Art',
    resourceTitle: 'Smithsonian Learning Lab Tools',
    query: 'Smithsonian learning lab digital collections art history objects',
    subject: 'Arts & Humanities',
    type: 'Reference Site',
    url: 'https://learninglab.si.edu'
  },
  {
    keywords: ['lesson plan', 'open source', 'rubric', 'assessment', 'oer commons', 'curriculum-aligned'],
    concept: 'Public Lesson Plan Library',
    resourceTitle: 'OER Commons Public Educational Library',
    query: 'OER Commons lesson plans standard aligned worksheets resources',
    subject: 'All Subjects',
    type: 'Lesson Plan',
    url: 'https://www.oercommons.org'
  }
];

export function detectEducationalConcepts(text: string): ConceptLink[] {
  if (!text) return [];
  const matches: ConceptLink[] = [];
  const lowerText = text.toLowerCase();

  for (const item of CONCEPT_MAPPINGS) {
    for (const keyword of item.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerText)) {
        matches.push({
          concept: item.concept,
          resourceTitle: item.resourceTitle,
          query: item.query,
          subject: item.subject,
          type: item.type,
          url: item.url
        });
        break;
      }
    }
  }
  return matches;
}

function RenderConceptLinks({ text }: { text: string }) {
  const matches = detectEducationalConcepts(text);
  if (matches.length === 0) return null;

  const handleLinkClick = (match: any) => {
    const event = new CustomEvent('navigateToGlobalResources', {
      detail: {
        query: match.query,
        subject: match.subject,
        type: match.type
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 ml-2">
      {matches.map((match, idx) => (
        <button
          key={idx}
          onClick={() => handleLinkClick(match)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-700 hover:text-teal-850 text-[10px] font-bold border border-teal-150 transition cursor-pointer select-none"
          title={`Click to view related content for "${match.concept}" in Global Resources`}
        >
          <Globe className="w-2.5 h-2.5 text-teal-600 animate-pulse" />
          <span>See also: {match.concept}</span>
        </button>
      ))}
    </span>
  );
}

interface ParagraphWithReactionsProps {
  key?: string;
  text: string;
  renderedContent: React.ReactNode;
  reactions: ParagraphReaction[];
  onToggleReaction?: (paragraphText: string, emoji: string) => void;
  currentUserId?: string;
  alignment?: 'left' | 'center' | 'justify';
  bold?: boolean;
  italic?: boolean;
  onSpeakText?: (text: string) => void;
  currentlySpokenText?: string | null;
  currentSpeechCharIndex?: number;
  renderInline?: (text: string) => React.ReactNode;
}

const ParagraphWithReactions: React.FC<ParagraphWithReactionsProps> = ({
  text,
  renderedContent,
  reactions,
  onToggleReaction,
  currentUserId,
  alignment = 'left',
  bold = false,
  italic = false,
  onSpeakText,
  currentlySpokenText,
  currentSpeechCharIndex = 0,
  renderInline
}) => {
  const [showPicker, setShowPicker] = React.useState(false);
  const paragraphReactions = reactions.filter(r => r.paragraphText === text);

  const detectedUrls = React.useMemo(() => {
    if (!text) return [];
    // Basic regex for catching http/https links
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = text.match(urlRegex) || [];
    return Array.from(new Set(matches.map(url => {
      let cleaned = url;
      while (cleaned && /[.,;:!?)\]]$/.test(cleaned)) {
        cleaned = cleaned.slice(0, -1);
      }
      return cleaned;
    }).filter(url => {
      try {
        new URL(url);
        return true;
      } catch (_) {
        return false;
      }
    })));
  }, [text]);

  // Group reactions by emoji
  const initialAcc: Record<string, { count: number; users: string[]; hasReacted: boolean }> = {};
  const grouped = paragraphReactions.reduce((acc, curr) => {
    if (!acc[curr.emoji]) {
      acc[curr.emoji] = { count: 0, users: [], hasReacted: false };
    }
    acc[curr.emoji].count += 1;
    acc[curr.emoji].users.push(curr.userName);
    if (curr.userUid === currentUserId) {
      acc[curr.emoji].hasReacted = true;
    }
    return acc;
  }, initialAcc);

  const emojiOptions = ['👍', '💡', '📝'];

  const alignmentClass = alignment === 'center' 
    ? 'text-center' 
    : alignment === 'left' 
        ? 'text-left' 
        : 'text-justify';

  const boldClass = bold ? 'font-bold' : '';
  const italicClass = italic ? 'italic' : '';

  const { ttsHighlightingEnabled } = useAccessibility();
  const isCurrentlySpoken = currentlySpokenText === text && ttsHighlightingEnabled;

  // Split paragraph raw text into raw sentences
  const rawSentences = React.useMemo(() => {
    if (!text) return [];
    return text.split(/(?<=[.!?])\s+/);
  }, [text]);

  const cleanTextString = (t: string) => {
    return t
      .replace(/[#*`_~\[\]()\-+]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const sentenceRanges = React.useMemo(() => {
    let accumulatedCleanLength = 0;
    return rawSentences.map((raw) => {
      const clean = cleanTextString(raw);
      const start = accumulatedCleanLength;
      const cleanLen = clean.length;
      accumulatedCleanLength += cleanLen + 1; // plus 1 for space
      return {
        raw,
        start,
        end: start + cleanLen,
      };
    });
  }, [rawSentences]);

  const activeSentenceIndex = React.useMemo(() => {
    if (!isCurrentlySpoken || currentSpeechCharIndex === undefined) return -1;
    return sentenceRanges.findIndex(
      (range) => currentSpeechCharIndex >= range.start && currentSpeechCharIndex <= range.end
    );
  }, [sentenceRanges, isCurrentlySpoken, currentSpeechCharIndex]);

  let finalActiveIndex = activeSentenceIndex;
  if (isCurrentlySpoken && finalActiveIndex === -1 && sentenceRanges.length > 0) {
    if (currentSpeechCharIndex >= sentenceRanges[sentenceRanges.length - 1].end) {
      finalActiveIndex = sentenceRanges.length - 1;
    } else {
      finalActiveIndex = 0;
    }
  }

  // Tokenize paragraph text for word-by-word tracking
  const wordTokens = React.useMemo(() => {
    if (!text) return [];
    const tokens: { text: string; isWord: boolean; start: number; end: number }[] = [];
    const regex = /([a-zA-Z0-9'’-]+)|([^a-zA-Z0-9'’-]+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const word = match[1];
      const nonWord = match[2];
      const mText = word || nonWord;
      const start = match.index;
      tokens.push({
        text: mText,
        isWord: !!word,
        start,
        end: start + mText.length
      });
    }
    return tokens;
  }, [text]);

  const activeTokenIndex = React.useMemo(() => {
    if (!isCurrentlySpoken || currentSpeechCharIndex === undefined) return -1;
    // Find active token index
    return wordTokens.findIndex(
      (token) => token.isWord && currentSpeechCharIndex >= token.start && currentSpeechCharIndex < token.end
    );
  }, [wordTokens, isCurrentlySpoken, currentSpeechCharIndex]);

  const renderedContentToUse = React.useMemo(() => {
    if (!isCurrentlySpoken) {
      return renderedContent;
    }

    return (
      <span className="transition-all duration-300">
        {wordTokens.map((token, idx) => {
          const isActiveWord = idx === activeTokenIndex;
          
          // Determine which sentence this token belongs to
          const sentenceIdx = sentenceRanges.findIndex(
            (range) => token.start >= range.start && token.start < range.end
          );
          const isTokenInActiveSentence = sentenceIdx === finalActiveIndex || (finalActiveIndex === -1 && sentenceIdx === 0);

          // Strip formatting characters from displayed token to make it pristine plain text
          const cleanedTokenText = token.text.replace(/[*_`~#\[\]()]/g, '');
          if (!cleanedTokenText) return null;

          if (isActiveWord) {
            return (
              <span
                key={idx}
                className="bg-yellow-300 dark:bg-yellow-500 text-black font-extrabold px-1 rounded-md shadow-xs border-b-2 border-yellow-500 scale-105 inline-block transform transition-all duration-75 mx-0.5 ring-2 ring-yellow-400/50"
              >
                {cleanedTokenText}
              </span>
            );
          }

          if (isTokenInActiveSentence) {
            return (
              <span
                key={idx}
                className="bg-amber-100/40 dark:bg-amber-500/10 text-slate-900 dark:text-slate-100 font-medium rounded-sm transition-all duration-300"
              >
                {cleanedTokenText}
              </span>
            );
          }

          return (
            <span
              key={idx}
              className="opacity-40 transition-opacity duration-300"
            >
              {cleanedTokenText}
            </span>
          );
        })}
      </span>
    );
  }, [isCurrentlySpoken, wordTokens, activeTokenIndex, sentenceRanges, finalActiveIndex, renderedContent]);

  return (
    <motion.div
      variants={blockItemVariants}
      className={`group/para relative my-3 px-2 py-1.5 -mx-2 rounded-lg transition-all duration-200 ${isCurrentlySpoken ? 'bg-amber-50/75 border border-amber-200/60 shadow-xs scale-[1.005] ring-2 ring-amber-200/20' : 'hover:bg-slate-50/50'}`}
    >
      <div className={`text-slate-700 leading-relaxed relative ${alignmentClass} ${boldClass} ${italicClass}`}>
        {onSpeakText && (
          <button
            onClick={() => onSpeakText(text)}
            className={`absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              isCurrentlySpoken 
                ? 'bg-amber-500 text-white animate-pulse opacity-100' 
                : 'opacity-0 group-hover/para:opacity-100 bg-slate-100 hover:bg-[#5f6f52]/10 text-slate-400 hover:text-[#5f6f52]'
            }`}
            title="Read this block aloud (TTS)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          </button>
        )}
        {renderedContentToUse}
        <RenderConceptLinks text={text} />
      </div>

      {detectedUrls.length > 0 && (
        <div className="space-y-2 mt-2 ml-1" id="quick-embed-list">
          {detectedUrls.map((url) => (
            <QuickEmbedCard key={url} url={url} />
          ))}
        </div>
      )}

      {/* Reactions Row & Add Button */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 min-h-[24px]">
        {/* Render grouped reactions */}
        {(Object.entries(grouped) as [string, { count: number; users: string[]; hasReacted: boolean }][]).map(([emoji, info]) => (
          <button
            key={emoji}
            onClick={() => onToggleReaction?.(text, emoji)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition border cursor-pointer select-none ${
              info.hasReacted
                ? 'bg-[#5f6f52]/10 border-[#5f6f52]/30 text-[#5f6f52]'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
            }`}
            title={`Reacted: ${info.users.join(', ')}`}
          >
            <span>{emoji}</span>
            <span className="text-[10px] font-semibold">{info.count}</span>
          </button>
        ))}

        {/* Reaction Picker Button */}
        <div className="relative inline-block">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="opacity-0 group-hover/para:opacity-100 focus:opacity-100 flex items-center justify-center p-1.5 hover:bg-[#5f6f52]/10 text-slate-400 hover:text-[#5f6f52] rounded-lg transition-all duration-150 cursor-pointer"
            title="Add Reaction"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {/* Emoji Popover */}
          {showPicker && (
            <>
              <div 
                className="fixed inset-0 z-20" 
                onClick={() => setShowPicker(false)} 
              />
              <div className="absolute left-0 bottom-full mb-1.5 z-30 bg-white border border-[#e5e1da] rounded-xl shadow-lg p-1.5 flex items-center gap-1 animate-fadeIn">
                {emojiOptions.map((emoji) => {
                  const hasReacted = grouped[emoji]?.hasReacted;
                  return (
                    <button
                      key={emoji}
                      onClick={() => {
                        onToggleReaction?.(text, emoji);
                        setShowPicker(false);
                      }}
                      className={`w-7 h-7 flex items-center justify-center text-sm rounded-lg hover:scale-110 transition cursor-pointer ${
                        hasReacted ? 'bg-[#5f6f52]/10' : 'hover:bg-slate-50'
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface MarkdownViewProps {
  content: string;
  onGenerateDiagram?: (placeholder: string, prompt: string, model?: string) => void;
  generatingPlaceholders?: Record<string, boolean>;
  highlightedTexts?: string[];
  onHighlightClick?: (selectedText: string) => void;
  annotationHighlightedTexts?: string[];
  onAnnotationHighlightClick?: (selectedText: string) => void;
  reactions?: ParagraphReaction[];
  onToggleReaction?: (paragraphText: string, emoji: string) => void;
  currentUserId?: string;
  alignment?: 'left' | 'center' | 'justify';
  bold?: boolean;
  italic?: boolean;
  listStyle?: 'default' | 'disc' | 'decimal';
  fontFamily?: 'font-sans' | 'font-serif' | 'font-mono' | 'font-cursive';
  pedagogicalMode?: boolean;
  onSpeakText?: (text: string) => void;
  currentlySpokenText?: string | null;
  currentSpeechCharIndex?: number;
  isDyslexiaMode?: boolean;
  annotations?: any[];
  highlightAcademicVocab?: boolean;
  onAcademicVocabClick?: (term: string, pos: { x: number; y: number }) => void;
}

function parseImageParams(urlStr: string, altStr: string) {
  let align: 'left' | 'center' | 'right' = 'center';
  let width = '100%';

  // 1. Try to find align and width from URL query params or hash
  const hashIndex = urlStr.indexOf('#');
  const queryIndex = urlStr.indexOf('?');
  const paramPart = hashIndex !== -1 ? urlStr.substring(hashIndex) : (queryIndex !== -1 ? urlStr.substring(queryIndex) : '');

  if (paramPart) {
    const alignMatch = paramPart.match(/[?&#]align=(left|center|right)/i);
    if (alignMatch) {
      align = alignMatch[1].toLowerCase() as any;
    }
    const widthMatch = paramPart.match(/[?&#]width=([^&#]+)/i);
    if (widthMatch) {
      width = decodeURIComponent(widthMatch[1]);
    }
  }

  // 2. Also check if the alt text contains formatting commands (e.g., "|align:right|width:50%")
  let cleanAlt = altStr;
  const formatMatch = altStr.match(/^(.*?)\|(align:(left|center|right))?\|?(width:([0-9a-zA-Z%]+))?$/i);
  if (formatMatch) {
    cleanAlt = formatMatch[1].trim();
    if (formatMatch[3]) {
      align = formatMatch[3].toLowerCase() as any;
    }
    if (formatMatch[5]) {
      width = formatMatch[5].trim();
    }
  } else {
    // Also support simpler formats like "alt text | right | 300px" or "alt text|right"
    const parts = altStr.split('|');
    if (parts.length > 1) {
      cleanAlt = parts[0].trim();
      for (let j = 1; j < parts.length; j++) {
        const part = parts[j].trim().toLowerCase();
        if (part === 'left' || part === 'center' || part === 'right') {
          align = part as any;
        } else if (part.endsWith('%') || part.endsWith('px') || /^\d+$/.test(part)) {
          width = part.endsWith('%') || part.endsWith('px') ? part : `${part}px`;
        } else if (part.startsWith('width:')) {
          width = part.replace('width:', '').trim();
        } else if (part.startsWith('align:')) {
          const a = part.replace('align:', '').trim();
          if (a === 'left' || a === 'center' || a === 'right') {
            align = a as any;
          }
        }
      }
    }
  }

  return { align, width, cleanAlt };
}

function getHeadingIconAndStyle(text: string) {
  const lower = text.toLowerCase();
  let icon: React.ReactNode = null;
  let extraStyle = "";
  
  if (lower.includes("specific learning outcomes") || lower.includes("learning objectives") || lower.includes("objectives")) {
    icon = <GraduationCap className="w-5 h-5 text-indigo-600 shrink-0" />;
    extraStyle = "text-indigo-900 border-indigo-200/50 bg-indigo-50/20 px-3 py-1 rounded-xl border shadow-2xs";
  } else if (lower.includes("key inquiry questions") || lower.includes("inquiry questions")) {
    icon = <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />;
    extraStyle = "text-amber-900 border-amber-200/50 bg-amber-50/20 px-3 py-1 rounded-xl border shadow-2xs";
  } else if (lower.includes("core competencies") || lower.includes("values")) {
    icon = <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />;
    extraStyle = "text-emerald-900 border-emerald-200/50 bg-emerald-50/20 px-3 py-1 rounded-xl border shadow-2xs";
  } else if (lower.includes("teaching and learning resources") || lower.includes("resources")) {
    icon = <ClipboardList className="w-5 h-5 text-teal-600 shrink-0" />;
    extraStyle = "text-teal-900 border-teal-200/50 bg-teal-50/20 px-3 py-1 rounded-xl border shadow-2xs";
  } else if (lower.includes("assessment rubric") || lower.includes("rubric") || lower.includes("marking scheme") || lower.includes("evaluation")) {
    icon = <TableIcon className="w-5 h-5 text-rose-600 shrink-0" />;
    extraStyle = "text-rose-900 border-rose-200/50 bg-rose-50/20 px-3 py-1 rounded-xl border shadow-2xs";
  } else if (lower.includes("conclusion") || lower.includes("summary")) {
    icon = <Flag className="w-5 h-5 text-slate-600 shrink-0" />;
    extraStyle = "text-slate-900 border-slate-200/50 bg-slate-50/20 px-3 py-1 rounded-xl border shadow-2xs";
  }
  
  return { icon, extraStyle };
}

function MarkdownView({
  content,
  onGenerateDiagram,
  generatingPlaceholders = {},
  highlightedTexts = [],
  onHighlightClick,
  annotationHighlightedTexts = [],
  onAnnotationHighlightClick,
  reactions = [],
  onToggleReaction,
  currentUserId,
  alignment = 'left',
  bold = false,
  italic = false,
  listStyle = 'default',
  fontFamily = 'font-sans',
  pedagogicalMode = true,
  onSpeakText,
  currentlySpokenText,
  currentSpeechCharIndex = 0,
  isDyslexiaMode = false,
  annotations = [],
  highlightAcademicVocab = false,
  onAcademicVocabClick
}: MarkdownViewProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'Administrator';
  const [selectedModels, setSelectedModels] = React.useState<Record<string, string>>({});

  // Simple yet highly effective and robust custom markdown-to-JSX parser
  // Handles headers, lists, codeblocks, tables, bolding, blockquotes, and paragraphs.
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let i = 0;
  let keyCount = 0;
  let hideCurrentSection = false;

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();
    keyCount++;

    // Check if we hit a heading and need to toggle section hiding
    if (trimmedLine.startsWith('#')) {
      const headingText = trimmedLine.replace(/^#+\s*/, '').toLowerCase();
      const isPedagogical = headingText.includes('answer key') || 
                            headingText.includes('rubric') || 
                            headingText.includes('teacher guide') || 
                            headingText.includes('pedagogical') || 
                            headingText.includes('reflection') ||
                            headingText.includes('teacher note') ||
                            headingText.includes('model answer') ||
                            headingText.includes('marking scheme') ||
                            headingText.includes('assessment items');
      
      if (isPedagogical) {
        hideCurrentSection = !pedagogicalMode;
      } else {
        hideCurrentSection = false;
      }

      if (hideCurrentSection) {
        i++;
        continue; // Skip rendering this heading
      }
    }

    // Also handle individual line-based pedagogical markers
    const isLinePedagogical = trimmedLine.toLowerCase().startsWith('answer key:') || 
                              trimmedLine.toLowerCase().startsWith('teacher note:') || 
                              trimmedLine.toLowerCase().startsWith('pedagogical tip:') || 
                              trimmedLine.toLowerCase().startsWith('model answer:');

    if ((hideCurrentSection || (isLinePedagogical && !pedagogicalMode)) && !trimmedLine.startsWith('#')) {
      // Skip this element
      i++;
      continue;
    }

    // 0. Diagram placeholder rendering
    if (line.trim().startsWith('[DIAGRAM:') && line.trim().endsWith(']')) {
      const placeholderText = line.trim();
      const prompt = placeholderText.slice(9, -1).trim();
      const isGenerating = generatingPlaceholders[placeholderText];
      const model = selectedModels[placeholderText] || 'emgen_fallback_nanobanana';

      elements.push(
        <motion.div key={`diagram-${keyCount}`} variants={blockItemVariants} className="my-6 p-5 bg-gradient-to-br from-emerald-50/50 to-amber-50/50 rounded-2xl border border-emerald-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 animate-fadeIn">
          <div className="space-y-1.5 flex-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5f6f52]/10 text-[#5f6f52] border border-[#5f6f52]/20">
              <Sparkles className="w-3 h-3 animate-pulse text-[#5f6f52]" />
              Interactive Textbook Diagram
            </span>
            <p className="text-xs text-slate-600 leading-relaxed font-mono">
              {prompt}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {onGenerateDiagram ? (
              <>
                {isAdmin ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Engine:</span>
                    <select
                      value={model}
                      onChange={(e) => setSelectedModels(prev => ({ ...prev, [placeholderText]: e.target.value }))}
                      disabled={isGenerating}
                      className="bg-white border border-emerald-250 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 outline-none focus:border-[#5f6f52] transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="emgen_fallback_nanobanana">⚡ Auto Dual-Engine Mode</option>
                      <option value="emgen">🎨 High-Quality Studio</option>
                      <option value="nano banana">⚡ Ultra-Fast Studio</option>
                    </select>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg">
                    ⚡ Auto Dual-Engine Mode
                  </span>
                )}
                <button
                  onClick={() => onGenerateDiagram(placeholderText, prompt, model)}
                  disabled={isGenerating}
                  className={`flex items-center justify-center gap-1.5 bg-[#d4a373] text-white hover:bg-[#b07e4d] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isGenerating ? 'opacity-75 cursor-wait' : ''
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>🎨 Generate Diagram</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-400 italic font-medium">Use viewer actions to generate</span>
            )}
          </div>
        </motion.div>
      );
      i++;
      continue;
    }

    // 0b. Standard image rendering
    if (line.trim().startsWith('![') && line.trim().endsWith(')')) {
      const match = line.trim().match(/^!\[(.*?)\]\((.*)\)$/);
      if (match) {
        const alt = match[1];
        const url = match[2];
        const { align, width, cleanAlt } = parseImageParams(url, alt);
        const justifyClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
        const textAlignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';

        elements.push(
          <motion.div
            key={`img-${keyCount}`}
            variants={blockItemVariants}
            className={`my-6 flex ${justifyClass} w-full`}
          >
            <div className={`space-y-2 max-w-full ${textAlignClass}`} style={{ width: width, maxWidth: '100%' }}>
              <div className="inline-block rounded-2xl border border-[#e5e1da] overflow-hidden shadow-sm bg-white p-2 w-full">
                <DbImageRefLoader
                  url={url}
                  alt={cleanAlt}
                  className="max-h-[350px] md:max-h-[450px] object-contain w-full rounded-xl mx-auto"
                />
              </div>
              {cleanAlt && (
                <p className="text-xs text-slate-400 italic font-semibold">
                  📷 Figure: {cleanAlt}
                </p>
              )}
            </div>
          </motion.div>
        );
        i++;
        continue;
      }
    }

    // 1. Code block handling
    if (line.trim().startsWith('```')) {
      const codeType = line.trim().slice(3).trim().toLowerCase();
      const codeLines: string[] = [];
      i++; // skip the start ```
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip the end ```
      
      if (codeType === 'mermaid') {
        elements.push(
          <motion.div
            key={`mermaid-wrapper-${keyCount}`}
            variants={blockItemVariants}
            className="my-6"
          >
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5f6f52]/10 border border-[#5f6f52]/20 rounded-t-xl text-[10px] font-bold text-[#5f6f52] w-fit font-mono select-none">
              <span>📊 Visual Lesson Diagram / Concept Map</span>
            </div>
            <div className="border border-t-0 border-slate-200 rounded-b-xl bg-slate-50/50 p-2">
              <MermaidDiagram chart={codeLines.join('\n')} />
            </div>
          </motion.div>
        );
      } else {
        elements.push(
          <motion.pre
            key={`code-${keyCount}`}
            variants={blockItemVariants}
            className="bg-gray-50 border border-gray-200 text-gray-800 rounded-lg p-4 font-mono text-xs overflow-x-auto my-4 shadow-sm"
          >
            <code>{codeLines.join('\n')}</code>
          </motion.pre>
        );
      }
      continue;
    }

    // 2. Table handling
    if (line.trim().startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }

      // Parse columns
      const parseRow = (rowStr: string) => {
        return rowStr
          .split('|')
          .slice(1, -1) // remove empty first and last elements
          .map((cell) => cell.trim());
      };

      const headers = parseRow(tableLines[0]);
      // Skip the separator row (which typically contains hyphens like |---|---|)
      const dataRows = tableLines.slice(2).map((row) => parseRow(row));

      elements.push(
        <motion.div
          key={`table-wrapper-${keyCount}`}
          variants={blockItemVariants}
          className="overflow-x-auto my-6 border border-slate-200/80 rounded-xl shadow-xs bg-white"
        >
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/75 font-sans">
              <tr>
                {headers.map((header, idx) => (
                  <th
                    key={`th-${idx}`}
                    className="px-4 py-3.5 text-left font-bold text-slate-700 tracking-tight uppercase text-xs"
                  >
                    {renderInline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {dataRows.map((row, rowIdx) => (
                <tr key={`tr-${rowIdx}`} className={`${rowIdx % 2 === 1 ? 'bg-[#5f6f52]/2' : 'bg-white'} hover:bg-[#5f6f52]/5 transition-colors duration-100`}>
                  {row.map((cell, cellIdx) => (
                    <td key={`td-${cellIdx}`} className="px-4 py-3 text-slate-600 leading-relaxed max-w-xs break-words font-medium">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      );
      continue;
    }

    // 3. Blockquotes & Callout Boxes (Info/Warning/Tip Box)
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().slice(1).trim());
        i++;
      }

      let calloutType: 'info' | 'tip' | 'warning' | 'teacher' | 'vocab' | 'standard' = 'standard';
      let titleText = '';
      const cleanLines = [...quoteLines];

      const firstLineTrimmed = quoteLines[0]?.trim() || '';
      const firstLineLower = firstLineTrimmed.toLowerCase();

      if (firstLineLower.startsWith('[!note]') || firstLineLower.startsWith('note:')) {
        calloutType = 'info';
        titleText = 'Note';
        cleanLines[0] = firstLineTrimmed.replace(/^\[!note\]\s*/i, '').replace(/^note:\s*/i, '');
      } else if (firstLineLower.startsWith('[!info]') || firstLineLower.startsWith('info:')) {
        calloutType = 'info';
        titleText = 'Information';
        cleanLines[0] = firstLineTrimmed.replace(/^\[!info\]\s*/i, '').replace(/^info:\s*/i, '');
      } else if (firstLineLower.startsWith('[!tip]') || firstLineLower.startsWith('tip:') || firstLineLower.startsWith('[!idea]') || firstLineLower.startsWith('idea:')) {
        calloutType = 'tip';
        titleText = 'Tip / Key Concept';
        cleanLines[0] = firstLineTrimmed.replace(/^\[!tip\]\s*/i, '').replace(/^tip:\s*/i, '').replace(/^\[!idea\]\s*/i, '').replace(/^idea:\s*/i, '');
      } else if (firstLineLower.startsWith('[!warning]') || firstLineLower.startsWith('warning:') || firstLineLower.startsWith('[!caution]') || firstLineLower.startsWith('caution:') || firstLineLower.startsWith('[!important]') || firstLineLower.startsWith('important:')) {
        calloutType = 'warning';
        titleText = 'Important / Attention';
        cleanLines[0] = firstLineTrimmed.replace(/^\[!warning\]\s*/i, '').replace(/^warning:\s*/i, '').replace(/^\[!caution\]\s*/i, '').replace(/^caution:\s*/i, '').replace(/^\[!important\]\s*/i, '').replace(/^important:\s*/i, '');
      } else if (firstLineLower.startsWith('[!teacher]') || firstLineLower.startsWith('teacher note:') || firstLineLower.startsWith('teacher tip:')) {
        calloutType = 'teacher';
        titleText = 'Teacher Guidance / Pedagogical Tip';
        cleanLines[0] = firstLineTrimmed.replace(/^\[!teacher\]\s*/i, '').replace(/^teacher note:\s*/i, '').replace(/^teacher tip:\s*/i, '');
      } else if (firstLineLower.startsWith('[!vocabulary]') || firstLineLower.startsWith('vocabulary:') || firstLineLower.startsWith('key vocabulary:')) {
        calloutType = 'vocab';
        titleText = 'Key Vocabulary';
        cleanLines[0] = firstLineTrimmed.replace(/^\[!vocabulary\]\s*/i, '').replace(/^vocabulary:\s*/i, '').replace(/^key vocabulary:\s*/i, '');
      }

      let calloutClass = '';
      let icon: React.ReactNode = null;

      switch (calloutType) {
        case 'info':
          calloutClass = 'bg-blue-50/50 border-l-4 border-blue-500 text-blue-900 rounded-r-xl p-4 my-6 shadow-2xs border border-l-0 border-blue-100/60';
          icon = <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />;
          break;
        case 'tip':
          calloutClass = 'bg-emerald-50/40 border-l-4 border-emerald-500 text-emerald-900 rounded-r-xl p-4 my-6 shadow-2xs border border-l-0 border-emerald-100/60';
          icon = <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
          break;
        case 'warning':
          calloutClass = 'bg-amber-50/40 border-l-4 border-amber-500 text-amber-900 rounded-r-xl p-4 my-6 shadow-2xs border border-l-0 border-amber-100/60';
          icon = <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
          break;
        case 'teacher':
          calloutClass = 'bg-yellow-50/25 border-l-4 border-yellow-600 text-amber-950 rounded-r-xl p-4 my-6 shadow-2xs border border-l-0 border-yellow-100';
          icon = <GraduationCap className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5" />;
          break;
        case 'vocab':
          calloutClass = 'bg-purple-50/40 border-l-4 border-purple-500 text-purple-900 rounded-r-xl p-4 my-6 shadow-2xs border border-l-0 border-purple-100/60';
          icon = <BookOpen className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />;
          break;
        default:
          calloutClass = 'border-l-4 border-slate-400 bg-slate-50/60 px-4 py-3.5 my-4 rounded-r-xl text-slate-800';
          icon = <BookOpen className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />;
          break;
      }

      elements.push(
        <motion.div
          key={`quote-${keyCount}`}
          variants={blockItemVariants}
          className={calloutClass}
        >
          {titleText && (
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-2 select-none">
              {icon}
              <span>{titleText}</span>
            </div>
          )}
          <div className="space-y-1.5 leading-relaxed text-sm">
            {cleanLines.map((ql, qIdx) => ql.trim() ? (
              <p key={`qp-${qIdx}`}>{renderInline(ql)}</p>
            ) : null)}
          </div>
        </motion.div>
      );
      continue;
    }

    // 4. Headers
    if (line.trim().startsWith('###')) {
      const headerText = line.trim().slice(3).trim();
      const { icon, extraStyle } = getHeadingIconAndStyle(headerText);
      const headingId = slugifyHeading(headerText) || `heading-${keyCount}`;
      elements.push(
        <motion.h4
          id={headingId}
          key={`h3-${keyCount}`}
          variants={blockItemVariants}
          className={`font-sans font-semibold text-base mt-6 mb-3 flex items-center gap-2 tracking-tight ${extraStyle || 'text-slate-800'}`}
        >
          {icon || <span className="w-1 h-3.5 bg-slate-300 rounded-xs inline-block mr-0.5"></span>}
          <span>{renderInline(headerText)}</span>
        </motion.h4>
      );
      i++;
      continue;
    }
    if (line.trim().startsWith('##')) {
      const headerText = line.trim().slice(2).trim();
      const { icon, extraStyle } = getHeadingIconAndStyle(headerText);
      const headingId = slugifyHeading(headerText) || `heading-${keyCount}`;
      elements.push(
        <motion.h3
          id={headingId}
          key={`h2-${keyCount}`}
          variants={blockItemVariants}
          className={`font-sans font-bold text-lg mt-8 mb-4 pb-1 border-b border-slate-150 flex items-center gap-2 tracking-tight ${extraStyle || 'text-slate-900'}`}
        >
          {icon || <span className="w-1.5 h-4 bg-slate-400 rounded-sm inline-block mr-0.5"></span>}
          <span>{renderInline(headerText)}</span>
        </motion.h3>
      );
      i++;
      continue;
    }
    if (line.trim().startsWith('#')) {
      const headerText = line.trim().slice(1).trim();
      const { icon, extraStyle } = getHeadingIconAndStyle(headerText);
      const headingId = slugifyHeading(headerText) || `heading-${keyCount}`;
      elements.push(
        <motion.h2
          id={headingId}
          key={`h1-${keyCount}`}
          variants={blockItemVariants}
          className={`font-sans font-extrabold text-2xl mt-10 mb-5 pb-2 border-b-2 border-slate-200 flex items-center gap-2.5 tracking-tight ${extraStyle || 'text-slate-950'}`}
        >
          {icon}
          <span>{renderInline(headerText)}</span>
        </motion.h2>
      );
      i++;
      continue;
    }

    // 5. Unordered List Items
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        listItems.push(lines[i].trim().slice(2).trim());
        i++;
      }
      const isForcedNumbered = listStyle === 'decimal';
      elements.push(
        isForcedNumbered ? (
          <motion.ol
            key={`ol-${keyCount}`}
            variants={blockItemVariants}
            className="list-decimal pl-6 my-4 space-y-2.5 text-slate-700"
          >
            {listItems.map((item, idx) => (
              <li key={`oli-${idx}`} className="leading-relaxed hover:text-slate-900 transition-colors duration-150 pl-1">
                {renderInline(item)}
                <RenderConceptLinks text={item} />
              </li>
            ))}
          </motion.ol>
        ) : (
          <motion.ul
            key={`ul-${keyCount}`}
            variants={blockItemVariants}
            className="list-none pl-1 my-4 space-y-2.5 text-slate-700"
          >
            {listItems.map((item, idx) => (
              <li key={`li-${idx}`} className="leading-relaxed hover:text-slate-900 transition-colors duration-150 pl-5 relative">
                <span className="absolute left-0.5 top-[0.55rem] w-1.5 h-1.5 rounded-full bg-[#5f6f52]/70 inline-block"></span>
                {renderInline(item)}
                <RenderConceptLinks text={item} />
              </li>
            ))}
          </motion.ul>
        )
      );
      continue;
    }

    // 6. Ordered List Items
    if (/^\d+\.\s/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const itemLine = lines[i].trim();
        const firstSpace = itemLine.indexOf(' ');
        listItems.push(itemLine.slice(firstSpace + 1).trim());
        i++;
      }
      const isForcedBulleted = listStyle === 'disc';
      elements.push(
        isForcedBulleted ? (
          <motion.ul
            key={`ul-${keyCount}`}
            variants={blockItemVariants}
            className="list-none pl-1 my-4 space-y-2.5 text-slate-700"
          >
            {listItems.map((item, idx) => (
              <li key={`li-${idx}`} className="leading-relaxed hover:text-slate-900 transition-colors duration-150 pl-5 relative">
                <span className="absolute left-0.5 top-[0.55rem] w-1.5 h-1.5 rounded-full bg-[#5f6f52]/70 inline-block"></span>
                {renderInline(item)}
                <RenderConceptLinks text={item} />
              </li>
            ))}
          </motion.ul>
        ) : (
          <motion.ol
            key={`ol-${keyCount}`}
            variants={blockItemVariants}
            className="list-none pl-1 my-4 space-y-2.5 text-slate-700"
          >
            {listItems.map((item, idx) => (
              <li key={`oli-${idx}`} className="leading-relaxed hover:text-slate-900 transition-colors duration-150 pl-6 relative">
                <span className="absolute left-0 top-[0.15rem] font-mono text-xs font-bold text-[#5f6f52]/80 bg-[#5f6f52]/5 border border-[#5f6f52]/10 w-4.5 h-4.5 rounded-full flex items-center justify-center select-none">
                  {idx + 1}
                </span>
                {renderInline(item)}
                <RenderConceptLinks text={item} />
              </li>
            ))}
          </motion.ol>
        )
      );
      continue;
    }

    // 7. Divider / Horizontal Rule
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(
        <motion.hr
          key={`hr-${keyCount}`}
          variants={blockItemVariants}
          className="my-8 border-t-2 border-slate-200"
        />
      );
      i++;
      continue;
    }

    // 8. Paragraph / Plain text
    if (line.trim() !== '') {
      elements.push(
        <ParagraphWithReactions
          key={`p-${keyCount}`}
          text={line.trim()}
          renderedContent={renderInline(line)}
          reactions={reactions}
          onToggleReaction={onToggleReaction}
          currentUserId={currentUserId}
          alignment={alignment}
          bold={bold}
          italic={italic}
          onSpeakText={onSpeakText}
          currentlySpokenText={currentlySpokenText}
          currentSpeechCharIndex={currentSpeechCharIndex}
          renderInline={renderInline}
        />
      );
    } else {
      // Just an empty line, can represent spacing
      elements.push(<div key={`space-${keyCount}`} className="h-2" />);
    }

    i++;
  }

  // Inline formatting helper (Highlight, Red Circle, Bold, Italic, plain text, and comment highlight support)
  function renderInline(text: string): React.ReactNode {
    if (!text) return '';
    
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    const hasHighlights = (highlightedTexts && highlightedTexts.length > 0) || (annotationHighlightedTexts && annotationHighlightedTexts.length > 0) || Boolean(highlightAcademicVocab);

    const parseRemaining = (subText: string, keyPrefix: string): React.ReactNode[] => {
      const boldRegex = /\*\*(.*?)\*\*/g;
      const subParts: React.ReactNode[] = [];
      let lastBoldIndex = 0;
      let boldMatch;

      const parseUnderline = (uText: string, uPrefix: string): React.ReactNode[] => {
        const uRegex = /<u>(.*?)<\/u>/gi;
        const uParts: React.ReactNode[] = [];
        let lastUIndex = 0;
        let uMatch;

        while ((uMatch = uRegex.exec(uText)) !== null) {
          if (uMatch.index > lastUIndex) {
            const normal = uText.substring(lastUIndex, uMatch.index);
            uParts.push(hasHighlights ? highlightTextInString(normal) : normal);
          }
          const insideU = uMatch[1];
          uParts.push(
            <span key={`${uPrefix}-underline-${uMatch.index}`} className="underline text-slate-800">
              {hasHighlights ? highlightTextInString(insideU) : insideU}
            </span>
          );
          lastUIndex = uRegex.lastIndex;
        }
        if (lastUIndex < uText.length) {
          const normal = uText.substring(lastUIndex);
          uParts.push(hasHighlights ? highlightTextInString(normal) : normal);
        }
        return uParts;
      };

      const parseItalics = (italicText: string, italicPrefix: string): React.ReactNode[] => {
        const italicRegex = /\*(.*?)\*/g;
        const itParts: React.ReactNode[] = [];
        let lastItIndex = 0;
        let itMatch;

        while ((itMatch = italicRegex.exec(italicText)) !== null) {
          if (itMatch.index > lastItIndex) {
            const normal = italicText.substring(lastItIndex, itMatch.index);
            itParts.push(...parseUnderline(normal, `${italicPrefix}-unormal-${itMatch.index}`));
          }
          const insideItalic = itMatch[1];
          itParts.push(
            <em key={`${italicPrefix}-italic-${itMatch.index}`} className="italic text-slate-800">
              {...parseUnderline(insideItalic, `${italicPrefix}-uinside-${itMatch.index}`)}
            </em>
          );
          lastItIndex = italicRegex.lastIndex;
        }
        if (lastItIndex < italicText.length) {
          const normal = italicText.substring(lastItIndex);
          itParts.push(...parseUnderline(normal, `${italicPrefix}-uend`));
        }
        return itParts;
      };

      while ((boldMatch = boldRegex.exec(subText)) !== null) {
        if (boldMatch.index > lastBoldIndex) {
          const normal = subText.substring(lastBoldIndex, boldMatch.index);
          subParts.push(...parseItalics(normal, `${keyPrefix}-bnormal-${boldMatch.index}`));
        }
        const insideBold = boldMatch[1];
        subParts.push(
          <strong key={`${keyPrefix}-bold-${boldMatch.index}`} className="font-semibold text-slate-900">
            {...parseItalics(insideBold, `${keyPrefix}-binside-${boldMatch.index}`)}
          </strong>
        );
        lastBoldIndex = boldRegex.lastIndex;
      }

      if (lastBoldIndex < subText.length) {
        const normal = subText.substring(lastBoldIndex);
        subParts.push(...parseItalics(normal, `${keyPrefix}-bend`));
      }

      return subParts;
    };

    while (currentIndex < text.length) {
      const nextHl = text.indexOf('==', currentIndex);
      const nextCircle = text.indexOf('((', currentIndex);
      const nextImg = text.indexOf('![', currentIndex);

      if (nextHl === -1 && nextCircle === -1 && nextImg === -1) {
        // No more special tags
        const remaining = text.substring(currentIndex);
        parts.push(...parseRemaining(remaining, `end-${currentIndex}`));
        break;
      }

      // Find the earliest tag
      const minIndex = Math.min(
        nextHl === -1 ? Infinity : nextHl,
        nextCircle === -1 ? Infinity : nextCircle,
        nextImg === -1 ? Infinity : nextImg
      );

      if (minIndex === nextImg) {
        // Handle ![alt](url)
        if (nextImg > currentIndex) {
          const sub = text.substring(currentIndex, nextImg);
          parts.push(...parseRemaining(sub, `before-img-${nextImg}`));
        }
        const closeBrac = text.indexOf(']', nextImg + 2);
        if (closeBrac !== -1 && text.charAt(closeBrac + 1) === '(') {
          // Track parenthesis depth to safely handle nested parentheses inside SVG data URIs (like url(#grid))
          let closeParen = -1;
          let parenDepth = 1;
          for (let p = closeBrac + 2; p < text.length; p++) {
            if (text.charAt(p) === '(') {
              parenDepth++;
            } else if (text.charAt(p) === ')') {
              parenDepth--;
              if (parenDepth === 0) {
                closeParen = p;
                break;
              }
            }
          }

          if (closeParen !== -1) {
            const alt = text.substring(nextImg + 2, closeBrac);
            const url = text.substring(closeBrac + 2, closeParen);
            const { align, width, cleanAlt } = parseImageParams(url, alt);
            const justifyClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
            const textAlignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';

            parts.push(
              <div key={`img-inline-${nextImg}`} className={`my-6 flex ${justifyClass} w-full`}>
                <div className={`space-y-2 max-w-full ${textAlignClass}`} style={{ width: width, maxWidth: '100%' }}>
                  <div className="inline-block rounded-2xl border border-[#e5e1da] overflow-hidden shadow-sm bg-white p-2 w-full">
                    <DbImageRefLoader
                      url={url}
                      alt={cleanAlt}
                      className="max-h-[350px] md:max-h-[450px] object-contain w-full rounded-xl mx-auto"
                    />
                  </div>
                  {cleanAlt && (
                    <p className="text-xs text-slate-400 italic font-semibold">
                      📷 Figure: {cleanAlt}
                    </p>
                  )}
                </div>
              </div>
            );
            currentIndex = closeParen + 1;
            continue;
          }
        }
        parts.push('![');
        currentIndex = nextImg + 2;
      } else if (minIndex === nextHl) {
        // Handle ==highlight==
        if (nextHl > currentIndex) {
          const sub = text.substring(currentIndex, nextHl);
          parts.push(...parseRemaining(sub, `before-hl-${nextHl}`));
        }
        const closeHl = text.indexOf('==', nextHl + 2);
        if (closeHl === -1) {
          // Unclosed tag, treat as plain text
          parts.push('==');
          currentIndex = nextHl + 2;
        } else {
          let highlightText = text.substring(nextHl + 2, closeHl);
          let bgClass = "bg-[#fffd82]/80 dark:bg-yellow-500/30 border-yellow-300/60 text-slate-900 dark:text-yellow-100";
          if (highlightText.startsWith('green:')) {
            bgClass = "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300/40 text-emerald-900 dark:text-emerald-100";
            highlightText = highlightText.substring(6);
          } else if (highlightText.startsWith('pink:')) {
            bgClass = "bg-rose-100 dark:bg-rose-500/20 border-rose-300/40 text-rose-900 dark:text-rose-100";
            highlightText = highlightText.substring(5);
          } else if (highlightText.startsWith('blue:')) {
            bgClass = "bg-sky-100 dark:bg-sky-500/20 border-sky-300/40 text-sky-900 dark:text-sky-100";
            highlightText = highlightText.substring(5);
          } else if (highlightText.startsWith('yellow:')) {
            bgClass = "bg-[#fffd82]/80 dark:bg-yellow-500/30 border-yellow-300/60 text-slate-900 dark:text-yellow-100";
            highlightText = highlightText.substring(7);
          }
          parts.push(
            <mark key={`highlight-${nextHl}`} className={`${bgClass} px-1 py-0.5 rounded border font-semibold shadow-2xs inline-block mx-0.5`}>
              {...parseRemaining(highlightText, `hlinside-${nextHl}`)}
            </mark>
          );
          currentIndex = closeHl + 2;
        }
      } else {
        // Handle ((circle))
        if (nextCircle > currentIndex) {
          const sub = text.substring(currentIndex, nextCircle);
          parts.push(...parseRemaining(sub, `before-circle-${nextCircle}`));
        }
        const closeCircle = text.indexOf('))', nextCircle + 2);
        if (closeCircle === -1) {
          // Unclosed tag, treat as plain text
          parts.push('((');
          currentIndex = nextCircle + 2;
        } else {
          const circleText = text.substring(nextCircle + 2, closeCircle);
          parts.push(
            <span key={`circle-${nextCircle}`} className="border-2 border-red-500/80 rounded-full px-2 py-0.5 text-red-600 dark:text-red-400 font-extrabold inline-block mx-0.5 rotate-[-1deg] shadow-[0_0_4px_rgba(239,68,68,0.4)] animate-fadeIn">
              {...parseRemaining(circleText, `circleinside-${nextCircle}`)}
            </span>
          );
          currentIndex = closeCircle + 2;
        }
      }
    }

    return parts.length > 0 ? parts : text;
  }

  function highlightTextInString(text: string): React.ReactNode {
    const activeCommentHLs = (highlightedTexts || []).filter(h => h && h.trim().length > 3);
    const activeAnnotateHLs = (annotationHighlightedTexts || []).filter(h => h && h.trim().length > 3);
    
    const processVocabText = (plainText: string, pIndex: number): React.ReactNode => {
      if (!highlightAcademicVocab || !plainText) return plainText;

      const vocabKeys = Object.keys(ACADEMIC_VOCAB_MAP).sort((a, b) => b.length - a.length);
      const pattern = `\\b(${vocabKeys.join('|')})\\b`;
      const vocabRegex = new RegExp(pattern, 'gi');

      const subParts = plainText.split(vocabRegex);
      if (subParts.length <= 1) return plainText;

      return subParts.map((sub, sIdx) => {
        const lowerKey = sub.toLowerCase();
        if (ACADEMIC_VOCAB_MAP[lowerKey]) {
          return (
            <mark
              key={`vocab-${pIndex}-${sIdx}`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                onAcademicVocabClick?.(sub, { x: rect.left, y: rect.bottom + 5 });
              }}
              className="bg-indigo-100/90 text-indigo-950 dark:bg-indigo-950 dark:text-indigo-200 px-1 py-0.5 rounded cursor-pointer font-bold border-b-2 border-indigo-400 hover:bg-indigo-200 hover:border-indigo-600 transition-all inline-flex items-center gap-0.5 group/vocab shadow-2xs mx-0.5"
              title={`Academic Vocabulary: Click for definition of "${sub}"`}
            >
              <span className="text-[9px] text-indigo-600 dark:text-indigo-400 group-hover/vocab:scale-125 transition-transform">✨</span>
              <span>{sub}</span>
            </mark>
          );
        }
        return sub;
      });
    };

    if (activeCommentHLs.length === 0 && activeAnnotateHLs.length === 0) {
      return processVocabText(text, 0);
    }

    const escapeRegExp = (str: string) => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Combine and sort by length descending to match larger blocks first
    const allActive = [...activeCommentHLs, ...activeAnnotateHLs];
    const sortedHighlights = [...allActive].sort((a, b) => b.length - a.length);
    const pattern = sortedHighlights.map(h => escapeRegExp(h)).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');

    const parts = text.split(regex);
    return parts.map((part, index) => {
      // Check if it matches an annotation first
      const isAnnotate = activeAnnotateHLs.some(h => h.toLowerCase() === part.toLowerCase());
      if (isAnnotate) {
        // Find matching annotation color
        const matchingAnn = (annotations || []).find(
          a => a.selectedText && a.selectedText.toLowerCase() === part.toLowerCase()
        );
        const color = matchingAnn?.color || 'yellow';
        
        let colorClasses = "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200";
        if (color === 'green') {
          colorClasses = "bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200";
        } else if (color === 'pink') {
          colorClasses = "bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200";
        } else if (color === 'blue') {
          colorClasses = "bg-sky-100 text-sky-900 border-sky-300 hover:bg-sky-200";
        }

        return (
          <mark
            key={`ann-hl-${index}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onAnnotationHighlightClick) {
                onAnnotationHighlightClick(part);
              } else {
                onHighlightClick?.(part);
              }
            }}
            className={`${colorClasses} px-1 py-0.5 rounded cursor-help font-semibold border-b transition-colors inline-block`}
            title={`Click to view private annotation on: "${part}"`}
          >
            {part}
          </mark>
        );
      }

      const isComment = activeCommentHLs.some(h => h.toLowerCase() === part.toLowerCase());
      if (isComment) {
        return (
          <mark
            key={`hl-${index}`}
            onClick={(e) => {
              e.stopPropagation();
              onHighlightClick?.(part);
            }}
            className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded cursor-help font-semibold border-b border-amber-300 hover:bg-amber-200 transition-colors inline-block"
            title={`Click to view feedback on: "${part}"`}
          >
            {part}
          </mark>
        );
      }
      return processVocabText(part, index);
    });
  }

  const fontClass = 
    fontFamily === 'font-serif' ? 'font-serif' :
    fontFamily === 'font-mono' ? 'font-mono' :
    fontFamily === 'font-cursive' ? 'font-handwritten' : 'font-sans';

  return (
    <motion.div
      key={content ? content.slice(0, 100) : 'empty'}
      initial="hidden"
      animate="visible"
      variants={staggerContainerVariants}
      className={`markdown-body ${fontClass} text-slate-800`}
    >
      {elements}
    </motion.div>
  );
}

function DbImageRefLoader({ url, alt, className }: { url: string; alt: string; className: string }) {
  const [src, setSrc] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!url || !url.startsWith('db-image-ref:')) {
      setSrc(url);
      setLoading(false);
      return;
    }

    const rawRef = url.replace('db-image-ref:', '');
    const [docId, imgSuffix] = rawRef.split('_img');
    const imageIdTarget = imgSuffix ? `db-image-ref:${rawRef}` : `db-image-ref:${docId}`;

    setLoading(true);
    const fetchChunks = async () => {
      try {
        const chunksColRef = collection(db, 'documents', docId, 'imageChunks');
        const snap = await getDocs(chunksColRef);

        if (!snap.empty) {
          const docChunks: { idx: number; data: string }[] = [];
          snap.forEach((chunkDoc) => {
            const data = chunkDoc.data();
            if (!data.imageId || data.imageId === imageIdTarget || snap.size === data.total) {
              docChunks.push({ idx: data.idx, data: data.data });
            }
          });

          docChunks.sort((a, b) => a.idx - b.idx);
          const fullBase64 = docChunks.map((c) => c.data).join('');
          if (fullBase64) {
            setSrc(fullBase64);
          } else {
            const allChunks: { idx: number; data: string }[] = [];
            snap.forEach((chunkDoc) => {
              const data = chunkDoc.data();
              allChunks.push({ idx: data.idx, data: data.data });
            });
            allChunks.sort((a, b) => a.idx - b.idx);
            setSrc(allChunks.map((c) => c.data).join(''));
          }
        }
      } catch (err) {
        console.error('[DbImageRefLoader Error]', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChunks();
  }, [url]);

  if (loading && url.startsWith('db-image-ref:')) {
    return (
      <div className="w-full h-48 bg-amber-50/60 border border-amber-200/60 animate-pulse rounded-xl flex flex-col items-center justify-center p-4 text-xs text-amber-800 font-semibold gap-2">
        <span className="text-lg">🖼️</span>
        <span>Loading high-resolution document image...</span>
      </div>
    );
  }

  return (
    <img
      src={src || url}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
}

export default React.memo(MarkdownView);
