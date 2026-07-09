// Central configuration for local tests.
// Secrets MUST come from environment variables — never hardcode them here.
//
// Usage:
//   export GAS_API_KEY='your-gas-api-key'
//   export GAS_URL='https://script.google.com/macros/s/.../exec'   # optional override
//   node scripts/testing/test_gas_email.mjs
//
// Or copy scripts/testing/.env.example → scripts/testing/.env and:
//   set -a; source scripts/testing/.env; set +a

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(
      `Missing required env var ${name}. Set it before running tests (see scripts/testing/.env.example).`
    );
  }
  return String(value).trim();
}

export const GAS_URL =
  process.env.GAS_URL ||
  'https://script.google.com/macros/s/AKfycby5N-lHvM2XzKnX38KSqekq0ENWMLYqYM2bYxuZcRRAQcBhP3RvBaF0CbQa9gKK73QI4w/exec';

export const WIX_SITE_URL =
  process.env.WIX_SITE_URL || 'https://www.shamrockbailbonds.biz';

/** Shared GAS ↔ Wix API key — required for authenticated doPost actions */
export function getGasApiKey() {
  return requiredEnv('GAS_API_KEY');
}
