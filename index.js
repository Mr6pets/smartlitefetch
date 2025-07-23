const fetch = require('node-fetch');
const { URL } = require('url');

// 默认配置
const defaultConfig = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  cache: false,
  cacheTime: 300000, // 5分钟
  validateStatus: (status) => status >= 200 && status < 300
};

// 缓存存储
const cache = new Map();

// 拦截器
const interceptors = {
  request: [],
  response: []
};

class LiteFetch {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // 添加请求拦截器
  addRequestInterceptor(interceptor) {
    interceptors.request.push(interceptor);
    return interceptors.request.length - 1;
  }

  // 添加响应拦截器
  addResponseInterceptor(interceptor) {
    interceptors.response.push(interceptor);
    return interceptors.response.length - 1;
  }

  // 移除拦截器
  removeInterceptor(type, index) {
    if (interceptors[type] && interceptors[type][index]) {
      interceptors[type].splice(index, 1);
    }
  }

  // 生成缓存键
  generateCacheKey(url, options) {
    return `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || {})}`;
  }

  // 获取缓存
  getCache(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTime) {
      return cached.data;
    }
    cache.delete(key);
    return null;
  }

  // 设置缓存
  setCache(key, data) {
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 应用请求拦截器
  async applyRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    for (const interceptor of interceptors.request) {
      if (typeof interceptor === 'function') {
        modifiedConfig = await interceptor(modifiedConfig) || modifiedConfig;
      }
    }
    return modifiedConfig;
  }

  // 应用响应拦截器
  async applyResponseInterceptors(response) {
    let modifiedResponse = response;
    for (const interceptor of interceptors.response) {
      if (typeof interceptor === 'function') {
        modifiedResponse = await interceptor(modifiedResponse) || modifiedResponse;
      }
    }
    return modifiedResponse;
  }

  // 处理响应
  async handleResponse(response) {
    if (!this.config.validateStatus(response.status)) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType && contentType.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.buffer();
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config: response.config
    };
  }

  // 核心请求方法
  async request(url, options = {}) {
    const config = { ...this.config, ...options };
    const cacheKey = this.generateCacheKey(url, config);

    // 检查缓存
    if (config.cache && config.method === 'GET') {
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 应用请求拦截器
    const finalConfig = await this.applyRequestInterceptors({ url, ...config });

    let lastError;
    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        // 创建 AbortController 用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const fetchOptions = {
          method: finalConfig.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...finalConfig.headers
          },
          signal: controller.signal,
          ...finalConfig
        };

        if (finalConfig.body && typeof finalConfig.body === 'object') {
          fetchOptions.body = JSON.stringify(finalConfig.body);
        }

        const response = await fetch(finalConfig.url || url, fetchOptions);
        clearTimeout(timeoutId);

        response.config = finalConfig;
        const processedResponse = await this.handleResponse(response);
        const finalResponse = await this.applyResponseInterceptors(processedResponse);

        // 缓存 GET 请求结果
        if (config.cache && config.method === 'GET') {
          this.setCache(cacheKey, finalResponse);
        }

        return finalResponse;
      } catch (error) {
        lastError = error;
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < config.retries) {
          await this.delay(config.retryDelay * Math.pow(2, attempt)); // 指数退避
        }
      }
    }

    throw new Error(`Request failed after ${config.retries + 1} attempts: ${lastError.message}`);
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

  async patch(url, data, options = {}) {
    return this.request(url, { ...options, method: 'PATCH', body: data });
  }

  async head(url, options = {}) {
    return this.request(url, { ...options, method: 'HEAD' });
  }

  async options(url, options = {}) {
    return this.request(url, { ...options, method: 'OPTIONS' });
  }

  // 并发请求
  async all(requests) {
    return Promise.all(requests);
  }

  // 竞速请求
  async race(requests) {
    return Promise.race(requests);
  }

  // 批量请求（带并发控制）
  async batch(requests, concurrency = 5) {
    const results = [];
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }
    return results;
  }

  // 清除缓存
  clearCache() {
    cache.clear();
  }

  // 创建新实例
  create(config = {}) {
    return new LiteFetch({ ...this.config, ...config });
  }
}

// 创建默认实例
const litefetch = new LiteFetch();

// 导出方法
module.exports = litefetch;
module.exports.LiteFetch = LiteFetch;
module.exports.get = litefetch.get.bind(litefetch);
module.exports.post = litefetch.post.bind(litefetch);
module.exports.put = litefetch.put.bind(litefetch);
module.exports.delete = litefetch.delete.bind(litefetch);
module.exports.patch = litefetch.patch.bind(litefetch);
module.exports.head = litefetch.head.bind(litefetch);
module.exports.options = litefetch.options.bind(litefetch);
module.exports.request = litefetch.request.bind(litefetch);
module.exports.all = litefetch.all.bind(litefetch);
module.exports.race = litefetch.race.bind(litefetch);
module.exports.batch = litefetch.batch.bind(litefetch);
module.exports.create = litefetch.create.bind(litefetch);

export { default as v2 } from './src/v2/index.cjs';
export { default as v3 } from './src/v3/index.js';



