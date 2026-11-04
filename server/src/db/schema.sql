-- Ruta Segura: esquema SQLite. Seis tablas, una por clase del diagrama UML.
-- Las fechas se guardan como texto ISO 8601 en UTC.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS municipios (
  id         INTEGER PRIMARY KEY,
  codigoDane TEXT NOT NULL UNIQUE,
  nombre     TEXT NOT NULL,
  latitud    REAL NOT NULL CHECK (latitud BETWEEN -90 AND 90),
  longitud   REAL NOT NULL CHECK (longitud BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS usuarias (
  id           INTEGER PRIMARY KEY,
  alias        TEXT NOT NULL CHECK (length(alias) BETWEEN 3 AND 30),
  email        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  passwordHash TEXT NOT NULL,
  municipioId  INTEGER NOT NULL REFERENCES municipios (id),
  rol          TEXT NOT NULL DEFAULT 'usuaria' CHECK (rol IN ('usuaria', 'moderadora')),
  -- Prueba de la autorización de tratamiento de datos (OR-01, Ley 1581 de 2012).
  aceptaPoliticaEn TEXT NOT NULL,
  creadoEn     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS reportes (
  id              INTEGER PRIMARY KEY,
  usuariaId       INTEGER NOT NULL REFERENCES usuarias (id) ON DELETE CASCADE,
  municipioId     INTEGER NOT NULL REFERENCES municipios (id),
  puntoReferencia TEXT NOT NULL CHECK (length(puntoReferencia) BETWEEN 5 AND 120),
  categoria       TEXT NOT NULL CHECK (categoria IN (
                    'acoso_callejero', 'iluminacion_deficiente', 'zona_desolada',
                    'infraestructura_insegura', 'otro')),
  franjaHoraria   TEXT NOT NULL CHECK (franjaHoraria IN ('18-21', '21-00', '00-03', '03-06')),
  descripcion     TEXT CHECK (descripcion IS NULL OR length(descripcion) <= 280),
  latitud         REAL NOT NULL CHECK (latitud BETWEEN -90 AND 90),
  longitud        REAL NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  estado          TEXT NOT NULL DEFAULT 'visible' CHECK (estado IN ('visible', 'oculto')),
  creadoEn        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS confirmaciones (
  usuariaId INTEGER NOT NULL REFERENCES usuarias (id) ON DELETE CASCADE,
  reporteId INTEGER NOT NULL REFERENCES reportes (id) ON DELETE CASCADE,
  creadoEn  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (usuariaId, reporteId)
);

CREATE TABLE IF NOT EXISTS denuncias (
  id        INTEGER PRIMARY KEY,
  reporteId INTEGER NOT NULL REFERENCES reportes (id) ON DELETE CASCADE,
  usuariaId INTEGER NOT NULL REFERENCES usuarias (id) ON DELETE CASCADE,
  motivo    TEXT NOT NULL,
  estado    TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'descartada'))
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id        INTEGER PRIMARY KEY,
  usuariaId INTEGER NOT NULL REFERENCES usuarias (id) ON DELETE CASCADE,
  tokenHash TEXT NOT NULL UNIQUE,
  expiraEn  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reportes_visibles ON reportes (estado, municipioId, categoria);
CREATE INDEX IF NOT EXISTS idx_confirmaciones_reporte ON confirmaciones (reporteId);
CREATE INDEX IF NOT EXISTS idx_denuncias_estado ON denuncias (estado);
CREATE INDEX IF NOT EXISTS idx_refresh_usuaria ON refresh_tokens (usuariaId);
