// Analytics Service - Real Campus Data Aggregation
import db from './database';

class AnalyticsService {
  async getCampusAnalytics() {
    try {
      console.log('📊 Analytics: Starting campus analytics calculation');
      
      // Get all users with their college info
      const { data: users, error: usersError } = await db.supabase
        .from('users')
        .select('id, name, college, height, weight, age, gender');

      if (usersError || !users) {
        console.error('Analytics: Failed to fetch users', usersError);
        return { collegeStats: [], weeklyTrends: [] };
      }

      console.log('📊 Analytics: Found users:', users.length);
      console.log('📊 Analytics: User colleges:', [...new Set(users.map(u => u.college))]);

      // Group users by college
      const collegeGroups = users.reduce((acc, user) => {
        if (!user.college) return acc;
        if (!acc[user.college]) acc[user.college] = [];
        acc[user.college].push(user);
        return acc;
      }, {});

      console.log('📊 Analytics: College groups:', Object.keys(collegeGroups).length, 'colleges');

      // Calculate analytics for each college
      const collegeStats = await Promise.all(
        Object.entries(collegeGroups).map(async ([college, collegeUsers]) => {
          const analytics = await this.calculateCollegeAnalytics(college, collegeUsers);
          return {
            college,
            ...analytics
          };
        })
      );

      // Get weekly trends (last 7 days)
      console.log('📊 Analytics: Calculating weekly trends');
      const weeklyTrends = await this.getWeeklyTrends();
      console.log('📊 Analytics: Weekly trends calculated:', weeklyTrends.length, 'days');

      return { collegeStats, weeklyTrends };
    } catch (error) {
      console.error('Analytics: Error calculating campus analytics', error);
      return { collegeStats: [], weeklyTrends: [] };
    }
  }

  async calculateCollegeAnalytics(college, users) {
    try {
      let totalFoodCalories = 0;
      let totalActivityMinutes = 0;
      let totalMoodScore = 0;
      let moodCount = 0;
      let activeUsersCount = 0;
      const activityTypes = {};

      // Calculate metrics for all users in this college
      for (const user of users) {
        // Activity data
        const activities = await db.getActivities(user.id);
        if (activities.length > 0) {
          activeUsersCount++;
          const userMinutes = activities.reduce((sum, act) => sum + (act.duration || 0), 0);
          totalActivityMinutes += userMinutes;

          // Track activity types
          activities.forEach(act => {
            if (act.type) {
              activityTypes[act.type] = (activityTypes[act.type] || 0) + 1;
            }
          });
        }

        // Food data (only food calories, not activity calories)
        const foodLogs = await db.getFoodLogs(user.id);
        const foodCalories = foodLogs.reduce((sum, food) => sum + (food.calories || 0), 0);
        totalFoodCalories += foodCalories;

        // Mood data
        const moodLogs = await db.getMoodLogs(user.id);
        if (moodLogs.length > 0) {
          const userAvgMood = moodLogs.reduce((sum, mood) => sum + (mood.mood || 0), 0) / moodLogs.length;
          totalMoodScore += userAvgMood;
          moodCount++;
        }
      }

      const totalUsers = users.length;
      const activeUsers = activeUsersCount;
      const participationRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

      // Calculate averages
      const avgActivityMinutes = activeUsers > 0 ? Math.round(totalActivityMinutes / activeUsers) : 0;
      const avgCaloriesConsumed = totalUsers > 0 ? Math.round(totalFoodCalories / totalUsers) : 0;
      const avgMoodScore = moodCount > 0 ? (totalMoodScore / moodCount).toFixed(1) : '0.0';

      // Find top activity
      const topActivity = Object.entries(activityTypes)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

      return {
        avgActivityMinutes,
        avgCaloriesConsumed,
        avgMoodScore,
        participationRate: Math.round(participationRate),
        activeUsers,
        topActivity
      };
    } catch (error) {
      console.error(`Analytics: Error calculating analytics for college`, error);
      return {
        avgActivityMinutes: 0,
        avgCaloriesConsumed: 0,
        avgMoodScore: '0.0',
        participationRate: 0,
        activeUsers: 0,
        topActivity: 'None'
      };
    }
  }

  async getWeeklyTrends() {
    try {
      const trends = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Get all activities for this date
        const { data: activities } = await db.supabase
          .from('activities')
          .select('duration, calories_burned')
          .eq('date', dateStr);

        // Get all mood logs for this date
        const { data: moods } = await db.supabase
          .from('mood_logs')
          .select('mood')
          .eq('date', dateStr);

        // Get all food logs for this date
        const { data: foods } = await db.supabase
          .from('food_logs')
          .select('calories')
          .eq('date', dateStr);

        const totalActivities = activities?.length || 0;
        const totalActiveMinutes = activities && activities.length > 0
          ? activities.reduce((sum, a) => sum + (a.duration || 0), 0)
          : 0;

        const avgMood = moods && moods.length > 0 
          ? (moods.reduce((sum, m) => sum + (m.mood || 0), 0) / moods.length).toFixed(1)
          : '0.0';

        const avgCalories = foods && foods.length > 0
          ? Math.round(foods.reduce((sum, f) => sum + (f.calories || 0), 0) / foods.length)
          : 0;

        trends.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: dateStr,
          totalActivities,
          totalActiveMinutes,
          avgMood,
          avgCalories
        });
      }

      return trends;
    } catch (error) {
      console.error('Analytics: Error getting weekly trends', error);
      return [];
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
