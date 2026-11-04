import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { CATEGORIAS } from '../constantes.js';
import AccionesReporte from './AccionesReporte.jsx';
import Alert, { AvisoEtico } from './Alert.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { IconoCategoria } from './Iconos.jsx';
import ReportCard from './ReportCard.jsx';

// Carga diferida: un fallo al descargar Leaflet también lo atrapa el ErrorBoundary,
// y en el celular no se gastan datos en el mapa hasta que se abre su pestaña.
const ReportMap = lazy(() => import('./ReportMap.jsx'));

const TAMAÑO_PAGINA = 50;
const ESCRITORIO = '(min-width: 1024px)';

function useEsEscritorio() {
  const [coincide, setCoincide] = useState(() => window.matchMedia(ESCRITORIO).matches);
  useEffect(() => {
    const consulta = window.matchMedia(ESCRITORIO);
    const alCambiar = (e) => setCoincide(e.matches);
    consulta.addEventListener('change', alCambiar);
    return () => consulta.removeEventListener('change', alCambiar);
  }, []);
  return coincide;
}

const AvisoMapa = ({ children }) => (
  <div className="flex h-full min-h-40 items-center justify-center rounded-md border border-linea bg-superficie p-4 text-center text-sm text-suave">
    {children}
  </div>
);

