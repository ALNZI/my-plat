/*
# Contact Settings & Chat FAQ

## Overview
Adds tables for per-contact-button visibility toggles and custom FAQ shortcuts
for the auto-responder chatbot.

## New Tables

### 1. contact_settings
- Stores contact info (phone/whatsapp, email, github, linkedin) with visibility toggles.
- One row per user (linked to auth.users).
- Columns: id, phone, phone_visible, email, email_visible, github, github_visible,
  linkedin, linkedin_visible, created_at, updated_at.

### 2. chat_faq
- Stores custom question-answer pairs for the chatbot auto-responder.
- Columns: id, user_id, question, answer, keywords, sort_order, created_at, updated_at.

## Security (RLS)
- contact_settings: Only the authenticated owner can CRUD their own row.
- chat_faq: Only the authenticated owner can CRUD their own rows.
*/

-- Contact Settings table
CREATE TABLE IF NOT EXISTS contact_settings (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL DEFAULT '',
  phone_visible boolean NOT NULL DEFAULT false,
  email text NOT NULL DEFAULT '',
  email_visible boolean NOT NULL DEFAULT false,
  github text NOT NULL DEFAULT '',
  github_visible boolean NOT NULL DEFAULT false,
  linkedin text NOT NULL DEFAULT '',
  linkedin_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contact_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select_contact" ON contact_settings;
CREATE POLICY "owner_select_contact" ON contact_settings FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "owner_insert_contact" ON contact_settings;
CREATE POLICY "owner_insert_contact" ON contact_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "owner_update_contact" ON contact_settings;
CREATE POLICY "owner_update_contact" ON contact_settings FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "owner_delete_contact" ON contact_settings;
CREATE POLICY "owner_delete_contact" ON contact_settings FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Chat FAQ table
CREATE TABLE IF NOT EXISTS chat_faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_faq ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select_faq" ON chat_faq;
CREATE POLICY "owner_select_faq" ON chat_faq FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_insert_faq" ON chat_faq;
CREATE POLICY "owner_insert_faq" ON chat_faq FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_update_faq" ON chat_faq;
CREATE POLICY "owner_update_faq" ON chat_faq FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_delete_faq" ON chat_faq;
CREATE POLICY "owner_delete_faq" ON chat_faq FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_faq_user_id ON chat_faq(user_id);

-- Auto-update trigger for contact_settings
DROP TRIGGER IF EXISTS contact_settings_updated_at ON contact_settings;
CREATE TRIGGER contact_settings_updated_at BEFORE UPDATE ON contact_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update trigger for chat_faq
DROP TRIGGER IF EXISTS chat_faq_updated_at ON chat_faq;
CREATE TRIGGER chat_faq_updated_at BEFORE UPDATE ON chat_faq
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
