import type { CapacitorConfig } from '@capacitor/cli';

/**
 * iSusuPro Ghana — Capacitor configuration (Android & iOS)
 * --------------------------------------------------------
 * The Next.js app is SERVER-DEPENDENT (API routes + NestJS backend + Prisma),
 * so the native shell is a thin WebView that loads the hosted deployment:
 *
 *   APP_SERVER_URL=https://isusupro.com bun run cap:sync
 *
 * • `server.url` points the WebView at the live server (bridge + plugins inject).
 * • `webDir: 'dist'` holds a branded bootstrap/offline shell (scripts/build-native-shell.mjs)
 *   used as fallback assets and by tooling.
 * • Native plugins installed: PushNotifications (contribution reminders),
 *   LocalNotifications, Camera (Ghana Card OCR), Geolocation (agent routes),
 *   Preferences (offline queue), SplashScreen, StatusBar, App (lifecycle).
 *
 * Build commands:
 *   bun run cap:sync               → build shell + sync into android/
 *   bun run cap:open:android       → Android Studio (build AAB for Play)
 *   bun run cap:open:ios           → Xcode (build IPA for App Store, macOS only)
 *   CI: .github/workflows/build-mobile.yml builds the APK/AAB automatically
 *
 * Dev against a local server (Android emulator):
 *   APP_SERVER_URL=http://10.0.2.2:3000 bun run cap:sync
 *
 * Ghana-specific notes:
 *   - targetSdk 35 (Google Play requirement, Capacitor 8)
 *   - Offline-first agents: USSD *713# always works; queued collections sync
 *     through the server once the WebView reconnects.
 */

const serverUrl =
  process.env.APP_SERVER_URL ||
  process.env.CAP_SERVER_URL ||
  'https://isusupro.com';

const config: CapacitorConfig = {
  appId: 'com.isusupro.ghana',
  appName: 'iSusuPro',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: true,
  },
  server: {
    androidScheme: 'https',
    url: serverUrl,
    // Allow http:// dev servers (e.g. http://10.0.2.2:3000 on the emulator)
    cleartext: serverUrl.startsWith('http://'),
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
