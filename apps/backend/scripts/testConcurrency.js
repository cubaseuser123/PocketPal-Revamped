
import mongoose from "mongoose";
import dotenv from "dotenv";
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";
import { transfer } from "../controllers/walletController.js";

dotenv.config();

// Mock Express Request/Response
const mockReq = (body, user) => ({
  body,
  user: { id: user._id }
});

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

async function testConcurrency() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  try {
    // Setup test user and wallets
    const user = await User.create({ name: "Tester", phone: "+919999999999" });
    const wallet1 = await Wallet.create({ userId: user._id, type: "primary", balance: 1000 });
    const wallet2 = await Wallet.create({ userId: user._id, type: "savings", balance: 0 });

    console.log("Initial State:", { w1: wallet1.balance, w2: wallet2.balance });

    // Simulate 5 concurrent transfers of 100 each
    const performTransfer = async (i) => {
      let retries = 5;
      while (retries > 0) {
        try {
          await transfer(
            mockReq({ from: "primary", to: "savings", amount: 100 }, user),
            mockRes()
          );
          return; // Success
        } catch (err) {
          if (err.errorLabels && err.errorLabels.includes('TransientTransactionError')) {
             console.log(`Tx ${i} conflict, retrying... (${retries})`);
             retries--;
             await new Promise(r => setTimeout(r, Math.random() * 200)); // Jitter
          } else {
            console.error(`Tx ${i} failed hard:`, err);
            throw err;
          }
        }
      }
      console.error(`Tx ${i} failed after retries`);
    };

    const promises = [];
    for (let i = 0; i < 5; i++) {
        promises.push(performTransfer(i));
    }

    await Promise.all(promises);

    // Verify final state
    const w1Final = await Wallet.findById(wallet1._id);
    const w2Final = await Wallet.findById(wallet2._id);

    console.log("Final State:", { w1: w1Final.balance, w2: w2Final.balance });

    // We expect balance to be 500/500 if all succeeded, OR at least consistent (sum = 1000)
    // Ideally with retries, they should all succeed.
    if (w1Final.balance === 500 && w2Final.balance === 500) {
      console.log("✅ Concurrency Test Passed! Balances are correct.");
    } else if ((w1Final.balance + w2Final.balance) === 1000) {
       console.log("⚠️  Partial Success: Some txs failed after retries, BUT financial integrity maintained (Sum is 1000).");
    } else {
      console.error("❌ Concurrency Test Failed! Balances mismatch (Money lost/gained).");
    }

    // Cleanup
    await User.deleteOne({ _id: user._id });
    await Wallet.deleteMany({ userId: user._id });

  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

testConcurrency();
