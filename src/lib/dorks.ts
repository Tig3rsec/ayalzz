export type DorkResult = {
  id: string;
  label: string;
  hint: string;
  query: string;
};

export type EngineId = "ddg" | "bing" | "startpage" | "mojeek" | "google";

export const ENGINES: Array<{ id: EngineId; name: string; build: (q: string) => string }> = [
  // DuckDuckGo's lite endpoint honours search operators and rarely blocks embedded traffic.
  { id: "ddg", name: "DuckDuckGo", build: (q) => `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(q)}` },
  { id: "bing", name: "Bing", build: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
  { id: "startpage", name: "Startpage", build: (q) => `https://www.startpage.com/sp/search?query=${encodeURIComponent(q)}` },
  { id: "mojeek", name: "Mojeek", build: (q) => `https://www.mojeek.com/search?q=${encodeURIComponent(q)}` },
  { id: "google", name: "Google", build: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
];

export function engineUrl(engine: EngineId, query: string) {
  const found = ENGINES.find((item) => item.id === engine);
  return (found ?? ENGINES[0]!).build(query);
}

/** Direct catalogue searches — these open real result pages, not a search engine. */
export function directSources(rawTerm: string) {
  const term = rawTerm.trim();
  const q = encodeURIComponent(term);
  return [
    { label: "Internet Archive", url: `https://archive.org/search?query=${q}` },
    { label: "Open Library", url: `https://openlibrary.org/search?q=${q}` },
    { label: "Google Books", url: `https://www.google.com/books/edition/_/?gbpv=0&q=${q}` },
    { label: "National Digital Library", url: `https://ndl.iitkgp.ac.in/search?q=${q}` },
    { label: "NCERT textbooks", url: `https://ncert.nic.in/textbook.php` },
    { label: "PDF Drive", url: `https://www.pdfdrive.com/search?q=${q}` },
  ];
}

/**
 * Builds search-operator ("dork") queries that surface freely downloadable
 * copies of a book across open indexes, archives and official portals.
 */
export function buildDorks(rawTerm: string, track?: string): DorkResult[] {
  const term = rawTerm.trim();
  if (!term) return [];
  const scoped = track && track !== "ALL" ? `${term} ${track}` : term;
  const quoted = `"${term}"`;

  const recipes: Array<Omit<DorkResult, "id">> = [
    { label: "Direct PDF", hint: "Any indexed PDF matching the title", query: `${quoted} filetype:pdf` },
    {
      label: "Open directory",
      hint: "Unlocked file listings hosting the book",
      query: `intitle:"index of" ${quoted} pdf`,
    },
    { label: "Archive.org", hint: "Public domain and lending copies", query: `site:archive.org ${quoted}` },
    {
      label: "Academic mirrors",
      hint: "University and institute servers",
      query: `site:ac.in ${quoted} filetype:pdf`,
    },
    {
      label: "Government / NCERT",
      hint: "Official syllabus material",
      query: `site:gov.in ${scoped} filetype:pdf`,
    },
    {
      label: "Drive & cloud shares",
      hint: "Publicly shared study folders",
      query: `site:drive.google.com ${quoted}`,
    },
    {
      label: "Study aggregators",
      hint: "Aspirant communities and note hubs",
      query: `site:pdfdrive.com ${scoped}`,
    },
    { label: "EPUB / DJVU", hint: "Alternative reader formats", query: `${quoted} filetype:epub` },
  ];

  return recipes.map((recipe, index) => ({ ...recipe, id: `dork-${index}` }));
}
