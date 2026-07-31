import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  QrCode,
  MapPin,
  Sparkles,
  Printer,
  CheckSquare,
  Square,
  HelpCircle,
  Eye,
  BookOpen,
  Zap,
  Users,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Share2,
  Layers,
  ArrowRight,
  Sliders,
  Type,
  Maximize2,
  Download,
  Flame,
  Target,
  Award,
  AlertCircle,
  ExternalLink,
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ScannedStationPortalModal } from './ScannedStationPortalModal';

export interface StationData {
  stationNumber: number;
  title: string;
  locationClueRiddle: string;
  coreTask: string;
  digitalDestinationQR: string;
  rewardMessageClue: string;
}

export interface StorylineMission {
  title: string;
  narrativeHook: string;
  missionObjective: string;
  teamRoles: string[];
}

export interface UdlAccessibility {
  adhdFocusSupports: string;
  dyslexiaReadingAccommodations: string;
  visualMotorAdaptations: string;
}

export interface ScavengerHuntPlan {
  subject: string;
  coreTopic: string;
  numberOfStations: number;
  scale: string;
  storylineAndMission: StorylineMission;
  stations: StationData[];
  udlAndAccessibility: UdlAccessibility;
  educatorSetupChecklist: string[];
}

interface ClassroomScavengerHuntStudioProps {
  onClose?: () => void;
  onSaveToQrCatalog?: (stations: StationData[], subject: string, topic: string) => void;
}

export const PRESET_SUBJECTS = [
  { name: 'Chemistry', icon: '🧪', topics: ['Periodic Table & Chemical Reactions', 'Acids, Bases & pH', 'Stoichiometry & Moles', 'States of Matter'] },
  { name: 'Fraction Math & Algebra', icon: '🔢', topics: ['Equivalent Fractions & Decimals', 'Linear Equations & Graphs', 'Ratios & Proportions', 'Geometric Shapes & Angles'] },
  { name: '8th Grade History & Civics', icon: '📜', topics: ['American Revolution', 'Kenyan Struggle for Independence', 'Ancient Civilizations', 'World War II Turning Points'] },
  { name: 'Biology & Life Sciences', icon: '🧬', topics: ['Cell Structure & Organelles', 'Photosynthesis & Respiration', 'Human Circulatory System', 'Ecosystems & Food Webs'] },
  { name: 'Physics & Physical Science', icon: '⚡', topics: ['Newton\'s Laws of Motion', 'Light & Sound Waves', 'Electricity & Simple Circuits', 'Energy Transformations'] },
  { name: 'English Literature & Language', icon: '📚', topics: ['Literary Devices & Metaphors', 'Grammar & Sentence Mechanics', 'Character Analysis & Themes', 'Vocabulary Expansion'] },
  { name: 'Kiswahili & African Languages', icon: '🌍', topics: ['Fasihi na Methali', 'Sarufi na Aina za Maneno', 'Ufahamu na Msamiati', 'Insha na Uandishi'] },
  { name: 'Geography & Earth Science', icon: '🗺️', topics: ['Plate Tectonics & Earthquakes', 'Weather Patterns & Climate', 'Map Reading & Coordinates', 'River Systems & Erosion'] },
  { name: 'Business Studies & Economics', icon: '💼', topics: ['Supply & Demand Principles', 'Financial Literacy & Budgeting', 'Entrepreneurship & Innovation', 'Global Trade & Currency'] },
  { name: 'Agriculture & Environmental Science', icon: '🌱', topics: ['Soil Fertility & Composting', 'Crop Rotation Methods', 'Water Conservation', 'Farm Tools & Safety'] },
  { name: 'Computer Studies & Robotics', icon: '💻', topics: ['Algorithmic Thinking & Flowcharts', 'Cybersecurity & Online Safety', 'Hardware Components', 'Binary Code & Logic Gates'] },
  { name: 'Music, Visual Arts & PE', icon: '🎨', topics: ['Musical Notation & Rhythm', 'Color Theory & Perspective', 'Human Anatomy in Movement', 'Sportsmanship & Game Rules'] },
];

