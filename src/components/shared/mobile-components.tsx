'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Search,
  X,
  ChevronRight,
} from 'lucide-react';

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
  extraItem?: BottomTabItem;
  onExtraTabClick?: () => void;
}

export function BottomTabBar({ items, activeId, onTabChange, extraItem, onExtraTabClick }: BottomTabBarProps) {
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
        {extraItem && onExtraTabClick && (
          (() => {
            const Icon = extraItem.icon;
            return (
              <button
                key={extraItem.id}
                onClick={onExtraTabClick}
                className="touch-target relative flex flex-col items-center justify-center gap-0.5 flex-1 rounded-xl transition-all duration-200 active:scale-95"
                aria-label={extraItem.label}
              >
                <div className="relative">
                  <Icon
                    className="h-5 w-5 text-muted-foreground transition-colors duration-200"
                    strokeWidth={1.8}
                  />
                </div>
                <span className="text-[10px] leading-tight text-muted-foreground transition-colors duration-200">
                  {extraItem.label}
                </span>
              </button>
            );
          })()
        )}
      </nav>
    </div>
  );
}

// ---- Bottom Sheet (Enhanced with drag-to-close) ----
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, title, children, className = '' }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);
  const isDragging = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  const close = useCallback(() => {
    setDragOffset(0);
    onClose();
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      close();
    }
  }, [close]);

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientY - dragStartY.current;
    if (delta > 0) {
      currentDragY.current = delta;
      setDragOffset(delta);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    if (currentDragY.current > 100) {
      close();
    } else {
      // Bounce back
      setDragOffset(0);
    }
    currentDragY.current = 0;
  }, [close]);

  // Reset drag offset when closed
  useEffect(() => {
    if (!open) setDragOffset(0);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop with opacity transition based on drag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: Math.max(0, 1 - dragOffset / 300) }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bottom-sheet-overlay fixed inset-0 z-[60] bg-black/40"
            onClick={handleBackdropClick}
          />
          {/* Sheet with drag-to-close */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: dragOffset }}
            exit={{ y: '100%' }}
            transition={dragOffset === 0 ? { type: 'spring', damping: 30, stiffness: 300 } : { duration: 0 }}
            className="bottom-sheet-content fixed bottom-0 left-0 right-0 z-[70] bg-background shadow-2xl safe-area-bottom"
            style={{ touchAction: 'none' }}
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
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

// ============================================================
// NEW MOBILE COMPONENTS
// ============================================================

// ---- SwipeableRow ----
// iOS Mail-style swipe-to-reveal actions row
interface SwipeableAction {
  label: string;
  icon?: LucideIcon;
  color?: string;
  bg?: string;
  onClick: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  leftActions?: SwipeableAction[];
  rightActions?: SwipeableAction[];
  threshold?: number;
  className?: string;
}

export function SwipeableRow({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  className = '',
}: SwipeableRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const [translateX, setTranslateX] = useState(0);

  const maxLeft = leftActions.length * 70;
  const maxRight = rightActions.length * 70;

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    currentX.current = translateX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [translateX]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - startX.current;
    let newVal = currentX.current + delta;

    // Clamp to bounds
    if (newVal > 0) {
      newVal = Math.min(newVal, maxLeft);
    } else if (newVal < 0) {
      newVal = Math.max(newVal, -maxRight);
    }
    setTranslateX(newVal);
  }, [maxLeft, maxRight]);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    // Snap logic
    if (translateX > threshold) {
      setTranslateX(maxLeft);
    } else if (translateX < -threshold) {
      setTranslateX(-maxRight);
    } else {
      setTranslateX(0);
    }
  }, [translateX, threshold, maxLeft, maxRight]);

  const handleActionClick = useCallback((action: SwipeableAction) => {
    action.onClick();
    setTranslateX(0);
  }, []);

  return (
    <div className={`swipeable-row relative overflow-hidden ${className}`}>
      {/* Left action buttons (behind content, swipe right reveals) */}
      {leftActions.length > 0 && (
        <div className="absolute inset-y-0 left-0 flex z-0">
          {leftActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={`left-${i}`}
                onClick={() => handleActionClick(action)}
                className={`haptic-feedback flex items-center gap-1.5 px-4 text-white text-xs font-semibold ${
                  action.bg || 'bg-primary'
                }`}
                style={{ width: 70 }}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span className="truncate">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Right action buttons (behind content, swipe left reveals) */}
      {rightActions.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex z-0">
          {rightActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={`right-${i}`}
                onClick={() => handleActionClick(action)}
                className={`haptic-feedback flex items-center gap-1.5 px-4 text-white text-xs font-semibold ${
                  action.bg || 'bg-destructive'
                }`}
                style={{ width: 70 }}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span className="truncate">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Swipeable content */}
      <div
        ref={containerRef}
        className="relative z-10 bg-background"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          touchAction: 'pan-y',
        }}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        {children}
      </div>
    </div>
  );
}

