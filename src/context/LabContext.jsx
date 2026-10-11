import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { validateCircuit } from '../engine/validationEngine.js';
import { parseProgramConfiguration, updateDutyCycleInCode } from '../engine/codeParser.js';
import { DCMotorModel } from '../engine/motorSimulation.js';
import { SAMPLE_C_PROGRAM } from '../data/samplePrograms.js';
import { EXAMPLE_CIRCUIT } from '../data/exampleCircuits.js';
import { getComponentDef } from '../data/componentLibrary.js';

const LabContext = createContext(null);

function toTelemetry(state) {
  return {
    time: Number(state.simTime.toFixed(2)),
    rpm: Math.round(state.rpm),
    current: Number(state.current.toFixed(3)),
    voltage: Number(state.voltage.toFixed(2)),
    powerElec: Number(state.powerElec.toFixed(2)),
    energyWh: Number(state.energyWh.toFixed(5)),
    efficiency: Number(state.efficiency.toFixed(1))
  };
}

export function useLab() {
  const context = useContext(LabContext);
  if (!context) {
    throw new Error('useLab must be used within a LabProvider');
  }
  return context;
}

const STORAGE_KEYS = {
  COMPONENTS: 'embedded_lab_components_v1',
  WIRES: 'embedded_lab_wires_v1',
  CODE: 'embedded_lab_code_v1'
};

function normalizeComponent(component) {
  const definition = getComponentDef(component?.type);
  if (!definition) return component;

  const savedPins = component.pins || [];
  return {
    ...component,
    width: component.width ?? definition.width,
    height: component.height ?? definition.height,
    properties: { ...definition.defaultProps, ...(component.properties || {}) },
    pins: definition.pins.map(pin => ({
      ...pin,
      ...(savedPins.find(savedPin => savedPin.id === pin.id) || {})
    }))
  };
}

