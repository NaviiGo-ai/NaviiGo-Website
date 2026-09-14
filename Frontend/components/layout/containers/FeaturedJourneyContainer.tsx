import React from 'react';
import Container from '@/components/layout/primitives/Container';

interface FeaturedJourneyContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function FeaturedJourneyContainer({ children, className = '' }: FeaturedJourneyContainerProps) {
  return (
    <Container className={className}>
      {children}
    </Container>
  );
}