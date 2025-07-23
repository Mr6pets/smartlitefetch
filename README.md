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
// V3 (ESM)
import { get, post } from 'smartlitefetch';

// GET 请求
await get('https://api.example.com/users');

// POST 请求
await post('https://api.example.com/users', { body: { name: 'John' } });
```

支持功能：拦截器、重试、超时、缓存、端口检查、FormData 等。

详细文档和示例请查看 [GitHub 仓库](https://github.com/Mr6pets/smartlitefetch)。

## API

创建实例：

```js
import { create } from 'smartlitefetch';
const api = create({ baseURL: 'https://api.example.com' });
```

更多配置见 GitHub 文档。

## 要求
- Node.js >= 10.0.0 (v2) 或 >= 12.20.0 (v3)

## 贡献
欢迎 PR！详情见 GitHub。