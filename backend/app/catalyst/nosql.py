"""
NoSQL service — for flexible, schema-less CCTV/sensor metadata that doesn't
belong in the official 28-table relational schema.

Local provider: a real JSON-document store, keyed by an arbitrary string id,
persisted to a single local JSON file (schema-less on purpose — callers can
put any dict shape in). This is genuine read/write behaviour, just backed by
disk instead of a managed NoSQL engine, so it's registered SIMULATED_LOCAL.
No CCTV/sensor feed exists in this project to populate it with real data, so
it isn't wired to a live route.

Catalyst equivalent: Catalyst NoSQL (a managed document store) behind the
same put(collection, id, doc) / get(collection, id) contract.
"""
import json
import os
import threading

from app.catalyst.base import ServiceInfo, ServiceTier, register

_STORE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "evidence_storage", "nosql_store.json")


class LocalNoSQLStore:
    def __init__(self, path: str = _STORE_PATH):
        self.path = os.path.abspath(path)
        self._lock = threading.Lock()

    def _read_all(self) -> dict:
        if not os.path.exists(self.path):
            return {}
        with open(self.path, "r") as f:
            return json.load(f)

    def put(self, collection: str, doc_id: str, doc: dict) -> None:
        with self._lock:
            data = self._read_all()
            data.setdefault(collection, {})[doc_id] = doc
            os.makedirs(os.path.dirname(self.path), exist_ok=True)
            with open(self.path, "w") as f:
                json.dump(data, f, default=str)

    def get(self, collection: str, doc_id: str) -> dict | None:
        return self._read_all().get(collection, {}).get(doc_id)


nosql_store = LocalNoSQLStore()

register(ServiceInfo(
    key="nosql",
    name="NoSQL (CCTV / Sensor Metadata)",
    category="Data",
    tier=ServiceTier.SIMULATED_LOCAL,
    local_provider="Local JSON document store (app/catalyst/nosql.py)",
    catalyst_equivalent="Catalyst NoSQL",
    description="Schema-less put/get for CCTV or sensor metadata. Not wired to a live route — "
                "there's no real CCTV/sensor feed in this project to populate it with.",
))
