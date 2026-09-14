import React from 'react';
import Container from '@/components/layout/primitives/Container';

interface TravelDesignedContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function TravelDesignedContainer({ children, className = '' }: TravelDesignedContainerProps) {
  return (
    <Container className={className}>
      {children}
    </Container>
  );
}