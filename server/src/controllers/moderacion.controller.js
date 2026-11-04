import { moderacionService } from '../services/moderacion.service.js';
import { HttpError } from '../utils/http.js';

export const moderacionController = {
  listar(_req, res) {
    res.json({ denuncias: moderacionService.listarPendientes() });
  },

  resolver(req, res) {
    if (!/^\d+$/.test(req.params.id)) throw new HttpError(404, 'Esta denuncia no existe');
    moderacionService.resolver(Number(req.params.id), req.body?.decision);
    res.status(204).end();
  },
};
