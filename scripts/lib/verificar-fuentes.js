// M&P 12 nov 2026 — Verificador de fuentes, regla para TODOS los agentes de blog y ranking.
// Antes de publicar, revisa cada enlace http(s) del artículo:
//   - responde 2xx/3xx  → queda;
//   - 404/410/5xx, dominio que no existe o no responde → se quita el enlace y queda solo el texto (no se publica un link roto);
//   - 401/403/405/429 → queda (el sitio existe pero bloquea robots; no es un enlace roto).
// Si más de la mitad de los enlaces externos están rotos, se avisa en el log (el modelo inventó fuentes).
// Mismo archivo copiado en cada repo de agentes (devuelvemipie-seo, lablab-seo, tritec-seo, wiseplan-seo,
// wiseplan-peru-seo, halterlift-panel). Si se cambia, cambiarlo en todos.
var TIMEOUT_MS = 10000;
var MAX_ENLACES = 60;
var PARALELO = 6;
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
var BLOQUEA_ROBOTS = [401, 403, 405, 406, 429, 999];

async function pedir(url, metodo) {
  var ctl = new AbortController();
  var t = setTimeout(function () { ctl.abort(); }, TIMEOUT_MS);
  try {
    var r = await fetch(url, { method: metodo, redirect: "follow", signal: ctl.signal, headers: { "user-agent": UA, accept: "text/html,*/*" } });
    try { if (r.body && r.body.cancel) await r.body.cancel(); } catch (e) {}
    return r.status;
  } finally {
    clearTimeout(t);
  }
}

// Devuelve { ok, estado } para una URL. Se prueba HEAD y, si falla o no es concluyente, GET.
async function revisarUrl(url) {
  var estado = 0;
  for (var intento = 0; intento < 2; intento++) {
    try {
      estado = await pedir(url, intento === 0 ? "HEAD" : "GET");
      if (estado < 400 || BLOQUEA_ROBOTS.indexOf(estado) >= 0) return { ok: true, estado: estado };
    } catch (e) {
      estado = 0;
    }
  }
  return { ok: false, estado: estado };
}

function enlaces(html) {
  var out = [];
  var re = /<a\b[^>]*\bhref\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*>/gi;
  var m;
  while ((m = re.exec(String(html || "")))) {
    var u = m[1].replace(/&amp;/g, "&");
    if (out.indexOf(u) < 0) out.push(u);
  }
  return out;
}

function quitarEnlace(html, url) {
  var esc = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/&/g, "(?:&|&amp;)");
  var re = new RegExp("<a\\b[^>]*\\bhref\\s*=\\s*[\"']" + esc + "[\"'][^>]*>([\\s\\S]*?)<\\/a>", "gi");
  return html.replace(re, "$1");
}

// opciones.dominioPropio: enlaces a este dominio no cuentan como "fuentes externas" en el aviso (igual se revisan).
async function verificarFuentes(html, opciones) {
  opciones = opciones || {};
  var lista = enlaces(html).slice(0, MAX_ENLACES);
  var resultados = [];
  for (var i = 0; i < lista.length; i += PARALELO) {
    var lote = lista.slice(i, i + PARALELO);
    var r = await Promise.all(lote.map(revisarUrl));
    lote.forEach(function (u, j) { resultados.push({ url: u, ok: r[j].ok, estado: r[j].estado }); });
  }
  var rotos = resultados.filter(function (x) { return !x.ok; });
  var limpio = String(html || "");
  rotos.forEach(function (x) { limpio = quitarEnlace(limpio, x.url); });
  var propio = opciones.dominioPropio ? String(opciones.dominioPropio).replace(/^www\./, "") : null;
  var externos = resultados.filter(function (x) { return !propio || x.url.indexOf(propio) < 0; });
  var externosRotos = externos.filter(function (x) { return !x.ok; });
  console.log("Verificador de fuentes: " + resultados.length + " enlaces revisados, " + rotos.length + " rotos quitados");
  rotos.forEach(function (x) { console.log("  roto (" + (x.estado || "sin respuesta") + "): " + x.url); });
  if (externos.length >= 4 && externosRotos.length * 2 > externos.length) {
    console.log("  AVISO: más de la mitad de las fuentes externas no existen; revisar el artículo.");
  }
  return { html: limpio, revisados: resultados.length, rotos: rotos };
}

module.exports = { verificarFuentes: verificarFuentes, revisarUrl: revisarUrl, enlaces: enlaces, quitarEnlace: quitarEnlace };
