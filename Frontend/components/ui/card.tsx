import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-border',
        primary: 'border-saffron bg-saffron/5',
        secondary: 'border-indigo bg-indigo/5',
        accent: 'border-marigold bg-marigold/5',
        elevated: 'shadow-md',
        outlined: 'border-border bg-background',
      },
    },
    defaultVariants: {
      variant: 'default',
    }
  }
);

interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  className?: string;
}

const Card = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, variant, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }), className)}
      {...props}
    >
      {props.children}
    </div>
  );
});

Card.displayName = 'Card';

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

const CardHeader = ({ className, ...props }: CardHeaderProps) => {
  return (
    <div
      className={cn('flex flex-col space-y-2 text-start pt-6', className)}
      {...props}
    >
      {props.children}
    </div>
  );
};

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

const CardContent = ({ className, ...props }: CardContentProps) => {
  return (
    <div
      className={cn('flex flex-col space-y-4 pb-6 pt-0', className)}
      {...props}
    >
      {props.children}
    </div>
  );
};

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

const CardFooter = ({ className, ...props }: CardFooterProps) => {
  return (
    <div
      className={cn('flex flex-col space-y-2 text-start pt-0 pb-6', className)}
      {...props}
    >
      {props.children}
    </div>
  );
};

export { Card, CardHeader, CardContent, CardFooter, cardVariants };