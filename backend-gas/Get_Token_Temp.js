/**
 * Get_Token_Temp.js
 *
 * DANGEROUS utility — intentionally disabled in the repo.
 * This file must never log, email, or print live secrets.
 *
 * If you need a property value during ops:
 *  1. Open Script Properties in the GAS project UI, OR
 *  2. Run a one-off function in the browser editor that is NOT saved/committed.
 *
 * This stub remains so clasp does not resurrect an old dump helper, and so
 * anyone who opens the file sees the safe pattern.
 */

function emailToken() {
  throw new Error(
    'emailToken() is disabled. Do not email Script Properties. Use the GAS Secrets UI or a non-committed local run.'
  );
}

function dumpTokens() {
  throw new Error(
    'dumpTokens() is disabled. Never console.log live tokens. Use Script Properties UI or a non-committed local run.'
  );
}
