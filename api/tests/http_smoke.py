"""Smoke HTTP sem banco: servidor efêmero somente em loopback."""
import json
import socket
import subprocess
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

root = Path(__file__).resolve().parents[2]
with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]
process = subprocess.Popen(['php', '-S', f'127.0.0.1:{port}', '-t', str(root)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
base = f'http://127.0.0.1:{port}/api/'

def request(path, method='GET', origin=None, body=None):
    headers = {'Content-Type': 'application/json'}
    if origin:
        headers['Origin'] = origin
    req = Request(base + path, data=body, method=method, headers=headers)
    try:
        response = urlopen(req, timeout=3)
    except HTTPError as error:
        response = error
    with response:
        content = response.read()
        return response.status, response.headers, json.loads(content) if content else None

try:
    for _ in range(30):
        try:
            request('auth/me.php')
            break
        except URLError:
            time.sleep(0.1)
    status, headers, body = request('auth/me.php')
    assert status == 401 and body['status'] == 'error' and body['data'] is None
    assert 'timestamp' in body and 'no-store' in headers['Cache-Control']
    status, headers, body = request('auth/me.php', 'OPTIONS', 'https://app.therafinancial.com.br')
    assert status == 204 and headers['Access-Control-Allow-Origin'] == 'https://app.therafinancial.com.br'
    status, _, _ = request('auth/me.php', origin='https://hostile.example')
    assert status == 403
    status, _, _ = request('auth/login.php')
    assert status == 405
    status, _, _ = request('auth/login.php', 'POST', body=b'{invalid')
    assert status == 400
    for path in ['advisory/timesheet.php', 'advisory/faturamento.php', 'advisory/kanban.php', 'advisory/despesas.php', 'flow/documentos.php', 'flow/alcadas.php', 'flow/anexo.php', 'flow/notificacoes.php', 'flow/cadastros.php?tipo=fornecedores', 'clientes.php']:
        status, _, _ = request(path)
        assert status == 401, (path, status)
    status, _, _ = request('institucional.php', 'POST', body=b'{}')
    assert status == 401, ('institucional.php POST', status)
    print('Smoke HTTP passou: autenticação, CORS, métodos e JSON inválido.')
finally:
    process.terminate()
    process.wait(timeout=5)
