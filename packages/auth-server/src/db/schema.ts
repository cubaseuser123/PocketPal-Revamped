import { pgTable, uniqueIndex, uuid, varchar, boolean, timestamp, index, text, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============================================
// Enums (must exist for foreign key references)
// ============================================
export const userRole = pgEnum("UserRole", ['user', 'admin']);
export const walletType = pgEnum("WalletType", ['primary', 'savings']);
export const ppiType = pgEnum("PpiType", ['small_ppi', 'full_kyc_ppi']);
export const transactionType = pgEnum("TransactionType", ['expense', 'income', 'transfer']);
export const friendStatus = pgEnum("FriendStatus", ['pending', 'accepted', 'rejected']);
export const splitGroupStatus = pgEnum("SplitGroupStatus", ['active', 'settled']);
export const splitExpenseStatus = pgEnum("SplitExpenseStatus", ['pending', 'paid']);
export const bossStatus = pgEnum("BossStatus", ['active', 'defeated', 'upcoming']);
export const questType = pgEnum("QuestType", ['savings', 'spending', 'streak', 'social', 'special']);
export const questDifficulty = pgEnum("QuestDifficulty", ['easy', 'medium', 'hard']);
export const renewalCycle = pgEnum("RenewalCycle", ['weekly', 'monthly', 'yearly']);
export const subscriptionStatus = pgEnum("SubscriptionStatus", ['active', 'upcoming', 'cancelled']);
export const notificationType = pgEnum("NotificationType", ['alert', 'insight', 'celebration', 'reminder']);

// ============================================
// USERS (existing - shared with backend)
// ============================================
export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }),  // Better Auth expects email
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text(),  // Better Auth expects image
  phoneNumber: varchar("phone_number", { length: 100 }),  // Better Auth phone plugin field
  phoneNumberVerified: boolean("phone_number_verified").default(false).notNull(),
  // Legacy field - keep for backwards compatibility
  phone: varchar({ length: 100 }),
  role: userRole().default('user').notNull(),
  level: integer().default(1).notNull(),
  coins: integer().default(0).notNull(),
  avatarUrl: text("avatar_url"),
  friendCode: varchar("friend_code", { length: 100 }),
  kycCompleted: boolean("kyc_completed").default(false).notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true, mode: 'date' }),
  lastSpinDate: timestamp("last_spin_date", { withTimezone: true, mode: 'date' }),
  totalGoalsCompleted: integer("total_goals_completed").default(0).notNull(),
  expoPushToken: varchar("expo_push_token", { length: 255 }),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'date' }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index("users_friend_code_idx").using("btree", table.friendCode.asc().nullsLast().op("text_ops")),
  uniqueIndex("users_friend_code_key").using("btree", table.friendCode.asc().nullsLast().op("text_ops")),
  index("users_phone_idx").using("btree", table.phone.asc().nullsLast().op("text_ops")),
  uniqueIndex("users_phone_key").using("btree", table.phone.asc().nullsLast().op("text_ops")),
]);

