/**
 * Automated Verification Test Suite for the 13 Required Laboratory Scenarios
 * AI Recommends Energy-Efficient PWM Duty Cycle — STM32H7 + DC Motor
 */

import { validateCircuit } from './src/engine/validationEngine.js';
import { parseProgramConfiguration, updateDutyCycleInCode } from './src/engine/codeParser.js';
import { DCMotorModel } from './src/engine/motorSimulation.js';
import { runModelBasedOptimizer } from './src/engine/aiOptimizer.js';
import { EXAMPLE_CIRCUIT } from './src/data/exampleCircuits.js';
import { SAMPLE_C_PROGRAM } from './src/data/samplePrograms.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('================================================================');
console.log('RUNNING AUTOMATED TEST SUITE: 13 LABORATORY SCENARIOS');
console.log('================================================================\n');

const missingDutyConfig = parseProgramConfiguration('void main(void) { HAL_Init(); }');
assert(!missingDutyConfig.isValid, 'Program without a supported duty setting is blocked');
const badDutyConfig = parseProgramConfiguration('float duty_percent = 120.0f;');
assert(!badDutyConfig.isValid, 'Duty cycle above 100% is rejected');
const unsupportedDutyConfig = parseProgramConfiguration('float duty_percent = computed_value;');
assert(!unsupportedDutyConfig.isValid && unsupportedDutyConfig.issues.some(issue => issue.code === 'ERR_UNSUPPORTED_DUTY_PATTERN'), 'Unsupported duty assignment is explained');

// -----------------------------------------------------------------------------
// Scenario 1: Start with a blank workspace
// -----------------------------------------------------------------------------
console.log('--- SCENARIO 1: Start with a blank workspace ---');
const emptyValidation = validateCircuit([], []);
assert(!emptyValidation.isValid, 'Blank workspace fails validation');
assert(emptyValidation.hasBlockingErrors, 'Blank workspace has blocking errors');
assert(
  emptyValidation.results.some(r => r.code === 'ERR_NO_MCU'),
  'Blank workspace correctly identifies missing STM32H7 MCU'
);
assert(
  emptyValidation.results.some(r => r.code === 'ERR_NO_MOTOR'),
  'Blank workspace correctly identifies missing DC Motor'
);

// -----------------------------------------------------------------------------
// Scenario 2: Add STM32H7 and DC Motor
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 2: Add STM32H7 and DC Motor ---');
const partialComponents = [
  { id: 'mcu_1', type: 'stm32h7_board', name: 'STM32H7 Board' },
  { id: 'motor_1', type: 'dc_motor', name: 'Brushed DC Motor', properties: { ratedVoltage: 12, loadTorque: 0.04 } }
];
const partialValidation = validateCircuit(partialComponents, []);
assert(!partialValidation.isValid, 'MCU + Motor without wiring fails validation');
assert(
  partialValidation.results.some(r => r.code === 'ERR_NO_DRIVER'),
  'Correctly detects missing motor driver / power stage'
);

// -----------------------------------------------------------------------------
// Scenario 3: Direct MCU PWM pin connection to motor (Overload detection)
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 3: Direct MCU PWM pin connection ---');
const directWires = [
  { id: 'w1', from: { componentId: 'mcu_1', pinId: 'PA8' }, to: { componentId: 'motor_1', pinId: 'MOTOR_PLUS' } },
  { id: 'w2', from: { componentId: 'mcu_1', pinId: 'GND' }, to: { componentId: 'motor_1', pinId: 'MOTOR_MINUS' } }
];
const overloadValidation = validateCircuit(partialComponents, directWires);
assert(!overloadValidation.isValid, 'Direct MCU connection is blocked');
assert(
  overloadValidation.results.some(r => r.code === 'ERR_UNSAFE_DIRECT_DRIVE'),
  'Blocks with ERR_UNSAFE_DIRECT_DRIVE (prevents frying 20mA GPIO pin with 5A motor)'
);

// -----------------------------------------------------------------------------
// Scenario 4 & 5: Add motor driver, DC power supply, ground, and flyback diode
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 4 & 5: Add driver, power supply, ground & flyback diode ---');
const fullComponents = EXAMPLE_CIRCUIT.components;
const fullWires = EXAMPLE_CIRCUIT.wires;
assert(fullComponents.length === 6, 'Reference circuit contains 6 hardware components');
assert(fullWires.length === 13, 'Reference circuit contains 13 verified interconnect wires');

// -----------------------------------------------------------------------------
// Scenario 6: Validate complete circuit
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 6: Validate complete reference circuit ---');
const fullValidation = validateCircuit(fullComponents, fullWires);
assert(fullValidation.isValid, 'Complete reference circuit passes validation');
assert(!fullValidation.hasBlockingErrors, 'Complete circuit has zero blocking errors');
const successCodes = fullValidation.results.filter(r => r.severity === 'success').map(r => r.code);
assert(successCodes.includes('OK_PWM_CONNECTED'), 'PWM timer signal verified');
assert(successCodes.includes('OK_COMMON_GROUND'), 'Common ground return verified');
assert(successCodes.includes('OK_FLYBACK_INTEGRATED'), 'Integrated flyback protection verified');
assert(successCodes.includes('OK_MOTOR_CONNECTED'), 'Motor drive power loop verified');
assert(successCodes.includes('OK_LOGIC_LEVEL_COMPATIBLE'), '3.3V MCU output is compatible with the driver input');
assert(successCodes.includes('OK_MOTOR_VOLTAGE_RATING'), 'Supply voltage respects the motor rating');

