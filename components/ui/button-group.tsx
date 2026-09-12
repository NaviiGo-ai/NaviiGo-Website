import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonGroupProps {
  className?: string;
  children: React.ReactNode;
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  vertical?: boolean;
}

const ButtonGroup = ({
  className,
  children,
  justify = 'center',
  vertical = false,
}: ButtonGroupProps) => {
  return (
    <div
      className={cn(
        'inline-flex items-center',
        vertical && 'flex-col',
        !vertical && 'justify-justify',
        justify === 'start' && 'justify-start',
        justify === 'end' && 'justify-end',
        justify === 'between' && 'justify-between',
        justify === 'around' && 'justify-around',
        className
      )}
    >
      {children}
    </div>
  );
};

export default ButtonGroup;