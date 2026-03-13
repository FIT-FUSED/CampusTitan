-- Check if dietary_preferences column exists in users table
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'dietary_preferences';

-- If no results, the column doesn't exist and you need to run the migration
-- If results appear, the column already exists
