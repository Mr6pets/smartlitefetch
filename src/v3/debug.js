// 调试和监控模块

class RequestLogger {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.logLevel = options.logLevel || 'info'; // 'debug', 'info', 'warn', 'error'
    this.maxLogEntries = options.maxLogEntries || 1000;
    this.logs = [];
    this.requestId = 0;
  }

  log(level, message, data = {}) {
    if (!this.enabled) return;
    
    const logEntry = {
      id: ++this.requestId,
      timestamp: new Date().toISOString(),
      level,
      message,
      data: JSON.parse(JSON.stringify(data)) // 深拷贝避免引用问题
    };

    this.logs.push(logEntry);
    
    // 限制日志条目数量
    if (this.logs.length > this.maxLogEntries) {
      this.logs.shift();
    }

    // 控制台输出
    if (this.shouldLog(level)) {
      const prefix = `[LiteFetch:${logEntry.id}]`;
      switch (level) {
        case 'debug':
          console.debug(prefix, message, data);
          break;
        case 'info':
          console.info(prefix, message, data);
          break;
        case 'warn':
          console.warn(prefix, message, data);
          break;
        case 'error':
          console.error(prefix, message, data);
          break;
      }
    }

    return logEntry.id;
  }

  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  getLogs(filter = {}) {
    let filteredLogs = [...this.logs];

    if (filter.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }

    if (filter.since) {
      const sinceTime = new Date(filter.since).getTime();
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp).getTime() >= sinceTime);
    }

    if (filter.requestId) {
      filteredLogs = filteredLogs.filter(log => log.id === filter.requestId);
    }

    return filteredLogs;
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(this.logs, null, 2);
      case 'csv': {
        const headers = 'ID,Timestamp,Level,Message,Data\n';
        const rows = this.logs.map(log => 
          `${log.id},${log.timestamp},${log.level},"${log.message}","${JSON.stringify(log.data).replace(/"/g, '""')}"`
        ).join('\n');
        return headers + rows;
      }
      default:
        return this.logs;
    }
  }
}

class PerformanceMonitor {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.metrics = new Map();
    this.requestTimings = [];
    this.maxTimingEntries = options.maxTimingEntries || 500;
  }

  startTiming(requestId, url, method = 'GET') {
    if (!this.enabled) return null;

    const timing = {
      requestId,
      url,
      method,
      startTime: performance.now(),
      phases: {}
    };

    this.metrics.set(requestId, timing);
    return requestId;
  }

  markPhase(requestId, phase, data = {}) {
    if (!this.enabled) return;

    const timing = this.metrics.get(requestId);
    if (timing) {
      timing.phases[phase] = {
        timestamp: performance.now(),
        duration: performance.now() - timing.startTime,
        data
      };
    }
  }

  endTiming(requestId, success = true, error = null) {
    if (!this.enabled) return null;

    const timing = this.metrics.get(requestId);
    if (!timing) return null;

    timing.endTime = performance.now();
    timing.totalDuration = timing.endTime - timing.startTime;
    timing.success = success;
    timing.error = error;

    // 移动到历史记录
    this.requestTimings.push({ ...timing });
    
    // 限制历史记录数量
    if (this.requestTimings.length > this.maxTimingEntries) {
      this.requestTimings.shift();
    }

    this.metrics.delete(requestId);
    return timing;
  }

  getMetrics() {
    const timings = this.requestTimings;
    if (timings.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        slowestRequest: null,
        fastestRequest: null
      };
    }

    const successfulRequests = timings.filter(t => t.success);
    const durations = timings.map(t => t.totalDuration);
    
    return {
      totalRequests: timings.length,
      successfulRequests: successfulRequests.length,
      failedRequests: timings.length - successfulRequests.length,
      successRate: (successfulRequests.length / timings.length * 100).toFixed(2) + '%',
      averageResponseTime: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2) + 'ms',
      medianResponseTime: this.calculateMedian(durations).toFixed(2) + 'ms',
      slowestRequest: {
        duration: Math.max(...durations).toFixed(2) + 'ms',
        url: timings.find(t => t.totalDuration === Math.max(...durations))?.url
      },
      fastestRequest: {
        duration: Math.min(...durations).toFixed(2) + 'ms',
        url: timings.find(t => t.totalDuration === Math.min(...durations))?.url
      },
      requestsByMethod: this.groupByMethod(timings),
      errorTypes: this.groupByErrorType(timings.filter(t => !t.success))
    };
  }

  calculateMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  groupByMethod(timings) {
    const groups = {};
    timings.forEach(timing => {
      const method = timing.method || 'UNKNOWN';
      if (!groups[method]) {
        groups[method] = { count: 0, totalDuration: 0 };
      }
      groups[method].count++;
      groups[method].totalDuration += timing.totalDuration;
    });

    Object.keys(groups).forEach(method => {
      groups[method].averageDuration = (groups[method].totalDuration / groups[method].count).toFixed(2) + 'ms';
    });

    return groups;
  }

  groupByErrorType(failedTimings) {
    const groups = {};
    failedTimings.forEach(timing => {
      const errorType = timing.error?.name || 'Unknown Error';
      groups[errorType] = (groups[errorType] || 0) + 1;
    });
    return groups;
  }

  getDetailedTimings(filter = {}) {
    let timings = [...this.requestTimings];

    if (filter.method) {
      timings = timings.filter(t => t.method === filter.method);
    }

    if (filter.success !== undefined) {
      timings = timings.filter(t => t.success === filter.success);
    }

    if (filter.minDuration) {
      timings = timings.filter(t => t.totalDuration >= filter.minDuration);
    }

    return timings;
  }

  clearMetrics() {
    this.requestTimings = [];
    this.metrics.clear();
  }
}

class NetworkInspector {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.requests = [];
    this.maxRequests = options.maxRequests || 100;
  }

  recordRequest(requestData) {
    if (!this.enabled) return;

    const record = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...requestData
    };

    this.requests.push(record);

    if (this.requests.length > this.maxRequests) {
      this.requests.shift();
    }
  }

  getRequests(filter = {}) {
    let filtered = [...this.requests];

    if (filter.method) {
      filtered = filtered.filter(req => req.method === filter.method);
    }

    if (filter.status) {
      filtered = filtered.filter(req => req.status === filter.status);
    }

    if (filter.url) {
      filtered = filtered.filter(req => req.url.includes(filter.url));
    }

    return filtered;
  }

  clearRequests() {
    this.requests = [];
  }

  exportHAR() {
    // 导出 HAR (HTTP Archive) 格式，可以导入到浏览器开发者工具
    const har = {
      log: {
        version: '1.2',
        creator: {
          name: 'LiteFetch',
          version: '3.0.0'
        },
        entries: this.requests.map(req => ({
          startedDateTime: req.timestamp,
          time: req.duration || 0,
          request: {
            method: req.method,
            url: req.url,
            headers: Object.entries(req.headers || {}).map(([name, value]) => ({ name, value })),
            postData: req.body ? {
              mimeType: 'application/json',
              text: typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
            } : undefined
          },
          response: {
            status: req.status || 0,
            statusText: req.statusText || '',
            headers: req.responseHeaders ? Object.entries(req.responseHeaders).map(([name, value]) => ({ name, value })) : [],
            content: {
              size: req.responseSize || 0,
              mimeType: req.responseType || 'application/json'
            }
          }
        }))
      }
    };

    return JSON.stringify(har, null, 2);
  }
}

export { RequestLogger, PerformanceMonitor, NetworkInspector };