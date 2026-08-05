export interface SEOAuditItem {
  id: string;
  category: 'Meta Tags' | 'Internal Public Links' | 'Structured Data Schema' | 'Favicon & Assets' | 'Security & Crawlability';
  target: string;
  status: 'passed' | 'warning' | 'failed';
  message: string;
  recommendation?: string;
  lastChecked: string;
}

export interface SEOAuditReport {
  score: number; // 0 to 100
  totalChecks: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  lastScanTimestamp: string;
  items: SEOAuditItem[];
}

/**
 * Runs a comprehensive lightweight client & network SEO audit.
 * Scans DOM meta tags, canonical link, JSON-LD schemas, favicons, and internal public endpoints.
 */
export async function runSEOAudit(): Promise<SEOAuditReport> {
  const items: SEOAuditItem[] = [];
  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 1. Meta Tag Audits (DOM Inspection)
  const metaTitle = document.title;
  if (metaTitle && metaTitle.includes('EduNexus') && metaTitle.length >= 10) {
    items.push({
      id: 'meta-title',
      category: 'Meta Tags',
      target: '<title>',
      status: 'passed',
      message: `Document title present and branded: "${metaTitle.slice(0, 50)}..."`,
      lastChecked: now,
    });
  } else {
    items.push({
      id: 'meta-title',
      category: 'Meta Tags',
      target: '<title>',
      status: 'failed',
      message: 'Document title is missing or unbranded.',
      recommendation: 'Set document.title with EduNexus brand name and descriptive section title.',
      lastChecked: now,
    });
  }

  const descMeta = document.querySelector('meta[name="description"]')?.getAttribute('content');
  if (descMeta && descMeta.length >= 40) {
    items.push({
      id: 'meta-desc',
      category: 'Meta Tags',
      target: 'meta[name="description"]',
      status: 'passed',
      message: `Meta description verified (${descMeta.length} chars).`,
      lastChecked: now,
    });
  } else {
    items.push({
      id: 'meta-desc',
      category: 'Meta Tags',
      target: 'meta[name="description"]',
      status: 'warning',
      message: descMeta ? 'Meta description is too short (<40 chars).' : 'Meta description tag is missing.',
      recommendation: 'Provide a rich 120–160 character description summarizing EduNexus platform capabilities.',
      lastChecked: now,
    });
  }

  const canonicalLink = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
  if (canonicalLink && canonicalLink.startsWith('https://joinedunexus.app')) {
    items.push({
      id: 'meta-canonical',
      category: 'Meta Tags',
      target: 'link[rel="canonical"]',
      status: 'passed',
      message: `Canonical URL defined: ${canonicalLink}`,
      lastChecked: now,
    });
  } else {
    items.push({
      id: 'meta-canonical',
      category: 'Meta Tags',
      target: 'link[rel="canonical"]',
      status: 'failed',
      message: 'Canonical URL link tag is missing or not pointing to joinedunexus.app.',
      recommendation: 'Ensure <link rel="canonical" href="https://joinedunexus.app..."> is declared in head.',
      lastChecked: now,
    });
  }

  // Open Graph & Twitter Card Tags
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
  const twitterCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content');

  if (ogTitle && ogImage && twitterCard) {
    items.push({
      id: 'meta-social',
      category: 'Meta Tags',
      target: 'og:title, og:image, twitter:card',
      status: 'passed',
      message: 'Open Graph and Twitter social sharing metadata fully active.',
      lastChecked: now,
    });
  } else {
    items.push({
      id: 'meta-social',
      category: 'Meta Tags',
      target: 'og:title, og:image, twitter:card',
      status: 'warning',
      message: 'Some social card metadata tags are missing.',
      recommendation: 'Verify og:title, og:image, and twitter:card meta properties.',
      lastChecked: now,
    });
  }

  // Robots meta tag
  const robotsTag = document.querySelector('meta[name="robots"]')?.getAttribute('content');
  if (robotsTag) {
    items.push({
      id: 'meta-robots',
      category: 'Security & Crawlability',
      target: 'meta[name="robots"]',
      status: 'passed',
      message: `Robots directive active: "${robotsTag}"`,
      lastChecked: now,
    });
  } else {
    items.push({
      id: 'meta-robots',
      category: 'Security & Crawlability',
      target: 'meta[name="robots"]',
      status: 'warning',
      message: 'Robots meta tag not found.',
      recommendation: 'Declare robots meta tag to guide search engine crawlers.',
      lastChecked: now,
    });
  }

  // 2. Structured Data Schema Inspection & Breadcrumb Navigation Audit
  const ldJsonScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  let hasOrgSchema = false;
  let hasAppSchema = false;
  let hasFaqSchema = false;
  let hasBreadcrumbSchema = false;

  ldJsonScripts.forEach((script) => {
    try {
      const content = script.textContent || '';
      if (content.includes('EducationalOrganization')) hasOrgSchema = true;
      if (content.includes('SoftwareApplication')) hasAppSchema = true;
      if (content.includes('FAQPage')) hasFaqSchema = true;
      if (content.includes('BreadcrumbList')) hasBreadcrumbSchema = true;
    } catch {
      // ignore
    }
  });

  const hasBreadcrumbNav = !!document.querySelector('nav[aria-label*="Breadcrumb"]') || !!document.querySelector('[itemtype*="BreadcrumbList"]');

  if (hasBreadcrumbSchema && hasBreadcrumbNav) {
    items.push({
      id: 'schema-breadcrumb',
      category: 'Structured Data Schema',
      target: 'Breadcrumb Navigation & Schema.org JSON-LD',
      status: 'passed',
      message: 'Visual Breadcrumb Navigation and Schema.org BreadcrumbList JSON-LD verified.',
      lastChecked: now,
    });
  } else {
    items.push({
      id: 'schema-breadcrumb',
      category: 'Structured Data Schema',
      target: 'Breadcrumb Navigation & Schema.org JSON-LD',
      status: 'warning',
      message: 'Breadcrumb navigation or JSON-LD schema missing.',
      recommendation: 'Ensure Breadcrumbs component renders visual links and injects BreadcrumbList JSON-LD into head.',
      lastChecked: now,
    });
  }

  if (hasOrgSchema && hasAppSchema && hasFaqSchema) {
    items.push({
      id: 'schema-jsonld',
      category: 'Structured Data Schema',
      target: 'Schema.org JSON-LD Graphs',
      status: 'passed',
      message: 'Schema.org EducationalOrganization, SoftwareApplication, and FAQPage graphs validated.',
      lastChecked: now,
    });
  } else {
    items.push({
      id: 'schema-jsonld',
      category: 'Structured Data Schema',
      target: 'Schema.org JSON-LD Graphs',
      status: 'warning',
      message: `Partial Schema JSON-LD detected (Org: ${hasOrgSchema ? '✓' : '✗'}, App: ${hasAppSchema ? '✓' : '✗'}, FAQ: ${hasFaqSchema ? '✓' : '✗'}).`,
      recommendation: 'Include complete EducationalOrganization, SoftwareApplication, and FAQPage JSON-LD structures.',
      lastChecked: now,
    });
  }

  // 3. Favicon & Web Manifest Files Check
  const faviconIco = document.querySelector('link[rel="icon"][href="/favicon.ico"]');
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (faviconIco && manifestLink) {
    items.push({
      id: 'favicon-manifest',
      category: 'Favicon & Assets',
      target: 'favicon.ico & site.webmanifest',
      status: 'passed',
      message: 'Favicon suite and webmanifest references verified in DOM.',
      lastChecked: now,
    });
  } else {
    items.push({
      id: 'favicon-manifest',
      category: 'Favicon & Assets',
      target: 'favicon.ico & site.webmanifest',
      status: 'warning',
      message: 'Missing explicit favicon.ico or manifest link tag.',
      recommendation: 'Ensure <link rel="icon" href="/favicon.ico"> and <link rel="manifest"> are present.',
      lastChecked: now,
    });
  }

  // 4. Internal Public Endpoints Network Checks
  const publicEndpoints = [
    { name: 'Sitemap XML', url: '/sitemap.xml' },
    { name: 'Robots TXT', url: '/robots.txt' },
    { name: 'Web Manifest', url: '/site.webmanifest' },
    { name: 'Favicon 32x32 PNG', url: '/favicon-32x32.png' },
    { name: 'Social OG Banner', url: '/og-banner.png' },
  ];

  await Promise.all(
    publicEndpoints.map(async (ep) => {
      try {
        const res = await fetch(ep.url, { method: 'HEAD' });
        if (res.ok || res.status === 304) {
          items.push({
            id: `endpoint-${ep.name.toLowerCase().replace(/\s+/g, '-')}`,
            category: 'Internal Public Links',
            target: ep.url,
            status: 'passed',
            message: `Public endpoint "${ep.name}" responded with HTTP ${res.status}.`,
            lastChecked: now,
          });
        } else {
          items.push({
            id: `endpoint-${ep.name.toLowerCase().replace(/\s+/g, '-')}`,
            category: 'Internal Public Links',
            target: ep.url,
            status: 'failed',
            message: `Public endpoint "${ep.name}" returned HTTP status ${res.status}.`,
            recommendation: `Check server routing and public directory for ${ep.url}`,
            lastChecked: now,
          });
        }
      } catch (err: any) {
        items.push({
          id: `endpoint-${ep.name.toLowerCase().replace(/\s+/g, '-')}`,
          category: 'Internal Public Links',
          target: ep.url,
          status: 'warning',
          message: `Could not connect to "${ep.name}": ${err?.message || 'Fetch error'}`,
          recommendation: `Verify network accessibility for ${ep.url}`,
          lastChecked: now,
        });
      }
    })
  );

  // Calculate Health Score
  const total = items.length;
  const passed = items.filter(i => i.status === 'passed').length;
  const warning = items.filter(i => i.status === 'warning').length;
  const failed = items.filter(i => i.status === 'failed').length;

  const score = Math.max(0, Math.round(((passed + warning * 0.5) / total) * 100));

  return {
    score,
    totalChecks: total,
    passedCount: passed,
    warningCount: warning,
    failedCount: failed,
    lastScanTimestamp: now,
    items,
  };
}
