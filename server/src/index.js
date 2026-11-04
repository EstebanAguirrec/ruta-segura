import { app } from './app.js';
import { config } from './config.js';

app.listen(config.puerto, () => {
  console.log(`API de Ruta Segura en http://localhost:${config.puerto}`);
});
