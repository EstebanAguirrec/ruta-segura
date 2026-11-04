const RADIO_TIERRA_KM = 6371;
const aRadianes = (grados) => (grados * Math.PI) / 180;

// Distancia en kilómetros sobre la superficie terrestre entre dos coordenadas.
export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = aRadianes(lat2 - lat1);
  const dLon = aRadianes(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
