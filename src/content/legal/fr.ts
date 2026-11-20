import type { LegalDocument } from './types'

const terms: LegalDocument = {
  title: 'Conditions générales',
  intro:
    'Ce document décrit ce que TontineSats fait, ce qu’il ne fait pas, et ce que vous acceptez en l’utilisant. Il s’applique à toute personne qui crée une identité, rejoint une tontine ou reçoit un paiement par le service.',
  sections: [
    {
      heading: '1. Ce que le service fait',
      body: [
        'TontineSats est un logiciel qui aide un groupe à organiser une tontine. Il enregistre les membres, l’ordre de passage, le montant des cotisations et les paiements réglés. Il crée des factures Lightning adressées au membre qui reçoit le tour, et conserve la trace des règlements.',
        'Le service ne détient pas de caisse commune. L’argent va directement du portefeuille du cotisant à celui du bénéficiaire.',
      ],
    },
    {
      heading: '2. Statut du service',
      body: [
        'TontineSats n’est ni une banque, ni un établissement de paiement, ni un conseiller financier. Nous ne gérons pas vos fonds, nous ne garantissons pas qu’une tontine se réunira, et nous ne promettons aucun rendement.',
        'Les montants en francs CFA sont affichés pour votre confort. Le montant réellement payé est libellé en satoshis.',
      ],
    },
    {
      heading: '3. Conditions d’accès',
      body: [
        'Vous devez avoir au moins 18 ans, disposer de la capacité juridique, et utiliser le service conformément à la loi de votre pays de résidence.',
      ],
    },
    {
      heading: '4. Vos clés et votre récupération',
      body: [
        'Votre clé privée Nostr et votre phrase de récupération sont générées sur votre appareil. Nous ne les recevons pas et ne les conservons pas.',
        'Si vous perdez l’une ou l’autre, personne ne peut restaurer votre accès ni votre historique. L’équipe de TontineSats ne vous demandera jamais votre phrase de récupération ni votre clé privée.',
      ],
    },
    {
      heading: '5. Paiements',
      body: [
        'Les paiements passent par le réseau Lightning et sont définitifs. Un paiement réglé ne peut être ni annulé, ni contesté, ni remboursé par nos soins.',
        'Avant de payer, vérifiez le destinataire et le montant en satoshis. Nous ne pouvons pas récupérer un paiement envoyé au mauvais destinataire ou pour un mauvais montant.',
        'Un paiement peut échouer si l’un des deux nœuds est hors ligne. Le taux de conversion appliqué est fixé à l’ouverture du tour et affiché avant le paiement. Nous le tenons d’alimentateurs tiers, nous ne le garantissons pas, et nous ne compensons pas ses variations.',
        'Le bénéficiaire reçoit des satoshis, pas des francs CFA. La conversion éventuelle lui appartient. Si des membres ne cotisent pas, le tour correspondant peut ne pas être versé.',
      ],
    },
    {
      heading: '6. La tontine est un accord entre ses membres',
      body: [
        'Le service fournit l’outil et le registre. L’organisateur fixe le montant, l’ordre de passage et les échéances. Les membres s’accordent entre eux sur les entrées, les sorties et les tours impayés.',
        'Nous ne sommes pas partie à cet accord. Les litiges entre membres se règlent entre eux et l’organisateur. Nous pouvons leur communiquer les enregistrements de transactions disponibles.',
      ],
    },
    {
      heading: '7. Portefeuille connecté',
      body: [
        'Si vous connectez un portefeuille par Nostr Wallet Connect, nous conservons la chaîne de connexion chiffrée sur nos serveurs, afin de demander le paiement des factures que nous créons. Elle ne permet pas de déplacer des fonds ailleurs.',
        'Vous pouvez la déconnecter à tout moment depuis les réglages. Utilisez un portefeuille qui ne contient que ce que vous acceptez d’exposer. Si votre appareil ou cette chaîne de connexion est compromise, un tiers peut déclencher des paiements depuis votre portefeuille.',
      ],
    },
    {
      heading: '8. Services tiers',
      body: [
        'Le service dépend de prestataires que nous ne contrôlons pas : le nœud Lightning ou le fournisseur de portefeuille qui crée et reçoit les factures, les relais Nostr qui conservent les reçus, les fournisseurs de taux de change, votre portefeuille et votre navigateur.',
        'Leurs conditions, leurs frais et leurs interruptions vous concernent aussi. Nous ne contrôlons pas ce qu’un relais conserve après avoir reçu un événement.',
      ],
    },
    {
      heading: '9. Mode démonstration',
      body: [
        'Une version de démonstration peut utiliser des portefeuilles de test sans valeur réelle, réinitialiser des comptes et supprimer des données sans préavis. Le service indique clairement quand ce mode est actif.',
      ],
    },
    {
      heading: '10. Usage acceptable',
      body: [
        'Il est interdit d’utiliser le service pour déplacer les fonds d’autrui sans autorisation, blanchir de l’argent, contourner des sanctions ou des obligations fiscales, commettre une fraude, envoyer des invitations non sollicitées, attaquer le service ou les réseaux dont il dépend, ou violer la loi applicable.',
        'Nous pouvons suspendre un accès en cas d’obligation légale, de menace pour la sécurité ou d’usage de cette nature.',
      ],
    },
    {
      heading: '11. Disponibilité et changements',
      body: [
        'Le service est en version bêta. Les fonctionnalités peuvent changer ou disparaître. Nous ne garantissons ni une disponibilité continue, ni la compatibilité future de votre navigateur, de votre portefeuille ou d’un relais.',
      ],
    },
    {
      heading: '12. Absence de garantie',
      body: [
        'Le service est fourni en l’état. Nous ne garantissons ni l’absence d’erreur, ni l’adéquation à vos besoins, ni l’exactitude ou la disponibilité permanente d’un enregistrement.',
      ],
    },
    {
      heading: '13. Responsabilité',
      body: [
        'Dans la limite permise par la loi, nous ne répondons pas des pertes de revenus, d’épargne ou de réputation, ni des dommages indirects liés à l’usage du service, à un transfert Lightning, à une variation de taux ou à un litige entre membres.',
        'Lorsque notre responsabilité ne peut être exclue, elle est limitée au montant que vous nous avez versé pour le service, aujourd’hui nul.',
        'Aucune clause des présentes ne limite les droits que la loi vous accorde en tant que consommateur dans votre pays de résidence.',
      ],
    },
    {
      heading: '14. Indemnisation',
      body: [
        'Vous nous indemnisez des réclamations dirigées contre nous en raison d’un usage illicite du service, d’un manquement aux présentes conditions ou à la loi applicable.',
      ],
    },
    {
      heading: '15. Fin d’usage',
      body: [
        'Vous pouvez cesser d’utiliser le service et demander la suppression de vos données à tout moment. Les tours déjà réglés restent enregistrés pendant la durée de conservation prévue par la politique de confidentialité.',
      ],
    },
    {
      heading: '16. Modification des conditions',
      body: [
        'Chaque version est numérotée et la version acceptée est enregistrée. Une modification substantielle exige une nouvelle acceptation avant de poursuivre l’usage. Continuer après une modification vaut acceptation de celle-ci.',
      ],
    },
    {
      heading: '17. Droit applicable et litiges',
      body: [
        'Les présentes conditions sont régies par le droit sénégalais. Les tribunaux de Dakar sont compétents. Les protections impératives dont vous bénéficiez en tant que consommateur dans votre pays de résidence s’appliquent également.',
      ],
    },
    {
      heading: '18. Contact',
      body: [
        'Les coordonnées de l’éditeur figurent dans les mentions légales publiées avec le service. Cette version de démonstration ne les contient pas.',
      ],
    },
  ],
}

