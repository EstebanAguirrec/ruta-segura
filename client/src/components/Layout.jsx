// Vínculos de vida (IE-02): siempre visibles, con o sin sesión, y sin depender de la API.
function LineasDeAyuda({ claro = false }) {
  const base = 'btn flex-1 text-sm sm:flex-none';
  return (
    <nav aria-label="Líneas de ayuda" className="flex gap-2">
      <a href="tel:155" className={`${base} ${claro ? 'bg-white text-violet-900 hover:bg-violet-100' : 'bg-violet-800 text-white hover:bg-violet-900'}`}>
        <span aria-hidden="true">📞</span> Línea 155 · Orientación
      </a>
      <a href="tel:123" className={`${base} bg-red-700 text-white hover:bg-red-800`}>
        <span aria-hidden="true">🚨</span> 123 · Emergencias
      </a>
    </nav>
  );
}

export function Header({ usuaria, alSalir }) {
  return (
    <header className="bg-violet-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3">
          <a href="#/" className="flex min-h-11 items-center gap-2 text-lg font-bold text-white no-underline">
            <span aria-hidden="true">📍</span> Ruta Segura
          </a>
          {usuaria && (
            <div className="flex items-center gap-2 sm:hidden">
              <BotonSalir usuaria={usuaria} alSalir={alSalir} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <LineasDeAyuda claro />
          {usuaria && (
            <div className="hidden items-center gap-2 sm:flex">
              <BotonSalir usuaria={usuaria} alSalir={alSalir} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function BotonSalir({ usuaria, alSalir }) {
  return (
    <>
      <span className="max-w-32 truncate text-sm text-violet-100">{usuaria.alias}</span>
      <button type="button" onClick={alSalir} className="btn border border-violet-300 text-sm text-white hover:bg-violet-900">
        Salir
      </button>
    </>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-300 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-700">
          Ruta Segura no reemplaza las líneas de atención. Si estás en peligro, llama.
        </p>
        <LineasDeAyuda />
      </div>
    </footer>
  );
}
