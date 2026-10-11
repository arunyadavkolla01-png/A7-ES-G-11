import React, { useState } from 'react';
import { VALIDATION_SEVERITY } from '../../types/circuit.js';
import { 
  CheckCircle2, AlertTriangle, AlertOctagon, 
  ChevronDown, ChevronUp, ShieldCheck, Wrench 
} from 'lucide-react';

export function ValidationReport({ validation, components = [] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!validation) return null;

  const { results = [] } = validation;
  const errors = results.filter(r => r.severity === VALIDATION_SEVERITY.ERROR);
  const warnings = results.filter(r => r.severity === VALIDATION_SEVERITY.WARNING);
  const passed = results.filter(r => r.severity === VALIDATION_SEVERITY.SUCCESS);
  const hasBlockingErrors = errors.length > 0;
  const namesById = new Map(components.map(component => [component.id, component.name]));

  return (
    <div className="border-t border-slate-800 bg-[#0d1322] text-slate-200 select-none">
      {/* Summary Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition"
      >
        <div className="flex items-center gap-3">
          {hasBlockingErrors ? (
            <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
              <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />
              <span>Circuit Validation Failed ({errors.length} Blocking Issue{errors.length > 1 ? 's' : ''})</span>
            </div>
          ) : warnings.length > 0 ? (
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Circuit Ready with Warnings ({warnings.length} Notice{warnings.length > 1 ? 's' : ''})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Circuit Validated Healthy ({passed.length} Checks Passed)</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] font-mono">
            {errors.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800/50 text-red-300">
                {errors.length} Errors
              </span>
            )}
            {warnings.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/50 text-amber-300">
                {warnings.length} Warnings
              </span>
            )}
            {passed.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300">
                {passed.length} Verified
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-[11px]">Rule-based topology checks · not a full electrical solver</span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Report Content */}
      {isExpanded && (
        <div className="p-4 pt-1 max-h-56 overflow-y-auto space-y-2.5 border-t border-slate-800/60">
          {results.map((item, idx) => {
            const isErr = item.severity === VALIDATION_SEVERITY.ERROR;
            const isWarn = item.severity === VALIDATION_SEVERITY.WARNING;
            const isPass = item.severity === VALIDATION_SEVERITY.SUCCESS;

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition ${
                  isErr
                    ? 'bg-red-950/30 border-red-800/50 text-red-200'
                    : isWarn
                    ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                    : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isErr && <AlertOctagon className="w-4 h-4 text-red-400" />}
                  {isWarn && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{item.title}</h4>
                    <span className="text-[10px] font-mono opacity-60">[{item.code}]</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed opacity-90">{item.details}</p>

                  {item.involvedComponents?.length > 0 && (
                    <div className="mt-1 text-[10px] text-slate-400">
                      Involved: {item.involvedComponents.map(id => namesById.get(id) || id).join(', ')}
                    </div>
                  )}

                  {item.fixSuggestion && (
                    <div className="mt-2 pt-1.5 border-t border-white/10 flex items-start gap-1.5 text-[11px] font-medium text-cyan-300">
                      <Wrench className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-400" />
                      <span>Suggested Fix: {item.fixSuggestion}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

