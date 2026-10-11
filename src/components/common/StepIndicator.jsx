import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

export function StepIndicator({ currentStep = 1, onStepClick }) {
  const steps = [
    { num: 1, title: 'Components', view: 'circuit' },
    { num: 2, title: 'Wiring', view: 'circuit' },
    { num: 3, title: 'Validation', view: 'circuit' },
    { num: 4, title: 'Program', view: 'code' },
    { num: 5, title: 'Simulation', view: 'results' },
    { num: 6, title: 'Results', view: 'results' }
  ];

  return (
    <div className="h-9 bg-[#0b101c] border-b border-slate-800/80 px-6 flex items-center justify-between text-xs select-none shrink-0 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 min-w-max mx-auto">
        <span className="text-[10px] text-slate-500 font-mono uppercase mr-2 tracking-wider">
          Lab Workflow:
        </span>
        {steps.map((step, idx) => {
          const isDone = currentStep > step.num;
          const isCurrent = currentStep === step.num;

          return (
            <React.Fragment key={step.num}>
              <button
                onClick={() => onStepClick && onStepClick(step.view, step.num)}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition ${
                  isCurrent
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                    : isDone
                    ? 'text-emerald-400 hover:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                  isCurrent
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : isDone
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {isDone ? <Check className="w-2.5 h-2.5" /> : step.num}
                </span>
                <span>{step.title}</span>
              </button>

              {idx < steps.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-700" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

