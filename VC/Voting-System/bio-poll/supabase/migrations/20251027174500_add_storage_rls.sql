-- Create policy to allow public read access to the "avatars" bucket
CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
TO anon
USING ( bucket_id = 'avatars' );