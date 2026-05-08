import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const isBuildPhase =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-export';

if (!stripeKey && process.env.NODE_ENV === 'production' && !isBuildPhase) {
  throw new Error(
    '[stripe] STRIPE_SECRET_KEY is required in production but is not set.',
  );
}

export const stripe = new Stripe(stripeKey || 'sk_test_dummy_key', {
  apiVersion: '2024-12-18.acacia',
});
