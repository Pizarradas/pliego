(() => {
  const H = [];
  const W = innerWidth;
  const add = (tipo, el, det) => H.push({ tipo, sel: nombre(el), det });
  const visible = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    let e = el;
    while (e && e !== document.documentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
      e = e.parentElement;
    }
    return true;
  };
  function nombre(el) {
    if (!el || !el.classList) return String(el);
    const propia = [...el.classList].filter(c => !c.startsWith('is-'));
    let base = propia.length ? '.' + propia.slice(0, 2).join('.') : el.tagName.toLowerCase();
    if (!propia.length || /^atom-|^mol-/.test(propia[0])) {
      const p = el.parentElement && el.parentElement.closest('[class*="pliego-"]');
      if (p) base = '.' + [...p.classList].find(c => c.startsWith('pliego-')) + ' ' + base;
    }
    return base;
  }
  const px = (v) => parseFloat(v) || 0;

  /* ── 1. Etiquetas: píldora junto a texto ── */
  document.querySelectorAll('.atom-pill').forEach((pill) => {
    if (!visible(pill)) return;
    const fila = pill.closest('.pliego-teaser__cintillo, .pliego-articulo__cintillo, p, div');
    const pr = pill.getBoundingClientRect();
    const ps = getComputedStyle(pill);
    const fs = px(ps.fontSize);
    const ratio = pr.height / fs;
    if (ratio > 2.3) add('etiqueta-alta', pill, `alto ${pr.height.toFixed(0)}px para cuerpo ${fs.toFixed(1)}px (×${ratio.toFixed(1)})`);
    const padIn = px(ps.paddingInlineStart);
    if (padIn > fs * 1.4) add('etiqueta-ancha', pill, `relleno lateral ${padIn.toFixed(0)}px para cuerpo ${fs.toFixed(1)}px`);
    if (fs < 10) add('etiqueta-pequeña', pill, `cuerpo ${fs.toFixed(1)}px`);
    // texto vecino en la misma fila
    if (fila) {
      const w = document.createTreeWalker(fila, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        if (!n.textContent.trim() || pill.contains(n)) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        const tr = rg.getBoundingClientRect();
        if (!tr.height || Math.abs(tr.top - pr.top) > pr.height) continue;
        const cPill = pr.top + pr.height / 2, cTxt = tr.top + tr.height / 2;
        if (Math.abs(cPill - cTxt) > 1.5) add('etiqueta-desalineada', pill, `centro píldora vs texto: ${(cPill - cTxt).toFixed(1)}px`);
        const fsT = px(getComputedStyle(n.parentElement).fontSize);
        if (Math.abs(fsT - fs) > 1.5) add('etiqueta-cuerpo', pill, `píldora ${fs.toFixed(1)}px vs texto ${fsT.toFixed(1)}px`);
        if (pr.height > tr.height * 1.9) add('etiqueta-desproporcion', pill, `píldora ${pr.height.toFixed(0)}px vs línea ${tr.height.toFixed(0)}px`);
        break;
      }
    }
  });

  /* ── 2. Cabecera ── */
  const cab = document.querySelector('.pliego-cabecera');
  if (cab && visible(cab)) {
    const marca = cab.querySelector('.pliego-cabecera__marca');
    const acc = cab.querySelector('.pliego-cabecera__acciones');
    const ed = cab.querySelector('.pliego-cabecera__edicion');
    const mr = marca.getBoundingClientRect(), ar = acc.getBoundingClientRect(), er = ed && visible(ed) ? ed.getBoundingClientRect() : null;
    const inter = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
    if (inter(mr, ar)) add('cabecera-solape', marca, 'la marca toca los botones');
    // botones en una fila
    const bts = [...acc.children].filter(visible);
    const tops = new Set(bts.map(x => Math.round(x.getBoundingClientRect().top)));
    if (tops.size > 1 && W >= 768) add('cabecera-botones-2-filas', acc, `${tops.size} filas a ${W}px`);
    const hs = new Set(bts.map(x => Math.round(x.getBoundingClientRect().height)));
    if (hs.size > 1) add('cabecera-botones-alturas', acc, [...hs].join('/') + 'px');
    if (W >= 768 && er) {
      if (Math.abs((er.top + er.height / 2) - (ar.top + ar.height / 2)) > 6 && Math.abs(er.top - ar.top) > 6)
        add('cabecera-fila-rota', ed, `fecha y botones en filas distintas a ${W}px`);
    }
    if (W >= 768 && getComputedStyle(marca).textAlign === 'center') {
      const cm = mr.left + mr.width / 2, cc = cab.getBoundingClientRect().left + cab.getBoundingClientRect().width / 2;
      // la caja de la marca ocupa todo el ancho: medir el texto
      const rg = document.createRange(); rg.selectNodeContents(marca); const t = rg.getBoundingClientRect();
      if (Math.abs((t.left + t.width / 2) - cc) > 4) add('cabecera-marca-descentrada', marca, `${((t.left + t.width / 2) - cc).toFixed(0)}px`);
    }
    // borde izquierdo coherente: fecha y lista de secciones
    const lista = cab.querySelector('.pliego-secciones__lista');
    if (lista && W >= 768) {
      const lr = lista.getBoundingClientRect();
      const primero = lista.firstElementChild.getBoundingClientRect(), ultimo = lista.lastElementChild.getBoundingClientRect();
      const centroItems = (primero.left + ultimo.right) / 2;
      const desborda = lista.scrollWidth > lista.parentElement.clientWidth + 1;
      if (!desborda && Math.abs(centroItems - W / 2) > 6) add('secciones-descentradas', lista, `${(centroItems - W / 2).toFixed(0)}px`);
    }
  }

  /* ── 3. Filas de botones: misma altura y misma línea ── */
  document.querySelectorAll('.mol-btn-group, .pliego-boletin__fila, .pliego-escucha__controles').forEach((g) => {
    if (!visible(g)) return;
    const bs = [...g.querySelectorAll(':scope > .atom-btn, :scope > button, :scope > a.atom-btn, :scope > .atom-input')].filter(visible);
    const filas = {};
    bs.forEach(b => { const r = b.getBoundingClientRect(); const k = Math.round(r.top / 4); (filas[k] = filas[k] || []).push(r.height); });
    Object.values(filas).forEach(hs => { const s = new Set(hs.map(Math.round)); if (s.size > 1) add('botones-alturas', g, [...s].join('/') + 'px'); });
  });

  /* ── 4. Desbordes ── */
  const sinScroll = (el) => { let e = el.parentElement; while (e) { const o = getComputedStyle(e).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return false; e = e.parentElement; } return true; };
  document.querySelectorAll('body *').forEach((el) => {
    if (!el.getClientRects().length) return;
    const r = el.getBoundingClientRect();
    if (r.right > W + 1 && r.width > 0 && sinScroll(el) && visible(el) && getComputedStyle(el).position !== 'fixed') add('sale-de-pantalla', el, `${(r.right - W).toFixed(0)}px`);
    const cs = getComputedStyle(el);
    if (cs.overflowX === 'visible' && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && /^(P|H1|H2|H3|SPAN|A|LI|BUTTON|LABEL)$/.test(el.tagName) && visible(el) && cs.display !== 'inline')
      add('texto-desborda', el, `${el.scrollWidth - el.clientWidth}px`);
  });

  /* ── 5. Cuerpo mínimo y objetivos táctiles ── */
  const modo = document.documentElement.dataset.lectura;
  document.querySelectorAll('p, span, a, li, time, small, label, button, h2, h3, cite, strong, caption, td, th, legend').forEach((el) => {
    if (!visible(el) || el.closest('[aria-hidden="true"], .pliego-modo-actual')) return;
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
    const fs = px(getComputedStyle(el).fontSize);
    if (fs > 0 && fs < 11.5) add('cuerpo-minimo', el, `${fs.toFixed(1)}px`);
    if (modo === 'facil' && fs < 15.5 && !el.closest('.pliego-demo, .pliego-pub__creatividad')) add('facil-cuerpo', el, `${fs.toFixed(1)}px`);
  });
  const objetivos = [...document.querySelectorAll('a[href], button, label[for], select, input:not([type=hidden])')].filter(visible);
  objetivos.forEach((el) => {
    if (!visible(el) || el.closest('.pliego-capitulo > p, .pliego-claves, .pliego-pie__nota')) return;
    if (el.matches('.atom-radio__input, .atom-switch__input, .pliego-demo__input, .pliego-teaser__enlace, .syx-skip-link, .atom-label')) return;
    const r = el.getBoundingClientRect();
    const minimo = modo === 'facil' && !el.closest('.pliego-demo') ? 44 : 24;
    if (Math.min(r.width, r.height) < minimo - 0.5) {
      // Excepción de espaciado (WCAG 2.5.8): un círculo de 24 px centrado no toca otro objetivo
      const cx0 = r.left + r.width / 2, cy0 = r.top + r.height / 2, rad = minimo / 2;
      const choca = objetivos.some(o => o !== el && (() => { const q = o.getBoundingClientRect(); const dx = Math.max(q.left - cx0, 0, cx0 - q.right), dy = Math.max(q.top - cy0, 0, cy0 - q.bottom); return dx * dx + dy * dy < rad * rad; })());
      if (choca || minimo > 24) add('objetivo-tactil', el, `${r.width.toFixed(0)}×${r.height.toFixed(0)} (mín. ${minimo})`);
    }
  });

  /* ── 6. Contraste del texto pequeño ── */
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const fondo = (el) => {
    const capas = [];
    let e = el;
    while (e) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== 'none' && !e.matches('body')) return null;
      const c = rgba(cs.backgroundColor);
      if (c[3] > 0) { capas.push(c); if (c[3] >= 0.99) break; }
      e = e.parentElement;
    }
    let base = [255, 255, 255];
    for (let i = capas.length - 1; i >= 0; i--) { const [r, g, b, a] = capas[i]; base = [r * a + base[0] * (1 - a), g * a + base[1] * (1 - a), b * a + base[2] * (1 - a)]; }
    return base;
  };
  const objetivo = '.pliego-teaser__cintillo, .pliego-teaser__meta > *, .pliego-articulo__cintillo, .pliego-firma__fechas, .pliego-firma__lugar, .pliego-tiempo span, .pliego-pub__etiqueta span, .pliego-pub__quitar, .pliego-figura__pie, .pliego-cabecera__edicion > *, .pliego-cabecera__lema, .pliego-ultima__item time, .pliego-cronologia__item time, .pliego-recuento span, .pliego-pie__nota, .pliego-pie__credito, .pliego-escucha__tiempo, .pliego-escucha__num, .pliego-escucha__aviso, .pliego-opcion__nota, .atom-pill, .pliego-plan__precio span, .pliego-planes__nota, .pliego-patrocinio, .pliego-demo__opcion span, .pliego-demo__leyenda, .pliego-teaser__autor, .atom-breadcrumb__item, .pliego-ficha__fuente, .pliego-ficha__leyenda, .pliego-mejora__texto, .pliego-correccion, .pliego-temas__titulo';
  document.querySelectorAll(objetivo).forEach((el) => {
    if (!visible(el)) return;
    const cs = getComputedStyle(el);
    const f = rgba(cs.color);
    if (f[3] < 0.5) return;
    const b = fondo(el); if (!b) return;
    const fg = [f[0] * f[3] + b[0] * (1 - f[3]), f[1] * f[3] + b[1] * (1 - f[3]), f[2] * f[3] + b[2] * (1 - f[3])];
    let op = 1, e = el; while (e) { op *= parseFloat(getComputedStyle(e).opacity); e = e.parentElement; }
    const fg2 = fg.map((v, i) => v * op + b[i] * (1 - op));
    const L1 = lum(fg2), L2 = lum(b);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const fs = px(cs.fontSize), grande = fs >= 24 || (fs >= 18.66 && px(cs.fontWeight) >= 700);
    if (ratio < (grande ? 3 : 4.5)) add('contraste', el, `${ratio.toFixed(2)}:1 a ${fs.toFixed(0)}px`);
  });

  /* ── 7. Metadatos: elementos de una misma línea con alturas de caja muy distintas ── */
  document.querySelectorAll('.pliego-teaser__meta, .pliego-firma__fechas, .pliego-cabecera__edicion, .pliego-pub__etiqueta').forEach((m) => {
    if (!visible(m)) return;
    const hijos = [...m.children].filter(visible);
    const filas = {};
    hijos.forEach(h => { const r = h.getBoundingClientRect(); const k = Math.round(r.top / 6); (filas[k] = filas[k] || []).push(r); });
    Object.values(filas).forEach(rs => {
      if (rs.length < 2) return;
      const centros = rs.map(r => r.top + r.height / 2);
      const d = Math.max(...centros) - Math.min(...centros);
      if (d > 2) add('meta-desalineada', m, `${d.toFixed(1)}px entre centros`);
    });
  });

  /* ── 8. Ejes del artículo: texto, cabecera, figuras y ruta comparten eje ── */
  if (W >= 768) {
    const eje = W / 2;
    const centro = (el) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2; };
    const centroTexto = (el) => { const rg = document.createRange(); rg.selectNodeContents(el); const rs = [...rg.getClientRects()]; if (!rs.length) return centro(el); const l = Math.min(...rs.map(r => r.left)), d = Math.max(...rs.map(r => r.right)); return (l + d) / 2; };
    const parr = document.querySelector('.pliego-capitulo > p');
    if (parr && visible(parr) && Math.abs(centro(parr) - eje) > 3) add('eje-texto', parr, `caja de texto descentrada ${(centro(parr) - eje).toFixed(0)}px`);
    const tit = document.querySelector('.pliego-articulo__titulo');
    if (tit && visible(tit) && getComputedStyle(tit).textAlign === 'center' && Math.abs(centroTexto(tit) - eje) > 4) add('eje-titular', tit, `titular centrado fuera del eje ${(centroTexto(tit) - eje).toFixed(0)}px`);
    const cab = document.querySelector('.pliego-articulo__cabecera');
    const ruta = document.querySelector('.pliego-ruta .atom-breadcrumb');
    if (cab && ruta && visible(ruta) && getComputedStyle(cab).textAlign === 'center' && Math.abs(centroTexto(ruta) - eje) > 4) add('eje-ruta', ruta, `ruta fuera del eje de una cabecera centrada ${(centroTexto(ruta) - eje).toFixed(0)}px`);
    document.querySelectorAll('.pliego-figura--portada img, .pliego-figura--ancha img, .pliego-capitulo > .pliego-ficha, .pliego-capitulo > .pliego-cita').forEach((f) => {
      if (visible(f) && Math.abs(centro(f) - eje) > 3) add('eje-bloque', f, `bloque descentrado ${(centro(f) - eje).toFixed(0)}px`);
    });
  }

  return H;
})()
