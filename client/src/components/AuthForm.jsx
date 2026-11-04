import { useState } from 'react';
import { api } from '../api/client.js';
import Alert from './Alert.jsx';

function validar(modo, v) {
  // En el orden visual del formulario: el foco va al primer campo con error.
  const errores = {};
  if (modo === 'registro' && !/^[\p{L}\p{N} _-]{3,30}$/u.test(v.alias.trim())) {
    errores.alias = 'Usa de 3 a 30 letras, números, espacios, guiones o guiones bajos';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errores.email = 'Escribe un correo válido';
  if (modo === 'login') {
    if (!v.password) errores.password = 'Escribe tu contraseña';
    return errores;
  }
  if (v.password.length < 8) errores.password = 'La contraseña debe tener mínimo 8 caracteres';
  if (!v.municipioId) errores.municipioId = 'Elige tu municipio';
  if (!v.aceptaPolitica) errores.aceptaPolitica = 'Debes aceptar la política de tratamiento de datos';
  return errores;
}

export default function AuthForm({ modo, municipios, errorMunicipios, alReintentarMunicipios, alAutenticar }) {
  const esRegistro = modo === 'registro';
  const [valores, setValores] = useState({ alias: '', email: '', password: '', municipioId: '', aceptaPolitica: false });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo, valor) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const propsCampo = (campo) => ({
    id: campo,
    'aria-invalid': errores[campo] ? 'true' : undefined,
    'aria-describedby': errores[campo] ? `${campo}-error` : undefined,
  });
  const errorDe = (campo) =>
    errores[campo] && <p id={`${campo}-error`} className="error-campo">{errores[campo]}</p>;

  const enviar = async (evento) => {
    evento.preventDefault();
    setErrorGeneral(null);
    const nuevos = validar(modo, valores);
    setErrores(nuevos);
    const primero = Object.keys(nuevos)[0];
    if (primero) {
      document.getElementById(primero)?.focus();
      return;
    }
    setEnviando(true);
    try {
      alAutenticar(
        esRegistro
          ? await api.registrar({ ...valores, municipioId: Number(valores.municipioId) })
          : await api.iniciarSesion({ email: valores.email, password: valores.password }),
      );
    } catch (error) {
      setErrores(error.campos);
      if (!Object.keys(error.campos).length) setErrorGeneral(error.message);
      setEnviando(false);
    }
  };

  return (
    <section className="mx-auto max-w-md py-2">
      <h1 className="mb-4 text-2xl font-bold text-violet-950">{esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        {esRegistro && (
          <div>
            <label htmlFor="alias" className="etiqueta">Alias público</label>
            <input {...propsCampo('alias')} className="campo" autoComplete="nickname" maxLength={30} value={valores.alias} onChange={(e) => cambiar('alias', e.target.value)} />
            <p className="mt-1 text-sm text-slate-700">Es lo único que otras personas verán. No uses tu nombre real.</p>
            {errorDe('alias')}
          </div>
        )}
        <div>
          <label htmlFor="email" className="etiqueta">Correo</label>
          <input {...propsCampo('email')} className="campo" type="email" autoComplete="email" inputMode="email" value={valores.email} onChange={(e) => cambiar('email', e.target.value)} />
          {errorDe('email')}
        </div>
        <div>
          <label htmlFor="password" className="etiqueta">Contraseña{esRegistro && ' (mínimo 8 caracteres)'}</label>
          <input {...propsCampo('password')} className="campo" type="password" autoComplete={esRegistro ? 'new-password' : 'current-password'} value={valores.password} onChange={(e) => cambiar('password', e.target.value)} />
          {errorDe('password')}
        </div>
        {esRegistro && (
          <>
            <div>
              <label htmlFor="municipioId" className="etiqueta">Municipio</label>
              <select {...propsCampo('municipioId')} className="campo" value={valores.municipioId} onChange={(e) => cambiar('municipioId', e.target.value)}>
                <option value="">Elige tu municipio</option>
                {municipios.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
              {errorMunicipios && (
                <button type="button" className="btn-secundario mt-2 w-full text-sm" onClick={alReintentarMunicipios}>
                  No se pudo cargar la lista. Reintentar
                </button>
              )}
              {errorDe('municipioId')}
            </div>
            <div>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1">
                <input {...propsCampo('aceptaPolitica')} type="checkbox" className="mt-0.5 size-6 shrink-0 accent-violet-800" checked={valores.aceptaPolitica} onChange={(e) => cambiar('aceptaPolitica', e.target.checked)} />
                <span className="text-sm text-slate-800">
                  Autorizo el tratamiento de mis datos según la Ley 1581 de 2012. Mi correo no se publica ni
                  se comparte; solo se muestra mi alias.
                </span>
              </label>
              {errorDe('aceptaPolitica')}
            </div>
          </>
        )}
        {errorGeneral && <Alert tono="error" rol="alert">{errorGeneral}</Alert>}
        <button type="submit" className="btn-primario" disabled={enviando}>
          {enviando ? 'Un momento…' : esRegistro ? 'Crear cuenta' : 'Entrar'}
        </button>
        <a href={esRegistro ? '#/login' : '#/registro'} className="btn-secundario">
          {esRegistro ? 'Ya tengo cuenta' : 'Quiero crear una cuenta'}
        </a>
      </form>
    </section>
  );
}
