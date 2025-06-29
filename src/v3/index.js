import fetch from 'node-fetch';
import { URL } from 'url';

// 默认配置
const defaultConfig = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  cache: false,
  cacheTime: 300000,
  validateStatus: (status) => status >= 200 && status < 300
};

// 缓存存储
const cache = new Map();

// 拦截器
const interceptors = {
  request: [],
  response: []
};

class LiteFetchV3 {
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

  // 核心请求方法 (支持 AbortController)
  async request(url, options = {}) {
    const config = { ...this.config, ...options };
    
    let lastError;
    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        // 创建 AbortController 用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const fetchOptions = {
          method: config.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers
          },
          signal: controller.signal,
          ...config
        };

        if (config.body && typeof config.body === 'object') {
          fetchOptions.body = JSON.stringify(config.body);
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        
        if (!config.validateStatus(response.status)) {
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
          headers: response.headers
        };
      } catch (error) {
        lastError = error;
        
        if (attempt < config.retries) {
          await new Promise(resolve => 
            setTimeout(resolve, config.retryDelay * Math.pow(2, attempt))
          );
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
}

// 创建默认实例
const litefetch = new LiteFetchV3();

// 导出
export default litefetch;
export const get = litefetch.get.bind(litefetch);
export const post = litefetch.post.bind(litefetch);
export const put = litefetch.put.bind(litefetch);
export const del = litefetch.delete.bind(litefetch);
export const request = litefetch.request.bind(litefetch);
export const LiteFetch = LiteFetchV3;
export const create = (config) => new LiteFetchV3(config);