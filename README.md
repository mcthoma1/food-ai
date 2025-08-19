# Food Calorie AI Estimator (WIP)

> Capture or search foods, review serving sizes, and track calories & macros — built with Expo (React Native).  
> **Project status:** early-stage scaffold; core features are under active development.

## Table of Contents
- [Overview](#overview)
- [Current Status (What Works Today)](#current-status-what-works-today)
- [Planned Features / Roadmap](#planned-features--roadmap)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Quality & Performance Goals](#quality--performance-goals)
- [Contributing](#contributing)
- [License](#license)

---

## Overview
This repository hosts a mobile app aiming to make calorie tracking **fast and simple**. Users will be able to add foods either by **taking a photo** or by **searching a nutrition database**, confirm serving sizes, and save entries to a daily log.

The long‑term vision:
- **Photo → food detection** (choose matches), then
- **Nutrition lookup** (confirm item & serving),
- **Daily totals & history** stored locally,
- Clean, accessible UI with quick interactions.

> To stay transparent: the codebase is currently an Expo application scaffold. The end‑to‑end food recognition and nutrition flows are in progress and not yet available in-app.

## Current Status (What Works Today)
- ✅ **Expo app scaffold** created with `create-expo-app`.
- ✅ **Hot reload** development workflow via `npx expo start`.
- ✅ **File‑based routing** using **Expo Router** (default app directory).
- ✅ Runs in:
    - Expo Go on a device,
    - iOS Simulator,
    - Android Emulator.
- ℹ️ No production features (camera, model calls, or nutrition APIs) have been shipped yet in this repo.

## Planned Features / Roadmap
The following are planned and will be implemented incrementally. Items are listed to communicate intent; they are **not** available yet unless marked.

- **Core add‑food flows**
    - [ ] Photo → multi‑select **food predictions** (Clarifai Food workflow)
    - [ ] Text search → **USDA FoodData Central** results
    - [ ] **Serving size review** (grams/units; live macro math)
    - [ ] **Save entries** to local history (AsyncStorage)

- **UX & App polish**
    - [ ] History filters (day/week) and quick edit
    - [ ] Error/retry states and empty screens
    - [ ] Accessibility pass (TalkBack/VoiceOver, touch targets)
    - [ ] App icon, splash screen, and unified theme
    - [ ] Dark mode

- **Quality & Observability**
    - [ ] Unit tests for nutrition parsing and portion math (Jest + RTL)
    - [ ] Basic analytics events (session timing, add‑food funnel)
    - [ ] Crash reporting (e.g., Sentry) with source maps

- **Performance**
    - [ ] Cold start P50 ≤ 2.0s / P95 ≤ 4.0s
    - [ ] Photo→save flow P50 ≤ 6.0s / P95 ≤ 10.0s

- **Nice‑to‑haves (later)**
    - [ ] Offline caching of recent items
    - [ ] Recent foods & favorites
    - [ ] Barcode quick add
    - [ ] Localization scaffolding (i18n)

## Tech Stack
- **App:** Expo (React Native)
- **Routing:** Expo Router (file‑based)
- **Language:** JavaScript (TypeScript migration planned)
- **Storage:** AsyncStorage (planned)
- **External services (planned):** Clarifai (food recognition), USDA FDC (nutrition)

## Project Structure
> Default Expo Router layout; will evolve with features.

```
/app
  (routes live here; e.g., /, /history, /settings as features land)
assets/
README.md
```

## Getting Started

1) **Install dependencies**
```bash
npm install
```

2) **Run the app**
```bash
npx expo start
```

In the CLI, open on:
- **Expo Go** (QR code),
- **Android emulator**,
- **iOS simulator**.

## Scripts
```bash
npm run dev      # alias for `expo start` (add if desired)
npm run lint     # add ESLint and this script when ready
npm test         # add Jest + RTL and this script when tests are added
```

## Quality & Performance Goals
- Ship small, reviewable PRs with screenshots/GIFs for UI changes.
- Maintain fast interactions; avoid jank during photo or search flows.
- Add automated tests as the domain logic (portion math, parsing) lands.

## Contributing
Contributions are welcome once the core scaffolding stabilizes.  
Please keep changes focused and include context in PR descriptions.

## License
TBD. Choose a license (MIT is common for open‑source); until then, all rights reserved.