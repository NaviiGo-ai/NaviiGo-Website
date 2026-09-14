import React from 'react';

interface AsymmetricOverlayProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AsymmetricOverlay allows its child to break out of the container's horizontal constraints.
 * By default, it removes horizontal padding and lets the child take full width.
 * For more complex breakout (e.g., to the viewport edges), additional styling can be applied via className.
 */
export default function AsymmetricOverlay({ children, className = '' }: AsymmetricOverlayProps) {
  return (
    <div className={`block w-full ${className}`}>
      {children}
    </div>
  );
}