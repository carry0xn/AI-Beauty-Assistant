'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { authRequest, setSession } from '../../lib/auth';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authRequest(`/auth/${mode}`, {
        email,
        password,
        ...(mode === 'register' ? { name } : {})
      });
      setSession(response);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Aura</h1>
        <p className="mt-1 text-sm text-slate-600">
          {mode === 'login' ? 'Iniciá sesión en tu cuenta' : 'Creá tu cuenta de asesoría'}
        </p>
      </div>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            mode === 'login' ? 'bg-white shadow-sm' : 'text-slate-500'
          }`}
        >
          Ingresar
        </button>
        <button
          type="button"
          onClick={() => switchMode('register')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            mode === 'register' ? 'bg-white shadow-sm' : 'text-slate-500'
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === 'register' && (
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        )}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Contraseña (mín. 8 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Cargando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
        </button>
      </form>
    </main>
  );
}
