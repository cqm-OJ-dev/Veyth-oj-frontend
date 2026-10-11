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
import { useLanguage } from '../context/languageContext';
import Icon from '../components/Icon';
import './online_ide.css';

const OnlineIDE = () => {
  const { t } = useLanguage();
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
        setError(t('ide.languagesError'));
      } finally {
        setIsLoadingLanguages(false);
      }
    };

    fetchLanguages();
    // 语言列表仅需在挂载时拉取一次，不随语言切换重跑
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  setOutput(data.stdout || t('ide.noOutput'));
  setError(data.stderr || compileError);
    } catch (err) {
      if (err.response) {
        setError(t('ide.serverError', {
          status: err.response.status,
          message: err.response.data?.error || 'Unknown error'
        }));
      } else if (err.request) {
        setError(t('ide.networkError'));
      } else {
        setError(t('ide.requestError', { message: err.message }));
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
        <div className="ide-title">{t('ide.title')}</div>
        <select value={language} onChange={handleLanguageChange} disabled={isLoadingLanguages}>
          {isLoadingLanguages && <option value="">{t('ide.loadingLanguages')}</option>}
          {languages.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button className="primary" onClick={runCode} disabled={isRunning}>
          <Icon name="play" size={15} />
          {isRunning ? t('ide.running') : t('ide.run')}
        </button>
        <button onClick={clearConsole}>
          <Icon name="trash" size={15} />
          {t('ide.clear')}
        </button>
      </div>

      <div className="ide-main">
        <div className="ide-editor-panel">
          <div className="ide-panel-title">{t('ide.editor')}</div>
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
          <div className="ide-panel-title">{t('ide.console')}</div>
          <div className="ide-console-input">
            <div className="ide-input-label">{t('ide.stdin')}</div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder={t('ide.stdinPlaceholder')}
            />
            <div className="ide-limits">
              <label>
                {t('ide.timeLimit')}
                <input
                  type="number"
                  min="1"
                  value={timeLimitMs}
                  onChange={(e) => setTimeLimitMs(e.target.value)}
                />
              </label>
              <label>
                {t('ide.memoryLimit')}
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
            <div>{output || t('ide.waiting')}</div>
            {judgment && (
              <div className="ide-console-meta">
                {t('ide.meta', {
                  time: judgment.time_ms ?? 0,
                  code: judgment.returncode ?? 'N/A'
                })}
              </div>
            )}
            {error ? <div className="ide-error">{error}</div> : null}
            <div className="ide-console-actions">
              <button onClick={() => copyToClipboard(output)}>{t('ide.copyStdout')}</button>
              <button onClick={() => downloadText(output, 'stdout.txt')}>{t('ide.downloadStdout')}</button>
              <button className="danger" onClick={() => copyToClipboard(error)}>{t('ide.copyStderr')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineIDE;
