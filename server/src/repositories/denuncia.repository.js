import { db } from '../db/connection.js';

const insertar = db.prepare('INSERT INTO denuncias (reporteId, usuariaId, motivo) VALUES (?, ?, ?)');
const existe = db.prepare('SELECT 1 FROM denuncias WHERE reporteId = ? AND usuariaId = ?');
const porId = db.prepare('SELECT id, reporteId, estado FROM denuncias WHERE id = ?');
const cambiarEstado = db.prepare('UPDATE denuncias SET estado = ? WHERE id = ?');
const aceptarPendientes = db.prepare("UPDATE denuncias SET estado = 'aceptada' WHERE reporteId = ? AND estado = 'pendiente'");

// La cola muestra al alias autor del reporte, nunca quién denunció ni correos.
const pendientes = db.prepare(`
  SELECT d.id, d.motivo, d.reporteId, r.puntoReferencia, r.categoria, r.franjaHoraria,
         r.descripcion, r.creadoEn, m.nombre AS municipio, u.alias
  FROM denuncias d
  JOIN reportes r ON r.id = d.reporteId
  JOIN municipios m ON m.id = r.municipioId
  JOIN usuarias u ON u.id = r.usuariaId
  WHERE d.estado = 'pendiente' AND r.estado = 'visible'
  ORDER BY d.id
`);

export const denunciaRepository = {
  crear: (reporteId, usuariaId, motivo) => insertar.run(reporteId, usuariaId, motivo),
  existe: (reporteId, usuariaId) => Boolean(existe.get(reporteId, usuariaId)),
  buscarPorId: (id) => porId.get(id),
  listarPendientes: () => pendientes.all(),
  descartar: (id) => cambiarEstado.run('descartada', id),
  aceptarPendientes: (reporteId) => aceptarPendientes.run(reporteId),
};
