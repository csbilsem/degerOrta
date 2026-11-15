#!/usr/bin/env python3
"""Geliştirme sunucusu: dosyaları önbelleğe aldırmadan sunar.

Kullanım: python3 sunucu.py [port]   (varsayılan port 8000)
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Isleyici(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Kalbin Kahramanları: http://localhost:{port}")
    ThreadingHTTPServer(("", port), Isleyici).serve_forever()
