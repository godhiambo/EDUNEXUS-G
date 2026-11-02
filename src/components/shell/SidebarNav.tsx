import React from 'react';
import { NAV_GROUPS, type AppTab } from './nav';

interface SidebarNavProps {
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  isDeveloper?: boolean;
  /** Screens this role can't use (e.g. lesson generation for learners). */
  hiddenTabs?: AppTab[];
}

/**
 * The single navigation list used by both the desktop sidebar and the mobile drawer.
 */
export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, onNavigate, isDeveloper = false, hiddenTabs = [] }) => {
  // A document opened from a lesson plan should keep "Lesson Plans" highlighted.
  const current: AppTab = activeTab === 'view' ? 'create' : activeTab;

  return (
    <div role="navigation" aria-label="Workspace" className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((i) => (!i.developerOnly || isDeveloper) && !hiddenTabs.includes(i.tab));
        if (!items.length) return null;
        return (
          <div key={group.title}>
            <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">{group.title}</p>
            <ul className="flex flex-col gap-0.5">
              {items.map(({ tab, label, icon: Icon }) => {
                const active = current === tab;
                return (
                  <li key={tab}>
                    <button
                      type="button"
                      onClick={() => onNavigate(tab)}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-left ${
                        active ? 'bg-brand/15 text-brand' : 'text-ink-soft hover:bg-raised hover:text-ink'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default SidebarNav;
