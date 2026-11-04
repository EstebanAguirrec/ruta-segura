import { useCallback, useEffect, useState } from 'react';
import { api, configurarExpiracionDeSesion, renovarSesion } from './api/client.js';
import AuthForm from './components/AuthForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import { Footer, Header } from './components/Layout.jsx';
import ReportForm from './components/ReportForm.jsx';
import Welcome from './components/Welcome.jsx';

const leerVista = () => window.location.hash.replace('#/', '') || 'inicio';
const irA = (vista) => {
  window.location.hash = `#/${vista}`;
};

export default function App() {
  const [vista, setVista] = useState(leerVista);
  const [usuaria, setUsuaria] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [municipios, setMunicipios] = useState([]);
  const [errorMunicipios, setErrorMunicipios] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // La navegación por hash mantiene funcional el botón "atrás" del celular.
  useEffect(() => {
    const alCambiar = () => {
      setVista(leerVista());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  useEffect(() => {
    configurarExpiracionDeSesion(() => {
      setUsuaria(null);
      irA('login');
    });
    renovarSesion()
      .then(setUsuaria)
      .catch(() => {}) // Sin cookie válida: es una visitante.
      .finally(() => setVerificando(false));
  }, []);

  const cargarMunicipios = useCallback(() => {
    setErrorMunicipios(null);
    api.municipios().then(setMunicipios).catch((error) => setErrorMunicipios(error.message));
  }, []);
  useEffect(cargarMunicipios, [cargarMunicipios]);

  const alAutenticar = (nuevaUsuaria) => {
    setUsuaria(nuevaUsuaria);
    irA('reportes');
  };

  const salir = async () => {
    await api.cerrarSesion().catch(() => {});
    setUsuaria(null);
    setMensaje(null);
    irA('inicio');
  };

  const alPublicar = () => {
    setMensaje('Reporte publicado');
    irA('reportes');
  };

  let contenido;
  if (verificando) {
    contenido = <p role="status" className="p-6 text-center text-slate-700">Cargando…</p>;
  } else if (usuaria && vista === 'nuevo') {
    contenido = (
      <ReportForm
        usuaria={usuaria}
        municipios={municipios}
        alPublicar={alPublicar}
        alCancelar={() => irA('reportes')}
      />
    );
  } else if (usuaria) {
    contenido = (
      <Dashboard
        usuaria={usuaria}
        municipios={municipios}
        mensaje={mensaje}
        alCerrarMensaje={() => setMensaje(null)}
        alReportar={() => irA('nuevo')}
      />
    );
  } else if (vista === 'login' || vista === 'registro') {
    contenido = (
      <AuthForm
        key={vista}
        modo={vista}
        municipios={municipios}
        errorMunicipios={errorMunicipios}
        alReintentarMunicipios={cargarMunicipios}
        alAutenticar={alAutenticar}
      />
    );
  } else {
    contenido = <Welcome />;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-[2000] focus:bg-white focus:p-3" onClick={(e) => {
        e.preventDefault();
        document.getElementById('contenido')?.focus();
      }}>
        Saltar al contenido
      </a>
      <Header usuaria={usuaria} alSalir={salir} />
      <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 outline-none">
        {contenido}
      </main>
      <Footer />
    </div>
  );
}
