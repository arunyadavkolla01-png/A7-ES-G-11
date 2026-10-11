import React from 'react';
import { X, Zap, Cable, Code, Keyboard, ShieldAlert } from 'lucide-react';

export function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">
              Virtual Embedded Systems Laboratory Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed">
          <div>
            <h4 className="font-bold text-cyan-300 flex items-center gap-2 text-sm mb-1.5">
              <Cable className="w-4 h-4" /> 1. How to Connect Pins (Wiring)
            </h4>
            <p className="text-slate-400">
              Click on any pin pad on a placed component (e.g., STM32 <code className="text-cyan-400">PA8</code>). A glowing draft wire will follow your cursor. Click the destination pin (e.g., Driver <code className="text-cyan-400">PWM_IN</code>) to complete the connection. Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Esc</kbd> or click empty canvas to cancel wiring.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-emerald-300 flex items-center gap-2 text-sm mb-1.5">
              <ShieldAlert className="w-4 h-4" /> 2. Circuit Rules & Safety Validator
            </h4>
            <p className="text-slate-400">
              Before running, the engine verifies electrical rules:
              <br />• <strong>Common Ground:</strong> Controller GND and Power GND must share a return reference.
              <br />• <strong>No Direct Drive:</strong> Motor coils cannot be driven straight from STM32 pins (overcurrent protection).
              <br />• <strong>Flyback Protection:</strong> Inductive clamp diode required for low-side MOSFET switching.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-purple-300 flex items-center gap-2 text-sm mb-1.5">
              <Code className="w-4 h-4" /> 3. Embedded C Program Configuration
            </h4>
            <p className="text-slate-400">
              In the Code Editor tab, modify <code className="text-purple-300">float duty_percent = 40.0f;</code>. The configuration engine parses your parameter and applies it directly to the motor model.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-amber-300 flex items-center gap-2 text-sm mb-1.5">
              <Keyboard className="w-4 h-4" /> 4. Keyboard Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] mt-1 text-slate-300">
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-cyan-400 font-bold">Delete / Backspace:</span> Delete selected component or wire
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-cyan-400 font-bold">R Key:</span> Rotate selected component by 90°
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-cyan-400 font-bold">Esc Key:</span> Cancel wire draft or deselect
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-cyan-400 font-bold">Scroll Wheel:</span> Zoom in / out of workspace
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition"
          >
            Got it, Let's Build!
          </button>
        </div>
      </div>
    </div>
  );
}

