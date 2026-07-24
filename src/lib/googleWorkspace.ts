import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from '../firebase';
import { SavedDocument } from '../types';

// Storage key for cached Google OAuth Access Token
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;

// Scopes required for Gmail, Calendar, Sheets, Slides, Forms, and Docs
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://mail.google.com/'
];

/**
 * Initializes and triggers Google Auth with custom requested scopes
 */
export const connectGoogleWorkspace = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const provider = new GoogleAuthProvider();
    WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));
    
    // Request incremental consent to ensure we don't drop scopes
    provider.setCustomParameters({
      prompt: 'consent',
      access_type: 'offline'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token.');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;
    
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Google Workspace Authentication Failed:', error);
    throw error;
  }
};

/**
 * Checks if the Google Workspace connection is active in the current session
 */
export const getGoogleWorkspaceToken = (): string | null => {
  return cachedAccessToken;
};

export const getGoogleWorkspaceUser = (): User | null => {
  return cachedGoogleUser;
};

/**
 * Disconnects Google Workspace in-memory session
 */
export const disconnectGoogleWorkspace = () => {
  cachedAccessToken = null;
  cachedGoogleUser = null;
};

// ==========================================
// 1. GOOGLE SHEETS EXPORT
// ==========================================
export const exportToGoogleSheets = async (doc: SavedDocument): Promise<string> => {
  const token = getGoogleWorkspaceToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // Create empty spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: `Curriculum: ${doc.title}`
      }
    })
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    throw new Error(errorData.error?.message || 'Failed to create Google Spreadsheet');
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl;

  // Prepare metadata and content row arrays
  const rows: any[][] = [
    ['CURRICULUM ALIGNED PEDAGOGICAL MATERIAL', ''],
    ['Title', doc.title],
    ['Subject', doc.subject],
    ['Class Level', doc.classLevel],
    ['Topic Strand', doc.topic],
    ['Sub-Topic', doc.subTopic || 'N/A'],
    ['Curriculum Framework', doc.curriculum === 'cbc' ? 'Kenyan CBC' : 'Standard Outcomes Syllabus'],
    ['Generated Date', new Date(doc.createdAt).toLocaleDateString()],
    [],
    ['MATERIAL CONTENT (MARKDOWN FORMAT)', ''],
  ];

  // Split markdown body and push into spreadsheet
  const lines = doc.content.split('\n');
  lines.forEach(line => {
    rows.push([line]);
  });

  // Append values to spreadsheet
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: rows
      })
    }
  );

  if (!appendRes.ok) {
    throw new Error('Failed to populate Google Sheet content');
  }

  return spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
};

// ==========================================
// 1B. GOOGLE DOCS EXPORT
// ==========================================
export const exportToGoogleDocs = async (doc: SavedDocument): Promise<string> => {
  const token = getGoogleWorkspaceToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // Create empty Google Doc
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: `${doc.title}`
    })
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    throw new Error(errorData.error?.message || 'Failed to create Google Doc');
  }

  const documentData = await createRes.json();
  const documentId = documentData.documentId;

  // Prepare metadata and content header
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

  // Populate document using batchUpdate
  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: {
              index: 1
            },
            text: fullText
          }
        }
      ]
    })
  });

  if (!updateRes.ok) {
    const errorData = await updateRes.json();
    throw new Error(errorData.error?.message || 'Failed to populate Google Doc content');
  }

  return `https://docs.google.com/document/d/${documentId}/edit`;
};

