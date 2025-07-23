// 在文件顶部添加
import { fileURLToPath } from 'url';

// 导入默认实例和其他方法
import litefetch, { get, post, put, del, create, LiteFetch } from '../src/v3/index.js';

console.log('🚀 LiteFetch V3 (ESM) 示例开始\n');

// =======================================================================
// Mock 开关和统一配置
// 通过修改此变量来启用或禁用所有 Mock
const MOCK_ENABLED = true;

/**
 * 统一的 Mock 设置函数
 * @param {object} client - 需要应用 Mock 规则的 litefetch 实例
 */
function setupMocks(client) {
  if (!MOCK_ENABLED) return;

  client.enableMock();

  // 全局和默认实例的规则
  client.mockSuccess('https://jsonplaceholder.typicode.com/posts/1', { title: 'Mock 标题 - V3 测试' });
  client.mockSuccess('https://jsonplaceholder.typicode.com/posts', { id: 101, title: 'New Mock Post' }, { method: 'POST' });
  client.mockSuccess('https://jsonplaceholder.typicode.com/posts/2', { id: 2, title: 'Custom Config Mock Post' });
  client.mockError('https://httpstat.us/500', { error: 'Server Error' }, { status: 500 });
  client.mockSuccess('https://httpbin.org/delay/5', { success: true });

  // PUT 和 DELETE 请求
  client.mockSuccess('https://jsonplaceholder.typicode.com/posts/1', { title: '更新的标题 (V3)' }, { method: 'PUT' });
  client.mockSuccess('https://jsonplaceholder.typicode.com/posts/1', {}, { method: 'DELETE', status: 204 });

  // 自定义实例和拦截器使用的规则
  client.mockSuccess('https://jsonplaceholder.typicode.com/users/1', { name: 'Mock 用户 1' });
  client.mockSuccess('https://jsonplaceholder.typicode.com/users/2', { email: 'mock-for-interceptor@example.com' });
  
  // 类实例使用的规则 (使用相对路径)
  client.mockSuccess('/albums/1', { title: '类实例的 Mock 相册' });

  // 并发请求
  client.mockSuccess('https://jsonplaceholder.typicode.com/users?_limit=3', [{ id: 1 }, { id: 2 }, { id: 3 }]);
  client.mockSuccess('https://jsonplaceholder.typicode.com/posts?_limit=3', [{ id: 1 }, { id: 2 }, { id: 3 }]);
  client.mockSuccess('https://jsonplaceholder.typicode.com/albums?_limit=3', [{ id: 1 }, { id: 2 }, { id: 3 }]);
}


// 为默认实例应用 Mock
setupMocks(litefetch);



