// Centralized API Registry for RailSync & RailRadar Integrations

export type ImplementationStatus = 'verified_live' | 'fixture_adapter' | 'pending_spec';
export type FeatureModule =
  | 'Train Intelligence'
  | 'Journey Planning'
  | 'Reservation Intelligence'
  | 'Network & Specialist Data'
  | 'Distributed Monitoring';

export interface ApiRegistryEntry {
  id: string;
  displayName: string;
  featureModule: FeatureModule;
  httpMethod: 'GET' | 'POST';
  documentedPath: string;
  pathParams?: string[];
  queryParams?: string[];
  requiresAuth: boolean;
  consumesQuota: boolean;
  defaultTtlSeconds: number;
  expectedFreshness: string;
  implementationStatus: ImplementationStatus;
  testStatus: 'passed_mock' | 'untested';
  notes: string;
  lastVerifiedDate?: string;
}

export const API_REGISTRY: ApiRegistryEntry[] = [
  // ------------------- Train Intelligence Endpoints -------------------
  {
    id: 'TRAIN_LIVE_STATUS',
    displayName: 'Live Train Running Status',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/{number}/live',
    pathParams: ['number'],
    queryParams: ['date', 'authoritative', 'haltsOnly', 'geometry', 'format', 'includeCoordinates'],
    requiresAuth: true,
    consumesQuota: true,
    defaultTtlSeconds: 120, // 2 minutes
    expectedFreshness: 'Near real-time (1-2 mins)',
    implementationStatus: 'verified_live',
    testStatus: 'passed_mock',
    notes: 'Primary documented live tracking endpoint. Protected by quota manager; cached locally.',
    lastVerifiedDate: '2026-10-20'
  },
  {
    id: 'TRAIN_DETAILS',
    displayName: 'Train Details',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/{number}',
    pathParams: ['number'],
    requiresAuth: true,
    consumesQuota: false, // Cached static or adapter
    defaultTtlSeconds: 86400, // 24 hours
    expectedFreshness: 'Static timetable schedule',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Static train metadata, origins, destinations, operating days, and rake specifications.'
  },
  {
    id: 'TRAIN_TIMETABLE_HALTS',
    displayName: 'Timetable & Halts',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/{number}/timetable',
    pathParams: ['number'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 86400,
    expectedFreshness: 'Daily static schedule',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Comprehensive sequence of all scheduled halts, platforms, distances, and intermediate durations.'
  },
  {
    id: 'TRAIN_ROUTE_GEOMETRY',
    displayName: 'Route Geometry',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/{number}/geometry',
    pathParams: ['number'],
    queryParams: ['format'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800, // 7 days
    expectedFreshness: 'Permanent railway track layout',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'High-precision geospatial track coordinates for map visualization.'
  },
  {
    id: 'TRAIN_DELAY_OVERLAY',
    displayName: 'Delay Overlay',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/{number}/delay-overlay',
    pathParams: ['number'],
    requiresAuth: true,
    consumesQuota: true,
    defaultTtlSeconds: 180,
    expectedFreshness: 'Near real-time delay telemetry',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Overlays real-time delay metrics atop scheduled geometry milestones.'
  },
  {
    id: 'TRAIN_COACH_LAYOUT',
    displayName: 'Coach Layout',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/{number}/coach-layout',
    pathParams: ['number'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'Rake composition schedule',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Rake composition showing engine position, AC, Sleeper, and General coach sequences.'
  },
  {
    id: 'TRAIN_PLATFORM_POSITION',
    displayName: 'Platform Position',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/{number}/platform-positions',
    pathParams: ['number'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 3600,
    expectedFreshness: 'Hourly updates per station',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Coach placement relative to station foot-over-bridges and platform landmarks.'
  },
  {
    id: 'TRAIN_AUTOCOMPLETE',
    displayName: 'Train Autocomplete',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/search',
    queryParams: ['query'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'Static dictionary',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Fast client-side / local search by train number or train name.'
  },
  {
    id: 'TRAIN_DIRECTORY',
    displayName: 'Train Directory',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains',
    queryParams: ['page', 'limit', 'category'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'Weekly master dataset',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Paginated master registry of all Indian Railway trains.'
  },
  {
    id: 'TRAIN_CATEGORIES',
    displayName: 'Train Categories',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/categories',
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'Static reference data',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Classification list: Rajdhani, Shatabdi, Vande Bharat, Tejas, Duronto, Superfast, Mail.'
  },
  {
    id: 'TRAIN_SPEED_TYPES',
    displayName: 'Speed Types',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/speed-types',
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'Static reference data',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Speed tier categorizations (High Speed 160km/h, Superfast 110-130km/h, Express 80-110km/h).'
  },
  {
    id: 'PRS_RESERVED_TRAINS',
    displayName: 'PRS Reserved Trains',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/prs',
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 86400,
    expectedFreshness: 'Daily sync',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Passenger Reservation System registered trains with quota allocations.'
  },
  {
    id: 'NTES_TRAINS',
    displayName: 'NTES Trains',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/ntes',
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 86400,
    expectedFreshness: 'National Train Enquiry System synced list',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Operational trains active in NTES dispatch grid.'
  },
  {
    id: 'COMPRESSED_TRAINS',
    displayName: 'Compressed Trains',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/compressed',
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'Weekly delta package',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Binary/Gzip compressed high-density train roster with internal decode adapter.'
  },
  {
    id: 'COMPRESSED_PRS',
    displayName: 'Compressed PRS',
    featureModule: 'Train Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/prs/compressed',
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'Weekly compressed delta',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Compressed payload for PRS train reservation matrix.'
  },

  // ------------------- Journey Planning Endpoints -------------------
  {
    id: 'ROUTE_PLANNER',
    displayName: 'Route Planner',
    featureModule: 'Journey Planning',
    httpMethod: 'GET',
    documentedPath: '/v1/routes/plan',
    queryParams: ['from', 'to', 'date', 'via', 'maxTransfers'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 3600,
    expectedFreshness: 'Direct and optimal connecting route plans',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Multi-leg journey graph search between any two stations.'
  },
  {
    id: 'TRAINS_BETWEEN_STATIONS',
    displayName: 'Trains Between Stations',
    featureModule: 'Journey Planning',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/between',
    queryParams: ['from', 'to', 'date'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 7200,
    expectedFreshness: 'Schedule matching travel date',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Direct train services operating between specified origin and destination.'
  },
  {
    id: 'STATION_AUTOCOMPLETE',
    displayName: 'Station Autocomplete',
    featureModule: 'Journey Planning',
    httpMethod: 'GET',
    documentedPath: '/v1/stations/search',
    queryParams: ['query'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'Static dictionary',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Instant autocomplete matching station names, codes, and cities.'
  },
  {
    id: 'STATION_SCHEDULE',
    displayName: 'Station Schedule',
    featureModule: 'Journey Planning',
    httpMethod: 'GET',
    documentedPath: '/v1/stations/{code}/schedule',
    pathParams: ['code'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 86400,
    expectedFreshness: 'Master 24h timetable at station',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'All trains halting or terminating at a specified station.'
  },
  {
    id: 'LIVE_DEPARTURES',
    displayName: 'Live Departures',
    featureModule: 'Journey Planning',
    httpMethod: 'GET',
    documentedPath: '/v1/stations/{code}/live-departures',
    pathParams: ['code'],
    queryParams: ['hours'],
    requiresAuth: true,
    consumesQuota: true,
    defaultTtlSeconds: 180,
    expectedFreshness: 'Next 2 to 4 hours departures board',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Upcoming platform departures and arrivals with live estimated delays.'
  },
  {
    id: 'STATION_DIRECTORY',
    displayName: 'Station Directory',
    featureModule: 'Journey Planning',
    httpMethod: 'GET',
    documentedPath: '/v1/stations',
    queryParams: ['page', 'limit', 'state', 'zone'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'Monthly static registry',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'All Indian Railway stations with geographic zones and platform counts.'
  },
  {
    id: 'NTES_STATIONS',
    displayName: 'NTES Stations',
    featureModule: 'Journey Planning',
    httpMethod: 'GET',
    documentedPath: '/v1/stations/ntes',
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'NTES telemetry reporting nodes',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Station nodes equipped with computerized data dispatch terminals.'
  },
  {
    id: 'COMPRESSED_STATIONS',
    displayName: 'Compressed Stations',
    featureModule: 'Journey Planning',
    httpMethod: 'GET',
    documentedPath: '/v1/stations/compressed',
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'Binary compressed index',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'High-density encoded station dictionary.'
  },
  {
    id: 'SUBURBAN_TIMETABLES',
    displayName: 'Suburban Timetables',
    featureModule: 'Journey Planning',
    httpMethod: 'GET',
    documentedPath: '/v1/suburban/timetables',
    queryParams: ['city', 'line'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 86400,
    expectedFreshness: 'Daily suburban schedules',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'EMU / suburban local train timetables for Mumbai, Delhi, Chennai, Kolkata.'
  },
  {
    id: 'LOCAL_CITIES',
    displayName: 'Local Cities',
    featureModule: 'Journey Planning',
    httpMethod: 'GET',
    documentedPath: '/v1/suburban/cities',
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'Static city directory',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Metropolitan areas supported with commuter railway networks.'
  },
  {
    id: 'STATIONS_KVS',
    displayName: 'Stations Key-Value Index',
    featureModule: 'Journey Planning',
    httpMethod: 'GET',
    documentedPath: '/v1/stations/kvs',
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'Lightweight code-to-name KV pairs',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Fast O(1) hash map of stationCode -> stationName for frontend caching.'
  },
  {
    id: 'TRAINS_KVS',
    displayName: 'Trains Key-Value Index',
    featureModule: 'Journey Planning',
    httpMethod: 'GET',
    documentedPath: '/v1/trains/kvs',
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'Lightweight number-to-name KV pairs',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Fast O(1) hash map of trainNumber -> trainName for frontend caching.'
  },

  // ------------------- Reservation Intelligence Endpoints -------------------
  {
    id: 'SEAT_AVAILABILITY',
    displayName: 'Seat Availability',
    featureModule: 'Reservation Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/reservation/availability',
    queryParams: ['train', 'from', 'to', 'date', 'class', 'quota'],
    requiresAuth: true,
    consumesQuota: true,
    defaultTtlSeconds: 600,
    expectedFreshness: '10-minute snapshot',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Query berth availability across GN, Tatkal, and Ladies quotas.'
  },
  {
    id: 'FARE_CALCULATOR',
    displayName: 'Fare Calculator',
    featureModule: 'Reservation Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/reservation/fare',
    queryParams: ['train', 'from', 'to', 'class'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 86400,
    expectedFreshness: 'Official Indian Railways telescopic fare table',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Calculates base fare, superfast surcharge, reservation charges, and GST.'
  },
  {
    id: 'PNR_STATUS',
    displayName: 'PNR Status',
    featureModule: 'Reservation Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/pnr/{pnr}',
    pathParams: ['pnr'],
    requiresAuth: true,
    consumesQuota: true,
    defaultTtlSeconds: 300,
    expectedFreshness: 'Real-time reservation booking/charting status',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Retrieves current passenger status without storing or logging personal details.'
  },
  {
    id: 'CONFIRMATION_PREDICTION',
    displayName: 'Confirmation Prediction',
    featureModule: 'Reservation Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/pnr/prediction',
    queryParams: ['train', 'class', 'waitlistNumber', 'date'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 1800,
    expectedFreshness: 'Statistical heuristic estimation',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Statistical probability estimate based on historical cancellation frequencies.'
  },
  {
    id: 'CANCELLATION_REFUND',
    displayName: 'Cancellation Refund Rules',
    featureModule: 'Reservation Intelligence',
    httpMethod: 'GET',
    documentedPath: '/v1/reservation/refund-rules',
    queryParams: ['ticketAmount', 'class', 'hoursBeforeDeparture', 'status'],
    requiresAuth: false,
    consumesQuota: false,
    defaultTtlSeconds: 604800,
    expectedFreshness: 'Static railway refund policy rules',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Calculates applicable clerkage deductions based on Ministry of Railways Gazette.'
  },

  // ------------------- Network & Specialist Data Endpoints -------------------
  {
    id: 'FREIGHT_TRAINS',
    displayName: 'Freight Trains',
    featureModule: 'Network & Specialist Data',
    httpMethod: 'GET',
    documentedPath: '/v1/freight/trains',
    queryParams: ['corridor', 'commodity'],
    requiresAuth: true,
    consumesQuota: false,
    defaultTtlSeconds: 3600,
    expectedFreshness: 'Dedicated Freight Corridor dispatch schedule',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Freight operations on Western DFC & Eastern DFC corridors.'
  },
  {
    id: 'LIVE_MAP_FEED',
    displayName: 'Live Map Feed',
    featureModule: 'Network & Specialist Data',
    httpMethod: 'GET',
    documentedPath: '/v1/network/map-feed',
    queryParams: ['zone', 'minSpeed'],
    requiresAuth: true,
    consumesQuota: true,
    defaultTtlSeconds: 120,
    expectedFreshness: 'Real-time telemetry cluster',
    implementationStatus: 'fixture_adapter',
    testStatus: 'passed_mock',
    notes: 'Aggregated geospatial coordinates of actively operating trains across zones.'
  }
];
