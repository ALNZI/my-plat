# Portfolio Platform — Next.js + Supabase

مشروع PORTFOLIO من نوع Next.js (App Router) مُدير بمساعدة Supabase للبيانات والمصادمة والتخزين. يحتوي على لوحة تحكم إدمن، وعرض عام للـ Portfolio، ووحدة تحكم بصرية (Visual Identity)، ودالة حافة (Edge Function) لتصدير النسخ الاحتياطية.

> ⚠️ هذا README مكتوب ليكون مرجعًا كاملاً لمنقّل المشروع إلى جهاز آخر. يُرجى قراءة sections أدناه بعناية، خاصة **نقل المشروع لجهاز آخر**، **الإعدادات البيئية**، و**إعداد Supabase**.

---

## 📁 هيكل المشروع

```
project/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── admin/
│   │   ├── login/page.tsx
## 🔐 المتغيرات البيئية

انسخ `.env` إلى الجهاز الجديد مع القيم الصحيحة.

### `.env` (المطلوب)

```ini
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> 🔎 لا يوجد ملف `.env.local` في هذا المشروع. القيم تُقرأ من `.env` فقط.
> - لا ترفع `.env` إلى المخزن.
> - لا تشارك مفتاح anon كقيمة عامة.
> - إذا أردت مشروعًا جديدًا، أنشئ مشروع Supabase جديدًا وأضف القيم الجديدة.

---

## 🗄 إعداد Supabase

### 1. الهجرة (Migrations)

ملفات الهجرة في `supabase/migrations/`:

1. `20260912210751_create_portfolio_schema.sql`
   - ينشئ الجداول: `profiles`, `items`, `messages` مع RLS المناسبة.
2. `20260913113239_create_contact_settings_and_chat_faq.sql`
   - ينشئ الجداول: `contact_settings`, `chat_faq`.
3. `20260917123000_add_visual_identity.sql`
   - ينشئ `visual_identity_settings`، دالة `is_portfolio_owner()`، و bucket `visual-identity` مع سياسات التخزين.

> ✅ يجب تشغيل هذه الهجرة على قاعدة بيانات Supabase الخاصة بك (عبر SQL Editor أو Supabase CLI) قبل تشغيل التطبيق.

### 2. تعيين مالك المحفظة (مهم)

بعد تشغيل Migration `20260917123000_add_visual_identity.sql`، عيّن `owner_user_id` في الجدول `public.visual_identity_settings` لمعرف المستخدم المصرح (auth.users.id).

```sql
-- استبدل '<admin auth.users id>' bằng uid الحقيقي للمستخدم المصرح
UPDATE public.visual_identity_settings
SET owner_user_id = '<admin auth.users id>'
WHERE id = true;
```

من دون ذلك، عمليات رفع الصور تُرفض.

### 3. مصادقة الاستعادة (Reset Password)

يعتمد المشروع على Supabase Auth:

- `/forgot-password` يستخدم `supabase.auth.resetPasswordForEmail()` ويوجه إلى `${window.location.origin}/reset-password`.
- `/reset-password` ينتظر جلسة `PASSWORD_RECOVERY` أو `SIGNED_IN`، ثم يستخدم `supabase.auth.updateUser({ password: newPassword })`.
- `/admin/reset-password` يعمل كإعادة توجيه إلى `/reset-password` مع الحفاظ على الـ hash/params.

لا توجد حالياً أعتماد على SMTP مخصص أو EmailJS لهذا المسار في التطبيق.
## 📦 التثبيت والتشغيل

من جذر المشروع (`project/`) نفّذ:

```bash
# تثبيت التبعيات
pnpm install

# تشغيل التطوير
pnpm dev

# تجميع الإنتاج
pnpm build

# تشغيل خادم الإنتاج (بعد build)
pnpm start

# تدقيق TypeScript بدون تجميع
pnpm typecheck
```

ملاحظات:
- تم استخدام `pnpm` في المشروع؛ إذا كان جهازك يستخدم `npm`/`yarn`، يمكنك ذلك طالما التبعيات متوافقة، لكن الأفضل `pnpm`.
- `package.json` يتضمن `next` 16.3.5, `@supabase/supabase-js` ^2.58.0, `tailwindcss` ^3.3.3 وغيرها.

