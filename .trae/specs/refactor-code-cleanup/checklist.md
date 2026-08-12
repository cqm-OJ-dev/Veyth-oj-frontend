# Checklist

- [x] `src/context/authContext.jsx` 已删除，且全局无 `AuthProvider` / `AuthContext` / `authContext` 引用残留
- [x] `src/UserAvatar.jsx` 已删除，且全局无 `UserAvatar` 引用残留
- [x] `src/App.js` 中连接检查 URL 使用 `API_BASE`，运行时解析值与原硬编码一致
- [x] `src/pages/Problems.jsx` 中 fetch URL 使用 `API_BASE`，运行时解析值与原硬编码一致
- [x] `src/pages/Admin.jsx` 中 iframe src 使用 `API_BASE`，运行时解析值与原硬编码一致
- [x] `src/pages/Login.jsx` 中登录请求 URL 使用 `API_BASE`，运行时解析值与原硬编码一致
- [x] `src/pages/Register.jsx` 中注册请求 URL 使用 `API_BASE`，运行时解析值与原硬编码一致
- [x] `src/pages/Login.jsx` 已重新格式化为常规 JSX，所有语句与逻辑未变
- [x] `src/pages/Register.jsx` 已重新格式化为常规 JSX，所有语句与逻辑未变
- [x] `src/services/authService.js` 已移除未使用的 `register` / `login` 函数及其默认导出引用
- [x] 全局无残留的 `https://cqiming.pythonanywhere.com` 硬编码（`authService.js` 中的 fallback 字符串除外）
- [x] 全局无残留的 `authService.register` / `authService.login` 调用
- [x] 项目可正常构建（`npm run build` 无编译错误，CI=true 通过）
- [x] 未改变任何业务逻辑（认证流程、请求方法/请求体、路由结构、组件行为均保持不变）
