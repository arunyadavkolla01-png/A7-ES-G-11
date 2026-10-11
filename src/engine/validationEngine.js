/**
 * Rule-Based Topology-Aware Circuit Validation Engine
 * AI Recommends Energy-Efficient PWM Duty Cycle — STM32H7 + DC Motor
 */

import { VALIDATION_SEVERITY } from '../types/circuit.js';
import { getComponentDef } from '../data/componentLibrary.js';
import { findComponentPin, getConnectionTypeError } from './connectionRules.js';

/**
 * Builds electrical nets (connected groups of pins) using graph search (Union-Find)
 */
export function buildElectricalNets(components, wires) {
  const pinToNetId = new Map();
  const netMembers = new Map();
  let nextNetId = 1;

  // Helper to format pin identifier
  const pinKey = (componentId, pinId) => `${componentId}::${pinId}`;

  // Initialize every pin in its own net
  components.forEach(comp => {
    const pins = comp.pins && comp.pins.length > 0 ? comp.pins : (getComponentDef(comp.type)?.pins || []);
    pins.forEach(pin => {
      const key = pinKey(comp.id, pin.id);
      const netId = nextNetId++;
      pinToNetId.set(key, netId);
      netMembers.set(netId, [key]);
    });

    // Internal bus connections for distribution components
    if (comp.type === 'ground_terminal') {
      const pinA = pinKey(comp.id, 'GND_PIN_1');
      const pinB = pinKey(comp.id, 'GND_PIN_2');
      const netA = pinToNetId.get(pinA);
      const netB = pinToNetId.get(pinB);
      if (netA && netB && netA !== netB) {
        netMembers.get(netA).push(pinB);
        netMembers.delete(netB);
        pinToNetId.set(pinB, netA);
      }
    } else if (comp.type === 'breadboard_rail') {
      const vcc1 = pinKey(comp.id, 'RAIL_VCC_1');
      const vcc2 = pinKey(comp.id, 'RAIL_VCC_2');
      const gnd1 = pinKey(comp.id, 'RAIL_GND_1');
      const gnd2 = pinKey(comp.id, 'RAIL_GND_2');
      
      const netV1 = pinToNetId.get(vcc1);
      const netV2 = pinToNetId.get(vcc2);
      if (netV1 && netV2 && netV1 !== netV2) {
        netMembers.get(netV1).push(vcc2);
        netMembers.delete(netV2);
        pinToNetId.set(vcc2, netV1);
      }

      const netG1 = pinToNetId.get(gnd1);
      const netG2 = pinToNetId.get(gnd2);
      if (netG1 && netG2 && netG1 !== netG2) {
        netMembers.get(netG1).push(gnd2);
        netMembers.delete(netG2);
        pinToNetId.set(gnd2, netG1);
      }
    }
  });

  // Union connected pins for each wire
  wires.forEach(wire => {
    if (!wire.from || !wire.to) return;
    const keyA = pinKey(wire.from.componentId, wire.from.pinId);
    const keyB = pinKey(wire.to.componentId, wire.to.pinId);

    const netA = pinToNetId.get(keyA);
    const netB = pinToNetId.get(keyB);

    if (netA !== undefined && netB !== undefined && netA !== netB) {
      // Merge netB into netA
      const membersB = netMembers.get(netB) || [];
      const membersA = netMembers.get(netA) || [];
      const merged = [...membersA, ...membersB];
      netMembers.set(netA, merged);
      netMembers.delete(netB);

      membersB.forEach(k => {
        pinToNetId.set(k, netA);
      });
    }
  });

  return { pinToNetId, netMembers, pinKey };
}

/**
 * Checks if two pins are in the same electrical net
 */
export function arePinsConnected(pinToNetId, compIdA, pinIdA, compIdB, pinIdB) {
  const keyA = `${compIdA}::${pinIdA}`;
  const keyB = `${compIdB}::${pinIdB}`;
  const netA = pinToNetId.get(keyA);
  const netB = pinToNetId.get(keyB);
  return netA !== undefined && netB !== undefined && netA === netB;
}

/**
 * Validates the entire circuit against embedded electronics topology rules
 */
