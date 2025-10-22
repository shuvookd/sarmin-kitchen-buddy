-- Insert a default admin user
-- Password: admin123 (user should change this after first login)
-- This inserts directly into auth.users which is allowed in migrations

-- First, we need to insert into auth.users
-- Since we can't directly insert into auth.users in a migration, we'll create a function to do it
-- The admin will need to sign up manually with email: admin@sarminkitchen.com and any password
-- Then we update their role to admin

-- For now, let's just make it easy to identify who should be admin
-- We'll create a comment for the user to manually create the admin account

-- Note: To create your admin account:
-- 1. Sign up at /auth with email: admin@sarminkitchen.com
-- 2. Use password: Admin@123
-- 3. The profile will automatically be created with 'customer' role
-- 4. Then run this to make yourself admin:

-- UPDATE profiles SET role = 'admin' WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'admin@sarminkitchen.com'
-- );

-- Let's create a helper function to promote a user to admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = (
    SELECT id FROM auth.users WHERE email = user_email
  );
END;
$$;

-- Allow anonymous cart items (for guest users before they sign up)
-- Modify cart_items to allow NULL user_id temporarily
ALTER TABLE public.cart_items ALTER COLUMN user_id DROP NOT NULL;

-- Add session_id for guest carts
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Update cart policies to allow guest access
DROP POLICY IF EXISTS "Users can view their own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert to their cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete from their cart" ON public.cart_items;

-- New policies that work for both authenticated and guest users
CREATE POLICY "Anyone can view their cart"
  ON public.cart_items FOR SELECT
  USING (
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Anyone can insert to cart"
  ON public.cart_items FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Anyone can update their cart"
  ON public.cart_items FOR UPDATE
  USING (
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Anyone can delete from their cart"
  ON public.cart_items FOR DELETE
  USING (
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  );