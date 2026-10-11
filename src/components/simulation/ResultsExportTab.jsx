import React, { useState } from 'react';
import { Download, Copy, Check, FileSpreadsheet, FileJson, FileText } from 'lucide-react';

export function ResultsExportTab({ history = [], simState = {}, components = [], wires = [], cCode = '' }) {
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Export CSV
  const handleExportCsv = () => {
    if (history.length === 0) {
      alert('No telemetry data collected yet. Run or step the simulation first!');
      return;
    }

    const headers = ['Time_s', 'Speed_RPM', 'ArmatureCurrent_A', 'ArmatureVoltage_V', 'ElectricalPower_W', 'Energy_Wh', 'Efficiency_Percent'];
    const rows = history.map(d => [
      d.time,
      d.rpm,
      d.current,
      d.voltage,
      d.powerElec,
      d.energyWh,
      d.efficiency
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stm32h7_motor_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Circuit JSON
  const handleExportJson = () => {
    const circuitData = {
      project: 'AI Recommends Energy-Efficient PWM Duty Cycle — STM32H7 + DC Motor',
      timestamp: new Date().toISOString(),
      components,
      wires,
      cCode
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(circuitData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `embedded_lab_circuit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Copy Lab Summary
  const handleCopySummary = () => {
    const summary = `
========================================================================
VIRTUAL EMBEDDED SYSTEMS LABORATORY EXPERIMENT REPORT
AI Recommends Energy-Efficient PWM Duty Cycle — STM32H7 + DC Motor
========================================================================
Date: ${new Date().toLocaleString()}
Target Microcontroller: STM32H743ZI (Arm Cortex-M7 @ 480 MHz)
Motor Type: Brushed DC Motor with Permanent Magnet Stator
Switching Device: Logic-Level N-Channel MOSFET / MOSFET Driver Module

OPERATING PARAMETERS:
- PWM Duty Cycle: ${(simState.dutyPercent ?? 40).toFixed(1)}%
- PWM Frequency: ${(simState.pwmFrequencyHz ?? 20000).toLocaleString()} Hz
- Supply Voltage: ${(simState.supplyVoltage ?? 12).toFixed(1)} V
- Terminal Voltage: ${(simState.voltage || 0).toFixed(2)} V
- Steady-State Speed: ${Math.round(simState.rpm || 0)} RPM
- Armature Current: ${(simState.current || 0).toFixed(3)} A
- Back-EMF: ${(simState.backEmf || 0).toFixed(2)} V
- Electrical Power: ${(simState.powerElec || 0).toFixed(2)} W
- Mechanical Power: ${(simState.powerMech || 0).toFixed(2)} W
- Power Conversion Efficiency: ${(simState.efficiency || 0).toFixed(1)}%
- Total Energy Consumed: ${(simState.energyWh || 0).toFixed(4)} Wh
- Simulation: Deterministic browser motor model; no C compilation or physical hardware measurement
- Armature Temperature: ${(simState.temperatureC || 25).toFixed(1)} °C

HARDWARE TOPOLOGY:
- Placed Components: ${components.length}
- Interconnect Wires: ${wires.length}
- Protection: Freewheeling flyback clamp diode across inductive coil
========================================================================
`.trim();

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="w-full h-full p-6 bg-[#0b0f19] text-slate-200 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            Experiment Results & Dataset Export
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Export model telemetry, the circuit configuration, and a report that identifies the simulation as a browser-based estimate.
          </p>
        </div>

        {/* 3 Export Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. CSV Telemetry Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-lg">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400 mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">Export Telemetry CSV</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Download comma-separated dataset containing timestamped RPM, armature current, terminal voltage, and electrical power.
              </p>
              <div className="mt-3 text-[11px] font-mono text-slate-400">
                Samples in memory: <span className="text-cyan-400 font-bold">{history.length}</span>
              </div>
            </div>

            <button
              onClick={handleExportCsv}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-950/40"
            >
              <Download className="w-4 h-4" />
              Download telemetry.csv
            </button>
          </div>

          {/* 2. Circuit JSON Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-lg">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-3">
                <FileJson className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">Circuit Layout JSON</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Export complete circuit netlist, component coordinate placements, properties, and embedded C firmware.
              </p>
              <div className="mt-3 text-[11px] font-mono text-slate-400">
                Components: <span className="text-emerald-400 font-bold">{components.length}</span> | Wires: <span className="text-emerald-400 font-bold">{wires.length}</span>
              </div>
            </div>

            <button
              onClick={handleExportJson}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/40"
            >
              <Download className="w-4 h-4" />
              Download circuit.json
            </button>
          </div>

          {/* 3. Text Report Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-lg">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800/80 flex items-center justify-center text-purple-400 mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">Lab Summary Report</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Copy formatted academic laboratory report with steady-state electrical parameters, thermal metrics, and safety findings.
              </p>
              <div className="mt-3 text-[11px] font-mono text-slate-400">
                Current Speed: <span className="text-purple-400 font-bold">{Math.round(simState.rpm || 0)} RPM</span>
              </div>
            </div>

            <button
              onClick={handleCopySummary}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-purple-950/40"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              {copiedSummary ? 'Copied to Clipboard!' : 'Copy Formatted Report'}
            </button>
          </div>
        </div>

        {/* Telemetry Preview Table */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            Telemetry Data Preview (Recent 10 Samples)
          </h4>

          {history.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              No historical data points yet. Run or step through the simulation to log data.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2 px-3">Time (s)</th>
                    <th className="py-2 px-3">Speed (RPM)</th>
                    <th className="py-2 px-3">Current (A)</th>
                    <th className="py-2 px-3">Voltage (V)</th>
                    <th className="py-2 px-3">Power (W)</th>
                    <th className="py-2 px-3">Energy (Wh)</th>
                    <th className="py-2 px-3">Efficiency (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {history.slice(-10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-cyan-400">{row.time.toFixed(2)}s</td>
                      <td className="py-2 px-3">{row.rpm}</td>
                      <td className="py-2 px-3 text-amber-400">{row.current.toFixed(3)}</td>
                      <td className="py-2 px-3 text-blue-400">{row.voltage.toFixed(2)}</td>
                      <td className="py-2 px-3 text-purple-400">{row.powerElec.toFixed(2)}</td>
                      <td className="py-2 px-3 text-cyan-300">{row.energyWh.toFixed(5)}</td>
                      <td className="py-2 px-3 text-emerald-400">{row.efficiency.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

