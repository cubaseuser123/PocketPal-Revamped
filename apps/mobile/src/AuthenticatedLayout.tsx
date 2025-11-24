import React from "react";
import { Redirect, Route } from "react-router-dom";
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
} from "@ionic/react";
import { homeOutline, giftOutline, personOutline } from "ionicons/icons";
import { Target, Sparkles } from "lucide-react";
import Home from "./pages/Home";
// import Goals from "./pages/Goals";
// import AI from "./pages/AI";
// import Rewards from "./pages/Rewards";
// import Profile from "./pages/Profile";

export function AuthenticatedLayout() {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/app/home" component={Home} />

        {/* <Route exact path="/app/goals" component={Goals} /> */}
        {/* <Route exact path="/app/ai" component={AI} /> */}
        {/* <Route exact path="/app/rewards" component={Rewards} /> */}
        {/* <Route exact path="/app/profile" component={Profile} /> */}

        <Route exact path="/app">
          <Redirect to="/app/home" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" translucent={true}>
        <IonTabButton tab="home" href="/app/home">
          <IonIcon icon={homeOutline} />
        </IonTabButton>

        <IonTabButton tab="goals" href="/app/goals">
          <Target />
        </IonTabButton>

        <IonTabButton tab="ai" href="/app/ai" className="ai-tab-button">
          <Sparkles />
        </IonTabButton>

        <IonTabButton tab="rewards" href="/app/rewards">
          <IonIcon icon={giftOutline} />
        </IonTabButton>

        <IonTabButton tab="profile" href="/app/profile">
          <IonIcon icon={personOutline} />
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
