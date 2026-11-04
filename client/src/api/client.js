export class ApiError extends Error {
  constructor(status, mensaje, campos) {
    super(mensaje);
    this.status = status;
    this.campos = campos ?? {};
  }
}

// El JWT vive solo en memoria: al recargar se recupera con la cookie HttpOnly.
let accessToken = null;
let renovacionEnCurso = null;
let alExpirarSesion = () => {};

export function configurarExpiracionDeSesion(callback) {
  alExpirarSesion = callback;
}

async function peticion(ruta, { metodo = 'GET', cuerpo, conToken = true } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: {
        ...(cuerpo !== undefined && { 'Content-Type': 'application/json' }),
        ...(conToken && accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ApiError(0, 'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo');
  }
  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, datos.error ?? 'Ocurrió un error. Intenta de nuevo', datos.campos);
  }
  return datos;
}

function guardarSesion(sesion) {
  accessToken = sesion.accessToken;
  return sesion.usuaria;
}

const pedirRenovacion = () => peticion('/auth/refresh', { metodo: 'POST', conToken: false });

// Si otra pestaña acaba de rotar el token, el navegador ya tiene la cookie nueva: basta reintentar.
async function renovarConReintento() {
  try {
    return await pedirRenovacion();
  } catch (error) {
    if (!error.campos.reintentable) throw error;
  }
  await new Promise((resolver) => setTimeout(resolver, 600));
  try {
    return await pedirRenovacion();
  } catch (error) {
    throw new ApiError(error.status, error.message);
  }
}

// Una sola renovación a la vez: el refresh token rota y solo sirve una vez.
export function renovarSesion() {
  renovacionEnCurso ??= renovarConReintento()
    .then(guardarSesion)
    .finally(() => {
      renovacionEnCurso = null;
    });
  return renovacionEnCurso;
}

async function peticionConSesion(ruta, opciones) {
  try {
    return await peticion(ruta, opciones);
  } catch (error) {
    if (error.status !== 401) throw error;
  }
  try {
    await renovarSesion();
  } catch (error) {
    if (error.status === 401) {
      accessToken = null;
      alExpirarSesion();
    }
    throw error;
  }
  return peticion(ruta, opciones);
}

export const api = {
  registrar: (datos) => peticion('/auth/registro', { metodo: 'POST', cuerpo: datos, conToken: false }).then(guardarSesion),
  iniciarSesion: (datos) => peticion('/auth/login', { metodo: 'POST', cuerpo: datos, conToken: false }).then(guardarSesion),
  async cerrarSesion() {
    accessToken = null;
    await peticion('/auth/logout', { metodo: 'POST', conToken: false });
  },
  municipios: () => peticion('/municipios', { conToken: false }).then((d) => d.municipios),
  reportes(filtros) {
    const consulta = new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor));
    return peticionConSesion(`/reportes?${consulta}`).then((d) => d.reportes);
  },
  crearReporte: (datos) => peticionConSesion('/reportes', { metodo: 'POST', cuerpo: datos }).then((d) => d.reporte),
  confirmarReporte: (id) => peticionConSesion(`/reportes/${id}/confirmaciones`, { metodo: 'POST' }),
  denunciarReporte: (id, motivo) => peticionConSesion(`/reportes/${id}/denuncias`, { metodo: 'POST', cuerpo: { motivo } }),
  denunciasPendientes: () => peticionConSesion('/moderacion/denuncias').then((d) => d.denuncias),
  resolverDenuncia: (id, decision) => peticionConSesion(`/moderacion/denuncias/${id}`, { metodo: 'POST', cuerpo: { decision } }),
};
