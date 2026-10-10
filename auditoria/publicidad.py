"""Auditoría de posiciones de la publicidad en Pliego: modo × cuota × ancho × página × scroll.
Uso: python3 auditoria/publicidad.py   (fuentes: ver auditoria.py)"""
import asyncio, os, json, collections, http.server, socketserver, threading, functools
from playwright.async_api import async_playwright

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..'))
GF = os.environ.get('PLIEGO_FUENTES', os.path.join(AQUI, 'fuentes'))
CSS = ('@font-face{font-family:"Roboto Serif";src:url("https://gf.local/roboto-serif-latin-full-normal.woff2");font-weight:100 900;font-stretch:50% 150%;font-display:block}'
       '@font-face{font-family:"Roboto Serif";font-style:italic;src:url("https://gf.local/roboto-serif-latin-full-italic.woff2");font-weight:100 900;font-stretch:50% 150%;font-display:block}')
JS = open(os.path.join(AQUI, 'publicidad.js')).read()

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except Exception: pass

srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Q, directory=RAIZ))
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

MODOS = ['diario', 'facil', 'reportaje', 'edicion', 'expres', 'contexto', 'escucha']
CUOTAS = ['abierto', 'lector', 'habitual']
VISTAS = [(390, 844), (834, 1112), (1280, 800), (1920, 1080), (1366, 640)]
PAGINAS = ['index.html', 'articulo.html']
TRAMOS = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1]

async def main():
    hall = collections.defaultdict(list)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for (ancho, alto) in VISTAS:
            ctx = await b.new_context(viewport={'width': ancho, 'height': alto})
            await ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(status=200, content_type="text/css", body=CSS))
            async def fuente(r):
                await r.fulfill(status=200, content_type="font/woff2", body=open(os.path.join(GF, r.request.url.split('gf.local/')[1]), 'rb').read(), headers={'access-control-allow-origin': '*'})
            await ctx.route("https://gf.local/**", fuente)
            pg = await ctx.new_page()
            await pg.goto(f'http://127.0.0.1:{PORT}/index.html')
            for modo in MODOS:
                for cuota in CUOTAS:
                    for pagina in PAGINAS:
                        await pg.evaluate(f"localStorage.setItem('pliego:lectura','{modo}');localStorage.setItem('pliego:cuota','{cuota}');localStorage.setItem('pliego:mapa','no');sessionStorage.clear()")
                        await pg.goto(f'http://127.0.0.1:{PORT}/{pagina}')
                        await pg.evaluate("document.fonts.ready")
                        await pg.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')")
                        await pg.wait_for_timeout(350)  # deja terminar la entrada del anclaje
                        for t in TRAMOS:
                            await pg.evaluate(f"window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * {t})")
                            await pg.wait_for_timeout(40)
                            for h in await pg.evaluate(JS):
                                hall[(h['tipo'], h['sel'])].append(f"{modo}/{cuota}/{ancho}x{alto}/{pagina[:3]}@{int(t*100)}% · {h['det']}")
            await ctx.close()
        await b.close()
    salida = [dict(tipo=k[0], sel=k[1], n=len(v), ejemplos=sorted(set(v))[:6]) for k, v in sorted(hall.items(), key=lambda kv: -len(kv[1]))]
    json.dump(salida, open(os.path.join(AQUI, 'publicidad.json'), 'w'), ensure_ascii=False, indent=1)
    print(f"{len(salida)} tipos · {sum(s['n'] for s in salida)} casos")
    for s in salida:
        print(f"[{s['n']:4}] {s['tipo']:<22} {s['sel']:<34} {s['ejemplos'][0]}")

asyncio.run(main())
