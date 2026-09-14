/*
# Restrict write operations to authenticated users

## Context
The app now has authentication. The Vitrine page (public) needs read-only
access to affiliate_links and app_settings. All write operations (INSERT,
UPDATE, DELETE) on every table must require an authenticated session.

## Changes
For each table (affiliate_links, app_settings, whatsapp_groups,
message_templates, send_log):
- Keep SELECT policy open to anon + authenticated (Vitrine reads)
- Replace INSERT/UPDATE/DELETE policies: drop anon, keep authenticated only

## Security
- anon can only SELECT (read) data — cannot modify anything
- authenticated users can INSERT/UPDATE/DELETE (full management)
- No data loss — only policy changes, no schema changes
*/

-- affiliate_links
DROP POLICY IF EXISTS "anon_insert_links" ON affiliate_links;
DROP POLICY IF EXISTS "anon_update_links" ON affiliate_links;
DROP POLICY IF EXISTS "anon_delete_links" ON affiliate_links;

CREATE POLICY "auth_insert_links" ON affiliate_links FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_links" ON affiliate_links FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_links" ON affiliate_links FOR DELETE
  TO authenticated USING (true);

-- app_settings
DROP POLICY IF EXISTS "anon_insert_settings" ON app_settings;
DROP POLICY IF EXISTS "anon_update_settings" ON app_settings;
DROP POLICY IF EXISTS "anon_delete_settings" ON app_settings;

CREATE POLICY "auth_insert_settings" ON app_settings FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_settings" ON app_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_settings" ON app_settings FOR DELETE
  TO authenticated USING (true);

-- whatsapp_groups
DROP POLICY IF EXISTS "anon_insert_groups" ON whatsapp_groups;
DROP POLICY IF EXISTS "anon_update_groups" ON whatsapp_groups;
DROP POLICY IF EXISTS "anon_delete_groups" ON whatsapp_groups;

CREATE POLICY "auth_insert_groups" ON whatsapp_groups FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_groups" ON whatsapp_groups FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_groups" ON whatsapp_groups FOR DELETE
  TO authenticated USING (true);

-- message_templates
DROP POLICY IF EXISTS "anon_insert_templates" ON message_templates;
DROP POLICY IF EXISTS "anon_update_templates" ON message_templates;
DROP POLICY IF EXISTS "anon_delete_templates" ON message_templates;

CREATE POLICY "auth_insert_templates" ON message_templates FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_templates" ON message_templates FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_templates" ON message_templates FOR DELETE
  TO authenticated USING (true);

-- send_log
DROP POLICY IF EXISTS "anon_insert_log" ON send_log;
DROP POLICY IF EXISTS "anon_update_log" ON send_log;
DROP POLICY IF EXISTS "anon_delete_log" ON send_log;

CREATE POLICY "auth_insert_log" ON send_log FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_log" ON send_log FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_log" ON send_log FOR DELETE
  TO authenticated USING (true);
