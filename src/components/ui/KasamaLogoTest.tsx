import React from 'react';
import { KasamaLogo } from './KasamaLogo';
import { KasamaIcon } from './KasamaIcon';

export const KasamaLogoTest: React.FC = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Updated Kasama Logo</h1>
          <p className="text-gray-600">Based on the reference image with flowing S-curve flame</p>
        </div>

        {/* Full Logo Tests */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">Full Logo with Text</h2>
          
          <div className="space-y-6">
            {/* Different sizes */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Large (300px wide)</p>
              <KasamaLogo width={300} />
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-2">Medium (200px wide)</p>
              <KasamaLogo width={200} />
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-2">Small (150px wide)</p>
              <KasamaLogo width={150} />
            </div>
          </div>
        </div>

        {/* Different Backgrounds */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-700 text-lg font-semibold mb-4">On Light Background</h3>
            <KasamaLogo width={200} />
          </div>
          
          <div className="bg-gray-100 p-6 rounded-lg">
            <h3 className="text-gray-700 text-lg font-semibold mb-4">On Gray Background</h3>
            <KasamaLogo width={200} />
          </div>
        </div>

        {/* Icon Tests */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">Icon-Only Flame</h2>
          
          <div className="flex items-end space-x-8">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">96px</p>
              <KasamaIcon size={96} />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">64px</p>
              <KasamaIcon size={64} />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">40px</p>
              <KasamaIcon size={40} />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">24px</p>
              <KasamaIcon size={24} />
            </div>
          </div>
        </div>

        {/* Reference comparison note */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-blue-800 font-semibold mb-2">Design Notes</h3>
          <p className="text-blue-700 text-sm">
            This version attempts to recreate the flowing S-curve flame from your reference image. 
            The flame should have a smooth, elegant curve that flows from coral/salmon at the top 
            to deep purple at the bottom, creating a sophisticated gradient effect.
          </p>
        </div>

      </div>
    </div>
  );
};
