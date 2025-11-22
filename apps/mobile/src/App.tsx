import React from "react";
import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { home, pieChart, trophy, person, wallet } from "ionicons/icons";

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

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/home">
            <Home />
          </Route>
          <Route exact path="/analytics"></Route>
          <Route exact path="/goals"></Route>
          <Route exact path="/rewards"></Route>
          <Route exact path="/profile"></Route>
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>

        <IonTabBar slot="bottom" translucent={true}>
          <IonTabButton tab="home" href="/home">
            <IonIcon aria-hidden="true" icon={home} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>

          <IonTabButton tab="analytics" href="/analytics">
            <IonIcon aria-hidden="true" icon={pieChart} />
            <IonLabel>Analytics</IonLabel>
          </IonTabButton>

          <IonTabButton tab="goals" href="/goals">
            <IonIcon aria-hidden="true" icon={wallet} />
            <IonLabel>Goals</IonLabel>
          </IonTabButton>

          <IonTabButton tab="rewards" href="/rewards">
            <IonIcon aria-hidden="true" icon={trophy} />
            <IonLabel>Rewards</IonLabel>
          </IonTabButton>

          <IonTabButton tab="profile" href="/profile">
            <IonIcon aria-hidden="true" icon={person} />
            <IonLabel>Profile</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  </IonApp>
);

export default App;
