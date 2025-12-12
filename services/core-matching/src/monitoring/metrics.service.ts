import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

/**
 * Metrics Service using Prometheus
 * Implements Google SRE Golden Signals + Custom Business Metrics
 *
 * Golden Signals:
 * 1. Latency - How long requests take
 * 2. Traffic - How many requests
 * 3. Errors - Error rate
 * 4. Saturation - Resource utilization
 */

@Injectable()
export class MetricsService {
  private readonly registry: Registry;

  // HTTP Metrics (Golden Signal: Traffic & Latency)
  private readonly httpRequestsTotal: Counter;
  private readonly httpRequestDuration: Histogram;

  // Matching Algorithm Metrics
  private readonly matchingRequestsTotal: Counter;
  private readonly matchingDuration: Histogram;
  private readonly matchingResultsSize: Histogram;
  private readonly matchingFallbacksTotal: Counter;

  // Cache Metrics (Golden Signal: Saturation)
  private readonly cacheHitsTotal: Counter;
  private readonly cacheMissesTotal: Counter;
  private readonly cacheSize: Gauge;

  // Database Metrics
  private readonly dbQueryDuration: Histogram;
  private readonly dbConnectionPoolSize: Gauge;

  // Business Metrics
  private readonly contractorsAvailable: Gauge;
  private readonly contractorsBySpecialty: Gauge;
  private readonly averageMatchScore: Histogram;

  constructor() {
    this.registry = new Registry();

    // HTTP Metrics
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request latency in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    // Matching Metrics
    this.matchingRequestsTotal = new Counter({
      name: 'matching_requests_total',
      help: 'Total number of contractor matching requests',
      labelNames: ['trade', 'severity', 'success'],
      registers: [this.registry],
    });

    this.matchingDuration = new Histogram({
      name: 'matching_duration_seconds',
      help: 'Time to complete contractor matching',
      labelNames: ['trade', 'used_fallback'],
      buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2],
      registers: [this.registry],
    });

    this.matchingResultsSize = new Histogram({
      name: 'matching_results_size',
      help: 'Number of contractors returned per match',
      labelNames: ['trade'],
      buckets: [0, 1, 5, 10, 20, 50],
      registers: [this.registry],
    });

    this.matchingFallbacksTotal = new Counter({
      name: 'matching_fallbacks_total',
      help: 'Number of times fallback matching was used',
      labelNames: ['reason'],
      registers: [this.registry],
    });

    // Cache Metrics
    this.cacheHitsTotal = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.cacheMissesTotal = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.cacheSize = new Gauge({
      name: 'cache_size_bytes',
      help: 'Current cache size in bytes',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    // Database Metrics
    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Database query execution time',
      labelNames: ['query_type'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });

    this.dbConnectionPoolSize = new Gauge({
      name: 'db_connection_pool_size',
      help: 'Number of active database connections',
      registers: [this.registry],
    });

    // Business Metrics
    this.contractorsAvailable = new Gauge({
      name: 'contractors_available',
      help: 'Number of available contractors',
      labelNames: ['specialty'],
      registers: [this.registry],
    });

    this.contractorsBySpecialty = new Gauge({
      name: 'contractors_by_specialty',
      help: 'Total contractors by specialty',
      labelNames: ['specialty'],
      registers: [this.registry],
    });

    this.averageMatchScore = new Histogram({
      name: 'average_match_score',
      help: 'Distribution of match scores',
      labelNames: ['trade'],
      buckets: [0, 20, 40, 60, 80, 100],
      registers: [this.registry],
    });

    // Set default metric collection
    this.registry.setDefaultLabels({
      service: 'core-matching',
      environment: process.env.NODE_ENV || 'development',
    });
  }

  // ========================================================================
  // HTTP METRICS
  // ========================================================================

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number
  ): void {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });

    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      durationMs / 1000
    );
  }

  // ========================================================================
  // MATCHING METRICS
  // ========================================================================

  recordMatchingRequest(
    trade: string,
    severity: string,
    success: boolean,
    durationMs: number,
    usedFallback: boolean,
    resultCount: number
  ): void {
    this.matchingRequestsTotal.inc({
      trade,
      severity,
      success: success.toString(),
    });

    this.matchingDuration.observe(
      { trade, used_fallback: usedFallback.toString() },
      durationMs / 1000
    );

    this.matchingResultsSize.observe({ trade }, resultCount);

    if (usedFallback) {
      this.matchingFallbacksTotal.inc({ reason: 'algorithm_failure' });
    }
  }

  recordMatchScore(trade: string, score: number): void {
    this.averageMatchScore.observe({ trade }, score);
  }

  // ========================================================================
  // CACHE METRICS
  // ========================================================================

  recordCacheHit(cacheType: string): void {
    this.cacheHitsTotal.inc({ cache_type: cacheType });
  }

  recordCacheMiss(cacheType: string): void {
    this.cacheMissesTotal.inc({ cache_type: cacheType });
  }

  setCacheSize(cacheType: string, sizeBytes: number): void {
    this.cacheSize.set({ cache_type: cacheType }, sizeBytes);
  }

  // ========================================================================
  // DATABASE METRICS
  // ========================================================================

  recordDbQuery(queryType: string, durationMs: number): void {
    this.dbQueryDuration.observe({ query_type: queryType }, durationMs / 1000);
  }

  setDbConnectionPoolSize(size: number): void {
    this.dbConnectionPoolSize.set(size);
  }

  // ========================================================================
  // BUSINESS METRICS
  // ========================================================================

  setContractorsAvailable(specialty: string, count: number): void {
    this.contractorsAvailable.set({ specialty }, count);
  }

  setContractorsBySpecialty(specialty: string, count: number): void {
    this.contractorsBySpecialty.set({ specialty }, count);
  }

  // ========================================================================
  // METRICS EXPORT
  // ========================================================================

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics as JSON (for debugging)
   */
  async getMetricsJSON(): Promise<any[]> {
    return this.registry.getMetricsAsJSON();
  }

  /**
   * Clear all metrics (for testing)
   */
  clearMetrics(): void {
    this.registry.clear();
  }

  /**
   * Health check for metrics system
   */
  healthCheck(): { status: string; metrics_count: number } {
    const metrics = this.registry.getSingleMetricAsString('http_requests_total');
    return {
      status: 'ok',
      metrics_count: this.registry.getMetricsAsArray().length,
    };
  }
}
