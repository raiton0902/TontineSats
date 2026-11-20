import { HDKey } from '@scure/bip32'
import { mnemonicToSeedSync, generateMnemonic, validateMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { getPublicKey, nip19 } from 'nostr-tools'

export interface CreatedIdentity {
  mnemonic: string
  nsec: string
  npub: string
}

const NIP06_PATH = "m/44'/1237'/0'/0/0"

const hexToBytes = (hex: string) => {
  const clean = hex.trim().toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(clean)) throw new Error('Clé hex invalide')
  const out = new Uint8Array(32)
  for (let i = 0; i < 32; i += 1) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

export function secretFromMnemonic(mnemonic: string): Uint8Array {
  const phrase = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!validateMnemonic(phrase, wordlist)) throw new Error('Phrase de récupération invalide')
  const seed = mnemonicToSeedSync(phrase)
  const root = HDKey.fromMasterSeed(seed)
  const child = root.derive(NIP06_PATH)
  if (!child.privateKey) throw new Error('Dérivation impossible')
  return child.privateKey
}

export function createIdentity(): CreatedIdentity {
  const mnemonic = generateMnemonic(wordlist, 128)
  const secret = secretFromMnemonic(mnemonic)
  return {
    mnemonic,
    nsec: nip19.nsecEncode(secret),
    npub: nip19.npubEncode(getPublicKey(secret)),
  }
}

export function parseSecret(input: string): { secret: Uint8Array; npub: string; nsec: string } {
  const value = input.trim()
  if (!value) throw new Error('Clé vide')
  let secret: Uint8Array
  if (value.startsWith('nsec1')) {
    const decoded = nip19.decode(value)
    if (decoded.type !== 'nsec') throw new Error('Ce n’est pas une clé nsec')
    secret = decoded.data
  } else {
    secret = hexToBytes(value)
  }
  return {
    secret,
    npub: nip19.npubEncode(getPublicKey(secret)),
    nsec: nip19.nsecEncode(secret),
  }
}

export function parseMnemonic(input: string): { secret: Uint8Array; npub: string; nsec: string } {
  const secret = secretFromMnemonic(input)
  return {
    secret,
    npub: nip19.npubEncode(getPublicKey(secret)),
    nsec: nip19.nsecEncode(secret),
  }
}

export async function nip07Login(): Promise<string> {
  if (!window.nostr?.getPublicKey) {
    throw new Error('Aucune extension Nostr détectée')
  }
  const pubkey = (await window.nostr.getPublicKey()).trim()
  if (pubkey.startsWith('npub1')) return pubkey
  return nip19.npubEncode(pubkey)
}
