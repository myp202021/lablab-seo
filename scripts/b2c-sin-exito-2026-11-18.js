// LabLab 18 nov 2026: dejan de ofrecer «a éxito» para personas (correo de Graciela). Página 119 + bloques UX 7029 y 7030.
// Respaldo en respaldos/2026-11-18/. Uso: MODO=aplicar node scripts/b2c-sin-exito-2026-11-18.js (sin MODO = solo muestra)
// Revertir: MODO=revertir (repone el contenido del respaldo).
var fs = require('fs'), cp = require('child_process')
var P = cp.execFileSync('security', ['find-generic-password', '-s', 'MyP · LabLab · WordPress app password', '-w']).toString().trim()
var A = 'Basic ' + Buffer.from('contacto@mulleryperez.cl:' + P).toString('base64')
async function wp(path, body) { var r = await fetch('https://www.lablab.cl' + path, { method: body ? 'POST' : 'GET', headers: { Authorization: A, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Macintosh) Chrome/130' }, body: body ? JSON.stringify(body) : undefined }); return { s: r.status, j: await r.json() } }
var PAGO = '<strong>Pago flexible:</strong> puedes pagar con tarjeta de crédito<br />en hasta 12 cuotas sin interés.'
var CAMBIOS = [
  ['/wp-json/wp/v2/pages/119', [['Outplacement a éxito: tu recolocación laboral es nuestra meta.', 'Outplacement para personas: tu recolocación es nuestra meta.']]],
  ['/wp-json/wp/v2/ux-blocks/7029', [['<strong>Pago a éxito:</strong> comienzas con una parte inicial y solo<br />completas el pago si logras tu recolocación. Porque<br />tu éxito, también es el nuestro.', PAGO]]],
  ['/wp-json/wp/v2/ux-blocks/7030', [['<strong>Pago a éxito:</strong> inviertes una parte al inicio, y el resto<br />solo si logras tu objetivo profesional.', PAGO], ['https://lablab.qaserver5.com/servicios-para-personas/', '/servicios-para-personas/']]]
]
;(async function () {
  var MODO = process.env.MODO || 'ver', dir = __dirname + '/../respaldos/2026-11-18/'
  for (var [ruta, reps] of CAMBIOS) {
    var id = ruta.split('/').pop(), f = dir + 'b2c-' + id + '.json'
    var r = await wp(ruta + '?context=edit&_fields=id,content'); var raw = r.j.content.raw
    if (!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify({ ruta: ruta, content: raw }))
    if (MODO === 'revertir') { console.log(id, 'revertir', (await wp(ruta, { content: JSON.parse(fs.readFileSync(f)).content })).s); continue }
    var nuevo = raw, ok = true
    for (var [a, b] of reps) { if (nuevo.indexOf(a) < 0) { console.log(id, '✗ no encontrado:', a.slice(0, 50)); ok = false } nuevo = nuevo.split(a).join(b) }
    console.log(id, ok ? 'listo para cambiar' : 'REVISAR')
    if (MODO === 'aplicar' && ok) console.log('   guardado', (await wp(ruta, { content: nuevo })).s)
  }
})()
