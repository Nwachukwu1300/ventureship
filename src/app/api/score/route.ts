import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const PILLAR_NAMES = [
  "Analytical Rigour",
  "Commercial Acumen",
  "Quality of Output",
  "Communication",
  "Initiative and Ownership",
] as const;

type PillarName = (typeof PILLAR_NAMES)[number];

type PillarScore = {
  name: PillarName;
  score: number;
  feedback: string;
};

type ScoreResponse =
  | { ok: true; pillars: PillarScore[] }
  | { ok: false; error: string };

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function validateResponse(data: unknown): ScoreResponse {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Response is not an object" };
  }

  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.pillars)) {
    return { ok: false, error: "Response missing pillars array" };
  }

  if (obj.pillars.length !== 5) {
    return { ok: false, error: `Expected 5 pillars, got ${obj.pillars.length}` };
  }

  const pillars: PillarScore[] = [];

  for (let i = 0; i < PILLAR_NAMES.length; i++) {
    const expectedName = PILLAR_NAMES[i];
    const pillar = obj.pillars[i] as Record<string, unknown>;

    if (!pillar || typeof pillar !== "object") {
      return { ok: false, error: `Pillar ${i + 1} is not an object` };
    }

    if (pillar.name !== expectedName) {
      return { ok: false, error: `Pillar ${i + 1} should be "${expectedName}", got "${pillar.name}"` };
    }

    if (typeof pillar.score !== "number" || pillar.score < 0 || pillar.score > 20) {
      return { ok: false, error: `Pillar "${expectedName}" score must be 0-20, got ${pillar.score}` };
    }

    if (typeof pillar.feedback !== "string" || pillar.feedback.trim() === "") {
      return { ok: false, error: `Pillar "${expectedName}" feedback must be a non-empty string` };
    }

    pillars.push({
      name: expectedName,
      score: pillar.score,
      feedback: pillar.feedback,
    });
  }

  return { ok: true, pillars };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const submissionText = body.submissionText;

    if (!submissionText || typeof submissionText !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing submissionText in request body" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Server configuration error: missing API key" },
        { status: 502 }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are scoring a candidate submission for a professional assessment. Score the following submission across five pillars. Each pillar is scored from 0 to 20.

The five pillars are:
1. Analytical Rigour
2. Commercial Acumen
3. Quality of Output
4. Communication
5. Initiative and Ownership

SUBMISSION:
${submissionText}

Respond with ONLY valid JSON, no markdown, no explanation, no text before or after. Use this exact structure:
{"pillars":[{"name":"Analytical Rigour","score":0,"feedback":"..."},{"name":"Commercial Acumen","score":0,"feedback":"..."},{"name":"Quality of Output","score":0,"feedback":"..."},{"name":"Communication","score":0,"feedback":"..."},{"name":"Initiative and Ownership","score":0,"feedback":"..."}]}

Replace the scores with your assessment (0-20) and feedback with 1-2 sentences explaining the score.`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { ok: false, error: "Claude returned no text response" },
        { status: 502 }
      );
    }

    const rawText = textBlock.text;
    const cleanedText = stripMarkdownFences(rawText);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      return NextResponse.json(
        { ok: false, error: `Failed to parse Claude response as JSON: ${cleanedText.slice(0, 100)}...` },
        { status: 502 }
      );
    }

    const validated = validateResponse(parsed);
    if (!validated.ok) {
      return NextResponse.json(validated, { status: 502 });
    }

    return NextResponse.json(validated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `API error: ${message}` },
      { status: 502 }
    );
  }
}
