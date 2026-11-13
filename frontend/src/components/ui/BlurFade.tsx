import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { cn } from '../../lib/utils';

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
}

export const BlurFade: React.FC<BlurFadeProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 600,
  yOffset = 16,
}) => {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elRef.current) return;
    animate(elRef.current, {
      translateY: [yOffset, 0],
      opacity: [0, 1],
      filter: ['blur(8px)', 'blur(0px)'],
      ease: 'outCubic',
      duration,
      delay,
    });
  }, [delay, duration, yOffset]);

  return (
    <div ref={elRef} className={cn('opacity-0', className)}>
      {children}
    </div>
  );
};
