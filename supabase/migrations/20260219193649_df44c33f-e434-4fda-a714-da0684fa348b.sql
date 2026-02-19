
-- Create social_intentions table
CREATE TABLE public.social_intentions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  intention text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_intentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own social intentions"
  ON public.social_intentions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE TRIGGER update_social_intentions_updated_at
  BEFORE UPDATE ON public.social_intentions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add master_scrub_enabled to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS master_scrub_enabled boolean NOT NULL DEFAULT false;
