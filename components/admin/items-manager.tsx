'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage, useAuth } from '@/contexts/app-context';
import { supabase, type Item, type ItemInput } from '@/lib/supabase';
import {
  Plus, Pencil, Trash2, X, Save, Upload, Link as LinkIcon,
  Image as ImageIcon, Video, FileText, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const CATEGORIES = ['projects', 'awards', 'certificates', 'research', 'other'] as const;

export function ItemsManager() {
  const { t, lang } = useLanguage();
  const { session } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form, setForm] = useState<ItemInput>({
    category: 'projects',
    title: '',
    description: '',
    content: '',
    image_url: '',
    link: '',
    tags: [],
    year: null,
    month: null,
    day: null,
    sort_order: 0,
  });
  const [tagsInput, setTagsInput] = useState('');
  const [filter, setFilter] = useState('all');

  const loadItems = useCallback(async () => {
    const { data } = await supabase.from('items').select('*').order('created_at', { ascending: false });
    setItems((data as Item[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      category: 'projects',
      title: '',
      description: '',
      content: '',
      image_url: '',
      link: '',
      tags: [],
      year: null,
      month: null,
      day: null,
      sort_order: 0,
    });
    setTagsInput('');
    setDialogOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    setForm({
      category: item.category,
      title: item.title,
      description: item.description,
      content: item.content,
      image_url: item.image_url,
      link: item.link,
      tags: item.tags,
      year: item.year,
      month: item.month,
      day: item.day,
      sort_order: item.sort_order,
    });
    setTagsInput(item.tags.join(', '));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const payload = { ...form, tags };

    if (editingItem) {
      const { error } = await supabase.from('items').update(payload).eq('id', editingItem.id);
      if (error) toast.error(t('admin.error'));
      else toast.success(t('admin.saved'));
    } else {
      const { error } = await supabase.from('items').insert(payload);
      if (error) toast.error(t('admin.error'));
      else toast.success(t('admin.saved'));
    }

    setDialogOpen(false);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) toast.error(t('admin.error'));
    else {
      toast.success(t('admin.saved'));
      loadItems();
    }
  };

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
            {t('section.all')} ({items.length})
          </Button>
          {CATEGORIES.map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            return (
              <Button key={cat} variant={filter === cat ? 'default' : 'outline'} size="sm" onClick={() => setFilter(cat)}>
                {t(`section.${cat}` as any)} ({count})
              </Button>
            );
          })}
        </div>
        <Button onClick={openCreate} size="sm" variant="brand">
          <Plus className="h-4 w-4 mr-2 stroke-[1.8]" />
          {t('admin.create')}
        </Button>
      </div>

      {loading ? (
        <p className="text-[#2477A8] dark:text-[#A7ADB4] text-center py-8 text-sm">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/60 bg-white/38 backdrop-blur-[14px] shadow-[0_8px_30px_rgba(36,119,168,0.08)] p-12 text-center dark:border-[#343A40] dark:bg-[#191C1F] dark:backdrop-blur-none">
          <p className="text-[#2477A8] dark:text-[#A7ADB4] text-sm font-medium">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} className="overflow-hidden rounded-2xl border border-white/60 bg-white/38 text-[#155A82] backdrop-blur-[14px] shadow-[0_8px_30px_rgba(36,119,168,0.08)] hover:border-[#2BA8A2]/50 dark:border-[#343A40] dark:bg-[#191C1F] dark:text-[#F5F7F8] dark:hover:border-[#10B981]/40 dark:backdrop-blur-none transition-all">
              {item.image_url && (
                <div className="aspect-video overflow-hidden bg-white/20 border-b border-white/55 dark:bg-[#202428] dark:border-[#343A40]">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="pt-4 pb-4">
                <Badge className="mb-2 text-xs rounded-lg bg-[#2BA8A2]/15 text-[#2BA8A2] border border-[#2BA8A2]/30 dark:bg-[#10B981]/15 dark:text-[#10B981] dark:border-[#10B981]/30 font-medium">
                  {t(`section.${item.category}` as any) || item.category}
                </Badge>
                <h3 className="font-semibold text-[#155A82] dark:text-[#F5F7F8] mb-1 line-clamp-1">{item.title}</h3>
                <p className="text-sm text-[#2477A8] dark:text-[#A7ADB4] line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3.5">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} className="text-xs rounded-md bg-white/50 border border-white/65 text-[#2477A8] dark:bg-[#202428] dark:border-[#343A40] dark:text-[#A7ADB4] font-normal">{tag}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2 border-t border-white/55 dark:border-[#343A40]/60">
                  <Button variant="outline" size="sm" onClick={() => openEdit(item)} className="h-8 px-2.5 text-xs">
                    <Pencil className="h-3.5 w-3.5 mr-1 stroke-[1.8]" />
                    {t('admin.edit')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)} className="h-8 px-2.5 text-xs hover:border-[#EF4444]/40 hover:text-[#EF4444]">
                    <Trash2 className="h-3.5 w-3.5 mr-1 stroke-[1.8]" />
                    {t('admin.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? t('admin.edit') : t('admin.create')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t('admin.title')}</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>{t('admin.category')}</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{t(`section.${cat}` as any)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t('admin.description')}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>{t('admin.content')}</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} />
            </div>

            {/* Upload Hub */}
            <UploadHub
              imageUrl={form.image_url || ''}
              link={form.link || ''}
              onImageUrlChange={(url) => setForm({ ...form, image_url: url })}
              onLinkChange={(url) => setForm({ ...form, link: url })}
            />

            <div>
              <Label>{t('admin.tags')}</Label>
              <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="tag1, tag2, tag3" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label>{t('filter.year')}</Label>
                <Input
                  type="number"
                  value={form.year || ''}
                  onChange={(e) => setForm({ ...form, year: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="2024"
                />
              </div>
              <div>
                <Label>{t('filter.month')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={form.month || ''}
                  onChange={(e) => setForm({ ...form, month: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="1-12"
                />
              </div>
              <div>
                <Label>{t('filter.day')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={form.day || ''}
                  onChange={(e) => setForm({ ...form, day: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="1-31"
                />
              </div>
              <div>
                <Label>{t('admin.sortOrder')}</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4 mr-2 stroke-[1.8]" />
              {t('admin.cancel')}
            </Button>
            <Button onClick={handleSave} variant="brand">
              <Save className="h-4 w-4 mr-2 stroke-[1.8]" />
              {t('admin.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===================== Upload Hub Component =====================
function UploadHub({
  imageUrl,
  link,
  onImageUrlChange,
  onLinkChange,
}: {
  imageUrl: string;
  link: string;
  onImageUrlChange: (url: string) => void;
  onLinkChange: (url: string) => void;
}) {
  const { t } = useLanguage();
  const [hubMode, setHubMode] = useState<'image' | 'video' | 'link'>('image');
  const [showDropdown, setShowDropdown] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File, isVideoFile: boolean) => {
    if (isVideoFile) {
      if (!file.type.startsWith('video/')) {
        toast.error(t('cv.uploadError'));
        return;
      }
    } else {
      if (!file.type.startsWith('image/')) {
        toast.error(t('cv.uploadError'));
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      setIsVideo(isVideoFile);
      onImageUrlChange(result);
    };
    reader.onerror = () => toast.error(t('cv.uploadError'));
    reader.readAsDataURL(file);
  };

  const handleUrlApply = () => {
    if (previewUrl.trim()) {
      const isVid = previewUrl.match(/\.(mp4|webm|ogg|mov)$/i);
      setIsVideo(!!isVid);
      onImageUrlChange(previewUrl.trim());
    }
  };

  const handleRemoveMedia = () => {
    setPreviewUrl('');
    onImageUrlChange('');
    setIsVideo(false);
  };

  const hubOptions = [
    { id: 'image' as const, label: t('admin.uploadImage'), icon: ImageIcon },
    { id: 'video' as const, label: t('admin.uploadVideo'), icon: Video },
    { id: 'link' as const, label: t('admin.externalLink'), icon: LinkIcon },
  ];

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Upload className="h-4 w-4" />
        {t('admin.uploadHub')}
      </Label>

      {/* Dropdown trigger */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <span className="flex items-center gap-2">
            {(() => {
              const opt = hubOptions.find((o) => o.id === hubMode);
              return opt ? <opt.icon className="h-4 w-4" /> : null;
            })()}
            {hubOptions.find((o) => o.id === hubMode)?.label || t('admin.chooseFile')}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-white/65 bg-white/90 backdrop-blur-[20px] shadow-[0_15px_50px_rgba(36,119,168,0.12)] text-[#155A82] dark:border-[#343A40] dark:bg-[#191C1F] dark:text-[#F5F7F8] overflow-hidden">
              {hubOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="flex items-center gap-2 w-full px-3.5 py-2.5 text-sm text-[#2477A8] hover:bg-white/60 hover:text-[#155A82] dark:text-[#F5F7F8] dark:hover:bg-[#25292D] transition-colors text-left"
                  onClick={() => {
                    setHubMode(opt.id);
                    setShowDropdown(false);
                    if (opt.id === 'image') {
                      fileInputRef.current?.click();
                    } else if (opt.id === 'video') {
                      videoInputRef.current?.click();
                    }
                  }}
                >
                  <opt.icon className="h-4 w-4 stroke-[1.8]" />
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file, false);
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file, true);
        }}
      />

      {/* URL input for external link mode */}
      {hubMode === 'link' && (
        <div className="space-y-2">
          <Input
            value={previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
            placeholder="https://github.com/... or https://youtube.com/..."
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleUrlApply} className="gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              {t('admin.filePreview')}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleRemoveMedia} className="gap-1.5 text-destructive">
              <X className="h-3.5 w-3.5" />
              {t('cv.removeImage')}
            </Button>
          </div>
        </div>
      )}

      {/* External project link field */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t('admin.link')}</Label>
        <Input
          value={link}
          onChange={(e) => onLinkChange(e.target.value)}
          placeholder="https://live-site.com or github.com/user/repo"
        />
      </div>

      {/* Media preview */}
      {imageUrl && (
        <div className="rounded-xl border border-white/60 bg-white/40 dark:border-[#343A40] dark:bg-[#191C1F]/50 overflow-hidden shadow-sm">
          {isVideo ? (
            <video
              src={imageUrl}
              className="w-full max-h-48 object-contain"
              controls
            />
          ) : (
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full max-h-48 object-contain"
              onError={() => toast.error(t('cv.uploadError'))}
            />
          )}
          <div className="flex items-center justify-between p-2.5 bg-white/60 dark:bg-[#191C1F] border-t border-white/50 dark:border-[#343A40]">
            <span className="text-xs text-[#2477A8] dark:text-muted-foreground font-medium">
              {isVideo ? 'Video' : 'Image'} {t('admin.filePreview')}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={handleRemoveMedia} className="h-7 gap-1 text-destructive hover:bg-destructive/10">
              <X className="h-3 w-3" />
              {t('cv.removeImage')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
