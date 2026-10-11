import { PIN_TYPES } from '../types/circuit.js';

export const COMPONENT_CATALOG = [
  // --- Microcontrollers ---
  {
    type: 'stm32h7_board',
    category: 'mcu',
    name: 'STM32H743ZI Board',
    subtitle: 'ARM Cortex-M7 @ 480MHz',
    description: 'High-performance Nucleo-style development board with high-resolution advanced timer (TIM1) PWM and 16-bit ADCs.',
    width: 220,
    height: 160,
    defaultProps: {
      coreClockMhz: 480,
      logicVoltage: 3.3,
      pwmTimer: 'TIM1',
      pwmChannel: 'CH1',
      pwmFrequencyHz: 20000,
      pwmPin: 'PA8'
    },
    pins: [
      { id: 'PA8', name: 'PA8 (TIM1_CH1 PWM)', type: PIN_TYPES.PWM, voltage: 3.3, x: 220, y: 35, side: 'right', direction: 'output' },
      { id: 'PA0', name: 'PA0 (ADC1_IN16)', type: PIN_TYPES.ADC, voltage: 3.3, x: 220, y: 65, side: 'right', direction: 'input' },
      { id: 'PB0', name: 'PB0 (GPIO)', type: PIN_TYPES.GPIO, voltage: 3.3, x: 220, y: 95, side: 'right', direction: 'bidirectional' },
      { id: 'UART_TX', name: 'PA9 (USART1_TX)', type: PIN_TYPES.UART_TX, voltage: 3.3, x: 220, y: 125, side: 'right', direction: 'output' },
      
      { id: 'VDD_3V3', name: '3.3V (VDD Output)', type: PIN_TYPES.POWER, voltage: 3.3, x: 0, y: 35, side: 'left', direction: 'power' },
      { id: 'VCC_5V', name: '5V Output', type: PIN_TYPES.POWER, voltage: 5.0, x: 0, y: 65, side: 'left', direction: 'power' },
      { id: 'GND_1', name: 'GND (System Ground)', type: PIN_TYPES.GROUND, voltage: 0.0, x: 0, y: 95, side: 'left', direction: 'ground' },
      { id: 'UART_RX', name: 'PA10 (USART1_RX)', type: PIN_TYPES.UART_RX, voltage: 3.3, x: 0, y: 125, side: 'left', direction: 'input' }
    ]
  },
  {
    type: 'generic_stm32_mcu',
    category: 'mcu',
    name: 'Generic STM32H7 MCU',
    subtitle: 'LQFP-64 IC Package',
    description: 'Compact MCU IC representation with dedicated PWM, ADC, and power reference pins.',
    width: 170,
    height: 140,
    defaultProps: {
      coreClockMhz: 480,
      logicVoltage: 3.3,
      pwmPin: 'PA8'
    },
    pins: [
      { id: 'PWM_OUT', name: 'PA8 (TIM1_CH1 PWM)', type: PIN_TYPES.PWM, voltage: 3.3, x: 170, y: 40, side: 'right', direction: 'output' },
      { id: 'ADC_IN', name: 'PA0 (ADC1 IN)', type: PIN_TYPES.ADC, voltage: 3.3, x: 170, y: 75, side: 'right', direction: 'input' },
      { id: 'GPIO_PIN', name: 'PB0 (GPIO)', type: PIN_TYPES.GPIO, voltage: 3.3, x: 170, y: 110, side: 'right', direction: 'bidirectional' },
      { id: 'VDD', name: 'VDD (3.3V)', type: PIN_TYPES.POWER, voltage: 3.3, x: 0, y: 45, side: 'left', direction: 'power' },
      { id: 'GND', name: 'VSS / GND', type: PIN_TYPES.GROUND, voltage: 0.0, x: 0, y: 95, side: 'left', direction: 'ground' }
    ]
  },

  // --- Motors and Actuators ---
  {
    type: 'dc_motor',
    category: 'motors',
    name: 'Brushed DC Motor',
    subtitle: 'Permanent Magnet 12V',
    description: 'Industrial brushed DC motor with rotor inertia, back-EMF, and armature coil inductance.',
    width: 180,
    height: 140,
    defaultProps: {
      ratedVoltage: 12.0,      // Volts
      resistance: 2.2,         // Armature resistance Ra (Ohms)
      inductance: 0.0018,      // Armature inductance La (Henries) - 1.8 mH
      ke: 0.048,               // Back-EMF constant Ke (V/(rad/s))
      kt: 0.048,               // Torque constant Kt (N·m/A)
      rotorInertia: 0.0006,    // J (kg·m²)
      viscousFriction: 0.0005, // B (N·m·s/rad)
      loadTorque: 0.04,        // Mechanical load torque (N·m)
      maxRpm: 3200,            // No-load RPM rating
      stallCurrent: 5.45       // Stall current (A) = V / R
    },
    pins: [
      { id: 'MOTOR_PLUS', name: 'M+ (Armature Positive)', type: PIN_TYPES.MOTOR_TERMINAL, voltage: 12.0, x: 0, y: 45, side: 'left', direction: 'bidirectional' },
      { id: 'MOTOR_MINUS', name: 'M- (Armature Negative)', type: PIN_TYPES.MOTOR_TERMINAL, voltage: 0.0, x: 0, y: 95, side: 'left', direction: 'bidirectional' }
    ]
  },

  // --- Motor Drivers ---
  {
    type: 'mosfet_driver_module',
    category: 'drivers',
    name: 'MOSFET Driver Module',
    subtitle: 'High-Power Optoisolated PWM Driver',
    description: 'Dual high-side/low-side MOSFET power switch module with integrated gate driver and 3.3V logic compatibility.',
    width: 190,
    height: 150,
    defaultProps: {
      maxCurrent: 15.0,
      maxSupplyVoltage: 24.0,
      logicThreshold: 2.0,
      logicMaxVoltage: 5.5,
      hasIntegratedDiode: true,
      onResistance: 0.015
    },
    pins: [
      // Control Side (Left)
      { id: 'PWM_IN', name: 'PWM IN (Logic Input)', type: PIN_TYPES.DRIVER_IN, voltage: 3.3, x: 0, y: 40, side: 'left', direction: 'input' },
      { id: 'LOGIC_GND', name: 'GND (Logic Ground)', type: PIN_TYPES.GROUND, voltage: 0.0, x: 0, y: 80, side: 'left', direction: 'ground' },
      { id: 'VCC_LOGIC', name: 'VCC (3.3V Logic Ref)', type: PIN_TYPES.POWER, voltage: 3.3, x: 0, y: 120, side: 'left', direction: 'power' },
      // Power & Motor Side (Right)
      { id: 'POWER_VM', name: 'V+ (Motor Supply Input)', type: PIN_TYPES.POWER, voltage: 12.0, x: 190, y: 35, side: 'right', direction: 'power' },
      { id: 'POWER_GND', name: 'PGND (Power Ground)', type: PIN_TYPES.GROUND, voltage: 0.0, x: 190, y: 65, side: 'right', direction: 'ground' },
      { id: 'OUT_PLUS', name: 'OUT+ (Motor +)', type: PIN_TYPES.DRIVER_OUT, voltage: 12.0, x: 190, y: 95, side: 'right', direction: 'output' },
      { id: 'OUT_MINUS', name: 'OUT- (Motor - / Switched)', type: PIN_TYPES.DRIVER_OUT, voltage: 0.0, x: 190, y: 125, side: 'right', direction: 'output' }
    ]
  },
  {
    type: 'discrete_mosfet',
    category: 'drivers',
    name: 'N-Channel MOSFET (IRLZ44N)',
    subtitle: 'Logic-Level Power MOSFET',
    description: 'Discrete TO-220 N-channel MOSFET designed for 3.3V/5V logic gate drive. Used in low-side switching topology.',
    width: 140,
    height: 130,
    defaultProps: {
      partNumber: 'IRLZ44N',
      vdsMax: 55,
      rdsOn: 0.028,
      vgsThreshold: 2.0,
      maxCurrent: 12.0
    },
    pins: [
      { id: 'GATE', name: 'Gate (G - Logic PWM)', type: PIN_TYPES.DRIVER_IN, voltage: 3.3, x: 0, y: 65, side: 'left', direction: 'input' },
      { id: 'DRAIN', name: 'Drain (D - Motor Return)', type: PIN_TYPES.DRIVER_OUT, voltage: 12.0, x: 140, y: 40, side: 'right', direction: 'output' },
      { id: 'SOURCE', name: 'Source (S - Power GND)', type: PIN_TYPES.GROUND, voltage: 0.0, x: 140, y: 90, side: 'right', direction: 'ground' }
    ]
  },

  // --- Protection Components ---
  {
    type: 'flyback_diode',
    category: 'protection',
    name: 'Flyback Diode (1N5819)',
    subtitle: 'Schottky Clamping Diode',
    description: 'Essential inductive clamp diode placed antiparallel across motor terminals to suppress inductive kickback spikes.',
    width: 130,
    height: 90,
    defaultProps: {
      partNumber: '1N5819 Schottky',
      forwardDrop: 0.45,
      maxReverseVoltage: 40
    },
    pins: [
      { id: 'ANODE', name: 'Anode (A - to Low-Side Switch/Drain)', type: PIN_TYPES.MOTOR_TERMINAL, voltage: 0.0, x: 0, y: 45, side: 'left', direction: 'bidirectional' },
      { id: 'CATHODE', name: 'Cathode (K - to V+ Supply)', type: PIN_TYPES.POWER, voltage: 12.0, x: 130, y: 45, side: 'right', direction: 'bidirectional' }
    ]
  },

  // --- Power Supply & Rails ---
  {
    type: 'dc_power_supply',
    category: 'power',
    name: 'DC Power Supply',
    subtitle: 'Regulated Bench Supply',
    description: 'Adjustable benchtop DC power source providing isolated motor drive power.',
    width: 180,
    height: 120,
    defaultProps: {
      voltage: 12.0,
      currentLimit: 5.0,
      rippleMv: 15
    },
    pins: [
      { id: 'V_PLUS', name: 'V+ (Positive 12V)', type: PIN_TYPES.POWER, voltage: 12.0, x: 180, y: 40, side: 'right', direction: 'power' },
      { id: 'V_MINUS', name: 'GND (Negative / Return)', type: PIN_TYPES.GROUND, voltage: 0.0, x: 180, y: 80, side: 'right', direction: 'ground' }
    ]
  },
  {
    type: 'ground_terminal',
    category: 'power',
    name: 'Ground Bus Node',
    subtitle: 'Common Earth/Chassis GND',
    description: 'Star-ground junction node to link microcontroller GND and motor power GND into a single common ground reference.',
    width: 110,
    height: 80,
    defaultProps: {},
    pins: [
      { id: 'GND_PIN_1', name: 'GND Port 1', type: PIN_TYPES.GROUND, voltage: 0.0, x: 0, y: 40, side: 'left', direction: 'ground' },
      { id: 'GND_PIN_2', name: 'GND Port 2', type: PIN_TYPES.GROUND, voltage: 0.0, x: 110, y: 40, side: 'right', direction: 'ground' }
    ]
  },
  {
    type: 'breadboard_rail',
    category: 'power',
    name: 'Dual Power Rail',
    subtitle: 'VCC & GND Distribution Bus',
    description: 'Power distribution strip providing multiple tap points for VCC and Common GND.',
    width: 200,
    height: 80,
    defaultProps: {
      voltage: 12.0
    },
    pins: [
      { id: 'RAIL_VCC_1', name: 'VCC Bus In', type: PIN_TYPES.POWER, voltage: 12.0, x: 0, y: 25, side: 'left', direction: 'power' },
      { id: 'RAIL_GND_1', name: 'GND Bus In', type: PIN_TYPES.GROUND, voltage: 0.0, x: 0, y: 55, side: 'left', direction: 'ground' },
      { id: 'RAIL_VCC_2', name: 'VCC Bus Out', type: PIN_TYPES.POWER, voltage: 12.0, x: 200, y: 25, side: 'right', direction: 'power' },
      { id: 'RAIL_GND_2', name: 'GND Bus Out', type: PIN_TYPES.GROUND, voltage: 0.0, x: 200, y: 55, side: 'right', direction: 'ground' }
    ]
  },

  // --- Sensors ---
  {
    type: 'current_sensor',
    category: 'sensors',
    name: 'Current Sensor (ACS712)',
    subtitle: 'Hall-Effect Shunt Module',
    description: 'Linear Hall current sensor module inserted in series with the motor. Outputs analog voltage (185 mV/A) to STM32 ADC.',
    width: 170,
    height: 130,
    defaultProps: {
      model: 'ACS712-05B',
      sensitivityVoltsPerAmp: 0.185,
      zeroCurrentVolts: 1.65,
      maxAmps: 5.0
    },
    pins: [
      // Series Current Path
      { id: 'IP_PLUS', name: 'IP+ (Current In)', type: PIN_TYPES.SENSOR_IN, voltage: 12.0, x: 0, y: 40, side: 'left', direction: 'bidirectional' },
      { id: 'IP_MINUS', name: 'IP- (Current Out)', type: PIN_TYPES.SENSOR_IN, voltage: 12.0, x: 0, y: 90, side: 'left', direction: 'bidirectional' },
      // Signal & Supply to MCU
      { id: 'VCC_SENSE', name: 'VCC (3.3V/5V Supply)', type: PIN_TYPES.POWER, voltage: 3.3, x: 170, y: 35, side: 'right', direction: 'power' },
      { id: 'VOUT', name: 'VOUT (Analog Signal -> ADC)', type: PIN_TYPES.SENSOR_OUT, voltage: 3.3, x: 170, y: 65, side: 'right', direction: 'output' },
      { id: 'GND_SENSE', name: 'GND', type: PIN_TYPES.GROUND, voltage: 0.0, x: 170, y: 95, side: 'right', direction: 'ground' }
    ]
  },
  {
    type: 'voltage_sensor',
    category: 'sensors',
    name: 'Voltage Sensor (0-25V)',
    subtitle: 'Resistive Divider 5:1',
    description: 'Precision 5:1 resistor divider converting 0-25V motor supply to 0-3.3V STM32 ADC safe input range.',
    width: 150,
    height: 110,
    defaultProps: {
      dividerRatio: 0.2, // 5:1 reduction
      inputMax: 25.0
    },
    pins: [
      { id: 'VIN_PLUS', name: 'VCC_Sense (to Motor V+)', type: PIN_TYPES.SENSOR_IN, voltage: 12.0, x: 0, y: 40, side: 'left', direction: 'input' },
      { id: 'VIN_GND', name: 'GND_Sense', type: PIN_TYPES.GROUND, voltage: 0.0, x: 0, y: 75, side: 'left', direction: 'ground' },
      { id: 'V_SIGNAL', name: 'S (Scaled Out -> ADC)', type: PIN_TYPES.SENSOR_OUT, voltage: 3.3, x: 150, y: 55, side: 'right', direction: 'output' }
    ]
  },

  // --- Measurement Tools ---
  {
    type: 'virtual_oscilloscope',
    category: 'tools',
    name: 'Virtual Oscilloscope',
    subtitle: '2-Channel Signal Probe',
    description: 'Benchtop probe tap to capture live PWM waveforms and motor terminal switching transients.',
    width: 160,
    height: 110,
    defaultProps: {
      timebaseMs: 0.05,
      ch1VoltsDiv: 1.0,
      ch2VoltsDiv: 5.0
    },
    pins: [
      { id: 'OSC_CH1', name: 'CH1 Probe (e.g. PWM)', type: PIN_TYPES.PROBE, voltage: 3.3, x: 0, y: 35, side: 'left', direction: 'input' },
      { id: 'OSC_CH2', name: 'CH2 Probe (e.g. Motor V)', type: PIN_TYPES.PROBE, voltage: 12.0, x: 0, y: 70, side: 'left', direction: 'input' },
      { id: 'OSC_GND', name: 'GND Clip', type: PIN_TYPES.GROUND, voltage: 0.0, x: 160, y: 55, side: 'right', direction: 'ground' }
    ]
  }
];

export function getComponentDef(type) {
  return COMPONENT_CATALOG.find(c => c.type === type);
}

