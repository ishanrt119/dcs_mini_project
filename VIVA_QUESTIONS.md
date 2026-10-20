# RailSync — DCS Viva Examination Questions & Answers

This guide prepares you for academic viva evaluations, explaining architectural decisions, distributed computing concepts, and trade-offs made in RailSync.

---

### Q1: Explain why RailSync is genuinely a distributed system.
**Answer:**
A distributed system is a collection of autonomous computing entities that communicate over a network to achieve a common goal and present themselves to users as a single coherent system.
RailSync satisfies this definition because:
1. It is composed of **5 physically independent operating system processes** running on different TCP ports (`4000`, `4001`, `4002`, `4003`, `4004`).
2. The processes do not share heap memory or runtime variables; they exchange state strictly using **network sockets and HTTP/JSON message passing**.
3. It exhibits **independent failure modes** — one service can crash or return 503 without crashing the others.
4. The API Gateway orchestrates and abstracts this multi-service topology so the user interface perceives a single coherent platform.

---

### Q2: Explain Inter-Process Communication (IPC) and how RailSync services communicate.
**Answer:**
IPC is the mechanism that allows independent processes to manage and synchronize shared data across process boundaries.
In RailSync, IPC is implemented via **Application-Layer HTTP/REST and JSON-RPC 2.0 over TCP/IP sockets**.
When a client requests a journey plan, the API Gateway at port `4000` issues an actual HTTP `fetch()` request over `http://localhost:4002/routes/plan`. The payload is serialized into JSON byte buffers, transmitted across TCP loopback sockets, unmarshaled by Express on port `4002`, executed, and returned back as a JSON response.

---

### Q3: Explain why simply calling an external third-party API (like RailRadar or OpenWeather) does NOT make an application a distributed system.
**Answer:**
A single monolithic web app that makes a `fetch()` call to an external API is merely a **client consuming a remote web service**. The application itself has zero internal distributed architecture:
- It has no independent internal processes.
- It has no internal partial failure management.
- It has no inter-service coordination, scatter-gather aggregation, or local fault isolation.
- If the monolith crashes, 100% of the application crashes.
In RailSync, the distributed system is our **internal cluster architecture** (Gateway + 4 Domain Microservices + JSON-RPC + Fault Injection Engine). The external RailRadar API is merely one upstream data provider adapted at our edge layer.

---

### Q4: Explain caching and request deduplication in RailSync.
**Answer:**
- **Endpoint-Specific TTL Caching**: Since RailRadar enforces a strict 100-request monthly quota, RailSync implements a multi-tier cache. Rapidly changing data (like live train delays) is cached for 120 seconds, while static timetables are cached for 24 hours. Subsequent requests within the TTL window are served with a `CACHED_PROVIDER_DATA` badge with zero quota consumption.
- **In-Flight Request Deduplication**: If multiple client threads simultaneously query the same train before the first request finishes, ordinary caches fail because nothing is stored yet (a cache stampede). RailSync stores active `Promise` instances in an in-flight map. All concurrent queries attach to the single active promise and resolve together, ensuring only one outbound request is ever dispatched.

---

### Q5: What is Partial Failure, and how is it demonstrated in RailSync?
**Answer:**
In centralized computing, failure is binary: either the whole program runs or it crashes. In distributed systems, a **partial failure** occurs when one service fails while the rest of the system continues functioning normally.
In RailSync, this is demonstrated using the **Distributed Services Monitor** (`/distributed-monitor`):
1. The evaluator clicks **"Simulate 503 Outage"** on the Train Intelligence Service (`train-intel`).
2. If the user navigates to Live Tracking, it displays an isolated degraded state (`SERVICE_UNAVAILABLE`).
3. However, if the user navigates to the Journey Planner or Reservation Calculator, those services **continue functioning at full speed with zero downtime**.

---

