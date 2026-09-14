import React from 'react';
import Container from '@/components/layout/primitives/Container';

interface FullscreenCTAContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function FullscreenCTAContainer({ children, className = '' }: FullscreenCTAContainerProps) {
  return (
    <Container className={className}>
      {children}
    </Container>
  );
}