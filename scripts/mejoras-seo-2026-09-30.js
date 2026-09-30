// Mejoras SEO puntuales LabLab (30 sept 2026). Vía proxy Vercel (el WAF bloquea GitHub Actions).
// Eslogan del sitio corto: el <title> de la portada se arma "LabLab – <eslogan>" y tenía 142 caracteres.
var PROXY = process.env.PROXY_URL, SECRET = process.env.PROXY_SECRET
var AUTH = 'Basic ' + Buffer.from(process.env.LABLAB_WP_USER + ':' + process.env.LABLAB_WP_APP_PASSWORD).toString('base64')
async function wp(path, body) {
  var r = await fetch(PROXY + '/api/wp-proxy', { method: body ? 'POST' : 'GET', headers: { 'X-Proxy-Secret': SECRET, 'X-WP-Path': path, Authorization: AUTH, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  var t = await r.text(); try { return { s: r.status, j: JSON.parse(t) } } catch (e) { return { s: r.status, j: t.slice(0, 200) } }
}
;(async function () {
  var antes = await wp('/wp-json/wp/v2/settings')
  console.log('antes:', antes.s, JSON.stringify({ title: antes.j.title, description: antes.j.description }))
  if (antes.s !== 200) return console.log('sin acceso a settings')
  var d = await wp('/wp-json/wp/v2/settings', { description: 'Outplacement y transición laboral en Chile' })
  console.log('después:', d.s, JSON.stringify({ title: d.j.title, description: d.j.description }))
  var home = await (await fetch('https://www.lablab.cl/?nc=' + Date.now(), { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126' } })).text()
  var m = home.match(/<title>([^<]*)<\/title>/); console.log('title portada:', m && m[1], m && m[1].length)
})()
