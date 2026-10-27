# Demostración UN-BREAK

La web y la extensión de Chrome son proyectos independientes. La extensión está
en `../Extension`; la web no instala ni detecta extensiones. Chrome Web Store
todavía no tiene una URL de publicación configurada, por lo que instalar permanece
deshabilitado y se ofrecen instrucciones para cargar la versión de pruebas.

## Flujo

El enlace abre `https://www.instagram.com/#un-break-demo` con `noopener noreferrer`.
El script de contenido de UN-BREAK reconoce y consume el fragmento exacto. Sin
la extensión instalada no se activa nada: la web explica qué comprobar.
La extensión muestra una confirmación dentro de Instagram. Solo al pulsar
«Activar demostración» solicita al service worker guardar el estado y recarga.
El indicador «Demo activa» se muestra tras recuperar un estado confirmado.

`background.js` valida la extensión emisora, la pestaña, el marco principal,
el origen HTTPS exacto de Instagram y los mensajes permitidos. No hay API externa,
permisos para todas las webs, servicio remoto ni lectura de credenciales. El único
permiso añadido es `storage`. `chrome.storage.session` conserva solo un booleano
por pestaña durante la sesión del navegador; no se expone a scripts de contenido.
Se borra al cerrar la pestaña o al salir de la demo. El fragmento es una solicitud,
no una prueba de instalación ni una autorización automática.

«Salir de la demo» borra el indicador y recarga Instagram: restaura estilos,
contenido y contadores mediante una página nueva. No desinstala la extensión.
La recarga puede descartar borradores sin enviar en Instagram.

## Umbrales

| Intervención | Normal | Demo |
| --- | --- | --- |
| Inicio de compresión (scroll acumulado) | 5 s | 0,6 s |
| Progresión de compresión | 4 s | 1,5 s |
| Racha de eventos de scroll rápido | 3 | 2 |
| Incremento con racha rápida | 250 ms | 400 ms |
| Saturación: espera / progresión | 2 s / 3 s | 0,5 s / 1 s |
| Deformación: espera / progresión | 5 s / 8 s | 1,2 s / 2,5 s |
| Desaparición: navegación activa / intervalo | 50 s / 2,5 s | 15 s / 2 s |

Se conservan las funciones de los tres efectos, sus límites y selectores. El
algoritmo original usa rachas de eventos de scroll como aproximación de rapidez.
La transformación ASCII adicional se conserva en modo normal y se omite en demo
para poder experimentar las tres intervenciones sin ocultar la interfaz.

## Archivos

- `Extension/manifest.json`: nombre UN-BREAK, versión 0.2.0, MV3, permiso storage,
  Chrome 102 o posterior y registro del worker; acceso solo a Instagram.
- `Extension/background.js`: indicador de demo por pestaña.
- `Extension/content.js`: inicio asíncrono, solicitud, controles y efectos originales
  con selección de tiempos normal/demo.
- `Extension/style.css`: estilos originales sin cambios.
- `tools/demo-bootstrap.js`, `tools/demo-background.js`: fuentes de integración.
- `tools/prepare-extension.cjs`: genera `.extension-preview` a partir de la extensión
  original 0.1.0. Es una migración de una sola aplicación, no debe ejecutarse de nuevo
  sobre la versión ya migrada.
- `tools/demo.test.cjs`: comprobaciones de mensajes, aislamiento y conservación
  del código original antes de aplicar la actualización.

## Verificación manual en Chrome

1. En `chrome://extensions`, cargar la carpeta `Extension` o pulsar Recargar si ya
   estaba instalada. Recargar también las pestañas de Instagram existentes.
2. Abrir la web y pulsar «PROBAR EN MI INSTAGRAM». Comprobar URL oficial y
   confirmación; «Ahora no» conserva el modo normal.
3. Activar: comprobar indicador, scroll rápido, permanencia sobre una publicación
   y desaparición a partir de 15 segundos de navegación activa.
4. Abrir otra pestaña de Instagram sin el enlace: debe permanecer en modo normal.
5. Salir: comprobar recarga y restauración. Recargar otra vez: no debe volver la demo.
6. Deshabilitar la extensión y probar el enlace: no debe aparecer confirmación ni
   ninguna afirmación de instalación desde la web.
7. Probar estando desconectado de Instagram: iniciar sesión allí; si el inicio de
   sesión pierde el fragmento, volver a pulsar el enlace de la web.

La sintaxis y el protocolo se pueden comprobar localmente. La apariencia real de
los efectos y los selectores depende del DOM de Instagram y debe comprobarse en
Chrome con una sesión real; no se ha realizado esa prueba desde este entorno.

Referencia: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
