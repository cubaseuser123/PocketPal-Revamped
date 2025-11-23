import { IonIcon } from "@ionic/react";
import { flame } from "ionicons/icons";

interface WelcomeProps {
  greeting: string;
}

const Welcome: React.FC<WelcomeProps> = ({ greeting }) => {
  return (
    <div className="flex flex-row items-center justify-between px-6 pt-20">
      <div>
        <div className="text-xl text-gray-400">{greeting},</div>
        <div className="text-2xl text-white">Harsh 👋</div>
      </div>
      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "var(--ion-color-warning)" }}
      >
        <IonIcon
          icon={flame}
          className="animate-pulse text-4xl"
          style={{ color: "var(--ion-color-light)" }}
        />
        <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center justify-center gap-1 rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          <span style={{ color: "var(--ion-color-warning-tint)" }}>12</span>
          <span className="text-gray-400">days</span>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
