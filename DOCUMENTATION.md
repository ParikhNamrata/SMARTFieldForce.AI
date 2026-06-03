# SMARTFieldForce.AI Documentation

## Overview
**SMARTFieldForce.AI** is an advanced field force management platform that empowers enterprises to configure, deploy, and manage intelligent mobile applications for their field agents (e.g., in collaboration with retail partners such as Unilever and Smollan). Using AI-driven task cycles, vision automation, and real-time route optimization, it streamlines field operations and increases productivity.

The application consists of two primary environments:
1.  **Admin Portal (Configurator)**: A web-based dashboard where administrators can customize the mobile app's features, layout, and AI behavior.
2.  **Mobile Simulator**: A real-time, interactive preview of the field agent's mobile application, reflecting configuration changes instantly.

---

## Core Features

### 1. Smart Bot (AI-Driven Assistant)
A generative AI assistant that field agents can interact with via voice or text.
*   **Predictive Actions**: Suggests logical next steps based on the agent's current context.
*   **Knowledge Retrieval**: Provides product manuals, campaign information, and safety protocols instantly.
*   **Voice Integration**: Supports voice-to-text for hands-free reporting in the field.

### 2. Multi-Modal Vision Automation & Shelf Audits
Leverages computer vision to automate store audits and planogram compliance. This module matches physical product configurations on shelving units:
*   **Dual Camera Inputs**: Captures live snapshots via the device viewfinder or standard gallery file uploads.
*   **Planogram Verification**: Analyzes shelf layout photos (using SIFT alignment-inspired mock detection models) to count SKUs for key brands (Dove Soap, Dove Shampoo, Lux, Lifebuoy) and detect out-of-stocks.
*   **Automated Audit Reporting**: Generates instant accuracy percentages, logs discrepancies, and saves logs into a secure offline ledger.

### 3. Integrated Speech Engine & Sandbox Fallback
To verify vocal control loops robustly under all operating environments, the audio interface is equipped with a modern bidirectional pipeline:
*   **Native Dictation**: Incorporates standard Web Speech Recognition APIs (`webkitSpeechRecognition` / `SpeechRecognition`) to let field operators speak inventory numbers directly (e.g., *"Count Lux 15, Dove Soap 40"*).
*   **Synthesized Feedback**: Leverages `speechSynthesis` to audio-read system confirmations back to the field operator, confirming active check-ins, warning triggers, or checklist completions.
*   **Dynamic Sandbox Typing**: In security-restricted preview environments (like iframe windows where microphone hardware access is blocked), a custom developer input allows simulating actual spoken transcripts seamlessly.

### 4. Adaptive AI Field Quiz
An on-site cognitive check and training mechanism designed to boost regional representative accuracy:
*   **Log-Based Adaptive Generation**: Dynamically evaluates the user's historical actions (such as past order bookings or vision audits) using the local ledger to compose context-rich questions (e.g., order scheme math or compliance policies).
*   **Core Concepts Fallback**: Provides pre-configured, curated questionnaires targeting planogram Golden Zones and visual inspection alignments if no past logs exist.
*   **Interactive Controls**: Supports responsive choice selections, instant color-coded answer confirmations, complete text explanations, and visual progress tracking.

### 5. Scheme-Aware Order Booking
A smart ordering application configured with business logic tailored for regional distributors:
*   **Real-Time Stock Flags**: Warns merchandisers of items matching critical Out-of-Stock (OOS) conditions flagged during retail visits.
*   **Discounts Scheme Optimizer**: Integrates specific discount schemes (e.g., 5% bonus rewards when ordering more than 20 units).
*   **Automated Apply**: Includes a recommendations utility that automatically populates optimal purchase levels to unlock maximum wholesale benefits.

### 6. Route Optimizer & Planner
AI-powered logistics to minimize travel distance and maximize visit frequency.
*   **Optimized Routing**: Calculates the most efficient path between assigned outlets.
*   **Smart Stops**: Real-time status tracking of scheduled visits.

---

## Configuration & Management

### Cross-View Live Synchronization
Administrators manage configuration settings (toggling Stock Radar, Voice Command, and AI Quizzes) which are synchronized instantly across separate tabs:
*   **BroadcastChannel Bridge**: Uses high-performance HTML5 BroadcastChannel channels (`smart_app_sync_channel`) to replicate configuration objects to running simulators inside nested iframes without reloading.
*   **Storage Fallbacks**: Monitors storage events gracefully (`StorageEvent` context triggers) if specific runtimes do not support broad web channel features.

### UI Reordering
The dashboard supports **drag-and-drop reordering** of features. The order established in the portal determines the priority of modules in the mobile app's home screen and navigation menus.

---

## Technical Stack

*   **Frontend**: React 18+ with TypeScript.
*   **Build System**: Vite.
*   **Styling**: Tailwind CSS for utility-first design.
*   **Animations**: Motion (formerly Framer Motion) for smooth UI transitions and reordering logic.
*   **Icons**: Lucide React.
*   **AI Integration**: Google GenAI SDK (Gemini API) for predictive chat and insights.
*   **Charts**: Recharts & D3 for data visualization.

---

## Development & Deployment

### Installation
```bash
npm install
```

### Environment Variables
The application requires the following environment variables (defined in `.env.example`):
*   `GEMINI_API_KEY`: Required for the Smart Bot and AI-driven reporting features.

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```
