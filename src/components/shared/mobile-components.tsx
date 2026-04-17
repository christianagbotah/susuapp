'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

// ---- Bottom Tab Bar ----
export interface BottomTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface BottomTabBarProps {
  items: BottomTabItem[];
  activeId: string;
  onTabChange: (id: string) => void;
}

export function BottomTabBar({ items, activeId, onTabChange }: BottomTabBarProps) {
  return (
    <div className="bottom-tab-bar safe-area-bottom lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50">
      <nav className="flex items-center justify-around px-1 pt-1.5 pb-1">
        {items.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="touch-target relative flex flex-col items-center justify-center gap-0.5 flex-1 rounded-xl transition-all duration-200 active:scale-95"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-colors duration-200 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] leading-tight transition-colors duration-200 ${
                  isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomTabIndicator"
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ---- Bottom Sheet ----
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, title, children, className = '' }: BottomSheetProps) {
  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bottom-sheet-overlay fixed inset-0 z-[60] bg-black/40"
            onClick={handleBackdropClick}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="bottom-sheet-content fixed bottom-0 left-0 right-0 z-[70] bg-background shadow-2xl safe-area-bottom"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="bottom-sheet-handle" />
            </div>
            {/* Title */}
            {title && (
              <div className="px-6 pb-3">
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
            )}
            {/* Content */}
            <div className={`overflow-y-auto max-h-[70dvh] overscroll-contain ${className}`}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---- Action Sheet (simplified bottom sheet for action lists) ----
interface ActionSheetItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  items: ActionSheetItem[];
  cancelLabel?: string;
}

export function ActionSheet({ open, onClose, title, items, cancelLabel = 'Cancel' }: ActionSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="px-4 pb-4 space-y-1">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              disabled={item.disabled}
              className={`touch-target w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors active:scale-[0.98] ${
                item.destructive
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-foreground hover:bg-muted'
              } ${item.disabled ? 'opacity-40 pointer-events-none' : ''}`}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              <span>{item.label}</span>
            </button>
          );
        })}
        <div className="pt-2 mt-2 border-t">
          <button
            onClick={onClose}
            className="touch-target w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground bg-muted hover:bg-muted/80 transition-colors active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

// ---- Mobile Drawer (left side) ----
interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileDrawer({ open, onClose, children }: MobileDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[55] bg-black/40 bottom-sheet-overlay"
            onClick={onClose}
          />
          {/* Drawer panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-[60] w-[85%] max-w-[320px] bg-background shadow-2xl safe-area-left"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---- Mobile Page Header (sticky, with safe area) ----
interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  transparent?: boolean;
}

export function MobilePageHeader({ title, subtitle, onBack, actions, transparent = false }: MobilePageHeaderProps) {
  return (
    <div className={`safe-area-top sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/50 lg:hidden ${transparent ? 'bg-transparent backdrop-blur-none border-0' : ''}`}>
      <div className="flex items-center h-14 px-4 gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="touch-target flex items-center justify-center -ml-2 h-10 w-10 rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-1 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- FAB (Floating Action Button) ----
interface FABProps {
  icon: LucideIcon;
  onClick: () => void;
  label?: string;
  variant?: 'primary' | 'destructive';
}

export function FAB({ icon: Icon, onClick, label, variant = 'primary' }: FABProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`touch-target fixed right-4 bottom-20 lg:bottom-6 z-40 h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-colors ${
        variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-destructive text-white hover:bg-destructive/90'
      }`}
      aria-label={label}
    >
      <Icon className="h-6 w-6" />
    </motion.button>
  );
}

// ---- Pull to Refresh Indicator (visual only) ----
interface PullRefreshProps {
  isRefreshing: boolean;
  progress?: number;
}

export function PullRefreshIndicator({ isRefreshing, progress = 0 }: PullRefreshProps) {
  return (
    <AnimatePresence>
      {(isRefreshing || progress > 0) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 60 }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : progress * 360 }}
            transition={{ duration: isRefreshing ? 1 : 0, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
            className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---- Skeleton Loading for Mobile Cards ----
export function MobileCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}

export function MobileListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <MobileCardSkeleton key={i} />
      ))}
    </div>
  );
}
