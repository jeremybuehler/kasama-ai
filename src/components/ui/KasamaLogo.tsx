import React from 'react';

interface KasamaLogoProps {
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
}

/**
 * KasamaLogo component that displays the actual Kasama logo image.
 * The logo features a beautiful flowing flame in gradient colors from coral to purple.
 */
export const KasamaLogo: React.FC<KasamaLogoProps> = ({ 
  width = 200, 
  height,
  className = '',
  alt = 'Kasama AI - Your empowering relationship companion'
}) => {
  return (
    <img
      src="/kasama-logo.png"
      alt={alt}
      width={width}
      height={height}
      className={`${className} object-contain`}
      style={{
        maxWidth: '100%',
        height: height ? `${height}px` : 'auto',
        imageRendering: 'crisp-edges'
      }}
    />
  );
};

/**
 * KasamaIcon component for smaller use cases (navigation, buttons, etc.)
 * Uses the same logo but optimized for icon-sized display
 */
export const KasamaIcon: React.FC<{ 
  size?: number; 
  className?: string;
  alt?: string;
}> = ({ 
  size = 40,
  className = '',
  alt = 'Kasama Icon'
}) => {
  return (
    <img
      src="/kasama-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={`${className} object-contain`}
      style={{
        maxWidth: '100%',
        imageRendering: 'crisp-edges'
      }}
    />
  );
};
