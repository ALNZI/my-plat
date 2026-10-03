'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type Language, translations, type TranslationKey } from '@/lib/i18n';
import { supabase, type Profile } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

// ---- Theme Provider (wraps next-themes) ----
export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// ---- Language Context ----
type LanguageContextType = {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
  dir: 'ltr' | 'rtl';
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('portfolio-lang') as Language | null;
      if (saved === 'en' || saved === 'ar') setLangState(saved);
    } catch {
      // In Safari private mode or if blocked, fallback gracefully
    }
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem('portfolio-lang', l);
    } catch {}
  }, []);

  const t = useCallback((key: TranslationKey) => translations[lang][key] || key, [lang]);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

// ---- Color Context ----
type ColorContextType = {
  hue: number;
  setHue: (h: number) => void;
  resetColor: () => void;
};

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [hue, setHueState] = useState<number>(177);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('portfolio-hue');
      if (saved) setHueState(parseInt(saved));
    } catch {
      // In Safari private mode or if blocked, fallback gracefully
    }
  }, []);

  const setHue = useCallback((h: number) => {
    setHueState(h);
    try {
      localStorage.setItem('portfolio-hue', String(h));
    } catch {}
    applyHue(h);
  }, []);

  const resetColor = useCallback(() => {
    setHue(177);
  }, [setHue]);

  useEffect(() => {
    applyHue(hue);
  }, [hue]);

  return (
    <ColorContext.Provider value={{ hue, setHue, resetColor }}>
      {children}
    </ColorContext.Provider>
  );
}

function applyHue(h: number) {
  const root = document.documentElement;
  // Apply vibrant primary accent hue
  root.style.setProperty('--primary', `${h} 65% 42%`);
  root.style.setProperty('--primary-foreground', '0 0% 100%');
  root.style.setProperty('--ring', `${h} 65% 42%`);
  root.style.setProperty('--chart-1', `${h} 65% 42%`);
  root.style.setProperty('--chart-2', `${(h + 120) % 360} 60% 45%`);
  root.style.setProperty('--chart-3', `${(h + 240) % 360} 60% 55%`);
}

export function useColor() {
  const ctx = useContext(ColorContext);
  if (!ctx) throw new Error('useColor must be used within ColorProvider');
  return ctx;
}

// ---- Auth Context ----
type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        console.info('[Auth] getSession result', {
          hasSession: !!data?.session,
          hasUser: !!data?.session?.user,
          userId: data?.session?.user?.id ?? null,
          error: error?.message ?? null,
        });

        setSession(data.session ?? null);
      } catch (error) {
        console.error('[Auth] getSession failed', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void syncSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
      console.info('[Auth] onAuthStateChange', {
        event,
        hasSession: !!sess,
        hasUser: !!sess?.user,
        userId: sess?.user?.id ?? null,
        pathname: typeof window !== 'undefined' ? window.location.pathname : null,
      });

      setSession(sess ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const pathname = typeof window !== 'undefined' ? window.location.pathname : null;
      console.info('[Auth] signInWithPassword start', {
        pathname,
        email: email ? `${email.slice(0, 2)}***@${email.split('@')[1] ?? 'unknown'}` : null,
      });

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      console.info('[Auth] signInWithPassword result', {
        pathname,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        userId: data?.user?.id ?? null,
        error: error?.message ?? null,
      });

      if (data?.session && data?.user) {
        setSession(data.session);
      }

      return { error: error?.message || null };
    } catch (error) {
      console.error('[Auth] signInWithPassword crashed', error);
      return { error: 'Unexpected sign-in error. Please try again.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ---- Profile Context (loads owner profile for public view) ----
type ProfileContextType = {
  profile: Profile | null;
  loading: boolean;
  refresh: () => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*')
        .order('created_at', { ascending: true }).order('id', { ascending: true }).limit(1).maybeSingle();
      if (!error) setProfile(data as Profile | null);
    } catch {
      // Preserve the last successfully loaded profile during network failures.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const reload = () => { void loadProfile(); };
    reload();
    window.addEventListener('focus', reload);
    window.addEventListener('portfolio-profile-updated', reload);
    // Refresh returning visitors without requiring Supabase Realtime configuration.
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') reload();
    }, 60000);
    return () => {
      window.removeEventListener('focus', reload);
      window.removeEventListener('portfolio-profile-updated', reload);
      window.clearInterval(timer);
    };
  }, [loadProfile]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh: loadProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
