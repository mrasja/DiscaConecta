import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { QueryClientProviderWrapper } from '@/components/QueryClientProvider';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { NotificationPermission } from '@/components/NotificationPermission';
import { ToastProvider } from '@/context/ToastContext';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ConsentBanner } from '@/components/ConsentBanner';
import { ConditionalAnalytics } from '@/components/ConditionalAnalytics';
import { TermsAcceptModal } from '@/components/TermsAcceptModal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DiscaConecta',
  description: 'Conectando personas, transformando vidas',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'DiscaConecta' },
  other: { 'mobile-web-app-capable': 'yes' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={inter.className}>
        <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
        <OfflineBanner />
        <ServiceWorkerRegistrar />
        <NotificationPermission />
        <QueryClientProviderWrapper>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
            <TermsAcceptModal />
          </AuthProvider>
        </QueryClientProviderWrapper>
        <ConsentBanner />
        <ConditionalAnalytics />
      </body>
    </html>
  );
}