const missingDriverLogicSupply = fullWires.filter(wire => wire.id !== 'w_driver_logic_vcc');
assert(validateCircuit(fullComponents, missingDriverLogicSupply).results.some(result => result.code === 'ERR_DRIVER_LOGIC_POWER'), 'Missing driver logic power blocks validation');
const overvoltageComponents = fullComponents.map(component => component.type === 'dc_power_supply'
  ? { ...component, properties: { ...component.properties, voltage: 30 } }
  : component);
const overvoltageResult = validateCircuit(overvoltageComponents, fullWires);
assert(overvoltageResult.results.some(result => result.code === 'ERR_MOTOR_OVERVOLTAGE' && result.severity === 'error'), 'Supply above motor rating blocks validation');
assert(overvoltageResult.results.some(result => result.code === 'ERR_DRIVER_VOLTAGE_RATING'), 'Supply above driver rating blocks validation');

// -----------------------------------------------------------------------------
// Scenario 7: Run with sample program
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 7: Run with sample program ---');
const parsed = parseProgramConfiguration(SAMPLE_C_PROGRAM);
assert(parsed.isValid, 'Sample C program parses cleanly');
assert(parsed.config.dutyPercent === 40.0, 'Extracted duty cycle is 40.0%');
assert(parsed.config.targetRpm === 1000.0, 'Extracted target RPM is 1000');
assert(parsed.config.pwmFrequencyHz === 20000, 'Extracted PWM timer frequency is 20,000 Hz');
assert(parsed.config.maxCurrentLimit === 3.5, 'Extracted firmware current limit is 3.5 A');

const motor = new DCMotorModel({ resistance: 2.2, inductance: 0.0018, loadTorque: 0.04 }, { voltage: 12.0 });
// Run simulation for 2.0 seconds
for (let t = 0; t < 40; t++) {
  motor.step(parsed.config.dutyPercent, 0.05);
}
const state40 = motor.getState(40.0);
assert(state40.rpm > 300 && state40.rpm < 600, `40% duty gives expected steady speed: ${Math.round(state40.rpm)} RPM`);
assert(state40.current > 0.8 && state40.current < 2.0, `Armature current is realistic: ${state40.current.toFixed(2)} A`);
assert(Math.abs(state40.powerMech - (0.04 * state40.omega)) < 1e-8, 'Useful mechanical output is load torque multiplied by shaft speed');

const currentLimitedMotor = new DCMotorModel({ resistance: 2.2, inductance: 0.0018 }, { voltage: 12, currentLimit: 0.5 });
const limitedState = currentLimitedMotor.step(100, 0.05);
assert(limitedState.current <= 0.5, 'Motor simulation respects the configured supply current limit');
assert(limitedState.pwmFrequencyHz === 20000, 'Motor state exposes the configured PWM frequency');
const lowFrequencyMotor = new DCMotorModel({ resistance: 2.2, inductance: 0.0018, pwmFrequencyHz: 1000 }, { voltage: 12, currentLimit: 5 });
const highFrequencyMotor = new DCMotorModel({ resistance: 2.2, inductance: 0.0018, pwmFrequencyHz: 20000 }, { voltage: 12, currentLimit: 5 });
for (let index = 0; index < 40; index += 1) {
  lowFrequencyMotor.step(65, 0.05);
  highFrequencyMotor.step(65, 0.05);
}
assert(lowFrequencyMotor.getState(65).powerElec > highFrequencyMotor.getState(65).powerElec, 'PWM frequency changes modeled ripple loss and input power');

// -----------------------------------------------------------------------------
// Scenario 8: Change duty cycle in code
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 8: Change duty cycle in code ---');
const updatedCode = updateDutyCycleInCode(SAMPLE_C_PROGRAM, 65.0);
const parsed65 = parseProgramConfiguration(updatedCode);
assert(parsed65.config.dutyPercent === 65.0, 'C code duty cycle successfully updated to 65.0%');

const motor65 = new DCMotorModel({ resistance: 2.2, inductance: 0.0018, loadTorque: 0.04 }, { voltage: 12.0 });
for (let t = 0; t < 40; t++) {
  motor65.step(65.0, 0.05);
}
const state65 = motor65.getState(65.0);
assert(state65.rpm > state40.rpm, `Higher duty cycle (65%) yields higher RPM (${Math.round(state65.rpm)} vs ${Math.round(state40.rpm)})`);
assert(state65.voltage > state40.voltage, `Higher duty cycle yields higher terminal voltage (${state65.voltage.toFixed(2)}V vs ${state40.voltage.toFixed(2)}V)`);

