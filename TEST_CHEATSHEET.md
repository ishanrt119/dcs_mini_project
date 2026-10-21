# RailSync — Offline Demo Test Cheatsheet

Use these curated test inputs to evaluate each view and feature in the platform without guessing. All inputs resolve instantly against the local fixtures and simulation engines.

---

## 1. Live Train Tracking & Train Search
> **View:** `/live-tracking` or `/train-details`  
> *Note: Enter the train number and click **Track Train** or **Search**.*

| Train Number | Train Name | Route | Current Status |
|---|---|---|---|
| **`12951`** | Mumbai Central - New Delhi Tejas Rajdhani | MMCT → NDLS | Delayed ~5m |
| **`12952`** | New Delhi - Mumbai Central Tejas Rajdhani | NDLS → MMCT | Delayed ~2m |
| **`12301`** | Howrah - New Delhi Rajdhani Express (via Gaya) | HWH → NDLS | Running On Time |
| **`22436`** | New Delhi - Varanasi Vande Bharat Express | NDLS → BSB | Running On Time |
| **`12002`** | New Delhi - Habibganj Shatabdi Express | NDLS → RKMP | Delayed ~20m |
| **`22691`** | KSR Bengaluru - Hazrat Nizamuddin Rajdhani | SBC → NZM | Running On Time |
| **`12431`** | Thiruvananthapuram - Hazrat Nizamuddin Rajdhani | TVC → NZM | Running On Time |

---

## 2. Coach Layout & Platform Alignment
> **View:** `/coach-layout`  
> *Note: Enter both Train Number and Station Code, then click **Inspect Rake & Platform**.*

| Train Number | Station Code | Station Name | Expected Rake & Alignment |
|---|---|---|---|
| **`12951`** | **`MMCT`** | Mumbai Central | 22-coach LHB Tejas; Center FOB stairs align near B2 |
| **`12952`** | **`NDLS`** | New Delhi | Platform 1; North Foot Over Bridge stairs |
| **`12301`** | **`HWH`** | Howrah Junction | Platform 9; Center Foot Over Bridge |
| **`22436`** | **`NDLS`** | New Delhi | 16-coach Vande Bharat rake; Platform 16 |
| **`12431`** | **`TVC`** | Thiruvananthapuram Central | Platform 1; Main Entry Concourse |

---

## 3. Trains Between Stations & Journey Planner
> **View:** `/trains-between` and `/journey-planner`  
> *Note: Enter Source & Destination station codes, then click **Find Trains** or **Plan Route**.*

| From Station | To Station | Route Description | Available Trains |
|---|---|---|---|
| **`MMCT`** | **`NDLS`** | Mumbai Central → New Delhi | 12951 (Tejas Rajdhani), 12953 (August Kranti) |
| **`NDLS`** | **`MMCT`** | New Delhi → Mumbai Central | 12952, 12954 |
| **`HWH`** | **`NDLS`** | Howrah → New Delhi | 12301 (via Gaya), 12305 (via Patna) |
| **`SBC`** | **`NZM`** | KSR Bengaluru → Hazrat Nizamuddin | 22691 (Bengaluru Rajdhani) |
| **`NDLS`** | **`BSB`** | New Delhi → Varanasi | 22436 (Vande Bharat Express) |
| **`MAS`** | **`NZM`** | Chennai Central → Hazrat Nizamuddin | 12433 (Chennai Rajdhani) |

---

## 4. Station Explorer & Live Departures
> **View:** `/station-explorer` and `/live-departures`  
> *Note: Enter the Station Code and click **Explore Station** or **Fetch Departures**.*

