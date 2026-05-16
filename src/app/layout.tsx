import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { QueryClientProviderWrapper } from '@/components/QueryClientProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Discapp',
  description: 'Conectando personas, transformando vidas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <QueryClientProviderWrapper>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryClientProviderWrapper>
      </body>
    </html>
  );
}