<!--
  TontineSats legal drafts, version 1.0, effective 9 November 2026.

  Before publishing, fill in the fields deliberately left out of this file:
  1. Operator legal name and registered address
  2. Contact address for terms and privacy requests
  3. Data protection contact (DPO or equivalent)
  4. Retention periods, if a fixed number is required by counsel
  5. Court or arbitration forum, if Dakar is not the final choice
  6. Any registration or licence number that applies

  These drafts are engineering drafts for the hackathon build. They are not legal advice.
  Counsel licensed in Senegal, and in France for the diaspora side, must review them before
  any production use. The French text prevails over the English text.
-->

# TontineSats, conditions générales et politique de confidentialité

Version 1.0. En vigueur le 9 novembre 2026.

Le texte français fait foi. La version anglaise suit et n'est fournie que pour la lisibilité.

---

## Conditions générales

Ce document décrit ce que TontineSats fait, ce qu'il ne fait pas, et ce que vous acceptez en l'utilisant. Il s'applique à toute personne qui crée une identité, rejoint une tontine ou reçoit un paiement par le service.

### 1. Ce que le service fait

TontineSats est un logiciel qui aide un groupe à organiser une tontine. Il enregistre les membres, l'ordre de passage, le montant des cotisations et les paiements réglés. Il crée des factures Lightning adressées au membre qui reçoit le tour, et conserve la trace des règlements.

Le service ne détient pas de caisse commune. L'argent va directement du portefeuille du cotisant à celui du bénéficiaire.

### 2. Statut du service

TontineSats n'est ni une banque, ni un établissement de paiement, ni un conseiller financier. Nous ne gérons pas vos fonds, nous ne garantissons pas qu'une tontine se réunira, et nous ne promettons aucun rendement.

Les montants en francs CFA sont affichés pour votre confort. Le montant réellement payé est libellé en satoshis.

### 3. Conditions d'accès

Vous devez avoir au moins 18 ans, disposer de la capacité juridique, et utiliser le service conformément à la loi de votre pays de résidence.

### 4. Vos clés et votre récupération

Votre clé privée Nostr et votre phrase de récupération sont générées sur votre appareil. Nous ne les recevons pas et ne les conservons pas.

Si vous perdez l'une ou l'autre, personne ne peut restaurer votre accès ni votre historique. L'équipe de TontineSats ne vous demandera jamais votre phrase de récupération ni votre clé privée.

### 5. Paiements

Les paiements passent par le réseau Lightning et sont définitifs. Un paiement réglé ne peut être ni annulé, ni contesté, ni remboursé par nos soins.

Avant de payer, vérifiez le destinataire et le montant en satoshis. Nous ne pouvons pas récupérer un paiement envoyé au mauvais destinataire ou pour un mauvais montant.

Un paiement peut échouer si l'un des deux nœuds est hors ligne. Le taux de conversion appliqué est fixé à l'ouverture du tour et affiché avant le paiement. Nous le tenons d'alimentateurs tiers, nous ne le garantissons pas, et nous ne compensons pas ses variations.

Le bénéficiaire reçoit des satoshis, pas des francs CFA. La conversion éventuelle lui appartient. Si des membres ne cotisent pas, le tour correspondant peut ne pas être versé.

### 6. La tontine est un accord entre ses membres

Le service fournit l'outil et le registre. L'organisateur fixe le montant, l'ordre de passage et les échéances. Les membres s'accordent entre eux sur les entrées, les sorties et les tours impayés.

Nous ne sommes pas partie à cet accord. Les litiges entre membres se règlent entre eux et l'organisateur. Nous pouvons leur communiquer les enregistrements de transactions disponibles.

### 7. Portefeuille connecté

Si vous connectez un portefeuille par Nostr Wallet Connect, nous conservons la chaîne de connexion chiffrée sur nos serveurs, afin de demander le paiement des factures que nous créons. Elle ne permet pas de déplacer des fonds ailleurs.

Vous pouvez la déconnecter à tout moment depuis les réglages. Utilisez un portefeuille qui ne contient que ce que vous acceptez d'exposer. Si votre appareil ou cette chaîne de connexion est compromise, un tiers peut déclencher des paiements depuis votre portefeuille.

### 8. Services tiers

