/**
 * 故障转移管理器
 */

class HealthChecker {
  constructor(options = {}) {
    this.checkInterval = options.checkInterval || 30000; // 30秒
    this.timeout = options.timeout || 5000;
    this.healthEndpoint = options.healthEndpoint || '/health';
    this.serverHealth = new Map();
    this.isRunning = false;
  }

  async checkServerHealth(baseURL) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(`${baseURL}${this.healthEndpoint}`, {
        signal: controller.signal,
        method: 'GET'
      });
      
      clearTimeout(timeoutId);
      
      const isHealthy = response.ok;
      this.serverHealth.set(baseURL, {
        healthy: isHealthy,
        lastCheck: Date.now(),
        responseTime: Date.now() - Date.now(),
        status: response.status
      });
      
      return isHealthy;
    } catch (error) {
      this.serverHealth.set(baseURL, {
        healthy: false,
        lastCheck: Date.now(),
        error: error.message
      });
      return false;
    }
  }

  startHealthChecks(servers) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.healthCheckInterval = setInterval(async () => {
      await Promise.all(servers.map(server => this.checkServerHealth(server)));
    }, this.checkInterval);
  }

  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.isRunning = false;
    }
  }

  getServerHealth(baseURL) {
    return this.serverHealth.get(baseURL) || { healthy: true, lastCheck: 0 };
  }

  getHealthyServers(servers) {
    return servers.filter(server => {
      const health = this.getServerHealth(server);
      return health.healthy;
    });
  }
}

class FailoverManager {
  constructor(options = {}) {
    this.baseURLs = options.baseURLs || [];
    this.strategy = options.strategy || 'round-robin'; // round-robin, random, health-check
    this.currentIndex = 0;
    this.failedServers = new Set();
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.healthChecker = new HealthChecker(options.healthCheck || {});
    
    if (this.strategy === 'health-check' && this.baseURLs.length > 0) {
      this.healthChecker.startHealthChecks(this.baseURLs);
    }
  }

  getNextServer() {
    if (this.baseURLs.length === 0) {
      throw new Error('No servers configured for failover');
    }

    let availableServers = this.baseURLs;
    
    // 如果启用健康检查，只使用健康的服务器
    if (this.strategy === 'health-check') {
      availableServers = this.healthChecker.getHealthyServers(this.baseURLs);
      if (availableServers.length === 0) {
        // 如果没有健康的服务器，回退到所有服务器
        availableServers = this.baseURLs;
      }
    } else {
      // 过滤掉已知失败的服务器
      availableServers = this.baseURLs.filter(server => !this.failedServers.has(server));
      if (availableServers.length === 0) {
        // 如果所有服务器都失败了，重置失败列表
        this.failedServers.clear();
        availableServers = this.baseURLs;
      }
    }

    switch (this.strategy) {
      case 'round-robin': {
        const server = availableServers[this.currentIndex % availableServers.length];
        this.currentIndex++;
        return server;
      }
      
      case 'random':
        return availableServers[Math.floor(Math.random() * availableServers.length)];
        
      case 'health-check':
        // 选择响应时间最短的健康服务器
        return availableServers.reduce((best, current) => {
          const currentHealth = this.healthChecker.getServerHealth(current);
          const bestHealth = this.healthChecker.getServerHealth(best);
          
          if (!bestHealth.healthy) return current;
          if (!currentHealth.healthy) return best;
          
          return (currentHealth.responseTime || 0) < (bestHealth.responseTime || 0) ? current : best;
        });
        
      default:
        return availableServers[0];
    }
  }

  markServerFailed(baseURL) {
    this.failedServers.add(baseURL);
    console.warn(`Server marked as failed: ${baseURL}`);
  }

  markServerRecovered(baseURL) {
    this.failedServers.delete(baseURL);
    console.info(`Server recovered: ${baseURL}`);
  }

  async executeWithFailover(requestFn) {
    let lastError;
    let attempts = 0;
    
    while (attempts < this.maxRetries) {
      try {
        const server = this.getNextServer();
        const result = await requestFn(server);
        
        // 如果请求成功，标记服务器为恢复状态
        if (this.failedServers.has(server)) {
          this.markServerRecovered(server);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        attempts++;
        
        // 标记当前服务器失败
        const currentServer = this.getNextServer();
        this.markServerFailed(currentServer);
        
        if (attempts < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempts));
        }
      }
    }
    
    throw new Error(`All servers failed after ${attempts} attempts. Last error: ${lastError.message}`);
  }

  getStats() {
    return {
      totalServers: this.baseURLs.length,
      failedServers: Array.from(this.failedServers),
      healthyServers: this.strategy === 'health-check' 
        ? this.healthChecker.getHealthyServers(this.baseURLs)
        : this.baseURLs.filter(s => !this.failedServers.has(s)),
      currentStrategy: this.strategy,
      serverHealth: this.strategy === 'health-check' 
        ? Object.fromEntries(this.healthChecker.serverHealth)
        : null
    };
  }

  destroy() {
    this.healthChecker.stopHealthChecks();
  }
}

export { FailoverManager, HealthChecker };