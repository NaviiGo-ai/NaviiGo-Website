import React from 'react';

interface PaperLayerProps {
  children: React.ReactNode;
  className?: string;
  tone?: 'light' | 'medium' | 'dark' | 'none';
}

const PaperLayer = React.forwardRef<HTMLDivElement, PaperLayerProps>(({
  children,
  className = '',
  tone = 'light',
}, ref) => {
  // Tonal layering instead of shadows or blur.
  // `none` is for overlaying photography — an opaque surface would hide the image.
  const toneClasses = {
    light: 'bg-warm-ivory text-deep-charcoal',
    medium: 'bg-[#F9F4EB] text-deep-charcoal',
    dark: 'bg-[#EAE4DA] text-deep-charcoal',
    none: '',
  };

  return (
    <div
      ref={ref}
      className={`
        ${toneClasses[tone]}
        relative
        rounded-none
        overflow-hidden
        ${className}
      `}
    >
      {children}
    </div>
  );
});

PaperLayer.displayName = 'PaperLayer';

export default PaperLayer;