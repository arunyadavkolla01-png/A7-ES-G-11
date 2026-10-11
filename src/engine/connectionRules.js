import { getComponentDef } from '../data/componentLibrary.js';
import { PIN_TYPES } from '../types/circuit.js';

export function findComponentPin(component, pinId) {
  return component?.pins?.find(pin => pin.id === pinId) ||
    getComponentDef(component?.type)?.pins?.find(pin => pin.id === pinId) || null;
}

export function getConnectionTypeError(sourcePin, destinationPin) {
  if (!sourcePin || !destinationPin) return 'One or both selected pins do not exist.';

  const a = sourcePin.type;
  const b = destinationPin.type;
  const has = (...types) => types.includes(a) && types.includes(b);

  const compatible =
    has(PIN_TYPES.GROUND) ||
    has(PIN_TYPES.POWER) ||
    has(PIN_TYPES.PWM, PIN_TYPES.DRIVER_IN) ||
    has(PIN_TYPES.ADC, PIN_TYPES.SENSOR_OUT) ||
    has(PIN_TYPES.UART_TX, PIN_TYPES.UART_RX) ||
    has(PIN_TYPES.GPIO) ||
    has(PIN_TYPES.DRIVER_OUT, PIN_TYPES.MOTOR_TERMINAL) ||
    has(PIN_TYPES.DRIVER_OUT, PIN_TYPES.SENSOR_IN) ||
    has(PIN_TYPES.SENSOR_IN, PIN_TYPES.MOTOR_TERMINAL) ||
    has(PIN_TYPES.MOTOR_TERMINAL, PIN_TYPES.POWER) ||
    has(PIN_TYPES.SENSOR_IN, PIN_TYPES.POWER) ||
    (a === PIN_TYPES.PROBE && b !== PIN_TYPES.GROUND) ||
    (b === PIN_TYPES.PROBE && a !== PIN_TYPES.GROUND);

  return compatible ? null : `Incompatible pin types: ${sourcePin.name} (${a}) cannot connect to ${destinationPin.name} (${b}).`;
}