export const ClassroomScavengerHuntStudio: React.FC<ClassroomScavengerHuntStudioProps> = ({
  onClose,
  onSaveToQrCatalog,
}) => {
  // Input Form State
  const [subject, setSubject] = useState<string>('Chemistry');
  const [coreTopic, setCoreTopic] = useState<string>('Periodic Table & Chemical Bonding');
  const [numberOfStations, setNumberOfStations] = useState<number>(5);
  const [scale, setScale] = useState<'Classroom-Based' | 'School-Wide'>('Classroom-Based');
  const [gradeLevel, setGradeLevel] = useState<string>('Junior Secondary / Grade 8');

  // Generation & Display State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [plan, setPlan] = useState<ScavengerHuntPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'storyline' | 'stations' | 'udl' | 'checklist'>('storyline');
  const [selectedStationIdx, setSelectedStationIdx] = useState<number>(0);

  // Dyslexia Font Toggle Preview
  const [dyslexicPreview, setDyslexicPreview] = useState<boolean>(false);

  // Checkbox state for educator checklist
  const [completedChecklistItems, setCompletedChecklistItems] = useState<Record<number, boolean>>({});

  // Feedback Toast State
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Test Portal Modal State
  const [isTestPortalOpen, setIsTestPortalOpen] = useState<boolean>(false);
  const [testPortalData, setTestPortalData] = useState<{
    stationNumber?: string;
    subject?: string;
    topic?: string;
    task?: string;
    rewardKey?: string;
    riddle?: string;
  } | null>(null);

  // Fallback / Pre-generated sample generator for seamless offline capability
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setCopySuccess(false);
    setSavedSuccess(false);

    try {
      const response = await fetch('/api/generate-scavenger-hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          coreTopic,
          numberOfStations,
          scale,
          gradeLevel,
        }),
      });

      if (!response.ok) {
        throw new Error('Server response error');
      }

      const data = await response.json();
      if (data.scavengerHunt) {
        setPlan(data.scavengerHunt);
        setCompletedChecklistItems({});
        setSelectedStationIdx(0);
      } else {
        throw new Error('Invalid payload');
      }
    } catch (err) {
      console.warn('API call fallback triggered:', err);
      // Construct fallback plan locally
      const fallbackPlan: ScavengerHuntPlan = {
        subject: subject || 'Chemistry',
        coreTopic: coreTopic || 'Periodic Table & Chemical Bonding',
        numberOfStations: numberOfStations || 5,
        scale: scale || 'Classroom-Based',
        storylineAndMission: {
          title: `Operation ${coreTopic.split(' ')[0] || 'Discovery'}: The Missing Cipher`,
          narrativeHook: `A secretive vault containing master files on ${coreTopic} has been sealed. The rogue custodian left a series of ${numberOfStations} physical ciphers hidden across the ${scale === 'Classroom-Based' ? 'classroom centers' : 'school campus'}. Your team of agents must investigate each station, scan the digital QR links, and assemble the master code before time runs out!`,
          missionObjective: `Locate all ${numberOfStations} physical stations, decode the core ${subject} tasks, and collect all reward message coordinates to unlock the final mission debrief.`,
          teamRoles: [
            'Lead Navigator (Manages physical map & location riddles)',
            'Digital Scanner (Operates mobile device QR reader)',
            'Scribe & Decoder (Records reward keys on answer sheet)',
            'UDL Time Manager (Monitors micro-milestone countdowns)',
          ],
        },
        stations: Array.from({ length: numberOfStations }).map((_, i) => ({
          stationNumber: i + 1,
          title: `Station ${i + 1}: ${
            i === 0
              ? 'Foundational Element Identification'
              : i === 1
              ? 'Atomic Structure & Valence Electrons'
              : i === 2
              ? 'Chemical Reaction Balancing'
              : i === 3
              ? 'Periodic Trends & Electronegativity'
              : 'Synthesis & Real-World Application'
          }`,
          locationClueRiddle:
            scale === 'Classroom-Based'
              ? i === 0
                ? 'Seek where water flows in a steady stream, near the science sink where beakers gleam!'
                : i === 1
                ? 'Look where books are stacked in neat supply, beside the periodic table hanging high!'
                : i === 2
                ? 'Find the wooden desk where safety goggles rest, beneath the window facing west!'
                : i === 3
                ? 'Check the storage cabinet painted dark green, where measuring cylinders remain pristine!'
                : 'Return to the teacher station center stage, to enter your final reward key on the master page!'
              : `Look near ${i === 0 ? 'the Library entrance display' : i === 1 ? 'the Science Lab courtyard pillar' : i === 2 ? 'the Main Administration notice board' : i === 3 ? 'the Outdoor Learning Pavilion' : 'the Computer Center lobby'}.`,
          coreTask: `Solve this ${subject} challenge: Analyze the ${coreTopic} prompt and identify the key chemical properties. Calculate the missing value or classify the reaction type before scanning the QR code to verify your answer!`,
          digitalDestinationQR: `https://ais-dev-sepfpycoywxht42eqv7oki-369944869234.europe-west2.run.app/?subject=${encodeURIComponent(
            subject
          )}&topic=${encodeURIComponent(coreTopic)}&station=${i + 1}`,
          rewardMessageClue: `CIPHER_KEY_${i + 1}_${(100 + (i + 1) * 37) % 999}`,
        })),
        udlAndAccessibility: {
          adhdFocusSupports: `Break station tasks into 3-minute micro-milestone check-ins. Provide printed visual checklists with checkboxes at each station so students physically check off step-by-step progress.`,
          dyslexiaReadingAccommodations: `Use 14pt+ OpenDyslexic or clean sans-serif typography with 1.5 line height, relaxed character spacing (letter-spacing: 0.05em), and high-contrast dark text on off-white or cream cardstock to eliminate visual glare.`,
          visualMotorAdaptations: `Mount physical QR codes and station markers at accessible wheelchair/eye height (1.2m from floor), with 3x enlarged 15cm x 15cm high-visibility border frames and tactile braille/embossed station numbers.`,
        },
        educatorSetupChecklist: [
          'Generate & print physical QR station cards for all stations on heavy 200gsm cardstock.',
          'Test-scan every printed QR code using a standard smartphone/tablet camera prior to hiding them in the classroom.',
          'Affix physical QR station markers at designated riddle locations around the classroom or school.',
          'Brief students into heterogeneous teams of 3-4 and assign individual roles (Navigator, Scanner, Scribe, Time Manager).',
          'Distribute UDL Student Answer Sheets and set a master visual countdown timer on the main display.',
        ],
      };
      setPlan(fallbackPlan);
      setCompletedChecklistItems({});
      setSelectedStationIdx(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintPackage = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    if (!plan) return;
    const markdown = `# ${plan.storylineAndMission.title}
**Subject:** ${plan.subject} | **Topic:** ${plan.coreTopic} | **Scale:** ${plan.scale} (${plan.numberOfStations} Stations)

## 1. Storyline & Mission
- **Narrative Hook:** ${plan.storylineAndMission.narrativeHook}
- **Mission Objective:** ${plan.storylineAndMission.missionObjective}
- **Team Roles:** ${plan.storylineAndMission.teamRoles.join(', ')}

## 2. Physical Stations
${plan.stations
  .map(
    (st) => `### Station ${st.stationNumber}: ${st.title}
- **Location Riddle:** ${st.locationClueRiddle}
- **Core Task:** ${st.coreTask}
- **Digital Destination QR:** ${st.digitalDestinationQR}
- **Reward Key:** ${st.rewardMessageClue}
`
  )
  .join('\n')}

## 3. Universal Design for Learning (UDL) & Accessibility
- **ADHD Focus:** ${plan.udlAndAccessibility.adhdFocusSupports}
- **Dyslexia Accommodations:** ${plan.udlAndAccessibility.dyslexiaReadingAccommodations}
- **Visual/Motor Adaptations:** ${plan.udlAndAccessibility.visualMotorAdaptations}

## 4. Educator Setup Checklist
${plan.educatorSetupChecklist.map((item) => `- [ ] ${item}`).join('\n')}
`;

    navigator.clipboard.writeText(markdown);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const toggleChecklistItem = (idx: number) => {
    setCompletedChecklistItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 font-sans text-slate-800 animate-fadeIn">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-[#3a4732] to-[#5f6f52] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-[#a9b388]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-white/10 text-[#e5e1da] border border-white/15 backdrop-blur-md flex items-center gap-1.5 tracking-wider">
                <Compass className="w-3.5 h-3.5 text-[#a9b388]" />
                Universal Classroom Designer
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-[#a9b388]/20 text-[#e5e1da] border border-[#a9b388]/30 backdrop-blur-md flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#a9b388]" />
                Phygital QR Bridges
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Classroom Scavenger Hunt Generator
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
              Design complete, print-ready active learning scavenger hunts for <strong className="text-white underline decoration-[#a9b388] decoration-2">any subject</strong>. Seamlessly bridge physical learning centers with digital QR destinations and UDL scaffolding.
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0 border border-white/10"
              title="Close Generator"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Subject & Lesson Setup Card */}
      <div className="bg-white border border-[#e5e1da] rounded-3xl p-5 sm:p-6 shadow-xs mb-8">
        <h2 className="text-base font-serif font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#5f6f52]" />
          <span>Configure Your Lesson Scavenger Hunt Parameters</span>
        </h2>

        {/* Quick Subject Chips */}
        <div className="mb-5 space-y-2">
          <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
            Select Subject Category (or Type Custom Below):
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 scrollbar-thin">
            {PRESET_SUBJECTS.map((sub, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSubject(sub.name);
                  setCoreTopic(sub.topics[0]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                  subject === sub.name
                    ? 'bg-[#5f6f52] text-white border-[#5f6f52] shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{sub.icon}</span>
                <span>{sub.name}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
              Subject Name:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Chemistry, Fraction Math, History"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5f6f52]"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
              Core Topic / Unit:
            </label>
            <input
              type="text"
              value={coreTopic}
              onChange={(e) => setCoreTopic(e.target.value)}
              placeholder="e.g. Periodic Table, American Revolution"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5f6f52]"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
              Number of Stations:
            </label>
            <select
              value={numberOfStations}
              onChange={(e) => setNumberOfStations(parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5f6f52] cursor-pointer"
            >
              {[3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  {num} Physical Stations
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
              Spatial Scale:
            </label>
            <select
              value={scale}
              onChange={(e) => setScale(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5f6f52] cursor-pointer"
            >
              <option value="Classroom-Based">Classroom-Based (Desks & Centers)</option>
              <option value="School-Wide">School-Wide (Campus Landmarks & Grounds)</option>
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-4 flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                Audience / Grade Level:
              </label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="e.g. 8th Grade / Grade 6-8"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 w-48 focus:outline-none focus:border-[#5f6f52]"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-3 bg-[#5f6f52] hover:bg-[#4d5a42] text-white font-extrabold text-xs rounded-2xl transition cursor-pointer flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Synthesizing Storyline & Stations...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Full Scavenger Hunt Plan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* GENERATED PLAN OUTPUT VIEW */}
      {plan && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white border border-[#e5e1da] rounded-2xl p-3 shadow-2xs gap-3">
            <div className="flex items-center gap-2 overflow-x-auto p-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('storyline')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                  activeTab === 'storyline'
                    ? 'bg-[#5f6f52] text-white border-[#5f6f52] shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>1. Storyline & Mission</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stations')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                  activeTab === 'stations'
                    ? 'bg-[#5f6f52] text-white border-[#5f6f52] shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>2. Station Outlines ({plan.stations.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('udl')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                  activeTab === 'udl'
                    ? 'bg-[#5f6f52] text-white border-[#5f6f52] shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>3. UDL & Accessibility</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                  activeTab === 'checklist'
                    ? 'bg-[#5f6f52] text-white border-[#5f6f52] shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>4. Educator Checklist</span>
              </button>
            </div>

            <div className="flex items-center gap-2 justify-end shrink-0">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
              >
                {copySuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Plan</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrintPackage}
                className="px-4 py-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Package</span>
              </button>
            </div>
          </div>

          {/* TAB 1: STORYLINE & MISSION */}
          {activeTab === 'storyline' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#e5e1da] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs"
            >
              <div className="border-b border-slate-150 pb-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#5f6f52]/10 text-[#5f6f52] border border-[#5f6f52]/20">
                    Component 1: Narrative Framework
                  </span>
                  <h3 className="font-serif font-bold text-2xl text-slate-900 mt-2">
                    {plan.storylineAndMission.title}
                  </h3>
                </div>
                <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  {plan.scale} &bull; {plan.numberOfStations} Stations
                </div>
              </div>

              {/* Narrative Hook Box */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 rounded-2xl p-5 space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Narrative Hook & Classroom Lore
                </h4>
                <p className="text-sm font-serif italic text-slate-800 leading-relaxed">
                  "{plan.storylineAndMission.narrativeHook}"
                </p>
              </div>

              {/* Mission Objective */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#5f6f52]" /> Core Mission Objective
                </h4>
                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  {plan.storylineAndMission.missionObjective}
                </p>
              </div>

              {/* Cooperative Team Roles */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#5f6f52]" /> Suggested Cooperative Student Roles
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plan.storylineAndMission.teamRoles.map((role, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-semibold text-slate-800 flex items-center gap-2.5 shadow-2xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#5f6f52]/10 text-[#5f6f52] font-extrabold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <span>{role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: INTERACTIVE STATIONS */}
          {activeTab === 'stations' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Station List Selector */}
              <div className="bg-white border border-[#e5e1da] rounded-3xl p-4 space-y-2 shadow-xs lg:col-span-1 h-fit">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 px-2 pb-2 border-b border-slate-150">
                  Select Physical Station ({plan.stations.length})
                </h4>
                <div className="space-y-1.5">
                  {plan.stations.map((st, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedStationIdx(i)}
                      className={`w-full text-left p-3 rounded-2xl transition cursor-pointer border flex items-center justify-between ${
                        selectedStationIdx === i
                          ? 'bg-[#5f6f52] text-white border-[#5f6f52] shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 ${
                            selectedStationIdx === i
                              ? 'bg-white/20 text-white'
                              : 'bg-[#5f6f52]/10 text-[#5f6f52]'
                          }`}
                        >
                          {st.stationNumber}
                        </span>
                        <span className="text-xs font-bold truncate">{st.title}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Station Details Card */}
              {plan.stations[selectedStationIdx] && (
                <div className="bg-white border border-[#e5e1da] rounded-3xl p-6 space-y-5 shadow-xs lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#5f6f52]/10 text-[#5f6f52] border border-[#5f6f52]/20">
                        Station {plan.stations[selectedStationIdx].stationNumber} of {plan.stations.length}
                      </span>
                      <h3 className="font-serif font-bold text-xl text-slate-900 mt-1">
                        {plan.stations[selectedStationIdx].title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDyslexicPreview(!dyslexicPreview)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer border flex items-center gap-1.5 ${
                        dyslexicPreview
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                      title="Toggle Dyslexic Font & Relaxed Spacing Preview"
                    >
                      <Type className="w-3.5 h-3.5" />
                      <span>{dyslexicPreview ? 'Dyslexic Font Active' : 'Dyslexia Preview'}</span>
                    </button>
                  </div>

                  <div className={dyslexicPreview ? 'font-sans tracking-wide leading-relaxed text-slate-900' : ''}>
                    {/* Location Riddle */}
                    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-1.5">
                      <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" /> Physical Location Clue / Riddle
                      </h4>
                      <p className="text-xs font-serif italic text-amber-950 leading-relaxed">
                        "{plan.stations[selectedStationIdx].locationClueRiddle}"
                      </p>
                    </div>

                    {/* Core Subject Task */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 mt-4">
                      <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#5f6f52]" /> Core Subject Task & Puzzle
                      </h4>
                      <p className="text-xs font-medium text-slate-800 leading-relaxed">
                        {plan.stations[selectedStationIdx].coreTask}
                      </p>
                    </div>

                    {/* Digital QR Destination & Reward Key */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {/* QR Badge Box */}
                      <div className="bg-[#5f6f52]/5 border border-[#5f6f52]/20 rounded-2xl p-4 flex flex-col items-center text-center gap-3">
                        <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200">
                          <QRCodeSVG
                            value={plan.stations[selectedStationIdx].digitalDestinationQR}
                            size={120}
                            fgColor="#1e293b"
                            bgColor="#ffffff"
                          />
                        </div>
                        <div className="space-y-2 w-full">
                          <span className="text-[10px] font-extrabold uppercase text-[#5f6f52] tracking-wider block">
                            Printed Station Badge QR Code
                          </span>
                          <p className="text-[11px] text-slate-600 font-medium line-clamp-2 mt-0.5 font-mono break-all bg-white/60 p-1.5 rounded-lg border border-slate-200">
                            {plan.stations[selectedStationIdx].digitalDestinationQR}
                          </p>

                          <div className="flex flex-col gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setTestPortalData({
                                  stationNumber: plan.stations[selectedStationIdx].stationNumber.toString(),
                                  subject: plan.subject,
                                  topic: plan.coreTopic,
                                  task: plan.stations[selectedStationIdx].coreTask,
                                  rewardKey: plan.stations[selectedStationIdx].rewardMessageClue,
                                  riddle: plan.stations[selectedStationIdx].locationClueRiddle,
                                });
                                setIsTestPortalOpen(true);
                              }}
                              className="min-h-[36px] w-full px-3 py-1.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Test Scan / Mobile View</span>
                            </button>

                            <a
                              href={plan.stations[selectedStationIdx].digitalDestinationQR}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-[#5f6f52] hover:underline flex items-center justify-center gap-1 py-1"
                            >
                              <span>Open URL in Browser</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Reward Message Clue */}
                      <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-md">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                            <KeyIcon className="w-3 h-3" /> Reward Message Cipher
                          </span>
                          <p className="text-xs text-slate-300">
                            Revealed upon completing task to unlock next station coordinate:
                          </p>
                        </div>

                        <div className="bg-white/10 p-3 rounded-xl border border-white/15 text-center font-mono font-bold text-amber-300 text-sm tracking-wider">
                          {plan.stations[selectedStationIdx].rewardMessageClue}
                        </div>

                        <p className="text-[10px] text-slate-400 italic text-center">
                          Scribe enters code into team progress sheet
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: UDL & ACCESSIBILITY */}
          {activeTab === 'udl' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#e5e1da] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs"
            >
              <div className="border-b border-slate-150 pb-3">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Universal Design for Learning (UDL)
                </span>
                <h3 className="font-serif font-bold text-xl text-slate-900 mt-2">
                  Accessibility & Barrier Removal Protocols
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Configured specifically to ensure all neurodiverse and physical learners engage smoothly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* ADHD Focus Supports */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-[#5f6f52]">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h4 className="font-bold text-sm text-slate-800">ADHD Focus Supports</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {plan.udlAndAccessibility.adhdFocusSupports}
                  </p>
                </div>

                {/* Dyslexia Accommodations */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-[#5f6f52]">
                    <Type className="w-5 h-5 text-blue-500" />
                    <h4 className="font-bold text-sm text-slate-800">Dyslexia & Reading</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {plan.udlAndAccessibility.dyslexiaReadingAccommodations}
                  </p>
                </div>

                {/* Visual / Motor Adaptations */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-[#5f6f52]">
                    <Eye className="w-5 h-5 text-emerald-500" />
                    <h4 className="font-bold text-sm text-slate-800">Visual & Motor Navigation</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {plan.udlAndAccessibility.visualMotorAdaptations}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: EDUCATOR CHECKLIST */}
          {activeTab === 'checklist' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#e5e1da] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs"
            >
              <div className="border-b border-slate-150 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    Test Before You Teach
                  </span>
                  <h3 className="font-serif font-bold text-xl text-slate-900 mt-1">
                    Educator Setup & Paperless Deployment Checklist
                  </h3>
                </div>
                <div className="text-xs font-bold text-[#5f6f52] bg-[#5f6f52]/10 px-3 py-1 rounded-full border border-[#5f6f52]/20">
                  {Object.values(completedChecklistItems).filter(Boolean).length} / {plan.educatorSetupChecklist.length} Completed
                </div>
              </div>

              <div className="space-y-2.5">
                {plan.educatorSetupChecklist.map((step, idx) => {
                  const isChecked = !!completedChecklistItems[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleChecklistItem(idx)}
                      className={`p-4 rounded-2xl transition cursor-pointer border flex items-start gap-3 ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <button type="button" className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      <span className={`text-xs font-medium leading-relaxed ${isChecked ? 'line-through opacity-80' : ''}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* PRINT-ONLY STYLED SHEET (Hidden on screen, rendered on window.print()) */}
      {plan && (
        <div className="hidden print:block print:p-6 print:bg-white text-slate-900 space-y-8">
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <h1 className="text-2xl font-bold uppercase tracking-wide">{plan.storylineAndMission.title}</h1>
            <p className="text-sm font-semibold mt-1">
              Subject: {plan.subject} | Topic: {plan.coreTopic} | Scale: {plan.scale} ({plan.numberOfStations} Stations)
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold border-b border-slate-400">1. Storyline & Mission Objective</h2>
            <p className="text-xs italic">{plan.storylineAndMission.narrativeHook}</p>
            <p className="text-xs font-bold mt-1">Objective: {plan.storylineAndMission.missionObjective}</p>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-bold border-b border-slate-400">2. Printable Station Posters</h2>
            {plan.stations.map((st) => (
              <div key={st.stationNumber} className="border-2 border-slate-900 p-6 rounded-2xl page-break-inside-avoid space-y-4">
                <div className="flex justify-between items-center border-b border-slate-300 pb-2">
                  <h3 className="text-xl font-bold uppercase">STATION {st.stationNumber}: {st.title}</h3>
                  <span className="text-xs font-bold border px-2 py-0.5 rounded">Scavenger Hunt</span>
                </div>
                <p className="text-sm font-serif italic">Location Riddle: "{st.locationClueRiddle}"</p>
                <div className="border p-3 rounded bg-slate-50 text-xs font-medium">
                  <strong>Task:</strong> {st.coreTask}
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <span className="text-xs font-bold block">Reward Cipher Code:</span>
                    <span className="text-base font-mono font-bold">{st.rewardMessageClue}</span>
                  </div>
                  <div className="border p-2 rounded">
                    <QRCodeSVG value={st.digitalDestinationQR} size={90} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scanned Station Portal / Mobile Camera Test Modal */}
      <ScannedStationPortalModal
        isOpen={isTestPortalOpen}
        onClose={() => setIsTestPortalOpen(false)}
        stationData={testPortalData || undefined}
      />
    </div>
  );
};

function KeyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3" />
    </svg>
  );
}

export default ClassroomScavengerHuntStudio;
