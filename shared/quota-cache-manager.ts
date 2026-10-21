// RailSync Quota & Cache Manager - Offline Demo Mode
// Strictly prevents outbound calls to external APIs.
// Distinguishes local fixture / mock requests from outbound provider requests (always 0).

import { QuotaStatus, DataSourceLabel } from './types.js';
import { API_REGISTRY, ApiRegistryEntry } from './registry.js';
import { QuotaRepository, SystemConfigRepository } from '../data/db/index.js';

interface CacheItem<T> {
  data: T;
  cachedAt: string;
  expiresAt: number;
}

export class QuotaCacheManager {
  private static instance: QuotaCacheManager;

  // Configuration
  private monthlyLimit: number = 100;
  private internalBudget: number = 80;
  private emergencyBuffer: number = 20;

  // Provider access status (permanently disabled in offline demo mode)
  private providerRemaining: number | null = null;
  private mockRequestCount: number = 0;

  // Recent outbound call timestamps for per-minute throttle
  private recentOutboundTimestamps: number[] = [];

  // In-flight deduplication map: key -> active Promise
  private inFlightRequests: Map<string, Promise<any>> = new Map();

  // In-memory cache store
  private cache: Map<string, CacheItem<any>> = new Map();

  // Cache hit/miss counters
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  private constructor() {
    this.emergencyBuffer = this.monthlyLimit - this.internalBudget;
    // Always persist offline demo mode in SQLite
    try {
      SystemConfigRepository.set('DEMO_MODE', 'true');
      SystemConfigRepository.set('LIVE_API_ENABLED', 'false');
    } catch {
      // ignore during early init
    }
  }

  public static getInstance(): QuotaCacheManager {
    if (!QuotaCacheManager.instance) {
      QuotaCacheManager.instance = new QuotaCacheManager();
    }
    return QuotaCacheManager.instance;
  }

  public isDemoMode(): boolean {
    return true; // Permanent offline demo mode
  }

  public isLiveApiEnabled(): boolean {
    return false; // Permanent offline mode - external calls prohibited
  }

  public setLiveApiEnabled(enabled: boolean) {
    // Prohibit re-activation: permanent offline mode
    process.env.LIVE_API_ENABLED = 'false';
    SystemConfigRepository.set('LIVE_API_ENABLED', 'false');
    process.env.DEMO_MODE = 'true';
    SystemConfigRepository.set('DEMO_MODE', 'true');
  }

  public setDemoMode(demo: boolean) {
    process.env.DEMO_MODE = 'true';
    SystemConfigRepository.set('DEMO_MODE', 'true');
  }

  public setProviderRemainingQuota(remaining: number) {
    // No-op in offline mode (do not fabricate)
    this.providerRemaining = null;
  }

  public getProviderRemainingQuota(): number | null {
    return null; // Do not fabricate upstream quota
  }

  public getNextResetDate(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }

  public recordMockRequest() {
    this.mockRequestCount++;
  }

  public getQuotaStatus(): QuotaStatus {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRatio = totalRequests > 0 ? Number((this.cacheHits / totalRequests).toFixed(2)) : 1.0;

    return {
      monthlyLimit: this.monthlyLimit,
      internalBudget: this.internalBudget,
      usedThisMonth: 0, // Actual provider requests made by this application must remain zero
      actualOutboundCalls: 0,
      mockProviderCalls: this.mockRequestCount,
      providerAccessDisabled: true,
      remainingBudget: this.internalBudget,
      emergencyBuffer: this.emergencyBuffer,
      liveCallsEnabled: false,
      demoMode: true,
      apiKeyConfigured: false,
      resetDate: this.getNextResetDate(),
      cacheHitRatio: hitRatio,
      totalCacheHits: this.cacheHits,
      totalCacheMisses: this.cacheMisses,
      providerRemainingQuota: undefined // Do not fabricate
    };
  }

  /**
   * Pre-flight policy check before making ANY outbound call.
   * In offline demo mode, this ALWAYS refuses outbound requests to guarantee 0 external calls.
   */
  public verifyOutboundPermission(endpointId: string): { allowed: boolean; reason?: string; status: QuotaStatus } {
    const status = this.getQuotaStatus();
    return {
      allowed: false,
      reason: 'DEMO_MODE is active. RailSync is configured to serve deterministic local mock data to protect quota.',
      status
    };
  }

  // --- In-Memory TTL Cache ---
  public getCached<T>(key: string): { hit: boolean; data?: T; ttlRemainingSec?: number } {
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
    const ttlRemainingSec = Math.max(0, Math.floor((item.expiresAt - now) / 1000));
    return { hit: true, data: item.data as T, ttlRemainingSec };
  }

  public setCached<T>(key: string, data: T, ttlSeconds: number) {
    const now = Date.now();
    this.cache.set(key, {
      data,
      cachedAt: new Date(now).toISOString(),
      expiresAt: now + (ttlSeconds * 1000)
    });
  }

  public clearCache() {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Deduplicates simultaneous in-flight requests for the same cache key
   */
  public async executeWithDeduplication<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as Promise<T>;
    }

    const promise = fn().finally(() => {
      this.inFlightRequests.delete(key);
    });

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  /**
   * Audit log outbound attempts (kept for mock / simulated calls)
   */
  public recordOutboundLog(endpointId: string, endpointPath: string, queryId: string, responseStatus: number, durationMs: number) {
    this.recentOutboundTimestamps.push(Date.now());
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
