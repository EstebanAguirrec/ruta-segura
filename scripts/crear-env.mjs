// Crea server/.env a partir de la plantilla, con un JWT_SECRET aleatorio. No toca un .env existente.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const servidor = path.resolve(import.meta.dirname, '../server');
const destino = path.join(servidor, '.env');

if (fs.existsSync(destino)) {
  console.log('server/.env ya existe; no se modifica.');
} else {
  const plantilla = fs.readFileSync(path.join(servidor, '.env.example'), 'utf8');
  const secreto = crypto.randomBytes(48).toString('base64url');
  fs.writeFileSync(destino, plantilla.replace(/^JWT_SECRET=\s*$/m, `JWT_SECRET=${secreto}`));
  console.log('server/.env creado con un JWT_SECRET aleatorio.');
}
