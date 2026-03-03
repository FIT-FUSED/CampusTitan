// Seed data for FitFusion
import { format, subDays } from 'date-fns';

const today = new Date();

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Same hash as auth service — needed for demo login
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}
const DEMO_HASH = simpleHash('demo123');

// Campus metadata
export const HOSTELS = ['Hostel A', 'Hostel B', 'Hostel C', 'Hostel D', 'Hostel E'];
export const DEPARTMENTS = ['Computer Science', 'Mechanical', 'Electrical', 'Civil', 'Electronics'];
export const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
export const CAMPUS_ZONES = ['Main Ground', 'Sports Complex', 'Gym', 'Library Area', 'Food Court', 'Academic Block'];

// Sample users
export const SAMPLE_USERS = [
    {
        id: 'user_1',
        name: 'Arjun Sharma',
        email: 'arjun@campus.edu',
        passwordHash: DEMO_HASH,
        age: 20,
        gender: 'Male',
        height: 175,
        weight: 70,
        fitnessLevel: 'intermediate',
        dietaryPreferences: 'Vegetarian',
        hostel: 'Hostel A',
        department: 'Computer Science',
        year: '2nd Year',
        role: 'student',
        avatarColor: '#6C5CE7',
    },
    {
        id: 'user_2',
        name: 'Priya Patel',
        email: 'priya@campus.edu',
        passwordHash: DEMO_HASH,
        age: 21,
        gender: 'Female',
        height: 162,
        weight: 55,
        fitnessLevel: 'beginner',
        dietaryPreferences: 'Non-Vegetarian',
        hostel: 'Hostel C',
        department: 'Electronics',
        year: '3rd Year',
        role: 'student',
        avatarColor: '#00CEC9',
    },
    {
        id: 'admin_1',
        name: 'Dr. Admin Kumar',
        email: 'admin@campus.edu',
        passwordHash: DEMO_HASH,
        age: 35,
        gender: 'Male',
        height: 178,
        weight: 80,
        fitnessLevel: 'intermediate',
        dietaryPreferences: 'Vegetarian',
        hostel: 'Faculty Quarters',
        department: 'Administration',
        year: 'Staff',
        role: 'admin',
        avatarColor: '#FF6B6B',
    },
];

// Food database
export const FOOD_DATABASE = [
    // Breakfast items
    { name: 'Poha', calories: 250, protein: 5, carbs: 45, fat: 6, category: 'breakfast', isVeg: true },
    { name: 'Idli Sambar (4 pcs)', calories: 300, protein: 8, carbs: 55, fat: 4, category: 'breakfast', isVeg: true },
    { name: 'Paratha with Curd', calories: 350, protein: 10, carbs: 45, fat: 14, category: 'breakfast', isVeg: true },
    { name: 'Bread Omelette', calories: 320, protein: 15, carbs: 30, fat: 16, category: 'breakfast', isVeg: false },
    { name: 'Upma', calories: 220, protein: 6, carbs: 38, fat: 7, category: 'breakfast', isVeg: true },
    { name: 'Cornflakes with Milk', calories: 280, protein: 8, carbs: 50, fat: 4, category: 'breakfast', isVeg: true },
    // Lunch items
    { name: 'Rice + Dal + Sabzi', calories: 450, protein: 12, carbs: 75, fat: 8, category: 'lunch', isVeg: true },
    { name: 'Roti + Paneer Curry', calories: 500, protein: 18, carbs: 50, fat: 22, category: 'lunch', isVeg: true },
    { name: 'Chicken Biryani', calories: 550, protein: 25, carbs: 65, fat: 18, category: 'lunch', isVeg: false },
    { name: 'Rajma Chawal', calories: 480, protein: 15, carbs: 70, fat: 10, category: 'lunch', isVeg: true },
    { name: 'Chole Bhature', calories: 600, protein: 14, carbs: 72, fat: 28, category: 'lunch', isVeg: true },
    // Snacks
    { name: 'Samosa (2 pcs)', calories: 300, protein: 5, carbs: 35, fat: 16, category: 'snack', isVeg: true },
    { name: 'Tea + Biscuits', calories: 150, protein: 2, carbs: 25, fat: 5, category: 'snack', isVeg: true },
    { name: 'Coffee', calories: 80, protein: 1, carbs: 12, fat: 3, category: 'snack', isVeg: true },
    { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0, category: 'snack', isVeg: true },
    { name: 'Protein Bar', calories: 200, protein: 20, carbs: 22, fat: 8, category: 'snack', isVeg: true },
    { name: 'Maggi Noodles', calories: 350, protein: 8, carbs: 45, fat: 15, category: 'snack', isVeg: true },
    // Dinner items
    { name: 'Roti + Mixed Veg', calories: 400, protein: 10, carbs: 55, fat: 12, category: 'dinner', isVeg: true },
    { name: 'Egg Curry + Rice', calories: 480, protein: 18, carbs: 60, fat: 16, category: 'dinner', isVeg: false },
    { name: 'Dal Fry + Jeera Rice', calories: 420, protein: 14, carbs: 65, fat: 10, category: 'dinner', isVeg: true },
    { name: 'Chicken Curry + Roti', calories: 520, protein: 28, carbs: 45, fat: 20, category: 'dinner', isVeg: false },
    { name: 'Dosa + Chutney', calories: 350, protein: 8, carbs: 50, fat: 12, category: 'dinner', isVeg: true },
];

