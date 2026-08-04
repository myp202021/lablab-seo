// Proxy WP REST API — bypass hosting WAF que bloquea IPs de GitHub Actions
// Las llamadas llegan de GH Actions → Vercel → WordPress (IPs de Vercel no bloqueadas)

async function handler(req, res) {
  if (req.headers['x-proxy-secret'] !== process.env.PROXY_SECRET) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  var wpPath = req.headers['x-wp-path']
  if (!wpPath) return res.status(400).json({ error: 'x-wp-path header required' })

  var wpUrl = 'https://www.lablab.cl' + wpPath

  var headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'application/json, */*',
    'Accept-Language': 'es-CL,es;q=0.9'
  }
  if (req.headers.authorization) headers['Authorization'] = req.headers.authorization
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type']
  if (req.headers['content-disposition']) headers['Content-Disposition'] = req.headers['content-disposition']

  // Leer body raw (necesario para uploads binarios de imágenes)
  var body = null
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    var chunks = []
    await new Promise(function(resolve, reject) {
      req.on('data', function(c) { chunks.push(c) })
      req.on('end', resolve)
      req.on('error', reject)
    })
    if (chunks.length) body = Buffer.concat(chunks)
  }

  try {
    var response = await fetch(wpUrl, {
      method: req.method,
      headers: headers,
      body: body
    })

    var respBuffer = Buffer.from(await response.arrayBuffer())
    var ct = response.headers.get('content-type')
    if (ct) res.setHeader('Content-Type', ct)
    return res.status(response.status).send(respBuffer)
  } catch(e) {
    return res.status(502).json({ error: e.message })
  }
}

module.exports = handler
module.exports.config = { api: { bodyParser: false } }
