"use client";

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const activeTheme = theme === 'system' ? resolvedTheme : theme;
  const isDark = activeTheme === 'dark';

  const icon = !mounted ? (
    <Sun className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
  ) : isDark ? (
    <Sun className="h-4 w-4 text-primary" aria-hidden="true" />
  ) : (
    <Moon className="h-4 w-4 text-foreground" aria-hidden="true" />
  );

  return (
    <motion.button
      type="button"
      aria-label="Toggle light/dark theme"
      disabled={!mounted}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-foreground transition-all hover:bg-accent hover:text-accent-foreground shadow-xs"
      whileHover={{ scale: 1.08, rotate: 15 }}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
    </motion.button>
  );
}
