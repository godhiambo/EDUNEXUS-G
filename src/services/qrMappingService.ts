import { QRCodeMapping } from '../types/qrMapping';
import { db } from '../firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, increment, getDoc } from 'firebase/firestore';

const STORAGE_KEY = 'edunexus_qr_code_mappings';
const COLLECTION_NAME = 'qr_code_mappings';

export const INITIAL_QR_MAPPINGS: QRCodeMapping[] = [
  {
    qrCodeId: 'qr-soc-bio72',
    shortId: 'soc-bio72',
    title: 'Grade 7 Photosynthesis Socratic Reader',
    description: 'Links page 72 of the Biology textbook directly to the Interactive Reader with a pre-configured Socratic tutor prompt.',
    targetType: 'SOCRATIC_TUTOR',
    physicalTouchpoint: 'CBC Biology Grade 7 Textbook - Page 72',
    targetPayload: {
      socratic: {
        documentTitle: 'Photosynthesis & Cellular Respiration',
        socraticPrompt: 'Guide the student through light-dependent reactions using step-by-step Socratic inquiry rather than giving direct answers.',
        suggestedQuestions: [
          'What happens to water molecules during sunlight absorption?',
          'Why is chlorophyll essential for photon trapping?'
        ],
        initialMode: 'interactive_reader'
      }
    },
    createdByUid: 'teacher-system',
    createdByName: 'Mr. Omondi (Science Lead)',
    scanCount: 42,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    brandColor: '#5f6f52',
    labelHeader: 'BIOLOGY PAGE 72 TOUCHPOINT',
    expirationDate: '2026-12-31'
  },
  {
    qrCodeId: 'qr-path-math42',
    shortId: 'path-math42',
    title: 'Fractions & Decimals Adaptive Node',
    description: 'Scans worksheet to open the Adaptive Learning Path. Automatically activates low-difficulty root activities if student marks low confidence.',
    targetType: 'ADAPTIVE_PATHWAY',
    physicalTouchpoint: 'Grade 5 Math Practice Worksheet #4',
    targetPayload: {
      adaptive: {
        subject: 'Mathematics',
        topic: 'Fractions & Decimals',
        subtopic: 'Adding Unlike Denominators',
        nodeId: 'node-frac-101',
        autoTriggerLowDifficulty: true,
        rootActivitiesCount: 3,
        scaffoldingNotes: 'Provides visual fraction strip manipulatives and step-by-step scaffolding for entry confidence.'
      }
    },
    createdByUid: 'teacher-system',
    createdByName: 'Mrs. Wanjiru (Math Dept)',
    scanCount: 89,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    brandColor: '#10b981',
    labelHeader: 'MATH WORKSHEET #4 ADAPTIVE NODE',
    expirationDate: '2026-07-20'
  },
  {
    qrCodeId: 'qr-udl-dyslexia',
    shortId: 'udl-dyslexia',
    title: 'Dyslexia & ADHD Touchpoint Scanner',
    description: 'Scanned from desk sticker to force-load Dyslexia-friendly Comic Neue typography, relaxed line height, and ADHD micro-milestones.',
    targetType: 'PRECONFIGURED_UDL',
    physicalTouchpoint: 'Classroom Desk Sticker #12 (Inclusive Learning Corner)',
    targetPayload: {
      udl: {
        useDyslexicFont: true,
        lineSpacing: 'relaxed',
        fontSize: 'large',
        adhdMilestones: true,
        highContrast: false,
        eslTargetLang: 'en',
        simplifyVocabulary: true
      }
    },
    createdByUid: 'teacher-system',
    createdByName: 'Ms. Achieng (SEN Specialist)',
    scanCount: 134,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    brandColor: '#f59e0b',
    labelHeader: 'UDL ACCESSIBILITY TOUCHPOINT'
  },
  {
    qrCodeId: 'qr-parent-report',
    shortId: 'parent-report',
    title: 'Take-Home Progress & Streaks Playbook',
    description: 'Attached to take-home folders. Parents scan at home to view learning streaks, celebrate milestones, and adjust home accessibility profile.',
    targetType: 'PARENT_PLAYBOOK',
    physicalTouchpoint: 'Friday Take-Home Folder Tag',
    targetPayload: {
      parent: {
        studentName: 'Amara Ochieng',
        targetSection: 'progress_streaks',
        customParentMessage: 'Welcome! Scan this QR code every Friday to celebrate Amara\'s weekly CBC learning milestones and sync home UDL accessibility profiles.'
      }
    },
    createdByUid: 'teacher-system',
    createdByName: 'Mr. Omondi (Grade 6 Lead)',
    scanCount: 67,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    brandColor: '#f43f5e',
    labelHeader: 'PARENT TAKE-HOME PLAYBOOK'
  }
];

