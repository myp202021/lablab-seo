# Portada LabLab más liviana — 16 nov 2026 (M&P)
- Antes: ~22,9 MB (PNG de hasta 7,5 MB). Después: ~3,8 MB de imágenes con la página completa recorrida (Chrome).
- Qué se hizo: 100 de las 102 imágenes pesadas de la portada se subieron como WebP (mismas dimensiones, calidad 80,
  mismo texto alternativo) y en la página «inicio» (ID 8, UX Builder de Flatsome) se cambió el ID de cada imagen
  por el de su WebP (101 reemplazos en atributos id/bg/img/ids). Diseño sin cambios; formularios: 37 antes y después.
- Sin mejora: ID 310 (el WebP pesaba más). No subió: ID 5874 (98.png, el firewall respondió 403).
- Respaldo del contenido original: pagina-inicio-8.json (content.raw). Mapa viejo→nuevo: mapa-ids.json.
- REVERTIR: POST /wp-json/wp/v2/pages/8 con {"content": <content.raw de pagina-inicio-8.json>}. Las imágenes originales siguen en la biblioteca.
- Pendiente: meta description de la portada. El sitio no tiene plugin SEO y la API no deja instalar plugins
  ("fs_unavailable"); se puede poner desde wp-admin con Header Footer Code Manager (ya activo) o instalando un plugin SEO con acceso al hosting.
  Texto propuesto: "Consultora de transición laboral en Chile: outplacement personalizado y masivo, retiro activo y apoyo en reestructuraciones, con consultores senior e IA."
