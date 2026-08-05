import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Shield, 
  Download, 
  BookOpen, 
  Cpu, 
  FileText, 
  Video, 
  Sparkles, 
  Users, 
  Sliders, 
  Activity, 
  CheckCircle, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Award, 
  Volume2, 
  Lock, 
  HelpCircle,
  Eye,
  Zap,
  Globe,
  Printer,
  Sparkle,
  X
} from 'lucide-react';
import { useAuth, resolveDisplayName } from '../context/AuthContext';
import SEOAuditWidget from './SEOAuditWidget';

interface ModuleDetail {
  id: string;
  title: string;
  category: string;
  iconName: string;
  summary: string;
  capabilities: string[];
  functionality: string;
  adminControls: string;
}

const APP_MODULES: ModuleDetail[] = [
  {
    id: 'qr-linkage-module',
    title: 'QR Linkage & Physical Touchpoint Mapping Studio',
    category: 'Classroom Integration',
    iconName: 'Printer',
    summary: 'Dynamic QR redirection engine bridging physical textbooks, worksheets, and desk stickers with Socratic AI, UDL, and Adaptive Learning Paths.',
    capabilities: [
      'Dynamic QR redirection schema (/api/qr/resolve/:shortId)',
      'Socratic AI Tutor physical textbook page linking',
      'Adaptive Pathway node activation with auto low-difficulty scaffolding',
      'Pre-configured UDL accessibility profile triggers (Dyslexia font, relaxed spacing, ADHD milestones, ESL translation)',
      'Parent Playbook take-home folder progress sync',
      'Printable cut-out label sheet generator & camera barcode reader'
    ],
    functionality: 'Maintains dynamic mappings between short IDs and JSON payloads in PostgreSQL/Firestore, enabling instant target updates without reprinting physical QR code stickers.',
    adminControls: 'Administrators can view real-time scan metrics, inspect relational database DDL schemas, and update physical touchpoint parameters.'
  },
  {
    id: 'curriculum-engine',
    title: 'Curriculum Engine & CBC Dashboard',
    category: 'Core Academic',
    iconName: 'BookOpen',
    summary: 'National curriculum mapping framework supporting CBC, Standard 8, and Form 1-4 secondary syllabi.',
    capabilities: [
      'Grade & strand filtering (Kenyan CBC, Standard 8, Form 1-4)',
      'Sub-strand learning outcome database lookup',
      'Real-time syllabus completion tracker per subject',
      'Schemes of Work and lesson schedule generator',
      'Competency indicator mapping (Critical thinking, Digital literacy, Communication)'
    ],
    functionality: 'Querying national curriculum standards to dynamically extract learning goals, generating structured lesson schedules, and linking strand objectives directly into AI lesson generation prompts.',
    adminControls: 'Administrators can inspect standard coverage stats, audit teacher subject progress, and manage national curriculum alignment templates.'
  },
  {
    id: 'ai-document-studio',
    title: 'AI Document Studio & Lesson Planner',
    category: 'Content Generation',
    iconName: 'FileText',
    summary: 'Multi-step AI synthesis engine powered by Gemini 3.5 Flash for generating comprehensive lesson materials.',
    capabilities: [
      'Multi-step guided prompt builder for tailored outputs',
      'Bloom’s Taxonomy cognitive level targeting (Remembering to Creating)',
      'Classroom differentiation options (Gifted, Remedial, Mainstream, Special Needs)',
      'Integrated rubric generator and table of specifications',
      'Rich text editor with version history and inline notes',
      'One-click export to PDF, DOCX, and text formats'
    ],
    functionality: 'Communicates with server-side proxy routes to execute Gemini 3.5 Flash inference, outputting fully structured, formatted lesson plans, study guides, and exam sheets with strict API key protection.',
    adminControls: 'System admins can tune model prompt templates, monitor token usage quotas, and inspect generated document logs.'
  },
  {
    id: 'ai-video-studio',
    title: 'AI Video Studio & Visual Media Hub',
    category: 'Visual & Multimedia',
    iconName: 'Video',
    summary: 'AI-driven educational video clip generation powered by Google Veo 2.0 and Gemini Omni Flash with curated fallback streams.',
    capabilities: [
      'Text-to-Video generation using Google Veo 2.0 (veo-2.0-generate-001)',
      'Gemini Omni Flash preview video synthesis mode',
      'Aspect ratio selection (16:9 Landscape, 9:16 Mobile, 1:1 Square)',
      'High-Definition Educational Video Preset Engine for quota fallbacks',
      'Direct multimedia embedding into lesson notes and study guides',
      'Video playback timeline and download capability'
    ],
    functionality: 'Dispatches video generation requests to the `/api/generate-ai-video` endpoint. If primary Veo 2.0 or Omni models reach API quotas or restrictions, it seamlessly delivers relevant High-Definition educational clips matched to the lesson prompt.',
    adminControls: 'Admins can manage video model toggles, view video generation error telemetry, and inspect fallback stream triggers.'
  },
  {
    id: 'socratic-sandbox',
    title: 'Interactive Learning Path & Socratic Sandbox',
    category: 'Student Engagement',
    iconName: 'Sparkles',
    summary: 'Adaptive, student-centered learning environment with dynamic topic confidence scaffolding and AI tutoring.',
    capabilities: [
      'Self-assessed topic confidence rating (Low, Medium, High)',
      'Dynamic trail restructuring (Scaffolding for low confidence, acceleration for high confidence)',
      'Interactive Socratic AI Tutor dialogue sidebar',
      'Automated micro-quiz generator with instant grading',
      'Multi-regional Text-to-Speech (TTS) audio reader',
      'Daily learning streak and milestone tracker'
    ],
    functionality: 'Monitors student self-confidence scores to continuously adapt syllabus trails—generating simplified foundational guides for low confidence or project-based challenges for high confidence.',
    adminControls: 'Administrators can track student completion rates, audit AI tutor chat interactions, and adjust streak rewards.'
  },
  {
    id: 'visual-phonetics',
    title: 'Visual Phonetics & Speech Science Studio',
    category: 'Specialized Learning',
    iconName: 'Volume2',
    summary: 'Interactive articulatory mechanics visualizer for speech pathology, linguistics, and language pronunciation.',
    capabilities: [
      'Interactive articulatory diagrams (Alveolar, Postalveolar, Labiodental, Velar)',
      '3D-simulated tongue, velum, and vocal cord movement phase animations',
      'IPA sound wave guide and acoustic resonance indicators',
      'Targeted pronunciation drills for English and Swahili phonemes',
      'Step-by-step articulatory breakdown lists'
    ],
    functionality: 'Renders vector-based anatomical animation sequences showing precise tongue-palate contact points, velic aperture states, and air release bursts for phonetic instruction.',
    adminControls: 'Admins can customize phonetics lesson sets and review student speech practice analytics.'
  },
  {
    id: 'assessment-engine',
    title: 'Assessment & CBC Scorecard Engine',
    category: 'Assessment',
    iconName: 'Award',
    summary: 'Automated test sheet creation and competency scoring suite aligned to national learning standards.',
    capabilities: [
      'Multiple choice, fill-in-the-blank, and essay question builder',
      'Automated answer key generation with marking guides',
      'CBC competency scorecards (Exceeding, Meeting, Approaching, Below Expectation)',
      'Printable test paper PDF formatting',
      'Question bank categorization by subject and difficulty'
    ],
    functionality: 'Generates balanced evaluation papers based on selected Bloom’s taxonomy levels and curriculum strands, automatically calculating competency ratings.',
    adminControls: 'Admins can review assessment difficulty distributions and export school-wide evaluation reports.'
  },
  {
    id: 'ai-expert-reviewer',
    title: 'AI Expert Reviewer & Quality Auditor',
    category: 'Quality Assurance',
    iconName: 'Activity',
    summary: 'Automated pedagogical quality auditor evaluating CBC compliance and educational depth.',
    capabilities: [
      'Overall pedagogical quality score calculation (0–100%)',
      'CBC alignment index and objective clarity verification',
      'Bloom’s Taxonomy depth analysis',
      'One-click auto-fix recommendations for flagged weak areas',
      'Detailed strengths and improvement area breakdown'
    ],
    functionality: 'Scans generated lesson plans using specialized auditing prompts, identifying missing learner activities, vague rubrics, or unaligned outcomes, and applying automatic fixes.',
    adminControls: 'Admins can set quality threshold benchmarks and generate platform-wide content compliance reports.'
  },
  {
    id: 'collaboration-hub',
    title: 'Collaboration Hub & Resource Repository',
    category: 'Community',
    iconName: 'Users',
    summary: 'Shared school-wide content depository enabling educator collaboration and peer feedback.',
    capabilities: [
      'Global and school-specific resource sharing library',
      'Tagging, folder structuring, and search indexing',
      'Peer comment threads and collaborative review notes',
      'Document versioning history and restoration',
      'Granular sharing permissions (Public, School, Private)'
    ],
    functionality: 'Stores document metadata and content in Firestore collections, facilitating cross-faculty resource reuse and real-time collaborative commenting.',
    adminControls: 'Admins can moderate public library contributions, manage flagged content, and oversee folder structures.'
  },
  {
    id: 'accessibility-suite',
    title: 'Accessibility & Inclusive Learning Suite (UDL)',
    category: 'Universal Access',
    iconName: 'Sliders',
    summary: 'Universal Design for Learning (UDL) framework removing visual, cognitive, and sensory barriers.',
    capabilities: [
      'Dyslexic-friendly font toggle (Comic Neue with asymmetric stems)',
      'High-contrast light and dark mode color palettes',
      'Paragraph line-height and character spacing relaxation',
      'Multi-regional Screen Reader TTS voices (US, UK, Indian, Swahili, West African)',
      'Pre-configured Learner Profiles (ADHD Focus, Dyslexia, Low Vision, ESL)'
    ],
    functionality: 'Dynamically updates CSS variables and DOM classes across the entire app to tailor typography, spacing, contrast, and synthesized audio to individual learner needs.',
    adminControls: 'Admins can configure system default accessibility states and audit accessibility feature adoption.'
  },
  {
    id: 'system-governance',
    title: 'System Administration & Security Governance',
    category: 'Administration',
    iconName: 'Shield',
    summary: 'Root administrative panel for user account management, policy enforcement, and audit logs.',
    capabilities: [
      'Pre-registering accounts with pre-assigned roles (Admin, Teacher, Student, Parent)',
      'Role privilege modification and user suspension management',
      'Safety violation warning tracker with automatic 3-strike suspension threshold',
      'Granular user overrides bypassing global restrictions',
      'Real-time Activity Audit Log tracking user actions and timestamps',
      'System-wide AI policy tuning and model configuration'
    ],
    functionality: 'Maintains system integrity through Firestore rule enforcement, recording all critical user interactions in activity logs and managing user account states.',
    adminControls: 'Restricted exclusively to authorized administrators with full system override capability.'
  },
  {
    id: 'whatsapp-meta-engine',
    title: 'Official WhatsApp Notification & Accessibility Engine (Google AI Studio System Instructions)',
    category: 'Administration',
    iconName: 'MessageSquare',
    summary: 'Official Meta WhatsApp Cloud API gateway with UDL Accessibility Engine, Webhook listener, multi-role Socratic AI routing, and school-wide broadcast dispatch.',
    capabilities: [
      'Official WhatsApp Meta Webhook listener endpoint (/api/whatsapp/webhook)',
      'Verification Token & Meta App Secret authentication handshake security',
      'Google AI Studio System Instructions for Official WhatsApp Notification & Accessibility Engine (/api/whatsapp/udl-generate)',
      'Learner Profile Scaffolding (ADHD bullet micro-milestones, Dyslexia ocular anchors, ESL simplified vocabulary, Screen Reader audio summaries, Low-Vision high contrast)',
      'Multilingual notification translations into Spanish (es), French (fr), Swahili (sw), and English (en)',
      'Confidence-Rating Mechanics (Low Confidence topic trail root repositioning vs High Confidence syllabus fast-tracking)',
      'Educator, Student, and Parent Playbooks for resource links, daily streak motivators, and home configuration tips',
      'Interactive 1-on-1 Socratic homework photo & voice note message processing',
      'Live message volume telemetry, session tracking, and delivery audit logs'
    ],
    functionality: 'Processes incoming Meta WhatsApp Webhooks, parses text/media/voice messages, invokes server-side Gemini 3.5 Flash with official UDL Accessibility system instructions, and returns formatted plain-text responses via WhatsApp Cloud API.',
    adminControls: 'Administrators can configure Meta API access tokens, inspect live webhook log streams, manage broadcast subscriber queues, and trigger UDL Accessibility notification payloads.'
  },
  {
    id: 'seo-audit-engine',
    title: 'Automated SEO & Search Visibility Audit Engine',
    category: 'Administration',
    iconName: 'Globe',
    summary: 'Lightweight periodic SEO utility scanning public links, meta tags, open graph tags, JSON-LD schemas, and domain assets.',
    capabilities: [
      'Automated periodic background scanning (60-second intervals)',
      'Internal public link HEAD checks (/about, /privacy, /terms, /sitemap.xml, /robots.txt)',
      'DOM meta tag & canonical URL verification (<title>, <meta description>, og:image, twitter:card)',
      'Schema.org JSON-LD graph inspection (EducationalOrganization, FAQPage, BreadcrumbList)',
      'Real-time SEO issue logging & Playbook compliance scoring'
    ],
    functionality: 'Periodically checks public HTML elements and endpoints to ensure 100% compliance with search engine indexing and AI overview requirements.',
    adminControls: 'Administrators can view real-time audit logs, trigger manual on-demand scans, and inspect detailed recommendations.'
  }
];

