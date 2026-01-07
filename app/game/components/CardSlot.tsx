'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardSlotProps {
  children?: ReactNode;
  label?: string;
  isEmpty?: boolean;
  highlighted?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-16 h-22',
  md: 'w-24 h-33',
  lg: 'w-32 h-44',
};

/**
 * A slot that holds a card with optional label
 */
export function CardSlot({
  children,
  label,
  isEmpty = false,
  highlighted = false,
  className,
  size = 'md',
}: CardSlotProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Slot container */}
      <div
        className={cn(
          sizeClasses[size],
          'rounded-lg transition-all',
          isEmpty
            ? 'border-2 border-dashed border-gray-300 bg-gray-50/50'
            : 'border-2 border-transparent',
          highlighted && 'ring-2 ring-yellow-400 ring-offset-2'
        )}
      >
        {children}
        {isEmpty && !children && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-400 text-xs">{label || 'Empty'}</span>
          </div>
        )}
      </div>

      {/* Label below slot */}
      {label && !isEmpty && (
        <div className="text-center mt-1">
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      )}
    </div>
  );
}

/**
 * A zone label for game areas
 */
interface ZoneLabelProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'active' | 'opponent';
}

export function ZoneLabel({
  children,
  className,
  variant = 'default',
}: ZoneLabelProps) {
  return (
    <div
      className={cn(
        'px-2 py-1 rounded text-xs font-medium uppercase tracking-wide',
        variant === 'default' && 'bg-gray-200 text-gray-700',
        variant === 'active' && 'bg-blue-100 text-blue-700',
        variant === 'opponent' && 'bg-red-100 text-red-700',
        className
      )}
    >
      {children}
    </div>
  );
}
