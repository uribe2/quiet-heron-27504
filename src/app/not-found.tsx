import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold text-text">
        Página no encontrada
      </h1>
      <Link href="/" className="text-link underline focus-visible:ring-2">
        Volver a Inicio
      </Link>
    </main>
  );
}
