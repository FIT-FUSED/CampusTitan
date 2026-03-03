# FitFusion — Campus Wellness & Fitness Tracker

A React Native (Expo) app for campus wellness: nutrition, activity, mood, environment, and step tracking.

## Features

- 🍎 **Nutrition**
  - Food logging with macro tracking
  - Barcode scanner for quick entry
  - Daily calorie and macro goals

- 🏃 **Activity**
  - Manual workout logging
  - Calorie burn estimation
  - Weekly activity sparkline

- 😊 **Mood & Journal**
  - Daily mood check-ins
  - Personal journal entries

- 👟 **Steps**
  - Real-time step tracking (with permission handling)
  - On-demand step increment for Expo Go compatibility

- 🌍 **Environment**
  - Campus AQI, temperature, humidity, noise
  - Health recommendations based on conditions

## Tech Stack

- **Frontend:** React Native, Expo (~54), Expo Router, Expo Sensors, Expo Secure Store
- **Backend:** Node.js, Express, SQLite
- **UI:** Custom theme, expo-linear-gradient, expo-blur

## Development

### Prerequisites
- Node.js (npm)
- Expo CLI
- Expo Go or EAS Dev Client

### Quick Start

```bash
npm install
npm start          # Expo Go


### Step Tracking Notes

- **Expo Go:** Physical Activity permission may not prompt; steps increment on tap is used as fallback.
- **Dev Client:** Full native permission prompt and live pedometer updates.
- **SensorService** handles both modes gracefully.

## Project Structure

```
src/
├── components/
│   └── common/
├── screens/
│   ├── auth/
│   ├── fitness/
│   ├── home/
│   ├── nutrition/
│   ├── profile/
│   └── wellness/
├── services/
│   ├── AuthContext.js
│   ├── SensorService.js
│   ├── database.js
│   └── config.js
├── navigation/
├── theme/
└── data/
```

## License

MIT