export class QRMappingService {
  /**
   * Get all QR code mappings (localStorage fallback + Firestore sync)
   */
  static async getMappings(): Promise<QRCodeMapping[]> {
    try {
      // 1. Try server API
      const res = await fetch('/api/qr/mappings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.mappings) && data.mappings.length > 0) {
          this.saveToLocal(data.mappings);
          return data.mappings;
        }
      }
    } catch (e) {
      console.warn('Backend API /api/qr/mappings unavailable, falling back to local/Firestore:', e);
    }

    // 2. Try Firestore
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const items: QRCodeMapping[] = [];
        snapshot.forEach(docSnap => {
          items.push(docSnap.data() as QRCodeMapping);
        });
        this.saveToLocal(items);
        return items;
      }
    } catch (err) {
      console.warn('Firestore QR mappings query failed:', err);
    }

    // 3. Try LocalStorage
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse local QR mappings:', e);
      }
    }

    // 4. Default Seed Data
    this.saveToLocal(INITIAL_QR_MAPPINGS);
    return INITIAL_QR_MAPPINGS;
  }

  /**
   * Save or update a QR code mapping
   */
  static async saveMapping(mapping: QRCodeMapping): Promise<QRCodeMapping> {
    const all = await this.getMappings();
    const idx = all.findIndex(m => m.qrCodeId === mapping.qrCodeId || m.shortId === mapping.shortId);
    
    let updated: QRCodeMapping[];
    const now = new Date().toISOString();
    const finalMapping: QRCodeMapping = {
      ...mapping,
      updatedAt: now,
      createdAt: mapping.createdAt || now
    };

    if (idx >= 0) {
      updated = [...all];
      updated[idx] = finalMapping;
    } else {
      updated = [finalMapping, ...all];
    }

    this.saveToLocal(updated);

    // Sync to backend API asynchronously
    try {
      await fetch('/api/qr/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalMapping)
      });
    } catch (e) {
      console.warn('API save failed:', e);
    }

    // Sync to Firestore asynchronously
    try {
      const docRef = doc(db, COLLECTION_NAME, finalMapping.qrCodeId);
      await setDoc(docRef, finalMapping, { merge: true });
    } catch (e) {
      console.warn('Firestore save failed:', e);
    }

    return finalMapping;
  }

  /**
   * Delete a QR mapping
   */
  static async deleteMapping(qrCodeId: string): Promise<void> {
    const all = await this.getMappings();
    const updated = all.filter(m => m.qrCodeId !== qrCodeId && m.shortId !== qrCodeId);
    this.saveToLocal(updated);

    try {
      await fetch(`/api/qr/manage/${qrCodeId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('API delete failed:', e);
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, qrCodeId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Firestore delete failed:', e);
    }
  }

  /**
   * Check if a QR mapping has reached its expiration date
   */
  static isExpired(mapping: QRCodeMapping): boolean {
    if (!mapping || !mapping.expirationDate) return false;
    const exp = new Date(mapping.expirationDate);
    if (isNaN(exp.getTime())) return false;
    // If formatted as YYYY-MM-DD date only, extend to 23:59:59 of that day
    if (mapping.expirationDate.length === 10) {
      exp.setHours(23, 59, 59, 999);
    }
    return new Date() > exp;
  }

  /**
   * Universal & Local Academic Calendar Presets
   * Supports 3-Term (Term 1, 2, 3), 2-Semester (Semester 1, 2), and Seasonal Systems globally.
   */
  static getAcademicCalendarDefaults(referenceDate: Date = new Date()): Array<{
    id: string;
    label: string;
    description: string;
    date: string;
  }> {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)

    const currentYear = year;
    const nextYear = year + 1;

    // Universal 3-Term System (Kenya CBC, UK, Commonwealth, Africa, Asia, Australia)
    const term1End = `${currentYear}-04-30`;
    const term2End = `${currentYear}-08-31`;
    const term3End = `${currentYear}-11-30`;

    // Universal 2-Semester System & Seasonal Equivalents
    const sem1End = `${currentYear}-12-18`;
    const sem2End = month >= 6 ? `${nextYear}-05-31` : `${currentYear}-05-31`;
    const academicYearEnd = month >= 6 ? `${nextYear}-06-30` : `${currentYear}-11-30`;

    // 30-day unit test preset
    const thirtyDays = new Date(referenceDate);
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const unitTestEnd = thirtyDays.toISOString().substring(0, 10);

    return [
      { id: 'term_1', label: 'End of Term 1', description: `Term 1 conclusion (${term1End})`, date: term1End },
      { id: 'term_2', label: 'End of Term 2 (Mid-Year)', description: `Term 2 conclusion (${term2End})`, date: term2End },
      { id: 'term_3', label: 'End of Term 3 (Year-End)', description: `Term 3 conclusion (${term3End})`, date: term3End },
      { id: 'sem_1', label: 'End of Semester 1 / Fall', description: `Semester 1 conclusion (${sem1End})`, date: sem1End },
      { id: 'sem_2', label: 'End of Semester 2 / Spring', description: `Semester 2 conclusion (${sem2End})`, date: sem2End },
      { id: 'academic_year', label: 'End of Academic Year', description: `Annual rollover (${academicYearEnd})`, date: academicYearEnd },
      { id: 'unit_test', label: '30-Day Unit Test', description: `Curriculum module (${unitTestEnd})`, date: unitTestEnd }
    ];
  }

  /**
   * Resolve short ID dynamic redirect payload & increment scan count
   */
  static async resolveAndIncrementScan(shortId: string, deviceInfo?: string): Promise<QRCodeMapping | null> {
    let mapping: QRCodeMapping | null = null;
    try {
      const res = await fetch(`/api/qr/resolve/${encodeURIComponent(shortId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.mapping) {
          mapping = data.mapping;
        }
      }
    } catch (e) {
      console.warn('Backend API resolve failed, looking up locally:', e);
    }

    // Local resolution fallback if API didn't return
    if (!mapping) {
      const all = await this.getMappings();
      const found = all.find(m => m.shortId.toLowerCase() === shortId.toLowerCase() || m.qrCodeId === shortId);
      if (found) {
        found.scanCount = (found.scanCount || 0) + 1;
        found.updatedAt = new Date().toISOString();
        await this.saveMapping(found);
        mapping = found;
      }
    }

    if (mapping) {
      this.triggerScanAlert(mapping, deviceInfo || 'Classroom Student Scanner');
    }

    return mapping;
  }

  /**
   * Dispatch a real-time scan alert custom event across the window app environment
   */
  static triggerScanAlert(mapping: QRCodeMapping, deviceInfo: string = 'Classroom Tablet'): void {
    if (typeof window !== 'undefined') {
      const eventDetail = {
        scanId: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        mapping,
        deviceInfo,
        timestamp: new Date().toISOString()
      };
      window.dispatchEvent(new CustomEvent('edunexus-qr-scan-event', { detail: eventDetail }));
    }
  }

  /**
   * Save multiple QR mappings in bulk (batch operation)
   */
  static async saveBulkMappings(newMappings: QRCodeMapping[]): Promise<QRCodeMapping[]> {
    const existing = await this.getMappings();
    const now = new Date().toISOString();

    const prepared = newMappings.map(m => ({
      ...m,
      qrCodeId: m.qrCodeId || `qr-${Math.random().toString(36).substring(2, 9)}`,
      shortId: m.shortId || `qr-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: m.createdAt || now,
      updatedAt: now,
      scanCount: m.scanCount ?? 0,
      brandColor: m.brandColor || '#5f6f52'
    }));

    // Merge with existing mappings (replace duplicates if matching qrCodeId/shortId)
    const mergedMap = new Map<string, QRCodeMapping>();
    existing.forEach(item => mergedMap.set(item.qrCodeId, item));
    prepared.forEach(item => mergedMap.set(item.qrCodeId, item));

    const updated = Array.from(mergedMap.values());
    this.saveToLocal(updated);

    // Asynchronously push each to backend / firestore
    for (const mapping of prepared) {
      try {
        const docRef = doc(db, COLLECTION_NAME, mapping.qrCodeId);
        await setDoc(docRef, mapping, { merge: true });
      } catch (e) {
        console.warn('Batch firestore sync note:', e);
      }
    }

    return updated;
  }

  private static saveToLocal(mappings: QRCodeMapping[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }
}
