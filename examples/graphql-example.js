import 'dotenv/config';
import { create } from '../src/v3/index.js';
/* eslint-disable no-unused-vars */
import { QueryBuilder } from '../src/v3/graphql.js';

// 创建带 GraphQL 支持的客户端 - 使用公开的 Countries API
const client = create({
  graphql: {
    endpoint: 'https://countries.trevorblades.com/',
    headers: {
      'Content-Type': 'application/json'
    },
    introspection: true
  }
});

async function graphqlExample() {
  console.log('=== GraphQL 示例 (Countries API) ===');
  
  try {
    // 1. 查询所有国家
    const countriesQuery = `
      query GetCountries {
        countries {
          code
          name
          emoji
          currency
        }
      }
    `;
    
    const countriesData = await client.query(countriesQuery);
    
    // 调试：打印完整响应
    console.log('完整响应:', JSON.stringify(countriesData, null, 2));
    
    // 检查响应结构
    if (countriesData && countriesData.data && countriesData.data.countries) {
      console.log('前5个国家:', countriesData.data.countries.slice(0, 5));
    } else if (countriesData && countriesData.countries) {
      // 如果直接返回 countries 数组
      console.log('前5个国家:', countriesData.countries.slice(0, 5));
    } else {
      console.log('意外的响应结构:', countriesData);
    }
    
    // 2. 查询特定国家（只有在第一个查询成功时才执行）
    if (countriesData && (countriesData.data?.countries || countriesData.countries)) {
      const countryQuery = `
        query GetCountry($code: ID!) {
          country(code: $code) {
            name
            capital
            emoji
            currency
            languages {
              code
              name
            }
          }
        }
      `;
      
      const countryData = await client.query(countryQuery, { code: 'CN' });
      console.log('中国信息响应:', JSON.stringify(countryData, null, 2));
      
      if (countryData && countryData.data && countryData.data.country) {
        console.log('中国信息:', countryData.data.country);
      } else if (countryData && countryData.country) {
        console.log('中国信息:', countryData.country);
      }
    }
    
    // 3. 内省查询
    try {
      const schema = await client.graphql.introspect();
      console.log('Schema 类型数量:', schema.types.length);
    } catch (introspectError) {
      console.log('内省查询失败:', introspectError.message);
    }
    
  } catch (error) {
    console.error('GraphQL 错误:', error.message);
    if (error.errors) {
      console.error('详细错误:', error.errors);
    }
    // 打印完整错误对象以便调试
    console.error('完整错误对象:', error);
  }
}

graphqlExample().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});