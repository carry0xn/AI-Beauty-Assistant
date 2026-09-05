import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 md:px-10 md:py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/90 text-sm font-semibold text-white">
            A
          </div>
          <p className="text-lg font-semibold tracking-tight">Aura</p>
        </div>
        <Link
          className="rounded-full border border-slate-300 bg-white/70 px-5 py-2 text-sm font-medium transition hover:border-slate-500 hover:bg-white"
          href="/auth"
        >
          Ya tengo una cuenta
        </Link>
      </header>

      <section className="grid flex-1 items-center gap-12 py-16 md:grid-cols-[1.1fr_0.9fr] md:gap-20 md:py-24">
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-orange-700">
            Una mirada para vos
          </p>
          <h1 className="max-w-3xl text-5xl leading-[0.98] md:text-7xl">
            Descubrí qué te hace sentir bien.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-700 md:text-lg">
            Subí una foto y conocé tu forma de rostro, los colores que pueden acompañarte y algunas
            ideas simples para probar en tu estilo.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              href="/analyze"
            >
              Empezar mi análisis
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">Tu foto se usa para preparar tu análisis.</p>
        </div>

        <aside className="border-l border-orange-200 pl-6 md:pl-10">
          <p className="text-sm font-semibold text-slate-900">Podés empezar por lo que te interese</p>
          <ul className="mt-6 space-y-6">
            <li>
              <h2 className="text-xl">Tu rostro</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Una referencia para elegir cortes, maquillaje y formas que te gusten.
              </p>
            </li>
            <li>
              <h2 className="text-xl">Tus colores</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Ideas para explorar tonos en ropa, maquillaje y accesorios.
              </p>
            </li>
            <li>
              <h2 className="text-xl">A tu ritmo</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                No hay una forma correcta de verte. Usá las sugerencias como punto de partida.
              </p>
            </li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
