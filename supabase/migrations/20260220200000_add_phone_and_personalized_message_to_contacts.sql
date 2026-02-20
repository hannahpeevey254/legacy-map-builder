-- Add phone_number and personalized_message columns to trusted_contacts table

ALTER TABLE public.trusted_contacts
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS personalized_message TEXT;
