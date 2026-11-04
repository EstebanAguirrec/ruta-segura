# Ruta Segura

SPA colaborativa para reportar y consultar puntos de riesgo nocturno para mujeres en los 116 municipios de Cundinamarca.

> La ausencia de reportes no significa que una zona sea segura. Ruta Segura no reemplaza la **Línea 155** (orientación a mujeres) ni la **Línea 123** (emergencias).

**Stack:** React + Vite + TailwindCSS + react-leaflet · Node.js + Express · SQLite · OpenStreetMap + Nominatim.

## Puesta en marcha

Requisito: Node.js 20.11 o superior.

Ejecuta estos comandos dentro de la carpeta del proyecto, donde está `package.json`.

**1. Instala las dependencias** (es un monorepo con npm workspaces):

```bash
npm install
```

**2. Crea `server/.env`** con un `JWT_SECRET` aleatorio, sin el cual el servidor no arranca:

```bash
npm run setup
```

Luego cambia el contacto de `NOMINATIM_USER_AGENT`. Estas son las variables disponibles:

| Variable | Obligatoria | Por defecto | Para qué sirve |
| --- | --- | --- | --- |
| `JWT_SECRET` | Sí | | Firma los JWT. Mínimo 32 caracteres. |
| `PORT` | No | `3001` | Puerto de la API. Si lo cambias, ajusta el proxy en `client/vite.config.js`. |
| `DB_PATH` | No | `data/ruta-segura.db` | Archivo SQLite, relativo a `server/`. |
| `REFRESH_DIAS` | No | `7` | Vigencia del refresh token. |
| `BCRYPT_ROUNDS` | No | `12` | Costo de bcrypt. |
| `COOKIE_SECURE` | No | `true` | Ponlo en `false` solo para probar en HTTP fuera de localhost (Safari o un celular en la LAN). |
| `TRUST_PROXY` | No | `0` | Proxies delante de la API. En Render o Railway suele ser `1`. |
| `NOMINATIM_USER_AGENT` | Recomendada | genérico | Nominatim exige identificar la aplicación. Incluye un contacto del equipo. |

**3. Ejecuta en desarrollo:**

```bash
npm run dev
```

Abre <http://localhost:5173>. La base de datos, las tablas y los 116 municipios se crean solos en el primer arranque.

**Pruebas de la API** (usan una base en memoria y un Nominatim falso):

```bash
npm test
```

