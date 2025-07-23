/**
 * Mock 系统 - 用于测试和开发
 */

class MockRule {
    constructor(options = {}) {
        this.id = options.id || Math.random().toString(36).substr(2, 9);
        this.method = options.method || 'GET';
        this.url = options.url;
        this.urlPattern = options.urlPattern;
        this.response = options.response;
        this.delay = options.delay || 0;
        this.status = options.status || 200;
        this.statusText = options.statusText || 'OK';
        // 设置默认headers
        this.headers = {
            'content-type': 'application/json; charset=utf-8',
            ...options.headers
        };
        this.enabled = options.enabled !== false;
        this.once = options.once || false;
        this.used = false;
        this.priority = options.priority || 0;
        this.condition = options.condition; // 自定义匹配条件函数
    }

    matches(method, url, data) {
        if (!this.enabled || (this.once && this.used)) {
            return false;
        }

        // 检查 HTTP 方法
        if (this.method !== '*' && this.method.toUpperCase() !== method.toUpperCase()) {
            return false;
        }

        // 检查 URL 匹配
        if (this.url && this.url !== url) {
            return false;
        }

        if (this.urlPattern) {
            const regex = new RegExp(this.urlPattern);
            if (!regex.test(url)) {
                return false;
            }
        }

        // 自定义条件检查
        if (this.condition && !this.condition(method, url, data)) {
            return false;
        }

        return true;
    }

    async execute() {
        this.used = true;
        
        if (this.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.delay));
        }

        let responseData = this.response;
        if (typeof responseData === 'function') {
            responseData = await responseData();
        }
        
        // 修复：正确实现兼容Headers接口的对象
        const headersData = { ...this.headers };
        const mockHeaders = {
            get(name) {
                const key = name.toLowerCase();
                // 在所有headers中查找（不区分大小写）
                for (const [headerKey, headerValue] of Object.entries(headersData)) {
                    if (headerKey.toLowerCase() === key) {
                        return headerValue;
                    }
                }
                return null;
            },
            has(name) {
                const key = name.toLowerCase();
                return Object.keys(headersData).some(k => k.toLowerCase() === key);
            },
            entries() {
                return Object.entries(headersData);
            },
            keys() {
                return Object.keys(headersData);
            },
            values() {
                return Object.values(headersData);
            },
            forEach(callback) {
                Object.entries(headersData).forEach(([key, value]) => {
                    callback(value, key, this);
                });
            }
        };
        
        // 将原始headers数据也添加到mockHeaders对象上，以支持直接属性访问
        Object.assign(mockHeaders, headersData);

        return {
            data: responseData,
            status: this.status,
            statusText: this.statusText || 'OK',
            headers: mockHeaders,
            mock: true
        };
    }
}

class MockManager {
    constructor() {
        this.rules = new Map();
        this.enabled = false;
        this.stats = {
            totalRequests: 0,
            mockedRequests: 0,
            ruleUsage: new Map()
        };
    }

    enable() {
        this.enabled = true;
        return this;
    }

    disable() {
        this.enabled = false;
        return this;
    }

    isEnabled() {
        return this.enabled;
    }

    addRule(rule) {
        if (!(rule instanceof MockRule)) {
            rule = new MockRule(rule);
        }
        this.rules.set(rule.id, rule);
        this.stats.ruleUsage.set(rule.id, 0);
        return rule.id;
    }

    removeRule(id) {
        this.rules.delete(id);
        this.stats.ruleUsage.delete(id);
        return this;
    }

    clearRules() {
        this.rules.clear();
        this.stats.ruleUsage.clear();
        return this;
    }

    async findMatch(method, url, data) {
        this.stats.totalRequests++;
        
        if (!this.enabled) {
            return null;
        }

        // 按优先级排序规则
        const sortedRules = Array.from(this.rules.values())
            .sort((a, b) => b.priority - a.priority);

        for (const rule of sortedRules) {
            if (rule.matches(method, url, data)) {
                this.stats.mockedRequests++;
                this.stats.ruleUsage.set(rule.id, this.stats.ruleUsage.get(rule.id) + 1);
                return await rule.execute();
            }
        }

        return null;
    }

    // match方法作为findMatch的别名
    async match(url, config) {
        const method = config.method || 'GET';
        return await this.findMatch(method, url, config.body);
    }

