import { db } from '../db/connection.js';

const insertar = db.prepare(`
  INSERT INTO usuarias (alias, email, passwordHash, municipioId, aceptaPoliticaEn)
  VALUES (@alias, @email, @passwordHash, @municipioId, @aceptaPoliticaEn)
`);
const porEmail = db.prepare(
  'SELECT id, alias, passwordHash, municipioId, rol FROM usuarias WHERE email = ?',
);
const porId = db.prepare('SELECT id, alias, municipioId, rol FROM usuarias WHERE id = ?');

export const usuariaRepository = {
  crear: (datos) => Number(insertar.run(datos).lastInsertRowid),
  // Solo para verificar credenciales: nunca devolver esta fila en una respuesta.
  buscarCredenciales: (email) => porEmail.get(email),
  buscarPorId: (id) => porId.get(id),
};