// ==========================================
// 2. GOOGLE CALENDAR SCHEDULING
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
  const token = getGoogleWorkspaceToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const startDateTime = `${params.date}T${params.startTime}:00`;
  const endDateTime = `${params.date}T${params.endTime}:00`;

  const description = `
🏫 Lesson Plan / Activity Scheduled
Subject: ${doc.subject}
Class Level: ${doc.classLevel}
Topic Strand: ${doc.topic}
Curriculum Alignment: ${doc.curriculum === 'cbc' ? 'Kenyan CBC' : 'Standard Syllabus'}

Lesson Summary:
${doc.content.substring(0, 1000)}${doc.content.length > 1000 ? '...' : ''}

Generated via EduNexus Assistant.
  `.trim();

  const eventBody = {
    summary: `Teach Lesson: ${doc.topic} (${doc.classLevel})`,
    location: params.location || 'Classroom',
    description: description,
    start: {
      dateTime: startDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    },
    end: {
      dateTime: endDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    },
    reminders: {
      useDefault: !params.addReminder,
      overrides: params.addReminder ? [
        { method: 'popup', minutes: 15 },
        { method: 'email', minutes: 60 }
      ] : []
    }
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventBody)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to create Google Calendar Event');
  }

  const event = await res.json();
  return event.htmlLink || 'https://calendar.google.com';
};

