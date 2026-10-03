'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage, useAuth } from '@/contexts/app-context';
import { supabase, type Message } from '@/lib/supabase';
import { Mail, Reply, Trash2, Send, MailOpen, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn, safeFormatDate } from '@/lib/utils';

export function MessagesManager() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyMsg, setReplyMsg] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState('all');

  const loadMessages = useCallback(async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    setMessages((data as Message[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMessages();

    const handleUpdate = () => { loadMessages(); };
    window.addEventListener('messages-updated', handleUpdate);

    const channel = supabase
      .channel('messages-manager-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('messages-updated', handleUpdate);
      supabase.removeChannel(channel);
    };
  }, [loadMessages]);

  const openReply = (msg: Message) => {
    setReplyMsg(msg);
    setReplyText(msg.reply || '');
    setReplyOpen(true);
    if (msg.status === 'unread') {
      supabase.from('messages').update({ status: 'read' }).eq('id', msg.id).then(() => {
        loadMessages();
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('messages-updated'));
      });
    }
  };

  const handleReply = async () => {
    if (!replyMsg) return;
    const { error } = await supabase
      .from('messages')
      .update({ reply: replyText, status: 'replied', replied_at: new Date().toISOString() })
      .eq('id', replyMsg.id);

    if (error) toast.error(t('admin.error'));
    else {
      toast.success(t('admin.saved'));
      setReplyOpen(false);
      loadMessages();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('messages-updated'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) toast.error(t('admin.error'));
    else {
      toast.success(t('admin.saved'));
      loadMessages();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('messages-updated'));
    }
  };

  const filtered = filter === 'all' ? messages : messages.filter((m) => m.status === filter);
  const unreadCount = messages.filter((m) => m.status === 'unread').length;
  const repliedCount = messages.filter((m) => m.status === 'replied').length;

  const statusIcon = (status: string) => {
    if (status === 'unread') return <Mail className="h-5 w-5 text-[#2BA8A2] dark:text-[#38BDF8] shrink-0 stroke-[1.8]" />;
    if (status === 'read') return <MailOpen className="h-5 w-5 text-[#2477A8] dark:text-[#A7ADB4] shrink-0 stroke-[1.8]" />;
    return <Check className="h-5 w-5 text-[#2BA8A2] dark:text-[#10B981] shrink-0 stroke-[1.8]" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2.5 flex-wrap">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
          {t('section.all')} ({messages.length})
        </Button>
        <Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('unread')}>
          {t('admin.unread')} ({unreadCount})
        </Button>
        <Button variant={filter === 'replied' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('replied')}>
          {t('admin.replied')} ({repliedCount})
        </Button>
      </div>

      {loading ? (
        <p className="text-[#2477A8] dark:text-[#A7ADB4] py-8 text-center text-sm">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/60 bg-white/38 backdrop-blur-[14px] shadow-[0_8px_30px_rgba(36,119,168,0.08)] p-12 text-center dark:border-[#343A40] dark:bg-[#191C1F] dark:backdrop-blur-none">
          <Mail className="h-10 w-10 text-[#2477A8] dark:text-[#737A82] mx-auto mb-3 stroke-[1.5]" />
          <p className="text-[#2477A8] dark:text-[#A7ADB4] text-sm font-medium">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <Card key={msg.id} className={cn('rounded-2xl border border-white/60 bg-white/38 text-[#155A82] backdrop-blur-[14px] shadow-[0_8px_30px_rgba(36,119,168,0.08)] transition-all dark:border-[#343A40] dark:bg-[#191C1F] dark:text-[#F5F7F8] dark:backdrop-blur-none', msg.status === 'unread' ? 'border-[#2BA8A2]/60 bg-white/55 dark:border-[#10B981]/40 dark:bg-[#10B981]/5' : 'hover:border-white/80 dark:hover:border-[#343A40]/80')}>
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="mt-0.5 p-2 rounded-xl bg-white/50 border border-white/65 dark:bg-[#202428] dark:border-[#343A40]">
                      {statusIcon(msg.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <span className="font-semibold text-[#155A82] dark:text-[#F5F7F8]">{msg.visitor_name}</span>
                        <span className="text-xs text-[#2477A8] dark:text-[#A7ADB4]">{msg.visitor_email}</span>
                        <Badge
                          variant={msg.status === 'unread' ? 'default' : 'secondary'}
                          className={cn('text-xs rounded-lg px-2 py-0.5 font-medium',
                            msg.status === 'unread' ? 'bg-[#2BA8A2]/15 text-[#2BA8A2] border border-[#2BA8A2]/30 dark:bg-[#38BDF8]/15 dark:text-[#38BDF8] dark:border-[#38BDF8]/30' :
                            msg.status === 'replied' ? 'bg-[#22C55E]/15 text-[#15803d] border border-[#22C55E]/30 dark:bg-[#10B981]/15 dark:text-[#10B981] dark:border-[#10B981]/30' :
                            'bg-white/40 text-[#2477A8] border border-white/60 dark:bg-[#202428] dark:text-[#A7ADB4] dark:border-[#343A40]'
                          )}
                        >
                          {t(`admin.${msg.status}` as any)}
                        </Badge>
                      </div>
                      {msg.subject && <p className="text-sm font-medium text-[#155A82] dark:text-[#F5F7F8] mb-1">{msg.subject}</p>}
                      <p className="text-sm text-[#2477A8] dark:text-[#A7ADB4] line-clamp-2 leading-relaxed">{msg.body}</p>
                      {msg.reply && (
                        <div className="mt-3 p-3 rounded-xl bg-white/50 border border-white/65 text-sm text-[#155A82] dark:bg-[#202428] dark:border-[#343A40] dark:text-[#F5F7F8]">
                          <span className="font-semibold text-xs text-[#2BA8A2] dark:text-[#10B981]">{t('admin.reply')}: </span>
                          <span className="text-xs text-[#2477A8] dark:text-[#A7ADB4]">{msg.reply}</span>
                        </div>
                      )}
                      <p className="text-xs text-[#6FA7C8] dark:text-[#737A82] mt-2.5">
                        {safeFormatDate(msg.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-auto">
                    <Button variant="outline" size="sm" onClick={() => openReply(msg)} className="h-8 px-2.5 text-xs">
                      <Reply className="h-3.5 w-3.5 mr-1 stroke-[1.8]" />
                      {t('admin.reply')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(msg.id)} className="h-8 px-2.5 text-xs hover:border-[#EF4444]/40 hover:text-[#EF4444]">
                      <Trash2 className="h-3.5 w-3.5 stroke-[1.8]" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#155A82] dark:text-[#F5F7F8]">{t('admin.reply')}</DialogTitle>
          </DialogHeader>
          {replyMsg && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-white/50 border border-white/65 text-sm text-[#155A82] dark:bg-[#202428] dark:border-[#343A40]">
                <p className="font-medium text-[#155A82] dark:text-[#F5F7F8]">{replyMsg.visitor_name} ({replyMsg.visitor_email})</p>
                {replyMsg.subject && <p className="font-medium text-xs text-[#2477A8] dark:text-[#A7ADB4] mt-1">{replyMsg.subject}</p>}
                <p className="mt-2 text-xs text-[#2477A8] dark:text-[#A7ADB4] leading-relaxed">{replyMsg.body}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#155A82] dark:text-[#F5F7F8] mb-1.5 block">{t('admin.reply')}</label>
                <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4} placeholder="Type your reply..." />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReplyOpen(false)}>
              {t('admin.cancel')}
            </Button>
            <Button onClick={handleReply} variant="brand">
              <Send className="h-4 w-4 mr-2 stroke-[1.8]" />
              {t('admin.reply')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
