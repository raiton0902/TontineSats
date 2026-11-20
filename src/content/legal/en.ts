import type { LegalDocument } from './types'

const terms: LegalDocument = {
  title: 'Terms and Conditions',
  intro:
    'This document states what TontineSats does, what it does not do, and what you accept by using it. It applies to anyone who creates an identity, joins a tontine, or receives a payment through the service.',
  sections: [
    {
      heading: '1. What the service does',
      body: [
        'TontineSats is software that helps a group run a rotating savings circle. It records members, the payout order, contribution amounts, and settled payments. It creates Lightning invoices addressed to the member receiving that round, and keeps a record of settlements.',
        'The service does not hold pooled funds. Money moves directly from the paying member’s wallet to the receiving member’s wallet.',
      ],
    },
    {
      heading: '2. Status of the service',
      body: [
        'TontineSats is not a bank, a payment institution, or a financial adviser. We do not manage your funds, we do not guarantee that a circle will collect, and we promise no return.',
        'Amounts shown in CFA francs are a convenience. The amount actually paid is denominated in satoshis.',
      ],
    },
    {
      heading: '3. Eligibility',
      body: [
        'You must be at least 18 years old, have legal capacity, and use the service in accordance with the law of your country of residence.',
      ],
    },
    {
      heading: '4. Your keys and your recovery',
      body: [
        'Your Nostr private key and your recovery phrase are generated on your device. We neither receive nor keep them.',
        'If you lose either one, nobody can restore your access or your history. The TontineSats team will never ask for your recovery phrase or your private key.',
      ],
    },
    {
      heading: '5. Payments',
      body: [
        'Payments settle over the Bitcoin Lightning Network and are final. A settled payment cannot be reversed, disputed, or refunded by us.',
        'Before you pay, check the recipient and the amount in satoshis. We cannot recover a payment sent to the wrong recipient or for the wrong amount.',
        'A payment may fail if either node is offline. The exchange rate applied is fixed when the round opens and shown before you pay. We source it from third-party feeds, we do not guarantee it, and we do not cover its movements.',
        'The beneficiary receives satoshis, not CFA francs. Converting them is their decision. If members do not contribute, that round may not pay out.',
      ],
    },
    {
      heading: '6. The tontine is an agreement between its members',
      body: [
        'The service provides the tool and the record. The organizer sets the amount, the payout order, and the due dates. Members agree among themselves on who joins, who leaves, and what happens to unpaid rounds.',
        'We are not a party to that agreement. Disputes between members are settled between them and the organizer. We can share the transaction records available on the service.',
      ],
    },
    {
      heading: '7. Connected wallet',
      body: [
        'If you connect a wallet through Nostr Wallet Connect, we store the connection string on our servers in encrypted form so we can request payment of the invoices we create. It does not let us move funds anywhere else.',
        'You can disconnect it at any time in settings. Use a wallet holding only what you accept to expose. If your device or that connection string is compromised, a third party may trigger payments from your wallet.',
      ],
    },
    {
      heading: '8. Third-party services',
      body: [
        'The service depends on providers we do not control: the Lightning node or wallet provider that creates and receives invoices, the Nostr relays that store receipts, price feed providers, your wallet, and your browser.',
        'Their terms, their fees, and their outages apply to you as well. We do not control what a relay keeps after it receives an event.',
      ],
    },
    {
      heading: '9. Demo mode',
      body: [
        'A demonstration build may use test wallets with no real value, reset accounts, and delete data without notice. The service states clearly when this mode is active.',
      ],
    },
    {
      heading: '10. Acceptable use',
      body: [
        'Do not use the service to move someone else’s funds without authorization, to launder money, to evade sanctions or tax obligations, to commit fraud, to send unsolicited invitations, to attack the service or the networks it depends on, or to break applicable law.',
        'We may suspend access where a legal duty applies, where there is a security threat, or where use of this kind is detected.',
      ],
    },
    {
      heading: '11. Availability and changes',
      body: [
        'The service is beta software. Features may change or disappear. We guarantee neither continuous availability nor future compatibility with your browser, your wallet, or a relay.',
      ],
    },
    {
      heading: '12. No warranty',
      body: [
        'The service is provided as is. We warrant neither freedom from error, nor fitness for your needs, nor the accuracy or permanent availability of any record.',
      ],
    },
    {
      heading: '13. Liability',
      body: [
        'To the fullest extent the law allows, we are not liable for lost profits, lost savings, lost reputation, or indirect loss arising from your use of the service, a Lightning transfer, a rate movement, or a dispute between members.',
        'Where liability cannot be excluded, it is limited to the amount you paid us for the service, which is currently zero.',
        'Nothing here limits rights the law grants you as a consumer in your country of residence.',
      ],
    },
    {
      heading: '14. Indemnity',
      body: [
        'You indemnify us against claims brought against us because you used the service unlawfully, in breach of these terms, or in breach of applicable law.',
      ],
    },
    {
      heading: '15. Ending use',
      body: [
        'You may stop using the service and request deletion of your data at any time. Completed rounds remain recorded for the retention period set out in the Privacy Policy.',
      ],
    },
    {
      heading: '16. Changes to these terms',
      body: [
        'Every version is numbered and the version you accepted is recorded. A material change requires a new acceptance before you continue. Continuing after a change means you accept it.',
      ],
    },
    {
      heading: '17. Governing law and disputes',
      body: [
        'These terms are governed by Senegalese law. The courts of Dakar have jurisdiction. Mandatory protections you enjoy as a consumer in your country of residence also apply.',
      ],
    },
    {
      heading: '18. Contact',
      body: [
        'The operator’s contact details appear in the legal notice published with the service. This demonstration version does not contain them.',
      ],
    },
  ],
}

