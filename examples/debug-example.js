// 在文件最开头添加
if (process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('test'))) {
  console.log('=== 调试示例 (测试模式，跳过) ===');
  process.exit(0);
}

import { create } from '../src/v3/index.js';

// 创建带调试功能的客户端
const debugClient = create({
  debug: true,
  timeout: 5000,
  retries: 2,
  cache: true,
  loggerOptions: {
    logLevel: 'debug',
    maxLogEntries: 100
  },
  monitorOptions: {
    maxTimingEntries: 50
  }
});

async function debugExample() {
  console.log('=== 调试和监控示例 ===');

  try {
    // 1. 正常请求
    console.log('\n1. 执行正常请求...');
    await debugClient.get('https://jsonplaceholder.typicode.com/posts/1', {
      cache: true,
      cacheTags: ['posts']
    });

    // 2. 缓存请求
    console.log('\n2. 执行缓存请求...');
    await debugClient.get('https://jsonplaceholder.typicode.com/posts/1', {
      cache: true
    });

    // 3. 失败请求
    console.log('\n3. 执行失败请求...');
    try {
      await debugClient.get('https://nonexistent-domain-12345.com/api', {
        timeout: 2000,
        retries: 1
      });
    } catch (error) {
      console.log('预期的错误:', error.message);
    }

    // 4. 批量请求
    console.log('\n4. 执行批量请求...');
    await debugClient.all([
      'https://jsonplaceholder.typicode.com/posts/2',
      'https://jsonplaceholder.typicode.com/posts/3'
    ]);

    // 5. 获取调试信息
    console.log('\n=== 调试信息 ===');
    const debugInfo = debugClient.getDebugInfo();
    
    console.log('\n📊 性能指标:');
    console.log(JSON.stringify(debugInfo.metrics, null, 2));
    
    console.log('\n📝 最近的日志 (最后5条):');
    const recentLogs = debugInfo.logs.slice(-5);
    recentLogs.forEach(log => {
      console.log(`[${log.level.toUpperCase()}] ${log.timestamp}: ${log.message}`);
    });
    
    console.log('\n🌐 网络请求记录:');
    debugInfo.requests.forEach(req => {
      console.log(`${req.method} ${req.url} - ${req.status || 'FAILED'} (${req.duration || 'N/A'}ms)`);
    });
    
    console.log('\n💾 缓存统计:');
    console.log(JSON.stringify(debugInfo.cacheStats, null, 2));

    // 6. 导出调试数据
    console.log('\n=== 导出调试数据 ===');
    
    // 导出为 HAR 格式（可导入浏览器开发者工具）
    const harData = debugClient.exportDebugData('har');
    console.log('\n📁 HAR 数据已生成 (前100字符):');
    console.log(harData.substring(0, 100) + '...');
    
    // 导出日志为 CSV
    const csvLogs = debugClient.exportDebugData('logs');
    console.log('\n📄 CSV 日志已生成 (前200字符):');
    console.log(csvLogs.substring(0, 200) + '...');

    // 7. 过滤和查询
    console.log('\n=== 过滤和查询 ===');
    
    // 获取错误日志
    const errorLogs = debugClient.logger.getLogs({ level: 'error' });
    console.log(`\n❌ 错误日志数量: ${errorLogs.length}`);
    
    // 获取慢请求
    const slowRequests = debugClient.monitor.getDetailedTimings({ minDuration: 100 });
    console.log(`\n🐌 慢请求 (>100ms): ${slowRequests.length}`);
    
    // 获取失败的请求
    const failedRequests = debugClient.inspector.getRequests({ status: undefined });
    console.log(`\n💥 失败请求: ${failedRequests.filter(r => r.error).length}`);

  } catch (error) {
    console.error('示例执行失败:', error);
  }
  // 注意：移除了finally块中的清理操作
}

// 实时监控示例
// 实时监控示例
function setupRealTimeMonitoring() {
  console.log('\n=== 实时监控设置 ===');
  
  // 添加请求拦截器进行实时监控
  debugClient.addRequestInterceptor((config) => {
    console.log(`🚀 [${new Date().toLocaleTimeString()}] 发起请求: ${config.method} ${config.url}`);
    return config;
  });
  
  // 添加响应拦截器进行实时监控
  debugClient.addResponseInterceptor((response) => {
    console.log(`✅ [${new Date().toLocaleTimeString()}] 响应接收: ${response.status} ${response.statusText}`);
    return response;
  });
  
  // 定期输出性能指标
   
  const monitorInterval = setInterval(() => {
    const metrics = debugClient.monitor.getMetrics();
    if (metrics.totalRequests > 0) {
      console.log(`\n📈 [${new Date().toLocaleTimeString()}] 实时指标:`);
      console.log(`   总请求: ${metrics.totalRequests}`);
      console.log(`   成功率: ${metrics.successRate}`);
      console.log(`   平均响应时间: ${metrics.averageResponseTime}`);
    }
  }, 10000); // 每10秒输出一次

  // 检查是否在测试环境
  const isTest = process.env.NODE_ENV === 'test' || process.argv.includes('--test');
  const monitorDuration = isTest ? 1000 : 5000; // 测试环境1秒，正常环境5秒
  
   setTimeout(() => {
    console.log('\n⏹️ 实时监控已停止');
    clearInterval(monitorInterval); // 添加：清理定时器
    debugClient.clearDebugData();
    console.log('🧹 调试数据已清理');
    process.exit(0); // 确保进程退出
  }, monitorDuration);
}

// 运行示例
debugExample().then(() => {
  setupRealTimeMonitoring();
}).catch(console.error);