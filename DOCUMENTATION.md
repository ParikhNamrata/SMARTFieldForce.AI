# SMARTFieldForce.AI Documentation

## Overview
**SMARTFieldForce.AI** is an advanced field force management platform that empowers enterprises to configure, deploy, and manage intelligent mobile applications for their field agents. Using AI-driven task cycles, vision automation, and real-time route optimization, it streamlines field operations and increases productivity.

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

### 2. Vision Automation (Audit)
Leverages computer vision to automate store audits and planogram compliance.
*   **Planogram Verification**: Analyzes shelf photos to detect SKU availability and positioning.
*   **Automated Reporting**: Generates instant audit scores and identifies missing items.

### 3. Route Optimizer & Planner
AI-powered logistics to minimize travel distance and maximize visit frequency.
*   **Optimized Routing**: Calculates the most efficient path between assigned outlets.
*   **Smart Stops**: Real-time status tracking of scheduled visits.

### 4. Sales Insights & Reporting
Interactive data visualization for field performance.
*   **Real-time Charts**: Tracks sales targets, visit completion rates, and market trends.
*   **Customizable KPIs**: Admins can define which metrics are most critical for their team.

### 5. Performance & Training Hub
Focuses on agent growth and target achievement.
*   **Training Modules**: Micro-learning content with XP rewards for agents.
*   **Performance Tracking**: Visualizes target progress, rankings, and distance traveled.

---

## Configuration & Management

### Feature Customization
Administrators can enable or disable specific modules (e.g., Stock Radar, Territory Map) through a simple toggle interface. Disabling a feature removes it from the agent's mobile UI and logic cycles.

### UI Reordering
The dashboard supports **drag-and-drop reordering** of features. The order established in the portal determines the priority of modules in the mobile app's home screen and navigation menus.

### Smart Bot Quick-Actions
Admins can specifically configure which "Quick Action" buttons appear in the Smart Bot interface. These include:
*   Audit Check-ins
*   Stock Level queries
*   Campaign Information
*   Next-stop Navigation
*   Payout/Incentive status

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
