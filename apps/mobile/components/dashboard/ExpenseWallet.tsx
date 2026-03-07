import { WalletCard, Category } from "../ui/WalletCard";

interface ExpenseWalletProps {
  balance: number;
  categories: Category[];
  onGoTo: () => void;
}

export function ExpenseWallet({ balance, categories, onGoTo }: ExpenseWalletProps) {
  return (
    <WalletCard
      type="expense"
      variant="compact"
      balance={balance}
      categories={categories}
      onGoTo={onGoTo}
    />
  );
}
