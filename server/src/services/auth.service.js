import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/connection.js';
import { municipioRepository } from '../repositories/municipio.repository.js';
import { refreshTokenRepository } from '../repositories/refreshToken.repository.js';
import { usuariaRepository } from '../repositories/usuaria.repository.js';
import { HttpError, errorDeValidacion } from '../utils/http.js';

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const CREDENCIALES_INVALIDAS = 'Correo o contraseña incorrectos';

// Se compara contra este hash cuando el correo no existe, para que el tiempo de
// respuesta no revele qué correos están registrados.
const HASH_SEÑUELO = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), config.bcryptRondas);

const hashearToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Lista blanca de lo que la API puede decir de una usuaria: nunca email ni passwordHash.
const perfilPublico = ({ id, alias, municipioId, rol }) => ({ id, alias, municipioId, rol });

function abrirSesion(usuaria) {
  const accessToken = jwt.sign({ rol: usuaria.rol }, config.jwtSecret, {
    algorithm: 'HS256',
    subject: String(usuaria.id),
    expiresIn: config.jwtExpiraEn,
  });
  const refreshToken = crypto.randomBytes(48).toString('base64url');
  const expiraEn = new Date(Date.now() + config.refreshDias * MS_POR_DIA).toISOString();
  refreshTokenRepository.crear(usuaria.id, hashearToken(refreshToken), expiraEn);
  return { accessToken, refreshToken, usuaria: perfilPublico(usuaria) };
}

export const authService = {
  async registrar({ alias, email, password, municipioId }) {
    if (!municipioRepository.buscarPorId(municipioId)) {
      throw errorDeValidacion({ municipioId: 'Elige un municipio de la lista' });
    }
    const passwordHash = await bcrypt.hash(password, config.bcryptRondas);
    let id;
    try {
      // La fecha la fija el servidor: el controlador ya exigió aceptaPolitica === true.
      const aceptaPoliticaEn = new Date().toISOString();
      id = usuariaRepository.crear({ alias, email, passwordHash, municipioId, aceptaPoliticaEn });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new HttpError(409, 'Revisa los campos marcados', { email: 'Este correo ya está registrado' });
      }
      throw error;
    }
    return abrirSesion(usuariaRepository.buscarPorId(id));
  },

  async iniciarSesion({ email, password }) {
    const credenciales = usuariaRepository.buscarCredenciales(email);
    const valida = await bcrypt.compare(password, credenciales?.passwordHash ?? HASH_SEÑUELO);
    if (!credenciales || !valida) throw new HttpError(401, CREDENCIALES_INVALIDAS);
    refreshTokenRepository.purgarVencidos(new Date().toISOString());
    return abrirSesion(credenciales);
  },

  // Rotación: el token recibido se consume y se emite uno nuevo en la misma transacción.
  renovarSesion: db.transaction((refreshToken) => {
    const fila = refreshToken && refreshTokenRepository.consumir(hashearToken(refreshToken));
    if (!fila || new Date(fila.expiraEn) <= new Date()) {
      throw new HttpError(401, 'La sesión venció. Inicia sesión de nuevo');
    }
    return abrirSesion(usuariaRepository.buscarPorId(fila.usuariaId));
  }),

  cerrarSesion(refreshToken) {
    if (refreshToken) refreshTokenRepository.consumir(hashearToken(refreshToken));
  },

  verificarAccessToken(token) {
    const { sub, rol } = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    return { id: Number(sub), rol };
  },
};
