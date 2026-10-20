import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { DataSourceLabel } from '../../shared/types.js';
import { ServiceHealthRepository } from '../../data/db/index.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.JOURNEY_SERVICE_PORT || '4002', 10);
const SERVICE_ID = 'journey-station';

app.use(cors());
app.use(express.json());

const startTime = Date.now();
let requestCount = 0;

// Load fixtures
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

  // Find trains whose route contains both 'from' and 'to' in sequence
  const directTrains = trainsData.filter(t => {
    const fromIdx = t.route.findIndex((h: any) => h.stationCode === from);
    const toIdx = t.route.findIndex((h: any) => h.stationCode === to);
    return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
  });

  const routes = directTrains.map(t => {
    const fromHalt = t.route.find((h: any) => h.stationCode === from);
    const toHalt = t.route.find((h: any) => h.stationCode === to);
    return {
      type: 'Direct Route',
      trainNumber: t.trainNumber,
      trainName: t.trainName,
      departureStation: fromHalt.stationName,
      departureTime: fromHalt.scheduledDeparture,
      arrivalStation: toHalt.stationName,
      arrivalTime: toHalt.scheduledArrival,
      durationMinutes: Math.abs(toHalt.distanceKm - fromHalt.distanceKm) * 0.9,
      distanceKm: toHalt.distanceKm - fromHalt.distanceKm,
      operatingDays: t.operatingDays
    };
  });

  res.json({
    success: true,
    data: {
      from,
      to,
      date,
      totalRoutesFound: routes.length,
      routes
    },
    meta: {
      traceId: `plan-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 2,
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'ROUTE_PLANNER'
    }
  });
});

// 2. Trains Between Stations (GET /v1/trains/between?from=...&to=...&date=...)
app.get('/trains/between', (req, res) => {
  const from = ((req.query.from as string) || '').toUpperCase().trim();
  const to = ((req.query.to as string) || '').toUpperCase().trim();
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const matchedTrains = trainsData.filter(t => {
    const fromIdx = t.route.findIndex((h: any) => h.stationCode === from);
    const toIdx = t.route.findIndex((h: any) => h.stationCode === to);
    return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
  });

  const trains = matchedTrains.map(t => {
    const fromHalt = t.route.find((h: any) => h.stationCode === from);
    const toHalt = t.route.find((h: any) => h.stationCode === to);
    return {
      trainNumber: t.trainNumber,
      trainName: t.trainName,
      category: t.category,
      departureTime: fromHalt.scheduledDeparture,
      arrivalTime: toHalt.scheduledArrival,
      departurePlatform: fromHalt.platform || '1',
      duration: `${Math.floor((toHalt.distanceKm - fromHalt.distanceKm) / 80)}h ${Math.round(((toHalt.distanceKm - fromHalt.distanceKm) % 80) * 0.7)}m`,
      runningDays: t.operatingDays,
      classes: t.classes
    };
  });

  res.json({
    success: true,
    data: {
      fromStation: from,
      toStation: to,
      date,
      trains
    },
    meta: {
      traceId: `btw-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 2,
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'TRAINS_BETWEEN_STATIONS'
    }
  });
});

// 3. Station Autocomplete & Search (GET /v1/stations/search?query=...)
app.get('/stations/search', (req, res) => {
  const query = ((req.query.query as string) || '').toLowerCase().trim();
  const results = stationsData.filter(
    s => s.code.toLowerCase().includes(query) || s.name.toLowerCase().includes(query) || s.city.toLowerCase().includes(query)
  );

  res.json({
    success: true,
    data: results,
    meta: { traceId: `stn-search-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
  });
});

// 4. Station Details (GET /v1/stations/:code)
app.get('/stations/:code', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const station = stationsData.find(s => s.code === code);
  if (!station) {
    return res.status(404).json({ success: false, error: { code: 'STATION_NOT_FOUND', message: `Station ${code} not found` } });
  }

  res.json({
    success: true,
    data: station,
    meta: { traceId: `stn-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
  });
});

// 5. Station Schedule (GET /v1/stations/:code/schedule)
app.get('/stations/:code/schedule', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const station = stationsData.find(s => s.code === code);

  const haltingTrains = trainsData.filter(t => t.route.some((h: any) => h.stationCode === code));
  const schedule = haltingTrains.map(t => {
    const halt = t.route.find((h: any) => h.stationCode === code);
    return {
      trainNumber: t.trainNumber,
      trainName: t.trainName,
      arrivalTime: halt.scheduledArrival,
      departureTime: halt.scheduledDeparture,
      platform: halt.platform || '1',
      origin: t.origin.name,
      destination: t.destination.name,
      days: t.operatingDays
    };
  });

  res.json({
    success: true,
    data: {
      stationCode: code,
      stationName: station?.name || code,
      schedule
    },
    meta: {
      traceId: `sched-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 2,
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'STATION_SCHEDULE'
    }
  });
});

// 6. Live Departures (GET /v1/stations/:code/live-departures)
app.get('/stations/:code/live-departures', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const station = stationsData.find(s => s.code === code);

  const departures = trainsData
    .filter(t => t.route.some((h: any) => h.stationCode === code))
    .map(t => {
      const halt = t.route.find((h: any) => h.stationCode === code);
      return {
        trainNumber: t.trainNumber,
        trainName: t.trainName,
        scheduledDeparture: halt.scheduledDeparture,
        expectedDeparture: halt.actualDeparture || halt.scheduledDeparture,
        delayMinutes: halt.delayDepartureMinutes || 0,
        platform: halt.platform || '1',
        status: (halt.delayDepartureMinutes || 0) === 0 ? 'On Time' : `Delayed ${halt.delayDepartureMinutes}m`,
        destination: t.destination.name
      };
    });

  res.json({
    success: true,
    data: {
      stationCode: code,
      stationName: station?.name || code,
      departures
    },
    meta: {
      traceId: `dep-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 2,
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'LIVE_DEPARTURES'
    }
  });
});

// 7. Station Directory (GET /v1/stations)
app.get('/stations', (req, res) => {
  res.json({
    success: true,
    data: stationsData,
    meta: { traceId: `stndir-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
  });
});

// 8. NTES Stations
app.get('/stations/ntes', (req, res) => {
  res.json({
    success: true,
    data: stationsData.map(s => ({ stationCode: s.code, ntesNodeActive: true, computerizedEnquiryUnit: true })),
    meta: { traceId: `stnntes-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
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
    meta: { traceId: `stncmp-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
  });
});

// 10. Suburban Timetables & Cities
app.get('/suburban/timetables', (req, res) => {
  const city = (req.query.city as string) || '';
  const filtered = city ? suburbanData.timetables.filter((t: any) => t.city.toLowerCase() === city.toLowerCase()) : suburbanData.timetables;

  res.json({
    success: true,
    data: filtered,
    meta: { traceId: `suburban-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
  });
});

app.get('/suburban/cities', (req, res) => {
  res.json({
    success: true,
    data: suburbanData.cities,
    meta: { traceId: `suburbancities-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
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
    meta: { traceId: `stnkvs-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
  });
});

app.listen(PORT, () => {
  console.log(`[Service: Journey & Station] running on port ${PORT}`);
});
