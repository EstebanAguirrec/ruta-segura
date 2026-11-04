import { useState } from 'react';
import { aplicarTema, leerTema } from '../tema.js';
import { Icono, LUNA, SOL, TELEFONO } from './Iconos.jsx';

// Vínculos de vida (IE-02): siempre visibles, con o sin sesión, y sin depender de la API.
export function LineasDeAyuda({ etiqueta = 'Líneas de ayuda' }) {
  return (
    <nav aria-label={etiqueta} className="flex gap-2">
      <a href="tel:155" className="btn btn-borde flex-1 text-sm sm:flex-none">
        <Icono trazos={TELEFONO} className="size-4" /> Línea 155 · Orientación
      </a>
      <a href="tel:123" className="btn btn-emergencia flex-1 text-sm sm:flex-none">
        <Icono trazos={TELEFONO} className="size-4" /> Línea 123 · Emergencias
      </a>
    </nav>
  );
}

// Sin sesión lleva a iniciar sesión, igual que el diagrama de actividades.
function BotonReportar({ usuaria, vista, className = '' }) {
  return (
    <a
      href={usuaria ? '#/nuevo' : '#/login'}
      aria-current={usuaria && vista === 'nuevo' ? 'page' : undefined}
      className={`btn btn-acento ${className}`}
    >
      <span aria-hidden="true">+</span> Reportar
    </a>
  );
}

function BotonTema() {
  const [tema, setTema] = useState(leerTema);
  const cambiar = () => {
    const nuevo = tema === 'oscuro' ? 'claro' : 'oscuro';
    aplicarTema(nuevo);
    setTema(nuevo);
  };
  return (
    <button
      type="button"
      onClick={cambiar}
      aria-label={tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="btn px-0 text-texto hover:bg-superficie-2"
    >
      <Icono trazos={tema === 'oscuro' ? SOL : LUNA} />
    </button>
  );
}

export function Header({ usuaria, vista, alSalir }) {
  return (
    <header className="border-b border-linea bg-fondo">
      <div className="contenedor flex min-h-16 items-center justify-between gap-3">
        <a href="#/" className="flex min-h-11 items-center gap-2 font-serif text-2xl font-medium text-texto no-underline">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-acento" />
          Ruta Segura
        </a>
        <div className="flex items-center gap-2">
          <a href="tel:155" className="btn hidden text-sm text-texto underline hover:bg-superficie-2 lg:inline-flex">Línea 155</a>
          <a href="tel:123" className="btn hidden text-sm text-texto underline hover:bg-superficie-2 lg:inline-flex">Línea 123</a>
          <BotonTema />
          {usuaria && (
            <>
              <span className="hidden max-w-32 truncate text-sm text-suave sm:inline">{usuaria.alias}</span>
              <button type="button" onClick={alSalir} className="btn btn-borde text-sm">Salir</button>
            </>
          )}
          <BotonReportar usuaria={usuaria} vista={vista} className="hidden lg:inline-flex" />
        </div>
      </div>
    </header>
  );
}

// En el celular las acciones principales quedan al alcance del pulgar.
export function BarraAccion({ usuaria, vista }) {
  return (
    <nav aria-label="Acciones principales" className="barra-accion fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-fondo pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex gap-2 px-4 py-2">
        <a href="tel:155" aria-label="155: llamar a la Línea 155, orientación a mujeres" className="btn btn-borde px-3 text-sm">
          <Icono trazos={TELEFONO} className="size-4" /> 155
        </a>
        <a href="tel:123" aria-label="123: llamar a la Línea 123, emergencias" className="btn btn-emergencia px-3 text-sm">
          <Icono trazos={TELEFONO} className="size-4" /> 123
        </a>
        <BotonReportar usuaria={usuaria} vista={vista} className="flex-1" />
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 border-t border-linea">
      <div className="contenedor flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-sm text-suave">
          Ruta Segura no reemplaza las líneas de atención. Si estás en peligro, llama.
        </p>
        <LineasDeAyuda etiqueta="Líneas de ayuda del pie de página" />
      </div>
    </footer>
  );
}
