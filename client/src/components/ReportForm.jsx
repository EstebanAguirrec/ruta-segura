import { useState } from 'react';
import { api } from '../api/client.js';
import { CATEGORIAS, FRANJAS } from '../constantes.js';
import Alert, { AvisoEtico } from './Alert.jsx';

const MAX_DESCRIPCION = 280;

const VALIDADORES = {
  municipioId: (v) => (v ? null : 'Elige un municipio'),
  puntoReferencia: (v) => {
    const largo = v.trim().length;
    return largo >= 5 && largo <= 120 ? null : 'Escribe entre 5 y 120 caracteres';
  },
  categoria: (v) => (v ? null : 'Elige una categoría'),
  franjaHoraria: (v) => (v ? null : 'Elige una franja horaria'),
  descripcion: (v) => (v.trim().length <= MAX_DESCRIPCION ? null : `Escribe máximo ${MAX_DESCRIPCION} caracteres`),
};

// Formulario de 5 campos (RR-02): el municipio ya viene elegido para ahorrar tiempo.
export default function ReportForm({ usuaria, municipios, alPublicar, alCancelar }) {
  const [valores, setValores] = useState({
    municipioId: String(usuaria.municipioId),
    puntoReferencia: '',
    categoria: '',
    franjaHoraria: '',
    descripcion: '',
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (evento) => {
    const valor = evento.target.value;
    setValores((v) => ({ ...v, [campo]: valor }));
    // Si ya se marcó el error, se corrige en vivo mientras escribe.
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: VALIDADORES[campo](valor) }));
  };

  const validarCampo = (campo) => () => {
    setErrores((e) => ({ ...e, [campo]: VALIDADORES[campo](valores[campo]) }));
  };

  const propsCampo = (campo) => ({
    id: campo,
    name: campo,
    className: 'campo',
    value: valores[campo],
    onChange: cambiar(campo),
    onBlur: validarCampo(campo),
    'aria-invalid': errores[campo] ? 'true' : undefined,
    'aria-describedby': errores[campo] ? `${campo}-error` : undefined,
  });

  const errorDe = (campo) =>
    errores[campo] && <p id={`${campo}-error`} className="error-campo">{errores[campo]}</p>;

  const enviar = async (evento) => {
    evento.preventDefault();
    setErrorGeneral(null);
    const nuevos = Object.fromEntries(
      Object.keys(VALIDADORES)
        .map((campo) => [campo, VALIDADORES[campo](valores[campo])])
        .filter(([, mensaje]) => mensaje),
    );
    setErrores(nuevos);
    const primero = Object.keys(nuevos)[0];
    if (primero) {
      document.getElementById(primero)?.focus();
      return;
    }

    setEnviando(true);
    try {
      await api.crearReporte({
        ...valores,
        municipioId: Number(valores.municipioId),
        descripcion: valores.descripcion.trim() || null,
      });
      alPublicar();
    } catch (error) {
      setErrores(error.campos);
      if (!Object.keys(error.campos).length) setErrorGeneral(error.message);
      setEnviando(false);
    }
  };

  const restantes = MAX_DESCRIPCION - valores.descripcion.length;

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="mb-3 text-2xl font-bold text-violet-950">Nuevo reporte</h1>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <AvisoEtico />
        <p className="text-sm text-slate-700">
          Describe el lugar, no a personas. Otras usuarias solo verán tu alias.
        </p>

        <div>
          <label htmlFor="municipioId" className="etiqueta">Municipio</label>
          <select {...propsCampo('municipioId')}>
            <option value="">Elige un municipio</option>
            {municipios.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          {errorDe('municipioId')}
        </div>

        <div>
          <label htmlFor="puntoReferencia" className="etiqueta">Punto de referencia</label>
          <input {...propsCampo('puntoReferencia')} type="text" maxLength={120} placeholder="Ej.: parque principal, costado norte" autoComplete="off" />
          {errorDe('puntoReferencia')}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="categoria" className="etiqueta">Categoría</label>
            <select {...propsCampo('categoria')}>
              <option value="">Elige una</option>
              {Object.entries(CATEGORIAS).map(([valor, { etiqueta }]) => <option key={valor} value={valor}>{etiqueta}</option>)}
            </select>
            {errorDe('categoria')}
          </div>
          <div>
            <label htmlFor="franjaHoraria" className="etiqueta">Franja horaria</label>
            <select {...propsCampo('franjaHoraria')}>
              <option value="">Elige una</option>
              {Object.entries(FRANJAS).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
            </select>
            {errorDe('franjaHoraria')}
          </div>
        </div>

        <div>
          <label htmlFor="descripcion" className="etiqueta">
            Descripción <span className="font-normal text-slate-700">(opcional)</span>
          </label>
          <textarea {...propsCampo('descripcion')} rows={3} maxLength={MAX_DESCRIPCION} />
          <p className="mt-1 text-right text-sm text-slate-700">Quedan {restantes} caracteres</p>
          {errorDe('descripcion')}
        </div>

        {errorGeneral && <Alert tono="error" rol="alert">{errorGeneral}</Alert>}

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <button type="submit" className="btn-primario flex-1" disabled={enviando}>
            {enviando ? 'Publicando…' : 'Publicar'}
          </button>
          <button type="button" className="btn-secundario flex-1" onClick={alCancelar} disabled={enviando}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
