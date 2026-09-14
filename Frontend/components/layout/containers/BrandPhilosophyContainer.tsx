import React from 'react';
import Container from '@/components/layout/primitives/Container';

interface BrandPhilosophyContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function BrandPhilosophyContainer({ children, className = '' }: BrandPhilosophyContainerProps) {
  return (
    <Container className={className}>
      {children}
    </Container>
  );
}