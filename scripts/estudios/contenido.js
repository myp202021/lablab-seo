// Contenido de la sección "Estudios LabLab" (21 oct 2026).
// Fuente: PDFs de LabLab en Drive (Compartido Agencia M&P › Recursos). Cifras tal cual del PDF; nada externo.
var SITIO = 'https://www.lablab.cl'
var AZUL = '#3b5f8b'
var ORG = { '@id': SITIO + '/#organizacion' }
var ORG_FULL = { '@type': 'Organization', '@id': SITIO + '/#organizacion', name: 'LabLab', url: SITIO + '/', logo: SITIO + '/wp-content/uploads/2024/03/Logo_3-1-1.png' }
var CADEM = { '@type': 'Organization', name: 'Cadem', url: 'https://www.cadem.cl/' }

function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

var ESTILO = '<style>' +
  '.ll-hero .ll-migas{font-size:.85rem;opacity:.9;margin-bottom:10px}.ll-hero .ll-migas a{color:#fff;text-decoration:underline}' +
  '.ll-hero .ll-kicker{text-transform:uppercase;letter-spacing:.06em;font-size:.85rem;font-weight:bold;margin-bottom:6px}' +
  '.ll-hero h1{font-size:2.3rem;line-height:1.2;margin-bottom:14px}.ll-hero p.ll-bajada{font-size:1.15rem;max-width:820px}' +
  '@media(max-width:549px){.ll-hero h1{font-size:1.7rem}}' +
  '.ll-est{max-width:920px;margin:0 auto;font-size:1.04rem;line-height:1.7}' +
  '.ll-est h2{color:' + AZUL + ';margin-top:2.4rem;font-size:1.6rem}.ll-est h3{color:' + AZUL + ';margin-top:1.5rem;font-size:1.2rem}' +
  '.ll-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin:8px 0 28px}' +
  '.ll-stat{background:#f4f7fb;border-left:4px solid #f92a37;padding:16px 18px;border-radius:6px}' +
  '.ll-stat b{display:block;font-size:1.9rem;line-height:1.15;color:' + AZUL + '}.ll-stat span{display:block;font-size:.92rem;margin-top:6px;line-height:1.45}' +
  '.ll-tabla{overflow-x:auto;margin:10px 0 8px}.ll-tabla table{width:100%;border-collapse:collapse;font-size:.95rem;min-width:480px}' +
  '.ll-tabla caption{text-align:left;font-weight:bold;padding:6px 0;color:#333}' +
  '.ll-tabla th{background:' + AZUL + ';color:#fff;text-align:left;padding:8px 10px;font-weight:bold}' +
  '.ll-tabla td{border-bottom:1px solid #e3e8ef;padding:8px 10px;vertical-align:top}' +
  '.ll-nota{font-size:.88rem;color:#555;margin-bottom:18px}' +
  '.ll-ficha{background:#f4f7fb;border-radius:8px;padding:6px 18px 12px;margin-top:10px}' +
  '.ll-faq h3{font-size:1.08rem}' +
  '.ll-cta{background:' + AZUL + ';color:#fff;padding:24px 26px;border-radius:8px;margin:36px 0 10px}.ll-cta h2{color:#fff!important;margin-top:0}.ll-cta a{color:#fff;text-decoration:underline;font-weight:bold}' +
  '.ll-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin:20px 0}' +
  '.ll-card{border:1px solid #e3e8ef;border-top:4px solid #f92a37;border-radius:8px;padding:22px;background:#fff;display:flex;flex-direction:column}' +
  '.ll-card h2,.ll-card h3{font-size:1.2rem;margin:0 0 8px;color:' + AZUL + '}.ll-card .ll-meta{font-size:.85rem;color:#666;margin-bottom:10px}' +
  '.ll-card p{flex:1}.ll-card a.ll-boton{display:inline-block;background:#f92a37;color:#fff;padding:8px 16px;border-radius:99px;font-weight:bold;text-decoration:none;align-self:flex-start}' +
  '</style>'

function stats(items) {
  return '<div class="ll-stats">' + items.map(function (s) { return '<div class="ll-stat"><b>' + s[0] + '</b><span>' + s[1] + '</span></div>' }).join('') + '</div>'
}
function tabla(caption, cab, filas, nota) {
  return '<div class="ll-tabla"><table>' + (caption ? '<caption>' + caption + '</caption>' : '') +
    '<thead><tr>' + cab.map(function (c) { return '<th scope="col">' + c + '</th>' }).join('') + '</tr></thead><tbody>' +
    filas.map(function (f) { return '<tr>' + f.map(function (c) { return '<td>' + c + '</td>' }).join('') + '</tr>' }).join('') +
    '</tbody></table></div>' + (nota ? '<p class="ll-nota">' + nota + '</p>' : '')
}
function ul(items) { return '<ul>' + items.map(function (i) { return '<li>' + i + '</li>' }).join('') + '</ul>' }
function faqHtml(faq) {
  return '<div class="ll-faq"><h2>Preguntas frecuentes</h2>' + faq.map(function (q) { return '<h3>' + q[0] + '</h3><p>' + q[1] + '</p>' }).join('') + '</div>'
}
function faqSchema(faq) {
  return { '@type': 'FAQPage', mainEntity: faq.map(function (q) {
    return { '@type': 'Question', name: q[0].replace(/<[^>]+>/g, ''), acceptedAnswer: { '@type': 'Answer', text: q[1].replace(/<[^>]+>/g, '') } }
  }) }
}
function migas(items) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map(function (it, i) { return { '@type': 'ListItem', position: i + 1, name: it[0], item: SITIO + it[1] } }) }
}
function hero(migasHtml, kicker, h1, bajada) {
  return '[section bg_color="' + AZUL + '" dark="true" padding="56px" class="ll-hero"][row][col span__sm="12"]' +
    '<nav class="ll-migas" aria-label="Ruta">' + migasHtml + '</nav><p class="ll-kicker">' + kicker + '</p><h1>' + h1 + '</h1><p class="ll-bajada">' + bajada + '</p>' +
    '[/col][/row][/section]'
}
function cuerpo(html) { return '[section padding="40px"][row][col span__sm="12"]<div class="ll-est">' + html + '</div>[/col][/row][/section]' }
function ld(obj) { return '<script type="application/ld+json">' + JSON.stringify(obj) + '</script>' }

// ---------------------------------------------------------------- estudios
var E = {
  cadem: {
    slug: 'impacto-outplacement-recolocacion-cadem',
    titulo: 'Impacto del outplacement en la recolocación (Cadem)',
    h1: 'Evaluación de impacto del outplacement en la recolocación laboral',
    tarjeta: 'Cadem comparó la recolocación de personas desvinculadas sin outplacement con la lograda por los programas de LabLab a 4 y 12 meses.',
    meta: 'Estudio Cadem para LabLab: 93,2% de recolocación a 12 meses con outplacement vs 41,1% sin él; 40,4% vs 24,0% a 4 meses.',
    fecha: '2026-04', fechaTxt: 'Abril 2026', fuenteTxt: 'Realizado por Cadem para LabLab'
  },
  desv: {
    slug: 'costo-desvinculaciones-judicializadas-chile',
    titulo: 'Costo de una desvinculación judicializada en Chile',
    h1: 'Gestión de las desvinculaciones en Chile: una mirada financiera',
    tarjeta: 'Modelo con datos de la Dirección del Trabajo y del Poder Judicial que estima cuánto cuesta a una empresa que un despido termine en juicio.',
    meta: 'Estudio LabLab con datos DT y Poder Judicial: un juicio laboral cuesta en promedio $6,6 millones sobre el finiquito y el trabajador gana más del 90%.',
    fecha: '2025-10-07', fechaTxt: '2025 · datos DT y PJud al primer semestre 2025', fuenteTxt: 'Estudio LabLab'
  },
  marca: {
    slug: 'outplacement-marca-empleadora-rankings',
    titulo: 'Outplacement y marca empleadora en Chile (estudio)',
    h1: 'Outplacement e imagen empleadora en Chile',
    tarjeta: 'Cruce de 86 empresas de Great Place to Work, Merco Talento y LinkedIn Top Companies con su uso de outplacement.',
    meta: 'Estudio LabLab: el 72% de las empresas mejor rankeadas en marca empleadora en Chile contrata outplacement y se ubica 2,2 a 4,5 lugares más arriba.',
    fecha: '2026-05', fechaTxt: 'Mayo 2026', fuenteTxt: 'Estudio LabLab'
  }
}
function url(k) { return '/estudios/' + E[k].slug + '/' }
var MIGAS_BASE = '<a href="/">Inicio</a> › <a href="/estudios/">Estudios</a> › '

