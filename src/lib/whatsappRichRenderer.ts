import { jsPDF } from 'jspdf';
import { Resvg } from '@resvg/resvg-js';

export type WhatsAppOutputType =
  | 'simple_text'
  | 'table'
  | 'lesson_plan'
  | 'scheme_of_work'
  | 'timetable'
  | 'examination_paper'
  | 'marking_scheme'
  | 'worksheet'
  | 'study_notes'
  | 'flashcards'
  | 'mind_map'
  | 'progress_report'
  | 'letter'
  | 'certificate'
  | 'checklist'
  | 'diagram'
  | 'chart'
  | 'graph'
  | 'math_equation'
  | 'chemistry_formula'
  | 'physics_diagram'
  | 'rubric'
  | 'cat_exam'
  | 'ppt_outline'
  | 'notes'
  | 'ai_tutor'
  | 'general';

export type UserWhatsAppOutputPreference =
  | 'auto'
  | 'mobile_text'
  | 'pdf_document'
  | 'image_document'
  | 'rich_report';

export interface DocumentRenderResult {
  outputType: WhatsAppOutputType;
  docTitle: string;
  pdfBuffer: Buffer;
  previewPngBuffer: Buffer;
  captionText: string;
  followUpPromptText: string;
  fileName: string;
}

/**
 * Intelligent Output Classifier
 * Determines the document / media category of AI output based on query & text cues.
 */
export function classifyWhatsAppOutput(promptText: string, aiText: string): WhatsAppOutputType {
  const p = promptText.toLowerCase();
  const t = aiText.toLowerCase();

  if (p.includes('lesson plan') || t.includes('lesson plan') || t.includes('learning outcomes') || t.includes('lesson preparation')) {
    return 'lesson_plan';
  }
  if (p.includes('scheme of work') || t.includes('scheme of work') || (t.includes('week') && t.includes('strand') && t.includes('sub-strand'))) {
    return 'scheme_of_work';
  }
  if (p.includes('exam') || p.includes('cat ') || p.includes('test') || t.includes('examination') || t.includes('time: 2 hours') || t.includes('section a')) {
    return 'examination_paper';
  }
  if (p.includes('marking scheme') || p.includes('rubric') || t.includes('marking scheme') || t.includes('answer key') || t.includes('marks allocation')) {
    return 'marking_scheme';
  }
  if (p.includes('worksheet') || t.includes('worksheet') || (t.includes('student name:') && t.includes('exercise'))) {
    return 'worksheet';
  }
  if (p.includes('report') || t.includes('progress report') || t.includes('academic performance') || t.includes('attendance:')) {
    return 'progress_report';
  }
  if (p.includes('certificate') || t.includes('certificate of') || t.includes('awarded to') || t.includes('successfully completed')) {
    return 'certificate';
  }
  if (p.includes('timetable') || p.includes('schedule') || t.includes('timetable') || t.includes('period 1') || t.includes('time table')) {
    return 'timetable';
  }
  if (p.includes('mind map') || t.includes('mind map') || t.includes('central topic')) {
    return 'mind_map';
  }
  if (p.includes('chemistry') || t.includes('chemical equation') || t.includes('reaction') || /\b(c\d+h\d+|h2so4|naoh|h2o|co2)\b/i.test(t)) {
    return 'chemistry_formula';
  }
  if (p.includes('physics') || t.includes('free-body') || t.includes('circuit diagram') || t.includes('v = ir') || t.includes('f = ma')) {
    return 'physics_diagram';
  }
  if (p.includes('math') || t.includes('equation') || t.includes('f(x)=') || t.includes('∫') || t.includes('solve for x')) {
    return 'math_equation';
  }
  if (t.includes('|---') || t.split('\n').filter(line => line.includes('|')).length >= 3) {
    return 'table';
  }
  if (p.includes('flashcard') || t.includes('flashcard') || t.includes('front:') && t.includes('back:')) {
    return 'flashcards';
  }
  if (p.includes('checklist') || t.includes('[ ]') || t.includes('[x]')) {
    return 'checklist';
  }
  if (p.includes('letter') || t.includes('dear parent') || t.includes('dear student') || t.includes('sincerely')) {
    return 'letter';
  }
  if (t.length > 1500 || t.split('\n').length > 25) {
    return 'study_notes';
  }

  return 'simple_text';
}

/**
 * Format plain text specifically for WhatsApp rich text standards.
 * Converts markdown tables to clean bullet lists, applies single asterisk bolds,
 * adds emojis, spacing, and appends interactive follow-up prompts.
 */
