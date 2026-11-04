import { confirmacionRepository } from '../repositories/confirmacion.repository.js';
import { denunciaRepository } from '../repositories/denuncia.repository.js';
import { reportRepository } from '../repositories/report.repository.js';
import { HttpError, errorDeValidacion } from '../utils/http.js';

function autorDelReporte(reporteId) {
  const autora = reportRepository.autorSiVisible(reporteId);
  if (autora === undefined) throw new HttpError(404, 'Este reporte ya no está disponible');
  return autora;
}

export const participacionService = {
  // RF-09: la confirmación la agrega otra usuaria; repetirla no cambia el contador.
  confirmar(usuariaId, reporteId) {
    if (autorDelReporte(reporteId) === usuariaId) {
      throw new HttpError(403, 'No puedes confirmar tu propio reporte');
    }
    confirmacionRepository.crear(usuariaId, reporteId);
    return { confirmaciones: confirmacionRepository.contar(reporteId), confirmadoPorMi: true };
  },

  // RF-10: la denuncia queda pendiente y el reporte entra a la cola de moderación.
  denunciar(usuariaId, reporteId, motivo) {
    const texto = typeof motivo === 'string' ? motivo.trim() : '';
    if (texto.length < 5 || texto.length > 280) {
      throw errorDeValidacion({ motivo: 'Escribe entre 5 y 280 caracteres' });
    }
    if (autorDelReporte(reporteId) === usuariaId) {
      throw new HttpError(403, 'No puedes denunciar tu propio reporte');
    }
    if (denunciaRepository.existe(reporteId, usuariaId)) {
      throw new HttpError(409, 'Ya denunciaste este reporte');
    }
    denunciaRepository.crear(reporteId, usuariaId, texto);
  },
};
