'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { authedFetch, clearSession, getStoredUser, type AuthUser } from '../../lib/auth';

interface AnalysisSummary {
  id: string;
  kind: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error: string | null;
  createdAt: string;
}

const statusLabels: Record<AnalysisSummary['status'], string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'En proceso',
  COMPLETED: 'Completado',
  FAILED: 'No se pudo completar'
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [analysesError, setAnalysesError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace('/auth');
      return;
    }
    setUser(stored);

    const loadAnalyses = async () => {
      try {
        const response = await authedFetch('/analyses');
        if (!response.ok) throw new Error('No se pudo cargar tu historial');
        setAnalyses(await response.json());
      } catch (error) {
        setAnalysesError(error instanceof Error ? error.message : 'No se pudo cargar tu historial');
      } finally {
        setLoading(false);
      }
    };

    void loadAnalyses();
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
          <p className="mt-2 text-3xl">{analyses.length}</p>
          <p className="mt-1 text-sm text-slate-600">
            {analyses.length ? 'En tu historial' : 'Todavía no hay análisis guardados.'}
          </p>
        </article>
        <article className="glass-card rounded-2xl border border-orange-100 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Perfil de color</p>
          <p className="mt-2 text-3xl">—</p>
          <p className="mt-1 text-sm text-slate-600">Datos disponibles próximamente.</p>
        </article>
        <article className="glass-card rounded-2xl border border-orange-100 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Último análisis</p>
          <p className="mt-2 text-3xl">{analyses[0] ? statusLabels[analyses[0].status] : '—'}</p>
          <p className="mt-1 text-sm text-slate-600">
            {analyses[0] ? new Date(analyses[0].createdAt).toLocaleDateString('es-AR') : 'Todavía no hay datos.'}
          </p>
        </article>
      </section>

      {analysesError && <p className="text-sm text-red-600">{analysesError}</p>}

      <section className="glass-card rounded-2xl border border-orange-100 p-6 shadow-sm">
        <h2 className="text-2xl">Tu historial</h2>
        {analyses.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Todavía no hay análisis para mostrar.</p>
        ) : (
          <ul className="mt-4 divide-y divide-orange-100">
            {analyses.map((analysis) => (
              <li key={analysis.id} className="flex items-center justify-between gap-4 py-4 text-sm">
                <div>
                  <p className="font-medium text-slate-900">Análisis {analysis.kind}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(analysis.createdAt).toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-right text-xs text-slate-600">{statusLabels[analysis.status]}</span>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/analisis/${analysis.id}`)}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-500"
                  >
                    Ver detalle
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass-card rounded-2xl border border-orange-100 p-6 shadow-sm">
        <h2 className="text-2xl">Tu siguiente paso</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-700">
          Subí una foto con buena luz para iniciar un análisis facial.
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
