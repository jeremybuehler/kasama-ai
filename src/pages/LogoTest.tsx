import React from 'react';
import { KasamaLogo, KasamaIcon } from '../components/ui/KasamaLogo';

/**
 * LogoTest page to verify the Kasama logo displays correctly
 * on a clean white background at various sizes
 */
const LogoTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            Kasama Logo Display Test
          </h1>
          <p className="text-gray-600 text-center mt-2">
            Verifying the actual Kasama logo displays correctly on white background
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        
        {/* Full Logo Sizes */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Full Logo at Different Sizes
          </h2>
          
          <div className="space-y-12">
            {/* Large Logo */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">Large (300px width)</p>
              <div className="flex justify-center">
                <KasamaLogo width={300} className="drop-shadow-sm" />
              </div>
            </div>
            
            {/* Medium Logo */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">Medium (200px width)</p>
              <div className="flex justify-center">
                <KasamaLogo width={200} className="drop-shadow-sm" />
              </div>
            </div>
            
            {/* Small Logo */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">Small (150px width)</p>
              <div className="flex justify-center">
                <KasamaLogo width={150} className="drop-shadow-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Icon Sizes */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Icon Sizes
          </h2>
          
          <div className="flex justify-center items-end space-x-8">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">64px</p>
              <KasamaIcon size={64} />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">48px</p>
              <KasamaIcon size={48} />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">32px</p>
              <KasamaIcon size={32} />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">24px</p>
              <KasamaIcon size={24} />
            </div>
          </div>
        </section>

        {/* Background Tests */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Logo on Different Backgrounds
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* White Background */}
            <div className="bg-white border border-gray-200 p-8 rounded-lg text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-4">White Background</h3>
              <KasamaLogo width={150} />
            </div>
            
            {/* Light Gray Background */}
            <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Light Gray Background</h3>
              <KasamaLogo width={150} />
            </div>
            
            {/* Very Light Background */}
            <div className="bg-gray-100 border border-gray-200 p-8 rounded-lg text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Very Light Background</h3>
              <KasamaLogo width={150} />
            </div>
          </div>
        </section>

        {/* Header Example */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Header Usage Example
          </h2>
          
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between px-6 py-4">
              <KasamaLogo width={120} />
              <nav className="flex space-x-6">
                <a href="#" className="text-gray-600 hover:text-gray-900">Dashboard</a>
                <a href="#" className="text-gray-600 hover:text-gray-900">Profile</a>
                <a href="#" className="text-gray-600 hover:text-gray-900">Settings</a>
              </nav>
            </div>
          </div>
        </section>

        {/* Hero Section Example */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Hero Section Example
          </h2>
          
          <div className="bg-white text-center py-16">
            <KasamaLogo width={250} className="mx-auto mb-8" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Kasama
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your empowering AI companion for stronger, healthier relationships
            </p>
          </div>
        </section>

      </div>
      
      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-500">
            Logo test completed. The actual Kasama logo should be visible above.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Navigate back to: <a href="/dashboard" className="text-blue-600 hover:underline">/dashboard</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogoTest;
