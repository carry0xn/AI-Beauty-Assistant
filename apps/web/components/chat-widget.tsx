'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

import { getToken } from '../lib/auth';

const ASSISTANT_URL = process.env.NEXT_PUBLIC_ASSISTANT_URL ?? 'http://localhost:3002';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  reply: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de belleza. Preguntame sobre tu análisis: forma de rostro, tono de piel, maquillaje, ojos, cabello o rutina. 💜'
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');
    setSending(true);

    try {
      const token = getToken();
      const response = await fetch(`${ASSISTANT_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data: ChatResponse = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'No pude comunicarme con el asistente. Asegurate de que el servicio esté corriendo e intentalo de nuevo.'
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Cerrar chat' : 'Abrir chat'}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition hover:bg-orange-600"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <aside className="fixed bottom-24 right-6 z-50 flex h-[480px] w-80 flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-2xl">
          <header className="bg-orange-500 px-4 py-3 text-white">
            <p className="text-sm font-semibold">Tu asistente de belleza</p>
            <p className="text-xs text-orange-100">Consulta sobre tu análisis</p>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'ml-auto bg-orange-500 text-white'
                    : 'bg-white text-slate-800 shadow-sm'
                }`}
              >
                {message.content}
              </div>
            ))}
            {sending && (
              <div className="max-w-[85%] rounded-2xl bg-white px-3 py-2 text-sm text-slate-400 shadow-sm">
                Escribiendo…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Preguntame sobre tu análisis…"
              className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-orange-400"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Enviar mensaje"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition hover:bg-orange-600 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}