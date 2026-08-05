export interface HeadingItem {
  id: string;
  text: string;
  level: number; // 1 = H1 (#), 2 = H2 (##), 3 = H3 (###)
  pageNumber?: number; // Calculated estimated page number for print & document index
  charIndex?: number;
  lineIndex?: number;
}

export interface PedagogicalPhaseGroup {
  id: string;
  phaseName: string;
  shortName: string;
  badgeColor: string;
  iconEmoji: string;
  iconName: 'Sparkles' | 'GraduationCap' | 'PenTool' | 'Target' | 'Layers';
  headings: HeadingItem[];
}

/**
 * Creates a URL/ID-safe slug from a heading string.
 */
export function slugifyHeading(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '') // strip any inline html tags
    .replace(/[*_~`#\[\]()]/g, '') // strip markdown formatting characters
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special punctuation
    .replace(/\s+/g, '-'); // collapse whitespace to hyphen
}

/**
 * Extracts document headings (#, ##, ###) for auto-generating Table of Contents.
 */
export function extractDocumentHeadings(markdown: string): HeadingItem[] {
  if (!markdown || typeof markdown !== 'string') return [];

  const lines = markdown.split('\n');
  const headings: HeadingItem[] = [];
  const slugCounts: Record<string, number> = {};
  let currentLength = 0;

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    // Check for markdown heading indicators
    if (trimmed.startsWith('#')) {
      let level = 1;
      if (trimmed.startsWith('###')) level = 3;
      else if (trimmed.startsWith('##')) level = 2;
      else if (trimmed.startsWith('#')) level = 1;

      // Clean heading raw text
      const rawText = trimmed
        .replace(/^#+\s*/, '')
        .replace(/[*_~`]/g, '')
        .replace(/\[!.*?\]/gi, '') // remove callout tags if any
        .trim();

      if (rawText) {
        let slug = slugifyHeading(rawText) || `heading-${headings.length + 1}`;
        
        // Ensure unique IDs if document has identical heading names
        if (slugCounts[slug] !== undefined) {
          slugCounts[slug]++;
          slug = `${slug}-${slugCounts[slug]}`;
        } else {
          slugCounts[slug] = 0;
        }

        // Estimate page number: ~40 lines per A4/Letter print page or ~2000 chars
        const pageByLines = Math.max(1, Math.ceil((lineIndex + 1) / 40));
        const pageByChars = Math.max(1, Math.ceil((currentLength + 1) / 2000));
        const pageNumber = Math.max(pageByLines, pageByChars);

        headings.push({
          id: slug,
          text: rawText,
          level,
          pageNumber,
          charIndex: currentLength,
          lineIndex,
        });
      }
    }
    currentLength += line.length + 1;
  });

  return headings;
}

/**
 * Categorizes document headings into logical pedagogical phase groups
 * based on heading keywords, document metadata, and position.
 */
export function groupHeadingsByPedagogicalPhase(
  headings: HeadingItem[],
  metadata?: {
    lessonLayout?: string;
    docType?: string;
    category?: string;
  }
): PedagogicalPhaseGroup[] {
  if (!headings || headings.length === 0) return [];

  // Create base template for pedagogical phase groups
  const phases: PedagogicalPhaseGroup[] = [
    {
      id: 'phase-intro',
      phaseName: 'Introduction & Warm-Up',
      shortName: 'Introduction',
      badgeColor: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300',
      iconEmoji: '🌱',
      iconName: 'Sparkles',
      headings: [],
    },
    {
      id: 'phase-guided',
      phaseName: 'Guided Practice & Instruction',
      shortName: 'Guided Practice',
      badgeColor: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300',
      iconEmoji: '👨‍🏫',
      iconName: 'GraduationCap',
      headings: [],
    },
    {
      id: 'phase-independent',
      phaseName: 'Independent Work & Application',
      shortName: 'Independent Work',
      badgeColor: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300',
      iconEmoji: '✍️',
      iconName: 'PenTool',
      headings: [],
    },
    {
      id: 'phase-assessment',
      phaseName: 'Assessment & Reflection',
      shortName: 'Assessment',
      badgeColor: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300',
      iconEmoji: '🎯',
      iconName: 'Target',
      headings: [],
    },
    {
      id: 'phase-extensions',
      phaseName: 'Extensions & Resources',
      shortName: 'Extensions',
      badgeColor: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/60 dark:border-purple-800 dark:text-purple-300',
      iconEmoji: '📚',
      iconName: 'Layers',
      headings: [],
    },
  ];

  const matchKeyword = (text: string, keywords: string[]) => {
    const lower = text.toLowerCase();
    return keywords.some((kw) => lower.includes(kw));
  };

  const introKeywords = [
    'introduction', 'intro', 'hook', 'warm-up', 'warmup', 'starter',
    'engage', 'engagement', 'prior knowledge', 'overview', 'learning outcome',
    'learning objectives', 'objective', 'inquiry question', 'anticipatory',
    'background', 'foundation', 'key concept', 'preparation', 'prerequisite'
  ];

  const guidedKeywords = [
    'guided practice', 'direct instruction', 'teacher model', 'modeling',
    'explanation', 'explore', 'explain', 'demonstration', 'instructional',
    'step-by-step', 'lesson development', 'main activity', 'presentation',
    'guided', 'teaching', 'concept introduction', 'worked example'
  ];

  const independentKeywords = [
    'independent work', 'independent practice', 'group activity', 'student activity',
    'application', 'exercise', 'exercises', 'hands-on', 'problem solving',
    'elaborate', 'task', 'practice', 'worksheet', 'group work', 'pair work',
    'individual activity', 'student task', 'assignment', 'challenge'
  ];

  const assessmentKeywords = [
    'assessment', 'formative assessment', 'summative assessment', 'evaluation',
    'evaluate', 'exit ticket', 'reflection', 'closure', 'plenary', 'summary',
    'conclusion', 'quiz', 'check for understanding', 'review', 'marking scheme',
    'rubric', 'self-assessment', 'peer assessment'
  ];

  const extensionsKeywords = [
    'differentiation', 'extension', 'remedial', 'enrichment', 'homework',
    'resources', 'vocabulary', 'glossary', 'appendix', 'further reading',
    'materials', 'references', 'teacher notes'
  ];

  const total = headings.length;

  headings.forEach((heading, idx) => {
    const text = heading.text;

    if (matchKeyword(text, introKeywords)) {
      phases[0].headings.push(heading);
    } else if (matchKeyword(text, guidedKeywords)) {
      phases[1].headings.push(heading);
    } else if (matchKeyword(text, independentKeywords)) {
      phases[2].headings.push(heading);
    } else if (matchKeyword(text, assessmentKeywords)) {
      phases[3].headings.push(heading);
    } else if (matchKeyword(text, extensionsKeywords)) {
      phases[4].headings.push(heading);
    } else {
      // Positional heuristic fallback if no explicit keyword matches
      const ratio = idx / total;
      if (ratio < 0.25) {
        phases[0].headings.push(heading);
      } else if (ratio < 0.55) {
        phases[1].headings.push(heading);
      } else if (ratio < 0.8) {
        phases[2].headings.push(heading);
      } else {
        phases[3].headings.push(heading);
      }
    }
  });

  return phases.filter((group) => group.headings.length > 0);
}

