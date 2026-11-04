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

export function requerirModeradora(req, _res, next) {
  if (req.usuaria.rol !== 'moderadora') throw new HttpError(403, 'Solo las moderadoras pueden hacer esto');
  next();
}
