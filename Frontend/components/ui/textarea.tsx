import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
  'flex min-h-[3rem] w-full rounded-md border border-bg bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
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

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, VariantProps<typeof textareaVariants> {
  className?: string;
}

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(({ className, variant, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(textareaVariants({ variant, className }), className)}
      {...props}
    >
    </textarea>
  );
});

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };