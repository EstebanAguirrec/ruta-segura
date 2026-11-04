import { Router } from 'express';
import { moderacionController } from '../controllers/moderacion.controller.js';
import { requerirModeradora, requerirSesion } from '../middleware/auth.js';

export const moderacionRoutes = Router();

moderacionRoutes.use(requerirSesion, requerirModeradora);
moderacionRoutes.get('/denuncias', moderacionController.listar);
moderacionRoutes.post('/denuncias/:id', moderacionController.resolver);
