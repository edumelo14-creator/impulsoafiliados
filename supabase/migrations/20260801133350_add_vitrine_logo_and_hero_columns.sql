/*
# Add vitrine logo and hero image columns to app_settings

1. Modified Tables
- `app_settings`: adds two nullable text columns:
  - `vitrine_logo_url` — URL of the store logo image shown in the public vitrine page header
  - `vitrine_hero_url` — URL of the hero/banner background image shown at the top of the public vitrine page
2. Security
- No changes to RLS — existing `anon, authenticated` policies on `app_settings` already cover SELECT/INSERT/UPDATE/DELETE for these new columns.
3. Notes
- Both columns are nullable so existing rows are unaffected.
- The frontend will read/write these through the existing `useSettings()` hook.
*/

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS vitrine_logo_url text;

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS vitrine_hero_url text;
