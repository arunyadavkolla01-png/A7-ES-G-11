import React from 'react';
import { 
  Zap, ArrowRight, ShieldCheck, AlertTriangle, 
  Layers, BookOpen, Sparkles, Code 
} from 'lucide-react';

export function HomeView({
  onStartBuilding,
  onLoadExample,
  onNavigateView
}) {
  return (
    <div className="w-full h-full p-8 bg-[#0b0f19] text-slate-200 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs mb-3">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Virtual Embedded Systems & Power Electronics Laboratory
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight leading-tight">
              AI Recommends Energy-Efficient PWM Duty Cycle
            </h1>
            <h2 className="text-lg font-semibold text-cyan-400 mt-1">
              STM32H743ZI (Arm Cortex-M7) + Brushed DC Motor Model
            </h2>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Build and wire real hardware circuits manually in an interactive Tinkercad/Proteus-style laboratory environment. Configure STM32Cube HAL C firmware, validate circuit topology, execute deterministic motor simulation, and discover energy-optimal PWM duty cycles using model-based AI.
            </p>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={onStartBuilding}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-950/40 flex items-center gap-2 transition transform active:scale-95"
              >
                <Zap className="w-4 h-4" />
                Build Circuit from Scratch
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onLoadExample}
                className="px-5 py-2.5 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-600/60 text-emerald-300 font-semibold text-xs rounded-xl flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Restore Reference Circuit
              </button>
            </div>
          </div>
        </div>

        {/* 6-Stage Lab Workflow Grid */}
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Standard Laboratory Workflow
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => onNavigateView('circuit')}
              className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center mb-3 font-mono text-xs font-bold">
                1 & 2
              </div>
              <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition">
                Select & Wire Hardware
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Place STM32H7, DC Motor, MOSFET Driver, 12V Power Supply, and Protection Diodes. Connect interactive pins with color-coded jumper wires.
              </p>
            </div>

            <div 
              onClick={() => onNavigateView('circuit')}
              className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center mb-3 font-mono text-xs font-bold">
                3 & 4
              </div>
              <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition">
                Validate & Write C Code
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Check safety rules (common ground, flyback protection, overload checks). Configure PWM duty cycle in the embedded STM32 HAL C editor.
              </p>
            </div>

            <div 
              onClick={() => onNavigateView('results')}
              className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mb-3 font-mono text-xs font-bold">
                5 & 6
              </div>
              <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition">
                Simulate & AI Optimization
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Run deterministic RK4 physics solver. Inspect DSO oscilloscope waveforms and apply model-based AI energy optimization.
              </p>
            </div>
          </div>
        </div>

        {/* Laboratory Experiments & Learning Objectives */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Curriculum Learning Scenarios
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="font-semibold text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Experiment 1: Direct MCU Drive Trap
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Try connecting the motor directly to STM32 PA8. Observe how the validator blocks execution because inductive motor stall current (5.45 A) exceeds the 20 mA GPIO limit.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Experiment 2: Inductive Flyback Protection
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Build a discrete MOSFET circuit without a flyback diode. See how the validator warns of destructive inductive kickback (V = L · di/dt).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                Experiment 3: Embedded Code Tuning
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Modify <code className="text-cyan-300">float duty_percent = 65.0f;</code> in the editor and observe the proportional increase in terminal voltage, speed, and inrush current.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Experiment 4: AI Model-Based Energy Optimizer
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Use the AI optimizer to identify the exact PWM duty cycle that meets your 1500 RPM target with minimal copper I²R loss and apply it directly to code.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

