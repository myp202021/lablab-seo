// Una vez: el ranking del 2 nov salió con 1.419 palabras (el agente de rankings no aplicaba la regla de 3.000). Lo amplía.
// MODO=respaldo (solo muestra) | MODO=aplicar
var fs = require('fs')
var L = require('./lib/wp-proxy')
var largo = require('./lib/largo')
var SLUG = 'mejores-programas-outplacement-2026'
async function main() {
  var r = await L.wp('/wp-json/wp/v2/posts?slug=' + SLUG + '&status=publish&context=edit&_fields=id,slug,title,content')
  var p = Array.isArray(r.j) && r.j[0]
  if (!p) throw new Error('No encontré el post: ' + JSON.stringify(r.j).slice(0, 200))
  var html = p.content.raw
  console.log('Post ' + p.id + ': ' + largo.palabras(html) + ' palabras')
  fs.writeFileSync('respaldo-' + p.id + '.json', JSON.stringify(p))
  if (process.env.MODO !== 'aplicar') return
  // El schema se separa para ampliar solo el texto y se regenera con las preguntas finales
  var limpio = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '').trim()
  var nuevo = await largo.asegurarLargo(limpio, { tema: p.title.raw, sistema: 'Escribes para LabLab, especialistas en outplacement en Chile. No nombres competidores ni inventes cifras, clientes ni testimonios. Cada H2 nuevo es una pregunta real y su primera oración la responde directo.' })
  largo.exigirLargo(nuevo)
  var faqs = [], re = /<h[23][^>]*>([^<]+)<\/h[23]>\s*<p[^>]*>([\s\S]*?)<\/p>/gi, m
  while ((m = re.exec(nuevo)) !== null) {
    var q = m[1].trim(), a = m[2].replace(/<[^>]+>/g, '').trim()
    if (q.indexOf('?') !== -1 && a.length > 20) faqs.push({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })
  }
  if (faqs.length) nuevo += '\n<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.slice(0, 12) }) + '</script>'
  var u = await L.wp('/wp-json/wp/v2/posts/' + p.id, { content: nuevo })
  console.log('Actualizado: HTTP ' + u.s + ' · ' + largo.palabras(nuevo) + ' palabras · ' + faqs.length + ' preguntas')
  if (u.s !== 200) throw new Error(JSON.stringify(u.j).slice(0, 300))
}
main().catch(function (e) { console.error('Fatal:', e.message); process.exit(1) })
