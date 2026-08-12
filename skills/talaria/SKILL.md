---
name: talaria
description: Playwright stealth evasion wrapper (playwright-extra + puppeteer-extra-plugin-stealth). Reduces basic bot detection and WAF-triggered challenges — not a CAPTCHA solver. Use when automating browsers, scraping, bot detection, playwright stealth, WAF evasion, or when Playwright is flagged as a bot.
version: 1.0.0
metadata:
  hermes:
    tags: [playwright, stealth, browser, evasion, talaria, waf]
  openclaw:
    requires:
      bins: [node, npm]
    envVars:
      - name: PROXY_SERVER
        required: false
        description: Optional HTTP proxy server
      - name: PROXY_USERNAME
        required: false
        description: Optional proxy username
      - name: PROXY_PASSWORD
        required: false
        description: Optional proxy password
      - name: HEADLESS
        required: false
        description: Set to "false" for headed browser
    emoji: "☤"
    homepage: https://github.com/gadielkalleb/talaria
---

# Talaria

Self-contained skill: instructions + code in `$SKILL_DIR`. **Do not** use vanilla `chromium` from `playwright` on sites with WAF or anti-bot.

## Scope

**Does:**

- Launch Playwright via `playwright-extra` + `puppeteer-extra-plugin-stealth`
- Hide automation leaks (`navigator.webdriver`, `HeadlessChrome` UA, empty plugins)
- Reduce the chance a basic WAF triggers a challenge from fingerprint alone
- Expose `launchStealthBrowser()` (API) and `scripts/cli.js` (visit / screenshot / HTML / JSON)
- Optional proxy via `.env`

**Does not:**

- Solve visible CAPTCHAs (reCAPTCHA, hCaptcha, Turnstile)
- Replace a residential proxy when the IP is burned
- Guarantee bypass of Cloudflare / DataDome / PerimeterX-class stacks
- Integrate paid solvers (2Captcha, Bright Data Web Unlocker, etc.)

Only automate websites the user authorized access to.

## Path resolution

Before any command, resolve the directory that contains this `SKILL.md` and use it as `$SKILL_DIR` below.

Common locations:

- ClawHub / OpenClaw: skill bundle install directory (often `skills/talaria/`)
- Hermes (ClawHub): `~/.hermes/skills/talaria`
- Cursor: `~/.cursor/skills/talaria`
- Codex: `~/.codex/skills/talaria`
- Git clone: `skills/talaria/` inside this repo

Do not copy scripts into the user's project. Run and import from `$SKILL_DIR`.

## Setup (first time in this `$SKILL_DIR`)

```bash
cd "$SKILL_DIR" && npm run setup
```

Downloads npm deps and Chromium (can be large). If Chromium is missing later: `cd "$SKILL_DIR" && npx playwright install chromium`

Optional proxy: copy `$SKILL_DIR/env.example` to `$SKILL_DIR/.env`, then export the vars into the process env (`PROXY_SERVER`, `PROXY_USERNAME`, `PROXY_PASSWORD`, `HEADLESS`). Or pass `--proxy` / `proxy:` in the API.

## When to use

- Playwright / scraping / screenshot on a protected page
- The site blocks the agent or shows bot-detection behavior
- Any script that currently imports `playwright` directly to browse the web

## How to use

Prefer the skill API. CLI only for visit / screenshot / HTML with no extra logic.

Treat scripts as a black box: run them. Read the source only if you need to extend it.

### CLI

```bash
node "$SKILL_DIR/scripts/cli.js" --url https://example.com --screenshot out.png --html out.html --json
```

Flags: `--url` (required), `--screenshot`, `--html`, `--wait-selector`, `--timeout`, `--headed`, `--proxy`, `--json`.

Errors go to stderr. With `--json`, stdout is `{ url, title, screenshot, html }`.

### API (automation in /tmp)

Write the script to `/tmp/talaria-*.js`, never into the skill directory. Import the wrapper from the skill:

```js
import { launchStealthBrowser } from '$SKILL_DIR/scripts/index.js'

const { browser, context, page } = await launchStealthBrowser({
  headless: true,
  // proxy: process.env.PROXY_SERVER,
})

await page.goto(url, { waitUntil: 'domcontentloaded' })
// automation...
await browser.close()
```

Replace `$SKILL_DIR` with the real absolute path. Run: `node /tmp/talaria-….js`

Options: `headless`, `slowMo`, `proxy` (string or `{ server, username, password }`), `userAgent`, `viewport`, `locale`, `args`.

## Checklist

1. Resolve `$SKILL_DIR`
2. `cd "$SKILL_DIR" && npm run setup` if `node_modules` is missing
3. Import `launchStealthBrowser` from `$SKILL_DIR/scripts/index.js` — never `import { chromium } from 'playwright'` for the target browser
4. If the IP is burned, set a residential proxy in the skill env
5. Smoke-check the CLI (below)

## If a challenge is still on the page

- Do not invent a solver (2Captcha, iframe clicks, etc.)
- Report the challenge (type, URL, screenshot)
- Suggest a residential proxy / clean IP
- Do not claim success if the challenge is still visible

## Verify

Hub installs (ClawHub / Hermes) do not ship `test/`. Smoke-check with the CLI:

```bash
node "$SKILL_DIR/scripts/cli.js" --url https://example.com --json
```

Expect JSON with `url` and `title`. From a full git clone that includes `test/`, maintainers can also run `cd "$SKILL_DIR" && npm test` (stealth signals, sannysoft, CLI e2e).

## Credits

Stealth approach based on [How to Bypass CAPTCHAs With Playwright](https://brightdata.com.br/blog/dados-do-site/bypass-captchas-with-playwright) by Antonello Zanini (Bright Data). Not affiliated with Bright Data.
