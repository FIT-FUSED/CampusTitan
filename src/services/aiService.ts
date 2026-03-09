import AsyncStorage from "@react-native-async-storage/async-storage";

const COHERE_API_KEY = process.env.EXPO_PUBLIC_COHERE_API_KEY;
const COHERE_CHAT_URL = "https://api.cohere.ai/v1/chat";

const STUDENT_TIP_KEY = "@ai_student_tip_daily";
const ADMIN_INTERVENTION_KEY = "@ai_admin_intervention";

async function callCohere(prompt: string): Promise<string> {
  if (!COHERE_API_KEY) {
    console.warn("Cohere API key missing (EXPO_PUBLIC_COHERE_API_KEY).");
    return "AI tips will appear here once your Cohere API key is configured.";
  }

  try {
    const response = await fetch(COHERE_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${COHERE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "command-r-08-2024",
        message: prompt,
        max_tokens: 220,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.warn("Cohere API error status:", response.status);
      return "AI tips will appear here once the AI service is reachable.";
    }

    const json: any = await response.json();
    const text = json?.text ?? "AI tips will appear here once the AI service responds.";

    return (text + "").trim();
  } catch (e) {
    console.warn("Cohere API call failed:", e);
    return "AI tips will appear here once you’re back online.";
  }
}

async function cacheStudentTip(text: string) {
  try {
    const payload = {
      date: new Date().toISOString().slice(0, 10),
      tip: text,
    };
    await AsyncStorage.setItem(STUDENT_TIP_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("Failed to cache student AI tip:", e);
  }
}

async function getCachedStudentTip(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(STUDENT_TIP_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    return typeof payload?.tip === "string" ? payload.tip : null;
  } catch {
    return null;
  }
}

async function cacheAdminIntervention(text: string) {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      suggestion: text,
    };
    await AsyncStorage.setItem(ADMIN_INTERVENTION_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("Failed to cache admin AI intervention:", e);
  }
}

async function getCachedAdminIntervention(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(ADMIN_INTERVENTION_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    return typeof payload?.suggestion === "string" ? payload.suggestion : null;
  } catch {
    return null;
  }
}

function summarisePastData(pastData: any[]): string {
  if (!Array.isArray(pastData) || !pastData.length) {
    return "No recent check-ins are available.";
  }

  const recent = pastData.slice(0, 3);
  return recent
    .map((entry: any) => {
      const date = entry.date ?? "unknown date";
      const steps = entry.steps ?? 0;
      const sleep = entry.sleepHrs ?? 0;
      const stress = entry.stressLevel ?? "n/a";
      const screen = entry.screenTimeHrs ?? 0;
      const productivity = entry.productivity ?? "n/a";
      return `- ${date}: steps=${steps}, sleep=${sleep}h, stress=${stress}/10, screen=${screen}h, productivity=${productivity}/100`;
    })
    .join("\n");
}

export async function generateStudentActionPlan(
  pastData: any[],
  environment: { zone?: string; noise?: string; crowding?: string } | null,
): Promise<string> {
  const cached = await getCachedStudentTip();

  const envZone = environment?.zone ?? "Central Library";
  const envNoise = environment?.noise ?? "40dB";
  const envCrowding = environment?.crowding ?? "20%";

  // We inject both behavioural logs and the current simulated campus
  // environment so the model can ground its advice in real campus spaces.
  const prompt = `
You are an empathetic campus wellness coach for MNNIT students.

Recent 3 days of student wellness logs:
${summarisePastData(pastData)}

Current simulated campus environment:
- active_zone: ${envZone}
- noise_level: ${envNoise}
- crowding: ${envCrowding}

Write EXACTLY two sentences of a highly personalised, actionable wellness tip.
Reference MNNIT campus spaces (hostel, mess, gym, library) when it helps.
Avoid generic platitudes. Keep the tone encouraging and specific.
`;

  const result = await callCohere(prompt);
  const tip = (result || "").trim();

  if (!tip && cached) {
    return cached;
  }

  if (tip) {
    await cacheStudentTip(tip);
    return tip;
  }

  return (
    cached ??
    "AI tips will appear here once you’ve logged a few check-ins and are online."
  );
}

export async function generateAdminInterventions(
  campusAverages: any,
): Promise<string> {
  const cached = await getCachedAdminIntervention();

  const summary = JSON.stringify(campusAverages ?? {}, null, 2);

  // Only aggregate, anonymised campus-level stats are sent here — never any
  // individual student identifiers. The prompt is steered to suggest one
  // operational change for administrators, not personal advice.
  const prompt = `
You are a university administrator at MNNIT reviewing anonymised campus wellness analytics.

Aggregate campus metrics (JSON-style summary):
${summary}

Based on these patterns (e.g., MSE 2nd-year stress spikes, Hostel 4 low protein intake,
and gym over-capacity at evenings), propose ONE concrete operational intervention
the university should take. Write it as a short, direct recommendation (2–3 sentences)
addressed to administrators, not students.
`;

  const result = await callCohere(prompt);
  const suggestion = (result || "").trim();

  if (!suggestion && cached) {
    return cached;
  }

  if (suggestion) {
    await cacheAdminIntervention(suggestion);
    return suggestion;
  }

  return (
    cached ??
    "AI operational insights will appear here once campus analytics and the AI service are available."
  );
}

const aiService = {
  generateStudentActionPlan,
  generateAdminInterventions,
};

export default aiService;

