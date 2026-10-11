import http.client
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
        with open(os.path.join(self.temp_dir.name, "index.html"), "w", encoding="utf-8") as page:
            page.write("<main>home</main>")
        with open(os.path.join(self.temp_dir.name, "asset name.txt"), "w", encoding="utf-8") as asset:
            asset.write("asset body")

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), serve.SPAHandler)
        self.server_thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.server_thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.server_thread.join()
        self.root_patch.stop()
        self.temp_dir.cleanup()

    def request(self, method, path):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port)
        connection.request(method, path)
        response = connection.getresponse()
        result = response.status, response.getheader("Content-Length"), response.read()
        connection.close()
        return result

    def test_head_clean_route_matches_get_metadata_without_body(self):
        get_status, get_length, get_body = self.request("GET", "/blog/sample")
        head_status, head_length, head_body = self.request("HEAD", "/blog/sample")

        self.assertEqual((get_status, head_status), (200, 200))
        self.assertEqual(head_length, get_length)
        self.assertEqual(get_body, b"<main>home</main>")
        self.assertEqual(head_body, b"")

    def test_encoded_asset_path_is_served_and_missing_asset_is_404_for_head(self):
        status, _, body = self.request("GET", "/asset%20name.txt?download=1")
        head_status, _, head_body = self.request("HEAD", "/missing.png")

        self.assertEqual(status, 200)
        self.assertEqual(body, b"asset body")
        self.assertEqual(head_status, 404)
        self.assertEqual(head_body, b"")


if __name__ == "__main__":
    unittest.main()
