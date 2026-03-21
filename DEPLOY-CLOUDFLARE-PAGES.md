# Deploy Checklist - GestorIA en Cloudflare Pages

## 1) Preparacion previa

- Repositorio con estos archivos en raiz:
  - `index.html`
  - `app.html`
  - `_redirects`
  - `manifest.json`
  - `sw.js`
  - carpeta `functions/` con `config.js`
- Verificar que no haya errores locales (ya validado por diagnostico de workspace).

## 2) Crear proyecto en Cloudflare Pages

1. Entra a Cloudflare Dashboard -> Workers & Pages -> Create application -> Pages.
2. Conecta el repositorio GitHub.
3. Configura:
   - Project name: `gestorai` (o el nombre definitivo).
   - Production branch: `main` (o rama de release).
   - Framework preset: `None`.
   - Build command: vacio (sitio estatico sin build).
   - Build output directory: `/` (raiz del repo).

## 3) Variables de entorno (obligatorio)

En Pages -> Settings -> Environment variables, crea en `Production` y `Preview`:

- `GROQ_API_KEY` = tu clave de Groq
- `MISTRAL_API_KEY` = tu clave de Mistral

Notas:
- Estas claves son leidas por `functions/config.js` y expuestas por `GET /api/config`.
- Si faltan, la app seguira cargando pero IA no podra responder.

## 4) Despliegue

1. Ejecuta el primer deploy desde la UI de Pages.
2. Espera estado `Success`.
3. Abre la URL de produccion asignada por Cloudflare.

## 5) Verificaciones post-deploy (smoke test)

### Rutas y paginas
- `GET /` carga landing.
- `GET /login` y `GET /onboarding` resuelven a sus HTML via `_redirects`.
- `GET /privacy`, `GET /terms`, `GET /legal-notice`, `GET /cookie-policy` funcionan.

### Function y claves
- `GET /api/config` responde JSON con:
  - `groq_key` no nulo
  - `mistral_key` no nulo

### Flujo funcional
- Registro nuevo usuario -> redirige a onboarding -> app.
- Login de usuario existente -> app.
- En app, enviar consulta y recibir respuesta IA.

### Fallback IA
- Si Groq falla por 429/5xx, verificar respuesta por fallback Mistral.

### PWA
- `manifest.json` accesible.
- `sw.js` registrado (Application -> Service Workers).
- Recarga offline basica: landing debe seguir abriendo desde cache.

### GDPR/Cookies
- Banner visible en primera visita.
- Al aceptar/rechazar, se guarda `gestorai_cookies_consent` en localStorage.

### SEO tecnico
- `GET /robots.txt` accesible.
- `GET /sitemap.xml` accesible.

## 6) Ajustes recomendados antes de publico definitivo

- Unificar dominio canonico y sitemap:
  - `index.html` usa `https://gestorai.pro/` en canonical/og:url.
  - `sitemap.xml` usa `https://gestorai.molvicstudios.com/`.
  - Elegir un dominio final y dejar ambos consistentes.

- Completar NIF/CIF en aviso legal:
  - `aviso-legal.html` contiene placeholder `NIF: [Completar por el propietario]`.

- Confirmar existencia de iconos PWA:
  - `assets/icon-192.png`
  - `assets/icon-512.png`
  - `assets/icon-maskable-192.png`
  - `assets/icon-maskable-512.png`
  - `assets/icon-96.png`

## 7) Operacion y mantenimiento

- Cada cambio en `main` dispara deploy automatico.
- Para cambios de cache, subir version en `CACHE_NAME` dentro de `sw.js` (ejemplo: `gestorai-v2`).
- Si cambias claves IA, actualiza variables en Pages y redeploy.

## 8) Criterio de salida (go-live)

Publicar en produccion solo cuando se cumplan estos 8 checks:

1. Deploy en `Success`.
2. `/api/config` devuelve ambas claves no nulas.
3. Registro/Login/Onboarding/App funcionan sin errores visibles.
4. Chat responde al menos 2 consultas seguidas.
5. Fallback Mistral validado.
6. Service Worker activo y offline basico funcional.
7. Banner GDPR persistente y consent guardado.
8. Dominio canonico + sitemap unificados.
