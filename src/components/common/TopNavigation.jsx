import React from 'react';
import { Cpu, Zap, Code, BarChart3, Sparkles, Home, HelpCircle } from 'lucide-react';

export function TopNavigation({
  activeView,
  onSelectView,
  isSimulating,
  simRpm = 0,
  onOpenHelp
}) {
  const navItems = [
    { id: 'home', label: 'Laboratory Home', icon: Home },
    { id: 'circuit', label: 'Circuit Builder', icon: Zap },
    { id: 'code', label: 'C Code Editor', icon: Code },
    { id: 'results', label: 'Simulation & Graphs', icon: BarChart3 },
    { id: 'optimizer', label: 'AI Optimizer', icon: Sparkles }
  ];

  return (
    <header className="h-16 bg-[#090d16] border-b border-slate-800 px-6 flex items-center justify-between select-none z-30 shrink-0">
      {/* Lab Branding & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/30">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            AI Recommends Energy-Efficient PWM Duty Cycle
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/80 text-cyan-300">
              STM32H7 + DC Motor Lab
            </span>
          </h1>
          <p className="text-[11px] text-slate-400">
            Interactive Virtual Embedded Systems & Power Electronics Simulation
          </p>
        </div>
      </div>

      {/* Main Navigation Views */}
      <nav className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Top Right Live Telemetry Badge & Quick Help */}
      <div className="flex items-center gap-3">
        {isSimulating && (
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-400 font-bold">{Math.round(simRpm)} RPM</span>
          </div>
        )}

        <button
          onClick={onOpenHelp}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
          title="Lab Instructions & Help Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

