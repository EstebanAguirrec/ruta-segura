import { config } from '../config.js';
import { municipioRepository } from '../repositories/municipio.repository.js';
import { reportRepository } from '../repositories/report.repository.js';
import { haversineKm } from '../utils/haversine.js';
import { escaparHtml, errorDeValidacion } from '../utils/http.js';

export const CATEGORIAS = [
  'acoso_callejero', 'iluminacion_deficiente', 'zona_desolada', 'infraestructura_insegura', 'otro',
];
export const FRANJAS = ['18-21', '21-00', '00-03', '03-06'];

const INTERVALO_NOMINATIM_MS = 1000; // RR-04: máximo 1 petición por segundo.
const ESPERA_MAXIMA_MS = 5000; // Con más cola se usa el fallback, para no retrasar a la usuaria (RR-02).
const TIMEOUT_NOMINATIM_MS = 4000;
const RADIO_BUSQUEDA_GRADOS = 0.25; // Unos 28 km: evita aceptar un homónimo en otro lugar del país.
const TAMAÑO_CACHE = 1000;
const MAX_RESULTADOS = 1000;

const cache = new Map();
let siguienteTurno = 0;

// La reserva es síncrona, así que dos peticiones simultáneas nunca comparten turno.
function reservarTurno() {
  const ahora = Date.now();
  const turno = Math.max(ahora, siguienteTurno);
  if (turno - ahora > ESPERA_MAXIMA_MS) return null;
  siguienteTurno = turno + INTERVALO_NOMINATIM_MS;
  return turno - ahora;
}

function guardarEnCache(clave, valor) {
  if (cache.size >= TAMAÑO_CACHE) cache.delete(cache.keys().next().value);
  cache.set(clave, valor);
}

const normalizar = (texto) => texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// El viewbox no basta: OSM asigna el "Parque Principal" de Sibaté a la provincia de Soacha
// (`subregion`). Solo se acepta si el municipio aparece en los niveles que lo identifican.
function perteneceAlMunicipio(direccion, nombre) {
  const buscado = normalizar(nombre);
  return ['municipality', 'city', 'town', 'village', 'county']
    .map((nivel) => direccion?.[nivel])
    .filter(Boolean)
    .map(normalizar)
    // En ambos sentidos: "Sibaté ciudad" contiene "Sibaté"; "Villa de San Diego de Ubaté" contiene "Ubaté".
    .some((valor) => valor.includes(buscado) || buscado.includes(valor));
}

async function consultarNominatim(puntoReferencia, municipio) {
  const { latitud, longitud, nombre } = municipio;
  const parametros = new URLSearchParams({
    q: `${puntoReferencia}, ${nombre}, Cundinamarca, Colombia`,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'co',
    addressdetails: '1',
    bounded: '1',
    viewbox: [
      longitud - RADIO_BUSQUEDA_GRADOS, latitud + RADIO_BUSQUEDA_GRADOS,
      longitud + RADIO_BUSQUEDA_GRADOS, latitud - RADIO_BUSQUEDA_GRADOS,
    ].join(','),
  });
  const respuesta = await fetch(`${config.nominatim.url}?${parametros}`, {
    headers: { 'User-Agent': config.nominatim.userAgent, 'Accept-Language': 'es' },
    signal: AbortSignal.timeout(TIMEOUT_NOMINATIM_MS),
  });
  if (!respuesta.ok) throw new Error(`Nominatim respondió ${respuesta.status}`);

  const [resultado] = await respuesta.json();
  if (!resultado || !perteneceAlMunicipio(resultado.address, nombre)) return null;
  const coordenadas = { latitud: Number(resultado.lat), longitud: Number(resultado.lon) };
  return Number.isFinite(coordenadas.latitud) && Number.isFinite(coordenadas.longitud) ? coordenadas : null;
}

