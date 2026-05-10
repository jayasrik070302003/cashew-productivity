import React, { useState, useRef, useEffect } from 'react';
import { MdExpandMore } from 'react-icons/md';

const CustomSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select an option', 
  labelKey = 'name', 
  valueKey = 'id',
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt[valueKey] == value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`custom-select-container ${className}`} ref={containerRef}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`} 
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="trigger-text">
          {selectedOption ? selectedOption[labelKey] : placeholder}
        </span>
        <MdExpandMore className="dropdown-arrow" size={20} />
      </div>
      
      {isOpen && (
        <div className="custom-select-options">
          {options.length === 0 ? (
            <div className="custom-select-option disabled">No options available</div>
          ) : (
            options.map((opt, idx) => (
              <div 
                key={opt[valueKey] || idx}
                className={`custom-select-option ${value == opt[valueKey] ? 'selected' : ''}`}
                onClick={() => handleSelect(opt[valueKey])}
              >
                {opt[labelKey]}
              </div>
            ))
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-select-container { position: relative; width: 100%; font-family: 'Inter', sans-serif; }
        .custom-select-trigger {
          display: flex; justify-content: space-between; align-items: center;
          height: 42px; padding: 0 16px; background: #fff; border: 1px solid #d1d5db;
          border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;
          color: #374151; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .custom-select-trigger:hover:not(.disabled) { border-color: var(--green-400); }
        .custom-select-trigger.open { 
          border-color: var(--green-500); box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1); 
        }
        .custom-select-trigger.disabled { background: #f9fafb; cursor: not-allowed; color: #9ca3af; }
        .dropdown-arrow { color: #9ca3af; transition: transform 0.2s; }
        .custom-select-trigger.open .dropdown-arrow { transform: rotate(180deg); color: var(--green-600); }
        
        .custom-select-options {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0;
          background: #fff; border: 1px solid #e5e7eb; border-radius: 10px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
          z-index: 1000; max-height: 240px; overflow-y: auto; padding: 6px;
          animation: dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        
        .custom-select-option {
          padding: 10px 12px; border-radius: 6px; cursor: pointer;
          font-size: 13px; color: #4b5563; transition: all 0.15s;
        }
        .custom-select-option:hover:not(.disabled) { background: #f3f4f6; color: #111827; }
        .custom-select-option.selected { background: #ecfdf5; color: #065f46; font-weight: 600; }
        .custom-select-option.disabled { cursor: default; color: #9ca3af; font-style: italic; }
      `}} />
    </div>
  );
};

export default CustomSelect;
