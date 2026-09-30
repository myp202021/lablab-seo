// lablab-ranking-inicial.js
// Genera 1 artículo masivo de ranking inicial para lablab.cl
// Artículo flagship: "Las mejores empresas de outplacement en Chile"
// Se ejecuta UNA VEZ via workflow_dispatch (manual)
//
// Uso: node scripts/lablab-ranking-inicial.js
// Requiere: OPENAI_API_KEY, LABLAB_WP_USER, LABLAB_WP_APP_PASSWORD, LABLAB_WP_URL

var fetch = require('node-fetch')

var WP_URL = process.env.LABLAB_WP_URL || 'https://www.lablab.cl'
var WP_USER = process.env.LABLAB_WP_USER
var WP_PASS = process.env.LABLAB_WP_APP_PASSWORD
var OPENAI_KEY = process.env.OPENAI_API_KEY
var RESEND_KEY = process.env.RESEND
var PROXY_URL = process.env.PROXY_URL
var PROXY_SECRET = process.env.PROXY_SECRET

if (!WP_USER || !WP_PASS) { console.error('LABLAB_WP_USER y LABLAB_WP_APP_PASSWORD requeridas'); process.exit(1) }
var AUTH = 'Basic ' + Buffer.from(WP_USER + ':' + WP_PASS).toString('base64')
var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

if (!OPENAI_KEY) { console.error('OPENAI_API_KEY requerida'); process.exit(1) }

// ═══ RETRY WRAPPER (con proxy Vercel para WP) ═══
async function fetchRetry(url, opts, retries) {
  retries = retries || 3
  if (PROXY_URL && url.startsWith(WP_URL)) {
    var wpPath = url.substring(WP_URL.length)
    url = PROXY_URL + '/api/wp-proxy'
    opts.headers = opts.headers || {}
    opts.headers['X-WP-Path'] = wpPath
    opts.headers['X-Proxy-Secret'] = PROXY_SECRET
  }
  for (var i = 0; i < retries; i++) {
    try {
      var r = await fetch(url, opts)
      if (r.ok || r.status < 500) return r
      console.log('  ⚠️ HTTP ' + r.status + ' (intento ' + (i+1) + '/' + retries + ')')
    } catch(e) {
      console.log('  ⚠️ ' + e.message + ' (intento ' + (i+1) + '/' + retries + ')')
    }
    if (i < retries - 1) await new Promise(function(r) { setTimeout(r, 3000 * (i+1)) })
  }
  throw new Error('Falló después de ' + retries + ' intentos: ' + url)
}

// ═══ INDEXNOW ═══
async function pingIndexNow(url) {
  try {
    var r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'www.lablab.cl',
        key: 'lablab2026indexnow',
        urlList: [url]
      })
    })
    console.log('  IndexNow: ' + r.status + ' ' + r.statusText)
  } catch(e) { console.log('  IndexNow error (no crítico): ' + e.message) }
}

async function pingSitemap() {
  try {
    await fetch('https://www.google.com/ping?sitemap=https://www.lablab.cl/sitemap_index.xml')
    console.log('  Google sitemap ping: OK')
  } catch(e) { console.log('  Google ping error (no crítico): ' + e.message) }
}

// ═══ OPENAI IMAGE GENERATION ═══
async function generarImagenBuffer(titulo) {
  try {
    console.log('  🎨 Generando imagen con OpenAI...')
    var prompt = 'Professional blog header about: ' + titulo + '. Chilean corporate/HR context. Clean modern design, warm professional tones, business people in modern office. NO text, NO words, NO letters, NO numbers in the image.'
    var r = await fetchRetry('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-image-1', prompt: prompt, n: 1, size: '1024x1024', quality: 'low' })
    })
    var data = await r.json()
    if (!data.data || !data.data[0]) {
      console.log('  ⚠️ OpenAI no retornó imagen:', JSON.stringify(data).substring(0, 300))
      return null
    }
    if (data.data[0].b64_json) {
      console.log('  ✅ Imagen generada (base64)')
      return Buffer.from(data.data[0].b64_json, 'base64')
    }
    if (data.data[0].url) {
      var imgRes = await fetch(data.data[0].url)
      console.log('  ✅ Imagen generada (url)')
      return await imgRes.buffer()
    }
    console.log('  ⚠️ Respuesta sin imagen:', JSON.stringify(data).substring(0, 200))
    return null
  } catch(e) {
    console.log('  ⚠️ Error generando imagen (no crítico): ' + e.message)
    return null
  }
}

