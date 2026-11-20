/// <reference types="vite/client" />

interface NostrExtension {
  getPublicKey: () => Promise<string>
  signEvent?: (event: unknown) => Promise<unknown>
}

interface Window {
  nostr?: NostrExtension
}
