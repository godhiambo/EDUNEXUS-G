export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

/**
 * Performs a word-level diff between two texts.
 * Highlight additions (added) and deletions (removed).
 */
export function diffWords(oldText: string, newText: string): DiffPart[] {
  const cleanOld = oldText || "";
  const cleanNew = newText || "";

  // Split text into words and non-words (including spaces, newlines, and punctuation)
  const tokenize = (text: string): string[] => {
    return text.match(/([a-zA-Z0-9]+|\s+|\r\n|\n|[^\s\w]+)/g) || [];
  };

  const a = tokenize(cleanOld);
  const b = tokenize(cleanNew);
  const n = a.length;
  const m = b.length;

  // Protect against slow browser execution on huge inputs
  if (n * m > 1000000) {
    return diffLines(cleanOld, cleanNew);
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffPart[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ value: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ value: b[j - 1], added: true });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ value: a[i - 1], removed: true });
      i--;
    }
  }

  // Combine consecutive items of the same type to simplify rendering
  const combined: DiffPart[] = [];
  for (const part of result) {
    const last = combined[combined.length - 1];
    if (last && last.added === part.added && last.removed === part.removed) {
      last.value += part.value;
    } else {
      combined.push({ ...part });
    }
  }

  return combined;
}

/**
 * Performs a line-by-line diff for larger inputs.
 */
export function diffLines(oldText: string, newText: string): DiffPart[] {
  const cleanOld = oldText || "";
  const cleanNew = newText || "";

  const a = cleanOld.split('\n');
  const b = cleanNew.split('\n');
  const n = a.length;
  const m = b.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffPart[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ value: a[i - 1] + '\n' });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ value: b[j - 1] + '\n', added: true });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ value: a[i - 1] + '\n', removed: true });
      i--;
    }
  }

  const combined: DiffPart[] = [];
  for (const part of result) {
    const last = combined[combined.length - 1];
    if (last && last.added === part.added && last.removed === part.removed) {
      last.value += part.value;
    } else {
      combined.push({ ...part });
    }
  }

  return combined;
}
