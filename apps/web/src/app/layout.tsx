import type { Metadata, Viewport } from 'next';
import { Providers } from '../components/providers';
import { ServiceWorkerRegistrar } from '../components/ServiceWorkerRegistrar';
import { InstallBanner } from '../components/InstallBanner';
import { ToastContainer } from '../components/ui/Toast';
import { DevMonitor } from '../components/dev/DevMonitor';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'allEdu Platform',
    template: '%s | allEdu',
  },
  description: 'Live and recorded classes for competitive exam preparation',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a56db',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <ServiceWorkerRegistrar />
        <InstallBanner />
        <ToastContainer />
        <DevMonitor />
      </body>
    </html>
  );
}
