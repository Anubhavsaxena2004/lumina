import React from 'react';
import { formatWeightKg, parseWeightToNumber } from '../../lib/formatters';

export interface WeightInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  value: number | string;
  onChange: (value: number) => void;
  error?: string;
  helperText?: string;
}

export const WeightInput: React.FC<WeightInputProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  className = '',
  id,
  placeholder = '0.000',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const numValue = typeof value === 'number' ? value : parseWeightToNumber(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const parsed = parseWeightToNumber(val);
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
            <span className="text-xs font-semibold text-[#B8893B] tabular-nums">
              {formatWeightKg(numValue)}
            </span>
          )}
        </div>
      )}
      <div className="relative flex items-center">
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          value={value === 0 || value === '0' ? '' : value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full bg-white border text-[#2B2B2B] text-base font-medium rounded-xl transition duration-150 min-h-[44px] pl-3.5 pr-12 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#B8893B]/20 focus:border-[#B8893B] placeholder:text-[#AFA190] ${
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-[#E8DFD5] hover:border-[#CCA462]'
          } ${className}`}
          {...props}
        />
        <div className="absolute right-3.5 flex items-center pointer-events-none text-xs font-bold text-[#B8893B] bg-[#FAF6EF] px-1.5 py-0.5 rounded border border-[#EBD7BA]">
          Kg
        </div>
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-[#8C857E]">{helperText}</p>
      ) : null}
    </div>
  );
};
