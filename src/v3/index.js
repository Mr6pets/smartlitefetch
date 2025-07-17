import fetch from 'node-fetch';
import { URL } from 'url';
// 移除: import dns from 'dns';
import net from 'net';

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

// checkPort 函数定义
async function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({
      host,
      port
    });
    socket.on('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

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
    const parsedUrl = new URL(url);
    const port = parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80);
    
    // 检查端口
    const portOpen = await checkPort(parsedUrl.hostname, port);
    if (!portOpen) {
      throw new Error(`Port ${port} on ${parsedUrl.hostname} is not open`);
    }
    
    const cacheKey = `${config.method || 'GET'}:${url}`; // 生成缓存键
    
    // 检查缓存
    if (config.cache) {
      const cached = cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < config.cacheTime)) {
        return cached.data;
      }
    }
    
    let lastError;
    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        // 创建 AbortController 用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        let fetchOptions = {
          method: config.method || 'GET',
          headers: { 'Content-Type': 'application/json', ...config.headers },
          signal: controller.signal,
          ...config
        };
        
        // 执行请求拦截器
        for (const interceptor of interceptors.request) {
          fetchOptions = await interceptor(fetchOptions) || fetchOptions;
        }

        if (config.body) {
          if (config.body instanceof FormData) {
            fetchOptions.body = config.body;
            delete fetchOptions.headers['Content-Type']; // FormData 会自动设置
          } else if (typeof config.body === 'object') {
            fetchOptions.body = JSON.stringify(config.body);
          } else {
            fetchOptions.body = config.body;
          }
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

        // 缓存响应
        if (config.cache) {
          cache.set(cacheKey, { data: { data, status: response.status, statusText: response.statusText, headers: response.headers }, timestamp: Date.now() });
        }

        let result = { data, status: response.status, statusText: response.statusText, headers: response.headers };

        // 执行响应拦截器
        for (const interceptor of interceptors.response) {
          result = await interceptor(result) || result;
        }

        return { data, status: response.status, statusText: response.statusText, headers: response.headers };
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
// 导出
export default litefetch;
export const get = litefetch.get.bind(litefetch);
export const post = litefetch.post.bind(litefetch);
export const put = litefetch.put.bind(litefetch);
export const del = litefetch.delete.bind(litefetch);
export const request = litefetch.request.bind(litefetch);
export const LiteFetch = LiteFetchV3;
export const create = (config) => new LiteFetchV3(config);