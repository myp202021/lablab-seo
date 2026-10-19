// M&P 19 oct 2026 — regla: TODOS los agentes de blog avisan a IndexNow (Bing, Copilot/ChatGPT search, Yandex, Seznam, Naver)
// cada vez que publican. Para que IndexNow acepte el aviso, la clave tiene que estar en https://<sitio>/<clave>.txt:
// si no está, se publica con un snippet de Code Snippets ("IndexNow M&P"), se verifica la portada y, si algo falla, se desactiva.
// Mismo archivo en halterlift-panel, wiseplan-peru-seo y lablab-seo. Google no usa IndexNow: para Google cuentan el sitemap
// (Yoast/Rank Math) y Search Console.

async function req(url, opts) {
  var r = await fetch(url, Object.assign({ signal: AbortSignal.timeout(30000) }, opts || {}))
  var t = await r.text()
  var j = null
  try { j = JSON.parse(t) } catch (e) {}
  return { s: r.status, t: t, j: j }
}

async function claveEnSitio(sitio, clave) {
  var r = await req(sitio + '/' + clave + '.txt?nc=' + Date.now(), { headers: { 'User-Agent': 'Mozilla/5.0 (M&P IndexNow)' } })
  return r.s === 200 && r.t.trim() === clave
}

async function publicarClave(sitio, clave, auth, log) {
  var H = { Authorization: auth, 'Content-Type': 'application/json' }
  var lista = await req(sitio + '/wp-json/code-snippets/v1/snippets?per_page=100', { headers: H })
  if (!Array.isArray(lista.j)) { log('  IndexNow: no hay acceso a Code Snippets (' + lista.s + '): falta publicar la clave a mano'); return false }
  var codigo = "add_action('init', function () {\n" +
    "  if (trim(parse_url(\$_SERVER['REQUEST_URI'], PHP_URL_PATH), '/') === '" + clave + ".txt') {\n" +
    "    header('Content-Type: text/plain; charset=utf-8');\n    echo '" + clave + "';\n    exit;\n  }\n}, 0);"
  var ya = lista.j.find(function (x) { return /IndexNow M&P/.test(x.name || '') })
  var s = await req(sitio + '/wp-json/code-snippets/v1/snippets' + (ya ? '/' + ya.id : ''), {
    method: ya ? 'PUT' : 'POST', headers: H,
    body: JSON.stringify({ name: 'IndexNow M&P (clave para avisar artículos nuevos)', desc: 'Publica la clave de IndexNow en la raíz del sitio. Reversible desactivando.', code: codigo, scope: 'global', active: true })
  })
  if (!s.j || !s.j.id) { log('  IndexNow: no se pudo crear el snippet (' + s.s + ') ' + s.t.slice(0, 160)); return false }
  var home = await req(sitio + '/?nc=' + Date.now())
  if (home.s !== 200 || !/<\/html>/i.test(home.t)) {
    await req(sitio + '/wp-json/code-snippets/v1/snippets/' + s.j.id, { method: 'PUT', headers: H, body: JSON.stringify({ active: false }) })
    log('  IndexNow: la portada respondió ' + home.s + ' tras el snippet: se DESACTIVÓ')
    return false
  }
  return claveEnSitio(sitio, clave)
}

// sitio: 'https://www.ejemplo.cl' · clave: hex 32 · urls: lista · auth: 'Basic …' (para instalar la clave si falta)
async function avisarIndexNow(sitio, clave, urls, auth, log) {
  log = log || console.log
  try {
    var ok = await claveEnSitio(sitio, clave)
    if (!ok && auth) ok = await publicarClave(sitio, clave, auth, log)
    if (!ok) { log('  IndexNow: la clave no está publicada en ' + sitio + '/' + clave + '.txt — no se avisa'); return false }
    var r = await req('https://api.indexnow.org/indexnow', {
      method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(sitio).hostname, key: clave, keyLocation: sitio + '/' + clave + '.txt', urlList: urls })
    })
    log('  IndexNow: HTTP ' + r.s + (r.s === 200 || r.s === 202 ? ' OK' : ' ' + r.t.slice(0, 120)) + ' (' + urls.length + ' URL)')
    return r.s === 200 || r.s === 202
  } catch (e) { log('  IndexNow error: ' + e.message); return false }
}

module.exports = { avisarIndexNow, claveEnSitio }
