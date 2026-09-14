import React from 'react';
import Container from '@/components/layout/primitives/Container';

interface TravelStylesContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function TravelStylesContainer({ children, className = '' }: TravelStylesContainerProps) {
  return (
    <Container className={className}>
      {children}
    </Container>
  );
}