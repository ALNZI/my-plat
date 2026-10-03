'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth, useLanguage } from '@/contexts/app-context';
import { supabase } from '@/lib/supabase';
import { getVisualIdentityUrl, validateVisualIdentityFile, visualIdentityFields, visualIdentityText, VISUAL_IDENTITY_BUCKET, VISUAL_IDENTITY_UPDATED_EVENT, type VisualIdentitySettings, type VisualIdentityKey } from '@/lib/visual-identity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { safeTimeoutSignal, safeRandomUUID } from '@/lib/utils';

export function VisualIdentitySection() {
  const { session } = useAuth();
  const { lang, dir, t } = useLanguage();
  const text = visualIdentityText[lang];
  const [settings, setSettings] = useState<VisualIdentitySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<'loadError' | 'ownerPending' | 'ownerOnly' | null>(null);
  const request = useRef(0);
  const load = useCallback(async () => {
    const version = ++request.current;
    setLoading(true);
    setNotice(null);
    try {
      const signal = safeTimeoutSignal(10000);
      let query = supabase.from('visual_identity_settings').select('*').eq('id', true);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query.maybeSingle();
      if (version !== request.current) return;
      if (error) throw error;
      const row = data as VisualIdentitySettings | null;
      setSettings(row);
      setNotice(!row?.owner_user_id ? 'ownerPending' : row.owner_user_id !== session?.user.id ? 'ownerOnly' : null);
    } catch {
      if (version === request.current) setNotice('loadError');
    } finally {
      if (version === request.current) setLoading(false);
    }
  }, [session?.user.id]);
  useEffect(() => { void load(); return () => { request.current++; }; }, [load]);
  const canWrite = !loading && !notice && !!session && settings?.owner_user_id === session.user.id;
  return (
    <div className="space-y-6 max-w-3xl" dir={dir}>
      <div><h3 className="text-xl font-bold">{text.title}</h3><p className="text-sm text-muted-foreground mt-1">{text.description}</p></div>
      {loading && <p role="status">{t('common.loading')}</p>}
      {notice && <div role="alert" className="rounded-lg border p-4 space-y-3"><p className="text-sm">{text[notice]}</p><Button variant="outline" onClick={() => void load()}>{text.retry}</Button></div>}
      {visualIdentityFields.map(field => <ImageField key={`${session?.user.id}-${field.key}`} field={field}
        savedPath={settings?.[field.key] ?? null} canWrite={canWrite} reload={load}
        onSaved={(path) => {
          setSettings(current => current ? { ...current, [field.key]: path } : current);
          window.dispatchEvent(new Event(VISUAL_IDENTITY_UPDATED_EVENT));
        }} />)}
    </div>
  );
}

