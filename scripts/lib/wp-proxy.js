// Llamadas a la REST API de LabLab vía el proxy de Vercel (el WAF del hosting bloquea las IP de GitHub Actions).
var PROXY = process.env.PROXY_URL, SECRET = process.env.PROXY_SECRET
var AUTH = 'Basic ' + Buffer.from(process.env.LABLAB_WP_USER + ':' + process.env.LABLAB_WP_APP_PASSWORD).toString('base64')
async function wp(path, body, method) {
  for (var i = 0; i < 3; i++) {
    try {
      var r = await fetch(PROXY + '/api/wp-proxy', {
        method: method || (body ? 'POST' : 'GET'),
        headers: { 'X-Proxy-Secret': SECRET, 'X-WP-Path': path, Authorization: AUTH, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      })
      var t = await r.text()
      if (r.status >= 500 && i < 2) { await new Promise(function (ok) { setTimeout(ok, 3000) }); continue }
      try { return { s: r.status, j: JSON.parse(t) } } catch (e) { return { s: r.status, j: t.slice(0, 300) } }
    } catch (e) { if (i === 2) return { s: 0, j: e.message } }
  }
}
// Todos los elementos de una colección (lotes chicos: Vercel corta respuestas > 4,5 MB)
async function todos(base, porPagina) {
  var out = []
  for (var p = 1; p <= 30; p++) {
    var r = await wp(base + (base.indexOf('?') < 0 ? '?' : '&') + 'per_page=' + (porPagina || 20) + '&page=' + p)
    if (!Array.isArray(r.j) || !r.j.length) break
    out = out.concat(r.j)
    if (r.j.length < (porPagina || 20)) break
  }
  return out
}
async function enVivo(url, opts) {
  return fetch(url, Object.assign({ redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) Chrome/130' } }, opts || {}))
}
module.exports = { wp: wp, todos: todos, enVivo: enVivo }
