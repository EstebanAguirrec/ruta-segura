import { db } from '../db/connection.js';

const insertar = db.prepare('INSERT OR IGNORE INTO confirmaciones (usuariaId, reporteId) VALUES (?, ?)');
const contar = db.prepare('SELECT COUNT(*) AS total FROM confirmaciones WHERE reporteId = ?');

export const confirmacionRepository = {
  // La clave primaria (usuariaId, reporteId) garantiza una sola confirmación por usuaria (RF-09).
  crear: (usuariaId, reporteId) => insertar.run(usuariaId, reporteId),
  contar: (reporteId) => contar.get(reporteId).total,
};
