import React from 'react';
import Container from '@/components/layout/primitives/Container';

interface NumbersTrustContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function NumbersTrustContainer({ children, className = '' }: NumbersTrustContainerProps) {
  return (
    <Container className={className}>
      {children}
    </Container>
  );
}