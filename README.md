# LiteFetch

[![npm version](https://badge.fury.io/js/litefetch.svg)](https://badge.fury.io/js/litefetch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/litefetch.svg)](https://www.npmjs.com/package/litefetch)

一个简单易用的 HTTP 请求库，基于 node-fetch 封装，提供便捷的 RESTful API 调用方法。

A simple and easy-to-use HTTP request library based on node-fetch, providing convenient RESTful API calling methods.

## ✨ 特性 Features

- 🚀 **简单易用** - 简洁的 API 设计，开箱即用
- 📦 **轻量级** - 基于 node-fetch，体积小巧
- 🔄 **全面支持** - 支持所有常用的 HTTP 方法（GET, POST, PUT, DELETE）
- 🛡️ **错误处理** - 内置完善的错误处理机制
- ⚡ **现代化** - 完全支持 Promise/async-await
- 🎯 **自动解析** - 智能识别并解析 JSON 响应

## 📦 安装 Installation

```bash
npm：
npm install litefetch --save

yarn:
yarn add litefetch
```


## 🚀 快速开始 Quick Start
~~~javascript
const { get, post, put, delete: del } = require('litefetch');

// GET 请求
const users = await get('https://api.example.com/users');

// POST 请求
const newUser = await post('https://api.example.com/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT 请求
const updatedUser = await put('https://api.example.com/users/1', {
  name: 'Jane Doe'
});

// DELETE 请求
await del('https://api.example.com/users/1');
~~~

## 📖 API 文档 API Documentation
### GET 请求
~~~javascript
const { get } = require('litefetch');

// 基本用法
const data = await get('https://api.example.com/data');

// 带请求头
const data = await get('https://api.example.com/data', {
  headers: {
    'Authorization': 'Bearer token'
  }
});
~~~
### POST 请求
~~~javascript
const { post } = require('litefetch');

// 基本用法
const response = await post('https://api.example.com/data', {
  key: 'value'
});

// 带请求头
const response = await post('https://api.example.com/data', {
  key: 'value'
}, {
  headers: {
    'Content-Type': 'application/json'
  }
});
~~~
### PUT 请求
~~~javascript
const { put } = require('litefetch');

// 基本用法
const response = await put('https://api.example.com/data/1', {
  key: 'new value'
});

// 带请求头
const response = await put('https://api.example.com/data/1', {
  key: 'new value'
}, {
  headers: {
    'Content-Type': 'application/json'
  }
});
~~~
### DELETE 请求
~~~javascript
const { delete: del } = require('litefetch');

// 基本用法
const response = await del('https://api.example.com/data/1');

// 带请求头
const response = await del('https://api.example.com/data/1', {
  headers: {
    'Authorization': 'Bearer token'
  }
});
~~~
### 通用请求方法
~~~javascript
const { request } = require('litefetch');

// 自定义请求方法
const result = await request('https://api.example.com/data', {
  method: 'PATCH',
  body: JSON.stringify({ status: 'active' }),
  headers: {
    'Content-Type': 'application/json'
  }
});
~~~

### ⚙️ 配置选项 Configuration Options
所有方法都支持 node-fetch 的配置选项：
~~~javascript
const options = {
  timeout: 5000,        // 超时时间
  headers: {            // 自定义请求头
    'User-Agent': 'MyApp/1.0'
  },
  redirect: 'follow',   // 重定向策略
  compress: true        // 启用压缩
};

const data = await get('https://api.example.com/data', options);
~~~

### 错误处理
~~~javascript
const { get } = require('litefetch');

try {
  const data = await get('https://api.example.com/data');
} catch (error) {
  console.error('请求失败:', error.message);
}
~~~
### 📝 注意事项
- 本库基于 node-fetch 实现，确保你的 Node.js 版本支持 Fetch API。
- 在使用 POST, PUT, DELETE 等方法时，需要根据 API 文档设置正确的请求体格式。
- 错误处理机制会简单地将错误信息输出到控制台，你可以根据实际需求进行定制。

### 📋 要求 Requirements
- Node.js >= 10.0.0
- npm >= 6.0.0

### 🤝 贡献 Contributing
欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 ( git checkout -b feature/AmazingFeature )
3. 提交你的修改 ( git commit -m 'Add some AmazingFeature' )
4. 推送到分支 ( git push origin feature/AmazingFeature )
5. 打开一个 Pull Request
### 📄 许可证 License
本项目基于 MIT 许可证开源。

### 🔗 相关链接 Links
- npm 包
- node-fetch 文档
如果这个项目对你有帮助，请给它一个 ⭐️！