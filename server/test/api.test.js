import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, test } from 'node:test';

// Nominatim falso: permite probar aciertos, "no encontrado", fallos y el ritmo de peticiones.
const peticionesNominatim = [];
const nominatim = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const q = url.searchParams.get('q');
  peticionesNominatim.push({ q, t: Date.now(), userAgent: req.headers['user-agent'] });
  if (q.startsWith('Falla')) {
    res.statusCode = 503;
    return res.end();
  }
  if (q.startsWith('Xml')) {
    res.setHeader('content-type', 'text/xml');
    return res.end('<?xml version="1.0"?><error>bloqueado</error>');
  }
  res.setHeader('content-type', 'application/json');
  if (q.startsWith('Inexistente')) return res.end('[]');
  // Respuesta real de Nominatim para el "Parque Principal" de Sibaté, municipio vecino de Soacha.
  const address = q.startsWith('Vecino')
    ? { town: 'Sibaté ciudad', county: 'Sibaté', subregion: 'Soacha', state: 'Cundinamarca' }
    : { city: 'Soacha', subregion: 'Soacha', state: 'Cundinamarca' };
  res.end(JSON.stringify([{ lat: '4.6000', lon: '-74.2000', address }]));
});

let api;
let base;
let municipios;
let mun;

const llamar = (ruta, { metodo = 'GET', cuerpo, token, cookie } = {}) =>
  fetch(base + ruta, {
    method: metodo,
    headers: {
      ...(cuerpo !== undefined && { 'content-type': 'application/json' }),
      ...(token && { authorization: `Bearer ${token}` }),
      ...(cookie && { cookie }),
    },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });

const reporteValido = (extra = {}) => ({
  municipioId: mun('Soacha').id,
  puntoReferencia: 'Parque principal, costado norte',
  categoria: 'iluminacion_deficiente',
  franjaHoraria: '21-00',
  ...extra,
});

let contador = 0;
async function registrar(extra = {}) {
  contador += 1;
  const res = await llamar('/api/auth/registro', {
    metodo: 'POST',
    cuerpo: {
      alias: `Alias ${contador}`,
      email: `prueba${contador}@ejemplo.org`,
      password: 'contrasena-segura',
      municipioId: mun('Soacha').id,
      aceptaPolitica: true,
      ...extra,
    },
  });
  return { res, cuerpo: await res.json(), cookie: res.headers.get('set-cookie') };
}

before(async () => {
  await new Promise((r) => nominatim.listen(0, r));
  process.env.JWT_SECRET = 'secreto-solo-para-pruebas-automaticas-0123456789';
  process.env.DB_PATH = ':memory:';
  process.env.BCRYPT_ROUNDS = '4';
  process.env.NOMINATIM_URL = `http://127.0.0.1:${nominatim.address().port}/search`;
  const { app } = await import('../src/app.js');
  await new Promise((r) => { api = app.listen(0, r); });
  base = `http://127.0.0.1:${api.address().port}`;
  ({ municipios } = await (await llamar('/api/municipios')).json());
  mun = (nombre) => municipios.find((m) => m.nombre === nombre);
});

after(() => {
  api.close();
  nominatim.close();
});

test('carga los 116 municipios con coordenadas correctas (R10)', () => {
  assert.equal(municipios.length, 116);
  assert.ok(Math.abs(mun('Soacha').latitud - 4.579) < 0.01);
  assert.ok(Math.abs(mun('Girardot').longitud + 74.798) < 0.01);
  assert.ok(Math.abs(mun('Zipaquirá').latitud - 5.025) < 0.01);
});

test('registro: crea sesión, cookie segura y nunca devuelve email ni hash', async () => {
  const { res, cuerpo, cookie } = await registrar({ alias: 'Luna' });
  assert.equal(res.status, 201);
  assert.ok(cuerpo.accessToken);
  assert.deepEqual(Object.keys(cuerpo.usuaria).sort(), ['alias', 'id', 'municipioId', 'rol']);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  assert.equal(JSON.parse(atob(cuerpo.accessToken.split('.')[1])).email, undefined);
});

test('registro: valida campos, consentimiento (OR-01) y correo repetido', async () => {
  const mal = await registrar({ alias: 'a@b.co', email: 'x', password: 'corta', municipioId: 'x', aceptaPolitica: false });
  assert.equal(mal.res.status, 400);
  assert.deepEqual(
    Object.keys(mal.cuerpo.campos).sort(),
    ['aceptaPolitica', 'alias', 'email', 'municipioId', 'password'],
  );
  await registrar({ email: 'repetido@ejemplo.org' });
  const repetido = await registrar({ email: 'REPETIDO@ejemplo.org' });
  assert.equal(repetido.res.status, 409);
  assert.ok(repetido.cuerpo.campos.email);
});

