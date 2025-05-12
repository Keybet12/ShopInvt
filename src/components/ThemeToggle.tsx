
import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Toggle 
      pressed={theme === 'dark'} 
      onPressedChange={toggleTheme}
      aria-label="Toggle theme"
      className="mr-2"
    >
      {theme === 'dark' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Toggle>
  );
};

export default ThemeToggle;
