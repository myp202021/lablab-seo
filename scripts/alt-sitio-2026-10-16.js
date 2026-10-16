// Imágenes sin alt que salen en TODAS las páginas (auditoría 16 oct 2026): íconos de redes en el widget del pie
// ("text-3") y logos (adjuntos Logo_3-1-1 y Logo_LabLab_Rojo-2). Solo se agrega el atributo alt: sin cambio visual.
// Las 3 imágenes del formulario CF7 1266 (Group-326/327/328) NO se tocan desde aquí (formulario de leads).
// MODO=respaldo | MODO=aplicar
var fs = require('fs')
var L = require('./lib/wp-proxy')
var ICONOS = { 'Group-208.png': 'LinkedIn de LabLab', 'Group-207.png': 'Instagram de LabLab', 'Group-209.png': 'Facebook de LabLab' }
;(async function () {
  var MODO = process.env.MODO || 'respaldo'
  var w = await L.wp('/wp-json/wp/v2/widgets/text-3?context=edit')
  console.log('widget text-3', w.s, w.j && w.j.id_base)
  var media = []
  for (var q of ['Logo_3-1-1', 'Logo_LabLab_Rojo-2']) {
    var m = await L.wp('/wp-json/wp/v2/media?search=' + encodeURIComponent(q) + '&context=edit&_fields=id,source_url,alt_text&per_page=20')
    ;(Array.isArray(m.j) ? m.j : []).forEach(function (x) { if (x.source_url.indexOf(q + '.') >= 0) media.push(x) })
  }
  console.log('adjuntos', JSON.stringify(media))
  fs.writeFileSync('respaldo-alt.json', JSON.stringify({ widget: w.j, media: media }, null, 1))
  if (MODO !== 'aplicar') return
  // widget de texto: alt="" → alt="<red> de LabLab"
  var inst = w.j && w.j.instance && w.j.instance.raw
  if (inst && typeof inst.text === 'string') {
    var t = inst.text
    Object.keys(ICONOS).forEach(function (f) {
      t = t.replace(new RegExp('(<img[^>]*' + f.replace('.', '\\.') + '[^>]*?)alt=""', 'g'), '$1alt="' + ICONOS[f] + '"')
    })
    if (t !== inst.text) {
      var nuevo = Object.assign({}, inst, { text: t })
      var u = await L.wp('/wp-json/wp/v2/widgets/text-3', { instance: { raw: nuevo } }, 'PUT')
      console.log('widget actualizado', u.s, JSON.stringify(u.j).slice(0, 150))
    } else console.log('widget sin cambios (ya tenía alt o no se encontró)')
  } else console.log('widget sin instance.raw editable:', JSON.stringify(w.j).slice(0, 300))
  for (var x of media) {
    if (x.alt_text) continue
    var r = await L.wp('/wp-json/wp/v2/media/' + x.id, { alt_text: 'LabLab' })
    console.log('alt adjunto', x.id, r.s, r.j && r.j.alt_text)
  }
})()
