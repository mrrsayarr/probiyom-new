#!/usr/bin/env python3
"""
Probiyom - Yerel Geliştirme Sunucusu (SPA Fallback)

python -m http.server 'in aksine, bu sunucu yol tabanlı (hash'siz) routern
için gerekli SPA fallback'ini sağlar:

  * Gerçek bir dosya istendiğinde (images/, styles/, data/, pages/...): dosyayı döndürür.
  * Temiz bir rota istendiğinde (/blog/<slug>, /products/<slug>, /about, /faq...):
    index.html'i döndürür. Router (scripts/router.js) adres çubuğundaki gerçek
    yolu okuyup doğru sayfayı çizer. Böylece sayfa yenilenince 404 çıkmaz.

Kullanım:
    python serve.py            # 7076 portunda çalışır
    python serve.py 8080       # istediğiniz port
"""
import http.server
import os
import socket
import sys
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PORT = 7076
# This is a local development server; binding loopback keeps it off the LAN.
HOST = "127.0.0.1"


def find_free_port(preferred, probes=100):
    """İstenen port doluysa bir sonraki boş portu bulur (başka sunucularla çakışmayı önler)."""
    for p in range(preferred, preferred + probes):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind((HOST, p))
                return p
            except OSError:
                continue
    return preferred  # yedek: bırak hata versin


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def local_full_path(self):
        """Use the same decoding and traversal handling as the static handler."""
        return self.translate_path(self.path)

    def has_extension(self):
        p = urlparse(self.path).path
        last = p.rstrip("/").split("/")[-1] or ""
        return "." in last

    def do_GET(self):
        full = self.local_full_path()

        # 1) Gerçek dosya varsa normal şekilde servis et
        if os.path.isfile(full):
            super().do_GET()
            return

        # 2) Temiz (uzantısız) rota ise -> SPA fallback: index.html'i döndür.
        #    URL tarayıcıda aynı kalır; router gerçek yolu okuyup sayfayı çizer.
        if not self.has_extension():
            self.path = "/"
            super().do_GET()
            return

        # 3) Var olmayan bir varlık (ör. kayıp görsel) -> gerçek 404 döndür
        super().send_error(404, "Not Found")

    def do_HEAD(self):
        """Match GET routing while allowing the base handler to omit the body."""
        full = self.local_full_path()

        if os.path.isfile(full):
            super().do_HEAD()
            return

        if not self.has_extension():
            self.path = "/"
            super().do_HEAD()
            return

        super().send_error(404, "Not Found")

    # Basit log çıktısı (hangi isteğin fallback yediğini görebilmek için)
    def log_message(self, fmt, *args):
        sys.stderr.write("[serve] %s - %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    os.chdir(ROOT)
    default_port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    handler = SPAHandler
    # İstenen port doluysa (ör. eski python -m http.server hâlâ çalışıyorsa)
    # otomatik olarak bir sonraki BOŞ portu seçip kullanır.
    target = find_free_port(default_port)
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer((HOST, target), handler) as httpd:
        note = "" if target == default_port else "  [istenen %d portu dolu -> %d kullanıldı]" % (default_port, target)
        print("=" * 60)
        print(" Probiyom yerel sunucusu calisiyor (%s)" % note)
        print("    Ana Sayfa      : http://localhost:%d/" % target)
        print("    Blog           : http://localhost:%d/blog" % target)
        print("    Urunler        : http://localhost:%d/products" % target)
        print("    Iletisim       : http://localhost:%d/contact" % target)
        print("    BurASI URL'yi tarayiciya yapistirin. Yenilemede / kopyala-yapistirda 404 CIKMAZ.")
        print("    Durdurmak icin : Ctrl + C")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nSunucu kapatildi.")
