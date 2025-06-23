import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { WagmiProvider } from "@/components/providers/WagmiProvider"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BaseBurn Token - Farcaster Mini App",
  description: "Burn tokens on Base network and earn points with BaseBurn Token",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WagmiProvider>
          {children}
          <Toaster position="top-right" />
        </WagmiProvider>
      </body>
    </html>
  )
}
