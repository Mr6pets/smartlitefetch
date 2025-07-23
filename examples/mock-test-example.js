import { create } from '../src/v3/index.js';

// 创建客户端实例
const client = create({
    baseURL: 'https://api.example.com',
    debug: { enabled: true }
});

// 启用 Mock
client.enableMock();

// 基本 Mock 示例
function basicMockExample() {
    console.log('\n=== 基本 Mock 示例 ===');
    
    // Mock 成功响应
    client.mockSuccess('/users', {
        users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
        ]
    });
    
    // Mock 错误响应
    client.mockError('/users/999', {
        error: 'User not found'
    }, { status: 404 });
    
    // Mock 延迟响应
    client.mockDelay('/slow-api', { message: 'Slow response' }, 2000);
    
    // 动态响应
    client.addMockRule({
        url: '/dynamic',
        response: () => ({
            timestamp: Date.now(),
            random: Math.random()
        })
    });
}

// REST API Mock 示例
function restAPIMockExample() {
    console.log('\n=== REST API Mock 示例 ===');
    
    // 一键 Mock 整个 REST API
    client.mockRestAPI('/api', 'posts', {
        id: 1,
        title: 'Mock Post',
        content: 'This is a mock post'
    });
}

// 条件 Mock 示例
function conditionalMockExample() {
    console.log('\n=== 条件 Mock 示例 ===');
    
    // 根据请求数据决定响应
    client.addMockRule({
        method: 'POST',
        url: '/login',
        condition: (method, url, data) => {
            return data?.username === 'admin';
        },
        response: { token: 'admin-token', role: 'admin' }
    });
    
    client.addMockRule({
        method: 'POST',
        url: '/login',
        condition: (method, url, data) => {
            return data?.username !== 'admin';
        },
        response: { error: 'Invalid credentials' },
        status: 401
    });
}

// 测试示例
async function testExample() {
    console.log('\n=== 测试示例 ===');
    
    try {
        // 检查 expectRequest 方法是否存在
        if (typeof client.expectRequest !== 'function') {
            console.log('⚠️ expectRequest 方法不可用，跳过测试');
            return;
        }
        
        // 基本断言测试
        const assertion1 = await client.expectRequest('/users');
        if (assertion1 && typeof assertion1.then === 'function') {
            await assertion1
                .toHaveStatus(200)
                .toHaveProperty('users')
                .toBeFasterThan(100);
            console.log('✓ 用户列表测试通过');
        }
        
        // 错误测试
        const assertion2 = await client.expectRequest('/users/999');
        if (assertion2 && typeof assertion2.then === 'function') {
            await assertion2
                .toHaveStatus(404)
                .toThrow('User not found');
            console.log('✓ 用户不存在测试通过');
        }
        
        // 延迟测试
        const assertion3 = await client.expectRequest('/slow-api');
        if (assertion3 && typeof assertion3.then === 'function') {
            await assertion3
                .toHaveStatus(200)
                .toBeSlowerThan(1500);
            console.log('✓ 慢速 API 测试通过');
        }
        
    } catch (error) {
        console.error('✗ 测试失败:', error.message);
    }
}

// 批量测试示例
async function batchTestExample() {
    console.log('\n=== 批量测试示例 ===');
    
    // 检查 runTests 方法是否存在
    if (typeof client.runTests !== 'function') {
        console.log('⚠️ runTests 方法不可用，跳过批量测试');
        return;
    }
    
    const tests = [
        {
            name: '获取用户列表',
            fn: async () => {
                const assertion = await client.expectRequest('/users');
                if (assertion && typeof assertion.toHaveStatus === 'function') {
                    await assertion.toHaveStatus(200);
                }
            }
        },
        {
            name: '获取不存在的用户',
            fn: async () => {
                const assertion = await client.expectRequest('/users/999');
                if (assertion && typeof assertion.toHaveStatus === 'function') {
                    await assertion.toHaveStatus(404);
                }
            }
        },
        {
            name: '动态响应测试',
            fn: async () => {
                const response1 = await client.get('/dynamic');
                const response2 = await client.get('/dynamic');
                if (response1.data.timestamp === response2.data.timestamp) {
                    throw new Error('动态响应应该不同');
                }
            }
        }
    ];
    
    try {
        const results = await client.runTests(tests);
        
        console.log('测试结果:');
        if (Array.isArray(results)) {
            results.forEach(result => {
                const status = result.passed ? '✓' : '✗';
                console.log(`${status} ${result.name} (${result.duration}ms)`);
                if (!result.passed) {
                    console.log(`  错误: ${result.error}`);
                }
            });
        } else {
            console.log('⚠️ 测试结果格式异常');
        }
    } catch (error) {
        console.error('批量测试执行失败:', error.message);
    }
}

// 运行所有示例
async function runAllExamples() {
    try {
        basicMockExample();
        restAPIMockExample();
        conditionalMockExample();
        
        await testExample();
        await batchTestExample();
        await benchmarkExample();
        
        // 显示 Mock 统计
        console.log('\n=== Mock 统计 ===');
        if (typeof client.getMockStats === 'function') {
            console.log(client.getMockStats());
        } else {
            console.log('⚠️ getMockStats 方法不可用');
        }
    } catch (error) {
        console.error('示例执行失败:', error.message);
    } finally {
        // 确保程序退出
        process.exit(0);
    }
}

runAllExamples().catch((error) => {
    console.error('运行失败:', error.message);
    process.exit(1);
});

// 性能测试示例
async function benchmarkExample() {
    console.log('\n=== 性能测试示例 ===');
    
    try {
        // 检查 benchmark 方法是否存在
        if (typeof client.benchmark !== 'function') {
            console.log('⚠️ benchmark 方法不可用，跳过性能测试');
            return;
        }
        
        const result = await client.benchmark('/users', {}, 50);
        
        // 检查结果是否有效
        if (!result || typeof result !== 'object') {
            console.log('⚠️ 性能测试结果无效');
            return;
        }
        
        console.log('性能测试结果:');
        console.log(`迭代次数: ${result.iterations || 'N/A'}`);
        console.log(`最小时间: ${result.min || 'N/A'}ms`);
        console.log(`最大时间: ${result.max || 'N/A'}ms`);
        console.log(`平均时间: ${result.avg ? result.avg.toFixed(2) : 'N/A'}ms`);
        console.log(`中位数: ${result.median || 'N/A'}ms`);
        console.log(`95分位: ${result.p95 || 'N/A'}ms`);
        console.log(`99分位: ${result.p99 || 'N/A'}ms`);
    } catch (error) {
        console.error('性能测试执行失败:', error.message);
    }
}