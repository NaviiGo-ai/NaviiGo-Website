import React from 'react';
import Container from '@/components/layout/primitives/Container';

interface OversizedFooterContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function OversizedFooterContainer({ children, className = '' }: OversizedFooterContainerProps) {
  return (
    <Container className={className}>
      {children}
    </Container>
  );
}