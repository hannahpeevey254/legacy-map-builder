
-- Create assets storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  false,
  52428800,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','audio/mpeg','audio/wav','audio/ogg','audio/mp4','video/mp4','video/quicktime','video/webm']
);

-- RLS on storage.objects for assets bucket
CREATE POLICY "Users can upload own assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add file_path column to digital_assets
ALTER TABLE public.digital_assets ADD COLUMN IF NOT EXISTS file_path TEXT;