// Generate food logs for past 30 days
export function generateFoodLogs(userId) {
    const logs = [];
    for (let d = 0; d < 30; d++) {
        const date = format(subDays(today, d), 'yyyy-MM-dd');
        const meals = ['breakfast', 'lunch', 'dinner'];
        meals.forEach(mealType => {
            const options = FOOD_DATABASE.filter(f => f.category === mealType);
            const food = options[randomBetween(0, options.length - 1)];
            logs.push({
                id: `food_${userId}_${d}_${mealType}`,
                userId,
                date,
                mealType,
                foodName: food.name,
                calories: food.calories + randomBetween(-30, 30),
                protein: food.protein + randomBetween(-2, 2),
                carbs: food.carbs + randomBetween(-5, 5),
                fat: food.fat + randomBetween(-2, 2),
                portion: 1,
                isVeg: food.isVeg,
            });
        });
        // Random snack
        if (Math.random() > 0.3) {
            const snacks = FOOD_DATABASE.filter(f => f.category === 'snack');
            const snack = snacks[randomBetween(0, snacks.length - 1)];
            logs.push({
                id: `food_${userId}_${d}_snack`,
                userId,
                date,
                mealType: 'snack',
                foodName: snack.name,
                calories: snack.calories,
                protein: snack.protein,
                carbs: snack.carbs,
                fat: snack.fat,
                portion: 1,
                isVeg: snack.isVeg,
            });
        }
    }
    return logs;
}

// Generate activities for past 30 days
export function generateActivities(userId) {
    const activities = [];
    const types = ['gym', 'running', 'cycling', 'sports', 'yoga', 'walking'];
    for (let d = 0; d < 30; d++) {
        if (Math.random() > 0.35) { // ~65% days have activity
            const date = format(subDays(today, d), 'yyyy-MM-dd');
            const type = types[randomBetween(0, types.length - 1)];
            const duration = randomBetween(20, 90);
            const caloriesBurned = Math.floor(duration * randomBetween(5, 12));
            activities.push({
                id: `act_${userId}_${d}`,
                userId,
                date,
                type,
                duration,
                caloriesBurned,
                details: type === 'gym' ? {
                    exercises: [
                        { name: 'Bench Press', sets: 3, reps: 12, weight: randomBetween(30, 80) },
                        { name: 'Squats', sets: 4, reps: 10, weight: randomBetween(40, 100) },
                        { name: 'Deadlift', sets: 3, reps: 8, weight: randomBetween(60, 120) },
                    ]
                } : type === 'running' ? {
                    distance: (duration * randomBetween(8, 12) / 60).toFixed(1),
                    pace: `${randomBetween(5, 8)}:${randomBetween(10, 59)} /km`,
                } : {},
                zone: CAMPUS_ZONES[randomBetween(0, CAMPUS_ZONES.length - 1)],
            });
        }
    }
    return activities;
}

// Generate mood logs for past 30 days
export function generateMoodLogs(userId) {
    const logs = [];
    const notes = [
        'Feeling energetic after morning workout!',
        'Stressed about exams, need to relax.',
        'Had a great day with friends.',
        'Feeling tired, didn\'t sleep well.',
        'Productive day, completed assignments.',
        'Rainy day, stayed indoors.',
        'Excited about upcoming fest!',
        'Need to focus more on studies.',
        'Great gym session today.',
        'Feeling calm after meditation.',
    ];
    for (let d = 0; d < 30; d++) {
        const date = format(subDays(today, d), 'yyyy-MM-dd');
        logs.push({
            id: `mood_${userId}_${d}`,
            userId,
            date,
            mood: randomBetween(1, 5),
            note: notes[randomBetween(0, notes.length - 1)],
            time: `${randomBetween(8, 22)}:${randomBetween(0, 59).toString().padStart(2, '0')}`,
        });
    }
    return logs;
}

