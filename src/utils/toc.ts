export interface HeadingItem {
  id: string;
  text: string;
  level: number; // 1 = H1 (#), 2 = H2 (##), 3 = H3 (###)
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

  lines.forEach((line) => {
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

        headings.push({
          id: slug,
          text: rawText,
          level,
        });
      }
    }
  });

  return headings;
}
