import React, { createContext, useContext, useState, useEffect } from 'react';

export interface LearnerProfile {
  id: string;
  name: string;
  type: 'general' | 'dyslexia' | 'adhd' | 'esl' | 'visual' | 'auditory';
  description: string;
  accommodations: {
    fontSize: 'normal' | 'large' | 'xlarge';
    lineSpacing: 'normal' | 'relaxed' | 'loose';
    useDyslexicFont: boolean;
    simplifyVocabulary: boolean;
    includeChecklists: boolean;
    includeAudioCues: boolean;
  };
}

export const DEFAULT_LEARNER_PROFILES: LearnerProfile[] = [
  {
    id: 'general',
    name: 'General Classroom Standard',
    type: 'general',
    description: 'Standard curriculum structure optimized for mainstream learners.',
    accommodations: {
      fontSize: 'normal',
      lineSpacing: 'normal',
      useDyslexicFont: false,
      simplifyVocabulary: false,
      includeChecklists: false,
      includeAudioCues: false,
    }
  },
  {
    id: 'dyslexia',
    name: 'Dyslexia Accommodation Profile',
    type: 'dyslexia',
    description: 'Scaffolded visuals, high-legibility layout, and clear bullet-point structural segments.',
    accommodations: {
      fontSize: 'large',
      lineSpacing: 'relaxed',
      useDyslexicFont: true,
      simplifyVocabulary: false,
      includeChecklists: true,
      includeAudioCues: false,
    }
  },
  {
    id: 'adhd',
    name: 'ADHD / High Focus Profile',
    type: 'adhd',
    description: 'Incorporate mini-milestones, actionable checklists, visual indicators, and summarized takeaways.',
    accommodations: {
      fontSize: 'normal',
      lineSpacing: 'normal',
      useDyslexicFont: false,
      simplifyVocabulary: false,
      includeChecklists: true,
      includeAudioCues: true,
    }
  },
  {
    id: 'esl',
    name: 'ESL / Language Scaffold',
    type: 'esl',
    description: 'Simplified sentence structure, integrated glossaries, and bilingual keyword translations.',
    accommodations: {
      fontSize: 'normal',
      lineSpacing: 'relaxed',
      useDyslexicFont: false,
      simplifyVocabulary: true,
      includeChecklists: false,
      includeAudioCues: false,
    }
  },
  {
    id: 'visual',
    name: 'Low-Vision / High Contrast',
    type: 'visual',
    description: 'Extra-large display headers, prominent layout separations, and detailed image descriptions.',
    accommodations: {
      fontSize: 'xlarge',
      lineSpacing: 'loose',
      useDyslexicFont: false,
      simplifyVocabulary: false,
      includeChecklists: true,
      includeAudioCues: true,
    }
  }
];

