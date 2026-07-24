/**
 * Utility to calculate readability metrics of text.
 * Helps teachers adapt generated materials for different student reading abilities.
 */

interface ReadabilityResult {
  wordCount: number;
  sentenceCount: number;
  characterCount: number;
  syllableCount: number;
  fleschReadingEase: number;
  fleschKincaidGradeLevel: number;
  automatedReadabilityIndex: number;
  consensusGradeLevel: number; // Combined average grade level
  gradeLabel: string; // User friendly description
  colorClass: string; // Color coding based on complexity
  bgClass: string; // Light background color for UI banners
  borderClass: string; // Border color for UI banners
  textClass: string; // Accent text color
}

/**
 * Counts syllables in a single English word using a robust heuristic.
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length === 0) return 0;
  if (word.length <= 3) return 1;

  // Clean common suffixes
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  // Match vowel groups
  const matches = word.match(/[aeiouy]{1,2}/g);
  const count = matches ? matches.length : 1;
  
  return count > 0 ? count : 1;
}

/**
 * Parses text and computes readability metrics.
 */
export function calculateReadability(text: string): ReadabilityResult {
  if (!text || text.trim().length === 0) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      characterCount: 0,
      syllableCount: 0,
      fleschReadingEase: 100,
      fleschKincaidGradeLevel: 0,
      automatedReadabilityIndex: 0,
      consensusGradeLevel: 0,
      gradeLabel: 'N/A (Empty Text)',
      colorClass: 'text-slate-500 bg-slate-50',
      bgClass: 'bg-slate-50',
      borderClass: 'border-slate-200',
      textClass: 'text-slate-700'
    };
  }

  // Remove markdown formatting to analyze clean text
  const cleanText = text
    .replace(/[#*`_~\[\]\(\)\-+\d\.\r]/g, ' ') // Strip markdown chars, lists, and numbers
    .replace(/\s+/g, ' ')                      // Normalize spacing
    .trim();

  // Extract sentences: split by typical sentence-ending punctuation followed by space or end-of-text
  const sentences = cleanText
    .split(/[.!?]+(?=\s|$)/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  const sentenceCount = Math.max(1, sentences.length);

  // Extract words
  const words = cleanText
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z]/g, '')) // Keep alphabetical chars
    .filter(w => w.length > 0);

  const wordCount = Math.max(1, words.length);

  // Character count (alphanumeric only, for ARI)
  const characterCount = cleanText.replace(/[^a-zA-Z0-9]/g, '').length;

  // Syllables count
  let syllableCount = 0;
  for (const word of words) {
    syllableCount += countSyllables(word);
  }

  // Average Sentence Length (ASL)
  const asl = wordCount / sentenceCount;

  // Average Syllables per Word (ASW)
  const asw = syllableCount / wordCount;

  // Flesch Reading Ease Formula
  // FRE = 206.835 - (1.015 * ASL) - (84.6 * ASW)
  let fleschReadingEase = 206.835 - (1.015 * asl) - (84.6 * asw);
  fleschReadingEase = Math.max(0, Math.min(100, Math.round(fleschReadingEase * 10) / 10));

  // Flesch-Kincaid Grade Level Formula
  // FKGL = (0.39 * ASL) + (11.8 * ASW) - 15.59
  let fkgl = (0.39 * asl) + (11.8 * asw) - 15.59;
  fkgl = Math.max(0, Math.round(fkgl * 10) / 10);

  // Automated Readability Index (ARI) Formula
  // ARI = 4.71 * (characters/words) + 0.5 * (words/sentences) - 21.43
  let ari = 4.71 * (characterCount / wordCount) + 0.5 * asl - 21.43;
  ari = Math.max(0, Math.round(ari * 10) / 10);

  // Consensus Grade Level (Weighted average of FKGL and ARI)
  const consensusGradeLevel = Math.round(((fkgl + ari) / 2) * 10) / 10;

  // Determine user friendly label and colors
  let gradeLabel = '';
  let colorClass = '';
  let bgClass = '';
  let borderClass = '';
  let textClass = '';

  if (consensusGradeLevel <= 2.5) {
    gradeLabel = 'Early Reader (Grade 1-2)';
    colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-150';
    bgClass = 'bg-emerald-50/70';
    borderClass = 'border-emerald-100';
    textClass = 'text-emerald-700';
  } else if (consensusGradeLevel <= 4.5) {
    gradeLabel = 'Lower Primary (Grade 3-4)';
    colorClass = 'text-teal-700 bg-teal-50 border-teal-150';
    bgClass = 'bg-teal-50/70';
    borderClass = 'border-teal-100';
    textClass = 'text-teal-700';
  } else if (consensusGradeLevel <= 6.5) {
    gradeLabel = 'Upper Primary (Grade 5-6)';
    colorClass = 'text-sky-700 bg-sky-50 border-sky-150';
    bgClass = 'bg-sky-50/70';
    borderClass = 'border-sky-100';
    textClass = 'text-sky-700';
  } else if (consensusGradeLevel <= 8.5) {
    gradeLabel = 'Junior School (Grade 7-8)';
    colorClass = 'text-indigo-700 bg-indigo-50 border-indigo-150';
    bgClass = 'bg-indigo-50/70';
    borderClass = 'border-indigo-100';
    textClass = 'text-indigo-700';
  } else if (consensusGradeLevel <= 10.5) {
    gradeLabel = 'High School (Grade 9-10)';
    colorClass = 'text-amber-700 bg-amber-50 border-amber-150';
    bgClass = 'bg-amber-50/70';
    borderClass = 'border-amber-100';
    textClass = 'text-amber-700';
  } else if (consensusGradeLevel <= 12.5) {
    gradeLabel = 'Senior Secondary (Grade 11-12)';
    colorClass = 'text-orange-700 bg-orange-50 border-orange-150';
    bgClass = 'bg-orange-50/70';
    borderClass = 'border-orange-100';
    textClass = 'text-orange-700';
  } else {
    gradeLabel = 'Advanced Secondary & Higher Ed (Grade 13+)';
    colorClass = 'text-rose-700 bg-rose-50 border-rose-150';
    bgClass = 'bg-rose-50/70';
    borderClass = 'border-rose-100';
    textClass = 'text-rose-700';
  }

  return {
    wordCount,
    sentenceCount,
    characterCount,
    syllableCount,
    fleschReadingEase,
    fleschKincaidGradeLevel: fkgl,
    automatedReadabilityIndex: ari,
    consensusGradeLevel,
    gradeLabel,
    colorClass,
    bgClass,
    borderClass,
    textClass
  };
}
