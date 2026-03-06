"use client";

import { cx } from "class-variance-authority";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import React from "react";
// I will create a basic SiriOrb and useClickOutside
import { useClickOutside } from "./use-click-outside";

// Mocking Button to ensure it works properly in standard setup
import { cn } from "@/lib/utils"
// Reusing button logic or we could mock here directly. I'll mock directly to make things simpler since they may not have all standard ui elements yet
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

const SiriOrb = ({ size, colors }: { size?: string, colors?: any }) => (
  <div style={{ width: size, height: size, background: 'linear-gradient(45deg, #0ba360 0%, #3cba92 100%)', borderRadius: '50%' }} className="animate-pulse shadow-lg" />
);

const SPEED = 1;
const SUCCESS_DURATION = 1500;
const DOCK_HEIGHT = 44;
const FEEDBACK_BORDER_RADIUS = 14;
const DOCK_BORDER_RADIUS = 20;
const SPRING_STIFFNESS = 550;
const SPRING_DAMPING = 45;
const SPRING_MASS = 0.7;
const CLOSE_DELAY = 0.08;

interface FooterContext {
  showFeedback: boolean;
  success: boolean;
  openFeedback: () => void;
  closeFeedback: () => void;
}

const FooterContext = React.createContext({} as FooterContext);
const useFooter = () => React.useContext(FooterContext);

export function MorphSurface() {
  const rootRef = React.useRef<HTMLDivElement>(null);

  const feedbackRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  const closeFeedback = React.useCallback(() => {
    setShowFeedback(false);
    feedbackRef.current?.blur();
  }, []);

  const openFeedback = React.useCallback(() => {
    setShowFeedback(true);
    setTimeout(() => {
      feedbackRef.current?.focus();
    });
  }, []);

  const onFeedbackSuccess = React.useCallback(() => {
    closeFeedback();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
    }, SUCCESS_DURATION);
  }, [closeFeedback]);

  useClickOutside(rootRef, closeFeedback);

  const context = React.useMemo(
    () => ({
      showFeedback,
      success,
      openFeedback,
      closeFeedback,
    }),
    [showFeedback, success, openFeedback, closeFeedback]
  );

  return (
    <div
      className="flex items-center justify-center fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]"
      style={{
        width: FEEDBACK_WIDTH,
        height: showFeedback ? FEEDBACK_HEIGHT : DOCK_HEIGHT,
      }}
    >
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                width: showFeedback ? FEEDBACK_WIDTH : "auto",
                height: showFeedback ? FEEDBACK_HEIGHT : DOCK_HEIGHT,
                borderRadius: showFeedback
                  ? FEEDBACK_BORDER_RADIUS
                  : DOCK_BORDER_RADIUS,
              }
        }
        className={cx(
          "relative z-3 flex flex-col items-center overflow-hidden border bg-background shadow-xl hover:shadow-2xl transition-shadow backdrop-blur-md bg-white/80 dark:bg-black/80"
        )}
        data-footer
        initial={false}
        ref={rootRef}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                type: "spring",
                stiffness: SPRING_STIFFNESS / SPEED,
                damping: SPRING_DAMPING,
                mass: SPRING_MASS,
                delay: showFeedback ? 0 : CLOSE_DELAY,
                duration: 0.25,
              }
        }
      >
        <FooterContext.Provider value={context}>
          <Dock />
          <Feedback onSuccess={onFeedbackSuccess} ref={feedbackRef} />
        </FooterContext.Provider>
      </motion.div>
    </div>
  );
}

function Dock() {
  const { showFeedback, openFeedback } = useFooter();
  const shouldReduceMotion = useReducedMotion();
  return (
    <footer className="mt-auto flex h-[44px] select-none items-center justify-center whitespace-nowrap w-full">
      <div className="flex w-full items-center justify-center gap-2 px-3 max-sm:h-10 max-sm:px-2">
        <div className="flex w-fit items-center gap-2">
          <AnimatePresence mode="wait">
            {showFeedback ? (
              <motion.div
                animate={shouldReduceMotion ? {} : { opacity: 0 }}
                className="h-5 w-5"
                exit={shouldReduceMotion ? {} : { opacity: 0 }}
                initial={shouldReduceMotion ? {} : { opacity: 0 }}
                key="placeholder"
                transition={
                  shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }
                }
              />
            ) : (
              <motion.div
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : { opacity: 0 }
                }
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                key="siri-orb"
                transition={
                  shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }
                }
              >
                <SiriOrb
                  colors={{
                    bg: "oklch(22.64% 0 0)",
                  }}
                  size="24px"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          className="flex h-fit flex-1 justify-center rounded-full px-4 !py-1 font-medium hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          onClick={openFeedback}
          type="button"
          variant="ghost"
        >
          <span className="truncate pr-4">Ask AI</span>
        </Button>
      </div>
    </footer>
  );
}

const FEEDBACK_WIDTH = 360;
const FEEDBACK_HEIGHT = 200;

const Feedback = React.forwardRef<HTMLTextAreaElement, { onSuccess: () => void }>(({ onSuccess }, ref) => {
  const { closeFeedback, showFeedback } = useFooter();
  const shouldReduceMotion = useReducedMotion();
  const submitRef = React.useRef<HTMLButtonElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSuccess();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      closeFeedback();
    }
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      submitRef.current?.click();
    }
  }

  return (
    <form
      className="absolute bottom-0"
      onSubmit={onSubmit}
      style={{
        width: FEEDBACK_WIDTH,
        height: FEEDBACK_HEIGHT,
        pointerEvents: showFeedback ? "all" : "none",
      }}
    >
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
            className="flex h-full flex-col p-1"
            exit={
              shouldReduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0 }
            }
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    type: "spring",
                    stiffness: SPRING_STIFFNESS / SPEED,
                    damping: SPRING_DAMPING,
                    mass: SPRING_MASS,
                    duration: 0.25,
                  }
            }
          >
            <div className="flex justify-between py-1">
              <p className="z-2 ml-[38px] flex select-none items-center gap-[6px] text-zinc-600 dark:text-zinc-400 font-medium text-sm">
                AI Input
              </p>
              <button
                className="right-4 mt-1 flex -translate-y-[3px] cursor-pointer select-none items-center justify-center gap-1 rounded-[12px] bg-transparent pr-1 text-center text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                ref={submitRef}
                type="submit"
              >
                <Kbd>⌘</Kbd>
                <Kbd className="w-fit">Enter</Kbd>
              </button>
            </div>
            <textarea
              className="h-full w-full resize-none scroll-py-2 rounded-xl bg-gray-50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-black p-4 outline-none border border-transparent focus:border-gray-200 dark:focus:border-white/10 transition-colors shadow-inner text-sm"
              name="message"
              onKeyDown={onKeyDown}
              placeholder="Ask me anything..."
              ref={ref}
              required
              spellCheck={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
            className="absolute top-2 left-3"
            exit={
              shouldReduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0 }
            }
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }
            }
          >
            <SiriOrb
              colors={{
                bg: "oklch(22.64% 0 0)",
              }}
              size="24px"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
});
Feedback.displayName = "Feedback";

function Kbd({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <kbd
      className={cx(
        "flex h-6 w-fit items-center justify-center rounded-md bg-gray-100 dark:bg-zinc-800 border-b-2 border-gray-200 dark:border-zinc-700 px-[6px] font-mono text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold uppercase",
        className
      )}
    >
      {children}
    </kbd>
  );
}

export default MorphSurface;