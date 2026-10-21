import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { DataSourceLabel } from '../../shared/types.js';
import { QuotaCacheManager } from '../../shared/quota-cache-manager.js';
import { DemoRailwayAdapter } from '../../shared/demo-railway-adapter.js';
import { ServiceHealthRepository } from '../../data/db/index.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.JOURNEY_SERVICE_PORT || '4002', 10);
const SERVICE_ID = 'journey-station';

app.use(cors());
app.use(express.json());

const startTime = Date.now();
let requestCount = 0;
const quotaManager = QuotaCacheManager.getInstance();
const demoAdapter = DemoRailwayAdapter.getInstance();

// Load local fixtures
const stationsData: any[] = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/fixtures/stations.json'), 'utf-8'));
const trainsData: any[] = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/fixtures/trains.json'), 'utf-8'));
const suburbanData: any = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/fixtures/suburban.json'), 'utf-8'));

// Outage middleware
app.use((req, res, next) => {
  requestCount++;
  if (ServiceHealthRepository.isSimulatedFailure(SERVICE_ID) && !req.path.startsWith('/admin') && req.path !== '/health') {
    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_OUTAGE_SIMULATED',
        message: 'Journey & Station Service is temporarily offline (Simulated 503 Fault Injection)'
      },
      meta: {
        traceId: `err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        executionTimeMs: 1,
        source: 'UNAVAILABLE' as DataSourceLabel
      }
    });
  }
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  const isFailed = ServiceHealthRepository.isSimulatedFailure(SERVICE_ID);
  res.status(isFailed ? 503 : 200).json({
    serviceId: SERVICE_ID,
    name: 'Journey & Station Service',
    port: PORT,
    status: isFailed ? 'DEGRADED' : 'UP',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    requestCount,
    isSimulatedFailure: isFailed,
    timestamp: new Date().toISOString()
  });
});

app.post('/admin/simulate-failure', (req, res) => {
  const { fail } = req.body;
  ServiceHealthRepository.setSimulatedFailure(SERVICE_ID, !!fail);
  res.json({ success: true, serviceId: SERVICE_ID, simulatedFailure: !!fail });
});

// 1. Route Planner (GET /v1/routes/plan?from=...&to=...&date=...)
app.get('/routes/plan', (req, res) => {
  const from = ((req.query.from as string) || '').toUpperCase().trim();
  const to = ((req.query.to as string) || '').toUpperCase().trim();
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const plan = demoAdapter.planRoutes(from, to, date);

  res.json({
    success: true,
    data: plan,
    meta: {
      traceId: `plan-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 2,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
      endpointId: 'ROUTE_PLANNER'
    }
  });
});

// 2. Trains Between Stations (GET /v1/trains/between?from=...&to=...&date=...)
app.get('/trains/between', async (req, res) => {
  const reqStart = Date.now();
  const from = ((req.query.from as string) || '').toUpperCase().trim();
  const to = ((req.query.to as string) || '').toUpperCase().trim();
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const cacheKey = `btw_${from}_${to}_${date}`;

  // Check TTL cache (2 hours)
  const cached = quotaManager.getCached<any>(cacheKey);
  if (cached.hit && cached.data) {
    return res.json({
      success: true,
      data: cached.data,
      meta: {
        traceId: `cache-btw-${Date.now()}`,
        timestamp: new Date().toISOString(),
        executionTimeMs: 1,
        source: 'LOCAL_CACHE' as DataSourceLabel,
        isCached: true,
        cacheTtlRemainingSec: cached.ttlRemainingSec,
        endpointId: 'TRAINS_BETWEEN_STATIONS'
      }
    });
  }

  const trains = demoAdapter.getTrainsBetween(from, to);
  const resultData = {
    fromStation: from,
    toStation: to,
    date,
    trains
  };

  quotaManager.setCached(cacheKey, resultData, 7200);

  res.json({
    success: true,
    data: resultData,
    meta: {
      traceId: `btw-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - reqStart,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
      endpointId: 'TRAINS_BETWEEN_STATIONS'
    }
  });
});

// 3. Station Autocomplete & Search (GET /v1/stations/search?query=...)
app.get('/stations/search', async (req, res) => {
  const reqStart = Date.now();
  const query = ((req.query.query as string) || '').toLowerCase().trim();
  const results = demoAdapter.searchStations(query);

  res.json({
    success: true,
    data: results,
    meta: {
      traceId: `stn-search-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - reqStart,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
      endpointId: 'STATION_SEARCH'
    }
  });
});

