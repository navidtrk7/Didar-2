import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SessionProvider } from "@/context/session-context";
import { WorkspaceProvider } from "@/context/workspace-context";
import { PlatformProvider } from "@/context/platform-context";
import { ThemeProvider } from "@/context/theme-context";
import { ToastProvider } from "@/components/toast";
import { PwaRegister } from "@/components/pwa-register";
import { brand } from "@/data/brand";
import "./globals.css";

/** فونت برند VazirMatn — بهترین فونت فارسی برای UI */
const vazirMatn = localFont({
  src: [
    { path: "../../public/fonts/VazirMatn-Thin.woff2", weight: "100", style: "normal" },
    { path: "../../public/fonts/VazirMatn-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/VazirMatn-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/VazirMatn-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/VazirMatn-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/VazirMatn-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/VazirMatn-ExtraBold.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

const vazirMatnDisplay = localFont({
  src: [
    { path: "../../public/fonts/VazirMatn-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/VazirMatn-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/VazirMatn-ExtraBold.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://didar.cls9.com"),
  applicationName: brand.nameFa,
  title: {
    default: `${brand.nameFa} | ${brand.tagline}`,
    template: `%s | ${brand.nameFa}`,
  },
  description: brand.description,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: brand.nameFa,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/favicon.png"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: brand.nameFa,
    title: `${brand.nameFa} | ${brand.tagline}`,
    description: brand.description,
    images: [{ url: "/brand/world-hero.webp" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#041E42" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${vazirMatn.variable} ${vazirMatnDisplay.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="flex min-h-full min-h-dvh flex-col font-sans">
        <ThemeProvider>
          <SessionProvider>
            <WorkspaceProvider>
              <PlatformProvider>
                <ToastProvider>
                  {children}
                  <PwaRegister />
                </ToastProvider>
              </PlatformProvider>
            </WorkspaceProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