export default function Dashboard({ usuaria, municipios, mensaje, alCerrarMensaje }) {
  const [origenId, setOrigenId] = useState(String(usuaria.municipioId));
  const [categoria, setCategoria] = useState('');
  const [soloMunicipio, setSoloMunicipio] = useState(false);
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pestaña, setPestaña] = useState('lista');
  const [visibles, setVisibles] = useState(TAMAÑO_PAGINA);
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const ultimaConsulta = useRef(0);
  const esEscritorio = useEsEscritorio();

  const origen = municipios.find((m) => String(m.id) === origenId);

  const cargar = useCallback(async () => {
    const consulta = ++ultimaConsulta.current; // Descarta respuestas de filtros anteriores.
    setCargando(true);
    setError(null);
    try {
      const datos = await api.reportes({ origenId, categoria, municipioId: soloMunicipio ? origenId : '' });
      if (consulta !== ultimaConsulta.current) return;
      setReportes(datos);
      setVisibles(TAMAÑO_PAGINA);
    } catch (e) {
      if (consulta === ultimaConsulta.current) setError(e.message);
    } finally {
      if (consulta === ultimaConsulta.current) setCargando(false);
    }
  }, [origenId, categoria, soloMunicipio]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!mensaje) return undefined;
    const temporizador = setTimeout(alCerrarMensaje, 5000);
    return () => clearTimeout(temporizador);
  }, [mensaje, alCerrarMensaje]);

  const seleccionar = useCallback((id) => {
    setSeleccionadoId(id);
    const posicion = reportes.findIndex((r) => r.id === id);
    setVisibles((v) => Math.max(v, posicion + 1));
    requestAnimationFrame(() => {
      document.getElementById(`reporte-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [reportes]);

  const alConfirmar = useCallback((id, cambios) => {
    setReportes((actuales) => actuales.map((r) => (r.id === id ? { ...r, ...cambios } : r)));
  }, []);

  const mostrarLista = esEscritorio || pestaña === 'lista';
  const mostrarMapa = esEscritorio || pestaña === 'mapa';

  return (
    <div className="contenedor flex flex-col gap-3 pt-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[1.75rem] lg:text-[2.25rem]">Reportes cerca</h1>
        {usuaria.rol === 'moderadora' && <a href="#/moderacion" className="btn btn-borde text-sm">Moderación</a>}
      </div>

      {mensaje && <Alert tono="exito" rol="status">{mensaje}</Alert>}

      <form className="grid grid-cols-[1fr_6.75rem] items-end gap-3 sm:grid-cols-[20rem_auto] sm:justify-start sm:gap-6" onSubmit={(e) => e.preventDefault()}>
        <div className="min-w-0">
          <label htmlFor="filtro-origen" className="etiqueta">Cerca de</label>
          <select id="filtro-origen" className="campo" value={origenId} onChange={(e) => setOrigenId(e.target.value)}>
            {municipios.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <label className="flex min-h-12 cursor-pointer items-center gap-2 text-sm leading-tight">
          <input type="checkbox" className="size-6 shrink-0 accent-[var(--acento)]" checked={soloMunicipio} onChange={(e) => setSoloMunicipio(e.target.checked)} />
          <span>Solo este municipio</span>
        </label>
      </form>

      {/* Filtros de categoría: quedan fijos arriba al desplazarse. */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-linea bg-fondo px-4 py-2">
        <div role="group" aria-label="Filtrar por categoría" className="sin-barra -m-1 flex gap-2 overflow-x-auto p-1 lg:flex-wrap">
          <button type="button" aria-pressed={categoria === ''} onClick={() => setCategoria('')} className="chip cat-todas">
            Todas
          </button>
          {Object.entries(CATEGORIAS).map(([valor, { etiqueta, corta, clase }]) => (
            <button key={valor} type="button" aria-pressed={categoria === valor} aria-label={etiqueta} onClick={() => setCategoria(valor)} className={`chip ${clase}`}>
              <IconoCategoria categoria={valor} className="size-4" />
              {corta}
            </button>
          ))}
        </div>
      </div>

      {!esEscritorio && (
        <div role="group" aria-label="Forma de ver los reportes" className="grid grid-cols-2 gap-2">
          {[['lista', 'Lista'], ['mapa', 'Mapa']].map(([valor, etiqueta]) => (
            <button key={valor} type="button" aria-pressed={pestaña === valor} onClick={() => setPestaña(valor)} className={`btn ${pestaña === valor ? 'btn-primario' : 'btn-borde'}`}>
              {etiqueta}
            </button>
          ))}
        </div>
      )}

      <AvisoEtico />

      <div className="grid gap-8 lg:grid-cols-2">
        {mostrarLista && (
          <section aria-label="Lista de reportes" aria-busy={cargando} tabIndex={esEscritorio ? 0 : undefined} className="flex flex-col lg:max-h-[75vh] lg:overflow-y-auto lg:pr-2">
            <p role="status" className="border-b border-linea pb-2 text-sm text-suave">
              {cargando && 'Cargando reportes…'}
              {!cargando && !error && reportes.length === 0 && '0 reportes'}
              {!cargando && !error && reportes.length > 0 && `${reportes.length} ${reportes.length === 1 ? 'reporte' : 'reportes'}, del más cercano al más lejano`}
            </p>
            {error && (
              <div className="mt-3">
                <Alert tono="error" rol="alert">
                  <p>{error}</p>
                  <button type="button" className="btn btn-borde mt-2" onClick={cargar}>Reintentar</button>
                </Alert>
              </div>
            )}
            {!cargando && !error && reportes.length === 0 && (
              <div className="py-8">
                <p className="font-serif text-2xl">Aún no hay reportes con estos filtros.</p>
                <p className="mt-2 text-suave">Eso no significa que la zona sea segura. Si conoces un punto de riesgo, repórtalo.</p>
              </div>
            )}
            {reportes.slice(0, visibles).map((reporte) => (
              <div id={`reporte-${reporte.id}`} key={reporte.id}>
                <ReportCard reporte={reporte} seleccionado={reporte.id === seleccionadoId}>
                  <AccionesReporte reporte={reporte} alConfirmar={alConfirmar} />
                </ReportCard>
              </div>
            ))}
            {visibles < reportes.length && (
              <button type="button" className="btn btn-borde mt-4" onClick={() => setVisibles((v) => v + TAMAÑO_PAGINA)}>
                Ver más reportes
              </button>
            )}
          </section>
        )}

        {mostrarMapa && (
          <section aria-label="Mapa de reportes" className="h-[60vh] lg:sticky lg:top-20 lg:h-[75vh]">
            <ErrorBoundary respaldo={<AvisoMapa>El mapa no está disponible en este momento. La lista de reportes sigue funcionando.</AvisoMapa>}>
              <Suspense fallback={<AvisoMapa>Cargando mapa…</AvisoMapa>}>
                {origen ? (
                  <ReportMap reportes={reportes} origen={origen} alSeleccionar={seleccionar} />
                ) : (
                  <AvisoMapa>Cargando mapa…</AvisoMapa>
                )}
              </Suspense>
            </ErrorBoundary>
          </section>
        )}
      </div>
    </div>
  );
}
