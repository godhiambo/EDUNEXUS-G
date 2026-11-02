import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { BrandLogo } from './Brand';

/**
 * The one public header used on every signed-out page:
 * landing, workspaces, OER library, sign-in and the static pages (/about, /privacy …).
 *
 * Public sections of "/" are addressed by hash (/#workspaces, /#showcase, /#login)
 * so Back, refresh and shared links all work.
 */
const NAV = [
  { label: 'Home', to: '/' , key: 'home' },
  { label: 'Workspaces', to: '/#workspaces', key: 'workspaces' },
  { label: 'OER Library', to: '/#showcase', key: 'showcase' },
  { label: 'About', to: '/about', key: 'about' },
] as const;

function activeKey(pathname: string, hash: string): string {
  if (pathname === '/about') return 'about';
  if (pathname !== '/') return '';
  if (hash.includes('showcase')) return 'showcase';
  if (hash.includes('workspaces') || hash.includes('roles')) return 'workspaces';
  if (hash.includes('login') || hash.includes('auth')) return 'login';
  return 'home';
}

export const PublicHeader: React.FC = () => {
  const { pathname, hash } = useLocation();
  const [open, setOpen] = useState(false);
  const current = activeKey(pathname, hash);

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => setOpen(false), [pathname, hash]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const linkCls = (key: string) =>
    `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
      current === key ? 'text-ink bg-raised' : 'text-ink-soft hover:text-ink hover:bg-raised'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-line font-sans">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-8 flex items-center justify-between gap-4">
        <Link to="/" aria-label="EduNexus home" className="rounded-lg focus-visible:outline-2 focus-visible:outline-brand">
          <BrandLogo showTagline />
        </Link>

        <nav aria-label="Main" className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <Link key={n.key} to={n.to} className={linkCls(n.key)} aria-current={current === n.key ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/#login"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-ink border border-line hover:bg-raised transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/#workspaces"
            className="px-4 py-2 rounded-lg text-sm font-bold bg-brand-strong text-brand-ink hover:bg-brand transition-colors"
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="md:hidden w-11 h-11 -mr-2 flex items-center justify-center rounded-lg text-ink hover:bg-raised"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="public-mobile-menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <nav id="public-mobile-menu" aria-label="Main" className="md:hidden border-t border-line bg-surface px-4 py-4 flex flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.key} to={n.to} className={`${linkCls(n.key)} py-3`}>
              {n.label}
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-line">
            <Link to="/#login" className="py-3 text-center rounded-lg text-sm font-semibold text-ink border border-line">
              Sign in
            </Link>
            <Link to="/#workspaces" className="py-3 text-center rounded-lg text-sm font-bold bg-brand-strong text-brand-ink">
              Get started
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default PublicHeader;
