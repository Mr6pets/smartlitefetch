// import fetch from 'node-fetch';
// import { URL } from 'url';
import net from 'net';
import AdvancedCache from './cache.js';
import { RequestLogger, PerformanceMonitor, NetworkInspector } from './debug.js';
import { MockManager } from './mock.js';
import { FailoverManager } from './failover.js';
import { GraphQLClient } from './graphql.js';

// 默认配置
const defaultConfig = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  cache: false,
  cacheTime: 300000,
  validateStatus: (status) => status >= 200 && status < 300,
  debug: false // 新增：调试模式
};

// 全局实例
const globalCache = new AdvancedCache({
  maxSize: 100,
  defaultTTL: 300000,
  cleanupInterval: 60000
});

// const globalLogger = new RequestLogger();
    // const globalMonitor = new PerformanceMonitor();
    // const globalInspector = new NetworkInspector();

// 增强的拦截器系统
class InterceptorManager {
  constructor() {
    this.handlers = [];
  }

  use(fulfilled, rejected) {
    this.handlers.push({ fulfilled, rejected });
    return this.handlers.length - 1;
  }

  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  async forEach(fn) {
    for (let i = 0; i < this.handlers.length; i++) {
      if (this.handlers[i] !== null) {
        await fn(this.handlers[i]);
      }
    }
  }
}

// 请求去重管理器
// class RequestDeduplicator {
//   constructor() {
//     this.pendingRequests = new Map();
//   }
//
//   getKey(url, options) {
//     return `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || '')}`;
//   }
//
//   async deduplicate(url, options, requestFn) {
//     const key = this.getKey(url, options);
//     
//     if (this.pendingRequests.has(key)) {
//       return this.pendingRequests.get(key);
//     }
//
//     const promise = requestFn().finally(() => {
//       this.pendingRequests.delete(key);
//     });
//
//     this.pendingRequests.set(key, promise);
//     return promise;
//   }
// }

// const requestDeduplicator = new Map();

// checkPort 函数定义
// eslint-disable-next-line no-unused-vars
async function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: 2000 }); // 增加超时设置
    socket.on('connect', () => {
      socket.destroy(); // 使用 destroy() 立即销毁 socket
      resolve(true);
    });
    socket.on('error', () => {
      socket.destroy(); // 确保出错时也销毁
      resolve(false);
    });
    socket.on('timeout', () => { // 处理超时
      socket.destroy();
      resolve(false);
    });
  });
}

