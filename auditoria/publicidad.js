// Auditoría de posiciones de la publicidad. Devuelve [{tipo, sel, det}].
// Se ejecuta en varias posiciones de scroll (la llama publicidad.py).
(() => {
  const H = [];
  const W = innerWidth, V = innerHeight;
  const add = (tipo, el, det) => H.push({ tipo, sel: el && el.dataset && el.dataset.formato ? el.dataset.formato : (el && el.className ? '.' + String(el.className).split(' ')[0] : String(el)), det });
  const visible = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    }
    return true;
  };
  const corta = (a, b) => {
    const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return x > 2 && y > 2 ? x * y : 0;
  };
  const enPantalla = (r) => r.bottom > 0 && r.top < V && r.right > 0 && r.left < W;

  const anuncios = [...document.querySelectorAll('.pliego-pub')].filter(visible);
  const anclaje = anuncios.find(a => a.classList.contains('pliego-pub--anclaje'));
  const ra = anclaje ? anclaje.getBoundingClientRect() : null;

  // 1 · Anclaje: pegado abajo, ≤ 30 % de la pantalla, con cierre
  // El anclaje se muestra al pasar la primera pantalla: arriba del todo no debe verse
  const anclajeVisible = anclaje && ra.top < V - 1;
  if (anclaje && scrollY < 10 && anclajeVisible) add('anclaje-en-primera-pantalla', anclaje, 'el anclaje aparece antes de hacer scroll y compite con el billboard');
  if (anclaje && anclajeVisible) {
    const entrando = anclaje.getAnimations().length > 0;
    if (!entrando && Math.abs(ra.bottom - V) > 1) add('anclaje-despegado', anclaje, `borde inferior a ${(V - ra.bottom).toFixed(1)} px del final`);
    if (ra.height > V * 0.3) add('anclaje-alto', anclaje, `${(ra.height / V * 100).toFixed(0)} % de la pantalla`);
    const cierre = anclaje.querySelector('.pliego-pub__cerrar');
    if (!visible(cierre)) add('anclaje-sin-cierre', anclaje, 'no hay botón de cierre visible');
    const pad = parseFloat(getComputedStyle(document.body).paddingBlockEnd);
    if (pad + 0.5 < ra.height) add('anclaje-tapa-final', anclaje, `reserva ${pad.toFixed(0)} px para un anclaje de ${ra.height.toFixed(0)} px`);
  }

  // 2 · Bloques de contenido que ningún anuncio debe pisar
  const contenido = [...document.querySelectorAll(
    '.pliego-cabecera, .pliego-demo, .pliego-teaser:not(.pliego-pub), .pliego-bloque__cabecera, .pliego-leido, .pliego-ultima, .pliego-boletin, .pliego-mejora, ' +
    '.pliego-articulo__cabecera, .pliego-capitulo > *:not(.pliego-pub), .pliego-claves, .pliego-figura, .pliego-articulo__pie > *, .pliego-pie, .pliego-ruta, .pliego-escucha__barra')]
    .filter(el => visible(el) && !el.closest('.pliego-pub'));

  for (const a of anuncios) {
    const r = a.getBoundingClientRect();
    const fijo = a === anclaje;
    const piel = a.classList.contains('pliego-pub--piel');
    const zonas = piel ? [...a.querySelectorAll('.pliego-pub__lado')].map(l => l.getBoundingClientRect()) : [r];
    for (const z of zonas) {
      if (!enPantalla(z)) continue;
      for (const c of contenido) {
        if (a.contains(c) || c.contains(a)) continue;
        const rc = c.getBoundingClientRect();
        if (!enPantalla(rc)) continue;
        // El anclaje fijo tapa lo que pasa por debajo: eso es su naturaleza, salvo la cabecera y la barra del reproductor
        if (fijo && !c.matches('.pliego-cabecera, .pliego-demo, .pliego-escucha__barra')) continue;
        const area = corta(z, rc);
        if (area > 16) add('anuncio-pisa-contenido', a, `pisa ${'.' + String(c.className).split(' ')[0]} (${Math.round(area)} px²)`);
      }
      if (z.right > W + 1 || z.left < -1) add('anuncio-sale-de-pantalla', a, `${Math.round(z.left)}…${Math.round(z.right)} de ${W}`);
    }
  }

  // 3 · Dos anuncios no se pisan entre sí
  for (let i = 0; i < anuncios.length; i++) for (let j = i + 1; j < anuncios.length; j++) {
    const a = anuncios[i], b = anuncios[j];
    if (a.contains(b) || b.contains(a)) continue;
    // Pasar por debajo del anclaje al hacer scroll es lo que hace cualquier contenido
    if (a === anclaje || b === anclaje) continue;
    const za = a.classList.contains('pliego-pub--piel') ? [...a.querySelectorAll('.pliego-pub__lado')] : [a];
    const zb = b.classList.contains('pliego-pub--piel') ? [...b.querySelectorAll('.pliego-pub__lado')] : [b];
    for (const x of za) for (const y of zb) {
      const ar = x.getBoundingClientRect(), br = y.getBoundingClientRect();
      if (!enPantalla(ar) || !enPantalla(br)) continue;
      const area = corta(ar, br);
      // la piel puede pasar por detrás del anclaje solo si su creatividad queda entera por encima
      if (area > 16) add('anuncios-se-pisan', a, `${a.dataset.formato} y ${b.dataset.formato}`);
    }
  }

  // 4 · Etiquetas legibles: lo que hay en su centro es la propia etiqueta
  const etiquetas = [...document.querySelectorAll('.pliego-pub__etiqueta, .pliego-patrocinio, .pliego-teaser--patrocinado .pliego-genero')].filter(visible);
  for (const e of etiquetas) {
    const r = e.getBoundingClientRect();
    if (!enPantalla(r) || r.top < 0 || r.bottom > V) continue;
    const el = document.elementFromPoint(r.left + Math.min(20, r.width / 2), r.top + r.height / 2);
    // Tapado al pasar bajo el anclaje o la barra de progreso: transitorio, no cuenta
    if (el && (el.closest('.pliego-pub--anclaje, .pliego-progreso') && !e.closest('.pliego-pub--anclaje'))) continue;
    // El enlace de la pieza la cubre entera de forma transparente (patrón de tarjeta): la etiqueta se ve
    if (el && el.matches('.pliego-teaser__enlace') && el.closest('.pliego-pub') === e.closest('.pliego-pub')) continue;
    if (el && !e.contains(el) && !el.contains(e)) add('etiqueta-tapada', e.closest('.pliego-pub') || e, `la tapa ${'.' + String(el.className).split(' ')[0]}`);
  }
  // etiqueta de la piel (pseudoelemento): se comprueba la franja superior de cada lado
  document.querySelectorAll('.pliego-pub__lado').forEach((l) => {
    if (!visible(l)) return;
    const r = l.getBoundingClientRect();
    if (r.top < 0 || r.top + 10 > V) return;
    const el = document.elementFromPoint(r.left + 10, r.top + 8);
    if (el && !l.contains(el)) add('etiqueta-tapada', l.closest('.pliego-pub'), `la tapa ${'.' + String(el.className).split(' ')[0]}`);
    const img = l.querySelector('img').getBoundingClientRect();
    const pegado = r.top <= 20;
    if (!pegado) return;
    if (ra && img.bottom > ra.top + 1 && img.top < ra.top) add('piel-bajo-anclaje', l.closest('.pliego-pub'), `${Math.round(img.bottom - ra.top)} px de la piel quedan bajo el anclaje`);
    if (img.bottom > V + 1 && r.top >= 0) add('piel-cortada', l.closest('.pliego-pub'), `${Math.round(img.bottom - V)} px fuera de la pantalla`);
  });

  // 5 · Al final de la página, el pie no queda bajo el anclaje
  if (anclaje && Math.abs(scrollY + V - document.documentElement.scrollHeight) < 2) {
    const ultimo = document.querySelector('.pliego-pie__credito');
    if (ultimo && ultimo.getBoundingClientRect().bottom > ra.top + 1) add('pie-bajo-anclaje', anclaje, `el crédito del pie queda ${Math.round(ultimo.getBoundingClientRect().bottom - ra.top)} px bajo el anclaje`);
  }

  return H;
})()
