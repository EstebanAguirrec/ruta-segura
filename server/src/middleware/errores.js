import { HttpError } from '../utils/http.js';

export function rutaNoEncontrada(_req, _res, next) {
  next(new HttpError(404, 'Recurso no encontrado'));
}

// eslint-disable-next-line no-unused-vars -- Express identifica este middleware por sus 4 parámetros.
export function manejarErrores(error, _req, res, _next) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message, campos: error.campos });
  }
  // Errores de body-parser: JSON mal formado o cuerpo demasiado grande.
  if (error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: 'Solicitud inválida' });
  }
  console.error(error);
  res.status(500).json({ error: 'Ocurrió un error. Intenta de nuevo' });
}