// Generate journals
export function generateJournals(userId) {
    const entries = [
        { title: 'My Fitness Journey Begins', body: 'Today I decided to take my fitness seriously. Started with a light jog around the campus and it felt amazing. The weather was perfect and I met a few friends who want to join too. Looking forward to making this a regular habit.' },
        { title: 'Meal Prep Sunday', body: 'Spent the afternoon planning my meals for the week. The mess food is decent but I want to track what I eat more carefully. Going to supplement with fruits and protein shakes.' },
        { title: 'Exam Stress & Wellness', body: 'Midterms are approaching and I can feel the stress building up. Took a break for yoga today and it really helped. Need to remember that mental health is just as important as physical fitness.' },
        { title: 'Sports Day Excitement', body: 'Inter-hostel sports competition is next week! Our team has been practicing cricket every evening. The camaraderie and teamwork feel incredible.' },
        { title: 'Reflection on Progress', body: 'It\'s been two weeks since I started tracking everything. I can already see patterns in my eating habits and activity levels. The data doesn\'t lie - I need more protein and better sleep.' },
    ];
    return entries.map((entry, i) => ({
        id: `journal_${userId}_${i}`,
        userId,
        title: entry.title,
        body: entry.body,
        date: format(subDays(today, i * 5), 'yyyy-MM-dd'),
        mood: randomBetween(3, 5),
    }));
}

// Generate environmental data for past 7 days
export function generateEnvData() {
    const data = [];
    for (let d = 0; d < 7; d++) {
        const date = format(subDays(today, d), 'yyyy-MM-dd');
        data.push({
            id: `env_${d}`,
            date,
            aqi: randomBetween(50, 200),
            aqiCategory: randomBetween(50, 100) < 70 ? 'Moderate' : 'Unhealthy for Sensitive Groups',
            temperature: randomBetween(22, 38),
            humidity: randomBetween(40, 80),
            rainfall: Math.random() > 0.7 ? randomBetween(1, 20) : 0,
            noiseLevel: randomBetween(40, 85),
            crowdDensity: randomBetween(20, 90),
            windSpeed: randomBetween(5, 25),
            uvIndex: randomBetween(3, 11),
            zones: CAMPUS_ZONES.reduce((acc, zone) => {
                acc[zone] = {
                    crowdDensity: randomBetween(15, 95),
                    noiseLevel: randomBetween(35, 80),
                };
                return acc;
            }, {}),
        });
    }
    return data;
}

// Wellness circles
export const WELLNESS_CIRCLES = [
    { id: 'wc_1', name: 'Morning Meditation', description: 'Start your day with 15 min of guided meditation', schedule: 'Daily 6:30 AM', location: 'Yoga Hall', participants: 24, maxParticipants: 40, category: 'Meditation' },
    { id: 'wc_2', name: 'Stress-Free Study Group', description: 'Study together with wellness breaks every hour', schedule: 'Mon, Wed, Fri 5 PM', location: 'Library Room 3', participants: 15, maxParticipants: 20, category: 'Study' },
    { id: 'wc_3', name: 'Sunset Yoga', description: 'Unwind with relaxing yoga as the sun sets', schedule: 'Tue, Thu 6 PM', location: 'Main Ground', participants: 30, maxParticipants: 50, category: 'Yoga' },
    { id: 'wc_4', name: 'Running Club', description: 'Group running sessions for all fitness levels', schedule: 'Daily 5:30 AM', location: 'Sports Complex', participants: 18, maxParticipants: 30, category: 'Running' },
    { id: 'wc_5', name: 'Nutrition Workshop', description: 'Learn about balanced diet and meal planning', schedule: 'Every Saturday 10 AM', location: 'Seminar Hall', participants: 35, maxParticipants: 60, category: 'Nutrition' },
];

// Generate campus analytics (anonymized)
export function generateCampusAnalytics() {
    const hostelStats = HOSTELS.map(hostel => ({
        hostel,
        avgDailySteps: randomBetween(4000, 10000),
        avgCaloriesConsumed: randomBetween(1800, 2500),
        avgActivityMinutes: randomBetween(20, 60),
        avgMoodScore: (randomBetween(28, 42) / 10).toFixed(1),
        participationRate: randomBetween(30, 85),
        activeUsers: randomBetween(40, 120),
    }));

    const departmentStats = DEPARTMENTS.map(dept => ({
        department: dept,
        avgActivityMinutes: randomBetween(15, 55),
        participationRate: randomBetween(25, 75),
        topActivity: ['gym', 'running', 'sports', 'yoga', 'cycling'][randomBetween(0, 4)],
    }));

    const weeklyTrends = Array.from({ length: 7 }, (_, i) => ({
        day: format(subDays(today, 6 - i), 'EEE'),
        date: format(subDays(today, 6 - i), 'yyyy-MM-dd'),
        totalActivities: randomBetween(50, 200),
        avgMood: (randomBetween(30, 45) / 10).toFixed(1),
        avgCalories: randomBetween(1800, 2400),
    }));

    return { hostelStats, departmentStats, weeklyTrends };
}
