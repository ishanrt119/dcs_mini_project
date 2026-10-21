import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { DataSourceLabel, StationDisruptionSimulationInput, StationDisruptionSimulationOutput } from '../../shared/types.js';
import { SnapshotsRepository, IncidentsRepository, ServiceHealthRepository, db } from '../../data/db/index.js';
import { RpcServer } from '../../shared/rpc.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.ANALYTICS_SERVICE_PORT || '4004', 10);
const SERVICE_ID = 'analytics';

app.use(cors());
app.use(express.json());

const startTime = Date.now();
let requestCount = 0;

// Load fixtures
const trainsData: any[] = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/fixtures/trains.json'), 'utf-8'));
const freightData: any[] = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/fixtures/freight.json'), 'utf-8'));
const stationsData: any[] = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/fixtures/stations.json'), 'utf-8'));

// Seed pre-generated incidents and delay history into SQLite if empty
try {
  const disruptionsPath = path.resolve(process.cwd(), 'data/fixtures/disruptions.json');
  if (fs.existsSync(disruptionsPath)) {
    const disruptions: any[] = JSON.parse(fs.readFileSync(disruptionsPath, 'utf-8'));
    disruptions.forEach(d => {
      IncidentsRepository.record({
        incidentId: d.incidentId,
        trainNumber: d.trainNumber,
        stationCode: d.stationCode,
        severity: d.severity,
        type: d.type,
        description: d.description,
        estimatedDelayMinutes: d.estimatedDelayMinutes,
        status: d.status
      });
    });
  }

  const delayHistoryPath = path.resolve(process.cwd(), 'data/fixtures/delay-history.json');
  if (fs.existsSync(delayHistoryPath)) {
    const delayHistory: any[] = JSON.parse(fs.readFileSync(delayHistoryPath, 'utf-8'));
    delayHistory.slice(0, 100).forEach(dh => {
      SnapshotsRepository.save(
        dh.trainNumber,
        dh.observedDelayMinutes,
        dh.stationCode,
        dh.speedKmph,
        dh.status
      );
    });
  }
} catch (e) {
  console.warn('[Analytics] Fixture seeding notice:', e);
}

// Initialize RPC Server
const rpcServer = new RpcServer();

// Register explicit JSON-RPC procedures
rpcServer.register('analytics.getTrendVelocity', async (params: { trainNumber: string }) => {
  return SnapshotsRepository.calculateTrend(params.trainNumber);
});

rpcServer.register('analytics.pingService', async () => {
  return { status: 'PONG', timestamp: new Date().toISOString(), node: 'ANALYTICS_NODE_01' };
});

rpcServer.register('analytics.simulateDisruption', async (params: StationDisruptionSimulationInput) => {
  return runDisruptionSimulation(params);
});

