// 高级缓存管理器

class CacheEntry {
  constructor(data, options = {}) {
    this.data = data;
    this.timestamp = Date.now();
    this.ttl = options.ttl || 300000; // 默认5分钟
    this.tags = options.tags || [];
    this.etag = options.etag;
    this.lastModified = options.lastModified;
    this.staleWhileRevalidate = options.staleWhileRevalidate || false;
    this.maxAge = options.maxAge;
    this.accessCount = 0;
    this.lastAccessed = Date.now();
  }

  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }

  isStale() {
    if (this.maxAge) {
      return Date.now() - this.timestamp > this.maxAge;
    }
    return this.isExpired();
  }

  touch() {
    this.accessCount++;
    this.lastAccessed = Date.now();
  }

  shouldRevalidate() {
    return this.staleWhileRevalidate && this.isStale();
  }
}

class AdvancedCache {
  constructor(options = {}) {
    this.storage = new Map();
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 300000;
    this.cleanupInterval = options.cleanupInterval || 60000;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    
    // 定期清理过期缓存
    this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  generateKey(url, options = {}) {
    const method = options.method || 'GET';
    const headers = JSON.stringify(options.headers || {});
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${headers}:${body}`;
  }

  get(key) {
    const entry = this.storage.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.isExpired()) {
      this.storage.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.touch();
    this.stats.hits++;
    
    return {
      data: entry.data,
      isStale: entry.isStale(),
      shouldRevalidate: entry.shouldRevalidate(),
      etag: entry.etag,
      lastModified: entry.lastModified
    };
  }

  set(key, data, options = {}) {
    // 如果缓存已满，执行LRU淘汰
    if (this.storage.size >= this.maxSize) {
      this.evictLRU();
    }

    const cacheOptions = {
      ttl: options.ttl || this.defaultTTL,
      tags: options.tags,
      etag: options.etag,
      lastModified: options.lastModified,
      staleWhileRevalidate: options.staleWhileRevalidate,
      maxAge: options.maxAge
    };

    const entry = new CacheEntry(data, cacheOptions);
    this.storage.set(key, entry);
    this.stats.sets++;
  }

  delete(key) {
    const deleted = this.storage.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  clear() {
    this.storage.clear();
  }

  // 根据标签删除缓存
  deleteByTag(tag) {
    let deletedCount = 0;
    for (const [key, entry] of this.storage.entries()) {
      if (entry.tags.includes(tag)) {
        this.storage.delete(key);
        deletedCount++;
      }
    }
    this.stats.deletes += deletedCount;
    return deletedCount;
  }

  // LRU淘汰策略
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.storage.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.storage.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  // 清理过期缓存
  cleanup() {
    let cleanedCount = 0;
    for (const [key, entry] of this.storage.entries()) {
      if (entry.isExpired()) {
        this.storage.delete(key);
        cleanedCount++;
      }
    }
    return cleanedCount;
  }

  // 获取缓存统计信息
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.storage.size,
      maxSize: this.maxSize
    };
  }

  // 销毁缓存管理器
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

export default AdvancedCache;