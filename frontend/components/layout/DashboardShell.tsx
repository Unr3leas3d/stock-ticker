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
                "flex min-h-screen w-full flex-col bg-muted/40",
                className
            )}
            {...props}
        >


            {/* Main Content Area */}
            <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:gap-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
