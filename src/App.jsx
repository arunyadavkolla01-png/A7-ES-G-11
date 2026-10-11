import React, { useMemo } from 'react';
import { LabProvider, useLab } from './context/LabContext.jsx';
import { TopNavigation } from './components/common/TopNavigation.jsx';
import { StepIndicator } from './components/common/StepIndicator.jsx';
import { HelpModal } from './components/common/HelpModal.jsx';
import { HomeView } from './components/home/HomeView.jsx';
import { CircuitBuilderView } from './components/circuit/CircuitBuilderView.jsx';
import { CodeEditor } from './components/editor/CodeEditor.jsx';
import { ResultsView } from './components/simulation/ResultsView.jsx';
import { AIOptimizerView } from './components/optimizer/AIOptimizerView.jsx';

function MainLabContent() {
  const {
    activeView,
    setActiveView,
    workflowStep,
    setWorkflowStep,
    helpOpen,
    setHelpOpen,
    components,
    cCode,
    setCCode,
    parsedConfig,
    handleApplyDutyCycle,
    handleRestoreExample,
    simStatus,
    simState
  } = useLab();

  // Find motor and supply parameters for AI optimizer
  const motorComp = components.find(c => c.type === 'dc_motor');
  const psuComp = components.find(c => c.type === 'dc_power_supply');
  const driverComp = components.find(c => c.type === 'mosfet_driver_module' || c.type === 'discrete_mosfet');
  const optimizerMotorProps = useMemo(() => ({
    ...(motorComp?.properties || {}),
    pwmFrequencyHz: parsedConfig?.config?.pwmFrequencyHz ?? 20000
  }), [motorComp?.properties, parsedConfig?.config?.pwmFrequencyHz]);
  const optimizerSupplyProps = useMemo(() => ({
    ...(psuComp?.properties || {}),
    currentLimit: Math.min(
      Number(psuComp?.properties?.currentLimit ?? 5),
      Number(driverComp?.properties?.maxCurrent ?? Infinity),
      Number(parsedConfig?.config?.maxCurrentLimit ?? Infinity)
    )
  }), [psuComp?.properties, driverComp?.properties, parsedConfig?.config?.maxCurrentLimit]);

  const handleStepClick = (view, stepNum) => {
    setActiveView(view);
    setWorkflowStep(stepNum);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0b0f19] text-slate-200 overflow-hidden select-none">
      {/* Top Navigation */}
      <TopNavigation
        activeView={activeView}
        onSelectView={setActiveView}
        isSimulating={simStatus === 'running'}
        simRpm={simState.rpm}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {/* Workflow Step Indicator */}
      <StepIndicator
        currentStep={workflowStep}
        onStepClick={handleStepClick}
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeView === 'home' && (
          <HomeView
            onStartBuilding={() => {
              setActiveView('circuit');
              setWorkflowStep(1);
            }}
            onLoadExample={() => {
              handleRestoreExample();
              setActiveView('circuit');
              setWorkflowStep(3);
            }}
            onNavigateView={(view) => setActiveView(view)}
          />
        )}

        {activeView === 'circuit' && (
          <CircuitBuilderView />
        )}

        {activeView === 'code' && (
          <CodeEditor
            cCode={cCode}
            onChangeCode={setCCode}
            parsedConfig={parsedConfig}
            onApplyDutyToSimulation={handleApplyDutyCycle}
          />
        )}

        {activeView === 'results' && (
          <ResultsView />
        )}

        {activeView === 'optimizer' && (
          <AIOptimizerView
            key={parsedConfig?.config?.targetRpm ?? 1000}
            motorProps={optimizerMotorProps}
            supplyProps={optimizerSupplyProps}
            programTargetRpm={parsedConfig?.config?.targetRpm ?? 1000}
            currentDuty={parsedConfig?.config?.dutyPercent ?? 40.0}
            canApply={parsedConfig?.isValid}
            onApplyDutyCycle={handleApplyDutyCycle}
          />
        )}
      </main>

      {/* Lab Instruction & Help Modal */}
      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LabProvider>
      <MainLabContent />
    </LabProvider>
  );
}
