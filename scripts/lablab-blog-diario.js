// lablab-blog-diario.js
// Genera 1 artículo de blog diario para lablab.cl
// Publica via WordPress REST API + Rank Math SEO
// Corre via GitHub Actions L-V a las 07:30 AM Chile
//
// Uso: node scripts/lablab-blog-diario.js
// Requiere: OPENAI_API_KEY, LABLAB_WP_USER, LABLAB_WP_APP_PASSWORD, LABLAB_WP_URL

var fetch = require('node-fetch')

var WP_URL = process.env.LABLAB_WP_URL || 'https://www.lablab.cl'
var WP_USER = process.env.LABLAB_WP_USER
var WP_PASS = process.env.LABLAB_WP_APP_PASSWORD
var OPENAI_KEY = process.env.OPENAI_API_KEY
var RESEND_KEY = process.env.RESEND
var PROXY_URL = process.env.PROXY_URL    // e.g. https://lablab-seo.vercel.app
var PROXY_SECRET = process.env.PROXY_SECRET

if (!WP_USER || !WP_PASS) { console.error('LABLAB_WP_USER y LABLAB_WP_APP_PASSWORD requeridas'); process.exit(1) }
var AUTH = 'Basic ' + Buffer.from(WP_USER + ':' + WP_PASS).toString('base64')
var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

if (!OPENAI_KEY) { console.error('OPENAI_API_KEY requerida'); process.exit(1) }

