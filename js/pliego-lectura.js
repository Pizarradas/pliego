/* Pliego · modos de lectura, cuota y mapa de publicidad
   Este script no toca el HTML del periódico: solo escribe atributos en <html>
   (data-lectura, data-theme, data-cuota, data-mapa-pub) y los recuerda.
   Qué se ve, cómo y cuánta publicidad hay lo decide el CSS. */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var CLAVE_MODO = 'pliego:lectura';
  var CLAVE_APARIENCIA = 'pliego:apariencia';
  var CLAVE_CUOTA = 'pliego:cuota';
  var CLAVE_MAPA = 'pliego:mapa';
  var CUOTAS = { abierto: 'Abierto', lector: 'Lector', habitual: 'Habitual', mecenas: 'Mecenas' };
  var MODOS = { diario: 'Diario', facil: 'Fácil', reportaje: 'Reportaje', edicion: 'Edición', expres: 'Exprés', contexto: 'Contexto', escucha: 'Escucha' };

  function leer(clave) {
    try { return localStorage.getItem(clave); } catch (e) { return null; }
  }
  function guardar(clave, valor) {
    try { localStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento: el modo dura lo que la visita */ }
  }

  // Si el visor ya fijó data-theme (y el lector no eligió nada), «Automática» lo respeta.
  var aparienciaGuardada = leer(CLAVE_APARIENCIA);
  var temaDelVisor = (aparienciaGuardada === 'light' || aparienciaGuardada === 'dark') ? null : raiz.getAttribute('data-theme');

  // Panel del lector y barra de demostración comparten nombres de campo:
  // cualquier cambio se refleja en los dos.
  function marcar(nombre, valor) {
    document.querySelectorAll('input[name="' + nombre + '"]').forEach(function (i) {
      i.checked = i.value === valor;
    });
  }

  function anunciar(texto) {
    var estado = document.getElementById('lectura-estado');
    if (!estado) return;
    estado.textContent = '';
    window.setTimeout(function () { estado.textContent = texto; }, 60);
  }

  function aplicarModo(modo, avisar) {
    if (!MODOS[modo]) modo = 'diario';
    raiz.setAttribute('data-lectura', modo);
    guardar(CLAVE_MODO, modo);
    marcar('lectura', modo);
    if (avisar) {
      var bloqueado = modo === 'escucha' && raiz.getAttribute('data-cuota') !== 'mecenas';
      anunciar(bloqueado ? 'Escucha es parte de la cuota Mecenas. Mientras, ves la edición Diario.' : 'Modo ' + MODOS[modo] + ' activado');
    }
  }

  function aplicarApariencia(valor, avisar) {
    if (valor === 'light' || valor === 'dark') {
      raiz.setAttribute('data-theme', valor);
    } else {
      valor = 'auto';
      if (temaDelVisor) raiz.setAttribute('data-theme', temaDelVisor);
      else raiz.removeAttribute('data-theme');
    }
    guardar(CLAVE_APARIENCIA, valor);
    marcar('apariencia', valor);
    if (avisar) anunciar({ auto: 'Apariencia automática', light: 'Apariencia clara', dark: 'Apariencia oscura' }[valor]);
  }

  function aplicarCuota(cuota, avisar) {
    if (!CUOTAS[cuota]) cuota = 'abierto';
    raiz.setAttribute('data-cuota', cuota);
    guardar(CLAVE_CUOTA, cuota);
    marcar('cuota', cuota);
    if (avisar) anunciar('Cuota ' + CUOTAS[cuota] + (cuota === 'mecenas' ? ': sin publicidad' : ''));
  }

  function aplicarMapa(activo, avisar) {
    if (activo) raiz.setAttribute('data-mapa-pub', '');
    else raiz.removeAttribute('data-mapa-pub');
    guardar(CLAVE_MAPA, activo ? 'si' : 'no');
    document.querySelectorAll('input[name="mapa"]').forEach(function (i) { i.checked = activo; });
    if (avisar) anunciar(activo ? 'Mapa de publicidad visible' : 'Mapa de publicidad oculto');
  }

  function iniciarPanel() {
    aplicarModo(raiz.getAttribute('data-lectura') || leer(CLAVE_MODO) || 'diario', false);
    aplicarApariencia(aparienciaGuardada || 'auto', false);
    aplicarCuota(raiz.getAttribute('data-cuota') || leer(CLAVE_CUOTA) || 'abierto', false);
    aplicarMapa(raiz.hasAttribute('data-mapa-pub'), false);
    ['form-lectura', 'form-demo'].forEach(function (id) {
      var formulario = document.getElementById(id);
      if (!formulario) return;
      formulario.addEventListener('change', function (evento) {
        var campo = evento.target;
        if (campo.name === 'lectura') aplicarModo(campo.value, true);
        if (campo.name === 'apariencia') aplicarApariencia(campo.value, true);
        if (campo.name === 'cuota') aplicarCuota(campo.value, true);
        if (campo.name === 'mapa') aplicarMapa(campo.checked, true);
      });
      formulario.addEventListener('submit', function (evento) { evento.preventDefault(); });
    });
  }

  // Progreso de lectura: atom-progress nativo, el script solo actualiza value.
  function iniciarProgreso() {
    var barra = document.getElementById('progreso-lectura');
    var articulo = document.querySelector('.pliego-articulo');
    if (!barra || !articulo) return;
    var pendiente = false;
    function medir() {
      pendiente = false;
      var caja = articulo.getBoundingClientRect();
      var recorrido = caja.height - window.innerHeight;
      var avance = recorrido > 0 ? (-caja.top) / recorrido : 1;
      var valor = Math.round(Math.min(1, Math.max(0, avance)) * 100);
      barra.value = valor;
      barra.textContent = valor + ' %';
    }
    function pedir() {
      if (!pendiente) { pendiente = true; window.requestAnimationFrame(medir); }
    }
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    medir();
  }

  function cambiarEtiqueta(boton, texto, ms) {
    var etiqueta = boton.querySelector('span:last-child');
    if (!etiqueta) return;
    var original = etiqueta.getAttribute('data-original') || etiqueta.textContent;
    etiqueta.setAttribute('data-original', original);
    etiqueta.textContent = texto;
    if (ms) window.setTimeout(function () { etiqueta.textContent = original; }, ms);
  }

  function iniciarAcciones() {
    document.addEventListener('click', function (evento) {
      var boton = evento.target.closest('[data-accion]');
      if (!boton) return;
      if (boton.dataset.accion === 'copiar') {
        var enlace = location.href.split('#')[0];
        var promesa = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(enlace) : Promise.reject();
        promesa.then(
          function () { cambiarEtiqueta(boton, 'Enlace copiado', 2400); anunciar('Enlace copiado'); },
          function () { cambiarEtiqueta(boton, 'No se pudo copiar', 2400); }
        );
      }
      if (boton.dataset.accion === 'cerrar-anclaje') {
        var anclaje = boton.closest('.pliego-pub--anclaje');
        if (anclaje) anclaje.hidden = true;
        try { sessionStorage.setItem('pliego:anclaje-cerrado', 'si'); } catch (e) {}
        anunciar('Anuncio cerrado');
      }
      if (boton.dataset.accion === 'elegir-cuota') {
        aplicarCuota(boton.dataset.cuota, false);
        var estado = document.getElementById('planes-estado');
        if (estado) estado.textContent = 'Simulación activada: ahora navegas con la cuota ' + CUOTAS[boton.dataset.cuota] + '. Vuelve a la portada para comparar.';
      }
      if (boton.dataset.accion === 'guardar') {
        var activo = boton.getAttribute('aria-pressed') === 'true';
        boton.setAttribute('aria-pressed', String(!activo));
        cambiarEtiqueta(boton, activo ? 'Guardar para luego' : 'Guardado', 0);
      }
    });
  }

  function iniciarBoletin() {
    var formulario = document.getElementById('form-boletin');
    if (!formulario) return;
    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var campo = document.getElementById('boletin-correo');
      var estado = document.getElementById('boletin-estado');
      if (!campo.value || !campo.checkValidity()) {
        campo.setAttribute('aria-invalid', 'true');
        estado.textContent = 'Escribe un correo con este formato: nombre@correo.es';
        campo.focus();
        return;
      }
      campo.removeAttribute('aria-invalid');
      estado.textContent = 'Listo. Mañana a las 7:00 recibirás el primer boletín (demostración: no se envía nada).';
      formulario.reset();
    });
  }

  function iniciarAnclaje() {
    var anclaje = document.querySelector('.pliego-pub--anclaje');
    if (!anclaje) return;
    var cerrado = null;
    try { cerrado = sessionStorage.getItem('pliego:anclaje-cerrado'); } catch (e) {}
    if (cerrado === 'si') { anclaje.hidden = true; return; }
    // Aparece cuando la primera pantalla (cabecera y franja de publicidad) sale de la vista
    var referencia = document.querySelector('.pliego-franja-pub') || document.querySelector('.pliego-cabecera');
    if (!referencia || !('IntersectionObserver' in window)) return;
    anclaje.classList.add('is-esperando');
    new IntersectionObserver(function (entradas) {
      anclaje.classList.toggle('is-esperando', entradas[0].isIntersecting);
    }).observe(referencia);
  }


  /* ── Modo Escucha ───────────────────────────────────────────────────────
     Lee el artículo con la síntesis de voz del navegador, párrafo a párrafo.
     Solo marca estados (.is-escuchando, .is-leyendo, aria-pressed, aria-current);
     cómo se ven lo decide escucha.css. */
  function iniciarEscucha() {
    var reproductor = document.getElementById('escucha');
    var articulo = document.querySelector('.pliego-articulo');
    if (!reproductor || !articulo) return;

    var voz = window.speechSynthesis;
    var boton = reproductor.querySelector('[data-escucha="reproducir"]');
    var progreso = document.getElementById('escucha-progreso');
    var ahora = document.getElementById('escucha-ahora');
    var lista = document.getElementById('escucha-capitulos');
    var duracion = document.getElementById('escucha-duracion');
    var velocidad = document.getElementById('escucha-velocidad');
    var aviso = document.getElementById('escucha-aviso');

    // Lo que se oye, en orden de documento
    var piezas = Array.prototype.slice.call(articulo.querySelectorAll(
      '.pliego-articulo__titulo, .pliego-articulo__entradilla, .pliego-capitulo__titulo, .pliego-capitulo > p, .pliego-cita__texto p'));
    var textos = piezas.map(function (el) { return el.textContent.replace(/\s+/g, ' ').trim(); });
    var palabras = textos.map(function (t) { return t.split(' ').length; });
    var totalPalabras = palabras.reduce(function (a, b) { return a + b; }, 0);

    // Duraciones en el peor caso: 140 palabras por minuto a velocidad 1×
    var PPM = 140;
    function minutos(p, ritmo) { return Math.max(1, Math.ceil(p / (PPM * ritmo))); }

    var capitulos = [];
    piezas.forEach(function (el, i) {
      if (el.classList.contains('pliego-capitulo__titulo')) capitulos.push({ inicio: i, titulo: textos[i] });
    });
    capitulos.forEach(function (c, n) {
      var fin = n + 1 < capitulos.length ? capitulos[n + 1].inicio : piezas.length;
      c.palabras = palabras.slice(c.inicio, fin).reduce(function (a, b) { return a + b; }, 0);
    });

    function pintarDuraciones() {
      var ritmo = parseFloat(velocidad.value) || 1;
      duracion.textContent = '≈ ' + minutos(totalPalabras, ritmo) + ' min · ' + capitulos.length + ' capítulos';
      lista.innerHTML = '';
      capitulos.forEach(function (c, n) {
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pliego-escucha__capitulo';
        b.dataset.inicio = c.inicio;
        b.innerHTML = '<span class="pliego-escucha__num">' + String(n + 1).padStart(2, '0') + '</span>' +
          '<span class="pliego-escucha__nombre"></span>' +
          '<span class="pliego-escucha__tiempo">' + minutos(c.palabras, ritmo) + ' min</span>';
        b.querySelector('.pliego-escucha__nombre').textContent = c.titulo;
        b.setAttribute('aria-label', 'Escuchar desde «' + c.titulo + '», ' + minutos(c.palabras, ritmo) + ' minutos');
        li.appendChild(b);
        lista.appendChild(li);
      });
      marcarCapitulo();
    }

    var actual = 0;
    var sonando = false;

    function capituloDe(i) {
      var n = -1;
      capitulos.forEach(function (c, k) { if (c.inicio <= i) n = k; });
      return n;
    }

    function marcarCapitulo() {
      var n = capituloDe(actual);
      lista.querySelectorAll('.pliego-escucha__capitulo').forEach(function (b, k) {
        if (k === n) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      ahora.textContent = n < 0 ? 'Titular y entradilla' : 'Capítulo ' + (n + 1) + ' · ' + capitulos[n].titulo;
    }

    function marcar() {
      piezas.forEach(function (el, i) { el.classList.toggle('is-leyendo', sonando && i === actual); });
      articulo.classList.toggle('is-escuchando', sonando);
      boton.setAttribute('aria-pressed', String(sonando));
      boton.setAttribute('aria-label', sonando ? 'Pausar' : 'Escuchar');
      var hecho = palabras.slice(0, actual).reduce(function (a, b) { return a + b; }, 0);
      var valor = Math.round(hecho / totalPalabras * 100);
      progreso.value = valor;
      progreso.textContent = valor + ' %';
      marcarCapitulo();
      if (sonando) {
        var caja = piezas[actual].getBoundingClientRect();
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (caja.top < 80 || caja.bottom > window.innerHeight - 160) {
          piezas[actual].scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
        }
      }
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = sonando ? 'playing' : 'paused';
    }

    function vozEspanola() {
      var voces = voz.getVoices();
      return voces.filter(function (v) { return /^es(-ES)?$/i.test(v.lang) || v.lang === 'es-ES'; })[0] ||
        voces.filter(function (v) { return /^es/i.test(v.lang); })[0] || null;
    }

    function decir(i) {
      if (i >= piezas.length) { parar(); actual = 0; marcar(); ahora.textContent = 'Fin del artículo'; return; }
      actual = i;
      var frase = new SpeechSynthesisUtterance(textos[i]);
      frase.lang = 'es-ES';
      var v = vozEspanola();
      if (v) frase.voice = v;
      frase.rate = parseFloat(velocidad.value) || 1;
      frase.onend = function () { if (sonando && actual === i) decir(i + 1); };
      voz.cancel();
      voz.speak(frase);
      marcar();
    }

    function reproducir(desde) { sonando = true; decir(typeof desde === 'number' ? desde : actual); }
    function parar() { sonando = false; if (voz) voz.cancel(); marcar(); }

    if (!voz || typeof SpeechSynthesisUtterance === 'undefined') {
      aviso.textContent = 'Este navegador no puede leer en voz alta. Prueba con otro navegador o desde el móvil.';
      boton.disabled = true;
      reproductor.querySelectorAll('[data-escucha]').forEach(function (b) { b.disabled = true; });
      pintarDuraciones();
      return;
    }

    reproductor.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.escucha === 'reproducir') { if (sonando) parar(); else reproducir(); }
      if (b.dataset.escucha === 'anterior') { var a = Math.max(0, actual - 1); if (sonando) reproducir(a); else { actual = a; marcar(); } }
      if (b.dataset.escucha === 'siguiente') { var s = Math.min(piezas.length - 1, actual + 1); if (sonando) reproducir(s); else { actual = s; marcar(); } }
      if (b.dataset.inicio) reproducir(parseInt(b.dataset.inicio, 10));
    });

    velocidad.addEventListener('change', function () {
      pintarDuraciones();
      if (sonando) reproducir(actual);
    });

    // Al salir del modo o de la cuota Mecenas, la voz se calla
    new MutationObserver(function () {
      var activo = raiz.getAttribute('data-lectura') === 'escucha' && raiz.getAttribute('data-cuota') === 'mecenas';
      if (!activo && sonando) parar();
    }).observe(raiz, { attributes: true, attributeFilter: ['data-lectura', 'data-cuota'] });

    window.addEventListener('pagehide', function () { if (voz) voz.cancel(); });

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title: textos[0], artist: 'Pliego', album: 'Edición para mecenas' });
        navigator.mediaSession.setActionHandler('play', function () { reproducir(); });
        navigator.mediaSession.setActionHandler('pause', parar);
        navigator.mediaSession.setActionHandler('nexttrack', function () { var n = capituloDe(actual) + 1; if (capitulos[n]) reproducir(capitulos[n].inicio); });
        navigator.mediaSession.setActionHandler('previoustrack', function () { var n = Math.max(0, capituloDe(actual) - 1); reproducir(capitulos[n] ? capitulos[n].inicio : 0); });
      } catch (e) { /* sin controles del sistema: no pasa nada */ }
    }

    pintarDuraciones();
    marcar();
  }

  function iniciar() {
    iniciarPanel();
    iniciarAnclaje();
    iniciarProgreso();
    iniciarAcciones();
    iniciarBoletin();
    iniciarEscucha();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
