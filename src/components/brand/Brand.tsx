import React from 'react';

/**
 * Single source of truth for EduNexus brand identity.
 * Use <BrandLogo /> everywhere a logo appears and BRAND.* for names/taglines,
 * so the product never shows two logos or three taglines again.
 */
export const BRAND = {
  name: 'EduNexus',
  tagline: 'AI for CBC teaching & learning',
  description:
    'Lesson plans, assessments and a Socratic AI tutor aligned to the Kenyan CBC — for teachers, learners and parents.',
  legalName: 'EduNexus',
  supportEmail: 'support@joinedunexus.app',
  phone: '+254 704 360 522',
  phoneHref: 'tel:+254704360522',
  whatsapp: '+254 740 183 934',
  whatsappHref: 'https://wa.me/254740183934',
} as const;

interface BrandLogoProps {
  /** Show the tagline under the wordmark (hidden on small screens). */
  showTagline?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ showTagline = false, size = 'md', className = '' }) => {
  const icon = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const word = size === 'sm' ? 'text-lg' : 'text-xl';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src="/icon.svg" alt="" aria-hidden="true" className={`${icon} rounded-xl shrink-0`} />
      <span className="leading-none">
        <span className={`block font-extrabold tracking-tight text-ink ${word}`}>{BRAND.name}</span>
        {showTagline && (
          <span className="hidden sm:block text-[11px] font-semibold text-ink-muted mt-1">{BRAND.tagline}</span>
        )}
      </span>
    </span>
  );
};

export default BrandLogo;
