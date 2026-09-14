import React from 'react';
import Container from '@/components/layout/primitives/Container';

interface ContactContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function ContactContainer({ children, className = '' }: ContactContainerProps) {
  return (
    <Container className={className}>
      {children}
    </Container>
  );
}