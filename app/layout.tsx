import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { CurrencyProvider } from '@/lib/currency-context';
import { JSX, ReactNode } from 'react';
import PWAInstaller from '@/components/PWAInstaller.';
import { ToastProvider } from '@/lib/toast-provider';
import { SubscriptionProvider } from '@/lib/subscription-context';
import ErrorBoundary from '@/components/ErrorBoundary';
import Script from 'next/script';
import { ReduxProvider } from '@/components/providers/redux-provider';

export const metadata: Metadata = {
  title: 'Pig Master',
  description: 'Professional software to help manage farming operations efficiently with comprehensive tools and analytics.',
  keywords: ['pig farming', 'swine farming', 'pig farming in Kenya', 'farm management', 'agriculture', 'livestock', 'farming software', 'productivity'],
  authors: [{ name: 'Pig Master Team' }],
  creator: 'Pig Master',
  publisher: 'Pig Master',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pig Master',
    startupImage: [
      {
        url: '/icons/apple-splash-2048-2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webpiglet-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-splash-1668-2388.png',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webpiglet-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-splash-1536-2048.png',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webpiglet-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-splash-1125-2436.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webpiglet-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/apple-splash-1242-2208.png',
        media: '(device-width: 414px) and (device-height: 736px) and (-webpiglet-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/apple-splash-750-1334.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webpiglet-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-splash-640-1136.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webpiglet-device-pixel-ratio: 2)',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/apple-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/icons/apple-icon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/icons/apple-icon-76x76.png', sizes: '76x76', type: 'image/png' },
      { url: '/icons/apple-icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/apple-icon-60x60.png', sizes: '60x60', type: 'image/png' },
      { url: '/icons/apple-icon-57x57.png', sizes: '57x57', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Pig Master',
    'application-name': 'Pig Master',
    'msapplication-TileColor': '#22c55e',
    'msapplication-TileImage': '/icons/ms-icon-144x144.png',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#22c55e',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#22c55e',
  colorScheme: 'light',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): JSX.Element {
  const googleAnalyticsProd = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/icons/icon-192x192.png" as="image" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pig Master" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#22c55e" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Google Analytics Script */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsProd}`}
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalyticsProd}');
            `,
          }}
        />
        {/* Service Worker Registration */}
        <Script
          id="service-worker"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', async function() {
                  try {
                    const registration = await navigator.serviceWorker.register('/sw.js', {
                      scope: '/'
                    });
                    console.log('🐰 Pig Master SW registered successfully:', registration);
                    registration.addEventListener('updatefound', () => {
                      console.log('🔄 New version of Pig Master available');
                    });
                    setInterval(() => {
                      registration.update();
                    }, 60000);
                  } catch (error) {
                    console.error('🚨 SW registration failed:', error);
                  }
                });
              }
              window.addEventListener('beforeinstallprompt', (e) => {
                window.deferredPrompt = e;
              });
              window.addEventListener('appinstalled', (e) => {
                console.log('✅ Pig Master installed successfully');
                window.deferredPrompt = null;
              });
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ReduxProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <CurrencyProvider>
                <ThemeProvider>
                  <ToastProvider>
                    <PWAInstaller />
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
                  </ToastProvider>
                </ThemeProvider>
              </CurrencyProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}