import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { getProblem, submitCode, pollSubmission } from '../services/judgeService';
import './ProblemDetail.css';

const LANG_OPTIONS = [
  { v: 'python', l: 'Python 3', tpl: 'def main():\n    pass\n\nif __name__ == "__main__":\n    main()\n' },
  { v: 'cpp', l: 'C++', tpl: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    return 0;\n}\n' },
  { v: 'c', l: 'C', tpl: '#include <stdio.h>\nint main(void) {\n    return 0;\n}\n' },
  { v: 'java', l: 'Java', tpl: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}\n' },
  { v: 'go', l: 'Go', tpl: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Scan()\n}\n' },
  { v: 'javascript', l: 'JavaScript', tpl: "const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\n" },
  { v: 'typescript', l: 'TypeScript', tpl: "const s: string = '';\nconsole.log(s);\n" },
  { v: 'kotlin', l: 'Kotlin', tpl: 'fun main() {\n    println("Hello")\n}\n' },
  { v: 'rust', l: 'Rust', tpl: 'fn main() {\n    println!("Hello");\n}\n' },
  { v: 'csharp', l: 'C#', tpl: 'using System;\nclass Program {\n    static void Main() {\n    }\n}\n' },
];

const STATUS_COLORS = {
  Accepted: '#14804a',
  'Wrong Answer': '#c07a00',
  'Time Limit Exceeded': '#6941c6',
  'Memory Limit Exceeded': '#6941c6',
  'Runtime Error': '#a1241e',
  'Compile Error': '#a1241e',
  'Internal Error': '#a1241e',
  Pending: '#1f6feb',
  Running: '#1f6feb',
  Queued: '#1f6feb',
};

const defaultCode = (lang) => LANG_OPTIONS.find(o => o.v === lang)?.tpl || '';

