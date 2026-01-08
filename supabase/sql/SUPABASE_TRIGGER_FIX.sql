-- FIX: Update the handle_new_user trigger to work with the current schema

-- First, drop the old trigger and function (CASCADE drops dependent triggers automatically)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate the function with proper column handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, is_artist, is_premium, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    false,
    false,
    false
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT 'Trigger fixed successfully!' as status;
