// Las 35 URL /blocks/ (bloques UX Builder de Flatsome) aparecen en el sitemap de WordPress (auditoría 15 oct 2026).
// Sin plugin no se puede filtrar el sitemap, pero el sitemap del núcleo EXCLUYE los contenidos con contraseña
// (WP_Sitemaps_Posts: has_password => false). Flatsome inserta el bloque con [block id=...] leyendo post_content
// directo, sin pedir contraseña → las páginas se ven igual. Se verifica en vivo comparando el HTML antes/después.
// MODO=prueba SOLO=<id> | MODO=aplicar | MODO=revertir (quita la contraseña a todos los que la tengan de este script)
// 16 oct: la contraseña NO los saca del sitemap en WP 6.3 (probado en cr1 y revertido). Alternativa: estado "privado"
// (el sitemap solo lista publicados y /blocks/x/ da 404 a visitantes), siempre que Flatsome siga mostrando el bloque.
// MODO=privado-prueba SOLO=<id> | MODO=privado-aplicar | MODO=privado-revertir
var fs = require('fs')
var L = require('./lib/wp-proxy')
var CLAVE = 'myp-bloque-interno-2026'   // no protege nada sensible: solo saca el bloque del sitemap
;(async function () {
  var MODO = process.env.MODO || 'prueba'
  if (/^privado/.test(MODO)) {
    var todosB = await L.todos('/wp-json/wp/v2/ux-blocks?context=edit&status=publish,private&_fields=id,slug,status')
    fs.writeFileSync('respaldo-bloques-estado.json', JSON.stringify(todosB, null, 1))
    var obj = todosB.filter(function (b) {
      if (MODO === 'privado-revertir') return b.status === 'private' && (!process.env.SOLO || String(b.id) === process.env.SOLO)
      if (MODO === 'privado-prueba') return String(b.id) === process.env.SOLO && b.status === 'publish'
      return MODO === 'privado-aplicar' && b.status === 'publish'
    })
    for (var x of obj) {
      var v = await L.wp('/wp-json/wp/v2/ux-blocks/' + x.id, { status: MODO === 'privado-revertir' ? 'publish' : 'private' })
      console.log(MODO, x.id, x.slug, v.s, v.j && v.j.status)
    }
    return
  }
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
