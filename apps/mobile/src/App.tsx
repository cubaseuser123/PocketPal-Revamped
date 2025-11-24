import React from "react";
import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { AuthProvider } from "@repo/auth";
import Login from "./pages/Login";
import { AuthenticatedLayout } from "./AuthenticatedLayout";
import { ProtectedRoute } from "./ProtectedRoute";

const App: React.FC = () => (
  <AuthProvider>
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login" component={Login} />
          <ProtectedRoute path="/home" component={AuthenticatedLayout} />
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  </AuthProvider>
);

export default App;
