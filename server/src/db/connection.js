import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config.js';

const raizServidor = path.resolve(import.meta.dirname, '../..');

function abrirBaseDeDatos() {
  if (config.dbPath === ':memory:') return new Database(':memory:');
  const ruta = path.resolve(raizServidor, config.dbPath);
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  return new Database(ruta);
}

export const db = abrirBaseDeDatos();
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(fs.readFileSync(path.join(import.meta.dirname, 'schema.sql'), 'utf8'));

// Carga idempotente de los 116 municipios (DIVIPOLA, datos.gov.co).
const municipios = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'municipios.json'), 'utf8'));
const insertarMunicipio = db.prepare(`
  INSERT OR IGNORE INTO municipios (codigoDane, nombre, latitud, longitud)
  VALUES (@codigoDane, @nombre, @latitud, @longitud)
`);
db.transaction((filas) => filas.forEach((fila) => insertarMunicipio.run(fila)))(municipios);
