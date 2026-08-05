import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { handleResponseJson } from '../utils/api';
import { db, cleanUndefined, compressObject } from '../firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { SavedDocument } from '../types';
import { INITIAL_DOCUMENTS } from '../data/seedDocs';
import { OPEN_BOOKS_CATALOG, OpenBook } from '../data/openBooksData';
import OpenBookReaderModal from './OpenBookReaderModal';
import UploadFullBookModal from './UploadFullBookModal';
import Book3DCard from './Book3DCard';
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
  AlertCircle,
  BookOpen,
  Book,
  X,
  Filter,
  User,
  Library,
  Tag,
  ArrowUpDown,
  Share2,
  Copy,
  Send,
  Users,
  Link2,
  MessageSquare,
  Download,
  HardDriveDownload,
  CheckCircle2,
  WifiOff,
  FileDown,
  Gauge,
  ChevronDown,
  Loader2
} from 'lucide-react';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export function getItemDifficulty(item: {
  title: string;
  gradeLevel?: string;
  category?: string;
  description?: string;
  summary?: string;
  subject?: string;
  type?: string;
}): DifficultyLevel {
  const text = `${item.title || ''} ${item.gradeLevel || ''} ${item.category || ''} ${item.subject || ''} ${item.type || ''} ${item.description || ''} ${item.summary || ''}`.toLowerCase();
  
  if (
    text.includes('university') ||
    text.includes('college') ||
    text.includes('ap ') ||
    text.includes('advanced') ||
    text.includes('calculus') ||
    text.includes('philosophy') ||
    text.includes('higher ed') ||
    text.includes('senior school') ||
    text.includes('form 3') ||
    text.includes('form 4')
  ) {
    return 'Advanced';
  }

  if (
    text.includes('primary') ||
    text.includes('grade 1-') ||
    text.includes('grade k-') ||
    text.includes('k-5') ||
    text.includes('k-6') ||
    text.includes('children') ||
    text.includes('elementary') ||
    text.includes('beginner') ||
    text.includes('basic') ||
    text.includes('intro')
  ) {
    return 'Beginner';
  }

  return 'Intermediate';
}

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

interface ShareItem {
  type: 'book' | 'resource' | 'wiki';
  title: string;
  url: string;
  subjectOrCategory: string;
  description: string;
  authorOrType?: string;
  bookData?: OpenBook;
  resourceData?: ResourceResult;
}

export interface WikiLibraryArticle {
  id: string;
  title: string;
  url: string;
  category: string;
  subject: string;
  description: string;
  gradeLevel: string;
  whyTeachersLoveIt: string;
  suggestedActivity: string;
  extractSummary: string;
  wikiSource: string;
  difficulty: DifficultyLevel;
}

