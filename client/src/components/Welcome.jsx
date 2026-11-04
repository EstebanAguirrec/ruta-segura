import { AvisoEtico } from './Alert.jsx';

export default function Welcome() {
  return (
    <section className="mx-auto flex max-w-xl flex-col gap-4 py-6">
      <h1 className="text-3xl font-bold text-violet-950">Planea tu ruta con lo que otras mujeres ya vivieron</h1>
      <p className="text-lg text-slate-800">
        Reporta y consulta puntos de riesgo nocturno en los municipios de Cundinamarca. Tu identidad
        queda protegida: solo se muestra tu alias.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <a href="#/registro" className="btn-primario flex-1">Crear cuenta</a>
        <a href="#/login" className="btn-secundario flex-1">Iniciar sesión</a>
      </div>
      <AvisoEtico />
    </section>
  );
}
