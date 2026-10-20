import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApiResponse, DataSourceLabel, ServiceHealthMetric } from '../../shared/types.js';
import { QuotaCacheManager } from '../../shared/quota-cache-manager.js';
import { ServiceHealthRepository, SavedTrainsRepository, initDatabase } from '../../data/db/index.js';
import { invokeRpc } from '../../shared/rpc.js';

dotenv.config();

// Initialize DB schema
initDatabase();

const app = express();
const PORT = parseInt(process.env.GATEWAY_PORT || '4000', 10);

app.use(cors());
app.use(express.json());

const quotaManager = QuotaCacheManager.getInstance();

// Downstream Service URLs
const SERVICES = {
  TRAIN: `http://localhost:${process.env.TRAIN_SERVICE_PORT || '4001'}`,
  JOURNEY: `http://localhost:${process.env.JOURNEY_SERVICE_PORT || '4002'}`,
  RESERVATION: `http://localhost:${process.env.RESERVATION_SERVICE_PORT || '4003'}`,
  ANALYTICS: `http://localhost:${process.env.ANALYTICS_SERVICE_PORT || '4004'}`
};

/**
 * Robust HTTP Proxy helper with timeout, error translation, and graceful partial fallback
 */
async function forwardRequest(
  serviceBaseUrl: string,
  serviceId: string,
  subPath: string,
  req: express.Request,
  timeoutMs: number = 4000
): Promise<{ status: number; body: any }> {
  const url = `${serviceBaseUrl}${subPath}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const start = Date.now();
  try {
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && req.body;
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-RailSync-Gateway': 'active',
        'X-Trace-Id': `gw-${Date.now()}`
      },
      body: hasBody ? JSON.stringify(req.body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timer);
    const duration = Date.now() - start;
    ServiceHealthRepository.updateHeartbeat(serviceId, response.ok ? 'UP' : 'DEGRADED', duration);

    const json = await response.json().catch(() => ({}));
    return { status: response.status, body: json };
  } catch (err: any) {
    clearTimeout(timer);
    const duration = Date.now() - start;
    ServiceHealthRepository.updateHeartbeat(serviceId, 'DOWN', duration);

    const isTimeout = err.name === 'AbortError';
    return {
      status: 503,
      body: {
        success: false,
        error: {
          code: isTimeout ? 'DOWNSTREAM_SERVICE_TIMEOUT' : 'DOWNSTREAM_SERVICE_UNAVAILABLE',
          message: isTimeout
            ? `Downstream service (${serviceId}) timed out after ${timeoutMs}ms.`
            : `Unable to connect to service (${serviceId}) at ${serviceBaseUrl}. Process may be offline.`
        },
        meta: {
          traceId: `gw-err-${Date.now()}`,
          timestamp: new Date().toISOString(),
          executionTimeMs: duration,
          source: 'UNAVAILABLE' as DataSourceLabel
        }
      }
    };
  }
}

// ------------------- API Gateway Routes -------------------

// Gateway Root & Health
app.get('/health', (req, res) => {
  res.json({ service: 'RailSync API Gateway', port: PORT, status: 'UP', timestamp: new Date().toISOString() });
});

// 1. Unified Cluster Health Monitor (Evaluates all 5 distributed nodes via HTTP IPC)
app.get('/api/system/health', async (req, res) => {
  const nodes = [
    { id: 'gateway', name: 'API Gateway', url: `http://localhost:${PORT}/health`, port: PORT },
    { id: 'train-intel', name: 'Train Intelligence Service', url: `${SERVICES.TRAIN}/health`, port: 4001 },
    { id: 'journey-station', name: 'Journey & Station Service', url: `${SERVICES.JOURNEY}/health`, port: 4002 },
    { id: 'reservation', name: 'Reservation Intelligence Service', url: `${SERVICES.RESERVATION}/health`, port: 4003 },
    { id: 'analytics', name: 'Analytics & Event Service', url: `${SERVICES.ANALYTICS}/health`, port: 4004 }
  ];

  const results: ServiceHealthMetric[] = await Promise.all(
    nodes.map(async node => {
      const start = Date.now();
      try {
        const resp = await fetch(node.url, { signal: AbortSignal.timeout(1500) });
        const latency = Date.now() - start;
        const data = await resp.json().catch(() => ({}));
        return {
          serviceId: node.id,
          name: node.name,
          port: node.port,
          status: resp.status === 200 ? 'UP' : resp.status === 503 ? 'DEGRADED' : 'DOWN',
          uptimeSeconds: data.uptimeSeconds || 0,
          requestCount: data.requestCount || 0,
          avgLatencyMs: latency,
          lastHeartbeat: new Date().toISOString(),
          isSimulatedFailure: !!data.isSimulatedFailure
        };
      } catch (e) {
        return {
          serviceId: node.id,
          name: node.name,
          port: node.port,
          status: 'DOWN',
          uptimeSeconds: 0,
          requestCount: 0,
          avgLatencyMs: 0,
          lastHeartbeat: new Date().toISOString(),
          isSimulatedFailure: false
        };
      }
    })
  );

  res.json({
    success: true,
    data: {
      clusterStatus: results.every(n => n.status === 'UP') ? 'HEALTHY' : results.some(n => n.status === 'DOWN') ? 'CRITICAL' : 'DEGRADED',
      services: results
    },
    meta: { traceId: `gw-health-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 15, source: 'LOCAL_HISTORICAL_OBSERVATION' as DataSourceLabel }
  });
});

// 2. Outage Simulation Control (Trigger 503 fault on any microservice)
app.post('/api/system/simulate-outage', async (req, res) => {
  const { serviceId, fail } = req.body;
  const targetMap: Record<string, string> = {
    'train-intel': SERVICES.TRAIN,
    'journey-station': SERVICES.JOURNEY,
    'reservation': SERVICES.RESERVATION,
    'analytics': SERVICES.ANALYTICS
  };

  const url = targetMap[serviceId];
  if (!url) {
    return res.status(400).json({ success: false, message: `Invalid serviceId: ${serviceId}` });
  }

  try {
    const resp = await fetch(`${url}/admin/simulate-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fail: !!fail })
    });
    const data = await resp.json();
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ success: false, message: `Could not reach ${serviceId}: ${err.message}` });
  }
});