export function formatWhatsAppRichText(
  aiText: string,
  outputType: WhatsAppOutputType,
  userName: string = 'Learner',
  customFollowUpBlock?: string
): string {
  let text = aiText;

  // Replace Markdown Headings (### Header -> *Header*)
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '🔹 *$1*');

  // Convert Bold **text** -> *text*
  text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');

  // Convert Code blocks ``` -> ```
  // Convert bullet lists - item -> • item
  text = text.replace(/^\s*[-*]\s+/gm, '• ');

  // Convert Markdown Tables into clean bulleted item blocks if present
  if (text.includes('|')) {
    const lines = text.split('\n');
    const cleanedLines: string[] = [];
    let inTable = false;
    let headers: string[] = [];

    for (const line of lines) {
      if (line.trim().startsWith('|') && line.includes('|')) {
        const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
        if (cells.length === 0) continue;

        // Skip divider line like |---|---|
        if (cells.every(c => /^[-:]+$/.test(c))) {
          inTable = true;
          continue;
        }

        if (!inTable && headers.length === 0) {
          headers = cells;
          inTable = true;
          cleanedLines.push('\n📊 *Summary Table:*');
        } else {
          // Row
          if (headers.length > 0 && cells.length >= 1) {
            const formattedRow = cells.map((cell, idx) => {
              const header = headers[idx] || `Col ${idx + 1}`;
              return `*${header}:* ${cell}`;
            }).join(' | ');
            cleanedLines.push(`• ${formattedRow}`);
          } else {
            cleanedLines.push(`• ${cells.join(' — ')}`);
          }
        }
      } else {
        inTable = false;
        headers = [];
        cleanedLines.push(line);
      }
    }
    text = cleanedLines.join('\n');
  }

  // Ensure double line breaks between paragraphs for mobile accessibility & readability
  text = text.replace(/\n{3,}/g, '\n\n');

  if (customFollowUpBlock !== undefined) {
    return text.trim() + customFollowUpBlock;
  }

  // Contextual Interactive Follow-up Prompt
  const followUps = getFollowUpOptions(outputType);
  const followUpBlock = `\n\n💡 *Interactive Follow-ups (Reply to action):*\n${followUps.map(f => `• ${f}`).join('\n')}`;

  return text.trim() + followUpBlock;
}

/**
 * Returns contextual follow-up options for WhatsApp interactive reply
 */
export function getFollowUpOptions(outputType: WhatsAppOutputType): string[] {
  switch (outputType) {
    case 'ai_tutor':
    case 'math_equation':
    case 'chemistry_formula':
    case 'physics_diagram':
      return [
        '🧠 Reply *"Next Step"*',
        '📝 Reply *"Practice Question"*',
        '📊 Reply *"Quiz Me"*',
        '🖼️ Reply *"Diagram"*',
        '🎥 Reply *"Animation"*',
        '📖 Reply *"Summary Notes"*',
        '❓ Reply *"Common Mistakes"*'
      ];
    case 'lesson_plan':
    case 'scheme_of_work':
      return [
        '📄 Reply *"Worksheet"*',
        '📝 Reply *"CAT Exam"*',
        '📊 Reply *"Rubric"*',
        '🎥 Reply *"Presentation"*',
        '📖 Reply *"Lesson Notes"*'
      ];
    case 'examination_paper':
    case 'marking_scheme':
      return [
        '✅ Reply *"Generate marking scheme"*',
        '📝 Reply *"Adjust difficulty level"*',
        '🖼️ Reply *"Add diagrams to questions"*',
        '📄 Reply *"Export as Word DOCX"*'
      ];
    case 'worksheet':
      return [
        '🔑 Reply *"Generate answer key"*',
        '📝 Reply *"Add 3 more questions"*',
        '🎥 Reply *"Explain answers in video"*'
      ];
    case 'progress_report':
      return [
        '📩 Reply *"Draft parent WhatsApp message"*',
        '📈 Reply *"Generate student action plan"*',
        '🎓 Reply *"View subject recommendations"*'
      ];
    case 'certificate':
      return [
        '🏅 Reply *"Update student name"*',
        '📅 Reply *"Change issue date"*',
        '📄 Reply *"Download high-res PDF"*'
      ];
    case 'timetable':
      return [
        '⏰ Reply *"Adjust lesson timings"*',
        '👨‍🏫 Reply *"Assign teacher codes"*',
        '📄 Reply *"Print weekly view"*'
      ];
    case 'chemistry_formula':
    case 'physics_diagram':
    case 'math_equation':
      return [
        '🧠 Reply *"Step-by-step breakdown"*',
        '🖼️ Reply *"Generate visual diagram card"*',
        '❓ Reply *"Quiz me on this formula"*'
      ];
    default:
      return [
        '📖 Reply *"Explain in detail"*',
        '📝 Reply *"Edit or customize"*',
        '🖼️ Reply *"Generate visual diagram"*',
        '❓ Reply *"Create practice quiz"*',
        '🎥 Reply *"Convert to video"*'
      ];
  }
}

/**
 * Generates an EduNexus PDF Document using jsPDF
 */
