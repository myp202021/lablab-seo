// Duplicados de noviembre 2026 (autorizado por Christopher 18 nov). Mismo mecanismo que consolidacion-2026-10-16.js:
// sin plugin de redirecciones, con el «slug viejo» del núcleo de WP (_wp_old_slug → 301).
//   copia → BORRADOR con slug "<slug>-consolidado"; la principal toma el slug de la copia y vuelve al suyo → 301.
// Caso especial "renombrar": la principal (mejor contenido) estaba en la URL con -2; pasa a la URL limpia y el -2 queda
// como slug viejo (301 → URL limpia).
// Uso: node scripts/duplicados-2026-11-18.js            → solo muestra plan y links internos (respaldo en respaldos/2026-11-18/)
//      MODO=aplicar node scripts/duplicados-2026-11-18.js → aplica
// Revertir: republicar la copia con su slug original (respaldo dup-posts.json).
var fs = require('fs'), cp = require('child_process')
var P = cp.execFileSync('security', ['find-generic-password', '-s', 'MyP · LabLab · WordPress app password', '-w']).toString().trim()
var A = 'Basic ' + Buffer.from('contacto@mulleryperez.cl:' + P).toString('base64')
async function wp(path, body) {
  var r = await fetch('https://www.lablab.cl' + path, { method: body ? 'POST' : 'GET', headers: { Authorization: A, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Macintosh) Chrome/130' }, body: body ? JSON.stringify(body) : undefined })
  var t = await r.text(); try { return { s: r.status, j: JSON.parse(t) } } catch (e) { return { s: r.status, j: t.slice(0, 300) } }
}
async function todos(base) {
  var out = []
  for (var p = 1; p <= 20; p++) {
    var r = await wp(base + '&per_page=50&page=' + p)
    if (!Array.isArray(r.j) || !r.j.length) break
    out = out.concat(r.j); if (r.j.length < 50) break
  }
  return out
}
function reHref(slug) { return new RegExp('href=(["\'])(?:https?://(?:www\\.)?lablab\\.cl)?/' + slug.replace(/[-]/g, '\\-') + '/?(?=["\'#?])', 'g') }

var MAPA = [
  // mismo título el mismo día (dos procesos a la vez). 9570 tiene 3 tablas y menos cifras sueltas → queda, en la URL limpia
  { tema: 'Qué es un servicio de outplacement', principal: 9570, copia: 9569, renombrar: true },
  // mismo título el mismo día. 9593 tiene la URL limpia, 4 tablas y la mitad de cifras sueltas
  { tema: 'Cómo se define el mejor outplacement', principal: 9593, copia: 9594 },
  // misma keyword que /recolocacion-laboral-chile-2026/ (9134, posición 2,7 en Google: no se toca)
  { tema: 'Recolocación laboral Chile', principal: 9134, copia: 9590 },
  // keyword «retiro activo jubilación» = /retiro-activo-jubilacion-2026/ (9262, 64 impresiones); 9715 salió hoy en paralelo con 9716
  { tema: 'Retiro activo y jubilación', principal: 9262, copia: 9715 }
]

;(async function () {
  var MODO = process.env.MODO || 'ver', dir = __dirname + '/../respaldos/2026-11-18/'
  fs.mkdirSync(dir, { recursive: true })
  var posts = await todos('/wp-json/wp/v2/posts?context=edit&status=publish,draft&_fields=id,slug,status,title,content')
  var pages = await todos('/wp-json/wp/v2/pages?context=edit&status=publish,draft,private&_fields=id,slug,status,title,content')
  var bloques = await todos('/wp-json/wp/v2/ux-blocks?context=edit&status=publish,draft,private&_fields=id,slug,status,title,content')
  console.log('posts', posts.length, '| páginas', pages.length, '| bloques', bloques.length)
  var porId = {}; posts.forEach(function (p) { porId[p.id] = p })
  var f = dir + 'dup-posts.json'
  if (!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify(MAPA.map(function (g) { return [porId[g.principal], porId[g.copia]] }), null, 1))

  // URL que desaparece (→ destino) por grupo
  var plan = MAPA.map(function (g) {
    var pr = porId[g.principal], co = porId[g.copia]
    var hecho = co.status === 'draft' && /-consolidado$/.test(co.slug)
    if (g.renombrar) {
      var limpio = hecho ? co.slug.replace(/-consolidado$/, '') : co.slug
      return { g: g, hecho: hecho, sale: [hecho ? null : pr.slug].filter(Boolean), limpio: limpio, destino: limpio, slugCopia: limpio, slugPrincipalViejo: pr.slug }
    }
    var sc = hecho ? co.slug.replace(/-consolidado$/, '') : co.slug
    return { g: g, hecho: hecho, sale: [sc], destino: pr.slug, slugCopia: sc }
  })
  plan.forEach(function (x) { console.log((x.hecho ? '[hecho] ' : '') + x.g.tema + ': copia ' + x.g.copia + ' /' + x.slugCopia + '/ → principal ' + x.g.principal + ' /' + x.destino + '/' + (x.g.renombrar ? ' (la principal deja /' + x.slugPrincipalViejo + '/)' : '')) })

  if (MODO === 'aplicar') {
    for (var x of plan) {
      if (x.hecho) continue
      var g = x.g
      var a = await wp('/wp-json/wp/v2/posts/' + g.copia, { status: 'draft', slug: x.slugCopia + '-consolidado' })
      if (a.s !== 200 || a.j.slug !== x.slugCopia + '-consolidado') { console.log('✗ paso 1', g.copia, a.s, JSON.stringify(a.j).slice(0, 200)); process.exitCode = 1; return }
      if (g.renombrar) {
        var b = await wp('/wp-json/wp/v2/posts/' + g.principal, { slug: x.limpio })
        if (b.s !== 200 || b.j.slug !== x.limpio) { console.log('✗ renombrar', b.s, b.j && b.j.slug); process.exitCode = 1; return }
        console.log('✓', g.tema, ': principal ahora en /' + b.j.slug + '/')
        continue
      }
      var b2 = await wp('/wp-json/wp/v2/posts/' + g.principal, { slug: x.slugCopia })
      if (b2.s !== 200 || b2.j.slug !== x.slugCopia) {
        console.log('✗ paso 2', b2.s, b2.j && b2.j.slug, '→ restaurando')
        await wp('/wp-json/wp/v2/posts/' + g.principal, { slug: x.destino })
        await wp('/wp-json/wp/v2/posts/' + g.copia, { status: 'publish', slug: x.slugCopia })
        process.exitCode = 1; return
      }
      var c = await wp('/wp-json/wp/v2/posts/' + g.principal, { slug: x.destino })
      if (c.s !== 200 || c.j.slug !== x.destino) { console.log('✗ paso 3 (principal quedó en ' + (c.j && c.j.slug) + ')', c.s); process.exitCode = 1; return }
      console.log('✓', g.tema, ': copia en borrador, principal de vuelta en /' + c.j.slug + '/')
    }
  }

  // Links internos hacia las URL que salen
  var cambios = [], tipos = [['posts', posts], ['pages', pages], ['ux-blocks', bloques]]
  for (var [tipo, lista] of tipos) {
    for (var p of lista) {
      if (MAPA.some(function (g) { return g.copia === p.id })) continue
      var raw = (p.content && p.content.raw) || '', nuevo = raw
      plan.forEach(function (x) { x.sale.forEach(function (s) { nuevo = nuevo.replace(reHref(s), 'href=$1/' + x.destino + '/') }) })
      if (nuevo === raw) continue
      cambios.push(tipo + ' ' + p.id + ' ' + p.slug)
      if (MODO === 'aplicar') {
        fs.writeFileSync(dir + 'dup-links-' + tipo + '-' + p.id + '.json', JSON.stringify({ content: raw }))
        var u = await wp('/wp-json/wp/v2/' + tipo + '/' + p.id, { content: nuevo })
        console.log('  links actualizados', tipo, p.id, u.s)
      }
    }
  }
  console.log('Contenidos con links a URL que salen:', cambios.length, cambios.join(' | '))
})()
