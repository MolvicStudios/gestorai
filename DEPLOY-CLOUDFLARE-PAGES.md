# Deploy Checklist — GestorIA en Cloudflare Pages
> Actualizado: marzo 2026 — Arquitectura backend-proxy (sin claves en frontend)

## ESTADO ACTUAL DEL REPOSITORIO

```
Rama local:   master
Push destino: origin/main  (← PRODUCCIÓN en Cloudflare)
Pull origen:  origin/main
```

**Todos los `git push` van automáticamente a `main` gracias a la config en `.git/config`.**

---

## 1) Estructura del repositorio

```
/
├── index.html              ← Landing page
├── login.html              ← Registro / Login
├── onboarding.html         ← Perfil inicial
├── app.html                ← App de chat
├── _redirects              ← Rutas amigables (SIN catch-all)
├── manifest.json           ← PWA
├── sw.js                   ← Service Worker (cache gestorai-v7)
├── css/main.css
├── js/                     ← Módulos frontend
│   ├── auth.js             ← Auth localStorage pura
│   ├── chat.js             ← Motor chat
│   ├── config.js           ← Temas + constantes
│   ├── gdpr.js             ← Banner RGPD
│   ├── groq.js             ← Proxy cliente → /api/chat
│   ├── historial.js
│   ├── perfil.js
│   └── herramientas/       ← 6 calculadoras (cuota, irpf130, finiquito...)
└── functions/              ← Cloudflare Pages Functions
    ├── config.js           ← GET /config (estado providers, SIN claves)
    └── api/
        ├── config.js       ← GET /api/config (estado providers, SIN claves)
        └── chat.js         ← POST /api/chat (proxy IA — único punto con claves)
```

---

## 2) Configuración en Cloudflare Dashboard

### Pages → gestorai → Settings → Builds & Deployments:
- **Production branch:** `main`
- **Framework preset:** None
- **Build command:** (vacío)
- **Build output directory:** `/` (raíz del repo)

### Pages → gestorai → Settings → Environment Variables:
Añadir en **Production** Y **Preview**:

| Variable | Valor |
|---|---|
| `GROQ_API_KEY` | `gsk_xxxx...` (clave de console.groq.com) |
| `MISTRAL_API_KEY` | `xxxx...` (clave de console.mistral.ai) |

> ⚠️ **CRÍTICO**: Sin estas claves, `/api/chat` devuelve 503 y el chat no responde.
> La app mostrará un banner de aviso si no detecta claves configuradas.

---

## 3) Flujo de despliegue

```bash
# Cualquier cambio
git add -A
git commit -m "descripción"
git push
# → va automáticamente a origin/main → Cloudflare despliega en PRODUCCIÓN
```

---

## 4) Verificación post-deploy (smoke tests)

### Rutas estáticas
```
GET /                     → 200 HTML (landing)
GET /login.html           → 200 HTML
GET /app.html             → 200 HTML
GET /onboarding.html      → 200 HTML
GET /robots.txt           → 200 text
GET /sitemap.xml          → 200 XML
GET /manifest.json        → 200 JSON
GET /sw.js                → 200 JS
```

### Cloudflare Functions
```
GET  /api/config          → 200 {"providers":{"groq":true,"mistral":true}}
GET  /config              → 200 {"providers":{"groq":true,"mistral":true}}
POST /api/chat            → 200 {"content":"...respuesta IA...","provider":"groq"}
```

> Si `groq: false` y `mistral: false` → las claves NO están configuradas en Cloudflare.

### Flujo funcional completo
1. Abrir `https://gestorai.pro/`
2. Click "Empieza gratis" → `/login.html?tab=registro`
3. Registrar con email@test.com + contraseña ≥ 8 chars
4. → Redirige a `/onboarding.html`
5. Seleccionar situación laboral → "Comenzar →"
6. → Redirige a `/app.html`
7. Enviar "¿Cuánto pago de autónomo con 2.000€/mes?" → Respuesta de IA

---

## 5) Diagnóstico de problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| Deploy sale como "Preview" | Production branch no es `main` | Dashboard → Builds → Production branch = `main` |
| Chat no responde | API keys no configuradas | Dashboard → Environment Variables → añadir keys |
| Banner amarillo en app | `GET /api/config` devuelve FALSE | Ver fila anterior |
| Error "SyntaxError Unexpected token '<'" | CF Function no desplegada | Verificar que `functions/api/chat.js` está en el repo |
| Loop de redirecciones | Service Worker con cache old | DevTools → Application → Clear storage → Force reload |
| Sitio no carga en móvil | SSL o dominio | Dashboard → Custom domains → verificar |

---

## 6) Pendientes antes de go-live

- [ ] Completar NIF/CIF en `aviso-legal.html` (`[Completar por el propietario]`)
- [ ] Unificar canonical URL: `index.html` → `gestorai.pro`, `sitemap.xml` → actualmente `gestorai.molvicstudios.com`
- [ ] Configurar dominio personalizado `gestorai.pro` en Cloudflare DNS


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
