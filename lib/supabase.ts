import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables are missing. Please check your .env file or Vercel Environment Variables.');
}

const memoryStorage = new Map<string, string>();

const safeLocalStorageAdapter = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key) ?? memoryStorage.get(key) ?? null;
      }
    } catch (error) {
      console.warn('[Supabase Auth] localStorage read failed, using in-memory fallback.', error);
    }

    return memoryStorage.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        memoryStorage.set(key, value);
        return;
      }
    } catch (error) {
      console.warn('[Supabase Auth] localStorage write failed, using in-memory fallback.', error);
    }

    memoryStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('[Supabase Auth] localStorage remove failed.', error);
    }

    memoryStorage.delete(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: safeLocalStorageAdapter,
    storageKey: 'portfolio-auth',
  },
});

export type Profile = {
  id: string;
  site_name: string;
  bio: string;
  avatar_url: string;
  social_links: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type ItemCategory = 'projects' | 'awards' | 'certificates' | 'research' | 'other';

export type Item = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string;
  content: string;
  image_url: string;
  link: string;
  tags: string[];
  year: number | null;
  month: number | null;
  day: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type MessageStatus = 'unread' | 'read' | 'replied';

export type Message = {
  id: string;
  user_id: string;
  visitor_name: string;
  visitor_email: string;
  subject: string;
  body: string;
  reply: string;
  status: MessageStatus;
  created_at: string;
  replied_at: string | null;
};

export type ItemInput = Omit<Item, 'id' | 'user_id' | 'created_at' | 'updated_at'>;


export type ContactSettings = {
  id: string;
  phone: string;
  phone_visible: boolean;
  email: string;
  email_visible: boolean;
  github: string;
  github_visible: boolean;
  linkedin: string;
  linkedin_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatFAQ = {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  keywords: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function getOwnerUserId(): Promise<string | null> {
  try {
    // 1. Check profiles table
    const { data: profile } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    if (profile?.id) return profile.id;

    // 2. Check visual_identity_settings table
    const { data: visual } = await supabase.from('visual_identity_settings').select('owner_user_id').limit(1).maybeSingle();
    if (visual?.owner_user_id) return visual.owner_user_id;

    // 3. Check items table
    const { data: item } = await supabase.from('items').select('user_id').limit(1).maybeSingle();
    if (item?.user_id) return item.user_id;

    // 4. Check active auth session if logged in
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user?.id) return sessionData.session.user.id;
  } catch (err) {
    console.error('Error fetching owner user ID:', err);
  }

  return null;
}

