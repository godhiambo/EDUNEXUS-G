import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Moon, Sun, Keyboard, Settings, Smartphone, LogOut, Sparkles } from 'lucide-react';

interface UserMenuProps {
  name: string;
  role?: string;
  avatarClass: string;
  darkMode: boolean;
  credits?: number | null;
  planLabel?: string;
  onToggleDarkMode: () => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
  onOpenAppIcons: () => void;
  onUpgrade: () => void;
  onSignOut: () => void;
}

/**
 * Profile menu in the top bar. Collects the controls that used to sit as
 * separate icons in the header (theme, shortcuts, settings, app install, sign out).
 */
export const UserMenu: React.FC<UserMenuProps> = ({
  name,
  role,
  avatarClass,
  darkMode,
  credits,
  planLabel,
  onToggleDarkMode,
  onOpenShortcuts,
  onOpenSettings,
  onOpenAppIcons,
  onUpgrade,
  onSignOut,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const item = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-soft hover:bg-raised hover:text-ink text-left';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-raised transition-colors"
      >
        <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${avatarClass}`}>
          {name.slice(0, 2).toUpperCase()}
        </span>
        <span className="hidden xl:block text-left leading-tight max-w-[10rem]">
          <span className="block text-sm font-semibold text-ink truncate">{name}</span>
          {role && <span className="block text-xs text-ink-muted">{role}</span>}
        </span>
        <ChevronDown className="hidden xl:block w-4 h-4 text-ink-muted" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-xl border border-line bg-surface shadow-2xl shadow-black/50 p-2 z-50"
        >
          <div className="px-3 py-2.5 border-b border-line mb-1">
            <p className="text-sm font-semibold text-ink truncate">{name}</p>
            {role && <p className="text-xs text-ink-muted">{role}</p>}
          </div>

          {(credits != null || planLabel) && (
            <div className="mx-1 my-2 p-3 rounded-lg bg-raised flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-ink-muted">{planLabel || 'Plan'}</p>
                {credits != null && <p className="text-sm font-semibold text-ink">{credits} AI credits left</p>}
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={run(onUpgrade)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-strong text-brand-ink hover:bg-brand"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Upgrade
              </button>
            </div>
          )}

          <button type="button" role="menuitem" className={item} onClick={run(onToggleDarkMode)}>
            {darkMode ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
            {darkMode ? 'Light mode' : 'Dark mode'}
          </button>
          <button type="button" role="menuitem" className={item} onClick={run(onOpenSettings)}>
            <Settings className="w-4 h-4" aria-hidden="true" /> Settings
          </button>
          <button type="button" role="menuitem" className={item} onClick={run(onOpenShortcuts)}>
            <Keyboard className="w-4 h-4" aria-hidden="true" /> Keyboard shortcuts
          </button>
          <button type="button" role="menuitem" className={item} onClick={run(onOpenAppIcons)}>
            <Smartphone className="w-4 h-4" aria-hidden="true" /> Install the app
          </button>
          <div className="my-1 border-t border-line" />
          <button type="button" role="menuitem" className={`${item} text-rose-300 hover:text-rose-200`} onClick={run(onSignOut)}>
            <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
