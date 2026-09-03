import logo from "@/assets/ayal-logo.png.asset.json";

export function Logo({ className = "size-10" }: { className?: string }) {
  return <img src={logo.url} alt="Ayal — tree of knowledge over an open book" className={className} />;
}
