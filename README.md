<div align="center">

# adalab shield

**Block short-form videos. Reclaim your focus.**

_The average person spends 2.5 hours daily on short-form videos. Take back your time._

[![CI](https://github.com/adabana-saki/adalab-shield/actions/workflows/ci.yml/badge.svg)](https://github.com/adabana-saki/adalab-shield/actions/workflows/ci.yml)
[![CodeQL](https://github.com/adabana-saki/adalab-shield/actions/workflows/codeql.yml/badge.svg)](https://github.com/adabana-saki/adalab-shield/actions/workflows/codeql.yml)
[![codecov](https://codecov.io/gh/adabana-saki/adalab-shield/branch/main/graph/badge.svg)](https://codecov.io/gh/adabana-saki/adalab-shield)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/adabana-saki/adalab-shield?style=social)](https://github.com/adabana-saki/adalab-shield/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[![Chrome](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://github.com/adabana-saki/adalab-shield)
[![Firefox](https://img.shields.io/badge/Firefox-Add--on-FF7139?logo=firefox&logoColor=white)](https://github.com/adabana-saki/adalab-shield)
[![Edge](https://img.shields.io/badge/Edge-Add--on-0078D7?logo=microsoftedge&logoColor=white)](https://github.com/adabana-saki/adalab-shield)

[**Install**](#installation) · [**Features**](#features) · [**Demo**](#demo) · [**Contributing**](CONTRIBUTING.md)

[日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [한국어](README.ko.md)

</div>

---

## The Problem

> "I opened TikTok for 5 minutes... and 2 hours disappeared."

Sound familiar? Short-form videos are engineered to hijack your attention:

- **Dopamine loops**: Each 15-second video triggers a reward response
- **Infinite scroll**: No natural stopping point
- **Algorithm optimization**: Content gets more addictive over time

The result? Fragmented attention, reduced productivity, and hours lost daily.

## The Solution

**adalab shield blocks short-form video content at the source** — before willpower even enters the equation.

```text
YouTube Shorts  → Blocked
TikTok Feed     → Blocked
Instagram Reels → Blocked
```

No more "just one more video." No more doom scrolling. Just focus.

---

## Demo

<div align="center">

<!-- TODO: Add actual demo GIF -->

![adalab shield Demo](docs/assets/demo-placeholder.png)

_One click to block. One click to unblock. Full control._

</div>

| Without adalab shield |   With adalab shield    |
| :-------------------: | :---------------------: |
|  Endless scroll trap  | Clean, focused browsing |
|  2+ hours lost daily  |     Time reclaimed      |
| Constant distractions |    Deep work enabled    |

---

## Features

### 🛡️ Core Blocking

| Feature                     | Description                                           |
| --------------------------- | ----------------------------------------------------- |
| **Multi-Platform Blocking** | YouTube Shorts, TikTok, Instagram Reels — all covered |
| **SNS Feed Blocking**       | Twitter, Facebook, LinkedIn, Reddit feeds blocked     |
| **Custom Domain Blocking**  | Add any domain to your block list                     |
| **Per-Platform Control**    | Block TikTok but allow Shorts? You decide             |
| **Whitelist System**        | Allow specific creators, channels, or URLs            |
| **Custom Rules**            | Add your own CSS selectors for advanced blocking      |

### ⏱️ Focus & Productivity

| Feature               | Description                                             |
| --------------------- | ------------------------------------------------------- |
| **Focus Mode**        | One-click blocking for 30/60/120 minutes with soft lock |
| **Pomodoro Timer**    | Classic 25/5 work/break cycles with auto-start          |
| **Site Time Limits**  | Set daily usage limits per platform                     |
| **Time Tracking**     | 90-day usage history with visual reports                |
| **Streak Tracking**   | Track consecutive focus days with milestones            |
| **Challenge Mode**    | Solve math/typing/pattern puzzles to bypass blocks      |
| **Lockdown Mode**     | PIN-protect settings to prevent impulsive changes       |
| **Schedule Blocking** | Auto-block during specific hours (e.g., work time)      |

### 🎨 Customization

| Feature               | Description                                            |
| --------------------- | ------------------------------------------------------ |
| **Custom Block Page** | Personalize block message, theme, and motivation       |
| **Dark/Light Theme**  | System-aware theme with custom colors                  |
| **Multi-Language**    | 9 languages supported (EN, JA, DE, ES, FR, KO, PT, ZH) |
| **Privacy-First**     | Zero data collection. Everything stays local           |
| **Cross-Browser**     | Chrome, Firefox, Edge supported                        |

---

## Comparison

| Feature         | adalab shield |  BlockSite  | uBlock Origin | Screen Time | Cold Turkey |
| --------------- | :-----------: | :---------: | :-----------: | :---------: | :---------: |
| YouTube Shorts  |      ✅       | ⚠️ Partial  |      ❌       |     ❌      |     ❌      |
| TikTok          |      ✅       |     ✅      |      ❌       |     ✅      |     ✅      |
| Instagram Reels |      ✅       | ⚠️ Partial  |      ❌       |     ❌      |     ❌      |
| SNS Feed Block  |      ✅       |     ❌      |      ❌       |     ❌      |     ❌      |
| Focus Mode      |      ✅       |     ❌      |      ❌       |     ❌      | ⚠️ Partial  |
| Pomodoro Timer  |      ✅       |     ❌      |      ❌       |     ❌      |     ❌      |
| Time Limits     |      ✅       | ⚠️ Partial  |      ❌       |     ✅      |     ✅      |
| Streak Tracking |      ✅       |     ❌      |      ❌       |     ❌      |     ❌      |
| Challenge Mode  |      ✅       |     ❌      |      ❌       |     ❌      |     ❌      |
| Lockdown Mode   |      ✅       |     ❌      |      ❌       |     ❌      |     ✅      |
| Whitelist       |    ✅ Free    |   💰 Paid   |      N/A      |     ❌      |   ✅ Free   |
| Custom Rules    |      ✅       |     ❌      |      ✅       |     ❌      |     ✅      |
| Multi-Language  |     ✅ 9      |   ✅ Many   |    ✅ Many    |   ✅ Many   |   ✅ Many   |
| Privacy         |  ✅ No data   | ❌ Collects |  ✅ No data   | ❌ Collects | ✅ No data  |
| Open Source     |      ✅       |     ❌      |      ✅       |     ❌      |     ❌      |
| Price           |   **Free**    |  Freemium   |     Free      |    Paid     |    Paid     |

---

## Installation

### Browser Stores

| Browser | Status      | Link             |
| ------- | ----------- | ---------------- |
| Chrome  | Coming Soon | Chrome Web Store |
| Firefox | Coming Soon | Firefox Add-ons  |
| Edge    | Coming Soon | Edge Add-ons     |

### Manual Installation (Development)

<details>
<summary><strong>Click to expand installation steps</strong></summary>

1. **Clone the repository**

   ```bash
   git clone https://github.com/adabana-saki/adalab-shield.git
   cd adalab shield
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Build the extension**

   ```bash
   # For Chrome
   pnpm build:chrome

   # For Firefox
   pnpm build:firefox

   # For Edge
   pnpm build:edge

   # Build all browsers
   pnpm build:all
   ```

4. **Load the extension**
   - **Chrome**: Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", select `dist/chrome`
   - **Firefox**: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", select any file in `dist/firefox`
   - **Edge**: Go to `edge://extensions/`, enable "Developer mode", click "Load unpacked", select `dist/edge`

</details>

---

## Usage

### Quick Start

1. Click the **adalab shield icon** in your browser toolbar
2. Toggle the **main switch** to enable/disable blocking
3. Use **platform toggles** to control individual sites

### Whitelist (Allow Specific Content)

1. Open extension **Options** (gear icon)
2. Navigate to **Whitelist** section
3. Add channels, URLs, or domains you want to allow

### Custom Blocking Rules

1. Open extension **Options**
2. Navigate to **Custom Rules** section
3. Add CSS selectors for elements to block

---

## Why adalab shield Exists

**I was angry.** Hours lost every day to short-form videos. Late nights scrolling, achieving nothing, just watching time disappear. This frustration with wasted time and the regret that followed drove me to create adalab shield.

After realizing I was spending 3+ hours daily on short-form videos, I tried everything:

- ❌ **Willpower** — Failed after 2 days
- ❌ **App timers** — Just tapped "ignore"
- ❌ **Uninstalling apps** — Reinstalled within hours
- ❌ **Website blockers** — Too aggressive, blocked everything

What I needed was **surgical precision**: block the addictive content, but keep the platforms usable for legitimate purposes (search, specific creators, etc.).

adalab shield is that tool.

### The Mission

**I want you to reclaim your time.** Protect your life from these cleverly engineered time thieves. Use those recovered hours to focus on what truly matters. **Live more efficiently. Live more intentionally.**

adalab shield isn't just a blocker. It's a shield for your time and your life.

---

## The Science

Short-form video platforms use psychological techniques to maximize engagement:

| Technique            | How It Works                              | adalab shield's Response    |
| -------------------- | ----------------------------------------- | --------------------------- |
| **Variable Rewards** | Unpredictable content keeps you scrolling | Block the feed entirely     |
| **Infinite Scroll**  | No natural stopping point                 | Remove the scroll mechanism |
| **Autoplay**         | Next video starts without consent         | Prevent video loading       |
| **FOMO Design**      | "Trending" and "For You" create urgency   | Hide recommendation UI      |

---

## FAQ

<details>
<summary><strong>Does this completely block YouTube/TikTok/Instagram?</strong></summary>

No. adalab shield only blocks the **short-form video sections** (Shorts, For You page, Reels). You can still use YouTube search, watch regular videos, browse Instagram posts, etc.

</details>

<details>
<summary><strong>Can I temporarily disable blocking?</strong></summary>

Yes! One click on the extension icon toggles blocking on/off. You can also disable specific platforms while keeping others blocked.

</details>

<details>
<summary><strong>Does adalab shield collect my data?</strong></summary>

**No.** adalab shield is 100% local. No analytics, no tracking, no external requests. Your browsing data never leaves your device.

</details>

<details>
<summary><strong>Why not just use uBlock Origin?</strong></summary>

uBlock Origin is great for ads, but blocking short-form videos requires platform-specific rules that update frequently. adalab shield maintains these rules and provides a user-friendly interface.

</details>

<details>
<summary><strong>Will this work on mobile?</strong></summary>

Currently, adalab shield is desktop-only (browser extension). Mobile support is on the roadmap.

</details>

---

## Roadmap

### ✅ Completed (v0.1.0)

- [x] Core blocking engine
- [x] YouTube Shorts support
- [x] TikTok support
- [x] Instagram Reels support
- [x] SNS feed blocking (Twitter, Facebook, LinkedIn, Reddit)
- [x] Whitelist system
- [x] Custom rules & domain blocking
- [x] Multi-browser support (Chrome, Firefox, Edge)
- [x] **Focus Mode** with soft lock
- [x] **Pomodoro Timer** with auto-start
- [x] **Site Time Limits** (daily usage per platform)
- [x] **Time Tracking & Reports** (90-day history)
- [x] **Streak Tracking** with milestones
- [x] **Challenge Mode** (math/typing/pattern puzzles)
- [x] **Lockdown Mode** (PIN-protected settings)
- [x] **Schedule Blocking** (time-based rules)
- [x] **Custom Block Page** with themes
- [x] **Multi-language support** (9 languages)

### 🚀 In Progress

- [ ] Browser store release (Chrome Web Store, Firefox Add-ons, Edge Add-ons)
- [ ] Demo video & screenshots
- [ ] Mobile browser support (Firefox Android)

### 📋 Planned

- [ ] Safari extension
- [ ] Import/export settings
- [ ] Sync across devices
- [ ] Usage analytics dashboard
- [ ] Habit insights & recommendations
- [ ] Team/family sharing features

[View full roadmap →](https://github.com/adabana-saki/adalab-shield/projects)

---

## Development

### Prerequisites

- Node.js 20+
- pnpm 9+

### Commands

```bash
pnpm install        # Install dependencies
pnpm dev            # Start development server
pnpm build:all      # Build for all browsers
pnpm test:unit      # Run unit tests
pnpm test:e2e       # Run E2E tests
pnpm lint           # Run linting
pnpm typecheck      # Run type checking
```

### Project Structure

```
adalab shield/
├── src/
│   ├── background/     # Service Worker
│   ├── content/        # Content Scripts
│   │   ├── platforms/  # Platform detectors
│   │   └── actions/    # Blocking actions
│   ├── popup/          # Popup UI
│   ├── options/        # Options page
│   └── shared/         # Shared utilities
├── public/
│   ├── icons/          # Extension icons
│   └── _locales/       # i18n messages
└── tests/              # Test suites
```

---

## Contributing

We welcome contributions! adalab shield is designed to be contributor-friendly.

### Quick Start

```bash
git clone https://github.com/adabana-saki/adalab-shield.git
cd adalab shield
pnpm install
pnpm dev
```

### Good First Issues

Looking to contribute? Check out issues labeled [`good first issue`](https://github.com/adabana-saki/adalab-shield/labels/good%20first%20issue).

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Translations

Help translate adalab shield! See [TRANSLATING.md](TRANSLATING.md) for instructions.

---

## Privacy

adalab shield is built with privacy as a core principle:

- **No data collection** — We don't collect any user data
- **No external requests** — All functionality works offline
- **Local storage only** — Settings stored in your browser
- **Open source** — Full code transparency

See our [Privacy Policy](docs/PRIVACY_POLICY.md) for details.

## Security

Found a vulnerability? Please see our [Security Policy](SECURITY.md).

## License

[MIT](LICENSE) — Use it, modify it, share it.

---

## Acknowledgments

- Built with [React](https://react.dev/)
- Bundled with [Vite](https://vitejs.dev/)
- Extension framework by [@crxjs/vite-plugin](https://crxjs.dev/)

---

<div align="center">

**Developed by [ADALAB](https://adalab.pages.dev/)**

Project Lead: Adabana Saki

---

If adalab shield helped you reclaim your focus, consider giving it a ⭐

[⭐ Star this project](https://github.com/adabana-saki/adalab-shield)

</div>