class LiteFetchV3 {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    };
    
    // 初始化新功能
    this.cache = new AdvancedCache(config.cache || {});
    this.logger = new RequestLogger(config.loggerOptions || {});
    this.monitor = new PerformanceMonitor(config.monitorOptions || {});
    this.inspector = new NetworkInspector(config.inspectorOptions || {});
    this.mockManager = new MockManager();
    
    // 添加 testUtils 初始化
    this.testUtils = {
      // eslint-disable-next-line no-unused-vars
      expectRequest: (url, options) => {},
      // eslint-disable-next-line no-unused-vars
      runTests: (tests) => {},
      // eslint-disable-next-line no-unused-vars
      benchmark: (url, options, iterations) => {}
    };
    
    // 故障转移支持
    if (config.baseURLs && config.baseURLs.length > 1) {
      this.failoverManager = new FailoverManager({
        baseURLs: config.baseURLs,
        strategy: config.failoverStrategy || 'round-robin',
        healthCheck: config.healthCheck
      });
    }
    
    // GraphQL 支持
    if (config.graphql) {
      this.graphql = new GraphQLClient(
        config.graphql.endpoint || '/graphql',
        { ...config.graphql, httpClient: this }
      );
    }
  }

  // 拦截器方法
  addRequestInterceptor(fulfilled, rejected) {
    return this.interceptors.request.use(fulfilled, rejected);
  }

  addResponseInterceptor(fulfilled, rejected) {
    return this.interceptors.response.use(fulfilled, rejected);
  }

  removeRequestInterceptor(id) {
    this.interceptors.request.eject(id);
  }

  removeResponseInterceptor(id) {
    this.interceptors.response.eject(id);
  }

  // 核心请求方法
  async request(url, options = {}) {
    const config = { ...this.config, ...options };
    
    // Mock 检查
    if (this.mockManager.isEnabled()) {
      const mockResponse = this.mockManager.match(url, config);
      if (mockResponse) {
        return mockResponse;
      }
    }

    // 缓存检查
    if (config.cache !== false) {
      const cacheKey = this._getCacheKey(url, config);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 执行请求拦截器
    let requestConfig = { url, ...config };
    await this.interceptors.request.forEach(async (interceptor) => {
      if (interceptor.fulfilled) {
        requestConfig = await interceptor.fulfilled(requestConfig);
      }
    });

    try {
      // 执行实际请求
      const response = await this._makeRequest(requestConfig.url, requestConfig);
      
      // 执行响应拦截器
      let finalResponse = response;
      await this.interceptors.response.forEach(async (interceptor) => {
        if (interceptor.fulfilled) {
          finalResponse = await interceptor.fulfilled(finalResponse);
        }
      });

      // 缓存响应
      if (config.cache !== false && this._shouldCache(finalResponse, config)) {
        const cacheKey = this._getCacheKey(url, config);
        this.cache.set(cacheKey, finalResponse, {
          ttl: config.cacheTime || this.config.cacheTime
        });
      }

      return finalResponse;
    } catch (error) {
      // 执行错误拦截器
      await this.interceptors.response.forEach(async (interceptor) => {
        if (interceptor.rejected) {
          await interceptor.rejected(error);
        }
      });
      throw error;
    }
  }

  // 实际发送请求的方法
  async _makeRequest(url, config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.config.timeout);
  
    try {
      // 过滤掉自定义属性，只保留 fetch API 支持的选项
      // 这些变量虽然未直接使用，但解构是为了从 fetchOptions 中排除它们
      /* eslint-disable no-unused-vars */
      const {
        cache: customCache,
        cacheTime,
        cacheTags,
        staleWhileRevalidate,
        cacheMaxAge,
        useInstanceCache,
        cacheOptions,
        validateStatus,
        ...fetchOptions
      } = config;
      /* eslint-enable no-unused-vars */

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: config.body ? (typeof config.body === 'string' ? config.body : JSON.stringify(config.body)) : undefined
      });

      clearTimeout(timeoutId);

      if (!config.validateStatus(response.status)) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      // 解析响应
      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // 缓存相关辅助方法
  _getCacheKey(url, config) {
    return `${config.method || 'GET'}:${url}:${JSON.stringify(config.body || '')}`;
  }

  // eslint-disable-next-line no-unused-vars
  _shouldCache(response, config) {
    return response.status >= 200 && response.status < 300;
  }

  // GraphQL 方法
   
  async query(query, variables = {}, options = {}) {
    if (!this.graphql) {
      throw new Error('GraphQL not configured. Please provide graphql.endpoint in config.');
    }
    return this.graphql.query(query, variables, options);
  }

  async mutation(mutation, variables = {}, options = {}) {
    if (!this.graphql) {
      throw new Error('GraphQL not configured. Please provide graphql.endpoint in config.');
    }
    return this.graphql.mutation(mutation, variables, options);
  }

  // 故障转移请求
  async requestWithFailover(url, options = {}) {
    if (!this.failoverManager) {
      return this.request(url, options);
    }

    return this.failoverManager.executeWithFailover(async (baseURL) => {
      const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
      return this.request(fullUrl, options);
    });
  }

  // 获取调试信息
  getDebugInfo() {
    return {
      metrics: this.monitor.getMetrics(),
      logs: this.logger.getLogs(),
      requests: this.inspector.getRequests(),
      cacheStats: this.cache.getStats(),
      mockStats: this.mockManager.getStats(),
      failoverStats: this.failoverManager?.getStats()
    };
  }

  // 导出调试数据
  exportDebugData(format = 'json') {
    switch (format) {
      case 'har':
        return this.inspector.exportHAR();
      case 'logs':
        return this.logger.exportLogs('csv');
      case 'json':
      default:
        return JSON.stringify(this.getDebugInfo(), null, 2);
    }
  }

  // 清理调试数据
  clearDebugData() {
    this.logger.clearLogs();
    this.monitor.clearMetrics();
    this.inspector.clearRequests();
    this.cache.clear();
  }

  // 后台重新验证缓存
  async _backgroundRevalidate(url, config, cacheKey) {
    try {
      const result = await this._makeRequest(url, { ...config, cache: false });
      const cacheOptions = {
        ttl: config.cacheTime || this.config.cacheTime,
        tags: config.cacheTags,
        etag: result.headers.get('etag'),
        lastModified: result.headers.get('last-modified'),
        staleWhileRevalidate: config.staleWhileRevalidate,
        maxAge: config.cacheMaxAge
      };
      this.cache.set(cacheKey, result, cacheOptions);
    } catch (error) {
      // 后台更新失败，保持现有缓存
      console.warn('Background cache revalidation failed:', error.message);
    }
  }

  // HTTP 方法快捷方式
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return this.request(url, { ...options, method: 'POST', body: data });
  }

  async put(url, data, options = {}) {
    return this.request(url, { ...options, method: 'PUT', body: data });
  }

  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  // 批量请求
  async all(requests) {
    return Promise.all(requests.map(req => 
      typeof req === 'string' ? this.get(req) : this.request(req.url, req.options)
    ));
  }

  // 竞速请求
  async race(requests) {
    return Promise.race(requests.map(req => 
      typeof req === 'string' ? this.get(req) : this.request(req.url, req.options)
    ));
  }

  // Mock 相关方法（确保这些方法在 LiteFetchV3 类内部）
  enableMock() {
    this.mockManager.enable();
    return this;
  }
  
  disableMock() {
    this.mockManager.disable();
    return this;
  }
  
  addMockRule(rule) {
    return this.mockManager.addRule(rule);
  }
  
  removeMockRule(id) {
    this.mockManager.removeRule(id);
    return this;
  }
  
  clearMockRules() {
    this.mockManager.clearRules();
    return this;
  }
  
  mockSuccess(url, data, options) {
    return this.mockManager.mockSuccess(url, data, options);
  }
  
  mockError(url, error, options) {
    return this.mockManager.mockError(url, error, options);
  }
  
  mockDelay(url, data, delay, options) {
    return this.mockManager.mockDelay(url, data, delay, options);
  }
  
  mockRestAPI(baseUrl, resource, data) {
    return this.mockManager.mockRestAPI(baseUrl, resource, data);
  }
  
  getMockStats() {
    return this.mockManager.getStats();
  }
  
  // 缓存相关方法
  getCacheStats() {
    return this.cache.getStats();
  }
  
  deleteCacheByTag(tag) {
    return this.cache.deleteByTag(tag);
  }
  
  clearCache() {
    return this.cache.clear();
  }
  
  // 测试工具
   
  expectRequest(url, options) {
    return this.testUtils.expectRequest(url, options);
  }
  
   
  runTests(tests) {
    return this.testUtils.runTests(tests);
  }
  
   
  benchmark(url, options, iterations) {
    return this.testUtils.benchmark(url, options, iterations);
  }

  // 销毁实例
  destroy() {
    if (this.config.useInstanceCache && this.cache !== globalCache) {
      this.cache.destroy();
    }
  }
}

// 创建默认实例
const litefetch = new LiteFetchV3();

// 导出
export default litefetch;
// 正确绑定 this 上下文
export const get = (url, options) => litefetch.get(url, options);
export const post = (url, data, options) => litefetch.post(url, data, options);
export const put = (url, data, options) => litefetch.put(url, data, options);
export const del = (url, options) => litefetch.delete(url, options);
export const request = (url, options) => litefetch.request(url, options);
export const LiteFetch = LiteFetchV3;
export const create = (config) => new LiteFetchV3(config);
export { AdvancedCache, RequestLogger, PerformanceMonitor, NetworkInspector };
