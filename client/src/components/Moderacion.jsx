import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Alert from './Alert.jsx';
import ReportCard, { textoPlano } from './ReportCard.jsx';

// RF-11: la API también exige el rol moderadora; esta pantalla solo presenta la cola.
export default function Moderacion() {
  const [denuncias, setDenuncias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [resolviendo, setResolviendo] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDenuncias(await api.denunciasPendientes());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resolver = async (denuncia, decision) => {
    setResolviendo(denuncia.id);
    setError(null);
    setMensaje(null);
    try {
      await api.resolverDenuncia(denuncia.id, decision);
      setMensaje(decision === 'ocultar' ? 'Reporte oculto: ya no aparece en la lista ni en el mapa.' : 'Denuncia descartada: el reporte sigue visible.');
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setResolviendo(null);
    }
  };

  return (
    <section className="contenedor flex max-w-3xl flex-col gap-3 pt-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[1.75rem] lg:text-[2.25rem]">Moderación</h1>
        <a href="#/reportes" className="btn btn-borde text-sm">Ver reportes</a>
      </div>

      {mensaje && <Alert tono="exito" rol="status">{mensaje}</Alert>}
      {error && (
        <Alert tono="error" rol="alert">
          <p>{error}</p>
          <button type="button" className="btn btn-borde mt-2" onClick={cargar}>Reintentar</button>
        </Alert>
      )}

      <p role="status" className="border-b border-linea pb-2 text-sm text-suave">
        {cargando ? 'Cargando denuncias…' : !error && `${denuncias.length} ${denuncias.length === 1 ? 'denuncia pendiente' : 'denuncias pendientes'}`}
      </p>

      {!cargando && !error && denuncias.length === 0 && (
        <p className="py-8 font-serif text-2xl">No hay denuncias por revisar.</p>
      )}

      {denuncias.map((denuncia) => (
        <div key={denuncia.id} className="border-b border-linea pb-4">
          <ReportCard reporte={denuncia} compacta />
          <div className="mt-3 border-l-4 border-acento bg-superficie px-3 py-2">
            <p className="text-sm font-bold">Motivo de la denuncia</p>
            <p className="break-words">{textoPlano(denuncia.motivo)}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primario flex-1 text-sm sm:flex-none" disabled={resolviendo !== null} onClick={() => resolver(denuncia, 'ocultar')}>
              Ocultar reporte
            </button>
            <button type="button" className="btn btn-borde flex-1 text-sm sm:flex-none" disabled={resolviendo !== null} onClick={() => resolver(denuncia, 'descartar')}>
              Descartar denuncia
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
