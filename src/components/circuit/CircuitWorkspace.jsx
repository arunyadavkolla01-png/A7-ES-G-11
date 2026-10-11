import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RenderComponentSvg } from './SvgComponents.jsx';
import { WireRenderer, WireDraftRenderer } from './WireRenderer.jsx';
import { WIRE_COLORS, PIN_TYPES } from '../../types/circuit.js';
import { findComponentPin, getConnectionTypeError } from '../../engine/connectionRules.js';
import { 
  ZoomIn, ZoomOut, Maximize2, Trash2, RotateCw, 
  Grid, Sparkles, Layers, MousePointer
} from 'lucide-react';

export function CircuitWorkspace({
  components,
  wires,
  onUpdateComponents,
  onUpdateWires,
  selectedComponentId,
  onSelectComponent,
  selectedWireId,
  onSelectWire,
  onRestoreExample,
  isSimulating = false
}) {
  const svgRef = useRef(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanMouse, setStartPanMouse] = useState({ x: 0, y: 0 });

  // Component Dragging state
  const [draggedCompId, setDraggedCompId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Wiring state
  const [activeSourcePin, setActiveSourcePin] = useState(null);
  const [draftMousePos, setDraftMousePos] = useState(null);
  const [hoveredPin, setHoveredPin] = useState(null);
  const [hoveredWireId, setHoveredWireId] = useState(null);

  // Grid snap
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 20;

  // Transform client coordinates to SVG canvas space
  const screenToCanvasCoords = useCallback((clientX, clientY) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  }, [pan, zoom]);

  // Handle canvas mouse down for panning
  const handleCanvasMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.classList.contains('canvas-background')) {
      if (activeSourcePin) {
        // Cancel draft wire
        setActiveSourcePin(null);
        setDraftMousePos(null);
      } else {
        // Start canvas panning
        setIsPanning(true);
        setStartPanMouse({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        onSelectComponent(null);
        onSelectWire(null);
      }
    }
  };

  // Handle mouse move (panning, component dragging, wiring draft)
  const handleMouseMove = (e) => {
    const canvasPos = screenToCanvasCoords(e.clientX, e.clientY);

    // Update draft wire tip
    if (activeSourcePin) {
      setDraftMousePos(canvasPos);
    }

    // Handle canvas panning
    if (isPanning) {
      setPan({
        x: e.clientX - startPanMouse.x,
        y: e.clientY - startPanMouse.y
      });
      return;
    }

    // Handle component dragging
    if (draggedCompId) {
      let newX = canvasPos.x - dragOffset.x;
      let newY = canvasPos.y - dragOffset.y;

      if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      onUpdateComponents(prev => prev.map(c => 
        c.id === draggedCompId ? { ...c, x: Math.max(0, newX), y: Math.max(0, newY) } : c
      ));
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedCompId(null);
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  };

  // Component Drag Start
  const handleComponentMouseDown = (e, comp) => {
    e.stopPropagation();
    onSelectComponent(comp.id);
    onSelectWire(null);

    const canvasPos = screenToCanvasCoords(e.clientX, e.clientY);
    setDraggedCompId(comp.id);
    setDragOffset({
      x: canvasPos.x - comp.x,
      y: canvasPos.y - comp.y
    });
  };

  // Pin Click for Wiring
  const handlePinClick = (componentId, pinId) => {
    if (!activeSourcePin) {
      // Step 1: Start wire from this pin
      setActiveSourcePin({ componentId, pinId });
    } else {
      // Step 2: Complete wire to destination pin
      if (activeSourcePin.componentId === componentId && activeSourcePin.pinId === pinId) {
        // Clicked same pin: cancel
        setActiveSourcePin(null);
        setDraftMousePos(null);
        return;
      }

      // Check if wire already exists
      const wireExists = wires.some(w =>
        (w.from && w.to) && (
          (w.from.componentId === activeSourcePin.componentId && w.from.pinId === activeSourcePin.pinId &&
           w.to.componentId === componentId && w.to.pinId === pinId) ||
          (w.to.componentId === activeSourcePin.componentId && w.to.pinId === activeSourcePin.pinId &&
           w.from.componentId === componentId && w.from.pinId === pinId)
        )
      );

      if (wireExists) {
        setActiveSourcePin(null);
        setDraftMousePos(null);
        return;
      }

      // Determine wire color and signal type
      const srcComp = components.find(c => c.id === activeSourcePin.componentId);
      const dstComp = components.find(c => c.id === componentId);
      const srcPin = findComponentPin(srcComp, activeSourcePin.pinId);
      const dstPin = findComponentPin(dstComp, pinId);
      const compatibilityError = getConnectionTypeError(srcPin, dstPin);

      let color = compatibilityError ? '#ef4444' : WIRE_COLORS.DEFAULT;
      let signalType = compatibilityError ? 'invalid' : 'signal';
      let label = compatibilityError
        ? 'INVALID: incompatible pin types'
        : `${srcPin?.name?.split(' ')[0] || 'PIN'} -> ${dstPin?.name?.split(' ')[0] || 'PIN'}`;

      if (!compatibilityError && (srcPin?.type === PIN_TYPES.GROUND || dstPin?.type === PIN_TYPES.GROUND)) {
        color = WIRE_COLORS.GROUND;
        signalType = 'ground';
        label = 'GND Return';
      } else if (!compatibilityError && (srcPin?.type === PIN_TYPES.POWER || dstPin?.type === PIN_TYPES.POWER)) {
        color = (srcPin?.voltage === 3.3 || dstPin?.voltage === 3.3) ? WIRE_COLORS.POWER_3V3 : WIRE_COLORS.POWER_VCC;
        signalType = 'power';
        label = `${srcPin?.voltage || dstPin?.voltage || 12}V Rail`;
      } else if (!compatibilityError && (srcPin?.type === PIN_TYPES.PWM || dstPin?.type === PIN_TYPES.PWM || 
                 srcPin?.type === PIN_TYPES.DRIVER_IN || dstPin?.type === PIN_TYPES.DRIVER_IN)) {
        color = WIRE_COLORS.PWM;
        signalType = 'pwm';
        label = 'TIM1_CH1 PWM';
      } else if (!compatibilityError && (srcPin?.type === PIN_TYPES.MOTOR_TERMINAL || dstPin?.type === PIN_TYPES.MOTOR_TERMINAL)) {
        color = WIRE_COLORS.MOTOR;
        signalType = 'motor';
        label = 'Motor Armature';
      } else if (!compatibilityError && (srcPin?.type === PIN_TYPES.ADC || dstPin?.type === PIN_TYPES.ADC || 
                 srcPin?.type === PIN_TYPES.SENSOR_OUT || dstPin?.type === PIN_TYPES.SENSOR_OUT)) {
        color = WIRE_COLORS.ANALOG;
        signalType = 'analog';
        label = 'Analog ADC Feedback';
      }

      const newWire = {
        id: `wire_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        from: { componentId: activeSourcePin.componentId, pinId: activeSourcePin.pinId },
        to: { componentId, pinId },
        color,
        signalType,
        label,
        compatibilityError
      };

      onUpdateWires(prev => [...prev, newWire]);
      setActiveSourcePin(null);
      setDraftMousePos(null);
    }
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveSourcePin(null);
        setDraftMousePos(null);
        onSelectComponent(null);
        onSelectWire(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        if (selectedComponentId) {
          // Delete component and all connected wires
          onUpdateComponents(prev => prev.filter(c => c.id !== selectedComponentId));
          onUpdateWires(prev => prev.filter(w => 
            w.from.componentId !== selectedComponentId && w.to.componentId !== selectedComponentId
          ));
          onSelectComponent(null);
        } else if (selectedWireId) {
          onUpdateWires(prev => prev.filter(w => w.id !== selectedWireId));
          onSelectWire(null);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedComponentId) {
          onUpdateComponents(prev => prev.map(c => 
            c.id === selectedComponentId ? { ...c, rotation: ((c.rotation || 0) + 90) % 360 } : c
          ));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, selectedWireId, onUpdateComponents, onUpdateWires, onSelectComponent, onSelectWire]);

  // Drop component from drag-and-drop HTML5 API
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const compType = e.dataTransfer.getData('application/circuit-component');
    if (!compType) return;

    const coords = screenToCanvasCoords(e.clientX, e.clientY);
    const snapX = snapToGrid ? Math.round(coords.x / gridSize) * gridSize : coords.x;
    const snapY = snapToGrid ? Math.round(coords.y / gridSize) * gridSize : coords.y;

    window.dispatchEvent(new CustomEvent('add-component-at', { 
      detail: { type: compType, x: snapX, y: snapY } 
    }));
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0b0f19] select-none overflow-hidden">
      {/* Top Canvas Controls Bar */}
      <div className="h-11 bg-[#111827]/90 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            Circuit Canvas
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            {components.length} Components • {wires.length} Wires
          </span>
          {activeSourcePin && (
            <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono text-[11px] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Click destination pin (or Esc to cancel)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800/80 rounded-lg border border-slate-700/60 p-0.5">
            <button
              onClick={() => setZoom(prev => Math.max(0.4, prev - 0.15))}
              className="p-1.5 hover:bg-slate-700 text-slate-300 rounded transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-2 text-slate-300 min-w-[44px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(2.5, prev + 0.15))}
              className="p-1.5 hover:bg-slate-700 text-slate-300 rounded transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setZoom(1.0); setPan({ x: 0, y: 0 }); }}
              className="p-1.5 hover:bg-slate-700 text-slate-300 rounded transition"
              title="Reset View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid snap toggle */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1.5 transition ${
              snapToGrid 
                ? 'bg-blue-950/60 border-blue-500/60 text-blue-300' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
            title="Toggle Grid Snapping"
          >
            <Grid className="w-3.5 h-3.5" />
            Grid Snap
          </button>

          {/* Rotate Selected */}
          {selectedComponentId && (
            <button
              onClick={() => {
                onUpdateComponents(prev => prev.map(c => 
                  c.id === selectedComponentId ? { ...c, rotation: ((c.rotation || 0) + 90) % 360 } : c
                ));
              }}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 flex items-center gap-1.5 transition"
              title="Rotate Component (R)"
            >
              <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
              Rotate
            </button>
          )}

          {/* Delete Selected */}
          {(selectedComponentId || selectedWireId) && (
            <button
              onClick={() => {
                if (selectedComponentId) {
                  onUpdateComponents(prev => prev.filter(c => c.id !== selectedComponentId));
                  onUpdateWires(prev => prev.filter(w => 
                    w.from.componentId !== selectedComponentId && w.to.componentId !== selectedComponentId
                  ));
                  onSelectComponent(null);
                } else if (selectedWireId) {
                  onUpdateWires(prev => prev.filter(w => w.id !== selectedWireId));
                  onSelectWire(null);
                }
              }}
              className="px-2.5 py-1 text-xs bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 rounded-lg text-red-300 flex items-center gap-1.5 transition"
              title="Delete Selected Item (Del)"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              Delete
            </button>
          )}

          {/* Restore Example Button */}
          <button
            onClick={onRestoreExample}
            className="px-3 py-1 text-xs bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-600/60 text-emerald-300 rounded-lg flex items-center gap-1.5 font-medium transition shadow-sm"
            title="Load Pre-Wired Reference Circuit"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Restore Example Circuit
          </button>
        </div>
      </div>

      {/* Main Interactive SVG Canvas */}
      <div 
        className="flex-1 relative overflow-hidden circuit-grid cursor-crosshair"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <svg
          ref={svgRef}
          className="w-full h-full block canvas-background"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          <defs>
            <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Canvas Transformation Group */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Wires Layer */}
            <WireRenderer
              wires={wires}
              components={components}
              selectedWireId={selectedWireId}
              onSelectWire={onSelectWire}
              hoveredWireId={hoveredWireId}
              onHoverWire={setHoveredWireId}
              isSimulating={isSimulating}
            />

            {/* Wire Draft in Progress */}
            <WireDraftRenderer
              activeSourcePin={activeSourcePin}
              mousePos={draftMousePos}
              components={components}
            />

            {/* Placed Components Layer */}
            {components.map(comp => (
              <g
                key={comp.id}
                transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation || 0}, ${comp.width / 2}, ${comp.height / 2})`}
                onMouseDown={(e) => handleComponentMouseDown(e, comp)}
                className="cursor-move"
              >
                <RenderComponentSvg
                  component={comp}
                  isSelected={selectedComponentId === comp.id}
                  onPinClick={handlePinClick}
                  activeSourcePin={activeSourcePin}
                  hoveredPin={hoveredPin}
                  onPinHover={setHoveredPin}
                />
              </g>
            ))}
          </g>
        </svg>

        {/* Empty Canvas Guidance Overlay */}
        {components.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
            <div className="max-w-md p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-2xl">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center mx-auto mb-4 text-cyan-400">
                <MousePointer className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Empty Circuit Canvas
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Start building your virtual motor control system! Select components from the left library to place them, or click below to load a verified reference laboratory setup.
              </p>
              <div className="flex items-center justify-center gap-3 pointer-events-auto">
                <button
                  onClick={onRestoreExample}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-cyan-900/30 transition flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Restore Example Circuit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Pin Hover Floating HUD */}
        {hoveredPin && (
          <div className="absolute bottom-3 left-4 bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs backdrop-blur pointer-events-none shadow-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="font-mono font-semibold text-slate-200">{hoveredPin.pin.name}</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-300 font-mono">{hoveredPin.pin.voltage}V</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 capitalize">{hoveredPin.pin.direction}</span>
          </div>
        )}
      </div>
    </div>
  );
}
