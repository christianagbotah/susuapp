'use client';

import { useEffect, useRef } from 'react';

/**
 * Strips `fdprocessedid` and other browser-extension attributes
 * that are injected before React hydrates, preventing hydration mismatch warnings.
 * (1Password, Bitwarden, LastPass, etc.)
 */
export function HydrationGuard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const attrs = ['fdprocessedid', 'data-1p-ignore', 'data-lpignore'];
    ref.current.querySelectorAll('*').forEach((el) => {
      attrs.forEach((attr) => {
        if (el.hasAttribute(attr)) el.removeAttribute(attr);
      });
    });
  }, []);

  return <div ref={ref} suppressHydrationWarning>{children}</div>;
}