const privacy: LegalDocument = {
  title: 'Privacy Policy',
  intro:
    'This document states which data TontineSats processes, why, for how long, and what you can ask for. It applies to anyone who uses the service.',
  sections: [
    {
      heading: '1. Data we collect',
      body: [
        'We process the data the service needs: your Nostr public key, display name, and language; your circle memberships, the payout order, rounds, and contributions; a Lightning address or wallet identifier if you provide one; the encrypted NWC connection string if you connect a wallet; signed receipts and their identifiers; your consent choices with the accepted version, date, time, and language; technical logs containing your IP address, request times, and error messages.',
        'We do not ask for your civil name, postal address, phone number, identity document, photo, or bank account. We hold no pooled funds, no private key, and no recovery phrase.',
      ],
    },
    {
      heading: '2. Data kept on your device',
      body: [
        'Your private key, your recovery phrase, and any wallet seed stay on your device. We never receive them.',
        'Your browser’s local storage also holds your session, your language and theme choices, and the record of which document version you accepted. Clearing browser data removes these items.',
      ],
    },
    {
      heading: '3. Purposes and bases',
      body: [
        'We process this data to run the circle you joined and to keep the payment record, which is necessary to provide the service.',
        'We process receipts and your public key so that you and your counterparties can verify that a payment happened. We process technical logs to detect attacks and abuse.',
        'We do not use your data for advertising and we do not sell it.',
      ],
    },
    {
      heading: '4. Publishing receipts on Nostr',
      body: [
        'When a payment settles, the service may publish a receipt to Nostr relays. A receipt contains the circle identifier, the round number, the payer and beneficiary public keys, the amount, the payment hash, the date, and the beneficiary’s signature.',
        'Relays are public. Anything published there can be copied, indexed, and kept indefinitely by anyone, including us. We cannot remove a receipt from a relay or from a copy held by a third party.',
        'Publishing is optional. It stays off until your separate agreement, and you can withdraw that agreement at any time in settings. Withdrawal stops future publication. It does not remove copies already made.',
      ],
    },
    {
      heading: '5. Recipients',
      body: [
        'The Lightning node or wallet provider receives invoices and the data needed to settle them. Nostr relays receive the public keys and receipts they are asked to store. Price feed providers receive rate requests. Your wallet or extension holds your keys and signs for you.',
        'Each of them applies its own terms and its own privacy policy.',
      ],
    },
    {
      heading: '6. Retention',
      body: [
        'Circle, round, contribution, and receipt data is kept for the life of the circle, then for the applicable legal retention period.',
        'Technical logs are kept for as long as the security of the service requires. Encrypted wallet connections are kept until you disconnect them or close the account. Consent records are kept for the life of the account, as proof of the version accepted.',
        'Deleting your account removes your profile, your wallet connection, and your payment data, subject to the periods above.',
      ],
    },
    {
      heading: '7. Security',
      body: [
        'Traffic is encrypted in transit. Wallet connections are encrypted at rest. Access to member data is limited to the people who need it to run the service. Private keys, connection strings, and preimages are not written to logs.',
        'No system is perfectly secure. If you think you have found a vulnerability, report it before public disclosure.',
      ],
    },
    {
      heading: '8. Your rights',
      body: [
        'Depending on where you live, you may ask to see the data we hold, to correct it, to delete it, to receive a copy, to object to processing, to withdraw consent, and to complain to a data protection authority.',
        'In Senegal, the competent authority is the Commission de protection des Données Personnelles. In France, the CNIL. In other European Union countries, the authority where you live. Requests go to the contact details in the legal notice, within one month.',
        'Some data cannot be deleted. It is already copied into public relays, or its retention is required by tax or accounting rules. We state the reason when that applies.',
      ],
    },
    {
      heading: '9. Transfers outside your country',
      body: [
        'Relays and node providers may be located outside Senegal and outside the European Economic Area. Your public keys and receipts may therefore be processed in another country.',
        'For members in the European Economic Area, the transfer relies on the applicable mechanism under European law, to be confirmed by counsel before production.',
      ],
    },
    {
      heading: '10. Children',
      body: [
        'The service is for adults. We do not knowingly collect data from anyone under 18. If you believe a child gave us data, contact us and we delete it.',
      ],
    },
    {
      heading: '11. Local storage and tracking',
      body: [
        'The service uses browser local storage for the session, language, theme, and consent record. It sets no advertising or tracking cookie and loads no third-party advertising or analytics script.',
      ],
    },
    {
      heading: '12. Changes to this policy',
      body: [
        'Every version is numbered and the version you accepted is recorded. A material change, in particular to receipt publication, requires a new acceptance.',
      ],
    },
    {
      heading: '13. Contact',
      body: [
        'The controller’s contact details appear in the legal notice published with the service. This demonstration version does not contain them.',
      ],
    },
  ],
}

export const en = { terms, privacy }
