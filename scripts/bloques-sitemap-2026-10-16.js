// Las 35 URL /blocks/ (bloques UX Builder de Flatsome) aparecen en el sitemap de WordPress (auditoría 15 oct 2026).
// Sin plugin no se puede filtrar el sitemap, pero el sitemap del núcleo EXCLUYE los contenidos con contraseña
// (WP_Sitemaps_Posts: has_password => false). Flatsome inserta el bloque con [block id=...] leyendo post_content
// directo, sin pedir contraseña → las páginas se ven igual. Se verifica en vivo comparando el HTML antes/después.
// MODO=prueba SOLO=<id> | MODO=aplicar | MODO=revertir (quita la contraseña a todos los que la tengan de este script)
var fs = require('fs')
var L = require('./lib/wp-proxy')
var CLAVE = 'myp-bloque-interno-2026'   // no protege nada sensible: solo saca el bloque del sitemap
;(async function () {
  var MODO = process.env.MODO || 'prueba'
  var bloques = await L.todos('/wp-json/wp/v2/ux-blocks?context=edit&status=publish&_fields=id,slug,status,password')
  console.log('bloques publicados', bloques.length)
  fs.writeFileSync('respaldo-bloques-estado.json', JSON.stringify(bloques, null, 1))
  var objetivo = bloques.filter(function (b) {
    if (MODO === 'revertir') return b.password === CLAVE
    if (MODO === 'prueba') return String(b.id) === process.env.SOLO
    return MODO === 'aplicar' && !b.password
  })
  for (var b of objetivo) {
    var u = await L.wp('/wp-json/wp/v2/ux-blocks/' + b.id, { password: MODO === 'revertir' ? '' : CLAVE })
    console.log(MODO, b.id, b.slug, u.s, u.j && (u.j.password ? 'con clave' : 'sin clave'))
  }
})()