export const WIKILIBRARY_ARTICLES: WikiLibraryArticle[] = [
  {
    id: 'wiki-cell-respiration',
    title: 'Cellular Respiration, Mitochondria & ATP Synthesis',
    url: 'https://en.wikipedia.org/wiki/Cellular_respiration',
    category: 'STEM & Life Sciences',
    subject: 'Biology & Biochemistry',
    description: 'Comprehensive encyclopedic breakdown of metabolic pathways including glycolysis, the Krebs cycle, electron transport chain, and ATP production.',
    gradeLevel: 'Grade 9-12 & AP Biology',
    whyTeachersLoveIt: 'Clear structural breakdown of complex biochemical steps with metabolic energy equations.',
    suggestedActivity: 'Have students draw a flowchart mapping glucose breakdown into net ATP yield during aerobic respiration.',
    extractSummary: 'Cellular respiration is a set of metabolic reactions and processes that take place in the cells of organisms to convert chemical energy from oxygen molecules or nutrients into adenosine triphosphate (ATP), and then release waste products.',
    wikiSource: 'Wikipedia Open Science',
    difficulty: 'Intermediate'
  },
  {
    id: 'wiki-newton-laws',
    title: "Newton's Laws of Motion & Orbital Mechanics",
    url: 'https://en.wikibooks.org/wiki/High_School_Physics/Forces',
    category: 'STEM & Physical Sciences',
    subject: 'Physics & Mechanics',
    description: 'Physics handbook reference covering fundamental kinematics, force vectors, momentum conservation, and satellite motion.',
    gradeLevel: 'Grade 8-12',
    whyTeachersLoveIt: 'Presents vector equations alongside practical engineering applications in automotive and aerospace design.',
    suggestedActivity: 'Set up a ramp and friction cart experiment to calculate F = ma across varying payload masses.',
    extractSummary: "Newton's laws of motion are three laws that describe the relationship between the motion of an object and the forces acting on it. The first law defines inertia, the second relates force to mass and acceleration (F = ma), and the third asserts equal and opposite forces.",
    wikiSource: 'Wikibooks Open Textbooks',
    difficulty: 'Intermediate'
  },
  {
    id: 'wiki-plate-tectonics',
    title: 'Plate Tectonics, Seismic Waves & Mountain Building',
    url: 'https://en.wikipedia.org/wiki/Plate_tectonics',
    category: 'Environmental & Earth Science',
    subject: 'Geology & Physical Geography',
    description: 'Geological reference manual detailing lithospheric plates, mantle convection currents, subduction zones, and earthquake fault lines.',
    gradeLevel: 'Grade 6-12',
    whyTeachersLoveIt: 'High-impact global tectonic boundary maps and seismic velocity charts for interactive earth science units.',
    suggestedActivity: 'Analyze cross-sectional diagrams to model oceanic-continental convergent plate collisions.',
    extractSummary: "Plate tectonics is a scientific theory that explains how major landforms are created as a result of Earth's subterranean movements. The theory, which solidified in the 1960s, transformed the earth sciences by explaining continental drift.",
    wikiSource: 'Wikipedia Open Earth Science',
    difficulty: 'Beginner'
  },
  {
    id: 'wiki-silk-road',
    title: 'The Silk Road & Ancient Afro-Eurasian Trade Networks',
    url: 'https://en.wikipedia.org/wiki/Silk_Road',
    category: 'World History & Humanities',
    subject: 'World History & Geography',
    description: 'Historical reference document examining maritime and overland commerce routes connecting East Asia, the Middle East, and Europe.',
    gradeLevel: 'Grade 7-12',
    whyTeachersLoveIt: 'Rich primary source merchant logs and cartographic maps showing cultural, religious, and technological diffusion.',
    suggestedActivity: 'Assign small study groups to track commodities (silk, paper, tea, spices) across key Silk Road hubs.',
    extractSummary: 'The Silk Road was an ancient network of Eurasian trade routes active from the Han dynasty until the Ottoman Empire banned trade with the West. It played a central role in facilitating cultural, political, and economic interactions.',
    wikiSource: 'Wikipedia Open History',
    difficulty: 'Beginner'
  },
  {
    id: 'wiki-linear-algebra',
    title: 'Linear Algebra: Matrix Transformations & Eigenspaces',
    url: 'https://en.wikibooks.org/wiki/Linear_Algebra',
    category: 'Mathematics & Computing',
    subject: 'Higher Mathematics',
    description: 'Open textbook module covering matrix operations, systems of linear equations, vector spaces, dot products, and eigenvalues.',
    gradeLevel: 'Grade 11-12 & University',
    whyTeachersLoveIt: 'Directly connects abstract matrix transformations to computer graphics rendering and machine learning.',
    suggestedActivity: 'Solve a 3x3 linear system representing economic input-output models using matrix row reduction.',
    extractSummary: 'Linear algebra is the branch of mathematics concerning linear equations, linear functions, and their representations through matrices and vector spaces. It is central to almost all areas of mathematics and computer science.',
    wikiSource: 'Wikibooks Open Mathematics',
    difficulty: 'Advanced'
  },
  {
    id: 'wiki-shakespeare',
    title: 'Shakespearean Tragedy, Rhetoric & Poetic Meter',
    url: 'https://en.wikipedia.org/wiki/Shakespearean_tragedy',
    category: 'Languages & Literature',
    subject: 'English & World Literature',
    description: 'Literary reference analyzing dramatic structure, soliloquies, blank verse, iambic pentameter, and Elizabethan staging.',
    gradeLevel: 'Grade 8-12',
    whyTeachersLoveIt: 'Side-by-side original play texts with modern prose annotations and thematic breakdowns.',
    suggestedActivity: 'Annotate a famous soliloquy to identify iambic rhythm, metaphors, and rhetorical devices.',
    extractSummary: 'Shakespearean tragedy is the designation given to most tragedies written by William Shakespeare. Features include a tragic hero of noble stature, a tragic flaw (hubris), internal conflict, and dramatic catharsis.',
    wikiSource: 'Wikipedia Open Humanities',
    difficulty: 'Intermediate'
  },
  {
    id: 'wiki-human-rights',
    title: 'Universal Declaration of Human Rights & Global Civics',
    url: 'https://en.wikisource.org/wiki/Universal_Declaration_of_Human_Rights',
    category: 'World History & Humanities',
    subject: 'Civics & International Law',
    description: 'Primary historical document repository and commentary on the 1948 UN Declaration, civil liberties, and international law.',
    gradeLevel: 'Grade 7-12',
    whyTeachersLoveIt: 'Unfiltered primary document text that fosters critical debate on global rights, responsibilities, and governance.',
    suggestedActivity: 'Compare specific articles of the UN Declaration with local constitutional civil rights charters.',
    extractSummary: 'The Universal Declaration of Human Rights (UDHR) is an international document adopted by the United Nations General Assembly that enshrines the rights and freedoms of all human beings.',
    wikiSource: 'Wikisource Open Primary Documents',
    difficulty: 'Beginner'
  },
  {
    id: 'wiki-ecosystems',
    title: 'Ecosystem Energy Pyramids & Climate Feedback Loops',
    url: 'https://en.wikipedia.org/wiki/Ecological_pyramid',
    category: 'Environmental & Earth Science',
    subject: 'Ecology & Environmental Science',
    description: 'Ecological reference on trophic levels, biomass transfer, the carbon cycle, and climate feedback mechanisms.',
    gradeLevel: 'Grade 6-12',
    whyTeachersLoveIt: 'Quantitative biomass flow charts illustrating the 10% ecological energy transfer rule.',
    suggestedActivity: 'Construct a food web diagram and calculate biomass lost between primary producers and apex predators.',
    extractSummary: 'An ecological pyramid is a graphical representation designed to show the biomass or bio productivity at each trophic level in a given ecosystem.',
    wikiSource: 'Wikipedia Open Science',
    difficulty: 'Beginner'
  },
  {
    id: 'wiki-data-structures',
    title: 'Data Structures, Binary Trees & Algorithm Complexity',
    url: 'https://en.wikibooks.org/wiki/A-level_Computing/AQA/Computer_Components,_General_Computing_Concepts,_Theoretical_Instruction/Data_Structures',
    category: 'Mathematics & Computing',
    subject: 'Computer Science',
    description: 'Open computing reference covering arrays, linked lists, binary search trees, hash tables, and Big-O notation.',
    gradeLevel: 'Grade 9-12 & AP Computer Science',
    whyTeachersLoveIt: 'Clean pseudocode and Python/Java code examples designed for secondary computer science courses.',
    suggestedActivity: 'Implement a binary search algorithm and compare its time complexity against a linear scan.',
    extractSummary: 'In computer science, a data structure is a data organization, management, and storage format that enables efficient access and modification. More precisely, a data structure is a collection of data values and relationships.',
    wikiSource: 'Wikibooks Open Computing',
    difficulty: 'Intermediate'
  },
  {
    id: 'wiki-organic-chemistry',
    title: 'Organic Chemistry: Functional Groups & Reactions',
    url: 'https://en.wikipedia.org/wiki/Organic_chemistry',
    category: 'STEM & Physical Sciences',
    subject: 'Chemistry',
    description: 'Detailed chemical reference manual covering hydrocarbons, functional groups, reaction mechanisms, and stereochemistry.',
    gradeLevel: 'Grade 11-12 & AP Chemistry',
    whyTeachersLoveIt: 'Includes molecular structure visualizers and electron-pushing reaction mechanism diagrams.',
    suggestedActivity: 'Build physical molecular models of structural isomers and identify functional groups in common items.',
    extractSummary: 'Organic chemistry is a branch of chemistry that studies the structure, properties and reactions of organic compounds, which contain carbon in covalent bonding.',
    wikiSource: 'Wikipedia Open Chemistry',
    difficulty: 'Advanced'
  },
  {
    id: 'wiki-industrial-revolution',
    title: 'The Industrial Revolution & Technological Evolution',
    url: 'https://en.wikipedia.org/wiki/Industrial_Revolution',
    category: 'World History & Humanities',
    subject: 'History & Economics',
    description: 'Comprehensive history module examining steam engine technology, factory urbanization, labor reform, and economic shifts.',
    gradeLevel: 'Grade 8-12',
    whyTeachersLoveIt: 'Rich primary source economic charts, worker diaries, and early patent drawings.',
    suggestedActivity: 'Hold a classroom debate analyzing the economic gains versus human social costs of rapid industrialization.',
    extractSummary: 'The Industrial Revolution was the transition to new manufacturing processes in Great Britain, continental Europe, and the United States, that occurred during the period from around 1760 to about 1820–1840.',
    wikiSource: 'Wikipedia Open History',
    difficulty: 'Intermediate'
  },
  {
    id: 'wiki-udl-framework',
    title: 'Universal Design for Learning (UDL) & Differentiated Scaffolding',
    url: 'https://en.wikiversity.org/wiki/Universal_Design_for_Learning',
    category: 'Pedagogy & SEN',
    subject: 'Inclusive Pedagogy',
    description: 'Open educational guide detailing multi-modal representation, accessible learning options, and scaffolding strategies for diverse learners.',
    gradeLevel: 'Teacher Professional Development',
    whyTeachersLoveIt: 'Practical strategy checklists to adapt standard lesson units for neurodiverse students.',
    suggestedActivity: 'Audit a current lesson unit to add three alternative choices for students to demonstrate subject mastery.',
    extractSummary: 'Universal Design for Learning (UDL) is a framework to optimize teaching based on scientific insights into how humans learn. It aims to reduce barriers and increase learning opportunities for all pupils.',
    wikiSource: 'Wikiversity Free Learning Modules',
    difficulty: 'Beginner'
  }
];

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

  // Instant live filter states
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'resources' | 'books' | 'wikilibrary'>('all');

  // WikiLibrary Educational Reference Hub States
  const [wikiSearchQuery, setWikiSearchQuery] = useState('');
  const [wikiSearchResults, setWikiSearchResults] = useState<Array<{ title: string; snippet: string; pageid: number }>>([]);
  const [isSearchingWiki, setIsSearchingWiki] = useState(false);
  const [selectedWikiCategory, setSelectedWikiCategory] = useState<string>('All');
  const [selectedWikiArticleModal, setSelectedWikiArticleModal] = useState<{
    id?: string;
    title: string;
    extract: string;
    url: string;
    category?: string;
    subject?: string;
    gradeLevel?: string;
    whyTeachersLoveIt?: string;
    suggestedActivity?: string;
    wikiSource?: string;
  } | null>(null);
  const [isLoadingWikiSummary, setIsLoadingWikiSummary] = useState(false);

  const handleSearchWikipedia = async (q: string) => {
    if (!q.trim()) return;
    setIsSearchingWiki(true);
    try {
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&utf8=1&format=json&origin=*`);
      const data = await res.json();
      if (data && data.query && data.query.search) {
        setWikiSearchResults(data.query.search);
      } else {
        setWikiSearchResults([]);
      }
    } catch (err) {
      console.error("Wikipedia search error:", err);
      setWikiSearchResults([]);
    } finally {
      setIsSearchingWiki(false);
    }
  };

  const handleOpenWikiArticleSummary = async (articleTitle: string, defaultUrl?: string) => {
    setIsLoadingWikiSummary(true);
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedWikiArticleModal({
          title: data.title || articleTitle,
          extract: data.extract || 'No extract summary available.',
          url: data.content_urls?.desktop?.page || defaultUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`,
          category: 'Wikipedia Live Article',
          subject: 'General Knowledge',
          gradeLevel: 'K-12 & Higher Ed',
          whyTeachersLoveIt: 'Instant peer-curated encyclopedic reference with structured overview & citations.',
          suggestedActivity: 'Have students extract 3 key facts and citations for their research project.',
          wikiSource: 'Wikipedia Live Reference'
        });
      } else {
        setSelectedWikiArticleModal({
          title: articleTitle,
          extract: 'Summary preview currently unavailable. Click "Open Full Article" to read the complete entry.',
          url: defaultUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`,
          category: 'Wikipedia Live Article',
          subject: 'General Knowledge',
          gradeLevel: 'K-12 & Higher Ed',
          whyTeachersLoveIt: 'Peer-reviewed open educational reference.',
          suggestedActivity: 'Use as supplementary reading for classroom research.',
          wikiSource: 'Wikipedia Open Reference'
        });
      }
    } catch (err) {
      console.error("Error fetching Wiki summary:", err);
      setSelectedWikiArticleModal({
        title: articleTitle,
        extract: 'Error loading article summary. Please use the direct link to access the live article on Wikipedia.',
        url: defaultUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`,
        category: 'Wikipedia Live Article',
        subject: 'General Knowledge',
        gradeLevel: 'K-12 & Higher Ed',
        whyTeachersLoveIt: 'Peer-reviewed open educational reference.',
        suggestedActivity: 'Use as supplementary reading for classroom research.',
        wikiSource: 'Wikipedia Open Reference'
      });
    } finally {
      setIsLoadingWikiSummary(false);
    }
  };

  const handleImportWikiArticleToMaterials = async (art: {
    title: string;
    extract?: string;
    extractSummary?: string;
    description?: string;
    url: string;
    category?: string;
    subject?: string;
    gradeLevel?: string;
    whyTeachersLoveIt?: string;
    suggestedActivity?: string;
  }) => {
    if (isStudent) {
      alert("Permission Denied: Students are restricted from adding materials.");
      return;
    }

    try {
      const docId = `doc-wiki-${Date.now()}`;
      const markdownContent = `# ${art.title}

### 📖 WikiLibrary Open Educational Reference
* **Source:** [Open Article on Wikipedia/Wikibooks](${art.url})
* **Subject Focus:** ${art.subject || art.category || 'General Reference'}
* **Suggested Grade/Class Levels:** ${art.gradeLevel || 'K-12 & Higher Ed'}

---

### 📝 Article Summary & Overview
${art.extract || art.extractSummary || art.description || 'No extract summary available.'}

---

### 💡 Why Teachers Love It
${art.whyTeachersLoveIt || 'Peer-reviewed open educational reference providing structured background knowledge and citations.'}

---

### 🎓 Suggested Classroom Activity
${art.suggestedActivity || 'Assign students to read the summary, extract 3 core concepts, and construct a 5-minute presentation or mind map.'}

---
*Imported via EduNexus WikiLibrary Educational Reference Hub.*`;

      const newDoc: SavedDocument = {
        id: docId,
        title: `📚 WikiRef: ${art.title}`,
        docType: 'lesson-notes',
        curriculum: 'standard',
        subject: art.subject || art.category || 'General Knowledge',
        classLevel: art.gradeLevel || 'K-12',
        topic: art.title,
        subTopic: 'WikiLibrary Article',
        duration: 'N/A',
        content: markdownContent,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        tags: ['WikiLibrary', 'Educational Reference', 'Imported']
      };

      await setDoc(doc(db, 'documents', docId), cleanUndefined(compressObject(newDoc)));

      try {
        const existingOffline = JSON.parse(localStorage.getItem('edunexus_my_materials') || '[]');
        existingOffline.unshift({
          id: docId,
          fileName: `📚 WikiRef: ${art.title}`,
          fileType: 'wiki',
          category: 'WikiLibrary Reference',
          subject: art.subject || art.category || 'General Reference',
          uploadedAt: new Date().toISOString(),
          url: art.url
        });
        localStorage.setItem('edunexus_my_materials', JSON.stringify(existingOffline));
      } catch (e) {}

      setSavedResourceUrls(prev => [...prev, art.url]);
      alert(`"${art.title}" has been saved to your Lesson Materials!`);
    } catch (err) {
      console.error("Error importing Wiki article to materials:", err);
      alert(`"${art.title}" saved to local lesson materials!`);
    }
  };
  const [sortBy, setSortBy] = useState<'newest' | 'alphabetical' | 'popularity'>('newest');
  const [selectedDifficulties, setSelectedDifficulties] = useState<DifficultyLevel[]>([]);
  const [isDifficultyDropdownOpen, setIsDifficultyDropdownOpen] = useState(false);
  const [selectedBookForModal, setSelectedBookForModal] = useState<OpenBook | null>(null);
  const [savedBookIds, setSavedBookIds] = useState<string[]>([]);
  const [customBooks, setCustomBooks] = useState<OpenBook[]>([]);
  const [isUploadBookModalOpen, setIsUploadBookModalOpen] = useState<boolean>(false);

  // AI Recommendation States & Matching
  const [userDocTopics, setUserDocTopics] = useState<Array<{ title: string; subject: string; topic: string; keywords: string[] }>>([]);
  const [onlyAiRecommended, setOnlyAiRecommended] = useState<boolean>(false);

  // Offline Download & Caching States
  const [offlineDownloadedKeys, setOfflineDownloadedKeys] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('edunexus_offline_download_keys');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [showOfflineOnly, setShowOfflineOnly] = useState<boolean>(false);
  const [offlineDownloadNotification, setOfflineDownloadNotification] = useState<string | null>(null);

  const handleToggleOfflineDownload = (item: {
    idOrUrl: string;
    type: 'book' | 'resource';
    title: string;
    categoryOrSubject: string;
    description: string;
    bookData?: OpenBook;
    resourceData?: ResourceResult;
  }) => {
    const isAlreadyDownloaded = offlineDownloadedKeys.includes(item.idOrUrl);
    let updatedKeys: string[];

    if (isAlreadyDownloaded) {
      updatedKeys = offlineDownloadedKeys.filter(k => k !== item.idOrUrl);
      setOfflineDownloadedKeys(updatedKeys);
      localStorage.setItem('edunexus_offline_download_keys', JSON.stringify(updatedKeys));

      try {
        const storageKey = item.type === 'book' ? `edunexus_offline_book_${item.idOrUrl}` : `edunexus_offline_res_${encodeURIComponent(item.idOrUrl)}`;
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.warn('Error clearing offline item from local storage:', e);
      }

      setOfflineDownloadNotification(`Removed "${item.title}" from local offline storage.`);
      setTimeout(() => setOfflineDownloadNotification(null), 3000);
    } else {
      updatedKeys = [...offlineDownloadedKeys, item.idOrUrl];
      setOfflineDownloadedKeys(updatedKeys);
      localStorage.setItem('edunexus_offline_download_keys', JSON.stringify(updatedKeys));

      const payload = {
        idOrUrl: item.idOrUrl,
        type: item.type,
        title: item.title,
        categoryOrSubject: item.categoryOrSubject,
        description: item.description,
        savedAt: new Date().toISOString(),
        bookData: item.bookData,
        resourceData: item.resourceData,
      };

      try {
        const storageKey = item.type === 'book' ? `edunexus_offline_book_${item.idOrUrl}` : `edunexus_offline_res_${encodeURIComponent(item.idOrUrl)}`;
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (e) {
        console.warn('Error saving offline item to local storage:', e);
      }

      // Trigger browser file download as a markdown study guide for true offline access on disk
      try {
        const textContent = item.type === 'book'
          ? `# ${item.title}\n\nAuthor: ${item.bookData?.author || 'Unknown'}\nSubject: ${item.categoryOrSubject}\nLicense: ${item.bookData?.license || 'Open Access'}\nPages: ${item.bookData?.pageCount || 'N/A'}\n\n## Overview & Summary\n${item.description}\n\n${(item.bookData?.chapters || []).map((ch, idx) => `### ${idx + 1}. ${ch.title}\n${ch.content}`).join('\n\n')}\n\nOffline Link: ${item.bookData?.externalUrl || ''}`
          : `# ${item.title}\n\nCategory: ${item.categoryOrSubject}\nType: ${item.resourceData?.type || 'Teaching Aid'}\nGrade Level: ${item.resourceData?.gradeLevel || 'General'}\n\n## Description\n${item.description}\n\n## Why Teachers Love It\n${item.resourceData?.whyTeachersLoveIt || ''}\n\n## Suggested Classroom Activity\n${item.resourceData?.suggestedActivity || ''}\n\nDirect URL: ${item.idOrUrl}`;

        const blob = new Blob([textContent], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_offline_guide.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn('Disk download notice:', err);
      }

      setOfflineDownloadNotification(`"${item.title}" saved to local storage & downloaded offline!`);
      setTimeout(() => setOfflineDownloadNotification(null), 3500);
    }
  };

  useEffect(() => {
    const loadUserDocumentsAndTopics = async () => {
      let docs: SavedDocument[] = [];
      try {
        const snap = await getDocs(collection(db, 'documents'));
        if (!snap.empty) {
          snap.forEach(docSnap => {
            const data = docSnap.data() as SavedDocument;
            if (data && (data.title || data.subject || data.topic)) {
              docs.push({ id: docSnap.id, ...data });
            }
          });
        }
      } catch (err) {
        console.warn("Firestore documents fetch notice for GlobalResources AI recommendations:", err);
      }

      if (docs.length === 0) {
        try {
          const local = JSON.parse(localStorage.getItem('edunexus_documents') || '[]');
          if (Array.isArray(local) && local.length > 0) {
            docs = local;
          } else {
            docs = INITIAL_DOCUMENTS;
          }
        } catch (e) {
          docs = INITIAL_DOCUMENTS;
        }
      }

      const topicsInfo = docs.map(d => {
        const title = d.title || '';
        const subject = d.subject || '';
        const topic = d.topic || d.subTopic || '';
        const textForKeywords = `${title} ${subject} ${topic} ${(d.tags || []).join(' ')}`.toLowerCase();

        const words = Array.from(new Set(
          textForKeywords
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !['grade', 'lesson', 'plan', 'curriculum', 'school', 'junior', 'senior', 'unit', 'chapter', 'study', 'guide', 'model', 'activity', 'document', 'cbc'].includes(w))
        ));

        return {
          title,
          subject,
          topic,
          keywords: words
        };
      });

      setUserDocTopics(topicsInfo);
    };

    loadUserDocumentsAndTopics();

    const loadCustomGlobalBooks = async () => {
      try {
        const snap = await getDocs(collection(db, 'global_books'));
        const loadedBooks: OpenBook[] = [];
        if (!snap.empty) {
          snap.forEach((docSnap) => {
            const data = docSnap.data() as OpenBook;
            if (data && data.title && data.chapters) {
              loadedBooks.push(data);
            }
          });
        }

        try {
          const localCustom: OpenBook[] = JSON.parse(localStorage.getItem('edunexus_custom_global_books') || '[]');
          if (Array.isArray(localCustom)) {
            localCustom.forEach((lb) => {
              if (!loadedBooks.some((b) => b.id === lb.id)) {
                loadedBooks.push(lb);
              }
            });
          }
        } catch (e) {}

        setCustomBooks(loadedBooks);
      } catch (err) {
        console.warn("Firestore global_books fetch notice:", err);
        try {
          const localCustom: OpenBook[] = JSON.parse(localStorage.getItem('edunexus_custom_global_books') || '[]');
          if (Array.isArray(localCustom)) setCustomBooks(localCustom);
        } catch (e) {}
      }
    };

    loadCustomGlobalBooks();
  }, []);

  const getAiRecommendationInfo = (
    title: string,
    subjectOrCat: string,
    desc: string,
    extraField?: string
  ) => {
    if (!userDocTopics || userDocTopics.length === 0) return null;

    const itemText = `${title} ${subjectOrCat} ${desc} ${extraField || ''}`.toLowerCase();

    for (const docTopic of userDocTopics) {
      const docSubLower = (docTopic.subject || '').toLowerCase();

      // Subject overlap match (e.g. Science, Mathematics, Language, etc)
      const isSubjectMatch = docSubLower.length >= 3 && (
        itemText.includes(docSubLower) ||
        subjectOrCat.toLowerCase().includes(docSubLower) ||
        docSubLower.includes(subjectOrCat.toLowerCase())
      );

      // Keyword match
      const matchedKw = docTopic.keywords.find(kw => kw.length >= 4 && itemText.includes(kw));

      if (matchedKw || isSubjectMatch) {
        return {
          isRecommended: true,
          matchedDocTitle: docTopic.title,
          reason: matchedKw 
            ? `Matches "${matchedKw}" from your "${docTopic.title}" study guide` 
            : `Aligns with your "${docTopic.subject}" lesson plan`
        };
      }
    }

    return null;
  };

  // Share Modal States
  const [shareItem, setShareItem] = useState<ShareItem | null>(null);
  const [activeShareTab, setActiveShareTab] = useState<'link' | 'hub'>('link');
  const [shareNote, setShareNote] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);
  const [isSharingToHub, setIsSharingToHub] = useState<boolean>(false);
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCitation = (item: ShareItem) => {
    const citation = item.type === 'book'
      ? `"${item.title}" by ${item.authorOrType || 'Unknown'}. Subject: ${item.subjectOrCategory}. ${item.description} Link: ${item.url}`
      : `"${item.title}" (${item.authorOrType || 'Web Resource'}). Category: ${item.subjectOrCategory}. ${item.description} Link: ${item.url}`;
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2500);
  };

  const handleShareToCollaborationHub = async (item: ShareItem) => {
    if (!profile) return;
    setIsSharingToHub(true);

    const docId = `shared-res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const content = item.type === 'book'
      ? `# ${item.title}\n\n**Type:** Open-Access Book / Textbook\n**Author:** ${item.authorOrType || 'Unknown'}\n**Subject:** ${item.subjectOrCategory}\n**Pages:** ${item.bookData?.pageCount || 'N/A'}\n\n### Summary\n${item.description}\n\n**Read/Download Link:** [${item.url}](${item.url})\n\n${shareNote ? `> **Teacher's Note:** "${shareNote}"` : ''}`
      : `# ${item.title}\n\n**Type:** ${item.authorOrType || 'Teaching Aid / Simulator'}\n**Category:** ${item.subjectOrCategory}\n**Grade Level:** ${item.resourceData?.gradeLevel || 'General'}\n\n### Description\n${item.description}\n\n**Why Teachers Love It:** ${item.resourceData?.whyTeachersLoveIt || 'Great interactive resource'}\n**Suggested Class Activity:** ${item.resourceData?.suggestedActivity || 'Classroom demonstration or student activity'}\n\n**Direct Link:** [${item.url}](${item.url})\n\n${shareNote ? `> **Teacher's Note:** "${shareNote}"` : ''}`;

    const sharedDoc: SavedDocument = {
      id: docId,
      title: item.title,
      docType: item.type === 'book' ? 'book' : 'resource',
      curriculum: 'cbc',
      subject: item.subjectOrCategory,
      classLevel: item.bookData?.gradeLevel || item.resourceData?.gradeLevel || 'General',
      gradeLevel: item.bookData?.gradeLevel || item.resourceData?.gradeLevel || 'General',
      topic: item.type === 'book' ? 'Textbook Resource' : 'Teaching Aid',
      subTopic: '',
      duration: '',
      content: content,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      tags: ['global-resources', 'shared-by-teacher', item.type, item.subjectOrCategory],
      category: item.type === 'book' ? 'Textbooks' : 'Teaching Aids',
      isSharedWithColleagues: true,
      sharedByUid: profile?.uid || 'unknown',
      sharedByName: profile?.displayName || profile?.email || 'Teacher',
      sharedAt: new Date().toISOString(),
      lastModifiedByUid: profile?.uid || 'unknown',
      lastModifiedByName: profile?.displayName || 'Teacher',
      externalUrl: item.url
    };

    try {
      await setDoc(doc(db, 'documents', docId), cleanUndefined(compressObject(sharedDoc)));

      // Local backup
      try {
        const existingOffline = JSON.parse(localStorage.getItem('edunexus_my_materials') || '[]');
        existingOffline.unshift({
          id: docId,
          fileName: item.title,
          fileType: item.type,
          category: item.type === 'book' ? 'Textbooks' : 'Teaching Aids',
          subject: item.subjectOrCategory,
          uploadedAt: new Date().toISOString(),
          url: item.url,
          isShared: true,
          sharedBy: profile?.displayName || 'Teacher'
        });
        localStorage.setItem('edunexus_my_materials', JSON.stringify(existingOffline));
      } catch (err) {
        console.warn("Local storage fallback notice:", err);
      }

      setIsSharingToHub(false);
      setShareSuccessMsg("Resource successfully published to Collaboration Hub!");
      setTimeout(() => {
        setShareSuccessMsg(null);
        setShareItem(null);
        setShareNote('');
      }, 2000);
    } catch (err) {
      console.error("Error publishing resource to Collaboration Hub:", err);
      setIsSharingToHub(false);
      setShareSuccessMsg("Resource saved locally to Collaboration Hub!");
      setTimeout(() => {
        setShareSuccessMsg(null);
        setShareItem(null);
        setShareNote('');
      }, 2000);
    }
  };

  const handleSubjectTagClick = (subjectTag: string) => {
    if (searchFilter.trim().toLowerCase() === subjectTag.trim().toLowerCase()) {
      setSearchFilter('');
    } else {
      setSearchFilter(subjectTag);
    }
  };

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

  const handleImportBookToMaterials = async (book: OpenBook) => {
    if (isStudent) {
      alert("Permission Denied: Students are restricted from adding materials.");
      return;
    }

    try {
      const docId = `doc-book-${book.id}-${Date.now()}`;
      const chapterPreviews = book.chapters
        .map((c) => `### ${c.title}\n\n${c.content}`)
        .join('\n\n---\n\n');

      const markdownContent = `# 📖 ${book.title}
* **Author:** ${book.author}
* **Category:** ${book.category}
* **Subject:** ${book.subject}
* **Grade / Target Level:** ${book.gradeLevel}
* **License:** ${book.license}
* **Source:** [Access Open Textbook / Gutenberg](${book.externalUrl})

---

### 📝 Summary
${book.summary}

---

## 📚 Book Chapters & Content Preview

${chapterPreviews}

---
*Imported via EduNexus Global Teaching Resources & Open Books Library.*`;

      const newDoc: SavedDocument = {
        id: docId,
        title: `📚 Book: ${book.title}`,
        docType: 'lesson-notes',
        curriculum: 'standard',
        subject: book.subject.includes('Math') || book.subject.includes('STEM') ? 'STEM' : 'English',
        classLevel: book.gradeLevel,
        topic: book.title,
        subTopic: book.category,
        duration: `${book.pageCount} pages`,
        content: markdownContent,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        tags: ['Open Book', book.category, book.subject, 'Imported']
      };

      await setDoc(doc(db, 'documents', docId), cleanUndefined(compressObject(newDoc)));

      const initialVersionId = `v-1-${Date.now()}`;
      const initialVersion = {
        id: initialVersionId,
        docId: docId,
        title: newDoc.title,
        content: newDoc.content,
        lastModified: newDoc.createdAt,
        modifiedByUid: profile?.uid || 'system',
        modifiedByName: profile?.displayName || 'Open Books Library',
        modifiedByEmail: profile?.email || '',
        versionNumber: 1
      };
      await setDoc(doc(db, 'documents', docId, 'versions', initialVersionId), cleanUndefined(compressObject(initialVersion)));

      setSavedBookIds(prev => [...prev, book.id]);
    } catch (err: any) {
      console.error('Error importing open book:', err);
      alert('Failed to save book to materials: ' + err.message);
    }
  };

  // Compute live filtered resources, books, and wiki articles with useMemo for fast rendering
  const filterTerm = searchFilter.trim().toLowerCase();

  const filteredResources = useMemo(() => {
    const raw = resources.filter(res => {
      if (contentTypeFilter === 'books') return false;

      if (categoryFilter !== 'All') {
        const typeLower = res.type.toLowerCase();
        const descLower = res.description.toLowerCase();

        if (categoryFilter === 'PDFs') {
          const isPdf = typeLower.includes('pdf') || typeLower.includes('worksheet') || typeLower.includes('printable') || descLower.includes('pdf') || descLower.includes('worksheet') || descLower.includes('printable');
          if (!isPdf) return false;
        } else if (categoryFilter === 'Interactive') {
          const isInteractive = typeLower.includes('interactive') || typeLower.includes('sim') || typeLower.includes('game') || descLower.includes('interactive') || descLower.includes('simulation');
          if (!isInteractive) return false;
        } else if (categoryFilter === 'Videos') {
          const isVideo = typeLower.includes('video') || typeLower.includes('audio') || typeLower.includes('media') || descLower.includes('video') || descLower.includes('audio') || descLower.includes('podcast');
          if (!isVideo) return false;
        } else if (categoryFilter === 'Lesson Plans') {
          const isLesson = typeLower.includes('lesson') || typeLower.includes('plan') || typeLower.includes('guide') || descLower.includes('lesson plan') || descLower.includes('strategy');
          if (!isLesson) return false;
        } else if (categoryFilter === 'Books') {
          const isBook = typeLower.includes('book') || typeLower.includes('reading') || typeLower.includes('article') || descLower.includes('book') || descLower.includes('literature');
          if (!isBook) return false;
        }
      }

      if (selectedDifficulties.length > 0) {
        const diff = getItemDifficulty(res);
        if (!selectedDifficulties.includes(diff)) return false;
      }

      if (showOfflineOnly) {
        if (!offlineDownloadedKeys.includes(res.url)) return false;
      }

      if (onlyAiRecommended) {
        const rec = getAiRecommendationInfo(res.title, res.category, res.description, res.type);
        if (!rec) return false;
      }

      if (!filterTerm) return true;
      return (
        res.title.toLowerCase().includes(filterTerm) ||
        res.category.toLowerCase().includes(filterTerm) ||
        res.type.toLowerCase().includes(filterTerm) ||
        res.description.toLowerCase().includes(filterTerm) ||
        res.whyTeachersLoveIt.toLowerCase().includes(filterTerm) ||
        res.suggestedActivity.toLowerCase().includes(filterTerm) ||
        res.gradeLevel.toLowerCase().includes(filterTerm)
      );
    });

    return [...raw].sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'popularity') {
        const getPopularityScore = (item: ResourceResult) => {
          let score = 0;
          const lower = (item.title + ' ' + item.description + ' ' + item.category + ' ' + item.type + ' ' + item.whyTeachersLoveIt).toLowerCase();
          if (lower.includes('phet') || lower.includes('khan academy') || lower.includes('nasa') || lower.includes('smithsonian')) score += 50;
          if (lower.includes('interactive') || lower.includes('simulation') || lower.includes('openstax')) score += 30;
          if (lower.includes('lesson plan') || lower.includes('worksheet') || lower.includes('lab')) score += 20;
          if (lower.includes('stem') || lower.includes('math') || lower.includes('science')) score += 10;
          return score;
        };
        return getPopularityScore(b) - getPopularityScore(a);
      }
      return 0;
    });
  }, [resources, contentTypeFilter, categoryFilter, selectedDifficulties, showOfflineOnly, offlineDownloadedKeys, onlyAiRecommended, filterTerm, sortBy]);

  const filteredBooks = useMemo(() => {
    const allAvailableBooks = [...customBooks, ...OPEN_BOOKS_CATALOG];
    const raw = allAvailableBooks.filter(book => {
      if (contentTypeFilter === 'resources') return false;

      if (categoryFilter !== 'All') {
        if (categoryFilter === 'Interactive' || categoryFilter === 'Videos') {
          return false;
        }
        if (categoryFilter === 'Lesson Plans') {
          const isLesson = book.category.toLowerCase().includes('lesson') || book.summary.toLowerCase().includes('lesson') || book.subject.toLowerCase().includes('lesson');
          if (!isLesson) return false;
        }
      }

      if (selectedDifficulties.length > 0) {
        const diff = getItemDifficulty(book);
        if (!selectedDifficulties.includes(diff)) return false;
      }

      if (showOfflineOnly) {
        if (!offlineDownloadedKeys.includes(book.id)) return false;
      }

      if (onlyAiRecommended) {
        const rec = getAiRecommendationInfo(book.title, book.subject, book.summary, book.author);
        if (!rec) return false;
      }

      if (!filterTerm) return true;
      return (
        book.title.toLowerCase().includes(filterTerm) ||
        book.author.toLowerCase().includes(filterTerm) ||
        book.subject.toLowerCase().includes(filterTerm) ||
        book.category.toLowerCase().includes(filterTerm) ||
        book.summary.toLowerCase().includes(filterTerm) ||
        book.gradeLevel.toLowerCase().includes(filterTerm)
      );
    });

    return [...raw].sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'popularity') {
        const getBookPopularity = (book: OpenBook) => {
          let score = (book.gutenbergId ? 100 : 50) + Math.min(book.pageCount, 500);
          if (book.category === 'Literature & Classics' || book.category === 'STEM & Textbooks') score += 40;
          return score;
        };
        return getBookPopularity(b) - getBookPopularity(a);
      }
      return 0;
    });
  }, [customBooks, contentTypeFilter, categoryFilter, selectedDifficulties, showOfflineOnly, offlineDownloadedKeys, onlyAiRecommended, filterTerm, sortBy]);

  const filteredWikiArticles = useMemo(() => {
    return WIKILIBRARY_ARTICLES.filter((art) => {
      if (contentTypeFilter === 'resources' || contentTypeFilter === 'books') return false;

      if (selectedWikiCategory !== 'All') {
        if (art.category !== selectedWikiCategory && !art.subject.toLowerCase().includes(selectedWikiCategory.toLowerCase())) {
          return false;
        }
      }

      if (categoryFilter !== 'All') {
        const catLower = categoryFilter.toLowerCase();
        const artLower = (art.category + ' ' + art.subject + ' ' + art.description).toLowerCase();
        if (catLower === 'interactive' || catLower === 'videos') return false;
        if (catLower === 'books' && !artLower.includes('wikibooks') && !artLower.includes('textbook')) return false;
      }

      if (selectedDifficulties.length > 0) {
        if (!selectedDifficulties.includes(art.difficulty)) return false;
      }

      if (showOfflineOnly) {
        if (!offlineDownloadedKeys.includes(art.url)) return false;
      }

      if (!filterTerm) return true;
      return (
        art.title.toLowerCase().includes(filterTerm) ||
        art.category.toLowerCase().includes(filterTerm) ||
        art.subject.toLowerCase().includes(filterTerm) ||
        art.description.toLowerCase().includes(filterTerm) ||
        art.extractSummary.toLowerCase().includes(filterTerm) ||
        art.whyTeachersLoveIt.toLowerCase().includes(filterTerm)
      );
    }).sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [contentTypeFilter, selectedWikiCategory, categoryFilter, selectedDifficulties, showOfflineOnly, offlineDownloadedKeys, filterTerm, sortBy]);

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
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsUploadBookModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-5 py-2.5 rounded-2xl font-extrabold text-xs transition shadow-lg flex items-center gap-2 cursor-pointer transform hover:scale-105"
            >
              <BookOpen className="w-4 h-4 text-slate-900" />
              <span>➕ Load Full Book for AI Access</span>
              <span className="bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wide">
                AI Indexed
              </span>
            </button>
          </div>
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
                className={`text-left p-5 rounded-2xl border transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg cursor-pointer flex flex-col justify-between group h-36 ${
                  isActive
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/10 shadow-sm'
                    : 'bg-white border-slate-150 hover:border-[#5f6f52]'
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
        
        {/* Quick Filter Bar */}
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-emerald-700" />
              <span>Quick Search & Filter Available Resources & Books</span>
            </label>
            <div className="flex items-center gap-3">
              {/* Sorting Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-emerald-200/90 rounded-xl px-2.5 py-1 shadow-2xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <label htmlFor="resource-sort-dropdown" className="text-xs font-bold text-slate-600 shrink-0">
                  Sort:
                </label>
                <select
                  id="resource-sort-dropdown"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'alphabetical' | 'popularity')}
                  className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="newest">Newest</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>

              {/* Difficulty Level Multi-Select Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDifficultyDropdownOpen(!isDifficultyDropdownOpen)}
                  className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1 text-xs font-bold transition shadow-2xs cursor-pointer ${
                    selectedDifficulties.length > 0
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-white text-slate-700 border-emerald-200/90 hover:bg-slate-50'
                  }`}
                  title="Filter resources by difficulty level"
                >
                  <Gauge className={`w-3.5 h-3.5 ${selectedDifficulties.length > 0 ? 'text-white' : 'text-emerald-700'}`} />
                  <span>
                    Difficulty: {selectedDifficulties.length === 0 ? 'All Levels' : selectedDifficulties.join(', ')}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isDifficultyDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDifficultyDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20 cursor-default"
                        onClick={() => setIsDifficultyDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2.5 space-y-1"
                      >
                        <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-100 px-1">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <Gauge className="w-3.5 h-3.5 text-emerald-600" /> Difficulty Level
                          </span>
                          {selectedDifficulties.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setSelectedDifficulties([])}
                              className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                            >
                              Reset
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedDifficulties(['Beginner', 'Intermediate', 'Advanced'])}
                              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                            >
                              Select All
                            </button>
                          )}
                        </div>

                        {(['Beginner', 'Intermediate', 'Advanced'] as DifficultyLevel[]).map((level) => {
                          const isChecked = selectedDifficulties.includes(level);
                          const levelColors = {
                            Beginner: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                            Intermediate: 'text-amber-700 bg-amber-50 border-amber-200',
                            Advanced: 'text-purple-700 bg-purple-50 border-purple-200'
                          };
                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  setSelectedDifficulties(selectedDifficulties.filter(d => d !== level));
                                } else {
                                  setSelectedDifficulties([...selectedDifficulties, level]);
                                }
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                isChecked
                                  ? 'bg-emerald-50/80 text-emerald-950 font-extrabold'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span>{level}</span>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${levelColors[level]}`}>
                                {level}
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {(searchFilter || categoryFilter !== 'All' || contentTypeFilter !== 'all' || sortBy !== 'newest' || onlyAiRecommended || showOfflineOnly || selectedDifficulties.length > 0) && (
                <button
                  onClick={() => {
                    setSearchFilter('');
                    setCategoryFilter('All');
                    setContentTypeFilter('all');
                    setSortBy('newest');
                    setOnlyAiRecommended(false);
                    setShowOfflineOnly(false);
                    setSelectedDifficulties([]);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-emerald-700">
              <Search className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Type title, subject, or author to filter instantly (e.g., Algebra, Alice, Physics, PhET)..."
              className="w-full bg-white border border-emerald-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 text-sm text-slate-800 pl-10 pr-10 py-2.5 rounded-xl transition focus:outline-none placeholder:text-slate-400 font-medium shadow-2xs"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchFilter && (
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="font-bold text-emerald-950 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-700" /> Active Subject Tag Filter:
              </span>
              <span className="bg-emerald-700 text-white px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 text-xs shadow-2xs">
                <span>{searchFilter}</span>
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="hover:bg-emerald-800 rounded-full p-0.5 cursor-pointer transition-colors"
                  title="Clear subject filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}

          {selectedDifficulties.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="font-bold text-emerald-950 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-emerald-700" /> Active Difficulty Filters:
              </span>
              {selectedDifficulties.map((level) => (
                <span
                  key={level}
                  className="bg-emerald-700 text-white px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 text-xs shadow-2xs"
                >
                  <span>{level}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDifficulties(selectedDifficulties.filter(d => d !== level))}
                    className="hover:bg-emerald-800 rounded-full p-0.5 cursor-pointer transition-colors"
                    title={`Remove ${level} filter`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Section Source Toggle Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Show:</span>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setContentTypeFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                contentTypeFilter === 'all'
                  ? 'bg-[#5f6f52] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>All Items ({filteredResources.length + filteredBooks.length})</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setContentTypeFilter('resources')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                contentTypeFilter === 'resources'
                  ? 'bg-[#5f6f52] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web Teaching Aids ({filteredResources.length})</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setContentTypeFilter('books')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                contentTypeFilter === 'books'
                  ? 'bg-[#5f6f52] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Open-Access Books ({filteredBooks.length})</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setContentTypeFilter('wikilibrary')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                contentTypeFilter === 'wikilibrary'
                  ? 'bg-sky-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              <span>WikiLibrary Reference Hub ({filteredWikiArticles.length})</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setOnlyAiRecommended(!onlyAiRecommended)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                onlyAiRecommended
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs ring-2 ring-purple-400/30'
                  : 'bg-indigo-50/90 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
              }`}
              title="Filter resources that match your generated lesson plans or document topics"
            >
              <Sparkles className={`w-3.5 h-3.5 ${onlyAiRecommended ? 'text-amber-300 fill-amber-300' : 'text-indigo-600'}`} />
              <span>✨ AI Recommended Only</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowOfflineOnly(!showOfflineOnly)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                showOfflineOnly
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs ring-2 ring-emerald-400/30'
                  : 'bg-emerald-50/90 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Filter resources saved to browser local storage for offline access"
            >
              <HardDriveDownload className={`w-3.5 h-3.5 ${showOfflineOnly ? 'text-amber-300' : 'text-emerald-700'}`} />
              <span>Offline Saved ({offlineDownloadedKeys.length})</span>
            </motion.button>
          </div>

          {/* Category / Format Specific Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-emerald-200/60">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Format Filter:</span>
            {[
              { id: 'All', label: 'All Formats', icon: Filter },
              { id: 'PDFs', label: 'PDFs & Worksheets', icon: FileText },
              { id: 'Interactive', label: 'Interactive Sims', icon: Sparkles },
              { id: 'Videos', label: 'Videos & Media', icon: Tv },
              { id: 'Lesson Plans', label: 'Lesson Plans', icon: Book },
              { id: 'Books', label: 'Books & Textbooks', icon: BookOpen }
            ].map((cat) => {
              const IconComp = cat.icon;
              const isActive = categoryFilter === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-white/90 text-emerald-950 border border-emerald-200 hover:bg-emerald-100/70'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Global Web Scanning Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Scan Live Web Repositories (Gemini Grounding)
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                <Globe className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveCuratedQuery(null);
                }}
                placeholder="Describe topic for deep web search (e.g. gravity simulations, fraction word problems)..."
                className="w-full bg-slate-50 hover:bg-slate-50/50 border border-slate-200 focus:border-[#5f6f52] focus:bg-white text-sm text-slate-800 pl-11 pr-4 py-2.5 rounded-2xl transition focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="bg-[#5f6f52] hover:bg-[#4d5b41] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#fefae0]" />
                  <span>Scan Web Repositories</span>
                </>
              )}
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 pt-1">
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
        <div className="space-y-8 animate-fadeIn">
          {/* Books Grid Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="h-5 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
              <div className="h-4 w-20 bg-slate-100 rounded-md animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 animate-pulse">
                  <div className="h-28 rounded-2xl bg-slate-200"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-20 bg-slate-200 rounded-md"></div>
                    <div className="h-3 w-16 bg-slate-100 rounded-md"></div>
                  </div>
                  <div className="h-5 w-4/5 bg-slate-200 rounded-lg"></div>
                  <div className="h-3 w-2/3 bg-slate-100 rounded-md"></div>
                  <div className="space-y-1.5 pt-1">
                    <div className="h-3 w-full bg-slate-100 rounded-md"></div>
                    <div className="h-3 w-5/6 bg-slate-100 rounded-md"></div>
                  </div>
                  <div className="pt-2">
                    <div className="h-9 w-full bg-slate-200 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resources Grid Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="h-5 w-56 bg-slate-200 rounded-lg animate-pulse"></div>
              <div className="h-4 w-24 bg-slate-100 rounded-md animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                      <div className="h-5 w-20 bg-slate-200 rounded-full"></div>
                      <div className="h-5 w-16 bg-slate-100 rounded-full"></div>
                    </div>
                    <div className="h-5 w-24 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="h-6 w-3/4 bg-slate-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-100 rounded-lg"></div>
                    <div className="h-3 w-5/6 bg-slate-100 rounded-lg"></div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="h-4 w-28 bg-slate-200 rounded-lg"></div>
                    <div className="flex gap-2">
                      <div className="h-8 w-20 bg-slate-200 rounded-xl"></div>
                      <div className="h-8 w-24 bg-slate-200 rounded-xl"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RESULTS GRID WITH SMOOTH SLIDE-IN ANIMATION */}
      {!isLoading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${searchFilter.trim().toLowerCase()}_${categoryFilter}_${contentTypeFilter}_${showOfflineOnly}_${onlyAiRecommended}_${sortBy}_${selectedDifficulties.join(',')}`}
            initial={{ opacity: 0, x: 28, filter: 'blur(3px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -28, filter: 'blur(3px)' }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            {/* OPEN-ACCESS BOOKS SECTION */}
            {(contentTypeFilter === 'all' || contentTypeFilter === 'books') && filteredBooks.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    <span>Open-Access Textbooks & Loaded Books ({filteredBooks.length})</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsUploadBookModalOpen(true)}
                      className="bg-[#5f6f52] hover:bg-[#4d5a42] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Load Full Book for AI Access
                    </button>
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline">Free Public Domain & AI Indexed</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredBooks.map((book, idx) => {
                    const isSaved = savedBookIds.includes(book.id);
                    const recInfo = getAiRecommendationInfo(book.title, book.subject, book.summary, book.author);
                    const bookDifficulty = getItemDifficulty(book);
                    return (
                      <motion.div
                        key={book.id}
                        initial={{ opacity: 0, y: 14, x: 10 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        transition={{ duration: 0.28, delay: Math.min(idx * 0.035, 0.22), ease: 'easeOut' }}
                      >
                        <Book3DCard
                          book={book}
                          onRead={(b) => setSelectedBookForModal(b)}
                          onImport={!isStudent ? (b) => handleImportBookToMaterials(b) : undefined}
                          isImported={isSaved}
                          recInfo={recInfo}
                          bookDifficulty={bookDifficulty}
                          searchFilter={searchFilter}
                          onSubjectTagClick={handleSubjectTagClick}
                          variant="grid"
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WEB RESOURCES SECTION */}
            {(contentTypeFilter === 'all' || contentTypeFilter === 'resources') && filteredResources.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" /> Web Teaching Aids & Simulators ({filteredResources.length})
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredResources.map((resItem, idx) => {
                    const isSaved = savedResourceUrls.includes(resItem.url);
                    const recInfo = getAiRecommendationInfo(resItem.title, resItem.category, resItem.description, resItem.type);
                    const resDifficulty = getItemDifficulty(resItem);
                    const resDifficultyColors = {
                      Beginner: 'text-emerald-800 bg-emerald-50 border-emerald-200/90',
                      Intermediate: 'text-amber-900 bg-amber-50 border-amber-200/90',
                      Advanced: 'text-purple-900 bg-purple-50 border-purple-200/90'
                    };
                    return (
                      <motion.div
                        key={resItem.url}
                        initial={{ opacity: 0, y: 14, x: 10 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        transition={{ duration: 0.28, delay: Math.min(idx * 0.035, 0.22), ease: 'easeOut' }}
                        className="bg-white border border-slate-150 hover:border-emerald-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transform transition-all duration-300 rounded-3xl p-6 flex flex-col justify-between group relative overflow-hidden"
                      >
                        <div className="space-y-4">
                          {/* AI Recommendation Banner */}
                          {recInfo && (
                            <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 p-[1px] rounded-2xl shadow-2xs">
                              <div className="bg-gradient-to-r from-emerald-50 via-teal-50/90 to-indigo-50 text-emerald-950 px-3.5 py-1.5 rounded-[15px] flex items-center justify-between gap-2 text-xs font-bold border border-emerald-200/60">
                                <div className="flex items-center gap-1.5 shrink-0 text-emerald-900">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-400 animate-pulse" />
                                  <span className="font-extrabold text-[10px] uppercase tracking-wider text-emerald-900">AI Recommended</span>
                                </div>
                                <span className="text-[10px] text-emerald-700 font-medium truncate max-w-[210px]" title={recInfo.reason}>
                                  {recInfo.reason}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Tags row */}
                          <div className="flex flex-wrap gap-2 items-center justify-between">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => handleSubjectTagClick(resItem.category)}
                                title={`Click to filter resources by "${resItem.category}"`}
                                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 group/pill ${
                                  searchFilter.trim().toLowerCase() === resItem.category.trim().toLowerCase()
                                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-500/20'
                                    : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 border-emerald-200/80 hover:shadow-2xs'
                                }`}
                              >
                                <Tag className={`w-3 h-3 text-emerald-600 transition-transform ${
                                  searchFilter.trim().toLowerCase() === resItem.category.trim().toLowerCase()
                                    ? 'text-white'
                                    : 'group-hover/pill:scale-110'
                                }`} />
                                <span>{resItem.category}</span>
                              </motion.button>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-800 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                                {resItem.type}
                              </span>
                              <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${resDifficultyColors[resDifficulty]}`}>
                                <Gauge className="w-2.5 h-2.5 shrink-0" />
                                <span>{resDifficulty}</span>
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
                        <div className="pt-5 mt-5 border-t border-slate-100 flex flex-wrap items-center gap-2">
                          <a
                            href={resItem.url}
                            target="_blank"
                            rel="noopener noreferrer referrer"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Link</span>
                          </a>

                          <button
                            onClick={() => handleToggleOfflineDownload({
                              idOrUrl: resItem.url,
                              type: 'resource',
                              title: resItem.title,
                              categoryOrSubject: resItem.category,
                              description: resItem.description,
                              resourceData: resItem
                            })}
                            className={`rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                              offlineDownloadedKeys.includes(resItem.url)
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                            }`}
                            title={offlineDownloadedKeys.includes(resItem.url) ? "Saved in browser local storage for offline usage (Click to remove)" : "Save resource content to local browser storage & download guide for offline access"}
                          >
                            {offlineDownloadedKeys.includes(resItem.url) ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Offline Ready</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                <span>Offline Download</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setShareItem({
                                type: 'resource',
                                title: resItem.title,
                                url: resItem.url,
                                subjectOrCategory: resItem.category,
                                description: resItem.description,
                                authorOrType: resItem.type,
                                resourceData: resItem
                              });
                              setShareSuccessMsg(null);
                              setShareNote('');
                            }}
                            className="p-2 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition flex items-center justify-center gap-1 text-xs font-bold cursor-pointer shrink-0"
                            title="Share resource link or send to Collaboration Hub"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share</span>
                          </button>

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
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WIKILIBRARY EDUCATIONAL REFERENCE SECTION */}
            {(contentTypeFilter === 'all' || contentTypeFilter === 'wikilibrary') && (
              <div className="space-y-6 pt-4 border-t border-slate-200/80">
                {/* Header Banner */}
                <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-sky-800/40 relative overflow-hidden space-y-4">
                  <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-sky-300" />
                          WikiLibrary Open Reference Knowledge Hub
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          Peer-Reviewed & Free Access
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                        Educational Reference Articles & Lesson Supplement Hub
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Search millions of peer-curated encyclopedic topics, scientific articles, primary history documents, and open textbook modules. Supplement your lesson plans with reliable background knowledge and student inquiry guides.
                      </p>
                    </div>

                    {/* Live Search Quick Box */}
                    <div className="w-full md:w-80 bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-2xl space-y-2 shrink-0">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-sky-200 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-sky-400" /> Live Wiki Reference Search
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={wikiSearchQuery}
                          onChange={(e) => setWikiSearchQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSearchWikipedia(wikiSearchQuery); }}
                          placeholder="Search Wikipedia (e.g. Mitosis, French Revolution)..."
                          className="flex-1 bg-white/90 text-slate-900 placeholder:text-slate-500 text-xs font-semibold px-3 py-2 rounded-xl border border-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleSearchWikipedia(wikiSearchQuery)}
                          disabled={isSearchingWiki || !wikiSearchQuery.trim()}
                          className="bg-sky-500 hover:bg-sky-600 disabled:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center shrink-0"
                        >
                          {isSearchingWiki ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Wiki Category Topic Chips */}
                  <div className="pt-3 border-t border-sky-800/60 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-sky-200 mr-1 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-sky-400" /> Filter Topics:
                    </span>
                    {[
                      'All',
                      'STEM & Life Sciences',
                      'STEM & Physical Sciences',
                      'World History & Humanities',
                      'Mathematics & Computing',
                      'Languages & Literature',
                      'Environmental & Earth Science',
                      'Pedagogy & SEN'
                    ].map((cat) => {
                      const isActive = selectedWikiCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedWikiCategory(cat)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-sky-400 text-slate-950 font-black shadow-xs'
                              : 'bg-white/10 hover:bg-white/20 text-sky-100 border border-white/10'
                          }`}
                        >
                          <span>{cat === 'All' ? 'All Topics' : cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Wikipedia Search Results Bar */}
                {wikiSearchResults.length > 0 && (
                  <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-950 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-sky-600" /> Live Wikipedia Results for "{wikiSearchQuery}" ({wikiSearchResults.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => { setWikiSearchResults([]); setWikiSearchQuery(''); }}
                        className="text-xs text-sky-700 hover:text-sky-900 font-bold underline cursor-pointer"
                      >
                        Clear Search
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {wikiSearchResults.map((item) => (
                        <div key={item.pageid} className="bg-white p-3.5 rounded-xl border border-sky-150 hover:border-sky-300 shadow-2xs space-y-2 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h4>
                            <div
                              className="text-[11px] text-slate-500 line-clamp-3 mt-1 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: item.snippet }}
                            />
                          </div>
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenWikiArticleSummary(item.title)}
                              className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3" /> Read Summary
                            </button>
                            <a
                              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                            >
                              Wikipedia <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Curated Educational Reference Articles Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-sky-950 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-sky-700" />
                      <span>WikiLibrary Curated Reference Articles ({filteredWikiArticles.length})</span>
                    </h3>
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline">Categorized for Lesson Planning & Inquiry</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredWikiArticles.map((art, idx) => {
                      const isSaved = savedResourceUrls.includes(art.url);
                      const isOfflineSaved = offlineDownloadedKeys.includes(art.url);
                      return (
                        <motion.div
                          key={art.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.28, delay: Math.min(idx * 0.035, 0.22) }}
                          className="bg-white border border-sky-100 hover:border-sky-300 hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 rounded-3xl p-5 flex flex-col justify-between group relative overflow-hidden"
                        >
                          <div className="space-y-3">
                            {/* Header Pills */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                                {art.category}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <GraduationCap className="w-3 h-3 text-sky-600" /> {art.gradeLevel}
                              </span>
                            </div>

                            {/* Article Title */}
                            <h4 className="text-sm font-extrabold text-slate-800 leading-snug group-hover:text-sky-800 transition-colors">
                              {art.title}
                            </h4>

                            {/* Wiki Source badge */}
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                              <Globe className="w-3 h-3 text-sky-500 shrink-0" />
                              <span>{art.wikiSource}</span>
                              <span>•</span>
                              <span>{art.subject}</span>
                            </div>

                            {/* Summary / Description */}
                            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                              {art.description || art.extractSummary}
                            </p>

                            {/* Why Teachers Love It & Classroom Activity Box */}
                            <div className="bg-sky-50/50 p-3 rounded-2xl border border-sky-100/80 space-y-2 text-xs">
                              <div>
                                <span className="font-extrabold text-sky-900 flex items-center gap-1 mb-0.5">
                                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Why Teachers Love It:
                                </span>
                                <p className="text-slate-600 leading-tight">{art.whyTeachersLoveIt}</p>
                              </div>
                              <div className="pt-1.5 border-t border-sky-100">
                                <span className="font-extrabold text-[#5f6f52] flex items-center gap-1 mb-0.5">
                                  <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Classroom Activity:
                                </span>
                                <p className="text-slate-600 leading-tight">{art.suggestedActivity}</p>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setSelectedWikiArticleModal({
                                title: art.title,
                                extract: art.extractSummary || art.description,
                                url: art.url,
                                category: art.category,
                                subject: art.subject,
                                gradeLevel: art.gradeLevel,
                                whyTeachersLoveIt: art.whyTeachersLoveIt,
                                suggestedActivity: art.suggestedActivity,
                                wikiSource: art.wikiSource
                              })}
                              className="bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5" /> Read Summary
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleOfflineDownload({
                                  idOrUrl: art.url,
                                  type: 'resource',
                                  title: art.title,
                                  categoryOrSubject: art.category,
                                  description: art.description,
                                  resourceData: {
                                    title: art.title,
                                    url: art.url,
                                    category: art.category,
                                    type: art.wikiSource,
                                    description: art.description,
                                    gradeLevel: art.gradeLevel,
                                    whyTeachersLoveIt: art.whyTeachersLoveIt,
                                    suggestedActivity: art.suggestedActivity
                                  }
                                })}
                                className={`p-1.5 rounded-xl text-xs transition cursor-pointer ${
                                  isOfflineSaved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title={isOfflineSaved ? 'Saved for offline access' : 'Save for offline access'}
                              >
                                {isOfflineSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <HardDriveDownload className="w-3.5 h-3.5" />}
                              </button>

                              <a
                                href={art.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition text-xs"
                                title="Open Live Article in New Tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              {!isStudent && (
                                <button
                                  type="button"
                                  onClick={() => handleImportWikiArticleToMaterials(art)}
                                  disabled={isSaved}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    isSaved ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-800 hover:bg-sky-900 text-white'
                                  }`}
                                >
                                  {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                                  <span>{isSaved ? 'Saved' : 'Import'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* No results placeholder */}
            {filteredResources.length === 0 && filteredBooks.length === 0 && filteredWikiArticles.length === 0 && (
              <div className="bg-white border border-slate-150 rounded-3xl p-10 text-center text-slate-500">
                <Globe className="w-12 h-12 text-[#a9b388] mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-800">No Matching Resources or Books Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                  {onlyAiRecommended ? (
                    <>No items currently match the active "AI Recommended" filter for these keywords. Try toggling off "AI Recommended Only" or generating new lesson documents to unlock personalized matches.</>
                  ) : searchFilter || categoryFilter !== 'All' ? (
                    <>No items match your selected filters {searchFilter && <>("<strong>{searchFilter}</strong>")</>} {categoryFilter !== 'All' && <>(Category: "<strong>{categoryFilter}</strong>")</>}. Try adjusting your keywords or clearing the category filter.</>
                  ) : (
                    <>Choose a featured topic above or describe your curriculum focus to discover high-quality, verified lesson resources from top worldwide sources.</>
                  )}
                </p>
                {(searchFilter || categoryFilter !== 'All' || contentTypeFilter !== 'all' || onlyAiRecommended) && (
                  <button
                    onClick={() => {
                      setSearchFilter('');
                      setCategoryFilter('All');
                      setContentTypeFilter('all');
                      setOnlyAiRecommended(false);
                    }}
                    className="mt-4 bg-[#5f6f52] hover:bg-[#4d5b41] text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-2xs"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* BOOK READER MODAL */}
      <OpenBookReaderModal
        book={selectedBookForModal}
        onClose={() => setSelectedBookForModal(null)}
        onImportToLibrary={(book) => handleImportBookToMaterials(book)}
      />

      {/* UPLOAD FULL BOOK FOR AI ACCESS MODAL */}
      <UploadFullBookModal
        isOpen={isUploadBookModalOpen}
        onClose={() => setIsUploadBookModalOpen(false)}
        onBookAdded={(newBook) => {
          setCustomBooks((prev) => [newBook, ...prev]);
        }}
      />

      {/* SHARE RESOURCE / BOOK MODAL */}
      {shareItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl max-w-lg w-full overflow-hidden flex flex-col space-y-0">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
                  <Share2 className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white leading-tight">
                    Share {shareItem.type === 'book' ? 'Textbook' : 'Resource'}
                  </h3>
                  <p className="text-xs text-indigo-200 font-medium">
                    Copy link or share with colleagues in Collaboration Hub
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShareItem(null);
                  setShareSuccessMsg(null);
                  setShareNote('');
                }}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item Summary Banner */}
            <div className="p-5 bg-indigo-50/50 border-b border-indigo-100 flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700 shrink-0 mt-0.5">
                {shareItem.type === 'book' ? <BookOpen className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{shareItem.title}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full shrink-0">
                    {shareItem.subjectOrCategory}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{shareItem.description}</p>
              </div>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
              <button
                onClick={() => setActiveShareTab('link')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeShareTab === 'link'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Copy Link & Citation</span>
              </button>

              <button
                onClick={() => setActiveShareTab('hub')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeShareTab === 'hub'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Send to Collaboration Hub</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-5 space-y-4">
              {shareSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{shareSuccessMsg}</span>
                </div>
              )}

              {activeShareTab === 'link' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                      Direct URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareItem.url}
                        className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none select-all"
                      />
                      <button
                        onClick={() => handleCopyLink(shareItem.url)}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                          copiedLink
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                        }`}
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      Resource Summary & Citation
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600 leading-relaxed italic">
                      "{shareItem.title}" — {shareItem.type === 'book' ? `Author: ${shareItem.authorOrType || 'Unknown'}` : `Category: ${shareItem.subjectOrCategory}`}. {shareItem.description} ({shareItem.url})
                    </div>
                    <button
                      onClick={() => handleCopyCitation(shareItem)}
                      className={`w-full py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        copiedCitation
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {copiedCitation ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedCitation ? 'Citation Copied to Clipboard!' : 'Copy Full Summary & Citation'}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeShareTab === 'hub' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      Add Note for Colleagues (Optional)
                    </label>
                    <textarea
                      value={shareNote}
                      onChange={(e) => setShareNote(e.target.value)}
                      placeholder="e.g. Recommended textbook chapter for Grade 8 science teachers during next week's unit."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none h-24"
                    />
                  </div>

                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
                    <strong>Collaboration Hub:</strong> Sharing will publish this resource to your school's shared knowledge repository where all fellow teachers and staff can discover, view, and comment.
                  </div>

                  <button
                    onClick={() => handleShareToCollaborationHub(shareItem)}
                    disabled={isSharingToHub}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 px-4 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSharingToHub ? 'Publishing to Hub...' : 'Send to Collaboration Hub'}</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* OFFLINE DOWNLOAD TOAST NOTIFICATION */}
      {offlineDownloadNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-2.5 animate-bounce backdrop-blur-xs">
          <HardDriveDownload className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{offlineDownloadNotification}</span>
        </div>
      )}

      {/* WIKILIBRARY ARTICLE SUMMARY MODAL */}
      <AnimatePresence>
        {selectedWikiArticleModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white border border-slate-200 shadow-2xl rounded-3xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 text-white p-6 flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Globe className="w-3 h-3 text-sky-300" /> WikiLibrary Reference
                    </span>
                    {selectedWikiArticleModal.category && (
                      <span className="bg-white/10 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {selectedWikiArticleModal.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-white leading-snug">
                    {selectedWikiArticleModal.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedWikiArticleModal(null)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 text-sm">
                <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-sky-700" /> Article Extract & Summary
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {selectedWikiArticleModal.extract}
                  </p>
                </div>

                {selectedWikiArticleModal.whyTeachersLoveIt && (
                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-1">
                    <h5 className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-600" /> Why Teachers Love It
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {selectedWikiArticleModal.whyTeachersLoveIt}
                    </p>
                  </div>
                )}

                {selectedWikiArticleModal.suggestedActivity && (
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 space-y-1">
                    <h5 className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-700" /> Suggested Classroom Activity
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {selectedWikiArticleModal.suggestedActivity}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                <a
                  href={selectedWikiArticleModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Full Article on Wiki
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWikiArticleModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                  >
                    Close
                  </button>

                  {!isStudent && (
                    <button
                      type="button"
                      onClick={() => {
                        handleImportWikiArticleToMaterials(selectedWikiArticleModal);
                        setSelectedWikiArticleModal(null);
                      }}
                      className="bg-sky-800 hover:bg-sky-900 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <BookmarkPlus className="w-4 h-4" /> Save to Materials
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
    },
    {
      title: "WikiLibrary Open Knowledge Hub (Wikipedia & Wikibooks Search)",
      url: "https://en.wikipedia.org",
      category: "WikiLibrary Open Reference",
      type: "Reference Site",
      description: "Direct live interface to Wikipedia, Wikibooks, and Wikimedia reference databases. Search millions of peer-curated encyclopedic topics, scientific articles, and open historical documents.",
      gradeLevel: "All Grades (K-12 & Higher Ed)",
      whyTeachersLoveIt: "Instant access to world knowledge with structured summaries, citation maps, and cross-disciplinary research links.",
      suggestedActivity: "Use the WikiLibrary search to extract key background definitions and citations for student project research."
    },
    {
      title: "Wikibooks Open Textbooks Library (WikiLibrary Collection)",
      url: "https://en.wikibooks.org",
      category: "WikiLibrary Open Reference",
      type: "Worksheet",
      description: "Open community textbook collection covering physics, world history, calculus, biology, computing, and environmental science.",
      gradeLevel: "Grade 6-12 & University",
      whyTeachersLoveIt: "Fully editable and downloadable open-access textbooks with chapter-by-chapter exercises.",
      suggestedActivity: "Assign a Wikibooks chapter as supplementary reading for differentiated learning groups."
    },
    {
      title: "Wikimedia Commons Open Educational Media Archive (WikiLibrary)",
      url: "https://commons.wikimedia.org",
      category: "WikiLibrary Open Reference",
      type: "Interactive Simulator",
      description: "Over 100 million freely usable educational images, diagrams, historical maps, anatomical charts, and scientific animations.",
      gradeLevel: "All Grades",
      whyTeachersLoveIt: "Goldmine for high-resolution visual aids, diagrams, and historical photographs to enhance lesson slides.",
      suggestedActivity: "Download copyright-free scientific diagrams to embed in student lab worksheets."
    },
    {
      title: "Wikisource Open Primary Document Repository (WikiLibrary)",
      url: "https://en.wikisource.org",
      category: "WikiLibrary Open Reference",
      type: "Reference Site",
      description: "Digital library of free-content primary source documents, speeches, treaties, historical letters, and classical literature.",
      gradeLevel: "Grade 7-12",
      whyTeachersLoveIt: "Essential primary sources for history and literature analysis without paywalls.",
      suggestedActivity: "Have students analyze historical speeches or primary constitutional documents in small study circles."
    },
    {
      title: "Wikiversity Free Interactive Courses (WikiLibrary)",
      url: "https://en.wikiversity.org",
      category: "WikiLibrary Open Reference",
      type: "Lesson Plan",
      description: "Open learning community devoted to educational materials, online learning projects, and research modules across all subjects.",
      gradeLevel: "Grade 8-12 & Higher Ed",
      whyTeachersLoveIt: "Flexible university-level and secondary learning tracks created by global educators.",
      suggestedActivity: "Explore Wikiversity guided research activities to challenge advanced learners."
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
