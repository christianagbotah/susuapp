'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, X, Share, PlusSquare, Smartphone, MonitorSmartphone, RefreshCw } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'other';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Windows/.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/.test(ua)) return 'macos';
  if (/Linux/.test(ua)) return 'linux';
  return 'other';
}

const PLATFORM_TIPS: Record<Platform, string> = {
  ios: 'Tap the Share button, then "Add to Home Screen" to install iSusuPro as an app.',
  android: 'Tap Install to add iSusuPro to your home screen — works offline too.',
  windows: 'Install iSusuPro as a desktop app (Chrome/Edge menu → Install iSusuPro), or use the Tauri build.',
  macos: 'Install iSusuPro from Chrome, or run the Tauri .dmg build for a native dock app.',
  linux: 'Install iSusuPro from Chrome/Chromium (menu → Install), or use the Tauri AppImage.',
  other: 'Open iSusuPro in Chrome or Safari to install it as an app.',
};

export function PwaProvider() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState<Platform>('other');
  const [swUpdateReady, setSwUpdateReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Defer platform detection to next frame (client-only API; avoids sync setState in effect)
    const raf = requestAnimationFrame(() => setPlatform(detectPlatform()));

    // Standalone / Tauri / Capacitor detection — suppress banner inside installed apps
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true ||
      ['__TAURI_INTERNALS__', '__TAURI__'].some((k) => k in window) ||
      'Capacitor' in window;

    // Register service worker (skipped in native shells which handle offline natively)
    if ('serviceWorker' in navigator && !isStandalone) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          installing?.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(installing);
              setSwUpdateReady(true);
            }
          });
        });
      }).catch(() => {});
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      // Only auto-show on mobile; desktop users get the browser install UI
      const detected = detectPlatform();
      if (!isStandalone && (detected === 'android' || detected === 'ios')) {
        setTimeout(() => setShowBanner(true), 4000);
      }
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', () => setShowBanner(false));

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === 'accepted') toast.success('iSusuPro installed 🎉', { description: 'Find it on your home screen / app list.' });
      setShowBanner(false);
      return;
    }
    // No browser event — show platform instructions
    toast.info('Install iSusuPro', { description: PLATFORM_TIPS[platform], duration: 7000 });
    setShowBanner(false);
  }, [installEvent, platform]);

  const applyUpdate = useCallback(() => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    waitingWorker?.addEventListener('statechange', (e) => {
      if ((e.target as ServiceWorker).state === 'activated') window.location.reload();
    });
  }, [waitingWorker]);

  return (
    <>
      {/* Service Worker update toast */}
      <AnimatePresence>
        {swUpdateReady && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className="fixed bottom-24 right-4 z-[70] lg:bottom-6"
          >
            <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-xl">
              <RefreshCw className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Update available</p>
                <p className="text-xs text-muted-foreground">New iSusuPro version ready</p>
              </div>
              <Button size="sm" className="min-h-[38px]" onClick={applyUpdate}>Refresh</Button>
              <Button size="sm" variant="ghost" className="min-h-[38px] px-2" onClick={() => setSwUpdateReady(false)} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install banner (mobile-first) */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="fixed inset-x-3 bottom-24 z-[70] lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-[380px]"
          >
            <div className="rounded-2xl border bg-card/95 p-4 shadow-2xl backdrop-blur-lg">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  {platform === 'ios' ? <Share className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <MonitorSmartphone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Install iSusuPro</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {platform === 'ios'
                      ? 'Tap Share, then “Add to Home Screen” — full-screen app, works offline.'
                      : 'Full-screen app with offline susu collections. Less than 2 MB.'}
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    {platform === 'ios' ? (
                      <Button size="sm" className="min-h-[38px] flex-1" onClick={() => setShowBanner(false)}>Got it</Button>
                    ) : (
                      <Button size="sm" className="min-h-[38px] flex-1" onClick={handleInstall}>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Install
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="min-h-[38px] px-2.5" onClick={() => setShowBanner(false)}>Later</Button>
                  </div>
                </div>
                <button onClick={() => setShowBanner(false)} className="touch-target -mr-1 flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted" aria-label="Dismiss">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {platform === 'ios' && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
                  <PlusSquare className="h-3.5 w-3.5 shrink-0" /> Safari → Share → Add to Home Screen
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ---- Get-the-app buttons (login page footer / settings) ----
export function GetAppButtons({ compact = false }: { compact?: boolean }) {
  const [platform, setPlatform] = useState<Platform>('other');

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPlatform(detectPlatform()));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleInstall = async () => {
    toast.info('Install iSusuPro', { description: PLATFORM_TIPS[platform], duration: 7000 });
  };

  if (compact) {
    return (
      <button onClick={handleInstall} className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
        <Smartphone className="h-3.5 w-3.5" /> Install app
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" size="sm" className="min-h-[40px] gap-1.5 touch-manipulation" onClick={handleInstall}>
        <Smartphone className="h-4 w-4 text-emerald-600" /> Android & iOS
      </Button>
      <Button variant="outline" size="sm" className="min-h-[40px] gap-1.5 touch-manipulation" onClick={handleInstall}>
        <MonitorSmartphone className="h-4 w-4 text-blue-600" /> Windows & macOS
      </Button>
    </div>
  );
}
