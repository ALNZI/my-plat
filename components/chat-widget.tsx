'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/app-context';
import { supabase, getOwnerUserId } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type ChatMessage = {
  role: 'bot' | 'user';
  text: string;
};

export function ChatWidget() {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'bot', text: t('chat.welcome') }]);
    }
  }, [open, messages.length, t]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getBotResponse = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('cv') || lower.includes('resume') || lower.includes('سيرة')) {
      return t('chat.cvResponse');
    }
    if (lower.includes('email') || lower.includes('contact') || lower.includes('تواصل') || lower.includes('بريد')) {
      return t('chat.emailResponse');
    }
    if (lower.includes('project') || lower.includes('work') || lower.includes('مشروع') || lower.includes('عمل')) {
      return t('chat.projectsResponse');
    }
    return t('chat.defaultResponse');
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setSending(true);

    // If it looks like a contact message, save to DB
    if (userMsg.length > 20 && userMsg.includes('@')) {
      const targetUserId = await getOwnerUserId();
      if (targetUserId) {
        await supabase.from('messages').insert({
          user_id: targetUserId,
          visitor_name: 'Chat Widget',
          visitor_email: userMsg,
          subject: 'Chat message',
          body: userMsg,
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('messages-updated'));
        }
      }
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'bot', text: getBotResponse(userMsg) }]);
      setSending(false);
    }, 600);
  };

  const handlePromptClick = (promptText: string) => {
    setInput(promptText);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'user', text: promptText }]);
      setSending(true);
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: 'bot', text: getBotResponse(promptText) }]);
        setSending(false);
      }, 500);
    }, 50);
  };

  const quickPrompts = lang === 'ar'
    ? [
        { label: '📄 السيرة الذاتية', query: 'أريد تحميل السيرة الذاتية' },
        { label: '💼 المشاريع', query: 'حدثني عن أهم المشاريع' },
        { label: '✉️ التواصل', query: 'كيف يمكنني التواصل معك عبر البريد؟' },
      ]
    : [
        { label: '📄 Download CV', query: 'How can I download the CV?' },
        { label: '💼 Projects', query: 'Tell me about the key projects' },
        { label: '✉️ Contact', query: 'How can I contact you via email?' },
      ];

  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          variant="brand"
          size="icon"
          className="fixed bottom-6 ltr:right-6 rtl:left-6 z-50 h-14 w-14 rounded-full shadow-xl hover:scale-110 transition-transform duration-300 ring-4 ring-white/60 dark:ring-emerald-950/40"
        >
          <MessageCircle className="h-6 w-6 stroke-[1.8]" />
        </Button>
      )}

      {open && (
        <div className="fixed bottom-6 ltr:right-6 rtl:left-6 z-50 w-84 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/65 dark:border-border bg-white/85 dark:bg-card shadow-[0_15px_50px_rgba(36,119,168,0.15)] dark:shadow-2xl backdrop-blur-[20px] dark:backdrop-blur-none flex flex-col animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#2BA8A2] dark:bg-[#10B981] text-white">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white stroke-[1.8]" />
              </div>
              <div>
                <span className="font-bold text-sm block leading-none">{t('chat.title')}</span>
                <span className="text-[11px] text-white/80 font-normal">Online Assistant</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4 stroke-[1.8]" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-72 min-h-[160px] bg-white/20 dark:bg-card">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-2xs leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-[#2BA8A2] dark:bg-[#10B981] text-white rounded-br-xs font-medium'
                      : 'bg-white/70 dark:bg-muted border border-white/65 dark:border-border text-[#155A82] dark:text-foreground rounded-bl-xs'
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white/70 dark:bg-muted border border-white/65 dark:border-border rounded-2xl px-3.5 py-2 text-sm shadow-2xs">
                  <span className="inline-flex gap-1.5 items-center">
                    <span className="h-2 w-2 rounded-full bg-[#2BA8A2] dark:bg-[#10B981] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-[#2BA8A2] dark:bg-[#10B981] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-[#2BA8A2] dark:bg-[#10B981] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts Chips */}
          <div className="px-3 py-2 bg-white/40 dark:bg-muted/30 border-t border-white/55 dark:border-border flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromptClick(p.query)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/60 dark:bg-card border border-white/65 dark:border-border text-[#2477A8] dark:text-foreground hover:border-[#2BA8A2] hover:text-[#2BA8A2] hover:bg-white/80 transition-all shadow-2xs"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/55 dark:border-border bg-white/40 dark:bg-card flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('chat.placeholder')}
              className="flex-1 rounded-full text-xs"
            />
            <Button
              variant="brand"
              size="icon"
              onClick={handleSend}
              disabled={sending}
              className="rounded-full h-9 w-9 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
