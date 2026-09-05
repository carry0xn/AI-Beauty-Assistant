'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { API_URL, authedFetch, getStoredUser } from '../../lib/auth';

interface AnalysisResult {
  face: {
    shape: string;
    shape_ratios: Record<string, number>;
    symmetry_score: number;
    skin_tone: { tone: string; undertone: string; lab: number[] };
    eye_color: string;
    hair_color: string;
    proportions: Record<string, number>;
  };
  recommendations?: {
    face_shape?: string[];
    colorimetry?: string[];
    evidence?: string[];
  };
  knowledge_sources?: string[];
}

interface AnalysisResponse {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  resultJson: AnalysisResult | null;
  error: string | null;
}

const shapeLabels: Record<string, string> = {
  oval: 'Ovalada',
  round: 'Redonda',
  square: 'Cuadrada',
  heart: 'Corazón',
  oblong: 'Alargada'
};

export default function AnalyzePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>(
    'idle'
  );
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  useEffect(() => {
    if (!getStoredUser()) {
      router.replace('/auth');
      return;
    }
    setAuthed(true);
  }, [router]);

  const handleFile = async (file: File) => {
    setError(null);
    setStatus('uploading');

    try {
      const presignRes = await authedFetch('/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type })
      });
      if (!presignRes.ok) throw new Error('No se pudo preparar la subida');
      const { uploadUrl, key } = await presignRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      if (!uploadRes.ok) throw new Error('Fallo la subida de la imagen');

      setStatus('processing');

      const analysisRes = await authedFetch('/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'face', imageKey: key })
      });
      if (!analysisRes.ok) throw new Error('No se pudo iniciar el análisis');
      const { analysisId } = await analysisRes.json();

      const started = Date.now();
      for (;;) {
        const res = await authedFetch(`/analyses/${analysisId}`);
        if (!res.ok) throw new Error('Error consultando el análisis');
        const data: AnalysisResponse = await res.json();

        if (data.status === 'COMPLETED') {
          setAnalysis(data);
          setStatus('done');
          return;
        }
        if (data.status === 'FAILED') {
          setError(data.error ?? 'El análisis falló');
          setStatus('error');
          return;
        }
        if (Date.now() - started > 90_000) {
          setError('El análisis tardó demasiado');
          setStatus('error');
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setStatus('error');
    }
  };

  if (authed === null) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Cargando…</p>
      </main>
    );
  }

  const face = analysis?.resultJson?.face;
  const recommendations = analysis?.resultJson?.recommendations;
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Análisis facial</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600"
        >
          Volver al dashboard
        </button>
      </div>

      <section className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {status === 'idle' && (
          <>
            <p className="text-sm text-slate-600">
              Subí una foto de frente, bien iluminada, sin lentes ni accesorios que tapen tu cara.
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-4 rounded-md bg-black px-6 py-2.5 text-sm font-medium text-white"
            >
              Elegir foto
            </button>
          </>
        )}
        {(status === 'uploading' || status === 'processing') && (
          <p className="text-sm text-slate-600">Analizando tu rostro… (puede tardar unos segundos)</p>
        )}
        {status === 'error' && (
          <>
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => {
                setStatus('idle');
                setError(null);
              }}
              className="mt-4 rounded-md bg-black px-6 py-2.5 text-sm font-medium text-white"
            >
              Intentar de nuevo
            </button>
          </>
        )}
        {status === 'done' && face && (
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600"
          >
            Analizar otra foto
          </button>
        )}
      </section>

      {status === 'done' && face && (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-5">
              <h2 className="text-lg font-semibold">Forma del rostro</h2>
              <p className="mt-1 text-3xl font-bold capitalize">
                {shapeLabels[face.shape] ?? face.shape}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Ancho/alto: {face.shape_ratios.height_width_ratio} · Mandíbula/pómulos:{' '}
                {face.shape_ratios.jaw_cheek_ratio}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <h2 className="text-lg font-semibold">Piel</h2>
              <p className="mt-1 text-3xl font-bold capitalize">
                {face.skin_tone.tone} · {face.skin_tone.undertone}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Tono con subtono {face.skin_tone.undertone}. La base de maquillaje debe seguir esta
                temperatura de color.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <h2 className="text-lg font-semibold">Ojos y cabello</h2>
              <p className="mt-1 text-xl font-semibold capitalize">Ojos {face.eye_color}</p>
              <p className="text-xl font-semibold capitalize">Cabello {face.hair_color}</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <h2 className="text-lg font-semibold">Simetría</h2>
              <p className="mt-1 text-3xl font-bold">
                {Math.round(face.symmetry_score * 100)}%
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Nivel de simetría frontal. Sensible a la pose de la foto.
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 p-5">
            <h2 className="text-lg font-semibold">Recomendaciones sugeridas</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-700">Según forma del rostro</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {(recommendations?.face_shape ?? []).map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Según colorimetría</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {(recommendations?.colorimetry ?? []).map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <Link
                href="/saber-mas"
                className="text-sm font-medium text-orange-700 underline decoration-orange-300 underline-offset-4 hover:text-orange-800"
              >
                Saber más sobre estas recomendaciones
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
