#!/usr/bin/env bash
# =============================================================================
# ATC Pilot Trainer — Developer Script
# =============================================================================
# Usage:
#   ./dev.sh start-dev       Start the development server (port 8080)
#   ./dev.sh start-prod      Build and preview the production build
#   ./dev.sh check-secrets   Scan for secrets before pushing to Git
#   ./dev.sh add-copyright   Add copyright notice to all source files
#   ./dev.sh help            Show this help
#
# First time setup:
#   chmod +x dev.sh
#
# Copyright year is read from "copyrightYear" in package.json.
# To update all notices: change copyrightYear, then run ./dev.sh add-copyright
# =============================================================================

set -e

# ── Colour codes ──────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────────────────
printHeader() {
  echo ""
  echo -e "${BOLD}${BLUE}ATC Pilot Trainer — Developer Script${RESET}"
  echo -e "${BLUE}──────────────────────────────────────${RESET}"
}

pkgField() {
  node -e "console.log(require('./package.json').$1 ?? '')" 2>/dev/null || echo ''
}

# ── start-dev ─────────────────────────────────────────────────────────────────
startDev() {
  printHeader
  echo -e "${GREEN}Starting development server on http://localhost:8080${RESET}"
  echo ""
  npm run dev
}

# ── start-prod ────────────────────────────────────────────────────────────────
startProd() {
  printHeader
  echo -e "${GREEN}Building production bundle...${RESET}"
  npm run build
  echo ""
  echo -e "${GREEN}Launching production preview on http://localhost:8080${RESET}"
  npm run preview
}

