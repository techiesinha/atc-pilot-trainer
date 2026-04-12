import devConfig  from './config.dev';
import prodConfig from './config.prod';
import { AppConfig } from './types';

const isDev = import.meta.env.MODE === 'development';

export const config: AppConfig = isDev ? devConfig : prodConfig;

/** Typed logger — only outputs when debug.enabled is true */
export const log = {
  info:  (...args: unknown[]) => { if (config.debug.enabled) console.log('[ATC]', ...args); },
  warn:  (...args: unknown[]) => { if (config.debug.enabled) console.warn('[ATC]', ...args); },
  error: (...args: unknown[]) => { console.error('[ATC]', ...args); },
};

export type { AppConfig };
