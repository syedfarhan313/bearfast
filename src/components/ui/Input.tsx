import React from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || props.name || Math.random().toString(36).substr(2, 9);
  return (
    <div className="w-full">
      {label &&
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-700 mb-1">

          {label}
        </label>
      }
      <div className="relative">
        {leftIcon &&
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        }
        <input
          id={inputId}
          className={`
            w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-slate-900 placeholder-slate-400
            focus:border-orange-500 focus:ring-0 focus:outline-none transition-colors duration-200
            disabled:bg-slate-50 disabled:text-slate-500
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          {...props} />

        {rightIcon &&
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            {rightIcon}
          </div>
        }
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>);

}