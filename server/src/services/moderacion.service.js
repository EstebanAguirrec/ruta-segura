import { db } from '../db/connection.js';
import { denunciaRepository } from '../repositories/denuncia.repository.js';
import { reportRepository } from '../repositories/report.repository.js';
import { HttpError, errorDeValidacion, escaparHtml } from '../utils/http.js';

function aRespuesta(denuncia) {
  return {
    ...denuncia,
    motivo: escaparHtml(denuncia.motivo),
    puntoReferencia: escaparHtml(denuncia.puntoReferencia),
    descripcion: denuncia.descripcion === null ? null : escaparHtml(denuncia.descripcion),
  };
}

export const moderacionService = {
  listarPendientes: () => denunciaRepository.listarPendientes().map(aRespuesta),

  // RF-11. Ocultar resuelve todas las denuncias pendientes del reporte; descartar, solo la elegida.
  resolver: db.transaction((denunciaId, decision) => {
    if (decision !== 'ocultar' && decision !== 'descartar') {
      throw errorDeValidacion({ decision: 'Elige ocultar o descartar' });
    }
    const denuncia = denunciaRepository.buscarPorId(denunciaId);
    if (!denuncia) throw new HttpError(404, 'Esta denuncia no existe');
    if (denuncia.estado !== 'pendiente') throw new HttpError(409, 'Esta denuncia ya fue resuelta');

    if (decision === 'ocultar') {
      reportRepository.ocultar(denuncia.reporteId);
      denunciaRepository.aceptarPendientes(denuncia.reporteId);
    } else {
      denunciaRepository.descartar(denunciaId);
    }
  }),
};
