import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iSusuPro Ghana - Micro Finance & Susu Platform",
  description: "Enterprise-grade micro finance and susu savings platform tailored for Ghana. Manage susu contributions, loans, mobile money, and more — on web, Android, iOS, Windows & macOS.",
  keywords: ["iSusuPro", "Ghana", "Micro Finance", "Susu", "Mobile Money", "Fintech", "MOMO", "Bank of Ghana"],
  authors: [{ name: "iSusuPro Ghana" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "iSusuPro",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "iSusuPro Ghana — Susu & Microfinance for every Ghanaian",
    description: "Daily susu savings, MoMo, loans, bills & USSD *713# banking. Web, Android, iOS, Windows & macOS.",
    type: "website",
    locale: "en_GH",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GH" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="iSusuPro" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="iSusuPro" />
        <meta name="theme-color" content="#2563EB" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position="top-center" toastOptions={{ className: "touch-target" }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
