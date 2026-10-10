"""Auditoría de Pliego: modo × cuota × ancho × página × tema.
Mide alineaciones, tamaños de etiquetas, cabecera, filas de botones, desbordes,
cuerpo mínimo, objetivos táctiles y contraste. Uso: python3 auditoria.py [rapida]"""
import asyncio, os, sys, json, http.server, socketserver, threading, functools, collections
from playwright.async_api import async_playwright

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
GF = os.environ.get('PLIEGO_FUENTES', os.path.join(os.path.dirname(__file__), 'fuentes'))  # carpeta con roboto-serif-latin-full-{normal,italic}.woff2 (npm @fontsource-variable/roboto-serif)
CSS = ('@font-face{font-family:"Roboto Serif";src:url("https://gf.local/roboto-serif-latin-full-normal.woff2");font-weight:100 900;font-stretch:50% 150%;font-display:block}'
       '@font-face{font-family:"Roboto Serif";font-style:italic;src:url("https://gf.local/roboto-serif-latin-full-italic.woff2");font-weight:100 900;font-stretch:50% 150%;font-display:block}')

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except Exception: pass

srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Q, directory=RAIZ))
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

MODOS = ['diario', 'facil', 'reportaje', 'edicion', 'expres', 'contexto', 'escucha']
CUOTAS = ['abierto', 'lector', 'habitual', 'mecenas']
ANCHOS = [390, 834, 1280, 1600]
PAGINAS = ['index.html', 'articulo.html', 'suscripcion.html']
if len(sys.argv) > 1 and sys.argv[1] == 'rapida':
    CUOTAS = ['abierto', 'mecenas']; ANCHOS = [390, 1280]

JS = open(os.path.join(os.path.dirname(__file__), 'auditoria.js')).read()

async def main():
    hallazgos = collections.defaultdict(list)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for tema in ['light', 'dark']:
            for ancho in ANCHOS:
                ctx = await b.new_context(viewport={'width': ancho, 'height': 900}, color_scheme=tema)
                await ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(status=200, content_type="text/css", body=CSS))
                async def fuente(r):
                    await r.fulfill(status=200, content_type="font/woff2", body=open(os.path.join(GF, r.request.url.split('gf.local/')[1]), 'rb').read(), headers={'access-control-allow-origin': '*'})
                await ctx.route("https://gf.local/**", fuente)
                pg = await ctx.new_page()
                await pg.goto(f'http://127.0.0.1:{PORT}/index.html')
                for modo in MODOS:
                    for cuota in CUOTAS:
                        if tema == 'dark' and cuota in ('lector', 'habitual'):
                            continue
                        for pagina in PAGINAS:
                            if pagina == 'suscripcion.html' and modo in ('contexto', 'escucha'):
                                continue
                            await pg.evaluate(f"localStorage.setItem('pliego:lectura','{modo}');localStorage.setItem('pliego:cuota','{cuota}');localStorage.setItem('pliego:mapa','no');localStorage.setItem('pliego:apariencia','auto');sessionStorage.clear()")
                            await pg.goto(f'http://127.0.0.1:{PORT}/{pagina}')
                            await pg.evaluate("document.fonts.ready")
                            await pg.wait_for_timeout(60)
                            r = await pg.evaluate(JS)
                            for h in r:
                                clave = (h['tipo'], h['sel'])
                                hallazgos[clave].append(dict(modo=modo, cuota=cuota, ancho=ancho, tema=tema, pagina=pagina, det=h['det']))
                await ctx.close()
        await b.close()
    salida = []
    for (tipo, sel), casos in sorted(hallazgos.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        modos = sorted({c['modo'] for c in casos}); anchos = sorted({c['ancho'] for c in casos})
        cuotas = sorted({c['cuota'] for c in casos}); temas = sorted({c['tema'] for c in casos}); pags = sorted({c['pagina'] for c in casos})
        salida.append(dict(tipo=tipo, sel=sel, n=len(casos), modos=modos, cuotas=cuotas, anchos=anchos, temas=temas, paginas=pags, ejemplo=casos[0]))
    json.dump(salida, open(os.path.join(os.path.dirname(__file__), 'auditoria.json'), 'w'), ensure_ascii=False, indent=1)
    print(f"{len(salida)} tipos de hallazgo · {sum(s['n'] for s in salida)} casos")
    for s in salida[:80]:
        e = s['ejemplo']
        print(f"[{s['n']:4}] {s['tipo']:<14} {s['sel'][:60]:<60} modos={','.join(m[:3] for m in s['modos'])} anchos={s['anchos']} pág={','.join(x[:3] for x in s['paginas'])} · {e['det']} ({e['modo']}/{e['cuota']}/{e['ancho']}/{e['tema']}/{e['pagina'][:3]})")

asyncio.run(main())
