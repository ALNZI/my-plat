'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/app-context';
import { Navbar } from '@/components/navbar';
import { PortfolioSections } from '@/components/portfolio-sections';
import { ChatWidget } from '@/components/chat-widget';
import { VisualIdentityImage } from '@/components/visual-identity-image';

export default function Home() {
  const { t, dir, lang } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return (
    <div dir={dir}>
      <Navbar />
      <PortfolioSections />
      <ChatWidget />

      {/* Footer */}
      <footer className="border-t border-white/40 dark:border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-[#2477A8] dark:text-muted-foreground">
          <VisualIdentityImage field="brand_mark_path" className="h-12 w-12 object-contain mx-auto mb-3" />
          <p>&copy; {new Date().getFullYear()} {t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  );
}