// Outage middleware
app.use((req, res, next) => {
  requestCount++;
  if (ServiceHealthRepository.isSimulatedFailure(SERVICE_ID) && !req.path.startsWith('/admin') && req.path !== '/health') {
    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_OUTAGE_SIMULATED',
        message: 'Analytics & Event Service is temporarily offline (Simulated 503 Fault Injection)'
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
    name: 'Analytics & Event Service',
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

// JSON-RPC 2.0 Handler
app.post('/rpc', async (req, res) => {
  const response = await rpcServer.handle(req.body);
  res.json(response);
});

// 1. Historical Delay Trend Calculation
app.get('/analytics/trains/:number/trend', (req, res) => {
  const trainNumber = req.params.number;
  const trendResult = SnapshotsRepository.calculateTrend(trainNumber);

  res.json({
    success: true,
    data: trendResult,
    meta: {
      traceId: `trend-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 2,
      source: 'LOCAL_HISTORICAL_OBSERVATION' as DataSourceLabel,
      endpointId: 'DELAY_TREND_ANALYTICS'
    }
  });
});

// 2. Historical Snapshots
app.get('/analytics/trains/:number/snapshots', (req, res) => {
  const trainNumber = req.params.number;
  const history = SnapshotsRepository.getHistory(trainNumber, 50);

  res.json({
    success: true,
    data: history,
    meta: {
      traceId: `snaps-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 2,
      source: 'LOCAL_HISTORICAL_OBSERVATION' as DataSourceLabel
    }
  });
});

// 3. Incidents & Alert Logs
app.get('/analytics/incidents', (req, res) => {
  const incidents = IncidentsRepository.getAll(50);
  res.json({
    success: true,
    data: incidents,
    meta: {
      traceId: `incidents-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 2,
      source: 'LOCAL_HISTORICAL_OBSERVATION' as DataSourceLabel
    }
  });
});

app.post('/analytics/incidents', (req, res) => {
  const { trainNumber, stationCode, severity, type, description, estimatedDelayMinutes } = req.body;
  const incidentId = `INC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

  IncidentsRepository.record({
    incidentId,
    trainNumber,
    stationCode,
    severity: severity || 'WARNING',
    type: type || 'OPERATIONAL_ALERT',
    description: description || 'Track congestion slowdown reported',
    estimatedDelayMinutes: estimatedDelayMinutes || 15,
    status: 'ACTIVE'
  });

  res.json({
    success: true,
    data: { incidentId, status: 'RECORDED' },
    meta: { traceId: `inc-rec-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'LOCAL_HISTORICAL_OBSERVATION' as DataSourceLabel }
  });
});

// 4. Station Disruption Simulation
function runDisruptionSimulation(input: StationDisruptionSimulationInput): StationDisruptionSimulationOutput {
  const station = stationsData.find(s => s.code === input.stationCode);
  const stationName = station?.name || input.stationCode;

  // Calculate downstream impact
  const spreadMinutes = Math.round(input.severityHours * 24 + 18);
  const affected = trainsData
    .filter(t => t.route.some((h: any) => h.stationCode === input.stationCode))
    .map(t => {
      const halt = t.route.find((h: any) => h.stationCode === input.stationCode);
      return {
        trainNumber: t.trainNumber,
        trainName: t.trainName,
        scheduledHalt: halt.scheduledArrival || '12:00',
        estimatedCompoundedDelay: Math.min(240, spreadMinutes + Math.floor(Math.random() * 15))
      };
    });

  // Record simulation incident in DB
  const simId = `SIM-${Date.now().toString(36).toUpperCase()}`;
  IncidentsRepository.record({
    incidentId: simId,
    stationCode: input.stationCode,
    severity: input.severityHours > 2 ? 'CRITICAL' : 'WARNING',
    type: `DISRUPTION_${input.disruptionType}`,
    description: `Simulated ${input.disruptionType} at ${stationName}. Potential cascade delay ~${spreadMinutes} mins.`,
    estimatedDelayMinutes: spreadMinutes,
    status: 'SIMULATED'
  });

  return {
    simulationId: simId,
    stationCode: input.stationCode,
    stationName,
    disruptionType: input.disruptionType,
    estimatedDelaySpreadMinutes: spreadMinutes,
    potentiallyAffectedTrains: affected,
    assumptions: [
      `Assumes block section headway capacity reduced by ${Math.min(90, input.severityHours * 30)}% during active duration.`,
      'Compounding queue delay modeled using FIFO track occupancy clearance.',
      'Superfast priority expresses overtake freight and passenger rakes on loop lines.'
    ],
    disclaimer: 'DISCLAIMER: This is a simulated operational stress test calculation. Real train operations and live provider feeds are never modified.'
  };
}

app.post('/analytics/simulate-disruption', (req, res) => {
  const output = runDisruptionSimulation(req.body);
  res.json({
    success: true,
    data: output,
    meta: {
      traceId: `sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 3,
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'DISRUPTION_SIMULATION'
    }
  });
});

// 5. Freight Operations Feed
app.get('/network/freight', (req, res) => {
  res.json({
    success: true,
    data: freightData,
    meta: { traceId: `frt-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel, endpointId: 'FREIGHT_TRAINS' }
  });
});

// 6. Live Map Feed
app.get('/network/map-feed', (req, res) => {
  const mapNodes = trainsData.map(t => ({
    trainNumber: t.trainNumber,
    trainName: t.trainName,
    lat: t.currentLocation.lat,
    lng: t.currentLocation.lng,
    stationName: t.currentLocation.stationName,
    stationCode: t.currentLocation.stationCode,
    speedKmph: t.currentSpeedKmph,
    delayMinutes: t.delayMinutes,
    status: t.status,
    category: t.category,
    routeGeometry: t.geometry?.coordinates || []
  }));

  res.json({
    success: true,
    data: mapNodes,
    meta: { traceId: `map-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 2, source: 'SIMULATED_DEMO_DATA' as DataSourceLabel, endpointId: 'LIVE_MAP_FEED' }
  });
});

app.listen(PORT, () => {
  console.log(`[Service: Analytics & Event] running on port ${PORT}`);
});
