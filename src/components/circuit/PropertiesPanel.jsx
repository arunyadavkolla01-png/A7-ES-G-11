import React from 'react';
import { WIRE_COLORS } from '../../types/circuit.js';
import { 
  Sliders, Trash2, RotateCw, Cable, Info,
  Settings2, Zap, Cpu 
} from 'lucide-react';

export function PropertiesPanel({
  selectedComponent,
  selectedWire,
  components = [],
  onUpdateComponentProps,
  onDeleteComponent,
  onRotateComponent,
  onUpdateWireProps,
  onDeleteWire
}) {
  if (!selectedComponent && !selectedWire) {
    return (
      <div className="w-80 h-full bg-[#0f172a] border-l border-slate-800 p-6 flex flex-col items-center justify-center text-center text-slate-500 select-none">
        <Sliders className="w-10 h-10 mb-3 text-slate-700" />
        <h3 className="text-sm font-semibold text-slate-300 mb-1">
          Inspector & Properties
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-[220px]">
          Select any placed hardware component or wire on the canvas to configure its parameters and inspect pins.
        </p>
      </div>
    );
  }

  // --- WIRE INSPECTOR ---
  if (selectedWire) {
    const srcComp = components.find(c => c.id === selectedWire.from.componentId);
    const dstComp = components.find(c => c.id === selectedWire.to.componentId);
    const srcPin = srcComp?.pins?.find(p => p.id === selectedWire.from.pinId);
    const dstPin = dstComp?.pins?.find(p => p.id === selectedWire.to.pinId);

    return (
      <div className="w-80 h-full bg-[#0f172a] border-l border-slate-800 flex flex-col text-slate-200 select-none overflow-y-auto">
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cable className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Wire Connection</h3>
          </div>
          <button
            onClick={() => onDeleteWire(selectedWire.id)}
            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 transition"
            title="Delete Wire"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Signal Label & Type */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Signal Description
            </label>
            <input
              type="text"
              value={selectedWire.label || ''}
              onChange={(e) => onUpdateWireProps(selectedWire.id, { label: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Color Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Wire Color
            </label>
            <div className="flex items-center gap-2">
              {Object.entries(WIRE_COLORS).map(([key, hex]) => (
                <button
                  key={key}
                  onClick={() => onUpdateWireProps(selectedWire.id, { color: hex })}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    selectedWire.color === hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={key}
                />
              ))}
            </div>
          </div>

          {/* Pin Connections Matrix */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono">Source Node:</span>
              <div className="text-xs font-medium text-cyan-300 mt-0.5">
                {srcComp?.name || 'Unknown'}
              </div>
              <div className="text-[11px] font-mono text-slate-300">
                Pin: {srcPin?.name || selectedWire.from.pinId} ({srcPin?.voltage}V)
              </div>
            </div>

            <div className="border-t border-slate-800/60 pt-2">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Destination Node:</span>
              <div className="text-xs font-medium text-emerald-300 mt-0.5">
                {dstComp?.name || 'Unknown'}
              </div>
              <div className="text-[11px] font-mono text-slate-300">
                Pin: {dstPin?.name || selectedWire.to.pinId} ({dstPin?.voltage}V)
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/40 text-blue-300 text-xs flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>Wire is electrically active. Signals propagate in real-time according to circuit laws.</span>
          </div>
        </div>
      </div>
    );
  }

  // --- COMPONENT INSPECTOR ---
  const props = selectedComponent.properties || {};

  const handlePropChange = (key, val) => {
    onUpdateComponentProps(selectedComponent.id, {
      ...props,
      [key]: val
    });
  };

  return (
    <div className="w-80 h-full bg-[#0f172a] border-l border-slate-800 flex flex-col text-slate-200 select-none overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100">{selectedComponent.name}</h3>
          <span className="text-[10px] font-mono text-cyan-400">ID: {selectedComponent.id}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onRotateComponent(selectedComponent.id)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Rotate Component (90°)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteComponent(selectedComponent.id)}
            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 transition"
            title="Delete Component"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {selectedComponent.type === 'dc_motor' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5" />
              Electro-Mechanical Parameters
            </h4>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Armature Resistance (Ra):</span>
                <span className="font-mono text-slate-200">{props.resistance ?? 2.2} Ω</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.1"
                value={props.resistance ?? 2.2}
                onChange={(e) => handlePropChange('resistance', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Armature Inductance (La):</span>
                <span className="font-mono text-slate-200">{((props.inductance ?? 0.0018) * 1000).toFixed(1)} mH</span>
              </div>
              <input
                type="range"
                min="0.0005"
                max="0.0080"
                step="0.0001"
                value={props.inductance ?? 0.0018}
                onChange={(e) => handlePropChange('inductance', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Mechanical Load Torque:</span>
                <span className="font-mono text-amber-300 font-semibold">{props.loadTorque ?? 0.04} N·m</span>
              </div>
              <input
                type="range"
                min="0.00"
                max="0.15"
                step="0.005"
                value={props.loadTorque ?? 0.04}
                onChange={(e) => handlePropChange('loadTorque', parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Simulates external mechanical shaft load</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Back-EMF Constant (Ke):</span>
                <span className="font-mono text-slate-200">{props.ke ?? 0.048} V/(rad/s)</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.12"
                step="0.002"
                value={props.ke ?? 0.048}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handlePropChange('ke', val);
                  handlePropChange('kt', val);
                }}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>
        )}

        {selectedComponent.type === 'dc_power_supply' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Power Supply Settings
            </h4>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Output Voltage:</span>
                <span className="font-mono text-red-400 font-bold">{props.voltage ?? 12.0} V</span>
              </div>
              <input
                type="range"
                min="3.3"
                max="24.0"
                step="0.5"
                value={props.voltage ?? 12.0}
                onChange={(e) => handlePropChange('voltage', parseFloat(e.target.value))}
                className="w-full accent-red-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Current Limit:</span>
                <span className="font-mono text-emerald-400 font-bold">{props.currentLimit ?? 5.0} A</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={props.currentLimit ?? 5.0}
                onChange={(e) => handlePropChange('currentLimit', parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        )}

        {selectedComponent.type === 'stm32h7_board' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Microcontroller Specifications
            </h4>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Core Architecture:</span>
                <span className="text-slate-300">ARM Cortex-M7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Core Clock Frequency:</span>
                <span className="text-cyan-400">480 MHz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PWM Timer Source:</span>
                <span className="text-slate-300">TIM1 (Advanced)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">I/O Logic Level:</span>
                <span className="text-amber-400">3.3 V CMOS</span>
              </div>
            </div>
          </div>
        )}

        {/* Pin Connections Matrix for this Component */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Exposed Pins & Connections ({selectedComponent.pins?.length || 0})
          </h4>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {(selectedComponent.pins || []).map(pin => {
              return (
                <div
                  key={pin.id}
                  className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-medium text-slate-200">{pin.name}</span>
                    <span className="text-[10px] text-slate-500 block">
                      {pin.voltage}V • {pin.direction}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono">
                    Pin Pad
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
