# Dietary Preference Implementation

## Overview
Added dietary preference selection (Vegetarian, Non-Vegetarian, Vegan) to the signup process and database storage.

## Changes Made

### 1. Frontend (RegisterScreen.js)
- Added `DIETARY_PREFERENCES = ["Vegetarian", "Non-Vegetarian", "Vegan"]` constant
- Added `dietaryPreferences: "Vegetarian"` to form state with default value
- Added `showDietaryPicker` modal state
- Added dietary preference picker UI in Step 3 (Body Metrics section)
- Added modal for selecting dietary preference

### 2. Auth Service (auth.js)
- Added `dietary_preferences: userData.dietaryPreferences` to Supabase auth metadata
- Added `dietary_preferences: userData.dietaryPreferences` to users table insert
- Added fallback handling in `getCurrentUser()` for dietary preferences

### 3. Database Schema
- Created migration file: `migration_add_dietary_preferences.sql`
- Adds `dietary_preferences TEXT DEFAULT 'Vegetarian'` column to users table

## User Flow
1. User goes through 3-step signup process
2. In Step 3 (Body Metrics), after selecting height/weight/gender, user sees:
   - "Dietary Preference" picker button with 🥗 icon
   - Shows current selection (default: Vegetarian)
   - Opens modal with three options: Vegetarian, Non-Vegetarian, Vegan
3. Selection is stored in form state and sent to backend during registration
4. Value is saved in both Supabase auth metadata and users table

## Field Names
- Frontend form: `dietaryPreferences` (camelCase)
- Database column: `dietary_preferences` (snake_case)
- Auth metadata: `dietary_preferences` (snake_case)

## Testing
Test the complete signup flow:
1. Go through all 3 signup steps
2. Verify dietary preference picker appears in Step 3
3. Select different dietary preferences
4. Complete registration and verify data is saved correctly

## Notes
- Default value is "Vegetarian" for backward compatibility
- Field is optional but recommended for better nutrition recommendations
- Integrates with existing nutrition planning and meal suggestion features
