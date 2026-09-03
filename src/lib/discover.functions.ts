import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  topic: z.string().min(2).max(200),
  track: z.string().max(40).optional(),
});

export type SuggestedTitle = {
  title: string;
  author: string;
  why: string;
};

export const suggestTitles = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Discovery is not configured yet.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You recommend the standard reference books used by Indian competitive exam aspirants. Reply with JSON only: {\"titles\":[{\"title\":string,\"author\":string,\"why\":string}]} with 5 entries, each 'why' under 15 words.",
          },
          {
            role: "user",
            content: `Topic: ${data.topic}${data.track && data.track !== "ALL" ? `\nExam: ${data.track}` : ""}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (response.status === 429) throw new Error("Discovery is busy — try again in a moment.");
    if (response.status === 402) throw new Error("AI credits have run out for this workspace.");
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Discovery failed (${response.status}): ${body.slice(0, 160)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(raw) as { titles?: SuggestedTitle[] };
      return { titles: (parsed.titles ?? []).slice(0, 5) };
    } catch {
      return { titles: [] as SuggestedTitle[] };
    }
  });
