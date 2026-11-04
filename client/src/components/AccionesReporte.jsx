import { useState } from 'react';
import { api } from '../api/client.js';

const MAX_MOTIVO = 280;

// RF-09 y RF-10. No se muestran en los reportes propios: la API los rechazaría.
export default function AccionesReporte({ reporte, alConfirmar }) {
  const [enviando, setEnviando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState(null);
  const [error, setError] = useState(null);
  const [denunciado, setDenunciado] = useState(false);

  if (reporte.esMio) return null;
  const idMotivo = `motivo-${reporte.id}`;

  const confirmar = async () => {
    setEnviando(true);
    setError(null);
    try {
      alConfirmar(reporte.id, await api.confirmarReporte(reporte.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const denunciar = async (evento) => {
    evento.preventDefault();
    const largo = motivo.trim().length;
    if (largo < 5 || largo > MAX_MOTIVO) {
      setErrorMotivo(`Escribe entre 5 y ${MAX_MOTIVO} caracteres`);
      document.getElementById(idMotivo)?.focus();
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await api.denunciarReporte(reporte.id, motivo);
      setDenunciado(true);
      setAbierto(false);
    } catch (e) {
      if (e.status === 409) {
        setDenunciado(true);
        setAbierto(false);
      } else if (e.campos.motivo) {
        setErrorMotivo(e.campos.motivo);
      } else {
        setError(e.message);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-borde text-sm" onClick={confirmar} disabled={enviando || reporte.confirmadoPorMi}>
          {reporte.confirmadoPorMi ? 'Ya lo confirmaste' : 'A mí también me pasó'}
        </button>
        {!denunciado && (
          <button type="button" aria-expanded={abierto} className="btn text-sm font-normal text-suave underline hover:bg-superficie-2" onClick={() => setAbierto((a) => !a)}>
            Denunciar
          </button>
        )}
      </div>

      {denunciado && <p role="status" className="mt-2 text-sm text-exito">Denuncia enviada. La revisará una moderadora.</p>}
      {error && <p role="alert" className="error-campo">{error}</p>}

      {abierto && (
        <form onSubmit={denunciar} noValidate className="mt-3 flex flex-col gap-2 border-l-4 border-linea-fuerte pl-3">
          <div>
            <label htmlFor={idMotivo} className="etiqueta text-sm">¿Por qué es falso u ofensivo?</label>
            <textarea
              id={idMotivo}
              rows={2}
              maxLength={MAX_MOTIVO}
              className="campo"
              value={motivo}
              aria-invalid={errorMotivo ? 'true' : undefined}
              aria-describedby={errorMotivo ? `${idMotivo}-error` : undefined}
              onChange={(e) => {
                setMotivo(e.target.value);
                setErrorMotivo(null);
              }}
            />
            {errorMotivo && <p id={`${idMotivo}-error`} className="error-campo">{errorMotivo}</p>}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primario flex-1 text-sm" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar denuncia'}
            </button>
            <button type="button" className="btn btn-borde text-sm" onClick={() => setAbierto(false)} disabled={enviando}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