test('registro: guarda la fecha de aceptación de la política, fijada por el servidor y sin exponerla', async () => {
  const antes = new Date().toISOString();
  const { cuerpo } = await registrar({ email: 'politica@ejemplo.org', aceptaPoliticaEn: '2000-01-01T00:00:00.000Z' });
  const { db } = await import('../src/db/connection.js');
  const { aceptaPoliticaEn } = db.prepare('SELECT aceptaPoliticaEn FROM usuarias WHERE email = ?').get('politica@ejemplo.org');
  assert.ok(aceptaPoliticaEn >= antes && aceptaPoliticaEn <= new Date().toISOString());
  assert.equal(cuerpo.usuaria.aceptaPoliticaEn, undefined);
});

test('login: acepta credenciales válidas y da el mismo error para correo o clave incorrectos', async () => {
  await registrar({ email: 'login@ejemplo.org' });
  const ok = await llamar('/api/auth/login', { metodo: 'POST', cuerpo: { email: 'login@ejemplo.org', password: 'contrasena-segura' } });
  assert.equal(ok.status, 200);
  const malaClave = await llamar('/api/auth/login', { metodo: 'POST', cuerpo: { email: 'login@ejemplo.org', password: 'otra-cosa-123' } });
  const sinCuenta = await llamar('/api/auth/login', { metodo: 'POST', cuerpo: { email: 'nadie@ejemplo.org', password: 'otra-cosa-123' } });
  assert.equal(malaClave.status, 401);
  assert.equal(sinCuenta.status, 401);
  assert.deepEqual(await malaClave.json(), await sinCuenta.json());
});

test('refresh: rota el token, el anterior deja de servir y logout lo invalida', async () => {
  const { cookie } = await registrar();
  const original = cookie.split(';')[0];
  const r1 = await llamar('/api/auth/refresh', { metodo: 'POST', cookie: original });
  assert.equal(r1.status, 200);
  const nueva = r1.headers.get('set-cookie').split(';')[0];
  assert.notEqual(nueva, original);
  assert.equal((await llamar('/api/auth/refresh', { metodo: 'POST', cookie: original })).status, 401);
  assert.equal((await llamar('/api/auth/logout', { metodo: 'POST', cookie: nueva })).status, 204);
  assert.equal((await llamar('/api/auth/refresh', { metodo: 'POST', cookie: nueva })).status, 401);
});

test('reportes: exigen JWT válido', async () => {
  assert.equal((await llamar('/api/reportes')).status, 401);
  assert.equal((await llamar('/api/reportes', { token: 'token.falso.x' })).status, 401);
  const noneAlg = `${btoa('{"alg":"none"}')}.${btoa('{"sub":"1"}')}.`;
  assert.equal((await llamar('/api/reportes', { token: noneAlg })).status, 401);
  assert.equal((await llamar('/api/reportes', { metodo: 'POST', cuerpo: reporteValido() })).status, 401);
});

test('crear reporte: valida entradas e ignora coordenadas enviadas por el cliente', async () => {
  const { cuerpo: { accessToken: token } } = await registrar();
  const mal = await llamar('/api/reportes', {
    metodo: 'POST',
    token,
    cuerpo: { municipioId: 'x', puntoReferencia: 'abc', categoria: 'otra', franjaHoraria: '1', descripcion: 'x'.repeat(281) },
  });
  assert.equal(mal.status, 400);
  assert.equal(Object.keys((await mal.json()).campos).length, 5);

  const ok = await llamar('/api/reportes', {
    metodo: 'POST',
    token,
    cuerpo: reporteValido({ puntoReferencia: 'Plaza con coordenadas', latitud: 1, longitud: 1, usuariaId: 999, estado: 'oculto' }),
  });
  assert.equal(ok.status, 201);
  const { reporte } = await ok.json();
  assert.equal(reporte.latitud, 4.6);
  assert.equal(reporte.longitud, -74.2);
  assert.equal(reporte.ubicacionAproximada, false);
});

