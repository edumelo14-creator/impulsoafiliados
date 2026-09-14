/*
# Create panel_users table for admin authentication

## Context
The app now uses Supabase Auth for login. This table maps friendly usernames
(like "eduardoMelo") to the underlying Supabase Auth email, so the login form
can ask for a username instead of an email.

## New Tables
- `panel_users`
  - `id` (uuid, primary key)
  - `username` (text, unique, not null) — the friendly login name
  - `email` (text, unique, not null) — linked to auth.users email
  - `created_at` (timestamptz)

## Seed
- Pre-populates one row: username "eduardoMelo" → email "eduardomelo@impulso.local"

## Security
- RLS enabled
- Anyone can SELECT (needed so the login form can look up the email by username)
- Only authenticated users can INSERT/UPDATE/DELETE (manage users from the panel)
*/

CREATE TABLE IF NOT EXISTS panel_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE panel_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_panel_users" ON panel_users;
CREATE POLICY "anon_select_panel_users" ON panel_users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_panel_users" ON panel_users;
CREATE POLICY "auth_insert_panel_users" ON panel_users FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_panel_users" ON panel_users;
CREATE POLICY "auth_update_panel_users" ON panel_users FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_panel_users" ON panel_users;
CREATE POLICY "auth_delete_panel_users" ON panel_users FOR DELETE
  TO authenticated USING (true);

-- Seed the default user (idempotent)
INSERT INTO panel_users (username, email)
VALUES ('eduardoMelo', 'eduardomelo@impulso.local')
ON CONFLICT (username) DO NOTHING;
