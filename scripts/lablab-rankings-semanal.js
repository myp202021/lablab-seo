// lablab-rankings-semanal.js
// Genera 1 artículo de ranking/guía exhaustiva semanal para lablab.cl
// Corre cada viernes via GitHub Actions
//
// Uso: node scripts/lablab-rankings-semanal.js
// Requiere: OPENAI_API_KEY, LABLAB_WP_USER, LABLAB_WP_APP_PASSWORD, LABLAB_WP_URL

var fetch = require('node-fetch')

var WP_URL = process.env.LABLAB_WP_URL || 'https://www.lablab.cl'
var WP_USER = process.env.LABLAB_WP_USER
var WP_PASS = process.env.LABLAB_WP_APP_PASSWORD
var OPENAI_KEY = process.env.OPENAI_API_KEY
var RESEND_KEY = process.env.RESEND

if (!WP_USER || !WP_PASS) { console.error('LABLAB_WP_USER y LABLAB_WP_APP_PASSWORD requeridas'); process.exit(1) }
var AUTH = 'Basic ' + Buffer.from(WP_USER + ':' + WP_PASS).toString('base64')
var UA = "LabLab-Blog-Agent/1.0 (WordPress; +https://www.lablab.cl)"

if (!OPENAI_KEY) { console.error('OPENAI_API_KEY requerida'); process.exit(1) }

