# LiteFetch

[![npm version](https://badge.fury.io/js/litefetch.svg)](https://badge.fury.io/js/litefetch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/litefetch.svg)](https://www.npmjs.com/package/litefetch)

一个强大的 HTTP 请求库，同时支持 node-fetch 2.x 和 3.x 版本，提供便捷的 RESTful API 调用方法。

A powerful HTTP request library with support for both node-fetch 2.x and 3.x, providing convenient RESTful API calling methods.

## ✨ 特性 Features

- 🚀 **简单易用** - 简洁的 API 设计，开箱即用
- 📦 **轻量级** - 基于 node-fetch，体积小巧
- 🔄 **全面支持** - 支持所有常用的 HTTP 方法（GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS）
- 🛡️ **错误处理** - 内置完善的错误处理机制
- ⚡ **现代化** - 完全支持 Promise/async-await
- 🎯 **自动解析** - 智能识别并解析 JSON 响应
- 🔧 **多版本兼容** - 同时支持 CommonJS (v2) 和 ESM (v3) 模块系统
- 🔄 **自动重试** - 内置指数退避重试机制
- 📡 **拦截器支持** - 请求和响应拦截器
- ⏱️ **超时控制** - 灵活的超时设置

## 📦 安装 Installation

```bash
# 使用 npm
npm install litefetch --save

# 使用 yarn
yarn add litefetch

# 使用 pnpm
pnpm add litefetch
```

## 🔧 版本选择 Version Selection
LiteFetch 2.0+ 支持两种模块系统：
自动选择（推荐）
```bash
// CommonJS 项目自动使用 v2 (node-fetch 2.x)
const { get, post } = require('litefetch');

// ESM 项目自动使用 v3 (node-fetch 3.x)
import { get, post } from 'litefetch';
```
手动指定版本
```bash
// 强制使用 v2 (CommonJS + node-fetch 2.x)
const { get, post } = require('litefetch/v2');

// 强制使用 v3 (ESM + node-fetch 3.x)
import { get, post } from 'litefetch/v3';
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

### 🚀 快速开始 Quick Start
~~~js
// V2 (CommonJS)
const { get, post, put, delete: del } = require('litefetch');

// V3 (ESM)
import { get, post, put, delete as del } from 'litefetch';

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

// PUT 请求
const updatedUser = await put('https://jsonplaceholder.typicode.com/users/1', {
  body: {
    name: 'Jane Doe',
    email: 'jane@example.com'
  }
});

// DELETE 请求
const result = await del('https://jsonplaceholder.typicode.com/users/1');
~~~


## 📖 API 文档 API Documentation
~~~js
// V2
const { create } = require('litefetch');

// V3
import { create } from 'litefetch';

const apiClient = create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retries: 3,
  headers: {
    'Authorization': 'Bearer your-token',
    'User-Agent': 'MyApp/1.0'
  }
});
~~~
### 1.请求/响应拦截器
~~~javascript
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
~~~
### 2. 自动重试机制
~~~javascript
// 自动重试，指数退避
const data = await get('https://api.example.com/data', {
  retries: 5,
  retryDelay: 1000 // 初始延迟 1 秒，每次重试翻倍
});
~~~
### 3.超时控制
~~~javascript
// V2: 使用 setTimeout
const data = await get('https://api.example.com/slow-endpoint', {
  timeout: 5000 // 5秒超时
});

// V3: 使用 AbortController (更现代)
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

const data = await get('https://api.example.com/slow-endpoint', {
  signal: controller.signal
});;
~~~
### 4.超时控制
~~~javascript
// 设置超时时间
const data = await get('https://api.example.com/slow-endpoint', {
  timeout: 5000 // 5秒超时
});
~~~
### 5.更多 HTTP 方法
~~~javascript
// PATCH 请求
const updated = await patch('/users/1', {
  body: { name: 'New Name' }
});

// HEAD 请求
const headers = await head('/users/1');
console.log(headers.headers);

// OPTIONS 请求
const options = await options('/api/endpoint');
console.log(options.headers.get('Allow'));
~~~


### ⚙️ 配置选项 Configuration Options
所有方法都支持 node-fetch 的配置选项：
~~~javascript
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
~~~

### 错误处理
~~~javascript
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
~~~
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
git clone https://github.com/your-username/litefetch.git
cd litefetch

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

- npm 包
- node-fetch 2.x 文档
- node-fetch 3.x 文档
- GitHub 仓库

如果这个项目对你有帮助，请给它一个 ⭐️！