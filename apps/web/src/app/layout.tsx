import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { Providers } from '../components/providers';
import { ServiceWorkerRegistrar } from '../components/ServiceWorkerRegistrar';
import { InstallBanner } from '../components/InstallBanner';
import { ToastContainer } from '../components/ui/Toast';
import { DevMonitor } from '../components/dev/DevMonitor';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'allEdu Platform',
    template: '%s | allEdu',
  },
  description: 'Live and recorded classes for competitive exam preparation',
  manifest: '/manifest.json',
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <ServiceWorkerRegistrar />
        <InstallBanner />
        <ToastContainer />
        <DevMonitor />
      </body>
    </html>
  );
}
