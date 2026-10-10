# Auditoría de detalle · Pliego

Fecha: 10 de octubre de 2026 · SYX v5.0.0 (tema example-01) con los parches 0001 y 0002.

## Alcance

Cada combinación se carga y se mide en un navegador real (Chromium) con la fuente
definitiva (Roboto Serif variable):

| Eje | Valores |
|---|---|
| Modo | Diario, Fácil, Reportaje, Edición, Exprés, Contexto, Escucha |
| Cuota | Abierto, Lector, Habitual, Mecenas |
| Ancho | 390, 834, 1280 y 1600 px |
| Página | portada, artículo, cuotas |
| Tema | claro (todas las cuotas) y oscuro (Abierto y Mecenas) |

En total, 456 cargas de página (Contexto y Escucha no se prueban en la página de cuotas, que no cambia con ellos). El script está en `auditoria/` y se lanza con
`python3 auditoria/auditoria.py` (la versión rápida, con `rapida`).

## Qué se mide

1. **Etiquetas** (`atom-pill` junto a su cintillo): alto respecto al cuerpo, relleno
   lateral, cuerpo igual al del texto vecino y centro vertical alineado (±1,5 px).
2. **Cabecera**: la marca no toca los botones; los botones en una fila y con la
   misma altura; fecha y botones en la misma fila a partir de tablet; marca y
   secciones centradas.
3. **Filas de botones**: misma altura por fila.
4. **Desbordes**: nada sale de la pantalla y ningún texto desborda su caja.
5. **Cuerpo mínimo**: 11,5 px en general y 16 px en Fácil.
6. **Objetivos táctiles**: 24 px (WCAG 2.5.8, con su excepción de espaciado) y
   44 px en Fácil (WCAG 2.5.5).
7. **Contraste** de todo el texto pequeño de servicio (cintillos, metadatos,
   etiquetas de publicidad, pies, sellos, controles de la demo): 4,5:1, o 3:1 en
   texto grande, componiendo transparencias y opacidades sobre el fondo real.
8. **Metadatos**: los elementos de una misma línea comparten centro vertical.
9. **Ejes del artículo** (desde tablet): la caja de texto, el titular centrado,
   la ruta de una cabecera centrada, la imagen de portada, las figuras anchas,
   la ficha y la cita comparten el eje de la página (±3 px).

## Resultado

| Pasada | Tipos de hallazgo | Casos |
|---|---|---|
| Primera (rápida: 2 cuotas × 2 anchos) | 44 | 3.523 |
| Tras corregir etiquetas, cabecera y tamaños | 8 | 751 |
| Tras corregir secciones, piel y objetivos | 2 | 64 |
| Final | 0 | 0 |

`syx-scan` sigue sin hallazgos altos ni medios (10 bajos: posiciones deliberadas
de formatos publicitarios, barra de demo y reproductor, todas anotadas).

## Hallazgos y arreglos

### Etiquetas de género (las que señalaste)
- **Problema:** la píldora medía 28 px de alto para un texto de 10 px (2,8 veces
  su cuerpo), con 24 px de relleno lateral, y su cuerpo (10,3 px) no coincidía
  con el del cintillo (12 px). En móvil caía por debajo del cuerpo mínimo.
- **Causa en SYX:** `atom-pill` declaraba `--component-pill-font-size` pero no
  lo usaba, y su relleno estaba escrito a mano. Arreglado en el parche 0002, que
  añade `--component-pill-padding-block` y `--component-pill-padding-inline`.
- **En Pliego:** `.pliego-genero` fija con esos tokens el cuerpo y el espaciado
  del cintillo, un relleno en `em` y una altura de unas 1,7 veces el cuerpo, en
  cualquier modo.
- **Edición:** el espaciado de los cintillos baja de 0,18 a 0,1 em.
- **Error de capa:** el `display` del envoltorio estaba fuera de `@layer` y
  ganaba a las reglas que ocultan la etiqueta en Fácil, Exprés y Escucha.

### Cabecera (la que señalaste)
- **Problema:** en tablet y en los modos estrechos, los botones caían debajo de la
  fecha y la marca quedaba descolgada. La fila seguía el ancho del modo (46 rem
  en Fácil, 52 rem en Escucha).
- **Arreglo:** un ancho propio, `--pliego-ancho-cabecera`. La fila pasa a una
  rejilla con la fecha a la izquierda y los botones a la derecha, y si falta
  sitio es la línea de edición la que pasa a dos renglones. Edición conserva su
  línea centrada.
- **Secciones:** ya no parten en dos filas con una palabra huérfana; si no caben,
  se desplazan.
- **Insignia de Mecenas:** «Mecenas·sin publicidad» perdía el espacio por ser
  `inline-flex`; ahora lleva separación.

### Tamaños
- **Fácil:** 24 elementos bajaban de 16 px (tablas, listas, cronología, cifras,
  migas de pan, avisos). Ahora usan el token `--pliego-t-secundario`, que Fácil
  sube a 17 px, y los tokens de SYX del cuerpo pequeño y de las migas.
