// Anti-duplicados por raíces (30 sept 2026), compartido por los agentes de LabLab.
var VACIAS_DUP = 'para como cual cuales guia completa clave claves chile 2026 2025 2024 2023 tus sus los las del con que mejores mejor top ranking todo debes saber paso'.split(' ')
function raicesTema(t) {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter(function(w) { return w.length > 3 && !/^\d+$/.test(w) && VACIAS_DUP.indexOf(w) === -1 })
    .map(function(w) { return w.substring(0, 5) })
    .filter(function(w, i, a) { return a.indexOf(w) === i })
}
function temaPublicado(texto, titulosExistentes) {
  var r = raicesTema(texto)
  if (r.length < 2) return null
  for (var i = 0; i < titulosExistentes.length; i++) {
    var e = raicesTema(titulosExistentes[i])
    var comunes = r.filter(function(w) { return e.indexOf(w) !== -1 }).length
    // Cubierto si el existente contiene 2/3 del tema, o si el tema contiene 2/3 de un existente de 3+ raíces
    if (comunes >= 2 && (comunes / r.length >= 0.66 || (e.length >= 3 && comunes / e.length >= 0.66))) return titulosExistentes[i]
  }
  return null
}
module.exports = { raicesTema: raicesTema, temaPublicado: temaPublicado }
