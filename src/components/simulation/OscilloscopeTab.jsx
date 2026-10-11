import React, { useState } from 'react';
import { Activity } from 'lucide-react';

export function OscilloscopeTab({ state = {}, motorParams = {} }) {
  const [timebaseUs, setTimebaseUs] = useState(50);
  const [ch1VoltsDiv, setCh1VoltsDiv] = useState(1.0);
  const [ch2VoltsDiv, setCh2VoltsDiv] = useState(5.0);
  const [showCh1, setShowCh1] = useState(true);
  const [showCh2, setShowCh2] = useState(true);
  const [showCurrent, setShowCurrent] = useState(true);

  const dutyPercent = state.dutyPercent ?? 40.0;
  const frequencyHz = state.pwmFrequencyHz ?? 20000;
  const periodUs = 1_000_000 / frequencyHz;
  const onTimeUs = (dutyPercent / 100.0) * periodUs;

  const screenWidth = 640;
  const screenHeight = 320;
  const numDivX = 10;
  const numDivY = 8;
  const divWidth = screenWidth / numDivX;
  const divHeight = screenHeight / numDivY;

  const totalScreenUs = timebaseUs * 10;

  const pointsCh1 = [];
  const pointsCh2 = [];
  const pointsCurrent = [];

  const numPoints = 600;
  const dutyFraction = Math.max(0, Math.min(1, dutyPercent / 100));
  const supplyVoltage = state.supplyVoltage ?? 12;
  const inductance = Math.max(1e-6, motorParams.inductance ?? 0.0018);
  const currentRipple = (supplyVoltage * dutyFraction * (1 - dutyFraction)) / (frequencyHz * inductance);
  for (let i = 0; i <= numPoints; i++) {
    const tUs = (i / numPoints) * totalScreenUs;
    const tMod = tUs % periodUs;
    const isHigh = tMod < onTimeUs && dutyFraction > 0;

    const x = (tUs / totalScreenUs) * screenWidth;

    // CH1 Logic: 0 to 3.3V
    const ch1Voltage = isHigh ? 3.3 : 0.0;
    const y1 = 180 - (ch1Voltage / ch1VoltsDiv) * divHeight;
    pointsCh1.push(`${x.toFixed(1)},${y1.toFixed(1)}`);

    // CH2 Motor Terminal: 0 to 12V
    const ch2Voltage = isHigh ? supplyVoltage : -0.45;
    const y2 = 280 - (ch2Voltage / ch2VoltsDiv) * divHeight;
    pointsCh2.push(`${x.toFixed(1)},${y2.toFixed(1)}`);

    // Current ripple
    const ripplePhase = isHigh
      ? tMod / Math.max(onTimeUs, 1e-9)
      : 1.0 - (tMod - onTimeUs) / Math.max(periodUs - onTimeUs, 1e-9);
    const instCurrent = Math.max(0, (state.current ?? 0) + (ripplePhase - 0.5) * currentRipple);
    const yI = 100 - (instCurrent / 1.0) * (divHeight * 0.7);
    pointsCurrent.push(`${x.toFixed(1)},${yI.toFixed(1)}`);
  }

  return (
    <div className="w-full h-full p-6 bg-[#0b0f19] text-slate-200 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Oscilloscope Chassis Frame */}
        <div className="p-6 rounded-3xl bg-[#131927] border-2 border-slate-700/80 shadow-2xl">
          {/* Top Scope Header Bar */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800/80 text-cyan-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  DSO-H743 High-Speed Virtual Oscilloscope
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
                    Model Signal View
                  </span>
                </h3>
                <span className="text-xs text-slate-400">
                  Software trigger: TIM1_CH1 rising edge
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span>CH1: PA8 Logic (3.3V)</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>CH2: Motor Coil (12V)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>CH3: Estimated Current</span>
              </div>
            </div>
          </div>

          {/* CRT Screen Display Area */}
          <div className="relative rounded-2xl bg-[#030914] border-2 border-slate-800 p-2 overflow-hidden shadow-inner">
            <svg
              viewBox={`0 0 ${screenWidth} ${screenHeight}`}
              className="w-full h-[360px] block"
            >
              <defs>
                <pattern id="scope-grid" width={divWidth} height={divHeight} patternUnits="userSpaceOnUse">
                  <path
                    d={`M ${divWidth} 0 L 0 0 0 ${divHeight}`}
                    fill="none"
                    stroke="rgba(30, 58, 138, 0.3)"
                    strokeWidth="1"
                  />
                  <line x1={divWidth / 2} y1={0} x2={divWidth / 2} y2={divHeight} stroke="rgba(30, 58, 138, 0.15)" strokeWidth="0.5" strokeDasharray="1 3" />
                  <line x1={0} y1={divHeight / 2} x2={screenWidth} y2={divHeight / 2} stroke="rgba(30, 58, 138, 0.15)" strokeWidth="0.5" strokeDasharray="1 3" />
                </pattern>
              </defs>

              <rect width={screenWidth} height={screenHeight} fill="url(#scope-grid)" />

              <line x1={0} y1={screenHeight / 2} x2={screenWidth} y2={screenHeight / 2} stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" />
              <line x1={screenWidth / 2} y1={0} x2={screenWidth / 2} y2={screenHeight} stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" />

              {showCh1 && (
                <polyline
                  points={pointsCh1.join(' ')}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]"
                />
              )}

              {showCh2 && (
                <polyline
                  points={pointsCh2.join(' ')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  className="drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]"
                />
              )}

              {showCurrent && (
                <polyline
                  points={pointsCurrent.join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  className="drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]"
                />
              )}

              {/* Screen On-Screen Display (OSD) Telemetry */}
              <text x="14" y="24" fill="#06b6d4" fontSize="11" fontFamily="monospace" fontWeight="bold">
                CH1: {ch1VoltsDiv.toFixed(1)}V/div
              </text>
              <text x="14" y="40" fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="bold">
                CH2: {ch2VoltsDiv.toFixed(1)}V/div
              </text>
              <text x="14" y="56" fill="#10b981" fontSize="11" fontFamily="monospace" fontWeight="bold">
                CH3: 1.0A/div (estimated ripple)
              </text>
              <text x={screenWidth - 14} y="24" fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="end">
                TB: {timebaseUs} μs/div
              </text>
              <text x={screenWidth - 14} y="40" fill="#a7f3d0" fontSize="11" fontFamily="monospace" textAnchor="end">
                PWM Freq: {(frequencyHz / 1000).toFixed(1)} kHz
              </text>
              <text x={screenWidth - 14} y="56" fill="#fef08a" fontSize="11" fontFamily="monospace" textAnchor="end">
                Duty: {dutyPercent.toFixed(1)}% (Ton: {onTimeUs.toFixed(1)} μs)
              </text>
            </svg>
          </div>

          {/* Front Panel Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-4 border-t border-slate-800">
            {/* Channel Toggles */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Channel Visibility
              </span>
              <div className="space-y-1.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCh1}
                    onChange={(e) => setShowCh1(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="text-cyan-300 font-mono">CH1: PA8 Logic PWM</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCh2}
                    onChange={(e) => setShowCh2(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span className="text-amber-300 font-mono">CH2: Motor Terminal V</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCurrent}
                    onChange={(e) => setShowCurrent(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span className="text-emerald-300 font-mono">CH3: Inductive Current (di/dt)</span>
                </label>
              </div>
            </div>

            {/* Timebase Control */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Horizontal Timebase
              </span>
              <div className="flex items-center gap-2">
                {[20, 50, 100].map(val => (
                  <button
                    key={val}
                    onClick={() => setTimebaseUs(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                      timebaseUs === val
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {val} μs/div
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 block">
                Shows {frequencyHz.toLocaleString()} Hz PWM timing across the selected time window
              </span>
            </div>

            {/* Voltage Attenuation Scale */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Vertical Volts/Div
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">CH1 Scale:</span>
                  <select
                    value={ch1VoltsDiv}
                    onChange={(e) => setCh1VoltsDiv(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                  >
                    <option value={0.5}>0.5 V/div</option>
                    <option value={1.0}>1.0 V/div</option>
                    <option value={2.0}>2.0 V/div</option>
                  </select>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">CH2 Scale:</span>
                  <select
                    value={ch2VoltsDiv}
                    onChange={(e) => setCh2VoltsDiv(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                  >
                    <option value={2.0}>2.0 V/div</option>
                    <option value={5.0}>5.0 V/div</option>
                    <option value={10.0}>10.0 V/div</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

