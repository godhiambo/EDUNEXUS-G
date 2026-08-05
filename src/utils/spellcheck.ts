/**
 * Real-Time Educational Spellcheck & Grammar Correction Utility
 * Provides fast client-side dictionary lookup + AI-backed spellchecking
 */

export interface SpellError {
  id: string;
  original: string;
  suggestion: string;
  suggestions: string[];
  explanation: string;
  severity: 'error' | 'warning';
  index: number;
  length: number;
}

// Built-in educational, general English, and Kenyan CBC curriculum dictionary terms
const EDUCATIONAL_DICTIONARY = new Set([
  // Core Educational & Pedagogical Terms
  'curriculum', 'pedagogy', 'assessment', 'strand', 'substrand', 'competency',
  'formative', 'summative', 'scaffolding', 'socratic', 'differentiated', 'rubric',
  'syllabus', 'outcome', 'objective', 'inquiry', 'kinesthetic', 'taxonomy',
  'blooms', 'maturation', 'phonetic', 'literacy', 'numeracy', 'stem', 'mathematics',
  'science', 'biology', 'chemistry', 'physics', 'geography', 'history', 'english',
  'kiswahili', 'agriculture', 'home science', 'cre', 'ire', 'hre', 'social studies',
  'pretechnical', 'computer science', 'integrated', 'creative arts', 'sports',
  'physical education', 'improvised', 'experiment', 'hypothesis', 'observation',
  'conclusion', 'methodology', 'lesson', 'plan', 'scheme', 'timetable', 'checklist',
  'portfolio', 'worksheet', 'handout', 'demonstration', 'discussion', 'facilitator',
  'learner', 'student', 'teacher', 'instructor', 'mentor', 'collaborative',

  // Common Academic & General Words
  'ability', 'about', 'above', 'accept', 'according', 'account', 'across', 'act',
  'action', 'activity', 'actually', 'add', 'addition', 'address', 'administration',
  'admit', 'adult', 'advance', 'advise', 'affect', 'after', 'again', 'against',
  'age', 'agency', 'agent', 'agree', 'agreement', 'ahead', 'air', 'allow',
  'almost', 'alone', 'along', 'already', 'also', 'although', 'always', 'american',
  'among', 'amount', 'analysis', 'analyze', 'ancient', 'and', 'animal', 'another',
  'answer', 'any', 'anyone', 'anything', 'appear', 'apply', 'approach', 'area',
  'argue', 'arm', 'around', 'arrive', 'art', 'article', 'artist', 'as', 'ask',
  'aspect', 'assign', 'assignment', 'assist', 'assistance', 'assistant', 'associate',
  'assume', 'at', 'attempt', 'attend', 'attention', 'attitude', 'attract', 'audience',
  'author', 'authority', 'available', 'average', 'avoid', 'back', 'background',
  'bad', 'bag', 'balance', 'ball', 'bank', 'bar', 'base', 'basic', 'basis',
  'be', 'bear', 'beat', 'beautiful', 'because', 'become', 'bed', 'before',
  'begin', 'beginning', 'behavior', 'behind', 'believe', 'benefit', 'best',
  'better', 'between', 'beyond', 'big', 'bill', 'billion', 'biological', 'biology',
  'bit', 'black', 'blood', 'blue', 'board', 'body', 'book', 'both', 'bother',
  'bottom', 'boy', 'break', 'brief', 'bring', 'brother', 'budget', 'build',
  'building', 'business', 'but', 'buy', 'by', 'call', 'camera', 'campaign',
  'can', 'cancer', 'candidate', 'capital', 'car', 'card', 'care', 'career',
  'carry', 'case', 'catch', 'cause', 'cell', 'center', 'central', 'century',
  'certain', 'certainly', 'chain', 'chair', 'challenge', 'chance', 'change',
  'character', 'charge', 'chart', 'check', 'chemical', 'child', 'choice',
  'choose', 'church', 'citizen', 'city', 'civil', 'claim', 'class', 'classroom',
  'clear', 'clearly', 'close', 'coach', 'coal', 'collection', 'college', 'color',
  'come', 'commercial', 'common', 'community', 'company', 'compare', 'comparison',
  'compete', 'complaint', 'complete', 'completely', 'complex', 'component',
  'concept', 'concern', 'conclusion', 'condition', 'conduct', 'conference',
  'confidence', 'confirm', 'conflict', 'congress', 'connect', 'connection',
  'consider', 'consideration', 'consist', 'consistent', 'constant', 'contain',
  'content', 'continue', 'contract', 'contrast', 'contribute', 'control',
  'conversation', 'convert', 'copy', 'core', 'cost', 'could', 'country',
  'couple', 'course', 'court', 'cover', 'create', 'creation', 'creative',
  'crime', 'cultural', 'culture', 'cup', 'current', 'currently', 'customer',
  'cut', 'data', 'database', 'date', 'daughter', 'day', 'deal', 'debate',
  'decade', 'decide', 'decision', 'deep', 'defense', 'degree', 'democrat',
  'democratic', 'demonstrate', 'department', 'depend', 'description', 'design',
  'despite', 'detail', 'detailed', 'determine', 'develop', 'development',
  'device', 'dictation', 'difference', 'different', 'difficult', 'difficulty',
  'direction', 'directly', 'director', 'discover', 'discuss', 'discussion',
  'disease', 'display', 'distance', 'distribution', 'district', 'divide',
  'doctor', 'document', 'does', 'dog', 'door', 'double', 'down', 'draw',
  'drawing', 'dream', 'drive', 'drop', 'due', 'during', 'each', 'early',
  'east', 'easy', 'eat', 'economic', 'economy', 'edge', 'edit', 'editor',
  'education', 'educational', 'effect', 'effective', 'efficiency', 'effort',
  'eight', 'either', 'election', 'element', 'elementary', 'else', 'email',
  'employee', 'empower', 'enable', 'end', 'energy', 'enforcement', 'engine',
  'engineer', 'engineering', 'english', 'enhance', 'enjoy', 'enough', 'ensure',
  'enter', 'entire', 'environment', 'environmental', 'equal', 'equipment',
  'era', 'error', 'escape', 'especially', 'establish', 'evaluation', 'even',
  'evening', 'event', 'ever', 'every', 'everyone', 'everything', 'evidence',
  'exact', 'exactly', 'examination', 'examine', 'example', 'executive',
  'exist', 'existence', 'expect', 'experience', 'experiment', 'expert',
  'explain', 'explanation', 'explore', 'express', 'expression', 'extend',
  'extent', 'extra', 'eye', 'face', 'fact', 'factor', 'factory', 'faculty',
  'fail', 'failure', 'fall', 'family', 'far', 'fast', 'father', 'fear',
  'feature', 'federal', 'feel', 'feeling', 'few', 'field', 'fifteen', 'fifth',
  'fifty', 'fight', 'figure', 'fill', 'film', 'final', 'finally', 'financial',
  'find', 'fine', 'finger', 'finish', 'fire', 'firm', 'first', 'fish',
  'five', 'floor', 'fly', 'focus', 'follow', 'following', 'food', 'foot',
  'for', 'force', 'foreign', 'forget', 'form', 'formal', 'formation',
  'former', 'forward', 'four', 'fourth', 'frame', 'free', 'freedom',
  'frequently', 'friend', 'from', 'front', 'full', 'function', 'fund',
  'fundamental', 'further', 'future', 'game', 'garden', 'gas', 'general',
  'generation', 'generator', 'geography', 'get', 'girl', 'give', 'glass',
  'global', 'go', 'goal', 'good', 'government', 'grade', 'grant', 'great',
  'green', 'ground', 'group', 'grow', 'growth', 'guess', 'guidance', 'guide',
  'guy', 'hair', 'half', 'hand', 'handle', 'happen', 'happy', 'hard',
  'have', 'head', 'health', 'hear', 'heart', 'heat', 'heavy', 'help',
  'helpful', 'her', 'here', 'herself', 'high', 'highlight', 'him', 'himself',
  'his', 'history', 'hit', 'hold', 'home', 'hope', 'hospital', 'host',
  'hot', 'hour', 'house', 'how', 'however', 'huge', 'human', 'hundred',
  'husband', 'idea', 'identify', 'identity', 'if', 'ignore', 'image',
  'imagine', 'impact', 'important', 'improve', 'improvement', 'in', 'include',
  'including', 'increase', 'indeed', 'indicate', 'individual', 'industry',
  'information', 'initial', 'input', 'inside', 'instance', 'instead',
  'institution', 'instruction', 'instructional', 'instruction', 'integrate',
  'integrated', 'intellectual', 'intense', 'intention', 'interaction',
  'interest', 'interesting', 'internal', 'international', 'interview', 'into',
  'introduce', 'introduction', 'invent', 'investment', 'involve', 'issue',
  'it', 'item', 'its', 'itself', 'job', 'join', 'journal', 'journey',
  'judge', 'judgment', 'just', 'keep', 'kenya', 'kenyan', 'key', 'kid',
  'kill', 'kind', 'knowledge', 'knows', 'label', 'labor', 'laboratory',
  'lack', 'lady', 'land', 'language', 'large', 'last', 'late', 'later',
  'laugh', 'law', 'lawyer', 'lay', 'lead', 'leader', 'leadership', 'leading',
  'learn', 'learner', 'learning', 'least', 'leave', 'left', 'leg', 'legal',
  'lesson', 'let', 'letter', 'level', 'library', 'life', 'light', 'like',
  'likely', 'line', 'list', 'listen', 'literacy', 'literature', 'little',
  'live', 'local', 'location', 'long', 'look', 'lose', 'loss', 'lot',
  'love', 'low', 'machine', 'magazine', 'main', 'maintain', 'major', 'majority',
  'make', 'man', 'manage', 'management', 'manager', 'many', 'map', 'margin',
  'mark', 'market', 'marriage', 'material', 'math', 'mathematics', 'matter',
  'may', 'maybe', 'me', 'mean', 'meaning', 'measure', 'measurement', 'media',
  'medical', 'medium', 'meet', 'meeting', 'member', 'memory', 'mention',
  'message', 'method', 'methodology', 'micro', 'middle', 'might', 'military',
  'million', 'mind', 'minute', 'miss', 'mission', 'model', 'modern',
  'moment', 'money', 'month', 'more', 'morning', 'most', 'mother', 'motion',
  'move', 'movement', 'movie', 'much', 'music', 'must', 'my', 'myself',
  'name', 'nation', 'national', 'natural', 'nature', 'near', 'nearly',
  'necessary', 'need', 'network', 'never', 'new', 'news', 'newspaper',
  'next', 'nice', 'night', 'nine', 'no', 'nobody', 'noise', 'non',
  'normal', 'north', 'not', 'note', 'nothing', 'notice', 'now', 'number',
  'numeracy', 'object', 'objective', 'observation', 'observe', 'obtain',
  'obvious', 'occur', 'of', 'off', 'offer', 'office', 'officer', 'official',
  'often', 'oh', 'oil', 'ok', 'old', 'on', 'once', 'one', 'online',
  'only', 'onto', 'open', 'operation', 'opinion', 'opportunity', 'opposite',
  'option', 'or', 'order', 'organization', 'organize', 'origin', 'original',
  'other', 'others', 'our', 'out', 'outcome', 'outline', 'output', 'outside',
  'over', 'overall', 'own', 'owner', 'page', 'pain', 'paint', 'paper',
  'parent', 'park', 'part', 'participant', 'particular', 'particularly',
  'partner', 'party', 'pass', 'passage', 'past', 'path', 'patient', 'pattern',
  'pay', 'peace', 'pedagogy', 'peer', 'people', 'per', 'percent', 'perfect',
  'perform', 'performance', 'perhaps', 'period', 'person', 'personal',
  'phone', 'phonetic', 'photo', 'photograph', 'phrase', 'physical', 'physics',
  'pick', 'picture', 'piece', 'place', 'plan', 'plane', 'planet', 'plant',
  'play', 'player', 'point', 'police', 'policy', 'political', 'politics',
  'poor', 'population', 'position', 'positive', 'possibility', 'possible',
  'power', 'practice', 'practise', 'predict', 'prepare', 'present', 'presentation',
  'president', 'pressure', 'pretty', 'prevent', 'price', 'primary', 'principal',
  'principle', 'print', 'prior', 'priority', 'private', 'probably', 'problem',
  'procedure', 'process', 'produce', 'product', 'production', 'professional',
  'professor', 'program', 'progress', 'project', 'property', 'proposal',
  'protect', 'prove', 'provide', 'public', 'publish', 'pull', 'pupil',
  'purpose', 'push', 'put', 'quality', 'question', 'questionnaire', 'quick',
  'quickly', 'quiet', 'quite', 'quiz', 'quote', 'race', 'radio', 'raise',
  'range', 'rate', 'rather', 'reach', 'read', 'reader', 'reading', 'ready',
  'real', 'reality', 'realize', 'really', 'reason', 'receive', 'recent',
  'recently', 'recognize', 'record', 'red', 'reduce', 'reflect', 'reflection',
  'reform', 'regarding', 'region', 'register', 'regular', 'relationship',
  'relate', 'relative', 'release', 'relevant', 'remain', 'remember', 'remove',
  'report', 'represent', 'representation', 'require', 'research', 'resource',
  'respect', 'respond', 'response', 'responsibility', 'responsible', 'rest',
  'result', 'retention', 'return', 'reveal', 'review', 'revision', 'rich',
  'right', 'rise', 'risk', 'road', 'role', 'room', 'root', 'rough',
  'rubric', 'rule', 'run', 'safe', 'same', 'sample', 'save', 'say',
  'scale', 'scaffolding', 'scene', 'scheme', 'school', 'science', 'scientific',
  'scientist', 'scope', 'score', 'sea', 'search', 'season', 'seat',
  'second', 'secondary', 'section', 'security', 'see', 'seek', 'seem',
  'segment', 'select', 'selection', 'self', 'sell', 'send', 'senior',
  'sense', 'sentence', 'separate', 'series', 'serious', 'serve', 'service',
  'session', 'set', 'setting', 'seven', 'several', 'severity', 'shape',
  'share', 'she', 'sheet', 'short', 'should', 'shoulder', 'show', 'side',
  'sign', 'significant', 'similar', 'simple', 'simply', 'since', 'single',
  'site', 'situation', 'six', 'size', 'skill', 'skin', 'small', 'smart',
  'so', 'social', 'society', 'solution', 'some', 'somebody', 'someone',
  'something', 'sometimes', 'son', 'song', 'soon', 'sort', 'sound', 'source',
  'south', 'space', 'speak', 'speaker', 'special', 'specific', 'specifically',
  'speech', 'spelling', 'spend', 'sport', 'staff', 'stage', 'standard',
  'standing', 'start', 'state', 'statement', 'station', 'statistic', 'status',
  'stay', 'step', 'still', 'stock', 'stop', 'storage', 'store', 'story',
  'strand', 'strategy', 'street', 'strength', 'structure', 'student', 'studio',
  'study', 'stuff', 'style', 'sub', 'subject', 'substrand', 'submit',
  'subsequent', 'substance', 'success', 'successful', 'such', 'suggest',
  'suggestion', 'summary', 'summer', 'summative', 'support', 'suppose',
  'sure', 'surface', 'survey', 'sustained', 'swahili', 'syllabus', 'system',
  'table', 'take', 'talk', 'target', 'task', 'tax', 'teach', 'teacher',
  'teaching', 'team', 'technical', 'technology', 'telephone', 'television',
  'tell', 'template', 'ten', 'term', 'test', 'text', 'textbook', 'than',
  'thank', 'that', 'the', 'their', 'them', 'themselves', 'then', 'theory',
  'there', 'therefore', 'these', 'they', 'thing', 'think', 'third', 'this',
  'those', 'though', 'thought', 'thousand', 'three', 'through', 'throughout',
  'throw', 'thus', 'time', 'timeline', 'today', 'together', 'tonight', 'too',
  'tool', 'topic', 'total', 'touch', 'toward', 'towards', 'town', 'track',
  'trade', 'traditional', 'train', 'training', 'transform', 'translation',
  'travel', 'treat', 'treatment', 'tree', 'trial', 'trip', 'trouble',
  'true', 'truth', 'try', 'turn', 'tv', 'two', 'type', 'understand',
  'understanding', 'unit', 'universal', 'university', 'until', 'up', 'upon',
  'us', 'use', 'used', 'useful', 'user', 'usual', 'usually', 'value',
  'variable', 'variety', 'various', 'vector', 'velocity', 'verbal', 'verb',
  'verification', 'verify', 'version', 'very', 'victim', 'video', 'view',
  'village', 'virtual', 'vision', 'visit', 'visual', 'vital', 'vocabulary',
  'voice', 'volume', 'vote', 'wait', 'walk', 'wall', 'want', 'war',
  'warm', 'warning', 'was', 'watch', 'water', 'way', 'we', 'weapon',
  'wear', 'website', 'week', 'weekly', 'weight', 'well', 'west', 'what',
  'whatever', 'wheel', 'when', 'where', 'whether', 'which', 'while', 'white',
  'who', 'whole', 'whom', 'whose', 'why', 'wide', 'wife', 'will',
  'win', 'wind', 'window', 'wish', 'with', 'within', 'without', 'woman',
  'wonder', 'word', 'work', 'workbook', 'worker', 'working', 'worksheet',
  'world', 'worry', 'would', 'write', 'writer', 'writing', 'written', 'wrong',
  'yard', 'yeah', 'year', 'yes', 'yet', 'you', 'young', 'your', 'yourself',
  'zone',

  // Common Swahili Educational Terms
  'mwalimu', 'mwanafunzi', 'shule', 'masomo', 'mada', 'mtihani', 'kiswahili',
  'elimu', 'uandishi', 'kusoma', 'hesabu', 'sayansi', 'jamii', 'uongozi'
]);

