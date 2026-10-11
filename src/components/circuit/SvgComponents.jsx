import React from 'react';
import { PIN_TYPES } from '../../types/circuit.js';

export function getPinColor(pinType) {
  switch (pinType) {
    case PIN_TYPES.POWER:
      return '#ef4444'; // Red
    case PIN_TYPES.GROUND:
      return '#374151'; // Dark Slate / Gray
    case PIN_TYPES.PWM:
      return '#06b6d4'; // Cyan
    case PIN_TYPES.ADC:
    case PIN_TYPES.SENSOR_OUT:
      return '#10b981'; // Green
    case PIN_TYPES.MOTOR_TERMINAL:
      return '#3b82f6'; // Blue
    case PIN_TYPES.DRIVER_IN:
      return '#8b5cf6'; // Purple
    case PIN_TYPES.DRIVER_OUT:
      return '#f97316'; // Orange
    case PIN_TYPES.PROBE:
      return '#ec4899'; // Pink
    default:
      return '#94a3b8'; // Slate
  }
}

/**
 * High-fidelity SVG Component Renderer
 */
export function RenderComponentSvg({ component, isSelected, onPinClick, activeSourcePin, hoveredPin, onPinHover }) {
  const { type, width, height, pins = [], properties = {} } = component;

  return (
    <g className={`transition-all duration-150 ${isSelected ? 'filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]' : ''}`}>
      {/* Component Body Graphics */}
      {renderComponentGraphic(type, width, height, properties)}

      {/* Component Selection Border */}
      {isSelected && (
        <rect
          x={-4}
          y={-4}
          width={width + 8}
          height={height + 8}
          rx={8}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
      )}

      {/* Interactive Pins */}
      {pins.map(pin => {
        const isSource = activeSourcePin?.componentId === component.id && activeSourcePin?.pinId === pin.id;
        const isHovered = hoveredPin?.componentId === component.id && hoveredPin?.pinId === pin.id;
        const pinColor = getPinColor(pin.type);

        return (
          <g
            key={pin.id}
            transform={`translate(${pin.x}, ${pin.y})`}
            className="cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              onPinClick(component.id, pin.id);
            }}
            onMouseEnter={() => onPinHover({ componentId: component.id, pinId: pin.id, pin })}
            onMouseLeave={() => onPinHover(null)}
          >
            {/* Outer hover / target ring */}
            <circle
              r={isSource ? 11 : isHovered ? 10 : 7}
              fill={isSource ? '#06b6d4' : isHovered ? '#3b82f6' : 'rgba(30, 41, 59, 0.8)'}
              fillOpacity={isSource || isHovered ? 0.35 : 0.6}
              stroke={isSource ? '#06b6d4' : pinColor}
              strokeWidth={isSource ? 3 : 2}
              className={isSource ? 'animate-pulse' : ''}
            />

            {/* Inner Metallic Pad */}
            <circle
              r={3.5}
              fill={pinColor}
              stroke="#0f172a"
              strokeWidth={1}
            />

            {/* Pin Label */}
            <text
              x={pin.side === 'right' ? -10 : 10}
              y={3.5}
              textAnchor={pin.side === 'right' ? 'end' : 'start'}
              fill="#cbd5e1"
              fontSize={8.5}
              fontFamily="monospace"
              fontWeight="600"
              className="pointer-events-none select-none drop-shadow"
            >
              {pin.name.split(' ')[0]}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function renderComponentGraphic(type, width, height, props) {
  switch (type) {
    case 'stm32h7_board':
      return (
        <g>
          {/* PCB Base */}
          <rect width={width} height={height} rx={6} fill="#0d2e2b" stroke="#059669" strokeWidth="2" />
          <rect x={6} y={6} width={width - 12} height={height - 12} rx={4} fill="#064e3b" opacity="0.4" />
          
          {/* Silk screen title */}
          <text x={width / 2} y={22} fill="#6ee7b7" fontSize={11} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            STM32H743ZI NUCLEO
          </text>
          <text x={width / 2} y={33} fill="#a7f3d0" fontSize={7.5} fontFamily="monospace" textAnchor="middle">
            Arm Cortex-M7 • 480 MHz • Dual Core
          </text>

          {/* Main MCU IC LQFP Package */}
          <rect x={width / 2 - 28} y={44} width={56} height={56} rx={3} fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          {/* IC Orientation Dot */}
          <circle cx={width / 2 - 22} cy={50} r={2.5} fill="#64748b" />
          <text x={width / 2} y={75} fill="#e2e8f0" fontSize={8} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            STM32H7
          </text>
          <text x={width / 2} y={86} fill="#94a3b8" fontSize={6.5} fontFamily="monospace" textAnchor="middle">
            480MHz
          </text>

          {/* ST-LINK Section */}
          <rect x={18} y={48} width={28} height={46} rx={2} fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <text x={32} y={72} fill="#94a3b8" fontSize={6} fontFamily="monospace" textAnchor="middle">ST-LINK</text>

          {/* User LEDs */}
          <circle cx={width - 32} cy={52} r={3} fill="#10b981" />
          <text x={width - 24} y={54} fill="#6ee7b7" fontSize={6} fontFamily="monospace">LD1</text>
          <circle cx={width - 32} cy={66} r={3} fill="#3b82f6" />
          <text x={width - 24} y={68} fill="#93c5fd" fontSize={6} fontFamily="monospace">LD2</text>
          <circle cx={width - 32} cy={80} r={3} fill="#ef4444" />
          <text x={width - 24} y={82} fill="#fca5a5" fontSize={6} fontFamily="monospace">LD3</text>

          {/* Reset & User Buttons */}
          <rect x={30} y={110} width={14} height={14} rx={2} fill="#2563eb" />
          <text x={37} y={135} fill="#93c5fd" fontSize={6} fontFamily="monospace" textAnchor="middle">USER</text>

          <rect x={width - 44} y={110} width={14} height={14} rx={2} fill="#1e293b" stroke="#64748b" />
          <text x={width - 37} y={135} fill="#94a3b8" fontSize={6} fontFamily="monospace" textAnchor="middle">RESET</text>

          {/* USB Connector */}
          <rect x={width / 2 - 12} y={height - 12} width={24} height={12} rx={2} fill="#cbd5e1" stroke="#94a3b8" />
        </g>
      );

    case 'generic_stm32_mcu':
      return (
        <g>
          <rect width={width} height={height} rx={6} fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx={18} cy={18} r={3} fill="#38bdf8" />
          <text x={width / 2} y={height / 2 - 10} fill="#f8fafc" fontSize={11} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            STM32H743
          </text>
          <text x={width / 2} y={height / 2 + 6} fill="#38bdf8" fontSize={8} fontFamily="monospace" textAnchor="middle">
            CORTEX-M7
          </text>
          <text x={width / 2} y={height / 2 + 20} fill="#64748b" fontSize={7} fontFamily="monospace" textAnchor="middle">
            LQFP-64 IC
          </text>
        </g>
      );

    case 'dc_motor':
      return (
        <g>
          <rect x={18} y={18} width={width - 36} height={height - 36} rx={16} fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <rect x={width - 18} y={height / 2 - 6} width={26} height={12} rx={2} fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1" />
          <circle cx={width / 2 - 4} cy={height / 2} r={32} fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" />
          <circle cx={width / 2 - 4} cy={height / 2} r={18} fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" />
          <circle cx={width / 2 - 4} cy={height / 2} r={5} fill="#cbd5e1" />
          <text x={width / 2 - 4} y={32} fill="#93c5fd" fontSize={9} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            BRUSHED DC MOTOR
          </text>
          <text x={width / 2 - 4} y={height - 24} fill="#64748b" fontSize={7.5} fontFamily="monospace" textAnchor="middle">
            {props.ratedVoltage || 12}V • {props.loadTorque || 0.04} N·m
          </text>
        </g>
      );

    case 'mosfet_driver_module':
      return (
        <g>
          <rect width={width} height={height} rx={6} fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
          <rect x={width / 2 - 28} y={26} width={56} height={42} rx={2} fill="#334155" stroke="#64748b" strokeWidth="1" />
          <line x1={width / 2 - 20} y1={26} x2={width / 2 - 20} y2={68} stroke="#475569" strokeWidth="2" />
          <line x1={width / 2} y1={26} x2={width / 2} y2={68} stroke="#475569" strokeWidth="2" />
          <line x1={width / 2 + 20} y1={26} x2={width / 2 + 20} y2={68} stroke="#475569" strokeWidth="2" />
          <rect x={width - 24} y={24} width={20} height={102} rx={2} fill="#14532d" stroke="#22c55e" strokeWidth="1" />
          <circle cx={width - 14} cy={35} r={3.5} fill="#052e16" stroke="#4ade80" />
          <circle cx={width - 14} cy={65} r={3.5} fill="#052e16" stroke="#4ade80" />
          <circle cx={width - 14} cy={95} r={3.5} fill="#052e16" stroke="#4ade80" />
          <circle cx={width - 14} cy={125} r={3.5} fill="#052e16" stroke="#4ade80" />
          <rect x={36} y={64} width={24} height={20} rx={2} fill="#0f172a" stroke="#475569" />
          <text x={48} y={77} fill="#818cf8" fontSize={6} fontFamily="monospace" textAnchor="middle">OPTO</text>
          <text x={width / 2 - 10} y={96} fill="#c7d2fe" fontSize={8.5} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            MOSFET DRIVER
          </text>
          <text x={width / 2 - 10} y={110} fill="#818cf8" fontSize={7} fontFamily="monospace" textAnchor="middle">
            Optoisolated PWM
          </text>
        </g>
      );

    case 'discrete_mosfet':
      return (
        <g>
          <rect x={28} y={12} width={width - 56} height={28} rx={2} fill="#64748b" stroke="#94a3b8" />
          <circle cx={width / 2} cy={24} r={6} fill="#0f172a" stroke="#94a3b8" />
          <rect x={28} y={36} width={width - 56} height={60} rx={3} fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <text x={width / 2} y={62} fill="#f8fafc" fontSize={9} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            IRLZ44N
          </text>
          <text x={width / 2} y={74} fill="#38bdf8" fontSize={7} fontFamily="monospace" textAnchor="middle">
            N-CH MOSFET
          </text>
          <text x={width / 2} y={85} fill="#64748b" fontSize={6.5} fontFamily="monospace" textAnchor="middle">
            Logic-Level
          </text>
        </g>
      );

    case 'flyback_diode':
      return (
        <g>
          <rect x={24} y={22} width={width - 48} height={46} rx={4} fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
          <rect x={width - 42} y={22} width={10} height={46} fill="#e2e8f0" />
          <polygon points={`${width / 2 - 10},35 ${width / 2 - 10},55 ${width / 2 + 8},45`} fill="#38bdf8" />
          <line x1={width / 2 + 8} y1={33} x2={width / 2 + 8} y2={57} stroke="#38bdf8" strokeWidth="2" />
          <text x={width / 2 - 6} y={height - 8} fill="#94a3b8" fontSize={7.5} fontFamily="monospace" textAnchor="middle">
            1N5819 SCHOTTKY
          </text>
        </g>
      );

    case 'dc_power_supply':
      return (
        <g>
          <rect width={width} height={height} rx={6} fill="#18181b" stroke="#71717a" strokeWidth="1.5" />
          <rect x={20} y={20} width={width - 64} height={42} rx={3} fill="#09090b" stroke="#27272a" />
          <text x={width / 2 - 20} y={48} fill="#ef4444" fontSize={18} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            {(props.voltage || 12.0).toFixed(1)} V
          </text>
          <text x={width / 2 - 20} y={58} fill="#22c55e" fontSize={8} fontFamily="monospace" textAnchor="middle">
            I_max: {(props.currentLimit || 5.0).toFixed(1)} A
          </text>
          <circle cx={42} cy={88} r={14} fill="#27272a" stroke="#52525b" strokeWidth="1.5" />
          <line x1={42} y1={88} x2={48} y2={80} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <text x={width - 32} y={44} fill="#ef4444" fontSize={8} fontWeight="bold" fontFamily="monospace">V+</text>
          <text x={width - 32} y={84} fill="#94a3b8" fontSize={8} fontWeight="bold" fontFamily="monospace">GND</text>
        </g>
      );

    case 'ground_terminal':
      return (
        <g>
          <rect width={width} height={height} rx={6} fill="#111827" stroke="#4b5563" strokeWidth="1.5" />
          <line x1={width / 2} y1={18} x2={width / 2} y2={42} stroke="#9ca3af" strokeWidth="2" />
          <line x1={width / 2 - 16} y1={42} x2={width / 2 + 16} y2={42} stroke="#9ca3af" strokeWidth="2.5" />
          <line x1={width / 2 - 10} y1={49} x2={width / 2 + 10} y2={49} stroke="#9ca3af" strokeWidth="2" />
          <line x1={width / 2 - 4} y1={56} x2={width / 2 + 4} y2={56} stroke="#9ca3af" strokeWidth="1.5" />
          <text x={width / 2} y={70} fill="#6b7280" fontSize={7} fontFamily="monospace" textAnchor="middle">
            COMMON GND
          </text>
        </g>
      );

    case 'breadboard_rail':
      return (
        <g>
          <rect width={width} height={height} rx={4} fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <line x1={12} y1={25} x2={width - 12} y2={25} stroke="#ef4444" strokeWidth="2" />
          <line x1={12} y1={55} x2={width - 12} y2={55} stroke="#3b82f6" strokeWidth="2" />
          <text x={width / 2} y={16} fill="#f87171" fontSize={7} fontFamily="monospace" textAnchor="middle">+ POWER RAIL</text>
          <text x={width / 2} y={74} fill="#60a5fa" fontSize={7} fontFamily="monospace" textAnchor="middle">- GND RAIL</text>
        </g>
      );

    case 'current_sensor':
      return (
        <g>
          <rect width={width} height={height} rx={6} fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
          <rect x={width / 2 - 20} y={35} width={40} height={32} rx={2} fill="#0f172a" stroke="#334155" />
          <text x={width / 2} y={54} fill="#34d399" fontSize={8} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            ACS712
          </text>
          <text x={width / 2} y={63} fill="#6ee7b7" fontSize={6} fontFamily="monospace" textAnchor="middle">
            HALL SENSOR
          </text>
          <rect x={18} y={30} width={26} height={50} rx={2} fill="#b45309" stroke="#f59e0b" strokeWidth="1" />
          <text x={31} y={58} fill="#fef3c7" fontSize={6.5} fontFamily="monospace" textAnchor="middle">SHUNT</text>
          <text x={width / 2} y={96} fill="#a7f3d0" fontSize={7.5} fontFamily="monospace" textAnchor="middle">
            185 mV/A Output
          </text>
        </g>
      );

    case 'voltage_sensor':
      return (
        <g>
          <rect width={width} height={height} rx={6} fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" />
          <rect x={36} y={30} width={40} height={16} fill="#0f172a" stroke="#a5b4fc" />
          <rect x={36} y={55} width={40} height={16} fill="#0f172a" stroke="#a5b4fc" />
          <text x={56} y={42} fill="#c7d2fe" fontSize={7} fontFamily="monospace" textAnchor="middle">30kΩ</text>
          <text x={56} y={67} fill="#c7d2fe" fontSize={7} fontFamily="monospace" textAnchor="middle">7.5kΩ</text>
          <text x={width / 2} y={94} fill="#818cf8" fontSize={7.5} fontFamily="monospace" textAnchor="middle">
            5:1 DIVIDER (0-25V)
          </text>
        </g>
      );

    case 'virtual_oscilloscope':
      return (
        <g>
          <rect width={width} height={height} rx={6} fill="#0f172a" stroke="#ec4899" strokeWidth="1.5" />
          <rect x={32} y={18} width={width - 56} height={60} rx={3} fill="#052e16" stroke="#22c55e" strokeWidth="1" />
          <path d="M 36,48 L 50,48 L 50,28 L 68,28 L 68,48 L 86,48 L 86,28 L 104,28 L 104,48" fill="none" stroke="#4ade80" strokeWidth="1.5" />
          <text x={width / 2 + 8} y={height - 14} fill="#f472b6" fontSize={8} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            OSCILLOSCOPE PROBE
          </text>
        </g>
      );

    default:
      return (
        <rect width={width} height={height} rx={4} fill="#1e293b" stroke="#475569" strokeWidth="1" />
      );
  }
}

