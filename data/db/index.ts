// Local SQLite Database and Repositories for RailSync Distributed Platform
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), 'data/db/railsync.db');

// Ensure directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Initialize schema and indices
export function initDatabase() {
  db.exec(`
    PRAGMA journal_mode = WAL;

    -- Train timestamped observations for historical analytics and delay trend detection
    CREATE TABLE IF NOT EXISTS train_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      train_number TEXT NOT NULL,
      snapshot_timestamp TEXT NOT NULL,
      observed_delay_minutes INTEGER NOT NULL,
      station_code TEXT,
      speed_kmph REAL,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_snapshots_train ON train_snapshots(train_number, snapshot_timestamp);

    -- Incident history and local alert tracking
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id TEXT UNIQUE NOT NULL,
      train_number TEXT,
      station_code TEXT,
      severity TEXT NOT NULL, -- INFO, WARNING, CRITICAL
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      estimated_delay_minutes INTEGER,
      status TEXT NOT NULL DEFAULT 'ACTIVE' -- ACTIVE, RESOLVED, SIMULATED
    );
    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status, timestamp);

    -- Station events & disruption simulation logs
    CREATE TABLE IF NOT EXISTS station_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT UNIQUE NOT NULL,
      station_code TEXT NOT NULL,
      event_type TEXT NOT NULL,
      severity_hours REAL,
      affected_corridor TEXT,
      estimated_spread_delay_minutes INTEGER,
      assumptions_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Service health and latency tracking
    CREATE TABLE IF NOT EXISTS service_health (
      service_id TEXT PRIMARY KEY,
      service_name TEXT NOT NULL,
      port INTEGER NOT NULL,
      status TEXT NOT NULL, -- UP, DEGRADED, DOWN
      last_heartbeat TEXT NOT NULL,
      uptime_seconds INTEGER DEFAULT 0,
      request_count INTEGER DEFAULT 0,
      avg_latency_ms REAL DEFAULT 0,
      is_simulated_failure INTEGER DEFAULT 0
    );

    -- Provider request quota audit and deduplication metrics (no sensitive reservation data)
    CREATE TABLE IF NOT EXISTS request_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint_id TEXT NOT NULL,
      endpoint_path TEXT NOT NULL,
      query_identifier TEXT,
      response_status INTEGER NOT NULL,
      is_cached INTEGER NOT NULL, -- 1 for cache hit, 0 for outbound attempt
      duration_ms REAL NOT NULL,
      timestamp TEXT NOT NULL,
      year_month TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_request_logs_month ON request_logs(year_month);

    -- User saved / watched trains
    CREATE TABLE IF NOT EXISTS saved_trains (
      train_number TEXT PRIMARY KEY,
      train_name TEXT NOT NULL,
      notes TEXT,
      added_at TEXT NOT NULL
    );

    -- Distributed cluster system configuration
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed default saved trains if empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM saved_trains');
  const countRow = countStmt.get() as { count: number };
  if (countRow.count === 0) {
    const insertSaved = db.prepare('INSERT INTO saved_trains (train_number, train_name, notes, added_at) VALUES (?, ?, ?, ?)');
    insertSaved.run('12951', 'Mumbai Tejas Rajdhani Express', 'Primary western corridor flagship', new Date().toISOString());
    insertSaved.run('22436', 'Vande Bharat Express (NDLS-BSB)', 'Semi-high speed passenger run', new Date().toISOString());
    insertSaved.run('12002', 'Bhopal Shatabdi Express', 'Agra-Delhi speed testing section', new Date().toISOString());
  }

  // Seed sample initial snapshot history for trend calculation demonstration
  const snapshotCount = (db.prepare('SELECT COUNT(*) as count FROM train_snapshots').get() as { count: number }).count;
  if (snapshotCount === 0) {
    const insertSnap = db.prepare('INSERT INTO train_snapshots (train_number, snapshot_timestamp, observed_delay_minutes, station_code, speed_kmph, status) VALUES (?, ?, ?, ?, ?, ?)');
    const now = Date.now();
    // 12951 historical snapshots (showing improving delay)
    insertSnap.run('12951', new Date(now - 3600000 * 3).toISOString(), 14, 'ST', 110, 'Delayed by 14m');
    insertSnap.run('12951', new Date(now - 3600000 * 2).toISOString(), 9, 'BRC', 118, 'Delayed by 9m');
    insertSnap.run('12951', new Date(now - 3600000 * 1).toISOString(), 4, 'RTM', 124, 'Running 4m Late');

    // 12301 historical snapshots (showing worsening delay)
    insertSnap.run('12301', new Date(now - 3600000 * 2).toISOString(), 15, 'ASN', 105, 'Delayed by 15m');
    insertSnap.run('12301', new Date(now - 3600000 * 1).toISOString(), 26, 'DHN', 95, 'Delayed by 26m');
  }

  // Seed default service entries
  const services = [
    { id: 'gateway', name: 'API Gateway', port: 4000 },
    { id: 'train-intel', name: 'Train Intelligence Service', port: 4001 },
    { id: 'journey-station', name: 'Journey & Station Service', port: 4002 },
    { id: 'reservation', name: 'Reservation Intelligence Service', port: 4003 },
    { id: 'analytics', name: 'Analytics & Event Service', port: 4004 }
  ];
  for (const s of services) {
    const exists = db.prepare('SELECT 1 FROM service_health WHERE service_id = ?').get(s.id);
    if (!exists) {
      db.prepare(`
        INSERT INTO service_health (service_id, service_name, port, status, last_heartbeat, uptime_seconds, request_count, avg_latency_ms, is_simulated_failure)
        VALUES (?, ?, ?, 'UP', ?, 0, 0, 0, 0)
      `).run(s.id, s.name, s.port, new Date().toISOString());
    }
  }
}

// ------------------- Snapshots Repository -------------------
export const SnapshotsRepository = {
  save(trainNumber: string, delayMinutes: number, stationCode: string, speed: number, status: string) {
    const stmt = db.prepare(`
      INSERT INTO train_snapshots (train_number, snapshot_timestamp, observed_delay_minutes, station_code, speed_kmph, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(trainNumber, new Date().toISOString(), delayMinutes, stationCode, speed, status);
  },

  getHistory(trainNumber: string, limit: number = 20) {
    const stmt = db.prepare(`
      SELECT * FROM train_snapshots
      WHERE train_number = ?
      ORDER BY snapshot_timestamp ASC
      LIMIT ?
    `);
    return stmt.all(trainNumber, limit) as any[];
  },

  calculateTrend(trainNumber: string): {
    trend: 'Improving' | 'Stable' | 'Worsening' | 'Insufficient Data';
    diffMinutes: number;
    observationsCount: number;
    explanation: string;
  } {
    const rows = db.prepare(`
      SELECT observed_delay_minutes, snapshot_timestamp FROM train_snapshots
      WHERE train_number = ?
      ORDER BY snapshot_timestamp DESC
      LIMIT 2
    `).all(trainNumber) as Array<{ observed_delay_minutes: number; snapshot_timestamp: string }>;

    if (rows.length < 2) {
      return {
        trend: 'Insufficient Data',
        diffMinutes: 0,
        observationsCount: rows.length,
        explanation: 'Only 1 observation recorded so far. At least two chronological snapshots are required to calculate delay velocity.'
      };
    }

    const latest = rows[0].observed_delay_minutes;
    const previous = rows[1].observed_delay_minutes;
    const diff = latest - previous; // > 0 means delay increased (worsening)

    if (diff < -2) {
      return {
        trend: 'Improving',
        diffMinutes: diff,
        observationsCount: rows.length,
        explanation: `Train delay reduced by ${Math.abs(diff)} minutes since last observation (makeup speed detected).`
      };
    } else if (diff > 2) {
      return {
        trend: 'Worsening',
        diffMinutes: diff,
        observationsCount: rows.length,
        explanation: `Train delay expanded by ${diff} minutes between checkpoints.`
      };
    } else {
      return {
        trend: 'Stable',
        diffMinutes: diff,
        observationsCount: rows.length,
        explanation: `Train delay is holding steady (delta within ±2 minutes).`
      };
    }
  }
};

// ------------------- Incidents Repository -------------------
export const IncidentsRepository = {
  record(incident: {
    incidentId: string;
    trainNumber?: string;
    stationCode?: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    type: string;
    description: string;
    estimatedDelayMinutes?: number;
    status?: 'ACTIVE' | 'RESOLVED' | 'SIMULATED';
  }) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO incidents (incident_id, train_number, station_code, severity, type, description, timestamp, estimated_delay_minutes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      incident.incidentId,
      incident.trainNumber || null,
      incident.stationCode || null,
      incident.severity,
      incident.type,
      incident.description,
      new Date().toISOString(),
      incident.estimatedDelayMinutes || 0,
      incident.status || 'ACTIVE'
    );
  },

  getAll(limit: number = 50) {
    return db.prepare('SELECT * FROM incidents ORDER BY timestamp DESC LIMIT ?').all(limit) as any[];
  },

  resolve(incidentId: string) {
    db.prepare("UPDATE incidents SET status = 'RESOLVED' WHERE incident_id = ?").run(incidentId);
  }
};

