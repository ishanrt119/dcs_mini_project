# RailSync — Centralized API Registry Catalog

This document provides a machine-readable and human-verifiable catalog of all **34 railway intelligence endpoints** cataloged in the RailSync platform.

---

## 1. Inventory Summary
| Module | Endpoint Count | Verified Live | Fixture Adapter | Quota Impact |
|---|---|---|---|---|
| **Train Intelligence** | 15 | 1 (`/v1/trains/{number}/live`) | 14 | 2 Endpoints |
| **Journey Planning** | 12 | 0 | 12 | 1 Endpoint |
| **Reservation Intelligence** | 5 | 0 | 5 | 2 Endpoints |
| **Network & Specialist Data** | 2 | 0 | 2 | 1 Endpoint |
| **Total** | **34** | **1** | **33** | **6 Total Quota Endpoints** |

---

## 2. Detailed Endpoint Registry

### A. Train Intelligence Module (Service Port 4001)

#### 1. Live Train Running Status
- **ID**: `TRAIN_LIVE_STATUS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/{number}/live`
- **Parameters**:
  - Path: `number` (Required 5-digit train number)
  - Query: `date` (YYYY-MM-DD), `authoritative` (boolean), `haltsOnly` (boolean), `geometry` (boolean), `format` (coordinates/geojson), `includeCoordinates` (boolean)
- **Authentication**: `Bearer YOUR_RAILRADAR_API_KEY`
- **Quota Consumption**: **Yes (1 request per outbound call)**
- **Cache Policy**: 120s TTL (In-memory & SQLite)
- **Implementation Status**: `verified_live`
- **Notes**: Protected by Quota Manager. When `DEMO_MODE=true` or `LIVE_API_ENABLED=false`, returns high-fidelity local fixtures.

#### 2. Train Details
- **ID**: `TRAIN_DETAILS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/{number}`
- **Parameters**: `number` (Path)
- **Quota Consumption**: No (Cached schedule)
- **Cache Policy**: 24h TTL
- **Implementation Status**: `fixture_adapter`

#### 3. Timetable & Halts
- **ID**: `TRAIN_TIMETABLE_HALTS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/{number}/timetable`
- **Parameters**: `number` (Path)
- **Quota Consumption**: No
- **Cache Policy**: 24h TTL
- **Implementation Status**: `fixture_adapter`

#### 4. Route Geometry
- **ID**: `TRAIN_ROUTE_GEOMETRY`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/{number}/geometry`
- **Parameters**: `number` (Path), `format` (Query)
- **Quota Consumption**: No
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

#### 5. Delay Overlay
- **ID**: `TRAIN_DELAY_OVERLAY`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/{number}/delay-overlay`
- **Parameters**: `number` (Path)
- **Quota Consumption**: Yes (when outbound enabled)
- **Cache Policy**: 180s TTL
- **Implementation Status**: `fixture_adapter`

#### 6. Coach Layout
- **ID**: `TRAIN_COACH_LAYOUT`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/{number}/coach-layout`
- **Parameters**: `number` (Path)
- **Quota Consumption**: No
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

#### 7. Platform Position
- **ID**: `TRAIN_PLATFORM_POSITION`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/{number}/platform-positions`
- **Parameters**: `number` (Path)
- **Quota Consumption**: No
- **Cache Policy**: 1 Hour TTL
- **Implementation Status**: `fixture_adapter`

#### 8. Train Autocomplete
- **ID**: `TRAIN_AUTOCOMPLETE`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/search`
- **Parameters**: `query` (Query string)
- **Quota Consumption**: No (Client-side / Gateway search)
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

#### 9. Train Directory
- **ID**: `TRAIN_DIRECTORY`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains`
- **Parameters**: `page`, `limit`, `category` (Query)
- **Quota Consumption**: No
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

#### 10. Train Categories
- **ID**: `TRAIN_CATEGORIES`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/categories`
- **Quota Consumption**: No
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

#### 11. Speed Types
- **ID**: `TRAIN_SPEED_TYPES`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/speed-types`
- **Quota Consumption**: No
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

#### 12. PRS Reserved Trains
- **ID**: `PRS_RESERVED_TRAINS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/prs`
- **Quota Consumption**: No
- **Cache Policy**: 24h TTL
- **Implementation Status**: `fixture_adapter`

#### 13. NTES Trains
- **ID**: `NTES_TRAINS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/ntes`
- **Quota Consumption**: No
- **Cache Policy**: 24h TTL
- **Implementation Status**: `fixture_adapter`

#### 14. Compressed Trains
- **ID**: `COMPRESSED_TRAINS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/compressed`
- **Quota Consumption**: No
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

#### 15. Compressed PRS
- **ID**: `COMPRESSED_PRS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/prs/compressed`
- **Quota Consumption**: No
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

---

### B. Journey Planning Module (Service Port 4002)

