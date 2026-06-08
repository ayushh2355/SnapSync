"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full bg-slate-100 dark:bg-[#161b22] dark:border dark:border-[#2d2f45] text-slate-600 dark:text-[#9ca3af] hover:bg-slate-200 dark:hover:bg-[#1e293b] dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-fuchsia-500 dark:focus:ring-violet-500"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
