// `clase` da el color de la categoría (ver index.css); `trazos` son los paths del ícono SVG.
// Íconos basados en Lucide (licencia ISC), ver docs/creditos.md.
export const CATEGORIAS = {
  acoso_callejero: {
    etiqueta: 'Acoso callejero',
    corta: 'Acoso',
    clase: 'cat-acoso_callejero',
    trazos: ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z', 'M12 8v4', 'M12 16h.01'],
  },
  iluminacion_deficiente: {
    etiqueta: 'Iluminación deficiente',
    corta: 'Iluminación',
    clase: 'cat-iluminacion_deficiente',
    trazos: [
      'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5',
      'M9 18h6',
      'M10 22h4',
    ],
  },
  zona_desolada: {
    etiqueta: 'Zona desolada',
    corta: 'Desolada',
    clase: 'cat-zona_desolada',
    trazos: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  },
  infraestructura_insegura: {
    etiqueta: 'Infraestructura insegura',
    corta: 'Infraestructura',
    clase: 'cat-infraestructura_insegura',
    trazos: [
      'M16.05 10.966a5 2.5 0 0 1-8.1 0',
      'm16.923 14.049 4.48 2.04a1 1 0 0 1 .001 1.831l-8.574 3.9a2 2 0 0 1-1.66 0l-8.574-3.91a1 1 0 0 1 0-1.83l4.484-2.04',
      'M16.949 14.14a5 2.5 0 1 1-9.9 0L10.063 3.5a2 2 0 0 1 3.874 0z',
      'M9.194 6.57a5 2.5 0 0 0 5.61 0',
    ],
  },
  otro: {
    etiqueta: 'Otro',
    corta: 'Otro',
    clase: 'cat-otro',
    trazos: [
      'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0',
      'M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
    ],
  },
};

export const FRANJAS = {
  '18-21': '6–9 p. m.',
  '21-00': '9 p. m.–12 a. m.',
  '00-03': '12–3 a. m.',
  '03-06': '3–6 a. m.',
};

export const AVISO_ETICO = 'La ausencia de reportes no significa que una zona sea segura';
