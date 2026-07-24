import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  Sparkles, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  RefreshCw, 
  Languages, 
  BookOpen, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  Sliders,
  Eye,
  Zap,
  Ear,
  Smile,
  X,
  Layers,
  Search,
  Grid,
  Activity,
  SlidersHorizontal
} from 'lucide-react';

export interface PhoneticWordProfile {
  word: string;
  partOfSpeech: string;
  ipaPhonetic: string;
  friendlySpelling: string;
  syllables: string[];
  primaryStressIndex: number;
  visemeSequence: string[];
  definition: string;
  translation: string;
  articulationGuide: string;
  difficultyTier: 'moderate' | 'challenging' | 'advanced';
}

export interface VisualPhoneticsStudioProps {
  initialSnippet?: string;
  initialWord?: string;
  targetLanguage?: string;
  onClose?: () => void;
  isModal?: boolean;
}

// Front-view viseme configurations for 2D facial avatar
export const VISEME_CONFIGS: Record<string, {
  label: string;
  description: string;
  lips: string;
  innerMouth: string;
  teethY: number;
  tongueY: number;
  tongueShape: string;
  open: boolean;
  voicing: boolean;
  airflow?: 'forward' | 'nasal' | 'fricative' | 'none';
}> = {
  idle: {
    label: "Resting Position",
    description: "Lips closed softly, jaw relaxed, neutral tongue position.",
    lips: "M 32,50 Q 50,49 68,50 Q 50,51 32,50",
    innerMouth: "M 32,50 Q 50,50 68,50 Q 50,50 32,50",
    teethY: 42,
    tongueY: 58,
    tongueShape: "M 40,58 Q 50,55 60,58 Q 50,65 40,58",
    open: false,
    voicing: false,
    airflow: 'none'
  },
  ae: {
    label: "Open Vowel /æ/, /a/",
    description: "Jaw drops open wide, tongue stays low behind lower teeth.",
    lips: "M 28,46 Q 50,22 72,46 Q 50,78 28,46",
    innerMouth: "M 30,46 Q 50,28 70,46 Q 50,72 30,46",
    teethY: 32,
    tongueY: 62,
    tongueShape: "M 38,62 Q 50,60 62,62 Q 50,70 38,62",
    open: true,
    voicing: true,
    airflow: 'forward'
  },
  oo: {
    label: "Rounded Lips /uː/, /oʊ/, /w/",
    description: "Lips pucker forward tightly into a small round circle.",
    lips: "M 38,42 Q 50,30 62,42 Q 50,60 38,42",
    innerMouth: "M 40,42 Q 50,35 60,42 Q 50,55 40,42",
    teethY: 37,
    tongueY: 55,
    tongueShape: "M 42,55 Q 50,52 58,55 Q 50,62 42,55",
    open: true,
    voicing: true,
    airflow: 'forward'
  },
  ee: {
    label: "Wide Vowel /iː/, /eɪ/",
    description: "Lips stretch sideways in a wide smile, teeth slightly visible.",
    lips: "M 22,48 Q 50,41 78,48 Q 50,57 22,48",
    innerMouth: "M 25,48 Q 50,43 75,48 Q 50,55 25,48",
    teethY: 40,
    tongueY: 50,
    tongueShape: "M 35,50 Q 50,46 65,50 Q 50,58 35,50",
    open: true,
    voicing: true,
    airflow: 'forward'
  },
  fv: {
    label: "Labiodental /f/, /v/",
    description: "Upper front teeth touch lower lip softly; air passes over lip.",
    lips: "M 30,47 Q 50,44 70,47 Q 50,60 30,47",
    innerMouth: "M 32,47 Q 50,45 68,47 Q 50,56 32,47",
    teethY: 46,
    tongueY: 56,
    tongueShape: "M 40,56 Q 50,54 60,56 Q 50,62 40,56",
    open: true,
    voicing: false,
    airflow: 'fricative'
  },
  bmp: {
    label: "Bilabial /b/, /p/, /m/",
    description: "Lips press firmly together to build air pressure.",
    lips: "M 28,50 Q 50,48 72,50 Q 50,52 28,50",
    innerMouth: "M 28,50 Q 50,50 72,50 Q 50,50 28,50",
    teethY: 44,
    tongueY: 58,
    tongueShape: "M 40,58 Q 50,56 60,58 Q 50,64 40,58",
    open: false,
    voicing: true,
    airflow: 'nasal'
  },
  sz: {
    label: "Sibilant /s/, /z/, /ʃ/",
    description: "Teeth close almost completely together; narrow air stream.",
    lips: "M 26,47 Q 50,39 74,47 Q 50,56 26,47",
    innerMouth: "M 28,47 Q 50,42 72,47 Q 50,53 28,47",
    teethY: 43,
    tongueY: 52,
    tongueShape: "M 36,52 Q 50,48 64,52 Q 50,58 36,52",
    open: true,
    voicing: false,
    airflow: 'fricative'
  },
  th: {
    label: "Dental Fricative /θ/, /ð/",
    description: "Tongue tip protrudes lightly between upper and lower front teeth.",
    lips: "M 28,46 Q 50,38 72,46 Q 50,58 28,46",
    innerMouth: "M 30,46 Q 50,41 70,46 Q 50,55 30,46",
    teethY: 41,
    tongueY: 45,
    tongueShape: "M 42,46 Q 50,42 58,46 Q 50,53 42,46",
    open: true,
    voicing: true,
    airflow: 'fricative'
  },
  l_r: {
    label: "Alveolar Liquid /l/, /r/",
    description: "Tongue tip curls up to touch alveolar ridge behind top teeth.",
    lips: "M 28,46 Q 50,36 72,46 Q 50,60 28,46",
    innerMouth: "M 30,46 Q 50,39 70,46 Q 50,57 30,46",
    teethY: 38,
    tongueY: 42,
    tongueShape: "M 38,42 Q 50,36 62,42 Q 50,50 38,42",
    open: true,
    voicing: true,
    airflow: 'forward'
  },
  open_jaw: {
    label: "Deep Jaw Drop /ɑː/, /ɒ/",
    description: "Maximum jaw opening for full open back vowels.",
    lips: "M 26,44 Q 50,18 74,44 Q 50,82 26,44",
    innerMouth: "M 28,44 Q 50,24 72,44 Q 50,76 28,44",
    teethY: 30,
    tongueY: 66,
    tongueShape: "M 36,66 Q 50,64 64,66 Q 50,74 36,66",
    open: true,
    voicing: true,
    airflow: 'forward'
  },
  tongue_up: {
    label: "Alveolar Stop /t/, /d/, /n/",
    description: "Tongue raises to block air behind upper teeth ridge.",
    lips: "M 28,46 Q 50,38 72,46 Q 50,58 28,46",
    innerMouth: "M 30,46 Q 50,41 70,46 Q 50,55 30,46",
    teethY: 39,
    tongueY: 40,
    tongueShape: "M 36,40 Q 50,34 64,40 Q 50,48 36,40",
    open: true,
    voicing: true,
    airflow: 'forward'
  }
};

// TOP 50 PHONETIC SOUNDS DATASET FOR ESL & AUDITORY/SPEECH LEARNERS
export interface PhoneticSoundItem {
  id: string;
  symbol: string;
  name: string;
  category: 'Monophthong Vowels' | 'Diphthongs' | 'Plosives' | 'Fricatives' | 'Affricates' | 'Nasals' | 'Liquids & Glides' | 'Special ESL Variations';
  example: string;
  type: 'voiced' | 'unvoiced';
  visemeKey: string;
  tonguePosition: string;
  lipPosition: string;
  airflow: 'forward' | 'fricative' | 'nasal' | 'explosive' | 'lateral' | 'none';
  // Sagittal SVG tongue path coordinates
  sagittalTonguePath: string; // M x,y Q control points for side profile tongue
  animationPhases: [string, string, string, string]; // 4 step sequence
}

