import React from 'react';
import Container from '@/components/layout/primitives/Container';

interface ImmersiveStoryContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function ImmersiveStoryContainer({ children, className = '' }: ImmersiveStoryContainerProps) {
  return (
    <Container className={className}>
      {children}
    </Container>
  );
}