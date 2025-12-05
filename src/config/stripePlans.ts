// Centralized Stripe price mappings for all platform subscriptions
export const STRIPE_PLANS = {
  // Artist Plans
  artist_free: { 
    priceId: null, 
    productId: null,
    name: "Free",
    amount: 0
  },
  artist_pro: {
    monthly: { priceId: 'price_1R8tksCSRAUHY3L4Al3DoQXx', amount: 9900 },
    yearly: { priceId: 'price_1R8tmuCSRAUHY3L4RiElfbPy', amount: 99000 },
    name: "Artist Pro",
    productId: 'prod_S1IQZBmkxQxGZZ'
  },
  artist_elite: {
    monthly: { priceId: 'price_1RCze6CSRAUHY3L45cQRFvbt', amount: 24900 },
    yearly: { priceId: 'price_1RCzg0CSRAUHY3L4ifp9CU8V', amount: 249000 },
    name: "Artist Elite",
    productId: 'prod_S4FXYKuCJHo5l3'
  },
  
  // Fan Plans
  fan_free: { 
    priceId: null, 
    productId: null,
    name: "Free",
    amount: 0
  },
  fan_supporter: {
    monthly: { priceId: 'price_1R8tWZCSRAUHY3L4EEgfl4oG', amount: 5900 },
    yearly: { priceId: 'price_1R8tiRCSRAUHY3L4eY5b9rBW', amount: 59000 },
    name: "Supporter Pass",
    productId: 'prod_S1I9I8PQC0PVfK'
  },
  
  // Brand Plans
  brand_lite: { 
    priceId: null, 
    productId: null,
    name: "Lite",
    amount: 0
  },
  brand_pro: {
    monthly: { priceId: null, amount: 99900 }, // Create when needed
    yearly: { priceId: null, amount: 999000 },
    name: "Brand Pro",
    productId: null
  },
  brand_enterprise: {
    monthly: { priceId: null, amount: null },
    yearly: { priceId: null, amount: null },
    name: "Brand Enterprise",
    productId: null
  }
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;

// Helper to get price ID based on plan and interval
export const getPriceId = (planKey: string, interval: 'month' | 'year' = 'month'): string | null => {
  const plan = STRIPE_PLANS[planKey as PlanKey];
  if (!plan) return null;
  
  if ('monthly' in plan) {
    return interval === 'year' ? plan.yearly.priceId : plan.monthly.priceId;
  }
  
  return plan.priceId;
};

// Helper to get plan name
export const getPlanName = (planKey: string): string => {
  const plan = STRIPE_PLANS[planKey as PlanKey];
  return plan?.name || planKey;
};
