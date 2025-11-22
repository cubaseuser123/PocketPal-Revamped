import { IonContent, IonPage, IonHeader } from "@ionic/react";
import React, { useState } from "react";
import Welcome from "../components/Welcome";
import PrimaryWallet from "../components/PrimaryWallet";
import SavingsWallet from "../components/SavingsWallet";

const Home: React.FC = () => {
  const [activeWallet, setActiveWallet] = useState<"Primary" | "Savings">(
    "Primary",
  );
  const [showWelcome, setShowWelcome] = useState(true);

  const handleScroll = (event: CustomEvent) => {
    const scrollTop = event.detail.scrollTop;
    if (scrollTop > 50 && showWelcome) {
      setShowWelcome(false);
    } else if (scrollTop <= 50 && !showWelcome) {
      setShowWelcome(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <div
          className={`relative z-10 overflow-hidden transition-all duration-300`}
          style={{ height: showWelcome ? "160px" : "0px" }}
        >
          <Welcome />
        </div>

        <div
          className={
            "ion-margin relative z-10 flex flex-row rounded-4xl bg-gray-800 px-2 py-2 text-center text-white transition-all duration-300"
          }
          style={{ marginTop: showWelcome ? "16px" : "70px" }}
        >
          <div
            className={`absolute top-2 bottom-2 w-[calc(50%-10px)] rounded-4xl bg-(--ion-color-primary) transition-all duration-300 ${
              activeWallet === "Primary" ? "left-2" : "left-[calc(50%+2px)]"
            }`}
          />
          <div
            onClick={() => setActiveWallet("Primary")}
            className="z-10 flex-1 px-6 py-2"
          >
            Primary
          </div>
          <div
            onClick={() => setActiveWallet("Savings")}
            className="z-10 flex-1 px-6 py-2"
          >
            Savings
          </div>
        </div>
      </IonHeader>

      <IonContent scrollEvents={true} onIonScroll={handleScroll} className="">
        {activeWallet === "Primary" && <PrimaryWallet />}
        {activeWallet === "Savings" && <SavingsWallet />}
      </IonContent>
    </IonPage>
  );
};

export default Home;
