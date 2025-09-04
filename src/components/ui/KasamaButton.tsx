import React from 'react';
import { cn } from '../../lib/utils';

interface KasamaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'soft' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const KasamaButton: React.FC<KasamaButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-kasama-gradient text-white hover:shadow-lg transform hover:scale-[1.02] focus:ring-kasama-purple',
    secondary: 'bg-kasama-rose text-white hover:bg-kasama-rose/90 focus:ring-kasama-rose',
    soft: 'bg-kasama-peach text-kasama-plum hover:bg-kasama-peach/80 focus:ring-kasama-peach',
    ghost: 'text-kasama-purple hover:bg-kasama-purple/10 focus:ring-kasama-purple'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none';

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        disabledStyles,
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
