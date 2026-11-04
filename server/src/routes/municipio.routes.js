import { Router } from 'express';
import { municipioController } from '../controllers/municipio.controller.js';

// Pública: el formulario de registro necesita la lista antes de que exista una sesión.
export const municipioRoutes = Router();

municipioRoutes.get('/', municipioController.listar);
