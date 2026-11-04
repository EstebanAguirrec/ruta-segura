import { db } from '../db/connection.js';

// Lista blanca de columnas: u.alias es el único dato de la autora que sale de esta capa.
// esMio y confirmadoPorMi son relativos a quien consulta y no revelan a quién pertenece el reporte.
const SELECT_REPORTE = `
  SELECT r.id, r.municipioId, m.nombre AS municipio, r.puntoReferencia, r.categoria,
         r.franjaHoraria, r.descripcion, r.latitud, r.longitud, r.creadoEn, u.alias,
         m.latitud AS municipioLatitud, m.longitud AS municipioLongitud,
         (SELECT COUNT(*) FROM confirmaciones c WHERE c.reporteId = r.id) AS confirmaciones,
         EXISTS (SELECT 1 FROM confirmaciones c WHERE c.reporteId = r.id AND c.usuariaId = @usuariaId) AS confirmadoPorMi,
         r.usuariaId = @usuariaId AS esMio
  FROM reportes r
  JOIN usuarias u ON u.id = r.usuariaId
  JOIN municipios m ON m.id = r.municipioId
`;

const insertar = db.prepare(`
  INSERT INTO reportes (usuariaId, municipioId, puntoReferencia, categoria, franjaHoraria, descripcion, latitud, longitud)
  VALUES (@usuariaId, @municipioId, @puntoReferencia, @categoria, @franjaHoraria, @descripcion, @latitud, @longitud)
`);
const porId = db.prepare(`${SELECT_REPORTE} WHERE r.id = @id`);
const visibles = db.prepare(`
  ${SELECT_REPORTE}
  WHERE r.estado = 'visible'
    AND (@municipioId IS NULL OR r.municipioId = @municipioId)
    AND (@categoria IS NULL OR r.categoria = @categoria)
`);
const autorSiVisible = db.prepare("SELECT usuariaId FROM reportes WHERE id = ? AND estado = 'visible'");
const ocultar = db.prepare("UPDATE reportes SET estado = 'oculto' WHERE id = ?");

export const reportRepository = {
  crear: (datos) => Number(insertar.run(datos).lastInsertRowid),
  buscarPorId: (id, usuariaId) => porId.get({ id, usuariaId }),
  listarVisibles: ({ municipioId = null, categoria = null, usuariaId }) => visibles.all({ municipioId, categoria, usuariaId }),
  // Solo para reglas internas: nunca devolver este id en una respuesta.
  autorSiVisible: (id) => autorSiVisible.get(id)?.usuariaId,
  ocultar: (id) => ocultar.run(id),
};
