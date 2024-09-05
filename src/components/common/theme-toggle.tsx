"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="aspect-square"
    >
      <Icons.sun className="size-4 dark:hidden" />
      <Icons.moon className="hidden size-4 dark:block" />
      <span className="sr-only">Skift tema</span>
    </Button>
  );
}
