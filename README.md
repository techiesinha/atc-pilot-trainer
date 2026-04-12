# ATC Pilot Trainer v1.0.0

A free radio communication trainer for student pilots. Practice ICAO phraseology, decode live weather, and drill the phonetic alphabet — built by an SPL holder flying the Cessna 172R.

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Chrome or Edge (required for speech recognition)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/techiesinha/atc-pilot-trainer.git
cd atc-pilot-trainer

# 2. Install dependencies
npm install

# 3. Set up your environment
cp .env.example .env.local
# Open .env.local and fill in your API keys (see Environment Setup below)

# 4. Start the development server
./dev.sh start-dev
```

Open **http://localhost:8080** in Chrome or Edge.

---

## Developer Script

All common commands are available through `dev.sh`:

```bash
chmod +x dev.sh          # run once to make it executable

./dev.sh start-dev       # start development server on localhost:8080
./dev.sh start-prod      # build and preview production build
./dev.sh check-secrets   # scan for secrets before pushing to Git
./dev.sh help            # show all commands
```

### Before Every Git Push

Always run the secrets check before pushing:

```bash
./dev.sh check-secrets && git push
```

This scans all Git-tracked files for secret values, `.env` files accidentally staged, and hardcoded API keys. If anything is found, the push is blocked with a clear error.

---

## Environment Setup

Secrets are never stored in source code. Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

`.env.local` is blocked by `.gitignore` and will never be committed. See `.env.example` for the full list of variables and where to get each one.

---

## Features

| Module | Description |
|---|---|
| **ATC Simulator** | 18 scenarios across 6 categories — speak your readback, evaluated live |
| **Uncontrolled Airspace** | CTAF broadcast scenarios for non-towered aerodromes |
| **Indian Callsigns** | VT-xxx callsigns spoken in full ICAO phonetic |
| **Tower Selector** | Choose your aerodrome — calls use correct name and frequency |
| **Live Weather** | Real METAR data decoded into plain English pilot advice |
| **Phonetics Driller** | NATO alphabet and aviation numbers across 4 drill modes |
| **Progress Log** | Pass rate by category, weak area detection, session history |
| **Voice Selector** | Male or female ATC voice — persisted across sessions |
| **UTC Clock** | Live ticking UTC and local time in the nav bar |
| **Cockpit Placard** | Your assigned VT-xxx callsign displayed as a registration plate |

---

## Scenarios

**Ground:** Startup Clearance · Request Taxi · Taxi Clearance Readback

**Tower:** Backtrack & Line Up · Takeoff Clearance · Circuit Altitude · Touch and Go · Sector Rejoin · Go-Around

**Approach:** Squawk Assignment · Descent Clearance

**Emergency:** PAN-PAN (Low Fuel) · MAYDAY (Engine Failure)

**Information:** ATIS & First Contact

**Uncontrolled (CTAF):** Taxiing · Takeoff Broadcast · Downwind · Final Approach · Overhead Join

---

## Project Structure

```
atc-pilot-trainer/
├── dev.sh                     ← developer commands (start, check-secrets)
├── .env.example               ← environment variable template (committed)
├── .env.local                 ← your actual secrets (never committed)
├── supabase/
│   └── schema.sql             ← database schema for user tracking
└── src/
    ├── config/
    │   ├── types.ts           ← AppConfig TypeScript interface
    │   ├── config.dev.ts      ← development config (reads from .env.local)
    │   ├── config.prod.ts     ← production config (reads from .env.local)
    │   ├── index.ts           ← auto-selects dev or prod config
    │   └── aerodromes.ts      ← all aerodrome definitions
    ├── locales/
    │   ├── locale.en.ts       ← all UI text (English)
    │   └── index.ts           ← active locale selector
    ├── components/            ← reusable UI components
    ├── pages/                 ← one file per route
    ├── hooks/                 ← custom React hooks
    ├── services/              ← API calls, scoring, email
    ├── data/                  ← scenarios, phonetics, callsigns
    └── types/                 ← shared TypeScript types
```

---

## Configuration

All app parameters live in `src/config/config.dev.ts` and `src/config/config.prod.ts`. The config is structured by functional area:

```ts
config.app           // name, version, aircraft
config.copyright     // year, disclaimer text
config.donations     // UPI payment details
config.metar         // weather sources and fallback
config.contactus     // social links and feedback delivery
config.tracking      // user registration and analytics
config.developer     // developer personal info
config.debug         // logging flags
```

Secrets (API keys, UPI ID) are read via `import.meta.env.VITE_*` — never hardcoded.

---

## Browser Support

| Browser | Speech Recognition | Full Support |
|---|---|---|
| Chrome | ✓ | ✓ Recommended |
| Edge | ✓ | ✓ |
| Safari | Partial | Partial |
| Firefox | ✗ | Reference mode only |

---

## Reporting Issues

Found a phraseology error or bug? Open an issue on GitHub:

**https://github.com/techiesinha/atc-pilot-trainer/issues/new**

Please include:
- Which scenario or page the issue is on
- What you expected vs what happened
- Your browser name and version

---

## Contributing

This project is not open for code contributions. The source code is made available for reference only. See the License section below.

---

## License

**© 2025 Abhishek Sinha. All rights reserved.**

Permission is granted to use this application for personal, non-commercial flight training study purposes only.

The following are **not permitted** without prior written permission from the developer:

- Copying, reproducing, or distributing the source code in whole or in part
- Modifying or creating derivative works based on this code
- Using this code or any part of it in any other project, commercial or otherwise
- Republishing this application under a different name or branding

This tool is provided for training purposes only and is not affiliated with DGCA, ICAO, or any aviation authority. The developer assumes no responsibility for errors, omissions, or any outcomes arising from use of this tool. Not a substitute for certified flight instruction.

---

## Author

**Abhishek Sinha**
Senior Frontend Engineer · SPL Holder · HAM Radio VU3IXC · India

[LinkedIn](https://www.linkedin.com/in/profile-area51/) · [GitHub](https://github.com/techiesinha)
