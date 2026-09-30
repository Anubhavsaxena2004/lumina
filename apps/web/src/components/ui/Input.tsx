import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftAddon, rightAddon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider mb-1.5">
            {label}
            {props.required && <span className="text-[#9B1C31] ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[#8C857E]">
              {leftAddon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-white border text-[#2B2B2B] text-sm rounded-xl transition duration-150 min-h-[44px] px-3.5 focus:outline-none focus:ring-2 focus:ring-[#9B1C31]/20 focus:border-[#9B1C31] placeholder:text-[#AFA190] ${
              leftAddon ? 'pl-9' : ''
            } ${rightAddon ? 'pr-9' : ''} ${
              error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-[#E8DFD5] hover:border-[#CCA462]'
            } ${className}`}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-[#8C857E]">
              {rightAddon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#8C857E]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
