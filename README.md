# Pliego · modos de lectura, publicidad y cuotas sobre SYX

Portada y artículo de un diario generalista ficticio con cinco modos de lectura,
cada uno con claro y oscuro. El HTML es el mismo en todos los modos: el modo vive
en `<html data-lectura="…">` y la apariencia en `<html data-theme="…">`, la misma
convención que usa SYX para el tema oscuro.

## Estructura

```
index.html              portada
articulo.html           artículo (NewsArticle en JSON-LD)
css/pliego.css         contrato de lectura (tokens --pliego-*) y maqueta, mobile first
css/lectura/diario.css  modo por defecto
css/lectura/facil.css   lectura fácil
css/lectura/reportaje.css
css/lectura/edicion.css premium
css/lectura/expres.css  escaneo rápido
css/lectura/contexto.css antecedentes antes de la historia
css/lectura/escucha.css lectura en voz alta (solo Mecenas)
css/pliego-adaptaciones.css impresión, más contraste y ahorro de datos
css/pliego-publicidad.css  mapa de publicidad y escalera de cuotas
css/pliego-planes.css   página de cuotas
css/pliego-acabados.css acabados por cuota
css/pliego-demo.css     barra de demostración (cuota, modo, tema, mapa)
suscripcion.html        cuotas, comparativa de formatos y compromisos
img/pub/                creatividades de anunciantes ficticios
auditoria/             auditoría de detalle (ver AUDITORIA.md)
js/pliego-lectura.js   escribe data-lectura / data-theme, progreso de lectura, acciones
syx/                    tema example-01 compilado y fuentes de SYX v5.0.0
img/                    ilustraciones generadas para la demo
```

## Cómo funciona

1. **SYX pone el vocabulario.** Botones, etiquetas, radios, migas, barra de
   progreso, tabla, cifras, avatares y desplegables son `atom-*` y `mol-*` sin
   tocar. La app no repinta ninguna clase de SYX (`syx-scan`: 0 hallazgos altos o
   medios).
2. **`pliego.css` define el contrato.** Un centenar de tokens `--pliego-*` que leen
   `--semantic-*`: papeles y tintas, familias, escala, medida, imagen, rejillas
   con áreas con nombre, líneas con nombre del artículo y palancas de visibilidad.
   Ninguna regla lleva un color ni una familia escritos a mano.
3. **Cada modo reescribe dos capas y nada más.**
   - `--semantic-*`: paleta, familias y radios. Así cambian también los átomos
     de SYX (un botón, una etiqueta o la barra de progreso adoptan el modo sin
     una línea de CSS propia).
   - `--pliego-*`: medida, rejilla, proporción y filtro de imagen, qué se ve.
   - Unas pocas reglas estructurales, siempre en `@layer syx.app`.
4. **Oscuro sin duplicar.** Cada color de modo se declara una vez con
   `light-dark(claro, oscuro)`. SYX ya fija `color-scheme` en sus tres estados
   (sistema, `data-theme="light"`, `data-theme="dark"`), así que el mismo token
   resuelve bien en los tres. Solo lo que no es color (el filtro de imagen de
   Edición) repite el patrón de tres bloques.

## Mínimos de marca

Para que los modos no parezcan periódicos distintos, todos comparten:

- **Tres constantes de color** en `css/pliego.css`, en claro y en oscuro:
  papel, tinta y lacre. Toda la paleta semántica de SYX se deriva de ellas con
  color relativo (`oklch(from var(--pliego-lacre-claro) …)`). Un modo solo
  puede desplazar luminosidad o croma unas décimas; el «rotulador» de Exprés y
  el «oro» de Mecenas salen del lacre, no son colores nuevos.
- **Una sola familia: Roboto Serif.** Cuatro ejes (anchura 50–150, tamaño
  óptico 8–144, peso 100–900, grado −50–100) más cursiva. Cada rol (titular,
  texto, interfaz, dato, cabecera) tiene su voz con tokens `--pliego-<rol>-ancho`
  y `--pliego-<rol>-ejes`; SYX la hereda en botones, etiquetas y formularios.
- **El eje de grado compensa el modo oscuro**: −35 en oscuro, para que la tinta
  clara no engorde y el texto no se recoloque al cambiar de tema.
- **La cabecera «Pliego»** se compone igual en todos los modos.

## Los modos

| Modo | Color sobre los mínimos | Voz de Roboto Serif |
|---|---|---|
| Diario | tal cual | titular 640 / anchura 92 %, texto neutro |
| Fácil | tinta más negra, lacre más oscuro (AAA), pizarra en oscuro | todo más ancho (104–106 %), grado +25, tamaño óptico 14 |
| Reportaje | papel de cine en oscuro | titular 300 en tamaño óptico 144 |
| Edición | papel con más cuerpo, tinta más azul | titular 420 / anchura 72 % / óptico 144, mayúscula espaciada |
| Exprés | papel sin temperatura, rotulador del lacre | titular 700 / anchura 60 %, texto 82 % |
| Contexto | bloques de contexto sobre el tono suave del lacre | titular 560 / anchura 96 % |
| Escucha (Mecenas) | acento en el oro de Mecenas | texto 1,31 rem, óptico 18, interlineado 1,7 |