export function LabProvider({ children }) {
  // Navigation & Workflow state
  const [activeView, setActiveView] = useState('home');
  const [workflowStep, setWorkflowStep] = useState(1);
  const [helpOpen, setHelpOpen] = useState(false);

  // Circuit workspace state (Initialized from local storage or empty by default)
  const [components, setComponents] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPONENTS);
      const components = saved ? JSON.parse(saved) : [];
      return Array.isArray(components) ? components.map(normalizeComponent) : [];
    } catch {
      return [];
    }
  });

  const [wires, setWires] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WIRES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [selectedWireId, setSelectedWireId] = useState(null);

  // Embedded C code state
  const [cCode, setCCode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CODE);
      return saved || SAMPLE_C_PROGRAM;
    } catch {
      return SAMPLE_C_PROGRAM;
    }
  });

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(components));
    } catch (e) {
      console.warn('Failed to save components to LocalStorage', e);
    }
  }, [components]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WIRES, JSON.stringify(wires));
    } catch (e) {
      console.warn('Failed to save wires to LocalStorage', e);
    }
  }, [wires]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CODE, cCode);
    } catch (e) {
      console.warn('Failed to save C code to LocalStorage', e);
    }
  }, [cCode]);

  // Serial Console Logs
  const [serialLogs, setSerialLogs] = useState(() => [
    {
      id: 'init_1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: 'Embedded Systems Laboratory initialized. Target: STM32H743ZI + DC Motor.'
    },
    {
      id: 'init_2',
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: 'Workspace ready. Drag hardware components to begin circuit construction.'
    }
  ]);

  const addSerialLog = useCallback((level, message) => {
    setSerialLogs(prev => [
      ...prev.slice(-300), // keep last 300 logs
      {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toLocaleTimeString(),
        level,
        message
      }
    ]);
  }, []);

  const clearSerialLogs = useCallback(() => {
    setSerialLogs([]);
  }, []);

  // Circuit Validation Engine
  const validation = useMemo(() => {
    return validateCircuit(components, wires);
  }, [components, wires]);

  // C Program Parser
  const parsedConfig = useMemo(() => {
    return parseProgramConfiguration(cCode);
  }, [cCode]);

  // Numerical Simulation Engine
  const [simStatus, setSimStatus] = useState('stopped'); // 'stopped' | 'running' | 'paused'
  const motorModelRef = useRef(new DCMotorModel());
  const [simState, setSimState] = useState(() => new DCMotorModel().getState(40.0));
  const [history, setHistory] = useState([]);

  // Hardware parameters from placed components
  const motorComp = components.find(c => c.type === 'dc_motor');
  const psuComp = components.find(c => c.type === 'dc_power_supply');
  const driverComp = components.find(c => c.type === 'mosfet_driver_module' || c.type === 'discrete_mosfet');
  const mcuComp = components.find(c => c.type === 'stm32h7_board' || c.type === 'generic_stm32_mcu');
  const dutyPercent = parsedConfig?.config?.dutyPercent ?? 40.0;
  const pwmFrequencyHz = parsedConfig?.config?.pwmFrequencyHz ?? mcuComp?.properties?.pwmFrequencyHz ?? 20000;
  const effectiveCurrentLimit = Math.min(
    Number(psuComp?.properties?.currentLimit ?? 5),
    Number(driverComp?.properties?.maxCurrent ?? Infinity),
    Number(parsedConfig?.config?.maxCurrentLimit ?? Infinity)
  );
  const simulationMotorParams = useMemo(() => ({
    ...(motorComp?.properties || {}),
    pwmFrequencyHz
  }), [motorComp?.properties, pwmFrequencyHz]);
  const simulationSupplyParams = useMemo(() => ({
    ...(psuComp?.properties || {}),
    currentLimit: effectiveCurrentLimit
  }), [psuComp?.properties, effectiveCurrentLimit]);

  // Sync component parameters with motor model when not simulating
  const wasSimulatingRef = useRef(false);
  useEffect(() => {
    const stoppedAfterRun = simStatus === 'stopped' && wasSimulatingRef.current;
    wasSimulatingRef.current = simStatus !== 'stopped';
    if (simStatus === 'stopped' && !stoppedAfterRun) {
      motorModelRef.current.reset(simulationMotorParams, simulationSupplyParams);
      setSimState(motorModelRef.current.getState(dutyPercent));
    }
  }, [simulationMotorParams, simulationSupplyParams, dutyPercent, simStatus]);

  // Simulation Animation Loop
  const lastTimeRef = useRef(null);
  const historySampleAccumulatorRef = useRef(0);

  useEffect(() => {
    let animId = null;

    if (simStatus === 'running') {
      lastTimeRef.current = performance.now();

      const loop = (time) => {
        const deltaMs = time - (lastTimeRef.current || time);
        lastTimeRef.current = time;

        // Clamp dt to max 0.05 seconds to avoid large jumps if browser tab loses focus
        const dt = Math.min(0.05, Math.max(0.001, deltaMs / 1000.0));

        const duty = dutyPercent;
        const currentLoad = motorComp?.properties?.loadTorque ?? 0.04;

        // Step motor physics
        const nextState = motorModelRef.current.step(duty, dt, currentLoad);
        setSimState({ ...nextState });
        if (Math.floor(nextState.simTime) > Math.floor(nextState.simTime - dt)) {
          addSerialLog('INFO', `[UART] Duty ${duty.toFixed(1)}% | ${Math.round(nextState.rpm)} RPM | ${nextState.current.toFixed(2)} A`);
        }

        // Record telemetry history every ~100ms
        historySampleAccumulatorRef.current += dt;
        if (historySampleAccumulatorRef.current >= 0.1) {
          historySampleAccumulatorRef.current = 0;
          setHistory(prev => [
            ...prev.slice(-150),
            toTelemetry(nextState)
          ]);
        }

        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [simStatus, dutyPercent, motorComp?.properties?.loadTorque, addSerialLog]);

  // Add Component to Canvas
  const handleAddComponent = useCallback((compType, x = 240, y = 180) => {
    const def = getComponentDef(compType);
    if (!def) return;

    const newInstance = {
      id: `${compType}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
      type: compType,
      name: `${def.name} #${components.filter(c => c.type === compType).length + 1}`,
      x,
      y,
      rotation: 0,
      width: def.width,
      height: def.height,
      properties: { ...def.defaultProps },
      pins: def.pins.map(p => ({ ...p }))
    };

    setComponents(prev => [...prev, newInstance]);
    setSelectedComponentId(newInstance.id);
    setSelectedWireId(null);
    addSerialLog('INFO', `Added hardware component: ${newInstance.name} at (${x}, ${y}).`);
  }, [components, addSerialLog]);

  // Restore Reference Example Circuit
  const handleRestoreExample = useCallback(() => {
    const clonedComponents = JSON.parse(JSON.stringify(EXAMPLE_CIRCUIT.components)).map(normalizeComponent);
    const clonedWires = JSON.parse(JSON.stringify(EXAMPLE_CIRCUIT.wires));

    setComponents(clonedComponents);
    setWires(clonedWires);
    setSelectedComponentId(null);
    setSelectedWireId(null);
    addSerialLog('INFO', 'Restored verified reference circuit: STM32H743ZI + MOSFET Driver + DC Motor + 12V PSU + Flyback Diode.');
  }, [addSerialLog]);

  // Clear workspace
  const handleClearCircuit = useCallback(() => {
    setComponents([]);
    setWires([]);
    setSelectedComponentId(null);
    setSelectedWireId(null);
    addSerialLog('INFO', 'Workspace cleared. Canvas is blank.');
  }, [addSerialLog]);

  // Apply Duty Cycle from AI Optimizer or Code Editor
  const handleApplyDutyCycle = useCallback((newDuty) => {
    const updated = updateDutyCycleInCode(cCode, newDuty);
    setCCode(updated);
    addSerialLog('INFO', `Updated firmware configuration: duty_percent = ${newDuty.toFixed(1)}f.`);
  }, [cCode, addSerialLog]);

  // Run Simulation Handler
  const handleRunSimulation = useCallback(() => {
    const currentValidation = validateCircuit(components, wires);
    if (!currentValidation.isValid) {
      addSerialLog('ERR', `Simulation startup blocked: ${currentValidation.results.filter(r => r.severity === 'error').length} circuit topology error(s) detected.`);
      return false;
    }

    if (!parsedConfig.isValid) {
      addSerialLog('ERR', 'Simulation startup blocked: supported program settings are missing or invalid. Review the parser diagnostics.');
      return false;
    }

    // Required workflow messages
    addSerialLog('INFO', '[INFO] Circuit validation completed.');
    addSerialLog('INFO', '[INFO] PWM output configured.');
    addSerialLog('INFO', '[INFO] Motor driver connection validated.');
    addSerialLog('INFO', '[INFO] Initializing motor model.');
    addSerialLog('INFO', '[INFO] Starting PWM simulation.');
    addSerialLog('INFO', '[INFO] Updating motor response.');

    // The browser runs this deterministic model; it does not compile or execute HAL C.
    motorModelRef.current.reset(simulationMotorParams, simulationSupplyParams);
    historySampleAccumulatorRef.current = 0;
    setHistory([]);
    setSimStatus('running');
    return true;
  }, [components, wires, parsedConfig, simulationMotorParams, simulationSupplyParams, addSerialLog]);

  const handlePauseSimulation = useCallback(() => {
    setSimStatus('paused');
    addSerialLog('INFO', 'Simulation paused.');
  }, [addSerialLog]);

  const handleResumeSimulation = useCallback(() => {
    setSimStatus('running');
    addSerialLog('INFO', 'Simulation resumed.');
  }, [addSerialLog]);

  const handleStopSimulation = useCallback(() => {
    setSimStatus('stopped');
    addSerialLog('INFO', 'Simulation stopped. Final state and telemetry history were retained.');
  }, [addSerialLog]);

  const handleResetSimulation = useCallback(() => {
    setSimStatus('stopped');
    motorModelRef.current.reset(simulationMotorParams, simulationSupplyParams);
    setSimState(motorModelRef.current.getState(dutyPercent));
    setHistory([]);
    addSerialLog('INFO', 'Simulation state and telemetry history reset.');
  }, [simulationMotorParams, simulationSupplyParams, dutyPercent, addSerialLog]);

  const handleStepSimulation = useCallback((stepDt = 0.05) => {
    if (simStatus === 'running') return;
    const duty = parsedConfig?.config?.dutyPercent ?? 40.0;
    const nextState = motorModelRef.current.step(duty, stepDt, motorComp?.properties?.loadTorque ?? 0.04);
    setSimState({ ...nextState });
    setHistory(prev => [
      ...prev.slice(-150),
      toTelemetry(nextState)
    ]);
    addSerialLog('INFO', `Stepped +${Math.round(stepDt * 1000)}ms. SimTime: ${nextState.simTime.toFixed(3)}s | RPM: ${Math.round(nextState.rpm)} | Current: ${nextState.current.toFixed(2)}A`);
  }, [simStatus, parsedConfig?.config?.dutyPercent, motorComp?.properties?.loadTorque, addSerialLog]);

  const handleValidateCircuit = useCallback(() => {
    const v = validateCircuit(components, wires);
    if (v.isValid) {
      addSerialLog('INFO', `Circuit check passed: All ${v.results.filter(r => r.severity === 'success').length} safety criteria verified.`);
    } else {
      addSerialLog('WARN', `Circuit check completed with ${v.results.filter(r => r.severity === 'error').length} error(s). Review Validation Report.`);
    }
    return v;
  }, [components, wires, addSerialLog]);

  const handleValidateProgram = useCallback(() => {
    const p = parseProgramConfiguration(cCode);
    if (p.isValid) {
      addSerialLog('INFO', `Supported program settings parsed: Duty = ${p.config.dutyPercent.toFixed(1)}%, Target = ${p.config.targetRpm} RPM. No C compilation was performed.`);
    } else {
      addSerialLog('WARN', `Firmware configuration check failed. Found ${p.issues.length} issue(s).`);
    }
    return p;
  }, [cCode, addSerialLog]);

  const value = {
    // Navigation
    activeView,
    setActiveView,
    workflowStep,
    setWorkflowStep,
    helpOpen,
    setHelpOpen,

    // Circuit Workspace
    components,
    setComponents,
    wires,
    setWires,
    selectedComponentId,
    setSelectedComponentId,
    selectedWireId,
    setSelectedWireId,
    handleAddComponent,
    handleRestoreExample,
    handleClearCircuit,

    // C Code
    cCode,
    setCCode,
    parsedConfig,
    handleApplyDutyCycle,

    // Validation
    validation,
    handleValidateCircuit,
    handleValidateProgram,

    // Simulation
    simStatus,
    simState,
    history,
    handleRunSimulation,
    handlePauseSimulation,
    handleResumeSimulation,
    handleStopSimulation,
    handleResetSimulation,
    handleStepSimulation,

    // Logs
    serialLogs,
    addSerialLog,
    clearSerialLogs
  };

  return (
    <LabContext.Provider value={value}>
      {children}
    </LabContext.Provider>
  );
}

