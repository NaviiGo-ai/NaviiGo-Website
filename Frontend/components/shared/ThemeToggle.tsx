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

  const icon = !mounted
    ? <Sun className="h-4 w-4 text-slate-700" aria-hidden="true" />
    : isDark
    ? <Moon className="h-4 w-4 text-slate-200" aria-hidden="true" />
    : <Sun className="h-4 w-4 text-slate-700" aria-hidden="true" />;

  return (
    <motion.button
      type="button"
      aria-label="Toggle theme"
      disabled={!mounted}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/50 backdrop-blur-md ring-1 ring-black/5 transition-colors hover:bg-white/70 disabled:opacity-50 dark:bg-slate-900/40 dark:ring-white/10 dark:hover:bg-slate-900/55"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon}
    </motion.button>
  );
}
