export class HttpError extends Error {
  constructor(status, mensaje, campos) {
    super(mensaje);
    this.status = status;
    this.campos = campos;
  }
}

export function errorDeValidacion(campos) {
  return new HttpError(400, 'Revisa los campos marcados', campos);
}

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}
