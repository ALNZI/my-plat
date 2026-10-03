'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { VISUAL_IDENTITY_UPDATED_EVENT, type VisualIdentitySettings } from '@/lib/visual-identity';
import { safeTimeoutSignal } from '@/lib/utils';

const Context = createContext<{ settings: VisualIdentitySettings | null; loaded: boolean }>({ settings: null, loaded: false });

export function VisualIdentityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<VisualIdentitySettings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const version = useRef(0);
  const reload = useCallback(async () => {
    const current = ++version.current;
    try {
      const signal = safeTimeoutSignal(10000);
      let query = supabase.from('visual_identity_settings').select('*').eq('id', true);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query.maybeSingle();
      if (!error && current === version.current) {
        setSettings(data as VisualIdentitySettings | null);
        setLoaded(true);
      }
    } catch { /* Keep the last known images during a connection failure. */ }
  }, []);
  useEffect(() => {
    const refresh = () => { void reload(); };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener(VISUAL_IDENTITY_UPDATED_EVENT, refresh);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 60000);
    return () => {
      version.current++;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(VISUAL_IDENTITY_UPDATED_EVENT, refresh);
    };
  }, [reload]);
  return <Context.Provider value={{ settings, loaded }}>{children}</Context.Provider>;
}

export const useVisualIdentity = () => useContext(Context);
