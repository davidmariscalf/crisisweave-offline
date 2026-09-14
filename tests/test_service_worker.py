from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ServiceWorkerTests(unittest.TestCase):
    def read_sw(self):
        return (ROOT / "sw.js").read_text(encoding="utf-8")

    def test_shell_contains_field_surfaces(self):
        sw = self.read_sw()
        for name in ("index.html", "volunteer.html", "verified.jsonl", "alerts.jsonl", "worksites.jsonl"):
            self.assertIn(name, sw)

    def test_map_dependencies_are_warmed_and_pinned(self):
        sw = self.read_sw()
        self.assertIn("maplibre-gl@5.6.1", sw)
        self.assertIn("demotiles.maplibre.org/style.json", sw)
        self.assertIn("isMapAsset", sw)
        self.assertIn("/maplibre-gl@5.6.1/dist/", sw)

    def test_snapshot_requests_are_network_first(self):
        sw = self.read_sw()
        self.assertIn("networkFirst(request)", sw)
        self.assertIn("isSnapshot(request)", sw)
        self.assertIn("SNAPSHOT_URLS.has(url.href)", sw)

    def test_authenticated_requests_are_never_cache_candidates(self):
        sw = self.read_sw().lower()
        self.assertIn("authorization", sw)
        self.assertIn("hascredentials(request)", sw)
        self.assertNotIn("accept.includes('application/json')", sw)
        self.assertNotIn("searchparams.has('feed')", sw)
        self.assertNotIn("url.origin === self.location.origin || ismapasset", sw)

    def test_private_or_no_store_responses_are_not_cached(self):
        sw = self.read_sw().lower()
        self.assertIn("cachecontrol.includes('no-store')", sw)
        self.assertIn("cachecontrol.includes('private')", sw)
        self.assertIn("response.headers.get('set-cookie')", sw)

    def test_only_explicit_same_origin_shell_is_cache_first(self):
        sw = self.read_sw()
        self.assertIn("SHELL_URLS.has(url.href)", sw)
        self.assertIn("isShellAsset(request)", sw)


if __name__ == "__main__":
    unittest.main()
