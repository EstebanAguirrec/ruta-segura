import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET es obligatorio y debe tener al menos 32 caracteres (ver server/.env.example).');
}

export const config = {
  puerto: Number(process.env.PORT) || 3001,
  dbPath: process.env.DB_PATH || 'data/ruta-segura.db',
  jwtSecret: JWT_SECRET,
  jwtExpiraEn: '15m',
  refreshDias: Number(process.env.REFRESH_DIAS) || 7,
  bcryptRondas: Number(process.env.BCRYPT_ROUNDS) || 12,
  // Solo se desactiva para probar en HTTP fuera de localhost (por ejemplo, Safari o un celular en la LAN).
  cookieSegura: process.env.COOKIE_SECURE !== 'false',
  // Número de proxies delante de la API (Render, Railway...), para limitar por IP real.
  proxiesConfiables: Number(process.env.TRUST_PROXY) || 0,
  // Correos separados por comas. Se promueven al arrancar: regístralos antes, porque no hay verificación de correo.
  moderadoras: (process.env.MODERADORAS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean),
  nominatim: {
    url: process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search',
    // La política de Nominatim exige identificar la aplicación.
    userAgent: process.env.NOMINATIM_USER_AGENT || 'RutaSegura/1.0 (MVP maraton de programacion)',
  },
};
