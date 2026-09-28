// correo.js — envía por Gmail los correos que los scripts mandaban a Resend.
// Cargar en la PRIMERA línea del script: require('./lib/correo')
//
// Por qué: Resend está copado y los correos desde el propio dominio vía Resend caían en spam.
// Cómo: intercepta fetch (global y node-fetch) hacia api.resend.com/emails y envía con Gmail
// (cuenta christopher@mulleryperez.cl, contraseña de aplicación en los secretos GMAIL_USER / GMAIL_APP_PASSWORD).
//
// Modos (variable CORREO_MODO):
//   gmail  (por defecto) → Gmail; si Gmail falla, cae a Resend. Ningún correo se pierde.
//   ambos               → Resend como siempre Y además Gmail (Hualpén, hasta que Christopher confirme que llegan los dos).
// Sin credenciales de Gmail, todo sigue por Resend sin cambios.

var GMAIL_USER = process.env.GMAIL_USER
var GMAIL_PASS = process.env.GMAIL_APP_PASSWORD
var MODO = process.env.CORREO_MODO || 'gmail'
var transporte = null

function gmail() {
  if (!transporte) {
    var nodemailer = require('nodemailer')
    transporte = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_PASS } })
  }
  return transporte
}

// Payload de Resend → mensaje de Gmail
function aMensaje(p) {
  var nombre = String(p.from || '').replace(/<.*>/, '').trim().replace(/^"|"$/g, '') || 'Muller y Pérez'
  var lista = function (x) { return x ? (Array.isArray(x) ? x.join(', ') : x) : undefined }
  return {
    from: '"' + nombre + '" <' + GMAIL_USER + '>',
    to: lista(p.to),
    cc: lista(p.cc),
    bcc: lista(p.bcc),
    replyTo: lista(p.reply_to || p.replyTo),
    subject: p.subject,
    html: p.html,
    text: p.text,
    attachments: (p.attachments || []).map(function (a) {
      return { filename: a.filename, content: a.content ? Buffer.from(a.content, 'base64') : undefined, path: a.path }
    }),
  }
}

async function enviarGmail(p) {
  var info = await gmail().sendMail(aMensaje(p))
  console.log('   Correo (Gmail) enviado: ' + p.subject)
  return info
}

function respuesta(obj) {
  return {
    ok: true,
    status: 200,
    json: async function () { return obj },
    text: async function () { return JSON.stringify(obj) },
  }
}

function envolver(fetchOriginal) {
  if (!fetchOriginal || fetchOriginal.__correoGmail) return fetchOriginal
  var envuelto = async function (url, opts) {
    var u = String(url && url.url ? url.url : url)
    if (!GMAIL_USER || !GMAIL_PASS || !/api\.resend\.com\/emails/.test(u) || !opts || !opts.body) return fetchOriginal(url, opts)
    var cuerpo
    try { cuerpo = JSON.parse(opts.body) } catch (e) { return fetchOriginal(url, opts) }
    var lote = /\/emails\/batch/.test(u) && Array.isArray(cuerpo)

    if (MODO === 'ambos') {
      var r = await fetchOriginal(url, opts)
      try { for (var p of lote ? cuerpo : [cuerpo]) await enviarGmail(p) } catch (e) { console.error('   Gmail falló (Resend sí envió): ' + e.message) }
      return r
    }
    try {
      var ids = []
      for (var q of lote ? cuerpo : [cuerpo]) ids.push('gmail:' + (await enviarGmail(q)).messageId)
      return respuesta(lote ? { data: ids.map(function (id) { return { id: id } }) } : { id: ids[0] })
    } catch (e) {
      console.error('   Gmail falló, se envía por Resend: ' + e.message)
      return fetchOriginal(url, opts)
    }
  }
  envuelto.__correoGmail = true
  return envuelto
}

if (typeof globalThis.fetch === 'function') globalThis.fetch = envolver(globalThis.fetch)
try {
  var ruta = require.resolve('node-fetch')
  var nf = require('node-fetch')
  var nfEnvuelto = envolver(nf)
  Object.keys(nf).forEach(function (k) { nfEnvuelto[k] = nf[k] })
  nfEnvuelto.default = nfEnvuelto
  require.cache[ruta].exports = nfEnvuelto
} catch (e) { /* sin node-fetch instalado: basta con el fetch global */ }

module.exports = { enviarGmail: enviarGmail }