**Producción** (Express sirve la API y la SPA en <http://localhost:3001>, con el mismo origen):

```bash
npm run build
```

```bash
npm start
```

Despliega como un solo servicio y con HTTPS: la cookie de sesión es `Secure` y `SameSite=Strict`, así que no funciona con la API y la SPA en dominios distintos.

**Datos en la nube:** SQLite es un archivo, así que necesita un disco persistente.

- **Railway** (`railway.json`): agrega un volumen montado en `/data` y define `DB_PATH=/data/ruta-segura.db`, `JWT_SECRET` y `TRUST_PROXY=1`.
- **Render** (`render.yaml`): el plan gratuito no conserva el disco, y cuentas y reportes se borran al reiniciar o tras 15 minutos sin visitas. Sirve solo para una demo.

**Publicar en GitHub** (requiere `gh auth login`; crea un repositorio privado salvo que pases `--public`):

```bash
./setup.sh ruta-segura
```

## Arquitectura

El proyecto sigue el flujo Modelo-Vista-Controlador del diagrama de secuencia: la **Vista** es la SPA, el **Controlador** es la capa HTTP de Express y el **Modelo** son los servicios y repositorios sobre SQLite.

```text
 Navegador (Vista)                 Servidor Express                          Datos
┌──────────────────┐  JSON/HTTPS  ┌────────────────────────────────────┐   ┌────────┐
│ React + Vite     │  Bearer JWT  │ routes/       qué URL y qué permiso│   │ SQLite │
│  Dashboard       │─────────────►│ controllers/  HTTP de entrada/salida│  └───▲────┘
│  ├ Lista (core)  │  Cookie      │ services/     reglas de negocio    │       │
│  └ Mapa (lazy)   │◄─────────────│ repositories/ SQL parametrizado ───┼───────┘
│  ReportForm      │  HttpOnly    └───────────────┬────────────────────┘
└────────┬─────────┘                              │ máx. 1 petición/s, con caché
         │ teselas                                ▼
         ▼                                    Nominatim
   OpenStreetMap
```

Crear un reporte: `ReportForm` → `POST /api/reportes` → `requerirSesion` → `report.controller` → `report.service` (valida y geocodifica) → `report.repository` → respuesta → "Reporte publicado" → se actualizan lista y mapa.

```text
server/src/
  routes/  controllers/  services/  repositories/  middleware/  utils/
  db/schema.sql         Esquema de las 6 tablas
  db/municipios.json    116 municipios (DIVIPOLA, datos.gov.co, dataset gdxc-w37w)
client/src/
  api/client.js         Fetch, JWT en memoria y renovación de sesión
  components/           Dashboard, ReportForm, ReportMap, ReportCard, AuthForm...
```

## API

| Método y ruta | Sesión | Descripción |
| --- | --- | --- |
| `POST /api/auth/registro` | No | Crea la cuenta y abre sesión (RF-01). |
| `POST /api/auth/login` | No | Devuelve el JWT de 15 min y la cookie de refresh (RF-02). |
| `POST /api/auth/refresh` | Cookie | Rota el refresh token y emite un JWT nuevo (RF-13). |
| `POST /api/auth/logout` | Cookie | Invalida el refresh token (RF-03). |
| `GET /api/municipios` | No | Lista de municipios para los formularios. |
| `GET /api/reportes?origenId=&municipioId=&categoria=` | JWT | Lista por cercanía con Haversine (RF-05, RF-06). `origenId` es desde dónde se mide; `municipioId` filtra. |
| `POST /api/reportes` | JWT | Crea un reporte y lo geocodifica (RF-04, RF-14). |
| `POST /api/reportes/:id/confirmaciones` | JWT | "A mí también me pasó": una vez por usuaria, nunca en el reporte propio (RF-09). |
| `POST /api/reportes/:id/denuncias` | JWT | Denuncia un reporte con un motivo de 5 a 280 caracteres (RF-10). |
| `GET /api/moderacion/denuncias` | Moderadora | Cola de denuncias pendientes (RF-11). |
| `POST /api/moderacion/denuncias/:id` | Moderadora | Resuelve con `{ "decision": "ocultar" }` o `"descartar"` (RF-11). |

Los errores de validación responden `400` con `{ "error": "...", "campos": { "campo": "mensaje" } }`.

## Decisiones de seguridad y resiliencia

- **Privacidad (R06):** los repositorios seleccionan columnas por lista blanca. Ninguna respuesta incluye `email`, `passwordHash` ni `usuariaId`; de la autora solo sale el `alias`, que no admite `@`.
- **Consentimiento (OR-01):** `usuarias.aceptaPoliticaEn` guarda la fecha de la autorización de tratamiento de datos. La fija el servidor y ninguna respuesta la devuelve. Es un campo adicional al diagrama de clases.
- **Sesión:** el JWT vive en memoria, nunca en `localStorage`. Cada refresh token sirve una sola vez y en la base solo se guarda su hash SHA-256.
- **XSS (R11):** el texto se guarda como se escribió y la API lo entrega escapado. El cliente lo decodifica una sola vez para mostrarlo como texto de React; nunca se inserta como HTML.
- **Inyección SQL (R11):** todas las consultas son parametrizadas y los filtros se validan contra listas cerradas.
- **Geocodificación (RF-14, RR-04):** máximo 1 petición por segundo, con caché. Se aceptan solo resultados del municipio elegido. Si Nominatim falla, tarda más de 4 s, no encuentra el lugar o la cola supera 5 s, se usan las coordenadas del municipio y la tarjeta indica "Ubicación aproximada".
- **Mapa (R12):** se carga aparte, dentro de un `ErrorBoundary`. Si Leaflet o las teselas fallan, la lista, los filtros, el formulario y las líneas de ayuda siguen funcionando.

## Diseño

Modo oscuro por defecto, con opción clara. Morado `#5B2A86` y acento ámbar, con un color e ícono por categoría. Los colores están definidos como variables en `client/src/index.css`. La fuente y la licencia de fotos, tipografías e íconos están en [docs/creditos.md](docs/creditos.md).

## Alcance

Implementado: todos los requisitos Esenciales (RF-01 a RF-07 y RF-14), RF-09, RF-10, RF-11 y RF-13.

Pendiente: RF-08 (editar y eliminar) y RF-12 (eliminar cuenta). Son Condicionales, pero RF-12 responde al derecho de supresión de la Ley 1581 y debería resolverse antes de recibir usuarias reales.

Para crear una moderadora, regístrala normalmente, agrega su correo a `MODERADORAS` y reinicia el servidor. En ese orden: no hay verificación de correo.

Limitaciones conocidas:

- Si la conexión se corta justo durante una renovación, el refresh token ya consumido no se recupera y hay que iniciar sesión de nuevo. Dos pestañas renovando a la vez sí se recuperan solas.
- Con muchos reportes en una zona, los marcadores se superponen porque no hay agrupación.
- La caché de geocodificación y el límite de peticiones viven en memoria: suponen una sola instancia del servidor.
