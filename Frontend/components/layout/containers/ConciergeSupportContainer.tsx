import React from 'react';
import Container from '@/components/layout/primitives/Container';

interface ConciergeSupportContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function ConciergeSupportContainer({ children, className = '' }: ConciergeSupportContainerProps) {
  return (
    <Container className={className}>
      {children}
    </Container>
  );
}