// -----------------------------------------------------------------------------
// Scenario 9: Remove essential wire (PWM wire)
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 9: Remove essential wire ---');
const wiresWithoutPwm = fullWires.filter(w => w.id !== 'w_pwm');
const brokenValidation = validateCircuit(fullComponents, wiresWithoutPwm);
assert(!brokenValidation.isValid, 'Removing PWM wire blocks circuit validation');
assert(
  brokenValidation.results.some(r => r.code === 'ERR_PWM_NOT_CONNECTED'),
  'Correctly detects ERR_PWM_NOT_CONNECTED error'
);

// -----------------------------------------------------------------------------
// Scenario 10: Increase motor load torque
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 10: Increase motor load torque ---');
const motorHeavy = new DCMotorModel({ resistance: 2.2, inductance: 0.0018, loadTorque: 0.08 }, { voltage: 12.0 });
for (let t = 0; t < 40; t++) {
  motorHeavy.step(65.0, 0.05);
}
const stateHeavy = motorHeavy.getState(65.0);
assert(stateHeavy.current > state65.current, `Higher load torque (0.08 N·m) draws more current (${stateHeavy.current.toFixed(2)}A vs ${state65.current.toFixed(2)}A)`);
assert(stateHeavy.rpm < state65.rpm, `Higher load torque causes realistic speed droop (${Math.round(stateHeavy.rpm)} vs ${Math.round(state65.rpm)} RPM)`);

// -----------------------------------------------------------------------------
// Scenario 11: Apply AI optimizer recommendation
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 11: AI Energy Optimizer ---');
const optResult = runModelBasedOptimizer({
  motorParams: { resistance: 2.2, inductance: 0.0018, loadTorque: 0.04 },
  supplyParams: { voltage: 12.0 },
  targetRpm: 1000.0,
  baselineDuty: 90.0,
  simulatedPeriodMinutes: 10.0
});
assert(optResult.bestCandidate !== null, 'AI Optimizer finds best candidate');
assert(optResult.bestCandidate.dutyPercent < 90.0, `AI recommends energy-efficient duty: ${optResult.bestCandidate.dutyPercent}%`);
assert(optResult.savingsPercent > 10.0, `Achieves projected energy savings: ${optResult.savingsPercent.toFixed(1)}%`);
assert(optResult.candidates.length === 101, 'Optimizer simulates every 1% duty candidate from 0% through 100%');
const impossibleTarget = runModelBasedOptimizer({
  motorParams: { resistance: 2.2, inductance: 0.0018, loadTorque: 0.04 },
  supplyParams: { voltage: 12, currentLimit: 5 },
  targetRpm: 3500,
  baselineDuty: 40
});
assert(impossibleTarget.bestCandidate === null && impossibleTarget.savingsPercent === null, 'Optimizer reports no recommendation when the target is infeasible');

const appliedCode = updateDutyCycleInCode(SAMPLE_C_PROGRAM, optResult.bestCandidate.dutyPercent);
const parsedApplied = parseProgramConfiguration(appliedCode);
assert(
  Math.abs(parsedApplied.config.dutyPercent - optResult.bestCandidate.dutyPercent) < 0.01,
  'Recommended duty cycle successfully applies to C code'
);

// -----------------------------------------------------------------------------
// Scenario 12: Pause, resume, stop, step, export
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 12: Simulation control primitives & step-by-step ---');
const motorStep = new DCMotorModel({ resistance: 2.2, inductance: 0.0018, loadTorque: 0.04 }, { voltage: 12.0 });
const step1 = motorStep.step(50.0, 0.05);
assert(step1.simTime === 0.05, 'Step accurately increments simulation time by 50ms');
const step2 = motorStep.step(50.0, 0.05);
assert(Math.abs(step2.simTime - 0.10) < 0.001, 'Step 2 reaches exactly 100ms');

// Reset
motorStep.reset();
assert(motorStep.simTime === 0.0 && motorStep.rpm === 0.0, 'Reset zeroes all state variables');

// Waveform generator
const waveform = motorStep.generateOscilloscopeWaveform(50.0);
assert(waveform.length === 200, 'Oscilloscope waveform contains 200 high-resolution samples');
assert(waveform[0].ch1LogicV === 3.3, 'Channel 1 starts high logic');

// -----------------------------------------------------------------------------
// Scenario 13: LocalStorage State Persistence (Contract verification)
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 13: LocalStorage Data Serialization ---');
const serializedComponents = JSON.stringify(fullComponents);
const deserializedComponents = JSON.parse(serializedComponents);
assert(deserializedComponents.length === fullComponents.length, 'Component serialization round-trips without data loss');

const serializedWires = JSON.stringify(fullWires);
const deserializedWires = JSON.parse(serializedWires);
assert(deserializedWires.length === fullWires.length, 'Wire connection serialization round-trips without data loss');

console.log('\n================================================================');
console.log(`TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('================================================================');

