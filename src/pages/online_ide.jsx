import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import './online_ide.css';

const OnlineIDE = () => {
  const [code, setCode] = useState('# Welcome to the online IDE\nprint("Hello, World!")');
  const [language, setLanguage] = useState('python');
  const API_BASE = process.env.REACT_APP_API_BASE || 'https://cqiming.pythonanywhere.com';
  const WITH_CREDENTIALS = process.env.REACT_APP_WITH_CREDENTIALS === 'true';
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [stdin, setStdin] = useState('');
  const [returncode, setReturncode] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(null);
  const consoleRef = useRef(null);

  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    setError('');
    setReturncode(null);
    setElapsedMs(null);

    try {
      const response = await axios.post(`${API_BASE}/judge/`, {
        code,
        language,
        input: stdin
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: WITH_CREDENTIALS
      });

      const data = response.data || {};

      if (data.error) {
        setError(data.error);
        setOutput(data.stdout || '');
      } else {
        setOutput(data.stdout || 'Execution finished with no output');
        setReturncode(typeof data.returncode !== 'undefined' ? data.returncode : null);
        setElapsedMs(typeof data.elapsed_ms !== 'undefined' ? data.elapsed_ms : null);

        if (typeof data.returncode !== 'undefined' && data.returncode !== 0) {
          setError(data.stderr || `Exit code: ${data.returncode}`);
        } else if (data.stderr) {
          setError(data.stderr);
        } else {
          setError('');
        }
      }
    } catch (err) {
      if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`);
      } else if (err.request) {
        setError('Network error: server did not respond');
      } else {
        setError(`Request error: ${err.message}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const clearConsole = () => {
    setOutput('');
    setError('');
    setReturncode(null);
    setElapsedMs(null);
  };

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output, error]);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

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
    <div className="ide-shell">
      <div className="ide-toolbar">
        <div className="ide-title">Online IDE</div>
        <select value={language} onChange={handleLanguageChange}>
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
        <button className="primary" onClick={runCode} disabled={isRunning}>
          {isRunning ? 'Running…' : 'Run'}
        </button>
        <button onClick={clearConsole}>Clear</button>
      </div>

      <div className="ide-main">
        <div className="ide-editor-panel">
          <div className="ide-panel-title">Editor</div>
          <div className="ide-editor-wrap">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, automaticLayout: true }}
            />
          </div>
        </div>

        <div className="ide-console-panel">
          <div className="ide-panel-title">Console</div>
          <div className="ide-console-input">
            <div style={{ fontSize: '12px', marginBottom: '6px', color: '#cbd5e1' }}>Standard input</div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Input sent to the program through stdin"
            />
          </div>
          <div ref={consoleRef} className="ide-console-content">
            <div>{output || 'Waiting for output…'}</div>
            {(returncode !== null || elapsedMs !== null) && (
              <div className="ide-console-meta">
                {returncode !== null ? `Exit code: ${returncode}` : null}
                {elapsedMs !== null ? `${returncode !== null ? ' · ' : ''}Time: ${elapsedMs} ms` : null}
              </div>
            )}
            {error ? <div className="ide-error">{error}</div> : null}
            <div className="ide-console-actions">
              <button onClick={() => copyToClipboard(output)}>Copy stdout</button>
              <button onClick={() => downloadText(output, 'stdout.txt')}>Download stdout</button>
              <button className="danger" onClick={() => copyToClipboard(error)}>Copy stderr</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineIDE;
