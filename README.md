# 🚀 PocketPal — Monorepo Setup Guide

PocketPal is a **cross-platform financial tracking app** built using a **Turborepo monorepo**.

It contains:

- **Web App** → Next.js
- **Mobile App** → Ionic + Capacitor + React
- **Backend API** → Express.js
- **Shared Packages** → UI, TS Config, ESLint Config
- **Package Manager** → pnpm
- **Build System** → Turborepo

This guide helps teammates clone, install, and run the entire project easily.

---

# 📁 Repository Structure

```
pocketpal/
│
├── apps/
│   ├── backend/            # Express.js API server
│   ├── mobile/             # Ionic + Capacitor (React) mobile app
│   └── web/                # Next.js web app
│
├── packages/
│   ├── eslint-config/      # Shared ESLint rules
│   ├── typescript-config/  # Shared tsconfig.json presets
│   └── ui/                 # Shared UI components + utilities
│
├── turbo.json              # Turborepo pipelines
├── pnpm-workspace.yaml     # pnpm workspace setup
├── package.json
├── .syncpackrc.json
├── .npmrc
└── README.md
```

---

# 🛠️ Tech Stack

### **Web (apps/web)**

- Next.js
- React
- TailwindCSS
- shadcn/ui
- Shared UI package

### **Mobile (apps/mobile)**

- Ionic Framework
- React
- Capacitor
- TailwindCSS

### **Backend (apps/backend)**

- Node.js
- Express.js

### **Monorepo Tools**

- Turborepo
- pnpm workspaces

### **Shared Packages**

- UI Component Library (`packages/ui`)
- TypeScript Config (`packages/typescript-config`)
- ESLint Config (`packages/eslint-config`)

---

# 📦 Prerequisites

Make sure you have the following installed:

| Tool                       | Version                      |
| -------------------------- | ---------------------------- |
| **Node.js**                | v20+                         |
| **pnpm**                   | v8+                          |
| **Git**                    | Any recent version           |
| **Android Studio / Xcode** | For running mobile builds    |
| **Ionic CLI**              | _(optional but recommended)_ |

Install pnpm if needed:

```
npm install -g pnpm
```

Install Ionic CLI:

```
npm install -g @ionic/cli
```

---

# 📥 1. Clone the Repository

```
git clone <repo-url>
cd pocketpal
```

---

# 📦 2. Install All Dependencies

```
pnpm install
```

This installs dependencies for all apps and shared packages.

---

# 🏗️ 3. Running Each App

## 🌐 Web App (Next.js)

Run using Turborepo:

```
pnpm dev --filter web
```

Or directly inside the app:

```
cd apps/web
pnpm dev
```

Runs on: **http://localhost:3000**

---

## 📱 Mobile App (Ionic + Capacitor)

Start in dev mode:

```
pnpm dev --filter mobile
```

Or:

```
cd apps/mobile
pnpm dev
```

### Run on Android:

**Android Studio must be installed and set up.**

```
cd apps/mobile
pnpm cap sync android
pnpm cap open android
```

---

## 🖥️ Backend API (Express.js)

Run via Turborepo:

```
pnpm dev --filter backend
```

Or inside the backend folder:

```
cd apps/backend
pnpm dev
```

---

# 🔁 Turborepo Commands

| Command                     | Description                  |
| --------------------------- | ---------------------------- |
| `pnpm dev`                  | Run all apps (if configured) |
| `pnpm dev --filter web`     | Run web only                 |
| `pnpm dev --filter mobile`  | Run mobile only              |
| `pnpm dev --filter backend` | Run backend only             |
| `pnpm build`                | Build everything             |
| `pnpm build --filter web`   | Build web only               |
| `pnpm lint`                 | Lint entire monorepo         |

---

# 📦 Shared Packages

### `packages/ui/`

- Shared React components
- Shared Tailwind styles

### `packages/typescript-config/`

- Base tsconfig + multiple presets
- Used by all apps

### `packages/eslint-config/`

- Shared linting rules
- Keeps code style consistent

Usage example:

```json
{
  "extends": ["@repo/typescript-config/react"],
  "eslintConfig": {
    "extends": ["@repo/eslint-config"]
  }
}
```

---

# ⚠️ Common Issues & Fixes

### ❌ Capacitor not detecting Android/iOS project

Run:

```
pnpm cap sync
```

### ❌ UI package not updating

Build the UI package:

```
pnpm build --filter ui
```

### ❌ Dependency mismatch

Run:

```
pnpm update -r
```

---

# 🤝 Contribution Workflow

1. Create a new branch
2. Make changes
3. Run `pnpm lint` and `pnpm build`
4. Commit + push
5. Open a Pull Request

---

# 🎉 You're Ready!

If you need help setting up or contributing to PocketPal, create an issue or reach out to the team.
