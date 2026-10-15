// Portada sin H1 (auditoría 15 oct 2026): el primer encabezado "Especialistas en transición laboral" pasa de h3 a h1.
// Guarda respaldo del contenido original y verifica en vivo. Sin cambios de diseño (mismo texto y estilo).
var fs = require('fs')
var PROXY = process.env.PROXY_URL, SECRET = process.env.PROXY_SECRET
var AUTH = 'Basic ' + Buffer.from(process.env.LABLAB_WP_USER + ':' + process.env.LABLAB_WP_APP_PASSWORD).toString('base64')
async function wp(path, body) {
  var r = await fetch(PROXY + '/api/wp-proxy', { method: body ? 'POST' : 'GET', headers: { 'X-Proxy-Secret': SECRET, 'X-WP-Path': path, Authorization: AUTH, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  var t = await r.text(); try { return { s: r.status, j: JSON.parse(t) } } catch (e) { return { s: r.status, j: t.slice(0, 300) } }
}
;(async function () {
  var home = await wp('/wp-json/wp/v2/pages/8?context=edit&_fields=content')
  var raw = home.j.content.raw
  fs.writeFileSync('respaldo-portada.json', JSON.stringify({ raw: raw }))
  var viejo = '<h3><strong>Especialistas en transición laboral</strong></h3>'
  if (raw.indexOf(viejo) < 0) { console.log('No se encontró el encabezado, no se cambia'); return }
  if (/<h1[\s>]/i.test(raw)) { console.log('La portada ya tiene H1'); return }
  var nuevo = raw.replace(viejo, '<h1 style="font-size:1.17em;margin:0"><strong>Especialistas en transición laboral</strong></h1>')
  var u = await wp('/wp-json/wp/v2/pages/8', { content: nuevo })
  console.log('guardado', u.s)
  var h = await (await fetch('https://www.lablab.cl/?nc=' + Date.now(), { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) Chrome/130' } })).text()
  console.log('H1 en vivo:', (h.match(/<h1[^>]*>[\s\S]{0,120}?<\/h1>/i) || ['(no visible: posible caché o WAF)'])[0])
})()
