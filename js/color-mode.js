// js/color-mode.js — Gestor de 3 modos de color
const LS_TEMA = 'gestorai_tema';
const TEMAS = ['tema-claro', 'tema-oscuro', 'tema-contraste'];
const LABELS = { 'tema-claro': 'Claro', 'tema-oscuro': 'Oscuro', 'tema-contraste': 'Alto contraste' };
const ICONS = { 'tema-claro': '☀️', 'tema-oscuro': '🌙', 'tema-contraste': '◑' };

export function getTemaActual() {
  return localStorage.getItem(LS_TEMA) || detectarPreferencia();
}

function detectarPreferencia() {
  if (window.matchMedia('(prefers-contrast: more)').matches) return 'tema-contraste';
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'tema-oscuro';
  return 'tema-claro';
}

export function aplicarTema(tema) {
  const html = document.documentElement;
  TEMAS.forEach(t => html.classList.remove(t));
  html.classList.add(tema);
  localStorage.setItem(LS_TEMA, tema);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.content = tema === 'tema-oscuro' ? '#1A1D27' : tema === 'tema-contraste' ? '#000000' : '#F8F9FA';
  }
  // Actualizar botones de tema en la página
  document.querySelectorAll('[data-tema-icon]').forEach(el => {
    el.textContent = ICONS[tema];
  });
  document.querySelectorAll('[data-tema-label]').forEach(el => {
    el.textContent = LABELS[tema];
  });
  document.dispatchEvent(new CustomEvent('gestorai:tema-cambiado', { detail: tema }));
}

export function ciclarTema() {
  const actual = getTemaActual();
  const idx = TEMAS.indexOf(actual);
  const siguiente = TEMAS[(idx + 1) % TEMAS.length];
  aplicarTema(siguiente);
  return siguiente;
}

// Inicializar al cargar
export function initTema() {
  aplicarTema(getTemaActual());
}