// 3. API Quota Dashboard & Budget Manager Status
app.get('/api/system/quota', (req, res) => {
  const status = quotaManager.getQuotaStatus();
  const metrics = quotaManager.verifyOutboundPermission('TRAIN_LIVE_STATUS');

  res.json({
    success: true,
    data: {
      ...status,
      apiKeyConfigured: !!process.env.RAILRADAR_API_KEY && process.env.RAILRADAR_API_KEY.length > 5,
      budgetManagerPolicy: {
        strictQuotaEnforcement: true,
        monthlyCeiling: 100,
        internalHardCap: 80,
        emergencyBuffer: 20,
        quotaRule: 'Zero unconfirmed live calls; TTL cached results served on dashboard renders.'
      }
    },
    meta: { traceId: `quota-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'LOCAL_HISTORICAL_OBSERVATION' as DataSourceLabel }
  });
});

// 4. Mode Toggle (DEMO_MODE & LIVE_API_ENABLED)
app.post('/api/system/mode', (req, res) => {
  const { demoMode, liveApiEnabled } = req.body;
  if (demoMode !== undefined) quotaManager.setDemoMode(!!demoMode);
  if (liveApiEnabled !== undefined) quotaManager.setLiveApiEnabled(!!liveApiEnabled);

  res.json({
    success: true,
    data: quotaManager.getQuotaStatus(),
    message: 'Operational mode updated successfully. Quota protection rules active.'
  });
});

// 5. User Saved Trains (SQLite backed)
app.get('/api/system/saved-trains', (req, res) => {
  res.json({ success: true, data: SavedTrainsRepository.getAll() });
});

app.post('/api/system/saved-trains', (req, res) => {
  const { trainNumber, trainName, notes } = req.body;
  SavedTrainsRepository.save(trainNumber, trainName, notes || '');
  res.json({ success: true, message: `Train ${trainNumber} added to watchlist.` });
});

app.delete('/api/system/saved-trains/:trainNumber', (req, res) => {
  SavedTrainsRepository.remove(req.params.trainNumber);
  res.json({ success: true, message: `Train ${req.params.trainNumber} removed from watchlist.` });
});

// 6. JSON-RPC 2.0 Demonstration Proxy
app.post('/api/system/rpc-demo', async (req, res) => {
  const { method, params } = req.body;
  try {
    const result = await invokeRpc(SERVICES.ANALYTICS, method || 'analytics.pingService', params || {});
    res.json({
      success: true,
      protocol: 'JSON-RPC/2.0',
      method,
      result
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      protocol: 'JSON-RPC/2.0',
      error: err.message
    });
  }
});

// 7. Aggregated Overview Dashboard Endpoint (Combines live, saved, incidents, health in 1 call)
app.get('/api/overview', async (req, res) => {
  const start = Date.now();
  const [trainResp, incidentsResp, healthResp, quotaData, savedTrains] = await Promise.all([
    forwardRequest(SERVICES.TRAIN, 'train-intel', '/trains/12951/live', req),
    forwardRequest(SERVICES.ANALYTICS, 'analytics', '/analytics/incidents', req),
    forwardRequest(SERVICES.ANALYTICS, 'analytics', '/network/map-feed', req),
    Promise.resolve(quotaManager.getQuotaStatus()),
    Promise.resolve(SavedTrainsRepository.getAll())
  ]);

  res.json({
    success: true,
    data: {
      flagshipLiveStatus: trainResp.body.data || null,
      activeIncidents: incidentsResp.body.data || [],
      activeTrainsCount: (healthResp.body.data || []).length,
      quotaStatus: quotaData,
      savedTrains,
      partialFailures: {
        trainIntelFailed: trainResp.status >= 500,
        analyticsFailed: incidentsResp.status >= 500
      }
    },
    meta: {
      traceId: `agg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - start,
      source: 'LOCAL_HISTORICAL_OBSERVATION' as DataSourceLabel
    }
  });
});

