// Instala y activa Rank Math SEO en lablab.cl (autorizado por Gustavo Padilla, CTO LabLab, vía Graciela 30 sept 2026)
// y deja título/descripción de la portada. Verifica el <head> después.
var PROXY = process.env.PROXY_URL, SECRET = process.env.PROXY_SECRET
var AUTH = 'Basic ' + Buffer.from(process.env.LABLAB_WP_USER + ':' + process.env.LABLAB_WP_APP_PASSWORD).toString('base64')
async function wp(path, body) {
  var r = await fetch(PROXY + '/api/wp-proxy', { method: body ? 'POST' : 'GET', headers: { 'X-Proxy-Secret': SECRET, 'X-WP-Path': path, Authorization: AUTH, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  var t = await r.text(); try { return { s: r.status, j: JSON.parse(t) } } catch (e) { return { s: r.status, j: t.slice(0, 300) } }
}
;(async function () {
  var pl = await wp('/wp-json/wp/v2/plugins?_fields=plugin,status,name')
  console.log('plugins', pl.s, Array.isArray(pl.j) ? pl.j.map(function (p) { return p.plugin + ':' + p.status }).join(', ') : JSON.stringify(pl.j))
  var ya = Array.isArray(pl.j) && pl.j.find(function (p) { return /seo-by-rank-math\//.test(p.plugin) })
  if (!ya) { var i = await wp('/wp-json/wp/v2/plugins', { slug: 'seo-by-rank-math', status: 'active' }); console.log('instalar', i.s, JSON.stringify(i.j).slice(0, 200)) }
  else if (ya.status !== 'active') { var a = await wp('/wp-json/wp/v2/plugins/' + ya.plugin.replace('.php', ''), { status: 'active' }); console.log('activar', a.s) }
  else console.log('Rank Math ya activo')
  var front = await wp('/wp-json/wp/v2/pages?slug=inicio&_fields=id')
  var id = front.j && front.j[0] && front.j[0].id
  var m = await wp('/wp-json/rankmath/v1/updateMeta', { objectType: 'post', objectID: id, meta: { rank_math_title: 'Outplacement y transición laboral en Chile | LabLab', rank_math_description: 'LabLab acompaña a empresas y personas en procesos de outplacement y transición laboral en Chile, con coaches senior y programas a medida. Conversemos.' } })
  console.log('portada', id, m.s, JSON.stringify(m.j).slice(0, 150))
  var h = await (await fetch('https://www.lablab.cl/?nc=' + Date.now(), { headers: { 'User-Agent': 'Mozilla/5.0' } })).text()
  console.log('title:', (h.match(/<title>([^<]*)/) || [])[1])
  console.log('description:', (h.match(/name="description" content="([^"]*)/) || [])[1])
  console.log('og:image:', !!/property="og:image"/.test(h), '| schema:', (h.match(/"@type":"[A-Za-z]+"/g) || []).slice(0, 5).join(' '))
})()
