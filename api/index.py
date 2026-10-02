"""Vercel Python entrypoint for the AeroDex API.

`vercel.json` routes every request under ``/api/*`` to this file. It re-exports
the FastAPI app from :mod:`aerodex.api` unchanged: Vercel forwards the original
path (``/api/v1/...``), which is what the app's routes are declared on, so no
path rewriting is needed here.

This deployment has no database. Every endpoint falls back to the frozen
synthetic run bundled from ``demo/`` and marks each response
``data_source: "demo-synthetic"`` — the dashboard renders that as a banner.
``vercel.json`` bundles ``aerodex/``, ``demo/`` and ``config/`` next to this
file via ``includeFiles`` so the fixture data and panel config are readable at
runtime.
"""

from __future__ import annotations

import os
import sys

# The serverless bundle puts this file at ``api/index.py`` and the package at
# ``aerodex/``; add the bundle root so ``import aerodex`` resolves.
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from aerodex.api import app  # noqa: E402  (path shim must run first)

# Vercel's Python runtime serves a module-level ASGI callable named ``app``.
__all__ = ["app"]
