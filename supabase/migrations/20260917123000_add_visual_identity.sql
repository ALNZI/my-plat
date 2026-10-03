-- Standalone Visual Identity settings; no dependency on a profile table.
-- Review before applying. Admin ownership must be assigned explicitly.
BEGIN;

CREATE TABLE IF NOT EXISTS public.visual_identity_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  hero_background_path text,
  portfolio_logo_path text,
  brand_mark_path text,
  favicon_path text,
  apple_touch_icon_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bucket-relative image references produce stable public URLs.
INSERT INTO public.visual_identity_settings (id)
VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.visual_identity_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.visual_identity_settings FROM anon, authenticated;
GRANT SELECT ON public.visual_identity_settings TO anon, authenticated;
GRANT UPDATE (
  hero_background_path, portfolio_logo_path, brand_mark_path,
  favicon_path, apple_touch_icon_path
) ON public.visual_identity_settings TO authenticated;

CREATE OR REPLACE FUNCTION public.is_portfolio_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.visual_identity_settings
    WHERE id = true AND owner_user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.is_portfolio_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_portfolio_owner() TO authenticated;

DROP POLICY IF EXISTS visual_identity_settings_read ON public.visual_identity_settings;
CREATE POLICY visual_identity_settings_read ON public.visual_identity_settings
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS visual_identity_settings_update ON public.visual_identity_settings;
CREATE POLICY visual_identity_settings_update ON public.visual_identity_settings
  FOR UPDATE TO authenticated
  USING (public.is_portfolio_owner())
  WITH CHECK (public.is_portfolio_owner());

CREATE OR REPLACE FUNCTION public.visual_identity_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.visual_identity_touch_updated_at() FROM PUBLIC;
DROP TRIGGER IF EXISTS visual_identity_updated_at ON public.visual_identity_settings;
CREATE TRIGGER visual_identity_updated_at
  BEFORE UPDATE ON public.visual_identity_settings
  FOR EACH ROW EXECUTE FUNCTION public.visual_identity_touch_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visual-identity', 'visual-identity', true, 2097152,
  ARRAY['image/jpeg', 'image/webp', 'image/png', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public images; mutations are restricted to the existing portfolio owner.
DROP POLICY IF EXISTS visual_identity_public_read ON storage.objects;
CREATE POLICY visual_identity_public_read ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'visual-identity');

DROP POLICY IF EXISTS visual_identity_owner_insert ON storage.objects;
CREATE POLICY visual_identity_owner_insert ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'visual-identity'
    AND public.is_portfolio_owner()
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS visual_identity_owner_delete ON storage.objects;
CREATE POLICY visual_identity_owner_delete ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'visual-identity'
    AND public.is_portfolio_owner()
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Uploads use immutable unique paths; no UPDATE/overwrite policy is needed.
-- Assign owner_user_id to the verified existing admin's auth.users.id through
-- the trusted SQL Editor before enabling uploads. Until assigned, writes are
-- denied. Browser clients cannot change ownership or insert/delete settings.
COMMIT;