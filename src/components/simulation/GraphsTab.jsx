import React, { useState } from 'react';
import { BarChart3, TrendingUp, Zap, Gauge, BatteryCharging } from 'lucide-react';

export function GraphsTab({ history = [], simState = {}, targetRpm = 1500 }) {
  const [activeMetric, setActiveMetric] = useState('all');

  // If no history, show placeholder with current value
  const displayHistory = history.length > 0 ? history : [
    {
      time: 0,
      rpm: simState.rpm || 0,
      current: simState.current || 0,
      voltage: simState.voltage || 0,
      powerElec: simState.powerElec || 0,
      energyWh: simState.energyWh || 0,
      efficiency: simState.efficiency || 0
    }
  ];

  const renderSvgChart = (title, key, unit, color, maxExpected, targetRef = null) => {
    const width = 540;
    const height = 180;
    const padding = { top: 25, right: 30, bottom: 30, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const values = displayHistory.map(d => d[key] ?? 0);
    const maxVal = Math.max(maxExpected, ...values) * 1.15 || 1;
    const minVal = 0;

    const times = displayHistory.map(d => d.time);
    const maxTime = Math.max(times[times.length - 1] || 1, 1);
    const minTime = times[0] || 0;
    const timeSpan = maxTime - minTime || 1;

    // Generate polyline points
    const points = displayHistory.map((d) => {
      const x = padding.left + ((d.time - minTime) / timeSpan) * chartW;
      const y = padding.top + chartH - ((d[key] - minVal) / (maxVal - minVal)) * chartH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    // Current latest value
    const latestVal = values[values.length - 1] || 0;

    // Target ref line Y if provided
    let targetY = null;
    if (targetRef !== null && targetRef <= maxVal) {
      targetY = padding.top + chartH - ((targetRef - minVal) / (maxVal - minVal)) * chartH;
    }

    return (
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <h4 className="text-xs font-semibold text-slate-200">{title}</h4>
          </div>
          <div className="flex items-center gap-2">
            {targetRef !== null && (
              <span className="text-[10px] font-mono text-slate-400">
                Target: {targetRef} {unit}
              </span>
            )}
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800" style={{ color }}>
              {typeof latestVal === 'number' ? latestVal.toFixed(1) : latestVal} {unit}
            </span>
          </div>
        </div>

        {/* SVG Graph View */}
        <div className="w-full overflow-hidden flex items-center justify-center">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = padding.top + chartH * (1 - pct);
              const value = minVal + pct * (maxVal - minVal);
              const labelVal = maxVal < 0.1 ? value.toPrecision(2) : value.toFixed(0);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {/* Target Reference Line */}
            {targetY !== null && (
              <g>
                <line
                  x1={padding.left}
                  y1={targetY}
                  x2={width - padding.right}
                  y2={targetY}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                <text
                  x={width - padding.right - 4}
                  y={targetY - 4}
                  fill="#f87171"
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  Target Ref
                </text>
              </g>
            )}

            {/* Data Line */}
            {points && (
              <>
                <polyline
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
                {/* Last point indicator dot */}
                {displayHistory.length > 0 && (
                  <circle
                    cx={padding.left + ((displayHistory[displayHistory.length - 1].time - minTime) / timeSpan) * chartW}
                    cy={padding.top + chartH - ((latestVal - minVal) / (maxVal - minVal)) * chartH}
                    r="4"
                    fill={color}
                    className="animate-pulse"
                  />
                )}
              </>
            )}

            {/* X-axis Ticks */}
            <line
              x1={padding.left}
              y1={padding.top + chartH}
              x2={width - padding.right}
              y2={padding.top + chartH}
              stroke="#334155"
              strokeWidth="1"
            />
            <text
              x={padding.left}
              y={height - 10}
              fill="#64748b"
              fontSize="9"
              fontFamily="monospace"
            >
              {minTime.toFixed(1)}s
            </text>
            <text
              x={width - padding.right}
              y={height - 10}
              fill="#64748b"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="end"
            >
              {maxTime.toFixed(1)}s
            </text>
            <text
              x={width / 2}
              y={height - 10}
              fill="#64748b"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="middle"
            >
              Simulated Time (t)
            </text>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full p-6 bg-[#0b0f19] text-slate-200 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Transient Physics Telemetry Graphs
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Time-series numerical response of the coupled electro-mechanical motor model.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
                Samples: {history.length}
            </span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setActiveMetric('all')}
                className={`px-2.5 py-1 text-xs rounded-md transition ${activeMetric === 'all' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All 4 Charts
              </button>
              <button
                onClick={() => setActiveMetric('rpm')}
                className={`px-2.5 py-1 text-xs rounded-md transition ${activeMetric === 'rpm' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                RPM Only
              </button>
              <button
                onClick={() => setActiveMetric('power')}
                className={`px-2.5 py-1 text-xs rounded-md transition ${activeMetric === 'power' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Power Only
              </button>
              <button
                onClick={() => setActiveMetric('current')}
                className={`px-2.5 py-1 text-xs rounded-md transition ${activeMetric === 'current' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Current Only
              </button>
              <button
                onClick={() => setActiveMetric('energy')}
                className={`px-2.5 py-1 text-xs rounded-md transition ${activeMetric === 'energy' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Energy Only
              </button>
            </div>
          </div>
        </div>

        {/* 2x2 Grid or Single Chart */}
        <div className={`grid gap-6 ${activeMetric === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {(activeMetric === 'all' || activeMetric === 'rpm') && (
            renderSvgChart('Rotor Speed vs Time', 'rpm', 'RPM', '#06b6d4', 2500, targetRpm)
          )}

          {(activeMetric === 'all' || activeMetric === 'current') && (
            renderSvgChart('Armature Current vs Time', 'current', 'A', '#f59e0b', 4.0, null)
          )}

          {(activeMetric === 'all' || activeMetric === 'voltage') && (
            renderSvgChart('Armature Voltage vs Time', 'voltage', 'V', '#3b82f6', 15.0, null)
          )}

          {(activeMetric === 'all' || activeMetric === 'power') && (
            renderSvgChart('Electrical Power Draw vs Time', 'powerElec', 'W', '#a855f7', 40.0, null)
          )}
          {(activeMetric === 'all' || activeMetric === 'energy') && (
            renderSvgChart('Cumulative Energy vs Time', 'energyWh', 'Wh', '#34d399', 0.01, null)
          )}
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Latest Speed</span>
            </div>
            <div className="text-lg font-mono font-bold text-cyan-400">
              {Math.round(simState.rpm || 0)} <span className="text-xs font-normal text-slate-400">RPM</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Armature Current</span>
            </div>
            <div className="text-lg font-mono font-bold text-amber-400">
              {(simState.current || 0).toFixed(2)} <span className="text-xs font-normal text-slate-400">A</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <BatteryCharging className="w-3.5 h-3.5 text-purple-400" />
              <span>Power Consumption</span>
            </div>
            <div className="text-lg font-mono font-bold text-purple-400">
              {(simState.powerElec || 0).toFixed(2)} <span className="text-xs font-normal text-slate-400">W</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conversion Efficiency</span>
            </div>
            <div className="text-lg font-mono font-bold text-emerald-400">
              {(simState.efficiency || 0).toFixed(1)} <span className="text-xs font-normal text-slate-400">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

