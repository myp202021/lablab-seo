// Títulos > 60 en el <title> (auditoría 15 oct 2026). El tema agrega " – LabLab" (9 caracteres), así que el título
// del post debe tener ≤ 51. Se mantiene la keyword principal al inicio; las URL no cambian.
// MODO=respaldo (solo muestra) | MODO=aplicar
var fs = require('fs')
var L = require('./lib/wp-proxy')
var NUEVOS = {
  9450: 'Artículo 161 Necesidades de la Empresa: Guía 2026',
  9302: '8 Mejores Programas de Coaching Ejecutivo en Chile',
  9290: 'Mejores Empresas de Outplacement en Chile 2026',
  9288: 'Reestructuración Empresarial en Chile: Guía 2026',
  9273: 'Networking Profesional en Chile: Guía 2026',
  9272: 'Negociar Sueldo en Chile 2026: Guía Práctica',
  9265: 'Programa de Retiro Activo para Empresas 2026',
  9264: 'Herramientas de IA para Buscar Trabajo en Chile',
  9254: 'Transición Laboral en Chile: Estadísticas 2026',
  9234: 'Outplacement Ejecutivo vs Masivo: Diferencias 2026',
  9227: 'Desvincular Empleados en Chile: Guía Responsable',
  9224: 'Qué es Outplacement en Chile: Clave para Empresas',
  9218: 'Las 5 Habilidades Más Demandadas en Chile 2026',
  9180: 'Outplacement Individual: Programa Personalizado',
  9171: 'Top 10 Empresas con Mejor Marca Empleadora 2026',
  9159: 'Upskilling y Reskilling en Chile 2026',
  9143: 'Consultoras de Transición Laboral en Chile: Ranking',
  9134: 'Recolocación Laboral Chile: Tiempos y Estrategias'
}
;(async function () {
  var MODO = process.env.MODO || 'respaldo'
  var antes = [], hechos = 0
  for (var id in NUEVOS) {
    if (NUEVOS[id].length > 51) { console.log('✗ título nuevo > 51:', id, NUEVOS[id]); process.exitCode = 1; return }
    var r = await L.wp('/wp-json/wp/v2/posts/' + id + '?context=edit&_fields=id,slug,status,title')
    if (r.s !== 200) { console.log('✗ no se pudo leer', id, r.s); continue }
    antes.push({ id: +id, slug: r.j.slug, status: r.j.status, title: r.j.title.raw })
    console.log(id, r.j.status, '"' + r.j.title.raw + '" (' + r.j.title.raw.length + ') → "' + NUEVOS[id] + '" (' + NUEVOS[id].length + ')')
    if (MODO === 'aplicar' && r.j.status === 'publish' && r.j.title.raw !== NUEVOS[id]) {
      var u = await L.wp('/wp-json/wp/v2/posts/' + id, { title: NUEVOS[id] })
      console.log('   guardado', u.s, u.j && u.j.slug)
      if (u.s === 200) hechos++
    }
  }
  fs.writeFileSync('respaldo-titulos.json', JSON.stringify(antes, null, 1))
  console.log('Títulos cambiados:', hechos)
})()
