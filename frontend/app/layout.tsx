import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stock Ticker | The Classic Market Game",
  description: "A real-time digital remake of the classic Stock Ticker board game. Trade commodities, navigate splits and bankruptcies, and outsmart your opponents in this fast-paced financial simulation.",
  keywords: ["Stock Ticker", "Board Game", "Stock Market Game", "Multiplayer Game", "Financial Simulation"],
  authors: [{ name: "Stock Ticker Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

import { GameStateProvider } from "@/hooks/useGameState";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { RulesModal } from "@/components/game/RulesModal";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GameStateProvider>
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
              <RulesModal />
              <ModeToggle />
            </div>
            {children}
            <Toaster />
          </GameStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
