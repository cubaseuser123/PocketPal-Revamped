# Notification Agent System

**Tech Stack:** Vercel AI SDK • node-cron • Expo Push • Drizzle ORM  
**Purpose:** Autonomous agents that analyze user financial data and send personalized notifications

> 📖 **For complete code, see:** [agents_ref.md](./agents_ref.md)

---

## System Architecture

```mermaid
graph TB
    subgraph Scheduler["⏰ Scheduler Layer"]
        CRON["node-cron"]
        DAILY["Daily 8AM IST"]
        WEEKLY["Sunday 10AM IST"]
    end
    
    subgraph Agents["🤖 Agent Layer"]
        NOTIF["Notification Agent"]
    end
    
    subgraph Tools["🔧 Analysis Tools"]
        T1["getSpending"]
        T2["getGoals"]
        T3["getWallet"]
        T4["getSubscriptions"]
    end
    
    subgraph Delivery["📤 Delivery"]
        PUSH["Expo Push API"]
        INAPP["In-App Store"]
    end
    
    subgraph Storage["🗄️ Neon Postgres"]
        NOTIF_TBL[(notifications)]
        USERS[(users)]
    end
    
    CRON --> DAILY & WEEKLY
    DAILY & WEEKLY --> NOTIF
    NOTIF --> Tools
    NOTIF --> PUSH & INAPP
    INAPP --> NOTIF_TBL
```

---

## Agent Decision Flow

```mermaid
flowchart TD
    START([Cron Trigger]) --> FETCH[Fetch All Active Users]
    FETCH --> LOOP{For Each User}
    
    LOOP --> ANALYZE[Agent Analyzes Data]
    ANALYZE --> CHECK1{Budget Exceeded?}
    
    CHECK1 -->|Yes| URGENT[🚨 Alert - PUSH]
    CHECK1 -->|No| CHECK2{Goal Milestone?}
    
    CHECK2 -->|Yes| CELEBRATE[🎉 Celebration - PUSH]
    CHECK2 -->|No| CHECK3{Interesting Insight?}
    
    CHECK3 -->|Yes| INSIGHT[💡 Insight - IN-APP]
    CHECK3 -->|No| SKIP[Skip User]
    
    URGENT & CELEBRATE & INSIGHT --> SAVE[Save to DB + Deliver]
    SKIP --> NEXT[Next User]
    SAVE --> NEXT
    NEXT --> LOOP
    
    LOOP -->|All Done| FINISH([Complete])
```

---

## Notification Types

| Type | Priority | Trigger | Example |
|------|----------|---------|---------|
| 🚨 **Alert** | Push | Budget exceeded | "Food budget is 100% used!" |
| 🎉 **Celebration** | Push | Goal milestone | "You're 75% to your PS5! 🎮" |
| 💡 **Insight** | In-App | Pattern detected | "You spend 60% more on weekends" |
| ⏰ **Reminder** | Push | Subscription due | "Netflix renews tomorrow (₹649)" |

---

## Agent Tools

| Tool | Purpose | Data Retrieved |
|------|---------|----------------|
| `getSpending` | Analyze spending patterns | Total spent, by category, avg/day |
| `getGoals` | Check goal progress | Featured goal, % complete, goals at risk |
| `getWallet` | Get current balances | Primary, savings, total balance |
| `getSubscriptions` | Check upcoming renewals | Subscriptions due in next 7 days |

---

## File Structure

```
apps/backend/
├── agents/
│   └── notificationAgent.js
├── jobs/
│   └── cronJobs.js
├── services/
│   ├── notificationService.js
│   └── contextAggregator.js
└── routes/
    └── notificationRoutes.js

apps/mobile/
├── hooks/
│   └── useNotifications.ts
└── services/
    └── pushSetup.ts
```

---

## Cron Schedule

| Job | Time (IST) | Cron Expression | Purpose |
|-----|------------|-----------------|---------|
| Daily Notifications | 8:00 AM | `30 2 * * *` | Analyze all users, send insights |
| Weekly Recap | Sunday 10:00 AM | `30 4 * * 0` | Send weekly summary |
| Subscription Check | 9:00 AM | `30 3 * * *` | Remind about upcoming renewals |

---

## Dependencies

```json
{
  "@ai-sdk/gateway": "^1.0.0",
  "ai": "^6.0.0",
  "node-cron": "^4.2.0",
  "zod": "^4.0.0"
}
```

---

## Implementation Timeline

| Day | Task |
|-----|------|
| 1 | Create agent + context aggregator |
| 2 | Create notification service + cron jobs |
| 3 | Create API routes, update server.js |
| 4 | Mobile: useNotifications + pushSetup |
| 5 | Testing & polish |
