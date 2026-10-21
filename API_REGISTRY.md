# RailSync — Centralized API Registry Catalog
## Offline Demonstration Edition

This document catalogs all **34 railway intelligence endpoints** supported in the RailSync platform. In accordance with the complete offline demo conversion, all endpoints run 100% locally via `DemoRailwayAdapter` with zero outbound external network requests.

---

## 1. Inventory Summary & Offline Mode Status
| Module | Endpoint Count | Offline Mode Implementation | External Calls | Data Provenance |
|---|---|---|---|---|
| **Train Intelligence** | 15 | Local JSON Fixture + Simulation | 0 | `LOCAL_SIMULATION` / `LOCAL_JSON_FIXTURE` |
| **Journey Planning** | 12 | Local Route Matching & Graph Search | 0 | `LOCAL_JSON_FIXTURE` / `LOCAL_SIMULATION` |
| **Reservation Intelligence** | 5 | Deterministic Fare & PNR Engine | 0 | `LOCAL_JSON_FIXTURE` |
| **Network & Specialist Data** | 2 | Local GIS & Freight Rake Matrix | 0 | `LOCAL_JSON_FIXTURE` |
| **Total** | **34** | **100% Local Intelligence** | **0 Calls** | **Strictly Offline** |

---

## 2. Distinction: Inter-Service HTTP vs Simulated Provider Responses
- **Inter-Service HTTP Communication**: Real HTTP/1.1 REST requests occur on `localhost` between microservices (Gateway port 4000 ↔ Service ports 4001–4004) with real JSON serialization, network latency, AbortController timeouts, and fault injection.
- **Simulated Provider Responses**: When demonstrating upstream API behavior (e.g. in the API Registry Mock Provider Console), responses are synthesized by `DemoRailwayAdapter` with realistic structure, headers, measured duration (ms), request trace IDs, and explicit `SIMULATED_PROVIDER_RESPONSE` provenance tags. Real external railway hosts are never contacted.

---

## 3. Detailed Endpoint Registry

### A. Train Intelligence Module (Service Port 4001)

#### 1. Live Train Running Status
- **ID**: `TRAIN_LIVE_STATUS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/{number}/live`
- **Parameters**:
  - Path: `number` (Required 5-digit train number)
  - Query: `date` (YYYY-MM-DD), `authoritative` (boolean), `haltsOnly` (boolean), `geometry` (boolean)
- **External Calls**: **Zero (0)**
- **Offline Data Source**: `LOCAL_SIMULATION`
- **Simulation Logic**: Deterministic route advancement based on simulation clock, realistic speeds (90–160 km/h), and gradual delay modulation.

#### 2. Train Details
- **ID**: `TRAIN_DETAILS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/{number}`
- **Parameters**: `number` (Path)
- **External Calls**: Zero (0)
- **Offline Data Source**: `LOCAL_JSON_FIXTURE`

#### 3. Timetable & Halts
- **ID**: `TRAIN_TIMETABLE_HALTS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/{number}/timetable`
- **Parameters**: `number` (Path)
- **Offline Data Source**: `LOCAL_JSON_FIXTURE`

#### 4. Route Geometry
- **ID**: `TRAIN_ROUTE_GEOMETRY`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/{number}/geometry`
- **Parameters**: `number` (Path)
- **Offline Data Source**: `LOCAL_JSON_FIXTURE` (Ordered [lat, lng] coordinates)

#### 5. Coach Layout
- **ID**: `TRAIN_COACH_LAYOUT`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/{number}/coach-layout`
- **Offline Data Source**: `LOCAL_JSON_FIXTURE` (Class compositions, berth capacities, FOB alignment)

#### 6. Platform Position
- **ID**: `TRAIN_PLATFORM_POSITION`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/{number}/platform-positions`
- **Offline Data Source**: `LOCAL_JSON_FIXTURE` (Escalator proximity, FOB alignment)

#### 7. Train Autocomplete / Search
- **ID**: `TRAIN_SEARCH`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/search`
- **Parameters**: `query` (Query)
- **Offline Data Source**: `LOCAL_JSON_FIXTURE` (Searches across 134 train records)

