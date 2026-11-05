#!/usr/bin/env python3
"""Local dev server for FORGOTTEN BADGE.

Run:  python3 _serve.py   then open http://localhost:8040
      Sketch pad:          http://localhost:8040/sketch.html   (pen + paper → sketches/<page>.png)
      Map editor:          http://localhost:8040/editor.html

- No caching, so every reload shows the latest code.
- The map editor saves through POST /api/map/<level> → maps/<level>.json
  and POST /api/ref/<level> → maps/<level>-reference.<png|jpg> (the image you traced over).
"""
import base64, http.server, json, os, re, socketserver

PORT = 8040
ROOT = os.path.dirname(os.path.abspath(__file__))
MAPS = os.path.join(ROOT, 'maps')
os.chdir(ROOT)
NAME = re.compile(r'^[a-z0-9_-]{1,40}$')


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def log_message(self, *a):
        pass

    def reply(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        m = re.match(r'^/api/(map|ref|sketch)/([^/?]+)$', self.path)
        if not m or not NAME.match(m.group(2)):
            return self.reply(404, {'ok': False, 'error': 'unknown endpoint'})
        kind, name = m.groups()
        length = int(self.headers.get('Content-Length', 0))
        if length > 25 * 1024 * 1024:
            return self.reply(413, {'ok': False, 'error': 'too large'})
        try:
            data = json.loads(self.rfile.read(length))
        except Exception:
            return self.reply(400, {'ok': False, 'error': 'bad json'})
        os.makedirs(MAPS, exist_ok=True)
        if kind == 'map':
            rows = data.get('rows')
            if not isinstance(rows, list) or not all(isinstance(r, str) for r in rows):
                return self.reply(400, {'ok': False, 'error': 'rows missing'})
            path = os.path.join(MAPS, f'{name}.json')
            tmp = path + '.tmp'
            with open(tmp, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=1)
            os.replace(tmp, path)
        else:
            m2 = re.match(r'^data:image/(png|jpeg);base64,(.+)$', data.get('image', ''), re.S)
            if not m2:
                return self.reply(400, {'ok': False, 'error': 'png or jpg only'})
            ext = 'png' if m2.group(1) == 'png' else 'jpg'
            if kind == 'sketch':
                folder = os.path.join(ROOT, 'sketches'); os.makedirs(folder, exist_ok=True)
                path = os.path.join(folder, f'{name}.{ext}')
            else:
                path = os.path.join(MAPS, f'{name}-reference.{ext}')
            with open(path, 'wb') as f:
                f.write(base64.b64decode(m2.group(2)))
        return self.reply(200, {'ok': True, 'file': os.path.relpath(path, ROOT)})


socketserver.TCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(('', PORT), Handler) as s:
    print(f'FORGOTTEN BADGE → http://localhost:{PORT}   ·   sketch pad → http://localhost:{PORT}/sketch.html')
    s.serve_forever()
