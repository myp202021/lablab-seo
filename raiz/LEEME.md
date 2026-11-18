# Archivos para la raíz de www.lablab.cl (18 nov 2026)

Subir estos 3 archivos a la carpeta pública del sitio (la misma donde está wp-config.php / index.php):

- robots.txt
- llms.txt
- 434d50eeb044c41d60e514bf9243b624.txt (clave de IndexNow: sin ella Bing/Copilot rechaza los avisos de artículos nuevos)

Por qué no se pudo desde WordPress: nginx responde él mismo cualquier `*.txt` (404 de 153 bytes) sin pasar la
petición a WordPress, así que ni el robots virtual de WP (`/?robots=1` sí funciona) ni un snippet PHP lo pueden servir.
Y el hosting no deja escribir archivos desde WP (fs_unavailable; pide FTP).

Vías (cualquiera):
1. FTP/SFTP: host server-pgge.lablab.cl, usuario wp-lablab (falta la contraseña: Gustavo Padilla, CTO LabLab).
2. Que el hosting suba los 3 archivos.
3. Que el hosting agregue en nginx: `location ~ ^/(robots|llms)\.txt$ { try_files $uri /index.php?$args; }`
   (sirve el robots virtual de WP; llms.txt igual necesitaría el archivo).

Verificar después: `curl -I https://www.lablab.cl/robots.txt` y `/llms.txt` → 200.
