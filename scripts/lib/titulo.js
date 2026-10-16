// El tema de LabLab arma el <title> como "<título del post> – LabLab" (+9 caracteres). Para que el <title> no pase
// de 60 (auditoría 15 oct 2026), el título del post debe tener como máximo 51 caracteres.
var MAX_TITULO = 51
var CONECTORES = /\s+(y|o|de|del|la|el|los|las|en|para|con|por|a|al|que|sin|vs\.?|un|una|\d+)$/i

function acortarTitulo(t, max) {
  max = max || MAX_TITULO
  t = String(t || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  var cands = []
  // 1) quitar lo que va entre paréntesis
  cands.push(t.replace(/\s*\([^)]*\)\s*/g, ' ').trim())
  // 2) quitar relleno común
  cands.push(cands[0].replace(/\s*:\s*(guía completa|guía práctica|todo lo que debes saber|claves|qué saber)(\s+20\d\d)?\s*$/i, '').replace(/\b(Las|Los)\s+(?=\d|Mejores)/, '').trim())
  // 3) quedarse con la parte antes de ":" o "|" o " — " (la keyword va al inicio) si es razonable
  var corte = cands[1].split(/\s*[:|—–]\s*/)[0]
  if (corte.length >= 25) cands.push(corte.trim())
  for (var i = 0; i < cands.length; i++) if (cands[i].length <= max && cands[i].length >= 20) return cands[i]
  // 4) cortar en límite de palabra y limpiar conectores/puntuación sueltos al final
  var s = cands[1].slice(0, max + 1)
  s = s.slice(0, s.lastIndexOf(' ') > 20 ? s.lastIndexOf(' ') : max)
  for (var k = 0; k < 3; k++) s = s.replace(/[\s,:;–—|-]+$/, '').replace(CONECTORES, '')
  return s.trim()
}
// Si el modelo entrega un título largo, se le pide UNA vez que lo acorte; si igual no cumple, se recorta por reglas.
async function asegurarTitulo(titulo, openaiKey, fetchFn) {
  titulo = String(titulo || '').trim()
  if (titulo.length <= MAX_TITULO) return titulo
  try {
    var r = await (fetchFn || fetch)('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: 'Bearer ' + openaiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.2, messages: [{ role: 'user', content:
        'Acorta este título SEO a máximo ' + (MAX_TITULO - 3) + ' caracteres, en español de Chile, manteniendo la palabra clave principal al inicio, sin comillas ni punto final y sin cambiar el sentido. Responde SOLO el título.\n\n' + titulo }] })
    })
    var d = await r.json()
    var t = d.choices && d.choices[0] && d.choices[0].message.content.trim().replace(/^["'«]|["'»]$/g, '').replace(/\.$/, '')
    if (t && t.length <= MAX_TITULO && t.length >= 20) return t
  } catch (e) { console.log('  ⚠️ No se pudo acortar con el modelo:', e.message) }
  return acortarTitulo(titulo)
}
module.exports = { acortarTitulo: acortarTitulo, asegurarTitulo: asegurarTitulo, MAX_TITULO: MAX_TITULO }