Le service dépend de prestataires que nous ne contrôlons pas : le nœud Lightning ou le fournisseur de portefeuille qui crée et reçoit les factures, les relais Nostr qui conservent les reçus, les fournisseurs de taux de change, votre portefeuille et votre navigateur.

Leurs conditions, leurs frais et leurs interruptions vous concernent aussi. Nous ne contrôlons pas ce qu'un relais conserve après avoir reçu un événement.

### 9. Mode démonstration

Une version de démonstration peut utiliser des portefeuilles de test sans valeur réelle, réinitialiser des comptes et supprimer des données sans préavis. Le service indique clairement quand ce mode est actif.

### 10. Usage acceptable

Il est interdit d'utiliser le service pour déplacer les fonds d'autrui sans autorisation, blanchir de l'argent, contourner des sanctions ou des obligations fiscales, commettre une fraude, envoyer des invitations non sollicitées, attaquer le service ou les réseaux dont il dépend, ou violer la loi applicable.

Nous pouvons suspendre un accès en cas d'obligation légale, de menace pour la sécurité ou d'usage de cette nature.

### 11. Disponibilité et changements

Le service est en version bêta. Les fonctionnalités peuvent changer ou disparaître. Nous ne garantissons ni une disponibilité continue, ni la compatibilité future de votre navigateur, de votre portefeuille ou d'un relais.

### 12. Absence de garantie

Le service est fourni en l'état. Nous ne garantissons ni l'absence d'erreur, ni l'adéquation à vos besoins, ni l'exactitude ou la disponibilité permanente d'un enregistrement.

### 13. Responsabilité

Dans la limite permise par la loi, nous ne répondons pas des pertes de revenus, d'épargne ou de réputation, ni des dommages indirects liés à l'usage du service, à un transfert Lightning, à une variation de taux ou à un litige entre membres.

Lorsque notre responsabilité ne peut être exclue, elle est limitée au montant que vous nous avez versé pour le service, aujourd'hui nul.

Aucune clause des présentes ne limite les droits que la loi vous accorde en tant que consommateur dans votre pays de résidence.

### 14. Indemnisation

Vous nous indemnisez des réclamations dirigées contre nous en raison d'un usage illicite du service, d'un manquement aux présentes conditions ou à la loi applicable.

### 15. Fin d'usage

Vous pouvez cesser d'utiliser le service et demander la suppression de vos données à tout moment. Les tours déjà réglés restent enregistrés pendant la durée de conservation prévue par la politique de confidentialité.

### 16. Modification des conditions

Chaque version est numérotée et la version acceptée est enregistrée. Une modification substantielle exige une nouvelle acceptation avant de poursuivre l'usage. Continuer après une modification vaut acceptation de celle-ci.

### 17. Droit applicable et litiges

Les présentes conditions sont régies par le droit sénégalais. Les tribunaux de Dakar sont compétents. Les protections impératives dont vous bénéficiez en tant que consommateur dans votre pays de résidence s'appliquent également.

### 18. Contact

Les coordonnées de l'éditeur figurent dans les mentions légales publiées avec le service. Cette version de démonstration ne les contient pas.

---

## Politique de confidentialité

Ce document décrit les données que TontineSats traite, pourquoi, pendant combien de temps, et ce que vous pouvez demander. Il s'applique à toute personne qui utilise le service.

### 1. Données collectées

Nous traitons les données nécessaires au fonctionnement du service : votre clé publique Nostr, votre nom affiché et votre langue ; vos appartenances à des tontines, l'ordre de passage, les tours et les cotisations ; une adresse Lightning ou un identifiant de portefeuille si vous en fournissez un ; la chaîne de connexion NWC chiffrée si vous connectez un portefeuille ; les reçus signés et leurs identifiants ; vos choix de consentement avec la version acceptée, la date, l'heure et la langue ; des journaux techniques contenant votre adresse IP, l'heure des requêtes et les messages d'erreur.

Nous ne demandons ni nom d'état civil, ni adresse postale, ni numéro de téléphone, ni pièce d'identité, ni photo, ni compte bancaire. Nous ne détenons ni caisse commune, ni clé privée, ni phrase de récupération.

### 2. Données conservées sur votre appareil

Votre clé privée, votre phrase de récupération et toute graine de portefeuille restent sur votre appareil. Nous ne les recevons jamais.