// RF-14. Nunca lanza: si Nominatim falla o no encuentra el lugar, devuelve las
// coordenadas del municipio para que publicar un reporte no dependa de un tercero.
export async function geocodificar(puntoReferencia, municipio) {
  const respaldo = { latitud: municipio.latitud, longitud: municipio.longitud };
  const clave = `${municipio.id}|${puntoReferencia.toLowerCase()}`;
  if (cache.has(clave)) return cache.get(clave) ?? respaldo;

  const espera = reservarTurno();
  if (espera === null) return respaldo;
  if (espera > 0) await new Promise((resolver) => setTimeout(resolver, espera));

  try {
    const coordenadas = await consultarNominatim(puntoReferencia, municipio);
    guardarEnCache(clave, coordenadas); // "No encontrado" también se guarda; un fallo de red, no.
    return coordenadas ?? respaldo;
  } catch (error) {
    console.warn(`Geocodificación no disponible, se usa el municipio: ${error.message}`);
    return respaldo;
  }
}

// Único punto de salida de un reporte hacia la API. El texto se guarda tal como se
// escribió (el geocodificador y los límites de longitud lo necesitan) y se escapa aquí.
function aRespuesta({ municipioLatitud, municipioLongitud, ...reporte }) {
  return {
    ...reporte,
    puntoReferencia: escaparHtml(reporte.puntoReferencia),
    descripcion: reporte.descripcion === null ? null : escaparHtml(reporte.descripcion),
    ubicacionAproximada: reporte.latitud === municipioLatitud && reporte.longitud === municipioLongitud,
  };
}

function validarReporte({ municipioId, puntoReferencia, categoria, franjaHoraria, descripcion }) {
  const campos = {};
  if (!Number.isInteger(municipioId)) campos.municipioId = 'Elige un municipio de la lista';
  const punto = typeof puntoReferencia === 'string' ? puntoReferencia.trim() : '';
  if (punto.length < 5 || punto.length > 120) {
    campos.puntoReferencia = 'Escribe entre 5 y 120 caracteres';
  }
  if (!CATEGORIAS.includes(categoria)) campos.categoria = 'Elige una categoría de la lista';
  if (!FRANJAS.includes(franjaHoraria)) campos.franjaHoraria = 'Elige una franja horaria de la lista';
  const tieneDescripcion = descripcion !== undefined && descripcion !== null;
  if (tieneDescripcion && (typeof descripcion !== 'string' || descripcion.trim().length > 280)) {
    campos.descripcion = 'Escribe máximo 280 caracteres';
  }
  if (Object.keys(campos).length) throw errorDeValidacion(campos);
  return {
    municipioId,
    puntoReferencia: punto,
    categoria,
    franjaHoraria,
    descripcion: (tieneDescripcion && descripcion.trim()) || null,
  };
}

export const reportService = {
  async crear(usuariaId, cuerpo) {
    const datos = validarReporte(cuerpo);
    const municipio = municipioRepository.buscarPorId(datos.municipioId);
    if (!municipio) throw errorDeValidacion({ municipioId: 'Elige un municipio de la lista' });

    // Las coordenadas nunca se aceptan del cliente.
    const coordenadas = await geocodificar(datos.puntoReferencia, municipio);
    const id = reportRepository.crear({ ...datos, ...coordenadas, usuariaId });
    return aRespuesta(reportRepository.buscarPorId(id));
  },

  // RF-05 y RF-06: distancia desde el municipio de origen, de menor a mayor.
  listarPorCercania({ origenId, municipioId, categoria }) {
    const origen = municipioRepository.buscarPorId(origenId);
    if (!origen) throw errorDeValidacion({ origenId: 'Elige un municipio de la lista' });
    if (categoria && !CATEGORIAS.includes(categoria)) {
      throw errorDeValidacion({ categoria: 'Elige una categoría de la lista' });
    }

    return reportRepository
      .listarVisibles({ municipioId, categoria })
      .map((reporte) => ({
        ...aRespuesta(reporte),
        distanciaKm: Number(
          haversineKm(origen.latitud, origen.longitud, reporte.latitud, reporte.longitud).toFixed(2),
        ),
      }))
      .sort((a, b) => a.distanciaKm - b.distanciaKm)
      .slice(0, MAX_RESULTADOS);
  },
};
