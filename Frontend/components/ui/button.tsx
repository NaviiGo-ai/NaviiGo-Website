import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-saffron text-white hover:bg-saffron/90 focus-visible:ring-saffron/20',
        secondary: 'border border-saffron bg-transparent text-saffron hover:bg-saffron/10 focus-visible:ring-saffron/20',
        outline: 'border border-saffron bg-transparent text-saffron hover:bg-saffron/10 focus-visible:ring-saffron/20',
        destructive: 'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20',
        outline-destructive: 'border border-destructive bg-transparent text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/20',
        secondary: 'border border-border bg-transparent text-foreground hover:bg-accent/10 focus-visible:ring-accent/20',
        ghost: 'hover:bg-accent/10 hover:text-accent focus-visible:ring-accent/20',
        link: 'text-saffron underline-offset-4 hover:underline focus-visible:ring-saffron/20',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    }
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<
  HTMLButtonElement | HTMLElement,
  ButtonProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Component = asChild ? React.Fragment : 'button';
  return (
    <Component
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }), !asChild && className)}
      {...props}
    >
      {asChild ? props.children : null}
    </Component>
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };