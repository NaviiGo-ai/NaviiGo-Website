import React from 'react';
import Container from '@/components/layout/primitives/Container';

interface PrivateCorporateContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PrivateCorporateContainer({ children, className = '' }: PrivateCorporateContainerProps) {
  return (
    <Container className={className}>
      {children}
    </Container>
  );
}