    getStats() {
        return {
            ...this.stats,
            mockRate: this.stats.totalRequests > 0 
                ? (this.stats.mockedRequests / this.stats.totalRequests * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    // 预设 Mock 规则
    mockSuccess(url, data, options = {}) {
        return this.addRule({
            url,
            response: data,
            status: 200,
            ...options
        });
    }

    mockError(url, error, options = {}) {
        return this.addRule({
            url,
            response: error,
            status: options.status || 500,
            ...options
        });
    }

    mockDelay(url, data, delay, options = {}) {
        return this.addRule({
            url,
            response: data,
            delay,
            ...options
        });
    }

    // REST API Mock 助手
    mockRestAPI(baseUrl, resource, data = {}) {
        const rules = [];
        
        // GET /resource
        rules.push(this.addRule({
            method: 'GET',
            url: `${baseUrl}/${resource}`,
            response: Array.isArray(data) ? data : [data]
        }));
        
        // GET /resource/:id
        rules.push(this.addRule({
            method: 'GET',
            urlPattern: `${baseUrl}/${resource}/\\d+`,
            response: data
        }));
        
        // POST /resource
        rules.push(this.addRule({
            method: 'POST',
            url: `${baseUrl}/${resource}`,
            response: { ...data, id: Math.floor(Math.random() * 1000) },
            status: 201
        }));
        
        // PUT /resource/:id
        rules.push(this.addRule({
            method: 'PUT',
            urlPattern: `${baseUrl}/${resource}/\\d+`,
            response: data
        }));
        
        // DELETE /resource/:id
        rules.push(this.addRule({
            method: 'DELETE',
            urlPattern: `${baseUrl}/${resource}/\\d+`,
            response: { success: true },
            status: 204
        }));
        
        return rules;
    }
}

// 测试工具类
class TestUtils {
    constructor(liteFetch) {
        this.liteFetch = liteFetch;
        this.assertions = [];
    }

    // 断言助手
    async expectRequest(url, options = {}) {
        const startTime = Date.now();
        let response, error;
        
        try {
            response = await this.liteFetch.request(url, options);
        } catch (e) {
            error = e;
        }
        
        const duration = Date.now() - startTime;
        
        return {
            response,
            error,
            duration,
            
            toHaveStatus(status) {
                const actual = response?.status || error?.status;
                if (actual !== status) {
                    throw new Error(`Expected status ${status}, got ${actual}`);
                }
                return this;
            },
            
            toHaveData(expectedData) {
                const actual = response?.data;
                if (JSON.stringify(actual) !== JSON.stringify(expectedData)) {
                    throw new Error(`Expected data ${JSON.stringify(expectedData)}, got ${JSON.stringify(actual)}`);
                }
                return this;
            },
            
            toHaveProperty(property, value) {
                const actual = response?.data?.[property];
                if (actual !== value) {
                    throw new Error(`Expected ${property} to be ${value}, got ${actual}`);
                }
                return this;
            },
            
            toBeFasterThan(maxDuration) {
                if (duration > maxDuration) {
                    throw new Error(`Expected request to be faster than ${maxDuration}ms, took ${duration}ms`);
                }
                return this;
            },
            
            toBeSlowerThan(minDuration) {
                if (duration < minDuration) {
                    throw new Error(`Expected request to be slower than ${minDuration}ms, took ${duration}ms`);
                }
                return this;
            },
            
            toThrow(expectedError) {
                if (!error) {
                    throw new Error('Expected request to throw an error');
                }
                if (expectedError && !error.message.includes(expectedError)) {
                    throw new Error(`Expected error to contain "${expectedError}", got "${error.message}"`);
                }
                return this;
            }
        };
    }

    // 批量测试
    async runTests(tests) {
        const results = [];
        
        for (const test of tests) {
            const result = {
                name: test.name,
                passed: false,
                error: null,
                duration: 0
            };
            
            const startTime = Date.now();
            
            try {
                await test.fn();
                result.passed = true;
            } catch (error) {
                result.error = error.message;
            }
            
            result.duration = Date.now() - startTime;
            results.push(result);
        }
        
        return results;
    }

    // 性能测试
    async benchmark(url, options = {}, iterations = 100) {
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const startTime = Date.now();
            try {
                await this.liteFetch.request(url, options);
            } catch (e) { // eslint-disable-line no-unused-vars
                // 忽略错误，只测试性能
            }
            times.push(Date.now() - startTime);
        }
        
        times.sort((a, b) => a - b);
        
        return {
            iterations,
            min: times[0],
            max: times[times.length - 1],
            avg: times.reduce((a, b) => a + b, 0) / times.length,
            median: times[Math.floor(times.length / 2)],
            p95: times[Math.floor(times.length * 0.95)],
            p99: times[Math.floor(times.length * 0.99)]
        };
    }
}

export { MockRule, MockManager, TestUtils };