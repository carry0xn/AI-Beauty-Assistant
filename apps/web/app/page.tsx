import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:py-14">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-orange-500/90" />
          <p className="text-lg font-semibold">Aura</p>
        </div>
        <Link
          className="rounded-full border border-orange-300 bg-white/70 px-5 py-2 text-sm font-medium transition hover:bg-white"
          href="/auth"
        >
          Iniciar sesión
        </Link>
      </header>

      <section className="grid flex-1 items-center gap-8 md:grid-cols-[1.15fr_0.85fr]">
        <article className="glass-card rounded-3xl border border-orange-100 p-8 shadow-lg md:p-10">
          <p className="mb-4 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
            AI Beauty Assistant
          </p>
          <h1 className="text-4xl leading-tight md:text-6xl">
            Tu estilo, guiado
            <br />
            por datos reales
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-700 md:text-lg">
            Aura combina analisis facial, colorimetria y recomendaciones para convertir una foto en
            acciones concretas de imagen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              href="/analyze"
            >
              Empezar analisis
            </Link>
            <Link
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold transition hover:bg-slate-50"
              href="/dashboard"
            >
              Ver dashboard
            </Link>
          </div>
        </article>

        <aside className="grid gap-4">
          <div className="glass-card rounded-2xl border border-orange-100 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">Precision</p>
            <h2 className="mt-2 text-2xl">+91%</h2>
            <p className="mt-1 text-sm text-slate-600">Consistencia del perfil visual en pruebas internas.</p>
          </div>
          <div className="glass-card rounded-2xl border border-orange-100 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">Recomendaciones</p>
            <h2 className="mt-2 text-2xl">Makeup + Hair + Outfit</h2>
            <p className="mt-1 text-sm text-slate-600">Un flujo unificado para que tomes decisiones en minutos.</p>
          </div>
          <div className="glass-card rounded-2xl border border-orange-100 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">Stack</p>
            <p className="mt-2 text-sm text-slate-700">
              Next.js + NestJS + FastAPI sobre una arquitectura modular orientada a servicios.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
