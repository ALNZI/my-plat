'use client';

import { useState } from 'react';
import { useColor } from '@/contexts/app-context';
import { useLanguage } from '@/contexts/app-context';
import { Palette, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const presetHues = [
  { hue: 177, name: 'Brand Teal' },
  { hue: 24, name: 'Terracotta' },
  { hue: 155, name: 'Botanical Mint' },
  { hue: 38, name: 'Citrus Amber' },
  { hue: 0, name: 'Crimson' },
  { hue: 222, name: 'Ice Blue' },
  { hue: 280, name: 'Purple' },
  { hue: 330, name: 'Pink' },
];

export function ColorPicker() {
  const { hue, setHue, resetColor } = useColor();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative" title={t('color.title')}>
          <Palette className="h-4 w-4" />
          <span
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-background"
            style={{ backgroundColor: `hsl(${hue} 70% 50%)` }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{t('color.title')}</h4>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetColor} title={t('color.reset')}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {presetHues.map((preset) => (
              <button
                key={preset.hue}
                onClick={() => setHue(preset.hue)}
                className={cn(
                  'h-10 w-full rounded-lg border-2 transition-all hover:scale-105',
                  hue === preset.hue ? 'border-foreground ring-2 ring-ring ring-offset-1' : 'border-transparent'
                )}
                style={{ backgroundColor: `hsl(${preset.hue} 70% 50%)` }}
                title={preset.name}
              >
                {hue === preset.hue && <Check className="h-4 w-4 text-white mx-auto" />}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={360}
                value={hue}
                onChange={(e) => setHue(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(0 70% 50%), hsl(60 70% 50%), hsl(120 70% 50%), hsl(180 70% 50%), hsl(240 70% 50%), hsl(300 70% 50%), hsl(360 70% 50%))`,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{hue}°</span>
              <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: `hsl(${hue} 70% 50%)` }} />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