// ==========================================
// 3. GOOGLE SLIDES DECK CREATION
// ==========================================
export const createGoogleSlidesDeck = async (doc: SavedDocument): Promise<string> => {
  const token = getGoogleWorkspaceToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // Step 1: Create a presentation
  const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: `Slideshow: ${doc.title}`
    })
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    throw new Error(errorData.error?.message || 'Failed to create Google Slides presentation');
  }

  const presentation = await createRes.json();
  const presentationId = presentation.presentationId;

  // Step 2: Parse markdown to extract slide contents (Headings as slides)
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

  const lines = doc.content.split('\n');
  lines.forEach(line => {
    const headingMatch = line.match(/^(?:#{1,3})\s+(.*)$/);
    if (headingMatch) {
      if (currentSlide) {
        slidesToCreate.push(currentSlide);
      }
      currentSlide = {
        title: headingMatch[1].trim(),
        bullets: []
      };
    } else {
      const cleanLine = line.replace(/^[\s*-+•#>]+\s*/, '').trim();
      if (cleanLine && currentSlide && currentSlide.bullets.length < 5) {
        // Simple filter to skip long texts, images, table headers etc.
        if (cleanLine.length > 5 && cleanLine.length < 150 && !cleanLine.includes('|')) {
          currentSlide.bullets.push(cleanLine);
        }
      }
    }
  });
  if (currentSlide) {
    slidesToCreate.push(currentSlide);
  }

  // Limit to 10 slides to avoid hitting payload or presentation limits
  const selectedSlides = slidesToCreate.slice(0, 10);

  // Step 3: Populate presentation using batchUpdate
  const requests: any[] = [];

  // Update slide 0 (Title slide) which exists by default
  if (presentation.slides && presentation.slides.length > 0) {
    const defaultSlide = presentation.slides[0];
    const pageElements = defaultSlide.pageElements || [];
    const titleElement = pageElements.find((el: any) => el.shape?.shapeType === 'TEXT_BOX');
    
    if (titleElement) {
      requests.push({
        insertText: {
          objectId: titleElement.objectId,
          text: doc.title
        }
      });
    }
  }

  // For the rest of the slides, create them dynamically
  selectedSlides.forEach((slide, index) => {
    // If it's the 1st slide, it's already the title page, just update subtitle or append title details
    if (index === 0) return;

    const slideId = `custom_slide_${index}`;
    const titleId = `custom_title_${index}`;
    const bodyId = `custom_body_${index}`;

    requests.push(
      {
        createSlide: {
          objectId: slideId,
          insertionIndex: index,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY'
          },
          placeholderIdMappings: [
            {
              layoutPlaceholder: {
                type: 'TITLE',
                index: 0
              },
              objectId: titleId
            },
            {
              layoutPlaceholder: {
                type: 'BODY',
                index: 0
              },
              objectId: bodyId
            }
          ]
        }
      },
      {
        insertText: {
          objectId: titleId,
          text: slide.title
        }
      },
      {
        insertText: {
          objectId: bodyId,
          text: slide.bullets.map(b => `• ${b}`).join('\n')
        }
      }
    );
  });

  if (requests.length > 0) {
    const updateRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    if (!updateRes.ok) {
      console.warn('Failed to fully populate slides layout, returning raw slide file.');
    }
  }

  return `https://docs.google.com/presentation/d/${presentationId}`;
};

// ==========================================
// 4. GMAIL MESSAGING / SHARING
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
  const token = getGoogleWorkspaceToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // Simple HTML structure to display markdown material
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <div style="background-color: #5f6f52; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="color: #ffffff; margin: 0; font-family: Georgia, serif;">${doc.title}</h2>
        <p style="color: #e5e1da; margin: 5px 0 0; font-size: 13px; font-weight: bold; text-transform: uppercase;">
          Curriculum Aligning Pedagogical Material
        </p>
      </div>
      <div style="padding: 24px; background-color: #fdfbf7; border: 1px solid #e5e1da; border-top: none; border-radius: 0 0 8px 8px;">
        ${params.customMessage ? `<p style="font-weight: bold; font-style: italic; color: #5f6f52; margin-bottom: 20px;">"${params.customMessage}"</p><hr style="border: none; border-top: 1px solid #e5e1da; margin-bottom: 20px;" />` : ''}
        
        <p><strong>Subject:</strong> ${doc.subject}</p>
        <p><strong>Class Level:</strong> ${doc.classLevel}</p>
        <p><strong>Topic Strand:</strong> ${doc.topic}</p>
        <p><strong>Curriculum:</strong> ${doc.curriculum === 'cbc' ? 'Kenyan CBC' : 'Standard outcomes syllabus'}</p>
        <hr style="border: none; border-top: 1px solid #e5e1da; margin: 20px 0;" />
        
        <div style="white-space: pre-wrap; font-size: 14px; background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #eadecd;">
          ${doc.content.substring(0, 4000)}${doc.content.length > 4000 ? '\n\n...[Truncated for Email Size Limit]' : ''}
        </div>
        
        <p style="font-size: 11px; color: #999; margin-top: 30px; text-align: center;">
          Sent from EduNexus Teacher Administrator Workspace.
        </p>
      </div>
    </div>
  `.trim();

  // Construct MIME email string
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(params.subjectLine)))}?=`;
  const emailLines = [
    `To: ${params.recipientEmail}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    htmlBody
  ];
  const emailRaw = emailLines.join('\r\n');

  // Custom Base64 URL-safe encoding
  const base64UrlSafe = btoa(unescape(encodeURIComponent(emailRaw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: base64UrlSafe
    })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to send email via Gmail');
  }

  return true;
};

// ==========================================
// 5. GOOGLE FORMS ASSESSMENT CREATION
// ==========================================
export const createAssessmentGoogleForm = async (doc: SavedDocument): Promise<string> => {
  const token = getGoogleWorkspaceToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // Step 1: Create an empty form
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      info: {
        title: `Worksheet Quiz: ${doc.topic} (${doc.classLevel})`,
        documentTitle: `EduNexus Form: ${doc.id}`,
        description: `Aligned assessment quiz for ${doc.subject}. Topic: ${doc.topic}.`
      }
    })
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    throw new Error(errorData.error?.message || 'Failed to create Google Form');
  }

  const form = await createRes.json();
  const formId = form.formId;
  const responderUri = form.responderUri;

  // Step 2: Parse markdown content to identify and extract potential questions
  const extractedQuestions: string[] = [];
  const lines = doc.content.split('\n');

  lines.forEach(line => {
    // Detect question patterns like "1. What is...", "Q2: Explain...", or bullet points containing "?"
    const cleanLine = line.trim();
    const questionRegex = /^(?:\d+[\s.)-]+\s*|Q\d+[\s:.-]+\s*|\*\s+|-\s+)(.*?(\?|\.{3}))$/i;
    const match = cleanLine.match(questionRegex);
    
    if (match && match[1] && match[1].length > 10 && extractedQuestions.length < 8) {
      extractedQuestions.push(match[1].trim());
    } else if (cleanLine.includes('?') && cleanLine.length > 15 && cleanLine.length < 150 && extractedQuestions.length < 8) {
      extractedQuestions.push(cleanLine.replace(/^[\s*-+•#>]+\s*/, '').trim());
    }
  });

  // If we could not extract any specific questions, use generic curriculum topics as worksheet checks
  if (extractedQuestions.length === 0) {
    extractedQuestions.push(
      `Briefly explain the core concepts of "${doc.topic}" discussed in today's lesson.`,
      `Identify two real-world practical applications of "${doc.topic}" in daily life.`,
      `Summarize your main learning takeaway from this ${doc.subject} lesson.`
    );
  }

  // Step 3: Populate form with text questions using batchUpdate
  const requests = extractedQuestions.map((questionText, index) => {
    return {
      createItem: {
        item: {
          title: questionText,
          questionItem: {
            question: {
              required: true,
              textQuestion: {
                paragraph: true // Paragraph-type essay/short answers for teachers
              }
            }
          }
        },
        location: {
          index: index
        }
      }
    };
  });

  const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });

  if (!updateRes.ok) {
    console.warn('Failed to fully populate form questions, returning raw form.');
  }

  return responderUri || `https://docs.google.com/forms/d/${formId}/viewform`;
};

