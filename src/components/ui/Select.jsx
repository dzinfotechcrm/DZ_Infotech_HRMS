import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const Select = forwardRef(({ label, error, children, className = '', onChange, value, name, helpText, ...props }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse children to extract options
  const getOptions = (nodes) => {
    const opts = [];
    React.Children.forEach(nodes, (child) => {
      if (!child) return;
      if (child.type === 'option') {
        opts.push({ value: child.props.value, label: child.props.children, disabled: child.props.disabled });
      } else if (child.props && child.props.children) {
        opts.push(...getOptions(child.props.children));
      }
    });
    return opts;
  };
  const options = props.options || getOptions(children);

  const [internalValue, setInternalValue] = useState(value || '');

  // Sync with external value if provided
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const selectedOption = options.find(o => String(o.value) === String(internalValue)) || options[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    setInternalValue(val);
    setIsOpen(false);
    
    if (onChange) {
      onChange({ target: { name, value: val } });
    }
  };

  return (
    <div className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700" ref={containerRef}>
      {label && <span>{label}</span>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition ${isOpen ? 'border-primary-500 ring-2 ring-primary-100' : 'border-neutral-200'} ${error ? 'border-danger-600 focus:border-danger-600 ring-danger-100' : ''} ${className}`}
        >
          <span className="truncate">{selectedOption?.label || 'Select...'}</span>
          <ChevronDownIcon className={`h-4 w-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg focus:outline-none">
            {options.map((option, idx) => (
              <li
                key={idx}
                onClick={() => {
                  if (!option.disabled) handleSelect(option.value);
                }}
                className={`select-none px-4 py-2.5 text-sm transition-colors ${option.disabled ? 'cursor-not-allowed text-neutral-400 bg-neutral-50' : 'cursor-pointer hover:bg-primary-50 hover:text-primary-700'} ${!option.disabled && String(internalValue) === String(option.value) ? 'bg-primary-50 font-semibold text-primary-700' : (!option.disabled ? 'text-neutral-900' : '')}`}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Hidden select for RHF ref attachment */}
      <select 
         ref={ref}
         name={name}
         value={internalValue}
         onChange={() => {}}
         className="hidden"
         {...props}
      >
        {options.map((o, i) => <option key={i} value={o.value}>{o.label}</option>)}
      </select>

      {helpText && <span className="text-xs text-neutral-500">{helpText}</span>}
      {error && <span className="text-xs font-medium text-danger-600">{error}</span>}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
