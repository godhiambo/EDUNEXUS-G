/**
 * Quick Format Utility for Educational Content
 * Automatically applies standard professional educational headings, lists, 
 * bold key terms, and clean spacing to raw dictated or pasted text.
 */

export function quickFormatEducationalText(rawText: string): string {
  if (!rawText || !rawText.trim()) return rawText;

  // Split lines
  let lines = rawText.split(/\r?\n/);
  let formattedLines: string[] = [];
  let inList = false;

  // Patterns for standard educational section headers
  const sectionHeaderPatterns = [
    { regex: /^(lesson\s+objectives?|objectives?|learning\s+outcomes?|outcomes?):?/i, header: '## 1. LESSON OBJECTIVES' },
    { regex: /^(key\s+concepts?|core\s+concepts?|background|introduction|hook|warm-?up):?/i, header: '## 2. KEY CONCEPTS & INTRODUCTION' },
    { regex: /^(classroom\s+activities|learning\s+activities|guided\s+practice|activities|step\s+by\s+step|procedure):?/i, header: '## 3. CLASSROOM ACTIVITIES' },
    { regex: /^(assessment|evaluation|quiz|check\s+for\s+understanding|rubric\s+criteria):?/i, header: '## 4. ASSESSMENT & REFLECTION' },
    { regex: /^(learning\s+resources|materials|teaching\s+aids|requirements):?/i, header: '## 5. RESOURCES & MATERIALS' },
  ];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line) {
      formattedLines.push('');
      inList = false;
      continue;
    }

    // Check if line matches an educational section header keyword
    let matchedHeader = false;
    for (const item of sectionHeaderPatterns) {
      if (item.regex.test(line)) {
        const rest = line.replace(item.regex, '').trim();
        formattedLines.push(item.header);
        if (rest) {
          formattedLines.push(`- ${capitalizeFirstLetter(rest)}`);
        }
        matchedHeader = true;
        inList = true;
        break;
      }
    }

    if (matchedHeader) continue;

    // Convert raw numbered prefixes or bullet words like "point 1", "bullet", "step 1", etc.
    if (/^(point\s*\d+|bullet|step\s*\d+|-\s*|\*\s*|\d+[\.\)])\s*/i.test(line)) {
      const cleaned = line.replace(/^(point\s*\d+|bullet|step\s*\d+|-\s*|\*\s*|\d+[\.\)])\s*/i, '').trim();
      formattedLines.push(`- ${capitalizeFirstLetter(cleaned)}`);
      inList = true;
      continue;
    }

    // Convert sequence words at start of line (e.g. "First,", "Second,", "Third,", "Next,", "Finally,") to bullet list items
    if (/^(firstly?|secondly?|thirdly?|next|then|finally|furthermore|in\s+addition),?\s+/i.test(line)) {
      const match = line.match(/^(firstly?|secondly?|thirdly?|next|then|finally|furthermore|in\s+addition)/i);
      const prefix = match ? match[0].toUpperCase() : 'STEP';
      const cleaned = line.replace(/^(firstly?|secondly?|thirdly?|next|then|finally|furthermore|in\s+addition),?\s+/i, '').trim();
      formattedLines.push(`- **${prefix}:** ${capitalizeFirstLetter(cleaned)}`);
      inList = true;
      continue;
    }

    // Bold key-value labels like "Subject: Maths", "Duration: 40 mins", "Grade: Grade 5"
    if (/^[A-Z][a-zA-Z\s]{1,20}:\s+.+/.test(line) && !line.startsWith('http') && !line.startsWith('**')) {
      const colonIdx = line.indexOf(':');
      const key = line.substring(0, colonIdx).trim();
      const val = line.substring(colonIdx + 1).trim();
      formattedLines.push(`**${key}:** ${val}`);
      continue;
    }

    // Capitalize sentence starts if lowercase
    line = capitalizeFirstLetter(line);

    // If text looks like a list item (short phrase under 90 chars) and previous line was in a list
    if (inList && line.length < 90 && !line.endsWith('.') && !line.startsWith('##') && !line.startsWith('-')) {
      formattedLines.push(`- ${line}`);
    } else {
      formattedLines.push(line);
    }
  }

  // Join lines and clean up excessive empty lines
  let result = formattedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return result;
}

function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
