import { NWCClient } from '@getalby/sdk/nwc'
import { decryptSecret } from './crypto-vault.js'
import { lookupSandboxPreimage } from './lightning.js'

export interface NwcPayResult {
  ok: boolean
  preimage?: string
  error?: string
}

export async function payInvoiceViaNwc({
  nwcUriEncrypted,
  bolt11,
  paymentHash,
}: {
  nwcUriEncrypted: string | null | undefined
  bolt11: string
  paymentHash: string
}): Promise<NwcPayResult> {
  if (!nwcUriEncrypted) {
    return { ok: false, error: 'Aucune connexion NWC configurée pour ce membre' }
  }

  let uri: string
  try {
    uri = decryptSecret(nwcUriEncrypted)
  } catch {
    return { ok: false, error: 'Impossible de déchiffrer la connexion NWC' }
  }

  if (uri.startsWith('sandbox://nwc/')) {
    if (uri.includes('fail=1')) {
      return { ok: false, error: 'Plafond NWC dépassé ou portefeuille hors ligne (sandbox)' }
    }
    const preimage = await lookupSandboxPreimage(paymentHash)
    if (!preimage) {
      return { ok: false, error: 'Préimage sandbox introuvable pour cette facture' }
    }
    return { ok: true, preimage }
  }

  if (!uri.startsWith('nostr+walletconnect://')) {
    return { ok: false, error: 'URI NWC invalide' }
  }

  const client = new NWCClient({ nostrWalletConnectUrl: uri })
  try {
    const response = await Promise.race([
      client.payInvoice({ invoice: bolt11 }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Délai NWC dépassé (20s)')), 20_000),
      ),
    ])
    if (!response.preimage) {
      return { ok: false, error: 'Paiement NWC sans preimage de confirmation' }
    }
    return { ok: true, preimage: response.preimage }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Échec du paiement NWC'
    return { ok: false, error: message }
  } finally {
    try {
      client.close()
    } catch {
      // Ignore close error
    }
  }
}