### Q6: What is Fault Tolerance, and how do Deadlines (Timeouts) prevent cascade failure?
**Answer:**
Fault tolerance is the property that enables a system to continue operating properly in the event of failure of some of its components.
If a downstream microservice experiences high CPU lockup or network partition, a naive gateway would leave HTTP connections open waiting indefinitely. This exhausts the gateway's socket pool and eventually crashes the entire system (a cascading failure).
RailSync prevents this by configuring **4000ms AbortController deadlines** on all inter-service requests. If a service does not respond within 4 seconds, the gateway terminates the socket and immediately returns a graceful fallback error.

---

### Q7: Explain Service Recovery and Self-Healing.
**Answer:**
Service recovery is the ability of a distributed cluster to automatically detect that a previously degraded or offline node has restored its operational capabilities and reintegrate it into active routing.
RailSync implements periodic health heartbeats every 3000ms. When a simulated outage is cleared, the Gateway's next heartbeat receives an HTTP 200, automatically resets the node's metric to **UP**, and updates cluster status from **DEGRADED** back to **HEALTHY** without requiring manual intervention or restarts.

---

### Q8: What is the difference between REST and RPC?
**Answer:**
- **REST (Representational State Transfer)**:
  - Architecture is **Resource-Oriented**.
  - Operates using standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) on URI paths representing nouns (e.g., `GET /v1/trains/12951`).
  - Emphasizes uniform interfaces and stateless client-server interaction.
- **RPC (Remote Procedure Call)**:
  - Architecture is **Action/Procedure-Oriented**.
  - Operates by executing a specific function on a remote machine with input arguments and returning an output value (e.g., calling `analytics.getTrendVelocity({ trainNumber: "12951" })`).
  - RailSync implements a dedicated **JSON-RPC 2.0 specification module** (`shared/rpc.ts`) where payloads carry `jsonrpc`, `method`, `params`, and invocation `id` for procedure dispatch.

---

### Q9: How does RailSync protect the strict 100-request RailRadar API quota?
**Answer:**
RailSync implements an API Request Budget Manager with 5 strict rules:
1. **Conservative Internal Cap**: Hard cap set at 80 requests/month, keeping a 20-request buffer for emergency evaluations.
2. **Mandatory Demo Mode**: Configured with `DEMO_MODE=true` and `LIVE_API_ENABLED=false` by default, serving deterministic mock fixtures.
3. **No Automatic Polling**: Rendering dashboard components or viewing watchlists never triggers upstream queries.
4. **Pre-flight Permission Verification**: Every outbound request must pass a 5-step policy check (budget remaining, live mode active, API key present, endpoint cataloged).
5. **Transparent Source Badges**: The UI visibly differentiates between `LIVE_PROVIDER_DATA`, `CACHED_PROVIDER_DATA`, `SIMULATED_DEMO_DATA`, and `LOCAL_HISTORICAL_OBSERVATION`.

---

### Q10: How does the Gateway implement Data Aggregation (Scatter-Gather)?
**Answer:**
The `/api/overview` endpoint uses the Scatter-Gather distributed pattern:
1. **Scatter**: The Gateway concurrently dispatches asynchronous HTTP queries across `train-intel` (port 4001), `analytics` (port 4004), and local database repositories via `Promise.all()`.
2. **Gather**: When responses return, the Gateway collates train coordinates, incident streams, cluster health states, and quota balances into a unified composite JSON document.
3. **Fault Tolerance**: If one branch fails, the aggregator isolates the failure and returns partial results rather than failing the entire request.

---

### Q11: What are the current limitations of RailSync, and how would you scale it in production?
**Answer:**
- **Current Limitations**:
  - Services are co-located on a single physical host communicating over localhost ports.
  - In-memory cache is node-local rather than a distributed shared cache like Redis.
  - Persistence is embedded SQLite rather than a distributed database cluster.
- **Production Scaling Path**:
  - Deploy each service in Docker containers managed by Kubernetes.
  - Replace the in-memory cache with a distributed Redis cluster.
  - Replace HTTP IPC with high-throughput binary **gRPC over HTTP/2** with Protocol Buffers for lower serialization overhead.
  - Implement Raft consensus for leader election among analytics nodes.
