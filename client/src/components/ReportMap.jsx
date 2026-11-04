import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { CATEGORIAS } from '../constantes.js';
import ReportCard, { textoPlano } from './ReportCard.jsx';

function icono(categoria) {
  const { color, icono: emoji } = CATEGORIAS[categoria] ?? CATEGORIAS.otro;
  return L.divIcon({
    className: '',
    html: `<div class="marcador" style="background:${color}">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function AjustarVista({ puntos, centro }) {
  const mapa = useMap();
  useEffect(() => {
    if (puntos.length) mapa.fitBounds(puntos, { padding: [32, 32], maxZoom: 14 });
    else mapa.setView(centro, 11);
  }, [mapa, puntos, centro]);
  return null;
}

// Se carga con React.lazy dentro de un ErrorBoundary: si Leaflet o las teselas fallan,
// la lista de reportes no se entera.
export default function ReportMap({ reportes, origen, alSeleccionar }) {
  const [tesela, setTesela] = useState(false);
  const iconos = useMemo(
    () => Object.fromEntries(Object.keys(CATEGORIAS).map((c) => [c, icono(c)])),
    [],
  );
  const puntos = useMemo(() => reportes.map((r) => [r.latitud, r.longitud]), [reportes]);
  const centro = useMemo(() => [origen.latitud, origen.longitud], [origen]);

  return (
    <div className="relative h-full min-h-80">
      <MapContainer center={centro} zoom={11} className="z-0 h-full min-h-80 w-full rounded-xl">
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
          eventHandlers={{ tileerror: () => setTesela(true), tileload: () => setTesela(false) }}
        />
        <AjustarVista puntos={puntos} centro={centro} />
        {reportes.map((reporte) => (
          <Marker
            key={reporte.id}
            position={[reporte.latitud, reporte.longitud]}
            icon={iconos[reporte.categoria] ?? iconos.otro}
            title={textoPlano(reporte.puntoReferencia)}
            alt={`${CATEGORIAS[reporte.categoria]?.etiqueta}: ${textoPlano(reporte.puntoReferencia)}`}
            eventHandlers={{ click: () => alSeleccionar(reporte.id) }}
          >
            <Popup>
              <ReportCard reporte={reporte} compacta />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {tesela && (
        <p role="status" className="absolute inset-x-2 bottom-2 z-[1000] rounded bg-white/95 p-2 text-sm text-slate-800 shadow">
          El mapa de fondo no está disponible. La lista sigue funcionando.
        </p>
      )}
    </div>
  );
}