// Standard Common Misspellings map for ultra-fast exact matching
const COMMON_MISSPELLINGS: Record<string, string> = {
  'currikulum': 'curriculum',
  'curriculim': 'curriculum',
  'curiculum': 'curriculum',
  'pedagagy': 'pedagogy',
  'pedagogyy': 'pedagogy',
  'assessmnt': 'assessment',
  'assesment': 'assessment',
  'assement': 'assessment',
  'strnd': 'strand',
  'substrnd': 'sub-strand',
  'competensy': 'competency',
  'competancy': 'competency',
  'formativee': 'formative',
  'sumative': 'summative',
  'rubrik': 'rubric',
  'scafolding': 'scaffolding',
  'socratik': 'socratic',
  'diferentiated': 'differentiated',
  'syllbus': 'syllabus',
  'outcoms': 'outcomes',
  'activty': 'activity',
  'actvity': 'activity',
  'inquiryy': 'inquiry',
  'matematics': 'mathematics',
  'mathmatics': 'mathematics',
  'scence': 'science',
  'scienc': 'science',
  'biolgy': 'biology',
  'chemisty': 'chemistry',
  'physic': 'physics',
  'experimnt': 'experiment',
  'hypotesis': 'hypothesis',
  'observasion': 'observation',
  'concluson': 'conclusion',
  'methodlogy': 'methodology',
  'leson': 'lesson',
  'lessn': 'lesson',
  'schem': 'scheme',
  'timetabl': 'timetable',
  'checklst': 'checklist',
  'worksheat': 'worksheet',
  'demostration': 'demonstration',
  'discusiaon': 'discussion',
  'facilitater': 'facilitator',
  'lerner': 'learner',
  'leaner': 'learner',
  'studnt': 'student',
  'techers': 'teachers',
  'teacer': 'teacher',
  'colaborative': 'collaborative',
  'enhanse': 'enhance',
  'recource': 'resource',
  'resourcess': 'resources',
  'instructonal': 'instructional',
  'objectivs': 'objectives',
  'definision': 'definition',
  'knwoledge': 'knowledge',
  'knowlege': 'knowledge',
  'understaning': 'understanding',
  'unnderstand': 'understand',
  'impliment': 'implement',
  'implimentation': 'implementation',
  'guidnes': 'guidelines',
  'exampel': 'example',
  'seperation': 'separation',
  'definately': 'definitely',
  'receivee': 'receive',
  'recieve': 'receive',
  'accross': 'across',
  'becuase': 'because',
  'thier': 'their',
  'theiy': 'they',
  'alot': 'a lot',
  'untill': 'until'
};

