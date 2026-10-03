/*
# Portfolio Platform Schema

## Overview
Creates the complete database schema for a personal portfolio platform with admin dashboard.
The app has a single owner (admin) who authenticates via Supabase Auth. Visitors browse the public portfolio without signing in.

## New Tables

### 1. profiles
- Stores the site owner's profile: site name, bio, avatar URL, social links.
- One row per user (linked to auth.users).
- Columns: id (uuid, FK to auth.users), site_name, bio, avatar_url, social_links (jsonb), created_at, updated_at.

### 2. items
- Stores portfolio entries across multiple sections: projects, awards, certificates, research, other.
- Columns: id, user_id (owner), category (enum), title, description, content, image_url, link, tags (text[]), year, month, day, sort_order, created_at, updated_at.
- Supports dynamic "other" categories via the category field.

### 3. messages
- Stores visitor contact messages and admin replies.
- Columns: id, user_id (owner), visitor_name, visitor_email, subject, body, reply, status (unread/read/replied), created_at, replied_at.

## Security (RLS)
- profiles: authenticated users can read/update their own profile. anon can read (public portfolio).
- items: anon/authenticated can read (public portfolio). Only owner can insert/update/delete.
- messages: anon can insert (visitors send messages). Only owner can read/update/delete.
- All write operations require authentication (admin only).
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  site_name text NOT NULL DEFAULT 'My Portfolio',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  social_links jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_profiles" ON profiles;
CREATE POLICY "anon_read_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_update_profile" ON profiles;
CREATE POLICY "owner_update_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "owner_insert_profile" ON profiles;
CREATE POLICY "owner_insert_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'projects',
  title text NOT NULL,
  description text DEFAULT '',
  content text DEFAULT '',
  image_url text DEFAULT '',
  link text DEFAULT '',
  tags text[] DEFAULT '{}',
  year int,
  month int,
  day int,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_items" ON items;
CREATE POLICY "anon_read_items" ON items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_insert_item" ON items;
CREATE POLICY "owner_insert_item" ON items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_update_item" ON items;
CREATE POLICY "owner_update_item" ON items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_delete_item" ON items;
CREATE POLICY "owner_delete_item" ON items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_name text NOT NULL DEFAULT '',
  visitor_email text NOT NULL DEFAULT '',
  subject text DEFAULT '',
  body text NOT NULL DEFAULT '',
  reply text DEFAULT '',
  status text NOT NULL DEFAULT 'unread',
  created_at timestamptz DEFAULT now(),
  replied_at timestamptz
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "owner_read_messages" ON messages;
CREATE POLICY "owner_read_messages" ON messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_update_messages" ON messages;
CREATE POLICY "owner_update_messages" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_delete_messages" ON messages;
CREATE POLICY "owner_delete_messages" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_year ON items(year);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS items_updated_at ON items;
CREATE TRIGGER items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