const privacy: LegalDocument = {
  title: 'Politique de confidentialité',
  intro:
    'Ce document décrit les données que TontineSats traite, pourquoi, pendant combien de temps, et ce que vous pouvez demander. Il s’applique à toute personne qui utilise le service.',
  sections: [
    {
      heading: '1. Données collectées',
      body: [
        'Nous traitons les données nécessaires au fonctionnement du service : votre clé publique Nostr, votre nom affiché et votre langue ; vos appartenances à des tontines, l’ordre de passage, les tours et les cotisations ; une adresse Lightning ou un identifiant de portefeuille si vous en fournissez un ; la chaîne de connexion NWC chiffrée si vous connectez un portefeuille ; les reçus signés et leurs identifiants ; vos choix de consentement avec la version acceptée, la date, l’heure et la langue ; des journaux techniques contenant votre adresse IP, l’heure des requêtes et les messages d’erreur.',
        'Nous ne demandons ni nom d’état civil, ni adresse postale, ni numéro de téléphone, ni pièce d’identité, ni photo, ni compte bancaire. Nous ne détenons ni caisse commune, ni clé privée, ni phrase de récupération.',
      ],
    },
    {
      heading: '2. Données conservées sur votre appareil',
      body: [
        'Votre clé privée, votre phrase de récupération et toute graine de portefeuille restent sur votre appareil. Nous ne les recevons jamais.',
        'Le stockage local de votre navigateur contient aussi votre session, vos préférences de langue et de thème, et la trace de la version des documents que vous avez acceptée. Effacer les données du navigateur supprime ces éléments.',
      ],
    },
    {
      heading: '3. Finalités et bases',
      body: [
        'Nous traitons ces données pour faire fonctionner la tontine que vous avez rejointe et tenir le registre des paiements, ce qui est nécessaire à la fourniture du service.',
        'Nous traitons les reçus et votre clé publique pour que vous et vos contreparties puissiez vérifier qu’un paiement a eu lieu. Nous traitons les journaux techniques pour détecter les attaques et les abus.',
        'Nous n’utilisons pas vos données à des fins publicitaires et nous ne les vendons pas.',
      ],
    },
    {
      heading: '4. Publication des reçus sur Nostr',
      body: [
        'Lorsqu’un paiement est réglé, le service peut publier un reçu sur des relais Nostr. Un reçu contient l’identifiant de la tontine, le numéro du tour, les clés publiques du payeur et du bénéficiaire, le montant, le hachage du paiement, la date et la signature du bénéficiaire.',
        'Les relais sont publics. Ce qui y est publié peut être copié, indexé et conservé indéfiniment par n’importe qui, y compris par nous. Nous ne pouvons pas retirer un reçu d’un relais ni d’une copie détenue par un tiers.',
        'La publication est facultative. Elle est désactivée jusqu’à votre accord séparé et vous pouvez le retirer à tout moment dans les réglages. Le retrait arrête les publications futures. Il ne supprime pas les copies déjà faites.',
      ],
    },
    {
      heading: '5. Destinataires',
      body: [
        'Le nœud Lightning ou le fournisseur de portefeuille reçoit les factures et les données nécessaires à leur règlement. Les relais Nostr reçoivent les clés publiques et les reçus qu’on leur demande de conserver. Les fournisseurs de taux reçoivent les demandes de cours. Votre portefeuille ou votre extension détient vos clés et signe pour vous.',
        'Chacun applique ses propres conditions et sa propre politique de confidentialité.',
      ],
    },
    {
      heading: '6. Durées de conservation',
      body: [
        'Les données de tontine, les tours, les cotisations et les reçus sont conservés pendant la durée de vie de la tontine, puis pendant la durée de conservation légale applicable.',
        'Les journaux techniques sont conservés le temps nécessaire à la sécurité du service. Les connexions de portefeuille chiffrées sont conservées jusqu’à leur déconnexion ou la fermeture du compte. Les traces de consentement sont conservées pendant la durée du compte, comme preuve de la version acceptée.',
        'La suppression du compte retire votre profil, votre connexion de portefeuille et vos données de paiement, sous réserve des durées ci-dessus.',
      ],
    },
    {
      heading: '7. Sécurité',
      body: [
        'Le trafic est chiffré en transit. Les connexions de portefeuille sont chiffrées au repos. L’accès aux données des membres est limité aux personnes qui en ont besoin pour faire fonctionner le service. Les clés privées, les chaînes de connexion et les preimages ne sont pas écrites dans les journaux.',
        'Aucun système n’est parfaitement sûr. Si vous pensez avoir trouvé une faille, signalez-la avant toute divulgation publique.',
      ],
    },
    {
      heading: '8. Vos droits',
      body: [
        'Selon votre lieu de résidence, vous pouvez demander à consulter les données que nous détenons, à les rectifier, à les supprimer, à en recevoir une copie, à vous opposer à un traitement, à retirer un consentement, et à saisir une autorité de protection des données.',
        'Au Sénégal, l’autorité compétente est la Commission de protection des Données Personnelles. En France, la CNIL. Dans les autres pays de l’Union européenne, l’autorité de votre lieu de résidence. Les demandes sont adressées aux coordonnées indiquées dans les mentions légales, dans un délai d’un mois.',
        'Certaines données ne peuvent pas être supprimées. Elles sont déjà copiées dans des relais publics, ou leur conservation est imposée par une obligation fiscale ou comptable. Nous vous indiquons le motif lorsqu’il s’applique.',
      ],
    },
    {
      heading: '9. Transferts hors du pays',
      body: [
        'Les relais et les fournisseurs de nœud peuvent se trouver hors du Sénégal et hors de l’Espace économique européen. Vos clés publiques et vos reçus peuvent donc être traités dans un autre pays.',
        'Pour les membres de l’Espace économique européen, le transfert s’appuie sur le mécanisme applicable prévu par le droit européen, à confirmer par un conseil avant la mise en production.',
      ],
    },
    {
      heading: '10. Mineurs',
      body: [
        'Le service est destiné aux personnes majeures. Nous ne collectons pas sciemment de données de personnes de moins de 18 ans. Si vous pensez qu’un mineur nous a transmis des données, contactez-nous et nous les supprimons.',
      ],
    },
    {
      heading: '11. Stockage local et pistage',
      body: [
        'Le service utilise le stockage local du navigateur pour la session, la langue, le thème et la trace de consentement. Il n’installe pas de cookie publicitaire ou de pistage et ne charge pas de script publicitaire ou analytique tiers.',
      ],
    },
    {
      heading: '12. Modification de cette politique',
      body: [
        'Chaque version est numérotée et la version acceptée est enregistrée. Une modification substantielle, notamment sur la publication des reçus, exige une nouvelle acceptation.',
      ],
    },
    {
      heading: '13. Contact',
      body: [
        'Les coordonnées du responsable de traitement figurent dans les mentions légales publiées avec le service. Cette version de démonstration ne les contient pas.',
      ],
    },
  ],
}

export const fr = { terms, privacy }
