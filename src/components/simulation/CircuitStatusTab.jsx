import React from 'react';
import { 
  CheckCircle2, AlertTriangle, AlertOctagon, ShieldCheck, 
  GitBranch
} from 'lucide-react';
import { VALIDATION_SEVERITY } from '../../types/circuit.js';
import { buildElectricalNets } from '../../engine/validationEngine.js';

export function CircuitStatusTab({ components = [], wires = [], validation }) {
  const { results = [] } = validation || {};
  const { netMembers } = buildElectricalNets(components, wires);

  const errors = results.filter(r => r.severity === VALIDATION_SEVERITY.ERROR);
  const warnings = results.filter(r => r.severity === VALIDATION_SEVERITY.WARNING);
  const successes = results.filter(r => r.severity === VALIDATION_SEVERITY.SUCCESS);

  // Core Topology checklist items
  const checks = [
    {
      title: 'Microcontroller Presence',
      desc: 'STM32H7 board present on workspace',
      passed: components.some(c => c.type === 'stm32h7_board' || c.type === 'generic_stm32_mcu')
    },
    {
      title: 'Power Stage Isolation',
      desc: 'MOSFET Driver placed between MCU logic & DC motor',
      passed: components.some(c => c.type === 'mosfet_driver_module' || c.type === 'discrete_mosfet')
    },
    {
      title: 'PWM Timer Routing',
      desc: 'MCU PA8 (TIM1_CH1) connected to Driver Logic In',
      passed: !results.some(r => r.code === 'ERR_PWM_NOT_CONNECTED') && components.length > 0
    },
    {
      title: 'Common Ground Return',
      desc: 'Controller GND and Driver/PSU share unified reference net',
      passed: !results.some(r => r.code === 'ERR_MISSING_COMMON_GROUND') && components.length > 0
    },
    {
      title: 'Freewheeling Diode Clamp',
      desc: 'Inductive flyback diode oriented across motor terminals',
      passed: !results.some(r => r.code === 'ERR_MISSING_FLYBACK_DIODE') && components.length > 0
    },
    {
      title: 'No Direct MCU Overload',
      desc: 'Motor coil is not wired directly across low-current MCU GPIO pins',
      passed: !results.some(r => r.code === 'ERR_DIRECT_MCU_OVERLOAD')
    }
  ];

  return (
    <div className="w-full h-full p-6 bg-[#0b0f19] text-slate-200 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Health Header */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl border ${
              errors.length > 0
                ? 'bg-red-950/40 border-red-800 text-red-400'
                : warnings.length > 0
                ? 'bg-amber-950/40 border-amber-800 text-amber-400'
                : 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
            }`}>
              {errors.length > 0 ? (
                <AlertOctagon className="w-7 h-7" />
              ) : warnings.length > 0 ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <ShieldCheck className="w-7 h-7" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-100">
                {errors.length > 0
                  ? 'Circuit Topology: Unsafe or Incomplete'
                  : warnings.length > 0
                  ? 'Circuit Topology: Operational with Notices'
                  : 'Circuit Topology: Fully Verified & Safe'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {components.length} Hardware Components Placed • {wires.length} Electrical Net Wires Drawn • {netMembers.size} Connected Nets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
              {errors.length} Errors
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
              {warnings.length} Warnings
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs font-mono text-emerald-300">
              {successes.length} Passed
            </span>
          </div>
        </div>

        {/* 6-Point Circuit Safety Checklist */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Embedded Hardware Safety Rules
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checks.map((chk, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-xl border transition ${
                  chk.passed 
                    ? 'bg-slate-900/60 border-emerald-900/40 hover:border-emerald-800/80' 
                    : 'bg-red-950/20 border-red-900/40 hover:border-red-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h5 className="text-xs font-bold text-slate-200">{chk.title}</h5>
                  {chk.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {chk.desc}
                </p>
                <div className="mt-3">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    chk.passed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' : 'bg-red-950 text-red-300 border border-red-800/50'
                  }`}>
                    {chk.passed ? 'VERIFIED' : 'UNSATISFIED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Electrical Netlist Table */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              Active Electrical Netlist (Union-Find)
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Total Nets: {netMembers.size}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2 px-3">Net ID</th>
                  <th className="py-2 px-3">Pin Count</th>
                  <th className="py-2 px-3">Connected Nodes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {Array.from(netMembers.entries()).map(([netId, pins]) => (
                  <tr key={netId} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-cyan-400">NET_{netId}</td>
                    <td className="py-2.5 px-3 text-slate-400">{pins.length} pins</td>
                    <td className="py-2.5 px-3 text-[11px]">
                      <div className="flex flex-wrap gap-1.5">
                        {pins.map((p, idx) => {
                          const [compId, pinId] = p.split('::');
                          const comp = components.find(c => c.id === compId);
                          return (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-slate-300">
                              {comp ? comp.name.split('#')[0] : compId}:{pinId}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

