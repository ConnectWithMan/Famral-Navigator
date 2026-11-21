import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbItem } from '../lib/seoSchema.ts';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`text-xs text-slate-500 ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5 min-w-0">
              {idx > 0 && (
                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" aria-hidden="true" />
              )}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="hover:text-[#1D4ED8] transition-colors truncate max-w-[200px]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="text-[#0B1F3A] font-medium truncate max-w-[280px]"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
