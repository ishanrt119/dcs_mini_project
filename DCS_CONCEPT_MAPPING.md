# RailSync — Distributed Computing Systems (DCS) Concept Mapping

This document explicitly maps the theoretical principles of **Distributed Computing Systems** to concrete architectural components and source code implementations in RailSync.

---

## 1. Client-Server & Multi-Tier Architecture
- **DCS Principle**: Separation of presentation, business logic orchestration, domain processing, and persistence across decoupled physical or logical tiers.
- **RailSync Implementation**:
  - **Tier 1 (Presentation)**: Single Page React Application running on port `5173`.
  - **Tier 2 (Gateway / Orchestration)**: API Gateway running on port `4000`. Acts as a reverse proxy, access controller, and response aggregator.
  - **Tier 3 (Domain Microservices)**: Independent service processes running on ports `4001` (Train Intel), `4002` (Journey/Station), `4003` (Reservation), and `4004` (Analytics).
  - **Tier 4 (Persistence)**: Local embedded SQLite repository with Write-Ahead Logging (`WAL`).

---

## 2. Inter-Process Communication (IPC)
- **DCS Principle**: Independent operating system processes cannot share address space memory directly and must exchange structured messages across network sockets or ports.
- **RailSync Implementation**:
  - Services execute in **separate Node.js OS processes** managed by `concurrently`.
  - Services communicate exclusively across TCP ports via **HTTP/JSON message passing**.
  - No service imports runtime modules or in-memory state variables of another service (`forwardRequest()` in `services/gateway/server.ts` issues actual network HTTP calls).

---

## 3. RPC Distinction: REST vs Remote Procedure Calls
- **DCS Principle**:
  - **REST**: Resource-oriented architecture using standard HTTP verbs (`GET`, `POST`, `DELETE`) operating on uniform resource identifiers (URIs).
  - **RPC (Remote Procedure Call)**: Procedure-oriented architecture where a client executes a named subroutine on a remote computer without explicitly programming the network details.
- **RailSync Implementation**:
  - RailSync provides both models:
    - Normal data retrieval uses REST (`/api/trains/12951/live`).
    - An explicit **JSON-RPC 2.0 module** (`shared/rpc.ts`) runs on port `4004` (`/rpc`).
    - The client sends a payload specifying `jsonrpc: "2.0"`, procedure `method: "analytics.getTrendVelocity"`, structured `params`, and a unique invocation `id`. The server unmarshals arguments, dispatches the procedure, and marshals the result back.

---

## 4. Concurrency & In-Flight Request Deduplication
- **DCS Principle**: Managing simultaneous asynchronous incoming requests to avoid race conditions, redundant CPU work, and upstream resource exhaustion.
- **RailSync Implementation**:
  - Implemented in `shared/quota-cache-manager.ts` via `executeWithDeduplication(key, fn)`.
  - When 5 client instances simultaneously request live status for train `12951`, the system registers a single shared Promise in an in-memory lock map.
  - All 5 concurrent callers await that single execution; only 1 outbound request is ever made, protecting upstream limits.

---

## 5. Partial Failure Handling
- **DCS Principle**: In a distributed system, individual components can fail while other components remain functioning (unlike a monolith where a single fatal crash halts everything).
- **RailSync Implementation**:
  - Demonstrated live in the **Distributed Services Monitor** view (`client/src/views/DistributedMonitorView.tsx`).
  - If `train-intel` (port 4001) suffers a 503 outage, the Gateway catches the failure and returns a structured 503 error for live tracking.
  - Crucially, `journey-station` (port 4002), `reservation` (port 4003), and `analytics` (port 4004) **continue operating with zero degradation**.

---

## 6. Fault Tolerance & Deadlines (Timeouts)
- **DCS Principle**: Preventing cascading failures caused by slow or stalled downstream nodes consuming thread pools indefinitely.
- **RailSync Implementation**:
  - Implemented in `services/gateway/server.ts` via `AbortController` with a **4000ms deadline**.
  - If any downstream microservice hangs or drops TCP packets, the Gateway cancels the connection and returns `DOWNSTREAM_SERVICE_TIMEOUT` rather than blocking the client.

---

