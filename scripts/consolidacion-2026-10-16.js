// Consolidación de temas repetidos (auditoría 15 oct 2026, aprobado por Christopher 16 oct) SIN plugin de redirecciones.
//
// Mecanismo (núcleo de WordPress, wp_old_slug_redirect): cuando un post publicado cambia de slug, WP guarda el slug
// anterior en _wp_old_slug y responde 301 desde la URL vieja a la nueva. Por cada copia:
//   1) la copia pasa a BORRADOR y su slug a "<slug>-consolidado" (en borrador WP no registra slug viejo → libera el slug);
//   2) la principal toma el slug de la copia y   3) vuelve a su propio slug → queda <slug copia> como "slug viejo" de la
//      principal → /<slug copia>/ responde 301 a la principal.
// Reversible: volver a publicar la copia con su slug original (al existir el post, WP lo sirve y no redirige).
// Las URL que hoy rankean en Google (#1–#10, auditoría 15 oct) quedan SIEMPRE como principales.
//
// MODO=respaldo  → solo lectura: respaldo completo (posts, páginas, bloques) + validación del mapa + links internos a cambiar
// MODO=una SOLO=<id copia> → aplica una sola copia (prueba)
// MODO=aplicar   → aplica todas las copias pendientes + actualiza links internos en posts y páginas
var fs = require('fs')
var L = require('./lib/wp-proxy')
var MODO = process.env.MODO || 'respaldo'

// principal: [copias]   (IDs de posts)
var MAPA = [
  { tema: 'Mejores empresas de outplacement', principal: 9290, copias: [9127, 9203, 9267, 9216], nota: 'principal rankea #2-#3 (empresas de outplacement Chile, outplacement Chile, outplacement ejecutivo)' },
  { tema: 'Programas de coaching ejecutivo', principal: 9302, copias: [9129, 9148], nota: 'principal rankea #2 (coaching ejecutivo Chile)' },
  { tema: 'Recolocación laboral', principal: 9134, copias: [9306], nota: 'principal rankea #1; recibe el contenido largo de 9306 (559 → ~2.700 palabras)', fusionarContenidoDe: 9306 },
  { tema: 'Marca empleadora y desvinculación', principal: 9198, copias: [9138, 9298] },
  { tema: 'Preparación entrevista de trabajo', principal: 9208, copias: [9140, 9169, 9260, 9316] },
  { tema: 'Ranking consultoras transición laboral', principal: 9143, copias: [9305] },
  { tema: 'Programa de retiro activo', principal: 9265, copias: [9161, 9245, 9248, 9269] },
  { tema: 'Transición de carrera a los 40', principal: 9280, copias: [9163], nota: 'principal rankea #9' },
  { tema: 'Top 10 marca empleadora', principal: 9171, copias: [9321] },
  { tema: 'Outplacement individual', principal: 9180, copias: [9213], nota: 'principal rankea #2' },
  { tema: 'Liderazgo en crisis', principal: 9201, copias: [9319, 9300, 9294] },
  { tema: 'Portales de empleo', principal: 9205, copias: [9292] },
  { tema: 'Encuesta de salida', principal: 9277, copias: [9214, 9243, 9249, 9296] },
  { tema: 'Desvincular empleados', principal: 9227, copias: [9281, 9303], nota: 'principal rankea #1 (desvinculación responsable)' },
  { tema: 'Precio del outplacement', principal: 9250, copias: [9251] },
  { tema: 'Retiro activo y jubilación', principal: 9262, copias: [9309] },
  { tema: 'Herramientas IA para buscar trabajo', principal: 9264, copias: [9323] },
  { tema: 'Negociar sueldo', principal: 9272, copias: [9299] }
]
// URLs que rankean hoy (google.jsonl 15 oct): nunca pueden ser copias
var RANKEAN = ['mejores-empresas-outplacement-chile-2026-3', 'outplacement-necesidad-2026', 'outplacement-chile-2026', 'recolocacion-laboral-chile-2026',
  'mejores-programas-coaching-ejecutivo-chile', 'desvincular-empleados-chile-2026', 'transicion-carrera-40-2026', 'outplacement-individual-2026']

