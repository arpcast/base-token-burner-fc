"use client"

import { TokenBurner } from "@/components/TokenBurner"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <TokenBurner />
    </main>
  )
}
