"""
Object storage service (Stratus in the brief) — for evidence files.

Local provider: real writes to a local `evidence_storage/` directory on
disk (created lazily, gitignored). This is a genuine file store, not a
mock — bytes you save are the bytes you get back — it's just local disk
instead of a managed object store. Not wired into a live route yet: the
current schema has no evidence-file table to attach uploads to, and the
brief says not to add unverified tables to the official schema, so this
is registered as SIMULATED_LOCAL rather than IMPLEMENTED.

Catalyst equivalent: Stratus / Object Storage, with the same save(key,
bytes) -> url contract, swapped in behind this same interface.
"""
import os
import uuid

from app.catalyst.base import ServiceInfo, ServiceTier, register

_STORAGE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "evidence_storage")


class LocalObjectStorage:
    def __init__(self, root: str = _STORAGE_DIR):
        self.root = os.path.abspath(root)

    def save(self, data: bytes, filename: str) -> str:
        os.makedirs(self.root, exist_ok=True)
        key = f"{uuid.uuid4().hex}_{filename}"
        with open(os.path.join(self.root, key), "wb") as f:
            f.write(data)
        return key

    def path_for(self, key: str) -> str:
        return os.path.join(self.root, key)


object_storage = LocalObjectStorage()

register(ServiceInfo(
    key="storage",
    name="Object Storage (Evidence Files)",
    category="Data",
    tier=ServiceTier.SIMULATED_LOCAL,
    local_provider="Local filesystem writes under evidence_storage/ (app/catalyst/storage.py)",
    catalyst_equivalent="Stratus / Object Storage",
    description="Real save/read to local disk. Not yet wired to a route — the official "
                "schema has no evidence-file table to attach uploads to.",
))
