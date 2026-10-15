// Diagnóstico de solo lectura (15 oct 2026): plugins, capacidades y estructura para corregir la auditoría.
var PROXY = process.env.PROXY_URL, SECRET = process.env.PROXY_SECRET
var AUTH = 'Basic ' + Buffer.from(process.env.LABLAB_WP_USER + ':' + process.env.LABLAB_WP_APP_PASSWORD).toString('base64')
async function wp(path) {
  var r = await fetch(PROXY + '/api/wp-proxy', { headers: { 'X-Proxy-Secret': SECRET, 'X-WP-Path': path, Authorization: AUTH } })
  var t = await r.text(); try { return { s: r.status, j: JSON.parse(t) } } catch (e) { return { s: r.status, j: t.slice(0, 300) } }
}
;(async function () {
  var pl = await wp('/wp-json/wp/v2/plugins?_fields=plugin,status')
  console.log('PLUGINS'); (pl.j || []).forEach(function (p) { console.log('  ', p.status, p.plugin) })
  var me = await wp('/wp-json/wp/v2/users/me?context=edit&_fields=roles,capabilities')
  var caps = me.j && me.j.capabilities || {}
  console.log('ROLES', JSON.stringify(me.j && me.j.roles), '| unfiltered_html', !!caps.unfiltered_html, '| install_plugins', !!caps.install_plugins)
  var types = await wp('/wp-json/wp/v2/types?_fields=slug,rest_base')
  console.log('TYPES', Object.keys(types.j || {}).join(', '))
  var home = await wp('/wp-json/wp/v2/pages/8?context=edit&_fields=content')
  var raw = home.j && home.j.content && home.j.content.raw || ''
  console.log('HOME raw chars', raw.length)
  console.log('HOME headings', (raw.match(/<h[1-3][^>]*>[\s\S]{0,80}?<\/h[1-3]>/gi) || []).slice(0, 8).join(' || '))
  console.log('HOME shortcodes con title', (raw.match(/\[(?:title|ux_text|section)[^\]]{0,120}\]/g) || []).slice(0, 6).join(' || '))
  var hf = await wp('/wp-json/')
  var ns = hf.j && hf.j.namespaces || []
  console.log('NAMESPACES', ns.join(', '))
})()
