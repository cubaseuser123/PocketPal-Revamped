import { WalletCard, Category } from "../ui/WalletCard";

interface ExpenseWalletCardProps {
  balance: number;
  categories: Category[];
  onScan: () => void;
  onLoadMoney: () => void;
  onMore: () => void;
}

export function ExpenseWalletCard({
  balance,
  categories,
  onScan,
  onLoadMoney,
  onMore,
}: ExpenseWalletCardProps) {
  return (
    <WalletCard
      type="expense"
      variant="full"
      balance={balance}
      categories={categories}
      onScan={onScan}
      onLoadMoney={onLoadMoney}
      onMore={onMore}
    />
  );
}
