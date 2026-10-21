import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { ApiResponse, LiveTrainStatus, TrainDetail, DataSourceLabel } from '../../shared/types.js';
import { QuotaCacheManager } from '../../shared/quota-cache-manager.js';
import { DemoRailwayAdapter } from '../../shared/demo-railway-adapter.js';
import { SnapshotsRepository, ServiceHealthRepository } from '../../data/db/index.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.TRAIN_SERVICE_PORT || '4001', 10);
const SERVICE_ID = 'train-intel';

app.use(cors());
app.use(express.json());

const startTime = Date.now();
let requestCount = 0;
const quotaManager = QuotaCacheManager.getInstance();
const demoAdapter = DemoRailwayAdapter.getInstance();

// Load local fixtures for fast access
const trainsFixturePath = path.resolve(process.cwd(), 'data/fixtures/trains.json');
const trainsData: any[] = JSON.parse(fs.readFileSync(trainsFixturePath, 'utf-8'));

// Middleware for simulated outage & metrics
app.use((req, res, next) => {
  requestCount++;
  if (ServiceHealthRepository.isSimulatedFailure(SERVICE_ID) && !req.path.startsWith('/admin') && req.path !== '/health') {
    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_OUTAGE_SIMULATED',
        message: 'Train Intelligence Service is temporarily unavailable (Simulated 503 Fault Injection)'
      },
      meta: {
        traceId: `err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        executionTimeMs: 2,
        source: 'UNAVAILABLE' as DataSourceLabel
      }
    });
  }
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  const isFailed = ServiceHealthRepository.isSimulatedFailure(SERVICE_ID);
  const status = isFailed ? 'DEGRADED' : 'UP';
  res.status(isFailed ? 503 : 200).json({
    serviceId: SERVICE_ID,
    name: 'Train Intelligence Service',
    port: PORT,
    status,
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    requestCount,
    isSimulatedFailure: isFailed,
    timestamp: new Date().toISOString()
  });
});

// Admin failure injection toggle
app.post('/admin/simulate-failure', (req, res) => {
  const { fail } = req.body;
  ServiceHealthRepository.setSimulatedFailure(SERVICE_ID, !!fail);
  res.json({
    success: true,
    serviceId: SERVICE_ID,
    simulatedFailure: !!fail,
    message: `Train Intelligence Service simulated outage set to ${!!fail}`
  });
});

// ------------------- Train Intelligence Endpoints -------------------

// 1. Live Train Running Status (GET /v1/trains/:number/live)
app.get('/trains/:number/live', async (req, res) => {
  const reqStart = Date.now();
  const trainNumber = req.params.number.trim();
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const authoritative = req.query.authoritative === 'true';
  const haltsOnly = req.query.haltsOnly === 'true';
  const geometry = req.query.geometry === 'true';

  const cacheKey = `train_live_${trainNumber}_${date}_${haltsOnly}_${geometry}`;

  // Check internal cache first (unless user explicitly requests authoritative=true)
  if (!authoritative) {
    const cached = quotaManager.getCached<LiveTrainStatus>(cacheKey);
    if (cached.hit && cached.data) {
      quotaManager.recordCacheHitLog('TRAIN_LIVE_STATUS', `/v1/trains/${trainNumber}/live`, trainNumber);
      return res.json({
        success: true,
        data: cached.data,
        meta: {
          traceId: `cache-${Date.now()}`,
          timestamp: new Date().toISOString(),
          executionTimeMs: Date.now() - reqStart,
          source: 'LOCAL_CACHE' as DataSourceLabel,
          isCached: true,
          cacheTtlRemainingSec: cached.ttlRemainingSec,
          endpointId: 'TRAIN_LIVE_STATUS'
        }
      });
    }
  }

  // Obtain simulated status deterministically from Demo Railway Adapter
  const liveResult = demoAdapter.getLiveTrainStatus(trainNumber, date);

  if (liveResult) {
    quotaManager.setCached(cacheKey, liveResult.status, 60);

    // Save snapshot for trend analytics
    SnapshotsRepository.save(
      trainNumber,
      liveResult.status.delayMinutes || 0,
      liveResult.status.currentLocation?.stationCode || '',
      liveResult.status.currentSpeedKmph || 0,
      liveResult.status.status || 'Running'
    );

    return res.json({
      success: true,
      data: liveResult.status,
      meta: {
        traceId: `sim-${Date.now()}`,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - reqStart,
        source: liveResult.source,
        endpointId: 'TRAIN_LIVE_STATUS'
      }
    });
  }

  // Fallback for arbitrary unregistered numbers
  const fallbackTrain: LiveTrainStatus = {
    trainNumber,
    trainName: `Special Express #${trainNumber}`,
    startDate: date,
    lastUpdatedAt: new Date().toISOString(),
    status: 'Running On Time',
    delayMinutes: 0,
    currentSpeedKmph: 95,
    isLive: true,
    currentLocation: {
      stationCode: 'CNB',
      stationName: 'Kanpur Central',
      distanceFromOriginKm: 440,
      lat: 26.4537,
      lng: 80.3512
    },
    exceptions: [],
    route: [
      { stationCode: 'NDLS', stationName: 'New Delhi', scheduledArrival: '06:00', scheduledDeparture: '06:00', actualArrival: '06:00', actualDeparture: '06:00', delayArrivalMinutes: 0, delayDepartureMinutes: 0, distanceKm: 0, dayNumber: 1, platform: '1', hasDeparted: true },
      { stationCode: 'CNB', stationName: 'Kanpur Central', scheduledArrival: '11:00', scheduledDeparture: '11:05', actualArrival: '11:00', actualDeparture: '11:05', delayArrivalMinutes: 0, delayDepartureMinutes: 0, distanceKm: 440, dayNumber: 1, platform: '2', hasDeparted: false, isCurrent: true },
      { stationCode: 'HWH', stationName: 'Howrah Junction', scheduledArrival: '20:30', scheduledDeparture: '20:30', delayArrivalMinutes: 0, delayDepartureMinutes: 0, distanceKm: 1450, dayNumber: 1, platform: '8', hasDeparted: false }
    ]
  };

  quotaManager.setCached(cacheKey, fallbackTrain, 60);
  SnapshotsRepository.save(trainNumber, 0, 'CNB', 95, 'Running On Time');

  return res.json({
    success: true,
    data: fallbackTrain,
    meta: {
      traceId: `demo-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - reqStart,
      source: 'LOCAL_SIMULATION' as DataSourceLabel,
      endpointId: 'TRAIN_LIVE_STATUS'
    }
  });
});

// 2. Timetable & Halts (GET /v1/trains/:number/timetable)
app.get('/trains/:number/timetable', (req, res) => {
  const trainNumber = req.params.number.trim();
  const matched = trainsData.find(t => t.trainNumber === trainNumber);

  if (!matched) {
    return res.status(404).json({
      success: false,
      error: { code: 'TRAIN_NOT_FOUND', message: `Timetable for train ${trainNumber} not found.` },
      meta: { traceId: `err-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'UNAVAILABLE' as DataSourceLabel }
    });
  }

  res.json({
    success: true,
    data: {
      trainNumber: matched.trainNumber,
      trainName: matched.trainName,
      operatingDays: matched.operatingDays,
      halts: matched.route
    },
    meta: {
      traceId: `tt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 1,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
      endpointId: 'TRAIN_TIMETABLE_HALTS'
    }
  });
});

// 3. Route Geometry (GET /v1/trains/:number/geometry)
app.get('/trains/:number/geometry', (req, res) => {
  const trainNumber = req.params.number.trim();
  const matched = trainsData.find(t => t.trainNumber === trainNumber) || trainsData[0];

  const coordinates = matched.route
    .filter((h: any) => h.lat && h.lng)
    .map((h: any) => [h.lat, h.lng]);

  res.json({
    success: true,
    data: {
      trainNumber: matched.trainNumber,
      type: 'LineString',
      coordinates: coordinates.length > 0 ? coordinates : [[28.6424, 77.2195], [18.9696, 72.8193]]
    },
    meta: {
      traceId: `geo-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 1,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
      endpointId: 'TRAIN_ROUTE_GEOMETRY'
    }
  });
});