export interface VoiceProfile {
  id: string;
  name: string;
  displayName: string;
  accent: string;
  flag: string;
  gender: 'Female' | 'Male' | 'Neutral';
  langCodes: string[];
  voiceNames: string[];
  description: string;
}

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'us-female-samantha',
    name: 'Samantha',
    displayName: 'Samantha (US English)',
    accent: 'United States',
    flag: '🇺🇸',
    gender: 'Female',
    langCodes: ['en-us', 'en_us'],
    voiceNames: ['samantha', 'zira', 'sasha', 'female', 'google us english'],
    description: 'Crisp, natural-sounding professional tone'
  },
  {
    id: 'us-male-david',
    name: 'David',
    displayName: 'David (US English)',
    accent: 'United States',
    flag: '🇺🇸',
    gender: 'Male',
    langCodes: ['en-us', 'en_us'],
    voiceNames: ['david', 'google us english male', 'microsoft david', 'male'],
    description: 'Deep, clear instructional cadence'
  },
  {
    id: 'uk-female-hazel',
    name: 'Hazel',
    displayName: 'Hazel (UK English)',
    accent: 'United Kingdom',
    flag: '🇬🇧',
    gender: 'Female',
    langCodes: ['en-gb', 'en_gb', 'en-uk', 'en_uk'],
    voiceNames: ['hazel', 'google uk english female', 'victoria', 'female'],
    description: 'Warm, refined British educational voice'
  },
  {
    id: 'uk-male-george',
    name: 'George',
    displayName: 'George (UK English)',
    accent: 'United Kingdom',
    flag: '🇬🇧',
    gender: 'Male',
    langCodes: ['en-gb', 'en_gb', 'en-uk', 'en_uk'],
    voiceNames: ['george', 'google uk english male', 'male'],
    description: 'Articulate, classic academic tone'
  },
  {
    id: 'au-female-olivia',
    name: 'Olivia',
    displayName: 'Olivia (AU English)',
    accent: 'Australia',
    flag: '🇦🇺',
    gender: 'Female',
    langCodes: ['en-au', 'en_au'],
    voiceNames: ['olivia', 'karen', 'australia', 'female'],
    description: 'Cheerful, clear Australian accent'
  },
  {
    id: 'in-female-priya',
    name: 'Priya',
    displayName: 'Priya (Indian English)',
    accent: 'India',
    flag: '🇮🇳',
    gender: 'Female',
    langCodes: ['en-in', 'en_in'],
    voiceNames: ['priya', 'heera', 'india', 'female', 'google indish'],
    description: 'Deliberate, articulate rhythm'
  },
  {
    id: 'sw-regional-zuri',
    name: 'Zuri',
    displayName: 'Zuri (East Africa Swahili)',
    accent: 'East Africa',
    flag: '🇰🇪',
    gender: 'Neutral',
    langCodes: ['sw-ke', 'sw-tz', 'sw'],
    voiceNames: ['swahili', 'kenya', 'tanzania', 'zuri', 'google swahili'],
    description: 'Authentic East African Swahili accent'
  },
  {
    id: 'ng-regional-kofi',
    name: 'Kofi',
    displayName: 'Kofi (West Africa English)',
    accent: 'West Africa',
    flag: '🇳🇬',
    gender: 'Male',
    langCodes: ['en-ng', 'en-gh', 'en-za', 'en'],
    voiceNames: ['kofi', 'nigeria', 'ghana', 'south africa', 'male'],
    description: 'Engaging, resonant West African style'
  }
];

