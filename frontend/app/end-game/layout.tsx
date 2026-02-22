import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Game Results | Stock Ticker",
    description: "View the final standings and net worth of all market players.",
};

export default function EndGameLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
