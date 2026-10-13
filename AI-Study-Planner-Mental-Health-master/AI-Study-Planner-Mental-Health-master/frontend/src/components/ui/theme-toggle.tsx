"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
    const toggleTheme = () => {
        const root = document.documentElement
        const isDark = root.classList.toggle("dark")
        const theme = isDark ? "dark" : "light"
        root.style.colorScheme = theme

        try {
            localStorage.setItem("mentalis-theme", theme)
        } catch {
            // The active theme still works when storage is unavailable.
        }
    }

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-button text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
            aria-label="Toggle light and dark theme"
            title="Toggle light and dark theme"
        >
            <Sun className="h-4 w-4 dark:hidden" aria-hidden="true" />
            <Moon className="hidden h-4 w-4 dark:block" aria-hidden="true" />
        </Button>
    )
}