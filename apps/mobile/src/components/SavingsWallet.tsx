import { IonCard, IonCardContent, IonIcon, isPlatform } from "@ionic/react";
import { shieldCheckmarkOutline, lockClosedOutline } from "ionicons/icons";

const SavingsWallet = () => {
  const isAndroid = isPlatform("android");
  const isIOS = isPlatform("ios");

  return (
    <div className="space-y-6 px-6 py-4 text-white">
      <IonCard className="savings-card">
        <IonCardContent>
          <div
            style={{
              padding: isAndroid ? "12px" : "0px",
              marginBottom: isIOS ? "0" : "12px",
            }}
            className="mt-2 flex flex-col gap-6"
          >
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="flex items-center rounded-xl border border-white/20 bg-white/15 p-3 text-2xl text-white backdrop-blur-xl">
                <IonIcon icon={lockClosedOutline} />
              </div>

              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-gray-200">
                  SAVINGS WALLET
                </span>
                <span className="text-xs font-bold text-gray-200">
                  ****8821
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 text-white">
              <span className="text-4xl font-bold">₹65,000</span>

              <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-2 py-1 text-xs backdrop-blur-xl">
                <IonIcon icon={shieldCheckmarkOutline} />
                <span>UPI Linked</span>
              </div>
            </div>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default SavingsWallet;
