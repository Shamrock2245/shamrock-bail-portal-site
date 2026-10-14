/**
 * Node ESM requires a file extension. Velo public modules omit it
 * (`import … from './sanitizeLandingCopy'`), matching src/public/portal-validators.js.
 * Register this with `node --import` before those tests.
 */
import { register } from 'node:module';

register('./resolve-extensionless.mjs', import.meta.url);
