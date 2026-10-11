import React from 'react';
import { 
  Play, Pause, Square, RotateCcw, StepForward, 
  CheckCircle, AlertOctagon 
} from 'lucide-react';

export function SimulationControls({
  simStatus,
  onRun,
  onPause,
  onResume,
  onStop,
  onReset,
  onStep,
  onValidateCircuit,
  onValidateProgram,
  circuitValid,
  programValid
}) {
  const isRunning = simStatus === 'running';
  const isPaused = simStatus === 'paused';
  const isStopped = simStatus === 'stopped';

  return (
    <div className="h-14 bg-[#111827] border-b border-slate-800 px-4 flex items-center justify-between select-none shrink-0">
      {/* Primary Simulation Controls */}
      <div className="flex items-center gap-2">
        {isStopped && (
          <button
            onClick={onRun}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition transform active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            Run Simulation
          </button>
        )}

        {isRunning && (
          <button
            onClick={onPause}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-950/40 flex items-center gap-2 transition"
          >
            <Pause className="w-4 h-4 fill-white" />
            Pause
          </button>
        )}

        {isPaused && (
          <button
            onClick={onResume}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition"
          >
            <Play className="w-4 h-4 fill-white" />
            Resume
          </button>
        )}

        <button
          onClick={onStop}
          disabled={isStopped}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
          title="Stop Simulation"
        >
          <Square className="w-3.5 h-3.5 fill-current text-red-400" />
          Stop
        </button>

        <button
          onClick={onStep}
          disabled={isRunning}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
          title="Step by 50ms"
        >
          <StepForward className="w-3.5 h-3.5 text-cyan-400" />
          Step (50ms)
        </button>

        <button
          onClick={onReset}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
          title="Reset State & Counters"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          Reset
        </button>
      </div>

      {/* Validation Quick Triggers & Status Badges */}
      <div className="flex items-center gap-3">
        <button
          onClick={onValidateCircuit}
          className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-xs rounded-lg border border-slate-700/80 text-slate-300 flex items-center gap-1.5 transition"
        >
          {circuitValid ? (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
          )}
          <span>Validate Circuit</span>
        </button>

        <button
          onClick={onValidateProgram}
          className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-xs rounded-lg border border-slate-700/80 text-slate-300 flex items-center gap-1.5 transition"
        >
          {programValid ? (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>Validate Program</span>
        </button>

        {/* Live Running Status Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <span className={`w-2.5 h-2.5 rounded-full ${
            isRunning ? 'bg-emerald-400 animate-ping' : isPaused ? 'bg-amber-400' : 'bg-slate-600'
          }`} />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            {simStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

