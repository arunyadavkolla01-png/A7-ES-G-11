import React from 'react';
import { ComponentLibrary } from './ComponentLibrary.jsx';
import { CircuitWorkspace } from './CircuitWorkspace.jsx';
import { PropertiesPanel } from './PropertiesPanel.jsx';
import { ValidationReport } from './ValidationReport.jsx';
import { useLab } from '../../context/LabContext.jsx';

export function CircuitBuilderView() {
  const {
    components,
    setComponents,
    wires,
    setWires,
    selectedComponentId,
    setSelectedComponentId,
    selectedWireId,
    setSelectedWireId,
    handleAddComponent,
    handleRestoreExample,
    validation,
    simStatus
  } = useLab();

  const selectedComp = components.find(c => c.id === selectedComponentId);
  const selectedWire = wires.find(w => w.id === selectedWireId);

  const handleUpdateComponentProps = (id, newProps) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, properties: newProps } : c));
  };

  const handleDeleteComponent = (id) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    setWires(prev => prev.filter(w => w.from.componentId !== id && w.to.componentId !== id));
    setSelectedComponentId(null);
  };

  const handleRotateComponent = (id) => {
    setComponents(prev => prev.map(c => 
      c.id === id ? { ...c, rotation: ((c.rotation || 0) + 90) % 360 } : c
    ));
  };

  const handleUpdateWireProps = (id, patch) => {
    setWires(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w));
  };

  const handleDeleteWire = (id) => {
    setWires(prev => prev.filter(w => w.id !== id));
    setSelectedWireId(null);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#0b0f19]">
      {/* 3-Column Studio Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Component Catalog Sidebar */}
        <ComponentLibrary onAddComponent={handleAddComponent} />

        {/* Center: Main Interactive Canvas Workspace */}
        <div className="flex-1 h-full relative">
          <CircuitWorkspace
            components={components}
            wires={wires}
            onUpdateComponents={setComponents}
            onUpdateWires={setWires}
            selectedComponentId={selectedComponentId}
            onSelectComponent={(id) => {
              setSelectedComponentId(id);
              if (id) setSelectedWireId(null);
            }}
            selectedWireId={selectedWireId}
            onSelectWire={(w) => {
              setSelectedWireId(w ? w.id : null);
              if (w) setSelectedComponentId(null);
            }}
            onRestoreExample={handleRestoreExample}
            isSimulating={simStatus === 'running'}
          />
        </div>

        {/* Right: Properties Inspector Panel */}
        <PropertiesPanel
          selectedComponent={selectedComp}
          selectedWire={selectedWire}
          components={components}
          onUpdateComponentProps={handleUpdateComponentProps}
          onDeleteComponent={handleDeleteComponent}
          onRotateComponent={handleRotateComponent}
          onUpdateWireProps={handleUpdateWireProps}
          onDeleteWire={handleDeleteWire}
        />
      </div>

      {/* Bottom Collapsible Validation Bar */}
      <ValidationReport
        validation={validation}
        components={components}
      />
    </div>
  );
}