- **Barra de demo:** su rótulo pasa de 11 a 12 px.

### Objetivos táctiles
- **24 px:** enlaces del pie (15 px de alto), «Ver menos anuncios» (20 px),
  autoría de la firma, «Lo más leído» en Exprés y las migas de pan. Para las
  migas, el parche 0002 da al enlace de `atom-breadcrumb` un relleno vertical y
  hace que use su token de cuerpo, que también declaraba sin usar.
- **44 px en Fácil:** secciones, «Lo más leído», temas, pie, «Ver menos
  anuncios», firma, migas y radios.

### Contraste
- **«Edición para mecenas»** en oro sobre papel daba 3,84:1. Ahora el texto
  pequeño usa `--pliego-oro-texto`, derivado del lacre, que pasa 4,5:1 en claro
  y en oscuro. El oro claro queda para filetes y capitulares.

### Publicidad
- **Piel:** a 1600 px el lado derecho se salía 112 px de la pantalla. Ahora solo
  aparece desde 1824 px (114 rem), cuando caben los dos lados junto a la página
  más ancha.

### Radios (ya corregido antes)
- **Punto interior:** quedaba descentrado 2 px. Arreglado en SYX (parche 0001).

## Ejes en Edición

En escritorio, Edición abría una columna de notas a la derecha sin contrapartida
a la izquierda: la caja de texto, la cabecera centrada y las figuras quedaban
144 px a la izquierda del eje de la cabecera del periódico (a 1280 px). Ahora la
rejilla reserva un contramargen del mismo ancho que el margen de notas, así que
todo comparte eje. La columna de notas aparece desde 75 rem, cuando cabe
entera; por debajo, las notas van intercaladas y el texto, centrado. La ruta de
navegación se centra con la cabecera. El nuevo control 9 lo vigila en todos
los modos.

## Segunda pasada: posiciones de la publicidad

Script: `auditoria/publicidad.py` (+ `publicidad.js`). Recorre 7 modos × 3 cuotas
con anuncios × 5 pantallas (390×844, 834×1112, 1280×800, 1366×640 y 1920×1080)
× 2 páginas, y en cada carga mide en 8 posiciones de scroll (0 %, 15 %, …, 100 %):

- el anclaje queda pegado al borde inferior (±1 px), no pasa del 30 % de la
  pantalla, tiene cierre y el cuerpo reserva exactamente su alto;
- arriba del todo, el anclaje no se ve (no compite con el billboard);
- ningún anuncio pisa contenido editorial, la cabecera, la barra de demo ni el
  reproductor, ni sale de la pantalla;
- dos anuncios no se pisan entre sí;
- todas las etiquetas «Publicidad» y «Patrocinado» se pueden leer (lo que hay
  en su centro es la propia etiqueta);
- la piel no queda cortada ni bajo el anclaje cuando acompaña el scroll;
- al final de la página, el pie queda por encima del anclaje.

No cuenta como fallo lo que pasa por debajo del anclaje o de la barra de
progreso mientras se hace scroll: es lo que hace cualquier contenido.

| Pasada | Tipos | Casos |
|---|---|---|
| Primera | 20 | 557 |
| Final | 0 | 0 |

Arreglos:
- **Anclaje despegado 15 px del borde:** `div.pliego-pub` daba margen vertical a
  todos los huecos y ganaba en especificidad al `margin: 0` del anclaje.
- **Anclaje con alto estimado:** el cuerpo reservaba 88 px para un anclaje de
  hasta 137 px, así que el final del pie quedaba tapado. Ahora el alto se
  calcula con tokens (creatividad + etiqueta + rellenos + borde + zona segura),
  el anclaje lo usa como alto fijo y el cuerpo reserva exactamente lo mismo.
- **Anclaje en la primera pantalla:** ahora espera a que la franja del billboard
  salga de la vista (IntersectionObserver). Sin JS, se ve desde el principio.
- **Piel:** era un fondo fijo a toda la ventana. Su parte superior y su etiqueta
  quedaban bajo la cabecera, y la llamada a la acción del pie bajo el anclaje.
  Ahora son dos columnas *sticky* dentro de la portada, por fuera de sus
  márgenes. Su alto nunca pasa de la pantalla menos el anclaje, solo aparecen
  desde 1856 px y ya no se sirven en el artículo.

## Límites de la auditoría
- **Contraste:** no se mide sobre imágenes ni degradados (titulares de Reportaje
  y Escucha sobre la ilustración); esos se revisaron a ojo.
- **Ritmo vertical y criterio tipográfico:** no se evalúan automáticamente. Se
  revisaron con hojas de capturas de cabecera y etiquetas en los siete modos, en
  claro y en oscuro.
- **Fuente:** se usó Roboto Serif variable cargada en local. Con Google Fonts
  los métricos son los mismos.
