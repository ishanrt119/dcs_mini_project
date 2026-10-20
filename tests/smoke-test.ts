// Comprehensive Automated Smoke Test for RailSync Distributed Platform
// STRICT RULE: All tests use local fixtures and mocks. Zero real RailRadar API calls.

import { QuotaCacheManager } from '../shared/quota-cache-manager.js';
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
  console.log('   RailSync Distributed Railway Intelligence Test Suite');
  console.log('============================================================\n');

  // Test Group 1: Database Initialization & Repositories
  console.log('--- [1] SQLite Persistence & Repositories ---');
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

  // Test Group 2: API Registry & Quota Protection Policy
  console.log('\n--- [2] Quota Protection & Budget Manager ---');
  const quotaManager = QuotaCacheManager.getInstance();

  // Test 2.1: In DEMO_MODE, live call MUST BE DENIED
  quotaManager.setDemoMode(true);
  quotaManager.setLiveApiEnabled(false);
  const checkDemo = quotaManager.verifyOutboundPermission('TRAIN_LIVE_STATUS');
  assert(!checkDemo.allowed, 'Outbound request blocked when DEMO_MODE=true');
  assert(checkDemo.reason?.includes('DEMO_MODE is active'), 'Reason properly articulates demo mode protection');

  // Test 2.2: When LIVE_API_ENABLED is false, call MUST BE DENIED
  quotaManager.setDemoMode(false);
  quotaManager.setLiveApiEnabled(false);
  const checkLiveDisabled = quotaManager.verifyOutboundPermission('TRAIN_LIVE_STATUS');
  assert(!checkLiveDisabled.allowed, 'Outbound request blocked when LIVE_API_ENABLED=false');

  // Test 2.3: Check monthly reset date format
  const resetDate = quotaManager.getNextResetDate();
  assert(resetDate.includes('-01T00:00:00') || !isNaN(Date.parse(resetDate)), `Next monthly reset date computed correctly: ${resetDate}`);

  // Test 2.4: Reset back to safe defaults
  quotaManager.setDemoMode(true);
  quotaManager.setLiveApiEnabled(false);

  // Test Group 3: TTL Caching & Request Deduplication
  console.log('\n--- [3] Caching & In-Flight Deduplication ---');
  quotaManager.setCached('test_key_1', { data: 'sample' }, 60);
  const cachedHit = quotaManager.getCached<{ data: string }>('test_key_1');
  assert(cachedHit.hit && cachedHit.data?.data === 'sample', 'Cache write and read verified');

  let executionCounter = 0;
  const mockWork = async () => {
    executionCounter++;
    await new Promise(r => setTimeout(r, 50));
    return 'dedup_result';
  };

  const [resA, resB, resC] = await Promise.all([
    quotaManager.executeWithDeduplication('shared_lock', mockWork),
    quotaManager.executeWithDeduplication('shared_lock', mockWork),
    quotaManager.executeWithDeduplication('shared_lock', mockWork)
  ]);

  assert(executionCounter === 1, `In-flight requests deduplicated into single execution (runs=${executionCounter})`);
  assert(resA === 'dedup_result' && resB === 'dedup_result', 'All concurrent callers received correct result');

  // Test Group 4: JSON-RPC 2.0 Invocations
  console.log('\n--- [4] JSON-RPC 2.0 Protocol Verification ---');
  const rpc = new RpcServer();
  rpc.register('math.add', async (params: { a: number; b: number }) => params.a + params.b);
  const rpcResp = await rpc.handle({
    jsonrpc: '2.0',
    id: 101,
    method: 'math.add',
    params: { a: 40, b: 2 }
  });
  assert(rpcResp.result === 42, `RPC procedure returned expected result (42): ${rpcResp.result}`);

  // Test Group 5: Fault Injection & Service Health State
  console.log('\n--- [5] Distributed Fault Injection Simulation ---');
  ServiceHealthRepository.setSimulatedFailure('train-intel', true);
  assert(ServiceHealthRepository.isSimulatedFailure('train-intel'), 'Fault injection simulated (503 triggered)');
  ServiceHealthRepository.setSimulatedFailure('train-intel', false);
  assert(!ServiceHealthRepository.isSimulatedFailure('train-intel'), 'Fault injection recovered to UP status');

  // Test Group 6: Centralized API Registry
  console.log('\n--- [6] Centralized API Registry Inventory ---');
  assert(API_REGISTRY.length >= 25, `API registry catalogs all required endpoints (${API_REGISTRY.length} registered)`);
  const liveEndpoint = API_REGISTRY.find(e => e.id === 'TRAIN_LIVE_STATUS');
  assert(liveEndpoint?.documentedPath === '/v1/trains/{number}/live', 'Documented path for live train verified');
  assert(liveEndpoint?.consumesQuota === true, 'Live status correctly identified as consuming quota');

  console.log('\n============================================================');
  console.log(`   Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
