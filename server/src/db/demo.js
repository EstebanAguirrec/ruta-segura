import { db } from './connection.js';

// Datos ficticios para demostraciones. Se identifican como ejemplo en el alias y en la descripción
// para que nadie los tome por riesgos reales. La cuenta no admite login: su hash no es válido.
const EMAIL = 'datos-de-ejemplo@ruta-segura.invalid';
const ALIAS = 'Datos de ejemplo';

// [municipio, punto de referencia, categoría, franja, descripción, desfase de latitud, desfase de longitud]
const REPORTES = [
  ['Soacha', 'Puente peatonal de la autopista Sur', 'acoso_callejero', '21-00', 'Al bajar del puente hay grupos que hacen comentarios a quien pasa sola.', 0.006, 0.004],
  ['Soacha', 'Parque principal, costado norte', 'iluminacion_deficiente', '18-21', 'Dos postes apagados desde hace semanas.', 0.001, -0.001],
  ['Soacha', 'Paradero junto a la zona industrial', 'zona_desolada', '00-03', 'Poca gente después de la medianoche.', -0.012, 0.009],
  ['Sibaté', 'Calle del colegio, tramo sin andén', 'infraestructura_insegura', '18-21', 'Hay que caminar por la vía porque el andén está roto.', 0.002, -0.002],
  ['Mosquera', 'Salida de la estación de buses', 'acoso_callejero', '21-00', 'Comentarios frecuentes a la salida.', 0.003, 0.002],
  ['Madrid', 'Lote baldío de la entrada al pueblo', 'zona_desolada', '21-00', 'Sin casas ni comercio en unas tres cuadras.', -0.004, 0.006],
  ['Funza', 'Parque lineal, sendero del humedal', 'iluminacion_deficiente', '03-06', 'El sendero queda sin luz en la madrugada.', 0.005, -0.003],
  ['Facatativá', 'Túnel peatonal de la variante', 'otro', '18-21', 'Se inunda y queda oscuro cuando llueve.', -0.006, -0.004],
  ['Girardot', 'Malecón, tramo sur', 'zona_desolada', '00-03', 'Tramo solitario en la noche.', 0.004, 0.005],
  ['Zipaquirá', 'Paso bajo la vía férrea', 'infraestructura_insegura', '21-00', 'Paso estrecho y con poca visibilidad.', -0.003, 0.004],
];

const buscar = db.prepare('SELECT id FROM usuarias WHERE email = ?');

export const cargarDemo = db.transaction(() => {
  if (buscar.get(EMAIL)) return;
  const municipio = db.prepare('SELECT id, latitud, longitud FROM municipios WHERE nombre = ?');
  const { id: municipioId } = municipio.get('Soacha');
  const ahora = new Date().toISOString();
  const usuariaId = db.prepare(`
    INSERT INTO usuarias (alias, email, passwordHash, municipioId, aceptaPoliticaEn) VALUES (?, ?, '!', ?, ?)
  `).run(ALIAS, EMAIL, municipioId, ahora).lastInsertRowid;
  const insertar = db.prepare(`
    INSERT INTO reportes (usuariaId, municipioId, puntoReferencia, categoria, franjaHoraria, descripcion, latitud, longitud)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const [nombre, punto, categoria, franja, descripcion, dLat, dLon] of REPORTES) {
    const m = municipio.get(nombre);
    insertar.run(usuariaId, m.id, punto, categoria, franja, `Ejemplo, no es un reporte real: ${descripcion}`, m.latitud + dLat, m.longitud + dLon);
  }
});

// Borra la cuenta de ejemplo y, en cascada, sus reportes, confirmaciones y denuncias.
export function quitarDemo() {
  db.prepare('DELETE FROM usuarias WHERE email = ?').run(EMAIL);
}
