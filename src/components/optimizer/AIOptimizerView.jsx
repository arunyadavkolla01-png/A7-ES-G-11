import React, { useMemo, useState } from 'react';
import { runModelBasedOptimizer } from '../../engine/aiOptimizer.js';
import { Sparkles, CheckCircle2, Gauge, BatteryCharging, ArrowRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export function AIOptimizerView({
  motorProps = {},
  supplyProps = {},
  programTargetRpm = 1000,
  currentDuty = 40,
  canApply = true,
  onApplyDutyCycle
}) {
  const [targetRpm, setTargetRpm] = useState(programTargetRpm);
  const [rpmTolerance, setRpmTolerance] = useState(2.5);
  const [runtimeMinutes, setRuntimeMinutes] = useState(10);
  const [applied, setApplied] = useState(false);

  const optimization = useMemo(() => runModelBasedOptimizer({
    motorParams: motorProps,
    supplyParams: supplyProps,
    targetRpm,
    baselineDuty: currentDuty,
    rpmTolerancePercent: rpmTolerance,
    simulatedPeriodMinutes: runtimeMinutes
  }), [motorProps, supplyProps, targetRpm, currentDuty, rpmTolerance, runtimeMinutes]);

  const { bestCandidate, baseline, savingsPercent, reasoning } = optimization;
  const energyDeltaWh = bestCandidate ? baseline.energyWh - bestCandidate.energyWh : null;

  const handleApply = () => {
    if (!bestCandidate || !canApply) return;
    onApplyDutyCycle(bestCandidate.dutyPercent);
    setApplied(true);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch {
      // Optional visual effect; applying the setting does not depend on it.
    }
    setTimeout(() => setApplied(false), 2500);
  };

  return (
    <div className="w-full h-full p-6 bg-[#0b0f19] text-slate-200 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Model-Based PWM Duty-Cycle Optimizer
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Runs candidate duty cycles through the deterministic motor model. Results are estimates, not hardware measurements.
            </p>
          </div>
          <span className="text-[11px] font-mono px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Current Duty: <span className="text-cyan-400 font-bold">{currentDuty.toFixed(1)}%</span>
          </span>
        </header>

        <section className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
          <label className="text-xs">
            <span className="flex items-center justify-between mb-2 font-semibold text-slate-300">
              <span className="flex items-center gap-1.5"><Gauge className="w-4 h-4 text-cyan-400" />Target Rotor Speed</span>
              <span className="font-mono text-cyan-400">{targetRpm} RPM</span>
            </span>
            <input type="range" min="300" max="2800" step="50" value={targetRpm}
              onChange={event => setTargetRpm(Number(event.target.value))}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer" />
            <span className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono"><span>300</span><span>1500</span><span>2800 RPM</span></span>
          </label>

          <label className="text-xs">
            <span className="flex items-center justify-between mb-2 font-semibold text-slate-300">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" />Speed Tolerance</span>
              <span className="font-mono text-emerald-400">±{rpmTolerance}%</span>
            </span>
            <input type="range" min="1" max="5" step="0.5" value={rpmTolerance}
              onChange={event => setRpmTolerance(Number(event.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer" />
            <span className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono"><span>±1% tight</span><span>±5% loose</span></span>
          </label>

          <label className="text-xs">
            <span className="flex items-center justify-between mb-2 font-semibold text-slate-300">
              <span className="flex items-center gap-1.5"><BatteryCharging className="w-4 h-4 text-purple-400" />Energy Window</span>
              <span className="font-mono text-purple-400">{runtimeMinutes} min</span>
            </span>
            <input type="range" min="1" max="60" step="1" value={runtimeMinutes}
              onChange={event => setRuntimeMinutes(Number(event.target.value))}
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer" />
            <span className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono"><span>1 min</span><span>60 min</span></span>
          </label>
        </section>

        <section className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-800/60 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${bestCandidate ? 'bg-emerald-950 border border-emerald-800 text-emerald-300' : 'bg-amber-950 border border-amber-800 text-amber-300'}`}>
                <Sparkles className="w-3.5 h-3.5" />
                {bestCandidate ? 'Lowest-Energy Feasible Point' : 'No Feasible Operating Point'}
              </div>
              <div className="flex flex-wrap items-baseline gap-4">
                <div className="text-4xl font-extrabold font-mono text-cyan-400">{bestCandidate ? `${bestCandidate.dutyPercent.toFixed(1)}%` : '--'}</div>
                <div className="text-sm text-slate-400">{bestCandidate ? `Recommended setting; baseline ${currentDuty.toFixed(1)}%` : `Target ${targetRpm} RPM cannot be met within current limits`}</div>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl">
                {bestCandidate
                  ? <>Simulated speed <span className="text-white font-semibold">{Math.round(bestCandidate.rpm)} RPM</span>; estimated energy change <span className={savingsPercent >= 0 ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-semibold'}>{savingsPercent === null ? 'unavailable' : `${Math.abs(savingsPercent).toFixed(1)}% ${savingsPercent >= 0 ? 'lower' : 'higher'}`}</span> over {runtimeMinutes} minutes.</>
                  : 'Try a lower target speed or adjust the configured motor and supply limits. No recommendation or savings claim is produced when all candidates are infeasible.'}
              </p>
            </div>
            <button onClick={handleApply} disabled={!bestCandidate || !canApply}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-2 shadow-xl shadow-cyan-950/50 transition">
              {applied ? <Check className="w-4 h-4 text-emerald-300" /> : <Sparkles className="w-4 h-4" />}
              {applied ? 'Applied to C Configuration' : canApply ? 'Apply Recommended Duty Cycle' : 'Fix C Configuration to Apply'}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-x-auto">
          <div className="px-5 py-4 border-b border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Baseline and Recommendation Comparison</h4>
            <p className="text-[11px] text-slate-500 mt-1">Each duty cycle is transiently simulated; energy uses the final 0.4 s average power.</p>
          </div>
          <table className="w-full text-xs min-w-[720px]">
            <thead className="text-slate-500 uppercase text-[10px]">
              <tr className="text-left">
                <th className="px-4 py-3">Operating Point</th><th className="px-4 py-3">Duty</th>
                <th className="px-4 py-3">Predicted RPM</th><th className="px-4 py-3">Target Error</th>
                <th className="px-4 py-3">Current</th><th className="px-4 py-3">Power</th><th className="px-4 py-3">Energy ({runtimeMinutes} min)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Baseline', baseline],
                ['Optimized', bestCandidate]
              ].map(([label, item]) => (
                <tr key={label} className="border-t border-slate-800/80">
                  <td className="px-4 py-3 font-semibold text-slate-200">{label}</td>
                  <td className="px-4 py-3 font-mono">{item ? `${item.dutyPercent.toFixed(1)}%` : '--'}</td>
                  <td className="px-4 py-3 font-mono">{item ? `${Math.round(item.rpm)} RPM` : '--'}</td>
                  <td className="px-4 py-3 font-mono">{item ? `${item.rpmError.toFixed(0)} RPM` : '--'}</td>
                  <td className="px-4 py-3 font-mono">{item ? `${item.current.toFixed(2)} A` : '--'}</td>
                  <td className="px-4 py-3 font-mono">{item ? `${item.power.toFixed(2)} W` : '--'}</td>
                  <td className="px-4 py-3 font-mono">{item ? `${item.energyWh.toFixed(3)} Wh` : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div><span className="block text-slate-500">Feasible Candidates</span><span className="font-mono text-emerald-300">{optimization.feasibleCount} / {optimization.candidates.length}</span></div>
            <div><span className="block text-slate-500">Baseline Energy Change</span><span className="font-mono text-cyan-300">{energyDeltaWh === null ? 'n/a' : `${Math.abs(energyDeltaWh).toFixed(3)} Wh ${energyDeltaWh >= 0 ? 'saved' : 'additional'}`}</span></div>
            <div><span className="block text-slate-500">Current Limit</span><span className="font-mono text-amber-300">{Number(supplyProps.currentLimit ?? 5).toFixed(2)} A</span></div>
            <div><span className="block text-slate-500">Motor Supply</span><span className="font-mono text-blue-300">{Number(supplyProps.voltage ?? 12).toFixed(2)} V</span></div>
          </div>
        </section>

        <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />Model-Based Reasoning
          </h4>
          <div className="space-y-2">
            {reasoning.map((item, index) => (
              <div key={index} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" /><span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