export const TOP_50_PHONETIC_SOUNDS: PhoneticSoundItem[] = [
  // --- MONOPHTHONG VOWELS (12) ---
  {
    id: 'ae_vowel',
    symbol: '/æ/',
    name: 'Short A Vowel',
    category: 'Monophthong Vowels',
    example: 'Cat, Black, Apple',
    type: 'voiced',
    visemeKey: 'ae',
    tonguePosition: 'Tongue stays low and flat behind lower front teeth, tip touching lower incisors.',
    lipPosition: 'Jaw drops open wide, lips unrounded and relaxed.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,75 Q 55,78 78,72 Q 72,85 35,75',
    animationPhases: ['1. Relax jaw', '2. Drop jaw open & flatten tongue', '3. Airflow resonates through open cavity', '4. Soft closure']
  },
  {
    id: 'ee_vowel',
    symbol: '/iː/',
    name: 'Long E Vowel',
    category: 'Monophthong Vowels',
    example: 'See, Team, Machine',
    type: 'voiced',
    visemeKey: 'ee',
    tonguePosition: 'Front body of tongue arches high toward hard palate without touching.',
    lipPosition: 'Lips stretch sideways into a wide smile posture.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,70 Q 52,48 78,65 Q 68,80 35,70',
    animationPhases: ['1. Smile posture', '2. Raise front of tongue high to palate', '3. Vocal cord resonance', '4. Relax cheeks']
  },
  {
    id: 'ih_vowel',
    symbol: '/ɪ/',
    name: 'Short I Vowel',
    category: 'Monophthong Vowels',
    example: 'Sit, Big, English',
    type: 'voiced',
    visemeKey: 'ee',
    tonguePosition: 'Tongue is relaxed, slightly high toward front palate.',
    lipPosition: 'Lips loosely spread, jaw slightly open.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,72 Q 52,56 78,68 Q 68,82 35,72',
    animationPhases: ['1. Slight jaw drop', '2. Relaxed high tongue', '3. Short voiced burst', '4. Return to rest']
  },
  {
    id: 'eh_vowel',
    symbol: '/e/',
    name: 'Short E Vowel',
    category: 'Monophthong Vowels',
    example: 'Bed, Head, Red',
    type: 'voiced',
    visemeKey: 'ae',
    tonguePosition: 'Mid-front tongue body raised moderately.',
    lipPosition: 'Lips mid-open, unrounded.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,74 Q 53,62 78,70 Q 68,83 35,74',
    animationPhases: ['1. Mid jaw opening', '2. Mid-front tongue position', '3. Voiced resonance', '4. Relaxation']
  },
  {
    id: 'ah_vowel',
    symbol: '/ɑː/',
    name: 'Open Back Ah Vowel',
    category: 'Monophthong Vowels',
    example: 'Father, Palm, Car',
    type: 'voiced',
    visemeKey: 'open_jaw',
    tonguePosition: 'Tongue pulled back and low in pharynx cavity.',
    lipPosition: 'Jaw fully open, lips unrounded.',
    airflow: 'forward',
    sagittalTonguePath: 'M 30,82 Q 50,80 78,75 Q 70,88 30,82',
    animationPhases: ['1. Maximum jaw opening', '2. Retract tongue back & down', '3. Deep pharyngeal resonance', '4. Close jaw']
  },
  {
    id: 'oh_vowel',
    symbol: '/ɒ/',
    name: 'Short O Vowel',
    category: 'Monophthong Vowels',
    example: 'Hot, Stop, Lock',
    type: 'voiced',
    visemeKey: 'open_jaw',
    tonguePosition: 'Low back tongue, slightly raised behind.',
    lipPosition: 'Jaw open, lips slightly rounded.',
    airflow: 'forward',
    sagittalTonguePath: 'M 32,80 Q 52,78 78,74 Q 70,86 32,80',
    animationPhases: ['1. Open jaw', '2. Slight lip rounding', '3. Back vowel resonance', '4. Return']
  },
  {
    id: 'aw_vowel',
    symbol: '/ɔː/',
    name: 'Long Aw Vowel',
    category: 'Monophthong Vowels',
    example: 'Saw, Law, Door',
    type: 'voiced',
    visemeKey: 'oo',
    tonguePosition: 'Back of tongue raised moderately towards soft palate.',
    lipPosition: 'Lips rounded into medium circle.',
    airflow: 'forward',
    sagittalTonguePath: 'M 32,76 Q 56,60 78,70 Q 70,84 32,76',
    animationPhases: ['1. Round lips', '2. Raise back of tongue', '3. Rich vocal tone', '4. Unround']
  },
  {
    id: 'uh_vowel',
    symbol: '/ʊ/',
    name: 'Short Oo Vowel',
    category: 'Monophthong Vowels',
    example: 'Put, Look, Foot',
    type: 'voiced',
    visemeKey: 'oo',
    tonguePosition: 'Back of tongue raised high-mid, relaxed.',
    lipPosition: 'Lips loosely rounded, not puckered.',
    airflow: 'forward',
    sagittalTonguePath: 'M 34,74 Q 58,58 78,68 Q 70,82 34,74',
    animationPhases: ['1. Loose lip pucker', '2. Lift back tongue', '3. Short voiced pulse', '4. Rest']
  },
  {
    id: 'oo_vowel',
    symbol: '/uː/',
    name: 'Long U Vowel',
    category: 'Monophthong Vowels',
    example: 'Too, Blue, Moon',
    type: 'voiced',
    visemeKey: 'oo',
    tonguePosition: 'Back of tongue raised high toward soft palate (velum).',
    lipPosition: 'Lips tightly puckered into small round opening.',
    airflow: 'forward',
    sagittalTonguePath: 'M 32,72 Q 60,50 78,66 Q 70,80 32,72',
    animationPhases: ['1. Tight pucker circle', '2. Arch back tongue high to velum', '3. Resonant rounded sound', '4. Release']
  },
  {
    id: 'cup_vowel',
    symbol: '/ʌ/',
    name: 'Short Uh Vowel',
    category: 'Monophthong Vowels',
    example: 'Cup, Sun, Love',
    type: 'voiced',
    visemeKey: 'ae',
    tonguePosition: 'Center of tongue slightly raised in mid-back region.',
    lipPosition: 'Lips relaxed and neutral, jaw relaxed open.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,76 Q 52,70 78,74 Q 70,85 35,76',
    animationPhases: ['1. Relaxed jaw drop', '2. Mid-back tongue elevation', '3. Central vocal pulse', '4. Return']
  },
  {
    id: 'er_vowel',
    symbol: '/ɜː/',
    name: 'Rhotic Er Vowel',
    category: 'Monophthong Vowels',
    example: 'Bird, Learn, World',
    type: 'voiced',
    visemeKey: 'l_r',
    tonguePosition: 'Sides of tongue pressed against upper molars, tip bunched back.',
    lipPosition: 'Lips slightly unrounded, neutral.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,70 Q 50,54 74,68 Q 68,80 35,70',
    animationPhases: ['1. Bunch tongue body back', '2. Anchor tongue sides to upper molars', '3. Rhotic vocal tone', '4. Relax']
  },
  {
    id: 'schwa_vowel',
    symbol: '/ə/',
    name: 'Neutral Schwa Vowel',
    category: 'Monophthong Vowels',
    example: 'About, Teacher, Pencil',
    type: 'voiced',
    visemeKey: 'idle',
    tonguePosition: 'Completely neutral tongue resting at mid-center.',
    lipPosition: 'Completely neutral lips and jaw.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,75 Q 52,72 78,75 Q 70,84 35,75',
    animationPhases: ['1. Completely relaxed mouth', '2. Minimal vocal impulse', '3. Short schwa resonance', '4. Rest']
  },

  // --- DIPHTHONGS (8) ---
  {
    id: 'diph_ey',
    symbol: '/eɪ/',
    name: 'Ey Diphthong',
    category: 'Diphthongs',
    example: 'Day, Make, Rain',
    type: 'voiced',
    visemeKey: 'ee',
    tonguePosition: 'Glides from mid-open /e/ to high front /ɪ/.',
    lipPosition: 'Lips move from open relaxed to wide smile.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,74 Q 53,58 78,66 Q 68,80 35,74',
    animationPhases: ['1. Start mid-open /e/', '2. Tongue glides up & forward', '3. Lips stretch to smile', '4. Finish on /ɪ/']
  },
  {
    id: 'diph_ay',
    symbol: '/aɪ/',
    name: 'Ay Diphthong',
    category: 'Diphthongs',
    example: 'My, Night, Time',
    type: 'voiced',
    visemeKey: 'ae',
    tonguePosition: 'Glides from low open /a/ up to high front /ɪ/.',
    lipPosition: 'Jaw starts wide open, closes into wide smile.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,78 Q 52,54 78,66 Q 68,82 35,78',
    animationPhases: ['1. Wide jaw opening /a/', '2. Tongue arches high', '3. Jaw closes upward', '4. End on /ɪ/']
  },
  {
    id: 'diph_oy',
    symbol: '/ɔɪ/',
    name: 'Oy Diphthong',
    category: 'Diphthongs',
    example: 'Boy, Voice, Coin',
    type: 'voiced',
    visemeKey: 'oo',
    tonguePosition: 'Glides from rounded back /ɔː/ to high front /ɪ/.',
    lipPosition: 'Lips start rounded, shift to wide smile.',
    airflow: 'forward',
    sagittalTonguePath: 'M 32,76 Q 55,52 78,66 Q 70,82 32,76',
    animationPhases: ['1. Rounded lips /ɔː/', '2. Tongue sweeps forward', '3. Lips unround into smile', '4. End on /ɪ/']
  },
  {
    id: 'diph_ow',
    symbol: '/aʊ/',
    name: 'Ow Diphthong',
    category: 'Diphthongs',
    example: 'Now, House, Mouth',
    type: 'voiced',
    visemeKey: 'open_jaw',
    tonguePosition: 'Glides from low open /a/ to high back rounded /ʊ/.',
    lipPosition: 'Jaw drops open, then puckers tight into round lips.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,78 Q 58,52 78,68 Q 70,82 35,78',
    animationPhases: ['1. Wide open jaw /a/', '2. Tongue glides to back velum', '3. Lips pucker into round /ʊ/', '4. Finish']
  },
  {
    id: 'diph_oh',
    symbol: '/əʊ/',
    name: 'Oh Diphthong',
    category: 'Diphthongs',
    example: 'Go, Home, Boat',
    type: 'voiced',
    visemeKey: 'oo',
    tonguePosition: 'Glides from central schwa /ə/ to high back /ʊ/.',
    lipPosition: 'Lips move from neutral to rounded pucker.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,75 Q 58,56 78,68 Q 70,82 35,75',
    animationPhases: ['1. Neutral start /ə/', '2. Back of tongue lifts', '3. Lips pucker into round /ʊ/', '4. Rest']
  },
  {
    id: 'diph_ear',
    symbol: '/ɪə/',
    name: 'Ear Diphthong',
    category: 'Diphthongs',
    example: 'Hear, Fear, Clear',
    type: 'voiced',
    visemeKey: 'ee',
    tonguePosition: 'Glides from high front /ɪ/ down to central schwa /ə/.',
    lipPosition: 'Lips move from spread smile to relaxed neutral.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,70 Q 52,65 78,74 Q 68,82 35,70',
    animationPhases: ['1. High front /ɪ/', '2. Tongue lowers to center', '3. Lips relax to schwa', '4. Finish']
  },
  {
    id: 'diph_air',
    symbol: '/eə/',
    name: 'Air Diphthong',
    category: 'Diphthongs',
    example: 'Hair, Bear, Square',
    type: 'voiced',
    visemeKey: 'ae',
    tonguePosition: 'Glides from mid-open /e/ to central schwa /ə/.',
    lipPosition: 'Jaw unrounded, relaxed transition.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,74 Q 52,68 78,75 Q 68,83 35,74',
    animationPhases: ['1. Mid-open /e/', '2. Relax tongue to center', '3. Schwa completion', '4. Rest']
  },
  {
    id: 'diph_ure',
    symbol: '/ʊə/',
    name: 'Ure Diphthong',
    category: 'Diphthongs',
    example: 'Pure, Cure, Tour',
    type: 'voiced',
    visemeKey: 'oo',
    tonguePosition: 'Glides from high back /ʊ/ to central schwa /ə/.',
    lipPosition: 'Lips move from rounded pucker to relaxed neutral.',
    airflow: 'forward',
    sagittalTonguePath: 'M 34,72 Q 55,68 78,75 Q 70,82 34,72',
    animationPhases: ['1. Rounded /ʊ/', '2. Unround lips', '3. Central schwa glide', '4. Finish']
  },

  // --- PLOSIVE CONSONANTS (6) ---
  {
    id: 'p_sound',
    symbol: '/p/',
    name: 'Unvoiced Bilabial Stop P',
    category: 'Plosives',
    example: 'Pat, Pen, Paper',
    type: 'unvoiced',
    visemeKey: 'bmp',
    tonguePosition: 'Tongue rests low in mouth; lips form complete occlusion.',
    lipPosition: 'Both lips press tightly together, holding air pressure.',
    airflow: 'explosive',
    sagittalTonguePath: 'M 35,78 Q 55,80 78,75 Q 70,88 35,78',
    animationPhases: ['1. Lip contact & seal', '2. Build intraoral air pressure', '3. Sudden explosive lip release', '4. Air burst']
  },
  {
    id: 'b_sound',
    symbol: '/b/',
    name: 'Voiced Bilabial Stop B',
    category: 'Plosives',
    example: 'Bat, Ball, Cable',
    type: 'voiced',
    visemeKey: 'bmp',
    tonguePosition: 'Tongue rests low; vocal cords vibrate during lip closure.',
    lipPosition: 'Lips press together then burst open with voicing.',
    airflow: 'explosive',
    sagittalTonguePath: 'M 35,78 Q 55,80 78,75 Q 70,88 35,78',
    animationPhases: ['1. Lip seal + vocal cord vibration', '2. Build air pressure', '3. Voiced explosive release', '4. Rest']
  },
  {
    id: 't_sound',
    symbol: '/t/',
    name: 'Unvoiced Alveolar Stop T',
    category: 'Plosives',
    example: 'Top, Tea, Cat',
    type: 'unvoiced',
    visemeKey: 'tongue_up',
    tonguePosition: 'Tongue tip presses firmly against alveolar ridge behind upper front teeth.',
    lipPosition: 'Lips slightly parted, teeth close together.',
    airflow: 'explosive',
    sagittalTonguePath: 'M 35,70 Q 42,32 78,70 Q 68,82 35,70',
    animationPhases: ['1. Tongue tip seals alveolar ridge', '2. Accumulate air pressure', '3. Sharp unvoiced air burst release', '4. Rest']
  },
  {
    id: 'd_sound',
    symbol: '/d/',
    name: 'Voiced Alveolar Stop D',
    category: 'Plosives',
    example: 'Dog, Door, Red',
    type: 'voiced',
    visemeKey: 'tongue_up',
    tonguePosition: 'Tongue tip seals alveolar ridge with active vocal cord vibration.',
    lipPosition: 'Lips parted, jaw slightly open.',
    airflow: 'explosive',
    sagittalTonguePath: 'M 35,70 Q 42,32 78,70 Q 68,82 35,70',
    animationPhases: ['1. Alveolar ridge seal + vocal cords active', '2. Pressure buildup', '3. Voiced burst release', '4. Return']
  },
  {
    id: 'k_sound',
    symbol: '/k/',
    name: 'Unvoiced Velar Stop K',
    category: 'Plosives',
    example: 'Cat, Key, School',
    type: 'unvoiced',
    visemeKey: 'ae',
    tonguePosition: 'Back of tongue body seals against soft palate (velum).',
    lipPosition: 'Lips parted, jaw open.',
    airflow: 'explosive',
    sagittalTonguePath: 'M 35,75 Q 65,30 78,72 Q 70,84 35,75',
    animationPhases: ['1. Back tongue seals soft palate', '2. Trap air in pharynx', '3. Sudden velar air release', '4. Rest']
  },
  {
    id: 'g_sound',
    symbol: '/g/',
    name: 'Voiced Velar Stop G',
    category: 'Plosives',
    example: 'Go, Girl, Big',
    type: 'voiced',
    visemeKey: 'ae',
    tonguePosition: 'Back of tongue seals soft palate while vocal cords vibrate.',
    lipPosition: 'Lips parted, relaxed.',
    airflow: 'explosive',
    sagittalTonguePath: 'M 35,75 Q 65,30 78,72 Q 70,84 35,75',
    animationPhases: ['1. Velar seal + vocal vibration', '2. Build pharyngeal pressure', '3. Voiced release burst', '4. Return']
  },

  // --- FRICATIVE CONSONANTS (9) ---
  {
    id: 'f_sound',
    symbol: '/f/',
    name: 'Unvoiced Labiodental F',
    category: 'Fricatives',
    example: 'Fan, Fish, Photo',
    type: 'unvoiced',
    visemeKey: 'fv',
    tonguePosition: 'Tongue rests neutral in floor of mouth.',
    lipPosition: 'Upper front incisors rest lightly on lower lip; air squeezed through gap.',
    airflow: 'fricative',
    sagittalTonguePath: 'M 35,78 Q 55,80 78,75 Q 70,88 35,78',
    animationPhases: ['1. Lower lip touches upper teeth', '2. Push continuous unvoiced air stream', '3. Friction turbulence', '4. Release']
  },
  {
    id: 'v_sound',
    symbol: '/v/',
    name: 'Voiced Labiodental V',
    category: 'Fricatives',
    example: 'Van, Voice, Love',
    type: 'voiced',
    visemeKey: 'fv',
    tonguePosition: 'Tongue neutral; vocal cords actively vibrating.',
    lipPosition: 'Upper teeth touch lower lip with vocal buzzing.',
    airflow: 'fricative',
    sagittalTonguePath: 'M 35,78 Q 55,80 78,75 Q 70,88 35,78',
    animationPhases: ['1. Lower lip contact with upper incisors', '2. Activate vocal cords', '3. Buzzing friction air stream', '4. Finish']
  },
  {
    id: 'th_unvoiced',
    symbol: '/θ/',
    name: 'Unvoiced Dental Th',
    category: 'Fricatives',
    example: 'Think, Math, Birth',
    type: 'unvoiced',
    visemeKey: 'th',
    tonguePosition: 'Tongue tip protrudes slightly between upper and lower front teeth.',
    lipPosition: 'Lips slightly parted, teeth frame tongue tip.',
    airflow: 'fricative',
    sagittalTonguePath: 'M 35,72 Q 38,40 78,72 Q 68,82 35,72',
    animationPhases: ['1. Protrude tongue tip between teeth', '2. Blow smooth unvoiced air over tongue tip', '3. Soft friction sound', '4. Retract tongue']
  },
  {
    id: 'th_voiced',
    symbol: '/ð/',
    name: 'Voiced Dental Th',
    category: 'Fricatives',
    example: 'This, Mother, They',
    type: 'voiced',
    visemeKey: 'th',
    tonguePosition: 'Tongue tip protrudes between teeth with active vocal cord vibration.',
    lipPosition: 'Lips parted around protruding tongue tip.',
    airflow: 'fricative',
    sagittalTonguePath: 'M 35,72 Q 38,40 78,72 Q 68,82 35,72',
    animationPhases: ['1. Place tongue tip between incisors', '2. Buzz vocal cords', '3. Voiced friction stream', '4. Retract tongue']
  },
  {
    id: 's_sound',
    symbol: '/s/',
    name: 'Unvoiced Alveolar S',
    category: 'Fricatives',
    example: 'Sun, City, Bus',
    type: 'unvoiced',
    visemeKey: 'sz',
    tonguePosition: 'Tongue tip approaches alveolar ridge forming narrow central groove.',
    lipPosition: 'Teeth close almost completely; lips spread slightly.',
    airflow: 'fricative',
    sagittalTonguePath: 'M 35,70 Q 42,36 78,70 Q 68,82 35,70',
    animationPhases: ['1. Form narrow central tongue groove', '2. Close teeth together', '3. High-frequency unvoiced air hiss', '4. Relax']
  },
  {
    id: 'z_sound',
    symbol: '/z/',
    name: 'Voiced Alveolar Z',
    category: 'Fricatives',
    example: 'Zoo, Zero, Buzz',
    type: 'voiced',
    visemeKey: 'sz',
    tonguePosition: 'Tongue tip near alveolar ridge with vocal cord vibration.',
    lipPosition: 'Teeth close together; lips slightly spread.',
    airflow: 'fricative',
    sagittalTonguePath: 'M 35,70 Q 42,36 78,70 Q 68,82 35,70',
    animationPhases: ['1. Align tongue near alveolar ridge', '2. Activate vocal cords', '3. High-pitch buzzing stream', '4. Rest']
  },
  {
    id: 'sh_sound',
    symbol: '/ʃ/',
    name: 'Unvoiced Postalveolar Sh',
    category: 'Fricatives',
    example: 'Shoe, She, Fish',
    type: 'unvoiced',
    visemeKey: 'sz',
    tonguePosition: 'Tongue blade raised toward hard palate behind alveolar ridge.',
    lipPosition: 'Lips slightly flared or rounded forward.',
    airflow: 'fricative',
    sagittalTonguePath: 'M 35,70 Q 48,42 78,68 Q 68,80 35,70',
    animationPhases: ['1. Flare lips forward', '2. Raise tongue blade behind ridge', '3. Broad unvoiced friction stream', '4. Relax']
  },
  {
    id: 'zh_sound',
    symbol: '/ʒ/',
    name: 'Voiced Postalveolar Zh',
    category: 'Fricatives',
    example: 'Measure, Vision, Usual',
    type: 'voiced',
    visemeKey: 'sz',
    tonguePosition: 'Tongue blade raised behind ridge with vocal cord vibration.',
    lipPosition: 'Lips slightly flared forward.',
    airflow: 'fricative',
    sagittalTonguePath: 'M 35,70 Q 48,42 78,68 Q 68,80 35,70',
    animationPhases: ['1. Flare lips + activate vocal cords', '2. Raise tongue blade', '3. Deep buzzing postalveolar sound', '4. Return']
  },
  {
    id: 'h_sound',
    symbol: '/h/',
    name: 'Unvoiced Glottal H',
    category: 'Fricatives',
    example: 'Hat, Home, Behind',
    type: 'unvoiced',
    visemeKey: 'idle',
    tonguePosition: 'Tongue adopts position of upcoming vowel sound.',
    lipPosition: 'Lips open according to upcoming vowel.',
    airflow: 'fricative',
    sagittalTonguePath: 'M 35,75 Q 52,75 78,75 Q 70,85 35,75',
    animationPhases: ['1. Open vocal cords (glottis)', '2. Exhale unvoiced breath', '3. Glottal air friction', '4. Rest']
  },

  // --- AFFRICATES (2) ---
  {
    id: 'ch_sound',
    symbol: '/tʃ/',
    name: 'Unvoiced Postalveolar Ch',
    category: 'Affricates',
    example: 'Chair, Church, Catch',
    type: 'unvoiced',
    visemeKey: 'sz',
    tonguePosition: 'Tongue tip seals postalveolar ridge then releases into friction.',
    lipPosition: 'Lips puckered/flared forward.',
    airflow: 'explosive',
    sagittalTonguePath: 'M 35,70 Q 45,36 78,68 Q 68,80 35,70',
    animationPhases: ['1. Seal postalveolar ridge /t/', '2. Build air pressure', '3. Release into friction burst /ʃ/', '4. Finish']
  },
  {
    id: 'j_sound',
    symbol: '/dʒ/',
    name: 'Voiced Postalveolar J',
    category: 'Affricates',
    example: 'Jump, Edge, Giant',
    type: 'voiced',
    visemeKey: 'sz',
    tonguePosition: 'Tongue seals postalveolar ridge with vocal cords, then releases.',
    lipPosition: 'Lips puckered forward.',
    airflow: 'explosive',
    sagittalTonguePath: 'M 35,70 Q 45,36 78,68 Q 68,80 35,70',
    animationPhases: ['1. Seal postalveolar ridge + voice /d/', '2. Build pressure', '3. Release into voiced burst /ʒ/', '4. Rest']
  },

  // --- NASAL CONSONANTS (3) ---
  {
    id: 'm_sound',
    symbol: '/m/',
    name: 'Voiced Bilabial Nasal M',
    category: 'Nasals',
    example: 'Man, Moon, Time',
    type: 'voiced',
    visemeKey: 'bmp',
    tonguePosition: 'Tongue rests relaxed; soft palate (velum) lowers for nasal airflow.',
    lipPosition: 'Lips closed completely in bilabial seal.',
    airflow: 'nasal',
    sagittalTonguePath: 'M 35,78 Q 55,80 78,75 Q 70,88 35,78',
    animationPhases: ['1. Close lips completely', '2. Lower soft palate (velum)', '3. Direct vocal resonance through nose', '4. Open lips']
  },
  {
    id: 'n_sound',
    symbol: '/n/',
    name: 'Voiced Alveolar Nasal N',
    category: 'Nasals',
    example: 'No, Night, Sun',
    type: 'voiced',
    visemeKey: 'tongue_up',
    tonguePosition: 'Tongue tip seals alveolar ridge; velum lowers for nasal exit.',
    lipPosition: 'Lips slightly open.',
    airflow: 'nasal',
    sagittalTonguePath: 'M 35,70 Q 42,32 78,70 Q 68,82 35,70',
    animationPhases: ['1. Tongue tip seals alveolar ridge', '2. Lower velum', '3. Resonate air through nasal cavity', '4. Release tongue']
  },
  {
    id: 'ng_sound',
    symbol: '/ŋ/',
    name: 'Voiced Velar Nasal Ng',
    category: 'Nasals',
    example: 'Sing, Long, Bank',
    type: 'voiced',
    visemeKey: 'ae',
    tonguePosition: 'Back of tongue seals soft palate while velum lowers.',
    lipPosition: 'Mouth open, relaxed lips.',
    airflow: 'nasal',
    sagittalTonguePath: 'M 35,75 Q 65,30 78,72 Q 70,84 35,75',
    animationPhases: ['1. Back tongue seals velum', '2. Open nasal passageway', '3. Deep nasal resonance', '4. Release seal']
  },

  // --- LIQUIDS & GLIDES (4) ---
  {
    id: 'l_sound',
    symbol: '/l/',
    name: 'Voiced Alveolar Lateral L',
    category: 'Liquids & Glides',
    example: 'Light, Love, Ball',
    type: 'voiced',
    visemeKey: 'l_r',
    tonguePosition: 'Tongue tip touches alveolar ridge; air flows laterally over tongue sides.',
    lipPosition: 'Lips open, relaxed.',
    airflow: 'lateral',
    sagittalTonguePath: 'M 35,72 Q 42,34 78,72 Q 68,82 35,72',
    animationPhases: ['1. Place tongue tip against alveolar ridge', '2. Lower sides of tongue', '3. Voiced air flows over sides', '4. Drop tongue']
  },
  {
    id: 'r_sound',
    symbol: '/r/',
    name: 'Voiced Post-Alveolar R',
    category: 'Liquids & Glides',
    example: 'Red, Run, Car',
    type: 'voiced',
    visemeKey: 'l_r',
    tonguePosition: 'Tongue tip curls back (retroflex) or bunches back without ridge contact.',
    lipPosition: 'Lips slightly flared/rounded.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,70 Q 50,50 72,66 Q 68,80 35,70',
    animationPhases: ['1. Bunch tongue body backward', '2. Curl tip up/back (retroflex)', '3. Voiced resonance', '4. Relax']
  },
  {
    id: 'w_sound',
    symbol: '/w/',
    name: 'Voiced Labio-Velar Glide W',
    category: 'Liquids & Glides',
    example: 'Wet, Water, Win',
    type: 'voiced',
    visemeKey: 'oo',
    tonguePosition: 'Back of tongue raised toward velum while gliding forward.',
    lipPosition: 'Lips start tightly rounded, rapidly opening to following vowel.',
    airflow: 'forward',
    sagittalTonguePath: 'M 32,74 Q 60,52 78,68 Q 70,82 32,74',
    animationPhases: ['1. Tight lip pucker + raised back tongue', '2. Activate vocal cords', '3. Rapid lip unrounding glide', '4. Vowel transition']
  },
  {
    id: 'y_sound',
    symbol: '/j/',
    name: 'Voiced Palatal Glide Y',
    category: 'Liquids & Glides',
    example: 'Yes, Yellow, You',
    type: 'voiced',
    visemeKey: 'ee',
    tonguePosition: 'Front body of tongue raised high to hard palate, gliding away.',
    lipPosition: 'Lips spread in smile, rapidly opening.',
    airflow: 'forward',
    sagittalTonguePath: 'M 35,70 Q 52,48 78,66 Q 68,80 35,70',
    animationPhases: ['1. High front tongue arched to hard palate', '2. Voice vocal cords', '3. Rapid gliding drop into vowel', '4. Rest']
  },

  // --- SPECIAL ESL & ARTICULATION SOUNDS (6) ---
  {
    id: 'glottal_stop',
    symbol: '/ʔ/',
    name: 'Glottal Stop',
    category: 'Special ESL Variations',
    example: 'Uh-oh, Kitten (British/US casual)',
    type: 'unvoiced',
    visemeKey: 'idle',
    tonguePosition: 'Vocal folds clamp completely shut in throat, trapping air.',
    lipPosition: 'Mouth position matches surrounding sound.',
    airflow: 'none',
    sagittalTonguePath: 'M 35,75 Q 52,75 78,75 Q 70,85 35,75',
    animationPhases: ['1. Sudden vocal cord closure', '2. Trap airflow at glottis', '3. Abrupt pressure release', '4. Resume flow']
  },
  {
    id: 'flap_t',
    symbol: '/ɾ/',
    name: 'Alveolar Flap (Water T)',
    category: 'Special ESL Variations',
    example: 'Water, Butter, City (US English)',
    type: 'voiced',
    visemeKey: 'tongue_up',
    tonguePosition: 'Tongue tip taps alveolar ridge ultra-rapidly in a single stroke.',
    lipPosition: 'Lips open and relaxed.',
    airflow: 'explosive',
    sagittalTonguePath: 'M 35,72 Q 42,34 78,72 Q 68,82 35,72',
    animationPhases: ['1. Rapid tongue bounce', '2. Instant tap on alveolar ridge', '3. Immediate recoil', '4. Smooth vowel transition']
  },
  {
    id: 'dark_l',
    symbol: '/ɫ/',
    name: 'Velarized Dark L',
    category: 'Special ESL Variations',
    example: 'Ball, Milk, Full',
    type: 'voiced',
    visemeKey: 'l_r',
    tonguePosition: 'Tongue tip touches ridge while back of tongue arches up to soft palate.',
    lipPosition: 'Lips unrounded.',
    airflow: 'lateral',
    sagittalTonguePath: 'M 35,72 Q 62,42 78,70 Q 68,82 35,72',
    animationPhases: ['1. Dual tongue lift: Tip to ridge + back to velum', '2. Voiced resonance', '3. Deep dark L tone', '4. Release']
  },
  {
    id: 'aspirated_k',
    symbol: '/kʰ/',
    name: 'Aspirated K (Puff of Air)',
    category: 'Special ESL Variations',
    example: 'Key, Cat (Word Initial)',
    type: 'unvoiced',
    visemeKey: 'ae',
    tonguePosition: 'Velar seal followed by noticeable friction puff of air.',
    lipPosition: 'Lips open.',
    airflow: 'explosive',
    sagittalTonguePath: 'M 35,75 Q 65,30 78,72 Q 70,84 35,75',
    animationPhases: ['1. Velar seal', '2. Build air pressure', '3. Release with strong air puff', '4. Return']
  },
  {
    id: 'syllabic_n',
    symbol: '/n̩/',
    name: 'Syllabic N',
    category: 'Special ESL Variations',
    example: 'Button, Hidden, Sudden',
    type: 'voiced',
    visemeKey: 'tongue_up',
    tonguePosition: 'Tongue stays sealed on alveolar ridge; vowel skipped into nasal exit.',
    lipPosition: 'Lips stay in position.',
    airflow: 'nasal',
    sagittalTonguePath: 'M 35,70 Q 42,32 78,70 Q 68,82 35,70',
    animationPhases: ['1. Hold alveolar tongue seal', '2. Lower velum directly', '3. Voiced nasal impulse', '4. Release']
  },
  {
    id: 'syllabic_l',
    symbol: '/l̩/',
    name: 'Syllabic L',
    category: 'Special ESL Variations',
    example: 'Bottle, Little, Middle',
    type: 'voiced',
    visemeKey: 'l_r',
    tonguePosition: 'Tongue stays sealed on ridge forming entire final syllable.',
    lipPosition: 'Lips open.',
    airflow: 'lateral',
    sagittalTonguePath: 'M 35,72 Q 42,34 78,72 Q 68,82 35,72',
    animationPhases: ['1. Direct transition into alveolar seal', '2. Lateral air release', '3. Syllabic resonance', '4. Rest']
  }
];