export function validateCircuit(components = [], wires = []) {
  const results = [];
  const { pinToNetId, netMembers } = buildElectricalNets(components, wires);

  // Helper to log issues
  const addResult = (severity, code, title, details, fixSuggestion, involvedComponents = []) => {
    results.push({
      severity,
      code,
      title,
      details,
      fixSuggestion,
      involvedComponents,
      timestamp: Date.now()
    });
  };

  const componentById = new Map(components.map(component => [component.id, component]));
  const propertiesFor = component => ({
    ...(getComponentDef(component?.type)?.defaultProps || {}),
    ...(component?.properties || {})
  });

  // Reject malformed, duplicated, and incompatible pin connections before
  // evaluating higher-level circuit topology.
  const seenWires = new Set();
  wires.forEach(wire => {
    const keyA = `${wire.from?.componentId}::${wire.from?.pinId}`;
    const keyB = `${wire.to?.componentId}::${wire.to?.pinId}`;
    const pairKey = [keyA, keyB].sort().join('|');
    const sourceComp = componentById.get(wire.from?.componentId);
    const destinationComp = componentById.get(wire.to?.componentId);
    const sourcePin = findComponentPin(sourceComp, wire.from?.pinId);
    const destinationPin = findComponentPin(destinationComp, wire.to?.pinId);

    if (!sourceComp || !destinationComp || !sourcePin || !destinationPin) {
      addResult(
        VALIDATION_SEVERITY.ERROR,
        'ERR_WIRE_ENDPOINT_INVALID',
        'Wire Endpoint Is Missing',
        `Wire ${wire.id || ''} refers to a component or pin that is no longer in the workspace.`,
        'Delete the broken wire and reconnect existing component pins.',
        [wire.from?.componentId, wire.to?.componentId].filter(Boolean)
      );
      return;
    }

    if (seenWires.has(pairKey)) {
      addResult(
        VALIDATION_SEVERITY.WARNING,
        'WARN_DUPLICATE_WIRE',
        'Duplicate Wire',
        `The connection between ${sourceComp.name}.${sourcePin.name} and ${destinationComp.name}.${destinationPin.name} appears more than once.`,
        'Remove the duplicate wire to keep the circuit diagram clear.',
        [sourceComp.id, destinationComp.id]
      );
      return;
    }
    seenWires.add(pairKey);

    const mismatch = getConnectionTypeError(sourcePin, destinationPin);
    if (mismatch) {
      addResult(
        VALIDATION_SEVERITY.ERROR,
        'ERR_PIN_TYPE_MISMATCH',
        'Incompatible Pin Connection',
        mismatch,
        'Reconnect the pins according to their signal roles (PWM to driver input, power to power, ground to ground, and so on).',
        [sourceComp.id, destinationComp.id]
      );
    }
  });

  // Validate numeric settings independently of topology so malformed part
  // values cannot silently fall back to simulator defaults.
  components.forEach(component => {
    const properties = propertiesFor(component);
    const requiredPositive = component.type === 'dc_motor'
      ? ['ratedVoltage', 'resistance', 'inductance', 'ke', 'kt', 'rotorInertia']
      : component.type === 'dc_power_supply'
        ? ['voltage', 'currentLimit']
        : component.type === 'mosfet_driver_module'
          ? ['maxCurrent', 'logicThreshold']
          : component.type === 'discrete_mosfet'
            ? ['vdsMax', 'rdsOn', 'vgsThreshold']
            : [];

    requiredPositive.forEach(property => {
      const value = Number(properties[property]);
      if (!Number.isFinite(value) || value <= 0) {
        addResult(
          VALIDATION_SEVERITY.ERROR,
          'ERR_COMPONENT_PROPERTY_INVALID',
          'Invalid Component Property',
          `${component.name} requires a positive numeric ${property} value.`,
          `Set ${property} to a value greater than zero in the properties panel.`,
          [component.id]
        );
      }
    });

    if (component.type === 'dc_motor' && Number(properties.loadTorque) < 0) {
      addResult(VALIDATION_SEVERITY.ERROR, 'ERR_COMPONENT_PROPERTY_INVALID', 'Invalid Motor Load',
        `${component.name} load torque cannot be negative.`,
        'Set load torque to zero or a positive value.', [component.id]);
    }
    if ((component.type === 'stm32h7_board' || component.type === 'generic_stm32_mcu') &&
      (!Number.isFinite(Number(properties.logicVoltage)) || Number(properties.logicVoltage) <= 0)) {
      addResult(VALIDATION_SEVERITY.ERROR, 'ERR_COMPONENT_PROPERTY_INVALID', 'Invalid MCU Logic Voltage',
        `${component.name} must have a positive logic voltage.`,
        'Set the MCU logic voltage to its supported value, normally 3.3 V.', [component.id]);
    }
  });

  netMembers.forEach(members => {
    const connectedPowerPins = members.map(key => {
      const [componentId, pinId] = key.split('::');
      const component = componentById.get(componentId);
      const pin = findComponentPin(component, pinId);
      const isSource = pin?.type === 'power' && (
        (component?.type === 'dc_power_supply' && pinId === 'V_PLUS') ||
        (component?.type === 'stm32h7_board' && ['VDD_3V3', 'VCC_5V'].includes(pinId)) ||
        (component?.type === 'generic_stm32_mcu' && pinId === 'VDD')
      );
      if (!isSource) return null;
      const configuredVoltage = component?.type === 'dc_power_supply' && pinId === 'V_PLUS'
        ? propertiesFor(component).voltage
        : pin.voltage;
      return { component, pin, voltage: Number(configuredVoltage) };
    }).filter(item => item && Number.isFinite(item.voltage));

    const distinctVoltages = [...new Set(connectedPowerPins.map(item => Math.round(item.voltage * 100) / 100))];
    if (distinctVoltages.length > 1) {
      const details = connectedPowerPins.map(item => `${item.component.name}.${item.pin.name} (${item.voltage} V)`).join(', ');
      addResult(
        VALIDATION_SEVERITY.ERROR,
        'ERR_POWER_VOLTAGE_CONFLICT',
        'Power Rails With Different Voltages Are Connected',
        `This net joins pins with different voltage levels: ${details}.`,
        'Separate the rails or configure the supply to match the intended logic or motor rail.',
        [...new Set(connectedPowerPins.map(item => item.component.id))]
      );
    }
  });

  // Find components by type/category
  const mcu = components.find(c => c.type === 'stm32h7_board' || c.type === 'generic_stm32_mcu');
  const motor = components.find(c => c.type === 'dc_motor');
  const driver = components.find(c => c.type === 'mosfet_driver_module' || c.type === 'discrete_mosfet');
  const psu = components.find(c => c.type === 'dc_power_supply');
  const diode = components.find(c => c.type === 'flyback_diode');
  const currentSensor = components.find(c => c.type === 'current_sensor');

  // --- RULE 0: Short Circuit Detection ---
  if (psu) {
    const isPsuShort = arePinsConnected(pinToNetId, psu.id, 'V_PLUS', psu.id, 'V_MINUS');
    if (isPsuShort) {
      addResult(
        VALIDATION_SEVERITY.ERROR,
        'ERR_PSU_SHORT',
        'DC Power Supply Short Circuit',
        'Direct connection between Power Supply V+ and Ground detected. This causes infinite fault current and power supply shutdown.',
        'Remove the short-circuit wire between V+ and Ground on the DC Power Supply.',
        [psu.id]
      );
    }
  }

  if (mcu) {
    const vddPin = mcu.type === 'stm32h7_board' ? 'VDD_3V3' : 'VDD';
    const gndPin = mcu.type === 'stm32h7_board' ? 'GND_1' : 'GND';
    if (arePinsConnected(pinToNetId, mcu.id, vddPin, mcu.id, gndPin)) {
      addResult(
        VALIDATION_SEVERITY.ERROR,
        'ERR_MCU_POWER_SHORT',
        'Microcontroller 3.3V Power Rail Short Circuit',
        'Microcontroller 3.3V VDD is shorted directly to GND. The core will brown out and reset.',
        'Remove the wire shorting 3.3V to GND on the STM32 board.',
        [mcu.id]
      );
    }
  }

  // --- RULE 1: Direct Motor Drive Overload Check (CRITICAL) ---
  if (mcu && motor) {
    const mcuPins = mcu.type === 'stm32h7_board' 
      ? ['PA8', 'PA0', 'PB0', 'UART_TX', 'UART_RX'] 
      : ['PWM_OUT', 'ADC_IN', 'GPIO_PIN'];
    
    let directConnectionFound = false;
    let offendingMcuPin = null;
    let offendingMotorPin = null;

    mcuPins.forEach(mcuPin => {
      ['MOTOR_PLUS', 'MOTOR_MINUS'].forEach(motPin => {
        // Direct wire check
        const directWire = wires.find(w => 
          (w.from && w.to) && (
            (w.from.componentId === mcu.id && w.from.pinId === mcuPin && w.to.componentId === motor.id && w.to.pinId === motPin) ||
            (w.to.componentId === mcu.id && w.to.pinId === mcuPin && w.from.componentId === motor.id && w.from.pinId === motPin)
          )
        );

        if (directWire) {
          directConnectionFound = true;
          offendingMcuPin = mcuPin;
          offendingMotorPin = motPin;
        }
      });
    });

    if (directConnectionFound) {
      addResult(
        VALIDATION_SEVERITY.ERROR,
        'ERR_UNSAFE_DIRECT_DRIVE',
        'CRITICAL: Direct MCU Pin Overload Detected',
        `Motor terminal (${offendingMotorPin}) is connected directly to STM32 I/O pin (${offendingMcuPin}). STM32 GPIO pins have an absolute maximum rating of 20 mA. Inductive DC motors draw 500mA–5.5A! Direct drive will permanently destroy the microcontroller silicon.`,
        'Disconnect the motor from the STM32 pin. Place a MOSFET Driver Module or N-Channel MOSFET in between to switch the motor current safely.',
        [mcu.id, motor.id]
      );
    }
  }

  // --- RULE 2: Essential Component Checks ---
  if (!mcu) {
    addResult(
      VALIDATION_SEVERITY.ERROR,
      'ERR_NO_MCU',
      'Microcontroller Missing',
      'No STM32H7 microcontroller board found in the workspace.',
      'Drag and place the "STM32H743ZI Board" from the Microcontrollers category in the component library.',
      []
    );
  }

  if (!motor) {
    addResult(
      VALIDATION_SEVERITY.ERROR,
      'ERR_NO_MOTOR',
      'DC Motor Missing',
      'No DC motor actuator found in the workspace.',
      'Drag and place a "Brushed DC Motor" from the Motors & Actuators category.',
      []
    );
  }

  if (!driver) {
    addResult(
      VALIDATION_SEVERITY.ERROR,
      'ERR_NO_DRIVER',
      'Motor Driver Missing',
      'A power switching interface is required to control the DC motor from 3.3V logic.',
      'Drag and place a "MOSFET Driver Module" or "N-Channel MOSFET" from the Motor Drivers category.',
      []
    );
  }

  // --- If core components are missing, exit early with foundational errors ---
  if (!mcu || !motor || !driver) {
    return {
      isValid: false,
      hasBlockingErrors: true,
      results
    };
  }

  // --- RULE 3: PWM Output Connection ---
  const mcuPwmPin = mcu.type === 'stm32h7_board' ? 'PA8' : 'PWM_OUT';
  const driverPwmPin = driver.type === 'mosfet_driver_module' ? 'PWM_IN' : 'GATE';

  const pwmConnected = arePinsConnected(pinToNetId, mcu.id, mcuPwmPin, driver.id, driverPwmPin);
  if (!pwmConnected) {
    addResult(
      VALIDATION_SEVERITY.ERROR,
      'ERR_PWM_NOT_CONNECTED',
      'PWM Signal Not Connected to Driver',
      `STM32 PWM pin (${mcuPwmPin}) is not connected to Driver input (${driverPwmPin}). The motor will not receive timing signals.`,
      `Draw a wire from STM32 ${mcuPwmPin} to Driver ${driverPwmPin}.`,
      [mcu.id, driver.id]
    );
  } else {
    addResult(
      VALIDATION_SEVERITY.SUCCESS,
      'OK_PWM_CONNECTED',
      'PWM Control Signal Verified',
      `STM32 TIM1_CH1 PWM output on ${mcuPwmPin} is connected to ${driver.name} logic input (${driverPwmPin}).`,
      null,
      [mcu.id, driver.id]
    );
  }

  if (driver.type === 'mosfet_driver_module') {
    const logicSupplyConnected = arePinsConnected(
      pinToNetId,
      mcu.id,
      mcu.type === 'stm32h7_board' ? 'VDD_3V3' : 'VDD',
      driver.id,
      'VCC_LOGIC'
    );
    const logicVoltage = Number(propertiesFor(mcu).logicVoltage);
    const logicThreshold = Number(propertiesFor(driver).logicThreshold);
    const logicMaxVoltage = Number(propertiesFor(driver).logicMaxVoltage ?? 5.5);

    if (!logicSupplyConnected) {
      addResult(VALIDATION_SEVERITY.ERROR, 'ERR_DRIVER_LOGIC_POWER', 'Driver Logic Supply Missing',
        `${driver.name} logic supply pin VCC_LOGIC is not connected to the MCU 3.3 V rail.`,
        'Connect the MCU 3.3 V output to driver VCC_LOGIC.', [mcu.id, driver.id]);
    }
    if (logicVoltage < logicThreshold || logicVoltage > logicMaxVoltage) {
      addResult(VALIDATION_SEVERITY.ERROR, 'ERR_LOGIC_LEVEL_INCOMPATIBLE', 'PWM Logic Level Is Incompatible',
        `${mcu.name} logic level (${logicVoltage} V) is outside ${driver.name} input range (${logicThreshold}–${logicMaxVoltage} V).`,
        'Select a compatible driver or adjust the logic-level interface.', [mcu.id, driver.id]);
    } else {
      addResult(VALIDATION_SEVERITY.SUCCESS, 'OK_LOGIC_LEVEL_COMPATIBLE', 'PWM Logic Level Compatible',
        `${mcu.name} ${logicVoltage} V PWM signal meets the ${driver.name} input requirement.`,
        null, [mcu.id, driver.id]);
    }
  } else if (driver.type === 'discrete_mosfet') {
    const logicVoltage = Number(propertiesFor(mcu).logicVoltage);
    const gateThreshold = Number(propertiesFor(driver).vgsThreshold);
    if (logicVoltage < gateThreshold || logicVoltage > 5.5) {
      addResult(VALIDATION_SEVERITY.ERROR, 'ERR_LOGIC_LEVEL_INCOMPATIBLE', 'MOSFET Gate Logic Level Is Incompatible',
        `${mcu.name} output (${logicVoltage} V) does not meet the MOSFET gate requirement (${gateThreshold}–5.5 V).`,
        'Select a MOSFET specified for the MCU logic voltage or add a suitable gate driver.', [mcu.id, driver.id]);
    } else {
      addResult(VALIDATION_SEVERITY.SUCCESS, 'OK_LOGIC_LEVEL_COMPATIBLE', 'MOSFET Gate Logic Level Compatible',
        `${mcu.name} ${logicVoltage} V output can drive the configured logic-level gate.`, null, [mcu.id, driver.id]);
    }
  }

  // --- RULE 4: Common Ground Reference ---
  const mcuGndPin = mcu.type === 'stm32h7_board' ? 'GND_1' : 'GND';
  const driverGndPin = driver.type === 'mosfet_driver_module' ? 'LOGIC_GND' : 'SOURCE';

  const commonGndConnected = arePinsConnected(pinToNetId, mcu.id, mcuGndPin, driver.id, driverGndPin);
  if (!commonGndConnected) {
    addResult(
      VALIDATION_SEVERITY.ERROR,
      'ERR_FLOATING_GROUND',
      'Floating Ground Reference (Missing Common GND)',
      'The STM32 microcontroller and motor driver do not share a common ground reference. Without a common return path, the PWM voltage is undefined at the driver gate.',
      `Connect STM32 ${mcuGndPin} to Driver ${driverGndPin} or wire both to the Common Ground Bus.`,
      [mcu.id, driver.id]
    );
  } else {
    addResult(
      VALIDATION_SEVERITY.SUCCESS,
      'OK_COMMON_GROUND',
      'Common Ground Topology Verified',
      'STM32 system ground and driver reference ground are tied to the same potential.',
      null,
      [mcu.id, driver.id]
    );
  }

  // --- RULE 5: Motor Driver Power Supply ---
  if (!psu) {
    addResult(
      VALIDATION_SEVERITY.ERROR,
      'ERR_NO_POWER_SUPPLY',
      'Motor Power Supply Missing',
      'No external DC power supply found. Motors cannot run on microcontroller regulator power alone.',
      'Add a "DC Power Supply" (12V) and wire its positive terminal to the motor driver high-side input.',
      []
    );
  } else {
    const psuVplus = psu.type === 'dc_power_supply' ? 'V_PLUS' : 'RAIL_VCC_1';
    const psuVminus = psu.type === 'dc_power_supply' ? 'V_MINUS' : 'RAIL_GND_1';

    if (driver.type === 'mosfet_driver_module') {
      const psuToDriverVm = arePinsConnected(pinToNetId, psu.id, psuVplus, driver.id, 'POWER_VM');
      const psuToDriverGnd = arePinsConnected(pinToNetId, psu.id, psuVminus, driver.id, 'POWER_GND');

      if (!psuToDriverVm) {
        addResult(
          VALIDATION_SEVERITY.ERROR,
          'ERR_DRIVER_VM_DISCONNECTED',
          'Motor Power Supply V+ Disconnected',
          'The MOSFET driver power rail (POWER_VM) has no DC power feed.',
          `Connect DC Power Supply positive (${psuVplus}) to Driver POWER_VM.`,
          [psu.id, driver.id]
        );
      }

      if (!psuToDriverGnd) {
        addResult(
          VALIDATION_SEVERITY.ERROR,
          'ERR_DRIVER_PGND_DISCONNECTED',
          'Motor Power Ground (PGND) Disconnected',
          'The high-current return path for the motor power supply is not connected.',
          `Connect DC Power Supply ground (${psuVminus}) to Driver POWER_GND.`,
          [psu.id, driver.id]
        );
      }

      if (psuToDriverVm && psuToDriverGnd) {
        addResult(
          VALIDATION_SEVERITY.SUCCESS,
          'OK_MOTOR_POWER',
          'Motor Power Supply Rail Connected',
          `Driver is supplied by 12V DC power from ${psu.name}.`,
          null,
          [psu.id, driver.id]
        );
      }
    }

    const mcuPowerReturnConnected = arePinsConnected(
      pinToNetId,
      mcu.id,
      mcu.type === 'stm32h7_board' ? 'GND_1' : 'GND',
      psu.id,
      psuVminus
    );
    if (!mcuPowerReturnConnected) {
      addResult(VALIDATION_SEVERITY.ERROR, 'ERR_SUPPLY_COMMON_GROUND', 'Power Supply Return Is Not Common',
        'The motor power supply return is not connected to the controller ground reference.',
        `Connect ${psu.name}.${psuVminus} to the common ground net used by the STM32.`, [mcu.id, psu.id]);
    }
  }

  // --- RULE 6: Motor Output Connections ---
  if (driver.type === 'mosfet_driver_module') {
    // Check if motor plus is connected to driver OUT+ (directly or through sensor)
    const motorPlusConnected = arePinsConnected(pinToNetId, driver.id, 'OUT_PLUS', motor.id, 'MOTOR_PLUS') ||
      (currentSensor && arePinsConnected(pinToNetId, driver.id, 'OUT_PLUS', currentSensor.id, 'IP_PLUS') &&
       arePinsConnected(pinToNetId, currentSensor.id, 'IP_MINUS', motor.id, 'MOTOR_PLUS'));

    // Check if motor minus is connected to driver OUT- (directly or through sensor)
    const motorMinusConnected = arePinsConnected(pinToNetId, driver.id, 'OUT_MINUS', motor.id, 'MOTOR_MINUS') ||
      (currentSensor && arePinsConnected(pinToNetId, driver.id, 'OUT_MINUS', currentSensor.id, 'IP_PLUS') &&
       arePinsConnected(pinToNetId, currentSensor.id, 'IP_MINUS', motor.id, 'MOTOR_MINUS'));

    if (!motorPlusConnected || !motorMinusConnected) {
      addResult(
        VALIDATION_SEVERITY.ERROR,
        'ERR_MOTOR_TERMINALS_DISCONNECTED',
        'Motor Armature Not Connected to Driver Output',
        'The DC Motor terminals are not completing a circuit with the driver output (OUT+ and OUT-).',
        'Wire Driver OUT+ to Motor M+ and Driver OUT- to Motor M- (or route through Current Sensor in series).',
        [driver.id, motor.id]
      );
    } else {
      addResult(
        VALIDATION_SEVERITY.SUCCESS,
        'OK_MOTOR_CONNECTED',
        'Motor Drive Loop Complete',
        'Motor armature is properly connected to driver output power stage.',
        null,
        [driver.id, motor.id]
      );
    }
  } else if (driver.type === 'discrete_mosfet') {
    // Discrete MOSFET low-side drive
    const psuVplus = psu ? (psu.type === 'dc_power_supply' ? 'V_PLUS' : 'RAIL_VCC_1') : null;
    const motorToPsu = psuVplus && (
      arePinsConnected(pinToNetId, motor.id, 'MOTOR_PLUS', psu.id, psuVplus) ||
      (currentSensor && arePinsConnected(pinToNetId, psu.id, psuVplus, currentSensor.id, 'IP_PLUS') &&
       arePinsConnected(pinToNetId, currentSensor.id, 'IP_MINUS', motor.id, 'MOTOR_PLUS'))
    );
    const motorToDrain = arePinsConnected(pinToNetId, motor.id, 'MOTOR_MINUS', driver.id, 'DRAIN') ||
      (currentSensor && arePinsConnected(pinToNetId, driver.id, 'DRAIN', currentSensor.id, 'IP_PLUS') &&
       arePinsConnected(pinToNetId, currentSensor.id, 'IP_MINUS', motor.id, 'MOTOR_MINUS'));

    if (!motorToPsu || !motorToDrain) {
      addResult(
        VALIDATION_SEVERITY.ERROR,
        'ERR_LOW_SIDE_MOSFET_WIRING',
        'Incomplete Low-Side MOSFET Switching Topology',
        'In low-side switching, Motor M+ must connect to Power Supply V+, and Motor M- must connect to MOSFET Drain (with Source tied to GND).',
        'Wire Power Supply V+ to Motor M+, and Motor M- to MOSFET Drain.',
        [motor.id, driver.id]
      );
    }

    // --- RULE 7: Flyback Diode for Discrete Inductive Load ---
    if (!diode) {
      addResult(
        VALIDATION_SEVERITY.ERROR,
        'ERR_MISSING_FLYBACK_DIODE',
        'Flyback Diode Missing on Inductive Motor Load',
        'A DC motor is an inductive load. When the MOSFET switches off, the collapsing magnetic field creates a high-voltage back-EMF spike (V = L * di/dt) that will exceed the MOSFET breakdown voltage and destroy it.',
        'Add a Flyback Diode (1N5819) antiparallel across the motor: Cathode to Motor M+ / V+, Anode to Motor M- / Drain.',
        [motor.id, driver.id]
      );
    } else {
      // Check diode orientation
      const cathodeToPlus = psuVplus ? arePinsConnected(pinToNetId, diode.id, 'CATHODE', motor.id, 'MOTOR_PLUS') : false;
      const anodeToDrain = arePinsConnected(pinToNetId, diode.id, 'ANODE', motor.id, 'MOTOR_MINUS');

      if (cathodeToPlus && anodeToDrain) {
        addResult(
          VALIDATION_SEVERITY.SUCCESS,
          'OK_FLYBACK_DIODE',
          'Flyback Diode Correctly Oriented',
          'Diode is antiparallel across the motor coil, ready to recirculate inductive discharge safely.',
          null,
          [diode.id, motor.id]
        );
      } else {
        // Check for backwards diode
        const backwardsCathode = arePinsConnected(pinToNetId, diode.id, 'CATHODE', motor.id, 'MOTOR_MINUS');
        const backwardsAnode = psuVplus ? arePinsConnected(pinToNetId, diode.id, 'ANODE', motor.id, 'MOTOR_PLUS') : false;

        if (backwardsCathode && backwardsAnode) {
          addResult(
            VALIDATION_SEVERITY.ERROR,
            'ERR_REVERSED_DIODE',
            'CRITICAL: Flyback Diode Reversed (Forward Biased Short)',
            'The diode is connected backwards! It will conduct directly from V+ to GND during normal operation, causing an immediate short circuit.',
            'Reverse the diode: connect Cathode (stripe) to Motor M+ / V+ and Anode to Motor M- / Drain.',
            [diode.id]
          );
        } else {
          addResult(
            VALIDATION_SEVERITY.WARNING,
            'WARN_DIODE_NOT_ACROSS_MOTOR',
            'Flyback Diode Incomplete Wiring',
            'The flyback diode is present but not connected across both motor terminals.',
            'Connect Diode Cathode to Motor M+ and Diode Anode to Motor M-.',
            [diode.id, motor.id]
          );
        }
      }
    }
  }

  if (driver.type === 'mosfet_driver_module') {
    if (propertiesFor(driver).hasIntegratedDiode) {
      addResult(VALIDATION_SEVERITY.SUCCESS, 'OK_FLYBACK_INTEGRATED', 'Integrated Motor Transient Protection Present',
        `${driver.name} is configured with integrated inductive-load protection.`,
        null, [driver.id]);
    } else if (!diode) {
      addResult(VALIDATION_SEVERITY.ERROR, 'ERR_MISSING_FLYBACK_DIODE', 'Flyback Protection Missing',
        `${driver.name} has no integrated flyback protection and no external diode is present.`,
        'Enable the driver protection property or add a correctly oriented flyback diode across the motor.',
        [driver.id, motor.id]);
    } else {
      const cathodeToPlus = arePinsConnected(pinToNetId, diode.id, 'CATHODE', motor.id, 'MOTOR_PLUS');
      const anodeToMinus = arePinsConnected(pinToNetId, diode.id, 'ANODE', motor.id, 'MOTOR_MINUS');
      if (cathodeToPlus && anodeToMinus) {
        addResult(VALIDATION_SEVERITY.SUCCESS, 'OK_FLYBACK_DIODE', 'Flyback Diode Correctly Oriented',
          `${diode.name} is connected antiparallel across the motor.`, null, [diode.id, motor.id]);
      } else {
        addResult(VALIDATION_SEVERITY.ERROR, 'ERR_FLYBACK_DIODE_WIRING', 'Flyback Diode Wiring Is Incomplete',
          `${diode.name} must connect its cathode to motor positive and its anode to motor negative.`,
          'Connect diode CATHODE to M+ and diode ANODE to M-.', [diode.id, motor.id]);
      }
    }
  }

  // --- RULE 8: Current Sensor Validation (Optional / Informational) ---
  if (currentSensor) {
    const voutConnected = arePinsConnected(pinToNetId, currentSensor.id, 'VOUT', mcu.id, mcu.type === 'stm32h7_board' ? 'PA0' : 'ADC_IN');
    const vccConnected = arePinsConnected(pinToNetId, currentSensor.id, 'VCC_SENSE', mcu.id, mcu.type === 'stm32h7_board' ? 'VDD_3V3' : 'VDD');
    const sensorGroundPin = mcu.type === 'stm32h7_board' ? 'GND_1' : 'GND';
    const sensorGroundConnected = arePinsConnected(pinToNetId, currentSensor.id, 'GND_SENSE', mcu.id, sensorGroundPin);
    const seriesOnReturn = driver.type === 'mosfet_driver_module'
      ? arePinsConnected(pinToNetId, driver.id, 'OUT_MINUS', currentSensor.id, 'IP_PLUS') &&
        arePinsConnected(pinToNetId, currentSensor.id, 'IP_MINUS', motor.id, 'MOTOR_MINUS')
      : arePinsConnected(pinToNetId, driver.id, 'DRAIN', currentSensor.id, 'IP_PLUS') &&
        arePinsConnected(pinToNetId, currentSensor.id, 'IP_MINUS', motor.id, 'MOTOR_MINUS');
    const seriesOnSupply = driver.type === 'mosfet_driver_module'
      ? arePinsConnected(pinToNetId, driver.id, 'OUT_PLUS', currentSensor.id, 'IP_PLUS') &&
        arePinsConnected(pinToNetId, currentSensor.id, 'IP_MINUS', motor.id, 'MOTOR_PLUS')
      : arePinsConnected(pinToNetId, psu?.id, 'V_PLUS', currentSensor.id, 'IP_PLUS') &&
        arePinsConnected(pinToNetId, currentSensor.id, 'IP_MINUS', motor.id, 'MOTOR_PLUS');

    if (voutConnected && vccConnected && sensorGroundConnected && (seriesOnReturn || seriesOnSupply)) {
      addResult(
        VALIDATION_SEVERITY.SUCCESS,
        'OK_CURRENT_TELEMETRY',
        'Current Telemetry Loop Validated',
        'ACS712 current sensor is powered and streaming analog voltage to STM32 ADC1 (PA0).',
        null,
        [currentSensor.id, mcu.id]
      );
    } else {
      addResult(
        VALIDATION_SEVERITY.ERROR,
        'ERR_CURRENT_SENSOR_INCOMPLETE',
        'Current Sensor Telemetry Not Fully Wired',
        'Current sensor is placed but its series path, analog output, supply, or ground is incomplete.',
        'Insert IP+ and IP- in series with one motor lead, connect VOUT to MCU ADC, VCC to 3.3 V, and GND to common ground.',
        [currentSensor.id]
      );
    }
  }

  // --- RULE 9: Voltage Rating Compatibility ---
  if (psu && motor) {
    const psuV = Number(propertiesFor(psu).voltage ?? 12.0);
    const motorV = Number(propertiesFor(motor).ratedVoltage ?? 12.0);

    if (psuV > motorV) {
      addResult(
        VALIDATION_SEVERITY.ERROR,
        'ERR_MOTOR_OVERVOLTAGE',
        'Power Supply Voltage Exceeds Motor Rating',
        `Power Supply output (${psuV} V) is higher than ${motor.name}'s configured rating (${motorV} V).`,
        `Lower the DC supply voltage to ${motorV} V or less, or select a motor rated for this supply.`,
        [psu.id, motor.id]
      );
    } else {
      addResult(VALIDATION_SEVERITY.SUCCESS, 'OK_MOTOR_VOLTAGE_RATING', 'Motor Voltage Rating Respected',
        `The ${psuV} V supply does not exceed ${motor.name}'s ${motorV} V rating.`, null, [psu.id, motor.id]);
    }

    if (driver.type === 'mosfet_driver_module' && psuV > Number(propertiesFor(driver).maxSupplyVoltage ?? Infinity)) {
      addResult(VALIDATION_SEVERITY.ERROR, 'ERR_DRIVER_VOLTAGE_RATING', 'Driver Supply Voltage Exceeds Rating',
        `${psuV} V exceeds ${driver.name}'s maximum supply rating (${propertiesFor(driver).maxSupplyVoltage} V).`,
        'Lower the supply voltage or select a motor driver with a higher voltage rating.', [psu.id, driver.id]);
    }
    if (driver.type === 'discrete_mosfet' && psuV > Number(propertiesFor(driver).vdsMax ?? Infinity)) {
      addResult(VALIDATION_SEVERITY.ERROR, 'ERR_MOSFET_VOLTAGE_RATING', 'MOSFET Drain Rating Exceeded',
        `${psuV} V exceeds ${driver.name}'s VDS rating (${propertiesFor(driver).vdsMax} V).`,
        'Lower the supply voltage or select a MOSFET with a suitable VDS rating.', [psu.id, driver.id]);
    }
  }

  const hasBlockingErrors = results.some(r => r.severity === VALIDATION_SEVERITY.ERROR);

  return {
    isValid: !hasBlockingErrors,
    hasBlockingErrors,
    results
  };
}