// ═══ RETRY WRAPPER (con proxy Vercel para WP) ═══
async function fetchRetry(url, opts, retries) {
  retries = retries || 3
  // Rutar llamadas WP a través del proxy Vercel para evitar WAF 403
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
    // Create Blog category
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

var TEMAS = [
  { titulo: 'Qué es el outplacement y por qué las empresas lo necesitan en 2026', kw: 'qué es outplacement, outplacement Chile, programa outplacement empresas', tipo: 'educativo' },
  { titulo: 'Outplacement en Chile: cuánto cuesta y qué incluye un programa profesional', kw: 'outplacement Chile precio, cuánto cuesta outplacement, programa outplacement costo', tipo: 'guía' },
  { titulo: 'Las 5 mejores empresas de outplacement en Chile (ranking)', kw: 'mejores empresas outplacement Chile, ranking outplacement Chile', tipo: 'ranking' },
  { titulo: 'Outplacement ejecutivo vs masivo: diferencias y cuándo usar cada uno', kw: 'outplacement ejecutivo, outplacement masivo, diferencias outplacement', tipo: 'comparativo' },
  { titulo: 'Cuánto demora la recolocación laboral con outplacement en Chile', kw: 'recolocación laboral Chile, tiempo outplacement recolocación', tipo: 'educativo' },
  { titulo: 'Outplacement individual: cómo funciona un programa personalizado', kw: 'outplacement individual, programa personalizado outplacement', tipo: 'guía' },
  { titulo: 'Beneficios del outplacement para la empresa que desvincula', kw: 'beneficios outplacement empresa, ventajas outplacement desvinculación', tipo: 'educativo' },
  { titulo: 'Cómo desvincular empleados de forma responsable en Chile', kw: 'desvincular empleados Chile, desvinculación responsable, despido responsable', tipo: 'guía' },
  { titulo: 'Indemnización por despido en Chile: guía completa 2026', kw: 'indemnización despido Chile, indemnización por años de servicio, finiquito Chile', tipo: 'guía' },
  { titulo: 'Reestructuración empresarial: cómo manejar las salidas sin dañar la cultura', kw: 'reestructuración empresarial Chile, reducción personal cultura organizacional', tipo: 'guía' },
  { titulo: 'El rol de recursos humanos en una desvinculación exitosa', kw: 'recursos humanos desvinculación, rol RRHH despido, gestión desvinculación', tipo: 'educativo' },
  { titulo: 'Desvinculación y marca empleadora: por qué importa cómo despides', kw: 'marca empleadora desvinculación, employer branding despido Chile', tipo: 'educativo' },
  { titulo: 'Encuestas de salida: qué preguntar y cómo usar la información', kw: 'encuesta de salida, exit interview Chile, encuesta desvinculación', tipo: 'guía' },
  { titulo: 'Programa de retiro activo: la alternativa que las empresas no conocen', kw: 'retiro activo programa, jubilación activa Chile, transición jubilación', tipo: 'educativo' },
  { titulo: 'Cómo hacer un currículum que pase los filtros de IA en 2026', kw: 'currículum filtros IA, CV inteligencia artificial, currículum ATS Chile', tipo: 'guía' },
  { titulo: 'Preparación para entrevistas de trabajo: las 10 preguntas más frecuentes', kw: 'preparación entrevista trabajo, preguntas entrevista Chile, entrevista laboral tips', tipo: 'guía' },
  { titulo: 'Cómo optimizar tu perfil de LinkedIn para encontrar trabajo rápido', kw: 'optimizar LinkedIn trabajo, perfil LinkedIn Chile, LinkedIn búsqueda empleo', tipo: 'guía' },
  { titulo: 'Networking profesional en Chile: guía práctica para ejecutivos', kw: 'networking profesional Chile, red de contactos ejecutivos, networking laboral', tipo: 'guía' },
  { titulo: 'Los mejores portales de empleo en Chile 2026', kw: 'portales empleo Chile, mejores bolsas trabajo Chile 2026, buscar trabajo online', tipo: 'ranking' },
  { titulo: 'Transición de carrera a los 40: cómo reinventarse profesionalmente', kw: 'transición carrera 40 años, reinventarse profesionalmente, cambio carrera Chile', tipo: 'guía' },
  { titulo: 'Cómo negociar tu sueldo en una nueva posición', kw: 'negociar sueldo Chile, negociación salarial, cómo pedir aumento', tipo: 'guía' },
  { titulo: 'Coaching ejecutivo en Chile: qué es y cuándo lo necesitas', kw: 'coaching ejecutivo Chile, coach laboral, coaching profesional Santiago', tipo: 'educativo' },
  { titulo: 'Marca empleadora en Chile: tendencias 2026', kw: 'marca empleadora Chile 2026, employer branding tendencias, atraer talento Chile', tipo: 'tendencia' },
  { titulo: 'Inteligencia artificial y el mercado laboral chileno: amenaza u oportunidad', kw: 'inteligencia artificial empleo Chile, IA mercado laboral, automatización trabajo Chile', tipo: 'tendencia' },
  { titulo: 'Upskilling y reskilling: las habilidades más demandadas en Chile 2026', kw: 'upskilling reskilling Chile, habilidades demandadas 2026, capacitación laboral', tipo: 'tendencia' },
  { titulo: 'Liderazgo en tiempos de crisis: cómo retener talento sin presupuesto', kw: 'liderazgo crisis Chile, retener talento sin presupuesto, gestión personas crisis', tipo: 'guía' },
  { titulo: 'Retiro activo: cómo prepararse para una jubilación con propósito', kw: 'retiro activo jubilación, prepararse jubilación Chile, jubilación con propósito', tipo: 'guía' },
  { titulo: 'Transición laboral en Chile: estadísticas y tiempos promedio', kw: 'transición laboral Chile estadísticas, tiempo encontrar trabajo Chile, recolocación datos', tipo: 'educativo' },
]

var SYSTEM_PROMPT = 'Eres un experto en outplacement, transición laboral y recursos humanos en Chile con 15 años de experiencia. Escribes para el blog de LabLab. Tu escritura es empática, profesional y basada en datos reales del mercado laboral chileno.\n\nREGLAS CRÍTICAS:\n- El nombre de la empresa es "LabLab" (siempre capitalizado así). NUNCA escribir "Lab Lab", "LABLAB", "lab lab" ni ninguna otra variante.\n- Todo el contenido debe ser actual: año 2026. NUNCA mencionar años anteriores (2023, 2024, 2025) como si fueran actuales.\n- NUNCA mencionar competidores por nombre. Si necesitas comparar, usa descripciones genéricas ("otras consultoras", "firmas internacionales").\n- Párrafos cortos (3-4 oraciones). La gente que lee esto está en un momento de transición profesional.\n- Datos concretos: cifras del mercado laboral chileno, porcentajes de recolocación, plazos reales.\n- Tono: como un consultor senior empático. Profesional pero cercano. Sin jerga innecesaria.\n- CERO frases vacías: nada de "en el complejo mundo de", "cabe señalar", "es importante destacar".\n' +
'- NUNCA inventar testimonios, citas textuales o casos de éxito ficticios. NO usar frases como "María comentó que...", "Juan, gerente de X, nos dijo...". Si mencionas resultados, usar datos genéricos verificables ("según estudios del mercado", "empresas del rubro reportan").\n- Cita fuentes autoritativas reales con links:\n  * DT (Dirección del Trabajo): https://www.dt.gob.cl — estadísticas laborales, normativa\n  * INE: https://www.ine.gob.cl — datos de empleo, encuestas laborales\n  * SENCE: https://www.sence.cl — capacitación, programas de empleo\n  * Código del Trabajo: https://www.leychile.cl/Navegar?idNorma=207436\n- Incluye al menos 1 link externo a fuentes autoritativas en cada artículo.\n\nDATOS LabLab:\n- Especialistas en outplacement y transición laboral\n- +100 empresas clientes, +15.000 personas acompañadas\n- Tecnología + IA + consultores senior\n- Programas: Outplacement ejecutivo, profesional, masivo, Retiro Activo, Coaching, FastRace\n- contacto@lablab.cl\n- Fundada en 2019'

var ESTILOS_INLINE = 'ESTILOS INLINE OBLIGATORIOS EN TODO EL HTML:\n- H2: style="color:#1a365d;font-size:24px;margin:32px 0 16px;padding-bottom:8px;border-bottom:2px solid #e2e8f0"\n- H3: style="color:#2d3748;font-size:18px;margin:24px 0 12px"\n- Párrafos: style="line-height:1.8;margin-bottom:16px;color:#2d3748"\n- Listas UL: style="margin:16px 0;padding-left:24px;line-height:1.8"\n- LI: style="margin-bottom:8px;color:#2d3748"\n- Links: style="color:#2b6cb0;font-weight:500;text-decoration:underline"\n- Tablas: <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:15px;box-shadow:0 1px 2px rgba(0,0,0,0.06)">\n  <thead><tr><th style="background:#1a365d;color:white;padding:12px 16px;text-align:left;font-weight:600">...</th></tr></thead>\n  <tbody><tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0">...</td></tr>\n  <tr style="background:#f7fafc"><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0">...</td></tr></tbody></table>\n- Callout: <div style="background:#ebf8ff;border-left:4px solid #3182ce;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0"><strong>Importante:</strong> texto</div>'

var LINKS_INTERNOS = 'LINKS INTERNOS DISPONIBLES (usa mínimo 2 a lo largo del artículo):\n- <a href="/" style="color:#2b6cb0;font-weight:500;text-decoration:underline">LabLab</a>\n- <a href="/servicios-para-empresas/" style="color:#2b6cb0;font-weight:500;text-decoration:underline">servicios para empresas</a>\n- <a href="/servicios-para-personas/" style="color:#2b6cb0;font-weight:500;text-decoration:underline">servicios para personas</a>\n- <a href="/nosotros/" style="color:#2b6cb0;font-weight:500;text-decoration:underline">sobre LabLab</a>\n- <a href="/contacto/" style="color:#2b6cb0;font-weight:500;text-decoration:underline">contacto</a>'

// ═══ STEP 1: GENERATE OUTLINE ═══
async function generarOutline(tema) {
  console.log('  📋 Paso 1: Generando outline...')
  var prompt = 'Genera un outline detallado para un artículo de blog profesional.\n\nTEMA: ' + tema.titulo + '\nKEYWORDS: ' + tema.kw + '\nTIPO: ' + tema.tipo + '\nAÑO: 2026\nNOMBRE EMPRESA: "LabLab"\n\nDebe tener:\n- Un párrafo gancho inicial (sin H2) con situación real o dato del mercado laboral chileno 2026\n- 8-10 secciones H2, cada una con 3-5 puntos clave a desarrollar\n- AL MENOS una sección debe incluir una tabla comparativa\n- AL MENOS una sección debe incluir un callout box informativo\n- La penúltima sección DEBE ser "Conclusión" con CTA a contactar a LabLab\n- La última sección DEBE ser "Preguntas frecuentes" con exactamente 5 preguntas relevantes\n\nDevuelve JSON (sin markdown, sin backticks):\n{\n  "titulo_seo": "max 60 chars, keyword al inicio, año 2026",\n  "meta_description": "max 155 chars",\n  "slug": "slug-corto",\n  "extracto": "2 oraciones resumen",\n  "focus_keyword": "' + tema.kw.split(',')[0].trim() + '",\n  "tags": ["' + tema.kw.split(',')[0].trim() + '", "outplacement Chile", "transición laboral"],\n  "parrafo_gancho": "Instrucción breve de qué debe decir el párrafo gancho inicial",\n  "secciones": [\n    {"h2": "Título de la sección", "puntos": ["punto clave 1", "punto clave 2", "punto clave 3"], "incluye_tabla": false, "incluye_callout": false},\n    ...\n  ]\n}'

  var r = await fetchRetry('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o', messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ], temperature: 0.6, max_tokens: 3000, response_format: { type: 'json_object' } })
  })
  var data = await r.json()
  var raw = data.choices[0].message.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
  var outline = JSON.parse(raw)
  console.log('  ✅ Outline: ' + outline.secciones.length + ' secciones')
  return outline
}