test('geocodificación: usa el municipio si Nominatim falla o no encuentra, y guarda en caché', async () => {
  const { cuerpo: { accessToken: token } } = await registrar();
  const crear = async (puntoReferencia) =>
    (await (await llamar('/api/reportes', { metodo: 'POST', token, cuerpo: reporteValido({ puntoReferencia }) })).json()).reporte;

  const caido = await crear('Falla total del servicio');
  assert.equal(caido.latitud, mun('Soacha').latitud);
  assert.equal(caido.ubicacionAproximada, true);

  const inexistente = await crear('Inexistente lugar');
  assert.equal(inexistente.longitud, mun('Soacha').longitud);
  assert.equal(inexistente.ubicacionAproximada, true);

  const xml = await crear('Xml de error del servicio');
  assert.equal(xml.ubicacionAproximada, true);

  const vecino = await crear('Vecino parque principal');
  assert.equal(vecino.latitud, mun('Soacha').latitud, 'no debe ubicarlo en otro municipio');
  assert.equal(vecino.ubicacionAproximada, true);

  const antes = peticionesNominatim.length;
  await crear('Inexistente lugar');
  assert.equal(peticionesNominatim.length, antes, 'la segunda consulta debe salir de la caché');
});

test('geocodificación: respeta 1 petición por segundo con peticiones simultáneas (RR-04)', async () => {
  const { cuerpo: { accessToken: token } } = await registrar();
  const inicio = peticionesNominatim.length;
  const respuestas = await Promise.all(
    ['Sitio uno', 'Sitio dos', 'Sitio tres'].map((puntoReferencia) =>
      llamar('/api/reportes', { metodo: 'POST', token, cuerpo: reporteValido({ puntoReferencia }) })),
  );
  respuestas.forEach((r) => assert.equal(r.status, 201));
  const nuevas = peticionesNominatim.slice(inicio);
  assert.equal(nuevas.length, 3);
  for (let i = 1; i < nuevas.length; i += 1) {
    assert.ok(nuevas[i].t - nuevas[i - 1].t >= 990, `intervalo de ${nuevas[i].t - nuevas[i - 1].t} ms`);
  }
  assert.match(nuevas[0].userAgent, /RutaSegura/);
});

