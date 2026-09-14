/*
# Create vitrine storage bucket for logo and hero images

1. Storage
- Creates a `vitrine` storage bucket (public) for uploading store logo and hero/banner images.
2. Security
- Bucket is public (anyone can read uploaded files).
- Upload/delete restricted to anon + authenticated (same as app data — single-tenant, no login).
3. Notes
- The frontend will upload images here and store the public URL in `app_settings.vitrine_logo_url` / `vitrine_hero_url`.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('vitrine', 'vitrine', true)
ON CONFLICT (id) DO NOTHING;