#### 16. Route Planner
- **ID**: `ROUTE_PLANNER`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/routes/plan`
- **Parameters**: `from`, `to`, `date`, `via`, `maxTransfers`
- **Quota Consumption**: No
- **Cache Policy**: 1 Hour TTL
- **Implementation Status**: `fixture_adapter`

#### 17. Trains Between Stations
- **ID**: `TRAINS_BETWEEN_STATIONS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/between`
- **Parameters**: `from`, `to`, `date`
- **Quota Consumption**: No
- **Cache Policy**: 2 Hours TTL
- **Implementation Status**: `fixture_adapter`

#### 18. Station Autocomplete
- **ID**: `STATION_AUTOCOMPLETE`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/stations/search`
- **Parameters**: `query`
- **Quota Consumption**: No
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

#### 19. Station Schedule
- **ID**: `STATION_SCHEDULE`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/stations/{code}/schedule`
- **Parameters**: `code` (Path)
- **Quota Consumption**: No
- **Cache Policy**: 24h TTL
- **Implementation Status**: `fixture_adapter`

#### 20. Live Departures
- **ID**: `LIVE_DEPARTURES`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/stations/{code}/live-departures`
- **Parameters**: `code` (Path), `hours` (Query)
- **Quota Consumption**: Yes (when outbound enabled)
- **Cache Policy**: 180s TTL
- **Implementation Status**: `fixture_adapter`

#### 21. Station Directory
- **ID**: `STATION_DIRECTORY`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/stations`
- **Parameters**: `page`, `limit`, `state`, `zone`
- **Quota Consumption**: No
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

#### 22. NTES Stations
- **ID**: `NTES_STATIONS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/stations/ntes`
- **Quota Consumption**: No
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

#### 23. Compressed Stations
- **ID**: `COMPRESSED_STATIONS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/stations/compressed`
- **Quota Consumption**: No
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

#### 24. Suburban Timetables
- **ID**: `SUBURBAN_TIMETABLES`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/suburban/timetables`
- **Parameters**: `city`, `line`
- **Quota Consumption**: No
- **Cache Policy**: 24h TTL
- **Implementation Status**: `fixture_adapter`

#### 25. Local Cities
- **ID**: `LOCAL_CITIES`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/suburban/cities`
- **Quota Consumption**: No
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

#### 26. Stations KVs
- **ID**: `STATIONS_KVS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/stations/kvs`
- **Quota Consumption**: No
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

#### 27. Trains KVs
- **ID**: `TRAINS_KVS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/trains/kvs`
- **Quota Consumption**: No
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

---

### C. Reservation Intelligence Module (Service Port 4003)

#### 28. Seat Availability
- **ID**: `SEAT_AVAILABILITY`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/reservation/availability`
- **Parameters**: `train`, `from`, `to`, `date`, `class`, `quota`
- **Quota Consumption**: Yes (when live enabled)
- **Cache Policy**: 10 Mins TTL
- **Implementation Status**: `fixture_adapter`

#### 29. Fare Calculator
- **ID**: `FARE_CALCULATOR`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/reservation/fare`
- **Parameters**: `train`, `from`, `to`, `class`
- **Quota Consumption**: No (Official telescopic rules)
- **Cache Policy**: 24h TTL
- **Implementation Status**: `fixture_adapter`

#### 30. PNR Status
- **ID**: `PNR_STATUS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/pnr/{pnr}`
- **Parameters**: `pnr` (10-digit number in path)
- **Quota Consumption**: Yes (when live enabled)
- **Cache Policy**: 5 Mins TTL
- **Implementation Status**: `fixture_adapter`

#### 31. Confirmation Prediction
- **ID**: `CONFIRMATION_PREDICTION`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/pnr/prediction`
- **Parameters**: `train`, `class`, `waitlistNumber`, `date`
- **Quota Consumption**: No (Statistical heuristic)
- **Cache Policy**: 30 Mins TTL
- **Implementation Status**: `fixture_adapter`

#### 32. Cancellation Refund
- **ID**: `CANCELLATION_REFUND`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/reservation/refund-rules`
- **Parameters**: `ticketAmount`, `class`, `hoursBeforeDeparture`, `status`
- **Quota Consumption**: No (Ministry Gazette rules)
- **Cache Policy**: 7 Days TTL
- **Implementation Status**: `fixture_adapter`

---

### D. Network & Specialist Data (Service Port 4004)

#### 33. Freight Trains
- **ID**: `FREIGHT_TRAINS`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/freight/trains`
- **Parameters**: `corridor`, `commodity`
- **Quota Consumption**: No
- **Cache Policy**: 1 Hour TTL
- **Implementation Status**: `fixture_adapter`

#### 34. Live Map Feed
- **ID**: `LIVE_MAP_FEED`
- **HTTP Method**: `GET`
- **Documented Path**: `/v1/network/map-feed`
- **Parameters**: `zone`, `minSpeed`
- **Quota Consumption**: Yes (when live enabled)
- **Cache Policy**: 120s TTL
- **Implementation Status**: `fixture_adapter`