#### 8. Train Directory
- **ID**: `TRAIN_DIRECTORY`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains`
- **Offline Data Source**: `LOCAL_JSON_FIXTURE`

#### 9–15. Auxiliary Reference Feeds
- `TRAIN_CATEGORIES`: Vande Bharat, Rajdhani, Shatabdi, Duronto, Superfast, Mail/Express.
- `TRAIN_SPEED_TYPES`: Semi-High Speed (160 km/h) down to Commuter (80 km/h).
- `TRAIN_PRS_POOL`: PRS reservation pool allocations.
- `TRAIN_NTES_FEED`: Local telemetry reporting station feeds.
- `TRAIN_COMPRESSED_TUPLES`: Base64 compressed directory tuples.
- `TRAIN_PRS_COMPRESSED`: Base64 compressed PRS pool.
- `TRAIN_KVS_MAP`: Key-value lookup map.

---

### B. Journey Planning & Station Module (Service Port 4002)

#### 16. Route Planner
- **ID**: `ROUTE_PLANNER`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/routes/plan`
- **Parameters**: `from`, `to`, `date`
- **Offline Data Source**: `LOCAL_JSON_FIXTURE` (Matches ordered halt sequence in `trains.json`)

#### 17. Trains Between Stations
- **ID**: `TRAINS_BETWEEN_STATIONS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/between`
- **Parameters**: `from`, `to`, `date`
- **Offline Data Source**: `LOCAL_JSON_FIXTURE`

#### 18. Station Autocomplete & Search
- **ID**: `STATION_SEARCH`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/stations/search`
- **Parameters**: `query`
- **Offline Data Source**: `LOCAL_JSON_FIXTURE` (Searches 171 stations)

#### 19. Station Details
- **ID**: `STATION_DETAILS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/stations/{code}`
- **Offline Data Source**: `LOCAL_JSON_FIXTURE` (Platforms, zones, coordinates)

#### 20. Station Schedule
- **ID**: `STATION_SCHEDULE`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/stations/{code}/schedule`
- **Offline Data Source**: `LOCAL_JSON_FIXTURE`

#### 21. Live Station Departures
- **ID**: `LIVE_DEPARTURES`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/stations/{code}/live-departures`
- **Offline Data Source**: `LOCAL_SIMULATION` (Calculates expected departures using simulated delay)

#### 22–27. Specialist Feeds
- `STATION_DIRECTORY`: Directory of 171 station records.
- `STATION_NTES`: Computerized enquiry station index.
- `STATION_COMPRESSED`: Base64 station coordinate matrix.
- `SUBURBAN_TIMETABLES`: 58 commuter services across Mumbai, Delhi, Chennai, Bengaluru.
- `SUBURBAN_CITIES`: Suburban networks metadata.
- `STATION_KVS`: Code-to-Name KV map.

---

### C. Reservation Intelligence Module (Service Port 4003)

#### 28. Seat Availability
- **ID**: `SEAT_AVAILABILITY`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/reservation/availability`
- **Parameters**: `train`, `from`, `to`, `date`, `class`, `quota`
- **Offline Data Source**: `LOCAL_JSON_FIXTURE` (6-day deterministic availability matrix)

#### 29. Telescopic Fare Calculator
- **ID**: `FARE_CALCULATOR`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/reservation/fare`
- **Parameters**: `train`, `from`, `to`
- **Offline Data Source**: `LOCAL_JSON_FIXTURE` (Official distance-based slabs + reservation/SF + 5% GST)

#### 30. PNR Status Enquiry
- **ID**: `PNR_STATUS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/pnr/{pnr}`
- **Parameters**: `pnr` (10 digits)
- **Offline Data Source**: `LOCAL_JSON_FIXTURE` (30 pre-seeded passenger itineraries in `reservations.json`)

#### 31. Confirmation Probability Prediction
- **ID**: `CONFIRMATION_PREDICTION`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/pnr/prediction`
- **Parameters**: `train`, `class`, `waitlistNumber`, `date`
- **Offline Data Source**: `LOCAL_JSON_FIXTURE`

#### 32. Cancellation & Refund Rules
- **ID**: `CANCELLATION_REFUND`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/reservation/refund-rules`
- **Parameters**: `ticketAmount`, `class`, `hoursBeforeDeparture`, `status`
- **Offline Data Source**: `LOCAL_JSON_FIXTURE` (Official Railway Rules 2015: >48h, 48–12h, 12–4h, <4h)

---

### D. Analytics, Event & Specialist Data Module (Service Port 4004)

#### 33. Freight Operations Telemetry
- **ID**: `FREIGHT_TRAINS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/network/freight`
- **Offline Data Source**: `LOCAL_JSON_FIXTURE` (26 freight rakes on WDFC, EDFC, Golden Quadrilateral)

#### 34. Railway GIS Network Map Feed
- **ID**: `LIVE_MAP_FEED`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/network/map-feed`
- **Offline Data Source**: `LOCAL_SIMULATION` (Real-time simulated train positions with lat/lng and route geometries)
