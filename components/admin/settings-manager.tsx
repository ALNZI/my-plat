'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage, useAuth } from '@/contexts/app-context';
import { AlertCircle } from 'lucide-react';
import { supabase, type Profile, type ContactSettings, type ChatFAQ } from '@/lib/supabase';
import {
  Save, Download, Database, Mail, Lock, Shield, Plus, Trash2,
  User, Eye, EyeOff, KeyRound, Upload, Link as LinkIcon,
  ImageIcon, FolderOpen, Globe, X, Terminal, Wifi, WifiOff,
  Send, MessageSquare, Phone, Github, Linkedin, Bug, Activity,
  Instagram, Youtube, Facebook, Twitter, MessageCircle, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VisualIdentitySection } from '@/components/admin/visual-identity-section';
import type { SettingsSection } from '@/components/admin/settings-navigation';

export function SettingsManager({ section = 'profile' }: { section?: SettingsSection }) {
  const { dir } = useLanguage();

  return (
    <div className="space-y-6" dir={dir}>
      {section === 'profile' && <ProfileSection />}
      {section === 'visual-identity' && <VisualIdentitySection />}
      {section === 'contact' && <ContactChatSection />}
      {section === 'security' && <SecuritySection />}
      {section === 'advanced' && <AdvancedSection />}
    </div>
  );
}

const SUGGESTED_PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/' },
  { id: 'github', label: 'GitHub', icon: Github, placeholder: 'https://github.com/' },
  { id: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://x.com/' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/' },
  { id: 'telegram', label: 'Telegram', icon: Send, placeholder: 'https://t.me/' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: 'https://wa.me/' },
  { id: 'website', label: 'Website', icon: Globe, placeholder: 'https://' },
] as const;

