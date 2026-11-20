---
type: technology
status: assumption
---
# Technical Building Blocks

| Block | Role in [[tontinesats]] |
|---|---|
| Lightning Network | Fast, low-fee payments from each member to the round's beneficiary |
| NWC (Nostr Wallet Connect, NIP-47) | Members authorise the app to pay scheduled invoices from their own wallet, with a spending budget |
| Nostr identity (npub) | Login without email or phone; owner of the reputation record |
| Signed receipt events | Beneficiary signs "I received X from member Y in round N"; prevents fake self-reported history |
| LNbits | Hosted wallets for demo users who have no Lightning wallet yet |
| CFA/BTC price feed | Converts the CFA contribution into sats at payment time |

## Payment flow
1. Round opens; the app asks the beneficiary's wallet for one invoice per member.
2. Each member's NWC connection pays its invoice, or the member pays by QR.
3. On settlement, the beneficiary's client publishes a signed receipt.
4. The app marks the round complete when every receipt exists.

## Related
[[differentiators]], [[risks-and-open-questions]]
