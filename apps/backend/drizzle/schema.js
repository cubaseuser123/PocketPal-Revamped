import { pgTable, uniqueIndex, uuid, varchar, boolean, timestamp, index, text, integer, foreignKey, numeric, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm/relations";

export const bossStatus = pgEnum("BossStatus", ['active', 'defeated', 'upcoming']);
export const friendStatus = pgEnum("FriendStatus", ['pending', 'accepted', 'rejected']);
export const notificationType = pgEnum("NotificationType", ['alert', 'insight', 'celebration', 'reminder', 'nudge']);
export const ppiType = pgEnum("PpiType", ['small_ppi', 'full_kyc_ppi']);
export const questDifficulty = pgEnum("QuestDifficulty", ['easy', 'medium', 'hard']);
export const questType = pgEnum("QuestType", ['savings', 'spending', 'streak', 'social', 'special']);
export const renewalCycle = pgEnum("RenewalCycle", ['weekly', 'monthly', 'yearly']);
export const splitExpenseStatus = pgEnum("SplitExpenseStatus", ['pending', 'paid']);
export const splitGroupStatus = pgEnum("SplitGroupStatus", ['active', 'settled']);
export const subscriptionStatus = pgEnum("SubscriptionStatus", ['active', 'upcoming', 'cancelled']);
export const transactionType = pgEnum("TransactionType", ['expense', 'income', 'transfer']);
export const userRole = pgEnum("UserRole", ['user', 'admin']);
export const walletType = pgEnum("WalletType", ['primary', 'savings']);
export const duelStatus = pgEnum("DuelStatus", ['pending', 'active', 'completed', 'expired', 'declined']);
export const duelType = pgEnum("DuelType", ['most_saved', 'fewest_expenses', 'no_spend_streak']);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	phoneNumber: varchar("phone_number", { length: 100 }).notNull(),
	phoneNumberVerified: boolean("phone_number_verified").default(false).notNull(),
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
	planBEnabled: boolean("plan_b_enabled").default(true).notNull(),
	autonomousModeEnabled: boolean("autonomous_mode_enabled").default(false).notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'date' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("users_friend_code_idx").using("btree", table.friendCode.asc().nullsLast().op("text_ops")),
	uniqueIndex("users_friend_code_key").using("btree", table.friendCode.asc().nullsLast().op("text_ops")),
	index("users_phone_idx").using("btree", table.phoneNumber.asc().nullsLast().op("text_ops")),
	uniqueIndex("users_phone_key").using("btree", table.phoneNumber.asc().nullsLast().op("text_ops")),
]);

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
}, (table) => [
	index("quests_is_active_expires_at_idx").using("btree", table.isActive.asc().nullsLast(), table.expiresAt.asc().nullsLast()),
]);

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
}, (table) => [
	index("subscriptions_next_renewal_status_idx").using("btree", table.nextRenewal.asc().nullsLast(), table.status.asc().nullsLast()),
	index("subscriptions_user_id_idx").using("btree", table.userId.asc().nullsLast()),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "subscriptions_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
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
}, (table) => [
	index("wallets_user_id_idx").using("btree", table.userId.asc().nullsLast()),
	uniqueIndex("wallets_user_id_type_key").using("btree", table.userId.asc().nullsLast(), table.type.asc().nullsLast()),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "wallets_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const splitGroups = pgTable("split_groups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	creatorId: uuid("creator_id").notNull(),
	totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull(),
	status: splitGroupStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("split_groups_creator_id_idx").using("btree", table.creatorId.asc().nullsLast()),
	index("split_groups_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.creatorId],
		foreignColumns: [users.id],
		name: "split_groups_creator_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

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
}, (table) => [
	index("transactions_group_id_idx").using("btree", table.groupId.asc().nullsLast()),
	index("transactions_user_id_category_id_idx").using("btree", table.userId.asc().nullsLast(), table.categoryId.asc().nullsLast()),
	index("transactions_user_id_created_at_idx").using("btree", table.userId.asc().nullsLast(), table.createdAt.desc().nullsFirst()),
	index("transactions_wallet_id_idx").using("btree", table.walletId.asc().nullsLast()),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "transactions_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.walletId],
		foreignColumns: [wallets.id],
		name: "transactions_wallet_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.categoryId],
		foreignColumns: [categories.id],
		name: "transactions_category_id_fkey"
	}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
		columns: [table.groupId],
		foreignColumns: [splitGroups.id],
		name: "transactions_group_id_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

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
}, (table) => [
	index("goals_user_id_idx").using("btree", table.userId.asc().nullsLast()),
	index("goals_user_id_is_featured_idx").using("btree", table.userId.asc().nullsLast(), table.isFeatured.asc().nullsLast()),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "goals_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const friends = pgTable("friends", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	requesterId: uuid("requester_id").notNull(),
	recipientId: uuid("recipient_id").notNull(),
	status: friendStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("friends_recipient_id_status_idx").using("btree", table.recipientId.asc().nullsLast(), table.status.asc().nullsLast()),
	uniqueIndex("friends_requester_id_recipient_id_key").using("btree", table.requesterId.asc().nullsLast(), table.recipientId.asc().nullsLast()),
	index("friends_requester_id_status_idx").using("btree", table.requesterId.asc().nullsLast(), table.status.asc().nullsLast()),
	foreignKey({
		columns: [table.requesterId],
		foreignColumns: [users.id],
		name: "friends_requester_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.recipientId],
		foreignColumns: [users.id],
		name: "friends_recipient_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const splitGroupMembers = pgTable("split_group_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupId: uuid("group_id").notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("split_group_members_group_id_idx").using("btree", table.groupId.asc().nullsLast()),
	uniqueIndex("split_group_members_group_id_user_id_key").using("btree", table.groupId.asc().nullsLast(), table.userId.asc().nullsLast()),
	index("split_group_members_user_id_idx").using("btree", table.userId.asc().nullsLast()),
	foreignKey({
		columns: [table.groupId],
		foreignColumns: [splitGroups.id],
		name: "split_group_members_group_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "split_group_members_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

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
}, (table) => [
	index("split_expenses_group_id_idx").using("btree", table.groupId.asc().nullsLast()),
	index("split_expenses_ower_id_status_idx").using("btree", table.owerId.asc().nullsLast(), table.status.asc().nullsLast()),
	index("split_expenses_payer_id_idx").using("btree", table.payerId.asc().nullsLast()),
	foreignKey({
		columns: [table.groupId],
		foreignColumns: [splitGroups.id],
		name: "split_expenses_group_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.payerId],
		foreignColumns: [users.id],
		name: "split_expenses_payer_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.owerId],
		foreignColumns: [users.id],
		name: "split_expenses_ower_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const userBadges = pgTable("user_badges", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	badgeId: varchar("badge_id", { length: 50 }).notNull(),
	earnedAt: timestamp("earned_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("user_badges_user_id_badge_id_key").using("btree", table.userId.asc().nullsLast(), table.badgeId.asc().nullsLast()),
	index("user_badges_user_id_idx").using("btree", table.userId.asc().nullsLast()),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_badges_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

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
}, (table) => [
	index("boss_battles_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
]);

export const bossBattleLeaderboard = pgTable("boss_battle_leaderboard", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	battleId: uuid("battle_id").notNull(),
	userId: uuid("user_id").notNull(),
	damage: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("boss_battle_leaderboard_battle_id_damage_idx").using("btree", table.battleId.asc().nullsLast(), table.damage.desc().nullsFirst()),
	index("boss_battle_leaderboard_battle_id_idx").using("btree", table.battleId.asc().nullsLast()),
	uniqueIndex("boss_battle_leaderboard_battle_id_user_id_key").using("btree", table.battleId.asc().nullsLast(), table.userId.asc().nullsLast()),
	foreignKey({
		columns: [table.battleId],
		foreignColumns: [bossBattles.id],
		name: "boss_battle_leaderboard_battle_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "boss_battle_leaderboard_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const questAssignments = pgTable("quest_assignments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	questId: uuid("quest_id").notNull(),
	userId: uuid("user_id").notNull(),
	progress: integer().default(0).notNull(),
	completed: boolean().default(false).notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'date' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("quest_assignments_quest_id_idx").using("btree", table.questId.asc().nullsLast()),
	uniqueIndex("quest_assignments_quest_id_user_id_key").using("btree", table.questId.asc().nullsLast(), table.userId.asc().nullsLast()),
	index("quest_assignments_user_id_completed_idx").using("btree", table.userId.asc().nullsLast(), table.completed.asc().nullsLast()),
	foreignKey({
		columns: [table.questId],
		foreignColumns: [quests.id],
		name: "quest_assignments_quest_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "quest_assignments_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const conversationMemory = pgTable("conversation_memory", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	role: varchar({ length: 20 }).notNull(),
	content: text().notNull(),
	summary: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("conversation_memory_user_id_created_at_idx").using("btree", table.userId.asc().nullsLast(), table.createdAt.desc().nullsFirst()),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "conversation_memory_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: notificationType().notNull(),
	title: varchar({ length: 255 }).notNull(),
	body: text().notNull(),
	read: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("notifications_user_id_read_created_at_idx").using("btree", table.userId.asc().nullsLast(), table.read.asc().nullsLast(), table.createdAt.desc().nullsFirst()),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "notifications_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);



export const duels = pgTable("duels", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	challengerId: uuid("challenger_id").notNull(),
	challengedId: uuid("challenged_id").notNull(),
	type: duelType().notNull(),
	wager: integer().default(10).notNull(),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'date' }),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'date' }),
	winnerId: uuid("winner_id"),
	status: duelStatus().default('pending').notNull(),
	challengerProgress: integer("challenger_progress").default(0).notNull(),
	challengedProgress: integer("challenged_progress").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("duels_challenger_id_idx").using("btree", table.challengerId.asc().nullsLast()),
	index("duels_challenged_id_idx").using("btree", table.challengedId.asc().nullsLast()),
	index("duels_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.challengerId],
		foreignColumns: [users.id],
		name: "duels_challenger_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.challengedId],
		foreignColumns: [users.id],
		name: "duels_challenged_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.winnerId],
		foreignColumns: [users.id],
		name: "duels_winner_id_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

export const shopItems = pgTable("shop_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	emoji: varchar({ length: 10 }).default('🎁').notNull(),
	category: varchar({ length: 50 }).notNull(),
	price: integer().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("shop_items_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("shop_items_is_active_idx").using("btree", table.isActive.asc().nullsLast()),
]);

export const userPurchases = pgTable("user_purchases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	itemId: uuid("item_id").notNull(),
	price: integer().notNull(),
	purchasedAt: timestamp("purchased_at", { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("user_purchases_user_id_idx").using("btree", table.userId.asc().nullsLast()),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_purchases_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.itemId],
		foreignColumns: [shopItems.id],
		name: "user_purchases_item_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

// ============================================
// BETTER AUTH TABLES (Copied from auth-server)
// ============================================

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

export const verifications = pgTable("verifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	identifier: varchar({ length: 255 }).notNull(),
	value: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const jwks = pgTable("jwks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	publicKey: text("public_key").notNull(),
	privateKey: text("private_key").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// RELATIONS

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({ many }) => ({
	subscriptions: many(subscriptions),
	transactions: many(transactions),
	splitGroups: many(splitGroups),
	goals: many(goals),
	friends_requesterId: many(friends, {
		relationName: "friends_requesterId_users_id"
	}),
	friends_recipientId: many(friends, {
		relationName: "friends_recipientId_users_id"
	}),
	splitGroupMembers: many(splitGroupMembers),
	splitExpenses_payerId: many(splitExpenses, {
		relationName: "splitExpenses_payerId_users_id"
	}),
	splitExpenses_owerId: many(splitExpenses, {
		relationName: "splitExpenses_owerId_users_id"
	}),
	userBadges: many(userBadges),
	questAssignments: many(questAssignments),
	conversationMemories: many(conversationMemory),
	wallets: many(wallets),
	bossBattleLeaderboards: many(bossBattleLeaderboard),
	notifications: many(notifications),
	duels_challengerId: many(duels, {
		relationName: "duels_challengerId_users_id"
	}),
	duels_challengedId: many(duels, {
		relationName: "duels_challengedId_users_id"
	}),
	userPurchases: many(userPurchases),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
	user: one(users, {
		fields: [transactions.userId],
		references: [users.id]
	}),
	wallet: one(wallets, {
		fields: [transactions.walletId],
		references: [wallets.id]
	}),
	category: one(categories, {
		fields: [transactions.categoryId],
		references: [categories.id]
	}),
	splitGroup: one(splitGroups, {
		fields: [transactions.groupId],
		references: [splitGroups.id]
	}),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
	transactions: many(transactions),
	user: one(users, {
		fields: [wallets.userId],
		references: [users.id]
	}),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
	transactions: many(transactions),
}));

export const splitGroupsRelations = relations(splitGroups, ({ one, many }) => ({
	transactions: many(transactions),
	creator: one(users, {
		fields: [splitGroups.creatorId],
		references: [users.id]
	}),
	splitGroupMembers: many(splitGroupMembers),
	splitExpenses: many(splitExpenses),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
	user: one(users, {
		fields: [goals.userId],
		references: [users.id]
	}),
}));

export const friendsRelations = relations(friends, ({ one }) => ({
	user_requesterId: one(users, {
		fields: [friends.requesterId],
		references: [users.id],
		relationName: "friends_requesterId_users_id"
	}),
	user_recipientId: one(users, {
		fields: [friends.recipientId],
		references: [users.id],
		relationName: "friends_recipientId_users_id"
	}),
}));

export const splitGroupMembersRelations = relations(splitGroupMembers, ({ one }) => ({
	splitGroup: one(splitGroups, {
		fields: [splitGroupMembers.groupId],
		references: [splitGroups.id]
	}),
	user: one(users, {
		fields: [splitGroupMembers.userId],
		references: [users.id]
	}),
}));

export const splitExpensesRelations = relations(splitExpenses, ({ one }) => ({
	splitGroup: one(splitGroups, {
		fields: [splitExpenses.groupId],
		references: [splitGroups.id]
	}),
	payer: one(users, {
		fields: [splitExpenses.payerId],
		references: [users.id],
		relationName: "splitExpenses_payerId_users_id"
	}),
	ower: one(users, {
		fields: [splitExpenses.owerId],
		references: [users.id],
		relationName: "splitExpenses_owerId_users_id"
	}),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
	user: one(users, {
		fields: [userBadges.userId],
		references: [users.id]
	}),
}));

export const questAssignmentsRelations = relations(questAssignments, ({ one }) => ({
	quest: one(quests, {
		fields: [questAssignments.questId],
		references: [quests.id]
	}),
	user: one(users, {
		fields: [questAssignments.userId],
		references: [users.id]
	}),
}));

export const questsRelations = relations(quests, ({ many }) => ({
	questAssignments: many(questAssignments),
}));

export const conversationMemoryRelations = relations(conversationMemory, ({ one }) => ({
	user: one(users, {
		fields: [conversationMemory.userId],
		references: [users.id]
	}),
}));

export const bossBattleLeaderboardRelations = relations(bossBattleLeaderboard, ({ one }) => ({
	bossBattle: one(bossBattles, {
		fields: [bossBattleLeaderboard.battleId],
		references: [bossBattles.id]
	}),
	user: one(users, {
		fields: [bossBattleLeaderboard.userId],
		references: [users.id]
	}),
}));

export const bossBattlesRelations = relations(bossBattles, ({ many }) => ({
	bossBattleLeaderboards: many(bossBattleLeaderboard),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const duelsRelations = relations(duels, ({ one }) => ({
	challenger: one(users, {
		fields: [duels.challengerId],
		references: [users.id],
		relationName: "duels_challengerId_users_id"
	}),
	challenged: one(users, {
		fields: [duels.challengedId],
		references: [users.id],
		relationName: "duels_challengedId_users_id"
	}),
	winner: one(users, {
		fields: [duels.winnerId],
		references: [users.id],
	}),
}));

export const shopItemsRelations = relations(shopItems, ({ many }) => ({
	userPurchases: many(userPurchases),
}));

export const userPurchasesRelations = relations(userPurchases, ({ one }) => ({
	user: one(users, {
		fields: [userPurchases.userId],
		references: [users.id]
	}),
	item: one(shopItems, {
		fields: [userPurchases.itemId],
		references: [shopItems.id]
	}),
}));
