/**
 * Deterministic Brushed DC Motor Numerical Physics Engine
 * AI Recommends Energy-Efficient PWM Duty Cycle — STM32H7 + DC Motor
 *
 * Implements coupled electro-mechanical differential equations using
 * 4th-order Runge-Kutta (RK4) integration with adaptive sub-stepping
 * for unconditional numerical stability.
 */

export class DCMotorModel {
  constructor(motorParams = {}, supplyParams = {}) {
    this.reset(motorParams, supplyParams);
  }

  reset(motorParams = {}, supplyParams = {}) {
    // Electrical parameters
    this.Ra = motorParams.resistance ?? 2.2;         // Armature resistance (Ohms)
    this.La = motorParams.inductance ?? 0.0018;      // Armature inductance (Henries: 1.8 mH)
    this.Ke = motorParams.ke ?? 0.048;               // Back-EMF constant (V/(rad/s))
    this.Kt = motorParams.kt ?? 0.048;               // Torque constant (N·m/A)
    
    // Mechanical parameters
    this.J = motorParams.rotorInertia ?? 0.0006;     // Rotor inertia (kg·m²)
    this.B = motorParams.viscousFriction ?? 0.0005;  // Viscous damping (N·m·s/rad)
    this.loadTorque = motorParams.loadTorque ?? 0.04;// Load torque (N·m)
    
    // Power supply & limits
    this.vSupply = supplyParams.voltage ?? 12.0;     // Supply voltage (V)
    this.currentLimit = supplyParams.currentLimit ?? 5.0; // Current limit (A)
    this.pwmFrequency = motorParams.pwmFrequencyHz ?? 20000; // PWM freq (Hz)

    // State variables
    this.current = 0.0;     // Armature current i_a (A)
    this.omega = 0.0;       // Angular velocity w (rad/s)
    this.theta = 0.0;       // Shaft rotation angle (rad)
    this.simTime = 0.0;     // Total simulation time (s)
    this.energyJoules = 0.0;// Cumulative electrical energy (Joules)
    this.temperatureC = 25.0;// Motor temperature (°C)
    this.currentRipplePp = 0.0;
    this.currentRms = 0.0;

    // Current operating outputs
    this.rpm = 0.0;
    this.vAvg = 0.0;
    this.pElec = 0.0;
    this.pMech = 0.0;
    this.efficiency = 0.0;
  }

  derivatives(i, w, vApp, loadTorque) {
    const di_dt = (vApp - this.Ra * i - this.Ke * w) / this.La;
    const torqueElec = this.Kt * i;
    let netTorque = torqueElec - loadTorque - this.B * w;

    // Stiction / non-reversing clamp under static load
    if (w <= 0.0 && netTorque < 0.0) {
      netTorque = 0.0;
    }

    const dw_dt = netTorque / this.J;
    return { di_dt, dw_dt };
  }

  step(dutyPercent, dt, overrideLoad = null) {
    const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
    if (safeDt === 0) return this.getState(dutyPercent);

    const requestedDuty = Number.isFinite(dutyPercent) ? dutyPercent : 0;
    const duty = Math.max(0.0, Math.min(100.0, requestedDuty)) / 100.0;
    const vApp = this.vSupply * duty;
    const loadT = overrideLoad !== null ? overrideLoad : this.loadTorque;

    // Adaptive sub-stepping for unconditional numerical stability with small L/R time constants
    const maxSubDt = 0.0002; // 0.2 ms maximum step, ensuring subDt << La / Ra
    const subSteps = Math.max(1, Math.ceil(safeDt / maxSubDt));
    const subDt = safeDt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      // RK4: k1
      const k1 = this.derivatives(this.current, this.omega, vApp, loadT);

      // RK4: k2
      const i_k2 = this.current + 0.5 * subDt * k1.di_dt;
      const w_k2 = this.omega + 0.5 * subDt * k1.dw_dt;
      const k2 = this.derivatives(i_k2, w_k2, vApp, loadT);

      // RK4: k3
      const i_k3 = this.current + 0.5 * subDt * k2.di_dt;
      const w_k3 = this.omega + 0.5 * subDt * k2.dw_dt;
      const k3 = this.derivatives(i_k3, w_k3, vApp, loadT);

      // RK4: k4
      const i_k4 = this.current + subDt * k3.di_dt;
      const w_k4 = this.omega + subDt * k3.dw_dt;
      const k4 = this.derivatives(i_k4, w_k4, vApp, loadT);

      // Update state
      this.current += (subDt / 6.0) * (k1.di_dt + 2 * k2.di_dt + 2 * k3.di_dt + k4.di_dt);
      this.omega += (subDt / 6.0) * (k1.dw_dt + 2 * k2.dw_dt + 2 * k3.dw_dt + k4.dw_dt);

      // Enforce physical bounds
      if (!Number.isFinite(this.current) || this.current < 0.0) this.current = 0.0;
      this.current = Math.min(this.current, Math.max(0, this.currentLimit));
      if (!Number.isFinite(this.omega) || this.omega < 0.0) this.omega = 0.0;

      // Update shaft angle
      this.theta += this.omega * subDt;
    }

