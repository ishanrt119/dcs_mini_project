// RailSync Quota & Cache Manager
// Strictly enforces RailRadar 100-request monthly limit, 80-request internal budget, TTL caching & in-flight deduplication.

import { QuotaStatus, DataSourceLabel } from './types.js';
import { API_REGISTRY, ApiRegistryEntry } from './registry.js';
import { QuotaRepository } from '../data/db/index.js';

interface CacheItem<T> {
  data: T;
  cachedAt: string;
  expiresAt: number;
}

export class QuotaCacheManager {
  private static instance: QuotaCacheManager;

  // Configuration
  private monthlyLimit: number = parseInt(process.env.RAILRADAR_MONTHLY_LIMIT || '100', 10);
  private internalBudget: number = parseInt(process.env.RAILRADAR_INTERNAL_BUDGET || '80', 10);
  private emergencyBuffer: number = 20;

  // In-flight deduplication map: key -> active Promise
  private inFlightRequests: Map<string, Promise<any>> = new Map();

  // In-memory cache store
  private cache: Map<string, CacheItem<any>> = new Map();

  // Cache hit/miss counters
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  private constructor() {
    this.emergencyBuffer = this.monthlyLimit - this.internalBudget;
  }

  public static getInstance(): QuotaCacheManager {
    if (!QuotaCacheManager.instance) {
      QuotaCacheManager.instance = new QuotaCacheManager();
    }
    return QuotaCacheManager.instance;
  }

  public isDemoMode(): boolean {
    return process.env.DEMO_MODE !== 'false';
  }

  public isLiveApiEnabled(): boolean {
    return process.env.LIVE_API_ENABLED === 'true';
  }

  public setLiveApiEnabled(enabled: boolean) {
    process.env.LIVE_API_ENABLED = enabled ? 'true' : 'false';
  }

  public setDemoMode(demo: boolean) {
    process.env.DEMO_MODE = demo ? 'true' : 'false';
  }

  public getNextResetDate(): string {
    const now = new Date();
    // Next month 1st at 00:00:00 IST
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }

  public getQuotaStatus(): QuotaStatus {
    const metrics = QuotaRepository.getMonthlyMetrics();
    const used = metrics.totalOutboundAttempts;
    const remainingBudget = Math.max(0, this.internalBudget - used);
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRatio = totalRequests > 0 ? Number((this.cacheHits / totalRequests).toFixed(2)) : 1.0;

    return {
      monthlyLimit: this.monthlyLimit,
      internalBudget: this.internalBudget,
      usedThisMonth: used,
      remainingBudget,
      emergencyBuffer: this.emergencyBuffer,
      liveCallsEnabled: this.isLiveApiEnabled(),
      demoMode: this.isDemoMode(),
      resetDate: this.getNextResetDate(),
      cacheHitRatio: hitRatio,
      totalCacheHits: this.cacheHits,
      totalCacheMisses: this.cacheMisses
    };
  }

  /**
   * Pre-flight policy check before making ANY outbound call to RailRadar
   */
  public verifyOutboundPermission(endpointId: string): { allowed: boolean; reason?: string; status: QuotaStatus } {
    const status = this.getQuotaStatus();

    // Rule 1: Refuse if demo mode is active
    if (this.isDemoMode()) {
      return {
        allowed: false,
        reason: 'DEMO_MODE is active. RailSync is configured to serve deterministic local mock data to protect quota.',
        status
      };
    }

    // Rule 2: Refuse if live API is disabled
    if (!this.isLiveApiEnabled()) {
      return {
        allowed: false,
        reason: 'LIVE_API_ENABLED is false. Explicit administrative enablement is required before outbound requests.',
        status
      };
    }

    // Rule 3: Refuse if no API key is set
    const apiKey = process.env.RAILRADAR_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_RAILRADAR_API_KEY') {
      return {
        allowed: false,
        reason: 'RAILRADAR_API_KEY is not configured in backend environment.',
        status
      };
    }

    // Rule 4: Verify internal monthly budget
    if (status.usedThisMonth >= this.internalBudget) {
      return {
        allowed: false,
        reason: `Monthly safe budget (${this.internalBudget} requests) exhausted. ${this.emergencyBuffer} requests held in emergency buffer.`,
        status
      };
    }

    // Rule 5: Verify endpoint exists in registry
    const registryEntry = API_REGISTRY.find(e => e.id === endpointId);
    if (!registryEntry) {
      return {
        allowed: false,
        reason: `Endpoint ID "${endpointId}" is not cataloged in official API registry. Outbound call rejected.`,
        status
      };
    }

    return { allowed: true, status };
  }

  /**
   * Get cached data if valid and unexpired
   */
  public getCached<T>(key: string): { hit: boolean; data?: T; cachedAt?: string; ttlRemainingSec?: number } {
    const item = this.cache.get(key);
    if (!item) {
      this.cacheMisses++;
      return { hit: false };
    }

    const now = Date.now();
    if (now > item.expiresAt) {
      this.cache.delete(key);
      this.cacheMisses++;
      return { hit: false };
    }

    this.cacheHits++;
    const ttlRemainingSec = Math.max(0, Math.round((item.expiresAt - now) / 1000));
    return {
      hit: true,
      data: item.data as T,
      cachedAt: item.cachedAt,
      ttlRemainingSec
    };
  }

  /**
   * Store data in TTL cache
   */
  public setCached<T>(key: string, data: T, ttlSeconds: number) {
    const now = Date.now();
    this.cache.set(key, {
      data,
      cachedAt: new Date().toISOString(),
      expiresAt: now + ttlSeconds * 1000
    });
  }

  /**
   * Deduplicates simultaneous in-flight requests for the same cache key
   */
  public async executeWithDeduplication<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.inFlightRequests.has(key)) {
      // In-flight identical request found! Await existing promise
      return this.inFlightRequests.get(key) as Promise<T>;
    }

    const promise = fn().finally(() => {
      this.inFlightRequests.delete(key);
    });

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  /**
   * Audit log outbound attempts
   */
  public recordOutboundLog(endpointId: string, endpointPath: string, queryId: string, responseStatus: number, durationMs: number) {
    QuotaRepository.logRequest({
      endpointId,
      endpointPath,
      queryIdentifier: queryId,
      responseStatus,
      isCached: false,
      durationMs
    });
  }

  /**
   * Audit log cache hits
   */
  public recordCacheHitLog(endpointId: string, endpointPath: string, queryId: string) {
    QuotaRepository.logRequest({
      endpointId,
      endpointPath,
      queryIdentifier: queryId,
      responseStatus: 200,
      isCached: true,
      durationMs: 1.5
    });
  }
}