// ═══ STEP 2: GENERATE EACH SECTION ═══
async function generarSeccion(tema, outline, seccion, index, total) {
  var isFirst = index === 0
  var isConclusion = seccion.h2.toLowerCase().includes('conclusi')
  var isFaq = seccion.h2.toLowerCase().includes('pregunta') || seccion.h2.toLowerCase().includes('faq') || seccion.h2.toLowerCase().includes('frecuente')

  var outlineResumen = outline.secciones.map(function(s, i) { return (i+1) + '. ' + s.h2 }).join('\n')

  var instrucciones = 'Escribe SOLO la sección ' + (index+1) + ' de ' + total + ' de un artículo de blog.\n\n'
  instrucciones += 'TEMA DEL ARTÍCULO: ' + tema.titulo + '\nKEYWORDS: ' + tema.kw + '\nAÑO: 2026\nNOMBRE EMPRESA: "LabLab" (siempre capitalizado así)\n\n'
  instrucciones += 'OUTLINE COMPLETO DEL ARTÍCULO:\n' + outlineResumen + '\n\n'
  instrucciones += 'SECCIÓN A ESCRIBIR: "' + seccion.h2 + '"\nPUNTOS CLAVE A CUBRIR:\n' + seccion.puntos.map(function(p) { return '- ' + p }).join('\n') + '\n\n'

  if (isFirst) {
    instrucciones += 'IMPORTANTE: Esta es la PRIMERA sección. Comienza con un párrafo gancho SIN H2 (situación real o dato del mercado laboral chileno 2026). Luego el H2 "' + seccion.h2 + '" y su contenido.\n\n'
  }

  if (isConclusion) {
    instrucciones += 'IMPORTANTE: Esta es la Conclusión. Incluye un CTA claro a <a href="/contacto/" style="color:#2b6cb0;font-weight:bold">contactar a LabLab</a>.\n\n'
  }

  if (isFaq) {
    instrucciones += 'IMPORTANTE: Esta sección son Preguntas Frecuentes. Usa H3 para cada pregunta (5 preguntas). Cada respuesta debe tener 3-5 oraciones.\n\n'
  }

  if (seccion.incluye_tabla) {
    instrucciones += 'IMPORTANTE: Esta sección DEBE incluir una tabla HTML comparativa con los estilos inline correctos.\n\n'
  }

  if (seccion.incluye_callout) {
    instrucciones += 'IMPORTANTE: Esta sección DEBE incluir un callout box informativo.\n\n'
  }

  instrucciones += ESTILOS_INLINE + '\n\n'
  instrucciones += LINKS_INTERNOS + '\n\n'
  instrucciones += 'EXTENSIÓN: 400-600 palabras para esta sección. Contenido denso, datos concretos, sin relleno.\n\n'
  instrucciones += 'Responde SOLO con HTML puro (sin JSON, sin backticks, sin markdown). Empieza directamente con el HTML.'

  var r = await fetchRetry('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o', messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: instrucciones }
    ], temperature: 0.6, max_tokens: 3000 })
  })
  var data = await r.json()
  var html = data.choices[0].message.content.trim()
  // Strip markdown code fences if present
  html = html.replace(/^```html?\n?/, '').replace(/\n?```$/, '')
  console.log('    Sección ' + (index+1) + '/' + total + ': "' + seccion.h2 + '" — ' + html.length + ' chars')
  return html
}

