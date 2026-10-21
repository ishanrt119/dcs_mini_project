import { ApiResponse, LiveTrainStatus, QuotaStatus, ServiceHealthMetric, StationSummary } from './types';

const BASE_URL = '/api';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const resp = await fetch(url, options);
  const data = await resp.json();
  return data;
}

export const Api = {
  // System & Health
  async getClusterHealth() {
    return fetchJson<{ clusterStatus: string; services: ServiceHealthMetric[] }>(`${BASE_URL}/system/health`);
  },
  async getQuota() {
    return fetchJson<QuotaStatus & { budgetManagerPolicy: any }>(`${BASE_URL}/system/quota`);
  },
  async setMode(demoMode?: boolean, liveApiEnabled?: boolean) {
    return fetchJson<QuotaStatus>(`${BASE_URL}/system/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demoMode, liveApiEnabled })
    });
  },
  async simulateOutage(serviceId: string, fail: boolean) {
    return fetchJson<any>(`${BASE_URL}/system/simulate-outage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId, fail })
    });
  },
  async getSavedTrains() {
    return fetchJson<Array<{ train_number: string; train_name: string; notes: string; added_at: string }>>(`${BASE_URL}/system/saved-trains`);
  },
  async saveTrain(trainNumber: string, trainName: string, notes?: string) {
    return fetchJson<any>(`${BASE_URL}/system/saved-trains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainNumber, trainName, notes })
    });
  },
  async removeSavedTrain(trainNumber: string) {
    return fetchJson<any>(`${BASE_URL}/system/saved-trains/${trainNumber}`, { method: 'DELETE' });
  },
  async invokeRpc(method: string, params?: any) {
    return fetchJson<any>(`${BASE_URL}/system/rpc-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, params })
    });
  },
  async getOverview() {
    return fetchJson<any>(`${BASE_URL}/overview`);
  },

  // Train Intelligence
  async getLiveStatus(trainNumber: string, options?: { date?: string; authoritative?: boolean }) {
    const params = new URLSearchParams();
    if (options?.date) params.set('date', options.date);
    if (options?.authoritative) params.set('authoritative', 'true');
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<LiveTrainStatus>(`${BASE_URL}/trains/${trainNumber}/live${queryStr}`);
  },
  async getTrainDetails(trainNumber: string) {
    return fetchJson<any>(`${BASE_URL}/trains/${trainNumber}`);
  },
  async getTimetable(trainNumber: string) {
    return fetchJson<any>(`${BASE_URL}/trains/${trainNumber}/timetable`);
  },
  async getGeometry(trainNumber: string) {
    return fetchJson<any>(`${BASE_URL}/trains/${trainNumber}/geometry`);
  },
  async getCoachLayout(trainNumber: string) {
    return fetchJson<any>(`${BASE_URL}/trains/${trainNumber}/coach-layout`);
  },
  async getPlatformPositions(trainNumber: string) {
    return fetchJson<any>(`${BASE_URL}/trains/${trainNumber}/platform-positions`);
  },
  async searchTrains(query: string) {
    return fetchJson<any[]>(`${BASE_URL}/trains/search?query=${encodeURIComponent(query)}`);
  },
  async getTrainDirectory(category?: string) {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return fetchJson<any[]>(`${BASE_URL}/trains${q}`);
  },
  async getTrainCategories() {
    return fetchJson<string[]>(`${BASE_URL}/trains/categories`);
  },
  async getSpeedTypes() {
    return fetchJson<any[]>(`${BASE_URL}/trains/speed-types`);
  },
  async getPrsTrains() {
    return fetchJson<any[]>(`${BASE_URL}/trains/prs`);
  },
  async getNtesTrains() {
    return fetchJson<any[]>(`${BASE_URL}/trains/ntes`);
  },
  async getCompressedTrains() {
    return fetchJson<any>(`${BASE_URL}/trains/compressed`);
  },
  async getTrainsKvs() {
    return fetchJson<Record<string, string>>(`${BASE_URL}/trains/kvs`);
  },

  // Journey Planning
  async planRoute(from: string, to: string, date?: string) {
    return fetchJson<any>(`${BASE_URL}/routes/plan?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date || ''}`);
  },
  async getTrainsBetween(from: string, to: string, date?: string) {
    return fetchJson<any>(`${BASE_URL}/trains/between?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date || ''}`);
  },
  async searchStations(query: string) {
    return fetchJson<StationSummary[]>(`${BASE_URL}/stations/search?query=${encodeURIComponent(query)}`);
  },
  async getStationDetails(code: string) {
    return fetchJson<StationSummary>(`${BASE_URL}/stations/${code}`);
  },
  async getStationSchedule(code: string) {
    return fetchJson<any>(`${BASE_URL}/stations/${code}/schedule`);
  },
  async getLiveDepartures(code: string) {
    return fetchJson<any>(`${BASE_URL}/stations/${code}/live-departures`);
  },
  async getStationDirectory() {
    return fetchJson<StationSummary[]>(`${BASE_URL}/stations`);
  },
  async getSuburbanTimetables(city?: string) {
    const q = city ? `?city=${encodeURIComponent(city)}` : '';
    return fetchJson<any[]>(`${BASE_URL}/suburban/timetables${q}`);
  },
  async getSuburbanCities() {
    return fetchJson<any[]>(`${BASE_URL}/suburban/cities`);
  },
  async getStationsKvs() {
    return fetchJson<Record<string, string>>(`${BASE_URL}/stations/kvs`);
  },

  // Reservation Intelligence
  async checkSeatAvailability(params: { train: string; from: string; to: string; date: string; class: string; quota: string }) {
    const q = new URLSearchParams(params as any).toString();
    return fetchJson<any>(`${BASE_URL}/reservation/availability?${q}`);
  },
  async calculateFare(params: { train: string; from: string; to: string }) {
    const q = new URLSearchParams(params).toString();
    return fetchJson<any>(`${BASE_URL}/reservation/fare?${q}`);
  },
  async getPnrStatus(pnr: string) {
    return fetchJson<any>(`${BASE_URL}/pnr/${pnr}`);
  },
  async getConfirmationPrediction(params: { train: string; class: string; waitlistNumber: number; date: string }) {
    const q = new URLSearchParams(params as any).toString();
    return fetchJson<any>(`${BASE_URL}/pnr/prediction?${q}`);
  },
  async getRefundEstimation(params: { ticketAmount: number; class: string; hoursBeforeDeparture: number; status: string }) {
    const q = new URLSearchParams(params as any).toString();
    return fetchJson<any>(`${BASE_URL}/reservation/refund-rules?${q}`);
  },

  // Analytics & Disruption Simulation
  async getDelayTrend(trainNumber: string) {
    return fetchJson<any>(`${BASE_URL}/analytics/trains/${trainNumber}/trend`);
  },
  async getSnapshots(trainNumber: string) {
    return fetchJson<any[]>(`${BASE_URL}/analytics/trains/${trainNumber}/snapshots`);
  },
  async getIncidents() {
    return fetchJson<any[]>(`${BASE_URL}/analytics/incidents`);
  },
  async simulateDisruption(data: { stationCode: string; disruptionType: string; severityHours: number; affectedCorridor: string }) {
    return fetchJson<any>(`${BASE_URL}/analytics/simulate-disruption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },
  async getFreightTrains() {
    return fetchJson<any[]>(`${BASE_URL}/network/freight`);
  },
  async getMapFeed() {
    return fetchJson<any[]>(`${BASE_URL}/network/map-feed`);
  },
  async executeMockProviderCall(endpointId: string, params?: Record<string, any>, simulatedStatus: number = 200) {
    return fetchJson<any>(`${BASE_URL}/system/mock-provider-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpointId, params, simulatedStatus })
    });
  }
};
