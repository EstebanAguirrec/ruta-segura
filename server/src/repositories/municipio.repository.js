import { db } from '../db/connection.js';

// El id sigue el orden alfabético en español de municipios.json; ORDER BY nombre ordenaría por bytes ("Chía" tras "Chocontá").
const listar = db.prepare('SELECT id, codigoDane, nombre, latitud, longitud FROM municipios ORDER BY id');
const porId = db.prepare('SELECT id, codigoDane, nombre, latitud, longitud FROM municipios WHERE id = ?');

export const municipioRepository = {
  listar: () => listar.all(),
  buscarPorId: (id) => porId.get(id),
};
