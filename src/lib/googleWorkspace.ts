import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from '../firebase';
import { SavedDocument } from '../types';

// Storage key for cached user session details
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;

// No restricted Google Workspace OAuth scopes are requested
export const WORKSPACE_SCOPES: string[] = [];

/**
 * Basic sign in without restricted Google Workspace scopes
 */
export const connectGoogleWorkspace = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    cachedAccessToken = credential?.accessToken || 'authenticated_session';
    cachedGoogleUser = result.user;
    
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.log('Google Auth popup was closed by user.');
      return null;
    }
    console.error('Google Authentication Failed:', error);
    throw error;
  }
};

export const getGoogleWorkspaceToken = (): string | null => {
  return cachedAccessToken;
};

export const getGoogleWorkspaceUser = (): User | null => {
  return cachedGoogleUser;
};

export const disconnectGoogleWorkspace = () => {
  cachedAccessToken = null;
  cachedGoogleUser = null;
};

// ==========================================
// 1. SHEETS EXPORT (Clean CSV Download)
// ==========================================
export const exportToGoogleSheets = async (doc: SavedDocument): Promise<string> => {
  const rows: string[][] = [
    ['CURRICULUM ALIGNED PEDAGOGICAL MATERIAL', ''],
    ['Title', `"${(doc.title || '').replace(/"/g, '""')}"`],
    ['Subject', `"${(doc.subject || '').replace(/"/g, '""')}"`],
    ['Class Level', `"${(doc.classLevel || '').replace(/"/g, '""')}"`],
    ['Topic Strand', `"${(doc.topic || '').replace(/"/g, '""')}"`],
    ['Sub-Topic', `"${(doc.subTopic || 'N/A').replace(/"/g, '""')}"`],
    ['Curriculum Framework', `"${doc.curriculum === 'cbc' ? 'Kenyan CBC' : 'Standard Outcomes Syllabus'}"`],
    ['Generated Date', `"${new Date(doc.createdAt).toLocaleDateString()}"`],
    [],
    ['MATERIAL CONTENT'],
    [`"${(doc.content || '').replace(/"/g, '""')}"`]
  ];

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${(doc.title || 'Curriculum').replace(/[^a-zA-Z0-9]/g, '_')}_Spreadsheet.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();

  return 'Downloaded Curriculum Spreadsheet (CSV)';
};

// ==========================================
// 1B. DOCS EXPORT (Clean Document Download)
// ==========================================
export const exportToGoogleDocs = async (doc: SavedDocument): Promise<string> => {
  const textHeader = `CURRICULUM ALIGNED PEDAGOGICAL MATERIAL\n\n` +
    `Title: ${doc.title}\n` +
    `Subject: ${doc.subject}\n` +
    `Class Level: ${doc.classLevel}\n` +
    `Topic Strand: ${doc.topic}\n` +
    `Sub-Topic: ${doc.subTopic || 'N/A'}\n` +
    `Curriculum Framework: ${doc.curriculum === 'cbc' ? 'Kenyan CBC' : 'Standard Outcomes Syllabus'}\n` +
    `Generated Date: ${new Date(doc.createdAt).toLocaleDateString()}\n` +
    `--------------------------------------------------------------------------------\n\n`;

  const fullText = textHeader + doc.content;
  const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(doc.title || 'Lesson').replace(/[^a-zA-Z0-9]/g, '_')}_Document.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return 'Downloaded Formatted Curriculum Document';
};

// ==========================================
// 2. CALENDAR SCHEDULING (Web Template Link)
// ==========================================
export interface CalendarEventParams {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location?: string;
  addReminder: boolean;
}

export const scheduleOnGoogleCalendar = async (
  doc: SavedDocument,
  params: CalendarEventParams
): Promise<string> => {
  const title = `Teach Lesson: ${doc.topic || doc.title} (${doc.classLevel || 'Class'})`;
  const description = `Subject: ${doc.subject}\nClass Level: ${doc.classLevel}\nTopic: ${doc.topic}\nCurriculum Alignment: ${doc.curriculum === 'cbc' ? 'Kenyan CBC' : 'Standard Syllabus'}\n\nLesson Summary:\n${(doc.content || '').substring(0, 800)}`;
  const location = params.location || 'Classroom';

  // Format YYYYMMDDTHHmmss
  const dateClean = (params.date || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  const startClean = (params.startTime || '09:00').replace(':', '') + '00';
  const endClean = (params.endTime || '10:00').replace(':', '') + '00';

  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateClean}T${startClean}/${dateClean}T${endClean}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

  window.open(calendarUrl, '_blank');
  return calendarUrl;
};

