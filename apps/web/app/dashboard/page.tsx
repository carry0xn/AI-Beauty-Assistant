'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { authedFetch, clearSession, getStoredUser, type AuthUser } from '../../lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace('/auth');
      return;
    }
    setUser(stored);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.replace('/auth');
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="glass-card flex items-center justify-between rounded-2xl border border-orange-100 p-5 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Dashboard</p>
          <h1 className="mt-1 text-3xl">Bienvenida, {user.name ?? user.email}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
        >
          Cerrar sesion
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="glass-card rounded-2xl border border-orange-100 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Analisis realizados</p>
          <p className="mt-2 text-3xl">0</p>
          <p className="mt-1 text-sm text-slate-600">Todavia no hay historial cargado.</p>
        </article>
        <article className="glass-card rounded-2xl border border-orange-100 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Perfil de color</p>
          <p className="mt-2 text-3xl">Pendiente</p>
          <p className="mt-1 text-sm text-slate-600">Se definira al completar el primer analisis.</p>
        </article>
        <article className="glass-card rounded-2xl border border-orange-100 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Plan sugerido</p>
          <p className="mt-2 text-3xl">Starter</p>
          <p className="mt-1 text-sm text-slate-600">Recomendaciones base de maquillaje y pelo.</p>
        </article>
      </section>

      <section className="glass-card rounded-2xl border border-orange-100 p-6 shadow-sm">
        <h2 className="text-2xl">Tu siguiente paso</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-700">
          Subi una foto con buena luz para iniciar el flujo de analisis facial y corporal. Esta
          pantalla todavia esta en modo scaffold, pero ya muestra la experiencia objetivo.
        </p>
        <button
          onClick={() => router.push('/analyze')}
          className="mt-5 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Ir a analizar
        </button>
      </section>
    </main>
  );
}
