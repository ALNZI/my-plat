'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/app-context';
import { supabase, type Item, type Profile, type Message, type ContactSettings, getOwnerUserId } from '@/lib/supabase';
import { monthNames } from '@/lib/i18n';
import { Search, Calendar, Tag, ExternalLink, ArrowRight, Send, Mail, MapPin, Phone, Github, Linkedin, Twitter, Instagram, Youtube, Facebook, Globe, MessageCircle, Eye, Sparkles, Award, FolderGit2, GraduationCap, BookOpen, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CVExport } from '@/components/cv-export';
import { ItemDetailsDialog } from '@/components/item-details-dialog';
import { useProfile } from '@/contexts/app-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { VisualIdentityImage } from '@/components/visual-identity-image';

const CATEGORIES = ['projects', 'awards', 'certificates', 'research', 'other'] as const;

export function PortfolioSections() {
  const { t, lang, dir } = useLanguage();
  const { profile, loading: profileLoading } = useProfile();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [contactSettings, setContactSettings] = useState<ContactSettings | null>(null);

  useEffect(() => {
    loadItems();
    loadContactSettings();

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['projects', 'awards', 'certificates', 'research', 'other'].includes(hash)) {
        setActiveCategory(hash);
      } else if (hash === 'all') {
        setActiveCategory('all');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const loadContactSettings = useCallback(async () => {
    const { data } = await supabase.from('contact_settings').select('*').limit(1).maybeSingle();
    if (data) setContactSettings(data as ContactSettings);
  }, []);

  const loadItems = useCallback(async () => {
    const { data } = await supabase.from('items').select('*').order('sort_order', { ascending: true });
    setItems((data as Item[]) || []);
    setLoading(false);
  }, []);

  const years = useMemo(() => {
    const set = new Set<number>();
    items.forEach((i) => { if (i.year) set.add(i.year); });
    return Array.from(set).sort((a, b) => b - a);
  }, [items]);

  const days = useMemo(() => {
    const set = new Set<number>();
    items.forEach((i) => { if (i.day) set.add(i.day); });
    return Array.from(set).sort((a, b) => a - b);
  }, [items]);

  const filtered = useMemo(() => {
    let result = [...items];

    if (activeCategory !== 'all') {
      result = result.filter((i) => i.category === activeCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    if (yearFilter !== 'all') result = result.filter((i) => i.year === parseInt(yearFilter));
    if (monthFilter !== 'all') result = result.filter((i) => i.month === parseInt(monthFilter));
    if (dayFilter !== 'all') result = result.filter((i) => i.day === parseInt(dayFilter));

    if (sortBy === 'newest') result.sort((a, b) => (b.year || 0) - (a.year || 0));
    else if (sortBy === 'oldest') result.sort((a, b) => (a.year || 9999) - (b.year || 9999));
    else if (sortBy === 'title') result.sort((a, b) => a.title.localeCompare(b.title));

    return result;
  }, [items, activeCategory, search, yearFilter, monthFilter, dayFilter, sortBy]);

  const clearFilters = () => {
    setYearFilter('all');
    setMonthFilter('all');
    setDayFilter('all');
    setSearch('');
    setActiveCategory('all');
  };

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setSending(true);

    try {
      const targetUserId = await getOwnerUserId();

      if (!targetUserId) {
        toast.error(t('admin.error'));
        setSending(false);
        return;
      }

      const { error } = await supabase.from('messages').insert({
        user_id: targetUserId,
        visitor_name: contactForm.name,
        visitor_email: contactForm.email,
        subject: contactForm.subject,
        body: contactForm.message,
      });

      if (error) {
        console.error('Failed to insert message:', error);
        toast.error(t('admin.error'));
      } else {
        toast.success(t('contact.sent'));
        setContactForm({ name: '', email: '', subject: '', message: '' });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('messages-updated'));
        }
      }
    } catch (err) {
      console.error('Error submitting contact form:', err);
      toast.error(t('admin.error'));
    } finally {
      setSending(false);
    }
  };

  const formatDate = (item: Item) => {
    const parts: string[] = [];
    if (item.year) parts.push(String(item.year));
    if (item.month) parts.push(monthNames[lang][item.month - 1] || '');
    if (item.day) parts.push(String(item.day));
    return parts.join(' - ');
  };

  const socialPlatformMap: Record<string, { name: string; icon: typeof Github }> = {
    github: { name: 'GitHub', icon: Github },
    linkedin: { name: 'LinkedIn', icon: Linkedin },
    twitter: { name: 'Twitter / X', icon: Twitter },
    x: { name: 'Twitter / X', icon: Twitter },
    instagram: { name: 'Instagram', icon: Instagram },
    youtube: { name: 'YouTube', icon: Youtube },
    facebook: { name: 'Facebook', icon: Facebook },
    telegram: { name: 'Telegram', icon: Send },
    whatsapp: { name: 'WhatsApp', icon: MessageCircle },
    website: { name: 'Website', icon: Globe },
    web: { name: 'Website', icon: Globe },
    portfolio: { name: 'Portfolio', icon: Globe },
  };

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden border-b border-white/50 dark:border-border">
        <VisualIdentityImage field="hero_background_path" decorative className="absolute inset-0 w-full h-full object-cover" />
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          {profileLoading ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              <Skeleton className="h-32 w-32 rounded-2xl mx-auto" />
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-4 w-96 mx-auto" />
              <div className="flex gap-3 justify-center pt-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          ) : (
            <>
              {profile?.avatar_url && (
                <div className="mx-auto mb-6 max-w-[200px]">
                  <div className="rounded-2xl overflow-hidden border-4 border-white/60 dark:border-primary/20 shadow-lg bg-white/20 dark:bg-muted/30">
                    <img
                      src={profile.avatar_url}
                      alt={profile.site_name}
                      className="w-full h-auto block"
                      onError={(e) => {
                        (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
               <h1 className="text-4xl md:text-6xl font-bold mb-4 text-primary">
                {profile?.site_name || 'My Portfolio'}
              </h1>

              {profile?.bio && (
                <p className="text-lg text-[#2477A8] dark:text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
                  {profile.bio}
                </p>
              )}
              <div className="flex flex-wrap gap-3 justify-center">
                <a href="#projects">
                  <Button variant="brand" size="lg" className="rounded-full shadow-md font-semibold">
                    {t('hero.viewWork')}
                    <ArrowRight className="ml-2 h-4 w-4 rtl:rotate-180" />
                  </Button>
                </a>
                <a href="#contact">
                  <Button variant="pill" size="lg" className="rounded-full shadow-xs font-medium">
                    {t('hero.contact')}
                  </Button>
                </a>
                <CVExport profile={profile} items={items} />
              </div>

              {/* Stats Counters */}
              {items.length > 0 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto p-1.5 rounded-full bg-white/35 dark:bg-muted/40 border border-white/60 dark:border-border shadow-[0_8px_30px_rgba(36,119,168,0.08)] backdrop-blur-md">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/60 dark:bg-card text-[#155A82] dark:text-foreground border border-white/65 dark:border-border shadow-xs flex items-center gap-1.5">
                    <FolderGit2 className="h-3.5 w-3.5 text-[#2BA8A2]" />
                    {items.filter(i => i.category === 'projects').length} {t('section.projects')}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/60 dark:bg-card text-[#155A82] dark:text-foreground border border-white/65 dark:border-border shadow-xs flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-[#F59E0B]" />
                    {items.filter(i => i.category === 'awards').length} {t('section.awards')}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/60 dark:bg-card text-[#155A82] dark:text-foreground border border-white/65 dark:border-border shadow-xs flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-[#22C55E]" />
                    {items.filter(i => i.category === 'certificates').length} {t('section.certificates')}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/60 dark:bg-card text-[#155A82] dark:text-foreground border border-white/65 dark:border-border shadow-xs flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-[#EF4444]" />
                    {items.filter(i => i.category === 'research').length} {t('section.research')}
                  </span>
                </div>
              )}

              {/* Social links */}
              {profile?.social_links && Object.keys(profile.social_links).length > 0 && (
                <div className="flex flex-wrap gap-2.5 justify-center mt-6">
                  {Object.entries(profile.social_links).map(([key, rawUrl]) => {
                    const cleanKey = key.trim().toLowerCase();
                    const platform = socialPlatformMap[cleanKey];
                    const displayName = platform ? platform.name : (key.charAt(0).toUpperCase() + key.slice(1));
                    const Icon = platform ? platform.icon : ExternalLink;

                    let url = (rawUrl || '').trim();
                    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
                      url = `https://${url}`;
                    }

                    return (
                      <a key={key} href={url} target="_blank" rel="noopener noreferrer">
                        <Button variant="pill" size="pill" className="gap-2 text-xs font-medium hover:border-primary hover:text-primary transition-all shadow-xs">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          <span>{displayName}</span>
                        </Button>
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Dynamic contact buttons from contact_settings */}
              {contactSettings && (
                <div className="flex flex-wrap gap-2.5 justify-center mt-5">
                  {contactSettings.phone_visible && contactSettings.phone && (
                    <a
                      href={`https://wa.me/${contactSettings.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="pill" size="pill" className="gap-2 text-xs font-medium">
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        WhatsApp
                      </Button>
                    </a>
                  )}
                  {contactSettings.phone_visible && contactSettings.phone && (
                    <a href={`tel:${contactSettings.phone}`}>
                      <Button variant="pill" size="pill" className="gap-2 text-xs font-medium">
                        <Phone className="h-3.5 w-3.5 text-brandPrimary" />
                        Call
                      </Button>
                    </a>
                  )}
                  {contactSettings.email_visible && contactSettings.email && (
                    <a href={`mailto:${contactSettings.email}`}>
                      <Button variant="pill" size="pill" className="gap-2 text-xs font-medium">
                        <Mail className="h-3.5 w-3.5 text-blue-600" />
                        Email
                      </Button>
                    </a>
                  )}
                  {contactSettings.github_visible && contactSettings.github && (
                    <a href={contactSettings.github} target="_blank" rel="noopener noreferrer">
                      <Button variant="pill" size="pill" className="gap-2 text-xs font-medium">
                        <Github className="h-3.5 w-3.5" />
                        GitHub
                      </Button>
                    </a>
                  )}
                  {contactSettings.linkedin_visible && contactSettings.linkedin && (
                    <a href={contactSettings.linkedin} target="_blank" rel="noopener noreferrer">
                      <Button variant="pill" size="pill" className="gap-2 text-xs font-medium">
                        <Linkedin className="h-3.5 w-3.5 text-sky-600" />
                        LinkedIn
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Search & Filters */}
      <section className="sticky top-16 z-40 bg-[rgba(170,221,252,0.40)] dark:bg-background/80 backdrop-blur-md border-b border-white/55 dark:border-border py-4">
        <div className="container mx-auto px-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-[#2477A8] dark:text-muted-foreground stroke-[1.8]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('search.placeholder')}
                className="ltr:pl-10 rtl:pr-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap min-w-0">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-[120px] sm:w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t('sort.newest')}</SelectItem>
                  <SelectItem value="oldest">{t('sort.oldest')}</SelectItem>
                  <SelectItem value="title">{t('sort.title')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[90px] sm:w-[100px]">
                  <SelectValue placeholder={t('filter.year')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.all')}</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-[110px] sm:w-[120px]">
                  <SelectValue placeholder={t('filter.month')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.all')}</SelectItem>
                  {monthNames[lang].map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dayFilter} onValueChange={setDayFilter}>
                <SelectTrigger className="w-[75px] sm:w-[80px]">
                  <SelectValue placeholder={t('filter.day')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.all')}</SelectItem>
                  {days.map((d) => (
                    <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[#2477A8] hover:bg-white/40 dark:text-muted-foreground">
                {t('filter.clear')}
              </Button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="overflow-x-auto pb-1 -mb-1">
            <div className="flex gap-2 items-center p-1.5 rounded-full bg-white/35 dark:bg-muted/40 border border-white/60 dark:border-border w-fit min-w-max shadow-[0_8px_30px_rgba(36,119,168,0.08)] backdrop-blur-md">
            <Button
              variant={activeCategory === 'all' ? 'pillActive' : 'pill'}
              size="pill"
              onClick={() => setActiveCategory('all')}
              className="text-xs transition-all duration-200"
            >
              {t('section.all')}
              <span className={cn(
                'ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors',
                activeCategory === 'all' ? 'bg-white/25 text-white' : 'bg-white/60 dark:bg-muted text-[#2477A8] dark:text-foreground'
              )}>
                {items.length}
              </span>
            </Button>
            {CATEGORIES.map((cat) => {
              const count = items.filter((i) => i.category === cat).length;
              const isActive = activeCategory === cat;
              return (
                <Button
                  key={cat}
                  variant={isActive ? 'pillActive' : 'pill'}
                  size="pill"
                  onClick={() => setActiveCategory(cat)}
                  className="text-xs transition-all duration-200"
                >
                  {t(`section.${cat}` as any)}
                  {count > 0 && (
                    <span className={cn(
                      'ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors',
                      isActive ? 'bg-white/25 text-white' : 'bg-white/60 dark:bg-muted text-[#2477A8] dark:text-foreground'
                    )}>
                      {count}
                    </span>
                  )}
                </Button>
              );
            })}
            </div>
          </div>
        </div>
      </section>

      {/* Items grid */}
      <section id="projects" className="container mx-auto px-4 py-12 scroll-mt-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">{t('common.noData')}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filtered.length} {t('search.results')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => {
                const getCategoryVariant = (cat: string) => {
                  switch (cat) {
                    case 'projects': return 'brand';
                    case 'awards': return 'citrus';
                    case 'certificates': return 'botanical';
                    case 'research': return 'sale';
                    default: return 'pill';
                  }
                };

                return (
                  <Card
                    key={item.id}
                    id={item.category}
                    onClick={() => {
                      setSelectedItem(item);
                      setDetailsOpen(true);
                    }}
                    className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer border border-white/60 dark:border-border rounded-2xl bg-white/38 dark:bg-card hover:border-[#2BA8A2]/50 dark:hover:border-primary/40 backdrop-blur-[14px] dark:backdrop-blur-none"
                  >
                    {item.image_url && (
                      <div className="aspect-video overflow-hidden bg-white/10 dark:bg-muted relative">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-white text-xs font-medium flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
                            <Eye className="h-3.5 w-3.5 stroke-[1.8]" />
                            {lang === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                          </span>
                        </div>
                      </div>
                    )}
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant={getCategoryVariant(item.category) as any} className="mb-2 text-xs uppercase tracking-wide">
                            {t(`section.${item.category}` as any) || item.category}
                          </Badge>
                          <CardTitle className="text-lg text-[#155A82] group-hover:text-[#2BA8A2] dark:text-card-foreground dark:group-hover:text-primary transition-colors leading-snug">
                            {item.title}
                          </CardTitle>
                        </div>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#2477A8] hover:text-[#2BA8A2] dark:text-muted-foreground dark:hover:text-primary p-1 rounded-full hover:bg-white/40 dark:hover:bg-muted transition-colors"
                            title={lang === 'ar' ? 'رابط خارجي' : 'External link'}
                          >
                            <ExternalLink className="h-4 w-4 stroke-[1.8]" />
                          </a>
                        )}
                      </div>
                      {formatDate(item) && (
                        <div className="flex items-center gap-1.5 text-xs text-[#2477A8] dark:text-muted-foreground">
                          <Calendar className="h-3 w-3 stroke-[1.8]" />
                          {formatDate(item)}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {item.description && (
                        <CardDescription className="line-clamp-3 text-sm text-[#2477A8] dark:text-muted-foreground leading-relaxed">
                          {item.description}
                        </CardDescription>
                      )}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="pill" className="text-xs py-0.5 px-2">
                              <Tag className="h-2.5 w-2.5 mr-1 text-[#2477A8] dark:text-muted-foreground stroke-[1.8]" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Details Dialog */}
      <ItemDetailsDialog
        item={selectedItem}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      {/* Contact section */}
      <section id="contact" className="container mx-auto px-4 py-20 border-t border-white/40 dark:border-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2 text-[#155A82] dark:text-foreground">{t('section.contact')}</h2>
          <p className="text-center text-[#2477A8] dark:text-muted-foreground mb-8">{t('hero.contact')}</p>

          <Card className="rounded-2xl border border-white/60 bg-white/38 dark:border-border dark:bg-card shadow-[0_8px_30px_rgba(36,119,168,0.08)] backdrop-blur-[14px] dark:backdrop-blur-none">
            <CardContent className="pt-6">
              <form onSubmit={handleContact} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-[#155A82] dark:text-foreground">{t('contact.name')}</label>
                    <Input
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-[#155A82] dark:text-foreground">{t('contact.email')}</label>
                    <Input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-[#155A82] dark:text-foreground">{t('contact.subject')}</label>
                  <Input
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-[#155A82] dark:text-foreground">{t('contact.message')}</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    rows={5}
                    className="w-full rounded-xl border border-white/65 bg-white/45 px-3.5 py-2 text-sm text-[#155A82] placeholder:text-[#6FA7C8] backdrop-blur-md focus-visible:outline-none focus-visible:border-[#84C9F8] focus-visible:ring-3 focus-visible:ring-[#84C9F8]/20 transition-colors dark:border-[#343A40] dark:bg-[#202428] dark:text-[#F5F7F8] dark:placeholder:text-[#737A82] dark:focus-visible:border-[#10B981] dark:focus-visible:ring-1 dark:focus-visible:ring-[#10B981] dark:backdrop-blur-none"
                  />
                </div>
                <Button variant="brand" type="submit" disabled={sending} className="w-full rounded-full font-semibold shadow-sm">
                  <Send className="h-4 w-4 mr-2 stroke-[1.8]" />
                  {sending ? t('common.loading') : t('contact.send')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
