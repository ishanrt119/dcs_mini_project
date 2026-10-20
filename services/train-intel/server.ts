import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { ApiResponse, LiveTrainStatus, TrainDetail, DataSourceLabel } from '../../shared/types.js';
import { QuotaCacheManager } from '../../shared/quota-cache-manager.js';
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

// Load local fixtures
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
  const format = (req.query.format as string) || 'coordinates';
  const includeCoordinates = req.query.includeCoordinates !== 'false';

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
          source: 'CACHED_PROVIDER_DATA' as DataSourceLabel,
          isCached: true,
          cacheTtlRemainingSec: cached.ttlRemainingSec,
          endpointId: 'TRAIN_LIVE_STATUS'
        }
      });
    }
  }

  // Pre-flight permission verification
  const permission = quotaManager.verifyOutboundPermission('TRAIN_LIVE_STATUS');

  if (permission.allowed) {
    // Live Outbound Call to RailRadar API
    try {
      const result = await quotaManager.executeWithDeduplication(cacheKey, async () => {
        const liveUrl = new URL(`${process.env.RAILRADAR_BASE_URL || 'https://api.railradar.in'}/v1/trains/${trainNumber}/live`);
        liveUrl.searchParams.set('date', date);
        if (authoritative) liveUrl.searchParams.set('authoritative', 'true');
        if (haltsOnly) liveUrl.searchParams.set('haltsOnly', 'true');
        if (geometry) liveUrl.searchParams.set('geometry', 'true');
        if (format) liveUrl.searchParams.set('format', format);
        if (includeCoordinates) liveUrl.searchParams.set('includeCoordinates', 'true');

        const apiResponse = await fetch(liveUrl.toString(), {
          headers: {
            'Authorization': `Bearer ${process.env.RAILRADAR_API_KEY}`,
            'Accept': 'application/json'
          }
        });

        const status = apiResponse.status;
        const duration = Date.now() - reqStart;
        quotaManager.recordOutboundLog('TRAIN_LIVE_STATUS', `/v1/trains/${trainNumber}/live`, trainNumber, status, duration);

        if (!apiResponse.ok) {
          throw new Error(`RailRadar provider returned HTTP ${status}: ${apiResponse.statusText}`);
        }

        const json = await apiResponse.json();
        return json;
      });

      // Cache live result for 120 seconds
      quotaManager.setCached(cacheKey, result.data, 120);

      // Save snapshot for trend analytics
      if (result.data) {
        SnapshotsRepository.save(
          trainNumber,
          result.data.delayMinutes || 0,
          result.data.currentLocation?.stationCode || '',
          result.data.currentSpeedKmph || 0,
          result.data.status || 'Running'
        );
      }

      return res.json({
        success: true,
        data: result.data,
        meta: {
          traceId: `live-${Date.now()}`,
          timestamp: new Date().toISOString(),
          executionTimeMs: Date.now() - reqStart,
          source: 'LIVE_PROVIDER_DATA' as DataSourceLabel,
          endpointId: 'TRAIN_LIVE_STATUS'
        }
      });
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        error: {
          code: 'UPSTREAM_PROVIDER_ERROR',
          message: err.message,
          quotaStatus: quotaManager.getQuotaStatus()
        },
        meta: {
          traceId: `err-${Date.now()}`,
          timestamp: new Date().toISOString(),
          executionTimeMs: Date.now() - reqStart,
          source: 'UNAVAILABLE' as DataSourceLabel
        }
      });
    }
  }

  // DEMO MODE / LOCAL FIXTURE FALLBACK (PROTECTS QUOTA)
  const matched = trainsData.find(t => t.trainNumber === trainNumber);
  if (!matched) {
    // Generate a structured deterministic mock for arbitrary 5-digit train numbers
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

    quotaManager.setCached(cacheKey, fallbackTrain, 120);
    SnapshotsRepository.save(trainNumber, 0, 'CNB', 95, 'Running On Time');

    return res.json({
      success: true,
      data: fallbackTrain,
      meta: {
        traceId: `demo-${Date.now()}`,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - reqStart,
        source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
        endpointId: 'TRAIN_LIVE_STATUS'
      }
    });
  }

  // Clone matched fixture with refreshed timestamp
  const demoStatus: LiveTrainStatus = {
    ...matched,
    startDate: date,
    lastUpdatedAt: new Date().toISOString()
  };

  // Cache and record snapshot
  quotaManager.setCached(cacheKey, demoStatus, 120);
  SnapshotsRepository.save(
    trainNumber,
    demoStatus.delayMinutes,
    demoStatus.currentLocation.stationCode,
    demoStatus.currentSpeedKmph,
    demoStatus.status
  );

  return res.json({
    success: true,
    data: demoStatus,
    meta: {
      traceId: `demo-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - reqStart,
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'TRAIN_LIVE_STATUS'
    }
  });
});

// 2. Train Details (GET /v1/trains/:number)
app.get('/trains/:number', (req, res) => {
  const trainNumber = req.params.number.trim();
  const matched = trainsData.find(t => t.trainNumber === trainNumber);
  if (!matched) {
    return res.status(404).json({
      success: false,
      error: { code: 'TRAIN_NOT_FOUND', message: `Train number ${trainNumber} not found in database.` },
      meta: { traceId: `err-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'UNAVAILABLE' as DataSourceLabel }
    });
  }

  const detail: TrainDetail = {
    trainNumber: matched.trainNumber,
    trainName: matched.trainName,
    category: matched.category,
    speedType: matched.speedType,
    origin: matched.origin,
    destination: matched.destination,
    totalDistanceKm: matched.totalDistanceKm,
    totalDurationMinutes: matched.totalDurationMinutes,
    operatingDays: matched.operatingDays,
    classes: matched.classes,
    pantryAvailable: matched.pantryAvailable,
    rakeType: matched.rakeType
  };

  res.json({
    success: true,
    data: detail,
    meta: {
      traceId: `detail-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 2,
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'TRAIN_DETAILS'
    }
  });
});

// 3. Timetable & Halts (GET /v1/trains/:number/timetable)
app.get('/trains/:number/timetable', (req, res) => {
  const trainNumber = req.params.number.trim();
  const matched = trainsData.find(t => t.trainNumber === trainNumber);
  if (!matched) {
    return res.status(404).json({ success: false, error: { code: 'TRAIN_NOT_FOUND', message: 'Train not found' } });
  }

  res.json({
    success: true,
    data: {
      trainNumber: matched.trainNumber,
      trainName: matched.trainName,
      halts: matched.route
    },
    meta: {
      traceId: `tt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 1,
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'TRAIN_TIMETABLE_HALTS'
    }
  });
});

