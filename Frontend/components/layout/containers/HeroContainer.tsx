import React from 'react';
import FullBleed from '@/components/layout/primitives/FullBleed';
import Container from '@/components/layout/primitives/Container';

interface HeroContainerProps {
  children: React.ReactNode;
  className?: string;
  backgroundType?: 'image' | 'video' | 'gradient';
}

export default function HeroContainer({ children, className = '', backgroundType = 'image' }: HeroContainerProps) {
  // Background type classes could be added here if needed
  return (
    <FullBleed className={className}>
      <Container className={className}>
        {children}
      </Container>
    </FullBleed>
  );
}