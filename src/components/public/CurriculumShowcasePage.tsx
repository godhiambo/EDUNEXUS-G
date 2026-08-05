import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Search, 
  Compass, 
  QrCode, 
  Volume2, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  Eye, 
  GraduationCap, 
  Layers, 
  Award, 
  Globe,
  Filter
} from 'lucide-react';
import { OPEN_BOOKS_CATALOG } from '../../data/openBooksData';

interface CurriculumShowcasePageProps {
  onOpenAuth: (role?: 'Teacher' | 'Student' | 'Parent' | 'Administrator') => void;
  onNavigateToHome: () => void;
}

export default function CurriculumShowcasePage({
  onOpenAuth,
  onNavigateToHome
}: CurriculumShowcasePageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [activeSampleModal, setActiveSampleModal] = useState<any | null>(null);

  const categories = ['All', '5E Lesson Plans', '3D Virtual Field Trips', 'QR Scavenger Hunts', 'Audio Notes & Phonetics', 'Global Reference Books'];
  const grades = ['All', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Senior Secondary'];

  // Curated OER Sample Showcases
  const sampleItems = [
    {
      id: 'sample-lp-1',
      type: '5E Lesson Plans',
      title: 'Grade 6 Science: Solar Energy & Photovoltaic Systems',
      subject: 'Science & Technology',
      gradeLevel: 'Grade 6',
      curriculum: 'KICD CBC Aligned',
      duration: '45 Mins',
      description: 'Comprehensive 5E instructional design exploring renewable solar energy, photovoltaic cells, and practical circuit connections.',
      competencies: ['Critical Thinking', 'Digital Literacy', 'Environmental Stewardship'],
      tags: ['Solar Power', 'Circuits', 'Energy', '5E Model'],
      previewContent: {
        engage: 'Demonstrate a miniature solar calculator. Ask learners: How does light turn into electrical numbers without a battery?',
        explore: 'In groups of 4, connect a small 3V solar panel to a multimeter under natural sunlight and observe voltage readings.',
        explain: 'Teacher guides discussion on photovoltaic cells, semiconductor physics, and clean energy transition in Kenya.',
        elaborate: 'Design a simple solar lighting plan for a rural homestead study room.',
        evaluate: 'Diagnostic quiz with 3 multi-tiered inquiry questions.'
      }
    },
    {
      id: 'sample-vft-1',
      type: '3D Virtual Field Trips',
      title: 'Global Expedition: Brussels Royal Palace & Grand-Place',
      subject: 'Social Studies & French Culture',
      gradeLevel: 'Grade 7',
      curriculum: 'International & CBC Integrated',
      duration: '30 Mins Expedition',
      description: 'Interactive 360° virtual tour through Neoclassical European architecture with 30-second audio guides and Socratic travel notes.',
      competencies: ['Global Citizenship', 'Architectural Analysis', 'Multilingual Communication'],
      tags: ['Virtual Reality', 'Brussels', '360° Panorama', 'Audio Guide'],
      previewContent: {
        highlights: [
          'Neoclassical Main Gates (Corinthian limestone columns)',
          'Rue Royale French directional signage ("Tournez à gauche")',
          'Grand-Place Guildhouses & Gothic Town Hall facade'
        ],
        audioGuideScript: 'Welcome to the Neoclassical Main Gates of the Royal Palace. Notice the majestic Corinthian columns sculpted from local Belgian limestone...',
        xpReward: '+250 XP Points & Grand Explorer Badge'
      }
    },
    {
      id: 'sample-qr-1',
      type: 'QR Scavenger Hunts',
      title: 'CBC Math Station Hunt: Geometry, Angles & Perimeter',
      subject: 'Mathematics',
      gradeLevel: 'Grade 5',
      curriculum: 'KICD CBC Aligned',
      duration: '40 Mins Activity',
      description: 'Printable classroom QR code stations. Students scan codes with device camera to reveal geometry riddles and earn station keys.',
      competencies: ['Problem Solving', 'Spatial Awareness', 'Team Collaboration'],
      tags: ['Interactive QR', 'Geometry', 'Classroom Scavenger Hunt'],
      previewContent: {
        station1: 'Station #1 (North Wall): "I have four equal sides and four right angles. Measure my perimeter in centimeters!"',
        station2: 'Station #2 (Window Ledge): "Scan code to unlock the secret key word to open Station #3."',
        reward: 'Unlocks Geometry Master Certificate PDF'
      }
    },
    {
      id: 'sample-phonetics-1',
      type: 'Audio Notes & Phonetics',
      title: 'Swahili Vowel & Consonant Harmony Practice Studio',
      subject: 'Kiswahili',
      gradeLevel: 'Grade 4',
      curriculum: 'KICD Kiswahili Sanifu',
      duration: '20 Mins Practice',
      description: 'Interactive pronunciation studio featuring visual speech waveforms, vocal mouth diagrams, and instant AI feedback.',
      competencies: ['Communication', 'Phonetic Accuracy', 'Listening Comprehension'],
      tags: ['Kiswahili', 'Speech Synthesis', 'Phonetics', 'Audio Feedback'],
      previewContent: {
        targetWords: ['MTAKURIMA', 'UTAMADUNI', 'UJANJA', 'USALAMA'],
        phoneticsTip: 'Maintain open rounded lips for vowel "U" and clear tongue-palate contact for consonant "T".'
      }
    }
  ];

  const filteredItems = sampleItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.type === selectedCategory;
    const matchesGrade = selectedGrade === 'All' || item.gradeLevel === selectedGrade;
    return matchesSearch && matchesCategory && matchesGrade;
  });

  return (
    <div className="w-full bg-[#fdfbf7] text-[#3a3a3a] min-h-screen font-sans">
      
      {/* PAGE HEADER */}
      <section className="bg-white border-b border-slate-200/80 pt-10 pb-12 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-[#5f6f52]">Open Educational Resources (OER)</span>
              <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-slate-900">
                Public Curriculum & Playbook Showcase
              </h1>
              <p className="text-sm text-slate-600 font-medium max-w-2xl">
                Explore sample CBC 5E lesson plans, 3D Virtual Field Trips, QR Scavenger Hunt stations, and interactive phonetic guides.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateToHome}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                ← Back to Home
              </button>
              <button
                onClick={() => onOpenAuth('Teacher')}
                className="px-5 py-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Teacher Sign In</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search resources by topic, subject, or keyword..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5f6f52] focus:outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
              >
                {grades.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </section>

      {/* SHOWCASE RESOURCE CARDS GRID */}
      <section className="py-12 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Showing {filteredItems.length} Featured Educational Samples
            </span>
            {(selectedCategory !== 'All' || selectedGrade !== 'All' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedGrade('All');
                  setSearchTerm('');
                }}
                className="text-xs font-extrabold text-[#5f6f52] hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                      {item.type}
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      {item.gradeLevel} • {item.duration}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 font-serif leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.competencies.map((comp, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                        ✓ {comp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveSampleModal(item)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Sample</span>
                  </button>

                  <button
                    onClick={() => onOpenAuth('Teacher')}
                    className="px-4 py-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Use in Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SAMPLE INSPECT MODAL */}
      <AnimatePresence>
        {activeSampleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-auto overflow-hidden relative"
            >
              <button
                onClick={() => setActiveSampleModal(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                  {activeSampleModal.type}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 font-serif">
                  {activeSampleModal.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {activeSampleModal.subject} • {activeSampleModal.gradeLevel} • {activeSampleModal.curriculum}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                  Sample Content Structure
                </h4>

                {activeSampleModal.previewContent.engage && (
                  <div className="space-y-1">
                    <p className="font-bold text-amber-900">1. Engage Phase</p>
                    <p className="text-slate-700">{activeSampleModal.previewContent.engage}</p>
                  </div>
                )}

                {activeSampleModal.previewContent.explore && (
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-900">2. Explore Phase</p>
                    <p className="text-slate-700">{activeSampleModal.previewContent.explore}</p>
                  </div>
                )}

                {activeSampleModal.previewContent.highlights && (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">Field Trip Key Milestones</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                      {activeSampleModal.previewContent.highlights.map((h: string, i: number) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeSampleModal.previewContent.audioGuideScript && (
                  <div className="p-3 bg-amber-100/60 border border-amber-300/80 rounded-xl space-y-1">
                    <p className="font-extrabold text-amber-950 flex items-center gap-1.5 text-[11px]">
                      <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                      <span>30-Second Audio Guide Script</span>
                    </p>
                    <p className="text-amber-900 italic text-[11px] leading-relaxed">
                      "{activeSampleModal.previewContent.audioGuideScript}"
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setActiveSampleModal(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    setActiveSampleModal(null);
                    onOpenAuth('Teacher');
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Customize in Teacher Portal</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
