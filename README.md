# FitFusion (CampusTitan)

Campus wellness and fitness companion built with **Expo / React Native**, backed by a **Flask nutrition API** and a **Python agent service** for natural-language coaching.

## Features

- **Authentication (Supabase)**
  - Email OTP login (request OTP → verify OTP)
  - JWT session support; app sends `Authorization: Bearer <access_token>` to protected backend routes

- **Food scanning (camera → nutrition)**
  - Image capture via `expo-camera`
  - Vision-based food identification + portion estimation (Gemini Vision)
  - USDA FoodData Central lookup for nutrition facts
  - Nutrient density scoring (**NRF9.3**)

- **Health insights (daily summary + caching)**
  - Daily summary endpoint with SQLite-backed caching (`backend/health_cache.sqlite3`)
  - Debug endpoint to inspect cache state (`/api/health-cache/debug`)

- **AI Agent (natural language Q&A + logging)**
  - Ask questions like “Did I eat enough protein today?”
  - Natural language logging (food/activity)
  - Routing + tool execution + response generation via the Python agent service

- **Wellness & community**
  - Wellness circles screen with join links

## Architecture

- **Mobile App (Expo / React Native)**
  - Location: `src/`
  - Key modules:
    - `src/screens/` (UI screens)
    - `src/services/` (`backendAPI`, `AgentService`, `AuthContext`, `supabase`)

- **Flask Backend (Nutrition + Health Summary + Agent Proxy)**
  - Location: `backend/nutrition_server.py`
  - Default port: `5001`
  - Responsibilities:
    - `/api/nutrition/analyze` (image upload → nutrition)
    - `/api/health_summary` (daily summary + cache)
    - `/api/agent/*` proxy routes to Python agent service
    - Supabase JWT verification (JWKS)

- **Python Agent Service (LangGraph-style agent API)**
  - Location: `agent/api.py`
  - Default port: `5002`
  - Endpoints:
    - `POST /agent/query`
    - `POST /agent/log`
    - `GET /agent/quick`

## Tech Stack

- **Frontend**
  - Expo SDK `~54`
  - React `19`
  - `expo-camera`, `expo-secure-store`, `expo-sensors`
  - `axios`, React Navigation
  - Supabase JS `@supabase/supabase-js`

- **Backend / Services**
  - Flask (nutrition server + agent proxy)
  - Python agent service (Flask)
  - SQLite (health summary cache)
  - External APIs: Gemini, USDA

## 🚀 Deployment (Production)
- Cloud Hosting: Render (Microservices for Flask & Agent)

- App Distribution: Expo EAS (Cloud Builds)
The backends are hosted as separate Web Services on Render, and the mobile app is built via Expo EAS.

### 1. Backend Microservices (Render)
* **Agent Service (Port 5002):** * Root Directory: `agent/`
  * Build Command: `pip install -r requirements.txt`
  * Start Command: `python -r api.py`
* **Nutrition API (Port 5001):**
  * Root Directory: `backend/`
  * Build Command: `pip install -r requirements.txt`
  * Start Command: `python nutrition_server.py`
  * **Environment Variables:** Must include `PYTHON_AGENT_URL` pointing to the live Agent Service, and `PYTHON_VERSION` set to `3.12.2` (required to successfully build the `pillow` image library).

### 2. Mobile App (Expo EAS)
To build a production-ready `.apk` or `.ipa` that points to the live Render servers:
1. Ensure your Render and Supabase URLs are set inside the `env` block of your `eas.json` profile.
2. Run the cloud build command:
   ```bash
   eas build -p android --profile preview
## Repo Structure (high-level)

```
.
├── src/                      # Expo app
├── backend/                  # Flask backend + (optional) Node backend
│   ├── nutrition_server.py   # Flask API on :5001
│   └── health_cache.sqlite3  # SQLite cache DB
├── agent/                    # Python agent API on :5002
│   ├── api.py
│   └── requirements.txt
├── nutrition_score.py        # Vision → USDA → NRF9.3 pipeline
├── titan_ml_interface.py     # AI interface wrapper
└── context_engine.py         # Trend summary + prompt assembly for local LLM paths
```

## Environment Variables

### Mobile App (Expo)

Set in your shell, `.env`, or EAS secrets (values depend on your setup):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Optional overrides:

- `EXPO_PUBLIC_BACKEND_URL` (forces backend base URL)
- `EXPO_PUBLIC_NUTRITION_API_URL` (alias override)

### Backend (`backend/.env`)

- `GEMINI_API_KEY`
- `USDA_API_KEY`
- `SUPABASE_URL` (or `EXPO_PUBLIC_SUPABASE_URL`)
- `SUPABASE_JWKS_URL` (optional override)
- `PYTHON_AGENT_URL` (default `http://127.0.0.1:5002`)

### Agent (`agent/api.py`)

- `AGENT_QUERY_TIMEOUT_SECONDS` (default `90`)

## Getting Started (Development)

### 1) Install app dependencies

```bash
npm install
```

### 2) Start the Flask backend (Nutrition API)

From `backend/`:

```bash
python -u nutrition_server.py
```

Expected:

- Backend available at `http://127.0.0.1:5001`
- Health check: `GET /api/health`

### 3) Start the Python agent service

From `agent/`:

```bash
pip install -r requirements.txt
python -u api.py
```

Expected:

- Agent available at `http://127.0.0.1:5002`
- Health check: `GET /health`

### 4) Start Expo

```bash
npm start
```

## Common Troubleshooting

### Backend image upload issues on Windows (`WinError 32`)

The backend saves uploads to **unique temporary files** and cleans up after processing to avoid Windows file-lock collisions.

### Gemini quota / rate-limit

If Gemini quota is exhausted, `/api/nutrition/analyze` returns a clear `429` with details. Use a paid key or wait for quota reset.

### Android networking (emulator vs device)

- Android emulator cannot reach your host at `localhost`; it needs `10.0.2.2`.
- Physical devices must use your machine’s LAN IP.

You can always force a known URL using `EXPO_PUBLIC_BACKEND_URL`.

### Recurring `504` timeouts on agent queries

Timeouts were aligned across:

- Mobile `AgentService`
- Flask proxy (`/api/agent/query`)
- Node forwarder (if used)
- Python agent hard timeout (`AGENT_QUERY_TIMEOUT_SECONDS`)

If you still get `504`, increase `AGENT_QUERY_TIMEOUT_SECONDS` and restart the agent service.

## Security Notes

- Do not ship Supabase service role keys in the client.
- The app uses the Supabase **anon key** on-device and sends the session JWT to backends using the `Authorization` header.

## EAS Build

Profiles are configured in `eas.json`:

- `development`
- `preview`
- `production`
