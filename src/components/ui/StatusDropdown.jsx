import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

const STATUS_CONFIG = {
  'In Progress': {
    badge: 'bg-primary-50 text-primary-700 border-primary-200/80 hover:bg-primary-100/70',
    dot: 'bg-primary-600',
    ring: 'focus:ring-primary-300',
  },
  'Assigned': {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100/70',
    dot: 'bg-indigo-600',
    ring: 'focus:ring-indigo-300',
  },
  'Completed': {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70',
    dot: 'bg-emerald-600',
    ring: 'focus:ring-emerald-300',
  },
  'On Hold': {
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/70',
    dot: 'bg-amber-600',
    ring: 'focus:ring-amber-300',
  },
};

const DEFAULT_CONFIG = {
  badge: 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100',
  dot: 'bg-neutral-400',
  ring: 'focus:ring-neutral-300',
};

const DEFAULT_STATUS_OPTIONS = [
  'In Progress',
  'Assigned',
  'Completed',
  'On Hold',
];

export default function StatusDropdown({
  value = 'In Progress',
  onChange,
  options = DEFAULT_STATUS_OPTIONS,
  direction = 'auto', // 'up' | 'down' | 'auto'
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [dropUp, setDropUp] = useState(direction === 'up');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && direction === 'auto' && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 190);
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (status) => {
    setIsOpen(false);
    if (onChange && status !== value) {
      onChange(status);
    }
  };

  const currentCfg = STATUS_CONFIG[value] || DEFAULT_CONFIG;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`group inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-xs transition-all outline-none focus:ring-2 focus:ring-offset-1 ${currentCfg.badge} ${currentCfg.ring} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm active:scale-[0.98]'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${currentCfg.dot} ${
            value === 'In Progress' ? 'animate-pulse' : ''
          }`}
        />
        <span>{value}</span>
        <ChevronDownIcon
          className={`h-3 w-3 text-neutral-500 transition-transform duration-200 group-hover:text-neutral-700 ${
            isOpen ? (dropUp ? '-rotate-180' : 'rotate-180') : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 z-50 w-44 rounded-xl border border-neutral-200/90 bg-white p-1.5 shadow-xl shadow-neutral-900/10 backdrop-blur-md transition-all animate-in fade-in-0 zoom-in-95 duration-100 ${
            dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Select Status
          </div>
          <div className="space-y-0.5">
            {options.map((opt) => {
              const optVal = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = optVal === value;
              const cfg = STATUS_CONFIG[optVal] || DEFAULT_CONFIG;

              return (
                <button
                  key={optVal}
                  type="button"
                  onClick={() => handleSelect(optVal)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-neutral-100/90 font-semibold text-neutral-900'
                      : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <span>{optLabel}</span>
                  </div>
                  {isSelected && (
                    <CheckIcon className="h-3.5 w-3.5 text-primary-600 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