interface PlaybookPolicy {
  id: string;
  role: 'Administrator' | 'Educator' | 'Student' | 'Parent';
  step: string;
  title: string;
  description: string;
  tags?: string[];
}

const ROLE_PLAYBOOKS: PlaybookPolicy[] = [
  // Administrator
  {
    id: 'admin-1',
    role: 'Administrator',
    step: '1. Operational System Health Audit',
    title: 'Operational System Health Audit & Telemetry',
    description: 'Regularly review the "Recent Activity Audit Log" under the Admin tab to track teacher logins, document creation, and safety flags. Check system connectivity status and AI backend response times.',
    tags: ['Audit Log', 'Telemetry', 'System Health']
  },
  {
    id: 'admin-2',
    role: 'Administrator',
    step: '2. User Account Registry',
    title: 'User Account Registry & Role Permissions',
    description: 'Pre-register teaching staff using the "Pre-register User Account" tool. Specify exact names, valid email addresses, and appropriate role permissions (Administrator, Teacher, Student, Parent).',
    tags: ['Account Registry', 'Permissions', 'User Pre-registration']
  },
  {
    id: 'admin-3',
    role: 'Administrator',
    step: '3. Policy Violation & Suspension Threshold',
    title: 'Policy Violation & Suspension Thresholds (3-Strike Policy)',
    description: 'When a user violates platform safety rules or prompts inappropriate content, issue a warning via the Admin Panel. Accounts exceeding the 3-warning threshold are automatically suspended.',
    tags: ['Suspension Policy', 'Safety Violations', '3-Strike Rule']
  },
  {
    id: 'admin-4',
    role: 'Administrator',
    step: '4. Granular User Policy Overrides',
    title: 'Granular User Policy Overrides & Custom Quotas',
    description: 'Apply targeted user overrides to bypass specific global restrictions (such as extended rate limits or custom document sizes) during school examination windows or faculty research trials.',
    tags: ['Overrides', 'Quota Bypasses', 'Admin Controls']
  },
  {
    id: 'admin-5',
    role: 'Administrator',
    step: '5. WhatsApp Meta Webhook & API Token Governance',
    title: 'WhatsApp Meta Webhook Setup & Broadcast Queue Management',
    description: 'Configure Meta Cloud API Permanent Access Tokens, verify Webhook callbacks (/api/whatsapp/webhook), monitor live message logs, and manage school-wide emergency broadcast dispatch queues.',
    tags: ['WhatsApp Meta', 'Webhook Config', 'Broadcast Queues']
  },
  {
    id: 'admin-6',
    role: 'Administrator',
    step: '6. SEO Audit Utility & Search Visibility Governance',
    title: 'Automated SEO Audit & Search Engine Indexability Governance',
    description: 'Monitor the Automated SEO Audit Utility under Admin Playbook. Ensure all public links, sitemaps, robots.txt, and JSON-LD structured schemas maintain 100% compliance for search engines and AI Overviews.',
    tags: ['SEO Audit', 'Search Visibility', 'Indexability']
  },

  // Educator
  {
    id: 'edu-1',
    role: 'Educator',
    step: '1. Curriculum Navigation & Objectives',
    title: 'Curriculum Navigation & National Objectives Alignment',
    description: 'Select your target Grade level (Kenyan CBC, Standard 8, or Form 1-4) and specify Subject, Strand, and Sub-strand to load national learning outcomes directly into the prompt engine.',
    tags: ['CBC Alignment', 'Curriculum', 'Grade Levels']
  },
  {
    id: 'edu-2',
    role: 'Educator',
    step: '2. Guided AI Generation & Differentiation',
    title: 'Guided AI Generation & Classroom Differentiation',
    description: 'Use the AI Document Studio to generate structured lesson plans, schemes of work, and study guides. Configure cognitive levels (Bloom\'s Taxonomy) and student differentiation options.',
    tags: ['AI Document Studio', 'Bloom\'s Taxonomy', 'Differentiation']
  },
  {
    id: 'edu-3',
    role: 'Educator',
    step: '3. Quality Audit & Auto-Fix',
    title: 'Pedagogical Quality Audit & One-Click Auto-Fix',
    description: 'Submit materials to the AI Expert Reviewer to obtain an official pedagogical score. Use the one-click "Auto-Fix" feature to refine unaligned objectives or ambiguous rubrics.',
    tags: ['Quality Score', 'Pedagogical Audit', 'Auto-Fix']
  },
  {
    id: 'edu-4',
    role: 'Educator',
    step: '4. Visual Video Enrichment & Export',
    title: 'Visual Video Enrichment & Multi-Format Export',
    description: 'Generate educational video clips in the AI Video Studio to demonstrate complex visual phenomena. Embed media into notes and export clean PDF or DOCX copies for print.',
    tags: ['AI Video Studio', 'Google Veo', 'PDF Export']
  },
  {
    id: 'edu-5',
    role: 'Educator',
    step: '5. Automated WhatsApp Homework Broadcasts',
    title: 'Automated WhatsApp Homework Broadcasts & Parent Reminders',
    description: 'Dispatch instant homework alerts, revision guides, and class announcements directly to student and parent WhatsApp groups using the WhatsApp Broadcast Dispatch tab.',
    tags: ['WhatsApp Broadcast', 'Homework Alerts', 'Parent Communication']
  },

  // Student
  {
    id: 'stu-1',
    role: 'Student',
    step: '1. Adaptive Trail Confidence Rating',
    title: 'Adaptive Trail Confidence Rating & Scaffolding',
    description: 'Rate your topic confidence (Low, Medium, High) in the Learning Path Workspace. Low confidence builds foundational scaffolding, while high confidence unlocks project challenges.',
    tags: ['Adaptive Learning', 'Confidence Rating', 'Scaffolding']
  },
  {
    id: 'stu-2',
    role: 'Student',
    step: '2. Socratic AI Tutor Assistance',
    title: 'Socratic AI Tutor & Interactive Problem Solving',
    description: 'When stuck on a concept, open the Socratic AI sidebar. The tutor asks guiding questions to help you discover answers independently, building critical problem-solving skills.',
    tags: ['Socratic AI', 'Interactive Tutor', 'Problem Solving']
  },
  {
    id: 'stu-3',
    role: 'Student',
    step: '3. Speech & Pronunciation Science',
    title: 'Speech & Pronunciation Science (Visual Phonetics)',
    description: 'Use the Visual Phonetics Studio to inspect tongue placement, velum movement, and vocal cord vibration animations for English and Swahili phonetic sound drills.',
    tags: ['Phonetics', 'Swahili & English', 'Speech Drills']
  },
  {
    id: 'stu-4',
    role: 'Student',
    step: '4. Personal Accessibility Settings',
    title: 'Personal Accessibility Settings & UDL Controls',
    description: 'Turn on Dyslexic font styling, adjust text line spacing, or enable multi-regional Text-to-Speech audio reading in Settings for a comfortable learning environment.',
    tags: ['Accessibility UDL', 'Dyslexia Font', 'Text-to-Speech']
  },
  {
    id: 'stu-5',
    role: 'Student',
    step: '5. WhatsApp 1-on-1 AI Tutor Guidance',
    title: 'WhatsApp 1-on-1 AI Tutor & Homework Photo Solver',
    description: 'Send math problems, homework photos, or voice notes directly to the official WhatsApp AI number (+254 704 360 522) for 24/7 Socratic learning assistance on your mobile phone.',
    tags: ['WhatsApp Tutor', 'Homework Photo Solver', 'Mobile Tutoring']
  },

  // Parent
  {
    id: 'par-1',
    role: 'Parent',
    step: '1. Competency Scorecard Review',
    title: 'Competency Scorecard Review & Progress Tracking',
    description: 'Check your child\'s competency ratings (Exceeding, Meeting, Approaching Expectation) across subject strands to celebrate achievements and identify revision needs.',
    tags: ['Competency Scorecard', 'Parent Monitoring', 'CBC Metrics']
  },
  {
    id: 'par-2',
    role: 'Parent',
    step: '2. Home Accessibility Profiles',
    title: 'Home Accessibility Profiles & UDL Customization',
    description: 'Configure specialized learner profiles (such as ADHD Focus scaffolding, Dyslexia typography, or Swahili/English TTS reading) in Settings to match home study needs.',
    tags: ['Home UDL', 'ADHD Focus', 'Parent Controls']
  },
  {
    id: 'par-3',
    role: 'Parent',
    step: '3. WhatsApp Parent Insights & Instant Circulars',
    title: 'WhatsApp Parent Insights & Instant School Notices',
    description: 'Receive real-time WhatsApp updates on your child\'s learning progress, homework completion, term dates, and school circulars without needing to download external apps.',
    tags: ['WhatsApp Insights', 'School Circulars', 'Parent Notifications']
  }
];

