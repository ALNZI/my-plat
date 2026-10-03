'use client';

import { useState, useEffect } from 'react';
import { useLanguage, useColor, useAuth } from '@/contexts/app-context';
import { Moon, Sun, Languages, Menu, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { ColorPicker } from '@/components/color-picker';
import { cn } from '@/lib/utils';
import { VisualIdentityImage } from '@/components/visual-identity-image';

export function Navbar() {
  const { t, lang, setLang, dir } = useLanguage();
  const { resetColor } = useColor();
  const { session } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '#projects', label: t('section.projects') },
    { href: '#awards', label: t('section.awards') },
    { href: '#certificates', label: t('section.certificates') },
    { href: '#research', label: t('section.research') },
    { href: '#contact', label: t('section.contact') },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[rgba(170,221,252,0.45)] backdrop-blur-[18px] border-b border-white/55 shadow-[0_8px_30px_rgba(36,119,168,0.08)] dark:bg-[#111315]/85 dark:border-[#343A40] dark:shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between" dir="rtl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-[#155A82] dark:text-foreground transition-colors" dir="ltr">
          <VisualIdentityImage field="portfolio_logo_path" className="h-8 w-8 rounded-lg object-contain"
            fallback={<span className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm shadow-xs">P</span>} />
          <span className="hidden sm:inline">Portfolio</span>
        </Link>

        {/* Desktop nav */}
        <div
          dir={dir}
          className="hidden md:flex items-center gap-1 p-1 rounded-full bg-[rgba(170,221,252,0.35)] dark:bg-muted/40 border border-white/55 dark:border-border shadow-[0_8px_30px_rgba(36,119,168,0.08)] dark:shadow-2xs backdrop-blur-[18px]"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#2477A8] dark:text-muted-foreground hover:text-primary dark:hover:text-foreground transition-all rounded-full hover:bg-white/60 dark:hover:bg-card hover:shadow-2xs"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="text-[#2477A8] hover:bg-white/40 dark:text-[#A7ADB4] dark:hover:text-white"
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            title={lang === 'en' ? 'العربية' : 'English'}
          >
            <Languages className="h-4 w-4 stroke-[1.8]" />
            <span className="ml-1 text-xs">{lang === 'en' ? 'AR' : 'EN'}</span>
          </Button>

          <ColorPicker />

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="text-[#2477A8] hover:bg-white/40 dark:text-[#A7ADB4] dark:hover:text-white"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={t('theme.toggle')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 stroke-[1.8]" /> : <Moon className="h-4 w-4 stroke-[1.8]" />}
            </Button>
          )}

          {session ? (
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="text-[#2477A8] hover:bg-white/40 dark:text-[#A7ADB4] dark:hover:text-white" title={t('nav.dashboard')}>
                <Shield className="h-4 w-4 stroke-[1.8]" />
              </Button>
            </Link>
          ) : (
            <Link href="/admin/login">
              <Button variant="ghost" size="icon" className="text-[#2477A8] hover:bg-white/40 dark:text-[#A7ADB4] dark:hover:text-white" title={t('nav.login')}>
                <Shield className="h-4 w-4 stroke-[1.8]" />
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-[#2477A8] hover:bg-white/40 dark:text-[#A7ADB4]"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5 stroke-[1.8]" /> : <Menu className="h-5 w-5 stroke-[1.8]" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-b border-white/60 bg-[rgba(218,241,253,0.95)] backdrop-blur-[20px] dark:bg-[#191C1F] dark:border-border" dir={dir}>
          <div className="container mx-auto px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-[#2477A8] hover:text-[#155A82] hover:bg-white/50 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-accent rounded-xl"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
