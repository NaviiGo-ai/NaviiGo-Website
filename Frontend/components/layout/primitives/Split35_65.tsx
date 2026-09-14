import React from 'react';

interface Split35_65Props {
  left: React.ReactNode;
  right: React.ReactNode;
  reverse?: boolean;
  className?: string;
}

export default function Split35_65({ left, right, reverse = false, className = '' }: Split35_65Props) {
  return (
    <div className={`flex flex-col md:flex-row gap-6 items-start ${className}`}>
      <div className={reverse ? "md:w-[65%]" : "md:w-[35%]"}>{left}</div>
      <div className={reverse ? "md:w-[35%]" : "md:w-[65%]"}>{right}</div>
    </div>
  );
}