async function subirImagenWP(imgBuffer, titulo) {
  try {
    console.log('  📤 Subiendo imagen a WordPress...')
    var slug = (titulo || 'blog').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').substring(0, 50)
    var filename = slug + '-' + Date.now() + '.png'
    var uploadRes = await fetchRetry(WP_URL + '/wp-json/wp/v2/media', {
      method: 'POST',
      headers: {
        'Authorization': AUTH,
        'Content-Disposition': 'attachment; filename="' + filename + '"',
        'Content-Type': 'image/png', 'User-Agent': UA
      },
      body: imgBuffer
    })
    var media = await uploadRes.json()
    if (media.id) {
      console.log('  ✅ Imagen subida, media ID: ' + media.id)
      return media.id
    }
    console.log('  ⚠️ Error subiendo imagen:', JSON.stringify(media).substring(0, 200))
    return null
  } catch(e) {
    console.log('  ⚠️ Error subiendo imagen (no crítico): ' + e.message)
    return null
  }
}

// ═══ ENSURE BLOG CATEGORY ═══
async function ensureBlogCategory() {
  try {
    var res = await fetchRetry(WP_URL + '/wp-json/wp/v2/categories?search=Blog&per_page=10', { headers: { Authorization: AUTH, 'User-Agent': UA } })
    var cats = await res.json()
    if (Array.isArray(cats)) {
      for (var i = 0; i < cats.length; i++) {
        if (cats[i].name.toLowerCase() === 'blog') {
          console.log('  Categoría Blog encontrada: ID ' + cats[i].id)
          return cats[i].id
        }
      }
    }
    var createRes = await fetchRetry(WP_URL + '/wp-json/wp/v2/categories', {
      method: 'POST',
      headers: { Authorization: AUTH, 'Content-Type': 'application/json', 'User-Agent': UA },
      body: JSON.stringify({ name: 'Blog', slug: 'blog', description: 'Artículos del blog de LabLab' })
    })
    var newCat = await createRes.json()
    if (newCat.id) {
      console.log('  Categoría Blog creada: ID ' + newCat.id)
      return newCat.id
    }
    console.log('  ⚠️ No se pudo crear categoría Blog, usando ID 1')
    return 1
  } catch(e) {
    console.log('  ⚠️ Error con categorías (usando ID 1): ' + e.message)
    return 1
  }
}

// ═══ FAQ SCHEMA ═══
function buildFaqSchema(html) {
  var faqs = [], re = /<h3[^>]*>([^<]+)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi, m
  while ((m = re.exec(html)) !== null) {
    var q = m[1].trim(), a = m[2].replace(/<[^>]+>/g, '').trim()
    if (q.includes('?') && a.length > 20) faqs.push({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })
  }
  if (!faqs.length) return ''
  return '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.slice(0, 10) }) + '</script>'
}

var TEMA = {
  titulo: 'Las mejores empresas de outplacement en Chile: guía completa 2026',
  kw: 'mejores empresas outplacement Chile, ranking outplacement Chile 2026, empresas outplacement Santiago',
  tipo: 'ranking-flagship'
}

var SYSTEM_PROMPT = 'Eres el mayor experto en outplacement y transición laboral en Chile. Escribes LA guía definitiva sobre empresas de outplacement en Chile para el blog de LabLab. Este es el artículo más importante del blog: debe ser exhaustivo, autoritativo y el mejor contenido disponible en español sobre este tema.\n\nREGLAS CRÍTICAS:\n- El nombre es "LabLab" (siempre capitalizado así). NUNCA "Lab Lab", "LABLAB" ni variantes.\n- Todo contenido es de 2026.\n- NO mencionar competidores por nombre directo. Usa descripciones tipológicas: "firmas internacionales con presencia en LATAM", "consultoras boutique locales", "empresas de origen europeo", "firmas con foco en ejecutivos C-level", etc. Describe perfiles genéricos de tipos de empresas que existen en el mercado.\n- Datos concretos del mercado chileno: tasas de recolocación, tiempos promedio, rangos de precios, tamaños de mercado.\n- Tablas HTML con estilos inline profesionales.\n- Callout boxes para datos clave.\n\nFUENTES AUTORITATIVAS (incluir links reales):\n- DT: https://www.dt.gob.cl\n- INE: https://www.ine.gob.cl\n- SENCE: https://www.sence.cl\n- Código del Trabajo: https://www.leychile.cl/Navegar?idNorma=207436\n- OIT: https://www.ilo.org\nMínimo 3 links externos.\n\nDATOS LabLab:\n- Especialistas en outplacement y transición laboral desde 2019\n- +100 empresas clientes, +15.000 personas acompañadas\n- Tecnología + IA + consultores senior\n- Programas: Outplacement ejecutivo, profesional, masivo, Retiro Activo, Coaching, FastRace\n- contacto@lablab.cl'

var USER_PROMPT = 'ESCRIBE EL ARTÍCULO MÁS COMPLETO Y EXTENSO POSIBLE sobre empresas de outplacement en Chile.\n\nTEMA: ' + TEMA.titulo + '\nKEYWORDS: ' + TEMA.kw + '\n\nESTILOS INLINE OBLIGATORIOS EN TODO EL HTML:\n- H2: style="color:#1a365d;font-size:24px;margin:32px 0 16px;padding-bottom:8px;border-bottom:2px solid #e2e8f0"\n- H3: style="color:#2d3748;font-size:18px;margin:24px 0 12px"\n- Párrafos: style="line-height:1.8;margin-bottom:16px;color:#2d3748"\n- Listas UL: style="margin:16px 0;padding-left:24px;line-height:1.8"\n- LI: style="margin-bottom:8px;color:#2d3748"\n- Links: style="color:#2b6cb0;font-weight:500;text-decoration:underline"\n- Tablas: <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:15px;box-shadow:0 1px 2px rgba(0,0,0,0.06)"><thead><tr><th style="background:#1a365d;color:white;padding:12px 16px;text-align:left;font-weight:600">...</th></tr></thead><tbody><tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0">...</td></tr><tr style="background:#f7fafc"><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0">...</td></tr></tbody></table>\n- Callout: <div style="background:#ebf8ff;border-left:4px solid #3182ce;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0"><strong>Dato clave:</strong> texto</div>\n\nESTRUCTURA OBLIGATORIA (MÍNIMO 20.000 CARACTERES):\n1. NO H1. Párrafo gancho con dato impactante del mercado de outplacement en Chile.\n2. H2 "El mercado del outplacement en Chile en 2026" — contexto, tamaño, tendencias, datos INE/DT.\n3. H2 "Qué es el outplacement y por qué es necesario" — definición completa, beneficios, marco legal.\n4. H2 "Metodología de evaluación" — criterios usados para evaluar empresas (recolocación, tiempo, tecnología, cobertura, precio, especialización).\n5. H2 "Tipos de empresas de outplacement en Chile" — con H3 por tipo:\n   - Firmas internacionales con presencia local\n   - Consultoras boutique especializadas\n   - Empresas con foco tecnológico e IA\n   - Firmas de coaching y desarrollo ejecutivo\n   - Consultoras de RRHH con servicio de outplacement\n   Cada tipo: 300+ palabras, ventajas, desventajas, perfil ideal de cliente.\n6. H2 "Tabla comparativa de tipos de empresas" — tabla HTML grande con criterios.\n7. H2 "Qué buscar en una empresa de outplacement" — con H3 por criterio (tasa recolocación, tecnología, personalización, precio, red de contactos, seguimiento).\n8. H2 "Rangos de precios del outplacement en Chile 2026" — tabla con rangos por tipo de programa.\n9. H2 "Marco legal del outplacement en Chile" — Código del Trabajo, obligaciones, beneficios tributarios.\n10. H2 "Tendencias 2026 en outplacement" — IA, trabajo remoto, upskilling, datos.\n11. H2 "Conclusión" con CTA a <a href="/servicios-para-empresas/" style="color:#2b6cb0;font-weight:bold">contactar a LabLab</a>.\n12. H2 "Preguntas frecuentes" con 10 preguntas como H3, respuestas de 5-6 oraciones.\n\nLINKS INTERNOS (mínimo 5):\n- <a href="/" style="color:#2b6cb0;font-weight:500;text-decoration:underline">LabLab</a>\n- <a href="/servicios-para-empresas/" style="color:#2b6cb0;font-weight:500;text-decoration:underline">servicios para empresas</a>\n- <a href="/servicios-para-personas/" style="color:#2b6cb0;font-weight:500;text-decoration:underline">servicios para personas</a>\n- <a href="/nosotros/" style="color:#2b6cb0;font-weight:500;text-decoration:underline">sobre LabLab</a>\n- <a href="/servicios-para-empresas/" style="color:#2b6cb0;font-weight:500;text-decoration:underline">contacto</a>\n\nEXTENSIÓN: MÍNIMO 5.000 palabras. contenido_html MÍNIMO 20.000 caracteres. Este debe ser el artículo más largo y completo del blog.\n\nJSON (sin backticks):\n{"titulo_seo":"max 60","meta_description":"max 155","slug":"mejores-empresas-outplacement-chile","extracto":"2 oraciones sobre el ranking","contenido_html":"<h2>...</h2>...","focus_keyword":"mejores empresas outplacement Chile","tags":["mejores empresas outplacement Chile","ranking outplacement Chile","outplacement Santiago 2026"]}'

