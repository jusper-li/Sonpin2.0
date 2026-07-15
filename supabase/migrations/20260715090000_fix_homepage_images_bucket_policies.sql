/*
  # Fix homepage images storage bucket policies

  1. Changes
    - Ensure the homepage images bucket exists
    - Allow public read access
    - Allow authenticated admins to upload, update, and delete homepage images

  2. Security
    - Public users can view images
    - Only authenticated users can modify images
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('homepage-images', 'homepage-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read access for homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon upload homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon delete homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Service role upload access for homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Service role update access for homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Service role delete access for homepage images" ON storage.objects;

CREATE POLICY "Public read access for homepage images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'homepage-images');

CREATE POLICY "Authenticated users can upload homepage images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'homepage-images');

CREATE POLICY "Authenticated users can update homepage images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'homepage-images')
  WITH CHECK (bucket_id = 'homepage-images');

CREATE POLICY "Authenticated users can delete homepage images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'homepage-images');
