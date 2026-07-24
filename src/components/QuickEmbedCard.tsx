import React, { useState, useEffect } from 'react';
import { 
  Globe, ExternalLink, Loader2, Video, FileText, 
  HelpCircle, BookOpen, Layers, Sparkles, CheckCircle 
} from 'lucide-react';

interface UrlMetadata {
  title: string;
  description: string;
  siteName: string;
  domain: string;
  favicon: string;
  url: string;
}

interface QuickEmbedCardProps {
  url: string;
  key?: string;
}

export default function QuickEmbedCard({ url }: QuickEmbedCardProps) {
  const [metadata, setMetadata] = useState<UrlMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchMetadata() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/fetch-url-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error('Failed to load url preview');
        }

        const data = await response.json();
        if (isMounted) {
          setMetadata(data);
          setError(null);
        }
      } catch (err: any) {
        console.warn('Error fetching embed metadata for url:', url, err);
        if (isMounted) {
          // Derive safe fallbacks on error so the card still displays perfectly
          let domain = 'External Site';
          try {
            domain = new URL(url).hostname.replace('www.', '');
          } catch (_) {}
          
          setMetadata({
            title: domain.charAt(0).toUpperCase() + domain.slice(1),
            description: `Click to open and explore the external educational resource at ${domain}.`,
            siteName: domain,
            domain,
            favicon: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
            url
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchMetadata();

    return () => {
      isMounted = false;
    };
  }, [url]);

  // Determine resource type and custom colors based on URL domain/path
  const getResourceDetails = () => {
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com')) {
      return {
        label: 'Video Resource',
        bg: 'bg-red-50/50 border-red-150',
        text: 'text-red-700',
        icon: <Video className="w-4 h-4 text-red-500" />
      };
    }
    if (lower.endsWith('.pdf')) {
      return {
        label: 'PDF Document',
        bg: 'bg-rose-50/50 border-rose-150',
        text: 'text-rose-700',
        icon: <FileText className="w-4 h-4 text-rose-500" />
      };
    }
    if (lower.includes('phet.colorado.edu')) {
      return {
        label: 'Interactive Simulation',
        bg: 'bg-emerald-50/50 border-emerald-150',
        text: 'text-emerald-700',
        icon: <Sparkles className="w-4 h-4 text-emerald-500" />
      };
    }
    if (lower.includes('wikipedia.org') || lower.includes('britannica.com')) {
      return {
        label: 'Reference Encyclopedia',
        bg: 'bg-slate-50 border-slate-200',
        text: 'text-slate-700',
        icon: <BookOpen className="w-4 h-4 text-slate-600" />
      };
    }
    if (lower.includes('khanacademy.org')) {
      return {
        label: 'Khan Academy Lesson',
        bg: 'bg-teal-50/50 border-teal-150',
        text: 'text-teal-700',
        icon: <Layers className="w-4 h-4 text-teal-600" />
      };
    }
    return {
      label: 'External Resource',
      bg: 'bg-indigo-50/30 border-indigo-150',
      text: 'text-indigo-700',
      icon: <Globe className="w-4 h-4 text-indigo-500" />
    };
  };

  const details = getResourceDetails();

  if (isLoading) {
    return (
      <div className="my-4 p-4 bg-white rounded-xl border border-slate-150 shadow-2xs flex items-center gap-4 animate-pulse">
        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-3.5 bg-slate-100 rounded w-1/3"></div>
          <div className="h-3 bg-slate-100 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!metadata) return null;

  return (
    <div className={`my-4 overflow-hidden rounded-2xl border ${details.bg} shadow-sm hover:shadow-md transition-all duration-300 group/embed-card bg-white`}>
      <div className="p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Favicon or Icon container */}
          <div className="w-11 h-11 rounded-xl bg-white border border-slate-150 shadow-xs flex items-center justify-center shrink-0 p-1">
            <img 
              src={metadata.favicon} 
              alt={metadata.siteName}
              onError={(e) => {
                // If favicon loading fails, replace it with the fallback Lucide icon
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
              className="w-full h-full object-contain"
            />
            {details.icon}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${details.bg} ${details.text} border border-current/10 font-mono`}>
                {details.label}
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                {metadata.domain}
              </span>
            </div>
            
            <h4 className="text-xs font-extrabold text-slate-800 truncate group-hover/embed-card:text-indigo-600 transition-colors">
              {metadata.title}
            </h4>
            
            <p className="text-[11px] text-slate-500 leading-normal font-medium line-clamp-2">
              {metadata.description}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 w-full md:w-auto pt-2 md:pt-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full md:w-auto px-4.5 py-2.5 bg-slate-900 text-white hover:bg-indigo-600 text-[11px] font-extrabold rounded-xl transition duration-200 cursor-pointer shadow-sm"
          >
            <span>Explore Resource</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
}
