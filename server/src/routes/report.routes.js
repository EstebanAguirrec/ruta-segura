import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { requerirSesion } from '../middleware/auth.js';

export const reportRoutes = Router();

reportRoutes.use(requerirSesion);
reportRoutes.get('/', reportController.listar);
reportRoutes.post('/', reportController.crear);
