import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Lobby | Stock Ticker",
    description: "Join or host a Stock Ticker room and prepare for market domination.",
};

export default function LobbyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
