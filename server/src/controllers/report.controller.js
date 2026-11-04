import { usuariaRepository } from '../repositories/usuaria.repository.js';
import { reportService } from '../services/report.service.js';
import { errorDeValidacion } from '../utils/http.js';

function enteroOpcional(valor, campo) {
  if (valor === undefined || valor === '') return undefined;
  if (!/^\d+$/.test(String(valor))) throw errorDeValidacion({ [campo]: 'Elige un municipio de la lista' });
  return Number(valor);
}

export const reportController = {
  // GET /api/reportes?origenId=&municipioId=&categoria=
  // origenId es desde dónde se mide la distancia (por defecto, el municipio de la usuaria);
  // municipioId, si llega, filtra los reportes de ese municipio.
  listar(req, res) {
    const origenId =
      enteroOpcional(req.query.origenId, 'origenId') ?? usuariaRepository.buscarPorId(req.usuaria.id)?.municipioId;
    const reportes = reportService.listarPorCercania({
      origenId,
      municipioId: enteroOpcional(req.query.municipioId, 'municipioId'),
      categoria: typeof req.query.categoria === 'string' && req.query.categoria ? req.query.categoria : undefined,
    });
    res.json({ reportes });
  },

  async crear(req, res) {
    const reporte = await reportService.crear(req.usuaria.id, req.body ?? {});
    res.status(201).json({ reporte });
  },
};