// ═══ QA GATE — AGRESIVO ═══
var QA = { minChars: 20000, minH2: 10, minLinks: 5 }

function checkQuality(html) {
  var issues = [], len = (html||'').length, h2s = (html||'').split('<h2').length-1
  var tables = (html||'').split('<table').length-1
  var faq = /<h[23][^>]*>[^<]*(pregunta|faq|frecuente)/i.test(html||'')
  var links = ((html||'').match(/href="\//g)||[]).length
  if (len < QA.minChars) issues.push('HTML:' + len + ' (mín ' + QA.minChars + ')')
  if (h2s < QA.minH2) issues.push('H2:' + h2s + ' (mín ' + QA.minH2 + ')')
  if (tables < 1) issues.push('Sin tabla')
  if (!faq) issues.push('Sin FAQ')
  if (links < QA.minLinks) issues.push('Links:' + links + ' (mín ' + QA.minLinks + ')')
  return { pass: !issues.length, issues: issues, stats: { len:len, h2s:h2s, tables:tables, faq:faq, links:links } }
}

// ═══ MAIN ═══
async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  LABLAB — RANKING INICIAL (FLAGSHIP)')
  console.log('  ' + new Date().toISOString().split('T')[0])
  console.log('═══════════════════════════════════════════\n')

  var blogCatId = await ensureBlogCategory()

  // Check if already published
  var res0 = await fetchRetry(WP_URL + '/wp-json/wp/v2/posts?search=outplacement+chile+guia&per_page=5&_fields=title,slug', { headers: { Authorization: AUTH, 'User-Agent': UA } })
  var existing = await res0.json()
  if (Array.isArray(existing) && existing.some(function(p) { return p.slug === 'mejores-empresas-outplacement-chile' })) {
    console.log('⚠️ El ranking inicial ya fue publicado (slug existe). Saltando.')
    return
  }

  console.log('Generando ranking flagship (puede tomar varios minutos)...\n')

  // Primera generación
  var r = await fetchRetry('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: USER_PROMPT }], temperature: 0.6, max_tokens: 16000, response_format: { type: 'json_object' } })
  })
  var data = await r.json()
  var raw = data.choices[0].message.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
  var art
  try { art = JSON.parse(raw) } catch(e) {
    console.log('⚠️ JSON parse failed, retrying...')
    await new Promise(function(r) { setTimeout(r, 5000) })
    var r2 = await fetchRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: USER_PROMPT }], temperature: 0.5, max_tokens: 16000, response_format: { type: 'json_object' } })
    })
    var d2 = await r2.json()
    raw = d2.choices[0].message.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    art = JSON.parse(raw)
  }

  // QA loop agresivo — hasta 6 intentos para alcanzar 20K chars
  for (var i = 1; i <= 6; i++) {
    var c = checkQuality(art.contenido_html)
    console.log('QA ' + i + ': HTML=' + c.stats.len + ' H2=' + c.stats.h2s + ' T=' + c.stats.tables + ' FAQ=' + c.stats.faq + ' L=' + c.stats.links)
    if (c.pass) { console.log('✅ QA OK — ' + c.stats.len + ' chars'); break }
    console.log('⚠️ ' + c.issues.join(', '))

    var fixes = []
    if (c.stats.len < QA.minChars) fixes.push('CRÍTICO: HTML solo ' + c.stats.len + ' chars, necesito MÍNIMO ' + QA.minChars + '. Expande CADA H2 con más párrafos, más datos, más ejemplos. Cada H2 debe tener 400-600 palabras.')
    if (c.stats.h2s < QA.minH2) fixes.push('Solo ' + c.stats.h2s + ' H2, necesito mínimo ' + QA.minH2 + '. Agrega más secciones.')
    if (!c.stats.tables) fixes.push('FALTA tabla HTML <table> con estilos inline')
    if (!c.stats.faq) fixes.push('FALTA H2 "Preguntas frecuentes" con mínimo 10 preguntas como H3')
    if (c.stats.links < QA.minLinks) fixes.push('Faltan links internos, necesito mínimo ' + QA.minLinks + ' links a páginas de LabLab')

    var retryR = await fetchRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', messages: [
        { role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: USER_PROMPT },
        { role: 'assistant', content: raw },
        { role: 'user', content: 'CORRIGE URGENTE:\n' + fixes.join('\n') + '\n\nReescribe COMPLETO. Mismo JSON. El artículo DEBE tener mínimo 20.000 caracteres HTML.' }
      ], temperature: 0.5, max_tokens: 16000, response_format: { type: 'json_object' } })
    })
    var rd = await retryR.json()
    raw = rd.choices[0].message.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    art = JSON.parse(raw)
  }

  console.log('\nHTML final: ' + (art.contenido_html||'').length + ' chars')

  // Inyectar FAQ schema JSON-LD
  var faqSchema = buildFaqSchema(art.contenido_html)
  if (faqSchema) {
    art.contenido_html = art.contenido_html + '\n' + faqSchema
    console.log('FAQ schema inyectado (' + (art.contenido_html.match(/"Question"/g)||[]).length + ' preguntas)')
  }

  // Generar y subir imagen destacada
  var mediaId = null
  var imgBuf = await generarImagenBuffer(TEMA.titulo)
  if (imgBuf) {
    mediaId = await subirImagenWP(imgBuf, art.titulo_seo || TEMA.titulo)
  }

  console.log('\nPublicando...')
  var postBody = {
    title: art.titulo_seo, slug: art.slug || 'mejores-empresas-outplacement-chile', content: art.contenido_html, excerpt: art.extracto,
    status: 'publish', categories: [blogCatId],
    meta: {
      rank_math_title: art.titulo_seo, _yoast_wpseo_title: art.titulo_seo, _seo_title: art.titulo_seo + ' | LabLab',
      rank_math_description: art.meta_description, _yoast_wpseo_metadesc: art.meta_description, _seo_description: art.meta_description,
      rank_math_focus_keyword: (art.focus_keyword || art.tags && art.tags[0] || ''), _yoast_wpseo_focuskw: (art.focus_keyword || art.tags && art.tags[0] || ''), _seo_focus_keyword: art.focus_keyword || 'mejores empresas outplacement Chile'
    }
  }
  if (mediaId) postBody.featured_media = mediaId
  var pubRes = await fetchRetry(WP_URL + '/wp-json/wp/v2/posts', {
    method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify(postBody)
  })
  var post = await pubRes.json()
  if (post.id) {
    var url = post.link || WP_URL + '/mejores-empresas-outplacement-chile/'
    console.log('\n✅ RANKING INICIAL PUBLICADO')
    console.log('   ID: ' + post.id)
    console.log('   URL: ' + url)
    console.log('   HTML: ' + (art.contenido_html||'').length + ' chars')

    console.log('\n📡 Notificando buscadores...')
    await pingIndexNow(url)
    await pingSitemap()

    if (RESEND_KEY) {
      await fetch('https://api.resend.com/emails', { method: 'POST',
        headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'M&P SEO <contacto@mulleryperez.cl>', to: ['contacto@mulleryperez.cl', 'graciela.trincado@lablab.cl', 'david.faille@lablab.cl'],
          subject: '🏆 LabLab Ranking Inicial PUBLICADO: ' + art.titulo_seo,
          html: '<h2>Ranking Inicial LabLab — Artículo Flagship</h2><p><strong>' + art.titulo_seo + '</strong></p><p>' + (art.contenido_html||'').length + ' caracteres HTML</p><p><a href="' + url + '">Ver artículo →</a></p><p><small>IndexNow + Google Ping enviados ✓</small></p>'
        })
      }).catch(function(){})
    }
  } else { console.error('❌', JSON.stringify(post).substring(0,200)); process.exit(1) }
}

main().catch(function(e) { console.error('Error:', e.message); process.exit(1) })