// 4. Coach Layout (GET /v1/trains/:number/coach-layout)
app.get('/trains/:number/coach-layout', (req, res) => {
  const trainNumber = req.params.number.trim();
  const layout = demoAdapter.getCoachLayout(trainNumber);

  if (!layout) {
    return res.status(404).json({
      success: false,
      error: { code: 'LAYOUT_NOT_FOUND', message: `Coach layout for ${trainNumber} not found` },
      meta: { traceId: `err-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'UNAVAILABLE' as DataSourceLabel }
    });
  }

  res.json({
    success: true,
    data: layout,
    meta: {
      traceId: `coach-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 1,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
      endpointId: 'TRAIN_COACH_LAYOUT'
    }
  });
});

// 5. Platform Position (GET /v1/trains/:number/platform-positions)
app.get('/trains/:number/platform-positions', (req, res) => {
  const trainNumber = req.params.number.trim();
  const layout = demoAdapter.getCoachLayout(trainNumber);
  const train = trainsData.find(t => t.trainNumber === trainNumber) || trainsData[0];
  const stationCode = (req.query.stationCode as string) || train.origin.code;

  const positions = (layout?.coaches || []).map((c: any) => ({
    coachCode: c.coachCode,
    classType: c.classType,
    position: c.positionFromEngine,
    platformAlignment: c.positionFromEngine <= 3 ? 'Front of Platform' : c.positionFromEngine <= 6 ? 'Center of Platform' : 'Rear of Platform',
    nearestFob: c.positionFromEngine <= 3 ? 'North Foot Over Bridge' : c.positionFromEngine <= 6 ? 'Central Main FOB' : 'South Foot Over Bridge',
    escalatorProximityMeters: Math.round(c.positionFromEngine * 22)
  }));

  res.json({
    success: true,
    data: {
      trainNumber,
      trainName: train.trainName,
      currentStation: stationCode,
      platform: '1',
      positions
    },
    meta: {
      traceId: `plat-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 1,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
      endpointId: 'TRAIN_PLATFORM_POSITION'
    }
  });
});

// 6. Train Autocomplete & Search (GET /v1/trains/search)
app.get('/trains/search', async (req, res) => {
  const reqStart = Date.now();
  const query = ((req.query.query as string) || '').toLowerCase().trim();
  const results = demoAdapter.searchTrains(query);

  res.json({
    success: true,
    data: results,
    meta: {
      traceId: `search-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - reqStart,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
      endpointId: 'TRAIN_SEARCH'
    }
  });
});

// 7. Train Directory (GET /v1/trains)
app.get('/trains', (req, res) => {
  const category = (req.query.category as string) || '';
  const filtered = demoAdapter.getTrainDirectory(category);

  res.json({
    success: true,
    data: filtered,
    meta: {
      traceId: `dir-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 1,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel
    }
  });
});

// 8. Categories & Speed Types & Reference Endpoints
app.get('/trains/categories', (req, res) => {
  const categories = Array.from(new Set(trainsData.map(t => t.category)));
  res.json({
    success: true,
    data: categories.length > 0 ? categories : ['Vande Bharat Express', 'Rajdhani Express', 'Shatabdi Express', 'Duronto Express', 'Superfast Express'],
    meta: { traceId: `cat-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel }
  });
});

app.get('/trains/speed-types', (req, res) => {
  res.json({
    success: true,
    data: [
      { type: 'Semi-High Speed (160 km/h)', maxKmph: 160, priority: 1 },
      { type: 'Superfast (130 km/h)', maxKmph: 130, priority: 2 },
      { type: 'Superfast (120 km/h)', maxKmph: 120, priority: 3 },
      { type: 'Express (110 km/h)', maxKmph: 110, priority: 4 },
      { type: 'Commuter Local (80 km/h)', maxKmph: 80, priority: 5 }
    ],
    meta: { traceId: `spd-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel }
  });
});

app.get('/trains/prs', (req, res) => {
  res.json({
    success: true,
    data: trainsData.slice(0, 50).map(t => ({
      trainNumber: t.trainNumber,
      trainName: t.trainName,
      prsQuotaPool: 'Standard Northern/Western PRS Pool',
      hasTatkal: true
    })),
    meta: { traceId: `prs-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel }
  });
});

app.get('/trains/ntes', (req, res) => {
  res.json({
    success: true,
    data: trainsData.slice(0, 50).map(t => ({
      trainNumber: t.trainNumber,
      ntesTrackingStatus: 'Active Local Telemetry Feed',
      reportingStation: t.currentLocation.stationCode
    })),
    meta: { traceId: `ntes-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel }
  });
});

// Compressed feeds
app.get('/trains/compressed', (req, res) => {
  const rawString = JSON.stringify(trainsData.map(t => [t.trainNumber, t.trainName, t.category]));
  const compressedBase64 = Buffer.from(rawString).toString('base64');
  res.json({
    success: true,
    data: {
      encoding: 'base64-json-tuple',
      checksum: 'sha256-d83bf910',
      recordCount: trainsData.length,
      payload: compressedBase64
    },
    meta: { traceId: `cmp-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel }
  });
});

app.get('/trains/prs/compressed', (req, res) => {
  const prsData = trainsData.map(t => ({ num: t.trainNumber, prs: true, cls: t.classes }));
  res.json({
    success: true,
    data: {
      encoding: 'base64-json',
      checksum: 'sha256-a192c4',
      payload: Buffer.from(JSON.stringify(prsData)).toString('base64')
    },
    meta: { traceId: `cmpprs-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel }
  });
});

app.get('/trains/kvs', (req, res) => {
  const kvMap: Record<string, string> = {};
  trainsData.forEach(t => {
    kvMap[t.trainNumber] = t.trainName;
  });
  res.json({
    success: true,
    data: kvMap,
    meta: { traceId: `kvs-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel }
  });
});

// Train Details (GET /v1/trains/:number)
app.get('/trains/:number', async (req, res) => {
  const reqStart = Date.now();
  const trainNumber = req.params.number.trim();
  const cacheKey = `train_details_${trainNumber}`;

  const cached = quotaManager.getCached<TrainDetail>(cacheKey);
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
        endpointId: 'TRAIN_DETAILS'
      }
    });
  }

  const result = demoAdapter.getTrainDetail(trainNumber);
  if (!result) {
    return res.status(404).json({
      success: false,
      error: { code: 'TRAIN_NOT_FOUND', message: `Train number ${trainNumber} not found.` },
      meta: { traceId: `err-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'UNAVAILABLE' as DataSourceLabel }
    });
  }

  quotaManager.setCached(cacheKey, result.detail, 86400);
  res.json({
    success: true,
    data: result.detail,
    meta: {
      traceId: `demo-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - reqStart,
      source: result.source,
      endpointId: 'TRAIN_DETAILS'
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Service: Train Intelligence] running offline on port ${PORT}`);
});
