'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Tag, ExternalLink, Globe } from 'lucide-react';
import { type Item } from '@/lib/supabase';
import { useLanguage } from '@/contexts/app-context';
import { monthNames } from '@/lib/i18n';

interface ItemDetailsDialogProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemDetailsDialog({ item, open, onOpenChange }: ItemDetailsDialogProps) {
  const { t, lang } = useLanguage();

  if (!item) return null;

  const formatDate = (item: Item) => {
    const parts: string[] = [];
    if (item.year) parts.push(String(item.year));
    if (item.month) parts.push(monthNames[lang][item.month - 1] || '');
    if (item.day) parts.push(String(item.day));
    return parts.join(' - ');
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'projects':
        return 'brand';
      case 'awards':
        return 'citrus';
      case 'certificates':
        return 'botanical';
      case 'research':
        return 'sale';
      default:
        return 'pill';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/65 bg-white/85 backdrop-blur-[20px] p-6 shadow-[0_15px_50px_rgba(36,119,168,0.12)] text-[#155A82] dark:border-[#343A40] dark:bg-[#191C1F] dark:text-[#F5F7F8]">
        <DialogHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getCategoryBadgeVariant(item.category) as any} className="text-xs uppercase tracking-wide">
              {t(`section.${item.category}` as any) || item.category}
            </Badge>
            {formatDate(item) && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#2477A8] dark:text-muted-foreground bg-white/50 dark:bg-muted/60 px-2.5 py-1 rounded-full border border-white/65 dark:border-border">
                <Calendar className="h-3 w-3 stroke-[1.8]" />
                {formatDate(item)}
              </span>
            )}
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-[#155A82] dark:text-[#F5F7F8]">
            {item.title}
          </DialogTitle>
          {item.description && (
            <DialogDescription className="text-base text-[#2477A8] dark:text-muted-foreground leading-relaxed font-normal">
              {item.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {item.image_url && (
          <div className="my-3 overflow-hidden rounded-xl border border-white/60 dark:border-border bg-white/20 dark:bg-muted/30 max-h-80 flex items-center justify-center">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        {item.content && (
          <div className="my-4 rounded-xl bg-white/40 dark:bg-muted/20 border border-white/60 dark:border-border p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2477A8] dark:text-muted-foreground mb-2">
              {lang === 'ar' ? 'التفاصيل الكاملة' : 'Detailed Overview'}
            </h4>
            <div className="prose prose-sm dark:prose-invert max-w-none text-[#155A82] dark:text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {item.content}
            </div>
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="my-2 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {lang === 'ar' ? 'الوسوم والتقنيات:' : 'Tags & Skills:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="pill" className="text-xs py-0.5 px-2.5 shadow-2xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t flex flex-wrap items-center justify-between gap-3">
          {item.link ? (
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              <Button variant="brand" size="pill" className="gap-2">
                <Globe className="h-4 w-4" />
                {lang === 'ar' ? 'زيارة الرابط / المعاينة' : 'Visit Project / Link'}
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          ) : <div />}

          <Button variant="outline" size="pill" onClick={() => onOpenChange(false)}>
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