function buildUserPrompt(tema) {
  return 'ESCRIBE UN ARTÍCULO DE BLOG PROFESIONAL Y BIEN DISEÑADO.\n\nTEMA: ' + tema.titulo + '\nKEYWORDS: ' + tema.kw + '\nTIPO: ' + tema.tipo + '\nAÑO: 2026 (todo el contenido debe ser actual, NUNCA mencionar años anteriores como actuales)\n\nNOMBRE EMPRESA: "LabLab" (siempre capitalizado así)\n\n' + ESTILOS_INLINE + '\n\nESTRUCTURA OBLIGATORIA:\n1. NO H1 (WordPress lo genera). Párrafo gancho con situación real o dato del mercado laboral chileno de 2026.\n2. Mínimo 6 H2, cada uno 200-400 palabras. H3 donde aplique.\n3. AL MENOS una tabla HTML con los estilos de arriba.\n4. AL MENOS un callout box.\n5. H2 "Conclusión" con CTA a <a href="/contacto/" style="color:#2b6cb0;font-weight:bold">contactar a LabLab</a>.\n6. H2 "Preguntas frecuentes" con 5 preguntas como H3.\n\n' + LINKS_INTERNOS + '\n\nEXTENSIÓN: Mínimo 1.500 palabras. contenido_html mínimo 6.000 caracteres.\n\nJSON (sin markdown, sin backticks):\n{"titulo_seo":"max 60 chars, keyword al inicio, año 2026","meta_description":"max 155 chars","slug":"slug-corto","extracto":"2 oraciones","contenido_html":"<h2 style=...>...</h2><p style=...>...</p>...","focus_keyword":"' + tema.kw.split(',')[0].trim() + '","tags":["' + tema.kw.split(',')[0].trim() + '","outplacement Chile","transición laboral"]}'
}