// ===================== Profile Section =====================
function ProfileSection() {
  const { t, lang } = useLanguage();
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [newSocialKey, setNewSocialKey] = useState('');
  const [newSocialValue, setNewSocialValue] = useState('');

  const isAr = lang === 'ar';

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').limit(1).maybeSingle();
        if (error) {
          console.error('Profile load error:', error.message);
        }
        if (data) {
          setProfile(data as Profile);
          setSocialLinks((data as Profile).social_links || {});
        } else if (session?.user) {
          setProfile({
            id: session.user.id,
            site_name: 'My Portfolio',
            bio: '',
            avatar_url: '',
            social_links: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setSocialLinks({});
        }
      } catch (err) {
        console.error('Profile load exception:', err);
      }
      setLoading(false);
    })();
  }, [session?.user]);

  const handleSave = async () => {
    if (!session?.user) return;
    setSaving(true);
    try {
      const site_name = profile?.site_name || 'My Portfolio';
      const bio = profile?.bio || '';
      const avatar_url = profile?.avatar_url || '';

      const { data: existing } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle();

      let saveError;
      if (existing) {
        const { error } = await supabase
          .from('profiles')
          .update({
            site_name,
            bio,
            avatar_url,
            social_links: socialLinks,
          })
          .eq('id', session.user.id);
        saveError = error;
      } else {
        const { error } = await supabase.from('profiles').insert({
          id: session.user.id,
          site_name,
          bio,
          avatar_url,
          social_links: socialLinks,
        });
        saveError = error;
      }

      if (saveError) {
        console.error('Profile save error:', saveError.message);
        toast.error(t('admin.error'));
      } else {
        toast.success(t('admin.saved'));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('portfolio-profile-updated'));
        }
      }
    } catch (err) {
      console.error('Profile save exception:', err);
      toast.error(t('admin.error'));
    }
    setSaving(false);
  };

  const addSocialLink = () => {
    if (!newSocialKey.trim()) {
      toast.error(isAr ? 'يرجى اختيار أو كتابة المنصة' : 'Please select or enter a platform');
      return;
    }
    let url = newSocialValue.trim();
    if (!url) {
      toast.error(isAr ? 'يرجى إدخال الرابط' : 'Please enter the URL');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
      url = `https://${url}`;
    }
    setSocialLinks({ ...socialLinks, [newSocialKey.trim().toLowerCase()]: url });
    setNewSocialKey('');
    setNewSocialValue('');
  };

  const removeSocialLink = (key: string) => {
    const next = { ...socialLinks };
    delete next[key];
    setSocialLinks(next);
  };

  if (loading) return <p className="text-muted-foreground">{t('common.loading')}</p>;

  return (
    <div className={cn('space-y-6', isAr ? 'max-w-2xl mx-auto' : 'max-w-3xl')}>
      <div className={isAr ? 'text-center' : ''}>
        <h3 className="text-xl font-bold">{t('admin.profileSettings')}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t('admin.profileDesc')}</p>
      </div>

      <Card className={cn('shadow-sm border-border/80', isAr && 'border-primary/20')}>
        <CardHeader className={isAr ? 'text-center border-b pb-4' : ''}>
          <CardTitle className={cn('flex items-center gap-2', isAr && 'justify-center text-lg')}>
            <User className="h-5 w-5 text-primary" />
            {t('admin.profileSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="siteName">{t('admin.siteName')}</Label>
            <Input
              id="siteName"
              value={profile?.site_name || ''}
              onChange={(e) => setProfile({ ...profile!, site_name: e.target.value })}
              placeholder="My Portfolio"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t('admin.bio')}</Label>
            <Textarea
              id="bio"
              value={profile?.bio || ''}
              onChange={(e) => setProfile({ ...profile!, bio: e.target.value })}
              rows={3}
              placeholder="A brief description about yourself..."
            />
          </div>

          <AvatarPicker
            avatarUrl={profile?.avatar_url || ''}
            onAvatarChange={(url) => setProfile({ ...profile!, avatar_url: url })}
          />

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <LinkIcon className="h-4 w-4 text-primary" />
                {t('admin.socialLinks')}
              </Label>
              <span className="text-xs text-muted-foreground">
                {isAr ? 'اختر منصة مقترحة أو اكتب اسماً مخصصاً' : 'Choose a suggested platform or enter custom name'}
              </span>
            </div>

            {/* Quick suggested platforms */}
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-muted/40 border border-border/60">
              <span className="text-xs font-medium text-muted-foreground mr-1">
                {isAr ? 'مقترحات:' : 'Suggestions:'}
              </span>
              {SUGGESTED_PLATFORMS.map((p) => {
                const PIcon = p.icon;
                const isSelected = newSocialKey.toLowerCase() === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setNewSocialKey(p.id);
                      if (!newSocialValue || newSocialValue.startsWith('https://')) {
                        setNewSocialValue(p.placeholder);
                      }
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background hover:bg-muted text-foreground border-border hover:border-primary/40'
                    )}
                  >
                    <PIcon className="h-3 w-3" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            {Object.keys(socialLinks).length === 0 && (
              <p className="text-sm text-muted-foreground italic py-1">{t('admin.noSocialLinks')}</p>
            )}

            <div className="space-y-2">
              {Object.entries(socialLinks).map(([key, val]) => {
                const platform = SUGGESTED_PLATFORMS.find(p => p.id === key.toLowerCase());
                const Icon = platform ? platform.icon : ExternalLink;
                const label = platform ? platform.label : (key.charAt(0).toUpperCase() + key.slice(1));
                return (
                  <div key={key} className="flex gap-2 items-center group">
                    <div className="w-36 px-3 py-2 rounded-lg bg-muted text-sm font-medium flex items-center gap-2 shrink-0 border border-border/60">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{label}</span>
                    </div>
                    <Input
                      value={val}
                      onChange={(e) => setSocialLinks({ ...socialLinks, [key]: e.target.value })}
                      className="flex-1 font-mono text-xs"
                      dir="ltr"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSocialLink(key)}
                      className="text-destructive hover:text-destructive shrink-0"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
              <Input
                value={newSocialKey}
                onChange={(e) => setNewSocialKey(e.target.value)}
                placeholder={isAr ? 'المنصة (مثال: GitHub)' : 'Platform'}
                className="w-full sm:w-36"
              />
              <Input
                value={newSocialValue}
                onChange={(e) => setNewSocialValue(e.target.value)}
                placeholder={isAr ? 'الرابط (مثال: https://...)' : 'URL (e.g. https://...)'}
                className="flex-1"
                dir="ltr"
              />
              <Button variant="outline" onClick={addSocialLink} className="gap-1.5 shrink-0">
                <Plus className="h-4 w-4" />
                {isAr ? 'إضافة رابط' : 'Add Link'}
              </Button>
            </div>
          </div>

          <div className={cn('pt-2 flex', isAr ? 'justify-center' : 'justify-start')}>
            <Button onClick={handleSave} disabled={saving} className="gap-2 px-8 min-w-[160px]">
              <Save className="h-4 w-4" />
              {saving ? t('common.loading') : t('admin.save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===================== Avatar Picker Component =====================
function AvatarPicker({ avatarUrl, onAvatarChange }: { avatarUrl: string; onAvatarChange: (url: string) => void }) {
  const { t } = useLanguage();
  const [imageSource, setImageSource] = useState<'gallery' | 'files' | 'url'>('url');
  const [urlInput, setUrlInput] = useState(avatarUrl);
  const [imgError, setImgError] = useState(false);
  const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number } | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrlInput(avatarUrl);
    setImgError(false);
    setImgDimensions(null);
  }, [avatarUrl]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('cv.uploadError'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onAvatarChange(result);
      setUrlInput(result);
    };
    reader.onerror = () => toast.error(t('cv.uploadError'));
    reader.readAsDataURL(file);
  }, [onAvatarChange, t]);

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUrlApply = () => {
    if (urlInput.trim()) {
      onAvatarChange(urlInput.trim());
      setImgError(false);
    }
  };

  const handleRemoveImage = () => {
    onAvatarChange('');
    setUrlInput('');
    setImgError(false);
    setImgDimensions(null);
  };

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImgDimensions({ w: img.naturalWidth, h: img.naturalHeight });
    setImgError(false);
  };

  const handleImgError = () => {
    setImgError(true);
    setImgDimensions(null);
  };

  const previewStyle: React.CSSProperties = imgDimensions
    ? { maxWidth: '200px', width: '100%', height: 'auto' }
    : { maxWidth: '200px', width: '100%', aspectRatio: '1 / 1' };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        {t('admin.avatar')}
      </Label>

      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant={imageSource === 'gallery' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setImageSource('gallery');
            galleryInputRef.current?.click();
          }}
          className="gap-1.5"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          {t('cv.fromGallery')}
        </Button>
        <Button
          type="button"
          variant={imageSource === 'files' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setImageSource('files');
            filesInputRef.current?.click();
          }}
          className="gap-1.5"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          {t('cv.fromFiles')}
        </Button>
        <Button
          type="button"
          variant={imageSource === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setImageSource('url')}
          className="gap-1.5"
        >
          <Globe className="h-3.5 w-3.5" />
          {t('cv.fromUrl')}
        </Button>
      </div>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleGallerySelect}
      />
      <input
        ref={filesInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {imageSource === 'url' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={t('cv.imageUrlPlaceholder')}
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={handleUrlApply} className="gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            {t('cv.applyImage')}
          </Button>
        </div>
      )}

      {avatarUrl && !imgError && (
        <div className="flex items-start gap-3">
          <div
            className="rounded-xl overflow-hidden border-2 border-border shadow-sm bg-muted/30"
            style={previewStyle}
          >
            <img
              src={avatarUrl}
              alt="Avatar preview"
              className="w-full h-auto block"
              onLoad={handleImgLoad}
              onError={handleImgError}
            />
          </div>
          {imgDimensions && (
            <div className="text-xs text-muted-foreground space-y-1 pt-1">
              <p>{imgDimensions.w} x {imgDimensions.h}px</p>
              <p className="italic">Original aspect ratio preserved</p>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveImage}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
            {t('cv.removeImage')}
          </Button>
        </div>
      )}

      {avatarUrl && imgError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {t('cv.uploadError')}
        </div>
      )}
    </div>
  );
}


