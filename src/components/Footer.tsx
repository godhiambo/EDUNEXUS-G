import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MessageCircle } from 'lucide-react';
import { BRAND, BrandLogo } from './brand/Brand';

/**
 * The one footer used across the public site and the signed-in app.
 * No security "badges" or certification claims — link to the policies instead.
 */
const COLUMNS: { title: string; links: { label: string; to: string; danger?: boolean }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Workspaces', to: '/#workspaces' },
      { label: 'OER Library', to: '/#showcase' },
      { label: 'Sign in', to: '/#login' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Accessibility', to: '/accessibility' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Cookie Policy', to: '/cookies' },
      { label: 'Data Deletion', to: '/data-deletion' },
      { label: 'Delete Account', to: '/delete-account', danger: true },
    ],
  },
];

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-canvas text-ink-soft border-t border-line mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-2 md:grid-cols-12 gap-8">
        <div className="col-span-2 md:col-span-5 space-y-4">
          <Link to="/" aria-label="EduNexus home" className="inline-block">
            <BrandLogo />
          </Link>
          <p className="text-sm text-ink-muted leading-relaxed max-w-sm">{BRAND.description}</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`mailto:${BRAND.supportEmail}`} className="inline-flex items-center gap-2 hover:text-ink">
                <Mail className="w-4 h-4 text-brand" aria-hidden="true" /> {BRAND.supportEmail}
              </a>
            </li>
            <li>
              <a href={BRAND.phoneHref} className="inline-flex items-center gap-2 hover:text-ink">
                <Phone className="w-4 h-4 text-brand" aria-hidden="true" /> {BRAND.phone}
              </a>
            </li>
            <li>
              <a href={BRAND.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-ink">
                <MessageCircle className="w-4 h-4 text-brand" aria-hidden="true" /> WhatsApp {BRAND.whatsapp}
              </a>
            </li>
          </ul>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title} className="md:col-span-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink">{col.title}</p>
            <ul className="space-y-1">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className={`inline-block py-1.5 text-sm transition-colors ${
                      l.danger ? 'text-rose-300 hover:text-rose-200' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <p className="max-w-7xl mx-auto px-4 sm:px-8 py-5 text-sm text-ink-muted">
          © {year} {BRAND.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