// 4. Route Geometry (GET /v1/trains/:number/geometry)
app.get('/trains/:number/geometry', (req, res) => {
  const trainNumber = req.params.number.trim();
  const matched = trainsData.find(t => t.trainNumber === trainNumber);
  if (!matched || !matched.geometry) {
    return res.status(404).json({ success: false, error: { code: 'GEOMETRY_NOT_FOUND', message: 'Geometry not available for train' } });
  }

  res.json({
    success: true,
    data: matched.geometry,
    meta: {
      traceId: `geo-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 1,
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'TRAIN_ROUTE_GEOMETRY'
    }
  });
});

// 5. Coach Layout (GET /v1/trains/:number/coach-layout)
app.get('/trains/:number/coach-layout', (req, res) => {
  const trainNumber = req.params.number.trim();
  const matched = trainsData.find(t => t.trainNumber === trainNumber);
  if (!matched) {
    return res.status(404).json({ success: false, error: { code: 'TRAIN_NOT_FOUND', message: 'Train not found' } });
  }

  res.json({
    success: true,
    data: {
      trainNumber: matched.trainNumber,
      trainName: matched.trainName,
      rakeType: matched.rakeType,
      coaches: matched.coachLayout || []
    },
    meta: {
      traceId: `coach-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 1,
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'TRAIN_COACH_LAYOUT'
    }
  });
});

