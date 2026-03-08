import { WalletCard } from "../ui/WalletCard";

interface SavingsWalletCardProps {
  balance: number;
  goalName: string;
  goalEmoji: string;
  targetAmount: number;
  onAddToSavings: () => void;
}

export function SavingsWalletCard({
  balance,
  goalName,
  goalEmoji,
  targetAmount,
  onAddToSavings,
}: SavingsWalletCardProps) {
  return (
    <WalletCard
      type="savings"
      variant="full"
      balance={balance}
      goalName={goalName}
      goalEmoji={goalEmoji}
      targetAmount={targetAmount}
      onAddToSavings={onAddToSavings}
    />
  );
}
