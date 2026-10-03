'use client';

import { useState, useRef, useCallback } from 'react';
import { type Item, type Profile } from '@/lib/supabase';
import { useLanguage } from '@/contexts/app-context';
import { monthNames } from '@/lib/i18n';
import { FileText, Download, X, FileCheck, ScanLine, Loader2, ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type CVFormat = 'standard' | 'ats';

export function CVExport({ profile, items }: { profile: Profile | null; items: Item[] }) {
  const { t, lang } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [generating, setGenerating] = useState<CVFormat | null>(null);

  const formatDate = (item: Item) => {
    const parts: string[] = [];
    if (item.year) parts.push(String(item.year));
    if (item.month) parts.push(monthNames[lang][item.month - 1] || '');
    if (item.day) parts.push(String(item.day));
    return parts.join(' - ');
  };

  const groupedItems = () => {
    const categories: Record<string, Item[]> = {};
    items.forEach((item) => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    });
    return categories;
  };

  const generateStandardHTML = useCallback(() => {
    const categories = groupedItems();
    const isRtl = lang === 'ar';
    const dir = isRtl ? 'rtl' : 'ltr';
    const textAlign = isRtl ? 'right' : 'left';

    const socialLinks = profile?.social_links
      ? Object.entries(profile.social_links).map(([k, v]) => `<div style="margin-${isRtl ? 'left' : 'right'}:16px;"><strong>${k}:</strong> <a href="${v}" style="color:#2563eb;text-decoration:none;">${v}</a></div>`).join('')
      : '';

    const categoriesHTML = Object.entries(categories).map(([cat, catItems]) => {
      const catName = t(`section.${cat}` as any) || cat;
      const itemsHTML = catItems
        .sort((a, b) => (b.year || 0) - (a.year || 0))
        .map((item) => {
          const date = formatDate(item);
          const tags = item.tags.length ? item.tags.map(tag => `<span style="display:inline-block;background:#e0e7ff;color:#3730a3;padding:2px 8px;border-radius:4px;font-size:11px;margin:2px;">${tag}</span>`).join(' ') : '';
          return `
            <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e5e7eb;">
              <div style="font-weight:600;font-size:14px;color:#1e293b;">${item.title}${date ? ` <span style="font-weight:400;color:#64748b;font-size:12px;">(${date})</span>` : ''}</div>
              ${item.description ? `<div style="font-size:13px;color:#475569;margin-top:4px;">${item.description}</div>` : ''}
              ${item.link ? `<div style="margin-top:4px;"><a href="${item.link}" style="color:#2563eb;font-size:12px;text-decoration:none;">${item.link}</a></div>` : ''}
              ${tags ? `<div style="margin-top:6px;">${tags}</div>` : ''}
            </div>`;
        }).join('');

      return `
        <div style="margin-bottom:24px;">
          <h3 style="font-size:15px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #2563eb;padding-bottom:6px;margin-bottom:12px;">${catName}</h3>
          ${itemsHTML}
        </div>`;
    }).join('');

    return `
      <!DOCTYPE html>
      <html dir="${dir}" lang="${lang}">
      <head>
        <meta charset="utf-8">
        <title>${t('cv.title')} - ${profile?.site_name || ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 48px; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; background: #fff; }
          @media print { body { padding: 24px; } }
          .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #2563eb; }
          .header h1 { font-size: 28px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
          .header p { font-size: 14px; color: #64748b; max-width: 600px; margin: 0 auto; }
          .social { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; margin-top: 12px; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${profile?.site_name || 'Portfolio'}</h1>
          ${profile?.bio ? `<p>${profile.bio}</p>` : ''}
          ${socialLinks ? `<div class="social">${socialLinks}</div>` : ''}
        </div>
        ${categoriesHTML}
      </body>
      </html>`;
  }, [profile, items, lang, t]);

  const generateATSHTML = useCallback(() => {
    const categories = groupedItems();
    const isRtl = lang === 'ar';
    const dir = isRtl ? 'rtl' : 'ltr';

    const socialLinks = profile?.social_links
      ? Object.entries(profile.social_links).map(([k, v]) => `${k}: ${v}`).join(' | ')
      : '';

    const categoriesHTML = Object.entries(categories).map(([cat, catItems]) => {
      const catName = t(`section.${cat}` as any) || cat;
      const itemsHTML = catItems
        .sort((a, b) => (b.year || 0) - (a.year || 0))
        .map((item) => {
          const date = formatDate(item);
          const tags = item.tags.length ? ` | Tags: ${item.tags.join(', ')}` : '';
          return `${item.title}${date ? ` - ${date}` : ''}${tags}\n${item.description || ''}${item.link ? `\nLink: ${item.link}` : ''}`;
        }).join('\n\n');

      return `${catName.toUpperCase()}\n${'='.repeat(40)}\n${itemsHTML}`;
    }).join('\n\n');

    return `
      <!DOCTYPE html>
      <html dir="${dir}" lang="${lang}">
      <head>
        <meta charset="utf-8">
        <title>${t('cv.title')} - ${profile?.site_name || ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', Courier, monospace; padding: 48px; line-height: 1.5; color: #000; max-width: 800px; margin: 0 auto; background: #fff; white-space: pre-wrap; }
          @media print { body { padding: 24px; } }
          h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
          .info { text-align: center; font-size: 12px; margin-bottom: 24px; }
          hr { border: none; border-top: 1px solid #000; margin: 16px 0; }
        </style>
      </head>
      <body>
        <h1>${profile?.site_name || 'Portfolio'}</h1>
        ${profile?.bio ? `<div class="info">${profile.bio}</div>` : ''}
        ${socialLinks ? `<div class="info">${socialLinks}</div>` : ''}
        <hr>
        ${categoriesHTML}
      </body>
      </html>`;
  }, [profile, items, lang, t]);

  const handleDownload = (format: CVFormat) => {
    setGenerating(format);
    try {
      const html = format === 'standard' ? generateStandardHTML() : generateATSHTML();
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error(t('cv.error'));
        setGenerating(null);
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          toast.error(t('cv.error'));
        }
        setGenerating(null);
      }, 500);
    } catch (err) {
      toast.error(t('cv.error'));
      setGenerating(null);
    }
  };

  return (
    <>
      <Button
        variant="pill"
        size="lg"
        onClick={() => setModalOpen(true)}
        disabled={!profile && items.length === 0}
        className="rounded-full shadow-xs font-medium gap-2"
      >
        <FileText className="h-4 w-4" />
        {t('cv.download')}
      </Button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl border border-gray-200/80 dark:border-border p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FileText className="h-5 w-5 text-brandPrimary" />
              {t('cv.chooseFormat')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {t('cv.chooseFormat')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {/* Standard PDF */}
            <button
              onClick={() => handleDownload('standard')}
              disabled={generating !== null}
              className="w-full text-left rounded-2xl border border-white/65 dark:border-border bg-white/40 dark:bg-card p-4 hover:border-primary hover:bg-white/60 dark:hover:bg-muted/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-2xs"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/60 dark:bg-muted flex items-center justify-center flex-shrink-0 text-[#2477A8] group-hover:bg-primary group-hover:text-white transition-colors">
                  {generating === 'standard' ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <FileCheck className="h-5 w-5 text-primary group-hover:text-white stroke-[1.8]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[#155A82] dark:text-foreground group-hover:text-primary transition-colors">{t('cv.standard')}</div>
                  <div className="text-xs text-[#2477A8] dark:text-muted-foreground mt-1">{t('cv.standardDesc')}</div>
                </div>
                <Download className="h-4 w-4 text-[#2477A8] dark:text-muted-foreground group-hover:text-primary transition-colors mt-1 stroke-[1.8]" />
              </div>
            </button>

            {/* ATS-Friendly */}
            <button
              onClick={() => handleDownload('ats')}
              disabled={generating !== null}
              className="w-full text-left rounded-2xl border border-white/65 dark:border-border bg-white/40 dark:bg-card p-4 hover:border-primary hover:bg-white/60 dark:hover:bg-muted/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-2xs"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/60 dark:bg-muted flex items-center justify-center flex-shrink-0 text-[#2477A8] group-hover:bg-primary group-hover:text-white transition-colors">
                  {generating === 'ats' ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <ScanLine className="h-5 w-5 text-[#155A82] dark:text-foreground group-hover:text-white stroke-[1.8]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[#155A82] dark:text-foreground group-hover:text-primary transition-colors">{t('cv.ats')}</div>
                  <div className="text-xs text-[#2477A8] dark:text-muted-foreground mt-1">{t('cv.atsDesc')}</div>
                </div>
                <Download className="h-4 w-4 text-[#2477A8] dark:text-muted-foreground group-hover:text-primary transition-colors mt-1 stroke-[1.8]" />
              </div>
            </button>
          </div>

          <div className="flex justify-end mt-4 pt-3 border-t">
            <Button variant="outline" size="pill" onClick={() => setModalOpen(false)}>
              {t('cv.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
