import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { handleResponseJson } from '../utils/api';
import { db, cleanUndefined, compressObject } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { SavedDocument } from '../types';
import { triggerAutoBackupIfEnabled } from '../lib/googleWorkspace';
import {
  Search,
  Sparkles,
  ExternalLink,
  BookmarkPlus,
  Check,
  Globe,
  GraduationCap,
  Tv,
  FileText,
  Lightbulb,
  Compass,
  ArrowRight,
  BookmarkCheck,
  AlertCircle
} from 'lucide-react';

interface ResourceResult {
  title: string;
  url: string;
  category: string;
  type: string;
  description: string;
  gradeLevel: string;
  whyTeachersLoveIt: string;
  suggestedActivity: string;
}

export default function GlobalResources() {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('All Subjects');
  const [resourceType, setResourceType] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState<ResourceResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedResourceUrls, setSavedResourceUrls] = useState<string[]>([]);
  const [activeCuratedQuery, setActiveCuratedQuery] = useState<string | null>(null);

  useEffect(() => {
    const handleNavigation = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { query: newQuery, subject: newSubject, type: newType } = customEvent.detail || {};
      if (newQuery) {
        setQuery(newQuery);
        setSubject(newSubject || 'All Subjects');
        setResourceType(newType || 'All');
        setActiveCuratedQuery(newQuery);
        handleSearch(newQuery, newSubject || 'All Subjects', newType || 'All');
      }
    };

    window.addEventListener('navigateToGlobalResources', handleNavigation);
    return () => {
      window.removeEventListener('navigateToGlobalResources', handleNavigation);
    };
  }, []);

  useEffect(() => {
    // Populate with pre-verified high-quality global resources on initial mount so the page is never blank
    const initialResources = getStaticFallbackResources('', 'All Subjects', 'All');
    setResources(initialResources);
  }, []);

  const isStudent = profile?.role === 'Student';

  const curatedTopics = [
    {
      title: 'PhET Science & Math Sims',
      query: 'PhET interactive science physics chemistry math simulations',
      subject: 'STEM (Science, Tech, Engineering, Math)',
      type: 'Interactive Simulator'
    },
    {
      title: 'Khan Academy Mastery Lessons',
      query: 'Khan Academy video lessons and practice exercises',
      subject: 'All Subjects',
      type: 'Lesson Plan'
    },
    {
      title: 'BBC Bitesize Active Learning',
      query: 'BBC Bitesize interactive study guides and revision topics',
      subject: 'Humanities & Social Sciences',
      type: 'Reference Site'
    },
    {
      title: 'Dyslexia & SEN Friendly Activities',
      query: 'SEN active learning multi-sensory dyslexia accommodations classroom',
      subject: 'Inclusion & SEN Adaptations',
      type: 'Worksheet'
    },
    {
      title: 'Code.org Computer Science',
      query: 'Code org computer science programming coding curriculum block based',
      subject: 'STEM (Science, Tech, Engineering, Math)',
      type: 'Interactive Simulator'
    },
    {
      title: 'British Council English & EAL',
      query: 'British Council LearnEnglish kids worksheets grammar vocabulary lesson plans',
      subject: 'Languages & Literacy',
      type: 'Worksheet'
    },
    {
      title: 'Edutopia Creative Strategies',
      query: 'Edutopia creative classroom teaching strategies physical education project based learning',
      subject: 'Arts, Sports & Creative',
      type: 'Lesson Plan'
    },
    {
      title: 'UDL Inclusive Frameworks',
      query: 'Universal Design for Learning guidelines CAST inclusive accommodations SEN classroom',
      subject: 'Inclusion & SEN Adaptations',
      type: 'Lesson Plan'
    }
  ];

  const handleSearch = async (searchQuery: string = query, customSub: string = subject, customType: string = resourceType) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/search-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          subject: customSub,
          resourceType: customType
        })
      });

      const data = await handleResponseJson(response, 'Failed to search for resources.');
      setResources(data.resources || []);
    } catch (err: any) {
      console.error(err);
      
      const errStr = typeof err === 'object' && err !== null ? (err.message || JSON.stringify(err)) : String(err);
      const isQuotaLimit = errStr.includes('429') || 
                           errStr.toLowerCase().includes('quota') || 
                           errStr.toLowerCase().includes('rate_limit') || 
                           errStr.toLowerCase().includes('exhausted') ||
                           errStr.toLowerCase().includes('limit');
      
      if (isQuotaLimit) {
        setErrorMsg("The system is currently experiencing high demand and has temporarily reached its search credit limits. To ensure your classroom lesson planning remains uninterrupted, we've loaded cached verified global resources tailored to your topic!");
      } else {
        setErrorMsg("We've encountered an issue connecting to the live search indexes. To ensure your classroom preparation is seamless, we have loaded high-quality pre-verified global resources matching your topic.");
      }

      const fallbackResults = getStaticFallbackResources(searchQuery, customSub, customType);
      setResources(fallbackResults);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCuratedClick = (topic: typeof curatedTopics[0]) => {
    setQuery(topic.title);
    setSubject(topic.subject);
    setResourceType(topic.type);
    setActiveCuratedQuery(topic.title);
    handleSearch(topic.query, topic.subject, topic.type);
  };

  const handleAddToMyMaterials = async (resource: ResourceResult) => {
    if (isStudent) {
      alert("Permission Denied: Students are restricted from adding materials.");
      return;
    }

    try {
      const docId = `doc-resource-${Date.now()}`;
      
      // We'll translate the Resource format into a beautifully formatted Markdown SavedDocument
      const markdownContent = `# ${resource.title}
      
### 📁 Global Educational Resource
* **URL:** [Access Direct Resource Link](${resource.url})
* **Suggested Subject:** ${resource.category}
* **Resource Type:** ${resource.type}
* **Suggested Grade/Class Levels:** ${resource.gradeLevel}

---

### 📝 Resource Description
${resource.description}

---

### 💡 Why Teachers Love It
${resource.whyTeachersLoveIt}

---

### 🎓 Suggested Classroom Activity / Teaching Strategy
${resource.suggestedActivity}

---
*Created via EduNexus Global Resource Explorer. Always review external resource content for compliance with local curricula before classroom instruction.*`;

      const newDoc: SavedDocument = {
        id: docId,
        title: `🌐 Resource: ${resource.title}`,
        docType: 'lesson-notes', // Fits into existing system layout
        curriculum: 'standard',
        subject: resource.category.includes('STEM') ? 'STEM' : 'Other',
        classLevel: resource.gradeLevel,
        topic: resource.title,
        subTopic: resource.type,
        duration: 'N/A',
        content: markdownContent,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        tags: ['Global Resource', resource.type, 'Imported']
      };

      await setDoc(doc(db, 'documents', docId), cleanUndefined(compressObject(newDoc)));

      // Trigger automated backup to Google Drive if enabled
      triggerAutoBackupIfEnabled(newDoc);

      // Create initial version
      const initialVersionId = `v-1-${Date.now()}`;
      const initialVersion = {
        id: initialVersionId,
        docId: docId,
        title: newDoc.title,
        content: newDoc.content,
        lastModified: newDoc.createdAt,
        modifiedByUid: profile?.uid || 'system',
        modifiedByName: profile?.displayName || 'AI Resource Explorer',
        modifiedByEmail: profile?.email || '',
        versionNumber: 1
      };
      await setDoc(doc(db, 'documents', docId, 'versions', initialVersionId), cleanUndefined(compressObject(initialVersion)));

      setSavedResourceUrls(prev => [...prev, resource.url]);
    } catch (err: any) {
      console.error('Error importing global resource:', err);
      alert('Failed to save resource: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fadeIn space-y-8" id="global-resources-tab">
      
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-[#5f6f52] to-[#4d5b41] rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-md">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
          <Globe className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <span className="bg-[#fefae0]/20 text-[#fefae0] text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-[#fefae0]/20 inline-block">
            ✨ Gemini Search Grounding
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Global Teaching Resource Explorer</h1>
          <p className="text-sm md:text-base text-slate-100 max-w-2xl leading-relaxed">
            Search and scan real-time databases, curriculum platforms, and global repositories. Instantly source high-quality simulators, worksheets, and assessment content to enrich your lessons.
          </p>
        </div>
      </div>

      {/* Featured Curated Topics */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#5f6f52]" />
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#5f6f52]">Featured Global Resource Repositories</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {curatedTopics.map((topic) => {
            const isActive = activeCuratedQuery === topic.title;
            return (
              <button
                key={topic.title}
                onClick={() => handleCuratedClick(topic)}
                className={`text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group h-36 ${
                  isActive
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/10'
                    : 'bg-white border-slate-150 hover:border-[#5f6f52] hover:shadow-sm'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full mb-2.5 inline-block">
                    {topic.type}
                  </span>
                  <h3 className="text-xs font-extrabold text-slate-800 line-clamp-2 leading-snug group-hover:text-[#5f6f52] transition-colors">
                    {topic.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 w-full text-[10px] text-slate-400 font-medium">
                  <span>{topic.subject.split(' ')[0]}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#a9b388]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input and Filters Area */}
      <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xs space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-4">
          
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search inputs */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveCuratedQuery(null);
                }}
                placeholder="Describe what you want (e.g. gravity simulations, fraction word problems, reading comprehensions)..."
                className="w-full bg-slate-50 hover:bg-slate-50/50 border border-slate-200 focus:border-[#5f6f52] focus:bg-white text-sm text-slate-800 pl-11 pr-4 py-3 rounded-2xl transition focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="bg-[#5f6f52] hover:bg-[#4d5b41] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-2xl transition flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Scanning repositories...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#fefae0]" />
                  <span>Scan Globally</span>
                </>
              )}
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                Subject Focus
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5f6f52] transition"
              >
                <option value="All Subjects">All Subjects</option>
                <option value="STEM (Science, Tech, Engineering, Math)">STEM</option>
                <option value="Languages & Literacy">Languages & Literacy</option>
                <option value="Humanities & Social Sciences">Humanities & Social Sciences</option>
                <option value="Early Childhood Development">Early Childhood Development</option>
                <option value="Arts, Sports & Creative">Arts, Sports & Creative</option>
                <option value="Technical & Vocational Studies">Technical & Vocational Studies</option>
                <option value="Inclusion & SEN Adaptations">Inclusion & SEN Adaptations</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                Resource Type
              </label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#5f6f52] transition"
              >
                <option value="All">All Formats</option>
                <option value="Worksheet">Worksheets & Handouts</option>
                <option value="Interactive Simulator">Interactive Simulators</option>
                <option value="Lesson Plan">Lesson Plans & Ideas</option>
                <option value="Assessment">Assessment & Quizzes</option>
                <option value="Video">Videos & Educational Media</option>
                <option value="Reference Site">Reference & Content Sites</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3 text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Search Error:</span> {errorMsg}
          </div>
        </div>
      )}

      {/* Loading state placeholders */}
      {isLoading && (
        <div className="space-y-6">
          <div className="text-center py-6">
            <Globe className="w-10 h-10 text-[#5f6f52] animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Connecting to global repository networks...</p>
            <p className="text-xs text-slate-400 mt-1">Filtering verified teaching aids, simulators, and handouts via Gemini Search Grounding</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4 animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="h-6 w-1/2 bg-slate-200 rounded-xl"></div>
                  <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-slate-200 rounded-lg"></div>
                  <div className="h-3 w-5/6 bg-slate-200 rounded-lg"></div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="h-4 w-24 bg-slate-200 rounded-lg"></div>
                  <div className="h-8 w-28 bg-slate-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results grid */}
      {!isLoading && resources.length > 0 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Matches Found Globally ({resources.length})
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resources.map((resItem) => {
              const isSaved = savedResourceUrls.includes(resItem.url);
              return (
                <div
                  key={resItem.url}
                  className="bg-white border border-slate-150 hover:border-emerald-300 hover:shadow-md transition-all duration-300 rounded-3xl p-6 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Tags row */}
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          {resItem.category}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {resItem.type}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" /> {resItem.gradeLevel}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="text-base font-bold text-slate-800 leading-snug group-hover:text-[#5f6f52] transition-colors">
                        {resItem.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {resItem.description}
                    </p>

                    {/* Key insights / Classroom highlights */}
                    <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <div className="text-xs text-slate-600">
                        <span className="font-bold text-emerald-700 flex items-center gap-1 mb-0.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          Why Teachers Love It:
                        </span>
                        {resItem.whyTeachersLoveIt}
                      </div>
                      <div className="text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <span className="font-bold text-[#5f6f52] flex items-center gap-1 mb-0.5">
                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          Suggested Class Activity:
                        </span>
                        {resItem.suggestedActivity}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-5 mt-5 border-t border-slate-100 flex items-center gap-3">
                    <a
                      href={resItem.url}
                      target="_blank"
                      rel="noopener noreferrer referrer"
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Link</span>
                    </a>

                    {!isStudent && (
                      <button
                        onClick={() => handleAddToMyMaterials(resItem)}
                        disabled={isSaved}
                        className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          isSaved
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-[#5f6f52] hover:bg-[#4d5b41] text-white shadow-xs'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                            <span>Saved to Materials</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            <span>Add to Materials</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No results placeholder */}
      {!isLoading && resources.length === 0 && (
        <div className="bg-white border border-slate-150 rounded-3xl p-10 text-center text-slate-500">
          <Globe className="w-12 h-12 text-[#a9b388] mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-800">Ready to Scan the Web</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            Choose a featured topic above or describe your curriculum focus to discover high-quality, verified lesson resources from top worldwide sources.
          </p>
        </div>
      )}

    </div>
  );
}

const getStaticFallbackResources = (query: string, subject: string, type: string): ResourceResult[] => {
  const cleanSubject = subject || 'All Subjects';
  const cleanType = type && type !== 'All' ? type : 'All';

  const allResources: ResourceResult[] = [
    {
      title: "Math Learning Center (Virtual Manipulatives)",
      url: "https://www.mathlearningcenter.org/apps",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Free interactive math apps (fractions, geoboards, number lines, clocks) to visualize mathematical relations.",
      gradeLevel: "Grade K-8",
      whyTeachersLoveIt: "Purely virtual, visual math tools that simulate real physical manipulatives.",
      suggestedActivity: "Use the interactive Geoboard app to show students how to calculate area and perimeter of irregular polygons."
    },
    {
      title: "Polypad by Mathigon",
      url: "https://mathigon.org/polypad",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "An incredible digital canvas for math with fraction circles, tangrams, prime factor circles, algebra tiles, and probability spinners.",
      gradeLevel: "Grade K-12",
      whyTeachersLoveIt: "It's the most flexible digital math playground available, suitable for algebra, geometry, and numbers.",
      suggestedActivity: "Guide students to create geometric tessellations or model fractions using custom color-coded bars."
    },
    {
      title: "MathsBot Math Tools & Generators",
      url: "https://mathsbot.com",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Assessment",
      description: "Free math tools, automated question generators, visual manipulatives, and starter templates for quick homework sheets.",
      gradeLevel: "Grade 1-12",
      whyTeachersLoveIt: "Saves hundreds of hours by generating instantly customizable math question banks.",
      suggestedActivity: "Generate a 10-question quick decimal quiz for students to use as an entrance ticket."
    },
    {
      title: "Didax Virtual Manipulatives (Dedax)",
      url: "https://www.didax.com/math/virtual-manipulatives.html",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Virtual base ten blocks, unifix cubes, pattern blocks, and counters to facilitate conceptual math learning.",
      gradeLevel: "Grade K-6",
      whyTeachersLoveIt: "Recreates the exact tactile materials students use in classrooms on a digital screen.",
      suggestedActivity: "Use the virtual unifix cubes to demonstrate basic addition and subtraction groupings."
    },
    {
      title: "GeoGebra Mathematical Calculators",
      url: "https://www.geogebra.org",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Interactive 2D/3D graphing calculators, geometry builders, and active spreadsheets for algebra, calculus, and mechanics.",
      gradeLevel: "Grade 6-12",
      whyTeachersLoveIt: "Powerhouse tool for exploring functional relations, geometry theorems, and physics modeling.",
      suggestedActivity: "Graph quadratic equations and observe the changes in the vertex as students alter coefficients."
    },
    {
      title: "oPhysics: Interactive Physics Simulations (ophysic.com)",
      url: "https://ophysics.com",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Interactive physics simulations and animations showcasing kinematics, forces, waves, optics, and thermodynamics.",
      gradeLevel: "Grade 8-12",
      whyTeachersLoveIt: "Simple, fast-loading visual explanations of complex physics theorems.",
      suggestedActivity: "Use the projectile motion simulator to test how changing launch angles alters the landing distance."
    },
    {
      title: "Toy Theater: Area Model Tools",
      url: "https://toytheater.com/area/",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Elementary math games, area model grids, and interactive multiplication matrices for physical demonstration.",
      gradeLevel: "Grade K-5",
      whyTeachersLoveIt: "Simple, kid-friendly interfaces designed for direct interaction on tablets or smart boards.",
      suggestedActivity: "Task children to create rectangles of specified areas on the grid and calculate their perimeters."
    },
    {
      title: "Shodor Interactivate: Perimeter Explorer",
      url: "https://www.shodor.org/interactivate/activities/PerimeterExplorer/",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Assessment",
      description: "Interactive applet where students calculate the perimeter of random shapes drawn on a grid.",
      gradeLevel: "Grade 3-8",
      whyTeachersLoveIt: "Randomly generates custom shapes, allowing infinite practice of counting perimeter steps.",
      suggestedActivity: "Set up a classroom speed challenge to see who can correctly count 5 perimeter shapes in the shortest time."
    },
    {
      title: "Math Playground: Area Shape Game",
      url: "https://www.mathplayground.com/area_perimeter.html",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Gamified practice sheets and shape-building challenges for children exploring area and perimeter.",
      gradeLevel: "Grade 2-6",
      whyTeachersLoveIt: "Turns dry geometry drills into engaging, rewarded challenges.",
      suggestedActivity: "Guide students to complete the 'Build a Rectangle' game on Math Playground."
    },
    {
      title: "The Kids Should See This (TKSST)",
      url: "https://thekidshouldseethis.com",
      category: "Arts, Sports & Creative",
      type: "Video",
      description: "Curated collection of kid-friendly, highly interesting educational videos on science, history, art, and engineering.",
      gradeLevel: "All Grades",
      whyTeachersLoveIt: "Excellent, smart, non-dumbed-down videos that spark intense classroom discussion.",
      suggestedActivity: "Open a lesson on simple machines by showing the Rube Goldberg video curated on TKSST."
    },
    {
      title: "Google Earth 3D Atlas (Goodle Earth)",
      url: "https://earth.google.com",
      category: "Humanities & Social Sciences",
      type: "Interactive Simulator",
      description: "Real-time satellite maps, 3D terrains, and street view tours for exploring physical geography, cities, and nature.",
      gradeLevel: "All Grades",
      whyTeachersLoveIt: "Instantly transports classrooms to active volcanoes, historical monuments, or local topography.",
      suggestedActivity: "Launch a virtual class scavenger hunt to locate 3 major geographical landmarks."
    },
    {
      title: "Cells Alive! Biology Learning Games (Cells Alive Fun)",
      url: "https://www.cellsalive.com",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Interactive biology models of plant cells, animal cells, bacteria, and virus structures.",
      gradeLevel: "Grade 5-12",
      whyTeachersLoveIt: "Highly interactive, clear labels, zoomable organelles, and animations of cell divisions.",
      suggestedActivity: "Guide students to locate and describe the functions of the mitochondria and vacuole on the cell models."
    },
    {
      title: "NASA's Eyes Interactive Space Flight",
      url: "https://eyes.nasa.gov",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Live, real-time 3D simulation of planets, asteroids, spacecraft missions, and Earth's weather satellites.",
      gradeLevel: "Grade 4-12",
      whyTeachersLoveIt: "Highly detailed and accurate orbital paths powered by real NASA astronomical datasets.",
      suggestedActivity: "Track the current position of the Perseverance Rover on Mars."
    },
    {
      title: "National Geographic Society Portal",
      url: "https://www.nationalgeographic.com",
      category: "Humanities & Social Sciences",
      type: "Reference Site",
      description: "World-famous collection of photography, geography profiles, anthropological articles, and natural sciences.",
      gradeLevel: "Grade 6-12",
      whyTeachersLoveIt: "Superb high-fidelity media, maps, and cultural resources.",
      suggestedActivity: "Assign a reading on continental drift and plate tectonics utilizing National Geographic maps."
    },
    {
      title: "National Geographic Kids",
      url: "https://kids.nationalgeographic.com",
      category: "Humanities & Social Sciences",
      type: "Video",
      description: "Child-friendly geography quizzes, animal facts, science videos, and historical snapshots.",
      gradeLevel: "Grade K-6",
      whyTeachersLoveIt: "Bright, highly readable, interactive quizzes and short, high-energy educational games.",
      suggestedActivity: "Complete the interactive 'World Continent Map' quiz together on the smart screen."
    },
    {
      title: "Topmarks Teaching Clock (Interactive Time)",
      url: "https://www.topmarks.co.uk/time/teaching-clock",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Interactive clock with movable hour/minute hands and analog/digital display modes to teach telling time.",
      gradeLevel: "Grade K-4",
      whyTeachersLoveIt: "Excellent visual tool for modeling intervals, half-past, quarter-past, and AM/PM transitions.",
      suggestedActivity: "Move the analog clock hands and challenge students to read the matching digital readout."
    },
    {
      title: "IXL Math Lesson: AM and PM Time Intervals",
      url: "https://www.ixl.com/math/lessons/am-and-pm",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Lesson Plan",
      description: "Online lesson and interactive questions teaching the distinction between AM (morning) and PM (afternoon/evening) activities.",
      gradeLevel: "Grade 1-4",
      whyTeachersLoveIt: "Immediate feedback with clear, scaffolded explanations for correct/incorrect answers.",
      suggestedActivity: "Assign the AM/PM classification questions as an independent practice set."
    },
    {
      title: "Topmarks Shape Patterns Ordering Game (Shape Patterns Top Mark)",
      url: "https://www.topmarks.co.uk/ordering-and-sequencing/shape-patterns",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Sequencing game where children complete shape patterns by dragging geometric shapes.",
      gradeLevel: "Grade K-3",
      whyTeachersLoveIt: "Highly engaging way to teach logical sequence deduction and shape classification.",
      suggestedActivity: "Have students predict the next shape in a patterns sequence on the board."
    },
    {
      title: "Topmarks Duck Shoot Multiples Game (Duck Short Multiples)",
      url: "https://www.topmarks.co.uk/times-tables/duck-shoot-multiples",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Interactive shooting game where students identify multiples of numbers in a fun carnival layout.",
      gradeLevel: "Grade 1-6",
      whyTeachersLoveIt: "Increases multiplication automaticity and recall speed through engaging play.",
      suggestedActivity: "Set up a 5-minute multiples drill for the 7 and 8 times tables."
    },
    {
      title: "IXL Learning Platform (All Subjects)",
      url: "https://www.ixl.com",
      category: "All Subjects",
      type: "Assessment",
      description: "Comprehensive, curriculum-aligned math, language arts, science, and social studies questions and tracking.",
      gradeLevel: "Grade K-12",
      whyTeachersLoveIt: "Detailed dashboards that pinpoint exactly which skills require extra practice.",
      suggestedActivity: "Assign specific topic modules to match the core standards taught in this lesson."
    },
    {
      title: "Topmarks Parachute Number Line Game",
      url: "https://www.topmarks.co.uk/maths-games/parachute-number-line",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Place fractions, decimals, negative numbers, and thousands on a continuous number line.",
      gradeLevel: "Grade 1-6",
      whyTeachersLoveIt: "Excellent visual modeling of relative values and fraction-decimal positions.",
      suggestedActivity: "Challenge children to estimate where 0.75 fits on a number line bounded by 0 and 1."
    },
    {
      title: "Topmarks Caterpillar Ordering & Sequencing (Caterpillar Sequencing Topmarks)",
      url: "https://www.topmarks.co.uk/ordering-and-sequencing/caterpillar-ordering",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Sequence, order, and sort multi-digit numbers, negative numbers, and decimals.",
      gradeLevel: "Grade K-6",
      whyTeachersLoveIt: "Very bright, child-friendly layout with immediate checks for accuracy.",
      suggestedActivity: "Order lists of positive and negative temperatures from coldest to warmest."
    },
    {
      title: "TeacherLed: Compare and Contrast Display Tools",
      url: "https://www.teacherled.com",
      category: "Other / General",
      type: "Reference Site",
      description: "Dynamic whiteboard tools for displaying, comparing, and contrasting documents and files side-by-side.",
      gradeLevel: "All Grades",
      whyTeachersLoveIt: "Simple, non-fussy visual aids that keep children focused during whole-class discussion.",
      suggestedActivity: "Project two texts side-by-side to compare differing authors' tones."
    },
    {
      title: "MathsIsFun: Fractions to Decimals Converter",
      url: "https://www.mathsisfun.com/converting-fractions-decimals.html",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Reference Site",
      description: "Interactive fraction-to-decimal visual calculator and division explanation sheets.",
      gradeLevel: "Grade 3-8",
      whyTeachersLoveIt: "Shows the physical division steps so children connect division to fractions.",
      suggestedActivity: "Convert simple repeating fractions (like 1/3) and discuss why repeating decimals occur."
    },
    {
      title: "Decimal Squares Interactive Learning Games",
      url: "http://decimalsquares.com",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Interactive grid models for fractions and decimals, with decimal card matches and relative size lines.",
      gradeLevel: "Grade 3-7",
      whyTeachersLoveIt: "Fantastic visual proof of place value in tenths, hundredths, and thousandths.",
      suggestedActivity: "Color in decimal squares on-screen to prove that 0.4 is larger than 0.35."
    },
    {
      title: "MathsBot Place Value Counters",
      url: "https://mathsbot.com/manipulatives/placeValueCounters",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Drag-and-drop place value disks on column mats to model numbers, additions, and subtractions.",
      gradeLevel: "Grade K-6",
      whyTeachersLoveIt: "Superb way to show borrowing, regrouping, and column carrying visually.",
      suggestedActivity: "Model carrying over in addition by regrouping ten ones counters into one ten disk."
    },
    {
      title: "Storyboard That: Digital Comic Creator (Story Board That)",
      url: "https://www.storyboardthat.com",
      category: "Languages & Literacy",
      type: "Interactive Simulator",
      description: "Drag-and-drop characters, text bubbles, and scenes to build historical timelines and book summaries.",
      gradeLevel: "Grade 1-12",
      whyTeachersLoveIt: "Exceptional for creative writing, timeline plotting, and digital media expression.",
      suggestedActivity: "Challenge children to summarize a history event as a 3-panel comic strip."
    },
    {
      title: "Pobble 365 Daily Creative Writing Prompts",
      url: "https://www.pobble365.com",
      category: "Languages & Literacy",
      type: "Lesson Plan",
      description: "Fresh, high-quality picture prompts, sentence starters, spelling tasks, and creative story outlines every single day.",
      gradeLevel: "Grade 1-8",
      whyTeachersLoveIt: "Excellent, low-prep resource for daily morning warm-ups or spelling and grammar hooks.",
      suggestedActivity: "Project the picture of the day and give students 5 minutes to draft a sensory paragraph about it."
    },
    {
      title: "Wordwall: Custom Classroom Game Creator",
      url: "https://wordwall.net",
      category: "All Subjects",
      type: "Interactive Simulator",
      description: "Custom game creators including matching pairs, anagrams, quiz wheels, crosswords, and balloons.",
      gradeLevel: "Grade K-12",
      whyTeachersLoveIt: "Teachers can instantly transform custom word/question lists into dozens of different gamified templates.",
      suggestedActivity: "Create a vocab crossword game for students to practice terms from the current science unit."
    },
    {
      title: "Epic! Digital Reading Library (Get Epic!)",
      url: "https://www.getepic.com",
      category: "Languages & Literacy",
      type: "Reference Site",
      description: "Online library containing thousands of books, audiobooks, learning videos, and quizzes for young readers.",
      gradeLevel: "Grade K-6",
      whyTeachersLoveIt: "Promotes self-directed reading with personalized, child-safe recommendations and badges.",
      suggestedActivity: "Let students explore a book on environmental science in the digital library for 15 minutes."
    },
    {
      title: "Topmarks English Games (Grammar & Phonics)",
      url: "https://www.topmarks.co.uk/english-games/",
      category: "Languages & Literacy",
      type: "Interactive Simulator",
      description: "Interactive punctuation, vocabulary, and phonetic matching games to develop literacy in elementary levels.",
      gradeLevel: "Grade K-5",
      whyTeachersLoveIt: "Colorful, simple games that target phonics and sentence structure.",
      suggestedActivity: "Play the spelling puzzle games as a whole-class review."
    },
    {
      title: "Math Learning Center: Number Pieces & Frames",
      url: "https://apps.mathlearningcenter.org/number-pieces/",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Multi-colored base-ten blocks (ones, tens, hundreds) to visualize place value and regrouping.",
      gradeLevel: "Grade K-5",
      whyTeachersLoveIt: "Extremely clean interface, perfect for modeling long multiplication or carrying.",
      suggestedActivity: "Represent the number 234 using blocks, then divide it into groups on screen."
    },
    {
      title: "Blooket Live Trivia Games (Blloket)",
      url: "https://www.blooket.com",
      category: "All Subjects",
      type: "Assessment",
      description: "Highly engaging, gamified trivia platform with custom themes, upgrades, and competitive game modes.",
      gradeLevel: "All Grades",
      whyTeachersLoveIt: "Incredible engagement rates with competitive modes that keep all students focused on study material.",
      suggestedActivity: "Run a live Blooket trivia game to review vocabulary before a formal assessment."
    },
    {
      title: "SolveMoji Emoji Math Puzzles",
      url: "https://www.solvemoji.com",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Worksheet",
      description: "Logic and algebra math puzzles replacing traditional variables with colorful emojis.",
      gradeLevel: "Grade 1-10",
      whyTeachersLoveIt: "Teaches algebraic thinking and multi-variable equations without intimidating students with letters.",
      suggestedActivity: "Solve a medium-difficulty Solvemoji puzzle together as a daily math warm-up."
    },
    {
      title: "Wheel of Names & Number Picker",
      url: "https://wheelofnames.com",
      category: "Other / General",
      type: "Interactive Simulator",
      description: "Customizable spinning wheels for picking random student names, numbers, prompts, or math questions.",
      gradeLevel: "All Grades",
      whyTeachersLoveIt: "Adds excitement and suspense when choosing student turns or selecting quick topics.",
      suggestedActivity: "Fill the wheel with spelling vocabulary words to select terms for students to define."
    },
    {
      title: "Stellarium Web: Interactive Star Map",
      url: "https://stellarium-web.org",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "3D browser-based planetarium showing realistic night skies from any coordinate on Earth in real-time.",
      gradeLevel: "All Grades",
      whyTeachersLoveIt: "Excellent for teaching astronomy, star constellations, lunar phases, and planet paths.",
      suggestedActivity: "Change the date and location coordinates to display how the night sky appears from Nairobi."
    },
    {
      title: "Chrome Music Lab: Sound Experiments",
      url: "https://musiclab.chrome.com",
      category: "Arts, Sports & Creative",
      type: "Interactive Simulator",
      description: "Interactive music experiments (Spectrogram, Oscillators, Song Maker) exploring pitch, rhythm, and sound physics.",
      gradeLevel: "All Grades",
      whyTeachersLoveIt: "Bridges the physical science of sound waves with creative music production.",
      suggestedActivity: "Let students create a simple rhythmic loop in Song Maker to learn patterns and musical intervals."
    },
    {
      title: "MapCrunch: Random Street View Geography",
      url: "https://www.mapcrunch.com",
      category: "Humanities & Social Sciences",
      type: "Interactive Simulator",
      description: "Geography game that drops students in a random street view location somewhere on the planet to guess their country.",
      gradeLevel: "Grade 3-12",
      whyTeachersLoveIt: "Promotes geographic reasoning based on road markings, flora, architecture, and language.",
      suggestedActivity: "Try the 'MapCrunch Escape' task: guess the continent using street view clues alone."
    },
    {
      title: "The Scale of the Universe Exploration (Se of the Universe)",
      url: "https://scaleofuniverse.com",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Scrolling visualization of sizes, ranging from tiny quantum strings up to the visible universe.",
      gradeLevel: "Grade 3-12",
      whyTeachersLoveIt: "Helps students conceptualize size comparison, scientific notation, and metric scaling.",
      suggestedActivity: "Drag the scrollbar to compare the scale of a human cell to a carbon atom."
    },
    {
      title: "EarthCam Live Webcam Geography",
      url: "https://www.earthcam.com",
      category: "Humanities & Social Sciences",
      type: "Video",
      description: "Network of live scenic public webcams, displaying time-lapse weather, cities, and landmarks around the globe.",
      gradeLevel: "All Grades",
      whyTeachersLoveIt: "Perfect tool for observing time zones, climates, weather patterns, and real-time human activities.",
      suggestedActivity: "Compare the current light/day conditions in London, Tokyo, and New York during geography class."
    },
    {
      title: "Teacher Comments Bank Helper (Report Comments Back)",
      url: "https://www.teachercomments.com",
      category: "Other / General",
      type: "Reference Site",
      description: "Comprehensive database of report card comments, teacher remarks, behavioral descriptors, and template builders.",
      gradeLevel: "Teacher Resources",
      whyTeachersLoveIt: "Dramatically reduces grading administration time by offering polished comment presets.",
      suggestedActivity: "Use the comments database to structure constructive assessment feedback."
    },
    {
      title: "Primel: Prime Number Guessing Game",
      url: "https://primel.github.io",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Daily math wordle-like game where players guess five-digit prime numbers in six attempts.",
      gradeLevel: "Grade 5-12",
      whyTeachersLoveIt: "Teaches division criteria, factors, and recognition of prime numbers through active puzzle solving.",
      suggestedActivity: "Challenge advanced algebra students to solve the daily prime puzzle as a team."
    },
    {
      title: "Flagle: National Flag Guessing Puzzle",
      url: "https://flagle.io",
      category: "Humanities & Social Sciences",
      type: "Interactive Simulator",
      description: "Map-and-flag guessing game showing panels of national flags to deduce the target country.",
      gradeLevel: "Grade 3-12",
      whyTeachersLoveIt: "Builds recognition of international visual history, geography, and standard design symbols.",
      suggestedActivity: "Run a daily flag-matching session to build cultural awareness of country standards."
    },
    {
      title: "Earthle: Geography Map Guessing Game",
      url: "https://earthle.org",
      category: "Humanities & Social Sciences",
      type: "Interactive Simulator",
      description: "Visual geography game where students guess a target country based on shape outline, distance, and direction.",
      gradeLevel: "Grade 3-12",
      whyTeachersLoveIt: "Exceptional tool for learning spatial relations, compass directions, and country shapes.",
      suggestedActivity: "Open the geography lesson by having students deduce the daily mystery country shape."
    },
    {
      title: "Wordle: NYT Word Guessing Puzzle",
      url: "https://www.nytimes.com/games/wordle/",
      category: "Languages & Literacy",
      type: "Interactive Simulator",
      description: "Daily five-letter word-building game where players get six attempts to guess the hidden word.",
      gradeLevel: "Grade 2-12",
      whyTeachersLoveIt: "Promotes analytical vocabulary elimination, phonetic deduction, and spelling.",
      suggestedActivity: "Dedicate the first 5 minutes of English class to finding the daily Wordle term."
    },
    {
      title: "planbook.com: Digital Teacher Planner",
      url: "https://www.planbook.com",
      category: "Other / General",
      type: "Reference Site",
      description: "Online planning application enabling lesson schedulers, curriculum standards tracking, and class diaries.",
      gradeLevel: "Teacher Resources",
      whyTeachersLoveIt: "Keeps all class schedules, curriculum mapping plans, and student files perfectly organized.",
      suggestedActivity: "Align this lesson layout to your weekly school district standards schedule."
    },
    {
      title: "NASA Landsat Earth Satellite Imaging (Landsat Science)",
      url: "https://landsat.gsfc.nasa.gov",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Reference Site",
      description: "High-resolution satellite imagery mapping global environmental shifts, glacier movements, and agriculture.",
      gradeLevel: "Grade 5-12",
      whyTeachersLoveIt: "Direct, scientific proof of ecological shifts, land cover changes, and volcanic impacts.",
      suggestedActivity: "Inspect satellite photographs tracking changes in forests or lakes over the last 30 years."
    },
    {
      title: "NASA's Eyes on the Solar System",
      url: "https://eyes.nasa.gov/apps/solar-system/",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Realistic orbital visualizer tracking the paths of planets, moons, spacecraft, and current astronomical positions.",
      gradeLevel: "All Grades",
      whyTeachersLoveIt: "Incredible immersive view of the cosmos with time-travel controls to display planetary alignments.",
      suggestedActivity: "Animate the orbits of Earth and Mars to show how distance changes during orbital cycles."
    },
    {
      title: "NASA's Eyes on Asteroids",
      url: "https://eyes.nasa.gov/apps/asteroids/",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Live 3D planetary tracking of near-Earth asteroids, comets, and cosmic flight paths.",
      gradeLevel: "All Grades",
      whyTeachersLoveIt: "Connects physics equations to real-life tracking of rocky debris surrounding our orbit.",
      suggestedActivity: "Show the nearest asteroids orbiting near Earth this week."
    },
    {
      title: "Google Sky Maps (The Sky in Google Maps)",
      url: "https://www.google.com/sky/",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Interactive map overlay displaying stars, nebulae, constellations, and Hubble imagery.",
      gradeLevel: "All Grades",
      whyTeachersLoveIt: "Accessible, easy panning celestial atlas mapped seamlessly onto standard coordinates.",
      suggestedActivity: "Search and zoom in on spectacular distant galaxies or constellations like Orion."
    },
    {
      title: "PhET Interactive Science & Math Simulations",
      url: "https://phet.colorado.edu",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Interactive Simulator",
      description: "Vibrant, research-backed simulations spanning physics, mechanics, chemical equations, and climate science, with hands-on variable sliders.",
      gradeLevel: "Grade 5-12",
      whyTeachersLoveIt: "Allows pupils to perform safe virtual experiments, test variables, and visualize invisible concepts instantaneously.",
      suggestedActivity: "Allow students 15 minutes of free inquiry play on the simulator, followed by guided exercises changing single variables."
    },
    {
      title: "Khan Academy Interactive Practice Exercises",
      url: "https://www.khanacademy.org",
      category: "STEM (Science, Tech, Engineering, Math)",
      type: "Reference Site",
      description: "Self-paced study platform featuring curriculum-aligned mathematics paths, physics lectures, biology cells, and real-time feedback questions.",
      gradeLevel: "All Grades (K-12)",
      whyTeachersLoveIt: "Personalized dashboard that automatically detects and targets conceptual gaps with adaptive exercises.",
      suggestedActivity: "Project a Khan Academy practice module to solve together as a whole-class warm-up activity."
    },
    {
      title: "BBC Bitesize Study Guides & revision (BBC Bitesize Active Learning)",
      url: "https://www.bbc.co.uk/bitesize",
      category: "Languages & Literacy / Humanities",
      type: "Reference Site",
      description: "Rich, interactive study summaries, quick-check quizzes, and educational animations for history, geography, and languages.",
      gradeLevel: "Grade 1-10",
      whyTeachersLoveIt: "Extremely child-safe language with high-impact color-coded graphics and summaries.",
      suggestedActivity: "Use the bitesize 5-question review quiz as an exit ticket session to wrap up class instruction."
    },
    {
      title: "British Council LearnEnglish Activities (British Council English & EAL)",
      url: "https://learnenglishkids.britishcouncil.org",
      category: "Languages & Literacy",
      type: "Worksheet",
      description: "High-quality language worksheets, printable grammar guides, flashcards, short animated stories, and audio activities for EAL/ESL learners.",
      gradeLevel: "K-12 (EAL Learners)",
      whyTeachersLoveIt: "Invaluable support for multi-language classrooms with structured phonics guides and interactive sentence builders.",
      suggestedActivity: "Print the targeted vocabulary flashcards to support students who are learning English as an additional language."
    },
    {
      title: "Edutopia Creative Strategies",
      url: "https://www.edutopia.org",
      category: "Other / General",
      type: "Lesson Plan",
      description: "Inspirational, evidence-based classroom practices, cooperative learning methodologies, and project-based learning design guides.",
      gradeLevel: "All Grades (K-12)",
      whyTeachersLoveIt: "A goldmine of real-world classroom videos, behavioral management strategies, and innovative pedagogical frameworks.",
      suggestedActivity: "Review the project-based learning checklist to structure your next multi-disciplinary unit."
    },
    {
      title: "CAST Universal Design for Learning Guidelines (UDL Inclusive Frameworks)",
      url: "https://udlguidelines.cast.org",
      category: "Inclusion & SEN Adaptations",
      type: "Lesson Plan",
      description: "A comprehensive framework and practical strategy database to optimize teaching and learning for all learners based on scientific insights.",
      gradeLevel: "All Grades (K-12)",
      whyTeachersLoveIt: "Provides concrete options for representation, expression, and engagement to support diverse student needs.",
      suggestedActivity: "Use the engagement guidelines checklist to add two alternative choices for students to express their understanding in this lesson."
    }
  ];

  let results = allResources;

  // 1. Filter by subject focus
  if (cleanSubject !== 'All Subjects') {
    const lowerSub = cleanSubject.toLowerCase();
    results = results.filter(res => {
      const cat = res.category.toLowerCase();
      if (lowerSub.includes('stem') && (cat.includes('stem') || cat.includes('science') || cat.includes('math'))) return true;
      if (lowerSub.includes('language') && (cat.includes('language') || cat.includes('literacy'))) return true;
      if (lowerSub.includes('humanities') && (cat.includes('humanities') || cat.includes('social'))) return true;
      if (lowerSub.includes('early') && (cat.includes('early') || cat.includes('childhood'))) return true;
      if (lowerSub.includes('arts') && (cat.includes('arts') || cat.includes('sports') || cat.includes('creative'))) return true;
      if (lowerSub.includes('inclusion') && (cat.includes('inclusion') || cat.includes('sen'))) return true;
      if (lowerSub.includes('technical') && cat.includes('technical')) return true;
      return cat.includes(lowerSub);
    });
  }

  // 2. Filter by resource format/type
  if (cleanType !== 'All') {
    results = results.filter(res => res.type.toLowerCase().includes(cleanType.toLowerCase()));
  }

  // 3. Filter by search query if any
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    const queryResults = results.filter(res => 
      res.title.toLowerCase().includes(q) ||
      res.description.toLowerCase().includes(q) ||
      res.whyTeachersLoveIt.toLowerCase().includes(q) ||
      res.suggestedActivity.toLowerCase().includes(q) ||
      res.category.toLowerCase().includes(q) ||
      res.type.toLowerCase().includes(q)
    );
    if (queryResults.length > 0) {
      results = queryResults;
    } else {
      // If no perfect match within subject/type, search globally across all resources
      results = allResources.filter(res => 
        res.title.toLowerCase().includes(q) ||
        res.description.toLowerCase().includes(q) ||
        res.whyTeachersLoveIt.toLowerCase().includes(q) ||
        res.suggestedActivity.toLowerCase().includes(q)
      );
    }
  }

  // Slice results to provide a clean and rich layout
  return results.slice(0, 16);
};