// ═══ RETRY WRAPPER ═══
async function fetchRetry(url, opts, retries) {
  retries = retries || 5
  for (var i = 0; i < retries; i++) {
    try {
      var r = await fetch(url, opts)
      if (r.ok || r.status < 500) {
        // Check if response is HTML instead of JSON (hosting WAF block)
        var ct = r.headers.get('content-type') || ''
        if (url.includes('wp-json') && ct.includes('text/html')) {
          console.log('  ⚠️ HTML response en vez de JSON (WAF?) intento ' + (i+1) + '/' + retries)
          if (i < retries - 1) { await new Promise(function(r) { setTimeout(r, 5000 * (i+1)) }); continue }
        }
        return r
      }
      console.log('  ⚠️ HTTP ' + r.status + ' (intento ' + (i+1) + '/' + retries + ')')
    } catch(e) {
      console.log('  ⚠️ ' + e.message + ' (intento ' + (i+1) + '/' + retries + ')')
    }
    if (i < retries - 1) await new Promise(function(r) { setTimeout(r, 5000 * (i+1)) })
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
    var prompt = 'Professional blog header about: ' + titulo + '. Chilean corporate/HR context. Clean modern design, warm professional tones. NO text, NO words, NO letters, NO numbers in the image.'
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
  return '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.slice(0, 8) }) + '</script>'
}

// ═══ NORMALIZE PARA DEDUP ═══
function normalize(s) {
  return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
}

function similarity(a, b) {
  a = normalize(a); b = normalize(b)
  if (a === b) return 1
  var wordsA = a.split(' '), wordsB = b.split(' ')
  var common = wordsA.filter(function(w) { return wordsB.includes(w) }).length
  return common / Math.max(wordsA.length, wordsB.length)
}

var TEMAS = [
  { titulo: 'Las 10 empresas de outplacement más reconocidas en Chile', kw: 'empresas outplacement Chile, mejores outplacement Chile, ranking outplacement', tipo: 'ranking' },
  { titulo: 'Los 7 mejores portales de empleo en Chile 2026', kw: 'mejores portales empleo Chile 2026, bolsas trabajo Chile, buscar trabajo online', tipo: 'ranking' },
  { titulo: 'Las 5 habilidades más demandadas por las empresas chilenas', kw: 'habilidades demandadas Chile, competencias laborales 2026, skills más pedidos', tipo: 'ranking' },
  { titulo: 'Los 8 mejores programas de coaching ejecutivo en Chile', kw: 'coaching ejecutivo Chile, mejores coaches Chile, programas coaching Santiago', tipo: 'ranking' },
  { titulo: 'Ranking de consultoras de transición laboral en Chile 2026', kw: 'consultoras transición laboral Chile, ranking outplacement 2026, transición carrera', tipo: 'ranking' },
  { titulo: 'Las mejores herramientas de IA para buscar trabajo en Chile', kw: 'herramientas IA buscar trabajo, inteligencia artificial empleo, IA currículum Chile', tipo: 'ranking' },
  { titulo: 'Top 10 empresas con mejor marca empleadora en Chile', kw: 'marca empleadora Chile, employer branding ranking, mejores empresas trabajar Chile', tipo: 'ranking' },
  { titulo: 'Los programas de retiro activo más completos en Chile', kw: 'retiro activo Chile, programas jubilación activa, transición jubilación Chile', tipo: 'ranking' },
]

var SYSTEM_PROMPT = 'Eres un experto en outplacement, transición laboral y recursos humanos en Chile con 15 años de experiencia. Escribes rankings y guías exhaustivas para el blog de LabLab. Tono: analista riguroso pero accesible. Datos verificables del mercado laboral chileno. NUNCA contenido genérico.\n\nREGLAS CRÍTICAS:\n- El nombre es "LabLab" (siempre capitalizado así). NUNCA "Lab Lab", "LABLAB" ni variantes.\n- Todo contenido es de 2026. NUNCA mencionar años anteriores como si fueran actuales.\n- NO mencionar competidores por nombre. Usar descripciones genéricas ("firmas internacionales", "consultoras locales").\n- Tablas HTML con estilos inline profesionales (background en headers, padding, bordes).\n- Usar callout boxes: <div style="background:#ebf8ff;border-left:4px solid #3182ce;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">...</div>\n\nSIEMPRE cita fuentes autoritativas con links reales:\n- DT (Dirección del Trabajo): https://www.dt.gob.cl — estadísticas laborales, normativa\n- INE: https://www.ine.gob.cl — datos de empleo, encuestas laborales\n- SENCE: https://www.sence.cl — capacitación, programas de empleo\n- Código del Trabajo: https://www.leychile.cl/Navegar?idNorma=207436\nIncluye al menos 2 links externos a estas fuentes en cada ranking.\n\nDATOS LabLab:\n- Especialistas en outplacement y transición laboral\n- +100 empresas clientes, +15.000 personas acompañadas\n- Tecnología + IA + consultores senior\n- Programas: Outplacement ejecutivo, profesional, masivo, Retiro Activo, Coaching, FastRace\n- contacto@lablab.cl\n- Fundada en 2019'

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  LABLAB — RANKING SEMANAL')
  console.log('  ' + new Date().toISOString().split('T')[0])
  console.log('═══════════════════════════════════════════\n')

  var blogCatId = await ensureBlogCategory()

  var res0 = await fetchRetry(WP_URL + '/wp-json/wp/v2/posts?per_page=50&_fields=title,slug', { headers: { Authorization: AUTH, 'User-Agent': UA } })
  var existRaw = await res0.json()
  var existTitles = existRaw.map(function(p) { return p.title.rendered })
  var existSlugs = existRaw.map(function(p) { return p.slug })

  var disponibles = TEMAS.filter(function(t) {
    return !existTitles.some(function(e) { return similarity(e, t.titulo) > 0.7 })
  })
  if (!disponibles.length) disponibles = TEMAS
  var tema = disponibles[Math.floor(Math.random() * disponibles.length)]
  console.log('Tema: ' + tema.titulo + '\nKW: ' + tema.kw + '\nDisponibles: ' + disponibles.length + '/' + TEMAS.length)

  var userPrompt = 'ESCRIBE UN ARTÍCULO DE RANKING/GUÍA EXHAUSTIVA.\n\nTEMA: ' + tema.titulo + '\nKEYWORDS: ' + tema.kw + '\nTIPO: ' + tema.tipo
    + '\n\nESTILOS INLINE OBLIGATORIOS EN TODO EL HTML:\n- H2: style="color:#1a365d;font-size:24px;margin:32px 0 16px;padding-bottom:8px;border-bottom:2px solid #e2e8f0"\n- H3: style="color:#2d3748;font-size:18px;margin:24px 0 12px"\n- Párrafos: style="line-height:1.8;margin-bottom:16px;color:#2d3748"\n- Listas UL: style="margin:16px 0;padding-left:24px;line-height:1.8"\n- LI: style="margin-bottom:8px;color:#2d3748"\n- Links: style="color:#2b6cb0;font-weight:500;text-decoration:underline"\n- Tablas: <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:15px;box-shadow:0 1px 2px rgba(0,0,0,0.06)"><thead><tr><th style="background:#1a365d;color:white;padding:12px 16px;text-align:left;font-weight:600">...</th></tr></thead><tbody><tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0">...</td></tr><tr style="background:#f7fafc"><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0">...</td></tr></tbody></table>\n- Callout: <div style="background:#ebf8ff;border-left:4px solid #3182ce;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0"><strong>Dato clave:</strong> texto</div>'
    + '\n\nESTRUCTURA:\n1. NO H1. Párrafo gancho con dato impactante del mercado laboral chileno.\n2. H2 con metodología o contexto (si es ranking).\n3. Cada item del ranking como H3 con 200+ palabras, citando datos, criterios, ventajas.\n4. H2 "Tabla comparativa" con tabla HTML <table> completa.\n5. H2 de análisis: "Qué considerar para tu decisión" con H3 por criterio.\n6. H2 "Conclusión" con CTA a <a href="/contacto/" style="color:#2b6cb0;font-weight:bold">contactar a LabLab</a>.\n7. H2 "Preguntas frecuentes" con 8 preguntas como H3, respuestas de 4-5 oraciones.\n\nDATOS LabLab:\n- Especialistas en outplacement y transición laboral\n- +100 empresas, +15.000 personas, tecnología + IA + consultores senior\n- Programas: Outplacement ejecutivo, profesional, masivo, Retiro Activo, Coaching, FastRace\n\nLINKS INTERNOS (mínimo 3):\n- <a href="/" style="color:#2b6cb0;font-weight:500;text-decoration:underline">LabLab</a>\n- <a href="/servicios-para-empresas/" style="color:#2b6cb0;font-weight:500;text-decoration:underline">servicios para empresas</a>\n- <a href="/servicios-para-personas/" style="color:#2b6cb0;font-weight:500;text-decoration:underline">servicios para personas</a>\n- <a href="/contacto/" style="color:#2b6cb0;font-weight:500;text-decoration:underline">contacto</a>\n\nEXTENSIÓN: Mínimo 3.500 palabras. contenido_html mínimo 10.000 caracteres.\n\nJSON (sin backticks):\n{"titulo_seo":"max 60","meta_description":"max 155","slug":"slug-corto","extracto":"2 oraciones","contenido_html":"<h2>...</h2>...","focus_keyword":"' + tema.kw.split(',')[0].trim() + '","tags":["' + tema.kw.split(',')[0].trim() + '","outplacement Chile","ranking"]}'

  console.log('\nGenerando ranking...')
  var r = await fetchRetry('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userPrompt }], temperature: 0.6, max_tokens: 12000, response_format: { type: 'json_object' } })
  })
  var data = await r.json()
  var raw = data.choices && data.choices[0] ? data.choices[0].message.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '') : ''
  var art
  try {
    art = JSON.parse(raw)
  } catch(parseErr) {
    console.log('⚠️ Respuesta no es JSON, reintentando...')
    console.log('Respuesta raw:', raw.substring(0, 200))
    await new Promise(function(r) { setTimeout(r, 3000) })
    var r2 = await fetchRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userPrompt }], temperature: 0.5, max_tokens: 12000, response_format: { type: 'json_object' } })
    })
    var data2 = await r2.json()
    raw = data2.choices[0].message.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    art = JSON.parse(raw)
  }
  console.log('HTML: ' + (art.contenido_html||'').length + ' chars')

  // Verificar slug no duplicado
  if (existSlugs.includes(art.slug)) {
    art.slug = art.slug + '-' + new Date().toISOString().split('T')[0].replace(/-/g, '')
    console.log('  Slug duplicado, ajustado a: ' + art.slug)
  }

  // QA loop
  var QA = { minChars: 10000, minH2: 6, minLinks: 3 }
  for (var i = 1; i <= 4; i++) {
    var html = art.contenido_html || ''
    var len = html.length, h2s = html.split('<h2').length-1, tables = html.split('<table').length-1
    var faq = /<h[23][^>]*>[^<]*(pregunta|faq|frecuente)/i.test(html)
    var links = (html.match(/href="\//g)||[]).length
    var issues = []
    if (len < QA.minChars) issues.push('HTML ' + len + ' (mín ' + QA.minChars + ')')
    if (h2s < QA.minH2) issues.push('H2 ' + h2s + ' (mín ' + QA.minH2 + ')')
    if (tables < 1) issues.push('Sin tabla')
    if (!faq) issues.push('Sin FAQ')
    if (links < QA.minLinks) issues.push('Links ' + links + ' (mín ' + QA.minLinks + ')')
    console.log('QA ' + i + ': ' + len + ' chars, ' + h2s + ' H2, ' + tables + ' tablas, FAQ:' + faq + ', links:' + links)
    if (!issues.length) { console.log('✅ QA OK'); break }
    console.log('⚠️ ' + issues.join(', '))
    var retry = await fetchRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', messages: [
        { role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userPrompt },
        { role: 'assistant', content: raw },
        { role: 'user', content: 'CORRIGE: ' + issues.join('. ') + '. Reescribe COMPLETO. Mismo JSON.' }
      ], temperature: 0.5, max_tokens: 14000, response_format: { type: 'json_object' } })
    })
    var rd = await retry.json()
    raw = rd.choices[0].message.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    art = JSON.parse(raw)
  }

  // Inyectar FAQ schema JSON-LD
  var faqSchema = buildFaqSchema(art.contenido_html)
  if (faqSchema) {
    art.contenido_html = art.contenido_html + '\n' + faqSchema
    console.log('  FAQ schema inyectado (' + (art.contenido_html.match(/"Question"/g)||[]).length + ' preguntas)')
  }

  // Generar y subir imagen destacada
  var mediaId = null
  var imgBuf = await generarImagenBuffer(tema.titulo)
  if (imgBuf) {
    mediaId = await subirImagenWP(imgBuf, art.titulo_seo || tema.titulo)
  }

  console.log('\nPublicando...')
  var postBody = {
    title: art.titulo_seo, slug: art.slug, content: art.contenido_html, excerpt: art.extracto,
    status: 'publish', categories: [blogCatId],
    meta: {
      rank_math_title: art.titulo_seo + ' | LabLab',
      rank_math_description: art.meta_description,
      rank_math_focus_keyword: art.focus_keyword || tema.kw.split(',')[0].trim()
    }
  }
  if (mediaId) postBody.featured_media = mediaId
  var pubRes = await fetchRetry(WP_URL + '/wp-json/wp/v2/posts', {
    method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify(postBody)
  })
  var post = await pubRes.json()
  if (post.id) {
    var url = post.link || WP_URL + '/' + art.slug
    console.log('\n✅ PUBLICADO\n   ID: ' + post.id + '\n   URL: ' + url + '\n   HTML: ' + (art.contenido_html||'').length + ' chars')

    console.log('\n📡 Notificando buscadores...')
    await pingIndexNow(url)
    await pingSitemap()

    if (RESEND_KEY) {
      await fetch('https://api.resend.com/emails', { method: 'POST',
        headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'M&P SEO <contacto@mulleryperez.cl>', to: ['contacto@mulleryperez.cl'],
          subject: '📊 LabLab Ranking: ' + art.titulo_seo,
          html: '<h2>Nuevo ranking en LabLab</h2><p><strong>' + art.titulo_seo + '</strong></p><p>' + art.meta_description + '</p><p><a href="' + url + '">Ver →</a></p><p><small>IndexNow enviado ✓</small></p>'
        })
      }).catch(function(){})
    }
  } else { console.error('❌', JSON.stringify(post).substring(0,200)); process.exit(1) }
}

main().catch(function(e) { console.error('Error:', e.message); process.exit(1) })
