# smartLiteFetch

[![npm version](https://badge.fury.io/js/smartlitefetch.svg)](https://badge.fury.io/js/smartlitefetch)
[![Downloads](https://img.shields.io/npm/dm/smartlitefetch.svg)](https://www.npmjs.com/package/smartlitefetch)

## 📦 安装 Installation

```bash
# 使用 npm
npm install smartlitefetch --save

# 使用 yarn
yarn add smartlitefetch

# 使用 pnpm
pnpm add smartlitefetch
```

## 🔧 版本选择 Version Selection
LiteFetch 2.0+ 支持两种模块系统：
自动选择（推荐）

```bash
// CommonJS 项目自动使用 v2 (node-fetch 2.x)
const { get, post } = require('smartlitefetch');

// ESM 项目自动使用 v3 (node-fetch 3.x)
import { get, post } from 'smartlitefetch';
```
手动指定版本
```bash
// 强制使用 v2 (CommonJS + node-fetch 2.x)
const { get, post } = require('smartlitefetch/v2');

// 强制使用 v3 (ESM + node-fetch 3.x)
import { get, post } from 'smartlitefetch/v3';
```
版本对比
| 特性      | V2 (CommonJS) | V3 (ESM)   |
| :---        |    :----:   |     :----: |
|模块系统      | CommonJS       | ESM   |
| node-fetch 版本 | 2.x | 3.x   |
| Node.js 要求 | >= 10.0.0 | >= 12.20.0 |
| 超时控制 | setTimeout | AbortController |
| 响应类型 | JSON/Text | JSON/Text/Buffer |
| 推荐场景 | 传统项目    | 现代项目  |

V2 与 V3 功能对比
| 功能      | V2 (CommonJS) | V3 (ESM)   |
| :---        |    :----:   |     :----: |
|HTTP 基础请求方法      | ✅ GET, POST, PUT, DELETE       | ✅ GET, POST, PUT, DELETE   |
| 请求超时 | ✅ 简单超时 | ✅ 使用 AbortController 的高级超时控制   |
| 重试机制 | ✅ 基础重试 | ✅ 增强的重试机制，包括指数退避 |
| 拦截器 | ✅ 基础拦截器 | ✅ 增强的拦截器系统，支持异步处理 |
| 缓存 | ✅ 简单缓存 | ✅ 高级缓存系统 |
| 端口检查 | ✅ 基础检查    | ✅ 集成到请求流程中的端口检查  |

### 🚀 快速开始 Quick Start
```js
// V2 (CommonJS)
const { get, post, put, delete: del } = require('smartlitefetch');

// V3 (ESM)
import { get, post, put, delete as del } from 'smartlitefetch';

// GET 请求
const users = await get('https://jsonplaceholder.typicode.com/users');
console.log(users.data);

// POST 请求
const newUser = await post('https://jsonplaceholder.typicode.com/users', {
  body: {
    name: 'John Doe',
    email: 'john@example.com'
  }
});
```

## 📖 API 文档 API Documentation
```js
// V2
const { create } = require('smartlitefetch');

// V3
import { create } from 'smartlitefetch';

const apiClient = create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retries: 3,
  headers: {
    'Authorization': 'Bearer your-token',
    'User-Agent': 'MyApp/1.0'
  }
});
```
### 1. 请求/响应拦截器
```javascript
// 请求拦截器 - 添加认证
apiClient.addRequestInterceptor((config) => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  config.headers['X-Request-ID'] = generateRequestId();
  return config;
});

// 响应拦截器 - 统一错误处理
apiClient.addResponseInterceptor((response) => {
  if (response.status === 401) {
    // 处理未授权
    redirectToLogin();
  }
  return response;
});
```
### 2. 自动重试机制
```javascript
// 自动重试，指数退避
const data = await get('https://api.example.com/data', {
  retries: 5,
  retryDelay: 1000 // 初始延迟 1 秒，每次重试翻倍
});
```
### 3. 超时控制
```javascript
// V2: 使用 setTimeout
const data = await get('https://api.example.com/slow-endpoint', {
  timeout: 5000 // 5秒超时
});

// V3: 使用 AbortController (更现代)
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

const data = await get('https://api.example.com/slow-endpoint', {
  signal: controller.signal
});
```
### 4. 缓存机制
启用缓存以减少重复请求：
```javascript
// 启用缓存，设置缓存时间 5 分钟
const data = await get('https://api.example.com/data', {
  cache: true,
  cacheTime: 300000
});
```
### 5. 端口检查
在请求前自动检查主机端口是否开放：
```javascript
// 会抛出错误如果端口不可用
const data = await get('https://api.example.com');
```
### 6. FormData 支持
支持表单数据和文件上传（v3 支持 FormData，v2 使用 URLSearchParams）：
```javascript
// v3 示例
const form = new FormData();
form.append('file', fs.createReadStream('file.txt'));
await post('https://api.example.com/upload', { body: form });
```
### 7. 更多 HTTP 方法
```javascript
// PATCH 请求
const updated = await patch('/users/1', {
  body: { name: 'New Name' }
});
```

### ⚙️ 配置选项 Configuration Options
所有方法都支持 node-fetch 的配置选项：
```javascript
const config = {
  timeout: 5000,        // 超时时间 (毫秒)
  retries: 3,           // 重试次数
  retryDelay: 1000,     // 重试延迟 (毫秒)
  cache: false,         // 启用缓存
  cacheTime: 300000,    // 缓存时间 (毫秒)
  headers: {            // 自定义请求头
    'User-Agent': 'MyApp/1.0',
    'Accept': 'application/json'
  },
  validateStatus: (status) => status >= 200 && status < 300, // 状态验证
  redirect: 'follow',   // 重定向策略
  compress: true        // 启用压缩
};

const data = await get('https://api.example.com/data', config);
```

### 错误处理
```javascript
try {
  const data = await get('https://api.example.com/data');
  console.log(data.data);
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('请求超时');
  } else if (error.message.includes('HTTP error')) {
    console.error('HTTP 错误:', error.message);
  } else {
    console.error('请求失败:', error.message);
  }
}
```

### 🆕 新功能概览 - 突出显示 2.1+ 版本的新特性

🔍 GraphQL 支持 - 详细的 GraphQL 使用指南
🐛 调试和监控 - 调试模式和性能监控
🔄 故障转移 - 高可用性配置
🔧 中间件系统 - 请求/响应处理管道
💾 高级缓存 - 缓存策略和标签管理
🧪 测试和 Mock - 增强的测试功能
📊 性能优化 - 最佳实践和性能建议

#### GraphQL 支持 🆕

```js
// GraphQL 查询支持
import { create, QueryBuilder } from 'smartlitefetch/v3';

const client = create({
  graphql: {
    endpoint: 'https://api.example.com/graphql',
    headers: {
      'Authorization': 'Bearer your-token'
    }
  }
});

// 使用 GraphQL 查询
const query = `
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

const result = await client.graphql(query);
console.log(result.data.users);
```

#### 调试和监控功能 🆕

```js
// 启用调试模式
const debugClient = create({
  debug: true,
  timeout: 5000
});

// 自动记录请求/响应信息
// 性能监控
// HAR 格式导出
const response = await debugClient.get('/api/data');
```

#### 故障转移 (Failover) 🆕

```js
// 多个备用 URL 自动切换
const client = create({
  baseURLs: [
    'https://api1.example.com',
    'https://api2.example.com', 
    'https://api3.example.com'
  ],
  failover: {
    retries: 3,
    timeout: 5000
  }
});

// 自动尝试备用服务器
const data = await client.get('/api/data');
```

#### 高级中间件系统 🆕

```
// 请求/响应中间件
const client = create({
  middleware: {
    request: [
      (config) => {
        // 请求预处理
        config.headers['X-Request-Time'] = Date.now();
        return config;
      }
    ],
    response: [
      (response) => {
        // 响应后处理
        console.log('响应时间:', Date.now() - response.config.headers['X-Request-Time']);
        return response;
      }
    ]
  }
});
```

#### 高级缓存系统 🆕

```js
// LRU 缓存 + Stale-While-Revalidate
const data = await get('/api/data', {
  cache: {
    strategy: 'stale-while-revalidate',
    maxAge: 300000,        // 5分钟
    staleWhileRevalidate: 600000, // 10分钟
    tags: ['users', 'api-data']
  }
});

// 缓存标签管理
client.cache.invalidateByTag('users');
```



#### Mock 测试增强 🆕

```js
// 高级 Mock 功能
import { setupMocks } from 'smartlitefetch/v3';

setupMocks(client, {
  '/api/users': {
    GET: { data: [{ id: 1, name: 'Test User' }] },
    POST: (req) => ({ id: 2, ...req.body })
  },
  // 条件 Mock
  '/api/data': {
    condition: (req) => req.headers['X-Test-Mode'],
    response: { mock: true }
  }
});
```

#### 流式处理支持 🆕

```js
// 流式响应处理
const stream = await client.getStream('/api/large-data');
stream.on('data', (chunk) => {
  console.log('接收数据块:', chunk.length);
});
```





### 📝 注意事项 Notes

#### V2 (CommonJS) 注意事项
- 基于 node-fetch 2.x，使用 CommonJS 模块系统
- 兼容 Node.js 10.0.0+
- 使用 setTimeout 进行超时控制
- 适合传统的 Node.js 项目
#### V3 (ESM) 注意事项
- 基于 node-fetch 3.x，使用 ESM 模块系统
- 需要 Node.js 12.20.0+ 或在 package.json 中设置 "type": "module"
- 使用 AbortController 进行更精确的超时控制
- 支持更多响应类型（Buffer）
- 适合现代的 Node.js 项目

### 迁移指南
如果你正在从 V1 升级到 V2：

1. API 保持向后兼容
2. 新增了拦截器和重试功能
3. 改进了错误处理机制
4. 支持多版本 node-fetch

### 📋 要求 Requirements
#### V2 版本
- Node.js >= 10.0.0
- npm >= 6.0.0
- node-fetch 2.x
#### V3 版本
- Node.js >= 12.20.0
- npm >= 6.0.0
- node-fetch 3.x
- ESM 支持

### 🤝 贡献 Contributing
欢迎提交 Issue 和 Pull Request！

Fork 本仓库
创建你的特性分支 (git checkout -b feature/AmazingFeature)
提交你的修改 (git commit -m 'Add some AmazingFeature')
推送到分支 (git push origin feature/AmazingFeature)
打开一个 Pull Request

### 开发指南
~~~js
# 克隆仓库
git clone https://github.com/Mr6pets/smartlitefetch.git
cd smartlitefetch

# 安装依赖
npm install

# 测试 V2 版本
npm run test:v2

# 测试 V3 版本
npm run test:v3
~~~

### 📄 许可证 License
本项目基于 MIT 许可证开源。

### 🔗 相关链接 Links

- [npm 包](https://www.npmjs.com/package/smartlitefetch)
- [node-fetch 2.x 文档](https://github.com/node-fetch/node-fetch/tree/2.x)
- [node-fetch 3.x 文档](https://github.com/node-fetch/node-fetch)
- [GitHub 仓库](https://github.com/Mr6pets/smartlitefetch)

如果这个项目对你有帮助，请给它一个 ⭐️！