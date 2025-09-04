import React from 'react';
import { KasamaLogo } from './KasamaLogo';
import { KasamaIcon } from './KasamaIcon';
import { 
  KasamaLogoDesktop, 
  KasamaLogoMobile, 
  KasamaLogoSplash,
  KasamaIconLarge,
  KasamaIconMedium,
  KasamaIconSmall,
  KasamaFavicon
} from './KasamaLogoExports';

export const KasamaLogoDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Kasama Brand Logo</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional flowing flame design representing warmth, empowerment, and sophisticated AI assistance.
          </p>
        </div>

        {/* Full Logo Variations */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Full Logo with Text</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Color Variant */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Color Version (Default)</h3>
              <div className="flex flex-col space-y-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Desktop Header (200×60)</p>
                  <KasamaLogoDesktop />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Mobile Header (150×45)</p>
                  <KasamaLogoMobile />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Custom Size (250×75)</p>
                  <KasamaLogo width={250} height={75} />
                </div>
              </div>
            </div>

            {/* Other Variants */}
            <div className="space-y-4">
              {/* White on Dark */}
              <div className="bg-gray-900 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">White on Dark Background</h3>
                <KasamaLogo width={200} height={60} variant="white" />
              </div>
              
              {/* Purple Variant */}
              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Kasama Purple Monochrome</h3>
                <KasamaLogo width={200} height={60} variant="kasama-purple" />
              </div>
              
              {/* Gray Variant */}
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Gray for Subtle Usage</h3>
                <KasamaLogo width={200} height={60} variant="gray" />
              </div>
            </div>
          </div>
        </section>

        {/* Icon-Only Variations */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Icon-Only Flame</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Large Color Icon */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-md font-semibold text-gray-700 mb-4">Large (192px)</h3>
              <div className="flex justify-center mb-2">
                <KasamaIconLarge />
              </div>
              <p className="text-xs text-gray-500">App icons, marketing</p>
            </div>

            {/* Medium Icons */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-md font-semibold text-gray-700 mb-4">Medium (96px)</h3>
              <div className="flex justify-center mb-2">
                <KasamaIconMedium />
              </div>
              <p className="text-xs text-gray-500">Thumbnails, cards</p>
            </div>

            {/* Small Icons */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-md font-semibold text-gray-700 mb-4">Small (40px)</h3>
              <div className="flex justify-center mb-2">
                <KasamaIconSmall />
              </div>
              <p className="text-xs text-gray-500">Navigation, buttons</p>
            </div>

            {/* Favicon */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-md font-semibold text-gray-700 mb-4">Favicon (32px)</h3>
              <div className="flex justify-center mb-2">
                <KasamaFavicon size={32} />
              </div>
              <p className="text-xs text-gray-500">Browser tabs</p>
            </div>
          </div>
        </section>

        {/* Color Variants Grid */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Icon Color Variations</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-md font-semibold text-gray-700 mb-4">Full Color</h3>
              <div className="flex justify-center">
                <KasamaIcon size={64} variant="color" />
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg text-center">
              <h3 className="text-md font-semibold text-white mb-4">White</h3>
              <div className="flex justify-center">
                <KasamaIcon size={64} variant="white" />
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-lg text-center">
              <h3 className="text-md font-semibold text-gray-700 mb-4">Kasama Purple</h3>
              <div className="flex justify-center">
                <KasamaIcon size={64} variant="kasama-purple" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-md font-semibent text-gray-700 mb-4">Gray</h3>
              <div className="flex justify-center">
                <KasamaIcon size={64} variant="gray" />
              </div>
            </div>
          </div>
        </section>

        {/* Usage Guidelines */}
        <section className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-3">✓ DO</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Use SVG format for scalability</li>
                <li>• Maintain 10:3 aspect ratio for full logo</li>
                <li>• Use appropriate color variants for backgrounds</li>
                <li>• Ensure sufficient clear space around logo</li>
                <li>• Use icon-only version when space is limited</li>
                <li>• Maintain minimum sizes (120px width for full logo)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-red-700 mb-3">✗ DON'T</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Distort or stretch the logo</li>
                <li>• Add effects like shadows or outlines</li>
                <li>• Change colors outside provided variants</li>
                <li>• Place on busy or low-contrast backgrounds</li>
                <li>• Rotate or skew the logo</li>
                <li>• Separate flame from text in full logo</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Implementation Examples */}
        <section className="bg-gray-50 p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Code Implementation</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <div className="space-y-2">
              <div>// Full logo with default color</div>
              <div>&lt;KasamaLogo width={200} height={60} /&gt;</div>
              <div></div>
              <div>// Icon with white variant for dark background</div>
              <div>&lt;KasamaIcon size={40} variant="white" /&gt;</div>
              <div></div>
              <div>// Pre-defined components</div>
              <div>&lt;KasamaLogoDesktop /&gt;</div>
              <div>&lt;KasamaIconMedium variant="kasama-purple" /&gt;</div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