Le stockage local de votre navigateur contient aussi votre session, vos préférences de langue et de thème, et la trace de la version des documents que vous avez acceptée. Effacer les données du navigateur supprime ces éléments.

### 3. Finalités et bases

Nous traitons ces données pour faire fonctionner la tontine que vous avez rejointe et tenir le registre des paiements, ce qui est nécessaire à la fourniture du service.

Nous traitons les reçus et votre clé publique pour que vous et vos contreparties puissiez vérifier qu'un paiement a eu lieu. Nous traitons les journaux techniques pour détecter les attaques et les abus.

Nous n'utilisons pas vos données à des fins publicitaires et nous ne les vendons pas.

### 4. Publication des reçus sur Nostr

Lorsqu'un paiement est réglé, le service peut publier un reçu sur des relais Nostr. Un reçu contient l'identifiant de la tontine, le numéro du tour, les clés publiques du payeur et du bénéficiaire, le montant, le hachage du paiement, la date et la signature du bénéficiaire.

Les relais sont publics. Ce qui y est publié peut être copié, indexé et conservé indéfiniment par n'importe qui, y compris par nous. Nous ne pouvons pas retirer un reçu d'un relais ni d'une copie détenue par un tiers.

La publication est facultative. Elle est désactivée jusqu'à votre accord séparé et vous pouvez le retirer à tout moment dans les réglages. Le retrait arrête les publications futures. Il ne supprime pas les copies déjà faites.

### 5. Destinataires

Le nœud Lightning ou le fournisseur de portefeuille reçoit les factures et les données nécessaires à leur règlement. Les relais Nostr reçoivent les clés publiques et les reçus qu'on leur demande de conserver. Les fournisseurs de taux reçoivent les demandes de cours. Votre portefeuille ou votre extension détient vos clés et signe pour vous.

Chacun applique ses propres conditions et sa propre politique de confidentialité.

### 6. Durées de conservation

Les données de tontine, les tours, les cotisations et les reçus sont conservés pendant la durée de vie de la tontine, puis pendant la durée de conservation légale applicable.

Les journaux techniques sont conservés le temps nécessaire à la sécurité du service. Les connexions de portefeuille chiffrées sont conservées jusqu'à leur déconnexion ou la fermeture du compte. Les traces de consentement sont conservées pendant la durée du compte, comme preuve de la version acceptée.

La suppression du compte retire votre profil, votre connexion de portefeuille et vos données de paiement, sous réserve des durées ci-dessus.

### 7. Sécurité

Le trafic est chiffré en transit. Les connexions de portefeuille sont chiffrées au repos. L'accès aux données des membres est limité aux personnes qui en ont besoin pour faire fonctionner le service. Les clés privées, les chaînes de connexion et les preimages ne sont pas écrites dans les journaux.

Aucun système n'est parfaitement sûr. Si vous pensez avoir trouvé une faille, signalez-la avant toute divulgation publique.

### 8. Vos droits

Selon votre lieu de résidence, vous pouvez demander à consulter les données que nous détenons, à les rectifier, à les supprimer, à en recevoir une copie, à vous opposer à un traitement, à retirer un consentement, et à saisir une autorité de protection des données.

Au Sénégal, l'autorité compétente est la Commission de protection des Données Personnelles. En France, la CNIL. Dans les autres pays de l'Union européenne, l'autorité de votre lieu de résidence. Les demandes sont adressées aux coordonnées indiquées dans les mentions légales, dans un délai d'un mois.

Certaines données ne peuvent pas être supprimées. Elles sont déjà copiées dans des relais publics, ou leur conservation est imposée par une obligation fiscale ou comptable. Nous vous indiquons le motif lorsqu'il s'applique.

### 9. Transferts hors du pays

Les relais et les fournisseurs de nœud peuvent se trouver hors du Sénégal et hors de l'Espace économique européen. Vos clés publiques et vos reçus peuvent donc être traités dans un autre pays.

Pour les membres de l'Espace économique européen, le transfert s'appuie sur le mécanisme applicable prévu par le droit européen, à confirmer par un conseil avant la mise en production.

### 10. Mineurs

Le service est destiné aux personnes majeures. Nous ne collectons pas sciemment de données de personnes de moins de 18 ans. Si vous pensez qu'un mineur nous a transmis des données, contactez-nous et nous les supprimons.

### 11. Stockage local et pistage

