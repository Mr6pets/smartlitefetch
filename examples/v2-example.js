// LiteFetch V2 (CommonJS) 使用示例
const { get, post, put, delete: del, create, LiteFetch } = require('../src/v2');
const https = require('https');

console.log('🚀 LiteFetch V2 (CommonJS) 示例开始\n');

// 示例 1: 基础 GET 请求
async function basicGetExample() {
  console.log('📡 示例 1: 基础 GET 请求');
  try {
    // 创建一个禁用 keep-alive 的 agent 来进行诊断
    const agent = new https.Agent({ keepAlive: false });
    const response = await get('https://jsonplaceholder.typicode.com/posts/1', { agent });
    console.log('✅ 成功:', response.data.title);
  } catch (error) {
    handleError(error, '基础 GET 请求');
  }
  console.log('');
}

// 示例 2: POST 请求
async function postExample() {
  console.log('📤 示例 2: POST 请求');
  try {
    const response = await post('https://jsonplaceholder.typicode.com/posts', {
      title: 'LiteFetch V2 测试',
      body: '这是一个使用 LiteFetch V2 的测试请求',
      userId: 1
    });
    console.log('✅ 创建成功:', response.data.id);
  } catch (error) {
    handleError(error, 'POST 请求');
  }
  console.log('');
}

// 示例 3: 自定义配置
async function customConfigExample() {
  console.log('⚙️ 示例 3: 自定义配置');
  try {
    const response = await get('https://jsonplaceholder.typicode.com/posts/2', {
      timeout: 5000,
      headers: {
        'User-Agent': 'LiteFetch-V2-Example/1.0',
        'Accept': 'application/json'
      }
    });
    console.log('✅ 自定义配置请求成功:', response.status);
  } catch (error) {
    handleError(error, '自定义配置请求');
  }
  console.log('');
}

// 示例 4: 创建自定义实例
async function customInstanceExample() {
  console.log('🏗️ 示例 4: 创建自定义实例');
  
  const apiClient = create({
    timeout: 8000,
    retries: 2,
    headers: {
      'Authorization': 'Bearer fake-token',
      'Content-Type': 'application/json'
    }
  });
  
  try {
    const response = await apiClient.get('https://jsonplaceholder.typicode.com/users/1');
    console.log('✅ 自定义实例请求成功:', response.data.name);
  } catch (error) {
    handleError(error, '自定义实例请求');
  }
  console.log('');
}

// 示例 5: 拦截器使用
async function interceptorExample() {
  console.log('🔧 示例 5: 拦截器使用');
  
  const client = create();
  
  // 添加请求拦截器
  client.addRequestInterceptor((config) => {
    console.log('📋 请求拦截器: 添加时间戳和请求ID');
    config.headers = config.headers || {};
    config.headers['X-Request-Time'] = new Date().toISOString();
    config.headers['X-Request-ID'] = Math.random().toString(36).substr(2, 9);
    return config;
  });
  
  // 添加响应拦截器
  client.addResponseInterceptor((response) => {
    console.log('📋 响应拦截器: 状态码', response.status, '响应时间:', new Date().toISOString());
    return response;
  });
  
  try {
    const response = await client.get('https://jsonplaceholder.typicode.com/users/2');
    console.log('✅ 拦截器示例成功:', response.data.email);
  } catch (error) {
    handleError(error, '拦截器示例');
  }
  console.log('');
}

// 示例 6: 错误处理和重试
async function retryExample() {
  console.log('🔄 示例 6: 错误处理和重试');
  try {
    // 使用一个可能失败的 URL 来演示重试
    const response = await get('https://httpstat.us/500', {
      retries: 2,
      retryDelay: 500
    });
    console.log('✅ 请求成功:', response.status);
  } catch (error) {
    console.log('⚠️ 预期的错误 (演示重试机制):', error.message);
  }
  console.log('');
}

