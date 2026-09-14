import React from 'react';
import Container from '@/components/layout/primitives/Container';

interface DestinationDiscoveryContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function DestinationDiscoveryContainer({ children, className = '' }: DestinationDiscoveryContainerProps) {
  return (
    <Container className={className}>
      {children}
    </Container>
  );
}