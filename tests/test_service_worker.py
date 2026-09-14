from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ServiceWorkerTests(unittest.TestCase):
    def test_shell_contains_field_surfaces(self):
        sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        for name in ("index.html", "volunteer.html", "verified.jsonl", "alerts.jsonl", "worksites.jsonl"):
            self.assertIn(name, sw)

    def test_map_dependencies_are_warmed(self):
        sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn("maplibre-gl@5.6.1", sw)
        self.assertIn("demotiles.maplibre.org/style.json", sw)
        self.assertIn("isMapAsset", sw)

    def test_snapshot_requests_are_network_first(self):
        sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn("networkFirst(request)", sw)
        self.assertIn("isSnapshot(request)", sw)


if __name__ == "__main__":
    unittest.main()
