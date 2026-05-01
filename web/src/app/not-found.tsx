import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-3 pt-12 text-center">
      <div className="text-5xl">404</div>
      <div className="text-sm text-[color:var(--muted-foreground)]">// route not found</div>
      <Link href="/" className="text-brand-red underline">go home</Link>
    </div>
  );
}
