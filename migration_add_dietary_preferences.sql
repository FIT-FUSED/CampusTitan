-- Add dietary preferences column to users table
-- This migration adds the dietary_preferences field to the users table in Supabase

ALTER TABLE users 
ADD COLUMN dietary_preferences TEXT DEFAULT 'Vegetarian';

-- Add comment for documentation
COMMENT ON COLUMN users.dietary_preferences IS 'User dietary preference: Vegetarian, Non-Vegetarian, or Vegan';
