import mongoose from "mongoose";
import SplitGroup from "../models/SplitGroup.js";
import SplitExpense from "../models/SplitExpense.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

// Create a new split group
export const createGroup = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, totalAmount, members } = req.body;
    // members is an array of userIds (excluding creator)

    if (!name || !totalAmount || !members || !Array.isArray(members)) {
      throw new Error("Invalid group data");
    }

    const creatorId = req.user.id;
    const allMembers = [...members, creatorId]; // Include creator in list

    // Create Group
    const group = await SplitGroup.create([{
      name,
      totalAmount,
      creator: creatorId,
      members: allMembers
    }], { session, ordered: true });

    const groupId = group[0]._id;

    // Calculate Split
    const nop = allMembers.length;
    const perPerson = Number((totalAmount / nop).toFixed(2));

    // Create Expenses for everyone EXCEPT creator (since creator paid upfront)
    // Technically creator "owes" themselves but we only track what OTHERS owe creator.
    const expenseDocs = members.map(memberId => ({
      groupId,
      payer: creatorId, // Creator paid the bill
      ower: memberId,   // Friend owes money
      amount: perPerson,
      status: 'pending'
    }));

    if (expenseDocs.length > 0) {
      await SplitExpense.create(expenseDocs, { session, ordered: true });
    }

    await session.commitTransaction();

    res.status(201).json({ 
      message: "Group created successfully", 
      group: group[0],
      perPerson 
    });

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error("createGroup error:", err);
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// Get details for a specific group
export const getGroupDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const group = await SplitGroup.findById(id)
      .populate('members', 'name avatarUrl phone')
      .populate('creator', 'name avatarUrl');

    if (!group) return res.status(404).json({ message: "Group not found" });

    const expenses = await SplitExpense.find({ groupId: id })
      .populate('payer', 'name')
      .populate('ower', 'name');

    res.json({ group, expenses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List user's active groups
export const listUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    // Find groups where user is creator OR member
    const groups = await SplitGroup.find({
      $or: [{ creator: userId }, { members: userId }],
      status: 'active'
    }).sort({ createdAt: -1 }).lean();

    // Attach my expense status
    const groupsWithStatus = await Promise.all(groups.map(async (group) => {
        let myStatus = 'n/a';
        
        // If I am Creator, status is 'collecting'
        if (group.creator.toString() === userId) {
            myStatus = 'collecting';
        } else {
            // I am a member, check my expense
            const expense = await SplitExpense.findOne({ 
                groupId: group._id, 
                ower: userId 
            });
            myStatus = expense ? expense.status : 'unknown';
        }
        
        return { ...group, myStatus };
    }));

    res.json(groupsWithStatus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Settle an expense (Pay back)
export const settleExpense = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params; // Group ID
    const { amount } = req.body;
    const owerId = req.user.id;

    // Find the pending expense for this user in this group
    const expense = await SplitExpense.findOne({
      groupId: id,
      ower: owerId,
      status: 'pending'
    }).session(session);

    if (!expense) {
      throw new Error("No pending expense found for this group");
    }

    // Verify amount (optional loose check or strict)
    if (amount && Math.abs(amount - expense.amount) > 1) {
       // Tolerance of 1 rupee for rounding issues, primarily strict
       // throw new Error(`Amount mismatch. You owe ${expense.amount}`);
    }

    // Perform Wallet Transfer: Ower -> Payer
    const owerWallet = await Wallet.findOne({ userId: owerId, type: 'primary' }).session(session);
    const payerWallet = await Wallet.findOne({ userId: expense.payer, type: 'primary' }).session(session);

    if (!owerWallet || !payerWallet) {
      throw new Error("Wallets not found");
    }

    if (owerWallet.balance < expense.amount) {
      throw new Error("Insufficient wallet balance");
    }

    // Deduct from Ower
    owerWallet.balance -= expense.amount;
    await owerWallet.save({ session });

    // Add to Payer
    payerWallet.balance += expense.amount;
    await payerWallet.save({ session });

    // Update Expense Status
    expense.status = 'paid';
    expense.transactionId = `SETTLE_${Date.now()}`;
    await expense.save({ session });

    // Create Transaction Records
    await Transaction.create([
      {
        userId: owerId,
        walletId: owerWallet._id,
        name: `Paid share for ${id}`, // ideally group title but logic simplified
        emoji: "💸",
        amount: -expense.amount,
        type: "expense",
        groupId: id
      },
      {
        userId: expense.payer,
        walletId: payerWallet._id,
        name: `Received share for ${id}`,
        emoji: "💰",
        amount: expense.amount,
        type: "income",
        groupId: id
      }
    ], { session });

    // Check if group is fully settled
    const pendingCount = await SplitExpense.countDocuments({ groupId: id, status: 'pending' }).session(session);
    if (pendingCount === 0) {
      await SplitGroup.findByIdAndUpdate(id, { status: 'settled' }, { session });
      
      // Emit group:settled event
      const io = req.app.get("io");
      if (io) {
        io.to(id).emit("group:settled", { groupId: id });
      }
    }

    await session.commitTransaction();

    // Emit payment:received event
    const io = req.app.get("io");
    if (io) {
       io.to(id).emit("payment:received", {
          groupId: id,
          expenseId: expense._id,
          payerName: req.user.name, 
          amount: expense.amount
       });
    }
    
    // Simulate payment received event for now to avoid breaking frontend logic expectations?
    // Actually frontend pulls data, so it's fine.
    
    res.json({ message: "Settlement successful", expense });

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error("settleExpense error:", err);
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};