// 6. Platform Position (GET /v1/trains/:number/platform-positions)
app.get('/trains/:number/platform-positions', (req, res) => {
  const trainNumber = req.params.number.trim();
  const matched = trainsData.find(t => t.trainNumber === trainNumber);
  if (!matched) {
    return res.status(404).json({ success: false, error: { code: 'TRAIN_NOT_FOUND', message: 'Train not found' } });
  }

  const positions = (matched.coachLayout || []).map((c: any) => ({
    coachCode: c.code,
    classType: c.classType,
    position: c.position,
    platformAlignment: c.platformPosition,
    nearestFob: c.position <= 3 ? 'North Foot Over Bridge' : c.position <= 7 ? 'Central Main FOB' : 'South Foot Over Bridge',
    escalatorProximityMeters: Math.round(c.position * 24)
  }));

  res.json({
    success: true,
    data: {
      trainNumber: matched.trainNumber,
      trainName: matched.trainName,
      currentStation: matched.currentLocation.stationName,
      platform: matched.currentLocation.stationCode === 'MMCT' ? '1' : '16',
      positions
    },
    meta: {
      traceId: `plat-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 1,
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'TRAIN_PLATFORM_POSITION'
    }
  });
});

// 7. Train Autocomplete (GET /v1/trains/search)
app.get('/trains/search', (req, res) => {
  const query = ((req.query.query as string) || '').toLowerCase().trim();
  const results = trainsData
    .filter(t => t.trainNumber.toLowerCase().includes(query) || t.trainName.toLowerCase().includes(query))
    .map(t => ({
      trainNumber: t.trainNumber,
      trainName: t.trainName,
      origin: t.origin,
      destination: t.destination,
      category: t.category
    }));

  res.json({
    success: true,
    data: results,
    meta: { traceId: `search-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
  });
});

// 8. Train Directory (GET /v1/trains)
app.get('/trains', (req, res) => {
  const category = (req.query.category as string) || '';
  const filtered = category ? trainsData.filter(t => t.category.toLowerCase().includes(category.toLowerCase())) : trainsData;

  res.json({
    success: true,
    data: filtered.map(t => ({
      trainNumber: t.trainNumber,
      trainName: t.trainName,
      category: t.category,
      speedType: t.speedType,
      origin: t.origin,
      destination: t.destination,
      operatingDays: t.operatingDays
    })),
    meta: { traceId: `dir-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
  });
});

// 9. Categories & Speed Types & Reference Endpoints
app.get('/trains/categories', (req, res) => {
  res.json({
    success: true,
    data: ['Vande Bharat Express', 'Rajdhani Express', 'Shatabdi Express', 'Tejas Express', 'Duronto Express', 'Superfast Express', 'Mail/Express', 'Suburban EMU'],
    meta: { traceId: `cat-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
  });
});

app.get('/trains/speed-types', (req, res) => {
  res.json({
    success: true,
    data: [
      { type: 'Semi-High Speed', maxKmph: 160, priority: 1 },
      { type: 'Superfast Premium', maxKmph: 130, priority: 2 },
      { type: 'Express', maxKmph: 110, priority: 3 },
      { type: 'Passenger Commuter', maxKmph: 80, priority: 4 }
    ],
    meta: { traceId: `spd-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
  });
});

app.get('/trains/prs', (req, res) => {
  res.json({
    success: true,
    data: trainsData.map(t => ({ trainNumber: t.trainNumber, trainName: t.trainName, prsQuotaPool: 'Standard Northern/Western PRS Pool', hasTatkal: true })),
    meta: { traceId: `prs-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
  });
});

app.get('/trains/ntes', (req, res) => {
  res.json({
    success: true,
    data: trainsData.map(t => ({ trainNumber: t.trainNumber, ntesTrackingStatus: 'Active GPS Feed', reportingStation: t.currentLocation.stationCode })),
    meta: { traceId: `ntes-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
  });
});

// Compressed feeds (base64 gzip delta simulation with metadata)
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
    meta: { traceId: `cmp-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
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
    meta: { traceId: `cmpprs-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
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
    meta: { traceId: `kvs-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel }
  });
});

app.listen(PORT, () => {
  console.log(`[Service: Train Intelligence] running on port ${PORT}`);
});
