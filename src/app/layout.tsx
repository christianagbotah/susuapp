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
  description: "Enterprise-grade micro finance and susu savings platform tailored for Ghana. Manage susu contributions, loans, mobile money, and more.",
  keywords: ["iSusuPro", "Ghana", "Micro Finance", "Susu", "Mobile Money", "Fintech"],
  authors: [{ name: "iSusuPro Ghana" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💰</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position="top-center" toastOptions={{ className: "touch-target" }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