// ------------------- Downstream Microservice Proxies -------------------

// Train Intelligence Routes -> Port 4001
app.use('/api/trains', async (req, res) => {
  const subPath = `/trains${req.url === '/' ? '' : req.url}`;
  const { status, body } = await forwardRequest(SERVICES.TRAIN, 'train-intel', subPath, req);
  res.status(status).json(body);
});

// Journey & Station Routes -> Port 4002
app.use(['/api/routes', '/api/stations', '/api/suburban'], async (req, res) => {
  const subPath = `${req.baseUrl.replace(/^\/api/, '')}${req.url === '/' ? '' : req.url}`;
  const { status, body } = await forwardRequest(SERVICES.JOURNEY, 'journey-station', subPath, req);
  res.status(status).json(body);
});

// Reservation Intelligence Routes -> Port 4003
app.use(['/api/reservation', '/api/pnr'], async (req, res) => {
  const subPath = `${req.baseUrl.replace(/^\/api/, '')}${req.url === '/' ? '' : req.url}`;
  const { status, body } = await forwardRequest(SERVICES.RESERVATION, 'reservation', subPath, req);
  res.status(status).json(body);
});

// Analytics & Network Routes -> Port 4004
app.use(['/api/analytics', '/api/network'], async (req, res) => {
  const subPath = `${req.baseUrl.replace(/^\/api/, '')}${req.url === '/' ? '' : req.url}`;
  const { status, body } = await forwardRequest(SERVICES.ANALYTICS, 'analytics', subPath, req);
  res.status(status).json(body);
});

app.listen(PORT, () => {
  console.log(`[API Gateway] Running on http://localhost:${PORT}`);
});
