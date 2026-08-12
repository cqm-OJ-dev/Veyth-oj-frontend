# Tasks

- [x] Task 1: 删除死代码文件
  - [x] SubTask 1.1: 删除 `src/context/authContext.jsx`（AuthProvider/AuthContext 从未被引用）
  - [x] SubTask 1.2: 删除 `src/UserAvatar.jsx`（UserAvatar 从未被引用）

- [x] Task 2: 统一 API 地址为 API_BASE 常量
  - [x] SubTask 2.1: `src/App.js` — 将连接检查的硬编码 URL 替换为 `API_BASE`，并添加 import
  - [x] SubTask 2.2: `src/pages/Problems.jsx` — 将 fetch 的硬编码 URL 替换为 `API_BASE`，并添加 import
  - [x] SubTask 2.3: `src/pages/Admin.jsx` — 将 iframe src 的硬编码 URL 替换为 `API_BASE`，并添加 import
  - [x] SubTask 2.4: `src/pages/Login.jsx` — 将登录请求的硬编码 URL 替换为 `API_BASE`（注意：该文件已从 authService 导入 setCookie，需补充导入 API_BASE）
  - [x] SubTask 2.5: `src/pages/Register.jsx` — 将注册请求的硬编码 URL 替换为 `API_BASE`，并添加 import

- [x] Task 3: 重新格式化 Login.jsx 和 Register.jsx
  - [x] SubTask 3.1: 将 `src/pages/Login.jsx` 的逐行断开格式还原为常规 JSX 格式，保持所有语句与逻辑不变
  - [x] SubTask 3.2: 将 `src/pages/Register.jsx` 的逐行断开格式还原为常规 JSX 格式，保持所有语句与逻辑不变

- [x] Task 4: 清理 authService.js 中未使用的函数
  - [x] SubTask 4.1: 移除 `authService.js` 中从未被调用的 `register` 函数
  - [x] SubTask 4.2: 移除 `authService.js` 中从未被调用的 `login` 函数
  - [x] SubTask 4.3: 从 `authService.js` 的默认导出对象中移除 `register` 和 `login` 引用

- [x] Task 5: 验证重构未改变逻辑
  - [x] SubTask 5.1: 全局搜索确认无残留的 `https://cqiming.pythonanywhere.com` 硬编码（authService.js 中的 fallback 除外）
  - [x] SubTask 5.2: 全局搜索确认无残留的 `AuthProvider`/`AuthContext`/`UserAvatar` 引用
  - [x] SubTask 5.3: 全局搜索确认无残留的 `authService.register`/`authService.login` 调用
  - [x] SubTask 5.4: 运行 `npm run build` 构建检查，确认无编译错误

# Task Dependencies
- Task 3 可与 Task 2 并行执行（Login.jsx/Register.jsx 同时涉及两者，最终合并时注意协调）
- Task 4 独立，可与 Task 1、Task 2、Task 3 并行
- Task 5 依赖 Task 1-4 全部完成
