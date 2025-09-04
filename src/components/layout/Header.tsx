import React from 'react';
import { KasamaLogo } from '../ui/KasamaLogo';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  showLogo?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ showLogo = true, className = '' }) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-kasama-rose/20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {showLogo && (
            <button
              onClick={handleLogoClick}
              className="flex items-center hover:opacity-80 transition-opacity"
              aria-label="Go to dashboard"
            >
              <KasamaLogo width={120} />
            </button>
          )}
          
          {/* Space for future navigation items */}
          <div className="flex-1" />
          
          {/* Space for future user menu */}
          <div className="flex items-center space-x-4">
            {/* User menu will go here */}
          </div>
        </div>
      </div>
    </header>
  );
};