function guardar(nombre, data) { fs.writeFileSync('respaldo-' + nombre + '.json', JSON.stringify(data, null, 1)); console.log('  respaldo-' + nombre + '.json') }
function reHref(slug) { return new RegExp('href=(["\'])(?:https?://(?:www\\.)?lablab\\.cl)?/' + slug.replace(/[-]/g, '\\-') + '/?(?=["\'#?])', 'g') }

;(async function () {
  console.log('MODO', MODO)
  var posts = await L.todos('/wp-json/wp/v2/posts?context=edit&status=publish,draft&_fields=id,slug,status,title,content,link,modified')
  var pages = await L.todos('/wp-json/wp/v2/pages?context=edit&status=publish,draft,private&_fields=id,slug,status,title,content,link')
  console.log('posts', posts.length, '| páginas', pages.length)
  if (!posts.length) { console.log('No se pudo leer posts (proxy/WAF). Abortando.'); process.exitCode = 1; return }
  var porId = {}; posts.forEach(function (p) { porId[p.id] = p })
  guardar('posts', posts.map(function (p) { return { id: p.id, slug: p.slug, status: p.status, title: p.title.raw, link: p.link, content: p.content.raw } }))
  guardar('paginas', pages.map(function (p) { return { id: p.id, slug: p.slug, status: p.status, title: p.title.raw, content: p.content.raw } }))
  if (MODO === 'respaldo') {
    var bloques = await L.todos('/wp-json/wp/v2/ux-blocks?context=edit&status=publish,draft,private&_fields=id,slug,status,password,title,content')
    guardar('bloques', bloques.map(function (b) { return { id: b.id, slug: b.slug, status: b.status, password: b.password, title: b.title && b.title.raw, content: b.content && b.content.raw } }))
    var usados = {}
    pages.concat(posts).concat(bloques).forEach(function (p) {
      var c = (p.content && p.content.raw) || ''
      var m = c.match(/\[block[^\]]*id=["']?([^"'\s\]]+)/g) || []
      m.forEach(function (x) { var id = x.match(/id=["']?([^"'\s\]]+)/)[1]; (usados[id] = usados[id] || []).push(p.slug) })
    })
    console.log('BLOQUES', bloques.length); bloques.forEach(function (b) { console.log('  ', b.id, b.slug, b.status, b.password ? '(con clave)' : '', '| usado en:', (usados[b.id] || usados[b.slug] || []).join(',') || '—') })
  }

  // Validación del mapa
  var errores = []
  MAPA.forEach(function (g) {
    var pr = porId[g.principal]
    if (!pr || pr.status !== 'publish') errores.push('principal ' + g.principal + ' no publicada')
    g.copias.forEach(function (c) {
      var p = porId[c]
      if (!p) errores.push('copia ' + c + ' no existe')
      else if (RANKEAN.indexOf(p.slug) >= 0) errores.push('copia ' + c + ' (' + p.slug + ') RANKEA: no se toca')
    })
  })
  if (errores.length) { console.log('ERRORES EN EL MAPA:\n  ' + errores.join('\n  ')); process.exitCode = 1; return }

  // Plan
  var plan = []
  MAPA.forEach(function (g) {
    g.copias.forEach(function (c) {
      var p = porId[c]
      var hecho = p.status === 'draft' && /-consolidado$/.test(p.slug)
      plan.push({ tema: g.tema, copia: c, slugCopia: hecho ? p.slug.replace(/-consolidado$/, '') : p.slug, principal: g.principal, slugPrincipal: porId[g.principal].slug, hecho: hecho })
    })
  })
  console.log('\nPLAN (' + plan.length + ' copias):')
  plan.forEach(function (x) { console.log('  ' + (x.hecho ? '[hecho] ' : '') + '/' + x.slugCopia + '/ (' + x.copia + ') → /' + x.slugPrincipal + '/ (' + x.principal + ')') })
  // links internos que apuntan a copias
  var linksPorPost = {}
  posts.concat(pages).forEach(function (p) {
    var c = p.content.raw || '', n = 0
    plan.forEach(function (x) { n += (c.match(reHref(x.slugCopia)) || []).length })
    if (n) linksPorPost[p.slug] = n
  })
  console.log('\nLinks internos hacia copias:', Object.values(linksPorPost).reduce(function (a, b) { return a + b }, 0), 'en', Object.keys(linksPorPost).length, 'contenidos')
  if (MODO === 'respaldo') return

  var aplicar = plan.filter(function (x) { return !x.hecho && (MODO === 'aplicar' || String(x.copia) === process.env.SOLO) })
  var log = []
  for (var i = 0; i < aplicar.length; i++) {
    var x = aplicar[i]
    console.log('\n→ ' + x.slugCopia + ' (' + x.copia + ') ⇒ ' + x.slugPrincipal + ' (' + x.principal + ')')
    var a = await L.wp('/wp-json/wp/v2/posts/' + x.copia, { status: 'draft', slug: x.slugCopia + '-consolidado' })
    if (a.s !== 200 || a.j.slug !== x.slugCopia + '-consolidado') { console.log('  ✗ paso 1', a.s, JSON.stringify(a.j).slice(0, 200)); process.exitCode = 1; break }
    var b = await L.wp('/wp-json/wp/v2/posts/' + x.principal, { slug: x.slugCopia })
    if (b.s !== 200 || b.j.slug !== x.slugCopia) {
      console.log('  ✗ paso 2', b.s, b.j && b.j.slug, '→ restaurando')
      await L.wp('/wp-json/wp/v2/posts/' + x.principal, { slug: x.slugPrincipal })
      await L.wp('/wp-json/wp/v2/posts/' + x.copia, { status: 'publish', slug: x.slugCopia })
      process.exitCode = 1; break
    }
    var c = await L.wp('/wp-json/wp/v2/posts/' + x.principal, { slug: x.slugPrincipal })
    if (c.s !== 200 || c.j.slug !== x.slugPrincipal) { console.log('  ✗ paso 3 (principal quedó en ' + (c.j && c.j.slug) + ')', c.s); process.exitCode = 1; break }
    console.log('  ✓ copia en borrador, principal de vuelta en /' + c.j.slug + '/')
    log.push(x)
  }
  guardar('aplicado', log)

  // Fusión de contenido (principal delgada que rankea recibe el contenido largo de su copia)
  if (MODO === 'aplicar') {
    for (var g of MAPA) {
      if (!g.fusionarContenidoDe) continue
      var pr = porId[g.principal], src = porId[g.fusionarContenidoDe]
      if ((pr.content.raw || '').length > (src.content.raw || '').length) { console.log('fusión ya hecha', g.principal); continue }
      var f = await L.wp('/wp-json/wp/v2/posts/' + g.principal, { content: src.content.raw })
      console.log('fusión contenido ' + g.fusionarContenidoDe + ' → ' + g.principal + ':', f.s)
      if (f.s === 200) pr.content.raw = src.content.raw
    }
  }

  // Links internos: copias → principal, en todo lo publicado (posts y páginas)
  if (MODO === 'aplicar') {
    var hechos = plan.filter(function (x) { return x.hecho }).concat(log)
    var cambios = 0
    for (var it of posts.map(function (p) { return ['posts', p] }).concat(pages.map(function (p) { return ['pages', p] }))) {
      var tipo = it[0], p = it[1]
      if (p.status !== 'publish') continue
      var raw = p.content.raw || '', nuevo = raw
      hechos.forEach(function (x) { nuevo = nuevo.replace(reHref(x.slugCopia), 'href=$1/' + x.slugPrincipal + '/') })
      if (nuevo !== raw) {
        var u = await L.wp('/wp-json/wp/v2/' + tipo + '/' + p.id, { content: nuevo })
        cambios++
        console.log('  links actualizados en', tipo, p.id, p.slug, u.s)
      }
    }
    console.log('Contenidos con links actualizados:', cambios)
  }
})()
