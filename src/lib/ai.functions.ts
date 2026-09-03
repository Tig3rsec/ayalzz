import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AskInput = z.object({
  question: z.string().min(2).max(1000),
  context: z.string().max(6000).optional(),
  mode: z.enum(["ask", "explain", "quiz", "plan"]).default("ask"),
});

const MODE_PROMPT: Record<string, string> = {
  ask: "Answer the learner's question directly and concisely (max ~140 words).",
  explain:
    "Explain the topic from first principles for an exam aspirant: a short definition, 3-4 key points, one memory hook, and one likely exam angle.",
  quiz: "Write 5 exam-style multiple-choice questions (4 options each) on the topic, then an 'Answers' line with the correct options and one-line reasons.",
  plan: "Produce a focused study plan: day-by-day or session-by-session, with chapters/topics and revision checkpoints. Keep it under 180 words.",
};

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("The study assistant is not configured yet.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: [
              "You are Ayal's study assistant for Indian competitive exams (TNPSC, NEET, UPSC, SSC, RRB).",
              "Tone: calm, scholarly, practical. Use short markdown-free paragraphs and simple dashes for lists.",
              "Ground your answers in the books listed from the learner's shelf whenever they are relevant, and name the book you are pointing to.",
              MODE_PROMPT[data.mode] ?? MODE_PROMPT["ask"],
            ].join(" "),
          },
          {
            role: "user",
            content: data.context
              ? `Books currently on the shelf:\n${data.context}\n\nRequest: ${data.question}`
              : data.question,
          },
        ],
      }),
    });

    if (response.status === 429) {
      throw new Error("The assistant is busy right now — please try again in a moment.");
    }
    if (response.status === 402) {
      throw new Error("AI credits have run out for this workspace. Add credits to keep asking.");
    }
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Assistant failed (${response.status}): ${body.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer = payload.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error("The assistant returned an empty answer.");
    return { answer };
  });