Le service utilise le stockage local du navigateur pour la session, la langue, le thème et la trace de consentement. Il n'installe pas de cookie publicitaire ou de pistage et ne charge pas de script publicitaire ou analytique tiers.

### 12. Modification de cette politique

Chaque version est numérotée et la version acceptée est enregistrée. Une modification substantielle, notamment sur la publication des reçus, exige une nouvelle acceptation.

### 13. Contact

Les coordonnées du responsable de traitement figurent dans les mentions légales publiées avec le service. Cette version de démonstration ne les contient pas.

---

# English version

The French text above prevails. This translation is provided for readability only.

## Terms and Conditions

### 1. What the service does

TontineSats is software that helps a group run a rotating savings circle. It records members, the payout order, contribution amounts, and settled payments. It creates Lightning invoices addressed to the member receiving that round, and keeps a record of settlements.

The service does not hold pooled funds. Money moves directly from the paying member's wallet to the receiving member's wallet.

### 2. Status of the service

TontineSats is not a bank, a payment institution, or a financial adviser. We do not manage your funds, we do not guarantee that a circle will collect, and we promise no return.

Amounts shown in CFA francs are a convenience. The amount actually paid is denominated in satoshis.

### 3. Eligibility

You must be at least 18 years old, have legal capacity, and use the service in accordance with the law of your country of residence.

### 4. Your keys and your recovery

Your Nostr private key and your recovery phrase are generated on your device. We neither receive nor keep them.

If you lose either one, nobody can restore your access or your history. The TontineSats team will never ask for your recovery phrase or your private key.

### 5. Payments

Payments settle over the Bitcoin Lightning Network and are final. A settled payment cannot be reversed, disputed, or refunded by us.

Before you pay, check the recipient and the amount in satoshis. We cannot recover a payment sent to the wrong recipient or for the wrong amount.

A payment may fail if either node is offline. The exchange rate applied is fixed when the round opens and shown before you pay. We source it from third-party feeds, we do not guarantee it, and we do not cover its movements.

The beneficiary receives satoshis, not CFA francs. Converting them is their decision. If members do not contribute, that round may not pay out.

### 6. The tontine is an agreement between its members

The service provides the tool and the record. The organizer sets the amount, the payout order, and the due dates. Members agree among themselves on who joins, who leaves, and what happens to unpaid rounds.

We are not a party to that agreement. Disputes between members are settled between them and the organizer. We can share the transaction records available on the service.

### 7. Connected wallet

If you connect a wallet through Nostr Wallet Connect, we store the connection string on our servers in encrypted form so we can request payment of the invoices we create. It does not let us move funds anywhere else.

You can disconnect it at any time in settings. Use a wallet holding only what you accept to expose. If your device or that connection string is compromised, a third party may trigger payments from your wallet.

### 8. Third-party services

The service depends on providers we do not control: the Lightning node or wallet provider that creates and receives invoices, the Nostr relays that store receipts, price feed providers, your wallet, and your browser.

Their terms, their fees, and their outages apply to you as well. We do not control what a relay keeps after it receives an event.

### 9. Demo mode

A demonstration build may use test wallets with no real value, reset accounts, and delete data without notice. The service states clearly when this mode is active.

### 10. Acceptable use

Do not use the service to move someone else's funds without authorization, to launder money, to evade sanctions or tax obligations, to commit fraud, to send unsolicited invitations, to attack the service or the networks it depends on, or to break applicable law.

We may suspend access where a legal duty applies, where there is a security threat, or where use of this kind is detected.

### 11. Availability and changes

The service is beta software. Features may change or disappear. We guarantee neither continuous availability nor future compatibility with your browser, your wallet, or a relay.

### 12. No warranty

The service is provided as is. We warrant neither freedom from error, nor fitness for your needs, nor the accuracy or permanent availability of any record.

### 13. Liability

To the fullest extent the law allows, we are not liable for lost profits, lost savings, lost reputation, or indirect loss arising from your use of the service, a Lightning transfer, a rate movement, or a dispute between members.

Where liability cannot be excluded, it is limited to the amount you paid us for the service, which is currently zero.

Nothing here limits rights the law grants you as a consumer in your country of residence.

### 14. Indemnity

You indemnify us against claims brought against us because you used the service unlawfully, in breach of these terms, or in breach of applicable law.

### 15. Ending use

