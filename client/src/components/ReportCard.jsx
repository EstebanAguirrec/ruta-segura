import { CATEGORIAS, FRANJAS } from '../constantes.js';
import { IconoCategoria } from './Iconos.jsx';

const ENTIDADES = { '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&amp;': '&' };

// La API entrega el texto escapado. React vuelve a escapar al renderizar, así que aquí
// se decodifica una sola pasada para mostrarlo legible; nunca se inserta como HTML.
export function textoPlano(texto) {
  return texto?.replace(/&(?:lt|gt|quot|#39|amp);/g, (e) => ENTIDADES[e]) ?? '';
}

const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

// Fila de la lista (o contenido del popup del mapa con `compacta`), no una tarjeta.
export default function ReportCard({ reporte, seleccionado = false, compacta = false }) {
  const categoria = CATEGORIAS[reporte.categoria] ?? CATEGORIAS.otro;
  const confirmaciones = reporte.confirmaciones === 1 ? '1 confirmación' : `${reporte.confirmaciones} confirmaciones`;
  return (
    <article className={`${categoria.clase} ${compacta ? '' : `border-b border-linea px-2 py-4 ${seleccionado ? 'bg-superficie-2' : ''}`}`}>
      <div className="flex items-start gap-3">
        <span className="insignia-cat"><IconoCategoria categoria={reporte.categoria} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-bold text-[var(--cat)]">{categoria.etiqueta}</p>
            {reporte.distanciaKm !== undefined && (
              <p className="shrink-0 text-sm font-bold">{reporte.distanciaKm.toFixed(1)} km</p>
            )}
          </div>
          <h2 className="font-sans text-lg leading-snug font-bold tracking-normal break-words">{textoPlano(reporte.puntoReferencia)}</h2>
          <p className="text-sm text-suave">
            {reporte.municipio} · {FRANJAS[reporte.franjaHoraria]} · {formatoFecha.format(new Date(reporte.creadoEn))}
          </p>
          {reporte.descripcion && <p className="mt-1 break-words">{textoPlano(reporte.descripcion)}</p>}
          {reporte.ubicacionAproximada && (
            <p className="mt-1 text-sm text-suave">Ubicación aproximada: centro del municipio.</p>
          )}
          <p className="mt-1 text-sm text-suave">{confirmaciones} · Por {reporte.alias}</p>
        </div>
      </div>
    </article>
  );
}
