'use client';

import { useState, useEffect } from 'react';
import { useAuth, useLanguage, useProfile } from '@/contexts/app-context';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { supabase, type Item, type Message } from '@/lib/supabase';
import { LayoutDashboard, FolderKanban, Mail, Settings, LogOut, Home, Sun, Moon, Languages, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ItemsManager } from '@/components/admin/items-manager';
import { MessagesManager } from '@/components/admin/messages-manager';
import { SettingsManager } from '@/components/admin/settings-manager';
import { SettingsNavigation, type SettingsSection } from '@/components/admin/settings-navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'items' | 'messages' | 'settings';

export default function AdminDashboard() {
  const { session, loading, signOut } = useAuth();
  const { profile } = useProfile();
  const { theme, setTheme } = useTheme();
  const { t, lang, setLang, dir } = useLanguage();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('profile');
  const [stats, setStats] = useState({ items: 0, messages: 0, unread: 0 });
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !session) router.push('/admin/login');
  }, [session, loading, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!session) return;
    const fetchStats = async () => {
      const [itemsRes, messagesRes] = await Promise.all([
        supabase.from('items').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ]);
      const unreadRes = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'unread');
      setStats({
        items: itemsRes.count || 0,
        messages: messagesRes.count || 0,
        unread: unreadRes.count || 0,
      });
    };

    fetchStats();

    const handleUpdate = () => { fetchStats(); };
    window.addEventListener('messages-updated', handleUpdate);

    const channel = supabase
      .channel('admin-stats-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('messages-updated', handleUpdate);
      supabase.removeChannel(channel);
    };
  }, [session, tab]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!session) return null;

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: t('admin.dashboard'), icon: LayoutDashboard },
    { id: 'items', label: t('admin.items'), icon: FolderKanban },
    { id: 'messages', label: t('admin.messages'), icon: Mail },
    { id: 'settings', label: t('admin.settings'), icon: Settings },
  ];

  const renderNavItems = (isMobile: boolean) => (
    <>
      {tabs.map((tabItem) =>
        tabItem.id === 'settings' ? (
          <SettingsNavigation
            key={tabItem.id}
            active={tab === 'settings'}
            section={settingsSection}
            onSelect={(section) => {
              setSettingsSection(section);
              setTab('settings');
              if (isMobile) setMobileOpen(false);
            }}
          />
        ) : (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => {
              setTab(tabItem.id);
              if (isMobile) setMobileOpen(false);
            }}
            className={cn(
              'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap text-start',
              tab === tabItem.id
                ? 'bg-[#2BA8A2] dark:bg-[#10B981] text-white shadow-sm font-semibold'
                : 'text-[#2477A8] hover:text-[#155A82] hover:bg-white/45 dark:text-[#A7ADB4] dark:hover:text-[#F5F7F8] dark:hover:bg-[#25292D]'
            )}
          >
            <tabItem.icon className="h-5 w-5 shrink-0 stroke-[1.8]" />
            <span>{tabItem.label}</span>
            {tabItem.id === 'messages' && stats.unread > 0 && (
              <span className="ltr:ml-auto rtl:mr-auto bg-[#EF4444] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {stats.unread}
              </span>
            )}
          </button>
        )
      )}
    </>
  );

  return (
    <div className="min-h-screen text-[#155A82] dark:text-[#F5F7F8]" dir={dir}>
      {/* Top bar */}
      <header className="bg-[rgba(170,221,252,0.35)] backdrop-blur-[18px] border-b border-white/55 shadow-[0_8px_30px_rgba(36,119,168,0.08)] dark:bg-[#191C1F] dark:border-[#343A40] sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="h-9 w-9 rounded-xl bg-[#2BA8A2]/15 border border-[#2BA8A2]/30 flex items-center justify-center text-[#2BA8A2] dark:bg-[#10B981]/15 dark:border-[#10B981]/30 dark:text-[#10B981] hover:bg-[#2BA8A2]/25 dark:hover:bg-[#10B981]/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2BA8A2] dark:focus-visible:ring-[#10B981] md:pointer-events-none md:cursor-default"
              aria-label={t('admin.dashboard')}
              aria-expanded={mobileOpen}
              aria-controls="admin-mobile-drawer"
              title={t('admin.dashboard')}
            >
              <LayoutDashboard className="h-5 w-5 stroke-[1.8]" />
            </button>
            <span
              onClick={() => setMobileOpen((prev) => !prev)}
              className="font-bold text-lg text-[#155A82] dark:text-[#F5F7F8] hidden sm:inline md:cursor-default cursor-pointer select-none"
            >
              {t('admin.dashboard')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Theme Toggle Button */}
            {mounted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-9 w-9 p-0 rounded-xl border-white/65 bg-white/40 text-[#2477A8] hover:bg-white/65 dark:border-[#343A40] dark:bg-[#202428] dark:text-[#A7ADB4] dark:hover:text-white hidden xs:flex"
                title={t('theme.toggle')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 stroke-[1.8]" /> : <Moon className="h-4 w-4 stroke-[1.8]" />}
              </Button>
            )}

            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="gap-1 h-9 px-2 sm:px-3 rounded-xl border-white/65 bg-white/40 text-xs font-medium text-[#2477A8] hover:bg-white/65 dark:border-[#343A40] dark:bg-[#202428] dark:text-[#F5F7F8] dark:hover:bg-[#25292D]"
              title={lang === 'en' ? 'التحويل إلى العربية' : 'Switch to English'}
            >
              <Languages className="h-4 w-4 text-[#2BA8A2] dark:text-[#10B981] stroke-[1.8]" />
              <span className="hidden sm:inline">{lang === 'en' ? 'AR' : 'EN'}</span>
            </Button>

            {/* Admin Profile Info */}
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-white/40 border border-white/65 text-[#155A82] dark:bg-[#202428] dark:border-[#343A40] dark:text-[#A7ADB4]">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.site_name || 'Admin'}
                  className="h-7 w-7 rounded-full object-cover border border-white/65 dark:border-[#343A40] flex-shrink-0"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-[#2BA8A2] dark:bg-[#10B981] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {session?.user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
              <span className="text-xs font-medium text-[#2477A8] dark:text-[#A7ADB4] hidden lg:inline max-w-[120px] truncate">
                {session?.user?.email}
              </span>
            </div>

            <Link href="/">
              <Button variant="outline" size="sm" className="h-9 px-2 sm:px-3 rounded-xl border-white/65 bg-white/40 text-xs font-medium text-[#2477A8] hover:bg-white/65 dark:border-[#343A40] dark:bg-[#202428] dark:text-[#F5F7F8] dark:hover:bg-[#25292D]">
                <Home className="h-4 w-4 text-[#2477A8] dark:text-[#A7ADB4] stroke-[1.8]" />
                <span className="hidden sm:inline ltr:ml-1.5 rtl:mr-1.5">{t('nav.home')}</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="h-9 px-2 sm:px-3 rounded-xl border-[#EF4444]/30 bg-white/40 text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/15 dark:bg-[#202428]">
              <LogOut className="h-4 w-4 stroke-[1.8]" />
              <span className="hidden sm:inline ltr:ml-1.5 rtl:mr-1.5">{t('nav.logout')}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Drawer */}
      <aside
        id="admin-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t('admin.dashboard')}
        className={cn(
          'fixed inset-y-0 z-50 w-72 max-w-[85vw] flex flex-col p-4 shadow-2xl transition-transform duration-300 ease-in-out md:hidden',
          'bg-[rgba(235,246,255,0.96)] dark:bg-[#191C1F] backdrop-blur-[20px] border-white/55 dark:border-[#343A40]',
          dir === 'rtl' ? 'right-0 border-l' : 'left-0 border-r',
          mobileOpen
            ? 'translate-x-0'
            : dir === 'rtl'
            ? 'translate-x-full'
            : '-translate-x-full',
          !mobileOpen && 'pointer-events-none'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-white/55 dark:border-[#343A40]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#2BA8A2]/15 border border-[#2BA8A2]/30 flex items-center justify-center text-[#2BA8A2] dark:bg-[#10B981]/15 dark:border-[#10B981]/30 dark:text-[#10B981]">
              <LayoutDashboard className="h-4 w-4 stroke-[1.8]" />
            </div>
            <span className="font-bold text-base text-[#155A82] dark:text-[#F5F7F8]">{t('admin.dashboard')}</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="h-8 w-8 rounded-xl border border-white/65 bg-white/40 text-[#2477A8] hover:bg-white/65 dark:border-[#343A40] dark:bg-[#202428] dark:text-[#A7ADB4] dark:hover:text-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2BA8A2] dark:focus-visible:ring-[#10B981]"
            aria-label={t('admin.cancel')}
          >
            <X className="h-4 w-4 stroke-[2]" />
          </button>
        </div>

        {/* Drawer Navigation List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-1 px-1">
          <nav aria-label={t('admin.dashboard')} className="flex flex-col gap-1.5">
            {renderNavItems(true)}
          </nav>
        </div>
      </aside>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-60 flex-shrink-0">
            <nav aria-label={t('admin.dashboard')} className="flex flex-col gap-1.5 p-2 rounded-2xl bg-white/32 border border-white/55 backdrop-blur-[18px] shadow-[0_8px_30px_rgba(36,119,168,0.08)] dark:bg-[#191C1F] dark:border-[#343A40] dark:backdrop-blur-none dark:shadow-sm overflow-visible">
              {renderNavItems(false)}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {tab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#155A82] dark:text-[#F5F7F8]">{t('admin.dashboard')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="rounded-2xl border-white/60 bg-white/38 text-[#155A82] backdrop-blur-[14px] shadow-[0_8px_30px_rgba(36,119,168,0.08)] hover:border-[#2BA8A2]/50 dark:border-[#343A40] dark:bg-[#191C1F] dark:text-[#F5F7F8] dark:hover:border-[#10B981]/40 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-[#2BA8A2]/15 border border-[#2BA8A2]/30 flex items-center justify-center text-[#2BA8A2] dark:bg-[#10B981]/15 dark:border-[#10B981]/30 dark:text-[#10B981]">
                          <FolderKanban className="h-6 w-6 stroke-[1.8]" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-[#155A82] dark:text-[#F5F7F8]">{stats.items}</p>
                          <p className="text-sm text-[#2477A8] dark:text-[#A7ADB4]">{t('admin.totalItems')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border-white/60 bg-white/38 text-[#155A82] backdrop-blur-[14px] shadow-[0_8px_30px_rgba(36,119,168,0.08)] hover:border-[#84C9F8]/50 dark:border-[#343A40] dark:bg-[#191C1F] dark:text-[#F5F7F8] dark:hover:border-[#38BDF8]/40 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-[#84C9F8]/20 border border-[#84C9F8]/40 flex items-center justify-center text-[#2477A8] dark:bg-[#38BDF8]/15 dark:border-[#38BDF8]/30 dark:text-[#38BDF8]">
                          <Mail className="h-6 w-6 stroke-[1.8]" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-[#155A82] dark:text-[#F5F7F8]">{stats.messages}</p>
                          <p className="text-sm text-[#2477A8] dark:text-[#A7ADB4]">{t('admin.totalMessages')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border-white/60 bg-white/38 text-[#155A82] backdrop-blur-[14px] shadow-[0_8px_30px_rgba(36,119,168,0.08)] hover:border-[#EF4444]/50 dark:border-[#343A40] dark:bg-[#191C1F] dark:text-[#F5F7F8] dark:hover:border-[#EF4444]/40 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
                          <Mail className="h-6 w-6 stroke-[1.8]" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-[#155A82] dark:text-[#F5F7F8]">{stats.unread}</p>
                          <p className="text-sm text-[#2477A8] dark:text-[#A7ADB4]">{t('admin.unreadMessages')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="rounded-2xl border-white/60 bg-white/38 text-[#155A82] backdrop-blur-[14px] shadow-[0_8px_30px_rgba(36,119,168,0.08)] dark:border-[#343A40] dark:bg-[#191C1F] dark:text-[#F5F7F8]">
                  <CardContent className="pt-6">
                    <p className="text-sm text-[#2477A8] dark:text-[#A7ADB4] mb-4">
                      Welcome to your dashboard. Use the sidebar to manage your portfolio items, messages, and settings.
                    </p>
                    <div className="flex gap-2.5 flex-wrap">
                      <Button onClick={() => setTab('items')} variant="brand">
                        <FolderKanban className="h-4 w-4 mr-2 stroke-[1.8]" />
                        {t('admin.items')}
                      </Button>
                      <Button variant="secondary" onClick={() => setTab('messages')}>
                        <Mail className="h-4 w-4 mr-2 stroke-[1.8]" />
                        {t('admin.messages')}
                      </Button>
                      <Button variant="secondary" onClick={() => setTab('settings')}>
                        <Settings className="h-4 w-4 mr-2 stroke-[1.8]" />
                        {t('admin.settings')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === 'items' && <ItemsManager />}
            {tab === 'messages' && <MessagesManager />}
            {tab === 'settings' && <SettingsManager section={settingsSection} />}
          </main>
        </div>
      </div>
    </div>
  );
}
