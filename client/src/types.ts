// Client-side TypeScript Types

export type DataSourceLabel =
  | 'LIVE_PROVIDER_DATA'
  | 'CACHED_PROVIDER_DATA'
  | 'LOCAL_HISTORICAL_OBSERVATION'
  | 'SIMULATED_DEMO_DATA'
  | 'UNAVAILABLE';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
    details?: any;
    quotaStatus?: QuotaStatus;
  };
  meta: {
    traceId: string;
    timestamp: string;
    executionTimeMs: number;
    source: DataSourceLabel;
    isCached?: boolean;
    cacheTtlRemainingSec?: number;
    endpointId?: string;
  };
}

export interface QuotaStatus {
  monthlyLimit: number;
  internalBudget: number;
  usedThisMonth: number;
  remainingBudget: number;
  emergencyBuffer: number;
  liveCallsEnabled: boolean;
  demoMode: boolean;
  resetDate: string;
  cacheHitRatio: number;
  totalCacheHits: number;
  totalCacheMisses: number;
  apiKeyConfigured?: boolean;
}

export interface HaltInfo {
  stationCode: string;
  stationName: string;
  scheduledArrival: string;
  scheduledDeparture: string;
  actualArrival?: string;
  actualDeparture?: string;
  delayArrivalMinutes: number;
  delayDepartureMinutes: number;
  distanceKm: number;
  dayNumber: number;
  platform?: string;
  hasDeparted?: boolean;
  isCurrent?: boolean;
}

export interface CoachInfo {
  position: number;
  code: string;
  classType: string;
  seatCount: number;
  platformPosition: 'Front' | 'Middle' | 'Rear';
}

export interface LiveTrainStatus {
  trainNumber: string;
  trainName: string;
  startDate: string;
  lastUpdatedAt: string;
  status: string;
  delayMinutes: number;
  currentSpeedKmph: number;
  currentLocation: {
    lat?: number;
    lng?: number;
    stationCode: string;
    stationName: string;
    distanceFromOriginKm: number;
  };
  previousHalt?: HaltInfo;
  nextHalt?: HaltInfo;
  route: HaltInfo[];
  isLive: boolean;
  exceptions: Array<{ type: string; description: string }>;
  coachLayout?: CoachInfo[];
  geometry?: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

export interface ServiceHealthMetric {
  serviceId: string;
  name: string;
  port: number;
  status: 'UP' | 'DEGRADED' | 'DOWN';
  uptimeSeconds: number;
  requestCount: number;
  avgLatencyMs: number;
  lastHeartbeat: string;
  isSimulatedFailure?: boolean;
}

export interface StationSummary {
  code: string;
  name: string;
  city: string;
  state: string;
  zone: string;
  platforms: number;
  lat: number;
  lng: number;
}