// ==========================================
// 3. SLIDES DECK CREATION (Presentation Text Export)
// ==========================================
export const createGoogleSlidesDeck = async (doc: SavedDocument): Promise<string> => {
  const slidesToCreate: { title: string; bullets: string[] }[] = [];
  let currentSlide: { title: string; bullets: string[] } | null = {
    title: doc.title,
    bullets: [
      `Subject: ${doc.subject}`,
      `Grade: ${doc.classLevel}`,
      `Topic: ${doc.topic}`,
      `Curriculum: ${doc.curriculum === 'cbc' ? 'Kenyan CBC' : 'Standard Outcomes Syllabus'}`
    ]
  };

  const lines = (doc.content || '').split('\n');
  lines.forEach(line => {
    const headingMatch = line.match(/^(?:#{1,3})\s+(.*)$/);
    if (headingMatch) {
      if (currentSlide) slidesToCreate.push(currentSlide);
      currentSlide = { title: headingMatch[1].trim(), bullets: [] };
    } else {
      const cleanLine = line.replace(/^[\s*-+•#>]+\s*/, '').trim();
      if (cleanLine && currentSlide && currentSlide.bullets.length < 5) {
        if (cleanLine.length > 5 && cleanLine.length < 150 && !cleanLine.includes('|')) {
          currentSlide.bullets.push(cleanLine);
        }
      }
    }
  });
  if (currentSlide) slidesToCreate.push(currentSlide);

  const slideOutlineText = slidesToCreate
    .map((s, idx) => `SLIDE ${idx + 1}: ${s.title}\n` + s.bullets.map(b => `  • ${b}`).join('\n'))
    .join('\n\n');

  const blob = new Blob([slideOutlineText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(doc.title || 'Lesson').replace(/[^a-zA-Z0-9]/g, '_')}_Slide_Outline.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return 'Downloaded Slide Presentation Outline';
};

// ==========================================
// 4. GMAIL MESSAGING (Mailto Client Trigger)
// ==========================================
export interface GmailSendParams {
  recipientEmail: string;
  subjectLine: string;
  customMessage: string;
}

export const sendMaterialViaGmail = async (
  doc: SavedDocument,
  params: GmailSendParams
): Promise<boolean> => {
  const bodyText = `${params.customMessage ? params.customMessage + '\n\n---\n\n' : ''}` +
    `Title: ${doc.title}\n` +
    `Subject: ${doc.subject}\n` +
    `Class Level: ${doc.classLevel}\n` +
    `Topic: ${doc.topic}\n\n` +
    `${(doc.content || '').substring(0, 1200)}`;

  const mailtoUrl = `mailto:${encodeURIComponent(params.recipientEmail)}?subject=${encodeURIComponent(params.subjectLine)}&body=${encodeURIComponent(bodyText)}`;
  window.open(mailtoUrl, '_blank');
  return true;
};

// ==========================================
// 5. GOOGLE FORMS ASSESSMENT CREATION
// ==========================================
export const createAssessmentGoogleForm = async (doc: SavedDocument): Promise<string> => {
  const extractedQuestions: string[] = [];
  const lines = (doc.content || '').split('\n');

  lines.forEach(line => {
    const cleanLine = line.trim();
    const questionRegex = /^(?:\d+[\s.)-]+\s*|Q\d+[\s:.-]+\s*|\*\s+|-\s+)(.*?(\?|\.{3}))$/i;
    const match = cleanLine.match(questionRegex);
    if (match && match[1] && match[1].length > 10 && extractedQuestions.length < 8) {
      extractedQuestions.push(match[1].trim());
    } else if (cleanLine.includes('?') && cleanLine.length > 15 && cleanLine.length < 150 && extractedQuestions.length < 8) {
      extractedQuestions.push(cleanLine.replace(/^[\s*-+•#>]+\s*/, '').trim());
    }
  });

  if (extractedQuestions.length === 0) {
    extractedQuestions.push(
      `Explain the key concepts of "${doc.topic}" from today's lesson.`,
      `Identify practical applications of "${doc.topic}".`
    );
  }

  const quizText = `WORKSHEET QUIZ / ASSESSMENT: ${doc.topic}\nSubject: ${doc.subject} | Grade: ${doc.classLevel}\n\n` +
    extractedQuestions.map((q, i) => `Question ${i + 1}: ${q}\n[Answer Space]\n`).join('\n');

  const blob = new Blob([quizText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(doc.topic || 'Worksheet').replace(/[^a-zA-Z0-9]/g, '_')}_Quiz_Questions.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return 'Downloaded Worksheet Assessment Quiz';
};
