import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { useAuth } from "@repo/auth";
import { IonSpinner } from "@ionic/react";

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

export function ProtectedRoute({
  component: Component,
  ...rest
}: ProtectedRouteProps) {
  const auth = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!auth || auth.loading) {
          return (
            <div className="flex h-full w-full items-center justify-center bg-black">
              <IonSpinner name="crescent" color="primary" />
            </div>
          );
        }

        if (!auth.authenticated) {
          return <Redirect to="/login" />;
        }

        return <Component {...props} />;
      }}
    />
  );
}
