// M&P 19 oct 2026: publica la clave de IndexNow en el sitio (si falta) y envía todas las URL de artículos publicados.
var lib = require('./lib/indexnow')
var SITIO = 'https://www.lablab.cl', CLAVE = '434d50eeb044c41d60e514bf9243b624'
var AUTH = 'Basic ' + Buffer.from(process.env.LABLAB_WP_USER + ':' + process.env.LABLAB_WP_APP_PASSWORD).toString('base64')
;(async function () {
  var urls = [SITIO + '/']
  for (var page = 1; page < 30; page++) {
    var r = await fetch(SITIO + '/wp-json/wp/v2/posts?per_page=100&page=' + page + '&_fields=link', { headers: { Authorization: AUTH } })
    if (!r.ok) break
    var ps = await r.json()
    if (!ps.length) break
    ps.forEach(function (p) { urls.push(p.link) })
    if (ps.length < 100) break
  }
  console.log('URL a avisar: ' + urls.length)
  var ok = await lib.avisarIndexNow(SITIO, CLAVE, urls.slice(0, 10000), AUTH)
  console.log('Clave publicada: ' + (await lib.claveEnSitio(SITIO, CLAVE)))
  if (!ok) process.exit(1)
})()
