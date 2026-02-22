"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
    const { setTheme, theme } = useTheme()

    // To prevent hydration mismatch, we delay the initial render of the current theme slightly
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="h-[36px] w-[36px] rounded-full relative overflow-hidden bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700">
                <span className="sr-only">Toggle theme</span>
            </Button>
        )
    }

    return (
        <Button
            variant="outline"
            size="icon"
            className="h-[36px] w-[36px] rounded-full relative overflow-hidden bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-slate-800 dark:text-slate-200" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-800 dark:text-slate-200" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