## 7. Self-Healing & Service Recovery
- **DCS Principle**: Nodes returning to a healthy state should automatically reintegrate into the cluster without manual cluster restarts.
- **RailSync Implementation**:
  - In `DistributedMonitorView.tsx`, clicking **"Restore Service"** clears the fault-injection flag in SQLite.
  - The Gateway heartbeat poller immediately detects HTTP 200 responses on the next cycle, resetting service status back to **UP** and restoring overall cluster status to **HEALTHY**.

---

## 8. Data Aggregation (Scatter-Gather Pattern)
- **DCS Principle**: A coordinator node queries multiple independent service endpoints concurrently and merges the partial results into a cohesive compound payload.
- **RailSync Implementation**:
  - Implemented in `services/gateway/server.ts` at `/api/overview`.
  - The Gateway triggers `Promise.all()` across `train-intel` (port 4001), `analytics` (port 4004), and `quota` (internal governor).
  - Even if one downstream service fails during aggregation, the gateway supplies fallback defaults for that slice while returning the successful slices.

---

## 9. Distributed Monitoring & Heartbeats
- **DCS Principle**: Active health checking and telemetry collection across distributed nodes to determine cluster health and detect liveness failures.
- **RailSync Implementation**:
  - Every microservice exposes an independent `/health` endpoint returning uptime, port, processed request count, and failure flags.
  - The API Gateway queries `/health` across all nodes every 3 seconds to maintain cluster-wide metrics (`ServiceHealthRepository` in `data/db/index.ts`).

---

## 10. Genuine Microservice IPC vs. Simulated Upstream Provider
- **DCS Principle**: A distributed system's architectural validity lies in the independent lifecycle, separate address space, socket-based communication, and failure isolation of its internal processing nodes—NOT whether it reaches out across the public internet to a third-party SaaS API.
- **RailSync Implementation**:
  - **Genuine Inter-Service HTTP IPC (Ports 4000–4004)**:
    - The Gateway (`services/gateway/server.ts`, port `4000`) and the 4 domain services (`train-intel`: `4001`, `journey-station`: `4002`, `reservation`: `4003`, `analytics`: `4004`) execute in completely independent Node.js processes.
    - All inter-service communication utilizes real TCP loopback sockets over HTTP/1.1 (`fetch('http://localhost:400X/...')`), serializing requests into JSON byte buffers, utilizing OS networking stacks, obeying timeouts via `AbortController`, and handling real HTTP error codes (e.g., 503 Service Unavailable, 404 Not Found, 408 Timeout).
    - Fault injection in `DistributedMonitorView` targets this internal network fabric, proving genuine partial failure and recovery.
  - **Simulated External Provider Emulation (`DemoRailwayAdapter`)**:
    - To guarantee 100% offline reliability, zero external quota exhaustion, and deterministic laboratory conditions, external railway API calls (to `api.railradar.in`) are intercepted and fulfilled locally by `DemoRailwayAdapter`.
    - The adapter queries comprehensive local JSON fixtures (134 trains, 171 stations, 134 routes, 25 coach layouts, 35 platform alignments, 30 PNRs, 58 suburban, 26 freight) and deterministic simulation engines.
    - The API Registry Test Console (`/api-registry`) even simulates upstream HTTP status codes (200, 404, 429, 503), trace IDs, and network latencies locally, allowing students and evaluators to study upstream error handling without external dependencies.

---

## 11. Data Provenance & Honest Transparency
- **DCS Principle**: In distributed data processing, data origin and transformation lineage must be transparently tracked and displayed so clients can verify trustworthiness.
- **RailSync Implementation**:
  - Every single API response and frontend view displays strict, honest provenance badges:
    - `LOCAL_JSON_FIXTURE`: Static timetable, station, coach, or platform catalog data loaded from local fixtures.
    - `LOCAL_SIMULATION`: Dynamically computed results (e.g., deterministic train live position interpolation, PNR confirmation prediction, refund calculations).
    - `SIMULATED_PROVIDER_RESPONSE`: Mock upstream railway provider response with simulated headers, trace IDs, and latencies.
    - `LOCAL_CACHE`: Served from the in-memory TTL cache with zero computational overhead.
    - `UNAVAILABLE`: Service degraded or endpoint unreachable.
  - RailSync never masks offline data with misleading labels like `LIVE_PROVIDER_DATA`.