// ============================================
// EXISTING APP TABLES (for schema completeness)
// ============================================
export const categories = pgTable("categories", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: varchar({ length: 100 }).notNull(),
  emoji: varchar({ length: 10 }).notNull(),
  color: varchar({ length: 7 }).default('#FF8C32').notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex("categories_name_key").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const wallets = pgTable("wallets", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  type: walletType().notNull(),
  balance: numeric({ precision: 15, scale: 2 }).default('0.00').notNull(),
  ppiType: ppiType("ppi_type").default('small_ppi').notNull(),
  ppiId: varchar("ppi_id", { length: 100 }),
  monthlyLoaded: numeric("monthly_loaded", { precision: 15, scale: 2 }).default('0.00').notNull(),
  lastLoadReset: timestamp("last_load_reset", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  walletId: uuid("wallet_id").notNull(),
  categoryId: uuid("category_id"),
  groupId: uuid("group_id"),
  name: varchar({ length: 255 }).notNull(),
  emoji: varchar({ length: 10 }).default('💰').notNull(),
  amount: numeric({ precision: 15, scale: 2 }).notNull(),
  type: transactionType().notNull(),
  note: text(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const goals = pgTable("goals", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  name: varchar({ length: 255 }).notNull(),
  emoji: varchar({ length: 10 }).default('🎯').notNull(),
  category: varchar({ length: 100 }).default('General').notNull(),
  color: varchar({ length: 7 }).default('#FF8C32').notNull(),
  targetAmount: numeric("target_amount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 15, scale: 2 }).default('0.00').notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  targetDate: timestamp("target_date", { withTimezone: true, mode: 'date' }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const friends = pgTable("friends", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  requesterId: uuid("requester_id").notNull(),
  recipientId: uuid("recipient_id").notNull(),
  status: friendStatus().default('pending').notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const splitGroups = pgTable("split_groups", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: varchar({ length: 255 }).notNull(),
  creatorId: uuid("creator_id").notNull(),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull(),
  status: splitGroupStatus().default('active').notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const splitGroupMembers = pgTable("split_group_members", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  groupId: uuid("group_id").notNull(),
  userId: uuid("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const splitExpenses = pgTable("split_expenses", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  groupId: uuid("group_id").notNull(),
  payerId: uuid("payer_id").notNull(),
  owerId: uuid("ower_id").notNull(),
  amount: numeric({ precision: 15, scale: 2 }).notNull(),
  status: splitExpenseStatus().default('pending').notNull(),
  transactionId: varchar("transaction_id", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userBadges = pgTable("user_badges", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  badgeId: varchar("badge_id", { length: 50 }).notNull(),
  earnedAt: timestamp("earned_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const bossBattles = pgTable("boss_battles", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  imageUrl: text("image_url"),
  emoji: varchar({ length: 10 }).default('👾').notNull(),
  sidekickEmoji: varchar("sidekick_emoji", { length: 10 }),
  totalHealth: integer("total_health").notNull(),
  currentHealth: integer("current_health").notNull(),
  rewardCoins: integer("reward_coins").default(0).notNull(),
  rewardXp: integer("reward_xp").default(0).notNull(),
  status: bossStatus().default('upcoming').notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true, mode: 'date' }),
  endsAt: timestamp("ends_at", { withTimezone: true, mode: 'date' }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const bossBattleLeaderboard = pgTable("boss_battle_leaderboard", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  battleId: uuid("battle_id").notNull(),
  userId: uuid("user_id").notNull(),
  damage: integer().default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const quests = pgTable("quests", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  type: questType().default('savings').notNull(),
  requirementAction: varchar("requirement_action", { length: 50 }),
  requirementTarget: integer("requirement_target"),
  rewardCoins: integer("reward_coins").default(0).notNull(),
  rewardXp: integer("reward_xp").default(0).notNull(),
  difficulty: questDifficulty().default('easy').notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'date' }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const questAssignments = pgTable("quest_assignments", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  questId: uuid("quest_id").notNull(),
  userId: uuid("user_id").notNull(),
  progress: integer().default(0).notNull(),
  completed: boolean().default(false).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: 'date' }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  name: varchar({ length: 255 }).notNull(),
  price: numeric({ precision: 15, scale: 2 }).notNull(),
  category: varchar({ length: 100 }).default('general').notNull(),
  startDate: timestamp("start_date", { withTimezone: true, mode: 'date' }).notNull(),
  nextRenewal: timestamp("next_renewal", { withTimezone: true, mode: 'date' }).notNull(),
  renewalCycle: renewalCycle("renewal_cycle").default('monthly').notNull(),
  status: subscriptionStatus().default('active').notNull(),
  isReminderOn: boolean("is_reminder_on").default(true).notNull(),
  roundOffAmount: numeric("round_off_amount", { precision: 15, scale: 2 }).default('0.00').notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const conversationMemory = pgTable("conversation_memory", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  role: varchar({ length: 20 }).notNull(),
  content: text().notNull(),
  summary: text(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  type: notificationType().notNull(),
  title: varchar({ length: 255 }).notNull(),
  body: text().notNull(),
  read: boolean().default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================
// BETTER AUTH TABLES (NEW)
// ============================================

// Sessions table for Better Auth
export const sessions = pgTable("sessions", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  token: varchar({ length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Accounts table for OAuth providers
export const accounts = pgTable("accounts", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true, mode: "date" }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true, mode: "date" }),
  scope: text(),
  idToken: text("id_token"),
  password: text(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Verifications table for email/phone verification
export const verifications = pgTable("verifications", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  identifier: varchar({ length: 255 }).notNull(),
  value: varchar({ length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// JWKS table for JWT plugin
export const jwks = pgTable("jwks", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================
// BETTER AUTH ALIASES (singular names)
// ============================================
export const user = users;
export const session = sessions;
export const account = accounts;
export const verification = verifications;
