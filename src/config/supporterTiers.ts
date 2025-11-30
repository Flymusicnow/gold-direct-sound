export const SUPPORTER_TIERS = {
  basic: {
    name: 'Basic Supporter',
    price: 49,
    currency: 'SEK',
    priceId: 'price_1SYxCzCSRAUHY3L4d2VZBrg8',
    xpBonus: 25,
    extraSpotlightVotes: 1,
    badgeLevel: 'bronze_plus',
    features: [
      '+25 XP monthly bonus',
      '+1 extra Spotlight vote per day',
      'Bronze+ supporter badge',
      'Access to Supporter-Only content',
      'Early access to some releases',
    ],
  },
  gold: {
    name: 'Gold Supporter',
    price: 99,
    currency: 'SEK',
    priceId: 'price_1SYxDyCSRAUHY3L4VXlGOcZb',
    xpBonus: 75,
    extraSpotlightVotes: 3,
    badgeLevel: 'gold',
    merchCashbackPercent: 10,
    features: [
      '+75 XP monthly bonus',
      '+3 extra Spotlight votes per day',
      'Gold supporter badge',
      'Access to ALL Supporter-Only content',
      'Early access to ALL supporter releases',
      '10% merch cashback',
      'Exclusive live room chat status',
    ],
  },
} as const;

export type SupporterTier = 'basic' | 'gold';