interface AccessibilityContextType {
  fontSize: 'normal' | 'large' | 'xlarge';
  lineSpacing: 'normal' | 'relaxed' | 'loose';
  useDyslexicFont: boolean;
  highContrast: boolean;
  screenReaderHelper: boolean;
  activeLearnerProfile: string; // id of active profile
  learnerProfiles: LearnerProfile[];
  selectedVoiceProfileId: string;
  playbackSpeed: number;
  ttsPitch: number;
  ttsHighlightingEnabled: boolean;
  ttsKeyboardControlsEnabled: boolean;
  selectedMicDeviceId: string;
  selectedCameraDeviceId: string;
  
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  setLineSpacing: (spacing: 'normal' | 'relaxed' | 'loose') => void;
  setUseDyslexicFont: (use: boolean) => void;
  setHighContrast: (contrast: boolean) => void;
  setScreenReaderHelper: (helper: boolean) => void;
  setActiveLearnerProfile: (id: string) => void;
  addLearnerProfile: (profile: LearnerProfile) => void;
  deleteLearnerProfile: (id: string) => void;
  setSelectedVoiceProfileId: (id: string) => void;
  setPlaybackSpeed: (speed: number) => void;
  setTtsPitch: (pitch: number) => void;
  setTtsHighlightingEnabled: (enabled: boolean) => void;
  setTtsKeyboardControlsEnabled: (enabled: boolean) => void;
  setSelectedMicDeviceId: (id: string) => void;
  setSelectedCameraDeviceId: (id: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'xlarge'>(() => {
    return (localStorage.getItem('access_font_size') as 'normal' | 'large' | 'xlarge') || 'normal';
  });
  
  const [lineSpacing, setLineSpacingState] = useState<'normal' | 'relaxed' | 'loose'>(() => {
    return (localStorage.getItem('access_line_spacing') as 'normal' | 'relaxed' | 'loose') || 'normal';
  });
  
  const [useDyslexicFont, setUseDyslexicFontState] = useState<boolean>(() => {
    return localStorage.getItem('access_dyslexic_font') === 'true';
  });
  
  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem('access_high_contrast') === 'true';
  });

  const [screenReaderHelper, setScreenReaderHelperState] = useState<boolean>(() => {
    return localStorage.getItem('access_screen_reader') === 'true';
  });

  const [activeLearnerProfile, setActiveLearnerProfileState] = useState<string>(() => {
    return localStorage.getItem('access_active_learner_profile') || 'general';
  });

  const [learnerProfiles, setLearnerProfiles] = useState<LearnerProfile[]>(() => {
    const stored = localStorage.getItem('access_learner_profiles');
    return stored ? JSON.parse(stored) : DEFAULT_LEARNER_PROFILES;
  });

  const [selectedVoiceProfileId, setSelectedVoiceProfileIdState] = useState<string>(() => {
    return localStorage.getItem('access_selected_voice_profile_id') || 'us-female-samantha';
  });

  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(() => {
    const saved = localStorage.getItem('access_playback_speed');
    return saved ? parseFloat(saved) : 1.0;
  });

  const [ttsPitch, setTtsPitchState] = useState<number>(() => {
    const saved = localStorage.getItem('access_tts_pitch');
    return saved ? parseFloat(saved) : 1.0;
  });

  const [ttsHighlightingEnabled, setTtsHighlightingEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('access_tts_highlighting_enabled');
    return saved !== 'false'; // defaults to true
  });

  const [ttsKeyboardControlsEnabled, setTtsKeyboardControlsEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('access_tts_keyboard_controls_enabled');
    return saved !== 'false'; // defaults to true
  });

  const [selectedMicDeviceId, setSelectedMicDeviceIdState] = useState<string>(() => {
    return localStorage.getItem('access_selected_mic_device_id') || '';
  });

  const [selectedCameraDeviceId, setSelectedCameraDeviceIdState] = useState<string>(() => {
    return localStorage.getItem('access_selected_camera_device_id') || '';
  });

  const setSelectedVoiceProfileId = (id: string) => {
    setSelectedVoiceProfileIdState(id);
    localStorage.setItem('access_selected_voice_profile_id', id);
    window.dispatchEvent(new Event('voice_profile_changed'));
  };

  const setSelectedMicDeviceId = (id: string) => {
    setSelectedMicDeviceIdState(id);
    localStorage.setItem('access_selected_mic_device_id', id);
    window.dispatchEvent(new Event('mic_device_changed'));
  };

  const setSelectedCameraDeviceId = (id: string) => {
    setSelectedCameraDeviceIdState(id);
    localStorage.setItem('access_selected_camera_device_id', id);
    window.dispatchEvent(new Event('camera_device_changed'));
  };

  const setPlaybackSpeed = (speed: number) => {
    setPlaybackSpeedState(speed);
    localStorage.setItem('access_playback_speed', speed.toString());
    window.dispatchEvent(new Event('playback_speed_changed'));
  };

  const setTtsPitch = (pitch: number) => {
    setTtsPitchState(pitch);
    localStorage.setItem('access_tts_pitch', pitch.toString());
    window.dispatchEvent(new Event('tts_pitch_changed'));
  };

  const setTtsHighlightingEnabled = (enabled: boolean) => {
    setTtsHighlightingEnabledState(enabled);
    localStorage.setItem('access_tts_highlighting_enabled', enabled ? 'true' : 'false');
  };

  const setTtsKeyboardControlsEnabled = (enabled: boolean) => {
    setTtsKeyboardControlsEnabledState(enabled);
    localStorage.setItem('access_tts_keyboard_controls_enabled', enabled ? 'true' : 'false');
  };

  // Apply visual styling toggles directly on document html element
  useEffect(() => {
    const root = document.documentElement;
    
    // Line spacing
    root.classList.remove('spacing-normal', 'spacing-relaxed', 'spacing-loose');
    root.classList.add(`spacing-${lineSpacing}`);
    
    // Dyslexic font
    if (useDyslexicFont) {
      root.classList.add('use-dyslexic');
    } else {
      root.classList.remove('use-dyslexic');
    }
    
    // High Contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [lineSpacing, useDyslexicFont, highContrast]);

  const setFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSizeState(size);
    localStorage.setItem('access_font_size', size);
    window.dispatchEvent(new Event('font_size_changed'));
  };

  const setLineSpacing = (spacing: 'normal' | 'relaxed' | 'loose') => {
    setLineSpacingState(spacing);
    localStorage.setItem('access_line_spacing', spacing);
  };

  const setUseDyslexicFont = (use: boolean) => {
    setUseDyslexicFontState(use);
    localStorage.setItem('access_dyslexic_font', use ? 'true' : 'false');
  };

  const setHighContrast = (contrast: boolean) => {
    setHighContrastState(contrast);
    localStorage.setItem('access_high_contrast', contrast ? 'true' : 'false');
  };

  const setScreenReaderHelper = (helper: boolean) => {
    setScreenReaderHelperState(helper);
    localStorage.setItem('access_screen_reader', helper ? 'true' : 'false');
  };

  const setActiveLearnerProfile = (id: string) => {
    setActiveLearnerProfileState(id);
    localStorage.setItem('access_active_learner_profile', id);
    
    // Auto-apply accommodations of profile to editor if not general
    const profile = learnerProfiles.find(p => p.id === id);
    if (profile && id !== 'general') {
      if (profile.accommodations.fontSize) setFontSize(profile.accommodations.fontSize);
      if (profile.accommodations.lineSpacing) setLineSpacing(profile.accommodations.lineSpacing);
      setUseDyslexicFont(profile.accommodations.useDyslexicFont);
    }
  };

  const addLearnerProfile = (profile: LearnerProfile) => {
    const updated = [...learnerProfiles, profile];
    setLearnerProfiles(updated);
    localStorage.setItem('access_learner_profiles', JSON.stringify(updated));
  };

  const deleteLearnerProfile = (id: string) => {
    if (id === 'general' || id === 'dyslexia' || id === 'adhd' || id === 'esl' || id === 'visual') return; // protect default
    const updated = learnerProfiles.filter(p => p.id !== id);
    setLearnerProfiles(updated);
    localStorage.setItem('access_learner_profiles', JSON.stringify(updated));
    if (activeLearnerProfile === id) {
      setActiveLearnerProfile('general');
    }
  };

  return (
    <AccessibilityContext.Provider value={{
      fontSize,
      lineSpacing,
      useDyslexicFont,
      highContrast,
      screenReaderHelper,
      activeLearnerProfile,
      learnerProfiles,
      selectedVoiceProfileId,
      playbackSpeed,
      ttsPitch,
      ttsHighlightingEnabled,
      ttsKeyboardControlsEnabled,
      selectedMicDeviceId,
      selectedCameraDeviceId,
      setFontSize,
      setLineSpacing,
      setUseDyslexicFont,
      setHighContrast,
      setScreenReaderHelper,
      setActiveLearnerProfile,
      addLearnerProfile,
      deleteLearnerProfile,
      setSelectedVoiceProfileId,
      setPlaybackSpeed,
      setTtsPitch,
      setTtsHighlightingEnabled,
      setTtsKeyboardControlsEnabled,
      setSelectedMicDeviceId,
      setSelectedCameraDeviceId,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
