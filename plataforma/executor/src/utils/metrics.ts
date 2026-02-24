/**
 * Metrics collector for monitoring execution performance
 */

interface ExecutionMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  timeoutExecutions: number;
  averageExecutionTime: number;
  executionsByLanguage: Record<string, number>;
  executionTimes: number[];
}

class MetricsCollector {
  private metrics: ExecutionMetrics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    timeoutExecutions: 0,
    averageExecutionTime: 0,
    executionsByLanguage: {},
    executionTimes: [],
  };

  private readonly maxExecutionTimesStored = 1000;

  /**
   * Record a successful execution
   */
  recordExecution(language: string, executionTime: number, success: boolean, timeout: boolean = false) {
    this.metrics.totalExecutions++;

    if (success) {
      this.metrics.successfulExecutions++;
    } else {
      this.metrics.failedExecutions++;
    }

    if (timeout) {
      this.metrics.timeoutExecutions++;
    }

    // Track by language
    this.metrics.executionsByLanguage[language] =
      (this.metrics.executionsByLanguage[language] || 0) + 1;

    // Track execution time
    this.metrics.executionTimes.push(executionTime);

    // Keep only last N execution times to prevent memory issues
    if (this.metrics.executionTimes.length > this.maxExecutionTimesStored) {
      this.metrics.executionTimes.shift();
    }

    // Recalculate average
    this.metrics.averageExecutionTime =
      this.metrics.executionTimes.reduce((a, b) => a + b, 0) /
      this.metrics.executionTimes.length;
  }

  /**
   * Get current metrics
   */
  getMetrics(): ExecutionMetrics {
    return {
      ...this.metrics,
      executionTimes: [...this.metrics.executionTimes], // Return copy
    };
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const times = this.metrics.executionTimes;
    const sorted = [...times].sort((a, b) => a - b);

    const percentile = (p: number) => {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[index] || 0;
    };

    return {
      total: this.metrics.totalExecutions,
      successful: this.metrics.successfulExecutions,
      failed: this.metrics.failedExecutions,
      timeouts: this.metrics.timeoutExecutions,
      successRate: this.metrics.totalExecutions > 0
        ? (this.metrics.successfulExecutions / this.metrics.totalExecutions * 100).toFixed(2) + '%'
        : '0%',
      byLanguage: this.metrics.executionsByLanguage,
      executionTime: {
        average: Math.round(this.metrics.averageExecutionTime),
        min: Math.min(...times),
        max: Math.max(...times),
        p50: percentile(50),
        p90: percentile(90),
        p95: percentile(95),
        p99: percentile(99),
      },
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      timeoutExecutions: 0,
      averageExecutionTime: 0,
      executionsByLanguage: {},
      executionTimes: [],
    };
  }
}

// Export singleton
export const metrics = new MetricsCollector();
