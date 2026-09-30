// Corrige tildes rotas en LabLab (reporte de Graciela 30 sept): el contenido tiene "u00f3" en vez de "ó"
// (se perdió la barra de los escapes \u00XX al guardar). Recorre páginas, posts y bloques; respalda antes de editar.
var fs = require('fs')
var PROXY = process.env.PROXY_URL, SECRET = process.env.PROXY_SECRET
var AUTH = 'Basic ' + Buffer.from(process.env.LABLAB_WP_USER + ':' + process.env.LABLAB_WP_APP_PASSWORD).toString('base64')
var APLICAR = process.env.APLICAR === '1'
async function wp(path, body) {
  var r = await fetch(PROXY + '/api/wp-proxy', { method: body ? 'POST' : 'GET', headers: { 'X-Proxy-Secret': SECRET, 'X-WP-Path': path, Authorization: AUTH, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  var t = await r.text(); try { return { s: r.status, j: JSON.parse(t) } } catch (e) { return { s: r.status, j: t.slice(0, 200) } }
}
// "u00f3" sin barra delante (y no dentro de un escape válido "ó") → carácter real
var RE = /(^|[^\\0-9a-f])u00([0-9a-f]{2})(?![0-9a-f]{3})/gi
function arreglar(s) { var n = 0; var out = s.replace(RE, function (m, pre, hex) { n++; return pre + String.fromCharCode(parseInt(hex, 16)) }); return { out: out, n: n } }
;(async function () {
  fs.mkdirSync('respaldo', { recursive: true })
  var tipos = ['pages', 'posts', 'blocks'], total = 0
  for (var t = 0; t < tipos.length; t++) {
    var items = []
    for (var p = 1; p <= 5; p++) {
      var r = await wp('/wp-json/wp/v2/' + tipos[t] + '?per_page=100&page=' + p + '&status=publish,draft,private&context=edit&_fields=id,slug,title,content')
      if (!Array.isArray(r.j) || !r.j.length) { if (p === 1) console.log(tipos[t], 'no disponible', r.s); break }
      items = items.concat(r.j); if (r.j.length < 100) break
    }
    console.log(tipos[t], items.length)
    for (var i = 0; i < items.length; i++) {
      var it = items[i], c = arreglar(it.content.raw || ''), ti = arreglar((it.title && it.title.raw) || '')
      if (!c.n && !ti.n) continue
      console.log((APLICAR ? 'CORRIGE ' : 'ENCONTRADO ') + tipos[t] + ' ' + it.id + ' ' + it.slug + ': ' + (c.n + ti.n) + ' tildes | ej: ' + (it.content.raw.match(/.{0,25}u00[0-9a-f]{2}.{0,15}/i) || [''])[0].replace(/\s+/g, ' '))
      fs.writeFileSync('respaldo/' + tipos[t] + '-' + it.id + '.json', JSON.stringify(it))
      total += c.n + ti.n
      if (APLICAR) { var body = { content: c.out }; if (ti.n) body.title = ti.out; var u = await wp('/wp-json/wp/v2/' + tipos[t] + '/' + it.id, body); if (u.s !== 200) console.log('  error', u.s, JSON.stringify(u.j).slice(0, 150)) }
    }
  }
  console.log('total tildes rotas', total, APLICAR ? '(corregidas)' : '(solo revisión)')
})()
