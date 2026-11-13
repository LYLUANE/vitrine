"""Gera um PDF (A4) de cada caso "pronto" em pdf/<slug>.pdf usando Edge ou Chrome headless.

Uso:  python export_pdf.py            (todos os casos prontos)
      python export_pdf.py site-clinica   (só um)

Sobe um servidor local temporário nesta pasta, abre caso.html?slug=... e imprime com o CSS de impressão.
"""
import functools
import http.server
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

AQUI = Path(__file__).resolve().parent
CANDIDATOS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
]


def navegador():
    for c in CANDIDATOS:
        if os.path.isfile(c):
            return c
    for nome in ("msedge", "chrome", "google-chrome", "chromium"):
        p = shutil.which(nome)
        if p:
            return p
    sys.exit("Edge ou Chrome não encontrado.")


def casos_prontos():
    texto = (AQUI / "cases.js").read_text(encoding="utf-8")
    blocos = re.split(r"\n\s*\{", texto)
    slugs = []
    for b in blocos:
        s = re.search(r'slug:\s*"([^"]+)"', b)
        st = re.search(r'status:\s*"([^"]+)"', b)
        if s and st and st.group(1) == "pronto":
            slugs.append(s.group(1))
    return slugs


def porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    slugs = sys.argv[1:] or casos_prontos()
    exe = navegador()
    porta = porta_livre()
    handler = functools.partial(Silencioso, directory=str(AQUI))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", porta), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    saida = AQUI / "pdf"
    saida.mkdir(exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="vitrine_pdf_"))
    ok = 0
    try:
        for slug in slugs:
            alvo_tmp = tmp / f"{slug}.pdf"
            url = f"http://127.0.0.1:{porta}/caso.html?slug={slug}"
            subprocess.run([
                exe, "--headless=new", "--disable-gpu", f"--user-data-dir={tmp / 'perfil'}",
                "--no-pdf-header-footer", "--virtual-time-budget=8000",
                f"--print-to-pdf={alvo_tmp}", url,
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
            if alvo_tmp.exists() and alvo_tmp.stat().st_size > 0:
                shutil.move(str(alvo_tmp), saida / f"{slug}.pdf")
                print(f"ok   pdf/{slug}.pdf")
                ok += 1
            else:
                print(f"falhou  {slug}")
    finally:
        srv.shutdown()
        shutil.rmtree(tmp, ignore_errors=True)
    print(f"{ok}/{len(slugs)} PDFs gerados em {saida}")


if __name__ == "__main__":
    main()
