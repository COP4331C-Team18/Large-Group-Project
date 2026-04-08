import React from 'react';
import type { ThemeId, ThemeOption } from '@/config/theme';
 
interface ThemeCardProps {
  theme:    ThemeOption;
  selected: boolean;
  onSelect: (id: ThemeId) => void;
}
 
const ThemeCard: React.FC<ThemeCardProps> = ({ theme, selected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(theme.id)}
      className={`
        group w-full text-left rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer
        ${selected
          ? 'border-primary bg-base-200 shadow-md'
          : 'border-base-300 bg-base-100 hover:border-primary/50 hover:shadow-sm'
        }
      `}
      aria-pressed={selected}
    >
      {/* Swatch row */}
      <div className="flex gap-1.5 mb-3">
        {Object.values(theme.swatch).map((color, i) => (
          <span
            key={i}
            className="h-7 flex-1 rounded-md shadow-inner"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
 
      {/* Labels + checkmark */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-sans font-semibold text-base-content text-sm">
            {theme.label}
          </p>
        </div>
 
        <span
          className={`
            flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200
            ${selected ? 'bg-primary border-primary' : 'border-base-300 bg-base-100'}
          `}
        >
          {selected && (
            <svg className="w-3 h-3 text-primary-content" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </div>
    </button>
  );
};
 
export default ThemeCard;