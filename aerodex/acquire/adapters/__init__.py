"""One file per source. Failures are isolated here (plan §6).

Real adapters land in Phase 0 spike S3, which discovers which sources expose a
tier-1/tier-2 endpoint without login. Until S3 has run, ``fixture`` is the only
adapter — it exercises the pipeline without pretending to be a real source.
"""

from aerodex.acquire.adapters.fixture import FixtureAdapter

REGISTRY = {FixtureAdapter.name: FixtureAdapter}
