'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Trash2,
  X,
  ShieldAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ---- Props ----

export type ConfirmVariant = 'default' | 'destructive' | 'success';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dialog heading, e.g. "Approve Loan Application" */
  title: string;
  /** Main explanation shown to the user */
  description: string;
  /** Optional highlighted subject line (e.g. customer + amount) */
  subject?: string;
  /** Optional extra detail rows rendered as a small list */
  details?: { label: string; value: string }[];
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual tone. 'destructive' = red (reject/delete/suspend), 'success' = green (approve) */
  variant?: ConfirmVariant;
  /** Optional reason input (required for rejections) */
  requireReason?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void;
}

// ---- Variant styling ----

function getVariantStyles(variant: ConfirmVariant) {
  switch (variant) {
    case 'destructive':
      return {
        icon: AlertTriangle as LucideIcon,
        iconWrap: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
        ring: 'ring-red-200 dark:ring-red-900/50',
      };
    case 'success':
      return {
        icon: CheckCircle as LucideIcon,
        iconWrap: 'bg-emerald-100 dark:bg-emerald-900/30',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        ring: 'ring-emerald-200 dark:ring-emerald-900/50',
      };
    default:
      return {
        icon: HelpCircle as LucideIcon,
        iconWrap: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        confirmBtn: 'bg-primary hover:bg-primary/90 text-primary-foreground',
        ring: 'ring-blue-200 dark:ring-blue-900/50',
      };
  }
}

// ---- Component ----

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  subject,
  details,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  requireReason = false,
  reasonPlaceholder = 'Provide a reason (required)...',
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = React.useState('');
  const styles = getVariantStyles(variant);
  const Icon = styles.icon;

  // Dismiss helper — clears the reason input as part of the close action
  // (keeps the next open fresh without setState-in-effect)
  const dismiss = React.useCallback(() => {
    setReason('');
    onOpenChange(false);
  }, [onOpenChange]);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismiss]);

  const reasonValid = !requireReason || reason.trim().length >= 3;
  const canConfirm = reasonValid;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(requireReason ? reason.trim() : undefined);
    dismiss();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px]"
            onClick={dismiss}
          />
          {/* Panel */}
          <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="confirm-panel"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className={`pointer-events-auto w-full max-w-md rounded-xl border bg-background shadow-2xl dark:bg-card dark:border-white/10 ring-1 ${styles.ring}`}
              role="alertdialog"
              aria-modal="true"
              aria-label={title}
            >
              {/* Header */}
              <div className="flex items-start gap-3 border-b px-5 py-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${styles.iconWrap}`}>
                  <Icon className={`h-5 w-5 ${styles.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold leading-snug text-foreground">{title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {variant === 'destructive' ? 'This action is sensitive' : 'Please confirm to continue'}
                  </p>
                </div>
                <button
                  onClick={dismiss}
                  className="touch-target -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 px-5 py-4 max-h-[60dvh] overflow-y-auto">
                <p className="text-sm leading-relaxed text-foreground">{description}</p>

                {subject && (
                  <div className="rounded-lg bg-muted/60 px-3 py-2.5">
                    <p className="text-sm font-medium text-foreground">{subject}</p>
                  </div>
                )}

                {details && details.length > 0 && (
                  <div className="rounded-lg border divide-y">
                    {details.map((d) => (
                      <div key={d.label} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                        <span className="text-muted-foreground">{d.label}</span>
                        <span className="font-medium text-foreground text-right">{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {requireReason && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="confirm-reason">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="confirm-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={reasonPlaceholder}
                      rows={3}
                      className="w-full min-h-[44px] rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {!reasonValid && reason.length > 0 && (
                      <p className="text-[11px] text-red-500">Please provide a reason (at least 3 characters).</p>
                    )}
                  </div>
                )}

                {variant === 'destructive' && !requireReason && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2.5">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-xs leading-relaxed text-red-700 dark:text-red-300">
                      This action cannot be undone. Please make sure you have reviewed the details before proceeding.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t px-5 py-3.5">
                <Button variant="outline" onClick={dismiss} className="min-h-[40px]">
                  {cancelLabel}
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className={`min-h-[40px] ${styles.confirmBtn}`}
                >
                  {confirmLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---- Convenience factory hooks ----

export interface ConfirmConfig {
  title: string;
  description: string;
  subject?: string;
  details?: { label: string; value: string }[];
  confirmLabel?: string;
  variant?: ConfirmVariant;
  requireReason?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void;
}

/**
 * Convenience hook: returns [dialogElement, ask(config)].
 * Usage:
 *   const [confirmDialog, askConfirm] = useConfirm();
 *   ...
 *   askConfirm({ title: 'Reject Loan', variant: 'destructive', requireReason: true, onConfirm: (reason) => {...} });
 *   return (<>{confirmDialog}{rest}</>);
 */
export function useConfirm(): [React.ReactNode, (config: ConfirmConfig) => void] {
  const [config, setConfig] = React.useState<ConfirmConfig | null>(null);
  const [open, setOpen] = React.useState(false);

  const ask = React.useCallback((cfg: ConfirmConfig) => {
    setConfig(cfg);
    setOpen(true);
  }, []);

  const element = config ? (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title={config.title}
      description={config.description}
      subject={config.subject}
      details={config.details}
      confirmLabel={config.confirmLabel}
      variant={config.variant}
      requireReason={config.requireReason}
      reasonPlaceholder={config.reasonPlaceholder}
      onConfirm={config.onConfirm}
    />
  ) : null;

  return [element, ask];
}