# ── check-secrets ─────────────────────────────────────────────────────────────
#
# Scans only Git-tracked files (what will actually be pushed).
# Four checks:
#   1. Known secret values from .env.local not in any tracked file
#   2. No .env file (except .env.example) is tracked
#   3. No hardcoded long hex strings or UPI IDs in source files
#   4. Config files use destructured env vars (not inline import.meta.env)
#
checkSecrets() {
  printHeader
  echo -e "${YELLOW}Scanning Git-tracked files for secrets...${RESET}"
  echo ""

  local FOUND=0
  local WARNINGS=0

  local TRACKED_FILES
  TRACKED_FILES=$(git ls-files 2>/dev/null)

  if [ -z "$TRACKED_FILES" ]; then
    echo -e "${YELLOW}No tracked files found. Run 'git add .' first.${RESET}"
    exit 1
  fi

  # ── Check 1: Known secret values from .env.local ──────────────────────────
  echo -e "${BOLD}Check 1: Known secret values from .env.local${RESET}"
  local check1Passed=true

  if [ -f ".env.local" ]; then
    while IFS='=' read -r key value; do
      case "$key" in "#"*|"") continue ;; esac
      [ -z "$value" ] && continue
      [ "${#value}" -lt 8 ] && continue
      matches=$(echo "$TRACKED_FILES" | xargs grep -rl "$value" 2>/dev/null || true)
      if [ -n "$matches" ]; then
        echo -e "  ${RED}✗ Secret value for '$key' found in:${RESET}"
        echo "$matches" | while read -r f; do echo -e "    ${RED}→ $f${RESET}"; done
        FOUND=$((FOUND + 1))
        check1Passed=false
      fi
    done < .env.local
  else
    echo -e "  ${YELLOW}⚠ .env.local not found — skipping value check${RESET}"
  fi

  [ "$check1Passed" = true ] && \
    echo -e "  ${GREEN}✓ No secret values found in tracked files${RESET}"

  # ── Check 2: .env files accidentally tracked ──────────────────────────────
  echo ""
  echo -e "${BOLD}Check 2: .env files in Git tracking${RESET}"
  local envFiles
  envFiles=$(echo "$TRACKED_FILES" | grep -E "^\.env" | grep -v "\.env\.example" || true)

  if [ -n "$envFiles" ]; then
    echo -e "  ${RED}✗ .env file tracked by Git — this exposes your secrets:${RESET}"
    echo "$envFiles" | while read -r f; do echo -e "    ${RED}→ $f${RESET}"; done
    echo -e "  ${YELLOW}  Fix: git rm --cached .env.local && git commit -m 'chore: untrack env'${RESET}"
    FOUND=$((FOUND + 1))
  else
    echo -e "  ${GREEN}✓ No .env files in Git tracking${RESET}"
  fi

  # ── Check 3: Hardcoded secret patterns ───────────────────────────────────
  echo ""
  echo -e "${BOLD}Check 3: Hardcoded secret patterns in source files${RESET}"
  local hardcoded
  hardcoded=$(echo "$TRACKED_FILES" | xargs grep -n \
    -e "['\"][a-f0-9]\{28,\}['\"]" \
    -e "@okaxis\|@oksbi\|@okhdfcbank\|@okicici\|@ybl\|@paytm" \
    -e "rzp_live_" \
    2>/dev/null \
    | grep -v "import\.meta\.env\|VITE_\|#\|example\|placeholder\|test\|dummy\|\.env" \
    || true)

  if [ -n "$hardcoded" ]; then
    echo -e "  ${YELLOW}⚠ Possible hardcoded secrets — review manually:${RESET}"
    echo "$hardcoded" | head -10 | while read -r line; do
      echo -e "    ${YELLOW}→ $line${RESET}"
    done
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "  ${GREEN}✓ No hardcoded secret patterns detected${RESET}"
  fi

  # ── Check 4: Config files use destructured env vars ───────────────────────
  echo ""
  echo -e "${BOLD}Check 4: Config files use destructured env vars${RESET}"
  local configPassed=true

  for configFile in "src/config/config.dev.ts" "src/config/config.prod.ts"; do
    if [ -f "$configFile" ]; then
      inlineCount=$(grep -c "import\.meta\.env\.VITE_" "$configFile" 2>/dev/null || echo 0)
      if [ "$inlineCount" -gt 0 ]; then
        echo -e "  ${YELLOW}⚠ $configFile has $inlineCount inline import.meta.env reference(s)${RESET}"
        echo -e "    ${YELLOW}Tip: destructure at top → const { VITE_KEY } = import.meta.env${RESET}"
        WARNINGS=$((WARNINGS + 1))
        configPassed=false
      fi
    fi
  done

  [ "$configPassed" = true ] && \
    echo -e "  ${GREEN}✓ Config files use clean destructured pattern${RESET}"

  # ── Summary ───────────────────────────────────────────────────────────────
  echo ""
  echo -e "${BOLD}──────────────────────────────────────${RESET}"

  if [ "$FOUND" -gt 0 ]; then
    echo -e "${RED}${BOLD}✗ FAILED — $FOUND secret(s) detected. Do NOT push.${RESET}"
    echo -e "${YELLOW}  Fix the issues above, then re-run: ./dev.sh check-secrets${RESET}"
    echo ""
    exit 1
  elif [ "$WARNINGS" -gt 0 ]; then
    echo -e "${YELLOW}${BOLD}⚠ PASSED with $WARNINGS warning(s) — review before pushing.${RESET}"
    echo ""
    exit 0
  else
    echo -e "${GREEN}${BOLD}✓ PASSED — No secrets detected. Safe to push.${RESET}"
    echo ""
    exit 0
  fi
}

