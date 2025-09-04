import React from 'react';

interface KasamaIconProps {
  size?: number;
  className?: string;
  alt?: string;
}

export const KasamaIcon: React.FC<KasamaIconProps> = ({ 
  size = 40,
  className = '',
  alt = 'Kasama Icon'
}) => {
  return (
    <div 
      className={className}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <img
        src="/kasama-logo.png"
        alt={alt}
        style={{
          height: `${size * 1.5}px`, // Scale up to crop just the flame portion
          width: 'auto',
          objectFit: 'cover',
          objectPosition: 'top center' // Focus on the flame at the top
        }}
      />
    </div>
  );
};
