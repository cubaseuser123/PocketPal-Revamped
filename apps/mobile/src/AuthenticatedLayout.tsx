import {
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
} from "@ionic/react";
import { Route, Redirect } from "react-router-dom";
import Home from "./pages/Home";
// import Goals from "./pages/Goals";
// import AI from "./pages/AI";
// import Rewards from "./pages/Rewards";
// import Profile from "./pages/Profile";
import { homeOutline, giftOutline, personOutline } from "ionicons/icons";
import { Sparkles, Target } from "lucide-react";

export function AuthenticatedLayout() {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/home" component={Home} />
        {/* <Route exact path="/goals" component={Goals} /> */}
        {/* <Route exact path="/ai" component={AI} /> */}
        {/* <Route exact path="/rewards" component={Rewards} /> */}
        {/* <Route exact path="/profile" component={Profile} /> */}
        <Route exact path="/" render={() => <Redirect to="/home" />} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom" translucent={true}>
        <IonTabButton tab="home" href="/home">
          <IonIcon icon={homeOutline} />
        </IonTabButton>
        <IonTabButton tab="goals" href="/goals">
          <Target />
        </IonTabButton>
        <IonTabButton tab="ai" href="/ai" className="ai-tab-button">
          <Sparkles />
        </IonTabButton>
        <IonTabButton tab="rewards" href="/rewards">
          <IonIcon icon={giftOutline} />
        </IonTabButton>
        <IonTabButton tab="profile" href="/profile">
          <IonIcon icon={personOutline} />
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
