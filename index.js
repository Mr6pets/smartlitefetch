const litefetch = require('node-fetch');

// 通用的响应处理函数
const handleResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
};

// GET请求
module.exports.get = async (url, options = {}) => {
  try {
    const response = await litefetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error(`GET request failed: ${error.message}`);
  }
};

// POST请求
module.exports.post = async (url, data, options = {}) => {
  try {
    const response = await litefetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error(`POST request failed: ${error.message}`);
  }
};

// PUT请求
module.exports.put = async (url, data, options = {}) => {
  try {
    const response = await litefetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error(`PUT request failed: ${error.message}`);
  }
};

// DELETE请求
module.exports.delete = async (url, options = {}) => {
  try {
    const response = await litefetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error(`DELETE request failed: ${error.message}`);
  }
};

// 通用请求方法
module.exports.request = async (url, options = {}) => {
  try {
    const response = await litefetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
};



