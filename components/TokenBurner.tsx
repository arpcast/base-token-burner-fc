"use client"

import { useState, useEffect } from "react"
import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useBalance,
} from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { base } from "wagmi/chains"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Flame, Wallet, Trophy, Loader2, Plus, Coins, History, Clock, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { ERC20_ABI } from "@/lib/abi"

const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD"
const FEE_RECIPIENT = "0xCC5552a28C2AA0AaE2B09826311900b466AebA65"
const FEE_PERCENTAGE = 0.05 // 5% fee

// Popular Base meme tokens
const BASE_MEME_TOKENS = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: "native",
    decimals: 18,
    logo: "🔷",
  },
  {
    symbol: "DEGEN",
    name: "Degen",
    address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed",
    decimals: 18,
    logo: "🎩",
  },
  {
    symbol: "TOSHI",
    name: "Toshi",
    address: "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4",
    decimals: 18,
    logo: "🐱",
  },
  {
    symbol: "BRETT",
    name: "Brett",
    address: "0x532f27101965dd16442E59d40670FaF5eBB142E4",
    decimals: 18,
    logo: "🐸",
  },
  {
    symbol: "HIGHER",
    name: "Higher",
    address: "0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe",
    decimals: 18,
    logo: "⬆️",
  },
  {
    symbol: "MOCHI",
    name: "Mochi",
    address: "0xF6e932Ca12afa26665dC4dDE7e27be02A7c02e50",
    decimals: 18,
    logo: "🍡",
  },
  {
    symbol: "NORMIE",
    name: "Normie",
    address: "0x7F12d13B34F5F4f0a9449c16Bcd42f0da47AF200",
    decimals: 9,
    logo: "😐",
  },
]

interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  logo: string
}

interface BurnTransaction {
  id: string
  hash: string
  tokenSymbol: string
  tokenName: string
  tokenAddress: string
  amount: string
  pointsEarned: number
  timestamp: number
  status: "success" | "pending" | "failed"
}

