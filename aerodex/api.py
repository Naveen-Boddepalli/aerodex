"""AeroDex API — FastAPI service for the dashboard (plan §5.6).

Primary serving mode in production is static JSON artifacts on Cloudflare
R2 / Pages. This service exists for:

  1. Local development and demos: the frontend gets live data with no R2 setup.
  2. Production: ad-hoc programmatic queries via Cloudflare Tunnel (plan §5.6).

Every endpoint tries the database first. When the database is unavailable —
which is the normal case for a demo, because Docker is not part of the demo —
it serves the frozen synthetic run in ``demo/`` through :mod:`aerodex.demodata`.

That fallback is labelled, not hidden. Responses built from ``demo/`` carry
``data_source: "demo-synthetic"`` and a ``notice``, and the dashboard renders a
banner from those fields. The distinction between a measurement and a fixture
fare is the point of this project; the API must not blur it just because a
chart looks better full.

Run it:

    uv run uvicorn aerodex.api:app --reload --port 8000
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from datetime import date, timedelta
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from aerodex import demodata
from aerodex.airports import AIRPORTS, INDIA_BOUNDS, airport_dict, carrier_name, city

logger = logging.getLogger(__name__)

DB_SOURCE = "database"

ROUTE_COLORS = demodata.ROUTE_COLORS


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------


def _try_connect():
    """Try to get a psycopg connection. Returns None if the DB is unavailable."""
    try:
        from aerodex.db.connection import connect

        ctx = connect()
        conn = ctx.__enter__()
        return ctx, conn
    except Exception:
        return None


def _db_query(sql: str, params: tuple = ()) -> list[dict] | None:
    """Run a query, returning a list of dicts, or None if the DB is unreachable."""
    result = _try_connect()
    if result is None:
        return None
    ctx, conn = result
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            if cur.description is None:
                return []
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row, strict=True)) for row in cur.fetchall()]
    except Exception as e:
        logger.warning("DB query failed: %s", e)
        return None
    finally:
        ctx.__exit__(None, None, None)


def _demo_unavailable() -> HTTPException:
    return HTTPException(
        status_code=503,
        detail=(
            "No data source. The database is unreachable and demo/ is missing. "
            "Run `uv run python scripts/make_demo_data.py` to generate the demo dataset."
        ),
    )


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AeroDex API",
    description=(
        "Real-time airfare price index for India (SIH 2026, PS SIH26056, MoSPI). "
        "Responses carry `data_source`: `database` for collected data, "
        "`demo-synthetic` for the frozen fixture run in demo/."
    ),
    version="0.2.0",
)

# Explicit localhost origins for dev; a regex for the Pages preview domains,
# because a wildcard inside allow_origins is matched literally and never fires.
_extra_origins = [o for o in os.getenv("AERODEX_CORS_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3010",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3010",
        *_extra_origins,
    ],
    allow_origin_regex=r"https://.*\.pages\.dev",
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Index
# ---------------------------------------------------------------------------


@app.get("/api/v1/index/latest")
def index_latest() -> dict:
    """Latest index value plus provenance — mirrors index_latest.json (plan §5.6)."""
    rows = _db_query("""
        SELECT period, value, imputed_weight_share, coverage_ratio, n_quotes,
               config_hash, weights_vintage, panel_hash, is_provisional
          FROM index_point
         WHERE series = 'headline' AND frequency = 'daily'
         ORDER BY period DESC
         LIMIT 2
    """)

    if rows:
        r = rows[0]
        meth = demodata.methodology_config()
        return {
            "index": "AeroDex Airfare Price Index (India)",
            "period": str(r["period"]),
            "value": round(float(r["value"]), 4),
            "previous_value": round(float(rows[1]["value"]), 4) if len(rows) > 1 else None,
            "base_period": meth.get("base", {}).get("period", "2026-09"),
            "base_value": float(meth.get("base", {}).get("value", 100.0)),
            "coverage_ratio": round(float(r["coverage_ratio"]), 5),
            "imputed_weight_share": round(float(r["imputed_weight_share"]), 5),
            "n_quotes": int(r["n_quotes"]),
            "n_routes": len(demodata.route_weights()),
            "is_provisional": bool(r["is_provisional"]),
            "config_hash": r["config_hash"],
            "panel_hash": r["panel_hash"],
            "weights_vintage": r["weights_vintage"],
            "output_hash": "",
            "data_source": DB_SOURCE,
            "synthetic": False,
            "notice": None,
        }

    if not demodata.available():
        raise _demo_unavailable()
    logger.info("DB unavailable — serving index/latest from demo/")
    return demodata.index_latest()


@app.get("/api/v1/index/history")
def index_history(days: int = Query(default=30, ge=7, le=365)) -> dict:
    """Headline index series plus per-route fare series over the same periods."""
    rows = _db_query("""
        SELECT period, value, imputed_weight_share, coverage_ratio, n_quotes, is_base
          FROM index_point
         WHERE series = 'headline'
           AND frequency = 'daily'
           AND period >= current_date - %s * interval '1 day'
         ORDER BY period
    """, (days,))

    if rows:
        headline = [
            {
                "period": str(r["period"]),
                "date": r["period"].strftime("%b %d"),
                "value": round(float(r["value"]), 4),
                "coverage_ratio": round(float(r["coverage_ratio"]), 5),
                "imputed_weight_share": round(float(r["imputed_weight_share"]), 5),
                "n_quotes": int(r["n_quotes"]),
                "is_base": bool(r.get("is_base", False)),
            }
            for r in rows
        ]

        fare_rows = _db_query("""
            SELECT origin, destination, collected_at::date AS period,
                   percentile_cont(0.5) WITHIN GROUP (ORDER BY fare_inr_paise) AS median_fare
              FROM quote_clean
             WHERE validation_status = 'valid'
               AND collected_at >= current_date - %s * interval '1 day'
             GROUP BY origin, destination, collected_at::date
             ORDER BY period
        """, (days,)) or []

        weights = demodata.route_weights()
        present = {f"{r['origin'].strip()}-{r['destination'].strip()}" for r in fare_rows}
        top = sorted(present, key=lambda k: weights.get(k, 0.0), reverse=True)[:8]

        routes_meta = []
        for i, key in enumerate(top):
            origin, dest = key.split("-")
            routes_meta.append({
                "key": f"{origin}_{dest}",
                "route": key,
                "label": f"{origin} → {dest}",
                "cities": f"{city(origin)} → {city(dest)}",
                "color": ROUTE_COLORS[i % len(ROUTE_COLORS)],
                "weight": round(weights.get(key, 0.0), 6),
            })

        by_period: dict[str, dict[str, Any]] = {
            h["period"]: {"period": h["period"], "date": h["date"], "index": h["value"]}
            for h in headline
        }
        for r in fare_rows:
            key = f"{r['origin'].strip()}-{r['destination'].strip()}"
            if key not in top:
                continue
            point = by_period.get(str(r["period"]))
            if point is not None:
                point[key.replace("-", "_")] = round(float(r["median_fare"]) / 100)

        return {
            "routes": routes_meta,
            "data": [by_period[p] for p in sorted(by_period)],
            "headline": headline,
            "days": len(headline),
            "data_source": DB_SOURCE,
            "synthetic": False,
            "notice": None,
        }

    if not demodata.available():
        raise _demo_unavailable()
    logger.info("DB unavailable — serving index/history from demo/")
    return demodata.index_history(days)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/api/v1/routes")
def routes() -> dict:
    """The panel definition — every O–D pair with its DGCA weight and airports.

    Also returns the map projection bounds so the dashboard's route map does not
    hard-code a gazetteer.
    """
    if not demodata.available():
        # The panel definition is config, not data — serve it even with no run.
        weights = demodata.route_weights()
        items = [
            {
                "id": key,
                "origin": airport_dict(key.split("-")[0]),
                "destination": airport_dict(key.split("-")[1]),
                "weight": round(w, 6),
                "medianFare": None,
                "bestFare": None,
                "quotes": 0,
            }
            for key, w in weights.items()
        ]
    else:
        items = demodata.routes()

    return {
        "routes": items,
        "airports": [airport_dict(code) for code in sorted(AIRPORTS)],
        "bounds": INDIA_BOUNDS,
        "horizons": demodata.panel_config().get("horizons_days", []),
        "count": len(items),
    }


@app.get("/api/v1/routes/trackers")
def routes_trackers(limit: int = Query(default=60, ge=1, le=200)) -> list[dict]:
    """Per-route tracker cards: fare now, change since the last period, sparkline."""
    rows = _db_query("""
        WITH latest AS (
            SELECT origin, destination,
                   MIN(fare_inr_paise) AS min_fare,
                   percentile_cont(0.5) WITHIN GROUP (ORDER BY fare_inr_paise) AS med_fare,
                   COUNT(*) AS n_quotes,
                   MAX(collected_at) AS last_collected
              FROM quote_clean
             WHERE validation_status = 'valid'
               AND collected_at > now() - interval '24 hours'
             GROUP BY origin, destination
        ),
        previous AS (
            SELECT origin, destination,
                   percentile_cont(0.5) WITHIN GROUP (ORDER BY fare_inr_paise) AS prev_med_fare
              FROM quote_clean
             WHERE validation_status = 'valid'
               AND collected_at BETWEEN now() - interval '48 hours'
                                     AND now() - interval '24 hours'
             GROUP BY origin, destination
        )
        SELECT l.origin, l.destination, l.min_fare, l.med_fare,
               l.n_quotes, l.last_collected,
               COALESCE(p.prev_med_fare, l.med_fare) AS prev_med_fare
          FROM latest l
          LEFT JOIN previous p USING (origin, destination)
         ORDER BY l.n_quotes DESC
         LIMIT %s
    """, (limit,))

    if rows:
        weights = demodata.route_weights()
        trackers = []
        for r in rows:
            origin, dest = r["origin"].strip(), r["destination"].strip()
            key = f"{origin}-{dest}"
            price = round(float(r["med_fare"]) / 100)
            best = round(float(r["min_fare"]) / 100)
            prev_price = round(float(r["prev_med_fare"]) / 100)

            if price < prev_price * 0.99:
                change = "drop"
            elif price > prev_price * 1.01:
                change = "rise"
            else:
                change = "stable"

            change_amt = abs(price - prev_price)
            collected = r["last_collected"]

            trackers.append({
                "id": key,
                "from": origin,
                "fromCity": city(origin),
                "to": dest,
                "toCity": city(dest),
                "stops": "Direct",
                "price": price,
                "bestPrice": best,
                "prevPrice": prev_price,
                "change": change,
                "changePct": round(change_amt / prev_price * 100, 1) if prev_price else 0.0,
                "changeAmt": change_amt,
                "volume": int(r["n_quotes"]),
                "airline": "—",
                "carrier": "",
                "cabin": "Economy",
                "weight": round(weights.get(key, 0.0), 6),
                "horizonDays": 7,
                "departureDate": str(
                    (collected.date() if collected else date.today()) + timedelta(days=7)
                ),
                "dates": "",
                "period": str(collected.date()) if collected else "",
                "updated": collected.strftime("%Y-%m-%d %H:%M") if collected else "",
                "alertOn": False,
                "data": [],
            })
        return trackers

    if not demodata.available():
        raise _demo_unavailable()
    logger.info("DB unavailable — serving routes/trackers from demo/")
    return demodata.trackers(limit)


@app.get("/api/v1/routes/{origin}/{destination}")
def route_detail(origin: str, destination: str) -> dict:
    """One route in depth: fare by booking horizon, by carrier, and over time."""
    if not demodata.available():
        raise _demo_unavailable()
    detail = demodata.route_detail(origin.upper(), destination.upper())
    if detail is None:
        raise HTTPException(
            status_code=404, detail=f"Route {origin}-{destination} is not in the panel"
        )
    return detail


@app.get("/api/v1/search")
def search(
    origin: str = Query(...),
    destination: str = Query(...),
    horizon: int = Query(default=7),
    limit: int = Query(default=12, ge=1, le=100),
) -> dict:
    """The quotes the panel holds for one route and booking horizon.

    This is a query over collected quotes, not a booking search — AeroDex
    measures fares, it does not sell them.
    """
    if not demodata.available():
        raise _demo_unavailable()

    valid_horizons = demodata.panel_config().get("horizons_days", [])
    if valid_horizons and horizon not in valid_horizons:
        raise HTTPException(
            status_code=400,
            detail=f"horizon must be one of {valid_horizons} — the panel collects no others",
        )

    result = demodata.search(origin.upper(), destination.upper(), horizon, limit)
    if result["nQuotes"] == 0:
        raise HTTPException(
            status_code=404,
            detail=f"No quotes for {origin.upper()}-{destination.upper()} at horizon {horizon}d",
        )
    return result


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------


@app.get("/api/v1/alerts")
def alerts(limit: int = Query(default=60, ge=1, le=200)) -> dict:
    """Threshold crossings across the panel.

    Each route's threshold is its own median fare over the first half of the
    collection window. Routes below their line are triggered; the rest are
    watching. There is no per-user alert store yet — these are derived, so the
    dashboard shows real crossings rather than an invented inbox.
    """
    if not demodata.available():
        raise _demo_unavailable()

    items = demodata.alerts()[:limit]
    triggered = [a for a in items if a["triggered"]]
    return {
        "alerts": items,
        "summary": {
            "triggered": len(triggered),
            "watching": len(items) - len(triggered),
            "total": len(items),
            "deepestDropPct": min(
                (a["deltaPct"] for a in triggered), default=0.0
            ),
        },
        "period": demodata.latest_period(),
        "data_source": demodata.DATA_SOURCE,
        "synthetic": True,
        "notice": demodata.SYNTHETIC_NOTICE,
    }


# ---------------------------------------------------------------------------
# Health, provenance, methodology
# ---------------------------------------------------------------------------


@app.get("/api/v1/health/nodes")
def health_nodes() -> list[dict]:
    """Collection volume by region."""
    rows = _db_query("""
        SELECT source, SUM(succeeded) AS total_ok, SUM(failed) AS total_fail,
               MAX(observed_on) AS last_seen
          FROM adapter_health
         WHERE observed_on >= current_date - interval '1 day'
         GROUP BY source
         ORDER BY total_ok DESC
    """)

    if rows:
        return [
            {
                "id": r["source"],
                "region": f"Source: {r['source']}",
                "airports": [],
                "detail": f"last seen {r['last_seen']}",
                "status": "active" if int(r["total_ok"]) > 0 else "idle",
                "routes": 0,
                "queries": int(r["total_ok"]) + int(r["total_fail"]),
            }
            for r in rows
        ]

    if not demodata.available():
        raise _demo_unavailable()
    logger.info("DB unavailable — serving health/nodes from demo/")
    return demodata.collection_nodes()


@app.get("/api/v1/pipeline/status")
def pipeline_status() -> dict:
    """Provenance, quality gates and compliance rules behind the current run."""
    if not demodata.available():
        raise _demo_unavailable()
    return demodata.pipeline_status()


@app.get("/api/v1/methodology")
def methodology() -> dict:
    """Methodology configuration — mirrors methodology.json (plan §5.6)."""
    meth = demodata.methodology_config()
    if not meth:
        raise HTTPException(status_code=404, detail="config/methodology.yaml not found")

    raw_json = json.dumps(meth, sort_keys=True, separators=(",", ":"), default=str)
    config_hash = hashlib.sha256(raw_json.encode("utf-8")).hexdigest()

    return {
        "config_hash": config_hash,
        "elementary_formula": meth.get("elementary", {}).get("formula", "jevons"),
        "aggregation": meth.get("aggregation", {}).get("formula", "lowe"),
        "weights_vintage": meth.get("aggregation", {}).get("weights_vintage", ""),
        "imputation_ceiling": meth.get("imputation", {}).get("max_weight_share", 0.05),
        "revision_policy": meth.get("revision", {}).get("policy", ""),
        "config": meth,
    }


@app.get("/api/v1/health")
def health() -> dict:
    """Which data source the API is actually serving from."""
    db_ok = _try_connect() is not None
    demo_ok = demodata.available()
    return {
        "status": "ok" if (db_ok or demo_ok) else "degraded",
        "database": "connected" if db_ok else "unavailable",
        "demo_dataset": "present" if demo_ok else "missing",
        "data_source": DB_SOURCE if db_ok else (demodata.DATA_SOURCE if demo_ok else None),
        "synthetic": not db_ok and demo_ok,
        "period": demodata.latest_period() if demo_ok and not db_ok else None,
        "notice": None if db_ok else (demodata.SYNTHETIC_NOTICE if demo_ok else None),
    }


# Kept importable for callers that used the old helper names.
__all__ = ["app", "carrier_name", "city"]
