import { useState } from "react";
import { toast } from "sonner";
import { buildDorks, directSources, engineUrl, ENGINES, type DorkResult, type EngineId } from "@/lib/dorks";
import { suggestTitles, type SuggestedTitle } from "@/lib/discover.functions";

export function DiscoverPanel({ track }: { track: string }) {
  const [term, setTerm] = useState("");
  const [active, setActive] = useState("");
  const [dorks, setDorks] = useState<DorkResult[]>([]);
  const [titles, setTitles] = useState<SuggestedTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [engine, setEngine] = useState<EngineId>("ddg");

  async function run(event: React.FormEvent) {
    event.preventDefault();
    const value = term.trim();
    if (value.length < 2) return;
    setActive(value);
    setDorks(buildDorks(value, track));
    setTitles([]);
    setLoading(true);
    try {
      const result = await suggestTitles({ data: { topic: value, track } });
      setTitles(result.titles);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not fetch suggestions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="label-mono text-cognac">Search operators · the whole internet</p>
      <h2 className="mt-3 font-serif text-2xl text-ink sm:text-3xl">Find a book that isn't on the shelf</h2>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Type a title or topic. Ayal builds advanced search-operator queries (dorks) that point at open
        directories, archives, academic mirrors and government portals — each one opens a live search
        with the download links.
      </p>

      <form onSubmit={run} className="mt-6 flex max-w-2xl flex-col gap-2 rounded-2xl bg-paper p-3 ring-1 ring-border sm:flex-row sm:items-center sm:rounded-full sm:p-2 sm:pl-6">
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="e.g. Laxmikanth Indian Polity"
          className="flex-1 bg-transparent px-2 py-1 text-sm text-ink outline-none placeholder:text-ink-soft/70"
        />
        <button type="submit" className="w-full rounded-full bg-pine px-5 py-2.5 text-sm font-medium text-cream sm:w-auto">
          Hunt
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="label-mono text-ink-soft">Search engine</span>
        {ENGINES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setEngine(item.id)}
            className={`rounded-full px-4 py-1.5 text-xs transition ${
              engine === item.id ? "bg-pine text-cream" : "border border-border text-ink"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {active ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {directSources(active).map((source) => (
            <a
              key={source.label}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border bg-paper px-4 py-1.5 text-xs text-ink hover:ring-1 hover:ring-moss"
            >
              {source.label} →
            </a>
          ))}
        </div>
      ) : null}

      {active ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
          <div className="grid gap-3 sm:grid-cols-2">
            {dorks.map((dork) => (
              <div
                key={dork.id}
                className="rounded-xl bg-paper p-4 ring-1 ring-border transition hover:-translate-y-0.5 hover:ring-moss"
              >
                <p className="label-mono text-cognac">{dork.label}</p>
                <p className="mt-1 text-sm text-ink">{dork.hint}</p>
                <code className="mt-2 block truncate rounded-lg bg-cream px-2 py-1 font-mono text-[11px] text-ink-soft">
                  {dork.query}
                </code>
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={engineUrl(engine, dork.query)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-pine px-4 py-2 text-[11px] font-medium text-cream"
                  >
                    Open search
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(dork.query);
                        toast.success("Query copied — paste it into any search engine.");
                      } catch {
                        toast.error("Copy failed. Select the query text manually.");
                      }
                    }}
                    className="rounded-full border border-border px-4 py-1.5 text-[11px] text-ink"
                  >
                    Copy query
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-2xl bg-pine p-5 text-cream">
            <p className="label-mono text-cream/60">Standard references</p>
            <p className="mt-2 font-serif text-lg">Which book to look for</p>
            {loading ? (
              <p className="mt-3 text-xs text-cream/70">Consulting the assistant…</p>
            ) : titles.length === 0 ? (
              <p className="mt-3 text-xs text-cream/70">No suggestions for this search.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {titles.map((item) => (
                  <li key={item.title} className="rounded-xl bg-cream/10 p-3">
                    <p className="text-sm">{item.title}</p>
                    <p className="text-[11px] text-cream/60">{item.author}</p>
                    <p className="mt-1 text-[11px] text-cream/80">{item.why}</p>
                    <button
                      onClick={() => {
                        setTerm(item.title);
                        setActive(item.title);
                        setDorks(buildDorks(item.title, track));
                      }}
                      className="mt-2 rounded-full bg-cream px-3 py-1 text-[11px] font-medium text-pine"
                    >
                      Build dorks
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
