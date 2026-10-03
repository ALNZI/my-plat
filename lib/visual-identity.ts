import type { Language } from './i18n';

export const VISUAL_IDENTITY_BUCKET = 'visual-identity';
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const visualIdentityFields = [
  { key: 'hero_background_path', en: 'Hero Background', ar: 'خلفية القسم الرئيسي', width: 1920, height: 1080, formats: 'JPG / WebP', extensions: ['jpg', 'jpeg', 'webp'] },
  { key: 'portfolio_logo_path', en: 'Portfolio Logo', ar: 'شعار البورتفوليو', width: 96, height: 96, formats: 'PNG / SVG', extensions: ['png', 'svg'] },
  { key: 'brand_mark_path', en: 'Brand Mark', ar: 'العلامة البصرية', width: 192, height: 192, formats: 'PNG / SVG', extensions: ['png', 'svg'] },
  { key: 'favicon_path', en: 'Favicon', ar: 'أيقونة المتصفح', width: 32, height: 32, formats: 'ICO / PNG', extensions: ['ico', 'png'] },
  { key: 'apple_touch_icon_path', en: 'Apple Touch Icon', ar: 'أيقونة أجهزة Apple', width: 180, height: 180, formats: 'PNG', extensions: ['png'] },
] as const;

export type VisualIdentityKey = typeof visualIdentityFields[number]['key'];
export type VisualIdentityPaths = Partial<Record<VisualIdentityKey, string | null>>;

export const visualIdentityText = {
  en: {
    title: 'Visual Identity',
    description: 'Manage the portfolio images and browser icons. Choose an image, preview it, then save each field independently.',
    guidance: 'Recommended dimensions',
    maxSize: 'Max 2 MB',
    empty: 'No image uploaded yet — the built-in default is shown on the site.',
    upload: 'Upload image',
    replace: 'Replace image',
    remove: 'Delete image',
    confirmRemove: 'Confirm delete',
    removed: 'Image deleted.',
    removeFailed: 'Could not delete the image. Please try again.',
    save: 'Save image',
    saving: 'Uploading and saving…',
    cancel: 'Cancel',
    pending: 'Preview only — not saved yet.',
    saved: 'Image saved successfully.',
    failed: 'Could not save the image. Your previous image has not been intentionally removed. Reload before retrying.',
    invalid: 'Invalid or unsupported image. Use one of the listed formats.',
    tooLarge: 'The image must be non-empty and no larger than 2 MB.',
    unsafeSvg: 'Use a self-contained SVG with basic shapes, paths and gradients only; scripts, styles and external references are not supported.',
    loadError: 'Visual Identity settings could not be read. Check the connection, and apply migration 20260917123000_add_visual_identity.sql if it has not been deployed yet.',
    ownerOnly: 'Only the assigned portfolio owner can manage these images.',
    ownerPending: 'The form is ready, but uploads stay locked until the admin account is assigned as owner. In the Supabase SQL Editor run: update public.visual_identity_settings set owner_user_id = \'<admin auth.users id>\' where id = true;',
    retry: 'Retry',
    previewError: 'Image preview could not be loaded.',
    cleanup: 'Done, but the previous file could not be removed from Storage.',
  },
  ar: {
    title: 'الهوية البصرية',
    description: 'إدارة صور البورتفوليو وأيقونات المتصفح. اختر صورة وعاينها ثم احفظ كل حقل بشكل مستقل.',
    guidance: 'الأبعاد الموصى بها',
    maxSize: 'الحد الأقصى 2 ميجابايت',
    empty: 'لم تُرفع صورة بعد — يظهر المظهر الافتراضي في الموقع.',
    upload: 'رفع صورة',
    replace: 'استبدال الصورة',
    remove: 'حذف الصورة',
    confirmRemove: 'تأكيد الحذف',
    removed: 'تم حذف الصورة.',
    removeFailed: 'تعذر حذف الصورة. حاول مرة أخرى.',
    save: 'حفظ الصورة',
    saving: 'جارٍ الرفع والحفظ…',
    cancel: 'إلغاء',
    pending: 'معاينة فقط — لم تُحفظ بعد.',
    saved: 'تم حفظ الصورة بنجاح.',
    failed: 'تعذر حفظ الصورة. لم تُحذف صورتك السابقة عمدًا. أعد التحميل قبل المحاولة مجددًا.',
    invalid: 'الصورة غير صالحة أو غير مدعومة. استخدم إحدى الصيغ المذكورة.',
    tooLarge: 'يجب ألا تكون الصورة فارغة وألا يتجاوز حجمها 2 ميجابايت.',
    unsafeSvg: 'استخدم SVG مستقلاً يحتوي على أشكال ومسارات وتدرجات أساسية فقط؛ السكربتات والأنماط والمراجع الخارجية غير مدعومة.',
    loadError: 'تعذر قراءة إعدادات الهوية البصرية. تحقق من الاتصال، وطبّق Migration ‏20260917123000_add_visual_identity.sql إذا لم تُطبّق بعد.',
    ownerOnly: 'يمكن لمالك البورتفوليو المُعيَّن فقط إدارة هذه الصور.',
    ownerPending: 'النموذج جاهز، لكن الرفع مغلق حتى تعيين حساب الأدمن كمالك. نفّذ في SQL Editor داخل Supabase: update public.visual_identity_settings set owner_user_id = \'<معرّف حساب الأدمن في auth.users>\' where id = true;',
    retry: 'إعادة المحاولة',
    previewError: 'تعذر تحميل معاينة الصورة.',
    cleanup: 'تم، لكن تعذرت إزالة الملف السابق من التخزين.',
  },
} satisfies Record<Language, Record<string, string>>;

