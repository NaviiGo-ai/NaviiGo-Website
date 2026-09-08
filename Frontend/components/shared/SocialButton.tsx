"use client";

import { Instagram, Link, Linkedin, Twitter } from "lucide-react";
import { motion } from "framer-motion"; // Note: Changed motion/react to framer-motion based on typical Next.js setup
import { useState } from "react";
// Assumes @/components/ui/button is available. Using standard button as fallback.
import { cn } from "@/lib/utils";

// Assuming a simplified Button component if UI button does not exist.
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"


export default function SocialButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const shareButtons = [
    { icon: Twitter, label: "Share on Twitter" },
    { icon: Instagram, label: "Share on Instagram" },
    { icon: Linkedin, label: "Share on LinkedIn" },
    { icon: Link, label: "Copy link" },
  ];

  const handleShare = (index: number) => {
    setActiveIndex(index);
    setTimeout(() => setActiveIndex(null), 300);
  };

  return (
    <div
      className="relative flex flex-col items-end"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <motion.div
        animate={{
          opacity: isVisible ? 0 : 1,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut",
        }}
        className="absolute right-0 top-0"
      >
        <Button
          className={cn(
            "relative w-10 h-[160px] flex-col py-4",
            "bg-white dark:bg-black",
            "hover:bg-gray-50 dark:hover:bg-gray-950",
            "text-black dark:text-white",
            "border border-black/10 dark:border-white/10",
            "transition-colors duration-200 shadow-md",
            className
          )}
          {...props}
        >
          <span className="flex flex-col items-center gap-4">
            <Link className="h-4 w-4" />
            <span className="writing-vertical text-xs font-medium tracking-widest" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>SOCIALS</span>
          </span>
        </Button>
      </motion.div>

      <motion.div
        animate={{
          height: isVisible ? "auto" : 0,
        }}
        className="absolute top-0 right-0 flex flex-col w-10 overflow-hidden rounded-md shadow-lg"
        transition={{
          duration: 0.3,
          ease: [0.23, 1, 0.32, 1],
        }}
      >
        {shareButtons.map((button, i) => (
          <motion.button
            animate={{
              opacity: isVisible ? 1 : 0,
              y: isVisible ? 0 : -20,
            }}
            aria-label={button.label}
            className={cn(
              "h-10",
              "w-10",
              "flex items-center justify-center",
              "bg-black dark:bg-white",
              "text-white dark:text-black",
              i === 0 && "rounded-t-md",
              i === 3 && "rounded-b-md",
              "border-white/10 border-b last:border-b-0 dark:border-black/10",
              "hover:bg-gray-900 dark:hover:bg-gray-100",
              "outline-none",
              "relative overflow-hidden",
              "transition-colors duration-200"
            )}
            key={`share-${button.label}`}
            onClick={() => handleShare(i)}
            transition={{
              duration: 0.3,
              ease: [0.23, 1, 0.32, 1],
              delay: isVisible ? i * 0.05 : 0,
            }}
            type="button"
          >
            <motion.div
              animate={{
                scale: activeIndex === i ? 0.85 : 1,
              }}
              className="relative z-10"
              transition={{
                duration: 0.2,
                ease: "easeInOut",
              }}
            >
              <button.icon className="h-4 w-4" />
            </motion.div>
            <motion.div
              animate={{
                opacity: activeIndex === i ? 0.15 : 0,
              }}
              className="absolute inset-0 bg-white dark:bg-black"
              initial={{ opacity: 0 }}
              transition={{
                duration: 0.2,
                ease: "easeInOut",
              }}
            />
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