    // Cumulative time
    this.simTime += safeDt;

    // Metrics computation
    this.rpm = (this.omega * 60.0) / (2.0 * Math.PI);
    this.vAvg = vApp;
    this.currentRipplePp = this.pwmFrequency > 0
      ? (this.vSupply * duty * (1.0 - duty)) / (this.pwmFrequency * this.La)
      : 0;
    this.currentRms = Math.sqrt(this.current ** 2 + this.currentRipplePp ** 2 / 12.0);
    const pwmRippleCopperLoss = this.Ra * (this.currentRms ** 2 - this.current ** 2);
    this.pElec = this.vAvg * this.current + Math.max(0, pwmRippleCopperLoss);
    
    // Useful shaft output is the power delivered to the external mechanical load.
    this.pMech = Math.max(0.0, loadT * this.omega);

    // Efficiency
    if (this.pElec > 0.05) {
      this.efficiency = Math.min(100.0, Math.max(0.0, (this.pMech / this.pElec) * 100.0));
    } else {
      this.efficiency = 0.0;
    }

    // Energy in Joules (P * dt)
    this.energyJoules += this.pElec * safeDt;

    // Thermal heating (P_loss = P_elec - P_mech)
    const pLoss = Math.max(0.0, this.pElec - this.pMech);
    const rThermal = 1.8; // °C/W thermal resistance
    const targetTemp = 25.0 + pLoss * rThermal;
    this.temperatureC += (targetTemp - this.temperatureC) * 0.02 * dt;

    return this.getState(dutyPercent);
  }

  getState(dutyPercent = 40.0) {
    const energyWh = this.energyJoules / 3600.0;
    const backEmf = this.Ke * this.omega;

    return {
      simTime: this.simTime,
      dutyPercent,
      rpm: this.rpm,
      current: this.current,
      currentRms: this.currentRms,
      currentRipplePp: this.currentRipplePp,
      voltage: this.vAvg,
      supplyVoltage: this.vSupply,
      pwmFrequencyHz: this.pwmFrequency,
      currentLimit: this.currentLimit,
      backEmf,
      powerElec: this.pElec,
      powerMech: this.pMech,
      efficiency: this.efficiency,
      energyJoules: this.energyJoules,
      energyWh: energyWh,
      temperatureC: this.temperatureC,
      theta: this.theta,
      omega: this.omega,
      torque: this.Kt * this.current,
      loadTorque: this.loadTorque
    };
  }

  generateOscilloscopeWaveform(dutyPercent, windowSeconds = 0.0005, samplePoints = 200) {
    const duty = Math.max(0.0, Math.min(100.0, Number.isFinite(dutyPercent) ? dutyPercent : 0)) / 100.0;
    const period = 1.0 / this.pwmFrequency;
    const samples = [];
    const tStart = this.simTime;
    const dt = windowSeconds / samplePoints;

    const deltaI = (this.vSupply * duty * (1.0 - duty)) / (this.pwmFrequency * this.La);

    for (let i = 0; i < samplePoints; i++) {
      const t = tStart + i * dt;
      const tMod = t % period;
      const isHigh = tMod < (duty * period);

      const ch1LogicV = isHigh ? 3.3 : 0.0;
      const ch2MotorV = isHigh ? this.vSupply : -0.45;

      const ripplePhase = isHigh ? (tMod / (duty * period || 1)) : 1.0 - ((tMod - duty * period) / ((1 - duty) * period || 1));
      const instantaneousCurrent = Math.max(0.0, this.current + (ripplePhase - 0.5) * deltaI);

      samples.push({
        timeMs: (t - tStart) * 1000.0,
        ch1LogicV,
        ch2MotorV,
        currentA: instantaneousCurrent
      });
    }

    return samples;
  }
}

