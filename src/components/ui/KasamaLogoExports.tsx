import React from 'react';
import { KasamaLogo } from './KasamaLogo';
import { KasamaIcon } from './KasamaIcon';

// Common size presets
export const KASAMA_LOGO_SIZES = {
  // Full logo sizes (10:3 aspect ratio)
  desktopHeader: { width: 200, height: 60 },
  mobileHeader: { width: 150, height: 45 },
  loginSplash: { width: 300, height: 90 },
  emailSignature: { width: 180, height: 54 },
  marketing: { width: 400, height: 120 },
  minimum: { width: 120, height: 36 },
  
  // Icon-only sizes (1:1 aspect ratio)
  largeIcon: 512,
  mediumIcon: 192,
  smallIcon: 96,
  navigationIcon: 40,
  minimumIcon: 24,
  favicon: 32,
  faviconSmall: 16,
} as const;

// Logo variants with preset sizes
export const KasamaLogoDesktop: React.FC<{ className?: string }> = ({ className }) => (
  <KasamaLogo width={200} className={className} />
);

export const KasamaLogoMobile: React.FC<{ className?: string }> = ({ className }) => (
  <KasamaLogo width={150} className={className} />
);

export const KasamaLogoSplash: React.FC<{ className?: string }> = ({ className }) => (
  <KasamaLogo width={300} className={className} />
);

// Icon variants with preset sizes
export const KasamaIconLarge: React.FC<{ 
  className?: string;
}> = ({ className }) => (
  <KasamaIcon size={192} className={className} />
);

export const KasamaIconMedium: React.FC<{ 
  className?: string;
}> = ({ className }) => (
  <KasamaIcon size={96} className={className} />
);

export const KasamaIconSmall: React.FC<{ 
  className?: string;
}> = ({ className }) => (
  <KasamaIcon size={40} className={className} />
);

export const KasamaFavicon: React.FC<{ 
  size?: 16 | 32;
}> = ({ size = 32 }) => (
  <KasamaIcon size={size} />
);

// Example usage component showing all variations
export const KasamaLogoShowcase: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-gray-50">
      <div>
        <h2 className="text-2xl font-bold mb-4">Full Logo Variations</h2>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-600 mb-2">Desktop Header (200x60)</p>
            <KasamaLogoDesktop />
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-600 mb-2">Mobile Header (150x45)</p>
            <KasamaLogoMobile />
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-600 mb-2">Login/Splash (300x90)</p>
            <KasamaLogoSplash />
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Icon Variations</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-sm text-gray-600 mb-2">Large Color</p>
            <KasamaIconLarge />
          </div>
          <div className="bg-gray-800 p-4 rounded shadow text-center">
            <p className="text-sm text-gray-300 mb-2">Large White</p>
            <KasamaIconLarge variant="white" />
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-sm text-gray-600 mb-2">Medium Purple</p>
            <KasamaIconMedium variant="kasama-purple" />
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-sm text-gray-600 mb-2">Small Gray</p>
            <KasamaIconSmall variant="gray" />
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Favicon Sizes</h2>
        <div className="flex gap-4 items-end">
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-sm text-gray-600 mb-2">32x32</p>
            <KasamaFavicon size={32} />
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-sm text-gray-600 mb-2">16x16</p>
            <KasamaFavicon size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};