function otrosEstudios(actual) {
  var otros = Object.keys(E).filter(function (k) { return k !== actual })
  return '<h2>Otros estudios LabLab</h2>' + ul(otros.map(function (k) { return '<a href="' + url(k) + '">' + E[k].h1 + '</a> — ' + E[k].tarjeta }))
}
function cta(texto) {
  return '<div class="ll-cta"><h2>¿Cómo aplica esto a tu organización?</h2><p>' + texto + '</p><p><a href="/servicios-para-empresas/">Servicios de outplacement para empresas</a> · <a href="/servicios-para-personas/">Programas para personas</a> · <a href="/estudios/">Todos los estudios</a></p></div>'
}
function report(k, extra) {
  var e = E[k]
  return Object.assign({
    '@type': 'Report', '@id': SITIO + url(k) + '#estudio', headline: e.h1, name: e.h1, description: e.meta,
    url: SITIO + url(k), mainEntityOfPage: SITIO + url(k), inLanguage: 'es-CL', datePublished: e.fecha,
    author: ORG_FULL, publisher: ORG_FULL, isPartOf: { '@id': SITIO + '/estudios/#coleccion' },
    spatialCoverage: { '@type': 'Country', name: 'Chile' }
  }, extra || {})
}

// ---------------------------------------------------------------- CADEM
function paginaCadem() {
  var faq = [
    ['¿El outplacement ayuda a encontrar trabajo más rápido?', 'En este estudio, el 40,4% de quienes participaron en el programa de outplacement de 4 meses de LabLab se recolocó en ese plazo, frente al 24,0% del grupo sin outplacement medido por Cadem. La brecha es de 16,4 puntos porcentuales.'],
    ['¿Qué porcentaje de las personas que hacen outplacement con LabLab encuentra trabajo en 12 meses?', 'El programa de 12 meses de LabLab alcanzó una recolocación efectiva de 93,2%, frente a 41,1% en el grupo de personas desvinculadas que no hizo outplacement, una diferencia de 52,1 puntos porcentuales.'],
    ['¿Quién hizo el estudio y cómo se midió?', 'El estudio lo realizó Cadem para LabLab y se publicó en abril de 2026. Cadem aplicó una encuesta telefónica estructurada entre febrero y marzo de 2026 a 240 personas desvinculadas sin outplacement (90 para comparar con el programa de 12 meses y 150 para el de 4 meses), con un diseño cuasi-experimental y un grupo de comparación construido por cuotas de sexo, edad, zona y nivel de cargo.'],
    ['¿Qué se consideró una recolocación efectiva?', 'Se consideró recolocada a la persona que declaró haber encontrado empleo dentro de los 12 o 4 meses posteriores a su desvinculación. Se excluyeron los trabajadores independientes, consultores o emprendedores y las personas en cargos significativamente inferiores al previo.'],
    ['¿Las diferencias son estadísticamente significativas?', 'La prueba de diferencia de proporciones entregó Z = 3,72 para el programa de 4 meses y Z = 11,41 para el de 12 meses, ambos sobre el punto de corte de 1,96 para 95% de confianza. El informe aclara que el muestreo fue no probabilístico.']
  ]
  var h = ''
  h += stats([
    ['93,2% vs 41,1%', 'Recolocación a 12 meses: programa LabLab vs. grupo sin outplacement (+52,1 pp)'],
    ['40,4% vs 24,0%', 'Recolocación a 4 meses: programa LabLab vs. grupo sin outplacement (+16,4 pp)'],
    ['240', 'Personas desvinculadas sin outplacement encuestadas por Cadem (90 + 150)'],
    ['Feb–mar 2026', 'Trabajo de campo telefónico']
  ])
  h += '<h2>Resumen ejecutivo</h2>'
  h += '<p>LabLab encargó a Cadem determinar la tasa de recolocación de profesionales que quedaron sin trabajo y que no realizaron ningún programa de outplacement, para compararla con la tasa y los tiempos de recolocación logrados por los programas de outplacement de LabLab y establecer si hay o no un impacto a la hora de encontrar un nuevo empleo.</p>'
  h += ul([
    '<strong>Programa de 12 meses:</strong> 93,2% de recolocación efectiva con outplacement LabLab frente a 41,1% en el grupo sin outplacement. Brecha de 52,1 puntos porcentuales.',
    '<strong>Programa de 4 meses:</strong> 40,4% con outplacement LabLab frente a 24,0% sin outplacement. Brecha de 16,4 puntos porcentuales.',
    'En ambos casos la diferencia supera el umbral de significancia al 95% de confianza calculado en el informe.'
  ])
  h += '<h2>Objetivo del estudio</h2><p>Determinar la tasa de recolocación de profesionales que quedaron sin trabajo dentro de un periodo de tiempo determinado y que no realizaron ningún programa de outplacement, con el fin de compararla con la tasa y los tiempos de recolocación que logró LabLab con su programa de outplacement.</p>'
  h += '<h2>Metodología</h2>'
  h += '<h3>Enfoque</h3><p>Estudio cuantitativo comparativo no experimental, orientado a identificar diferencias en la recolocación laboral entre dos grupos: personas que participaron en programas de outplacement y personas desvinculadas que no accedieron a este tipo de servicio. Como no existe asignación aleatoria al outplacement, el diseño corresponde a un cuasi-experimento con grupo de comparación equivalente.</p>'
  h += '<h3>Diseño muestral</h3><p>Muestreo no probabilístico por conveniencia, a partir de redes profesionales y personales, complementado con muestreo tipo bola de nieve (los participantes iniciales refirieron nuevos casos elegibles). Para que los grupos fueran comparables, el grupo sin outplacement se construyó por cuotas, replicando la estructura del grupo con outplacement en:</p>'
  h += ul(['Sexo', 'Edad', 'Zona geográfica (Región Metropolitana vs. regiones)', 'Nivel de cargo previo: <em>ejecutivos</em> (gerentes generales, gerentes y subgerentes de área) y <em>profesionales</em> (jefes de área y profesionales sin equipo a cargo)'])
  h += '<h3>Criterios de inclusión</h3>' + ul([
    'Haber sido desvinculado entre enero de 2024 y enero de 2025 (comparación con el programa de 12 meses) o entre enero de 2025 y agosto de 2025 (comparación con el programa de 4 meses).',
    'Haber estado empleado previamente en organizaciones formales.',
    'En el grupo de comparación: no haber usado un programa de outplacement ni otro servicio profesional pagado de apoyo a la recolocación.'
  ])
  h += '<h3>Composición de la muestra</h3><p>Según el informe, la muestra lograda replica adecuadamente la estructura definida en el diseño, con desviaciones marginales en todas las variables controladas.</p>'
  var cab = ['Variable', 'Categoría', 'Muestra objetivo', 'Muestra lograda', 'Δ (pp)', 'Casos']
  h += tabla('Comparación con el programa de 12 meses (90 casos)', cab, [
    ['Sexo', 'Hombre', '67%', '64%', '-3', '58'], ['Sexo', 'Mujer', '33%', '36%', '+3', '32'],
    ['Edad', '18-34', '7%', '9%', '+2', '8'], ['Edad', '35-49', '51%', '53%', '+2', '48'], ['Edad', '50-64', '42%', '38%', '-4', '34'],
    ['Cargo', 'Profesional', '58%', '61%', '+3', '55'], ['Cargo', 'Ejecutivo', '42%', '39%', '-3', '35'],
    ['Zona', 'RM', '81%', '76%', '-5', '68'], ['Zona', 'Regiones', '19%', '25%', '+5', '22']
  ])
  h += tabla('Comparación con el programa de 4 meses (150 casos)', cab, [
    ['Sexo', 'Hombre', '67%', '65%', '-2', '97'], ['Sexo', 'Mujer', '33%', '35%', '+2', '53'],
    ['Edad', '18-34', '7,4%', '9,3%', '+2', '14'], ['Edad', '35-49', '51,3%', '53,3%', '+2', '80'], ['Edad', '50-64', '42,3%', '37,3%', '-4', '56'],
    ['Cargo', 'Profesional', '67%', '67%', '=', '101'], ['Cargo', 'Ejecutivo', '33%', '33%', '=', '49'],
    ['Zona', 'RM', '85%', '80%', '-5', '120'], ['Zona', 'Regiones', '15%', '20%', '+5', '30']
  ], 'Muestra objetivo = distribución de la población que participó en el programa de outplacement respectivo.')
  h += '<h3>Levantamiento</h3><p>Encuesta estructurada aplicada por teléfono entre febrero y marzo de 2026. El cuestionario abordó el cargo del que la persona fue desvinculada, el período exacto de desvinculación, el tiempo de recolocación y las condiciones del nuevo empleo (tipo de institución y cargo).</p>'
  h += '<h2>Cómo se midió la recolocación efectiva</h2><p>Para el grupo de comparación se construyó un indicador de recolocación laboral efectiva a partir de la fecha de desvinculación reportada y la situación laboral actual. Se consideró recolocado a quien declaró haber encontrado empleo dentro de los 12 o 4 meses posteriores a su desvinculación. Para asegurar comparabilidad en calidad del empleo, el indicador excluye:</p>'
  h += ul(['Trabajadores independientes, consultores y emprendedores.', 'Personas en cargos significativamente inferiores al previo.'])
  h += '<h2>Resultados</h2>'
  h += '<h3>Programa de 12 meses</h3>'
  h += tabla(null, ['Grupo', 'Recolocación efectiva a 12 meses', 'n'], [
    ['Con outplacement (programa LabLab)', '<strong>93,2%</strong>', '322'], ['Sin outplacement (muestra Cadem)', '41,1%', '90'], ['Diferencia', '<strong>52,1 pp</strong>', '']
  ])
  h += tabla('Grupo sin outplacement: recolocación acumulada mes a mes (programa de 12 meses)', ['Mes', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], [
    ['Acumulado', '1', '7', '12', '18', '22', '24', '28', '29', '31', '32', '34', '37', '41']
  ], 'Valores del gráfico del informe para el grupo sin outplacement (el último valor coincide con el 41,1% de recolocación a 12 meses).')
  h += '<h3>Programa de 4 meses</h3>'
  h += tabla(null, ['Grupo', 'Recolocación efectiva a 4 meses', 'n'], [
    ['Con outplacement (programa LabLab)', '<strong>40,4%</strong>', '557'], ['Sin outplacement (muestra Cadem)', '24,0%', '150'], ['Diferencia', '<strong>16,4 pp</strong>', '']
  ])
  h += tabla('Grupo sin outplacement: recolocación acumulada mes a mes (programa de 4 meses)', ['Mes', '0', '1', '2', '3', '4'], [
    ['Acumulado', '2', '7', '14', '21', '24']
  ], 'Valores del gráfico del informe para el grupo sin outplacement (el último valor coincide con el 24,0% de recolocación a 4 meses).')
  h += '<h2>Significancia estadística</h2><p>Para evaluar la diferencia entre ambos grupos se aplicó una prueba de diferencia de proporciones para muestras independientes, con un punto de corte de 1,96 para una prueba bilateral al 95% de confianza.</p>'
  h += tabla(null, ['Indicador', 'Programa 4 meses', 'Programa 12 meses'], [
    ['n con outplacement (p1)', '557 (40,4%)', '322 (93,2%)'], ['n sin outplacement (p2)', '150 (24,0%)', '90 (41,1%)'],
    ['Diferencia observada', '0,164', '0,521'], ['Proporción combinada', '≈ 0,369', '0,818'], ['Error estándar', '≈ 0,0441', '≈ 0,0457'],
    ['Estadístico Z', '<strong>≈ 3,72</strong>', '<strong>≈ 11,41</strong>'], ['¿Supera 1,96?', 'Sí', 'Sí']
  ])
  h += '<h2>Conclusiones del informe</h2>'
  h += ul([
    '<strong>Programa de 12 meses:</strong> la tasa de recolocación del programa de LabLab (93,2%) supera ampliamente tanto el resultado de la muestra homóloga realizada por Cadem (41,1%) como el umbral requerido para significancia al 95% en una muestra de 90 casos (78,8%). Con ello se valida la existencia de un impacto positivo del programa de outplacement de 12 meses en la recolocación laboral.',
    '<strong>Programa de 4 meses:</strong> la tasa de recolocación del programa de LabLab (40,4%) supera ampliamente tanto el resultado de la muestra homóloga (24,0%) como el umbral requerido para significancia al 95% en una muestra de 150 casos (25,2%). Con ello se valida la existencia de un impacto positivo del programa de outplacement de 4 meses en la recolocación laboral.'
  ])
  h += '<p class="ll-nota">Nota del informe: si estos resultados provinieran de un muestreo probabilístico, las diferencias observadas serían estadísticamente significativas al 95% de confianza, validando el impacto positivo de ambos programas.</p>'
  h += '<h2>Ficha técnica</h2><div class="ll-ficha">' + tabla(null, ['Dato', 'Detalle'], [
    ['Realizado por', 'Cadem'], ['Preparado para', 'LabLab'], ['Fecha del informe', 'Abril de 2026'],
    ['Diseño', 'Cuantitativo comparativo no experimental (cuasi-experimento con grupo de comparación equivalente)'],
    ['Muestreo', 'No probabilístico: por conveniencia y bola de nieve, con cuotas de sexo, edad, zona y nivel de cargo'],
    ['Grupo sin outplacement', '240 casos: 90 (comparación 12 meses) y 150 (comparación 4 meses)'],
    ['Grupo con outplacement', 'Participantes de los programas de LabLab: 322 (12 meses) y 557 (4 meses)'],
    ['Período de desvinculación', 'Enero 2024 a enero 2025 (12 meses) y enero 2025 a agosto 2025 (4 meses)'],
    ['Técnica', 'Encuesta estructurada telefónica'], ['Trabajo de campo', 'Febrero y marzo de 2026']
  ]) + '</div>'
  h += faqHtml(faq)
  h += '<h2>Lecturas relacionadas</h2>' + ul([
    '<a href="/que-es-outplacement-2026/">Qué es el outplacement</a>', '<a href="/recolocacion-laboral-chile-2026/">Recolocación laboral en Chile: tiempos y estrategias</a>', '<a href="/beneficios-outplacement-empresa-2026/">Beneficios del outplacement para la empresa</a>'
  ])
  h += otrosEstudios('cadem')
  h += cta('LabLab acompaña a las personas desvinculadas con programas de outplacement de 4 y 12 meses, que combinan consultores senior y tecnología.')
  var schema = { '@context': 'https://schema.org', '@graph': [
    report('cadem', { author: CADEM, funder: ORG_FULL, about: [{ '@type': 'Thing', name: 'Outplacement' }, { '@type': 'Thing', name: 'Recolocación laboral' }],
      temporalCoverage: '2024-01/2026-03', measurementTechnique: 'Encuesta telefónica estructurada; prueba de diferencia de proporciones' }),
    migas([['Inicio', '/'], ['Estudios', '/estudios/'], [E.cadem.h1, url('cadem')]]),
    faqSchema(faq)
  ] }
  return { e: E.cadem, contenido: ESTILO + hero(MIGAS_BASE + 'Impacto del outplacement', 'Estudio · ' + E.cadem.fuenteTxt + ' · ' + E.cadem.fechaTxt, E.cadem.h1,
    'Cadem midió cuántas personas desvinculadas que no hicieron outplacement encontraron un nuevo empleo a 4 y 12 meses, y lo comparó con los resultados de los programas de outplacement de LabLab.') + cuerpo(h) + ld(schema) }
}

