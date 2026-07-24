import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface EditableSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  options: (string | { value: string; label: string })[];
  placeholder?: string;
}

export function EditableSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  disabled = false,
  ...props
}: EditableSelectProps) {
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Determine if the current value is a custom value (i.e. not in the option list)
  const isValueInOptions = normalizedOptions.some(opt => opt.value === value) || value === "";
  
  const [isCustom, setIsCustom] = useState(!isValueInOptions);
  const [customValue, setCustomValue] = useState(isCustom ? value : "");

  // Sync state if value changes from parent
  useEffect(() => {
    const inOptions = normalizedOptions.some(opt => opt.value === value) || value === "";
    if (!inOptions) {
      setIsCustom(true);
      setCustomValue(value);
    } else if (value !== "__ADD_CUSTOM__") {
      setIsCustom(false);
    }
  }, [value, options]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__ADD_CUSTOM__") {
      setIsCustom(true);
      onChange(customValue);
    } else {
      setIsCustom(false);
      onChange(val);
    }
  };

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomValue(val);
    onChange(val);
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="relative">
        <select
          value={isCustom ? "__ADD_CUSTOM__" : value}
          onChange={handleSelectChange}
          disabled={disabled}
          className={`${className} pr-8`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {normalizedOptions.map((opt, idx) => (
            <option key={idx} value={opt.value}>
              {opt.label}
            </option>
          ))}
          <option value="__ADD_CUSTOM__" className="text-emerald-600 font-bold">
            ✨ + Add Custom Value...
          </option>
        </select>
      </div>

      {isCustom && (
        <div className="flex items-center gap-1.5 animate-fadeIn">
          <input
            type="text"
            value={customValue}
            onChange={handleCustomValueChange}
            placeholder="Type custom value..."
            className="flex-1 bg-white border border-[#5f6f52]/40 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#5f6f52] transition-colors shadow-2xs"
            autoFocus
          />
          <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-150 px-2 py-1 rounded-lg font-bold flex items-center gap-0.5 shrink-0">
            <Check className="w-3 h-3" /> Custom
          </span>
        </div>
      )}
    </div>
  );
}
