/**
 * Locale index
 *
 * Locale files follow the naming convention: locale.{lang}.ts
 * To add a language: copy locale.en.ts → locale.hi.ts, translate values,
 * then swap `active` below — no component changes needed.
 *
 * Disclaimer and copyright text live in config (config.dev.ts / config.prod.ts)
 * under the `copyright` block — not here. Legal text is config, not locale.
 */
import { en } from './locale.en';

const active = en;

export const t = active;
export type { Locale } from './locale.en';