export const VISUAL_IDENTITY_UPDATED_EVENT = 'portfolio-visual-identity-updated';

export type VisualIdentitySettings = {
  id: boolean;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
} & VisualIdentityPaths;

export function getVisualIdentityUrl(path: string | null | undefined, baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL): string | undefined {
  // Only generated paths inside our bucket, never arbitrary URLs or data URLs.
  if (!baseUrl || !path || !/^[0-9a-f-]{36}\/[a-z_]+\/[0-9a-f-]{36}\.(png|svg|jpg|jpeg|webp|ico)$/.test(path)) return undefined;
  return `${baseUrl.replace(/\/$/, '')}/storage/v1/object/public/${VISUAL_IDENTITY_BUCKET}/${path}`;
}

export function validateImageFileInfo(key: VisualIdentityKey, file: Pick<File, 'name' | 'size'>): string {
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error('tooLarge');
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const field = visualIdentityFields.find((entry) => entry.key === key)!;
  if (!(field.extensions as readonly string[]).includes(ext)) throw new Error('invalid');
  return ext;
}

const mimeTypes: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
  svg: 'image/svg+xml', ico: 'image/x-icon',
};

/** Browser validation: verify bytes, decode the image, and reject active SVG content. */
export async function validateVisualIdentityFile(key: VisualIdentityKey, file: File) {
  const extension = validateImageFileInfo(key, file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const begins = (...signature: number[]) => signature.every((value, index) => bytes[index] === value);
  if (extension === 'png' && !begins(137, 80, 78, 71, 13, 10, 26, 10)) throw new Error('invalid');
  if (['jpg', 'jpeg'].includes(extension) && !begins(255, 216, 255)) throw new Error('invalid');
  if (extension === 'ico' && !begins(0, 0, 1, 0)) throw new Error('invalid');
  if (extension === 'webp' && !(begins(82, 73, 70, 70) && String.fromCharCode(...Array.from(bytes.slice(8, 12))) === 'WEBP')) throw new Error('invalid');
  if (extension === 'svg') {
    const text = await file.text();
    if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(text)) throw new Error('unsafeSvg');
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') throw new Error('invalid');
    const tags = new Set(['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'title', 'desc']);
    const attributes = new Set(['xmlns', 'viewBox', 'width', 'height', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'fill', 'fill-rule', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity', 'opacity', 'transform', 'id', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform', 'spreadMethod', 'fx', 'fy', 'clip-path', 'clip-rule', 'mask', 'maskUnits', 'maskContentUnits', 'preserveAspectRatio']);
    for (const element of Array.from(doc.querySelectorAll('*'))) {
      if (!tags.has(element.localName) || element.namespaceURI !== 'http://www.w3.org/2000/svg') throw new Error('unsafeSvg');
      for (const attr of Array.from(element.attributes)) {
        if (!attributes.has(attr.name)) throw new Error('unsafeSvg');
        if (attr.name !== 'xmlns' && /[\\]|:\/\/|data:|javascript:|@import/i.test(attr.value)) throw new Error('unsafeSvg');
        if (/url\s*\(/i.test(attr.value) && !/^url\(#[a-zA-Z0-9_-]+\)$/.test(attr.value)) throw new Error('unsafeSvg');
      }
    }
  }
  const contentType = mimeTypes[extension];
  const blob = new Blob([bytes], { type: contentType });
  const url = URL.createObjectURL(blob);
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.naturalWidth && image.naturalHeight ? resolve() : reject(new Error('invalid'));
      image.onerror = () => reject(new Error('invalid'));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
  return { extension, contentType, blob };
}