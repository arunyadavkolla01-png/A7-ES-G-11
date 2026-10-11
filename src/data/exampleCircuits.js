/**
 * Reference Verified Example Circuits
 * AI Recommends Energy-Efficient PWM Duty Cycle — STM32H7 + DC Motor
 */

export const EXAMPLE_STM32_MOTOR_CIRCUIT = {
  name: 'STM32H7 + MOSFET Driver + DC Motor + ACS712 Sensor',
  description: 'Complete verified industrial embedded configuration with PWM drive, optoisolated driver, common ground reference, and analog current telemetry.',
  components: [
    {
      id: 'mcu_1',
      type: 'stm32h7_board',
      name: 'STM32H743ZI Board',
      x: 60,
      y: 80,
      rotation: 0,
      width: 220,
      height: 160,
      properties: {
        coreClockMhz: 480,
        pwmFrequencyHz: 20000,
        logicVoltage: 3.3
      }
    },
    {
      id: 'driver_1',
      type: 'mosfet_driver_module',
      name: 'MOSFET Driver Module',
      x: 360,
      y: 80,
      rotation: 0,
      width: 190,
      height: 150,
      properties: {
        maxCurrent: 15.0,
        onResistance: 0.015
      }
    },
    {
      id: 'motor_1',
      type: 'dc_motor',
      name: 'Brushed DC Motor',
      x: 660,
      y: 80,
      rotation: 0,
      width: 180,
      height: 140,
      properties: {
        ratedVoltage: 12.0,
        resistance: 2.2,
        inductance: 0.0018,
        ke: 0.048,
        kt: 0.048,
        rotorInertia: 0.0006,
        viscousFriction: 0.0005,
        loadTorque: 0.04
      }
    },
    {
      id: 'psu_1',
      type: 'dc_power_supply',
      name: 'DC Power Supply',
      x: 360,
      y: 320,
      rotation: 0,
      width: 180,
      height: 120,
      properties: {
        voltage: 12.0,
        currentLimit: 5.0
      }
    },
    {
      id: 'sensor_1',
      type: 'current_sensor',
      name: 'Current Sensor (ACS712)',
      x: 660,
      y: 300,
      rotation: 0,
      width: 170,
      height: 130,
      properties: {
        model: 'ACS712-05B',
        sensitivityVoltsPerAmp: 0.185
      }
    },
    {
      id: 'gnd_node_1',
      type: 'ground_terminal',
      name: 'Common Ground Bus',
      x: 100,
      y: 340,
      rotation: 0,
      width: 110,
      height: 80,
      properties: {}
    }
  ],
  wires: [
    // 1. PWM Control Wire: STM32 PA8 -> Driver PWM_IN
    {
      id: 'w_pwm',
      from: { componentId: 'mcu_1', pinId: 'PA8' },
      to: { componentId: 'driver_1', pinId: 'PWM_IN' },
      color: '#06b6d4',
      signalType: 'pwm',
      label: 'TIM1_CH1 PWM (3.3V Logic)'
    },
    // 2. Logic Ground: STM32 GND -> Common Ground Bus Port 1
    {
      id: 'w_mcu_gnd',
      from: { componentId: 'mcu_1', pinId: 'GND_1' },
      to: { componentId: 'gnd_node_1', pinId: 'GND_PIN_1' },
      color: '#4b5563',
      signalType: 'ground',
      label: 'MCU System GND'
    },
    // 3. Driver Logic Ground: Driver LOGIC_GND -> Common Ground Bus Port 2
    {
      id: 'w_drv_logic_gnd',
      from: { componentId: 'driver_1', pinId: 'LOGIC_GND' },
      to: { componentId: 'gnd_node_1', pinId: 'GND_PIN_2' },
      color: '#4b5563',
      signalType: 'ground',
      label: 'Common GND Reference'
    },
    // 4. Power Supply V+ -> Driver Motor Supply V+
    {
      id: 'w_pwr_vm',
      from: { componentId: 'psu_1', pinId: 'V_PLUS' },
      to: { componentId: 'driver_1', pinId: 'POWER_VM' },
      color: '#ef4444',
      signalType: 'power',
      label: '12V Motor High-Side Rail'
    },
    // 5. Power Supply GND -> Driver Power GND
    {
      id: 'w_pwr_gnd',
      from: { componentId: 'psu_1', pinId: 'V_MINUS' },
      to: { componentId: 'driver_1', pinId: 'POWER_GND' },
      color: '#4b5563',
      signalType: 'ground',
      label: 'Power Return PGND'
    },
    // 6. Driver OUT+ -> Motor Positive
    {
      id: 'w_mot_pos',
      from: { componentId: 'driver_1', pinId: 'OUT_PLUS' },
      to: { componentId: 'motor_1', pinId: 'MOTOR_PLUS' },
      color: '#3b82f6',
      signalType: 'motor',
      label: 'Motor Armature +'
    },
    // 7. Driver OUT- -> Current Sensor IP+
    {
      id: 'w_mot_sense_in',
      from: { componentId: 'driver_1', pinId: 'OUT_MINUS' },
      to: { componentId: 'sensor_1', pinId: 'IP_PLUS' },
      color: '#3b82f6',
      signalType: 'motor',
      label: 'Motor Low-Side -> Shunt'
    },
    // 8. Current Sensor IP- -> Motor Negative (completing series circuit)
    {
      id: 'w_mot_neg',
      from: { componentId: 'sensor_1', pinId: 'IP_MINUS' },
      to: { componentId: 'motor_1', pinId: 'MOTOR_MINUS' },
      color: '#3b82f6',
      signalType: 'motor',
      label: 'Shunt Return -> Motor -'
    },
    // 9. Current Sensor Analog Output -> STM32 PA0 (ADC1_IN16)
    {
      id: 'w_adc_sense',
      from: { componentId: 'sensor_1', pinId: 'VOUT' },
      to: { componentId: 'mcu_1', pinId: 'PA0' },
      color: '#10b981',
      signalType: 'analog',
      label: 'ADC Current Feedback'
    },
    // 10. Sensor Power Supply: STM32 3.3V -> Sensor VCC
    {
      id: 'w_sensor_vcc',
      from: { componentId: 'mcu_1', pinId: 'VDD_3V3' },
      to: { componentId: 'sensor_1', pinId: 'VCC_SENSE' },
      color: '#f59e0b',
      signalType: 'power',
      label: '3.3V Sensor Power'
    },
    // 11. Sensor Ground -> Driver Logic Ground
    {
      id: 'w_sensor_gnd',
      from: { componentId: 'sensor_1', pinId: 'GND_SENSE' },
      to: { componentId: 'driver_1', pinId: 'LOGIC_GND' },
      color: '#4b5563',
      signalType: 'ground',
      label: 'Sensor Ground'
    },
    {
      id: 'w_driver_logic_vcc',
      from: { componentId: 'mcu_1', pinId: 'VDD_3V3' },
      to: { componentId: 'driver_1', pinId: 'VCC_LOGIC' },
      color: '#f59e0b',
      signalType: 'power',
      label: '3.3V Driver Logic Supply'
    },
    {
      id: 'w_psu_common_gnd',
      from: { componentId: 'psu_1', pinId: 'V_MINUS' },
      to: { componentId: 'gnd_node_1', pinId: 'GND_PIN_1' },
      color: '#4b5563',
      signalType: 'ground',
      label: 'Supply Return / Common GND'
    }
  ]
};

export const EXAMPLE_CIRCUIT = EXAMPLE_STM32_MOTOR_CIRCUIT;
