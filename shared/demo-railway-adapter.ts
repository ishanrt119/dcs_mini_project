// RailSync Local Demo Railway Data Adapter
// Provides 100% offline, local JSON-backed intelligence, deterministic simulation,
// and realistic API-shaped mock responses for distributed services.

import fs from 'fs';
import path from 'path';
import {
  LiveTrainStatus,
  TrainDetail,
  HaltInfo,
  DataSourceLabel,
  SeatAvailabilityResult,
  FareCalculationResult,
  PnrStatusResult,
  ConfirmationPredictionResult,
  RefundEstimationResult
} from './types.js';

export interface MockProviderResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  meta: {
    endpointId: string;
    endpointPath: string;
    httpMethod: string;
    params: Record<string, any>;
    measuredDurationMs: number;
    traceId: string;
    source: DataSourceLabel;
    isCached: boolean;
    providerHealth: 'ONLINE_EMULATED' | 'SIMULATED_OUTAGE';
  };
}

export class DemoRailwayAdapter {
  private static instance: DemoRailwayAdapter;

  private stations: any[] = [];
  private trains: any[] = [];
  private routes: any[] = [];
  private timetables: Record<string, any> = {};
  private liveStatus: Record<string, any> = {};
  private coachLayouts: Record<string, any> = {};
  private platformPositions: Record<string, any> = {};
  private reservations: any = { pnrs: {}, fareRules: {}, refundRules: [] };
  private suburban: any = { cities: [], timetables: [] };
  private freight: any[] = [];
  private delayHistory: any[] = [];
  private disruptions: any[] = [];

  // In-memory local cache
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();
  private mockRequestCount: number = 0;

  // Simulation base clock: allows repeatable viva demonstrations or real-time advancement
  private simulationStartTime: number = Date.now();

  private constructor() {
    this.loadAllFixtures();
  }

  public static getInstance(): DemoRailwayAdapter {
    if (!DemoRailwayAdapter.instance) {
      DemoRailwayAdapter.instance = new DemoRailwayAdapter();
    }
    return DemoRailwayAdapter.instance;
  }

  private loadAllFixtures() {
    const dir = path.resolve(process.cwd(), 'data/fixtures');
    try {
      this.stations = JSON.parse(fs.readFileSync(path.join(dir, 'stations.json'), 'utf-8'));
      this.trains = JSON.parse(fs.readFileSync(path.join(dir, 'trains.json'), 'utf-8'));
      if (fs.existsSync(path.join(dir, 'routes.json'))) {
        this.routes = JSON.parse(fs.readFileSync(path.join(dir, 'routes.json'), 'utf-8'));
      }
      if (fs.existsSync(path.join(dir, 'timetables.json'))) {
        this.timetables = JSON.parse(fs.readFileSync(path.join(dir, 'timetables.json'), 'utf-8'));
      }
      if (fs.existsSync(path.join(dir, 'live-status.json'))) {
        this.liveStatus = JSON.parse(fs.readFileSync(path.join(dir, 'live-status.json'), 'utf-8'));
      }
      if (fs.existsSync(path.join(dir, 'coach-layouts.json'))) {
        this.coachLayouts = JSON.parse(fs.readFileSync(path.join(dir, 'coach-layouts.json'), 'utf-8'));
      }
      if (fs.existsSync(path.join(dir, 'platform-positions.json'))) {
        this.platformPositions = JSON.parse(fs.readFileSync(path.join(dir, 'platform-positions.json'), 'utf-8'));
      }
      if (fs.existsSync(path.join(dir, 'reservations.json'))) {
        this.reservations = JSON.parse(fs.readFileSync(path.join(dir, 'reservations.json'), 'utf-8'));
      }
      if (fs.existsSync(path.join(dir, 'suburban.json'))) {
        this.suburban = JSON.parse(fs.readFileSync(path.join(dir, 'suburban.json'), 'utf-8'));
      }
      if (fs.existsSync(path.join(dir, 'freight.json'))) {
        this.freight = JSON.parse(fs.readFileSync(path.join(dir, 'freight.json'), 'utf-8'));
      }
      if (fs.existsSync(path.join(dir, 'delay-history.json'))) {
        this.delayHistory = JSON.parse(fs.readFileSync(path.join(dir, 'delay-history.json'), 'utf-8'));
      }
      if (fs.existsSync(path.join(dir, 'disruptions.json'))) {
        this.disruptions = JSON.parse(fs.readFileSync(path.join(dir, 'disruptions.json'), 'utf-8'));
      }
    } catch (err) {
      console.error('[DemoRailwayAdapter] Error loading fixtures:', err);
    }
  }

