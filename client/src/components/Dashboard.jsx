import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { CATEGORIAS } from '../constantes.js';
import Alert, { AvisoEtico } from './Alert.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
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
  <div className="flex h-full min-h-40 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 p-4 text-center text-sm text-slate-800">
    {children}
  </div>
);

export default function Dashboard({ usuaria, municipios, mensaje, alCerrarMensaje, alReportar }) {
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

  const mostrarLista = esEscritorio || pestaña === 'lista';
  const mostrarMapa = esEscritorio || pestaña === 'mapa';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-violet-950">Reportes cerca</h1>
        <button type="button" className="btn-primario" onClick={alReportar}>
          <span aria-hidden="true">+</span> Reportar
        </button>
      </div>

      {mensaje && <Alert tono="exito" rol="status">{mensaje}</Alert>}
      <AvisoEtico />

      <form className="grid gap-3 rounded-xl border border-slate-300 bg-white p-3 sm:grid-cols-3 sm:items-end" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="filtro-origen" className="etiqueta">Cerca de</label>
          <select id="filtro-origen" className="campo" value={origenId} onChange={(e) => setOrigenId(e.target.value)}>
            {municipios.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filtro-categoria" className="etiqueta">Categoría</label>
          <select id="filtro-categoria" className="campo" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(CATEGORIAS).map(([valor, { etiqueta }]) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </select>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" className="size-6 shrink-0 accent-violet-800" checked={soloMunicipio} onChange={(e) => setSoloMunicipio(e.target.checked)} />
          <span>Solo este municipio</span>
        </label>
      </form>

      {!esEscritorio && (
        <div role="group" aria-label="Forma de ver los reportes" className="grid grid-cols-2 gap-2">
          {[['lista', 'Lista'], ['mapa', 'Mapa']].map(([valor, etiqueta]) => (
            <button key={valor} type="button" aria-pressed={pestaña === valor} onClick={() => setPestaña(valor)} className={pestaña === valor ? 'btn-primario' : 'btn-secundario'}>
              {etiqueta}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {mostrarLista && (
          <section aria-label="Lista de reportes" aria-busy={cargando} className="flex flex-col gap-3 lg:max-h-[75vh] lg:overflow-y-auto lg:pr-1">
            <p role="status" className="text-sm text-slate-700">
              {cargando ? 'Cargando reportes…' : !error && `${reportes.length} ${reportes.length === 1 ? 'reporte' : 'reportes'}`}
            </p>
            {error && (
              <Alert tono="error" rol="alert">
                <p>{error}</p>
                <button type="button" className="btn-secundario mt-2" onClick={cargar}>Reintentar</button>
              </Alert>
            )}
            {!cargando && !error && reportes.length === 0 && (
              <div className="rounded-xl border border-slate-300 bg-white p-4 text-center">
                <p className="font-semibold">Aún no hay reportes con estos filtros.</p>
                <p className="mt-1 text-sm text-slate-700">Eso no significa que la zona sea segura. Si conoces un punto de riesgo, repórtalo.</p>
              </div>
            )}
            {reportes.slice(0, visibles).map((reporte) => (
              <div id={`reporte-${reporte.id}`} key={reporte.id}>
                <ReportCard reporte={reporte} seleccionado={reporte.id === seleccionadoId} />
              </div>
            ))}
            {visibles < reportes.length && (
              <button type="button" className="btn-secundario" onClick={() => setVisibles((v) => v + TAMAÑO_PAGINA)}>
                Ver más reportes
              </button>
            )}
          </section>
        )}

        {mostrarMapa && (
          <section aria-label="Mapa de reportes" className="h-[60vh] lg:sticky lg:top-4 lg:h-[75vh]">
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
