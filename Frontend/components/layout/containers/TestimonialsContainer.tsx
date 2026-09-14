import React from 'react';
import Container from '@/components/layout/primitives/Container';

interface TestimonialsContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function TestimonialsContainer({ children, className = '' }: TestimonialsContainerProps) {
  return (
    <Container className={className}>
      {children}
    </Container>
  );
}