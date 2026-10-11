import React from 'react';
import { 
  Activity, Gauge, Zap, BatteryCharging, 
  RotateCw, ShieldCheck 
} from 'lucide-react';

export function LiveOutputTab({ state, isRunning }) {
  const {
    rpm = 0,
    current = 0,
    voltage = 0,
    powerElec = 0,
    powerMech = 0,
    efficiency = 0,
    energyWh = 0,
    temperatureC = 25,
    theta = 0,
    dutyPercent = 40,
    supplyVoltage = 12
  } = state || {};

  const rotationDegrees = (theta * 180) / Math.PI;

  return (
    <div className="w-full h-full p-6 bg-[#0b0f19] text-slate-200 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Motor Animation & Key Telemetry Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Animated Brushed DC Motor Graphic */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRunning && rpm > 10 ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
              <span className="text-xs font-mono font-semibold text-slate-400">
                {rpm > 10 ? 'MOTOR SPINNING' : 'ROTOR AT REST'}
              </span>
            </div>

            <div className="absolute top-4 right-4 text-xs font-mono text-cyan-400">
              PWM Duty: {dutyPercent.toFixed(1)}%
            </div>

            {/* SVG Motor Graphic with Real Rotation */}
            <div className="my-6 relative">
              <svg width="220" height="220" viewBox="0 0 220 220" className="drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                {/* Outer Stator Shell */}
                <circle cx="110" cy="110" r="95" fill="#1e293b" stroke="#334155" strokeWidth="8" />

                {/* Permanent Magnet Poles (N and S) */}
                <path d="M 25 110 A 85 85 0 0 1 110 25" fill="none" stroke="#ef4444" strokeWidth="14" strokeLinecap="round" />
                <text x="50" y="65" fill="#fca5a5" fontSize="12" fontWeight="bold" fontFamily="monospace">N-POLE</text>

                <path d="M 195 110 A 85 85 0 0 1 110 195" fill="none" stroke="#3b82f6" strokeWidth="14" strokeLinecap="round" />
                <text x="135" y="170" fill="#93c5fd" fontSize="12" fontWeight="bold" fontFamily="monospace">S-POLE</text>

                {/* Commutator Carbon Brushes (Fixed) */}
                <rect x="18" y="103" width="16" height="14" rx="2" fill="#475569" stroke="#64748b" />
                <rect x="186" y="103" width="16" height="14" rx="2" fill="#475569" stroke="#64748b" />

                {/* Rotating Armature & Rotor Coils Group */}
                <g transform={`rotate(${rotationDegrees}, 110, 110)`}>
                  {/* Rotor core */}
                  <circle cx="110" cy="110" r="62" fill="#0f172a" stroke="#475569" strokeWidth="3" />
                  
                  {/* Armature Copper Windings */}
                  <circle cx="110" cy="62" r="12" fill="#b45309" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="110" cy="158" r="12" fill="#b45309" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="62" cy="110" r="12" fill="#b45309" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="158" cy="110" r="12" fill="#b45309" stroke="#f59e0b" strokeWidth="2" />

                  {/* Metallic Rotating Shaft */}
                  <circle cx="110" cy="110" r="22" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="3" />
                  <line x1="110" y1="92" x2="110" y2="128" stroke="#334155" strokeWidth="3" />
                  <line x1="92" y1="110" x2="128" y2="110" stroke="#334155" strokeWidth="3" />

                  {/* Orientation Key Dot */}
                  <circle cx="110" cy="98" r="4" fill="#ef4444" />
                </g>
              </svg>

              {/* Dynamic RPM Readout Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center bg-slate-950/80 px-3 py-1 rounded-full border border-slate-700/60 backdrop-blur">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {Math.round(rpm)} RPM
                  </span>
                </div>
              </div>
            </div>

            {/* Angular Velocity & Thermal Status */}
            <div className="w-full grid grid-cols-2 gap-3 text-center pt-2 border-t border-slate-800/80">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Angular Speed (ω)</span>
                <span className="text-xs font-mono font-semibold text-slate-200">
                  {((rpm * 2 * Math.PI) / 60).toFixed(1)} rad/s
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Armature Temp</span>
                <span className={`text-xs font-mono font-semibold ${temperatureC > 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {temperatureC.toFixed(1)} °C
                </span>
              </div>
            </div>
          </div>

          {/* Primary Metrics Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-3.5">
            {/* 1. Speed Gauge Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Motor Speed</span>
                <Gauge className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="my-2">
                <div className="text-2xl font-bold font-mono text-cyan-300">
                  {Math.round(rpm)}
                </div>
                <span className="text-[10px] font-mono text-slate-500">Revolutions / Min</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (rpm / 3200) * 100)}%` }}
                />
              </div>
            </div>

            {/* 2. Armature Current */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Armature Current</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="my-2">
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {current.toFixed(2)} <span className="text-sm font-normal">A</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Peak Cutoff: 3.50 A</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${current > 3.0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (current / 4.0) * 100)}%` }}
                />
              </div>
            </div>

            {/* 3. Applied Voltage */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Applied Terminal V</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="my-2">
                <div className="text-2xl font-bold font-mono text-amber-400">
                  {voltage.toFixed(2)} <span className="text-sm font-normal">V</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Bus V: {supplyVoltage.toFixed(1)} V</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (voltage / supplyVoltage) * 100)}%` }}
                />
              </div>
            </div>

            {/* 4. Electrical Power */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Electrical Input P</span>
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <div className="my-2">
                <div className="text-2xl font-bold font-mono text-purple-400">
                  {powerElec.toFixed(2)} <span className="text-sm font-normal">W</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">V_avg × I_a</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (powerElec / 35.0) * 100)}%` }}
                />
              </div>
            </div>

            {/* 5. Mechanical Shaft Power */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Mechanical Shaft P</span>
                <RotateCw className="w-4 h-4 text-blue-400" />
              </div>
              <div className="my-2">
                <div className="text-2xl font-bold font-mono text-blue-400">
                  {powerMech.toFixed(2)} <span className="text-sm font-normal">W</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">τ_shaft × ω</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (powerMech / 35.0) * 100)}%` }}
                />
              </div>
            </div>

            {/* 6. Electro-Mechanical Efficiency */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Estimated Efficiency</span>
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <div className="my-2">
                <div className="text-2xl font-bold font-mono text-teal-400">
                  {efficiency.toFixed(1)} <span className="text-sm font-normal">%</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">P_mech / P_elec</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, efficiency)}%` }}
                />
              </div>
            </div>

            {/* 7. Cumulative Energy */}
            <div className="col-span-2 md:col-span-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                  <BatteryCharging className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Cumulative Electrical Energy</span>
                  <div className="text-xl font-bold font-mono text-cyan-300">
                    {(energyWh * 1000).toFixed(2)} mWh <span className="text-xs font-normal text-slate-400">({energyWh.toFixed(5)} Wh)</span>
                  </div>
                </div>
              </div>

              <div className="text-right text-xs font-mono text-slate-400">
                <span className="text-slate-500 block text-[10px]">TOTAL WORK</span>
                {(state?.energyJoules || 0).toFixed(1)} Joules
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

