import { IonContent, IonPage, IonHeader } from "@ionic/react";
import React, { useState } from "react";
import Welcome from "../components/Welcome";

const Home: React.FC = () => {
  const [activeWallet, setActiveWallet] = useState<"Primary" | "Savings">(
    "Primary",
  );

  return (
    <IonPage>
      <IonHeader>
        <Welcome />
        <div className="ion-margin relative flex flex-row rounded-4xl bg-gray-800 px-2 py-2 text-center text-white">
          <div
            className={`absolute top-2 bottom-2 w-[calc(50%-4px)] rounded-4xl bg-(--ion-color-primary) transition-all duration-300 ${
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

      <IonContent className="">
        <h1 className="text-white">Content goes here</h1>
      </IonContent>
    </IonPage>
  );
};

export default Home;