// 4. Station Details (GET /v1/stations/:code)
app.get('/stations/:code', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const station = demoAdapter.getStation(code);
  if (!station) {
    return res.status(404).json({
      success: false,
      error: { code: 'STATION_NOT_FOUND', message: `Station ${code} not found in offline dataset` },
      meta: { traceId: `err-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'UNAVAILABLE' as DataSourceLabel }
    });
  }

  res.json({
    success: true,
    data: station,
    meta: {
      traceId: `stn-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 1,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
      endpointId: 'STATION_DETAILS'
    }
  });
});

// 5. Station Schedule (GET /v1/stations/:code/schedule)
app.get('/stations/:code/schedule', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const scheduleData = demoAdapter.getStationSchedule(code);

  res.json({
    success: true,
    data: scheduleData,
    meta: {
      traceId: `sched-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 2,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
      endpointId: 'STATION_SCHEDULE'
    }
  });
});

// 6. Live Departures (GET /v1/stations/:code/live-departures)
app.get('/stations/:code/live-departures', async (req, res) => {
  const reqStart = Date.now();
  const code = req.params.code.toUpperCase().trim();
  const cacheKey = `live_dep_${code}`;

  const cached = quotaManager.getCached<any>(cacheKey);
  if (cached.hit && cached.data) {
    return res.json({
      success: true,
      data: cached.data,
      meta: {
        traceId: `cache-${Date.now()}`,
        timestamp: new Date().toISOString(),
        executionTimeMs: 1,
        source: 'LOCAL_CACHE' as DataSourceLabel,
        isCached: true,
        cacheTtlRemainingSec: cached.ttlRemainingSec,
        endpointId: 'LIVE_DEPARTURES'
      }
    });
  }

  const liveDepartures = demoAdapter.getLiveDepartures(code);
  quotaManager.setCached(cacheKey, liveDepartures, 60);

  res.json({
    success: true,
    data: liveDepartures,
    meta: {
      traceId: `dep-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - reqStart,
      source: 'LOCAL_SIMULATION' as DataSourceLabel,
      endpointId: 'LIVE_DEPARTURES'
    }
  });
});

// 7. Station Directory (GET /v1/stations)
app.get('/stations', (req, res) => {
  res.json({
    success: true,
    data: demoAdapter.getAllStations(),
    meta: {
      traceId: `stndir-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 1,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel
    }
  });
});

// 8. NTES Stations
app.get('/stations/ntes', (req, res) => {
  res.json({
    success: true,
    data: stationsData.slice(0, 80).map(s => ({
      stationCode: s.code,
      ntesNodeActive: true,
      computerizedEnquiryUnit: true
    })),
    meta: { traceId: `stnntes-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel }
  });
});

// 9. Compressed Stations
app.get('/stations/compressed', (req, res) => {
  const rawTuples = stationsData.map(s => [s.code, s.name, s.platforms, s.lat, s.lng]);
  res.json({
    success: true,
    data: {
      encoding: 'base64-station-matrix',
      recordCount: stationsData.length,
      payload: Buffer.from(JSON.stringify(rawTuples)).toString('base64')
    },
    meta: { traceId: `stncmp-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel }
  });
});

// 10. Suburban Timetables & Cities
app.get('/suburban/timetables', (req, res) => {
  const city = (req.query.city as string) || '';
  const data = demoAdapter.getSuburbanData(city);

  res.json({
    success: true,
    data: data.timetables,
    meta: { traceId: `suburban-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel }
  });
});

app.get('/suburban/cities', (req, res) => {
  const data = demoAdapter.getSuburbanData();
  res.json({
    success: true,
    data: data.cities,
    meta: { traceId: `suburbancities-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel }
  });
});

// 11. Stations KVs
app.get('/stations/kvs', (req, res) => {
  const kv: Record<string, string> = {};
  stationsData.forEach(s => {
    kv[s.code] = s.name;
  });
  res.json({
    success: true,
    data: kv,
    meta: { traceId: `stnkvs-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel }
  });
});

app.listen(PORT, () => {
  console.log(`[Service: Journey & Station] running offline on port ${PORT}`);
});
