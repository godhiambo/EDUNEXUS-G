import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Shows a "Back" link above the title. */
  onBack?: () => void;
  backLabel?: string;
  /** Primary actions on the right (buttons). */
  actions?: React.ReactNode;
}

/**
 * Compact header shared by every signed-in screen.
 * Replaces the breadcrumb card + gradient title + per-page "Dark Mode" button.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, onBack, backLabel = 'Back', actions }) => (
  <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
    <div className="min-w-0">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {backLabel}
        </button>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </header>
);

export default PageHeader;
