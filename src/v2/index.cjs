const fetch = require('node-fetch');
const { URL } = require('url');
const dns = require('dns'); // 新增（如果需要 DNS 相关，可选）
const net = require('net'); // 新增，用于端口检查

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
    const socket = net.createConnection({ host, port });
    socket.on('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

class LiteFetchV2 {
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

  // 核心请求方法
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
        let fetchOptions = {
          method: config.method || 'GET',
          headers: { 'Content-Type': 'application/json', ...config.headers },
          timeout: config.timeout,
          ...config
        };

        // 执行请求拦截器
        for (const interceptor of interceptors.request) {
          fetchOptions = await interceptor(fetchOptions) || fetchOptions;
        }

        if (config.body) {
          if (config.body instanceof URLSearchParams) { // 支持 FormData-like
            fetchOptions.body = config.body.toString();
            fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          } else if (typeof config.body === 'object') {
            fetchOptions.body = JSON.stringify(config.body);
          } else {
            fetchOptions.body = config.body;
          }
        }

        const response = await fetch(url, fetchOptions);
        
        if (!config.validateStatus(response.status)) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        // 缓存响应
        if (config.cache) {
          cache.set(cacheKey, { data: { data, status: response.status, statusText: response.statusText, headers: response.headers }, timestamp: Date.now() });
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
    return this.request(url, {
        ...options,
        method: 'POST',
        body: typeof data === 'object' && data !== null ? JSON.stringify(data) : data,
        headers: {
            'Content-Type': 'application/json',
            ...(options && options.headers)
        }
    });
  }

  async put(url, data, options = {}) {
    return this.request(url, { ...options, method: 'PUT', body: data });
  }

  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}

// 创建默认实例
const litefetch = new LiteFetchV2();

// 导出
module.exports = litefetch;
module.exports.LiteFetch = LiteFetchV2;
module.exports.get = litefetch.get.bind(litefetch);
module.exports.post = litefetch.post.bind(litefetch);
module.exports.put = litefetch.put.bind(litefetch);
module.exports.delete = litefetch.delete.bind(litefetch);
module.exports.request = litefetch.request.bind(litefetch);
module.exports.create = (config) => new LiteFetchV2(config);