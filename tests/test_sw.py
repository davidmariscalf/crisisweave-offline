from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class OfflineShellTests(unittest.TestCase):
    def test_map_runtime_is_same_origin_shell_content(self):
        sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn("'./vendor/maplibre-gl.css'", sw)
        self.assertIn("'./vendor/maplibre-gl.js'", sw)
        self.assertIn("'./vendor/MAPLIBRE_LICENSE.txt'", sw)
        self.assertNotIn("CRITICAL_EXTERNAL", sw)
        self.assertNotIn("unpkg.com", sw)

    def test_snapshot_feeds_stay_network_first(self):
        sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn("if (isSnapshot(request))", sw)
        self.assertIn("event.respondWith(networkFirst(request))", sw)


if __name__ == "__main__":
    unittest.main()