// ===================== Contact & Chat Section =====================
function ContactChatSection() {
  const { t, lang } = useLanguage();
  const { session } = useAuth();
  const [contact, setContact] = useState<ContactSettings | null>(null);
  const [faqs, setFaqs] = useState<ChatFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingContact, setSavingContact] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', keywords: '' });

  const isAr = lang === 'ar';

  useEffect(() => {
    (async () => {
      if (!session?.user) return;
      try {
        const [contactRes, faqRes] = await Promise.all([
          supabase.from('contact_settings').select('*').eq('id', session.user.id).maybeSingle(),
          supabase.from('chat_faq').select('*').eq('user_id', session.user.id).order('sort_order', { ascending: true }),
        ]);

        if (contactRes.error) console.error('Contact settings load error:', contactRes.error.message);
        if (faqRes.error) console.error('FAQ load error:', faqRes.error.message);

        if (contactRes.data) {
          setContact(contactRes.data as ContactSettings);
        } else {
          setContact({
            id: session.user.id,
            phone: '', phone_visible: false,
            email: '', email_visible: false,
            github: '', github_visible: false,
            linkedin: '', linkedin_visible: false,
            created_at: '', updated_at: '',
          });
        }
        if (faqRes.data) setFaqs(faqRes.data as ChatFAQ[]);
      } catch (err) {
        console.error('Contact/FAQ load exception:', err);
      }
      setLoading(false);
    })();
  }, [session]);

  const handleSaveContact = async () => {
    if (!contact || !session?.user) return;
    setSavingContact(true);
    try {
      const { error } = await supabase.from('contact_settings').upsert({
        id: session.user.id,
        phone: contact.phone,
        phone_visible: contact.phone_visible,
        email: contact.email,
        email_visible: contact.email_visible,
        github: contact.github,
        github_visible: contact.github_visible,
        linkedin: contact.linkedin,
        linkedin_visible: contact.linkedin_visible,
      });
      if (error) {
        console.error('Contact save error:', error.message);
        toast.error(t('admin.contactSaveError'));
      } else {
        toast.success(t('admin.contactSaved'));
      }
    } catch (err) {
      console.error('Contact save exception:', err);
      toast.error(t('admin.contactSaveError'));
    }
    setSavingContact(false);
  };

  const handleAddFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim() || !session?.user) return;
    try {
      const keywords = newFaq.keywords
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      const { data, error } = await supabase.from('chat_faq').insert({
        user_id: session.user.id,
        question: newFaq.question.trim(),
        answer: newFaq.answer.trim(),
        keywords,
        sort_order: faqs.length,
      }).select('*').single();

      if (error) {
        console.error('FAQ insert error:', error.message);
        toast.error(t('admin.faqError'));
      } else {
        setFaqs([...faqs, data as ChatFAQ]);
        setNewFaq({ question: '', answer: '', keywords: '' });
        toast.success(t('admin.faqSaved'));
      }
    } catch (err) {
      console.error('FAQ insert exception:', err);
      toast.error(t('admin.faqError'));
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      const { error } = await supabase.from('chat_faq').delete().eq('id', id);
      if (error) {
        console.error('FAQ delete error:', error.message);
        toast.error(t('admin.faqDeleteError'));
      } else {
        setFaqs(faqs.filter((f) => f.id !== id));
        toast.success(t('admin.faqDeleted'));
      }
    } catch (err) {
      console.error('FAQ delete exception:', err);
      toast.error(t('admin.faqDeleteError'));
    }
  };

  if (loading) return <p className="text-muted-foreground">{t('common.loading')}</p>;

  return (
    <div className={cn('space-y-6', isAr ? 'max-w-2xl mx-auto' : 'max-w-3xl')}>
      {/* Contact Settings */}
      <div className={isAr ? 'text-center' : ''}>
        <h3 className="text-xl font-bold">{t('admin.contactSettings')}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t('admin.contactDesc')}</p>
      </div>

      <Card className={cn('shadow-sm border-border/80', isAr && 'border-primary/20')}>
        <CardHeader className={isAr ? 'text-center border-b pb-4' : ''}>
          <CardTitle className={cn('flex items-center gap-2', isAr && 'justify-center text-lg')}>
            <Phone className="h-5 w-5 text-primary" />
            {t('admin.contactSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          {/* Phone / WhatsApp */}
          {/* Phone / WhatsApp */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-white/40 dark:bg-muted/30 border border-white/65 dark:border-border transition-all shadow-2xs">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>{t('admin.phone')}</span>
              </Label>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs text-muted-foreground select-none">{t('admin.phoneVisible')}</span>
                <Switch
                  id="phone-visible"
                  checked={contact?.phone_visible || false}
                  onCheckedChange={(v) => setContact({ ...contact!, phone_visible: v })}
                />
              </div>
            </div>
            <Input
              id="phone"
              value={contact?.phone || ''}
              onChange={(e) => setContact({ ...contact!, phone: e.target.value })}
              placeholder="+1234567890"
              className="bg-white/70 dark:bg-card border-white/80 dark:border-border h-10 text-sm"
              dir="ltr"
            />
          </div>

          {/* Email */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-white/40 dark:bg-muted/30 border border-white/65 dark:border-border transition-all shadow-2xs">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="contactEmail" className="flex items-center gap-2 text-sm font-semibold">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span>{t('admin.emailAddr')}</span>
              </Label>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs text-muted-foreground select-none">{t('admin.emailVisible')}</span>
                <Switch
                  id="email-visible"
                  checked={contact?.email_visible || false}
                  onCheckedChange={(v) => setContact({ ...contact!, email_visible: v })}
                />
              </div>
            </div>
            <Input
              id="contactEmail"
              type="email"
              value={contact?.email || ''}
              onChange={(e) => setContact({ ...contact!, email: e.target.value })}
              placeholder="contact@example.com"
              className="bg-white/70 dark:bg-card border-white/80 dark:border-border h-10 text-sm"
              dir="ltr"
            />
          </div>

          {/* GitHub */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-white/40 dark:bg-muted/30 border border-white/65 dark:border-border transition-all shadow-2xs">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="github" className="flex items-center gap-2 text-sm font-semibold">
                <Github className="h-4 w-4 text-primary shrink-0" />
                <span>{t('admin.github')}</span>
              </Label>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs text-muted-foreground select-none">{t('admin.githubVisible')}</span>
                <Switch
                  id="github-visible"
                  checked={contact?.github_visible || false}
                  onCheckedChange={(v) => setContact({ ...contact!, github_visible: v })}
                />
              </div>
            </div>
            <Input
              id="github"
              value={contact?.github || ''}
              onChange={(e) => setContact({ ...contact!, github: e.target.value })}
              placeholder="https://github.com/username"
              className="bg-white/70 dark:bg-card border-white/80 dark:border-border h-10 text-sm"
              dir="ltr"
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-white/40 dark:bg-muted/30 border border-white/65 dark:border-border transition-all shadow-2xs">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="linkedin" className="flex items-center gap-2 text-sm font-semibold">
                <Linkedin className="h-4 w-4 text-primary shrink-0" />
                <span>{t('admin.linkedin')}</span>
              </Label>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs text-muted-foreground select-none">{t('admin.linkedinVisible')}</span>
                <Switch
                  id="linkedin-visible"
                  checked={contact?.linkedin_visible || false}
                  onCheckedChange={(v) => setContact({ ...contact!, linkedin_visible: v })}
                />
              </div>
            </div>
            <Input
              id="linkedin"
              value={contact?.linkedin || ''}
              onChange={(e) => setContact({ ...contact!, linkedin: e.target.value })}
              placeholder="https://linkedin.com/in/username"
              className="bg-white/70 dark:bg-card border-white/80 dark:border-border h-10 text-sm"
              dir="ltr"
            />
          </div>

          <div className={cn('pt-2 flex', isAr ? 'justify-center' : 'justify-start')}>
            <Button onClick={handleSaveContact} disabled={savingContact} className="gap-2 px-8 min-w-[160px]">
              <Save className="h-4 w-4" />
              {savingContact ? t('common.loading') : t('admin.saveContact')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat FAQ */}
      <div className={isAr ? 'text-center pt-2' : ''}>
        <h3 className="text-xl font-bold">{t('admin.chatFaq')}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t('admin.chatDesc')}</p>
      </div>

      <Card className={cn('shadow-sm border-border/80', isAr && 'border-primary/20')}>
        <CardHeader className={isAr ? 'text-center border-b pb-4' : ''}>
          <CardTitle className={cn('flex items-center gap-2', isAr && 'justify-center text-lg')}>
            <MessageSquare className="h-5 w-5 text-primary" />
            {t('admin.chatFaq')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          {faqs.length === 0 && (
            <p className="text-sm text-muted-foreground italic">{t('admin.noFaq')}</p>
          )}

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="rounded-lg border p-4 space-y-2 bg-muted/30">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{faq.question}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => handleDeleteFaq(faq.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
                {faq.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {faq.keywords.map((kw) => (
                      <span key={kw} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* Add new FAQ */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="faqQuestion">{t('admin.faqQuestion')}</Label>
              <Input
                id="faqQuestion"
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                placeholder="What services do you offer?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faqAnswer">{t('admin.faqAnswer')}</Label>
              <Textarea
                id="faqAnswer"
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                rows={2}
                placeholder="I offer web development, design, and consulting services..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faqKeywords">{t('admin.faqKeywords')}</Label>
              <Input
                id="faqKeywords"
                value={newFaq.keywords}
                onChange={(e) => setNewFaq({ ...newFaq, keywords: e.target.value })}
                placeholder="services, offer, work, hire"
              />
              <p className="text-xs text-muted-foreground">{t('admin.faqKeywordsHint')}</p>
            </div>
            <Button onClick={handleAddFaq} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              {t('admin.addFaq')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===================== Security Section =====================
function SecuritySection() {
  const { t, lang } = useLanguage();
  const { session } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const handleChangePassword = async () => {
    if (!session?.user) return;

    if (newPassword.length < 8) {
      toast.error(lang === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('admin.passwordMismatch'));
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error('Password change error:', error.message);
        toast.error(error.message || t('admin.passwordError'));
      } else {
        toast.success(t('admin.passwordChanged'));
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Password change exception:', err);
      toast.error(t('admin.passwordError'));
    }
    setSaving(false);
  };

  const handleSendResetEmail = async () => {
    if (!session?.user?.email) return;
    setSendingReset(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
        redirectTo: redirectUrl,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(
          lang === 'ar'
            ? `تم إرسال رابط إعادة التعيين إلى بريدك: ${session.user.email}`
            : `Reset link sent to your email: ${session.user.email}`
        );
      }
    } catch (err) {
      console.error('Send reset email error:', err);
      toast.error(t('admin.error'));
    }
    setSendingReset(false);
  };

  const isAr = lang === 'ar';

  return (
    <div className={cn('space-y-6', isAr ? 'max-w-2xl mx-auto' : 'max-w-3xl')}>
      <div className={isAr ? 'text-center' : ''}>
        <h3 className="text-xl font-bold">{t('admin.security')}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t('admin.securityDesc')}</p>
      </div>

      <Card className={cn('shadow-sm border-border/80', isAr && 'border-primary/20')}>
        <CardHeader className={isAr ? 'text-center border-b pb-4' : ''}>
          <CardTitle className={cn('flex items-center gap-2', isAr && 'justify-center text-lg')}>
            <Lock className="h-5 w-5 text-primary" />
            {t('admin.changePassword')}
          </CardTitle>
          <CardDescription>
            {lang === 'ar'
              ? 'أنت مسجل الدخول كمسؤول؛ يمكنك تعيين كلمة مرور جديدة مباشرة أو إرسال رابط استعادة إلى بريدك.'
              : 'You are authenticated as admin. You can set a new password directly or request a reset link to your email.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPass">{t('admin.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="newPass"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ltr:pr-10 rtl:pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar' ? '8 أحرف كحد أدنى' : 'Minimum 8 characters'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPass">{t('admin.confirmPassword')}</Label>
              <Input
                id="confirmPass"
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className={cn('flex flex-col sm:flex-row gap-3 pt-2', isAr && 'justify-center')}>
            <Button
              onClick={handleChangePassword}
              disabled={saving || !newPassword || !confirmPassword}
              className="gap-2 px-6"
            >
              <KeyRound className="h-4 w-4" />
              {saving ? t('common.loading') : t('admin.changePassword')}
            </Button>

            <Button
              variant="outline"
              onClick={handleSendResetEmail}
              disabled={sendingReset}
              className="gap-2 px-6"
            >
              <Mail className="h-4 w-4 text-primary" />
              {sendingReset
                ? t('common.loading')
                : lang === 'ar'
                ? 'إرسال رابط الاستعادة للبريد'
                : 'Send Reset Link to Email'}
            </Button>
          </div>

          <div className="rounded-lg bg-muted/50 border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-primary" />
              {lang === 'ar' ? 'حماية الحساب عبر Supabase Auth' : 'Account Protection'}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'ar'
                ? `جلسة حسابك الحالية موثقة (${session?.user?.email}). لا يلزم معرفة كلمة المرور القديمة طالما أنك مسجل الدخول بالفعل. سيتم تطبيق كلمة المرور الجديدة فوراً على جميع الأجهزة.`
                : `Your session is authenticated via Supabase Auth (${session?.user?.email}). You do not need the old password to update it while logged in. Changes take effect immediately across all sessions.`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===================== Advanced Section (Developer Mode + Backup) =====================
function AdvancedSection() {
  const { t, lang } = useLanguage();
  const { session } = useAuth();
  const [devMode, setDevMode] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);

  const isAr = lang === 'ar';

  useEffect(() => {
    try {
      const saved = localStorage.getItem('portfolio-dev-mode');
      if (saved === 'true') setDevMode(true);
      const savedLogs = localStorage.getItem('portfolio-dev-logs');
      if (savedLogs) {
        try {
          setLogs(JSON.parse(savedLogs));
        } catch {
          setLogs([]);
        }
      }
    } catch {
      // Safari private mode may block localStorage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('portfolio-dev-mode', String(devMode));
    } catch {}
  if (devMode) {
      checkDbConnection();
    }
  }, [devMode]);

  useEffect(() => {
    if (devMode) {
      try {
        localStorage.setItem('portfolio-dev-logs', JSON.stringify(logs.slice(-50)));
      } catch {}
    }
  }, [logs, devMode]);

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`].slice(-50));
  }, []);

  const checkDbConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
      if (error) {
        setDbConnected(false);
        addLog(`DB connection check failed: ${error.message}`);
      } else {
        setDbConnected(true);
        addLog(`DB connection OK (profiles table accessible)`);
      }
    } catch (err) {
      setDbConnected(false);
      addLog(`DB connection exception: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleToggleDevMode = (enabled: boolean) => {
    setDevMode(enabled);
    if (enabled) {
      addLog('Developer mode activated');
    } else {
      addLog('Developer mode deactivated');
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    localStorage.removeItem('portfolio-dev-logs');
  };

  const handleBackup = async () => {
    setDownloading(true);
    addLog('Starting backup download...');
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || '';

      const response = await fetch(`${supabaseUrl}/functions/v1/export-backup`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t('admin.backupReady'));
        addLog('Backup downloaded via edge function');
      } else {
        await clientSideBackup();
        addLog('Backup downloaded via client-side fallback');
      }
    } catch (err) {
      addLog(`Backup error: ${err instanceof Error ? err.message : String(err)}`);
      await clientSideBackup();
    }
    setDownloading(false);
  };

  const clientSideBackup = async () => {
    const [itemsRes, messagesRes, profilesRes] = await Promise.all([
      supabase.from('items').select('*'),
      supabase.from('messages').select('*'),
      supabase.from('profiles').select('*'),
    ]);

    const backup = {
      exported_at: new Date().toISOString(),
      version: '1.0',
      profile: profilesRes.data,
      items: itemsRes.data,
      messages: messagesRes.data,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('admin.backupReady'));
  };

  return (
    <div className={cn('space-y-6', isAr ? 'max-w-2xl mx-auto' : 'max-w-3xl')}>
      <div className={isAr ? 'text-center' : ''}>
        <h3 className="text-xl font-bold">{t('admin.advancedSettings')}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t('admin.advancedDesc')}</p>
      </div>

      {/* Developer Mode Toggle */}
      <Card className={cn('shadow-sm border-border/80', isAr && 'border-primary/20')}>
        <CardHeader className={isAr ? 'text-center border-b pb-4' : ''}>
          <CardTitle className={cn('flex items-center gap-2', isAr && 'justify-center text-lg')}>
            <Bug className="h-5 w-5 text-primary" />
            {t('admin.devMode')}
          </CardTitle>
          <CardDescription>{t('admin.devModeDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('admin.devMode')}</span>
            </div>
            <Switch checked={devMode} onCheckedChange={handleToggleDevMode} />
          </div>

          {devMode && (
            <div className="space-y-4 pt-2">
              {/* DB Status */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Database className="h-4 w-4 text-primary" />
                  {t('admin.dbStatus')}
                </div>
                <div className="flex items-center gap-2">
                  {dbConnected === null ? (
                    <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
                  ) : dbConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">{t('admin.dbConnected')}</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400">{t('admin.dbDisconnected')}</span>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={checkDbConnection} className="ml-auto gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Console Logs */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Terminal className="h-4 w-4 text-primary" />
                    {t('admin.consoleLogs')}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleClearLogs} className="gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('admin.clearLogs')}
                  </Button>
                </div>
                <div className="bg-zinc-950 text-zinc-300 rounded-md p-3 font-mono text-xs max-h-48 overflow-y-auto space-y-1">
                  {logs.length === 0 ? (
                    <p className="text-zinc-500">{t('admin.noLogs')}</p>
                  ) : (
                    logs.map((log, i) => (
                      <p key={i} className="whitespace-pre-wrap break-all">{log}</p>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup */}
      <Card className={cn('shadow-sm border-border/80', isAr && 'border-primary/20')}>
        <CardHeader className={isAr ? 'text-center border-b pb-4' : ''}>
          <CardTitle className={cn('flex items-center gap-2', isAr && 'justify-center text-lg')}>
            <Database className="h-5 w-5 text-primary" />
            {t('admin.backupRestore')}
          </CardTitle>
          <CardDescription>{t('admin.backupDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <Database className="h-6 w-6 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Profile & Settings</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <Database className="h-6 w-6 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Projects & Items</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <Database className="h-6 w-6 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Messages</p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">JSON Export</p>
              <p className="text-xs text-muted-foreground">
                Download all data as a JSON file for safekeeping or migration.
              </p>
            </div>
            <Button onClick={handleBackup} disabled={downloading} className="gap-2">
              <Download className="h-4 w-4" />
              {downloading ? t('admin.backupDownloading') : t('admin.downloadBackup')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
