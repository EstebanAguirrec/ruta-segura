import { CATEGORIAS, FRANJAS } from '../constantes.js';

const ENTIDADES = { '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&amp;': '&' };

// La API entrega el texto escapado. React vuelve a escapar al renderizar, así que aquí
// se decodifica una sola pasada para mostrarlo legible; nunca se inserta como HTML.
export function textoPlano(texto) {
  return texto?.replace(/&(?:lt|gt|quot|#39|amp);/g, (e) => ENTIDADES[e]) ?? '';
}

const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ReportCard({ reporte, seleccionado = false, compacta = false }) {
  const categoria = CATEGORIAS[reporte.categoria] ?? CATEGORIAS.otro;
  const confirmaciones = reporte.confirmaciones === 1 ? '1 confirmación' : `${reporte.confirmaciones} confirmaciones`;
  return (
    <article className={compacta ? 'text-slate-900' : `rounded-xl border bg-white p-3 shadow-sm ${seleccionado ? 'border-violet-800 ring-2 ring-violet-800' : 'border-slate-300'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-sm font-semibold ${categoria.insignia}`}>
          <span aria-hidden="true">{categoria.icono}</span> {categoria.etiqueta}
        </span>
        {reporte.distanciaKm !== undefined && (
          <span className="text-sm font-semibold text-slate-800">{reporte.distanciaKm.toFixed(1)} km</span>
        )}
      </div>
      <h3 className="mt-2 font-bold break-words">{textoPlano(reporte.puntoReferencia)}</h3>
      <p className="text-sm text-slate-700">
        {reporte.municipio} · {FRANJAS[reporte.franjaHoraria]} · {formatoFecha.format(new Date(reporte.creadoEn))}
      </p>
      {reporte.descripcion && <p className="mt-2 text-sm break-words text-slate-800">{textoPlano(reporte.descripcion)}</p>}
      {reporte.ubicacionAproximada && (
        <p className="mt-2 text-sm text-slate-700">Ubicación aproximada: centro del municipio.</p>
      )}
      <p className="mt-2 text-sm text-slate-700">{confirmaciones} · Por {reporte.alias}</p>
    </article>
  );
}
