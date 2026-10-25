'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/**
 * Uniform, clickable KPI stat card shared across all portals.
 *
 * - Visually identical layout on every dashboard (title / value / optional sub, icon right)
 * - When `onClick` is provided the card becomes a keyboard-accessible button
 *   (Enter / Space activate) with pointer, hover, focus-visible and press feedback
 * - Without `onClick` it renders as a passive stat card (no interaction styles)
 * - `index` drives the staggered entrance animation (0.1s steps)
 */
interface KpiCardProps {
  title: string;
  value: string;
  /** Optional third line (trend, context, count) */
  sub?: string;
  /** Classes for the sub line, e.g. 'text-emerald-600 dark:text-emerald-400 font-medium' */
  subClassName?: string;
  icon: LucideIcon;
  /** Icon foreground color classes, e.g. 'text-emerald-600 dark:text-emerald-400' */
  color?: string;
  /** Icon box background classes, e.g. 'bg-emerald-100 dark:bg-emerald-900/30' */
  bg?: string;
  /** Navigation (or action) callback — makes the card clickable */
  onClick?: () => void;
  /** Stagger index for the entrance animation */
  index?: number;
  className?: string;
}

export function KpiCard({
  title,
  value,
  sub,
  subClassName,
  icon: Icon,
  color,
  bg,
  onClick,
  index = 0,
  className,
}: KpiCardProps) {
  const interactive = typeof onClick === 'function';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="h-full"
    >
      <Card
        onClick={interactive ? onClick : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? `Open ${title} details` : undefined}
        className={cn(
          'mobile-card touch-manipulation h-full transition-all',
          interactive &&
            'cursor-pointer select-none hover:shadow-lg hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]',
          className,
        )}
      >
        <CardContent className="p-3 lg:p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="truncate text-xs text-muted-foreground lg:text-sm">{title}</p>
              <p className="truncate text-base font-bold lg:text-xl">{value}</p>
              {sub && (
                <p className={cn('truncate text-[11px] line-clamp-1', subClassName ?? 'text-muted-foreground')}>
                  {sub}
                </p>
              )}
            </div>
            {bg && (
              <div className={cn('shrink-0 rounded-lg p-2.5 lg:p-3', bg)}>
                <Icon className={cn('h-5 w-5 lg:h-6 lg:w-6', color)} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
