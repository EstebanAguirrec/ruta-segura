import { usuariaRepository } from '../repositories/usuaria.repository.js';
import { participacionService } from '../services/participacion.service.js';
import { reportService } from '../services/report.service.js';
import { HttpError, errorDeValidacion } from '../utils/http.js';

function enteroOpcional(valor, campo) {
  if (valor === undefined || valor === '') return undefined;
  if (!/^\d+$/.test(String(valor))) throw errorDeValidacion({ [campo]: 'Elige un municipio de la lista' });
  return Number(valor);
}

function idDeRuta(valor) {
  if (!/^\d+$/.test(valor)) throw new HttpError(404, 'Este reporte ya no está disponible');
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
      usuariaId: req.usuaria.id,
    });
    res.json({ reportes });
  },

  async crear(req, res) {
    const reporte = await reportService.crear(req.usuaria.id, req.body ?? {});
    res.status(201).json({ reporte });
  },

  confirmar(req, res) {
    res.json(participacionService.confirmar(req.usuaria.id, idDeRuta(req.params.id)));
  },

  denunciar(req, res) {
    participacionService.denunciar(req.usuaria.id, idDeRuta(req.params.id), req.body?.motivo);
    res.status(201).json({ mensaje: 'Denuncia enviada' });
  },
};
