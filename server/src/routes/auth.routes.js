import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authController } from '../controllers/auth.controller.js';

// Solo cuentan los intentos fallidos, para no bloquear a un grupo detrás de la misma IP.
const limitarIntentos = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos' },
});

export const authRoutes = Router();

authRoutes.post('/registro', limitarIntentos, authController.registro);
authRoutes.post('/login', limitarIntentos, authController.login);
authRoutes.post('/refresh', authController.refresh);
authRoutes.post('/logout', authController.logout);
