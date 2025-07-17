# smartLiteFetch

[![npm version](https://badge.fury.io/js/smartlitefetch.svg)](https://badge.fury.io/js/smartlitefetch)
[![Downloads](https://img.shields.io/npm/dm/smartlitefetch.svg)](https://www.npmjs.com/package/smartlitefetch)

## Installation

```bash
# Using npm
npm install smartlitefetch --save

# Using yarn
yarn add smartlitefetch

# Using pnpm
pnpm add smartlitefetch
```

## Version Selection
LiteFetch 2.0+ supports two module systems:
Auto-selection (recommended)
```bash
// CommonJS projects auto-use v2 (node-fetch 2.x)
const { get, post } = require('smartlitefetch');

// ESM projects auto-use v3 (node-fetch 3.x)
import { get, post } from 'smartlitefetch';
```
Manual version specification
```bash
// Force v2 (CommonJS + node-fetch 2.x)
const { get, post } = require('smartlitefetch/v2');

// Force v3 (ESM + node-fetch 3.x)
import { get, post } from 'smartlitefetch/v3';
```
Version Comparison
| Feature      | V2 (CommonJS) | V3 (ESM)   |
| :---         |    :----:     |     :----: |
| Module System| CommonJS      | ESM        |
| node-fetch Version | 2.x     | 3.x        |
| Node.js Requirement | >= 10.0.0 | >= 12.20.0 |
| Timeout Control | setTimeout | AbortController |
| Response Types | JSON/Text | JSON/Text/Buffer |
| Recommended For | Legacy Projects | Modern Projects |

### Quick Start
```js
// V2 (CommonJS)
const { get, post, put, delete: del } = require('smartlitefetch');

// V3 (ESM)
import { get, post, put, delete as del } from 'smartlitefetch';

// GET request
const users = await get('https://jsonplaceholder.typicode.com/users');
console.log(users.data);

// POST request
const newUser = await post('https://jsonplaceholder.typicode.com/users', {
  body: {
    name: 'John Doe',
    email: 'john@example.com'
  }
});
```

## API Documentation
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
### 1. Request/Response Interceptors
```javascript
// Request interceptor - Add authentication
apiClient.addRequestInterceptor((config) => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  config.headers['X-Request-ID'] = generateRequestId();
  return config;
});

// Response interceptor - Unified error handling
apiClient.addResponseInterceptor((response) => {
  if (response.status === 401) {
    // Handle unauthorized
    redirectToLogin();
  }
  return response;
});
```
### 2. Auto-Retry Mechanism
```javascript
// Auto-retry with exponential backoff
const data = await get('https://api.example.com/data', {
  retries: 5,
  retryDelay: 1000 // Initial delay 1s, doubles each retry
});
```
### 3. Timeout Control
```javascript
// V2: Using setTimeout
const data = await get('https://api.example.com/slow-endpoint', {
  timeout: 5000 // 5s timeout
});

// V3: Using AbortController (more modern)
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

const data = await get('https://api.example.com/slow-endpoint', {
  signal: controller.signal
});
```
### 4. Caching Mechanism
Enable caching to reduce duplicate requests:
```javascript
// Enable cache, set cache time to 5 minutes
const data = await get('https://api.example.com/data', {
  cache: true,
  cacheTime: 300000
});
```
### 5. Port Checking
Automatically check if the host port is open before requesting:
```javascript
// Throws error if port is unavailable
const data = await get('https://api.example.com');
```
### 6. FormData Support
Support form data and file uploads (v3 supports FormData, v2 uses URLSearchParams):
```javascript
// v3 example
const form = new FormData();
form.append('file', fs.createReadStream('file.txt'));
await post('https://api.example.com/upload', { body: form });
```
### 7. More HTTP Methods
```javascript
// PATCH request
const updated = await patch('/users/1', {
  body: { name: 'New Name' }
});
```

### Configuration Options
// ... (Keep original content)

### Error Handling
// ... (Keep original content)

### Notes
// ... (Keep original content)

### Migration Guide
// ... (Keep original content)

### Requirements
// ... (Keep original content)

### Contributing
// ... (Keep original content)

### Development Guide
// ... (Keep original content)