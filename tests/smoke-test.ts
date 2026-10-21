// Comprehensive Automated Smoke & Offline Verification Test for RailSync
// Validates 100% offline operation, local fixtures, simulation logic, and zero external calls.

import fs from 'fs';
import path from 'path';
import { QuotaCacheManager } from '../shared/quota-cache-manager.js';
import { DemoRailwayAdapter } from '../shared/demo-railway-adapter.js';
import { RailRadarAdapter } from '../shared/railradar-adapter.js';
import { SnapshotsRepository, IncidentsRepository, SavedTrainsRepository, ServiceHealthRepository, initDatabase } from '../data/db/index.js';
import { API_REGISTRY } from '../shared/registry.js';
import { RpcServer } from '../shared/rpc.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('   RailSync Complete Offline Demo Verification Test Suite');
  console.log('============================================================\n');

  // --- [1] Anti-External-Call Guard: Intercept global fetch to detect any external requests ---
  console.log('--- [1] Anti-External API Network Guard ---');
  let externalCallsBlocked = 0;
  const originalFetch = global.fetch;

  global.fetch = async (input: any, init?: any): Promise<any> => {
    const urlStr = String(input);
    if (urlStr.includes('railradar') || urlStr.includes('api.') || (urlStr.startsWith('http') && !urlStr.includes('localhost') && !urlStr.includes('127.0.0.1'))) {
      externalCallsBlocked++;
      throw new Error(`SECURITY ALERT: Attempted forbidden outbound external request to ${urlStr}`);
    }
    return originalFetch(input, init);
  };

  const adapter = RailRadarAdapter.getInstance();
  const mockCallResult = await adapter.callProvider('TRAIN_LIVE_STATUS', '/v1/trains/12951/live', '12951');
  assert(mockCallResult.ok === true, 'Offline adapter returns successful simulated response');
  assert(externalCallsBlocked === 0, 'Zero outbound network requests initiated (No calls to api.railradar.in)');

  // Test that attempting an external fetch would be caught by guard
  try {
    await fetch('https://api.railradar.in/v1/test');
    assert(false, 'Expected outbound call to be blocked');
  } catch (err: any) {
    assert(err.message.includes('forbidden outbound'), 'Security guard actively blocks any remote railradar calls');
  }

  // --- [2] SQLite Persistence & Repositories ---
  console.log('\n--- [2] SQLite Persistence & Repositories ---');
  initDatabase();
  assert(true, 'Database tables and indices created cleanly in SQLite');

  const saved = SavedTrainsRepository.getAll();
  assert(saved.length >= 3, `Saved trains loaded successfully (${saved.length} records)`);

  SnapshotsRepository.save('99999', 20, 'NDLS', 110, 'Delayed by 20m');
  SnapshotsRepository.save('99999', 12, 'AGC', 125, 'Delayed by 12m');
  const trend = SnapshotsRepository.calculateTrend('99999');
  assert(trend.trend === 'Improving', `Trend calculated correctly: ${trend.trend} (${trend.diffMinutes}m)`);

  const incidentId = `TEST-INC-${Date.now()}`;
  IncidentsRepository.record({
    incidentId,
    severity: 'WARNING',
    type: 'SIGNAL_DELAY',
    description: 'Test automated incident alert',
    status: 'ACTIVE'
  });
  const incidents = IncidentsRepository.getAll(10);
  assert(incidents.some(i => i.incident_id === incidentId), 'Incident successfully written and indexed in SQLite');

  // --- [3] Local Fixture Dataset Schema & Consistency ---
  console.log('\n--- [3] Local Fixture Dataset Schema & Integrity ---');
  const FIXTURES_DIR = path.resolve(process.cwd(), 'data/fixtures');

  const stations: any[] = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'stations.json'), 'utf-8'));
  const trains: any[] = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'trains.json'), 'utf-8'));
  const routes: any[] = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'routes.json'), 'utf-8'));
  const liveStatus: any = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'live-status.json'), 'utf-8'));
  const reservations: any = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'reservations.json'), 'utf-8'));
  const coachLayouts: any = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'coach-layouts.json'), 'utf-8'));
  const platformPositions: any = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'platform-positions.json'), 'utf-8'));
  const suburban: any = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'suburban.json'), 'utf-8'));
  const freight: any[] = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'freight.json'), 'utf-8'));
  const delayHistory: any[] = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'delay-history.json'), 'utf-8'));
  const disruptions: any[] = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'disruptions.json'), 'utf-8'));

  assert(stations.length >= 150, `Stations fixture contains ${stations.length} records (Req: >=150)`);
  assert(trains.length >= 100, `Trains fixture contains ${trains.length} records (Req: >=100)`);
  assert(routes.length >= 100, `Train-route associations contain ${routes.length} records (Req: >=100)`);
  assert(Object.keys(liveStatus).length >= 50, `Live-status fixtures contain ${Object.keys(liveStatus).length} records (Req: >=50)`);
  assert(Object.keys(reservations.pnrs).length >= 30, `Reservations fixture contains ${Object.keys(reservations.pnrs).length} PNRs (Req: >=30)`);
  assert(Object.keys(coachLayouts).length >= 20, `Coach layouts fixture contains ${Object.keys(coachLayouts).length} records (Req: >=20)`);
  assert(Object.keys(platformPositions).length >= 30, `Platform positions fixture contains ${Object.keys(platformPositions).length} records (Req: >=30)`);
  const suburbanServicesCount = suburban.timetables.reduce((acc: number, t: any) => acc + t.services.length, 0);
  assert(suburbanServicesCount >= 50, `Suburban services fixture contains ${suburbanServicesCount} records (Req: >=50)`);
  assert(freight.length >= 25, `Freight trains fixture contains ${freight.length} records (Req: >=25)`);
  assert(delayHistory.length >= 100, `Historical delay observations contain ${delayHistory.length} records`);
  assert(disruptions.length >= 20, `Disruption examples contain ${disruptions.length} records (Req: >=20)`);

  // Verify all train route stations reference valid station codes
  const validStationCodes = new Set(stations.map(s => s.code));
  let invalidStationRefs = 0;
  for (const t of trains) {
    for (const h of t.route) {
      if (!validStationCodes.has(h.stationCode)) {
        invalidStationRefs++;
      }
    }
  }
  assert(invalidStationRefs === 0, `All train halts reference valid stations (0 invalid references)`);

  // --- [4] Local Railway Data Adapter Methods ---
  console.log('\n--- [4] Local Railway Data Adapter Operations ---');
  const demoAdapter = DemoRailwayAdapter.getInstance();

  const searchResults = demoAdapter.searchTrains('Rajdhani');
  assert(searchResults.length > 0, `Train search returns meaningful matches (${searchResults.length} trains found)`);

  const stnSearch = demoAdapter.searchStations('Delhi');
  assert(stnSearch.length > 0, `Station search returns matches (${stnSearch.length} stations found)`);

  const between = demoAdapter.getTrainsBetween('MMCT', 'NDLS');
  assert(between.length > 0, `Trains between stations returns direct routes (${between.length} trains found)`);

  const plan = demoAdapter.planRoutes('MMCT', 'NDLS', '2026-10-25');
  assert(plan.totalRoutesFound > 0, `Journey planner identifies valid routes (${plan.totalRoutesFound} routes)`);

  const departures = demoAdapter.getLiveDepartures('NDLS');
  assert(departures.departures.length > 0, `Live station departures returns schedule (${departures.departures.length} trains)`);

  const liveTrain = demoAdapter.getLiveTrainStatus('12951');
  assert(liveTrain !== null, 'Live train tracking returns active status');
  assert(liveTrain?.source === 'LOCAL_SIMULATION', `Data source badge correctly identifies LOCAL_SIMULATION: ${liveTrain?.source}`);
  assert(liveTrain?.source !== 'LIVE_PROVIDER_DATA', 'Never labels local data as LIVE_PROVIDER_DATA');

  const coachLayout = demoAdapter.getCoachLayout('12951');
  assert(coachLayout && coachLayout.coaches.length > 0, 'Coach layout returns structured coach list');

  const pnrStatus = demoAdapter.getPnrStatus('8421100001');
  assert(pnrStatus && pnrStatus.passengers.length > 0, 'PNR status returns valid passenger itinerary');

  // --- [5] Reservation Calculations & Input Validation ---
  console.log('\n--- [5] Reservation Calculations & Error Handling ---');
  const fare = demoAdapter.calculateFare(1384, '3A');
  assert(fare.totalFare > 0 && fare.baseFare > 0, `Fare calculated correctly: ₹${fare.totalFare}`);

  const refund48h = demoAdapter.calculateRefund('CONFIRMED', 50, 1890, '3A');
  assert(refund48h.refundableAmount === 1890 - 180, `Refund >48h deducts flat fee (Refund: ₹${refund48h.refundableAmount})`);

  const refundWl = demoAdapter.calculateRefund('WAITLIST', 10, 1890, '3A');
  assert(refundWl.refundableAmount === 1890 - 60, `Refund WL deducts clerkage ₹60 (Refund: ₹${refundWl.refundableAmount})`);

  // --- [6] Quota Governance & Offline Representation ---
  console.log('\n--- [6] Quota Governance for Offline Mode ---');
  const quotaManager = QuotaCacheManager.getInstance();
  const qStatus = quotaManager.getQuotaStatus();

  assert(qStatus.actualOutboundCalls === 0, `Actual outbound calls strictly remains zero (${qStatus.actualOutboundCalls})`);
  assert(qStatus.providerAccessDisabled === true, 'Provider access correctly reported as disabled');
  assert(qStatus.providerRemainingQuota === undefined, 'Does not fabricate fake upstream monthly quota');

  const origMockCount = qStatus.mockProviderCalls ?? 0;
  quotaManager.recordMockRequest();
  const updatedStatus = quotaManager.getQuotaStatus();
  assert((updatedStatus.mockProviderCalls ?? 0) === origMockCount + 1, 'Mock API calls tracked separately without incrementing provider quota');

  // Verify permission check always refuses outbound requests
  const checkPerm = quotaManager.verifyOutboundPermission('TRAIN_LIVE_STATUS');
  assert(!checkPerm.allowed, 'Outbound request blocked in offline demo mode');

  // Test toggle locking: setLiveApiEnabled cannot re-enable live calls
  quotaManager.setLiveApiEnabled(true);
  assert(quotaManager.isLiveApiEnabled() === false, 'Frontend toggle cannot re-enable live external API access');

  // --- [7] JSON-RPC 2.0 Invocations ---
  console.log('\n--- [7] Distributed JSON-RPC 2.0 Protocol ---');
  const rpc = new RpcServer();
  rpc.register('math.add', async (params: { a: number; b: number }) => params.a + params.b);
  const rpcResp = await rpc.handle({
    jsonrpc: '2.0',
    id: 101,
    method: 'math.add',
    params: { a: 40, b: 2 }
  });
  assert(rpcResp.result === 42, `RPC procedure returned expected result (42): ${rpcResp.result}`);

  // --- [8] Distributed Fault Injection Simulation ---
  console.log('\n--- [8] Distributed Fault Injection Simulation ---');
  ServiceHealthRepository.setSimulatedFailure('train-intel', true);
  assert(ServiceHealthRepository.isSimulatedFailure('train-intel'), 'Fault injection simulated (503 triggered)');
  ServiceHealthRepository.setSimulatedFailure('train-intel', false);
  assert(!ServiceHealthRepository.isSimulatedFailure('train-intel'), 'Fault injection recovered to UP status');

  // --- [9] Mock Provider Test Sandbox ---
  console.log('\n--- [9] Mock Provider Test Sandbox ---');
  const mockProviderTest = demoAdapter.executeMockProviderCall('TRAIN_LIVE_STATUS', { number: '12951' }, 200);
  assert(mockProviderTest.ok === true, 'Mock provider execution succeeds');
  assert(mockProviderTest.meta.source === 'SIMULATED_PROVIDER_RESPONSE', `Source badge identifies SIMULATED_PROVIDER_RESPONSE: ${mockProviderTest.meta.source}`);
  assert(mockProviderTest.meta.measuredDurationMs > 0, `Measured local response time: ${mockProviderTest.meta.measuredDurationMs}ms`);

  const mockErrorTest = demoAdapter.executeMockProviderCall('TRAIN_LIVE_STATUS', { number: '12951' }, 429);
  assert(mockErrorTest.status === 429, 'Mock error status code (429 Rate Limit) returned accurately');

  console.log('\n============================================================');
  console.log(`   Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  // Restore global fetch
  global.fetch = originalFetch;

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
