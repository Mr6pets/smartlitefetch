// 修改导入，只保留使用的部分
 
import { create, AdvancedCache } from '../src/v3/index.js';

// 创建带有高级缓存配置的客户端
const client = create({
  cache: true,
  cacheTime: 60000, // 1分钟
  useInstanceCache: true, // 使用实例级缓存
  cacheOptions: {
    maxSize: 50,
    defaultTTL: 60000,
    cleanupInterval: 30000
  }
});

async function cacheExample() {
  console.log('=== 高级缓存示例 ===');

  // 1. 基本缓存
  console.log('\n1. 基本缓存测试');
  const start1 = Date.now();
  const response1 = await client.get('https://jsonplaceholder.typicode.com/posts/1', {
    cache: true,
    cacheTime: 30000 // 30秒
  });
  console.log(`首次请求耗时: ${Date.now() - start1}ms, 标题: ${response1.data.title}`);

  const start2 = Date.now();
  const response2 = await client.get('https://jsonplaceholder.typicode.com/posts/1', {
    cache: true
  });
  console.log(`缓存请求耗时: ${Date.now() - start2}ms, 标题: ${response2.data.title}`);

  // 2. 带标签的缓存
  console.log('\n2. 标签缓存测试');
  await client.get('https://jsonplaceholder.typicode.com/posts/2', {
    cache: true,
    cacheTags: ['posts', 'user-1']
  });
  
  await client.get('https://jsonplaceholder.typicode.com/posts/3', {
    cache: true,
    cacheTags: ['posts', 'user-2']
  });

  console.log('缓存统计:', client.getCacheStats());

  // 删除特定标签的缓存
  const deletedCount = client.deleteCacheByTag('user-1');
  console.log(`删除了 ${deletedCount} 个缓存项`);

  // 3. Stale-While-Revalidate 策略
  console.log('\n3. SWR 策略测试');
  await client.get('https://jsonplaceholder.typicode.com/posts/4', {
    cache: true,
    cacheTime: 5000, // 5秒过期
    staleWhileRevalidate: true,
    cacheMaxAge: 2000 // 2秒后标记为过期但仍可用
  });

  // 等待3秒，让缓存变为 stale
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const swrStart = Date.now();
  const swrResponse = await client.get('https://jsonplaceholder.typicode.com/posts/4', {
    cache: true,
    staleWhileRevalidate: true
  });
  console.log(`SWR 请求耗时: ${Date.now() - swrStart}ms, 标题: ${swrResponse.data.title} (应该很快，因为返回了 stale 数据)`);

  // 4. 条件请求（ETag/Last-Modified）
  console.log('\n4. 条件请求测试');
  const conditionalResponse = await client.get('https://httpbin.org/etag/test123', {
    cache: true,
    etag: 'test123'
  });
  console.log('条件请求响应状态:', conditionalResponse.status);

  // 5. 缓存统计
  console.log('\n5. 最终缓存统计');
  const stats = client.getCacheStats();
  console.log('缓存命中率:', `${(stats.hitRate * 100).toFixed(2)}%`);
  console.log('缓存大小:', `${stats.size}/${stats.maxSize}`);
  console.log('详细统计:', stats);

  // 清理
  client.clearCache();
  console.log('\n缓存已清理');
}

// 独立缓存管理器示例
async function standaloneCacheExample() {
  console.log('\n=== 独立缓存管理器示例 ===');
  
  const cache = new AdvancedCache({
    maxSize: 10,
    defaultTTL: 5000
  });

  // 存储数据
  cache.set('user:1', { id: 1, name: 'Alice' }, {
    tags: ['users'],
    ttl: 10000
  });
  
  cache.set('user:2', { id: 2, name: 'Bob' }, {
    tags: ['users', 'admins']
  });

  // 获取数据
  const user1 = cache.get('user:1');
  console.log('用户1:', user1?.data);

  // 按标签删除
  const deleted = cache.deleteByTag('admins');
  console.log(`删除了 ${deleted} 个管理员缓存`);

  // 统计信息
  console.log('缓存统计:', cache.getStats());

  // 清理
  cache.destroy();
}

// 运行示例
async function run() {
  await cacheExample();
  await standaloneCacheExample();
  process.exit(0); // 确保脚本执行后退出
}

run().catch(console.error);