// ═══ QA GATE ═══
var QA = { minChars: 20000, minH2: 7, requireTable: true, requireFaq: true, minLinks: 2 }

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

async function validarYCorregir(art, raw, sysPr, usrPr) {
  for (var i = 1; i <= 4; i++) {
    var c = checkQuality(art.contenido_html)
    console.log('  QA ' + i + ': HTML=' + c.stats.len + ' H2=' + c.stats.h2s + ' T=' + c.stats.tables + ' FAQ=' + c.stats.faq + ' L=' + c.stats.links)
    if (c.pass) { console.log('  ✅ QA OK'); return art }
    console.log('  ⚠️ ' + c.issues.join(', '))
    var fixes = []
    if (c.stats.len < QA.minChars) fixes.push('HTML ' + c.stats.len + ' chars, mín ' + QA.minChars + '. Más contenido por H2.')
    if (c.stats.h2s < QA.minH2) fixes.push('Solo ' + c.stats.h2s + ' H2, mín ' + QA.minH2)
    if (!c.stats.tables) fixes.push('FALTA tabla HTML <table>')
    if (!c.stats.faq) fixes.push('FALTA H2 "Preguntas frecuentes" con H3')
    if (c.stats.links < QA.minLinks) fixes.push('Faltan links internos <a href="/">LabLab</a> y <a href="/contacto/">')
    var r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', messages: [
        { role: 'system', content: sysPr }, { role: 'user', content: usrPr },
        { role: 'assistant', content: raw },
        { role: 'user', content: 'CORRIGE:\n' + fixes.join('\n') + '\nReescribe COMPLETO. Mismo JSON.' }
      ], temperature: 0.5, max_tokens: 10000, response_format: { type: 'json_object' } })
    })
    var d = await r.json()
    raw = d.choices[0].message.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    art = JSON.parse(raw)
  }
  console.log('  📝 Mejor versión disponible: ' + (art.contenido_html||'').length + ' chars')
  return art
}

