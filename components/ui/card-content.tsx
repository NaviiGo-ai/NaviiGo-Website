interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

const CardContent = ({ className, ...props }: CardContentProps) => {
  return (
    <div
      className={`flex flex-col space-y-4 pb-6 pt-0 ${className}`}
      {...props}
    >
      {props.children}
    </div>
  );
};

export default CardContent;