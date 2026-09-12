interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

const CardHeader = ({ className, ...props }: CardHeaderProps) => {
  return (
    <div
      className={`flex flex-col space-y-2 text-start pt-6 ${className}`}
      {...props}
    >
      {props.children}
    </div>
  );
};

export default CardHeader;