import React, { useState } from 'react';
import { useLab } from '../../context/LabContext.jsx';
import { SimulationControls } from './SimulationControls.jsx';
import { LiveOutputTab } from './LiveOutputTab.jsx';
import { OscilloscopeTab } from './OscilloscopeTab.jsx';
import { GraphsTab } from './GraphsTab.jsx';
import { SerialConsoleTab } from './SerialConsoleTab.jsx';
import { CircuitStatusTab } from './CircuitStatusTab.jsx';
import { ResultsExportTab } from './ResultsExportTab.jsx';
import { 
  Activity, Radio, TrendingUp, Terminal, 
  Layers, Download, AlertOctagon, Wrench 
} from 'lucide-react';

export function ResultsView() {
  const [activeTab, setActiveTab] = useState('live');

  const {
    simStatus,
    simState,
    history,
    components,
    wires,
    cCode,
    parsedConfig,
    validation,
    handleRunSimulation,
    handlePauseSimulation,
    handleResumeSimulation,
    handleStopSimulation,
    handleResetSimulation,
    handleStepSimulation,
    handleValidateCircuit,
    handleValidateProgram,
    serialLogs,
    clearSerialLogs,
    setActiveView
  } = useLab();

  const isCircuitValid = validation?.isValid ?? false;
  const isProgramValid = parsedConfig?.isValid ?? false;

  const tabs = [
    { id: 'live', label: 'Live Motor Output', icon: Activity },
    { id: 'scope', label: 'Virtual Oscilloscope', icon: Radio },
    { id: 'graphs', label: 'Transient Graphs', icon: TrendingUp },
    { id: 'console', label: 'UART Serial Console', icon: Terminal, count: serialLogs.length },
    { id: 'circuit', label: 'Circuit Status & Nets', icon: Layers },
    { id: 'export', label: 'Experiment Results & Export', icon: Download }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0f19] text-slate-200 overflow-hidden">
      {/* Simulation Controls Toolbar */}
      <SimulationControls
        simStatus={simStatus}
        onRun={handleRunSimulation}
        onPause={handlePauseSimulation}
        onResume={handleResumeSimulation}
        onStop={handleStopSimulation}
        onReset={handleResetSimulation}
        onStep={() => handleStepSimulation(0.05)}
        onValidateCircuit={handleValidateCircuit}
        onValidateProgram={handleValidateProgram}
        circuitValid={isCircuitValid}
        programValid={isProgramValid}
      />

      {/* Blocking Validation Banner if Circuit or Program has errors */}
      {(!isCircuitValid || !isProgramValid) && simStatus === 'stopped' && (
        <div className="bg-red-950/80 border-b border-red-800/80 px-4 py-2.5 flex items-center justify-between text-xs text-red-200 select-none shrink-0">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              {!isCircuitValid
                ? `Circuit safety checks failed (${validation?.results?.filter(r => r.severity === 'error').length || 0} blocking errors). Complete wiring before running simulation.`
                : 'Firmware C code validation failed. Please review syntax in the C Code Editor.'}
            </span>
          </div>

          <button
            onClick={() => setActiveView(!isCircuitValid ? 'circuit' : 'code')}
            className="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 text-white rounded-lg border border-red-700 text-[11px] font-semibold flex items-center gap-1.5 transition"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Fix in {!isCircuitValid ? 'Circuit Builder' : 'C Editor'}</span>
          </button>
        </div>
      )}

      {/* Sub-Tab Navigation Bar */}
      <div className="h-11 bg-[#0e1424] border-b border-slate-800 px-4 flex items-center gap-1 shrink-0 overflow-x-auto select-none">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-400">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content View */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'live' && (
          <LiveOutputTab
            state={simState}
            isRunning={simStatus === 'running'}
          />
        )}

        {activeTab === 'scope' && (
          <OscilloscopeTab
            state={simState}
            motorParams={components.find(component => component.type === 'dc_motor')?.properties || {}}
          />
        )}

        {activeTab === 'graphs' && (
          <GraphsTab
            history={history}
            simState={simState}
            targetRpm={parsedConfig?.config?.targetRpm || 1500}
          />
        )}

        {activeTab === 'console' && (
          <SerialConsoleTab
            logs={serialLogs}
            onClearLogs={clearSerialLogs}
            simState={simState}
          />
        )}

        {activeTab === 'circuit' && (
          <CircuitStatusTab
            components={components}
            wires={wires}
            validation={validation}
          />
        )}

        {activeTab === 'export' && (
          <ResultsExportTab
            history={history}
            simState={simState}
            components={components}
            wires={wires}
            cCode={cCode}
          />
        )}
      </div>
    </div>
  );
}

