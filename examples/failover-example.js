import { create } from '../src/v3/index.js';

// 创建带故障转移的客户端
const client = create({
  baseURLs: [
    'https://api1.example.com',
    'https://api2.example.com', 
    'https://api3.example.com'
  ],
  failoverStrategy: 'health-check',
  healthCheck: {
    healthEndpoint: '/health',
    checkInterval: 30000,
    timeout: 5000
  },
  maxRetries: 3,
  retryDelay: 1000
});

async function failoverExample() {
  console.log('=== 故障转移示例 ===');
  
  try {
    // 使用故障转移请求
    const response = await client.requestWithFailover('/api/users', {
      method: 'GET'
    });
    
    console.log('请求成功:', response.status);
    
    // 获取故障转移统计
    const stats = client.failoverManager.getStats();
    console.log('故障转移统计:', stats);
    
  } catch (error) {
    console.error('所有服务器都失败了:', error.message);
  }
}

failoverExample().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});