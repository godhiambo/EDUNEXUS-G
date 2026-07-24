import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

export type Language = 'en' | 'sw';

interface LanguageContextType {
  language: Language;
  aiLanguage: Language;
  setLanguage: (lang: Language) => void;
  setAiLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const TRANSLATIONS: Record<string, Record<Language, string>> = {
  // Languages
  english: {
    en: 'English',
    sw: 'Kiingereza'
  },
  swahili: {
    en: 'Swahili',
    sw: 'Kiswahili'
  },
  // Nav tabs
  dashboard: {
    en: 'Dashboard',
    sw: 'Mwanzo'
  },
  global_resources: {
    en: 'Global Resources',
    sw: 'Maktaba ya Rasilimali'
  },
  collaboration: {
    en: 'Collaboration',
    sw: 'Ushirikiano'
  },
  generate_material: {
    en: 'Generate Material',
    sw: 'Unda Nyaraka'
  },
  admin_panel: {
    en: 'Admin Panel',
    sw: 'Ukurasa wa Utawala'
  },
  settings: {
    en: 'Settings',
    sw: 'Mipangilio'
  },
  sign_out: {
    en: 'Sign Out',
    sw: 'Ondoka'
  },

  // User details
  role_teacher: {
    en: 'Teacher',
    sw: 'Mwalimu'
  },
  role_admin: {
    en: 'Administrator',
    sw: 'Msimamizi'
  },
  role_student: {
    en: 'Student',
    sw: 'Mwanafunzi'
  },
  signed_in_as: {
    en: 'Signed In As',
    sw: 'Umeingia Kama'
  },

  // Dashboard & Greeting
  welcome_back: {
    en: 'Welcome back, {name}!',
    sw: 'Karibu tena, {name}!'
  },
  dashboard_subtitle: {
    en: 'Access pedagogical materials, curriculum checklists, and AI-driven school administrators.',
    sw: 'Fikia nyenzo za ufundishaji, miongozo ya mtaala, na wasaidizi wa AI wa usimamizi wa shule.'
  },
  recent_documents: {
    en: 'Recent Documents',
    sw: 'Nyaraka za Hivi Karibuni'
  },
  create_new_doc: {
    en: 'Create New Document',
    sw: 'Unda Nyaraka Mpya'
  },
  search_placeholder: {
    en: 'Search documents by title, topic, or subject...',
    sw: 'Tafuta nyaraka kwa kichwa, mada, au somo...'
  },
  filter_all: {
    en: 'All Materials',
    sw: 'Nyenzo Zote'
  },
  no_documents_found: {
    en: 'No curriculum materials found.',
    sw: 'Hakuna nyenzo za mtaala zilizopatikana.'
  },
  no_documents_desc: {
    en: 'Get started by creating your first AI-generated lesson plan, syllabus, or worksheet.',
    sw: 'Anza kwa kuunda mpango wako wa kwanza wa somo, muhtasari, au karatasi ya kazi inayozalishwa na AI.'
  },

  // Settings
  app_settings_title: {
    en: 'Application Settings',
    sw: 'Mipangilio ya Programu'
  },
  app_settings_subtitle: {
    en: 'Personalize your school administration workspace, lesson rendering parameters, and real-time syncing.',
    sw: 'Binafsisha mazingira yako ya kazi ya usimamizi wa shule, vigezo vya uwasilishaji wa masomo, na uoanishaji wa papo hapo.'
  },
  about_workspace: {
    en: 'About Workspace',
    sw: 'Kuhusu Eneo la Kazi'
  },
  theme_and_style: {
    en: 'Paper Style & Typographical Aesthetic',
    sw: 'Mtindo wa Karatasi na Urembo wa Maandishi'
  },
  theme_and_style_desc: {
    en: 'Choose how lesson materials and formatted outlines are displayed and rendered',
    sw: 'Chagua jinsi nyenzo za masomo na mihtasari iliyofomatiwa inavyoonyeshwa na kuwasilishwa'
  },
  editor_settings: {
    en: 'Editor Settings',
    sw: 'Mipangilio ya Mhariri'
  },
  interface_theme: {
    en: 'Interface Theme',
    sw: 'Mandhari ya Kiolesura'
  },
  light_mode: {
    en: 'Light Mode',
    sw: 'Njia ya Mwanga'
  },
  dark_mode: {
    en: 'Dark Mode',
    sw: 'Njia ya Giza'
  },
  font_size_level: {
    en: 'Font Size Level',
    sw: 'Ukubwa wa Maandishi'
  },
  font_size_standard: {
    en: 'Standard text',
    sw: 'Maandishi ya Kawaida'
  },
  font_size_large: {
    en: 'Large (High Legibility)',
    sw: 'Kubwa (Urahisi wa Kusoma)'
  },
  autosave_debounce: {
    en: 'Real-Time Auto-Save Debounce',
    sw: 'Muda wa Kusubiri Uhifadhi wa Moja kwa Moja'
  },
  autosave_desc: {
    en: 'Controls how quickly your real-time collaborative keystrokes sync to Firestore.',
    sw: 'Inadhibiti jinsi miguso yako ya vitufe vya ushirikiano inavyooanishwa haraka kwenye Firestore.'
  },
  user_and_permissions: {
    en: 'User & Permissions',
    sw: 'Mtumiaji na Ruhusa'
  },
  user_role_label: {
    en: 'User Role',
    sw: 'Wajibu wa Mtumiaji'
  },
  school_node_id: {
    en: 'School Node ID',
    sw: 'Kitambulisho cha Shule'
  },
  firebase_status: {
    en: 'Firebase Firestore DB',
    sw: 'Kanzidata ya Firebase'
  },
  connected_live: {
    en: 'Connected (Live)',
    sw: 'Imeunganishwa (Mubashara)'
  },
  disconnected: {
    en: 'Disconnected',
    sw: 'Imekatika'
  },
  language_settings_title: {
    en: 'Language & Translation Preferences',
    sw: 'Mipangilio ya Lugha na Tafsiri'
  },
  language_settings_desc: {
    en: 'Configure your default interface language and your preferred language for AI generation.',
    sw: 'Sanidi lugha yako ya kiolesura chaguomsingi na lugha unayopendelea kwa maudhui ya AI.'
  },
  ui_language_label: {
    en: 'Preferred Interface Language',
    sw: 'Lugha ya Kiolesura Unayopendelea'
  },
  ai_language_label: {
    en: 'Preferred AI Content Language',
    sw: 'Lugha Unayopendelea kwa Maudhui ya AI'
  },
  ai_language_desc: {
    en: 'All lesson plans, notes, worksheets, and evaluations will be generated in this language.',
    sw: 'Mipango yote ya masomo, muhtasari, karatasi za kazi, na tathmini zitaundwa kwa lugha hii.'
  },

  // Document Creator / Generator form
  curriculum_framework: {
    en: 'Curriculum Framework',
    sw: 'Mfumo wa Mtaala'
  },
  subject_label: {
    en: 'Subject',
    sw: 'Somo'
  },
  topic_label: {
    en: 'Main Topic',
    sw: 'Mada Kuu'
  },
  subtopic_label: {
    en: 'Sub-topic',
    sw: 'Mada Ndogo'
  },
  duration_label: {
    en: 'Class Duration',
    sw: 'Muda wa Kipindi'
  },
  extra_prompt_label: {
    en: 'Extra Custom Requirements',
    sw: 'Mahitaji Maalum ya Ziada'
  },
  generate_btn: {
    en: 'Generate Curriculum Material',
    sw: 'Unda Nyaraka ya Mtaala'
  },
  advanced_pedagogy_tools: {
    en: 'Advanced Pedagogical Tools',
    sw: 'Zana za Juu za Ufundishaji'
  },
  explain_master_teacher: {
    en: 'Explain Like a Master Teacher',
    sw: 'Eleza Kama Mwalimu Mkuu/Mtaalamu'
  },
  mentor_insights: {
    en: 'Include Pedagogical Mentor Insights',
    sw: 'Jumuisha Ushauri wa Mshauri wa Ufundishaji'
  },
  generate_vocabulary_opt: {
    en: 'Generate Integrated Vocabulary List',
    sw: 'Unda Orodha ya Msamiati Iliyounganishwa'
  },
  generate_differentiated_opt: {
    en: 'Generate Differentiated Learning Options',
    sw: 'Unda Chaguzi za Kujifunza kwa Viwango Tofauti'
  },
  generate_parental_opt: {
    en: 'Generate Parental Engagement Prompts',
    sw: 'Unda Miongozo ya Ushirikishwaji wa Wazazi'
  },
  generate_diagram_opt: {
    en: 'Generate Interactive Mermaid Diagram',
    sw: 'Unda Mchoro Unaoingiliana (Mermaid)'
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('preferred_ui_lang') as Language) || 'en';
  });

  const [aiLanguage, setAiLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('preferred_ai_lang') as Language) || 'en';
  });

  // Load language settings from user profile if signed in
  useEffect(() => {
    if (profile) {
      if ((profile as any).preferredLanguage && (profile as any).preferredLanguage !== language) {
        setLanguageState((profile as any).preferredLanguage);
        localStorage.setItem('preferred_ui_lang', (profile as any).preferredLanguage);
      }
      if ((profile as any).preferredAiLanguage && (profile as any).preferredAiLanguage !== aiLanguage) {
        setAiLanguageState((profile as any).preferredAiLanguage);
        localStorage.setItem('preferred_ai_lang', (profile as any).preferredAiLanguage);
      }
    }
  }, [profile]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred_ui_lang', lang);
    window.dispatchEvent(new Event('language_changed'));

    // Sync to firestore if user profile exists
    if (user && db) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { preferredLanguage: lang }, { merge: true });
      } catch (err) {
        console.error('Error saving language preference to firestore:', err);
      }
    }
  };

  const setAiLanguage = async (lang: Language) => {
    setAiLanguageState(lang);
    localStorage.setItem('preferred_ai_lang', lang);
    window.dispatchEvent(new Event('ai_language_changed'));

    // Sync to firestore if user profile exists
    if (user && db) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { preferredAiLanguage: lang }, { merge: true });
      } catch (err) {
        console.error('Error saving AI language preference to firestore:', err);
      }
    }
  };

  const t = (key: string, variables?: Record<string, string>): string => {
    const translation = TRANSLATIONS[key];
    if (!translation) {
      return key;
    }
    let text = translation[language] || translation['en'] || key;
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, aiLanguage, setLanguage, setAiLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
