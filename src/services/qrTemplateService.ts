import { QRTemplate } from '../types/qrMapping';

const TEMPLATES_STORAGE_KEY = 'edunexus_qr_templates';

export const INITIAL_QR_TEMPLATES: QRTemplate[] = [
  {
    id: 'tmpl-homework-socratic',
    name: 'Standard Homework Socratic Guide',
    category: 'Homework',
    description: 'Pre-configured Socratic tutor that leads students through evening homework via guided questions instead of direct solutions.',
    targetType: 'SOCRATIC_TUTOR',
    defaultBrandColor: '#6366f1',
    defaultLabelHeader: 'HOMEWORK SOCRATIC ASSISTANT',
    isBuiltIn: true,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    targetPayload: {
      socratic: {
        documentTitle: 'Standard Homework Assignment',
        socraticPrompt: 'Guide the student through homework questions using step-by-step scaffolding and open inquiry rather than giving answers.',
        suggestedQuestions: [
          'What is the core problem asking you to identify?',
          'What formulas or concepts apply to this question?',
          'What is your first hypothesis or working step?'
        ],
        initialMode: 'chat_tutor'
      }
    }
  },
  {
    id: 'tmpl-revision-adaptive',
    name: 'Exam Revision Adaptive Pathway',
    category: 'Revision',
    description: 'Adaptive pathway preset that automatically activates lower difficulty foundation scaffolding when revision practice scores lag.',
    targetType: 'ADAPTIVE_PATHWAY',
    defaultBrandColor: '#10b981',
    defaultLabelHeader: 'EXAM REVISION PATHWAY',
    isBuiltIn: true,
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    targetPayload: {
      adaptive: {
        subject: 'General CBC Core',
        topic: 'Mid-Term Exam Revision',
        subtopic: 'Foundational Knowledge Review',
        nodeId: 'node-rev-preset',
        autoTriggerLowDifficulty: true,
        rootActivitiesCount: 4,
        scaffoldingNotes: 'Provides visual manipulatives and step-by-step review modules for exam confidence.'
      }
    }
  },
  {
    id: 'tmpl-accessibility-udl',
    name: 'Inclusive Dyslexia & ADHD UDL Preset',
    category: 'Accessibility',
    description: 'Forces open-dyslexic font rendering, relaxed line height, large text size, and ADHD micro-milestone tracking on scan.',
    targetType: 'PRECONFIGURED_UDL',
    defaultBrandColor: '#f59e0b',
    defaultLabelHeader: 'INCLUSIVE UDL ACCESSIBILITY',
    isBuiltIn: true,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
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
    }
  },
  {
    id: 'tmpl-parent-digest',
    name: 'Weekly Parent Playbook Digest',
    category: 'Parent Outreach',
    description: 'Attach to Friday take-home folders so parents can review student learning streaks and sync accessibility profiles.',
    targetType: 'PARENT_PLAYBOOK',
    defaultBrandColor: '#f43f5e',
    defaultLabelHeader: 'PARENT TAKE-HOME PLAYBOOK',
    isBuiltIn: true,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    targetPayload: {
      parent: {
        targetSection: 'progress_streaks',
        customParentMessage: 'Scan to review weekly CBC learning progress, celebrate streaks, and sync home learning profiles.'
      }
    }
  },
  {
    id: 'tmpl-lab-inquiry',
    name: 'Science Lab Guided Experiment',
    category: 'Lab Activity',
    description: 'Scanned from lab station equipment to enforce lab safety protocols and prompt hypothesis formulation.',
    targetType: 'SOCRATIC_TUTOR',
    defaultBrandColor: '#8b5cf6',
    defaultLabelHeader: 'SCIENCE LAB GUIDED INQUIRY',
    isBuiltIn: true,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    targetPayload: {
      socratic: {
        documentTitle: 'Practical Lab Station Guide',
        socraticPrompt: 'Prompt the student to record their observations, verify safety gear, and outline their experimental hypothesis step-by-step.',
        suggestedQuestions: [
          'Have you verified all required laboratory safety equipment?',
          'What independent variable are you testing today?'
        ],
        initialMode: 'interactive_reader'
      }
    }
  }
];

export class QRTemplateService {
  /**
   * Get all saved templates (built-in + custom from localStorage)
   */
  static getTemplates(): QRTemplate[] {
    try {
      const local = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge built-in templates with user custom templates to ensure built-ins are always present
          const customOnly = parsed.filter(p => !p.isBuiltIn);
          return [...INITIAL_QR_TEMPLATES, ...customOnly];
        }
      }
    } catch (e) {
      console.error('Failed to parse local QR templates:', e);
    }

    this.saveToLocal(INITIAL_QR_TEMPLATES);
    return INITIAL_QR_TEMPLATES;
  }

  /**
   * Save a new or edited template
   */
  static saveTemplate(template: QRTemplate): QRTemplate[] {
    const all = this.getTemplates();
    const existingIdx = all.findIndex(t => t.id === template.id);
    let updated: QRTemplate[];

    if (existingIdx >= 0) {
      updated = [...all];
      updated[existingIdx] = template;
    } else {
      updated = [template, ...all];
    }

    this.saveToLocal(updated);
    return updated;
  }

  /**
   * Delete a custom template
   */
  static deleteTemplate(templateId: string): QRTemplate[] {
    const all = this.getTemplates();
    const updated = all.filter(t => t.id !== templateId || t.isBuiltIn);
    this.saveToLocal(updated);
    return updated;
  }

  private static saveToLocal(templates: QRTemplate[]) {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    } catch (e) {
      console.error('LocalStorage template write failed:', e);
    }
  }
}
