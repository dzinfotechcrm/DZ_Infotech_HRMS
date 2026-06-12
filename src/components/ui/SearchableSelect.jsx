import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SearchableSelect = forwardRef(({ 
  label, 
  error, 
  options = [], // [{ value, label }, ...]
  value, 
  onChange, 
  name, 
  placeholder = 'Select...',
  disabled = false,
  isLoading = false,
  className = '',
  ...props 
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    setIsOpen(false);
    setSearchQuery('');
    if (onChange) {
      onChange({ target: { name, value: val } });
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchQuery('');
    if (onChange) {
      onChange({ target: { name, value: '' } });
    }
    // If not disabled, keep or open dropdown
    if (!disabled) {
       setIsOpen(true);
       setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex flex-col gap-1.5 text-sm font-medium text-neutral-700 ${disabled ? 'opacity-60 pointer-events-none' : ''}`} ref={containerRef}>
      {label && <span>{label}</span>}
      <div className="relative">
        <div
          className={`flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition cursor-pointer
            ${isOpen ? 'border-primary-500 ring-2 ring-primary-100' : 'border-neutral-200'} 
            ${error ? 'border-danger-600 focus:border-danger-600 ring-danger-100' : ''} 
            ${disabled ? 'bg-neutral-50 text-neutral-400 cursor-not-allowed' : 'text-neutral-900'}
            ${className}`}
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              if (!isOpen) {
                setTimeout(() => inputRef.current?.focus(), 0);
              }
            }
          }}
        >
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent outline-none p-0 border-none focus:ring-0 text-sm"
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={`truncate ${!selectedOption && 'text-neutral-400'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          )}
          
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {!isLoading && value && !disabled && (
              <XMarkIcon 
                className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-pointer" 
                onClick={handleClear} 
              />
            )}
            <ChevronDownIcon className={`h-4 w-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {isOpen && !disabled && (
          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg focus:outline-none">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => (
                <li
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); handleSelect(option.value); }}
                  className={`cursor-pointer select-none px-4 py-2.5 text-sm transition-colors hover:bg-primary-50 hover:text-primary-700 ${String(value) === String(option.value) ? 'bg-primary-50 font-semibold text-primary-700' : 'text-neutral-900'}`}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-2.5 text-sm text-neutral-500">No results found</li>
            )}
          </ul>
        )}
      </div>
      
      {/* Hidden input for RHF ref attachment if needed */}
      <input 
         ref={ref}
         type="hidden"
         name={name}
         value={value || ''}
         {...props}
      />

      {error && <span className="text-xs font-medium text-danger-600">{error}</span>}
    </div>
  );
});

SearchableSelect.displayName = 'SearchableSelect';

export default SearchableSelect;