type PreparedImage = Awaited<ReturnType<typeof validateVisualIdentityFile>> & { name: string };
function ImageField({ field, savedPath, canWrite, reload, onSaved }: {
  field: typeof visualIdentityFields[number]; savedPath: string | null; canWrite: boolean;
  reload: () => Promise<void>; onSaved: (path: string | null) => void;
}) {
  const { lang, t } = useLanguage();
  const text = visualIdentityText[lang];
  const [prepared, setPrepared] = useState<PreparedImage | null>(null);
  const [preview, setPreview] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<keyof typeof text | null>(null);
  const [failedUrl, setFailedUrl] = useState<string>();
  const [confirming, setConfirming] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const id = `visual-${field.key}`;
  const src = preview || getVisualIdentityUrl(savedPath);
  useEffect(() => {
    if (!prepared) { setPreview(undefined); return; }
    const url = URL.createObjectURL(prepared.blob);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [prepared]);
  const choose = async (file: File) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null); setConfirming(false);
    try { setPrepared({ ...await validateVisualIdentityFile(field.key, file), name: file.name }); }
    catch (cause) {
      const code = cause instanceof Error ? cause.message : '';
      setError(code === 'tooLarge' || code === 'unsafeSvg' ? code : 'invalid');
    } finally { lock.current = false; setBusy(false); }
  };
  const commit = async (deleting: boolean) => {
    if (lock.current || !canWrite || (deleting ? !savedPath : !prepared)) return;
    lock.current = true; setBusy(true); setError(null);
    let uploaded: string | null = null;
    let writeAttempted = false;
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error('unauthorized');
      const userId = auth.user.id;
      if (!deleting && prepared) {
        const path = `${userId}/${field.key}/${safeRandomUUID()}.${prepared.extension}`;
        const { error: uploadError } = await supabase.storage.from(VISUAL_IDENTITY_BUCKET).upload(path, prepared.blob,
          { contentType: prepared.contentType, cacheControl: '31536000', upsert: false });
        if (uploadError) throw uploadError;
        uploaded = path;
      }
      // Only change this field, and only if the saved value has not changed in another tab.
      let query = supabase.from('visual_identity_settings').update({ [field.key]: uploaded }).eq('id', true);
      query = savedPath === null ? query.is(field.key, null) : query.eq(field.key, savedPath);
      writeAttempted = true;
      const { error: writeError, data } = await query.select('id').single();
      if (writeError || !data) throw new Error('write failed');
      onSaved(uploaded); setPrepared(null); setConfirming(false);
      toast.success(deleting ? text.removed : text.saved);
      // Delete only after the reference was successfully changed. Never delete arbitrary paths.
      if (savedPath && getVisualIdentityUrl(savedPath) && savedPath.startsWith(`${userId}/${field.key}/`)) {
        try {
          const { error: cleanupError } = await supabase.storage.from(VISUAL_IDENTITY_BUCKET).remove([savedPath]);
          if (cleanupError) toast.warning(text.cleanup);
        } catch { toast.warning(text.cleanup); }
      }
    } catch {
      // A lost response may hide a successful write. Preserve the upload unless a read proves it unreferenced.
      if (uploaded && writeAttempted) {
        try {
          const { data, error: readError } = await supabase.from('visual_identity_settings').select('*').eq('id', true).single();
          if (!readError && data && (data as VisualIdentitySettings)[field.key] !== uploaded) {
            await supabase.storage.from(VISUAL_IDENTITY_BUCKET).remove([uploaded]);
          }
        } catch { /* Leave uncertain objects intact. */ }
      }
      setError(deleting ? 'removeFailed' : 'failed');
      await reload();
    } finally { lock.current = false; setBusy(false); }
  };
  return (
    <Card className="shadow-sm border-border/80">
      <CardHeader><CardTitle className="text-lg"><label htmlFor={id}>{field[lang]}</label></CardTitle></CardHeader>
      <CardContent className="space-y-4" aria-busy={busy}>
        <div className="border border-dashed rounded-lg p-4 space-y-3">
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">{text.guidance}: <bdi>{field.width} × {field.height} px</bdi> — <bdi>{field.formats}</bdi> — {text.maxSize}</p>
          {src ? <div className="rounded-lg border bg-muted/30 p-2">
            {failedUrl !== src ? <img src={src} alt={field[lang]} onError={() => setFailedUrl(src)} className={field.key === 'hero_background_path' ? 'w-full max-h-64 object-contain' : 'h-32 w-32 object-contain mx-auto'} /> : <p>{text.previewError}</p>}
          </div> : <div className="rounded-lg bg-muted/30 p-8 text-sm text-muted-foreground">{text.empty}</div>}
          <input ref={input} id={id} type="file" className="sr-only" disabled={busy}
            accept={field.extensions.map(ext => `.${ext}`).join(',')} aria-describedby={`${id}-hint`}
            onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void choose(file); }} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}>{savedPath ? text.replace : text.upload}</Button>
            <Button type="button" variant="outline" disabled={busy || !canWrite || !savedPath} onClick={() => setConfirming(true)}>{text.remove}</Button>
          </div>
          {prepared && <p className="text-xs break-all">{prepared.name} — {text.pending}</p>}
        </div>
        {confirming && <div className="flex gap-2"><Button variant="destructive" disabled={busy || !canWrite} onClick={() => void commit(true)}>{text.confirmRemove}</Button><Button variant="outline" disabled={busy} onClick={() => setConfirming(false)}>{text.cancel}</Button></div>}
        {error && <p role="alert" className="text-sm text-destructive">{text[error]}</p>}
        {busy && <p role="status">{t('common.loading')}</p>}
        {prepared && <div className="flex gap-2"><Button disabled={busy || !canWrite} onClick={() => void commit(false)}>{text.save}</Button><Button variant="outline" disabled={busy} onClick={() => { setPrepared(null); setError(null); }}>{text.cancel}</Button></div>}
      </CardContent>
    </Card>
  );
}
