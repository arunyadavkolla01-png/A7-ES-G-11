import React from 'react';

/**
 * Calculates smooth cubic Bezier path for electronics jumper wires
 */
export function generateWirePath(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const curvature = Math.max(40, Math.min(120, (dx + dy) * 0.35));

  const cp1x = x1 < x2 ? x1 + curvature : x1 - curvature;
  const cp1y = y1;
  const cp2x = x2 < x1 ? x2 + curvature : x2 - curvature;
  const cp2y = y2;

  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

/**
 * Helper to calculate absolute canvas coordinates for a pin, accounting for rotation
 */
export function getPinCanvasCoords(comp, pin) {
  if (!comp || !pin) return null;

  let rx = pin.x;
  let ry = pin.y;
  const rotation = comp.rotation || 0;

  if (rotation !== 0) {
    const rad = (rotation * Math.PI) / 180;
    const cx = comp.width / 2;
    const cy = comp.height / 2;
    const ox = rx - cx;
    const oy = ry - cy;
    rx = cx + (ox * Math.cos(rad) - oy * Math.sin(rad));
    ry = cy + (ox * Math.sin(rad) + oy * Math.cos(rad));
  }

  return {
    x: comp.x + rx,
    y: comp.y + ry
  };
}

export function WireRenderer({
  wires = [],
  components = [],
  selectedWireId,
  onSelectWire,
  hoveredWireId,
  onHoverWire,
  isSimulating = false
}) {
  const getPinCanvasPos = (componentId, pinId) => {
    const comp = components.find(c => c.id === componentId);
    if (!comp) return null;
    const pin = (comp.pins || []).find(p => p.id === pinId);
    if (!pin) return null;

    const coords = getPinCanvasCoords(comp, pin);
    if (!coords) return null;

    return {
      x: coords.x,
      y: coords.y,
      pin,
      comp
    };
  };

  return (
    <g className="wires-layer">
      {wires.map(wire => {
        if (!wire.from || !wire.to) return null;
        const start = getPinCanvasPos(wire.from.componentId, wire.from.pinId);
        const end = getPinCanvasPos(wire.to.componentId, wire.to.pinId);

        if (!start || !end) return null;

        const pathData = generateWirePath(start.x, start.y, end.x, end.y);
        const isSelected = selectedWireId === wire.id;
        const isHovered = hoveredWireId === wire.id;
        const isGround = wire.signalType === 'ground';
        const isPower = wire.signalType === 'power';
        const isPwm = wire.signalType === 'pwm';

        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        return (
          <g
            key={wire.id}
            className="cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              onSelectWire(wire);
            }}
            onMouseEnter={() => onHoverWire(wire.id)}
            onMouseLeave={() => onHoverWire(null)}
          >
            {/* Invisible wide hit area for easy clicking */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth={14}
            />

            {/* Selection Glow / Shadow */}
            {(isSelected || isHovered) && (
              <path
                d={pathData}
                fill="none"
                stroke={isSelected ? '#38bdf8' : 'rgba(255,255,255,0.4)'}
                strokeWidth={isGround ? 5 : 7}
                strokeOpacity={0.6}
                filter="url(#wire-glow)"
              />
            )}

            {/* Main Physical Wire */}
            <path
              d={pathData}
              fill="none"
              stroke={wire.color || '#38bdf8'}
              strokeWidth={isPower ? 3.5 : isGround ? 2.5 : 3.0}
              strokeDasharray={isGround ? '6 4' : undefined}
              strokeLinecap="round"
              className={isSimulating && isPwm ? 'wire-animated' : ''}
            />

            {/* Terminal Contact Beads */}
            <circle cx={start.x} cy={start.y} r={3} fill={wire.color} stroke="#0f172a" strokeWidth={1} />
            <circle cx={end.x} cy={end.y} r={3} fill={wire.color} stroke="#0f172a" strokeWidth={1} />

            {/* Midpoint Signal Label Badge (on hover or selection) */}
            {(isHovered || isSelected) && (
              <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none select-none">
                <rect
                  x={-42}
                  y={-11}
                  width={84}
                  height={22}
                  rx={4}
                  fill="#0f172a"
                  stroke={wire.color}
                  strokeWidth={1.5}
                />
                <text
                  x={0}
                  y={3.5}
                  textAnchor="middle"
                  fill="#f1f5f9"
                  fontSize={8.5}
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {wire.label ? wire.label.substring(0, 14) : wire.signalType.toUpperCase()}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * Preview wire in progress while drawing between pins
 */
export function WireDraftRenderer({ activeSourcePin, mousePos, components = [] }) {
  if (!activeSourcePin || !mousePos) return null;

  const comp = components.find(c => c.id === activeSourcePin.componentId);
  if (!comp) return null;
  const pin = (comp.pins || []).find(p => p.id === activeSourcePin.pinId);
  if (!pin) return null;

  const startCoords = getPinCanvasCoords(comp, pin);
  if (!startCoords) return null;

  const startX = startCoords.x;
  const startY = startCoords.y;
  const endX = mousePos.x;
  const endY = mousePos.y;

  const pathData = generateWirePath(startX, startY, endX, endY);

  return (
    <g className="wire-draft-layer pointer-events-none">
      <path
        d={pathData}
        fill="none"
        stroke="#06b6d4"
        strokeWidth={3}
        strokeDasharray="5 3"
        className="animate-pulse"
      />
      <circle cx={startX} cy={startY} r={5} fill="#06b6d4" />
      <circle cx={endX} cy={endY} r={4} fill="#38bdf8" />
    </g>
  );
}

