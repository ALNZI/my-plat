'use client';

import { useEffect } from 'react';
import { useVisualIdentity } from '@/contexts/visual-identity-context';
import { getVisualIdentityUrl } from '@/lib/visual-identity';

/** Keep existing browser tabs in sync; initial links also come from server metadata. */
export function VisualIdentityIcons() {
  const { settings, loaded } = useVisualIdentity();
  const favicon = getVisualIdentityUrl(settings?.favicon_path);
  const apple = getVisualIdentityUrl(settings?.apple_touch_icon_path);

  useEffect(() => {
    if (!loaded) return;
    const restorers: (() => void)[] = [];
    for (const [rel, href] of [['icon', favicon], ['apple-touch-icon', apple]] as const) {
      const existing = Array.from(document.head.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`));
      if (!href) {
        // A deleted icon must not restore a stale server-rendered Storage URL.
        for (const link of existing) {
          if (link.href.includes('/storage/v1/object/public/visual-identity/')) link.remove();
        }
        continue;
      }
      const links = existing.length ? existing : [document.createElement('link')];
      for (const link of links) {
        const original = { href: link.getAttribute('href'), type: link.getAttribute('type'), sizes: link.getAttribute('sizes') };
        link.rel = rel;
        link.href = href;
        link.type = href.endsWith('.ico') ? 'image/x-icon' : 'image/png';
        // Dimensions are recommendations; do not assert an unverified intrinsic size.
        link.removeAttribute('sizes');
        if (!existing.length) document.head.appendChild(link);
        restorers.push(() => {
          if (!existing.length) { link.remove(); return; }
          for (const [name, value] of Object.entries(original)) {
            if (value === null) link.removeAttribute(name);
            else link.setAttribute(name, value);
          }
        });
      }
    }
    return () => restorers.forEach((restore) => restore());
  }, [favicon, apple, loaded]);

  return null;
}