You may stop using the service and request deletion of your data at any time. Completed rounds remain recorded for the retention period set out in the Privacy Policy.

### 16. Changes to these terms

Every version is numbered and the version you accepted is recorded. A material change requires a new acceptance before you continue. Continuing after a change means you accept it.

### 17. Governing law and disputes

These terms are governed by Senegalese law. The courts of Dakar have jurisdiction. Mandatory protections you enjoy as a consumer in your country of residence also apply.

### 18. Contact

The operator's contact details appear in the legal notice published with the service. This demonstration version does not contain them.

## Privacy Policy

### 1. Data we collect

We process the data the service needs: your Nostr public key, display name, and language; your circle memberships, the payout order, rounds, and contributions; a Lightning address or wallet identifier if you provide one; the encrypted NWC connection string if you connect a wallet; signed receipts and their identifiers; your consent choices with the accepted version, date, time, and language; technical logs containing your IP address, request times, and error messages.

We do not ask for your civil name, postal address, phone number, identity document, photo, or bank account. We hold no pooled funds, no private key, and no recovery phrase.

### 2. Data kept on your device

Your private key, your recovery phrase, and any wallet seed stay on your device. We never receive them.

Your browser's local storage also holds your session, your language and theme choices, and the record of which document version you accepted. Clearing browser data removes these items.

### 3. Purposes and bases

We process this data to run the circle you joined and to keep the payment record, which is necessary to provide the service.

We process receipts and your public key so that you and your counterparties can verify that a payment happened. We process technical logs to detect attacks and abuse.

We do not use your data for advertising and we do not sell it.

### 4. Publishing receipts on Nostr

When a payment settles, the service may publish a receipt to Nostr relays. A receipt contains the circle identifier, the round number, the payer and beneficiary public keys, the amount, the payment hash, the date, and the beneficiary's signature.

Relays are public. Anything published there can be copied, indexed, and kept indefinitely by anyone, including us. We cannot remove a receipt from a relay or from a copy held by a third party.

Publishing is optional. It stays off until your separate agreement, and you can withdraw that agreement at any time in settings. Withdrawal stops future publication. It does not remove copies already made.

### 5. Recipients

The Lightning node or wallet provider receives invoices and the data needed to settle them. Nostr relays receive the public keys and receipts they are asked to store. Price feed providers receive rate requests. Your wallet or extension holds your keys and signs for you.

Each of them applies its own terms and its own privacy policy.

### 6. Retention

Circle, round, contribution, and receipt data is kept for the life of the circle, then for the applicable legal retention period.

Technical logs are kept for as long as the security of the service requires. Encrypted wallet connections are kept until you disconnect them or close the account. Consent records are kept for the life of the account, as proof of the version accepted.

Deleting your account removes your profile, your wallet connection, and your payment data, subject to the periods above.

### 7. Security

Traffic is encrypted in transit. Wallet connections are encrypted at rest. Access to member data is limited to the people who need it to run the service. Private keys, connection strings, and preimages are not written to logs.

No system is perfectly secure. If you think you have found a vulnerability, report it before public disclosure.

### 8. Your rights

Depending on where you live, you may ask to see the data we hold, to correct it, to delete it, to receive a copy, to object to processing, to withdraw consent, and to complain to a data protection authority.

In Senegal, the competent authority is the Commission de protection des Données Personnelles. In France, the CNIL. In other European Union countries, the authority where you live. Requests go to the contact details in the legal notice, within one month.

Some data cannot be deleted. It is already copied into public relays, or its retention is required by tax or accounting rules. We state the reason when that applies.

### 9. Transfers outside your country

Relays and node providers may be located outside Senegal and outside the European Economic Area. Your public keys and receipts may therefore be processed in another country.

For members in the European Economic Area, the transfer relies on the applicable mechanism under European law, to be confirmed by counsel before production.

### 10. Children

The service is for adults. We do not knowingly collect data from anyone under 18. If you believe a child gave us data, contact us and we delete it.

### 11. Local storage and tracking

The service uses browser local storage for the session, language, theme, and consent record. It sets no advertising or tracking cookie and loads no third-party advertising or analytics script.

### 12. Changes to this policy

Every version is numbered and the version you accepted is recorded. A material change, in particular to receipt publication, requires a new acceptance.

### 13. Contact

The controller's contact details appear in the legal notice published with the service. This demonstration version does not contain them.
