export enum Screen {
  ONBOARDING = "ONBOARDING",
  LOGIN = "LOGIN",
  HOME = "HOME",
  ANALYTICS = "ANALYTICS",
  UPI_PAYMENT = "UPI_PAYMENT",
  TRANSFER = "TRANSFER",
  GOALS = "GOALS",
  REWARDS = "REWARDS",
  PROFILE = "PROFILE",
  TRANSACTION_DETAIL = "TRANSACTION_DETAIL",
}

export enum WalletType {
  PRIMARY = "PRIMARY",
  SAVINGS = "SAVINGS",
}

export enum TransactionType {
  EXPENSE = "EXPENSE",
  INCOME = "INCOME",
  TRANSFER = "TRANSFER",
}

export enum Category {
  FOOD = "Food",
  TRAVEL = "Travel",
  SHOPPING = "Shopping",
  BILLS = "Bills",
  ENTERTAINMENT = "Fun",
  EDUCATION = "Education",
  SAVINGS = "Savings",
  TRANSFER = "Transfer",
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  wallet: WalletType; // Which wallet does this affect?
  date: string; // ISO string
  merchant?: string; // Name of store/receiver for UPI
  note?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  deadline: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface User {
  name: string;
  avatar: string;
  streak: number;
  primaryBalance: number;
  savingsBalance: number;
  monthlyBudget: number;
}
