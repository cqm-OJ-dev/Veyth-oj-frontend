# 现有代码重构与清理 Spec

## Why
Veyth OJ 前端项目中存在死代码、重复的 API 地址硬编码、以及格式混乱的源文件。这些问题降低了可维护性和可读性，但不影响运行逻辑。本次重构在不改变任何业务逻辑的前提下，清理无用代码、统一 API 地址引用、规范代码格式。

## What Changes
- 删除从未被引用的死代码文件：`src/context/authContext.jsx`、`src/UserAvatar.jsx`
- 将 5 处硬编码的 `https://cqiming.pythonanywhere.com` 替换为从 `authService.js` 导出的 `API_BASE` 常量（运行时解析值完全相同）
- 重新格式化 `Login.jsx` 和 `Register.jsx`：将逐行断开的非标准格式还原为常规 JSX 格式（纯格式化，不改动任何语句/逻辑）
- 清理 `authService.js` 中从未被调用的 `register` / `login` 函数及默认导出中的对应引用

## Impact
- Affected code:
  - `src/context/authContext.jsx`（删除）
  - `src/UserAvatar.jsx`（删除）
  - `src/App.js`（API 地址替换）
  - `src/pages/Problems.jsx`（API 地址替换）
  - `src/pages/Login.jsx`（API 地址替换 + 格式化）
  - `src/pages/Register.jsx`（API 地址替换 + 格式化）
  - `src/pages/Admin.jsx`（API 地址替换）
  - `src/services/authService.js`（清理未使用函数）

## 约束
- **绝不改变任何业务逻辑**：不修改请求方法、请求体、响应处理流程、认证流程、路由结构、组件行为
- API 地址替换前后运行时值必须完全一致（`process.env.REACT_APP_API_BASE || 'https://cqiming.pythonanywhere.com'`）
- 格式化仅调整空白/换行，不增删任何语句或改动任何表达式

## ADDED Requirements

### Requirement: 死代码移除
系统 SHALL 不包含从未被引用的源文件。

#### Scenario: 移除 authContext
- **WHEN** 删除 `src/context/authContext.jsx`
- **THEN** 项目中无任何文件引用 `AuthProvider` / `AuthContext` / `authContext`，且构建与运行行为不变

#### Scenario: 移除 UserAvatar
- **WHEN** 删除 `src/UserAvatar.jsx`
- **THEN** 项目中无任何文件引用 `UserAvatar`，且构建与运行行为不变

### Requirement: API 地址统一
所有对后端的 API 地址引用 SHALL 使用 `authService.js` 导出的 `API_BASE` 常量，而非硬编码字符串。

#### Scenario: 替换硬编码地址
- **WHEN** 在 App.js、Problems.jsx、Login.jsx、Register.jsx、Admin.jsx 中将硬编码的 `https://cqiming.pythonanywhere.com` 替换为 `API_BASE`
- **THEN** 运行时解析得到的完整 URL 与替换前完全一致

### Requirement: 代码格式规范化
`Login.jsx` 和 `Register.jsx` SHALL 采用常规 JSX 格式，消除逐行断开的非标准排版。

#### Scenario: 格式化后语义不变
- **WHEN** 重新格式化 Login.jsx / Register.jsx
- **THEN** 格式化前后 AST 语义完全等价（相同 import、相同 state、相同 handler、相同 JSX 结构、相同请求逻辑）

### Requirement: 清理未使用的服务函数
`authService.js` SHALL 不保留从未被调用的 `register` / `login` 函数。

#### Scenario: 移除未使用函数
- **WHEN** 从 authService.js 移除 `register` 和 `login` 函数及其在默认导出对象中的引用
- **THEN** 项目中无任何文件调用这两个函数，且构建与运行行为不变
