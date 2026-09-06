import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import {
  IDE_DEFAULT_LANGUAGE,
  IDE_DEFAULT_MEMORY_LIMIT_MB,
  IDE_DEFAULT_TIME_LIMIT_MS,
  IDE_RUN_API_URL,
  LANGUAGES_API_URL
} from '../services/authService';
import './online_ide.css';

const OnlineIDE = () => {
  const [code, setCode] = useState('# Enter your code here\n');
  const [language, setLanguage] = useState(IDE_DEFAULT_LANGUAGE);
  const [languages, setLanguages] = useState([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [stdin, setStdin] = useState('');
  const [timeLimitMs, setTimeLimitMs] = useState(IDE_DEFAULT_TIME_LIMIT_MS);
  const [memoryLimitMb, setMemoryLimitMb] = useState(IDE_DEFAULT_MEMORY_LIMIT_MB);
  const [judgment, setJudgment] = useState(null);
  const consoleRef = useRef(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axios.get(LANGUAGES_API_URL);
        const supportedLanguages = Array.isArray(response.data?.languages)
          ? response.data.languages
          : [];

        setLanguages(supportedLanguages);
        if (supportedLanguages.length > 0) {
          setLanguage((currentLanguage) => (
            supportedLanguages.some(({ value }) => value === currentLanguage)
              ? currentLanguage
              : supportedLanguages[0].value
          ));
        }
      } catch (err) {
        setError('Failed to load supported languages');
      } finally {
        setIsLoadingLanguages(false);
      }
    };

    fetchLanguages();
  }, []);

  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    setError('');
    setJudgment(null);

    try {
      const response = await axios.post(IDE_RUN_API_URL, {
        code,
        language,
        input: stdin,
        time_limit_ms: Number(timeLimitMs),
        memory_limit_mb: Number(memoryLimitMb)
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data || {};
  const compileError = data.compile_info?.stderr || data.compile_info?.message || '';

      setJudgment(data);
  setOutput(data.stdout || 'Execution finished with no output');
  setError(data.stderr || compileError);
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
    setJudgment(null);
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
        <select value={language} onChange={handleLanguageChange} disabled={isLoadingLanguages}>
          {isLoadingLanguages && <option value="">Loading languages...</option>}
          {languages.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button className="primary" onClick={runCode} disabled={isRunning}>
          {isRunning ? 'Judging...' : 'Run'}
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
            <div className="ide-limits">
              <label>
                Time limit (ms)
                <input
                  type="number"
                  min="1"
                  value={timeLimitMs}
                  onChange={(e) => setTimeLimitMs(e.target.value)}
                />
              </label>
              <label>
                Memory limit (MB)
                <input
                  type="number"
                  min="17"
                  max="2047"
                  value={memoryLimitMb}
                  onChange={(e) => setMemoryLimitMb(e.target.value)}
                />
              </label>
            </div>
          </div>
          <div ref={consoleRef} className="ide-console-content">
            <div>{output || 'Waiting for output…'}</div>
            {judgment && (
              <div className="ide-console-meta">
                Status: {judgment.status || 'Unknown'} · Time: {judgment.time_ms ?? 0} ms · Exit code: {judgment.returncode ?? 'N/A'}
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
