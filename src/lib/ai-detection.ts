const HF_MODEL_ID = "fakespot-ai/roberta-base-ai-text-detection-v1";

type HfLabelScore = {
  label: string;
  score: number;
};

export type AiDetectionResult = {
  model: string;
  label: string;
  score: number;
  isLikelyAI: boolean;
  summary: string;
};

function normalizeLabel(value: string): string {
  const upper = value.toUpperCase();
  if (upper.includes("FAKE") || upper.includes("AI") || upper === "LABEL_1") {
    return "AI-generated";
  }
  if (upper.includes("REAL") || upper.includes("HUMAN") || upper === "LABEL_0") {
    return "Human-written";
  }
  return value;
}

function parseCandidates(payload: unknown): HfLabelScore[] {
  if (!Array.isArray(payload)) return [];

  // Common HF shape: [{ label, score }, ...]
  if (
    payload.length > 0 &&
    typeof payload[0] === "object" &&
    payload[0] !== null &&
    "label" in (payload[0] as Record<string, unknown>) &&
    "score" in (payload[0] as Record<string, unknown>)
  ) {
    return (payload as Array<Record<string, unknown>>)
      .map((item) => ({
        label: String(item.label ?? "unknown"),
        score: Number(item.score ?? 0),
      }))
      .filter((item) => Number.isFinite(item.score));
  }

  // Alternate HF shape: [[{ label, score }, ...]]
  if (Array.isArray(payload[0])) {
    return parseCandidates(payload[0]);
  }

  return [];
}

export async function detectAiText(content: string): Promise<AiDetectionResult> {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) {
    throw new Error("Missing HUGGINGFACE_API_TOKEN environment variable");
  }

  const fullText = content.trim();
  if (!fullText) {
    throw new Error("No content provided for AI detection");
  }

  const encodedModel = encodeURIComponent(HF_MODEL_ID);
  const endpoints = [
    `https://router.huggingface.co/hf-inference/models/${HF_MODEL_ID}`,
    `https://router.huggingface.co/hf-inference/models/${encodedModel}`,
  ];

  const candidateInputs = [
    fullText.slice(0, 1800),
    fullText.slice(0, 1200),
    fullText.slice(0, 900),
    fullText.slice(0, 700),
  ].filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);

  let payload: unknown = null;
  let lastError = "Unknown inference error";
  let gotSuccess = false;

  for (const inputText of candidateInputs) {
    let shouldTryShorterInput = false;

    for (const endpoint of endpoints) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: inputText }),
      });

      const raw = await response.text();
      try {
        payload = JSON.parse(raw) as unknown;
      } catch {
        payload = raw;
      }

      if (response.ok) {
        gotSuccess = true;
        break;
      }

      const lowerRaw = String(raw).toLowerCase();
      shouldTryShorterInput =
        response.status === 400 &&
        (lowerRaw.includes("tensor") || lowerRaw.includes("target sizes") || lowerRaw.includes("size mismatch"));

      lastError = `Hugging Face inference failed (${response.status}): ${String(raw).slice(0, 220)}`;
    }

    if (gotSuccess) {
      break;
    }

    if (!shouldTryShorterInput) {
      break;
    }
  }

  if (!gotSuccess || !Array.isArray(payload)) {
    throw new Error(lastError);
  }

  const candidates = parseCandidates(payload).sort((a, b) => b.score - a.score);
  const top = candidates[0];

  if (!top) {
    throw new Error("Unexpected Hugging Face response format");
  }

  const normalized = normalizeLabel(top.label);
  const isLikelyAI = normalized === "AI-generated";
  const confidence = Math.round(top.score * 100);
  const summary = `${normalized} (${confidence}% confidence)`;

  return {
    model: HF_MODEL_ID,
    label: normalized,
    score: top.score,
    isLikelyAI,
    summary,
  };
}