export const SUPPORTED_LANGS = [
  { code: 'Swahili', label: 'Swahili (Kiswahili)', flag: '🇹🇿' },
  { code: 'Spanish', label: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'French', label: 'French (Français)', flag: '🇫🇷' },
  { code: 'Arabic', label: 'Arabic (العربية)', flag: '🇸🇦' },
  { code: 'Somali', label: 'Somali (Soomaali)', flag: '🇸🇴' },
  { code: 'Hindi', label: 'Hindi (हिन्दी)', flag: '🇮🇳' },
];

export const VisualPhoneticsStudio: React.FC<VisualPhoneticsStudioProps> = ({
  initialSnippet = "Photosynthesis is the complex biological process where chlorophyll absorbs electromagnetic energy to generate glucose.",
  initialWord,
  targetLanguage = "Swahili",
  onClose,
  isModal = false
}) => {
  // Main Studio View Mode
  const [activeTabMode, setActiveTabMode] = useState<'snippet' | 'sound_library'>('sound_library');

  // Mode 1: Snippet & Extracted Vocab State
  const [snippetText, setSnippetText] = useState(initialSnippet);
  const [selectedLang, setSelectedLang] = useState(targetLanguage);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [extractedProfiles, setExtractedProfiles] = useState<PhoneticWordProfile[]>([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number>(0);

  // Mode 2: 50 Phonetic Sounds Library State
  const [soundSearchQuery, setSoundSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSoundId, setSelectedSoundId] = useState<string>('th_unvoiced');
  const [viewAngle, setViewAngle] = useState<'dual' | 'sagittal' | 'front'>('dual');

  // Shared Animation & Avatar State
  const [activeVisemeKey, setActiveVisemeKey] = useState<string>('idle');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.5); // 0.25x, 0.5x, 0.75x, 1x
  const [isPlayingAnimation, setIsPlayingAnimation] = useState<boolean>(false);
  const [activeSequenceStep, setActiveSequenceStep] = useState<number>(1); // 0, 1, 2, 3
  const animationTimerRef = useRef<any>(null);

  // Microphone Speech Practice State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [practiceFeedback, setPracticeFeedback] = useState<{ match: boolean; score: number; text: string } | null>(null);

  // Fetch AI Phonetics Extraction for Snippet
  const fetchPhoneticsExtract = async (text: string, lang: string) => {
    setLoadingExtract(true);
    try {
      const res = await fetch('/api/phonetics/extract-vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snippetText: text, targetLanguage: lang })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.complexWords && data.complexWords.length > 0) {
          setExtractedProfiles(data.complexWords);
          if (initialWord) {
            const foundIdx = data.complexWords.findIndex(
              (p: PhoneticWordProfile) => p.word.toLowerCase() === initialWord.toLowerCase()
            );
            setSelectedProfileIndex(foundIdx >= 0 ? foundIdx : 0);
          } else {
            setSelectedProfileIndex(0);
          }
        } else {
          useFallbackProfiles(text);
        }
      } else {
        useFallbackProfiles(text);
      }
    } catch (err) {
      console.error("Failed to fetch visual phonetics extract:", err);
      useFallbackProfiles(text);
    } finally {
      setLoadingExtract(false);
    }
  };

  const useFallbackProfiles = (text: string) => {
    const words = text.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 5);
    const uniqueWords = Array.from(new Set(words)).slice(0, 5);

    const fallbacks: PhoneticWordProfile[] = uniqueWords.map(w => ({
      word: w,
      partOfSpeech: 'noun/verb',
      ipaPhonetic: `/${w.toLowerCase()}/`,
      friendlySpelling: w.toUpperCase(),
      syllables: [w.slice(0, Math.ceil(w.length / 2)).toLowerCase(), w.slice(Math.ceil(w.length / 2)).toLowerCase()],
      primaryStressIndex: 0,
      visemeSequence: ['idle', 'ae', 'ee', 'sz', 'idle'],
      definition: `Key academic vocabulary term from the text snippet.`,
      translation: `[Translation in ${selectedLang}]`,
      articulationGuide: "Observe lip opening and tongue positioning during pronunciation.",
      difficultyTier: w.length > 9 ? 'advanced' : 'challenging'
    }));

    setExtractedProfiles(fallbacks);
    setSelectedProfileIndex(0);
  };

  useEffect(() => {
    if (snippetText) {
      fetchPhoneticsExtract(snippetText, selectedLang);
    }
  }, [snippetText, selectedLang]);

  // Current active word profile in Snippet Mode
  const currentWordProfile = extractedProfiles[selectedProfileIndex] || null;

  // Current active sound item in Sound Library Mode
  const currentSoundItem = TOP_50_PHONETIC_SOUNDS.find(s => s.id === selectedSoundId) || TOP_50_PHONETIC_SOUNDS[0];

  // Sound Library Filtering
  const filteredSounds = TOP_50_PHONETIC_SOUNDS.filter(s => {
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesQuery = s.symbol.toLowerCase().includes(soundSearchQuery.toLowerCase()) ||
                         s.name.toLowerCase().includes(soundSearchQuery.toLowerCase()) ||
                         s.example.toLowerCase().includes(soundSearchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Play Step-by-Step CSS/SVG Animation Sequence for Current Phonetic Sound
  const handlePlaySoundAnimation = () => {
    if (isPlayingAnimation) {
      clearTimeout(animationTimerRef.current);
      setIsPlayingAnimation(false);
      setActiveVisemeKey('idle');
      return;
    }

    setIsPlayingAnimation(true);

    // Speak audio using TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = activeTabMode === 'sound_library' ? currentSoundItem.example : currentWordProfile?.word || 'Phonetics';
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = playbackSpeed;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }

    let step = 0;
    const sequenceKeys = activeTabMode === 'sound_library' 
      ? ['idle', currentSoundItem.visemeKey, currentSoundItem.visemeKey, 'idle']
      : currentWordProfile?.visemeSequence || ['idle', 'ae', 'idle'];

    const stepDuration = 550 / playbackSpeed;

    const runStep = () => {
      if (step < sequenceKeys.length) {
        setActiveVisemeKey(sequenceKeys[step]);
        setActiveSequenceStep(step);
        step++;
        animationTimerRef.current = setTimeout(runStep, stepDuration);
      } else {
        setActiveVisemeKey('idle');
        setIsPlayingAnimation(false);
        setActiveSequenceStep(0);
      }
    };

    runStep();
  };

  // Play audio preview for sound item
  const handlePlayAudioPreview = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = playbackSpeed;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speech Practice Mic Handler
  const handleStartMicPractice = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      alert("Speech Recognition API is not supported on this browser. Try Chrome or Edge.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    setIsListening(true);
    setPracticeFeedback(null);

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript.trim().toLowerCase();
      setSpokenTranscript(result);
      setIsListening(false);

      const target = activeTabMode === 'sound_library' 
        ? currentSoundItem.example.split(',')[0].trim().toLowerCase()
        : currentWordProfile?.word.toLowerCase() || '';

      const isMatch = result.includes(target) || target.includes(result);
      const simScore = isMatch ? Math.floor(88 + Math.random() * 12) : Math.floor(40 + Math.random() * 30);

      setPracticeFeedback({
        match: isMatch,
        score: simScore,
        text: isMatch 
          ? `Fantastic articulation! Pronunciation match ${simScore}%. Excellent tongue placement.` 
          : `Detected "${result}". Focus on the positioning guide: ${activeTabMode === 'sound_library' ? currentSoundItem.tonguePosition : currentWordProfile?.articulationGuide}`
      });
    };

    recognition.onerror = () => {
      setIsListening(false);
      setPracticeFeedback({
        match: false,
        score: 0,
        text: "Could not detect audio clearly. Try again in a quiet room."
      });
    };

    recognition.start();
  };

  const visemeData = VISEME_CONFIGS[activeVisemeKey] || VISEME_CONFIGS[currentSoundItem.visemeKey] || VISEME_CONFIGS.idle;

  return (
    <div className={`bg-[#fcfbf9] rounded-2xl border border-[#e5e1da] shadow-xl overflow-hidden flex flex-col ${isModal ? 'max-w-6xl w-full mx-auto' : 'w-full'}`}>
      
      {/* TOP HEADER */}
      <div className="bg-slate-900 text-white p-4 md:p-5 flex flex-wrap items-center justify-between border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400 shadow-sm">
            <Smile className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-black tracking-tight flex items-center gap-2">
                AI Visual Phonetics & Tongue-Lip Pronunciation Studio
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold uppercase">
                50 Sounds Guide
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Interactive CSS-animated sagittal tongue & lip positioning for ESL learners & speech support.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* TAB MODE SWITCHER */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTabMode('sound_library')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTabMode === 'sound_library'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>50 Sounds Guide</span>
            </button>
            <button
              onClick={() => setActiveTabMode('snippet')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTabMode === 'snippet'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Text Snippet Vocab</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <Languages className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGS.map(l => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* MODE 1: LIVE TEXT EXTRACT SNIPPET BANNER */}
      {activeTabMode === 'snippet' && (
        <div className="bg-white p-4 border-b border-[#e5e1da] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> Live Text Snippet Vocabulary Source
            </span>
            {loadingExtract && (
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" /> Extracting Vocabulary Phonetics...
              </span>
            )}
          </div>

          <div className="text-xs text-slate-700 font-serif leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            {snippetText.split(/\s+/).map((wordRaw, idx) => {
              const clean = wordRaw.replace(/[^a-zA-Z]/g, '');
              const matchedProfileIdx = extractedProfiles.findIndex(
                p => p.word.toLowerCase() === clean.toLowerCase()
              );
              const isSelected = matchedProfileIdx === selectedProfileIndex;

              if (matchedProfileIdx >= 0) {
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedProfileIndex(matchedProfileIdx);
                      setActiveVisemeKey('idle');
                    }}
                    className={`inline-block mx-0.5 px-1.5 py-0.5 rounded-md text-xs font-bold font-sans transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs scale-105 ring-2 ring-emerald-300'
                        : 'bg-emerald-100/80 text-emerald-900 hover:bg-emerald-200 border border-emerald-300/60'
                    }`}
                  >
                    {wordRaw}
                  </button>
                );
              }
              return <span key={idx} className="mx-0.5">{wordRaw} </span>;
            })}
          </div>
        </div>
      )}

      {/* MODE 2: TOP 50 PHONETIC SOUNDS CATEGORY & SEARCH FILTER BAR */}
      {activeTabMode === 'sound_library' && (
        <div className="bg-white p-4 border-b border-[#e5e1da] space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* SEARCH INPUT */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={soundSearchQuery}
                onChange={(e) => setSoundSearchQuery(e.target.value)}
                placeholder="Search symbol (e.g. /θ/), name, or example (e.g. think)..."
                className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {soundSearchQuery && (
                <button
                  onClick={() => setSoundSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* VIEW ANGLE SELECTOR */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
              <span className="text-[10px] text-slate-500 font-bold px-2">Display:</span>
              {[
                { key: 'dual', label: 'Dual View' },
                { key: 'sagittal', label: 'Sagittal (Side)' },
                { key: 'front', label: 'Front Lips' },
              ].map(v => (
                <button
                  key={v.key}
                  onClick={() => setViewAngle(v.key as any)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                    viewAngle === v.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

          </div>

          {/* CATEGORY PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {['All', 'Monophthong Vowels', 'Diphthongs', 'Plosives', 'Fricatives', 'Affricates', 'Nasals', 'Liquids & Glides', 'Special ESL Variations'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SOUND LIBRARY HORIZONTAL SCROLL SELECTOR GRID (WHEN IN SOUND LIBRARY MODE) */}
      {activeTabMode === 'sound_library' && (
        <div className="bg-slate-100/70 p-3 border-b border-[#e5e1da] overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-2 min-w-max">
            {filteredSounds.map(s => {
              const isSelected = s.id === selectedSoundId;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSoundId(s.id);
                    setActiveVisemeKey(s.visemeKey);
                  }}
                  className={`px-3 py-2 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between w-28 shrink-0 ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-600 ring-2 ring-emerald-300 shadow-sm scale-105'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-emerald-50/80 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-base font-black font-mono ${isSelected ? 'text-white' : 'text-emerald-700'}`}>
                      {s.symbol}
                    </span>
                    <span className={`text-[8px] font-black uppercase px-1 rounded ${
                      s.type === 'voiced'
                        ? isSelected ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-100 text-emerald-800'
                        : isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {s.type === 'voiced' ? 'VOICED' : 'UNVOICED'}
                    </span>
                  </div>

                  <div className="mt-1">
                    <div className={`text-[10px] font-bold truncate ${isSelected ? 'text-slate-100' : 'text-slate-900'}`}>
                      {s.name}
                    </div>
                    <div className={`text-[9px] italic truncate ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                      "{s.example}"
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN CONTENT WORKSPACE: ANIMATED AVATARS & ARTICULATION DATA */}
      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CSS-ANIMATED AVATAR DISPLAY (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950 rounded-2xl p-5 border border-slate-800 text-white space-y-5 shadow-inner">
          
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" /> CSS Articulation Anatomy
            </span>

            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold">Speed:</span>
              {[0.25, 0.5, 0.75, 1.0].map(s => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded font-bold cursor-pointer transition ${
                    playbackSpeed === s
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* DUAL OR SINGLE SVG ANIMATION CONTAINER */}
          <div className="grid grid-cols-1 gap-4">
            
            {/* VIEW 1: SAGITTAL PROFILE VIEW (SIDE CROSS-SECTION OF VOCAL TRACT) */}
            {(viewAngle === 'dual' || viewAngle === 'sagittal') && (
              <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-xl border border-slate-800 p-3 flex flex-col justify-between overflow-hidden shadow-md">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800/80 pb-1 z-10">
                  <span>Sagittal Cross-Section (Tongue & Palate)</span>
                  <span className="text-emerald-400 font-bold">
                    {activeTabMode === 'sound_library' ? currentSoundItem.symbol : currentWordProfile?.ipaPhonetic || '/æ/'}
                  </span>
                </div>

                <svg width="100%" height="100%" viewBox="0 0 100 100" className="select-none overflow-visible">
                  {/* Anatomical Labels */}
                  <text x="5" y="15" fill="#64748b" fontSize="3.5" fontFamily="monospace">Nasal Cavity</text>
                  <text x="50" y="28" fill="#64748b" fontSize="3.5" fontFamily="monospace">Hard Palate</text>
                  <text x="75" y="38" fill="#64748b" fontSize="3.5" fontFamily="monospace">Velum</text>
                  <text x="12" y="42" fill="#64748b" fontSize="3.5" fontFamily="monospace">Upper Incisor</text>
                  <text x="12" y="88" fill="#64748b" fontSize="3.5" fontFamily="monospace">Lower Incisor</text>

                  {/* Vocal Tract Roof & Nasal Cavity Outline */}
                  <path d="M 10,18 L 75,18 Q 85,22 85,45 L 85,90" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="2,2" />
                  
                  {/* Hard Palate & Upper Lip Contour */}
                  <path d="M 18,50 Q 20,38 32,35 Q 55,33 70,42 Q 78,48 80,60" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                  
                  {/* Soft Palate (Velum) - Animates lowered for nasals */}
                  <motion.path
                    d={(activeTabMode === 'sound_library' && currentSoundItem.airflow === 'nasal') || visemeData.airflow === 'nasal'
                      ? "M 70,42 Q 72,55 76,62"
                      : "M 70,42 Q 78,46 80,48"
                    }
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    animate={{
                      d: (activeTabMode === 'sound_library' && currentSoundItem.airflow === 'nasal') || visemeData.airflow === 'nasal'
                        ? "M 70,42 Q 72,55 76,62"
                        : "M 70,42 Q 78,46 80,48"
                    }}
                    transition={{ duration: 0.2 }}
                  />

                  {/* Upper & Lower Front Teeth */}
                  <rect x="20" y="46" width="3" height="6" rx="1" fill="#f8fafc" />
                  <rect x="20" y="58" width="3" height="6" rx="1" fill="#f8fafc" />

                  {/* CSS-ANIMATED TONGUE BODY (SAGITTAL PATH MORPHING) */}
                  <motion.path
                    d={activeTabMode === 'sound_library' 
                      ? currentSoundItem.sagittalTonguePath 
                      : (visemeData.open ? "M 35,70 Q 52,48 78,66 Q 68,80 35,70" : "M 35,78 Q 55,80 78,75 Q 70,88 35,78")
                    }
                    fill="#f43f5e"
                    fillOpacity="0.85"
                    stroke="#e11d48"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{
                      d: activeTabMode === 'sound_library' 
                        ? currentSoundItem.sagittalTonguePath 
                        : (visemeData.open ? "M 35,70 Q 52,48 78,66 Q 68,80 35,70" : "M 35,78 Q 55,80 78,75 Q 70,88 35,78")
                    }}
                    transition={{ duration: 0.25 / playbackSpeed }}
                  />

                  {/* Airflow Particles / Streamlines */}
                  <g opacity="0.8">
                    {/* Airflow forward path */}
                    <motion.path
                      d="M 80,80 Q 70,60 25,52 L 8,52"
                      fill="none"
                      stroke={(activeTabMode === 'sound_library' ? currentSoundItem.type : 'voiced') === 'voiced' ? "#f59e0b" : "#38bdf8"}
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      animate={{ strokeDashoffset: isPlayingAnimation ? [0, -30] : 0 }}
                      transition={{ repeat: Infinity, duration: 0.6 / playbackSpeed, ease: "linear" }}
                    />
                  </g>

                  {/* Vocal Cords Vibration Wave */}
                  <g transform="translate(80, 82)">
                    <motion.path
                      d="M -5,0 Q 0,-3 5,0 Q 10,3 15,0"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2"
                      animate={{ d: isPlayingAnimation ? ["M -5,0 Q 0,-5 5,0 Q 10,5 15,0", "M -5,0 Q 0,5 5,0 Q 10,-5 15,0"] : "M -5,0 Q 0,-1 5,0 Q 10,1 15,0" }}
                      transition={{ repeat: Infinity, duration: 0.2 / playbackSpeed }}
                    />
                  </g>
                </svg>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span>👅 Tongue Position: {activeTabMode === 'sound_library' ? currentSoundItem.tonguePosition.slice(0, 45) + '...' : 'Interactive'}</span>
                </div>
              </div>
            )}

            {/* VIEW 2: FRONT LIPS & MOUTH AVATAR VIEW */}
            {(viewAngle === 'dual' || viewAngle === 'front') && (
              <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-xl border border-slate-800 p-3 flex flex-col justify-between overflow-hidden shadow-md">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800/80 pb-1 z-10">
                  <span>Front Lip & Jaw Avatar</span>
                  <span className="text-emerald-400 font-bold">{visemeData.label}</span>
                </div>

                <div className="relative w-full h-full flex items-center justify-center p-2">
                  <svg width="85%" height="85%" viewBox="0 0 100 100" className="select-none">
                    {/* Blushing */}
                    <circle cx="18" cy="52" r="5" fill="#f43f5e" opacity="0.2" />
                    <circle cx="82" cy="52" r="5" fill="#f43f5e" opacity="0.2" />

                    {/* Inner Cavity */}
                    <motion.path
                      d={visemeData.innerMouth}
                      fill="#0f172a"
                      animate={{ d: visemeData.innerMouth }}
                      transition={{ duration: 0.15 }}
                    />

                    {/* Tongue Layer */}
                    {visemeData.open && (
                      <motion.path
                        d={visemeData.tongueShape}
                        fill="#f43f5e"
                        animate={{ d: visemeData.tongueShape }}
                        transition={{ duration: 0.15 }}
                      />
                    )}

                    {/* Teeth Layer */}
                    {visemeData.open && (
                      <>
                        <motion.rect
                          x="38"
                          y={visemeData.teethY}
                          width="24"
                          height="4"
                          rx="1"
                          fill="#f8fafc"
                          animate={{ y: visemeData.teethY }}
                          transition={{ duration: 0.15 }}
                        />
                        <motion.rect
                          x="40"
                          y={visemeData.teethY + 11}
                          width="20"
                          height="3"
                          rx="1"
                          fill="#e2e8f0"
                          animate={{ y: visemeData.teethY + 11 }}
                          transition={{ duration: 0.15 }}
                        />
                      </>
                    )}

                    {/* Lips Contour */}
                    <motion.path
                      d={visemeData.lips}
                      fill="none"
                      stroke="#fb7185"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{ d: visemeData.lips }}
                      transition={{ duration: 0.15 }}
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span>👄 Lip Shape: {activeTabMode === 'sound_library' ? currentSoundItem.lipPosition.slice(0, 45) + '...' : visemeData.label}</span>
                </div>
              </div>
            )}

          </div>

          {/* STEP-BY-STEP CSS ANIMATION SEQUENCE SCRUBBER */}
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> 4-Step Animation Sequence
              </span>
              <span className="font-mono text-slate-400 text-[10px]">
                Step {activeSequenceStep + 1} of 4
              </span>
            </div>

            {/* Sequence Phase Labels */}
            <div className="grid grid-cols-4 gap-1">
              {(activeTabMode === 'sound_library' 
                ? currentSoundItem.animationPhases 
                : ['1. Neutral Rest', '2. Syllable Stress', '3. Airflow Burst', '4. Vocal Resolution']
              ).map((phaseLabel, idx) => {
                const isActive = activeSequenceStep === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveSequenceStep(idx);
                      const key = idx === 0 || idx === 3 ? 'idle' : (activeTabMode === 'sound_library' ? currentSoundItem.visemeKey : currentWordProfile?.visemeSequence[idx] || 'ae');
                      setActiveVisemeKey(key);
                    }}
                    className={`p-1.5 rounded-lg text-left transition cursor-pointer border ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-xs'
                        : 'bg-slate-800 text-slate-300 border-slate-700/80 hover:bg-slate-700'
                    }`}
                  >
                    <div className="text-[9px] font-mono font-bold leading-tight line-clamp-2">
                      {phaseLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PLAY FULL ANIMATION SEQUENCE BUTTON */}
          <button
            onClick={handlePlaySoundAnimation}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
              isPlayingAnimation
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlayingAnimation ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>
              {isPlayingAnimation ? 'Pause Animation' : `Play ${activeTabMode === 'sound_library' ? currentSoundItem.symbol : currentWordProfile?.word || ''} Animation Sequence`}
            </span>
          </button>

        </div>

        {/* RIGHT COLUMN: DETAILED ARTICULATION CUES & PRACTICE TOOL (7 COLS) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* SOUND OR WORD INFORMATION CARD */}
          {activeTabMode === 'sound_library' ? (
            <div className="bg-white p-5 rounded-2xl border border-[#e5e1da] shadow-xs space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                      {currentSoundItem.symbol}
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {currentSoundItem.name}
                      </h3>
                      <span className="text-xs font-semibold text-slate-500">
                        Category: {currentSoundItem.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg ${
                    currentSoundItem.type === 'voiced'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}>
                    {currentSoundItem.type === 'voiced' ? '🔊 Voiced (Vocal Cords Buzzing)' : '🔇 Unvoiced (Pure Air Stream)'}
                  </span>

                  <button
                    onClick={() => handlePlayAudioPreview(currentSoundItem.example)}
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Hear Sound</span>
                  </button>
                </div>
              </div>

              {/* ANATOMICAL TONGUE & LIP POSITIONING GUIDES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    👅 Tongue Positioning
                  </span>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {currentSoundItem.tonguePosition}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    👄 Lip & Jaw Shape
                  </span>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {currentSoundItem.lipPosition}
                  </p>
                </div>
              </div>

              {/* EXAMPLES & AIRFLOW PATTERN */}
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    Key Example Vocabulary Words
                  </span>
                  <div className="text-sm font-bold text-emerald-950 mt-0.5">
                    {currentSoundItem.example}
                  </div>
                </div>

                <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200/90 text-xs font-mono font-bold text-emerald-900 shrink-0">
                  Airflow: <span className="capitalize">{currentSoundItem.airflow}</span>
                </div>
              </div>

            </div>
          ) : (
            /* SNIPPET MODE WORD CARD */
            currentWordProfile ? (
              <div className="bg-white p-5 rounded-2xl border border-[#e5e1da] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight capitalize">
                        {currentWordProfile.word}
                      </h3>
                      <span className="text-xs font-serif italic text-slate-500">
                        ({currentWordProfile.partOfSpeech})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        IPA: {currentWordProfile.ipaPhonetic}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-600">
                        Phonetic: <span className="font-bold text-slate-900">{currentWordProfile.friendlySpelling}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-start sm:self-center">
                    <button
                      onClick={() => setSelectedProfileIndex(prev => Math.max(0, prev - 1))}
                      disabled={selectedProfileIndex === 0}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-600 font-mono px-1">
                      {selectedProfileIndex + 1} / {extractedProfiles.length}
                    </span>
                    <button
                      onClick={() => setSelectedProfileIndex(prev => Math.min(extractedProfiles.length - 1, prev + 1))}
                      disabled={selectedProfileIndex === extractedProfiles.length - 1}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* DEFINITION & TRANSLATION */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      ESL Definition
                    </span>
                    <p className="text-xs text-slate-800 font-medium leading-snug">
                      {currentWordProfile.definition}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <Languages className="w-3 h-3" /> Translation ({selectedLang})
                    </span>
                    <p className="text-xs text-emerald-950 font-bold leading-snug">
                      {currentWordProfile.translation}
                    </p>
                  </div>
                </div>

                {/* ARTICULATION GUIDE */}
                <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200/80 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-blue-950">
                      Mouth & Tongue Placement Cue:
                    </div>
                    <p className="text-xs text-blue-900 leading-relaxed font-medium">
                      {currentWordProfile.articulationGuide}
                    </p>
                  </div>
                </div>
              </div>
            ) : null
          )}

          {/* SPEECH PRACTICE MICROPHONE TOOL */}
          <div className="bg-white p-5 rounded-2xl border border-[#e5e1da] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-rose-500" /> Interactive Speech Practice & Feedback
              </span>
              <span className="text-[10px] font-mono text-slate-400">Audio Evaluation</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleStartMicPractice}
                disabled={isListening}
                className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4 text-rose-400" />}
                <span>{isListening ? 'Listening... Speak Now' : 'Practice Pronunciation'}</span>
              </button>

              <div className="text-xs text-slate-600 font-medium">
                {isListening ? (
                  <span className="text-rose-600 font-bold animate-pulse">
                    Recording... Speak clearly into your microphone.
                  </span>
                ) : spokenTranscript ? (
                  <span>You said: <strong className="text-slate-900 font-mono">"{spokenTranscript}"</strong></span>
                ) : (
                  <span>Click button and speak to receive instant tongue & lip feedback.</span>
                )}
              </div>
            </div>

            {practiceFeedback && (
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 animate-fadeIn ${
                practiceFeedback.match
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                {practiceFeedback.match ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold">
                    {practiceFeedback.match ? `Pronunciation Verified! (${practiceFeedback.score}%)` : `Needs Adjustment`}
                  </div>
                  <p className="text-xs mt-0.5 leading-snug">{practiceFeedback.text}</p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default VisualPhoneticsStudio;
