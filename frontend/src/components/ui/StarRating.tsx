import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingDisplayProps {
  rating: number;
  count?: number;
  size?: 'xs' | 'sm' | 'md';
  showNumeric?: boolean;
}

export const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating,
  count,
  size = 'xs',
  showNumeric = true,
}) => {
  const iconClass =
    size === 'md'
      ? 'h-4 w-4'
      : size === 'sm'
      ? 'h-3.5 w-3.5'
      : 'h-3 w-3';

  return (
    <div className="inline-flex items-center gap-1 select-none">
      <div className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFull = rating >= starIndex;
          const isHalf = !isFull && rating >= starIndex - 0.5;
          return (
            <span key={starIndex} className="relative inline-block">
              {/* Empty background star */}
              <Star className={`${iconClass} text-[#D8D1C0] stroke-[1.8]`} />
              {/* Full or half filled overlay star */}
              {(isFull || isHalf) && (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: isFull ? '100%' : '50%' }}
                >
                  <Star
                    className={`${iconClass} fill-[#D6B875] text-[#D6B875] stroke-[1.8]`}
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showNumeric && (
        <span className="text-[11.5px] font-semibold text-[#171717] tabular-nums ml-0.5">
          {rating.toFixed(1)}
        </span>
      )}
      {typeof count === 'number' && (
        <span className="text-[11px] text-[#7A7872] tabular-nums">
          ({count})
        </span>
      )}
    </div>
  );
};

interface InteractiveStarRatingProps {
  value: number;
  onChange: (rating: number) => void;
}

const RATING_OPTIONS = [3.0, 3.5, 4.0, 4.5, 5.0];

export const InteractiveStarRating: React.FC<InteractiveStarRatingProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 mr-1">
        <StarRatingDisplay rating={value} size="md" showNumeric={false} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {RATING_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
              value === opt
                ? 'bg-[#171717] text-[#D6B875] shadow-2xs'
                : 'border border-[#E4DEC8] bg-white text-[#686359] hover:border-[#171717] hover:text-[#171717]'
            }`}
          >
            {opt.toFixed(1)} ★
          </button>
        ))}
      </div>
    </div>
  );
};
