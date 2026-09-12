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

export default CardFooter;