// ---- MobileFabWithLabel ----
// A FAB that expands to show a label text on tap
interface MobileFabWithLabelProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'destructive';
}

export function MobileFabWithLabel({
  icon: Icon,
  label,
  onClick,
  variant = 'primary',
}: MobileFabWithLabelProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) {
      const timer = setTimeout(() => setExpanded(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [expanded]);

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={() => {
        setExpanded(true);
        onClick();
      }}
      className={`touch-target fixed right-4 bottom-20 lg:bottom-6 z-40 h-14 rounded-full shadow-xl flex items-center gap-2 px-4 transition-all overflow-hidden ${
        variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-destructive text-white hover:bg-destructive/90'
      } ${expanded ? 'w-auto' : 'w-14 justify-center'}`}
      aria-label={label}
    >
      <Icon className="h-6 w-6 shrink-0" />
      <AnimatePresence>
        {expanded && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-semibold whitespace-nowrap overflow-hidden"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ---- StatusBadge ----
// A mobile-friendly small status indicator with pulse animation
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success';
  label?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

const statusConfig: Record<string, { bg: string; text: string; dotColor: string }> = {
  active: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dotColor: 'bg-emerald-500' },
  inactive: { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-500 dark:text-gray-400', dotColor: 'bg-gray-400' },
  pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dotColor: 'bg-amber-500' },
  error: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dotColor: 'bg-red-500' },
  success: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dotColor: 'bg-emerald-500' },
};

export function StatusBadge({ status, label, size = 'sm', pulse = false }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive;
  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  const fontSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  const shouldPulse = pulse || status === 'active';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium ${config.bg} ${config.text} ${fontSize}`}>
      <span className="relative flex items-center justify-center">
        <span className={`${dotSize} rounded-full ${config.dotColor}`} />
        {shouldPulse && (
          <span className={`absolute ${dotSize} rounded-full ${config.dotColor} animate-ping opacity-40`} />
        )}
      </span>
      {label && <span>{label}</span>}
    </span>
  );
}

// ---- EmptyState ----
// A reusable empty state component for mobile
interface EmptyStateProps {
  icon?: LucideIcon;
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      {/* Illustration area */}
      <div className="mb-6">
        {illustration ? (
          <div className="w-24 h-24 flex items-center justify-center">{illustration}</div>
        ) : Icon ? (
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
            <Icon className="h-10 w-10 text-muted-foreground" />
          </div>
        ) : null}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed mb-5">
          {description}
        </p>
      )}

      {/* Action button */}
      {actionLabel && onAction && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onAction}
          className="touch-target flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20"
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      )}
    </motion.div>
  );
}

// ---- MobileSearchBar ----
// A native-feeling search input with cancel button and clear button
interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  className?: string;
}

export function MobileSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  autoFocus = false,
  onCancel,
  className = '',
}: MobileSearchBarProps) {
  const [focused, setFocused] = useState(autoFocus);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Delay to work around mobile keyboard timing
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleCancel = useCallback(() => {
    onChange('');
    setFocused(false);
    inputRef.current?.blur();
    onCancel?.();
  }, [onChange, onCancel]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          enterKeyHint="search"
          className="w-full h-11 pl-10 pr-10 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          style={{ fontSize: 16 }} // Prevent iOS zoom
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {focused && (
          <motion.button
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleCancel}
            className="touch-target h-11 px-3 text-sm font-medium text-primary shrink-0 overflow-hidden whitespace-nowrap"
          >
            Cancel
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- QuickActionsGrid ----
// A grid of quick action items with haptic-like visual feedback
interface QuickActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  onClick: () => void;
}

interface QuickActionsGridProps {
  items: QuickActionItem[];
  columns?: 3 | 4;
  className?: string;
}

export function QuickActionsGrid({ items, columns = 4, className = '' }: QuickActionsGridProps) {
  const gridCols = columns === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-3 ${className}`}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={item.onClick}
            className="haptic-feedback flex flex-col items-center gap-2 py-3 rounded-xl touch-target"
          >
            <div
              className={`flex items-center justify-center h-11 w-11 rounded-2xl shadow-sm transition-transform ${
                item.bgColor || 'bg-primary/10'
              }`}
            >
              <Icon className={`h-5 w-5 ${item.color || 'text-primary'}`} />
            </div>
            <span className="text-[11px] font-medium text-foreground leading-tight text-center line-clamp-2">
              {item.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