// ==========================================
// 6. GOOGLE DRIVE BACKUP & SYNC
// ==========================================

export const findOrCreateDriveFolder = async (folderName: string): Promise<string> => {
  const token = getGoogleWorkspaceToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName.replace(/'/g, "\\'"))}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchRes = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!searchRes.ok) {
    const errorData = await searchRes.json();
    throw new Error(errorData.error?.message || 'Failed to search Google Drive folders');
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    throw new Error(errorData.error?.message || 'Failed to create Google Drive folder');
  }

  const folderData = await createRes.json();
  return folderData.id;
};

export const backupDocumentToDrive = async (
  doc: SavedDocument,
  folderName = 'EduNexus'
): Promise<{ url: string; fileId: string; status: 'created' | 'updated' }> => {
  const token = getGoogleWorkspaceToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // Step 1: Find or create the destination folder
  const folderId = await findOrCreateDriveFolder(folderName);

  // Step 2: Search for an existing Google Doc with the exact same name in this folder
  const safeTitle = doc.title.replace(/'/g, "\\'");
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(safeTitle)}' and '${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`;
  
  const searchRes = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!searchRes.ok) {
    const errorData = await searchRes.json();
    throw new Error(errorData.error?.message || 'Failed to search Google Drive');
  }

  const searchData = await searchRes.json();
  const existingFile = searchData.files && searchData.files.length > 0 ? searchData.files[0] : null;

  // Formatting content for the Google Doc
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

  if (existingFile) {
    const existingFileId = existingFile.id;

    // Retrieve doc length to delete existing content completely before writing
    const getDocRes = await fetch(`https://docs.googleapis.com/v1/documents/${existingFileId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (getDocRes.ok) {
      const docData = await getDocRes.json();
      const contentArray = docData.body?.content || [];
      const endIndex = contentArray.length > 0 ? contentArray[contentArray.length - 1].endIndex : 1;

      const requests: any[] = [];
      if (endIndex > 2) {
        requests.push({
          deleteContentRange: {
            range: {
              startIndex: 1,
              endIndex: endIndex - 1
            }
          }
        });
      }
      requests.push({
        insertText: {
          location: {
            index: 1
          },
          text: fullText
        }
      });

      const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${existingFileId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });

      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        throw new Error(errorData.error?.message || 'Failed to update Google Doc content');
      }

      return {
        url: `https://docs.google.com/document/d/${existingFileId}/edit`,
        fileId: existingFileId,
        status: 'updated'
      };
    }
  }

  // Step 3: Create a brand new Google Doc
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: `${doc.title}`
    })
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    throw new Error(errorData.error?.message || 'Failed to create Google Doc');
  }

  const documentData = await createRes.json();
  const documentId = documentData.documentId;

  // Populate document using batchUpdate
  const populateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: {
              index: 1
            },
            text: fullText
          }
        }
      ]
    })
  });

  if (!populateRes.ok) {
    const errorData = await populateRes.json();
    throw new Error(errorData.error?.message || 'Failed to populate Google Doc content');
  }

  // Step 4: Move the newly created Google Doc into the Backup folder
  const updateUrl = `https://www.googleapis.com/drive/v3/files/${documentId}?addParents=${folderId}&removeParents=root`;
  const moveRes = await fetch(updateUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!moveRes.ok) {
    const fallbackUrl = `https://www.googleapis.com/drive/v3/files/${documentId}?addParents=${folderId}`;
    await fetch(fallbackUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return {
    url: `https://docs.google.com/document/d/${documentId}/edit`,
    fileId: documentId,
    status: 'created'
  };
};

export const triggerAutoBackupIfEnabled = async (doc: SavedDocument): Promise<void> => {
  try {
    const isEnabled = localStorage.getItem('pedagogical_auto_backup') === 'true';
    if (!isEnabled) return;

    const token = getGoogleWorkspaceToken();
    if (!token) return;

    console.log(`[AutoBackup] Triggering automated backup to 'EduNexus' folder for document: ${doc.title}`);
    await backupDocumentToDrive(doc, 'EduNexus');
    console.log(`[AutoBackup] Automated backup successful for document: ${doc.title}`);
  } catch (err) {
    console.error('[AutoBackup] Failed to auto-backup document:', err);
  }
};

// ==========================================
// 7. NEXUSED CURRICULUM BACKUP ACCESS
// ==========================================

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  webViewLink?: string;
}

