
-- 1. Create role enum (includes super_admin for site ownership)
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');

-- 2. Create user_roles table (roles are NEVER stored on profile/user table)
CREATE TABLE public.user_roles (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Security-definer function to check roles — bypasses RLS, prevents recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 5. RLS policies: users can read their own roles; only super_admin can manage all
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 6. Assign super_admin to hannah.peevey@students.iaac.net
INSERT INTO public.user_roles (user_id, role)
VALUES ('1f9eb1dc-227d-4d1f-a0a5-ea1572f85a0b', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