export function generateEduNexusPdf(
  title: string,
  categoryLabel: string,
  userName: string,
  textContent: string,
  dateStr: string = new Date().toLocaleDateString()
): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);

  // Header Banner Background (Dark Navy)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 90, 'F');

  // Header Decorative Accent Strip (Emerald Green)
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 86, pageWidth, 4, 'F');

  // EduNexus Logo & Branding Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('EduNexus AI', margin, 42);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('INTELLIGENT PEDAGOGICAL NETWORK', margin, 56);

  // Category Badge (Top Right)
  const badgeText = categoryLabel.toUpperCase();
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(pageWidth - margin - 150, 25, 150, 24, 4, 4, 'F');
  doc.setTextColor(251, 191, 36); // amber-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(badgeText, pageWidth - margin - 75, 40, { align: 'center' });

  // Document Title & Metadata
  let y = 120;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, margin, y);
  y += (titleLines.length * 20) + 10;

  // Metadata Bar
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, y, contentWidth, 26, 4, 4, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(`DATE: ${dateStr}   |   GENERATED FOR: ${userName.toUpperCase()}   |   STATUS: VERIFIED EDU-DOCUMENT`, margin + 12, y + 17);
  y += 40;

  // Render Document Body Text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const cleanText = textContent
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '');

  const lines = cleanText.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (y > pageHeight - 60) {
      // New Page
      doc.addPage();
      y = 50;

      // Header on secondary page
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`EduNexus AI — ${title}`, margin, 22);
      y += 10;
    }

    if (!line) {
      y += 8;
      continue;
    }

    if (line.startsWith('•') || line.startsWith('-')) {
      const bulletText = line.replace(/^[•-]\s*/, '');
      const wrapped = doc.splitTextToSize(`•  ${bulletText}`, contentWidth - 15);
      doc.setFont('helvetica', 'normal');
      doc.text(wrapped, margin + 10, y);
      y += wrapped.length * 14;
    } else if (line.endsWith(':') || line.toUpperCase() === line && line.length < 40) {
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const wrapped = doc.splitTextToSize(line, contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 15;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
    } else {
      const wrapped = doc.splitTextToSize(line, contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 14;
    }
  }

  // Footer on all pages
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated by EduNexus AI Network  •  Page ${i} of ${pageCount}`, margin, pageHeight - 20);
    doc.text(`https://edunexus.ai`, pageWidth - margin, pageHeight - 20, { align: 'right' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

/**
 * Generates a High-Resolution First-Page Preview Image (PNG) using SVG + resvg
 */
export function generateEduNexusPreviewImage(
  title: string,
  categoryLabel: string,
  userName: string,
  textContent: string,
  dateStr: string = new Date().toLocaleDateString()
): Buffer {
  const cleanBody = textContent
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1');

  const bodyLines = cleanBody.split('\n').filter(l => l.trim().length > 0).slice(0, 18);

  const formattedLinesSvg = bodyLines.map((line, idx) => {
    const isHeading = line.endsWith(':') || (line.length < 40 && line === line.toUpperCase());
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
    const yPos = 260 + (idx * 30);
    if (yPos > 720) return '';

    if (isHeading) {
      return `<text x="70" y="${yPos}" font-family="Arial, sans-serif" font-size="19" font-weight="bold" fill="#0f172a">${line.slice(0, 75)}</text>`;
    } else if (isBullet) {
      return `<text x="90" y="${yPos}" font-family="Arial, sans-serif" font-size="16" fill="#334155">${line.slice(0, 80)}</text>`;
    } else {
      return `<text x="70" y="${yPos}" font-family="Arial, sans-serif" font-size="16" fill="#1e293b">${line.slice(0, 85)}</text>`;
    }
  }).join('\n');

  const svgString = `
<svg width="1000" height="850" viewBox="0 0 1000 850" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>

  <!-- Background Canvas -->
  <rect width="1000" height="850" fill="#f8fafc"/>

  <!-- Top Header Banner -->
  <rect width="1000" height="150" fill="url(#headerGrad)"/>
  <rect y="150" width="1000" height="6" fill="url(#accentGrad)"/>

  <!-- EduNexus Logo Icon -->
  <rect x="50" y="35" width="55" height="55" rx="14" fill="#10b981"/>
  <text x="77" y="73" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff" text-anchor="middle">🎓</text>

  <!-- Header Title -->
  <text x="125" y="65" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff">EduNexus AI</text>
  <text x="125" y="88" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#94a3b8" letter-spacing="1">OFFICIAL EDUCATIONAL DOCUMENT PREVIEW</text>

  <!-- Category Badge -->
  <rect x="750" y="45" width="200" height="40" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
  <text x="850" y="71" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#fbbf24" text-anchor="middle">${categoryLabel.toUpperCase()}</text>

  <!-- Document Meta Bar -->
  <rect x="50" y="175" width="900" height="45" rx="8" fill="#e2e8f0"/>
  <text x="70" y="203" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#475569">
    TITLE: ${title.slice(0, 45)}   |   DATE: ${dateStr}   |   USER: ${userName.toUpperCase()}
  </text>

  <!-- Body Text Section -->
  ${formattedLinesSvg}

  <!-- Bottom Attachment Callout Banner -->
  <rect y="780" width="1000" height="70" fill="#0f172a"/>
  <text x="500" y="822" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#f59e0b" text-anchor="middle">
    📄 Full Printable PDF Document Attached Below in WhatsApp Chat
  </text>
</svg>
  `.trim();

  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: 1200 }
  });
  const pngData = resvg.render();
  return pngData.asPng();
}
