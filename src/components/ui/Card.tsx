import React from 'react';
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}
export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden
        ${hover ? 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl' : ''}
        ${className}
      `}>

      {children}
    </div>);

}