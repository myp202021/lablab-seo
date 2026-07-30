# LabLab SEO — Blog Automatizado con IA

Blog diario y rankings semanales para [lablab.cl](https://www.lablab.cl) via GitHub Actions + OpenAI + WordPress REST API.

## Scripts

| Script | Frecuencia | Descripcion |
|--------|-----------|-------------|
| `lablab-blog-diario.js` | L-V 07:30 AM Chile | 1 articulo diario, min 6.000 chars |
| `lablab-rankings-semanal.js` | Viernes 08:00 AM Chile | 1 ranking semanal, min 10.000 chars |
| `lablab-ranking-inicial.js` | Manual (workflow_dispatch) | Ranking inicial masivo, min 20.000 chars |

## Secrets requeridos en GitHub

- `OPENAI_API_KEY`
- `LABLAB_WP_URL` (https://www.lablab.cl)
- `LABLAB_WP_USER`
- `LABLAB_WP_APP_PASSWORD`
- `RESEND`

## Stack

- Node.js 22 + node-fetch@2
- OpenAI GPT-4o (texto) + gpt-image-1 (imagenes)
- WordPress REST API + Rank Math SEO
- Resend (notificaciones)
- IndexNow + Google Sitemap Ping
