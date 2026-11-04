import { authService } from '../services/auth.service.js';
import { HttpError } from '../utils/http.js';

export function requerirSesion(req, _res, next) {
  const [esquema, token] = (req.headers.authorization ?? '').split(' ');
  if (esquema !== 'Bearer' || !token) throw new HttpError(401, 'Inicia sesión para continuar');
  try {
    req.usuaria = authService.verificarAccessToken(token);
  } catch {
    throw new HttpError(401, 'Inicia sesión para continuar');
  }
  next();
}
