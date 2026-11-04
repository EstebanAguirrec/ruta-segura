import fs from 'node:fs';
import path from 'node:path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { manejarErrores, rutaNoEncontrada } from './middleware/errores.js';
import { authRoutes } from './routes/auth.routes.js';
import { moderacionRoutes } from './routes/moderacion.routes.js';
import { municipioRoutes } from './routes/municipio.routes.js';
import { reportRoutes } from './routes/report.routes.js';

const CLIENTE_DIST = path.resolve(import.meta.dirname, '../../client/dist');

export const app = express();

app.set('trust proxy', config.proxiesConfiables);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", 'data:', 'https://tile.openstreetmap.org'],
        // HTTPS lo impone la plataforma de despliegue; esta directiva rompe la demo local en HTTP.
        upgradeInsecureRequests: null,
      },
    },
    // OpenStreetMap rechaza las teselas pedidas sin Referer (el valor por defecto de helmet lo elimina).
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);
app.use(compression()); // 1.000 reportes pesan 335 KB sin comprimir: demasiado para un celular de gama baja (RR-01).
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/municipios', municipioRoutes);
app.use('/api/reportes', reportRoutes);
app.use('/api/moderacion', moderacionRoutes);
app.use('/api', rutaNoEncontrada);

// En producción Express sirve la SPA: mismo origen, sin CORS y con SameSite=Strict funcionando.
if (fs.existsSync(CLIENTE_DIST)) {
  app.use(express.static(CLIENTE_DIST));
  app.get('/{*ruta}', (_req, res) => res.sendFile(path.join(CLIENTE_DIST, 'index.html')));
}

app.use(manejarErrores);
