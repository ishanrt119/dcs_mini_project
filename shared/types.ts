// RailSync Distributed Railway Intelligence - Shared Types

export type DataSourceLabel =
  | 'LIVE_PROVIDER_DATA'
  | 'CACHED_PROVIDER_DATA'
  | 'LOCAL_HISTORICAL_OBSERVATION'
  | 'SIMULATED_DEMO_DATA'
  | 'UNAVAILABLE';

export interface ApiResponseMeta {
  traceId: string;
  timestamp: string;
  executionTimeMs: number;
  source: DataSourceLabel;
  isCached?: boolean;
  cacheTtlRemainingSec?: number;
  endpointId?: string;
  quotaUsedThisMonth?: number;
  internalBudgetRemaining?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
    details?: any;
    quotaStatus?: QuotaStatus;
  };
  meta: ApiResponseMeta;
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
}

// ------------------- Train Intelligence Types -------------------
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

export interface LiveTrainStatus {
  trainNumber: string;
  trainName: string;
  startDate: string;
  lastUpdatedAt: string;
  status: string; // e.g. "Running On Time", "Delayed by 18m", "Arrived"
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
    type: 'LineString' | 'Point';
    coordinates: [number, number][]; // [lat, lng]
  };
}

export interface CoachInfo {
  position: number;
  code: string; // e.g. "GEN", "B1", "B2", "A1", "H1"
  classType: string; // "3A", "2A", "1A", "SL", "UR"
  seatCount: number;
  platformPosition: 'Front' | 'Middle' | 'Rear';
}

export interface TrainDetail {
  trainNumber: string;
  trainName: string;
  category: string; // Rajdhani, Shatabdi, Superfast, Mail/Express, Suburban, Freight
  speedType: string; // Superfast, Express, Passenger, High-Speed
  origin: { code: string; name: string };
  destination: { code: string; name: string };
  totalDistanceKm: number;
  totalDurationMinutes: number;
  operatingDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  classes: string[]; // ['1A', '2A', '3A', 'SL']
  pantryAvailable: boolean;
  rakeType: 'LHB' | 'ICF' | 'Vande Bharat';
}

// ------------------- Journey & Station Types -------------------
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

export interface StationScheduleItem {
  trainNumber: string;
  trainName: string;
  arrivalTime: string;
  departureTime: string;
  platform: string;
  days: string[];
  origin: string;
  destination: string;
}

export interface LiveDepartureItem {
  trainNumber: string;
  trainName: string;
  scheduledDeparture: string;
  expectedDeparture: string;
  delayMinutes: number;
  platform: string;
  status: string;
  destination: string;
}

export interface TrainsBetweenResult {
  fromStation: string;
  toStation: string;
  date: string;
  trains: Array<{
    trainNumber: string;
    trainName: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    runningDays: string[];
    classes: string[];
  }>;
}

export interface SuburbanTimetable {
  corridor: string; // e.g. "Western Line", "Central Line", "Harbour Line"
  city: string;
  services: Array<{
    trainId: string;
    source: string;
    destination: string;
    departureTime: string;
    type: 'Fast' | 'Slow' | 'AC';
  }>;
}

// ------------------- Reservation Intelligence Types -------------------
export interface SeatAvailabilityQuery {
  trainNumber: string;
  fromStation: string;
  toStation: string;
  date: string;
  classType: string;
  quota: 'GN' | 'TQ' | 'LD' | 'SS';
}

export interface SeatAvailabilityResult {
  trainNumber: string;
  fromStation: string;
  toStation: string;
  date: string;
  classType: string;
  quota: string;
  availability: Array<{
    date: string;
    status: string; // "AVAILABLE-42", "WL 18", "RAC 5"
    probability?: number;
    fare: number;
  }>;
}

export interface FareCalculationResult {
  trainNumber: string;
  fromStation: string;
  toStation: string;
  faresByClass: Record<string, {
    baseFare: number;
    reservationCharge: number;
    superfastCharge: number;
    gst: number;
    totalFare: number;
  }>;
}

export interface PnrStatusResult {
  pnr: string; // Masked / fictitious in demo
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  fromStation: string;
  toStation: string;
  boardingStation: string;
  classType: string;
  chartStatus: 'CHART NOT PREPARED' | 'CHART PREPARED';
  passengers: Array<{
    passengerIndex: number;
    bookingStatus: string; // e.g. "W/L 24"
    currentStatus: string; // e.g. "CNF B2 45" or "RAC 12"
    confirmationChancePercent?: number;
  }>;
}

export interface ConfirmationPredictionResult {
  pnrOrWaitlist: string;
  trainNumber: string;
  classType: string;
  journeyDate: string;
  currentWaitlist: number;
  predictedProbabilityPercent: number;
  trend: 'High Probability' | 'Moderate Probability' | 'Low Probability';
  historicalPatternInsight: string;
}

export interface RefundEstimationResult {
  ticketAmount: number;
  cancellationHoursBeforeDeparture: number;
  classType: string;
  confirmedOrWaitlist: 'CONFIRMED' | 'RAC' | 'WAITLIST';
  clerkageOrCancellationFee: number;
  refundAmount: number;
  applicableRule: string;
}

// ------------------- Analytics & Distributed Event Types -------------------
export interface TrainSnapshotRecord {
  id?: number;
  trainNumber: string;
  snapshotTimestamp: string;
  observedDelayMinutes: number;
  stationCode: string;
  speedKmph: number;
  status: string;
}

export interface IncidentRecord {
  id?: number;
  incidentId: string;
  trainNumber?: string;
  stationCode?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  type: string;
  description: string;
  timestamp: string;
  estimatedDelayMinutes?: number;
  status: 'ACTIVE' | 'RESOLVED' | 'SIMULATED';
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

export interface StationDisruptionSimulationInput {
  stationCode: string;
  disruptionType: 'SIGNAL_FAILURE' | 'TRACK_MAINTENANCE' | 'WEATHER_DISRUPTION' | 'ACCIDENT';
  severityHours: number;
  affectedCorridor: string;
}

export interface StationDisruptionSimulationOutput {
  simulationId: string;
  stationCode: string;
  stationName: string;
  disruptionType: string;
  estimatedDelaySpreadMinutes: number;
  potentiallyAffectedTrains: Array<{
    trainNumber: string;
    trainName: string;
    scheduledHalt: string;
    estimatedCompoundedDelay: number;
  }>;
  assumptions: string[];
  disclaimer: string;
}

// ------------------- Distributed RPC Demonstration Types -------------------
export interface DCS_RpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params: any;
}

export interface DCS_RpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
