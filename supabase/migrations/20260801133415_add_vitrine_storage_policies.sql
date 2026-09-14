/*
# Add storage policies for vitrine bucket

1. Security
- Adds SELECT, INSERT, UPDATE, DELETE policies on `storage.objects` for the `vitrine` bucket.
- All policies use `TO anon, authenticated` (single-tenant, no login) — same pattern as the existing `product-images` bucket policies.
2. Notes
- These policies allow the frontend to upload, read, update, and delete logo/hero images in the `vitrine` bucket.
*/

DROP POLICY IF EXISTS "public_read_vitrine" ON storage.objects;
CREATE POLICY "public_read_vitrine" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'vitrine');

DROP POLICY IF EXISTS "anon_upload_vitrine" ON storage.objects;
CREATE POLICY "anon_upload_vitrine" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'vitrine');

DROP POLICY IF EXISTS "anon_update_vitrine" ON storage.objects;
CREATE POLICY "anon_update_vitrine" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'vitrine') WITH CHECK (bucket_id = 'vitrine');

DROP POLICY IF EXISTS "anon_delete_vitrine" ON storage.objects;
CREATE POLICY "anon_delete_vitrine" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'vitrine');
