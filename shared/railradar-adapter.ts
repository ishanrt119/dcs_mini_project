// RailSync Offline Adapter
// Provides simulated provider-shaped responses backed entirely by local demo data.
// Zero outbound network calls to external APIs.

import { QuotaCacheManager } from './quota-cache-manager.js';
import { DemoRailwayAdapter } from './demo-railway-adapter.js';
import { LiveTrainStatus, HaltInfo, TrainDetail, DataSourceLabel } from './types.js';

export class RailRadarAdapter {
  private static instance: RailRadarAdapter;
  private quotaManager: QuotaCacheManager;
  private demoAdapter: DemoRailwayAdapter;

  private constructor() {
    this.quotaManager = QuotaCacheManager.getInstance();
    this.demoAdapter = DemoRailwayAdapter.getInstance();
  }

  public static getInstance(): RailRadarAdapter {
    if (!RailRadarAdapter.instance) {
      RailRadarAdapter.instance = new RailRadarAdapter();
    }
    return RailRadarAdapter.instance;
  }

  /**
   * Offline Provider Simulation: Returns realistic API-shaped responses from local fixtures.
   * Completely offline: no network sockets opened to external hosts.
   */
  public async callProvider<T = any>(
    endpointId: string,
    endpointPath: string,
    queryIdentifier: string,
    searchParams?: Record<string, string | boolean | number | undefined>,
    timeoutMs: number = 7000
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string; providerRemaining?: number }> {
    this.quotaManager.recordMockRequest();
    const mockRes = this.demoAdapter.executeMockProviderCall(endpointId, {
      ...searchParams,
      queryIdentifier,
      path: endpointPath
    });

    return {
      ok: mockRes.ok,
      status: mockRes.status,
      data: mockRes.data as T,
      error: mockRes.error,
      providerRemaining: undefined
    };
  }

  /**
   * Normalizes live train status from simulated fixture to standard LiveTrainStatus
   */
  public normalizeLiveTrainStatus(raw: any, trainNumber: string, requestedDate: string): LiveTrainStatus {
    const d = raw?.data !== undefined ? raw.data : raw;
    const resolvedTrainNum = String(d?.trainNumber || d?.train?.number || trainNumber).trim();
    const resolvedTrainName = d?.trainName || d?.train?.name || `Express #${resolvedTrainNum}`;
    const startDate = d?.startDate || requestedDate;
    const lastUpdatedAt = d?.lastUpdatedAt || new Date().toISOString();

    const delayMinutes = typeof d?.delayMinutes === 'number'
      ? d.delayMinutes
      : typeof d?.currentLocation?.delayMinutes === 'number'
        ? d.currentLocation.delayMinutes
        : 0;

    let status = d?.status || 'Running';
    const currentSpeedKmph = typeof d?.currentSpeedKmph === 'number' ? d.currentSpeedKmph : 0;
    const currLoc = d?.currentLocation || {};
    const currentLocation = {
      stationCode: currLoc.stationCode || 'NDLS',
      stationName: currLoc.stationName || 'Current Station',
      distanceFromOriginKm: currLoc.distanceFromOriginKm || 0,
      lat: currLoc.lat,
      lng: currLoc.lng
    };

    const route: HaltInfo[] = Array.isArray(d?.route)
      ? d.route.map((h: any) => ({
          stationCode: h.stationCode,
          stationName: h.stationName,
          scheduledArrival: h.scheduledArrival || '--',
          scheduledDeparture: h.scheduledDeparture || '--',
          actualArrival: h.actualArrival,
          actualDeparture: h.actualDeparture,
          delayArrivalMinutes: typeof h.delayArrivalMinutes === 'number' ? h.delayArrivalMinutes : 0,
          delayDepartureMinutes: typeof h.delayDepartureMinutes === 'number' ? h.delayDepartureMinutes : 0,
          distanceKm: typeof h.distanceKm === 'number' ? h.distanceKm : 0,
          dayNumber: typeof h.dayNumber === 'number' ? h.dayNumber : 1,
          platform: h.platform ? String(h.platform) : '1',
          hasDeparted: !!h.hasDeparted,
          isCurrent: !!h.isCurrent
        }))
      : [];

    return {
      trainNumber: resolvedTrainNum,
      trainName: resolvedTrainName,
      startDate,
      lastUpdatedAt,
      status,
      delayMinutes,
      currentSpeedKmph,
      currentLocation,
      route,
      isLive: true,
      exceptions: d?.exceptions || []
    };
  }

  /**
   * Normalizes train details
   */
  public normalizeTrainDetail(raw: any, trainNumber: string): TrainDetail {
    const d = raw?.data?.train || raw?.train || raw?.data || raw;
    const num = String(d?.number || d?.trainNumber || trainNumber).trim();
    const name = d?.name || d?.trainName || `Train #${num}`;

    return {
      trainNumber: num,
      trainName: name,
      category: d?.category || d?.type || 'Express',
      speedType: d?.speedType || (d?.maxSpeed >= 130 ? 'Superfast Premium' : 'Express'),
      origin: d?.origin || d?.source?.name || d?.source?.code || 'Origin',
      destination: d?.destination || d?.dest?.name || d?.dest?.code || 'Destination',
      totalDistanceKm: d?.distance || d?.totalDistanceKm || 0,
      totalDurationMinutes: d?.duration || d?.totalDurationMinutes || 0,
      operatingDays: Array.isArray(d?.operatingDays)
        ? d.operatingDays
        : ['Daily'],
      classes: d?.classes || ['1A', '2A', '3A', 'SL'],
      pantryAvailable: d?.pantryAvailable !== undefined ? d.pantryAvailable : true,
      rakeType: d?.rakeType || 'LHB'
    };
  }

  /**
   * Normalizes train search autocomplete results
   */
  public normalizeTrainSearch(raw: any): any[] {
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    return list.map((item: any) => ({
      trainNumber: String(item.number || item.trainNumber || '').trim(),
      trainName: item.name || item.trainName || '',
      origin: item.sourceName || item.source || item.origin || '',
      destination: item.destName || item.dest || item.destination || '',
      category: item.category || item.type || 'Express'
    }));
  }

  /**
   * Normalizes station search autocomplete results
   */
  public normalizeStationSearch(raw: any): any[] {
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    return list.map((item: any) => ({
      stationCode: item.code || item.stationCode || '',
      stationName: item.name || item.stationName || '',
      city: item.city || '',
      state: item.state || 'India',
      zone: item.zone || 'NR',
      category: item.category || 'Major Junction',
      platforms: item.platforms || 6,
      electrified: true,
      lat: item.lat || 28.6139,
      lng: item.lng || 77.2090
    }));
  }

  /**
   * Normalizes trains between stations results
   */
  public normalizeTrainsBetween(raw: any): any[] {
    const data = raw?.data !== undefined ? raw.data : raw;
    const list = Array.isArray(data?.trains) ? data.trains : Array.isArray(data) ? data : [];
    return list.map((item: any) => ({
      trainNumber: String(item?.number || item?.trainNumber || '').trim(),
      trainName: item?.name || item?.trainName || '',
      category: item?.category || item?.type || 'Express',
      departureTime: item?.departureTime || item?.scheduledDeparture || '--',
      arrivalTime: item?.arrivalTime || item?.scheduledArrival || '--',
      departurePlatform: item?.departurePlatform ? String(item.departurePlatform) : '1',
      duration: item?.duration || '--',
      runningDays: item?.runningDays || item?.operatingDays || ['Daily'],
      classes: item?.classes || ['1A', '2A', '3A', 'SL']
    }));
  }
}
