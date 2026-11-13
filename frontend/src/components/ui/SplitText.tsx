import React, { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { cn } from '../../lib/utils';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 40,
  duration = 800,
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const letters = containerRef.current.querySelectorAll('.letter');
    if (letters.length > 0) {
      animate(letters, {
        translateY: ['1.2em', '0em'],
        opacity: [0, 1],
        ease: 'outExpo',
        duration,
        delay: stagger(delay, { start: 100 }),
      });
    }
  }, [text, delay, duration]);

  const words = text.split(' ');

  return (
    <span ref={containerRef} className={cn('inline-block overflow-hidden', className)}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap mr-[0.25em]">
          {word.split('').map((char, charIndex) => (
            <span key={charIndex} className="letter inline-block">
              {char}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
};