# ── add-copyright ─────────────────────────────────────────────────────────────
#
# Reads copyright year from package.json → copyrightYear.
# Falls back to current calendar year if the field is missing.
# Skips files that already have the notice — safe to run multiple times.
# Skips *.d.ts declaration files and vite-env files.
#
addCopyright() {
  printHeader
  echo -e "${YELLOW}Adding copyright notice to source files...${RESET}"
  echo ""

  # Read year from package.json copyrightYear, fall back to current year
  local YEAR
  YEAR=$(node -e "
    const pkg = require('./package.json');
    console.log(pkg.copyrightYear ?? new Date().getFullYear());
  " 2>/dev/null || date +%Y)

  # Read author — fall back to developer name
  local AUTHOR
  AUTHOR=$(node -e "
    const pkg = require('./package.json');
    console.log(pkg.author ?? 'Abhishek Sinha');
  " 2>/dev/null || echo 'Abhishek Sinha')

  # Build app display name from package name (kebab → Title Case)
  local APP_NAME
  APP_NAME=$(node -e "
    const name = require('./package.json').name ?? 'atc-pilot-trainer';
    console.log(name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
  " 2>/dev/null || echo 'ATC Pilot Trainer')

  local NOTICE="/**
 * © $YEAR $AUTHOR. All rights reserved.
 * $APP_NAME — For training purposes only.
 * Unauthorised copying or reproduction without prior written permission is prohibited.
 */"

  echo -e "  ${BOLD}Year:${RESET}    $YEAR  (package.json → copyrightYear)"
  echo -e "  ${BOLD}Author:${RESET}  $AUTHOR"
  echo -e "  ${BOLD}App:${RESET}     $APP_NAME"
  echo ""

  local COUNT=0
  local SKIPPED=0

  while IFS= read -r -d '' file; do

    # Skip if notice already present (check for author name as the unique marker)
    if grep -q "© $YEAR $AUTHOR" "$file" 2>/dev/null; then
      SKIPPED=$((SKIPPED + 1))
      continue
    fi

    # Prepend the notice followed by a blank line
    local tmpFile
    tmpFile=$(mktemp)
    printf '%s\n\n' "$NOTICE" > "$tmpFile"
    cat "$file" >> "$tmpFile"
    mv "$tmpFile" "$file"

    echo -e "  ${GREEN}✓ $file${RESET}"
    COUNT=$((COUNT + 1))

  done < <(find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
    ! -name "*.d.ts"           \
    ! -name "vite-env*"        \
    ! -path "*/node_modules/*" \
    -print0)

  echo ""

  if [ "$COUNT" -eq 0 ] && [ "$SKIPPED" -gt 0 ]; then
    echo -e "${GREEN}All $SKIPPED file(s) already have the © $YEAR notice. Nothing to do.${RESET}"
  else
    echo -e "${GREEN}${BOLD}✓ Added notice to $COUNT file(s). Skipped $SKIPPED (already present).${RESET}"
  fi

  if [ "$COUNT" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Next — commit the changes:${RESET}"
    echo -e "  ${BOLD}git add src/${RESET}"
    echo -e "  ${BOLD}git commit -m \"chore: add copyright notice to source files\"${RESET}"
    echo -e "  ${BOLD}git push${RESET}"
  fi

  echo ""
}

# ── help ──────────────────────────────────────────────────────────────────────
showHelp() {
  printHeader
  echo ""
  echo -e "  ${BOLD}./dev.sh start-dev${RESET}       Start development server  →  http://localhost:8080"
  echo -e "  ${BOLD}./dev.sh start-prod${RESET}      Build + preview production  →  http://localhost:8080"
  echo -e "  ${BOLD}./dev.sh check-secrets${RESET}   Scan Git-tracked files for secrets before pushing"
  echo -e "  ${BOLD}./dev.sh add-copyright${RESET}   Add copyright notice to all source files"
  echo -e "  ${BOLD}./dev.sh help${RESET}            Show this help"
  echo ""
  echo -e "  ${YELLOW}Before every push:${RESET}"
  echo -e "  ${BOLD}./dev.sh check-secrets && git push${RESET}"
  echo ""
  echo -e "  ${YELLOW}To update copyright year:${RESET}"
  echo -e "  Edit ${BOLD}package.json → copyrightYear${RESET}, then run:"
  echo -e "  ${BOLD}./dev.sh add-copyright${RESET}"
  echo ""
}

# ── Entry point ───────────────────────────────────────────────────────────────
case "${1:-help}" in
  start-dev)     startDev      ;;
  start-prod)    startProd     ;;
  check-secrets) checkSecrets  ;;
  add-copyright) addCopyright  ;;
  help|*)        showHelp      ;;
esac
