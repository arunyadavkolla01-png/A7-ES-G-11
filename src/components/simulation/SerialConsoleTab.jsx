import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2, Copy, Download, Search, Check, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

export function SerialConsoleTab({ logs = [], onClearLogs, simState = {} }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef(null);

  // Auto scroll when new logs arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'ALL' || log.level === filter;
    const matchesSearch = !search || log.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stm32h7_lab_telemetry_${Date.now()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full p-6 bg-[#0b0f19] text-slate-200 overflow-hidden flex flex-col">
      <div className="max-w-6xl mx-auto w-full h-full flex flex-col space-y-4">
        {/* Top Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Virtual UART Serial Console
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  USART1: 115200 baud, 8-N-1
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Live firmware output, HAL initialization notices, and physical protection alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search console..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 w-36 sm:w-48"
              />
            </div>

            {/* Level Filter Buttons */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              {['ALL', 'INFO', 'WARN', 'ERR'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setFilter(lvl)}
                  className={`px-2 py-1 rounded transition ${
                    filter === lvl ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Actions */}
            <button
              onClick={handleCopyLogs}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
              title="Copy All Logs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleDownloadLogs}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
              title="Download Log File"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClearLogs}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition"
              title="Clear Console"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Console Output Screen */}
        <div className="flex-1 rounded-2xl bg-[#070b13] border border-slate-800 p-4 font-mono text-xs overflow-y-auto flex flex-col space-y-1.5 shadow-inner">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 select-none">
              <Terminal className="w-8 h-8 mb-2 opacity-40" />
              <p>Console is clean. Run simulation or step forward to generate serial telemetry.</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              let badgeColor = 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';
              let Icon = Info;

              if (log.level === 'WARN') {
                badgeColor = 'text-amber-400 bg-amber-950/60 border-amber-800/60';
                Icon = AlertTriangle;
              } else if (log.level === 'ERR') {
                badgeColor = 'text-red-400 bg-red-950/60 border-red-800/60';
                Icon = AlertOctagon;
              }

              return (
                <div key={log.id} className="flex items-start gap-2.5 hover:bg-slate-900/40 p-1 rounded transition group">
                  <span className="text-slate-600 select-none shrink-0 text-[11px] group-hover:text-slate-500">
                    {log.timestamp}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded border text-[10px] font-bold shrink-0 flex items-center gap-1 ${badgeColor}`}>
                    <Icon className="w-2.5 h-2.5" />
                    {log.level}
                  </span>
                  <span className={`break-all leading-relaxed ${
                    log.level === 'ERR' ? 'text-red-300 font-semibold' :
                    log.level === 'WARN' ? 'text-amber-300' :
                    log.message.startsWith('[INFO]') ? 'text-emerald-300' : 'text-slate-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Footer Status Bar */}
        <div className="h-7 px-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-4">
            <span>Buffer: {logs.length} lines</span>
            <span>Speed: {Math.round(simState.rpm || 0)} RPM</span>
            <span>Armature Current: {(simState.current || 0).toFixed(2)} A</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0"
            />
            <span>Auto-Scroll</span>
          </label>
        </div>
      </div>
    </div>
  );
}

