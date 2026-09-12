import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const selectVariants = cva(
  'flex h-10 w-full rounded-md border border-bg bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        outlined: 'border-input bg-background',
        filled: 'border-input bg-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    }
  }
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, VariantProps<typeof selectVariants> {
  className?: string;
}

const Select = React.forwardRef<
  HTMLSelectElement,
  SelectProps
>(({ className, variant, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(selectVariants({ variant, className }), className)}
      {...props}
    >
    </select>
  );
});

Select.displayName = 'Select';

export { Select, selectVariants };