// Calculate Levenshtein Distance for spell suggestions
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Fast client-side dictionary spell checker
 */
export function checkTextSpellingClient(
  text: string,
  ignoredWords: Set<string> = new Set()
): SpellError[] {
  if (!text || text.trim().length === 0) return [];

  const errors: SpellError[] = [];
  // Tokenize words with their positions while preserving punctuation boundaries
  const wordRegex = /\b([a-zA-Z]{3,})\b/g;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(text)) !== null) {
    const rawWord = match[1];
    const lowerWord = rawWord.toLowerCase();
    const wordIndex = match.index;

    // Skip numbers, short tokens, ignored words, or words in dictionary
    if (ignoredWords.has(lowerWord) || ignoredWords.has(rawWord)) continue;
    if (EDUCATIONAL_DICTIONARY.has(lowerWord)) continue;

    // Check for exact common misspelling match
    let mainSuggestion = COMMON_MISSPELLINGS[lowerWord];
    let topSuggestions: string[] = [];

    if (mainSuggestion) {
      topSuggestions = [mainSuggestion];
    } else {
      // Find closest dictionary words by Levenshtein distance
      const candidates: { word: string; dist: number }[] = [];
      const dictArray = Array.from(EDUCATIONAL_DICTIONARY);

      for (let i = 0; i < dictArray.length; i++) {
        const dictWord = dictArray[i];
        if (Math.abs(dictWord.length - lowerWord.length) > 2) continue;

        const dist = levenshteinDistance(lowerWord, dictWord);
        if (dist <= 2) {
          candidates.push({ word: dictWord, dist });
        }
        if (candidates.length > 20) break;
      }

      candidates.sort((a, b) => a.dist - b.dist);
      topSuggestions = candidates.slice(0, 3).map(c => {
        // Preserve original capitalization
        if (rawWord[0] === rawWord[0].toUpperCase()) {
          return c.word.charAt(0).toUpperCase() + c.word.slice(1);
        }
        return c.word;
      });

      if (topSuggestions.length > 0) {
        mainSuggestion = topSuggestions[0];
      }
    }

    if (mainSuggestion || topSuggestions.length > 0) {
      errors.push({
        id: `err-${wordIndex}-${rawWord}`,
        original: rawWord,
        suggestion: mainSuggestion || topSuggestions[0],
        suggestions: topSuggestions.length > 0 ? topSuggestions : [mainSuggestion],
        explanation: `Potential spelling error: "${rawWord}". Did you mean "${mainSuggestion || topSuggestions[0]}"?`,
        severity: 'error',
        index: wordIndex,
        length: rawWord.length
      });
    }
  }

  return errors;
}

/**
 * AI-powered spellcheck with local fallback
 */
export async function checkTextSpellingAI(
  text: string,
  ignoredWords: Set<string> = new Set()
): Promise<SpellError[]> {
  const localErrors = checkTextSpellingClient(text, ignoredWords);

  if (!text || text.trim().length < 5) return localErrors;

  try {
    const response = await fetch('/api/spellcheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text })
    });

    if (!response.ok) {
      return localErrors;
    }

    const data = await response.json();
    if (data.errors && Array.isArray(data.errors)) {
      const aiErrors: SpellError[] = [];

      for (const err of data.errors) {
        if (!err.original || ignoredWords.has(err.original.toLowerCase())) continue;

        // Find position in text
        const idx = text.indexOf(err.original);
        aiErrors.push({
          id: `ai-err-${idx}-${err.original}`,
          original: err.original,
          suggestion: err.suggestion,
          suggestions: [err.suggestion],
          explanation: err.explanation || `Suggested replacement for "${err.original}"`,
          severity: err.severity === 'warning' ? 'warning' : 'error',
          index: idx >= 0 ? idx : 0,
          length: err.original.length
        });
      }

      return aiErrors.length > 0 ? aiErrors : localErrors;
    }
  } catch (e) {
    console.warn("AI spellcheck call failed, using local dictionary:", e);
  }

  return localErrors;
}
