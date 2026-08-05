import { useEffect } from 'react';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  keywords?: string;
  ogType?: string;
  ogImage?: string;
  noIndex?: boolean;
  docTitle?: string;
  activeTab?: string;
}

const DEFAULT_TITLE = 'EduNexus | AI Learning Platform for Students, Teachers & Schools';
const DEFAULT_DESC = 'EduNexus is an AI-powered education platform that helps students master concepts, assists teachers with lesson preparation, enables parents to monitor learner progress, and empowers schools with intelligent educational tools.';
const BASE_URL = 'https://joinedunexus.app';
const DEFAULT_IMAGE = `${BASE_URL}/og-banner.png`;

export default function SEOHead({
  title,
  description,
  canonicalUrl,
  keywords,
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  noIndex = false,
  docTitle,
  activeTab
}: SEOHeadProps) {

  useEffect(() => {
    // 1. Determine Title
    let pageTitle = title;
    if (!pageTitle) {
      if (docTitle) {
        pageTitle = `${docTitle} | EduNexus Curriculum Resource`;
      } else if (activeTab === 'tutor') {
        pageTitle = 'EduNexus AI Tutor | Learn Smarter with Artificial Intelligence';
      } else if (activeTab === 'create') {
        pageTitle = 'EduNexus Teacher Assistant | Lesson Plans, Exams & Teaching Resources';
      } else if (activeTab === 'performance') {
        pageTitle = 'EduNexus Parent Portal | Track Student Progress & Milestones';
      } else if (activeTab === 'admin') {
        pageTitle = 'EduNexus School Administration Platform | Intelligent School Operations';
      } else if (activeTab === 'resources') {
        pageTitle = 'EduNexus Global Resources | Verified Curriculum Materials';
      } else if (activeTab === 'assessment-generator') {
        pageTitle = 'EduNexus Assessment Generator | AI Exams, Quizzes & Rubrics';
      } else if (activeTab === 'voice-notes') {
        pageTitle = 'EduNexus Voice Notebook | Interactive Audio Learning & Transcripts';
      } else if (activeTab === 'file-library') {
        pageTitle = 'EduNexus File Library | Classroom Documents & Attachments';
      } else if (activeTab === 'image-studio') {
        pageTitle = 'EduNexus Visual Learning Studio | AI Educational Illustrations';
      } else if (activeTab === 'video-studio') {
        pageTitle = 'EduNexus Video Studio | AI Pedagogical Video Explainers';
      } else if (activeTab === 'phonetics') {
        pageTitle = 'EduNexus Visual Phonetics Studio | Interactive Pronunciation';
      } else if (activeTab === 'qr-mapping') {
        pageTitle = 'EduNexus Station QR Mapper | Interactive Scavenger Hunt';
      } else if (activeTab === 'virtual-field-trip') {
        pageTitle = 'EduNexus Virtual Field Trip Studio | Immersive AI Field Trips';
      } else if (activeTab === 'settings') {
        pageTitle = 'EduNexus Settings | Account & Preferences';
      } else {
        pageTitle = DEFAULT_TITLE;
      }
    }

    document.title = pageTitle;

    // 2. Determine Description
    let pageDesc = description;
    if (!pageDesc) {
      if (docTitle) {
        pageDesc = `View and study ${docTitle} on EduNexus. AI-generated, curriculum-aligned educational materials for students, teachers, and parents.`;
      } else if (activeTab === 'tutor') {
        pageDesc = 'Master any subject with EduNexus AI Tutor. Get 1-on-1 Socratic guidance, step-by-step problem solving, voice notebook assistance, and instant feedback.';
      } else if (activeTab === 'create') {
        pageDesc = 'Empower your teaching with EduNexus Teacher Assistant. Generate CBC curriculum-aligned lesson plans, schemes of work, differentiated worksheets, and rubrics in seconds.';
      } else if (activeTab === 'performance') {
        pageDesc = 'Monitor student academic performance, daily learning streaks, topic mastery, and automated WhatsApp notifications in the EduNexus Parent Portal.';
      } else if (activeTab === 'admin') {
        pageDesc = 'Manage school analytics, teacher curriculum coverage, learner performance telemetry, and system policies with the EduNexus School Administration Platform.';
      } else {
        pageDesc = DEFAULT_DESC;
      }
    }

    // Helper to set or create meta tag
    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to set link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // Meta Description & Keywords
    setMetaTag('meta[name="description"]', 'name', 'description', pageDesc);
    if (keywords) {
      setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
    }

    // Robots Meta Tag
    const isPrivateTab = activeTab === 'admin' || activeTab === 'settings';
    const robotsContent = (noIndex || isPrivateTab) 
      ? 'noindex, nofollow' 
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    setMetaTag('meta[name="robots"]', 'name', 'robots', robotsContent);

    // Canonical URL
    let targetCanonical = canonicalUrl;
    if (!targetCanonical) {
      if (activeTab && activeTab !== 'dashboard') {
        targetCanonical = `${BASE_URL}/?tab=${activeTab}`;
      } else {
        targetCanonical = `${BASE_URL}${window.location.pathname}`;
      }
    }
    setLinkTag('canonical', targetCanonical);

    // Open Graph Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', pageTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', pageDesc);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', targetCanonical);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);

    // Twitter Cards
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', pageDesc);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    // Dynamic Breadcrumb Schema Injector
    let breadcrumbLd = document.getElementById('edunexus-breadcrumb-schema');
    if (!breadcrumbLd) {
      breadcrumbLd = document.createElement('script');
      breadcrumbLd.id = 'edunexus-breadcrumb-schema';
      breadcrumbLd.setAttribute('type', 'application/ld+json');
      document.head.appendChild(breadcrumbLd);
    }

    const currentTabName = activeTab ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ') : 'Home';
    breadcrumbLd.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': BASE_URL
        },
        ...(activeTab && activeTab !== 'dashboard' ? [{
          '@type': 'ListItem',
          'position': 2,
          'name': currentTabName,
          'item': targetCanonical
        }] : [])
      ]
    });

  }, [title, description, canonicalUrl, keywords, ogType, ogImage, noIndex, docTitle, activeTab]);

  return null;
}
