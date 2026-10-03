import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Cairo } from 'next/font/google';
import { ThemeProvider, LanguageProvider, ColorProvider, AuthProvider, ProfileProvider } from '@/contexts/app-context';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/error-boundary';
import { VisualIdentityProvider } from '@/contexts/visual-identity-context';
import { VisualIdentityIcons } from '@/components/visual-identity-icons';
import { getVisualIdentityUrl, type VisualIdentityPaths } from '@/lib/visual-identity';
import { safeTimeoutSignal } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#AADDFC' },
    { media: '(prefers-color-scheme: dark)', color: '#111315' },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const metadata: Metadata = {
    title: 'Portfolio Platform',
    description: 'A personal portfolio platform with admin dashboard',
  };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return metadata;
  try {
    // Anonymous public read only: never share a persisted browser auth client on the server.
    const signal = safeTimeoutSignal(5000);
    const response = await fetch(
      `${url}/rest/v1/visual_identity_settings?select=favicon_path,apple_touch_icon_path&id=eq.true&limit=1`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: 'no-store',
        ...(signal ? { signal } : {}),
      },
    );
    if (!response.ok) return metadata;
    const rows: VisualIdentityPaths[] = await response.json();
    const favicon = getVisualIdentityUrl(rows[0]?.favicon_path, url);
    const apple = getVisualIdentityUrl(rows[0]?.apple_touch_icon_path, url);
    metadata.icons = {
      ...(favicon ? { icon: [{ url: favicon, type: favicon.endsWith('.ico') ? 'image/x-icon' : 'image/png' }] } : {}),
      ...(apple ? { apple: [{ url: apple, type: 'image/png' }] } : {}),
    };
  } catch {
    // Missing migration or network outage must not prevent the portfolio from rendering.
  }
  return metadata;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${cairo.variable} font-sans min-h-screen min-h-[100dvh] antialiased`} suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <LanguageProvider>
              <ColorProvider>
                <AuthProvider>
                  <ProfileProvider>
                    <VisualIdentityProvider>
                      <VisualIdentityIcons />
                      {children}
                      <Toaster />
                    </VisualIdentityProvider>
                  </ProfileProvider>
                </AuthProvider>
              </ColorProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
