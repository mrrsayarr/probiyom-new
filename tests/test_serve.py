import http.client
import json
import os
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from unittest.mock import patch

import serve


class SPAServerTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root_patch = patch.object(serve, "ROOT", self.temp_dir.name)
        self.root_patch.start()
        self.seo_dir = os.path.join(self.temp_dir.name, "seo-pages")
        os.mkdir(self.seo_dir)
        self.manifest_path = os.path.join(self.seo_dir, "manifest.json")
        self.write_manifest(
            ["/", "/about", "/blog/sample", "/blog/other"],
            {"/blog/0": "/blog/sample", "/blog/1": "/blog/other"},
        )

        with open(os.path.join(self.temp_dir.name, "index.html"), "w", encoding="utf-8") as page:
            page.write("<main>home shell</main>")
        with open(os.path.join(self.temp_dir.name, "asset name.txt"), "w", encoding="utf-8") as asset:
            asset.write("asset body")
        with open(os.path.join(self.temp_dir.name, "404.html"), "w", encoding="utf-8") as page:
            page.write("<main>legacy not found</main>")

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), serve.SPAHandler)
        self.server_thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.server_thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.server_thread.join()
        self.root_patch.stop()
        self.temp_dir.cleanup()

    def write_manifest(self, routes, aliases=None):
        with open(self.manifest_path, "w", encoding="utf-8") as manifest:
            json.dump({"routes": routes, "aliases": aliases or {}}, manifest)

    def write_page(self, route, content):
        directory = os.path.join(self.seo_dir, *[part for part in route.strip("/").split("/") if part])
        os.makedirs(directory, exist_ok=True)
        with open(os.path.join(directory, "index.html"), "w", encoding="utf-8") as page:
            page.write(content)

    def request(self, method, path):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port)
        connection.request(method, path)
        response = connection.getresponse()
        result = response.status, response.getheader("Content-Length"), response.getheader("Location"), response.read()
        connection.close()
        return result

    def test_known_route_uses_generated_html_and_head_matches_get(self):
        self.write_page("/", "<main>prerendered home</main>")
        self.write_page("/about", "<main>prerendered about</main>")

        home_status, _, _, home_body = self.request("GET", "/")

        get_status, get_length, _, get_body = self.request("GET", "/about")
        head_status, head_length, _, head_body = self.request("HEAD", "/about")

        self.assertEqual((get_status, head_status), (200, 200))
        self.assertEqual(home_status, 200)
        self.assertEqual(home_body, b"<main>prerendered home</main>")
        self.assertEqual(get_length, head_length)
        self.assertEqual(get_body, b"<main>prerendered about</main>")
        self.assertEqual(head_body, b"")

    def test_sitemap_validates_routes_before_manifest_exists(self):
        os.remove(self.manifest_path)
        with open(os.path.join(self.temp_dir.name, "sitemap.xml"), "w", encoding="utf-8") as sitemap:
            sitemap.write("""<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
              <url><loc>https://www.probiyom.com/about</loc></url>
              <url><loc>https://www.probiyom.com/blog/sample</loc></url>
            </urlset>""")

        known_status, _, _, known_body = self.request("GET", "/about")
        unknown_status, _, _, _ = self.request("GET", "/unlisted")

        self.assertEqual(known_status, 200)
        self.assertEqual(known_body, b"<main>home shell</main>")
        self.assertEqual(unknown_status, 404)

    def test_trailing_slash_redirects_to_clean_public_route(self):
        status, length, location, body = self.request("GET", "/about/?campaign=one")
        self.assertEqual(status, 301)
        self.assertEqual(location, "/about?campaign=one")
        self.assertEqual(length, "0")
        self.assertEqual(body, b"")

    def test_manifest_blog_aliases_redirect_to_canonical_slug_and_preserve_query(self):
        status, length, location, body = self.request("GET", "/blog/0?source=legacy")
        self.assertEqual(status, 301)
        self.assertEqual(location, "/blog/sample?source=legacy")
        self.assertEqual(length, "0")
        self.assertEqual(body, b"")

        slash_status, _, slash_location, _ = self.request("GET", "/blog/0/?source=legacy")
        self.assertEqual(slash_status, 301)
        self.assertEqual(slash_location, "/blog/sample?source=legacy")

    def test_index_html_redirects_home_and_explicit_404_has_404_status(self):
        index_status, index_length, index_location, index_body = self.request("GET", "/index.html?source=legacy")
        self.assertEqual(index_status, 301)
        self.assertEqual(index_location, "/?source=legacy")
        self.assertEqual(index_length, "0")
        self.assertEqual(index_body, b"")

        status, _, _, body = self.request("GET", "/404.html")
        head_status, head_length, _, head_body = self.request("HEAD", "/404.html")
        self.assertEqual(status, 404)
        self.assertEqual(body, b"<main>legacy not found</main>")
        self.assertEqual(head_status, 404)
        self.assertEqual(head_length, str(len(body)))
        self.assertEqual(head_body, b"")

    def test_unknown_extensionless_route_returns_real_404_document_or_shell(self):
        status, _, _, body = self.request("GET", "/not-a-route")
        head_status, head_length, _, head_body = self.request("HEAD", "/not-a-route")
        self.assertEqual(status, 404)
        self.assertEqual(body, b"<main>home shell</main>")
        self.assertEqual(head_status, 404)
        self.assertEqual(head_length, str(len(body)))
        self.assertEqual(head_body, b"")

        with open(os.path.join(self.seo_dir, "404.html"), "w", encoding="utf-8") as page:
            page.write("<main>rendered not found</main>")
        status, _, _, body = self.request("GET", "/still-not-a-route")
        self.assertEqual(status, 404)
        self.assertEqual(body, b"<main>rendered not found</main>")

    def test_manifest_is_read_again_after_server_starts(self):
        self.write_manifest(["/", "/about", "/blog/sample", "/blog/other", "/contact"])
        self.write_page("/contact", "<main>newly generated</main>")

        status, _, _, body = self.request("GET", "/contact")

        self.assertEqual(status, 200)
        self.assertEqual(body, b"<main>newly generated</main>")

    def test_numeric_blog_alias_out_of_range_is_404(self):
        valid_status, _, _, valid_body = self.request("GET", "/blog/1")
        invalid_status, _, _, _ = self.request("GET", "/blog/2")

        self.assertEqual(valid_status, 301)
        self.assertEqual(valid_body, b"")
        self.assertEqual(invalid_status, 404)

    def test_existing_assets_and_standalone_directory_index_are_preserved(self):
        status, _, _, body = self.request("GET", "/asset%20name.txt?download=1")
        self.assertEqual(status, 200)
        self.assertEqual(body, b"asset body")

        tool_dir = os.path.join(self.temp_dir.name, "st")
        os.mkdir(tool_dir)
        with open(os.path.join(tool_dir, "index.html"), "w", encoding="utf-8") as page:
            page.write("<main>quote tool</main>")
        status, _, _, body = self.request("GET", "/st/")
        head_status, head_length, _, head_body = self.request("HEAD", "/st/")
        self.assertEqual(status, 200)
        self.assertEqual(body, b"<main>quote tool</main>")
        self.assertEqual(head_status, 200)
        self.assertEqual(head_length, str(len(body)))
        self.assertEqual(head_body, b"")

    def test_webp_assets_have_image_content_type(self):
        with open(os.path.join(self.temp_dir.name, "slide.webp"), "wb") as image:
            image.write(b"RIFFtestWEBP")
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port)
        connection.request("GET", "/slide.webp")
        response = connection.getresponse()
        self.assertEqual(response.status, 200)
        self.assertEqual(response.getheader("Content-Type"), "image/webp")
        response.read()
        connection.close()


if __name__ == "__main__":
    unittest.main()
