import React from 'react';
import { cn } from '../../lib/utils';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 4,
  className = '',
}) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={cn(
        'inline-block bg-clip-text text-transparent',
        !disabled && 'animate-shine bg-[linear-gradient(110deg,#4f46e5,45%,#c084fc,55%,#4f46e5)] bg-[length:250%_100%]',
        className
      )}
      style={{
        animationDuration,
      }}
    >
      {text}
    </span>
  );
};
