# smartLiteFetch

[![npm version](https://badge.fury.io/js/smartlitefetch.svg)](https://badge.fury.io/js/smartlitefetch)
[![Downloads](https://img.shields.io/npm/dm/smartlitefetch.svg)](https://www.npmjs.com/package/smartlitefetch)

一个轻量级的 Node.js HTTP 客户端，基于 node-fetch，支持 v2 (CommonJS) 和 v3 (ESM) 版本。


## 安装

```bash
npm install smartlitefetch --save
```

## 快速开始

```js
支持功能：拦截器、重试、超时、缓存、端口检查、FormData 等

// V3 (ESM) - 推荐
import { get, post, create } from 'smartlitefetch';

// 基础请求
const users = await get('https://api.example.com/users');
const newUser = await post('https://api.example.com/users', { 
  body: { name: 'John', email: 'john@example.com' } 
});

// 创建配置实例
const api = create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retries: 3,
  cache: true,
  debug: true
});

```

## API

创建实例：

```js
import { create } from 'smartlitefetch';
const api = create({ baseURL: 'https://api.example.com' });
```

更多配置见 GitHub 文档。


## ✨ 核心特性

🚀 **双版本支持**: 同时支持 CommonJS (v2) 和 ESM (v3)  
🔄 **智能重试**: 指数退避重试机制  
⚡ **高级缓存**: LRU + Stale-While-Revalidate 策略  
🎯 **GraphQL**: 内置 GraphQL 查询支持  
🛡️ **故障转移**: 多服务器自动切换  
🔍 **调试监控**: 请求追踪和性能分析  
🧪 **Mock 测试**: 强大的测试和模拟功能  
🔧 **中间件**: 灵活的请求/响应处理管道 

<hr/>


## 🎯 高级功能

**GraphQL 支持**
```js
const client = create({ graphql: { endpoint: '/graphql' } });
const result = await client.graphql('query { users { id name } }');
```

**故障转移**
```js
const client = create({
  baseURLs: ['https://api1.com', 'https://api2.com', 'https://api3.com']
});
```

**智能缓存**
```js
const data = await get('/api/data', {
  cache: { strategy: 'stale-while-revalidate', maxAge: 300000 }
});
```

详细文档和示例请查看 [GitHub 仓库](https://github.com/Mr6pets/smartlitefetch)。


## 📋 版本历史


### 🆕 v2.1.+ (最新)
- ✨ **GraphQL 支持**: 内置 GraphQL 查询客户端
- 🛡️ **故障转移**: 多服务器自动切换
- 🔍 **调试监控**: 请求追踪和性能分析
- 🧪 **Mock 测试**: 强大的测试和模拟功能
- 🔧 **中间件**: 灵活的请求/响应处理管道
- ⚡ **高级缓存**: LRU + Stale-While-Revalidate 策略


## 要求
- Node.js >= 10.0.0 (v2) 或 >= 12.20.0 (v3)

## 贡献
欢迎 PR！详情见 GitHub。