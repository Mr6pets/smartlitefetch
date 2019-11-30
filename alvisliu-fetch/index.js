// //获取输入的url值
// module.exports.get = async url => {
//   console.log(url);
// }
const fetch = require('node-fetch');

//GET请求
// async 等待模块加载完毕 函数加载 await 依次执行
module.exports.get = async url => {
  const response = await fetch(url);
  const resData = await response.json()
  return resData;
}
//POST请求
module.exports.post = async (url, data) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(data)
  });
  const resData = await response.json()
  return resData;
}

//PUT请求 url要带上id 告诉后台更新那个内容
module.exports.put = async (url, data) => {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(data)
  });
  const resData = await response.json()
  return resData;
}
//DELETE请求
module.exports.delete = async (url) => {
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-type": "application/json"
    }
  });
  const resData = await "delete done！"
  return resData;
}



