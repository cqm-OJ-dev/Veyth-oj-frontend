import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

const OnlineIDE = () => {
  const [code, setCode] = useState('# 欢迎使用在线IDE\nprint("Hello, World!")');
  const [language, setLanguage] = useState('python'); // 默认语言
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://daemon.veyth.oj.cqiming.com';
  const WITH_CREDENTIALS = (process.env.REACT_APP_WITH_CREDENTIALS === 'true');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [stdin, setStdin] = useState('');
  const [returncode, setReturncode] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(null);
  const consoleRef = useRef(null);

  // 执行代码 - 发送到后端（兼容后端 sandbox 返回格式）
  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    setError('');
    setReturncode(null);
    setElapsedMs(null);

    try {
      const response = await axios.post(`${API_BASE}/judge/`, {
        code: code,
        language: language,
        input: stdin
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: WITH_CREDENTIALS // 控制是否发送 cookies
      });

      // 后端 sandbox 可能返回的格式：
      // 成功: { returncode: 0, stdout: "...", stderr: "", success: True }
      // 运行错误: { returncode: nonzero, stdout: "...", stderr: "..." }
      // 异常/其他: { error: "..." }

  const data = response.data || {};

      // 统一处理：优先处理 data.error（框架或资源错误等），
      // 始终把 stdout 作为主要输出显示；如果 stderr 存在或 returncode 非0 则作为错误信息显示。
      if (data.error) {
        setError(data.error);
        setOutput(data.stdout || '');
      } else {
        // 始终显示 stdout（如果为空则显示提示）
        setOutput(data.stdout || '程序执行完成，没有输出');
        setReturncode(typeof data.returncode !== 'undefined' ? data.returncode : null);
        setElapsedMs(typeof data.elapsed_ms !== 'undefined' ? data.elapsed_ms : null);

        // stderr 或 returncode 非0 作为错误显示（独立于 stdout）
        if (typeof data.returncode !== 'undefined' && data.returncode !== 0) {
          setError(data.stderr || `程序返回码: ${data.returncode}`);
        } else if (data.stderr) {
          setError(data.stderr);
        } else {
          setError('');
        }
      }
    } catch (err) {
      if (err.response) {
        // 请求已发出，服务器响应状态码不在2xx范围内
        setError(`服务器错误: ${err.response.status} - ${err.response.data?.error || '未知错误'}`);
      } else if (err.request) {
        // 请求已发出但没有收到响应
        setError('网络错误: 服务器无响应');
      } else {
        // 设置请求时出错
        setError(`请求错误: ${err.message}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  // 清空控制台
  const clearConsole = () => {
    setOutput('');
    setError('');
    setReturncode(null);
    setElapsedMs(null);
  };

  // 自动滚动控制台到底部
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output, error]);

  // 处理语言选择变化
  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  // copy/download helpers
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text || '');
    } catch (e) {
      console.warn('copy failed', e);
    }
  };

  const downloadText = (text, filename) => {
    const blob = new Blob([text || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      overflow: 'hidden'
    }}>
      {/* 顶部导航栏 */}
        <div style={{
          backgroundColor: '#252526',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #333'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginRight: '20px'
          }}>
            在线IDE
          </div>
          <select 
            value={language} 
            onChange={handleLanguageChange}
            style={{
          padding: '5px',
          marginRight: '10px',
          backgroundColor: '#333',
          color: 'white',
          border: '1px solid #555',
          borderRadius: '3px'
            }}
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="go">Go</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="kotlin">Kotlin</option>
            <option value="rust">Rust</option>
          </select>
          <button 
            onClick={runCode} 
            disabled={isRunning}
            style={{
          padding: '5px 10px',
          marginRight: '10px',
          backgroundColor: isRunning ? '#555' : '#0078d4',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: isRunning ? 'not-allowed' : 'pointer'
            }}
          >
            {isRunning ? '运行中...' : '运行'}
          </button>
          <button 
            onClick={clearConsole}
            style={{
          padding: '5px 10px',
          backgroundColor: '#0078d4',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
            }}
          >
            清空控制台
          </button>
        </div>

        {/* 主内容区 */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* 代码编辑器 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #333'
        }}>
          <div style={{
            padding: '8px',
            backgroundColor: '#2d2d2d',
            borderBottom: '1px solid #333'
          }}>
            代码编辑器
          </div>
          <Editor
            height="90vh"
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false }
            }}
          />
        </div>

        {/* 控制台 */}
        <div style={{
          width: '300px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '8px',
            backgroundColor: '#2d2d2d',
            borderBottom: '1px solid #333'
          }}>
            控制台输出
          </div>
          {/* stdin 输入区域 */}
          <div style={{ padding: '8px', borderBottom: '1px solid #333', backgroundColor: '#2a2a2a' }}>
            <div style={{ fontSize: '12px', marginBottom: '6px', color: '#cfcfcf' }}>标准输入 (stdin)</div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="输入将作为程序的 stdin 传入"
              style={{ width: '100%', height: '80px', backgroundColor: '#1e1e1e', color: '#d4d4d4', border: '1px solid #333', resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>
          <div
            ref={consoleRef}
            style={{
              flex: 1,
              padding: '8px',
              overflowY: 'auto',
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4'
            }}
          >
            {/* 总是显示 stdout（或默认提示） */}
            <div>{output || '等待输出...'}</div>
            {/* 执行元信息 */}
            {returncode !== null || elapsedMs !== null ? (
              <div style={{ marginTop: '8px', color: '#9cdcfe', fontSize: '12px' }}>
                {returncode !== null ? `返回码: ${returncode}` : null}
                {elapsedMs !== null ? ` ${returncode !== null ? '·' : ''} 耗时: ${elapsedMs} ms` : null}
              </div>
            ) : null}
            {/* 如有 stderr 或其他错误信息，单独显示，不覆盖 stdout */}
            {error ? (
              <div style={{
                marginTop: '8px',
                color: '#ff6b6b',
                borderTop: '1px dashed rgba(255,107,107,0.2)',
                paddingTop: '6px'
              }}>
                错误: {error}
              </div>
            ) : null}
            {/* 复制/下载 按钮 */}
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <button onClick={() => copyToClipboard(output)} style={{ padding: '4px 8px', background:'#333', color:'#fff', border:'none', borderRadius:'3px' }}>复制 stdout</button>
              <button onClick={() => downloadText(output, 'stdout.txt')} style={{ padding: '4px 8px', background:'#333', color:'#fff', border:'none', borderRadius:'3px' }}>下载 stdout</button>
              <button onClick={() => copyToClipboard(error)} style={{ padding: '4px 8px', background:'#5a2323', color:'#fff', border:'none', borderRadius:'3px' }}>复制 stderr</button>
              <button onClick={() => downloadText(error, 'stderr.txt')} style={{ padding: '4px 8px', background:'#5a2323', color:'#fff', border:'none', borderRadius:'3px' }}>下载 stderr</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineIDE;