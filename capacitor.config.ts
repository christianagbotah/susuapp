import type { CapacitorConfig } from '@capacitor/cli';

/**
 * iSusuPro Ghana — Capacitor configuration
 * ----------------------------------------
 * Wraps the Next.js PWA build into native Android (AAB/APK) and
 * iOS (.ipa) apps. The native shell is a thin WebView layer:
 *   • Static build served from `dist/` (next build && next export -o dist)
 *     with the NestJS API base pointing at the production URL.
 *   • Native plugins available: PushNotifications (contribution
 *     reminders), BiometricAuth (PIN replacement), Camera (Ghana Card
 *     OCR), Geolocation (agent route tracking).
 *
 * Build commands:
 *   bun run build && bun run cap:sync
 *   bun run cap:open:android   → Android Studio (build AAB for Play)
 *   bun run cap:open:ios       → Xcode (build IPA for App Store)
 *
 * Ghana-specific notes:
 *   - targetSdk 34 (Google Play 2025 requirement)
 *   - MoMo deep links registered: mtnmomo://, telecelcash://, atmoney://
 *   - Offline-first: service worker handles collection caching;
 *     Capacitor Preferences syncs queued collections on reconnect.
 */
const config: CapacitorConfig = {
  appId: 'com.isusupro.ghana',
  appName: 'iSusuPro',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: true,
  },
  server: {
    androidScheme: 'https',
    // For development against the live sandbox, uncomment:
    // url: 'https://your-sandbox-url.space-z.ai',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#059669',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#059669',
    },
  },
};

export default config;
