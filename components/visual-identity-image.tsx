'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/app-context';
import { useVisualIdentity } from '@/contexts/visual-identity-context';
import { getVisualIdentityUrl, visualIdentityFields, type VisualIdentityKey } from '@/lib/visual-identity';

export function VisualIdentityImage({ field, className, fallback = null, decorative = false }: {
  field: VisualIdentityKey;
  className?: string;
  fallback?: React.ReactNode;
  decorative?: boolean;
}) {
  const { settings } = useVisualIdentity();
  const { lang } = useLanguage();
  const src = getVisualIdentityUrl(settings?.[field]);
  const [failedUrl, setFailedUrl] = useState<string>();
  if (!src || failedUrl === src) return <>{fallback}</>;
  const fieldEntry = visualIdentityFields.find((entry) => entry.key === field);
  const altText = decorative ? '' : (fieldEntry?.[lang] || fieldEntry?.en || '');
  return (
    <img src={src} alt={altText}
      aria-hidden={decorative || undefined} className={className}
      onError={() => setFailedUrl(src)} />
  );
}