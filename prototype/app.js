/* TontineSats interactive prototype · state, i18n, motion orchestration. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const XOF_PER_EUR = 655.957;
  const SATS_PER_EUR = 1100;
  const CONTRIBUTION = 24000;
  const MEMBER_COUNT = 8;
  const POT = CONTRIBUTION * MEMBER_COUNT;

  const PERSONAS = {
    awa: {
      name: 'Awa Diop', initials: 'AD', city: 'Dakar', role: 'Organisatrice',
      method: 'nwc', currency: 'xof', npub: 'npub1t9…4m2q',
      stats: { contribs: 12, onTime: 100, receipts: 12, circles: 3 },
    },
    moussa: {
      name: 'Moussa Diallo', initials: 'MD', city: 'Paris', role: 'Diaspora',
      method: 'nwc', currency: 'eur', npub: 'npub1q8…7x3v',
      stats: { contribs: 8, onTime: 100, receipts: 8, circles: 2 },
    },
    fatou: {
      name: 'Fatou Ndiaye', initials: 'FN', city: 'Thiès', role: 'Membre',
      method: 'qr', currency: 'xof', npub: 'npub1k2…5p9r',
      stats: { contribs: 5, onTime: 80, receipts: 4, circles: 1 },
    },
  };

  const ROUNDS = {
    3: { beneficiary: 'Mariama Sow', date: '12 nov. 2026', short: '12 nov.', times: ['16:02', '18:04', '18:04', '18:05'] },
    2: { beneficiary: 'Moussa Diallo', date: '12 oct. 2026', short: '12 oct.', times: ['16:10', '17:52', '17:52', '17:53'] },
    1: { beneficiary: 'Awa Diop', date: '12 sept. 2026', short: '12 sept.', times: ['15:48', '18:20', '18:20', '18:21'] },
  };

  const MEMBERS = [
    { order: 1, name: 'Awa Diop', initials: 'AD', status: 'paid', round: 1, npub: 'npub1t9…4m2q' },
    { order: 2, name: 'Moussa Diallo', initials: 'MD', status: 'paid', round: 2, npub: 'npub1q8…7x3v' },
    { order: 3, name: 'Mariama Sow', initials: 'MS', status: 'current', round: 3, npub: 'npub1m7…k2cd' },
    { order: 4, name: 'Fatou Ndiaye', initials: 'FN', status: 'waiting', round: 4, npub: 'npub1k2…5p9r' },
    { order: 5, name: 'Ibrahima Fall', initials: 'IF', status: 'waiting', round: 5, npub: 'npub1a4…9df1' },
    { order: 6, name: 'Aïssatou Ba', initials: 'AB', status: 'waiting', round: 6, npub: 'npub1z6…2gh8' },
    { order: 7, name: 'Ousmane Sarr', initials: 'OS', status: 'waiting', round: 7, npub: 'npub1p8…4kl2' },
    { order: 8, name: 'Khady Ndiaye', initials: 'KN', status: 'waiting', round: 8, npub: 'npub1r3…7mn5' },
  ];

  const EVENTS = {
    '2026-11-12': { round: 3, kind: 'due', display: '12 nov. 2026', short: '12 nov.' },
    '2026-10-12': { round: 2, kind: 'receipt', display: '12 oct. 2026', short: '12 oct.' },
    '2026-09-12': { round: 1, kind: 'receipt', display: '12 sept. 2026', short: '12 sept.' },
  };

  const params = new URLSearchParams(location.search);
  const rawHash = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const hash = rawHash.split('?')[0].replace(/\/(static|noboot)$/, '');
  const hashStatic = rawHash.includes('static');
  const hashNoBoot = rawHash.includes('noboot');
  const forceStatic = params.get('shot') === '1' || params.get('reduce') === '1' || hashStatic;

  const state = {
    view: 'dashboard',
    persona: 'awa',
    currency: 'xof',
    method: 'nwc',
    locale: 'fr',
    theme: 'light',
    reduce: forceStatic || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    hidden: false,
    paid: false,
    joined: false,
    payStep: 'form',
    receiptRound: 3,
    calendar: { year: 2026, month: 10, day: null },
    member: null,
    sheet: null,
  };

  const I18N = {
    fr: {
      'app.kicker': 'TontineSats',
      'action.invite': 'Inviter', 'action.switchPersona': 'Changer de personne',
      'action.hideAmounts': 'Masquer les montants',
      'action.sharePassport': 'Partager mon passeport', 'action.copyNpub': 'Copier mon npub',
      'action.back': 'Retour', 'action.copyCode': 'Copier le code', 'action.close': 'Fermer',
      'circle.potLabel': 'Cagnotte du tour',
      'circle.confirmed': 'cotisations confirmées',
      'circle.yourContribution': 'Votre cotisation',
      'circle.roundProgress': 'Avancement du tour',
      'circle.rotation': 'Ordre de passage', 'circle.allMembers': '8 membres',
      'circle.footnote': 'Chaque membre paie le bénéficiaire du tour. TontineSats ne détient jamais les fonds.',
      'circle.paidTitle': 'Cotisation payée', 'circle.paidMeta': 'Reçu signé le 12 nov. à 18:05',
      'row.paidOn': 'Payé · 12 oct.', 'row.receives': 'Reçoit 192 000 FCFA',
      'row.dueLater': 'Échéance dans 7 jours',
      'status.paid': 'Payé', 'status.current': 'Ce tour', 'status.waiting': 'En attente',
      'activity.title': 'Activité',
      'activity.prevMonth': 'Mois précédent', 'activity.nextMonth': 'Mois suivant',
      'activity.filterHint': 'Touchez un jour pour filtrer.',
      'activity.filteredHint': 'Filtré sur {date}. Touchez à nouveau pour tout voir.',
      'activity.dayEmpty': 'Aucune activité ce jour.',
      'activity.clearDay': 'Voir tout',
      'activity.roundReceipt': 'Tour {round} · reçu signé',
      'activity.due': 'À payer', 'activity.history': 'Historique',
      'activity.note': 'Chaque ligne correspond à un reçu co-signé, pas à un simple pointage.',
      'activity.dueTitle': 'Cotisation · Tour 3', 'activity.dueSub': 'Aujourd’hui · 18:00',
      'activity.emptyTitle': 'Aucune cotisation pour l’instant',
      'activity.emptySub': 'Vous venez de rejoindre la tontine. Votre premier reçu apparaîtra ici après le paiement.',
      'activity.emptyCta': 'Voir le tour en cours',
      'passport.title': 'Passeport', 'passport.onTime': 'à l’heure', 'passport.stamp': 'Vérifié',
      'passport.contributions': 'Cotisations', 'passport.receipts': 'Reçus signés', 'passport.circles': 'Cercles',
      'passport.proofs': 'Preuves récentes', 'passport.portable': 'Portable',
      'passport.note': 'Les reçus sont co-signés par le bénéficiaire. Ils restent lisibles hors de TontineSats.',
      'receipt.title': 'Reçu de cotisation', 'receipt.verified': 'Vérifié',
      'receipt.amountLabel': 'Montant reçu', 'receipt.proof': 'Preuve de paiement',
      'receipt.step1': 'Facture BOLT11 émise', 'receipt.step2': 'Paiement reçu',
      'receipt.step3': 'Preimage vérifié', 'receipt.step4': 'Reçu Nostr co-signé',
      'receipt.breakdown': 'Détail', 'receipt.gross': 'Cotisation',
      'receipt.fee': 'Frais réseau', 'receipt.net': 'Reçu par le bénéficiaire',
      'receipt.details': 'Références', 'receipt.payer': 'Payeur', 'receipt.beneficiary': 'Bénéficiaire',
      'receipt.copy': 'Copier le reçu', 'receipt.share': 'Partager',
      'settings.title': 'Réglages', 'settings.language': 'Langue',
      'settings.theme': 'Thème', 'settings.light': 'Clair', 'settings.dark': 'Sombre', 'settings.system': 'Système',
      'settings.motion': 'Animations', 'settings.reduceMotion': 'Réduire les animations',
      'settings.reduceMotionSub': 'Coupe les effets de mouvement, garde les états.',
      'settings.about': 'À propos', 'settings.version': 'Version', 'settings.network': 'Réseau',
      'settings.replay': 'Rejouer la démo',
      'settings.note': 'Prototype de démonstration. Les montants et les personas viennent du PRD, les soldes ne sont pas réels.',
      'join.title': 'Rejoindre', 'join.invited': 'Vous êtes invité à', 'join.code': 'Code d’invitation',
      'join.whatsapp': 'Partager sur WhatsApp', 'join.cta': 'Rejoindre la tontine',
      'join.note': 'Aucun email ni téléphone. Votre identité est une clé Nostr, gardée sur cet appareil.',
      'nav.circle': 'Tontine', 'nav.activity': 'Activité', 'nav.passport': 'Passeport', 'nav.settings': 'Réglages',
      'pay.title': 'Cotiser · Tour 3', 'pay.methodLegend': 'Moyen de paiement',
      'pay.cta': 'Payer',
      'pay.nwc': 'Paiement automatique', 'pay.nwcSub': 'Alby · budget 50 000 sats / jour', 'pay.recommended': 'Conseillé',
      'pay.qr': 'QR Lightning', 'pay.qrSub': 'Payer depuis une autre application',
      'pay.fee': 'Frais Lightning estimés ≈ 12 FCFA',
      'pay.trust': 'Vous payez directement Mariama Sow. TontineSats ne détient jamais les fonds.',
      'pay.waiting': 'En attente du paiement', 'pay.simulate': 'Simuler le paiement',
      'pay.demoQr': 'QR de démonstration',
      'pay.processing': 'Règlement Lightning en cours', 'pay.stage1': 'Demande de facture',
      'pay.stage2': 'Signature et envoi', 'pay.stage3': 'Règlement',
      'pay.processingHint': 'Vous pouvez fermer, le paiement continue.',
      'pay.success': 'Paiement reçu', 'pay.successSub': 'Preimage vérifié · reçu co-signé par Mariama Sow',
      'pay.seeReceipt': 'Voir le reçu', 'pay.close': 'Fermer',
      'pay.expired': 'Facture expirée', 'pay.expiredSub': 'La facture Lightning a expiré. Relancez le paiement.',
      'pay.retry': 'Réessayer',
      'persona.title': 'Changer de personne', 'persona.note': 'Trois points de vue sur la même tontine.',
      'member.title': 'Membre', 'member.order': 'Ordre de passage', 'member.status': 'Statut',
      'member.receipt': 'Voir le reçu', 'member.pay': 'Cotiser pour ce tour',
      'member.reminder': 'Copier un rappel',
      'member.reminderText': 'Rappel : cotisation de {amount} pour la Tontine Sandaga, tour {round}.',
      'live.copied': 'Copié', 'live.copyFail': 'Copie impossible sur ce navigateur',
      'live.joined': 'Vous avez rejoint la tontine',
      'live.persona': 'Vue : {name} · {city}',
      'live.language': 'Langue : {lang}',
      'live.replayed': 'Démo réinitialisée',
      'share.receipt': 'Reçu TontineSats · {amount} · {date}',
    },
    en: {
      'app.kicker': 'TontineSats',
      'action.invite': 'Invite', 'action.switchPersona': 'Switch person',
      'action.hideAmounts': 'Hide amounts',
      'action.sharePassport': 'Share my passport', 'action.copyNpub': 'Copy my npub',
      'action.back': 'Back', 'action.copyCode': 'Copy code', 'action.close': 'Close',
      'circle.potLabel': 'This round’s pot',
      'circle.confirmed': 'contributions confirmed',
      'circle.yourContribution': 'Your contribution',
      'circle.roundProgress': 'Round progress',
      'circle.rotation': 'Payout order', 'circle.allMembers': '8 members',
      'circle.footnote': 'Each member pays the round’s beneficiary. TontineSats never holds the funds.',
      'circle.paidTitle': 'Contribution paid', 'circle.paidMeta': 'Signed receipt on Nov 12 at 18:05',
      'row.paidOn': 'Paid · Oct 12', 'row.receives': 'Receives 192,000 FCFA',
      'row.dueLater': 'Due in 7 days',
      'status.paid': 'Paid', 'status.current': 'This round', 'status.waiting': 'Waiting',
      'activity.title': 'Activity',
      'activity.prevMonth': 'Previous month', 'activity.nextMonth': 'Next month',
      'activity.filterHint': 'Tap a day to filter.',
      'activity.filteredHint': 'Filtered to {date}. Tap again to show everything.',
      'activity.dayEmpty': 'Nothing on this day.',
      'activity.clearDay': 'Show all',
      'activity.roundReceipt': 'Round {round} · signed receipt',
      'activity.due': 'To pay', 'activity.history': 'History',
      'activity.note': 'Every row is a co-signed receipt, not a manual tick.',
      'activity.dueTitle': 'Contribution · Round 3', 'activity.dueSub': 'Today · 18:00',
      'activity.emptyTitle': 'No contributions yet',
      'activity.emptySub': 'You just joined the tontine. Your first receipt will appear here after payment.',
      'activity.emptyCta': 'See the current round',
      'passport.title': 'Passport', 'passport.onTime': 'on time', 'passport.stamp': 'Verified',
      'passport.contributions': 'Contributions', 'passport.receipts': 'Signed receipts', 'passport.circles': 'Circles',
      'passport.proofs': 'Recent proofs', 'passport.portable': 'Portable',
      'passport.note': 'Receipts are co-signed by the beneficiary. They stay readable outside TontineSats.',
      'receipt.title': 'Contribution receipt', 'receipt.verified': 'Verified',
      'receipt.amountLabel': 'Amount received', 'receipt.proof': 'Payment proof',
      'receipt.step1': 'BOLT11 invoice issued', 'receipt.step2': 'Payment received',
      'receipt.step3': 'Preimage verified', 'receipt.step4': 'Nostr receipt co-signed',
      'receipt.breakdown': 'Breakdown', 'receipt.gross': 'Contribution',
      'receipt.fee': 'Network fee', 'receipt.net': 'Received by beneficiary',
      'receipt.details': 'References', 'receipt.payer': 'Payer', 'receipt.beneficiary': 'Beneficiary',
      'receipt.copy': 'Copy receipt', 'receipt.share': 'Share',
      'settings.title': 'Settings', 'settings.language': 'Language',
      'settings.theme': 'Theme', 'settings.light': 'Light', 'settings.dark': 'Dark', 'settings.system': 'System',
      'settings.motion': 'Motion', 'settings.reduceMotion': 'Reduce motion',
      'settings.reduceMotionSub': 'Turns off movement effects, keeps the states.',
      'settings.about': 'About', 'settings.version': 'Version', 'settings.network': 'Network',
      'settings.replay': 'Replay the demo',
      'settings.note': 'Demo prototype. Amounts and personas come from the PRD; balances are not real.',
      'join.title': 'Join', 'join.invited': 'You are invited to', 'join.code': 'Invite code',
      'join.whatsapp': 'Share on WhatsApp', 'join.cta': 'Join the tontine',
      'join.note': 'No email, no phone number. Your identity is a Nostr key kept on this device.',
      'nav.circle': 'Tontine', 'nav.activity': 'Activity', 'nav.passport': 'Passport', 'nav.settings': 'Settings',
      'pay.title': 'Contribute · Round 3', 'pay.methodLegend': 'Payment method',
      'pay.cta': 'Pay',
      'pay.nwc': 'Automatic payment', 'pay.nwcSub': 'Alby · 50,000 sats/day budget', 'pay.recommended': 'Recommended',
      'pay.qr': 'Lightning QR', 'pay.qrSub': 'Pay from another wallet',
      'pay.fee': 'Estimated Lightning fee ≈ 12 FCFA',
      'pay.trust': 'You pay Mariama Sow directly. TontineSats never holds the funds.',
      'pay.waiting': 'Waiting for payment', 'pay.simulate': 'Simulate payment',
      'pay.demoQr': 'Demo QR',
      'pay.processing': 'Lightning settlement in progress', 'pay.stage1': 'Requesting invoice',
      'pay.stage2': 'Signing and sending', 'pay.stage3': 'Settling',
      'pay.processingHint': 'You can close this, the payment continues.',
      'pay.success': 'Payment received', 'pay.successSub': 'Preimage verified · receipt co-signed by Mariama Sow',
      'pay.seeReceipt': 'See receipt', 'pay.close': 'Close',
      'pay.expired': 'Invoice expired', 'pay.expiredSub': 'The Lightning invoice expired. Restart the payment.',
      'pay.retry': 'Try again',
      'persona.title': 'Switch person', 'persona.note': 'Three views of the same tontine.',
      'member.title': 'Member', 'member.order': 'Payout order', 'member.status': 'Status',
      'member.receipt': 'See receipt', 'member.pay': 'Contribute this round',
      'member.reminder': 'Copy a reminder',
      'member.reminderText': 'Reminder: {amount} contribution for Tontine Sandaga, round {round}.',
      'live.copied': 'Copied', 'live.copyFail': 'This browser cannot copy',
      'live.joined': 'You joined the tontine',
      'live.persona': 'View: {name} · {city}',
      'live.language': 'Language: {lang}',
      'live.replayed': 'Demo reset',
      'share.receipt': 'TontineSats receipt · {amount} · {date}',
    },
    wo: {
      'app.kicker': 'TontineSats',
      'action.invite': 'Woo', 'action.switchPersona': 'Soppi nit',
      'circle.potLabel': 'Xaalis bu tour bi',
      'status.paid': 'Fey na', 'status.current': 'Tour bii', 'status.waiting': 'Xaar',
      'nav.circle': 'Natt', 'nav.activity': 'Activité', 'nav.passport': 'Passeport', 'nav.settings': 'Réglages',
      'settings.language': 'Làkk',
      'join.cta': 'Bokk ci tontine bi',
      'circle.yourContribution': 'Sa cotisation',
      'circle.paidTitle': 'Cotisation bi fey na',
      'pay.trust': 'Yow miy fey Mariama Sow. TontineSats duñu jël xaalis bi.',
      'live.joined': 'Bokk nañu ci tontine bi',
    },
  };

  const el = {};
  function cache() {
    el.phone = $('#phone');
    el.app = $('#app');
    el.views = $$('.view');
    el.tabs = $$('.tab');
    el.indicator = $('#tabIndicator');
    el.paybar = $('#paybar');
    el.actionCard = $('#actionCard');
    el.segbar = $('#segbar');
    el.sheetPay = $('#sheetPay');
    el.sheetPersona = $('#sheetPersona');
    el.scrim = $('#scrim');
    el.live = $('#liveStatus');
    el.calGrid = $('#calGrid');
    el.calLabel = $('#calLabel');
    el.calWeekdays = $('#calWeekdays');
    el.calHint = $('#calHint');
    el.historyList = $('#historyList');
    el.dayEmpty = $('#dayEmpty');
    el.sheetMember = $('#sheetMember');
    el.confetti = $('#confetti');
    el.gauge = $('#gaugeValue');
    el.stamp = $('#stamp');
    el.timeline = $('#timeline');
    el.processing = $('#processing');
    el.paid = $('#paid');
    el.payBody = $('#payBody');
    el.qrView = $('#qrView');
    el.qrBox = $('#qrBox');
  }

  function t(key, vars) {
    const dict = I18N[state.locale] || I18N.fr;
    let out = dict[key] ?? I18N.fr[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, v);
    return out;
  }

  const localeTag = () => (state.locale === 'en' ? 'en-US' : 'fr-FR');
  const nf = (n) => new Intl.NumberFormat(localeTag(), { maximumFractionDigits: 0 }).format(Math.round(n));
  const eurOf = (xof) => xof / XOF_PER_EUR;
  const satsOf = (xof) => Math.round((eurOf(xof) * SATS_PER_EUR) / 10) * 10;

  function money(xof) {
    if (state.hidden) return '••••';
    return `${nf(xof)} FCFA`;
  }
  function moneyEur(xof) {
    if (state.hidden) return '••••';
    return new Intl.NumberFormat(localeTag(), { style: 'currency', currency: 'EUR' }).format(eurOf(xof));
  }
  function amountOnly(xof) {
    if (state.currency === 'eur') {
      return new Intl.NumberFormat(localeTag(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(eurOf(xof));
    }
    return nf(xof);
  }
  function primaryMoney(xof) {
    return state.currency === 'eur' ? moneyEur(xof) : money(xof);
  }
  function sats(xof) {
    return state.hidden ? '••••' : `≈ ${nf(satsOf(xof))} sats`;
  }

  /* ---------- rendering ---------- */

  function setText(sel, value) {
    const node = $(sel);
    if (node) node.textContent = value;
  }

  function renderStaticText() {
    document.documentElement.lang = state.locale === 'wo' ? 'wo' : state.locale;
    $$('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    $$('[data-i18n-aria]').forEach((node) => { node.setAttribute('aria-label', t(node.dataset.i18nAria)); });
  }

  function render() {
    const p = PERSONAS[state.persona];
    const roundBeneficiary = 'Mariama Sow';
    const receiptBeneficiary = ROUNDS[state.receiptRound].beneficiary;

    renderStaticText();

    setText('[data-bind="circleName"]', 'Tontine Sandaga');
    setText('[data-bind="initials"]', p.initials);
    setText('[data-bind="chipRound"]', state.locale === 'en' ? 'Round 3 of 8' : 'Tour 3 sur 8');
    setText('[data-bind="chipAmount"]', `${money(CONTRIBUTION)} / ${state.locale === 'en' ? 'month' : 'mois'}`);
    setText('[data-bind="chipMembers"]', state.locale === 'en' ? '8 members' : '8 membres');
    setText('[data-bind="potAmount"]', state.hidden ? '••••' : amountOnly(POT));
    setText('[data-bind="potUnit"]', state.hidden ? '' : (state.currency === 'eur' ? '€' : 'FCFA'));
    setText('[data-bind="potSats"]', sats(POT));
    setText('[data-bind="beneficiaryLine"]', state.locale === 'en'
      ? `${roundBeneficiary} receives`
      : `${roundBeneficiary} reçoit`);
    setText('[data-bind="confirmedCount"]', `5 / ${MEMBERS.length}`);

    setText('[data-bind="dueAmount"]', primaryMoney(CONTRIBUTION));
    setText('[data-bind="dueSats"]', sats(CONTRIBUTION));
    setText('[data-bind="dueBadge"]', state.paid ? t('status.paid') : (state.locale === 'en' ? 'Today' : 'Aujourd’hui'));
    setText('[data-bind="dueText"]', state.paid ? t('circle.paidMeta') : (state.locale === 'en' ? 'Due today at 18:00' : 'Échéance aujourd’hui à 18:00'));
    setText('[data-bind="payCta"]', state.paid ? t('pay.seeReceipt') : `${t('pay.cta')} ${primaryMoney(CONTRIBUTION)}`);
    setText('[data-bind="progressMeta"]', state.locale === 'en' ? '5 of 8' : '5 sur 8');
    setText('#actionTitle', state.paid ? t('circle.paidTitle') : t('circle.yourContribution'));

    setText('[data-bind="activityDueTitle"]', t('activity.dueTitle'));
    setText('[data-bind="activityDueSub"]', state.locale === 'en' ? 'Today · 18:00' : 'Aujourd’hui · 18:00');

    setText('[data-bind="receiptSub"]', state.locale === 'en'
      ? `from ${receiptBeneficiary} · ${ROUNDS[state.receiptRound].date}`
      : `par ${receiptBeneficiary} · ${ROUNDS[state.receiptRound].date}`);

    setText('[data-bind="onTime"]', `${p.stats.onTime} %`);
    setText('[data-bind="statContribs"]', String(p.stats.contribs));
    setText('[data-bind="statReceipts"]', String(p.stats.receipts));
    setText('[data-bind="statCircles"]', String(p.stats.circles));
    setText('[data-bind="npubShort"]', p.npub);
    setText('[data-bind="personaName"]', p.name);

    setText('[data-bind="joinMeta"]', `${money(CONTRIBUTION)} / ${state.locale === 'en' ? 'month' : 'mois'} · ${MEMBERS.length} ${state.locale === 'en' ? 'members' : 'membres'} · ${state.locale === 'en' ? 'Round 3' : 'Tour 3'}`);

    setText('#payAmount', primaryMoney(CONTRIBUTION));
    setText('#paySats', sats(CONTRIBUTION));
    setText('#paidAmount', primaryMoney(CONTRIBUTION));
    setText('#confirmLabel', `${t('pay.cta')} ${primaryMoney(CONTRIBUTION)}`);
    setText('#rateText', state.locale === 'en'
      ? `1 EUR = 655.957 FCFA · ≈ 1,100 sats`
      : `1 EUR = 655,957 FCFA · ≈ 1 100 sats`);

    const badge = $('[data-bind="dueBadge"]');
    if (badge) {
      badge.classList.toggle('pill--success', state.paid);
      badge.classList.toggle('pill--warning', !state.paid);
    }

    el.segbar.setAttribute('aria-valuenow', state.paid ? '6' : '5');
    $$('.segbar__seg').forEach((seg, i) => {
      seg.classList.toggle('is-done', i < (state.paid ? 6 : 5));
    });

    $$('.persona[data-persona]').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.persona === state.persona));
    $$('.segmented__opt[data-locale]').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.locale === state.locale));
    $$('.persona[data-locale]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.locale === state.locale);
      const hasCheck = btn.querySelector('.icon');
      if (hasCheck) hasCheck.style.visibility = btn.dataset.locale === state.locale ? 'visible' : 'hidden';
    });
    $$('.segmented__opt[data-theme-opt]').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.themeOpt === state.theme));

    const eyeBtn = $('#btnEye');
    eyeBtn.setAttribute('aria-pressed', String(state.hidden));
    $('#i-eye-use')?.setAttribute('href', state.hidden ? '#i-eye-off' : '#i-eye');

    if (state.paid) el.paybar.classList.remove('is-on');
    $('#toggleReduce').checked = state.reduce;

    document.documentElement.dataset.reduce = state.reduce ? '1' : '0';
    document.documentElement.dataset.theme = resolvedTheme();

    renderRotation();
    renderCalendar();
    renderActivity();
  }

  /* ---------- calendar, rotation, member ---------- */

  function isoOf({ year, month, day }) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function monthLabel(date) {
    const raw = new Intl.DateTimeFormat(localeTag(), { month: 'long', year: 'numeric' }).format(date);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  function dayLabel(date, withYear = false) {
    const opts = withYear ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long' };
    return new Intl.DateTimeFormat(localeTag(), opts).format(date);
  }

  function renderRotation() {
    const list = $('#rotationList');
    if (!list) return;
    list.innerHTML = MEMBERS.map((m) => {
      const status = m.status === 'paid' ? t('status.paid') : m.status === 'current' ? t('status.current') : t('status.waiting');
      const sub = m.status === 'paid' ? t('row.paidOn') : m.status === 'current' ? t('row.receives') : t('row.dueLater');
      const pill = m.status === 'paid' ? 'pill--success' : m.status === 'current' ? 'pill--warning' : 'pill--muted';
      const check = m.status === 'paid' ? '<svg class="icon icon--xs"><use href="#i-check"/></svg>' : '';
      const avatar = m.status === 'current' ? 'avatar avatar--accent' : 'avatar';
      return `<li><button class="row${m.status === 'current' ? ' row--now' : ''}" type="button" data-member="${m.order}" aria-label="${m.name}, R${m.order}, ${status}">
        <span class="row__order">R${m.order}</span>
        <span class="${avatar}"><span>${m.initials}</span></span>
        <span class="row__body"><span class="row__name">${m.name}</span><span class="row__sub">${sub}</span></span>
        <span class="pill ${pill}">${check}<span>${status}</span></span>
      </button></li>`;
    }).join('');
  }

  function renderCalendar() {
    const { year, month, day } = state.calendar;
    const first = new Date(year, month, 1);
    el.calLabel.textContent = monthLabel(first);
    const weekdays = state.locale === 'en'
      ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
      : ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    el.calWeekdays.innerHTML = weekdays.map((d) => `<span>${d}</span>`).join('');

    const offset = (first.getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    let html = '';
    for (let i = 0; i < offset; i += 1) html += '<span class="cal-day is-empty" aria-hidden="true"></span>';
    for (let d = 1; d <= days; d += 1) {
      const iso = isoOf({ year, month, day: d });
      const event = EVENTS[iso];
      const selected = day === d;
      const classes = ['cal-day'];
      if (selected) classes.push('is-selected');
      if (event?.kind === 'due') classes.push('is-due');
      if (event) classes.push('has-event');
      const label = dayLabel(new Date(year, month, d), true) + (event?.kind === 'due' ? `, ${t('activity.due')}` : '');
      html += `<button class="${classes.join(' ')}" type="button" data-day="${d}" aria-pressed="${selected}" aria-label="${label}">${d}${event ? '<span class="cal-dot" aria-hidden="true"></span>' : ''}</button>`;
    }
    el.calGrid.innerHTML = html;
    el.calHint.textContent = day
      ? t('activity.filteredHint', { date: dayLabel(new Date(year, month, day)) })
      : t('activity.filterHint');
  }

  function shiftMonth(delta) {
    const { year, month } = state.calendar;
    const d = new Date(year, month + delta, 1);
    state.calendar = { year: d.getFullYear(), month: d.getMonth(), day: null };
    renderCalendar();
    renderActivity();
  }

  function receiptsFor(iso) {    const out = [];
    if (iso === '2026-11-12' && state.paid) out.push({ round: 3, display: EVENTS[iso].display });
    if (iso === '2026-10-12') out.push({ round: 2, display: EVENTS[iso].display });
    if (iso === '2026-09-12') out.push({ round: 1, display: EVENTS[iso].display });
    return out;
  }

  function renderActivity() {
    const selDay = state.calendar.day;
    const selIso = selDay ? isoOf(state.calendar) : null;
    const dueIso = '2026-11-12';
    const dueVisible = !state.paid && !state.joined && (!selIso || selIso === dueIso);
    const dueSection = $('#dueSection');
    if (dueSection) dueSection.hidden = !dueVisible;

    const dates = selIso ? [selIso] : Object.keys(EVENTS).sort().reverse();
    const receipts = dates.flatMap((iso) => receiptsFor(iso));
    const list = $('#historyList');
    if (list) {
      list.innerHTML = receipts.map((r) => `
        <li><button class="ledger" type="button" data-open-receipt="${r.round}">
          <span class="ledger__icon ledger__icon--success"><svg class="icon"><use href="#i-check"/></svg></span>
          <span class="ledger__body"><span class="ledger__title">${t('activity.roundReceipt', { round: r.round })}</span><span class="ledger__sub">${r.display} · ${ROUNDS[r.round].beneficiary}</span></span>
          <span class="ledger__amount tabular ledger__amount--in">${money(CONTRIBUTION)}</span>
        </button></li>`).join('');
    }

    const historyBlock = $('#activityHistory');
    if (historyBlock) historyBlock.hidden = state.joined || (!!selIso && receipts.length === 0);
    const emptyBlock = $('#activityEmpty');
    if (emptyBlock) emptyBlock.hidden = !state.joined;
    if (el.dayEmpty) el.dayEmpty.hidden = state.joined || !(selIso && receipts.length === 0 && !dueVisible);
  }

  function openMember(order) {
    const m = MEMBERS.find((x) => x.order === order);
    if (!m) return;
    state.member = order;
    const status = m.status === 'paid' ? t('status.paid') : m.status === 'current' ? t('status.current') : t('status.waiting');
    $('#memberAvatar').textContent = m.initials;
    $('#memberAvatar').classList.toggle('avatar--accent', m.status === 'current');
    $('#memberName').textContent = m.name;
    $('#memberMeta').textContent = `R${m.order} · ${status}`;
    $('#memberOrder').textContent = `R${m.order}`;
    $('#memberStatus').textContent = status;
    $('#memberNpub').textContent = m.npub;
    const action = $('#btnMemberAction');
    if (m.status === 'paid') {
      action.textContent = t('member.receipt');
      action.onclick = () => { closeSheet(true); openReceipt(m.round); };
    } else if (m.status === 'current') {
      action.textContent = t('member.pay');
      action.onclick = () => { closeSheet(true); openPay(); };
    } else {
      action.textContent = t('member.reminder');
      action.onclick = () => copyText(t('member.reminderText', { amount: primaryMoney(CONTRIBUTION), round: m.order }), action);
    }
    openSheet(el.sheetMember);
  }

  /* ---------- motion helpers ---------- */

  function rollNumber(node, to, { from = 0, duration = 600, format = (n) => nf(n) } = {}) {
    if (!node) return;
    const reduce = state.reduce;
    if (reduce || duration < 60) { node.textContent = format(to); return; }
    const start = performance.now();
    const tick = (now) => {
      const p = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      node.textContent = format(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(tick);
      else node.textContent = format(to);
    };
    requestAnimationFrame(tick);
  }

  function animateRing() {
    const segs = $$('.ring__seg');
    segs.forEach((s, i) => {
      s.classList.toggle('is-pending', i >= 5);
      s.classList.remove('is-hidden');
      s.style.transitionDelay = '0ms';
      s.style.strokeDashoffset = '0';
      if (s.getAnimations) s.getAnimations().forEach((a) => a.cancel());
    });
    if (state.reduce) return;
    segs.forEach((s, i) => {
      if (i >= 5) return;
      s.animate(
        [{ strokeDashoffset: 72 }, { strokeDashoffset: 0 }],
        { duration: 700, delay: i * 70, easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)', fill: 'both' },
      );
    });
  }

  function animateTimeline() {
    const steps = $$('.timeline__step');
    steps.forEach((s, i) => {
      s.classList.remove('is-in');
      if (state.reduce) { s.classList.add('is-in'); return; }
      setTimeout(() => s.classList.add('is-in'), 80 + i * 120);
    });
  }

  function animatePassport() {
    const p = PERSONAS[state.persona];
    const total = 578.05;
    el.gauge.style.strokeDashoffset = state.reduce ? String(total - (p.stats.onTime / 100) * total) : String(total);
    el.stamp.classList.remove('is-on');
    if (!state.reduce) {
      requestAnimationFrame(() => {
        el.gauge.style.strokeDashoffset = String(total - (p.stats.onTime / 100) * total);
        setTimeout(() => el.stamp.classList.add('is-on'), 500);
      });
    } else {
      el.stamp.classList.add('is-on');
    }
    const map = [['[data-bind="onTime"]', p.stats.onTime, (n) => `${Math.round(n)} %`],
      ['[data-bind="statContribs"]', p.stats.contribs, (n) => String(Math.round(n))],
      ['[data-bind="statReceipts"]', p.stats.receipts, (n) => String(Math.round(n))],
      ['[data-bind="statCircles"]', p.stats.circles, (n) => String(Math.round(n))]];
    map.forEach(([sel, val, fmt]) => rollNumber($(sel), val, { duration: 500, format: fmt }));
  }

  /* ---------- navigation ---------- */

  const TAB_ORDER = ['dashboard', 'activity', 'passport', 'settings'];

  function setTabState(view) {
    const tabView = view === 'receipt' ? 'activity' : view === 'join' ? 'dashboard' : view;
    el.tabs.forEach((tab) => {
      const active = tab.dataset.tab === tabView;
      tab.classList.toggle('is-active', active);
      if (active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
    const idx = Math.max(0, TAB_ORDER.indexOf(tabView));
    const tabbar = el.indicator.parentElement;
    const col = tabbar.clientWidth / 4;
    el.indicator.style.transform = `translateX(${idx * col + col / 2 - 12}px)`;
  }

  function showView(name, { animate = true } = {}) {
    state.view = name;
    el.views.forEach((v) => {
      const active = v.dataset.view === name;
      v.hidden = !active;
      v.classList.toggle('is-active', active && animate);
      if (active) v.scrollTop = 0;
    });
    if (!animate) el.views.forEach((v) => v.classList.remove('is-active'));
    setTabState(name);
    el.paybar.classList.remove('is-on');
    if (name === 'dashboard') {
      animateRing();
      const pot = $('[data-bind="potAmount"]');
      rollNumber(pot, POT, { duration: 700, format: (n) => amountOnly(n) });
    }
    if (name === 'receipt') animateTimeline();
    if (name === 'passport') animatePassport();
    if (name !== 'dashboard') el.paybar.classList.remove('is-on');
    el.updatePaybar?.();
  }

  function navigate(name) {
    if (state.view === name) return;
    if (el.sheet) closeSheet();
    showView(name);
    history.replaceState(null, '', `#/${name}`);
  }

  /* ---------- sheets ---------- */

  let lastFocus = null;
  let dragState = null;

  function openSheet(sheet) {
    if (state.sheet && state.sheet !== sheet) closeSheet(true);
    lastFocus = document.activeElement;
    state.sheet = sheet;
    el.scrim.hidden = false;
    sheet.hidden = false;
    void sheet.offsetHeight;
    el.scrim.classList.add('is-on');
    sheet.classList.add('is-open');
    sheet.setAttribute('tabindex', '-1');
    setTimeout(() => sheet.focus({ preventScroll: true }), 60);
    if (sheet === el.sheetPay) resetPaySheet();
  }

  function closeSheet(instant = false) {
    const sheet = state.sheet;
    if (!sheet) return;
    sheet.classList.remove('is-open');
    el.scrim.classList.remove('is-on');
    const done = () => {
      sheet.hidden = true;
      sheet.style.transform = '';
      el.scrim.hidden = true;
      if (state.sheet === sheet) state.sheet = null;
    };
    if (instant || state.reduce) done();
    else setTimeout(done, 280);
    lastFocus?.focus?.({ preventScroll: true });
  }

  function resetPaySheet() {
    state.payStep = 'form';
    el.payBody.hidden = false;
    el.processing.hidden = true;
    el.paid.hidden = true;
    el.paid.classList.remove('is-on');
    el.qrView.hidden = true;
    $('#btnConfirmPay').hidden = false;
    el.sheetPay.classList.remove('is-tall');
    $$('.stage').forEach((s) => {
      s.className = 'stage';
      const dot = s.querySelector('.stage__dot');
      dot.innerHTML = '<span class="spinner"></span>';
    });
    $$('.method').forEach((m) => m.classList.toggle('is-selected', m.dataset.method === state.method));
    $$('input[name="method"]').forEach((r) => { r.checked = r.value === state.method; });
  }

  function bindSheetDrag() {
    const grab = $('#payGrab');
    grab.addEventListener('pointerdown', (e) => {
      if (state.reduce) return;
      dragState = { y: e.clientY, t: performance.now(), dy: 0, active: true };
      grab.setPointerCapture(e.pointerId);
      el.sheetPay.classList.add('is-dragging');
    });
    grab.addEventListener('pointermove', (e) => {
      if (!dragState?.active) return;
      dragState.dy = Math.max(0, e.clientY - dragState.y);
      el.sheetPay.style.transform = `translateY(${dragState.dy}px)`;
    });
    const end = () => {
      if (!dragState?.active) return;
      const { dy, t } = dragState;
      const velocity = dy / Math.max(1, performance.now() - t);
      dragState.active = false;
      el.sheetPay.classList.remove('is-dragging');
      el.sheetPay.style.transform = '';
      if (dy > 120 || velocity > 0.5) closeSheet();
    };
    grab.addEventListener('pointerup', end);
    grab.addEventListener('pointercancel', end);
  }

  function trapFocus(e) {
    if (e.key !== 'Tab' || !state.sheet) return;
    const focusables = $$('button, [href], input, [tabindex]:not([tabindex="-1"])', state.sheet)
      .filter((n) => !n.hidden && n.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- live status, copy, haptics ---------- */

  let liveTimer = null;
  function announce(message) {
    if (!el.live) return;
    el.live.textContent = '';
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { el.live.textContent = message; }, 40);
  }

  function flashCheck(btn) {
    if (!btn) return;
    const use = btn.querySelector('use');
    const href = use?.getAttribute('href');
    btn.classList.add('is-copied');
    use?.setAttribute('href', '#i-check');
    setTimeout(() => {
      use?.setAttribute('href', href);
      btn.classList.remove('is-copied');
    }, 1600);
  }

  function legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    if (!ok) throw new Error('copy failed');
  }

  async function copyText(text, btn) {
    try {
      if (navigator.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(text); }
        catch { legacyCopy(text); }
      } else {
        legacyCopy(text);
      }
      flashCheck(btn);
      announce(t('live.copied'));
      haptic(10);
    } catch {
      announce(t('live.copyFail'));
    }
  }

  function haptic(ms) {
    if (state.reduce) return;
    navigator.vibrate?.(ms);
  }

  /* ---------- confetti ---------- */

  function burstConfetti() {
    if (state.reduce) return;
    const canvas = el.confetti;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = el.phone.clientWidth * dpr;
    canvas.height = el.phone.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const styles = getComputedStyle(document.documentElement);
    const colors = ['--success', '--warning', '--primary', '--foreground'].map((v) => styles.getPropertyValue(v).trim());
    const W = el.phone.clientWidth;
    const H = el.phone.clientHeight;
    const origin = { x: W / 2, y: H * 0.62 };
    const particles = Array.from({ length: 42 }, () => {
      const angle = (-Math.PI / 2) + (Math.random() - 0.5) * 2.1;
      const speed = 5 + Math.random() * 7;
      return {
        x: origin.x, y: origin.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      };
    });
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.vy += 0.26;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life = clamp(1 - elapsed / 1100, 0, 1);
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (elapsed < 1150) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- payment flow ---------- */

  let qrTimer = null;

  function openPay() {
    state.method = PERSONAS[state.persona].method;
    state.currency = PERSONAS[state.persona].currency;
    resetPaySheet();
    render();
    openSheet(el.sheetPay);
  }

  async function runNwcSequence() {
    state.payStep = 'processing';
    el.payBody.hidden = true;
    el.qrView.hidden = true;
    el.processing.hidden = false;
    el.paid.hidden = true;
    el.processing.scrollTop = 0;
    const stages = $$('.stage');
    const stepDelay = state.reduce ? 120 : 780;

    for (let i = 0; i < stages.length; i += 1) {
      const stage = stages[i];
      stage.classList.add('is-in');
      await wait(stepDelay);
      stage.classList.add('is-done');
      stage.querySelector('.stage__dot').innerHTML = '<svg class="icon"><use href="#i-check"/></svg>';
      const time = stage.querySelector('.stage__time');
      if (time) time.textContent = `${(0.8 + Math.random() * 0.6).toFixed(1)} s`;
    }
    await wait(state.reduce ? 80 : 220);
    finishPayment();
  }

  function finishPayment() {
    state.payStep = 'paid';
    state.paid = true;
    el.processing.hidden = true;
    el.payBody.hidden = true;
    el.paid.hidden = false;
    void el.paid.offsetHeight;
    el.paid.classList.add('is-on');
    render();
    burstConfetti();
    haptic(12);
  }

  function showQr() {
    state.payStep = 'qr';
    el.payBody.hidden = true;
    el.qrView.hidden = false;
    el.qrView.innerHTML = `
      <div class="qrbox" id="qrBox"></div>
      <p class="qrview__status"><span class="pulse" aria-hidden="true"></span><span>${t('pay.waiting')}</span></p>
      <p class="qrview__demo">${t('pay.demoQr')}</p>
      <button class="btn btn--secondary btn--block" id="btnSimulate" type="button">${t('pay.simulate')}</button>`;
    $('#btnSimulate').addEventListener('click', finishPayment);
    buildQr();
    clearTimeout(qrTimer);
    qrTimer = setTimeout(showQrError, 12000);
  }

  function showQrError() {
    state.payStep = 'qr-error';
    el.qrView.innerHTML = `
      <div class="qrerror">
        <p class="qrerror__title">${t('pay.expired')}</p>
        <p class="qrerror__sub">${t('pay.expiredSub')}</p>
        <button class="btn btn--primary btn--block" id="btnRetryQr" type="button">${t('pay.retry')}</button>
      </div>`;
    $('#btnRetryQr').addEventListener('click', () => {
      openPay();
      showQr();
    });
  }

  function buildQr() {
    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue('--ink').trim() || 'currentColor';
    const paper = styles.getPropertyValue('--paper').trim() || 'transparent';
    const size = 25;
    let seed = 11;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const inFinder = (x, y) => (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
    let cells = '';
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (inFinder(x, y)) continue;
        if (rnd() > 0.55) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      }
    }
    const finder = (x, y) => `
      <rect x="${x}" y="${y}" width="7" height="7" rx="1" fill="none" stroke="${ink}" stroke-width="1.1"/>
      <rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="${ink}"/>`;
    const box = $('#qrBox');
    if (!box) return;
    box.innerHTML = `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="QR de démonstration">
      <rect width="${size}" height="${size}" fill="${paper}"/>
      <g fill="${ink}">${cells}</g>
      ${finder(0.5, 0.5)}${finder(size - 7.5, 0.5)}${finder(0.5, size - 7.5)}
    </svg>`;
  }

  /* ---------- passport / receipt ---------- */

  function openReceipt(round = 3) {
    state.receiptRound = round;
    const r = ROUNDS[round];
    $$('.timeline__step').forEach((step, i) => {
      const sub = step.querySelector('.timeline__sub');
      const date = round === 3 ? r.date.replace(' 2026', '') : r.short;
      sub.textContent = i === 0 ? `${date} ${r.times[0]}` : `${date} ${r.times[i]} · af1c…9e`;
    });
    render();
    navigate('receipt');
  }

  function applyLocale(locale) {
    state.locale = locale;
    document.documentElement.lang = locale;
    render();
    closeSheet();
    announce(t('live.language', { lang: locale === 'fr' ? 'Français' : locale === 'en' ? 'English' : 'Wolof' }));
  }

  function resolvedTheme() {
    if (state.theme !== 'system') return state.theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.dataset.theme = resolvedTheme();
    render();
  }

  function setPersona(id) {
    if (!PERSONAS[id]) return;
    state.persona = id;
    state.method = PERSONAS[id].method;
    state.currency = PERSONAS[id].currency;
    state.receiptRound = 3;
    render();
    closeSheet();
    announce(t('live.persona', { name: PERSONAS[id].name, city: PERSONAS[id].city }));
    if (state.view === 'passport') animatePassport();
    if (state.view === 'dashboard') {
      const pot = $('[data-bind="potAmount"]');
      rollNumber(pot, POT, { duration: 300, format: (n) => amountOnly(n) });
    }
  }

  /* ---------- pay bar visibility ---------- */

  function observePayBar() {
    const view = $('#view-dashboard');
    const update = () => {
      if (state.view !== 'dashboard' || state.sheet || state.paid) {
        el.paybar.classList.remove('is-on');
        return;
      }
      const card = el.actionCard.getBoundingClientRect();
      const frame = view.getBoundingClientRect();
      el.paybar.classList.toggle('is-on', card.bottom < frame.top + 6);
    };
    view.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    el.updatePaybar = update;
    update();
  }

  /* ---------- boot ---------- */

  function boot() {
    cache();
    const qTheme = params.get('theme');
    if (qTheme === 'dark' || qTheme === 'light') state.theme = qTheme;
    const qLocale = params.get('locale');
    if (qLocale && I18N[qLocale]) state.locale = qLocale;
    render();
    bindSheetDrag();
    observePayBar();

    // Remove skeleton after first paint budget.
    const bootEl = $('#boot');
    if (hashNoBoot) bootEl.hidden = true;
    const hideBoot = () => {
      bootEl.classList.add('is-off');
      setTimeout(() => { bootEl.hidden = true; }, 220);
    };
    if (!hashNoBoot) setTimeout(hideBoot, state.reduce ? 120 : 620);

    // Initial dashboard entrance.
    showView('dashboard', { animate: true });
    location.hash === '#/passport' && navigate('passport');

    // Deep links for screenshots/demo.
    if (['activity', 'passport', 'settings', 'receipt', 'join'].includes(hash)) navigate(hash);
    if (hash === 'receipt') openReceipt(3);
    if (hash === 'pay') { showView('dashboard'); setTimeout(openPay, 400); }
    if (hash === 'paid') { showView('dashboard'); setTimeout(() => { openPay(); setTimeout(finishPayment, 700); }, 350); }
    if (hash === 'persona') { showView('dashboard'); setTimeout(() => openSheet(el.sheetPersona), 400); }
    if (hash === 'qr') { showView('dashboard'); setTimeout(() => { openPay(); showQr(); }, 400); }

    $('#btnPersonaHead').addEventListener('click', () => openSheet(el.sheetPersona));
    $('#btnInvite').addEventListener('click', () => navigate('join'));
    $('#btnJoinBack').addEventListener('click', () => navigate('dashboard'));
    $('#btnReceiptBack').addEventListener('click', () => navigate(location.hash.includes('passport') ? 'passport' : 'activity'));

    el.tabs.forEach((tab) => tab.addEventListener('click', () => navigate(tab.dataset.tab)));

    $('#btnEye').addEventListener('click', () => {
      state.hidden = !state.hidden;
      render();
      $('#btnEye').setAttribute('aria-pressed', String(state.hidden));
    });

    const goPay = () => {
      if (state.paid) openReceipt(3);
      else openPay();
    };
    $('#btnPayCard').addEventListener('click', goPay);
    $('#btnPaySticky').addEventListener('click', goPay);
    $('#btnActivityPay').addEventListener('click', openPay);

    $('#calPrev').addEventListener('click', () => shiftMonth(-1));
    $('#calNext').addEventListener('click', () => shiftMonth(1));
    el.calGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-day]');
      if (!btn) return;
      const day = Number(btn.dataset.day);
      state.calendar.day = state.calendar.day === day ? null : day;
      renderCalendar();
      renderActivity();
    });
    $('#btnClearDay').addEventListener('click', () => {
      state.calendar.day = null;
      renderCalendar();
      renderActivity();
    });
    $('#rotationList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-member]');
      if (btn) openMember(Number(btn.dataset.member));
    });
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-open-receipt]');
      if (btn) openReceipt(Number(btn.dataset.openReceipt));
    });

    $$('[data-close]').forEach((b) => b.addEventListener('click', () => closeSheet()));
    el.scrim.addEventListener('click', () => closeSheet());

    $$('input[name="method"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        state.method = radio.value;
        $$('.method').forEach((m) => m.classList.toggle('is-selected', m.dataset.method === state.method));
      });
    });

    $('#btnConfirmPay').addEventListener('click', () => {
      if (state.method === 'qr') showQr();
      else runNwcSequence();
    });

    $('#btnCurrency').addEventListener('click', () => {
      state.currency = state.currency === 'xof' ? 'eur' : 'xof';
      render();
    });

    $('#btnSeeReceipt').addEventListener('click', () => {
      closeSheet(true);
      openReceipt(3);
    });

    $('#btnCopyCode').addEventListener('click', (e) => copyText('SNDG24', e.currentTarget));
    $('#btnCopyNpub').addEventListener('click', (e) => copyText(PERSONAS[state.persona].npub, e.currentTarget));

    $('#btnWhatsapp').addEventListener('click', () => {
      const url = `https://wa.me/?text=${encodeURIComponent(`${t('join.invited')} Tontine Sandaga · code SNDG24`)}`;
      window.open(url, '_blank', 'noopener');
    });

    $('#btnJoin').addEventListener('click', () => {
      state.joined = true;
      render();
      navigate('activity');
      announce(t('live.joined'));
    });

    $$('[data-persona]').forEach((btn) => btn.addEventListener('click', () => setPersona(btn.dataset.persona)));

    $$('[data-locale]').forEach((btn) => {
      if (btn.classList.contains('segmented__opt')) btn.addEventListener('click', () => applyLocale(btn.dataset.locale));
    });
    $$('.persona[data-locale]').forEach((btn) => btn.addEventListener('click', () => applyLocale(btn.dataset.locale)));

    $$('[data-theme-opt]').forEach((btn) => btn.addEventListener('click', () => applyTheme(btn.dataset.themeOpt)));

    $('#toggleReduce').addEventListener('change', (e) => {
      state.reduce = e.target.checked;
      render();
      announce(state.reduce
        ? (state.locale === 'en' ? 'Motion reduced' : 'Animations réduites')
        : (state.locale === 'en' ? 'Motion restored' : 'Animations restaurées'));
    });

    $('#btnReplay').addEventListener('click', () => {
      state.paid = false;
      state.joined = false;
      state.receiptRound = 3;
      state.hidden = false;
      state.currency = PERSONAS[state.persona].currency;
      render();
      navigate('dashboard');
      animateRing();
      announce(t('live.replayed'));
    });

    $('#btnPassportShare').addEventListener('click', (e) => {
      const text = `${PERSONAS[state.persona].name} · ${PERSONAS[state.persona].stats.onTime} % ${t('passport.onTime')} · ${PERSONAS[state.persona].npub}`;
      if (navigator.share) navigator.share({ text }).catch(() => {});
      else copyText(text, e.currentTarget);
    });

    $('#btnCopyReceipt').addEventListener('click', (e) => {
      const text = `${t('share.receipt', { amount: primaryMoney(CONTRIBUTION), date: ROUNDS[state.receiptRound].date })}`;
      copyText(text, e.currentTarget);
    });
    $('#btnShareReceipt').addEventListener('click', (e) => {
      const text = `${t('share.receipt', { amount: primaryMoney(CONTRIBUTION), date: ROUNDS[state.receiptRound].date })}`;
      if (navigator.share) navigator.share({ text }).catch(() => {});
      else copyText(text, e.currentTarget);
    });

    $('#emptyCta')?.addEventListener('click', () => navigate('dashboard'));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.sheet) closeSheet();
      trapFocus(e);
    });

    window.addEventListener('resize', () => {
      setTabState(state.view);
      if (window.innerWidth > 900 && el.confetti.width) {
        el.confetti.width = 0;
        el.confetti.height = 0;
      }
    });

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener?.('change', (e) => {
      state.reduce = e.matches;
      render();
    });

    const themeMq = window.matchMedia('(prefers-color-scheme: dark)');
    themeMq.addEventListener?.('change', () => {
      if (state.theme === 'system') applyTheme('system');
    });
    if (state.theme === 'system') document.documentElement.dataset.theme = themeMq.matches ? 'dark' : 'light';

    // First dashboard render: animate the ring after the boot overlay.
    if (!hashNoBoot) setTimeout(() => { if (state.view === 'dashboard') animateRing(); }, state.reduce ? 120 : 650);

    window.__tontineDemo = {
      ring: animateRing,
      openPay,
      finishPayment,
      receipt: () => openReceipt(3),
      state,
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
