// 3 links rotos (auditoría 16 oct 2026): /contacto/ (no existe) en el post 9428 y un LinkedIn sin "https://" en la portada
// (el navegador lo trata como ruta interna → 404). MODO=respaldo | MODO=aplicar
var fs = require('fs')
var L = require('./lib/wp-proxy')
var CAMBIOS = [
  { tipo: 'posts', id: 9428, re: /href=(["'])(?:https?:\/\/(?:www\.)?lablab\.cl)?\/contacto\/?(?=["'#?])/g, por: 'href=$1/servicios-para-empresas/' },
  { tipo: 'pages', id: 8, re: /href=(["'])(?:https?:\/\/(?:www\.)?lablab\.cl\/)?(www\.linkedin\.com\/)/g, por: 'href=$1https://$2' }
]
;(async function () {
  var MODO = process.env.MODO || 'respaldo', respaldo = []
  for (var c of CAMBIOS) {
    var base = '/wp-json/wp/v2/' + c.tipo + '/' + c.id
    var r = await L.wp(base + '?context=edit&_fields=id,slug,content')
    var raw = r.j.content.raw, nuevo = raw.replace(c.re, c.por)
    respaldo.push({ tipo: c.tipo, id: c.id, content: raw })
    console.log(c.tipo, c.id, r.j.slug, 'coincidencias', (raw.match(c.re) || []).length)
    if (MODO === 'aplicar' && nuevo !== raw) { var u = await L.wp(base, { content: nuevo }); console.log('   guardado', u.s) }
  }
  fs.writeFileSync('respaldo-links-rotos.json', JSON.stringify(respaldo, null, 1))
})()