export default function ProblemDetail({ problemId, onOpenSubmission }) {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(defaultCode('python'));
  const [judging, setJudging] = useState(false);
  const [result, setResult] = useState(null);
  const [submitErr, setSubmitErr] = useState('');
  const editorRef = useRef(null);

  useEffect(() => { setCode(defaultCode(language)); }, [language]);

  useEffect(() => {
    let canceled = false;
    setLoading(true); setError(''); setProblem(null); setResult(null); setSubmitErr('');
    if (!problemId) { setLoading(false); return; }
    getProblem(problemId).then((p) => {
      if (!canceled) { setProblem(p?.problem || p); }
    }).catch((e) => {
      if (!canceled) setError(e.message || 'failed to load');
    }).finally(() => { if (!canceled) setLoading(false); });
    return () => { canceled = true; };
  }, [problemId]);

  const samples = useMemo(() => {
    const list = [];
    const raw = (problem?.samples || problem?.test_cases || []);
    for (let i = 0; i < raw.length; i++) {
      list.push({
        i: i + 1,
        in: raw[i].input ?? raw[i].in ?? '',
        out: raw[i].expected_output ?? raw[i].output ?? raw[i].out ?? ''
      });
    }
    return list;
  }, [problem]);

  const doSubmit = async () => {
    if (!problem) return;
    setJudging(true); setResult(null); setSubmitErr('');
    try {
      const r = await submitCode({ problem_id: problem.id, language, code });
      const subId = r?.submission?.id ?? r?.id;
      let final = r;
      if (subId && ['Pending','Running','Queued'].includes(r?.submission?.status || r?.status || 'Pending')) {
        final = await pollSubmission(subId, { maxWaitMs: 30000, intervalMs: 700 });
      }
      setResult(final);
    } catch (e) {
      setSubmitErr(e.message || 'submit failed');
    } finally {
      setJudging(false);
    }
  };

  const overall = result?.submission || result || null;
  const caseResults = result?.results || overall?.results || [];
  const passed = overall?.passed;
  const total = overall?.total;

  return (
    <div className="pd-root">
      <div className="pd-col pd-left">
        <div className="pd-head">
          <div>
            <p className="window-page-kicker">Problem</p>
            <h2 className="pd-title">
              {loading ? 'Loading…' : (problem ? `#${problem.id}  ${problem.title}` : 'Problem detail')}
            </h2>
          </div>
          {problem && (
            <div className="pd-tags">
              {problem.difficulty && <span className={`pd-diff ${String(problem.difficulty).toLowerCase()}`}>{problem.difficulty}</span>}
              {problem.time_limit_ms && <span className="pd-tag">{(problem.time_limit_ms / 1000).toFixed(1)}s</span>}
              {problem.memory_limit_mb && <span className="pd-tag">{problem.memory_limit_mb} MB</span>}
            </div>
          )}
        </div>

        {loading && <div className="window-page-state">Loading problem…</div>}
        {error && !loading && <div className="window-page-state error">{error}</div>}
        {!loading && !problem && !error && <div className="window-page-state">No problem selected</div>}

        {problem && (
          <div className="pd-body">
            <section className="pd-section">
              <h4>Description</h4>
              <pre className="pd-pre">{problem.description || problem.content || ''}</pre>
            </section>

            {problem.input_format && (
              <section className="pd-section">
                <h4>Input</h4>
                <pre className="pd-pre">{problem.input_format}</pre>
              </section>
            )}
            {problem.output_format && (
              <section className="pd-section">
                <h4>Output</h4>
                <pre className="pd-pre">{problem.output_format}</pre>
              </section>
            )}

            {samples.length > 0 && (
              <section className="pd-section">
                <h4>Samples</h4>
                {samples.map(s => (
                  <div key={s.i} className="pd-sample">
                    <div><strong>Sample {s.i} Input</strong></div>
                    <pre className="pd-pre">{s.in}</pre>
                    <div><strong>Sample {s.i} Output</strong></div>
                    <pre className="pd-pre">{s.out}</pre>
                  </div>
                ))}
              </section>
            )}

            {problem.hint && (
              <section className="pd-section">
                <h4>Hint</h4>
                <pre className="pd-pre">{problem.hint}</pre>
              </section>
            )}
          </div>
        )}
      </div>

      <div className="pd-col pd-right">
        <div className="pd-toolbar">
          <select
            className="pd-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={judging}
          >
            {LANG_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <button className="pd-btn primary" onClick={doSubmit} disabled={!problem || judging}>
            {judging ? 'Judging…' : 'Submit'}
          </button>
        </div>

        <div className="pd-editor">
          <Editor
            height="100%"
            defaultLanguage="python"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v ?? '')}
            onMount={(editor) => { editorRef.current = editor; }}
            options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
            loading={<div className="window-page-state">Loading editor…</div>}
          />
        </div>

        <div className="pd-result">
          <div className="pd-result-head">
            <strong>Result</strong>
            {submitErr && <span className="pd-err">{submitErr}</span>}
            {overall && !submitErr && (
              <div className="pd-result-head-2">
                <span className="pd-status" style={{ color: STATUS_COLORS[overall.status] || 'inherit' }}>
                  {overall.status || '-'}
                </span>
                <span className="pd-meta">{passed ?? '?'}/{total ?? '?'}</span>
                {typeof overall.time_ms === 'number' && <span className="pd-meta">{overall.time_ms}ms</span>}
                {typeof overall.memory_mb === 'number' && <span className="pd-meta">{overall.memory_mb}MB</span>}
                {overall.id && (
                  <button className="pd-link-btn" onClick={() => onOpenSubmission?.(overall.id)}>
                    view submission #{overall.id}
                  </button>
                )}
              </div>
            )}
          </div>

          {caseResults.length > 0 && (
            <div className="pd-cases">
              {caseResults.map((c, idx) => {
                const st = c.status || '-';
                return (
                  <div key={idx} className="pd-case">
                    <div className="pd-case-id">#{c.case ?? idx + 1}</div>
                    <div className="pd-status" style={{ color: STATUS_COLORS[st] || 'inherit' }}>{st}</div>
                    <div className="pd-case-num">{c.time_ms ?? '?'}ms</div>
                    {c.stderr ? <pre className="pd-pre small">{c.stderr}</pre> : null}
                    {c.stdout !== undefined && c.status === 'Wrong Answer' ? (
                      <div className="pd-wa">
                        <div><strong>Expected</strong><pre className="pd-pre small">{c.expected ?? (problem?.samples || [])[idx]?.out ?? ''}</pre></div>
                        <div><strong>Got</strong><pre className="pd-pre small">{c.stdout}</pre></div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
