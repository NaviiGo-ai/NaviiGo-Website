import React, { forwardRef } from 'react';

interface FullBleedProps {
  children: React.ReactNode;
  className?: string;
}

const FullBleed = React.forwardRef<HTMLDivElement, FullBleedProps>(({ children, className = '' }, ref) => {
  return (
    <div ref={ref} className={`min-h-screen w-full overflow-hidden ${className}`}>
      {children}
    </div>
  );
});

FullBleed.displayName = 'FullBleed';

export default FullBleed;