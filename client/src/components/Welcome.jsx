import { CATEGORIAS } from '../constantes.js';
import { AvisoEtico } from './Alert.jsx';
import { IconoCategoria } from './Iconos.jsx';
import { LineasDeAyuda } from './Layout.jsx';

const PASOS = [
  ['Cuenta lo que viste', 'Elige el municipio, el lugar, el tipo de riesgo y la hora. Son cinco campos y no necesitas GPS.'],
  ['Consulta antes de salir', 'Mira los reportes más cercanos en una lista o en el mapa, y filtra por lo que te preocupa.'],
  ['Decide con más información', 'Usa lo que otras mujeres ya conocen para elegir por dónde regresar.'],
];

export default function Welcome() {
  return (
    <>
      <section className="lg:contenedor lg:grid lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-12 lg:py-10">
        <figure className="lg:order-2">
          <div className="foto aspect-[4/3] lg:aspect-[4/5] lg:rounded-md">
            <img
              src="/fotos/cali-calle-900.webp"
              srcSet="/fotos/cali-calle-480.webp 480w, /fotos/cali-calle-900.webp 900w"
              sizes="(min-width: 1024px) 480px, 100vw"
              width="900"
              height="1350"
              fetchPriority="high"
              decoding="async"
              alt="Calle vacía de Cali de noche, iluminada por un farol encendido frente a edificios antiguos."
              className="size-full object-cover object-[center_42%]"
            />
          </div>
          <figcaption className="contenedor mt-1 text-xs text-suave lg:px-0">
            Cali, Colombia. Foto:{' '}
            <a href="https://www.pexels.com/photo/old-town-at-night-16698803/">Daniel Teran en Pexels</a>
          </figcaption>
        </figure>

        <div className="contenedor flex flex-col gap-5 pt-6 lg:px-0 lg:pt-0">
          <p className="text-sm font-bold text-primario-texto">116 municipios de Cundinamarca</p>
          <h1 className="text-[2.5rem] lg:text-[3.75rem]">
            Planea tu regreso a casa con lo que otras mujeres ya conocen
          </h1>
          <p className="max-w-xl text-lg text-suave">
            Reporta y consulta puntos de riesgo nocturno en el espacio público. Solo se muestra tu alias.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href="#/registro" className="btn btn-acento sm:px-8">Crear cuenta</a>
            <a href="#/login" className="btn btn-borde sm:px-8">Iniciar sesión</a>
          </div>
          <div className="mt-2 border-t border-linea pt-4">
            <p className="mb-2 text-sm text-suave">¿Necesitas ayuda ahora?</p>
            <LineasDeAyuda />
          </div>
        </div>
      </section>

      <section aria-labelledby="como-funciona" className="contenedor mt-12 lg:mt-16">
        <h2 id="como-funciona" className="mb-2 text-3xl">Cómo funciona</h2>
        <ol className="lg:grid lg:grid-cols-3 lg:gap-10">
          {PASOS.map(([titulo, texto], i) => (
            <li key={titulo} className="flex gap-4 border-b border-linea py-4 lg:block lg:border-b-0 lg:border-t">
              <span aria-hidden="true" className="font-serif text-3xl leading-none text-primario-texto">{i + 1}</span>
              <div className="lg:mt-3">
                <h3 className="font-bold">{titulo}</h3>
                <p className="text-suave">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 bg-superficie lg:mt-16">
        <div className="lg:contenedor lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-10">
          <figure>
            <div className="foto aspect-[3/2] lg:rounded-md">
              <img
                src="/fotos/bogota-avenida-1280.webp"
                srcSet="/fotos/bogota-avenida-640.webp 640w, /fotos/bogota-avenida-1280.webp 1280w"
                sizes="(min-width: 1024px) 540px, 100vw"
                width="1280"
                height="853"
                loading="lazy"
                decoding="async"
                alt="Avenida de Bogotá de noche, con luces de carros en movimiento y edificios iluminados."
                className="size-full object-cover"
              />
            </div>
            <figcaption className="contenedor mt-1 text-xs text-suave lg:px-0">
              Bogotá, Colombia. Foto:{' '}
              <a href="https://unsplash.com/photos/time-lapse-photography-of-city-lights-during-night-time-wwNrN5oRSRE">Giannino Pareja en Unsplash</a>
            </figcaption>
          </figure>
          <div className="contenedor flex flex-col gap-4 py-8 lg:px-0 lg:py-0">
            <h2 className="text-3xl">Hablamos de lugares, no de personas</h2>
            <p className="text-suave">
              Tu correo nunca se publica. No pedimos cédula, teléfono ni dirección. Puedes reportar:
            </p>
            <ul className="grid gap-2">
              {Object.entries(CATEGORIAS).map(([valor, { etiqueta, clase }]) => (
                <li key={valor} className={`flex items-center gap-3 ${clase}`}>
                  <span className="insignia-cat"><IconoCategoria categoria={valor} /></span>
                  {etiqueta}
                </li>
              ))}
            </ul>
            <AvisoEtico />
          </div>
        </div>
      </section>
    </>
  );
}
