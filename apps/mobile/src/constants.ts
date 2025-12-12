import {
  Badge,
  Category,
  Goal,
  Transaction,
  TransactionType,
  User,
  WalletType,
} from "./types";

export const MOCK_USER: User = {
  name: "Harsh",
  avatar: "https://picsum.photos/200/200",
  streak: 12,
  primaryBalance: 4250,
  savingsBalance: 65000,
  monthlyBudget: 20000,
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    amount: 180,
    type: TransactionType.EXPENSE,
    category: Category.FOOD,
    wallet: WalletType.PRIMARY,
    date: new Date().toISOString(),
    merchant: "McDonalds",
    note: "Lunch combo",
  },
  {
    id: "2",
    amount: 55,
    type: TransactionType.EXPENSE,
    category: Category.TRAVEL,
    wallet: WalletType.PRIMARY,
    date: new Date(Date.now() - 3600000).toISOString(),
    merchant: "Uber",
    note: "Ride to campus",
  },
  {
    id: "3",
    amount: 450,
    type: TransactionType.EXPENSE,
    category: Category.BILLS,
    wallet: WalletType.PRIMARY,
    date: new Date(Date.now() - 86400000).toISOString(),
    merchant: "Jio Prepaid",
    note: "Recharge",
  },
  {
    id: "4",
    amount: 2000,
    type: TransactionType.INCOME,
    category: Category.EDUCATION,
    wallet: WalletType.PRIMARY,
    date: new Date(Date.now() - 172800000).toISOString(),
    merchant: "Freelance Client",
    note: "Project payment",
  },
  {
    id: "5",
    amount: 1200,
    type: TransactionType.EXPENSE,
    category: Category.SHOPPING,
    wallet: WalletType.PRIMARY,
    date: new Date(Date.now() - 259200000).toISOString(),
    merchant: "Amazon India",
    note: "New headphones",
  },
];

export const INITIAL_GOALS: Goal[] = [
  {
    id: "1",
    title: "New Laptop",
    targetAmount: 80000,
    currentAmount: 49600,
    icon: "💻",
    deadline: "2024-12-31",
  },
  {
    id: "2",
    title: "Summer Trip",
    targetAmount: 20000,
    currentAmount: 5000,
    icon: "✈️",
    deadline: "2024-06-15",
  },
  {
    id: "3",
    title: "Emergency Fund",
    targetAmount: 10000,
    currentAmount: 8500,
    icon: "🛡️",
    deadline: "2024-10-01",
  },
];

export const BADGES: Badge[] = [
  {
    id: "1",
    title: "Digital Pay",
    description: "First UPI Payment",
    icon: "📲",
    unlocked: true,
  },
  {
    id: "2",
    title: "Streak Master",
    description: "Daily streak 30 days",
    icon: "🔥",
    unlocked: false,
  },
  {
    id: "3",
    title: "Vault Keeper",
    description: "Saved ₹500 in Savings Wallet",
    icon: "🔐",
    unlocked: true,
  },
  {
    id: "4",
    title: "Smart Spender",
    description: "Spent less than last month",
    icon: "🧠",
    unlocked: true,
  },
  {
    id: "5",
    title: "Goal Getter",
    description: "Completed 1 goal",
    icon: "🏆",
    unlocked: false,
  },
];

export const CATEGORY_ICONS: Record<Category, string> = {
  [Category.FOOD]: "🍔",
  [Category.TRAVEL]: "🚕",
  [Category.SHOPPING]: "🛍️",
  [Category.BILLS]: "🧾",
  [Category.ENTERTAINMENT]: "🎬",
  [Category.EDUCATION]: "📚",
  [Category.SAVINGS]: "🐷",
  [Category.TRANSFER]: "💸",
};
