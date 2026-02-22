import * as React from "react"
import { cn } from "@/lib/utils"

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function DashboardShell({
    children,
    className,
    ...props
}: DashboardShellProps) {
    return (
        <div
            className={cn(
                "flex h-full w-full flex-col bg-muted/40 overflow-hidden",
                className
            )}
            {...props}
        >
            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden p-4 sm:p-6 md:px-8">
                <div className="mx-auto flex h-full w-full max-w-7xl flex-col">
                    {children}
                </div>
            </main>
        </div>
    )
}
