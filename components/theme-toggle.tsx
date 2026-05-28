"use client";

import { useThemeToggle } from "@/components/ui/skiper-ui/skiper26";
import { ThemeToggleButton1 } from "@/components/ui/skiper-ui/skiper4";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggleTheme } = useThemeToggle({ variant: "circle", start: "center" });

  return (
    <ThemeToggleButton1
      isDark={isDark}
      onClick={toggleTheme}
      className={cn("h-9 w-9", className)}
    />
  );
}
