#!/usr/bin/env python3
"""Local server for the path-routed site and its prerendered SEO pages."""
import http.server
import json
import mimetypes
import os
import re
import socket
import sys
import xml.etree.ElementTree as ET
from urllib.parse import quote, unquote, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PORT = 7076
# This is a local development server; binding loopback keeps it off the LAN.
HOST = "127.0.0.1"
mimetypes.add_type("image/webp", ".webp")


def find_free_port(preferred, probes=100):
    """İstenen port doluysa bir sonraki boş portu bulur."""
    for port in range(preferred, preferred + probes):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server_socket:
            server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                server_socket.bind((HOST, port))
                return port
            except OSError:
                continue
    return preferred  # yedek: bırak hata versin


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def local_full_path(self):
        """Use the static handler's URL decoding and traversal handling."""
        return self.translate_path(self.path)

    def request_path(self):
        """Return a decoded, normalized URL path without a trailing slash."""
        path = unquote(urlparse(self.path).path).replace("\\", "/")
        if not path.startswith("/"):
            path = "/" + path
        if any(part in (".", "..") for part in path.split("/")):
            return None
        return path.rstrip("/") or "/"

    def has_extension(self):
        path = unquote(urlparse(self.path).path)
        last = path.rstrip("/").split("/")[-1] or ""
        return "." in last

    def seo_root(self):
        return os.path.join(ROOT, "seo-pages")

    def safe_seo_file(self, route):
        """Map a validated route to its generated index file, if present."""
        if route is None or any(part in (".", "..") for part in route.split("/")):
            return None
        route_parts = [part for part in route.strip("/").split("/") if part]
        candidate = os.path.join(self.seo_root(), *route_parts, "index.html")
        try:
            if os.path.commonpath((self.seo_root(), os.path.abspath(candidate))) != os.path.abspath(self.seo_root()):
                return None
        except ValueError:
            return None
        return candidate if os.path.isfile(candidate) else None

    def route_metadata(self):
        """Read generated routes and aliases on every request so builds are visible immediately."""
        routes = set()
        aliases = {}
        manifest_path = os.path.join(self.seo_root(), "manifest.json")
        try:
            with open(manifest_path, encoding="utf-8") as manifest_file:
                manifest = json.load(manifest_file)
            for route in manifest.get("routes", []):
                normalized = self.normalize_manifest_route(route)
                if normalized is not None:
                    routes.add(normalized)
            manifest_aliases = manifest.get("aliases", {})
            if isinstance(manifest_aliases, dict):
                for alias, canonical in manifest_aliases.items():
                    alias_path = self.normalize_manifest_route(alias)
                    canonical_path = self.normalize_manifest_route(canonical)
                    if alias_path and canonical_path and alias_path != canonical_path:
                        aliases[alias_path] = canonical_path
        except (OSError, ValueError, TypeError, AttributeError):
            routes = set()
            aliases = {}

        aliases = {alias: canonical for alias, canonical in aliases.items() if canonical in routes}
        routes.update(aliases)

        if routes:
            return routes, aliases

        # Before prerender output exists, sitemap routes define known public pages.
        sitemap_path = os.path.join(ROOT, "sitemap.xml")
        try:
            sitemap = ET.parse(sitemap_path).getroot()
            for element in sitemap.iter():
                if element.tag.rsplit("}", 1)[-1] == "loc" and element.text:
                    route = self.normalize_manifest_route(urlparse(element.text.strip()).path)
                    if route is not None:
                        routes.add(route)
        except (OSError, ET.ParseError):
            pass
        return routes, aliases

    @staticmethod
    def normalize_manifest_route(route):
        if not isinstance(route, str):
            return None
        path = unquote(route).replace("\\", "/")
        if not path.startswith("/") or any(part in (".", "..") for part in path.split("/")):
            return None
        return path.rstrip("/") or "/"

    def numeric_blog_alias_is_valid(self, route, routes):
        match = re.fullmatch(r"/blog/(\d+)", route or "")
        if not match:
            return False
        blog_count = sum(1 for item in routes if item.startswith("/blog/") and item != "/blog" and not re.fullmatch(r"/blog/\d+", item))
        return int(match.group(1)) < blog_count

    def send_file_with_status(self, file_path, status, head_only):
        """Serve a generated not-found document with an actual 404 response."""
        with open(file_path, "rb") as source:
            stat = os.fstat(source.fileno())
            self.send_response(status)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(stat.st_size))
            self.send_header("Last-Modified", self.date_time_string(stat.st_mtime))
            self.end_headers()
            if not head_only:
                self.copyfile(source, self.wfile)

    def redirect_to_clean_route(self, route):
        query = urlparse(self.path).query
        location = quote(route, safe="/-._~")
        if query:
            location += "?" + query
        self.send_response(301)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def dispatch_request(self, head_only=False):
        path_info = urlparse(self.path).path
        route = self.request_path()
        full_path = self.local_full_path()
        seo_root = os.path.abspath(self.seo_root())

        # Avoid duplicate home URLs and give the explicit not-found URL a 404 status.
        if route == "/index.html":
            self.redirect_to_clean_route("/")
            return
        if route == "/404.html":
            not_found = os.path.join(self.seo_root(), "404.html")
            if not os.path.isfile(not_found):
                not_found = os.path.join(ROOT, "404.html")
            self.send_file_with_status(not_found, 404, head_only)
            return

        # Generated internals are addressable only through their public routes.
        try:
            is_seo_internal = os.path.commonpath((seo_root, os.path.abspath(full_path))) == seo_root
        except ValueError:
            is_seo_internal = False
        if is_seo_internal:
            self.send_error(404, "Not Found")
            return

        # Keep ordinary files and standalone directory indexes working as before.
        # The project root is special: a generated home page takes precedence.
        if os.path.isfile(full_path):
            (super().do_HEAD if head_only else super().do_GET)()
            return
        if route != "/" and os.path.isfile(os.path.join(full_path, "index.html")):
            (super().do_HEAD if head_only else super().do_GET)()
            return

        # A trailing slash on a public route canonicalizes to its clean URL.
        if route and route != "/" and path_info.endswith("/"):
            routes, aliases = self.route_metadata()
            if route in aliases:
                self.redirect_to_clean_route(aliases[route])
                return
            if route in routes or self.numeric_blog_alias_is_valid(route, routes):
                self.redirect_to_clean_route(route)
                return

        if route and (not self.has_extension()):
            routes, aliases = self.route_metadata()
            if route in aliases:
                self.redirect_to_clean_route(aliases[route])
                return
            route_is_valid = route in routes or self.numeric_blog_alias_is_valid(route, routes)
            if route_is_valid:
                generated = self.safe_seo_file(route)
                if generated:
                    relative = os.path.relpath(generated, ROOT).replace(os.sep, "/")
                    original_path = self.path
                    self.path = "/" + quote(relative, safe="/-._~")
                    try:
                        (super().do_HEAD if head_only else super().do_GET)()
                    finally:
                        self.path = original_path
                    return

                # Valid route without prerender output: let the client router render it.
                self.path = "/index.html"
                try:
                    (super().do_HEAD if head_only else super().do_GET)()
                finally:
                    self.path = path_info
                return

            not_found = os.path.join(self.seo_root(), "404.html")
            if os.path.isfile(not_found):
                self.send_file_with_status(not_found, 404, head_only)
            else:
                # Keep the shell body useful while preserving the correct HTTP status.
                self.send_file_with_status(os.path.join(ROOT, "index.html"), 404, head_only)
            return

        self.send_error(404, "Not Found")

    def do_GET(self):
        self.dispatch_request(head_only=False)

    def do_HEAD(self):
        self.dispatch_request(head_only=True)

    def log_message(self, fmt, *args):
        sys.stderr.write("[serve] %s - %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    os.chdir(ROOT)
    default_port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    target = find_free_port(default_port)
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer((HOST, target), SPAHandler) as httpd:
        note = "" if target == default_port else "  [istenen %d portu dolu -> %d kullanıldı]" % (default_port, target)
        print("=" * 60)
        print(" Probiyom yerel sunucusu calisiyor (%s)" % note)
        print("    Ana Sayfa      : http://localhost:%d/" % target)
        print("    Blog           : http://localhost:%d/blog" % target)
        print("    Urunler        : http://localhost:%d/products" % target)
        print("    Iletisim       : http://localhost:%d/contact" % target)
        print("    Yenilemede alt rotalar ayni URL'de acilir.")
        print("    Durdurmak icin : Ctrl + C")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nSunucu kapatildi.")
