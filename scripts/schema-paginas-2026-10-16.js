// Schema JSON-LD en las páginas que no tienen (auditoría 16 oct 2026). Es un <script> invisible al final del contenido:
// sin cambio visual. Solo datos que ya están publicados en el sitio (nombre, URL, logo, teléfono, correo y redes del pie).
// MODO=respaldo | MODO=aplicar
var fs = require('fs')
var L = require('./lib/wp-proxy')
var SITIO = 'https://www.lablab.cl'
var ORG = {
  '@type': 'Organization', '@id': SITIO + '/#organizacion', name: 'LabLab', url: SITIO + '/',
  logo: SITIO + '/wp-content/uploads/2024/03/Logo_3-1-1.png',
  description: 'Outplacement y transición laboral en Chile.',
  email: 'contacto@lablab.cl', telephone: '+56 2 2712 1638',
  sameAs: ['https://www.linkedin.com/company/lablab-outplacement/', 'https://www.instagram.com/lablabchile/', 'https://www.facebook.com/lablabchile']
}
var ORG_REF = { '@id': SITIO + '/#organizacion' }
var SCHEMAS = {
  page: {
    8: { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebSite', '@id': SITIO + '/#web', url: SITIO + '/', name: 'LabLab', inLanguage: 'es-CL', publisher: ORG_REF }] },
    96: { '@context': 'https://schema.org', '@type': 'Service', name: 'Servicios de outplacement y transición laboral para empresas', serviceType: 'Outplacement', url: SITIO + '/servicios-para-empresas/', areaServed: { '@type': 'Country', name: 'Chile' }, provider: ORG },
    119: { '@context': 'https://schema.org', '@type': 'Service', name: 'Outplacement y recolocación laboral para personas', serviceType: 'Outplacement', url: SITIO + '/servicios-para-personas/', areaServed: { '@type': 'Country', name: 'Chile' }, provider: ORG },
    179: { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'Nosotros', url: SITIO + '/nosotros/', inLanguage: 'es-CL', about: ORG },
    1256: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Políticas de privacidad y uso de datos', url: SITIO + '/politicas-de-privacidad-y-uso-de-datos/', inLanguage: 'es-CL', publisher: ORG }
  },
  post: {
    468: null // se arma con los datos del propio post (título y fechas de WordPress)
  }
}
;(async function () {
  var MODO = process.env.MODO || 'respaldo'
  var respaldo = []
  for (var tipo of ['page', 'post']) {
    for (var id in SCHEMAS[tipo]) {
      var base = '/wp-json/wp/v2/' + (tipo === 'page' ? 'pages' : 'posts') + '/' + id
      var r = await L.wp(base + '?context=edit&_fields=id,slug,status,title,content,date,modified,link')
      if (r.s !== 200) { console.log('✗ no se pudo leer', tipo, id, r.s); continue }
      var raw = r.j.content.raw || ''
      respaldo.push({ tipo: tipo, id: +id, slug: r.j.slug, content: raw })
      var s = SCHEMAS[tipo][id] || { '@context': 'https://schema.org', '@type': 'Article', headline: r.j.title.raw, url: r.j.link,
        datePublished: r.j.date, dateModified: r.j.modified, inLanguage: 'es-CL', author: ORG, publisher: ORG, mainEntityOfPage: r.j.link }
      var yaTiene = /application\/ld\+json/.test(raw)
      console.log(tipo, id, r.j.slug, r.j.status, yaTiene ? '(ya tiene schema, no se toca)' : '→ agrega ' + (s['@type'] || 'Organization+WebSite'))
      if (MODO !== 'aplicar' || yaTiene || r.j.status !== 'publish') continue
      var nuevo = raw.replace(/\s*$/, '') + '\n<script type="application/ld+json">' + JSON.stringify(s) + '</script>'
      var u = await L.wp(base, { content: nuevo })
      console.log('   guardado', u.s)
    }
  }
  fs.writeFileSync('respaldo-schema-paginas.json', JSON.stringify(respaldo, null, 1))
})()
