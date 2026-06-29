<div align="center">
  <h1>🚀 PocketPal</h1>
  <p><strong>Autonomous Financial Companion & Gamified Expense Tracker for Gen-Z</strong></p>

  <!-- USER: Replace this placeholder with your actual Loom link -->
  [![Watch the Demo](https://img.shields.io/badge/Watch%20Demo-Loom-FF4F00?style=for-the-badge&logo=loom)](https://www.loom.com/share/cf38c99f7a2846a9b38f73a89b73beff)
  
  ![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
  ![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-000000?style=for-the-badge&logo=vercel&logoColor=white)
  ![Mistral AI](https://img.shields.io/badge/Mistral_7B-F37F40?style=for-the-badge&logo=mistral&logoColor=white)
</div>

<br />

## 💡 The Core Philosophy
PocketPal is a gamified financial companion designed to fix the broken spending habits of Gen-Z. It is not a passive budgeting spreadsheet—it is an active, behavior-modifying engine.

The core behavioral loop is simple but powerful:
1. **Set Goals:** Define a weekly saving goal (short-term) or a major milestone like a new MacBook (long-term).
2. **Save & Build Streaks:** Every day you successfully save money or resist an impulse purchase, you earn a streak. **Think of it as Snapchat streaks meeting FamPay.**
3. **Earn Rewards:** Maintaining longer streaks unlocks in-app rewards, coins, and badges.
4. **Gamify Everything:** Restraint becomes a reward. Boss battles, 1v1 wagers, and daily spins make financial discipline addictive.

---

## 📱 Part 1: The App Ecosystem

PocketPal's frontend is a fully-featured React Native mobile application designed with behavioral psychology at its core.

- **Wallets (Real Money, Real Stakes):** RBI-compliant PPI (Prepaid Payment Instrument) infrastructure via Cashfree & Setu. Users can instantly load money via UPI. Tier 1 allows for ₹10,000 limits without KYC, while Tier 2 unlocks up to ₹2,00,000.
- **The Arcade:** This is the gamification hub. Users can participate in community **Boss Battles** (e.g., defeating the "Inflation Dragon" by collectively saving money), challenge friends in **1v1 Duels**, and spend earned coins in the **Coin Shop** to buy Streak Shields or UI themes.
- **Goals & Tracking:** Visual progress bars for every goal, automated categorized spending analytics, and subscription tracking to ensure users always know where their money is going.

---

## 🧠 Part 2: The AI & Agentic Architecture

The AI in PocketPal isn't a gimmick wrapper; it is deeply integrated into the user's financial lifecycle through multi-agent orchestration.

### 1. Pally: The Fine-Tuned Financial LLM
We fine-tuned a **Mistral 7B** model using **Unsloth** on a custom dataset specifically tailored for financial interactions and strict chatbot behavioral guidelines. 
*(Note: While the custom fine-tuned weights have been trained and validated, the current live environment utilizes Gemini 2.0 Flash via the Vercel AI SDK due to hosting constraints for the 7B model).*

### 2. Conversational Tool-Calling Agents
Pally is designed with strict **Zero Hallucination** constraints. It is equipped with a suite of **15 specialized backend tools**.
- When a user asks *"Where did I spend most?"*, the agent doesn't guess. It intelligently routes the intent to a specific tool, executes a database query, retrieves the exact ₹ amount and percentage, and synthesizes a deterministic, data-backed response.

### 3. The Autonomous Notification Swarm
A proactive background agent scheduled via `node-cron` that runs every morning.
- **Context Injection:** It analyzes the user's current financial state, active streaks, and goal proximity.
- **LLM Decision Engine:** Based on the data, the LLM *decides* whether a notification is warranted, assigns a priority level, and generates a personalized push notification.
- **Constraints:** To prevent notification fatigue, the agent is strictly bounded to generating messages <100 characters and is hard-capped at 1 push per day.

### 4. The Spending Guardian (Monitoring Agent)
An on-device monitoring system designed to intervene *before* a bad financial decision is made.
- **Contextual Awareness:** Detects when the user opens known spending/delivery apps (like Swiggy, Zomato, or Myntra).
- **Real-Time Processing:** Cross-references this real-time signal against the user's weekly budget and recent spending habits.
- **Proactive Nudge:** Fires a high-priority intervention nudge to stop impulse buying, seamlessly tying back into the core loop by offering Arcade coins as a reward for restraint.

---

## 🏗️ Architecture & Tech Stack

PocketPal is structured as a **Turborepo monorepo**:

- **Mobile App:** Expo, React Native, NativeWind (TailwindCSS for RN)
- **Backend API:** Node.js, Express.js, MongoDB
- **AI & Agents:** Vercel AI SDK, Gemini 2.0 Flash, Mistral 7B + Unsloth
- **Tooling:** pnpm workspaces, ESLint, TypeScript

*(Note: The `apps/web` directory contains legacy Next.js web dashboard code that is currently inactive in favor of the mobile-first strategy).*

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js** v20+
- **pnpm** v8+
- **Android Studio** / **Xcode** (for mobile builds)

### 1. Clone & Install
```bash
git clone https://github.com/cubaseuser123/PocketPal-Revamped.git
cd PocketPal-Revamped
pnpm install
```

### 2. Running the Apps

**Backend API (Express.js)**
```bash
pnpm dev --filter backend
```

**Mobile App (Expo)**
```bash
pnpm dev --filter mobile
# Or run natively:
cd apps/mobile
npx expo run:android  # or run:ios
```

### 3. Monorepo Commands
| Command | Action |
| :--- | :--- |
| `pnpm dev` | Run active apps concurrently |
| `pnpm build` | Build the entire monorepo |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm update -r` | Update dependencies globally |

---

## 🤝 Contributing
1. Create a feature branch
2. Make your changes
3. Run `pnpm lint` and `pnpm build`
4. Submit a Pull Request

*Built for the Mastek Project Deep Blue Season 11.*
