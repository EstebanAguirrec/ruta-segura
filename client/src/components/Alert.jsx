import { AVISO_ETICO } from '../constantes.js';

// Aviso ético estático (OR-02).
export function AvisoEtico() {
  return <Alert>{AVISO_ETICO}</Alert>;
}

const TONOS = {
  aviso: 'border-amber-600 bg-amber-50 text-amber-950',
  error: 'border-red-700 bg-red-50 text-red-950',
  exito: 'border-green-700 bg-green-50 text-green-950',
};

export default function Alert({ tono = 'aviso', rol = 'note', children }) {
  return (
    <div role={rol} className={`rounded-r-lg border-l-4 px-3 py-2 text-sm font-medium ${TONOS[tono]}`}>
      {children}
    </div>
  );
}
