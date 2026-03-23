// js/seo.js — Inyección dinámica de meta tags SEO + Schema.org
export function setSEO({ title, description, canonical, og = {} }) {
  document.title = title || 'GestorAI.pro — Gestoría IA para autónomos y pymes';

  setMeta('description', description || 'Automatiza facturas, modelos fiscales, nóminas y contratos con inteligencia artificial. Adaptado a cada Comunidad Autónoma.');
  setMeta('robots', 'index, follow');

  // Canonical
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
  link.href = canonical || window.location.href;

  // Open Graph
  setMeta('og:title', og.title || title, 'property');
  setMeta('og:description', og.description || description, 'property');
  setMeta('og:url', og.url || canonical || window.location.href, 'property');
  setMeta('og:type', og.type || 'website', 'property');
  setMeta('og:image', og.image || 'https://gestorai.pro/img/og-cover.png', 'property');
  setMeta('og:site_name', 'GestorAI.pro', 'property');
  setMeta('og:locale', 'es_ES', 'property');

  // Twitter
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', og.title || title);
  setMeta('twitter:description', og.description || description);
  setMeta('twitter:image', og.image || 'https://gestorai.pro/img/og-cover.png');
}

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let meta = document.querySelector(`meta[${attr}="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

export function injectSchemaOrg(data) {
  const existing = document.getElementById('schema-org');
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.id = 'schema-org';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function defaultSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'GestorAI.pro',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://gestorai.pro',
    description: 'Gestoría virtual con inteligencia artificial para autónomos y pymes en España. Facturas, modelos fiscales, nóminas y contratos automatizados.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Plan Free con funcionalidades básicas'
    },
    author: {
      '@type': 'Organization',
      name: 'MolvicStudios',
      url: 'https://molvicstudios.pro',
      email: 'molvicstudios@outlook.com'
    }
  };
}