**Contexto** pasa cuerpo y capítulos a `display: contents` para que claves,
cronología, datos, desplegables y notas suban al principio con `order`; abre
los desplegables, escribe las siglas enteras y marca los `<dfn>`.

**Escucha** solo se aplica con `data-cuota="mecenas"`. En otra cuota se ve la
edición Diario con una tarjeta de desbloqueo. El reproductor usa la síntesis de
voz del navegador (`speechSynthesis`, voz es-ES), lee titular, entradilla,
capítulos, párrafos y citas, ilumina el párrafo que suena y atenúa el resto,
salta por capítulos, cambia de velocidad y se integra con los controles del
sistema (Media Session). Las duraciones se calculan en el peor caso, a 140
palabras por minuto. La portada se convierte en una lista de escucha.

## Adaptaciones automáticas

Sin botón, las pide el sistema del lector: `@media print` (solo el artículo,
desplegables abiertos, sin publicidad ni controles), `prefers-contrast: more`
(tinta y filetes reforzados, grado +40, enlaces subrayados) y
`prefers-reduced-data` (sin ilustraciones ni creatividades).

## Acabados por cuota (`css/pliego-acabados.css`)

`--pliego-nivel` (0 Abierto · 1 Lector · 2 Habitual · 3 Mecenas) escala en
`calc()` el aire entre bloques, el interlineado y la apretura de titulares. Sobre
eso, rasgos por peldaño:

- **Lector:** línea de suscripción junto a la fecha, filetes de bloque en lacre.
- **Habitual:** capitular (Diario y Edición), filete fino de 0,75 px, títulos de
  bloque y números de «Lo más leído» en cursiva de cartel.
- **Mecenas:** cabecera expandida (anchura 145 %), oro derivado del lacre en
  filetes, capitular y progreso, grano de papel, florones, pies de foto en cursiva.

Fácil no recibe nada que reste legibilidad (ni capitular, ni grano, ni cursivas)
y Exprés nada que reste densidad. La matriz completa está en la cabecera del CSS.

## Publicidad y cuotas

La cuota vive en `<html data-cuota="abierto|lector|habitual|mecenas">`. Cada hueco
declara en el HTML a qué cuotas se sirve (`data-cuotas`), su formato y su medida.
El CSS decide qué se pinta y cuánto molesta, con tokens `--pliego-pub-*` que leen
`--semantic-*`, así que cada modo de lectura repinta también la publicidad.

| Cuota | Precio | Publicidad |
|---|---|---|
| Abierto | 0 € | billboard, media página fija, billboard intermedio, in-read ×2, vídeo outstream sin sonido, anclaje con cierre, piel (≥ 1600 px), nativo, patrocinio y recomendaciones |
| Lector | 4,99 €/mes | leaderboard en lugar de billboard, media página sin fijar, un in-read, nativo, patrocinio y recomendaciones |
| Habitual | 8,99 €/mes | solo pieza patrocinada marcada y patrocinio de sección |
| Mecenas | 14,99 €/mes | ninguna |

- `data-mapa-pub` muestra el mapa: cada hueco con su formato, medida y cuotas;
  los que tu cuota no recibe aparecen como fantasma.
- Un contador CSS cuenta en el pie solo los anuncios pintados.
- Espacio reservado con `width`/`height` y `<source>` por ancho (sin saltos de
  maquetación), etiqueta «Publicidad» en todos los huecos, `rel="sponsored"`.
- Nunca: intersticiales, pop-ups, vídeo con sonido, fijos por encima del 30 %
  de la pantalla o sin cierre (Better Ads Standards).
- Los modos de lectura son gratis en todas las cuotas.

## Barra de demostración

Franja en tinta invertida encima de la cabecera, en las tres páginas: cuota,
modo, tema y mapa de publicidad con un toque. Comparte nombres de campo con el
panel «Modo de lectura», así que los dos se sincronizan, y lo elegido persiste
al navegar. No forma parte del periódico: en producción se quita el `<aside
class="pliego-demo">` y su CSS.

## Añadir un modo

1. Crea `css/lectura/<modo>.css` con un bloque `:root[data-lectura="<modo>"]`
   que reescriba los `--semantic-*` de color con `light-dark()` y los
   `--pliego-*` que necesites.
2. Añade su tarjeta `.pliego-opcion--<modo>` en el panel y su nombre en `MODOS`
   de `js/pliego-lectura.js`.
3. Pasa `npx syx-scan css index.html articulo.html --tema example-01`.

## Requisitos de navegador

`light-dark()`, color relativo de OKLCH, `subgrid`, `:has()`, la Popover API, `@starting-style` y
`::details-content` (este último solo para abrir solo el resumen en el modo
Fácil; sin él, el resumen sigue disponible como desplegable).

Contenido ficticio: personas, lugares y datos son inventados.
Diseñado y desarrollado por José Luis Pizarro.
