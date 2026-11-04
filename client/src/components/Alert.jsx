import { AVISO_ETICO } from '../constantes.js';

// Aviso ético estático (OR-02).
export function AvisoEtico() {
  return <Alert>{AVISO_ETICO}</Alert>;
}

const TONOS = {
  aviso: 'border-acento',
  error: 'border-error',
  exito: 'border-exito',
};

export default function Alert({ tono = 'aviso', rol = 'note', children }) {
  return (
    <div role={rol} className={`border-l-4 bg-superficie px-3 py-2 text-sm ${TONOS[tono]}`}>
      {children}
    </div>
  );
}