// 示例 7: PUT 和 DELETE 请求
async function putDeleteExample() {
  console.log('🔄 示例 7: PUT 和 DELETE 请求');
  
  try {
    // PUT 请求
    const putResponse = await put('https://jsonplaceholder.typicode.com/posts/1', {
      id: 1,
      title: '更新的标题 (V2)',
      body: '更新的内容 (CommonJS)',
      userId: 1
    });
    console.log('✅ PUT 请求成功:', putResponse.data.title);
    
    // DELETE 请求
    const deleteResponse = await del('https://jsonplaceholder.typicode.com/posts/1');
    console.log('✅ DELETE 请求成功:', deleteResponse.status);
  } catch (error) {
    handleError(error, 'PUT/DELETE 请求');
  }
  console.log('');
}

// 示例 8: 使用类实例
async function classInstanceExample() {
  console.log('🏛️ 示例 8: 使用类实例');
  
  const client = new LiteFetch({
    timeout: 6000,
    retries: 1,
    validateStatus: (status) => status >= 200 && status < 400 // 自定义状态验证
  });
  
  try {
    const response = await client.get('https://jsonplaceholder.typicode.com/albums/1');
    console.log('✅ 类实例请求成功:', response.data.title);
  } catch (error) {
    handleError(error, '类实例请求');
  }
  console.log('');
}

// 新增示例 9: 并发请求
async function concurrentExample() {
  console.log('⚡ 示例 9: 并发请求');
  
  try {
    const startTime = Date.now();
    
    // 并发执行多个请求
    const [users, posts, albums] = await Promise.all([
      get('https://jsonplaceholder.typicode.com/users?_limit=3'),
      get('https://jsonplaceholder.typicode.com/posts?_limit=3'),
      get('https://jsonplaceholder.typicode.com/albums?_limit=3')
    ]);
    
    const endTime = Date.now();
    
    console.log('✅ 并发请求完成:');
    console.log(`   - 用户数: ${users.data.length}`);
    console.log(`   - 文章数: ${posts.data.length}`);
    console.log(`   - 相册数: ${albums.data.length}`);
    console.log(`   - 总耗时: ${endTime - startTime}ms`);
  } catch (error) {
    handleError(error, '并发请求');
  }
  console.log('');
}

// 统一的错误处理函数
function handleError(error, context) {
  console.error(`❌ 在 '${context}' 中发生错误`);
  if (error.code === 'ECONNRESET') {
    console.error('  - 错误类型: 连接被重置 (ECONNRESET)');
    console.error('  - 错误消息:', error.message);
    console.error('  - 这通常是由于网络问题、防火墙或服务器提前关闭连接引起的。');
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    console.error(`  - 错误类型: 网络连接错误 (${error.code})`);
    console.error('  - 错误消息:', error.message);
  } else if (error.name === 'TimeoutError') {
    console.error('  - 错误类型: 请求超时');
    console.error('  - 错误消息:', error.message);
  } else if (error.response && error.response.status >= 400) {
    console.error(`  - 错误类型: HTTP 错误 (状态码: ${error.response.status})`);
    console.error('  - 错误消息:', error.message);
  } else {
    console.error('  - 未知错误:');
    console.error('  - 错误消息:', error.message);
  }
  // 为了方便调试，打印完整的错误对象
  console.error('  - 完整错误对象:', error);
}

// 运行所有示例
async function runAllExamples() {
  console.log('='.repeat(50));
  console.log('🎯 LiteFetch V2 (CommonJS) 完整示例');
  console.log('='.repeat(50));
  console.log('');
  
  await basicGetExample();
  await postExample();
  await customConfigExample();
  await customInstanceExample();
  await interceptorExample();
  await retryExample();
  await putDeleteExample();
  await classInstanceExample();
  await concurrentExample();
  
  console.log('='.repeat(50));
  console.log('✨ 所有示例运行完成!');
  console.log('='.repeat(50));
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples().catch(console.error);
}

// 导出示例函数供其他文件使用
module.exports = {
  basicGetExample,
  postExample,
  customConfigExample,
  customInstanceExample,
  interceptorExample,
  retryExample,
  putDeleteExample,
  classInstanceExample,
  concurrentExample,
  runAllExamples,
  handleError
};