// ---------------------------------------------------------------- Desvinculaciones
function paginaDesv() {
  var faq = [
    ['¿Cuánto le cuesta a una empresa en Chile que un despido termine en juicio?', 'Según el modelo de LabLab, el valor esperado promedio de un juicio laboral asciende a $6.694.862 (en torno a $6,6 millones) por sobre el finiquito, considerando recargos, acuerdos, costas, intereses y reajustes y costos internos.'],
    ['¿Qué porcentaje de los juicios laborales gana el trabajador?', 'Cuando los casos llegan a fallo, la probabilidad de que el resultado sea favorable al trabajador se ubica sobre el 90%. En la causal de necesidades de la empresa (artículo 161 inciso 1), cuando se judicializa, el resultado es favorable al trabajador en el 90% de los casos.'],
    ['¿Qué causal de despido concentra más juicios laborales?', 'De las 96.808 causas ingresadas al Poder Judicial en 2024, el modelo estima que el 70,2% (67.960) corresponde al artículo 161 inciso 1, necesidades de la empresa, seguido por el artículo 160 inciso 3, no concurrencia, con 23,7% (22.917).'],
    ['¿Qué recargo se paga si el despido se declara improcedente, injustificado o indebido?', 'El recargo sobre la indemnización es de 30% en el despido improcedente (necesidades de la empresa o desahucio), 50% en el despido injustificado, 80% en el despido indebido o disciplinario, 50% u 80% en el autodespido y de 6 a 11 remuneraciones en la vulneración de derechos fundamentales.'],
    ['¿Cuánto puede llegar a costar un despido mal aplicado?', 'En la simulación del estudio, un despido por necesidades de la empresa declarado improcedente genera un sobrecosto judicial de $9.078.169 más otros impactos, y uno por no concurrencia declarado indebido llega a $14.163.425 más otros impactos. El caso límite con tope imponible de 90 UF, 11 años de servicio y recargo de 80% supera los $45 millones.'],
    ['¿Cómo ayuda el outplacement a reducir la judicialización?', 'El estudio plantea que el outplacement reduce la probabilidad de judicialización mediante acompañamiento y contención emocional, comunicación clara y una salida respetuosa, además de proteger la marca empleadora y el clima interno. Según la experiencia de LabLab, un programa oportuno podría disminuir la conflictividad y las demandas hasta una cifra cercana a cero.']
  ]
  var h = ''
  h += stats([
    ['$6,6 millones', 'Costo promedio de un juicio laboral por sobre el finiquito (valor esperado del modelo: $6.694.862)'],
    ['Más de 90%', 'De los casos que llegan a fallo terminan a favor del trabajador'],
    ['96.808', 'Causas laborales ingresadas al Poder Judicial en 2024; 70,2% por necesidades de la empresa'],
    ['54.455', 'Juicios laborales ingresados en el primer semestre de 2025, más de 5.000 sobre igual período de 2024']
  ])
  h += '<h2>Resumen ejecutivo</h2><p>En Chile, la gestión de las desvinculaciones es uno de los principales desafíos para las empresas. A partir de los datos de la Dirección del Trabajo (DT) y del Poder Judicial (PJud), considerando las causales susceptibles de judicialización, LabLab desarrolló un modelo estadístico que asigna la probabilidad de demanda por causal y estima el costo esperado de judicialización en cada rama de un árbol de decisiones: si hay juicio o no, el tipo de término (sentencia, avenimiento, conciliación, acoge demanda monitorio u otros) y quién resulta favorecido.</p>'
  h += ul([
    '<strong>La judicialización crece:</strong> la sentencia es la forma de término más frecuente de las causas laborales (24,6% en 2024), lo que presiona la exposición financiera y operacional de las compañías.',
    '<strong>El trabajador gana la gran mayoría de los fallos:</strong> cuando los casos llegan a fallo, la probabilidad de un resultado favorable al trabajador se ubica sobre el 90%.',
    '<strong>El sobrecosto judicial es alto:</strong> el costo medio por juicio, adicional al finiquito, supera en promedio los $6,6 millones, suficiente para superar con holgura el costo de alternativas de gestión temprana bien diseñadas.'
  ])
  h += '<h2>Panorama de las desvinculaciones en Chile</h2>'
  h += '<h3>Tendencias recientes y proyección 2025</h3><p>Las cartas de término de contrato registradas por la DT muestran una tendencia al alza, que según el estudio responde más a factores económicos (la ralentización de ciertos sectores y las necesidades de ajuste organizacional) que a cambios normativos puntuales. El primer semestre concentra históricamente más términos de contrato: en el primer semestre de 2025 se contabilizaron más de 1,4 millones de desvinculaciones, y la proyección para 2025 supera los 2,6 millones. La causal del artículo 161 inciso 1 (necesidades de la empresa) representó el 54,6% del total en el primer semestre de 2025.</p>'
  h += tabla('Desvinculaciones registradas por la Dirección del Trabajo', ['Año', 'Primer semestre', 'Segundo semestre', 'Total'], [
    ['2023', '1.274.437', '1.132.016', '2.406.453'], ['2024', '1.296.340', '1.188.763', '2.485.103'], ['2025', '1.400.170', '1.283.864 (proyección)', '2.684.034 (proyección)']
  ], 'Fuente: gráfico n°1 del estudio, con datos de la Dirección del Trabajo.')
  h += '<h3>Judicialización laboral: cifras clave</h3><p>El Poder Judicial registró 54.455 juicios laborales ingresados en el primer semestre de 2025, más de 5.000 causas sobre el mismo período de 2024. En los últimos cinco años las sentencias han aumentado de manera constante, con un alza de 6,3% en 2024 respecto de 2023. Es un tránsito hacia resoluciones más extensas, costosas y complejas, de las cuales más del 90% resultaron favorables a los trabajadores.</p>'
  h += tabla('Términos de causas laborales por tipo, 2020–2024', ['Año', 'Sentencia', 'Acoge demanda monitorio', 'Avenimiento', 'Conciliación', 'Retiro de la demanda', 'Otras causales', 'Total'], [
    ['2020', '11.883', '6.031', '11.498', '17.848', '1.855', '13.093', '62.208'],
    ['2021', '18.789', '2.983', '13.685', '22.537', '1.719', '15.096', '74.809'],
    ['2022', '18.574', '3.790', '14.150', '21.181', '1.886', '15.987', '75.568'],
    ['2023', '20.326', '5.077', '18.433', '21.317', '1.893', '15.504', '82.550'],
    ['2024', '21.605', '5.389', '20.973', '20.218', '2.167', '17.472', '87.824']
  ], 'Fuente: gráfico n°2 del estudio, con datos del Poder Judicial. El estudio proyecta cerca de 94.000 términos para 2025.')
  h += '<h2>¿Cuánto cuesta una desvinculación judicializada?</h2><p>Como no existe una relación directa entre los registros de la DT y los del Poder Judicial, el estudio infiere el riesgo a partir de la distribución de cartas de término por causal, en dos pasos:</p>'
  h += '<ol><li><strong>¿Con qué frecuencia cada causal llega a juicio?</strong> Se calcula una tasa país de judicialización con datos DT y PJud y se ajusta por causal con multiplicadores jurídicamente justificados, normalizados para que el promedio reproduzca la tasa observada.</li><li><strong>Si hay juicio, ¿cuánto cuesta en promedio?</strong> Para cada tipo de término se estima su frecuencia y su costo total: recargo legal sobre la indemnización por años de servicio cuando corresponde, honorarios, horas-hombre internas, costas y otros impactos operativos. Luego se modela el resultado (si gana el trabajador) según la causal.</li></ol>'
  h += '<p>Multiplicando las probabilidades de cada rama del árbol se obtiene el costo esperado por desvinculación, condicionado por la causal de término, el tipo de término del proceso y su resultado. Aunque el juicio sea favorable para la empresa, existen costos de defensa, horas internas y eventuales costas, por lo que esa rama también se considera.</p>'
  h += '<h2>Mapa de las causas laborales 2024</h2><p>Del universo de causas ingresadas al Poder Judicial en 2024, el modelo estima su distribución según causal de desvinculación:</p>'
  h += tabla('Ingresos de causas al Poder Judicial 2024: 96.808', ['Causal', 'Casos', '%'], [
    ['Artículo 161 inciso 1 · Necesidades de la empresa', '67.960', '70,2%'], ['Artículo 160 inciso 3 · No concurrencia', '22.917', '23,7%'],
    ['Artículo 160 inciso 7 · Incumplimiento grave de obligaciones', '2.176', '2,2%'], ['Otros artículos', '3.754', '3,9%']
  ])
  h += tabla('Términos de causas en el Poder Judicial 2024: 87.824', ['Tipo de término', 'Casos', '%'], [
    ['Sentencia', '21.605', '24,6%'], ['Avenimiento', '20.973', '23,9%'], ['Conciliación', '20.218', '23,0%'], ['Acoge demanda monitorio', '5.389', '6,1%'], ['Otros tipos de término', '19.639', '22,9%']
  ])
  h += '<p>Los ingresos de 2024 superan a los términos, lo que evidencia que una parte importante de los juicios se prolonga por más de un año. Cada causa abierta representa un costo potencial sostenido en el tiempo hasta su conclusión, y como una fracción relevante se resuelve sin llegar a fallo, la gestión temprana influye directamente en el costo esperado por caso.</p>'
  h += '<h2>Simulación de dos casos tipo</h2><p>Para dimensionar el costo, el estudio simula dos casos con el mismo perfil de trabajador y los mismos supuestos operativos, variando solo la causal invocada en la carta de término. El perfil corresponde a un empleado administrativo de una empresa mediana, con remuneración tomada de guías salariales.</p>'
  h += tabla('Antecedentes del caso', ['Concepto', 'Valor'], [
    ['Tamaño de empresa', 'Mediana'], ['Años de servicio', '5'], ['Remuneración imponible base para indemnizaciones (IB)', '$1.731.000'], ['Feriados pendientes', '15 días'],
    ['Indemnización por años de servicio (IAS)', '$8.655.000'], ['Indemnización sustitutiva del aviso previo (ISAP)', '$1.731.000'], ['Vacaciones proporcionales / feriado pendiente (FP)', '$865.000'],
    ['Finiquito', '$11.251.500'], ['Costas procesales impuestas (CP)', '$500.000'], ['Horas-hombre internas (HHI)', '$3.500.000']
  ])
  h += '<p>Monto de sentencia: MS = (IAS + ISAP) + (R × IAS) + FP + HE + CP + HHI + IR + O, donde R es el recargo legal, HE los honorarios externos, IR los intereses y reajustes y O otros impactos operativos y reputacionales (difíciles de cuantificar y no incluidos en los montos).</p>'
  h += tabla('Resultado de la simulación', ['Concepto', 'Caso 1: art. 161 inc. 1 (necesidades de la empresa)', 'Caso 2: art. 160 inc. 3 (no concurrencia)'], [
    ['Decisión del tribunal', 'Despido improcedente: recargo de 30% sobre la IAS, más costas', 'Despido indebido: recargo de 80% sobre la IAS, más costas'],
    ['Honorarios externos (HE)', '$1.538.167', '$1.998.493'], ['Intereses y reajustes (IR)', '$796.738', '$1.240.932'],
    ['Monto de sentencia', '$20.329.669 + O', '$25.414.925 + O'], ['Sobrecosto judicial frente al finiquito', '<strong>$9.078.169 + O</strong>', '<strong>$14.163.425 + O</strong>']
  ])
  h += '<p>El caso 1 es el más frecuente y crítico: la causal de necesidades de la empresa concentra la mayor proporción de cartas de término y, cuando se declara improcedente (90% de los casos), activa recargos que elevan de forma sustancial el costo total. El caso 2 tiene menor frecuencia pero mayor severidad; las causales con recargo de 80% agrupadas alcanzan cerca del 40% del total. Con un perfil límite (tope imponible de 90 UF, 11 años de servicio y recargo de 80%), el sobrecosto supera los $45 millones.</p>'
  h += '<p><strong>Conclusiones de la simulación:</strong> la severidad y la frecuencia importan; el costo total no es igual al costo jurídico, porque se suman efectos en marca empleadora, clima, productividad, riesgo de contagio interno y costo de oportunidad; y los mecanismos preventivos aplicados a tiempo, como el outplacement, reducen la probabilidad de judicialización y mitigan costos directos e indirectos.</p>'
  h += '<h3>Juicios laborales de referencia</h3>'
  h += tabla(null, ['Empresa', 'Cargo', 'Término', 'RIT · Tribunal', 'Finiquito', 'Recargo', 'Gasto adicional', 'Total condena'], [
    ['Planta de revisión técnica', 'Operador', 'Avenimiento', 'O-235-2024 · Juzgado de Letras de Colina', '$15.700.000', '$7.850.000', '$3.600.000', '$27.150.000'],
    ['Empresa de la construcción', 'Operador mixer', 'Avenimiento', 'O-3831-2024 · 1º Juzgado de Letras del Trabajo de Santiago', '$6.500.000', '$5.200.000', '$2.100.000', '$13.800.000'],
    ['Entidad bancaria', 'Ejecutivo comercial', 'Avenimiento', 'T-3457-2024 · 2º Juzgado de Letras del Trabajo de Santiago', '$12.000.000', '$3.600.000', '$7.500.000', '$23.100.000'],
    ['Entidad bancaria', 'Analista contable', 'Sentencia', 'O-8672-2024 · 2º Juzgado de Letras del Trabajo de Santiago', '$27.600.000', '$8.300.000', '$5.100.000', '$41.000.000']
  ], 'Casos consultables en el Poder Judicial (anexo 3 del estudio). Se usan datos aproximados para resguardar la similitud con el caso real; el RIT permite la comparación.')
  h += '<h2>Recargos legales según tipo de despido</h2>'
  h += tabla(null, ['Tipo de despido', 'Recargo o indemnización', 'Causal mal aplicada / ejemplos'], [
    ['Despido improcedente', '30%', 'Necesidades de la empresa, establecimiento o servicio; desahucio.'],
    ['Despido injustificado', '50%', 'Despido verbal o tácito; término de la obra o faena; vencimiento del plazo; renuncia voluntaria; caso fortuito o fuerza mayor.'],
    ['Despido indebido / disciplinario', '80%', 'Incumplimiento grave de obligaciones, falta de probidad, acoso sexual, acoso laboral, vías de hecho, injurias, conducta inmoral, negociaciones incompatibles, ausencias injustificadas, abandono del trabajo, actos imprudentes, perjuicio material intencional.'],
    ['Autodespido / despido indirecto', '50% u 80%', 'El trabajador se ve forzado a renunciar por incumplimientos graves o conductas ilícitas del empleador.'],
    ['Vulneración de derechos fundamentales', '6 a 11 remuneraciones', 'Protección mediante tutela laboral.']
  ], 'Fuente: anexo 1 del estudio.')
  h += '<h3>Artículos susceptibles de judicializar según la DT (2024)</h3><p>Los artículos 161 y 160 concentran los mayores niveles de conflictividad laboral. La alta dependencia del artículo 161, muchas veces aplicado sin la correcta justificación ante la Dirección del Trabajo, deriva frecuentemente en litigios.</p>'
  h += tabla(null, ['Artículo del Código del Trabajo', '% de las desvinculaciones susceptibles de judicializar'], [
    ['Artículo 161', '54,90%'], ['Artículo 160', '39,28%'], ['Artículo 159', '5,79%'], ['Artículo 163', '0,04%']
  ], 'Fuente: gráfico n°3 del estudio, con datos de la Dirección del Trabajo 2024.')
  h += '<h2>El valor del outplacement en la gestión de las desvinculaciones</h2><p>El outplacement de LabLab es un servicio integral de transición laboral que combina consultores senior, una metodología propia y tecnología con inteligencia artificial. En los últimos 6 años LabLab ha apoyado más de 41 reorganizaciones masivas, a más de 4.800 personas con programas personalizados y a más de 12.000 con programas digitales. Según el estudio, el outplacement contribuye a reducir la judicialización mediante:</p>'
  h += ul([
    '<strong>Acompañamiento integral y contención emocional:</strong> apoyo psicológico y profesional que mitiga el estrés y la incertidumbre, con una comunicación clara, humana y cercana.',
    '<strong>Reducción de conflictos y litigios:</strong> a partir de su experiencia en desvinculaciones individuales y reorganizaciones masivas, LabLab plantea la hipótesis de que un programa implementado oportunamente podría disminuir la conflictividad laboral y las demandas hasta una cifra cercana a cero.',
    '<strong>Reputación corporativa y marca empleadora:</strong> un compromiso ético con las personas desvinculadas protege la imagen de la empresa y mejora el clima de quienes permanecen.',
    '<strong>Reorganizaciones más fluidas:</strong> los equipos directivos se enfocan en la estrategia mientras especialistas acompañan a los colaboradores afectados.'
  ])
  h += '<h2>Conclusiones</h2><p>La gestión de las desvinculaciones en Chile se ha transformado en un desafío de alto impacto financiero y reputacional. La tendencia al alza de los juicios laborales y la marcada inclinación de los fallos a favor de los trabajadores configuran un entorno de riesgo: el costo promedio de un juicio laboral alcanza los $6,6 millones y, aun con fallo favorable, persisten costos de defensa, horas de gestión interna, posibles costas y deterioro reputacional. Las simulaciones muestran que el sobrecosto frente al finiquito puede superar los $45 millones bajo supuestos conservadores, y los casos reales del Poder Judicial muestran montos comparables. En este contexto, el estudio concluye que invertir en outplacement como mecanismo preventivo es financieramente racional y estratégicamente necesario.</p>'
  // Metodología (anexo integrado)
  h += '<h2>Metodología</h2><p>El anexo metodológico del estudio describe el método para estimar la probabilidad de judicialización por causal, la distribución de términos de las causas y el valor esperado del costo de una desvinculación.</p>'
  h += '<h3>Fuentes de datos</h3>' + ul([
    '<strong>Dirección del Trabajo:</strong> registro de cartas de aviso de término de contrato con desglose por causal, últimos 5 años. Cuenta trabajadores únicos por empleador en el mes (si hay duplicados, se consolida el último registro mensual) y usa el mes de registro de la carta.',
    '<strong>Poder Judicial:</strong> total de causas laborales ingresadas, materias y términos por tipo (sentencia, conciliación, etc.), con fechas.'
  ]) + '<p>Como no hay una correlación directa entre causales y procesos judiciales, la distribución de los procesos se estima con una ponderación normalizada de la distribución de cartas por causal. Los resultados representan promedios y riesgos relativos a nivel agregado.</p>'
  h += '<h3>Universo</h3><p>Corresponde a las causales susceptibles de judicialización. El universo 2024 asciende a <strong>861.055 observaciones</strong> (trabajador único por empleador en el mes).</p>'
  h += tabla(null, ['Causales incluidas', 'Causales excluidas por baja litigación observada'], [[
    'Art. 159 N°1 (mutuo acuerdo), art. 159 N°6 (caso fortuito o fuerza mayor), art. 160 N°1 a N°7, art. 161 N°1 (necesidades de la empresa), art. 161 N°2 (desahucio) y art. 163 bis (procedimiento concursal de liquidación).',
    'Art. 159 N°2 (renuncia), art. 159 N°3 (muerte del trabajador), art. 159 N°4 (vencimiento del plazo) y art. 159 N°5 (conclusión del trabajo o servicio).'
  ]])
  h += '<h3>Probabilidad de judicialización por causal</h3><p>Se parte de una tasa país: p<sub>base</sub> = ingresos anuales de causas laborales al PJud (M) / total de desvinculaciones del universo DT (N). Luego cada causal i recibe un multiplicador m<sub>i</sub> (α<sub>i</sub> = p<sub>base</sub> · m<sub>i</sub>), normalizado por la distribución de cartas (w<sub>i</sub> = m<sub>i</sub> / Σ π<sub>i</sub>m<sub>i</sub>) para que el promedio ponderado vuelva a la tasa país. Si m<sub>i</sub> &gt; 1, la causal litiga más que el promedio; si m<sub>i</sub> &lt; 1, menos.</p>'
  h += tabla('Criterio jurídico de los multiplicadores (resumen)', ['Causal', 'Justificación'], [
    ['159 N°1 · Mutuo acuerdo', 'Es consensual; se litiga poco y solo si hay vicios del consentimiento. Multiplicador menor que 1.'],
    ['159 N°6 · Caso fortuito o fuerza mayor', 'Alta litigación: el empleador debe probar la fuerza mayor.'],
    ['160 N°1 · Conductas indebidas graves', 'Muy litigable: requiere prueba grave de las faltas; alto riesgo de recargos.'],
    ['160 N°2 · Actividades prohibidas', 'Difícil de acreditar; judicialización frecuente.'],
    ['160 N°3 y N°4 · No concurrencia y abandono', 'Errores de cómputo o comunicación disparan litigios.'],
    ['160 N°5 y N°6 · Imprudencias temerarias y perjuicio material', 'Difícil acreditar temeridad o intención; alto riesgo de controversia.'],
    ['160 N°7 · Incumplimiento grave', 'Muy litigable por su amplitud y subjetividad.'],
    ['161 N°1 · Necesidades de la empresa', 'Exige motivos objetivos y verificables; con fundamentación débil el trabajador tiene incentivos a demandar. Multiplicador mayor que 1.'],
    ['161 N°2 · Desahucio', 'Se judicializa menos que el inciso 1, pero existe.'],
    ['163 bis · Liquidación concursal', 'Se tramita principalmente en la liquidación concursal; poca judicialización directa.']
  ])
  h += '<h3>Árbol de decisión y costo esperado</h3><p>Cada desvinculación se modela como un árbol: π<sub>i</sub> es la proporción de desvinculaciones por la causal i; α<sub>i</sub>, la probabilidad de que se judicialice; τ<sub>j</sub>, la probabilidad de que el juicio termine por el término j (estructura de términos 2024, común a todas las causales), y ω<sub>i</sub>, la probabilidad de que gane el trabajador según la causal. K<sup>t</sup><sub>ij</sub> y K<sup>e</sup><sub>ij</sub> son los costos totales si gana el trabajador o el empleador. El costo esperado es:</p>'
  h += '<p style="text-align:center;font-size:1.1rem"><strong>CE = Σ<sub>i</sub> π<sub>i</sub> · α<sub>i</sub> · Σ<sub>j</sub> τ<sub>j</sub> [ω<sub>i</sub> · K<sup>t</sup><sub>ij</sub> + (1 − ω<sub>i</sub>) · K<sup>e</sup><sub>ij</sub>]</strong></p>'
  h += '<p>Los costos se separan en un costo base no litigioso (finiquito y prestaciones según la causal) y costos incrementales por judicialización: recargos legales, costas procesales, horas-hombre internas y externas, intereses y reajustes. Con los parámetros del informe y el perfil de la simulación, el valor esperado promedio de un juicio asciende a <strong>$6.694.862</strong>.</p>'
  h += '<h3>Fuentes</h3>' + ul([
    'Dirección del Trabajo: Informe Mensual de Terminaciones de Contrato de Trabajo (junio 2025) y series de terminaciones de contrato.',
    'Poder Judicial: plataforma “Poder Judicial en Números” (ingresos y términos de causas).',
    'Superintendencia de Seguridad Social (SUSESO): normas y jurisprudencia.',
    'Código del Trabajo (BCN LeyChile), incluidos el artículo 171 (recargos) y los artículos 485 y 498 (tutela laboral).',
    'Observatorio Judicial (2025), Informe N°78: Tutelas laborales; Libertad y Desarrollo (2017), La causal de despido por “necesidades de la empresa”; Universidad de Chile (2023), juicios por despidos con ocasión de la crisis sanitaria.',
    'Academia Judicial: guías de audiencia de conciliación laboral y de audiencia monitoria.',
    'Buk (2025): Reporte Salarial, para los supuestos de remuneración.'
  ])
  h += '<h2>Ficha técnica</h2><div class="ll-ficha">' + tabla(null, ['Dato', 'Detalle'], [
    ['Elaborado por', 'LabLab'], ['Fuentes', 'Dirección del Trabajo y Poder Judicial (datos hasta el primer semestre de 2025)'],
    ['Año base del modelo', '2024'], ['Universo', '861.055 desvinculaciones por causales susceptibles de judicialización (2024)'],
    ['Método', 'Modelo probabilístico de árbol de decisión (causal → judicialización → término → resultado) y simulación de casos tipo'],
    ['Resultado principal', 'Valor esperado promedio de un juicio laboral: $6.694.862']
  ]) + '</div>'
  h += faqHtml(faq)
  h += '<h2>Lecturas relacionadas</h2>' + ul([
    '<a href="/articulo-161-necesidades-empresa-2026/">Artículo 161: despido por necesidades de la empresa</a>', '<a href="/indemnizacion-despido-chile-2026/">Indemnización por despido en Chile</a>', '<a href="/beneficios-outplacement-empresa-2026/">Beneficios del outplacement para la empresa</a>'
  ])
  h += otrosEstudios('desv')
  h += cta('LabLab diseña procesos de salida con outplacement para desvinculaciones individuales y reorganizaciones masivas.')
  var schema = { '@context': 'https://schema.org', '@graph': [
    report('desv', { about: [{ '@type': 'Thing', name: 'Desvinculación laboral' }, { '@type': 'Thing', name: 'Juicios laborales en Chile' }, { '@type': 'Thing', name: 'Outplacement' }],
      temporalCoverage: '2020/2025', isBasedOn: ['Dirección del Trabajo de Chile: terminaciones de contrato de trabajo', 'Poder Judicial de Chile: Poder Judicial en Números'] }),
    migas([['Inicio', '/'], ['Estudios', '/estudios/'], [E.desv.h1, url('desv')]]),
    faqSchema(faq)
  ] }
  return { e: E.desv, contenido: ESTILO + hero(MIGAS_BASE + 'Costo de las desvinculaciones', 'Estudio LabLab · Datos de la Dirección del Trabajo y del Poder Judicial', E.desv.h1,
    '¿Cuánto le cuesta a una empresa, en promedio, que una desvinculación termine en juicio? Un modelo con datos oficiales de la DT y del Poder Judicial.') + cuerpo(h) + ld(schema) }
}

