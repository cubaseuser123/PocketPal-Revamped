// import { prisma } from "../config/prisma.js";
import { db } from "../config/db.js";
import { splitGroups, splitGroupMembers, splitExpenses, wallets, transactions, users } from "../drizzle/schema.js";
import { eq, and, or, sql, inArray, count, desc } from "drizzle-orm";

// Create a new split group
export const createGroup = async (req, res) => {
  try {
    const { name, totalAmount, members } = req.body;
    // members is an array of userIds (excluding creator)

    if (!name || !totalAmount || !members || !Array.isArray(members)) {
      return res.status(400).json({ message: "Invalid group data" });
    }

    const creatorId = req.user.id;
    const allMembers = [...members, creatorId]; // Include creator in list

    const result = await db.transaction(async (tx) => {
      // Create Group
      const [group] = await tx.insert(splitGroups).values({
        name,
        totalAmount,
        creatorId,
        status: "active",
      }).returning();

      // Add members including creator
      if (allMembers.length > 0) {
        await tx.insert(splitGroupMembers).values(
            allMembers.map(userId => ({
                groupId: group.id,
                userId,
                joinedAt: new Date(),
            }))
        );
      }

      // Calculate Split
      const nop = allMembers.length;
      const perPerson = Number((totalAmount / nop).toFixed(2));

      // Create Expenses for everyone EXCEPT creator
      // Creator paid, others owe creator?
      // "payerId: creatorId, owerId: memberId"
      
      const expenseData = members.map(memberId => ({
        groupId: group.id,
        payerId: creatorId,
        owerId: memberId,
        amount: perPerson,
        status: "pending",
        description: "Group share",
      }));

      if (expenseData.length > 0) {
        await tx.insert(splitExpenses).values(expenseData);
      }

      return { group, perPerson };
    });

    res.status(201).json({ 
      message: "Group created successfully", 
      group: { ...result.group, totalAmount: Number(result.group.totalAmount) },
      perPerson: result.perPerson,
    });

  } catch (err) {
    console.error("createGroup error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get details for a specific group
export const getGroupDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch group with members and creator
    const group = await db.query.splitGroups.findFirst({
      where: eq(splitGroups.id, id),
      with: {
        creator: true,
        splitGroupMembers: {
            with: {
                user: true
            }
        }
      },
    });

    if (!group) return res.status(404).json({ message: "Group not found" });

    const expenses = await db.query.splitExpenses.findMany({
      where: eq(splitExpenses.groupId, id),
      with: {
        payer: true, // simplified relation name
        ower: true,
      },
    });

    const transactionsList = await db.query.transactions.findMany({
      where: eq(transactions.groupId, id),
      orderBy: [desc(transactions.createdAt)],
      with: {
        user: true, // Fetch who made the transaction
      } 
    });

    // Transform to match expected format
    const transformedGroup = {
      ...group,
      totalAmount: Number(group.totalAmount),
      members: group.splitGroupMembers.map(m => ({
          id: m.user.id,
          name: m.user.name,
          avatarUrl: m.user.avatarUrl,
          phone: m.user.phone
      })),
    };

    const transformedExpenses = expenses.map(e => ({
      ...e,
      amount: Number(e.amount),
      payer: { id: e.payer.id, name: e.payer.name },
      ower: { id: e.ower.id, name: e.ower.name },
    }));

    res.json({ 
        group: transformedGroup, 
        expenses: transformedExpenses,
        transactions: transactionsList 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List user's active groups
export const listUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find groups where user is creator OR member
    // Check membership first
    const memberGroups = await db.query.splitGroupMembers.findMany({
      where: eq(splitGroupMembers.userId, userId),
    });
    const memberGroupIds = memberGroups.map(m => m.groupId);

    // Fetch groups
    const groups = await db.query.splitGroups.findMany({
      where: and(
          eq(splitGroups.status, "active"),
          or(
              eq(splitGroups.creatorId, userId),
              inArray(splitGroups.id, memberGroupIds.length ? memberGroupIds : ['dummy']) // handle empty array
          )
      ),
      orderBy: [desc(splitGroups.createdAt)],
    });

    // Attach my expense status
    const groupsWithStatus = await Promise.all(groups.map(async (group) => {
      let myStatus = 'n/a';
      
      if (group.creatorId === userId) {
        myStatus = 'collecting';
      } else {
        const expense = await db.query.splitExpenses.findFirst({ 
          where: and(
              eq(splitExpenses.groupId, group.id),
              eq(splitExpenses.owerId, userId)
          )
        });
        myStatus = expense ? expense.status : 'unknown';
      }
      
      return { 
        ...group, 
        totalAmount: Number(group.totalAmount),
        myStatus,
      };
    }));

    res.json(groupsWithStatus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Settle an expense (Pay back)
export const settleExpense = async (req, res) => {
  try {
    const { id } = req.params; // Group ID
    const { amount } = req.body;
    const owerId = req.user.id;

    const result = await db.transaction(async (tx) => {
      // Find the pending expense for this user in this group
      const expense = await tx.query.splitExpenses.findFirst({
        where: and(
          eq(splitExpenses.groupId, id),
          eq(splitExpenses.owerId, owerId),
          eq(splitExpenses.status, "pending")
        ),
      });

      if (!expense) {
        throw new Error("No pending expense found for this group");
      }

      // Perform Wallet Transfer: Ower -> Payer
      const owerWallet = await tx.query.wallets.findFirst({ 
        where: and(eq(wallets.userId, owerId), eq(wallets.type, "primary")) 
      });
      const payerWallet = await tx.query.wallets.findFirst({ 
        where: and(eq(wallets.userId, expense.payerId), eq(wallets.type, "primary")) 
      });

      if (!owerWallet || !payerWallet) {
        throw new Error("Wallets not found");
      }

      if (Number(owerWallet.balance) < Number(expense.amount)) {
        throw new Error("Insufficient wallet balance");
      }

      // Deduct from Ower
      await tx.update(wallets)
        .set({ balance: sql`${wallets.balance} - ${Number(expense.amount)}` })
        .where(eq(wallets.id, owerWallet.id));

      // Add to Payer
      await tx.update(wallets)
        .set({ balance: sql`${wallets.balance} + ${Number(expense.amount)}` })
        .where(eq(wallets.id, payerWallet.id));

      // Update Expense Status
      const [updatedExpense] = await tx.update(splitExpenses)
        .set({ 
          status: "paid",
          transactionId: `SETTLE_${Date.now()}`,
          // paidAt: new Date(), / Field does not exist in schema.js splitExpenses!
          // It was 'updatedAt' which updates automatically. 
          // Previous code had `paidAt` but schema inspection didn't show it?
          // Schema says `updatedAt` is updated by default? No, Drizzle doesn't auto-update `updatedAt` unless using `onUpdateNow()` or simplified.
          // Wait, Drizzle keys: `createdAt`, `updatedAt` are present.
          // I didn't see `paidAt` in schema.js lines 245-255.
          // So I removed `paidAt: new Date()`.
        })
        .where(eq(splitExpenses.id, expense.id))
        .returning();

      // Create Transaction Records
      await tx.insert(transactions).values([
          {
            userId: owerId,
            walletId: owerWallet.id,
            name: `Paid share for group`,
            emoji: "💸",
            amount: -Number(expense.amount),
            type: "expense",
            groupId: id, // confirmed in schema.js line 142
          },
          {
            userId: expense.payerId,
            walletId: payerWallet.id,
            name: `Received share for group`,
            emoji: "💰",
            amount: Number(expense.amount),
            type: "income",
            groupId: id,
          }
      ]);

      // Check if group is fully settled
      const [pendingCountResult] = await tx.select({ count: count() }).from(splitExpenses).where(
          and(eq(splitExpenses.groupId, id), eq(splitExpenses.status, "pending"))
      );
      const pendingCount = pendingCountResult?.count || 0;
      
      let groupSettled = false;
      if (pendingCount === 0) {
        await tx.update(splitGroups)
            .set({ status: "settled" })
            .where(eq(splitGroups.id, id));
        groupSettled = true;
      }

      return { expense: updatedExpense, groupSettled };
    });

    // Emit WebSocket events
    const io = req.app.get("io");
    if (io) {
      io.to(id).emit("payment:received", {
        groupId: id,
        expenseId: result.expense.id,
        payerName: req.user.name, 
        amount: Number(result.expense.amount),
      });

      if (result.groupSettled) {
        io.to(id).emit("group:settled", { groupId: id });
      }
    }

    res.json({ 
      message: "Settlement successful", 
      expense: { ...result.expense, amount: Number(result.expense.amount) },
    });

  } catch (err) {
    console.error("settleExpense error:", err);
    res.status(500).json({ message: err.message });
  }
};