| Station Code | Station Name | Zone / Division | Features to Observe |
|---|---|---|---|
| **`NDLS`** | New Delhi | Northern Railway (NR) | 16 platforms, ~54 scheduled departures |
| **`MMCT`** | Mumbai Central | Western Railway (WR) | 8 main + 4 suburban platforms |
| **`HWH`** | Howrah Junction | Eastern Railway (ER) | 23 platforms (India's busiest terminal) |
| **`SBC`** | KSR Bengaluru City | South Western Railway (SWR) | 10 platforms, tech hub terminal |
| **`CNB`** | Kanpur Central | North Central Railway (NCR) | 10 platforms, major junction on Delhi-Howrah route |
| **`MAS`** | MGR Chennai Central | Southern Railway (SR) | 17 platforms, Southern gateway |

---

## 5. Reservation Intelligence (PNR Lookup, Fare & Refund)
> **View:** `/reservation-intel`  
> *Note: Enter 10-digit PNR and click **Check PNR Status**.*

### A. PNR Status Lookup
| 10-digit PNR | Train | Passenger Name | Booking Status | Current Status | Confirmation Chance |
|---|---|---|---|---|---|
| **`8421100001`** | 12952 | Priya Nair | CNF H1 11 | **CNF H1 11** | **100% (Confirmed)** |
| **`8421100004`** | 12301 | Vikram Choudhury | CNF H1 14 | **CNF H1 14** | **100% (Confirmed)** |
| **`8421100003`** | 12954 | Ananya Sen | WL 7 | **WL 1** | **89% (High Chance)** |
| **`8421100006`** | 12305 | Deepak Verma | WL 10 | **WL 4** | **83% (Medium Chance)** |
| **`8421100009`** | 22692 | Sneha Rao | WL 13 | **WL 7** | **77% (Moderate)** |

### B. Dynamic Fare Calculator
- **Train Number:** `12951`
- **Class:** Select `3A` (AC 3 Tier) or `2A` (AC 2 Tier)
- **Quota:** `GN` (General)
- *Expected Output: Base fare ~₹2,124 calculated with distance breakdown and dynamic surcharge.*

### C. Cancellation Refund Calculator
- **Base Ticket Fare:** `2124`
- **Cancellation Window:** Select `> 48 Hours Before Departure`
  - *Result: Flat deduction ₹180 + GST = ₹213 deduction → Refund = ₹1,911.*
- **Cancellation Window:** Select `Waitlisted / RAC (WL)`
  - *Result: Flat clerkage deduction ₹60 → Refund = ₹2,064.*

---

## 6. Suburban & Freight Network
> **View:** `/suburban-freight`

| Tab | Selection | What to Observe |
|---|---|---|
| **Suburban Rail** | **Mumbai** | Western, Central, and Harbour lines with peak rush frequencies |
| **Suburban Rail** | **Delhi** | NCR Commuter Ring Railway and EMU schedules |
| **Suburban Rail** | **Chennai** | South, West, North lines and MRTS |
| **Suburban Rail** | **Bengaluru** | MEMU airport commuter services |
| **Dedicated Freight** | **WDFC** | Western Corridor (Dadri to JNPT) high-axle heavy-haul rakes |
| **Dedicated Freight** | **EDFC** | Eastern Corridor (Ludhiana to Dankuni) coal & mineral spine |

---

## 7. Disruption Simulator
> **View:** `/disruption-simulator`

| Incident ID | Section / Station | Type | Simulated DCS Impact |
|---|---|---|---|
| **`INC-DCS-01`** | **`KOTA`** (Train 12951) | Traction Maintenance Block | Queue accumulation on downstream block section |
| **`INC-DCS-02`** | **`CNB`** (Kanpur) | Signal Interlocking Failure | Point machine fault triggering route rerouting |
| **`INC-DCS-03`** | **`PRYJ`** (Prayagraj) | Waterlogging / Speed Restriction | Dynamic speed ceiling dropped to 30 km/h |
| **`INC-DCS-04`** | **`NDLS`** (New Delhi) | Platform Congestion | Platform dwell time extended by 18 minutes |

---

## 8. Distributed Services Monitor (Partial Failure Demo)
> **View:** `/distributed-monitor`

1. Locate **Train Intelligence Service** (`port 4001`).
2. Click **Simulate 503 Outage**.
3. Navigate to **Live Tracking** (`/live-tracking`) → shows degraded state (`SERVICE_UNAVAILABLE`).
4. Navigate to **Journey Planner** (`/journey-planner`) or **Reservation** (`/reservation-intel`) → **they continue working at 100% speed** (proves partial failure isolation).
5. Return to **Distributed Monitor** and click **Restore Service** → health heartbeat automatically recovers to **HEALTHY** within 3 seconds.

---

## 9. API Registry & Mock Upstream Sandbox
> **View:** `/api-registry`

Test any catalog endpoint against the simulated provider engine:

| Endpoint | Test Parameter | Status Code to Test | Observation |
|---|---|---|---|
| `GET /api/trains/:trainNo/live` | `trainNo`: **`12951`** | **`200 OK`** | Returns live telemetry with `SIMULATED_PROVIDER_RESPONSE` badge |
| `GET /api/stations/:code/departures` | `code`: **`NDLS`** | **`200 OK`** | Returns 54 scheduled departures |
| `GET /api/reservations/pnr/:pnr` | `pnr`: **`8421100001`** | **`200 OK`** | Returns passenger chart & confirmation stats |
| *Any Endpoint* | Any parameter | **`429 Rate Limit`** | Returns simulated rate-limit error header and 429 response |
| *Any Endpoint* | Any parameter | **`503 Outage`** | Returns simulated upstream provider 503 payload |