---

## 🔁 نقل المشروع إلى جهاز آخر

### الخطوة 1 — نسخ الكود

انسخ مجلد المشروع كاملاً (باستثناء `node_modules`, `.next`, `.pnpm-store`):

```bash
# إذا كنت تستخدم Git:
git bundle create portfolio.bundle --all

# أو انسخ المجلد كملف مضغوط بدون node_modules/.next
```

إذا لم تكن تستخدم Git، انسخ مجلد `project/` كاملاً (ما عدا المجلدات المذكورة في `.gitignore`).

### الخطوة 2 — استعادة المتغيرات البيئية

انسخ ملف `.env` من الجهاز القديم إلى مجلد المشروع في الجهاز الجديد. تأكد من صحة القيم ومطابقتها لمشروع Supabase.

> 🔥 لا تشارك `.env` بصورة عامة. حافظ عليه في مكان آمن.

### الخطوة 3 — إعادة تثبيت التبعيات

```bash
cd project
pnpm install
```

إذا أردت، يمكنك `npm install` أو `yarn`، لكن `pnpm` الأفضل لمطابقة البيئة الأصلية.

### الخطوة 4 — التحقق من إعداد Supabase

- تأكد من وجود الجداول والسياسات المطلوبة.
- شغّل الهجرات إذا لم تكن مطبقة.
- عيّن `owner_user_id` في `visual_identity_settings` إذا كنت ستستخدم الهوية البصرية.

### الخطوة 5 — التحقق من التشغيل

```bash
pnpm typecheck
pnpm build
pnpm dev      # أو pnpm start للتجربة على build
```

أنقِذ الـ logs في حال وجود أخطاء في المتغيرات البيئية أو اتصال Supabase.

### ملاحظات إضافية للنقل

- **جلسة المستخدم وكلمات المرور** لا ينقلها المشروع بين الأجهزة؛ Supabase يتعامل مع المصادقة عبر المستخدم نفسه. لن تحتاج لنقل أي شيء متعلق بـ auth.session يدوياً.
- **الملفات في bucket `visual-identity`** تعيش على Supabase Storage وعلى ربطها بالمشروع عبر bucket. إذا نقلت المشروع إلى مشروع Supabase جديد، يجب إعادة إنشاء bucket وسياسات التخزين، ونقل ملفات الصور يدوياً إذا رغبت.
- **دالة export-backup** اختيارية وتعتمد على `supabase/config.toml` وتعريف الدالة الحافة. إذا أردت استخدامها، أعد ربطها من خلال لوحة Supabase Functions أو CLI حسب إعدادات مشروعك.

---

## 🔑 استعادة كلمة المرور (تفاصيل التشغيل)

1. **طلب رابط الاستعادة**
   - من `/forgot-password`
   - يستخدم: `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })`
   - يظهر رسالة نجاح دائمًا لتجنب كشف وجود الحساب.

2. **تغيير كلمة المرور**
   - من `/reset-password`
   - يجب أن تكون الجلسة Present شيءً (عادةً بعد النقر من البريد)، وسيتم التحقق عبر `PASSWORD_RECOVERY` / `SIGNED_IN`.
---

## 📚 ملفات ودروس ذات صلة

- `Migration.md` — تعليمات التحقق من هجرة إزالة جداول SMTP/رسائل الاستعادة.
- `تعليمات.md` — وثائق مشروع أوسع تتضمن التفاصيل التقنية والهجرة وغيرها.

يمكنك الرجوع إليها بعد نقل المشروع للتأكد من كل خطوة.

---

## 🧹 ملاحظات هامة وأمان

- لا ترفع `.env` أو أي ملف يحتوي على مفاتيح Supabase أو أية بيانات حساسة إلى المخزن.
- لا تطبع قيم `NEXT_PUBLIC_SUPABASE_URL` أو `NEXT_PUBLIC_SUPABASE_ANON_KEY` بصورة صريحة في السجلات العامة.
- عميل Supabase في الواجهة الأمامية يُستخدم فقط لمصادقة عامة وقراءة/كتابة محدودة (RLS).
- الهوية البصرية تتطلب تعيين `owner_user_id`؛ خلاف ذلك لن تعمل العمليات.

