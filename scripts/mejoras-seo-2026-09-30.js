// Mejoras SEO LabLab (30 sept 2026) vía proxy: corrige links internos rotos en todos los posts.
// /contacto/ no existe (el formulario "Agenda una reunión" está en /servicios-para-empresas/).
var PROXY = process.env.PROXY_URL, SECRET = process.env.PROXY_SECRET
var AUTH = 'Basic ' + Buffer.from(process.env.LABLAB_WP_USER + ':' + process.env.LABLAB_WP_APP_PASSWORD).toString('base64')
async function wp(path, body) {
  var r = await fetch(PROXY + '/api/wp-proxy', { method: body ? 'POST' : 'GET', headers: { 'X-Proxy-Secret': SECRET, 'X-WP-Path': path, Authorization: AUTH, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  var t = await r.text(); try { return { s: r.status, j: JSON.parse(t) } } catch (e) { return { s: r.status, j: t.slice(0, 200) } }
}
var MAPA = [[/^(https?:\/\/(www\.)?lablab\.cl)?\/contacto\/?$/i, '/servicios-para-empresas/'], [/^(https?:\/\/(www\.)?lablab\.cl)?\/sobre-(lablab|nosotros)\/?$/i, '/nosotros/']]
;(async function () {
  var posts = []
  for (var p = 1; p <= 3; p++) { var r = await wp('/wp-json/wp/v2/posts?per_page=100&page=' + p + '&context=edit&_fields=id,slug,content'); if (!Array.isArray(r.j) || !r.j.length) break; posts = posts.concat(r.j); if (r.j.length < 100) break }
  console.log('posts', posts.length)
  var total = 0, editados = 0
  for (var i = 0; i < posts.length; i++) {
    var n = 0
    var nuevo = posts[i].content.raw.replace(/href=(["'])([^"']+)\1/gi, function (m, q, href) {
      for (var k = 0; k < MAPA.length; k++) if (MAPA[k][0].test(href)) { n++; return 'href=' + q + MAPA[k][1] + q }
      return m
    })
    if (n) { var u = await wp('/wp-json/wp/v2/posts/' + posts[i].id, { content: nuevo }); total += n; editados++; if (u.s !== 200) console.log('error', posts[i].slug, u.s) }
  }
  console.log('links corregidos', total, 'en', editados, 'posts')
})()