export function TokenBurner() {
  const [selectedToken, setSelectedToken] = useState<Token>(BASE_MEME_TOKENS[0])
  const [burnAmount, setBurnAmount] = useState("")
  const [points, setPoints] = useState(0)
  const [totalBurned, setTotalBurned] = useState("0")
  const [customTokens, setCustomTokens] = useState<Token[]>([])
  const [isAddTokenOpen, setIsAddTokenOpen] = useState(false)
  const [newTokenAddress, setNewTokenAddress] = useState("")
  const [isLoadingToken, setIsLoadingToken] = useState(false)
  const [burnHistory, setBurnHistory] = useState<BurnTransaction[]>([])
  const [currentTxId, setCurrentTxId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("burn")

  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()

  const { writeContract, data: hash, isPending: isBurning } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Get token balance
  const {
    data: tokenBalance,
    error: balanceError,
    isLoading: isLoadingBalance,
  } = useBalance({
    address: address,
    token: selectedToken.address === "native" ? undefined : (selectedToken.address as `0x${string}`),
    query: {
      enabled: !!address && !!selectedToken,
      refetchInterval: 10000,
    },
  })

  // Get token info for custom tokens
  const { data: tokenName, isError: nameError } = useReadContract({
    address: newTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "name",
    query: {
      enabled: newTokenAddress.length === 42 && newTokenAddress.startsWith("0x"),
      retry: 2,
    },
  })

  const { data: tokenSymbol, isError: symbolError } = useReadContract({
    address: newTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: {
      enabled: newTokenAddress.length === 42 && newTokenAddress.startsWith("0x"),
      retry: 2,
    },
  })

  const { data: tokenDecimals, isError: decimalsError } = useReadContract({
    address: newTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: {
      enabled: newTokenAddress.length === 42 && newTokenAddress.startsWith("0x"),
      retry: 2,
    },
  })

  // Load saved data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPoints = localStorage.getItem("burner-points")
      const savedTotalBurned = localStorage.getItem("total-burned")
      const savedCustomTokens = localStorage.getItem("custom-tokens")

      if (savedPoints) setPoints(Number.parseInt(savedPoints))
      if (savedTotalBurned) setTotalBurned(savedTotalBurned)
      if (savedCustomTokens) {
        try {
          setCustomTokens(JSON.parse(savedCustomTokens))
        } catch (e) {
          console.error("Failed to parse custom tokens:", e)
        }
      }
    }
  }, [])

  // Handle successful burn
  useEffect(() => {
    if (isSuccess && hash && currentTxId) {
      const burnValue = Number.parseFloat(burnAmount)
      const newPoints = Math.floor(burnValue * 100)
      const updatedPoints = points + newPoints
      const updatedTotalBurned = (Number.parseFloat(totalBurned) + burnValue).toString()

      setPoints(updatedPoints)
      setTotalBurned(updatedTotalBurned)

      const updatedHistory = burnHistory.map((tx) =>
        tx.id === currentTxId ? { ...tx, status: "success" as const } : tx,
      )
      setBurnHistory(updatedHistory)

      localStorage.setItem("burner-points", updatedPoints.toString())
      localStorage.setItem("total-burned", updatedTotalBurned)
      localStorage.setItem("burn-history", JSON.stringify(updatedHistory))

      setBurnAmount("")
      setCurrentTxId(null)
      toast.success(`🔥 Burned ${burnAmount} ${selectedToken.symbol}! Earned ${newPoints} points!`)
    }
  }, [isSuccess, hash, currentTxId, burnAmount, points, totalBurned, selectedToken.symbol, burnHistory])

  // Load burn history from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHistory = localStorage.getItem("burn-history")
      if (savedHistory) {
        try {
          setBurnHistory(JSON.parse(savedHistory))
        } catch (e) {
          console.error("Failed to parse burn history:", e)
        }
      }
    }
  }, [])

  const allTokens = [...BASE_MEME_TOKENS, ...customTokens]

  const handleAddCustomToken = async () => {
    if (!newTokenAddress || newTokenAddress.length !== 42 || !newTokenAddress.startsWith("0x")) {
      toast.error("Please enter a valid contract address (0x...)")
      return
    }

    setIsLoadingToken(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (tokenName && tokenSymbol && tokenDecimals !== undefined) {
        const newToken: Token = {
          symbol: tokenSymbol as string,
          name: tokenName as string,
          address: newTokenAddress,
          decimals: tokenDecimals as number,
          logo: "🪙",
        }

        const exists = allTokens.some((token) => token.address.toLowerCase() === newTokenAddress.toLowerCase())

        if (exists) {
          toast.error("Token already exists in the list")
          setIsLoadingToken(false)
          return
        }

        const updatedCustomTokens = [...customTokens, newToken]
        setCustomTokens(updatedCustomTokens)

        if (typeof window !== "undefined") {
          localStorage.setItem("custom-tokens", JSON.stringify(updatedCustomTokens))
        }

        setNewTokenAddress("")
        setIsAddTokenOpen(false)
        toast.success(`Added ${tokenSymbol} to token list!`)
      } else {
        toast.error("Unable to fetch token information. Please check the contract address.")
      }
    } catch (error) {
      console.error("Error adding token:", error)
      toast.error("Failed to add token. Please verify it's a valid ERC-20 contract on Base network.")
    } finally {
      setIsLoadingToken(false)
    }
  }

  const validateBurnAmount = (amount: string) => {
    if (!amount) return true

    const num = Number.parseFloat(amount)
    if (isNaN(num) || num <= 0) {
      return false
    }

    if (tokenBalance) {
      const balance = Number.parseFloat(formatUnits(tokenBalance.value, tokenBalance.decimals))
      if (num > balance) {
        return false
      }
    }

    return true
  }

  const isValidAmount = validateBurnAmount(burnAmount)

  const handleBurnSimplified = async () => {
    if (!burnAmount || Number.parseFloat(burnAmount) <= 0) {
      toast.error("Please enter a valid amount to burn")
      return
    }

    if (chain?.id !== base.id) {
      toast.error("Please switch to Base network")
      return
    }

    if (!tokenBalance) {
      toast.error("Unable to fetch token balance")
      return
    }

    const burnAmountNum = Number.parseFloat(burnAmount)
    const balanceNum = Number.parseFloat(formatUnits(tokenBalance.value, tokenBalance.decimals))

    if (balanceNum < burnAmountNum) {
      toast.error(`Insufficient balance. You have ${balanceNum.toFixed(6)} ${selectedToken.symbol}`)
      return
    }

    const txId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newTransaction: BurnTransaction = {
      id: txId,
      hash: "",
      tokenSymbol: selectedToken.symbol,
      tokenName: selectedToken.name,
      tokenAddress: selectedToken.address,
      amount: burnAmount,
      pointsEarned: Math.floor(burnAmountNum * 100),
      timestamp: Date.now(),
      status: "pending",
    }

    const updatedHistory = [newTransaction, ...burnHistory]
    setBurnHistory(updatedHistory)
    setCurrentTxId(txId)
    localStorage.setItem("burn-history", JSON.stringify(updatedHistory))

    try {
      const totalAmount = parseUnits(burnAmount, selectedToken.decimals)

      if (selectedToken.address === "native") {
        await writeContract({
          to: BURN_ADDRESS as `0x${string}`,
          value: totalAmount,
        })
      } else {
        await writeContract({
          address: selectedToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [BURN_ADDRESS as `0x${string}`, totalAmount],
        })
      }
    } catch (error: any) {
      console.error("Burn failed:", error)

      const failedHistory = burnHistory.map((tx) => (tx.id === txId ? { ...tx, status: "failed" as const } : tx))
      setBurnHistory(failedHistory)
      localStorage.setItem("burn-history", JSON.stringify(failedHistory))
      setCurrentTxId(null)

      if (error?.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds for gas fees")
      } else if (error?.message?.includes("user rejected")) {
        toast.error("Transaction cancelled")
      } else {
        toast.error("Transaction failed. Please try again.")
      }
    }
  }

  // Update transaction hash when available
  useEffect(() => {
    if (hash && currentTxId) {
      const updatedHistory = burnHistory.map((tx) => (tx.id === currentTxId ? { ...tx, hash } : tx))
      setBurnHistory(updatedHistory)
      localStorage.setItem("burn-history", JSON.stringify(updatedHistory))
    }
  }, [hash, currentTxId, burnHistory])

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 mb-4 flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500 rounded-full">
                <Flame className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-blue-900">BaseBurn Token</CardTitle>
              <CardDescription className="text-blue-600">
                Connect your wallet to start burning tokens and earning points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectors.map((connector) => (
                <Button
                  key={connector.id}
                  onClick={() => connect({ connector })}
                  disabled={isConnecting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    `Connect ${connector.name}`
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 mb-4 flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500 rounded-full">
              <Flame className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl text-blue-900">BaseBurn Token</CardTitle>
            <CardDescription className="text-blue-600">Burn your Base network tokens and earn points</CardDescription>
          </CardHeader>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{points.toLocaleString()}</div>
              <div className="text-sm text-blue-600">Points Earned</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-6 text-center">
              <Flame className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{Number.parseFloat(totalBurned).toFixed(4)}</div>
              <div className="text-sm text-blue-600">Tokens Burned</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("burn")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "burn" ? "bg-white text-blue-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Flame className="w-4 h-4" />
            Burn Tokens
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "history" ? "bg-white text-blue-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <History className="w-4 h-4" />
            History ({burnHistory.length})
          </button>
        </div>

        {/* Burn Tab Content */}
        {activeTab === "burn" && (
          <div className="space-y-6">
            {/* Token Selection */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Select Token to Burn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <select
                      value={selectedToken.address}
                      onChange={(e) => {
                        const token = allTokens.find((t) => t.address === e.target.value)
                        if (token) {
                          setSelectedToken(token)
                          setBurnAmount("")
                        }
                      }}
                      className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {allTokens.map((token) => (
                        <option key={token.address} value={token.address}>
                          {token.logo} {token.symbol} ({token.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddTokenOpen(true)}
                    className="border-blue-200 text-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {isLoadingBalance ? (
                  <div className="text-sm text-blue-600 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading balance...
                  </div>
                ) : tokenBalance ? (
                  <div className="text-sm text-blue-600">
                    Balance: {Number.parseFloat(formatUnits(tokenBalance.value, tokenBalance.decimals)).toFixed(6)}{" "}
                    {selectedToken.symbol}
                  </div>
                ) : balanceError ? (
                  <div className="text-sm text-red-600">Error loading balance</div>
                ) : null}
              </CardContent>
            </Card>

            {/* Burn Interface */}
            <Card className="border-blue-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-blue-900">Burn {selectedToken.symbol}</CardTitle>
                <CardDescription className="text-blue-600">
                  Enter the amount of {selectedToken.symbol} to burn. You'll earn 100 points per token burned.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="burnAmount" className="text-blue-900">
                    Amount to Burn ({selectedToken.symbol})
                  </Label>
                  <Input
                    id="burnAmount"
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="0.001"
                    value={burnAmount}
                    onChange={(e) => setBurnAmount(e.target.value)}
                    className={`border-blue-200 focus:border-blue-500 ${
                      burnAmount && !isValidAmount ? "border-red-300 focus:border-red-500" : ""
                    }`}
                  />
                  {burnAmount && !isValidAmount && (
                    <div className="text-sm text-red-600">
                      {!Number.parseFloat(burnAmount) || Number.parseFloat(burnAmount) <= 0
                        ? "Please enter a valid amount"
                        : "Amount exceeds balance"}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleBurnSimplified}
                  disabled={
                    !burnAmount || !isValidAmount || isBurning || isConfirming || !tokenBalance || isLoadingBalance
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {isBurning || isConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isBurning ? "Burning..." : "Confirming..."}
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4 mr-2" />
                      Burn {selectedToken.symbol}
                    </>
                  )}
                </Button>

                {burnAmount && (
                  <div className="text-sm text-blue-600 space-y-1">
                    <div>Points to earn: {Math.floor(Number.parseFloat(burnAmount) * 100)} points</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* History Tab Content */}
        {activeTab === "history" && (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <History className="w-5 h-5" />
                Burn History
              </CardTitle>
              <CardDescription className="text-blue-600">Track all your token burning transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {burnHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Flame className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No burns yet. Start burning tokens to see your history!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {burnHistory.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Flame className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-blue-900">
                            {tx.amount} {tx.tokenSymbol}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(tx.timestamp).toLocaleString()}
                          </div>
                          <div className="text-sm text-blue-600">+{tx.pointsEarned} points</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tx.status === "success"
                              ? "bg-green-100 text-green-800"
                              : tx.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tx.status === "success" && "✅ Success"}
                          {tx.status === "pending" && "⏳ Pending"}
                          {tx.status === "failed" && "❌ Failed"}
                        </span>
                        {tx.hash && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://basescan.org/tx/${tx.hash}`, "_blank")}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add Token Modal */}
        {isAddTokenOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Custom Token</h3>
              <p className="text-sm text-gray-600 mb-4">Enter the contract address of the token you want to add</p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="tokenAddress">Contract Address</Label>
                  <Input
                    id="tokenAddress"
                    placeholder="0x..."
                    value={newTokenAddress}
                    onChange={(e) => setNewTokenAddress(e.target.value)}
                    className="border-blue-200"
                  />
                </div>

                {newTokenAddress.length === 42 && newTokenAddress.startsWith("0x") && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    {nameError || symbolError || decimalsError ? (
                      <div className="text-sm text-red-600">❌ Invalid contract or not an ERC-20 token</div>
                    ) : tokenName && tokenSymbol && tokenDecimals !== undefined ? (
                      <div className="text-sm text-green-600">
                        <div>
                          ✅ <strong>Name:</strong> {tokenName}
                        </div>
                        <div>
                          <strong>Symbol:</strong> {tokenSymbol}
                        </div>
                        <div>
                          <strong>Decimals:</strong> {tokenDecimals}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-blue-600 flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading token info...
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddCustomToken}
                    disabled={
                      isLoadingToken ||
                      !tokenName ||
                      !tokenSymbol ||
                      tokenDecimals === undefined ||
                      nameError ||
                      symbolError ||
                      decimalsError
                    }
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoadingToken ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding Token...
                      </>
                    ) : (
                      "Add Token"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddTokenOpen(false)
                      setNewTokenAddress("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Info */}
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-600">
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
              <Button
                onClick={() => disconnect()}
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Disconnect
              </Button>
            </div>
            {chain?.id !== base.id && (
              <div className="mt-2 text-sm text-orange-600">⚠️ Please switch to Base network</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