---

## 📌 سريع للنقل (Quick Checklist)

- [ ] انسخ مجلد المشروع بدون `node_modules` / `.next` / `.pnpm-store`.
- [ ] انسخ `.env` مع قيم Supabase.
- [ ] أعد تثبيت التبعيات (`pnpm install`).
- [ ] شغّل `pnpm typecheck` ثم `pnpm build`.
- [ ] تأكد من Supabase: الجداول، RLS، الهجرة، owner.
- [ ] اختبر `/admin/login` و `/forgot-password` و `/reset-password`.
- [ ] إذا استخدمت Visual Identity، عيّن `owner_user_id` في Supabase.
- [ ] إذا استخدمت `export-backup`، تأكد من إعداد الدالة الحافة.

---

تم إعداد هذا الملف لتبسيط نقل المشروع بين الأجهزة، ويحتوي على كل التفاصيل الأساسية: المتغيرات البيئية، متطلبات التشغيل، أوامر التثبيت، خطوات إعداد Supabase، وإجراءات استعادة كلمة المرور، والملاحظات الأمنية الهامة.

   - يُسمح فقط إذا كانت كلمة المرور الجديدة ≥ 8 خانات ومطابقة مع تأكيدها.
   - يستخدم: `supabase.auth.updateUser({ password: newPassword })`
   - بعد النجاح، يُعيد التوجيه تلقائيًا إلى `/admin/login` بعد بضع ثوانٍ.

3. **مسار الإدمن**
   - `/admin/login` يحتوي على رابط إلى `/forgot-password`.
   - `/admin/reset-password` يعيد التوجيه إلى `/reset-password` مع الحفاظ على البارامترات والـ hash.

4. **تغيير كلمة المرور من الإدمن**
   - في لوحة الإدمن، القسم Security يتيح تغيير كلمة المرور الحالية (مطلوب كتابة كلمة المرور الحالية + الجديدة + التأكيد).

لا توجد حاليًا ميزة SMTP مخصصة أو EmailJS تعمل في مسار الاستعادة؛ البريد يأتي من Supabase Auth نفسه.




│   │   ├── reset-password/page.tsx  (إعادة توجيه إلى /reset-password)
│   │   └── page.tsx                (لوحة التحكم)
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
├── components/
│   ├── admin/
│   │   ├── items-manager.tsx
│   │   ├── messages-manager.tsx
│   │   ├── settings-manager.tsx
│   │   ├── settings-navigation.tsx
│   │   └── visual-identity-section.tsx
│   ├── chat-widget.tsx
│   ├── cv-export.tsx
│   ├── error-boundary.tsx
│   ├── navbar.tsx
│   ├── portfolio-sections.tsx
│   ├── visual-identity-icons.tsx
│   ├── visual-identity-image.tsx
│   └── ui/ (**مكونات واجهة مستخدم مشتركة، شبيهة بـshadcn/ui**)
├── contexts/
│   ├── app-context.tsx
│   └── visual-identity-context.tsx
├── lib/
│   ├── supabase.ts
│   ├── i18n.ts
│   ├── visual-identity.ts
│   └── utils.ts
└── supabase/
    ├── config.toml
    ├── functions/
    │   └── export-backup/
    │       └── index.ts
    └── migrations/
        ├── 20260912210751_create_portfolio_schema.sql
        ├── 20260913113239_create_contact_settings_and_chat_faq.sql
        └── 20260917123000_add_visual_identity.sql

ملاحظات:
- لا يوجد next.config.mjs / postcss.config.mjs / tailwind.config.ts في جذر المشروع.
- تم استخدام pnpm كلاعب حزمة.
```

---

## 🛠 المتطلبات

- **Node.js**: 18 أو أعلى.
- **pnpm** (موصى به):
  ```bash
  npm install -g pnpm
  ```
- **حساب Supabase** مع مشروع يحتوي على الجداول والسياسات والـ bucket المطلوبة.

