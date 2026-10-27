import React from 'react';

interface XamkLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Pure SVG vector of the official Xamk geometric 'X' mark.
 * Scalable to any resolution without raster blurring.
 */
export const XamkGeometricMark: React.FC<XamkLogoProps> = ({
  className = 'w-8 h-8',
  size = 32,
  color = '#fbba18',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none flex-shrink-0 ${className}`}
      aria-label="Xamk X"
    >
      {/* Top Left Bracket */}
      <path
        d="M16 16 H44 L30 38 H16 Z"
        fill={color}
      />
      <path
        d="M16 16 V44 L38 30 V16 Z"
        fill={color}
      />
      
      {/* Top Right Bracket */}
      <path
        d="M84 16 H56 L70 38 H84 Z"
        fill={color}
      />
      <path
        d="M84 16 V44 L62 30 V16 Z"
        fill={color}
      />
      
      {/* Bottom Left Bracket */}
      <path
        d="M16 84 H44 L30 62 H16 Z"
        fill={color}
      />
      <path
        d="M16 84 V56 L38 70 V84 Z"
        fill={color}
      />
      
      {/* Bottom Right Bracket */}
      <path
        d="M84 84 H56 L70 62 H84 Z"
        fill={color}
      />
      <path
        d="M84 84 V56 L62 70 V84 Z"
        fill={color}
      />

      {/* Central X crossing diamond / lines */}
      <polygon
        points="38,38 62,38 50,50"
        fill={color}
        opacity="0.9"
      />
      <polygon
        points="38,62 62,62 50,50"
        fill={color}
        opacity="0.9"
      />
      <polygon
        points="38,38 38,62 50,50"
        fill={color}
        opacity="0.75"
      />
      <polygon
        points="62,38 62,62 50,50"
        fill={color}
        opacity="0.75"
      />
    </svg>
  );
};

/**
 * Brand header lockup: Gold geometric X logo + "PELIHUONEVARAUS" + "XAMK GAME ROOM".
 */
export const XamkBrandHeader: React.FC<{
  title?: string;
  subtitle?: string;
  onClick?: () => void;
}> = ({
  title = 'PELIHUONEVARAUS',
  subtitle = 'XAMK GAME ROOM',
  onClick,
}) => {
  return (
    <div
      className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center p-1.5 rounded-lg bg-[#14161f] border border-[#292d39] group-hover:border-[#fbba18]/60 transition-colors shadow-sm">
        <XamkGeometricMark className="w-7 h-7 sm:w-8 sm:h-8" size={32} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-white font-black tracking-wider text-sm sm:text-base md:text-lg uppercase drop-shadow-sm font-sans">
          {title}
        </span>
        <span className="text-[#fbba18] text-[9px] sm:text-[10px] md:text-[11px] font-extrabold tracking-widest uppercase">
          {subtitle}
        </span>
      </div>
    </div>
  );
};
