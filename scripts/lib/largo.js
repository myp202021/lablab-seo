// M&P 19 oct 2026 — regla para TODOS los agentes de blog: ningún artículo se publica con menos de 3.000 palabras.
// Si el modelo entrega menos (o se trunca), se escribe POR SECCIONES y se une:
//   1) cada sección <h2> corta se amplía en su propia llamada (llamadas chicas, no se truncan), con las mismas etiquetas y estilos;
//   2) si aún falta, se arma un esquema de secciones nuevas y se escribe cada una por separado;
//   3) palabras() se usa como freno final antes de publicar.
// Mismo archivo copiado en cada repo de agentes (landing-mp-myp, devuelvemipie-seo, distec-seo, lablab-seo, tritec-seo,
// wiseplan-seo, wiseplan-peru-seo, halterlift-panel). Si se cambia, cambiarlo en todos.
var https = require("https");

var MINIMO = 3000;

function palabras(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(function (w) {
      return /[a-z0-9áéíóúñü]/i.test(w);
    }).length;
}

function openai(apiKey, modelo, messages, maxTokens) {
  var body = JSON.stringify({
    model: modelo,
    messages: messages,
    max_tokens: maxTokens,
    temperature: 0.6,
  });
  return new Promise(function (resolve, reject) {
    var req = https.request(
      {
        hostname: "api.openai.com",
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      function (res) {
        var d = "";
        res.on("data", function (c) {
          d += c;
        });
        res.on("end", function () {
          try {
            var j = JSON.parse(d);
            if (!j.choices)
              return reject(new Error("OpenAI: " + d.slice(0, 300)));
            resolve(
              j.choices[0].message.content
                .trim()
                .replace(/^```(html|json)?\n?/i, "")
                .replace(/\n?```$/i, "")
                .trim(),
            );
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(240000, function () {
      req.destroy(new Error("OpenAI timeout"));
    });
    req.write(body);
    req.end();
  });
}

function apertura(html, tag) {
  var m = String(html).match(new RegExp("<" + tag + "(\\s[^>]*)?>", "i"));
  return m ? m[0] : "<" + tag + ">";
}

// opciones: { tema, sistema (reglas del cliente), apiKey, modelo, minimo, log }
async function asegurarLargo(html, opciones) {
  var o = opciones || {};
  var apiKey = o.apiKey || process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  var modelo = o.modelo || "gpt-4.1";
  var minimo = o.minimo || MINIMO;
  var log = o.log || console.log;
  var sistema = {
    role: "system",
    content:
      (o.sistema ? o.sistema + "\n\n" : "") +
      "Escribes en español de Chile (o del país del cliente, si las reglas lo dicen), con todas las tildes. NUNCA inventas cifras, precios, estadísticas, nombres, clientes ni casos: amplías con explicación, criterios, pasos, ejemplos de operación y errores comunes.",
  };
  var n = palabras(html);
  if (n >= minimo) return html;
  log(
    "Largo: " +
      n +
      " palabras (mínimo " +
      minimo +
      "). Se amplía por secciones.",
  );

  // 1) Ampliar cada sección <h2> por separado (no se tocan las que traen <script>, p. ej. JSON-LD de FAQ)
  var partes = String(html).split(/(?=<h2[\s>])/i);
  var conH2 =
    partes.filter(function (p) {
      return /^<h2/i.test(p) && !/<script/i.test(p);
    }).length || 1;
  var objetivo = Math.min(
    650,
    Math.max(320, Math.ceil((minimo * 1.12) / conH2)),
  );
  for (var i = 0; i < partes.length; i++) {
    var p = partes[i];
    if (/<script/i.test(p) || palabras(p) >= objetivo) continue;
    var meta = /^<h2/i.test(p) ? objetivo : Math.min(250, objetivo);
    try {
      var nueva = await openai(
        apiKey,
        modelo,
        [
          sistema,
          {
            role: "user",
            content:
              "Esta es una sección de un artículo de blog sobre: " +
              o.tema +
              ".\nAmplíala a unas " +
              meta +
              " palabras. Mantén su título y TODAS sus etiquetas con los mismos atributos (style, class), y deja tablas, listas, enlaces y datos tal cual (no cambies cifras). Agrega párrafos y, si sirve, <h3> o listas con el mismo formato. Devuelve SOLO el HTML de la sección.\n\nSECCIÓN:\n" +
              p,
          },
        ],
        4000,
      );
      if (palabras(nueva) > palabras(p)) partes[i] = nueva + "\n";
    } catch (e) {
      log("No se pudo ampliar la sección " + i + ": " + e.message);
    }
  }
  html = partes.join("");
  n = palabras(html);
  log("Tras ampliar secciones: " + n + " palabras");

  // 2) Si aún falta: secciones nuevas, escritas una por una, antes de FAQ/conclusión
  for (var ronda = 0; ronda < 2 && n < minimo; ronda++) {
    var titulos = (html.match(/<h2[^>]*>[\s\S]*?<\/h2>/gi) || []).map(
      function (h) {
        return h.replace(/<[^>]+>/g, "").trim();
      },
    );
    var faltan = Math.max(2, Math.ceil((minimo - n) / 420) + 1);
    var esquema;
    try {
      esquema =
        JSON.parse(
          await openai(
            apiKey,
            modelo,
            [
              sistema,
              {
                role: "user",
                content:
                  "Artículo sobre: " +
                  o.tema +
                  ". Ya tiene estas secciones: " +
                  JSON.stringify(titulos) +
                  ".\nPropón " +
                  faltan +
                  ' secciones NUEVAS útiles para el lector (sin repetir las existentes ni FAQ/conclusión), cada una con 3 a 5 puntos a cubrir. Responde SOLO JSON: {"secciones":[{"h2":"...","puntos":["..."]}]}',
              },
            ],
            1500,
          ),
        ).secciones || [];
    } catch (e) {
      log("No se pudo armar el esquema: " + e.message);
      break;
    }
    var h2 = apertura(html, "h2"),
      pp = apertura(html, "p"),
      h3 = apertura(html, "h3"),
      ul = apertura(html, "ul"),
      li = apertura(html, "li");
    var nuevas = "";
    for (var k = 0; k < esquema.length; k++) {
      try {
        nuevas +=
          (await openai(
            apiKey,
            modelo,
            [
              sistema,
              {
                role: "user",
                content:
                  "Artículo sobre: " +
                  o.tema +
                  '. Escribe la sección "' +
                  esquema[k].h2 +
                  '" (unas 450 palabras) cubriendo: ' +
                  (esquema[k].puntos || []).join("; ") +
                  ".\nUsa EXACTAMENTE estas etiquetas de apertura: título " +
                  h2 +
                  "…</h2>, párrafos " +
                  pp +
                  "…</p>, subtítulos " +
                  h3 +
                  "…</h3>, listas " +
                  ul +
                  " con " +
                  li +
                  ". Devuelve SOLO el HTML de la sección.",
              },
            ],
            3000,
          )) + "\n";
      } catch (e) {
        log('No se pudo escribir "' + esquema[k].h2 + '": ' + e.message);
      }
    }
    var corte = html.search(
      /<h2[^>]*>(?:(?!<\/h2>)[\s\S])*(preguntas frecuentes|conclusi|en resumen|para cerrar)/i,
    );
    html =
      corte > 0
        ? html.slice(0, corte) + nuevas + html.slice(corte)
        : html + nuevas;
    n = palabras(html);
    log("Tras secciones nuevas: " + n + " palabras");
  }
  return html;
}

function exigirLargo(html, minimo) {
  var n = palabras(html);
  console.log("Largo del artículo: " + n + " palabras");
  if (n < (minimo || MINIMO))
    throw new Error(
      "Artículo de " +
        n +
        " palabras: el mínimo es " +
        (minimo || MINIMO) +
        ". No se publica.",
    );
  return n;
}

module.exports = { asegurarLargo, exigirLargo, palabras, MINIMO };
