import 'dotenv/config';
import { create } from '../src/v3/index.js';
import { QueryBuilder } from '../src/v3/graphql.js';

// 创建带 GraphQL 支持的客户端
const client = create({
  graphql: {
    endpoint: 'https://api.github.com/graphql',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
    },
    introspection: true
  }
});

async function graphqlExample() {
  console.log('=== GraphQL 示例 ===');
  
  try {
    // 1. 简单查询
    const userQuery = `
      query GetUser($login: String!) {
        user(login: $login) {
          name
          email
          repositories(first: 5) {
            nodes {
              name
              description
            }
          }
        }
      }
    `;
    
    const userData = await client.query(userQuery, { login: 'octocat' });
    console.log('用户数据:', userData);
    
    // 2. 使用查询构建器
    const builder = new QueryBuilder();
    const builtQuery = builder
      .query('viewer', {
        login: true,
        name: true,
        repositories: {
          args: { first: 5 }, // 添加分页参数
          totalCount: true,
          nodes: {
            name: true,
            stargazerCount: true
          }
        }
      })
      .build();
    
    // 2. 使用手写查询替代 QueryBuilder
    const viewerQuery = `
      query {
        viewer {
          login
          name
          repositories(first: 5) {
            totalCount
            nodes {
              name
              stargazerCount
            }
          }
        }
      }
    `;
    
    const viewerData = await client.query(viewerQuery);
    console.log('当前用户数据:', viewerData);
    
    // 3. 内省查询
    const schema = await client.graphql.introspect();
    console.log('Schema 类型数量:', schema.types.length);
    
  } catch (error) {
    console.error('GraphQL 错误:', error.message);
    if (error.errors) {
      console.error('详细错误:', error.errors);
    }
  }
}

graphqlExample().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});