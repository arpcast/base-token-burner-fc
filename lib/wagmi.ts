import { createConfig, http } from "wagmi"
import { base } from "wagmi/chains"
import { coinbaseWallet, injected } from "wagmi/connectors"

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: "BaseBurn Token",
    }),
  ],
  transports: {
    [base.id]: http(),
  },
})
