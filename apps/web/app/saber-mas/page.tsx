import Link from 'next/link';

const sources = [
  {
    title: 'Anatomía y simetría en la barbería',
    fileName: 'ANATOMÍA Y SIMETRÍA EN LA BARBERÍA.pdf',
    credit: 'Autoría no indicada en el archivo.'
  },
  {
    title: 'Colorimetría fácil: cómo saber qué colores te favorecen',
    fileName: 'COLORIMETRIA FACIL_ ¿Cómo saber qué colores te favorecen_ _ Miriam Llantada.pdf',
    credit: 'Autora: Miriam Llantada.'
  },
  {
    title: 'Forma del cráneo',
    fileName: 'Forma del cráneo.pdf',
    credit: 'Autoría no indicada en el archivo.'
  },
  {
    title: 'Introducción a la colorimetría II',
    fileName: 'Introduccion-Colorimetria-II.pdf',
    credit: 'Autoría no indicada en el archivo.'
  },
  {
    title: 'Teoría del color',
    fileName: 'Teoria-del-Color.pdf',
    credit: 'Autoría no indicada en el archivo.'
  }
];

export default function SaberMasPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-10 md:py-14">
      <header>
        <Link href="/analyze" className="text-sm text-slate-600 hover:text-slate-900">
          Volver al análisis
        </Link>
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-orange-700">
          Para profundizar
        </p>
        <h1 className="mt-3 text-4xl leading-tight md:text-5xl">Saber más</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          Estas son las lecturas que forman parte de la base de conocimiento de Aura. Las
          recomendaciones son una orientación y no reemplazan la mirada personal de cada persona.
        </p>
      </header>

      <section className="space-y-4" aria-label="Fuentes y créditos">
        {sources.map((source) => (
          <article key={source.fileName} className="border-t border-orange-200 py-5">
            <h2 className="text-xl">{source.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{source.credit}</p>
            <p className="mt-2 break-words text-xs text-slate-500">Archivo: {source.fileName}</p>
          </article>
        ))}
      </section>
    </main>
  );
}