// `insignia` solo usa combinaciones con contraste AA; `color` es el fondo del marcador.
export const CATEGORIAS = {
  acoso_callejero: { etiqueta: 'Acoso callejero', icono: '⚠️', color: '#b91c1c', insignia: 'bg-red-100 text-red-900' },
  iluminacion_deficiente: { etiqueta: 'Iluminación deficiente', icono: '💡', color: '#a16207', insignia: 'bg-amber-100 text-amber-900' },
  zona_desolada: { etiqueta: 'Zona desolada', icono: '🌑', color: '#334155', insignia: 'bg-slate-200 text-slate-900' },
  infraestructura_insegura: { etiqueta: 'Infraestructura insegura', icono: '🚧', color: '#c2410c', insignia: 'bg-orange-100 text-orange-900' },
  otro: { etiqueta: 'Otro', icono: '📍', color: '#6d28d9', insignia: 'bg-violet-100 text-violet-900' },
};

export const FRANJAS = {
  '18-21': '6–9 p. m.',
  '21-00': '9 p. m.–12 a. m.',
  '00-03': '12–3 a. m.',
  '03-06': '3–6 a. m.',
};

export const AVISO_ETICO = 'La ausencia de reportes no significa que una zona sea segura';
