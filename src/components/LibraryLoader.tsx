export function LibraryLoader({ label = "Opening the library…" }: { label?: string }) {
  return (
    <div className="library-loader" role="status" aria-live="polite">
      <div className="library-loader__inner">
        <div className="library-loader__mark" aria-hidden="true" />
        <p>{label}</p>
      </div>
    </div>
  );
}