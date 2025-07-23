/**
 * GraphQL 客户端支持
 */

class GraphQLError extends Error {
  constructor(message, errors = [], data = null) {
    super(message);
    this.name = 'GraphQLError';
    this.errors = errors;
    this.data = data;
  }
}

class GraphQLClient {
  constructor(endpoint, options = {}) {
    this.endpoint = endpoint;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };
    this.introspectionEnabled = options.introspection !== false;
    this.schema = null;
    this.httpClient = options.httpClient;
  }

  async query(query, variables = {}, options = {}) {
    return this.request({ query, variables }, options);
  }

  async mutation(mutation, variables = {}, options = {}) {
    return this.request({ query: mutation, variables }, options);
  }

  async subscription(subscription, variables = {}, options = {}) {
    // WebSocket 订阅支持（简化版）
    // variables 参数保留用于未来的 WebSocket 实现
    console.log('Subscription variables:', variables, 'Options:', options);
    throw new Error('Subscriptions require WebSocket support (not implemented in this version)');
  }

  async request(payload, options = {}) {
    const { headers, ...otherOptions } = options;
    const requestOptions = {
      method: 'POST',
      headers: {
        ...this.defaultHeaders,
        ...headers
      },
      body: payload,
      ...otherOptions
    };

    try {
      const response = await this.httpClient.request(this.endpoint, requestOptions);
      
      if (response.data.errors && response.data.errors.length > 0) {
        throw new GraphQLError(
          'GraphQL errors occurred',
          response.data.errors,
          response.data.data
        );
      }

      return response.data.data;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError(`Network error: ${error.message}`);
    }
  }

  // 查询构建器
  buildQuery(operation, fields, variables = {}) {
    const variableDefinitions = Object.keys(variables).length > 0
      ? `(${Object.entries(variables).map(([key, value]) => `$${key}: ${this.getGraphQLType(value)}`).join(', ')})`
      : '';
    
    const fieldString = this.buildFieldString(fields);
    
    return {
      query: `${operation} ${variableDefinitions} { ${fieldString} }`,
      variables
    };
  }

  buildFieldString(fields) {
    if (typeof fields === 'string') {
      return fields;
    }
    
    if (Array.isArray(fields)) {
      return fields.join(' ');
    }
    
    if (typeof fields === 'object') {
      return Object.entries(fields)
        .map(([key, value]) => {
          if (typeof value === 'object') {
            return `${key} { ${this.buildFieldString(value)} }`;
          }
          return key;
        })
        .join(' ');
    }
    
    return '';
  }

  getGraphQLType(value) {
    if (typeof value === 'string') return 'String';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'Int' : 'Float';
    }
    if (typeof value === 'boolean') return 'Boolean';
    if (Array.isArray(value)) return `[${this.getGraphQLType(value[0])}]`;
    return 'String'; // 默认类型
  }

  // 内省查询
  async introspect() {
    if (!this.introspectionEnabled) {
      throw new Error('Introspection is disabled');
    }

    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          types {
            name
            kind
            description
            fields {
              name
              type {
                name
                kind
              }
            }
          }
          queryType {
            name
          }
          mutationType {
            name
          }
          subscriptionType {
            name
          }
        }
      }
    `;

    try {
      const result = await this.query(introspectionQuery);
      this.schema = result.__schema;
      return this.schema;
    } catch (error) {
      throw new GraphQLError(`Introspection failed: ${error.message}`);
    }
  }

  // 获取 schema 信息
  getSchema() {
    return this.schema;
  }

  // 验证查询（简化版）
  validateQuery(query) {
    // 基本的语法检查
    const errors = [];
    
    if (!query.trim()) {
      errors.push('Query cannot be empty');
    }
    
    if (!query.includes('{') || !query.includes('}')) {
      errors.push('Query must contain selection set');
    }
    
    return errors;
  }

  // 批量查询
  async batchQuery(queries) {
    const batchPayload = queries.map((query, index) => ({
      id: index,
      ...query
    }));

    const response = await this.httpClient.request(this.endpoint, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: batchPayload
    });

    return response.data;
  }
}

// GraphQL 查询构建器助手
class QueryBuilder {
  constructor() {
    this.operations = [];
  }

  query(name, fields, variables = {}) {
    this.operations.push({
      type: 'query',
      name,
      fields,
      variables
    });
    return this;
  }

  mutation(name, fields, variables = {}) {
    this.operations.push({
      type: 'mutation',
      name,
      fields,
      variables
    });
    return this;
  }

  build() {
    if (this.operations.length === 0) {
      throw new Error('No operations defined');
    }

    const queries = this.operations.filter(op => op.type === 'query');
    const mutations = this.operations.filter(op => op.type === 'mutation');

    let queryString = '';
    let allVariables = {};

    if (queries.length > 0) {
      const queryFields = queries.map(q => `${q.name} { ${this.buildFields(q.fields)} }`).join(' ');
      queryString += `query { ${queryFields} }`;
      queries.forEach(q => Object.assign(allVariables, q.variables));
    }

    if (mutations.length > 0) {
      const mutationFields = mutations.map(m => `${m.name} { ${this.buildFields(m.fields)} }`).join(' ');
      queryString += `mutation { ${mutationFields} }`;
      mutations.forEach(m => Object.assign(allVariables, m.variables));
    }

    return {
      query: queryString,
      variables: allVariables
    };
  }

  buildFields(fields) {
    if (typeof fields === 'string') return fields;
    if (Array.isArray(fields)) return fields.join(' ');
    
    return Object.entries(fields)
      .map(([key, value]) => {
        if (typeof value === 'object' && !Array.isArray(value)) {
          return `${key} { ${this.buildFields(value)} }`;
        }
        return key;
      })
      .join(' ');
  }
}

export { GraphQLClient, GraphQLError, QueryBuilder };