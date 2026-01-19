import { View, Text, TouchableOpacity } from "react-native";

interface Transaction {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  date: string;
  categoryColor: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionPress?: (id: string) => void;
}

export function TransactionList({
  transactions,
  onTransactionPress,
  onViewAll,
  title = "Recent Transactions"
}: TransactionListProps & { onViewAll?: () => void; title?: string }) {
  return (
    <View className="gap-3">
      {/* Section header */}
      <View className="flex-row items-center justify-between ml-1 pr-1">
        <Text className="text-text-secondary text-xs font-bold uppercase tracking-wider">
          {title}
        </Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text className="text-primary-default text-xs font-bold">View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Transaction items */}
      <View className="gap-2">
        {transactions.map((transaction) => (
          <TouchableOpacity
            key={transaction.id}
            onPress={() => onTransactionPress?.(transaction.id)}
            className="bg-card-dark p-3.5 rounded-2xl border border-white/5 flex-row items-center justify-between active:bg-white/[0.02]"
          >
            <View className="flex-row items-center gap-3">
              {/* Icon */}
              <View
                className="h-10 w-10 rounded-full items-center justify-center border"
                style={{
                  backgroundColor: `${transaction.categoryColor}20`,
                  borderColor: `${transaction.categoryColor}10`,
                }}
              >
                <Text className="text-xl">{transaction.emoji}</Text>
              </View>

              {/* Details */}
              <View>
                <Text className="text-white text-sm font-semibold">
                  {transaction.name}
                </Text>
                <Text className="text-text-secondary text-[10px]">
                  {transaction.date}
                </Text>
              </View>
            </View>

            {/* Amount */}
            <Text className="text-white font-bold text-sm">
              -₹{Math.abs(transaction.amount).toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