export default function AdminPlaybook() {
  const { user, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedModule, setExpandedModule] = useState<string | null>('curriculum-engine');
  const [activeTab, setActiveTab] = useState<'modules' | 'playbooks' | 'seo-audit' | 'pdf'>('modules');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const categories = ['all', 'Core Academic', 'Content Generation', 'Visual & Multimedia', 'Student Engagement', 'Specialized Learning', 'Assessment', 'Quality Assurance', 'Community', 'Universal Access', 'Administration'];

  const filteredModules = APP_MODULES.filter(m => {
    const matchesSearch = !searchTerm || 
                          m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.functionality.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.adminControls.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.capabilities.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredPlaybooks = ROLE_PLAYBOOKS.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.title.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.role.toLowerCase().includes(term) ||
      p.step.toLowerCase().includes(term) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
    );
  });

  const generatePDFPlaybook = () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let y = 20;

      const adminName = resolveDisplayName(profile?.displayName, profile?.email || user?.email, user?.displayName);
      const timestamp = new Date().toLocaleString();

      const addHeaderFooter = (pageNumber: number, totalPages?: number) => {
        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(95, 111, 82);
        doc.text("EDUNEXUS EDUCATIONAL PLATFORM — MASTER ADMIN PLAYBOOK & DIRECTORY", margin, 10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`CONFIDENTIAL • AUDIT STAMP: ${timestamp}`, pageWidth - margin, 10, { align: 'right' });
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, 12, pageWidth - margin, 12);

        // Footer
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("Official System Documentation • Authorized Administrative Personnel Only", margin, pageHeight - 7);
        doc.text(`Page ${pageNumber}${totalPages ? ` of ${totalPages}` : ''}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
      };

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 18) {
          doc.addPage();
          y = 20;
          addHeaderFooter(doc.getNumberOfPages());
        }
      };

      const addSectionHeading = (title: string, subtitle?: string) => {
        checkPageBreak(15);
        y += 4;
        doc.setFillColor(95, 111, 82);
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(title.toUpperCase(), margin + 4, y + 5.5);
        y += 12;

        if (subtitle) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          const lines = doc.splitTextToSize(subtitle, contentWidth);
          lines.forEach((l: string) => {
            checkPageBreak(5);
            doc.text(l, margin, y);
            y += 4.5;
          });
          y += 2;
        }
      };

      const addParagraph = (text: string, fontSize = 9.5, isBold = false, color = [51, 65, 85], indent = 0) => {
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        lines.forEach((line: string) => {
          checkPageBreak(5);
          doc.text(line, margin + indent, y);
          y += fontSize * 0.42 + 1.8;
        });
      };

      // --- COVER & HEADER BANNER ---
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(margin, 18, contentWidth, 32, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("EDUNEXUS PEDAGOGICAL PLATFORM", margin + 6, 28);
      doc.setFontSize(12);
      doc.setTextColor(169, 179, 136); // #a9b388 accent
      doc.text("Master Administrator Playbook & System Functionality Directory", margin + 6, 35);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225);
      doc.text(`Generated By: ${adminName} (${profile?.email || 'admin@nexused.edu'}) | Role: Administrator`, margin + 6, 42);
      doc.text(`Timestamp: ${timestamp} | Version: EduNexus 1.4.0 (Full-Stack)`, margin + 6, 46);

      y = 56;

      // --- EXECUTIVE SUMMARY ---
      addSectionHeading("1. Executive Platform Governance Overview", "Official operational mandates and structural governance principles for system administrators.");
      addParagraph("EduNexus is an enterprise-grade AI-powered educational orchestration platform built to streamline curriculum planning, lesson material generation, student engagement tracking, and Universal Design for Learning (UDL) accessibility. As an administrator, you hold root privileges to manage security policies, monitor AI model telemetry, enforce educational safety guidelines, and manage user accounts.");
      y += 2;
      addParagraph("Primary Administrative Responsibilities:", 9.5, true, [95, 111, 82]);
      addParagraph("• Monitor platform activity logs regularly to audit teacher uploads, student queries, and AI generation prompts.", 9, false, [71, 85, 105], 4);
      addParagraph("• Tune safety violation warning parameters (3-strike automatic suspension threshold).", 9, false, [71, 85, 105], 4);
      addParagraph("• Manage pre-registered accounts and assign appropriate roles (Administrator, Teacher, Student, Parent).", 9, false, [71, 85, 105], 4);
      addParagraph("• Oversee AI model dispatch routes (Gemini 3.5 Flash, Google Veo 2.0, Gemini Omni Flash).", 9, false, [71, 85, 105], 4);
      addParagraph("• Apply granular user overrides for specific faculties or exam review windows.", 9, false, [71, 85, 105], 4);

      y += 4;

      // --- SYSTEM MODULES DIRECTORY ---
      addSectionHeading("2. Detailed Application Directory (Parts, Functionalities & Capabilities)", "Comprehensive guide to all 10 core functional modules comprising the EduNexus environment.");

      APP_MODULES.forEach((mod, idx) => {
        checkPageBreak(30);
        y += 2;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, y, contentWidth, 7, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}. ${mod.title} [Category: ${mod.category}]`, margin + 3, y + 4.8);
        y += 10;

        addParagraph(`Summary: ${mod.summary}`, 9, false, [51, 65, 85]);
        y += 1;
        addParagraph("Core Capabilities & Features:", 9, true, [95, 111, 82]);
        mod.capabilities.forEach((cap) => {
          addParagraph(`• ${cap}`, 8.5, false, [71, 85, 105], 4);
        });
        y += 1;
        addParagraph(`Technical Functionality: ${mod.functionality}`, 8.5, false, [51, 65, 85]);
        addParagraph(`Administrative Control: ${mod.adminControls}`, 8.5, true, [95, 111, 82]);
        y += 3;
      });

      // --- ALL ROLE PLAYBOOKS ---
      addSectionHeading("3. Complete Standard Operating Playbooks by Role", "Operational guides tailored for Administrators, Educators, Students, and Parents.");

      // Admin Playbook
      checkPageBreak(25);
      addParagraph("A. Administrator Playbook (System Control & SOP)", 10, true, [15, 23, 42]);
      addParagraph("1. Daily System Health Check: Inspect the 'Recent Activity Audit Log' under the Admin tab for unauthorized login attempts or flagged policy violations.", 8.5, false, [71, 85, 105], 4);
      addParagraph("2. User Account Management: Use the User Management panel to pre-register new teaching staff, assign roles, or reset account credentials.", 8.5, false, [71, 85, 105], 4);
      addParagraph("3. Violation Mitigation: Issue official policy warnings to accounts exhibiting improper AI prompt usage. Accounts reaching 3 warnings are automatically suspended by Firestore security triggers.", 8.5, false, [71, 85, 105], 4);
      addParagraph("4. Granular Overrides: Grant temporary feature exemptions (e.g. extended AI video duration or relaxed rate limits) to designated staff during active curriculum development trials.", 8.5, false, [71, 85, 105], 4);
      y += 3;

      // Educator Playbook
      checkPageBreak(25);
      addParagraph("B. Educator Playbook (Lesson Planning & Classroom Instruction)", 10, true, [15, 23, 42]);
      addParagraph("1. Curriculum Selection: Choose the target Grade level (Kenyan CBC, Standard 8, or Form 1-4) and specify Subject, Strand, and Sub-strand.", 8.5, false, [71, 85, 105], 4);
      addParagraph("2. Guided AI Generation: Input core topic objectives into the AI Document Studio prompt builder, selecting Bloom's taxonomy targets and differentiation options.", 8.5, false, [71, 85, 105], 4);
      addParagraph("3. Quality Audit: Submit generated material to the AI Expert Reviewer to verify CBC alignment and cognitive depth scores prior to printing or sharing.", 8.5, false, [71, 85, 105], 4);
      addParagraph("4. Media Enrichment: Use the AI Video Studio to produce 5-second educational video clips demonstrating visual phenomena (e.g., cell division, rift valley formation) and embed them into student notes.", 8.5, false, [71, 85, 105], 4);
      addParagraph("5. Community Sharing: Publish finalized study guides to the Collaboration Hub for cross-school faculty access.", 8.5, false, [71, 85, 105], 4);
      y += 3;

      // Student Playbook
      checkPageBreak(25);
      addParagraph("C. Student Playbook (Adaptive Learning & Practice)", 10, true, [15, 23, 42]);
      addParagraph("1. Library Access: Open assigned study notes, schemes, and practice guides directly from 'My Library'.", 8.5, false, [71, 85, 105], 4);
      addParagraph("2. Learning Trail Navigation: Open the Learning Path Workspace and rate your confidence for each topic (Low, Medium, High) to dynamically recalibrate your learning route.", 8.5, false, [71, 85, 105], 4);
      addParagraph("3. Socratic Tutor Guidance: Use the Socratic AI sidebar to ask conceptual questions; the tutor provides hints and guiding questions rather than direct answers.", 8.5, false, [71, 85, 105], 4);
      addParagraph("4. Speech & Phonetics Practice: Practice articulation using the Visual Phonetics Studio diagram animations for challenging English or Swahili sounds.", 8.5, false, [71, 85, 105], 4);
      addParagraph("5. Personal Accessibility: Toggle Dyslexic font styling, high contrast, or screen reader TTS voices in Settings to optimize comfort.", 8.5, false, [71, 85, 105], 4);
      y += 3;

      // Parent Playbook
      checkPageBreak(25);
      addParagraph("D. Parent Playbook (Home Learning & Milestone Support)", 10, true, [15, 23, 42]);
      addParagraph("1. Progress Monitoring: Review your child's active learning path, completed micro-quizzes, and daily learning streaks.", 8.5, false, [71, 85, 105], 4);
      addParagraph("2. Competency Scorecard Review: Inspect CBC competency ratings (Exceeding, Meeting, Approaching Expectation) to identify specific areas needing home revision.", 8.5, false, [71, 85, 105], 4);
      addParagraph("3. Home Accommodation Setup: Set up appropriate accessibility profiles (e.g. ADHD Focus mode, Dyslexia typography, or Swahili/English TTS reading) in Settings.", 8.5, false, [71, 85, 105], 4);
      addParagraph("4. Study Guide Backup: Export PDF study guides or practice test papers for offline weekend study sessions.", 8.5, false, [71, 85, 105], 4);
      y += 4;

      // --- UDL & ACCESSIBILITY ---
      addSectionHeading("4. Universal Design for Learning (UDL) Audit & Standards", "Compliance documentation for physical, visual, cognitive, and sensory accessibility features.");
      addParagraph("• Dyslexia & Typography: Features Comic Neue typography with heavy stems and asymmetric weights, coupled with relaxed character and paragraph line-heights to eliminate letter mirroring.", 8.5, false, [71, 85, 105], 4);
      addParagraph("• ADHD Scaffolding: Implements structured bullet points, micro-milestone checkable lists, clear visual indicators, and a gamified daily activity streak tracker.", 8.5, false, [71, 85, 105], 4);
      addParagraph("• Auditory & Visual Impairments: Multi-regional TTS synthesized audio reader supporting US, UK, Indian, Swahili, and West African accents, alongside high-contrast dark/light mode options.", 8.5, false, [71, 85, 105], 4);

      y += 4;

      // --- SECURITY & COMPLIANCE ---
      addSectionHeading("5. Security, Data Privacy & Infrastructure Governance", "Cloud architecture, Firestore security rules, API proxy protections, and compliance standards.");
      addParagraph("• Server-Side Proxy Isolation: All API keys (including GEMINI_API_KEY) are kept strictly server-side in container environment variables. Client requests route through secure `/api/*` endpoints.", 8.5, false, [71, 85, 105], 4);
      addParagraph("• Firestore Rule Security: User document access is gated by user UID, role claims, and administrator override validation.", 8.5, false, [71, 85, 105], 4);
      addParagraph("• Offline Synchronization: Local state is safely preserved in browser storage when network connectivity drops, syncing seamlessly upon reconnection.", 8.5, false, [71, 85, 105], 4);

      // Add Headers & Footers to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addHeaderFooter(i, totalPages);
      }

      // Save PDF
      doc.save(`EduNexus_Admin_Playbook_System_Directory_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("An error occurred while generating the Admin Playbook PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8 text-slate-100 font-sans animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[#5f6f52] to-[#3a4732] border border-[#a9b388]/30 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
            <Shield className="w-8 h-8 text-[#a9b388]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-[#5f6f52]/20 border border-[#a9b388]/30 text-[#a9b388] rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                Master Governance
              </span>
              <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                Confidential
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-white tracking-tight">
              Administrators' Master Playbook & Application Directory
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Complete blueprint detailing all 10 application modules, capabilities, technical functionalities, administrative controls, and role-based standard operating playbooks.
            </p>
          </div>
        </div>

        {/* PDF Download Button */}
        <button
          onClick={generatePDFPlaybook}
          disabled={isGeneratingPDF}
          className="w-full lg:w-auto px-6 py-3.5 bg-gradient-to-r from-[#5f6f52] to-[#4a583e] hover:from-[#6b7c5c] hover:to-[#556447] text-white font-bold text-xs rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center gap-3 border border-[#a9b388]/40 disabled:opacity-50 shrink-0 group"
        >
          {isGeneratingPDF ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating Official PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-[#a9b388] group-hover:translate-y-0.5 transition-transform" />
              <span>Generate & Download Admin Playbook (PDF)</span>
            </>
          )}
        </button>
      </div>

      {/* Global Search & Quick Policy Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#a9b388] absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search system policies, modules, capabilities, administrative controls, or role playbooks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-[#a9b388] rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchTerm && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 shrink-0">
              <span className="text-[#a9b388]">Filtered Results:</span>
              <span className="text-emerald-400">{filteredModules.length} Modules</span>
              <span>•</span>
              <span className="text-sky-400">{filteredPlaybooks.length} Policies</span>
            </div>
          )}
        </div>

        {/* Quick Filter Tag Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mr-1">Quick Search Tags:</span>
          {[
            { label: '3-Strike Policy', query: '3-Strike' },
            { label: 'Audit Log', query: 'Audit Log' },
            { label: 'WhatsApp Meta', query: 'WhatsApp' },
            { label: 'Broadcasts', query: 'Broadcast' },
            { label: 'CBC Alignment', query: 'CBC' },
            { label: 'Socratic AI', query: 'Socratic AI' },
            { label: 'Accessibility UDL', query: 'Dyslexia' },
            { label: 'Veo Video', query: 'Veo' },
            { label: 'PDF Export', query: 'PDF' },
          ].map((tag) => (
            <button
              key={tag.label}
              onClick={() => setSearchTerm(searchTerm === tag.query ? '' : tag.query)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                searchTerm.toLowerCase() === tag.query.toLowerCase()
                  ? 'bg-[#5f6f52] text-white border-[#a9b388] shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              #{tag.label}
            </button>
          ))}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:underline ml-auto cursor-pointer"
            >
              Reset Search Filter
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'modules'
                ? 'bg-[#5f6f52] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>App Parts & Capabilities ({filteredModules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('playbooks')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'playbooks'
                ? 'bg-[#5f6f52] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Role Standard Playbooks ({filteredPlaybooks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('seo-audit')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'seo-audit'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>SEO Audit Utility & Logs</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 px-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>EduNexus v1.4.0 Engine</span>
        </div>
      </div>

      {/* TAB 1: MODULES & CAPABILITIES */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Category Filter:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#a9b388] shrink-0"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Showing <strong className="text-white font-bold">{filteredModules.length}</strong> of {APP_MODULES.length} modules
            </div>
          </div>

          {/* Module Grid / Cards */}
          <div className="space-y-4">
            {filteredModules.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-3">
                <Search className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No application modules matched your search filters.</p>
                <button
                  onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                  className="text-xs font-bold text-[#a9b388] hover:underline"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              filteredModules.map((mod) => {
                const isExpanded = expandedModule === mod.id;
                return (
                  <div
                    key={mod.id}
                    className={`bg-slate-950/70 border rounded-2xl transition-all duration-200 overflow-hidden ${
                      isExpanded ? 'border-[#a9b388]/50 shadow-xl' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-[#a9b388] shrink-0">
                          {mod.iconName === 'BookOpen' && <BookOpen className="w-5 h-5" />}
                          {mod.iconName === 'FileText' && <FileText className="w-5 h-5" />}
                          {mod.iconName === 'Video' && <Video className="w-5 h-5" />}
                          {mod.iconName === 'Sparkles' && <Sparkles className="w-5 h-5" />}
                          {mod.iconName === 'Volume2' && <Volume2 className="w-5 h-5" />}
                          {mod.iconName === 'Award' && <Award className="w-5 h-5" />}
                          {mod.iconName === 'Activity' && <Activity className="w-5 h-5" />}
                          {mod.iconName === 'Users' && <Users className="w-5 h-5" />}
                          {mod.iconName === 'Sliders' && <Sliders className="w-5 h-5" />}
                          {mod.iconName === 'Shield' && <Shield className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#a9b388] bg-[#5f6f52]/20 border border-[#a9b388]/20 px-2 py-0.5 rounded-md">
                              {mod.category}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-white tracking-tight">{mod.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{mod.summary}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                          {mod.capabilities.length} Features
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-[#a9b388]" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-5 border-t border-slate-800/80 bg-slate-900/40 space-y-5 text-xs">
                        {/* Capabilities List */}
                        <div className="space-y-2">
                          <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-[#a9b388]">
                            Key Capabilities & Functional Features
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {mod.capabilities.map((cap, i) => (
                              <div key={i} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                                <CheckCircle className="w-4 h-4 text-[#a9b388] shrink-0 mt-0.5" />
                                <span className="text-slate-300 leading-relaxed">{cap}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Technical Functionality */}
                        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
                          <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-slate-300 flex items-center gap-2">
                            <Cpu className="w-3.5 h-3.5 text-sky-400" />
                            Technical Functionality & Engine
                          </h4>
                          <p className="text-slate-300 leading-relaxed">{mod.functionality}</p>
                        </div>

                        {/* Admin Controls */}
                        <div className="bg-slate-950/80 p-4 rounded-xl border border-[#5f6f52]/40 space-y-1.5">
                          <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-[#a9b388] flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-[#a9b388]" />
                            Administrative Controls & Oversight
                          </h4>
                          <p className="text-slate-300 leading-relaxed">{mod.adminControls}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ALL ROLE PLAYBOOKS */}
      {activeTab === 'playbooks' && (
        <div className="space-y-8">
          {filteredPlaybooks.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-3">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No role playbook policies matched "{searchTerm}".</p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs font-bold text-[#a9b388] hover:underline cursor-pointer"
              >
                Clear search filters
              </button>
            </div>
          ) : (
            <>
              {/* Administrator Playbook */}
              {filteredPlaybooks.some(p => p.role === 'Administrator') && (
                <div className="bg-slate-950/80 border border-[#5f6f52]/50 rounded-2xl p-6 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-[#a9b388]" />
                      <div>
                        <h3 className="text-lg font-bold text-white">Administrator Playbook (System Control SOP)</h3>
                        <p className="text-xs text-slate-400">Root operational mandates, audit logging procedures, and policy enforcement protocols.</p>
                      </div>
                    </div>
                    {searchTerm && (
                      <span className="text-[10px] font-extrabold px-2.5 py-1 bg-[#5f6f52]/20 text-[#a9b388] rounded-full border border-[#a9b388]/30">
                        {filteredPlaybooks.filter(p => p.role === 'Administrator').length} Matched
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {filteredPlaybooks.filter(p => p.role === 'Administrator').map(policy => (
                      <div key={policy.id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-[#a9b388]/40 transition">
                        <span className="font-extrabold text-[#a9b388] text-[10px] uppercase block">{policy.step}</span>
                        <h4 className="font-bold text-white text-xs">{policy.title}</h4>
                        <p className="text-slate-300 leading-relaxed">{policy.description}</p>
                        {policy.tags && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {policy.tags.map(t => (
                              <button
                                key={t}
                                onClick={() => setSearchTerm(t)}
                                className="px-2 py-0.5 bg-slate-950 text-[9px] font-bold text-slate-400 hover:text-[#a9b388] rounded-md border border-slate-800 transition cursor-pointer"
                              >
                                #{t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Educator Playbook */}
              {filteredPlaybooks.some(p => p.role === 'Educator') && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-6 h-6 text-sky-400" />
                      <div>
                        <h3 className="text-lg font-bold text-white">Educator Playbook (Teacher Operations Manual)</h3>
                        <p className="text-xs text-slate-400">Step-by-step workflow for lesson planning, material generation, quality audit, and media enrichment.</p>
                      </div>
                    </div>
                    {searchTerm && (
                      <span className="text-[10px] font-extrabold px-2.5 py-1 bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/20">
                        {filteredPlaybooks.filter(p => p.role === 'Educator').length} Matched
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {filteredPlaybooks.filter(p => p.role === 'Educator').map(policy => (
                      <div key={policy.id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-sky-500/40 transition">
                        <span className="font-extrabold text-sky-400 text-[10px] uppercase block">{policy.step}</span>
                        <h4 className="font-bold text-white text-xs">{policy.title}</h4>
                        <p className="text-slate-300 leading-relaxed">{policy.description}</p>
                        {policy.tags && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {policy.tags.map(t => (
                              <button
                                key={t}
                                onClick={() => setSearchTerm(t)}
                                className="px-2 py-0.5 bg-slate-950 text-[9px] font-bold text-slate-400 hover:text-sky-400 rounded-md border border-slate-800 transition cursor-pointer"
                              >
                                #{t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Playbook */}
              {filteredPlaybooks.some(p => p.role === 'Student') && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-amber-400" />
                      <div>
                        <h3 className="text-lg font-bold text-white">Student Playbook (Self-Paced Learning Guide)</h3>
                        <p className="text-xs text-slate-400">Navigating adaptive learning pathways, engaging Socratic AI tutors, and phonetics practice.</p>
                      </div>
                    </div>
                    {searchTerm && (
                      <span className="text-[10px] font-extrabold px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                        {filteredPlaybooks.filter(p => p.role === 'Student').length} Matched
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {filteredPlaybooks.filter(p => p.role === 'Student').map(policy => (
                      <div key={policy.id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-amber-500/40 transition">
                        <span className="font-extrabold text-amber-400 text-[10px] uppercase block">{policy.step}</span>
                        <h4 className="font-bold text-white text-xs">{policy.title}</h4>
                        <p className="text-slate-300 leading-relaxed">{policy.description}</p>
                        {policy.tags && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {policy.tags.map(t => (
                              <button
                                key={t}
                                onClick={() => setSearchTerm(t)}
                                className="px-2 py-0.5 bg-slate-950 text-[9px] font-bold text-slate-400 hover:text-amber-400 rounded-md border border-slate-800 transition cursor-pointer"
                              >
                                #{t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parent Playbook */}
              {filteredPlaybooks.some(p => p.role === 'Parent') && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-purple-400" />
                      <div>
                        <h3 className="text-lg font-bold text-white">Parent Playbook (Home Study & Progress Monitoring)</h3>
                        <p className="text-xs text-slate-400">Monitoring learner milestones, reviewing competency scorecards, and setting up home learning profiles.</p>
                      </div>
                    </div>
                    {searchTerm && (
                      <span className="text-[10px] font-extrabold px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                        {filteredPlaybooks.filter(p => p.role === 'Parent').length} Matched
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {filteredPlaybooks.filter(p => p.role === 'Parent').map(policy => (
                      <div key={policy.id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-purple-500/40 transition">
                        <span className="font-extrabold text-purple-400 text-[10px] uppercase block">{policy.step}</span>
                        <h4 className="font-bold text-white text-xs">{policy.title}</h4>
                        <p className="text-slate-300 leading-relaxed">{policy.description}</p>
                        {policy.tags && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {policy.tags.map(t => (
                              <button
                                key={t}
                                onClick={() => setSearchTerm(t)}
                                className="px-2 py-0.5 bg-slate-950 text-[9px] font-bold text-slate-400 hover:text-purple-400 rounded-md border border-slate-800 transition cursor-pointer"
                              >
                                #{t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 3: SEO AUDIT UTILITY & LOGS */}
      {activeTab === 'seo-audit' && (
        <div className="space-y-6">
          <SEOAuditWidget autoScanIntervalSeconds={60} />
        </div>
      )}

      {/* Footer Disclaimer & Metadata */}
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#a9b388]" />
          <span>EduNexus Authorized Personnel Access • Version 1.4.0</span>
        </div>
        <div>
          <span>Database Sync: 🟢 FIRESTORE ONLINE</span>
        </div>
      </div>
    </div>
  );
}