// ---------------------------------------------------------------- Marca empleadora
function paginaMarca() {
  var faq = [
    ['¿Qué porcentaje de las empresas con mejor marca empleadora en Chile contrata outplacement?', 'El 72% de las 86 empresas analizadas en los rankings de Great Place to Work, Merco Talento y LinkedIn Top Companies contrata outplacement: 69% en Great Place to Work, 79% en Merco Talento y 90% en LinkedIn Top Companies.'],
    ['¿Las empresas que contratan outplacement están mejor ubicadas en los rankings?', 'Sí. En promedio se ubican entre 2,2 y 4,5 posiciones más arriba que las que no lo contratan: 4,5 lugares en Great Place to Work, 3,5 en Merco Talento y 2,2 en LinkedIn Top Companies.'],
    ['¿Qué rankings de marca empleadora se analizaron?', 'Great Place to Work Chile (2022 a 2024), LinkedIn Top Companies Chile (2023) y el top 30 de Merco Talento Chile (2023 a 2025), que suman 86 empresas únicas.'],
    ['¿El estudio demuestra que el outplacement causa una mejor marca empleadora?', 'No. Es un análisis descriptivo y la correlación no implica causalidad. Los resultados son consistentes en tres rankings con metodologías distintas, y la clasificación de empresas la hizo el equipo de LabLab, por lo que se asumen sesgos que se mitigaron contrastando con fuentes públicas.'],
    ['¿Cómo les va a los clientes de LabLab en estos rankings?', 'Dentro del grupo con outplacement, los clientes de LabLab tienen una mejor posición promedio que los clientes de otros proveedores: 7,5 vs 8,7 en Great Place to Work, 14,8 vs 17,3 en Merco Talento y 9,8 vs 10,9 en LinkedIn Top Companies.']
  ]
  var h = ''
  h += stats([
    ['72%', 'De las empresas mejor rankeadas en marca empleadora contrata outplacement'],
    ['2,2 a 4,5', 'Posiciones más arriba, en promedio, que las empresas sin outplacement'],
    ['86', 'Empresas únicas analizadas en tres rankings'],
    ['3 de 3', 'Rankings en que los clientes LabLab tienen mejor posición promedio']
  ])
  h += '<h2>Resumen ejecutivo</h2><p>El estudio analiza la relación entre las empresas que contratan servicios de outplacement y su posición en los principales rankings de imagen empleadora de Chile. Cubre 86 empresas únicas presentes en tres fuentes independientes: Great Place to Work Chile (2022–2024), LinkedIn Top Companies Chile (2023) y el top 30 de Merco Talento Chile (2023–2025). Las empresas se clasificaron en tres grupos: clientes LabLab, clientes de otros proveedores y empresas sin outplacement entre sus beneficios.</p>'
  h += ul([
    'El <strong>72%</strong> de las empresas mejor rankeadas contrata outplacement: es la norma y no la excepción entre las mejores marcas empleadoras del país.',
    'Las empresas con outplacement se ubican en promedio entre <strong>2,2 y 4,5 posiciones más arriba</strong> que las que no lo contratan.',
    'Los <strong>clientes LabLab</strong> obtienen los mejores resultados dentro del grupo con outplacement.'
  ])
  h += '<p>Según el estudio, la forma en que una empresa gestiona la salida de sus personas es una señal que el mercado laboral lee y recuerda: una desvinculación bien acompañada protege a quien se va y fortalece la percepción de la organización entre quienes se quedan y quienes aún no llegan.</p>'
  h += '<h2>Por qué hicimos este estudio</h2><p>En 7 años de trabajo en el mercado chileno, LabLab ha observado que las organizaciones que invierten en un proceso de salida bien gestionado tienden a ser también las que más prestigio acumulan como empleadoras. El estudio busca responder si existe evidencia sistemática de esa relación y si las mejores marcas empleadoras de Chile comparten la práctica del outplacement.</p>'
  h += '<h2>Marco teórico</h2><p>La marca empleadora (<em>employer branding</em>) se define como el paquete de beneficios funcionales, económicos y psicológicos que proporciona el empleo y que se identifican con la empresa (Ambler y Barrow, 1996; Backhaus y Tikoo, 2004). Opera hacia afuera, construyendo la imagen de la empresa como empleador, y hacia adentro, moldeando la cultura a través de prácticas consistentes. Mosley (2015) agrega que la reputación depende de la coherencia entre los valores y la cultura real.</p>'
  h += '<h2>Hipótesis</h2><p>“Las empresas que contratan servicios de outplacement, como expresión de una cultura organizacional que valora a sus personas incluso en la salida, se ubican en mejores posiciones en los principales rankings de imagen empleadora en Chile, respecto a aquellas que no lo hacen.”</p>'
  h += '<h2>Metodología</h2>'
  h += tabla('Rankings analizados', ['Ranking', 'Años', 'Qué mide'], [
    ['Great Place to Work Chile', '2022, 2023 y 2024', 'Experiencia de los colaboradores en 5 dimensiones: credibilidad, respeto, imparcialidad, orgullo y camaradería.'],
    ['LinkedIn Top Companies Chile', '2023', 'Datos de comportamiento real de usuarios de LinkedIn sobre el desarrollo profesional de colaboradores actuales y de quienes dejaron la organización.'],
    ['Merco Talento Chile (top 30)', '2023, 2024 y 2025', 'Monitor de reputación multistakeholder con 6 perspectivas y 12 fuentes de información.']
  ])
  h += '<p>Cada empresa se clasificó en una de tres categorías: <strong>cliente LabLab</strong> (contrato vigente o histórico de outplacement con LabLab), <strong>cliente de otro proveedor</strong> o <strong>sin outplacement</strong> (sin evidencia de contratación). La clasificación la realizó el equipo de LabLab a partir de su base de clientes y conocimiento de mercado. La posición de referencia de cada empresa es la mejor que obtuvo en el período analizado; una posición numéricamente menor es mejor.</p>'
  h += '<h2>Resultados</h2><h3>Penetración del outplacement</h3><p>Aproximadamente 3 de cada 4 empresas que aparecen en los rankings de marca empleadora contratan outplacement. Como una empresa puede repetirse en distintos años o rankings, el análisis por ranking se hizo de forma aislada y el total, sobre el universo consolidado de empresas únicas.</p>'
  h += tabla(null, ['Ranking', 'Con outplacement', 'Sin outplacement'], [
    ['Great Place to Work (2022–2024)', '69%', '31%'], ['Merco Talento (2023–2025)', '79%', '21%'], ['LinkedIn Top Companies (2023)', '90%', '10%'], ['<strong>Total universo consolidado</strong>', '<strong>72%</strong>', '<strong>28%</strong>']
  ])
  h += '<h3>Posición promedio en el ranking</h3>'
  h += tabla('Empresas con y sin outplacement (posición promedio; menor es mejor)', ['Ranking', 'Con outplacement', 'Sin outplacement', 'Ventaja con outplacement'], [
    ['Great Place to Work (2022–2024)', '8,3', '12,8', '+4,5'], ['Merco Talento (2023–2025)', '15,6', '19,1', '+3,5'], ['LinkedIn Top Companies (2023)', '10,3', '12,5', '+2,2']
  ])
  h += tabla('Dentro del grupo con outplacement: clientes LabLab y de otros proveedores', ['Ranking', 'Clientes LabLab', 'Otro proveedor', 'Diferencia'], [
    ['Great Place to Work (2022–2024)', '7,5', '8,7', '+1,2'], ['Merco Talento (2023–2025)', '14,8', '17,3', '+2,5'], ['LinkedIn Top Companies (2023)', '9,8', '10,9', '+1,1']
  ])
  h += '<h2>Conclusiones</h2><p>Los hallazgos son consistentes en las tres fuentes: el outplacement supera el 69% de penetración en todos los rankings, las empresas que lo contratan se ubican en promedio entre 2,2 y 4,5 posiciones más arriba que las que no, y los clientes de LabLab obtienen los mejores resultados dentro de ese grupo. Los resultados confirman la hipótesis planteada. Para el estudio, pocas decisiones revelan tanto los valores reales de una compañía como la forma en que gestiona la salida de sus colaboradores: el outplacement pasa a ser una expresión concreta y visible de la cultura organizacional.</p>'
  h += '<h2>Limitaciones</h2><p>Es un análisis descriptivo, por lo que la correlación no implica causalidad; sin embargo, la consistencia en tres rankings con metodologías diferentes da luces sobre las estrategias corporativas que tienen resultados. Como la clasificación de empresas la hizo el equipo interno de LabLab según compras históricas y conocimiento de mercado, se asumen sesgos inherentes, mitigados mediante el contraste con fuentes públicas e independientes.</p>'
  h += '<h2>Ficha técnica</h2><div class="ll-ficha">' + tabla(null, ['Dato', 'Detalle'], [
    ['Elaborado por', 'LabLab'], ['Fecha', 'Mayo de 2026'], ['Universo', '86 empresas únicas'],
    ['Fuentes', 'Great Place to Work Chile 2022–2024; LinkedIn Top Companies Chile 2023; Merco Talento Chile 2023–2025 (top 30)'],
    ['Variables', 'Penetración de outplacement por grupo y posición promedio (mejor posición de cada empresa en el período)'],
    ['Tipo de análisis', 'Descriptivo']
  ]) + '</div>'
  h += '<h3>Referencias</h3>' + ul([
    'Ambler, T. y Barrow, S. (1996). The employer brand. Journal of Brand Management, 4(3), 185-206.',
    'Backhaus, K. y Tikoo, S. (2004). Conceptualizing and researching employer branding. Career Development International, 9(4/5), 501-517.',
    'Great Place to Work Chile (2022-2024). Ranking Great Place to Work Chile.', 'LinkedIn (2023). LinkedIn Top Companies Chile.', 'Merco (2023-2025). Merco Talento Chile.',
    'Mosley, R. (2015). CEOs Need to Pay Attention to Employer Branding. Harvard Business Review.'
  ])
  h += faqHtml(faq)
  h += '<h2>Lecturas relacionadas</h2>' + ul([
    '<a href="/marca-empleadora-despido-2026/">Marca empleadora y despidos</a>', '<a href="/top-10-empresas-marca-empleadora-chile-2026/">Empresas con mejor marca empleadora en Chile</a>', '<a href="/beneficios-outplacement-empresa-2026/">Beneficios del outplacement para la empresa</a>'
  ])
  h += otrosEstudios('marca')
  h += cta('Una desvinculación bien acompañada también construye marca empleadora. LabLab diseña programas de outplacement para empresas de todos los tamaños.')
  var schema = { '@context': 'https://schema.org', '@graph': [
    report('marca', { about: [{ '@type': 'Thing', name: 'Marca empleadora' }, { '@type': 'Thing', name: 'Outplacement' }], temporalCoverage: '2022/2025',
      citation: ['Ambler y Barrow (1996). The employer brand.', 'Backhaus y Tikoo (2004). Conceptualizing and researching employer branding.', 'Mosley (2015). CEOs Need to Pay Attention to Employer Branding.'] }),
    migas([['Inicio', '/'], ['Estudios', '/estudios/'], [E.marca.h1, url('marca')]]),
    faqSchema(faq)
  ] }
  return { e: E.marca, contenido: ESTILO + hero(MIGAS_BASE + 'Outplacement y marca empleadora', 'Estudio LabLab · ' + E.marca.fechaTxt, E.marca.h1,
    '¿Las empresas con mejor reputación como empleadoras contratan outplacement? Cruzamos 86 empresas de los tres principales rankings de Chile.') + cuerpo(h) + ld(schema) }
}

