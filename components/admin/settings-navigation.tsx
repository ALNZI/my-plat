'use client';

import { useRef, useState } from 'react';
import { ChevronDown, ImageIcon, MessageSquare, Settings, Shield, Terminal, User } from 'lucide-react';
import { useLanguage } from '@/contexts/app-context';
import { cn } from '@/lib/utils';

export type SettingsSection = 'profile' | 'visual-identity' | 'contact' | 'security' | 'advanced';

const sections = [
  { id: 'profile', icon: User, en: 'Profile & Site Settings', ar: 'إعدادات الملف الشخصي والموقع' },
  { id: 'visual-identity', icon: ImageIcon, en: 'Visual Identity', ar: 'الهوية البصرية' },
  { id: 'contact', icon: MessageSquare, en: 'Contact & Requests Settings', ar: 'إعدادات التواصل والطلبات' },
  { id: 'security', icon: Shield, en: 'Security & Password', ar: 'الأمان وكلمة المرور' },
  { id: 'advanced', icon: Terminal, en: 'Advanced Settings', ar: 'الإعدادات المتقدمة' },
] as const;

export function SettingsNavigation({ active, section, onSelect }: {
  active: boolean;
  section: SettingsSection;
  onSelect: (section: SettingsSection) => void;
}) {
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(active);
  const trigger = useRef<HTMLButtonElement>(null);

  // Keep accordion open whenever this tab is active
  const handleTrigger = () => {
    const next = !open;
    setOpen(next);
  };

  const handleSelect = (id: SettingsSection) => {
    onSelect(id);
    // Keep accordion open after selecting a sub-item
  };

  return (
    <div className="flex flex-col gap-0.5">
      {/* Accordion trigger */}
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="admin-settings-submenu"
        onClick={handleTrigger}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-start text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#10B981]',
          active
            ? 'bg-[#2BA8A2] dark:bg-[#10B981] text-white shadow-sm font-semibold'
            : 'text-[#2477A8] hover:text-[#155A82] hover:bg-white/45 dark:text-[#A7ADB4] dark:hover:text-[#F5F7F8] dark:hover:bg-[#25292D]'
        )}
      >
        <Settings className="h-5 w-5 shrink-0 stroke-[1.8]" aria-hidden="true" />
        <span className="flex-1">{t('admin.settings')}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 opacity-70 transition-transform duration-200 motion-reduce:transition-none',
            open && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Accordion body — slides open/closed */}
      <div
        id="admin-settings-submenu"
        aria-hidden={!open}
        className={cn(
          'overflow-hidden transition-all duration-200 motion-reduce:transition-none',
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        )}
      >
        <ul
          aria-label={t('admin.settings')}
          className="flex flex-col gap-0.5 pt-1 ltr:pl-3 rtl:pr-3"
        >
          {sections.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                data-settings-item
                tabIndex={open ? 0 : -1}
                aria-current={active && section === item.id ? 'page' : undefined}
                onClick={() => handleSelect(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#10B981]',
                  active && section === item.id
                    ? 'bg-[#2BA8A2]/15 text-[#2BA8A2] border border-[#2BA8A2]/30 dark:bg-[#10B981]/15 dark:text-[#10B981] dark:border-[#10B981]/30 font-semibold'
                    : 'text-[#2477A8] hover:bg-white/45 hover:text-[#155A82] dark:text-[#A7ADB4] dark:hover:bg-[#25292D] dark:hover:text-[#F5F7F8]'
                )}
              >
                {/* Connecting line indicator */}
                <span
                  className={cn(
                    'w-px h-4 rounded-full shrink-0 transition-colors',
                    active && section === item.id ? 'bg-[#2BA8A2] dark:bg-[#10B981]' : 'bg-[#2477A8]/30 dark:bg-[#343A40]'
                  )}
                  aria-hidden="true"
                />
                <item.icon className="h-4 w-4 shrink-0 stroke-[1.8]" aria-hidden="true" />
                <span>{item[lang]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
