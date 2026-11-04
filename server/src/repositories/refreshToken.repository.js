import { db } from '../db/connection.js';

const insertar = db.prepare('INSERT INTO refresh_tokens (usuariaId, tokenHash, expiraEn) VALUES (?, ?, ?)');
const consumir = db.prepare('DELETE FROM refresh_tokens WHERE tokenHash = ? RETURNING usuariaId, expiraEn');
const purgar = db.prepare('DELETE FROM refresh_tokens WHERE expiraEn <= ?');

export const refreshTokenRepository = {
  crear: (usuariaId, tokenHash, expiraEn) => insertar.run(usuariaId, tokenHash, expiraEn),
  // Borra y devuelve el token en un solo paso: cada refresh token sirve una sola vez.
  consumir: (tokenHash) => consumir.get(tokenHash),
  purgarVencidos: (ahora) => purgar.run(ahora),
};
