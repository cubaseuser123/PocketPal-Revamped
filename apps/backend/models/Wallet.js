import mongoose from "mongoose";

/**
 * PPI (Prepaid Payment Instrument) Wallet based on Cashfree/RBI guidelines
 * 
 * PPI Types:
 * - small_ppi: Min KYC, ₹10,000 monthly limit, no cash withdrawal
 * - full_kyc_ppi: Full KYC, ₹1,00,000 balance limit, cash withdrawal allowed
 * 
 * Wallet Types:
 * - primary: Main spending wallet (PPI)
 * - savings: Savings/Goals wallet
 */

// PPI limits based on RBI guidelines
export const PPI_LIMITS = {
  small_ppi: {
    maxBalance: 10000,       // ₹10,000 max balance
    monthlyLoadLimit: 10000, // ₹10,000 per month
    perTxnLimit: 2000,       // ₹2,000 per transaction
    cashWithdrawal: false,
    fundsTransfer: false,
    upiEnabled: false,       // No UPI for Small PPI
  },
  full_kyc_ppi: {
    maxBalance: 200000,      // ₹2,00,000 max balance
    monthlyLoadLimit: 200000,
    perTxnLimit: 100000,     // ₹1,00,000 per transaction
    cashWithdrawal: true,
    fundsTransfer: true,
    upiEnabled: true,        // UPI enabled for Full KYC
  },
};

const walletSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    type: { 
      type: String, 
      enum: ["primary", "savings"], 
      required: true 
    },
    balance: { type: Number, default: 0 },
    
    // PPI fields (for primary wallet)
    ppiType: {
      type: String,
      enum: ["small_ppi", "full_kyc_ppi"],
      default: "small_ppi",
    },
    ppiId: { type: String }, // Mock PPI ID (would be from Cashfree in prod)
    monthlyLoaded: { type: Number, default: 0 }, // Track monthly load for limits
    lastLoadReset: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index to ensure one wallet per type per user
walletSchema.index({ userId: 1, type: 1 }, { unique: true });

// Method to check if wallet can accept a load
walletSchema.methods.canLoad = function(amount) {
  if (this.type !== "primary") return { allowed: true };
  
  const limits = PPI_LIMITS[this.ppiType];
  
  // Check max balance
  if (this.balance + amount > limits.maxBalance) {
    return { 
      allowed: false, 
      reason: `Max balance limit ₹${limits.maxBalance} exceeded`,
      maxAllowed: limits.maxBalance - this.balance,
    };
  }
  
  // Check monthly limit (reset if new month)
  const now = new Date();
  const lastReset = new Date(this.lastLoadReset);
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.monthlyLoaded = 0;
    this.lastLoadReset = now;
  }
  
  if (this.monthlyLoaded + amount > limits.monthlyLoadLimit) {
    return { 
      allowed: false, 
      reason: `Monthly load limit ₹${limits.monthlyLoadLimit} exceeded`,
      maxAllowed: limits.monthlyLoadLimit - this.monthlyLoaded,
    };
  }
  
  return { allowed: true };
};

// Method to get PPI limits
walletSchema.methods.getLimits = function() {
  if (this.type !== "primary") return null;
  return PPI_LIMITS[this.ppiType];
};

// Virtual for remaining monthly load
walletSchema.virtual("remainingMonthlyLoad").get(function() {
  if (this.type !== "primary") return null;
  const limits = PPI_LIMITS[this.ppiType];
  return limits.monthlyLoadLimit - this.monthlyLoaded;
});

walletSchema.set("toJSON", { virtuals: true });
walletSchema.set("toObject", { virtuals: true });

export default mongoose.model("Wallet", walletSchema);
