const CLAVE = 'ruta-segura-tema';
const COLOR_BARRA = { oscuro: '#14101c', claro: '#5b2a86' };

// El almacenamiento puede estar bloqueado (modo privado): el tema oscuro es el respaldo.
export function leerTema() {
  try {
    return localStorage.getItem(CLAVE) === 'claro' ? 'claro' : 'oscuro';
  } catch {
    return 'oscuro';
  }
}

export function aplicarTema(tema) {
  if (tema === 'claro') document.documentElement.dataset.tema = 'claro';
  else delete document.documentElement.dataset.tema;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA[tema]);
  try {
    localStorage.setItem(CLAVE, tema);
  } catch {
    // La preferencia solo dura esta visita.
  }
}