// ------------------- Quota Repository -------------------
export const QuotaRepository = {
  logRequest(entry: {
    endpointId: string;
    endpointPath: string;
    queryIdentifier?: string;
    responseStatus: number;
    isCached: boolean;
    durationMs: number;
  }) {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const stmt = db.prepare(`
      INSERT INTO request_logs (endpoint_id, endpoint_path, query_identifier, response_status, is_cached, duration_ms, timestamp, year_month)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      entry.endpointId,
      entry.endpointPath,
      entry.queryIdentifier || null,
      entry.responseStatus,
      entry.isCached ? 1 : 0,
      entry.durationMs,
      now.toISOString(),
      yearMonth
    );
  },

  getMonthlyMetrics(yearMonth?: string) {
    const ym = yearMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const totalOutbound = (db.prepare(`
      SELECT COUNT(*) as count FROM request_logs
      WHERE year_month = ? AND is_cached = 0
    `).get(ym) as { count: number }).count;

    const successfulOutbound = (db.prepare(`
      SELECT COUNT(*) as count FROM request_logs
      WHERE year_month = ? AND is_cached = 0 AND response_status >= 200 AND response_status < 300
    `).get(ym) as { count: number }).count;

    const failedOutbound = (db.prepare(`
      SELECT COUNT(*) as count FROM request_logs
      WHERE year_month = ? AND is_cached = 0 AND response_status >= 400
    `).get(ym) as { count: number }).count;

    const cacheHits = (db.prepare(`
      SELECT COUNT(*) as count FROM request_logs
      WHERE year_month = ? AND is_cached = 1
    `).get(ym) as { count: number }).count;

    const endpointBreakdown = db.prepare(`
      SELECT endpoint_id, COUNT(*) as count, SUM(CASE WHEN is_cached = 1 THEN 1 ELSE 0 END) as cache_hits
      FROM request_logs
      WHERE year_month = ?
      GROUP BY endpoint_id
      ORDER BY count DESC
    `).all(ym) as any[];

    const recentLogs = db.prepare(`
      SELECT id, endpoint_id, endpoint_path, query_identifier, response_status, is_cached, duration_ms, timestamp
      FROM request_logs
      ORDER BY id DESC
      LIMIT 25
    `).all() as any[];

    return {
      yearMonth: ym,
      totalOutboundAttempts: totalOutbound,
      successfulOutbound,
      failedOutbound,
      cacheHits,
      endpointBreakdown,
      recentLogs
    };
  }
};

// ------------------- Service Health Repository -------------------
export const ServiceHealthRepository = {
  updateHeartbeat(serviceId: string, status: 'UP' | 'DEGRADED' | 'DOWN', latencyMs: number) {
    const stmt = db.prepare(`
      UPDATE service_health
      SET status = ?,
          last_heartbeat = ?,
          request_count = request_count + 1,
          avg_latency_ms = (avg_latency_ms * 0.8) + (? * 0.2)
      WHERE service_id = ?
    `);
    stmt.run(status, new Date().toISOString(), latencyMs, serviceId);
  },

  setSimulatedFailure(serviceId: string, fail: boolean) {
    db.prepare('UPDATE service_health SET is_simulated_failure = ? WHERE service_id = ?').run(fail ? 1 : 0, serviceId);
  },

  isSimulatedFailure(serviceId: string): boolean {
    const row = db.prepare('SELECT is_simulated_failure FROM service_health WHERE service_id = ?').get(serviceId) as { is_simulated_failure: number } | undefined;
    return !!row?.is_simulated_failure;
  },

  getAllMetrics() {
    return db.prepare('SELECT * FROM service_health ORDER BY port ASC').all() as any[];
  }
};

// ------------------- Saved Trains Repository -------------------
export const SavedTrainsRepository = {
  getAll() {
    return db.prepare('SELECT * FROM saved_trains ORDER BY added_at DESC').all() as any[];
  },
  save(trainNumber: string, trainName: string, notes: string = '') {
    db.prepare('INSERT OR REPLACE INTO saved_trains (train_number, train_name, notes, added_at) VALUES (?, ?, ?, ?)').run(
      trainNumber,
      trainName,
      notes,
      new Date().toISOString()
    );
  },
  remove(trainNumber: string) {
    db.prepare('DELETE FROM saved_trains WHERE train_number = ?').run(trainNumber);
  }
};

// ------------------- System Configuration Repository -------------------
export const SystemConfigRepository = {
  get(key: string, defaultValue?: string): string | undefined {
    try {
      const row = db.prepare('SELECT value FROM system_config WHERE key = ?').get(key) as { value: string } | undefined;
      return row ? row.value : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set(key: string, value: string) {
    try {
      const stmt = db.prepare(`
        INSERT INTO system_config (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `);
      stmt.run(key, value, new Date().toISOString());
    } catch (e) {
      console.error('Failed to set system config in DB', e);
    }
  }
};
