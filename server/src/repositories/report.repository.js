import { db } from '../db/connection.js';

// Lista blanca de columnas: u.alias es el único dato de la autora que sale de esta capa.
const SELECT_REPORTE = `
  SELECT r.id, r.municipioId, m.nombre AS municipio, r.puntoReferencia, r.categoria,
         r.franjaHoraria, r.descripcion, r.latitud, r.longitud, r.creadoEn, u.alias,
         m.latitud AS municipioLatitud, m.longitud AS municipioLongitud,
         (SELECT COUNT(*) FROM confirmaciones c WHERE c.reporteId = r.id) AS confirmaciones
  FROM reportes r
  JOIN usuarias u ON u.id = r.usuariaId
  JOIN municipios m ON m.id = r.municipioId
`;

const insertar = db.prepare(`
  INSERT INTO reportes (usuariaId, municipioId, puntoReferencia, categoria, franjaHoraria, descripcion, latitud, longitud)
  VALUES (@usuariaId, @municipioId, @puntoReferencia, @categoria, @franjaHoraria, @descripcion, @latitud, @longitud)
`);
const porId = db.prepare(`${SELECT_REPORTE} WHERE r.id = ?`);
const visibles = db.prepare(`
  ${SELECT_REPORTE}
  WHERE r.estado = 'visible'
    AND (@municipioId IS NULL OR r.municipioId = @municipioId)
    AND (@categoria IS NULL OR r.categoria = @categoria)
`);

export const reportRepository = {
  crear: (datos) => Number(insertar.run(datos).lastInsertRowid),
  buscarPorId: (id) => porId.get(id),
  listarVisibles: ({ municipioId = null, categoria = null }) => visibles.all({ municipioId, categoria }),
};
