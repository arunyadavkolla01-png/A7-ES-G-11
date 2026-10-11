/**
 * Circuit Data Types and Constants
 * AI Recommends Energy-Efficient PWM Duty Cycle — STM32H7 + DC Motor
 */

export const COMPONENT_CATEGORIES = {
  MCU: { id: 'mcu', name: 'Microcontrollers', icon: 'Cpu' },
  MOTORS: { id: 'motors', name: 'Motors & Actuators', icon: 'Cog' },
  DRIVERS: { id: 'drivers', name: 'Motor Drivers', icon: 'Zap' },
  PROTECTION: { id: 'protection', name: 'Protection', icon: 'ShieldAlert' },
  POWER: { id: 'power', name: 'Power & Ground', icon: 'BatteryCharging' },
  SENSORS: { id: 'sensors', name: 'Sensors', icon: 'Activity' },
  TOOLS: { id: 'tools', name: 'Measurement Tools', icon: 'Gauge' }
};

export const PIN_TYPES = {
  PWM: 'pwm',
  GPIO: 'gpio',
  ADC: 'adc',
  UART_TX: 'uart_tx',
  UART_RX: 'uart_rx',
  POWER: 'power',
  GROUND: 'ground',
  MOTOR_TERMINAL: 'motor_terminal',
  DRIVER_IN: 'driver_in',
  DRIVER_OUT: 'driver_out',
  SENSOR_IN: 'sensor_in',
  SENSOR_OUT: 'sensor_out',
  PROBE: 'probe'
};

export const WIRE_COLORS = {
  GROUND: '#4b5563',    // Dark Gray / Black
  POWER_VCC: '#ef4444', // Red
  POWER_3V3: '#f59e0b', // Amber
  PWM: '#06b6d4',       // Cyan
  MOTOR: '#3b82f6',     // Blue
  ANALOG: '#10b981',    // Green
  UART: '#a855f7',      // Purple
  DEFAULT: '#94a3b8'    // Slate
};

export const VALIDATION_SEVERITY = {
  ERROR: 'error',       // Blocks simulation
  WARNING: 'warning',   // Warning, can proceed with caution
  INFO: 'info',         // Informational note
  SUCCESS: 'success'    // Connection verified healthy
};