// ═══ FAQ SCHEMA ═══
function buildFaqSchema(html) {
  var faqs = [], re = /<h3[^>]*>([^<]+)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi, m
  while ((m = re.exec(html)) !== null) {
    var q = m[1].trim(), a = m[2].replace(/<[^>]+>/g, '').trim()
    if (q.includes('?') && a.length > 20) faqs.push({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })
  }
  if (!faqs.length) return ''
  return '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.slice(0, 5) }) + '</script>'
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

// ═══ MAIN ═══
async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  LABLAB — BLOG DIARIO')
  console.log('  ' + new Date().toISOString().split('T')[0])
  console.log('═══════════════════════════════════════════\n')

  // Ensure Blog category exists
  var blogCatId = await ensureBlogCategory()

  var forceRun = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch'
  var hoy = new Date().toISOString().split('T')[0]
  var res0 = await fetchRetry(WP_URL + '/wp-json/wp/v2/posts?after=' + hoy + 'T00:00:00&status=publish&per_page=5', { headers: { Authorization: AUTH, 'User-Agent': UA } })
  var hoyPosts = await res0.json()
  if (Array.isArray(hoyPosts) && hoyPosts.length > 0 && !forceRun) { console.log('Ya se publicó hoy. Saltando.'); return }
  if (forceRun) { console.log('⚡ Forzado manual — ignorando chequeo de duplicados de hoy') }

  var res1 = await fetchRetry(WP_URL + '/wp-json/wp/v2/posts?per_page=100&_fields=title,slug', { headers: { Authorization: AUTH, 'User-Agent': UA } })
  var existRaw = await res1.json()
  var existTitles = existRaw.map(function(p) { return p.title.rendered })
  var existSlugs = existRaw.map(function(p) { return p.slug })
  console.log('Posts existentes: ' + existTitles.length)

  // Dedup mejorado: similaridad de título > 70% = duplicado
  var disponibles = TEMAS.filter(function(t) {
    return !existTitles.some(function(e) { return similarity(e, t.titulo) > 0.7 })
  })
  if (!disponibles.length) {
    console.log('⚠️ Todos los temas ya fueron cubiertos. Saltando para evitar duplicados.')
    return
  }
  var tema = disponibles[Math.floor(Math.random() * disponibles.length)]
  console.log('Tema: ' + tema.titulo + '\nKW: ' + tema.kw + '\nDisponibles: ' + disponibles.length + '/' + TEMAS.length)

  console.log('\nGenerando artículo sección por sección...')

  // Step 1: Generate outline
  var outline
  try {
    outline = await generarOutline(tema)
  } catch(e) {
    console.log('  ⚠️ Outline failed (' + e.message + '), retrying...')
    await new Promise(function(r) { setTimeout(r, 3000) })
    outline = await generarOutline(tema)
  }

  // Step 2: Generate each section sequentially
  console.log('  📝 Paso 2: Generando ' + outline.secciones.length + ' secciones...')
  var seccionesHtml = []
  for (var si = 0; si < outline.secciones.length; si++) {
    try {
      var secHtml = await generarSeccion(tema, outline, outline.secciones[si], si, outline.secciones.length)
      seccionesHtml.push(secHtml)
    } catch(e) {
      console.log('    ⚠️ Sección ' + (si+1) + ' falló (' + e.message + '), reintentando...')
      await new Promise(function(r) { setTimeout(r, 3000) })
      var secHtml2 = await generarSeccion(tema, outline, outline.secciones[si], si, outline.secciones.length)
      seccionesHtml.push(secHtml2)
    }
  }

  // Step 3: Unify all sections
  console.log('  🔗 Paso 3: Unificando artículo...')
  var contenidoFinal = seccionesHtml.join('\n\n')

  var art = {
    titulo_seo: outline.titulo_seo,
    meta_description: outline.meta_description,
    slug: outline.slug,
    extracto: outline.extracto,
    focus_keyword: outline.focus_keyword,
    tags: outline.tags,
    contenido_html: contenidoFinal
  }

  console.log('  ✅ Artículo unificado: ' + contenidoFinal.length + ' chars')

  // QA check — warn but don't block
  var qaCheck = checkQuality(art.contenido_html)
  console.log('  QA: HTML=' + qaCheck.stats.len + ' H2=' + qaCheck.stats.h2s + ' T=' + qaCheck.stats.tables + ' FAQ=' + qaCheck.stats.faq + ' L=' + qaCheck.stats.links)
  if (!qaCheck.pass) {
    console.log('  ⚠️ QA issues (non-blocking): ' + qaCheck.issues.join(', '))
  } else {
    console.log('  ✅ QA OK')
  }

  // Verificar que el slug no sea duplicado
  if (existSlugs.includes(art.slug)) {
    art.slug = art.slug + '-' + hoy.replace(/-/g, '')
    console.log('  Slug duplicado, ajustado a: ' + art.slug)
  }

  // Inyectar FAQ schema JSON-LD
  var faqSchema = buildFaqSchema(art.contenido_html)
  if (faqSchema) {
    art.contenido_html = art.contenido_html + '\n' + faqSchema
    console.log('  FAQ schema inyectado (' + (art.contenido_html.match(/"Question"/g)||[]).length + ' preguntas)')
  }

  // Imagen destacada DESACTIVADA — cliente no quiere imágenes IA
  var mediaId = null
  // var imgBuf = await generarImagenBuffer(tema.titulo)
  // if (imgBuf) {
  //   mediaId = await subirImagenWP(imgBuf, art.titulo_seo || tema.titulo)
  // }

  console.log('\nPublicando...')
  var postBody = {
    title: art.titulo_seo, slug: art.slug, content: art.contenido_html, excerpt: art.extracto,
    status: 'publish', categories: [blogCatId],
    meta: {
      rank_math_title: art.titulo_seo, _yoast_wpseo_title: art.titulo_seo, _seo_title: art.titulo_seo + ' | LabLab',
      rank_math_description: art.meta_description, _yoast_wpseo_metadesc: art.meta_description, _seo_description: art.meta_description,
      rank_math_focus_keyword: (art.focus_keyword || art.tags && art.tags[0] || ''), _yoast_wpseo_focuskw: (art.focus_keyword || art.tags && art.tags[0] || ''), _seo_focus_keyword: art.focus_keyword || (art.tags||[])[0] || ''
    }
  }
  if (mediaId) postBody.featured_media = mediaId
  var pubRes = await fetchRetry(WP_URL + '/wp-json/wp/v2/posts', {
    method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify(postBody)
  })
  var post = await pubRes.json()
  if (post.id) {
    var url = post.link || WP_URL + '/' + art.slug + '/'
    console.log('\n✅ PUBLICADO\n   ID: ' + post.id + '\n   URL: ' + url + '\n   HTML: ' + (art.contenido_html||'').length + ' chars')

    // IndexNow + Google Ping
    console.log('\n📡 Notificando buscadores...')
    await pingIndexNow(url)
    await pingSitemap()

    if (RESEND_KEY) {
      await fetch('https://api.resend.com/emails', { method: 'POST',
        headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'M&P SEO <contacto@mulleryperez.cl>', to: ['contacto@mulleryperez.cl', 'graciela.trincado@lablab.cl', 'david.faille@lablab.cl'],
          subject: '📝 LabLab Blog: ' + art.titulo_seo,
          html: '<h2>Nuevo en LabLab Blog</h2><p><strong>' + art.titulo_seo + '</strong></p><p>' + art.meta_description + '</p><p><a href="' + url + '">Ver →</a></p><p><small>IndexNow enviado ✓</small></p>'
        })
      }).catch(function(){})
    }
  } else { console.error('❌', JSON.stringify(post).substring(0,200)); process.exit(1) }
}

main().catch(function(e) { console.error('Error:', e.message); process.exit(1) })