// ---------------------------------------------------------------- Índice
function paginaIndice() {
  var orden = ['cadem', 'desv', 'marca']
  var h = '<p>En LabLab investigamos el mercado de las transiciones laborales en Chile con datos propios, fuentes oficiales y estudios encargados a terceros. Aquí publicamos los resultados completos, con su metodología, para que empresas, equipos de personas y profesionales puedan usarlos en sus decisiones.</p>'
  h += '<div class="ll-cards">' + orden.map(function (k) {
    var e = E[k]
    return '<div class="ll-card"><h2>' + e.h1 + '</h2><div class="ll-meta">' + e.fuenteTxt + ' · ' + e.fechaTxt + '</div><p>' + e.tarjeta + '</p><a class="ll-boton" href="' + url(k) + '">Ver estudio</a></div>'
  }).join('') + '</div>'
  h += cta('Si estás preparando un proceso de desvinculación o una reorganización, conversemos sobre cómo acompañar a las personas que salen.')
  var schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': SITIO + '/estudios/#coleccion', name: 'Estudios LabLab', url: SITIO + '/estudios/', inLanguage: 'es-CL',
      description: 'Estudios de LabLab sobre outplacement, recolocación laboral, desvinculaciones y marca empleadora en Chile.', publisher: ORG_FULL,
      mainEntity: { '@type': 'ItemList', itemListElement: orden.map(function (k, i) { return { '@type': 'ListItem', position: i + 1, url: SITIO + url(k), name: E[k].h1 } }) } },
    migas([['Inicio', '/'], ['Estudios', '/estudios/']])
  ] }
  return { e: { slug: 'estudios', titulo: 'Estudios LabLab: outplacement y mercado laboral', h1: 'Estudios LabLab',
    meta: 'Estudios de LabLab sobre outplacement en Chile: impacto en la recolocación (Cadem), costo de las desvinculaciones judicializadas y marca empleadora.' },
    contenido: ESTILO + hero('<a href="/">Inicio</a> › Estudios', 'Investigación LabLab', 'Estudios LabLab', 'Datos sobre outplacement, recolocación laboral, desvinculaciones y marca empleadora en Chile.') + cuerpo(h) + ld(schema) }
}

module.exports = { indice: paginaIndice, cadem: paginaCadem, desv: paginaDesv, marca: paginaMarca, E: E }
