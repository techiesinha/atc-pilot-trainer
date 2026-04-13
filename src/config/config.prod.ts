import { AppConfig } from './types';

/**
 * Production config — used by: npm run build
 *
 * Secrets read from .env.local via import.meta.env.
 * On deployment platforms set these as environment variables in their dashboard.
 */

const {
  VITE_CHECKWX_KEY,
  VITE_EMAILJS_SERVICE_ID,
  VITE_EMAILJS_TEMPLATE_ID,
  VITE_EMAILJS_PUBLIC_KEY,
  VITE_UPI_ID,
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY,
} = import.meta.env;

const prodConfig: AppConfig = {

  app: {
    name: 'ATC Pilot Trainer',
    version: '1.0.0',
    description: 'ATC Radio Communication Trainer for Student Pilots',
    aircraft: 'Cessna 172R',
  },

  copyright: {
    year: '2025-2026',
    disclaimer:
      'All rights reserved. Unauthorised copying or reproduction of this code, ' +
      'in whole or in part, without prior written permission of the developer is ' +
      'strictly prohibited. For training purposes only — not affiliated with DGCA, ' +
      'ICAO, or any aviation authority. The developer assumes no responsibility for ' +
      'errors, omissions, or any outcomes arising from use of this tool. ' +
      'Not a substitute for certified flight instruction.',
  },

  donations: {
    enabled: true,
    upi: {
      id: VITE_UPI_ID ?? '',
      displayName: 'Abhishek Sinha',
      note: 'Support ATC Pilot Trainer',
    },
  },

  metar: {
    primary: 'checkwx',
    corsProxy: 'https://corsproxy.io/?',
    aviationWeather: {
      baseUrl: 'https://aviationweather.gov/api/data',
    },
    checkwx: {
      key: VITE_CHECKWX_KEY ?? '',
      baseUrl: 'https://api.checkwx.com',
    },
  },

  contactus: {
    emailjs: {
      serviceId: VITE_EMAILJS_SERVICE_ID ?? '',
      templateId: VITE_EMAILJS_TEMPLATE_ID ?? '',
      publicKey: VITE_EMAILJS_PUBLIC_KEY ?? '',
    },
    social: {
      linkedin: 'https://www.linkedin.com/in/profile-area51/',
      github: 'https://github.com/techiesinha',
      stackoverflow: 'https://stackoverflow.com/users/abhisheksinha',
      twitter: '',
      githubIssues: 'https://github.com/techiesinha/atc-pilot-trainer/issues/new',
    },
  },

  tracking: {
    enabled: true,
    logEvents: true,
    supabase: {
      url: VITE_SUPABASE_URL ?? '',
      anonKey: VITE_SUPABASE_ANON_KEY ?? '',
      usersTable: 'users',
      eventsTable: 'events',
    },
  },

  developer: {
    name: 'Abhishek Sinha',
    email: 'sinha.atctrainer@gmail.com',
    hamCallsign: 'VU3IXC',
    pilotLicense: 'SPL Holder — Cessna 172R',
    location: 'India',
  },

  debug: {
    enabled: false,
  },

};

export default prodConfig;
