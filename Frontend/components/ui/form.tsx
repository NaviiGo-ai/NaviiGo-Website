import * as React from 'react';
import { cn } from '@/lib/utils';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  className?: string;
}

const Form = ({ className, ...props }: FormProps) => {
  return (
    <form
      className={cn('space-y-6', className)}
      {...props}
    >
      {props.children}
    </form>
  );
};

export default Form;