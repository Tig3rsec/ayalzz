import { useState } from "react";
import { toast } from "sonner";
import { askAssistant } from "@/lib/ai.functions";

type Mode = "ask" | "explain" | "quiz" | "plan";

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "ask", label: "Ask" },
  { id: "explain", label: "Explain" },
  { id: "quiz", label: "Quiz me" },
  { id: "plan", label: "Study plan" },
];

export function AssistantPanel({ context }: { context: string }) {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<Mode>("ask");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAsk(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (trimmed.length < 2) return;
    setLoading(true);
    setAsked(trimmed);
    setAnswer(null);
    try {
      const result = await askAssistant({ data: { question: trimmed, context, mode } });
      setAnswer(result.answer);
      setQuestion("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The assistant is unavailable.");
      setAsked(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="h-fit rounded-2xl bg-pine p-5 text-cream lg:sticky lg:top-6">
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream/10">
          <span className="font-serif text-sm">A</span>
        </span>
        <div>
          <p className="font-serif text-base leading-none">Study assistant</p>
          <p className="label-mono mt-1 text-cream/50">Grounded in your shelf</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {MODES.map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
              mode === item.id ? "bg-cream text-pine" : "bg-cream/10 text-cream/80 hover:bg-cream/20"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl bg-cream/10 p-3">
          <p className="text-xs text-cream/90">
            {asked ?? "Which chapter should I revise tonight for the TNPSC prelims?"}
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto rounded-xl bg-cream p-3">
          <p className="label-mono mb-1 text-cognac">Ayal</p>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-ink">
            {loading
              ? "Reading the shelf…"
              : (answer ??
                "Pick a mode and ask anything about your exam prep — I'll point you to chapters and books on the shelf.")}
          </p>
        </div>
      </div>

      <form onSubmit={handleAsk} className="mt-4 flex items-center gap-2 rounded-full bg-cream/10 p-1 pl-4">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="flex-1 bg-transparent text-xs text-cream outline-none placeholder:text-cream/40"
          placeholder={mode === "quiz" ? "Topic to quiz me on…" : "Ask about any book…"}
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-full bg-cream px-3 py-1.5 text-xs font-medium text-pine disabled:opacity-60"
        >
          {loading ? "…" : "Send"}
        </button>
      </form>

      <p className="mt-3 text-[11px] text-cream/50">Answers are grounded in the books on the shelf.</p>
    </aside>
  );
}
