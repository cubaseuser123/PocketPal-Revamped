import { WalletCard } from "../ui/WalletCard";

interface SavingsWalletProps {
  balance: number;
  goalName: string;
  goalEmoji: string;
  targetAmount: number;
  onGoTo: () => void;
  hasGoal?: boolean;
}

export function SavingsWallet({
  balance,
  goalName,
  goalEmoji,
  targetAmount,
  onGoTo,
  hasGoal = true,
}: SavingsWalletProps) {
  return (
    <WalletCard
      type="savings"
      variant="compact"
      balance={balance}
      goalName={goalName}
      goalEmoji={goalEmoji}
      targetAmount={targetAmount}
      hasGoal={hasGoal}
      onGoTo={onGoTo}
    />
  );
}
