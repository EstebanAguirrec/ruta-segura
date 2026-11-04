import { municipioRepository } from '../repositories/municipio.repository.js';

export const municipioController = {
  listar(_req, res) {
    res.json({ municipios: municipioRepository.listar() });
  },
};
