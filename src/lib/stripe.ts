import Stripe from "stripe";

// Stripe client, constructed only when a key is configured. Without a key the
// subscription flow falls back to a demo activation so the stage demo can
// never dead-end on a missing secret.

const key = process.env.STRIPE_SECRET_KEY;

export const stripeEnabled = Boolean(key);

export const stripe: Stripe | null = key ? new Stripe(key) : null;
