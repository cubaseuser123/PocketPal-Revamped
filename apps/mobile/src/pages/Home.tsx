import { IonContent, IonPage } from "@ionic/react";
import React from "react";
import { IonIcon } from "@ionic/react";
import { flame } from "ionicons/icons";

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonContent className="ion-padding-top">
        <div className="flex flex-row items-center justify-between px-6 pt-20">
          <div>
            <div className="text-xl text-gray-400">Good morning,</div>
            <div className="text-2xl text-white">Harsh 👋</div>
          </div>
          <div className="flex flex-row items-center gap-2 rounded-xl bg-gray-600 px-4 py-1 text-xl text-white">
            <IonIcon icon={flame} className="animate-pulse text-orange-400" />
            <span>12</span>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
