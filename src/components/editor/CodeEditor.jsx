import React, { useRef, useState } from 'react';
import { SAMPLE_C_PROGRAM, ALTERNATE_PROGRAMS } from '../../data/samplePrograms.js';
import { 
  Copy, Download, RotateCcw, Check, 
  Terminal, ShieldCheck, FileCode 
} from 'lucide-react';

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function highlightCCode(code) {
  const tokenPattern = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|^\s*#.*$|\b(?:void|static|float|double|int|unsigned|if|else|while|return|const|uint\d+_t|HAL_StatusTypeDef)\b|\b\d+(?:\.\d+)?f?\b)/gm;
  let html = '';
  let cursor = 0;
  for (const match of code.matchAll(tokenPattern)) {
    html += escapeHtml(code.slice(cursor, match.index));
    const token = match[0];
    const color = token.startsWith('//') || token.startsWith('/*') ? '#64748b'
      : token.startsWith('"') || token.startsWith("'") ? '#a5d6a7'
        : token.trimStart().startsWith('#') ? '#c792ea'
          : /^\d/.test(token) ? '#f6c177' : '#82aaff';
    html += `<span style="color:${color}">${escapeHtml(token)}</span>`;
    cursor = match.index + token.length;
  }
  return html + escapeHtml(code.slice(cursor));
}

