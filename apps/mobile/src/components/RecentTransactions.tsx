import React from "react";

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  date: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
}) => {
  return (
    <div className="mx-6 mt-4 mb-6 text-white">
      <h3 className="mb-3 text-lg font-semibold">Recent Transactions</h3>

      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="glass-card flex items-center justify-between rounded-xl p-4"
          >
            <div>
              <p className="font-medium">{transaction.title}</p>
              <p className="text-xs text-gray-400">{transaction.date}</p>
            </div>
            <p
              className={`font-semibold ${
                transaction.type === "income"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {transaction.type === "income" ? "+" : "-"}₹{transaction.amount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;
