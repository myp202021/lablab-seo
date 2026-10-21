// Sección "Estudios LabLab" (21 oct 2026): índice /estudios/ + 3 páginas hijas, TODO EN BORRADOR.
// MODO=diagnostico → solo lee (plugins, plantillas, slugs existentes). MODO=borradores → crea o actualiza los borradores.
// Nunca publica, nunca toca el menú ni otras páginas. Deja respaldo-estudios.json (artefacto del workflow).
var fs = require('fs')
var L = require('./lib/wp-proxy')
var C = require('./estudios/contenido')
var MODO = process.env.MODO || 'diagnostico'
var PLANTILLA = 'page-menu-azul.php' // la misma de /servicios-para-empresas/

async function buscar(slug, parent) {
  var r = await L.wp('/wp-json/wp/v2/pages?slug=' + slug + '&status=draft,publish,private,pending,future&context=edit&_fields=id,slug,status,parent,link,title')
  if (!Array.isArray(r.j)) return null
  return r.j.filter(function (p) { return parent == null || p.parent === parent })[0] || null
}

async function guardar(pag, parent) {
  var e = pag.e
  if (e.titulo.length > 51) throw new Error('título > 51: ' + e.titulo)
  if (e.meta.length > 155) throw new Error('meta > 155: ' + e.meta)
  var existe = await buscar(e.slug, parent)
  if (existe && existe.status !== 'draft') { console.log('✗ ya existe NO borrador, no se toca:', e.slug, existe.id, existe.status); return existe }
  var body = { title: e.titulo, slug: e.slug, status: 'draft', content: pag.contenido, parent: parent || 0, template: PLANTILLA, comment_status: 'closed', ping_status: 'closed' }
  var r = await L.wp('/wp-json/wp/v2/pages' + (existe ? '/' + existe.id : ''), body)
  if (r.s !== 200 && r.s !== 201) {
    console.log('  plantilla rechazada? reintento sin plantilla', r.s, JSON.stringify(r.j).slice(0, 200))
    delete body.template
    r = await L.wp('/wp-json/wp/v2/pages' + (existe ? '/' + existe.id : ''), body)
  }
  console.log((existe ? 'actualizado' : 'creado'), r.s, r.j.id, r.j.status, e.slug, '| plantilla:', r.j.template)
  return r.j
}

;(async function () {
  // diagnóstico (siempre)
  var pl = await L.wp('/wp-json/wp/v2/plugins?_fields=plugin,status,name,version')
  if (Array.isArray(pl.j)) pl.j.forEach(function (p) { console.log('plugin', p.status, p.name, p.version) })
  else console.log('plugins: no se pudo listar', pl.s)
  var t = await L.wp('/wp-json/wp/v2/themes?status=active&_fields=stylesheet,template,name,version')
  console.log('tema', JSON.stringify(t.j).slice(0, 300))
  var p96 = await L.wp('/wp-json/wp/v2/pages/96?context=edit&_fields=id,template,meta')
  console.log('pagina 96', JSON.stringify(p96.j).slice(0, 300))
  for (var s of ['estudios', C.E.cadem.slug, C.E.desv.slug, C.E.marca.slug]) {
    var ex = await buscar(s, null)
    console.log('slug', s, ex ? ('EXISTE id ' + ex.id + ' ' + ex.status) : 'libre')
  }
  if (MODO !== 'borradores') return

  var out = []
  var idx = C.indice()
  var padre = await guardar(idx, null)
  out.push({ rol: 'indice', id: padre.id, slug: idx.e.slug, titulo: idx.e.titulo, meta: idx.e.meta, status: padre.status, contenido: idx.contenido })
  for (var k of ['cadem', 'desv', 'marca']) {
    var pg = C[k]()
    var r = await guardar(pg, padre.id)
    out.push({ rol: k, id: r.id, parent: padre.id, slug: pg.e.slug, titulo: pg.e.titulo, h1: pg.e.h1, meta: pg.e.meta, status: r.status, contenido: pg.contenido })
  }
  // verificación: siguen en borrador y no responden en público
  for (var o of out) {
    var v = await L.wp('/wp-json/wp/v2/pages/' + o.id + '?context=edit&_fields=id,status,link,parent,template')
    o.verificado = v.j
    var pub = await L.enVivo('https://www.lablab.cl/estudios/' + (o.rol === 'indice' ? '' : o.slug + '/'))
    console.log('verif', o.id, v.j.status, v.j.template, '| público responde', pub.status, '| vista previa: https://www.lablab.cl/?page_id=' + o.id + '&preview=true')
  }
  fs.writeFileSync('respaldo-estudios.json', JSON.stringify(out, null, 1))
})()
