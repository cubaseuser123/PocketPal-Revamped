import React from "react";
import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonIcon,
  IonContent,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import {
  homeOutline,
  sparklesOutline,
  giftOutline,
  personOutline,
} from "ionicons/icons";
import { Sparkles, Target } from "lucide-react";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "./main.css";
import "./theme/variables.css";
import "./theme/floating-tab-bar.css";
import Home from "./pages/Home";

setupIonicReact();

const Goals: React.FC = () => (
  <IonPage>
    <IonContent></IonContent>
  </IonPage>
);

const AI: React.FC = () => (
  <IonPage>
    <IonContent></IonContent>
  </IonPage>
);

const Rewards: React.FC = () => (
  <IonPage>
    <IonContent></IonContent>
  </IonPage>
);

const Profile: React.FC = () => (
  <IonPage>
    <IonContent></IonContent>
  </IonPage>
);

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/home">
            <Home />
          </Route>
          <Route exact path="/goals">
            <Goals />
          </Route>
          <Route exact path="/ai">
            <AI />
          </Route>
          <Route exact path="/rewards">
            <Rewards />
          </Route>
          <Route exact path="/profile">
            <Profile />
          </Route>
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>
        <IonTabBar slot="bottom" translucent={true}>
          <IonTabButton tab="home" href="/home">
            <IonIcon aria-hidden="true" icon={homeOutline} />
          </IonTabButton>
          <IonTabButton tab="goals" href="/goals">
            <Target />
          </IonTabButton>
          <IonTabButton tab="ai" href="/ai" className="ai-tab-button">
            <Sparkles />
          </IonTabButton>
          <IonTabButton tab="rewards" href="/rewards">
            <IonIcon aria-hidden="true" icon={giftOutline} />
          </IonTabButton>
          <IonTabButton tab="profile" href="/profile">
            <IonIcon aria-hidden="true" icon={personOutline} />
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  </IonApp>
);

export default App;