test('XSS: la API devuelve la descripción y el punto de referencia escapados', async () => {
  const { cuerpo: { accessToken: token } } = await registrar();
  const ataque = '<img src=x onerror="alert(1)">';
  const res = await llamar('/api/reportes', {
    metodo: 'POST',
    token,
    cuerpo: reporteValido({ puntoReferencia: `Sitio ${ataque}`, descripcion: ataque }),
  });
  const { reporte } = await res.json();
  assert.equal(reporte.descripcion, '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.ok(!reporte.puntoReferencia.includes('<'));
  // El límite de 280 se mide sobre lo que escribió la usuaria, no sobre el texto escapado.
  const largo = await llamar('/api/reportes', {
    metodo: 'POST',
    token,
    cuerpo: reporteValido({ puntoReferencia: 'Sitio con texto largo', descripcion: '<'.repeat(280) }),
  });
  assert.equal(largo.status, 201);
});

test('inyección SQL: los filtros y campos se tratan como datos', async () => {
  const { cuerpo: { accessToken: token } } = await registrar();
  const filtro = await llamar(`/api/reportes?categoria=${encodeURIComponent("' OR 1=1 --")}`, { token });
  assert.equal(filtro.status, 400);
  const origen = await llamar(`/api/reportes?origenId=${encodeURIComponent('1 OR 1=1')}`, { token });
  assert.equal(origen.status, 400);

  const texto = "Robert'); DROP TABLE reportes;--";
  const creado = await llamar('/api/reportes', { metodo: 'POST', token, cuerpo: reporteValido({ puntoReferencia: texto }) });
  assert.equal(creado.status, 201);
  assert.equal((await llamar('/api/reportes', { token })).status, 200);
  const login = await llamar('/api/auth/login', { metodo: 'POST', cuerpo: { email: "' OR '1'='1", password: "' OR '1'='1" } });
  assert.equal(login.status, 401);
});

test('listado: ordena con Haversine, filtra y no expone datos personales (RF-05, RF-06, R06)', async () => {
  const { cuerpo: { accessToken: token } } = await registrar({ alias: 'Autora Lista', email: 'privada@ejemplo.org', municipioId: mun('Girardot').id });
  for (const [nombre, categoria] of [['Zipaquirá', 'zona_desolada'], ['Girardot', 'otro'], ['Soacha', 'zona_desolada']]) {
    const r = await llamar('/api/reportes', {
      metodo: 'POST',
      token,
      cuerpo: reporteValido({ municipioId: mun(nombre).id, categoria, puntoReferencia: `Falla ${nombre} centro` }),
    });
    assert.equal(r.status, 201);
  }

  const texto = await (await llamar('/api/reportes', { token })).text();
  assert.ok(!/email|passwordHash|usuariaId|privada@ejemplo/.test(texto), 'la respuesta filtra datos personales');
  const { reportes } = JSON.parse(texto);
  const distancias = reportes.map((r) => r.distanciaKm);
  assert.deepEqual(distancias, [...distancias].sort((a, b) => a - b));
  assert.equal(reportes[0].municipio, 'Girardot', 'por defecto mide desde el municipio de la usuaria');
  assert.equal(reportes[0].distanciaKm, 0);
  assert.equal(reportes[0].alias, 'Autora Lista');

  const desdeZipa = await (await llamar(`/api/reportes?origenId=${mun('Zipaquirá').id}`, { token })).json();
  assert.equal(desdeZipa.reportes[0].municipio, 'Zipaquirá');
  // Calculado a mano: Δlat 79,2 km y Δlon 89,1 km dan unos 119,2 km en línea recta.
  const girardot = desdeZipa.reportes.find((r) => r.municipio === 'Girardot');
  assert.ok(Math.abs(girardot.distanciaKm - 119.2) < 0.5, `${girardot.distanciaKm} km`);

  const filtrados = await (await llamar(`/api/reportes?categoria=zona_desolada&municipioId=${mun('Zipaquirá').id}`, { token })).json();
  assert.equal(filtrados.reportes.length, 1);
  assert.equal(filtrados.reportes[0].confirmaciones, 0);
});

test('refresh simultáneo: la respuesta que pierde no borra la cookie nueva (H3)', async () => {
  const { cookie } = await registrar();
  const original = cookie.split(';')[0];
  const [a, b] = await Promise.all([1, 2].map(() => llamar('/api/auth/refresh', { metodo: 'POST', cookie: original })));
  assert.deepEqual([a.status, b.status].sort(), [200, 401]);
  const perdedora = a.status === 401 ? a : b;
  assert.equal(perdedora.headers.get('set-cookie'), null);
  assert.equal((await perdedora.json()).campos.reintentable, true);
  const sinCookie = await (await llamar('/api/auth/refresh', { metodo: 'POST' })).json();
  assert.equal(sinCookie.campos, undefined);
});

async function reporteDe(token, puntoReferencia) {
  const res = await llamar('/api/reportes', { metodo: 'POST', token, cuerpo: reporteValido({ puntoReferencia: `Falla ${puntoReferencia}` }) });
  return (await res.json()).reporte;
}

async function moderadora() {
  const { db } = await import('../src/db/connection.js');
  contador += 1;
  const email = `moderadora${contador}@ejemplo.org`;
  const { cookie } = await registrar({ email });
  db.prepare("UPDATE usuarias SET rol = 'moderadora' WHERE email = ?").run(email);
  // El rol se lee de la base al renovar la sesión.
  const res = await llamar('/api/auth/refresh', { metodo: 'POST', cookie: cookie.split(';')[0] });
  return (await res.json()).accessToken;
}

test('confirmar: una vez por usuaria, nunca la propia y refleja el estado (RF-09)', async () => {
  const { cuerpo: { accessToken: autora } } = await registrar();
  const { cuerpo: { accessToken: otra } } = await registrar();
  const reporte = await reporteDe(autora, 'para confirmar');
  assert.equal(reporte.esMio, true);
  assert.equal(reporte.confirmadoPorMi, false);
  const ruta = `/api/reportes/${reporte.id}/confirmaciones`;

  assert.equal((await llamar(ruta, { metodo: 'POST' })).status, 401);
  assert.equal((await llamar(ruta, { metodo: 'POST', token: autora })).status, 403);
  const primera = await (await llamar(ruta, { metodo: 'POST', token: otra })).json();
  assert.deepEqual(primera, { confirmaciones: 1, confirmadoPorMi: true });
  const repetida = await (await llamar(ruta, { metodo: 'POST', token: otra })).json();
  assert.equal(repetida.confirmaciones, 1);

  const { reportes } = await (await llamar('/api/reportes', { token: otra })).json();
  const visto = reportes.find((r) => r.id === reporte.id);
  assert.equal(visto.confirmaciones, 1);
  assert.equal(visto.confirmadoPorMi, true);
  assert.equal(visto.esMio, false);
  assert.equal((await llamar('/api/reportes/999999/confirmaciones', { metodo: 'POST', token: otra })).status, 404);
  assert.equal((await llamar('/api/reportes/abc/confirmaciones', { metodo: 'POST', token: otra })).status, 404);
});

test('denunciar y moderar: flujo completo, permisos y privacidad (RF-10, RF-11)', async () => {
  const { cuerpo: { accessToken: autora } } = await registrar({ email: 'autora-denunciada@ejemplo.org' });
  const { cuerpo: { accessToken: otra } } = await registrar({ alias: 'Denunciante secreta', email: 'denunciante@ejemplo.org' });
  const mod = await moderadora();
  const reporte = await reporteDe(autora, 'para denunciar');
  const ruta = `/api/reportes/${reporte.id}/denuncias`;

  const invalida = await llamar(ruta, { metodo: 'POST', token: otra, cuerpo: { motivo: 'abc' } });
  assert.equal(invalida.status, 400);
  assert.ok((await invalida.json()).campos.motivo);
  assert.equal((await llamar(ruta, { metodo: 'POST', token: autora, cuerpo: { motivo: 'Mi propio reporte' } })).status, 403);
  const ataque = '<img src=x onerror=alert(1)> es falso';
  assert.equal((await llamar(ruta, { metodo: 'POST', token: otra, cuerpo: { motivo: ataque } })).status, 201);
  assert.equal((await llamar(ruta, { metodo: 'POST', token: otra, cuerpo: { motivo: 'Otra vez lo mismo' } })).status, 409);

  assert.equal((await llamar('/api/moderacion/denuncias')).status, 401);
  assert.equal((await llamar('/api/moderacion/denuncias', { token: otra })).status, 403);

  const textoCola = await (await llamar('/api/moderacion/denuncias', { token: mod })).text();
  assert.ok(!/email|passwordHash|usuariaId|denunciante|ejemplo\.org|<img/i.test(textoCola), textoCola);
  const denuncia = JSON.parse(textoCola).denuncias.find((d) => d.reporteId === reporte.id);
  assert.equal(denuncia.motivo, '&lt;img src=x onerror=alert(1)&gt; es falso');

  const resolver = (id, decision, token = mod) =>
    llamar(`/api/moderacion/denuncias/${id}`, { metodo: 'POST', token, cuerpo: { decision } });
  assert.equal((await resolver(denuncia.id, 'ocultar', otra)).status, 403);
  assert.equal((await resolver(denuncia.id, 'borrar')).status, 400);
  assert.equal((await resolver(999999, 'ocultar')).status, 404);
  assert.equal((await resolver(denuncia.id, 'ocultar')).status, 204);
  assert.equal((await resolver(denuncia.id, 'descartar')).status, 409);

  const { reportes } = await (await llamar('/api/reportes', { token: otra })).json();
  assert.ok(!reportes.some((r) => r.id === reporte.id), 'el reporte oculto no debe listarse');
  assert.equal((await llamar(`/api/reportes/${reporte.id}/confirmaciones`, { metodo: 'POST', token: otra })).status, 404);
  const cola = await (await llamar('/api/moderacion/denuncias', { token: mod })).json();
  assert.ok(!cola.denuncias.some((d) => d.reporteId === reporte.id));

  // Descartar deja el reporte visible.
  const otroReporte = await reporteDe(autora, 'denuncia descartada');
  await llamar(`/api/reportes/${otroReporte.id}/denuncias`, { metodo: 'POST', token: otra, cuerpo: { motivo: 'No me parece real' } });
  const { denuncias } = await (await llamar('/api/moderacion/denuncias', { token: mod })).json();
  assert.equal((await resolver(denuncias.find((d) => d.reporteId === otroReporte.id).id, 'descartar')).status, 204);
  const trasDescartar = await (await llamar('/api/reportes', { token: otra })).json();
  assert.ok(trasDescartar.reportes.some((r) => r.id === otroReporte.id));
});

test('errores: JSON inválido y rutas desconocidas no filtran detalles internos', async () => {
  const roto = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{roto' });
  assert.equal(roto.status, 400);
  assert.deepEqual(await roto.json(), { error: 'Solicitud inválida' });
  assert.equal((await llamar('/api/noexiste')).status, 404);
});
