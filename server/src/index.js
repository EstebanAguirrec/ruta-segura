import { app } from './app.js';
import { config } from './config.js';
import { usuariaRepository } from './repositories/usuaria.repository.js';

config.moderadoras.forEach((email) => usuariaRepository.promoverModeradora(email));

app.listen(config.puerto, () => {
  console.log(`API de Ruta Segura en http://localhost:${config.puerto}`);
});
