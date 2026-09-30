import React from 'react';
import { formatRupee, parseRupeeToNumber } from '../../lib/formatters';

export interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  value: number | string;
  onChange: (value: number) => void;
  error?: string;
  helperText?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  className = '',
  id,
  placeholder = '0.00',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const numValue = typeof value === 'number' ? value : parseRupeeToNumber(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const parsed = parseRupeeToNumber(val);
    onChange(parsed);
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider">
            {label}
            {props.required && <span className="text-[#9B1C31] ml-1">*</span>}
          </label>
          {numValue > 0 && (
            <span className="text-xs font-semibold text-[#9B1C31] tabular-nums">
              {formatRupee(numValue)}
            </span>
          )}
        </div>
      )}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-[#9B1C31] font-bold text-sm">
          ₹
        </div>
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          value={value === 0 || value === '0' ? '' : value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full bg-white border text-[#2B2B2B] text-base font-medium rounded-xl transition duration-150 min-h-[44px] pl-9 pr-3.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#9B1C31]/20 focus:border-[#9B1C31] placeholder:text-[#AFA190] ${
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-[#E8DFD5] hover:border-[#CCA462]'
          } ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-[#8C857E]">{helperText}</p>
      ) : null}
    </div>
  );
};
