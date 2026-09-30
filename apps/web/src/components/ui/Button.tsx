import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 min-h-[44px]';

  const variants = {
    primary: 'bg-[#9B1C31] text-white hover:bg-[#84192B] focus:ring-[#9B1C31] shadow-soft active:bg-[#6E1926]',
    gold: 'bg-[#B8893B] text-white hover:bg-[#9E712E] focus:ring-[#B8893B] shadow-soft active:bg-[#7E5627]',
    secondary: 'bg-[#F5EFE6] text-[#2B2B2B] hover:bg-[#EBE3D7] focus:ring-[#B8893B] border border-[#E8DFD5]',
    outline: 'border-2 border-[#9B1C31] text-[#9B1C31] hover:bg-[#FDF2F4] focus:ring-[#9B1C31]',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600 shadow-soft',
    ghost: 'text-[#66615C] hover:text-[#2B2B2B] hover:bg-[#F5EFE6]/60 focus:ring-[#B8893B]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-2 gap-1.5 min-h-[40px]',
    md: 'text-sm px-4 py-2.5 gap-2 min-h-[44px]',
    lg: 'text-base px-6 py-3.5 gap-2.5 min-h-[48px] font-semibold',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
    </button>
  );
};
