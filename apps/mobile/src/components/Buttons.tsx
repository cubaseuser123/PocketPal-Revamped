import { ScanLine, Repeat, Target } from "lucide-react";
import { useHistory } from "react-router";

const Buttons = () => {
  const history = useHistory();

  const handleScanUPI = () => {
    history.replace("/app/scan-upi");
  };

  return (
    <div className="mx-6 flex gap-2 text-white">
      <div
        onClick={handleScanUPI}
        role="button"
        tabIndex={0}
        className="glass-card flex flex-1 cursor-pointer flex-col items-center p-4 transition active:scale-95"
      >
        <ScanLine />
        <span className="mt-2 block text-sm">Scan UPI</span>
      </div>
      <div
        onClick={() => console.log("Transfer clicked")}
        role="button"
        tabIndex={0}
        className="glass-card flex flex-1 cursor-pointer flex-col items-center p-4 transition active:scale-95"
      >
        <Repeat />
        <span className="mt-2 block text-sm">Transfer</span>
      </div>
      <div
        onClick={() => console.log("Goals clicked")}
        role="button"
        tabIndex={0}
        className="glass-card flex flex-1 cursor-pointer flex-col items-center p-4 transition active:scale-95"
      >
        <Target />
        <span className="mt-2 block text-sm">Goals</span>
      </div>
    </div>
  );
};

export default Buttons;
