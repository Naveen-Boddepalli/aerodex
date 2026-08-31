"""Airport and carrier reference data for the API and dashboard.

Static metadata only — city names, coordinates and carrier names for the 23
airports and 5 carriers that appear in ``config/panel.yaml``. Nothing here is a
measurement; it exists so the dashboard can render "DEL" as "New Delhi" and
place it on a map without the frontend hard-coding a gazetteer.

Coordinates are the airport's published position, rounded to 4 decimals.
"""

from __future__ import annotations

from typing import NamedTuple


class Airport(NamedTuple):
    iata: str
    city: str
    name: str
    lat: float
    lon: float
    region: str


AIRPORTS: dict[str, Airport] = {
    "DEL": Airport("DEL", "New Delhi", "Indira Gandhi Intl", 28.5562, 77.1000, "North"),
    "BOM": Airport("BOM", "Mumbai", "Chhatrapati Shivaji Maharaj Intl", 19.0887, 72.8679, "West"),
    "BLR": Airport("BLR", "Bengaluru", "Kempegowda Intl", 13.1986, 77.7066, "South"),
    "MAA": Airport("MAA", "Chennai", "Chennai Intl", 12.9941, 80.1709, "South"),
    "HYD": Airport("HYD", "Hyderabad", "Rajiv Gandhi Intl", 17.2403, 78.4294, "South"),
    "CCU": Airport("CCU", "Kolkata", "Netaji Subhas Chandra Bose Intl", 22.6547, 88.4467, "East"),
    "AMD": Airport("AMD", "Ahmedabad", "Sardar Vallabhbhai Patel Intl", 23.0772, 72.6347, "West"),
    "PNQ": Airport("PNQ", "Pune", "Pune Intl", 18.5822, 73.9197, "West"),
    "GOX": Airport("GOX", "Goa", "Manohar Intl (Mopa)", 15.7360, 73.8580, "West"),
    "COK": Airport("COK", "Kochi", "Cochin Intl", 10.1520, 76.4019, "South"),
    "JAI": Airport("JAI", "Jaipur", "Jaipur Intl", 26.8242, 75.8122, "North"),
    "LKO": Airport("LKO", "Lucknow", "Chaudhary Charan Singh Intl", 26.7606, 80.8893, "North"),
    "IXC": Airport("IXC", "Chandigarh", "Shaheed Bhagat Singh Intl", 30.6735, 76.7885, "North"),
    "PAT": Airport("PAT", "Patna", "Jay Prakash Narayan Intl", 25.5913, 85.0880, "East"),
    "GAU": Airport("GAU", "Guwahati", "Lokpriya Gopinath Bordoloi Intl", 26.1061, 91.5859, "East"),
    "BBI": Airport("BBI", "Bhubaneswar", "Biju Patnaik Intl", 20.2444, 85.8178, "East"),
    "VNS": Airport("VNS", "Varanasi", "Lal Bahadur Shastri Intl", 25.4524, 82.8593, "North"),
    "SXR": Airport("SXR", "Srinagar", "Sheikh ul-Alam Intl", 33.9871, 74.7742, "North"),
    "ATQ": Airport("ATQ", "Amritsar", "Sri Guru Ram Dass Jee Intl", 31.7096, 74.7973, "North"),
    "IDR": Airport("IDR", "Indore", "Devi Ahilya Bai Holkar", 22.7218, 75.8011, "West"),
    "NAG": Airport("NAG", "Nagpur", "Dr. Babasaheb Ambedkar Intl", 21.0922, 79.0472, "West"),
    "TRV": Airport("TRV", "Thiruvananthapuram", "Trivandrum Intl", 8.4821, 76.9200, "South"),
    "VTZ": Airport("VTZ", "Visakhapatnam", "Visakhapatnam Intl", 17.7211, 83.2245, "South"),
}

# IATA designators as they appear in the panel's itinerary keys.
CARRIERS: dict[str, str] = {
    "6E": "IndiGo",
    "AI": "Air India",
    "IX": "Air India Express",
    "SG": "SpiceJet",
    "QP": "Akasa Air",
}

# Bounding box used by the dashboard's route map to project lat/lon.
INDIA_BOUNDS = {"lat_min": 6.5, "lat_max": 35.5, "lon_min": 68.0, "lon_max": 92.5}


def city(iata: str) -> str:
    a = AIRPORTS.get(iata)
    return a.city if a else iata


def carrier_name(code: str) -> str:
    return CARRIERS.get(code, code)


def airport_dict(iata: str) -> dict:
    """Serialise one airport for the API, falling back to the bare code."""
    a = AIRPORTS.get(iata)
    if a is None:
        return {
            "iata": iata, "city": iata, "name": iata,
            "lat": None, "lon": None, "region": "Unknown",
        }
    return a._asdict()