export function CodeEditor({
  cCode,
  onChangeCode,
  parsedConfig
}) {
  const [copied, setCopied] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('default');
  const [editorScrollTop, setEditorScrollTop] = useState(0);
  const highlightRef = useRef(null);

  const lines = cCode.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(cCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([cCode], { type: 'text/x-csrc' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stm32h7_motor_pwm_main.c';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadPreset = (presetId) => {
    setSelectedPreset(presetId);
    const found = ALTERNATE_PROGRAMS.find(p => p.id === presetId);
    if (found) {
      onChangeCode(found.code);
    }
  };

  const handleReset = () => {
    onChangeCode(SAMPLE_C_PROGRAM);
    setSelectedPreset('default');
  };

  const handleEditorScroll = event => {
    setEditorScrollTop(event.currentTarget.scrollTop);
    if (highlightRef.current) highlightRef.current.scrollTop = event.currentTarget.scrollTop;
    if (highlightRef.current) highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0f19] text-slate-200 overflow-hidden">
      {/* Top Action Bar */}
      <div className="h-12 bg-[#111827] border-b border-slate-800 px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>STM32Cube HAL Embedded C Program</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              main.c (Target: STM32H743ZI)
            </span>
          </div>

          {/* Program Presets */}
          <div className="flex items-center gap-1.5 ml-4">
            <span className="text-xs text-slate-500">Load example:</span>
            {ALTERNATE_PROGRAMS.map(p => (
              <button
                key={p.id}
                onClick={() => handleLoadPreset(p.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  selectedPreset === p.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {p.id === 'default' ? 'Load Example Program' : p.title.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 flex items-center gap-1.5 transition"
            title="Copy Code to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>

          <button
            onClick={handleDownload}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 flex items-center gap-1.5 transition"
            title="Download C Source File"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Download .c
          </button>

          <button
            onClick={handleReset}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 flex items-center gap-1.5 transition"
            title="Reset to Default Example Program"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Reset Code
          </button>
        </div>
      </div>

      {/* Editor Body + Parser Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Code Textarea with Line Numbers */}
        <div className="flex-1 flex bg-[#090d16] overflow-hidden relative">
          {/* Line Numbers Column */}
          <div className="w-12 bg-[#070a10] border-r border-slate-800/80 text-right pr-3 select-none text-[11px] font-mono text-slate-600 overflow-hidden shrink-0">
            <div style={{ transform: `translateY(-${editorScrollTop}px)`, paddingTop: 12 }}>
              {lines.map((_, i) => <div key={i} className="leading-5 h-5">{i + 1}</div>)}
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden">
            <pre
              ref={highlightRef}
              aria-hidden="true"
              className="absolute inset-0 m-0 p-3 overflow-hidden pointer-events-none text-xs font-mono leading-5 whitespace-pre"
              style={{ tabSize: 2 }}
              dangerouslySetInnerHTML={{ __html: highlightCCode(cCode) }}
            />
            <textarea
              value={cCode}
              onChange={event => onChangeCode(event.target.value)}
              onScroll={handleEditorScroll}
              aria-label="STM32 HAL C source editor"
              spellCheck="false"
              wrap="off"
              className="absolute inset-0 w-full h-full p-3 bg-transparent text-transparent caret-slate-100 font-mono text-xs leading-5 focus:outline-none resize-none overflow-auto selection:bg-cyan-900/60"
              style={{ tabSize: 2, WebkitTextFillColor: 'transparent' }}
            />
          </div>
        </div>

        {/* Right: Real-time Configuration Parser & Diagnostics */}
        <div className="w-84 border-l border-slate-800 bg-[#0f172a] flex flex-col p-4 text-xs select-none overflow-y-auto shrink-0">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-slate-100">Live Configuration Extraction</h3>
          </div>

          {/* Architecture Disclaimer */}
          <div className="p-3 mb-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-300 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-blue-200 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Embedded Simulation Parser
            </div>
            This is not a C compiler. It checks supported configuration literals and basic brace balance; the browser runs a deterministic motor model and never executes HAL C or produces firmware binaries.
          </div>

          <div className={`px-3 py-2 mb-3 rounded-lg border text-[11px] font-semibold ${parsedConfig.isValid ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-red-950/30 border-red-800/50 text-red-300'}`}>
            {parsedConfig.isValid ? 'Supported settings ready for model simulation' : 'Configuration invalid; simulation will be blocked'}
          </div>

          {/* Parsed Variables */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Parsed Execution Settings
            </h4>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">PWM Duty Cycle:</span>
                <span className="font-mono text-cyan-400 font-bold text-sm">
                  {parsedConfig.config.dutyPercent.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Motor Speed:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {parsedConfig.config.targetRpm.toFixed(0)} RPM
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">PWM Frequency:</span>
                <span className="font-mono text-slate-300">
                  {parsedConfig.config.pwmFrequencyHz.toLocaleString()} Hz
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Trip Limit:</span>
                <span className="font-mono text-amber-400">
                  {parsedConfig.config.maxCurrentLimit.toFixed(2)} A
                </span>
              </div>
            </div>

            {/* HAL Peripherals Verification */}
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-2">
              STM32 HAL API Verification
            </h4>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">HAL_TIM_PWM_Start</span>
                {parsedConfig.config.hasPwmStart ? (
                  <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> OK</span>
                ) : (
                  <span className="text-amber-400">Missing</span>
                )}
              </div>

              <div className="p-2 bg-slate-950 rounded border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">SetPWMDutyCycle()</span>
                {parsedConfig.config.hasSetPwmFunction ? (
                  <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> OK</span>
                ) : (
                  <span className="text-amber-400">Missing</span>
                )}
              </div>

              <div className="p-2 bg-slate-950 rounded border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">ReadMotorCurrent_ADC</span>
                {parsedConfig.config.hasCurrentSensorRead ? (
                  <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> OK</span>
                ) : (
                  <span className="text-slate-500">Unused</span>
                )}
              </div>
            </div>

            {/* Diagnostics / Issues List */}
            {parsedConfig.issues.length > 0 && (
              <div className="pt-2">
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Parser Diagnostics ({parsedConfig.issues.length})
                </h4>
                <div className="space-y-1.5">
                  {parsedConfig.issues.map((iss, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded text-[11px] border ${
                        iss.type === 'error'
                          ? 'bg-red-950/40 border-red-800/60 text-red-300'
                          : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                      }`}
                    >
                      Line {iss.line}: {iss.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

