import React, { useState } from 'react';
import { COMPONENT_CATALOG } from '../../data/componentLibrary.js';
import { COMPONENT_CATEGORIES } from '../../types/circuit.js';
import { 
  Search, Cpu, Cog, Zap, ShieldAlert, BatteryCharging, 
  Activity, Gauge, Plus 
} from 'lucide-react';

const CATEGORY_ICONS = {
  mcu: Cpu,
  motors: Cog,
  drivers: Zap,
  protection: ShieldAlert,
  power: BatteryCharging,
  sensors: Activity,
  tools: Gauge
};

export function ComponentLibrary({ onAddComponent }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredComponents = COMPONENT_CATALOG.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          comp.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || comp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDragStart = (e, compType) => {
    e.dataTransfer.setData('application/circuit-component', compType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-80 h-full flex flex-col bg-[#0f172a] border-r border-slate-800 text-slate-200 select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          Hardware Component Library
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Drag to canvas or click (+) to place in circuit
        </p>

        {/* Search Input */}
        <div className="mt-3 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search microcontrollers, drivers, sensors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-700/70 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          All
        </button>
        {Object.entries(COMPONENT_CATEGORIES).map(([, cat]) => {
          const Icon = CATEGORY_ICONS[cat.id] || Cpu;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3 h-3" />
              {cat.name.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Component Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredComponents.map(comp => {
          const Icon = CATEGORY_ICONS[comp.category] || Cpu;

          return (
            <div
              key={comp.type}
              draggable
              onDragStart={(e) => handleDragStart(e, comp.type)}
              onClick={() => onAddComponent(comp.type)}
              className="group p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-grab active:cursor-grabbing transition shadow-sm hover:shadow-cyan-950/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-cyan-500/40 text-cyan-400 group-hover:text-cyan-300 transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition">
                      {comp.name}
                    </h3>
                    <p className="text-[10px] text-cyan-400/90 font-mono">
                      {comp.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddComponent(comp.type);
                  }}
                  className="p-1 rounded-md bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition"
                  title="Place in workspace"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {comp.description}
              </p>

              {/* Pin summary tags */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>{comp.pins.length} Exposed Pins</span>
                <span className="font-mono text-slate-400">
                  {comp.pins.slice(0, 3).map(p => p.id).join(', ')}
                  {comp.pins.length > 3 ? '...' : ''}
                </span>
              </div>
            </div>
          );
        })}

        {filteredComponents.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500">
            No components match your search.
          </div>
        )}
      </div>
    </div>
  );
}