// 示例 1: 基础 GET 请求
async function basicGetExample() {
  console.log('📡 示例 1: 基础 GET 请求');
  try {
    // 使用 mockClient 而不是直接使用 get
    const response = await get('https://jsonplaceholder.typicode.com/posts/1');
    console.log('✅ 成功:', response.data.title);
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
  console.log('');
}

// 示例 2: POST 请求
async function postExample() {
  console.log('📤 示例 2: POST 请求');
  try {
    const response = await post('https://jsonplaceholder.typicode.com/posts', {
      title: 'LiteFetch V3 测试',
      body: '这是一个使用 LiteFetch V3 (ESM) 的测试请求',
      userId: 1
    });
    console.log('✅ 创建成功:', response.data.id);
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
  console.log('');
}

// 示例 3: 使用 AbortController 进行超时控制
async function abortControllerExample() {
  console.log('⏱️ 示例 3: AbortController 超时控制');
  try {
    const controller = new AbortController();
    
    // 3秒后取消请求
    setTimeout(() => {
      console.log('⚠️ 1秒后主动取消请求');
      controller.abort();
    }, 1000);
    
    const response = await get('https://httpbin.org/delay/5', {
      signal: controller.signal
    });
    console.log('✅ 请求成功:', response.status);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⚠️ 请求被取消 (演示 AbortController)');
    } else if (error.name === 'TimeoutError') {
      console.log('⚠️ 请求超时');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('⚠️ 网络连接错误');
    } else {
      console.error('❌ 错误:', error.message);
    }
  }
  console.log('');
}

// 示例 4: 自定义配置
async function customConfigExample() {
  console.log('⚙️ 示例 4: 自定义配置');
  try {
    const response = await get('https://jsonplaceholder.typicode.com/posts/2', {
      timeout: 5000,
      headers: {
        'User-Agent': 'LiteFetch-V3-Example/1.0',
        'Accept': 'application/json'
      }
    });
    console.log('✅ 自定义配置请求成功:', response.status);
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
  console.log('');
}

// 示例 5: 创建自定义实例
async function customInstanceExample() {
  console.log('🏗️ 示例 5: 创建自定义实例');
  
  const apiClient = create({
    timeout: 8000,
    retries: 2,
    headers: {
      'Authorization': 'Bearer fake-token',
      'Content-Type': 'application/json'
    }
  });
  
  // 为自定义实例应用 Mock
  setupMocks(apiClient);
  
  try {
    const response = await apiClient.get('https://jsonplaceholder.typicode.com/users/1');
    console.log('✅ 自定义实例请求成功:', response.data.name);
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
  console.log('');
}

// 示例 6: 拦截器使用
async function interceptorExample() {
  console.log('🔧 示例 6: 拦截器使用');
  
  const client = create();
  
// 为拦截器客户端实例应用 Mock
  setupMocks(client);
  
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
    console.error('❌ 错误:', error.message);
  }
  console.log('');
}

// 示例 7: 错误处理和重试
async function retryExample() {
  console.log('🔄 示例 7: 错误处理和重试');
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

// 示例 8: PUT 和 DELETE 请求
async function putDeleteExample() {
  console.log('🔄 示例 8: PUT 和 DELETE 请求');
  
  try {
    // PUT 请求
    const putResponse = await put('https://jsonplaceholder.typicode.com/posts/1', {
      id: 1,
      title: '更新的标题 (V3)',
      body: '更新的内容 (ESM)',
      userId: 1
    });
    console.log('✅ PUT 请求成功:', putResponse.data.title);
    
    // DELETE 请求 (注意 V3 中使用 del 而不是 delete)
    const deleteResponse = await del('https://jsonplaceholder.typicode.com/posts/1');
    console.log('✅ DELETE 请求成功:', deleteResponse.status);
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
  console.log('');
}

// 示例 9: 使用类实例
async function classInstanceExample() {
  console.log('🏛️ 示例 9: 使用类实例');
  
  const client = new LiteFetch({
    baseURL: 'https://jsonplaceholder.typicode.com',
    retries: 1,
    timeout: 5000
  });

// 为这个类实例应用 Mock
  setupMocks(client);
  
  try {
    const response = await client.get('/albums/1');
    console.log('✅ 类实例请求成功:', response.data.title);
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
  console.log('');
}

// 示例 10: 并发请求
async function concurrentExample() {
  console.log('⚡ 示例 10: 并发请求');
  
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
    console.error('❌ 错误:', error.message);
  }
  console.log('');
}

// 示例 11: 流式处理 (V3 特有)
async function streamExample() {
  console.log('🌊 示例 11: 流式处理');
  
  try {
    const response = await get('https://jsonplaceholder.typicode.com/posts/1', {
      // 可以处理不同类型的响应
    });
    
    console.log('✅ 响应类型:', typeof response.data);
    console.log('✅ 响应头 Content-Type:', response.headers.get('content-type'));
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
  console.log('');
}

// 检查是否有类似这样的导入或调用：
// import './debug-example.js';
// 或者
// await import('./debug-example.js');
// 运行所有示例
async function runAllExamples() {
  console.log('='.repeat(50));
  console.log('🎯 LiteFetch V3 (ESM) 完整示例');
  console.log('='.repeat(50));
  console.log('');
  
  await basicGetExample();
  await postExample();
  await abortControllerExample();
  await customConfigExample();
  await customInstanceExample();
  await interceptorExample();
  await retryExample();
  await putDeleteExample();
  await classInstanceExample();
  await concurrentExample();
  await streamExample();
  
  console.log('='.repeat(50));
  console.log('✨ 所有示例运行完成!');
  console.log('='.repeat(50));
  
  // 强制退出进程以确保脚本在 CI/CD 环境中能正常结束
  process.exit(0);
}

// 修复文件执行检测
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  runAllExamples().catch(console.error);
}

// 导出示例函数供其他文件使用
export {
  basicGetExample,
  postExample,
  abortControllerExample,
  customConfigExample,
  customInstanceExample,
  interceptorExample,
  retryExample,
  putDeleteExample,
  classInstanceExample,
  concurrentExample,
  streamExample,
  runAllExamples
};