  // --- In-Memory Local Cache Helper ---
  public getCached<T>(key: string): { hit: boolean; data?: T; ttlRemainingSec?: number } {
    const item = this.cache.get(key);
    if (!item) return { hit: false };
    const now = Date.now();
    if (now >= item.expiresAt) {
      this.cache.delete(key);
      return { hit: false };
    }
    return {
      hit: true,
      data: item.data as T,
      ttlRemainingSec: Math.max(0, Math.round((item.expiresAt - now) / 1000))
    };
  }

  public setCached<T>(key: string, data: T, ttlSeconds: number = 120) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }

  public getMockRequestCount(): number {
    return this.mockRequestCount;
  }

  // --- 1. LIVE TRAIN STATUS (Deterministic Simulation) ---
  public getLiveTrainStatus(
    trainNumber: string,
    requestedDate: string = new Date().toISOString().split('T')[0]
  ): { status: LiveTrainStatus; source: DataSourceLabel } | null {
    const train = this.trains.find(t => t.trainNumber === trainNumber);
    if (!train) return null;

    // Advance location deterministically along route using elapsed simulation time
    const elapsedMinutes = Math.floor((Date.now() - this.simulationStartTime) / 10000); // 10 real seconds = 1 sim minute
    const route = train.route.map((h: any) => ({ ...h }));
    const totalHalts = route.length;

    // Cyclic position along route
    const currentHaltIndex = totalHalts > 1 ? (Math.floor(elapsedMinutes / 2) + Math.floor(totalHalts * 0.35)) % totalHalts : 0;
    const currentHalt = route[currentHaltIndex];

    // Gradual delay modulation: fluctuates predictably (+/- 4m)
    const baseDelay = train.delayMinutes || 0;
    const dynamicDelay = Math.max(0, baseDelay + Math.round(Math.sin((elapsedMinutes + parseInt(trainNumber.slice(-2) || '0', 10)) * 0.5) * 4));

    // Dynamic speed simulation
    const isAtStation = elapsedMinutes % 4 === 0;
    const currentSpeed = isAtStation ? 0 : Math.max(45, train.currentSpeedKmph + Math.round(Math.cos(elapsedMinutes) * 12));

    // State transitions: departed, approaching, halted, or en-route
    route.forEach((h: any, idx: number) => {
      if (idx < currentHaltIndex) {
        h.hasDeparted = true;
        h.isCurrent = false;
        h.delayArrivalMinutes = dynamicDelay;
        h.delayDepartureMinutes = dynamicDelay;
      } else if (idx === currentHaltIndex) {
        h.hasDeparted = isAtStation ? false : true;
        h.isCurrent = true;
        h.delayArrivalMinutes = dynamicDelay;
        h.delayDepartureMinutes = dynamicDelay;
      } else {
        h.hasDeparted = false;
        h.isCurrent = false;
        h.delayArrivalMinutes = dynamicDelay;
        h.delayDepartureMinutes = dynamicDelay;
      }
    });

    let runStatus = 'Running On Time';
    if (dynamicDelay > 0) {
      runStatus = `Delayed by ${dynamicDelay}m`;
    }
    if (currentHaltIndex === totalHalts - 1 && isAtStation) {
      runStatus = 'Arrived at Destination';
    } else if (isAtStation) {
      runStatus = `Halted at ${currentHalt.stationName} (Platform ${currentHalt.platform || '1'})`;
    } else if (currentHaltIndex > 0) {
      const nextHalt = route[currentHaltIndex + 1] || currentHalt;
      runStatus = `En Route to ${nextHalt.stationName} (Delayed ${dynamicDelay}m)`;
    }

    const liveStatus: LiveTrainStatus = {
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      startDate: requestedDate,
      lastUpdatedAt: new Date().toISOString(),
      status: runStatus,
      delayMinutes: dynamicDelay,
      currentSpeedKmph: currentSpeed,
      currentLocation: {
        stationCode: currentHalt.stationCode,
        stationName: currentHalt.stationName,
        distanceFromOriginKm: currentHalt.distanceKm,
        lat: train.currentLocation?.lat,
        lng: train.currentLocation?.lng
      },
      route,
      isLive: true,
      exceptions: []
    };

    return {
      status: liveStatus,
      source: 'LOCAL_SIMULATION'
    };
  }

  // --- 2. TRAIN DETAILS ---
  public getTrainDetail(trainNumber: string): { detail: TrainDetail; source: DataSourceLabel } | null {
    const matched = this.trains.find(t => t.trainNumber === trainNumber);
    if (!matched) return null;

    return {
      detail: {
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
      },
      source: 'LOCAL_JSON_FIXTURE'
    };
  }

  // --- 3. TRAIN SEARCH ---
  public searchTrains(query: string): any[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return this.trains
      .filter(t => t.trainNumber.toLowerCase().includes(q) || t.trainName.toLowerCase().includes(q))
      .map(t => ({
        trainNumber: t.trainNumber,
        trainName: t.trainName,
        origin: t.origin,
        destination: t.destination,
        category: t.category,
        operatingDays: t.operatingDays
      }));
  }

  // --- 4. TRAIN DIRECTORY ---
  public getTrainDirectory(category?: string): any[] {
    let list = this.trains;
    if (category) {
      list = list.filter(t => t.category.toLowerCase().includes(category.toLowerCase()));
    }
    return list.map(t => ({
      trainNumber: t.trainNumber,
      trainName: t.trainName,
      category: t.category,
      speedType: t.speedType,
      origin: t.origin,
      destination: t.destination,
      operatingDays: t.operatingDays
    }));
  }

  // --- 5. STATION SEARCH & DIRECTORY ---
  public searchStations(query: string): any[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return this.stations.filter(
      s => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)
    );
  }

  public getStation(code: string): any | null {
    return this.stations.find(s => s.code === code.toUpperCase().trim()) || null;
  }

  public getAllStations(): any[] {
    return this.stations;
  }

  // --- 6. ROUTE PLANNING & TRAINS BETWEEN STATIONS ---
  public getTrainsBetween(from: string, to: string): any[] {
    const fromCode = from.toUpperCase().trim();
    const toCode = to.toUpperCase().trim();

    const matched = this.trains.filter(t => {
      const fromIdx = t.route.findIndex((h: any) => h.stationCode === fromCode);
      const toIdx = t.route.findIndex((h: any) => h.stationCode === toCode);
      return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
    });

    return matched.map(t => {
      const fromHalt = t.route.find((h: any) => h.stationCode === fromCode);
      const toHalt = t.route.find((h: any) => h.stationCode === toCode);
      const dist = Math.max(10, Math.abs(toHalt.distanceKm - fromHalt.distanceKm));
      const durHours = Math.floor(dist / 75);
      const durMins = Math.round((dist % 75) * 0.8);

      return {
        trainNumber: t.trainNumber,
        trainName: t.trainName,
        category: t.category,
        departureTime: fromHalt.scheduledDeparture,
        arrivalTime: toHalt.scheduledArrival,
        departurePlatform: fromHalt.platform || '1',
        duration: `${durHours}h ${durMins}m`,
        runningDays: t.operatingDays,
        classes: t.classes
      };
    });
  }

  public planRoutes(from: string, to: string, date: string): any {
    const direct = this.getTrainsBetween(from, to);
    const fromStation = this.getStation(from);
    const toStation = this.getStation(to);

    const routes = direct.map(d => ({
      type: 'Direct Route',
      trainNumber: d.trainNumber,
      trainName: d.trainName,
      departureStation: fromStation?.name || from,
      departureTime: d.departureTime,
      arrivalStation: toStation?.name || to,
      arrivalTime: d.arrivalTime,
      duration: d.duration,
      operatingDays: d.runningDays,
      classes: d.classes
    }));

    return {
      from,
      to,
      date,
      totalRoutesFound: routes.length,
      routes
    };
  }

  // --- 7. STATION LIVE DEPARTURES & SCHEDULE ---
  public getLiveDepartures(code: string): any {
    const stnCode = code.toUpperCase().trim();
    const station = this.getStation(stnCode);

    const departures = this.trains
      .filter(t => t.route.some((h: any) => h.stationCode === stnCode))
      .map(t => {
        const halt = t.route.find((h: any) => h.stationCode === stnCode);
        const delay = halt.delayDepartureMinutes || t.delayMinutes || 0;
        return {
          trainNumber: t.trainNumber,
          trainName: t.trainName,
          scheduledDeparture: halt.scheduledDeparture,
          expectedDeparture: halt.actualDeparture || halt.scheduledDeparture,
          delayMinutes: delay,
          platform: halt.platform || '1',
          status: delay === 0 ? 'On Time' : `Delayed ${delay}m`,
          destination: t.destination.name
        };
      });

    return {
      stationCode: stnCode,
      stationName: station?.name || stnCode,
      departures
    };
  }

  public getStationSchedule(code: string): any {
    const stnCode = code.toUpperCase().trim();
    const station = this.getStation(stnCode);

    const schedule = this.trains
      .filter(t => t.route.some((h: any) => h.stationCode === stnCode))
      .map(t => {
        const halt = t.route.find((h: any) => h.stationCode === stnCode);
        return {
          trainNumber: t.trainNumber,
          trainName: t.trainName,
          arrivalTime: halt.scheduledArrival,
          departureTime: halt.scheduledDeparture,
          platform: halt.platform || '1',
          origin: t.origin.name,
          destination: t.destination.name,
          days: t.operatingDays
        };
      });

    return {
      stationCode: stnCode,
      stationName: station?.name || stnCode,
      schedule
    };
  }

  // --- 8. COACH LAYOUT & PLATFORM POSITION ---
  public getCoachLayout(trainNumber: string): any | null {
    if (this.coachLayouts[trainNumber]) {
      return this.coachLayouts[trainNumber];
    }
    const train = this.trains.find(t => t.trainNumber === trainNumber);
    if (!train) return null;

    // Synthesize structured layout from classes
    const coaches: any[] = [];
    let pos = 1;
    for (const c of train.classes) {
      const code = c.startsWith('1') ? 'H1' : c.startsWith('2') ? 'A1' : c.startsWith('3') ? 'B1' : c.startsWith('C') ? 'C1' : 'S1';
      coaches.push({ coachCode: code, classType: c, capacity: 64, positionFromEngine: pos++ });
    }
    return {
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      rakeType: train.rakeType,
      totalCoaches: coaches.length + 2,
      fobAlignment: 'Center Foot Over Bridge (Aligns with Coach B1/A1)',
      coaches
    };
  }

  public getPlatformPosition(stationCode: string, trainNumber: string): any {
    const key = `${stationCode.toUpperCase()}_${trainNumber}`;
    if (this.platformPositions[key]) {
      return this.platformPositions[key];
    }
    const train = this.trains.find(t => t.trainNumber === trainNumber);
    const halt = train?.route.find((h: any) => h.stationCode === stationCode.toUpperCase());
    return {
      stationCode: stationCode.toUpperCase(),
      trainNumber,
      trainName: train?.trainName || `Train #${trainNumber}`,
      platform: halt?.platform || '1',
      scheduledArrival: halt?.scheduledArrival || '--',
      scheduledDeparture: halt?.scheduledDeparture || '--',
      alignmentScore: 'Optimal (Near central concourse)'
    };
  }

  // --- 9. RESERVATION INTELLIGENCE (PNR, Fares, Predictions, Refunds) ---
  public getPnrStatus(pnr: string): PnrStatusResult | null {
    const cleanPnr = pnr.trim();
    if (this.reservations.pnrs[cleanPnr]) {
      return this.reservations.pnrs[cleanPnr];
    }
    // Return structured simulated PNR for any 10-digit number
    if (/^\d{10}$/.test(cleanPnr)) {
      const train = this.trains[parseInt(cleanPnr.slice(-2), 10) % this.trains.length];
      const isCnf = parseInt(cleanPnr.slice(-1), 10) % 2 === 0;
      return {
        pnr: cleanPnr,
        trainNumber: train.trainNumber,
        trainName: train.trainName,
        journeyDate: '2026-10-28',
        fromStation: train.origin.code,
        toStation: train.destination.code,
        boardingStation: train.origin.code,
        classType: train.classes[0] || '3A',
        chartStatus: isCnf ? 'CHART PREPARED' : 'CHART NOT PREPARED',
        passengers: [
          {
            passengerIndex: 1,
            bookingStatus: isCnf ? 'CNF B2 34' : 'WL 12',
            currentStatus: isCnf ? 'CNF B2 34' : 'WL 5',
            confirmationChancePercent: isCnf ? 100 : 82
          }
        ]
      };
    }
    return null;
  }

  public calculateFare(distanceKm: number, classType: string): FareCalculationResult {
    const rules = this.reservations.fareRules[classType] || this.reservations.fareRules['3A'];
    const base = Math.round(distanceKm * rules.basePerKm);
    const res = rules.resCharge;
    const sf = rules.superfast;
    const subtotal = base + res + sf;
    const gst = Math.round(subtotal * rules.gstRate);
    const total = subtotal + gst;

    return {
      distanceKm,
      classType,
      baseFare: base,
      reservationCharge: res,
      superfastCharge: sf,
      gst,
      totalFare: total,
      breakdownNote: `Calculated with official IR rules (${rules.basePerKm}/km + ₹${res} res + ₹${sf} SF + ${rules.gstRate * 100}% GST)`
    };
  }

  public checkSeatAvailability(trainNumber: string, classType: string, date: string): SeatAvailabilityResult {
    const seed = (parseInt(trainNumber, 10) || 12000) + (date.length * 7);
    const isAvailable = seed % 3 !== 0;
    const seats = (seed % 45) + 1;

    return {
      trainNumber,
      classType,
      journeyDate: date,
      status: isAvailable ? `AVAILABLE ${seats}` : `WL ${seats % 20 + 1}`,
      seatsAvailable: isAvailable ? seats : 0,
      waitlistNumber: isAvailable ? 0 : (seats % 20 + 1),
      confirmationProbability: isAvailable ? 1.0 : Math.max(0.4, Number((1 - ((seats % 20) / 25)).toFixed(2))),
      lastUpdated: new Date().toISOString()
    };
  }

  public predictConfirmation(pnr: string, currentStatus: string, daysToDeparture: number): ConfirmationPredictionResult {
    const isCnf = currentStatus.toUpperCase().includes('CNF');
    if (isCnf) {
      return {
        pnr,
        currentStatus,
        predictedFinalStatus: 'CONFIRMED',
        probabilityPercent: 100,
        factors: ['Ticket already confirmed and allocated berth.']
      };
    }

    const wlNum = parseInt(currentStatus.replace(/\D/g, ''), 10) || 10;
    const prob = Math.max(20, Math.min(98, Math.round(100 - (wlNum * 4.2) + (daysToDeparture * 2.5))));

    return {
      pnr,
      currentStatus,
      predictedFinalStatus: prob > 70 ? 'CONFIRMED (RAC or Berth)' : 'WAITLISTED',
      probabilityPercent: prob,
      factors: [
        `Current queue position #${wlNum}`,
        `${daysToDeparture} days remaining until charting window`,
        'Historical cancellation velocity: ~8.4% per 24 hours'
      ]
    };
  }

  public calculateRefund(bookingStatus: string, hoursBeforeDeparture: number, totalFare: number, classType: string): RefundEstimationResult {
    let deduction = 0;
    let reason = '';

    if (bookingStatus.toUpperCase().includes('WL') || bookingStatus.toUpperCase().includes('WAIT')) {
      deduction = 60;
      reason = 'Standard clerkage fee of ₹60 for unconfirmed waitlist ticket.';
    } else if (hoursBeforeDeparture > 48) {
      const flatFees: Record<string, number> = { '1A': 240, '2A': 200, 'EC': 200, '3A': 180, 'CC': 180, 'SL': 120, '2S': 60 };
      deduction = flatFees[classType] || 180;
      reason = `Flat cancellation fee for cancellation >48h before departure (${classType}: ₹${deduction}).`;
    } else if (hoursBeforeDeparture >= 12) {
      deduction = Math.round(totalFare * 0.25);
      reason = '25% deduction applied for cancellation between 48h and 12h before departure.';
    } else if (hoursBeforeDeparture >= 4) {
      deduction = Math.round(totalFare * 0.50);
      reason = '50% deduction applied for cancellation within charting window (12h to 4h before departure).';
    } else {
      deduction = totalFare;
      reason = 'No refund permissible for cancellation within 4h of departure.';
    }

    const refundable = Math.max(0, totalFare - deduction);

    return {
      totalFare,
      deductionAmount: deduction,
      refundableAmount: refundable,
      deductionReason: reason,
      irRulesReference: 'Indian Railways (Ticket Cancellation and Refund of Fare) Rules 2015'
    };
  }

  // --- 10. SUBURBAN & FREIGHT & DIRECTORIES ---
  public getSuburbanData(city?: string): any {
    if (city) {
      const filtered = this.suburban.timetables.filter((t: any) => t.city.toLowerCase() === city.toLowerCase());
      return { cities: this.suburban.cities, timetables: filtered };
    }
    return this.suburban;
  }

  public getFreightData(): any[] {
    return this.freight;
  }

  public getDelayHistory(trainNumber?: string): any[] {
    if (trainNumber) {
      return this.delayHistory.filter(d => d.trainNumber === trainNumber);
    }
    return this.delayHistory;
  }

  public getDisruptions(): any[] {
    return this.disruptions;
  }

  // --- 11. MOCK PROVIDER TEST CONSOLE (API-shaped realistic responses) ---
  public executeMockProviderCall(
    endpointId: string,
    params: Record<string, any> = {},
    simulatedStatusCode: number = 200
  ): MockProviderResult {
    this.mockRequestCount++;
    const startTime = Date.now();
    const traceId = `mock-prov-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Simulated local duration (15ms - 45ms)
    const simulatedLatencyMs = 20 + (Math.floor(Math.random() * 25));

    // Handle forced error status codes for demonstrations
    if (simulatedStatusCode === 404) {
      return {
        ok: false,
        status: 404,
        error: 'Requested railway entity was not found in provider lookup.',
        meta: {
          endpointId,
          endpointPath: `/v1/mock/${endpointId.toLowerCase()}`,
          httpMethod: 'GET',
          params,
          measuredDurationMs: simulatedLatencyMs,
          traceId,
          source: 'SIMULATED_PROVIDER_RESPONSE',
          isCached: false,
          providerHealth: 'ONLINE_EMULATED'
        }
      };
    }

    if (simulatedStatusCode === 429) {
      return {
        ok: false,
        status: 429,
        error: 'Provider Rate Limit Exceeded (Simulated upstream 10 req/min throttle).',
        meta: {
          endpointId,
          endpointPath: `/v1/mock/${endpointId.toLowerCase()}`,
          httpMethod: 'GET',
          params,
          measuredDurationMs: simulatedLatencyMs,
          traceId,
          source: 'SIMULATED_PROVIDER_RESPONSE',
          isCached: false,
          providerHealth: 'ONLINE_EMULATED'
        }
      };
    }

    if (simulatedStatusCode === 503) {
      return {
        ok: false,
        status: 503,
        error: 'Simulated Upstream Provider Outage (Service Temporarily Unavailable).',
        meta: {
          endpointId,
          endpointPath: `/v1/mock/${endpointId.toLowerCase()}`,
          httpMethod: 'GET',
          params,
          measuredDurationMs: simulatedLatencyMs,
          traceId,
          source: 'UNAVAILABLE',
          isCached: false,
          providerHealth: 'SIMULATED_OUTAGE'
        }
      };
    }

    // Realistic API-shaped payload according to endpoint
    let payload: any = null;
    const trainNumber = params.trainNumber || params.number || '12951';
    const stationCode = params.stationCode || params.code || 'NDLS';

    switch (endpointId) {
      case 'TRAIN_LIVE_STATUS': {
        const live = this.getLiveTrainStatus(trainNumber);
        payload = live ? live.status : null;
        break;
      }
      case 'TRAIN_DETAILS': {
        const det = this.getTrainDetail(trainNumber);
        payload = det ? det.detail : null;
        break;
      }
      case 'TRAIN_TIMETABLE_HALTS': {
        const train = this.trains.find(t => t.trainNumber === trainNumber);
        payload = train ? { trainNumber, trainName: train.trainName, route: train.route } : null;
        break;
      }
      case 'TRAIN_SEARCH': {
        payload = this.searchTrains(params.query || '129');
        break;
      }
      case 'STATION_DETAILS': {
        payload = this.getStation(stationCode);
        break;
      }
      case 'LIVE_DEPARTURES': {
        payload = this.getLiveDepartures(stationCode);
        break;
      }
      case 'TRAINS_BETWEEN_STATIONS': {
        payload = this.getTrainsBetween(params.from || 'MMCT', params.to || 'NDLS');
        break;
      }
      case 'PNR_STATUS': {
        payload = this.getPnrStatus(params.pnr || '8421100001');
        break;
      }
      default: {
        payload = {
          endpointId,
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
          emulatedPayload: {
            serviceType: 'RailSync Mock Provider',
            paramsGiven: params,
            recordsReturned: 1
          }
        };
      }
    }

    return {
      ok: true,
      status: 200,
      data: payload,
      meta: {
        endpointId,
        endpointPath: `/v1/mock/${endpointId.toLowerCase()}`,
        httpMethod: 'GET',
        params,
        measuredDurationMs: simulatedLatencyMs,
        traceId,
        source: 'SIMULATED_PROVIDER_RESPONSE',
        isCached: false,
        providerHealth: 'ONLINE_EMULATED'
      }
    };
  }
}
