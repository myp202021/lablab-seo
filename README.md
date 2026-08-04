# LabLab SEO — Blog Automatizado con IA

Blog diario y rankings semanales para [lablab.cl](https://www.lablab.cl) via GitHub Actions + OpenAI + WordPress REST API.

## Arquitectura

```
GitHub Actions (cron) → Vercel Proxy → WordPress REST API
                      ↘ OpenAI GPT-4o (texto + imagen)
                      ↘ IndexNow + Google Ping
                      ↘ Resend (notificaciones email)
```

El hosting de lablab.cl bloquea IPs de GitHub Actions (403 Forbidden en nginx).
Se usa un **proxy serverless en Vercel** (`api/wp-proxy.js`) que reenvía las llamadas
al WP REST API desde IPs de Vercel (no bloqueadas).

## Scripts

| Script | Frecuencia | Descripcion |
|--------|-----------|-------------|
| `lablab-blog-diario.js` | L-V 07:30 AM Chile | 1 articulo diario, min 6.000 chars, tabla, FAQ |
| `lablab-rankings-semanal.js` | Viernes 08:00 AM Chile | 1 ranking semanal, min 10.000 chars |
| `lablab-ranking-inicial.js` | Manual (workflow_dispatch) | Ranking inicial masivo, min 20.000 chars |

## Proxy Vercel (`api/wp-proxy.js`)

- **URL:** `https://lablab-seo.vercel.app/api/wp-proxy`
- **Auth:** header `X-Proxy-Secret` (debe coincidir con env var `PROXY_SECRET` en Vercel)
- **Ruta WP:** header `X-WP-Path` (ej: `/wp-json/wp/v2/posts?per_page=10`)
- Soporta GET, POST, y uploads binarios (imagenes)
- Los scripts detectan automaticamente si `PROXY_URL` esta configurado y redirigen las llamadas WP

## Notificaciones email

Cada publicacion envia email via Resend a:
- contacto@mulleryperez.cl
- graciela.trincado@lablab.cl
- david.faille@lablab.cl

## Secrets requeridos en GitHub

| Secret | Descripcion |
|--------|-------------|
| `OPENAI_API_KEY` | API key de OpenAI (GPT-4o + gpt-image-1) |
| `LABLAB_WP_URL` | URL de WordPress (https://www.lablab.cl) |
| `LABLAB_WP_USER` | Usuario WP para REST API |
| `LABLAB_WP_APP_PASSWORD` | App Password de WordPress |
| `RESEND` | API key de Resend para notificaciones |
| `PROXY_URL` | URL del proxy Vercel (https://lablab-seo.vercel.app) |
| `PROXY_SECRET` | Secret compartido para autenticar el proxy |

## Env vars en Vercel (proyecto lablab-seo)

| Variable | Descripcion |
|----------|-------------|
| `PROXY_SECRET` | Debe coincidir con el GitHub secret `PROXY_SECRET` |

## Stack

- Node.js 22 + node-fetch@2
- OpenAI GPT-4o (texto) + gpt-image-1 (imagenes)
- WordPress REST API
- Vercel Serverless Functions (proxy)
- Resend (notificaciones)
- IndexNow + Google Sitemap Ping

## QA Gate

Cada articulo pasa por validacion automatica antes de publicarse:

| Criterio | Blog diario | Ranking semanal |
|----------|-------------|-----------------|
| Min chars HTML | 6.000 | 10.000 |
| Min H2 | 4 | 6 |
| Tabla HTML | Si | Si |
| FAQ (H2 + H3) | Si | Si |
| Links internos | 2+ | 3+ |

Si no pasa QA, el script re-genera con OpenAI hasta 4 veces.
