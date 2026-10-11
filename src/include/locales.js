// Veyth OJ —— 国际化词条（English / 中文）
// t('a.b.c') 支持点路径取值，并支持 {var} 占位符插值。

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', short: 'EN' },
  { value: 'zh', label: '中文', short: '中' }
];

export function getBrowserLanguage() {
  if (typeof navigator === 'undefined') return 'en';
  const lang = String(navigator.language || navigator.userLanguage || 'en').toLowerCase();
  if (lang.indexOf('zh') === 0) return 'zh';
  return 'en';
}

export const translations = {
  en: {
    app: { name: 'Veyth', subtitle: 'Online Judge' },
    common: {
      loading: 'Loading…',
      error: 'Something went wrong',
      retry: 'Retry',
      or: 'or',
      items: '{count} items',
      entries: '{count} entries',
      unknown: '—'
    },
    window: {
      minimize: 'Minimize',
      maximize: 'Maximize',
      restore: 'Restore',
      close: 'Close'
    },
    apps: {
      problems: 'Problems',
      contests: 'Contests',
      submissions: 'Submissions',
      ide: 'Online IDE',
      admin: 'Admin Console'
    },
    desktop: {
      start: 'Start',
      search: 'Search apps, settings…',
      pinned: 'Pinned',
      signOut: 'Sign out',
      language: 'Language'
    },
    language: { label: 'Language', english: 'English', chinese: '中文' },
    login: {
      brand: 'Veyth OJ',
      tagline: 'Online Judge System',
      heading: 'Sign in',
      username: 'Username',
      password: 'Password',
      submit: 'Sign in',
      submitting: 'Signing in…',
      github: 'Sign in with GitHub',
      noAccount: "Don't have an account?",
      register: 'Create one',
      success: 'Registration successful. Please sign in.',
      invalid: 'Incorrect username or password',
      missingClient: 'Please set REACT_APP_GITHUB_CLIENT_ID in .env first'
    },
    register: {
      brand: 'Veyth OJ',
      tagline: 'Create your account',
      heading: 'Create account',
      username: 'Username',
      email: 'Email',
      password: 'Password',
      confirm: 'Confirm password',
      submit: 'Create account',
      submitting: 'Creating…',
      hasAccount: 'Already have an account?',
      login: 'Sign in',
      mismatch: 'The two passwords do not match',
      success: 'Registered. Redirecting to sign in…',
      failed: 'Registration failed'
    },
    oauth: {
      missingCode: 'OAuth callback is missing the code.',
      stateFail: 'OAuth state validation failed, please retry.',
      processing: 'Processing GitHub sign-in…',
      noCredential: 'The server did not return valid credentials.',
      failed: 'GitHub sign-in failed: ',
      failedGeneric: 'GitHub OAuth sign-in failed.'
    },
    problems: {
      kicker: 'Workspace',
      title: 'Problems',
      loading: 'Loading problems…',
      empty: 'No problems yet.',
      acceptance: 'Acceptance',
      submissions: 'Submissions',
      time: 'Time',
      memory: 'Memory'
    },
    problemDetail: {
      kicker: 'Problem',
      loadingTitle: 'Loading…',
      heading: 'Problem detail',
      loading: 'Loading problem…',
      noProblem: 'No problem selected',
      description: 'Description',
      input: 'Input',
      output: 'Output',
      samples: 'Samples',
      sampleInput: 'Sample {n} Input',
      sampleOutput: 'Sample {n} Output',
      hint: 'Hint',
      submit: 'Submit',
      judging: 'Judging…',
      result: 'Result',
      viewSubmission: 'view submission #{id}',
      expected: 'Expected',
      got: 'Got'
    },
    contests: {
      kicker: 'Upcoming events',
      title: 'Contests',
      loading: 'Loading contests…',
      upcoming: 'Upcoming',
      ongoing: 'Ongoing',
      ended: 'Ended',
      organizer: 'Organizer',
      starts: 'Starts',
      ends: 'Ends',
      participants: 'Participants'
    },
    submissions: {
      kicker: 'Recent activity',
      title: 'Submissions',
      loading: 'Loading submissions…',
      empty: 'No submissions yet.',
      noSession: 'No active session yet.',
      id: 'ID',
      problem: 'Problem',
      language: 'Language',
      status: 'Status',
      passed: 'Passed',
      runtime: 'Runtime',
      memory: 'Memory',
      submitted: 'Submitted'
    },
    submissionDetail: {
      kicker: 'Submission',
      loading: 'Loading submission…',
      noSubmission: 'No submission selected',
      openProblem: 'open problem #{id}',
      status: 'Status',
      passed: 'Passed',
      runtime: 'Runtime',
      memory: 'Memory',
      language: 'Language',
      at: 'At',
      code: 'Submitted Code',
      caseResults: 'Case Results',
      case: 'Case #{n}',
      stderr: 'Stderr',
      expected: 'Expected',
      got: 'Got',
      output: 'Output',
      error: 'Error'
    },
    ide: {
      title: 'Online IDE',
      editor: 'Editor',
      console: 'Console',
      stdin: 'Standard input',
      stdinPlaceholder: 'Input sent to the program through stdin',
      timeLimit: 'Time limit (ms)',
      memoryLimit: 'Memory limit (MB)',
      run: 'Run',
      running: 'Judging…',
      clear: 'Clear',
      loadingLanguages: 'Loading languages…',
      waiting: 'Waiting for output…',
      copyStdout: 'Copy stdout',
      downloadStdout: 'Download stdout',
      copyStderr: 'Copy stderr',
      meta: 'Time: {time} ms · Exit code: {code}',
      languagesError: 'Failed to load supported languages',
      noOutput: 'Execution finished with no output',
      serverError: 'Server error: {status} - {message}',
      networkError: 'Network error: server did not respond',
      requestError: 'Request error: {message}'
    },
    profile: {
      notLoggedIn: 'Not signed in',
      goLogin: 'Go to sign in',
      admin: 'Administrator',
      avatarTitle: 'Avatar',
      upload: 'Upload from device',
      saving: 'Saving…',
      urlPlaceholder: 'Or paste an image URL (https://…)',
      applyUrl: 'Apply URL',
      reset: 'Reset to initial',
      hint: 'Uploads or URLs sync instantly to the sidebar, taskbar and top bar. If the backend has no upload endpoint yet, a local base64 avatar still renders fine.',
      accountTitle: 'Account',
      username: 'Username',
      email: 'Email',
      nickname: 'Nickname',
      accessToken: 'Access Token',
      back: 'Back to desktop',
      logout: 'Sign out',
      updated: 'Avatar updated',
      saveFailed: 'Save failed: {msg}',
      pickImage: 'Please choose an image file',
      tooLarge: 'Image must be under 4MB',
      readFailed: 'Failed to read the image',
      needUrl: 'Please enter an avatar URL',
      resetDone: 'Reset to default avatar'
    },
    avatar: {
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Sign out',
      admin: 'Administrator'
    },
    notFound: {
      title: '404 - Page not found',
      desc: 'Sorry, the page you visited does not exist.',
      back: 'Back to home'
    },
    loading: {
      connecting: 'Connecting to server…',
      issues: 'Having issues?',
      feedback: 'send feedback'
    },
    status: {
      Accepted: 'Accepted',
      'Wrong Answer': 'Wrong Answer',
      'Time Limit Exceeded': 'Time Limit Exceeded',
      'Memory Limit Exceeded': 'Memory Limit Exceeded',
      'Runtime Error': 'Runtime Error',
      'Compile Error': 'Compile Error',
      'Internal Error': 'Internal Error',
      Pending: 'Pending',
      Running: 'Running',
      Queued: 'Queued'
    }
  },

  zh: {
    app: { name: 'Veyth', subtitle: '在线判题' },
    common: {
      loading: '加载中…',
      error: '出错了',
      retry: '重试',
      or: '或',
      items: '{count} 项',
      entries: '{count} 条',
      unknown: '—'
    },
    window: {
      minimize: '最小化',
      maximize: '最大化',
      restore: '还原',
      close: '关闭'
    },
    apps: {
      problems: '题库',
      contests: '比赛',
      submissions: '提交记录',
      ide: '在线 IDE',
      admin: '管理后台'
    },
    desktop: {
      start: '开始',
      search: '搜索应用、设置…',
      pinned: '已固定',
      signOut: '退出登录',
      language: '语言'
    },
    language: { label: '语言', english: 'English', chinese: '中文' },
    login: {
      brand: 'Veyth OJ',
      tagline: '在线判题系统',
      heading: '登录',
      username: '用户名',
      password: '密码',
      submit: '登录',
      submitting: '登录中…',
      github: '使用 GitHub 登录',
      noAccount: '还没有账号？',
      register: '立即注册',
      success: '注册成功，请登录',
      invalid: '用户名或密码错误',
      missingClient: '请先在 .env 中设置 REACT_APP_GITHUB_CLIENT_ID'
    },
    register: {
      brand: 'Veyth OJ',
      tagline: '创建你的账号',
      heading: '创建账户',
      username: '用户名',
      email: '邮箱',
      password: '密码',
      confirm: '确认密码',
      submit: '注册',
      submitting: '注册中…',
      hasAccount: '已有账号？',
      login: '立即登录',
      mismatch: '两次输入的密码不一致',
      success: '注册成功，正在跳转登录…',
      failed: '注册失败'
    },
    oauth: {
      missingCode: 'OAuth 回调缺少 code。',
      stateFail: 'OAuth state 校验失败，请重试。',
      processing: '正在处理 GitHub 登录…',
      noCredential: '后端未返回有效的登录凭据。',
      failed: 'GitHub 登录失败：',
      failedGeneric: 'GitHub OAuth 登录失败。'
    },
    problems: {
      kicker: '工作台',
      title: '题库',
      loading: '正在加载题目…',
      empty: '暂无题目。',
      acceptance: '通过率',
      submissions: '提交数',
      time: '时间',
      memory: '内存'
    },
    problemDetail: {
      kicker: '题目',
      loadingTitle: '加载中…',
      heading: '题目详情',
      loading: '正在加载题目…',
      noProblem: '未选择题目',
      description: '题目描述',
      input: '输入',
      output: '输出',
      samples: '样例',
      sampleInput: '样例 {n} 输入',
      sampleOutput: '样例 {n} 输出',
      hint: '提示',
      submit: '提交',
      judging: '评测中…',
      result: '结果',
      viewSubmission: '查看提交 #{id}',
      expected: '期望',
      got: '实际'
    },
    contests: {
      kicker: '即将开始',
      title: '比赛',
      loading: '正在加载比赛…',
      upcoming: '未开始',
      ongoing: '进行中',
      ended: '已结束',
      organizer: '主办方',
      starts: '开始',
      ends: '结束',
      participants: '参与人数'
    },
    submissions: {
      kicker: '最近动态',
      title: '提交记录',
      loading: '正在加载提交记录…',
      empty: '暂无提交记录。',
      noSession: '尚未登录。',
      id: 'ID',
      problem: '题目',
      language: '语言',
      status: '状态',
      passed: '通过',
      runtime: '耗时',
      memory: '内存',
      submitted: '提交时间'
    },
    submissionDetail: {
      kicker: '提交',
      loading: '正在加载提交…',
      noSubmission: '未选择提交',
      openProblem: '打开题目 #{id}',
      status: '状态',
      passed: '通过',
      runtime: '耗时',
      memory: '内存',
      language: '语言',
      at: '时间',
      code: '提交代码',
      caseResults: '测试点结果',
      case: '测试点 #{n}',
      stderr: '标准错误',
      expected: '期望',
      got: '实际',
      output: '输出',
      error: '错误'
    },
    ide: {
      title: '在线 IDE',
      editor: '编辑器',
      console: '控制台',
      stdin: '标准输入',
      stdinPlaceholder: '通过 stdin 传递给程序',
      timeLimit: '时间限制 (ms)',
      memoryLimit: '内存限制 (MB)',
      run: '运行',
      running: '评测中…',
      clear: '清空',
      loadingLanguages: '正在加载语言…',
      waiting: '等待输出…',
      copyStdout: '复制 stdout',
      downloadStdout: '下载 stdout',
      copyStderr: '复制 stderr',
      meta: '耗时：{time} ms · 退出码：{code}',
      languagesError: '加载支持的语言失败',
      noOutput: '执行完成，无输出',
      serverError: '服务器错误：{status} - {message}',
      networkError: '网络错误：服务器无响应',
      requestError: '请求错误：{message}'
    },
    profile: {
      notLoggedIn: '未登录',
      goLogin: '去登录',
      admin: '管理员',
      avatarTitle: '头像设置',
      upload: '从本地上传',
      saving: '保存中…',
      urlPlaceholder: '或粘贴头像图片链接 (https://…)',
      applyUrl: '应用 URL',
      reset: '恢复默认（首字母）',
      hint: '提示：上传或填写 URL 后会立即同步到侧边栏、任务栏和顶部导航栏。若后端尚未开放头像上传接口，本地 base64 头像也能在前端正常显示。',
      accountTitle: '账户信息',
      username: '用户名',
      email: '邮箱',
      nickname: '昵称',
      accessToken: 'Access Token',
      back: '返回桌面',
      logout: '退出登录',
      updated: '头像已更新',
      saveFailed: '保存失败：{msg}',
      pickImage: '请选择图片文件',
      tooLarge: '图片不能超过 4MB',
      readFailed: '读取图片失败',
      needUrl: '请输入头像 URL',
      resetDone: '已恢复为默认头像'
    },
    avatar: {
      profile: '个人中心',
      settings: '设置',
      logout: '退出登录',
      admin: '管理员'
    },
    notFound: {
      title: '404 - 页面未找到',
      desc: '抱歉，您访问的页面不存在。',
      back: '返回首页'
    },
    loading: {
      connecting: '正在连接服务器…',
      issues: '遇到问题？',
      feedback: '发送反馈'
    },
    status: {
      Accepted: '通过',
      'Wrong Answer': '答案错误',
      'Time Limit Exceeded': '超时',
      'Memory Limit Exceeded': '内存超限',
      'Runtime Error': '运行错误',
      'Compile Error': '编译错误',
      'Internal Error': '内部错误',
      Pending: '等待中',
      Running: '运行中',
      Queued: '排队中'
    }
  }
};

export default translations;