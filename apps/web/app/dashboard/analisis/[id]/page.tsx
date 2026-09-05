'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { authedFetch, getStoredUser } from '../../../../lib/auth';

interface AnalysisDetail {
  kind: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error: string | null;
  createdAt: string;
  imageUrl: string;
  resultJson: {
    face?: {
      shape?: string;
      skin_tone?: { tone?: string; undertone?: string };
      eye_color?: string;
      hair_color?: string;
      symmetry_score?: number;
    };
    recommendations?: { face_shape?: string[]; colorimetry?: string[] };
  } | null;
}

const statusLabels: Record<AnalysisDetail['status'], string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'En proceso',
  COMPLETED: 'Completado',
  FAILED: 'No se pudo completar'
};

export default function AnalysisDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredUser()) {
      router.replace('/auth');
      return;
    }

    const loadAnalysis = async () => {
      try {
        const response = await authedFetch(`/analyses/${params.id}`);
        if (!response.ok) throw new Error('No se pudo cargar este análisis');
        setAnalysis(await response.json());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar este análisis');
      }
    };

    void loadAnalysis();
  }, [params.id, router]);

  if (error) {
    return <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-red-600">{error}</main>;
  }

  if (!analysis) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Cargando análisis...</main>;
  }

  const face = analysis.resultJson?.face;
  const recommendations = analysis.resultJson?.recommendations;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
      <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
        Volver al historial
      </Link>
      <header>
        <p className="text-xs uppercase tracking-wider text-slate-500">Detalle de tu análisis</p>
        <h1 className="mt-1 text-3xl">Análisis {analysis.kind}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {statusLabels[analysis.status]} · {new Date(analysis.createdAt).toLocaleString('es-AR')}
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_1.1fr]">
        <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white">
          <img src={analysis.imageUrl} alt="Foto utilizada para tu análisis" className="h-full max-h-[520px] w-full object-cover" />
        </div>
        <div className="space-y-4">
          {analysis.status !== 'COMPLETED' ? (
            <div className="rounded-2xl border border-orange-100 p-5">
              <h2 className="text-xl">Este análisis todavía no tiene resultados</h2>
              <p className="mt-2 text-sm text-slate-600">{analysis.error ?? 'Volvé a consultar más tarde.'}</p>
            </div>
          ) : face ? (
            <>
              <div className="rounded-2xl border border-orange-100 p-5">
                <h2 className="text-xl">Tu resultado</h2>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="text-slate-500">Forma del rostro</dt><dd className="mt-1 font-medium capitalize">{face.shape ?? '—'}</dd></div>
                  <div><dt className="text-slate-500">Piel</dt><dd className="mt-1 font-medium capitalize">{face.skin_tone?.tone ?? '—'} · {face.skin_tone?.undertone ?? '—'}</dd></div>
                  <div><dt className="text-slate-500">Ojos</dt><dd className="mt-1 font-medium capitalize">{face.eye_color ?? '—'}</dd></div>
                  <div><dt className="text-slate-500">Cabello</dt><dd className="mt-1 font-medium capitalize">{face.hair_color ?? '—'}</dd></div>
                </dl>
              </div>
              <div className="rounded-2xl border border-orange-100 p-5">
                <h2 className="text-xl">Recomendaciones</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                  {[...(recommendations?.face_shape ?? []), ...(recommendations?.colorimetry ?? [])].map((tip) => <li key={tip}>{tip}</li>)}
                </ul>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}