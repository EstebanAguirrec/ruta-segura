import { config } from '../config.js';
import { authService } from '../services/auth.service.js';
import { HttpError, errorDeValidacion } from '../utils/http.js';

const COOKIE_REFRESH = 'rs_refresh';
const opcionesCookie = {
  httpOnly: true,
  secure: config.cookieSegura,
  sameSite: 'strict',
  path: '/api/auth',
};

function responderSesion(res, status, { accessToken, refreshToken, usuaria }) {
  res.cookie(COOKIE_REFRESH, refreshToken, {
    ...opcionesCookie,
    maxAge: config.refreshDias * 24 * 60 * 60 * 1000,
  });
  res.status(status).json({ accessToken, usuaria });
}

function validarRegistro({ alias, email, password, municipioId, aceptaPolitica }) {
  const campos = {};
  // Sin "@" ni puntos para que el alias público no pueda ser un correo (Ley 1581).
  if (typeof alias !== 'string' || !/^[\p{L}\p{N} _-]{3,30}$/u.test(alias.trim())) {
    campos.alias = 'Usa de 3 a 30 letras, números, espacios, guiones o guiones bajos';
  }
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    campos.email = 'Escribe un correo válido';
  }
  // bcrypt solo usa los primeros 72 bytes.
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) {
    campos.password = 'La contraseña debe tener entre 8 y 72 caracteres';
  }
  if (!Number.isInteger(municipioId)) campos.municipioId = 'Elige un municipio de la lista';
  if (aceptaPolitica !== true) campos.aceptaPolitica = 'Debes aceptar la política de tratamiento de datos';
  if (Object.keys(campos).length) throw errorDeValidacion(campos);
}

export const authController = {
  async registro(req, res) {
    const cuerpo = req.body ?? {};
    validarRegistro(cuerpo);
    const sesion = await authService.registrar({
      alias: cuerpo.alias.trim(),
      email: cuerpo.email.trim().toLowerCase(),
      password: cuerpo.password,
      municipioId: cuerpo.municipioId,
    });
    responderSesion(res, 201, sesion);
  },

  async login(req, res) {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new HttpError(401, 'Correo o contraseña incorrectos');
    }
    const sesion = await authService.iniciarSesion({ email: email.trim().toLowerCase(), password });
    responderSesion(res, 200, sesion);
  },

  refresh(req, res) {
    try {
      responderSesion(res, 200, authService.renovarSesion(req.cookies[COOKIE_REFRESH]));
    } catch (error) {
      res.clearCookie(COOKIE_REFRESH, opcionesCookie);
      throw error;
    }
  },

  logout(req, res) {
    authService.cerrarSesion(req.cookies[COOKIE_REFRESH]);
    res.clearCookie(COOKIE_REFRESH, opcionesCookie);
    res.status(204).end();
  },
};
