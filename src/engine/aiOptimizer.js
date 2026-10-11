/**
 * Deterministic model-based PWM duty-cycle search.
 * Each candidate is run through the same transient motor model used by the lab.
 */
import { DCMotorModel } from './motorSimulation.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));
}

export function simulateDutyCandidate({
  dutyPercent,
  motorParams = {},
  supplyParams = {},
  evaluationMinutes = 10,
  settleSeconds = 2.4,
  stepSeconds = 0.02
}) {
  const ratedVoltage = motorParams.ratedVoltage ?? 12;
  const supplyVoltage = supplyParams.voltage ?? 12;
  const allowedVoltage = supplyVoltage <= ratedVoltage;
  const model = new DCMotorModel(motorParams, supplyParams);
  const sampleWindowSeconds = 0.4;
  const samples = [];
  const steps = Math.ceil(settleSeconds / stepSeconds);

  for (let index = 0; index < steps; index += 1) {
    const state = model.step(dutyPercent, stepSeconds, motorParams.loadTorque ?? 0.04);
    if (model.simTime >= settleSeconds - sampleWindowSeconds) samples.push(state);
  }

  const divisor = Math.max(1, samples.length);
  const average = key => samples.reduce((sum, item) => sum + (item[key] || 0), 0) / divisor;
  const rpm = average('rpm');
  const current = average('current');
  const power = average('powerElec');
  const mechanicalPower = average('powerMech');
  const energyWh = (power * evaluationMinutes * 60) / 3600;

  return {
    dutyPercent,
    rpm,
    current,
    power,
    mechanicalPower,
    efficiency: power > 0.05 ? Math.min(100, (mechanicalPower / power) * 100) : 0,
    energyWh,
    allowedVoltage,
    isFeasible: allowedVoltage,
    simulatedSeconds: settleSeconds
  };
}

export function runModelBasedOptimizer({
  motorParams = {},
  supplyParams = {},
  targetRpm = 1000,
  baselineDuty = 40,
  rpmTolerancePercent = 2.5,
  simulatedPeriodMinutes = 10
}) {
  const periodMinutes = clamp(simulatedPeriodMinutes, 1, 1440);
  const validTargetRpm = clamp(targetRpm, 100, 3500);
  const tolerancePercent = clamp(rpmTolerancePercent, 0.1, 25);
  const rpmTolerance = validTargetRpm * (tolerancePercent / 100);
  const currentLimit = supplyParams.currentLimit ?? 5;
  const candidates = [];

  // Search the complete PWM range at 1% resolution. Candidate metrics come from
  // transient simulations and use the final 0.4 s as a steady-state estimate.
  for (let duty = 0; duty <= 100; duty += 1) {
    const candidate = simulateDutyCandidate({
      dutyPercent: duty,
      motorParams,
      supplyParams,
      evaluationMinutes: periodMinutes
    });
    const rpmError = Math.abs(candidate.rpm - validTargetRpm);
    const isFeasible = candidate.allowedVoltage &&
      candidate.current <= currentLimit + 1e-6 &&
      candidate.current > 0 &&
      rpmError <= rpmTolerance;

    candidates.push({ ...candidate, rpmError, isFeasible });
  }

  const baseline = simulateDutyCandidate({
    dutyPercent: clamp(baselineDuty, 0, 100),
    motorParams,
    supplyParams,
    evaluationMinutes: periodMinutes
  });
  baseline.rpmError = Math.abs(baseline.rpm - validTargetRpm);

  const feasibleCandidates = candidates.filter(candidate => candidate.isFeasible);
  const bestCandidate = feasibleCandidates.reduce((best, candidate) =>
    !best || candidate.energyWh < best.energyWh ? candidate : best, null);
  const savingsPercent = baseline.energyWh > 0.001 && bestCandidate
    ? ((baseline.energyWh - bestCandidate.energyWh) / baseline.energyWh) * 100
    : null;

  const reasoning = bestCandidate
    ? [
        `Simulated ${candidates.length} duty-cycle candidates with the motor model for ${bestCandidate.simulatedSeconds.toFixed(1)} s each.`,
        `The lowest-energy feasible point is ${bestCandidate.dutyPercent.toFixed(1)}% duty at ${Math.round(bestCandidate.rpm)} RPM, within ${tolerancePercent.toFixed(1)}% of the target.`,
        `Estimated steady-state draw is ${bestCandidate.power.toFixed(2)} W and ${bestCandidate.current.toFixed(2)} A; the ${periodMinutes}-minute energy estimate uses that simulated steady-state power.`,
        savingsPercent === null
          ? 'A baseline energy comparison is unavailable at the current operating point.'
          : `Estimated energy change versus the current ${Number(baselineDuty).toFixed(1)}% setting is ${Math.abs(savingsPercent).toFixed(1)}% ${savingsPercent >= 0 ? 'lower' : 'higher'}.`
      ]
    : [
        `Simulated ${candidates.length} duty-cycle candidates with the motor model for ${2.4.toFixed(1)} s each.`,
        `No candidate meets the ${validTargetRpm.toFixed(0)} RPM target within ${tolerancePercent.toFixed(1)}% while respecting the current and motor-voltage limits.`,
        'Lower the target, increase a valid supply/current limit, or review the selected motor parameters.'
      ];

  return {
    bestCandidate,
    baseline,
    savingsPercent,
    targetRpm: validTargetRpm,
    loadTorque: motorParams.loadTorque ?? 0.04,
    rpmTolerance,
    candidates,
    feasibleCount: feasibleCandidates.length,
    reasoning,
    timestamp: new Date().toLocaleTimeString()
  };
}
