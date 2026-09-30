# Auditoría SEO — LabLab (lablab.cl)
**Fecha:** 30 septiembre 2026 · **Anterior:** 12 agosto 2026
**Método:** rastreo en vivo del sitio (home + 17 URLs del sitemap + 68 posts vía API WordPress), PageSpeed Insights móvil, visibilidad Google + ChatGPT semana 21 sept (13 búsquedas).
**Datos crudos:** `myp-daily-agent/data/auditorias/lablab-2026-09-30.json`

## Resumen
El blog creció de 15 a 68 posts (35 en los últimos 30 días), pero **LabLab sigue sin aparecer en el top 10 de Google en ninguna de las 13 búsquedas**. En ChatGPT aparece solo en 1 (#4, "consultoras de transición laboral"). Hay dos causas principales:
1. **Canibalización.** El agente publicó el mismo tema varias veces con títulos distintos, y esas versiones compiten entre sí. El filtro de temas se corrigió hoy (commit d10801c).
2. **El sitio no tiene plugin SEO.** No hay meta descriptions, Open Graph ni schema en la home. Esto ya estaba pendiente el 12 de agosto.

## Hallazgos

### [ALTA] Temas duplicados en el blog (canibalización)
| Tema | Versiones | URLs |
|---|---|---|
| Mejores empresas de outplacement en Chile | 5 | /mejores-empresas-outplacement-chile/, -2026/, -2026-2/, -2026-3/, /ranking-empresas-outplacement-chile/ |
| Preparación entrevista de trabajo | 4 (+1 de 493 palabras) | /preparacion-entrevista-trabajo-2026/, -20260817/, -20260903/, -20260924/, /preguntas-entrevista-trabajo-2026/ |
| Liderazgo en crisis | 4 | /liderazgo-crisis-chile-2026/, /liderazgo-crisis-retener-talento-2026/, /liderazgo-crisis-chile-20260918/, /liderazgo-crisis-2026/ |
| Retiro activo | 4 | /retiro-activo-jubilacion-2026/, -20260922/, /programas-retiro-activo-chile/, /retiro-activo-chile-ranking-2026/ |
| Encuesta de salida | 5 | /encuesta-salida-guia-2026/, /encuesta-salida-chile-2026/, -20260915/, /encuesta-salida-chile-20260831/, /encuesta-salida-2026/ |
| Desvincular empleados | 3 | /desvincular-empleados-chile-2026/, -20260909/, -20260918/ |
| Marca empleadora y desvinculación | 3 | /marca-empleadora-desvinculacion-2026/, /marca-empleadora-despido-2026/, -20260916/ |
| Coaching ejecutivo (ranking) | 2 | /mejores-programas-coaching-ejecutivo-chile/, -2026/ |
| Outplacement precio, individual, retiro activo programa, negociar sueldo, portales de empleo, transición a los 40, recolocación, ranking consultoras, marca empleadora top 10, herramientas IA | 2 c/u | ver JSON |

**Arreglo:** dejar una sola URL por tema (la más completa), redirigir con 301 las demás hacia ella y fusionar el contenido que aporte. En total son unas 25 URLs para redirigir. Hace falta un plugin de redirecciones o Rank Math.

### [ALTA] Sin plugin SEO: faltan metas y datos estructurados
- **Meta description:** falta en la home y en los 16 posts revisados. Google escribe su propio snippet.
- **Open Graph:** 0 de 17 páginas tienen og:image u og:title, así que al compartir en LinkedIn o WhatsApp sale sin imagen.
- **Schema de la home:** no tiene Organization ni ProfessionalService. Los posts solo traen el FAQPage que inyecta el agente.
- **Title de la home:** tiene 142 caracteres, repite "LabLab" y Google lo corta.
  - Propuesta: `Outplacement y transición laboral en Chile | LabLab` (52).
- **Arreglo:** instalar Rank Math, que resuelve metas, OG, schema, sitemap y redirecciones en un solo plugin.

### [ALTA] Home sin H1
La home no tiene ningún H1 y tiene 1.963 palabras. Hay que agregar un H1 con la keyword principal: "Outplacement y transición laboral para empresas en Chile".

### [MEDIA] Velocidad móvil (PageSpeed)
| Página | Performance | LCP (lab) | TBT | Usuarios reales (LCP) |
|---|---|---|---|---|
| Home | 44/100 | 32,6 s | 490 ms | Promedio |
| Post | 35/100 | 7,4 s | 1.520 ms | Promedio (INP rápido) |

- Causas: CSS sin usar (≈1,7 s) y JavaScript sin usar (≈3,3 s en la home).
- Arreglo: agregar un plugin de caché y optimización (LiteSpeed Cache o WP Rocket, según el hosting) con "remove unused CSS" y "delay JS".

### [MEDIA] Imágenes sin alt
- 414 de 499 imágenes revisadas no tienen alt. En la home son 281 de 286, casi todos logos de clientes.
- 52 de 68 posts no tienen imagen destacada, porque el agente las desactivó. Eso afecta a OG y Discover.

### [MEDIA] robots.txt no existe (404)
Hay que crearlo con `Sitemap: https://www.lablab.cl/wp-sitemap.xml`. No bloquea nada, pero el sitemap no está declarado.
- El sitemap funciona: 117 URLs, núcleo de WordPress.
- No hay bots de IA bloqueados.
- No hay llms.txt.

### [BAJA] Contenido antiguo y delgado
- `/tendencias-en-ofertas-laboralesseptiembre-2022/`: 221 palabras, de 2022 y sin meta. Conviene redirigirlo al blog.
- Hay 5 posts de agosto con menos de 600 palabras (indemnización, marca empleadora, recolocación, preguntas entrevista, coaching). Casi todos tienen una versión más larga, así que se resuelven con la consolidación.

## Visibilidad (semana 21 sept)
| Búsqueda | Google | ChatGPT | Quién aparece |
|---|---|---|---|
| outplacement Chile | — | — | DNA Outplacement, Empodera, ERGO Solutions, GoFocus |
| empresas de outplacement en Chile | — | — | DNA, Empodera, ERGO, Executive Outplacement |
| programa de outplacement para empresas | — | — | Empodera, ERGO, GoFocus, LHH |
| outplacement ejecutivo Santiago | — | — | AFINIS, Empodera, ERGO |
| consultoras de transición laboral | — | **#4** | Cristoffanini, Empodera, HR Insight |
| otras 8 (liderazgo, entrevista, retiro activo, recolocación, desvincular…) | — | — | — |

Empodera y ERGO Solutions aparecen en casi todas: son el benchmark a estudiar.

## Qué pasó desde la auditoría del 12 agosto
- ✅ Blog diario: 53 posts nuevos.
- ✅ Filtro de temas del agente corregido (30 sept) y 20 temas nuevos sin repetir.
- ❌ Rank Math: sigue sin instalarse (pendiente del cliente o autorización).
- ❌ Google Search Console: sigue sin acceso.

## Plan priorizado
1. **Instalar Rank Math** y configurar metas, OG, schema Organization y el title de la home. *Requiere autorización del cliente para instalar plugins.* Tenemos usuario admin por API.
2. **Consolidar duplicados:** 1 URL por tema y 301 para el resto, unas 25 redirecciones.
3. **Agregar el H1 a la home.**
4. **Crear robots.txt** con el sitemap.
5. **Optimizar velocidad** con un plugin de caché.
6. Pedir **acceso a Search Console** para medir impresiones reales.
7. Agregar alt a los logos de la home.
