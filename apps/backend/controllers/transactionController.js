// import { prisma } from "../config/prisma.js";
import { db } from "../config/db.js";
import { transactions, wallets } from "../drizzle/schema.js";
import { eq, and, desc, count, sql, gte } from "drizzle-orm";

// Get user's transactions
export const getTransactions = async (req, res) => {
  try {
    const { limit = 20, offset = 0, walletType } = req.query;

    let walletId = undefined;
    
    // Filter by wallet type if specified
    if (walletType) {
      // const wallet = await prisma.wallet.findFirst({ where: { userId: req.user.id, type: walletType } });
      const wallet = await db.query.wallets.findFirst({
        where: and(eq(wallets.userId, req.user.id), eq(wallets.type, walletType))
      });
      if (wallet) {
        walletId = wallet.id;
      }
    }

    const whereConditions = [eq(transactions.userId, req.user.id)];
    if (walletId) {
      whereConditions.push(eq(transactions.walletId, walletId));
    }
    
    const whereAnd = and(...whereConditions);

    const [txList, countResult] = await Promise.all([
      db.query.transactions.findMany({
        where: whereAnd,
        orderBy: [desc(transactions.createdAt)],
        offset: Number(offset),
        limit: Number(limit),
        with: {
            category: true // Select all cols from category
        }
      }),
      db.select({ count: count() }).from(transactions).where(whereAnd)
    ]);
    
    const total = countResult[0]?.count || 0;

    return res.json({
      transactions: txList.map(t => ({
        ...t,
        amount: Number(t.amount),
        categoryId: t.category, // Map category object to categoryId prop to match previous API response structure? 
                                // Previous code: `categoryId: t.category` where `t.category` was object.
                                // Prisma `include` puts the relation in property named after relation. 
                                // Drizzle does same.
                                // However, `t.categoryId` (foreign key) is also present in Drizzle result?
                                // Prisma: `categoryId` is the ID (string), `category` is the object.
                                // Previous code: `categoryId: t.category`. This replaced the ID with the object!
                                // So I should do the same.
      })),
      total,
      hasMore: Number(offset) + txList.length < total,
    });
  } catch (err) {
    console.error("getTransactions error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Create a transaction (expense/income)
export const createTransaction = async (req, res) => {
  try {
    const { name, emoji, amount, categoryId, note, walletType = "primary" } = req.body;

    if (!name || !amount) {
      return res.status(400).json({ message: "Name and amount required" });
    }

    const absAmount = Math.abs(amount);
    const isExpense = amount < 0;

    // Find the wallet
    const wallet = await db.query.wallets.findFirst({ 
      where: and(eq(wallets.userId, req.user.id), eq(wallets.type, walletType)) 
    });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Check balance for expense
    if (isExpense && Number(wallet.balance) < absAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Use transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // Update wallet balance
      // amount is negative for expense? No, `absAmount` used in logic.
      // Drizzle SQL: balance = balance + amount (if amount is signed in DB) OR logic.
      // previous code: `decrement: absAmount` if expense.
      
      const balanceChange = isExpense ? -absAmount : absAmount;

      const [updatedWallet] = await tx.update(wallets)
        .set({ 
            balance: sql`${wallets.balance} + ${balanceChange}`
        })
        .where(eq(wallets.id, wallet.id))
        .returning();

      // Create transaction record
      const [transaction] = await tx.insert(transactions).values({
          userId: req.user.id,
          walletId: wallet.id,
          name,
          emoji: emoji || "💰",
          amount: amount, // Signed amount
          categoryId: categoryId || null,
          note,
          type: isExpense ? "expense" : "income",
      }).returning();

      return { transaction, newBalance: Number(updatedWallet.balance) };
    });

    return res.status(201).json({
      message: "Transaction created",
      transaction: { ...result.transaction, amount: Number(result.transaction.amount) },
      newBalance: result.newBalance,
    });
  } catch (err) {
    console.error("createTransaction error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get spending summary
export const getSpendingSummary = async (req, res) => {
  try {
    const { period = "week" } = req.query;
    
    let startDate = new Date(); // Current date object
    if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "3m") {
      startDate.setMonth(startDate.getMonth() - 3);
    }

    // Since we updated schema to mode: 'date', Drizzle handles Dates correctly.
    const txList = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, req.user.id),
        eq(transactions.type, "expense"),
        gte(transactions.createdAt, startDate)
      ),
    });

    const totalSpent = txList.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    const days = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
    const avgPerDay = days > 0 ? Math.round(totalSpent / days) : 0;

    return res.json({
      period,
      totalSpent,
      avgPerDay,
      transactionCount: txList.length,
    });
  } catch (err) {
    console.error("getSpendingSummary error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