/**
 * Lists all files inside a specific Google Drive folder (by name), automatically creating it if it doesn't exist.
 */
export const listFilesInDriveFolder = async (folderName: string = 'EduNexus Curriculum Backup'): Promise<GoogleDriveFile[]> => {
  const token = getGoogleWorkspaceToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // Find or create the target folder
  const folderId = await findOrCreateDriveFolder(folderName);

  // Retrieve files inside this folder, including metadata fields for UI display
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id, name, mimeType, size, createdTime, webViewLink)&orderBy=createdTime desc`;
  const res = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || `Failed to list files in Google Drive folder: ${folderName}`);
  }

  const data = await res.json();
  return data.files || [];
};

/**
 * Downloads or exports a Google Drive file by ID.
 * Google Docs are exported to plain text, and other binaries (PDFs, DOCX, etc.) are returned as Blobs.
 */
export const downloadDriveFile = async (
  fileId: string,
  mimeType: string
): Promise<{ content: string; blob: Blob | null }> => {
  const token = getGoogleWorkspaceToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // If it's a Google Doc, we must export it to text/plain
  if (mimeType === 'application/vnd.google-apps.document') {
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
    const res = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to export Google Document content to text.');
    }

    const text = await res.text();
    return { content: text, blob: null };
  } else {
    // For other files (PDF, images, etc.), fetch their raw media content
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to retrieve file content media.');
    }

    if (mimeType.startsWith('text/')) {
      const text = await res.text();
      return { content: text, blob: null };
    } else {
      const blob = await res.blob();
      return { content: '', blob };
    }
  }
};

/**
 * Uploads a file (Blob or String) directly to a specified Google Drive folder.
 */
export const uploadFileToDriveFolder = async (
  fileName: string,
  fileBody: Blob | string,
  mimeType: string,
  folderName: string = 'EduNexus Curriculum Backup'
): Promise<GoogleDriveFile> => {
  const token = getGoogleWorkspaceToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // Ensure folder exists and retrieve its ID
  const folderId = await findOrCreateDriveFolder(folderName);

  // Setup metadata
  const metadata = {
    name: fileName,
    parents: [folderId]
  };

  // Build a multipart form-body manually
  const boundary = 'nexus_ed_drive_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = JSON.stringify(metadata);
  const part1 = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${metadataPart}${delimiter}Content-Type: ${mimeType}\r\n\r\n`;
  const part2 = `${closeDelimiter}`;

  // Assemble Blob parts
  const blobParts: any[] = [part1];
  blobParts.push(fileBody);
  blobParts.push(part2);

  const multipartBody = new Blob(blobParts, { type: `multipart/related; boundary=${boundary}` });

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!uploadRes.ok) {
    const errorData = await uploadRes.json();
    throw new Error(errorData.error?.message || 'Failed to upload file to Google Drive folder');
  }

  return await uploadRes.json();
};


