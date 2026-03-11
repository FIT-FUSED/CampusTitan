// Analytics Service - Uses Supabase RPC functions (SECURITY DEFINER) to bypass RLS
// and aggregate campus-wide data safely.
import { supabase } from './supabase';

class AnalyticsService {
  async getCampusAnalytics() {
    try {
      console.log('📊 Analytics: Fetching campus analytics via RPCs');

      // ── 1. Campus overview (college-level stats) ──
      const { data: overview, error: overviewErr } = await supabase.rpc(
        'get_campus_overview'
      );

      if (overviewErr) {
        console.error('Analytics: get_campus_overview RPC failed', overviewErr);
        return { collegeStats: [], weeklyTrends: [] };
      }

      console.log('📊 Analytics: Campus overview rows:', overview?.length);

      const collegeStats = (overview || []).map((row) => {
        const totalUsers = Number(row.total_users) || 0;
        const totalActivities = Number(row.total_activities) || 0;
        // activeUsers approximation: colleges that have at least some activities
        const activeUsers = totalActivities > 0 ? totalUsers : 0;
        const participationRate =
          totalUsers > 0
            ? Math.round((activeUsers / totalUsers) * 100)
            : 0;

        return {
          college: row.college || 'Unknown',
          avgActivityMinutes: Math.round(Number(row.avg_duration_per_user) || 0),
          avgCaloriesConsumed: Math.round(Number(row.avg_calories_per_user) || 0),
          avgMoodScore: row.avg_mood_per_user
            ? Number(row.avg_mood_per_user).toFixed(1)
            : '0.0',
          participationRate,
          activeUsers,
          topActivity: 'gym', // RPC doesn't return this; default placeholder
        };
      });

      // ── 2. Weekly trends (last 7 days) ──
      const { data: trends, error: trendsErr } = await supabase.rpc(
        'get_weekly_trends'
      );

      if (trendsErr) {
        console.error('Analytics: get_weekly_trends RPC failed', trendsErr);
      }

      console.log('📊 Analytics: Weekly trends rows:', trends?.length);

      // Build a map of existing trend data keyed by date string
      const trendMap = {};
      (trends || []).forEach((row) => {
        trendMap[row.date] = row;
      });

      // Always produce 7 days so the chart is never empty
      const weeklyTrends = [];
      const today = new Date();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const match = trendMap[dateStr];
        weeklyTrends.push({
          day: dayNames[d.getDay()],
          date: dateStr,
          totalActivities: match ? Number(match.total_duration) || 0 : 0,
          totalActiveMinutes: match ? Number(match.total_duration) || 0 : 0,
          avgMood: match && match.avg_mood
            ? Number(match.avg_mood).toFixed(1)
            : '0.0',
          avgCalories: match ? Math.round(Number(match.total_calories) || 0) : 0,
        });
      }

      return { collegeStats, weeklyTrends };
    } catch (error) {
      console.error('Analytics: Error fetching campus analytics', error);
      return { collegeStats: [], weeklyTrends: [] };
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
