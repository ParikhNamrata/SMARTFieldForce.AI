# SMARTFieldForce.AI — Application Development and Architecture Notes

This document provides a technical and design overview of **SMARTFieldForce.AI**, an intelligent, enterprise-grade mobile auditor assistant and web-portal dashboard designed for leading Fast-Moving Consumer Goods (FMCG) field operators (e.g., Unilever, Procter & Gamble).

---

## 1. Application Architecture Overview

The system uses a **full-stack-ready Client-Side Single Page Application (SPA)** architecture engineered with **React (v18+)**, **Vite**, **TypeScript**, and **Tailwind CSS**. It is designed to work securely within sandboxed iframe previewers and stand-alone production servers.

```
+------------------------------------------------------------+
|                       SMARTFieldForce.AI                   |
|                        App Architecture                    |
+------------------------------------------------------------+
                              |
       +----------------------+----------------------+
       |                                             |
       v                                             v
  [ Portal Web Dashboard ]                   [ Mobile App Simulator ]
  (/portal/*)                                (/preview)
  - Features Configurator                    - Live Retail Audits
  - Dynamic Deployment Engine                 - Offline Voice Assistant
  - Integrity Metrics & Charts               - Vision AI Stock Scanner
       |                                             |
       +-----------------------+---------------------+
                               |
                               v
                +------------------------------+
                |     Sync & DB Interface      |
                | - BroadcastChannel (live)     |
                | - LocalStorage (fallback)    |
                | - local dbService ledger     |
                +------------------------------+
```

### Key Modules:
1. **PortalDashboard (`/src/views/PortalDashboard.tsx`)**: The headquarters interface for supervisors or admin users. Enables managing configuration toggles (AI stock counting, attendance verifications, predictive bot actions, route optimizers) and visualizes dynamic analytics on active agent submissions.
2. **MobileSimulator (`/src/views/MobileSimulator.tsx`)**: A fully responsive smartphone simulator rendering the core merchandiser client experience. Hosts the high-contrast interfaces for store check-ins, product inventories, AI voice agents, camera stock scanners, and active ordering selectors.
3. **App Master (`/src/App.tsx`)**: Controls primary routing (`/login`, `/portal/*`, `/preview`, `/`) and implements double-safe client configurations syncing between individual browser tabs or iframes.

---

## 2. Advanced Feature Engineering

### 2.1 Cross-IFrame Live Sync (BroadcastChannel Engine)
Because browser security restricts local storage modifications inside same-origin sandboxed iframes from updating parent or sibling views immediately, we built a **zero-lag synchronization bridge** utilizing the **HTML5 BroadcastChannel API** (`smart_app_sync_channel`).
* **Instant Propagation**: When an administrator activates or deactivates an active feature in the Configuring panel, or executes a `Deploy to Store`, the changes broadcast directly to the running running mobile client inside the simulator in real-time, instantly modifying structural navigation drawers, features availability, and bot actions with zero page reloads.
* **Storage Guard**: Smoothly falls back to structural `StorageEvent` listeners if specific legacy browser frameworks do not support standard Broadcast Channels.

### 2.2 Offline Smart Voice Assistant
To cater to remote regional stores with intermittent or poor network coverage, the mobile simulator implements a robust hybrid voice command recognition workflow:
* **True Audio Synthesizer**: Uses standard browser `SpeechSynthesisUtterance` to speech-read context back to the merchandiser with standard pitch and audio overrides.
* **Custom Regex Parser**: Custom, highly optimized expressions translate spoken metrics directly into active digital inventories.
  * **Pattern Matching**: Automatically isolates keywords like `Dove`, `Shampoo`, `Lux`, or `Lifebuoy`, paired with physical counts (e.g., *"Count Dove Soap 30 and Shampoo 12"*).
  * **Integrated Telemetry Ledger**: Decoded commands update active shelf SKU counts, insert new target quantities into active purchase order sheets, and document occurrences inside the **Voice Telemetry Journal**.
* **Simulated Dictation Fallback**: Avoids breaking during sandboxed security constraints by providing a beautifully designed, high-contrast typing panel displaying real-time waveform animations and input locks to test the exact same dictionary and audio processing thread.

### 2.3 Integrated Vision AI Stock Auditor
Enables field agents to register active rack/shelf health status using camera captures:
* **Interactive Media Feed**: Triggers simulated frame-by-frame shelf analyzers capturing photo states (Shop board tags, physical shelf space, or campaign posters).
* **Automated Audit Logic**: Uses computer vision-inspired mock detection models to match stock counts, extract product IDs, calculate percentage accuracy, and write log items directly to database states.

### 2.4 Scheme-Aware Ordering System
The merchandiser ordering portal manages target SKU lists (`dove-soap`, `dove-shampoo`, `lux-soap`, `lifebuoy-wash`), complete with:
* **Discounts and Schemes Matching**: Active schemes are mapped to corresponding product items (e.g., *"Unilever Pride Block Sale: Order >20 cases and get 5% additional cashback"*).
* **Automatic Scheme Optimization**: Automatically identifies and applies the best scheme configuration matching active target quantities to maximize margins during checkout.

---

## 3. Database Ledger Service (`dbService`)

Offline data flows are maintained by `src/services/db.ts` implementing a structured data ledger:

```typescript
export interface InteractionLog {
  id: string;
  timestamp: string; // ISO datetime
  userId: string;
  type: 'chat' | 'vision' | 'quiz' | 'order';
  content: any; // Context-rich payload
  summary: string; // Brief readable summary for reports
}
```

* **Persistence**: Read/write sequences map into the safe sandbox-safe key `smart_field_logs`.
* **Automated Analytics Generator**: The core statistics dashboard analyzes this ledger in real-time to compute supervisor high-level indexes like total logged actions, chat sentiment ratios, average vision audit accuracy, and strategic recommender outputs.

---

## 4. UI/UX Design System Practices

* **Design Aesthetic**: Built on a premium **Slate Dark & High-Contrast Light Theme** featuring ultra-clean Inter card layouts, crisp JetBrains Mono typography for system and telemetry values, and smooth scale/fade entry transitions provided by `motion/react`.
* **Tailwind Utility Stack**: Pure utility-based styling with strict touch targets (minimum 44px on clickable actions), full screen-height layout enclosures, and modern visual indicators (shimmering rings, pulse active indicators, custom scrollbars).

---

## 5. Development CLI Commands Reference

Perform standard developer operations in the project root:

```bash
# 1. Install dependencies
npm install

# 2. Start development watch server
npm run dev

# 3. Code formatting & TypeScript validation
npm run lint

# 4. Production compiled build outputs
npm run build
```
