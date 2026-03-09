# CampusTitan Bug Fix Plan — Live Demo Critical Path

## Order of Execution

- [x] 1. SQL RPCs — Fix `steps` → `duration` in all RPC functions (`migration_analytics_rpc.sql`)
- [x] 2. database.js — Fix `addActivity()` camelCase→snake_case mapping (`caloriesBurned` → `calories_burned`)
- [x] 3. AuthContext.js — Already clean (seed imports were removed in prior pass) ✅
- [x] 4. FoodLogScreen.js — Already fixed (save flow uses try/catch correctly) ✅; Fixed `COLORS.white`/`COLORS.border` → valid theme tokens
- [x] 5. AnalyticsService.js — Removed `avgDailySteps`/`totalSteps`, renamed to `avgActivityMinutes`/`totalActiveMinutes`; Fixed calorie calc (food only, not food+activity)
- [x] 6. AnalyticsScreen.js — Updated `avgDailySteps` → `avgActivityMinutes`, label "Avg Steps" → "Avg Min/Day"
- [x] 7. CampusPulseLeaderboardScreen.js — Fixed RPC metric key `avg_steps` → `avg_active_mins` (with fallback); Added missing `gradeColor()` function

## SQL Migration Required
Run `migration_analytics_rpc.sql` in Supabase SQL Editor to deploy the fixed RPCs.
